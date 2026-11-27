import { useState } from 'react';
import Button from '../../components/ui/Button.jsx';
import { useSetMembership } from './hooks.js';

const field =
  'min-h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm focus:border-ilc-purple focus:ring-2 focus:ring-ilc-purple/15 focus:outline-none';

// A SPOC sets the membership dates of their own member. (An Admin does this on the Members page.)
export default function MembershipDates({ id, start, end }) {
  const save = useSetMembership(id);
  const [s, setS] = useState(start ?? '');
  const [e, setE] = useState(end ?? '');
  const orderError = s && e && e < s ? 'The end date must be on or after the start date' : undefined;
  const changed = s !== (start ?? '') || e !== (end ?? '');

  return (
    <form
      onSubmit={(ev) => {
        ev.preventDefault();
        if (!orderError && changed) save.mutate({ membership_start: s, membership_end: e });
      }}
      className="space-y-3 rounded-xl border border-gray-100 bg-white p-3"
      noValidate
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="m-start"
            className="mb-1.5 block text-[10px] font-bold tracking-widest text-gray-500 uppercase"
          >
            Start
          </label>
          <input id="m-start" type="date" value={s} onChange={(ev) => setS(ev.target.value)} className={field} />
        </div>
        <div>
          <label
            htmlFor="m-end"
            className="mb-1.5 block text-[10px] font-bold tracking-widest text-gray-500 uppercase"
          >
            End
          </label>
          <input id="m-end" type="date" value={e} onChange={(ev) => setE(ev.target.value)} className={field} />
        </div>
      </div>
      {orderError && <p className="text-xs text-red-600">{orderError}</p>}
      <Button
        type="submit"
        className="sm:w-auto"
        loading={save.isPending}
        disabled={!changed || Boolean(orderError)}
      >
        Save dates
      </Button>
    </form>
  );
}
