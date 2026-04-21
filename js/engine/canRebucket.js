/**
 * canRebucket — E4-T4 drag-to-rebucket drop rule.
 *
 * Implements ENGINE_DESIGN §2.6 + UX_FLOWS §4.2. A drag commit is allowed
 * only when the resulting composition still passes validateComposition:
 * both source and destination buckets respect floor/ceiling rules, and
 * non-optionals remain present.
 *
 * Pure function — no I/O. Accepts a composition-like envelope with:
 *   - activities[] (same shape as composeDaily placed[])
 *   - cycleType
 *   - userDailyCapacityMinutes (or composerInputsSnapshot.capacityMinutes)
 *   - externalMinutesToday (or composerInputsSnapshot.externalMinutesToday)
 *
 * Returns `{ ok: boolean, failureCode: string|null, detail: object }` —
 * same shape as validateComposition.
 */

import { validateComposition } from './validateComposition.js';

/**
 * Map a ScheduledActivity / placed-block to whether it is a protected
 * non-optional that cannot be dragged out of its bucket. Protected blocks
 * include:
 *   - The daily non-optional set (Standup, AM/Post Comm, End-of-Activity Reflection)
 *   - Sprint ceremonies (Sprint Planning, Mid-Sprint Review, Sprint Review,
 *     Sprint Retrospective)
 *   - R2 carried-over rescues (varianceQueue)
 *   - Strategic-flagged Deep payload
 *
 * @param {object} a
 * @returns {boolean}
 */
function isNonOptionalDrag(a) {
  if (!a) return false;
  if (a.carriedOver === true) return true;
  if (a.slotKind === 'AM_COMM' || a.slotKind === 'POST_LUNCH_COMM') return true;
  const lockedIds = new Set([
    'cer_daily_standup',
    'cer_sprint_planning',
    'cer_mid_sprint_review',
    'cer_sprint_review',
    'cer_sprint_retrospective',
    'gen_end_of_activity_reflection'
  ]);
  if (lockedIds.has(a.catalogEntryId)) return true;
  if (a.strategic === true && a.bucket === 'PROJECT') return true;
  return false;
}

/**
 * Can `activityId` be rebucketed from `fromBucket` to `toBucket` without
 * violating any invariant?
 *
 * Signature matches the DELIVERY_PLAN E4-T4 acceptance: pure function taking
 * `(activity, fromBucket, toBucket, composition)`. We also accept the
 * composition as first argument for ergonomic usage.
 *
 * @param {object} activityOrComposition
 * @param {string|undefined} fromBucket
 * @param {string|undefined} toBucket
 * @param {object|undefined} maybeComposition
 * @returns {{ok: boolean, failureCode: string|null, detail: object}}
 */
export function canRebucket(activityOrComposition, fromBucket, toBucket, maybeComposition) {
  // Overload resolution:
  //   (composition, activityId, newBucket)  — internal
  //   (activity, fromBucket, toBucket, composition) — spec form
  let composition;
  let activity;
  let target;

  if (maybeComposition) {
    activity = activityOrComposition;
    target = toBucket;
    composition = maybeComposition;
  } else {
    composition = activityOrComposition;
    const activityId = fromBucket;
    target = toBucket;
    const acts = Array.isArray(composition?.activities) ? composition.activities : [];
    activity = acts.find((a) => a.id === activityId) ?? null;
  }

  if (!composition) {
    return { ok: false, failureCode: 'INVALID_INPUT', detail: { message: 'composition required' } };
  }
  if (!activity) {
    return { ok: false, failureCode: 'ACTIVITY_NOT_FOUND', detail: {} };
  }
  if (!target) {
    return { ok: false, failureCode: 'INVALID_INPUT', detail: { message: 'toBucket required' } };
  }
  if (isNonOptionalDrag(activity)) {
    return {
      ok: false,
      failureCode: 'NON_OPTIONAL_LOCKED',
      detail: { activityId: activity.id, name: activity.name }
    };
  }
  if (activity.bucket === target) {
    return { ok: true, failureCode: null, detail: { message: 'no-op — same bucket' } };
  }

  const activities = Array.isArray(composition.activities)
    ? composition.activities
    : [];

  const clone = activities.map((a) =>
    a.id === activity.id ? { ...a, bucket: target } : a
  );

  const cap =
    composition.userDailyCapacityMinutes ??
    composition.composerInputsSnapshot?.capacityMinutes ??
    composition.dailyCapacityMinutes ??
    480;
  const ext =
    composition.externalMinutesToday ??
    composition.composerInputsSnapshot?.externalMinutesToday ??
    0;

  return validateComposition({
    cycleType: composition.cycleType ?? 'DAILY',
    activities: clone,
    userDailyCapacityMinutes: cap,
    externalMinutesToday: ext
  });
}

export default canRebucket;
