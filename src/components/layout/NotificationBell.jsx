import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { timeAgo } from '../../lib/format.js';
import { useMarkAllRead, useMarkRead, useNotifications } from '../../features/notifications/hooks.js';

// Dot colour per kind of notification (Developer Guide, section 4).
const DOT = {
  approval: 'bg-emerald-500',
  event: 'bg-ilc-gold',
  meeting: 'bg-ilc-gold',
  spoc: 'bg-blue-500',
  broadcast: 'bg-ilc-purple',
  ops: 'bg-red-500',
  welcome: 'bg-emerald-500',
  tip: 'bg-ilc-gold',
  general: 'bg-gray-400',
};

export default function NotificationBell() {
  const { data } = useNotifications();
  const markRead = useMarkRead();
  const markAll = useMarkAllRead();
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);
  const notifications = data?.notifications ?? [];
  const unread = data?.unread ?? 0;

  // Click outside or Escape closes the dropdown.
  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => !boxRef.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-expanded={open}
        aria-haspopup="true"
        className="relative flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/10 lg:hover:bg-ilc-purple/5"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <span className="text-xs font-bold tracking-widest text-gray-700 uppercase">Notifications</span>
            {unread > 0 && (
              <button type="button" onClick={() => markAll.mutate()} className="text-xs font-semibold text-ilc-purple hover:underline">
                Mark all read
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-gray-600">
              <Bell className="mx-auto mb-2 h-6 w-6 text-gray-300" aria-hidden="true" />
              You are all caught up.
            </div>
          ) : (
            <ul className="max-h-96 overflow-y-auto">
              {notifications.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => !n.is_read && markRead.mutate(n.id)}
                    className={`flex w-full items-start gap-3 border-b border-gray-50 px-4 py-3 text-left hover:bg-gray-50 ${n.is_read ? '' : 'bg-blue-50/50'}`}
                  >
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT[n.type] ?? DOT.general}`} aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className={`block text-sm text-ilc-ink ${n.is_read ? '' : 'font-semibold'}`}>{n.title}</span>
                      {n.message && <span className="mt-0.5 block text-xs text-gray-600">{n.message}</span>}
                      <span className="mt-1 block text-xs text-gray-600">{timeAgo(n.created_at)}</span>
                    </span>
                    {!n.is_read && <span className="sr-only">(unread)</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
