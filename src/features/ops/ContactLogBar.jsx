import { useState } from 'react';
import Button from '../../components/ui/Button.jsx';
import { useAddNote } from './hooks.js';

// What each button logs as. WhatsApp is a message.
const NOTE_KIND = { Call: 'Call', WhatsApp: 'Message', Email: 'Email' };


// Shown right after the relationship manager presses Call, WhatsApp or Email: one tap to log the contact with a short note.
// Logging also moves the "last touchpoint" date to today.
export default function ContactLogBar({ id, channel, onClose }) {
  const add = useAddNote(id);
  const [text, setText] = useState('');

  const save = () =>
    add.mutate({ kind: NOTE_KIND[channel], note: text.trim() || `${channel} with the member` }, { onSuccess: onClose });

  return (
    <div role="region" aria-label="Log this contact" className="mt-4 rounded-xl border border-ilc-gold/50 bg-ilc-gold/10 p-4">
      <p className="text-sm font-bold text-ilc-ink">Log this {channel.toLowerCase()}?</p>
      <p className="mt-0.5 text-xs text-gray-700">One tap saves it to the notes and counts as a touchpoint today.</p>
      <label htmlFor="contact-note" className="sr-only">
        Short note
      </label>
      <input
        id="contact-note"
        value={text}
        maxLength={300}
        onChange={(e) => setText(e.target.value)}
        placeholder="A few words about it (optional)"
        className="mt-2 min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-ilc-purple focus:ring-2 focus:ring-ilc-purple/15 focus:outline-none"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <Button className="w-auto" loading={add.isPending} onClick={save}>
          Log it
        </Button>
        <Button variant="ghost" className="w-auto border border-gray-300" disabled={add.isPending} onClick={onClose}>
          Not now
        </Button>
      </div>
    </div>
  );
}
