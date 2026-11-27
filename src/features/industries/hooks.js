import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage } from '../../lib/api-client.js';
import { toast } from '../../store/toast-store.js';

// The industries list: it fills the pickers and the Council filter. Admins also get how many members use each.
export function useIndustries() {
  return useQuery({
    queryKey: ['industries'],
    queryFn: async () => (await api.get('/industries')).data.industries,
    staleTime: 5 * 60_000,
  });
}

function useIndustryAction(fn, message) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['industries'] });
      qc.invalidateQueries({ queryKey: ['chat', 'members'] });
      toast.success(message);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export const useCreateIndustry = () => useIndustryAction(async (body) => (await api.post('/industries', body)).data, 'Industry added');
export const useUpdateIndustry = () => useIndustryAction(async ({ id, ...body }) => (await api.patch(`/industries/${id}`, body)).data, 'Industry saved');
export const useDeleteIndustry = () => useIndustryAction(async (id) => (await api.delete(`/industries/${id}`)).data, 'Industry deleted');
