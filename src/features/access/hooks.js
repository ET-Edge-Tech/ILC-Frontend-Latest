import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage } from '../../lib/api-client.js';
import { toast } from '../../store/toast-store.js';

// Everyone who works for ILC, what each may do, and the list of switches. Super Admin only.
export function useAccess() {
  return useQuery({ queryKey: ['access'], queryFn: async () => (await api.get('/admin/access')).data });
}

// Changes one person's sign-in switch and/or permissions. kind is 'user' (Admin or member) or 'spoc'.
export function useUpdateAccess(kind, id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body) => (await api.patch(`/admin/access/${kind}/${id}`, body)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['access'] });
      qc.invalidateQueries({ queryKey: ['members'] });
      toast.success('Access updated.');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}
