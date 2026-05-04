/**
 * validateComposition — step-9 invariant check for composeDaily (Sprint 3).
 *
 * Implements ENGINE_DESIGN §2.5 with the full 9 failure codes:
 *
 *   DEEP_UNDER_FLOOR       — PROJECT < floor
 *   COMM_UNDER_FLOOR       — COMMUNICATION < floor
 *   CI_UNDER_FLOOR         — CI < floor
 *   PROJECT_OVERPACKED     — PROJECT > ceiling
 *   COMM_OVERPACKED        — COMMUNICATION > ceiling
 *   CI_OVERPACKED          — CI > ceiling
 *   NON_OPTIONAL_MISSING   — missing required non-optional for the cycle
 *   OVER_CAPACITY          — total > (capacity − external)
 *   INFEASIBLE             — cannot be produced at all (set by caller after
 *                            relaxConfigurable exhausts — this module does
 *                            NOT emit INFEASIBLE on its own)
 *
 * Each failure returns `{ ok: false, failureCode, detail }` with the exact
 * `detail` shape expected by UX_FLOWS §4.3 microcopy formatting.
 *
 * Pure; no I/O.
 */

import {
  computeBucketTargets
} from './capacity.js';
import {
  computeBucketFloors,
  computeBucketCeilings
} from '../capacity/floorsAndCeilings.js';

/**
 * DAILY_NON_OPTIONAL_NAMES — names the daily cycle MUST include. If the
 * composition is missing any of these, validate fails with NON_OPTIONAL_MISSING.
 *
 * "Deep Work" is treated as satisfied by ANY PROJECT-bucket activity (§3.4 rule
 * 4: "aggregate ≥ floors.PROJECT; any single PROJECT-bucket entry satisfies
 * the named activity requirement"). We encode it as a rule: if no PROJECT
 * activity exists, we add "Deep Work" to missing[].
 */
export const DAILY_NON_OPTIONAL_NAMES = Object.freeze([
  'Daily Standup',
  'AM High-value Communication',
  'Post-lunch High-value Communication',
  'End-of-Activity Reflection'
]);

/**
 * @param {object[]} activities
 * @param {string} bucket
 */
function sumBucket(activities, bucket) {
  let sum = 0;
  for (const a of activities) {
    if (a.bucket === bucket) sum += a.plannedDurationMinutes ?? 0;
  }
  return sum;
}

/**
 * Check which non-optional names are missing from `activities`.
 *
 * @param {'DAILY' | 'WEEKLY'} cycleType
 * @param {object[]} activities
 * @returns {string[]}
 */
export function requiredNonOptionals(cycleType, activities) {
  if (cycleType !== 'DAILY') return [];
  const names = new Set(activities.map((a) => a.name));
  const missing = [];
  for (const n of DAILY_NON_OPTIONAL_NAMES) {
    if (!names.has(n)) missing.push(n);
  }
  // Deep Work requirement — any PROJECT-bucket activity satisfies it.
  const hasProject = activities.some((a) => a.bucket === 'PROJECT');
  if (!hasProject) missing.push('Deep Work');
  return missing;
}

/**
 * @param {string} failureCode
 * @param {object} detail
 * @returns {{ok:false, failureCode:string, detail:object}}
 */
function fail(failureCode, detail) {
  return { ok: false, failureCode, detail };
}

/**
 * @param {object} detail
 */
function ok(detail) {
  return { ok: true, failureCode: null, detail };
}

/**
 * Run the invariant check per ENGINE_DESIGN §2.5.
 *
 * @param {{
 *   cycleType: 'DAILY' | 'WEEKLY',
 *   activities: object[],
 *   userDailyCapacityMinutes: number,
 *   externalMinutesToday?: number
 * }} args
 * @returns {{ok: boolean, failureCode: string|null, detail: object}}
 */
export function validateComposition({
  cycleType,
  activities,
  userDailyCapacityMinutes,
  externalMinutesToday = 0
}) {
  if (!Array.isArray(activities)) {
    return fail('INVALID_INPUT', { message: 'activities must be an array' });
  }
  if (!Number.isFinite(userDailyCapacityMinutes) || userDailyCapacityMinutes <= 0) {
    return fail('INVALID_INPUT', { message: 'userDailyCapacityMinutes must be positive' });
  }

  // Iter 26: exclude capacity-neutral rows (bucket===null, e.g. lunch) from
  // all capacity and bucket sums. sumBucket() already skips them naturally
  // via the `a.bucket === bucket` guard. Only the total needs an explicit filter.
  const total = activities
    .filter((a) => a.bucket !== null && a.bucket !== undefined)
    .reduce((s, a) => s + (a.plannedDurationMinutes ?? 0), 0);
  const effectiveCap = userDailyCapacityMinutes - externalMinutesToday;

  if (total > effectiveCap) {
    return fail('OVER_CAPACITY', { total, cap: effectiveCap, overBy: total - effectiveCap });
  }

  if (cycleType === 'DAILY') {
    const targets = computeBucketTargets(
      { id: 'validator', role: [], dailyCapacityMinutes: userDailyCapacityMinutes },
      externalMinutesToday
    );
    const floors = computeBucketFloors(userDailyCapacityMinutes);
    const ceilings = computeBucketCeilings(userDailyCapacityMinutes);

    // Adjust COMM floor for external-drain: when COMM target is reduced below
    // default, floor is 50% of the *reduced* target (per §2.2 over §2.1 budget).
    const commFloor = Math.round(targets.COMMUNICATION * 0.5);
    const commCeiling = Math.round(targets.COMMUNICATION * 1.25);

    const p = sumBucket(activities, 'PROJECT');
    const m = sumBucket(activities, 'COMMUNICATION');
    const i = sumBucket(activities, 'CI');

    if (p < floors.PROJECT) {
      return fail('DEEP_UNDER_FLOOR', { actual: p, floor: floors.PROJECT });
    }
    if (m < commFloor) {
      return fail('COMM_UNDER_FLOOR', { actual: m, floor: commFloor });
    }
    if (i < floors.CI) {
      return fail('CI_UNDER_FLOOR', { actual: i, floor: floors.CI });
    }
    if (p > ceilings.PROJECT) {
      return fail('PROJECT_OVERPACKED', { actual: p, ceiling: ceilings.PROJECT });
    }
    if (m > commCeiling) {
      return fail('COMM_OVERPACKED', { actual: m, ceiling: commCeiling });
    }
    if (i > ceilings.CI) {
      return fail('CI_OVERPACKED', { actual: i, ceiling: ceilings.CI });
    }

    const missing = requiredNonOptionals('DAILY', activities);
    if (missing.length) {
      return fail('NON_OPTIONAL_MISSING', { missing });
    }

    return ok({
      shape_4_2_2: {
        ok: true,
        projectMin: p,
        commMin: m,
        ciMin: i
      },
      nonOptionalPresent: { ok: true, missing: [] },
      overAllocated: { ok: true, totalMin: total, capacityMin: effectiveCap }
    });
  }

  // Weekly validation: defer to caller / future validateWeekly. We at least
  // ensure OVER_CAPACITY was checked above on a per-day basis (caller passes
  // each day's total). For now, return ok.
  return ok({
    totalMin: total,
    capacityMin: effectiveCap
  });
}

export default validateComposition;
