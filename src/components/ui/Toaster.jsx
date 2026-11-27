import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, MessageCircle, X } from 'lucide-react';
import { useToastStore } from '../../store/toast-store.js';

// Shows the pop-up messages in the bottom corner. Rendered once, in the layout.
export default function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  const navigate = useNavigate();

  return createPortal(
    <div
      aria-live="polite"
      className="pointer-events-none fixed right-4 bottom-4 left-4 z-[60] flex flex-col items-end gap-2 sm:left-auto"
    >
      {toasts.map((t) => {
        const isMessage = t.tone === 'message';
        const ok = t.tone === 'success';
        const Icon = isMessage ? MessageCircle : ok ? CheckCircle2 : AlertCircle;
        const box = `animate-slide-up pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-xl px-4 py-3 text-sm shadow-lg sm:w-80 ${ok || isMessage ? 'bg-ilc-sidebar text-white' : 'bg-red-600 text-white'}`;

        const content = (
          <>
            <Icon
              className={`mt-0.5 h-4 w-4 shrink-0 ${ok || isMessage ? 'text-ilc-gold' : ''}`}
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1 text-left">
              {t.title && (
                <span className="block text-[10px] font-bold tracking-widest text-ilc-gold uppercase">
                  New message · {t.title}
                </span>
              )}
              <span className="block break-words">{t.message}</span>
            </span>
          </>
        );

        return (
          <div key={t.id} role={t.tone === 'error' ? 'alert' : 'status'} className={box}>
            {t.to ? (
              // A message toast: pressing it opens the conversation.
              <button
                type="button"
                onClick={() => {
                  dismiss(t.id);
                  navigate(t.to);
                }}
                className="flex min-w-0 flex-1 items-start gap-2.5 text-left"
              >
                {content}
              </button>
            ) : (
              content
            )}
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss"
              className="opacity-70 hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>,
    document.body,
  );
}
