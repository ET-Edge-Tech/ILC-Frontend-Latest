import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, LogOut } from 'lucide-react';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import { getErrorMessage } from '../../lib/api-client.js';
import { LOGO_URL } from '../../lib/constants.js';
import { useDebounced } from '../../lib/use-debounced.js';
import { toast } from '../../store/toast-store.js';
import { useLogout, useSessionRefresh } from '../auth/hooks.js';
import FieldInput from './FieldInput.jsx';
import { buildSteps, cleanValues, prefillFrom, validateStep, visibleSteps } from './form-logic.js';
import { useDraft, useOnboardingForm, useSaveDraft, useSubmitOnboarding } from './hooks.js';

function Shell({ children }) {
  const logout = useLogout();
  return (
    <div className="flex min-h-full flex-col bg-ilc-page">
      <header className="flex h-16 shrink-0 items-center justify-between bg-ilc-sidebar px-4 lg:h-20 lg:px-10">
        <img
          src={LOGO_URL}
          alt="India Leadership Council"
          className="h-11 object-contain lg:h-14"
        />
        <button
          type="button"
          onClick={() => logout.mutate()}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-xs font-bold tracking-widest text-gray-300 uppercase hover:bg-white/10"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
        </button>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 lg:py-12">{children}</main>
    </div>
  );
}

function Wizard({ fields, draft, me }) {
  const steps = useMemo(() => buildSteps(fields), [fields]);
  // Saved answers win over what we know from the account. Answers that are no longer valid
  // options (the form may have been edited since) are dropped.
  const [initial] = useState(() =>
    cleanValues(fields, { ...prefillFrom(fields, me), ...(draft?.values ?? {}) }),
  );
  const [values, setValues] = useState(initial);
  const [stepIndex, setStepIndex] = useState(() => {
    const shown = visibleSteps(steps, initial);
    return Math.min(Math.max((draft?.completed_step ?? 1) - 1, 0), Math.max(shown.length - 1, 0));
  });
  const [errors, setErrors] = useState({});
  const topRef = useRef(null);
  const saveDraft = useSaveDraft();
  const submit = useSubmitOnboarding();

  const shown = visibleSteps(steps, values);
  const current = shown[Math.min(stepIndex, shown.length - 1)] ?? [];
  const isLast = stepIndex >= shown.length - 1;
  const percent = Math.round(((stepIndex + 1) / shown.length) * 100);

  // Autosave: shortly after the member stops typing, and always when they change step.
  const debounced = useDebounced(values, 1500);
  // Remembers what was last saved (or loaded), so opening the page alone never saves anything.
  const lastSaved = useRef(`${JSON.stringify(values)}|${stepIndex}`);
  const { mutate: save } = saveDraft;
  useEffect(() => {
    const key = `${JSON.stringify(debounced)}|${stepIndex}`;
    if (key === lastSaved.current) return;
    lastSaved.current = key;
    save({ values: debounced, completedStep: stepIndex + 1 });
  }, [debounced, stepIndex, save]);

  const setValue = (id) => (v) => {
    setValues((prev) => ({ ...prev, [String(id)]: v }));
    setErrors((prev) => {
      if (!prev[id]) return prev;
      const { [id]: _removed, ...rest } = prev;
      return rest;
    });
  };

  const scrollToTop = () => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Shows the problems and moves the focus to the first one.
  const showErrors = (found) => {
    setErrors(found);
    const firstId = Object.keys(found)[0];
    requestAnimationFrame(() => {
      const box = document.querySelector(`[data-field="${firstId}"]`);
      box?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      box?.querySelector('input, select, textarea')?.focus({ preventScroll: true });
    });
  };

  const next = () => {
    const found = validateStep(current, values);
    if (Object.keys(found).length) return showErrors(found);
    setErrors({});
    setStepIndex((i) => i + 1);
    scrollToTop();
  };

  const back = () => {
    setErrors({});
    setStepIndex((i) => Math.max(i - 1, 0));
    scrollToTop();
  };

  const finish = () => {
    // Check every step again, so a follow-up that appeared later is not missed.
    const all = {};
    shown.forEach((stepFields) => Object.assign(all, validateStep(stepFields, values)));
    if (Object.keys(all).length) {
      const badStep = shown.findIndex((stepFields) => stepFields.some((f) => all[f.id]));
      setStepIndex(badStep);
      return showErrors(
        Object.fromEntries(
          Object.entries(all).filter(([id]) => shown[badStep].some((f) => String(f.id) === id)),
        ),
      );
    }
    submit.mutate(values, {
      onSuccess: () => toast.success('Thank you! Your profile is complete.'),
    });
  };

  const savedLabel = saveDraft.isPending
    ? 'Saving…'
    : saveDraft.isError
      ? 'Could not save your progress'
      : saveDraft.isSuccess
        ? 'Progress saved'
        : '';

  return (
    <div ref={topRef} className="scroll-mt-4">
      <p className="text-xs font-bold tracking-[0.3em] text-ilc-gold-deep uppercase">
        Welcome, {me.name?.split(' ')[0]}
      </p>
      <h1 className="mt-1 font-serif text-3xl font-semibold text-ilc-purple lg:text-4xl">
        Complete your profile
      </h1>
      <p className="mt-2 text-sm text-gray-600">
        A few questions so we can look after you well. Your answers are saved as you go, so you can
        leave and come back.
      </p>

      <div className="mt-6">
        <div className="mb-1.5 flex items-center justify-between text-xs text-gray-600">
          <span className="font-semibold">
            Step {stepIndex + 1} of {shown.length}
          </span>
          <span aria-live="polite" className="text-gray-600">
            {savedLabel}
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-label="Form progress"
          className="h-1.5 overflow-hidden rounded-full bg-gray-200"
        >
          <div
            className="h-full rounded-full bg-ilc-gold transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (isLast) finish();
          else next();
        }}
        noValidate
        className="glass-card mt-6 space-y-5 rounded-2xl p-5 sm:p-8"
      >
        {current.map((field) => (
          <FieldInput
            key={field.id}
            field={field}
            value={values[String(field.id)]}
            error={errors[field.id]}
            onChange={setValue(field.id)}
          />
        ))}

        {Object.keys(errors).length > 0 && (
          <Alert>Please fix the highlighted questions to continue.</Alert>
        )}
        {submit.isError && <Alert>{getErrorMessage(submit.error)}</Alert>}

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            className="sm:w-auto"
            onClick={back}
            disabled={stepIndex === 0 || submit.isPending}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
          </Button>
          {isLast ? (
            <Button type="submit" className="sm:w-auto" loading={submit.isPending}>
              <Check className="h-4 w-4" aria-hidden="true" /> Submit
            </Button>
          ) : (
            <Button type="submit" className="sm:w-auto">
              Next <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

// Loads the questions (live from WordPress), the saved draft and the account details, then shows the wizard.
export default function OnboardingPage() {
  const form = useOnboardingForm();
  const draft = useDraft();
  const { data: me } = useSessionRefresh();

  const error = form.error || draft.error;
  const loading = form.isLoading || draft.isLoading || !me;

  return (
    <Shell>
      {error ? (
        <div className="space-y-4">
          <Alert>{getErrorMessage(error)}</Alert>
          <Button
            className="sm:w-auto"
            onClick={() => {
              form.refetch();
              draft.refetch();
            }}
          >
            Try again
          </Button>
        </div>
      ) : loading ? (
        <div className="glass-card rounded-2xl p-10 text-center text-sm text-gray-600">
          Loading your form…
        </div>
      ) : (
        <Wizard fields={form.data} draft={draft.data} me={me} />
      )}
    </Shell>
  );
}
