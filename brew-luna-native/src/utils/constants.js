/**
 * BREW LUNA — Constants for Native
 */

// Replace with your local machine IP for testing on physical devices
// e.g. 'http://192.168.1.50:3000'
export const API_BASE_URL = 'http://192.168.0.224:3000';

export const API_ENDPOINTS = {
  SESSION: {
    SCAN: (code) => `/api/sessions/scan/${code}`,
    CREATE: '/api/sessions',
    LEAVE: '/api/sessions/leave',
  },
  MENU: {
    CATEGORIES: '/api/categories',
    PRODUCTS: '/api/products',
    PRODUCT_DETAIL: (id) => `/api/products/${id}`,
  },
  ORDERS: {
    CREATE: '/api/orders',
    STATUS: (id) => `/api/orders/${id}`,
  },
  ASSISTANCE: {
    CALL: '/api/assistance',
  },
  ENTERTAINMENT: {
    QUOTES: '/api/entertainment',
    GAMES: '/api/games',
  },
  NEWS: {
    FEED: '/api/news',
  },
  PROMOTIONS: {
    ALL: '/api/promotions',
  },
  LOYALTY: {
    REGISTER: '/api/loyalty/register',
    LOGIN: '/api/loyalty/login',
    TRANSACTIONS: (id) => `/api/loyalty/${id}/transactions`,
    EARN: (id) => `/api/loyalty/${id}/earn`,
    REDEEM: (id) => `/api/loyalty/${id}/redeem`,
  }
};
