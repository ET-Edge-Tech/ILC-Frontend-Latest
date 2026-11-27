import { Check, Circle } from 'lucide-react';
import { passwordChecks } from '../../lib/password.js';

// Live checklist so people see what is still missing while they type.
export default function PasswordRules({ password }) {
  return (
    <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2" aria-label="Password rules">
      {passwordChecks(password).map((c) => (
        <li key={c.label} className={`flex items-center gap-1.5 text-xs ${c.ok ? 'text-emerald-600' : 'text-gray-600'}`}>
          {c.ok ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Circle className="h-3 w-3" aria-hidden="true" />}
          {c.label}
          <span className="sr-only">{c.ok ? ' (done)' : ' (not yet)'}</span>
        </li>
      ))}
    </ul>
  );
}
