// An on/off switch that screen readers announce as "switch, on/off".
export default function Switch({ checked, onChange, label, disabled = false, id }) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border-2 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ilc-gold disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? 'border-ilc-purple bg-ilc-purple' : 'border-gray-400 bg-gray-300'
      }`}
    >
      <span
        aria-hidden="true"
        className={`inline-block h-5 w-5 rounded-full bg-white shadow transition ${checked ? 'translate-x-[1.35rem]' : 'translate-x-0.5'}`}
      />
    </button>
  );
}
