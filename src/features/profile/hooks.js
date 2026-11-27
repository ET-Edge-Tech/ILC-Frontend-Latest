import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage } from '../../lib/api-client.js';
import { useAuthStore } from '../../store/auth-store.js';
import { toast } from '../../store/toast-store.js';
import { userFromMe } from '../auth/routing.js';

export function useUpdateProfile() {
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: async (body) => (await api.patch('/auth/profile', body)).data,
    onSuccess: (res) => {
      // Keep the name and title in the sidebar up to date straight away.
      const current = useAuthStore.getState().user;
      setUser({ ...current, ...userFromMe(res.user) });
      qc.invalidateQueries({ queryKey: ['me'] });
      toast.success('Profile saved');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}
