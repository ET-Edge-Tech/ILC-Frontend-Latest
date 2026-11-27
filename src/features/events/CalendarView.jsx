import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Alert from '../../components/ui/Alert.jsx';
import { getErrorMessage } from '../../lib/api-client.js';
import { formatDateWithDay, formatTime } from '../../lib/format.js';
import { EventStateChip } from './EventParts.jsx';
import { useEvents } from './hooks.js';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const pad = (n) => String(n).padStart(2, '0');
const key = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;

// Colour of an event by what the viewer has done about it.
function tone(e) {
  if (e.is_booked) return 'bg-emerald-100 text-emerald-800';
  if (e.is_rsvp_no) return 'bg-gray-100 text-gray-600 line-through';
  return 'bg-ilc-purple/10 text-ilc-purple';
}
const dot = (e) => (e.is_booked ? 'bg-emerald-500' : e.is_rsvp_no ? 'bg-gray-300' : 'bg-ilc-purple');

// Builds the weeks (Monday first) for one month. Every cell is { date: 'YYYY-MM-DD', day, inMonth }.
function buildWeeks(year, month) {
  const first = new Date(Date.UTC(year, month, 1));
  const lead = (first.getUTCDay() + 6) % 7; // days from the previous month shown first
  const start = new Date(Date.UTC(year, month, 1 - lead));
  const weeks = [];
  for (let w = 0; w < 6; w += 1) {
    const row = [];
    for (let d = 0; d < 7; d += 1) {
      const cell = new Date(start.getTime() + (w * 7 + d) * 86_400_000);
      row.push({
        date: key(cell.getUTCFullYear(), cell.getUTCMonth(), cell.getUTCDate()),
        day: cell.getUTCDate(),
        inMonth: cell.getUTCMonth() === month,
      });
    }
    weeks.push(row);
  }
  // Drop a last row that is entirely the next month.
  return weeks[5].every((c) => !c.inMonth) ? weeks.slice(0, 5) : weeks;
}

// A month grid of the same events as the list.
export default function CalendarView() {
  const now = new Date();
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const { data: events = [], isLoading, isError, error } = useEvents('all');
  const todayKey = key(now.getFullYear(), now.getMonth(), now.getDate());

  const weeks = useMemo(() => buildWeeks(cursor.year, cursor.month), [cursor]);
  const byDate = useMemo(() => {
    const map = new Map();
    for (const e of events) map.set(e.date, [...(map.get(e.date) ?? []), e]);
    return map;
  }, [events]);
  const monthPrefix = `${cursor.year}-${pad(cursor.month + 1)}`;
  const thisMonth = events.filter((e) => e.date.startsWith(monthPrefix));

  const title = new Date(Date.UTC(cursor.year, cursor.month, 1)).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
  const move = (delta) =>
    setCursor(({ year, month }) => {
      const d = new Date(Date.UTC(year, month + delta, 1));
      return { year: d.getUTCFullYear(), month: d.getUTCMonth() };
    });
  const navBtn =
    'flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-ilc-purple hover:bg-ilc-purple/5';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-serif text-2xl font-semibold text-ilc-purple" aria-live="polite">
          {title}
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCursor({ year: now.getFullYear(), month: now.getMonth() })}
            className="min-h-10 rounded-full border border-gray-200 bg-white px-4 text-xs font-bold tracking-widest text-ilc-purple uppercase hover:bg-ilc-purple/5"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => move(-1)}
            aria-label="Previous month"
            className={navBtn}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button type="button" onClick={() => move(1)} aria-label="Next month" className={navBtn}>
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {isError && <Alert>{getErrorMessage(error)}</Alert>}

      <div
        className="glass-card overflow-hidden rounded-2xl"
        role="grid"
        aria-label={`Events in ${title}`}
        aria-busy={isLoading}
      >
        <div
          role="row"
          className="grid grid-cols-7 border-b border-gray-100 bg-white/60 text-center text-xs font-bold tracking-widest text-gray-700 uppercase"
        >
          {WEEKDAYS.map((d) => (
            <div key={d} role="columnheader" className="py-2">
              {d}
            </div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} role="row" className="grid grid-cols-7">
            {week.map((c) => {
              const list = byDate.get(c.date) ?? [];
              return (
                <div
                  key={c.date}
                  role="gridcell"
                  className={`min-h-16 border-r border-b border-gray-50 p-1 last:border-r-0 sm:min-h-24 sm:p-1.5 ${c.inMonth ? 'bg-white/70' : 'bg-gray-50/60 text-gray-300'}`}
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${c.date === todayKey ? 'bg-ilc-gold text-ilc-sidebar' : c.inMonth ? 'text-ilc-ink' : ''}`}
                  >
                    {c.day}
                  </span>
                  {/* Wide screens: titles. Phones: small coloured dots (the list below has the details). */}
                  <div className="mt-1 hidden space-y-1 sm:block">
                    {list.slice(0, 2).map((e) => (
                      <Link
                        key={e.id}
                        to={`/events/${e.id}`}
                        title={e.title}
                        className={`block truncate rounded px-1.5 py-0.5 text-xs font-semibold ${tone(e)}`}
                      >
                        {e.title}
                      </Link>
                    ))}
                    {list.length > 2 && (
                      <span className="block px-1 text-xs text-gray-600">
                        +{list.length - 2} more
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-0.5 sm:hidden" aria-hidden="true">
                    {list.map((e) => (
                      <span key={e.id} className={`h-1.5 w-1.5 rounded-full ${dot(e)}`} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <section aria-label={`Events in ${title}`}>
        <h3 className="mb-2 text-xs font-bold tracking-[0.25em] text-ilc-gold-deep uppercase">
          This month
        </h3>
        {thisMonth.length === 0 ? (
          <p className="text-sm text-gray-600">No events this month.</p>
        ) : (
          <ul className="space-y-2">
            {thisMonth.map((e) => (
              <li key={e.id}>
                <Link
                  to={`/events/${e.id}`}
                  className="glass-card flex items-center gap-3 rounded-xl p-3 transition hover:shadow-md"
                >
                  <span className={`h-8 w-1 shrink-0 rounded-full ${dot(e)}`} aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ilc-ink">
                      {e.title}
                    </span>
                    <span className="block truncate text-xs text-gray-600">
                      {formatDateWithDay(e.date)}
                      {e.time && ` · ${formatTime(e.time)}`}
                      {e.location && ` · ${e.location}`}
                    </span>
                  </span>
                  <EventStateChip event={e} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
