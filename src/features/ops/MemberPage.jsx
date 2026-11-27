import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Mail, Phone } from 'lucide-react';
import WhatsAppIcon from '../../components/ui/WhatsAppIcon.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import Button from '../../components/ui/Button.jsx';
import SelectField from '../../components/ui/SelectField.jsx';
import { getErrorMessage } from '../../lib/api-client.js';
import { formatDate } from '../../lib/format.js';
import { telLink, whatsappLink } from '../../lib/phone.js';
import { useAuthStore } from '../../store/auth-store.js';
import IndustrySelect from '../industries/IndustrySelect.jsx';
import ContactLogBar from './ContactLogBar.jsx';
import MemberInterests from './MemberInterests.jsx';
import MemberNotes from './MemberNotes.jsx';
import MemberReminders from './MemberReminders.jsx';
import MembershipDates from './MembershipDates.jsx';
import BenefitsTab from './BenefitsTab.jsx';
import ProfileFormTab from './ProfileFormTab.jsx';
import TimelineTab from './TimelineTab.jsx';
import {
  useLogTouchpoint,
  useOpsMember,
  useRecordAttendance,
  useResolveSignal,
  useUpdateTracker,
} from './hooks.js';
import { HealthPill, SignalCard } from './parts.jsx';
import { RISK } from './risk.js';

const TIERS = ['Metro Full', 'Tier 2', 'Limited Access'];
const MEDIA = ['Not Started', 'Scheduled', 'In Production', 'Published'];
const RENEWAL = ['Not Started', 'In Conversation', 'Confirmed', 'Declined'];
const options = (list) => list.map((v) => ({ value: v, label: v }));

const CHECKS = [
  ['wishlist_captured', 'Wishlist and aspiration conversation done (month 1)'],
  ['first_intro_made', 'First introduction made (month 2)'],
  ['mid_year_checkin_done', 'Mid-year check-in done (month 6)'],
  ['book_entry_submitted', 'Coffee Table Book entry submitted (month 8)'],
  ['anniversary_acknowledged', 'Anniversary acknowledged (month 12)'],
];

function Card({ title, hint, children }) {
  return (
    <section className="glass-card space-y-4 rounded-2xl p-5 sm:p-6">
      <div>
        <h3 className="text-lg font-bold text-ilc-ink">{title}</h3>
        {hint && <p className="mt-0.5 text-sm text-gray-600">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function Fact({ label, value, note }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-xs font-bold tracking-wide text-gray-600 uppercase">{label}</p>
      <p className="mt-1 text-base font-bold text-ilc-ink">{value}</p>
      {note && <p className="text-xs text-gray-600">{note}</p>}
    </div>
  );
}

const contactBtn =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-bold whitespace-nowrap text-ilc-purple hover:bg-ilc-purple/5';

function OverviewTab({ data, id, busy, save, touch }) {
  const { member: m, signals } = data;
  const resolve = useResolveSignal(id);
  const [city, setCity] = useState(m.city ?? '');
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Fact label="Joined" value={formatDate(m.join_date)} />
        <Fact
          label="Renewal date"
          value={formatDate(m.renewal_date)}
          note={
            m.days_to_renewal >= 0
              ? `${m.days_to_renewal} days away`
              : `${-m.days_to_renewal} days ago`
          }
        />
        <Fact label="Last contact" value={formatDate(m.last_touchpoint_date)} />
      </div>

      <Card title={`Alerts (${signals.length})`} hint="Things that need a person to act.">
        {signals.length === 0 ? (
          <p className="text-sm font-medium text-gray-700">
            Nothing needs doing for this member right now.
          </p>
        ) : (
          <div className="space-y-3">
            {signals.map((s) => (
              <SignalCard
                key={s.code}
                signal={{ ...s, member_name: m.name }}
                action={
                  <button
                    type="button"
                    disabled={busy || resolve.isPending}
                    onClick={() => resolve.mutate(s.code)}
                    className="shrink-0 rounded-lg border border-gray-300 px-3 py-2 text-sm font-bold text-ilc-purple hover:bg-ilc-purple/5 disabled:opacity-50"
                  >
                    Mark done
                  </button>
                }
              />
            ))}
          </div>
        )}
      </Card>

      <Card
        title="Contact log"
        hint="Press the button each time you have been in touch, so the alerts stay accurate."
      >
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4">
          <div>
            <p className="text-xs font-bold tracking-wide text-gray-600 uppercase">Last contact</p>
            <p className="mt-1 text-base font-bold text-ilc-ink">
              {formatDate(m.last_touchpoint_date)}
            </p>
          </div>
          <Button
            className="sm:w-auto"
            onClick={() => touch.mutate()}
            loading={touch.isPending}
            disabled={busy}
          >
            I was in touch today
          </Button>
        </div>
      </Card>

      <Card title="About">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField
            label="Tier"
            value={m.tier}
            onChange={(e) => save({ tier: e.target.value })}
            options={options(TIERS)}
            disabled={busy}
          />
          <IndustrySelect value={m.industry?.id ?? ''} onChange={(v) => save({ industry_id: v || null })} disabled={busy} />
          <div>
            <label
              htmlFor="ops-city"
              className="mb-1.5 block text-xs font-bold tracking-wide text-gray-700 uppercase"
            >
              City
            </label>
            <input
              id="ops-city"
              value={city}
              maxLength={100}
              onChange={(e) => setCity(e.target.value)}
              onBlur={() => city.trim() !== (m.city ?? '') && save({ city })}
              className="min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3.5 text-sm font-medium focus:border-ilc-purple focus:ring-2 focus:ring-ilc-purple/15 focus:outline-none"
            />
          </div>
        </div>
      </Card>
    </div>
  );
}

function ProgressTab({ data, id, busy, save, isSpoc }) {
  const { member: m, journey, tracker: t } = data;
  const attendance = useRecordAttendance(id);
  return (
    <div className="space-y-5">
      <Card title="Session attendance" hint="Sessions missed one after another raise an alert.">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4">
          <div>
            <p className="text-xs font-bold tracking-wide text-gray-600 uppercase">
              Missed in a row
            </p>
            <p className="mt-1 text-2xl font-bold text-ilc-ink">{t.consecutive_missed}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              className="border border-gray-300 sm:w-auto"
              disabled={busy || attendance.isPending}
              onClick={() => attendance.mutate('attended')}
            >
              Attended
            </Button>
            <Button
              variant="ghost"
              className="border border-gray-300 text-[#A8483B] sm:w-auto"
              disabled={busy || attendance.isPending}
              onClick={() => attendance.mutate('missed')}
            >
              Missed
            </Button>
          </div>
        </div>
      </Card>

      <Card
        title="What the member is owed"
        hint="Track each benefit from not started to published."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SelectField
            label="Video interview"
            value={t.video_status}
            onChange={(e) => save({ video_status: e.target.value })}
            options={options(MEDIA)}
            disabled={busy}
          />
          <SelectField
            label="Authored article"
            value={t.article_status}
            onChange={(e) => save({ article_status: e.target.value })}
            options={options(MEDIA)}
            disabled={busy}
          />
          <SelectField
            label="Coffee table book"
            value={t.book_status}
            onChange={(e) => save({ book_status: e.target.value })}
            options={options(MEDIA)}
            disabled={busy}
          />
        </div>
      </Card>

      <Card title="Renewal">
        <SelectField
          label="Where it stands"
          value={t.renewal_status}
          onChange={(e) => save({ renewal_status: e.target.value })}
          options={options(RENEWAL)}
          disabled={busy}
        />
      </Card>

      <Card title="Year plan" hint={`Month ${m.journey_month} of 12: ${journey.title}`}>
        <div className="space-y-2">
          {CHECKS.map(([key, label]) => (
            <label
              key={key}
              className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm font-medium text-ilc-ink"
            >
              <input
                type="checkbox"
                checked={t[key]}
                disabled={busy}
                onChange={(e) => save({ [key]: e.target.checked })}
                className="mt-0.5 h-4 w-4 shrink-0 accent-ilc-purple"
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </Card>

      {isSpoc && (
        <Card title="Membership dates">
          <MembershipDates
            key={`${m.membership_start}-${m.membership_end}`}
            id={id}
            start={m.membership_start}
            end={m.membership_end}
          />
        </Card>
      )}
    </div>
  );
}

// One member, as a full page: who they are, what needs doing, and everything you know about them.
export default function MemberPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isSpoc = useAuthStore((s) => s.user.role) === 'SPOC';
  const listPath = isSpoc ? '/spoc/members' : '/admin/ops/members';
  const { data, isLoading, isError, error } = useOpsMember(id);
  const update = useUpdateTracker(id);
  const touch = useLogTouchpoint(id);
  const [tab, setTab] = useState('overview');
  const [contacted, setContacted] = useState(null); // 'Call' | 'WhatsApp' | 'Email' just pressed: offer to log it
  const busy = update.isPending || touch.isPending;
  const save = (patch) => update.mutate(patch);

  const m = data?.member;
  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'timeline', label: 'Timeline' },
    { key: 'benefits', label: 'Benefits' },
    { key: 'form', label: 'Profile form' },
    { key: 'notes', label: `Notes${data ? ` (${data.notes.length})` : ''}` },
    { key: 'interests', label: 'Interests' },
    {
      key: 'reminders',
      label: `Reminders${data && !isSpoc ? ` (${(data.reminders ?? []).length})` : ''}`,
    },
    { key: 'progress', label: 'Progress' },
  ];

  return (
    <div className="w-full space-y-5">
      <button
        type="button"
        onClick={() => (window.history.length > 1 ? navigate(-1) : navigate(listPath))}
        className="inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-ilc-purple hover:underline"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
      </button>

      {isLoading && (
        <div className="glass-card rounded-2xl p-10 text-center text-sm font-medium text-gray-600">
          Loading…
        </div>
      )}
      {isError && (
        <>
          <Alert>{getErrorMessage(error)}</Alert>
          <Link to={listPath} className="text-sm font-bold text-ilc-purple hover:underline">
            Go to the member list
          </Link>
        </>
      )}

      {data && (
        <>
          <header className="glass-card rounded-2xl p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Avatar name={m.name} initials={m.initials} src={m.photo_url} size="lg" />
              <div className="min-w-0 flex-1">
                <h2 className="font-serif text-3xl font-semibold text-ilc-purple">{m.name}</h2>
                <p className="mt-0.5 text-sm font-medium text-gray-700">
                  {[m.title, m.organisation, m.city, m.tier].filter(Boolean).join(' · ')}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <HealthPill risk={m.risk} />
                  <span className="text-sm text-gray-600">{RISK[m.risk].hint}</span>
                </div>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {m.email && (
                <a href={`mailto:${m.email}`} className={contactBtn} onClick={() => setContacted('Email')}>
                  <Mail className="h-4 w-4" aria-hidden="true" /> Email
                </a>
              )}
              {m.phone && (
                <>
                  <a href={telLink(m.phone)} className={contactBtn} onClick={() => setContacted('Call')}>
                    <Phone className="h-4 w-4" aria-hidden="true" /> Call
                  </a>
                  <a
                    href={whatsappLink(m.phone)}
                    target="_blank"
                    rel="noreferrer"
                    className={contactBtn}
                    onClick={() => setContacted('WhatsApp')}
                  >
                    <WhatsAppIcon /> WhatsApp
                  </a>
                </>
              )}
            </div>
            {contacted && <ContactLogBar key={contacted} id={id} channel={contacted} onClose={() => setContacted(null)} />}
          </header>

          <div
            role="tablist"
            aria-label="Member sections"
            className="flex gap-1 overflow-x-auto rounded-xl bg-white/70 p-1"
          >
            {tabs.map((tb) => (
              <button
                key={tb.key}
                type="button"
                role="tab"
                aria-selected={tab === tb.key}
                onClick={() => setTab(tb.key)}
                className={`min-h-11 flex-1 rounded-lg px-4 text-sm font-bold whitespace-nowrap transition ${
                  tab === tb.key
                    ? 'bg-ilc-purple text-white shadow'
                    : 'text-gray-700 hover:bg-ilc-purple/5'
                }`}
              >
                {tb.label}
              </button>
            ))}
          </div>

          <div role="tabpanel" aria-busy={busy}>
            {tab === 'overview' && (
              <OverviewTab data={data} id={id} busy={busy} save={save} touch={touch} />
            )}
            {tab === 'timeline' && <TimelineTab id={id} />}
            {tab === 'benefits' && <BenefitsTab id={id} />}
            {tab === 'form' && <ProfileFormTab id={id} />}
            {tab === 'notes' && (
              <Card
                title="Notes"
                hint="Private notes about this member. Only you and the Admins see them."
              >
                <MemberNotes id={id} notes={data.notes} />
              </Card>
            )}
            {tab === 'interests' && (
              <Card
                title="What they like"
                hint="Golf, F1, wine… When an event or post is tagged with the same word, you get a tip."
              >
                <MemberInterests id={id} interests={data.interests ?? []} />
              </Card>
            )}
            {tab === 'reminders' && (
              <Card
                title="Reminders"
                hint={
                  isSpoc
                    ? 'Pick a date and a note. It appears in your bell that morning.'
                    : 'Set by relationship managers. You can see them here but not change them.'
                }
              >
                <MemberReminders id={id} reminders={data.reminders ?? []} readOnly={!isSpoc} />
              </Card>
            )}
            {tab === 'progress' && (
              <ProgressTab data={data} id={id} busy={busy} save={save} isSpoc={isSpoc} />
            )}
          </div>
        </>
      )}
    </div>
  );
}
