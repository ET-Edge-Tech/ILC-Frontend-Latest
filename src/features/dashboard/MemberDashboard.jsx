import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  MapPin,
  Megaphone,
  MessageCircle,
  Star,
  Users,
} from 'lucide-react';
import Alert from '../../components/ui/Alert.jsx';
import SpocCard from '../../components/ui/SpocCard.jsx';
import { getErrorMessage } from '../../lib/api-client.js';
import { expiryInfo, formatDate, timeAgo } from '../../lib/format.js';
import { useAuthStore } from '../../store/auth-store.js';
import { useSessionRefresh } from '../auth/hooks.js';
import { useUnread } from '../chat/hooks.js';
import { useAnnouncements, useGlimpses } from '../content/hooks.js';
import { AddToCalendar, EventImage, EventStateChip } from '../events/EventParts.jsx';
import { whenText } from '../events/event-utils.js';
import { useEvents } from '../events/hooks.js';
import { useMarkRead, useNotifications } from '../notifications/hooks.js';
import IndustryPrompt from '../industries/IndustryPrompt.jsx';
import { useMyJourney } from './hooks.js';

// Amber within 30 days, red within 7. Nothing at all when there is plenty of time.
function MembershipBanner({ membershipEnd }) {
  const { days } = expiryInfo(membershipEnd);
  if (days === null || days > 30 || days < 0) return null;
  const urgent = days <= 7;
  const tone = urgent
    ? 'border-red-200 bg-red-50 text-red-800'
    : 'border-amber-200 bg-amber-50 text-amber-900';
  return (
    <div role="status" className={`flex items-start gap-3 rounded-2xl border p-4 ${tone}`}>
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <div className="text-sm">
        <p className="font-semibold">
          Your membership ends on {formatDate(membershipEnd)}
          {days === 0 ? ' (today)' : ` (${days} day${days === 1 ? '' : 's'} left)`}.
        </p>
        <p className="mt-0.5 opacity-80">
          To renew, please get in touch with your relationship manager.
        </p>
      </div>
    </div>
  );
}

const Heading = ({ children, to, linkLabel }) => (
  <div className="mb-3 flex items-center justify-between gap-3">
    <h3 className="text-xs font-bold tracking-[0.25em] text-ilc-gold-deep uppercase">{children}</h3>
    {to && (
      <Link
        to={to}
        className="inline-flex items-center gap-1 text-xs font-bold tracking-widest text-ilc-purple uppercase hover:underline"
      >
        {linkLabel} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
    )}
  </div>
);

// Shown once, at the top, after a member's first sign-in. "Got it" marks it read and it never comes back.
function WelcomeBanner() {
  const { data: notes } = useNotifications();
  const markRead = useMarkRead();
  const welcome = (notes?.notifications ?? []).find((n) => n.type === 'welcome' && !n.is_read);
  if (!welcome) return null;
  return (
    <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
      <div className="min-w-0">
        <p className="font-serif text-xl font-bold">{welcome.title}</p>
        <p className="text-sm opacity-80">{welcome.message}</p>
      </div>
      <button
        type="button"
        onClick={() => markRead.mutate(welcome.id)}
        className="inline-flex min-h-10 items-center rounded-lg bg-emerald-700 px-4 text-xs font-bold tracking-widest text-white uppercase hover:bg-emerald-800"
      >
        Got it
      </button>
    </div>
  );
}

// The next event as a large poster card, then the next two as small rows.
function NextUp() {
  const { data: events = [], isLoading, isError, error } = useEvents('upcoming');
  const [next, ...rest] = events;
  const more = rest.slice(0, 2);

  return (
    <section aria-label="Next up">
      <Heading to="/events" linkLabel="All events">
        Next up
      </Heading>
      {isError && <Alert>{getErrorMessage(error)}</Alert>}
      {isLoading ? (
        <div className="glass-card rounded-2xl p-8 text-center text-sm text-gray-600">Loading events…</div>
      ) : !next ? (
        <div className="glass-card rounded-2xl p-8 text-center">
          <CalendarDays className="mx-auto h-6 w-6 text-gray-300" aria-hidden="true" />
          <p className="mt-2 font-serif text-lg font-bold text-ilc-purple">No upcoming events</p>
          <p className="mt-1 text-sm text-gray-600">New events will appear here once announced.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <article className="glass-card grid grid-cols-[7.5rem_minmax(0,1fr)] overflow-hidden rounded-2xl sm:grid-cols-[11rem_minmax(0,1fr)]">
            <Link to={`/events/${next.id}`} aria-label={next.title}>
              <EventImage event={next} className="h-full" />
            </Link>
            <div className="flex min-w-0 flex-col gap-2 p-4 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-ilc-gold/15 px-2.5 py-0.5 text-xs font-bold tracking-wider text-ilc-gold-deep uppercase">
                  Coming up
                </span>
                <EventStateChip event={next} />
              </div>
              <h4 className="font-serif text-xl font-semibold leading-snug text-ilc-purple sm:text-2xl">{next.title}</h4>
              <p className="text-sm font-semibold text-ilc-ink">{whenText(next)}</p>
              {next.location && (
                <p className="flex items-center gap-1.5 text-sm text-gray-600">
                  <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" /> {next.location}
                </p>
              )}
              <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
                <Link
                  to={`/events/${next.id}`}
                  className="inline-flex min-h-10 items-center rounded-lg bg-ilc-purple px-4 text-xs font-bold tracking-widest text-white uppercase hover:bg-ilc-ink"
                >
                  {next.is_booked || next.kind === 'ET_EDGE' ? 'View event' : 'Will you attend?'}
                </Link>
              </div>
              {next.is_booked && <AddToCalendar event={next} />}
            </div>
          </article>

          {more.length > 0 && (
            <ul className="space-y-2" aria-label="Also coming up">
              {more.map((e) => (
                <li key={e.id}>
                  <Link
                    to={`/events/${e.id}`}
                    className="glass-card flex items-center gap-3 rounded-2xl p-3 transition hover:shadow-md"
                  >
                    <div className="w-12 shrink-0 overflow-hidden rounded-lg">
                      <EventImage event={e} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-serif text-base font-bold text-ilc-purple">{e.title}</p>
                      <p className="truncate text-xs text-gray-600">{whenText(e)}</p>
                    </div>
                    <EventStateChip event={e} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

const TAG = {
  Broadcast: 'bg-ilc-purple/10 text-ilc-purple',
  Notice: 'bg-ilc-gold/15 text-ilc-gold-deep',
  Announcement: 'bg-sky-100 text-sky-700',
};

// Announcements, broadcasts and notices from ILC in one list. Unread ones are highlighted.
function FromIlc() {
  const { data: announcements = [] } = useAnnouncements();
  const { data: notes } = useNotifications();
  const markRead = useMarkRead();

  const items = [
    ...announcements.slice(0, 4).map((a) => ({
      key: `a${a.id}`,
      tag: 'Announcement',
      title: a.title,
      text: a.content,
      at: a.created_at,
      to: '/announcements',
    })),
    ...(notes?.notifications ?? [])
      .filter((n) => n.type === 'broadcast' || n.type === 'general')
      .filter((n) => n.title !== 'Welcome to ILC')
      .slice(0, 5)
      .map((n) => ({
        key: `n${n.id}`,
        tag: n.type === 'broadcast' ? 'Broadcast' : 'Notice',
        title: n.title,
        text: n.message,
        at: n.created_at,
        unread: !n.is_read,
        noteId: n.id,
      })),
  ]
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 5);

  return (
    <section aria-label="From ILC">
      <Heading to="/announcements" linkLabel="All announcements">
        From ILC
      </Heading>
      {items.length === 0 ? (
        <div className="glass-card rounded-2xl p-8 text-center">
          <Megaphone className="mx-auto h-6 w-6 text-gray-300" aria-hidden="true" />
          <p className="mt-2 font-serif text-lg font-bold text-ilc-purple">Nothing new</p>
          <p className="mt-1 text-sm text-gray-600">Announcements and messages from ILC appear here.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((it) => {
            const body = (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wider uppercase ${TAG[it.tag]}`}>
                    {it.tag}
                  </span>
                  <span className="text-xs text-gray-600">{timeAgo(it.at)}</span>
                  {it.unread && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold tracking-wider text-red-600 uppercase">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500" aria-hidden="true" /> New
                    </span>
                  )}
                </div>
                <p className="mt-1.5 font-serif text-lg font-bold leading-snug text-ilc-purple">{it.title}</p>
                {it.text && <p className="mt-0.5 line-clamp-2 text-sm text-gray-600">{it.text}</p>}
              </>
            );
            const cls = `glass-card block w-full rounded-2xl p-4 text-left transition hover:shadow-md ${it.unread ? 'ring-1 ring-ilc-gold/50' : ''}`;
            return (
              <li key={it.key}>
                {it.to ? (
                  <Link to={it.to} className={cls}>
                    {body}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => it.unread && markRead.mutate(it.noteId)}
                    className={cls}
                    aria-label={it.unread ? `${it.title} (new, tap to mark as read)` : it.title}
                  >
                    {body}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

const STATUS_CHIP = {
  Published: 'bg-emerald-100 text-emerald-700',
  'In Production': 'bg-amber-100 text-amber-800',
  Scheduled: 'bg-amber-100 text-amber-800',
  'Not Started': 'bg-gray-100 text-gray-600',
};

// The member's own year: which month they are in and how their video, article and book are going.
function YourYear() {
  const { data: j } = useMyJourney();
  if (!j) return null;
  return (
    <section aria-label="Your year with ILC" className="glass-card rounded-2xl p-5">
      <h3 className="text-xs font-bold tracking-[0.25em] text-ilc-gold-deep uppercase">Your year with ILC</h3>
      <p className="mt-2 font-serif text-2xl font-semibold text-ilc-purple">
        Month {j.month} <span className="text-base text-gray-600">of 12</span>
      </p>
      <div
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={12}
        aria-valuenow={j.month}
        aria-label={`Month ${j.month} of 12`}
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100"
      >
        <div className="h-full rounded-full bg-ilc-gold" style={{ width: `${Math.round((j.month / 12) * 100)}%` }} />
      </div>
      <p className="mt-3 text-sm font-semibold text-ilc-ink">{j.title}</p>
      <p className="text-sm text-gray-600">{j.touchpoint}</p>
      {j.next && (
        <p className="mt-2 text-xs text-gray-600">
          Next: month {j.next.month}, {j.next.title}
        </p>
      )}
      <ul className="mt-4 space-y-1.5" aria-label="Your benefits">
        {j.entitlements.map((e) => (
          <li key={e.key} className="flex items-center justify-between gap-2 text-sm">
            <span className="text-gray-600">{e.label}</span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wider uppercase ${STATUS_CHIP[e.status] ?? STATUS_CHIP['Not Started']}`}>
              {e.status}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function QuickTiles() {
  const { data: unread = 0 } = useUnread();
  const { data: glimpses = [] } = useGlimpses();
  const saved = glimpses.filter((g) => g.is_bookmarked).length;
  const tiles = [
    { to: '/council', label: 'Messages', icon: MessageCircle, badge: unread > 0 ? `${unread} new` : null },
    { to: '/resources?section=glimpses&saved=1', label: 'Saved photos', icon: Star, badge: saved ? String(saved) : null },
    { to: '/council', label: 'The Council', icon: Users },
    { to: '/resources', label: 'Knowledge', icon: BookOpen },
  ];
  return (
    <nav aria-label="Quick links" className="grid grid-cols-2 gap-3">
      {tiles.map(({ to, label, icon: Icon, badge }) => (
        <Link
          key={label}
          to={to}
          className="glass-card relative flex flex-col items-start gap-2 rounded-2xl p-4 transition hover:shadow-md"
        >
          <Icon className="h-5 w-5 text-ilc-purple" aria-hidden="true" />
          <span className="text-xs font-bold tracking-widest text-ilc-purple uppercase">{label}</span>
          {badge && (
            <span className="absolute top-3 right-3 rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
              {badge}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}

// The member's home page.
export default function MemberDashboard() {
  const user = useAuthStore((s) => s.user);
  const { data: me, isError, error } = useSessionRefresh();
  const first = user.name.trim().split(/\s+/)[0];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div>
        <p className="text-xs font-bold tracking-[0.3em] text-ilc-gold-deep uppercase">Member</p>
        <h2 className="mt-1 font-serif text-3xl font-semibold text-ilc-purple sm:text-4xl">Welcome back, {first}</h2>
      </div>

      {isError && <Alert>{getErrorMessage(error)}</Alert>}
      <WelcomeBanner />
      <IndustryPrompt />
      {me?.membership_end && <MembershipBanner membershipEnd={me.membership_end} />}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-6">
          <NextUp />
          <FromIlc />
        </div>
        <div className="min-w-0 space-y-6">
          {/* Invisible heading: pushes this column down so its first card lines up with "Next up" on wide screens. */}
          <div className="-mb-3 hidden text-xs leading-4 xl:block" aria-hidden="true">&nbsp;</div>
          {me?.spoc && <SpocCard spoc={me.spoc} />}
          <YourYear />
          <QuickTiles />
        </div>
      </div>
    </div>
  );
}
