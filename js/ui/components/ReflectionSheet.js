/**
 * ReflectionSheet — Sprint 6 P0-T3.
 *
 * Pure render. 60-second capture modal that opens when a ScheduledActivity
 * transitions CLOSED. Displays plan-vs-actual, two optional textareas,
 * a friction flag checkbox + reveal, and Save / Skip buttons.
 *
 * UI copy per UX_FLOWS §3.6 + GLOSSARY canonical terms.
 *
 * Events:
 *   data-action="SUBMIT_REFLECTION"  — form submit
 *   data-action="SKIP_REFLECTION"    — "Skip for now" button
 *   data-action="TOGGLE_FRICTION"    — reveal/hide friction sub-form
 *   data-action="CLOSE_REFLECTION"   — dismiss without action (same as skip)
 *
 * All form fields are collected at dispatch time via the app.js
 * `extractFormFields` helper (no direct DOM listener here).
 */

import { esc } from '../mount.js';
import { FrictionTag } from '../../domain/types.js';

/**
 * Friction tag labels, in the order UX_FLOWS §3.6 specifies.
 */
export const FRICTION_TAG_LABELS = Object.freeze([
  { code: FrictionTag.MEETING_LOAD, label: 'Meeting load' },
  { code: FrictionTag.CONTEXT_SWITCH, label: 'Context switching' },
  { code: FrictionTag.BLOCKED_DEP, label: 'Blocked by dependency' },
  { code: FrictionTag.TOOL_FRICTION, label: 'Tool friction' },
  { code: FrictionTag.PRIORITY_INVERSION, label: 'Priority inversion' },
  { code: FrictionTag.OTHER, label: 'Other' }
]);

/**
 * Format a `+12m over / 6m under / exact` label from a signed delta.
 *
 * @param {number} delta
 * @returns {string}
 */
export function formatPlanDelta(delta) {
  if (!Number.isFinite(delta) || delta === 0) return 'on plan';
  if (delta > 0) return `+${delta}m over`;
  return `${delta}m under`;
}

/**
 * ReflectionSheet component.
 *
 * @param {{
 *   reflectionId: string,
 *   activityId: string,
 *   activityName?: string,
 *   plannedDurationMinutes?: number,
 *   actualDurationMinutes?: number,
 *   planVsActualMinutes?: number,
 *   isNonOptional?: boolean,
 *   frictionChecked?: boolean,
 *   whatWentWell?: string,
 *   whatToImprove?: string,
 *   selectedFrictionTag?: string
 * }} props
 * @returns {string}
 */
export function ReflectionSheet(props = {}) {
  const reflectionId = props.reflectionId ?? '';
  const activityId = props.activityId ?? '';
  const activityName = props.activityName ?? 'Activity';
  const plannedMin = Number(props.plannedDurationMinutes ?? 0);
  const actualMin =
    typeof props.actualDurationMinutes === 'number'
      ? props.actualDurationMinutes
      : plannedMin + Number(props.planVsActualMinutes ?? 0);
  const delta =
    typeof props.planVsActualMinutes === 'number'
      ? props.planVsActualMinutes
      : actualMin - plannedMin;
  const isNonOptional = props.isNonOptional === true;
  const frictionChecked = props.frictionChecked === true;
  const whatWentWell = props.whatWentWell ?? '';
  const whatToImprove = props.whatToImprove ?? '';
  const selectedTag = props.selectedFrictionTag ?? '';

  const payload = esc(JSON.stringify({ reflectionId, activityId }));

  // Skip button: disabled when the activity is non-optional (UX_FLOWS §3.6
  // — non-optional reflections may be dismissed, but the button is
  // de-emphasized with a tooltip).
  const skipAttrs = isNonOptional
    ? 'disabled aria-disabled="true" title="Reflection on non-optional activities is encouraged — capture quickly or dismiss later from Today."'
    : '';

  const frictionFields = frictionChecked
    ? renderFrictionFields(selectedTag)
    : '';

  return `<section class="rs-modal" role="dialog" aria-modal="true" data-dialog="reflection-sheet" data-reflection-id="${esc(reflectionId)}" data-activity-id="${esc(activityId)}">
  <form class="rs-form" data-action="SUBMIT_REFLECTION" data-payload='${payload}'>
    <header class="rs-header">
      <h2 class="rs-title">${esc(activityName)} · Reflection (60 sec)</h2>
      <p class="rs-subhead" aria-live="polite">Planned ${esc(String(plannedMin))}m · Actual ${esc(String(actualMin))}m · ${esc(formatPlanDelta(delta))}</p>
    </header>
    <label class="rs-label">What went well?
      <textarea class="rs-text" name="whatWentWell" rows="2" placeholder="Optional — one quick note">${esc(whatWentWell)}</textarea>
    </label>
    <label class="rs-label">What to improve?
      <textarea class="rs-text" name="whatToImprove" rows="2" placeholder="Optional — one quick note">${esc(whatToImprove)}</textarea>
    </label>
    <label class="rs-friction-check">
      <input type="checkbox" name="frictionFlag" value="1" ${frictionChecked ? 'checked' : ''} data-action="TOGGLE_FRICTION" data-payload='${payload}' />
      <span class="rs-friction-label">Flag as friction signal</span>
    </label>
    ${frictionFields}
    <footer class="rs-footer">
      <button type="button" class="rs-skip" data-action="SKIP_REFLECTION" data-payload='${payload}' ${skipAttrs}>Skip for now</button>
      <button type="submit" class="rs-submit">Save reflection</button>
    </footer>
  </form>
</section>`;
}

/**
 * Render the friction sub-form (tag select + summary field). Only shown
 * when the "Flag as friction signal" checkbox is checked.
 *
 * @param {string} selectedTag
 * @returns {string}
 */
function renderFrictionFields(selectedTag) {
  const options = FRICTION_TAG_LABELS.map((t) => {
    const isSelected = selectedTag === t.code ? 'selected' : '';
    return `<option value="${esc(t.code)}" ${isSelected}>${esc(t.label)}</option>`;
  }).join('');
  return `<fieldset class="rs-friction-fields">
    <label class="rs-label">Friction tag
      <select name="frictionTag" class="rs-select" required>
        <option value="" disabled ${selectedTag ? '' : 'selected'}>Pick a tag…</option>
        ${options}
      </select>
    </label>
    <label class="rs-label">One-line summary (≤ 140 chars)
      <input type="text" class="rs-input" name="frictionSummary" maxlength="140" placeholder="e.g. 3 meetings back-to-back blocked deep work" required />
    </label>
  </fieldset>`;
}

export default ReflectionSheet;
