import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api-client.js';
import { useAuthStore } from '../../store/auth-store.js';
import { userFromMe } from './routing.js';

// Step 1: email and password. Staff get { mfa_required, challenge, email_hint } back instead of a session.
export function useLogin() {
  const login = useAuthStore((s) => s.login);
  return useMutation({
    mutationFn: async (body) => (await api.post('/auth/login', body)).data,
    onSuccess: (data) => {
      if (data.token) login(data.token, data.user);
    },
  });
}

// Step 2 (staff): the 6-digit code from the email.
export function useLoginCode() {
  const login = useAuthStore((s) => s.login);
  return useMutation({
    mutationFn: async (body) => (await api.post('/auth/login/verify', body)).data,
    onSuccess: (data) => login(data.token, data.user),
  });
}

export function useResendLoginCode() {
  return useMutation({ mutationFn: async (challenge) => (await api.post('/auth/login/resend', { challenge })).data });
}

// "Sign out of all devices": every sign-in of this account stops working, this one too.
export function useSignOutEverywhere() {
  const queryClient = useQueryClient();
  const logout = useAuthStore((s) => s.logout);
  return useMutation({
    mutationFn: async () => (await api.post('/auth/sign-out-everywhere')).data,
    onSuccess: () => {
      queryClient.clear();
      logout();
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const logout = useAuthStore((s) => s.logout);
  return useMutation({
    // Clear the browser even if the server call fails.
    mutationFn: async () => {
      try {
        await api.post('/auth/logout');
      } catch {
        /* ignore */
      }
    },
    onSettled: () => {
      logout();
      queryClient.clear();
    },
  });
}

// Used for the first-login screen and the profile page.
export function useChangePassword() {
  const login = useAuthStore((s) => s.login);
  return useMutation({
    mutationFn: async (body) => (await api.post('/auth/change-password', body)).data,
    onSuccess: (data) => login(data.token, data.user),
  });
}

export function useRequestOtp() {
  return useMutation({
    mutationFn: async (email) => (await api.post('/auth/request-otp', { email })).data,
  });
}

export function useVerifyOtp() {
  const login = useAuthStore((s) => s.login);
  return useMutation({
    mutationFn: async (body) => (await api.post('/auth/verify-otp', body)).data,
    onSuccess: (data) => login(data.token, data.user),
  });
}

export function useRequestRenewal() {
  return useMutation({ mutationFn: async () => (await api.post('/auth/request-renewal')).data });
}

// Keeps the stored user fresh (for example after an admin approves the profile or extends the date).
export function useSessionRefresh() {
  const token = useAuthStore((s) => s.token);
  const setUser = useAuthStore((s) => s.setUser);
  return useQuery({
    queryKey: ['me'],
    enabled: Boolean(token),
    staleTime: 60_000,
    queryFn: async () => {
      const me = (await api.get('/auth/me')).data.user;
      const fresh = userFromMe(me);
      const current = useAuthStore.getState().user;
      // Lists (like permissions) are compared by their content, not by identity.
      const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
      const changed = !current || Object.keys(fresh).some((k) => !same(fresh[k], current[k]));
      if (changed) setUser({ ...current, ...fresh });
      return me;
    },
  });
}
