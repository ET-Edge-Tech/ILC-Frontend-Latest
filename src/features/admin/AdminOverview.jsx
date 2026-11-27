import { Link } from 'react-router-dom';
import {
  CalendarClock,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  FileClock,
  TimerOff,
  UserPlus,
  Users,
} from 'lucide-react';
import Alert from '../../components/ui/Alert.jsx';
import { getErrorMessage } from '../../lib/api-client.js';
import { useAuthStore } from '../../store/auth-store.js';
import { can } from '../auth/routing.js';
import { useStats } from '../members/hooks.js';

// Row 1: where members are in the journey. Row 2: things that need chasing.
const MEMBER_CARDS = [
  {
    key: 'total',
    label: 'Total members',
    icon: Users,
    to: '/admin/members',
    tone: 'text-ilc-purple',
  },
  {
    key: 'pending',
    label: 'Needs review',
    icon: ClipboardCheck,
    to: '/admin/members?status=SUBMITTED',
    tone: 'text-amber-600',
  },
  {
    key: 'approved',
    label: 'Approved',
    icon: ClipboardList,
    to: '/admin/members?status=APPROVED',
    tone: 'text-emerald-600',
  },
  {
    key: 'pending_form',
    label: 'Waiting for the form',
    icon: FileClock,
    to: '/admin/form-progress',
    tone: 'text-gray-600',
  },
];

const ATTENTION_CARDS = [
  {
    key: 'expiring_30',
    label: 'Renewals due in 30 days',
    icon: CalendarClock,
    to: '/admin/members',
    tone: 'text-amber-600',
  },
  {
    key: 'expired',
    label: 'Expired memberships',
    icon: TimerOff,
    to: '/admin/members',
    tone: 'text-red-600',
  },
  {
    key: 'upcoming_events',
    label: 'Upcoming events',
    icon: CalendarDays,
    to: '/admin/events',
    tone: 'text-ilc-purple',
  },
];

function Cards({ cards, data, isLoading, columns }) {
  return (
    <div className={`grid grid-cols-2 gap-3 lg:gap-4 ${columns}`}>
      {cards.map(({ key, label, icon: Icon, to, tone }) => (
        <Link
          key={key}
          to={to}
          className="glass-card group rounded-2xl p-4 transition hover:shadow-md lg:p-5"
        >
          <Icon className={`h-5 w-5 ${tone}`} aria-hidden="true" />
          <p className="mt-3 text-4xl tabular-nums font-bold text-ilc-ink">
            {isLoading ? '–' : (data?.[key] ?? 0)}
          </p>
          <p className="mt-1 text-xs font-bold tracking-widest text-gray-700 uppercase">{label}</p>
        </Link>
      ))}
    </div>
  );
}

const linkBtn =
  'inline-flex min-h-11 items-center gap-2 rounded-lg border border-gray-200 px-5 text-xs font-bold tracking-widest text-ilc-purple uppercase hover:bg-ilc-purple/5';

export default function AdminOverview() {
  const user = useAuthStore((s) => s.user);
  // Only ask for the member numbers if this person may see them (the server checks too).
  const canMembers = can(user, 'members.manage');
  const { data, isLoading, isError, error } = useStats(canMembers);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold tracking-[0.3em] text-ilc-gold-deep uppercase">
          {user.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
        </p>
        <h2 className="mt-1 font-serif text-3xl font-semibold text-ilc-purple">
          Welcome, {user.name}
        </h2>
      </div>

      {canMembers && isError && <Alert>{getErrorMessage(error)}</Alert>}

      {!canMembers && (
        <div className="glass-card rounded-2xl p-6">
          <p className="text-base font-bold text-ilc-ink">
            Use the menu to open what you have access to.
          </p>
          <p className="mt-1 text-sm text-gray-700">
            If something you need is missing, ask the Super Admin.
          </p>
        </div>
      )}

      {canMembers && (
        <section aria-label="Members">
          <Cards cards={MEMBER_CARDS} data={data} isLoading={isLoading} columns="lg:grid-cols-4" />
        </section>
      )}

      {canMembers && (
        <section aria-label="Needs attention">
          <h3 className="mb-3 text-xs font-bold tracking-[0.25em] text-ilc-gold-deep uppercase">
            Needs attention
          </h3>
          <Cards
            cards={ATTENTION_CARDS}
            data={data}
            isLoading={isLoading}
            columns="sm:grid-cols-3 lg:grid-cols-3"
          />
        </section>
      )}

      <div className="flex flex-wrap gap-2">
        {canMembers && (
          <Link
            to="/admin/members/new"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-ilc-purple px-5 text-xs font-bold tracking-widest text-white uppercase hover:bg-ilc-ink"
          >
            <UserPlus className="h-4 w-4" aria-hidden="true" /> Add member
          </Link>
        )}
        {can(user, 'broadcast.send') && (
          <Link to="/admin/broadcast" className={linkBtn}>
            Send a broadcast
          </Link>
        )}
        {can(user, 'forms.view') && (
          <Link to="/admin/form-progress" className={linkBtn}>
            Form progress
          </Link>
        )}
        {canMembers && (
          <Link to="/admin/pending-invites" className={linkBtn}>
            Pending invites
          </Link>
        )}
      </div>
    </div>
  );
}
