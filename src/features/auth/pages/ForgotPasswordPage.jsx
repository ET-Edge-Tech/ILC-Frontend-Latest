import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import AuthShell from '../../../components/AuthShell.jsx';
import Alert from '../../../components/ui/Alert.jsx';
import Button from '../../../components/ui/Button.jsx';
import PasswordRules from '../../../components/ui/PasswordRules.jsx';
import { isStrongPassword } from '../../../lib/password.js';
import TextField from '../../../components/ui/TextField.jsx';
import { getErrorMessage } from '../../../lib/api-client.js';
import { useAuthStore } from '../../../store/auth-store.js';
import { useRequestOtp, useVerifyOtp } from '../hooks.js';

// Step 1: ask for a code by email. Step 2: code + new password on one form, then signed in.
export default function ForgotPasswordPage() {
  const token = useAuthStore((s) => s.token);
  const requestOtp = useRequestOtp();
  const verify = useVerifyOtp();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNew] = useState('');

  if (token) return <Navigate to="/" replace />;

  const sendCode = (e) => {
    e.preventDefault();
    requestOtp.mutate(email, { onSuccess: () => setStep('reset') });
  };

  const reset = (e) => {
    e.preventDefault();
    verify.mutate({ email, otp, newPassword });
  };

  const footer = (
    <Link to="/login" className="font-semibold text-ilc-purple hover:underline">
      Back to sign in
    </Link>
  );

  if (step === 'email') {
    return (
      <AuthShell title="Forgot password" subtitle="Enter your email and we will send you a 6-digit code." footer={footer}>
        <form onSubmit={sendCode} className="space-y-4" noValidate>
          {requestOtp.isError && <Alert>{getErrorMessage(requestOtp.error)}</Alert>}
          <TextField
            label="Email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
          <Button type="submit" loading={requestOtp.isPending} disabled={!email}>
            Send code
          </Button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Check your email" subtitle="If that email is registered, a 6-digit code is on its way. It is valid for 10 minutes." footer={footer}>
      <form onSubmit={reset} className="space-y-4" noValidate>
        {verify.isError && <Alert>{getErrorMessage(verify.error)}</Alert>}
        <TextField
          label="6-digit code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
          required
          autoFocus
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
        <Button type="submit" loading={verify.isPending} disabled={otp.length !== 6 || !isStrongPassword(newPassword)}>
          Reset password
        </Button>
        <button
          type="button"
          onClick={() => {
            setStep('email');
            setOtp('');
          }}
          className="w-full text-center text-xs font-semibold text-ilc-purple hover:underline"
        >
          Use a different email or send a new code
        </button>
      </form>
    </AuthShell>
  );
}
