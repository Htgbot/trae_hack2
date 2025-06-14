// api/explain.js
const fetch = require('node-fetch');
require('dotenv').config();

const SYSTEM_PROMPTS = {
  low: "You are a friendly explainer. Give a short, simple explanation for absolute beginners or children. Avoid jargon.",
  medium: "You are a helpful science and technology tutor. Give a clear, step-by-step explanation with examples and analogies for a student.",
  high: "You are a subject matter expert. Give an in-depth, technical explanation suitable for advanced learners or professionals, with details and references."
};
const MODEL = "qwen/qwen3-4b-fp8";
const NOVITA_API_URL = "https://api.novita.ai/v3/openai/chat/completions";
const NOVITA_API_KEY = process.env.NOVITA_API_KEY;

module.exports = async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') return res.status(405).json({ error: "Only POST supported" });
  
  const { prompt, level } = req.body;
  if (!prompt) return res.status(400).json({ error: "Prompt required" });

  const systemPrompt = SYSTEM_PROMPTS[level] || SYSTEM_PROMPTS.medium;

  // Check if we should use the real API or mock response
  const useMockResponse = !NOVITA_API_KEY || NOVITA_API_KEY === 'your_novita_api_key_here';

  if (useMockResponse) {
    console.log('Using mock response for demonstration purposes');
    // Generate a mock response based on the level
    let mockExplanation = '';
    
    if (level === 'low') {
      mockExplanation = `<think>I need to explain ${prompt} in very simple terms that a child could understand. I'll use basic language and avoid technical terms. I'll compare it to something familiar like a toy.</think>\n\nHere's a simple explanation of "${prompt}": \n\nThink of ${prompt} like a toy that helps us understand how things work. It's a basic idea that makes complicated things easier to understand!`;
    } else if (level === 'high') {
      mockExplanation = `<think>For a technical explanation of ${prompt}, I should include domain-specific terminology and theoretical frameworks. This is for an advanced audience who wants depth and precision.</think>\n\nTechnical explanation of "${prompt}": \n\n${prompt} represents a fundamental concept in its domain, characterized by specific properties and behaviors that can be analyzed through various theoretical frameworks. The implications extend to multiple disciplines and applications, with significant research supporting its validity and importance.`;
    } else { // medium (default)
      mockExplanation = `<think>I'll provide a step-by-step explanation of ${prompt} that's accessible to a general audience. I'll include some structure with numbered points and use analogies to make it clearer.</think>\n\nStep-by-step explanation of "${prompt}": \n\n1. First, ${prompt} is a concept that helps us understand certain patterns.\n2. It works by connecting related ideas together.\n3. For example, imagine ${prompt} as the blueprint for building something new.\n4. When we apply ${prompt}, we can solve problems more effectively.\n5. In everyday life, you might see ${prompt} when you observe how things naturally organize themselves.`;
    }
    
    // Return the mock explanation
    return res.status(200).json({ explanation: mockExplanation });
  }

  // Real API call if we have a valid API key
  const payload = {
    model: MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt }
    ],
    response_format: { type: "text" },
    stream: false
  };

  try {
    const response = await fetch(NOVITA_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${NOVITA_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    
    // Log the response for debugging
    console.log('API Response:', JSON.stringify(data, null, 2));
    
    // More flexible handling of the response structure
    let explanation = "Could not extract explanation from API response.";
    
    // Try to extract content from various possible response structures
    if (data.choices && Array.isArray(data.choices) && data.choices.length > 0) {
      const choice = data.choices[0];
      if (choice.message && choice.message.content) {
        explanation = choice.message.content;
      } else if (choice.text) {
        explanation = choice.text;
      } else if (typeof choice === 'string') {
        explanation = choice;
      } else if (choice.content) {
        explanation = choice.content;
      }
    } else if (data.text || data.content || data.explanation) {
      // Some APIs might return content directly in the response
      explanation = data.text || data.content || data.explanation;
    } else if (data.error) {
      // If the API returns an error message
      return res.status(500).json({ error: `API Error: ${data.error.message || JSON.stringify(data.error)}` });
    }
    
    // Add a thinking portion to the API response if it doesn't already have one
    if (!explanation.includes('<think>')) {
      let thinkingContent = '';
      if (level === 'low') {
        thinkingContent = `I need to explain ${prompt} in simple terms for beginners.`;
      } else if (level === 'high') {
        thinkingContent = `I should provide a technical, in-depth explanation of ${prompt}.`;
      } else {
        thinkingContent = `I'll give a clear step-by-step explanation of ${prompt}.`;
      }
      
      explanation = `<think>${thinkingContent}</think>\n\n${explanation}`;
    }
    
    return res.status(200).json({ explanation });
  } catch (e) {
    console.error('Error calling Novita API:', e);
    return res.status(500).json({ error: "AI API error: " + e.message });
  }
};