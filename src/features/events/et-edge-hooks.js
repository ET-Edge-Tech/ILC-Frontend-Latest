import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage } from '../../lib/api-client.js';
import { toast } from '../../store/toast-store.js';

// ET Edge events: a member says "I'm interested", their relationship manager follows it up.

function useRefresh() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['events'] });
    qc.invalidateQueries({ queryKey: ['event'] });
    qc.invalidateQueries({ queryKey: ['et-edge'] });
    qc.invalidateQueries({ queryKey: ['notifications'] });
  };
}

export function useShowInterest() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async (eventId) => (await api.post(`/events/${eventId}/interest`)).data,
    onSuccess: () => {
      refresh();
      toast.success('Interest sent. We will get in touch.');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useWithdrawInterest() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async (eventId) => (await api.delete(`/events/${eventId}/interest`)).data,
    onSuccess: () => {
      refresh();
      toast.success('Interest removed.');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

// Requests from the relationship manager's own members (an Admin sees everyone's).
export function useInterests(status = '') {
  return useQuery({
    queryKey: ['et-edge', 'interests', status],
    queryFn: async () => (await api.get('/events/et-edge/interests', { params: status ? { status } : {} })).data.interests,
  });
}

export function useSetInterestStatus() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async ({ id, status }) => (await api.patch(`/events/et-edge/interests/${id}`, { status })).data,
    onSuccess: refresh,
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export const STATUS_LABEL = { NEW: 'New', CONTACTED: 'Contacted', DONE: 'Done' };
