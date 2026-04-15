import client from './client';
import { API_ENDPOINTS } from '../utils/constants';

/**
 * BREW LUNA — Session API Service
 */

export const sessionApi = {
  /**
   * Scan a QR code and initialize a session
   * @param {string} qrCode 
   */
  scanQr: async (qrCode) => {
    return client.get(API_ENDPOINTS.SESSION.SCAN(qrCode));
  },

  /**
   * Leave current session
   */
  leave: async () => {
    return client.post(API_ENDPOINTS.SESSION.LEAVE);
  }
};
