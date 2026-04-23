/**
 * Portfolio page — Sprint 7 P0-T5 + Sprint 10b (Pass A).
 *
 * The project command center. Sprint 10b removes the Catalog section (it
 * now lives solely on /#catalog) and renames "Active Kaizens" to
 * "Projects". Project cards are click-to-open; the expanded card shows
 * the full ordered standard-work step list for the project type.
 *
 * Sections:
 *   1. Projects       — list of ACTIVE (+ IN_REMEASUREMENT) Kaizens,
 *                       grouped by project-type. Each card collapses by
 *                       default; one may be expanded at a time via the
 *                       `expandedKaizenId` prop.
 *   2. Opportunities  — filterable intake list (all / intake / scored /
 *                       promoted / deferred / rejected)
 *   3. Validated Kaizens — closed projects with delta summary
 *
 * The intake form modal overlays when `intakeForm` is provided.
 */

import { esc } from '../mount.js';
import { KaizenCard } from '../components/KaizenCard.js';
import { OpportunityRow } from '../components/OpportunityRow.js';
import { OpportunityIntakeForm } from '../components/OpportunityIntakeForm.js';
import { ValidatedKaizenCard } from '../components/ValidatedKaizenCard.js';
import { OpportunityStatus } from '../../domain/types.js';

export const PORTFOLIO_COPY = Object.freeze({
  TITLE: 'Project Portfolio',
  NEW_OPP: 'New Opportunity',
  ACTIVE_EMPTY: 'No projects yet. Promote an opportunity to start a project.',
  OPPORTUNITIES_EMPTY: 'No opportunities yet. Tap New Opportunity to capture one.',
  VALIDATED_EMPTY: 'No validated Kaizens yet. Close a Kaizen to see it here.'
});

/** Project-type sub-buckets for the PROJECT column (user taxonomy 2026-04-22). */
export const PROJECT_TYPE_GROUPS = Object.freeze([
  { key: 'KAIZEN_ACCELERATOR_30D', label: '30-Day Kaizen Accelerator' },
  { key: 'KAIZEN_EVENT_90D', label: '90-Day Kaizen Event' },
  { key: 'DMAIC', label: 'DMAIC' },
  { key: 'AD_HOC', label: 'Deep Work Project Task (Ad Hoc)' }
]);

/**
 * Resolve a Kaizen's project-type group key. Falls back to AD_HOC for
 * anything that isn't explicitly one of the first three types.
 *
 * @param {object} kaizen
 * @returns {string}
 */
export function resolveProjectTypeGroup(kaizen) {
  const pt = kaizen?.projectType;
  if (pt === 'KAIZEN_ACCELERATOR_30D') return 'KAIZEN_ACCELERATOR_30D';
  if (pt === 'KAIZEN_EVENT_90D' || pt === 'KAIZEN_EVENT') return 'KAIZEN_EVENT_90D';
  if (pt === 'DMAIC') return 'DMAIC';
  return 'AD_HOC';
}

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
 *   completedStepsByKaizenId?: Record<string, object[]>,
 *   expandedKaizenId?: string|null,
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
  const completedStepsByKaizenId =
    props.completedStepsByKaizenId && typeof props.completedStepsByKaizenId === 'object'
      ? props.completedStepsByKaizenId
      : {};
  const expandedKaizenId =
    typeof props.expandedKaizenId === 'string' && props.expandedKaizenId.length > 0
      ? props.expandedKaizenId
      : null;
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
  ${renderProjects(activeKaizens, catalogEntries, completedStepsByKaizenId, expandedKaizenId)}
  ${renderOpportunities(sorted, nowIso, expandedId, oppFilter, oppSort)}
  ${renderValidatedKaizens(closedKaizens, remeasurementsByKaizenId)}
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
 * Render the Projects section (Sprint 10b — renamed from "Active Kaizens").
 *
 * Groups by project-type, renders KaizenCard for each, honouring
 * `expandedKaizenId` so exactly one card is expanded at a time.
 *
 * @param {object[]} kaizens
 * @param {object[]} catalog
 * @param {Record<string, object[]>} completedStepsByKaizenId
 * @param {string|null} expandedKaizenId
 * @returns {string}
 */
function renderProjects(kaizens, catalog, completedStepsByKaizenId, expandedKaizenId) {
  if (!kaizens.length) {
    return `<section class="pf-section pf-active-kaizens">
      <h2 class="pf-section-title">Projects</h2>
      <p class="pf-empty">${esc(PORTFOLIO_COPY.ACTIVE_EMPTY)}</p>
    </section>`;
  }

  /** @type {Record<string, object[]>} */
  const grouped = { KAIZEN_ACCELERATOR_30D: [], KAIZEN_EVENT_90D: [], DMAIC: [], AD_HOC: [] };
  for (const k of kaizens) grouped[resolveProjectTypeGroup(k)].push(k);

  const groupBlocks = PROJECT_TYPE_GROUPS
    .map((g) => {
      const list = grouped[g.key];
      if (!list.length) return '';
      const cards = list
        .map((k) => {
          const rows = Array.isArray(completedStepsByKaizenId[k.id])
            ? completedStepsByKaizenId[k.id]
            : [];
          const completedCatalogIds = rows.map((r) => r.catalogEntryId);
          /** @type {Record<string, string>} */
          const completedStepTimestamps = {};
          for (const r of rows) {
            if (r && r.catalogEntryId && r.completedAt) {
              completedStepTimestamps[r.catalogEntryId] = r.completedAt;
            }
          }
          return KaizenCard({
            kaizen: k,
            catalog,
            completedCatalogIds,
            completedStepTimestamps,
            isExpanded: expandedKaizenId != null && k.id === expandedKaizenId
          });
        })
        .join('\n');
      return `<div class="pf-pt-group" data-project-type="${esc(g.key)}">
        <h3 class="pf-pt-group-title">${esc(g.label)} (${esc(String(list.length))})</h3>
        ${cards}
      </div>`;
    })
    .filter(Boolean)
    .join('\n');

  return `<section class="pf-section pf-active-kaizens">
    <h2 class="pf-section-title">Projects (${esc(String(kaizens.length))})</h2>
    ${groupBlocks}
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

export default Portfolio;
// Re-export the OpportunityStatus so tests/pages can reach it from Portfolio symbol.
export { OpportunityStatus };
