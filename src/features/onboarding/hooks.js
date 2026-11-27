import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api-client.js';
import { useAuthStore } from '../../store/auth-store.js';

export function useOnboardingForm() {
  return useQuery({
    queryKey: ['gf-form'],
    queryFn: async () => (await api.get('/gf/form')).data.fields,
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

export function useDraft() {
  return useQuery({
    queryKey: ['gf-draft'],
    queryFn: async () => (await api.get('/gf/draft')).data.draft,
    staleTime: Infinity, // only read once, when the page opens
    gcTime: 0,
  });
}

export function useSaveDraft() {
  return useMutation({
    mutationFn: async (body) => (await api.post('/gf/draft', body)).data,
  });
}

export function useSubmitOnboarding() {
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: async (values) => (await api.post('/gf/submit', { values })).data,
    onSuccess: () => {
      // The member is approved: update the stored status and the guard sends them to the dashboard.
      const current = useAuthStore.getState().user;
      setUser({ ...current, profileStatus: 'APPROVED' });
      qc.removeQueries({ queryKey: ['gf-draft'] });
      qc.invalidateQueries({ queryKey: ['me'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
