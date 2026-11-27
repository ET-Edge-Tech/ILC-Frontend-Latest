import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import AuthShell from '../../../components/AuthShell.jsx';
import Alert from '../../../components/ui/Alert.jsx';
import Button from '../../../components/ui/Button.jsx';
import TextField from '../../../components/ui/TextField.jsx';
import { getErrorMessage } from '../../../lib/api-client.js';
import { useAuthStore } from '../../../store/auth-store.js';
import { useLogin, useLoginCode, useResendLoginCode } from '../hooks.js';

export default function LoginPage() {
  const token = useAuthStore((s) => s.token);
  const sessionExpired = useAuthStore((s) => s.sessionExpired);
  const login = useLogin();
  const verify = useLoginCode();
  const resend = useResendLoginCode();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState(null); // staff: { challenge, email_hint } after the password
  const [code, setCode] = useState('');

  // Already signed in: the guard sends them to the right screen.
  if (token) return <Navigate to="/" replace />;

  const submit = (e) => {
    e.preventDefault();
    login.mutate(
      { email, password },
      {
        onSuccess: (data) => {
          if (data.mfa_required) {
            setStep({ challenge: data.challenge, email_hint: data.email_hint });
            setPassword('');
          }
        },
      },
    );
  };

  if (step) {
    const sendCode = (e) => {
      e.preventDefault();
      verify.mutate({ challenge: step.challenge, code: code.trim() });
    };
    const restart = () => {
      setStep(null);
      setCode('');
      verify.reset();
      resend.reset();
    };
    return (
      <AuthShell title="Check your email" subtitle={`We sent a 6-digit code to ${step.email_hint}. It works for 10 minutes.`} footer="Staff accounts need this second step every time they sign in, so a stolen password alone is not enough.">
        <form onSubmit={sendCode} className="space-y-4" noValidate>
          {verify.isError && <Alert>{getErrorMessage(verify.error)}</Alert>}
          {resend.isSuccess && !verify.isError && <Alert tone="success">A new code has been sent.</Alert>}
          {resend.isError && <Alert>{getErrorMessage(resend.error)}</Alert>}
          <TextField
            label="Sign-in code"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="6 digits"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            required
            autoFocus
          />
          <Button type="submit" loading={verify.isPending} disabled={code.length !== 6}>
            Sign in
          </Button>
          <div className="flex flex-wrap justify-between gap-2 text-xs font-semibold">
            <button type="button" className="text-ilc-purple hover:underline" disabled={resend.isPending} onClick={() => resend.mutate(step.challenge)}>
              Send a new code
            </button>
            <button type="button" className="text-gray-700 hover:underline" onClick={restart}>
              Start again
            </button>
          </div>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to the ILC Member Portal."
      footer="Access is by invitation only. Contact your ILC relationship manager if you cannot sign in."
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        {sessionExpired && !login.isError && (
          <Alert tone="warning">You were signed out. Please sign in again. (Staff are signed out after 2 hours without activity.)</Alert>
        )}
        {login.isError && <Alert>{getErrorMessage(login.error)}</Alert>}

        <TextField
          label="Email"
          type="email"
          autoComplete="username"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <div className="text-right">
          <Link to="/forgot-password" className="text-xs font-semibold text-ilc-purple hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" loading={login.isPending} disabled={!email || !password}>
          Sign in
        </Button>
      </form>
    </AuthShell>
  );
}
