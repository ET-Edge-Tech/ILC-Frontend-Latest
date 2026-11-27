import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage } from '../../lib/api-client.js';
import { toast } from '../../store/toast-store.js';

export function useSpocs() {
  return useQuery({ queryKey: ['spocs'], queryFn: async () => (await api.get('/admin/spocs')).data.spocs });
}

export function useCreateSpoc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body) => (await api.post('/admin/spocs', body)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['spocs'] });
      toast.success('SPOC created. A welcome email with sign-in details is on its way.');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useBulkCreateSpocs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (spocs) => (await api.post('/admin/spocs/bulk', { spocs })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['spocs'] }),
  });
}

export function useDeleteSpoc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/admin/spocs/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['spocs'] });
      qc.invalidateQueries({ queryKey: ['members'] });
      toast.success('SPOC deleted. Their members are now unassigned.');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

// Admin: move every member of one SPOC to another SPOC.
export function useHandover() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ from, to }) => (await api.post(`/admin/spocs/${from}/handover`, { to_spoc_id: to })).data,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['spocs'] });
      qc.invalidateQueries({ queryKey: ['members'] });
      qc.invalidateQueries({ queryKey: ['ops'] });
      toast.success(res.message);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}
