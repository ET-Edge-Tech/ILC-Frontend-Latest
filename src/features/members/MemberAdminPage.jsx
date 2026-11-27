import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarClock, ExternalLink, Mail, Phone } from 'lucide-react';
import Alert from '../../components/ui/Alert.jsx';
import { getErrorMessage } from '../../lib/api-client.js';
import Avatar from '../../components/ui/Avatar.jsx';
import Button from '../../components/ui/Button.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import ImageUploadField from '../../components/ui/ImageUploadField.jsx';
import PickOrAddField from '../../components/ui/PickOrAddField.jsx';
import SelectField from '../../components/ui/SelectField.jsx';
import Switch from '../../components/ui/Switch.jsx';
import TextField from '../../components/ui/TextField.jsx';
import { expiryInfo, formatDate } from '../../lib/format.js';
import { useAuthStore } from '../../store/auth-store.js';
import { useUpdateAccess } from '../access/hooks.js';
import { can } from '../auth/routing.js';
import IndustrySelect from '../industries/IndustrySelect.jsx';
import { useSpocs } from '../spocs/hooks.js';
import {
  useApprove,
  useAssignSpoc,
  useDesignations,
  useExtendYear,
  useHardDelete,
  useMarkSubmitted,
  useMember,
  useReject,
  useSoftDelete,
  useUpdateMember,
  useUpdateMembership,
} from './hooks.js';
import { RoleBadge, StatusBadge } from './StatusBadge.jsx';

function Section({ title, children, tone = 'default' }) {
  return (
    <section className={`rounded-2xl border p-5 sm:p-6 ${tone === 'danger' ? 'border-red-200 bg-red-50/40' : 'border-gray-100 bg-white'}`}>
      <h3 className={`mb-3 text-xs font-bold tracking-[0.25em] uppercase ${tone === 'danger' ? 'text-red-600' : 'text-ilc-gold-deep'}`}>{title}</h3>
      {children}
    </section>
  );
}

function DetailsSection({ member }) {
  const update = useUpdateMember();
  const { data: designations = [] } = useDesignations();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: member.name,
    title: member.title ?? '',
    phone: member.phone ?? '',
    organisation: member.organisation ?? '',
    bio: member.bio ?? '',
    industry_id: member.industry_id ?? '',
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // undefined = leave the photo as it is, null = remove it, text = the new picture
  const [photo, setPhoto] = useState(undefined);

  const save = (e) => {
    e.preventDefault();
    update.mutate(
      {
        id: member.id,
        ...form,
        // An industry belongs to members only; '' clears it.
        industry_id: member.role === 'CEO' ? form.industry_id || null : undefined,
        ...(photo !== undefined ? { photo } : {}),
      },
      { onSuccess: () => setEditing(false) },
    );
  };

  if (!editing) {
    return (
      <Section title="Details">
        <dl className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Mail className="h-4 w-4 shrink-0 text-gray-600" aria-hidden="true" />
            <a href={`mailto:${member.email}`} className="min-w-0 truncate hover:underline">
              {member.email}
            </a>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Phone className="h-4 w-4 shrink-0 text-gray-600" aria-hidden="true" />
            {member.phone || <span className="text-gray-600">No phone</span>}
          </div>
          {member.organisation && <p className="text-gray-600">{member.organisation}</p>}
          {member.role === 'CEO' && <p className="text-gray-600">Industry: {member.industry?.name ?? 'Not set'}</p>}
          {member.linkedin_url && (
            <a href={member.linkedin_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-ilc-purple hover:underline">
              <ExternalLink className="h-4 w-4" aria-hidden="true" /> LinkedIn
            </a>
          )}
          {member.bio && <p className="pt-1 text-gray-600">{member.bio}</p>}
        </dl>
        <Button variant="ghost" className="mt-3" onClick={() => setEditing(true)}>
          Edit details
        </Button>
      </Section>
    );
  }

  return (
    <Section title="Edit details">
      <form onSubmit={save} className="space-y-3">
        <ImageUploadField
          label="Photo"
          mode="dataUrl"
          round
          value={photo === null ? '' : (photo ?? member.photo_url)}
          onChange={(c) => setPhoto(c.remove ? null : c.dataUrl)}
        />
        <TextField label="Full name" value={form.name} onChange={set('name')} required />
        <PickOrAddField
          label="Title"
          value={form.title}
          onChange={(v) => setForm((f) => ({ ...f, title: v }))}
          options={designations}
          placeholder="e.g. Managing Director"
        />
        <TextField label="Organisation" value={form.organisation} onChange={set('organisation')} />
        {member.role === 'CEO' && <IndustrySelect value={form.industry_id} onChange={(v) => setForm((f) => ({ ...f, industry_id: v }))} />}
        <TextField label="Phone" value={form.phone} onChange={set('phone')} />
        <div>
          <label htmlFor="edit-bio" className="mb-1.5 block text-xs font-bold tracking-widest text-gray-700 uppercase">
            Bio
          </label>
          <textarea
            id="edit-bio"
            rows={3}
            value={form.bio}
            onChange={set('bio')}
            className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm focus:border-ilc-purple focus:ring-2 focus:ring-ilc-purple/15 focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" loading={update.isPending}>
            Save
          </Button>
          <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
      </form>
    </Section>
  );
}

function SpocSection({ member }) {
  const { data: spocs = [] } = useSpocs();
  const assign = useAssignSpoc();
  const [spocId, setSpocId] = useState(member.spoc_id ?? '');
  const changed = spocId !== (member.spoc_id ?? '');

  return (
    <Section title="Relationship manager (SPOC)">
      <SelectField
        label="Assigned SPOC"
        value={spocId}
        onChange={(e) => setSpocId(e.target.value)}
        options={[{ value: '', label: 'Not assigned' }, ...spocs.map((s) => ({ value: s.id, label: s.name }))]}
      />
      <Button className="mt-3" disabled={!changed} loading={assign.isPending} onClick={() => assign.mutate({ id: member.id, spocId: spocId || null })}>
        Save SPOC
      </Button>
    </Section>
  );
}

function MembershipSection({ member }) {
  const updateDates = useUpdateMembership();
  const extend = useExtendYear();
  const [start, setStart] = useState(member.membership_start ?? '');
  const [end, setEnd] = useState(member.membership_end ?? '');
  const info = expiryInfo(member.membership_end);
  const needsRenewal = member.role === 'CEO' && (info.tone === 'expired' || info.tone === 'soon');
  const changed = start !== (member.membership_start ?? '') || end !== (member.membership_end ?? '');
  const orderError = start && end && end < start ? 'End date must be on or after the start date' : undefined;

  return (
    <>
      {needsRenewal && (
        <Section title="Renewal">
          <p className="mb-3 flex items-center gap-2 text-sm text-gray-600">
            <CalendarClock className="h-4 w-4 text-amber-600" aria-hidden="true" />
            {info.tone === 'expired' ? 'This membership has expired.' : `Membership ends in ${info.days} days.`}
          </p>
          <Button loading={extend.isPending} onClick={() => extend.mutate(member.id)}>
            Extend by 1 year
          </Button>
        </Section>
      )}
      <Section title="Membership dates">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TextField label="Start" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          <TextField label="End" type="date" value={end} onChange={(e) => setEnd(e.target.value)} error={orderError} />
        </div>
        <Button
          className="mt-3"
          disabled={!changed || Boolean(orderError)}
          loading={updateDates.isPending}
          onClick={() => updateDates.mutate({ id: member.id, membership_start: start || null, membership_end: end || null })}
        >
          Update dates
        </Button>
      </Section>
    </>
  );
}

function ReviewSection({ member }) {
  const approve = useApprove();
  const reject = useReject();
  const mark = useMarkSubmitted();

  if (member.profile_status === 'SUBMITTED') {
    return (
      <Section title="Profile review">
        <p className="mb-3 text-sm text-gray-600">This member submitted their profile and is waiting for review.</p>
        <div className="flex gap-2">
          <Button loading={approve.isPending} onClick={() => approve.mutate(member.id)}>
            Approve
          </Button>
          <Button variant="ghost" className="text-red-600 hover:bg-red-50" loading={reject.isPending} onClick={() => reject.mutate(member.id)}>
            Reject
          </Button>
        </div>
      </Section>
    );
  }

  // Testing helper from the old app. Only shown while developing.
  if (import.meta.env.DEV && member.role === 'CEO' && member.profile_status === 'PENDING') {
    return (
      <Section title="Testing">
        <p className="mb-3 text-xs text-gray-600">Development only: move this member into the review queue without them filling the form.</p>
        <Button variant="ghost" loading={mark.isPending} onClick={() => mark.mutate(member.id)}>
          Mark as submitted
        </Button>
      </Section>
    );
  }
  return null;
}

function DangerZone({ member, onDeleted }) {
  const me = useAuthStore((s) => s.user);
  const soft = useSoftDelete();
  const hard = useHardDelete();
  const [dialog, setDialog] = useState(null); // 'soft' | 'hard' | null

  const isSelf = me.id === member.id;
  const blockedByRole = member.role !== 'CEO' && me.role !== 'SUPER_ADMIN';
  if (isSelf) return null;
  if (blockedByRole) {
    return (
      <Section title="Danger zone" tone="danger">
        <p className="text-sm text-gray-600">Only a Super Admin can remove an admin account.</p>
      </Section>
    );
  }

  const done = () => {
    setDialog(null);
    onDeleted();
  };

  return (
    <Section title="Danger zone" tone="danger">
      <div className="space-y-4">
        <div>
          <p className="text-sm font-semibold text-ilc-ink">Deactivate</p>
          <p className="mb-2 text-xs text-gray-600">Switches the account off and frees the email address. Their history is kept.</p>
          <Button variant="ghost" className="border border-red-200 text-red-600 hover:bg-red-50" onClick={() => setDialog('soft')}>
            Deactivate member
          </Button>
        </div>
        <div className="border-t border-red-100 pt-4">
          <p className="text-sm font-semibold text-red-700">Delete permanently</p>
          <p className="mb-2 text-xs text-gray-600">Removes the member and all their data. This cannot be undone.</p>
          <Button className="bg-red-600 hover:bg-red-700" onClick={() => setDialog('hard')}>
            Delete permanently
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={dialog === 'soft'}
        danger
        title="Deactivate this member?"
        confirmLabel="Deactivate"
        loading={soft.isPending}
        onCancel={() => setDialog(null)}
        onConfirm={() => soft.mutate(member.id, { onSuccess: done })}
      >
        <strong>{member.name}</strong> will no longer be able to sign in. Their history is kept and their email address becomes free to use again.
      </ConfirmDialog>

      <ConfirmDialog
        open={dialog === 'hard'}
        danger
        title="Delete permanently?"
        confirmLabel="Delete forever"
        typeToConfirm={member.name}
        loading={hard.isPending}
        onCancel={() => setDialog(null)}
        onConfirm={() => hard.mutate({ id: member.id, confirm_name: member.name }, { onSuccess: done })}
      >
        This removes <strong>{member.name}</strong> and all of their bookings, messages and notifications. <strong>This cannot be undone.</strong>
      </ConfirmDialog>
    </Section>
  );
}

// Only the Super Admin sees this: switch a member's sign-in off (they are signed out and cannot return) or back on.
function AccessSection({ member }) {
  const user = useAuthStore((s) => s.user);
  const update = useUpdateAccess('user', member.id);
  const [confirm, setConfirm] = useState(false);
  if (!can(user, 'access.manage') || member.role !== 'CEO') return null;
  return (
    <Section title="Account access">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-ilc-ink">Can sign in</p>
          <p className="text-xs text-gray-700">
            {member.can_sign_in === false ? 'Switched off: signed out, cannot sign in. Nothing is deleted.' : 'This member can sign in.'}
          </p>
        </div>
        <Switch
          checked={member.can_sign_in !== false}
          label="Can sign in"
          disabled={update.isPending}
          onChange={(on) => (on ? update.mutate({ can_sign_in: true }) : setConfirm(true))}
        />
      </div>
      <ConfirmDialog
        open={confirm}
        danger
        title="Switch off sign-in?"
        confirmLabel="Switch off"
        loading={update.isPending}
        onCancel={() => setConfirm(false)}
        onConfirm={() => update.mutate({ can_sign_in: false }, { onSettled: () => setConfirm(false) })}
      >
        <strong>{member.name}</strong> will be signed out straight away and cannot sign in until you switch it back on.
      </ConfirmDialog>
    </Section>
  );
}

// The admin's full page for one member: everything an admin can do to them.
export default function MemberAdminPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: member, isLoading, isError, error } = useMember(id);
  const back = () => navigate('/admin/members');

  if (isLoading) return <div className="glass-card rounded-2xl p-10 text-center text-sm font-medium text-gray-700">Loading…</div>;
  if (isError) return <Alert>{getErrorMessage(error)}</Alert>;

  return (
    <div className="space-y-5">
      <Link to="/admin/members" className="inline-flex items-center gap-1.5 text-xs font-semibold text-ilc-purple hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All members
      </Link>
      <div className="glass-card flex flex-wrap items-center gap-4 rounded-2xl p-5 sm:p-6">
        <Avatar name={member.name} initials={member.initials} src={member.photo_url} size="lg" />
        <div className="min-w-0 flex-1">
          <h2 className="font-serif text-3xl font-semibold text-ilc-purple">{member.name}</h2>
          <p className="text-sm text-gray-700">
            {[member.title, member.organisation].filter(Boolean).join(', ') || 'No title'}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <StatusBadge status={member.profile_status} />
            <RoleBadge role={member.role} />
            <span className="text-xs text-gray-600">
              Member since {formatDate(member.created_at)}
              {member.invite_status === 'pending' && ' · Welcome email on hold'}
            </span>
          </div>
        </div>
      </div>

      <ReviewSection member={member} />
      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-2">
        <div className="space-y-5">
          <DetailsSection key={`${member.id}-${member.name}-${member.phone}-${member.title}-${member.industry_id}`} member={member} />
        </div>
        <div className="space-y-5">
          {member.role === 'CEO' && <SpocSection key={`${member.id}-${member.spoc_id}`} member={member} />}
          <MembershipSection key={`${member.id}-${member.membership_start}-${member.membership_end}`} member={member} />
          <AccessSection member={member} />
          <DangerZone member={member} onDeleted={back} />
        </div>
      </div>
    </div>
  );
}
