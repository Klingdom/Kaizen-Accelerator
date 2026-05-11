# ARCHITECTURE_DELTA_TODAY_CALENDAR.md

Status: v0.1 — Define-phase delta. Architect: System Architect agent.
Owner of final scope: Phil. Engineering downstream: backend-engineer (no
service work expected), frontend-engineer (primary), devops-engineer (n/a).

---

## 1. Goal + non-goals

### Goal
Convert the Today page from its current table-style schedule (`<ul>` of
`ScheduledActivityBlock` rows under a column-header strip) to a
calendar-style hour-grid affordance that matches every standard scheduling
tool (Google Calendar, Outlook, Motion, Fantastical, Sunrise): blocks
positioned absolutely on a vertical hour rail, time-of-day legible at a
glance, drag-to-move, drag-to-resize, click-empty-time-to-add — within the
constraints of the existing composer / engine boundaries.

### Non-goals
- Multi-day rendering on Today (Today is one day; Week stays the
  multi-column surface).
- Background sync, server-side persistence, real-time collaboration.
- Recurring-event rules / RRULE expansion (composer already owns the day
  shape; this is a render+drag layer only).
- Replacing the Edit drawer's Catalog picker. The drawer continues to
  exist; calendar gestures are the new on-grid affordance for time and
  duration mutation.
- Touching `js/composer/`, `js/engine/`, `js/domain/types.js`, or
  `js/events/events.js`. Confirmed in §13.

---

## 2. Current state inventory

| Concern | File | Lines |
|---|---|---|
| Today render entry | `js/ui/pages/Today.js` | 100–220 |
| Today render path → CycleCard | `js/ui/pages/Today.js` | 198–217 |
| CycleCard variants (PROPOSED / ACCEPTED / ACTIVE / REJECTED / EDITED / CLOSED) | `js/ui/components/CycleCard.js` | 442–506 |
| CycleCard PROPOSED render | `js/ui/components/CycleCard.js` | 319–362 |
| CycleCard ACCEPTED/ACTIVE render | `js/ui/components/CycleCard.js` | 367–412 |
| Activity-list `<ul class="cycle-activities">` | `js/ui/components/CycleCard.js` | 348–358, 397–408 |
| Column-header strip (`role="row"` table semantics) | `js/ui/components/CycleCard.js` | 305–314 |
| Per-row render | `js/ui/components/ScheduledActivityBlock.js` | 183–end |
| WeekGrid hour-grid render | `js/ui/components/WeekGrid.js` | 203–235 |
| WeekGrid day-column render (5x in a loop) | `js/ui/components/WeekGrid.js` | 121–172 |
| WeekGrid block render | `js/ui/components/WeekGrid.js` | 73–104 |
| WeekGrid hour-rail render | `js/ui/components/WeekGrid.js` | 182–188 |
| Pure positioning math | `js/ui/weekGridMath.js` | 24–155 |
| `parseMinutesOfDay` | `js/ui/weekGridMath.js` | 40–56 |
| `topOffsetPx` / `heightPx` | `js/ui/weekGridMath.js` | 82–103 |
| `nowLineOffsetPx` | `js/ui/weekGridMath.js` | 120–136 |
| `hourRailLabels` | `js/ui/weekGridMath.js` | 146–155 |
| Edit-mode pure helpers | `js/ui/editMode.js` | 1–842 |
| `applyDurationChange` (cascade) | `js/ui/editMode.js` | 378–448 |
| `applyStartTimeChange` (cascade + overlap guard) | `js/ui/editMode.js` | 590–675 |
| `computeStartTimeImpact` (preview) | `js/ui/editMode.js` | 695–757 |
| Backward-overlap guard / `OVERLAPS_PRIOR` | `js/ui/editMode.js` | 614–636 |
| `EDIT_CHANGE_DURATION` handler | `js/app.js` | 1408–1455 |
| `EDIT_CHANGE_START_TIME` handler | `js/app.js` | 1463–1566 |
| `EDIT_SELECT_SLOT` handler | `js/app.js` | 1225–1242 |
| `EDIT` (enter edit mode) handler | `js/app.js` | 1193–1218 |
| `EDIT_COMMIT` / `EDIT_CANCEL` handlers | `js/app.js` | 1601–1627 |
| `commitEdit` repository write | `js/services/ComposerService.js` | 463–599 |
| Lunch block (capacity-neutral, `bucket: null`) | `js/composer/lunchBlock.js` | 22–95 |
| `change` event delegate for `<input type="time">` | `js/app.js` | 2775–2785 |
| Keyboard shortcuts (Esc, Ctrl+Z, Arrow keys) | `js/app.js` | 2737–2760 |

`weekGridMath.js` helpers are pure, dependency-free, and already exported
individually; they are the canonical reuse target.

---

## 3. Target state — recommended option

### Recommendation: **Option (b) — extract a shared `TimeGridDay` component**

Both `WeekGrid` and the new `TodayGrid` render exactly one column-of-blocks
each, just at different counts. Generalising `WeekGrid` to take an
arbitrary day-array (Option a) is tempting but couples Week's 5-column
grid CSS template to the Today render. Duplicating the column logic in a
fresh component (Option c) re-implements `renderDayColumn` /
`renderBlock` / `renderHourRail` and instantly introduces drift risk on
the next change to either.

**Extract** `renderDayColumn` and `renderBlock` from `WeekGrid.js` into a
new `js/ui/components/TimeGridDay.js`. `WeekGrid` calls it 5 times in a
row across columns; `TodayGrid` calls it once in a single-column shell
that adds the drag overlay and click-empty-time hit zone.

```
TimeGridDay({ day, dayIdx, gridStartHour, gridEndHour, rowHeightPx,
              nowIso, kaizenTitleById, dragMode })
  → renders <div class="tg-day-col"> with header + timeline + blocks +
    optional now-line.

WeekGrid({...}) → 5x TimeGridDay()  (loop; existing wrapper unchanged)
TodayGrid({...}) → 1x TimeGridDay() + drag controller + click-empty hit zone
                   + edit/commit triad pass-through
```

Day shape consumed by `TimeGridDay` (post-refactor):
```
{ date: 'YYYY-MM-DD', state: 'PROPOSED'|..., activities: ScheduledActivity[] }
```

Today derives this shape from `activeState.composition` +
`activeState.activities` in `Today.js` (same as Iter 25's existing flow).
Week already supplies it via `weekly.days`.

**Tradeoff acknowledged:** option (b) costs one extraction commit before
the calendar feature lands. That extraction is mechanical and fully
test-covered by the existing `WeekGrid.test.js` (no behavioural change
expected). Option (c) is faster on day 1 and bites every later change.

---

## 4. Component changes table

| File | Change | LOC est. | §6.5 hit |
|---|---|---|---|
| `js/ui/components/TimeGridDay.js` | NEW — extracted from `WeekGrid.renderDayColumn` + `renderBlock` | +160 | no |
| `js/ui/components/WeekGrid.js` | Replace inline `renderDayColumn` body with `TimeGridDay({...})` call; keep the 5-col CSS shell | -100 / +20 | no |
| `js/ui/components/TodayGrid.js` | NEW — single-day calendar surface; consumes `TimeGridDay` + drag overlay + click-empty hit zone | +220 | no |
| `js/ui/components/TodayGrid.dragController.js` | NEW — pointer-events drag state machine; emits actions | +180 | no |
| `js/ui/components/CycleCard.js` | Replace `renderActivityList` + `renderActivityColumnHeaders` calls with `TodayGrid({...})` for PROPOSED / ACCEPTED / ACTIVE / EDITED / CLOSED variants. Keep header / triads / disclosures / footer untouched. | -50 / +30 | no |
| `js/ui/components/ScheduledActivityBlock.js` | Keep file (still used by drag-mode hit-tests + accessibility list fallback). Its rendered class set extended for `tg-block` co-rendering. Marginal change. | +20 | no |
| `js/ui/pages/Today.js` | No structural change; props pass-through gains `dragState` if drag-pending semantics chosen (§6 path b). | +5 / -0 | no |
| `js/ui/weekGridMath.js` | NEW pure helpers: `pxToMinutes(deltaY, rowHeightPx)`, `snapMinutes(value, stepMinutes)`, `clampToGridWindow(...)`. | +60 | no |
| `js/app.js` | NEW handlers: `EDIT_DRAG_BEGIN`, `EDIT_DRAG_MOVE`, `EDIT_DRAG_END`, `EDIT_DRAG_CANCEL`, `EDIT_INSERT_AT_TIME`. Reuse existing `EDIT_CHANGE_DURATION` and `EDIT_CHANGE_START_TIME` for commit. | +160 | no |
| `app.css` | NEW styles: `.tg-day-col`, `.tg-block`, `.tg-block-dragging`, `.tg-now-line`, `.tg-resize-handle`, `.tg-empty-hit`, `.tg-drop-shadow`. Adapt the existing `.wg-*` rules where possible by sharing rule selectors via grouping. | +180 | no |
| `tests/ui/components/TimeGridDay.test.js` | NEW — existing WeekGrid block coverage moves here | +250 | no |
| `tests/ui/components/TodayGrid.test.js` | NEW — single-day render + drag-overlay markup | +200 | no |
| `tests/ui/components/TodayGrid.dragController.test.js` | NEW — pointer-event sequence → action sequence | +260 | no |
| `tests/ui/weekGridMath.test.js` | EXTEND — add tests for `pxToMinutes`, `snapMinutes`, `clampToGridWindow` | +90 | no |
| `tests/integration/today-drag-cascade.test.js` | NEW — drag-resize a slot, assert downstream cascade matches `applyDurationChange` semantics | +180 | no |
| `tests/ui/components/CycleCard.test.js` | UPDATE — table-layout assertions (`sa-col-headers`, `<ul class="cycle-activities">`) replaced by calendar-layout assertions (`<div class="tg-day-col">`, `<article class="tg-block">`) | +40 / -30 | no |
| `tests/ui/components/WeekGrid.test.js` | UPDATE — assertions referencing inline column markup now pass through `TimeGridDay` (selectors stay class-based; no breakage expected) | +0 / -0 | no |

**Total LOC estimate:** approximately **+1755 / -180 net (~+1575 LOC)**.
Splitting the test bulk: ~880 net production LOC across new components +
handler additions, ~1000 LOC of new/updated test files.

**§6.5 hit count: 0 files.** All changes live under `js/ui/`,
`js/app.js` (handler registration only — does not modify
composer/engine/types/events imports), `app.css`, and `tests/`.

---

## 5. Drag-and-drop implementation strategy

### Recommendation: **pointer-events** (no library, no HTML5 native drag)

Rationale:
- BAM-X is no-runtime-dependencies vanilla JS. Adding a drag library
  contradicts the operating principle.
- HTML5 native drag (`draggable=true`, `dragstart`/`dragover`/`drop`) has
  well-known mobile / iOS gaps and forces ghost-image management on the
  browser. Recovery-cost from any quirk is high.
- Pointer-events (`pointerdown` / `pointermove` / `pointerup` /
  `pointercancel`) unify mouse + touch + pen, work in every supported
  browser, and let us own the visual ghost as a normal absolutely-
  positioned `<article class="tg-block tg-block-dragging">`.
- The drag math is just `pxToMinutes(deltaY)` against the existing
  `rowHeightPx` constant — it composes with `weekGridMath.js`.

### Drag controller responsibilities (pure-ish module)

`js/ui/components/TodayGrid.dragController.js` exports:

```
beginDrag({ activityId, mode, startY, startTopPx, startHeightPx, snapMinutes })
  // mode: 'MOVE' | 'RESIZE_TOP' | 'RESIZE_BOTTOM'
updateDrag({ session, currentY })
  → { ghostTopPx, ghostHeightPx, candidateStartHHMM, candidateDurationMinutes }
endDrag({ session })
  → { activityId, mode, finalStartHHMM, finalDurationMinutes }
cancelDrag({ session })
  → { activityId } // restores prior state
```

The controller is a pure state-transition function over a `session`
object the caller keeps in component-local state. No DOM access in the
helper module — `TodayGrid.js` is the only file that touches
`getBoundingClientRect()` and pointer event listeners.

### Existing actions reused

- `EDIT_CHANGE_DURATION` (`js/app.js:1408–1455`) — reused for resize commit.
- `EDIT_CHANGE_START_TIME` (`js/app.js:1463–1566`) — reused for move commit.
- `EDIT_SELECT_SLOT` (`js/app.js:1225–1242`) — fired implicitly on
  `pointerdown` so the slot becomes selected (so the drawer + duration
  chips already in the existing edit-mode reflect the dragged target).

### New actions

- `EDIT_DRAG_BEGIN { activityId, mode }` — only meaningful in commit-on-
  release path (b). In path (a) no DRAG_BEGIN action is needed.
- `EDIT_DRAG_END { activityId, mode, finalStartHHMM, finalDurationMinutes }`
  — only in path (b); fans out to `applyStartTimeChange` and/or
  `applyDurationChange` against the pending state slice.
- `EDIT_DRAG_CANCEL` — Esc during drag.
- `EDIT_INSERT_AT_TIME { hhMM, durationMinutes }` — fired by
  click-empty-time. Routes to the existing Catalog picker (see §7).

---

## 6. Drag commit semantics — both options described

### Path (a) — Immediate commit

On every `pointerup` the drag controller fires
`EDIT_CHANGE_START_TIME` and/or `EDIT_CHANGE_DURATION` directly. Each
fires the existing handler, which already pushes an undo snapshot,
runs the cascade helper, and `rerender()`s. From the user's perspective
the drag finalises in a single action; Ctrl+Z reverses it.

```
pointerdown:
  dispatch EDIT_SELECT_SLOT { activityId }
pointermove:
  // local-only ghost positioning; no actions dispatched
pointerup:
  if mode === 'MOVE':
    dispatch EDIT_CHANGE_START_TIME { activityId, value: snappedHHMM }
  else if mode === 'RESIZE_BOTTOM':
    dispatch EDIT_CHANGE_DURATION { activityId, minutes: snappedDuration }
  else if mode === 'RESIZE_TOP':
    // both at once — duration shrinks AND start moves
    // dispatch EDIT_CHANGE_DURATION first, then EDIT_CHANGE_START_TIME
    // (order matters: applyStartTimeChange overlap-guards against the
    //  POST-duration prior-end. Reverse order would reject a valid drag.)
```

**Variance audit:** identical to today's `EDIT_CHANGE_START_TIME` /
`EDIT_CHANGE_DURATION` flows — i.e., none until `EDIT_COMMIT`, at which
point `commitEdit` (`ComposerService.js:463`) writes the new activities
and the existing `EditDrawerOpened` analytic remains the only event in
the loop. **No new event needed for path (a).**

**Pros:** zero new state; Undo already works; OVERLAPS_PRIOR / capacity
toasts already wired.

**Cons:** every micro-drag hits the cascade helper + rerender; high
churn in undo stack on snappy drags; per-drag rerender may be jittery
on slower machines.

### Path (b) — Pending commit, user clicks Save

A new `state.editMode.dragSession` slice holds the in-progress drag.
While dragging, the activity's planned values in
`state.editMode.activities` are NOT mutated; the ghost is rendered from
`dragSession.candidate*`. On `pointerup`, the candidate is committed
into `state.editMode.activities` via `applyStartTimeChange` /
`applyDurationChange`, an undo snapshot is pushed, but the user must
still click the existing `EDIT_COMMIT` triad to persist (just like
duration chips today).

```
state.editMode = {
  ...,
  dragSession: null | {
    activityId, mode, startedAtIso,
    initialStartHHMM, initialDurationMinutes,
    candidateStartHHMM, candidateDurationMinutes,
    isViolating: boolean   // OVERLAPS_PRIOR / wouldExceedCapacity preview
  }
}
```

```
pointerdown → EDIT_DRAG_BEGIN
  state.editMode.dragSession = {...}
  rerender (ghost shown)
pointermove → drag controller updates dragSession in-place (no rerender
              per-frame; we requestAnimationFrame and only update CSS
              transforms on the ghost element via direct style mutation
              to keep 60fps drag)
pointerup → EDIT_DRAG_END
  if violating: showToast(ERROR); reset; return
  apply applyStartTimeChange and/or applyDurationChange into
    state.editMode.activities
  push undo snapshot
  state.editMode.dragSession = null
  rerender
```

**Variance audit:** still none during drag. The eventual `EDIT_COMMIT`
runs `ComposerService.commitEdit` exactly as today and emits the
existing `CycleEdited` event with the swap diff. **No new event needed
for path (b) either.**

**Pros:** smooth visual; can show conflict overlay while dragging;
users who drag-then-undo never see UI flash; lower undo-stack churn.

**Cons:** new state slice; rerender pause during drag means the cascade
of butting-up downstream slots is not visible until release (UX may
prefer live cascade — solvable with a "preview cascade" pure pass on
each move that returns shifted positions for the ghost overlay only).

### Architect recommendation

**Path (b) — pending commit.** Reasons:

1. Calendar gestures encourage micro-corrections; path (a) treats every
   2px move as a committed edit and pollutes the undo stack.
2. Path (b) gives us a place to show the "would overlap" conflict
   warning *during* the drag (using `computeStartTimeImpact` /
   `computeDurationImpact` already in `editMode.js:469–511, 695–757`),
   which is the single largest UX win calendar users expect.
3. Path (b) cost is one new state slice plus four new handlers, all
   localised; path (a) cost is the rerender-jitter risk plus the
   undo-bloat across an ergonomic gesture.

Phil should confirm. Both paths leave §6.5 untouched.

---

## 7. Click-empty-time routing

### Recommendation: **open the existing Catalog picker (EditDrawer) pre-
positioned with an inferred start time, then on Catalog selection emit
a new `EDIT_INSERT_AT_TIME` action that materialises the activity at
that start time.**

```
click on .tg-empty-hit
  → handler EDIT_INSERT_AT_TIME_INTENT { hhMM }
  → if not already in edit mode: enter edit mode (mirror EDIT_QUICK_UPDATE)
  → set state.editMode.insertIntent = { hhMM }
  → rerender (drawer already opens because editMode is non-null)
  → user picks catalog entry in drawer
  → existing drawer flow currently calls EDIT_ADD_SLOT (js/app.js:1294)
    which appends; we extend that handler to read insertIntent and pass
    plannedStartAt into activityFromCatalogEntry instead of leaving null.
```

### Inserted activity's bucket

The bucket is the **catalog entry's bucket** — the picker lets the user
choose. There is no inference from time-of-day; respecting the user's
explicit catalog selection avoids surprising bucket-floor violations.

### Default duration

`catalogEntry.defaultDurationMinutes`. Already the default in
`activityFromCatalogEntry` (`editMode.js:97–101`). No change.

### Alternatives considered

- **Generic "Untitled" block insertion.** Rejected. Activities without
  a `catalogEntryId` break the explain ledger, the artifact resolver
  (`CycleCard.js:467–474`), the kaizen-link chip, and most of the
  variance audit. The system is built around catalog entries. A
  freeform block is a separate product decision and out of scope here.
- **Quick-add modal with name field.** Rejected for the same reason
  plus the existing drawer is already the canonical add path.

---

## 8. Edit-mode reconciliation

### The core question

Existing edit-mode is **a discrete state**: open drawer → select slot →
swap / chip-change duration → commit/cancel. Calendar drag is
**continuous**.

### Recommendation: **drag enters edit-mode automatically** (lazy enter).

`pointerdown` on a non-protected `.tg-block` does this in order:

1. If `state.editMode === null`, dispatch the same logic as
   `EDIT_QUICK_UPDATE` (`js/app.js:1248–1293`) — enters edit mode for
   the active composition, snapshots current activities.
2. Dispatch `EDIT_SELECT_SLOT { activityId }` so the drawer reflects
   the dragged target.
3. Begin the drag session.

This keeps three mental models in lockstep (drawer + duration chips +
calendar drag are all surfaces of the same edit session) and reuses the
existing snapshot/cascade/commit/cancel/undo machinery without
modification.

### Protected blocks during drag

`isProtectedBlock(activity)` (`editMode.js:58–66`) is checked at
`pointerdown`. Protected → cancel the drag immediately, surface the
existing toast ("This block can't be changed"). Path is identical to
how the row-select interaction protects the same blocks today.

### Lunch block (`bucket: null`)

Lunch is currently NOT protected (`isNonOptional: false`,
`isAnchor: false` per `lunchBlock.js:84–86`). It is movable AND
resizable. That is acceptable for the MVP; if Phil wants lunch pinned,
add `'recovery_lunch'` to `PROTECTED_CATALOG_IDS` (`editMode.js:24–31`)
or surface it as a separate "soft anchor" concept (defer; not in this
delta).

### Cancel / Commit / Undo

Unchanged. `EDIT_CANCEL` still throws away the session including any
drag-applied changes (because they live in `state.editMode.activities`,
not in the persisted store). `EDIT_COMMIT` writes via
`ComposerService.commitEdit`. `EDIT_UNDO` pops the undo stack — drag
operations push one snapshot per `pointerup` (path b) or one per
`EDIT_CHANGE_*` handler call (path a).

---

## 9. Lunch block calendar treatment

### Visual distinction

Lunch (`bucket: null`, `slotKind: 'LUNCH'`) cannot use the existing
`bucketMeta(bucket)` chipClass because the bucket is null. New CSS
class: `.tg-block-lunch` with a neutral tone (taupe / desaturated),
no bucket chip in the header, an italicised "Lunch" label.

### Positioning

Identical to any other block: `topOffsetPx(plannedStartAt)` + `heightPx
(plannedDurationMinutes)`. The math doesn't care about bucket.

### Capacity counters

The lunch row is intentionally excluded from `computePlannedByBucket`
(`editMode.js:173–184`) because it filters `if (!(b in sums)) continue;`
and `sums` only knows the three real buckets. Confirmed working as-is.
TodayGrid does NOT need a special-case branch.

### Drag rules

- Movable: yes (default).
- Resizable: yes (default).
- Protected: not by default. See §8 if Phil wants to pin it.

---

## 10. Conflict / overlap detection

### Engine status

`js/engine/orderDay.js:196` is the only mention of "overlap" in the
engine, and it is internal to the packer (not callable from UI). The
engine does NOT expose a generic overlap predicate. `applyStartTimeChange`
already implements a backward-shift overlap guard
(`editMode.js:614–636`) that throws `OVERLAPS_PRIOR` with
`priorEndHHMM`. No bidirectional / arbitrary-overlap helper exists.

### Recommendation: extend `editMode.js` with a pure helper

Add (pure, no I/O):

```
detectOverlap(activities, candidateActivityId, candidateStartMinutes,
              candidateDurationMinutes)
  → null | { againstId, againstStartHHMM, againstEndHHMM, side: 'PRIOR' | 'NEXT' }
```

Used by the drag controller during `pointermove` to update
`session.isViolating` and paint the ghost red. Used by `EDIT_DRAG_END`
to refuse the commit on the violating side.

This is a UI-layer pure helper, not a domain helper. Lives in
`editMode.js` next to the existing `computeStartTimeImpact`.
**Zero §6.5 impact.**

### Capacity violation (post-18:00)

Already handled via `wouldExceedCapacity` in
`computeDurationImpact` / `computeStartTimeImpact`. Reuse during drag
preview; no new code.

---

## 11. Test strategy

### Unit tests (new pure helpers)

- `pxToMinutes` boundary cases: 0px, exact rowHeightPx, fractional,
  negative.
- `snapMinutes` (5/15-min snap): on-snap, off-snap, exact half.
- `clampToGridWindow`: pre-window, post-window, exact bounds.
- `detectOverlap`: own slot excluded; prior-collision; next-collision;
  exact-edge (no overlap); empty list; invalid inputs.

Estimate: **~80 new test cases** in `tests/ui/weekGridMath.test.js` +
new `tests/ui/editMode.detectOverlap.test.js`.

### Drag controller (pure module)

- `beginDrag` returns expected initial session.
- `updateDrag` for MOVE: ghost top moves; height stable.
- `updateDrag` for RESIZE_BOTTOM: top stable; height moves.
- `updateDrag` for RESIZE_TOP: both move.
- `endDrag` returns final HH:MM and minutes (snap applied).
- `cancelDrag` returns activityId only.

Estimate: **~30 cases**, `tests/ui/components/TodayGrid.dragController.test.js`.

### Integration tests

- `pointerdown` on a non-protected block enters edit mode if not open
  (mirroring `EDIT_QUICK_UPDATE`).
- `pointerdown` on a protected block fires the toast and does not
  start a drag.
- Full drag-resize sequence updates downstream activities via
  `applyDurationChange` cascade.
- Full drag-move sequence updates downstream activities via
  `applyStartTimeChange` cascade.
- Drag into overlap region surfaces the conflict; `pointerup` rejects
  the commit; toast shown.
- Click empty time → drawer opens with insertIntent → catalog selection
  → block appears at the clicked HH:MM.
- Esc during drag cancels; original positions restored.

Estimate: **~12 integration tests**,
`tests/integration/today-drag-cascade.test.js` + new
`tests/integration/today-click-empty.test.js`.

### Regression tests

- `WeekGrid` snapshot equivalence pre/post `TimeGridDay` extraction.
- `CycleCard.test.js` updated for the new calendar markup; assertions
  that previously matched `cycle-activities` / `sa-col-headers` rewritten.

### Total test delta

**~+125 new test cases / ~+55 updated cases.** Estimate ~1000 LOC of
new+updated test code (already counted in §4).

---

## 12. Blast radius

### Tests that assert the table layout (must update)

| File | Hits | Impact |
|---|---|---|
| `tests/ui/components/CycleCard.test.js` | 4 (selectors `cycle-activities`, `sa-block`, `<ul>`, `<li>`) | Replace selectors with `tg-day-col` / `tg-block` |
| `tests/ui/pages/Today.ccc.test.js` | 9 | Same — table-layout assertions move to grid markup |
| `tests/ui/components/ScheduledActivityBlock.test.js` | 23 | Mostly unaffected — block still renders an `<article>` per row; class set extended (`tg-block` added). Tests asserting parent `<li>` need a wrapper-tag relax. |
| `tests/ui/components/ScheduledActivityBlock.editMode.test.js` | 2 | Same wrapper-tag relax |
| `tests/ui/components/ScheduledActivityBlock.timeEditor.test.js` | 9 | Same |
| `tests/integration/duration-cascade-time-display.test.js` | 6 | Time-display assertions assert rendered HH:MM strings and should pass unchanged; if any selector targets `.cycle-activities` it migrates. |
| `tests/ui/components/BucketStrip.test.js` | 2 | Already removed from Today render; unchanged but verify. |
| `tests/ui/components/InfeasibleBanner.test.js` | 2 | Unaffected (banner unchanged). |

### Files NOT in scope (must not change)

- `js/composer/**` (composeDaily, composeWeekly, lunchBlock, …)
- `js/engine/**` (orderDay, capacity, infeasibility)
- `js/domain/types.js`
- `js/events/events.js`
- `js/services/ComposerService.js` other than calls already wired
- `js/services/ActivityService.js`
- `js/services/VarianceService.js`

### Quantified

- **~12 test files updated**, ~55 assertions rewritten (selector
  migration). Mechanical; no semantic change.
- **0 production files in §6.5 modified.**

---

## 13. §6.5 boundary check

Confirmed boundary-clean. Per the recon's prediction:

| Path | Why touch is forbidden | This delta touches it? |
|---|---|---|
| `js/composer/**` | Composer is read-only after PROPOSED; calendar drag mutates ScheduledActivity, not the composition input | NO |
| `js/engine/**` | Engine is the math kernel for ordering / capacity; drag is a UI layer concern | NO |
| `js/domain/types.js` | Sacred zone for entity contracts; drag adds no fields | NO |
| `js/events/events.js` | Variance contracts; drag reuses `CycleEdited` via existing `commitEdit` | NO |
| `js/services/ComposerService.js` | Already exposes `commitEdit`; drag commits via the same path. No new method needed. | NO |

Action handlers (`EDIT_DRAG_*`, `EDIT_INSERT_AT_TIME`) live in `app.js`,
which is **outside** §6.5. Repository writes go through the existing
`ComposerService.commitEdit` (`ComposerService.js:463`), unchanged.

**Zero §6.5 hits expected.**

---

## 14. Phil-authority queue

Architect cannot resolve unilaterally. Each item blocks finalisation of
the corresponding section.

1. **Q1: Drag commit semantics.** Architect recommends path (b)
   pending-commit with a live-conflict-overlay during drag. Phil to
   confirm or pick path (a). (§6)

2. **Q2: Click-empty-time payload.** Architect recommends routing
   through the existing `EditDrawer` Catalog picker, with a new
   `state.editMode.insertIntent` slice. Phil to confirm vs. quick-add
   modal alternative. (§7)

3. **Q3: Lunch protection.** Currently movable + resizable. Phil to
   confirm (default = movable) or upgrade to "soft anchor" /
   protected. (§8, §9)

4. **Q4: Snap granularity.** Architect proposes 5-minute snap
   (matches Outlook default). Phil to confirm vs. 15-minute (matches
   Google Calendar default) vs. user-configurable. (§5)

5. **Q5: Drag enters edit mode automatically?** Architect recommends
   yes — auto-enter (§8). Phil to confirm vs. requiring an explicit
   "Edit" click first.

6. **Q6: Should TodayGrid render in non-editable states (PROPOSED
   pre-Accept, ACCEPTED, ACTIVE, CLOSED) or only when editable?**
   Architect recommends rendering in all states; only ACCEPTED/EDITED
   admit drag (PROPOSED pre-Accept already runs through Edit mode for
   any change anyway; ACTIVE / CLOSED render read-only — drag handles
   are hidden). Phil to confirm.

7. **Q7: Hour-grid window for Today.** WeekGrid uses 07:00–19:00.
   Architect recommends Today reuse those defaults. Phil to confirm or
   widen (e.g. 06:00–22:00).

8. **Q8: Path (b) per-frame cascade preview.** During drag, do we
   compute and render the downstream cascade for every `pointermove`
   (so the user sees the butting-up slots shift live), or only on
   release? Architect recommends live preview when feasible (cheap;
   `applyStartTimeChange` is ~ms over 10–15 rows). Phil to confirm.

---

## 15. Open architectural questions

Top 5 (architecture-level, must be resolved before commit):

1. **Should the `TimeGridDay` component own the now-line, or should
   that live in the `TodayGrid` shell?** WeekGrid currently renders the
   now-line inside the column. Today only has one column, so the
   distinction is academic — but if we ever add a multi-day Today
   ("today + tomorrow side-by-side"), the answer matters. **Architect
   leaning:** keep now-line inside `TimeGridDay` (consistent with
   WeekGrid).

2. **Drag overlap with the `EditDrawer` open simultaneously.** When a
   user drags a block while the drawer is open, do we (a) keep the
   drawer visible, (b) auto-collapse it during drag, (c) ignore? The
   drawer covers ~30% of the right column on smaller screens.
   **Architect leaning:** keep visible; the drawer's `position: fixed`
   slide-over is already on its own layer.

3. **Touch behaviour on the day column.** Pointer-events handle touch,
   but should the *page* scroll vs. the *grid* scroll vs. the *block*
   drag during a touch sequence? The `tg-day-col` will contain
   absolutely-positioned blocks against an hour rail taller than the
   viewport. **Architect leaning:** allow page scroll except when the
   pointer-down originated on a `.tg-block` or a resize handle; then
   capture and prevent page scroll until pointerup.

4. **Multiple compositions in a single rendered day.** Today only ever
   renders one Composition. If a future product change introduces
   "side-by-side compositions" (e.g. compare yesterday vs. today),
   does `TodayGrid` accept an array? **Architect leaning:** keep
   single-composition for now; defer to a `TodayGrid` v2 if needed.

5. **Drag rejection UX when commit-time validation throws.** Path (a)
   surfaces the toast and reverts via the existing
   `EDIT_CHANGE_START_TIME` rollback (`app.js:1518–1556`). Path (b)
   needs the equivalent: ghost snaps back, toast shows, dragSession
   cleared. The `OVERLAPS_PRIOR` rejection already has copy
   ("Would overlap prior block (ends HH:MM). Pick a later time."),
   reusable verbatim. **Architect leaning:** identical copy + a
   200ms ghost-snap-back animation.

---

## 16. Delivery sequencing

1. **Sprint N (foundation):** Extract `TimeGridDay` from `WeekGrid`.
   No behavioural change. Update `WeekGrid.test.js`. **Greenlight gate:
   all tests green.**
2. **Sprint N+1 (read-only Today calendar):** Build `TodayGrid` (no
   drag). CycleCard wires it for PROPOSED / ACCEPTED / ACTIVE /
   EDITED / CLOSED. Update CycleCard tests + Today tests for new
   markup. **Greenlight gate: every existing flow still works through
   the new layout.**
3. **Sprint N+2 (drag-resize / drag-move):** Add the drag controller +
   handlers (path b). Add `detectOverlap` + new `weekGridMath` helpers.
   Live cascade preview during drag. **Greenlight gate: drag against
   protected / lunch / non-protected slots all behave per §8 and §9.**
4. **Sprint N+3 (click-empty-time):** Add `EDIT_INSERT_AT_TIME_INTENT`
   path; wire to drawer's existing Add-new flow. **Greenlight gate:
   inserted activity persists through `commitEdit`, lunch + capacity
   stay correct.**

---

## 17. Risk register

| Risk | Probability | Mitigation |
|---|---|---|
| Pointer-events differs across iOS Safari mobile vs. desktop | medium | Use the standard pointer events polyfill pattern; only use `pointerdown`/`move`/`up`/`cancel` (universally supported) and feature-detect `setPointerCapture`. |
| Drag rerender jitter (path b mitigates this; path a is the risk) | medium | Recommendation already path (b). |
| `applyStartTimeChange` cascade order breaks RESIZE_TOP commit | medium | Test sequencing: change duration first, then start. Documented in §6 path (a) pseudocode. |
| Test selector churn breaks CI on extraction commit | low | TimeGridDay extraction is mechanical; classes preserved (`wg-block` and `tg-block` co-render during transition). |
| `bucket: null` lunch row breaks the new `detectOverlap` helper | low | `detectOverlap` is bucket-agnostic; tested explicitly. |
| Phil decides path (a) after path (b) is built | low | Both paths reuse the same handlers; reverting to (a) means deleting `dragSession` slice and routing pointerup directly to existing handlers. ~4hrs. |

---

End of document.
