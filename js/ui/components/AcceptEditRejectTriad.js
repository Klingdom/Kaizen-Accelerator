/**
 * AcceptEditRejectTriad — the three-button bar (E10-T6).
 *
 * Accept / Edit / Reject per UX_FLOWS §2.1 + §4.1. Labels are verbatim
 * from SCHEDULING_UX §6.5.1.
 *
 *  - Accept  → primary tone, data-action="ACCEPT"
 *  - Edit    → secondary tone, data-action="EDIT"
 *  - Reject  → dark-tone (danger), data-action="REJECT"
 *
 * The order is LOCKED (UX_FLOWS §4.1: "The triad never moves or re-orders").
 *
 * Props:
 *   compositionId: string — becomes the data-payload for each button
 *   disabled:      boolean — e.g. invariants failing; disables Accept
 *   acceptDisabledReason?: string — tooltip when Accept is disabled
 */

import { esc } from '../mount.js';

/**
 * Build a button with a data-action + data-payload carrying the id.
 */
function btn(action, label, klass, payload, extraAttrs = '') {
  const json = esc(JSON.stringify(payload ?? {}));
  return `<button type="button" class="${esc(klass)}" data-action="${esc(action)}" data-payload='${json}' ${extraAttrs}>${esc(label)}</button>`;
}

/**
 * @param {{
 *   compositionId: string,
 *   disabled?: boolean,
 *   acceptDisabledReason?: string
 * }} props
 * @returns {string}
 */
export function AcceptEditRejectTriad(props = {}) {
  const id = props.compositionId;
  if (!id) {
    return '<div class="triad triad-missing">(no composition)</div>';
  }
  const disabled = !!props.disabled;
  const reason = props.acceptDisabledReason ?? '';
  const payload = { compositionId: id };
  const acceptExtras = disabled
    ? `disabled aria-disabled="true" title="${esc(reason)}"`
    : '';

  return `<div class="triad" role="group" aria-label="Daily cadence actions">
  ${btn('ACCEPT', 'Accept', 'triad-accept primary', payload, acceptExtras)}
  ${btn('EDIT', 'Edit', 'triad-edit secondary', payload)}
  ${btn('REJECT', 'Reject', 'triad-reject danger', payload)}
</div>`;
}

export default AcceptEditRejectTriad;
