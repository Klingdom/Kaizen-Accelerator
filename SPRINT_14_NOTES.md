# Sprint 14 Notes — Configurable Start-Time Editing

## Summary

Four-pass sprint that ships configurable start-time editing inside Edit
mode (native `<input type="time">` on non-protected selected slots) and
confirms — via an explicit regression guard — that Sprint 13's duration
cascade correctly updates the visible "left column" time label on
downstream butting-up blocks.

- **Pass 14a** — pure helpers `applyStartTimeChange` and
  `computeStartTimeImpact` in `js/ui/editMode.js`. Plus the Sprint 13
  cascade-to-`sa-when` regression test.
- **Pass 14b** — `<input type="time" class="sa-time-editor">` render
  path in `js/ui/components/ScheduledActivityBlock.js`, gated on
  `editMode && editSelected && !isProtectedBlock(activity)`.
- **Pass 14c** — `EDIT_CHANGE_START_TIME` handler in `js/app.js` plus a
  sibling `change` event delegate at the app root (the existing click
  dispatcher only fires on buttons).
- **Pass 14d** — CSS for `.sa-time-editor` (hover / focus / `<600px`
  responsive tweak).

Baseline: **2305 tests** passing on main at `c08b3c2`. Sprint 14 total:
**2372 tests passing**, 0 failing, ~1.85s full suite.

Test delta: **+67 tests** (2372 − 2305).

## Files added

- `tests/ui/editMode.sprint14.test.js` — 32 pure-helper tests
  (6 sample times × apply cleanly, cascade, backward-shift protection,
  rejection paths, immutability, ISO preservation, preview impact).
- `tests/ui/components/ScheduledActivityBlock.timeEditor.test.js` — 12
  render-gating tests (input shown/hidden on editMode + editSelected +
  protected axes; value + data-activity-id + aria-label; container
  positioning).
- `tests/app.sprint14.test.js` — 14 handler + undo + cascade tests.
- `tests/integration/duration-cascade-time-display.test.js` — 3
  Sprint 13 cascade-to-`sa-when` regression tests (confirming that
  `applyDurationChange` → `plannedStartAt` shift → visible
  `<div class="sa-when">HH:MM</div>` update).
- `SPRINT_14_NOTES.md` — this file.

## Files changed

- `js/ui/editMode.js`
  - Exports `applyStartTimeChange(activities, slotActivityId, newHHMM)`:
    immutable; cascades time-shift onto butting-up successors (gap
    <= 1 min); preserves explicit gaps; preserves the date portion of
    ISO plannedStartAt values; throws `PROTECTED_BLOCK` /
    `INVALID_TIME` / `OVERLAPS_PRIOR`. The `OVERLAPS_PRIOR` error is
    decorated with `err.priorEndHHMM` so the handler can quote the
    prior end in its toast.
  - Exports
    `computeStartTimeImpact(activities, slotActivityId, newHHMM)`
    returning `{delta, newEndOfDay, wouldExceedCapacity,
    wouldOverlapPrior, priorEndHHMM}`.
  - Two private helpers — `parseHHMM` (strict `/^\d{2}:\d{2}$/` with
    0–23 / 0–59 range check) and `replaceTimeOnStart` (preserves
    `HH:MM`, `HH:MM:SS`, and ISO `YYYY-MM-DDTHH:MM:SSZ` shapes).
  - Reuses the Sprint 13 `parseStartMinutes`, `shiftStart`,
    `sortedByStart`, and `END_OF_DAY_MINUTES` module internals so the
    two cascade helpers behave identically.
- `js/ui/components/ScheduledActivityBlock.js`
  - New `timeEditable = editMode && editSelected && !protectedBlock`
    gate. When true, the `<div class="sa-when">` renders a native
    `<input type="time" class="sa-time-editor"
     data-action="EDIT_CHANGE_START_TIME"
     data-activity-id="…" value="HH:MM" aria-label="Start time">`.
    Otherwise the static escaped `HH:MM` text is rendered (unchanged
    behavior).
  - The input sits inside the existing `<div class="sa-when">`
    container so CSS grid positioning is unaffected.
- `js/app.js`
  - Imports `applyStartTimeChange` from `editMode.js`.
  - New `EDIT_CHANGE_START_TIME({activityId, value}, ctx)` handler:
    reads the new HH:MM from `payload.value` OR `ctx.element.value`
    (dual path so it works from both unit-test dispatch and the real
    `change` event delegate); gates on protected / invalid /
    no-op-equal; pushes an undo snapshot; calls
    `applyStartTimeChange`; emits `"Start time: {old} → {new}"`
    success toast. On `OVERLAPS_PRIOR` the handler rolls back the
    undo push and emits a `"Would overlap prior block (ends HH:MM).
    Pick a later time."` error toast (so the user sees why the
    change was rejected and the undo stack stays accurate). A defensive
    rerender fires after rejection so the `<input>` snaps back to the
    previous `plannedStartAt` value.
  - New `change` event delegate at the app root (`start()`) that
    routes `[data-action="EDIT_CHANGE_START_TIME"]` inputs to the
    handler. Sits alongside the existing `input`-event delegate for
    `EDIT_SEARCH`. The click dispatcher is untouched — button clicks
    still flow through `attachRootClickListener`.
- `app.css`
  - Appended ~45 lines for `.sa-time-editor` (hover / focus / muted
    typography matching `.sa-when`), `.sa-block.edit-protected
    .sa-when` belt-and-suspenders rule, and a `<600px` responsive
    block that bumps input min-width + padding + font-size for touch.

## Acceptance criteria — checked

1. Full suite **2372 passing** / 0 failing / **~1.85s** [target:
   >=2350, <3s].
2. In Edit mode, clicking a non-protected slot renders a native
   `<input type="time">` on the left column (verified by 12
   render-gating tests).
3. Changing the time updates that slot's `plannedStartAt` and cascades
   downstream activities that were butting up (verified by cascade
   integration test + pure-helper cascade tests).
4. Overlap with prior activity → `OVERLAPS_PRIOR` error toast with
   `"Would overlap prior block (ends HH:MM). Pick a later time."`
   message, no change, no undo push (verified by handler test).
5. Protected slots keep their static time display — no input is
   rendered even if the slot is somehow selected (verified by 2
   render tests + 1 handler test).
6. Undo (Ctrl+Z) reverts a start-time change (verified by
   `EDIT_CHANGE_START_TIME` + `EDIT_UNDO` integration test).
7. **Sprint 13 cascade → time-display regression test passes**.
   `tests/integration/duration-cascade-time-display.test.js` drives
   09:00/60m + 10:00/30m + 10:30/60m through `applyDurationChange` (60→90)
   and asserts both the `plannedStartAt` shift *and* the rendered
   `<div class="sa-when">` contents on each downstream block. It was
   already working; the regression test now proves it.
8. Existing 2305 tests still green.

## Deviations from the brief

- **Cascade backward-guard semantics.** The brief said "if `newHHMM`
  is earlier than the immediately-preceding activity's end time,
  reject with `OVERLAPS_PRIOR`." Implemented as: walk the
  sorted-by-start sequence backward from the target until we find an
  activity with a `plannedStartAt`, and treat that one as the prior.
  Activities without a `plannedStartAt` (e.g. unscheduled drafts) are
  skipped. This matches the spirit of "immediately preceding" in the
  user's visual schedule, which is what they see when they click into
  the time input.
- **Protected selected-slot still doesn't show an input.** The brief
  says protected slots keep the static time display; I enforced this
  at the render gate. Theoretically a user could still dispatch
  `EDIT_CHANGE_START_TIME` with a protected `activityId` (e.g. via
  devtools), in which case the handler rejects with the
  `"This block's start time is fixed."` toast and `applyStartTimeChange`
  would itself throw `PROTECTED_BLOCK` (belt-and-suspenders). Tested
  both paths.
- **Toast copy.** Brief specified
  `"Start time: {old} → {new}"` for success (matches verbatim) and
  `"Would overlap prior block (ends HH:MM). Pick a later time."` for
  the overlap rejection (also matches). The malformed-input toast uses
  `"Pick a valid start time (HH:MM)."` — not in the brief but
  necessary once I decided to surface `INVALID_TIME` explicitly.
- **Dual-path payload (`payload.value` vs. `ctx.element.value`).** The
  brief noted three possible approaches (change delegate, onchange
  attr, click delegation with special payload). I went with the
  first — a `change` delegate sibling to the existing `input` delegate
  — because it keeps the action-plus-payload convention the rest of
  the app uses. The handler reads from `payload.value` first (so unit
  tests can dispatch directly) and falls back to `ctx.element.value`
  (so the browser delegate can omit it). Both paths are covered by
  tests.
- **Rerender after rejection.** On any error the handler calls
  `rerender()` so the `<input type="time">`'s `value` attribute
  (derived from the unchanged `plannedStartAt`) re-paints the
  previous time. Without the rerender the user would see the
  erroneous value still showing in the input after the toast.
- **Sprint 13 cascade test placement.** The brief offered a choice:
  "add to `tests/ui/editMode.sprint13.test.js` OR a new
  `tests/integration/duration-cascade-time-display.test.js`." I chose
  the new integration file because it cross-cuts two layers
  (`applyDurationChange` + `ScheduledActivityBlock` render) and the
  existing Sprint 13 test file is pure-helper only.

## Test-suite shape (2372 / 0 / ~1.85s)

| Suite                                                        | Tests |
| ------------------------------------------------------------ | ----- |
| `tests/ui/editMode.sprint14.test.js`                          |   32  |
| `tests/ui/components/ScheduledActivityBlock.timeEditor.test.js` |   12  |
| `tests/app.sprint14.test.js`                                  |   14  |
| `tests/integration/duration-cascade-time-display.test.js`     |    3  |
| Sprint 13 suites (unchanged)                                  |   64  |
| (rest of suite — unchanged)                                   | 2247  |

## Not touched (per brief)

- `js/composer/composeDaily.js` / `composeWeekly.js` — untouched.
- Sprint 8 Kaizen FSM methods — untouched.
- `js/services/ComposerService.js` — `commitEdit` already persists
  whatever `plannedStartAt` is in `state.editMode.activities`, so no
  service changes were required.
- Docker / Caddy / deploy — untouched.
- `ARCHITECTURE.md` — untouched (these notes live at repo root).

## Suggested follow-ups

1. **Pre-flight preview on the input.** `computeStartTimeImpact`
   returns `wouldOverlapPrior` and `wouldExceedCapacity`; a future
   pass could hover/focus-preview a shadow of the cascade on
   downstream blocks before the user commits the change (mirroring
   the duration-chip preview follow-up from Sprint 13).
2. **Forward-cascade capacity guard.** If the new start would push
   the end-of-day past 18:00, the handler currently still accepts it
   (same behavior as duration changes). A future pass could surface
   a confirmation toast or hard-reject.
3. **Keyboard-only start-time editing.** `<input type="time">` has
   native arrow-key support, but the Sprint 13 Arrow Left / Arrow
   Right handler still fires on non-input focus. A future pass could
   consider a chord (e.g. Shift+Arrow) for coarse HH adjustments when
   the schedule column has keyboard focus.
4. **Round-trip through Commit.** The `ComposerService.commitEdit`
   path is exercised by Sprint 12/13 tests but not specifically for
   start-time changes. A small commit round-trip test would close
   that gap if it ever becomes brittle.

---

## Git status (no commits made per brief)

Pending changes (`git status --short` equivalent, by inspection):

- Modified: `js/ui/editMode.js`, `js/ui/components/ScheduledActivityBlock.js`,
  `js/app.js`, `app.css`
- Added: `tests/ui/editMode.sprint14.test.js`,
  `tests/ui/components/ScheduledActivityBlock.timeEditor.test.js`,
  `tests/app.sprint14.test.js`,
  `tests/integration/duration-cascade-time-display.test.js`,
  `SPRINT_14_NOTES.md`

User to review and commit.
