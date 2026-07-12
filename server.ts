/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// --- AI SERVICE LAYER (Google Gemini API Integration) ---
// This layer encapsulates all AI logic and ensures every request routes through the official Google Gemini API.

let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY is not set. AI features will fail.");
    }
    aiClient = new GoogleGenAI({ 
      apiKey: apiKey || 'MOCK_KEY',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

/**
 * Core AI Service function using the official Google Gemini API
 */
async function getKrishXAssistantResponse(
  messages: any[], 
  currentProfile: any, 
  customImageBase64?: string, 
  language?: 'hi' | 'en' | 'hinglish', 
  imageType?: 'crop' | 'leaf' | 'soil' | 'general'
) {
  const ai = getAiClient();
  // Using gemini-2.5-flash as requested for agricultural analysis
  const modelName = 'gemini-2.5-flash';
  
  const lang = language || 'hi';
  const imgType = imageType || 'general';

  // 1. Define System Instruction (Expert Agronomist Identity)
  let systemInstruction = `You are the KrishX AI Assistant - India's most professional, respectful, and expert Digital Agriculture Guide.
Your purpose is to empower farmers, agriculture students, and experts. You are an expert agronomist, crop pathologist, soil scientist, and agriculture schemes guide.

Core Agricultural Capabilities You Cover:
1. 🌾 Crop Disease Identification: Detect crop diseases/pests, suggest organic or chemical management, and explain exact confidence (High/Medium/Low).
2. 🌱 Crop Care Guidance: Scientific instructions for soil prep, planting, spacing, weeding, and holistic crop health.
3. 💧 Irrigation Advice: Optimal irrigation schedules, drip/sprinkler suggestions, and rain-water conservation.
4. 🌦 Weather-based Farming Suggestions: Season-specific crop schedules, crop planning, and weather warning responses.
5. 🌿 Organic Farming Guidance: Compost prep, bio-manures, bio-pesticides, crop rotation, and natural farming.
6. 🧪 Fertilizer Recommendations: Precise NPK dosage, micronutrients, balanced fertilization, organic manure ratios.
7. 🐛 Pest & Disease Information: Direct treatments, biological controls, pesticide schedules.
8. 📄 Government Scheme Explanation: Simplified guide for PM-KISAN, PMFBY, PM-KUSUM, Soil Health Card, etc.
9. 📑 Agriculture Document Reading: Analysis of soil health cards, agricultural reports, and tests.

CRITICAL INSTRUCTIONS FOR RESPECTFUL DIALOGUE AND CONTEXT:
1. Speak in a highly respectful, encouraging, and supportive tone.
2. Provide direct, actionable advice instead of asking follow-up questions in the main text. Give clear next steps.
3. Distinguish clearly between general recommendations and verified scientific agricultural practices.
4. When analyzing an image (especially crop/leaf/soil), you MUST:
   - Identify the possible crop.
   - Identify visible disease or pest (if detectable).
   - Explain the confidence level clearly (e.g. High/Medium/Low).
   - Suggest possible organic and chemical next steps.
   - IMPORTANT: If confidence is low, or image is blurry/unclear, explicitly recommend consulting local agricultural experts, agronomists, or extension officers. Do NOT present uncertain outputs as facts.

Language-Specific Output Requirement:`;

  if (lang === 'hi') {
    systemInstruction += `\n- ALWAYS speak directly in polite, respectful Hindi (using Devnagari script) mixed with simple Hindi farming terms. Use greetings like "नमस्कार किसान भाई!".`;
  } else if (lang === 'hinglish') {
    systemInstruction += `\n- ALWAYS speak directly in respectful Hinglish (Hindi written in Roman characters) mixed with simple English and farming terms. Use greetings like "Namaskar Kisan Bhai!".`;
  } else {
    systemInstruction += `\n- ALWAYS speak directly in highly professional, polite, and respectful English. Use greetings like "Greetings Farmer Friend!" or "Hello, welcome to KrishX AI!".`;
  }

  if (currentProfile) {
    systemInstruction += `\n\nUSER CONTEXT:
Farmer: ${currentProfile.name}
Location: ${currentProfile.location}
Crops: ${currentProfile.crops?.join(', ') || 'Not specified'}
Experience: ${currentProfile.experienceYears} years.`;
  }

  // 2. Format inputs for Gemini API
  const contents: any[] = [];
  const parts: any[] = [];
  
  // Add image if present
  if (customImageBase64) {
    try {
      const cleanBase64 = customImageBase64.replace(/^data:image\/\w+;base64,/, "");
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: cleanBase64
        }
      });
      // Add text part to explain the image
      parts.push({ 
        text: `Please analyze this agricultural ${imgType} photo for any signs of disease, pests, or nutrient deficiency.` 
      });
    } catch (err) {
      console.error("Error processing image base64:", err);
    }
  }

  // Add conversation history
  if (messages && messages.length > 0) {
    let historyText = "";
    messages.slice(-5).forEach((msg: any) => {
      if (msg.text) {
        historyText += `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.text}\n`;
      }
    });
    if (historyText) {
      parts.push({ text: `Conversation History:\n${historyText}` });
    }
  }

  // Ensure input is never empty
  if (parts.length === 0) {
    if (lang === 'hi') {
      parts.push({ text: "नमस्कार! मैं कैसे सहायता कर सकता हूँ?" });
    } else if (lang === 'hinglish') {
      parts.push({ text: "Namaskar! Main kaise madad kar sakta hoon?" });
    } else {
      parts.push({ text: "Hello! How can I help you today?" });
    }
  }

  contents.push({ parts });

  try {
    console.log(`KrishX: Calling Gemini API | Model: ${modelName} | Parts: ${parts.length}`);
    
    // 3. Call the Gemini API
    const response = await ai.models.generateContent({
      model: modelName,
      contents,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: {
              type: Type.STRING,
              description: "Detailed response with formatting.",
            },
            intent: {
              type: Type.STRING,
              description: "Detected intent: 'diagnose', 'scheme', 'education', 'general'",
            },
            followUpQuestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "2-3 follow-up suggestions.",
            }
          },
          required: ["text", "intent", "followUpQuestions"]
        }
      }
    });

    const fullOutput = response.text || "";

    if (!fullOutput) {
      throw new Error("No output received from Gemini API");
    }

    // 4. Parse response
    try {
      const parsed = JSON.parse(fullOutput);
      return parsed;
    } catch (e) {
      console.error("Failed to parse JSON from Gemini:", e);
      return {
        text: fullOutput,
        intent: "general",
        followUpQuestions: lang === 'hi' 
          ? ["कृषि सलाह जारी रखें", "मिट्टी परीक्षण", "सरकारी योजनाएं"]
          : lang === 'hinglish'
            ? ["Agri advice continue karein", "Mitti test", "Sarkari schemes"]
            : ["Continue agri advice", "Soil testing", "Govt schemes"]
      };
    }
  } catch (apiError: any) {
    console.error("Gemini API Error:", apiError);
    return {
      text: lang === 'hi'
        ? "क्षमा करें किसान भाई, अभी एआई सेवा में कुछ तकनीकी समस्या आ रही है। कृपया थोड़ी देर बाद प्रयास करें।"
        : lang === 'hinglish'
          ? "Sorry kisan bhai, abhi AI service mein technical issue hai. Please thodi der baad try karein."
          : "Sorry farmer friend, there is a technical issue with the AI service. Please try again in some time.",
      followUpQuestions: lang === 'hi' 
        ? ["फिर से प्रयास करें"] 
        : lang === 'hinglish' 
          ? ["Fir se try karein"] 
          : ["Try again"]
    };
  }
}

// --- EXPRESS ROUTES ---

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'KrishX AI Service' });
});

// 2. Main AI Chat Endpoint
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { messages, currentProfile, customImageBase64, language, imageType } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    const result = await getKrishXAssistantResponse(messages, currentProfile, customImageBase64, language, imageType);
    res.json(result);

  } catch (error: any) {
    console.error("AI API Error:", error);
    res.status(500).json({
      text: "क्षमा करें किसान भाई, सर्वर में कुछ समस्या आ गई है। कृपया थोड़ी देर बाद फिर से प्रयास करें।",
      followUpQuestions: ["फिर से कोशिश करें"]
    });
  }
});

// 3. Audio Transcription Endpoint
app.post('/api/ai/transcribe', async (req, res) => {
  try {
    const { audioBase64, language } = req.body;
    
    if (!audioBase64) {
      return res.status(400).json({ error: 'Audio data is required.' });
    }

    const ai = getAiClient();
    let cleanBase64 = audioBase64;
    if (audioBase64.includes(',')) {
      cleanBase64 = audioBase64.substring(audioBase64.indexOf(',') + 1);
    }
    // Remove whitespaces or line breaks
    cleanBase64 = cleanBase64.replace(/\s/g, "");
    // Strip ellipsis or placeholder dots if they accidentally got passed from mock data/tests
    cleanBase64 = cleanBase64.replace(/\./g, "");
    
    let promptText = "Please accurately transcribe this audio.";
    if (language === 'hi') {
      promptText = "Please transcribe this audio in Hindi (Devanagari script). Ensure correct grammar.";
    } else if (language === 'hinglish') {
      promptText = "Please transcribe this audio. It may be in Hindi or English, write the transcript in Hinglish (Hindi written in Roman English letters).";
    }

    const requestConfig = {
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: 'audio/webm',
                data: cleanBase64
              }
            },
            {
              text: promptText
            }
          ]
        }
      ]
    };

    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        ...requestConfig
      });
    } catch (err: any) {
      console.warn("Primary model gemini-3.5-flash failed, attempting fallback to gemini-3.1-pro-preview...", err.message);
      response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        ...requestConfig
      });
    }

    const transcript = response.text || "";
    res.json({ transcript: transcript.trim() });
  } catch (error: any) {
    console.error("Transcription Error:", error);
    res.status(500).json({ error: 'Failed to transcribe audio' });
  }
});

// 4. Mount Vite middleware in development, serve static assets in production
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    // Fallback for React Single Page App routing
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KrishX Server running on port ${PORT}`);
  });
}

setupServer().catch(err => {
  console.error("Failed to start server:", err);
});
