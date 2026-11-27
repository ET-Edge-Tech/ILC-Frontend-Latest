import { useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import { getErrorMessage } from '../../lib/api-client.js';
import { useBenefitTypes, useSaveBenefitTypes } from './hooks.js';

const TIERS = ['Metro Full', 'Tier 2', 'Limited Access'];
const AUTO = [
  ['', 'Marked by the relationship manager'],
  ['events', 'Counted: ILC events attended'],
  ['intros', 'Counted: introductions made'],
  ['video', 'Counted: video published'],
  ['article', 'Counted: article published'],
  ['book', 'Counted: book entry submitted'],
];

const cell =
  'min-h-10 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-sm focus:border-ilc-purple focus:ring-2 focus:ring-ilc-purple/15 focus:outline-none';

function Editor({ saved }) {
  const save = useSaveBenefitTypes();
  const [rows, setRows] = useState(() => saved.map((b) => ({ ...b, auto: b.auto ?? '', per_tier: { ...b.per_tier } })));
  const set = (i, patch) => setRows((r) => r.map((row, j) => (j === i ? { ...row, ...patch } : row)));
  const move = (i, d) =>
    setRows((r) => {
      const next = [...r];
      [next[i], next[i + d]] = [next[i + d], next[i]];
      return next;
    });
  const autos = rows.map((r) => r.auto).filter(Boolean);
  const dupAuto = new Set(autos).size !== autos.length;
  const bad = rows.some((r) => !r.name.trim() || TIERS.some((t) => !Number.isInteger(Number(r.per_tier[t])) || Number(r.per_tier[t]) < 0 || Number(r.per_tier[t]) > 99));

  const submit = (e) => {
    e.preventDefault();
    if (bad || dupAuto) return;
    save.mutate(
      rows.map((r) => ({
        ...(r.id && { id: r.id }),
        name: r.name.trim(),
        auto: r.auto || null,
        per_tier: Object.fromEntries(TIERS.map((t) => [t, Number(r.per_tier[t])])),
      })),
    );
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[44rem] text-sm">
          <thead>
            <tr className="text-left text-xs font-bold tracking-widest text-gray-700 uppercase">
              <th className="pb-2">Benefit</th>
              <th className="pb-2">How it is counted</th>
              {TIERS.map((t) => (
                <th key={t} className="w-24 pb-2">
                  {t}
                </th>
              ))}
              <th className="w-28 pb-2">
                <span className="sr-only">Order and remove</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r, i) => (
              <tr key={r.id ?? `new-${i}`}>
                <td className="py-2 pr-2">
                  <input aria-label={`Benefit ${i + 1} name`} value={r.name} maxLength={100} onChange={(e) => set(i, { name: e.target.value })} className={cell} required />
                </td>
                <td className="py-2 pr-2">
                  <select aria-label={`Benefit ${i + 1}: how it is counted`} value={r.auto} onChange={(e) => set(i, { auto: e.target.value })} className={cell}>
                    {AUTO.map(([v, label]) => (
                      <option key={v} value={v}>
                        {label}
                      </option>
                    ))}
                  </select>
                </td>
                {TIERS.map((t) => (
                  <td key={t} className="py-2 pr-2">
                    <input
                      aria-label={`${r.name || `Benefit ${i + 1}`}: per year for ${t}`}
                      type="number"
                      min={0}
                      max={99}
                      inputMode="numeric"
                      value={r.per_tier[t] ?? 0}
                      onChange={(e) => set(i, { per_tier: { ...r.per_tier, [t]: e.target.value } })}
                      className={cell}
                    />
                  </td>
                ))}
                <td className="py-2">
                  <div className="flex items-center gap-1">
                    <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)} className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-30">
                      <ArrowUp className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button type="button" aria-label="Move down" disabled={i === rows.length - 1} onClick={() => move(i, 1)} className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-30">
                      <ArrowDown className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button type="button" aria-label={`Remove ${r.name || `benefit ${i + 1}`}`} onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))} className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-700">
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {dupAuto && <Alert>Each automatic count can be used by one benefit only.</Alert>}
      {bad && <Alert>Every benefit needs a name, and each number must be a whole number from 0 to 99.</Alert>}
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={rows.length >= 30} onClick={() => setRows((r) => [...r, { name: '', auto: '', per_tier: { 'Metro Full': 1, 'Tier 2': 1, 'Limited Access': 0 } }])} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 text-sm font-bold text-ilc-purple hover:bg-ilc-purple/5 disabled:opacity-50">
          <Plus className="h-4 w-4" aria-hidden="true" /> Add a benefit
        </button>
        <Button type="submit" className="w-auto" loading={save.isPending} disabled={bad || dupAuto}>
          Save benefits
        </Button>
      </div>
    </form>
  );
}

// Ops Settings: the membership benefits and how many of each a tier gets per membership year.
export default function BenefitsSettings() {
  const { data, isLoading, isError, error } = useBenefitTypes();
  return (
    <section className="glass-card space-y-3 rounded-2xl p-5 sm:p-6" aria-label="Membership benefits">
      <h3 className="text-[10px] font-bold tracking-[0.25em] text-ilc-gold-deep uppercase">Membership benefits</h3>
      <p className="text-sm text-gray-700">
        What each tier gets per membership year. Relationship managers see each member&apos;s benefits as used or still owed. Use 0 when a tier does not get a benefit. A removed benefit stops counting; its past uses are kept.
      </p>
      {isError && <Alert>{getErrorMessage(error)}</Alert>}
      {isLoading && <p className="text-sm text-gray-600">Loading…</p>}
      {data && <Editor key={JSON.stringify(data)} saved={data} />}
    </section>
  );
}
