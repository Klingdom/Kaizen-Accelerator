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
    ${actNum}
    <span class="cat-list-name">${esc(e.name ?? '')}</span>
    <span class="cat-list-bucket">${esc(e.bucket ?? '')}</span>
    <span class="cat-list-lock">${lockIcon}</span>
    <button type="button" class="cat-list-toggle" data-action="CATALOG_TOGGLE" data-payload='${payload}' ${toggleDisabled}>${esc(toggleLabel)}</button>
  </li>`;
}

export default Catalog;
