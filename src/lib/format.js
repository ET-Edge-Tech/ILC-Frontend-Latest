// "2026-11-17" -> "17 Nov 2026". Takes a YYYY-MM-DD string or an ISO date-time.
export function formatDate(value) {
  if (!value) return '—';
  const d = new Date(String(value).length === 10 ? `${value}T00:00:00Z` : value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

const todayStr = () => new Date().toISOString().slice(0, 10);

// Whole days from today until a YYYY-MM-DD date (negative when it has passed). null when there is no date.
export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const ms = new Date(`${dateStr}T00:00:00Z`) - new Date(`${todayStr()}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}

// "5m ago", "3h ago", "2d ago", or the date for older items.
export function timeAgo(iso) {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 7 * 86_400) return `${Math.floor(seconds / 86_400)}d ago`;
  return formatDate(iso);
}

// Membership end: red when expired, amber within 30 days, plain otherwise.
export function expiryInfo(membershipEnd) {
  const days = daysUntil(membershipEnd);
  if (days === null) return { tone: 'none', label: 'No end date', days };
  if (days < 0) return { tone: 'expired', label: `Expired ${-days}d ago`, days };
  if (days <= 30) return { tone: 'soon', label: `${days}d left`, days };
  return { tone: 'ok', label: `${days}d left`, days };
}

// "18:30" -> "6:30 PM"
export function formatTime(hhmm) {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${period}`;
}

// "Fri, 05 Dec 2026"
export function formatDateWithDay(value) {
  if (!value) return '—';
  return new Date(`${value}T00:00:00Z`).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

// "6:42 pm" in the viewer's own time zone.
export function formatClock(iso) {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
}

// "Today", "Yesterday" or "05 Dec 2026" for the day separators in a conversation.
export function dayLabel(iso) {
  const d = new Date(iso);
  const day = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((day(new Date()) - day(d)) / 86_400_000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
