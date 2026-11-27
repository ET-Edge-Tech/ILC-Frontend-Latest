import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import SelectField from '../../components/ui/SelectField.jsx';
import TextField from '../../components/ui/TextField.jsx';
import { getErrorMessage } from '../../lib/api-client.js';
import { formatDate } from '../../lib/format.js';
import { ANNOUNCEMENT_TYPES, TYPE_STYLE } from './announcement-types.js';
import TagsField from '../../components/ui/TagsField.jsx';
import { useInterestTags } from '../ops/hooks.js';
import { useAnnouncementAdmin, useAnnouncements } from './hooks.js';

const EMPTY = { title: '', type: 'General', content: '', tags: [] };

function AnnouncementForm({ initial, id, onDone }) {
  const { save } = useAnnouncementAdmin();
  const [form, setForm] = useState(initial);
  const { data: tagSuggestions = [] } = useInterestTags();
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const ok = form.title.trim() && form.content.trim();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (ok) save.mutate({ id, ...form }, { onSuccess: onDone });
      }}
      className="glass-card space-y-4 rounded-2xl p-5 sm:p-7"
      noValidate
    >
      <h2 className="font-serif text-2xl font-semibold text-ilc-purple">
        {id ? 'Edit announcement' : 'New announcement'}
      </h2>
      {save.isError && <Alert>{getErrorMessage(save.error)}</Alert>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_12rem]">
        <TextField label="Title *" value={form.title} onChange={set('title')} required autoFocus />
        <SelectField
          label="Type"
          value={form.type}
          onChange={set('type')}
          options={ANNOUNCEMENT_TYPES.map((t) => ({ value: t, label: t }))}
        />
      </div>
      <TagsField value={form.tags} onChange={(tags) => setForm((f) => ({ ...f, tags }))} suggestions={tagSuggestions} hint="Optional. Relationship managers are told which of their members like this, so they can get in touch." />
      <div>
        <label
          htmlFor="announcement-content"
          className="mb-1.5 block text-xs font-bold tracking-widest text-gray-700 uppercase"
        >
          Announcement *
        </label>
        <textarea
          id="announcement-content"
          rows={5}
          value={form.content}
          onChange={set('content')}
          maxLength={5000}
          className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm focus:border-ilc-purple focus:ring-2 focus:ring-ilc-purple/15 focus:outline-none"
        />
        <p className="mt-1 text-right text-xs text-gray-600">
          {form.content.length}/5000. Shown as plain text.
        </p>
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" className="sm:w-auto" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" className="sm:w-auto" loading={save.isPending} disabled={!ok}>
          {id ? 'Save changes' : 'Post announcement'}
        </Button>
      </div>
    </form>
  );
}

export default function AdminAnnouncementsPage() {
  const { data: items = [], isLoading, isError, error } = useAnnouncements();
  const { remove } = useAnnouncementAdmin();
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-600">
          {isLoading
            ? 'Loading…'
            : `${items.length} active announcement${items.length === 1 ? '' : 's'}`}
        </p>
        {!editing && (
          <Button className="sm:w-auto" onClick={() => setEditing('new')}>
            <Plus className="h-4 w-4" aria-hidden="true" /> New announcement
          </Button>
        )}
      </div>

      {editing && (
        <AnnouncementForm
          key={editing === 'new' ? 'new' : editing.id}
          id={editing === 'new' ? undefined : editing.id}
          initial={
            editing === 'new'
              ? EMPTY
              : { title: editing.title, type: editing.type, content: editing.content, tags: editing.tags ?? [] }
          }
          onDone={() => setEditing(null)}
        />
      )}

      {isError && <Alert>{getErrorMessage(error)}</Alert>}

      {!isLoading && items.length === 0 && !editing && (
        <div className="glass-card rounded-2xl p-10 text-center">
          <p className="font-serif text-xl font-bold text-ilc-purple">No announcements</p>
          <p className="mt-1 text-sm text-gray-600">Post news for all members to read.</p>
        </div>
      )}

      <ul className="space-y-3">
        {items.map((a) => (
          <li key={a.id} className="glass-card flex items-start gap-3 rounded-2xl p-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wider uppercase ${TYPE_STYLE[a.type] ?? TYPE_STYLE.General}`}
                >
                  {a.type}
                </span>
                <span className="text-xs text-gray-600">{formatDate(a.created_at)}</span>
              </div>
              <p className="mt-1 font-semibold text-ilc-ink">{a.title}</p>
              <p className="line-clamp-2 text-sm text-gray-600">{a.content}</p>
            </div>
            <button
              type="button"
              onClick={() => setEditing(a)}
              aria-label={`Edit ${a.title}`}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setToDelete(a)}
              aria-label={`Delete ${a.title}`}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-600 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={Boolean(toDelete)}
        danger
        title="Delete this announcement?"
        confirmLabel="Delete announcement"
        loading={remove.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => remove.mutate(toDelete.id, { onSettled: () => setToDelete(null) })}
      >
        <strong>{toDelete?.title}</strong> will disappear from members&apos; feeds. The post is
        hidden, not erased.
      </ConfirmDialog>
    </div>
  );
}
