import { useState } from 'react';
import { Link } from 'react-router-dom';
import Alert from '../../components/ui/Alert.jsx';
import Switch from '../../components/ui/Switch.jsx';
import { getErrorMessage } from '../../lib/api-client.js';
import { formatDateWithDay, formatTime } from '../../lib/format.js';
import { useEvents } from '../events/hooks.js';
import MeetingCard from './MeetingCard.jsx';
import MeetingRequestModal from './MeetingRequestModal.jsx';
import { useAttendees, useMyMeetings, useSetHidden } from './hooks.js';

// The window that suggests another time needs the event and its places.
function Suggest({ meeting, onClose }) {
  const { data: events = [] } = useEvents('upcoming');
  const event = events.find((e) => e.id === meeting.event.id);
  const { data } = useAttendees(meeting.event.id, true);
  if (!event || !data) return null;
  return <MeetingRequestModal event={event} counterOf={meeting} places={data.places} onClose={onClose} />;
}

// "My schedule": the events I am attending, my meetings, the ones waiting for my answer, and my calendar link.
export default function MySchedulePage() {
  const { data, isLoading, isError, error } = useMyMeetings();
  const { data: events = [] } = useEvents('upcoming');
  const hide = useSetHidden();
  const [suggesting, setSuggesting] = useState(null);
  const meetings = data?.meetings ?? [];
  const today = new Date().toISOString().slice(0, 10);

  const needsAnswer = meetings.filter((m) => m.can_respond);
  const upcoming = meetings.filter((m) => ['PENDING', 'ACCEPTED'].includes(m.status) && !m.can_respond && m.date >= today);
  const earlier = meetings.filter((m) => !needsAnswer.includes(m) && !upcoming.includes(m)).reverse();

  // One agenda: my attended events and my meetings, grouped by day.
  const days = (() => {
    const map = new Map();
    const add = (date, item) => map.set(date, [...(map.get(date) ?? []), item]);
    for (const e of events) if (e.is_booked && e.kind === 'ILC') add(e.date, { type: 'event', time: e.time ?? '', event: e });
    for (const m of upcoming) add(m.date, { type: 'meeting', time: m.time, meeting: m });
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, items]) => [date, items.sort((a, b) => a.time.localeCompare(b.time) || (a.type === 'event' ? -1 : 1))]);
  })();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="glass-card flex flex-wrap items-start justify-between gap-3 rounded-2xl p-5">
        <div>
          <h2 className="text-lg font-bold text-ilc-ink">My schedule</h2>
          <p className="mt-1 text-sm text-gray-700">Events you are attending and 15-minute meetings with other members.</p>
        </div>
        <label className="flex items-center gap-3 text-sm font-semibold text-ilc-ink">
          <Switch checked={Boolean(data?.hidden)} disabled={!data || hide.isPending} onChange={(v) => hide.mutate(v)} label="Hide me from meeting requests" />
          Hide me from requests
        </label>
      </div>

      {isError && <Alert>{getErrorMessage(error)}</Alert>}
      {isLoading && <div className="glass-card rounded-2xl p-10 text-center text-sm font-medium text-gray-700">Loading…</div>}

      {needsAnswer.length > 0 && (
        <section className="glass-card rounded-2xl border border-amber-300 p-5 sm:p-7" aria-label="Waiting for your answer">
          <h3 className="mb-3 text-lg font-bold text-ilc-ink">Waiting for your answer ({needsAnswer.length})</h3>
          <ul className="space-y-3">
            {needsAnswer.map((m) => (
              <MeetingCard key={m.id} meeting={m} showEvent onSuggest={setSuggesting} />
            ))}
          </ul>
        </section>
      )}

      <section className="glass-card rounded-2xl p-5 sm:p-7" aria-label="Coming up">
        <h3 className="mb-3 text-lg font-bold text-ilc-ink">Coming up</h3>
        {!isLoading && days.length === 0 && (
          <p className="text-sm text-gray-700">
            Nothing yet. Say Yes to an event on the <Link to="/events" className="font-bold text-ilc-purple hover:underline">Events page</Link>; if it has meetings, you can ask other members for 15 minutes.
          </p>
        )}
        <div className="space-y-5">
          {days.map(([date, items]) => (
            <div key={date}>
              <h4 className="mb-2 text-xs font-bold tracking-widest text-ilc-gold-deep uppercase">{formatDateWithDay(date)}</h4>
              <ul className="space-y-2">
                {items.map((it) =>
                  it.type === 'event' ? (
                    <li key={`e-${it.event.id}`} className="rounded-xl border border-ilc-purple/30 bg-ilc-purple/5 p-4">
                      <Link to={`/events/${it.event.id}`} className="font-bold text-ilc-purple hover:underline">
                        {it.event.title}
                      </Link>
                      <p className="text-sm text-gray-700">
                        {it.event.time ? `${formatTime(it.event.time)}${it.event.end_time ? ` – ${formatTime(it.event.end_time)}` : ''}` : 'All day'}
                        {it.event.location ? ` · ${it.event.location}` : ''}
                      </p>
                    </li>
                  ) : (
                    <MeetingCard key={it.meeting.id} meeting={it.meeting} showEvent onSuggest={setSuggesting} />
                  ),
                )}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {earlier.length > 0 && (
        <details className="glass-card rounded-2xl p-5 sm:p-7">
          <summary className="cursor-pointer text-sm font-bold text-ilc-purple">Earlier and closed meetings ({earlier.length})</summary>
          <ul className="mt-3 space-y-2">
            {earlier.map((m) => (
              <MeetingCard key={m.id} meeting={m} showEvent onSuggest={setSuggesting} />
            ))}
          </ul>
        </details>
      )}

      {suggesting && <Suggest meeting={suggesting} onClose={() => setSuggesting(null)} />}
    </div>
  );
}
