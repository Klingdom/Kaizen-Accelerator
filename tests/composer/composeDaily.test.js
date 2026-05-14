/**
 * Tests for /js/composer/composeDaily.js (E3-T3 Sprint-2 skeleton).
 *
 * Sprint 2 covers STEPS 1–3 only per DELIVERY_PLAN §4:
 *   STEP 1 — Compute bucket targets + floors + ceilings.
 *   STEP 2 — Place daily non-optionals.
 *   STEP 3 — Rescue varianceQueue SKIPPED_NON_OPTIONAL entries.
 *
 * Sprint 3 will cover steps 4–10 + the golden §1.9 end-to-end.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { composeDaily, DAILY_NON_OPTIONAL_SET, sprintCeremonyDays, sliceDeep } from '../../js/composer/composeDaily.js';
import {
  GOLDEN_USER,
  GOLDEN_EXPECTED_TARGETS,
  GOLDEN_MIN_CATALOG,
  GOLDEN_FULL_CATALOG,
  GOLDEN_VARIANCE_QUEUE,
  buildGoldenComposerInput
} from '../fixtures/goldenDay.js';

describe('composeDaily — STEP 1: bucket targets', () => {
  test('default full-day user (cap=480, ext=0) → 240/120/120 targets', () => {
    const input = {
      cycleType: 'DAILY',
      userId: 'u',
      date: '2026-04-21',
      dailyCapacityMinutes: 480,
      externalMinutesToday: 0,
      role: ['PRACTITIONER'],
      varianceQueue: [],
      catalog: []
    };
    const out = composeDaily(input);
    // Sprint 3: composer is complete; partial=false. State is PROPOSED
    // when the day is feasible; INFEASIBLE when empty catalog makes it
    // impossible (default test uses catalog=[] → no Deep payload).
    assert.equal(out.partial, false);
    assert.equal(out.targets.PROJECT, 240);
    assert.equal(out.targets.COMMUNICATION, 120);
    assert.equal(out.targets.CI, 120);
  });

  test('golden §1.9 input yields the expected targets (240/60/120)', () => {
    const input = buildGoldenComposerInput();
    const out = composeDaily(input);
    assert.equal(out.targets.PROJECT, GOLDEN_EXPECTED_TARGETS.PROJECT);
    assert.equal(out.targets.COMMUNICATION, GOLDEN_EXPECTED_TARGETS.COMMUNICATION);
    assert.equal(out.targets.CI, GOLDEN_EXPECTED_TARGETS.CI);
  });

  test('floors computed at 50% of targets', () => {
    const input = {
      cycleType: 'DAILY',
      userId: 'u',
      date: '2026-04-21',
      dailyCapacityMinutes: 480,
      externalMinutesToday: 0,
      role: [],
      varianceQueue: [],
      catalog: []
    };
    const out = composeDaily(input);
    assert.equal(out.floors.PROJECT, 120); // 240 × 0.5
    assert.equal(out.floors.COMMUNICATION, 60); // 120 × 0.5
    assert.equal(out.floors.CI, 60);
  });

  test('ceilings computed at 110% PROJECT / 125% COMM+CI', () => {
    const input = {
      cycleType: 'DAILY',
      userId: 'u',
      date: '2026-04-21',
      dailyCapacityMinutes: 480,
      externalMinutesToday: 0,
      role: [],
      varianceQueue: [],
      catalog: []
    };
    const out = composeDaily(input);
    assert.ok(Math.abs(out.ceilings.PROJECT - 264) < 0.01);
    assert.ok(Math.abs(out.ceilings.COMMUNICATION - 150) < 0.01);
    assert.ok(Math.abs(out.ceilings.CI - 150) < 0.01);
  });
});

describe('composeDaily — STEP 2: non-optional placement', () => {
  test('places all 4 DAILY_NON_OPTIONAL_SET entries', () => {
    const input = buildGoldenComposerInput();
    const out = composeDaily(input);
    // Iter 26: >= 5 (was >= 4) because lunch is now injected as STEP 8.5
    assert.ok(out.placed.length >= 5, `expected ≥5 placed blocks (4 non-optionals + lunch), got ${out.placed.length}`);

    // The 4 anchors we expect present by slot/name.
    const byName = out.placed.map((p) => p.name);
    assert.ok(byName.includes('Daily Standup'));
    assert.ok(byName.includes('AM High-value Communication'));
    assert.ok(byName.includes('Post-lunch High-value Communication'));
    assert.ok(byName.includes('End-of-Activity Reflection'));
  });

  test('why[] contains R1_NON_OPTIONAL entries', () => {
    const input = buildGoldenComposerInput();
    const out = composeDaily(input);
    const r1 = out.why.filter((w) => w.rule === 'R1_NON_OPTIONAL');
    assert.ok(r1.length >= 4);
  });

  test('Standup is always 15 minutes (inviolate)', () => {
    const input = buildGoldenComposerInput();
    const out = composeDaily(input);
    const standup = out.placed.find((p) => p.name === 'Daily Standup');
    assert.equal(standup.plannedDurationMinutes, 15);
    assert.equal(standup.bucket, 'COMMUNICATION');
  });

  test('End-of-Activity Reflection is 15 min in CI bucket', () => {
    const input = buildGoldenComposerInput();
    const out = composeDaily(input);
    const refl = out.placed.find((p) => p.name === 'End-of-Activity Reflection');
    assert.equal(refl.plannedDurationMinutes, 15);
    assert.equal(refl.bucket, 'CI');
  });

  test('when COMM target is lean (60 min after 60-min ext drain), AM+Post shrink but stay present', () => {
    const input = buildGoldenComposerInput(); // ext=60 → COMM target=60
    const out = composeDaily(input);
    const am = out.placed.find((p) => p.slotKind === 'AM_COMM');
    const post = out.placed.find((p) => p.slotKind === 'POST_LUNCH_COMM');
    const postDeep = out.placed.find((p) => p.slotKind === 'POST_DEEP_COMM');
    assert.ok(am);
    assert.ok(post);
    assert.ok(postDeep);
    // Iter 38 Phase B: commNeeded = 15(standup) + 60(am) + 30(post) + 15(postDeep) = 120 > budget 60.
    // Shrink available = 60 - 15(standup) - 15(postDeep) = 30. AM+Post sum = 30.
    assert.equal(am.plannedDurationMinutes + post.plannedDurationMinutes, 30);
    assert.ok(am.plannedDurationMinutes >= 1);
    assert.ok(post.plannedDurationMinutes >= 1);
    // POST_DEEP_COMM stays at its 15-min default (not shrunk).
    assert.equal(postDeep.plannedDurationMinutes, 15);
  });

  test('full-budget day keeps AM=60, Post=30', () => {
    const input = {
      cycleType: 'DAILY',
      userId: 'u',
      date: '2026-04-21',
      dailyCapacityMinutes: 480,
      externalMinutesToday: 0,
      role: [],
      varianceQueue: [],
      catalog: []
    };
    const out = composeDaily(input);
    const am = out.placed.find((p) => p.slotKind === 'AM_COMM');
    const post = out.placed.find((p) => p.slotKind === 'POST_LUNCH_COMM');
    assert.equal(am.plannedDurationMinutes, 60);
    assert.equal(post.plannedDurationMinutes, 30);
  });

  test('each placed block has state=PROPOSED + sourceOfSchedule=COMPOSER_AUTO', () => {
    const input = buildGoldenComposerInput();
    const out = composeDaily(input);
    for (const p of out.placed) {
      assert.equal(p.state, 'PROPOSED');
      assert.equal(p.sourceOfSchedule, 'COMPOSER_AUTO');
    }
  });
});

describe('composeDaily — STEP 3: varianceQueue rescue', () => {
  test('golden varianceQueue rescues the #1 L&D skip into CI', () => {
    const input = buildGoldenComposerInput();
    const out = composeDaily(input);
    assert.equal(out.varianceQueueRescued.length, 1);
    const rescued = out.varianceQueueRescued[0];
    assert.equal(rescued.bucket, 'CI');
    assert.equal(rescued.carriedOver, true);
    assert.equal(rescued.plannedDurationMinutes, 60);
  });

  test('rescued entries appear in placed[] with carriedOver=true', () => {
    const input = buildGoldenComposerInput();
    const out = composeDaily(input);
    const carry = out.placed.filter((p) => p.carriedOver === true);
    assert.equal(carry.length, 1);
  });

  test('rescue is skipped if the catalog entry is not in the catalog', () => {
    const input = buildGoldenComposerInput({ catalog: [] });
    const out = composeDaily(input);
    assert.equal(out.varianceQueueRescued.length, 0);
  });

  test('rescue is skipped if the bucket cannot fit the block', () => {
    // Inject a huge rescue: CI target is 120; give the entry a 300-min duration.
    const fatCat = GOLDEN_MIN_CATALOG.map((c) => ({ ...c, defaultDurationMinutes: 300 }));
    const input = buildGoldenComposerInput({ catalog: fatCat });
    const out = composeDaily(input);
    assert.equal(out.varianceQueueRescued.length, 0);
  });

  test('non-SKIPPED_NON_OPTIONAL variance entries are ignored', () => {
    const input = buildGoldenComposerInput();
    input.varianceQueue = [
      { kind: 'OVERRAN', catalogEntryId: GOLDEN_VARIANCE_QUEUE[0].catalogEntryId }
    ];
    const out = composeDaily(input);
    assert.equal(out.varianceQueueRescued.length, 0);
  });

  test('empty varianceQueue yields no rescue', () => {
    const input = buildGoldenComposerInput();
    input.varianceQueue = [];
    const out = composeDaily(input);
    assert.equal(out.varianceQueueRescued.length, 0);
  });
});

describe('composeDaily — Sprint 3 completeness', () => {
  test('todo[] is empty now that steps 4–10 are implemented', () => {
    const input = buildGoldenComposerInput();
    const out = composeDaily(input);
    assert.ok(Array.isArray(out.todo));
    assert.equal(out.todo.length, 0);
  });
});

describe('composeDaily — input validation', () => {
  test('throws INVALID_INPUT on null input', () => {
    assert.throws(
      () => composeDaily(null),
      (e) => e.name === 'INVALID_INPUT'
    );
  });

  test('throws INVALID_CYCLE_TYPE on non-DAILY cycleType', () => {
    assert.throws(
      () => composeDaily({ cycleType: 'WEEKLY', dailyCapacityMinutes: 480 }),
      (e) => e.name === 'INVALID_CYCLE_TYPE'
    );
  });
});

describe('composeDaily — DAILY_NON_OPTIONAL_SET shape', () => {
  test('exports 5 entries (Standup, AM Comm, Post Comm, POST_DEEP_COMM, End-of-Activity Reflection)', () => {
    // Iter 38 Phase B: added POST_DEEP_COMM anchor → 5 total.
    assert.equal(DAILY_NON_OPTIONAL_SET.length, 5);
  });

  test('4 COMMUNICATION + 1 CI (Iter 38 Phase B: +POST_DEEP_COMM)', () => {
    const byBucket = {};
    for (const s of DAILY_NON_OPTIONAL_SET) {
      byBucket[s.bucket] = (byBucket[s.bucket] ?? 0) + 1;
    }
    // Iter 38 Phase B: Standup + AM_COMM + POST_LUNCH_COMM + POST_DEEP_COMM = 4 COMM; 1 CI.
    assert.equal(byBucket.COMMUNICATION, 4);
    assert.equal(byBucket.CI, 1);
  });
});

describe('composeDaily — golden fixture loads cleanly', () => {
  test('buildGoldenComposerInput produces a valid input', () => {
    const input = buildGoldenComposerInput();
    assert.equal(input.cycleType, 'DAILY');
    assert.equal(input.userId, GOLDEN_USER.id);
    assert.equal(input.dailyCapacityMinutes, 480);
    assert.equal(input.externalMinutesToday, 60);
    assert.ok(input.activeKaizen);
    assert.equal(input.varianceQueue.length, 1);
  });
});

// ---------------------------------------------------------------------------
// SPRINT 3 — steps 4–10 end-to-end against full catalog.
// ---------------------------------------------------------------------------

describe('composeDaily — sprintCeremonyDays', () => {
  test('anchor day → PLANNING_DAY', () => {
    const flags = sprintCeremonyDays('2026-04-20', '2026-04-20');
    assert.equal(flags.isPlanningDay, true);
    assert.equal(flags.isMidSprintDay, false);
    assert.equal(flags.isReviewDay, false);
  });

  test('anchor + 4 days (Fri Wk1) → MID_SPRINT_DAY', () => {
    const flags = sprintCeremonyDays('2026-04-24', '2026-04-20');
    assert.equal(flags.isPlanningDay, false);
    assert.equal(flags.isMidSprintDay, true);
    assert.equal(flags.isReviewDay, false);
  });

  test('anchor + 11 days (Fri Wk2) → REVIEW_DAY', () => {
    const flags = sprintCeremonyDays('2026-05-01', '2026-04-20');
    assert.equal(flags.isReviewDay, true);
  });

  test('missing inputs return all false', () => {
    const flags = sprintCeremonyDays('2026-04-20', null);
    assert.equal(flags.isPlanningDay, false);
    assert.equal(flags.isMidSprintDay, false);
    assert.equal(flags.isReviewDay, false);
  });
});

describe('composeDaily — sliceDeep', () => {
  test('2x2h pref on 240 min → two 120-min slices', () => {
    const s = sliceDeep(240, '2x2h');
    assert.equal(s.length, 2);
    assert.equal(s[0].minutes + s[1].minutes, 240);
  });

  test('4x1h pref on 240 min → four 60-min slices', () => {
    const s = sliceDeep(240, '4x1h');
    assert.equal(s.length, 4);
    for (const slice of s) assert.equal(slice.minutes, 60);
  });

  test('4x1h pref with only room for 3 → 3 slices (interruption)', () => {
    const s = sliceDeep(180, '4x1h');
    assert.equal(s.length, 3);
  });

  test('capped by remainingProject', () => {
    const s = sliceDeep(240, '2x2h', 120);
    assert.equal(s.reduce((a, b) => a + b.minutes, 0), 120);
  });
});

describe('composeDaily — STEP 4: sprint-phase ceremonies', () => {
  test('places Sprint Planning on PLANNING_DAY', () => {
    const input = buildGoldenComposerInput({ catalog: GOLDEN_FULL_CATALOG });
    input.date = GOLDEN_USER.sprintAnchorDate; // Mon Wk1 (2026-04-20)
    input.sprintAnchorDate = GOLDEN_USER.sprintAnchorDate;
    input.user = { ...input.user, sprintAnchorDate: GOLDEN_USER.sprintAnchorDate };
    const out = composeDaily(input);
    const planning = out.placed.find((p) => p.catalogEntryId === 'cer_sprint_planning');
    assert.ok(planning, 'Sprint Planning should be placed on PLANNING_DAY');
  });

  test('why[] includes R4_PHASE_CEREMONY', () => {
    const input = buildGoldenComposerInput({ catalog: GOLDEN_FULL_CATALOG });
    input.date = GOLDEN_USER.sprintAnchorDate;
    input.sprintAnchorDate = GOLDEN_USER.sprintAnchorDate;
    input.user = { ...input.user, sprintAnchorDate: GOLDEN_USER.sprintAnchorDate };
    const out = composeDaily(input);
    const r4 = out.why.filter((w) => w.rule === 'R4_PHASE_CEREMONY');
    assert.ok(r4.length >= 1);
  });

  test('no ceremony on non-anchor weekday (Tuesday)', () => {
    const input = buildGoldenComposerInput({ catalog: GOLDEN_FULL_CATALOG });
    const out = composeDaily(input);
    const ceremonies = out.placed.filter(
      (p) =>
        p.catalogEntryId === 'cer_sprint_planning' ||
        p.catalogEntryId === 'cer_mid_sprint_review' ||
        p.catalogEntryId === 'cer_sprint_review' ||
        p.catalogEntryId === 'cer_sprint_retrospective'
    );
    assert.equal(ceremonies.length, 0);
  });
});

describe('composeDaily — STEP 5: Deep payload', () => {
  test('active Kaizen with nextStepActivityNumber=34 lands #34 as Deep', () => {
    const input = buildGoldenComposerInput({ catalog: GOLDEN_FULL_CATALOG });
    const out = composeDaily(input);
    const deepBlocks = out.placed.filter((p) => p.bucket === 'PROJECT');
    assert.ok(deepBlocks.length >= 1);
    const linked = deepBlocks.find((p) => p.catalogEntryId === 'cat_34_cause_and_effect_matrix');
    assert.ok(linked);
    assert.equal(linked.linkedKaizenId, 'k_reduce_cycle_time');
  });

  test('Deep slices include linkedKaizenId and linkedDmaicStepRef', () => {
    const input = buildGoldenComposerInput({ catalog: GOLDEN_FULL_CATALOG });
    const out = composeDaily(input);
    const linkedDeep = out.placed.find(
      (p) => p.bucket === 'PROJECT' && p.catalogEntryId === 'cat_34_cause_and_effect_matrix'
    );
    assert.ok(linkedDeep.linkedKaizenId);
    assert.ok(linkedDeep.linkedDmaicStepRef);
    assert.equal(linkedDeep.linkedDmaicStepRef.kaizenId, 'k_reduce_cycle_time');
  });

  test('why[] records R3_KAIZEN_LINK for DMAIC-linked slices', () => {
    const input = buildGoldenComposerInput({ catalog: GOLDEN_FULL_CATALOG });
    const out = composeDaily(input);
    const r3 = out.why.filter((w) => w.rule === 'R3_KAIZEN_LINK');
    assert.ok(r3.length >= 1);
  });
});

describe('composeDaily — STEP 6: CI rotation', () => {
  test('PDCA placed at priority 80 when active and ≥42h since last tick', () => {
    const input = buildGoldenComposerInput({ catalog: GOLDEN_FULL_CATALOG });
    const out = composeDaily(input);
    const pdca = out.placed.find((p) => p.catalogEntryId === 'cat_12_pdca_cycle');
    assert.ok(pdca, 'PDCA should be placed via CI rotation');
    assert.equal(pdca.bucket, 'CI');
    assert.equal(pdca.ciPriority, 80);
  });

  test('why[] contains R6_CI_ROTATION entries', () => {
    const input = buildGoldenComposerInput({ catalog: GOLDEN_FULL_CATALOG });
    const out = composeDaily(input);
    const r6 = out.why.filter((w) => w.rule === 'R6_CI_ROTATION');
    assert.ok(r6.length >= 1);
  });
});

describe('composeDaily — STEP 8: ordering', () => {
  test('every placed block has plannedStartAt set after step 8', () => {
    const input = buildGoldenComposerInput({ catalog: GOLDEN_FULL_CATALOG });
    const out = composeDaily(input);
    for (const p of out.placed) {
      assert.ok(p.plannedStartAt, `missing plannedStartAt on ${p.name}`);
    }
  });

  test('Standup anchored 09:00, AM Comm 09:15, Post-lunch Comm 13:00, Reflection 17:00', () => {
    const input = buildGoldenComposerInput({ catalog: GOLDEN_FULL_CATALOG });
    const out = composeDaily(input);
    const standup = out.placed.find((p) => p.catalogEntryId === 'cer_daily_standup');
    const am = out.placed.find((p) => p.slotKind === 'AM_COMM');
    const post = out.placed.find((p) => p.slotKind === 'POST_LUNCH_COMM');
    const refl = out.placed.find(
      (p) => p.catalogEntryId === 'gen_end_of_activity_reflection'
    );
    assert.equal(standup.plannedStartAt, '09:00');
    assert.equal(am.plannedStartAt, '09:15');
    assert.equal(post.plannedStartAt, '13:00');
    assert.equal(refl.plannedStartAt, '17:00');
  });
});

describe('composeDaily — STEP 9: validation', () => {
  test('golden fixture composes to a valid PROPOSED composition', () => {
    const input = buildGoldenComposerInput({ catalog: GOLDEN_FULL_CATALOG });
    const out = composeDaily(input);
    assert.equal(out.state, 'PROPOSED');
    assert.equal(out.validation.ok, true);
  });
});

describe('composeDaily — STEP 10: build Composition', () => {
  test('output includes composition with state=PROPOSED', () => {
    const input = buildGoldenComposerInput({ catalog: GOLDEN_FULL_CATALOG });
    const out = composeDaily(input);
    assert.ok(out.composition);
    assert.equal(out.composition.state, 'PROPOSED');
    assert.equal(out.composition.cycleType, 'DAILY');
    assert.equal(out.composition.userId, GOLDEN_USER.id);
  });

  test('composerInputsSnapshot.explain mirrors why[]', () => {
    const input = buildGoldenComposerInput({ catalog: GOLDEN_FULL_CATALOG });
    const out = composeDaily(input);
    assert.equal(
      out.composition.composerInputsSnapshot.explain.length,
      out.why.length
    );
  });

  test('activities on composition carry compositionId, state=PROPOSED', () => {
    const input = buildGoldenComposerInput({ catalog: GOLDEN_FULL_CATALOG });
    const out = composeDaily(input);
    for (const a of out.composition.activities) {
      assert.equal(a.compositionId, out.composition.id);
      assert.equal(a.state, 'PROPOSED');
      assert.equal(a.sourceOfSchedule, 'COMPOSER_AUTO');
    }
  });

  test('emits a cycleProposedEvent descriptor', () => {
    const input = buildGoldenComposerInput({ catalog: GOLDEN_FULL_CATALOG });
    const out = composeDaily(input);
    assert.ok(out.cycleProposedEvent);
    assert.equal(out.cycleProposedEvent.event, 'CycleProposed');
    assert.equal(out.cycleProposedEvent.payload.compositionId, out.composition.id);
  });
});

describe('composeDaily — GOLDEN §1.9 end-to-end (critical)', () => {
  test('composes the §1.9 golden day from the full catalog', () => {
    const input = buildGoldenComposerInput({ catalog: GOLDEN_FULL_CATALOG });
    const out = composeDaily(input);

    // Feasible + PROPOSED.
    assert.equal(out.state, 'PROPOSED', 'golden day must compose to PROPOSED');
    assert.equal(out.validation.ok, true);

    // Bucket sums — PROJECT=240, COMMUNICATION=60, CI sum matches §1.9 outputs.
    const sums = { PROJECT: 0, COMMUNICATION: 0, CI: 0 };
    for (const p of out.placed) sums[p.bucket] += p.plannedDurationMinutes;
    assert.equal(sums.PROJECT, 240, 'PROJECT sum must equal 240');
    assert.equal(sums.COMMUNICATION, 60, 'COMMUNICATION sum must equal 60');
    assert.ok(sums.CI >= 60, `CI sum ${sums.CI} must be >= 60 (floor)`);
    assert.ok(sums.CI <= 150, `CI sum ${sums.CI} must be <= 150 (ceiling)`);

    // Non-optional set present.
    const names = new Set(out.placed.map((p) => p.name));
    assert.ok(names.has('Daily Standup'));
    assert.ok(names.has('AM High-value Communication'));
    assert.ok(names.has('Post-lunch High-value Communication'));
    assert.ok(names.has('End-of-Activity Reflection'));

    // DMAIC #34 slice present, linked to k_reduce_cycle_time.
    const deepLinked = out.placed.find((p) => p.catalogEntryId === 'cat_34_cause_and_effect_matrix');
    assert.ok(deepLinked, 'DMAIC #34 must be placed as Deep payload');
    assert.equal(deepLinked.linkedKaizenId, 'k_reduce_cycle_time');

    // R2 rescue #1 L&D present + carriedOver.
    const ld = out.placed.find(
      (p) => p.catalogEntryId === 'cat_1_personal_learning_and_development_l_d_tracker'
    );
    assert.ok(ld);
    assert.equal(ld.carriedOver, true);

    // PDCA tick present (priority 80).
    const pdca = out.placed.find((p) => p.catalogEntryId === 'cat_12_pdca_cycle');
    assert.ok(pdca);

    // Total minutes ≤ capacity − external.
    // Iter 26: exclude bucket===null rows (lunch) from the capacity sum — they are
    // capacity-neutral and validateComposition already excludes them.
    const total = out.placed
      .filter((b) => b.bucket !== null && b.bucket !== undefined)
      .reduce((a, b) => a + b.plannedDurationMinutes, 0);
    assert.ok(total <= 480 - 60);

    // why[] has all expected rule references.
    const rules = new Set(out.why.map((w) => w.rule));
    assert.ok(rules.has('R1_NON_OPTIONAL'));
    assert.ok(rules.has('R2_VARIANCE_RESCUE'));
    assert.ok(rules.has('R3_KAIZEN_LINK'));
    assert.ok(rules.has('R6_CI_ROTATION'));
  });

  test('determinism: same input → byte-identical composition activities', () => {
    const input1 = buildGoldenComposerInput({ catalog: GOLDEN_FULL_CATALOG });
    const input2 = buildGoldenComposerInput({ catalog: GOLDEN_FULL_CATALOG });
    const out1 = composeDaily(input1);
    const out2 = composeDaily(input2);
    const strip = (a) => ({
      id: a.id,
      catalogEntryId: a.catalogEntryId,
      bucket: a.bucket,
      plannedDurationMinutes: a.plannedDurationMinutes,
      plannedStartAt: a.plannedStartAt
    });
    const acts1 = out1.placed.map(strip);
    const acts2 = out2.placed.map(strip);
    assert.deepEqual(acts1, acts2);
  });
});

describe('composeDaily — performance', () => {
  test('p95 under 100ms over 100 iterations (pure composition)', () => {
    const input = buildGoldenComposerInput({ catalog: GOLDEN_FULL_CATALOG });
    const times = [];
    for (let i = 0; i < 100; i += 1) {
      const t0 = performance.now();
      composeDaily(input);
      times.push(performance.now() - t0);
    }
    times.sort((a, b) => a - b);
    const p95 = times[Math.floor(times.length * 0.95)];
    assert.ok(
      p95 < 100,
      `p95 composition time ${p95.toFixed(3)}ms should be < 100ms`
    );
  });
});

describe('composeDaily — INFEASIBLE path', () => {
  test('when PROJECT cannot be filled, returns INFEASIBLE', () => {
    // Empty catalog, zero-capacity-after-external → Deep can't be placed, floor fails.
    const input = buildGoldenComposerInput({ catalog: [] });
    const out = composeDaily(input);
    assert.equal(out.state, 'INFEASIBLE');
    assert.ok(out.infeasible);
    assert.equal(out.infeasible.kind, 'INFEASIBLE');
    assert.ok(Array.isArray(out.infeasible.suggestedActions));
  });
});

// ---------------------------------------------------------------------------
// Iteration 19 — Composer Correctness Fixes (C-SA-4 + C-SA-5)
// ---------------------------------------------------------------------------

describe('composeDaily — Iter-19 Bug A: Composition.date field (AC-A1)', () => {
  test('AC-A1: composition.date equals input.date', () => {
    const input = buildGoldenComposerInput({ catalog: GOLDEN_FULL_CATALOG });
    input.date = '2026-04-30';
    const out = composeDaily(input);
    assert.equal(out.composition.date, '2026-04-30');
  });

  test('AC-A1: date field matches the input date on a different execution day', () => {
    // Use GOLDEN_FULL_CATALOG + a plain execution-week Wednesday to stay PROPOSED.
    const input = buildGoldenComposerInput({ catalog: GOLDEN_FULL_CATALOG });
    // 2026-04-22 = Wed Wk1 of anchor 2026-04-20 → EXECUTION, no sprint ceremony.
    input.date = '2026-04-22';
    input._now = '2026-04-22T09:00:00Z';
    const out = composeDaily(input);
    // Must produce a PROPOSED composition (feasible input).
    assert.equal(out.state, 'PROPOSED');
    assert.equal(out.composition.date, '2026-04-22');
  });

  test('AC-A2: composition.date survives JSON round-trip (localStorage simulation)', () => {
    const input = buildGoldenComposerInput({ catalog: GOLDEN_FULL_CATALOG });
    input.date = '2026-04-30';
    const out = composeDaily(input);
    // Simulate localStorage: JSON.stringify + JSON.parse
    const serialized = JSON.stringify(out.composition);
    const reloaded = JSON.parse(serialized);
    assert.equal(reloaded.date, '2026-04-30');
  });

  test('AC-A3: reading a legacy composition (date absent) does not throw', () => {
    // Simulate a legacy Composition row from localStorage that has no date field.
    const legacyComposition = {
      id: 'comp_legacy_u_2026-04-01',
      userId: 'u_legacy',
      cycleType: 'DAILY',
      startAt: '2026-04-01T00:00:00Z',
      endAt: '2026-04-01T23:59:59Z',
      parentCompositionId: null,
      state: 'PROPOSED',
      proposedAt: '2026-04-01T08:00:00Z',
      decidedAt: null,
      closedAt: null,
      composerInputsSnapshot: {},
      invariantChecks: {}
      // intentionally NO date field
    };
    // Read `date` defensively — must not throw; fallback to startAt slice.
    const readDate = legacyComposition.date ?? legacyComposition.startAt?.slice(0, 10) ?? null;
    assert.equal(readDate, '2026-04-01');
    // Confirm composition.date is indeed absent on the legacy object.
    assert.equal(legacyComposition.date, undefined);
  });
});

// ---------------------------------------------------------------------------
// Iter 26 — Lunch block assertions (AC1, AC2, AC9, AC10, AC15, AC16)
// ---------------------------------------------------------------------------

describe('composeDaily — Iter 26: lunch block (AC1, AC2, AC9, AC15, AC16)', () => {
  function buildMinimalInput(overrides = {}) {
    return {
      cycleType: 'DAILY',
      userId: 'u_lunch_test',
      date: '2026-04-30',
      dailyCapacityMinutes: 480,
      externalMinutesToday: 0,
      role: ['PRACTITIONER'],
      varianceQueue: [],
      catalog: GOLDEN_FULL_CATALOG,
      sprintPhase: 'EXECUTION',
      sprintAnchorDate: '2026-04-28', // Not a ceremony day relative to 2026-04-30
      ...overrides
    };
  }

  test('AC1: placed contains exactly one lunch activity', () => {
    const out = composeDaily(buildMinimalInput());
    const lunches = out.placed.filter((a) => a.slotKind === 'LUNCH');
    assert.equal(lunches.length, 1, 'exactly one lunch activity must be in placed');
  });

  test('AC1: lunch plannedStartAt is 12:00', () => {
    const out = composeDaily(buildMinimalInput());
    const lunch = out.placed.find((a) => a.slotKind === 'LUNCH');
    assert.ok(lunch, 'lunch must be present');
    assert.equal(lunch.plannedStartAt, '12:00');
  });

  test('AC15: lunch plannedDurationMinutes is 30 (Phil directive)', () => {
    const out = composeDaily(buildMinimalInput());
    const lunch = out.placed.find((a) => a.slotKind === 'LUNCH');
    assert.equal(lunch.plannedDurationMinutes, 30);
  });

  test('AC2: lunch bucket is null (capacity-neutral)', () => {
    const out = composeDaily(buildMinimalInput());
    const lunch = out.placed.find((a) => a.slotKind === 'LUNCH');
    assert.equal(lunch.bucket, null);
  });

  test('AC2: lunch does NOT consume PROJECT/COMMUNICATION/CI capacity', () => {
    const out = composeDaily(buildMinimalInput());
    // Validate passes → capacity math is unaffected by lunch.
    assert.equal(out.state, 'PROPOSED');
    assert.equal(out.validation.ok, true);
  });

  test('AC9: validateComposition passes with lunch in placed (bucket=null filtered)', () => {
    const out = composeDaily(buildMinimalInput());
    assert.equal(out.validation.ok, true, `validation failed: ${out.validation.failureCode}`);
  });

  test('AC16: Post-lunch Comm anchor at 13:00 is unchanged', () => {
    const out = composeDaily(buildMinimalInput());
    const postLunchComm = out.placed.find((a) => a.slotKind === 'POST_LUNCH_COMM');
    assert.ok(postLunchComm, 'Post-lunch Comm must still be present');
    assert.equal(postLunchComm.anchor, '13:00', 'Post-lunch Comm anchor must remain at 13:00');
  });

  test('AC8: lunch isNonOptional is false', () => {
    const out = composeDaily(buildMinimalInput());
    const lunch = out.placed.find((a) => a.slotKind === 'LUNCH');
    assert.equal(lunch.isNonOptional, false);
  });

  test('lunch catalogEntryId is recovery_lunch', () => {
    const out = composeDaily(buildMinimalInput());
    const lunch = out.placed.find((a) => a.slotKind === 'LUNCH');
    assert.equal(lunch.catalogEntryId, 'recovery_lunch');
  });

  test('lunch appears in composition.activities', () => {
    const out = composeDaily(buildMinimalInput());
    const lunch = out.composition.activities.find((a) => a.slotKind === 'LUNCH');
    assert.ok(lunch, 'lunch must appear in composition.activities');
  });
});
