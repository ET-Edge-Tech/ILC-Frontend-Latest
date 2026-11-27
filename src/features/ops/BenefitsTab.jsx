import { useState } from 'react';
import { Check, Plus, Trash2, X } from 'lucide-react';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import { getErrorMessage } from '../../lib/api-client.js';
import { formatDate } from '../../lib/format.js';
import { useBenefitUse, useMemberBenefits } from './hooks.js';

// Today in India time, as YYYY-MM-DD (the default date for "Mark as used").
const todayIST = () => new Date(Date.now() + 5.5 * 3_600_000).toISOString().slice(0, 10);

const AUTO_HINT = {
  events: 'Counted by the portal: ILC events the member said Yes to.',
  intros: 'Counted by the portal: introductions made with the Introduce button.',
  video: 'Counted by the portal: done when the video is Published (Progress tab).',
  article: 'Counted by the portal: done when the article is Published (Progress tab).',
  book: 'Counted by the portal: done when the book entry is submitted or Published (Progress tab).',
};

const input =
  'min-h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:border-ilc-purple focus:ring-2 focus:ring-ilc-purple/15 focus:outline-none';

function MarkUsed({ benefit, busy, onSave, onCancel }) {
  const [date, setDate] = useState(todayIST());
  const [note, setNote] = useState('');
  return (
    <form
      className="mt-3 flex flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ benefitId: benefit.id, used_on: date, note: note.trim() || undefined });
      }}
    >
      <input type="date" aria-label="Date used" value={date} max={todayIST()} onChange={(e) => setDate(e.target.value)} className={`${input} w-40`} required />
      <input type="text" aria-label="Note" placeholder="Optional note, e.g. Summit 2026, front row" maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} className={`${input} min-w-0 flex-1`} />
      <Button type="submit" className="w-auto" loading={busy}>
        Save
      </Button>
      <button type="button" onClick={onCancel} aria-label="Cancel" className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100">
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </form>
  );
}

// Which membership benefits this member has used this membership year, and which are still owed.
export default function BenefitsTab({ id }) {
  const { data, isLoading, isError, error } = useMemberBenefits(id);
  const act = useBenefitUse(id);
  const [marking, setMarking] = useState(null); // benefit id

  if (isLoading) return <div className="glass-card rounded-2xl p-8 text-center text-sm font-medium text-gray-700">Loading…</div>;
  if (isError) return <Alert>{getErrorMessage(error)}</Alert>;

  return (
    <div className="space-y-4">
      <div className="glass-card flex flex-wrap items-center justify-between gap-3 rounded-2xl p-5">
        <p className="text-sm text-gray-700">
          Membership year <strong className="text-ilc-ink">{formatDate(data.year.start)}</strong> to <strong className="text-ilc-ink">{formatDate(data.year.end)}</strong>. A new year starts fresh.
        </p>
        <span className={`rounded-full px-3 py-1 text-sm font-bold ${data.owed ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'}`}>
          {data.owed ? `${data.owed} still owed` : 'Everything delivered'}
        </span>
      </div>

      {data.items.length === 0 && <Alert tone="warning">No benefits are set for this member&apos;s tier. An Admin sets them in Ops Settings.</Alert>}

      <ul className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        {data.items.map((b) => {
          const pct = Math.min(100, Math.round((b.used / b.allowed) * 100));
          return (
            <li key={b.id} className="glass-card rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-bold text-ilc-ink">{b.name}</p>
                  <p className="text-xs text-gray-600">{b.auto ? AUTO_HINT[b.auto] : 'Marked by the relationship manager.'}</p>
                </div>
                <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${b.owed ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'}`}>
                  {b.owed ? `${b.owed} owed` : (
                    <>
                      <Check className="h-3.5 w-3.5" aria-hidden="true" /> Done
                    </>
                  )}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100" aria-hidden="true">
                  <div className={`h-full rounded-full ${b.owed ? 'bg-ilc-gold' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-sm font-bold text-ilc-ink tabular-nums">
                  {b.used} of {b.allowed} used
                </span>
              </div>

              {!b.auto && (
                <>
                  {b.uses.length > 0 && (
                    <ul className="mt-3 divide-y divide-gray-100 rounded-xl border border-gray-100 bg-white">
                      {b.uses.map((u) => (
                        <li key={u.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                          <span className="font-semibold text-ilc-ink">{formatDate(u.used_on)}</span>
                          <span className="min-w-0 flex-1 truncate text-gray-700">{u.note}</span>
                          <button type="button" aria-label={`Remove the use on ${formatDate(u.used_on)}`} disabled={act.remove.isPending} onClick={() => act.remove.mutate(u.id)} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-700">
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {marking === b.id ? (
                    <MarkUsed benefit={b} busy={act.add.isPending} onCancel={() => setMarking(null)} onSave={(v) => act.add.mutate(v, { onSuccess: () => setMarking(null) })} />
                  ) : (
                    <button type="button" onClick={() => setMarking(b.id)} className="mt-3 inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 text-xs font-bold tracking-widest text-ilc-purple uppercase hover:bg-ilc-purple/5">
                      <Plus className="h-4 w-4" aria-hidden="true" /> Mark as used
                    </button>
                  )}
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
