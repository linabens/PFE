import client from './client';
import { API_ENDPOINTS } from '../utils/constants';

export const newsApi = {
  getSportsNews: async (limit = 10) => {
    try {
      const response = await client.get(`${API_ENDPOINTS.NEWS.FEED}?category=sports&limit=${limit}`);
      return response;
    } catch (error) {
      console.error('News API Error:', error);
      throw error;
    }
  },
};
