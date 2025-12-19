import axios from 'axios';
import { auth } from '../lib/firebase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000', // Backend URL
});

api.interceptors.request.use(async (config) => {
  let token = localStorage.getItem('authToken');

  if (!token && auth.currentUser) {
    token = await auth.currentUser.getIdToken();
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
