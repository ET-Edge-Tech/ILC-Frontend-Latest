import { MessageSquare } from 'lucide-react';
import Alert from '../../components/ui/Alert.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import { getErrorMessage } from '../../lib/api-client.js';
import { timeAgo } from '../../lib/format.js';
import { useAuthStore } from '../../store/auth-store.js';
import { useThreads } from './hooks.js';

// The inbox: one row per conversation, newest first, with the unread count.
export default function ThreadList({ activeId, onOpen, onFindMembers }) {
  const me = useAuthStore((s) => s.user);
  const { data: threads = [], isLoading, isError, error } = useThreads();

  if (isLoading)
    return <p className="p-6 text-center text-sm text-gray-600">Loading conversations…</p>;
  if (isError)
    return (
      <div className="p-4">
        <Alert>{getErrorMessage(error)}</Alert>
      </div>
    );

  if (threads.length === 0) {
    return (
      <div className="p-8 text-center">
        <MessageSquare className="mx-auto h-8 w-8 text-gray-300" aria-hidden="true" />
        <p className="mt-3 font-serif text-xl font-bold text-ilc-purple">No conversations yet</p>
        <p className="mt-1 text-sm text-gray-600">
          Find a fellow member in the directory and say hello.
        </p>
        <button
          type="button"
          onClick={onFindMembers}
          className="mt-4 text-xs font-bold tracking-widest text-ilc-purple uppercase hover:underline"
        >
          Open the directory
        </button>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-gray-100">
      {threads.map((t) => {
        const unread = t.unread_count > 0;
        return (
          <li key={t.partner.id}>
            <button
              type="button"
              onClick={() => onOpen(t.partner.id)}
              aria-current={activeId === t.partner.id ? 'true' : undefined}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-ilc-purple/5 ${activeId === t.partner.id ? 'bg-ilc-purple/5' : ''}`}
            >
              <Avatar
                name={t.partner.name}
                initials={t.partner.initials}
                src={t.partner.photo_url}
              />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span
                    className={`truncate text-sm ${unread ? 'font-bold text-ilc-ink' : 'font-semibold text-ilc-ink'}`}
                  >
                    {t.partner.name}
                  </span>
                  <span className="shrink-0 text-xs text-gray-600">
                    {timeAgo(t.last_message_at)}
                  </span>
                </span>
                <span className="flex items-center justify-between gap-2">
                  <span
                    className={`truncate text-xs ${unread ? 'font-semibold text-ilc-ink' : 'text-gray-600'}`}
                  >
                    {t.last_sender_id === me.id && 'You: '}
                    {t.last_message}
                  </span>
                  {unread && (
                    <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                      {t.unread_count > 9 ? '9+' : t.unread_count}
                      <span className="sr-only"> unread</span>
                    </span>
                  )}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
