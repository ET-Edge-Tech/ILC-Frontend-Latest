import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Download, FileSpreadsheet, XCircle } from 'lucide-react';
import { readSheet } from 'read-excel-file/browser';
import writeExcelFile from 'write-excel-file/browser';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import { getErrorMessage } from '../../lib/api-client.js';
import { MAX_ROWS, TEMPLATE_EXAMPLE, TEMPLATE_HEAD, parseSheet } from './bulk-upload.js';
import { useBulkCreate, useSettings } from './hooks.js';

async function downloadTemplate() {
  const head = TEMPLATE_HEAD.map((value) => ({ value, fontWeight: 'bold' }));
  const example = TEMPLATE_EXAMPLE.map((value) => ({ value, type: String }));
  await writeExcelFile([head, example], { columns: TEMPLATE_HEAD.map(() => ({ width: 24 })) }).toFile('ilc-members-template.xlsx');
}

export default function BulkUploadPage() {
  const fileRef = useRef(null);
  const bulk = useBulkCreate();
  const { data: settings } = useSettings();
  const [fileName, setFileName] = useState('');
  const [parsed, setParsed] = useState(null); // { rows, error }
  const [readError, setReadError] = useState('');
  const [result, setResult] = useState(null);

  const valid = parsed?.rows.filter((r) => r.problems.length === 0) ?? [];
  const invalid = parsed?.rows.filter((r) => r.problems.length > 0) ?? [];
  const tooMany = valid.length > MAX_ROWS;

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    setResult(null);
    setReadError('');
    setParsed(null);
    if (!file) return;
    setFileName(file.name);
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      setReadError('Please choose an Excel file ending in .xlsx.');
      return;
    }
    try {
      setParsed(parseSheet(await readSheet(file)));
    } catch {
      setReadError('We could not read that file. Make sure it is a normal .xlsx file.');
    }
  };

  const reset = () => {
    setParsed(null);
    setFileName('');
    setResult(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const upload = () => {
    const users = valid.map(({ name, email, title, role, phone, spoc_email }) => ({ name, email, title, role, phone, spoc_email }));
    bulk.mutate(users, { onSuccess: (data) => setResult(data) });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link to="/admin/members" className="inline-flex items-center gap-1.5 text-xs font-semibold text-ilc-purple hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to members
      </Link>

      <section className="glass-card rounded-2xl p-5 sm:p-8">
        <h2 className="font-serif text-2xl font-semibold text-ilc-purple">Bulk upload</h2>
        <p className="mt-1 text-sm text-gray-600">Add many members at once from an Excel file. Create the SPOCs first so their email can link automatically.</p>

        <ol className="mt-5 space-y-2 text-sm text-gray-600">
          <li>
            <strong>1.</strong> Download the template and fill one member per row (up to {MAX_ROWS}).
          </li>
          <li>
            <strong>2.</strong> Choose the file. You will see a preview and any problems before anything is saved.
          </li>
          <li>
            <strong>3.</strong> Upload the valid rows. Members who already exist are skipped.
          </li>
        </ol>

        {settings && (
          <Alert tone="warning" className="mt-5">
            {settings.bulk_upload_hold_emails ? (
              <>
                Welcome emails are <strong>on hold</strong> for bulk uploads. Send them later from <Link to="/admin/pending-invites" className="font-semibold underline">Pending Invites</Link>.
              </>
            ) : (
              <>Welcome emails will be sent <strong>immediately</strong> to every new member.</>
            )}
          </Alert>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button variant="ghost" className="w-auto border border-gray-200" onClick={downloadTemplate}>
            <Download className="h-4 w-4" aria-hidden="true" /> Download template
          </Button>
          <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-ilc-purple px-5 text-xs font-bold tracking-widest whitespace-nowrap text-white uppercase hover:bg-ilc-ink focus-within:outline-2 focus-within:outline-ilc-gold">
            <FileSpreadsheet className="h-4 w-4" aria-hidden="true" /> Choose Excel file
            <input ref={fileRef} type="file" accept=".xlsx" onChange={onFile} className="sr-only" />
          </label>
        </div>
        {fileName && <p className="mt-3 text-xs text-gray-600">Selected: {fileName}</p>}
      </section>

      {readError && <Alert>{readError}</Alert>}
      {parsed?.error && <Alert>{parsed.error}</Alert>}
      {bulk.isError && <Alert>{getErrorMessage(bulk.error)}</Alert>}

      {result && (
        <section className="glass-card rounded-2xl p-5 sm:p-8" aria-live="polite">
          <div className="flex items-center gap-2 text-emerald-700">
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
            <h3 className="font-serif text-xl font-bold">Upload finished</h3>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            <strong>{result.created}</strong> members created. <strong>{result.skipped.length}</strong> skipped because they already exist.
            {result.emailsHeld && ' Welcome emails are on hold.'}
          </p>
          {result.skipped.length > 0 && (
            <details className="mt-3 text-sm text-gray-600">
              <summary className="cursor-pointer font-semibold text-ilc-purple">Show skipped emails</summary>
              <ul className="mt-2 list-inside list-disc space-y-0.5 text-xs">
                {result.skipped.map((email) => (
                  <li key={email}>{email}</li>
                ))}
              </ul>
            </details>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            <Link to="/admin/members" className="inline-flex min-h-11 items-center rounded-lg bg-ilc-purple px-5 text-xs font-bold tracking-widest text-white uppercase hover:bg-ilc-ink">
              View members
            </Link>
            <Button variant="ghost" className="w-auto" onClick={reset}>
              Upload another file
            </Button>
          </div>
        </section>
      )}

      {parsed && !parsed.error && !result && (
        <section className="glass-card rounded-2xl p-5 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-serif text-xl font-bold text-ilc-purple">Preview</h3>
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-emerald-700">{valid.length} ready</span>
                {invalid.length > 0 && <span className="font-semibold text-red-600"> · {invalid.length} with problems (will not be uploaded)</span>}
              </p>
            </div>
            <Button className="sm:w-auto" disabled={valid.length === 0 || tooMany} loading={bulk.isPending} onClick={upload}>
              Upload {valid.length} member{valid.length === 1 ? '' : 's'}
            </Button>
          </div>
          {tooMany && <Alert className="mt-4">You can upload at most {MAX_ROWS} rows at a time. Split the file in two.</Alert>}
          {bulk.isPending && <p className="mt-3 text-xs text-gray-600">Creating accounts… this can take up to a minute for large files.</p>}

          <div className="mt-4 overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-white/70 text-xs font-bold tracking-widest text-gray-700 uppercase">
                <tr>
                  <th className="px-3 py-2.5">Row</th>
                  <th className="px-3 py-2.5">Name</th>
                  <th className="px-3 py-2.5">Email</th>
                  <th className="px-3 py-2.5">Title</th>
                  <th className="px-3 py-2.5">Role</th>
                  <th className="px-3 py-2.5">Check</th>
                </tr>
              </thead>
              <tbody>
                {parsed.rows.map((r) => (
                  <tr key={r.line} className={`border-t border-gray-50 ${r.problems.length ? 'bg-red-50/50' : ''}`}>
                    <td className="px-3 py-2 text-gray-600">{r.line}</td>
                    <td className="px-3 py-2 font-medium">{r.name || '—'}</td>
                    <td className="px-3 py-2">{r.email || '—'}</td>
                    <td className="px-3 py-2">{r.title || '—'}</td>
                    <td className="px-3 py-2">{r.role}</td>
                    <td className="px-3 py-2">
                      {r.problems.length === 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                          <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> OK
                        </span>
                      ) : (
                        <span className="inline-flex items-start gap-1 text-xs font-semibold text-red-600">
                          <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> {r.problems.join(', ')}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
