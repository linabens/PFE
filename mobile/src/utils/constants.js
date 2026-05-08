import Constants from 'expo-constants';
import { Platform, NativeModules } from 'react-native';

// Fallback logic for production or if detection fails
let _apiBaseUrl = 'http://192.168.100.82:3000'; 

if (__DEV__) {
  console.log('📱 Expo Host URI:', Constants.expoConfig?.hostUri);
  try {
    // 1. Try to get IP from the bundle URL (Metro)
    const scriptURL = NativeModules.SourceCode.scriptURL;
    if (scriptURL) {
      const match = scriptURL.match(/http:\/\/([^:]+)/);
      if (match && match[1]) {
        const ip = match[1];
        if (ip === '127.0.0.1' || ip === 'localhost') {
          _apiBaseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://127.0.0.1:3000';
        } else {
          _apiBaseUrl = `http://${ip}:3000`;
        }
      }
    } 
    // 2. Fallback to hostUri if scriptURL detection didn't set a LAN IP
    else if (Constants.expoConfig?.hostUri) {
      const ip = Constants.expoConfig.hostUri.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        _apiBaseUrl = `http://${ip}:3000`;
      }
    }
  } catch (e) {
    console.warn("Could not auto-detect IP:", e);
  }
}

console.log('📱 Detected API_BASE_URL:', _apiBaseUrl);
export const API_BASE_URL = _apiBaseUrl;

export const API_ENDPOINTS = {
  SESSION: {
    SCAN: (code) => `/api/sessions/scan/${encodeURIComponent(code)}`,
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
  },
  CHAT: {
    MESSAGE:     '/api/chat/message',
    HISTORY:     '/api/chat/history',
    PREFERENCES: '/api/chat/preferences',
  },
};
