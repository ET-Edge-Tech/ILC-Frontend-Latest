import { Link } from 'react-router-dom';
import { ChevronRight, ShieldCheck } from 'lucide-react';
import Alert from '../../components/ui/Alert.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import { getErrorMessage } from '../../lib/api-client.js';
import { useAuthStore } from '../../store/auth-store.js';
import { useAccess } from './hooks.js';

const ROLE_LABEL = { SUPER_ADMIN: 'Super Admin', ADMIN: 'Admin', SPOC: 'Relationship manager' };

// Who works for ILC and what each person may do. Only the Super Admin sees this page.
export default function AccessPage() {
  const me = useAuthStore((s) => s.user);
  const { data, isLoading, isError, error } = useAccess();
  const staff = data?.staff ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="glass-card flex items-start gap-3 rounded-2xl p-5">
        <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-ilc-purple" aria-hidden="true" />
        <div>
          <h2 className="text-lg font-bold text-ilc-ink">Who can do what</h2>
          <p className="mt-1 text-sm text-gray-700">
            Every Admin and relationship manager starts with the standard set for their role. Open a person to give them
            an extra permission, take one away, or switch off their sign-in. Changes apply straight away.
          </p>
        </div>
      </div>

      {isError && <Alert>{getErrorMessage(error)}</Alert>}
      {isLoading && <div className="glass-card rounded-2xl p-10 text-center text-sm font-medium text-gray-700">Loading…</div>}

      <ul className="space-y-3">
        {staff.map((s) => {
          const mine = s.id === me.id;
          const extra = Object.values(s.overrides).filter(Boolean).length;
          const removed = Object.values(s.overrides).filter((v) => !v).length;
          return (
            <li key={`${s.kind}-${s.id}`}>
              <Link
                to={`/admin/access/${s.kind}/${s.id}`}
                className="glass-card flex items-center gap-3 rounded-2xl p-4 transition hover:shadow-md"
              >
                <Avatar name={s.name} initials={s.initials} src={s.photo_url} size="md" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-bold text-ilc-ink">
                    {s.name} {mine && <span className="text-sm font-medium text-gray-600">(you)</span>}
                  </span>
                  <span className="block truncate text-sm text-gray-700">
                    {ROLE_LABEL[s.role]} · {s.email}
                  </span>
                </span>
                <span className="flex flex-wrap items-center justify-end gap-1.5">
                  {!s.can_sign_in && <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700">Sign-in off</span>}
                  {s.role === 'SUPER_ADMIN' ? (
                    <span className="rounded-full bg-ilc-purple/10 px-2.5 py-0.5 text-xs font-bold text-ilc-purple">Everything</span>
                  ) : (
                    <>
                      {extra > 0 && <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">+{extra} extra</span>}
                      {removed > 0 && <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700">−{removed} removed</span>}
                      {extra === 0 && removed === 0 && <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-gray-700">Standard</span>}
                    </>
                  )}
                </span>
                <ChevronRight className="h-5 w-5 shrink-0 text-gray-500" aria-hidden="true" />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
