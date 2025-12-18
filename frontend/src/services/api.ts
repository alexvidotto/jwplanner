import axios from 'axios';
import { auth } from '../lib/firebase';

const api = axios.create({
  baseURL: 'http://localhost:3000', // Backend URL
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
