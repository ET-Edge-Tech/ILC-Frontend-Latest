import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage } from '../../lib/api-client.js';
import { toast } from '../../store/toast-store.js';

// filter: foryou | industry | related | saved | all | theme (with `theme` set)
export function useNews(filter, theme) {
  return useInfiniteQuery({
    queryKey: ['news', 'list', filter, theme ?? ''],
    queryFn: async ({ pageParam }) => (await api.get('/news', { params: { filter, page: pageParam, ...(filter === 'theme' && { theme }) } })).data,
    initialPageParam: 1,
    getNextPageParam: (last) => (last.has_more ? last.page + 1 : undefined),
  });
}

export function useThemes() {
  return useQuery({ queryKey: ['news', 'themes'], queryFn: async () => (await api.get('/news/themes')).data.themes, staleTime: 5 * 60_000 });
}

export function useArticle(id) {
  return useQuery({ queryKey: ['news', 'article', id], queryFn: async () => (await api.get(`/news/${id}`)).data.article });
}

export function useSaveArticle(id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (saved) => (saved ? (await api.delete(`/news/${id}/save`)).data : (await api.post(`/news/${id}/save`)).data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['news'] });
      toast.success(res.saved ? 'Saved for later' : 'Removed from saved');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

// Share an article with another member: a chat message holding the title and the portal link.
export function useShareArticle(article) {
  return useMutation({
    mutationFn: async (recipientId) =>
      (await api.post('/chat/messages', { recipientId, message: `${article.title}\n${window.location.origin}/news/${article.id}` })).data,
    onSuccess: () => toast.success('Sent in chat'),
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

// ---- Admin ----
export function useNewsStatus() {
  return useQuery({ queryKey: ['news', 'admin'], queryFn: async () => (await api.get('/news/admin/status')).data, staleTime: 0 });
}

// The Admin's news switches: { full_text } or { ai_enabled }.
export function useNewsSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (change) => (await api.put('/news/admin/settings', change)).data,
    onSuccess: (data, change) => {
      qc.setQueryData(['news', 'admin'], data);
      qc.invalidateQueries({ queryKey: ['news'] });
      if ('ai_enabled' in change) toast.success(data.ai_enabled ? 'AI summaries are on.' : 'AI summaries are off.');
      else toast.success(data.full_text ? 'Articles open in full inside the portal.' : 'Articles show a summary and a link only.');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useSyncNews() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => (await api.post('/news/admin/sync')).data,
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['news'] });
      toast.success(r.skipped ? 'A read is already running.' : `Read ${r.fetched} articles, kept ${r.saved}.`);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}
