import { Loader2 } from 'lucide-react';

const styles = {
  primary: 'bg-ilc-purple text-white hover:bg-ilc-ink focus-visible:outline-ilc-gold',
  gold: 'bg-ilc-gold text-ilc-sidebar hover:brightness-95',
  ghost: 'bg-transparent text-ilc-purple hover:bg-ilc-purple/5',
  danger: 'bg-red-700 text-white hover:bg-red-800',
};

export default function Button({ variant = 'primary', loading = false, disabled, children, className = '', ...rest }) {
  // Full width unless the caller asks for w-auto (a plain "w-auto" would lose to "w-full" in the stylesheet).
  const width = /(^|\s)w-auto(\s|$)/.test(className) ? '' : 'w-full';
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex min-h-11 ${width} items-center justify-center gap-2 rounded-lg px-5 text-xs font-bold tracking-widest whitespace-nowrap uppercase transition disabled:cursor-not-allowed disabled:opacity-60 ${styles[variant]} ${className}`}
      {...rest}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}
