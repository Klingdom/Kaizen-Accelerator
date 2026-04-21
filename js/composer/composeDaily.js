/**
 * composeDaily — daily composer skeleton (E3-T3 Sprint 2 scope).
 *
 * This Sprint-2 delivery implements the FIRST THREE STEPS of the 10-step
 * algorithm documented in ENGINE_DESIGN §1.2:
 *
 *   STEP 1 — Compute bucket targets + floors + ceilings.
 *   STEP 2 — Place daily non-optionals (DAILY_NON_OPTIONAL_SET, R1).
 *   STEP 3 — Rescue yesterday's skipped non-optionals (R2).
 *
 * Steps 4–10 (sprint-phase ceremonies, Deep payload, CI rotation, comm
 * filler, ordering, validation, retry, build) are marked TODO and ship in
 * Sprint 3 per DELIVERY_PLAN §4.
 *
 * Output shape (PARTIAL per Sprint 2): an intermediate object with the
 * computed targets + the placed non-optional / varianceRescue drafts +
 * `why[]` audit entries. Sprint 3 replaces this with the full Composition
 * builder (step 10).
 *
 * Pure; no I/O.
 */

import { computeBucketTargets } from '../engine/capacity.js';
import { computeBucketFloors, computeBucketCeilings } from '../capacity/floorsAndCeilings.js';

/**
 * DAILY_NON_OPTIONAL_SET per ENGINE_DESIGN §1.2 heading. Canonical ids from
 * `ceremoniesAndGenerics.js`. The composer resolves these ids in the
 * provided catalog at compose time.
 */
export const DAILY_NON_OPTIONAL_SET = Object.freeze([
  {
    id: 'cer_daily_standup',
    anchor: '09:00',
    defaultMinutes: 15,
    bucket: 'COMMUNICATION',
    name: 'Daily Standup'
  },
  {
    // AM High-value Communication — per §1.2 a 60-min block anchored 09:15.
    // The composer materializes this from generic COMM entry (gen_value_added_communication)
    // with an explicit slot name; catalog #14 is the reference but #14 is
    // not flagged non-optional (see markNonOptional.js rationale).
    id: 'gen_value_added_communication',
    anchor: '09:15',
    defaultMinutes: 60,
    bucket: 'COMMUNICATION',
    name: 'AM High-value Communication',
    slotKind: 'AM_COMM'
  },
  {
    id: 'gen_value_added_communication',
    anchor: '13:00',
    defaultMinutes: 30,
    bucket: 'COMMUNICATION',
    name: 'Post-lunch High-value Communication',
    slotKind: 'POST_LUNCH_COMM'
  },
  {
    id: 'gen_end_of_activity_reflection',
    anchor: '17:00',
    defaultMinutes: 15,
    bucket: 'CI',
    name: 'End-of-Activity Reflection'
  }
]);

/**
 * Does `remaining[bucket]` have room for `minutes`?
 *
 * @param {{PROJECT: number, COMMUNICATION: number, CI: number}} remaining
 * @param {string} bucket
 * @param {number} minutes
 * @returns {boolean}
 */
function fits(remaining, bucket, minutes) {
  return (remaining[bucket] ?? 0) >= minutes;
}

/**
 * Materialize a ScheduledActivity draft. Sprint 2 version — fields known at
 * composer time. Sprint 3 will enrich with plannedStartAt (orderDay) and
 * linkedKaizenId / linkedDmaicStepRef (selectDeepPayload).
 *
 * @param {object} spec
 * @param {string} spec.catalogEntryId
 * @param {string} spec.name
 * @param {string} spec.bucket
 * @param {number} spec.plannedDurationMinutes
 * @param {string} [spec.anchor]
 * @param {string} [spec.slotKind]
 * @param {boolean} [spec.carriedOver]
 * @returns {object}
 */
function materialize(spec) {
  const draft = {
    id: `sa_${spec.catalogEntryId}_${spec.anchor ?? spec.slotKind ?? 'slot'}`,
    catalogEntryId: spec.catalogEntryId,
    name: spec.name,
    bucket: spec.bucket,
    plannedDurationMinutes: spec.plannedDurationMinutes,
    plannedStartAt: null, // Sprint 3: orderDay sets this
    state: 'PROPOSED',
    sourceOfSchedule: 'COMPOSER_AUTO'
  };
  if (spec.slotKind) draft.slotKind = spec.slotKind;
  if (spec.carriedOver) draft.carriedOver = true;
  return draft;
}

/**
 * composeDaily (Sprint 2 skeleton — steps 1–3 only).
 *
 * @param {object} input  ComposerInput per ENGINE_DESIGN §1.1
 * @returns {{
 *   partial: true,
 *   cycleType: 'DAILY',
 *   targets: {PROJECT: number, COMMUNICATION: number, CI: number, _ext: number, _warnings?: string[]},
 *   floors: {PROJECT: number, COMMUNICATION: number, CI: number},
 *   ceilings: {PROJECT: number, COMMUNICATION: number, CI: number},
 *   placed: object[],
 *   varianceQueueRescued: object[],
 *   remaining: {PROJECT: number, COMMUNICATION: number, CI: number},
 *   why: Array<{ref: string, rule: string, detail: string}>,
 *   todo: string[]
 * }}
 */
export function composeDaily(input) {
  if (!input || typeof input !== 'object') {
    const err = new Error('composeDaily: input is required');
    err.name = 'INVALID_INPUT';
    throw err;
  }
  if (input.cycleType !== 'DAILY') {
    const err = new Error(`composeDaily: cycleType must be DAILY, got '${input.cycleType}'`);
    err.name = 'INVALID_CYCLE_TYPE';
    throw err;
  }

  // ---------------------------------------------------------------------
  // STEP 1 — Compute bucket targets + floors + ceilings.
  // ---------------------------------------------------------------------
  const user = {
    id: input.userId,
    dailyCapacityMinutes: input.dailyCapacityMinutes,
    role: input.role ?? []
  };
  const targets = computeBucketTargets(user, input.externalMinutesToday ?? 0);
  const floors = computeBucketFloors(input.dailyCapacityMinutes);
  const ceilings = computeBucketCeilings(input.dailyCapacityMinutes);

  const remaining = {
    PROJECT: targets.PROJECT,
    COMMUNICATION: targets.COMMUNICATION,
    CI: targets.CI
  };
  /** @type {object[]} */
  const placed = [];
  /** @type {Array<{ref: string, rule: string, detail: string}>} */
  const why = [];

  // ---------------------------------------------------------------------
  // STEP 2 — Place daily non-optionals (R1).
  //
  // NOTE: The AM + Post-lunch Communication blocks may need shrinking to
  // fit the reduced COMMUNICATION target after external drain. Per §1.9
  // the composer protects PRESENCE over LENGTH: every block is kept, but
  // sizes are reduced proportionally. Sprint 2 implements a simple
  // proportional shrink across the two shrinkable Communication slots
  // (Standup's 15-min anchor is fixed).
  // ---------------------------------------------------------------------

  // First, identify how much COMM the Standup consumes (always fixed at 15).
  const standupSpec = DAILY_NON_OPTIONAL_SET.find((s) => s.slotKind === undefined && s.bucket === 'COMMUNICATION');
  const standupMinutes = standupSpec?.defaultMinutes ?? 15;

  // The two shrinkable COMM slots are the AM + Post-lunch blocks.
  const amSpec = DAILY_NON_OPTIONAL_SET.find((s) => s.slotKind === 'AM_COMM');
  const postSpec = DAILY_NON_OPTIONAL_SET.find((s) => s.slotKind === 'POST_LUNCH_COMM');
  const amDefault = amSpec?.defaultMinutes ?? 60;
  const postDefault = postSpec?.defaultMinutes ?? 30;

  const commBudget = targets.COMMUNICATION;
  const commNeeded = standupMinutes + amDefault + postDefault;

  let amMinutes = amDefault;
  let postMinutes = postDefault;

  if (commNeeded > commBudget) {
    // Shrink AM + Post proportionally; Standup is inviolate.
    const shrinkable = amDefault + postDefault;
    const available = Math.max(0, commBudget - standupMinutes);
    if (available <= 0) {
      // Not enough room even for Standup + minimum-viable slots. Fall back
      // to 0/0 on AM/Post — still preserves presence via 1-minute? No,
      // fall back to the minimum presence of 1 min each so rows aren't
      // dropped. Sprint-3 INFEASIBLE path handles this more cleanly.
      amMinutes = 1;
      postMinutes = 1;
    } else {
      amMinutes = Math.max(1, Math.round((amDefault / shrinkable) * available));
      postMinutes = Math.max(1, available - amMinutes);
    }
  }

  for (const spec of DAILY_NON_OPTIONAL_SET) {
    let minutes = spec.defaultMinutes;
    if (spec.slotKind === 'AM_COMM') minutes = amMinutes;
    else if (spec.slotKind === 'POST_LUNCH_COMM') minutes = postMinutes;

    const draft = materialize({
      catalogEntryId: spec.id,
      name: spec.name,
      bucket: spec.bucket,
      plannedDurationMinutes: minutes,
      anchor: spec.anchor,
      slotKind: spec.slotKind
    });
    placed.push(draft);
    remaining[spec.bucket] = Math.max(0, (remaining[spec.bucket] ?? 0) - minutes);
    why.push({
      ref: spec.id,
      rule: 'R1_NON_OPTIONAL',
      detail: `${spec.name} @ ${spec.anchor} (${minutes}m)`
    });
  }

  // ---------------------------------------------------------------------
  // STEP 3 — Rescue yesterday's skipped non-optionals (R2).
  // ---------------------------------------------------------------------
  /** @type {object[]} */
  const varianceQueueRescued = [];
  const catalog = Array.isArray(input.catalog) ? input.catalog : [];
  const varianceQueue = Array.isArray(input.varianceQueue) ? input.varianceQueue : [];

  for (const v of varianceQueue) {
    if (v.kind !== 'SKIPPED_NON_OPTIONAL') continue;
    const entry = catalog.find((c) => c.id === v.catalogEntryId);
    if (!entry) continue;
    const bucket = entry.bucket;
    const minutes = entry.defaultDurationMinutes;
    if (!bucket || typeof minutes !== 'number' || minutes <= 0) continue;
    if (!fits(remaining, bucket, minutes)) continue;

    const draft = materialize({
      catalogEntryId: entry.id,
      name: entry.name,
      bucket,
      plannedDurationMinutes: minutes,
      carriedOver: true
    });
    placed.push(draft);
    varianceQueueRescued.push(draft);
    remaining[bucket] -= minutes;
    why.push({
      ref: entry.id,
      rule: 'R2_VARIANCE_RESCUE',
      detail: `carried from ${v.loggedAt ?? 'prior cycle'}`
    });
  }

  // ---------------------------------------------------------------------
  // STEPS 4–10 — TODO (Sprint 3).
  // ---------------------------------------------------------------------
  const todo = [
    'STEP_4_PHASE_CEREMONIES',
    'STEP_5_DEEP_PAYLOAD',
    'STEP_6_CI_ROTATION',
    'STEP_7_COMM_FILLER',
    'STEP_8_ORDER_DAY',
    'STEP_9_VALIDATE',
    'STEP_10_BUILD_COMPOSITION'
  ];

  return {
    partial: true,
    cycleType: 'DAILY',
    targets,
    floors,
    ceilings,
    placed,
    varianceQueueRescued,
    remaining,
    why,
    todo
  };
}

export default composeDaily;
