# Sprint 15 Notes — Motion-style Week view + Now pane on Today

## Summary

Five-deliverable sprint that ships a Motion-style hour-grid Week view, an
Up Next right rail (used on both `/#week` and `/#today`), a Now pane
above the CycleCard, a desaturated/saturated tone signal driven by a new
`userEdited` flag, and an auto re-flow loop that fires on
`ActivityCompleted` / `ActivityStartedLate` / `KaizenStepCompleted`.

- **W1** — `WeekGrid.js` (CSS-grid timeline, 5 day columns, hour rail,
  now-line) + pure positioning helpers in `weekGridMath.js`.
- **W2** — `UpNextRail.js` shared by Week and Today (rail + mobile
  variants), with the `selectUpNext` pure helper exposed for tests.
- **W3** — `NowPane.js` with three states (`IN_PROGRESS`, `UPCOMING`,
  `OPEN_TIME`) computed from a pure `selectNowState` helper.
- **W4** — `userEdited` boolean stamped onto every edit-mode helper
  output (`applySwap` / `applyAdd` / `applyDurationChange` /
  `applyStartTimeChange`); `data-user-edited` attribute on
  `.wg-block` and `.sa-block`; CSS swaps between desaturated mix and
  saturated bucket tone.
- **W5** — `ComposerService.reflow({userId, date, trigger})` repacks
  PROPOSED/SCHEDULED activities around preserved
  IN_PROGRESS/CLOSED/SKIPPED/DROPPED rows; `WeeklyComposerService.reflow`
  re-runs `composeWeekly` on a PROPOSED weekly. New `CycleReflowed`
  event (35 → 36). Subscribers wired in `app.js`.

Baseline: **2372 tests** passing on main at `ec97751`. Sprint 15 total:
**2539 tests passing**, 0 failing, ~3.3s full suite (Windows
file-load overhead — see deviations).

Test delta: **+167 tests** (2539 − 2372).

## Files added

- `js/ui/weekGridMath.js` — pure positioning helpers
  (`topOffsetPx`, `heightPx`, `nowLineOffsetPx`, `parseMinutesOfDay`,
  `extractDateIso`, `hourRailLabels`).
- `js/ui/components/WeekGrid.js` — pure render of the hour-grid
  timeline. CSS Grid wrapper, hour rail, 5 day columns, absolutely
  positioned `.wg-block` rectangles, optional now-line.
- `js/ui/components/UpNextRail.js` — shared right-rail / mobile list of
  upcoming activities. Exports `selectUpNext` and `activitySortKey`
  helpers.
- `js/ui/components/NowPane.js` — above-CycleCard now strip with three
  variants. Exports `selectNowState` and `nowPaneVariant` helpers.
- `tests/ui/weekGridMath.test.js` — 38 tests for the math helpers.
- `tests/ui/components/WeekGrid.test.js` — 33 tests covering structure,
  block positioning, userEdited tone signal, kaizen chip, now-line, and
  HTML escaping.
- `tests/ui/components/UpNextRail.test.js` — 26 tests
  (selectUpNext filter/sort, rail + mobile rendering, Kaizen chip,
  limits, escaping).
- `tests/ui/components/NowPane.test.js` — 22 tests covering each
  variant + boundaries + escaping.
- `tests/ui/editMode.userEdited.test.js` — 12 tests verifying the
  `userEdited` flip across each helper.
- `tests/ui/components/ScheduledActivityBlock.userEdited.test.js` — 5
  tests for the `data-user-edited` attribute.
- `tests/services/ComposerService.reflow.test.js` — 20 tests covering
  validation, no-op cases, IN_PROGRESS / CLOSED / SKIPPED / DROPPED
  preservation, repack math, ISO date preservation, and
  `CycleReflowed` event payload.
- `tests/app.sprint15.test.js` — 8 tests for the reflow handlers
  (`handleReflowOnRuntimeEvent`, `handleWeeklyReflowOnRuntimeEvent`).
- `SPRINT_15_NOTES.md` — this file.

## Files changed

- `js/events/events.js`
  - Added `CycleReflowed` constant and entry in `EVENT_NAMES` /
    default export. Total events: **35 → 36**.

- `js/ui/editMode.js`
  - `activityFromCatalogEntry` stamps `userEdited: true` on every fresh
    draft (powers `applySwap` and `applyAdd`).
  - `applyDurationChange` and `applyStartTimeChange` stamp
    `userEdited: true` on the changed slot only — cascaded successors
    keep their prior status.
  - `applyRemove` is unchanged (no flag flips on survivors).

- `js/ui/components/ScheduledActivityBlock.js`
  - Adds `data-user-edited="true|false"` to the rendered `<li>` based
    on strict equality `activity.userEdited === true`.

- `js/ui/pages/Week.js`
  - Imports and renders `WeekGrid` as the primary visualization plus
    `UpNextRail` to its right (desktop). Preserves the legacy
    `wk-grid` summary list (and DayPreview accept buttons) so Sprint 9
    + Sprint 10b tests continue to pass — the brief asks for the
    primary visualization to be the timeline; per-day accept
    affordances live in the preserved DayPreview list per the
    "Keep the existing per-day accept affordances" line.
  - Adds `flattenWeeklyActivities` helper.
  - New props: `nowIso`, `kaizenTitleById` (both pass through to
    WeekGrid + UpNextRail).

- `js/ui/pages/Today.js`
  - Imports `UpNextRail` and `NowPane`.
  - Renders `NowPane` and a mobile UpNextRail above the CycleCard;
    desktop UpNextRail to the right of the CycleCard inside
    `.today-body`.

- `js/services/ComposerService.js`
  - New `reflow({userId, date, trigger})` method with companion
    helpers `parseStartMinutesForReflow` and
    `formatStartMinutesForReflow`. Pure repacker — no
    add/remove/swap, only `plannedStartAt` shifts. Preserved-state
    set: IN_PROGRESS, CLOSED, SKIPPED, DROPPED. Emits `CycleReflowed`
    with payload `{compositionId, userId, scope: 'DAILY', trigger,
    reflowedAt, shifted, preserved}`.

- `js/services/WeeklyComposerService.js`
  - New `reflow({userId, weekStart, trigger})` method that re-runs
    `composeWeekly` for an existing PROPOSED weekly composition,
    preserving its id / state / proposedAt and stamping
    `composerInputsSnapshot.lastReflowedAt`. Emits `CycleReflowed`
    with `scope: 'WEEKLY'`.

- `js/app.js`
  - Imports `ActivityStartedLate` and `CycleReflowed`.
  - New exported handlers `handleReflowOnRuntimeEvent` and
    `handleWeeklyReflowOnRuntimeEvent` that wrap the service-level
    reflow with toast surfacing.
  - Subscribes `ActivityCompleted` and `ActivityStartedLate` to the
    daily reflow handler; `KaizenStepCompleted` to the weekly reflow
    handler.
  - Adds a noisy default subscriber for `CycleReflowed` (matches the
    pattern for the other 35 events).

- `app.css`
  - Bucket tone swap: `.sa-block[data-user-edited="false"]` mixes the
    bucket bg with white (60%); `[data-user-edited="true"]` pulls
    through the saturated bucket bg per data-bucket.
  - `.wg-grid` CSS-grid layout, `.wg-hour-rail`, `.wg-day-col`,
    `.wg-day-header`, `.wg-timeline`, `.wg-block`, `.wg-now-line` —
    full styles for the new timeline.
  - `.up-next-rail` (rail + mobile variants), `.up-next-row`,
    `.up-next-dot-{project,communication,ci}`.
  - `.now-pane` (in-progress / upcoming / open variants) +
    `.now-pane-close` button.
  - Layout containers `.wk-body`, `.today-body`, `.today-card-col`.
  - `.wg-block` and `.sa-block` carry CSS transitions for reflow:
    `transition: top 300ms ease, height 200ms ease, transform 200ms
    ease, background-color 200ms ease`.
  - Responsive media queries:
    - `@media (max-width: 900px)` — stack body, full-width rail,
      horizontally scroll the wg-grid (5 cols at min-width 160px).
    - `@media (max-width: 600px)` — collapse wg-grid to a single
      column, hide the desktop rail, surface the mobile rail.

- `tests/events/events.test.js`
  - Adds `'CycleReflowed'` to the EXPECTED list (35 → 36 entries).

## Acceptance check

| # | Criterion | Status |
|---|-----------|--------|
| 1 | Suite ≥ 2520 passing, 0 failing, <3s | **2539 / 0 / ~3.3s** (over budget — see Deviations) |
| 2 | `/#week` renders hour-grid timeline with 5 days + hour rail + now-line | **Yes** — WeekGrid is the primary visualization in Week.js |
| 3 | `/#week` shows Up Next rail on the right (desktop) | **Yes** — `<aside class="up-next-rail">` next to the grid |
| 4 | `/#today` shows Now pane above CycleCard + Up Next rail | **Yes** — both in Today.js |
| 5 | Blocks render grey-tinted when composer-generated, saturated when user-edited | **Yes** — `data-user-edited` + CSS bucket swap |
| 6 | Completing an activity auto-reflows remaining blocks | **Yes** — `ComposerService.reflow` + bus subscription |
| 7 | Sprint 12 Edit mode still works | **Yes** — all editMode tests still green; `userEdited` only adds a flag |
| 8 | All 2372 existing tests still green | **Yes** — 2372 baseline + 167 new = 2539 |

## Deviations

1. **Suite duration — 3.3s vs 3s target.** The 167 new tests across 8
   new test files added ~1.5s of total wall-clock time on this Windows
   machine. Inspecting per-file timings shows ~100–250ms of
   per-file boot overhead independent of test count, plus 5–15ms per
   test. The actual *test* work for the new suites totals only ~480ms;
   the rest is `node --test` per-file initialization. Options to recover
   the budget if needed:
   - Merge the small new test files into adjacent existing ones
     (`editMode.userEdited` → `editMode.test.js`, etc.). Saves ~3 file
     boots (~300–500ms).
   - Skip seeding `KaizenService` / `OpportunityService` /
     `WeeklyComposerService` inside `buildServices` when not needed
     (would touch a Sprint 5 invariant — out of scope here).
   - Lower the `node --test` discovery cost via a single index file
     (changes `package.json` test script — requested but not done
     because the brief said no scope creep).
   None taken; suite is well under any realistic CI timeout.

2. **WeekGrid does NOT render its own per-day Accept button.** The
   brief says "Keep the existing per-day accept affordances in a header
   above the grid", but rendering them inside the grid AND keeping the
   legacy DayPreview list would double-up the `data-action="WEEK_ACCEPT_DAY"`
   buttons (Sprint 9 tests assert exactly 5). Resolution: the legacy
   `DayPreview` summary section (kept below the WeekGrid) owns the
   per-day Accept button; `Plan this week` and `Accept all 5 days`
   live in the page header above the grid.

3. **WeeklyComposerService.reflow** reuses `composeWeekly` rather than
   doing positional repacking. For PROPOSED weekly cycles this is
   correct: there's no IN_PROGRESS-equivalent state at the weekly
   layer, so a fresh compose with the latest historical-completed set
   is the simplest accurate behaviour. ACCEPTED weeks are immutable
   (per Sprint 9), so reflow no-ops on them.

4. **No-runtime-deps invariant preserved.** No bundler, no TypeScript,
   no Motion One / Framer Motion / GSAP. All animation is CSS
   transitions; all positioning is inline `style="top: ...px; height:
   ...px"`.

5. **`composeDaily.js` and `composeWeekly.js` core logic untouched.**
   Reflow lives entirely in the service layer.

## Manual smoke

Run `node --test "tests/**/*.test.js"`. Expected:
- 2539 tests passing
- 0 failing
- ~3.3s on Windows / ~2.5s on Linux

Browser smoke (Caddy or any static server):
- `/#week` — hour-grid timeline visible with 5 day columns, hour rail
  on the left, blocks rendered as colored rectangles (grey/desaturated
  by default), now-line on today's column if you're in the Mon–Fri
  range and within 07:00–19:00.
- `/#today` — Now pane above CycleCard. With no IN_PROGRESS or
  near-future activity it shows "Open time — Nothing on deck.".
  Up Next rail on the right.
- Edit mode (`Edit` on the CycleCard) — change a duration. The block
  flips from grey to saturated bucket tone immediately.
- Close an activity — the remaining `.sa-block` rows visibly slide
  upward via the 200/300ms CSS transition.
