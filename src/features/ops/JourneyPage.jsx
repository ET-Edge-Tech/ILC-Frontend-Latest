import { useState } from 'react';
import { Check, CircleAlert, Clock, Pencil, Plus, Trash2, X } from 'lucide-react';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import { getErrorMessage } from '../../lib/api-client.js';
import { formatDate } from '../../lib/format.js';
import { useAuthStore } from '../../store/auth-store.js';
import { useJourneyEdits, useOpenMember, useOpsJourney } from './hooks.js';
import { RiskDot } from './parts.jsx';

const CHIP = {
  done: { cls: 'border-[#4A7A5D]/30 bg-[#4A7A5D]/10 text-[#3c6a4e]', Icon: Check, label: 'done' },
  overdue: { cls: 'border-[#A8483B]/30 bg-[#A8483B]/10 text-[#A8483B]', Icon: CircleAlert, label: 'overdue' },
  upcoming: { cls: 'border-gray-200 bg-gray-50 text-gray-700', Icon: Clock, label: 'coming up' },
};

// Which tracker tick completes each standard checkpoint.
const FIELD = {
  journey_wishlist: 'wishlist_captured',
  journey_intro: 'first_intro_made',
  journey_midyear: 'mid_year_checkin_done',
  journey_book: 'book_entry_submitted',
  journey_anniversary: 'anniversary_acknowledged',
};

const input =
  'min-h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:border-ilc-purple focus:ring-2 focus:ring-ilc-purple/15 focus:outline-none';

// Add or change one plan item: a date and what should happen.
function PlanItemForm({ initial = { due_on: '', text: '' }, saving, onSave, onCancel, label }) {
  const [due, setDue] = useState(initial.due_on);
  const [text, setText] = useState(initial.text);
  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (due && text.trim()) onSave({ due_on: due, text: text.trim() });
      }}
    >
      <input type="date" aria-label="Date" value={due} onChange={(e) => setDue(e.target.value)} className={`${input} w-40`} required />
      <input type="text" aria-label="What should happen" placeholder="What should happen, e.g. Introduce to a fellow CEO" maxLength={200} value={text} onChange={(e) => setText(e.target.value)} className={`${input} min-w-0 flex-1`} required />
      <Button type="submit" className="w-auto" loading={saving}>
        {label}
      </Button>
      <button type="button" onClick={onCancel} aria-label="Cancel" className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100">
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </form>
  );
}

function JourneyCard({ member, months, showSpoc, onOpen, edits }) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null); // plan item id
  const [removing, setRemoving] = useState(null); // plan item
  const busy = (m) => m.isPending && m.variables?.memberId === member.id;

  return (
    <article className="glass-card rounded-2xl p-5">
      <button type="button" onClick={() => onOpen(member.id)} className="flex w-full items-start gap-3 text-left">
        <RiskDot risk={member.risk} className="mt-1.5" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-base font-semibold text-ilc-purple hover:underline">{member.name}</span>
          <span className="block truncate text-xs text-gray-600">
            {[member.organisation, showSpoc && member.spoc?.name].filter(Boolean).join(' · ')}
          </span>
        </span>
        <span className="shrink-0 text-right text-xs text-gray-600">
          Month {member.journey_month} of 12
          <span className="block font-semibold text-ilc-ink">{member.journey_title}</span>
        </span>
      </button>

      <ol className="mt-4 grid grid-cols-6 gap-1.5 sm:grid-cols-12" aria-label="12-month journey">
        {months.map((m) => {
          const current = m.month === member.journey_month;
          const past = m.month < member.journey_month;
          return (
            <li
              key={m.month}
              aria-current={current ? 'step' : undefined}
              title={`${m.title}: ${m.touchpoint}`}
              className={`rounded-lg px-1 py-2 text-center ${current ? 'bg-ilc-gold text-ilc-sidebar' : past ? 'bg-ilc-purple/10 text-ilc-purple' : 'bg-gray-100 text-gray-500'}`}
            >
              <span className="block text-[10px] font-bold">M{m.month}</span>
            </li>
          );
        })}
      </ol>
      <p className="mt-2 text-xs text-gray-600">{months[member.journey_month - 1].touchpoint}</p>

      <h4 className="mt-4 mb-2 text-xs font-bold tracking-widest text-gray-700 uppercase">Checkpoints (press to tick or untick)</h4>
      <ul className="flex flex-wrap gap-2">
        {member.checkpoints.map((c) => {
          const chip = CHIP[c.status];
          const done = c.status === 'done';
          return (
            <li key={c.code}>
              <button
                type="button"
                aria-pressed={done}
                disabled={busy(edits.checkpoint)}
                onClick={() => edits.checkpoint.mutate({ memberId: member.id, field: FIELD[c.code], value: !done })}
                className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition hover:shadow-sm disabled:opacity-60 ${chip.cls}`}
              >
                <chip.Icon className="h-3.5 w-3.5" aria-hidden="true" />
                M{c.month} {c.label}
                <span className="sr-only"> ({chip.label})</span>
              </button>
            </li>
          );
        })}
      </ul>

      <h4 className="mt-4 mb-2 text-xs font-bold tracking-widest text-gray-700 uppercase">Your plan for {member.name.split(' ')[0]}</h4>
      {member.plan_items.length === 0 && !adding && <p className="text-xs text-gray-600">Nothing added yet. Add your own checkpoints, each with a date.</p>}
      <ul className="space-y-2">
        {member.plan_items.map((it) => {
          const chip = CHIP[it.status];
          if (editing === it.id) {
            return (
              <li key={it.id}>
                <PlanItemForm
                  initial={it}
                  label="Save"
                  saving={busy(edits.update)}
                  onCancel={() => setEditing(null)}
                  onSave={(v) => edits.update.mutate({ memberId: member.id, itemId: it.id, ...v }, { onSuccess: () => setEditing(null) })}
                />
              </li>
            );
          }
          return (
            <li key={it.id} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-3 py-2">
              <input
                type="checkbox"
                checked={it.done}
                aria-label={`Done: ${it.text}`}
                onChange={(e) => edits.update.mutate({ memberId: member.id, itemId: it.id, done: e.target.checked })}
                className="h-5 w-5 shrink-0 accent-ilc-purple"
              />
              <span className="min-w-0 flex-1">
                <span className={`block text-sm ${it.done ? 'text-gray-500 line-through' : 'text-ilc-ink'}`}>{it.text}</span>
                <span className={`inline-flex items-center gap-1 text-xs font-semibold ${chip.cls.split(' ').pop()}`}>
                  <chip.Icon className="h-3 w-3" aria-hidden="true" /> {formatDate(it.due_on)} · {chip.label}
                </span>
              </span>
              <button type="button" onClick={() => setEditing(it.id)} aria-label={`Change ${it.text}`} className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100">
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </button>
              <button type="button" onClick={() => setRemoving(it)} aria-label={`Remove ${it.text}`} className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-700">
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>
      <div className="mt-2">
        {adding ? (
          <PlanItemForm
            label="Add"
            saving={busy(edits.add)}
            onCancel={() => setAdding(false)}
            onSave={(v) => edits.add.mutate({ memberId: member.id, ...v }, { onSuccess: () => setAdding(false) })}
          />
        ) : (
          <button type="button" onClick={() => setAdding(true)} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 text-xs font-bold tracking-widest text-ilc-purple uppercase hover:bg-ilc-purple/5">
            <Plus className="h-4 w-4" aria-hidden="true" /> Add a checkpoint
          </button>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(removing)}
        title="Remove this from the plan?"
        confirmLabel="Remove"
        danger
        loading={busy(edits.remove)}
        onCancel={() => setRemoving(null)}
        onConfirm={() => edits.remove.mutate({ memberId: member.id, itemId: removing.id }, { onSettled: () => setRemoving(null) })}
      >
        <strong>{removing?.text}</strong> will be removed from {member.name}&apos;s plan.
      </ConfirmDialog>
    </article>
  );
}

// Every member's personal 12-month roadmap, anchored to their own join date. Editable: tick the standard
// checkpoints, and add your own with a date.
export default function JourneyPage() {
  const role = useAuthStore((s) => s.user.role);
  const { data, isLoading, isError, error } = useOpsJourney();
  const openMember = useOpenMember();
  const edits = useJourneyEdits();
  const members = data?.members ?? [];

  return (
    <div className="w-full space-y-4">
      <p className="text-sm text-gray-700">
        Each roadmap starts on the member&apos;s own join date. Gold is the current month. Press a checkpoint to tick it off (green) or untick it; red is overdue. Add your own checkpoints with a date.
      </p>
      {isError && <Alert>{getErrorMessage(error)}</Alert>}
      {isLoading ? (
        <div className="glass-card rounded-2xl p-10 text-center text-sm text-gray-600">Loading year plans…</div>
      ) : members.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center">
          <p className="font-serif text-xl font-bold text-ilc-purple">No members yet</p>
          <p className="mt-1 text-sm text-gray-600">Approved members will appear here with their roadmap.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-4 2xl:grid-cols-2">
          {members.map((m) => (
            <JourneyCard key={m.id} member={m} months={data.months} showSpoc={role !== 'SPOC'} onOpen={openMember} edits={edits} />
          ))}
        </div>
      )}
    </div>
  );
}
