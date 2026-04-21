/**
 * Seed: apply CATALOG_GAPS §H.1 bucket mapping (E2-T6).
 *
 * Every schedulable catalog entry must carry exactly one bucket value
 * (`PROJECT` / `COMMUNICATION` / `CI`) frozen at schedule time per
 * ARCHITECTURE §2.2.
 *
 * The approved mapping (coordinator 2026-04-18) is below. DMAIC (#20–#41)
 * and Kaizen (#42–#50) all land in PROJECT. Ceremonies all land in
 * COMMUNICATION. Exceptions and #13 move (CI) are locked by the §H.1 table.
 *
 * Ceremony/generic entries already carry their bucket (set in
 * ceremoniesAndGenerics.js). This step only fills the numbered-entry
 * bucket field — if a draft already has a non-null bucket, it's left alone.
 *
 * Pure function; no I/O.
 */

/** §H.1 — bucket by numbered-row activityNumber. */
const BUCKET_BY_NUMBER = Object.freeze({
  1: 'CI',
  2: 'CI',
  3: 'CI',
  4: 'COMMUNICATION',
  5: 'COMMUNICATION',
  6: 'CI',
  7: 'PROJECT',
  8: 'PROJECT',
  9: 'PROJECT',
  10: 'PROJECT',
  11: 'PROJECT',
  12: 'CI',
  13: 'CI', // moved from COMMUNICATION per 2026-04-18
  14: 'COMMUNICATION',
  15: 'COMMUNICATION',
  16: 'COMMUNICATION',
  18: 'PROJECT',
  19: 'PROJECT'
  // #20..#41 → PROJECT (applied by family fallback below)
  // #42..#50 → PROJECT (applied by family fallback below)
});

/**
 * Resolve a bucket for an entry that wasn't matched directly. DMAIC + Kaizen
 * families inherit PROJECT. Falls through to null for truly unknown entries
 * (caller decides what to do).
 *
 * @param {import('../../domain/types.js').CatalogEntry} entry
 * @returns {string|null}
 */
function bucketByFamily(entry) {
  const n = entry.activityNumber;
  if (typeof n === 'number') {
    if (n >= 20 && n <= 41) return 'PROJECT';
    if (n >= 42 && n <= 50) return 'PROJECT';
  }
  if (entry.focusArea === 'DMAIC' || entry.focusArea === 'KAIZEN') return 'PROJECT';
  if (entry.focusArea === 'CEREMONY') return 'COMMUNICATION';
  if (entry.focusArea === 'INNOVATION') return 'PROJECT';
  if (entry.focusArea === 'COMMUNICATION') return 'COMMUNICATION';
  if (entry.focusArea === 'CONTINUOUS_IMPROVEMENT') return 'CI';
  if (entry.focusArea === 'DEEP_WORK') return 'PROJECT';
  return null;
}

/**
 * Apply §H.1 bucket mapping to all drafts. Entries with a pre-existing
 * non-null `bucket` (e.g. ceremonies and generics set in ceremoniesAndGenerics)
 * are left unchanged.
 *
 * @param {import('../../domain/types.js').CatalogEntry[]} drafts
 * @returns {import('../../domain/types.js').CatalogEntry[]}
 */
export function applyBucketMap(drafts) {
  return drafts.map((d) => {
    if (d.bucket !== null && d.bucket !== undefined) return d;
    const direct = BUCKET_BY_NUMBER[d.activityNumber];
    const bucket = direct ?? bucketByFamily(d);
    if (!bucket) {
      const err = new Error(
        `bucketMap: cannot resolve bucket for entry id=${d.id} (#${d.activityNumber}, focusArea=${d.focusArea})`
      );
      err.name = 'BUCKET_UNRESOLVABLE';
      throw err;
    }
    return { ...d, bucket };
  });
}

/** Exposed for tests. */
export const _BUCKET_BY_NUMBER = BUCKET_BY_NUMBER;

export default applyBucketMap;
