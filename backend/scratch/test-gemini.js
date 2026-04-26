const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  try {
    // We can't easily list models with the basic SDK without a specific client
    // But we can try the most common ones
    const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro", "gemini-1.0-pro"];
    for (const m of models) {
      try {
        const model = genAI.getGenerativeModel({ model: m });
        await model.generateContent("test");
        console.log(`✅ ${m} works!`);
        return;
      } catch (e) {
        console.log(`❌ ${m} fails: ${e.message}`);
      }
    }
  } catch (error) {
    console.error("Fatal error:", error);
  }
}

listModels();
