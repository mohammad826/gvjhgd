import axios, { InternalAxiosRequestConfig } from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const token = window.localStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch (e) {
  }
  return config;
});

export default api;
