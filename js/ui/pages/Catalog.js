/**
 * Catalog page — Sprint 7 P0-T7 extension.
 *
 * Toggle between "List view" (Sprint 4 flat enable/disable) and
 * "By bucket" (3-column grouping via CatalogBucketView).
 *
 * List view (default for backward compat) — one flat list with
 * enabled/disabled toggle per entry.
 *
 * By bucket — delegates to CatalogBucketView.
 */

import { esc } from '../mount.js';
import { CatalogBucketView } from '../components/CatalogBucketView.js';

export const CATALOG_VIEW_LIST = 'list';
export const CATALOG_VIEW_BUCKET = 'bucket';

export const CATALOG_COPY = Object.freeze({
  TITLE: 'Standard Work Catalog',
  EMPTY: 'No catalog entries yet.',
  VIEW_LIST: 'List view',
  VIEW_BUCKET: 'By bucket'
});

/**
 * @param {{
 *   entries?: object[],
 *   view?: string
 * }} props
 * @returns {string}
 */
export function Catalog(props = {}) {
  const entries = Array.isArray(props.entries) ? props.entries : [];
  const view = props.view === CATALOG_VIEW_BUCKET ? CATALOG_VIEW_BUCKET : CATALOG_VIEW_LIST;

  const viewToggle = `<div class="cat-view-toggle" role="tablist">
    <button type="button" class="cat-view-btn ${view === CATALOG_VIEW_LIST ? 'cat-view-active' : ''}" data-action="CATALOG_SET_VIEW" data-payload='${esc(JSON.stringify({ view: CATALOG_VIEW_LIST }))}' aria-pressed="${view === CATALOG_VIEW_LIST}">${esc(CATALOG_COPY.VIEW_LIST)}</button>
    <button type="button" class="cat-view-btn ${view === CATALOG_VIEW_BUCKET ? 'cat-view-active' : ''}" data-action="CATALOG_SET_VIEW" data-payload='${esc(JSON.stringify({ view: CATALOG_VIEW_BUCKET }))}' aria-pressed="${view === CATALOG_VIEW_BUCKET}">${esc(CATALOG_COPY.VIEW_BUCKET)}</button>
  </div>`;

  const body = view === CATALOG_VIEW_BUCKET
    ? CatalogBucketView({ entries })
    : renderListView(entries);

  return `<main class="cat-page" data-route="catalog" data-view="${esc(view)}">
    <header class="cat-page-header">
      <h1 class="cat-page-title">${esc(CATALOG_COPY.TITLE)}</h1>
      ${viewToggle}
    </header>
    ${body}
  </main>`;
}

/**
 * Flat list view. Preserves Sprint 4 behavior.
 *
 * @param {object[]} entries
 * @returns {string}
 */
function renderListView(entries) {
  if (!entries.length) {
    return `<p class="cat-empty">${esc(CATALOG_COPY.EMPTY)}</p>`;
  }
  const rows = entries
    .slice()
    .sort((a, b) => {
      const an = a.activityNumber ?? 999;
      const bn = b.activityNumber ?? 999;
      if (an !== bn) return an - bn;
      return String(a.name ?? '').localeCompare(String(b.name ?? ''));
    })
    .map((e) => renderListRow(e))
    .join('\n');
  return `<ul class="cat-list">${rows}</ul>`;
}

function renderListRow(e) {
  const payload = esc(JSON.stringify({ catalogEntryId: e.id }));
  const lockIcon = e.isNonOptional ? '🔒' : '';
  const actNum = e.activityNumber != null
    ? `<span class="cat-list-num">#${esc(String(e.activityNumber))}</span>`
    : '';
  const enabled = e.enabledByUser !== false;
  const toggleLabel = enabled ? 'On' : 'Off';
  const toggleDisabled = e.isNonOptional ? 'disabled aria-disabled="true"' : '';
  return `<li class="cat-list-row" data-catalog-entry-id="${esc(e.id ?? '')}">
    <div class="cat-list-row-main">
      ${actNum}
      <span class="cat-list-name">${esc(e.name ?? '')}</span>
      <span class="cat-list-bucket">${esc(e.bucket ?? '')}</span>
      <span class="cat-list-lock">${lockIcon}</span>
      <button type="button" class="cat-list-toggle" data-action="CATALOG_TOGGLE" data-payload='${payload}' ${toggleDisabled}>${esc(toggleLabel)}</button>
    </div>
    ${renderEntryDetails(e)}
  </li>`;
}

/**
 * Collapsed-by-default detail block. Shows everything the seed pipeline
 * knows about the entry: duration, focus area, cadence, trigger, inputs,
 * output artifact, project-type binding, participants, and the full
 * ordered procedure steps. Pure HTML; no behavior beyond <details>.
 *
 * @param {object} e
 * @returns {string}
 */
export function renderEntryDetails(e) {
  const hasProcedure = Array.isArray(e.procedure) && e.procedure.length > 0;
  if (!hasProcedure && !hasAnyMeta(e)) return '';
  return `<details class="cat-row-detail">
    <summary class="cat-row-summary">Details${hasProcedure ? ` &middot; ${esc(String(e.procedure.length))} steps` : ''}</summary>
    ${renderMeta(e)}
    ${hasProcedure ? renderProcedure(e.procedure) : ''}
  </details>`;
}

function hasAnyMeta(e) {
  return (
    e.defaultDurationMinutes != null ||
    e.focusArea ||
    e.cadence ||
    e.trigger ||
    (Array.isArray(e.inputs) && e.inputs.length > 0) ||
    e.outputArtifact ||
    e.projectTypeBinding ||
    (Array.isArray(e.participants) && e.participants.length > 0)
  );
}

function renderMeta(e) {
  /** @type {string[]} */
  const rows = [];
  if (e.defaultDurationMinutes != null) {
    rows.push(row('Duration', `${esc(String(e.defaultDurationMinutes))} min`));
  }
  if (e.focusArea) rows.push(row('Focus area', esc(String(e.focusArea))));
  if (e.cadence) rows.push(row('Cadence', esc(String(e.cadence))));
  if (e.trigger) rows.push(row('Trigger', esc(String(e.trigger))));
  if (Array.isArray(e.inputs) && e.inputs.length) {
    rows.push(row('Inputs', esc(e.inputs.join(', '))));
  }
  if (e.outputArtifact && typeof e.outputArtifact === 'object') {
    const oa = e.outputArtifact;
    const parts = [oa.name, oa.schema, oa.required ? 'required' : 'optional']
      .filter(Boolean)
      .map((s) => esc(String(s)));
    rows.push(row('Output', parts.join(' &middot; ')));
  }
  if (e.projectTypeBinding) {
    const pt = Array.isArray(e.projectTypeBinding)
      ? e.projectTypeBinding.join(', ')
      : String(e.projectTypeBinding);
    rows.push(row('Project type', esc(pt)));
  }
  if (Array.isArray(e.participants) && e.participants.length) {
    rows.push(row('Participants', esc(e.participants.join(', '))));
  }
  if (!rows.length) return '';
  return `<dl class="cat-meta-list">${rows.join('')}</dl>`;
}

function row(label, value) {
  return `<div class="cat-meta-row"><dt>${esc(label)}</dt><dd>${value}</dd></div>`;
}

function renderProcedure(steps) {
  const items = steps.map((s) => `<li>${esc(String(s))}</li>`).join('');
  return `<ol class="cat-proc-list">${items}</ol>`;
}

export default Catalog;
