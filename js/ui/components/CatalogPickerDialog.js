/**
 * CatalogPickerDialog — Iter 36 / Phase 3 click-empty-time insertion picker.
 *
 * Opened when a user clicks an empty time slot on the TodayGrid. Shows a
 * searchable, bucket-filtered list of catalog entries. Selecting an entry
 * dispatches INSERT_ACTIVITY_AT_TIME with { catalogEntryId, startMinutes }.
 *
 * Exclusions (per AC16/AC17):
 *   - recovery_lunch  — capacity-neutral, composer-managed
 *   - Protected entries: cer_daily_standup and any entry whose id is in
 *     PROTECTED_CATALOG_IDS (from editMode.js)
 *
 * Visual treatment mirrors BlockDetailDialog (Iter 30): a centered panel on
 * a backdrop, aria-modal="true", role="dialog", aria-labelledby.
 *
 * Props:
 *   catalog:        object[]  — full catalog array (CatalogEntry[])
 *   startMinutes:   number    — clicked time slot in minutes-of-day
 *   search:         string    — live search query
 *   bucketFilter:   string    — 'ALL' | 'PROJECT' | 'COMMUNICATION' | 'CI'
 *
 * Actions dispatched (via data-action / data-payload):
 *   INSERT_ACTIVITY_AT_TIME   { catalogEntryId, startMinutes }
 *   CLOSE_CATALOG_PICKER      {}
 *   CPD_SEARCH                {}  (input event — value read from input.value)
 *   CPD_BUCKET_FILTER         { bucket }
 *
 * §6.5 boundary: js/ui/components/ — frontend only.
 */

import { esc } from '../mount.js';
import { PROTECTED_CATALOG_IDS } from '../editMode.js';

/**
 * Catalog entry ids that are NEVER insertable from the picker.
 * Extends the protected-catalog-ids with the lunch entry.
 */
const NON_INSERTABLE_IDS = new Set([
  'recovery_lunch',
  ...PROTECTED_CATALOG_IDS
]);

const BUCKET_ORDER = Object.freeze(['ALL', 'PROJECT', 'COMMUNICATION', 'CI']);

const BUCKET_LABELS = Object.freeze({
  ALL: 'All',
  PROJECT: 'Project Work',
  COMMUNICATION: 'Communication',
  CI: 'Continuous Improvement'
});

/**
 * Format minutes-of-day as HH:MM display string.
 *
 * @param {number} minutes
 * @returns {string}
 */
function formatHHMM(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Filter and sort catalog entries for the picker.
 *
 * Exclusions:
 *   - Non-insertable (lunch + protected)
 *   - enabledByUser === false
 *   - bucket not in PROJECT/COMMUNICATION/CI (capacity-neutral rows have no bucket)
 *   - search query if present (name / id / activityNumber)
 *   - bucketFilter if not 'ALL'
 *
 * @param {object[]} catalog
 * @param {{ search?: string, bucketFilter?: string }} opts
 * @returns {object[]}
 */
export function filterPickerCatalog(catalog, opts = {}) {
  if (!Array.isArray(catalog)) return [];
  const q = String(opts.search ?? '').trim().toLowerCase();
  const bf = (opts.bucketFilter ?? 'ALL').toUpperCase();

  return catalog.filter((e) => {
    if (!e || typeof e !== 'object') return false;
    // Exclude non-insertable entries.
    if (NON_INSERTABLE_IDS.has(e.id)) return false;
    // Exclude entries the user has disabled.
    if (e.enabledByUser === false) return false;
    // Must have a standard bucket (excludes recovery_lunch via null bucket).
    const bucket = e.bucket ?? null;
    if (bucket !== 'PROJECT' && bucket !== 'COMMUNICATION' && bucket !== 'CI') return false;
    // Bucket filter.
    if (bf !== 'ALL' && bucket !== bf) return false;
    // Search.
    if (q) {
      const hay = [
        e.name ?? '',
        e.id ?? '',
        e.activityNumber != null ? `#${e.activityNumber}` : '',
        Array.isArray(e.procedure) ? e.procedure.join(' ') : (e.procedure ?? '')
      ].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }).sort((a, b) => {
    // Sort by activityNumber asc, then name asc.
    const an = a.activityNumber ?? 999;
    const bn = b.activityNumber ?? 999;
    if (an !== bn) return an - bn;
    return String(a.name ?? '').localeCompare(String(b.name ?? ''));
  });
}

/**
 * Render a single catalog entry card in the picker list.
 *
 * @param {object} entry
 * @param {number} startMinutes
 * @returns {string}
 */
function renderPickerCard(entry, startMinutes) {
  const id = entry.id ?? '';
  const name = entry.name ?? id;
  const dur = entry.defaultDurationMinutes ?? 30;
  const bucket = entry.bucket ?? '';
  const actNum = entry.activityNumber != null
    ? `<span class="cpd-card-num">#${esc(String(entry.activityNumber))}</span>`
    : '';
  const durationLabel = `<span class="cpd-card-dur">${esc(String(dur))}m</span>`;
  const bucketChipClass = bucket === 'PROJECT'
    ? 'chip-project'
    : bucket === 'COMMUNICATION'
      ? 'chip-communication'
      : bucket === 'CI'
        ? 'chip-ci'
        : 'chip-unknown';
  const bucketChip = `<span class="cpd-card-bucket ${esc(bucketChipClass)}">${esc(BUCKET_LABELS[bucket] ?? bucket)}</span>`;

  const payload = esc(JSON.stringify({ catalogEntryId: id, startMinutes }));

  return `<li class="cpd-card" data-catalog-entry-id="${esc(id)}" data-bucket="${esc(bucket)}">
    <button
      type="button"
      class="cpd-card-btn"
      data-action="INSERT_ACTIVITY_AT_TIME"
      data-payload='${payload}'
      aria-label="${esc(`Insert ${name}, ${dur} minutes`)}"
    >
      <span class="cpd-card-head">
        ${actNum}
        <span class="cpd-card-name">${esc(name)}</span>
      </span>
      <span class="cpd-card-meta">
        ${durationLabel}
        ${bucketChip}
      </span>
    </button>
  </li>`;
}

/**
 * Render the bucket filter pill row.
 *
 * @param {string} current
 * @returns {string}
 */
function renderBucketFilterRow(current) {
  const pills = BUCKET_ORDER.map((b) => {
    const active = (current ?? 'ALL') === b ? 'active' : '';
    const payload = esc(JSON.stringify({ bucket: b }));
    return `<button
      type="button"
      class="cpd-filter-pill ${active}"
      data-action="CPD_BUCKET_FILTER"
      data-payload='${payload}'
      aria-pressed="${active ? 'true' : 'false'}"
    >${esc(BUCKET_LABELS[b] ?? b)}</button>`;
  }).join('');
  return `<div class="cpd-filter-row" role="group" aria-label="Filter by bucket">${pills}</div>`;
}

/**
 * CatalogPickerDialog — pure component.
 *
 * @param {{
 *   catalog?:      object[],
 *   startMinutes?: number,
 *   search?:       string,
 *   bucketFilter?: string
 * }} [props]
 * @returns {string}
 */
export function CatalogPickerDialog(props = {}) {
  const catalog = Array.isArray(props.catalog) ? props.catalog : [];
  const startMinutes = Number.isFinite(props.startMinutes) ? props.startMinutes : 0;
  const search = typeof props.search === 'string' ? props.search : '';
  const bucketFilter = typeof props.bucketFilter === 'string' ? props.bucketFilter : 'ALL';

  const filtered = filterPickerCatalog(catalog, { search, bucketFilter });

  const timeLabel = formatHHMM(startMinutes);
  const closePayload = esc(JSON.stringify({}));
  const searchPayload = '{}';

  const listHtml = filtered.length === 0
    ? `<p class="cpd-empty">No matching catalog entries.</p>`
    : `<ul class="cpd-list">${filtered.map((e) => renderPickerCard(e, startMinutes)).join('')}</ul>`;

  return `<section
  class="cpd-modal"
  role="dialog"
  aria-modal="true"
  aria-labelledby="cpd-title"
  data-start-minutes="${startMinutes}"
>
  <div class="cpd-backdrop" data-action="CLOSE_CATALOG_PICKER" data-payload='${closePayload}' aria-hidden="true"></div>
  <div class="cpd-panel">
    <header class="cpd-header">
      <h2 class="cpd-title" id="cpd-title">Add activity at ${esc(timeLabel)}</h2>
      <button
        type="button"
        class="cpd-close-btn"
        data-action="CLOSE_CATALOG_PICKER"
        data-payload='${closePayload}'
        aria-label="Close catalog picker"
      >&times;</button>
    </header>
    <div class="cpd-body">
      <div class="cpd-search-row">
        <input
          type="search"
          class="cpd-search-input"
          placeholder="Search catalog..."
          value="${esc(search)}"
          data-action="CPD_SEARCH"
          data-payload='${esc(searchPayload)}'
          aria-label="Search catalog"
        />
      </div>
      ${renderBucketFilterRow(bucketFilter)}
      <div class="cpd-results">
        ${listHtml}
      </div>
    </div>
  </div>
</section>`;
}

export default CatalogPickerDialog;
