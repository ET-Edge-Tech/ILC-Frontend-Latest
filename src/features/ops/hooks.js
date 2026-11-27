import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api, getErrorMessage } from '../../lib/api-client.js';
import { useAuthStore } from '../../store/auth-store.js';
import { saveBlob } from '../../lib/download.js';
import { toast } from '../../store/toast-store.js';

// A SPOC works through /spoc/ops (their own members only); an Admin through /admin/ops (everyone).
// The server decides the scope from the sign-in, so this only picks the address.
function useBase() {
  const role = useAuthStore((s) => s.user.role);
  return role === 'SPOC' ? '/spoc/ops' : '/admin/ops';
}

// Opens one member as a full page: /spoc/members/:id for a SPOC, /admin/ops/members/:id for an Admin.
export function useOpenMember() {
  const role = useAuthStore((s) => s.user.role);
  const navigate = useNavigate();
  return (id) => navigate(`${role === 'SPOC' ? '/spoc/members' : '/admin/ops/members'}/${id}`);
}

export function useOpsSummary() {
  const base = useBase();
  return useQuery({
    queryKey: ['ops', base, 'summary'],
    queryFn: async () => (await api.get(`${base}/summary`)).data,
  });
}

export function useOpsSignals() {
  const base = useBase();
  return useQuery({
    queryKey: ['ops', base, 'signals'],
    queryFn: async () => (await api.get(`${base}/signals`)).data.signals,
  });
}

export function useOpsMembers() {
  const base = useBase();
  return useQuery({
    queryKey: ['ops', base, 'members'],
    queryFn: async () => (await api.get(`${base}/members`)).data.members,
  });
}

export function useOpsJourney() {
  const base = useBase();
  return useQuery({
    queryKey: ['ops', base, 'journey'],
    queryFn: async () => (await api.get(`${base}/journey`)).data,
  });
}

// Admin only: health across every member and each SPOC's portfolio.
export function useOpsDashboard() {
  return useQuery({
    queryKey: ['ops', 'dashboard'],
    queryFn: async () => (await api.get('/admin/ops/dashboard')).data,
  });
}

// Admin only: the rules and times Admins can change, and the standard values to reset to.
export function useOpsSettings() {
  return useQuery({
    queryKey: ['ops', 'settings'],
    queryFn: async () => (await api.get('/admin/ops/settings')).data,
    staleTime: 0,
  });
}

// Saving or resetting changes what every signal says, so every Operations list is refreshed.
function useSettingsAction(request, success) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: request,
    onSuccess: (data) => {
      qc.setQueryData(['ops', 'settings'], data);
      qc.invalidateQueries({ queryKey: ['ops'] });
      toast.success(success(data));
    },
  });
}

export const useSaveOpsSettings = () =>
  useSettingsAction(
    async (rules) => (await api.put('/admin/ops/settings', rules)).data,
    (d) => (d.changed?.length ? 'Settings saved. They apply from now on.' : 'Nothing was changed.'),
  );

export const useResetOpsSettings = () =>
  useSettingsAction(async () => (await api.post('/admin/ops/settings/reset')).data, () => 'Back to the standard settings');

export function useOpsMember(id) {
  const base = useBase();
  return useQuery({
    queryKey: ['ops', base, 'member', id],
    queryFn: async () => (await api.get(`${base}/members/${id}`)).data,
    enabled: Boolean(id),
    staleTime: 0,
  });
}

// One mutation for every change to a member's tracker. The server answers with the fresh member,
// which replaces the cached copy; the lists and the summary refresh in the background.
function useOpsAction(id, request, success) {
  const base = useBase();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: request(base),
    onSuccess: (detail) => {
      qc.setQueryData(['ops', base, 'member', id], detail);
      qc.invalidateQueries({ queryKey: ['ops', base, 'members'] });
      qc.invalidateQueries({ queryKey: ['ops', base, 'signals'] });
      qc.invalidateQueries({ queryKey: ['ops', base, 'summary'] });
      qc.invalidateQueries({ queryKey: ['ops', base, 'journey'] });
      qc.invalidateQueries({ queryKey: ['ops', 'dashboard'] });
      if (success) toast.success(success);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export const useUpdateTracker = (id) =>
  useOpsAction(id, (base) => async (patch) => (await api.patch(`${base}/members/${id}`, patch)).data, 'Saved');

export const useLogTouchpoint = (id) =>
  useOpsAction(id, (base) => async () => (await api.post(`${base}/members/${id}/touchpoint`)).data, 'Touchpoint logged for today');

export const useRecordAttendance = (id) =>
  useOpsAction(id, (base) => async (result) => (await api.post(`${base}/members/${id}/attendance`, { result })).data);

export const useAddNote = (id) =>
  useOpsAction(id, (base) => async (note) => (await api.post(`${base}/members/${id}/notes`, note)).data, 'Note added');

export const useDeleteNote = (id) =>
  useOpsAction(id, (base) => async (noteId) => (await api.delete(`${base}/members/${id}/notes/${noteId}`)).data, 'Note deleted');

// SPOC only: change a member's membership dates. The server answers with a message, so the member is re-read.
export function useSetMembership(id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dates) => (await api.patch(`/spoc/members/${id}/membership`, dates)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ops'] });
      toast.success('Membership dates saved');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

// SPOC only: their own members waiting for a decision, and approve or send back.
export function useSpocReview(enabled) {
  return useQuery({
    queryKey: ['spoc-review'],
    queryFn: async () => (await api.get('/spoc/review')).data.members,
    enabled,
  });
}

export function useReviewAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, action }) => (await api.post(`/spoc/members/${id}/${action}`)).data,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['spoc-review'] });
      qc.invalidateQueries({ queryKey: ['ops'] });
      toast.success(res.message);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export const useResolveSignal = (id) =>
  useOpsAction(id, (base) => async (code) => (await api.post(`${base}/members/${id}/signals/resolve`, { code })).data, 'Signal resolved');

// Interests: what a member likes (golf, F1 ...). Tags already in use are suggested while typing.
export function useInterestTags() {
  const base = useBase();
  return useQuery({
    queryKey: ['ops', base, 'interest-tags'],
    queryFn: async () => (await api.get(`${base}/interest-tags`)).data.tags,
    staleTime: 5 * 60_000,
  });
}

export const useAddInterest = (id) =>
  useOpsAction(id, (base) => async (tag) => (await api.post(`${base}/members/${id}/interests`, { tag })).data, 'Interest added');

export const useRemoveInterest = (id) =>
  useOpsAction(id, (base) => async (interestId) => (await api.delete(`${base}/members/${id}/interests/${interestId}`)).data);

// SPOC only: "remind me on this date" about a member.
export const useAddReminder = (id) =>
  useOpsAction(id, (base) => async (body) => (await api.post(`${base}/members/${id}/reminders`, body)).data, 'Reminder set');

export const useRemoveReminder = (id) =>
  useOpsAction(id, (base) => async (reminderId) => (await api.delete(`${base}/members/${id}/reminders/${reminderId}`)).data);

// SPOC only: "My day" (one list of everything to do) and the member timeline.
export function useMyDay() {
  return useQuery({
    queryKey: ['ops', 'my-day'],
    queryFn: async () => (await api.get('/spoc/ops/today')).data,
    staleTime: 0,
  });
}

function useTaskAction(request, success) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: request,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ops'] });
      toast.success(success);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export const useTaskDone = () => useTaskAction(async (key) => (await api.post('/spoc/ops/today/done', { key })).data, 'Done');

export const useTaskSnooze = () =>
  useTaskAction(async ({ key, days }) => (await api.post('/spoc/ops/today/snooze', { key, days })).data, 'Snoozed. It will come back.');

export function useTimeline(id) {
  const base = useBase();
  return useQuery({
    queryKey: ['ops', base, 'timeline', id],
    queryFn: async () => (await api.get(`${base}/members/${id}/timeline`)).data,
    enabled: Boolean(id),
    staleTime: 0,
  });
}

// SPOC only: group actions, introductions and the after-event list.
function useGroupAction(request, success) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: request,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['ops'] });
      toast.success(success ? success(res) : res.message);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export const useGroupMessage = () => useGroupAction(async (body) => (await api.post('/spoc/ops/groups/message', body)).data);
export const useGroupLog = () => useGroupAction(async (body) => (await api.post('/spoc/ops/groups/log', body)).data);
export const useIntroduce = () => useGroupAction(async (body) => (await api.post('/spoc/ops/introductions', body)).data);

export function useGroupExport() {
  return useMutation({
    mutationFn: async (ids) => (await api.post('/spoc/ops/groups/export', { member_ids: ids }, { responseType: 'blob' })).data,
    onSuccess: (blob) => saveBlob(blob, 'members.csv'),
    onError: () => toast.error('The list could not be downloaded. Please try again.'),
  });
}

export function useAfterEvent(eventId) {
  return useQuery({
    queryKey: ['ops', 'after-event', eventId],
    queryFn: async () => (await api.get(`/spoc/ops/events/${eventId}/after`)).data,
    enabled: Boolean(eventId),
    staleTime: 0,
  });
}

// The Year Plans page: tick standard checkpoints, and add, change or remove the member's own plan items.
export function useJourneyEdits() {
  const base = useBase();
  const qc = useQueryClient();
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['ops', base] });
    qc.invalidateQueries({ queryKey: ['ops', 'dashboard'] });
  };
  const opts = (success) => ({
    onSuccess: () => {
      refresh();
      if (success) toast.success(success);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
  return {
    checkpoint: useMutation({
      mutationFn: async ({ memberId, field, value }) => (await api.patch(`${base}/members/${memberId}`, { [field]: value })).data,
      ...opts(),
    }),
    add: useMutation({
      mutationFn: async ({ memberId, ...item }) => (await api.post(`${base}/members/${memberId}/plan`, item)).data,
      ...opts('Added to the plan'),
    }),
    update: useMutation({
      mutationFn: async ({ memberId, itemId, ...patch }) => (await api.patch(`${base}/members/${memberId}/plan/${itemId}`, patch)).data,
      ...opts(),
    }),
    remove: useMutation({
      mutationFn: async ({ memberId, itemId }) => (await api.delete(`${base}/members/${memberId}/plan/${itemId}`)).data,
      ...opts('Removed from the plan'),
    }),
  };
}

// The member's onboarding form answers, read-only (the relationship manager's own members only).
export function useMemberForm(id) {
  const base = useBase();
  return useQuery({
    queryKey: ['ops', base, 'form', id],
    queryFn: async () => (await api.get(`${base}/members/${id}/form`)).data,
    enabled: Boolean(id),
  });
}

// ---- benefits ("entitlement tracker") ----

export function useBenefitTypes() {
  const base = useBase();
  return useQuery({ queryKey: ['ops', base, 'benefit-types'], queryFn: async () => (await api.get(`${base}/benefits`)).data.benefits });
}

export function useSaveBenefitTypes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (benefits) => (await api.put('/admin/ops/benefits', { benefits })).data.benefits,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ops'] });
      toast.success('Benefits saved');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useMemberBenefits(id) {
  const base = useBase();
  return useQuery({ queryKey: ['ops', base, 'benefits', id], queryFn: async () => (await api.get(`${base}/members/${id}/benefits`)).data, enabled: Boolean(id) });
}

export function useBenefitUse(id) {
  const base = useBase();
  const qc = useQueryClient();
  const done = (data, msg) => {
    qc.setQueryData(['ops', base, 'benefits', id], data);
    qc.invalidateQueries({ queryKey: ['ops', base, 'members'] });
    qc.invalidateQueries({ queryKey: ['ops', base, 'signals'] });
    qc.invalidateQueries({ queryKey: ['ops', base, 'summary'] });
    toast.success(msg);
  };
  return {
    add: useMutation({
      mutationFn: async ({ benefitId, used_on, note }) => (await api.post(`${base}/members/${id}/benefits/${benefitId}/uses`, { used_on, note })).data,
      onSuccess: (d) => done(d, 'Marked as used'),
      onError: (e) => toast.error(getErrorMessage(e)),
    }),
    remove: useMutation({
      mutationFn: async (useId) => (await api.delete(`${base}/members/${id}/benefits/uses/${useId}`)).data,
      onSuccess: (d) => done(d, 'Removed'),
      onError: (e) => toast.error(getErrorMessage(e)),
    }),
  };
}

// The relationship manager's calendar: everything dated in one month ("YYYY-MM").
export function useOpsCalendar(month) {
  return useQuery({
    queryKey: ['ops', '/spoc/ops', 'calendar', month],
    queryFn: async () => (await api.get('/spoc/ops/calendar', { params: { month } })).data,
    placeholderData: keepPreviousData,
  });
}
