import { useState } from 'react';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import { getErrorMessage } from '../../lib/api-client.js';
import { useOpsSettings, useResetOpsSettings, useSaveOpsSettings } from './hooks.js';
import BenefitsSettings from './BenefitsSettings.jsx';

// ---- turning the saved numbers into form text and back ---------------------------------------------------------

const toForm = (r) => ({
  silence_amber_days: String(r.silence_amber_days),
  silence_red_days: String(r.silence_red_days),
  noshow_count: String(r.noshow_count),
  renewal_amber_day: String(r.renewal_amber_day),
  renewal_red_day: String(r.renewal_red_day),
  renewal_critical_day: String(r.renewal_critical_day),
  media_day: String(r.media_day),
  checkpoint_days: Object.fromEntries(Object.entries(r.checkpoint_days).map(([k, v]) => [k, String(v)])),
  membership_reminder_days: r.membership_reminder_days.join(', '),
  job_times: { ...r.job_times },
});

const whole = (s) => (/^\d+$/.test(String(s).trim()) ? Number(s) : NaN);

// Checks the form the same way the server does, so mistakes show next to the field. The server checks again.
function validate(f) {
  const e = {};
  const num = (key, max) => {
    const n = whole(f[key]);
    if (Number.isNaN(n)) e[key] = 'Enter a whole number';
    else if (n < 1) e[key] = 'Must be at least 1';
    else if (n > max) e[key] = `Must be ${max} or less`;
    return n;
  };
  const sa = num('silence_amber_days', 365);
  const sr = num('silence_red_days', 365);
  num('noshow_count', 20);
  const ra = num('renewal_amber_day', 730);
  const rr = num('renewal_red_day', 730);
  const rc = num('renewal_critical_day', 730);
  num('media_day', 730);
  if (!e.silence_red_days && sa >= sr) e.silence_red_days = 'Must be more than the "Needs a check-in" days';
  if (!e.renewal_red_day && ra >= rr) e.renewal_red_day = 'Must come after the "Needs a check-in" day';
  if (!e.renewal_critical_day && rr >= rc) e.renewal_critical_day = 'Must come after the "Needs attention now" day';
  for (const [k, v] of Object.entries(f.checkpoint_days)) {
    const n = whole(v);
    if (Number.isNaN(n) || n < 1 || n > 730) e[`cp_${k}`] = 'Enter a whole number from 1 to 730';
  }
  const list = f.membership_reminder_days.split(',').map((x) => x.trim()).filter(Boolean);
  const nums = list.map(whole);
  if (nums.length === 0) e.membership_reminder_days = 'Add at least one day';
  else if (nums.length > 4) e.membership_reminder_days = 'At most 4 days';
  else if (nums.some((n) => Number.isNaN(n) || n < 1 || n > 365)) e.membership_reminder_days = 'Use whole numbers from 1 to 365, separated by commas';
  else if (new Set(nums).size !== nums.length) e.membership_reminder_days = 'Each day can only be listed once';
  for (const [k, v] of Object.entries(f.job_times)) if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(v)) e[`time_${k}`] = 'Choose a time';
  return e;
}

const toRules = (f) => ({
  silence_amber_days: Number(f.silence_amber_days),
  silence_red_days: Number(f.silence_red_days),
  noshow_count: Number(f.noshow_count),
  renewal_amber_day: Number(f.renewal_amber_day),
  renewal_red_day: Number(f.renewal_red_day),
  renewal_critical_day: Number(f.renewal_critical_day),
  media_day: Number(f.media_day),
  checkpoint_days: Object.fromEntries(Object.entries(f.checkpoint_days).map(([k, v]) => [k, Number(v)])),
  membership_reminder_days: f.membership_reminder_days.split(',').map((x) => Number(x.trim())).filter((n) => !Number.isNaN(n)),
  job_times: f.job_times,
});

// ---- small pieces -------------------------------------------------------------------------------------------------

const input =
  'min-h-11 w-full rounded-lg border bg-white px-3 text-sm focus:border-ilc-purple focus:ring-2 focus:ring-ilc-purple/15 focus:outline-none';

function Card({ title, intro, children }) {
  return (
    <section className="glass-card rounded-2xl p-5 sm:p-6">
      <h3 className="text-[10px] font-bold tracking-[0.25em] text-ilc-gold-deep uppercase">{title}</h3>
      {intro && <p className="mt-1 mb-4 text-sm text-gray-500">{intro}</p>}
      <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${intro ? '' : 'mt-4'}`}>{children}</div>
    </section>
  );
}

function Field({ id, label, hint, standard, value, onChange, error, type = 'text', inputMode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[10px] font-bold tracking-widest text-gray-500 uppercase">
        {label}
      </label>
      <input
        id={id}
        type={type}
        inputMode={inputMode ?? (type === 'text' ? 'numeric' : undefined)}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={`${id}-note`}
        className={`${input} ${error ? 'border-red-400' : 'border-gray-200'}`}
      />
      <p id={`${id}-note`} className={`mt-1 text-xs ${error ? 'text-red-600' : 'text-gray-400'}`}>
        {error || hint}
        {!error && standard !== undefined && <span> Standard: {standard}.</span>}
      </p>
    </div>
  );
}

const CHECKPOINT_LABELS = {
  wishlist: 'Wishlist conversation (month 1)',
  intro: 'First introduction (month 2)',
  midyear: 'Mid-year check-in (month 6)',
  book: 'Coffee Table Book entry (month 8)',
  anniversary: 'Anniversary acknowledged (month 12)',
};
const JOB_LABELS = {
  event_reminders: ['Event reminder emails', 'Sent to everyone confirmed for an event tomorrow.'],
  spoc_digest: ['SPOC daily bell notice', 'One notice for each relationship manager with open signals.'],
  membership_reminders: ['Membership reminder emails', 'Sent to members whose membership is ending soon.'],
};

function SettingsForm({ saved, defaults }) {
  const save = useSaveOpsSettings();
  const reset = useResetOpsSettings();
  const [form, setForm] = useState(() => toForm(saved));
  const [confirmReset, setConfirmReset] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const errors = validate(form);
  const shown = showErrors ? errors : {};
  const changed = JSON.stringify(toForm(saved)) !== JSON.stringify(form);
  const d = defaults;
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const setIn = (group, key) => (value) => setForm((f) => ({ ...f, [group]: { ...f[group], [key]: value } }));

  const submit = (e) => {
    e.preventDefault();
    setShowErrors(true);
    if (Object.keys(errors).length) return;
    save.mutate(toRules(form), { onSuccess: () => setShowErrors(false) });
  };

  const num = (key, label, hint) => (
    <Field id={`f-${key}`} label={label} hint={hint} standard={d[key]} value={form[key]} onChange={set(key)} error={shown[key]} />
  );

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      {save.isError && <Alert>{getErrorMessage(save.error)}</Alert>}

      <Card title="No contact" intro={'A member with no contact for too long turns to "Needs a check-in", then "Needs attention now".'}>
        {num('silence_amber_days', 'Needs a check-in after (days)', 'More than this many days without contact.')}
        {num('silence_red_days', 'Needs attention now after (days)', 'Must be more than the check-in days.')}
      </Card>

      <Card title="Sessions missed" intro="Raises a missed-sessions alert for the member.">
        {num('noshow_count', 'Missed in a row', 'Sessions missed one after another.')}
      </Card>

      <Card title="Renewal" intro="Days counted from the day the member joined. The alert only shows while no renewal conversation has started.">
        {num('renewal_amber_day', 'Check-in window opens (day)', 'Start the renewal conversation.')}
        {num('renewal_red_day', 'Overdue, needs attention (day)', 'Must come after the check-in day.')}
        {num('renewal_critical_day', 'At risk, critical (day)', 'Must come after the overdue day.')}
      </Card>

      <Card title="Video and article" intro="Both should be published by this day, counted from joining.">
        {num('media_day', 'Overdue from (day)', 'Shows an alert for each one not yet published.')}
      </Card>

      <Card title="Journey checkpoints" intro="The day each checkpoint turns overdue, counted from joining.">
        {Object.entries(CHECKPOINT_LABELS).map(([k, label]) => (
          <Field
            key={k}
            id={`f-cp-${k}`}
            label={label}
            standard={d.checkpoint_days[k]}
            value={form.checkpoint_days[k]}
            onChange={setIn('checkpoint_days', k)}
            error={shown[`cp_${k}`]}
          />
        ))}
      </Card>

      <Card title="Membership reminder emails" intro="How many days before a membership ends the member gets an email.">
        <Field
          id="f-reminders"
          label="Days before the end date"
          hint="Up to 4 days, separated by commas."
          standard={d.membership_reminder_days.join(', ')}
          value={form.membership_reminder_days}
          onChange={set('membership_reminder_days')}
          error={shown.membership_reminder_days}
          inputMode="text"
        />
      </Card>

      <Card title="Daily jobs" intro="The time each job runs every day, in India time.">
        {Object.entries(JOB_LABELS).map(([k, [label, hint]]) => (
          <Field
            key={k}
            id={`f-time-${k}`}
            label={label}
            hint={hint}
            standard={d.job_times[k]}
            type="time"
            value={form.job_times[k]}
            onChange={setIn('job_times', k)}
            error={shown[`time_${k}`]}
          />
        ))}
      </Card>

      <div className="sticky bottom-0 -mx-1 flex flex-col-reverse gap-2 border-t border-gray-100 bg-ilc-page/95 p-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <Button type="button" variant="ghost" className="sm:w-auto" onClick={() => setConfirmReset(true)} disabled={reset.isPending}>
          Reset to standard
        </Button>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500" aria-live="polite">
            {changed ? 'Unsaved changes' : 'No changes'}
          </span>
          <Button type="submit" className="sm:w-auto" loading={save.isPending} disabled={!changed}>
            Save settings
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmReset}
        danger
        title="Reset to the standard settings?"
        confirmLabel="Reset"
        loading={reset.isPending}
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => reset.mutate(undefined, { onSettled: () => setConfirmReset(false) })}
      >
        Every number and time on this page goes back to the standard value. Alerts are recalculated straight away.
      </ConfirmDialog>
    </form>
  );
}

// Admin only. The numbers behind the signals, the reminder days and the times of the daily jobs.
export default function OpsSettingsPage() {
  const { data, isLoading, isError, error } = useOpsSettings();

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <p className="text-sm text-gray-500">
        These numbers decide when a member needs a check-in or attention now, and when reminders go out. Changes apply from now on
        and are recorded in the audit log.
        {data && (
          <b className="ml-1 text-ilc-ink">{data.is_default ? 'Using the standard settings.' : 'Using your own settings.'}</b>
        )}
      </p>
      {isError && <Alert>{getErrorMessage(error)}</Alert>}
      {isLoading && (
        <div className="glass-card rounded-2xl p-10 text-center text-sm text-gray-400">Loading settings…</div>
      )}
      {/* Remount when the saved settings change, so the form always shows what is stored. */}
      {data && <SettingsForm key={JSON.stringify(data.rules)} saved={data.rules} defaults={data.defaults} />}
      <BenefitsSettings />
    </div>
  );
}
