import client from './client';
import { API_ENDPOINTS } from '../utils/constants';

export const orderApi = {
  createOrder: (orderData) => client.post(API_ENDPOINTS.ORDERS.CREATE, orderData),
  getOrderStatus: (id) => client.get(API_ENDPOINTS.ORDERS.STATUS(id)),
};
