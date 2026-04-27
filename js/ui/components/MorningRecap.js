/**
 * MorningRecap — yesterday-recap strip (C-UX-10, Iteration 14).
 *
 * Renders a single-line informational strip summarising the prior day's
 * composition. The parent (Today page) is responsible for computing and
 * passing `priorDayRecap`; this component is purely a string renderer.
 *
 * Rules (per IMPROVEMENT_BACKLOG C-UX-10 spec):
 *   - priorDayRecap === null  → renders nothing ('')
 *   - closedCount >= 1        → "Yesterday: N/M closed · K skipped"
 *   - closedCount === 0       → "Yesterday: 0/M closed — fresh start today"
 *
 * No actions, no expand/collapse, no interactive state.
 *
 * Pure function. No DOM access, no I/O.
 *
 * @param {{
 *   priorDayRecap: {
 *     closedCount: number,
 *     totalCount: number,
 *     skippedCount: number,
 *     dateIso: string
 *   } | null
 * }} props
 * @returns {string}
 */

import { esc } from '../mount.js';

export function MorningRecap({ priorDayRecap } = {}) {
  if (!priorDayRecap || typeof priorDayRecap !== 'object') return '';

  const closed  = Number.isFinite(priorDayRecap.closedCount)  ? priorDayRecap.closedCount  : 0;
  const total   = Number.isFinite(priorDayRecap.totalCount)   ? priorDayRecap.totalCount   : 0;
  const skipped = Number.isFinite(priorDayRecap.skippedCount) ? priorDayRecap.skippedCount : 0;

  let copy;
  if (closed >= 1) {
    const skipPart = skipped > 0 ? ` · ${skipped} skipped` : '';
    copy = `Yesterday: ${closed}/${total} closed${skipPart}`;
  } else {
    copy = `Yesterday: 0/${total} closed — fresh start today`;
  }

  return `<div class="morning-recap" role="note" aria-label="${esc(copy)}">${esc(copy)}</div>`;
}

export default MorningRecap;
