import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, LayoutList, MapPin } from 'lucide-react';
import Alert from '../../components/ui/Alert.jsx';
import { getErrorMessage } from '../../lib/api-client.js';
import { EventImage, EventKindChip, EventStateChip } from './EventParts.jsx';
import { whenText } from './event-utils.js';
import CalendarView from './CalendarView.jsx';
import { useEvents } from './hooks.js';
import SpocTabs from '../ops/SpocTabs.jsx';

const TABS = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
];

// The list view: upcoming or past events as square-picture cards.
function EventsList() {
  const [when, setWhen] = useState('upcoming');
  const { data: all = [], isLoading, isError, error } = useEvents(when);
  const [kind, setKind] = useState(''); // '' = everything, or ILC, or ET_EDGE
  const events = kind ? all.filter((e) => e.kind === kind) : all;
  const hasEtEdge = all.some((e) => e.kind === 'ET_EDGE');

  return (
    <div className="space-y-5">
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

      {hasEtEdge && (
        <div role="group" aria-label="Filter by type" className="flex flex-wrap gap-2">
          {[['', 'All events'], ['ILC', 'ILC events'], ['ET_EDGE', 'ET Edge events']].map(([value, label]) => (
            <button
              key={label}
              type="button"
              aria-pressed={kind === value}
              onClick={() => setKind(value)}
              className={`min-h-10 rounded-full border px-4 text-sm font-bold transition ${kind === value ? 'border-ilc-purple bg-ilc-purple text-white' : 'border-gray-300 bg-white text-gray-700 hover:bg-ilc-purple/5'}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

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
          <p className="mt-1 text-sm text-gray-600">
            {when === 'upcoming'
              ? 'New events will appear here as soon as they are announced.'
              : 'Events you have attended or missed will be listed here.'}
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {events.map((e) => (
            <li key={e.id}>
              <Link
                to={`/events/${e.id}`}
                className="glass-card group flex h-full flex-col overflow-hidden rounded-2xl transition hover:shadow-lg"
              >
                <EventImage
                  event={e}
                  className="transition duration-300 group-hover:scale-[1.02]"
                />
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1.5">
                    <h2 className="min-w-0 font-serif text-xl font-bold leading-snug break-words text-ilc-purple">{e.title}</h2>
                    <span className="flex flex-wrap gap-1.5">
                      <EventKindChip event={e} />
                      <EventStateChip event={e} />
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-ilc-ink">{whenText(e)}</p>
                  {e.location && (
                    <p className="flex items-center gap-1.5 text-xs text-gray-600">
                      <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> {e.location}
                    </p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// The member (and SPOC) events page, with a List | Calendar switch.
export default function EventsPage() {
  const [view, setView] = useState('list');
  const views = [
    { value: 'list', label: 'List', Icon: LayoutList },
    { value: 'calendar', label: 'Calendar', Icon: CalendarDays },
  ];

  return (
    <div className="space-y-5">
      <SpocTabs group="events" />
      <div role="group" aria-label="Choose a view" className="flex justify-end">
        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
          {views.map(({ value, label, Icon }) => (
            <button
              key={value}
              type="button"
              aria-pressed={view === value}
              onClick={() => setView(value)}
              className={`inline-flex min-h-9 items-center gap-1.5 rounded-md px-3 text-xs font-bold tracking-widest uppercase transition ${view === value ? 'bg-ilc-purple text-white' : 'text-gray-700 hover:text-ilc-purple'}`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" /> {label}
            </button>
          ))}
        </div>
      </div>
      {view === 'list' ? <EventsList /> : <CalendarView />}
    </div>
  );
}
