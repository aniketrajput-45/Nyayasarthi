import express from 'express';
import axios from 'axios';
import { verifyToken } from '../middleware/auth.js';
import Case from '../models/Case.js'; // This imports the logic from the file above

const router = express.Router();
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent';

router.post('/ask', verifyToken, async (req, res) => {
  const { query } = req.body;
  const { id: userId, role: userRole } = req.user;

  try {
    // Search using the CORRECT field names from your schema
    const userCases = await Case.find({ 
      $or: [{ filedBy: userId }, { assignedLawyer: userId }, { assignedJudge: userId }] 
    }).sort({ updatedAt: -1 }).lean();

    const caseContext = userCases.length > 0 
      ? userCases.map((c, i) => `${i+1}. [Type: ${c.type}, Status: ${c.status}, Title: ${c.title}]`).join('\n')
      : "NO_ACTIVE_CASES_IN_DATABASE";

    const prompt = `
      [ROLE] 
      You are the "LJS Legal Action Bot," an expert in Indian Law (BNS/IPC).
      
      [CONTEXT]
      User Role: ${userRole}
      Current Case Data: ${caseContext}

      [STRICT GUIDELINES]
      1. BNS MAPPING: If the user describes an incident, identify the relevant BNS (Bharatiya Nyaya Sanhita) section.
         - Examples: Theft -> BNS Section 303; Snatching -> BNS Section 304; Fraud -> BNS Section 318.
      2. ROLE-BASED NUDGING: 
         - For Citizens (User): If status is 'filed', tell them to upload ID proof and evidence.
         - For Police/Lawyers: Remind them to verify pending files to reduce case pendency.
      3. EVIDENCE CHECKLIST: Based on the Case 'Type', tell the user exactly what to upload (e.g., Receipts for Theft, Deeds for Property).
      4. MAX LENGTH: 3 concise sentences.
      5. SYSTEM NAVIGATION: Refer only to 'My Cases', 'File Case', or 'Case Details' tabs.

      [USER_QUERY]
      ${query}
    `;

    const response = await axios.post(`${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`, {
      contents: [{ parts: [{ text: prompt }] }]
    });

    const botReply = response.data.candidates[0].content.parts[0].text;
    
    // SEND AS 'message' TO MATCH YOUR Chatbot.tsx
    res.json({ message: botReply }); 

  } catch (error) {
    console.error("Chatbot Error:", error.message);
    res.status(500).json({ message: 'Error accessing legal data.' });
  }
});

export default router;