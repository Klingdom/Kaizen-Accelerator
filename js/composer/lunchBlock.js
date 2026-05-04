/**
 * lunchBlock — pure helper for Iter 26 lunch-block injection.
 *
 * Exports `injectLunchBlock(placed, input)`.
 *
 * Called AFTER `orderDay()` so the lunch row does not participate in the
 * packer, and BEFORE `validateComposition()` so validators can see it.
 * Because bucket===null, validateComposition skips it in all capacity sums.
 *
 * Decision references (all locked by Phil — Path A):
 *   - Duration:    30 minutes (Phil's directive — ARCHITECTURE_DELTA says 60,
 *                 Phil overrode to 30 in the implementation brief)
 *   - Start time:  12:00 (Noon)
 *   - Bucket:      null (capacity-neutral sentinel)
 *   - slotKind:    'LUNCH'
 *   - isAnchor:    false (movable)
 *   - isNonOptional: false (skippable without reason code)
 *
 * @module lunchBlock
 */

/** Stable catalog entry id for the lunch CatalogEntry. */
export const LUNCH_CATALOG_ID = 'recovery_lunch';

/** Default start time (HH:MM), matching plannedStartAt format from orderDay. */
export const LUNCH_DEFAULT_START = '12:00';

/** Default duration in minutes per Phil's directive. */
export const LUNCH_DEFAULT_MINUTES = 30;

/**
 * Feature flag — set to false to disable lunch injection globally.
 * Rollback: flip this constant to false and re-deploy.
 * ARCHITECTURE_DELTA_LUNCH_BLOCK.md §13.
 */
export const LUNCH_BLOCK_ENABLED = true;

/**
 * Inject a lunch ScheduledActivity into `placed` (mutates in place, like
 * `orderDay` does). Returns the same `placed` array reference for chaining.
 *
 * The lunch row is always appended last because the UI render layer sorts by
 * plannedStartAt when cascade-math is needed (`editMode.js:344`), so array
 * insertion order is unimportant for correctness.
 *
 * Edge cases handled:
 *   EC-2 / EC-3: if compositionStartAt >= 13:00 OR compositionEndAt <= 12:00
 *   (half-day configs), lunch is omitted because it falls fully outside the
 *   composition window. For the MVP this is approximated by checking
 *   `input.dailyCapacityMinutes < 120` (less than 2h of work capacity is
 *   a strong proxy for an afternoon-only or morning-only half-day).
 *   Callers with explicit start/end-time awareness should pass those fields
 *   in `input` for more precise gating in a future iteration.
 *
 * @param {object[]} placed   mutable array of ScheduledActivity drafts
 * @param {object}   input    composeDaily / buildDay input object
 * @returns {object[]}        same `placed` array (mutated)
 */
export function injectLunchBlock(placed, input) {
  if (!LUNCH_BLOCK_ENABLED) return placed;

  // EC-2/EC-3 guard: skip lunch on very short capacity days.
  const cap = input?.dailyCapacityMinutes ?? input?.capacityMinutes ?? 480;
  if (cap < 120) return placed;

  const userId = input?.userId ?? 'unknown';
  const date = input?.date ?? '';

  // Build a unique, stable id for this lunch activity.
  // Format mirrors composeDaily's materialize(): sa_{catalogId}_{date|slot}.
  const id = date
    ? `sa_${LUNCH_CATALOG_ID}_${date}`
    : `sa_${LUNCH_CATALOG_ID}_lunch`;

  const lunchActivity = {
    id,
    catalogEntryId: LUNCH_CATALOG_ID,
    name: 'Lunch',
    bucket: null,                        // capacity-neutral sentinel
    plannedStartAt: LUNCH_DEFAULT_START,
    plannedDurationMinutes: LUNCH_DEFAULT_MINUTES,
    state: 'PROPOSED',
    sourceOfSchedule: 'COMPOSER_AUTO',
    slotKind: 'LUNCH',
    isNonOptional: false,
    isAnchor: false
  };

  // Attach compositionId only when we can derive it (matches composeDaily
  // pattern where compositionId is built before activities[] is finalized).
  // composeWeekly's buildDay sets compositionId on activities after this call.
  placed.push(lunchActivity);

  return placed;
}

export default injectLunchBlock;
