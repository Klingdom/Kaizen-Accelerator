/**
 * RhythmExplainer — dismissible banner that explains the 4-2-2 daily rhythm.
 *
 * Sprint 10 backlog item #3 (2026-04-23). The BucketStrip renders three
 * bars with targets/floors/ceilings but doesn't tell a first-time user WHY
 * the day is divided 240/120/120. New users see arbitrary numbers.
 *
 * This component is the onboarding moment: one short paragraph, a dismiss
 * button, and a data-action hook that persists dismissal so the banner
 * never shows again for that user.
 *
 * Pure render. No state. Parent owns the dismissed flag.
 */

import { esc } from '../../mount.js';

export const RHYTHM_EXPLAINER_COPY = Object.freeze({
  HEADING: 'Your 4-2-2 daily rhythm',
  BODY:
    'CadencePlan balances each day across three buckets: Deep Work (240 min) for focused project execution, ' +
    'Communication (120 min) for meetings and messages, and Continuous Improvement (120 min) for learning, ' +
    'ceremonies, and reflection. This rhythm keeps focus sharp and compounding improvement habitual.',
  DISMISS: 'Got it'
});

/**
 * @param {{ dismissed?: boolean }} [props]
 * @returns {string}
 */
export function RhythmExplainer(props = {}) {
  if (props && props.dismissed === true) return '';
  return `<aside class="rhythm-explainer" role="note" aria-label="${esc(RHYTHM_EXPLAINER_COPY.HEADING)}">
    <div class="rhythm-explainer-body">
      <h3 class="rhythm-explainer-title">${esc(RHYTHM_EXPLAINER_COPY.HEADING)}</h3>
      <p class="rhythm-explainer-copy">${esc(RHYTHM_EXPLAINER_COPY.BODY)}</p>
    </div>
    <button type="button"
            class="rhythm-explainer-dismiss"
            data-action="RHYTHM_EXPLAINER_DISMISS"
            data-payload='{}'>${esc(RHYTHM_EXPLAINER_COPY.DISMISS)}</button>
  </aside>`;
}

export default RhythmExplainer;
