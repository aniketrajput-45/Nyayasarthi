import express from 'express';
import mongoose from 'mongoose';
import LegalNotice from '../models/LegalNotice.js';
import { verifyToken, checkRole } from '../middleware/auth.js';

const router = express.Router();

// Helper to generate notice number (used before creating document)
const generateNoticeNumber = async () => {
  const count = await LegalNotice.countDocuments();
  const year = new Date().getFullYear();
  return `NOTICE-${year}-${(count + 1).toString().padStart(4, '0')}`;
};

// 1. File a new legal notice (Judge, Lawyer, Police)
router.post('/file', verifyToken, checkRole(['judge', 'lawyer', 'police']), async (req, res) => {
  try {
    const {
      noticeType,
      urgency,
      subject,
      caseNumber,
      incidentTitle,
      caseType,
      location,
      dateOfIncident,
      description,
      noticeDate,
      issuerName,
    } = req.body;

    // Validate required fields
    if (!subject || !incidentTitle || !caseType || !location || !dateOfIncident || !description) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Always use JWT user for issuer (do not trust body for security)
    const issuerId = req.user.userId || req.user._id;
    if (!issuerId) {
      return res.status(401).json({ message: 'User not identified' });
    }
    const issuerNameValue = (typeof issuerName === 'string' && issuerName.trim()) ? issuerName.trim() : 'Authorized Issuer';
    const issuerRole = req.user.role;

    const noticeDateObj = noticeDate ? new Date(noticeDate) : new Date();
    const dateOfIncidentObj = new Date(dateOfIncident);
    if (isNaN(dateOfIncidentObj.getTime())) {
      return res.status(400).json({ message: 'Invalid date of incident' });
    }

    const noticeNumber = await generateNoticeNumber();

    const newNotice = new LegalNotice({
      noticeNumber,
      noticeType: noticeType || 'other',
      urgency: urgency || 'normal',
      subject,
      caseNumber: (typeof caseNumber === 'string' && caseNumber.trim()) ? caseNumber.trim() : '',
      incidentTitle,
      caseType,
      location,
      dateOfIncident: dateOfIncidentObj,
      description,
      noticeDate: noticeDateObj,
      issuedBy: issuerId,
      issuerRole,
      issuerName: issuerNameValue,
      status: 'issued',
    });

    await newNotice.save();
    
    res.status(201).json({
      message: 'Legal notice issued successfully',
      notice: newNotice,
      noticeNumber: newNotice.noticeNumber,
      _id: newNotice._id,
    });
  } catch (error) {
    console.error('Error filing legal notice:', error);
    const isValidation = error.name === 'ValidationError';
    const isCast = error.name === 'CastError';
    let message = 'Error issuing legal notice. Please try again.';
    if (isValidation && error.errors) {
      message = Object.values(error.errors).map(e => e.message).join(', ');
    } else if (isValidation || isCast) {
      message = error.message || message;
    } else if (error.message) {
      message = error.message;
    }
    res.status(isValidation || isCast ? 400 : 500).json({ message, error: error.message });
  }
});

// 2. Get all legal notices (filtered by role)
router.get('/', verifyToken, checkRole(['judge', 'lawyer', 'police']), async (req, res) => {
  try {
    let query = {};
    
    // Filter by issuer if not admin
    if (req.user.role !== 'judge') {
      query.issuedBy = req.user.userId;
    }
    
    const notices = await LegalNotice.find(query)
      .populate('issuedBy', 'fullName email')
      .sort({ createdAt: -1 });
    
    res.json(notices);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching legal notices', error: error.message });
  }
});

// Normalize case number for matching (trim, uppercase, collapse spaces)
const normalizeCaseNum = (s) => (s || '').trim().toUpperCase().replace(/\s+/g, ' ');

// 2b. Get matching legal notices for citizens (by case number only)
router.get('/citizen/matching', verifyToken, checkRole(['citizen']), async (req, res) => {
  try {
    const Case = (await import('../models/Case.js')).default;
    const userId = req.user.userId || req.user._id;
    if (!userId) {
      return res.json([]);
    }
    const filedBy = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;
    const citizenCases = await Case.find({ filedBy })
      .select('caseNumber')
      .lean();
    
    if (citizenCases.length === 0) {
      return res.json([]);
    }
    
    const caseNumberSet = new Set(
      citizenCases.map(c => normalizeCaseNum(c && c.caseNumber)).filter(Boolean)
    );
    
    if (caseNumberSet.size === 0) {
      return res.json([]);
    }
    
    const allNotices = await LegalNotice.find({
      status: { $in: ['issued', 'delivered'] }
    })
      .populate('issuedBy', 'fullName email role')
      .sort({ createdAt: -1 })
      .lean();
    
    const notices = allNotices.filter(n => {
      const nc = normalizeCaseNum(n && n.caseNumber);
      return nc && caseNumberSet.has(nc);
    });
    
    res.json(notices);
  } catch (error) {
    console.error('Error fetching matching legal notices:', error);
    res.status(500).json({ message: 'Error fetching matching legal notices', error: error.message });
  }
});

// 3. Get single legal notice
router.get('/:id', verifyToken, checkRole(['judge', 'lawyer', 'police']), async (req, res) => {
  try {
    const notice = await LegalNotice.findById(req.params.id)
      .populate('issuedBy', 'fullName email');
    
    if (!notice) {
      return res.status(404).json({ message: 'Legal notice not found' });
    }
    
    // Check if user has permission to view this notice
    if (req.user.role !== 'judge' && notice.issuedBy._id.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized to view this notice' });
    }
    
    res.json(notice);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching legal notice', error: error.message });
  }
});

// 4. Update legal notice status
router.put('/:id/status', verifyToken, checkRole(['judge', 'lawyer', 'police']), async (req, res) => {
  try {
    const { status, notes } = req.body;
    const notice = await LegalNotice.findById(req.params.id);
    
    if (!notice) {
      return res.status(404).json({ message: 'Legal notice not found' });
    }
    
    // Check permission
    if (req.user.role !== 'judge' && notice.issuedBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized to update this notice' });
    }
    
    notice.status = status || notice.status;
    
    if (notes) {
      notice.timeline.push({
        date: new Date(),
        status: notice.status,
        notes,
        updatedBy: req.user.userId,
      });
    }
    
    await notice.save();
    res.json({ message: 'Notice status updated', notice });
  } catch (error) {
    res.status(500).json({ message: 'Error updating notice status', error: error.message });
  }
});

// 5. Record response to legal notice
router.put('/:id/response', verifyToken, checkRole(['judge', 'lawyer', 'police']), async (req, res) => {
  try {
    const { responseDetails } = req.body;
    const notice = await LegalNotice.findById(req.params.id);
    
    if (!notice) {
      return res.status(404).json({ message: 'Legal notice not found' });
    }
    
    notice.responseReceived = true;
    notice.responseDate = new Date();
    notice.responseDetails = responseDetails || '';
    notice.status = 'responded';
    
    notice.timeline.push({
      date: new Date(),
      status: 'responded',
      notes: `Response received: ${responseDetails || 'No details provided'}`,
      updatedBy: req.user.userId,
    });
    
    await notice.save();
    res.json({ message: 'Response recorded', notice });
  } catch (error) {
    res.status(500).json({ message: 'Error recording response', error: error.message });
  }
});

export default router;
