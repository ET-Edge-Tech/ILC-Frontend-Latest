import { useState } from 'react';
import { ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import FileUploadField from '../../components/ui/FileUploadField.jsx';
import ImageUploadField from '../../components/ui/ImageUploadField.jsx';
import TagsField from '../../components/ui/TagsField.jsx';
import TextField from '../../components/ui/TextField.jsx';
import { getErrorMessage } from '../../lib/api-client.js';
import { formatDate } from '../../lib/format.js';
import { useInterestTags } from '../ops/hooks.js';
import { useResourceAdmin, useResources } from './hooks.js';

const CATEGORY_SUGGESTIONS = ['Article', 'Report', 'Video', 'Podcast', 'Case Study', 'Guide'];
const EMPTY = {
  title: '',
  category: 'Article',
  description: '',
  link: '',
  file_url: '',
  image_url: '',
  document: null,
  video: null,
  view_only: false,
  tags: [],
};

const isHttps = (v) => {
  try {
    return new URL(v).protocol === 'https:';
  } catch {
    return false;
  }
};

function ResourceForm({ initial, id, onDone }) {
  const { save } = useResourceAdmin();
  const [form, setForm] = useState({ ...initial, image_file_id: '' });
  const [pickerKey, setPickerKey] = useState(0);
  const { data: tagSuggestions = [] } = useInterestTags();
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const err = (k) => (form[k] && !isHttps(form[k]) ? 'Must start with https://' : undefined);
  const hasLink = Boolean(form.link || form.file_url || form.document || form.video);
  const invalid = Boolean(err('link') || err('file_url') || err('image_url'));

  const submit = (e) => {
    e.preventDefault();
    if (invalid || !hasLink) return;
    const { document, video, image_file_id: imageFileId, ...rest } = form;
    save.mutate(
      {
        id,
        ...rest,
        ...(imageFileId ? { image_file_id: imageFileId } : {}),
        // Sending the id again keeps a file; leaving it out removes it.
        ...(document ? { document_file_id: document.id } : {}),
        ...(video ? { video_file_id: video.id } : {}),
      },
      { onSuccess: onDone },
    );
  };

  return (
    <form onSubmit={submit} className="glass-card space-y-4 rounded-2xl p-5 sm:p-7" noValidate>
      <h2 className="font-serif text-2xl font-semibold text-ilc-purple">
        {id ? 'Edit resource' : 'New resource'}
      </h2>
      {save.isError && <Alert>{getErrorMessage(save.error)}</Alert>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          className="sm:col-span-2"
          label="Title *"
          value={form.title}
          onChange={set('title')}
          required
          autoFocus
        />
        <div>
          <TextField
            label="Category"
            value={form.category}
            onChange={set('category')}
            list="resource-categories"
          />
          <datalist id="resource-categories">
            {CATEGORY_SUGGESTIONS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div className="sm:col-span-2">
          <ImageUploadField
            key={pickerKey}
            label="Cover picture (optional)"
            value={form.image_url}
            onChange={(c) => {
              if (c.remove) setForm((f) => ({ ...f, image_url: '', image_file_id: '' }));
              else setForm((f) => ({ ...f, image_url: '', image_file_id: c.fileId }));
            }}
          />
          <details className="mt-2 text-sm text-gray-600">
            <summary className="cursor-pointer text-xs font-semibold text-ilc-purple">Or use a picture link instead</summary>
            <TextField
              className="mt-2"
              label="Image link"
              value={form.image_url}
              onChange={(e) => {
                setForm((f) => ({ ...f, image_url: e.target.value, image_file_id: '' }));
                setPickerKey((k) => k + 1);
              }}
              error={err('image_url')}
              inputMode="url"
              placeholder="https://…/cover.jpg"
            />
          </details>
        </div>
        <div className="sm:col-span-2">
          <FileUploadField
            label="Document (optional)"
            kind="document"
            value={form.document}
            hint="PDF, Word, Excel, PowerPoint, TXT or CSV, up to 25 MB. Members open it inside the portal through a link that expires in 5 minutes."
            onChange={(c) =>
              setForm((f) =>
                c.remove
                  ? { ...f, document: null, view_only: false }
                  : { ...f, document: { id: c.fileId, name: c.name, size: c.size } },
              )
            }
          />
          {form.document && (
            <label className="mt-2 flex cursor-pointer items-start gap-2.5 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={form.view_only}
                onChange={(e) => setForm((f) => ({ ...f, view_only: e.target.checked }))}
                className="mt-0.5 h-4 w-4 accent-ilc-purple"
              />
              <span>
                <b>View only</b>: hide the Download button. Members can still read it in the page. (This discourages
                copying; it cannot stop someone who is determined to save what they can see.)
              </span>
            </label>
          )}
        </div>
        <div className="sm:col-span-2">
          <FileUploadField
            label="Video (optional)"
            kind="video"
            value={form.video}
            hint="MP4 or WebM, up to 500 MB. It plays on the Knowledge page for members only."
            onChange={(c) =>
              setForm((f) => (c.remove ? { ...f, video: null } : { ...f, video: { id: c.fileId, name: c.name, size: c.size } }))
            }
          />
        </div>
        <TextField
          className="sm:col-span-2"
          label="Link"
          value={form.link}
          onChange={set('link')}
          error={err('link')}
          inputMode="url"
          placeholder="https://…"
          hint="A page, or a YouTube or Vimeo video (it will play on the Knowledge page)."
        />
        <TextField
          className="sm:col-span-2"
          label="File link"
          value={form.file_url}
          onChange={set('file_url')}
          error={err('file_url')}
          inputMode="url"
          placeholder="https://…/report.pdf"
          hint="Optional. A link to a document kept somewhere else."
        />
        <div className="sm:col-span-2">
          <TagsField value={form.tags} onChange={(tags) => setForm((f) => ({ ...f, tags }))} suggestions={tagSuggestions} hint="Optional. Relationship managers are told which of their members like this, so they can get in touch." />
        </div>
      </div>
      <div>
        <label
          htmlFor="resource-description"
          className="mb-1.5 block text-xs font-bold tracking-widest text-gray-700 uppercase"
        >
          Description
        </label>
        <textarea
          id="resource-description"
          rows={3}
          value={form.description}
          onChange={set('description')}
          className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm focus:border-ilc-purple focus:ring-2 focus:ring-ilc-purple/15 focus:outline-none"
        />
      </div>
      {!hasLink && form.title && (
        <p className="text-xs text-amber-700">
          Add a link, upload a document or video, or add a file link so members have something to open.
        </p>
      )}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" className="sm:w-auto" onClick={onDone}>
          Cancel
        </Button>
        <Button
          type="submit"
          className="sm:w-auto"
          loading={save.isPending}
          disabled={!form.title.trim() || !hasLink || invalid}
        >
          {id ? 'Save changes' : 'Add resource'}
        </Button>
      </div>
    </form>
  );
}

export default function AdminResourcesPage() {
  const { data: resources = [], isLoading, isError, error } = useResources();
  const { remove } = useResourceAdmin();
  const [editing, setEditing] = useState(null); // null | 'new' | a resource
  const [toDelete, setToDelete] = useState(null);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-600">
          {isLoading
            ? 'Loading…'
            : `${resources.length} resource${resources.length === 1 ? '' : 's'}`}
        </p>
        {!editing && (
          <Button className="sm:w-auto" onClick={() => setEditing('new')}>
            <Plus className="h-4 w-4" aria-hidden="true" /> New resource
          </Button>
        )}
      </div>

      {editing && (
        <ResourceForm
          key={editing === 'new' ? 'new' : editing.id}
          id={editing === 'new' ? undefined : editing.id}
          initial={
            editing === 'new'
              ? EMPTY
              : {
                  title: editing.title,
                  category: editing.category,
                  description: editing.description ?? '',
                  link: editing.link ?? '',
                  file_url: editing.file_url ?? '',
                  image_url: editing.image_url ?? '',
                  document: editing.document,
                  video: editing.video,
                  view_only: editing.view_only,
                  tags: editing.tags ?? [],
                }
          }
          onDone={() => setEditing(null)}
        />
      )}

      {isError && <Alert>{getErrorMessage(error)}</Alert>}

      {!isLoading && resources.length === 0 && !editing && (
        <div className="glass-card rounded-2xl p-10 text-center">
          <p className="font-serif text-xl font-bold text-ilc-purple">No resources yet</p>
          <p className="mt-1 text-sm text-gray-600">Add the first one for members to read.</p>
        </div>
      )}

      <ul className="space-y-3">
        {resources.map((r) => (
          <li key={r.id} className="glass-card flex items-center gap-4 rounded-2xl p-3 sm:p-4">
            {r.image_url ? (
              <img
                src={r.image_url}
                alt=""
                className="h-14 w-20 shrink-0 rounded-lg object-cover"
              />
            ) : (
              <div
                aria-hidden="true"
                className="h-14 w-20 shrink-0 rounded-lg bg-gradient-to-br from-ilc-sidebar to-ilc-purple"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-ilc-ink">{r.title}</p>
              <p className="truncate text-xs text-gray-600">
                {r.category}
                {r.embed_url && ' · Plays as video'}
                {r.video && ' · Uploaded video'}
                {r.document && ` · Document${r.view_only ? ' (view only)' : ''}`} · {formatDate(r.created_at)}
              </p>
            </div>
            {(r.link || r.file_url) && !r.document && (
              <a
                href={r.link || r.file_url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open ${r.title}`}
                className="flex h-10 w-10 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
            <button
              type="button"
              onClick={() => setEditing(r)}
              aria-label={`Edit ${r.title}`}
              className="flex h-10 w-10 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setToDelete(r)}
              aria-label={`Delete ${r.title}`}
              className="flex h-10 w-10 items-center justify-center rounded-full text-gray-600 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={Boolean(toDelete)}
        danger
        title="Delete this resource?"
        confirmLabel="Delete resource"
        loading={remove.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => remove.mutate(toDelete.id, { onSettled: () => setToDelete(null) })}
      >
        <strong>{toDelete?.title}</strong> will be removed for all members.
      </ConfirmDialog>
    </div>
  );
}
