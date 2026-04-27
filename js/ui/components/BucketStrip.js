/**
 * BucketStrip — 4-2-2 rhythm visualization (E10-T4).
 *
 * Renders 3 stacked horizontal bars:
 *   PROJECT        (target 240, warm neutral)
 *   COMMUNICATION  (target 120, cool neutral)
 *   CI             (target 120, accent neutral)
 *
 * Each bar shows:
 *   - planned minutes (filled tone up to bar width)
 *   - a dashed tick mark at the 4-2-2 target
 *   - a dashed tick mark at the 50% floor
 *   - the bar turns red (class "under-floor") if planned < 50% floor
 *   - the bar pulses red (class "overpacked") if planned > ceiling
 *
 * Pure function — returns an HTML string. No DOM access.
 *
 * Props:
 *   - planned: {PROJECT: number, COMMUNICATION: number, CI: number}
 *   - targets: {PROJECT: number, COMMUNICATION: number, CI: number}
 *   - floors:  {PROJECT: number, COMMUNICATION: number, CI: number}
 *   - ceilings:{PROJECT: number, COMMUNICATION: number, CI: number}
 */

import { esc } from '../mount.js';
import bucketMeta from '../bucketMeta.js';

/**
 * Default 4-2-2 targets per ARCHITECTURE §5.1.
 */
export const DEFAULT_TARGETS = Object.freeze({
  PROJECT: 240,
  COMMUNICATION: 120,
  CI: 120
});

export const DEFAULT_FLOORS = Object.freeze({
  PROJECT: 120,
  COMMUNICATION: 60,
  CI: 60
});

export const DEFAULT_CEILINGS = Object.freeze({
  PROJECT: 264, // 110% of 240
  COMMUNICATION: 150, // 125% of 120
  CI: 150
});

/**
 * Bucket display metadata. Labels use the user-facing long labels from
 * bucketMeta (C-UX-13, Iteration 14). CSS class names are unchanged.
 */
const BUCKETS = Object.freeze([
  { key: 'PROJECT', toneClass: 'bucket-project' },
  { key: 'COMMUNICATION', toneClass: 'bucket-communication' },
  { key: 'CI', toneClass: 'bucket-ci' }
]);

/**
 * Compute the bar status for a single bucket. Returns:
 *   'under-floor' when planned < floor (red)
 *   'overpacked' when planned > ceiling (red pulse)
 *   'ok'         otherwise
 *
 * @param {number} planned
 * @param {number} floor
 * @param {number} ceiling
 * @returns {'under-floor' | 'overpacked' | 'ok'}
 */
export function bucketStatus(planned, floor, ceiling) {
  if (planned < floor) return 'under-floor';
  if (planned > ceiling) return 'overpacked';
  return 'ok';
}

/**
 * Render one bar row.
 */
function renderBar(bucket, planned, target, floor, ceiling) {
  const status = bucketStatus(planned, floor, ceiling);
  // Use the larger of (target, planned, ceiling) as the display scale so the
  // bar never overflows its track visually.
  const scaleTop = Math.max(target, planned, ceiling);
  const plannedPct = scaleTop > 0 ? Math.round((planned / scaleTop) * 100) : 0;
  const targetPct = scaleTop > 0 ? Math.round((target / scaleTop) * 100) : 0;
  const floorPct = scaleTop > 0 ? Math.round((floor / scaleTop) * 100) : 0;

  // C-UX-13 (Iteration 14): use user-facing long label from bucketMeta.
  const meta = bucketMeta(bucket.key);
  const visibleLabel = meta.labelLong || bucket.key;

  return `<li class="bucket-row ${esc(bucket.toneClass)} status-${esc(status)}" data-bucket="${esc(bucket.key)}" aria-label="${esc(visibleLabel)}">
  <div class="bucket-label">${esc(visibleLabel)}</div>
  <div class="bucket-track" aria-hidden="true">
    <div class="bucket-fill" style="width:${plannedPct}%"></div>
    <div class="bucket-tick tick-floor" style="left:${floorPct}%" title="floor ${esc(String(floor))}m"></div>
    <div class="bucket-tick tick-target" style="left:${targetPct}%" title="target ${esc(String(target))}m"></div>
  </div>
  <div class="bucket-value"><span class="planned">${esc(String(planned))}</span><span class="sep">/</span><span class="target">${esc(String(target))}</span><span class="unit">m</span></div>
</li>`;
}

/**
 * BucketStrip component — returns an HTML string.
 *
 * @param {{
 *   planned?: {PROJECT: number, COMMUNICATION: number, CI: number},
 *   targets?: {PROJECT: number, COMMUNICATION: number, CI: number},
 *   floors?: {PROJECT: number, COMMUNICATION: number, CI: number},
 *   ceilings?: {PROJECT: number, COMMUNICATION: number, CI: number}
 * }} [props]
 * @returns {string}
 */
export function BucketStrip(props = {}) {
  const planned = props.planned ?? { PROJECT: 0, COMMUNICATION: 0, CI: 0 };
  const targets = props.targets ?? DEFAULT_TARGETS;
  const floors = props.floors ?? DEFAULT_FLOORS;
  const ceilings = props.ceilings ?? DEFAULT_CEILINGS;

  const rows = BUCKETS.map((b) =>
    renderBar(b, planned[b.key] ?? 0, targets[b.key] ?? 0, floors[b.key] ?? 0, ceilings[b.key] ?? 0)
  ).join('\n');

  return `<ul class="bucket-strip" role="list" aria-label="4-2-2 daily rhythm">
${rows}
</ul>`;
}

/**
 * Compute planned minutes per bucket from an activities array.
 *
 * @param {Array<{bucket?: string, plannedDurationMinutes?: number, state?: string}>} activities
 * @returns {{PROJECT: number, COMMUNICATION: number, CI: number}}
 */
export function plannedFromActivities(activities) {
  const sums = { PROJECT: 0, COMMUNICATION: 0, CI: 0 };
  if (!Array.isArray(activities)) return sums;
  for (const a of activities) {
    // Skip SKIPPED / DROPPED activities (they don't count against plan).
    if (a.state === 'SKIPPED' || a.state === 'DROPPED') continue;
    const b = a.bucket;
    if (b in sums) sums[b] += a.plannedDurationMinutes ?? 0;
  }
  return sums;
}

export default BucketStrip;
