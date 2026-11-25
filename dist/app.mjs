import { calendarEvent, findSlots, localDateTime } from './schedule.mjs';

const form = document.querySelector('#planner');
const participants = document.querySelector('#participants');
const rows = document.querySelector('#slots');
const summary = document.querySelector('#summary');
const error = document.querySelector('#error');
const add = document.querySelector('#add');
const zoneList = ['UTC', ...Intl.supportedValuesOf('timeZone')];
const template = document.querySelector('#participant');

function updateParticipantLabels() {
  for (const [index, fieldset] of Array.from(participants.children).entries()) {
    fieldset.querySelector('legend').textContent = `Participant ${index + 1}`;
    fieldset.querySelector('.remove').hidden = participants.children.length === 2;
  }
  add.disabled = participants.children.length >= 5;
}

function addParticipant(zone) {
  const fieldset = template.content.firstElementChild.cloneNode(true);
  const select = fieldset.querySelector('select');
  for (const tz of zoneList) select.add(new Option(tz.replaceAll('_', ' '), tz, false, tz === zone));
  fieldset.querySelector('.remove').addEventListener('click', () => {
    fieldset.remove();
    updateParticipantLabels();
    showResults();
    add.focus();
  });
  participants.append(fieldset);
  return select;
}

function showResults() {
  const people = Array.from(participants.children, node => ({
    zone: node.querySelector('[name="zone"]').value,
    from: node.querySelector('[name="from"]').value,
    until: node.querySelector('[name="until"]').value,
  }));
  const date = form.elements.date.value;
  const duration = Number(form.elements.duration.value);
  error.hidden = true;
  rows.replaceChildren();
  try {
    const matches = findSlots(date, duration, people);
    summary.textContent = matches.length ? `${matches.length} possible ${duration}-minute starts` : 'No shared times on this date.';
    for (const start of matches) {
      const item = document.createElement('article');
      const h = document.createElement('h3');
      const first = localDateTime(start, people[0].zone);
      h.textContent = `${first.time} · ${people[0].zone.replaceAll('_', ' ')} (${first.offset})`;
      const local = document.createElement('p');
      local.textContent = people.slice(1).map(({ zone }) => {
        const time = localDateTime(start, zone);
        return `${time.time} ${zone.replaceAll('_', ' ')} (${time.offset})${time.date === first.date ? '' : ` · ${time.date}`}`;
      }).join(' · ');
      const link = document.createElement('a');
      link.textContent = 'Download calendar invite';
      link.setAttribute('aria-label', `Download calendar invite for ${first.time} ${people[0].zone} (${first.offset})`);
      link.download = 'studyslot-meeting.ics';
      link.href = `data:text/calendar;charset=utf-8,${encodeURIComponent(calendarEvent(start, duration))}`;
      item.append(h, local, link);
      rows.append(item);
    }
  } catch (failure) {
    summary.textContent = 'Check meeting setup.';
    error.textContent = failure.message;
    error.hidden = false;
  }
}

function clearResults() {
  rows.replaceChildren();
  error.hidden = true;
  summary.textContent = 'Use Find meeting times to update the results.';
}

form.addEventListener('submit', event => {
  event.preventDefault();
  showResults();
});
form.addEventListener('input', clearResults);
add.addEventListener('click', () => {
  if (participants.children.length >= 5) return;
  const newZone = addParticipant('UTC');
  updateParticipantLabels();
  clearResults();
  newZone.focus();
});
addParticipant('Europe/Berlin');
addParticipant('America/New_York');
form.elements.date.value = localDateTime(Date.now(), 'Europe/Berlin').date;
updateParticipantLabels();
showResults();
