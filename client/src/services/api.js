import axios from 'axios';
import { STORAGE_KEYS, API_TIMEOUT_MS } from '../config/constants';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach Bearer JWT if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    config.headers['X-Request-Source'] = 'quicksure-web';
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for uniform unwrapping
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    return Promise.reject({
      message,
      statusCode: error.response?.status || 500,
      code: error.response?.data?.error?.code || 'API_ERROR',
      details: error.response?.data?.error?.details || null,
    });
  }
);

export default api;
