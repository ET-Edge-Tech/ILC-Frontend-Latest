import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { useAuthStore } from '../../store/auth-store.js';
import { useChatStore } from '../../store/chat-store.js';
import { toast } from '../../store/toast-store.js';
import { appendMessage } from './hooks.js';

// The API address without "/api" is where the live connection lives.
const SOCKET_URL = new URL(import.meta.env.VITE_API_URL).origin;

const preview = (text) => (text.length > 90 ? `${text.slice(0, 90)}…` : text);

// Keeps one live connection open while a member is signed in. Live events update the same
// TanStack Query data the screens already use, so nothing else needs to know about sockets.
// Renders nothing.
export default function SocketProvider() {
  const token = useAuthStore((s) => s.token);
  const role = useAuthStore((s) => s.user?.role);
  const qc = useQueryClient();

  useEffect(() => {
    if (!token || !role) return undefined; // every signed-in role keeps a live line, so the server can sign them out at once

    const socket = io(SOCKET_URL, { auth: { token } });

    const refreshLists = () => {
      qc.invalidateQueries({ queryKey: ['chat', 'threads'] });
      qc.invalidateQueries({ queryKey: ['chat', 'unread'] });
    };

    socket.on('new_message', ({ message, sender }) => {
      qc.setQueryData(['chat', 'conversation', sender.id], (c) => appendMessage(c, message));
      refreshLists();
      // No pop-up when you are already looking at that conversation.
      const looking =
        useChatStore.getState().activePartnerId === sender.id &&
        document.visibilityState === 'visible';
      if (!looking) {
        toast.message({
          title: sender.name,
          message: preview(message.message),
          to: `/council?tab=inbox&chat=${sender.id}`,
        });
      }
    });

    // Your own message sent from another tab or device.
    socket.on('message_sent', ({ message }) => {
      qc.setQueryData(['chat', 'conversation', message.recipient_id], (c) =>
        appendMessage(c, message),
      );
      qc.invalidateQueries({ queryKey: ['chat', 'threads'] });
    });

    // You read a conversation in another tab.
    socket.on('conversation_read', refreshLists);

    // After a reconnect, catch up on anything that arrived while offline.
    socket.io.on('reconnect', () => qc.invalidateQueries({ queryKey: ['chat'] }));

    // Someone changed what this person may do: refresh the stored permissions so the menu follows at once.
    socket.on('permissions_changed', () => qc.invalidateQueries({ queryKey: ['me'] }));

    // The account was deleted or switched off: sign out straight away.
    socket.on('session_ended', () => useAuthStore.getState().logout({ expired: true }));

    // The server refused the connection: the session is no longer valid.
    socket.on('connect_error', (err) => {
      if (err.message === 'Unauthorized') useAuthStore.getState().logout({ expired: true });
    });

    return () => socket.disconnect(); // runs on sign-out too
  }, [token, role, qc]);

  return null;
}
