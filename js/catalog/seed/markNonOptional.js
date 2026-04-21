/**
 * Seed: flip `isNonOptional=true` on the locked set (E2-T7).
 *
 * The DAILY + WEEKLY + SPRINT non-optional sets are locked per
 * ENGINE_DESIGN §3.4 + PRODUCT_BLUEPRINT §3.4. This module flips the
 * `isNonOptional` flag on the matching entries in the catalog.
 *
 * Daily non-optional set:
 *   - Daily Standup (ceremony)
 *   - AM High-value Communication block (#14; handled implicitly via the
 *     composer AM-block materialization — #14's entry itself is not
 *     marked non-optional; only the ceremony anchor is)
 *   - Post-lunch High-value Communication block (same caveat as AM)
 *   - End-of-Activity Reflection (generic meta-slot)
 *
 * Weekly non-optional set (in addition to the daily set above):
 *   - Weekly Reflection (generic)
 *
 * Sprint non-optional set:
 *   - Sprint Planning (ceremony)
 *   - Mid-Sprint Review (ceremony)
 *   - Sprint Review (ceremony)
 *   - Sprint Retrospective (ceremony)
 *
 * The ceremonies and generics modules already seed `isNonOptional=true`
 * on the correct rows. This module is idempotent — it re-asserts the flag
 * by id and is a safety net if the ceremony/generic seed changes.
 *
 * Rationale for the "#14 is not non-optional" decision: the composer
 * MATERIALIZES non-optional AM + Post-lunch Communication blocks from the
 * ceremony / generic entries, not from catalog #14 directly. Catalog #14
 * remains `isNonOptional=false` so users who only have DMAIC / Kaizen
 * projects running and choose to disable general comm time-blocking can
 * do so; the daily composer still enforces the 75-min comm anchor via
 * the composer's DAILY_NON_OPTIONAL_SET.
 */

/**
 * Canonical ids / matchers that must have `isNonOptional=true` after this
 * pass. Order doesn't matter; both id and name-prefix match are supported
 * so this works whether the entry came from source50, ceremonies, or
 * generics.
 */
export const NON_OPTIONAL_IDS = Object.freeze([
  'cer_daily_standup',
  'cer_sprint_planning',
  'cer_mid_sprint_review',
  'cer_sprint_review',
  'cer_sprint_retrospective',
  'gen_end_of_activity_reflection',
  'gen_weekly_reflection',
  'gen_lessons_learned'
]);

/**
 * Name-prefix matches used when an entry's id doesn't follow the canonical
 * slug pattern — falls back to a startsWith name check.
 */
const NON_OPTIONAL_NAME_PREFIXES = Object.freeze([
  'Daily Standup',
  'Sprint Planning',
  'Mid-Sprint Review',
  'Sprint Review',
  'Sprint Retrospective',
  'End-of-Activity Reflection',
  'Weekly Reflection',
  'Lessons Learned'
]);

/**
 * Apply the non-optional flip.
 *
 * @param {import('../../domain/types.js').CatalogEntry[]} drafts
 * @returns {import('../../domain/types.js').CatalogEntry[]}
 */
export function applyMarkNonOptional(drafts) {
  return drafts.map((d) => {
    const byId = NON_OPTIONAL_IDS.includes(d.id);
    const byName = NON_OPTIONAL_NAME_PREFIXES.some((p) => (d.name ?? '').startsWith(p));
    if (byId || byName) {
      if (d.isNonOptional === true) return d;
      return { ...d, isNonOptional: true };
    }
    return d;
  });
}

export default applyMarkNonOptional;
