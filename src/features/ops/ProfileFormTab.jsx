import Alert from '../../components/ui/Alert.jsx';
import { getErrorMessage } from '../../lib/api-client.js';
import { useMemberForm } from './hooks.js';

// Everything the member wrote in the onboarding form, question by question. Read-only: birthday, food and city
// on the other tabs come from these same answers.
export default function ProfileFormTab({ id }) {
  const { data, isLoading, isError, error } = useMemberForm(id);

  if (isLoading) return <div className="glass-card rounded-2xl p-8 text-center text-sm font-medium text-gray-700">Reading the form answers…</div>;
  if (isError) return <Alert>{getErrorMessage(error)}</Alert>;

  return (
    <div className="space-y-4">
      <div className="glass-card rounded-2xl p-5">
        <p className="text-sm text-gray-700">
          The member&apos;s own answers from the onboarding form ({data.summary.filled} of {data.summary.total} answered). Only an Admin can correct them.
        </p>
      </div>
      {data.state === 'not_started' && <Alert tone="warning">This member has not filled in the form yet.</Alert>}
      {data.state !== 'not_started' && (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {data.answers.map((a) =>
            a.type === 'section' ? (
              <h3 key={`s${a.id}`} className="pt-3 font-serif text-xl font-bold text-ilc-purple lg:col-span-2">
                {a.label}
              </h3>
            ) : (
              <div key={a.id} className="rounded-xl border border-gray-100 bg-white p-4">
                <p className="text-xs font-bold tracking-widest text-gray-700 uppercase">{a.label}</p>
                {a.isFilled ? (
                  <p className="mt-1 text-sm break-words whitespace-pre-wrap text-ilc-ink">{a.value}</p>
                ) : (
                  <p className="mt-1 text-sm text-gray-500 italic">Not answered</p>
                )}
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
