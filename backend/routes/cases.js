import express from 'express';
import Case from '../models/Case.js';
import User from '../models/User.js';
import { verifyToken, checkRole } from '../middleware/auth.js';

const router = express.Router();

// Helper to generate Case ID
const generateCaseNumber = async () => {
  const count = await Case.countDocuments();
  const year = new Date().getFullYear();
  return `CASE-${year}-${(count + 1).toString().padStart(3, '0')}`;
};

// 1. File a new case (Citizen) -> STARTS AS "PENDING LAWYER"
router.post('/file', verifyToken, checkRole(['citizen']), async (req, res) => {
  try {
    const { 
      title, description, type, location, incidentDate, 
      documents, isProBono, isAnonymous, shareWithLegalAid 
    } = req.body;

    const caseNumber = await generateCaseNumber();

    // Initial Deadline (Will be reset when Lawyer submits to court)
    const timelineRules = {
      civil: 90,
      criminal: 60,
      cyber: 45,
      corporate: 120
    };
    
    const daysToSolve = timelineRules[type] || 60; 
    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + daysToSolve);

    const newCase = new Case({
      caseNumber,
      title,
      description,
      type,
      filedBy: req.user.userId,
      location,
      incidentDate,
      documents: documents || [],
      
      // STATUS STARTS AS PENDING (Hidden from Judge)
      status: 'pending_lawyer', 
      
      isProBono: isProBono || false,
      isAnonymous: isAnonymous || false,
      shareWithLegalAid: shareWithLegalAid || false,
      deadlineDate, 

      timeline: [{
        date: new Date(),
        status: 'pending_lawyer',
        updatedBy: req.user.userId,
        notes: 'Case draft created, waiting for lawyer review'
      }]
    });

    await newCase.save();
    res.status(201).json({ message: 'Case draft filed successfully', case: newCase });
  } catch (error) {
    res.status(500).json({ message: 'Error filing case', error: error.message });
  }
});

// 2. Get All Cases -> JUDGE ONLY SEES "FILED" CASES
router.get('/', verifyToken, async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'citizen') {
      query.filedBy = req.user.userId;
    } else if (req.user.role === 'police') {
      query.assignedPolice = req.user.userId;
    } else if (req.user.role === 'lawyer') {
      query.$or = [
        { assignedLawyer: req.user.userId },
        { assignedLawyer: { $exists: false } }, // See unassigned
        { assignedLawyer: null }
      ];
    } else if (req.user.role === 'judge') {
      // JUDGE FILTER: Only show cases that are formally filed
      query.status = { $in: ['filed', 'under-investigation', 'in-court', 'resolved'] };
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

// 3. Get Single Case
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
    
    if (caseItem.status === 'filed') caseItem.status = 'under-investigation';

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

// 5. Claim Case (Lawyer) -> CRITICAL FIX: PRESERVE 'PENDING_LAWYER' STATUS
router.put('/:caseId/claim-lawyer', verifyToken, checkRole(['lawyer']), async (req, res) => {
  try {
    const caseData = await Case.findById(req.params.caseId);
    if (!caseData) return res.status(404).json({ message: 'Case not found' });

    // Assign the Lawyer
    caseData.assignedLawyer = req.user.userId;
    
    // FORCE STATUS TO STAY 'pending_lawyer' 
    // This ensures it stays in the "My Drafts" (Yellow Card) section
    if (caseData.status === 'pending_lawyer') {
        caseData.status = 'pending_lawyer'; 
    }

    caseData.timeline.push({
      date: new Date(),
      status: 'pending_lawyer', // Log as draft review
      updatedBy: req.user.userId,
      notes: 'Lawyer accepted case for pre-filing review',
    });

    await caseData.save();
    res.json({ message: 'Case accepted', case: caseData });
  } catch (error) {
    res.status(500).json({ message: 'Error claiming case', error: error.message });
  }
});

// 6. Claim Case (Police)
router.put('/:caseId/claim', verifyToken, checkRole(['police']), async (req, res) => {
  try {
    const caseData = await Case.findById(req.params.caseId);
    if (!caseData) return res.status(404).json({ message: 'Case not found' });

    caseData.assignedPolice = req.user.userId;
    caseData.status = 'under-investigation';
    caseData.timeline.push({
      date: new Date(),
      status: 'under-investigation',
      updatedBy: req.user.userId,
      notes: 'Case accepted by police officer',
    });

    await caseData.save();
    res.json({ message: 'Case claimed', case: caseData });
  } catch (error) {
    res.status(500).json({ message: 'Error claiming case', error: error.message });
  }
});

// 7. Add Hearing (Lawyer/Judge)
router.post('/:id/hearings', verifyToken, async (req, res) => {
  try {
    const { date, title, location, notes } = req.body;
    const caseItem = await Case.findById(req.params.id);

    if (!caseItem) return res.status(404).json({ message: 'Case not found' });

    caseItem.hearings.push({ date, title, location, notes });
    caseItem.timeline.push({
      date: new Date(),
      status: 'hearing-scheduled',
      updatedBy: req.user.userId,
      notes: `Hearing scheduled: ${title}`
    });

    await caseItem.save();
    res.json(caseItem);
  } catch (error) {
    res.status(500).json({ message: 'Error scheduling hearing', error: error.message });
  }
});

// 8. Submit to Court (Lawyer) -> ACTIVATES THE TIMER
router.put('/:id/submit-to-court', verifyToken, checkRole(['lawyer']), async (req, res) => {
  try {
    const caseItem = await Case.findById(req.params.id);
    if (!caseItem) return res.status(404).json({ message: 'Case not found' });
    
    // 1. Change Status to 'filed' (Now Visible to Judge)
    caseItem.status = 'filed';
    
    // 2. Start the Statutory Timer NOW (BNSS Logic)
    const timelineRules = { civil: 90, criminal: 60, cyber: 45, corporate: 120 };
    const daysToSolve = timelineRules[caseItem.type] || 60;
    
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + daysToSolve);
    caseItem.deadlineDate = deadline;

    // 3. Add to Timeline
    caseItem.timeline.push({
      date: new Date(),
      status: 'filed',
      updatedBy: req.user.userId,
      notes: 'Lawyer verified and submitted case to Court Registry'
    });

    await caseItem.save();
    res.json({ message: 'Case submitted to Judge successfully', case: caseItem });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting case', error: error.message });
  }
});

export default router;