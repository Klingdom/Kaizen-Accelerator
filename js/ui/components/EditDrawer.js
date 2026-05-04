/**
 * EditDrawer — Sprint 12 right-side slide-over drawer for swapping
 * catalog entries into the Today schedule.
 *
 * Pure render. Returns an HTML string. All interactivity is data-action /
 * data-payload wired into the handler registry in `app.js`.
 *
 * Layout:
 *
 *   ┌─────────────────── Swap Activities ─ ×
 *   │
 *   │  [search input.................]
 *   │
 *   │  ▽ Project Work (N)
 *   │     [All ▸ 30-Day ▸ 90-Day ▸ DMAIC ▸ Ad Hoc]
 *   │     [card] [card] [card] ...
 *   │
 *   │  ▽ Communication (N)
 *   │     [card] [card] ...
 *   │
 *   │  ▽ Continuous Improvement (N)
 *   │     [card] [card] ...
 *   │
 *   ├─────────────────── Commit | Cancel | Undo
 *
 * Props:
 *   catalog:           array of CatalogEntry
 *   activities:        current edit-mode activities (for "In today" + delta)
 *   selectedActivityId: string|null|'__new__' — the slot user is swapping
 *   search:            string
 *   projectTypeFilter: string ('all' | KAIZEN_ACCELERATOR_30D | ...)
 *   expandedBuckets:   array<'PROJECT' | 'COMMUNICATION' | 'CI'>
 *   undoCount:         number (Undo button disabled when 0)
 *   violations:        [{bucket, code, actual, bound}] — highlights buckets
 */

import { esc } from '../mount.js';
import {
  filterCatalog,
  isInToday,
  durationDelta,
  isProtectedBlock
} from '../editMode.js';

const BUCKET_ORDER = Object.freeze(['PROJECT', 'COMMUNICATION', 'CI']);

const BUCKET_LABELS = Object.freeze({
  PROJECT: 'Project Work',
  COMMUNICATION: 'Communication',
  CI: 'Continuous Improvement'
});

const PROJECT_TYPE_OPTIONS = Object.freeze([
  { key: 'all', label: 'All' },
  { key: 'KAIZEN_ACCELERATOR_30D', label: '30-Day Accelerator' },
  { key: 'KAIZEN_EVENT_90D', label: '90-Day Kaizen' },
  { key: 'DMAIC', label: 'DMAIC' },
  { key: 'AD_HOC', label: 'Ad Hoc' }
]);

/**
 * Resolve the slot the user has selected (if any) — used to compute
 * duration-delta chips on each catalog card.
 *
 * @param {object[]} activities
 * @param {string|null|undefined} selectedActivityId
 * @returns {object|null}
 */
function resolveSelected(activities, selectedActivityId) {
  if (!Array.isArray(activities)) return null;
  if (!selectedActivityId || selectedActivityId === '__new__') return null;
  return activities.find((a) => a && a.id === selectedActivityId) ?? null;
}

/**
 * Render one catalog card inside a bucket panel.
 *
 * @param {object} entry
 * @param {object} ctx
 * @returns {string}
 */
function renderCatalogCard(entry, ctx) {
  const id = entry.id ?? '';
  const payload = esc(JSON.stringify({ catalogEntryId: id }));
  const actNum = entry.activityNumber != null
    ? `<span class="edc-num">#${esc(String(entry.activityNumber))}</span>`
    : '';
  const duration = entry.defaultDurationMinutes ?? 0;
  const durationChip = `<span class="edc-duration">${esc(String(duration))}m</span>`;
  const cadence = typeof entry.cadence === 'string' && entry.cadence.length > 0
    ? `<span class="edc-chip edc-cadence">${esc(entry.cadence)}</span>`
    : '';
  const pt = entry.projectTypeBinding;
  const ptLabel = Array.isArray(pt) ? pt.join(', ') : (pt ?? '');
  const ptChip = ptLabel
    ? `<span class="edc-chip edc-pt">${esc(ptLabel)}</span>`
    : '';
  const inToday = isInToday(ctx.activities, id)
    ? `<span class="edc-in-today" title="Already in today's schedule">In today</span>`
    : '';
  const delta = ctx.selectedSlot ? durationDelta(ctx.selectedSlot, entry) : 0;
  const deltaChip = ctx.selectedSlot
    ? `<span class="edc-delta ${delta > 0 ? 'edc-delta-plus' : delta < 0 ? 'edc-delta-minus' : 'edc-delta-zero'}">${
        delta > 0 ? '+' : ''
      }${esc(String(delta))}m</span>`
    : '';

  return `<li class="edit-catalog-card" data-catalog-entry-id="${esc(id)}" data-bucket="${esc(entry.bucket ?? '')}">
    <button type="button" class="edit-catalog-card-btn" data-action="EDIT_SWAP" data-payload='${payload}'>
      <span class="edc-head">
        ${actNum}
        <span class="edc-name">${esc(entry.name ?? '')}</span>
      </span>
      <span class="edc-meta">
        ${durationChip}
        ${cadence}
        ${ptChip}
        ${inToday}
        ${deltaChip}
      </span>
    </button>
  </li>`;
}

/**
 * Render the Project-type filter row (only surfaced when PROJECT panel is
 * expanded).
 *
 * @param {string} current
 * @returns {string}
 */
function renderProjectTypeFilter(current) {
  const pills = PROJECT_TYPE_OPTIONS.map((opt) => {
    const active = (current ?? 'all') === opt.key ? 'active' : '';
    const payload = esc(JSON.stringify({ projectType: opt.key }));
    return `<button type="button" class="edit-pt-pill ${active}" data-action="EDIT_PROJECT_TYPE_FILTER" data-payload='${payload}'>${esc(opt.label)}</button>`;
  }).join('');
  return `<div class="edit-pt-filter" role="group" aria-label="Project type filter">${pills}</div>`;
}

/**
 * Render one bucket panel (header + optional filter + list).
 *
 * @param {string} bucket
 * @param {object[]} entries
 * @param {object} ctx
 * @returns {string}
 */
function renderBucketPanel(bucket, entries, ctx) {
  const expanded = ctx.expandedBuckets.includes(bucket);
  const count = entries.length;
  const payload = esc(JSON.stringify({ bucket }));
  const chevron = expanded ? '▾' : '▸';
  const violated = ctx.violations.find((v) => v.bucket === bucket);
  const violationCls = violated ? `edit-bucket-violated edit-bucket-${violated.code.toLowerCase()}` : '';
  const ptFilter = (bucket === 'PROJECT' && expanded)
    ? renderProjectTypeFilter(ctx.projectTypeFilter)
    : '';
  const listHtml = expanded
    ? (count === 0
        ? `<p class="edit-bucket-empty">No matching entries.</p>`
        : `<ul class="edit-catalog-list">${entries.map((e) => renderCatalogCard(e, ctx)).join('')}</ul>`
      )
    : '';

  return `<section class="edit-bucket-card edit-bucket-${esc(bucket.toLowerCase())} ${esc(violationCls)}" data-bucket="${esc(bucket)}">
    <button type="button" class="edit-bucket-header" data-action="EDIT_BUCKET_TOGGLE" data-payload='${payload}' aria-expanded="${expanded ? 'true' : 'false'}">
      <span class="edit-bucket-chevron">${chevron}</span>
      <span class="edit-bucket-title">${esc(BUCKET_LABELS[bucket] ?? bucket)}</span>
      <span class="edit-bucket-count">(${esc(String(count))})</span>
    </button>
    ${ptFilter}
    ${listHtml}
  </section>`;
}

/**
 * Group filtered catalog entries by bucket, sorted: activityNumber asc, name asc.
 *
 * @param {object[]} entries
 * @returns {Record<string, object[]>}
 */
function groupByBucket(entries) {
  const out = { PROJECT: [], COMMUNICATION: [], CI: [] };
  for (const e of entries) {
    if (!e || typeof e !== 'object') continue;
    if (!(e.bucket in out)) continue;
    out[e.bucket].push(e);
  }
  for (const b of Object.keys(out)) {
    out[b].sort((a, c) => {
      const an = a.activityNumber ?? 999;
      const bn = c.activityNumber ?? 999;
      if (an !== bn) return an - bn;
      return String(a.name ?? '').localeCompare(String(c.name ?? ''));
    });
  }
  return out;
}

/**
 * Render the drawer header (title + dismiss).
 *
 * @param {string|null} selectedActivityId
 * @param {object|null} selectedSlot
 * @returns {string}
 */
function renderHeader(selectedActivityId, selectedSlot) {
  let subtitle = 'Pick a slot, then tap a card to swap.';
  if (selectedActivityId === '__new__') {
    subtitle = 'Pick a card to add it to your schedule.';
  } else if (selectedSlot) {
    const name = selectedSlot.name ?? 'slot';
    subtitle = `Swap "${name}" with...`;
  }
  return `<header class="edit-drawer-header">
    <h2 class="edit-drawer-title">Swap Activities</h2>
    <p class="edit-drawer-subtitle">${esc(subtitle)}</p>
    <button type="button" class="edit-drawer-dismiss" data-action="EDIT_CANCEL" data-payload='{}' aria-label="Close edit drawer">×</button>
  </header>`;
}

/**
 * Render the sticky footer (Commit / Cancel / Undo + Add-new).
 *
 * @param {number} undoCount
 * @returns {string}
 */
function renderFooter(undoCount) {
  const undoDisabled = undoCount === 0
    ? 'disabled aria-disabled="true"'
    : '';
  return `<footer class="edit-drawer-footer">
    <button type="button" class="edit-add-new secondary" data-action="EDIT_ADD_SLOT" data-payload='{}'>+ Add slot</button>
    <button type="button" class="edit-undo ghost" data-action="EDIT_UNDO" data-payload='{}' ${undoDisabled}>Undo (${esc(String(undoCount))})</button>
    <button type="button" class="edit-cancel secondary" data-action="EDIT_CANCEL" data-payload='{}'>Cancel</button>
    <button type="button" class="edit-commit primary" data-action="EDIT_COMMIT" data-payload='{}'>Commit</button>
  </footer>`;
}

/**
 * EditDrawer — pure component.
 *
 * @param {{
 *   catalog?: object[],
 *   activities?: object[],
 *   selectedActivityId?: string|null,
 *   search?: string,
 *   projectTypeFilter?: string,
 *   expandedBuckets?: string[],
 *   undoCount?: number,
 *   violations?: Array<{bucket:string, code:string, actual:number, bound:number}>
 * }} [props]
 * @returns {string}
 */
export function EditDrawer(props = {}) {
  const catalog = Array.isArray(props.catalog) ? props.catalog : [];
  const activities = Array.isArray(props.activities) ? props.activities : [];
  const search = typeof props.search === 'string' ? props.search : '';
  const projectTypeFilter = typeof props.projectTypeFilter === 'string'
    ? props.projectTypeFilter
    : 'all';
  const expandedBuckets = Array.isArray(props.expandedBuckets)
    ? props.expandedBuckets
    : ['PROJECT'];
  const selectedActivityId = props.selectedActivityId ?? null;
  const undoCount = Number.isFinite(props.undoCount) ? props.undoCount : 0;
  const violations = Array.isArray(props.violations) ? props.violations : [];

  const selectedSlot = resolveSelected(activities, selectedActivityId);

  const filtered = filterCatalog(catalog, { search, projectTypeFilter });
  const grouped = groupByBucket(filtered);

  const ctx = {
    activities,
    selectedSlot,
    expandedBuckets,
    projectTypeFilter,
    violations
  };

  const panels = BUCKET_ORDER.map((b) =>
    renderBucketPanel(b, grouped[b], ctx)
  ).join('\n');

  const searchPayload = '{}';
  return `<aside class="edit-drawer edit-drawer-open" role="dialog" aria-modal="true" aria-label="Swap activities">
  ${renderHeader(selectedActivityId, selectedSlot)}
  <div class="edit-drawer-body">
    <div class="edit-search-row">
      <input
        type="search"
        class="edit-search-input"
        placeholder="Search catalog..."
        value="${esc(search)}"
        data-action="EDIT_SEARCH"
        data-payload='${esc(searchPayload)}'
        aria-label="Search catalog"
      />
    </div>
    ${panels}
  </div>
  ${renderFooter(undoCount)}
</aside>`;
}

/**
 * Helper — visible for tests: is a particular activity protected? Mirrors
 * the `isProtectedBlock` re-export so tests can import from one location.
 */
export { isProtectedBlock };

export default EditDrawer;
