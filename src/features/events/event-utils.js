import { formatDateWithDay, formatTime } from '../../lib/format.js';

// One short label about the viewer's own state for this event (or null).
export function eventStateChip(event) {
  // An ET Edge event has no attending: only "Interest sent".
  if (event.kind === 'ET_EDGE') return event.is_interested ? { label: 'Interest sent', cls: 'bg-emerald-100 text-emerald-700' } : null;
  if (event.is_booked) return { label: "You're attending", cls: 'bg-emerald-100 text-emerald-700' };
  if (event.is_rsvp_no) return { label: 'Declined', cls: 'bg-gray-100 text-gray-600' };
  return null;
}

// "Fri, 05 Dec 2026 · 6:30 PM"
export const whenText = (event) =>
  [formatDateWithDay(event.date), event.time && event.end_time ? `${formatTime(event.time)} – ${formatTime(event.end_time)}` : formatTime(event.time)].filter(Boolean).join(' · ');
