import { useState } from 'react';
import SelectField from './SelectField.jsx';
import TextField from './TextField.jsx';

const NEW = '__new__';

// A drop-down of saved choices with "Add new…" at the bottom. The value is always plain text.
// A value that is not in the list yet (just typed, or an older one) shows in the text box.
export default function PickOrAddField({
  label,
  value,
  onChange,
  options,
  error,
  placeholder,
  newLabel = 'Add new…',
  className = '',
}) {
  const [adding, setAdding] = useState(false);
  const known = options.includes(value);
  const typing = adding || (value !== '' && !known);

  return (
    <div className={className}>
      <SelectField
        label={label}
        value={typing ? NEW : value}
        error={typing ? undefined : error}
        onChange={(e) => {
          if (e.target.value === NEW) {
            setAdding(true);
            onChange('');
          } else {
            setAdding(false);
            onChange(e.target.value);
          }
        }}
        options={[
          { value: '', label: 'Choose…' },
          ...options.map((o) => ({ value: o, label: o })),
          { value: NEW, label: newLabel },
        ]}
      />
      {typing && (
        <div className="mt-2">
          <TextField
            label={`New ${label.replace(/\s*\*$/, '').toLowerCase()}`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            error={error}
            autoFocus={adding}
            maxLength={100}
          />
          <button
            type="button"
            onClick={() => {
              setAdding(false);
              onChange('');
            }}
            className="mt-1 text-xs font-semibold text-ilc-purple hover:underline"
          >
            Back to the list
          </button>
        </div>
      )}
    </div>
  );
}
