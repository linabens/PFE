import client from './client';
import { API_ENDPOINTS } from '../utils/constants';

/**
 * BREW LUNA — Menu API (Native)
 */

export const menuApi = {
  getCategories: () => client.get(API_ENDPOINTS.MENU.CATEGORIES),
  getProducts: () => client.get(API_ENDPOINTS.MENU.PRODUCTS),
  getProductById: (id) => client.get(API_ENDPOINTS.MENU.PRODUCT_DETAIL(id)),
};
