import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage } from '../../lib/api-client.js';
import { privateFileUrl, shrinkImage, uploadFile } from '../../lib/uploads.js';
import { toast } from '../../store/toast-store.js';

// Members' own photos from an event: sent for approval, then they go into the gallery.

function useRefresh() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['event-photos'] });
    qc.invalidateQueries({ queryKey: ['photo-review'] });
    qc.invalidateQueries({ queryKey: ['glimpses'] });
    qc.invalidateQueries({ queryKey: ['notifications'] });
  };
}

export function useMyPhotos(eventId, enabled = true) {
  return useQuery({
    queryKey: ['event-photos', eventId],
    enabled,
    queryFn: async () => (await api.get(`/events/${eventId}/photos/mine`)).data,
  });
}

// A short-lived link to a private photo (the member's own, or one waiting for approval).
export function usePrivateUrl(fileId) {
  return useQuery({
    queryKey: ['private-url', fileId],
    enabled: Boolean(fileId),
    staleTime: 4 * 60_000, // the link lasts 5 minutes
    queryFn: () => privateFileUrl(fileId),
  });
}

// Sends several photos one after the other: each is shrunk in the browser, uploaded privately, then attached to the event.
export function useSendPhotos(eventId) {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async ({ files, onStep }) => {
      let sent = 0;
      for (const [i, file] of files.entries()) {
        onStep?.(i + 1, files.length);
        const small = await shrinkImage(file, 2200, 0.85);
        const fileId = await uploadFile('event_photo', small);
        try {
          await api.post(`/events/${eventId}/photos`, { file_id: fileId });
        } catch (e) {
          throw new Error(getErrorMessage(e), { cause: e });
        }
        sent += 1;
      }
      return sent;
    },
    onSuccess: (sent) => {
      refresh();
      toast.success(sent === 1 ? 'Photo sent. Your relationship manager will look at it.' : `${sent} photos sent. Your relationship manager will look at them.`);
    },
    onError: (e) => {
      refresh(); // some may have gone through before the problem
      toast.error(e.message || 'The photos could not be sent.');
    },
  });
}

export function useWithdrawPhoto() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async (photoId) => (await api.delete(`/events/photos/${photoId}`)).data,
    onSuccess: () => {
      refresh();
      toast.success('Photo removed.');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

// For relationship managers (their own members) and Admins (everyone).
export function usePhotoReview(status = 'PENDING') {
  return useQuery({
    queryKey: ['photo-review', status],
    queryFn: async () => (await api.get('/events/photos/review', { params: { status } })).data.photos,
  });
}

export function useApprovePhoto() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async (id) => (await api.post(`/events/photos/${id}/approve`)).data,
    onSuccess: () => {
      refresh();
      toast.success('Approved. It is now in the gallery.');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useRejectPhoto() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async ({ id, reason }) => (await api.post(`/events/photos/${id}/reject`, { reason })).data,
    onSuccess: () => {
      refresh();
      toast.success('Turned down. The member has been told.');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}
