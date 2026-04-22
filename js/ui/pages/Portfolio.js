/**
 * Portfolio page — Sprint 7 P0-T5.
 *
 * The new top-level surface for opportunity intake + catalog browsing.
 *
 * Sections:
 *   1. Active Kaizens — list of ACTIVE (+ IN_REMEASUREMENT) Kaizens
 *   2. Opportunities  — filterable intake list (all / intake / scored /
 *                       promoted / deferred / rejected)
 *   3. Standard Work Catalog — 3-column bucket view via CatalogBucketView
 *
 * The intake form modal overlays when `intakeForm` is provided.
 */

import { esc } from '../mount.js';
import { KaizenCard } from '../components/KaizenCard.js';
import { OpportunityRow } from '../components/OpportunityRow.js';
import { OpportunityIntakeForm } from '../components/OpportunityIntakeForm.js';
import { CatalogBucketView } from '../components/CatalogBucketView.js';
import { ValidatedKaizenCard } from '../components/ValidatedKaizenCard.js';
import { OpportunityStatus } from '../../domain/types.js';

export const PORTFOLIO_COPY = Object.freeze({
  TITLE: 'Project Portfolio',
  NEW_OPP: 'New Opportunity',
  ACTIVE_EMPTY: 'No active Kaizens. Promote an opportunity to start.',
  OPPORTUNITIES_EMPTY: 'No opportunities yet. Tap New Opportunity to capture one.',
  VALIDATED_EMPTY: 'No validated Kaizens yet. Close a Kaizen to see it here.'
});

export const OPP_FILTER_VALUES = Object.freeze([
  'all',
  'INTAKE',
  'SCORED',
  'PROMOTED',
  'DEFERRED',
  'REJECTED'
]);

export const OPP_FILTER_LABELS = Object.freeze({
  all: 'All',
  INTAKE: 'Intake',
  SCORED: 'Scored',
  PROMOTED: 'Promoted',
  DEFERRED: 'Deferred',
  REJECTED: 'Rejected'
});

export const OPP_SORT_VALUES = Object.freeze([
  'newest',
  'oldest',
  'projectType'
]);

export const OPP_SORT_LABELS = Object.freeze({
  newest: 'Newest first',
  oldest: 'Oldest first',
  projectType: 'Project type'
});

/**
 * @param {{
 *   activeKaizens?: object[],
 *   opportunities?: object[],
 *   catalogEntries?: object[],
 *   closedKaizens?: object[],
 *   remeasurementsByKaizenId?: Record<string, object>,
 *   nowIso?: string,
 *   intakeForm?: object|null,
 *   expandedOpportunityId?: string|null,
 *   oppFilter?: string,
 *   oppSort?: string
 * }} props
 * @returns {string}
 */
export function Portfolio(props = {}) {
  const activeKaizens = Array.isArray(props.activeKaizens) ? props.activeKaizens : [];
  const opportunitiesIn = Array.isArray(props.opportunities) ? props.opportunities : [];
  const catalogEntries = Array.isArray(props.catalogEntries) ? props.catalogEntries : [];
  const closedKaizens = Array.isArray(props.closedKaizens) ? props.closedKaizens : [];
  const remeasurementsByKaizenId =
    props.remeasurementsByKaizenId && typeof props.remeasurementsByKaizenId === 'object'
      ? props.remeasurementsByKaizenId
      : {};
  const nowIso = props.nowIso ?? new Date().toISOString();
  const intakeForm = props.intakeForm ?? null;
  const expandedId = props.expandedOpportunityId ?? null;
  const oppFilter = typeof props.oppFilter === 'string' && OPP_FILTER_VALUES.includes(props.oppFilter)
    ? props.oppFilter
    : 'all';
  const oppSort = typeof props.oppSort === 'string' && OPP_SORT_VALUES.includes(props.oppSort)
    ? props.oppSort
    : 'newest';

  // Apply filter.
  const filtered = oppFilter === 'all'
    ? opportunitiesIn
    : opportunitiesIn.filter((o) => o && o.status === oppFilter);

  // Apply sort.
  const sorted = [...filtered].sort((a, b) => {
    if (oppSort === 'projectType') {
      const ap = String(a.proposedProjectType ?? '');
      const bp = String(b.proposedProjectType ?? '');
      return ap.localeCompare(bp);
    }
    const ax = a.createdAt ?? '';
    const bx = b.createdAt ?? '';
    if (oppSort === 'oldest') {
      if (ax < bx) return -1;
      if (ax > bx) return 1;
      return 0;
    }
    // newest (default)
    if (ax < bx) return 1;
    if (ax > bx) return -1;
    return 0;
  });

  const intakeModal = intakeForm ? OpportunityIntakeForm(intakeForm) : '';

  return `<main class="pf-page" data-route="portfolio">
  <header class="pf-page-header">
    <h1 class="pf-page-title">${esc(PORTFOLIO_COPY.TITLE)}</h1>
    <button type="button" class="pf-new-opp" data-action="OPP_OPEN_INTAKE" data-payload='{}'>${esc(PORTFOLIO_COPY.NEW_OPP)}</button>
  </header>
  ${renderActiveKaizens(activeKaizens)}
  ${renderOpportunities(sorted, nowIso, expandedId, oppFilter, oppSort)}
  ${renderValidatedKaizens(closedKaizens, remeasurementsByKaizenId)}
  ${renderCatalogSection(catalogEntries)}
  ${intakeModal}
</main>`;
}

/**
 * Render the Validated Kaizens section (Sprint 8 P1-T4). Sorted by
 * closedAt desc.
 *
 * @param {object[]} closed
 * @param {Record<string, object>} remeasurementsByKaizenId
 * @returns {string}
 */
function renderValidatedKaizens(closed, remeasurementsByKaizenId) {
  const sorted = [...closed].sort((a, b) => {
    const ax = a?.closedAt ?? '';
    const bx = b?.closedAt ?? '';
    if (ax < bx) return 1;
    if (ax > bx) return -1;
    return 0;
  });
  if (!sorted.length) {
    return `<section class="pf-section pf-validated-kaizens">
      <h2 class="pf-section-title">Validated Kaizens</h2>
      <p class="pf-empty">${esc(PORTFOLIO_COPY.VALIDATED_EMPTY)}</p>
    </section>`;
  }
  const rows = sorted
    .map((k) => ValidatedKaizenCard({
      kaizen: k,
      remeasurement: remeasurementsByKaizenId[k.id] ?? null
    }))
    .join('\n');
  return `<section class="pf-section pf-validated-kaizens">
    <h2 class="pf-section-title">Validated Kaizens (${esc(String(sorted.length))})</h2>
    <ul class="pf-validated-list">${rows}</ul>
  </section>`;
}

/**
 * Render the Active Kaizens section.
 *
 * @param {object[]} kaizens
 * @returns {string}
 */
function renderActiveKaizens(kaizens) {
  if (!kaizens.length) {
    return `<section class="pf-section pf-active-kaizens">
      <h2 class="pf-section-title">Active Kaizens</h2>
      <p class="pf-empty">${esc(PORTFOLIO_COPY.ACTIVE_EMPTY)}</p>
    </section>`;
  }
  const cards = kaizens.map((k) => KaizenCard({ kaizen: k })).join('\n');
  return `<section class="pf-section pf-active-kaizens">
    <h2 class="pf-section-title">Active Kaizens (${esc(String(kaizens.length))})</h2>
    ${cards}
  </section>`;
}

/**
 * Render the Opportunities section with filter + sort controls.
 *
 * @param {object[]} opps
 * @param {string} nowIso
 * @param {string|null} expandedId
 * @param {string} oppFilter
 * @param {string} oppSort
 * @returns {string}
 */
function renderOpportunities(opps, nowIso, expandedId, oppFilter, oppSort) {
  const filterOptions = OPP_FILTER_VALUES
    .map((v) => {
      const selected = v === oppFilter ? 'selected' : '';
      return `<option value="${esc(v)}" ${selected}>${esc(OPP_FILTER_LABELS[v] ?? v)}</option>`;
    })
    .join('\n');
  const sortOptions = OPP_SORT_VALUES
    .map((v) => {
      const selected = v === oppSort ? 'selected' : '';
      return `<option value="${esc(v)}" ${selected}>${esc(OPP_SORT_LABELS[v] ?? v)}</option>`;
    })
    .join('\n');

  const controls = `<div class="pf-opp-controls">
    <label class="pf-opp-filter-label">Filter
      <select class="pf-opp-filter" data-action="OPP_FILTER_CHANGE" data-payload='{}'>
        ${filterOptions}
      </select>
    </label>
    <label class="pf-opp-sort-label">Sort
      <select class="pf-opp-sort" data-action="OPP_SORT_CHANGE" data-payload='{}'>
        ${sortOptions}
      </select>
    </label>
  </div>`;

  if (!opps.length) {
    return `<section class="pf-section pf-opportunities">
      <h2 class="pf-section-title">Opportunities</h2>
      ${controls}
      <p class="pf-empty">${esc(PORTFOLIO_COPY.OPPORTUNITIES_EMPTY)}</p>
    </section>`;
  }

  const rows = opps
    .map((o) => OpportunityRow({
      opportunity: o,
      nowIso,
      expanded: expandedId != null && o.id === expandedId
    }))
    .join('\n');

  return `<section class="pf-section pf-opportunities">
    <h2 class="pf-section-title">Opportunities (${esc(String(opps.length))})</h2>
    ${controls}
    <ul class="pf-opp-list">${rows}</ul>
  </section>`;
}

/**
 * Render the Standard Work Catalog section using the bucket view.
 *
 * @param {object[]} entries
 * @returns {string}
 */
function renderCatalogSection(entries) {
  return `<section class="pf-section pf-catalog">
    <h2 class="pf-section-title">Standard Work Catalog</h2>
    ${CatalogBucketView({ entries })}
  </section>`;
}

export default Portfolio;
// Re-export the OpportunityStatus so tests/pages can reach it from Portfolio symbol.
export { OpportunityStatus };
