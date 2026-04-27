/**
 * InsightsPortfolio — E14 / C-PM-2.
 *
 * Validated Kaizen analytics page rendered at `/#insights/portfolio`.
 * Pure string-template render; no JSX, no virtual DOM. Consumes selectors
 * from `js/services/validatedKaizenSelectors.js`.
 *
 * Exported default: `InsightsPortfolio(props)`.
 *
 * TODO(E15): surface `remeasurement.statisticallySignificant` badge once
 *   the statistical-validation flag ships.
 */

import { esc } from '../mount.js';
import {
  isValidatedKaizen,
  summarizeValidated,
  filterValidated,
  kaizensToCsv,
  parseFilterQuery,
  serializeFilterQuery
} from '../../services/validatedKaizenSelectors.js';

// ---------------------------------------------------------------------------
// Copy strings (AC2 / spec §3 — placed next to VALIDATED_EMPTY in Portfolio)
// ---------------------------------------------------------------------------

export const INSIGHTS_PORTFOLIO_COPY = Object.freeze({
  INSIGHTS_PORTFOLIO_TITLE: 'Validated Kaizen Portfolio',
  INSIGHTS_PORTFOLIO_EMPTY: 'No Validated Kaizens match these filters yet.',
  INSIGHTS_PORTFOLIO_EMPTY_UNIVERSE: 'No Validated Kaizens yet — close one with SUCCESS or PARTIAL to see it here.',
  INSIGHTS_PORTFOLIO_EXPORT_BUTTON: 'Export CSV',
  INSIGHTS_PORTFOLIO_SUM_LABEL: 'Total Annual Benefits:'
});

// Project-type display labels (mirrors Portfolio.js PROJECT_TYPE_GROUPS)
const PROJECT_TYPE_LABELS = Object.freeze({
  KAIZEN_ACCELERATOR_30D: '30-Day Accelerator',
  KAIZEN_EVENT_90D: '90-Day Event',
  DMAIC: 'DMAIC',
  AD_HOC: 'Ad Hoc'
});

const ALL_PROJECT_TYPES = [
  'KAIZEN_ACCELERATOR_30D',
  'KAIZEN_EVENT_90D',
  'DMAIC',
  'AD_HOC'
];

// ---------------------------------------------------------------------------
// Currency formatter (AC spec §5)
// ---------------------------------------------------------------------------

function formatCurrency(n) {
  if (typeof n !== 'number' || !Number.isFinite(n)) return '$0';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(n);
  } catch (_) {
    // R4 fallback for environments without Intl currency support
    return '$' + Math.round(n).toLocaleString('en-US');
  }
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

/**
 * Render the Insights Portfolio analytics page.
 *
 * @param {{
 *   kaizens?: object[],
 *   remeasurementsByKaizenId?: Record<string, object>,
 *   baselinesByKaizenId?: Record<string, object>,
 *   nowIso?: string,
 *   locationHash?: string
 * }} props
 * @returns {string}
 */
export function InsightsPortfolio(props = {}) {
  const kaizens = Array.isArray(props.kaizens) ? props.kaizens : [];
  const rmMap =
    props.remeasurementsByKaizenId && typeof props.remeasurementsByKaizenId === 'object'
      ? props.remeasurementsByKaizenId
      : {};
  const blMap =
    props.baselinesByKaizenId && typeof props.baselinesByKaizenId === 'object'
      ? props.baselinesByKaizenId
      : {};
  const nowIso = props.nowIso ?? new Date().toISOString();
  // locationHash is injected by renderApp; falls back to '' for tests
  const locationHash = typeof props.locationHash === 'string' ? props.locationHash : '';

  // Parse filter state from URL hash query string (AC6)
  const filterSet = parseFilterQuery(locationHash);

  // Universe summary (ignores filters — spec §5)
  const summary = summarizeValidated(kaizens, rmMap);

  // Filtered + sorted rows
  const visibleRows = filterValidated(kaizens, rmMap, filterSet);

  // Determine if any validated kaizen has a non-null lead (Lead control visibility)
  const hasAnyLead = kaizens.some((k) => {
    const rm = rmMap[k.id] ?? null;
    return isValidatedKaizen(k, rm) && k.implementationLeadUserId != null;
  });

  // Collect distinct lead user IDs for the Lead select
  const leadIds = [];
  for (const k of kaizens) {
    const rm = rmMap[k.id] ?? null;
    if (isValidatedKaizen(k, rm) && k.implementationLeadUserId != null) {
      if (!leadIds.includes(k.implementationLeadUserId)) {
        leadIds.push(k.implementationLeadUserId);
      }
    }
  }

  // Today date for CSV filename
  const todayDate = nowIso.slice(0, 10);

  const C = INSIGHTS_PORTFOLIO_COPY;

  return `<main class="ip-page" data-route="insights" data-sub="portfolio">
  <header class="ip-header">
    <h1 class="ip-title">${esc(C.INSIGHTS_PORTFOLIO_TITLE)}</h1>
    <div class="ip-counts">
      <span class="ip-count-chip">Validated: ${esc(String(summary.count))}${visibleRows.length !== summary.count ? ` &middot; Showing ${esc(String(visibleRows.length))}` : ''}</span>
      <span class="ip-benefits-chip">${esc(C.INSIGHTS_PORTFOLIO_SUM_LABEL)} ${esc(formatCurrency(summary.totalBenefitsDollars))}</span>
    </div>
    ${renderFilterControls(filterSet, hasAnyLead, leadIds)}
    <div class="ip-actions">
      <button type="button" class="ip-reset-btn" data-action="IP_RESET_FILTERS" data-payload='{}'>Reset filters</button>
      <button type="button" class="ip-export-btn" data-action="IP_EXPORT_CSV" data-payload='{"todayDate":"${esc(todayDate)}"}'>
        ${esc(C.INSIGHTS_PORTFOLIO_EXPORT_BUTTON)}
      </button>
    </div>
  </header>
  ${renderBody(visibleRows, summary, blMap, rmMap)}
</main>`;
}

// ---------------------------------------------------------------------------
// Filter controls
// ---------------------------------------------------------------------------

function renderFilterControls(filterSet, hasAnyLead, leadIds) {
  const ckSuccess = filterSet.closeKinds.has('SUCCESS');
  const ckPartial = filterSet.closeKinds.has('PARTIAL');

  const closeKindToggles = `
    <div class="ip-filter-group" role="group" aria-label="Close kind filter">
      <button type="button"
        class="ip-toggle${ckSuccess ? ' ip-toggle--on' : ''}"
        aria-pressed="${ckSuccess ? 'true' : 'false'}"
        data-action="IP_TOGGLE_CLOSE_KIND"
        data-payload='{"kind":"SUCCESS"}'>SUCCESS</button>
      <button type="button"
        class="ip-toggle${ckPartial ? ' ip-toggle--on' : ''}"
        aria-pressed="${ckPartial ? 'true' : 'false'}"
        data-action="IP_TOGGLE_CLOSE_KIND"
        data-payload='{"kind":"PARTIAL"}'>PARTIAL</button>
    </div>`;

  const projectTypeToggles = ALL_PROJECT_TYPES.map((pt) => {
    const on = filterSet.projectTypes.has(pt);
    const label = PROJECT_TYPE_LABELS[pt] ?? pt;
    return `<button type="button"
        class="ip-toggle${on ? ' ip-toggle--on' : ''}"
        aria-pressed="${on ? 'true' : 'false'}"
        data-action="IP_TOGGLE_PROJECT_TYPE"
        data-payload='{"projectType":"${esc(pt)}"}'>
        ${esc(label)}
      </button>`;
  }).join('');

  const projectTypeGroup = `
    <div class="ip-filter-group" role="group" aria-label="Project type filter">
      ${projectTypeToggles}
    </div>`;

  const leadControl = hasAnyLead ? `
    <div class="ip-filter-group ip-lead-filter">
      <label for="ip-lead-select" class="ip-filter-label">Lead:</label>
      <select id="ip-lead-select" class="ip-lead-select" data-action="IP_CHANGE_LEAD" data-payload='{}'>
        <option value="">All</option>
        ${leadIds.map((id) => `<option value="${esc(id)}"${filterSet.leadUserId === id ? ' selected' : ''}>${esc(id)}</option>`).join('')}
      </select>
    </div>` : '';

  return `<div class="ip-filters">
    ${closeKindToggles}
    ${projectTypeGroup}
    ${leadControl}
  </div>`;
}

// ---------------------------------------------------------------------------
// Table / empty-state body
// ---------------------------------------------------------------------------

function renderBody(visibleRows, summary, blMap, rmMap) {
  if (summary.count === 0) {
    return `<div class="ip-empty" role="status">
      <p class="ip-empty-msg">${esc(INSIGHTS_PORTFOLIO_COPY.INSIGHTS_PORTFOLIO_EMPTY_UNIVERSE)}</p>
    </div>`;
  }

  if (visibleRows.length === 0) {
    return `<div class="ip-empty" role="status">
      <p class="ip-empty-msg">${esc(INSIGHTS_PORTFOLIO_COPY.INSIGHTS_PORTFOLIO_EMPTY)}</p>
    </div>`;
  }

  const rows = visibleRows.map((k) => renderRow(k, blMap, rmMap)).join('\n');
  return `<div class="ip-table-wrapper" role="region" aria-label="Validated Kaizens">
    <table class="ip-table">
      <thead>
        <tr class="ip-thead-row">
          <th scope="col">Closed</th>
          <th scope="col">Title</th>
          <th scope="col">Type</th>
          <th scope="col">Close</th>
          <th scope="col">Baseline</th>
          <th scope="col">Remeas.</th>
          <th scope="col">Delta%</th>
          <th scope="col">Cost</th>
          <th scope="col">Ann. Benefit</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  </div>`;
}

function renderRow(k, blMap, rmMap) {
  const rm = rmMap[k.id] ?? null;
  const bl = blMap[k.id] ?? null;

  const closedDate = k.closedAt ? k.closedAt.slice(0, 10) : '—';
  const ptLabel = PROJECT_TYPE_LABELS[k.projectType] ?? esc(String(k.projectType ?? '—'));
  const baselineVal = bl && bl.value != null ? esc(String(bl.value)) : '—';
  const remeasVal = rm && rm.remeasurementValue != null ? esc(String(rm.remeasurementValue)) : '—';
  const deltaPct = rm && rm.deltaPercent != null
    ? esc(String(rm.deltaPercent >= 0 ? '+' + rm.deltaPercent : rm.deltaPercent) + '%')
    : '—';
  const cost = k.implementationCostDollars != null
    ? esc(formatCurrency(k.implementationCostDollars))
    : '—';
  const benefit = k.annualBenefitsDollars != null
    ? esc(formatCurrency(k.annualBenefitsDollars))
    : '—';

  // Finance-signed tag (AC10): DMAIC only, last roiProjections entry
  let financeTag = '';
  if (
    k.projectType === 'DMAIC' &&
    Array.isArray(k.roiProjections) &&
    k.roiProjections.length > 0
  ) {
    const last = k.roiProjections[k.roiProjections.length - 1];
    if (last && last.financePartnerUserId != null) {
      financeTag = `<span class="ip-finance-tag">Finance-signed</span>`;
    }
  }

  return `<tr class="ip-row" data-kaizen-id="${esc(k.id)}" data-close-kind="${esc(k.closeKind)}">
    <td class="ip-cell ip-cell-date"><time datetime="${esc(k.closedAt ?? '')}">${esc(closedDate)}</time></td>
    <td class="ip-cell ip-cell-title">${esc(k.title ?? 'Untitled')}${financeTag}</td>
    <td class="ip-cell ip-cell-type">${esc(ptLabel)}</td>
    <td class="ip-cell ip-cell-closekind"><span class="ip-ck-badge ip-ck-${esc((k.closeKind ?? '').toLowerCase())}">${esc(k.closeKind ?? '')}</span></td>
    <td class="ip-cell ip-cell-baseline">${baselineVal}</td>
    <td class="ip-cell ip-cell-remeas">${remeasVal}</td>
    <td class="ip-cell ip-cell-delta">${deltaPct}</td>
    <td class="ip-cell ip-cell-cost">${cost}</td>
    <td class="ip-cell ip-cell-benefit">${benefit}</td>
  </tr>`;
}

// ---------------------------------------------------------------------------
// CSV export helper (called by the action handler in app.js)
// ---------------------------------------------------------------------------

/**
 * Build the CSV string for the currently visible rows and trigger a browser
 * download. Safe to call from event handlers; DOM-dependent (no-op in Node).
 *
 * @param {object[]} visibleRows
 * @param {Record<string, object>} baselinesByKaizenId
 * @param {Record<string, object>} remeasurementsByKaizenId
 * @param {string} todayDate — YYYY-MM-DD
 */
export function triggerCsvExport(visibleRows, baselinesByKaizenId, remeasurementsByKaizenId, todayDate) {
  /* istanbul ignore next — browser-only Blob path */
  if (typeof URL === 'undefined' || typeof document === 'undefined') return;
  const csv = kaizensToCsv(visibleRows, baselinesByKaizenId, remeasurementsByKaizenId);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `validated-kaizens-${todayDate}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default InsightsPortfolio;
