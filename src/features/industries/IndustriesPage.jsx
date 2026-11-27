import { useState } from 'react';
import { ChevronDown, Plus, Trash2 } from 'lucide-react';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import TagsField from '../../components/ui/TagsField.jsx';
import TextField from '../../components/ui/TextField.jsx';
import { getErrorMessage } from '../../lib/api-client.js';
import { useCreateIndustry, useDeleteIndustry, useIndustries, useUpdateIndustry } from './hooks.js';

// One industry, opened for editing: its name, the ET Insights categories that count as it, and which industries affect it.
function Editor({ industry, all, onDone }) {
  const update = useUpdateIndustry();
  const remove = useDeleteIndustry();
  const [name, setName] = useState(industry.name);
  const [et, setEt] = useState(industry.et_categories);
  const [related, setRelated] = useState(industry.related_ids);
  const [confirm, setConfirm] = useState(false);
  const others = all.filter((i) => i.id !== industry.id);
  const toggle = (id) => setRelated((r) => (r.includes(id) ? r.filter((x) => x !== id) : [...r, id]));
  const changed = name.trim() !== industry.name || JSON.stringify(et) !== JSON.stringify(industry.et_categories) || [...related].sort().join() !== [...industry.related_ids].sort().join();

  return (
    <div className="space-y-4 border-t border-gray-100 p-4 sm:p-5">
      {update.isError && <Alert>{getErrorMessage(update.error)}</Alert>}
      <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
      <TagsField
        label="ET Insights categories"
        value={et}
        onChange={setEt}
        hint="Articles in these ET Insights categories count as this industry. Press Enter after each one."
      />
      <div>
        <p className="mb-1.5 text-xs font-bold tracking-widest text-gray-700 uppercase">Industries that affect this one</p>
        <p className="mb-2 text-sm text-gray-700">Used to show members and news from related industries after their own.</p>
        <div className="flex flex-wrap gap-2">
          {others.map((o) => {
            const on = related.includes(o.id);
            return (
              <button
                key={o.id}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(o.id)}
                className={`min-h-9 rounded-full border px-3 text-xs font-bold transition ${on ? 'border-ilc-purple bg-ilc-purple text-white' : 'border-gray-300 bg-white text-gray-700 hover:bg-ilc-purple/5'}`}
              >
                {o.name}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Button
            variant="ghost"
            className="text-red-700 hover:bg-red-50 sm:w-auto"
            disabled={industry.member_count > 0}
            onClick={() => setConfirm(true)}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" /> Delete
          </Button>
          {industry.member_count > 0 && <p className="mt-1 text-xs text-gray-700">{industry.member_count} member(s) use it, so it cannot be deleted.</p>}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" className="border border-gray-300 sm:w-auto" onClick={onDone}>
            Close
          </Button>
          <Button
            className="sm:w-auto"
            loading={update.isPending}
            disabled={!changed || !name.trim()}
            onClick={() => update.mutate({ id: industry.id, name: name.trim(), et_categories: et, related_ids: related })}
          >
            Save
          </Button>
        </div>
      </div>
      <ConfirmDialog
        open={confirm}
        danger
        title="Delete this industry?"
        confirmLabel="Delete"
        loading={remove.isPending}
        onCancel={() => setConfirm(false)}
        onConfirm={() => remove.mutate(industry.id, { onSettled: () => setConfirm(false) })}
      >
        <strong>{industry.name}</strong> will be removed from the list, and from the "affects" list of other industries.
      </ConfirmDialog>
    </div>
  );
}

// The list members pick their industry from. Admins can add, rename and relate industries.
export default function IndustriesPage() {
  const { data: industries = [], isLoading, isError, error } = useIndustries();
  const create = useCreateIndustry();
  const [name, setName] = useState('');
  const [openId, setOpenId] = useState(null);
  const nameOf = (id) => industries.find((i) => i.id === id)?.name;

  const add = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    create.mutate({ name: name.trim() }, { onSuccess: () => setName('') });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="glass-card rounded-2xl p-5">
        <h2 className="text-lg font-bold text-ilc-ink">Industries</h2>
        <p className="mt-1 text-sm text-gray-700">
          Members pick one of these in their profile. The Council shows members from the same industry first, and the news
          will use the ET Insights categories and the "affects" list.
        </p>
        <form onSubmit={add} className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end" noValidate>
          <TextField className="sm:w-80" label="Add an industry" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="e.g. Space Tech" />
          <Button type="submit" className="sm:w-auto" loading={create.isPending} disabled={!name.trim()}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Add
          </Button>
        </form>
      </div>

      {isError && <Alert>{getErrorMessage(error)}</Alert>}
      {isLoading && <div className="glass-card rounded-2xl p-10 text-center text-sm font-medium text-gray-700">Loading…</div>}

      <ul className="space-y-3">
        {industries.map((i) => {
          const open = openId === i.id;
          return (
            <li key={i.id} className="glass-card overflow-hidden rounded-2xl">
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpenId(open ? null : i.id)}
                className="flex w-full items-center gap-3 p-4 text-left hover:bg-ilc-purple/5"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-bold text-ilc-ink">{i.name}</span>
                  <span className="block truncate text-sm text-gray-700">
                    {i.related_ids.length ? `Affected by: ${i.related_ids.map(nameOf).filter(Boolean).join(', ')}` : 'No related industries'}
                  </span>
                </span>
                <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-gray-700">
                  {i.member_count ?? 0} member{(i.member_count ?? 0) === 1 ? '' : 's'}
                </span>
                <ChevronDown className={`h-5 w-5 shrink-0 text-gray-600 transition ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>
              {open && <Editor key={i.id} industry={i} all={industries} onDone={() => setOpenId(null)} />}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
