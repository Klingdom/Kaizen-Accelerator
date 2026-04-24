/**
 * Sprint 13 Pass 13a — duration-chip pure helper tests.
 *
 * Covers:
 *   - DURATION_OPTIONS is frozen + holds the 6 canonical values
 *   - applyDurationChange on each of the 6 values
 *   - cascade time-shift across butting-up successors
 *   - deliberate gaps are preserved
 *   - protected block throws PROTECTED_BLOCK
 *   - invalid duration throws INVALID_DURATION
 *   - immutability (input array not mutated)
 *   - computeDurationImpact: delta + end-of-day + wouldExceedCapacity
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  DURATION_OPTIONS,
  applyDurationChange,
  computeDurationImpact
} from '../../js/ui/editMode.js';

function mkActivity(overrides = {}) {
  return {
    id: `sa_${Math.random().toString(36).slice(2, 8)}`,
    catalogEntryId: 'cat_some',
    name: 'Some Work',
    bucket: 'PROJECT',
    plannedDurationMinutes: 60,
    plannedStartAt: null,
    state: 'PROPOSED',
    sourceOfSchedule: 'COMPOSER_AUTO',
    ...overrides
  };
}

/**
 * Build an array of 3 activities butting up against each other:
 *   A: 09:00 – 10:00 (60m)
 *   B: 10:00 – 11:00 (60m)   ← target by default
 *   C: 11:00 – 11:30 (30m)
 */
function buildButtingUp() {
  return [
    mkActivity({ id: 'a', name: 'A', plannedStartAt: '09:00', plannedDurationMinutes: 60 }),
    mkActivity({ id: 'b', name: 'B', plannedStartAt: '10:00', plannedDurationMinutes: 60 }),
    mkActivity({ id: 'c', name: 'C', plannedStartAt: '11:00', plannedDurationMinutes: 30 })
  ];
}

describe('editMode.DURATION_OPTIONS', () => {
  test('holds the 6 canonical values in ascending order', () => {
    assert.deepEqual([...DURATION_OPTIONS], [15, 30, 45, 60, 75, 90]);
  });

  test('is frozen', () => {
    assert.equal(Object.isFrozen(DURATION_OPTIONS), true);
    assert.throws(() => {
      // intentional mutation attempt — must throw in strict mode.
      'use strict';
      DURATION_OPTIONS[0] = 999;
    });
  });
});

describe('editMode.applyDurationChange — each option applies cleanly', () => {
  for (const value of [15, 30, 45, 60, 75, 90]) {
    test(`applies ${value}m on the target`, () => {
      const acts = [mkActivity({ id: 'b', plannedStartAt: '10:00', plannedDurationMinutes: 60 })];
      const next = applyDurationChange(acts, 'b', value);
      assert.equal(next[0].plannedDurationMinutes, value);
    });
  }
});

describe('editMode.applyDurationChange — cascade shift', () => {
  test('60 → 90 pushes butting-up successors by +30m', () => {
    const acts = buildButtingUp();
    const next = applyDurationChange(acts, 'b', 90);
    const byId = Object.fromEntries(next.map((a) => [a.id, a]));
    assert.equal(byId.b.plannedDurationMinutes, 90);
    assert.equal(byId.a.plannedStartAt, '09:00'); // predecessor untouched
    // C was butting up at 11:00 → shift +30 → 11:30
    assert.equal(byId.c.plannedStartAt, '11:30');
  });

  test('60 → 30 shrinks and pulls butting-up successors by -30m', () => {
    const acts = buildButtingUp();
    const next = applyDurationChange(acts, 'b', 30);
    const byId = Object.fromEntries(next.map((a) => [a.id, a]));
    assert.equal(byId.b.plannedDurationMinutes, 30);
    assert.equal(byId.c.plannedStartAt, '10:30');
  });

  test('explicit gap > 1 minute: successor is NOT shifted', () => {
    // B ends at 11:00, C starts at 11:30 → 30m explicit gap.
    const acts = [
      mkActivity({ id: 'a', plannedStartAt: '09:00', plannedDurationMinutes: 60 }),
      mkActivity({ id: 'b', plannedStartAt: '10:00', plannedDurationMinutes: 60 }),
      mkActivity({ id: 'c', plannedStartAt: '11:30', plannedDurationMinutes: 30 })
    ];
    const next = applyDurationChange(acts, 'b', 90);
    const byId = Object.fromEntries(next.map((a) => [a.id, a]));
    assert.equal(byId.b.plannedDurationMinutes, 90);
    assert.equal(byId.c.plannedStartAt, '11:30'); // gap preserved
  });

  test('cascade propagates through multiple butting-up successors', () => {
    const acts = [
      mkActivity({ id: 'a', plannedStartAt: '09:00', plannedDurationMinutes: 60 }),
      mkActivity({ id: 'b', plannedStartAt: '10:00', plannedDurationMinutes: 60 }),
      mkActivity({ id: 'c', plannedStartAt: '11:00', plannedDurationMinutes: 30 }),
      mkActivity({ id: 'd', plannedStartAt: '11:30', plannedDurationMinutes: 30 })
    ];
    const next = applyDurationChange(acts, 'b', 90);
    const byId = Object.fromEntries(next.map((a) => [a.id, a]));
    assert.equal(byId.c.plannedStartAt, '11:30');
    assert.equal(byId.d.plannedStartAt, '12:00');
  });

  test('predecessor is never shifted', () => {
    const acts = buildButtingUp();
    const next = applyDurationChange(acts, 'b', 90);
    const a = next.find((x) => x.id === 'a');
    assert.equal(a.plannedStartAt, '09:00');
    assert.equal(a.plannedDurationMinutes, 60);
  });

  test('activities with no plannedStartAt are left untouched', () => {
    const acts = [
      mkActivity({ id: 'b', plannedStartAt: '10:00', plannedDurationMinutes: 60 }),
      mkActivity({ id: 'x', plannedStartAt: null, plannedDurationMinutes: 30 })
    ];
    const next = applyDurationChange(acts, 'b', 90);
    const x = next.find((a) => a.id === 'x');
    assert.equal(x.plannedStartAt, null);
    assert.equal(x.plannedDurationMinutes, 30);
  });

  test('handles ISO plannedStartAt with Z suffix', () => {
    const acts = [
      mkActivity({ id: 'b', plannedStartAt: '2026-04-22T10:00:00Z', plannedDurationMinutes: 60 }),
      mkActivity({ id: 'c', plannedStartAt: '2026-04-22T11:00:00Z', plannedDurationMinutes: 30 })
    ];
    const next = applyDurationChange(acts, 'b', 90);
    const c = next.find((a) => a.id === 'c');
    // Shifted by +30m in ISO form.
    const d = new Date(c.plannedStartAt);
    assert.equal(d.getUTCHours(), 11);
    assert.equal(d.getUTCMinutes(), 30);
  });
});

describe('editMode.applyDurationChange — rejection paths', () => {
  test('protected block throws PROTECTED_BLOCK', () => {
    const acts = [
      mkActivity({
        id: 'standup',
        catalogEntryId: 'cer_daily_standup',
        name: 'Daily Standup',
        bucket: 'COMMUNICATION',
        plannedStartAt: '09:00',
        plannedDurationMinutes: 15
      })
    ];
    assert.throws(
      () => applyDurationChange(acts, 'standup', 30),
      (err) => err.name === 'PROTECTED_BLOCK'
    );
  });

  test('invalid duration (not in DURATION_OPTIONS) throws INVALID_DURATION', () => {
    const acts = [mkActivity({ id: 'b', plannedStartAt: '10:00', plannedDurationMinutes: 60 })];
    for (const bad of [0, 10, 20, 100, 120, -30, 60.5]) {
      assert.throws(
        () => applyDurationChange(acts, 'b', bad),
        (err) => err.name === 'INVALID_DURATION',
        `expected INVALID_DURATION for ${bad}`
      );
    }
  });

  test('missing slot id returns a cloned array unchanged', () => {
    const acts = buildButtingUp();
    const next = applyDurationChange(acts, 'not_there', 30);
    assert.deepEqual(
      next.map((a) => ({ id: a.id, start: a.plannedStartAt, dur: a.plannedDurationMinutes })),
      acts.map((a) => ({ id: a.id, start: a.plannedStartAt, dur: a.plannedDurationMinutes }))
    );
    assert.notEqual(next, acts);
  });

  test('non-array input returns an empty array', () => {
    assert.deepEqual(applyDurationChange(null, 'b', 30), []);
    assert.deepEqual(applyDurationChange(undefined, 'b', 30), []);
  });
});

describe('editMode.applyDurationChange — immutability', () => {
  test('input array and its activities are not mutated', () => {
    const acts = buildButtingUp();
    const snapshot = JSON.stringify(acts);
    applyDurationChange(acts, 'b', 90);
    assert.equal(JSON.stringify(acts), snapshot);
  });

  test('returned array is a new reference', () => {
    const acts = buildButtingUp();
    const next = applyDurationChange(acts, 'b', 90);
    assert.notEqual(next, acts);
    // And every row is also a fresh object.
    for (let i = 0; i < acts.length; i += 1) {
      assert.notEqual(next[i], acts[i]);
    }
  });
});

describe('editMode.computeDurationImpact', () => {
  test('returns +30 delta for 60 → 90', () => {
    const acts = buildButtingUp();
    const result = computeDurationImpact(acts, 'b', 90);
    assert.equal(result.delta, 30);
  });

  test('returns -30 delta for 60 → 30', () => {
    const acts = buildButtingUp();
    const result = computeDurationImpact(acts, 'b', 30);
    assert.equal(result.delta, -30);
  });

  test('computes newEndOfDay after cascade', () => {
    // A 09:00+60, B 10:00+60, C 11:00+30 → end 11:30. Growing B to 90
    // pushes C to 11:30 → end 12:00.
    const acts = buildButtingUp();
    const grow = computeDurationImpact(acts, 'b', 90);
    assert.equal(grow.newEndOfDay, '12:00');
    const shrink = computeDurationImpact(acts, 'b', 30);
    assert.equal(shrink.newEndOfDay, '11:00');
  });

  test('wouldExceedCapacity=true when cascade pushes past 18:00', () => {
    // Pre-existing schedule ends at 17:45, with B as the last-but-one
    // butting-up slot. Growing B by 90m pushes past 18:00.
    const acts = [
      mkActivity({ id: 'a', plannedStartAt: '16:00', plannedDurationMinutes: 60 }),
      mkActivity({ id: 'b', plannedStartAt: '17:00', plannedDurationMinutes: 30 }),
      mkActivity({ id: 'c', plannedStartAt: '17:30', plannedDurationMinutes: 15 })
    ];
    const res = computeDurationImpact(acts, 'b', 90);
    assert.equal(res.wouldExceedCapacity, true);
    assert.equal(res.newEndOfDay, '18:45');
  });

  test('wouldExceedCapacity=false when result stays within 18:00', () => {
    const acts = buildButtingUp();
    const res = computeDurationImpact(acts, 'b', 60); // no-op
    assert.equal(res.wouldExceedCapacity, false);
  });

  test('unknown slot id returns zero delta + no end-of-day', () => {
    const acts = buildButtingUp();
    const res = computeDurationImpact(acts, 'nope', 30);
    assert.equal(res.delta, 0);
    // newEndOfDay may still reflect the current max-end; what matters is
    // the delta is zero and no capacity breach is synthesized.
    assert.equal(res.wouldExceedCapacity, false);
  });

  test('protected target returns zero delta (silent)', () => {
    const acts = [
      mkActivity({
        id: 'standup',
        catalogEntryId: 'cer_daily_standup',
        name: 'Daily Standup',
        plannedStartAt: '09:00',
        plannedDurationMinutes: 15
      })
    ];
    const res = computeDurationImpact(acts, 'standup', 30);
    assert.equal(res.delta, 0);
  });

  test('invalid duration returns zero delta', () => {
    const acts = buildButtingUp();
    const res = computeDurationImpact(acts, 'b', 42);
    assert.equal(res.delta, 0);
  });

  test('wouldFallBelowFloor is reserved and defaults to false', () => {
    const acts = buildButtingUp();
    const res = computeDurationImpact(acts, 'b', 30);
    assert.equal(res.wouldFallBelowFloor, false);
  });
});
