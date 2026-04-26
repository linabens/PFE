import client from './client';
import { API_ENDPOINTS } from '../utils/constants';

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
      const response = await client.get(API_ENDPOINTS.SESSION.SCAN(qrCode));
      return response;
    } catch (error) {
      console.error('Session Scan Error:', error.message);
      return { success: false, error: error.message };
    }
  },

  /**
   * Create a session for a specific table manually
   * @param {number} tableId 
   */
  createSession: async (tableId) => {
    try {
      const response = await client.post(API_ENDPOINTS.SESSION.CREATE, { table_id: tableId });
      return response;
    } catch (error) {
      console.error('Session Create Error:', error.message);
      return { success: false, error: error.message };
    }
  },

  /**
   * Leave the session
   */
  leaveSession: async () => {
    try {
      const response = await client.post(API_ENDPOINTS.SESSION.LEAVE);
      return response;
    } catch (error) {
      console.error('Session Leave Error:', error.message);
      return { success: false, error: error.message };
    }
  }
};
