import { useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ShieldAlert } from 'lucide-react';
import Alert from '../../components/ui/Alert.jsx';
import SelectField from '../../components/ui/SelectField.jsx';
import TextField from '../../components/ui/TextField.jsx';
import { getErrorMessage } from '../../lib/api-client.js';
import { formatClock, formatDate } from '../../lib/format.js';
import { useAuthStore } from '../../store/auth-store.js';
import { actionLabel } from './audit-labels.js';
import { useAuditActions, useAuditLogs } from './hooks.js';

const PAGE_SIZE = 25;

function Who({ log }) {
  if (log.user) {
    return (
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-ilc-ink">{log.user.name}</span>
        <span className="block truncate text-xs tracking-widest text-gray-700 uppercase">
          {log.user.role.replace('_', ' ')}
        </span>
      </span>
    );
  }
  // A SPOC sign-in is logged without a member row (the SPOC id is in the details).
  const spoc = log.details?.role === 'SPOC' || Boolean(log.details?.spoc_id);
  return <span className="text-sm text-gray-600">{spoc ? 'A SPOC' : 'Not signed in'}</span>;
}

// A short one-line summary of the details (ids only; the logs never hold names or text).
const summary = (details) =>
  details && Object.keys(details).length
    ? Object.entries(details)
        .map(
          ([k, v]) =>
            `${k.replace(/_/g, ' ')}: ${typeof v === 'string' && v.length > 12 ? `${v.slice(0, 8)}…` : String(v)}`,
        )
        .join(' · ')
    : '—';

function Row({ log }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <tr className="border-b border-gray-50 align-top hover:bg-white/70">
        <td className="px-4 py-3 text-xs whitespace-nowrap text-gray-600">
          {formatDate(log.created_at)}
          <span className="block text-gray-600">{formatClock(log.created_at)}</span>
        </td>
        <td className="px-4 py-3">
          <Who log={log} />
        </td>
        <td className="px-4 py-3 text-sm text-ilc-ink">{actionLabel(log.action)}</td>
        <td className="hidden max-w-xs truncate px-4 py-3 text-xs text-gray-600 lg:table-cell">
          {summary(log.details)}
        </td>
        <td className="hidden px-4 py-3 text-xs text-gray-600 xl:table-cell">
          {log.ip_address ?? '—'}
        </td>
        <td className="w-10 px-2 py-2">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={open ? 'Hide details' : 'Show details'}
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100"
          >
            <ChevronDown className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`} />
          </button>
        </td>
      </tr>
      {open && (
        <tr className="border-b border-gray-50 bg-gray-50/60">
          <td colSpan={6} className="px-4 py-3 text-xs text-gray-600">
            <dl className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-[8rem_1fr]">
              <dt className="font-semibold text-gray-600">Action code</dt>
              <dd className="font-mono">{log.action}</dd>
              <dt className="font-semibold text-gray-600">Who</dt>
              <dd>{log.user ? `${log.user.name} (${log.user.email})` : '—'}</dd>
              <dt className="font-semibold text-gray-600">Details</dt>
              <dd>
                <pre className="font-mono break-words whitespace-pre-wrap">
                  {log.details ? JSON.stringify(log.details, null, 2) : '—'}
                </pre>
              </dd>
              <dt className="font-semibold text-gray-600">IP address</dt>
              <dd>{log.ip_address ?? '—'}</dd>
              <dt className="font-semibold text-gray-600">Browser</dt>
              <dd className="break-words">{log.user_agent ?? '—'}</dd>
            </dl>
          </td>
        </tr>
      )}
    </>
  );
}

// The audit trail. Super Admin only: the server refuses everyone else.
export default function AuditLogsPage() {
  const role = useAuthStore((s) => s.user.role);
  const allowed = role === 'SUPER_ADMIN';
  const [filters, setFilters] = useState({ action: '', from: '', to: '', category: '' });
  const [page, setPage] = useState(1);
  const { data: actions = [] } = useAuditActions(allowed);
  const { data, isLoading, isError, error, isFetching } = useAuditLogs(
    { ...filters, page, limit: PAGE_SIZE },
    allowed,
  );

  if (!allowed) {
    return (
      <div className="glass-card mx-auto max-w-xl rounded-2xl p-10 text-center">
        <ShieldAlert className="mx-auto h-8 w-8 text-gray-300" aria-hidden="true" />
        <p className="mt-3 font-serif text-xl font-bold text-ilc-purple">Super Admin only</p>
        <p className="mt-1 text-sm text-gray-600">
          The audit log can only be opened by a Super Admin.
        </p>
      </div>
    );
  }

  const setFilter = (k) => (e) => {
    setFilters((f) => ({ ...f, [k]: e.target.value }));
    setPage(1);
  };
  const logs = data?.logs ?? [];
  const pg = data?.pagination;
  const hasFilter = Boolean(filters.action || filters.from || filters.to);

  const view = (category) => {
    setFilters((f) => ({ ...f, category, action: '' }));
    setPage(1);
  };

  return (
    <div className="space-y-5">
      <div role="tablist" aria-label="Show" className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
        {[
          ['', 'Everything'],
          ['security', 'Security'],
        ].map(([value, label]) => (
          <button
            key={label}
            type="button"
            role="tab"
            aria-selected={filters.category === value}
            onClick={() => view(value)}
            className={`min-h-10 rounded-md px-4 text-sm font-bold transition ${filters.category === value ? 'bg-ilc-purple text-white' : 'text-gray-700 hover:bg-ilc-purple/5'}`}
          >
            {label}
          </button>
        ))}
      </div>
      {filters.category === 'security' && (
        <p className="text-sm text-gray-700">Sign-ins, failed and locked sign-ins, sign-in codes, password and access changes, and blocked files. Alerts for the serious ones also arrive in your bell and email.</p>
      )}
      <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_11rem_11rem_auto]">
        <SelectField
          label="Action"
          value={filters.action}
          onChange={setFilter('action')}
          options={[
            { value: '', label: 'All actions' },
            ...actions.map((a) => ({ value: a, label: actionLabel(a) })),
          ]}
        />
        <TextField label="From" type="date" value={filters.from} onChange={setFilter('from')} />
        <TextField label="To" type="date" value={filters.to} onChange={setFilter('to')} />
        <button
          type="button"
          disabled={!hasFilter}
          onClick={() => {
            setFilters((f) => ({ ...f, action: '', from: '', to: '' }));
            setPage(1);
          }}
          className="min-h-11 rounded-lg px-4 text-xs font-bold tracking-widest text-ilc-purple uppercase hover:bg-ilc-purple/5 disabled:opacity-40"
        >
          Clear
        </button>
      </div>

      {isError && <Alert>{getErrorMessage(error)}</Alert>}

      {isLoading ? (
        <div className="glass-card rounded-2xl p-10 text-center text-sm text-gray-600">
          Loading the audit log…
        </div>
      ) : logs.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center">
          <p className="font-serif text-xl font-bold text-ilc-purple">No entries</p>
          <p className="mt-1 text-sm text-gray-600">
            {hasFilter ? 'Nothing matches these filters.' : 'Nothing has been recorded yet.'}
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-600" aria-live="polite">
            {pg.total} entr{pg.total === 1 ? 'y' : 'ies'}
            {isFetching ? ' · updating…' : ''}
          </p>
          <div className="glass-card overflow-x-auto rounded-2xl">
            <table className="w-full min-w-[34rem] text-left">
              <thead className="border-b border-gray-100 bg-white/60 text-xs font-bold tracking-widest text-gray-700 uppercase">
                <tr>
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3">Who</th>
                  <th className="px-4 py-3">What</th>
                  <th className="hidden px-4 py-3 lg:table-cell">Details</th>
                  <th className="hidden px-4 py-3 xl:table-cell">IP</th>
                  <th className="w-10 px-2 py-3" />
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <Row key={l.id} log={l} />
                ))}
              </tbody>
            </table>
          </div>

          <nav aria-label="Pages" className="flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-gray-200 bg-white px-4 text-xs font-bold tracking-widest text-ilc-purple uppercase hover:bg-ilc-purple/5 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Newer
            </button>
            <span className="text-xs text-gray-600">
              Page {pg.page} of {pg.totalPages}
            </span>
            <button
              type="button"
              disabled={page >= pg.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-gray-200 bg-white px-4 text-xs font-bold tracking-widest text-ilc-purple uppercase hover:bg-ilc-purple/5 disabled:opacity-40"
            >
              Older <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </nav>
        </>
      )}
    </div>
  );
}
