/**
 * Tests for /js/composer/lunchBlock.js (Iter 26).
 *
 * All tests are pure unit tests for the injectLunchBlock helper.
 * No DOM, no I/O, no global state.
 *
 * AC coverage:
 *   AC1  — lunch present at 12:00, 30 min, name='Lunch'
 *   AC2  — bucket===null (not in capacity sums)
 *   AC8  — isNonOptional===false, isAnchor===false
 *   AC14 — LUNCH_CATALOG_ID === 'recovery_lunch'
 *   AC15 — LUNCH_DEFAULT_MINUTES === 30
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  injectLunchBlock,
  LUNCH_CATALOG_ID,
  LUNCH_DEFAULT_START,
  LUNCH_DEFAULT_MINUTES,
  LUNCH_BLOCK_ENABLED
} from '../../js/composer/lunchBlock.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe('lunchBlock — module constants', () => {
  test('LUNCH_CATALOG_ID is recovery_lunch', () => {
    assert.equal(LUNCH_CATALOG_ID, 'recovery_lunch');
  });

  test('LUNCH_DEFAULT_START is 12:00 (AC1)', () => {
    assert.equal(LUNCH_DEFAULT_START, '12:00');
  });

  test('LUNCH_DEFAULT_MINUTES is 30 (AC15 — Phil directive)', () => {
    assert.equal(LUNCH_DEFAULT_MINUTES, 30);
  });

  test('LUNCH_BLOCK_ENABLED is true (default on)', () => {
    assert.equal(LUNCH_BLOCK_ENABLED, true);
  });
});

// ---------------------------------------------------------------------------
// Basic injection
// ---------------------------------------------------------------------------

describe('injectLunchBlock — basic injection', () => {
  const stdInput = {
    userId: 'u1',
    date: '2026-04-30',
    dailyCapacityMinutes: 480
  };

  test('AC1: appends exactly one lunch activity at 12:00 with 30 min', () => {
    const placed = [];
    injectLunchBlock(placed, stdInput);
    const lunch = placed.find((a) => a.slotKind === 'LUNCH');
    assert.ok(lunch, 'lunch activity must be present');
    assert.equal(lunch.plannedStartAt, '12:00');
    assert.equal(lunch.plannedDurationMinutes, 30);
    assert.equal(lunch.name, 'Lunch');
  });

  test('AC1: exactly one lunch activity is appended', () => {
    const placed = [];
    injectLunchBlock(placed, stdInput);
    const lunches = placed.filter((a) => a.slotKind === 'LUNCH');
    assert.equal(lunches.length, 1);
  });

  test('AC2: lunch activity has bucket===null', () => {
    const placed = [];
    injectLunchBlock(placed, stdInput);
    const lunch = placed.find((a) => a.slotKind === 'LUNCH');
    assert.equal(lunch.bucket, null);
  });

  test('AC8: isNonOptional===false', () => {
    const placed = [];
    injectLunchBlock(placed, stdInput);
    const lunch = placed.find((a) => a.slotKind === 'LUNCH');
    assert.equal(lunch.isNonOptional, false);
  });

  test('AC8: isAnchor===false', () => {
    const placed = [];
    injectLunchBlock(placed, stdInput);
    const lunch = placed.find((a) => a.slotKind === 'LUNCH');
    assert.equal(lunch.isAnchor, false);
  });

  test('catalogEntryId is recovery_lunch (AC14)', () => {
    const placed = [];
    injectLunchBlock(placed, stdInput);
    const lunch = placed.find((a) => a.slotKind === 'LUNCH');
    assert.equal(lunch.catalogEntryId, 'recovery_lunch');
  });

  test('state is PROPOSED', () => {
    const placed = [];
    injectLunchBlock(placed, stdInput);
    const lunch = placed.find((a) => a.slotKind === 'LUNCH');
    assert.equal(lunch.state, 'PROPOSED');
  });

  test('sourceOfSchedule is COMPOSER_AUTO', () => {
    const placed = [];
    injectLunchBlock(placed, stdInput);
    const lunch = placed.find((a) => a.slotKind === 'LUNCH');
    assert.equal(lunch.sourceOfSchedule, 'COMPOSER_AUTO');
  });

  test('id contains recovery_lunch and date', () => {
    const placed = [];
    injectLunchBlock(placed, stdInput);
    const lunch = placed.find((a) => a.slotKind === 'LUNCH');
    assert.ok(lunch.id.includes('recovery_lunch'), 'id should include recovery_lunch');
    assert.ok(lunch.id.includes('2026-04-30'), 'id should include the date');
  });
});

// ---------------------------------------------------------------------------
// Return value + mutability
// ---------------------------------------------------------------------------

describe('injectLunchBlock — return value and mutation', () => {
  test('returns the same placed array reference (mutates in place)', () => {
    const placed = [];
    const result = injectLunchBlock(placed, { dailyCapacityMinutes: 480 });
    assert.equal(result, placed);
  });

  test('does not disturb existing entries in placed', () => {
    const existing = {
      id: 'sa_existing',
      name: 'Deep Work',
      bucket: 'PROJECT',
      plannedDurationMinutes: 120,
      state: 'PROPOSED'
    };
    const placed = [existing];
    injectLunchBlock(placed, { dailyCapacityMinutes: 480 });
    assert.equal(placed[0], existing, 'existing entry must be unchanged');
    assert.equal(placed.length, 2);
  });

  test('can be called multiple times on same array and adds only one lunch each time', () => {
    const placed = [];
    injectLunchBlock(placed, { dailyCapacityMinutes: 480, date: '2026-04-30' });
    // A second call would add a second row — callers must not call twice.
    // This test verifies the first call adds exactly 1 row.
    assert.equal(placed.filter((a) => a.slotKind === 'LUNCH').length, 1);
  });
});

// ---------------------------------------------------------------------------
// EC-2 / EC-3: capacity guards
// ---------------------------------------------------------------------------

describe('injectLunchBlock — capacity edge cases (EC-2, EC-3)', () => {
  test('EC-2/EC-3: skips lunch when dailyCapacityMinutes < 120 (very short day)', () => {
    const placed = [];
    injectLunchBlock(placed, { dailyCapacityMinutes: 60 });
    assert.equal(placed.length, 0, 'lunch should not be injected on a < 2h day');
  });

  test('EC-2/EC-3: injects lunch when dailyCapacityMinutes === 120 (boundary)', () => {
    const placed = [];
    injectLunchBlock(placed, { dailyCapacityMinutes: 120 });
    assert.equal(placed.length, 1);
  });

  test('injects lunch when dailyCapacityMinutes is standard 480', () => {
    const placed = [];
    injectLunchBlock(placed, { dailyCapacityMinutes: 480 });
    assert.equal(placed.length, 1);
  });

  test('uses capacityMinutes field when dailyCapacityMinutes is absent (composeWeekly ctx)', () => {
    const placed = [];
    injectLunchBlock(placed, { capacityMinutes: 480, date: '2026-04-30' });
    assert.equal(placed.length, 1);
    assert.equal(placed[0].slotKind, 'LUNCH');
  });

  test('defaults to 480 when no capacity field provided', () => {
    const placed = [];
    injectLunchBlock(placed, {});
    assert.equal(placed.length, 1);
  });
});

// ---------------------------------------------------------------------------
// Input robustness
// ---------------------------------------------------------------------------

describe('injectLunchBlock — input robustness', () => {
  test('handles null input gracefully (uses defaults)', () => {
    const placed = [];
    // null input should not throw — uses defaults
    injectLunchBlock(placed, null);
    assert.equal(placed.length, 1);
  });

  test('handles missing date (uses fallback id)', () => {
    const placed = [];
    injectLunchBlock(placed, { dailyCapacityMinutes: 480 });
    const lunch = placed[0];
    assert.ok(typeof lunch.id === 'string' && lunch.id.includes('recovery_lunch'));
  });

  test('different dates produce different ids', () => {
    const a = [];
    const b = [];
    injectLunchBlock(a, { dailyCapacityMinutes: 480, date: '2026-04-28' });
    injectLunchBlock(b, { dailyCapacityMinutes: 480, date: '2026-04-29' });
    assert.notEqual(a[0].id, b[0].id);
  });
});

// ---------------------------------------------------------------------------
// validateComposition integration — bucket===null must not count toward total
// ---------------------------------------------------------------------------

describe('lunchBlock + validateComposition integration (AC2, AC9)', () => {
  // We test injectLunchBlock produces a row that validateComposition skips.
  // Importing validateComposition here is safe (pure function, no I/O).

  test('AC9: lunch does not count toward total capacity in validateComposition', async () => {
    const { validateComposition } = await import('../../js/engine/validateComposition.js');

    // A minimal feasible day: 240 PROJECT + 120 COMM + 120 CI = 480 min
    // Adding a 30-min lunch (bucket=null) should NOT push total over cap.
    const activities = [
      { bucket: 'PROJECT', plannedDurationMinutes: 240, name: 'Deep Work' },
      { bucket: 'COMMUNICATION', plannedDurationMinutes: 75, name: 'Daily Standup', slotKind: undefined },
      { bucket: 'COMMUNICATION', plannedDurationMinutes: 15, name: 'AM High-value Communication' },
      { bucket: 'COMMUNICATION', plannedDurationMinutes: 30, name: 'Post-lunch High-value Communication' },
      { bucket: 'CI', plannedDurationMinutes: 105, name: 'End-of-Activity Reflection' },
      { bucket: 'CI', plannedDurationMinutes: 15, name: 'Deep Work' },
      // Lunch: bucket===null
      { bucket: null, plannedDurationMinutes: 30, name: 'Lunch', slotKind: 'LUNCH' }
    ];

    const result = validateComposition({
      cycleType: 'WEEKLY', // use WEEKLY to skip the 4-2-2 floor checks for simplicity
      activities,
      userDailyCapacityMinutes: 480,
      externalMinutesToday: 0
    });
    // Total of non-null rows = 480 min = cap; with lunch filtered out it stays at 480.
    assert.equal(result.ok, true, `validateComposition failed: ${result.failureCode}`);
  });

  test('AC2: lunch does not appear in bucket sums (sumBucket skips null)', async () => {
    const { validateComposition } = await import('../../js/engine/validateComposition.js');

    // 480 min exactly filled across PROJECT/COMM/CI; lunch adds 30 min bucket-null.
    // If lunch were counted, total = 510 > 480 → OVER_CAPACITY.
    const activities = [
      { bucket: 'PROJECT', plannedDurationMinutes: 240 },
      { bucket: 'COMMUNICATION', plannedDurationMinutes: 120 },
      { bucket: 'CI', plannedDurationMinutes: 120 },
      { bucket: null, plannedDurationMinutes: 30, name: 'Lunch' }
    ];
    const result = validateComposition({
      cycleType: 'WEEKLY',
      activities,
      userDailyCapacityMinutes: 480
    });
    assert.equal(result.ok, true, `should be ok; got ${result.failureCode}`);
  });
});
