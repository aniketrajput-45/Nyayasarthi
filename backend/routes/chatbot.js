import express from 'express';
import axios from 'axios';
import { verifyToken } from '../middleware/auth.js';
import Case from '../models/Case.js';

const router = express.Router();
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-lite:generateContent';

router.post('/ask', verifyToken, async (req, res) => {
  const { query } = req.body;
  const { userId, role: userRole } = req.user; // Ensure this matches your verifyToken structure

  try {
    // Search for cases where user is involved
    const userCases = await Case.find({ 
      $or: [{ filedBy: userId }, { assignedLawyer: userId }, { assignedJudge: userId }, { assignedPolice: userId }] 
    }).sort({ updatedAt: -1 }).lean();

    // ENHANCED CONTEXT: Includes Evidence status and Timelines for the AI to "see"
    const caseContext = userCases.length > 0 
      ? userCases.map((c, i) => {
          const evidenceStatus = c.documents.map(d => `${d.fileName} (${d.verificationStatus})`).join(', ');
          const daysActive = Math.floor((new Date() - new Date(c.createdAt)) / (1000 * 60 * 60 * 24));
          return `${i+1}. [Title: ${c.title}, Status: ${c.status}, Evidence: ${evidenceStatus || 'None'}, Days Since Filing: ${daysActive}]`;
        }).join('\n')
      : "NO_ACTIVE_CASES_IN_DATABASE";

    const prompt = `
      [ROLE] 
      You are the "LJS Legal Action Bot," an expert in the new Indian Laws (BNS and BNSS).
      
      [CONTEXT]
      User Role: ${userRole}
      Current Case Data: ${caseContext}

      [STRICT AI GUIDELINES]
      1. BNSS COMPLIANCE: If a case has been active for >60 days, warn the user about the mandatory 90-day BNSS deadline for chargesheets.
      2. EVIDENCE FEEDBACK: If a document status is 'rejected', tell the user to check 'Case Details' to see the reason and re-upload.
      3. VERIFICATION NUDGE: For Police/Lawyers, if evidence is 'pending', remind them to verify it immediately to prevent case pendency.
      4. TRIAL READINESS: If all evidence is 'verified', tell the user the case is now "Trial Ready" for the Judge.
      5. BNS MAPPING: Always map incident descriptions to the new BNS sections (e.g., Fraud is now BNS Section 318).
      6. MAX LENGTH: 3 concise, professional sentences.

      [USER_QUERY]
      ${query}
    `;

    const response = await axios.post(`${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`, {
      contents: [{ parts: [{ text: prompt }] }]
    });

    const botReply = response.data.candidates[0].content.parts[0].text;
    res.json({ message: botReply }); 

  } catch (error) {
    console.error("Chatbot Error:", error.message);
    res.status(500).json({ message: 'Error accessing legal data.' });
  }
});

export default router;