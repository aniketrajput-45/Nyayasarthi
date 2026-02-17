import express from 'express';
import LegalNotice from '../models/LegalNotice.js';
import Case from '../models/Case.js';
import User from '../models/User.js';
import { verifyToken, checkRole } from '../middleware/auth.js';

const router = express.Router();

// POST /file — Issue legal notice (judge, lawyer, police)
router.post('/file', verifyToken, checkRole(['judge', 'lawyer', 'police']), async (req, res) => {
  try {
    const {
      noticeType, urgency, subject, caseNumber, incidentTitle, caseType,
      location, dateOfIncident, description, noticeDate
    } = req.body;

    let issuerName = req.body.issuerName;
    if (!issuerName) {
      const u = await User.findById(req.user.userId).select('fullName').lean();
      issuerName = u?.fullName || 'Issuer';
    }

    const notice = new LegalNotice({
      noticeType: noticeType || 'other',
      urgency: urgency || 'normal',
      subject: subject || 'Legal Notice',
      caseNumber: caseNumber || '',
      incidentTitle: incidentTitle || subject || 'Legal Notice',
      caseType: caseType || 'other',
      location: location || '',
      dateOfIncident: dateOfIncident ? new Date(dateOfIncident) : new Date(),
      description: description || '',
      noticeDate: noticeDate ? new Date(noticeDate) : new Date(),
      issuedBy: req.user.userId,
      issuerRole: req.user.role,
      issuerName,
    });

    await notice.save();
    res.status(201).json({
      _id: notice._id,
      noticeNumber: notice.noticeNumber,
      caseNumber: notice.caseNumber,
      message: 'Legal notice issued successfully',
    });
  } catch (err) {
    console.error('Error issuing legal notice:', err);
    res.status(500).json({
      message: err.message || 'Error issuing legal notice',
    });
  }
});

// GET /lawyer/for-assigned-cases — Notices for cases assigned to this lawyer
router.get('/lawyer/for-assigned-cases', verifyToken, checkRole(['lawyer']), async (req, res) => {
  try {
    const assignedCases = await Case.find({ assignedLawyer: req.user.userId })
      .select('caseNumber')
      .lean();
    const caseNumbers = assignedCases.map((c) => c.caseNumber).filter(Boolean);
    if (caseNumbers.length === 0) {
      return res.json([]);
    }
    const notices = await LegalNotice.find({ caseNumber: { $in: caseNumbers } })
      .sort({ createdAt: -1 })
      .lean();
    res.json(notices);
  } catch (err) {
    console.error('Error fetching lawyer legal notices:', err);
    res.status(500).json({ message: err.message || 'Error fetching notices' });
  }
});

// GET /citizen/matching — Notices matching citizen's cases (by case number)
router.get('/citizen/matching', verifyToken, checkRole(['citizen']), async (req, res) => {
  try {
    const citizenCases = await Case.find({ filedBy: req.user.userId })
      .select('caseNumber')
      .lean();
    const caseNumbers = citizenCases.map((c) => c.caseNumber).filter(Boolean);
    if (caseNumbers.length === 0) {
      return res.json([]);
    }
    const notices = await LegalNotice.find({ caseNumber: { $in: caseNumbers } })
      .sort({ createdAt: -1 })
      .lean();
    res.json(notices);
  } catch (err) {
    console.error('Error fetching citizen matching notices:', err);
    res.status(500).json({ message: err.message || 'Error fetching notices' });
  }
});

// GET / — List notices issued by current user (judge/lawyer/police)
router.get('/', verifyToken, checkRole(['judge', 'lawyer', 'police']), async (req, res) => {
  try {
    const notices = await LegalNotice.find({ issuedBy: req.user.userId })
      .sort({ createdAt: -1 })
      .lean();
    res.json(notices);
  } catch (err) {
    console.error('Error listing legal notices:', err);
    res.status(500).json({ message: err.message || 'Error listing notices' });
  }
});

export default router;
