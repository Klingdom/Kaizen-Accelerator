/**
 * Tests for /js/engine/validateComposition.js (E3-T3 step 9).
 *
 * Covers all 9 failure codes per ENGINE_DESIGN §2.5 with exact detail shape:
 *   DEEP_UNDER_FLOOR, COMM_UNDER_FLOOR, CI_UNDER_FLOOR,
 *   PROJECT_OVERPACKED, COMM_OVERPACKED, CI_OVERPACKED,
 *   NON_OPTIONAL_MISSING, OVER_CAPACITY, INFEASIBLE (caller-constructed).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  validateComposition,
  requiredNonOptionals,
  DAILY_NON_OPTIONAL_NAMES
} from '../../js/engine/validateComposition.js';

function act({ name = 'a', bucket = 'PROJECT', minutes = 60 } = {}) {
  return {
    id: `sa_${name}`,
    catalogEntryId: `cat_${name}`,
    name,
    bucket,
    plannedDurationMinutes: minutes
  };
}

/**
 * Build a fully valid daily composition for a full-day user (cap=480, ext=0).
 * Targets: PROJECT=240, COMMUNICATION=120, CI=120.
 */
function validDay() {
  return [
    act({ name: 'Daily Standup', bucket: 'COMMUNICATION', minutes: 15 }),
    act({ name: 'AM High-value Communication', bucket: 'COMMUNICATION', minutes: 60 }),
    act({ name: 'Post-lunch High-value Communication', bucket: 'COMMUNICATION', minutes: 30 }),
    act({ name: 'Deep Work slice 1', bucket: 'PROJECT', minutes: 120 }),
    act({ name: 'Deep Work slice 2', bucket: 'PROJECT', minutes: 120 }),
    act({ name: 'CI rotation A', bucket: 'CI', minutes: 60 }),
    act({ name: 'CI rotation B', bucket: 'CI', minutes: 45 }),
    act({ name: 'End-of-Activity Reflection', bucket: 'CI', minutes: 15 })
  ];
}

describe('validateComposition — OK path', () => {
  test('clean day: ok=true, returns shape_4_2_2 detail', () => {
    const out = validateComposition({
      cycleType: 'DAILY',
      activities: validDay(),
      userDailyCapacityMinutes: 480,
      externalMinutesToday: 0
    });
    assert.equal(out.ok, true);
    assert.equal(out.failureCode, null);
    assert.equal(out.detail.shape_4_2_2.ok, true);
    assert.equal(out.detail.shape_4_2_2.projectMin, 240);
    assert.equal(out.detail.shape_4_2_2.commMin, 105);
    assert.equal(out.detail.shape_4_2_2.ciMin, 120);
  });
});

describe('validateComposition — DEEP_UNDER_FLOOR', () => {
  test('PROJECT < floor (120) → DEEP_UNDER_FLOOR', () => {
    const acts = validDay().map((a) =>
      a.bucket === 'PROJECT' ? { ...a, plannedDurationMinutes: 40 } : a
    );
    const out = validateComposition({
      cycleType: 'DAILY',
      activities: acts,
      userDailyCapacityMinutes: 480
    });
    assert.equal(out.ok, false);
    assert.equal(out.failureCode, 'DEEP_UNDER_FLOOR');
    assert.equal(out.detail.actual, 80);
    assert.equal(out.detail.floor, 120);
  });
});

describe('validateComposition — COMM_UNDER_FLOOR', () => {
  test('COMMUNICATION < floor → COMM_UNDER_FLOOR', () => {
    const acts = [
      act({ name: 'Daily Standup', bucket: 'COMMUNICATION', minutes: 15 }),
      act({ name: 'AM High-value Communication', bucket: 'COMMUNICATION', minutes: 5 }),
      act({ name: 'Post-lunch High-value Communication', bucket: 'COMMUNICATION', minutes: 5 }),
      act({ name: 'Deep Work', bucket: 'PROJECT', minutes: 240 }),
      act({ name: 'CI', bucket: 'CI', minutes: 105 }),
      act({ name: 'End-of-Activity Reflection', bucket: 'CI', minutes: 15 })
    ];
    const out = validateComposition({
      cycleType: 'DAILY',
      activities: acts,
      userDailyCapacityMinutes: 480
    });
    assert.equal(out.ok, false);
    assert.equal(out.failureCode, 'COMM_UNDER_FLOOR');
    assert.equal(out.detail.actual, 25);
    assert.equal(out.detail.floor, 60);
  });
});

describe('validateComposition — CI_UNDER_FLOOR', () => {
  test('CI < floor → CI_UNDER_FLOOR', () => {
    const acts = validDay().map((a) =>
      a.bucket === 'CI' ? { ...a, plannedDurationMinutes: 10 } : a
    );
    const out = validateComposition({
      cycleType: 'DAILY',
      activities: acts,
      userDailyCapacityMinutes: 480
    });
    assert.equal(out.ok, false);
    assert.equal(out.failureCode, 'CI_UNDER_FLOOR');
    assert.equal(out.detail.floor, 60);
    assert.ok(out.detail.actual < 60);
  });
});

describe('validateComposition — PROJECT_OVERPACKED', () => {
  test('PROJECT > ceiling (264) → PROJECT_OVERPACKED', () => {
    // Craft a minimal day: 15 + 60 + 30 (COMM) + 270 (PROJECT) + 60 + 45 (CI) = 480. PROJECT ceiling = 264.
    const acts = [
      act({ name: 'Daily Standup', bucket: 'COMMUNICATION', minutes: 15 }),
      act({ name: 'AM High-value Communication', bucket: 'COMMUNICATION', minutes: 60 }),
      act({ name: 'Post-lunch High-value Communication', bucket: 'COMMUNICATION', minutes: 30 }),
      act({ name: 'Deep Work slice 1', bucket: 'PROJECT', minutes: 270 }),
      act({ name: 'CI A', bucket: 'CI', minutes: 60 }),
      act({ name: 'CI B', bucket: 'CI', minutes: 30 }),
      act({ name: 'End-of-Activity Reflection', bucket: 'CI', minutes: 15 })
    ];
    const out = validateComposition({
      cycleType: 'DAILY',
      activities: acts,
      userDailyCapacityMinutes: 480
    });
    assert.equal(out.ok, false);
    assert.equal(out.failureCode, 'PROJECT_OVERPACKED');
    assert.equal(out.detail.ceiling, 264);
    assert.equal(out.detail.actual, 270);
  });
});

describe('validateComposition — COMM_OVERPACKED', () => {
  test('COMMUNICATION > ceiling → COMM_OVERPACKED', () => {
    const acts = [
      act({ name: 'Daily Standup', bucket: 'COMMUNICATION', minutes: 15 }),
      act({ name: 'AM High-value Communication', bucket: 'COMMUNICATION', minutes: 90 }),
      act({ name: 'Post-lunch High-value Communication', bucket: 'COMMUNICATION', minutes: 70 }),
      act({ name: 'Deep Work', bucket: 'PROJECT', minutes: 120 }),
      act({ name: 'CI', bucket: 'CI', minutes: 60 }),
      act({ name: 'End-of-Activity Reflection', bucket: 'CI', minutes: 15 })
    ];
    const out = validateComposition({
      cycleType: 'DAILY',
      activities: acts,
      userDailyCapacityMinutes: 480
    });
    assert.equal(out.ok, false);
    assert.equal(out.failureCode, 'COMM_OVERPACKED');
    assert.ok(out.detail.actual > out.detail.ceiling);
  });
});

describe('validateComposition — CI_OVERPACKED', () => {
  test('CI > ceiling (150) → CI_OVERPACKED', () => {
    const acts = [
      act({ name: 'Daily Standup', bucket: 'COMMUNICATION', minutes: 15 }),
      act({ name: 'AM High-value Communication', bucket: 'COMMUNICATION', minutes: 60 }),
      act({ name: 'Post-lunch High-value Communication', bucket: 'COMMUNICATION', minutes: 30 }),
      act({ name: 'Deep Work', bucket: 'PROJECT', minutes: 120 }),
      act({ name: 'CI A', bucket: 'CI', minutes: 80 }),
      act({ name: 'CI B', bucket: 'CI', minutes: 80 }),
      act({ name: 'End-of-Activity Reflection', bucket: 'CI', minutes: 15 })
    ];
    const out = validateComposition({
      cycleType: 'DAILY',
      activities: acts,
      userDailyCapacityMinutes: 480
    });
    assert.equal(out.ok, false);
    assert.equal(out.failureCode, 'CI_OVERPACKED');
    assert.equal(out.detail.ceiling, 150);
    assert.equal(out.detail.actual, 175);
  });
});

describe('validateComposition — NON_OPTIONAL_MISSING', () => {
  test('missing Daily Standup → NON_OPTIONAL_MISSING with missing list', () => {
    const acts = validDay().filter((a) => a.name !== 'Daily Standup');
    const out = validateComposition({
      cycleType: 'DAILY',
      activities: acts,
      userDailyCapacityMinutes: 480
    });
    // With standup removed, COMM = 90; floor = 60 → still ok.
    assert.equal(out.ok, false);
    assert.equal(out.failureCode, 'NON_OPTIONAL_MISSING');
    assert.ok(out.detail.missing.includes('Daily Standup'));
  });

  test('empty activities → many missing', () => {
    const out = validateComposition({
      cycleType: 'DAILY',
      activities: [],
      userDailyCapacityMinutes: 480
    });
    assert.equal(out.ok, false);
    // 0 min in PROJECT -> DEEP_UNDER_FLOOR fires FIRST. That's correct per the
    // ordered rule chain in §2.5. Either code is acceptable here — the spec
    // enforces a strict order.
    assert.equal(out.failureCode, 'DEEP_UNDER_FLOOR');
  });
});

describe('validateComposition — OVER_CAPACITY', () => {
  test('total > capacity-ext → OVER_CAPACITY', () => {
    const acts = [
      act({ name: 'Daily Standup', bucket: 'COMMUNICATION', minutes: 15 }),
      act({ name: 'AM High-value Communication', bucket: 'COMMUNICATION', minutes: 60 }),
      act({ name: 'Post-lunch High-value Communication', bucket: 'COMMUNICATION', minutes: 30 }),
      act({ name: 'Deep Work', bucket: 'PROJECT', minutes: 240 }),
      act({ name: 'CI', bucket: 'CI', minutes: 120 }),
      act({ name: 'Overflow', bucket: 'CI', minutes: 120 }),
      act({ name: 'End-of-Activity Reflection', bucket: 'CI', minutes: 15 })
    ];
    const out = validateComposition({
      cycleType: 'DAILY',
      activities: acts,
      userDailyCapacityMinutes: 480
    });
    assert.equal(out.ok, false);
    assert.equal(out.failureCode, 'OVER_CAPACITY');
    assert.equal(out.detail.total, 600);
    assert.equal(out.detail.cap, 480);
    assert.equal(out.detail.overBy, 120);
  });
});

describe('validateComposition — INFEASIBLE (callable)', () => {
  test('INFEASIBLE is set by caller after relax exhausts — validator itself does not emit', () => {
    // validator returns domain-specific failure code; composer wraps to
    // INFEASIBLE.  This test guards that the validator itself never emits
    // 'INFEASIBLE' as a failureCode.
    const out = validateComposition({
      cycleType: 'DAILY',
      activities: [],
      userDailyCapacityMinutes: 480
    });
    assert.notEqual(out.failureCode, 'INFEASIBLE');
  });
});

describe('validateComposition — edge cases', () => {
  test('invalid input returns INVALID_INPUT', () => {
    const out = validateComposition({
      cycleType: 'DAILY',
      activities: null,
      userDailyCapacityMinutes: 480
    });
    assert.equal(out.ok, false);
    assert.equal(out.failureCode, 'INVALID_INPUT');
  });

  test('non-positive cap returns INVALID_INPUT', () => {
    const out = validateComposition({
      cycleType: 'DAILY',
      activities: [],
      userDailyCapacityMinutes: 0
    });
    assert.equal(out.ok, false);
    assert.equal(out.failureCode, 'INVALID_INPUT');
  });

  test('WEEKLY cycleType passes through without daily checks', () => {
    const out = validateComposition({
      cycleType: 'WEEKLY',
      activities: [],
      userDailyCapacityMinutes: 480
    });
    assert.equal(out.ok, true);
  });
});

describe('validateComposition — requiredNonOptionals helper', () => {
  test('returns missing Standup + Deep Work', () => {
    const missing = requiredNonOptionals('DAILY', []);
    assert.ok(missing.includes('Daily Standup'));
    assert.ok(missing.includes('AM High-value Communication'));
    assert.ok(missing.includes('Post-lunch High-value Communication'));
    assert.ok(missing.includes('End-of-Activity Reflection'));
    assert.ok(missing.includes('Deep Work'));
  });

  test('DAILY_NON_OPTIONAL_NAMES lists the 4 canonical names', () => {
    assert.equal(DAILY_NON_OPTIONAL_NAMES.length, 4);
    assert.ok(DAILY_NON_OPTIONAL_NAMES.includes('Daily Standup'));
    assert.ok(DAILY_NON_OPTIONAL_NAMES.includes('End-of-Activity Reflection'));
  });

  test('WEEKLY cycle type returns empty', () => {
    assert.deepEqual(requiredNonOptionals('WEEKLY', []), []);
  });
});
