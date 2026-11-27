// Pure helpers for the onboarding form. The backend re-checks everything: these only make the form pleasant.

const asList = (v) => (Array.isArray(v) ? v : v === undefined || v === null || v === '' ? [] : [v]);

function ruleMatches(rule, values) {
  const answers = asList(values[String(rule.fieldId)]).map(String);
  const target = String(rule.value ?? '');
  switch (rule.operator) {
    case 'is':
      return answers.includes(target);
    case 'isnot':
      return !answers.includes(target);
    case 'contains':
      return answers.some((a) => a.includes(target));
    case 'starts_with':
      return answers.some((a) => a.startsWith(target));
    case 'ends_with':
      return answers.some((a) => a.endsWith(target));
    case '>':
      return answers.some((a) => Number(a) > Number(target));
    case '<':
      return answers.some((a) => Number(a) < Number(target));
    default:
      return false;
  }
}

// "Show this field only if ..." rules come from the live Gravity Forms definition.
export function isApplicable(field, values) {
  const logic = field.conditionalLogic;
  if (!logic || !logic.rules?.length) return true;
  const results = logic.rules.map((r) => ruleMatches(r, values));
  const met = logic.logicType === 'any' ? results.some(Boolean) : results.every(Boolean);
  return logic.actionType === 'hide' ? !met : met;
}

const STEP_SIZE = 6;

// Splits the questions into steps. The form has no page breaks, so we group them by count.
// A follow-up question (one with conditional logic) always stays on the same step as the
// question before it, and a section heading starts the step it introduces.
export function buildSteps(fields) {
  const steps = [];
  let current = [];
  let count = 0;
  fields.forEach((field) => {
    const startsNewStep = count >= STEP_SIZE && !field.conditionalLogic && field.type !== 'section';
    const headingNextToFull = field.type === 'section' && count >= STEP_SIZE;
    if ((startsNewStep || headingNextToFull) && current.length) {
      steps.push(current);
      current = [];
      count = 0;
    }
    current.push(field);
    if (field.type !== 'section') count += 1;
  });
  if (current.length) steps.push(current);
  return steps;
}

// The steps as the member sees them right now: hidden follow-ups removed, empty steps skipped.
export function visibleSteps(steps, values) {
  return steps
    .map((fields) => fields.filter((f) => isApplicable(f, values)))
    .filter((fields) => fields.some((f) => f.type !== 'section'));
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^[0-9+\-().\s]{5,25}$/;

export const isEmpty = (v) =>
  v === undefined || v === null || (Array.isArray(v) ? v.length === 0 : String(v).trim() === '');

// Returns { [fieldId]: "message" } for the fields on one step.
export function validateStep(stepFields, values) {
  const errors = {};
  stepFields.forEach((f) => {
    if (f.type === 'section') return;
    const v = values[String(f.id)];
    if (isEmpty(v)) {
      if (f.isRequired)
        errors[f.id] =
          f.type === 'checkbox' ? 'Please choose at least one option' : 'This field is required';
      return;
    }
    if (f.type === 'email' && !EMAIL.test(String(v).trim()))
      errors[f.id] = 'Enter a valid email address';
    if (f.type === 'phone' && !PHONE.test(String(v).trim()))
      errors[f.id] = 'Enter a valid phone number';
  });
  return errors;
}

// Fills the questions we already know from the member's account. Matches by label so a staff
// edit to the form never breaks it.
export function prefillFrom(fields, me) {
  const byLabel = {
    'full name': me.name,
    name: me.name,
    email: me.email,
    'email address': me.email,
    phone: me.phone,
    'phone number': me.phone,
    organisation: me.organisation,
    organization: me.organisation,
    designation: me.title,
    title: me.title,
  };
  const values = {};
  fields.forEach((f) => {
    const known = byLabel[String(f.label).trim().toLowerCase()];
    if (known && ['text', 'email', 'phone'].includes(f.type)) values[String(f.id)] = known;
  });
  return values;
}

const ENTITIES = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&nbsp;': ' ',
};
const decode = (s) => s.replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (m) => ENTITIES[m]);

// Gravity Forms text can contain HTML. We show plain text only.
export const plainText = (html) => decode(String(html ?? '').replace(/<[^>]*>/g, '')).trim();

// Like plainText, but keeps safe links: returns [{ text }, { text, href }, ...].
// Only https: and mailto: links are kept. Every other tag is dropped, so nothing from the
// form can run as code on our pages.
export function parseRichText(html) {
  const source = String(html ?? '');
  const parts = [];
  const link = /<a\s[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let last = 0;
  let m;
  const pushText = (chunk) => {
    const text = decode(chunk.replace(/<[^>]*>/g, ''));
    if (text) parts.push({ text });
  };
  while ((m = link.exec(source)) !== null) {
    pushText(source.slice(last, m.index));
    const href = decode(m[1]).trim();
    const text = decode(m[2].replace(/<[^>]*>/g, ''));
    if (/^(https:\/\/|mailto:)/i.test(href)) parts.push({ text, href });
    else if (text) parts.push({ text });
    last = m.index + m[0].length;
  }
  pushText(source.slice(last));
  return parts;
}

// Removes saved answers that are no longer valid options (staff may have edited the form since the
// draft was saved), so an old answer can never block the member from submitting.
export function cleanValues(fields, values) {
  const cleaned = { ...values };
  fields.forEach((f) => {
    const key = String(f.id);
    if (!(key in cleaned) || !['select', 'radio', 'checkbox'].includes(f.type)) return;
    const allowed = new Set((f.choices ?? []).map((c) => c.value));
    const v = cleaned[key];
    if (Array.isArray(v)) {
      const kept = v.filter((x) => allowed.has(x));
      if (kept.length) cleaned[key] = kept;
      else delete cleaned[key];
    } else if (!allowed.has(v)) {
      delete cleaned[key];
    }
  });
  return cleaned;
}
