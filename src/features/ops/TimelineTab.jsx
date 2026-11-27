import Alert from '../../components/ui/Alert.jsx';
import { getErrorMessage } from '../../lib/api-client.js';
import { formatDate } from '../../lib/format.js';
import { useTimeline } from './hooks.js';

const DOT = {
  joined: 'bg-emerald-500',
  event: 'bg-ilc-gold',
  event_no: 'bg-gray-400',
  etedge: 'bg-blue-500',
  note: 'bg-ilc-purple',
  interest: 'bg-pink-500',
};

const Fact = ({ label, value }) => (
  <div>
    <dt className="text-xs font-bold tracking-widest text-gray-700 uppercase">{label}</dt>
    <dd className="mt-0.5 text-sm font-semibold text-ilc-ink">{value || '—'}</dd>
  </div>
);

// One view of a member: key facts from the form, what is coming up, and everything that has happened. Never chat.
export default function TimelineTab({ id }) {
  const { data, isLoading, isError, error } = useTimeline(id);
  if (isLoading) return <div className="glass-card rounded-2xl p-8 text-center text-sm font-medium text-gray-700">Loading…</div>;
  if (isError) return <Alert>{getErrorMessage(error)}</Alert>;
  const { member: m, upcoming, entries } = data;

  return (
    <div className="space-y-5">
      <section className="glass-card rounded-2xl p-5 sm:p-6" aria-label="Key facts">
        <h3 className="mb-3 text-xs font-bold tracking-[0.25em] text-ilc-gold-deep uppercase">Key facts</h3>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Fact label="Industry" value={m.industry} />
          <Fact label="City" value={m.city} />
          <Fact label="Tier" value={m.tier} />
          <Fact label="Joined" value={m.joined ? formatDate(m.joined) : null} />
          <Fact label="Date of birth" value={m.born ? formatDate(m.born) : null} />
          <Fact label="Food preference" value={m.diet} />
          <div className="col-span-2 sm:col-span-3">
            <Fact label="Allergies and food restrictions" value={m.restrictions} />
          </div>
        </dl>
        <p className="mt-3 text-xs text-gray-700">Date of birth, food, allergies and city: from the onboarding form (see the Profile form tab). Empty means the member did not answer. Only an Admin can correct them.</p>
      </section>

      <section className="glass-card rounded-2xl p-5 sm:p-6" aria-label="Coming up">
        <h3 className="mb-3 text-xs font-bold tracking-[0.25em] text-ilc-gold-deep uppercase">Coming up</h3>
        <ul className="space-y-1.5 text-sm text-ilc-ink">
          {upcoming.map((u) => (
            <li key={u.kind}>
              <span className="font-bold">{u.kind === 'birthday' ? 'Birthday' : 'Membership renewal'}:</span> {formatDate(u.date)} ({u.days === 0 ? 'today' : `in ${u.days} day${u.days === 1 ? '' : 's'}`})
            </li>
          ))}
        </ul>
      </section>

      <section className="glass-card rounded-2xl p-5 sm:p-6" aria-label="History">
        <h3 className="mb-3 text-xs font-bold tracking-[0.25em] text-ilc-gold-deep uppercase">What has happened</h3>
        {entries.length === 0 ? (
          <p className="text-sm text-gray-700">Nothing yet.</p>
        ) : (
          <ol className="space-y-4 border-l-2 border-gray-200 pl-5">
            {entries.map((e, i) => (
              <li key={i} className="relative">
                <span className={`absolute -left-[1.65rem] top-1.5 h-3 w-3 rounded-full ring-2 ring-white ${DOT[e.kind] ?? 'bg-gray-400'}`} aria-hidden="true" />
                <p className="text-sm font-bold text-ilc-ink">{e.title}</p>
                {e.detail && <p className="mt-0.5 text-sm text-gray-700">{e.detail}</p>}
                <p className="mt-0.5 text-xs text-gray-600">{[e.date ? formatDate(e.date) : null, e.by].filter(Boolean).join(' · ')}</p>
              </li>
            ))}
          </ol>
        )}
        <p className="mt-4 text-xs text-gray-700">Chat messages are private and never shown here.</p>
      </section>
    </div>
  );
}
