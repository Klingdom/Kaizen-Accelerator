/**
 * CadencePressureRing — Iter 42, Phase 3 (Luminous Constraint signature pattern).
 *
 * 56px SVG arc in the Today header. Three color-coded segments (green/yellow/purple)
 * proportional to planned minutes per bucket against the 4-2-2 target. Hover
 * reveals a breakdown tooltip. Updates as composition state changes (re-rendered
 * by Today page on every state rerender).
 *
 * Visual source of truth: assets/today-futuristic-preview.html §Cadence Pressure Ring.
 * Design spec:           UX_TODAY_FUTURISTIC_DESIGN.md §9.
 * Delta rationale:       UX_TODAY_FUTURISTIC_DELTA.md §3 Divergence C.
 *
 * Pure render function — returns an HTML string. No DOM access.
 *
 * Props:
 *   activities   Array<ScheduledActivity> — the composition's activities
 *   targets?     {PROJECT: number, COMMUNICATION: number, CI: number} — minutes;
 *                defaults to 4-2-2 canonical values
 *   size?        number — diameter in px (default 56)
 *   strokeWidth? number — arc stroke width (default 4)
 *   showTooltip? boolean — whether to render the hover tooltip (default true)
 */

import { esc } from '../mount.js';

/** Canonical 4-2-2 default targets (minutes) — matches BucketStrip.DEFAULT_TARGETS. */
export const DEFAULT_TARGETS = Object.freeze({
  PROJECT: 240,
  COMMUNICATION: 120,
  CI: 120
});

/**
 * Compute planned minutes per bucket from an activities array.
 * Lunch (bucket: null) is excluded. Activities with zero or non-finite
 * plannedDurationMinutes are skipped.
 *
 * @param {Array<object>} activities
 * @returns {{PROJECT: number, COMMUNICATION: number, CI: number}}
 */
export function computeBucketMinutes(activities) {
  const out = { PROJECT: 0, COMMUNICATION: 0, CI: 0 };
  if (!Array.isArray(activities)) return out;
  for (const a of activities) {
    if (!a || !a.bucket) continue; // null/undefined bucket = lunch, skip
    const bucket = a.bucket;
    if (!(bucket in out)) continue; // unknown bucket, skip
    const mins = Number(a.plannedDurationMinutes);
    if (!Number.isFinite(mins) || mins <= 0) continue;
    out[bucket] += mins;
  }
  return out;
}

/**
 * Compute arc segments for an SVG donut ring.
 *
 * Arc geometry:
 *   - Radius r, circumference C = 2 * π * r
 *   - Each segment is rendered as a <circle> with stroke-dasharray and
 *     stroke-dashoffset positioning it around the ring (SVG is rotated -90deg
 *     so 12 o'clock is the start).
 *   - stroke-dasharray = "<arcLength> <C - arcLength>" (draws that segment length
 *     then leaves the rest as gap)
 *   - stroke-dashoffset = -<sumOfPriorSegments> (shifts the draw-start point)
 *
 * @param {{PROJECT: number, COMMUNICATION: number, CI: number}} bucketMinutes
 * @param {number} radius
 * @returns {Array<{key: string, arcLen: number, offset: number, circumference: number}>}
 */
export function computeArcSegments(bucketMinutes, radius) {
  const C = 2 * Math.PI * radius; // circumference
  const total = bucketMinutes.PROJECT + bucketMinutes.COMMUNICATION + bucketMinutes.CI;

  if (total <= 0) {
    // Empty state — all arcs have length 0.
    return [
      { key: 'PROJECT', arcLen: 0, offset: 0, circumference: C },
      { key: 'COMMUNICATION', arcLen: 0, offset: 0, circumference: C },
      { key: 'CI', arcLen: 0, offset: 0, circumference: C }
    ];
  }

  const order = ['PROJECT', 'COMMUNICATION', 'CI'];
  const segments = [];
  let cursor = 0; // running sum of prior arc lengths (for offset)

  for (const key of order) {
    const mins = bucketMinutes[key] ?? 0;
    const arcLen = (mins / total) * C;
    segments.push({ key, arcLen, offset: cursor, circumference: C });
    cursor += arcLen;
  }

  return segments;
}

/**
 * Format minutes as "Xh Ym" display string.
 * Examples: 240 → "4h 0m", 90 → "1h 30m", 45 → "0h 45m"
 *
 * @param {number} mins
 * @returns {string}
 */
export function formatMinutes(mins) {
  const m = Math.round(mins);
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return `${h}h ${rem}m`;
}

/**
 * Determine whether the day is balanced per 4-2-2 targets.
 * "Balanced" = every bucket meets at least 50% of its target (floor).
 *
 * @param {{PROJECT: number, COMMUNICATION: number, CI: number}} bucketMinutes
 * @param {{PROJECT: number, COMMUNICATION: number, CI: number}} targets
 * @returns {boolean}
 */
export function isDayBalanced(bucketMinutes, targets) {
  const floor = (key) => (targets[key] ?? 0) * 0.5;
  return (
    bucketMinutes.PROJECT >= floor('PROJECT') &&
    bucketMinutes.COMMUNICATION >= floor('COMMUNICATION') &&
    bucketMinutes.CI >= floor('CI')
  );
}

/**
 * Build the ARIA label for the ring.
 *
 * @param {{PROJECT: number, COMMUNICATION: number, CI: number}} bucketMinutes
 * @returns {string}
 */
function buildAriaLabel(bucketMinutes) {
  const totalMins = bucketMinutes.PROJECT + bucketMinutes.COMMUNICATION + bucketMinutes.CI;
  const totalHours = (totalMins / 60).toFixed(1).replace(/\.0$/, '');
  const proj  = formatMinutes(bucketMinutes.PROJECT);
  const comm  = formatMinutes(bucketMinutes.COMMUNICATION);
  const ci    = formatMinutes(bucketMinutes.CI);
  return `Day allocation: ${totalHours}h total — Project ${proj}, Communication ${comm}, CI ${ci}`;
}

/**
 * Round to 2 decimal places to keep SVG attributes tidy.
 * @param {number} n
 * @returns {string}
 */
function r2(n) {
  return (Math.round(n * 100) / 100).toFixed(2);
}

/**
 * CadencePressureRing — main render entry.
 *
 * @param {{
 *   activities?:   Array<object>,
 *   targets?:      {PROJECT: number, COMMUNICATION: number, CI: number},
 *   size?:         number,
 *   strokeWidth?:  number,
 *   showTooltip?:  boolean
 * }} props
 * @returns {string} HTML string
 */
export function CadencePressureRing(props = {}) {
  const activities   = Array.isArray(props.activities) ? props.activities : [];
  const targets      = props.targets && typeof props.targets === 'object'
    ? props.targets
    : DEFAULT_TARGETS;
  const size         = Number.isFinite(props.size) && props.size > 0 ? props.size : 56;
  const strokeWidth  = Number.isFinite(props.strokeWidth) && props.strokeWidth > 0
    ? props.strokeWidth
    : 4;
  const showTooltip  = props.showTooltip !== false;

  const cx = size / 2;
  const cy = size / 2;
  // Radius inset so stroke doesn't clip outside the viewBox.
  const radius = (size / 2) - (strokeWidth / 2) - 2;

  const bucketMinutes = computeBucketMinutes(activities);
  const segments = computeArcSegments(bucketMinutes, radius);
  const totalMins = bucketMinutes.PROJECT + bucketMinutes.COMMUNICATION + bucketMinutes.CI;
  const totalHoursDisplay = totalMins > 0
    ? (totalMins / 60).toFixed(1).replace(/\.0$/, '') + 'h'
    : '0h';

  const ariaLabel = esc(buildAriaLabel(bucketMinutes));

  // Arc SVG circles. Each uses dasharray/dashoffset to draw only its slice.
  // SVG is rotated -90deg (CSS on .cadence-ring-svg) so 12-o'clock = start.
  const arcCircles = segments.map(({ key, arcLen, offset, circumference }) => {
    const dashArray  = `${r2(arcLen)} ${r2(circumference - arcLen)}`;
    const dashOffset = offset > 0 ? `-${r2(offset)}` : '0';
    const cssClass   = key === 'PROJECT'       ? 'cadence-arc-project'
                     : key === 'COMMUNICATION' ? 'cadence-arc-comm'
                     :                           'cadence-arc-ci';
    // Skip rendering arcs with effectively zero length (empty bucket).
    if (arcLen < 0.01) return '';
    return `          <circle class="cadence-arc ${cssClass}"
            cx="${cx}" cy="${cy}" r="${r2(radius)}"
            stroke-dasharray="${esc(dashArray)}"
            stroke-dashoffset="${esc(dashOffset)}" />`;
  }).join('\n');

  // Tooltip rows.
  const projLabel  = esc(formatMinutes(bucketMinutes.PROJECT));
  const commLabel  = esc(formatMinutes(bucketMinutes.COMMUNICATION));
  const ciLabel    = esc(formatMinutes(bucketMinutes.CI));
  const balanced   = isDayBalanced(bucketMinutes, targets);
  const balanceText = esc(balanced ? 'Day is balanced' : 'Day is unbalanced');

  const tooltipHtml = showTooltip ? `
        <div class="cadence-tooltip" role="tooltip" aria-hidden="true">
          <div class="ct-row">
            <div class="ct-dot ct-dot-project" aria-hidden="true"></div>
            <span class="ct-label">PROJECT</span>
            <span class="ct-value">${projLabel}</span>
          </div>
          <div class="ct-row">
            <div class="ct-dot ct-dot-comm" aria-hidden="true"></div>
            <span class="ct-label">COMM</span>
            <span class="ct-value">${commLabel}</span>
          </div>
          <div class="ct-row">
            <div class="ct-dot ct-dot-ci" aria-hidden="true"></div>
            <span class="ct-label">CI</span>
            <span class="ct-value">${ciLabel}</span>
          </div>
          <div class="ct-balanced">${balanceText}</div>
        </div>` : '';

  return `<div class="cadence-ring" tabindex="0" role="img" aria-label="${ariaLabel}">
        <svg class="cadence-ring-svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
          <!-- Background ring (full circumference, subtle) -->
          <circle class="cadence-arc-bg" cx="${cx}" cy="${cy}" r="${r2(radius)}" />
${arcCircles}
        </svg>
        <div class="cadence-ring-center" aria-hidden="true">${esc(totalHoursDisplay)}</div>${tooltipHtml}
      </div>`;
}

export default CadencePressureRing;
