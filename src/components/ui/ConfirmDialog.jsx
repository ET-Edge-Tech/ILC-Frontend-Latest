import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';
import Button from './Button.jsx';
import TextField from './TextField.jsx';

// "Are you sure?" box. Pass `typeToConfirm` (a name) to force the person to type it before the button works.
function Dialog({
  title,
  children,
  confirmLabel = 'Confirm',
  danger = false,
  typeToConfirm,
  loading = false,
  onConfirm,
  onCancel,
}) {
  const [typed, setTyped] = useState('');

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !loading && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [loading, onCancel]);

  const matches = !typeToConfirm || typed.trim().toLowerCase() === typeToConfirm.trim().toLowerCase();

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={(e) => e.target === e.currentTarget && !loading && onCancel()}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start gap-3">
          {danger && (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </span>
          )}
          <div className="min-w-0">
            <h2 id="confirm-title" className="font-serif text-xl font-bold text-ilc-purple">
              {title}
            </h2>
            <div className="mt-2 text-sm text-gray-600">{children}</div>
          </div>
        </div>

        {typeToConfirm && (
          <TextField
            className="mt-4"
            label={`Type "${typeToConfirm}" to confirm`}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            autoFocus
          />
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" className="sm:w-auto" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            className={`sm:w-auto ${danger ? 'bg-red-600 hover:bg-red-700' : ''}`}
            onClick={onConfirm}
            loading={loading}
            disabled={!matches}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// The state (what was typed) lives in Dialog, so it starts empty each time the box opens.
export default function ConfirmDialog(props) {
  return props.open ? <Dialog {...props} /> : null;
}
