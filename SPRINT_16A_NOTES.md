# Sprint 16a — Time-range display on activity blocks

## Goal

Surface the **end time** of every scheduled activity block on Today and
Week. Up through Sprint 15 the leading time column showed only the
planned start (`09:00`). Sprint 16a swaps that for a "HH:MM–HH:MM" range
(`09:00–10:30`, en-dash U+2013) so users can see at-a-glance when a block
finishes — and so the duration cascade fixed in Sprint 13/14 is verified
visually for the trailing edge of each block, not just the leading one.

## Files touched

### Production
- **`js/ui/timeFormat.js`** — new module. Houses the existing `formatTime`
  (lifted verbatim from `ScheduledActivityBlock.js`) and the new
  `formatTimeRange(startIso, durationMinutes)` helper. Pure, no DOM, no
  deps. UTC math matches `formatTime` and `weekGridMath.parseMinutesOfDay`.
- **`js/ui/components/ScheduledActivityBlock.js`** — imports `formatTime`
  and `formatTimeRange` from the new module (re-exported for backwards
  compatibility). `<div class="sa-when">` now displays the range when
  not in the time-editor path. The static path also gains an
  `aria-label="starts at HH:MM, N minutes"` so screen readers still
  verbalize start + duration. The Sprint 14 native `<input type="time">`
  edit path is unchanged: it still accepts only the start time, since
  the OS time picker can't represent a range.
- **`js/ui/components/WeekGrid.js`** — imports `formatTimeRange` and
  swaps the `wg-block-time` label to a range. Short blocks
  (`heightPx < 40`) fall back to start-only to avoid visual overflow on
  cramped 15-min/30-min slots.
- **`app.css`** — bumps `.sa-block` first column from `60px` to `100px`
  to fit the new range string. WeekGrid block CSS unchanged (font and
  flex layout already absorb the wider label).

### Tests
- **`tests/ui/timeFormat.test.js`** — 18 tests for `formatTime`
  (semantics preserved) + `formatTimeRange` (HH:MM/ISO inputs, missing/
  zero/negative duration, en-dash check, midnight wrap, modulo-24h wrap
  for unrealistically long durations).
- **`tests/integration/duration-cascade-time-display.test.js`** —
  rewritten to assert the full HH:MM–HH:MM range rather than only the
  start. Expanded from 3 to 4 cases: added "shrink with explicit gap"
  for symmetry with the existing "grow with explicit gap" case. The
  range-form assertions implicitly verify the trailing edge after every
  cascade — i.e., when 60→30 fires, the focal block displays
  `09:00–09:30` rather than the stale `09:00–10:00`.
- **`tests/ui/components/ScheduledActivityBlock.test.js`** — added 2
  tests asserting the new range form and the new aria-label on the
  static path.
- **`tests/ui/components/ScheduledActivityBlock.timeEditor.test.js`** —
  the two "static text" assertions now expect the range form. The
  capture regex was broadened from `<div class="sa-when">…</div>` to
  `<div class="sa-when"[^>]*>…</div>` so the new aria-label attribute
  is allowed.
- **`tests/ui/components/WeekGrid.test.js`** — added 3 tests covering
  range render on tall blocks, the short-block (<40px) fallback, and
  the 40px-threshold edge.

## What was NOT touched

- `composeDaily.js` / `composeWeekly.js` — no scheduling logic changed.
- `applyDurationChange` / `applyStartTimeChange` cascade in
  `js/ui/editMode.js` — logic untouched. The Sprint 16a tests sit
  *around* it and verify the rendered range tracks the cascade.
- Sprint 8 Kaizen FSM, Docker, deploy.
- `ARCHITECTURE.md`.

## Helper signature

```js
/**
 * @param {string|null|undefined} startIso  ISO timestamp OR HH:MM
 * @param {number|null|undefined} durationMinutes
 * @returns {string} — "09:00–10:30" form, en-dash U+2013, or "" on invalid input
 */
export function formatTimeRange(startIso, durationMinutes)
```

Behaviour:
- Missing/unparseable start → `""` (matches `formatTime`).
- Missing / zero / negative / NaN duration → just the start (`"09:00"`).
- En-dash (`U+2013`) between the times.
- Wraps modulo 24h (composer never spans midnight in practice; the wrap
  is defensive so the helper is total).

## Test count

| Phase           | Count |
|-----------------|-------|
| Sprint 15 baseline | 2539 |
| **Sprint 16a**     | **2565** |
| Delta              | +26 |
| Suite duration     | ~2.97s (target <3.5s) |

All passing, 0 failing.

## Acceptance check

1. Suite ≥ 2565 / 0 fail / <3.5s — **2565 / 0 / ~2.97s**.
2. Today + Week show `HH:MM–HH:MM` (Week short blocks fall back to start
   only, per spec).
3. Aria-labels still announce start + duration verbally
   (`aria-label="starts at 10:15, 30 minutes"`).
4. Cascade helpers unchanged; new cascade-render tests confirm both the
   leading and trailing edges of each block update after edits.
5. No regressions in the 2539 baseline.

## Deviations / notes

- Spec said the helper should be added "alongside the existing
  `formatTime` helper (or extract both into a new `js/ui/timeFormat.js`
  if it reads cleaner — your call)". Extracted, since the spec also
  named the new test file `tests/ui/timeFormat.test.js` — keeping
  source + test under the same module name is cleaner. The extracted
  `formatTime` is re-exported from `ScheduledActivityBlock.js` so any
  external import path keeps working.
- The Week short-block threshold is implemented as a strict `<` 40px
  comparison. A 40-minute block at default row height (60px/hr) renders
  exactly 40px tall and gets the full range — this matches "short Week
  blocks where heightPx < 40 → start only" verbatim.
- Mobile (`<600px`) wrap behaviour: kept the existing CSS unchanged.
  `tabular-nums` plus a 100px column accommodates the range without
  wrapping at default font size; on mobile the `.sa-block` already
  collapses to a single-column flow (see `app.css` line 1397+) where
  width is no longer a constraint.
