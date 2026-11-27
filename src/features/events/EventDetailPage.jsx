import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ExternalLink, MapPin, Pencil, Trash2, UtensilsCrossed, XCircle } from 'lucide-react';
import Alert from '../../components/ui/Alert.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import Button from '../../components/ui/Button.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import { getErrorMessage } from '../../lib/api-client.js';
import { formatDate, formatDateWithDay, formatTime } from '../../lib/format.js';
import { useAuthStore } from '../../store/auth-store.js';
import EventMeetings from '../meetings/EventMeetings.jsx';
import SelectField from '../../components/ui/SelectField.jsx';
import { AddToCalendar, EventImage, EventKindChip } from './EventParts.jsx';
import MyEventPhotos from './MyEventPhotos.jsx';
import { STATUS_LABEL, useSetInterestStatus, useShowInterest, useWithdrawInterest } from './et-edge-hooks.js';
import { useBook, useDeleteEvent, useEvent, useRsvpNo } from './hooks.js';

const todayStr = () => new Date().toISOString().slice(0, 10);

function PersonRow({ person, showDate }) {
  return (
    <li className="flex items-center gap-3 py-2.5">
      <Avatar name={person.name} initials={person.initials} src={person.photo_url} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ilc-ink">{person.name}</p>
        <p className="truncate text-xs text-gray-600">
          {[person.title, person.organisation].filter(Boolean).join(' · ')}
        </p>
      </div>
      {showDate && (
        <span className="text-xs text-gray-600">{formatDate(person.booked_at)}</span>
      )}
    </li>
  );
}

// The three states a member can be in for an event, each with its own banner and button(s).
function RsvpBox({ event, past, busy, onYes, onNo }) {
  if (past) {
    return <Alert tone="warning">This event has already taken place.</Alert>;
  }
  if (event.is_booked) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <p className="flex items-center gap-2 font-semibold text-emerald-800">
          <CheckCircle2 className="h-5 w-5" aria-hidden="true" /> You&apos;re attending!
        </p>
        <p className="mt-1 mb-3 text-sm text-emerald-800">Put it in your calendar so you do not miss it.</p>
        <AddToCalendar event={event} />
        <Button
          variant="ghost"
          className="mt-3 w-auto border border-emerald-200 text-emerald-800 hover:bg-emerald-100"
          loading={busy}
          onClick={onNo}
        >
          Can&apos;t attend, change RSVP
        </Button>
      </div>
    );
  }
  if (event.is_rsvp_no) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <p className="flex items-center gap-2 font-semibold text-gray-700">
          <XCircle className="h-5 w-5" aria-hidden="true" /> You&apos;ve declined
        </p>
        <Button className="mt-3 w-auto" loading={busy} onClick={onYes}>
          Yes, I&apos;ll attend
        </Button>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="font-semibold text-ilc-ink">Will you attend?</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button className="sm:w-auto" loading={busy} onClick={onYes}>
          Yes, I&apos;ll attend
        </Button>
        <Button
          variant="ghost"
          className="border border-gray-200 sm:w-auto"
          disabled={busy}
          onClick={onNo}
        >
          No, can&apos;t make it
        </Button>
      </div>
    </div>
  );
}

// An ET Edge event is not booked here: the member says "I'm interested" and their relationship manager gets in touch.
function EtEdgeBox({ event, past, busy, onInterest, onWithdraw }) {
  if (past) return <Alert tone="warning">This event has already taken place.</Alert>;
  if (event.is_interested) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <p className="flex items-center gap-2 font-semibold text-emerald-800">
          <CheckCircle2 className="h-5 w-5" aria-hidden="true" /> Interest sent
        </p>
        <p className="mt-1 mb-3 text-sm text-emerald-800">
          {event.interest_status === 'NEW' && 'Your relationship manager has been told and will get in touch.'}
          {event.interest_status === 'CONTACTED' && 'Your relationship manager has been in touch.'}
          {event.interest_status === 'DONE' && 'All sorted. Your relationship manager has taken care of it.'}
        </p>
        <Button variant="ghost" className="w-auto border border-emerald-200 text-emerald-800 hover:bg-emerald-100" loading={busy} onClick={onWithdraw}>
          I am no longer interested
        </Button>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="font-semibold text-ilc-ink">Would you like to attend?</p>
      <p className="mt-1 text-sm text-gray-700">Tell us you are interested and your relationship manager will get in touch to take it forward.</p>
      <Button className="mt-3 sm:w-auto" loading={busy} onClick={onInterest}>
        I&apos;m interested
      </Button>
    </div>
  );
}

// Admins: who is interested in an ET Edge event, and where each request stands.
function InterestedList({ people }) {
  const set = useSetInterestStatus();
  return (
    <section className="glass-card rounded-2xl p-5 sm:p-7">
      <h3 className="mb-1 text-xs font-bold tracking-[0.25em] text-ilc-gold-deep uppercase">Interested ({people.length})</h3>
      {people.length === 0 ? (
        <p className="py-3 text-sm text-gray-700">No one has said they are interested yet.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {people.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-3 py-2.5">
              <Avatar name={r.member.name} initials={r.member.initials} src={r.member.photo_url} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-ilc-ink">{r.member.name}</p>
                <p className="truncate text-xs text-gray-700">{[r.member.title, r.member.organisation].filter(Boolean).join(' · ')}</p>
              </div>
              <SelectField
                className="w-40"
                aria-label={`Status for ${r.member.name}`}
                value={r.status}
                disabled={set.isPending}
                onChange={(e) => set.mutate({ id: r.id, status: e.target.value })}
                options={Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label }))}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// One event: details, my RSVP (members), the people attending, and admin tools.
export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isError, error } = useEvent(id);
  const book = useBook();
  const rsvpNo = useRsvpNo();
  const showInterest = useShowInterest();
  const withdraw = useWithdrawInterest();
  const remove = useDeleteEvent();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isMember = user.role === 'CEO';
  const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
  const mayCater = (user.permissions ?? []).some((p) => p === 'events.manage' || p === 'spoc.members');
  const base = isAdmin ? '/admin/events' : '/events';

  if (isLoading)
    return (
      <div className="glass-card mx-auto max-w-3xl rounded-2xl p-10 text-center text-sm text-gray-600">
        Loading event…
      </div>
    );
  if (isError) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Alert>{getErrorMessage(error)}</Alert>
        <Link to={base} className="text-sm font-semibold text-ilc-purple hover:underline">
          Back to events
        </Link>
      </div>
    );
  }

  // The attendee list is only ever sent to Admins.
  const { event, attendees, interested } = data;
  const past = event.date < todayStr();
  const isEtEdge = event.kind === 'ET_EDGE';

  const onYes = () => book.mutate(event.id);
  const meetingCounts = data.meetings; // Admins only: numbers, never who or what was said

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        to={base}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-ilc-purple hover:underline"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All events
      </Link>

      <section className="glass-card grid grid-cols-1 overflow-hidden rounded-2xl md:grid-cols-[14rem_minmax(0,1fr)] xl:grid-cols-[18rem_minmax(0,1fr)]">
        <div className="mx-auto w-full max-w-xs md:max-w-none">
          <EventImage event={event} />
        </div>
        <div className="space-y-4 p-5 sm:p-7">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-2">
              <EventKindChip event={event} />
              <h2 className="font-serif text-2xl font-semibold leading-tight text-ilc-purple xl:text-3xl">{event.title}</h2>
            </div>
            {isAdmin && (
              <div className="flex shrink-0 gap-1">
                <Link
                  to={`/admin/events/${event.id}/edit`}
                  aria-label="Edit event"
                  className="flex h-10 w-10 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100"
                >
                  <Pencil className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  aria-label="Delete event"
                  className="flex h-10 w-10 items-center justify-center rounded-full text-gray-600 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
          <dl className="space-y-1.5 text-sm text-gray-600">
            <div className="font-semibold text-ilc-ink">
              {formatDateWithDay(event.date)}
              {event.time && ` · ${formatTime(event.time)}`}
              {event.time && event.end_time && ` – ${formatTime(event.end_time)}`}
            </div>
            {event.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 shrink-0 text-gray-600" aria-hidden="true" />{' '}
                {event.location}
              </div>
            )}
          </dl>
          {event.description && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-600">
              {event.description}
            </p>
          )}
          {event.agenda?.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-bold tracking-[0.25em] text-ilc-gold-deep uppercase">Agenda</h3>
              <ol className="divide-y divide-gray-100 rounded-xl border border-gray-100 bg-white">
                {event.agenda.map((a, i) => (
                  <li key={i} className="flex gap-4 px-4 py-2.5 text-sm">
                    <span className="w-40 shrink-0 font-bold text-ilc-purple tabular-nums">
                      {formatTime(a.start)} – {formatTime(a.end)}
                    </span>
                    <span className="text-ilc-ink">{a.title}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          {mayCater && !isMember && !isEtEdge && (
            <Link
              to={`/events/${event.id}/catering`}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-bold text-ilc-purple hover:bg-ilc-purple/5"
            >
              <UtensilsCrossed className="h-4 w-4" aria-hidden="true" /> Catering list
            </Link>
          )}
          {isEtEdge && event.external_url && (
            <a
              href={event.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-bold text-ilc-purple hover:bg-ilc-purple/5"
            >
              Visit the event website <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          )}
          {isMember &&
            (isEtEdge ? (
              <EtEdgeBox
                event={event}
                past={past}
                busy={showInterest.isPending || withdraw.isPending}
                onInterest={() => showInterest.mutate(event.id)}
                onWithdraw={() => withdraw.mutate(event.id)}
              />
            ) : (
              <RsvpBox
                event={event}
                past={past}
                busy={book.isPending || rsvpNo.isPending}
                onYes={onYes}
                onNo={() => rsvpNo.mutate(event.id)}
              />
            ))}
        </div>
      </section>

      {isMember && !isEtEdge && event.is_booked && !past && event.meetings_enabled && <EventMeetings event={event} />}

      {isMember && !isEtEdge && event.is_booked && event.date <= todayStr() && <MyEventPhotos eventId={event.id} />}

      {isAdmin && event.meetings_enabled && meetingCounts && (
        <section className="glass-card rounded-2xl p-5 sm:p-7" aria-label="Member meetings">
          <h3 className="mb-1 text-xs font-bold tracking-[0.25em] text-ilc-gold-deep uppercase">Member meetings</h3>
          <p className="text-sm text-gray-700">
            {meetingCounts.accepted} confirmed · {meetingCounts.pending} waiting for an answer. Places: {event.meeting_places.length ? event.meeting_places.join(', ') : 'members type their own'}.
          </p>
        </section>
      )}

      {isAdmin && interested && <InterestedList people={interested} />}

      {isAdmin && attendees && (
        <section className="glass-card rounded-2xl p-5 sm:p-7">
          <h3 className="mb-1 text-xs font-bold tracking-[0.25em] text-ilc-gold-deep uppercase">
            Attending ({attendees.length})
          </h3>
          {attendees.length === 0 ? (
            <p className="py-3 text-sm text-gray-600">No one has confirmed yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {attendees.map((p) => (
                <PersonRow key={p.id} person={p} showDate />
              ))}
            </ul>
          )}
        </section>
      )}

      <ConfirmDialog
        open={confirmDelete}
        danger
        title="Delete this event?"
        confirmLabel="Delete event"
        loading={remove.isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => remove.mutate(event.id, { onSuccess: () => navigate('/admin/events') })}
      >
        <strong>{event.title}</strong> and all of its bookings and responses will be removed. This
        cannot be undone.
      </ConfirmDialog>
    </div>
  );
}
