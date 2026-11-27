import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Alert from '../../components/ui/Alert.jsx';
import { getErrorMessage } from '../../lib/api-client.js';
import { formatDateWithDay } from '../../lib/format.js';
import { useOpsCalendar } from './hooks.js';
import SpocTabs from './SpocTabs.jsx';

// What each kind of entry looks like: a coloured dot and a word.
const KIND = {
  reminder: { label: 'Reminder', dot: 'bg-ilc-gold' },
  plan: { label: 'Year plan', dot: 'bg-ilc-purple' },
  checkpoint: { label: 'Checkpoint', dot: 'bg-indigo-500' },
  renewal: { label: 'Renewal', dot: 'bg-amber-600' },
  birthday: { label: 'Birthday', dot: 'bg-pink-500' },
  anniversary: { label: 'Anniversary', dot: 'bg-emerald-600' },
  event: { label: 'Event', dot: 'bg-sky-600' },
};
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const todayIST = () => new Date(Date.now() + 5.5 * 3_600_000).toISOString().slice(0, 10);
const shift = (month, n) => {
  const d = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1 + n, 1));
  return d.toISOString().slice(0, 7);
};
const monthName = (month) => new Date(`${month}-01T00:00:00Z`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });

// The relationship manager's month at a glance. Click a day for its list; click an entry to open the member.
export default function SpocCalendarPage() {
  const today = todayIST();
  const [month, setMonth] = useState(today.slice(0, 7));
  const [picked, setPicked] = useState(today);
  const { data, isLoading, isError, error } = useOpsCalendar(month);
  const items = data?.items ?? [];

  const byDay = useMemo(() => {
    const map = new Map();
    for (const it of items) map.set(it.date, [...(map.get(it.date) ?? []), it]);
    return map;
  }, [items]);

  // The grid: blank cells before the 1st (weeks start on Monday), then each day.
  const cells = useMemo(() => {
    const first = new Date(`${month}-01T00:00:00Z`);
    const lead = (first.getUTCDay() + 6) % 7;
    const days = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
    return [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`)];
  }, [month]);

  const dayItems = byDay.get(picked) ?? [];
  const go = (n) => {
    const next = shift(month, n);
    setMonth(next);
    setPicked(next === today.slice(0, 7) ? today : `${next}-01`);
  };

  return (
    <div className="w-full space-y-5">
      <SpocTabs group="day" />
      {isError && <Alert>{getErrorMessage(error)}</Alert>}

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-3">
        <section className="glass-card rounded-2xl p-4 sm:p-5 xl:col-span-2" aria-label="Month">
          <div className="mb-3 flex items-center justify-between gap-2">
            <button type="button" onClick={() => go(-1)} aria-label="Previous month" className="flex h-11 w-11 items-center justify-center rounded-lg border border-gray-200 bg-white text-ilc-purple hover:bg-ilc-purple/5">
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <h2 className="font-serif text-2xl font-semibold text-ilc-purple" aria-live="polite">
              {monthName(month)}
            </h2>
            <button type="button" onClick={() => go(1)} aria-label="Next month" className="flex h-11 w-11 items-center justify-center rounded-lg border border-gray-200 bg-white text-ilc-purple hover:bg-ilc-purple/5">
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold tracking-widest text-gray-600 uppercase" aria-hidden="true">
            {WEEKDAYS.map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>
          <div className={`grid grid-cols-7 gap-1 ${isLoading ? 'opacity-50' : ''}`}>
            {cells.map((date, i) => {
              if (!date) return <div key={`blank-${i}`} />;
              const list = byDay.get(date) ?? [];
              const isToday = date === today;
              const isPicked = date === picked;
              return (
                <button
                  key={date}
                  type="button"
                  onClick={() => setPicked(date)}
                  aria-pressed={isPicked}
                  aria-label={`${formatDateWithDay(date)}: ${list.length} item${list.length === 1 ? '' : 's'}`}
                  className={`flex min-h-16 flex-col items-start rounded-lg border p-1.5 text-left transition sm:min-h-24 ${
                    isPicked ? 'border-ilc-purple bg-ilc-purple/5 ring-2 ring-ilc-purple/20' : 'border-gray-100 bg-white hover:border-ilc-purple/40'
                  }`}
                >
                  <span className={`text-xs font-bold ${isToday ? 'rounded-full bg-ilc-purple px-1.5 text-white' : 'text-ilc-ink'}`}>{Number(date.slice(8))}</span>
                  <span className="mt-1 hidden w-full space-y-0.5 sm:block">
                    {list.slice(0, 3).map((it, j) => (
                      <span key={j} className="flex items-center gap-1 truncate text-[10px] text-gray-700">
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${KIND[it.type]?.dot}`} />
                        <span className="truncate">{it.member?.name ?? it.title}</span>
                      </span>
                    ))}
                    {list.length > 3 && <span className="block text-[10px] font-bold text-ilc-purple">+{list.length - 3} more</span>}
                  </span>
                  {list.length > 0 && (
                    <span className="mt-auto flex gap-0.5 sm:hidden">
                      {list.slice(0, 4).map((it, j) => (
                        <span key={j} className={`h-1.5 w-1.5 rounded-full ${KIND[it.type]?.dot}`} />
                      ))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-700" aria-label="What the colours mean">
            {Object.values(KIND).map((k) => (
              <li key={k.label} className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${k.dot}`} /> {k.label}
              </li>
            ))}
          </ul>
        </section>

        <section className="glass-card rounded-2xl p-5" aria-label="The chosen day" aria-live="polite">
          <h3 className="mb-3 text-sm font-bold tracking-wide text-ilc-ink uppercase">{formatDateWithDay(picked)}</h3>
          {dayItems.length === 0 ? (
            <p className="text-sm text-gray-700">Nothing on this day.</p>
          ) : (
            <ul className="space-y-2">
              {dayItems.map((it, i) => {
                const k = KIND[it.type] ?? { label: it.type, dot: 'bg-gray-400' };
                const body = (
                  <>
                    <span className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-gray-600 uppercase">
                      <span className={`h-2 w-2 rounded-full ${k.dot}`} /> {k.label}
                      {it.done && <span className="text-emerald-700">· done</span>}
                    </span>
                    <span className={`block text-sm font-semibold ${it.done ? 'text-gray-500 line-through' : 'text-ilc-ink'}`}>{it.title}</span>
                    {it.member && it.type !== 'birthday' && it.type !== 'renewal' && it.type !== 'anniversary' && it.type !== 'checkpoint' && <span className="block text-xs text-gray-600">{it.member.name}</span>}
                  </>
                );
                return (
                  <li key={i}>
                    {it.to ? (
                      <Link to={it.to} className="block rounded-xl border border-gray-100 bg-white p-3 transition hover:border-ilc-purple/40 hover:shadow-sm">
                        {body}
                      </Link>
                    ) : (
                      <div className="rounded-xl border border-gray-100 bg-white p-3">{body}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
