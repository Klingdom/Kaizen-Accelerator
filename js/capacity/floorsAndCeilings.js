/**
 * Capacity floors + ceilings (E4-T1).
 *
 * Source: ENGINE_DESIGN.md §2.2 + ARCHITECTURE.md §5.1–§5.2.
 *
 *  - Daily 4-2-2 bucket target triple on a full 480-min day:
 *      PROJECT=240, COMMUNICATION=120, CI=120.
 *  - Half-day scales proportionally to 2-1-1 — floors/ceilings scale along.
 *  - Floor (minimum viable 4-2-2 guard): 0.5 × bucket target.
 *  - Ceiling (pack-to slack): 1.10 × PROJECT (10% slack), 1.25 × COMM/CI.
 *
 * Pure functions; no I/O; no side effects. Daily 4-2-2 numbers come from the
 * canonical defaults below — NOT from a global User object — so the composer
 * can scale to any `userDailyCap` without mutating module state.
 */

/**
 * Canonical 4-2-2 bucket targets at full daily capacity (480 min).
 * ARCHITECTURE §5.1 / ENGINE_DESIGN §2.1.
 */
export const BUCKET_DEFAULT_TARGETS = Object.freeze({
  PROJECT: 240,
  COMMUNICATION: 120,
  CI: 120
});

/** Full daily capacity in minutes used as the scaling reference. */
export const FULL_DAILY_CAP_MINUTES = 480;

/** Floor multiplier — minimum-viable-4-2-2 guard. ENGINE_DESIGN §2.2. */
export const FLOOR_MULTIPLIER = 0.5;

/** Ceiling multipliers per bucket. ENGINE_DESIGN §2.2 / ARCHITECTURE §5.6. */
export const CEILING_MULTIPLIERS = Object.freeze({
  PROJECT: 1.10,
  COMMUNICATION: 1.25,
  CI: 1.25
});

/**
 * @typedef {object} BucketTriple
 * @property {number} PROJECT
 * @property {number} COMMUNICATION
 * @property {number} CI
 */

/**
 * Require a positive finite numeric capacity. 0 and negative values are
 * invalid — a user with zero capacity has no day to compose.
 *
 * @param {number} userDailyCap
 */
function requireValidCapacity(userDailyCap) {
  if (
    typeof userDailyCap !== 'number' ||
    !Number.isFinite(userDailyCap) ||
    userDailyCap <= 0
  ) {
    const err = new Error(
      `capacity: userDailyCap must be a positive finite number, got ${userDailyCap}`
    );
    err.name = 'INVALID_CAPACITY';
    throw err;
  }
}

/**
 * Scale the 4-2-2 target triple by `userDailyCap / 480`. Internal helper —
 * the full `computeBucketTargets()` (ENGINE_DESIGN §2.1) also drains
 * COMMUNICATION by external meetings; floors/ceilings operate on the
 * canonical scaled triple, not the drained triple.
 *
 * @param {number} userDailyCap
 * @returns {BucketTriple}
 */
function scaleDefaults(userDailyCap) {
  const scale = userDailyCap / FULL_DAILY_CAP_MINUTES;
  return {
    PROJECT: BUCKET_DEFAULT_TARGETS.PROJECT * scale,
    COMMUNICATION: BUCKET_DEFAULT_TARGETS.COMMUNICATION * scale,
    CI: BUCKET_DEFAULT_TARGETS.CI * scale
  };
}

/**
 * Return the per-bucket minimum (50% of the target) for a user with the
 * given daily capacity in minutes.
 *
 * Example:
 *   computeBucketFloors(480) → { PROJECT: 120, COMMUNICATION: 60, CI: 60 }
 *   computeBucketFloors(240) → { PROJECT: 60,  COMMUNICATION: 30, CI: 30 }
 *
 * @param {number} userDailyCap Full daily capacity in minutes (> 0).
 * @returns {BucketTriple}
 */
export function computeBucketFloors(userDailyCap) {
  requireValidCapacity(userDailyCap);
  const t = scaleDefaults(userDailyCap);
  return {
    PROJECT: t.PROJECT * FLOOR_MULTIPLIER,
    COMMUNICATION: t.COMMUNICATION * FLOOR_MULTIPLIER,
    CI: t.CI * FLOOR_MULTIPLIER
  };
}

/**
 * Return the per-bucket pack-to ceiling for a user with the given daily
 * capacity in minutes. PROJECT gets 10% slack; COMMUNICATION + CI get 25%.
 *
 * Example:
 *   computeBucketCeilings(480) → { PROJECT: 264, COMMUNICATION: 150, CI: 150 }
 *   computeBucketCeilings(240) → { PROJECT: 132, COMMUNICATION:  75, CI:  75 }
 *
 * @param {number} userDailyCap Full daily capacity in minutes (> 0).
 * @returns {BucketTriple}
 */
export function computeBucketCeilings(userDailyCap) {
  requireValidCapacity(userDailyCap);
  const t = scaleDefaults(userDailyCap);
  return {
    PROJECT: t.PROJECT * CEILING_MULTIPLIERS.PROJECT,
    COMMUNICATION: t.COMMUNICATION * CEILING_MULTIPLIERS.COMMUNICATION,
    CI: t.CI * CEILING_MULTIPLIERS.CI
  };
}

export default { computeBucketFloors, computeBucketCeilings };
