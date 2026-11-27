import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage } from '../../lib/api-client.js';
import { toast } from '../../store/toast-store.js';

export function useMembers({ search = '', status = '' } = {}) {
  return useQuery({
    queryKey: ['members', { search, status }],
    queryFn: async () => {
      const params = {};
      if (search) params.search = search;
      if (status) params.status = status;
      return (await api.get('/admin/users', { params })).data.users;
    },
    placeholderData: keepPreviousData,
  });
}

export function useMember(id) {
  return useQuery({
    queryKey: ['members', 'one', id],
    queryFn: async () => (await api.get(`/admin/users/${id}`)).data.user,
  });
}

export function useStats(enabled = true) {
  return useQuery({ queryKey: ['stats'], enabled, queryFn: async () => (await api.get('/admin/stats')).data });
}

// The saved designations for the "Title" drop-down.
export function useDesignations() {
  return useQuery({
    queryKey: ['designations'],
    queryFn: async () => (await api.get('/designations')).data.designations,
    staleTime: 60_000,
  });
}

export function useSettings() {
  return useQuery({ queryKey: ['settings'], queryFn: async () => (await api.get('/admin/settings')).data });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body) => (await api.put('/admin/settings', body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function usePendingInvites() {
  return useQuery({ queryKey: ['pending-invites'], queryFn: async () => (await api.get('/admin/pending-invites')).data.pending });
}

// Runs one admin action on a member, refreshes every list that shows members, and shows a message.
function useMemberAction(request, successMessage) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: request,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['members'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
      qc.invalidateQueries({ queryKey: ['pending-invites'] });
      qc.invalidateQueries({ queryKey: ['spocs'] });
      qc.invalidateQueries({ queryKey: ['designations'] }); // a new title may have been added
      qc.invalidateQueries({ queryKey: ['notifications'] });
      toast.success(typeof successMessage === 'function' ? successMessage(res) : successMessage);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export const useCreateMember = () =>
  useMemberAction(async (body) => (await api.post('/admin/users', body)).data, 'Member created. A welcome email is on its way.');

export const useUpdateMember = () =>
  useMemberAction(async ({ id, ...body }) => (await api.patch(`/admin/users/${id}`, body)).data, 'Details saved');

export const useUpdateMembership = () =>
  useMemberAction(async ({ id, ...body }) => (await api.patch(`/admin/users/${id}/membership`, body)).data, 'Membership dates updated');

export const useExtendYear = () =>
  useMemberAction(async (id) => (await api.post(`/admin/users/${id}/extend-year`)).data, 'Membership extended by one year');

export const useAssignSpoc = () =>
  useMemberAction(async ({ id, spocId }) => (await api.patch(`/admin/users/${id}/assign-spoc`, { spocId })).data, 'SPOC updated');

export const useApprove = () =>
  useMemberAction(async (id) => (await api.patch(`/admin/users/${id}/approve`)).data, 'Member approved');

export const useReject = () =>
  useMemberAction(async (id) => (await api.patch(`/admin/users/${id}/reject`)).data, 'Sent back to pending');

export const useApproveMany = () =>
  useMemberAction(async (ids) => (await api.post('/admin/users/approve-many', { ids })).data, (r) => r.message);

export const useMarkSubmitted = () =>
  useMemberAction(async (id) => (await api.patch(`/admin/users/${id}/mark-submitted`)).data, 'Marked as submitted');

export const useSoftDelete = () =>
  useMemberAction(async (id) => (await api.delete(`/admin/users/${id}`)).data, (r) => r.message);

export const useHardDelete = () =>
  useMemberAction(async ({ id, confirm_name }) => (await api.post(`/admin/users/${id}/hard-delete`, { confirm_name })).data, (r) => r.message);

export const useBulkCreate = () =>
  useMemberAction(async (users) => (await api.post('/admin/users/bulk', { users })).data, (r) => r.message);

export const useSendInvites = () =>
  useMemberAction(async () => (await api.post('/admin/pending-invites/send')).data, (r) => r.message);
