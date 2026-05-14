/**
 * TodayGrid — single-day calendar grid for the Today page (Iter 29 / Phase 1).
 *
 * Iter 36 / Phase 3 additions:
 *   - Transparent click-empty-time overlay: a zero-pointer-events layer that
 *     sits BEHIND blocks (z-index lower) and handles clicks on empty space.
 *   - Overlay emits data-action="CLICK_EMPTY_TIME" + data-payload with the
 *     clicked time snapped to 15-min increments.
 *   - 5px move threshold lives in dragController.js (CLICK_THRESHOLD_PX).
 *     The overlay uses pointer-events:none and only receives clicks forwarded
 *     from the timeline's pointerup when hasMoved is false (blocks absorb their
 *     own clicks via data-action=OPEN_BLOCK_DETAIL; the overlay only fires
 *     when the target is NOT a block — AC11).
 *   - The click detection is handled via a data-action on the timeline wrapper
 *     itself (data-action="CLICK_EMPTY_TIME") with pointer-events only for
 *     empty zones, controlled by CSS z-index stacking.
 *
 * Iter 35 / Phase 2 additions:
 *   - Resize handle (.cycle-block-resize-handle) on non-protected, non-lunch blocks
 *   - data-activity-start / data-activity-duration attributes for drag math
 *   - Ghost block render when dragSession is non-null (state slice from app.js)
 *   - Dragging class applied via installDragController (DOM-side; no rerender needed)
 *   - Protected blocks / lunch: no resize handle rendered
 *
 * Pure render. Returns an HTML string. No DOM access. Imports positioning
 * helpers from weekGridMath.js as-is (zero changes to that module).
 *
 * Component reuse strategy: Option (c) — new standalone component that
 * imports shared math helpers. WeekGrid is untouched. This keeps the blast
 * radius minimal for Phase 1; extraction to a shared TimeGridDay primitive
 * is deferred to a later iteration when both views are stable.
 *
 * Click-block behavior: blocks emit `data-action="OPEN_BLOCK_DETAIL"` with
 * `data-payload='{"activityId":"..."}`. app.js handles the action and opens
 * an existing popover/dialog. This keeps Phase 1 purely a render-layer
 * change — no new state machines, no touch of §6.5 files.
 *
 * Props:
 *   composition:        object   — active Composition (drives PROPOSED dashed outline)
 *   activities:         object[] — ScheduledActivity array (pre-sorted is fine;
 *                                  TodayGrid re-sorts internally for safety)
 *   nowIso:             string | null — ISO timestamp for now-line positioning
 *   kaizenTitleById:    Record<string, string> — optional kaizen title lookup
 *   compositionState:   string — explicit state override (defaults to composition.state)
 *   gridStartHour:      number — default 7
 *   gridEndHour:        number — default 19
 *   rowHeightPx:        number — default 60
 *   dragSession:        object | null — from app.js state.dragSession (Phase 2)
 *
 * §6.5 boundary: this file lives in js/ui/components/ — frontend only.
 * Zero touches to js/composer/, js/engine/, js/domain/types.js, js/events/.
 */

import { esc } from '../mount.js';
import {
  DEFAULT_GRID_START_HOUR,
  DEFAULT_GRID_END_HOUR,
  DEFAULT_ROW_HEIGHT_PX,
  topOffsetPx,
  heightPx,
  nowLineOffsetPx,
  hourRailLabels,
  parseMinutesOfDay,
  extractDateIso
} from '../weekGridMath.js';
import { formatTimeRange } from '../timeFormat.js';
import bucketMeta from '../bucketMeta.js';
import { isProtectedBlock } from '../editMode.js';
import { orderActivitiesForDisplay } from './CycleCard.js';

/** Minimum rendered block height in px — keeps short blocks clickable. */
const MIN_BLOCK_HEIGHT_PX = 24;

/** Snap interval for clicked time (minutes). Matches dragController.js. */
const CLICK_SNAP_MINUTES = 15;

/**
 * Minimum height (px) below which the end time is dropped from the
 * time-range label. Mirrors WG_RANGE_MIN_HEIGHT_PX in WeekGrid.js.
 */
const RANGE_MIN_HEIGHT_PX = 40;

/**
 * Format an ISO/HH:MM start time as a clean `HH:MM` display string.
 *
 * @param {string | null | undefined} value
 * @returns {string}
 */
function formatHHMM(value) {
  const m = parseMinutesOfDay(value);
  if (m === null) return '';
  const hh = String(Math.floor(m / 60)).padStart(2, '0');
  const mm = String(m % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * Render a single calendar block absolutely positioned on the timeline.
 *
 * Iter 35 Phase 2: adds resize handle, data-activity-start/duration attrs,
 * and drag-handle aria-label. Protected blocks and lunch blocks receive no
 * resize handle (safety gate AC6).
 *
 * @param {{
 *   activity:          object,
 *   gridStartHour:     number,
 *   rowHeightPx:       number,
 *   kaizenTitleById:   Record<string, string>,
 *   isProposed:        boolean,
 *   blockIndex:        number
 * }} ctx
 * @returns {string}
 */
function renderTodayBlock(ctx) {
  const { activity, gridStartHour, rowHeightPx, kaizenTitleById, isProposed, blockIndex } = ctx;

  const startValue = activity.plannedStartAt ?? activity.anchor ?? null;
  const top = topOffsetPx(startValue, gridStartHour, rowHeightPx);
  if (top === null) return '';

  const dur = Number(activity.plannedDurationMinutes ?? 0);
  const rawH = heightPx(dur, rowHeightPx);
  if (rawH <= 0) return '';

  // Clamp to minimum so short blocks remain clickable.
  const h = Math.max(rawH, MIN_BLOCK_HEIGHT_PX);

  // Bucket styling.
  const bucket = activity.bucket ?? null;
  const isLunch = bucket === null;
  const meta = bucketMeta(bucket);
  const bucketChipClass = isLunch ? 'chip-unknown' : meta.chipClass;

  // PROPOSED dashed outline modifier.
  const proposedClass = isProposed ? ' cycle-block-proposed' : '';

  // Lunch modifier.
  const lunchClass = isLunch ? ' cycle-block-lunch' : '';

  // Protected blocks get a lock indicator.
  const protected_ = isProtectedBlock(activity);
  const lockChip = protected_
    ? `<span class="cycle-block-lock" aria-label="Protected block" title="Protected — cannot be moved">&#x1F512;</span>`
    : '';

  // Time label — full range when block is tall enough, start-only when short.
  const timeLabel = rawH < RANGE_MIN_HEIGHT_PX
    ? formatHHMM(startValue)
    : formatTimeRange(startValue, dur);

  const name = activity.name ?? activity.catalogEntryId ?? '(unnamed)';
  const userEdited = activity.userEdited === true;
  const activityId = activity.id ?? '';
  const activityState = activity.state ?? '';

  // Kaizen chip — Iter 33: glow-ring class on blocks with kaizen links (AC10).
  const kaizenId = activity.linkedKaizenId ?? null;
  const kaizenTitle = kaizenId && kaizenTitleById && kaizenTitleById[kaizenId]
    ? kaizenTitleById[kaizenId]
    : null;
  const kaizenLinkedAttr = kaizenId ? ' data-kaizen-linked="true"' : '';
  const kaizenChip = kaizenTitle
    ? `<span class="cycle-block-kaizen cycle-block-kaizen-linked" aria-label="part of Kaizen ${esc(kaizenTitle)}">${esc(kaizenTitle)}</span>`
    : '';

  // Accessible aria-label matching AC18.
  const endMin = parseMinutesOfDay(startValue);
  const endFormatted = endMin !== null
    ? (() => {
        const e = endMin + Math.round(dur);
        return `${String(Math.floor(e / 60)).padStart(2, '0')}:${String(e % 60).padStart(2, '0')}`;
      })()
    : '';
  const ariaLabel = `${name}, ${activityState}, ${formatHHMM(startValue)} to ${endFormatted}, ${isLunch ? 'Lunch' : meta.label}${protected_ ? ', protected, cannot be moved' : ''}`;

  // Click action — emits OPEN_BLOCK_DETAIL so app.js can open the detail popover.
  const payload = JSON.stringify({ activityId });

  // Iter 33: staggered animation-delay per block index (AC11). Cap at 6 blocks.
  const staggerMs = Math.min(blockIndex, 6) * 60 + 120;

  // Iter 35 Phase 2: minutes-of-day for drag math.
  // Store start in minutes and duration so dragController can read them.
  const startMinutesOfDay = parseMinutesOfDay(startValue);
  const startAttr = startMinutesOfDay !== null ? ` data-activity-start="${startMinutesOfDay}"` : '';
  const durationAttr = ` data-activity-duration="${Math.round(dur)}"`;

  // Iter 35 Phase 2: resize handle — only on non-protected, non-lunch blocks.
  // Protected/lunch blocks MUST NOT have drag/resize handles (AC6).
  const canDrag = !protected_ && !isLunch;
  const resizeHandle = canDrag
    ? `<div class="cycle-block-resize-handle" aria-label="Drag to resize ${esc(name)}" aria-hidden="true" title="Drag to resize"></div>`
    : '';

  // Iter 35 Phase 2: draggable role hint (AC14) — only on non-protected, non-lunch.
  const dragHandleAttr = canDrag
    ? ` aria-roledescription="draggable calendar block"`
    : '';

  return `<article
    class="cycle-block-positioned ${esc(bucketChipClass)}${proposedClass}${lunchClass}"
    style="top: ${top}px; height: ${h}px; animation-delay: ${staggerMs}ms"
    data-activity-id="${esc(activityId)}"
    data-bucket="${esc(bucket ?? '')}"
    data-state="${esc(activityState)}"
    data-user-edited="${userEdited ? 'true' : 'false'}"
    data-block-index="${blockIndex}"${kaizenLinkedAttr}${startAttr}${durationAttr}
    role="button"
    tabindex="0"
    aria-label="${esc(ariaLabel)}"${dragHandleAttr}
    data-action="OPEN_BLOCK_DETAIL"
    data-payload='${esc(payload)}'
  >
    ${lockChip}<span class="cycle-block-time">${esc(timeLabel)}</span>
    <span class="cycle-block-name">${esc(name)}</span>
    ${kaizenChip}${resizeHandle}
  </article>`;
}

/**
 * Render the hour rail (left column).
 * Iter 33: supports current-hour highlighting via data-block-index (AC14).
 *
 * @param {number} gridStartHour
 * @param {number} gridEndHour
 * @param {number} rowHeightPx
 * @param {number|null} nowMinutesOfDay — for current-hour highlight
 * @returns {string}
 */
function renderTodayHourRail(gridStartHour, gridEndHour, rowHeightPx, nowMinutesOfDay = null) {
  const labels = hourRailLabels(gridStartHour, gridEndHour);
  const hours = labels
    .map((label, i) => {
      const hour = gridStartHour + i;
      const isCurrent = nowMinutesOfDay !== null && hour === Math.floor(nowMinutesOfDay / 60);
      const cls = isCurrent ? 'cycle-hour cycle-hour-current' : 'cycle-hour';
      return `<span class="${cls}" style="height: ${rowHeightPx}px">${esc(label)}</span>`;
    })
    .join('');
  return `<div class="cycle-hour-rail" aria-hidden="true">${hours}</div>`;
}

/**
 * Render horizontal hour-line dividers inside the timeline (AC15).
 * Subtle 1px hairlines at each hour boundary.
 *
 * @param {number} gridStartHour
 * @param {number} gridEndHour
 * @param {number} rowHeightPx
 * @returns {string}
 */
function renderHourLines(gridStartHour, gridEndHour, rowHeightPx) {
  const lines = [];
  for (let h = gridStartHour; h <= gridEndHour; h++) {
    const top = (h - gridStartHour) * rowHeightPx;
    lines.push(`<div class="cycle-hour-line" style="top: ${top}px" aria-hidden="true"></div>`);
  }
  return lines.join('\n');
}

/**
 * TodayGrid main entry — single-day calendar grid.
 *
 * Iter 35 Phase 2: accepts dragSession for ghost block rendering.
 *
 * @param {{
 *   composition:       object | null,
 *   activities:        object[],
 *   nowIso?:           string | null,
 *   kaizenTitleById?:  Record<string, string>,
 *   compositionState?: string,
 *   gridStartHour?:    number,
 *   gridEndHour?:      number,
 *   rowHeightPx?:      number,
 *   dragSession?:      object | null  — from app.js state.dragSession (Phase 2 pending flow)
 * }} props
 * @returns {string}
 */
export function TodayGrid(props = {}) {
  const composition = props.composition ?? null;

  // Empty state — no composition → render empty hour grid (muted).
  if (!composition) {
    return '<div class="cycle-calendar-grid cycle-calendar-grid-empty" aria-label="No plan yet — hour grid"></div>';
  }

  const activities = Array.isArray(props.activities) ? props.activities : [];
  const nowIso = typeof props.nowIso === 'string' ? props.nowIso : null;
  const kaizenTitleById = props.kaizenTitleById ?? {};
  const gridStartHour = Number.isFinite(props.gridStartHour) ? props.gridStartHour : DEFAULT_GRID_START_HOUR;
  const gridEndHour = Number.isFinite(props.gridEndHour) ? props.gridEndHour : DEFAULT_GRID_END_HOUR;
  const rowHeightPx = Number.isFinite(props.rowHeightPx) ? props.rowHeightPx : DEFAULT_ROW_HEIGHT_PX;
  // Iter 35 Phase 2: dragSession for PROPOSED pending-confirm ghost block.
  const dragSession = props.dragSession ?? null;

  // Derive state: explicit prop wins, then composition.state, then 'PROPOSED'.
  const compState = props.compositionState ?? composition.state ?? 'PROPOSED';
  const isProposed = compState === 'PROPOSED';

  // Sort activities by plannedStartAt for display (CycleCard pattern).
  const ordered = orderActivitiesForDisplay(activities);

  // Build blocks — Iter 33: pass blockIndex for staggered reveal (AC11).
  const blocks = ordered
    .map((a, i) => renderTodayBlock({ activity: a, gridStartHour, rowHeightPx, kaizenTitleById, isProposed, blockIndex: i }))
    .filter(Boolean)
    .join('\n');

  // Iter 35 Phase 2: ghost block for PROPOSED pending-confirm flow.
  // Shown as a dashed overlay at the proposed position while Confirm/Cancel is visible.
  let ghostBlockHtml = '';
  if (dragSession && dragSession.activityId && dragSession.proposedStart !== undefined && dragSession.proposedDuration !== undefined) {
    const ghostTop = (dragSession.proposedStart - gridStartHour * 60) * (rowHeightPx / 60);
    const ghostH   = Math.max(dragSession.proposedDuration * (rowHeightPx / 60), MIN_BLOCK_HEIGHT_PX);
    ghostBlockHtml = `<div
      class="cycle-block-ghost"
      style="top: ${ghostTop}px; height: ${ghostH}px"
      aria-hidden="true"
      aria-label="Proposed new position"
    ></div>`;
  }

  // Now-line — derive the composition date from the first activity or now.
  // Fall back to the date portion of nowIso when composition has no explicit date.
  const compDate = composition.date ?? extractDateIso(nowIso) ?? '';
  const nowOffset = nowIso && compDate
    ? nowLineOffsetPx(nowIso, compDate, gridStartHour, gridEndHour, rowHeightPx)
    : null;

  // Iter 33: always-visible HH:MM timestamp label on now-line (AC7).
  let nowTimeLabel = '';
  if (nowIso && typeof nowIso === 'string') {
    const nowMin = parseMinutesOfDay(nowIso);
    if (nowMin !== null) {
      const hh = String(Math.floor(nowMin / 60)).padStart(2, '0');
      const mm = String(nowMin % 60).padStart(2, '0');
      nowTimeLabel = `${hh}:${mm}`;
    }
  }

  const nowLine = nowOffset !== null
    ? `<div class="cycle-now-line" style="top: ${nowOffset}px" aria-hidden="true" aria-label="Current time">${nowTimeLabel ? `<span class="cycle-now-label">${esc(nowTimeLabel)}</span>` : ''}</div>`
    : '';

  // Hour rail — Iter 33: pass nowMinutes for current-hour highlight (AC14).
  const nowMinutesOfDay = nowIso ? parseMinutesOfDay(nowIso) : null;
  const rail = renderTodayHourRail(gridStartHour, gridEndHour, rowHeightPx, nowMinutesOfDay);

  // Hour lines — Iter 33: subtle hairlines in timeline (AC15).
  const hourLines = renderHourLines(gridStartHour, gridEndHour, rowHeightPx);

  // Timeline height.
  const timelineHeight = (gridEndHour - gridStartHour) * rowHeightPx;

  // Iter 36 Phase 3: transparent click-empty-time overlay (AC1, AC11, AC12).
  // Sits BEHIND blocks (z-index via CSS: .cycle-empty-overlay { z-index:0 },
  // .cycle-block-positioned { z-index:1 }). Clicks on blocks are absorbed by
  // the block's data-action=OPEN_BLOCK_DETAIL first (bubbling order in the
  // delegate means the BLOCK click fires, not the overlay). The overlay fires
  // only when the raw click target is NOT inside a .cycle-block-positioned.
  // app.js CLICK_EMPTY_TIME handler reads ctx.event.clientY + the timeline
  // element's getBoundingClientRect() to compute the snapped minute value.
  // data-grid-start and data-row-height are emitted so app.js can compute
  // the minute without accessing internal constants.
  const emptyOverlay = `<div
    class="cycle-empty-overlay"
    data-action="CLICK_EMPTY_TIME"
    data-payload='{}'
    data-grid-start-hour="${gridStartHour}"
    data-row-height-px="${rowHeightPx}"
    data-snap-minutes="${CLICK_SNAP_MINUTES}"
    aria-hidden="true"
    style="position:absolute;inset:0;z-index:0"
  ></div>`;

  return `<div class="cycle-calendar-grid" data-composition-state="${esc(compState)}">
  ${rail}
  <div class="cycle-timeline" style="height: ${timelineHeight}px">
    ${emptyOverlay}
    ${hourLines}
    ${blocks}
    ${ghostBlockHtml}
    ${nowLine}
  </div>
</div>`;
}

export default TodayGrid;
