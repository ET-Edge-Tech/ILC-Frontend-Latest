import { Megaphone } from 'lucide-react';
import Alert from '../../components/ui/Alert.jsx';
import { getErrorMessage } from '../../lib/api-client.js';
import { formatDate } from '../../lib/format.js';
import { TYPE_STYLE } from './announcement-types.js';
import { useAnnouncements } from './hooks.js';

// Read-only feed of ILC announcements, newest first.
export default function AnnouncementsPage() {
  const { data: items = [], isLoading, isError, error } = useAnnouncements();

  if (isLoading)
    return <p className="py-10 text-center text-sm text-gray-600">Loading announcements…</p>;
  if (isError) return <Alert>{getErrorMessage(error)}</Alert>;

  if (items.length === 0) {
    return (
      <div className="glass-card mx-auto max-w-2xl rounded-2xl p-10 text-center">
        <Megaphone className="mx-auto h-8 w-8 text-gray-300" aria-hidden="true" />
        <p className="mt-3 font-serif text-xl font-bold text-ilc-purple">No announcements</p>
        <p className="mt-1 text-sm text-gray-600">Official news from ILC will appear here.</p>
      </div>
    );
  }

  return (
    <ul className="mx-auto max-w-3xl space-y-4">
      {items.map((a) => (
        <li key={a.id}>
          <article className="glass-card rounded-2xl p-5 sm:p-7">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wider uppercase ${TYPE_STYLE[a.type] ?? TYPE_STYLE.General}`}
              >
                {a.type}
              </span>
              <time dateTime={a.created_at} className="text-xs text-gray-600">
                {formatDate(a.created_at)}
              </time>
              {a.created_by_name && (
                <span className="text-xs text-gray-600">· {a.created_by_name}</span>
              )}
            </div>
            <h2 className="mt-2 font-serif text-2xl font-semibold text-ilc-purple">{a.title}</h2>
            {/* Plain text only: nothing typed here can run as code. */}
            <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-gray-600">
              {a.content}
            </p>
          </article>
        </li>
      ))}
    </ul>
  );
}
