import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Clock, MapPin, X } from 'lucide-react';
import Avatar from '../../components/ui/Avatar.jsx';
import Button from '../../components/ui/Button.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import { formatTime } from '../../lib/format.js';
import { STATUS } from './status.js';
import { useRespond } from './hooks.js';

// One meeting: who, when, where, the note, and the buttons that fit (answer it, suggest another time, or cancel).
// `onSuggest(meeting)` opens the "another time" window (owned by the page).
export default function MeetingCard({ meeting, onSuggest, showEvent = false }) {
  const respond = useRespond();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const m = meeting;
  const chip = STATUS[m.status];
  const act = (action) => respond.mutate({ id: m.id, action });
  const incoming = m.can_respond;

  return (
    <li className={`rounded-xl border bg-white p-4 ${incoming ? 'border-amber-300' : 'border-gray-200'}`}>
      <div className="flex items-start gap-3">
        <Avatar name={m.other.name} initials={m.other.initials} src={m.other.photo_url} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-ilc-ink">{m.other.name}</p>
          <p className="truncate text-xs text-gray-700">{[m.other.title, m.other.organisation].filter(Boolean).join(' · ')}</p>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ilc-ink">
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <Clock className="h-4 w-4 text-gray-600" aria-hidden="true" /> {formatTime(m.time)} (15 min)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-gray-600" aria-hidden="true" /> {m.place}
            </span>
          </p>
          {showEvent && (
            <p className="mt-1 text-xs text-gray-700">
              At <Link to={`/events/${m.event.id}`} className="font-semibold text-ilc-purple hover:underline">{m.event.title}</Link>
            </p>
          )}
          {m.note && <p className="mt-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">“{m.note}”</p>}
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${chip.cls}`}>
          {m.status === 'PENDING' && m.i_asked ? 'Waiting for them' : incoming ? 'Needs your answer' : chip.text}
        </span>
      </div>

      {(incoming || m.can_cancel) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {incoming && (
            <>
              <Button className="min-w-[7rem] flex-1 sm:flex-none" loading={respond.isPending && respond.variables?.action === 'accept'} disabled={respond.isPending} onClick={() => act('accept')}>
                <Check className="h-4 w-4" aria-hidden="true" /> Accept
              </Button>
              <Button variant="ghost" className="min-w-[7rem] flex-1 border border-gray-300 sm:flex-none" disabled={respond.isPending} onClick={() => onSuggest(m)}>
                Another time
              </Button>
              <Button variant="ghost" className="min-w-[7rem] flex-1 border border-gray-300 text-red-700 sm:flex-none" disabled={respond.isPending} onClick={() => act('decline')}>
                <X className="h-4 w-4" aria-hidden="true" /> Decline
              </Button>
            </>
          )}
          {!incoming && m.can_cancel && (
            <Button variant="ghost" className="w-auto border border-gray-300 text-red-700" disabled={respond.isPending} onClick={() => setConfirmCancel(true)}>
              {m.status === 'PENDING' ? 'Withdraw request' : 'Cancel meeting'}
            </Button>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmCancel}
        danger
        title={m.status === 'PENDING' ? 'Withdraw this request?' : 'Cancel this meeting?'}
        confirmLabel={m.status === 'PENDING' ? 'Withdraw' : 'Cancel meeting'}
        loading={respond.isPending}
        onCancel={() => setConfirmCancel(false)}
        onConfirm={() => respond.mutate({ id: m.id, action: 'cancel' }, { onSettled: () => setConfirmCancel(false) })}
      >
        <strong>{m.other.name}</strong> will be told, and {formatTime(m.time)} becomes free again.
      </ConfirmDialog>
    </li>
  );
}
