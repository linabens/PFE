import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../utils/constants';

/**
 * BREW LUNA — Axios Client for Native
 */

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
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
    const errorMessage = error.response?.data?.error || error.message || 'Server error';
    return Promise.reject(new Error(errorMessage));
  }
);

export default client;
