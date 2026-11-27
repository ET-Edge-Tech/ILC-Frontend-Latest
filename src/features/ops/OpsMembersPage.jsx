import { useMemo, useState } from 'react';
import { ChevronRight, Search } from 'lucide-react';
import Alert from '../../components/ui/Alert.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import SelectField from '../../components/ui/SelectField.jsx';
import { getErrorMessage } from '../../lib/api-client.js';
import { formatDate } from '../../lib/format.js';
import Button from '../../components/ui/Button.jsx';
import { useAuthStore } from '../../store/auth-store.js';
import GroupActions from './GroupActions.jsx';
import { useOpenMember, useOpsMembers } from './hooks.js';
import { HealthPill } from './parts.jsx';
import { RISK } from './risk.js';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const RISK_FILTER = [
  { value: '', label: 'Everyone' },
  { value: 'Red', label: RISK.Red.label },
  { value: 'Amber', label: RISK.Amber.label },
  { value: 'Green', label: RISK.Green.label },
];

// The relationship manager's members, with their risk colour. Click one to open their page.
export default function OpsMembersPage() {
  const { data: members = [], isLoading, isError, error } = useOpsMembers();
  const [text, setText] = useState('');
  const [risk, setRisk] = useState('');
  const [spocId, setSpocId] = useState('');
  const [industry, setIndustry] = useState('');
  const [city, setCity] = useState('');
  const [tier, setTier] = useState('');
  const [interest, setInterest] = useState('');
  const [month, setMonth] = useState('');
  const openMember = useOpenMember();
  const isAdmin = useAuthStore((s) => s.user.role) !== 'SPOC';
  const [picked, setPicked] = useState({}); // id -> name, for the group actions (relationship managers only)
  const toggle = (m) =>
    setPicked((p) => {
      const next = { ...p };
      if (next[m.id]) delete next[m.id];
      else next[m.id] = m.name;
      return next;
    });

  // An Admin sees everyone's members and can narrow the list to one relationship manager.
  const spocs = useMemo(() => {
    const seen = new Map();
    for (const m of members) if (m.spoc) seen.set(m.spoc.id, m.spoc.name);
    return [...seen].sort((a, b) => a[1].localeCompare(b[1]));
  }, [members]);

  // The choices for each filter come from the members themselves.
  const choices = useMemo(() => {
    const uniq = (list) => [...new Set(list.filter(Boolean))].sort((a, b) => a.localeCompare(b));
    return {
      industries: [...new Map(members.filter((m) => m.industry).map((m) => [m.industry.id, m.industry.name]))].sort((a, b) => a[1].localeCompare(b[1])),
      cities: uniq(members.map((m) => m.city)),
      tiers: uniq(members.map((m) => m.tier)),
      interests: uniq(members.flatMap((m) => m.interests ?? [])),
    };
  }, [members]);

  const shown = useMemo(() => {
    const q = text.trim().toLowerCase();
    return members.filter(
      (m) =>
        (!risk || m.risk === risk) &&
        (!spocId || (spocId === 'none' ? !m.spoc : m.spoc?.id === spocId)) &&
        (!industry || m.industry?.id === industry) &&
        (!city || m.city === city) &&
        (!tier || m.tier === tier) &&
        (!interest || (m.interests ?? []).includes(interest)) &&
        (!month || m.birth_month === Number(month)) &&
        (!q || [m.name, m.organisation, m.city].some((v) => v?.toLowerCase().includes(q))),
    );
  }, [members, text, risk, spocId, industry, city, tier, interest, month]);
  const filtering = Boolean(risk || spocId || industry || city || tier || interest || month || text);
  const clear = () => {
    setText('');
    setRisk('');
    setSpocId('');
    setIndustry('');
    setCity('');
    setTier('');
    setInterest('');
    setMonth('');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <div className="relative min-w-[14rem] flex-1">
          <label htmlFor="ops-search" className="sr-only">
            Search members
          </label>
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-gray-400"
            aria-hidden="true"
          />
          <input
            id="ops-search"
            type="search"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Search members"
            className="min-h-11 w-full rounded-lg border border-gray-200 bg-white pr-3 pl-10 text-sm focus:border-ilc-purple focus:ring-2 focus:ring-ilc-purple/15 focus:outline-none"
          />
        </div>
        <SelectField
          className="w-full sm:w-40"
          aria-label="Filter by how they are doing"
          value={risk}
          onChange={(e) => setRisk(e.target.value)}
          options={RISK_FILTER}
        />
        {isAdmin && (
          <SelectField
            className="w-full sm:w-52"
            aria-label="Filter by relationship manager"
            value={spocId}
            onChange={(e) => setSpocId(e.target.value)}
            options={[
              { value: '', label: 'All relationship managers' },
              ...spocs.map(([id, name]) => ({ value: id, label: name })),
              { value: 'none', label: 'Unassigned' },
            ]}
          />
        )}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <SelectField className="w-full sm:w-44" aria-label="Filter by industry" value={industry} onChange={(e) => setIndustry(e.target.value)} options={[{ value: '', label: 'All industries' }, ...choices.industries.map(([id, name]) => ({ value: id, label: name }))]} />
        <SelectField className="w-full sm:w-36" aria-label="Filter by city" value={city} onChange={(e) => setCity(e.target.value)} options={[{ value: '', label: 'All cities' }, ...choices.cities.map((c) => ({ value: c, label: c }))]} />
        <SelectField className="w-full sm:w-36" aria-label="Filter by tier" value={tier} onChange={(e) => setTier(e.target.value)} options={[{ value: '', label: 'All tiers' }, ...choices.tiers.map((c) => ({ value: c, label: c }))]} />
        <SelectField className="w-full sm:w-40" aria-label="Filter by interest" value={interest} onChange={(e) => setInterest(e.target.value)} options={[{ value: '', label: 'Any interest' }, ...choices.interests.map((c) => ({ value: c, label: c }))]} />
        <SelectField className="w-full sm:w-44" aria-label="Filter by birthday month" value={month} onChange={(e) => setMonth(e.target.value)} options={[{ value: '', label: 'Any birthday month' }, ...MONTHS.map((n, i) => ({ value: String(i + 1), label: n }))]} />
        {filtering && (
          <button type="button" onClick={clear} className="min-h-11 text-sm font-bold text-ilc-purple hover:underline">
            Clear filters
          </button>
        )}
      </div>
      {!isLoading && filtering && <p className="text-sm font-medium text-gray-700">Showing {shown.length} of {members.length} members.</p>}

      {isError && <Alert>{getErrorMessage(error)}</Alert>}

      {isLoading ? (
        <div className="glass-card rounded-2xl p-10 text-center text-sm text-gray-400">Loading members…</div>
      ) : shown.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center">
          <p className="font-serif font-bold text-xl text-ilc-purple">No members to show</p>
          <p className="mt-1 text-sm text-gray-500">
            {members.length
              ? 'Try a different search or filter.'
              : 'Approved members assigned to you will appear here.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {shown.map((m) => (
            <li key={m.id} className="flex items-center gap-2">
              {!isAdmin && (
                <input type="checkbox" checked={Boolean(picked[m.id])} onChange={() => toggle(m)} aria-label={`Choose ${m.name}`} className="h-5 w-5 shrink-0 accent-ilc-purple" />
              )}
              <button
                type="button"
                onClick={() => openMember(m.id)}
                className="glass-card flex min-w-0 flex-1 items-center gap-3 rounded-2xl p-4 text-left transition hover:shadow-md"
              >
                <Avatar name={m.name} initials={m.initials} src={m.photo_url} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-bold text-ilc-ink">{m.name}</span>
                  <span className="block truncate text-sm text-gray-700">
                    {[m.organisation, m.city, isAdmin && (m.spoc?.name ?? 'Unassigned')]
                      .filter(Boolean)
                      .join(' · ') || m.title}
                  </span>
                </span>
                <span className="hidden text-right text-sm font-medium text-gray-700 sm:block">
                  <span className="block">{m.tier}</span>
                  <span className="block text-gray-600">Renews {formatDate(m.renewal_date)}</span>
                </span>
                {m.benefits_owed > 0 && (
                  <span className="hidden shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-900 md:inline" title="Membership benefits still owed this year">
                    {m.benefits_owed} owed
                  </span>
                )}
                <HealthPill risk={m.risk} />
                <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {!isAdmin && (
        <>
          {shown.length > 0 && (
            <button type="button" onClick={() => setPicked(Object.fromEntries(shown.map((m) => [m.id, m.name])))} className="text-sm font-bold text-ilc-purple hover:underline">
              Choose all {shown.length} shown
            </button>
          )}
          <GroupActions selected={Object.entries(picked).map(([id, name]) => ({ id, name }))} onDone={() => setPicked({})} />
        </>
      )}
    </div>
  );
}
