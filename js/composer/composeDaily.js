/**
 * composeDaily — daily composer, all 10 steps (E3-T3 Sprint 3 complete).
 *
 * Implements ENGINE_DESIGN §1.2 end-to-end:
 *
 *   STEP 1 — Compute bucket targets + floors + ceilings.         (Sprint 2)
 *   STEP 2 — Place daily non-optionals (R1).                     (Sprint 2)
 *   STEP 3 — Rescue yesterday's skipped non-optionals (R2).      (Sprint 2)
 *   STEP 4 — Sprint-phase ceremonies (R4).                       (Sprint 3)
 *   STEP 5 — Deep Work payload (R3 DMAIC / generic).             (Sprint 3)
 *   STEP 6 — CI rotation fill (pickCI).                          (Sprint 3)
 *   STEP 7 — COMMUNICATION filler (pickCommFiller).              (Sprint 3)
 *   STEP 8 — Order day (orderDay).                               (Sprint 3)
 *   STEP 9 — Validate (validateComposition + relaxConfigurable). (Sprint 3)
 *   STEP 10 — Build Composition + emit CycleProposed.            (Sprint 3)
 *
 * Pure composer — the only side effect is optional `cycleProposedEvent`
 * construction when `emit` is provided (persistence + event publication are
 * handled by ComposerService, which wraps this pure composer).
 */

import { computeBucketTargets } from '../engine/capacity.js';
import {
  computeBucketFloors,
  computeBucketCeilings
} from '../capacity/floorsAndCeilings.js';
import { selectDeepPayload } from '../engine/selectDeepPayload.js';
import { pickCI, ciPriority } from '../engine/pickCI.js';
import { pickCommFiller } from '../engine/pickCommFiller.js';
import { orderDay } from '../engine/orderDay.js';
import { validateComposition } from '../engine/validateComposition.js';
import { relaxConfigurable } from '../engine/relaxConfigurable.js';
import { injectLunchBlock } from './lunchBlock.js'; // Iter 26: STEP 8.5

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
  // Iter 38 Phase B (SW-Q6 / SW-Q7): End-of-deep-cycles comm anchor.
  // Fixed at 15:30, 15 min, COMMUNICATION bucket. Brings COMM total to
  // 15+60+30+15 = 120 min, satisfying the 4-2-2 COMMUNICATION target.
  // slotKind POST_DEEP_COMM distinguishes this from AM_COMM / POST_LUNCH_COMM.
  {
    id: 'gen_value_added_communication',
    anchor: '15:30',
    defaultMinutes: 15,
    bucket: 'COMMUNICATION',
    name: 'End-of-Deep-Cycles Communication',
    slotKind: 'POST_DEEP_COMM'
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
 * SPRINT_CEREMONIES — step-4 phase-specific placements.
 *
 *  PLANNING_DAY  — Sprint Planning (120 min, Mon Wk1, 09:30)
 *  MID_SPRINT_DAY — Mid-Sprint Review (30 min, Fri Wk1, 15:00)
 *  REVIEW_DAY    — Sprint Review (60 min, Fri Wk2, 14:00) + Retrospective (30 min, 15:00)
 */
export const SPRINT_CEREMONIES = Object.freeze({
  PLANNING_DAY: Object.freeze([
    {
      id: 'cer_sprint_planning',
      anchor: '09:30',
      defaultMinutes: 120,
      bucket: 'CI', // user reclassification 2026-04-22: ceremonies are CI work
      name: 'Sprint Planning'
    }
  ]),
  MID_SPRINT_DAY: Object.freeze([
    {
      id: 'cer_mid_sprint_review',
      anchor: '15:00',
      defaultMinutes: 30,
      bucket: 'COMMUNICATION', // live checkpoint — stays COMM
      name: 'Mid-Sprint Review'
    }
  ]),
  REVIEW_DAY: Object.freeze([
    {
      id: 'cer_sprint_review',
      anchor: '14:00',
      defaultMinutes: 60,
      bucket: 'CI', // user reclassification 2026-04-22
      name: 'Sprint Review'
    },
    {
      id: 'cer_sprint_retrospective',
      anchor: '15:00',
      defaultMinutes: 30,
      bucket: 'CI', // user reclassification 2026-04-22
      name: 'Sprint Retrospective'
    }
  ])
});

/**
 * Compute sprint-phase anchor day flags for the target date using
 * `User.sprintAnchorDate` as the reference Monday Wk1.
 *
 *  - PLANNING_DAY: target date === sprintAnchorDate (Mon Wk1)
 *  - MID_SPRINT_DAY: target date = sprintAnchorDate + 4 days (Fri Wk1)
 *  - REVIEW_DAY: target date = sprintAnchorDate + 11 days (Fri Wk2)
 *
 * @param {string} targetDateIso
 * @param {string|undefined} sprintAnchorDateIso
 * @returns {{isPlanningDay: boolean, isMidSprintDay: boolean, isReviewDay: boolean}}
 */
export function sprintCeremonyDays(targetDateIso, sprintAnchorDateIso) {
  if (!targetDateIso || !sprintAnchorDateIso) {
    return { isPlanningDay: false, isMidSprintDay: false, isReviewDay: false };
  }
  const anchor = new Date(`${sprintAnchorDateIso}T00:00:00Z`);
  const target = new Date(`${targetDateIso}T00:00:00Z`);
  const dayMs = 24 * 60 * 60 * 1000;
  const diffDays = Math.round((target - anchor) / dayMs);
  return {
    isPlanningDay: diffDays === 0,
    isMidSprintDay: diffDays === 4,
    isReviewDay: diffDays === 11
  };
}

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
 * Materialize a ScheduledActivity draft.
 *
 * @param {object} spec
 * @returns {object}
 */
function materialize(spec) {
  const draft = {
    id: spec.id ?? `sa_${spec.catalogEntryId}_${spec.anchor ?? spec.slotKind ?? spec.idSuffix ?? 'slot'}`,
    catalogEntryId: spec.catalogEntryId,
    name: spec.name,
    bucket: spec.bucket,
    plannedDurationMinutes: spec.plannedDurationMinutes,
    plannedStartAt: spec.plannedStartAt ?? null,
    state: 'PROPOSED',
    sourceOfSchedule: 'COMPOSER_AUTO'
  };
  if (spec.slotKind) draft.slotKind = spec.slotKind;
  if (spec.anchor) draft.anchor = spec.anchor;
  if (spec.carriedOver) draft.carriedOver = true;
  if (spec.linkedKaizenId) draft.linkedKaizenId = spec.linkedKaizenId;
  if (spec.linkedDmaicStepRef) draft.linkedDmaicStepRef = spec.linkedDmaicStepRef;
  if (spec.sliceIndex !== undefined) draft.sliceIndex = spec.sliceIndex;
  if (typeof spec.ciPriority === 'number') draft.ciPriority = spec.ciPriority;
  return draft;
}

/**
 * Slice a Deep payload block per `User.deepSlicePreference`. Returns an
 * array of `{ minutes }` slices whose sum <= `remainingProject`.
 *
 * @param {number} totalMinutes
 * @param {'2x2h' | '4x1h'} [pref='2x2h']
 * @param {number} [remainingProject=Number.POSITIVE_INFINITY]
 * @returns {{minutes: number}[]}
 */
export function sliceDeep(totalMinutes, pref = '2x2h', remainingProject = Number.POSITIVE_INFINITY) {
  const cap = Math.min(totalMinutes, remainingProject);
  if (cap <= 0) return [];
  if (pref === '4x1h') {
    // Target: 4 × 60-min slices.
    const slices = [];
    let left = cap;
    for (let i = 0; i < 4 && left >= 60; i += 1) {
      slices.push({ minutes: 60 });
      left -= 60;
    }
    if (slices.length === 0) {
      // fallback — single slice
      slices.push({ minutes: cap });
    }
    return slices;
  }
  // default 2x2h
  const half = Math.floor(cap / 2);
  if (half <= 0) return [{ minutes: cap }];
  const s1 = half;
  const s2 = cap - half;
  if (s2 <= 0) return [{ minutes: s1 }];
  return [{ minutes: s1 }, { minutes: s2 }];
}

/**
 * Attempt to grow a generic Deep block when PROJECT has slack after DMAIC
 * slices. Returns the top-up minutes (possibly 0).
 */
function deepTopUpMinutes(remainingProject) {
  return Math.max(0, remainingProject);
}

/**
 * composeDaily — all 10 steps.
 *
 * @param {object} input  ComposerInput per ENGINE_DESIGN §1.1
 * @returns {object}
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
  // ---------------------------------------------------------------------
  const standupSpec = DAILY_NON_OPTIONAL_SET.find(
    (s) => s.slotKind === undefined && s.bucket === 'COMMUNICATION'
  );
  const standupMinutes = standupSpec?.defaultMinutes ?? 15;
  const amSpec = DAILY_NON_OPTIONAL_SET.find((s) => s.slotKind === 'AM_COMM');
  const postSpec = DAILY_NON_OPTIONAL_SET.find((s) => s.slotKind === 'POST_LUNCH_COMM');
  const postDeepSpec = DAILY_NON_OPTIONAL_SET.find((s) => s.slotKind === 'POST_DEEP_COMM');
  const amDefault = amSpec?.defaultMinutes ?? 60;
  const postDefault = postSpec?.defaultMinutes ?? 30;
  const postDeepDefault = postDeepSpec?.defaultMinutes ?? 15;

  const commBudget = targets.COMMUNICATION;
  // Iter 38: commNeeded now includes the POST_DEEP_COMM anchor (15 min).
  // On full-day (cap=480) budget=120: 15+60+30+15=120 exactly, no shrink needed.
  const commNeeded = standupMinutes + amDefault + postDefault + postDeepDefault;

  let amMinutes = amDefault;
  let postMinutes = postDefault;
  let postDeepMinutes = postDeepDefault;

  if (commNeeded > commBudget) {
    // Shrink AM and Post-lunch proportionally; keep Standup and POST_DEEP_COMM
    // at their defaults (POST_DEEP_COMM at 15 min is already minimal).
    const shrinkable = amDefault + postDefault;
    const available = Math.max(0, commBudget - standupMinutes - postDeepDefault);
    if (available <= 0) {
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
    else if (spec.slotKind === 'POST_DEEP_COMM') minutes = postDeepMinutes;

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
  // STEP 4 — Sprint-phase ceremonies (R4).
  //
  // Per ENGINE_DESIGN §3.3 + §1.2 step 4. Dates computed from
  // User.sprintAnchorDate passed through on input (we accept
  // input.user.sprintAnchorDate OR input.sprintAnchorDate OR we derive
  // nothing if absent).
  // ---------------------------------------------------------------------
  const sprintAnchor =
    input.user?.sprintAnchorDate ??
    input.sprintAnchorDate ??
    null;
  const { isPlanningDay, isMidSprintDay, isReviewDay } = sprintCeremonyDays(
    input.date,
    sprintAnchor
  );

  const phaseCeremonies = [];
  if (isPlanningDay) phaseCeremonies.push(...SPRINT_CEREMONIES.PLANNING_DAY);
  if (isMidSprintDay) phaseCeremonies.push(...SPRINT_CEREMONIES.MID_SPRINT_DAY);
  if (isReviewDay) phaseCeremonies.push(...SPRINT_CEREMONIES.REVIEW_DAY);

  for (const cer of phaseCeremonies) {
    if (!fits(remaining, cer.bucket, cer.defaultMinutes)) {
      // Phase ceremonies are non-optional; if they don't fit, we surface an
      // INFEASIBLE at validation time.
      why.push({
        ref: cer.id,
        rule: 'R4_PHASE_CEREMONY',
        detail: `${cer.name} could not fit — will surface at validate`
      });
    }
    const draft = materialize({
      catalogEntryId: cer.id,
      name: cer.name,
      bucket: cer.bucket,
      plannedDurationMinutes: cer.defaultMinutes,
      anchor: cer.anchor
    });
    placed.push(draft);
    remaining[cer.bucket] = Math.max(0, (remaining[cer.bucket] ?? 0) - cer.defaultMinutes);
    why.push({
      ref: cer.id,
      rule: 'R4_PHASE_CEREMONY',
      detail: `${cer.name} @ ${cer.anchor}`
    });
  }

  // ---------------------------------------------------------------------
  // STEP 5 — Deep Work payload (R3 DMAIC link OR generic).
  // ---------------------------------------------------------------------
  let deepEntry = null;
  let deepMinutesPlanned = 0;
  if (remaining.PROJECT > 0) {
    deepEntry = selectDeepPayload(input);
    if (deepEntry) {
      const deepDuration =
        typeof deepEntry.defaultDurationMinutes === 'number'
          ? deepEntry.defaultDurationMinutes
          : remaining.PROJECT;
      deepMinutesPlanned = Math.min(deepDuration, remaining.PROJECT);

      const pref = input.user?.deepSlicePreference ?? input.deepSlicePreference ?? '2x2h';
      const slices = sliceDeep(deepMinutesPlanned, pref, remaining.PROJECT);

      // Track 4x1h interruption case: if fewer than 4 morning/afternoon slots
      // remain, drop to 3x1h and record a why entry.
      if (pref === '4x1h' && slices.length < 4) {
        why.push({
          ref: deepEntry.id,
          rule: 'R5_DEEP_PAYLOAD',
          detail: 'deep_sliced_3_of_4_interruption'
        });
      }

      const linkedKaizenId = input.activeKaizen?.id ?? null;
      const linkedDmaicStepRef = input.activeKaizen
        ? { kaizenId: input.activeKaizen.id, catalogEntryId: deepEntry.id }
        : null;

      for (let i = 0; i < slices.length; i += 1) {
        const s = slices[i];
        const draft = materialize({
          catalogEntryId: deepEntry.id,
          name: deepEntry.name,
          bucket: 'PROJECT',
          plannedDurationMinutes: s.minutes,
          linkedKaizenId,
          linkedDmaicStepRef,
          sliceIndex: i + 1,
          idSuffix: `slice${i + 1}`
        });
        placed.push(draft);
        remaining.PROJECT -= s.minutes;
        why.push({
          ref: deepEntry.id,
          rule: linkedKaizenId ? 'R3_KAIZEN_LINK' : 'R5_DEEP_PAYLOAD',
          detail: `${deepEntry.name} slice ${i + 1}/${slices.length} (${s.minutes}m)`
        });
      }

      // Top-up PROJECT with generic Deep if there's slack.
      const topUp = deepTopUpMinutes(remaining.PROJECT);
      if (topUp > 0 && deepEntry.id !== 'gen_deep_work_project') {
        const generic = catalog.find((c) => c.id === 'gen_deep_work_project');
        if (generic) {
          const draft = materialize({
            catalogEntryId: generic.id,
            name: generic.name,
            bucket: 'PROJECT',
            plannedDurationMinutes: topUp,
            idSuffix: 'topup'
          });
          placed.push(draft);
          remaining.PROJECT = 0;
          why.push({
            ref: generic.id,
            rule: 'R5_DEEP_PAYLOAD',
            detail: `PROJECT top-up ${topUp}m (generic Deep)`
          });
        }
      }
    }
  }

  // ---------------------------------------------------------------------
  // STEP 6 — CI rotation fill.
  // ---------------------------------------------------------------------
  let ciGuard = 16;
  while (remaining.CI >= 30 && ciGuard > 0) {
    ciGuard -= 1;
    const next = pickCI(input, placed, remaining.CI);
    if (!next) break;
    const draft = materialize({
      catalogEntryId: next.entry.id,
      name: next.entry.name,
      bucket: 'CI',
      plannedDurationMinutes: next.minutes,
      ciPriority: next.priority
    });
    placed.push(draft);
    remaining.CI -= next.minutes;
    why.push({
      ref: next.entry.id,
      rule: 'R6_CI_ROTATION',
      detail: `${next.entry.name} — ${next.reason}`
    });
  }

  // ---------------------------------------------------------------------
  // STEP 7 — COMMUNICATION filler.
  // ---------------------------------------------------------------------
  let commGuard = 16;
  while (remaining.COMMUNICATION >= 15 && commGuard > 0) {
    commGuard -= 1;
    const next = pickCommFiller(input, placed, remaining.COMMUNICATION);
    if (!next) break;
    const draft = materialize({
      catalogEntryId: next.entry.id,
      name: next.entry.name,
      bucket: 'COMMUNICATION',
      plannedDurationMinutes: next.minutes
    });
    placed.push(draft);
    remaining.COMMUNICATION -= next.minutes;
    why.push({
      ref: next.entry.id,
      rule: 'R7_COMM_FILLER',
      detail: `${next.entry.name} — ${next.reason}`
    });
  }

  // ---------------------------------------------------------------------
  // STEP 8 — Order the day (sets plannedStartAt on each block).
  // ---------------------------------------------------------------------
  orderDay(placed, input);

  // ---------------------------------------------------------------------
  // STEP 8.5 — Inject lunch block (Iter 26).
  //
  // Runs AFTER orderDay so the packer never sees the lunch row (it would
  // pack it into the morning or afternoon block sequence).
  // Runs BEFORE validate so validators can see the lunch row.
  // bucket===null means validateComposition skips it in all capacity sums.
  // §6.5 hit: 1 of 3 approved modifications to this file.
  // ---------------------------------------------------------------------
  injectLunchBlock(placed, input);

  // ---------------------------------------------------------------------
  // STEP 9 — Validate + relax.
  // ---------------------------------------------------------------------
  const doValidate = (acts) =>
    validateComposition({
      cycleType: 'DAILY',
      activities: acts,
      userDailyCapacityMinutes: input.dailyCapacityMinutes,
      externalMinutesToday: input.externalMinutesToday ?? 0
    });

  let finalPlaced = placed;
  let validation = doValidate(finalPlaced);
  let relaxedDrops = [];

  if (!validation.ok && (
    validation.failureCode === 'OVER_CAPACITY' ||
    validation.failureCode === 'PROJECT_OVERPACKED' ||
    validation.failureCode === 'COMM_OVERPACKED' ||
    validation.failureCode === 'CI_OVERPACKED'
  )) {
    const relaxed = relaxConfigurable(finalPlaced, doValidate);
    finalPlaced = relaxed.placed;
    relaxedDrops = relaxed.dropped;
    validation = relaxed.result;
    for (const d of relaxedDrops) {
      why.push({
        ref: d.catalogEntryId,
        rule: 'R9_RELAXED',
        detail: `dropped ${d.name} (${d.plannedDurationMinutes}m) to meet invariants`
      });
    }
  }

  if (!validation.ok) {
    // Build an InfeasibleResult per ENGINE_DESIGN §4.7.
    const totalReq = finalPlaced.reduce(
      (s, a) => s + (a.plannedDurationMinutes ?? 0),
      0
    );
    const effCap =
      input.dailyCapacityMinutes - (input.externalMinutesToday ?? 0);
    const infeasible = {
      kind: 'INFEASIBLE',
      totalRequiredMinutes: totalReq,
      capacityMinutes: effCap,
      shortfallMinutes: Math.max(0, totalReq - effCap),
      bucketShortfalls: {
        PROJECT: Math.max(
          0,
          finalPlaced.filter((a) => a.bucket === 'PROJECT').reduce(
            (s, a) => s + (a.plannedDurationMinutes ?? 0),
            0
          ) - ceilings.PROJECT
        ),
        COMMUNICATION: Math.max(
          0,
          finalPlaced
            .filter((a) => a.bucket === 'COMMUNICATION')
            .reduce((s, a) => s + (a.plannedDurationMinutes ?? 0), 0) -
            ceilings.COMMUNICATION
        ),
        CI: Math.max(
          0,
          finalPlaced
            .filter((a) => a.bucket === 'CI')
            .reduce((s, a) => s + (a.plannedDurationMinutes ?? 0), 0) - ceilings.CI
        )
      },
      suggestedActions: [
        {
          kind: 'RAISE_CAPACITY',
          currentMinutes: input.dailyCapacityMinutes,
          suggestedMinutes: input.dailyCapacityMinutes + 60
        },
        {
          kind: 'REDUCE_EXTERNAL',
          currentExternalMinutes: input.externalMinutesToday ?? 0,
          suggestedExternalMinutes: 0
        }
      ],
      explain: [
        `Required ${totalReq} min; capacity ${effCap} min.`,
        `Validation failed on ${validation.failureCode}.`
      ],
      validation
    };
    return {
      state: 'INFEASIBLE',
      partial: false,
      cycleType: 'DAILY',
      reason: validation.failureCode,
      detail: validation.detail,
      infeasible,
      targets,
      floors,
      ceilings,
      placed: finalPlaced,
      varianceQueueRescued,
      remaining,
      why,
      validation,
      todo: []
    };
  }

  // ---------------------------------------------------------------------
  // STEP 10 — Build Composition (PROPOSED), freeze composerInputsSnapshot,
  // attach invariantChecks, optionally emit CycleProposed.
  // ---------------------------------------------------------------------
  const compositionId = `comp_${input.userId}_${input.date}`;
  const composition = {
    id: compositionId,
    userId: input.userId,
    cycleType: 'DAILY',
    // v0.6 bug-fix (Sprint 6 P1-T3): force UTC suffix so downstream code
    // that parses `startAt` as a Date doesn't flip the anchor across
    // timezones. ActivityService._deriveRefDate() retains a defensive
    // fallback for legacy rows.
    startAt: `${input.date}T00:00:00Z`,
    endAt: `${input.date}T23:59:59Z`,
    parentCompositionId: null,
    state: 'PROPOSED',
    proposedAt: input._now ?? new Date().toISOString(),
    decidedAt: null,
    closedAt: null,
    composerInputsSnapshot: {
      role: Array.isArray(input.role) ? [...input.role] : [],
      capacityMinutes: input.dailyCapacityMinutes,
      externalMinutesToday: input.externalMinutesToday ?? 0,
      sprintPhase: input.sprintPhase ?? 'EXECUTION',
      activeKaizenId: input.activeKaizen?.id ?? null,
      varianceCount: Array.isArray(input.varianceQueue) ? input.varianceQueue.length : 0,
      explain: why
    },
    invariantChecks: validation.detail,
    date: input.date,
    activities: finalPlaced.map((a) => ({
      ...a,
      compositionId,
      state: 'PROPOSED',
      sourceOfSchedule: 'COMPOSER_AUTO'
    }))
  };

  // Optional event construction (caller's ComposerService.persists + publishes).
  const cycleProposedEvent = {
    event: 'CycleProposed',
    payload: {
      compositionId,
      userId: input.userId,
      cycleType: 'DAILY',
      date: input.date
    }
  };

  return {
    state: 'PROPOSED',
    partial: false,
    cycleType: 'DAILY',
    composition,
    targets,
    floors,
    ceilings,
    placed: finalPlaced,
    varianceQueueRescued,
    remaining,
    why,
    validation,
    cycleProposedEvent,
    // Sprint-2 compatibility fields retained for existing tests:
    todo: []
  };
}

export default composeDaily;
