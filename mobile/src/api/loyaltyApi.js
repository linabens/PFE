import client from './client';
import { API_ENDPOINTS } from '../utils/constants';

export const loyaltyApi = {
  register: (name, phone) => 
    client.post(API_ENDPOINTS.LOYALTY.REGISTER, { customer_name: name, phone_number: phone }),
    
  login: (phone) => 
    client.post(API_ENDPOINTS.LOYALTY.LOGIN, { phone_number: phone }),
    
  getTransactions: (id) => 
    client.get(API_ENDPOINTS.LOYALTY.TRANSACTIONS(id)),
    
  earnPoints: (id, order_total) => 
    client.post(API_ENDPOINTS.LOYALTY.EARN(id), { order_total }),
    
  redeemPoints: (id, points) => 
    client.patch(API_ENDPOINTS.LOYALTY.REDEEM(id), { points }),
};
