import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ExternalLink, MessageCircle, X } from 'lucide-react';
import Avatar from '../../components/ui/Avatar.jsx';
import Button from '../../components/ui/Button.jsx';

// A member's public profile. "Message" closes it and opens a conversation with them.
export default function ProfileSheet({ member, onClose, onMessage }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={`${member.name}'s profile`}
        className="max-h-full w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-6 shadow-2xl sm:rounded-2xl"
      >
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-10 w-10 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="-mt-2 flex flex-col items-center text-center">
          <Avatar
            name={member.name}
            initials={member.initials}
            src={member.photo_url}
            size="lg"
            className="!h-24 !w-24 !text-2xl"
          />
          <h2 className="mt-4 font-serif text-3xl font-semibold text-ilc-purple">{member.name}</h2>
          {member.title && <p className="mt-1 text-sm text-gray-600">{member.title}</p>}
          {member.organisation && (
            <p className="text-sm font-semibold text-ilc-ink">{member.organisation}</p>
          )}
          {member.industry && (
            <p className="mt-2 rounded-full bg-ilc-purple/10 px-3 py-1 text-xs font-bold text-ilc-purple">{member.industry.name}</p>
          )}
        </div>

        {member.bio && (
          <p className="mt-5 text-sm leading-relaxed whitespace-pre-wrap text-gray-600">
            {member.bio}
          </p>
        )}

        {member.linkedin_url && (
          <a
            href={member.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center justify-center gap-1.5 text-sm font-semibold text-ilc-purple hover:underline"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" /> LinkedIn
          </a>
        )}

        <Button className="mt-6" onClick={() => onMessage(member.id)}>
          <MessageCircle className="h-4 w-4" aria-hidden="true" /> Message
        </Button>
      </section>
    </div>,
    document.body,
  );
}
