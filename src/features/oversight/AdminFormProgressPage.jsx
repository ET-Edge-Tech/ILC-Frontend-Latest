import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Pencil, Search, X } from 'lucide-react';
import Alert from '../../components/ui/Alert.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import SelectField from '../../components/ui/SelectField.jsx';
import { getErrorMessage } from '../../lib/api-client.js';
import { formatDate } from '../../lib/format.js';
import AnswerEditor from './AnswerEditor.jsx';
import { useAnswerSheet, useProgress } from './hooks.js';

const STATE = {
  not_started: { label: 'Not started', cls: 'bg-gray-100 text-gray-600' },
  in_progress: { label: 'In progress', cls: 'bg-amber-100 text-amber-800' },
  submitted: { label: 'Submitted', cls: 'bg-emerald-100 text-emerald-700' },
};

function StateChip({ state }) {
  const s = STATE[state] ?? STATE.not_started;
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wider whitespace-nowrap uppercase ${s.cls}`}
    >
      {s.label}
    </span>
  );
}

function Bar({ percent }) {
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200"
    >
      <div
        className={`h-full rounded-full ${percent === 100 ? 'bg-emerald-500' : 'bg-ilc-gold'}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

// One member's answers, question by question. Opening it is logged by the server.
function AnswerPanel({ member, onClose }) {
  const { data, isLoading, isError, error } = useAnswerSheet(member.id);
  const [editing, setEditing] = useState(false);

  // Escape closes the panel, but never while editing (that could throw away changes by accident).
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !editing && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, editing]);

  return createPortal(
    <div
      className="fixed inset-0 z-40 flex justify-end bg-black/40"
      onMouseDown={(e) => e.target === e.currentTarget && !editing && onClose()}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`${member.name}'s answers`}
        className="flex h-full w-full max-w-lg flex-col overflow-y-auto bg-ilc-page shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-start gap-3 border-b border-gray-100 bg-ilc-page p-5">
          <Avatar name={member.name} initials={member.initials} src={member.photo_url} size="lg" />
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-serif text-2xl font-semibold text-ilc-purple">{member.name}</h2>
            <p className="truncate text-sm text-gray-600">
              {[member.title, member.organisation].filter(Boolean).join(' · ')}
            </p>
            {data && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StateChip state={data.state} />
                <span className="text-xs text-gray-600">
                  {data.summary.filled} of {data.summary.total} answered · required{' '}
                  {data.summary.required_filled}/{data.summary.required_total}
                </span>
              </div>
            )}
            {data && data.state === 'submitted' && !editing && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-xs font-bold tracking-widest text-ilc-purple uppercase hover:bg-ilc-purple/5"
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Edit answers
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-10 w-10 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {editing && data && (
          <AnswerEditor sheet={data} userId={member.id} onClose={() => setEditing(false)} />
        )}

        <div className={`space-y-4 p-5 ${editing ? 'hidden' : ''}`}>
          {isLoading && <p className="py-10 text-center text-sm text-gray-600">Loading answers…</p>}
          {isError && <Alert>{getErrorMessage(error)}</Alert>}
          {data && data.state === 'not_started' && (
            <Alert tone="warning">This member has not started the form yet.</Alert>
          )}
          {data &&
            data.answers.map((a) =>
              a.type === 'section' ? (
                <h3 key={`s${a.id}`} className="pt-3 font-serif text-xl font-bold text-ilc-purple">
                  {a.label}
                </h3>
              ) : (
                <div key={a.id} className="rounded-xl border border-gray-100 bg-white p-3">
                  <p className="text-xs font-bold tracking-widest text-gray-700 uppercase">
                    {a.label}
                    {a.isRequired && <span className="ml-1 text-ilc-gold-deep">*</span>}
                    {a.edited && (
                      <span className="ml-2 rounded-full bg-ilc-gold/15 px-2 py-0.5 text-[9px] tracking-wider text-ilc-gold-deep normal-case">
                        Edited by admin
                      </span>
                    )}
                  </p>
                  {a.isFilled ? (
                    <p className="mt-1 text-sm break-words whitespace-pre-wrap text-ilc-ink">
                      {a.value}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-gray-300 italic">Not answered</p>
                  )}
                </div>
              ),
            )}
        </div>
      </aside>
    </div>,
    document.body,
  );
}

const STATE_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'not_started', label: 'Not started' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'submitted', label: 'Submitted' },
];

// How far each member has got with the onboarding form, least complete first.
export default function AdminFormProgressPage() {
  const { data: rows = [], isLoading, isError, error } = useProgress();
  const [state, setState] = useState('');
  const [text, setText] = useState('');
  const [openId, setOpenId] = useState(null);

  const counts = useMemo(() => {
    const c = { not_started: 0, in_progress: 0, submitted: 0 };
    for (const r of rows) c[r.state] += 1;
    return c;
  }, [rows]);

  const shown = useMemo(() => {
    const q = text.trim().toLowerCase();
    return rows
      .filter(
        (r) =>
          (!state || r.state === state) &&
          (!q || [r.name, r.organisation, r.email].some((v) => v?.toLowerCase().includes(q))),
      )
      .sort((a, b) => a.progress_percent - b.progress_percent || a.name.localeCompare(b.name));
  }, [rows, state, text]);
  const open = rows.find((r) => r.id === openId) ?? null;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        {Object.entries(STATE).map(([key, s]) => (
          <button
            key={key}
            type="button"
            onClick={() => setState(state === key ? '' : key)}
            aria-pressed={state === key}
            className={`glass-card rounded-2xl p-4 text-left transition hover:shadow-md ${state === key ? 'ring-2 ring-ilc-purple' : ''}`}
          >
            <p className="text-3xl tabular-nums font-bold text-ilc-ink">{isLoading ? '–' : counts[key]}</p>
            <p className="mt-1 text-xs font-bold tracking-widest text-gray-700 uppercase">
              {s.label}
            </p>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="relative min-w-[14rem] flex-1">
          <label htmlFor="progress-search" className="sr-only">
            Search members
          </label>
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-gray-600"
            aria-hidden="true"
          />
          <input
            id="progress-search"
            type="search"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Search by name, organisation or email"
            className="min-h-11 w-full rounded-lg border border-gray-200 bg-white pr-3 pl-10 text-sm focus:border-ilc-purple focus:ring-2 focus:ring-ilc-purple/15 focus:outline-none"
          />
        </div>
        <SelectField
          className="w-full sm:w-44"
          aria-label="Filter by state"
          value={state}
          onChange={(e) => setState(e.target.value)}
          options={STATE_OPTIONS}
        />
      </div>

      {isError && <Alert>{getErrorMessage(error)}</Alert>}

      {isLoading ? (
        <div className="glass-card rounded-2xl p-10 text-center text-sm text-gray-600">
          Reading the form answers from WordPress…
        </div>
      ) : shown.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center">
          <p className="font-serif text-xl font-bold text-ilc-purple">No members to show</p>
          <p className="mt-1 text-sm text-gray-600">
            {rows.length
              ? 'Try a different search or filter.'
              : 'Members will appear here once they are added.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {shown.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => setOpenId(r.id)}
                className="glass-card flex w-full flex-col gap-3 rounded-2xl p-4 text-left transition hover:shadow-md sm:flex-row sm:items-center sm:gap-5"
              >
                <span className="flex min-w-0 items-center gap-3 sm:w-1/3">
                  <Avatar name={r.name} initials={r.initials} src={r.photo_url} size="sm" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-ilc-ink">
                      {r.name}
                    </span>
                    <span className="block truncate text-xs text-gray-600">
                      {r.organisation || r.email}
                    </span>
                  </span>
                </span>
                <span className="flex-1">
                  <span className="mb-1 flex items-center justify-between gap-2 text-xs text-gray-600">
                    <span>
                      {r.filled_fields} of {r.total_fields} answered · required {r.required_filled}/
                      {r.required_fields}
                    </span>
                    <span className="font-semibold text-ilc-ink">{r.progress_percent}%</span>
                  </span>
                  <Bar percent={r.progress_percent} />
                </span>
                <span className="flex items-center justify-between gap-3 sm:w-40 sm:flex-col sm:items-end sm:gap-1">
                  <StateChip state={r.state} />
                  {r.entry?.date_created && (
                    <span className="text-xs text-gray-600">
                      Submitted{' '}
                      {formatDate(
                        r.entry.date_created.replace(' ', 'T') +
                          (r.entry.date_created.includes('Z') ? '' : 'Z'),
                      )}
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && <AnswerPanel member={open} onClose={() => setOpenId(null)} />}
    </div>
  );
}
