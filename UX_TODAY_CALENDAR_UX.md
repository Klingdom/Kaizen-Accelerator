# UX_TODAY_CALENDAR_UX — Today Page Calendar Redesign

Owner: UX Designer Agent
Status: Draft v1.0
Date: 2026-04-30
Upstream: ScheduledActivityBlock.js, WeekGrid.js, weekGridMath.js, editMode.js, UX_FLOWS.md

---

## 1. Goal

Convert the Today page from a tabular schedule (6 visible columns) to a standard
single-day calendar view that matches the mental model of Google Calendar, Apple
Calendar, and Motion. The user should be able to see what is happening now, what
is coming next, and how time is actually distributed across the workday — all at
a glance without reading table rows. The calendar grid already exists for the
Week view (WeekGrid.js + weekGridMath.js); Today is a single-column instance of
that same grid. The change removes the cognitive overhead of parsing a table and
replaces it with a spatial representation that matches how people experience time.

## 2. Non-Goals

- Full multi-calendar federation (Google, Outlook sync, iCal import/export).
- Recurring event creation or editing beyond what the composer already produces.
- Sharing, permissions, or multi-user visibility.
- Third-party integrations (Zoom links, Slack status sync, etc.).
- A new composer or scheduling engine — the data model does not change.
- Any modification to the WeekGrid or WeekGrid math layer.

---

## 3. Calendar UX Pattern Inventory

| Standard calendar feature         | Adopt in BAM-X? | Reasoning |
|-----------------------------------|-----------------|-----------|
| Vertical hour-grid (time rail)    | YES             | Core pattern; directly maps to existing weekGridMath.js. Single-column instance reuses all positioning helpers without new code. |
| Absolutely-positioned event blocks | YES            | WeekGrid already does this. Today gets one day column instead of five. |
| Now-line (red indicator)          | YES             | Already in WeekGrid. Critical for orientation — user needs to see "I am here." |
| Block color by category           | YES             | chip-project / chip-communication / chip-ci already defined in bucketMeta.js. Visual density benefit is high. |
| Click block for details           | YES             | Replaces the per-row Update button. All metadata (artifact, state, elapsed) surfaces in a detail panel on click. |
| Drag block to move (reschedule)   | YES — gated     | Adopt with deliberate-ratification gate (see §6). Direct-mutation drag is too destructive given the composer's cascade logic. |
| Drag edge to resize duration      | YES — gated     | Same gate as move. Replaces duration chips in edit mode. |
| Click empty time to create event  | LIMITED         | Not open-ended (see §7). Calendar-click opens a quick-pick sheet, not a freeform event creator. |
| Multi-event overlap rendering     | YES             | Handled by CSS column-splitting if two blocks share a time window. Low frequency in BAM-X but needed for correctness. |
| Quick event creation (keyboard)   | NO              | Composer is the source of truth. Ad-hoc keyboard shortcuts would bypass catalog validation. |
| All-day events banner             | NO              | BAM-X has no all-day concept; everything is timed. |
| Attendee / invite flow            | NO              | Single-user MVP; no sharing model. |
| Event recurrence UI               | NO              | Composer handles rhythm; user does not define recurrence patterns manually. |
| Mini-calendar date picker         | NO              | Today is always today; date navigation is not a Today-page concern. |
| Timezone display / toggle         | NO              | Out of scope for current sprint. |

---

## 4. Visual Hierarchy Comparison

### 4.1 Table layout — what it communicates well

- Explicit column headers make every field's meaning unambiguous on first visit.
- "Expected Output" and bucket label are always visible without a secondary
  interaction.
- State variants (PROPOSED chip, SKIPPED border) appear inline per row.
- The per-row Update button requires no discovery — it is visible in context.

### 4.2 Table layout — what it obscures

- No sense of how long each activity actually lasts relative to others.
- No sense of where "now" falls inside the day.
- No visual gap between activities — a 15-min block and a 90-min block look
  identical in height.
- Dense columns force horizontal scroll on narrow viewports.
- Reading order is top-to-bottom of rows, not spatially intuitive.

### 4.3 Calendar layout — what it communicates well

- Block height encodes duration. A 90-min block is visually 3× taller than a
  30-min block.
- The now-line is an immediate spatial anchor: "I am at this point in my day."
- Past/future split is visually obvious — blocks above the now-line are done or
  in progress; blocks below are upcoming.
- Bucket color coding creates a pattern language for the shape of the workday
  (deep work in the morning, communication in the afternoon, etc.).
- Gaps between blocks are visible — dead time is no longer hidden.

### 4.4 Calendar layout — what it obscures

- Expected output name is not visible without a secondary interaction.
- Per-block state variants (SKIPPED, CLOSED) require either color coding or an
  icon badge; they cannot use the table's inline state column.
- The Update/Start/Skip actions disappear from the visible surface and must be
  accessed through a detail panel.
- Narrow blocks (under ~40 px height, i.e., 15–30 min activities) can only
  show the start time and a truncated name — column labels are lost.

---

## 5. Recommended Today Calendar Layout

### 5.1 Overall structure

```
+----------------------------------------------------------+
| [TODAY HEADER]  Thu Apr 30  |  ACTIVE  |  [EOD CTA]     |
+----------------------------------------------------------+
| [CycleCard: WhyThisPlan (collapsed) + MorningRecap]     |
+----------------------------------------------------------+
| 07:00 |                                                  |
|       | [block] AM Comm         (chip-communication)    |
| 08:00 |                                                  |
|       | [block] Deep Work Task  (chip-project)          |
|       |         90 min · NOW-LINE cuts through here     |
| 09:00 |------- NOW-LINE (red) --------- 09:23 ---------|
|       |                                                  |
| 10:00 | [block] Deep Work Task  (chip-project)          |
|       |                                                  |
| 11:00 | [block] Daily Standup   (chip-communication)    |
|       |         [lock icon — protected]                 |
| 12:00 |                                                  |
|       | [block] Lunch           (chip-unknown/neutral)  |
| 13:00 |                                                  |
|       | [block] Post-lunch Comm (chip-communication)    |
| 14:00 |                                                  |
|       | [block] CI Task         (chip-ci)               |
| 15:00 |                                                  |
|       | [block] Reflection      (chip-ci)               |
|       |         [lock icon — protected]                 |
| 16:00 |                                                  |
+----------------------------------------------------------+
| [CycleCard footer: EOD Submit button]                   |
+----------------------------------------------------------+
```

### 5.2 Hour rail

- Left column: hour labels rendered by `hourRailLabels()` from weekGridMath.js.
- Default window: 07:00–19:00 (same as WeekGrid defaults).
- Label format: `HH:00`. Labels are `aria-hidden="true"` — blocks carry their
  own time announcements for screen readers.
- Width: fixed 48 px. Blocks start at 48 px from the left edge.

### 5.3 Single day column

- `.tg-timeline` (today-grid timeline): `position: relative`, height =
  `(gridEndHour - gridStartHour) * 60` px = 720 px for the default window.
- Background: horizontal rule lines every 60 px (one per hour) via CSS
  `repeating-linear-gradient` or border-bottom on pseudo-elements — same
  approach the Week view uses.
- Half-hour tick marks at 30 px intervals, rendered in a lighter color.

### 5.4 Activity blocks

- Each block: `position: absolute; left: 48px; right: 0;`
- `top` computed by `topOffsetPx(activity.plannedStartAt, gridStartHour, 60)`.
- `height` computed by `heightPx(activity.plannedDurationMinutes, 60)`.
- Background color: `bucketMeta(activity.bucket).vars.bg`.
- Minimum rendered height: 24 px (so even a 15-min block is clickable).
- If actual `heightPx` < 24, clamp to 24 and add overflow: hidden.
- Block content (from top):
  - Line 1: time range (e.g., `09:00–10:30`) — hidden below 40 px, only start shown.
  - Line 2: activity name (truncated with ellipsis).
  - Line 3: artifact chip (icon + name) — hidden below 56 px height.
  - Lock icon (🔒) in top-right corner for protected blocks.
  - State badge in bottom-right corner: `IN_PROGRESS` shows a pulsing dot;
    `CLOSED` dims the block to 40% opacity; `SKIPPED` applies a red-tinted
    border and 60% opacity.
- `data-activity-id`, `data-bucket`, `data-state` attributes on each block for
  QA targeting and CSS state variants.

### 5.5 Now-line

- Red horizontal rule across the full width of the day column.
- Rendered by `nowLineOffsetPx()` from weekGridMath.js — no new math needed.
- `aria-label="Current time"` on the element.
- Updates on a 60-second timer (same cadence as the existing elapsed-timer).

### 5.6 Header

- Retains: day badge (Thu Apr 30), composition state chip (PROPOSED / ACTIVE /
  CLOSED), WhyThisPlan + MorningRecap collapsed disclosures inside CycleCard.
- Adds: current-activity summary text as a visually prominent single line
  ("Now: Deep Work Task — 23 min elapsed") replacing the old `aria-live` region
  (see §8).

### 5.7 Empty state (no composition for today)

```
+----------------------------------------------------------+
| TODAY  Thu Apr 30  |  No plan yet                       |
+----------------------------------------------------------+
| [CycleCard]                                              |
|   Your day hasn't been planned yet.                      |
|   [Generate Today's Plan]  ← primary CTA                |
+----------------------------------------------------------+
| [Empty hour grid — muted, no blocks]                    |
+----------------------------------------------------------+
```

- Hour grid is still rendered but muted (opacity: 0.3) so the spatial metaphor
  is established even before a plan exists.
- Single primary action button leads to the existing AutoPlan flow.

---

## 6. Drag-and-Drop Affordances

### 6.1 Recommended interaction model: deliberate ratification

Drag in BAM-X Today is a PROPOSED change, not a direct mutation. This matches
Phil's existing "Accept before you Start" model and preserves the composer's
cascade logic.

Flow:
1. User drags a block to a new time position (snapped to 15-min grid).
2. The block renders in ghost form at the new position. The original position
   shows a dimmed placeholder.
3. A persistent confirmation bar appears at the bottom of the grid:
   "Move [Deep Work Task] to 10:30? [Confirm] [Cancel]"
4. On Confirm: `applyStartTimeChange()` is called (existing function, Sprint 14).
   Cascade shifts downstream blocks as defined. `userEdited: true` is stamped.
5. On Cancel: ghost disappears, block returns to original position. No state
   change.

Rationale: `applyStartTimeChange` already enforces overlap guards and cascade
logic. A direct-mutation model would require duplicate constraint validation in
the drag handler. The confirmation step also surfaces the cascade side-effects
("3 other blocks will shift") before committing, which matches the transparency
goal.

### 6.2 Snap-to-grid

- 15-minute increments (same as DURATION_OPTIONS granularity).
- Visual: grid shows faint 15-min tick marks during an active drag.
- Drag handle: entire block surface is the drag handle. Cursor changes to
  `grab` on hover, `grabbing` on mousedown.

### 6.3 Edge-drag to resize (duration)

- Bottom edge of each non-protected block shows a resize handle (4 px tall
  drag strip, visually distinct — darker shade of block color).
- Dragging the bottom edge adjusts `plannedDurationMinutes` in 15-min
  increments.
- On release: same confirmation bar as move. "Set [Deep Work Task] to 90 min?
  [Confirm] [Cancel]"
- On Confirm: `applyDurationChange()` is called (existing function, Sprint 13).
- On Cancel: block snaps back to original height.

### 6.4 Protected block constraints

- Protected blocks (Daily Standup, AM Comm, Post-lunch Comm, Reflection,
  sprint ceremonies, strategic PROJECT blocks, carried-over blocks) do NOT
  have drag handles and do NOT respond to drag events.
- Lock icon (🔒) in block corner communicates non-movability.
- If a drag of another block would land inside a protected block's time window,
  the drop target is rejected: the confirmation bar does not appear, and the
  ghost returns to origin with a brief shake animation.
- If a drag-resize of a non-protected block would extend into a protected
  block's start time, the resize clamps to the protected block's start minus
  the 15-min snap increment. No error message needed — the handle simply stops.

### 6.5 No-overlap constraint

- During drag, blocks that would overlap another existing block are highlighted
  with a red tint border.
- Drop is rejected if the resulting time window overlaps any other block
  (protected or not).
- Error message in the confirmation area: "That time is already taken by
  [conflicting block name]."

---

## 7. Click-Empty-Time-to-Add

### 7.1 Default behavior

Clicking on an empty time slot does NOT open a freeform event creator.

The composer is the source of truth. Manual additions that bypass the catalog
risk violating the 4-2-2 bucket invariant (4 hours PROJECT / 2 COMMUNICATION /
2 CI), and freeform text events have no output artifact, no catalog procedure,
and no Kaizen linkage.

### 7.2 Recommended: quick-pick sheet

Clicking empty space opens a bottom sheet or inline dropdown:
- Title: "Add to [09:30]?"
- Content: a filtered catalog list (same filter as the existing Edit mode
  catalog drawer), pre-seeded with the time slot clicked.
- User selects a catalog entry → `applyAdd()` is called (existing, Sprint 12)
  and the composition transitions to EDITED state.
- Cancel closes the sheet with no change.

This keeps additions inside the catalog pipeline while making the calendar feel
interactive.

### 7.3 Constraint: PROPOSED state

Quick-add is suppressed when the composition is in PROPOSED state (consistent
with the existing Update button suppression rule from Iter 28 / 2026-04-30
hotfix). The user must Accept the plan before adding to it.

---

## 8. Compatibility with Prior Iterations

| Prior element                             | Calendar treatment |
|-------------------------------------------|--------------------|
| WhyThisPlan collapsed disclosure          | Preserved in CycleCard header above the grid. No change to content or interaction. |
| MorningRecap collapsed disclosure         | Preserved in CycleCard header. No change. |
| EOD CTA (submit end-of-day)               | Preserved in CycleCard footer below the grid. No change to action or copy. |
| aria-live current-activity summary        | Replaced by a static (non-live) "Now" bar above the grid that shows the IN_PROGRESS block name + elapsed time. Screen readers announce the now-line element via `aria-label="Current time, [HH:MM]"`. Live region is no longer needed because the calendar's visual now-line communicates position spatially; assistive-tech users get the block-level aria-labels on each block (which include state and time). |
| Per-row Update button                     | Removed from the calendar surface. Replaced by: (a) click-block detail panel for duration/time changes, (b) drag affordances for direct time/duration manipulation. |
| Output artifact column (.sa-artifact)     | Removed as a visible column. Surfaced as: (a) an artifact chip inside each block when height >= 56 px, (b) full detail in the click-block detail panel. |
| Duration chips (Sprint 13)                | Replaced by edge-drag resize. Duration chips remain available as a fallback inside the detail panel for keyboard users. |
| Start-time editor input (Sprint 14)       | Replaced by drag-to-move. Time input remains available inside the detail panel for keyboard users and precise entry. |
| Protected block lock icon                 | Preserved on each block (top-right corner). |
| Kaizen chip (part of: [title])            | Preserved inside each block when height >= 56 px; always visible in detail panel. |
| PROPOSED state WhyChip                   | Preserved — rendered inside each block when composition is PROPOSED and an explainEntry exists. |
| State CSS classes (sa-state-*)            | Equivalent data-state attribute on each block element. CSS selectors updated accordingly. |
| Elapsed timer (IN_PROGRESS)               | Preserved in the "Now" bar above the grid and in the detail panel. |
| Skip / Close action buttons               | Accessible only through the detail panel (click block → panel → Skip or Close). |
| Start button (SCHEDULED)                  | Accessible through the detail panel only. |
| Carried-over badge                        | Preserved as a chip inside the block. |
| User-edited tone (saturated bg)           | Preserved via `data-user-edited="true"` attribute — CSS applies saturated background to user-edited blocks. |

---

## 9. Information Density: Surfacing Metadata

### 9.1 The problem

The calendar block can show: time range, name, bucket color, artifact chip
(when tall enough), Kaizen chip (when tall enough). It cannot show:
- Expected output name (always)
- State label (must use color/badge)
- Start/Skip/Close action buttons
- Duration chips
- WhyChip explanation text

### 9.2 Options evaluated

Option A — Click block → side panel / popover with all metadata + Update

The panel slides in from the right (or appears as a popover anchored to the
block). It contains all metadata: name, time range, bucket, planned duration,
output artifact (name + schema link), state, elapsed time (if IN_PROGRESS),
WhyChip text (if PROPOSED), Kaizen linkage, and all action buttons (Start, Skip,
Close, Update/duration chips, time editor).

Option B — Inline expansion (block grows in place to show details)

Block expands vertically on click, pushing other blocks down. This disrupts
spatial layout — expanding one block shifts all subsequent blocks visually even
though their data hasn't changed. It confuses the time representation.

Option C — Hover tooltip

Hover shows a tooltip with metadata. This fails on touch devices. It also
requires hover dwell time, which is friction. Not suitable as the primary
mechanism for action buttons.

### 9.3 Recommendation: Option A — Click block → detail panel

Reasons:
- Does not distort the time grid. Spatial positions remain accurate.
- Supports all action buttons without crowding the block surface.
- Works on touch (tap = click).
- Side panel pattern is familiar from Google Calendar, Cal.com, and Motion.
- Accessible: panel receives focus on open; focus trap until close (existing
  focus-trap logic from Iter 24-27 applies directly).

Panel spec:
- Trigger: click / tap on any block.
- Position: right-side panel (320 px wide) on viewports >= 768 px;
  bottom sheet on narrower viewports.
- Header: activity name + bucket chip + state badge.
- Rows: Time, Duration (with chip selector), Output Artifact (with open link),
  Kaizen linkage (if present), WhyChip text (if PROPOSED).
- Actions: contextual — Start/Skip (SCHEDULED), Close (IN_PROGRESS), or
  disabled with reason (CLOSED/SKIPPED).
- Edit actions: Change Duration (chips), Change Start Time (time input).
  Both fire existing `applyDurationChange` / `applyStartTimeChange`.
- Close: X button or click outside or Escape key.
- On panel close: focus returns to the block that opened it.

---

## 10. Should the Calendar Replace or Toggle the Table?

### 10.1 Recommendation: REPLACE the table

Do not add a toggle. One view, one mental model.

Reasons:
1. A toggle implies both views are equally correct representations. They are not
   — the calendar is strictly better for time-spatial reasoning, which is the
   primary use case for Today.
2. A toggle doubles the maintenance surface: two renderers, two CSS trees, two
   aria hierarchies. Engineering cost is disproportionate to the benefit.
3. The table's information advantages (artifact column always visible, explicit
   column headers) are fully recovered by the detail panel in §9.3 without
   adding a redundant view.
4. Users landing on Today want to orient quickly ("where am I in my day?"). The
   table does not serve that goal. The calendar does.
5. Power-user exception: if quantitative data review is genuinely needed
   (e.g., reviewing all artifacts for the day before EOD), the existing
   Insights page and EOD reflection surface are the correct venue, not a
   Today table toggle.

---

## 11. Accessibility Considerations

### 11.1 Keyboard navigation

- Hour grid is navigable by arrow keys between blocks. Tab moves forward
  between focusable blocks; Shift+Tab moves backward.
- Each block is a focusable element (`tabindex="0"`, `role="button"`).
- Enter or Space on a focused block opens the detail panel.
- Arrow keys inside the detail panel navigate between action buttons.
- Escape closes the detail panel and returns focus to the originating block.

### 11.2 Screen-reader announcements

- Each block's `aria-label` follows the pattern:
  `"[Activity name], [state], [start time], [duration] minutes"`
  (same format as the existing `ScheduledActivityBlock` aria-label).
- Now-line: `aria-label="Current time, [HH:MM]"`. Does not need to be a live
  region — it updates on a 60-second cycle and is not interactive.
- Detail panel: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing
  to the panel's activity name heading.
- When the detail panel opens: `aria-live="polite"` region announces the panel
  title ("Deep Work Task details").

### 11.3 Drag affordances and keyboard fallback

- Drag-and-drop is a progressive enhancement only. All drag actions have a
  keyboard equivalent inside the detail panel (time input, duration chips).
- Drag handles are `aria-hidden="true"` so screen readers do not announce them.
- Screen readers interact with blocks via the click-to-panel flow only.
- Focus is never trapped inside a drag gesture — keyboard users never encounter
  a drag state.

### 11.4 Color and contrast

- Bucket colors (chip-project, chip-communication, chip-ci) must meet WCAG AA
  contrast on block text. Existing T1 token values should be validated against
  the calendar block background.
- State (CLOSED, SKIPPED) must not be communicated by color alone. Opacity
  reduction on CLOSED + `aria-label` state text + a visual strikethrough on the
  block name satisfies this.
- Protected lock icon: supplement with `aria-label="Protected block"` on the
  icon element (not `aria-hidden`).

### 11.5 Touch targets

- Minimum block height: 24 px (covers the 15-min minimum slot).
- Minimum tap target for the resize handle: 24 px tall × full block width.
- Detail panel action buttons: minimum 44 × 44 px tap targets per WCAG 2.5.5.

---

## 12. Open Questions

1. **Cascade disclosure in drag confirmation**: When a drag-to-move or drag-
   resize triggers a cascade shift of downstream non-protected blocks, should
   the confirmation bar list all affected blocks by name? ("Move Deep Work Task
   to 10:30? This will also shift CI Task and Reflection.") This is transparent
   but may be alarming for long cascades. Alternatively, show only the count
   ("2 other blocks will shift"). Phil must decide whether transparency or
   brevity is higher priority here.

2. **PROPOSED state drag permission**: Should drag be enabled at all when the
   composition is PROPOSED (not yet Accepted)? Current precedent (Update button
   suppression, Iter 28 hotfix) says no — edits on PROPOSED plans create a
   stuck EDITED+PROPOSED state. But disabling drag on PROPOSED makes the grid
   feel inert before acceptance. One option: drag is visually enabled but
   triggers an Accept-first interstitial before confirming the move.

3. **Lunch block color**: `bucket: null` lunch blocks currently fall to
   `chip-unknown` (muted grey via UNKNOWN meta in bucketMeta.js). In a
   calendar, a grey block amid colored blocks may read as an error state rather
   than a neutral break. Should a dedicated lunch bucket or a "neutral/break"
   visual style be introduced? This is a product decision that touches
   bucketMeta.js and T1 tokens.

4. **Overlap rendering for concurrent blocks**: BAM-X's composer does not
   intentionally produce overlapping blocks, but user edits (drag or
   applyStartTimeChange errors) could create them before the overlap guard
   fires. Does the calendar render overlapping blocks side-by-side (Google
   Calendar style, splitting the column) or does it treat overlaps as an error
   state and show a red banner? The overlap guard in `applyStartTimeChange`
   prevents new overlaps via edit mode, but legacy data or race conditions may
   produce them. Engineering needs a fallback rendering decision.

5. **Auto-scroll to now**: On page load, should the calendar auto-scroll to
   place the now-line at roughly 30% from the top of the viewport (Google
   Calendar behavior)? This is the most useful default for midday use but means
   the start of the day (07:00) is offscreen initially. Alternatively, start
   scrolled to 07:00 and let the user scroll. Phil should confirm which default
   matches his morning orientation habit.
