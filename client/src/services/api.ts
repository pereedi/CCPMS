import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ccpms_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor to handle session refresh / auth failure
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token on 401 unauthenticated
      localStorage.removeItem('ccpms_access_token');
      localStorage.removeItem('ccpms_user');
    }
    return Promise.reject(error.response?.data || error);
  }
);
