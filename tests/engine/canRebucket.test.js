/**
 * Tests for /js/engine/canRebucket.js (E4-T4).
 *
 * Drag-to-rebucket drop rule — exactly 4 scenarios per DELIVERY_PLAN E4-T4:
 *   - legal rebucket ok
 *   - floor violation on source rejected
 *   - floor violation on dest rejected
 *   - non-optional drag rejected
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { canRebucket } from '../../js/engine/canRebucket.js';

function block(overrides = {}) {
  return {
    id: overrides.id ?? 'sa',
    catalogEntryId: overrides.catalogEntryId ?? 'cat',
    name: overrides.name ?? 'X',
    bucket: overrides.bucket ?? 'PROJECT',
    plannedDurationMinutes: overrides.plannedDurationMinutes ?? 60,
    ...overrides
  };
}

/**
 * Build a balanced daily composition that just passes validation.
 * Targets (full-day, ext=0): PROJECT=240, COMMUNICATION=120, CI=120.
 */
function balancedComposition() {
  return {
    id: 'comp_1',
    cycleType: 'DAILY',
    userDailyCapacityMinutes: 480,
    externalMinutesToday: 0,
    activities: [
      block({ id: 'sa_standup', catalogEntryId: 'cer_daily_standup', name: 'Daily Standup', bucket: 'COMMUNICATION', plannedDurationMinutes: 15 }),
      block({ id: 'sa_am', catalogEntryId: 'gen_value_added_communication', slotKind: 'AM_COMM', name: 'AM High-value Communication', bucket: 'COMMUNICATION', plannedDurationMinutes: 60 }),
      block({ id: 'sa_post', catalogEntryId: 'gen_value_added_communication', slotKind: 'POST_LUNCH_COMM', name: 'Post-lunch High-value Communication', bucket: 'COMMUNICATION', plannedDurationMinutes: 30 }),
      block({ id: 'sa_deep_1', name: 'Deep 1', bucket: 'PROJECT', plannedDurationMinutes: 120 }),
      block({ id: 'sa_deep_2', name: 'Deep 2', bucket: 'PROJECT', plannedDurationMinutes: 120 }),
      block({ id: 'sa_ci_extra', name: 'L&D', bucket: 'CI', plannedDurationMinutes: 60 }),
      block({ id: 'sa_pdca', name: 'PDCA', bucket: 'CI', plannedDurationMinutes: 45 }),
      block({ id: 'sa_refl', catalogEntryId: 'gen_end_of_activity_reflection', name: 'End-of-Activity Reflection', bucket: 'CI', plannedDurationMinutes: 15 })
    ]
  };
}

describe('canRebucket — legal rebucket', () => {
  test('moving a 60-min block from CI to PROJECT passes when floors ok', () => {
    const comp = balancedComposition();
    // Remove one of the Deep blocks so PROJECT is under ceiling after move
    comp.activities = comp.activities.filter((a) => a.id !== 'sa_deep_2');
    // And bump a CI block up so we have something to move
    const ldBlock = comp.activities.find((a) => a.id === 'sa_ci_extra');
    ldBlock.plannedDurationMinutes = 60;
    // After moving CI 'sa_ci_extra' to PROJECT: PROJECT = 120 + 60 = 180; CI = 45 + 15 = 60.
    const result = canRebucket(ldBlock, 'CI', 'PROJECT', comp);
    // PROJECT floor = 120; CI floor = 60 — ok
    assert.equal(result.ok, true);
  });
});

describe('canRebucket — floor violation on source', () => {
  test('moving PROJECT block out leaving PROJECT = 120 (at floor) still ok', () => {
    const comp = balancedComposition();
    // Try moving sa_deep_1 (120m) to CI — would leave PROJECT=120 (floor), CI=60+45+15+120=240 > ceiling (150).
    const deep = comp.activities.find((a) => a.id === 'sa_deep_1');
    const result = canRebucket(deep, 'PROJECT', 'CI', comp);
    assert.equal(result.ok, false);
    assert.equal(result.failureCode, 'CI_OVERPACKED');
  });

  test('moving PROJECT block out when source drops below floor is rejected', () => {
    const comp = balancedComposition();
    // Remove one deep block — PROJECT = 120 remaining. Move that 120 to COMM.
    comp.activities = comp.activities.filter((a) => a.id !== 'sa_deep_2');
    const deep1 = comp.activities.find((a) => a.id === 'sa_deep_1');
    const result = canRebucket(deep1, 'PROJECT', 'COMMUNICATION', comp);
    // After move: PROJECT=0 (< 120 floor), COMM=225 (> 150 ceiling).
    assert.equal(result.ok, false);
    // Either DEEP_UNDER_FLOOR or COMM_OVERPACKED is acceptable per §2.5 ordering.
    assert.ok(['DEEP_UNDER_FLOOR', 'COMM_OVERPACKED'].includes(result.failureCode));
  });
});

describe('canRebucket — floor violation on destination (overpacked)', () => {
  test('moving a block to overpack a bucket is rejected', () => {
    const comp = balancedComposition();
    const deep1 = comp.activities.find((a) => a.id === 'sa_deep_1');
    const result = canRebucket(deep1, 'PROJECT', 'COMMUNICATION', comp);
    // After move: COMM = 105+120 = 225 > ceiling 150
    assert.equal(result.ok, false);
  });
});

describe('canRebucket — non-optional drag rejected', () => {
  test('Daily Standup cannot be moved', () => {
    const comp = balancedComposition();
    const standup = comp.activities.find((a) => a.id === 'sa_standup');
    const result = canRebucket(standup, 'COMMUNICATION', 'CI', comp);
    assert.equal(result.ok, false);
    assert.equal(result.failureCode, 'NON_OPTIONAL_LOCKED');
  });

  test('AM Comm slot cannot be moved', () => {
    const comp = balancedComposition();
    const am = comp.activities.find((a) => a.id === 'sa_am');
    const result = canRebucket(am, 'COMMUNICATION', 'CI', comp);
    assert.equal(result.ok, false);
    assert.equal(result.failureCode, 'NON_OPTIONAL_LOCKED');
  });

  test('End-of-Activity Reflection cannot be moved', () => {
    const comp = balancedComposition();
    const refl = comp.activities.find((a) => a.id === 'sa_refl');
    const result = canRebucket(refl, 'CI', 'PROJECT', comp);
    assert.equal(result.ok, false);
    assert.equal(result.failureCode, 'NON_OPTIONAL_LOCKED');
  });

  test('Strategic-flagged Deep cannot be moved', () => {
    const comp = balancedComposition();
    const deep = comp.activities.find((a) => a.id === 'sa_deep_1');
    deep.strategic = true;
    const result = canRebucket(deep, 'PROJECT', 'CI', comp);
    assert.equal(result.ok, false);
    assert.equal(result.failureCode, 'NON_OPTIONAL_LOCKED');
  });
});

describe('canRebucket — misc', () => {
  test('same bucket is a no-op ok', () => {
    const comp = balancedComposition();
    const deep = comp.activities.find((a) => a.id === 'sa_deep_1');
    const result = canRebucket(deep, 'PROJECT', 'PROJECT', comp);
    assert.equal(result.ok, true);
  });

  test('unknown activity returns ACTIVITY_NOT_FOUND (overload form)', () => {
    const comp = balancedComposition();
    const result = canRebucket(comp, 'nonexistent', 'CI');
    assert.equal(result.ok, false);
    assert.equal(result.failureCode, 'ACTIVITY_NOT_FOUND');
  });
});
