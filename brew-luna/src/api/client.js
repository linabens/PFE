import axios from 'axios';

/**
 * BREW LUNA — Axios API Client
 * Configured with base URL and automatic session token injection
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const client = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor to inject x-session-token from localStorage
client.interceptors.request.use(
  (config) => {
    try {
      // We retrieve the token directly from localStorage to ensure we always have the latest value
      // without needing to import useSessionStore (which avoids circular dependencies)
      const sessionData = localStorage.getItem('brew-luna-session');
      if (sessionData) {
        const { state } = JSON.parse(sessionData);
        if (state?.token) {
          config.headers['x-session-token'] = state.token;
        }
      }
    } catch (error) {
      console.error('API Client: Failed to retrieve token from storage', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle common errors (session expiry, etc.)
client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Check if error is related to session expiration (401/403)
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Optional: Logic to handle session expiration globally
      console.warn('API Client: Session may have expired or is invalid');
    }
    
    // Normalize error response
    const errorMessage = error.response?.data?.error || error.message || 'Something went wrong';
    return Promise.reject(new Error(errorMessage));
  }
);

export default client;
