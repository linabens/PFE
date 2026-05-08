import client from './client';
import { API_ENDPOINTS } from '../utils/constants';

/**
 * Send a message to Luna and receive a RAG-powered response.
 * Returns { response, sources, confidence, low_confidence, response_ms }
 */
export const sendChatMessage = async (message) => {
  const result = await client.post(API_ENDPOINTS.CHAT.MESSAGE, { message });
  return result.data; // { response, sources, confidence, low_confidence, response_ms }
};

/**
 * Fetch the full conversation history for the current session.
 */
export const fetchChatHistory = async () => {
  const result = await client.get(API_ENDPOINTS.CHAT.HISTORY);
  return result.data; // array of { id, role, content, sources, confidence, created_at }
};

/**
 * Clear the conversation history on the server.
 */
export const deleteChatHistory = async () => {
  await client.delete(API_ENDPOINTS.CHAT.HISTORY);
};

/**
 * Save session-level preferences Luna uses for personalization.
 */
export const updateChatPreferences = async (prefs) => {
  await client.put(API_ENDPOINTS.CHAT.PREFERENCES, prefs);
};
