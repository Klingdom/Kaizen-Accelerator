/**
 * AutoPlanButton — empty-state CTA (E10-T7).
 *
 * One-click trigger to compose (or recompose) the current cycle. Per
 * SCHEDULING_UX §3.13, label is verbatim "Auto-Plan" (never
 * "Auto-plan my day!"). Loading state shows "Composing…".
 *
 * Emits `AUTO_PLAN` via data-action (event delegation in mount.js).
 *
 * Props:
 *   loading:   boolean — in-flight composer run; button disabled + "Composing…"
 *   variant:   'primary' | 'secondary' — primary on empty-state Today
 */

import { esc } from '../mount.js';

/**
 * @param {{
 *   loading?: boolean,
 *   variant?: 'primary' | 'secondary'
 * }} [props]
 * @returns {string}
 */
export function AutoPlanButton(props = {}) {
  const loading = !!props.loading;
  const variant = props.variant === 'secondary' ? 'secondary' : 'primary';
  const label = loading ? 'Composing…' : 'Auto-Plan';
  const disabled = loading ? 'disabled aria-disabled="true"' : '';
  const payload = '{}';
  return `<button type="button"
    class="auto-plan-btn ${esc(variant)}${loading ? ' loading' : ''}"
    data-action="AUTO_PLAN"
    data-payload='${payload}'
    aria-label="Auto-plan today"
    ${disabled}>${esc(label)}</button>`;
}

export default AutoPlanButton;
