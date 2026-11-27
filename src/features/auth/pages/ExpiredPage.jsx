import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import AuthShell from '../../../components/AuthShell.jsx';
import Alert from '../../../components/ui/Alert.jsx';
import Button from '../../../components/ui/Button.jsx';
import { getErrorMessage } from '../../../lib/api-client.js';
import { useAuthStore } from '../../../store/auth-store.js';
import { useLogout, useRequestRenewal } from '../hooks.js';

const key = (id) => `ilc-renewal-requested-${id}`;
const readSent = (id) => {
  try {
    return localStorage.getItem(key(id)) === '1';
  } catch {
    return false;
  }
};

// Blocks everything when the membership date has passed. One click, then the button stays inert.
export default function ExpiredPage() {
  const user = useAuthStore((s) => s.user);
  const renew = useRequestRenewal();
  const logout = useLogout();
  const [sent, setSent] = useState(() => readSent(user.id));

  const request = () =>
    renew.mutate(undefined, {
      onSuccess: () => {
        setSent(true);
        try {
          localStorage.setItem(key(user.id), '1');
        } catch {
          /* storage may be blocked; the button still stays inert for this visit */
        }
      },
    });

  return (
    <AuthShell
      title="Your membership has expired"
      subtitle="Your access is paused. Request a renewal and your ILC team will extend your membership."
      footer={
        <button type="button" onClick={() => logout.mutate()} className="font-semibold text-ilc-purple hover:underline">
          Sign out
        </button>
      }
    >
      <div className="space-y-4">
        {renew.isError && <Alert>{getErrorMessage(renew.error)}</Alert>}
        {sent ? (
          <div className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-50 px-5 text-[11px] font-bold tracking-widest text-emerald-700 uppercase">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Request sent
          </div>
        ) : (
          <Button onClick={request} loading={renew.isPending}>
            Request renewal
          </Button>
        )}
        {sent && (
          <p className="text-center text-xs text-gray-500">
            Thank you. You will get access back as soon as your membership date is extended.
          </p>
        )}
      </div>
    </AuthShell>
  );
}
