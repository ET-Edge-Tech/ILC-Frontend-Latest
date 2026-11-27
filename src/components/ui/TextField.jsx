import { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

// A labelled input. Pass type="password" to get a show/hide button.
export default function TextField({ label, error, hint, type = 'text', className = '', ...rest }) {
  const id = useId();
  const [shown, setShown] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-xs font-bold tracking-widest text-gray-700 uppercase">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={isPassword && shown ? 'text' : type}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={`min-h-11 w-full rounded-lg border bg-white px-3.5 text-sm text-ilc-ink placeholder:text-gray-300 focus:border-ilc-purple focus:ring-2 focus:ring-ilc-purple/15 focus:outline-none ${
            error ? 'border-red-400' : 'border-gray-200'
          } ${isPassword ? 'pr-11' : ''}`}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShown((s) => !s)}
            aria-label={shown ? 'Hide password' : 'Show password'}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-gray-600 hover:text-ilc-purple"
          >
            {shown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-gray-600">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
