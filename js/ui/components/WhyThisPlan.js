/**
 * WhyThisPlan — "Why this plan?" progressive-disclosure chip (C-UX-12, Iteration 14).
 *
 * Renders a collapsible chip near the CycleCard header. When expanded, groups
 * the `explain[]` array from `composition.composerInputsSnapshot.explain` by
 * rule, displaying a human-readable heading per rule and each entry's `detail`
 * string underneath.
 *
 * Rules (spec):
 *   - explain === [] or missing  → renders nothing ('')
 *   - Default state: collapsed   → chip only, aria-expanded="false"
 *   - Expanded state             → rule-grouped list, aria-expanded="true"
 *   - Rule order is deterministic (see RULE_ORDER below)
 *   - Interaction goes through app.js event delegation (TOGGLE_WHY_PLAN action)
 *
 * Pure function. No DOM access, no I/O.
 *
 * @param {{
 *   explain:  Array<{ref: string, rule: string, detail: string}> | null | undefined,
 *   expanded: boolean
 * }} props
 * @returns {string}
 */

import { esc } from '../mount.js';

/**
 * Canonical rule → user-facing heading mapping (deterministic render order).
 * Unknown rules get a sensible default heading so future composer additions
 * never break the UI (R-CP-3 mitigation).
 */
const RULE_ORDER = [
  'R1_NON_OPTIONAL',
  'R2_VARIANCE_RESCUE',
  'R3_KAIZEN_LINK',
  'R4_PHASE_CEREMONY',
  'R5_DEEP_PAYLOAD',
  'R6_CI_ROTATION',
  'R7_COMM_FILLER',
  'R9_RELAXED'
];

const RULE_LABELS = Object.freeze({
  R1_NON_OPTIONAL:   'Non-optional anchors',
  R2_VARIANCE_RESCUE:'Yesterday\'s carry-overs',
  R3_KAIZEN_LINK:    'Kaizen-aligned deep work',
  R4_PHASE_CEREMONY: 'Phase ceremony (Accelerator/DMAIC)',
  R5_DEEP_PAYLOAD:   'Deep work payload',
  R6_CI_ROTATION:    'Continuous improvement',
  R7_COMM_FILLER:    'Communication slots',
  R9_RELAXED:        'Relaxed constraints applied'
});

/**
 * Sort rule keys in canonical order; rules not in RULE_ORDER sort last
 * (alphabetically by rule key for determinism).
 */
function sortedRuleKeys(keys) {
  return [...keys].sort((a, b) => {
    const ai = RULE_ORDER.indexOf(a);
    const bi = RULE_ORDER.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a < b ? -1 : a > b ? 1 : 0;
  });
}

/**
 * Group explain entries by rule, preserving per-rule insertion order.
 *
 * @param {Array<{ref: string, rule: string, detail: string}>} explain
 * @returns {Map<string, string[]>}  rule → detail[]
 */
function groupByRule(explain) {
  const groups = new Map();
  for (const entry of explain) {
    if (!entry || typeof entry.rule !== 'string') continue;
    if (!groups.has(entry.rule)) groups.set(entry.rule, []);
    groups.get(entry.rule).push(typeof entry.detail === 'string' ? entry.detail : '');
  }
  return groups;
}

/**
 * @param {{
 *   explain:  Array<{ref: string, rule: string, detail: string}> | null | undefined,
 *   expanded: boolean
 * }} props
 * @returns {string}
 */
export function WhyThisPlan({ explain, expanded } = {}) {
  // Graceful degrade: empty or missing array → render nothing.
  if (!Array.isArray(explain) || explain.length === 0) return '';

  const isExpanded = !!expanded;
  const ariaExpanded = isExpanded ? 'true' : 'false';

  if (!isExpanded) {
    return `<div class="why-this-plan">
  <button type="button"
    class="why-this-plan-chip"
    data-action="TOGGLE_WHY_PLAN"
    data-payload="{}"
    aria-expanded="${ariaExpanded}">Why this plan? ›</button>
</div>`;
  }

  // Build grouped list in canonical rule order.
  const groups = groupByRule(explain);
  const orderedKeys = sortedRuleKeys([...groups.keys()]);

  const groupsHtml = orderedKeys.map((rule) => {
    const heading = RULE_LABELS[rule] ?? rule;
    const details = groups.get(rule);
    const detailItems = details
      .map((d) => `    <dd class="why-detail">${esc(d)}</dd>`)
      .join('\n');
    return `  <dt class="why-rule">${esc(heading)}</dt>\n${detailItems}`;
  }).join('\n');

  return `<div class="why-this-plan why-this-plan--expanded">
  <button type="button"
    class="why-this-plan-chip"
    data-action="TOGGLE_WHY_PLAN"
    data-payload="{}"
    aria-expanded="${ariaExpanded}">Why this plan? ↑</button>
  <dl class="why-list">
${groupsHtml}
  </dl>
</div>`;
}

export default WhyThisPlan;
