import { Link } from 'react-router-dom';
import { ArrowRight, CalendarClock, Users } from 'lucide-react';
import Alert from '../../components/ui/Alert.jsx';
import { getErrorMessage } from '../../lib/api-client.js';
import { useAuthStore } from '../../store/auth-store.js';
import { useMyDay, useOpenMember, useOpsSummary } from './hooks.js';
import { SignalCard } from './parts.jsx';
import ReviewQueue from './ReviewQueue.jsx';
import { RISK } from './risk.js';

const TYPE_LABEL = {
  reminder: 'Reminder',
  alert: 'Needs attention',
  etedge: 'ET Edge request',
  photos: 'Photos',
  renewal: 'Renewal',
  birthday: 'Birthday',
  anniversary: 'Anniversary',
};

const heading = 'text-sm font-bold tracking-wide text-ilc-ink uppercase';

// The relationship manager's home: who needs them today, how their members are doing, and what to do first.
// Full width: alerts on the left, today's list and reviews on the right.
export default function SpocOverview() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isError, error } = useOpsSummary();
  const { data: day } = useMyDay();
  const openMember = useOpenMember();
  const today = day?.items ?? [];

  const cards = [
    { key: 'Green', value: data?.counts.Green },
    { key: 'Amber', value: data?.counts.Amber },
    { key: 'Red', value: data?.counts.Red },
  ];

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-[0.25em] text-ilc-gold-deep uppercase">Relationship Manager</p>
          <h2 className="mt-1 font-serif text-3xl font-semibold text-ilc-purple sm:text-4xl">Welcome, {user.name}</h2>
          <p className="mt-1 text-base text-gray-700">
            {isLoading
              ? 'Loading your members…'
              : data?.total
                ? `You look after ${data.total} member${data.total === 1 ? '' : 's'}.`
                : 'No members are assigned to you yet.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/spoc/today" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-ilc-purple px-5 text-sm font-bold text-white hover:bg-ilc-ink">
            <CalendarClock className="h-4 w-4" aria-hidden="true" /> My day
          </Link>
          <Link to="/spoc/members" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 text-sm font-bold text-ilc-purple hover:bg-ilc-purple/5">
            <Users className="h-4 w-4" aria-hidden="true" /> My members
          </Link>
        </div>
      </div>

      {isError && <Alert>{getErrorMessage(error)}</Alert>}

      <section aria-label="At a glance" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Link to="/spoc/today" className="glass-card flex items-center gap-4 rounded-2xl p-5 transition hover:shadow-md">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-ilc-purple text-3xl font-bold text-white">
            {day ? today.length : '–'}
          </span>
          <span>
            <span className="block text-base font-bold text-ilc-purple">To do today</span>
            <span className="block text-sm text-gray-600">Reminders, alerts, photos</span>
          </span>
        </Link>
        {cards.map((c) => {
          const r = RISK[c.key];
          return (
            <Link key={c.key} to="/spoc/members" className="glass-card flex items-center gap-4 rounded-2xl p-5 transition hover:shadow-md">
              <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl font-bold ${r.solid}`}>
                {isLoading ? '–' : (c.value ?? 0)}
              </span>
              <span>
                <span className={`block text-base font-bold ${r.text}`}>{r.label}</span>
                <span className="block text-sm text-gray-600">{r.hint}</span>
              </span>
            </Link>
          );
        })}
      </section>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
        <section aria-label="Do these first" className="space-y-3 xl:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className={heading}>Do these first</h3>
            <Link to="/spoc/signals" className="inline-flex items-center gap-1 text-sm font-bold text-ilc-purple hover:underline">
              See all {data?.open_signals ?? 0} alerts <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          {!isLoading && data?.top_signals.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 text-center">
              <p className="font-serif text-xl font-bold text-ilc-purple">All clear</p>
              <p className="mt-1 text-base text-gray-700">Nobody needs a call right now.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data?.top_signals.map((s) => (
                <SignalCard key={`${s.member_id}-${s.code}`} signal={s} onOpen={openMember} />
              ))}
            </div>
          )}
        </section>

        <div className="space-y-6">
          <ReviewQueue />
          <section aria-label="Today" className="glass-card rounded-2xl p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className={heading}>Today</h3>
              <Link to="/spoc/today" className="inline-flex items-center gap-1 text-sm font-bold text-ilc-purple hover:underline">
                Open <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            {day && today.length === 0 && <p className="text-sm text-gray-700">You are all caught up.</p>}
            <ul className="divide-y divide-gray-100">
              {today.slice(0, 6).map((it) => (
                <li key={it.key} className="py-2.5">
                  <Link to={it.to} className="block text-sm font-semibold text-ilc-ink hover:text-ilc-purple hover:underline">
                    {it.title}
                  </Link>
                  <span className="text-xs font-semibold text-gray-600">{TYPE_LABEL[it.type] ?? ''}</span>
                </li>
              ))}
            </ul>
            {today.length > 6 && <p className="mt-2 text-xs text-gray-600">and {today.length - 6} more in My day.</p>}
          </section>
        </div>
      </div>
    </div>
  );
}
