import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage } from '../../lib/api-client.js';
import { toast } from '../../store/toast-store.js';

// My meetings (all events), soonest first, and whether I am hidden from requests.
export function useMyMeetings() {
  return useQuery({
    queryKey: ['meetings'],
    queryFn: async () => (await api.get('/meetings')).data,
    refetchInterval: 60_000, // new requests and answers show up without a refresh
  });
}

// The other members attending one event (meetings must be open for it).
export function useAttendees(eventId, enabled) {
  return useQuery({
    queryKey: ['meetings', 'attendees', eventId],
    queryFn: async () => (await api.get(`/meetings/event/${eventId}/attendees`)).data,
    enabled,
  });
}

// The times free for both me and one other member.
export function useFreeSlots(eventId, otherId) {
  return useQuery({
    queryKey: ['meetings', 'slots', eventId, otherId],
    queryFn: async () => (await api.get(`/meetings/event/${eventId}/slots`, { params: { with: otherId } })).data,
    enabled: Boolean(otherId),
    staleTime: 0,
  });
}

function useRefresh() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['meetings'] });
    qc.invalidateQueries({ queryKey: ['notifications'] });
  };
}

export function useRequestMeeting(eventId) {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async (body) => (await api.post(`/meetings/event/${eventId}`, body)).data,
    onSuccess: () => {
      refresh();
      toast.success('Request sent. You will be told when they answer.');
    },
    onError: (e) => {
      refresh(); // a "just taken" answer means the list of times is out of date
      toast.error(getErrorMessage(e));
    },
  });
}

// accept | decline | cancel
export function useRespond() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async ({ id, action }) => (await api.post(`/meetings/${id}/${action}`)).data,
    onSuccess: (res) => {
      refresh();
      toast.success(res.message);
    },
    onError: (e) => {
      refresh();
      toast.error(getErrorMessage(e));
    },
  });
}

export function useCounter() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async ({ id, ...body }) => (await api.post(`/meetings/${id}/counter`, body)).data,
    onSuccess: () => {
      refresh();
      toast.success('Sent. They can accept or decline the new time.');
    },
    onError: (e) => {
      refresh();
      toast.error(getErrorMessage(e));
    },
  });
}

export function useSetHidden() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async (hidden) => (await api.put('/meetings/settings', { hidden })).data,
    onSuccess: (res) => {
      refresh();
      toast.success(res.hidden ? 'You are hidden from meeting requests.' : 'Others can ask you for a meeting again.');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}
