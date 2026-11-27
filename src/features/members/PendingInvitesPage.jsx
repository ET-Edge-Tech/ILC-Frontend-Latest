import { useState } from 'react';
import { Send } from 'lucide-react';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import { getErrorMessage } from '../../lib/api-client.js';
import { formatDate } from '../../lib/format.js';
import { usePendingInvites, useSendInvites, useSettings, useUpdateSettings } from './hooks.js';

export default function PendingInvitesPage() {
  const { data: pending = [], isLoading, isError, error } = usePendingInvites();
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();
  const send = useSendInvites();
  const [confirm, setConfirm] = useState(false);
  const hold = settings?.bulk_upload_hold_emails ?? true;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <section className="glass-card rounded-2xl p-5 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-ilc-purple">Hold welcome emails</h2>
            <p className="mt-1 text-sm text-gray-600">
              When on, members added by bulk upload are created but not emailed. You review them below and send all invites at once.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={hold}
            aria-label="Hold welcome emails for bulk uploads"
            disabled={!settings || updateSettings.isPending}
            onClick={() => updateSettings.mutate({ bulk_upload_hold_emails: !hold })}
            className={`relative mt-1 h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-60 ${hold ? 'bg-ilc-purple' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${hold ? 'translate-x-5' : ''}`} />
          </button>
        </div>
      </section>

      {isError && <Alert>{getErrorMessage(error)}</Alert>}

      <section className="glass-card rounded-2xl p-5 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-ilc-purple">Pending invites</h2>
            <p className="text-sm text-gray-600">{isLoading ? 'Loading…' : `${pending.length} waiting to be emailed`}</p>
          </div>
          <Button className="sm:w-auto" disabled={pending.length === 0} onClick={() => setConfirm(true)}>
            <Send className="h-4 w-4" aria-hidden="true" /> Send all invites
          </Button>
        </div>

        {pending.length === 0 && !isLoading ? (
          <p className="mt-6 rounded-xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-600">
            Nothing is waiting. Members from a bulk upload appear here while emails are on hold.
          </p>
        ) : (
          <ul className="mt-5 divide-y divide-gray-100">
            {pending.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ilc-ink">{u.name}</p>
                  <p className="truncate text-xs text-gray-600">
                    {u.email} · {u.title}
                  </p>
                </div>
                <span className="text-xs text-gray-600">Added {formatDate(u.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={confirm}
        title="Send all invites?"
        confirmLabel="Send invites"
        loading={send.isPending}
        onCancel={() => setConfirm(false)}
        onConfirm={() => send.mutate(undefined, { onSettled: () => setConfirm(false) })}
      >
        A welcome email with a temporary password goes to {pending.length} member{pending.length === 1 ? '' : 's'}. Any email that fails stays in this list so you can try again.
      </ConfirmDialog>
    </div>
  );
}
