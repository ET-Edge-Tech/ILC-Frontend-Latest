import { useState } from 'react';
import Avatar from '../../components/ui/Avatar.jsx';
import Button from '../../components/ui/Button.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import { useReviewAction, useSpocReview } from './hooks.js';

const COPY = {
  approve: {
    title: 'Approve this member?',
    confirm: 'Approve',
    body: 'They get full access to the portal and an approval email.',
    danger: false,
  },
  reject: {
    title: 'Send this profile back?',
    confirm: 'Send back',
    body: 'They are asked to review their details and submit again, and get an email.',
    danger: true,
  },
};

// The SPOC's own members who submitted their profile and wait for a decision.
// Members are normally approved automatically, so this is usually empty.
export default function ReviewQueue() {
  const { data: members = [] } = useSpocReview(true);
  const act = useReviewAction();
  const [pending, setPending] = useState(null); // { member, action }

  if (members.length === 0) return null;
  const copy = pending ? COPY[pending.action] : null;

  return (
    <section aria-label="Needs review" className="space-y-3">
      <h3 className="text-[10px] font-bold tracking-[0.25em] text-ilc-gold-deep uppercase">
        Needs your review ({members.length})
      </h3>
      <ul className="space-y-3">
        {members.map((m) => (
          <li key={m.id} className="glass-card flex flex-wrap items-center gap-3 rounded-2xl p-4">
            <Avatar name={m.name} initials={m.initials} src={m.photo_url} size="sm" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-ilc-ink">{m.name}</span>
              <span className="block truncate text-xs text-gray-500">
                {[m.title, m.organisation].filter(Boolean).join(' · ')}
              </span>
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" className="sm:w-auto" onClick={() => setPending({ member: m, action: 'reject' })}>
                Send back
              </Button>
              <Button className="sm:w-auto" onClick={() => setPending({ member: m, action: 'approve' })}>
                Approve
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={Boolean(pending)}
        danger={copy?.danger}
        title={copy?.title ?? ''}
        confirmLabel={copy?.confirm ?? ''}
        loading={act.isPending}
        onCancel={() => setPending(null)}
        onConfirm={() =>
          act.mutate(
            { id: pending.member.id, action: pending.action },
            { onSettled: () => setPending(null) },
          )
        }
      >
        {pending && (
          <>
            <b>{pending.member.name}</b>. {copy.body}
          </>
        )}
      </ConfirmDialog>
    </section>
  );
}
