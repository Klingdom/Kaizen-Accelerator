/**
 * Tests for /js/capacity/floorsAndCeilings.js (E4-T1).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  computeBucketFloors,
  computeBucketCeilings,
  BUCKET_DEFAULT_TARGETS,
  FULL_DAILY_CAP_MINUTES,
  FLOOR_MULTIPLIER,
  CEILING_MULTIPLIERS
} from '../../js/capacity/floorsAndCeilings.js';

describe('computeBucketFloors', () => {
  test('480-min day: {120, 60, 60}', () => {
    assert.deepEqual(computeBucketFloors(480), {
      PROJECT: 120,
      COMMUNICATION: 60,
      CI: 60
    });
  });

  test('240-min half day: {60, 30, 30}', () => {
    assert.deepEqual(computeBucketFloors(240), {
      PROJECT: 60,
      COMMUNICATION: 30,
      CI: 30
    });
  });

  test('scales linearly — 720-min day produces {180, 90, 90}', () => {
    assert.deepEqual(computeBucketFloors(720), {
      PROJECT: 180,
      COMMUNICATION: 90,
      CI: 90
    });
  });

  test('zero capacity throws INVALID_CAPACITY', () => {
    assert.throws(
      () => computeBucketFloors(0),
      (e) => e.name === 'INVALID_CAPACITY'
    );
  });

  test('negative capacity throws INVALID_CAPACITY', () => {
    assert.throws(
      () => computeBucketFloors(-100),
      (e) => e.name === 'INVALID_CAPACITY'
    );
  });

  test('non-numeric capacity throws INVALID_CAPACITY', () => {
    assert.throws(
      () => computeBucketFloors('480'),
      (e) => e.name === 'INVALID_CAPACITY'
    );
    assert.throws(
      () => computeBucketFloors(NaN),
      (e) => e.name === 'INVALID_CAPACITY'
    );
    assert.throws(
      () => computeBucketFloors(Infinity),
      (e) => e.name === 'INVALID_CAPACITY'
    );
  });
});

describe('computeBucketCeilings', () => {
  test('480-min day: {264, 150, 150}', () => {
    assert.deepEqual(computeBucketCeilings(480), {
      PROJECT: 264,            // 240 × 1.10
      COMMUNICATION: 150,      // 120 × 1.25
      CI: 150                  // 120 × 1.25
    });
  });

  test('240-min half day: proportional {132, 75, 75}', () => {
    assert.deepEqual(computeBucketCeilings(240), {
      PROJECT: 132,
      COMMUNICATION: 75,
      CI: 75
    });
  });

  test('zero capacity throws INVALID_CAPACITY', () => {
    assert.throws(
      () => computeBucketCeilings(0),
      (e) => e.name === 'INVALID_CAPACITY'
    );
  });
});

describe('constants match ENGINE_DESIGN §2.2', () => {
  test('default targets are the 4-2-2 triple', () => {
    assert.deepEqual(BUCKET_DEFAULT_TARGETS, {
      PROJECT: 240,
      COMMUNICATION: 120,
      CI: 120
    });
  });

  test('full-day reference is 480 minutes', () => {
    assert.equal(FULL_DAILY_CAP_MINUTES, 480);
  });

  test('floor multiplier is 0.5', () => {
    assert.equal(FLOOR_MULTIPLIER, 0.5);
  });

  test('ceiling multipliers are PROJECT=1.10, COMM=1.25, CI=1.25', () => {
    assert.equal(CEILING_MULTIPLIERS.PROJECT, 1.10);
    assert.equal(CEILING_MULTIPLIERS.COMMUNICATION, 1.25);
    assert.equal(CEILING_MULTIPLIERS.CI, 1.25);
  });
});
