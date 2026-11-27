import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileSpreadsheet, Mail, Phone, Plus, Trash2, Users } from 'lucide-react';
import Alert from '../../components/ui/Alert.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import Button from '../../components/ui/Button.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import ImageUploadField from '../../components/ui/ImageUploadField.jsx';
import TextField from '../../components/ui/TextField.jsx';
import { getErrorMessage } from '../../lib/api-client.js';
import SelectField from '../../components/ui/SelectField.jsx';
import { useCreateSpoc, useDeleteSpoc, useHandover, useSpocs } from './hooks.js';

const EMPTY = { name: '', email: '', title: '', phone: '' };

export default function SpocsPage() {
  const { data: spocs = [], isLoading, isError, error } = useSpocs();
  const create = useCreateSpoc();
  const remove = useDeleteSpoc();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [toDelete, setToDelete] = useState(null);
  const handover = useHandover();
  const [handFrom, setHandFrom] = useState(null);
  const [handTo, setHandTo] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    const { photo, ...rest } = form;
    create.mutate(photo ? { ...rest, photo } : rest, {
      onSuccess: () => {
        setForm(EMPTY);
        setShowForm(false);
      },
    });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-gray-600">
          A SPOC is a relationship manager. Create them before a bulk upload so members can be linked by the SPOC's email. Each SPOC gets a login.
        </p>
        {!showForm && (
          <div className="flex flex-wrap gap-2">
            <Link
              to="/admin/spocs/bulk"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-gray-200 px-5 text-xs font-bold tracking-widest text-ilc-purple uppercase hover:bg-ilc-purple/5"
            >
              <FileSpreadsheet className="h-4 w-4" aria-hidden="true" /> Upload Excel
            </Link>
            <Button className="sm:w-auto" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" /> Add SPOC
            </Button>
          </div>
        )}
      </div>

      {showForm && (
        <form onSubmit={submit} className="glass-card space-y-4 rounded-2xl p-5 sm:p-8" noValidate>
          <h2 className="font-serif text-2xl font-semibold text-ilc-purple">New SPOC</h2>
          {create.isError && <Alert>{getErrorMessage(create.error)}</Alert>}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField label="Full name *" value={form.name} onChange={set('name')} required autoFocus />
            <TextField label="Email (their login) *" type="email" value={form.email} onChange={set('email')} required autoComplete="off" />
            <TextField label="Title" value={form.title} onChange={set('title')} />
            <TextField label="Phone" value={form.phone} onChange={set('phone')} />
            <div className="sm:col-span-2">
              <ImageUploadField
                label="Photo"
                mode="dataUrl"
                round
                value={form.photo}
                onChange={(c) => setForm((f) => ({ ...f, photo: c.remove ? '' : c.dataUrl }))}
              />
            </div>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" className="sm:w-auto" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button type="submit" className="sm:w-auto" loading={create.isPending} disabled={!form.name || !form.email}>
              Create SPOC
            </Button>
          </div>
        </form>
      )}

      {isError && <Alert>{getErrorMessage(error)}</Alert>}

      {isLoading ? (
        <div className="glass-card rounded-2xl p-10 text-center text-sm text-gray-600">Loading SPOCs…</div>
      ) : spocs.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center">
          <p className="font-serif text-xl font-bold text-ilc-purple">No SPOCs yet</p>
          <p className="mt-1 text-sm text-gray-600">Add your first relationship manager above.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {spocs.map((s) => (
            <li key={s.id} className="glass-card rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <Avatar name={s.name} src={s.photo_url} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ilc-ink">{s.name}</p>
                  <p className="truncate text-xs text-gray-600">{s.title || 'Relationship manager'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setToDelete(s)}
                  aria-label={`Delete ${s.name}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-gray-600 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <dl className="mt-4 space-y-1.5 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0 text-gray-600" aria-hidden="true" />
                  <span className="truncate">{s.email}</span>
                </div>
                {s.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 shrink-0 text-gray-600" aria-hidden="true" />
                    {s.phone}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 shrink-0 text-gray-600" aria-hidden="true" />
                  {s.member_count} member{s.member_count === 1 ? '' : 's'}
                </div>
              </dl>
              {s.member_count > 0 && spocs.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setHandTo('');
                    setHandFrom(s);
                  }}
                  className="mt-3 text-xs font-bold text-ilc-purple hover:underline"
                >
                  Hand over all members to someone else
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(handFrom)}
        title="Hand over all members?"
        confirmLabel="Hand over"
        loading={handover.isPending}
        onCancel={() => setHandFrom(null)}
        onConfirm={() => handTo && handover.mutate({ from: handFrom.id, to: handTo }, { onSettled: () => setHandFrom(null) })}
      >
        All {handFrom?.member_count ?? 0} member(s) of <strong>{handFrom?.name}</strong>, and their open reminders, move to the person you choose. The members and both relationship managers get a bell notice.
        <SelectField
          className="mt-3"
          label="Hand over to"
          value={handTo}
          onChange={(e) => setHandTo(e.target.value)}
          options={[{ value: '', label: 'Choose a relationship manager' }, ...spocs.filter((x) => x.id !== handFrom?.id).map((x) => ({ value: x.id, label: x.name }))]}
        />
      </ConfirmDialog>

      <ConfirmDialog
        open={Boolean(toDelete)}
        danger
        title="Delete this SPOC?"
        confirmLabel="Delete SPOC"
        loading={remove.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => remove.mutate(toDelete.id, { onSettled: () => setToDelete(null) })}
      >
        <strong>{toDelete?.name}</strong> will be deleted and can no longer sign in. Their {toDelete?.member_count ?? 0} member(s) will be left without a SPOC.
      </ConfirmDialog>
    </div>
  );
}
