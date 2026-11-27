import { useState } from 'react';
import { Check, X } from 'lucide-react';
import Alert from '../../components/ui/Alert.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import Button from '../../components/ui/Button.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import { getErrorMessage } from '../../lib/api-client.js';
import { formatDateWithDay, timeAgo } from '../../lib/format.js';
import PrivateImage from './PrivateImage.jsx';
import { useApprovePhoto, usePhotoReview, useRejectPhoto } from './photo-hooks.js';
import SpocTabs from '../ops/SpocTabs.jsx';

const FILTERS = [
  { value: 'PENDING', label: 'Waiting' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Not approved' },
];

// Photos members sent from events. Look at each one, then approve it into the gallery or turn it down.
// A relationship manager sees their own members' photos; an Admin sees everyone's.
export default function PhotoApprovalsPage() {
  const [status, setStatus] = useState('PENDING');
  const { data: photos = [], isLoading, isError, error } = usePhotoReview(status);
  const { data: waiting = [] } = usePhotoReview('PENDING');
  const approve = useApprovePhoto();
  const reject = useRejectPhoto();
  const [turnDown, setTurnDown] = useState(null);
  const [reason, setReason] = useState('');

  return (
    <div className="w-full space-y-5">
      <SpocTabs group="day" />
      <div className="glass-card rounded-2xl p-5">
        <h2 className="text-lg font-bold text-ilc-ink">Member photos</h2>
        <p className="mt-1 text-sm text-gray-700">
          Members send photos from events they attended. Photos stay private until you approve them. Approved photos go into the
          gallery with the member&apos;s name.
        </p>
      </div>

      <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            aria-pressed={status === f.value}
            onClick={() => setStatus(f.value)}
            className={`min-h-10 rounded-full border px-4 text-sm font-bold transition ${status === f.value ? 'border-ilc-purple bg-ilc-purple text-white' : 'border-gray-300 bg-white text-gray-700 hover:bg-ilc-purple/5'}`}
          >
            {f.label}
            {f.value === 'PENDING' && <span className="ml-1.5 text-xs opacity-80">{waiting.length}</span>}
          </button>
        ))}
      </div>

      {isError && <Alert>{getErrorMessage(error)}</Alert>}
      {isLoading && <div className="glass-card rounded-2xl p-10 text-center text-sm font-medium text-gray-700">Loading…</div>}
      {!isLoading && photos.length === 0 && (
        <div className="glass-card rounded-2xl p-10 text-center">
          <p className="font-serif text-xl font-bold text-ilc-purple">{status === 'PENDING' ? 'Nothing waiting' : 'Nothing here'}</p>
          <p className="mt-1 text-sm text-gray-700">{status === 'PENDING' ? 'New photos from your members will appear here.' : 'No photos with this status.'}</p>
        </div>
      )}

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map((p) => (
          <li key={p.id} className="glass-card overflow-hidden rounded-2xl">
            <div className="aspect-[4/3] bg-gray-50">
              {p.status === 'PENDING' ? (
                <PrivateImage fileId={p.file_id} className="h-full w-full object-cover" />
              ) : p.photo_url ? (
                <img src={p.photo_url} alt="" loading="lazy" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center p-4 text-center text-sm font-medium text-gray-700">{p.reject_reason || 'Not approved'}</div>
              )}
            </div>
            <div className="space-y-3 p-4">
              <div className="flex items-center gap-3">
                <Avatar name={p.member.name} initials={p.member.initials} src={p.member.photo_url} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-ilc-ink">{p.member.name}</p>
                  <p className="truncate text-xs text-gray-700">
                    {p.event.title} · {formatDateWithDay(p.event.date)}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-600">Sent {timeAgo(p.created_at)}</p>
              {p.status === 'PENDING' ? (
                <div className="flex flex-wrap gap-2">
                  <Button className="min-w-[7.5rem] flex-1" loading={approve.isPending && approve.variables === p.id} disabled={approve.isPending || reject.isPending} onClick={() => approve.mutate(p.id)}>
                    <Check className="h-4 w-4" aria-hidden="true" /> Approve
                  </Button>
                  <Button
                    variant="ghost"
                    className="min-w-[7.5rem] flex-1 border border-gray-300 text-red-700"
                    disabled={approve.isPending || reject.isPending}
                    onClick={() => {
                      setReason('');
                      setTurnDown(p);
                    }}
                  >
                    <X className="h-4 w-4" aria-hidden="true" /> Turn down
                  </Button>
                </div>
              ) : (
                <p className={`text-sm font-bold ${p.status === 'APPROVED' ? 'text-emerald-700' : 'text-red-700'}`}>
                  {p.status === 'APPROVED' ? 'In the gallery' : `Not approved${p.reject_reason ? `: ${p.reject_reason}` : ''}`}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={Boolean(turnDown)}
        danger
        title="Turn this photo down?"
        confirmLabel="Turn down"
        loading={reject.isPending}
        onCancel={() => setTurnDown(null)}
        onConfirm={() => reject.mutate({ id: turnDown.id, reason: reason.trim() }, { onSettled: () => setTurnDown(null) })}
      >
        <strong>{turnDown?.member.name}</strong> will be told, and the photo is deleted.
        <label htmlFor="reject-reason" className="mt-3 block text-xs font-bold tracking-widest text-gray-700 uppercase">
          Reason (optional)
        </label>
        <input
          id="reject-reason"
          value={reason}
          maxLength={200}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Too blurry"
          className="mt-1 min-h-11 w-full rounded-lg border border-gray-300 px-3 text-sm focus:border-ilc-purple focus:ring-2 focus:ring-ilc-purple/15 focus:outline-none"
        />
      </ConfirmDialog>
    </div>
  );
}
