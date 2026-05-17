import Constants from 'expo-constants';
import { Platform, NativeModules } from 'react-native';

const LOCAL_IP = '172.20.10.3';
let _apiBaseUrl = `http://${LOCAL_IP}:3000`;

if (__DEV__) {
  try {
    const hostUri = Constants.expoConfig?.hostUri;

    // 1. Expo Tunnel — works on any network, no IP needed
    if (hostUri && hostUri.includes('expo.proxy.dev')) {
      _apiBaseUrl = `https://${hostUri.split(':')[0]}`;
    }
    // 2. IP from Metro bundler scriptURL (LAN mode fallback)
    else {
      const scriptURL = NativeModules.SourceCode?.scriptURL;
      if (scriptURL) {
        const match = scriptURL.match(/http:\/\/([^:]+)/);
        if (match && match[1]) {
          const ip = match[1];
          _apiBaseUrl = (ip === '127.0.0.1' || ip === 'localhost')
            ? (Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://127.0.0.1:3000')
            : `http://${ip}:3000`;
        }
      }
      // 3. hostUri fallback (LAN mode, no scriptURL)
      else if (hostUri) {
        const ip = hostUri.split(':')[0];
        if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
          _apiBaseUrl = `http://${ip}:3000`;
        }
      }
    }
  } catch (e) {
    console.warn('Could not auto-detect API URL:', e);
  }
}

console.log('🚀 API_BASE_URL:', _apiBaseUrl);
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
