import client from './client';
import { API_ENDPOINTS } from '../utils/constants';

/**
 * BREW LUNA — Menu API Service
 */

export const menuApi = {
  /**
   * Fetch all categories
   */
  getCategories: async () => {
    return client.get(API_ENDPOINTS.MENU.CATEGORIES);
  },

  /**
   * Fetch all products
   */
  getProducts: async () => {
    return client.get(API_ENDPOINTS.MENU.PRODUCTS);
  },

  /**
   * Fetch a specific product by ID
   * @param {number|string} id 
   */
  getProductById: async (id) => {
    return client.get(API_ENDPOINTS.MENU.PRODUCT_DETAIL(id));
  }
};
