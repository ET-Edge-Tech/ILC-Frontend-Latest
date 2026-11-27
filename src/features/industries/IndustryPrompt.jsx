import { useState } from 'react';
import { Briefcase } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import { useSessionRefresh } from '../auth/hooks.js';
import { useUpdateProfile } from '../profile/hooks.js';
import IndustrySelect from './IndustrySelect.jsx';

const key = (id) => `ilc-industry-prompt:${id}`;
const wasDismissed = (id) => {
  try {
    return localStorage.getItem(key(id)) === '1';
  } catch {
    return false;
  }
};

// One-time prompt on the member's Overview until they choose an industry. It sorts the Council and the news for them.
// "Not now" hides it (it never comes back); the industry can always be set later in Profile.
export default function IndustryPrompt() {
  const { data: me } = useSessionRefresh();
  const update = useUpdateProfile();
  const [choice, setChoice] = useState('');
  const [hidden, setHidden] = useState(false);

  if (!me || me.role !== 'CEO' || me.industry_id || hidden || wasDismissed(me.id)) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(key(me.id), '1');
    } catch {
      /* the prompt just shows again next time */
    }
    setHidden(true);
  };

  return (
    <section className="glass-card rounded-2xl border border-ilc-gold/40 p-5" aria-label="Choose your industry">
      <div className="flex items-start gap-3">
        <Briefcase className="mt-0.5 h-6 w-6 shrink-0 text-ilc-gold-deep" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h3 className="font-serif text-xl font-bold text-ilc-purple">Which industry are you in?</h3>
          <p className="mt-0.5 text-sm text-gray-700">We will show members from your industry first in The Council.</p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
            <IndustrySelect className="sm:w-72" label="Industry" value={choice} onChange={setChoice} />
            <div className="flex gap-2">
              <Button
                className="sm:w-auto"
                loading={update.isPending}
                disabled={!choice}
                onClick={() => update.mutate({ industry_id: choice })}
              >
                Save
              </Button>
              <Button variant="ghost" className="sm:w-auto" onClick={dismiss}>
                Not now
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
