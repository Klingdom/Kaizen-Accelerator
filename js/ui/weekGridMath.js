/**
 * weekGridMath — pure positioning helpers for the Sprint 15 hour-grid
 * Week view.
 *
 * No DOM. No I/O. Each helper takes wall-clock inputs and returns pixel
 * offsets so the WeekGrid renderer can lay out blocks via inline
 * `style="top: ...px; height: ...px"`.
 *
 * Conventions:
 *   - `gridStartHour` / `gridEndHour` are integer hours of the day, 0..23.
 *   - `rowHeightPx` is the pixel height of a single hour row (default 60).
 *   - All time strings either look like `HH:MM` / `HH:MM:SS` / a full
 *     ISO-8601 timestamp (with or without a `Z` suffix). For ISO inputs we
 *     extract UTC components — the composer stores wall-clock time as if
 *     UTC by convention (Sprint 6 decision). HH:MM and HH:MM:SS are
 *     wall-clock as-is.
 *   - Out-of-range / malformed inputs return `null` (or 0 for height).
 *     Callers can then skip rendering that block.
 */

/**
 * Default grid window: 07:00 → 19:00 (12 rows of 60 px = 720 px).
 */
export const DEFAULT_GRID_START_HOUR = 7;
export const DEFAULT_GRID_END_HOUR = 19;
export const DEFAULT_ROW_HEIGHT_PX = 60;

/**
 * Parse a value into minutes-since-midnight. Returns null when unparseable
 * or missing.
 *
 * Accepted shapes:
 *   - `HH:MM`           → hours * 60 + minutes
 *   - `HH:MM:SS`        → hours * 60 + minutes (seconds dropped)
 *   - ISO timestamp     → UTC hours * 60 + minutes
 *
 * @param {string | null | undefined} value
 * @returns {number | null}
 */
export function parseMinutesOfDay(value) {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') return null;
  if (/^\d{2}:\d{2}$/.test(value)) {
    const [h, m] = value.split(':').map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
    return h * 60 + m;
  }
  if (/^\d{2}:\d{2}:\d{2}$/.test(value)) {
    const [h, m] = value.slice(0, 5).split(':').map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
    return h * 60 + m;
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

/**
 * Extract the YYYY-MM-DD part of a value, if present.
 *
 * @param {string | null | undefined} value
 * @returns {string | null}
 */
export function extractDateIso(value) {
  if (typeof value !== 'string' || value.length < 10) return null;
  const m = value.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

/**
 * Compute the top-offset (in pixels) for a block whose start time is
 * `plannedStartAt`, relative to a grid window starting at `gridStartHour`.
 *
 * Returns `null` if the start is missing/unparseable. Returns a clamped
 * value (0) if the start falls before the grid window.
 *
 * @param {string | null | undefined} plannedStartAt
 * @param {number} gridStartHour
 * @param {number} rowHeightPx
 * @returns {number | null}
 */
export function topOffsetPx(plannedStartAt, gridStartHour = DEFAULT_GRID_START_HOUR, rowHeightPx = DEFAULT_ROW_HEIGHT_PX) {
  const minutes = parseMinutesOfDay(plannedStartAt);
  if (minutes === null) return null;
  const startMinutes = gridStartHour * 60;
  const delta = minutes - startMinutes;
  if (delta < 0) return 0;
  return delta * (rowHeightPx / 60);
}

/**
 * Compute the height (in pixels) for a block of `plannedDurationMinutes`.
 * Negative / non-finite durations clamp to 0.
 *
 * @param {number} plannedDurationMinutes
 * @param {number} rowHeightPx
 * @returns {number}
 */
export function heightPx(plannedDurationMinutes, rowHeightPx = DEFAULT_ROW_HEIGHT_PX) {
  const m = Number(plannedDurationMinutes);
  if (!Number.isFinite(m) || m <= 0) return 0;
  return m * (rowHeightPx / 60);
}

/**
 * Compute the now-line offset (in pixels) for `nowIso` on `dateIso`.
 *
 * Returns `null` if:
 *   - `nowIso` doesn't parse,
 *   - `nowIso`'s date doesn't match `dateIso`,
 *   - the now-time falls outside the [gridStartHour, gridEndHour] window.
 *
 * @param {string} nowIso
 * @param {string} dateIso
 * @param {number} gridStartHour
 * @param {number} gridEndHour
 * @param {number} rowHeightPx
 * @returns {number | null}
 */
export function nowLineOffsetPx(
  nowIso,
  dateIso,
  gridStartHour = DEFAULT_GRID_START_HOUR,
  gridEndHour = DEFAULT_GRID_END_HOUR,
  rowHeightPx = DEFAULT_ROW_HEIGHT_PX
) {
  if (typeof nowIso !== 'string' || typeof dateIso !== 'string') return null;
  const nowDate = extractDateIso(nowIso);
  if (nowDate !== dateIso) return null;
  const nowMinutes = parseMinutesOfDay(nowIso);
  if (nowMinutes === null) return null;
  const startMin = gridStartHour * 60;
  const endMin = gridEndHour * 60;
  if (nowMinutes < startMin || nowMinutes > endMin) return null;
  return (nowMinutes - startMin) * (rowHeightPx / 60);
}

/**
 * Build the integer hour labels [`gridStartHour`..`gridEndHour`] inclusive
 * for the hour rail. Returns an array of `HH:00` strings.
 *
 * @param {number} gridStartHour
 * @param {number} gridEndHour
 * @returns {string[]}
 */
export function hourRailLabels(
  gridStartHour = DEFAULT_GRID_START_HOUR,
  gridEndHour = DEFAULT_GRID_END_HOUR
) {
  const out = [];
  for (let h = gridStartHour; h <= gridEndHour; h += 1) {
    out.push(`${String(h).padStart(2, '0')}:00`);
  }
  return out;
}

export default {
  DEFAULT_GRID_START_HOUR,
  DEFAULT_GRID_END_HOUR,
  DEFAULT_ROW_HEIGHT_PX,
  parseMinutesOfDay,
  extractDateIso,
  topOffsetPx,
  heightPx,
  nowLineOffsetPx,
  hourRailLabels
};
