/**
 * EodClosureStrip — end-of-day closure strip (C-UX-3, Iteration 15).
 *
 * Renders a single-line informational strip below the CycleCard when the
 * day is considered "done." The parent (Today page via app.js computeEodRecap)
 * is responsible for determining whether the EOD condition is met and passing
 * `eodRecap`; this component is purely a string renderer.
 *
 * Rules (per IMPROVEMENT_BACKLOG C-UX-3 spec):
 *   - eodRecap === null  → renders nothing ('')
 *   - eodRecap present   → renders "Day complete" status + counters
 *   - pendingReflectionCount > 0 → renders "Capture reflection →" CTA
 *   - pendingReflectionCount === 0 → no CTA
 *
 * Counter format: "N/M closed · K skipped · P reflections pending"
 * DROPPED activities are excluded from totalCount and skippedCount.
 *
 * No expand/collapse, no interactive state beyond the reflection CTA.
 *
 * Pure function. No DOM access, no I/O.
 *
 * @param {{
 *   eodRecap: {
 *     closedCount: number,
 *     totalCount: number,
 *     skippedCount: number,
 *     pendingReflectionCount: number
 *   } | null
 * }} props
 * @returns {string}
 */

import { esc } from '../mount.js';

export function EodClosureStrip({ eodRecap } = {}) {
  if (!eodRecap || typeof eodRecap !== 'object') return '';

  const closed  = Number.isFinite(eodRecap.closedCount)            ? eodRecap.closedCount            : 0;
  const total   = Number.isFinite(eodRecap.totalCount)             ? eodRecap.totalCount             : 0;
  const skipped = Number.isFinite(eodRecap.skippedCount)           ? eodRecap.skippedCount           : 0;
  const pending = Number.isFinite(eodRecap.pendingReflectionCount) ? eodRecap.pendingReflectionCount : 0;

  // Build counter string: "N/M closed · K skipped · P reflections pending"
  // Skipped phrase omitted when skippedCount === 0.
  // Reflections pending phrase omitted when pendingReflectionCount === 0.
  const skipPart    = skipped > 0 ? ` · ${skipped} skipped`                        : '';
  const pendingPart = pending > 0 ? ` · ${pending} reflection${pending === 1 ? '' : 's'} pending` : '';
  const counters    = `${closed}/${total} closed${skipPart}${pendingPart}`;

  const statusLabel = 'Day complete';
  const ariaLabel   = `${statusLabel} — ${counters}`;

  // CTA only when pending reflections exist.
  const ctaHtml = pending > 0
    ? `<button class="eod-closure-cta" data-action="EOD_OPEN_REFLECTION" type="button">Capture reflection →</button>`
    : '';

  return `<div class="eod-closure-strip" role="note" aria-label="${esc(ariaLabel)}">
  <span class="eod-closure-status">${esc(statusLabel)}</span>
  <span class="eod-closure-counters">${esc(counters)}</span>${ctaHtml ? `\n  ${ctaHtml}` : ''}
</div>`;
}

export default EodClosureStrip;
