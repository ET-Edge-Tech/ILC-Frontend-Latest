import Alert from '../../components/ui/Alert.jsx';
import { getErrorMessage } from '../../lib/api-client.js';
import { useOpsDashboard } from './hooks.js';
import { RISK } from './risk.js';

const COLORS = { Green: '#4A7A5D', Amber: '#B9832E', Red: '#A8483B' };
const TYPE_LABELS = {
  renewal: 'Renewal',
  silence: 'Silence',
  noshow: 'No-show',
  media: 'Media debt',
  journey: 'Journey checkpoint',
  benefits: 'Benefits owed',
};

function Donut({ counts, total }) {
  const g = total ? Math.round((counts.Green / total) * 100) : 0;
  const a = total ? Math.round((counts.Amber / total) * 100) : 0;
  const background = total
    ? `conic-gradient(${COLORS.Green} 0% ${g}%, ${COLORS.Amber} ${g}% ${g + a}%, ${COLORS.Red} ${g + a}% 100%)`
    : '#e5e7eb';
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div
        role="img"
        aria-label={`${RISK.Green.label} ${counts.Green}, ${RISK.Amber.label} ${counts.Amber}, ${RISK.Red.label} ${counts.Red}`}
        className="h-36 w-36 shrink-0 rounded-full"
        style={{ background }}
      >
        <div className="m-[22%] flex h-[56%] w-[56%] items-center justify-center rounded-full bg-white font-serif font-semibold text-2xl text-ilc-ink">
          {total}
        </div>
      </div>
      <ul className="space-y-1.5 text-sm">
        {['Green', 'Amber', 'Red'].map((k) => (
          <li key={k} className="flex items-center gap-2">
            <span className={`h-3 w-3 rounded-full ${RISK[k].dot}`} aria-hidden="true" />
            <span className="text-gray-600">
              {RISK[k].label} <b className="text-ilc-ink">{counts[k]}</b>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Health of every member, what is open by type, and each relationship manager's portfolio.
export default function LeadershipDashboard() {
  const { data, isLoading, isError, error } = useOpsDashboard();
  const counts = data?.counts ?? { Green: 0, Amber: 0, Red: 0 };
  const maxType = Math.max(1, ...Object.values(data?.by_type ?? {}));

  const kpis = [
    { label: 'Total members', value: data?.total, cls: 'text-ilc-purple' },
    { label: RISK.Green.label, value: counts.Green, cls: RISK.Green.text },
    { label: RISK.Amber.label, value: counts.Amber, cls: RISK.Amber.text },
    { label: RISK.Red.label, value: counts.Red, cls: RISK.Red.text },
  ];

  return (
    <div className="space-y-6">
      {isError && <Alert>{getErrorMessage(error)}</Alert>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="glass-card rounded-2xl p-4 lg:p-5">
            <p className={`font-bold text-4xl tabular-nums ${k.cls}`}>{isLoading ? '–' : (k.value ?? 0)}</p>
            <p className="mt-1 text-[10px] font-bold tracking-widest text-gray-500 uppercase">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="glass-card rounded-2xl p-5" aria-label="Member health">
          <h3 className="mb-4 text-[10px] font-bold tracking-[0.25em] text-ilc-gold-deep uppercase">
            Member health
          </h3>
          <Donut counts={counts} total={data?.total ?? 0} />
        </section>

        <section className="glass-card rounded-2xl p-5" aria-label="Open alerts by type">
          <h3 className="mb-4 text-[10px] font-bold tracking-[0.25em] text-ilc-gold-deep uppercase">
            Open alerts by type
          </h3>
          <ul className="space-y-3">
            {Object.entries(TYPE_LABELS).map(([key, label]) => {
              const n = data?.by_type?.[key] ?? 0;
              return (
                <li key={key} className="flex items-center gap-3 text-sm">
                  <span className="w-36 shrink-0 text-gray-600">{label}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                    <span
                      className="block h-full rounded-full bg-ilc-gold"
                      style={{ width: `${Math.round((n / maxType) * 100)}%` }}
                    />
                  </span>
                  <span className="w-6 text-right font-semibold text-ilc-ink">{n}</span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <section className="glass-card overflow-x-auto rounded-2xl" aria-label="Portfolio by relationship manager">
        <h3 className="px-5 pt-5 text-[10px] font-bold tracking-[0.25em] text-ilc-gold-deep uppercase">
          Portfolio by relationship manager
        </h3>
        <table className="mt-3 w-full min-w-[28rem] text-left">
          <thead className="border-y border-gray-100 bg-white/60 text-[10px] font-bold tracking-widest text-gray-500 uppercase">
            <tr>
              <th className="px-5 py-3">Relationship manager</th>
              <th className="px-3 py-3">Members</th>
              <th className="px-3 py-3">{RISK.Green.label}</th>
              <th className="px-3 py-3">{RISK.Amber.label}</th>
              <th className="px-3 py-3">{RISK.Red.label}</th>
            </tr>
          </thead>
          <tbody>
            {(data?.portfolio ?? []).map((r) => (
              <tr key={r.spoc_id ?? 'unassigned'} className="border-b border-gray-50">
                <td className="px-5 py-3 text-sm font-semibold text-ilc-ink">{r.spoc_name}</td>
                <td className="px-3 py-3 text-sm">{r.total}</td>
                <td className={`px-3 py-3 text-sm font-bold ${RISK.Green.text}`}>{r.Green}</td>
                <td className={`px-3 py-3 text-sm font-bold ${RISK.Amber.text}`}>{r.Amber}</td>
                <td className={`px-3 py-3 text-sm font-bold ${RISK.Red.text}`}>{r.Red}</td>
              </tr>
            ))}
            {!isLoading && data?.portfolio.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-6 text-center text-sm text-gray-500">
                  No approved members yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
