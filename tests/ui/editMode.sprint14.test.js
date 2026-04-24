/**
 * Sprint 14 Pass 14a — start-time pure helper tests.
 *
 * Covers:
 *   - applyStartTimeChange on each of 6 sample times
 *   - cascade shift moves butting-up downstream activities but leaves
 *     gapped ones
 *   - OVERLAPS_PRIOR when new time is earlier than prior end
 *   - PROTECTED_BLOCK on protected slots
 *   - INVALID_TIME on malformed input
 *   - input array not mutated
 *   - date portion of ISO string preserved
 *   - computeStartTimeImpact returns correct delta + flags
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  applyStartTimeChange,
  computeStartTimeImpact
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

describe('editMode.applyStartTimeChange — each sample time applies cleanly', () => {
  // Build an isolated activity at 12:00 so each candidate is always later
  // than any prior end. Cascade is irrelevant here — we only want to
  // confirm the time lands on the target.
  for (const value of ['07:30', '09:00', '10:15', '13:00', '15:45', '17:00']) {
    test(`applies ${value}`, () => {
      const acts = [mkActivity({ id: 'solo', plannedStartAt: '12:00', plannedDurationMinutes: 30 })];
      const next = applyStartTimeChange(acts, 'solo', value);
      assert.equal(next[0].plannedStartAt, value);
    });
  }
});

describe('editMode.applyStartTimeChange — cascade shift', () => {
  test('09:00 → 10:00 shifts a solo activity without touching others', () => {
    const acts = [
      mkActivity({ id: 'solo', plannedStartAt: '09:00', plannedDurationMinutes: 30 })
    ];
    const next = applyStartTimeChange(acts, 'solo', '10:00');
    assert.equal(next[0].plannedStartAt, '10:00');
  });

  test('moving B forward (10:00 → 10:30) pushes butting-up C by +30m', () => {
    const acts = buildButtingUp();
    const next = applyStartTimeChange(acts, 'b', '10:30');
    const byId = Object.fromEntries(next.map((a) => [a.id, a]));
    assert.equal(byId.b.plannedStartAt, '10:30');
    assert.equal(byId.a.plannedStartAt, '09:00'); // predecessor untouched
    assert.equal(byId.c.plannedStartAt, '11:30'); // shifted +30m
  });

  test('gapped successor is NOT shifted', () => {
    const acts = [
      mkActivity({ id: 'a', plannedStartAt: '09:00', plannedDurationMinutes: 60 }),
      mkActivity({ id: 'b', plannedStartAt: '10:00', plannedDurationMinutes: 60 }),
      mkActivity({ id: 'c', plannedStartAt: '11:30', plannedDurationMinutes: 30 }) // 30m gap
    ];
    const next = applyStartTimeChange(acts, 'b', '10:30');
    const byId = Object.fromEntries(next.map((a) => [a.id, a]));
    assert.equal(byId.b.plannedStartAt, '10:30');
    assert.equal(byId.c.plannedStartAt, '11:30'); // gap preserved
  });

  test('cascade propagates through multiple butting-up successors', () => {
    const acts = [
      mkActivity({ id: 'a', plannedStartAt: '09:00', plannedDurationMinutes: 60 }),
      mkActivity({ id: 'b', plannedStartAt: '10:00', plannedDurationMinutes: 60 }),
      mkActivity({ id: 'c', plannedStartAt: '11:00', plannedDurationMinutes: 30 }),
      mkActivity({ id: 'd', plannedStartAt: '11:30', plannedDurationMinutes: 30 })
    ];
    const next = applyStartTimeChange(acts, 'b', '10:30');
    const byId = Object.fromEntries(next.map((a) => [a.id, a]));
    assert.equal(byId.c.plannedStartAt, '11:30');
    assert.equal(byId.d.plannedStartAt, '12:00');
  });

  test('predecessor is never shifted', () => {
    const acts = buildButtingUp();
    const next = applyStartTimeChange(acts, 'b', '10:30');
    const a = next.find((x) => x.id === 'a');
    assert.equal(a.plannedStartAt, '09:00');
    assert.equal(a.plannedDurationMinutes, 60);
  });

  test('activities with no plannedStartAt are left untouched', () => {
    const acts = [
      mkActivity({ id: 'b', plannedStartAt: '10:00', plannedDurationMinutes: 60 }),
      mkActivity({ id: 'x', plannedStartAt: null, plannedDurationMinutes: 30 })
    ];
    const next = applyStartTimeChange(acts, 'b', '10:30');
    const x = next.find((a) => a.id === 'x');
    assert.equal(x.plannedStartAt, null);
  });
});

describe('editMode.applyStartTimeChange — backward shift protection', () => {
  test('OVERLAPS_PRIOR when new time is earlier than prior end', () => {
    // A ends at 10:00 (09:00 + 60). Trying to put B at 09:30 overlaps.
    const acts = buildButtingUp();
    assert.throws(
      () => applyStartTimeChange(acts, 'b', '09:30'),
      (err) => err.name === 'OVERLAPS_PRIOR' && err.priorEndHHMM === '10:00'
    );
  });

  test('OVERLAPS_PRIOR error decorates the prior end time', () => {
    const acts = [
      mkActivity({ id: 'a', plannedStartAt: '09:00', plannedDurationMinutes: 45 }),
      mkActivity({ id: 'b', plannedStartAt: '09:45', plannedDurationMinutes: 30 })
    ];
    try {
      applyStartTimeChange(acts, 'b', '09:30');
      assert.fail('expected OVERLAPS_PRIOR');
    } catch (err) {
      assert.equal(err.name, 'OVERLAPS_PRIOR');
      assert.equal(err.priorEndHHMM, '09:45');
    }
  });

  test('moving to exactly the prior end is allowed (butting up)', () => {
    const acts = buildButtingUp();
    // A ends 10:00. Move B to 10:00 explicitly.
    const next = applyStartTimeChange(acts, 'b', '10:00');
    assert.equal(next.find((x) => x.id === 'b').plannedStartAt, '10:00');
  });

  test('no prior activity → no backward-shift check', () => {
    // Only B and C; B moved backward is fine.
    const acts = [
      mkActivity({ id: 'b', plannedStartAt: '10:00', plannedDurationMinutes: 60 }),
      mkActivity({ id: 'c', plannedStartAt: '11:00', plannedDurationMinutes: 30 })
    ];
    const next = applyStartTimeChange(acts, 'b', '08:00');
    assert.equal(next.find((x) => x.id === 'b').plannedStartAt, '08:00');
  });
});

describe('editMode.applyStartTimeChange — rejection paths', () => {
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
      () => applyStartTimeChange(acts, 'standup', '10:00'),
      (err) => err.name === 'PROTECTED_BLOCK'
    );
  });

  test('INVALID_TIME on empty string', () => {
    const acts = buildButtingUp();
    assert.throws(
      () => applyStartTimeChange(acts, 'b', ''),
      (err) => err.name === 'INVALID_TIME'
    );
  });

  test('INVALID_TIME on non-parsable input', () => {
    const acts = buildButtingUp();
    for (const bad of ['9:00', '09:0', '9am', 'not-a-time', '09-00', '09:000']) {
      assert.throws(
        () => applyStartTimeChange(acts, 'b', bad),
        (err) => err.name === 'INVALID_TIME',
        `expected INVALID_TIME for ${JSON.stringify(bad)}`
      );
    }
  });

  test('INVALID_TIME on out-of-range hours/minutes', () => {
    const acts = buildButtingUp();
    for (const bad of ['24:00', '99:00', '09:60', '09:99']) {
      assert.throws(
        () => applyStartTimeChange(acts, 'b', bad),
        (err) => err.name === 'INVALID_TIME',
        `expected INVALID_TIME for ${bad}`
      );
    }
  });

  test('INVALID_TIME on null/undefined/non-string', () => {
    const acts = buildButtingUp();
    for (const bad of [null, undefined, 930, {}, []]) {
      assert.throws(
        () => applyStartTimeChange(acts, 'b', bad),
        (err) => err.name === 'INVALID_TIME'
      );
    }
  });

  test('missing slot id returns a cloned array unchanged', () => {
    const acts = buildButtingUp();
    const next = applyStartTimeChange(acts, 'not_there', '10:00');
    assert.deepEqual(
      next.map((a) => ({ id: a.id, start: a.plannedStartAt })),
      acts.map((a) => ({ id: a.id, start: a.plannedStartAt }))
    );
    assert.notEqual(next, acts);
  });

  test('non-array input returns an empty array', () => {
    assert.deepEqual(applyStartTimeChange(null, 'b', '10:00'), []);
    assert.deepEqual(applyStartTimeChange(undefined, 'b', '10:00'), []);
  });
});

describe('editMode.applyStartTimeChange — immutability', () => {
  test('input array and its activities are not mutated', () => {
    const acts = buildButtingUp();
    const snapshot = JSON.stringify(acts);
    applyStartTimeChange(acts, 'b', '10:30');
    assert.equal(JSON.stringify(acts), snapshot);
  });

  test('returned array is a new reference', () => {
    const acts = buildButtingUp();
    const next = applyStartTimeChange(acts, 'b', '10:30');
    assert.notEqual(next, acts);
  });
});

describe('editMode.applyStartTimeChange — ISO date preservation', () => {
  test('preserves YYYY-MM-DD + Z portion of ISO string', () => {
    const acts = [
      mkActivity({
        id: 'b',
        plannedStartAt: '2026-04-22T10:00:00Z',
        plannedDurationMinutes: 60
      })
    ];
    const next = applyStartTimeChange(acts, 'b', '11:30');
    assert.equal(next[0].plannedStartAt, '2026-04-22T11:30:00Z');
  });

  test('preserves HH:MM:SS shape (seconds kept)', () => {
    const acts = [
      mkActivity({
        id: 'b',
        plannedStartAt: '10:00:30',
        plannedDurationMinutes: 60
      })
    ];
    const next = applyStartTimeChange(acts, 'b', '11:15');
    assert.equal(next[0].plannedStartAt, '11:15:30');
  });

  test('cascade shifts ISO successors correctly', () => {
    const acts = [
      mkActivity({
        id: 'b',
        plannedStartAt: '2026-04-22T10:00:00Z',
        plannedDurationMinutes: 60
      }),
      mkActivity({
        id: 'c',
        plannedStartAt: '2026-04-22T11:00:00Z',
        plannedDurationMinutes: 30
      })
    ];
    const next = applyStartTimeChange(acts, 'b', '10:30');
    const c = next.find((a) => a.id === 'c');
    const d = new Date(c.plannedStartAt);
    assert.equal(d.getUTCHours(), 11);
    assert.equal(d.getUTCMinutes(), 30);
  });
});

describe('editMode.computeStartTimeImpact', () => {
  test('returns +30 delta for 10:00 → 10:30', () => {
    const acts = buildButtingUp();
    const res = computeStartTimeImpact(acts, 'b', '10:30');
    assert.equal(res.delta, 30);
  });

  test('returns -30 delta for 10:00 → 09:30 (but overlap flag set)', () => {
    const acts = buildButtingUp();
    const res = computeStartTimeImpact(acts, 'b', '09:30');
    assert.equal(res.delta, -30);
    assert.equal(res.wouldOverlapPrior, true);
    assert.equal(res.priorEndHHMM, '10:00');
  });

  test('wouldOverlapPrior=false when new time is at-or-after prior end', () => {
    const acts = buildButtingUp();
    const res = computeStartTimeImpact(acts, 'b', '10:00');
    assert.equal(res.wouldOverlapPrior, false);
    assert.equal(res.priorEndHHMM, '10:00');
  });

  test('computes newEndOfDay after cascade', () => {
    // Base: 09:00+60 / 10:00+60 / 11:00+30 → 11:30 end.
    // Shift B forward 30m → cascade pushes C to 11:30 → end-of-day 12:00.
    const acts = buildButtingUp();
    const res = computeStartTimeImpact(acts, 'b', '10:30');
    assert.equal(res.newEndOfDay, '12:00');
  });

  test('wouldExceedCapacity=true when cascade pushes past 18:00', () => {
    const acts = [
      mkActivity({ id: 'a', plannedStartAt: '16:00', plannedDurationMinutes: 60 }),
      mkActivity({ id: 'b', plannedStartAt: '17:00', plannedDurationMinutes: 30 }),
      mkActivity({ id: 'c', plannedStartAt: '17:30', plannedDurationMinutes: 15 })
    ];
    const res = computeStartTimeImpact(acts, 'b', '17:30');
    assert.equal(res.wouldExceedCapacity, true);
  });

  test('wouldExceedCapacity=false when result stays within 18:00', () => {
    const acts = buildButtingUp();
    const res = computeStartTimeImpact(acts, 'b', '10:00'); // no-op
    assert.equal(res.wouldExceedCapacity, false);
  });

  test('priorEndHHMM is null when no prior activity exists', () => {
    const acts = [
      mkActivity({ id: 'b', plannedStartAt: '10:00', plannedDurationMinutes: 60 }),
      mkActivity({ id: 'c', plannedStartAt: '11:00', plannedDurationMinutes: 30 })
    ];
    const res = computeStartTimeImpact(acts, 'b', '09:00');
    assert.equal(res.priorEndHHMM, null);
    assert.equal(res.wouldOverlapPrior, false);
  });

  test('unknown slot id returns zero delta', () => {
    const acts = buildButtingUp();
    const res = computeStartTimeImpact(acts, 'nope', '10:30');
    assert.equal(res.delta, 0);
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
    const res = computeStartTimeImpact(acts, 'standup', '10:00');
    assert.equal(res.delta, 0);
  });

  test('invalid HH:MM returns zero delta', () => {
    const acts = buildButtingUp();
    const res = computeStartTimeImpact(acts, 'b', 'not-a-time');
    assert.equal(res.delta, 0);
  });
});
