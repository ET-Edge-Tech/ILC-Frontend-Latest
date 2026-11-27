import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage } from '../../lib/api-client.js';
import { toast } from '../../store/toast-store.js';

// ---- reading ----------------------------------------------------------------------------------------

export const useResources = () =>
  useQuery({
    queryKey: ['resources'],
    queryFn: async () => (await api.get('/resources')).data.resources,
  });

export const useGlimpses = () =>
  useQuery({
    queryKey: ['glimpses'],
    queryFn: async () => (await api.get('/glimpses')).data.glimpses,
  });

export const useAnnouncements = () =>
  useQuery({
    queryKey: ['announcements'],
    queryFn: async () => (await api.get('/announcements')).data.announcements,
  });

// ---- bookmarks --------------------------------------------------------------------------------------

// Turns a bookmark on or off. The star changes at once; if the server refuses, it goes back.
export function useToggleBookmark() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, on }) =>
      on
        ? (await api.post(`/glimpses/${id}/bookmark`)).data
        : (await api.delete(`/glimpses/${id}/bookmark`)).data,
    onMutate: async ({ id, on }) => {
      await qc.cancelQueries({ queryKey: ['glimpses'] });
      const previous = qc.getQueryData(['glimpses']);
      qc.setQueryData(['glimpses'], (list) =>
        list?.map((g) => (g.id === id ? { ...g, is_bookmarked: on } : g)),
      );
      return { previous };
    },
    onError: (e, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(['glimpses'], ctx.previous);
      toast.error(getErrorMessage(e));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['glimpses'] }),
  });
}

// ---- admin writing ----------------------------------------------------------------------------------

// One helper for create / update / delete of resources, glimpses and announcements.
function useAdminSave(basePath, queryKey, labels) {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: [queryKey] });
  const save = useMutation({
    mutationFn: async ({ id, ...body }) =>
      id ? (await api.put(`${basePath}/${id}`, body)).data : (await api.post(basePath, body)).data,
    onSuccess: (_r, vars) => {
      refresh();
      toast.success(vars.id ? `${labels} updated` : `${labels} added`);
    },
  });
  const remove = useMutation({
    mutationFn: async (id) => (await api.delete(`${basePath}/${id}`)).data,
    onSuccess: () => {
      refresh();
      qc.invalidateQueries({ queryKey: ['glimpses'] });
      toast.success(`${labels} deleted`);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
  return { save, remove };
}

export const useResourceAdmin = () => useAdminSave('/resources', 'resources', 'Resource');
export const useGlimpseAdmin = () => useAdminSave('/glimpses', 'glimpses', 'Photo');
export const useAnnouncementAdmin = () =>
  useAdminSave('/announcements', 'announcements', 'Announcement');
