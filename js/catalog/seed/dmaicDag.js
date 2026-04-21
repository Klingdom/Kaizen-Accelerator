/**
 * Seed: apply CATALOG_GAPS §J DMAIC DAG edges (E2-T8 contribution for Sprint 2).
 *
 * The 22 DMAIC catalog entries (#20–#41) form a DAG whose edges are
 * authoritatively specified in CATALOG_GAPS §J.1. This module applies
 * those `dependsOn` arrays to the draft entries by activity number.
 *
 * `dependsOn` on a catalog entry is a list of other catalog-entry IDs.
 * Here we compute those IDs by looking up the target activityNumber in
 * the draft catalog (the `cat_${n}_...` slug varies per row, so we need
 * the catalog to resolve numbers to ids at seed time).
 *
 * The #29 and #30 post-runs and the #39 two-pass schedule are NOT catalog
 * duplications — they're handled at composer time via linkedDmaicStepRef.
 * For the `dependsOn` edge seed, we use the catalog-single-id semantics:
 * #39's `dependsOn = [#38, #33]` for the projected pass; the post-run
 * predecessors for pass-2 are enforced at composer time, not in the
 * static seed.
 *
 * Pure function; no I/O.
 */

/**
 * §J.1 — DMAIC edge table, keyed by child activityNumber.
 * Each value is the list of PREREQUISITE activityNumbers.
 */
export const DMAIC_EDGE_TABLE = Object.freeze({
  20: [],
  21: [20],
  22: [21, 26],
  23: [20],
  24: [23],
  25: [20, 21],
  26: [23],
  27: [28],
  28: [22, 31],
  29: [28],
  30: [28],
  31: [22],
  32: [21],
  33: [22, 36],
  34: [26, 32],
  35: [34],
  36: [35],
  37: [34, 36],
  38: [37],
  // #39 single-row; pass-1 edges encoded here. Pass-2 predecessors are
  // enforced at composer time via linkedDmaicStepRef.passNumber.
  39: [38, 33],
  40: [38],
  41: [40, 39]
});

/**
 * Kaizen DAG edges (per CATALOG_GAPS §K.4) — seeded alongside DMAIC so the
 * single DAG validator can walk the whole catalog.
 */
export const KAIZEN_EDGE_TABLE = Object.freeze({
  42: [],
  43: [42],
  44: [42, 43],
  45: [44],
  46: [45],
  47: [46],
  48: [47],
  49: [48],
  50: [49]
});

/**
 * Resolve a child's prereq activityNumbers into catalog-entry ids by
 * looking them up in `drafts`.
 *
 * @param {import('../../domain/types.js').CatalogEntry[]} drafts
 * @param {number[]} prereqNumbers
 * @returns {string[]}
 */
function resolveIds(drafts, prereqNumbers) {
  return prereqNumbers.map((n) => {
    const found = drafts.find((d) => d.activityNumber === n);
    if (!found) {
      const err = new Error(`dmaicDag: no draft found for prerequisite activityNumber=${n}`);
      err.name = 'DAG_PREREQ_NOT_FOUND';
      throw err;
    }
    return found.id;
  });
}

/**
 * Apply the DMAIC + Kaizen DAG edges to the drafts. Entries not in the
 * edge tables keep their existing `dependsOn` (which defaults to `[]`
 * from bulkFill).
 *
 * @param {import('../../domain/types.js').CatalogEntry[]} drafts
 * @returns {import('../../domain/types.js').CatalogEntry[]}
 */
export function applyDmaicDag(drafts) {
  return drafts.map((d) => {
    const dmaicPrereqs = DMAIC_EDGE_TABLE[d.activityNumber];
    const kaizenPrereqs = KAIZEN_EDGE_TABLE[d.activityNumber];
    const prereqs = dmaicPrereqs ?? kaizenPrereqs;
    if (!prereqs) return d;
    const prereqIds = resolveIds(drafts, prereqs);
    return { ...d, dependsOn: prereqIds };
  });
}

export default applyDmaicDag;
