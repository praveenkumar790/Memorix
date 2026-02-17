const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

if (!process.env.GOOGLE_GEMINI_API_KEY) {
  throw new Error('Missing Google Gemini API Key');
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });

module.exports = { genAI, model, embeddingModel };
