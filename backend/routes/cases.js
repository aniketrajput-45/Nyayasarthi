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

// 2. Get All Cases
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
        { assignedLawyer: { $exists: false } },
        { assignedLawyer: null }
      ];
    } else if (req.user.role === 'judge') {
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

// 5. Claim Case (Lawyer) -> FIXED TO RESOLVE 500 ERROR
router.put('/:caseId/claim-lawyer', verifyToken, checkRole(['lawyer']), async (req, res) => {
  try {
    console.log("Processing claim for Case ID:", req.params.caseId);

    // Using findById with the correct parameter name from the URL
    const caseData = await Case.findById(req.params.caseId);
    
    if (!caseData) {
      return res.status(404).json({ message: 'Case not found in database' });
    }

    // Update assignment and status
    caseData.assignedLawyer = req.user.userId;
    caseData.status = 'pending_lawyer'; 

    caseData.timeline.push({
      date: new Date(),
      status: 'In Legal Review',
      updatedBy: req.user.userId,
      notes: 'Lawyer accepted the case',
    });

    await caseData.save();
    console.log("Case successfully claimed by Lawyer:", req.user.userId);
    res.json({ message: 'Case accepted successfully', case: caseData });
  } catch (error) {
    console.error("Internal Server Error in claim-lawyer:", error);
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

// 8. Submit to Court (Lawyer)
router.put('/:id/submit-to-court', verifyToken, checkRole(['lawyer']), async (req, res) => {
  try {
    const caseItem = await Case.findById(req.params.id);
    if (!caseItem) return res.status(404).json({ message: 'Case not found' });
    
    caseItem.status = 'filed';
    
    const timelineRules = { civil: 90, criminal: 60, cyber: 45, corporate: 120 };
    const daysToSolve = timelineRules[caseItem.type] || 60;
    
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + daysToSolve);
    caseItem.deadlineDate = deadline;

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