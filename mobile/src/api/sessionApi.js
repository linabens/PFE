import client from './client';
import { API_ENDPOINTS } from '../utils/constants';

/**
 * Retry logic with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Max number of attempts
 * @param {number} initialDelay - Initial delay in ms
 */
const retryWithBackoff = async (fn, maxRetries = 3, initialDelay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      const delay = initialDelay * Math.pow(2, attempt - 1);
      console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

/**
 * BREW LUNA — Session API (Native)
 */
export const sessionApi = {
  /**
   * Scan a QR code and create a session
   * @param {string} qrCode 
   */
  scanQrCode: async (qrCode) => {
    try {
      const response = await retryWithBackoff(
        () => client.get(API_ENDPOINTS.SESSION.SCAN(qrCode)),
        3,
        1000
      );
      return response;
    } catch (error) {
      console.error('Session Scan Error:', error.message);
      return { 
        success: false, 
        error: error.message || 'Failed to scan QR code. Please try again.' 
      };
    }
  },

  /**
   * Create a session for a specific table manually
   * @param {number} tableNumber - The display table number (not DB id)
   */
  createSession: async (tableNumber) => {
    try {
      const response = await retryWithBackoff(
        () => client.post(API_ENDPOINTS.SESSION.CREATE, { table_number: tableNumber }),
        3,
        1000
      );
      return response;
    } catch (error) {
      console.error('Session Create Error:', error.message);
      return { 
        success: false, 
        error: error.message || 'Failed to create session. Please try again.' 
      };
    }
  },

  /**
   * Leave the session
   */
  leaveSession: async () => {
    try {
      const response = await retryWithBackoff(
        () => client.post(API_ENDPOINTS.SESSION.LEAVE),
        2,
        500
      );
      return response;
    } catch (error) {
      console.error('Session Leave Error:', error.message);
      return { 
        success: false, 
        error: error.message || 'Failed to leave session.' 
      };
    }
  }
};
