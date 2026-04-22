/**
 * OpportunityRow — Sprint 7 P0-T5 sub-component.
 *
 * Pure render. One row in the Portfolio "Opportunities" list. Shows
 * title, truncated problem statement, proposed project type chip, status
 * chip, age (days since createdAt), and Promote / Defer / Reject actions.
 *
 * Events (delegation):
 *   OPP_PROMOTE  (payload {opportunityId})
 *   OPP_DEFER    (payload {opportunityId})
 *   OPP_REJECT   (payload {opportunityId})
 *   OPP_TOGGLE_EXPAND (payload {opportunityId})   — P1-T1 inline expand
 */

import { esc } from '../mount.js';
import { OpportunityStatus } from '../../domain/types.js';

const TERMINAL_STATUSES = new Set([
  OpportunityStatus.PROMOTED,
  OpportunityStatus.DEFERRED,
  OpportunityStatus.REJECTED
]);

/**
 * Truncate a string to `limit` chars, adding `…` when cut.
 *
 * @param {string} s
 * @param {number} limit
 * @returns {string}
 */
export function truncate(s, limit = 140) {
  if (typeof s !== 'string') return '';
  if (s.length <= limit) return s;
  return s.slice(0, Math.max(0, limit - 1)) + '…';
}

/**
 * Compute age in days between two ISO timestamps. Negative ages clamp to 0.
 *
 * @param {string} createdAtIso
 * @param {string} nowIso
 * @returns {number}
 */
export function computeAgeInDays(createdAtIso, nowIso) {
  const a = new Date(createdAtIso);
  const b = new Date(nowIso);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
  const ms = b.getTime() - a.getTime();
  if (ms < 0) return 0;
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

/**
 * @param {{
 *   opportunity: object,
 *   nowIso?: string,
 *   expanded?: boolean
 * }} props
 * @returns {string}
 */
export function OpportunityRow(props = {}) {
  const opp = props.opportunity;
  if (!opp || typeof opp !== 'object') {
    return `<li class="opp-row opp-row-empty"><p>No opportunity.</p></li>`;
  }
  const nowIso = props.nowIso ?? new Date().toISOString();
  const expanded = props.expanded === true;
  const age = computeAgeInDays(opp.createdAt, nowIso);
  const payload = esc(JSON.stringify({ opportunityId: opp.id }));
  const terminal = TERMINAL_STATUSES.has(opp.status);
  const actionsDisabled = terminal ? 'disabled aria-disabled="true"' : '';
  const statusLower = String(opp.status ?? '').toLowerCase();

  const togglePayload = payload; // same shape
  const expandedAttr = expanded ? 'true' : 'false';

  const expandedDetails = expanded ? renderExpanded(opp) : '';

  return `<li class="opp-row opp-row-${esc(statusLower)}" data-opportunity-id="${esc(opp.id)}" data-status="${esc(opp.status ?? '')}" data-expanded="${expandedAttr}">
  <button type="button" class="opp-row-toggle" data-action="OPP_TOGGLE_EXPAND" data-payload='${togglePayload}' aria-expanded="${expandedAttr}">
    <span class="opp-row-title">${esc(opp.title || 'Untitled')}</span>
    <span class="opp-row-problem">${esc(truncate(opp.problemStatement || '', 140))}</span>
    <span class="opp-row-meta">
      <span class="opp-chip opp-chip-projecttype">${esc(opp.proposedProjectType ?? '')}</span>
      <span class="opp-chip opp-chip-status opp-chip-status-${esc(statusLower)}">${esc(opp.status ?? '')}</span>
      <span class="opp-row-age">${esc(String(age))}d old</span>
    </span>
  </button>
  <div class="opp-row-actions">
    <button type="button" class="opp-action opp-action-promote" data-action="OPP_PROMOTE" data-payload='${payload}' ${actionsDisabled}>Promote</button>
    <button type="button" class="opp-action opp-action-defer" data-action="OPP_DEFER" data-payload='${payload}' ${actionsDisabled}>Defer</button>
    <button type="button" class="opp-action opp-action-reject" data-action="OPP_REJECT" data-payload='${payload}' ${actionsDisabled}>Reject</button>
  </div>
  ${expandedDetails}
</li>`;
}

/**
 * Render the expanded details panel for an opportunity row (P1-T1).
 *
 * @param {object} opp
 * @returns {string}
 */
function renderExpanded(opp) {
  const scope = typeof opp.scope === 'string' && opp.scope.length > 0
    ? opp.scope
    : null;
  const kaizenLink = opp.promotedKaizenId
    ? `<p class="opp-link-kaizen">Promoted to Kaizen: <a href="#kaizen" data-kaizen-id="${esc(opp.promotedKaizenId)}">${esc(opp.promotedKaizenId)}</a></p>`
    : '';
  const rejection = opp.rejectionReason
    ? `<p class="opp-rejection-reason"><strong>Reason:</strong> ${esc(opp.rejectionReason)}</p>`
    : '';
  const deferred = opp.deferredUntil
    ? `<p class="opp-deferred-until"><strong>Deferred until:</strong> ${esc(opp.deferredUntil)}</p>`
    : '';
  const scopeBlock = scope
    ? `<p class="opp-scope"><strong>Scope:</strong> ${esc(scope)}</p>`
    : '<p class="opp-scope opp-scope-empty">No scope specified.</p>';
  return `<section class="opp-row-expanded">
    <p class="opp-full-problem"><strong>Problem:</strong> ${esc(opp.problemStatement ?? '')}</p>
    ${scopeBlock}
    ${kaizenLink}
    ${rejection}
    ${deferred}
  </section>`;
}

export default OpportunityRow;
