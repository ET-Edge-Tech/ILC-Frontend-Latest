import { useRef, useState } from 'react';
import { Camera, Trash2 } from 'lucide-react';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import { FILE_RULES } from '../../lib/uploads.js';
import PrivateImage from './PrivateImage.jsx';
import { useMyPhotos, useSendPhotos, useWithdrawPhoto } from './photo-hooks.js';

const CHIP = {
  PENDING: { text: 'Waiting for approval', cls: 'bg-amber-100 text-amber-800' },
  APPROVED: { text: 'In the gallery', cls: 'bg-emerald-100 text-emerald-800' },
  REJECTED: { text: 'Not approved', cls: 'bg-red-100 text-red-700' },
};

// "Your photos from this event": a member who attended can send their own pictures. Their relationship manager looks at
// each one first; approved photos go into the gallery with the member's name.
export default function MyEventPhotos({ eventId }) {
  const input = useRef(null);
  const { data } = useMyPhotos(eventId);
  const send = useSendPhotos(eventId);
  const withdraw = useWithdrawPhoto();
  const [step, setStep] = useState(null); // { n, total } while sending
  const [problem, setProblem] = useState('');
  const photos = data?.photos ?? [];
  const max = data?.max ?? 10;
  const used = photos.filter((p) => p.status !== 'REJECTED').length;
  const room = Math.max(0, max - used);

  const choose = (e) => {
    const files = [...(e.target.files ?? [])];
    e.target.value = '';
    if (files.length === 0) return;
    setProblem('');
    const chosen = files.slice(0, room);
    if (files.length > room) setProblem(`You can send ${room} more photo${room === 1 ? '' : 's'} from this event, so only the first ${chosen.length} will be sent.`);
    send.mutate({ files: chosen, onStep: (n, total) => setStep({ n, total }) }, { onSettled: () => setStep(null) });
  };

  return (
    <section className="glass-card rounded-2xl p-5 sm:p-7" aria-label="Your photos from this event">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-ilc-ink">Your photos from this event</h3>
          <p className="mt-0.5 text-sm text-gray-700">
            Send photos you took. Your relationship manager looks at each one first; approved photos go into the gallery with your name.
          </p>
        </div>
        <div>
          <input ref={input} type="file" accept={FILE_RULES.event_photo.accept} multiple className="sr-only" onChange={choose} aria-label="Choose photos" />
          <Button className="sm:w-auto" onClick={() => input.current?.click()} loading={send.isPending} disabled={room === 0}>
            <Camera className="h-4 w-4" aria-hidden="true" /> {room === 0 ? 'Limit reached' : 'Add photos'}
          </Button>
        </div>
      </div>

      {step && (
        <p className="mt-3 text-sm font-semibold text-ilc-purple" role="status" aria-live="polite">
          Sending photo {step.n} of {step.total}…
        </p>
      )}
      {problem && <Alert tone="warning" className="mt-3">{problem}</Alert>}
      <p className="mt-2 text-xs text-gray-700">
        {used} of {max} photos used. Pictures only (JPG, PNG, GIF or WebP).
      </p>

      {photos.length > 0 && (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((p) => (
            <li key={p.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="relative aspect-square bg-gray-50">
                {p.status === 'PENDING' && <PrivateImage fileId={p.file_id} className="h-full w-full object-cover" />}
                {p.status === 'APPROVED' && <img src={p.photo_url} alt="" loading="lazy" className="h-full w-full object-cover" />}
                {p.status === 'REJECTED' && <div className="flex h-full items-center justify-center bg-gray-100 p-3 text-center text-xs font-medium text-gray-700">{p.reject_reason || 'Not approved'}</div>}
              </div>
              <div className="flex items-center justify-between gap-2 p-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${CHIP[p.status].cls}`}>{CHIP[p.status].text}</span>
                {p.status !== 'APPROVED' && (
                  <button
                    type="button"
                    aria-label="Remove this photo"
                    disabled={withdraw.isPending}
                    onClick={() => withdraw.mutate(p.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-gray-600 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
