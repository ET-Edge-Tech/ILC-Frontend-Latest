import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage } from '../../lib/api-client.js';
import { toast } from '../../store/toast-store.js';

// ---- broadcast ----------------------------------------------------------------------------------------

// body: { subject, message, userIds?, test? }
export function useSendBroadcast() {
  return useMutation({
    mutationFn: async (body) => (await api.post('/admin/broadcast', body)).data,
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

// ---- audit logs (Super Admin) -------------------------------------------------------------------------

export function useAuditLogs(filters, enabled) {
  return useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: async () => {
      const params = {};
      for (const [k, v] of Object.entries(filters)) if (v) params[k] = v;
      return (await api.get('/admin/audit-logs', { params })).data;
    },
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useAuditActions(enabled) {
  return useQuery({
    queryKey: ['audit-actions'],
    queryFn: async () => (await api.get('/admin/audit-logs/actions')).data.actions,
    enabled,
    staleTime: 60_000,
  });
}

// ---- form progress -------------------------------------------------------------------------------------

export function useProgress() {
  return useQuery({
    queryKey: ['form-progress'],
    queryFn: async () => (await api.get('/gf/progress')).data.progress,
    staleTime: 30_000,
  });
}

// Saves an Admin's corrections ({ fieldId: value }). The server answers with the fresh sheet.
export function useEditAnswers(userId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (answers) => (await api.patch(`/gf/progress/${userId}`, { answers })).data,
    onSuccess: (sheet) => {
      qc.setQueryData(['form-answers', userId], sheet);
      qc.invalidateQueries({ queryKey: ['form-progress'] });
      qc.invalidateQueries({ queryKey: ['audit-logs'] });
      toast.success('Answers saved');
    },
  });
}

export function useAnswerSheet(userId) {
  return useQuery({
    queryKey: ['form-answers', userId],
    queryFn: async () => (await api.get(`/gf/progress/${userId}`)).data,
    enabled: Boolean(userId),
    staleTime: 0,
  });
}
