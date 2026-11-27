import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import Alert from '../../components/ui/Alert.jsx';
import { getErrorMessage } from '../../lib/api-client.js';
import { useIssues } from './hooks.js';

const monthText = (ym) => new Date(`${ym}-01T00:00:00Z`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });

// The shelf: every issue of the magazine, newest first. Open one to read it as a flip book.
export default function MagazinePage() {
  const { data: issues = [], isLoading, isError, error } = useIssues();
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="glass-card rounded-2xl p-5">
        <h2 className="text-lg font-bold text-ilc-ink">Magazine</h2>
        <p className="mt-1 text-sm text-gray-700">Read each issue here, page by page. The portal remembers where you stopped.</p>
      </div>
      {isError && <Alert>{getErrorMessage(error)}</Alert>}
      {isLoading && <div className="glass-card rounded-2xl p-10 text-center text-sm font-medium text-gray-700">Loading…</div>}
      {!isLoading && issues.length === 0 && (
        <div className="glass-card rounded-2xl p-10 text-center">
          <p className="font-serif text-xl font-bold text-ilc-purple">No issues yet</p>
          <p className="mt-1 text-sm text-gray-700">New issues will appear here.</p>
        </div>
      )}
      <ul className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
        {issues.map((i) => (
          <li key={i.id}>
            <Link to={`/magazine/${i.id}`} className="group block">
              <div className="aspect-[3/4] overflow-hidden rounded-xl bg-gray-100 shadow-md transition group-hover:shadow-xl">
                {i.cover_url ? <img src={i.cover_url} alt="" loading="lazy" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center bg-ilc-purple/10 text-ilc-purple"><BookOpen className="h-10 w-10" aria-hidden="true" /></div>}
              </div>
              <p className="mt-2 text-xs font-bold tracking-widest text-ilc-gold-deep uppercase">{monthText(i.issue_month)}</p>
              <p className="font-serif text-base font-semibold text-ilc-ink group-hover:text-ilc-purple">{i.title}</p>
              {i.last_page && <p className="text-xs font-semibold text-ilc-purple">Continue on page {i.last_page}</p>}
              {!i.published && <p className="text-xs font-bold text-red-700">Draft: members cannot see it</p>}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
