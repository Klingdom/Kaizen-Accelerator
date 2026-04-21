/**
 * Capacity computation — composer input shape + bucket-target math.
 *
 * Covers:
 *   - E3-T1: `buildComposerInput(deps)` shape (§1.1)
 *   - E3-T2: `computeBucketTargets(user, externalMinutesToday)` per
 *            ENGINE_DESIGN §2.1 with half-day scaling + external drain +
 *            COMMUNICATION floor (60 min, or proportional floor on half-day).
 *
 * Pure; no I/O; fully unit-testable.
 */

import {
  computeBucketFloors,
  computeBucketCeilings,
  FULL_DAILY_CAP_MINUTES
} from '../capacity/floorsAndCeilings.js';

/**
 * @typedef {object} User
 * @property {string} id
 * @property {string[]} role
 * @property {number} dailyCapacityMinutes
 * @property {number[]} [workDays]
 * @property {string} [sprintAnchorDate]
 * @property {string} [timezone]
 * @property {'2x2h' | '4x1h'} [deepSlicePreference]
 */

/**
 * Compute the 4-2-2 bucket targets for a user's day, with half-day scaling
 * and external-meeting drain applied. Mirrors ENGINE_DESIGN §2.1 exactly.
 *
 * Rules (verbatim):
 *   - `scale = user.dailyCapacityMinutes / 480`   (full day = 1.0; half = 0.5)
 *   - `PROJECT target = round(240 × scale)`
 *   - `COMMUNICATION target = round(120 × scale)`
 *   - `CI target = round(120 × scale)`
 *   - External meetings drain COMMUNICATION only.
 *   - COMMUNICATION floor: `max(60, round(60 × scale))` — never below 60 on
 *     a full day; scales on half-day (so 30 on cap=240).
 *
 * Returns `{ PROJECT, COMMUNICATION, CI, _ext, _warnings? }`. The leading-
 * underscore fields are metadata for the composer and UI:
 *   - `_ext`: clamped external minutes (0..240)
 *   - `_warnings`: COMM_FLOOR_VIOLATION warning string (present only when
 *                  external exceeded the available COMM budget, i.e. the
 *                  COMM target is held at floor despite external >= target).
 *
 * @param {User} user
 * @param {number} [externalMinutesToday=0]
 * @returns {{PROJECT: number, COMMUNICATION: number, CI: number, _ext: number, _warnings?: string[]}}
 */
export function computeBucketTargets(user, externalMinutesToday = 0) {
  if (!user || typeof user !== 'object') {
    const err = new Error('computeBucketTargets: user is required');
    err.name = 'INVALID_USER';
    throw err;
  }
  const cap = user.dailyCapacityMinutes;
  if (typeof cap !== 'number' || !Number.isFinite(cap) || cap <= 0) {
    const err = new Error(
      `computeBucketTargets: user.dailyCapacityMinutes must be a positive finite number, got ${cap}`
    );
    err.name = 'INVALID_CAPACITY';
    throw err;
  }

  const scale = cap / FULL_DAILY_CAP_MINUTES;
  const ext = Math.min(Math.max(externalMinutesToday ?? 0, 0), 240);

  const projectTarget = Math.round(240 * scale);
  const commInitial = Math.round(120 * scale);
  const ciTarget = Math.round(120 * scale);

  // COMM floor: never below 60 on full day; scales on half-day.
  const commFloor = Math.max(60, Math.round(60 * scale));
  // If scale < 1 (half-day) the floor sits at `round(60*scale)` (e.g. 30 at
  // cap=240). Math.max(60, ...) would incorrectly pin it to 60 on a
  // half-day — so compute it conditionally.
  const effectiveCommFloor = scale >= 1 ? Math.max(60, Math.round(60 * scale)) : Math.round(60 * scale);

  const commAfterExt = Math.max(effectiveCommFloor, commInitial - ext);

  /** @type {string[]} */
  const warnings = [];
  if (ext > 0 && commAfterExt === effectiveCommFloor && commInitial - ext < effectiveCommFloor) {
    warnings.push(
      `COMM_FLOOR_VIOLATION: external ${ext} min exceeds Communication budget (target ${commInitial}); held at floor ${effectiveCommFloor}.`
    );
  }

  /** @type {any} */
  const out = {
    PROJECT: projectTarget,
    COMMUNICATION: commAfterExt,
    CI: ciTarget,
    _ext: ext
  };
  if (warnings.length) out._warnings = warnings;
  return out;
}

/**
 * Compose the `ComposerInput` contract per ENGINE_DESIGN §1.1. Does NOT
 * mutate inputs; returns a frozen-style object literal.
 *
 * @param {{
 *   cycleType: 'DAILY'|'WEEKLY'|'SPRINT'|'MONTHLY',
 *   user: User,
 *   date: string,
 *   externalMinutesToday?: number,
 *   sprintPhase?: string,
 *   activeKaizen?: object|null,
 *   varianceQueue?: object[],
 *   catalog?: object[],
 *   priorCompositions?: object[],
 *   signals?: {
 *     inboxOverThreshold?: boolean,
 *     documentAwaitingReview?: string[],
 *     innovationStageReady?: string[]
 *   }
 * }} deps
 * @returns {object} A ComposerInput-shaped object
 */
export function buildComposerInput(deps) {
  if (!deps || typeof deps !== 'object') {
    const err = new Error('buildComposerInput: deps object is required');
    err.name = 'INVALID_DEPS';
    throw err;
  }
  if (!deps.cycleType) {
    const err = new Error('buildComposerInput: cycleType is required');
    err.name = 'MISSING_CYCLE_TYPE';
    throw err;
  }
  if (!deps.user) {
    const err = new Error('buildComposerInput: user is required');
    err.name = 'MISSING_USER';
    throw err;
  }
  if (!deps.date) {
    const err = new Error('buildComposerInput: date is required');
    err.name = 'MISSING_DATE';
    throw err;
  }

  const user = deps.user;
  return {
    cycleType: deps.cycleType,
    userId: user.id,
    date: deps.date,
    role: Array.isArray(user.role) ? [...user.role] : [],
    dailyCapacityMinutes: user.dailyCapacityMinutes,
    externalMinutesToday: Math.min(
      Math.max(deps.externalMinutesToday ?? 0, 0),
      240
    ),
    sprintPhase: deps.sprintPhase ?? 'EXECUTION',
    activeKaizen: deps.activeKaizen ?? null,
    varianceQueue: Array.isArray(deps.varianceQueue) ? [...deps.varianceQueue] : [],
    catalog: Array.isArray(deps.catalog) ? [...deps.catalog] : [],
    priorCompositions: Array.isArray(deps.priorCompositions) ? [...deps.priorCompositions] : [],
    signals: {
      inboxOverThreshold: Boolean(deps.signals?.inboxOverThreshold),
      documentAwaitingReview: Array.isArray(deps.signals?.documentAwaitingReview)
        ? [...deps.signals.documentAwaitingReview]
        : [],
      innovationStageReady: Array.isArray(deps.signals?.innovationStageReady)
        ? [...deps.signals.innovationStageReady]
        : []
    }
  };
}

/** Re-export capacity floor/ceiling helpers for callers that only want this module. */
export { computeBucketFloors, computeBucketCeilings };

export default { computeBucketTargets, buildComposerInput };
