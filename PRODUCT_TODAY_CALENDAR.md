# PRODUCT_TODAY_CALENDAR.md
# PRD: Today Page — Calendar-Scheduling Conversion

**Product area**: Today page (CadencePlan / BAM-X)
**Status**: DRAFT — pending Phil authority decisions (see Section 10)
**Author**: PM Agent
**Date**: 2026-04-30
**Sprint target**: Phase 1 earliest viable slot after Sprint 16a ships

---

## 1. Problem Statement

The Today page currently renders a six-column HTML table:
`Time of Day | Focus Area | Standard Work Name | Planned Duration | Expected Output | Update`

This format is data-accurate but time-blind. A user cannot see at a glance that their Deep Work
block runs from 10:15 to 11:45 (90 minutes, no gap before Standup). They must scan six columns
across N rows and mentally reconstruct the timeline. The cognitive load is roughly proportional
to row count.

A calendar-style hour-grid communicates duration, spacing, and density instantly. The Week view
already ships this pattern (`js/ui/components/WeekGrid.js`, Sprint 15). Today should present
the same visual language for a single day — giving users the spatial comprehension of their day
in under five seconds instead of ten-plus.

**Why now**: The Week hour-grid (Sprint 15) and time-range display (Sprint 16a) have already
validated the rendering architecture and CSS tokens. The marginal engineering cost of a Today
calendar is low. The comprehension gap between Today's table and Week's grid is jarring and
growing as activity blocks accumulate.

---

## 2. User and Buyer Clarity

**Primary persona**: Returning daily user (Day 3+) who has an accepted or active Composition and
opens Today to orient themselves at the start of work or after a meeting interruption.

**Secondary persona**: New user (Day 1–2) viewing a PROPOSED Composition before accepting —
needs to understand what the plan looks like before ratifying it.

**User context**: Single-pane, desktop-first. User is at their workstation. They open Today for
a 5–15-second orientation check, not a deep-edit session.

**Buyer context**: Solo knowledge worker or team lead purchasing CadencePlan to enforce the
4-2-2 operating rhythm. The calendar view reinforces the product's core promise: your day is
structured, balanced, and legible.

---

## 3. User Stories

**US-01** — As a returning user, I want to see my day as a vertical time-grid so I can scan
block duration and spacing at a glance without reading a table.

**US-02** — As a user looking at 10 AM, I want to drag my Deep Work block to 11 AM so I can
accommodate an unplanned meeting that took the 10 AM slot.

**US-03** — As a user with a meeting interruption at 14:00, I want any resulting overlap to be
immediately visible as a visual collision on the grid so I can act before the conflict happens.

**US-04** — As a CI-committed user, I want CI (Improvement) blocks to render in a visually
distinct color and pattern so I am reminded of the commitment before I accidentally schedule
over them.

**US-05** — As a user trying to move a protected anchor (Daily Standup, AM Comm, Post-lunch
Comm, Reflection), I want to see a clear constraint message explaining why the drag is not
allowed rather than the block silently snapping back.

**US-06** — As a user finishing a block, I want to click the calendar block to open the output
artifact form or skip dialog — the same workflow as the table's Update button — without leaving
the calendar.

**US-07** — As a user who accepted a plan but ran long on one block, I want to resize the block
by dragging its bottom edge so I can record the actual duration without opening an edit drawer.

**US-08** — As a user whose day is marked INFEASIBLE, I want the calendar to still render what
blocks exist (greyed or flagged) rather than showing a blank grid, so I understand what the
composer tried before it gave up.

**US-09** — As a user on a partial-capacity day (e.g., afternoon-only schedule), I want the
grid to show the configured start/end window so I am not looking at eight empty rows above my
first block.

**US-10** — As a user viewing the plan before accepting, I want the PROPOSED state to be
clearly marked on the calendar (e.g., a top-of-page banner or a muted block style) so I do not
mistake a proposal for a committed schedule.

---

## 4. In Scope vs Out of Scope

### In Scope — Phase 1 (Visual calendar, read-only display)

- Replace the six-column table in `CycleCard` with a single-day hour-grid
- Hour rail: 07:00–19:00 (matches `DEFAULT_GRID_START_HOUR` / `DEFAULT_GRID_END_HOUR`)
- Blocks absolutely positioned by `plannedStartAt` + `plannedDurationMinutes` using existing
  `topOffsetPx` / `heightPx` helpers from `weekGridMath.js`
- Bucket coloring via existing `bucketMeta` chip classes (chip-project / chip-communication / chip-ci)
- Lunch block (`bucket: null`) rendered as a visually neutral capacity-neutral lane
- Now-line (red/accent horizontal rule at current time) reusing `nowLineOffsetPx`
- Protected block visual indicator (lock icon or distinct border — no drag in Phase 1)
- Time-range label on each block ("HH:MM–HH:MM") using `formatTimeRange` already in
  `js/ui/timeFormat.js`
- Composition state badge at the top of the calendar column (PROPOSED / ACCEPTED / ACTIVE / EDITED)
- EOD CTA preserved in a footer region beneath the grid
- AcceptEditRejectTriad preserved above or below the grid for PROPOSED state
- INFEASIBLE rendering: blocks that exist are shown in a muted/warning state; InfeasibleBanner
  remains above grid
- Accessibility baseline: keyboard focus on blocks, `aria-label` per block, now-line `aria-hidden`

### In Scope — Phase 2 (Drag-to-move, drag-to-resize)

- Drag a non-protected block to a new time slot
- Snap to 15-minute grid intervals
- Drag-to-resize by dragging block bottom edge
- Protected block drag attempt shows constraint toast/tooltip
- Conflict detection (overlapping blocks highlighted)
- Drag commit semantics: PENDING PHIL DECISION (see Section 10, Q1)
- Variance audit row of `kind=EDITED_FROM_PROPOSAL` written on commit

### In Scope — Phase 3 (Click-empty-time to insert)

- Click an empty time slot to open an activity picker
- What gets inserted: PENDING PHIL DECISION (see Section 10, Q2)

### Out of Scope (explicit exclusions)

- Multi-calendar federation (Google Calendar, Outlook sync)
- Recurring event creation or editing
- Sharing or collaborative views
- Mobile gesture drag (swipe/pinch on touch) — a11y baseline only in Phase 1; mobile drag
  deferred to a follow-up sprint
- Full keyboard navigation through grid cells (arrow-key time travel) — deferred; a11y baseline
  covers tab/focus on existing blocks only
- Side-by-side table + calendar toggle (table is replaced, not toggled — PENDING PHIL DECISION,
  see Section 10, Q4)
- Time zone conversion UI
- Custom color/label themes per user

---

## 5. Acceptance Criteria

### Visual Layout (AC1–AC5)

**AC1** — The Today page renders a vertical hour-grid with a left-side hour rail labeled from
07:00 to 19:00 in one-hour increments. The grid renders correctly for a Composition in any of
these states: PROPOSED, ACCEPTED, EDITED, ACTIVE.

**AC2** — Every scheduled activity block is absolutely positioned within the grid such that its
top edge aligns with its `plannedStartAt` time and its height represents its
`plannedDurationMinutes` at the rate of 1 minute = 1 pixel (or 1 hour = 60px, matching
`DEFAULT_ROW_HEIGHT_PX`). A block starting at 09:15 with duration 30m occupies the correct
slice of the 09:00–10:00 row.

**AC3** — Each block displays its time range ("HH:MM–HH:MM"), activity name, and bucket chip.
Blocks shorter than 40px display only the start time (matching the `WG_RANGE_MIN_HEIGHT_PX`
pattern from `WeekGrid.js`).

**AC4** — The three bucket types render in visually distinct colors using existing chip-class
tokens: `chip-project` (Deep Work / blue), `chip-communication` (Communication / yellow),
`chip-ci` (Improvement / green). A user can distinguish all three types without reading the
label.

**AC5** — A composition state badge is visible at the top of the calendar panel. The badge
reads "Proposed" when `composition.state === 'PROPOSED'`, "Active" when ACTIVE, and so on.
The badge is not rendered in an ambiguous or absent state.

### Contextual Affordances (AC6–AC10)

**AC6** — The now-line (a horizontal accent rule) is rendered at the correct vertical offset
for the current time whenever `nowIso` is provided and the current time falls within the grid
window. The line carries `aria-hidden="true"` and a visible tooltip or label showing the
current time.

**AC7** — The Lunch block (`bucket: null`, `catalogEntryId: 'gen_lunch'`) renders in a
visually neutral style distinct from PROJECT / COMMUNICATION / CI blocks. It must not use any
of the three bucket chip colors. It must not render an output artifact link (lunch produces no
artifact per Iter 26 decision). The block is not draggable in Phase 1 or Phase 2 (it is a
capacity-neutral anchor).

**AC8** — Protected blocks (Daily Standup, AM Comm, Post-lunch Comm, End-of-Activity
Reflection, and any `isProtectedBlock()` truthy activity) render with a visual lock indicator
(icon or border variant). In Phase 1, the lock indicator is purely informational. In Phase 2,
attempting to drag a protected block surfaces a constraint message and the block returns to its
original position.

**AC9** — The output artifact link is accessible from within each calendar block. Clicking a
block that has an `outputArtifact` defined opens the `OutputArtifactDialog`. Clicking a block
that supports skip opens the `SkipReasonModal`. This replaces the per-row Update button from
the table.

**AC10** — A linked Kaizen chip (the `linkedKaizenId` badge) is visible on blocks that have a
Kaizen association, matching the existing `wg-block-kaizen` treatment in `WeekGrid.js`.

### Interaction (AC11–AC15 — Phase 2)

**AC11** — A non-protected block can be dragged vertically within the grid. On drag start, the
block enters a "dragging" visual state (e.g., reduced opacity, outline). On drag end, the block
snaps to the nearest 15-minute boundary. The underlying activity's `plannedStartAt` is updated
by the commit mechanism defined by the drag commit decision (Section 10, Q1).

**AC12** — A block can be resized by dragging its bottom edge. Drag-resize snaps to 15-minute
boundaries. Duration is floored at 15 minutes (a block cannot be dragged to zero or negative
height). The block does not overlap the next block in the sequence as a result of resize.

**AC13** — All drag/resize operations snap to 15-minute grid intervals. Snap is visual and
immediate during the drag (the block jumps in 15-minute steps as the pointer moves).

**AC14** — If a drag would result in two blocks occupying overlapping time slots, the
overlapping region is visually highlighted during the drag (e.g., the target zone turns red or
a warning border appears). The user is not blocked from completing the drag, but the overlap
persists as a visible conflict until resolved. Conflict resolution policy: PENDING PHIL
DECISION (Section 10, Q3).

**AC15** — Dragging a protected block produces no movement. Instead a constraint tooltip or
toast appears: "This block cannot be moved." The block remains at its original position. No
state mutation occurs.

### Edit, EOD, and Accessibility (AC16–AC18)

**AC16** — Clicking a block (not dragging) opens a block-detail interaction. For SCHEDULED
blocks, this surfaces: activity name, time range, duration, bucket, and action buttons (Start,
Skip if applicable, artifact link if applicable). For IN_PROGRESS blocks, it surfaces the
elapsed timer and Close button. Implementation form (side panel vs modal vs inline expansion)
is a UX decision deferred to the UX designer; the product requirement is that all existing
block actions remain reachable within two taps/clicks from the calendar view.

**AC17** — The EOD reflection CTA (currently in CycleCard footer) is preserved below or
adjacent to the calendar grid. It renders when `eodRecap` is non-null and the composition is
CLOSED or all activities are completed. It must not be hidden by the grid container's scroll
region.

**AC18** — Accessibility baseline: every calendar block is focusable via keyboard Tab. Each
block carries an `aria-label` of the form "ActivityName, HH:MM to HH:MM, bucket" (e.g.,
"Deep Work Sprint Task, 10:00 to 11:30, Deep Work"). The hour rail is `aria-hidden="true"`.
The now-line is `aria-hidden="true"`. Screen-reader-only text for protected blocks reads
"protected, cannot be moved."

---

## 6. Defaults Table

| Parameter | Default | Provenance |
|---|---|---|
| Hour grid start | 07:00 | `DEFAULT_GRID_START_HOUR = 7` in `weekGridMath.js` |
| Hour grid end | 19:00 | `DEFAULT_GRID_END_HOUR = 19` in `weekGridMath.js` |
| Row height | 60px/hour | `DEFAULT_ROW_HEIGHT_PX = 60` in `weekGridMath.js` |
| Snap interval | 15 minutes | Calendar industry standard; aligns with composer's 15-min slots |
| Min block height | 40px (shown range); 15px floor | Matches `WG_RANGE_MIN_HEIGHT_PX` from `WeekGrid.js` |
| Drag commit semantics | PENDING PHIL DECISION | See Section 10, Q1 |
| Lunch block color | Neutral / surface-muted token | `chip-unknown` pattern from `bucketMeta.js` (UNKNOWN meta) |
| Protected block indicator | Lock icon via CSS `::before` pseudo-element | Design decision; product requires visual differentiation |
| Block click action | Opens existing OutputArtifactDialog / SkipReasonModal | Preserves Iter 25 interaction model |
| Conflict highlight | Warning border / red overlay on overlap zone | Phase 2 default; exact style is UX designer's call |
| INFEASIBLE block style | Muted opacity + warning chip on block | Extends existing `InfeasibleBanner` pattern |

**Flag for Phil — Drag commit semantics (two options):**

Option A (Immediate commit): Block mutation persists the moment drag ends, matching Google
Calendar behavior. A `Variance` row of `kind=EDITED_FROM_PROPOSAL` is written immediately.
Undo is available via the existing EDIT_UNDO mechanism. Risk: conflicts with BAM-X
deliberate-ratification model.

Option B (Pending until Save): Drag produces a pending visual diff. User must click a "Save
Changes" button (analogous to EDIT_COMMIT) before the mutation persists. Aligns with the
existing edit-mode Commit / Cancel / Undo triad pattern. Risk: adds a friction step that
diverges from standard calendar UX expectations.

---

## 7. Edge Cases

**EC-01 — Drag near top grid boundary**: User drags a block to 07:00 or above. Block snaps to
07:00. Cannot be dragged above the grid start. If the block's `plannedStartAt` is already
before 07:00 (e.g., 06:30), it renders clamped to the top of the grid with a visual indicator
that it starts before the visible window.

**EC-02 — Drag near bottom grid boundary**: User drags a block such that its end time would
exceed 19:00. Block snaps so its end aligns with 19:00 at most. If the block's duration exceeds
the remaining window, it is clamped to end at 19:00.

**EC-03 — Drag through a protected block**: User drags a free block and the drag path crosses a
protected block's time slot. The protected block does not move. The free block can be dropped on
either side of the protected block; if the user drops it on the same time slot as the protected
block, the overlap conflict (AC14) applies.

**EC-04 — Drag-resize across the Lunch block**: User resizes a block above Lunch and drags the
bottom edge past 12:00. The block cannot grow into the Lunch slot (Lunch is a non-draggable
anchor). Resize clamps at the Lunch block's `plannedStartAt`.

**EC-05 — Drag while IN_PROGRESS**: An activity in IN_PROGRESS state is currently being
executed. Dragging an IN_PROGRESS block is blocked (same logic as protected blocks). The
constraint message reads: "This block is in progress and cannot be moved."

**EC-06 — Drag while Composition is PROPOSED (pre-ratification)**: In Phase 2, dragging is
permitted on a PROPOSED Composition. The drag interaction is equivalent to an edit-mode
mutation. If drag commit is Immediate (Option A), the composition transitions to EDITED
state automatically. If Pending (Option B), the pending diff is shown until the user commits.

**EC-07 — INFEASIBLE Composition rendering**: The composer returned INFEASIBLE. The grid
renders any activities that exist in the INFEASIBLE result in a muted/greyed state with a
warning chip. The `InfeasibleBanner` is shown above the grid. No drag interaction is allowed
on INFEASIBLE compositions.

**EC-08 — Partial-day composition**: The composition covers a shortened workday (e.g.,
240-minute cap). The grid still renders 07:00–19:00 (full window). Blocks are concentrated in
the 4-hour window. Empty hours are visually empty rows, which is correct and communicates
available time. No grid window resizing in Phase 1.

**EC-09 — Zero-duration block**: A block with `plannedDurationMinutes = 0` or null renders
with `heightPx` = 0 and is not displayed (matches existing `WeekGrid.js` behavior: `if (h <= 0)
return ''`).

**EC-10 — Simultaneous drag (multi-touch / rapid user action)**: Only one drag interaction is
processed at a time. If a second pointer initiates a drag before the first drag resolves, the
second drag is ignored. Multi-touch drag is explicitly out of scope for Phase 2.

---

## 8. Standard-Work Authority Items for Phil

The following items require Phil's decision before Phase 2 or Phase 3 can be implemented.
These are appended to `PHIL_AUTHORITY_QUEUE.md` as Section E items.

| ID | Status | Question | Default if no answer | Blocks |
|---|---|---|---|---|
| SW-Q-CAL-01 | OPEN | Drag commit semantics: Immediate (Google Calendar pattern, writes Variance on drop) OR Pending until Save (BAM-X deliberate-ratification pattern, requires explicit COMMIT action)? | Pending until Save (preserves ratification model) | Phase 2 |
| SW-Q-CAL-02 | OPEN | Click-empty-time slot in Phase 3: what activity gets inserted? Options: (a) opens Catalog picker, (b) inserts a generic "Unscheduled Block" placeholder that user names, (c) not allowed (empty time must remain empty until Auto-Plan or Edit mode). | Opens Catalog picker | Phase 3 |
| SW-Q-CAL-03 | OPEN | Conflict / overlap resolution policy: when two blocks overlap after a drag, does the system (a) auto-shift the colliding block forward, (b) show a conflict warning and require the user to resolve manually, or (c) reject the drop and snap back? | Show warning, require manual resolution | Phase 2 |
| SW-Q-CAL-04 | OPEN | Table toggle: should the six-column table be retained as a secondary view (toggle button in CycleCard header: "Calendar | List"), or is the table replaced outright? | Replace outright (no toggle) | Phase 1 |

---

## 9. Success Metrics

### Before (current table)

- Time-to-comprehend day structure (proxy): estimated 10–15 seconds per CCC review session;
  requires scanning 6 columns × N rows to reconstruct the timeline mentally.
- Primary observation: zero spatial information. Duration = a number in column 4, not a visual
  block height.
- Tracking event available: `TodayPageViewed` (confirmed in codebase from Iter 21 telemetry).

### After (calendar view — targets)

| Metric | Baseline | Target | Measurement method |
|---|---|---|---|
| Time-to-comprehend day | ~10s estimated | <5s | Extend `TodayPageViewed` event with `comprehensionLatency` field (time from page render to first block click or scroll — proxy for active engagement) |
| Conflict detection (user notices overlap before it happens) | Not measurable in table | Measurable: `ConflictWarningShown` event count / session | New event emitted in Phase 2 drag layer |
| Edit interactions initiated from calendar (vs opening separate Edit drawer) | 0 (table has no drag) | >60% of day-edits originate from calendar drag in Phase 2 | New event `CalendarDragCommit` vs `EditDrawerOpened` ratio |
| Drag-initiated variance rows (EDITED_FROM_PROPOSAL) | 0 | Measurable count per user per week | Existing `VarianceService.log()` + `VarianceKind` |
| Acceptance rate of PROPOSED compositions | Baseline from existing `AcceptEditRejectTriad` telemetry | Unchanged or improved (calendar should not reduce acceptance) | Existing `CompositionAccepted` event |

**Leading indicator**: Within 2 weeks of Phase 1 ship, measure median time from `TodayPageViewed`
to first action (Start, Skip, dialog open). A decrease vs pre-calendar baseline indicates
faster orientation.

**Post-launch metric**: After Phase 2 (drag-and-drop), measure ratio of drag-based edits to
drawer-based edits. Target: drag becomes the dominant edit path within 30 days of Phase 2 ship.

---

## 10. Top 5 Risks

**Risk 1 — Drag mutation may violate deliberate-ratification model** (HIGH)
BAM-X's positioning is that users ratify plans before executing them. Immediate-commit drag
(Option A) bypasses this model. If Phil selects Option A, the product must clearly communicate
that drag is an edit-and-commit action, not just a proposal. Mitigation: default to Pending
(Option B) and require explicit Phil approval to switch to Immediate.

**Risk 2 — Calendar density hides Expected Output / artifact column** (MEDIUM)
The table's dedicated "Expected Output" column surfaces the output artifact name inline. A
calendar block has limited vertical space — artifact info may not fit at 30-minute block
heights. Mitigation: clicking a block opens a detail view that always shows the artifact link
(AC16). The artifact name is not required to be visible on the block face at all heights.

**Risk 3 — WeekGrid coupling creates regression surface** (MEDIUM)
Reusing `WeekGrid.js` rendering logic (or extracting shared helpers into a `DayGrid.js`) ties
Today's calendar to the Week rendering path. A change to shared math helpers (`weekGridMath.js`)
affects both pages simultaneously. Mitigation: system architect must confirm the extraction
strategy (shared helper vs independent `TodayGrid.js` that imports the same math module) and
add regression tests covering both pages for every shared helper change.

**Risk 4 — Mobile experience is undefined** (MEDIUM)
The Week grid is desktop-first. The Today calendar will inherit the same limitation. Drag-and-
drop on touch is explicitly out of scope for Phase 2. Users on mobile will have a read-only
calendar in Phase 1 and Phase 2 but will not be able to drag. Mitigation: document explicitly
that mobile users retain the edit drawer as their mutation path. Add a mobile fallback note to
the Phase 2 release notes.

**Risk 5 — INFEASIBLE composition rendering is undefined** (LOW-MEDIUM)
The current InfeasibleBanner sits above an empty content area. In the calendar view, the grid
exists but contains partial or malformed block data from the infeasible result. Rendering
partial blocks without a clear visual frame could confuse users. Mitigation: Phase 1 must
define the INFEASIBLE grid state explicitly (AC-08 and EC-07 address this; confirm with UX
designer before Phase 1 ships).

---

## 11. Phasing Recommendation

### Phase 1 — Visual Calendar (Read-only Display)

**Goal**: Replace the six-column table with a calendar-style hour-grid. All existing actions
remain available via click-to-open dialog. No drag interaction.

**Independently shippable**: Yes. The rendering change is visually significant but introduces
no new state mutations or event types. All existing `CompositionService`, `ActivityService`,
and `VarianceService` APIs are unchanged.

**Dependencies**: Phil's decision on SW-Q-CAL-04 (table toggle vs replace). If Phil chooses
"replace outright," the table component (`ScheduledActivityBlock.js` list render in
`CycleCard.js`) is removed. If Phil chooses "toggle," both must be maintained.

**Engineering path**: Extract `TodayGrid.js` (single-day variant of `WeekGrid.js`) reusing
`weekGridMath.js` helpers. Wire into `CycleCard.js` in place of the activity list. Preserve
`EditDrawer.js` for the existing Edit mode.

### Phase 2 — Drag-to-Move and Drag-to-Resize

**Goal**: Add drag interaction to calendar blocks. Commit semantics per Phil's SW-Q-CAL-01
decision.

**Independently shippable**: Yes, after Phase 1. Cannot ship before Phase 1 (requires grid
to exist).

**Dependencies**: SW-Q-CAL-01 (commit semantics), SW-Q-CAL-03 (conflict policy). Drag
interaction requires new event types: `CalendarDragStart`, `CalendarDragCommit`,
`CalendarDragCancel`. VarianceService must accept `kind=EDITED_FROM_PROPOSAL` (verify this
`VarianceKind` value exists in `js/domain/types.js` — if not, it is a new enum value requiring
architect approval).

**Engineering path**: Drag layer added as a behavior module (`js/ui/dragBehavior.js`) wired
into `TodayGrid.js`. No changes to `WeekGrid.js` in Phase 2 (Week drag is a future sprint).

### Phase 3 — Click-Empty-Time to Insert

**Goal**: Clicking an empty time slot opens an activity picker. Requires SW-Q-CAL-02 decision.

**Independently shippable**: Yes, after Phase 2. Could theoretically be parallel to Phase 2
but sharing the drag event layer makes sequencing safer.

**Dependencies**: SW-Q-CAL-02 (what gets inserted). If Catalog picker, requires the existing
`EditDrawer` catalog-search component to be extractable as a standalone picker modal.

---

## 12. Backlog Candidates Spawned

The following new backlog items are proposed as outputs of this PRD. IDs follow the C-PM-X
convention.

| ID | Title | Phase | Blocked on |
|---|---|---|---|
| C-PM-CAL-01 | Today Calendar: Extract TodayGrid.js (Phase 1 visual render) | 1 | SW-Q-CAL-04 (toggle vs replace) |
| C-PM-CAL-02 | Today Calendar: Lunch block neutral treatment in grid | 1 | None — lunch spec is ANSWERED (Iter 26) |
| C-PM-CAL-03 | Today Calendar: Protected block lock indicator (Phase 1) | 1 | UX designer: lock icon / CSS spec |
| C-PM-CAL-04 | Today Calendar: INFEASIBLE grid state design | 1 | UX designer: muted block treatment |
| C-PM-CAL-05 | Today Calendar: Drag-to-move + snap (Phase 2) | 2 | SW-Q-CAL-01 (commit semantics) |
| C-PM-CAL-06 | Today Calendar: Drag-to-resize + floor (Phase 2) | 2 | SW-Q-CAL-01 (commit semantics) |
| C-PM-CAL-07 | Today Calendar: Conflict detection overlay (Phase 2) | 2 | SW-Q-CAL-03 (conflict policy) |
| C-PM-CAL-08 | Today Calendar: Click-empty-time insert (Phase 3) | 3 | SW-Q-CAL-02 (insert what?) |
| C-PM-CAL-09 | Today Calendar: Mobile read-only fallback documentation | 2 | None — informational |
| C-PM-CAL-10 | Analytics: Extend TodayPageViewed with comprehensionLatency proxy field | 1 | Analytics agent |

---

## 13. Missing Assumptions — Flagged

The following assumptions are not yet grounded and must be resolved before Phase 2 can be
specified precisely:

- **VarianceKind enum**: Does `EDITED_FROM_PROPOSAL` exist as a `VarianceKind` value in
  `js/domain/types.js`? If not, it is a new domain type requiring architect sign-off.
- **Drag while Composition is ACTIVE (activity IN_PROGRESS)**: The current model has one
  activity IN_PROGRESS at a time. Dragging future scheduled blocks while one is in progress
  needs a clear policy (is it permitted? does it affect the IN_PROGRESS activity?).
- **Week view drag parity**: Phil's directive targets Today only. Is Week drag intended to
  follow in a subsequent sprint, or is Today the only calendar with drag? This affects whether
  the drag behavior module should be built as a shared utility from the start.

---

_End of PRODUCT_TODAY_CALENDAR.md_
_Artifact count: 18 ACs, 4 authority items (SW-Q-CAL-01 through SW-Q-CAL-04), 3 phases, 10 backlog candidates._
