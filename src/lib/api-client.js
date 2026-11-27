import axios from 'axios';
import { useAuthStore } from '../store/auth-store.js';

export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

// Add the login token to every request.
api.interceptors.request.use((config) => {
  const { token } = useAuthStore.getState();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// A 401 on a logged-in call means the session ended: log out and show the banner.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const { token, logout } = useAuthStore.getState();
    if (error.response?.status === 401 && token) logout({ expired: true });
    return Promise.reject(error);
  },
);

// Backend always answers { "error": "message" }.
export function getErrorMessage(error) {
  return error?.response?.data?.error || 'Something went wrong. Please try again.';
}
