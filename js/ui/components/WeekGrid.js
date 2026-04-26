/**
 * WeekGrid — Sprint 15 hour-grid Week view (W1).
 *
 * Pure render. Returns an HTML string. Replaces the day-list grid in
 * Week.js with a 5-column timeline:
 *
 *   .wg-grid (CSS grid: hour rail + 5 day columns)
 *     .wg-hour-rail
 *       .wg-hour x N
 *     .wg-day-col[data-day-index]
 *       .wg-day-header
 *       .wg-timeline (position: relative)
 *         .wg-block (absolutely positioned by inline top/height in px)
 *       .wg-now-line (only on today's column)
 *
 * No DOM. No bundler. CSS-only animations live in app.css.
 *
 * Props:
 *   weeklyComposition: WeeklyComposition (required to render anything)
 *   nowIso?:           string ISO timestamp for the "now" line
 *   kaizenTitleById?:  Record<kaizenId, title>
 *   gridStartHour?:    number (default 7)
 *   gridEndHour?:      number (default 19)
 *   rowHeightPx?:      number (default 60)
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
  parseMinutesOfDay
} from '../weekGridMath.js';
import { formatTimeRange } from '../timeFormat.js';

// Sprint 16a — Week blocks shorter than this height (px) drop the trailing
// "–HH:MM" range fragment and render only the start time, since the grid
// column gets visually cramped at small heights.
const WG_RANGE_MIN_HEIGHT_PX = 40;

const WEEKDAY_SHORT = Object.freeze(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);

const BUCKET_CHIP_CLASS = {
  PROJECT: 'chip-project',
  COMMUNICATION: 'chip-communication',
  CI: 'chip-ci'
};

/**
 * Format an ISO/HH:MM start as a clean `HH:MM` for display.
 *
 * @param {string|null|undefined} value
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
 * Render a single .wg-block.
 *
 * @param {{
 *   activity: object,
 *   gridStartHour: number,
 *   rowHeightPx: number,
 *   kaizenTitleById: Record<string, string>
 * }} ctx
 * @returns {string}
 */
function renderBlock(ctx) {
  const { activity, gridStartHour, rowHeightPx, kaizenTitleById } = ctx;
  const top = topOffsetPx(activity.plannedStartAt ?? activity.anchor, gridStartHour, rowHeightPx);
  if (top === null) return '';
  const dur = Number(activity.plannedDurationMinutes ?? 0);
  const h = heightPx(dur, rowHeightPx);
  if (h <= 0) return '';
  const bucket = activity.bucket ?? '';
  const bucketChipClass = BUCKET_CHIP_CLASS[bucket] ?? '';
  const userEdited = activity.userEdited === true;
  const startHHMM = formatHHMM(activity.plannedStartAt ?? activity.anchor);
  // Sprint 16a — render "HH:MM–HH:MM" by default, but fall back to the
  // start-only label on short blocks (heightPx < 40) where the range
  // would visually overflow.
  const time = h < WG_RANGE_MIN_HEIGHT_PX
    ? startHHMM
    : formatTimeRange(activity.plannedStartAt ?? activity.anchor, dur);
  const name = activity.name ?? activity.catalogEntryId ?? '(unnamed)';
  const kaizenId = activity.linkedKaizenId ?? null;
  const kaizenTitle = kaizenId && kaizenTitleById && kaizenTitleById[kaizenId]
    ? kaizenTitleById[kaizenId]
    : null;
  const kaizenChip = kaizenTitle
    ? `<span class="wg-block-kaizen" aria-label="part of Kaizen ${esc(kaizenTitle)}">${esc(kaizenTitle)}</span>`
    : '';
  return `<article class="wg-block ${esc(bucketChipClass)}" style="top: ${top}px; height: ${h}px" data-activity-id="${esc(activity.id ?? '')}" data-bucket="${esc(bucket)}" data-user-edited="${userEdited ? 'true' : 'false'}">
    <span class="wg-block-time">${esc(time)}</span>
    <span class="wg-block-name">${esc(name)}</span>
    <span class="wg-block-dur">${esc(String(dur))}m</span>
    ${kaizenChip}
  </article>`;
}

/**
 * Render one day column.
 *
 * @param {{
 *   day: object,
 *   dayIdx: number,
 *   weeklyCompositionId: string,
 *   nowIso: string|null,
 *   gridStartHour: number,
 *   gridEndHour: number,
 *   rowHeightPx: number,
 *   kaizenTitleById: Record<string, string>
 * }} ctx
 * @returns {string}
 */
function renderDayColumn(ctx) {
  const {
    day,
    dayIdx,
    weeklyCompositionId,
    nowIso,
    gridStartHour,
    gridEndHour,
    rowHeightPx,
    kaizenTitleById
  } = ctx;
  if (!day) {
    return `<div class="wg-day-col wg-day-col-empty" data-day-index="${dayIdx}">
      <header class="wg-day-header"><span class="wg-day-label">${esc(WEEKDAY_SHORT[dayIdx] ?? '')}</span></header>
      <div class="wg-timeline" style="height: ${(gridEndHour - gridStartHour) * rowHeightPx}px"></div>
    </div>`;
  }
  const date = day.date ?? '';
  const state = day.state ?? 'PROPOSED';
  // Sprint 15: per-day accept lives in the legacy DayPreview summary; the
  // grid header surfaces only the state label so we don't double up the
  // WEEK_ACCEPT_DAY action.
  const stateLabel = state !== 'PROPOSED'
    ? `<span class="wg-day-state">${esc(state)}</span>`
    : '';

  const activities = Array.isArray(day.activities) ? day.activities : [];
  const blocks = activities
    .map((a) => renderBlock({ activity: a, gridStartHour, rowHeightPx, kaizenTitleById }))
    .filter(Boolean)
    .join('\n');

  const timelineHeight = (gridEndHour - gridStartHour) * rowHeightPx;
  const nowOffset = nowIso
    ? nowLineOffsetPx(nowIso, date, gridStartHour, gridEndHour, rowHeightPx)
    : null;
  const nowLine = nowOffset !== null
    ? `<div class="wg-now-line" style="top: ${nowOffset}px" aria-label="current time"></div>`
    : '';

  return `<div class="wg-day-col" data-day-index="${dayIdx}" data-date="${esc(date)}" data-state="${esc(state)}">
    <header class="wg-day-header">
      <span class="wg-day-label">${esc(WEEKDAY_SHORT[dayIdx] ?? '')}</span>
      <time class="wg-day-date">${esc(date)}</time>
      ${stateLabel}
    </header>
    <div class="wg-timeline" style="height: ${timelineHeight}px">
      ${blocks}
      ${nowLine}
    </div>
  </div>`;
}

/**
 * Render the hour rail (left column).
 *
 * @param {number} gridStartHour
 * @param {number} gridEndHour
 * @param {number} rowHeightPx
 * @returns {string}
 */
function renderHourRail(gridStartHour, gridEndHour, rowHeightPx) {
  const labels = hourRailLabels(gridStartHour, gridEndHour);
  const hours = labels
    .map((label) => `<span class="wg-hour" style="height: ${rowHeightPx}px">${esc(label)}</span>`)
    .join('');
  return `<div class="wg-hour-rail" aria-hidden="true">${hours}</div>`;
}

/**
 * WeekGrid main entry.
 *
 * @param {{
 *   weeklyComposition: object|null,
 *   nowIso?: string|null,
 *   kaizenTitleById?: Record<string, string>,
 *   gridStartHour?: number,
 *   gridEndHour?: number,
 *   rowHeightPx?: number
 * }} props
 * @returns {string}
 */
export function WeekGrid(props = {}) {
  const weekly = props.weeklyComposition ?? null;
  if (!weekly) return '';
  const gridStartHour = Number.isFinite(props.gridStartHour) ? props.gridStartHour : DEFAULT_GRID_START_HOUR;
  const gridEndHour = Number.isFinite(props.gridEndHour) ? props.gridEndHour : DEFAULT_GRID_END_HOUR;
  const rowHeightPx = Number.isFinite(props.rowHeightPx) ? props.rowHeightPx : DEFAULT_ROW_HEIGHT_PX;
  const nowIso = typeof props.nowIso === 'string' ? props.nowIso : null;
  const kaizenTitleById = props.kaizenTitleById ?? {};

  const days = Array.isArray(weekly.days) ? weekly.days : [];
  const dayCols = [];
  for (let i = 0; i < 5; i += 1) {
    dayCols.push(
      renderDayColumn({
        day: days[i] ?? null,
        dayIdx: i,
        weeklyCompositionId: weekly.id ?? '',
        nowIso,
        gridStartHour,
        gridEndHour,
        rowHeightPx,
        kaizenTitleById
      })
    );
  }

  const rail = renderHourRail(gridStartHour, gridEndHour, rowHeightPx);
  const styleVars = `--wg-start-hour: ${gridStartHour}; --wg-end-hour: ${gridEndHour}; --wg-row-height: ${rowHeightPx}px`;
  return `<div class="wg-grid" style="${styleVars}" data-weekly-id="${esc(weekly.id ?? '')}">
    ${rail}
    ${dayCols.join('\n')}
  </div>`;
}

export default WeekGrid;
