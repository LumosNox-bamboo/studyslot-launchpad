import assert from 'node:assert/strict';
import test from 'node:test';
import { calendarEvent, findSlots, localDateTime } from './dist/schedule.mjs';

const participant = (zone, from = '09:00', until = '17:00') => ({ zone, from, until });
const berlinAndNewYork = [participant('Europe/Berlin'), participant('America/New_York')];

test('accounts for Europe and the US changing clocks on different Sundays', () => {
  const winter = findSlots('2026-11-25', 30, berlinAndNewYork);
  const march = findSlots('2026-03-20', 30, berlinAndNewYork);
  assert.equal(localDateTime(winter[0], 'Europe/Berlin').time, '15:00');
  assert.equal(localDateTime(march[0], 'Europe/Berlin').time, '14:00');
  assert.equal(localDateTime(march[0], 'America/New_York').time, '09:00');
  assert.equal(localDateTime(march.at(-1), 'Europe/Berlin').time, '16:30');
});

test('keeps the two repeated fall-back times distinct by offset', () => {
  const slots = findSlots('2026-10-25', 15, [participant('Europe/Berlin','02:00','04:00'), participant('UTC','00:00','03:00')]);
  const repeats = slots.map(start => localDateTime(start, 'Europe/Berlin')).filter(s => s.time === '02:15');
  assert.deepEqual(repeats.map(s => s.offset), ['GMT+2', 'GMT+1']);
});

test('reports no overlap and rejects an inverted availability interval', () => {
  assert.deepEqual(findSlots('2026-11-25', 30, [participant('Europe/Berlin','09:00','10:00'), participant('America/New_York','09:00','10:00')]), []);
  assert.throws(() => findSlots('2026-11-25', 30, [participant('UTC','17:00','09:00'), berlinAndNewYork[0]]), /later end time/);
});

test('exports the actual UTC instant and duration in the calendar file', () => {
  const [slot] = findSlots('2026-11-25', 30, berlinAndNewYork);
  assert.match(calendarEvent(slot, 30, 0), /DTSTART:20261125T140000Z\r\nDTEND:20261125T143000Z/);
});
