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
 * Iter 47 Phase 2 additions:
 *   - Per-bucket render functions: blockWrapper(), renderProjectBlock(),
 *     renderCommBlock(), renderCIBlock(), renderLunchBlock(), renderProtectedBlock()
 *   - renderTodayBlock() is now a dispatch function (AC1–AC6)
 *   - Lunch blocks emit OPEN_LUNCH_TOOLTIP instead of OPEN_BLOCK_DETAIL (AC13)
 *   - CI EoAR blocks get .cycle-block-sacred CSS class (AC4, AC18)
 *   - Lock emoji replaced by CSS-only .cycle-block-sacred indicator on EoAR
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
 * Iter 46 Phase 1 — minimum block height (px) at which the PROJECT secondary
 * info line (intention or outputArtifact.name) is shown. Blocks shorter than
 * this threshold suppress the line to avoid clutter.
 * AC2: height < 56px → secondary line hidden.
 */
const SECONDARY_LINE_MIN_HEIGHT_PX = 56;

/**
 * CatalogEntryId for End-of-Activity Reflection — gets sacred treatment.
 * Iter 47 Phase 2 §A.3: documented as the only ID that gets .cycle-block-sacred.
 */
const EAR_CATALOG_ID = 'gen_end_of_activity_reflection';

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

// ---------------------------------------------------------------------------
// Iter 47 Phase 2 — Shared block wrapper (AC1)
// ---------------------------------------------------------------------------

/**
 * Build the shared positioning shell for every calendar block.
 *
 * Extracts all common concerns (absolute positioning, aria-label, data-attrs,
 * click-handler wiring, staggered animation, drag attrs) so per-bucket
 * renderers can focus purely on their inner content.
 *
 * @param {{
 *   activity:       object,
 *   h:              number,      — rendered height in px (clamped)
 *   top:            number,      — top offset in px
 *   bucketChipClass:string,
 *   proposedClass:  string,
 *   lunchClass:     string,
 *   ariaLabel:      string,
 *   payload:        string,      — JSON-stringified click payload
 *   staggerMs:      number,
 *   startAttr:      string,
 *   durationAttr:   string,
 *   canDrag:        boolean,
 *   kaizenLinkedAttr:string,
 *   extraClasses:   string,      — additional CSS classes (e.g. cycle-block-sacred)
 *   actionAttr:     string,      — data-action value (default OPEN_BLOCK_DETAIL)
 * }} wrapCtx
 * @param {string} innerHtml — the bucket-specific inner HTML
 * @returns {string}
 */
function blockWrapper(wrapCtx, innerHtml) {
  const {
    activity,
    h,
    top,
    bucketChipClass,
    proposedClass,
    lunchClass,
    ariaLabel,
    payload,
    staggerMs,
    startAttr,
    durationAttr,
    canDrag,
    kaizenLinkedAttr,
    extraClasses = '',
    actionAttr = 'OPEN_BLOCK_DETAIL'
  } = wrapCtx;

  const activityId = activity.id ?? '';
  const activityState = activity.state ?? '';
  const userEdited = activity.userEdited === true;

  const dragHandleAttr = canDrag
    ? ` aria-roledescription="draggable calendar block"`
    : '';

  const extraClassStr = extraClasses ? ` ${extraClasses}` : '';

  return `<article
    class="cycle-block-positioned ${esc(bucketChipClass)}${proposedClass}${lunchClass}${extraClassStr}"
    style="top: ${top}px; height: ${h}px; animation-delay: ${staggerMs}ms"
    data-activity-id="${esc(activityId)}"
    data-bucket="${esc(activity.bucket ?? '')}"
    data-state="${esc(activityState)}"
    data-user-edited="${userEdited ? 'true' : 'false'}"
    data-block-index="${wrapCtx.blockIndex ?? 0}"${kaizenLinkedAttr}${startAttr}${durationAttr}
    role="button"
    tabindex="0"
    aria-label="${esc(ariaLabel)}"${dragHandleAttr}
    data-action="${esc(actionAttr)}"
    data-payload='${esc(payload)}'
  >
    ${innerHtml}
  </article>`;
}

// ---------------------------------------------------------------------------
// Iter 47 Phase 2 — Per-bucket render functions (AC2–AC6)
// ---------------------------------------------------------------------------

/**
 * Render a PROJECT block.
 *
 * Shows: time label + name + secondary line (intention > outputArtifact.name)
 * when block height >= 56px + kaizen sub-label (Iter 48 Phase 3A) + resize handle.
 *
 * Iter 48 Phase 3A (AC1): when linkedKaizenId is present, render a kaizen
 * sub-label below the activity name (height-gated ≥56px). The kaizen chip
 * on the PROJECT block already existed (kaizenChip) — the sub-label is a
 * distinct smaller element showing kaizen title inline.
 *
 * AC7 (META §A.2 orthogonal): PROJECT blocks WITHOUT linkedKaizenId do NOT
 * show an "unlinked" indicator — that indicator only applies to CI blocks.
 *
 * @param {object} activity
 * @param {object|null} catalogEntry
 * @param {object} ctx — shared pre-computed context from renderTodayBlock
 * @returns {string}
 */
function renderProjectBlock(activity, catalogEntry, ctx) {
  const { timeLabel, name, kaizenChip, kaizenTitle, resizeHandle, h } = ctx;

  // Secondary info line: prefer intention, fall back to outputArtifact.name.
  let secondaryLine = '';
  if (h >= SECONDARY_LINE_MIN_HEIGHT_PX) {
    const intentionText = typeof activity.intention === 'string' && activity.intention.trim()
      ? activity.intention.trim()
      : null;
    const artifactName = catalogEntry?.outputArtifact?.name ?? null;
    const secondaryText = intentionText ?? artifactName ?? null;
    if (secondaryText) {
      // AC12/AC4E: truncate with ellipsis via CSS (overflow:hidden; text-overflow:ellipsis)
      secondaryLine = `<span class="cycle-block-secondary" aria-label="Output: ${esc(secondaryText)}">${esc(secondaryText)}</span>`;
    }
  }

  // Iter 48 Phase 3A (AC1): kaizen sub-label on PROJECT blocks with a linked kaizen.
  // Height-gated: only render when block height ≥56px to avoid clutter on short blocks.
  // Distinct from kaizenChip (which is the existing glow-ring chip) — sub-label is
  // a smaller muted text line below the activity name.
  //
  // Phase 3.2 (R3): sub-label wins over chip when h ≥ 56px to avoid dual
  // representation. Chip still renders on short blocks (h < 56px) so the
  // kaizen signal is never silently dropped (AC-KZ1/AC-KZ2).
  const showSubLabel = h >= SECONDARY_LINE_MIN_HEIGHT_PX && !!kaizenTitle;
  const kaizenSubLabel = showSubLabel
    ? `<span class="cycle-block-kaizen-sublabel" aria-label="Kaizen: ${esc(kaizenTitle)}">${esc(kaizenTitle)}</span>`
    : '';
  // Suppress chip when sub-label is rendered to avoid dual representation.
  const effectiveKaizenChip = showSubLabel ? '' : kaizenChip;

  return `<span class="cycle-block-time">${esc(timeLabel)}</span>
    <span class="cycle-block-name">${esc(name)}</span>
    ${secondaryLine}${kaizenSubLabel}${effectiveKaizenChip}${resizeHandle}`;
}

/**
 * Render a COMMUNICATION block.
 *
 * Shows: time label + specific sub-type name (NOT generic "COMMUNICATION")
 * + kaizen chip + resize handle.
 * AC3: renderCommBlock exists; shows sub-type name.
 *
 * @param {object} activity
 * @param {object|null} _catalogEntry
 * @param {object} ctx — shared pre-computed context
 * @returns {string}
 */
function renderCommBlock(activity, _catalogEntry, ctx) {
  const { timeLabel, kaizenChip, resizeHandle } = ctx;

  // Use the activity name as primary — it is already the sub-type name
  // (Daily Standup, AM High-value Communication, etc.) from the composer.
  // Lock chip for protected COMM blocks.
  const lockChip = ctx.protected_
    ? `<span class="cycle-block-lock" aria-label="Protected block" title="Protected anchor"></span>`
    : '';

  const name = activity.name ?? activity.catalogEntryId ?? '(unnamed)';

  return `${lockChip}<span class="cycle-block-time">${esc(timeLabel)}</span>
    <span class="cycle-block-name">${esc(name)}</span>
    ${kaizenChip}${resizeHandle}`;
}

/**
 * Render a CI (Continuous Improvement) block.
 *
 * End-of-Activity Reflection (gen_end_of_activity_reflection) gets the
 * .cycle-block-sacred CSS class and a CSS-only sacred indicator (no lock emoji).
 * All other protected CI blocks (sprint ceremonies) keep the lock indicator.
 * AC4: renderCIBlock exists with .cycle-block-sacred class on EoAR.
 *
 * Iter 48 Phase 3A (AC2): when linkedKaizenId is present, render a kaizen
 * sub-label below the activity name (height-gated ≥56px).
 *
 * Iter 48 Phase 3B (AC5): CI blocks WITHOUT linkedKaizenId that are NOT sprint
 * ceremonies (user-added CI) show a subtle "unlinked" left-border indicator.
 * Sprint ceremony blocks (PROTECTED_CATALOG_IDS) do NOT get this indicator (AC6).
 * PROJECT blocks WITHOUT linkedKaizenId do NOT get this indicator (AC7).
 *
 * @param {object} activity
 * @param {object|null} _catalogEntry
 * @param {object} ctx — shared pre-computed context
 * @returns {string}
 */
function renderCIBlock(activity, _catalogEntry, ctx) {
  const { timeLabel, kaizenChip, kaizenTitle, resizeHandle, h } = ctx;
  const name = activity.name ?? activity.catalogEntryId ?? '(unnamed)';

  const isEoAR = activity.catalogEntryId === EAR_CATALOG_ID;

  // EoAR: CSS-only sacred indicator instead of lock emoji.
  // Sprint ceremonies and other protected CI: standard lock chip.
  let lockOrSacred = '';
  if (isEoAR) {
    // CSS class (.cycle-block-sacred) is applied via extraClasses in blockWrapper.
    // The lock indicator is a CSS dot/halo rendered by the class — no emoji.
    lockOrSacred = `<span class="cycle-block-sacred-indicator" aria-label="Sacred reflection block" aria-hidden="true"></span>`;
  } else if (ctx.protected_) {
    lockOrSacred = `<span class="cycle-block-lock" aria-label="Protected block" title="Protected — cannot be moved">&#x1F512;</span>`;
  }

  // Iter 48 Phase 3A (AC2): kaizen sub-label on CI blocks with a linked kaizen.
  // Height-gated: only render when block height ≥56px.
  //
  // Phase 3.2 (R3): sub-label wins over chip when h ≥ 56px to avoid dual
  // representation of the same kaizen title. Chip retained for h < 56px
  // so kaizen signal is never silently dropped (AC-KZ1/AC-KZ2).
  const showSubLabel = h >= SECONDARY_LINE_MIN_HEIGHT_PX && !!kaizenTitle;
  const kaizenSubLabel = showSubLabel
    ? `<span class="cycle-block-kaizen-sublabel" aria-label="Kaizen: ${esc(kaizenTitle)}">${esc(kaizenTitle)}</span>`
    : '';
  // Suppress chip when sub-label is rendered to avoid dual representation.
  const effectiveKaizenChip = showSubLabel ? '' : kaizenChip;

  // Iter 48 Phase 3B (AC5, AC6): unlinked CI indicator for user-added CI without a kaizen link.
  // Conditions for showing: CI block, no linkedKaizenId, NOT a sprint ceremony (protected),
  // NOT EoAR (already has its own sacred indicator).
  // Sprint ceremonies (protected) are excluded — they are anchors, not evidence-linked (AC6).
  const hasKaizen = !!activity.linkedKaizenId;
  const isSprintCeremony = ctx.protected_ && !isEoAR;
  const showUnlinked = !hasKaizen && !isEoAR && !isSprintCeremony;
  const unlinkedIndicator = showUnlinked
    ? `<span class="cycle-block-ci-unlinked" aria-label="No Kaizen link" title="No evidence link — consider linking to a Kaizen"></span>`
    : '';

  return `${lockOrSacred}${unlinkedIndicator}<span class="cycle-block-time">${esc(timeLabel)}</span>
    <span class="cycle-block-name">${esc(name)}</span>
    ${kaizenSubLabel}${effectiveKaizenChip}${resizeHandle}`;
}

/**
 * Render a Lunch block (bucket: null).
 *
 * Minimal: time + "Lunch" label only. No kaizen chip. No resize handle.
 * Emits OPEN_LUNCH_TOOLTIP action so app.js can show an inline tooltip
 * instead of the full BlockDetailDialog (AC5, AC13).
 * AC5: renderLunchBlock exists with minimal content.
 *
 * @param {object} activity
 * @param {object} ctx — shared pre-computed context
 * @returns {string}
 */
function renderLunchBlock(activity, ctx) {
  const { timeLabel } = ctx;
  const name = activity.name ?? 'Lunch';

  return `<span class="cycle-block-time">${esc(timeLabel)}</span>
    <span class="cycle-block-name">${esc(name)}</span>`;
}

/**
 * Render a protected block that doesn't fall into a specific bucket category
 * (e.g. strategic PROJECT blocks, carried-over blocks).
 *
 * Uses CSS-only lock indicator (.cycle-block-lock as styled element, no emoji
 * on the rendered lock chip — the lock class provides the visual). No disabled
 * Edit button (that is handled in BlockDetailDialog, not here).
 * AC6: renderProtectedBlock exists; no disabled Edit button anywhere in block.
 *
 * @param {object} activity
 * @param {object|null} catalogEntry
 * @param {object} ctx — shared pre-computed context
 * @returns {string}
 */
function renderProtectedBlock(activity, catalogEntry, ctx) {
  const { timeLabel, kaizenChip } = ctx;
  const name = activity.name ?? activity.catalogEntryId ?? '(unnamed)';

  // Visual lock indicator (CSS-only, no emoji) — communicates protection without text.
  const lockChip = `<span class="cycle-block-lock" aria-label="Protected block" title="Protected — cannot be moved">&#x1F512;</span>`;

  // Secondary line from catalog artifact if available.
  let secondaryLine = '';
  if (ctx.h >= SECONDARY_LINE_MIN_HEIGHT_PX) {
    const artifactName = catalogEntry?.outputArtifact?.name ?? null;
    if (artifactName) {
      secondaryLine = `<span class="cycle-block-secondary">${esc(artifactName)}</span>`;
    }
  }

  return `${lockChip}<span class="cycle-block-time">${esc(timeLabel)}</span>
    <span class="cycle-block-name">${esc(name)}</span>
    ${secondaryLine}${kaizenChip}`;
}

// ---------------------------------------------------------------------------
// Iter 47 Phase 2 — Main dispatch function (refactored from single render fn)
// ---------------------------------------------------------------------------

/**
 * Render a single calendar block absolutely positioned on the timeline.
 *
 * Iter 35 Phase 2: adds resize handle, data-activity-start/duration attrs,
 * and drag-handle aria-label. Protected blocks and lunch blocks receive no
 * resize handle (safety gate AC6).
 *
 * Iter 46 Phase 1: accepts catalogEntryById map for PROJECT secondary line
 * (AC1–AC4). Pass the full map; lookup is done inside this function.
 *
 * Iter 47 Phase 2: refactored to dispatch to per-bucket render functions
 * (AC1–AC6). blockWrapper() holds all shared concerns. Lunch blocks emit
 * OPEN_LUNCH_TOOLTIP instead of OPEN_BLOCK_DETAIL (AC13).
 *
 * @param {{
 *   activity:          object,
 *   gridStartHour:     number,
 *   rowHeightPx:       number,
 *   kaizenTitleById:   Record<string, string>,
 *   catalogEntryById:  Record<string, object>,
 *   isProposed:        boolean,
 *   blockIndex:        number
 * }} ctx
 * @returns {string}
 */
function renderTodayBlock(ctx) {
  const { activity, gridStartHour, rowHeightPx, kaizenTitleById, catalogEntryById, isProposed, blockIndex } = ctx;

  const startValue = activity.plannedStartAt ?? activity.anchor ?? null;
  const top = topOffsetPx(startValue, gridStartHour, rowHeightPx);
  if (top === null) return '';

  const dur = Number(activity.plannedDurationMinutes ?? 0);
  const rawH = heightPx(dur, rowHeightPx);
  if (rawH <= 0) return '';

  // Clamp to minimum so short blocks remain clickable.
  const h = Math.max(rawH, MIN_BLOCK_HEIGHT_PX);

  // Bucket detection.
  const bucket = activity.bucket ?? null;
  const isLunch = bucket === null;
  const meta = bucketMeta(bucket);
  const bucketChipClass = isLunch ? 'chip-unknown' : meta.chipClass;

  // PROPOSED dashed outline modifier.
  const proposedClass = isProposed ? ' cycle-block-proposed' : '';

  // Lunch modifier.
  const lunchClass = isLunch ? ' cycle-block-lunch' : '';

  // Protected detection.
  const protected_ = isProtectedBlock(activity);

  // Time label — full range when block is tall enough, start-only when short.
  const timeLabel = rawH < RANGE_MIN_HEIGHT_PX
    ? formatHHMM(startValue)
    : formatTimeRange(startValue, dur);

  const name = activity.name ?? activity.catalogEntryId ?? '(unnamed)';
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

  // Accessible aria-label.
  const endMin = parseMinutesOfDay(startValue);
  const endFormatted = endMin !== null
    ? (() => {
        const e = endMin + Math.round(dur);
        return `${String(Math.floor(e / 60)).padStart(2, '0')}:${String(e % 60).padStart(2, '0')}`;
      })()
    : '';
  const ariaLabel = `${name}, ${activityState}, ${formatHHMM(startValue)} to ${endFormatted}, ${isLunch ? 'Lunch' : meta.label}${protected_ ? ', protected, cannot be moved' : ''}`;

  // Iter 33: staggered animation-delay per block index (AC11). Cap at 6 blocks.
  const staggerMs = Math.min(blockIndex, 6) * 60 + 120;

  // Iter 35 Phase 2: minutes-of-day for drag math.
  const startMinutesOfDay = parseMinutesOfDay(startValue);
  const startAttr = startMinutesOfDay !== null ? ` data-activity-start="${startMinutesOfDay}"` : '';
  const durationAttr = ` data-activity-duration="${Math.round(dur)}"`;

  // Iter 35 Phase 2: resize handle — only on non-protected, non-lunch blocks.
  const canDrag = !protected_ && !isLunch;
  const resizeHandle = canDrag
    ? `<div class="cycle-block-resize-handle" aria-label="Drag to resize ${esc(name)}" aria-hidden="true" title="Drag to resize"></div>`
    : '';

  // Catalog entry lookup for per-bucket renderers.
  const catalogEntry = catalogEntryById && activity.catalogEntryId
    ? catalogEntryById[activity.catalogEntryId] ?? null
    : null;

  // Shared context passed to per-bucket renderers.
  // Iter 48 Phase 3A: add kaizenTitle to shared context so renderProjectBlock
  // and renderCIBlock can build the kaizen sub-label (AC1, AC2).
  const sharedCtx = {
    timeLabel,
    name,
    kaizenChip,
    kaizenTitle,    // Iter 48 Phase 3A — kaizen title string or null
    resizeHandle,
    h,
    protected_,
    blockIndex
  };

  // Wrapper context (shared positioning + aria + data-attrs).
  const baseWrapCtx = {
    activity,
    h,
    top,
    bucketChipClass,
    proposedClass,
    lunchClass,
    ariaLabel,
    staggerMs,
    startAttr,
    durationAttr,
    canDrag,
    kaizenLinkedAttr,
    extraClasses: '',
    actionAttr: 'OPEN_BLOCK_DETAIL',
    blockIndex
  };

  // Iter 47 Phase 2 — Dispatch to per-bucket renderer.
  if (isLunch) {
    // AC13: Lunch emits OPEN_LUNCH_TOOLTIP, not OPEN_BLOCK_DETAIL.
    const payload = JSON.stringify({ activityId, timeRange: formatTimeRange(startValue, dur) });
    const wrapCtx = { ...baseWrapCtx, actionAttr: 'OPEN_LUNCH_TOOLTIP', payload };
    return blockWrapper(wrapCtx, renderLunchBlock(activity, sharedCtx));
  }

  const payload = JSON.stringify({ activityId });

  if (bucket === 'PROJECT') {
    const wrapCtx = { ...baseWrapCtx, payload };
    return blockWrapper(wrapCtx, renderProjectBlock(activity, catalogEntry, sharedCtx));
  }

  if (bucket === 'COMMUNICATION') {
    const wrapCtx = { ...baseWrapCtx, payload };
    return blockWrapper(wrapCtx, renderCommBlock(activity, catalogEntry, sharedCtx));
  }

  if (bucket === 'CI') {
    // AC4, AC18: EoAR gets .cycle-block-sacred extra class.
    const isEoAR = activity.catalogEntryId === EAR_CATALOG_ID;
    const extraClasses = isEoAR ? 'cycle-block-sacred' : '';
    const wrapCtx = { ...baseWrapCtx, payload, extraClasses };
    return blockWrapper(wrapCtx, renderCIBlock(activity, catalogEntry, sharedCtx));
  }

  // Fallback: protected blocks or unknown bucket types.
  if (protected_) {
    const wrapCtx = { ...baseWrapCtx, payload };
    return blockWrapper(wrapCtx, renderProtectedBlock(activity, catalogEntry, sharedCtx));
  }

  // Generic fallback — render same as project block for unknown buckets.
  const wrapCtx = { ...baseWrapCtx, payload };
  return blockWrapper(wrapCtx, renderProjectBlock(activity, catalogEntry, sharedCtx));
}

/**
 * Render the hour rail (left column).
 * Iter 33: supports current-hour highlighting via data-block-index (AC14).
 * Iter 43 Item 5: past hours get cycle-hour-past class for dim treatment (AC10-AC11).
 *
 * @param {number} gridStartHour
 * @param {number} gridEndHour
 * @param {number} rowHeightPx
 * @param {number|null} nowMinutesOfDay — for current-hour highlight + past dimming
 * @returns {string}
 */
function renderTodayHourRail(gridStartHour, gridEndHour, rowHeightPx, nowMinutesOfDay = null) {
  const labels = hourRailLabels(gridStartHour, gridEndHour);
  const currentHour = nowMinutesOfDay !== null ? Math.floor(nowMinutesOfDay / 60) : null;
  const hours = labels
    .map((label, i) => {
      const hour = gridStartHour + i;
      const isCurrent = currentHour !== null && hour === currentHour;
      // Iter 43 Item 5: dim hours strictly before the current hour (AC10, AC11).
      // Current hour stays full opacity; only strictly past hours are dimmed.
      const isPast = currentHour !== null && hour < currentHour;
      let cls = 'cycle-hour';
      if (isCurrent) cls += ' cycle-hour-current';
      if (isPast) cls += ' cycle-hour-past';
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
 * Render half-hour divider lines inside the timeline — Iter 43 Item 4 (GCal pattern).
 * Visually fainter than hour lines (.cycle-half-hour-line: dashed + lower opacity).
 * Renders lines at the :30 mark within each hour (not at hour boundaries).
 *
 * @param {number} gridStartHour
 * @param {number} gridEndHour
 * @param {number} rowHeightPx
 * @returns {string}
 */
function renderHalfHourLines(gridStartHour, gridEndHour, rowHeightPx) {
  const lines = [];
  for (let h = gridStartHour; h < gridEndHour; h++) {
    // Half-hour offset: (h - gridStartHour + 0.5) * rowHeightPx
    const top = (h - gridStartHour + 0.5) * rowHeightPx;
    lines.push(`<div class="cycle-half-hour-line" style="top: ${top}px" aria-hidden="true"></div>`);
  }
  return lines.join('\n');
}

/**
 * TodayGrid main entry — single-day calendar grid.
 *
 * Iter 35 Phase 2: accepts dragSession for ghost block rendering.
 *
 * @param {{
 *   composition:        object | null,
 *   activities:         object[],
 *   nowIso?:            string | null,
 *   kaizenTitleById?:   Record<string, string>,
 *   catalogEntryById?:  Record<string, object>,
 *   compositionState?:  string,
 *   gridStartHour?:     number,
 *   gridEndHour?:       number,
 *   rowHeightPx?:       number,
 *   dragSession?:       object | null  — from app.js state.dragSession (Phase 2 pending flow)
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
  // Iter 46 Phase 1: catalog entry lookup map for PROJECT secondary line (AC1–AC4).
  const catalogEntryById = props.catalogEntryById ?? {};
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
    .map((a, i) => renderTodayBlock({ activity: a, gridStartHour, rowHeightPx, kaizenTitleById, catalogEntryById, isProposed, blockIndex: i }))
    .filter(Boolean)
    .join('\n');

  // Iter 35 Phase 2: ghost block for PROPOSED pending-confirm flow.
  // Shown as a dashed overlay at the proposed position while Confirm/Cancel is visible.
  let ghostBlockHtml = '';
  // Phase 3.1 (R3): guard requires proposedStart to be a finite number (not null/undefined).
  // Prior guard used !== undefined which let null through, producing NaN positioning.
  if (dragSession && dragSession.activityId && Number.isFinite(dragSession.proposedStart) && dragSession.proposedDuration !== undefined) {
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

  // Half-hour lines — Iter 43 Item 4: fainter dashed marks at :30 (GCal pattern, AC8-AC9).
  const halfHourLines = renderHalfHourLines(gridStartHour, gridEndHour, rowHeightPx);

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
    ${halfHourLines}
    ${blocks}
    ${ghostBlockHtml}
    ${nowLine}
  </div>
</div>`;
}

export default TodayGrid;
