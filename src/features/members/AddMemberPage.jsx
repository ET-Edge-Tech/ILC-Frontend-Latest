import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import ImageUploadField from '../../components/ui/ImageUploadField.jsx';
import PickOrAddField from '../../components/ui/PickOrAddField.jsx';
import SelectField from '../../components/ui/SelectField.jsx';
import TextField from '../../components/ui/TextField.jsx';
import { getErrorMessage } from '../../lib/api-client.js';
import { useAuthStore } from '../../store/auth-store.js';
import { useSpocs } from '../spocs/hooks.js';
import { useCreateMember, useDesignations } from './hooks.js';

const EMPTY = {
  name: '',
  email: '',
  title: '',
  role: 'CEO',
  organisation: '',
  phone: '',
  spoc_id: '',
  membership_start: '',
  membership_end: '',
  bio: '',
};

export default function AddMemberPage() {
  const navigate = useNavigate();
  const create = useCreateMember();
  const { data: spocs = [] } = useSpocs();
  const { data: designations = [] } = useDesignations();
  const [form, setForm] = useState(EMPTY);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const me = useAuthStore((s) => s.user);
  const isMember = form.role === 'CEO';
  const staffName = form.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin';
  const orderError = isMember && form.membership_start && form.membership_end && form.membership_end < form.membership_start ? 'End date must be on or after the start date' : undefined;

  const submit = (e) => {
    e.preventDefault();
    if (orderError) return;
    const { photo, ...rest } = form;
    create.mutate(photo ? { ...rest, photo } : rest, { onSuccess: () => navigate('/admin/members') });
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/admin/members" className="mb-5 inline-flex items-center gap-1.5 text-xs font-semibold text-ilc-purple hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to members
      </Link>

      <form onSubmit={submit} className="glass-card space-y-5 rounded-2xl p-5 sm:p-8" noValidate>
        <div>
          <h2 className="font-serif text-2xl font-semibold text-ilc-purple">{isMember ? 'Add a member' : 'Add an admin'}</h2>
          <p className="mt-1 text-sm text-gray-600">We email them a temporary password. They must choose a new one at first sign-in.</p>
        </div>

        {create.isError && <Alert>{getErrorMessage(create.error)}</Alert>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField label="Full name *" value={form.name} onChange={set('name')} required autoFocus />
          <TextField label="Email *" type="email" value={form.email} onChange={set('email')} required autoComplete="off" />
          <PickOrAddField
            label="Title *"
            value={form.title}
            onChange={(v) => setForm((f) => ({ ...f, title: v }))}
            options={designations}
            placeholder="e.g. Managing Director"
          />
          <div className="sm:col-span-2">
            <ImageUploadField
              label="Photo (optional)"
              mode="dataUrl"
              round
              value={form.photo}
              onChange={(c) => setForm((f) => ({ ...f, photo: c.remove ? '' : c.dataUrl }))}
            />
          </div>
          <SelectField
            label="Role"
            value={form.role}
            onChange={set('role')}
            options={[
              { value: 'CEO', label: 'Member (CEO)' },
              { value: 'ADMIN', label: 'Admin' },
              ...(me?.role === 'SUPER_ADMIN' ? [{ value: 'SUPER_ADMIN', label: 'Super Admin' }] : []),
            ]}
          />
          <TextField label="Phone" value={form.phone} onChange={set('phone')} placeholder="+91 …" />
          {isMember && (
            <>
              <TextField label="Organisation" value={form.organisation} onChange={set('organisation')} />
              <SelectField
                label="SPOC"
                value={form.spoc_id}
                onChange={set('spoc_id')}
                options={[{ value: '', label: 'Not assigned' }, ...spocs.map((s) => ({ value: s.id, label: s.name }))]}
              />
              <TextField label="Membership start" type="date" value={form.membership_start} onChange={set('membership_start')} />
              <TextField label="Membership end" type="date" value={form.membership_end} onChange={set('membership_end')} error={orderError} />
            </>
          )}
        </div>

        {isMember ? (
          <div>
            <label htmlFor="add-bio" className="mb-1.5 block text-xs font-bold tracking-widest text-gray-700 uppercase">
              Bio
            </label>
            <textarea
              id="add-bio"
              rows={3}
              value={form.bio}
              onChange={set('bio')}
              className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm focus:border-ilc-purple focus:ring-2 focus:ring-ilc-purple/15 focus:outline-none"
            />
          </div>
        ) : (
          <p className="rounded-lg bg-ilc-purple/5 px-4 py-3 text-sm text-gray-700">{`A ${staffName} has no profile form, company or membership dates.`} They get an email with a temporary password and can start working straight away.</p>
        )}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Link to="/admin/members" className="inline-flex min-h-11 items-center justify-center rounded-lg px-5 text-xs font-bold tracking-widest text-ilc-purple uppercase hover:bg-ilc-purple/5">
            Cancel
          </Link>
          <Button type="submit" className="sm:w-auto" loading={create.isPending} disabled={!form.name || !form.email || !form.title || Boolean(orderError)}>
            {isMember ? 'Create member' : 'Create admin'}
          </Button>
        </div>
      </form>
    </div>
  );
}
