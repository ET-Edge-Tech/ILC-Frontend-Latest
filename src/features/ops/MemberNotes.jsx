import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import SelectField from '../../components/ui/SelectField.jsx';
import { formatDate } from '../../lib/format.js';
import { useAddNote, useDeleteNote } from './hooks.js';

const KINDS = ['Call', 'Meeting', 'Email', 'Message', 'Other'];
const MAX = 300;

// A short log of what happened with this member. The note text is never written to the audit log.
export default function MemberNotes({ id, notes }) {
  const add = useAddNote(id);
  const remove = useDeleteNote(id);
  const [kind, setKind] = useState('Call');
  const [text, setText] = useState('');
  const [date, setDate] = useState('');
  const [toDelete, setToDelete] = useState(null);
  const today = new Date().toISOString().slice(0, 10);

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    add.mutate(
      { kind, note: text, ...(date ? { occurred_on: date } : {}) },
      {
        onSuccess: () => {
          setText('');
          setDate('');
        },
      },
    );
  };

  return (
    <div className="space-y-3">
      <form onSubmit={submit} className="space-y-3 rounded-xl border border-gray-100 bg-white p-3" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <SelectField
            label="Type"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            options={KINDS.map((k) => ({ value: k, label: k }))}
          />
          <div>
            <label
              htmlFor="note-date"
              className="mb-1.5 block text-[10px] font-bold tracking-widest text-gray-500 uppercase"
            >
              Date (today if empty)
            </label>
            <input
              id="note-date"
              type="date"
              value={date}
              max={today}
              onChange={(e) => setDate(e.target.value)}
              className="min-h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm focus:border-ilc-purple focus:ring-2 focus:ring-ilc-purple/15 focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label htmlFor="note-text" className="sr-only">
            Note
          </label>
          <textarea
            id="note-text"
            rows={3}
            maxLength={MAX}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What happened? Keep it short."
            className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm focus:border-ilc-purple focus:ring-2 focus:ring-ilc-purple/15 focus:outline-none"
          />
          <p className="mt-1 text-right text-xs text-gray-400">
            {text.length}/{MAX}
          </p>
        </div>
        <Button type="submit" className="sm:w-auto" loading={add.isPending} disabled={!text.trim()}>
          Add note
        </Button>
      </form>

      {notes.length === 0 ? (
        <p className="text-sm text-gray-500">No notes yet.</p>
      ) : (
        <ul className="space-y-2">
          {notes.map((n) => (
            <li key={n.id} className="rounded-xl border border-gray-100 bg-white p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[11px] text-gray-500">
                  <span className="mr-1.5 rounded-full bg-ilc-purple/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-ilc-purple uppercase">
                    {n.kind}
                  </span>
                  {formatDate(n.occurred_on)} · {n.author_name}
                </p>
                <button
                  type="button"
                  onClick={() => setToDelete(n)}
                  aria-label="Delete note"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-1.5 text-sm break-words whitespace-pre-wrap text-ilc-ink">{n.note}</p>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        danger
        title="Delete this note?"
        confirmLabel="Delete note"
        loading={remove.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => remove.mutate(toDelete.id, { onSettled: () => setToDelete(null) })}
      >
        The note will be removed. This cannot be undone.
      </ConfirmDialog>
    </div>
  );
}
