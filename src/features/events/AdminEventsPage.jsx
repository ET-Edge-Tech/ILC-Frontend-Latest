import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Plus } from 'lucide-react';
import Alert from '../../components/ui/Alert.jsx';
import { getErrorMessage } from '../../lib/api-client.js';
import { formatDateWithDay, formatTime } from '../../lib/format.js';
import { EventImage } from './EventParts.jsx';
import { useEvents } from './hooks.js';

const TABS = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
];

// How many people said yes (Admins only: members never see this).
function Seats({ event }) {
  return <span className="text-sm text-gray-700">{event.booking_count ?? 0}</span>;
}

// Admin list: every event with how many are attending. Click a row for the attendees, edit and delete.
export default function AdminEventsPage() {
  const [when, setWhen] = useState('upcoming');
  const { data: events = [], isLoading, isError, error } = useEvents(when);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Show events"
          className="inline-flex rounded-lg border border-gray-200 bg-white p-1"
        >
          {TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={when === t.value}
              onClick={() => setWhen(t.value)}
              className={`min-h-9 rounded-md px-4 text-xs font-bold tracking-widest uppercase transition ${when === t.value ? 'bg-ilc-purple text-white' : 'text-gray-700 hover:text-ilc-purple'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Link
          to="/admin/events/new"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-ilc-purple px-5 text-xs font-bold tracking-widest whitespace-nowrap text-white uppercase hover:bg-ilc-ink"
        >
          <Plus className="h-4 w-4" aria-hidden="true" /> Create event
        </Link>
      </div>

      {isError && <Alert>{getErrorMessage(error)}</Alert>}

      {isLoading ? (
        <div className="glass-card rounded-2xl p-10 text-center text-sm text-gray-600">
          Loading events…
        </div>
      ) : events.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center">
          <p className="font-serif text-xl font-bold text-ilc-purple">
            {when === 'upcoming' ? 'No upcoming events' : 'No past events'}
          </p>
          {when === 'upcoming' && (
            <p className="mt-1 text-sm text-gray-600">Create your first event to open bookings.</p>
          )}
        </div>
      ) : (
        <ul className="space-y-3">
          {events.map((e) => (
            <li key={e.id}>
              <Link
                to={`/admin/events/${e.id}`}
                className="glass-card flex items-center gap-4 rounded-2xl p-3 transition hover:shadow-md sm:p-4"
              >
                <div className="w-16 shrink-0 overflow-hidden rounded-lg sm:w-20">
                  <EventImage event={e} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-serif text-xl font-bold text-ilc-purple">{e.title}</p>
                  <p className="truncate text-xs text-gray-600">
                    {formatDateWithDay(e.date)}
                    {e.time && ` · ${formatTime(e.time)}`}
                    {e.location && ` · ${e.location}`}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-xs font-bold tracking-widest text-gray-700 uppercase">
                    {e.kind === 'ET_EDGE' ? (
                      <>
                        <span className="rounded-full bg-ilc-gold/25 px-2.5 py-0.5 text-ilc-ink normal-case">ET Edge</span> Interested {e.interested_count ?? 0}
                      </>
                    ) : (
                      <>
                        Booked <Seats event={e} />
                      </>
                    )}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-gray-300" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
