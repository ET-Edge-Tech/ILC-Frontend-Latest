import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage } from '../../lib/api-client.js';
import { toast } from '../../store/toast-store.js';

// Adds a message to a loaded conversation, once (the same message can arrive from the reply and from the live event).
export function appendMessage(conversation, message) {
  if (!conversation) return conversation;
  if (conversation.messages.some((m) => m.id === message.id)) return conversation;
  return { ...conversation, messages: [...conversation.messages, message] };
}

export function useThreads() {
  return useQuery({
    queryKey: ['chat', 'threads'],
    queryFn: async () => (await api.get('/chat/threads')).data.threads,
  });
}

export function useUnread(enabled = true) {
  return useQuery({
    queryKey: ['chat', 'unread'],
    queryFn: async () => (await api.get('/chat/unread-count')).data.unread,
    enabled,
  });
}

export function useConversation(partnerId) {
  return useQuery({
    queryKey: ['chat', 'conversation', partnerId],
    queryFn: async () => (await api.get(`/chat/conversations/${partnerId}`)).data,
    enabled: Boolean(partnerId),
    staleTime: 0,
  });
}

// Fetches the messages before the oldest one shown and puts them at the top.
export function useLoadOlder(partnerId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (before) =>
      (await api.get(`/chat/conversations/${partnerId}`, { params: { before } })).data,
    onSuccess: (older) => {
      qc.setQueryData(['chat', 'conversation', partnerId], (current) =>
        current
          ? {
              ...current,
              messages: [...older.messages, ...current.messages],
              has_more: older.has_more,
            }
          : current,
      );
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useSendMessage(partnerId) {
  const qc = useQueryClient();
  return useMutation({
    // `message` is the text; `attachmentFileId` is a file already uploaded through /api/uploads (kind "chat").
    mutationFn: async ({ message, attachmentFileId }) =>
      (await api.post('/chat/messages', { recipientId: partnerId, message, attachmentFileId })).data.message,
    onSuccess: (message) => {
      qc.setQueryData(['chat', 'conversation', partnerId], (c) => appendMessage(c, message));
      qc.invalidateQueries({ queryKey: ['chat', 'threads'] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

// Opening a conversation marks the other person's messages as read.
export function useMarkRead(partnerId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => (await api.patch(`/chat/conversations/${partnerId}/read`)).data,
    onSuccess: () => {
      // Mark their messages as read in the open conversation too. Without this the screen still saw "unread",
      // asked the server to mark them read again and again, and used up the request allowance.
      qc.setQueryData(['chat', 'conversation', partnerId], (c) =>
        c ? { ...c, messages: c.messages.map((m) => (m.sender_id === partnerId ? { ...m, is_read: true } : m)) } : c,
      );
      qc.invalidateQueries({ queryKey: ['chat', 'unread'] });
      qc.invalidateQueries({ queryKey: ['chat', 'threads'] });
    },
  });
}

export function useDirectory(search, industry = '') {
  return useQuery({
    queryKey: ['chat', 'members', search, industry],
    queryFn: async () =>
      (await api.get('/members', { params: { ...(search && { search }), ...(industry && { industry }) } })).data.members,
    staleTime: 60_000,
    placeholderData: (previous) => previous, // keep the old list on screen while a filter loads
  });
}
