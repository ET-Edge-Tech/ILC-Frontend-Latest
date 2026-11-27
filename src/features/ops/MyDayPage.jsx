import { Link } from 'react-router-dom';
import { Bell, Cake, Camera, Check, Handshake, Hourglass, PartyPopper, RefreshCw } from 'lucide-react';
import Alert from '../../components/ui/Alert.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import Button from '../../components/ui/Button.jsx';
import { getErrorMessage } from '../../lib/api-client.js';
import { formatDateWithDay } from '../../lib/format.js';
import { useMyDay, useTaskDone, useTaskSnooze } from './hooks.js';
import SpocTabs from './SpocTabs.jsx';

const KINDS = {
  reminder: { label: 'Reminders', icon: Bell, tone: 'text-ilc-gold-deep' },
  alert: { label: 'Needs attention', icon: Hourglass, tone: 'text-red-600' },
  etedge: { label: 'ET Edge requests', icon: Handshake, tone: 'text-blue-600' },
  photos: { label: 'Photos to approve', icon: Camera, tone: 'text-ilc-purple' },
  renewal: { label: 'Renewals', icon: RefreshCw, tone: 'text-amber-600' },
  birthday: { label: 'Birthdays', icon: Cake, tone: 'text-pink-600' },
  anniversary: { label: 'ILC anniversaries', icon: PartyPopper, tone: 'text-emerald-600' },
};

const SNOOZES = [
  [1, 'Tomorrow'],
  [3, '3 days'],
  [7, '1 week'],
];

function Item({ item, busyKey, onDone, onSnooze }) {
  const busy = busyKey === item.key;
  return (
    <li className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-start gap-3">
        {item.member && <Avatar name={item.member.name} initials={item.member.initials} src={item.member.photo_url} size="sm" />}
        <div className="min-w-0 flex-1">
          <Link to={item.to} className="text-sm font-bold text-ilc-ink hover:text-ilc-purple hover:underline">
            {item.title}
          </Link>
          {item.detail && <p className="mt-0.5 text-xs text-gray-700">{item.detail}</p>}
          {['birthday', 'anniversary', 'renewal'].includes(item.type) && <p className="mt-0.5 text-xs font-semibold text-gray-600">{formatDateWithDay(item.date)}</p>}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button className="w-auto" loading={busy && onDone.isPending} disabled={busy} onClick={() => onDone.mutate(item.key)}>
          <Check className="h-4 w-4" aria-hidden="true" /> Done
        </Button>
        <span className="text-xs font-bold text-gray-700">Snooze:</span>
        {SNOOZES.map(([days, label]) => (
          <button
            key={days}
            type="button"
            disabled={busy}
            onClick={() => onSnooze.mutate({ key: item.key, days })}
            className="min-h-9 rounded-full border border-gray-300 bg-white px-3 text-xs font-bold text-ilc-purple hover:bg-ilc-purple/5 disabled:opacity-50"
          >
            {label}
          </button>
        ))}
      </div>
    </li>
  );
}

// "My day": everything a relationship manager has to do today, in one list. Done removes an item; Snooze hides it for a while.
export default function MyDayPage() {
  const { data, isLoading, isError, error } = useMyDay();
  const done = useTaskDone();
  const snooze = useTaskSnooze();
  const busyKey = done.isPending ? done.variables : snooze.isPending ? snooze.variables?.key : null;
  const items = data?.items ?? [];

  return (
    <div className="w-full space-y-5">
      <SpocTabs group="day" />
      <div className="glass-card rounded-2xl p-5">
        <h2 className="text-lg font-bold text-ilc-ink">My day</h2>
        <p className="mt-1 text-sm text-gray-700">
          {data ? `${formatDateWithDay(data.date)}. ` : ''}Everything that needs you today: reminders, alerts, requests, photos, renewals, birthdays and anniversaries.
        </p>
      </div>

      {isError && <Alert>{getErrorMessage(error)}</Alert>}
      {isLoading && <div className="glass-card rounded-2xl p-10 text-center text-sm font-medium text-gray-700">Loading…</div>}
      {data && items.length === 0 && (
        <div className="glass-card rounded-2xl p-10 text-center">
          <p className="font-serif text-xl font-bold text-ilc-purple">You are all caught up</p>
          <p className="mt-1 text-sm text-gray-700">Nothing needs you right now.{data.hidden > 0 ? ` ${data.hidden} snoozed or finished item${data.hidden === 1 ? '' : 's'} hidden.` : ''}</p>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-2">
      {Object.entries(KINDS).map(([type, k]) => {
        const group = items.filter((i) => i.type === type);
        if (group.length === 0) return null;
        const Icon = k.icon;
        return (
          <section key={type} className="glass-card rounded-2xl p-5 sm:p-6" aria-label={k.label}>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold tracking-widest text-ilc-ink uppercase">
              <Icon className={`h-4 w-4 ${k.tone}`} aria-hidden="true" /> {k.label} ({group.length})
            </h3>
            <ul className="space-y-3">
              {group.map((it) => (
                <Item key={it.key} item={it} busyKey={busyKey} onDone={done} onSnooze={snooze} />
              ))}
            </ul>
          </section>
        );
      })}
      </div>
      {data && data.hidden > 0 && items.length > 0 && <p className="text-center text-xs text-gray-700">{data.hidden} snoozed or finished item{data.hidden === 1 ? '' : 's'} hidden.</p>}
    </div>
  );
}
