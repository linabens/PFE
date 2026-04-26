import axios from 'axios';
import { getAllProducts, getDashboardContext } from './db.service';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent';

/**
 * Build a rich system prompt with live coffee shop data
 */
async function buildSystemContext(): Promise<string> {
  let context = `You are "Brew Assistant", a friendly and knowledgeable AI assistant for the Coffee Time coffee shop admin dashboard.

Your personality:
- Warm, professional, and coffee-enthusiastic ☕
- Use emojis sparingly but effectively
- Keep responses concise but helpful (2-4 sentences for simple questions, more for complex ones)
- Format lists and data clearly with bullet points
- You know everything about coffee, café management, and customer service

You have access to LIVE data from the coffee shop database. Here is the current state:
`;

  // Fetch live menu data
  try {
    const menuData = await getAllProducts();
    context += `\n--- CURRENT MENU ---\n${menuData}\n`;
  } catch {
    context += `\n--- MENU: Unable to fetch at this time ---\n`;
  }

  // Fetch live dashboard stats
  try {
    const dashboardData = await getDashboardContext();
    if (dashboardData) {
      context += `\n--- TODAY'S BUSINESS STATS ---\n${dashboardData}\n`;
    }
  } catch {
    context += `\n--- DASHBOARD: Unable to fetch at this time ---\n`;
  }

  context += `
--- GUIDELINES ---
- When asked about menu items, prices, or products, use the LIVE data above
- When asked about orders, revenue, or business stats, use the LIVE data above
- For general coffee knowledge, café tips, or management advice, use your training knowledge
- If you don't have specific data, say so honestly and suggest checking the dashboard
- Always be helpful and suggest related actions the admin might want to take
- You can answer in English or French based on the user's language
- Currency is DZD (Algerian Dinar)
`;

  return context;
}

/**
 * Send a message to Gemini API with coffee shop context
 */
export const sendToGemini = async (
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }> = []
): Promise<string> => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  // Build system context with live data
  const systemContext = await buildSystemContext();

  // Build conversation contents for Gemini
  const contents: any[] = [];

  // Add conversation history (last 10 messages for context window)
  const recentHistory = conversationHistory.slice(-10);
  for (const msg of recentHistory) {
    contents.push({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    });
  }

  // Add current user message with system context injected
  const enrichedMessage = contents.length === 0
    ? `${systemContext}\n\n--- USER MESSAGE ---\n${userMessage}`
    : userMessage;

  contents.push({
    role: 'user',
    parts: [{ text: enrichedMessage }],
  });

  // If this is the first message, inject system context
  if (recentHistory.length === 0) {
    // System instruction is part of the first user message
  } else if (contents.length === 1) {
    // Only the current message, prepend context
    contents[0].parts[0].text = `${systemContext}\n\n--- USER MESSAGE ---\n${userMessage}`;
  }

  try {
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${apiKey}`,
      {
        contents,
        generationConfig: {
          temperature: 0.7,
          topP: 0.9,
          topK: 40,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ],
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
      }
    );

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('Empty response from Gemini');
    }

    return text;
  } catch (error: any) {
    console.error('Gemini API Error:', error.response?.data?.error?.message || error.message);
    throw new Error(`Gemini API failed: ${error.response?.data?.error?.message || error.message}`);
  }
};
