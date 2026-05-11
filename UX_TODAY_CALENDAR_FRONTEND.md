# UX_TODAY_CALENDAR_FRONTEND.md

Implementation map for converting the Today page schedule table into a
calendar-style hour-grid. Research/spec only — no production code changed.

Generated: 2026-04-30  
Branch: main (commit 6887cab)

---

## 1. Component Reuse Audit

### 1.1 weekGridMath.js — reusable as-is

Every export in `js/ui/weekGridMath.js` is scope-neutral (pure functions, no
DOM, no day-column count assumption):

| Export | Reusable for single-day grid? | Notes |
|---|---|---|
| `parseMinutesOfDay` | Yes | Handles HH:MM, HH:MM:SS, ISO |
| `extractDateIso` | Yes | Used by nowLine check |
| `topOffsetPx` | Yes | Only cares about start time vs. grid start hour |
| `heightPx` | Yes | Only cares about duration minutes |
| `nowLineOffsetPx` | Yes | Already per-day: accepts a single `dateIso` |
| `hourRailLabels` | Yes | Returns label array, no column count |
| `DEFAULT_GRID_START_HOUR` | Yes | 7 |
| `DEFAULT_GRID_END_HOUR` | Yes | 19 |
| `DEFAULT_ROW_HEIGHT_PX` | Yes | 60 |

Verdict: zero changes required to `weekGridMath.js`.

### 1.2 WeekGrid.js — render code split analysis

`js/ui/components/WeekGrid.js`:

| Function | 5-column-specific? | Single-day applicable? |
|---|---|---|
| `formatHHMM` (line 54) | No | Yes — pure helper |
| `renderBlock` (line 73) | No | Yes — renders one `.wg-block` |
| `renderHourRail` (line 182) | No | Yes — just the left column |
| `renderDayColumn` (line 121) | Yes — references `WEEKDAY_SHORT[dayIdx]` and weeklyCompositionId | Partial — the column interior is reusable; the header label and state-badge are week-specific |
| `WeekGrid` main entry (line 203) | Yes — hardcoded `for i < 5` loop, `weekly.days` | Not directly |

The three helpers `renderBlock`, `renderHourRail`, and `formatHHMM` can be
imported by a TodayGrid component directly. `renderDayColumn` wraps
week-specific header content but its timeline section (`.wg-timeline` div
with `renderBlock` calls and `nowLine`) is a reusable pattern.

### 1.3 Recommended split: extract `TodayGrid` component

Three options considered:

**Option A — Generalize WeekGrid** (add `mode: 'single' | 'week'` prop):  
Adds branching to an already-working component; risks regression in Week view.
Not recommended.

**Option B — Extract `TimeGridDay` shared utility, used by both**:  
Good long-term architecture but requires touching WeekGrid internals now.
Highest scope of this sprint.

**Option C — New `TodayGrid` component, importing shared helpers**:  
New file `js/ui/components/TodayGrid.js`. Imports `renderBlock` and
`renderHourRail` logic (copy the private helpers or re-export them from
WeekGrid if the architect adds named exports). Imports all of `weekGridMath.js`
as-is. WeekGrid is unchanged. Smallest blast radius.

**Recommendation: Option C.** New `TodayGrid` component. If the architect
later wants a shared `TimeGridDay` primitive, it can be extracted then.
No changes to WeekGrid; no regression exposure in Week tests.

---

## 2. Render Path Delta

### Before (current)

```
Today.js → CycleCard.js
  <article.cycle-card data-state="PROPOSED|ACCEPTED|...">
    <header.cycle-header>
      <h1.cycle-title>
      <span.cycle-now-summary aria-live>
      [MorningRecap disclosure]
      [WhyThisPlan disclosure]
    </header>
    <div.sa-col-headers role="row">          ← 6-column table header
    <ul.cycle-activities role="list">
      <li.sa-block> × N                      ← ScheduledActivityBlock rows
    </ul>
    [AcceptEditRejectTriad | EditTriad]
    [cycle-eod-footer]
  </article>
```

### After Phase 1 — read-only calendar grid

```
Today.js → CycleCard.js
  <article.cycle-card data-state="PROPOSED|ACCEPTED|...">
    <header.cycle-header>
      <h1.cycle-title>
      <span.cycle-now-summary aria-live>       ← unchanged
      [MorningRecap disclosure]                ← unchanged
      [WhyThisPlan disclosure]                 ← unchanged
    </header>
    <!-- REMOVED: sa-col-headers div -->
    <!-- REMOVED: ul.cycle-activities / li.sa-block rows -->
    <!-- NEW: -->
    <div.cycle-calendar-grid-wrap>
      TodayGrid({
        activities, composition, nowIso,
        kaizenTitleById, editMode, selectedActivityId
      })
    </div>
    [AcceptEditRejectTriad | EditTriad]        ← unchanged
    [cycle-eod-footer]                         ← unchanged
  </article>
```

### Changed call sites

- `CycleCard.js` `renderProposed` (line 319) and `renderAccepted` (line 367):
  replace `renderActivityColumnHeaders()` call + `renderActivityList()` call
  with `TodayGrid(...)`.
- `Today.js` has no direct awareness of the activity list; it forwards props to
  CycleCard unchanged (Today.js lines 202-214). No changes required in
  `Today.js` for Phase 1.

### What is retained

- `ScheduledActivityBlock.js` — kept as-is for potential alternate/fallback
  view or for reuse of `computeElapsedMinutes`, `formatTime`, `formatTimeRange`
  (already re-exported at line 49).
- `orderActivitiesForDisplay` in CycleCard.js (line 206) — still used by
  TodayGrid to sort activities before rendering.

---

## 3. CSS Strategy

### 3.1 What gets removed from app.css

These selectors exist only to support the table-row schedule layout and become
dead code once TodayGrid replaces the activity list:

| Selector | Location (approx. line) | Action |
|---|---|---|
| `.sa-col-headers` | app.css:443 | Remove |
| `.sa-col-hdr` and variants | app.css:451 | Remove |
| `.sa-block` (grid display) | app.css:322 | Remove or scope to fallback |
| `.sa-when`, `.sa-bucket-chip`, `.sa-name`, `.sa-duration`, `.sa-artifact`, `.sa-update` | app.css:342–440 | Remove or scope |
| `.sa-block.pinned`, `.sa-block.sa-state-*` | app.css:337, 470 | Remove or scope |
| `.sa-block.edit-selectable/selected/protected` | app.css:1592–1607 | Remove or scope |
| `.sa-block[data-user-edited=...]` bucket variants | app.css:2072–2089 | Remove (`.wg-block` variants remain) |
| Responsive overrides for `.sa-block`/`.sa-col-headers` | app.css:1333–1419 | Remove |

Note: if `ScheduledActivityBlock` is kept as an archived fallback, scope its
CSS to a `.today-list-view` wrapper rather than deleting outright.

### 3.2 What gets added

New selectors for the TodayGrid:

```css
/* Single-day calendar grid — mirrors .wg-grid but 1 day column */
.cycle-calendar-grid {
  display: grid;
  grid-template-columns: 56px 1fr;   /* hour rail + day column */
  position: relative;
  overflow-y: auto;
  max-height: 720px;                 /* 12 hours × 60px default */
}

/* Positioned activity block inside the day timeline */
.cycle-block-positioned {
  position: absolute;
  left: 4px;
  right: 4px;
  border-radius: 4px;
  border-left: 3px solid transparent;
  padding: 4px 6px;
  box-sizing: border-box;
  overflow: hidden;
  cursor: pointer;                   /* click-to-view */
  user-select: none;
  touch-action: none;                /* required for pointer-events drag */
  transition: box-shadow 150ms ease;
}
.cycle-block-positioned:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 1px;
}

/* Drag states */
.cycle-block-positioned.dragging {
  opacity: 0.85;
  box-shadow: 0 4px 16px rgba(0,0,0,0.18);
  z-index: 10;
}
.cycle-block-positioned.drag-preview {
  opacity: 0.45;
  pointer-events: none;
}

/* Resize handles (top / bottom edges) */
.cycle-block-resize-top,
.cycle-block-resize-bottom {
  position: absolute;
  left: 0;
  right: 0;
  height: 8px;
  cursor: ns-resize;
  z-index: 2;
}
.cycle-block-resize-top { top: 0; }
.cycle-block-resize-bottom { bottom: 0; }

/* Now-line — reuse .wg-now-line styles exactly; add alias */
.cycle-now-line {
  /* same rules as .wg-now-line (app.css:2182) */
}

/* Bucket coloring — reuse existing chipClass values */
.cycle-block-positioned.chip-project { border-left-color: var(--project-fg); background: var(--project-bg); }
.cycle-block-positioned.chip-communication { border-left-color: var(--communication-fg); background: var(--communication-bg); }
.cycle-block-positioned.chip-ci { border-left-color: var(--ci-fg); background: var(--ci-bg); }

/* User-edited saturation — matches .wg-block pattern */
.cycle-block-positioned[data-user-edited="false"] {
  background-color: color-mix(in srgb, var(--bg) 60%, transparent);
}
```

The `bucketMeta(bucket).chipClass` pattern already supplies `chip-project`,
`chip-communication`, `chip-ci` — no new logic needed.

---

## 4. Drag-and-Drop Implementation Plan

Approach: vanilla pointer-events, no library, no HTML5 drag API.
The HTML5 drag API is incompatible with touch and cannot be cancelled cleanly.

### 4.1 Data captured on `pointerdown`

```
dragState = {
  activityId:       string,
  startClientY:     number,        // pointer start position
  originalTopPx:    number,        // block's current top offset
  originalStartMin: number,        // activity's start in minutes-of-day
  gridTop:          number,        // timeline element getBoundingClientRect().top
  mode:             'move' | 'resize-top' | 'resize-bottom'
}
```

### 4.2 Event flow

1. **`pointerdown` on `.cycle-block-positioned`**
   - Call `el.setPointerCapture(e.pointerId)` — keeps events routed even when
     pointer leaves the block.
   - Detect `mode` from target class:
     - `.cycle-block-resize-top` → `'resize-top'`
     - `.cycle-block-resize-bottom` → `'resize-bottom'`
     - Elsewhere on block → `'move'`
   - Save `dragState`. Add `.dragging` class.
   - Distinguish from click: set `hasMoved = false`.

2. **`pointermove`**
   - Compute `deltaY = e.clientY - dragState.startClientY`.
   - Convert to minutes: `deltaMin = Math.round(deltaY / rowHeightPx * 60)`.
   - Snap to 15-min grid: `snappedDelta = Math.round(deltaMin / 15) * 15`.
   - For `mode = 'move'`: new start = `originalStartMin + snappedDelta`.
   - For `mode = 'resize-top'`: shrink from top (start shifts, duration shrinks).
   - For `mode = 'resize-bottom'`: extend/shrink from bottom (duration changes only).
   - Apply preview position via inline style (no state dispatch yet).
   - Set `hasMoved = true` if `snappedDelta !== 0`.

3. **`pointerup`**
   - Release pointer capture.
   - Remove `.dragging` class.
   - If `!hasMoved` → treat as click (see §5).
   - If `hasMoved && mode === 'move'` → dispatch `EDIT_CHANGE_START_TIME` with
     new `HH:MM` value. The existing handler at `app.js:1463` accepts this.
   - If `hasMoved && mode === 'resize-top'` → dispatch `EDIT_CHANGE_START_TIME`
     (new start) then `EDIT_CHANGE_DURATION` (new duration).
   - If `hasMoved && mode === 'resize-bottom'` → dispatch `EDIT_CHANGE_DURATION`.
   - Clear `dragState`.

4. **`pointercancel`**
   - Revert block to original position (restore inline style).
   - Clear `dragState`.

### 4.3 Action dispatch recommendation

Use existing actions — no new `BLOCK_DRAG_COMMIT` action needed for Phase 2.
`EDIT_CHANGE_START_TIME` (app.js:1463) and `EDIT_CHANGE_DURATION`
(app.js:1408) already cascade correctly. Architect confirmation recommended
before shipping if drag interacts with composition states other than EDITED.

### 4.4 Edit-mode guard

Drag-and-drop is only active when `editMode === true`. In read-only states
(PROPOSED, ACCEPTED before edit), `pointerdown` on a block opens the detail
popover (§5) and does not start a drag session.

### 4.5 Mobile

Pointer-events unify mouse, touch, and stylus. No additional touch handlers
needed. `touch-action: none` on `.cycle-block-positioned` prevents the browser
from intercepting scroll gestures on the block during a potential drag.

---

## 5. Click-Block-to-Edit (Detail Popover)

When `pointerup` fires and `hasMoved === false` (a tap/click, not a drag):

1. Prevent default. Do not dispatch any edit action.
2. Show a popover anchored to the block with:
   - Full activity name (`a.name`)
   - Time range (`formatTimeRange(a.plannedStartAt, a.plannedDurationMinutes)`)
   - Bucket chip (reuse `bucketMeta`)
   - Expected output artifact name (pre-resolved, same as ScheduledActivityBlock)
   - Kaizen link chip if `a.linkedKaizenId` is set
   - "Edit" button — dispatches `EDIT_QUICK_UPDATE` if composition is
     ACCEPTED/EDITED, or opens the Edit triad flow if PROPOSED
   - "Start" / "Skip" / "Close" action buttons when composition is ACCEPTED/ACTIVE
     (these replace the table-row action buttons that will be removed)

Implementation pattern: reuse `OutputArtifactDialog` positioning approach
(Today.js:228 `renderOpenDialog`). A lightweight `<div.cycle-block-popover>`
rendered in the grid root and positioned via JS `getBoundingClientRect()` is
sufficient. Dismiss on outside click or Escape.

Accessibility: the block itself carries `role="button"` and `tabindex="0"`;
Enter/Space open the popover. Focus moves into the popover; Escape closes it
and returns focus to the block.

---

## 6. Click-Empty-Time (Deferred — PM/Architect Decision Required)

This feature (quick-add from empty grid slot) is out of scope for Phase 1 and
Phase 2. It requires:

- A new catalog-picker mini UI (no existing component matches)
- A new action (e.g. `EDIT_ADD_SLOT_AT_TIME`) not present in app.js
- Potential engine changes if the slot must be validated against capacity

**Provisional plan (Phase 3, if approved):**

1. `pointerdown` on `.wg-timeline` at a location with no block:
   - Compute target time from `clientY - timelineTop` using `topOffsetPx` inverse.
   - Snap to 15-min grid.
   - Render a `.cycle-ghost-block` at that position (dashed border, translucent).
2. On `pointerup` (no drag): open a mini-picker overlay showing 3–4 most-likely
   catalog options (PROJECT bucket first, filtered by available capacity).
3. User selects → dispatch `EDIT_ADD_SLOT_AT_TIME({catalogEntryId, startMin})`.
4. Fallback: "Browse catalog" button opens the existing EditDrawer.

**Flag to PM/Architect:** step 3 requires either a new action handler in app.js
or repurposing the existing EditDrawer flow. Mark as BLOCKED until approved.

---

## 7. State Management

### 7.1 Local drag state (component-level, not app state)

```
dragState: {
  active: boolean,
  activityId: string | null,
  mode: 'move' | 'resize-top' | 'resize-bottom' | null,
  startClientY: number,
  originalTopPx: number,
  originalStartMin: number,
  previewStartMin: number,         // updated on pointermove
  previewDurationMin: number,
}
```

This lives in the TodayGrid component's closure or a module-level variable
reset on each drag start. It is never persisted to `app.js` state.

### 7.2 Global state transitions for drag commit

```
IDLE
  │ pointerdown (editMode=true)
  ▼
DRAGGING (local only — preview positions applied via inline style)
  │ pointerup + hasMoved
  ▼
COMMITTING (EDIT_CHANGE_START_TIME dispatched → app.js processes → re-render)
  │ re-render completes
  ▼
IDLE (new position reflected in activities array)
```

```
IDLE
  │ pointerup + !hasMoved
  ▼
POPOVER_OPEN (local flag; popover rendered)
  │ Escape / outside click / action dispatched
  ▼
IDLE
```

### 7.3 EDITED state and multi-drag

Each drag commit dispatches a synchronous action. The `EDIT_CHANGE_START_TIME`
handler at app.js:1463 already cascades start times across subsequent blocks.
Multiple drags in sequence are handled naturally: each `pointerup` dispatches
and app.js state updates before the next `pointerdown` can occur (single-touch
model). Multi-touch simultaneous drag is not supported in Phase 2.

---

## 8. Test Impact

### 8.1 Files requiring major update

| File | Current dependency | Update needed |
|---|---|---|
| `tests/ui/components/CycleCard.test.js` | Asserts `sa-col-headers` (line 125), counts `sa-block` occurrences (line 139), asserts absence of `sa-block` on REJECTED (line 323) | Replace with `cycle-calendar-grid` / `cycle-block-positioned` assertions |
| `tests/ui/pages/Today.ccc.test.js` | Asserts `cycle-activities` region at line 80; CCC count commentary at line 164 references 3 regions | After swap: `cycle-activities` removed, replaced by calendar-grid container — CCC count likely drops to 2 (header + cycle-card) unless grid wrap is counted |
| `tests/ui/pages/Today.sprint5.test.js` | Likely asserts Start/Skip/Close buttons that now live in popover | Verify and update button location expectations |
| `tests/ui/pages/Today.sprint12.test.js` | Edit mode tests that assert `.sa-block.edit-selected` | Update to assert `.cycle-block-positioned.edit-selected` |
| `tests/ui/pages/Today.sprint11.test.js` | Onboarding hints — likely safe; no activity list assertions | Verify; probably no changes |

### 8.2 Files requiring minor or no update

| File | Status |
|---|---|
| `tests/ui/components/ScheduledActivityBlock.test.js` | Keep as-is if component is retained as fallback; delete only if table view is fully removed |
| `tests/ui/components/ScheduledActivityBlock.editMode.test.js` | Same as above |
| `tests/ui/components/ScheduledActivityBlock.durationChips.test.js` | Duration chip logic moves to popover/TodayGrid; update if chips are removed from SAB |
| `tests/ui/components/ScheduledActivityBlock.timeEditor.test.js` | Time editor `<input type="time">` moves to drag or popover; likely deleted or repurposed |
| `tests/ui/weekGridMath.test.js` | No changes — math module unchanged |
| `tests/ui/components/WeekGrid.test.js` | No changes — WeekGrid unchanged |
| `tests/ui/pages/Week.test.js` | No changes |
| `tests/ui/editMode.sprint13.test.js` | Duration chip logic — verify if chips move |
| `tests/ui/editMode.sprint14.test.js` | Start-time editor — verify if `<input type="time">` moves |

### 8.3 New test file

`tests/ui/components/TodayGrid.test.js` — covers:
- Block renders at correct `top` / `height` given `plannedStartAt` + `plannedDurationMinutes`
- Null `plannedStartAt` → block omitted (no crash)
- Now-line renders when `nowIso` matches today's date
- Now-line absent when `nowIso` is a different date
- Edit-selectable class applied in edit mode only
- Protected blocks not marked edit-selectable
- `data-bucket` attribute matches activity bucket
- Empty activities array renders hour-rail but no blocks

---

## 9. Iteration Estimate

### Phase 1 — Visual calendar, read-only (no drag)

Deliverables: `TodayGrid.js` (new), `app.css` additions, `CycleCard.js` swap,
`TodayGrid.test.js` (new), updated assertions in CycleCard.test.js and
Today.ccc.test.js.

Estimate: **4–6 hours**

LOC delta (approximate):
- `TodayGrid.js` new: +120–150 lines
- `CycleCard.js` delta: -30 lines (remove `renderActivityColumnHeaders`,
  `renderActivityList` call sites), +10 lines (TodayGrid call)
- `app.css` delta: +80 lines new selectors, -120 lines removed table selectors
- Net: roughly +80 lines across the codebase

### Phase 2 — Drag-to-move and resize

Deliverables: pointer-event handlers in TodayGrid, resize handle markup,
drag-state management, updated tests.

Estimate: **6–10 hours**

### Phase 3 — Click-empty-time quick-add

Estimate: **3–5 hours** (pending PM/architect approval of new action).

---

## 10. §6.5 Boundary Check

The §6.5 boundary separates frontend render/interaction from
composer/engine/types/events.

| Layer | Touched by calendar migration? |
|---|---|
| `js/ui/components/TodayGrid.js` (new) | Yes — frontend only |
| `js/ui/components/CycleCard.js` | Yes — frontend only |
| `app.css` | Yes — presentation only |
| `js/app.js` action handlers | Read-only existing: `EDIT_CHANGE_START_TIME`, `EDIT_CHANGE_DURATION`, `EDIT_QUICK_UPDATE` dispatched as-is. No new handlers required for Phase 1–2. |
| `js/services/ComposerService.js` | No |
| Composer engine / optimizer | No |
| Domain types (`ScheduledActivity`, `Composition`) | No |
| Event bus | No |

**Verdict: Phase 1 and Phase 2 do not cross §6.5.** The only app.js surface
touched is the existing action dispatch (TodayGrid calling
`data-action="EDIT_CHANGE_START_TIME"` on drag commit — identical to how
ScheduledActivityBlock's `<input type="time">` fires it today at
ScheduledActivityBlock.js:281). No new actions, no new service calls,
no engine changes.

Phase 3 (click-empty-time) is the only phase that would require a new action
handler in app.js and is therefore flagged as requiring architect sign-off.

---

## 11. Risks

### Risk 1 — Pointer-event browser compatibility (HIGH)
`setPointerCapture` is supported in all modern browsers but its behavior
on iOS Safari with `touch-action: none` has edge cases around scroll
interception. Mitigation: test on iOS 16+ physical device before shipping
Phase 2. Fallback: if `setPointerCapture` fails silently, drag state leaks
on touch-lift; add a `pointercancel` cleanup guard.

### Risk 2 — Drag commit during PROPOSED state creates stuck state (HIGH)
The existing bug documented in ScheduledActivityBlock.js:308 (P0 fix
2026-04-30): dispatching edit actions on a PROPOSED composition transitions
it to EDITED with PROPOSED-state activities, leaving no Start/Skip buttons.
Drag must be disabled when `composition.state === 'PROPOSED'`. TodayGrid must
check this before attaching pointer listeners. Add a test assertion.

### Risk 3 — Performance with 10+ blocks (MEDIUM)
Each `pointermove` during drag recomputes `topOffsetPx` and applies inline
style. At 10–15 blocks this is negligible. If re-render is triggered on every
pointermove (rather than only on pointerup commit), 60fps drag will cause
full-page re-renders. Mitigation: keep drag preview as inline style mutations
only; dispatch to app.js only on `pointerup`.

### Risk 4 — CCC regression in Today.ccc.test.js (LOW-MEDIUM)
`cycle-activities` is currently an explicit CCC region. When it is replaced
by `.cycle-calendar-grid-wrap`, the CCC count drops unless the new wrapper
is also a recognizable semantic region. The CCC lower-bound test (line 176)
asserts >= 3 regions; removing `cycle-activities` without adding a new
identifiable region would break it. Mitigation: give `.cycle-calendar-grid-wrap`
a clear class/role; update the test fixture alongside the code change.

### Risk 5 — Edit drawer layout conflict (LOW)
`Today.js` renders `EditDrawer` to the right of `.today-card-col` via
`.today-body` flex layout (Today.js:200). The calendar grid is wider than the
table list. On narrow viewports the EditDrawer may overflow. Mitigation:
add `min-width: 0` and `overflow: hidden` to `.today-card-col`; test at
375px viewport width before Phase 2 ship.
