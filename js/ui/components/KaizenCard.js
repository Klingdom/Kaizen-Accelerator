/**
 * KaizenCard — Sprint 6 P0-T7.
 *
 * Pure render. Two variants for Sprint 6:
 *   DRAFT    — problemStatement, source-signal count, editable goal,
 *              action list with add/remove, "Lock baseline" CTA
 *              (disabled until goalStatement + actions.length >= 1)
 *   ACTIVE   — read-only goal, locked baseline block, action list with
 *              check-off, "Ready to remeasure" indicator, "Abandon" CTA
 *
 * Other states (IN_REMEASUREMENT, CLOSED) render a short "Ships in
 * Sprint 7" stub.
 *
 * Events fired via delegation:
 *   KAIZEN_SET_GOAL          (payload {kaizenId})  — textarea blur / form submit
 *   KAIZEN_ADD_ACTION        (payload {kaizenId})
 *   KAIZEN_REMOVE_ACTION     (payload {kaizenId, index})
 *   KAIZEN_MARK_ACTION_DONE  (payload {kaizenId, index})
 *   KAIZEN_LOCK_BASELINE     (payload {kaizenId})  — opens baseline dialog
 *   KAIZEN_START_REMEASUREMENT (payload {kaizenId})  — Sprint 7 wiring
 *   KAIZEN_ABANDON           (payload {kaizenId})
 */

import { esc } from '../mount.js';
import { KaizenState } from '../../domain/types.js';

/**
 * KaizenCard component.
 *
 * @param {{
 *   kaizen: object,
 *   baseline?: object|null,
 *   sourceFrictionSignalCount?: number
 * }} props
 * @returns {string}
 */
export function KaizenCard(props = {}) {
  const kaizen = props.kaizen;
  if (!kaizen || typeof kaizen !== 'object') {
    return `<section class="kz-card kz-card-empty"><p>No Kaizen.</p></section>`;
  }
  switch (kaizen.state) {
    case KaizenState.DRAFT:
      return renderDraft(kaizen, props);
    case KaizenState.ACTIVE:
      return renderActive(kaizen, props);
    case KaizenState.IN_REMEASUREMENT:
    case KaizenState.CLOSED:
      return renderStub(kaizen);
    default:
      return renderStub(kaizen);
  }
}

/**
 * DRAFT variant.
 *
 * @param {object} k
 * @param {object} props
 * @returns {string}
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
  </footer>
</section>`;
}

/**
 * ACTIVE variant.
 *
 * @param {object} k
 * @param {object} props
 * @returns {string}
 */
function renderActive(k, props) {
  const payload = esc(JSON.stringify({ kaizenId: k.id }));
  const baseline = props.baseline ?? null;
  const actionsDone = (k.actions ?? []).filter((a) => a && a.doneAt != null).length;
  const actionsTotal = (k.actions ?? []).length;
  const readyToRemeasure =
    actionsTotal > 0 && actionsDone === actionsTotal;

  const baselineHtml = baseline
    ? `<dl class="kz-baseline-meta">
        <dt>Metric</dt><dd>${esc(baseline.metricDefinition?.name ?? '')}</dd>
        <dt>Value</dt><dd>${esc(String(baseline.value ?? ''))} ${esc(baseline.metricDefinition?.unit ?? '')}</dd>
        <dt>Captured</dt><dd>${esc(baseline.capturedAt ?? '')}</dd>
        <dt>Locked</dt><dd>${baseline.locked ? 'Yes' : 'No'}</dd>
      </dl>`
    : '<p class="kz-body kz-body-missing">Baseline not resolved.</p>';

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
  <footer class="kz-footer">
    <button type="button" class="kz-abandon" data-action="KAIZEN_ABANDON" data-payload='${payload}'>Abandon</button>
  </footer>
</section>`;
}

/**
 * Stub view for IN_REMEASUREMENT / CLOSED until Sprint 7 wiring lands.
 *
 * @param {object} k
 * @returns {string}
 */
function renderStub(k) {
  return `<section class="kz-card kz-card-stub" data-kaizen-id="${esc(k.id)}" data-state="${esc(k.state)}">
  <header class="kz-header">
    <span class="kz-badge kz-badge-${esc((k.state ?? '').toLowerCase())}">${esc(k.state ?? '')}</span>
    <h2 class="kz-title">${esc(k.title || 'Untitled Kaizen')}</h2>
  </header>
  <p class="kz-body">Full ${esc(k.state ?? '')} view ships in Sprint 7.</p>
</section>`;
}

/**
 * Render the actions section. In DRAFT the user can add + remove; in
 * ACTIVE they check off done.
 *
 * @param {object} k
 * @param {string} payload     pre-escaped JSON {kaizenId: ...}
 * @param {boolean} active
 * @returns {string}
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

export default KaizenCard;
