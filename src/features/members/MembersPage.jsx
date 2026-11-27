import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronRight, Download, Search, Upload, UserPlus } from 'lucide-react';
import writeExcelFile from 'write-excel-file/browser';
import Alert from '../../components/ui/Alert.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import Button from '../../components/ui/Button.jsx';
import SelectField from '../../components/ui/SelectField.jsx';
import { getErrorMessage } from '../../lib/api-client.js';
import { formatDate } from '../../lib/format.js';
import { useDebounced } from '../../lib/use-debounced.js';
import { toast } from '../../store/toast-store.js';
import { ExpiryText, RoleBadge, StatusBadge } from './StatusBadge.jsx';
import { useApproveMany, useMembers } from './hooks.js';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'SUBMITTED', label: 'Needs review' },
  { value: 'PENDING', label: 'Form pending' },
  { value: 'APPROVED', label: 'Approved' },
];

async function exportToExcel(members) {
  const head = ['Name', 'Email', 'Title', 'Role', 'Status', 'Organisation', 'Phone', 'SPOC', 'Membership start', 'Membership end'].map((value) => ({
    value,
    fontWeight: 'bold',
  }));
  const rows = members.map((m) =>
    [m.name, m.email, m.title, m.role, m.profile_status, m.organisation, m.phone, m.spoc?.name, m.membership_start, m.membership_end].map((v) => ({
      value: v ?? '',
      type: String,
    })),
  );
  await writeExcelFile([head, ...rows], { columns: [{ width: 24 }, { width: 30 }, { width: 24 }, { width: 12 }, { width: 14 }, { width: 24 }, { width: 16 }, { width: 20 }, { width: 16 }, { width: 16 }] }).toFile(
    `ilc-members-${new Date().toISOString().slice(0, 10)}.xlsx`,
  );
}

export default function MembersPage() {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') ?? '';
  const [searchText, setSearchText] = useState(params.get('q') ?? '');
  const search = useDebounced(searchText.trim());
  const { data: members = [], isLoading, isError, error, isFetching } = useMembers({ search, status });
  const approveMany = useApproveMany();
  const [selected, setSelected] = useState(() => new Set());
  const navigate = useNavigate();

  const reviewable = useMemo(() => members.filter((m) => m.profile_status === 'SUBMITTED'), [members]);
  const selectedIds = [...selected].filter((id) => reviewable.some((m) => m.id === id));

  const setStatus = (value) => {
    const next = new URLSearchParams(params);
    if (value) next.set('status', value);
    else next.delete('status');
    setParams(next, { replace: true });
    setSelected(new Set());
  };

  const toggle = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allSelected = reviewable.length > 0 && selectedIds.length === reviewable.length;
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(reviewable.map((m) => m.id)));

  const doExport = async () => {
    try {
      await exportToExcel(members);
    } catch {
      toast.error('Could not create the Excel file.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <div className="relative min-w-[16rem] flex-1">
          <label htmlFor="member-search" className="sr-only">
            Search members
          </label>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-gray-600" aria-hidden="true" />
          <input
            id="member-search"
            type="search"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search members"
            className="min-h-11 w-full rounded-lg border border-gray-200 bg-white pr-3 pl-10 text-sm focus:border-ilc-purple focus:ring-2 focus:ring-ilc-purple/15 focus:outline-none"
          />
        </div>
        <SelectField className="w-full sm:w-48" aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)} options={STATUS_OPTIONS} />
        <div className="flex flex-wrap gap-2 xl:ml-auto">
          <Button variant="ghost" className="w-auto border border-gray-200" onClick={doExport} disabled={!members.length}>
            <Download className="h-4 w-4" aria-hidden="true" /> Export
          </Button>
          <Link to="/admin/members/bulk" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-gray-200 px-5 text-xs font-bold tracking-widest whitespace-nowrap text-ilc-purple uppercase hover:bg-ilc-purple/5">
            <Upload className="h-4 w-4" aria-hidden="true" /> Bulk upload
          </Link>
          <Link to="/admin/members/new" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-ilc-purple px-5 text-xs font-bold tracking-widest whitespace-nowrap text-white uppercase hover:bg-ilc-ink">
            <UserPlus className="h-4 w-4" aria-hidden="true" /> Add member
          </Link>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 rounded-xl bg-ilc-sidebar px-4 py-3 text-white shadow-lg">
          <span className="text-sm">{selectedIds.length} selected</span>
          <Button
            variant="gold"
            className="w-auto"
            loading={approveMany.isPending}
            onClick={() => approveMany.mutate(selectedIds, { onSuccess: () => setSelected(new Set()) })}
          >
            Approve selected
          </Button>
        </div>
      )}

      {isError && <Alert>{getErrorMessage(error)}</Alert>}

      {isLoading ? (
        <div className="glass-card rounded-2xl p-10 text-center text-sm text-gray-600">Loading members…</div>
      ) : members.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center">
          <p className="font-serif text-xl font-bold text-ilc-purple">No members found</p>
          <p className="mt-1 text-sm text-gray-600">{search || status ? 'Try a different search or filter.' : 'Add your first member to get started.'}</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-600" aria-live="polite">
            {members.length} member{members.length === 1 ? '' : 's'}
            {isFetching ? ' · updating…' : ''}
          </p>

          {/* Wide screens: table */}
          <div className="glass-card hidden overflow-hidden rounded-2xl md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-white/60 text-xs font-bold tracking-widest text-gray-700 uppercase">
                <tr>
                  <th className="w-12 px-4 py-3">
                    {reviewable.length > 0 && (
                      <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all members waiting for review" className="h-4 w-4 accent-ilc-purple" />
                    )}
                  </th>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="hidden px-4 py-3 lg:table-cell">SPOC</th>
                  <th className="px-4 py-3">Membership ends</th>
                  <th className="w-10 px-2 py-3" />
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className="border-b border-gray-50 last:border-0 hover:bg-white/70">
                    <td className="px-4 py-3">
                      {m.profile_status === 'SUBMITTED' && (
                        <input type="checkbox" checked={selected.has(m.id)} onChange={() => toggle(m.id)} aria-label={`Select ${m.name}`} className="h-4 w-4 accent-ilc-purple" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => navigate(`/admin/members/${m.id}`)} className="flex w-full items-center gap-3 text-left">
                        <Avatar name={m.name} initials={m.initials} src={m.photo_url} size="sm" />
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-ilc-ink">{m.name}</span>
                          <span className="block truncate text-xs text-gray-600">{m.email}</span>
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <StatusBadge status={m.profile_status} />
                        <RoleBadge role={m.role} />
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-gray-600 lg:table-cell">{m.spoc?.name ?? <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3">
                      <span className="block text-gray-700">{formatDate(m.membership_end)}</span>
                      {m.membership_end && <ExpiryText membershipEnd={m.membership_end} />}
                    </td>
                    <td className="px-2 py-3">
                      <button type="button" onClick={() => navigate(`/admin/members/${m.id}`)} aria-label={`Open ${m.name}`} className="flex h-9 w-9 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100">
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Phones: cards */}
          <ul className="space-y-3 md:hidden">
            {members.map((m) => (
              <li key={m.id} className="glass-card rounded-xl p-4">
                <div className="flex items-start gap-3">
                  {m.profile_status === 'SUBMITTED' && (
                    <input type="checkbox" checked={selected.has(m.id)} onChange={() => toggle(m.id)} aria-label={`Select ${m.name}`} className="mt-3 h-5 w-5 accent-ilc-purple" />
                  )}
                  <button type="button" onClick={() => navigate(`/admin/members/${m.id}`)} className="flex min-w-0 flex-1 items-start gap-3 text-left">
                    <Avatar name={m.name} initials={m.initials} src={m.photo_url} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-ilc-ink">{m.name}</span>
                      <span className="block truncate text-xs text-gray-600">{m.email}</span>
                      <span className="mt-2 flex flex-wrap items-center gap-1.5">
                        <StatusBadge status={m.profile_status} />
                        <RoleBadge role={m.role} />
                      </span>
                      <span className="mt-2 block text-xs text-gray-600">
                        Ends {formatDate(m.membership_end)} {m.membership_end && <>· <ExpiryText membershipEnd={m.membership_end} /></>}
                      </span>
                    </span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

    </div>
  );
}
