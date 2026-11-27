import { useId, useState } from 'react';
import { X } from 'lucide-react';

const MAX_TAGS = 8;

// A box for short interest tags such as "Golf" or "F1". Press Enter or comma to add one; the × removes it.
// `suggestions` are tags already in use, offered while typing.
export default function TagsField({ label = 'Interest tags', value, onChange, suggestions = [], hint }) {
  const id = useId();
  const [text, setText] = useState('');

  const add = () => {
    const tag = text.trim().replace(/\s+/g, ' ').slice(0, 30);
    setText('');
    if (!tag || value.length >= MAX_TAGS) return;
    if (value.some((t) => t.toLowerCase() === tag.toLowerCase())) return;
    onChange([...value, tag]);
  };

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-bold tracking-widest text-gray-700 uppercase">
        {label}
      </label>
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-white p-2 focus-within:border-ilc-purple focus-within:ring-2 focus-within:ring-ilc-purple/15">
        {value.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-full bg-ilc-purple/10 py-1 pr-1 pl-3 text-xs font-semibold text-ilc-purple">
            {t}
            <button
              type="button"
              aria-label={`Remove ${t}`}
              onClick={() => onChange(value.filter((x) => x !== t))}
              className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-ilc-purple/20"
            >
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          </span>
        ))}
        <input
          id={id}
          list={`${id}-list`}
          value={text}
          maxLength={30}
          disabled={value.length >= MAX_TAGS}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              add();
            } else if (e.key === 'Backspace' && !text && value.length) onChange(value.slice(0, -1));
          }}
          onBlur={add}
          placeholder={value.length ? '' : 'Type a tag, press Enter'}
          className="min-h-8 min-w-[8rem] flex-1 bg-transparent px-1 text-sm focus:outline-none"
        />
        <datalist id={`${id}-list`}>
          {suggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </div>
      {hint && <p className="mt-1.5 text-xs text-gray-600">{hint}</p>}
    </div>
  );
}
