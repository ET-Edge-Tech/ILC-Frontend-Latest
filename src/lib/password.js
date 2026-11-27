// Same rule as the backend (the backend is the source of truth; this only gives live hints).
export const passwordChecks = (pw) => [
  { label: 'At least 8 characters', ok: pw.length >= 8 },
  { label: 'One uppercase letter', ok: /[A-Z]/.test(pw) },
  { label: 'One number', ok: /[0-9]/.test(pw) },
  { label: 'One special character', ok: /[^A-Za-z0-9]/.test(pw) },
];

export const isStrongPassword = (pw) => passwordChecks(pw).every((c) => c.ok);
