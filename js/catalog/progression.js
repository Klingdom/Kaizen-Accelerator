/**
 * progression — pure catalog progression helpers (Sprint 9 Pass 9a).
 *
 * Given a Kaizen's projectType, a set of completed catalog-entry ids, and
 * the full catalog, compute the "current" + "next" standard-work activity
 * the user should be doing. Also exposes a simple per-project-type filter.
 *
 * Used by:
 *   - `composeWeekly` (Pass 9b) to inject project-bucket payloads day by
 *     day across a 5-day week.
 *   - Portfolio's KaizenCard (Pass 9c) to display the "▶ #N Name" chip.
 *
 * Pure — no I/O, no randomness, deterministic tie-breakers.
 *
 * @typedef {import('../domain/types.js').CatalogEntry} CatalogEntry
 * @typedef {import('../domain/types.js').ProjectType} ProjectType
 */

/**
 * Does `entry.projectTypeBinding` match the given projectType?
 *
 * - `null`            → universal, does NOT count as bound to a specific
 *                       projectType (filterCatalogByProjectType returns only
 *                       rows bound to the exact projectType).
 * - string            → exact match.
 * - string[]          → membership.
 *
 * @param {CatalogEntry} entry
 * @param {ProjectType} projectType
 * @returns {boolean}
 */
export function entryBindsToProjectType(entry, projectType) {
  const b = entry?.projectTypeBinding;
  if (b === null || b === undefined) return false;
  if (typeof b === 'string') return b === projectType;
  if (Array.isArray(b)) return b.includes(projectType);
  return false;
}

/**
 * Filter the catalog to entries that bind to `projectType`. Excludes
 * null-bound (universal) rows — this function is specifically for
 * per-project payload selection; universal rows are selected by the
 * universal-fill fallback elsewhere.
 *
 * Deterministic ordering: activityNumber asc, then id asc.
 *
 * @param {ProjectType} projectType
 * @param {CatalogEntry[]} catalog
 * @returns {CatalogEntry[]}
 */
export function filterCatalogByProjectType(projectType, catalog) {
  if (!Array.isArray(catalog)) return [];
  const filtered = catalog.filter((c) => entryBindsToProjectType(c, projectType));
  return sortDeterministic(filtered);
}

/**
 * Sort a catalog slice deterministically: activityNumber asc (nulls last),
 * then id asc. Returns a new array.
 *
 * @param {CatalogEntry[]} entries
 * @returns {CatalogEntry[]}
 */
export function sortDeterministic(entries) {
  return [...entries].sort((a, b) => {
    const an = typeof a.activityNumber === 'number' ? a.activityNumber : Infinity;
    const bn = typeof b.activityNumber === 'number' ? b.activityNumber : Infinity;
    if (an !== bn) return an - bn;
    const ai = String(a.id ?? '');
    const bi = String(b.id ?? '');
    if (ai < bi) return -1;
    if (ai > bi) return 1;
    return 0;
  });
}

/**
 * For linear progression types (Kaizen 90, Accelerator 30, AD_HOC), return
 * the first uncompleted entry + the second uncompleted entry per
 * activityNumber asc.
 *
 * @param {CatalogEntry[]} sorted - already deterministic-sorted
 * @param {Set<string>} completed
 * @returns {{current: CatalogEntry|null, next: CatalogEntry|null, remaining: CatalogEntry[]}}
 */
function linearProgression(sorted, completed) {
  const remaining = sorted.filter((c) => !completed.has(c.id));
  return {
    current: remaining[0] ?? null,
    next: remaining[1] ?? null,
    remaining
  };
}

/**
 * For DAG-driven types (DMAIC), find the first entry whose dependsOn are all
 * completed AND which itself is not completed. "Next" = the same rule
 * applied to `completed ∪ {current.id}`.
 *
 * Deterministic tie-break: activityNumber asc, id asc.
 *
 * @param {CatalogEntry[]} sorted - already deterministic-sorted
 * @param {Set<string>} completed
 * @returns {{current: CatalogEntry|null, next: CatalogEntry|null, remaining: CatalogEntry[]}}
 */
function dagProgression(sorted, completed) {
  const isReady = (entry, completedSet) => {
    if (completedSet.has(entry.id)) return false;
    const deps = Array.isArray(entry.dependsOn) ? entry.dependsOn : [];
    return deps.every((d) => completedSet.has(d));
  };

  const current = sorted.find((c) => isReady(c, completed)) ?? null;

  let next = null;
  if (current) {
    const withCurrent = new Set(completed);
    withCurrent.add(current.id);
    next = sorted.find((c) => isReady(c, withCurrent)) ?? null;
  }

  // "remaining" = everything not completed; ordering per the DAG-friendly
  // deterministic sort. Useful for callers wanting a forward queue.
  const remaining = sorted.filter((c) => !completed.has(c.id));
  return { current, next, remaining };
}

/**
 * Compute the current + next standard-work activity for a Kaizen.
 *
 * Semantics:
 *   - `DMAIC`                        → DAG-driven. Honors `dependsOn` edges
 *                                      authored by `dmaicDag.js`.
 *   - `KAIZEN_EVENT_90D`             → linear by activityNumber.
 *   - `KAIZEN_ACCELERATOR_30D`       → linear by activityNumber.
 *   - `AD_HOC`                       → linear by activityNumber.
 *   - `KAIZEN_EVENT`                 → linear by activityNumber.
 *
 * @param {ProjectType} projectType
 * @param {string[]|Set<string>} completedCatalogIds
 * @param {CatalogEntry[]} catalog
 * @returns {{current: CatalogEntry|null, next: CatalogEntry|null, remaining: CatalogEntry[]}}
 */
export function getCurrentNext(projectType, completedCatalogIds, catalog) {
  if (!projectType || !Array.isArray(catalog)) {
    return { current: null, next: null, remaining: [] };
  }
  const completed =
    completedCatalogIds instanceof Set
      ? completedCatalogIds
      : new Set(Array.isArray(completedCatalogIds) ? completedCatalogIds : []);

  const slice = filterCatalogByProjectType(projectType, catalog);
  if (slice.length === 0) {
    return { current: null, next: null, remaining: [] };
  }

  if (projectType === 'DMAIC') {
    return dagProgression(slice, completed);
  }
  // All non-DMAIC project types are linear for now.
  return linearProgression(slice, completed);
}

export default {
  getCurrentNext,
  filterCatalogByProjectType,
  entryBindsToProjectType,
  sortDeterministic
};
