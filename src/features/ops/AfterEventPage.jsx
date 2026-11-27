import { useState } from 'react';
import Alert from '../../components/ui/Alert.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import SelectField from '../../components/ui/SelectField.jsx';
import { getErrorMessage } from '../../lib/api-client.js';
import { formatDate } from '../../lib/format.js';
import { useEvents } from '../events/hooks.js';
import GroupActions from './GroupActions.jsx';
import { useAfterEvent } from './hooks.js';
import SpocTabs from './SpocTabs.jsx';

const GROUPS = [
  ['attended', 'Said yes', 'They were booked for the event.'],
  ['declined', 'Said no', 'They told us they could not come.'],
  ['no_answer', 'Did not answer', 'No reply either way.'],
];

// After an event: your members by what they told us, with quick follow-up (a message or a logged contact).
export default function AfterEventPage() {
  const { data: events = [] } = useEvents('past');
  const today = new Date().toISOString().slice(0, 10);
  const { data: todays = [] } = useEvents('all');
  const list = [...new Map([...events, ...todays.filter((e) => e.date === today)].map((e) => [e.id, e])).values()]
    .filter((e) => e.kind !== 'ET_EDGE')
    .sort((a, b) => b.date.localeCompare(a.date));
  const [eventId, setEventId] = useState('');
  const chosen = eventId || list[0]?.id || '';
  const { data, isLoading, isError, error } = useAfterEvent(chosen);
  const [picked, setPicked] = useState({}); // id -> name

  const toggle = (m) =>
    setPicked((p) => {
      const next = { ...p };
      if (next[m.id]) delete next[m.id];
      else next[m.id] = m.name;
      return next;
    });
  const selected = Object.entries(picked).map(([id, name]) => ({ id, name }));
  const pickGroup = (members) => setPicked((p) => ({ ...p, ...Object.fromEntries(members.map((m) => [m.id, m.name])) }));

  return (
    <div className="w-full space-y-5">
      <SpocTabs group="events" />
      <div className="glass-card rounded-2xl p-5">
        <h2 className="text-lg font-bold text-ilc-ink">After an event</h2>
        <p className="mt-1 text-sm text-gray-700">See which of your members said yes, said no or did not answer, then thank them or log a contact in one go.</p>
        <SelectField
          className="mt-3 max-w-md"
          label="Event"
          value={chosen}
          onChange={(e) => {
            setEventId(e.target.value);
            setPicked({});
          }}
          options={list.length ? list.map((e) => ({ value: e.id, label: `${e.title} · ${formatDate(e.date)}` })) : [{ value: '', label: 'No events have taken place yet' }]}
        />
      </div>

      {isError && <Alert>{getErrorMessage(error)}</Alert>}
      {isLoading && chosen && <div className="glass-card rounded-2xl p-10 text-center text-sm font-medium text-gray-700">Loading…</div>}

      {data &&
        GROUPS.map(([key, title, hint]) => (
          <section key={key} className="glass-card rounded-2xl p-5 sm:p-6" aria-label={title}>
            <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold tracking-widest text-ilc-ink uppercase">
                {title} ({data[key].length})
              </h3>
              {data[key].length > 0 && (
                <button type="button" onClick={() => pickGroup(data[key])} className="text-xs font-bold text-ilc-purple hover:underline">
                  Choose all {data[key].length}
                </button>
              )}
            </div>
            <p className="mb-3 text-xs text-gray-700">{hint}</p>
            {data[key].length === 0 ? (
              <p className="text-sm text-gray-700">No one.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {data[key].map((m) => (
                  <li key={m.id}>
                    <label className="flex min-h-12 cursor-pointer items-center gap-3 py-2">
                      <input type="checkbox" checked={Boolean(picked[m.id])} onChange={() => toggle(m)} className="h-5 w-5 shrink-0 accent-ilc-purple" aria-label={`Choose ${m.name}`} />
                      <Avatar name={m.name} initials={m.initials} src={m.photo_url} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-ilc-ink">{m.name}</span>
                        <span className="block truncate text-xs text-gray-700">{[m.title, m.organisation].filter(Boolean).join(' · ')}</span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}

      <GroupActions selected={selected} onDone={() => setPicked({})} defaultLog="Message" />
    </div>
  );
}
