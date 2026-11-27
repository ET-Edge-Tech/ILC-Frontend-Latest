import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Login state only. Server data goes through TanStack Query.
export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      sessionExpired: false,
      login: (token, user) => set({ token, user, sessionExpired: false }),
      setUser: (user) => set({ user }),
      logout: ({ expired = false } = {}) =>
        set({ token: null, user: null, sessionExpired: expired }),
      clearExpiredFlag: () => set({ sessionExpired: false }),
    }),
    { name: 'ilc-auth', partialize: (s) => ({ token: s.token, user: s.user }) },
  ),
);
