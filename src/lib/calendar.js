// "Add to calendar" for an event, with no library. Event times are India time (UTC+5:30).
// An event with no time becomes an all-day entry; otherwise it is made 2 hours long.

const pad = (n) => String(n).padStart(2, '0');
const addDays = (ymd, n) => new Date(Date.parse(`${ymd}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);

function times(event) {
  if (!event.time) {
    return { allDay: true, start: event.date.replaceAll('-', ''), end: addDays(event.date, 1).replaceAll('-', '') };
  }
  const startMs = Date.parse(`${event.date}T${event.time}:00Z`) - 5.5 * 3_600_000;
  const fmt = (ms) => {
    const d = new Date(ms);
    return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
  };
  return { allDay: false, start: fmt(startMs), end: fmt(startMs + 2 * 3_600_000) };
}

const here = () => `${window.location.origin}`;

// A link that opens Google Calendar with the event filled in.
export function googleCalendarUrl(event) {
  const t = times(event);
  const q = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${t.start}/${t.end}`,
    details: `India Leadership Council event.\n${here()}/events/${event.id}`,
  });
  if (event.location) q.set('location', event.location);
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

// The same event as start/end moments for Outlook (ISO), or dates for an all-day event.
function isoTimes(event) {
  if (!event.time) return { allDay: true, start: event.date, end: addDays(event.date, 1) };
  const startMs = Date.parse(`${event.date}T${event.time}:00Z`) - 5.5 * 3_600_000;
  return { allDay: false, start: new Date(startMs).toISOString(), end: new Date(startMs + 2 * 3_600_000).toISOString() };
}

// A link that opens Outlook with the event filled in. `work` = a Microsoft 365 account (the calendar Teams uses);
// otherwise a personal Outlook.com account.
export function outlookCalendarUrl(event, { work = true } = {}) {
  const t = isoTimes(event);
  const q = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    startdt: t.start,
    enddt: t.end,
    allday: String(t.allDay),
    body: `India Leadership Council event. ${here()}/events/${event.id}`,
  });
  if (event.location) q.set('location', event.location);
  return `https://outlook.${work ? 'office' : 'live'}.com/calendar/0/deeplink/compose?${q.toString()}`;
}
