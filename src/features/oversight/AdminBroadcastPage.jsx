import { useMemo, useState } from 'react';
import { Search, Send } from 'lucide-react';
import Alert from '../../components/ui/Alert.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import Button from '../../components/ui/Button.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import TextField from '../../components/ui/TextField.jsx';
import { getErrorMessage } from '../../lib/api-client.js';
import { toast } from '../../store/toast-store.js';
import { useMembers, useStats } from '../members/hooks.js';
import { useSendBroadcast } from './hooks.js';

const MAX_MESSAGE = 10000;

// Pick the people a broadcast goes to: everyone, or a chosen list.
function MemberPicker({ members, selected, onChange }) {
  const [text, setText] = useState('');
  const shown = useMemo(() => {
    const q = text.trim().toLowerCase();
    return q
      ? members.filter((m) =>
          [m.name, m.organisation, m.title].some((v) => v?.toLowerCase().includes(q)),
        )
      : members;
  }, [members, text]);
  const allShownSelected = shown.length > 0 && shown.every((m) => selected.has(m.id));

  const toggle = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  };
  const toggleShown = () => {
    const next = new Set(selected);
    for (const m of shown) {
      if (allShownSelected) next.delete(m.id);
      else next.add(m.id);
    }
    onChange(next);
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="relative border-b border-gray-100 p-3">
        <label htmlFor="broadcast-search" className="sr-only">
          Search members
        </label>
        <Search
          className="pointer-events-none absolute top-1/2 left-6 h-4 w-4 -translate-y-1/2 text-gray-600"
          aria-hidden="true"
        />
        <input
          id="broadcast-search"
          type="search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Search by name, title or organisation"
          className="min-h-10 w-full rounded-lg border border-gray-200 pr-3 pl-9 text-sm focus:border-ilc-purple focus:ring-2 focus:ring-ilc-purple/15 focus:outline-none"
        />
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-gray-600" aria-live="polite">
            {selected.size} selected
          </span>
          <button
            type="button"
            onClick={toggleShown}
            disabled={shown.length === 0}
            className="font-semibold text-ilc-purple hover:underline disabled:opacity-40"
          >
            {allShownSelected ? 'Clear shown' : 'Select all shown'}
          </button>
        </div>
      </div>
      <ul className="max-h-72 divide-y divide-gray-50 overflow-y-auto">
        {shown.length === 0 && (
          <li className="p-6 text-center text-sm text-gray-600">No members match.</li>
        )}
        {shown.map((m) => (
          <li key={m.id}>
            <label className="flex min-h-12 cursor-pointer items-center gap-3 px-3 py-2 hover:bg-ilc-purple/5">
              <input
                type="checkbox"
                checked={selected.has(m.id)}
                onChange={() => toggle(m.id)}
                className="h-4 w-4 shrink-0 accent-ilc-purple"
              />
              <Avatar name={m.name} initials={m.initials} src={m.photo_url} size="sm" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-ilc-ink">{m.name}</span>
                <span className="block truncate text-xs text-gray-600">
                  {[m.title, m.organisation].filter(Boolean).join(' · ')}
                </span>
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AdminBroadcastPage() {
  const { data: stats } = useStats();
  const { data: everyone = [] } = useMembers({ status: 'APPROVED' });
  const members = useMemo(() => everyone.filter((m) => m.role === 'CEO'), [everyone]);
  const send = useSendBroadcast();

  const [mode, setMode] = useState('all'); // 'all' | 'choose'
  const [selected, setSelected] = useState(() => new Set());
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [done, setDone] = useState(null);

  const total = mode === 'all' ? (stats?.approved ?? members.length) : selected.size;
  const ready = subject.trim() && message.trim() && total > 0;
  const body = () => ({ subject, message, ...(mode === 'choose' && { userIds: [...selected] }) });

  const sendTest = () =>
    send.mutate(
      { ...body(), test: true, userIds: undefined },
      { onSuccess: () => toast.success('A test email is on its way to you.') },
    );

  const sendReal = () =>
    send.mutate(body(), {
      onSuccess: (res) => {
        setConfirm(false);
        setDone(res.message);
        setSubject('');
        setMessage('');
        setSelected(new Set());
      },
      onError: () => setConfirm(false),
    });

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {done && <Alert tone="success">{done}</Alert>}

      <form
        onSubmit={(e) => e.preventDefault()}
        className="glass-card space-y-6 rounded-2xl p-5 sm:p-8"
        noValidate
      >
        <div>
          <h2 className="font-serif text-2xl font-semibold text-ilc-purple">Send a broadcast</h2>
          <p className="mt-1 text-sm text-gray-600">
            An email and a bell notification go to the members you choose. Each email begins with
            &ldquo;Hello &lt;first name&gt;,&rdquo; and ends with that member&apos;s own
            relationship manager details.
          </p>
        </div>

        <fieldset>
          <legend className="mb-2 text-xs font-bold tracking-widest text-gray-700 uppercase">
            Who receives it
          </legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {[
              { value: 'all', label: `All approved members${stats ? ` (${stats.approved})` : ''}` },
              { value: 'choose', label: 'Choose members' },
            ].map((o) => (
              <label
                key={o.value}
                className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-4 text-sm ${mode === o.value ? 'border-ilc-purple bg-ilc-purple/5' : 'border-gray-200 bg-white'}`}
              >
                <input
                  type="radio"
                  name="mode"
                  checked={mode === o.value}
                  onChange={() => setMode(o.value)}
                  className="h-4 w-4 accent-ilc-purple"
                />
                {o.label}
              </label>
            ))}
          </div>
          {mode === 'choose' && (
            <div className="mt-3">
              <MemberPicker members={members} selected={selected} onChange={setSelected} />
            </div>
          )}
        </fieldset>

        <TextField
          label="Subject *"
          value={subject}
          onChange={(e) => setSubject(e.target.value.slice(0, 150))}
          hint={`${subject.length}/150`}
        />

        <div>
          <label
            htmlFor="broadcast-message"
            className="mb-1.5 block text-xs font-bold tracking-widest text-gray-700 uppercase"
          >
            Message *
          </label>
          <textarea
            id="broadcast-message"
            rows={9}
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE))}
            className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm focus:border-ilc-purple focus:ring-2 focus:ring-ilc-purple/15 focus:outline-none"
          />
          <p className="mt-1 text-xs text-gray-600">
            {message.length}/{MAX_MESSAGE}. Plain text: leave a blank line to start a new paragraph.
          </p>
        </div>

        {send.isError && !confirm && <Alert>{getErrorMessage(send.error)}</Alert>}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            className="border border-gray-200 sm:w-auto"
            disabled={!subject.trim() || !message.trim()}
            loading={send.isPending && send.variables?.test}
            onClick={sendTest}
          >
            Send me a test
          </Button>
          <Button
            type="button"
            className="sm:w-auto"
            disabled={!ready}
            onClick={() => setConfirm(true)}
          >
            <Send className="h-4 w-4" aria-hidden="true" /> Send to {total} member
            {total === 1 ? '' : 's'}
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={confirm}
        title={`Send to ${total} member${total === 1 ? '' : 's'}?`}
        confirmLabel="Send now"
        loading={send.isPending}
        onCancel={() => setConfirm(false)}
        onConfirm={sendReal}
      >
        <strong>{subject}</strong> will be emailed to{' '}
        {mode === 'all'
          ? 'all approved members'
          : `${total} chosen member${total === 1 ? '' : 's'}`}
        , in the background. You will get a notification when it has finished. This cannot be
        recalled once sent.
      </ConfirmDialog>
    </div>
  );
}
