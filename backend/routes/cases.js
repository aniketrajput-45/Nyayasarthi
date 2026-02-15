import express from 'express';
import Case from '../models/Case.js';
import User from '../models/User.js';
import { verifyToken, checkRole } from '../middleware/auth.js';

const router = express.Router();

// Helper to generate Case ID (e.g., CASE-2024-001)
const generateCaseNumber = async () => {
  const count = await Case.countDocuments();
  const year = new Date().getFullYear();
  return `CASE-${year}-${(count + 1).toString().padStart(3, '0')}`;
};

// 1. File a new case (Citizen)
router.post('/file', verifyToken, checkRole(['citizen']), async (req, res) => {
  try {
    const { title, description, type, location, incidentDate, documents, isProBono } = req.body;
    const caseNumber = await generateCaseNumber();

    const newCase = new Case({
      caseNumber,
      title,
      description,
      type,
      filedBy: req.user.userId,
      location,
      incidentDate,
      documents: documents || [],
      isProBono: isProBono || false,
      timeline: [{
        date: new Date(),
        status: 'filed',
        updatedBy: req.user.userId,
        notes: 'Case filed'
      }]
    });

    await newCase.save();
    res.status(201).json({ message: 'Case filed successfully', case: newCase });
  } catch (error) {
    res.status(500).json({ message: 'Error filing case', error: error.message });
  }
});

// 2. Get All Cases (With Logic for Roles)
router.get('/', verifyToken, async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'citizen') {
      // Citizens only see their own cases
      query.filedBy = req.user.userId;

    } else if (req.user.role === 'police') {
      // Police ONLY see cases assigned to them
      query.assignedPolice = req.user.userId;

    } else if (req.user.role === 'lawyer') {
      // Lawyers see: Their cases OR Unassigned Pro Bono cases
      query.$or = [
        { assignedLawyer: req.user.userId },
        { assignedLawyer: { $exists: false } },
        { assignedLawyer: null }
      ];

    } else if (req.user.role === 'judge') {
      // Judges see EVERYTHING
      query = {};
    }

    const cases = await Case.find(query)
      .populate('filedBy', 'fullName email')
      .populate('assignedPolice', 'fullName email')
      .populate('assignedLawyer', 'fullName email')
      .populate('assignedJudge', 'fullName email')
      .sort({ createdAt: -1 });

    res.json(cases);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching cases', error: error.message });
  }
});

// 3. Get Single Case by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const caseItem = await Case.findById(req.params.id)
      .populate('filedBy', 'fullName email')
      .populate('assignedPolice', 'fullName email')
      .populate('assignedLawyer', 'fullName email')
      .populate('assignedJudge', 'fullName email');
      
    if (!caseItem) return res.status(404).json({ message: 'Case not found' });
    res.json(caseItem);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching case', error: error.message });
  }
});

// 4. Assign Professionals (Judge Only)
router.put('/:id/assign', verifyToken, checkRole(['judge']), async (req, res) => {
  try {
    const { assignedPolice, assignedLawyer } = req.body;
    const caseItem = await Case.findById(req.params.id);
    
    if (!caseItem) return res.status(404).json({ message: 'Case not found' });

    if (assignedPolice) caseItem.assignedPolice = assignedPolice;
    if (assignedLawyer) caseItem.assignedLawyer = assignedLawyer;
    
    // Auto-update status if assigned
    if (caseItem.status === 'filed') {
      caseItem.status = 'under-investigation';
    }

    caseItem.timeline.push({
      date: new Date(),
      status: 'under-investigation',
      updatedBy: req.user.userId,
      notes: 'Judge assigned professionals'
    });

    await caseItem.save();
    res.json({ message: 'Assigned successfully', case: caseItem });
  } catch (error) {
    res.status(500).json({ message: 'Error assigning case', error: error.message });
  }
});

// 5. Claim Case (Lawyer - For Pro Bono)
router.put('/:caseId/claim-lawyer', verifyToken, checkRole(['lawyer']), async (req, res) => {
  try {
    const caseData = await Case.findById(req.params.caseId);
    if (!caseData) return res.status(404).json({ message: 'Case not found' });
    if (caseData.assignedLawyer) return res.status(400).json({ message: 'Already has a lawyer' });

    caseData.assignedLawyer = req.user.userId;
    caseData.timeline.push({
      date: new Date(),
      status: 'In Legal Review',
      updatedBy: req.user.userId,
      notes: 'Lawyer accepted the case',
    });

    await caseData.save();
    res.json({ message: 'Case accepted', case: caseData });
  } catch (error) {
    res.status(500).json({ message: 'Error claiming case', error: error.message });
  }
});

// 6. Claim Case (Police - Self Assign)
router.put('/:caseId/claim', verifyToken, checkRole(['police']), async (req, res) => {
  try {
    const caseData = await Case.findById(req.params.caseId);
    if (!caseData) return res.status(404).json({ message: 'Case not found' });
    if (caseData.assignedPolice) return res.status(400).json({ message: 'Case already assigned' });

    caseData.assignedPolice = req.user.userId;
    caseData.status = 'under-investigation';
    
    caseData.timeline.push({
      date: new Date(),
      status: 'under-investigation',
      updatedBy: req.user.userId,
      notes: 'Case accepted by police officer',
    });

    await caseData.save();
    res.json({ message: 'Case claimed successfully', case: caseData });
  } catch (error) {
    res.status(500).json({ message: 'Error claiming case', error: error.message });
  }
});

// Add a Hearing to a Case (Lawyer/Judge)
router.post('/:id/hearings', verifyToken, async (req, res) => {
  try {
    const { date, title, location, notes } = req.body;
    const caseItem = await Case.findById(req.params.id);

    if (!caseItem) return res.status(404).json({ message: 'Case not found' });

    // Add hearing to the array
    caseItem.hearings.push({ date, title, location, notes });
    
    // Optional: Also update timeline
    caseItem.timeline.push({
      date: new Date(),
      status: 'hearing-scheduled',
      updatedBy: req.user.userId,
      notes: `Hearing scheduled: ${title} on ${new Date(date).toLocaleDateString()}`
    });

    await caseItem.save();
    res.json(caseItem);
  } catch (error) {
    res.status(500).json({ message: 'Error scheduling hearing', error: error.message });
  }
});

export default router;