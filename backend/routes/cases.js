import express from 'express';
import Case from '../models/Case.js';
import User from '../models/User.js';
import { verifyToken, checkRole } from '../middleware/auth.js';
import Notification from '../models/Notification.js';
import { notifyAllParties } from '../utils/notificationSystem.js';

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
      documents, isProBono, isAnonymous, shareWithLegalAid,
      bnsSection, aiSuggestedEvidence // <-- FIXED: Destructure these from the request
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

      // --- FIXED: ADD THESE TO THE NEW CASE OBJECT ---
      bnsSection: bnsSection || null,
      aiSuggestedEvidence: aiSuggestedEvidence || [],
      // ----------------------------------------------

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

// NEW: Route for officials to verify uploaded evidence
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
      // OLD CODE: query.assignedPolice = req.user.userId; 
      
      // NEW CODE: Show ALL active cases so the dashboard isn't empty
      // We will filter "My Cases" vs "Station Cases" on the frontend
      query.status = { $in: ['filed', 'under-investigation', 'in-court', 'resolved'] };
    } else if (req.user.role === 'lawyer') {
      query.$or = [
        { assignedLawyer: req.user.userId },
        { assignedLawyer: { $exists: false } },
        { assignedLawyer: null }
      ];

      // If 'acceptedOnly' is true (used for Chat), show ONLY assigned cases.
      // Otherwise (for Case Registry), show Assigned + Unassigned + Filed By Me.
      if (req.query.acceptedOnly === 'true' || req.query.acceptedOnly === true) {
        query.assignedLawyer = req.user.userId;
      } else {
        query.$or = [
          { assignedLawyer: req.user.userId },       // 1. Cases assigned to me
          { assignedLawyer: { $exists: false } },    // 2. Cases with NO lawyer
          { assignedLawyer: null },                  // 3. (Safety check for null)
          { filedBy: req.user.userId }               // 4. Cases I FILED myself (NEW)
        ];
      }

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

// 4. Assign Professionals
router.put('/:id/assign', verifyToken, checkRole(['judge']), async (req, res) => {
  try {
    const { assignedPolice, assignedLawyer } = req.body;
    
    // We populate 'filedBy' so we get the Citizen's ID
    const caseItem = await Case.findById(req.params.id); 
    
    if (!caseItem) return res.status(404).json({ message: 'Case not found' });

    // Update Fields
    if (assignedPolice) caseItem.assignedPolice = assignedPolice;
    if (assignedLawyer) caseItem.assignedLawyer = assignedLawyer;
    if (!caseItem.assignedJudge) caseItem.assignedJudge = req.user.userId; 

    // Status Update Logic
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

    // --- 🔔 THE MAGIC LINE: NOTIFY EVERYONE (Citizen included) ---
    await notifyAllParties(caseItem, updateMessage, 'info');
    // ------------------------------------------------------------

    res.json({ message: 'Assigned and parties notified', case: caseItem });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error assigning case' });
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

// --- POLICE INVESTIGATION ROUTES ---

// 8. Add Investigation Note (Case Diary)
router.post('/:id/investigation-notes', verifyToken, checkRole(['police']), async (req, res) => {
  try {
    const { note } = req.body;
    const caseItem = await Case.findById(req.params.id);
    
    if (!caseItem) return res.status(404).json({ message: 'Case not found' });
    
    // Security check: Ensure this officer is assigned to this case
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

// 9. Upload Evidence (Digital Locker)
router.post('/:id/evidence', verifyToken, checkRole(['police']), async (req, res) => {
  try {
    const { fileName, fileUrl } = req.body; // In a real app, this would handle file upload
    const caseItem = await Case.findById(req.params.id);
    
    if (!caseItem) return res.status(404).json({ message: 'Case not found' });

    caseItem.documents.push({
      fileName,
      fileUrl,
      uploadedAt: new Date()
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

    // Change status to 'in-court' (Trial Ready)
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

    caseItem.status = 'resolved'; // <--- This triggers the 'Verdict' step in timeline
    await caseItem.save();

    // Notify Everyone
    await notifyAllParties(caseItem, `⚖️ VERDICT ISSUED: Case #${caseItem.caseNumber} has been closed by the Judge.`, 'success');

    res.json(caseItem);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;