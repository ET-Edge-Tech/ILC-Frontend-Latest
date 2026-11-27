import { useState } from 'react';
import { ExternalLink, MapPin } from 'lucide-react';
import Alert from '../../components/ui/Alert.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import { getErrorMessage } from '../../lib/api-client.js';
import { formatDateWithDay, timeAgo } from '../../lib/format.js';
import { useOpenMember } from '../ops/hooks.js';
import { STATUS_LABEL, useInterests, useSetInterestStatus } from './et-edge-hooks.js';
import SpocTabs from '../ops/SpocTabs.jsx';

const FILTERS = [
  { value: 'NEW', label: 'New' },
  { value: 'CONTACTED', label: 'Contacted' },
  { value: 'DONE', label: 'Done' },
  { value: '', label: 'All' },
];

const STATUS_CLS = {
  NEW: 'bg-amber-100 text-amber-800',
  CONTACTED: 'bg-blue-100 text-blue-800',
  DONE: 'bg-emerald-100 text-emerald-800',
};

// Members who pressed "I'm interested" on an ET Edge event. Get in touch, then mark Contacted and Done.
// A relationship manager sees their own members; an Admin sees everyone.
export default function EtEdgeRequestsPage() {
  const [status, setStatus] = useState('NEW');
  const { data: rows = [], isLoading, isError, error } = useInterests(status);
  const { data: all = [] } = useInterests('');
  const set = useSetInterestStatus();
  const openMember = useOpenMember();
  const count = (s) => all.filter((r) => r.status === s).length;

  return (
    <div className="w-full space-y-5">
      <SpocTabs group="events" />
      <div className="glass-card rounded-2xl p-5">
        <h2 className="text-lg font-bold text-ilc-ink">ET Edge requests</h2>
        <p className="mt-1 text-sm text-gray-700">
          These members would like to attend an ET Edge event. Get in touch with them, then mark each request{' '}
          <strong>Contacted</strong> and, when it is sorted, <strong>Done</strong>.
        </p>
      </div>

      <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const on = status === f.value;
          const n = f.value ? count(f.value) : all.length;
          return (
            <button
              key={f.label}
              type="button"
              aria-pressed={on}
              onClick={() => setStatus(f.value)}
              className={`min-h-10 rounded-full border px-4 text-sm font-bold transition ${on ? 'border-ilc-purple bg-ilc-purple text-white' : 'border-gray-300 bg-white text-gray-700 hover:bg-ilc-purple/5'}`}
            >
              {f.label} <span className="ml-1 text-xs opacity-80">{n}</span>
            </button>
          );
        })}
      </div>

      {isError && <Alert>{getErrorMessage(error)}</Alert>}
      {isLoading && <div className="glass-card rounded-2xl p-10 text-center text-sm font-medium text-gray-700">Loading…</div>}

      {!isLoading && rows.length === 0 && (
        <div className="glass-card rounded-2xl p-10 text-center">
          <p className="font-serif text-xl font-bold text-ilc-purple">{status ? 'Nothing here' : 'No requests yet'}</p>
          <p className="mt-1 text-sm text-gray-700">
            {status === 'NEW' ? 'No new requests right now.' : 'When a member says they are interested in an ET Edge event, it appears here.'}
          </p>
        </div>
      )}

      <ul className="space-y-3">
        {rows.map((r) => (
          <li key={r.id} className="glass-card rounded-2xl p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <Avatar name={r.member.name} initials={r.member.initials} src={r.member.photo_url} size="md" />
              <div className="min-w-0 flex-1">
                <button type="button" onClick={() => openMember(r.member.id)} className="text-left text-base font-bold text-ilc-purple hover:underline">
                  {r.member.name}
                </button>
                <p className="truncate text-sm text-gray-700">{[r.member.title, r.member.organisation].filter(Boolean).join(' · ')}</p>
                <p className="mt-2 text-sm font-bold text-ilc-ink">{r.event.title}</p>
                <p className="text-sm text-gray-700">
                  {formatDateWithDay(r.event.date)}
                  {r.event.location && (
                    <>
                      {' · '}
                      <MapPin className="mb-0.5 inline h-3.5 w-3.5" aria-hidden="true" /> {r.event.location}
                    </>
                  )}
                </p>
                {r.event.external_url && (
                  <a href={r.event.external_url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-ilc-purple hover:underline">
                    Event website <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                )}
                <p className="mt-1 text-xs text-gray-600">Asked {timeAgo(r.created_at)}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_CLS[r.status]}`}>{STATUS_LABEL[r.status]}</span>
            </div>
            <div role="group" aria-label={`Status for ${r.member.name}`} className="mt-3 flex flex-wrap gap-2">
              {Object.keys(STATUS_LABEL).map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={r.status === value}
                  disabled={set.isPending}
                  onClick={() => r.status !== value && set.mutate({ id: r.id, status: value })}
                  className={`min-h-10 rounded-lg border px-4 text-sm font-bold transition disabled:opacity-60 ${r.status === value ? 'border-ilc-purple bg-ilc-purple text-white' : 'border-gray-300 bg-white text-ilc-purple hover:bg-ilc-purple/5'}`}
                >
                  {value === 'NEW' ? 'New' : value === 'CONTACTED' ? 'I got in touch' : 'Done'}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
