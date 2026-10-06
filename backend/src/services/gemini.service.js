const { GoogleGenerativeAI } = require('@google/generative-ai');
const env = require('../config/env');

let genAI = null;
const isGeminiConfigured = env.gemini.apiKey && !env.gemini.apiKey.includes('dummy') && !env.gemini.apiKey.includes('your-');

if (isGeminiConfigured) {
  try {
    genAI = new GoogleGenerativeAI(env.gemini.apiKey);
    console.log('[Gemini] Initialized Google Generative AI client');
  } catch (err) {
    console.error('[Gemini] Initialization error:', err.message);
  }
} else {
  console.log('[Gemini] No active API key found in .env. Running with agricultural knowledge base fallback.');
}

// Built-in agricultural knowledge base for fallback
const agriculturalKnowledge = [
  { q: 'photosynthesis', a: 'Photosynthesis is the process by which green plants convert light energy into chemical energy, using water and carbon dioxide to produce glucose and oxygen essential for crop growth.' },
  { q: 'water wheat', a: 'Wheat generally needs irrigation at critical growth stages: Crown Root Initiation (20-25 days after sowing), tillering, flowering, and grain filling. Avoid waterlogging.' },
  { q: 'yellow leaves', a: 'Yellowing leaves on crops are commonly caused by nitrogen deficiency, overwatering leading to root rot, or early fungal blight. Ensure proper drainage and balanced N-P-K fertilization.' },
  { q: 'soil ph', a: 'Most crops thrive in soil pH 6.0 to 7.5. Rice prefers slightly acidic to neutral soil (pH 5.5 - 6.5). For alkaline soils, apply gypsum; for acidic soils, agricultural lime helps.' },
  { q: 'crop rotation', a: 'Crop rotation is alternating different crop families across seasons to replenish soil nutrients, disrupt pest life cycles, and reduce weed and disease buildup (e.g., rotating legumes with cereals).' },
  { q: 'harvest maize', a: 'Maize is ready for harvest when the husks turn brown and papery, kernels feel firm, and the moisture level reaches approximately 20-25%.' },
  { q: 'pest', a: 'For eco-friendly pest management, spray 5% Neem Seed Kernel Extract (NSKE) or neem oil (1500 ppm at 3-5 ml/liter), install yellow/blue sticky traps, and practice field sanitation.' },
  { q: 'fertilizer', a: 'Soil testing is the best guide. Generally, integrate organic vermicompost or farmyard manure (FYM) with targeted N-P-K and micronutrients (Zinc, Boron) based on crop stage.' }
];

async function generateAgriculturalAdvice({ message, profile, history = [] }) {
  // Build safe agricultural system context from user's shared profile
  const profileContext = [];
  if (profile) {
    if (profile.role) profileContext.push(`Farmer Role: ${profile.role}`);
    if (profile.village || profile.district) profileContext.push(`Location: ${[profile.village, profile.district].filter(Boolean).join(', ')}`);
    if (profile.crops) profileContext.push(`Primary Crops: ${profile.crops}`);
    if (profile.language) profileContext.push(`Preferred Language: ${profile.language}`);
  }

  const systemInstruction = `You are AAHAR (Agricultural AI for Harvest Analysis & Recommendation), an expert agronomist and agricultural assistant in the Krushi Ecosystems.
Your purpose is to provide practical, reliable, evidence-based agricultural advice to farmers and agri-entrepreneurs.
${profileContext.length ? 'Farmer Profile Context:\n' + profileContext.join('\n') : ''}

Guidelines:
1. Provide actionable farming advice (crop management, pest control, soil health, irrigation, harvesting, weather tips).
2. Answer in clear, supportive language suitable for Indian agricultural conditions.
3. If the farmer asks in Hindi, Marathi, Gujarati, or English, answer in their preferred language if appropriate.
4. Keep answers concise, direct, and structured with bullet points where helpful.`;

  if (genAI && isGeminiConfigured) {
    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-3.8-flash',
        systemInstruction
      });

      // Format conversation history for Gemini multi-turn chat
      const formattedHistory = [];
      for (const m of history.slice(-10)) { // Send up to last 10 messages for context
        formattedHistory.push({
          role: m.role === 'ai' ? 'model' : 'user',
          parts: [{ text: m.content || m.text }]
        });
      }

      const chat = model.startChat({
        history: formattedHistory
      });

      const result = await chat.sendMessage(message);
      const response = await result.response;
      const text = response.text();
      return text;
    } catch (err) {
      console.error('[Gemini API Call Failed]:', err.message);
      // Fall through to agricultural knowledge base
    }
  }

  // Fallback: Smart local response
  const lower = message.toLowerCase();
  for (const item of agriculturalKnowledge) {
    if (lower.includes(item.q)) {
      let ans = item.a;
      if (profile && profile.crops) {
        ans += `\n\n(Tip for your ${profile.crops}: Monitor soil moisture regularly and consult local Krushi Kendra for regional advisories.)`;
      }
      return ans;
    }
  }

  // General helpful response tailored to farmer's profile
  let generalAnswer = `Thank you for your question regarding agricultural practices. `;
  if (profile && profile.crops) {
    generalAnswer += `For your crops (${profile.crops}) in ${profile.district || 'your region'}, `;
  }
  generalAnswer += `maintaining balanced soil fertility, adopting drip or micro-irrigation, and monitoring early pest signs will yield healthy produce.
For specific diagnosis, please verify soil pH, moisture conditions, and leaf discoloration symptoms.`;

  return generalAnswer;
}

module.exports = {
  generateAgriculturalAdvice,
  isGeminiConfigured
};
