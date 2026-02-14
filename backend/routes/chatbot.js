import express from 'express';
import axios from 'axios';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

// Get role-specific system prompt
const getSystemPrompt = (role) => {
  const basePrompt = 'You are a helpful legal assistant for a Law and Justice Management System. ';

  const rolePrompts = {
    citizen: basePrompt + 'Provide friendly legal advice and information for citizens about filing cases, understanding their rights, and navigating the legal system.',
    police: basePrompt + 'Provide law enforcement guidance, investigation procedures, and police protocols.',
    lawyer: basePrompt + 'Provide expert legal advice, case law references, and litigation strategies.',
    judge: basePrompt + 'Provide information about judicial procedures, precedents, and sentencing guidelines.',
  };

  return rolePrompts[role] || basePrompt;
};

// Chat with Gemini
router.post('/ask', verifyToken, async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ message: 'Query is required' });
    }

    const systemPrompt = getSystemPrompt(req.user.role);

    const response = await axios.post(
      `${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: `${systemPrompt}\n\nUser query: ${query}`,
              },
            ],
          },
        ],
      }
    );

    const responseText = response.data.candidates[0].content.parts[0].text;

    res.json({
      query,
      response: responseText,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Gemini API Error:', error.message);
    res.status(500).json({
      message: 'Error communicating with chatbot',
      error: error.message,
    });
  }
});

export default router;
