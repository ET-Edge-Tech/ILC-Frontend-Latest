import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import FileUploadField from '../../components/ui/FileUploadField.jsx';
import ImageUploadField from '../../components/ui/ImageUploadField.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Switch from '../../components/ui/Switch.jsx';
import TextField from '../../components/ui/TextField.jsx';
import { getErrorMessage } from '../../lib/api-client.js';
import { useDeleteIssue, useIssues, useSaveIssue } from './hooks.js';

const monthText = (ym) => new Date(`${ym}-01T00:00:00Z`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const thisMonth = () => new Date().toISOString().slice(0, 7);

function IssueForm({ issue, onClose }) {
  const save = useSaveIssue();
  const [form, setForm] = useState({
    title: issue?.title ?? '',
    issue_month: issue?.issue_month ?? thisMonth(),
    description: issue?.description ?? '',
    allow_download: issue?.allow_download ?? false,
    published: issue?.published ?? true,
  });
  const [pdf, setPdf] = useState(issue?.has_pdf ? { name: 'The PDF already saved (choose another to replace it)' } : null);
  const [coverId, setCoverId] = useState('');
  const [coverUrl, setCoverUrl] = useState(issue?.cover_url ?? '');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const newPdf = pdf?.fileId;
  const ok = form.title.trim() && /^\d{4}-\d{2}$/.test(form.issue_month) && (issue ? true : Boolean(newPdf));

  const submit = () =>
    save.mutate(
      {
        id: issue?.id,
        ...form,
        description: form.description.trim() || null,
        ...(newPdf ? { pdf_file_id: newPdf } : {}),
        ...(coverId ? { cover_file_id: coverId } : { cover_url: coverUrl || null }),
      },
      { onSuccess: onClose },
    );

  return (
    <Modal
      title={issue ? 'Edit issue' : 'Add an issue'}
      onClose={onClose}
      busy={save.isPending}
      footer={
        <>
          <Button variant="ghost" className="sm:w-auto" onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          <Button className="sm:w-auto" loading={save.isPending} disabled={!ok} onClick={submit}>
            {issue ? 'Save changes' : 'Add issue'}
          </Button>
        </>
      }
    >
      <TextField label="Title *" value={form.title} maxLength={200} onChange={set('title')} placeholder="e.g. The Leadership Issue" />
      <TextField label="Month *" type="month" value={form.issue_month} onChange={set('issue_month')} />
      <div>
        <label htmlFor="mag-desc" className="mb-1.5 block text-xs font-bold tracking-widest text-gray-700 uppercase">
          Description
        </label>
        <textarea id="mag-desc" rows={3} maxLength={1000} value={form.description} onChange={set('description')} className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm focus:border-ilc-purple focus:ring-2 focus:ring-ilc-purple/15 focus:outline-none" />
      </div>
      <FileUploadField
        label="Magazine PDF *"
        kind="document"
        accept=".pdf"
        value={pdf}
        onChange={(c) => setPdf(c.remove ? null : c)}
        hint="A PDF up to 25 MB. Export it with 'smallest size' if it is bigger."
      />
      <ImageUploadField
        label="Cover picture (optional)"
        value={coverUrl}
        aspect={3 / 4}
        maxSide={1200}
        hint="A tall picture, trimmed to 3:4."
        onChange={(c) => {
          if (c.remove) {
            setCoverId('');
            setCoverUrl('');
          } else {
            setCoverId(c.fileId);
            setCoverUrl('');
          }
        }}
      />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-ilc-ink">Allow members to download the PDF</p>
          <p className="text-xs text-gray-700">When off, members can only read it inside the portal.</p>
        </div>
        <Switch checked={form.allow_download} onChange={(v) => setForm((f) => ({ ...f, allow_download: v }))} label="Allow members to download the PDF" />
      </div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-ilc-ink">Show to members</p>
          <p className="text-xs text-gray-700">Turn off to keep this issue as a draft.</p>
        </div>
        <Switch checked={form.published} onChange={(v) => setForm((f) => ({ ...f, published: v }))} label="Show to members" />
      </div>
      {save.isError && <Alert>{getErrorMessage(save.error)}</Alert>}
    </Modal>
  );
}

// Admin: add, change and remove issues of the magazine.
export default function AdminMagazinePage() {
  const { data: issues = [], isLoading, isError, error } = useIssues();
  const remove = useDeleteIssue();
  const [editing, setEditing] = useState(null); // an issue, or {} for a new one
  const [toDelete, setToDelete] = useState(null);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="glass-card flex flex-wrap items-start justify-between gap-3 rounded-2xl p-5">
        <div>
          <h2 className="text-lg font-bold text-ilc-ink">Magazine</h2>
          <p className="mt-1 text-sm text-gray-700">
            Add each issue as a PDF with a cover, a title and a month. Members read it as a flip book.{' '}
            <Link to="/magazine" className="font-bold text-ilc-purple hover:underline">
              Open the shelf
            </Link>
          </p>
        </div>
        <Button className="w-auto" onClick={() => setEditing({})}>
          <Plus className="h-4 w-4" aria-hidden="true" /> Add an issue
        </Button>
      </div>
      {isError && <Alert>{getErrorMessage(error)}</Alert>}
      {isLoading && <div className="glass-card rounded-2xl p-10 text-center text-sm font-medium text-gray-700">Loading…</div>}
      <ul className="space-y-3">
        {issues.map((i) => (
          <li key={i.id} className="glass-card flex items-center gap-4 rounded-2xl p-4">
            <div className="h-20 w-14 shrink-0 overflow-hidden rounded bg-gray-100">{i.cover_url && <img src={i.cover_url} alt="" className="h-full w-full object-cover" />}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold text-ilc-ink">{i.title}</p>
              <p className="text-sm text-gray-700">
                {monthText(i.issue_month)} · {i.published ? 'Visible to members' : 'Draft'} · {i.allow_download ? 'Download allowed' : 'Read only'}
              </p>
            </div>
            <button type="button" aria-label={`Edit ${i.title}`} onClick={() => setEditing(i)} className="flex h-10 w-10 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100">
              <Pencil className="h-4 w-4" />
            </button>
            <button type="button" aria-label={`Delete ${i.title}`} onClick={() => setToDelete(i)} className="flex h-10 w-10 items-center justify-center rounded-full text-gray-600 hover:bg-red-50 hover:text-red-600">
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
      {editing && <IssueForm key={editing.id ?? 'new'} issue={editing.id ? editing : null} onClose={() => setEditing(null)} />}
      <ConfirmDialog open={Boolean(toDelete)} danger title="Delete this issue?" confirmLabel="Delete issue" loading={remove.isPending} onCancel={() => setToDelete(null)} onConfirm={() => remove.mutate(toDelete.id, { onSettled: () => setToDelete(null) })}>
        <strong>{toDelete?.title}</strong> and its PDF will be removed, and members lose their place in it. This cannot be undone.
      </ConfirmDialog>
    </div>
  );
}
