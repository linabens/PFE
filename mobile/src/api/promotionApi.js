import client from './client';

export const promotionApi = {
  /**
   * Get all active promotions for the home screen
   */
  getPromotions: async () => {
    try {
      const response = await client.get('/api/promotions');
      return response; // Client already handles response.data
    } catch (error) {
      console.error('Promotion API Error:', error.message);
      return { success: false, error: error.message };
    }
  }
};
