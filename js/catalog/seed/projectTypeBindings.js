/**
 * Seed: apply `projectTypeBinding` to every catalog entry (Sprint 9 Pass 9a).
 *
 * Sets `CatalogEntry.projectTypeBinding` per CATALOG_GAPS §J (DMAIC rows) and
 * §K (Kaizen 90 / Kaizen Event rows) and keeps ceremonies + generic
 * communication / CI entries universal (`null`).
 *
 * Rule table (keyed by activityNumber, with fall-throughs for ceremonies /
 * generics):
 *
 *   #12 PDCA Cycle                          → 'AD_HOC'
 *   #20..#41 DMAIC                          → 'DMAIC'
 *   #42..#50 Kaizen anchors                 → ['KAIZEN_EVENT', 'KAIZEN_EVENT_90D']
 *                                             (per CATALOG_GAPS §K.1 authoritative
 *                                             binding model — set-valued so the
 *                                             same row serves standalone + 90-day).
 *   Accelerator-specific rows                → 'KAIZEN_ACCELERATOR_30D'
 *                                             (resolved by id prefix `cat_acc_`
 *                                             or `kza_*`; none exist in the
 *                                             current 60-row pipeline — this is
 *                                             a forward guard for when the
 *                                             Accelerator seed lands.)
 *   Everything else (ceremonies, #1..#11,
 *   #13..#19, generics)                     → null (universal / cross-project)
 *
 * The binding is only WRITTEN when the row currently has a nullish
 * `projectTypeBinding`. If a seed earlier in the pipeline (e.g. a future
 * Accelerator seed step) already stamped a value, it wins.
 *
 * Pure function; no I/O.
 */

/**
 * Activity-number → binding map for the DMAIC / PDCA / Kaizen family rows.
 * Everything not in this map falls to `null`.
 */
const BINDING_BY_ACTIVITY_NUMBER = Object.freeze({
  // Ad-hoc PDCA anchor
  12: 'AD_HOC',

  // DMAIC #20..#41
  20: 'DMAIC', 21: 'DMAIC', 22: 'DMAIC', 23: 'DMAIC', 24: 'DMAIC',
  25: 'DMAIC', 26: 'DMAIC', 27: 'DMAIC', 28: 'DMAIC', 29: 'DMAIC',
  30: 'DMAIC', 31: 'DMAIC', 32: 'DMAIC', 33: 'DMAIC', 34: 'DMAIC',
  35: 'DMAIC', 36: 'DMAIC', 37: 'DMAIC', 38: 'DMAIC', 39: 'DMAIC',
  40: 'DMAIC', 41: 'DMAIC',

  // Kaizen anchors — set-valued per CATALOG_GAPS §K.1. Frozen so consumers
  // can't mutate the seed.
  42: Object.freeze(['KAIZEN_EVENT', 'KAIZEN_EVENT_90D']),
  43: Object.freeze(['KAIZEN_EVENT', 'KAIZEN_EVENT_90D']),
  44: Object.freeze(['KAIZEN_EVENT', 'KAIZEN_EVENT_90D']),
  45: Object.freeze(['KAIZEN_EVENT', 'KAIZEN_EVENT_90D']),
  46: Object.freeze(['KAIZEN_EVENT', 'KAIZEN_EVENT_90D']),
  47: Object.freeze(['KAIZEN_EVENT', 'KAIZEN_EVENT_90D']),
  48: Object.freeze(['KAIZEN_EVENT', 'KAIZEN_EVENT_90D']),
  49: Object.freeze(['KAIZEN_EVENT', 'KAIZEN_EVENT_90D']),
  50: Object.freeze(['KAIZEN_EVENT', 'KAIZEN_EVENT_90D'])
});

/**
 * Return the id-based Accelerator fallback, or null. This matches any entry
 * whose id starts with `cat_acc_`, `kza_`, or whose focusArea is the
 * `KAIZEN_ACCELERATOR_30D` enum value. Forward-compatible: no such rows
 * exist in the current seed but this guard will pick them up when the
 * Accelerator catalog seed lands.
 *
 * @param {import('../../domain/types.js').CatalogEntry} entry
 * @returns {string|null}
 */
function acceleratorBindingForEntry(entry) {
  const id = typeof entry.id === 'string' ? entry.id : '';
  if (id.startsWith('cat_acc_') || id.startsWith('kza_')) {
    return 'KAIZEN_ACCELERATOR_30D';
  }
  if (entry.focusArea === 'KAIZEN_ACCELERATOR_30D') {
    return 'KAIZEN_ACCELERATOR_30D';
  }
  return null;
}

/**
 * Resolve the projectTypeBinding for a single catalog entry. Returns the
 * binding value (string, array, or null) per the rule table above.
 *
 * @param {import('../../domain/types.js').CatalogEntry} entry
 * @returns {string|string[]|null}
 */
export function resolveProjectTypeBinding(entry) {
  const byNumber = BINDING_BY_ACTIVITY_NUMBER[entry.activityNumber];
  if (byNumber !== undefined) {
    return Array.isArray(byNumber) ? [...byNumber] : byNumber;
  }
  const accel = acceleratorBindingForEntry(entry);
  if (accel !== null) return accel;
  return null;
}

/**
 * Apply bindings across the draft catalog. Overwrites only when the entry's
 * current `projectTypeBinding` is nullish — respects any earlier seed step
 * that may have stamped a concrete value.
 *
 * @param {import('../../domain/types.js').CatalogEntry[]} drafts
 * @returns {import('../../domain/types.js').CatalogEntry[]}
 */
export function applyProjectTypeBindings(drafts) {
  return drafts.map((d) => {
    // Respect a non-null pre-existing binding.
    if (
      d.projectTypeBinding !== null &&
      d.projectTypeBinding !== undefined
    ) {
      return d;
    }
    const resolved = resolveProjectTypeBinding(d);
    return { ...d, projectTypeBinding: resolved };
  });
}

/**
 * Exposed for tests.
 */
export const _BINDING_BY_ACTIVITY_NUMBER = BINDING_BY_ACTIVITY_NUMBER;

export default applyProjectTypeBindings;
