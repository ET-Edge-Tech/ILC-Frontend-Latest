import { Mail, Phone } from 'lucide-react';
import WhatsAppIcon from './WhatsAppIcon.jsx';
import { telLink, whatsappLink } from '../../lib/phone.js';
import Avatar from './Avatar.jsx';

// The buttons wrap onto a second line when the card is narrow, so nothing sticks out of the card.
const btn =
  'inline-flex min-h-11 min-w-[6.5rem] flex-1 items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 text-xs font-bold tracking-widest whitespace-nowrap text-ilc-purple uppercase hover:bg-ilc-purple/5';

// The member's relationship manager, with Email, Call and WhatsApp buttons.
export default function SpocCard({ spoc }) {
  return (
    <section className="glass-card rounded-2xl p-5 sm:p-7">
      <h2 className="mb-4 text-xs font-bold tracking-[0.25em] text-ilc-gold-deep uppercase">
        Your relationship manager
      </h2>
      <div className="flex items-center gap-4">
        <Avatar name={spoc.name} src={spoc.photo_url} size="lg" />
        <div className="min-w-0">
          <p className="truncate font-serif text-xl font-bold text-ilc-purple">{spoc.name}</p>
          <p className="truncate text-sm text-gray-600">
            {spoc.title || 'ILC relationship manager'}
          </p>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {spoc.email && (
          <a href={`mailto:${spoc.email}`} className={btn}>
            <Mail className="h-4 w-4" aria-hidden="true" /> Email
          </a>
        )}
        {spoc.phone && (
          <>
            <a href={telLink(spoc.phone)} className={btn}>
              <Phone className="h-4 w-4" aria-hidden="true" /> Call
            </a>
            <a href={whatsappLink(spoc.phone)} target="_blank" rel="noreferrer" className={btn}>
              <WhatsAppIcon /> WhatsApp
            </a>
          </>
        )}
      </div>
    </section>
  );
}
