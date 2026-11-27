import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import Alert from '../../components/ui/Alert.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import { getErrorMessage } from '../../lib/api-client.js';
import { useDebounced } from '../../lib/use-debounced.js';
import { useAuthStore } from '../../store/auth-store.js';
import { useDirectory } from './hooks.js';
import ProfileSheet from './ProfileSheet.jsx';

// One member card. The industry shows as a small tag; people from my own industry are marked.
function Card({ m, onOpen }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(m.id)}
        className="glass-card flex h-full w-full items-center gap-3 rounded-2xl p-4 text-left transition hover:shadow-md"
      >
        <Avatar name={m.name} initials={m.initials} src={m.photo_url} size="lg" />
        <span className="min-w-0">
          <span className="block truncate font-bold text-ilc-ink">{m.name}</span>
          <span className="block truncate text-sm text-gray-700">{m.title}</span>
          <span className="block truncate text-sm font-semibold text-ilc-purple">{m.organisation}</span>
          {m.industry && (
            <span className={`mt-1 inline-block max-w-full truncate rounded-full px-2 py-0.5 text-xs font-bold ${m.same_industry ? 'bg-ilc-gold/25 text-ilc-ink' : 'bg-gray-100 text-gray-700'}`}>
              {m.industry.name}
            </span>
          )}
        </span>
      </button>
    </li>
  );
}

const pill = (on) =>
  `min-h-10 shrink-0 rounded-full border px-4 text-sm font-bold whitespace-nowrap transition ${
    on ? 'border-ilc-purple bg-ilc-purple text-white' : 'border-gray-300 bg-white text-gray-700 hover:bg-ilc-purple/5'
  }`;

// Every approved member, with search. Members from your own industry come first; filter pills narrow to one industry.
export default function DirectoryTab({ onMessage }) {
  const myIndustryId = useAuthStore((s) => s.user.industry_id);
  const [text, setText] = useState('');
  const [industry, setIndustry] = useState('');
  const search = useDebounced(text.trim());
  const { data: members = [], isLoading, isError, error } = useDirectory(search, industry);
  const { data: everyone = [] } = useDirectory('', ''); // the whole list (cached), to know which industries have members
  const [openId, setOpenId] = useState(null);
  const open = members.find((m) => m.id === openId) ?? null;

  // Industries that actually have members, biggest first. My own industry is always the first pill.
  const pills = useMemo(() => {
    const counts = new Map();
    for (const m of everyone) if (m.industry) counts.set(m.industry.id, { ...m.industry, count: (counts.get(m.industry.id)?.count ?? 0) + 1 });
    const list = [...counts.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    return [...list.filter((i) => i.id === myIndustryId), ...list.filter((i) => i.id !== myIndustryId)];
  }, [everyone, myIndustryId]);

  const mine = members.filter((m) => m.same_industry);
  const others = members.filter((m) => !m.same_industry);
  const grouped = !industry && mine.length > 0;
  const myName = mine[0]?.industry?.name;

  return (
    <div className="space-y-4">
      <div className="relative">
        <label htmlFor="directory-search" className="sr-only">
          Search members
        </label>
        <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-gray-600" aria-hidden="true" />
        <input
          id="directory-search"
          type="search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Search by name, title or organisation"
          className="min-h-11 w-full rounded-lg border border-gray-200 bg-white pr-3 pl-10 text-sm focus:border-ilc-purple focus:ring-2 focus:ring-ilc-purple/15 focus:outline-none"
        />
      </div>

      {pills.length > 0 && (
        <div role="group" aria-label="Filter by industry" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          <button type="button" aria-pressed={!industry} onClick={() => setIndustry('')} className={pill(!industry)}>
            Everyone
          </button>
          {pills.map((i) => (
            <button key={i.id} type="button" aria-pressed={industry === i.id} onClick={() => setIndustry(i.id)} className={pill(industry === i.id)}>
              {i.id === myIndustryId ? `My industry · ${i.name}` : i.name}
              <span className="ml-1.5 text-xs opacity-80">{i.count}</span>
            </button>
          ))}
        </div>
      )}

      {isError && <Alert>{getErrorMessage(error)}</Alert>}

      {isLoading ? (
        <p className="py-10 text-center text-sm font-medium text-gray-700">Loading members…</p>
      ) : members.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center">
          <p className="font-serif text-xl font-bold text-ilc-purple">
            {search || industry ? 'No one matches' : 'No other members yet'}
          </p>
          {industry && (
            <button type="button" onClick={() => setIndustry('')} className="mt-2 text-sm font-bold text-ilc-purple hover:underline">
              Show everyone
            </button>
          )}
        </div>
      ) : (
        <>
          {grouped && (
            <section aria-label="In your industry" className="space-y-3">
              <h3 className="text-sm font-bold tracking-wide text-ilc-ink uppercase">
                In your industry · {myName} <span className="text-gray-600">({mine.length})</span>
              </h3>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {mine.map((m) => (
                  <Card key={m.id} m={m} onOpen={setOpenId} />
                ))}
              </ul>
            </section>
          )}
          <section aria-label={grouped ? 'Other members' : 'Members'} className="space-y-3">
            {grouped && others.length > 0 && <h3 className="pt-2 text-sm font-bold tracking-wide text-ilc-ink uppercase">Other members</h3>}
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {(grouped ? others : members).map((m) => (
                <Card key={m.id} m={m} onOpen={setOpenId} />
              ))}
            </ul>
          </section>
        </>
      )}

      {open && (
        <ProfileSheet
          member={open}
          onClose={() => setOpenId(null)}
          onMessage={(id) => {
            setOpenId(null);
            onMessage(id);
          }}
        />
      )}
    </div>
  );
}
