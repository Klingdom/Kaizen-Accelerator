/**
 * Kaizen page — Sprint 6 P1-T2.
 *
 * Pure function. Takes:
 *   activeKaizen  — the user's ACTIVE or DRAFT Kaizen (preferring ACTIVE)
 *   baseline      — the locked BaselineMetric for the active Kaizen (or null)
 *   openFrictionSignals — recent OPEN signals summary
 *   draftKaizens  — list of DRAFT Kaizens the user has
 *   wizardState   — WeeklyReflectionWizard state if open, else null
 *
 * Renders:
 *   - Active Kaizen card (ACTIVE variant) when one exists
 *   - Draft Kaizen cards (DRAFT variant) for any in-flight drafts
 *   - Empty state with "Start Weekly Reflection" button + open-signal summary
 *   - Wizard modal when open
 */

import { esc } from '../mount.js';
import { KaizenCard } from '../components/KaizenCard.js';
import { WeeklyReflectionWizard } from '../components/WeeklyReflectionWizard.js';

export const KAIZEN_COPY = Object.freeze({
  EMPTY_TITLE: 'No active Kaizen',
  EMPTY_BODY:
    'When friction shows up week after week, promote it into an explicit experiment. Start with the weekly reflection.',
  CTA: 'Start Weekly Reflection'
});

/**
 * @param {{
 *   activeKaizen?: object|null,
 *   draftKaizens?: object[],
 *   baseline?: object|null,
 *   remeasurement?: object|null,
 *   openFrictionSignals?: object[],
 *   wizardState?: object|null,
 *   abandonForm?: {kaizenId: string}|null
 * }} props
 * @returns {string}
 */
export function Kaizen(props = {}) {
  const active = props.activeKaizen ?? null;
  const drafts = Array.isArray(props.draftKaizens) ? props.draftKaizens : [];
  const baseline = props.baseline ?? null;
  const remeasurement = props.remeasurement ?? null;
  const openSignals = Array.isArray(props.openFrictionSignals)
    ? props.openFrictionSignals
    : [];
  const wizardState = props.wizardState ?? null;
  const abandonForm = props.abandonForm ?? null;

  const wizardModal = wizardState
    ? WeeklyReflectionWizard(wizardState)
    : '';

  const activeBlock = active
    ? `<section class="kz-page-active">
        <h2 class="kz-page-section-title">Active Kaizen</h2>
        ${KaizenCard({ kaizen: active, baseline, remeasurement })}
      </section>`
    : '';

  const draftBlock = drafts.length
    ? `<section class="kz-page-drafts">
        <h2 class="kz-page-section-title">Drafts</h2>
        ${drafts.map((k) => KaizenCard({
          kaizen: k,
          abandonFormOpen: abandonForm != null && abandonForm.kaizenId === k.id
        })).join('\n')}
      </section>`
    : '';

  if (!active && drafts.length === 0) {
    return `<main class="kz-page" data-route="kaizen">
  <header class="kz-page-header">
    <h1 class="kz-page-title">Kaizen</h1>
  </header>
  <section class="kz-empty">
    <h2>${esc(KAIZEN_COPY.EMPTY_TITLE)}</h2>
    <p>${esc(KAIZEN_COPY.EMPTY_BODY)}</p>
    <button type="button" class="kz-start-wizard" data-action="WRW_OPEN">${esc(KAIZEN_COPY.CTA)}</button>
    ${renderOpenSignalsSummary(openSignals)}
  </section>
  ${wizardModal}
</main>`;
  }

  return `<main class="kz-page" data-route="kaizen">
  <header class="kz-page-header">
    <h1 class="kz-page-title">Kaizen</h1>
    ${active ? '' : `<button type="button" class="kz-start-wizard" data-action="WRW_OPEN">${esc(KAIZEN_COPY.CTA)}</button>`}
  </header>
  ${activeBlock}
  ${draftBlock}
  ${wizardModal}
</main>`;
}

/**
 * Render a short summary of the N most recent OPEN friction signals.
 *
 * @param {object[]} signals
 * @returns {string}
 */
function renderOpenSignalsSummary(signals) {
  if (!signals.length) {
    return `<p class="kz-empty-signals">No open friction signals yet. Reflect on activities this week to surface patterns.</p>`;
  }
  const items = signals
    .slice(0, 5)
    .map(
      (s) => `<li class="kz-signal-item">
        <span class="kz-signal-tag">${esc(s.tag ?? 'UNTAGGED')}</span>
        <span class="kz-signal-summary">${esc(s.summary ?? '')}</span>
      </li>`
    )
    .join('');
  return `<section class="kz-open-signals">
    <h3>Recent open friction</h3>
    <ul class="kz-signal-list">${items}</ul>
  </section>`;
}

export default Kaizen;
