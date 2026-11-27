import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import Switch from '../../components/ui/Switch.jsx';
import ImageUploadField from '../../components/ui/ImageUploadField.jsx';
import TagsField from '../../components/ui/TagsField.jsx';
import TextField from '../../components/ui/TextField.jsx';
import { getErrorMessage } from '../../lib/api-client.js';
import { EventImage } from './EventParts.jsx';
import { useInterestTags } from '../ops/hooks.js';
import { useEvent, useSaveEvent } from './hooks.js';

const EMPTY = {
  kind: 'ILC',
  external_url: '',
  title: '',
  date: '',
  time: '',
  end_time: '',
  meetings_enabled: false,
  meeting_places: [],
  agenda: [],
  location: '',
  description: '',
  image_url: '',
  tags: [],
};

const minutes = (hhmm) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

const isHttps = (v) => {
  try {
    return new URL(v).protocol === 'https:';
  } catch {
    return false;
  }
};

const smallInput =
  'min-h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:border-ilc-purple focus:ring-2 focus:ring-ilc-purple/15 focus:outline-none';

// The agenda: one row per session (start, end, name). Members cannot book meetings during a session.
function AgendaEditor({ value, onChange }) {
  const update = (i, k, v) => onChange(value.map((row, j) => (j === i ? { ...row, [k]: v } : row)));
  const remove = (i) => onChange(value.filter((_, j) => j !== i));
  const add = () => onChange([...value, { start: '', end: '', title: '' }]);
  return (
    <fieldset className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
      <legend className="px-1 text-xs font-bold tracking-widest text-gray-700 uppercase">Agenda</legend>
      <p className="text-xs text-gray-700">
        Optional. Add each session (for example 10:00 to 10:45, Keynote). Members see the agenda on the event, and cannot book a meeting during a session.
      </p>
      {value.length > 0 && (
        <ul className="space-y-2">
          {value.map((row, i) => {
            const bad = row.start && row.end && row.end <= row.start;
            return (
              <li key={i} className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <input type="time" aria-label={`Session ${i + 1} start`} value={row.start} onChange={(e) => update(i, 'start', e.target.value)} className={`${smallInput} w-32`} required />
                  <span className="text-xs text-gray-600">to</span>
                  <input type="time" aria-label={`Session ${i + 1} end`} value={row.end} onChange={(e) => update(i, 'end', e.target.value)} className={`${smallInput} w-32`} required />
                  <input type="text" aria-label={`Session ${i + 1} name`} placeholder="Session name, e.g. Keynote" maxLength={150} value={row.title} onChange={(e) => update(i, 'title', e.target.value)} className={`${smallInput} min-w-0 flex-1`} required />
                  <button type="button" onClick={() => remove(i)} aria-label={`Remove session ${i + 1}`} className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-700">
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                {bad && <p className="text-xs font-semibold text-red-700">The end must be after the start.</p>}
              </li>
            );
          })}
        </ul>
      )}
      <button type="button" onClick={add} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-gray-300 px-3 text-xs font-bold tracking-widest text-ilc-purple uppercase hover:bg-ilc-purple/5">
        <Plus className="h-4 w-4" aria-hidden="true" /> Add a session
      </button>
    </fieldset>
  );
}

function EventForm({ initial, id }) {
  const navigate = useNavigate();
  const save = useSaveEvent();
  const [form, setForm] = useState({ ...initial, image_file_id: '' });
  const [pickerKey, setPickerKey] = useState(0);
  const { data: tagSuggestions = [] } = useInterestTags();
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const isEtEdge = form.kind === 'ET_EDGE';
  const timeError =
    !isEtEdge && form.end_time && (!form.time || form.end_time <= form.time)
      ? 'The end time must be after the start time'
      : !isEtEdge && form.meetings_enabled && (!form.time || !form.end_time)
        ? 'Meetings need a start time and an end time'
        : !isEtEdge && form.meetings_enabled && minutes(form.end_time) - minutes(form.time) < 15
          ? 'The event must be at least 15 minutes long'
          : undefined;
  const siteError = isEtEdge && form.external_url && !isHttps(form.external_url) ? 'Must start with https://' : undefined;
  const imageError =
    form.image_url && !isHttps(form.image_url) ? 'Must start with https://' : undefined;

  const agendaError = !isEtEdge && form.agenda.some((a) => a.start && a.end && a.end <= a.start);

  const submit = (e) => {
    e.preventDefault();
    if (timeError || imageError || siteError || agendaError) return;
    const { image_file_id: fileId, ...rest } = form;
    save.mutate(
      { id, ...rest, ...(fileId ? { image_file_id: fileId } : {}) },
      { onSuccess: (res) => navigate(`/admin/events/${res.event.id}`) },
    );
  };

  return (
    <form onSubmit={submit} className="glass-card space-y-5 rounded-2xl p-5 sm:p-8" noValidate>
      <h2 className="font-serif text-2xl font-semibold text-ilc-purple">
        {id ? 'Edit event' : 'Create an event'}
      </h2>
      {save.isError && <Alert>{getErrorMessage(save.error)}</Alert>}

      <fieldset>
        <legend className="mb-1.5 block text-xs font-bold tracking-widest text-gray-700 uppercase">Type of event</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {[['ILC', 'ILC event', 'Members say yes inside the portal.'], ['ET_EDGE', 'ET Edge event', 'Members say "I\'m interested" and their relationship manager follows up.']].map(([value, title, hint]) => (
            <label key={value} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${form.kind === value ? 'border-ilc-purple bg-ilc-purple/5' : 'border-gray-300 bg-white'}`}>
              <input type="radio" name="event-kind" value={value} checked={form.kind === value} onChange={() => setForm((f) => ({ ...f, kind: value }))} className="mt-1 h-4 w-4 accent-ilc-purple" />
              <span>
                <span className="block text-sm font-bold text-ilc-ink">{title}</span>
                <span className="block text-xs text-gray-700">{hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          className="sm:col-span-2"
          label="Title *"
          value={form.title}
          onChange={set('title')}
          required
          autoFocus
        />
        <TextField label="Date *" type="date" value={form.date} onChange={set('date')} required />
        <TextField
          label="Time"
          type="time"
          value={form.time}
          onChange={set('time')}
          hint="India time"
        />
        {!isEtEdge && (
          <TextField
            label="End time"
            type="time"
            value={form.end_time}
            onChange={set('end_time')}
            error={timeError}
            hint="India time. Needed if members can book meetings."
          />
        )}
        <TextField label="Location" value={form.location} onChange={set('location')} />
      </div>

      {!isEtEdge && <AgendaEditor value={form.agenda} onChange={(agenda) => setForm((f) => ({ ...f, agenda }))} />}

      {!isEtEdge && (
        <fieldset className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
          <legend className="px-1 text-xs font-bold tracking-widest text-gray-700 uppercase">Member meetings</legend>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-ilc-ink">Let attending members meet for 15 minutes</p>
              <p className="text-xs text-gray-700">
                The time between the start and end above is cut into 15-minute slots, leaving out the sessions on the agenda. Only members who said Yes can ask each other.
              </p>
            </div>
            <Switch checked={form.meetings_enabled} onChange={(v) => setForm((f) => ({ ...f, meetings_enabled: v }))} label="Let attending members meet for 15 minutes" />
          </div>
          {form.meetings_enabled && (
            <TagsField
              label="Places to meet"
              value={form.meeting_places}
              onChange={(meeting_places) => setForm((f) => ({ ...f, meeting_places }))}
              hint="Optional, e.g. Lounge, Garden. Members pick one, or type their own."
            />
          )}
        </fieldset>
      )}

      <div>
        <label
          htmlFor="event-description"
          className="mb-1.5 block text-xs font-bold tracking-widest text-gray-700 uppercase"
        >
          Description
        </label>
        <textarea
          id="event-description"
          rows={5}
          value={form.description}
          onChange={set('description')}
          className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm focus:border-ilc-purple focus:ring-2 focus:ring-ilc-purple/15 focus:outline-none"
        />
      </div>

      <TagsField value={form.tags} onChange={(tags) => setForm((f) => ({ ...f, tags }))} suggestions={tagSuggestions} hint="Optional. Relationship managers are told which of their members like this, so they can invite them." />

      {isEtEdge ? (
        <TextField
          label="Event website *"
          value={form.external_url}
          onChange={set('external_url')}
          error={siteError}
          inputMode="url"
          placeholder="https://et-edge.com/…"
          hint="The event's own page. Members can open it from the event."
        />
      ) : null}

      <div className="space-y-3">
        <ImageUploadField
          key={pickerKey}
          label="Poster picture (optional)"
          value={form.image_url}
          aspect={3 / 4}
          maxSide={1400}
          hint="A tall poster picture. It is trimmed from the centre to a 3:4 shape, so portrait pictures (about 900 × 1200) look best."
          onChange={(c) => {
            if (c.remove) setForm((f) => ({ ...f, image_url: '', image_file_id: '' }));
            else setForm((f) => ({ ...f, image_url: '', image_file_id: c.fileId }));
          }}
        />
        <details className="text-sm text-gray-600">
          <summary className="cursor-pointer text-xs font-semibold text-ilc-purple">Or use a picture link instead</summary>
          <TextField
            className="mt-2"
            label="Image link"
            value={form.image_url}
            onChange={(e) => {
              setForm((f) => ({ ...f, image_url: e.target.value, image_file_id: '' }));
              setPickerKey((k) => k + 1); // clears any picture just uploaded
            }}
            error={imageError}
            inputMode="url"
            placeholder="https://…/picture.jpg"
          />
          {form.image_url && !imageError && (
            <div className="mt-2 w-28 overflow-hidden rounded-lg border border-gray-100">
              <EventImage event={{ image_url: form.image_url, date: form.date }} />
            </div>
          )}
        </details>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Link
          to={id ? `/admin/events/${id}` : '/admin/events'}
          className="inline-flex min-h-11 items-center justify-center rounded-lg px-5 text-xs font-bold tracking-widest text-ilc-purple uppercase hover:bg-ilc-purple/5"
        >
          Cancel
        </Link>
        <Button
          type="submit"
          className="sm:w-auto"
          loading={save.isPending}
          disabled={!form.title.trim() || !form.date || Boolean(timeError || imageError || siteError) || (isEtEdge && !form.external_url.trim())}
        >
          {id ? 'Save changes' : 'Create event'}
        </Button>
      </div>
    </form>
  );
}

// Create (/admin/events/new) and edit (/admin/events/:id/edit) share this page.
export default function EventFormPage() {
  const { id } = useParams();
  const { data, isLoading, isError, error } = useEvent(id);

  const body = !id ? (
    <EventForm initial={EMPTY} />
  ) : isLoading ? (
    <div className="glass-card rounded-2xl p-10 text-center text-sm text-gray-600">
      Loading event…
    </div>
  ) : isError ? (
    <Alert>{getErrorMessage(error)}</Alert>
  ) : (
    <EventForm
      id={id}
      initial={{
        kind: data.event.kind ?? 'ILC',
        external_url: data.event.external_url ?? '',
        title: data.event.title,
        date: data.event.date,
        time: data.event.time ?? '',
        end_time: data.event.end_time ?? '',
        meetings_enabled: data.event.meetings_enabled ?? false,
        meeting_places: data.event.meeting_places ?? [],
        agenda: data.event.agenda ?? [],
        location: data.event.location ?? '',
        description: data.event.description ?? '',
        image_url: data.event.image_url ?? '',
        tags: data.event.tags ?? [],
      }}
    />
  );

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        to={id ? `/admin/events/${id}` : '/admin/events'}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-ilc-purple hover:underline"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
      </Link>
      {body}
    </div>
  );
}
