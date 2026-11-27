import { useState } from 'react';
import AuthShell from '../../../components/AuthShell.jsx';
import Alert from '../../../components/ui/Alert.jsx';
import Button from '../../../components/ui/Button.jsx';
import PasswordRules from '../../../components/ui/PasswordRules.jsx';
import { isStrongPassword } from '../../../lib/password.js';
import TextField from '../../../components/ui/TextField.jsx';
import { getErrorMessage } from '../../../lib/api-client.js';
import { useChangePassword, useLogout } from '../hooks.js';

// First login: cannot be skipped. The guard keeps the user here until the password is changed.
export default function SetPasswordPage() {
  const change = useChangePassword();
  const logout = useLogout();
  const [currentPassword, setCurrent] = useState('');
  const [newPassword, setNew] = useState('');
  const [confirm, setConfirm] = useState('');

  const mismatch = confirm.length > 0 && confirm !== newPassword;
  const ready = currentPassword && isStrongPassword(newPassword) && confirm === newPassword;

  const submit = (e) => {
    e.preventDefault();
    if (ready) change.mutate({ currentPassword, newPassword });
  };

  return (
    <AuthShell
      title="Set your password"
      subtitle="For your security, replace the temporary password you were sent before you continue."
      footer={
        <button type="button" onClick={() => logout.mutate()} className="font-semibold text-ilc-purple hover:underline">
          Sign out
        </button>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        {change.isError && <Alert>{getErrorMessage(change.error)}</Alert>}

        <TextField
          label="Temporary password"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrent(e.target.value)}
          required
        />
        <TextField
          label="New password"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNew(e.target.value)}
          required
        />
        <PasswordRules password={newPassword} />
        <TextField
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={mismatch ? 'Passwords do not match' : undefined}
          required
        />

        <Button type="submit" loading={change.isPending} disabled={!ready}>
          Save and continue
        </Button>
      </form>
    </AuthShell>
  );
}
