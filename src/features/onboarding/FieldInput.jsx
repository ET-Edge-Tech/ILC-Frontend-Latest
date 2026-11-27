import { useId } from 'react';
import SelectField from '../../components/ui/SelectField.jsx';
import TextField from '../../components/ui/TextField.jsx';
import { parseRichText, plainText } from './form-logic.js';

// Text from the form with its safe links shown as real links.
function RichText({ html }) {
  return parseRichText(html).map((part, i) =>
    part.href ? (
      <a
        key={i}
        href={part.href}
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-ilc-purple underline"
      >
        {part.text}
      </a>
    ) : (
      <span key={i}>{part.text}</span>
    ),
  );
}

const inputClass =
  'w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-ilc-ink focus:border-ilc-purple focus:ring-2 focus:ring-ilc-purple/15 focus:outline-none';

function Legend({ field }) {
  return (
    <>
      <legend className="mb-1 text-xs font-bold tracking-widest text-gray-700 uppercase">
        {field.label}
        {field.isRequired && <span className="ml-1 text-ilc-gold-deep">*</span>}
      </legend>
      {field.description && (
        <p className="mb-2 text-xs text-gray-600">{plainText(field.description)}</p>
      )}
    </>
  );
}

// One question. `value` is a string, or a list of strings for a checkbox group.
export default function FieldInput({ field, value, error, onChange }) {
  const id = useId();
  const hint = plainText(field.description);
  const label = field.isRequired ? `${field.label} *` : field.label;
  const errorId = `${id}-error`;

  if (field.type === 'section') {
    return (
      <div className="pt-2">
        <h3 className="font-serif text-xl font-bold text-ilc-purple">{field.label}</h3>
        {hint && <p className="mt-1 text-sm text-gray-600">{hint}</p>}
      </div>
    );
  }

  if (field.type === 'select') {
    return (
      <div data-field={field.id}>
        <SelectField
          label={label}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          error={error}
          options={[
            { value: '', label: 'Choose…' },
            ...(field.choices ?? []).map((c) => ({ value: c.value, label: c.text })),
          ]}
        />
      </div>
    );
  }

  if (field.type === 'textarea') {
    return (
      <div data-field={field.id}>
        <label
          htmlFor={id}
          className="mb-1.5 block text-xs font-bold tracking-widest text-gray-700 uppercase"
        >
          {label}
        </label>
        <textarea
          id={id}
          rows={4}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          maxLength={5000}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`${inputClass} ${error ? 'border-red-400' : 'border-gray-200'}`}
        />
        {hint && !error && <p className="mt-1 text-xs text-gray-600">{hint}</p>}
        {error && (
          <p id={errorId} className="mt-1.5 text-xs text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }

  if (field.type === 'radio' || field.type === 'checkbox') {
    const isCheckbox = field.type === 'checkbox';
    const selected = isCheckbox ? (Array.isArray(value) ? value : []) : value;
    const toggle = (v) =>
      onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);

    return (
      <fieldset data-field={field.id} aria-describedby={error ? errorId : undefined}>
        <Legend field={field} />
        {/* One long option (like a consent statement) gets the full width; short options sit in two columns. */}
        <div
          className={`grid grid-cols-1 gap-2 ${(field.choices ?? []).length > 1 && !(field.choices ?? []).some((c) => c.text.length > 60) ? 'sm:grid-cols-2' : ''}`}
        >
          {(field.choices ?? []).map((c) => {
            const checked = isCheckbox ? selected.includes(c.value) : selected === c.value;
            return (
              <label
                key={c.value}
                className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border px-3.5 py-2.5 text-sm transition ${
                  checked
                    ? 'border-ilc-purple bg-ilc-purple/5 text-ilc-ink'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-ilc-purple/40'
                }`}
              >
                <input
                  type={isCheckbox ? 'checkbox' : 'radio'}
                  name={`field-${field.id}`}
                  checked={checked}
                  onChange={() => (isCheckbox ? toggle(c.value) : onChange(c.value))}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-ilc-purple"
                />
                <span className="min-w-0 break-words">
                  <RichText html={c.text} />
                </span>
              </label>
            );
          })}
        </div>
        {error && (
          <p id={errorId} className="mt-1.5 text-xs text-red-600">
            {error}
          </p>
        )}
      </fieldset>
    );
  }

  // text, email, phone, date, and anything else we do not know falls back to a plain text box
  const type = { email: 'email', phone: 'tel', date: 'date' }[field.type] ?? 'text';
  return (
    <div data-field={field.id}>
      <TextField
        label={label}
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        error={error}
        hint={hint || undefined}
        placeholder={field.placeholder || undefined}
        autoComplete={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'off'}
      />
    </div>
  );
}
