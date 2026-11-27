import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import Alert from '../../components/ui/Alert.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import Button from '../../components/ui/Button.jsx';
import TextField from '../../components/ui/TextField.jsx';
import { formatTime } from '../../lib/format.js';
import { useCounter, useFreeSlots, useRequestMeeting } from './hooks.js';

const OTHER = '__other__';

// Pick a 15-minute time, a place and (optionally) a note. Used to ask for a meeting, and to suggest another time for a request.
// Pass `counterOf` (the meeting being answered) to suggest another time; otherwise a new request goes to `person`.
export default function MeetingRequestModal({ event, person, places = [], counterOf = null, onClose }) {
  const other = counterOf ? counterOf.other : person;
  const { data, isLoading, isError } = useFreeSlots(event.id, other.id);
  const request = useRequestMeeting(event.id);
  const counter = useCounter();
  const [time, setTime] = useState('');
  const [place, setPlace] = useState(counterOf?.place && places.includes(counterOf.place) ? counterOf.place : (places[0] ?? OTHER));
  const [custom, setCustom] = useState('');
  const [note, setNote] = useState('');
  const busy = request.isPending || counter.isPending;
  const finalPlace = place === OTHER ? custom.trim() : place;
  const slots = data?.slots ?? [];

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !busy && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, onClose]);

  const send = () => {
    const body = { time, place: finalPlace, note: note.trim() || null };
    if (counterOf) counter.mutate({ id: counterOf.id, ...body }, { onSuccess: onClose });
    else request.mutate({ with: other.id, ...body }, { onSuccess: onClose, onError: () => setTime('') });
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="meet-title" className="flex max-h-full w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 p-4 sm:p-5">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar name={other.name} initials={other.initials} src={other.photo_url} size="sm" />
            <div className="min-w-0">
              <h2 id="meet-title" className="font-serif text-xl font-semibold text-ilc-purple">
                {counterOf ? 'Suggest another time' : 'Ask for 15 minutes'}
              </h2>
              <p className="truncate text-sm text-gray-700">
                with {other.name} · {event.title}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Close" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          <fieldset>
            <legend className="mb-1.5 block text-xs font-bold tracking-widest text-gray-700 uppercase">Pick a time (India time)</legend>
            <p className="mb-2 text-xs text-gray-700">Times during the sessions on the agenda are not offered.</p>
            {isLoading && <p className="text-sm text-gray-700">Looking for free times…</p>}
            {isError && <Alert>Could not load the free times. Please close this and try again.</Alert>}
            {data && slots.length === 0 && <Alert tone="warning">No time is free for both of you.</Alert>}
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {slots.map((s) => (
                <button
                  key={s.time}
                  type="button"
                  aria-pressed={time === s.time}
                  onClick={() => setTime(s.time)}
                  className={`min-h-11 rounded-lg border text-sm font-bold transition ${time === s.time ? 'border-ilc-purple bg-ilc-purple text-white' : 'border-gray-300 bg-white text-ilc-ink hover:bg-ilc-purple/5'}`}
                >
                  {formatTime(s.time)}
                </button>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="meet-place" className="mb-1.5 block text-xs font-bold tracking-widest text-gray-700 uppercase">
              Where
            </label>
            <select
              id="meet-place"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              className="min-h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-ilc-ink focus:border-ilc-purple focus:ring-2 focus:ring-ilc-purple/15 focus:outline-none"
            >
              {places.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
              <option value={OTHER}>Another place (type it)</option>
            </select>
            {place === OTHER && <TextField className="mt-2" label="Place" value={custom} maxLength={100} onChange={(e) => setCustom(e.target.value)} placeholder="e.g. Coffee bar, near the stage" />}
          </div>

          <div>
            <label htmlFor="meet-note" className="mb-1.5 block text-xs font-bold tracking-widest text-gray-700 uppercase">
              Note (optional)
            </label>
            <textarea
              id="meet-note"
              rows={2}
              maxLength={200}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="A line about what you would like to talk about"
              className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm focus:border-ilc-purple focus:ring-2 focus:ring-ilc-purple/15 focus:outline-none"
            />
            <p className="mt-1 text-xs text-gray-700">Only {other.name} can read this.</p>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-gray-100 p-4 sm:flex-row sm:justify-end sm:p-5">
          <Button variant="ghost" className="sm:w-auto" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button className="sm:w-auto" loading={busy} disabled={!time || !finalPlace} onClick={send}>
            {counterOf ? 'Send new time' : 'Send request'}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
