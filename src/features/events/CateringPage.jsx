import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import { getErrorMessage } from '../../lib/api-client.js';
import { formatDateWithDay } from '../../lib/format.js';
import { useCatering, useCateringDownload } from './hooks.js';

// What the members who said Yes eat and must avoid. An Admin sees everyone attending; a relationship manager their own members.
export default function CateringPage() {
  const { id } = useParams();
  const { data, isLoading, isError, error } = useCatering(id);
  const download = useCateringDownload(id);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link to={`/events/${id}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-ilc-purple hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to the event
      </Link>
      {isError && <Alert>{getErrorMessage(error)}</Alert>}
      {isLoading && <div className="glass-card rounded-2xl p-10 text-center text-sm font-medium text-gray-700">Loading…</div>}
      {data && (
        <>
          <div className="glass-card flex flex-wrap items-start justify-between gap-3 rounded-2xl p-5">
            <div>
              <h2 className="text-lg font-bold text-ilc-ink">Catering list</h2>
              <p className="mt-0.5 text-sm text-gray-700">
                {data.event.title} · {formatDateWithDay(data.event.date)} · {data.total} attending
              </p>
            </div>
            <Button className="w-auto" loading={download.isPending} disabled={data.total === 0} onClick={() => download.mutate()}>
              <Download className="h-4 w-4" aria-hidden="true" /> Download
            </Button>
          </div>

          <section className="glass-card rounded-2xl p-5 sm:p-6" aria-label="Food preferences">
            <h3 className="mb-3 text-xs font-bold tracking-[0.25em] text-ilc-gold-deep uppercase">Food preferences</h3>
            {data.summary.length === 0 ? (
              <p className="text-sm text-gray-700">No one has said yes yet.</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {data.summary.map((s) => (
                  <li key={s.diet} className="rounded-full bg-ilc-purple/10 px-4 py-1.5 text-sm font-bold text-ilc-purple">
                    {s.diet}: {s.count}
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs text-gray-700">These come from the onboarding form. &quot;Not answered&quot; means the member left it blank or the answers have not been copied yet.</p>
          </section>

          <section className="glass-card rounded-2xl p-5 sm:p-6" aria-label="Attending members">
            <h3 className="mb-3 text-xs font-bold tracking-[0.25em] text-ilc-gold-deep uppercase">Who needs what</h3>
            <ul className="divide-y divide-gray-100">
              {data.members.map((m) => (
                <li key={m.id} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-2.5">
                  <span className="min-w-[10rem] text-sm font-bold text-ilc-ink">{m.name}</span>
                  <span className="text-sm text-gray-700">{m.diet ?? 'Not answered'}</span>
                  {m.restrictions && <span className="rounded-lg bg-red-50 px-2.5 py-1 text-sm font-semibold text-red-800">{m.restrictions}</span>}
                  {m.spoc && <span className="ml-auto text-xs text-gray-600">{m.spoc}</span>}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
