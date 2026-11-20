import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach Bearer JWT if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('quicksure_auth_token');
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
