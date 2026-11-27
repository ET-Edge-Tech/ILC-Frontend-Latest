import { useMemo, useRef, useState } from 'react';
import { ImagePlus, Pencil, Plus, Trash2, X } from 'lucide-react';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import ImageUploadField from '../../components/ui/ImageUploadField.jsx';
import PickOrAddField from '../../components/ui/PickOrAddField.jsx';
import { FILE_RULES, shrinkImage, uploadFile } from '../../lib/uploads.js';
import TextField from '../../components/ui/TextField.jsx';
import { getErrorMessage } from '../../lib/api-client.js';
import { useGlimpseAdmin, useGlimpses } from './hooks.js';

const EMPTY = { photo_url: '', caption: '', event_name: '', category: 'General' };

const isHttps = (v) => {
  try {
    return new URL(v).protocol === 'https:';
  } catch {
    return false;
  }
};

// Several pictures at once: each one is shrunk and uploaded as soon as it is chosen, with its own progress.
function MultiPhotoPicker({ items, setItems }) {
  const input = useRef(null);

  const choose = (e) => {
    const files = [...(e.target.files ?? [])];
    e.target.value = '';
    for (const file of files) {
      const key = `${file.name}-${file.size}-${Math.random()}`;
      setItems((list) => [...list, { key, name: file.name, status: 'uploading', percent: 0 }]);
      const patch = (p) => setItems((list) => list.map((it) => (it.key === key ? { ...it, ...p } : it)));
      shrinkImage(file, 1600)
        .then((small) => {
          patch({ preview: URL.createObjectURL(small) });
          return uploadFile('image', small, (percent) => patch({ percent }));
        })
        .then((fileId) => patch({ status: 'ready', fileId }))
        .catch((err) => patch({ status: 'error', error: err.message }));
    }
  };

  return (
    <div>
      <p className="mb-1.5 text-xs font-bold tracking-widest text-gray-700 uppercase">Photos *</p>
      <button
        type="button"
        onClick={() => input.current?.click()}
        className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 text-xs font-bold tracking-widest text-ilc-purple uppercase hover:bg-ilc-purple/5"
      >
        <ImagePlus className="h-4 w-4" aria-hidden="true" /> Choose pictures
      </button>
      <p className="mt-1 text-xs text-gray-600">You can choose many at once. JPG, PNG, GIF or WebP.</p>
      <input ref={input} type="file" multiple accept={FILE_RULES.image.accept} onChange={choose} className="sr-only" tabIndex={-1} />
      {items.length > 0 && (
        <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {items.map((it) => (
            <li key={it.key} className="relative aspect-square overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
              {it.preview && <img src={it.preview} alt="" className="h-full w-full object-cover" />}
              <span
                className={`absolute inset-x-0 bottom-0 px-1 py-0.5 text-center text-xs font-bold text-white ${it.status === 'error' ? 'bg-red-600' : it.status === 'ready' ? 'bg-emerald-600' : 'bg-black/60'}`}
              >
                {it.status === 'uploading' ? `${it.percent}%` : it.status === 'ready' ? 'Ready' : 'Failed'}
              </span>
              <button
                type="button"
                onClick={() => setItems((list) => list.filter((x) => x.key !== it.key))}
                aria-label={`Remove ${it.name}`}
                className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              {it.error && <span className="sr-only">{it.error}</span>}
            </li>
          ))}
        </ul>
      )}
      {items.some((i) => i.status === 'error') && (
        <p role="alert" className="mt-2 text-xs text-red-600">
          {items.find((i) => i.status === 'error').error} Remove the failed ones and try again.
        </p>
      )}
    </div>
  );
}

function GlimpseForm({ initial, id, categories, onDone }) {
  const { save } = useGlimpseAdmin();
  const [form, setForm] = useState({ ...initial, photo_file_id: '' });
  const [items, setItems] = useState([]); // pictures chosen when adding
  const [pickerKey, setPickerKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const urlError =
    form.photo_url && !isHttps(form.photo_url) ? 'Must start with https://' : undefined;
  const uploading = items.some((i) => i.status === 'uploading');
  const ready = items.filter((i) => i.status === 'ready');
  const ok = id
    ? Boolean(form.photo_file_id || (form.photo_url && !urlError))
    : !uploading && (ready.length > 0 || (form.photo_url && !urlError));

  const submit = async (e) => {
    e.preventDefault();
    if (!ok) return;
    setSaveError('');
    const common = { caption: form.caption, event_name: form.event_name, category: form.category };
    try {
      if (id) {
        const { photo_file_id: fileId, ...rest } = form;
        await save.mutateAsync({ id, ...rest, ...(fileId ? { photo_file_id: fileId } : {}) });
      } else if (ready.length > 0) {
        setSaving(true);
        for (const it of ready) await save.mutateAsync({ ...common, photo_file_id: it.fileId });
      } else {
        await save.mutateAsync({ ...common, photo_url: form.photo_url });
      }
      onDone();
    } catch (err) {
      setSaveError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="glass-card space-y-4 rounded-2xl p-5 sm:p-7" noValidate>
      <h2 className="font-serif text-2xl font-semibold text-ilc-purple">{id ? 'Edit photo' : 'Add photos'}</h2>
      {saveError && <Alert>{saveError}</Alert>}
      {id ? (
        <ImageUploadField
          key={pickerKey}
          label="Photo"
          value={form.photo_url}
          onChange={(c) => {
            if (c.remove) setForm((f) => ({ ...f, photo_url: '', photo_file_id: '' }));
            else setForm((f) => ({ ...f, photo_url: '', photo_file_id: c.fileId }));
          }}
        />
      ) : (
        <MultiPhotoPicker items={items} setItems={setItems} />
      )}
      <details className="text-sm text-gray-600" open={Boolean(form.photo_url)}>
        <summary className="cursor-pointer text-xs font-semibold text-ilc-purple">Or use a photo link instead</summary>
        <div className="mt-2 grid grid-cols-1 items-start gap-4 sm:grid-cols-[1fr_9rem]">
          <TextField
            label="Photo link"
            value={form.photo_url}
            onChange={(e) => {
              setForm((f) => ({ ...f, photo_url: e.target.value, photo_file_id: '' }));
              setPickerKey((k) => k + 1);
            }}
            error={urlError}
            inputMode="url"
            placeholder="https://…/photo.jpg"
          />
          {form.photo_url && !urlError && (
            <img
              src={form.photo_url}
              alt="Preview"
              className="aspect-square w-full rounded-lg border border-gray-100 object-cover"
            />
          )}
        </div>
      </details>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField label="Event name" value={form.event_name} onChange={set('event_name')} />
        <TextField label="Caption" value={form.caption} onChange={set('caption')} />
        <PickOrAddField
          className="sm:col-span-2"
          label="Category"
          value={form.category}
          onChange={(v) => setForm((f) => ({ ...f, category: v }))}
          options={categories}
          placeholder="e.g. Annual Summit"
        />
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" className="sm:w-auto" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" className="sm:w-auto" loading={save.isPending || saving} disabled={!ok}>
          {id ? 'Save changes' : ready.length > 1 ? `Add ${ready.length} photos` : 'Add photo'}
        </Button>
      </div>
    </form>
  );
}

export default function AdminGlimpsesPage() {
  const { data: glimpses = [], isLoading, isError, error } = useGlimpses();
  const { remove } = useGlimpseAdmin();
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  // Existing categories (General always first), so the same name is never typed two ways.
  const categories = useMemo(
    () => ['General', ...new Set(glimpses.map((g) => g.category).filter((c) => c && c !== 'General'))],
    [glimpses],
  );

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-600">
          {isLoading ? 'Loading…' : `${glimpses.length} photo${glimpses.length === 1 ? '' : 's'}`}
        </p>
        {!editing && (
          <Button className="sm:w-auto" onClick={() => setEditing('new')}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Add photo
          </Button>
        )}
      </div>

      {editing && (
        <GlimpseForm
          key={editing === 'new' ? 'new' : editing.id}
          id={editing === 'new' ? undefined : editing.id}
          categories={categories}
          initial={
            editing === 'new'
              ? EMPTY
              : {
                  photo_url: editing.photo_url,
                  caption: editing.caption ?? '',
                  event_name: editing.event_name ?? '',
                  category: editing.category ?? 'General',
                }
          }
          onDone={() => setEditing(null)}
        />
      )}

      {isError && <Alert>{getErrorMessage(error)}</Alert>}

      {!isLoading && glimpses.length === 0 && !editing && (
        <div className="glass-card rounded-2xl p-10 text-center">
          <p className="font-serif text-xl font-bold text-ilc-purple">No photos yet</p>
          <p className="mt-1 text-sm text-gray-600">
            Add photos from past events for members to browse.
          </p>
        </div>
      )}

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {glimpses.map((g) => (
          <li key={g.id} className="glass-card overflow-hidden rounded-xl">
            <img
              src={g.photo_url}
              alt={g.caption || g.event_name || 'Event photo'}
              loading="lazy"
              className="aspect-square w-full object-cover"
            />
            <div className="flex items-center gap-1 p-2">
              <p className="min-w-0 flex-1 truncate text-xs text-gray-600">
                {g.event_name || g.caption || 'Untitled'}
              </p>
              <button
                type="button"
                onClick={() => setEditing(g)}
                aria-label="Edit photo"
                className="flex h-9 w-9 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setToDelete(g)}
                aria-label="Delete photo"
                className="flex h-9 w-9 items-center justify-center rounded-full text-gray-600 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={Boolean(toDelete)}
        danger
        title="Delete this photo?"
        confirmLabel="Delete photo"
        loading={remove.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => remove.mutate(toDelete.id, { onSettled: () => setToDelete(null) })}
      >
        The photo will be removed for all members, along with anyone&apos;s bookmark of it.
      </ConfirmDialog>
    </div>
  );
}
