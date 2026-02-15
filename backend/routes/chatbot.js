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
          // Added a fallback just in case documents array is empty/undefined
          const evidenceStatus = c.documents ? c.documents.map(d => `${d.fileName} (${d.verificationStatus})`).join(', ') : 'None';
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
      5. BNS MAPPING & INSTRUCTION: Always map incidents to the new BNS sections (e.g., Fraud is BNS 318). In your 'message', you MUST explicitly state the BNS Section AND name the exact types of documents they need to provide (e.g., bank statements, screenshots, ID).
      6. DRAFT COMPLAINT: Take the user's short query and expand it into a formal, professional 1st-person legal complaint description. Use placeholders like [Date], [Location], [Transaction Amount] for missing facts.
      7. MAX LENGTH: 3 to 4 concise, professional sentences for the conversational message.

      [USER_QUERY]
      ${query}
      
      Respond strictly in the following JSON format. Do NOT wrap it in markdown blockquotes (\`\`\`json):
      {
        "message": "Your conversational reply here (max 3 sentences)",
        "bnsSection": "The identified BNS section (e.g., '304' or null)",
        "caseCategory": "civil, criminal, cyber, or corporate",
        "requiredEvidence": ["list", "of", "documents"],
        "draftedDescription": "I, the undersigned, would like to formally lodge a complaint regarding... [Add formal legal language here based on the query. Leave placeholders for missing facts.]"
      }
    `;

    const response = await axios.post(`${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`, {
      contents: [{ parts: [{ text: prompt }] }]
    });

    let botReply = response.data.candidates[0].content.parts[0].text;
    
    // Clean up any markdown tags the AI might try to add
    botReply = botReply.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
      // Parse the JSON correctly on the backend
      const parsedData = JSON.parse(botReply);
      // Send the structured data directly to the frontend
      res.json(parsedData);
    } catch (parseError) {
      console.error("Failed to parse AI JSON on backend:", parseError);
      // Fallback in case AI hallucinates invalid JSON
      res.json({ message: botReply });
    }

  } catch (error) {
    console.error("Chatbot Error:", error.message);
    res.status(500).json({ message: 'Error accessing legal data.' });
  }
});

export default router;