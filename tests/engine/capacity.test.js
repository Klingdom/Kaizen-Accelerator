/**
 * Tests for /js/engine/capacity.js (E3-T1 + E3-T2).
 *
 * Acceptance from build prompt:
 *   - default user → {PROJECT:240, COMM:120, CI:120}
 *   - half-day user (240 cap) → {120, 60, 60}
 *   - externalMinutesToday=60 → {PROJECT:240, COMM:max(60, 120−60)=60, CI:120}
 *   - externalMinutesToday=120 with full-day → COMM floor violation warning
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { computeBucketTargets, buildComposerInput } from '../../js/engine/capacity.js';

// ---------------------------------------------------------------------------
// computeBucketTargets
// ---------------------------------------------------------------------------

describe('computeBucketTargets — default full-day user', () => {
  const user = { id: 'u', dailyCapacityMinutes: 480 };

  test('returns 240/120/120 at ext=0', () => {
    const t = computeBucketTargets(user, 0);
    assert.equal(t.PROJECT, 240);
    assert.equal(t.COMMUNICATION, 120);
    assert.equal(t.CI, 120);
    assert.equal(t._ext, 0);
    assert.equal(t._warnings, undefined);
  });

  test('ext defaults to 0 when omitted', () => {
    const t = computeBucketTargets(user);
    assert.equal(t.COMMUNICATION, 120);
  });
});

describe('computeBucketTargets — half-day scaling', () => {
  test('cap=240 → 120/60/60', () => {
    const user = { id: 'u', dailyCapacityMinutes: 240 };
    const t = computeBucketTargets(user, 0);
    assert.equal(t.PROJECT, 120);
    assert.equal(t.COMMUNICATION, 60);
    assert.equal(t.CI, 60);
  });

  test('cap=360 (6h) → 180/90/90', () => {
    const user = { id: 'u', dailyCapacityMinutes: 360 };
    const t = computeBucketTargets(user, 0);
    assert.equal(t.PROJECT, 180);
    assert.equal(t.COMMUNICATION, 90);
    assert.equal(t.CI, 90);
  });
});

describe('computeBucketTargets — external drain', () => {
  const user = { id: 'u', dailyCapacityMinutes: 480 };

  test('ext=60 drops COMM to 60; floor held', () => {
    const t = computeBucketTargets(user, 60);
    assert.equal(t.PROJECT, 240);
    assert.equal(t.COMMUNICATION, 60); // max(60, 120 − 60) = 60
    assert.equal(t.CI, 120);
    assert.equal(t._ext, 60);
  });

  test('ext=30 drops COMM to 90 (no floor clamp)', () => {
    const t = computeBucketTargets(user, 30);
    assert.equal(t.COMMUNICATION, 90);
    assert.equal(t._warnings, undefined);
  });

  test('ext=90 clamps COMM at floor=60 and emits warning', () => {
    const t = computeBucketTargets(user, 90);
    // max(60, 120 − 90) = max(60, 30) = 60
    assert.equal(t.COMMUNICATION, 60);
    assert.ok(Array.isArray(t._warnings));
    assert.ok(t._warnings[0].includes('COMM_FLOOR_VIOLATION'));
  });

  test('ext=120 at full-day → COMM_FLOOR_VIOLATION warning', () => {
    const t = computeBucketTargets(user, 120);
    assert.equal(t.COMMUNICATION, 60);
    assert.ok(Array.isArray(t._warnings));
    assert.match(t._warnings[0], /COMM_FLOOR_VIOLATION/);
  });

  test('ext=150 clamped to 150 (not 240); COMM still at floor', () => {
    const t = computeBucketTargets(user, 150);
    assert.equal(t._ext, 150);
    assert.equal(t.COMMUNICATION, 60);
    assert.ok(t._warnings);
  });

  test('ext > 240 clamped to 240', () => {
    const t = computeBucketTargets(user, 500);
    assert.equal(t._ext, 240);
  });

  test('ext < 0 clamped to 0', () => {
    const t = computeBucketTargets(user, -10);
    assert.equal(t._ext, 0);
    assert.equal(t.COMMUNICATION, 120);
  });
});

describe('computeBucketTargets — half-day with ext', () => {
  const user = { id: 'u', dailyCapacityMinutes: 240 };

  test('cap=240, ext=30 → COMM floor=30 respected', () => {
    const t = computeBucketTargets(user, 30);
    // half-day floor = round(60*0.5) = 30.
    // max(30, 60 − 30) = 30.
    assert.equal(t.COMMUNICATION, 30);
  });

  test('cap=240, ext=60 → COMM pinned at floor 30 with warning', () => {
    const t = computeBucketTargets(user, 60);
    assert.equal(t.COMMUNICATION, 30);
    assert.ok(t._warnings);
  });
});

describe('computeBucketTargets — validation', () => {
  test('throws INVALID_USER when user is missing', () => {
    assert.throws(
      () => computeBucketTargets(null, 0),
      (e) => e.name === 'INVALID_USER'
    );
  });

  test('throws INVALID_CAPACITY when dailyCapacityMinutes missing', () => {
    assert.throws(
      () => computeBucketTargets({}, 0),
      (e) => e.name === 'INVALID_CAPACITY'
    );
  });

  test('throws INVALID_CAPACITY on 0 or negative', () => {
    assert.throws(
      () => computeBucketTargets({ dailyCapacityMinutes: 0 }, 0),
      (e) => e.name === 'INVALID_CAPACITY'
    );
    assert.throws(
      () => computeBucketTargets({ dailyCapacityMinutes: -1 }, 0),
      (e) => e.name === 'INVALID_CAPACITY'
    );
  });
});

// ---------------------------------------------------------------------------
// buildComposerInput
// ---------------------------------------------------------------------------

describe('buildComposerInput — E3-T1 contract', () => {
  const user = {
    id: 'u_phil',
    role: ['PRACTITIONER'],
    dailyCapacityMinutes: 480
  };

  test('returns the ENGINE_DESIGN §1.1 shape', () => {
    const input = buildComposerInput({
      cycleType: 'DAILY',
      user,
      date: '2026-04-21',
      externalMinutesToday: 60,
      sprintPhase: 'EXECUTION'
    });
    assert.equal(input.cycleType, 'DAILY');
    assert.equal(input.userId, 'u_phil');
    assert.equal(input.date, '2026-04-21');
    assert.deepEqual(input.role, ['PRACTITIONER']);
    assert.equal(input.dailyCapacityMinutes, 480);
    assert.equal(input.externalMinutesToday, 60);
    assert.equal(input.sprintPhase, 'EXECUTION');
    assert.equal(input.activeKaizen, null);
    assert.deepEqual(input.varianceQueue, []);
    assert.deepEqual(input.catalog, []);
    assert.deepEqual(input.priorCompositions, []);
    assert.equal(input.signals.inboxOverThreshold, false);
    assert.deepEqual(input.signals.documentAwaitingReview, []);
    assert.deepEqual(input.signals.innovationStageReady, []);
  });

  test('clamps externalMinutesToday to [0, 240]', () => {
    const i1 = buildComposerInput({
      cycleType: 'DAILY',
      user,
      date: '2026-04-21',
      externalMinutesToday: 500
    });
    assert.equal(i1.externalMinutesToday, 240);

    const i2 = buildComposerInput({
      cycleType: 'DAILY',
      user,
      date: '2026-04-21',
      externalMinutesToday: -50
    });
    assert.equal(i2.externalMinutesToday, 0);
  });

  test('copies arrays defensively (no shared references)', () => {
    const vq = [{ id: 'v1', kind: 'SKIPPED_NON_OPTIONAL' }];
    const cat = [{ id: 'c1' }];
    const input = buildComposerInput({
      cycleType: 'DAILY',
      user,
      date: '2026-04-21',
      varianceQueue: vq,
      catalog: cat
    });
    input.varianceQueue.push({ id: 'v2' });
    input.catalog.push({ id: 'c2' });
    assert.equal(vq.length, 1);
    assert.equal(cat.length, 1);
  });

  test('throws on missing cycleType / user / date', () => {
    assert.throws(
      () => buildComposerInput({ user, date: '2026-04-21' }),
      (e) => e.name === 'MISSING_CYCLE_TYPE'
    );
    assert.throws(
      () => buildComposerInput({ cycleType: 'DAILY', date: '2026-04-21' }),
      (e) => e.name === 'MISSING_USER'
    );
    assert.throws(
      () => buildComposerInput({ cycleType: 'DAILY', user }),
      (e) => e.name === 'MISSING_DATE'
    );
  });

  test('throws INVALID_DEPS when deps is null', () => {
    assert.throws(
      () => buildComposerInput(null),
      (e) => e.name === 'INVALID_DEPS'
    );
  });
});
