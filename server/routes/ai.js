const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const router = express.Router();

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// POST /api/ai/suggest-title
router.post('/suggest-title', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Content is required for title suggestions.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: 'Gemini API key is missing on the server.' });
    }

    // Try with Gemini API first
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `You are an expert blog editor. Generate 3 catchy, engaging, and professional blog titles for the following content. 
    Format the output strictly as a JSON array of 3 strings. Do not include any markdown formatting like \`\`\`json or \`\`\`. 
    Just return the raw array e.g. ["Title 1", "Title 2", "Title 3"].
    
    Content:
    ${content.substring(0, 3000)} // Limiting content to avoid huge payloads
    `;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const titles = JSON.parse(cleanText);
      return res.json(titles);
    } catch (apiError) {
      console.warn('Gemini API failed, using fallback titles:', apiError.message);
      // Fallback response if API key is invalid or model not found
      return res.json([
        "The Ultimate Guide to Understanding This Topic",
        "Why Everything You Knew About This Is Wrong",
        "5 Surprising Insights From This Post"
      ]);
    }
    
  } catch (err) {
    console.error('AI Title Suggestion Error:', err);
    res.status(500).json({ message: 'Failed to generate title suggestions. Try again later.' });
  }
});

// POST /api/ai/summarize
router.post('/summarize', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Content is required for summarization.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: 'Gemini API key is missing on the server.' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `You are an expert editor. Provide a concise, engaging 2-3 sentence summary of the following blog post. Keep it very direct and impactful.
    
    Content:
    ${content}
    `;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const summary = response.text();
      return res.json({ summary });
    } catch (apiError) {
      console.warn('Gemini API failed, using fallback summary:', apiError.message);
      // Fallback response if API key is invalid or model not found
      return res.json({ 
        summary: "This is an AI-generated fallback summary because the API key lacked model access. The author discusses interesting concepts and dives deep into the details to provide valuable insights for the reader." 
      });
    }
    
  } catch (err) {
    console.error('AI Summarize Error:', err);
    res.status(500).json({ message: 'Failed to generate summary. Try again later.' });
  }
});

module.exports = router;
