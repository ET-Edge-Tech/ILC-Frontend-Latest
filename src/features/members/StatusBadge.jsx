import { expiryInfo } from '../../lib/format.js';

const STATUS = {
  PENDING: { label: 'Form pending', cls: 'bg-gray-100 text-gray-600' },
  SUBMITTED: { label: 'Needs review', cls: 'bg-amber-100 text-amber-800' },
  APPROVED: { label: 'Approved', cls: 'bg-emerald-100 text-emerald-700' },
  DELETED: { label: 'Deactivated', cls: 'bg-red-100 text-red-700' },
};

export function StatusBadge({ status }) {
  const s = STATUS[status] ?? STATUS.PENDING;
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wider whitespace-nowrap uppercase ${s.cls}`}>{s.label}</span>;
}

const ROLE_LABEL = { ADMIN: 'Admin', SUPER_ADMIN: 'Super Admin' };

export function RoleBadge({ role }) {
  if (!ROLE_LABEL[role]) return null;
  return <span className="inline-block rounded-full bg-ilc-purple/10 px-2 py-0.5 text-xs font-bold tracking-wider whitespace-nowrap text-ilc-purple uppercase">{ROLE_LABEL[role]}</span>;
}

const TONE = { expired: 'text-red-600', soon: 'text-amber-700', ok: 'text-gray-600', none: 'text-gray-600' };

export function ExpiryText({ membershipEnd }) {
  const { tone, label } = expiryInfo(membershipEnd);
  return <span className={`text-xs font-semibold ${TONE[tone]}`}>{label}</span>;
}
