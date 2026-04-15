import client from './client';
import { API_ENDPOINTS } from '../utils/constants';

/**
 * BREW LUNA — Order API Service
 */

export const orderApi = {
  /**
   * Place a new order
   * @param {Object} orderData { table_id, items: [{ product_id, quantity, options }] }
   */
  createOrder: async (orderData) => {
    return client.post(API_ENDPOINTS.ORDERS.CREATE, orderData);
  },

  /**
   * Get specific order details/status
   * @param {number|string} id 
   */
  getOrderStatus: async (id) => {
    return client.get(API_ENDPOINTS.ORDERS.STATUS(id));
  }
};
