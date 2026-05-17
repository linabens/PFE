import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../utils/constants';
import { useSessionStore } from '../store/useSessionStore';

/**
 * BREW LUNA — Axios Client for Native
 */

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased from 10s to 30s for session operations
});

// Interceptor to inject x-session-token
client.interceptors.request.use(
  async (config) => {
    try {
      // In Native we use AsyncStorage
      const sessionData = await AsyncStorage.getItem('brew-luna-session');
      if (sessionData) {
        const { state } = JSON.parse(sessionData);
        if (state?.token) {
          config.headers['x-session-token'] = state.token;
        }
      }
    } catch (error) {
      console.error('API Client Native: Error fetching token', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;
    let errorMessage = data?.error || data?.message || error.message || 'Server error';
    
    // Si la session est fermée ou expirée (401), on nettoie le store
    if (status === 401 && (errorMessage.includes('Session') || errorMessage.includes('token') || errorMessage.includes('fermé'))) {
      console.warn('Session error detected, clearing store:', errorMessage);
      useSessionStore.getState().clearSession();
    }

    if (status === 403) {
      errorMessage = 'Accès refusé';
    }
    
    return Promise.reject(new Error(errorMessage));
  }
);

export default client;
