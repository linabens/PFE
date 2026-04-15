/**
 * BREW LUNA — Constants
 */

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
    HISTORY: '/api/orders/history', // if exists
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
  }
};

export const ORDER_STATUS = {
  NEW: 'new',
  PREPARING: 'preparing',
  BREWING: 'brewing',
  READY: 'ready',
  COMPLETED: 'completed',
};
