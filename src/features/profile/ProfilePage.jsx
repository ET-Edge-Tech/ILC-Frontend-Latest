import WhatsAppIcon from '../../components/ui/WhatsAppIcon.jsx';
import { useState } from 'react';
import { CalendarDays } from 'lucide-react';
import Alert from '../../components/ui/Alert.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import Button from '../../components/ui/Button.jsx';
import PasswordRules from '../../components/ui/PasswordRules.jsx';
import Switch from '../../components/ui/Switch.jsx';
import ImageUploadField from '../../components/ui/ImageUploadField.jsx';
import SpocCard from '../../components/ui/SpocCard.jsx';
import TextField from '../../components/ui/TextField.jsx';
import { getErrorMessage } from '../../lib/api-client.js';
import { formatDate } from '../../lib/format.js';
import { isStrongPassword } from '../../lib/password.js';
import { toast } from '../../store/toast-store.js';
import { useChangePassword, useSessionRefresh, useSignOutEverywhere } from '../auth/hooks.js';
import { ExpiryText, RoleBadge, StatusBadge } from '../members/StatusBadge.jsx';
import IndustrySelect from '../industries/IndustrySelect.jsx';
import { useUpdateProfile } from './hooks.js';

const ROLE_LABEL = { CEO: 'Member', ADMIN: 'Admin', SUPER_ADMIN: 'Super Admin', SPOC: 'Relationship Manager' };

function Card({ title, children }) {
  return (
    <section className="glass-card rounded-2xl p-5 sm:p-7">
      <h2 className="mb-4 text-xs font-bold tracking-[0.25em] text-ilc-gold-deep uppercase">{title}</h2>
      {children}
    </section>
  );
}

// WhatsApp notices: on for every member with a phone number, and each member can switch them off.
function WhatsAppCard({ me }) {
  const update = useUpdateProfile();
  return (
    <Card title="WhatsApp notices">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold text-ilc-ink"><WhatsAppIcon className="h-5 w-5" /> Get important notices on WhatsApp</p>
          <p className="mt-0.5 text-sm text-gray-700">
            Short messages from the ILC number, for example a new chat message, a reminder the day before an event, or a meeting request. Switch this off any time and you will still see everything in the portal.
          </p>
          <p className="mt-2 text-xs font-semibold text-gray-700">{me.phone ? `We use the phone number in your details: ${me.phone}` : 'Add your phone number in "Your details" below, or WhatsApp has nowhere to go.'}</p>
        </div>
        <Switch checked={me.whatsapp_enabled !== false} disabled={update.isPending} onChange={(v) => update.mutate({ whatsapp_enabled: v })} label="Get important notices on WhatsApp" />
      </div>
    </Card>
  );
}

function DetailsForm({ me }) {
  const update = useUpdateProfile();
  const isSpoc = me.role === 'SPOC';
  const initial = {
    name: me.name ?? '',
    title: me.title ?? '',
    organisation: me.organisation ?? '',
    phone: me.phone ?? '',
    linkedin_url: me.linkedin_url ?? '',
    bio: me.bio ?? '',
    industry_id: me.industry_id ?? '',
  };
  const isMember = me.role === 'CEO';
  const [form, setForm] = useState(initial);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const changed = Object.keys(initial).some((k) => form[k] !== initial[k]);

  const submit = (e) => {
    e.preventDefault();
    // A SPOC can only change name, title and phone.
    // Only members have an industry (an Admin's profile has none, and the server refuses it).
    const { industry_id: industry, ...rest } = form;
    const body = isSpoc ? { name: form.name, title: form.title, phone: form.phone } : isMember ? { ...rest, industry_id: industry || null } : rest;
    update.mutate(body);
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {update.isError && <Alert>{getErrorMessage(update.error)}</Alert>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField label="Full name" value={form.name} onChange={set('name')} required />
        <TextField label="Title" value={form.title} onChange={set('title')} placeholder="e.g. Managing Director" />
        {!isSpoc && <TextField label="Organisation" value={form.organisation} onChange={set('organisation')} />}
        {isMember && <IndustrySelect value={form.industry_id} onChange={(v) => setForm((f) => ({ ...f, industry_id: v }))} />}
        <TextField label="Phone" value={form.phone} onChange={set('phone')} placeholder="+91 …" autoComplete="tel" />
        {!isSpoc && (
          <TextField
            className="sm:col-span-2"
            label="LinkedIn"
            value={form.linkedin_url}
            onChange={set('linkedin_url')}
            placeholder="https://www.linkedin.com/in/yourname"
            inputMode="url"
          />
        )}
      </div>
      {!isSpoc && (
        <div>
          <label htmlFor="profile-bio" className="mb-1.5 block text-xs font-bold tracking-widest text-gray-700 uppercase">
            About you
          </label>
          <textarea
            id="profile-bio"
            rows={4}
            value={form.bio}
            onChange={set('bio')}
            maxLength={2000}
            className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm focus:border-ilc-purple focus:ring-2 focus:ring-ilc-purple/15 focus:outline-none"
          />
          <p className="mt-1 text-right text-xs text-gray-600">{form.bio.length}/2000</p>
        </div>
      )}
      <div className="flex justify-end">
        <Button type="submit" className="sm:w-auto" loading={update.isPending} disabled={!changed || !form.name.trim()}>
          Save changes
        </Button>
      </div>
    </form>
  );
}

function PasswordForm() {
  const change = useChangePassword();
  const [currentPassword, setCurrent] = useState('');
  const [newPassword, setNew] = useState('');
  const [confirm, setConfirm] = useState('');
  const mismatch = confirm.length > 0 && confirm !== newPassword;
  const ready = currentPassword && isStrongPassword(newPassword) && confirm === newPassword;

  const submit = (e) => {
    e.preventDefault();
    if (!ready) return;
    change.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          toast.success('Password changed');
          setCurrent('');
          setNew('');
          setConfirm('');
        },
      },
    );
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {change.isError && <Alert>{getErrorMessage(change.error)}</Alert>}
      <TextField label="Current password" type="password" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrent(e.target.value)} />
      <TextField label="New password" type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNew(e.target.value)} />
      <PasswordRules password={newPassword} />
      <TextField
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        error={mismatch ? 'Passwords do not match' : undefined}
      />
      <div className="flex justify-end">
        <Button type="submit" className="sm:w-auto" loading={change.isPending} disabled={!ready}>
          Change password
        </Button>
      </div>
    </form>
  );
}

export default function ProfilePage() {
  const { data: me, isLoading, isError, error } = useSessionRefresh();
  const updatePhoto = useUpdateProfile();

  if (isLoading) return <div className="glass-card mx-auto max-w-3xl rounded-2xl p-10 text-center text-sm text-gray-600">Loading your profile…</div>;
  if (isError) return <Alert>{getErrorMessage(error)}</Alert>;

  const isMember = me.role === 'CEO';
  // Remount the form when saved values change, so it always shows what is stored.
  const formKey = [me.name, me.title, me.organisation, me.phone, me.linkedin_url, me.bio, me.industry_id].join('|');

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <section className="glass-card flex flex-col items-center gap-4 rounded-2xl p-6 text-center sm:flex-row sm:text-left">
        <Avatar name={me.name} initials={me.initials} src={me.photo_url} size="lg" className="!h-20 !w-20 !text-xl" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-serif text-3xl font-semibold text-ilc-purple">{me.name}</h2>
          <p className="truncate text-sm text-gray-600">{[me.title, me.organisation].filter(Boolean).join(' · ') || ROLE_LABEL[me.role]}</p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5 sm:justify-start">
            {isMember ? <StatusBadge status={me.profile_status} /> : <RoleBadge role={me.role} />}
            <span className="text-xs text-gray-600">{me.email}</span>
          </div>
        </div>
      </section>

      <Card title="Photo">
        <ImageUploadField
          mode="dataUrl"
          round
          value={me.photo_url}
          hint="Your photo shows next to your name for other members. JPG, PNG, GIF or WebP."
          disabled={updatePhoto.isPending}
          onChange={(c) => updatePhoto.mutate({ photo: c.remove ? null : c.dataUrl })}
        />
      </Card>

      {isMember && (me.membership_start || me.membership_end) && (
        <Card title="Membership">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-gray-600" aria-hidden="true" /> {formatDate(me.membership_start)} to {formatDate(me.membership_end)}
            </span>
            {me.membership_end && <ExpiryText membershipEnd={me.membership_end} />}
          </div>
        </Card>
      )}

      {isMember && me.spoc && <SpocCard spoc={me.spoc} />}

      {isMember && <WhatsAppCard me={me} />}

      <Card title="Your details">
        <DetailsForm key={formKey} me={me} />
      </Card>

      <Card title="Change password">
        <PasswordForm />
      </Card>

      <Card title="Signed-in devices">
        <SignOutEverywhere />
      </Card>
    </div>
  );
}

// Signs this account out on every phone, laptop and browser, this one too. Useful after using a shared computer,
// or if a device is lost.
function SignOutEverywhere() {
  const out = useSignOutEverywhere();
  const [sure, setSure] = useState(false);
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-700">Lost a phone, or signed in on a shared computer? Sign out everywhere. You will need to sign in again on every device, this one too.</p>
      {out.isError && <Alert>{getErrorMessage(out.error)}</Alert>}
      {sure ? (
        <div className="flex flex-wrap gap-2">
          <Button variant="danger" className="w-auto" loading={out.isPending} onClick={() => out.mutate()}>
            Yes, sign out everywhere
          </Button>
          <Button variant="ghost" className="w-auto border border-gray-300" onClick={() => setSure(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <Button variant="ghost" className="w-auto border border-gray-300" onClick={() => setSure(true)}>
          Sign out of all devices
        </Button>
      )}
    </div>
  );
}
