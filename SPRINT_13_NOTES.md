# Sprint 13 Notes — Duration Chips for Standard Work Cards

## Summary

Four-pass sprint that adds a six-option duration-chip row
(15/30/45/60/75/90 minutes) to non-protected ScheduledActivityBlocks
while inside Edit mode. Clicking a chip changes the activity's
`plannedDurationMinutes` and cascade-shifts subsequent butting-up
activities so they don't overlap. Arrow-Left / Arrow-Right navigate the
chip row while a slot is selected. Undo (Ctrl+Z) reverts duration
changes alongside swaps/removes/adds. Commit persists unchanged via
`ComposerService.commitEdit`.

- **Pass 13a** — pure helpers `DURATION_OPTIONS`,
  `applyDurationChange`, `computeDurationImpact` in `js/ui/editMode.js`.
- **Pass 13b** — chip-row render path in
  `js/ui/components/ScheduledActivityBlock.js`, gated on
  `editMode && editSelected && !isProtectedBlock(activity)`.
- **Pass 13c** — `EDIT_CHANGE_DURATION` handler in `js/app.js` + the
  new `handleDurationArrowKey` helper wired into the existing
  edit-mode keydown listener.
- **Pass 13d** — CSS for `.sa-duration-chips`, `.sa-dur-chip`,
  `.sa-dur-chip-active`, and the `<600px` responsive tweak.

Baseline: **2241 tests** passing on main at `14f8d82`. Sprint 13
total: **2305 tests passing**, 0 failing, ~1.87s full suite.

Test delta: **+64 tests** (2305 − 2241).

## Files added

- `tests/ui/editMode.sprint13.test.js` — 30 pure-helper tests.
- `tests/ui/components/ScheduledActivityBlock.durationChips.test.js` — 16 chip-render tests.
- `tests/app.sprint13.test.js` — 18 handler + arrow-key tests.
- `SPRINT_13_NOTES.md` — this file.

## Files changed

- `js/ui/editMode.js`
  - Exports `DURATION_OPTIONS` (frozen `[15, 30, 45, 60, 75, 90]`).
  - `applyDurationChange(activities, slotActivityId, newMinutes)`:
    immutable; cascades time-shift onto butting-up successors
    (gap <= 1 min); preserves explicit gaps; throws
    `PROTECTED_BLOCK` / `INVALID_DURATION`.
  - `computeDurationImpact(activities, slotActivityId, newMinutes)`
    returns `{delta, newEndOfDay, wouldExceedCapacity,
    wouldFallBelowFloor}`. Soft ceiling is 18:00 local.
  - Private `parseStartMinutes` / `shiftStart` / `sortedByStart`
    helpers handle the three plannedStartAt shapes the composer
    emits (`HH:MM`, `HH:MM:SS`, full ISO with `Z` suffix).
- `js/ui/components/ScheduledActivityBlock.js`
  - Imports `DURATION_OPTIONS` alongside the existing
    `isProtectedBlock` import.
  - New `renderDurationChips(activity, current)` helper emitting a
    `<div class="sa-duration-label">…</div>` + `<div class="sa-duration-chips" role="group">…</div>`
    section with six `<button data-action="EDIT_CHANGE_DURATION">`
    chips. The current-duration chip gets the
    `sa-dur-chip-active` class and `aria-pressed="true"`.
  - Chip row only rendered when
    `editMode && editSelected && !protectedBlock`.
- `js/app.js`
  - Imports `applyDurationChange` + `DURATION_OPTIONS` from
    `editMode.js`.
  - New `EDIT_CHANGE_DURATION({activityId, minutes})` handler: gates
    on protected / invalid-minutes / no-op, pushes undo snapshot,
    calls `applyDurationChange`, emits
    `"Duration: {old}m → {new}m"` success toast, rolls back the undo
    push on error (belt-and-suspenders — shouldn't fire in practice
    because we gate first).
  - New exported `handleDurationArrowKey(ev, state, handlers)`
    helper — pure logic for ArrowLeft/ArrowRight cycling, extracted
    so the browser-only keydown wiring stays testable without a DOM.
    Snaps non-canonical durations (e.g. 25) to the nearest option
    below, steps from there, stops at 15 (floor) and 90 (ceiling).
  - Existing `keydown` listener in `start()` now routes
    ArrowLeft/ArrowRight through `handleDurationArrowKey` while
    state.editMode is set and focus isn't inside a form field.
- `app.css`
  - Appended ~70 lines for `.sa-duration-label`,
    `.sa-duration-chips`, `.sa-dur-chip` (hover / focus / active /
    pressed), and a `<600px` responsive block that bumps chip
    padding and gap.

## Acceptance criteria — checked

1. Full suite **2305 passing** / 0 failing / **~1.87s** [target:
   >=2300, <3s].
2. In Edit mode, selecting a non-protected slot renders six chips
   (15/30/45/60/75/90m) under the block. Protected slots don't.
3. Clicking a chip updates the activity's `plannedDurationMinutes`
   and cascades the start-time shift to subsequent butting-up
   activities.
4. Protected blocks (Daily Standup, Sprint Planning, carriedOver
   rescues, strategic Deep payload) render no chips and silently
   (test-level) or with an error toast (handler-level, when forced)
   reject duration changes.
5. ArrowLeft / ArrowRight navigate DURATION_OPTIONS while a slot is
   selected. Boundaries (15 and 90) are hard stops with no
   dispatch.
6. Undo (Ctrl+Z) reverts a duration change — covered by the
   EDIT_UNDO integration test in `app.sprint13.test.js`.
7. Commit path unchanged: `ComposerService.commitEdit` already
   copies `plannedDurationMinutes` + `plannedStartAt` verbatim, no
   service changes required.
8. Sprint 12 swap/remove/add/search/filter flows still green (85
   tests across the Sprint 12 suites — all green).

## Deviations from the brief

- **End-of-day ceiling is encapsulated inside `editMode.js`, not
  pulled from composer constants.** The brief said "assume 18:00
  local as the soft end-of-day ceiling (match existing
  convention)". Grep for a single source-of-truth constant turned
  up nothing canonical, so I inlined `END_OF_DAY_MINUTES = 18 * 60`
  as a private module const. A future pass that introduces a
  shared `DAILY_END_OF_DAY_MINUTES` in `composeDaily.js` can swap
  the inline const for the import without touching callers.
- **`wouldFallBelowFloor` is reserved but not wired.** The brief
  lists it in the `computeDurationImpact` return shape.
  `applyDurationChange` has no knowledge of bucket floors (those
  live in the composer's per-user config), and nothing in the UI
  currently reads the flag. I kept the field in the return for
  forward-compat but always return `false`. Wiring it up is a
  one-liner follow-up (pass floors into
  `computeDurationImpact` + delegate to `validateEditState`).
- **Toast strings.** The brief said `"Duration: {old}m → {new}m"`
  for success and `"This block's duration is fixed"` for the
  protected rejection. Success matches verbatim; rejection uses
  `"This block's duration is fixed."` (with trailing period) for
  punctuation consistency with the rest of the toast corpus. The
  test relies on the `/duration is fixed/i` regex, so the exact
  phrasing can drift without breaking.
- **Chip row placement inside the `<li>`.** The brief said "render
  a new `<div class="sa-duration-chips">` under the main block".
  The chip row is appended to the `sa-block` grid (after
  `editChrome`, before `whyChip`) with `grid-column: 1 / -1` to
  span the full row. This keeps it visually "under" the main block
  while staying inside the same `<li>` hit target (no layout shift
  when selection flips).
- **Rollback-on-throw in the handler.** `applyDurationChange`
  throws only for PROTECTED_BLOCK and INVALID_DURATION, both of
  which the handler gates before pushing to undo. The try/catch
  around the call is defensive — if a future invariant is added
  inside `applyDurationChange`, the handler pops the unused undo
  frame before surfacing the error toast. Not a behavior change;
  just a safety net.

## Test-suite shape (2305 / 0 / ~1.87s)

| Suite                                                        | Tests |
| ------------------------------------------------------------ | ----- |
| `tests/ui/editMode.sprint13.test.js`                          |   30  |
| `tests/ui/components/ScheduledActivityBlock.durationChips.test.js` |   16  |
| `tests/app.sprint13.test.js`                                  |   18  |
| (rest of suite — unchanged)                                   | 2241  |

## Not touched (per brief)

- `js/composer/composeDaily.js` — DAILY_NON_OPTIONAL_SET and
  SPRINT_CEREMONIES read via `editMode.js`'s existing mirror.
- `js/composer/composeWeekly.js` — untouched.
- `js/services/ComposerService.js` — `commitEdit` already persists
  `plannedDurationMinutes` + `plannedStartAt`, so no service
  changes were required.
- Sprint 8 Kaizen FSM methods — untouched.
- `ARCHITECTURE.md` / Caddy / Docker / deploy — untouched.

## Suggested follow-ups

1. **Wire `wouldFallBelowFloor`** — thread per-bucket floors
   through `computeDurationImpact` and surface a preview banner
   ("Changing this will drop PROJECT below the 180m floor") on
   hover / focus of a shrinking chip.
2. **End-of-day guardrail** — currently the capacity check is a
   preview-only flag. A future pass could either show the
   projected end-of-day in the chip row label ("duration: 60m →
   ends 11:45") or hard-reject chips that would push past 18:00.
3. **Pointer-hover preview** — precompute `computeDurationImpact`
   for each chip on hover and project a ghost outline onto
   subsequent blocks so the cascade is visible before click.
4. **Custom durations** — a "custom…" chip opening a small
   numeric input for sub-15m or >90m durations, guarded by the
   bucket's floor/ceiling.
5. **Keyboard shortcut for Commit** — Ctrl+Enter committing the
   pending edits would close out the keyboard story started in
   Sprint 12 (Esc / Ctrl+Z) and Sprint 13 (ArrowLeft /
   ArrowRight).
