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

import { composeDaily, DAILY_NON_OPTIONAL_SET } from '../../js/composer/composeDaily.js';
import {
  GOLDEN_USER,
  GOLDEN_EXPECTED_TARGETS,
  GOLDEN_MIN_CATALOG,
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
    assert.equal(out.partial, true);
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
    assert.ok(out.placed.length >= 4, `expected ≥4 placed blocks, got ${out.placed.length}`);

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
    assert.ok(am);
    assert.ok(post);
    // Standup 15 + AM + Post = COMM target 60; AM+Post = 45 total.
    assert.equal(am.plannedDurationMinutes + post.plannedDurationMinutes, 45);
    assert.ok(am.plannedDurationMinutes >= 1);
    assert.ok(post.plannedDurationMinutes >= 1);
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

describe('composeDaily — TODO list flags Sprint 3 steps', () => {
  test('todo[] lists steps 4–10 as remaining', () => {
    const input = buildGoldenComposerInput();
    const out = composeDaily(input);
    assert.ok(out.todo.includes('STEP_4_PHASE_CEREMONIES'));
    assert.ok(out.todo.includes('STEP_5_DEEP_PAYLOAD'));
    assert.ok(out.todo.includes('STEP_6_CI_ROTATION'));
    assert.ok(out.todo.includes('STEP_7_COMM_FILLER'));
    assert.ok(out.todo.includes('STEP_8_ORDER_DAY'));
    assert.ok(out.todo.includes('STEP_9_VALIDATE'));
    assert.ok(out.todo.includes('STEP_10_BUILD_COMPOSITION'));
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
  test('exports 4 entries (Standup, AM Comm, Post Comm, End-of-Activity Reflection)', () => {
    assert.equal(DAILY_NON_OPTIONAL_SET.length, 4);
  });

  test('2 Communication + 1 CI + 1 Communication Standup → 3 COMM + 1 CI', () => {
    const byBucket = {};
    for (const s of DAILY_NON_OPTIONAL_SET) {
      byBucket[s.bucket] = (byBucket[s.bucket] ?? 0) + 1;
    }
    assert.equal(byBucket.COMMUNICATION, 3);
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
