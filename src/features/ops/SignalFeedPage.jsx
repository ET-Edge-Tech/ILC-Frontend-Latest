import { Check } from 'lucide-react';
import Alert from '../../components/ui/Alert.jsx';
import { getErrorMessage } from '../../lib/api-client.js';
import { useOpenMember, useOpsSignals } from './hooks.js';
import { SignalCard } from './parts.jsx';
import SpocTabs from './SpocTabs.jsx';

// Everything that needs a human, worst first. Nobody has to remember to look: the rules do.
export default function SignalFeedPage() {
  const { data: signals = [], isLoading, isError, error } = useOpsSignals();
  const openMember = useOpenMember();

  return (
    <div className="w-full space-y-4">
      <SpocTabs group="day" />
      <p className="text-base font-semibold text-ilc-ink" aria-live="polite">
        {isLoading ? 'Loading…' : `${signals.length} open alert${signals.length === 1 ? '' : 's'}`}
      </p>
      {isError && <Alert>{getErrorMessage(error)}</Alert>}

      {!isLoading && !isError && signals.length === 0 && (
        <div className="glass-card rounded-2xl p-10 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#4A7A5D]/10 text-[#4A7A5D]">
            <Check className="h-6 w-6" aria-hidden="true" />
          </span>
          <p className="mt-3 font-serif font-bold text-xl text-ilc-purple">All clear</p>
          <p className="mt-1 text-sm text-gray-500">
            Nobody needs a call right now. New alerts appear here on their own.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {signals.map((s) => (
          <SignalCard key={`${s.member_id}-${s.code}`} signal={s} onOpen={openMember} />
        ))}
      </div>
    </div>
  );
}
