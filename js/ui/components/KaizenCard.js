/**
 * KaizenCard — Sprint 6 P0-T7 + Sprint 8 P1-T2/T3.
 *
 * Pure render. Variants:
 *   DRAFT             — problem, editable goal, action list w/ add/remove,
 *                       "Lock baseline" CTA (disabled until goal+>=1 action)
 *                       + inline "Abandon" form (Sprint 8 P1-T3)
 *   ACTIVE            — read-only goal, locked baseline, check-off actions,
 *                       "Start remeasurement" (when all actions done)
 *   IN_REMEASUREMENT  — (Sprint 8 P1-T2) baseline (locked), "Capture
 *                       remeasurement" primary button; when remeasurement
 *                       captured, show delta + "Close Kaizen" primary.
 *   CLOSED            — (Sprint 8 P1-T2) read-only summary with closeKind
 *                       badge, baseline/remeasurement/delta, lessonsLearned,
 *                       closedAt. No actions.
 *   ABANDONED        — variant rendered when kaizen.abandoned=true,
 *                       regardless of state (always DRAFT per invariant).
 *
 * Events fired via delegation:
 *   KAIZEN_SET_GOAL
 *   KAIZEN_ADD_ACTION
 *   KAIZEN_REMOVE_ACTION
 *   KAIZEN_MARK_ACTION_DONE
 *   KAIZEN_LOCK_BASELINE         — opens BaselineDialog
 *   KAIZEN_START_REMEASUREMENT
 *   KAIZEN_OPEN_REMEASUREMENT_DIALOG
 *   KAIZEN_OPEN_CLOSE_DIALOG
 *   KAIZEN_ABANDON               — expands inline abandon form
 *   KAIZEN_CONFIRM_ABANDON       — submits abandon
 *   KAIZEN_CANCEL_ABANDON        — cancels abandon form
 */

import { esc } from '../mount.js';
import { KaizenState } from '../../domain/types.js';

const CLOSE_KIND_LABEL = Object.freeze({
  SUCCESS: 'SUCCESS',
  PARTIAL: 'PARTIAL',
  FAILED_HONEST: 'FAILED HONEST'
});

/**
 * KaizenCard component.
 *
 * @param {{
 *   kaizen: object,
 *   baseline?: object|null,
 *   remeasurement?: object|null,
 *   sourceFrictionSignalCount?: number,
 *   abandonFormOpen?: boolean
 * }} props
 * @returns {string}
 */
export function KaizenCard(props = {}) {
  const kaizen = props.kaizen;
  if (!kaizen || typeof kaizen !== 'object') {
    return `<section class="kz-card kz-card-empty"><p>No Kaizen.</p></section>`;
  }
  if (kaizen.abandoned === true) {
    return renderAbandoned(kaizen);
  }
  switch (kaizen.state) {
    case KaizenState.DRAFT:
      return renderDraft(kaizen, props);
    case KaizenState.ACTIVE:
      return renderActive(kaizen, props);
    case KaizenState.IN_REMEASUREMENT:
      return renderInRemeasurement(kaizen, props);
    case KaizenState.CLOSED:
      return renderClosed(kaizen, props);
    default:
      return renderStub(kaizen);
  }
}

/**
 * DRAFT variant.
 */
function renderDraft(k, props) {
  const payload = esc(JSON.stringify({ kaizenId: k.id }));
  const sourceCount =
    typeof props.sourceFrictionSignalCount === 'number'
      ? props.sourceFrictionSignalCount
      : (k.sourceFrictionSignalIds ?? []).length;
  const hasGoal = typeof k.goalStatement === 'string' && k.goalStatement.length > 0;
  const hasActions = Array.isArray(k.actions) && k.actions.length >= 1;
  const canLock = hasGoal && hasActions;
  const lockDisabled = canLock ? '' : 'disabled aria-disabled="true"';
  const lockHint = canLock
    ? ''
    : '<p class="kz-hint">Set a goal + at least one action to enable Lock baseline.</p>';

  const abandonBlock = props.abandonFormOpen
    ? `<section class="kz-abandon-form" data-kaizen-id="${esc(k.id)}">
        <form data-action="KAIZEN_CONFIRM_ABANDON" data-payload='${payload}'>
          <label class="kz-abandon-label">
            <span>Abandon this Kaizen? State it why (min 10 chars).</span>
            <textarea class="kz-abandon-reason" name="reason" rows="2" minlength="10" required></textarea>
          </label>
          <div class="kz-abandon-actions">
            <button type="button" class="kz-abandon-cancel" data-action="KAIZEN_CANCEL_ABANDON" data-payload='${payload}'>Keep</button>
            <button type="submit" class="kz-abandon-confirm">Confirm abandon</button>
          </div>
        </form>
      </section>`
    : `<button type="button" class="kz-abandon" data-action="KAIZEN_ABANDON" data-payload='${payload}'>Abandon</button>`;

  return `<section class="kz-card kz-card-draft" data-kaizen-id="${esc(k.id)}" data-state="${esc(k.state)}">
  <header class="kz-header">
    <span class="kz-badge kz-badge-draft">DRAFT</span>
    <h2 class="kz-title">${esc(k.title || 'Untitled Kaizen')}</h2>
  </header>
  <section class="kz-problem">
    <h3 class="kz-sub">Problem</h3>
    <p class="kz-body">${esc(k.problemStatement || '')}</p>
    <p class="kz-source-count">Sourced from ${esc(String(sourceCount))} friction signal${sourceCount === 1 ? '' : 's'}.</p>
  </section>
  <section class="kz-goal">
    <h3 class="kz-sub">Goal statement</h3>
    <form class="kz-goal-form" data-action="KAIZEN_SET_GOAL" data-payload='${payload}'>
      <textarea class="kz-goal-input" name="goalStatement" rows="2" placeholder="Baseline X → target Y by date Z">${esc(k.goalStatement || '')}</textarea>
      <button type="submit" class="kz-goal-save">Save goal</button>
    </form>
  </section>
  ${renderActionsSection(k, payload, /* active= */ false)}
  <footer class="kz-footer">
    <button type="button" class="kz-lock-baseline" data-action="KAIZEN_LOCK_BASELINE" data-payload='${payload}' ${lockDisabled}>Lock baseline</button>
    ${lockHint}
    ${abandonBlock}
  </footer>
</section>`;
}

/**
 * ACTIVE variant.
 */
function renderActive(k, props) {
  const payload = esc(JSON.stringify({ kaizenId: k.id }));
  const baseline = props.baseline ?? null;
  const actionsDone = (k.actions ?? []).filter((a) => a && a.doneAt != null).length;
  const actionsTotal = (k.actions ?? []).length;
  const readyToRemeasure =
    actionsTotal > 0 && actionsDone === actionsTotal;

  const baselineHtml = renderBaselineDl(baseline);
  const readyBadge = readyToRemeasure
    ? `<p class="kz-ready">Ready to remeasure · <button type="button" class="kz-start-remeasure" data-action="KAIZEN_START_REMEASUREMENT" data-payload='${payload}'>Start remeasurement</button></p>`
    : '';

  return `<section class="kz-card kz-card-active" data-kaizen-id="${esc(k.id)}" data-state="${esc(k.state)}">
  <header class="kz-header">
    <span class="kz-badge kz-badge-active">ACTIVE</span>
    <h2 class="kz-title">${esc(k.title || 'Untitled Kaizen')}</h2>
  </header>
  <section class="kz-problem">
    <h3 class="kz-sub">Problem</h3>
    <p class="kz-body">${esc(k.problemStatement || '')}</p>
  </section>
  <section class="kz-goal">
    <h3 class="kz-sub">Goal</h3>
    <p class="kz-body">${esc(k.goalStatement || '')}</p>
  </section>
  <section class="kz-baseline">
    <h3 class="kz-sub">Baseline (locked)</h3>
    ${baselineHtml}
  </section>
  ${renderActionsSection(k, payload, /* active= */ true)}
  ${readyBadge}
</section>`;
}

/**
 * IN_REMEASUREMENT variant (Sprint 8 P1-T2). Shows baseline, the capture
 * CTA (until a Remeasurement row exists) and — once captured — delta +
 * Close Kaizen CTA.
 */
function renderInRemeasurement(k, props) {
  const payload = esc(JSON.stringify({ kaizenId: k.id }));
  const baseline = props.baseline ?? null;
  const remeasurement = props.remeasurement ?? null;

  const baselineHtml = renderBaselineDl(baseline);
  const remHtml = remeasurement
    ? renderRemeasurementDl(remeasurement, baseline)
    : `<button type="button" class="kz-capture-remeasure" data-action="KAIZEN_OPEN_REMEASUREMENT_DIALOG" data-payload='${payload}'>Capture remeasurement</button>`;

  const closeBtn = remeasurement
    ? `<button type="button" class="kz-close-kaizen" data-action="KAIZEN_OPEN_CLOSE_DIALOG" data-payload='${payload}'>Close Kaizen</button>`
    : '';

  return `<section class="kz-card kz-card-in-remeasurement" data-kaizen-id="${esc(k.id)}" data-state="${esc(k.state)}">
  <header class="kz-header">
    <span class="kz-badge kz-badge-in-remeasurement">IN REMEASUREMENT</span>
    <h2 class="kz-title">${esc(k.title || 'Untitled Kaizen')}</h2>
  </header>
  <section class="kz-problem">
    <h3 class="kz-sub">Problem</h3>
    <p class="kz-body">${esc(k.problemStatement || '')}</p>
  </section>
  <section class="kz-goal">
    <h3 class="kz-sub">Goal</h3>
    <p class="kz-body">${esc(k.goalStatement || '')}</p>
  </section>
  <section class="kz-baseline">
    <h3 class="kz-sub">Baseline (locked)</h3>
    ${baselineHtml}
  </section>
  <section class="kz-remeasurement">
    <h3 class="kz-sub">Remeasurement</h3>
    ${remHtml}
  </section>
  <footer class="kz-footer">
    ${closeBtn}
    <button type="button" class="kz-back-to-active" disabled aria-disabled="true" title="Back to ACTIVE ships in a later sprint">Back to ACTIVE</button>
  </footer>
</section>`;
}

/**
 * CLOSED variant (Sprint 8 P1-T2). Read-only, closeKind badge + lessons.
 */
function renderClosed(k, props) {
  const baseline = props.baseline ?? null;
  const remeasurement = props.remeasurement ?? null;
  const closeKind = typeof k.closeKind === 'string' ? k.closeKind : 'UNKNOWN';
  const badgeLabel = CLOSE_KIND_LABEL[closeKind] ?? closeKind;
  const badgeClass = `kz-badge kz-close-${esc(closeKind.toLowerCase())}`;

  const deltaRow = remeasurement
    ? renderRemeasurementDl(remeasurement, baseline)
    : '<p class="kz-body kz-body-missing">Remeasurement row missing.</p>';

  const lessonsHtml = k.lessonsLearned
    ? `<section class="kz-lessons"><h3 class="kz-sub">Lessons learned</h3><p class="kz-body">${esc(k.lessonsLearned)}</p></section>`
    : '';

  return `<section class="kz-card kz-card-closed" data-kaizen-id="${esc(k.id)}" data-state="${esc(k.state)}" data-close-kind="${esc(closeKind)}">
  <header class="kz-header">
    <span class="${badgeClass}">${esc(badgeLabel)}</span>
    <h2 class="kz-title">${esc(k.title || 'Untitled Kaizen')}</h2>
  </header>
  <section class="kz-problem">
    <h3 class="kz-sub">Problem</h3>
    <p class="kz-body">${esc(k.problemStatement || '')}</p>
  </section>
  <section class="kz-goal">
    <h3 class="kz-sub">Goal</h3>
    <p class="kz-body">${esc(k.goalStatement || '')}</p>
  </section>
  <section class="kz-baseline">
    <h3 class="kz-sub">Baseline (locked)</h3>
    ${renderBaselineDl(baseline)}
  </section>
  <section class="kz-remeasurement">
    <h3 class="kz-sub">Remeasurement</h3>
    ${deltaRow}
  </section>
  ${lessonsHtml}
  <footer class="kz-footer">
    <p class="kz-closed-at">Closed ${esc(k.closedAt ?? '')}</p>
  </footer>
</section>`;
}

/**
 * ABANDONED variant (Sprint 8 P1-T3). Always rendered for kaizen.abandoned
 * regardless of state (state remains DRAFT per §3.3 invariant).
 */
function renderAbandoned(k) {
  return `<section class="kz-card kz-card-abandoned" data-kaizen-id="${esc(k.id)}" data-state="${esc(k.state)}" data-abandoned="true">
  <header class="kz-header">
    <span class="kz-badge kz-badge-abandoned">ABANDONED</span>
    <h2 class="kz-title">${esc(k.title || 'Untitled Kaizen')}</h2>
  </header>
  <section class="kz-problem">
    <h3 class="kz-sub">Problem</h3>
    <p class="kz-body">${esc(k.problemStatement || '')}</p>
  </section>
  <section class="kz-reason">
    <h3 class="kz-sub">Reason</h3>
    <p class="kz-body">${esc(k.abandonReason ?? '')}</p>
    <p class="kz-abandoned-at">Abandoned ${esc(k.abandonedAt ?? '')}</p>
  </section>
</section>`;
}

/**
 * Stub view for unknown states.
 */
function renderStub(k) {
  return `<section class="kz-card kz-card-stub" data-kaizen-id="${esc(k.id)}" data-state="${esc(k.state)}">
  <header class="kz-header">
    <span class="kz-badge kz-badge-${esc((k.state ?? '').toLowerCase())}">${esc(k.state ?? '')}</span>
    <h2 class="kz-title">${esc(k.title || 'Untitled Kaizen')}</h2>
  </header>
  <p class="kz-body">Full ${esc(k.state ?? '')} view not available.</p>
</section>`;
}

/**
 * Render the actions section.
 */
function renderActionsSection(k, payload, active) {
  const actions = Array.isArray(k.actions) ? k.actions : [];
  const items = actions
    .map((a, i) => {
      const doneClass = a.doneAt ? ' kz-action-done' : '';
      const rowPayload = esc(JSON.stringify({ kaizenId: k.id, index: i }));
      if (active) {
        const checked = a.doneAt ? 'checked disabled' : '';
        return `<li class="kz-action${doneClass}">
          <label class="kz-action-label">
            <input type="checkbox" ${checked} data-action="KAIZEN_MARK_ACTION_DONE" data-payload='${rowPayload}' />
            <span class="kz-action-name">${esc(a.name || '')}</span>
            <span class="kz-action-owner">${esc(a.ownerRef || '')}</span>
            <span class="kz-action-due">due ${esc(a.dueDate || '')}</span>
          </label>
        </li>`;
      }
      return `<li class="kz-action${doneClass}">
        <span class="kz-action-name">${esc(a.name || '')}</span>
        <span class="kz-action-owner">${esc(a.ownerRef || '')}</span>
        <span class="kz-action-due">due ${esc(a.dueDate || '')}</span>
        <button type="button" class="kz-action-remove" data-action="KAIZEN_REMOVE_ACTION" data-payload='${rowPayload}' aria-label="Remove action">×</button>
      </li>`;
    })
    .join('\n');

  const addForm = !active
    ? `<form class="kz-action-add" data-action="KAIZEN_ADD_ACTION" data-payload='${payload}'>
        <input type="text" name="name" placeholder="Action name" required />
        <input type="text" name="ownerRef" placeholder="Owner" required />
        <input type="date" name="dueDate" required />
        <button type="submit" class="kz-action-add-btn">Add action</button>
      </form>`
    : '';

  return `<section class="kz-actions">
    <h3 class="kz-sub">Actions (${esc(String(actions.length))})</h3>
    <ul class="kz-action-list">${items || '<li class="kz-action-empty">No actions yet.</li>'}</ul>
    ${addForm}
  </section>`;
}

function renderBaselineDl(baseline) {
  if (!baseline) return '<p class="kz-body kz-body-missing">Baseline not resolved.</p>';
  const md = baseline.metricDefinition ?? {};
  return `<dl class="kz-baseline-meta">
    <dt>Metric</dt><dd>${esc(md.name ?? '')}</dd>
    <dt>Value</dt><dd>${esc(String(baseline.value ?? ''))} ${esc(md.unit ?? '')}</dd>
    <dt>Captured</dt><dd>${esc(baseline.capturedAt ?? '')}</dd>
    <dt>Locked</dt><dd>${baseline.locked ? 'Yes' : 'No'}</dd>
  </dl>`;
}

function renderRemeasurementDl(rm, baseline) {
  const unit = baseline?.metricDefinition?.unit ?? '';
  const signedAbs =
    (rm.deltaAbsolute >= 0 ? '+' : '') + String(rm.deltaAbsolute);
  const pctPart =
    rm.deltaPercent === null
      ? 'N/A'
      : `${rm.deltaPercent >= 0 ? '+' : ''}${roundish(rm.deltaPercent)}%`;
  return `<dl class="kz-remeasurement-meta">
    <dt>Value</dt><dd>${esc(String(rm.value))} ${esc(unit)}</dd>
    <dt>Delta</dt><dd class="kz-delta" data-beats="${esc(String(rm.beatsBaseline))}">${esc(signedAbs)} ${esc(unit)} (${esc(pctPart)})</dd>
    <dt>Captured</dt><dd>${esc(rm.capturedAt ?? '')}</dd>
    <dt>Beats baseline</dt><dd>${rm.beatsBaseline ? 'Yes' : 'No'}</dd>
  </dl>`;
}

function roundish(n) {
  if (!Number.isFinite(Number(n))) return String(n);
  return String(Math.round(Number(n) * 100) / 100);
}

export default KaizenCard;
