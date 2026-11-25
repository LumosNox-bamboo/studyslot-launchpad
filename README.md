# StudySlot

StudySlot finds meeting times across two to five time zones and exports the selected slot as an `.ics` calendar file.

## Run the demo

1. Open `StudySlot.html` in a current desktop browser. The Berlin and New York example runs automatically.
2. Change the date, duration, time zones, or working hours and select **Find meeting times**.
3. Select **Download calendar invite** next to a time that works. Open the downloaded `.ics` file in your calendar app.

The date is interpreted in the first participant's time zone. Participants enter one availability window that starts and ends on the same local day. Candidate start times are tested every 15 minutes. Scheduling and export run locally.

## Source and tests

`dist/` contains the browser source. To serve the split-file version, run `python3 -m http.server 8000 --bind 127.0.0.1 --directory dist` and open `http://127.0.0.1:8000/`. Run `node --test schedule.test.mjs` from the archive root to test daylight-saving transitions, availability, and calendar export. No dependencies are needed.

The project was developed during LaunchPad Hacks with assistance from OpenAI Codex. All demo schedules are examples.

## LaunchPad demo

The published demo page includes the live scheduler, a source download, and a 67-second captioned walkthrough. This repository contains only the demo app, source, and example schedules.
