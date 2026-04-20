import client from './client';
import { API_ENDPOINTS } from '../utils/constants';

/**
 * Service pour la gestion de l'assistance (Appel Serveur)
 */
export const assistanceApi = {
  /**
   * Envoyer une demande d'assistance
   * @param {number} tableId 
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  requestAssistance: async (tableId) => {
    try {
      // In the Native client, we already have interceptors for tokens
      // and response.data is already returned.
      // Use the constant or ensure /api prefix
      const response = await client.post(API_ENDPOINTS.ASSISTANCE.CALL || '/api/assistance', { table_id: tableId });
      return response;
    } catch (error) {
      console.error('Assistance API Request Error:', error.message);
      return {
        success: false,
        error: error.message || 'Erreur lors de l\'appel du serveur'
      };
    }
  },

  /**
   * Alias pour la compatibilité avec certains composants
   */
  callWaiter: (data) => assistanceApi.requestAssistance(data.table_id === 'auto' ? 1 : data.table_id),

  /**
   * Vérifier s'il y a une demande en cours
   * @param {number} tableId 
   */
  checkPendingRequest: async (tableId) => {
    try {
      const response = await client.get(`/api/assistance/table/${tableId}?status=pending&limit=1`);
      return response;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};
