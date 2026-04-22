/**
 * CatalogBucketView — Sprint 7 P0-T7.
 *
 * Pure render. 3-column layout grouping CatalogEntries by bucket:
 *   PROJECT / COMMUNICATION / CI
 *
 * Each column header shows the bucket name + count. Each entry card
 * shows: name, activity number (if any), non-optional lock icon,
 * dependsOn chip, projectType binding chip, isOpen/Close toggle
 * (uses the existing CATALOG_TOGGLE action wired in Sprint 4).
 *
 * Columns scroll independently. Empty buckets render a muted hint.
 */

import { esc } from '../mount.js';
import { Bucket } from '../../domain/types.js';
import { renderEntryDetails } from '../pages/Catalog.js';

export const BUCKET_ORDER = Object.freeze([
  Bucket.PROJECT,
  Bucket.COMMUNICATION,
  Bucket.CI
]);

export const BUCKET_LABELS = Object.freeze({
  PROJECT: 'Project',
  COMMUNICATION: 'Communication',
  CI: 'Continuous Improvement'
});

/**
 * Project-type sub-buckets inside the PROJECT column (user taxonomy
 * 2026-04-22). Ordered: 30-Day Accelerator, 90-Day Kaizen, DMAIC, Ad Hoc.
 */
export const PROJECT_SUBBUCKETS = Object.freeze([
  { key: 'KAIZEN_ACCELERATOR_30D', label: '30-Day Kaizen Accelerator' },
  { key: 'KAIZEN_EVENT_90D', label: '90-Day Kaizen Event' },
  { key: 'DMAIC', label: 'DMAIC' },
  { key: 'AD_HOC', label: 'Deep Work Project Task (Ad Hoc)' }
]);

/**
 * Decide which PROJECT sub-bucket a catalog entry belongs to. Entries
 * with a projectTypeBinding string/array are placed in the matching
 * group; entries with null binding (universal project work) fall into
 * AD_HOC.
 *
 * @param {object} entry
 * @returns {string}
 */
export function resolveProjectSubbucket(entry) {
  const pt = entry?.projectTypeBinding;
  const keys = Array.isArray(pt) ? pt : pt ? [pt] : [];
  // First match wins in PROJECT_SUBBUCKETS order (Accelerator > Kaizen > DMAIC > AD_HOC).
  for (const group of PROJECT_SUBBUCKETS) {
    if (group.key === 'AD_HOC') continue;
    if (keys.includes(group.key)) return group.key;
    if (group.key === 'KAIZEN_EVENT_90D' && keys.includes('KAIZEN_EVENT')) {
      return 'KAIZEN_EVENT_90D';
    }
  }
  return 'AD_HOC';
}

/**
 * Group catalog entries into a {PROJECT: [], COMMUNICATION: [], CI: []}
 * map. Entries with unknown buckets are dropped (should not occur in the
 * seeded catalog).
 *
 * @param {object[]} entries
 * @returns {Record<string, object[]>}
 */
export function groupByBucket(entries) {
  /** @type {Record<string, object[]>} */
  const out = { PROJECT: [], COMMUNICATION: [], CI: [] };
  if (!Array.isArray(entries)) return out;
  for (const e of entries) {
    if (!e || typeof e !== 'object') continue;
    const b = e.bucket;
    if (!out[b]) continue;
    out[b].push(e);
  }
  // Stable sort: non-null activityNumber asc first, then name asc.
  for (const k of Object.keys(out)) {
    out[k].sort((a, b) => {
      const an = a.activityNumber ?? 999;
      const bn = b.activityNumber ?? 999;
      if (an !== bn) return an - bn;
      return String(a.name ?? '').localeCompare(String(b.name ?? ''));
    });
  }
  return out;
}

/**
 * @param {{entries: object[]}} props
 * @returns {string}
 */
export function CatalogBucketView(props = {}) {
  const entries = Array.isArray(props.entries) ? props.entries : [];
  const grouped = groupByBucket(entries);
  const columns = BUCKET_ORDER.map((bucket) => {
    const list = grouped[bucket] ?? [];
    const body = bucket === Bucket.PROJECT
      ? renderProjectColumnBody(list)
      : renderFlatList(list);
    return `<section class="cat-bucket-column cat-bucket-${esc(bucket.toLowerCase())}" data-bucket="${esc(bucket)}">
      <header class="cat-bucket-header">
        <h3 class="cat-bucket-title">${esc(BUCKET_LABELS[bucket] ?? bucket)}</h3>
        <span class="cat-bucket-count" data-bucket-count="${esc(bucket)}">(${esc(String(list.length))})</span>
      </header>
      ${body}
    </section>`;
  }).join('\n');

  return `<section class="cat-bucket-view" data-view="bucket">
    <div class="cat-bucket-grid">
      ${columns}
    </div>
  </section>`;
}

/**
 * Flat list (used by COMMUNICATION and CI columns).
 *
 * @param {object[]} list
 * @returns {string}
 */
function renderFlatList(list) {
  if (!list.length) return `<p class="cat-bucket-empty">No entries.</p>`;
  return `<ul class="cat-bucket-list">${list.map((e) => renderCard(e)).join('\n')}</ul>`;
}

/**
 * Project column rendered with 4 sub-bucket groups (30-Day Accelerator,
 * 90-Day Kaizen Event, DMAIC, Ad Hoc). Empty groups still render their
 * heading so the user sees the complete project-type vocabulary.
 *
 * @param {object[]} list
 * @returns {string}
 */
function renderProjectColumnBody(list) {
  /** @type {Record<string, object[]>} */
  const sub = { KAIZEN_ACCELERATOR_30D: [], KAIZEN_EVENT_90D: [], DMAIC: [], AD_HOC: [] };
  for (const e of list) sub[resolveProjectSubbucket(e)].push(e);

  const groups = PROJECT_SUBBUCKETS.map((g) => {
    const items = sub[g.key];
    const body = items.length
      ? `<ul class="cat-bucket-list">${items.map((e) => renderCard(e)).join('\n')}</ul>`
      : `<p class="cat-subbucket-empty">No entries.</p>`;
    return `<div class="cat-subbucket" data-project-type="${esc(g.key)}">
      <h4 class="cat-subbucket-title">${esc(g.label)} <span class="cat-subbucket-count">(${esc(String(items.length))})</span></h4>
      ${body}
    </div>`;
  }).join('\n');

  return `<div class="cat-project-subbuckets">${groups}</div>`;
}

/**
 * Render a single CatalogEntry card.
 *
 * @param {object} e
 * @returns {string}
 */
function renderCard(e) {
  const id = esc(e.id ?? '');
  const actNum = e.activityNumber != null
    ? `<span class="cat-card-num">#${esc(String(e.activityNumber))}</span>`
    : '';
  const lock = e.isNonOptional
    ? `<span class="cat-card-lock" title="Non-optional — cannot be disabled" aria-label="Non-optional">🔒</span>`
    : '';
  const dep = Array.isArray(e.dependsOn) && e.dependsOn.length > 0
    ? `<span class="cat-card-chip cat-card-dep">depends ${esc(String(e.dependsOn.length))}</span>`
    : '';
  const ptb = e.projectTypeBinding != null
    ? `<span class="cat-card-chip cat-card-pt">${esc(
        Array.isArray(e.projectTypeBinding)
          ? e.projectTypeBinding.join(', ')
          : String(e.projectTypeBinding)
      )}</span>`
    : '';
  const payload = esc(JSON.stringify({ catalogEntryId: e.id }));
  const toggleDisabled = e.isNonOptional ? 'disabled aria-disabled="true"' : '';
  const enabled = e.enabledByUser !== false;
  const toggleLabel = enabled ? 'On' : 'Off';
  const toggleCls = enabled ? 'cat-card-toggle-on' : 'cat-card-toggle-off';

  return `<li class="cat-card" data-catalog-entry-id="${id}" data-bucket="${esc(e.bucket ?? '')}">
    <div class="cat-card-main">
      ${actNum}
      <span class="cat-card-name">${esc(e.name ?? '')}</span>
      ${lock}
    </div>
    <div class="cat-card-meta">
      ${ptb}
      ${dep}
      <button type="button" class="cat-card-toggle ${toggleCls}" data-action="CATALOG_TOGGLE" data-payload='${payload}' ${toggleDisabled}>${esc(toggleLabel)}</button>
    </div>
    ${renderEntryDetails(e)}
  </li>`;
}

export default CatalogBucketView;
