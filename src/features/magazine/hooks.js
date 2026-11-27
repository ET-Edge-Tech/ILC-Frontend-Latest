import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage } from '../../lib/api-client.js';
import { toast } from '../../store/toast-store.js';
import { saveBlob } from '../../lib/download.js';

export function useIssues() {
  return useQuery({ queryKey: ['magazine', 'list'], queryFn: async () => (await api.get('/magazines')).data.issues, staleTime: 0 });
}

export function useIssue(id) {
  return useQuery({ queryKey: ['magazine', 'issue', id], queryFn: async () => (await api.get(`/magazines/${id}`)).data.issue, staleTime: 0 });
}

// The PDF as bytes (the server hands it only to signed-in people).
export async function fetchPdf(id) {
  return (await api.get(`/magazines/${id}/file`, { responseType: 'arraybuffer' })).data;
}

// Remember the last page read. Staff do not keep a place, so nothing is sent for them.
export const saveProgress = (id, page) => api.put(`/magazines/${id}/progress`, { page }).catch(() => {});

export function useDownload(id) {
  return useMutation({
    // The server stamps every page with the reader's name, then the file is saved.
    mutationFn: async () => {
      const res = await api.get(`/magazines/${id}/download`, { responseType: 'blob' });
      const name = /filename="([^"]+)"/.exec(res.headers['content-disposition'] ?? '')?.[1] ?? 'ILC-magazine.pdf';
      return { blob: res.data, name };
    },
    onSuccess: ({ blob, name }) => saveBlob(blob, name),
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useSaveIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }) => (id ? (await api.put(`/magazines/${id}`, body)).data : (await api.post('/magazines', body)).data),
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: ['magazine'] });
      toast.success(vars.id ? 'Issue updated' : 'Issue added');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useDeleteIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/magazines/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['magazine'] });
      toast.success('Issue deleted');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}
