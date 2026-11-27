import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Alert from '../../components/ui/Alert.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import Button from '../../components/ui/Button.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import Switch from '../../components/ui/Switch.jsx';
import { getErrorMessage } from '../../lib/api-client.js';
import { useAuthStore } from '../../store/auth-store.js';
import { useAccess, useUpdateAccess } from './hooks.js';

const ROLE_LABEL = { SUPER_ADMIN: 'Super Admin', ADMIN: 'Admin', SPOC: 'Relationship manager' };

// One person: their sign-in switch, and every permission with a switch (standard / extra / removed).
export default function AccessDetailPage() {
  const { kind, id } = useParams();
  const me = useAuthStore((s) => s.user);
  const { data, isLoading, isError, error } = useAccess();
  const update = useUpdateAccess(kind, id);
  const person = data?.staff.find((s) => s.kind === kind && s.id === id);
  const [edits, setEdits] = useState({}); // only the switches changed since the last save: { permission key: on/off }
  const [confirmOff, setConfirmOff] = useState(false);

  const catalog = useMemo(() => (data?.catalog ?? []).filter((c) => c.grantable), [data]);
  const standard = useMemo(() => new Set(data?.defaults?.[person?.role] ?? []), [data, person?.role]);

  if (isLoading || !data) return <div className="glass-card mx-auto max-w-3xl rounded-2xl p-10 text-center text-sm font-medium text-gray-700">Loading…</div>;
  if (isError) return <Alert>{getErrorMessage(error)}</Alert>;
  if (!person) {
    return (
      <div className="mx-auto max-w-3xl space-y-3">
        <Alert>This account was not found.</Alert>
        <Link to="/admin/access" className="text-sm font-bold text-ilc-purple hover:underline">Back to the list</Link>
      </div>
    );
  }

  const locked = person.role === 'SUPER_ADMIN' || person.id === me.id;
  const saved = (key) => person.permissions.includes(key);
  const isOn = (key) => (key in edits ? edits[key] : saved(key));
  const changed = catalog.some((c) => isOn(c.key) !== saved(c.key));
  const fullState = () => Object.fromEntries(catalog.map((c) => [c.key, isOn(c.key)]));
  const groups = [...new Set(catalog.map((c) => c.group))];
  const tag = (key) => {
    const on = isOn(key);
    if (on && !standard.has(key)) return { text: 'Extra', cls: 'bg-amber-100 text-amber-800' };
    if (!on && standard.has(key)) return { text: 'Removed', cls: 'bg-red-100 text-red-700' };
    if (on) return { text: 'Standard', cls: 'bg-gray-100 text-gray-700' };
    return null;
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link to="/admin/access" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-ilc-purple hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to the list
      </Link>

      <header className="glass-card flex items-center gap-4 rounded-2xl p-5">
        <Avatar name={person.name} initials={person.initials} src={person.photo_url} size="lg" />
        <div className="min-w-0">
          <h2 className="truncate font-serif text-2xl font-semibold text-ilc-purple">{person.name}</h2>
          <p className="truncate text-sm font-medium text-gray-700">{ROLE_LABEL[person.role]} · {person.email}</p>
        </div>
      </header>

      {locked && (
        <Alert tone="warning">
          {person.role === 'SUPER_ADMIN' ? 'A Super Admin always has everything and cannot be changed here.' : 'You cannot change your own access.'}
        </Alert>
      )}
      {update.isError && <Alert>{getErrorMessage(update.error)}</Alert>}

      <section className="glass-card flex items-center justify-between gap-4 rounded-2xl p-5">
        <div>
          <h3 className="text-lg font-bold text-ilc-ink">Can sign in</h3>
          <p className="mt-0.5 text-sm text-gray-700">
            {person.can_sign_in ? 'This person can sign in.' : 'Switched off: they are signed out and cannot sign in. Nothing is deleted.'}
          </p>
        </div>
        <Switch
          checked={person.can_sign_in}
          label="Can sign in"
          disabled={locked || update.isPending}
          onChange={(on) => (on ? update.mutate({ can_sign_in: true }) : setConfirmOff(true))}
        />
      </section>

      <section className="glass-card space-y-5 rounded-2xl p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-ilc-ink">What this person may do</h3>
            <p className="mt-0.5 text-sm text-gray-700">Standard means the starting set for their role. Extra and Removed are changes made for this person.</p>
          </div>
          {!locked && (
            <Button
              variant="ghost"
              className="border border-gray-300 sm:w-auto"
              disabled={update.isPending}
              onClick={() => setEdits(Object.fromEntries(catalog.map((c) => [c.key, standard.has(c.key)])))}
            >
              Reset to standard
            </Button>
          )}
        </div>

        {groups.map((g) => (
          <div key={g}>
            <h4 className="mb-2 text-xs font-bold tracking-widest text-ilc-gold-deep uppercase">{g}</h4>
            <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
              {catalog.filter((c) => c.group === g).map((c) => {
                const t = tag(c.key);
                return (
                  <li key={c.key} className="flex items-center justify-between gap-4 p-4">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-ilc-ink">
                        {c.label}
                        {t && <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${t.cls}`}>{t.text}</span>}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-700">{c.hint}</p>
                    </div>
                    <Switch
                      checked={isOn(c.key)}
                      label={c.label}
                      disabled={locked || update.isPending}
                      onChange={(on) => setEdits((d) => ({ ...d, [c.key]: on }))}
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        {!locked && (
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" className="sm:w-auto" loading={update.isPending} disabled={!changed} onClick={() => update.mutate({ overrides: fullState() }, { onSuccess: () => setEdits({}) })}>
              Save changes
            </Button>
          </div>
        )}
      </section>

      <ConfirmDialog
        open={confirmOff}
        danger
        title="Switch off sign-in?"
        confirmLabel="Switch off"
        loading={update.isPending}
        onCancel={() => setConfirmOff(false)}
        onConfirm={() => update.mutate({ can_sign_in: false }, { onSettled: () => setConfirmOff(false) })}
      >
        <strong>{person.name}</strong> will be signed out straight away and will not be able to sign in until you switch it back on. Nothing is deleted.
      </ConfirmDialog>
    </div>
  );
}
