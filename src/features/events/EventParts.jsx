import { useState } from 'react';
import { CalendarDays, CalendarPlus } from 'lucide-react';
import { googleCalendarUrl, outlookCalendarUrl } from '../../lib/calendar.js';
import { formatDateWithDay } from '../../lib/format.js';
import { eventStateChip } from './event-utils.js';

// Event picture: a tall poster (3:4). Without a picture (or if the link is broken), a branded placeholder shows the date.
export function EventImage({ event, className = '' }) {
  const [broken, setBroken] = useState(false);
  if (event.image_url && !broken) {
    return (
      <img
        src={event.image_url}
        alt=""
        loading="lazy"
        onError={() => setBroken(true)}
        className={`aspect-[3/4] w-full object-cover ${className}`}
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      className={`flex aspect-[3/4] w-full flex-col items-center justify-center bg-gradient-to-br from-ilc-sidebar to-ilc-purple px-2 text-center text-white ${className}`}
    >
      <CalendarDays className="h-10 w-10 text-ilc-gold" />
      <span className="mt-2 text-xs leading-snug font-bold tracking-widest uppercase">
        {formatDateWithDay(event.date)}
      </span>
    </div>
  );
}

// A small gold tag on ET Edge events, so they are told apart from ILC events.
export function EventKindChip({ event }) {
  if (event.kind !== 'ET_EDGE') return null;
  return <span className="inline-block rounded-full bg-ilc-gold/25 px-2.5 py-0.5 text-xs font-bold whitespace-nowrap text-ilc-ink">ET Edge</span>;
}

export function EventStateChip({ event }) {
  const chip = eventStateChip(event);
  if (!chip) return null;
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wider whitespace-nowrap uppercase ${chip.cls}`}
    >
      {chip.label}
    </span>
  );
}

const calBtn =
  'inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 text-xs font-bold tracking-widest text-ilc-purple uppercase hover:bg-ilc-purple/5';

// Put the event in a calendar: Google Calendar, or Teams / Outlook (work accounts), with a small link for personal Outlook.com.
export function AddToCalendar({ event }) {
  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Add to calendar">
      <a href={googleCalendarUrl(event)} target="_blank" rel="noopener noreferrer" className={calBtn}>
        <CalendarPlus className="h-4 w-4" aria-hidden="true" /> Google Calendar
      </a>
      <a href={outlookCalendarUrl(event)} target="_blank" rel="noopener noreferrer" className={calBtn}>
        <CalendarPlus className="h-4 w-4" aria-hidden="true" /> Teams / Outlook
      </a>
      <a href={outlookCalendarUrl(event, { work: false })} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-gray-700 underline hover:text-ilc-purple">
        Personal Outlook.com
      </a>
    </div>
  );
}
