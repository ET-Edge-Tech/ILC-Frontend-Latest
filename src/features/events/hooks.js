import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage } from '../../lib/api-client.js';
import { saveBlob } from '../../lib/download.js';
import { toast } from '../../store/toast-store.js';

export function useEvents(when = 'all') {
  return useQuery({
    queryKey: ['events', { when }],
    queryFn: async () => (await api.get('/events', { params: { when } })).data.events,
  });
}

export function useEvent(id) {
  return useQuery({
    queryKey: ['event', id],
    queryFn: async () => (await api.get(`/events/${id}`)).data,
  });
}

// Anything that changes an event, a booking or a notification refreshes these.
function useRefresh() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['events'] });
    qc.invalidateQueries({ queryKey: ['event'] });
    qc.invalidateQueries({ queryKey: ['notifications'] });
  };
}

export function useBook() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async (id) => (await api.post(`/events/${id}/book`)).data,
    onSuccess: () => {
      refresh();
      toast.success('You are attending. A confirmation email is on its way.');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useRsvpNo() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async (id) => (await api.post(`/events/${id}/rsvp-no`)).data,
    onSuccess: () => {
      refresh();
      toast.success('Your response is saved.');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

// Create (no id) or update (with id) an event.
export function useSaveEvent() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async ({ id, ...body }) =>
      id ? (await api.put(`/events/${id}`, body)).data : (await api.post('/events', body)).data,
    onSuccess: (_res, vars) => {
      refresh();
      toast.success(vars.id ? 'Event updated' : 'Event created');
    },
  });
}

export function useDeleteEvent() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/events/${id}`)).data,
    onSuccess: () => {
      refresh();
      toast.success('Event deleted');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

// The catering list (Admins and relationship managers): what attending members eat and must avoid.
export function useCatering(id) {
  return useQuery({
    queryKey: ['catering', id],
    queryFn: async () => (await api.get(`/events/${id}/catering`)).data,
    staleTime: 0,
  });
}

export function useCateringDownload(id) {
  return useMutation({
    mutationFn: async () => (await api.get(`/events/${id}/catering`, { params: { format: 'csv' }, responseType: 'blob' })).data,
    onSuccess: (blob) => saveBlob(blob, 'catering-list.csv'),
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}
