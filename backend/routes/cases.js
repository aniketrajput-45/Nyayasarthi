import express from 'express';
import Case from '../models/Case.js';
import { verifyToken, checkRole } from '../middleware/auth.js';

const router = express.Router();

// Generate unique case number
const generateCaseNumber = async () => {
  const date = new Date();
  const year = date.getFullYear();
  const count = await Case.countDocuments();
  return `CASE-${year}-${String(count + 1).padStart(5, '0')}`;
};

// File a new case (Citizen)
router.post('/file', verifyToken, checkRole(['citizen']), async (req, res) => {
  try {
    const { title, description, type, location, incidentDate, documents } = req.body;

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
      timeline: [
        {
          date: new Date(),
          status: 'filed',
          updatedBy: req.user.userId,
          notes: 'Case filed',
        },
      ],
    });

    await newCase.save();

    res.status(201).json({
      message: 'Case filed successfully',
      case: newCase,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error filing case', error: error.message });
  }
});

// Get all cases for a user based on role
router.get('/', verifyToken, async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'citizen') {
      query.filedBy = req.user.userId;
    } else if (req.user.role === 'police') {
      query.assignedPolice = req.user.userId;
    } else if (req.user.role === 'lawyer') {
      query.assignedLawyer = req.user.userId;
    } else if (req.user.role === 'judge') {
      query.assignedJudge = req.user.userId;
    }
 const cases = await Case.find(query)
      .populate('filedBy', 'fullName email')
      .populate('assignedPolice', 'fullName email')
      .populate('assignedLawyer', 'fullName email')
      .populate('assignedJudge', 'fullName email');

    res.json(cases);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching cases', error: error.message });
  }
});

// Get case details
router.get('/:caseId', verifyToken, async (req, res) => {
  try {
    const caseData = await Case.findById(req.params.caseId)
      .populate('filedBy', 'fullName email phone')
      .populate('assignedPolice', 'fullName email badgeNumber')
      .populate('assignedLawyer', 'fullName email licenseNumber')
      .populate('assignedJudge', 'fullName email courtAssignment')
      .populate('timeline.updatedBy', 'fullName role')
      .populate('investigationNotes.addedBy', 'fullName role')
      .populate('legalNotes.addedBy', 'fullName role');

    if (!caseData) {
      return res.status(404).json({ message: 'Case not found' });
    }

    res.json(caseData);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching case', error: error.message });
  }
});

// Update case status (Police, Lawyer, Judge)
router.put('/:caseId/status', verifyToken, async (req, res) => {
  try {
    const { status, notes } = req.body;

    const caseData = await Case.findByIdAndUpdate(
      req.params.caseId,
      {
        status,
        $push: {
          timeline: {
            date: new Date(),
            status,
            updatedBy: req.user.userId,
            notes,
          },
        },
      },
      { new: true }
    );

    res.json({ message: 'Case status updated', case: caseData });
  } catch (error) {
    res.status(500).json({ message: 'Error updating case', error: error.message });
  }
});

// Add investigation notes (Police)
router.post('/:caseId/investigation-notes', verifyToken, checkRole(['police']), async (req, res) => {
  try {
    const { note } = req.body;

    const caseData = await Case.findByIdAndUpdate(
      req.params.caseId,
      {
        $push: {
          investigationNotes: {
            note,
            addedBy: req.user.userId,
          },
        },
      },
      { new: true }
    );

    res.json({ message: 'Investigation note added', case: caseData });
  } catch (error) {
    res.status(500).json({ message: 'Error adding note', error: error.message });
  }
});

// Add legal notes (Lawyer)
router.post('/:caseId/legal-notes', verifyToken, checkRole(['lawyer']), async (req, res) => {
  try {
    const { note } = req.body;

    const caseData = await Case.findByIdAndUpdate(
      req.params.caseId,
      {
        $push: {
          legalNotes: {
            note,
            addedBy: req.user.userId,
          },
        },
      },
      { new: true }
    );

    res.json({ message: 'Legal note added', case: caseData });
  } catch (error) {
    res.status(500).json({ message: 'Error adding note', error: error.message });
  }
});

// Enter judgment (Judge)
router.post('/:caseId/judgment', verifyToken, checkRole(['judge']), async (req, res) => {
  try {
    const { verdict, reasoning, sentence } = req.body;

    const caseData = await Case.findByIdAndUpdate(
      req.params.caseId,
      {
        judgment: {
          verdict,
          reasoning,
          sentence,
          givenBy: req.user.userId,
          givenAt: new Date(),
        },
        status: 'resolved',
      },
      { new: true }
    );

    res.json({ message: 'Judgment entered', case: caseData });
  } catch (error) {
    res.status(500).json({ message: 'Error entering judgment', error: error.message });
  }
});

// Assign professionals to case (Judge)
router.put('/:caseId/assign', verifyToken, checkRole(['judge']), async (req, res) => {
  try {
    const { assignedPolice, assignedLawyer, assignedJudge } = req.body;

    const caseData = await Case.findByIdAndUpdate(
      req.params.caseId,
      {
        assignedPolice,
        assignedLawyer,
        assignedJudge,
      },
      { new: true }
    );

    res.json({ message: 'Professionals assigned', case: caseData });
  } catch (error) {
    res.status(500).json({ message: 'Error assigning professionals', error: error.message });
  }
});

export default router;
