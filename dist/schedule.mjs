const minute = 60_000;
const day = 24 * 60 * minute;
const formatters = new Map();

export function localDateTime(timestamp, zone) {
  if (!formatters.has(zone)) {
    formatters.set(zone, new Intl.DateTimeFormat('en-GB', {
      timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZoneName: 'shortOffset',
    }));
  }
  const parts = Object.fromEntries(formatters.get(zone).formatToParts(timestamp).map(({ type, value }) => [type, value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}`, offset: parts.timeZoneName };
}

export function findSlots(date, duration, participants) {
  const midnight = Date.parse(`${date}T00:00:00Z`);
  if (!Number.isFinite(midnight) || new Date(midnight).toISOString().slice(0, 10) !== date) throw new Error('Choose a valid date.');
  if (![15, 30, 45, 60, 90].includes(duration)) throw new Error('Choose a meeting length.');
  if (participants.length < 2 || participants.some(({ from, until }) => !from || !until || from >= until)) {
    throw new Error('Enter a start and a later end time for every participant.');
  }

  const slots = [];
  for (let start = midnight - day; start < midnight + 2 * day; start += 15 * minute) {
    if (localDateTime(start, participants[0].zone).date !== date) continue;
    const fits = participants.every(({ zone, from, until }) => {
      const first = localDateTime(start, zone);
      if (first.time < from || first.time >= until) return false;
      for (let elapsed = 15; elapsed <= duration; elapsed += 15) {
        const local = localDateTime(start + elapsed * minute, zone);
        if (local.date !== first.date || local.time < from || local.time > until || (elapsed < duration && local.time === until)) return false;
      }
      return true;
    });
    if (fits) slots.push(start);
  }
  return slots;
}

function calendarTime(timestamp) {
  return new Date(timestamp).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

export function calendarEvent(start, duration, now = Date.now()) {
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//StudySlot//Meeting Planner//EN',
    'BEGIN:VEVENT', `UID:studyslot-${start}@studyslot.invalid`, `DTSTAMP:${calendarTime(now)}`,
    `DTSTART:${calendarTime(start)}`, `DTEND:${calendarTime(start + duration * minute)}`,
    'SUMMARY:Research team meeting', 'END:VEVENT', 'END:VCALENDAR', ''].join('\r\n');
}
