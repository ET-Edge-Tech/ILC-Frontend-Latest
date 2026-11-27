import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock } from 'lucide-react';
import Alert from '../../components/ui/Alert.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import Button from '../../components/ui/Button.jsx';
import Switch from '../../components/ui/Switch.jsx';
import { formatTime } from '../../lib/format.js';
import MeetingCard from './MeetingCard.jsx';
import { STATUS } from './status.js';
import MeetingRequestModal from './MeetingRequestModal.jsx';
import { useAttendees, useMyMeetings, useSetHidden } from './hooks.js';

// On an event page, for a member who said Yes: meet the other attendees for 15 minutes.
export default function EventMeetings({ event }) {
  const { data, isLoading, isError } = useAttendees(event.id, true);
  const { data: mine } = useMyMeetings();
  const hide = useSetHidden();
  const [asking, setAsking] = useState(null); // the attendee being asked
  const [suggesting, setSuggesting] = useState(null); // the meeting being answered with another time
  const here = (mine?.meetings ?? []).filter((m) => m.event.id === event.id && ['PENDING', 'ACCEPTED'].includes(m.status));
  const attendees = data?.attendees ?? [];

  return (
    <section className="glass-card rounded-2xl p-5 sm:p-7" aria-label="Meet other members">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-ilc-ink">Meet other members</h3>
          <p className="mt-0.5 text-sm text-gray-700">
            Ask anyone attending for 15 minutes between {formatTime(event.time)} and {formatTime(event.end_time)}. Only people who said Yes are listed.
          </p>
        </div>
        <label className="flex items-center gap-3 text-sm font-semibold text-ilc-ink">
          <Switch checked={Boolean(data?.hidden)} disabled={!data || hide.isPending} onChange={(v) => hide.mutate(v)} label="Hide me from meeting requests" />
          Hide me from requests
        </label>
      </div>

      {data?.hidden && <Alert tone="warning" className="mt-3">You are hidden: others cannot ask you for a meeting, and you cannot ask them.</Alert>}

      {here.length > 0 && (
        <div className="mt-4">
          <h4 className="mb-2 text-xs font-bold tracking-widest text-ilc-gold-deep uppercase">Your meetings here</h4>
          <ul className="space-y-2">
            {here.map((m) => (
              <MeetingCard key={m.id} meeting={m} onSuggest={(x) => setSuggesting(x)} />
            ))}
          </ul>
          <Link to="/meetings" className="mt-2 inline-block text-xs font-bold text-ilc-purple hover:underline">
            See my whole schedule
          </Link>
        </div>
      )}

      <h4 className="mt-5 mb-2 text-xs font-bold tracking-widest text-ilc-gold-deep uppercase">Who is attending ({attendees.length})</h4>
      {isLoading && <p className="text-sm text-gray-700">Loading…</p>}
      {isError && <Alert>Could not load the attendees. Please refresh.</Alert>}
      {data && attendees.length === 0 && <p className="text-sm text-gray-700">No one else is open to meetings yet. Check back later.</p>}
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {attendees.map((p) => (
          <li key={p.id} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3">
            <Avatar name={p.name} initials={p.initials} src={p.photo_url} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-ilc-ink">{p.name}</p>
              <p className="truncate text-xs text-gray-700">{[p.title, p.organisation].filter(Boolean).join(' · ')}</p>
            </div>
            {p.meeting_status ? (
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${STATUS[p.meeting_status].cls}`}>{p.meeting_status === 'ACCEPTED' ? 'Meeting set' : 'Request sent'}</span>
            ) : (
              <Button className="w-auto shrink-0" disabled={Boolean(data?.hidden)} onClick={() => setAsking(p)}>
                <CalendarClock className="h-4 w-4" aria-hidden="true" /> Meet
              </Button>
            )}
          </li>
        ))}
      </ul>

      {asking && <MeetingRequestModal event={event} person={asking} places={data?.places ?? []} onClose={() => setAsking(null)} />}
      {suggesting && <MeetingRequestModal event={event} counterOf={suggesting} places={data?.places ?? []} onClose={() => setSuggesting(null)} />}
    </section>
  );
}
