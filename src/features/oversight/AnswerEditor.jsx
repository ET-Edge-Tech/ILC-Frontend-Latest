import { useMemo, useState } from 'react';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import { getErrorMessage } from '../../lib/api-client.js';
import FieldInput from '../onboarding/FieldInput.jsx';
import { isApplicable, isEmpty } from '../onboarding/form-logic.js';
import { useEditAnswers } from './hooks.js';

// What a question holds, as comparable text ("" when empty, sorted list for checkboxes).
const norm = (v) =>
  Array.isArray(v) ? JSON.stringify([...v].sort()) : String(v ?? '').trim();

// Lets an Admin correct a member's answers. Only the questions that changed are sent.
// The portal keeps these corrections itself; the member's WordPress entry is never touched.
export default function AnswerEditor({ sheet, userId, onClose }) {
  const original = sheet.editor.values;
  const [draft, setDraft] = useState(() => ({ ...original }));
  const [errors, setErrors] = useState({});
  const save = useEditAnswers(userId);

  const visible = useMemo(
    () => sheet.editor.fields.filter((f) => isApplicable(f, draft)),
    [sheet.editor.fields, draft],
  );
  const changed = visible.filter((f) => norm(draft[f.id]) !== norm(original[f.id]));

  const submit = (e) => {
    e.preventDefault();
    const found = {};
    for (const f of changed)
      if (f.isRequired && isEmpty(draft[f.id]))
        found[f.id] = f.type === 'checkbox' ? 'Please choose at least one option' : 'This field is required';
    setErrors(found);
    if (Object.keys(found).length) return;

    const answers = {};
    for (const f of changed) answers[String(f.id)] = draft[f.id] ?? (f.type === 'checkbox' ? [] : '');
    save.mutate(answers, { onSuccess: onClose });
  };

  return (
    <form onSubmit={submit} noValidate>
      <div className="space-y-4 p-5">
        <Alert tone="warning">
          Changes are saved in the portal only. The member&apos;s WordPress entry stays exactly as
          they submitted it.
        </Alert>
        {save.isError && <Alert>{getErrorMessage(save.error)}</Alert>}
        {visible.map((f) => (
          <div key={f.id} className="rounded-xl border border-gray-100 bg-white p-3">
            <FieldInput
              field={f}
              value={draft[f.id]}
              error={errors[f.id]}
              onChange={(v) => {
                setDraft((d) => ({ ...d, [f.id]: v }));
                setErrors((x) => ({ ...x, [f.id]: undefined }));
              }}
            />
          </div>
        ))}
      </div>
      <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-gray-100 bg-ilc-page p-4">
        <span className="text-xs text-gray-600" aria-live="polite">
          {changed.length ? `${changed.length} changed` : 'No changes yet'}
        </span>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" className="sm:w-auto" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="sm:w-auto" loading={save.isPending} disabled={!changed.length}>
            Save changes
          </Button>
        </div>
      </div>
    </form>
  );
}
