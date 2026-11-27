import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

const tones = {
  error: { box: 'border-red-200 bg-red-50 text-red-700', Icon: AlertCircle },
  success: { box: 'border-emerald-200 bg-emerald-50 text-emerald-700', Icon: CheckCircle2 },
  warning: { box: 'border-amber-200 bg-amber-50 text-amber-800', Icon: Info },
};

export default function Alert({ tone = 'error', children, className = '' }) {
  if (!children) return null;
  const { box, Icon } = tones[tone];
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`flex gap-2.5 rounded-lg border p-3 text-sm ${box} ${className}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
