# UX_TODAY_CALENDAR_QA.md
## Quality and Risk Assessment — Today Page Calendar Conversion
**Artifact date:** 2026-04-30
**Baseline suite:** 3,036 tests / 0 failing / 3.39 s (per-test p50 0.94 ms; ceiling 1.5 ms)
**Phasing:** Phase 1 = visual calendar (read-only); Phase 2 = drag-and-drop; Phase 3 = click-empty-time

---

## 1. Test Inventory by Phase

### 1.1 Tests referencing `.sa-block` selector

**Files:** `ScheduledActivityBlock.test.js` (2 direct hits), `CycleCard.test.js` (2 hits: presence count + absence guard).

| File | Test | Phase 1 Impact |
|---|---|---|
| `ScheduledActivityBlock.test.js:54` | `renders an <li> with sa-block class` | BREAKS — grid uses `.wg-block`, not `.sa-block` on `<li>` |
| `ScheduledActivityBlock.test.js:56` | asserts `class="sa-block` on `<li>` | BREAKS |
| `CycleCard.test.js:139` | counts `sa-block` occurrences by regex | BREAKS if `<ul class="cycle-activities">` is replaced |
| `CycleCard.test.js:323` | asserts `sa-block` absent in rejected state | PASSES (still absent); low risk |

**Total breakage: 3 tests broken, 1 still passes.**

`ScheduledActivityBlock` itself is a table-row component. If Phase 1 replaces the activity list with a `TodayGrid` (WeekGrid-style), `ScheduledActivityBlock` becomes a dead code path for the calendar view and all 80+ tests in its 6 files become tests of a component no longer used on the Today page. They do not break (the component still exists), but they no longer validate what the user sees.

### 1.2 Tests referencing table column headers

**Files:** `Today.test.js` (7 direct hits), `CycleCard.test.js` (6 direct hits), `Today.ccc.test.js` (1 indirect hit via `sa-col-headers`).

| Test | Column text asserted | Phase 1 Status |
|---|---|---|
| `Today.test.js` AC4 ×5 | Time of Day, Focus Area, Standard Work Name, Planned Duration, Expected Output | ALL BREAK |
| `Today.test.js` AC5 | `role="columnheader"` | BREAKS |
| `Today.test.js` AC6b | `EDIT_QUICK_UPDATE` absent in PROPOSED | Needs re-evaluation — update column gone |
| `CycleCard.test.js` headers ×6 | same 5 columns + columnheader | ALL BREAK |
| `Today.ccc.test.js:273` | `sa-col-headers` presence | BREAKS |

**Total breakage: 14 tests broken outright by column header removal.**

### 1.3 Tests covering edit-mode actions

**Files:** `app.sprint12.test.js` (25 tests), `app.sprint13.test.js` (18 tests), `ScheduledActivityBlock.editMode.test.js` (10 tests), `integration/edit-mode.test.js` (4 tests), `ScheduledActivityBlock.durationChips.test.js` (16 tests).

These tests operate at the action-handler and component levels. Phase 1 does not change the action layer; all handler tests pass unchanged. Component tests (`EDIT_SELECT_SLOT`, `EDIT_REMOVE_SLOT`) will fail only if the block element type changes from `<li class="sa-block">` to `<article class="wg-block">`. The select/remove data-action attributes must move to `.wg-block` elements.

Phase 2 requires new actions (`DRAG_START`, `DRAG_MOVE`, `DRAG_COMMIT`, or equivalent). Existing `EDIT_CHANGE_DURATION` has no dedicated test in the suite — the duration-chip tests in `ScheduledActivityBlock.durationChips.test.js` cover the render side only.

**Phase 1:** ~12 tests may break on element-type/class assertions; action-handler tests survive intact.
**Phase 2:** 0 existing pointer-event tests. All drag action coverage is net-new.

### 1.4 CCC proxy test (`Today.ccc.test.js`)

The CCC registry has exactly 3 regions: `today-header`, `cycle-card`, `cycle-activities`. The calendar grid, whether `TodayGrid` or a renamed `WeekGrid`, will still live inside `cycle-card` or an adjacent wrapper. If `cycle-activities` is removed in favor of the grid, the lower-bound test (`CCC >= 3`) breaks immediately.

**Recommended action:** Add `today-grid` (or chosen selector) as a fourth REGIONS entry and update the lower bound to `>= 3` with the new region name replacing `cycle-activities`, or keep `cycle-activities` as the wrapper class around the grid.

**Expected status if class names preserved:** PASS. If `cycle-activities` wrapper is dropped: 2 tests break.

---

## 2. Regression Risk Surface — Phase 1 (Visual Calendar)

### 2.1 Loss of column-oriented data (Expected Output, etc.)

The Expected Output column is sourced from `outputArtifact.name` on each `ScheduledActivityBlock`. The WeekGrid's `renderBlock` function does not render `outputArtifact` — it renders only `wg-block-time`, `wg-block-name`, `wg-block-dur`, and an optional Kaizen chip. On a 60 px/hour grid, a 30-minute block is 30 px tall — there is no room for a fifth text line.

The 14 column-header tests (section 1.2) and the 6 `sa-artifact` tests in `ScheduledActivityBlock.test.js` all break if the artifact column is not surfaced elsewhere (e.g., a detail tooltip or side-panel). This is not a test problem; it is a real UX regression: Expected Output data is no longer visible to the user at a glance.

**Severity: HIGH** — information visible today disappears from the primary view.

### 2.2 Lunch block (`bucket: null`)

`WeekGrid.renderBlock` calls `bucketMeta(bucket ?? '')` — the null-coalesce converts `null` to an empty string. `bucketMeta('')` falls through to the `UNKNOWN` branch, returning `chip-unknown`. The block renders with a neutral gray chip and no bucket label. This is graceful degradation, not a crash.

However, no existing test exercises `WeekGrid` with a `bucket: null` activity. The only lunch-block render test is `ScheduledActivityBlock.test.js:762` which tests the table-row path.

**Gap:** Add a `TodayGrid` (Phase 1 component) unit test: lunch block with `bucket: null` renders with `chip-unknown` and visually distinct treatment (e.g., `data-bucket="null"` or a `.wg-block-lunch` modifier class).

### 2.3 Edit-mode behavior with calendar layout

Edit mode currently operates via `editMode` prop passed to `CycleCard`, which renders `<li class="sa-block edit-selectable">` rows. If `CycleCard` is replaced by `TodayGrid`, the edit drawer (`EditDrawer`) must persist as an overlay and the block elements must carry `EDIT_SELECT_SLOT` / `EDIT_REMOVE_SLOT` data-actions.

The Sprint 14 configurable start-time editor (`ScheduledActivityBlock.timeEditor.test.js`, 12 tests) also targets the table row. If the start-time field moves to the drag handle or a click-on-block popover, those 12 tests need rerouting.

**Gap:** Phase 1 must define where edit-mode chrome lives on a `.wg-block` element before a calendar-aware edit-mode test suite can be written.

### 2.4 Browser compatibility

`WeekGrid` uses CSS `position: relative` on `.wg-timeline` and `position: absolute` with inline `top`/`height` on each `.wg-block`. This layout strategy is supported in all browsers with >0.5% share. No grid-template-rows polyfill is needed for the absolute-positioning pattern. The `.wg-grid` outer uses CSS grid only for the hour rail + day columns, which is universally supported (Chrome 57+, Firefox 52+, Safari 10.1+).

**Risk: LOW** — the WeekGrid pattern is already running in production on the Week page.

---

## 3. Regression Risk Surface — Phase 2 (Drag-and-Drop)

### 3.1 Pointer-event test coverage

Current suite has **zero** pointer-event tests. `canRebucket.test.js` uses the word "drag" in a domain-logic context only. No `pointerdown`, `pointermove`, or `pointerup` event simulation exists.

### 3.2 Drag during INFEASIBLE state

`Today.js` renders `InfeasibleBanner` when `infeasible` is set; the `cycle-activities` list is absent. A drag handler attached to `.wg-block` cannot fire because no grid is rendered. Risk: if the grid IS rendered behind the banner (e.g., for context), dragging a block could call `DRAG_COMMIT` on a composition that is in an infeasible state. The action handler must guard: reject drag commits when `composition.state === 'INFEASIBLE'` or when `activeState === null`.

### 3.3 Drag during IN_PROGRESS activity

An activity with `state === 'IN_PROGRESS'` has `actualStartAt` set. Moving its block changes `plannedStartAt` but cannot retroactively change `actualStartAt`. This creates a data inconsistency: the planned time no longer matches when the activity actually started. The drag handler must either block dragging of `IN_PROGRESS` blocks entirely (safest) or post a warning. No test currently covers this invariant.

### 3.4 Snap-to-grid math

`weekGridMath.js` provides `topOffsetPx` and `heightPx` as pure functions. The inverse — converting a pixel offset back to a `HH:MM` wall-clock time — does not exist in the module. Snap-to-grid requires:

```
snappedMinutes = Math.round((pixelOffset / rowHeightPx) * 60) + gridStartHour * 60
```

This is a pure math operation that needs dedicated unit tests covering: exact on-the-hour, half-hour boundary, quarter-hour (if grid supports it), before-grid-start clamp, after-grid-end clamp, and fractional-pixel inputs.

### 3.5 Conflict detection

Two activities cannot occupy the same time slot. The composer enforces this at composition time, but drag-and-drop creates an intermediate state where the preview block may visually overlap another block. Conflict detection is needed at preview time (show warning) and at commit time (reject or reflow). No conflict-detection utility exists yet; it needs unit tests for: exact overlap, partial overlap, adjacent (no overlap), and multi-block chain conflicts.

---

## 4. Regression Risk Surface — Phase 3 (Click-Empty-Time)

### 4.1 Distinguishing click from drag

The standard threshold is a 5 px movement budget: if `pointerup` fires within 5 px of `pointerdown`, it is a click; otherwise it is a drag. This threshold must be a named constant and tested at the boundary (4 px = click, 6 px = drag, exactly 5 px = implementation-defined, must be consistent).

### 4.2 What gets inserted

The behavior on click-empty-time is unresolved PM decision: (a) open a catalog picker, (b) insert a default ghost block for the nearest bucket, or (c) do nothing until the user selects an activity. Each branch has different state requirements. Until resolved, no test can be written for the insertion behavior. The QA risk is writing tests against a ghost-block implementation that the PM later changes to a picker.

**Recommendation:** Gate Phase 3 tests on an explicit PM decision. Write the click-vs-drag threshold test immediately (it is decision-independent).

---

## 5. Drag-and-Drop Test Strategy

### 5.1 Model: `_doc` injection pattern from Iter 24 focusTrap tests

`tests/ui/focusTrap.test.js` demonstrates the established pattern: the production utility accepts an injectable `_doc` stub via the options object, allowing full event simulation in Node without a browser. The same pattern applies to any drag controller.

**Proposed structure for a `TodayDragController.js`:**

```js
export function createDragController(gridEl, opts = {}) {
  const _doc = opts._doc ?? document;
  // ... attaches pointerdown to gridEl, pointermove/pointerup to _doc
}
```

Tests then inject a stub `_doc` with a `listeners` map, a stub grid element with `getBoundingClientRect()` returning a fixed rect, and synthetic pointer event objects.

### 5.2 Test pointer events as pure math

Do not simulate real DOM layout. Instead:
- Express all drag logic as a function `computeDragResult({ startY, currentY, gridRect, gridStartHour, rowHeightPx, snapMinutes })` returning `{ snappedStartAt, deltaMinutes }`.
- Test this pure function exhaustively — it has no DOM dependency.
- Separately test event wiring (attach / detach / cancel) via the `_doc` stub.

---

## 6. Existing Tests That Catch Phase 1 Visual Changes

| Test file | What it catches |
|---|---|
| `Today.ccc.test.js` | CCC region count — will catch if `cycle-activities` disappears (lower bound fails) |
| `Today.ccc.test.js` | `sa-col-headers` presence — breaks immediately on Phase 1 |
| `Today.test.js` AC4 ×5 + AC5 | Column header text — all break on Phase 1 |
| `CycleCard.test.js` headers ×6 | Column header text + columnheader role — all break on Phase 1 |
| `ScheduledActivityBlock.test.js:54` | `sa-block` class on `<li>` — breaks on Phase 1 |
| `ScheduledActivityBlock.test.js` (all 80 tests) | Component still renders correctly if component is retained alongside grid |
| `Today.test.js` empty-state, loading, REJECTED | These test Today.js branches unrelated to the activity list — will PASS |
| `Week.test.js` + `WeekGrid` (if tested) | WeekGrid render correctness — passes; same code path |

---

## 7. New Test Coverage Required

### Phase 1 (minimum 5 new tests)

| # | Test | Module |
|---|---|---|
| P1-T1 | `TodayGrid` renders block at correct `top` px for a 10:00 activity (gridStart=07:00, 60px/hr → top=180px) | `TodayGrid.test.js` |
| P1-T2 | `TodayGrid` renders block with correct `height` px (60-min block at 60px/hr → 60px) | `TodayGrid.test.js` |
| P1-T3 | Lunch block (`bucket: null`) renders with `chip-unknown` class and `data-bucket=""` or sentinel attribute | `TodayGrid.test.js` |
| P1-T4 | Now-line renders only when `nowIso` date matches the composition date | `TodayGrid.test.js` |
| P1-T5 | Empty-state (no composition) renders no grid blocks | `TodayGrid.test.js` |
| P1-T6 | CCC lower bound still ≥ 3 after calendar layout (update registry if `cycle-activities` removed) | `Today.ccc.test.js` (update) |
| P1-T7 | `sa-col-headers` guard updated or removed; new grid landmark present | `Today.test.js` (update) |

### Phase 2 (minimum 9 new tests)

| # | Test | Module |
|---|---|---|
| P2-T1 | `pointerdown` on `.wg-block` captures `activityId` and `startY` into drag state | `TodayDragController.test.js` |
| P2-T2 | `pointermove` with Δy=60px on 60px/hr grid updates preview position by +60min | `TodayDragController.test.js` |
| P2-T3 | `pointerup` at a snapped position dispatches `DRAG_COMMIT` with correct `snappedStartAt` | `TodayDragController.test.js` |
| P2-T4 | `pointerdown` on a protected block (IN_PROGRESS or `pinned=true`) does not initiate drag | `TodayDragController.test.js` |
| P2-T5 | `DRAG_COMMIT` handler rejects when `composition.state === 'INFEASIBLE'` | `app.dragDrop.test.js` |
| P2-T6 | `computeDragResult` snaps to 30-min grid: input 45px → 30 min offset at 60px/hr | `weekGridMath.test.js` (extend) |
| P2-T7 | `computeDragResult` clamps to `gridStartHour` when drag goes above grid | `weekGridMath.test.js` (extend) |
| P2-T8 | Conflict detection: two blocks overlapping returns `{ conflict: true }` | `conflictDetect.test.js` |
| P2-T9 | Conflict detection: adjacent blocks (end === next start) returns `{ conflict: false }` | `conflictDetect.test.js` |

### Phase 3 (minimum 2 new tests, pending PM decision)

| # | Test | Module |
|---|---|---|
| P3-T1 | Movement ≤ 4px between pointerdown and pointerup is classified as click (not drag) | `TodayDragController.test.js` |
| P3-T2 | Movement ≥ 6px is classified as drag (not click) | `TodayDragController.test.js` |

---

## 8. Edge Cases (12+)

| # | Edge Case | Phase | Risk |
|---|---|---|---|
| EC-01 | DST transition day — composition spans the 1-hour gap (23:00 → 01:00 apparent); `parseMinutesOfDay` uses UTC convention and is DST-agnostic, but wall-clock display will show a 1-hour discontinuity to users in affected zones | 1 | MEDIUM |
| EC-02 | Partial-day composition starting after 09:00 — first block appears mid-grid; hour rail above 09:00 is empty and may confuse users expecting a "full day" layout | 1 | LOW |
| EC-03 | INFEASIBLE composition — `activeState` is null and no grid renders; drag handler must not be attached | 2 | HIGH |
| EC-04 | Lunch block drag attempt — `bucket: null` block should be protected from drag (capacity-neutral sentinel must not be repositioned freely) | 2 | HIGH |
| EC-05 | Drag-resize ending on a protected block's time slot — conflict detection must reject the placement and restore original position | 2 | HIGH |
| EC-06 | Mobile multi-touch — two simultaneous `pointerdown` events; only the first should initiate drag; second touch must not corrupt drag state | 2 | MEDIUM |
| EC-07 | Simultaneous drag + edit-mode active — edit mode should disable drag (mutually exclusive interaction modes); toggling edit mode mid-drag must cancel the drag cleanly | 2 | HIGH |
| EC-08 | Drag while activity `state === IN_PROGRESS` — `actualStartAt` is already set; moving the block creates a data inconsistency; block must be protected or a user-facing warning shown | 2 | HIGH |
| EC-09 | Drag near grid bounds — drag above `gridStartHour=07:00` must clamp to 07:00, not produce a negative `top` offset or a time before midnight | 2 | MEDIUM |
| EC-10 | Very short block (<30 min at 60px/hr = <30px tall) — Sprint 16a already handles this in WeekGrid by dropping the end-time label; drag handle must still be reachable on a 15px-tall block (minimum touch target 44px per WCAG 2.5.5) | 2 | MEDIUM |
| EC-11 | Very long block (>4 hours at 60px/hr = >240px) — block height must not overflow the `wg-timeline` div; a 480-minute block on a 12-hour grid (720px) fills 480/720 = 67% of grid height; a user-edited 9-hour block would overflow | 1+2 | LOW |
| EC-12 | Block ending after `gridEndHour` (19:00) — `topOffsetPx` returns a valid top, `heightPx` returns full pixel height; the block visually overflows the timeline div. WeekGrid does not currently clip this. `overflow: hidden` on `.wg-timeline` hides the overflow, but the rendered block is truncated without a visible indicator | 1 | MEDIUM |
| EC-13 | `nowIso` crosses midnight during a user session — the now-line renders on the previous date's column; after midnight it must move to the new date column (or disappear if today is not in the grid) | 1 | LOW |
| EC-14 | Click-vs-drag 5px threshold on high-DPI (devicePixelRatio=3) displays — CSS pixels are DPR-independent; the 5px threshold is in CSS pixels, which is correct, but pointer event `movementX/Y` is in physical pixels on some implementations | 3 | MEDIUM |

---

## 9. Phase Risk Severity

### Phase 1 — MEDIUM

Justification: The WeekGrid pattern is already in production on the Week page and passes the existing suite. The rendering math (`topOffsetPx`, `heightPx`, `nowLineOffsetPx`) has test coverage in `weekGridMath.js`. The primary risk is **test breakage** (14 column-header tests + ~3 sa-block tests break immediately) and **information loss** (Expected Output column disappears from the calendar view). Neither is a data-integrity issue, but the Expected Output regression is customer-visible on day one of Phase 1. The Iter 26 lunch block is a known unknown — WeekGrid handles `bucket: null` gracefully but without a dedicated test. No pointer events, no state mutations, no data writes. Rollback is a one-file revert.

### Phase 2 — HIGH

Justification: Drag-and-drop introduces the first **zero-coverage interaction path** in the suite. There are no pointer-event tests to catch regressions. The INFEASIBLE-state guard, IN_PROGRESS protection, and conflict-detection logic are all net-new state machines with no existing test coverage. The snap-to-grid math inverse (pixel → HH:MM) does not exist in `weekGridMath.js`. Data integrity is at risk: a malformed `DRAG_COMMIT` action could update `plannedStartAt` to an invalid value, creating a composition that fails `validateComposition` silently on next render. The Iter 28 hotfix (Update button suppressed in PROPOSED state) is analogous — a new interaction path (drag) that bypasses existing guards could produce the same stuck-state class of bug.

### Phase 3 — LOW (conditional on PM resolution)

Justification: Click-empty-time is a discovery / insertion trigger, not a mutation trigger. The worst case is inserting a ghost block that the user immediately dismisses. Until the PM resolves what happens after the click, the scope is bounded. The click-vs-drag threshold test is fully implementable now and is LOW risk. The insertion behavior risk is LOW because it is gated on an explicit user action and does not touch `plannedStartAt` of existing activities.

---

## 10. Net Test Count Delta Estimate

| Phase | Tests broken or needing update | New tests required | Net delta |
|---|---|---|---|
| Phase 1 | ~17 broken (14 header + 3 sa-block); ~2 CCC updates | +7 new | **−10 net** (17 removed, 7 added) |
| Phase 2 | 0 broken existing tests; 0 updated | +9 minimum | **+9 net** |
| Phase 3 | 0 broken; 0 updated (pending PM) | +2 minimum | **+2 net** |
| **Total** | **~17 broken/removed** | **+18 new** | **+1 net to ~3,037** |

Note: the 80+ `ScheduledActivityBlock.*` tests do not break but become tests of a component no longer used as the primary list renderer on Today. They remain valid regression guards for the table-row component if it is retained for other surfaces (e.g., a future list/grid toggle).

---

## 11. Manual QA Checklist

All items tested against a production-like environment with real data; not against stubs.

1. [ ] Phase 1: Open Today page — hour grid renders with visible hour rail labels from 07:00 to 19:00
2. [ ] Phase 1: Each activity block appears at the correct vertical position (verify against `plannedStartAt`)
3. [ ] Phase 1: Activity block height is proportional to `plannedDurationMinutes` (60 min = 60px at default scale)
4. [ ] Phase 1: Lunch block (`bucket: null`) is visually distinguishable from PROJECT/COMMUNICATION/CI blocks
5. [ ] Phase 1: Now-line is visible only on today's date, at the correct vertical offset (verify time ±2 min)
6. [ ] Phase 1: No activity block overflows the `.wg-timeline` bottom edge (check 18:00 end-time blocks)
7. [ ] Phase 1: PROPOSED state still shows Accept / Edit / Reject triad (not displaced by grid layout)
8. [ ] Phase 1: Edit mode drawer opens and activity list inside drawer is still operable
9. [ ] Phase 1: Infeasible state renders the InfeasibleBanner and no hour grid
10. [ ] Phase 1: Empty state (no composition) renders AutoPlanButton and no hour grid
11. [ ] Phase 2: Drag a block — preview follows pointer in real time with no visible jitter
12. [ ] Phase 2: Release a block — `plannedStartAt` updates to the snapped value; composition is marked dirty
13. [ ] Phase 2: Attempt to drag a protected block (Daily Standup, IN_PROGRESS activity) — drag does not initiate
14. [ ] Phase 2: Drag a block into a time slot occupied by another block — visual conflict indicator appears; drop is rejected or reflowed
15. [ ] Phase 2: Drag to above 07:00 — block snaps to 07:00 minimum, not negative offset
16. [ ] Phase 2: Drag to below 19:00 — block snaps to `gridEndHour` or is rejected
17. [ ] Phase 2: On mobile (touch), drag works via Pointer Events API (not mouse events)
18. [ ] Phase 3: Tap empty grid area — system response is consistent with PM-approved behavior
19. [ ] Phase 3: Short tap (<300 ms, <5 px movement) on empty area is classified as click, not drag
20. [ ] All phases: `TodayPageViewed` event still fires once per route-entry after calendar layout is live

---

## 12. Rollback Plan

### Phase 1 Rollback

**Trigger:** Column header tests break and Expected Output data confirmed missing from user view.
**Action:** Revert `Today.js` and `CycleCard.js` to the table-row implementation. The `ScheduledActivityBlock` component and all its tests are unchanged and require no recovery. The `WeekGrid` component is unaffected (Week page continues to use it). Rollback is a single `git revert` of the Phase 1 commit. No data migration required — `plannedStartAt` and `plannedDurationMinutes` are unchanged.
**Time estimate:** <30 minutes.

### Phase 2 Rollback

**Trigger:** Drag commits produce invalid `plannedStartAt` values, or INFEASIBLE-state guard is missing and a drag puts a composition into an un-renderable state.
**Action:** Disable the drag controller by removing its `pointerdown` listener attachment from `Today.js` init. The grid renders read-only (Phase 1 state). No data migration required unless malformed `plannedStartAt` values were persisted — in that case, run a migration that re-validates all `ACCEPTED` compositions and resets `plannedStartAt` to the last-known-good value from the composition snapshot. The Iter 28 pattern (suppressing Update in PROPOSED) is the precedent for this kind of guard.
**Time estimate:** <1 hour for listener disable; up to 4 hours if data repair is needed.

### Phase 3 Rollback

**Trigger:** Click-empty-time inserts activities that violate capacity or conflict with existing blocks.
**Action:** Remove the click handler from the empty-area hit target in `TodayDragController.js`. The drag interaction (Phase 2) is unaffected. No data migration required if ghost blocks are not persisted until explicit user confirmation.
**Time estimate:** <15 minutes.

---

## Appendix A: Affected Test Files Reference

| File | Tests | Phase 1 break | Phase 2 break |
|---|---|---|---|
| `tests/ui/pages/Today.test.js` | 37 | 7 (headers + columnheader) | 0 |
| `tests/ui/pages/Today.ccc.test.js` | 20 | 2 (sa-col-headers, CCC lower bound) | 0 |
| `tests/ui/components/CycleCard.test.js` | 51 | 6 (header text + columnheader) | 0 |
| `tests/ui/components/ScheduledActivityBlock.test.js` | 80 | 2 (sa-block class asserts) | 0 |
| `tests/ui/components/ScheduledActivityBlock.editMode.test.js` | 10 | 0 (action handler layer safe) | 0 |
| `tests/app.sprint12.test.js` | 25 | 0 | 0 |
| `tests/app.sprint13.test.js` | 18 | 0 | 0 |
| `tests/integration/edit-mode.test.js` | 4 | 0 | 0 |
| **Subtotal at risk** | **245** | **~17** | **0** |
| All other tests | 2,791 | 0 | 0 |

---

*Artifact produced by QA Engineer agent. Validated against source files: `js/ui/components/WeekGrid.js`, `js/ui/weekGridMath.js`, `js/ui/bucketMeta.js`, `js/ui/pages/Today.js`, `js/ui/components/CycleCard.js`, `js/composer/lunchBlock.js`, `tests/ui/pages/Today*.test.js`, `tests/ui/components/ScheduledActivityBlock*.test.js`, `tests/ui/focusTrap.test.js`, `tests/app.sprint12.test.js`, `tests/app.sprint13.test.js`, `tests/integration/edit-mode.test.js`.*
