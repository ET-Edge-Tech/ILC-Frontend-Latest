import { useId } from 'react';

// A labelled drop-down. Options: [{ value, label }].
export default function SelectField({ label, options, error, className = '', ...rest }) {
  const id = useId();
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-xs font-bold tracking-widest text-gray-700 uppercase">
          {label}
        </label>
      )}
      <select
        id={id}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`min-h-11 w-full rounded-lg border bg-white px-3 text-sm text-ilc-ink focus:border-ilc-purple focus:ring-2 focus:ring-ilc-purple/15 focus:outline-none ${
          error ? 'border-red-400' : 'border-gray-200'
        }`}
        {...rest}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
