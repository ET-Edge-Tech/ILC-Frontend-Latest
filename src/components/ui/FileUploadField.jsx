import { useRef, useState } from 'react';
import { FileUp, FileText, Film, Loader2, Trash2 } from 'lucide-react';
import { FILE_RULES, sizeText, uploadFile } from '../../lib/uploads.js';

// A document or video picker with the file name, size, a progress note and Remove.
//  value: { id, name, size } for a file already saved, or null.
//  Reports { fileId, name, size } after a successful upload, or { remove: true }. Nothing is saved until the form's
//  own Save button is pressed.
export default function FileUploadField({ label, kind = 'document', value, onChange, hint, disabled = false, accept }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [percent, setPercent] = useState(0);
  const [error, setError] = useState('');
  const rule = FILE_RULES[kind];
  const Icon = kind === 'video' ? Film : FileText;

  const choose = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setBusy(true);
    setPercent(0);
    try {
      const fileId = await uploadFile(kind, file, setPercent);
      onChange({ fileId, name: file.name, size: file.size });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      {label && <p className="mb-1.5 text-xs font-bold tracking-widest text-gray-700 uppercase">{label}</p>}
      <div className="rounded-xl border border-gray-200 bg-white p-3">
        {value ? (
          <div className="flex items-center gap-3">
            <Icon className="h-5 w-5 shrink-0 text-ilc-purple" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ilc-ink">{value.name}</p>
              {value.size ? <p className="text-xs text-gray-600">{sizeText(value.size)}</p> : null}
            </div>
            <button
              type="button"
              onClick={() => onChange({ remove: true })}
              disabled={busy || disabled}
              aria-label={`Remove ${value.name}`}
              className="flex h-9 w-9 items-center justify-center rounded-full text-gray-600 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-600">No file chosen.</p>
        )}
        {busy && (
          <div className="mt-3" role="status" aria-live="polite">
            <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
              <div className="h-full rounded-full bg-ilc-gold transition-all" style={{ width: `${percent}%` }} />
            </div>
            <p className="mt-1 text-xs text-gray-600">Uploading… {percent}%</p>
          </div>
        )}
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={busy || disabled}
          className="mt-3 inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 text-xs font-bold tracking-widest text-ilc-purple uppercase hover:bg-ilc-purple/5 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <FileUp className="h-4 w-4" aria-hidden="true" />}
          {value ? `Replace ${rule.label}` : `Choose ${rule.label}`}
        </button>
        <p className="mt-2 text-xs text-gray-600">
          {hint ?? `Up to ${sizeText(rule.max)}.`}
        </p>
        {error && (
          <p role="alert" className="mt-1 text-xs text-red-600">
            {error}
          </p>
        )}
        <input ref={input} type="file" accept={accept ?? rule.accept} onChange={choose} className="sr-only" tabIndex={-1} />
      </div>
    </div>
  );
}
