import { AlertTriangle, Bell, CheckCircle2, Clock } from 'lucide-react';
import { RISK } from './risk.js';

const RISK_ICON = { Green: CheckCircle2, Amber: Clock, Red: AlertTriangle };

// A small coloured dot. Always paired with words nearby, and the words are also read out for screen readers.
export function RiskDot({ risk, className = '' }) {
  return (
    <span
      role="img"
      aria-label={RISK[risk].label}
      className={`inline-block h-3 w-3 shrink-0 rounded-full ${RISK[risk].dot} ${className}`}
    />
  );
}

// The member's health as a pill with an icon and words, so colour is never the only clue.
export function HealthPill({ risk, className = '' }) {
  const r = RISK[risk];
  const Icon = RISK_ICON[risk];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap ${r.soft} ${r.text} ${className}`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {r.label}
    </span>
  );
}

// How serious one alert is.
const TIER = {
  0: { label: 'Routine', cls: 'bg-gray-100 text-gray-700' },
  1: { label: 'Check-in', cls: 'bg-[#B9832E]/15 text-[#9A6A1E]' },
  2: { label: 'Urgent', cls: 'bg-[#A8483B]/15 text-[#A8483B]' },
  3: { label: 'Critical', cls: 'bg-[#A8483B] text-white' },
};

export function TierBadge({ tier }) {
  const t = TIER[tier] ?? TIER[0];
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide whitespace-nowrap ${t.cls}`}
    >
      {t.label}
    </span>
  );
}

const tone = (tier) => (tier >= 2 ? RISK.Red : tier === 1 ? RISK.Amber : RISK.Green);

// One alert as a card. `action` is an optional button (Resolve).
export function SignalCard({ signal, onOpen, action }) {
  const t = tone(signal.tier);
  return (
    <div className="glass-card flex items-start gap-3 rounded-2xl p-4">
      <span
        aria-hidden="true"
        className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${t.soft} ${t.text}`}
      >
        <Bell className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {onOpen ? (
            <button
              type="button"
              onClick={() => onOpen(signal.member_id)}
              className="text-base font-bold text-ilc-purple hover:underline"
            >
              {signal.member_name}
            </button>
          ) : (
            <span className="text-base font-bold text-ilc-purple">{signal.member_name}</span>
          )}
          <TierBadge tier={signal.tier} />
        </div>
        <p className="mt-0.5 text-sm font-medium text-ilc-ink">{signal.message}</p>
        <p className="text-xs text-gray-600">{signal.meta}</p>
      </div>
      {action}
    </div>
  );
}
