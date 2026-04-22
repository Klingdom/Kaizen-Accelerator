/**
 * SkipReasonModal — Sprint 5 P1-T1.
 *
 * Pure render. Returns an HTML string for the skip-reason picker.
 * Six radio options per UX_FLOWS §2.5 + ReasonCode enum. Selecting
 * OTHER reveals a required note textarea (visibility toggled by CSS
 * or via a re-render triggered by a data-action dispatch at app.js
 * level — component is stateless).
 *
 * Submit action: `SUBMIT_SKIP_MODAL` with payload {activityId} — the
 * serialized form fields are collected at dispatch time.
 */

import { esc } from '../mount.js';

/** Same order as ReasonCode enum in types.js (plus OTHER last). */
export const SKIP_REASONS = Object.freeze([
  { code: 'ESCALATION', label: 'Escalation from above' },
  { code: 'MEETING_CONFLICT', label: 'Meeting conflict' },
  { code: 'SICK', label: 'Sick / out of office' },
  { code: 'BLOCKED', label: 'Blocked by dependency' },
  { code: 'DEPRIORITIZED', label: 'Deprioritized today' },
  { code: 'OTHER', label: 'Other (explain below)' }
]);

/**
 * SkipReasonModal component.
 *
 * @param {{activityId: string, activityName?: string, selectedReason?: string}} props
 * @returns {string}
 */
export function SkipReasonModal(props = {}) {
  const activityId = props.activityId ?? '';
  const activityName = props.activityName ?? '';
  const selected = props.selectedReason ?? '';
  const payload = esc(JSON.stringify({ activityId }));

  const radios = SKIP_REASONS
    .map((r) => {
      const checked = selected === r.code ? ' checked' : '';
      return `<label class="srm-option">
        <input type="radio" name="reasonCode" value="${esc(r.code)}"${checked} required />
        <span class="srm-label">${esc(r.label)}</span>
      </label>`;
    })
    .join('\n');

  return `<section class="srm-modal" role="dialog" aria-modal="true" data-dialog="skip-reason" data-activity-id="${esc(activityId)}">
  <form class="srm-form" data-action="SUBMIT_SKIP_MODAL" data-payload='${payload}'>
    <header class="srm-header">
      <h2 class="srm-title">Skip: ${esc(activityName || activityId)}</h2>
      <p class="srm-intro">Pick a reason. This goes into your variance log.</p>
    </header>
    <fieldset class="srm-reasons">
${radios}
    </fieldset>
    <label class="srm-note" data-shown-when="OTHER">
      Note
      <textarea name="note" rows="3" placeholder="What happened?"></textarea>
    </label>
    <footer class="srm-footer">
      <button type="button" class="srm-cancel" data-action="CLOSE_SKIP_MODAL">Cancel</button>
      <button type="submit" class="srm-submit">Log skip</button>
    </footer>
  </form>
</section>`;
}

export default SkipReasonModal;
