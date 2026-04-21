import express from 'express';
import crypto from 'crypto';
import Case from '../models/Case.js';
import User from '../models/User.js';
import { verifyToken, checkRole } from '../middleware/auth.js';
import Notification from '../models/Notification.js';
import { notifyAllParties } from '../utils/notificationSystem.js';

const router = express.Router();

// Helper to generate hash
const generateHash = (data) => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

// Helper to generate Case ID
const generateCaseNumber = async () => {
  const count = await Case.countDocuments();
  const year = new Date().getFullYear();
  return `CASE-${year}-${(count + 1).toString().padStart(3, '0')}`;
};

// Helper function for Haversine Distance
function getDistanceInKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity; // Return infinity if missing GPS
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 1. File a new case (Citizen) -> AUTO-ROUTES TO NEAREST POLICE & JUDGE
router.post('/file', verifyToken, checkRole(['citizen']), async (req, res) => {
  try {
    const { 
      title, description, type, location, incidentDate, 
      documents, isProBono, isAnonymous, shareWithLegalAid,
      bnsSection, aiSuggestedEvidence,
      selectedLawyerId, 
      lat, lng // <-- ADDED: Accept live GPS coordinates from the frontend form
    } = req.body;

    // 1. Get the Citizen filing the case
    const citizen = await User.findById(req.user.userId);
    
    // SMART ROUTING: Use Form GPS first. If missing, fallback to Registered Profile GPS.
    const routingLat = lat || citizen.lat;
    const routingLng = lng || citizen.lng;

    // 2. Find ALL Police and Judges
    const allPolice = await User.find({ role: 'police' });
    const allJudges = await User.find({ role: 'judge' });

    // 3. Calculate the nearest Police Station
    let nearestPolice = null;
    let shortestPoliceDist = Infinity;
    
    if (routingLat && routingLng) {
      allPolice.forEach(officer => {
        const dist = getDistanceInKm(routingLat, routingLng, officer.lat, officer.lng);
        if (dist < shortestPoliceDist) {
          shortestPoliceDist = dist;
          nearestPolice = officer;
        }
      });
    } else if (allPolice.length > 0) {
      // Fallback if absolutely no GPS exists
      nearestPolice = allPolice[0]; 
    }

    // 4. Calculate the nearest Court (Judge)
    let nearestJudge = null;
    let shortestJudgeDist = Infinity;

    if (routingLat && routingLng) {
      allJudges.forEach(judge => {
        const dist = getDistanceInKm(routingLat, routingLng, judge.lat, judge.lng);
        if (dist < shortestJudgeDist) {
          shortestJudgeDist = dist;
          nearestJudge = judge;
        }
      });
    } else if (allJudges.length > 0) {
      nearestJudge = allJudges[0];
    }

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
      location: location || citizen.address || "Unknown Location",
      incidentDate,
      documents: documents || [],
      
      // AUTO-ASSIGNMENT LOGIC
      assignedPolice: nearestPolice ? nearestPolice._id : null,
      assignedJudge: nearestJudge ? nearestJudge._id : null,
      assignedLawyer: selectedLawyerId || null,
      status: selectedLawyerId ? 'pending_lawyer' : 'filed', 
      
      isProBono: isProBono || false,
      isAnonymous: isAnonymous || false,
      shareWithLegalAid: shareWithLegalAid || false,
      deadlineDate, 

      bnsSection: bnsSection || null,
      aiSuggestedEvidence: aiSuggestedEvidence || [],

      timeline: [{
        date: new Date(),
        status: selectedLawyerId ? 'pending_lawyer' : 'filed',
        updatedBy: req.user.userId,
        notes: `Case filed and automatically routed to nearest jurisdiction based on GPS.`
      }]
    });

    await newCase.save();

    // 5. Send Notifications to assigned parties
    const notifications = [];
    if (nearestPolice) notifications.push({ recipient: nearestPolice._id, message: `New case #${newCase.caseNumber} routed to your station based on jurisdiction.`, type: 'case' });
    if (nearestJudge) notifications.push({ recipient: nearestJudge._id, message: `New case #${newCase.caseNumber} routed to your court.`, type: 'case' });
    if (selectedLawyerId) notifications.push({ recipient: selectedLawyerId, message: `Citizen requested your representation for case #${newCase.caseNumber}.`, type: 'case' });

    if(notifications.length > 0) await Notification.insertMany(notifications);

    res.status(201).json({ message: 'Case auto-routed successfully', case: newCase });
  } catch (error) {
    res.status(500).json({ message: 'Error filing case', error: error.message });
  }
});

// Route for officials to verify uploaded evidence
router.put('/:id/verify-evidence', verifyToken, checkRole(['lawyer', 'police']), async (req, res) => {
  try {
    const { documentId, status } = req.body; 
    const caseItem = await Case.findById(req.params.id);

    if (!caseItem) return res.status(404).json({ message: 'Case not found' });

    const doc = caseItem.documents.id(documentId);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    doc.verificationStatus = status;
    doc.verifiedAt = status === 'verified' ? new Date() : null;

    caseItem.timeline.push({
      date: new Date(),
      status: caseItem.status,
      updatedBy: req.user.userId,
      notes: `Evidence "${doc.fileName}" was ${status} by ${req.user.role}`
    });

    await caseItem.save();
    res.json({ message: `Evidence marked as ${status}`, case: caseItem });
  } catch (error) {
    res.status(500).json({ message: 'Error verifying evidence', error: error.message });
  }
});

// 2. Get All Cases
router.get('/', verifyToken, async (req, res) => {
  try {
    let query = {};
    const acceptedOnly = req.query.acceptedOnly === 'true';

    if (req.user.role === 'citizen') {
      query.filedBy = req.user.userId;
    } else if (req.user.role === 'police') {
      query.status = { $in: ['filed', 'under-investigation', 'in-court', 'resolved', 'pending_lawyer'] };
    } else if (req.user.role === 'lawyer') {
      const lawyer = await User.findById(req.user.userId);
      const specialization = lawyer.specialization || 'general';

      if (req.query.marketplace === 'true') {
        // Marketplace logic: 
        // 1. Match lawyer's specialization OR 'general'
        // 2. Not already assigned to anyone
        // 3. Not already in lawyer's interested list
        query = {
          assignedLawyer: { $exists: false },
          $or: [
            { type: specialization },
            { type: 'other' },
            { type: 'civil' } // Lawyers can see civil cases too as baseline
          ],
          interestedLawyers: { $ne: req.user.userId },
          status: 'pending_lawyer'
        };
      } else if (acceptedOnly) {
        query.assignedLawyer = req.user.userId;
      } else {
        query.$or = [
          { assignedLawyer: req.user.userId },
          { filedBy: req.user.userId }
        ];
      }
    } else if (req.user.role === 'judge') {
      query.status = { $in: ['filed', 'under-investigation', 'in-court', 'resolved'] };
    }

    const cases = await Case.find(query)
      .populate('filedBy', 'fullName email')
      .populate('assignedPolice', 'fullName email')
      .populate('assignedLawyer', 'fullName email phone specialization')
      .populate('interestedLawyers', 'fullName email phone specialization licenseNumber')
      .populate('assignedJudge', 'fullName email')
      .sort({ createdAt: -1 });

    res.json(cases);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching cases', error: error.message });
  }
});

// NEW: Express Interest (Lawyer)
router.put('/:id/interest', verifyToken, checkRole(['lawyer']), async (req, res) => {
  try {
    const caseItem = await Case.findById(req.params.id);
    if (!caseItem) return res.status(404).json({ message: 'Case not found' });
    if (caseItem.assignedLawyer) return res.status(400).json({ message: 'Lawyer already assigned' });

    if (!caseItem.interestedLawyers.includes(req.user.userId)) {
      caseItem.interestedLawyers.push(req.user.userId);
      await caseItem.save();
      
      // Notify Citizen
      const citizen = await User.findById(caseItem.filedBy);
      const lawyer = await User.findById(req.user.userId);
      
      const newNotification = new Notification({
        recipient: citizen._id,
        message: `⚖️ STRATEGIC SIGNAL: Advocate ${lawyer.fullName} has expressed interest in representing your case #${caseItem.caseNumber}.`,
        type: 'info'
      });
      await newNotification.save();
    }

    res.json({ message: 'Interest expressed successfully', case: caseItem });
  } catch (error) {
    res.status(500).json({ message: 'Error expressing interest', error: error.message });
  }
});

// NEW: Appoint Lawyer (Citizen)
router.put('/:id/appoint-lawyer', verifyToken, checkRole(['citizen']), async (req, res) => {
  try {
    const { lawyerId } = req.body;
    const caseItem = await Case.findById(req.params.id);
    if (!caseItem) return res.status(404).json({ message: 'Case not found' });
    
    // Authorization check
    if (caseItem.filedBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const otherLawyers = caseItem.interestedLawyers.filter(id => id.toString() !== lawyerId);
    
    caseItem.assignedLawyer = lawyerId;
    caseItem.interestedLawyers = []; // Clear the list
    caseItem.status = 'pending_lawyer'; 

    caseItem.timeline.push({
      date: new Date(),
      status: 'Advocate Appointed',
      updatedBy: req.user.userId,
      notes: `Citizen selected their preferred legal counsel.`
    });

    await caseItem.save();

    // Notify Selected Lawyer
    const selectedLawyer = await User.findById(lawyerId);
    await new Notification({
      recipient: selectedLawyer._id,
      message: `🎉 MANDATE GRANTED: You have been appointed as the lead counsel for Case #${caseItem.caseNumber}.`,
      type: 'success'
    }).save();

    // Notify Other Lawyers (Rejection Signal)
    for (const lId of otherLawyers) {
      await new Notification({
        recipient: lId,
        message: `⚖️ SYSTEM UPDATE: Another advocate has been appointed for Case #${caseItem.caseNumber}. Your interest node has been closed.`,
        type: 'info'
      }).save();
    }

    res.json({ message: 'Advocate appointed successfully', case: caseItem });
  } catch (error) {
    res.status(500).json({ message: 'Error appointing lawyer', error: error.message });
  }
});

// 3. Get Single Case
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const caseItem = await Case.findById(req.params.id)
      .populate('filedBy', 'fullName email')
      .populate('assignedPolice', 'fullName email')
      .populate('assignedLawyer', 'fullName email phone specialization')
      .populate('interestedLawyers', 'fullName email phone specialization licenseNumber')
      .populate('assignedJudge', 'fullName email');
      
    if (!caseItem) return res.status(404).json({ message: 'Case not found' });

    // --- STRATEGIC ACCESS CONTROL ---
    const isOwner = caseItem.filedBy._id.toString() === req.user.userId;
    const isAssignedPolice = caseItem.assignedPolice?._id.toString() === req.user.userId;
    const isAssignedLawyer = caseItem.assignedLawyer?._id.toString() === req.user.userId;
    const isOfficial = ['police', 'judge'].includes(req.user.role);

    if (req.user.role === 'lawyer' && !isAssignedLawyer && !isOwner) {
      const lawyer = await User.findById(req.user.userId);
      const canViewMarketplace = (caseItem.type === lawyer.specialization || caseItem.type === 'civil' || lawyer.specialization === 'general') && !caseItem.assignedLawyer;
      
      if (!canViewMarketplace) {
        return res.status(403).json({ message: 'Unauthorized access to this legal node' });
      }
    } else if (req.user.role === 'citizen' && !isOwner) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }
    // --------------------------------

    res.json(caseItem);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching case', error: error.message });
  }
});

// 4. Assign Professionals
router.put('/:id/assign', verifyToken, checkRole(['judge']), async (req, res) => {
  try {
    const { assignedPolice, assignedLawyer } = req.body;
    const caseItem = await Case.findById(req.params.id); 
    
    if (!caseItem) return res.status(404).json({ message: 'Case not found' });

    if (assignedPolice) caseItem.assignedPolice = assignedPolice;
    if (assignedLawyer) caseItem.assignedLawyer = assignedLawyer;
    if (!caseItem.assignedJudge) caseItem.assignedJudge = req.user.userId; 

    let updateMessage = "";
    if (assignedPolice && !caseItem.assignedPolice) {
      updateMessage = `Update: An Investigating Officer has been assigned to Case #${caseItem.caseNumber}. Investigation starting now.`;
      caseItem.status = 'under-investigation';
    } else if (assignedLawyer && !caseItem.assignedLawyer) {
      updateMessage = `Update: A Legal Defense Counsel has been assigned to Case #${caseItem.caseNumber}.`;
    } else {
      updateMessage = `Update: New professionals assigned to Case #${caseItem.caseNumber}.`;
    }

    await caseItem.save();
    await notifyAllParties(caseItem, updateMessage, 'info');

    res.json({ message: 'Assigned and parties notified', case: caseItem });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error assigning case' });
  }
});

// 5. Claim Case (Lawyer)
router.put('/:caseId/claim-lawyer', verifyToken, checkRole(['lawyer']), async (req, res) => {
  try {
    const caseData = await Case.findById(req.params.caseId);
    
    if (!caseData) {
      return res.status(404).json({ message: 'Case not found in database' });
    }

    caseData.assignedLawyer = req.user.userId;
    caseData.status = 'pending_lawyer'; 

    caseData.timeline.push({
      date: new Date(),
      status: 'In Legal Review',
      updatedBy: req.user.userId,
      notes: 'Lawyer accepted the case',
    });

    await caseData.save();
    res.json({ message: 'Case accepted successfully', case: caseData });
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

// --- POLICE INVESTIGATION ROUTES ---

// 8. Add Investigation Note (Case Diary)
router.post('/:id/investigation-notes', verifyToken, checkRole(['police']), async (req, res) => {
  try {
    const { note } = req.body;
    const caseItem = await Case.findById(req.params.id);
    
    if (!caseItem) return res.status(404).json({ message: 'Case not found' });
    
    if (caseItem.assignedPolice?.toString() !== req.user.userId) {
       return res.status(403).json({ message: 'Not authorized for this investigation' });
    }

    caseItem.investigationNotes.push({
      note,
      addedBy: req.user.userId,
      addedAt: new Date()
    });

    await caseItem.save();
    res.json(caseItem);
  } catch (error) {
    res.status(500).json({ message: 'Error adding note', error: error.message });
  }
});

// 9. Upload Evidence (Secure Evidence Vault)
router.post('/:id/evidence', verifyToken, checkRole(['police', 'citizen']), async (req, res) => {
  try {
    const { fileName, fileUrl, deviceMetadata } = req.body;
    const caseItem = await Case.findById(req.params.id);
    
    if (!caseItem) return res.status(404).json({ message: 'Case not found' });

    const fileHash = generateHash(fileUrl + fileName + (deviceMetadata || ''));

    caseItem.documents.push({
      fileName,
      fileUrl,
      fileHash,
      deviceMetadata: deviceMetadata || 'Browser Upload',
      uploadedAt: new Date(),
      verificationStatus: 'pending'
    });

    caseItem.timeline.push({
      date: new Date(),
      status: caseItem.status,
      updatedBy: req.user.userId,
      notes: `New evidence "${fileName}" uploaded and secured with hash ${fileHash.substring(0, 10)}...`
    });

    await caseItem.save();
    res.json(caseItem);
  } catch (error) {
    res.status(500).json({ message: 'Error adding evidence', error: error.message });
  }
});

// 10. File Charge Sheet (Submit to Court)
router.put('/:id/charge-sheet', verifyToken, checkRole(['police']), async (req, res) => {
  try {
    const caseItem = await Case.findById(req.params.id);
    if (!caseItem) return res.status(404).json({ message: 'Case not found' });

    caseItem.status = 'in-court';

    caseItem.timeline.push({
      date: new Date(),
      status: 'in-court',
      updatedBy: req.user.userId,
      notes: 'Police filed Charge Sheet. Case moved to Trial.'
    });

    await caseItem.save();
    res.json({ message: 'Charge Sheet filed successfully', case: caseItem });
  } catch (error) {
    res.status(500).json({ message: 'Error filing charge sheet', error: error.message });
  }
});

// PUT /api/cases/:id/verdict
router.put('/:id/verdict', verifyToken, checkRole(['judge']), async (req, res) => {
  try {
    const caseItem = await Case.findById(req.params.id);
    if (!caseItem) return res.status(404).json({ message: 'Case not found' });

    caseItem.status = 'resolved'; 
    await caseItem.save();

    await notifyAllParties(caseItem, `⚖️ VERDICT ISSUED: Case #${caseItem.caseNumber} has been closed by the Judge.`, 'success');

    res.json(caseItem);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;