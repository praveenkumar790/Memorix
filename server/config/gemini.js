const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

if (!process.env.GOOGLE_GEMINI_API_KEY) {
  throw new Error('Missing Google Gemini API Key');
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);

const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });

// Fallback chain models
const models = [
  genAI.getGenerativeModel({ model: "gemini-3.5-flash" }),
  genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" }),
  genAI.getGenerativeModel({ model: "gemma-4-31b" })
];

// Wrapper object that acts like the GoogleGenerativeAI model but implements fallback logic
const model = {
  async generateContent(request) {
    let lastError;
    for (const m of models) {
      try {
        return await m.generateContent(request);
      } catch (error) {
        console.warn(`[LLM Fallback] Model ${m.model} failed, trying next... Error: ${error.message}`);
        lastError = error;
      }
    }
    throw new Error(`All LLM models in fallback chain failed. Last error: ${lastError?.message}`);
  },

  async generateContentStream(request) {
    let lastError;
    for (const m of models) {
      try {
        const result = await m.generateContentStream(request);
        // Quick check to see if the stream actually initiated properly without throwing immediately
        if (result && result.stream) {
          return result;
        }
      } catch (error) {
        console.warn(`[LLM Fallback] Model stream ${m.model} failed, trying next... Error: ${error.message}`);
        lastError = error;
      }
    }
    throw new Error(`All LLM models in fallback chain failed. Last error: ${lastError?.message}`);
  }
};

module.exports = { genAI, model, embeddingModel };
