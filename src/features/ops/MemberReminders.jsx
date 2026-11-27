import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import { formatDate } from '../../lib/format.js';
import { useAddReminder, useRemoveReminder } from './hooks.js';

// "Remind me on this date" about a member. On that morning a notice appears in the bell.
export default function MemberReminders({ id, reminders, readOnly = false }) {
  const add = useAddReminder(id);
  const remove = useRemoveReminder(id);
  const [date, setDate] = useState('');
  const [text, setText] = useState('');
  const today = new Date().toISOString().slice(0, 10);

  const submit = (e) => {
    e.preventDefault();
    if (!date || !text.trim()) return;
    add.mutate(
      { remind_on: date, text },
      {
        onSuccess: () => {
          setDate('');
          setText('');
        },
      },
    );
  };

  return (
    <div className="space-y-3">
      {!readOnly && (
        <form
          onSubmit={submit}
          className="space-y-3 rounded-xl border border-gray-100 bg-white p-3"
          noValidate
        >
          <div>
            <label
              htmlFor="rem-date"
              className="mb-1.5 block text-[10px] font-bold tracking-widest text-gray-500 uppercase"
            >
              Remind me on
            </label>
            <input
              id="rem-date"
              type="date"
              value={date}
              min={today}
              onChange={(e) => setDate(e.target.value)}
              className="min-h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm focus:border-ilc-purple focus:ring-2 focus:ring-ilc-purple/15 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="rem-text" className="sr-only">
              What to remember
            </label>
            <input
              id="rem-text"
              value={text}
              maxLength={200}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. Ask about the F1 trip"
              className="min-h-11 w-full rounded-lg border border-gray-200 px-3.5 text-sm focus:border-ilc-purple focus:ring-2 focus:ring-ilc-purple/15 focus:outline-none"
            />
          </div>
          <Button
            type="submit"
            className="sm:w-auto"
            loading={add.isPending}
            disabled={!date || !text.trim()}
          >
            Set reminder
          </Button>
        </form>
      )}

      {reminders.length === 0 ? (
        <p className="text-sm font-medium text-gray-700">No open reminders.</p>
      ) : (
        <ul className="space-y-2">
          {reminders.map((r) => (
            <li
              key={r.id}
              className="flex items-start justify-between gap-2 rounded-xl border border-gray-100 bg-white p-3"
            >
              <div className="min-w-0">
                <p className="text-[11px] font-bold tracking-wider text-ilc-gold-deep uppercase">
                  {formatDate(r.remind_on)}
                </p>
                <p className="mt-0.5 text-sm break-words text-ilc-ink">{r.text}</p>
                {readOnly && r.by && <p className="text-xs text-gray-600">Set by {r.by}</p>}
              </div>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => remove.mutate(r.id)}
                  aria-label="Delete reminder"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
