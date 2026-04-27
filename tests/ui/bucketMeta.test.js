/**
 * Unit tests for js/ui/bucketMeta.js — pure helper spec §6.
 *
 * No DOM, no I/O. All fixtures deterministic.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import bucketMeta, {
  bucketMeta as namedBucketMeta,
  BUCKET_CHIP_CLASS,
  BUCKET_DOT_CLASS,
  BUCKET_LABELS,
  BUCKET_LABELS_LONG
} from '../../js/ui/bucketMeta.js';

// ---------------------------------------------------------------------------
// bucketMeta() — known buckets
// ---------------------------------------------------------------------------
describe('bucketMeta — known buckets', () => {
  test('PROJECT returns correct shape', () => {
    const result = bucketMeta('PROJECT');
    assert.deepEqual(result, {
      bucket:    'PROJECT',
      chipClass: 'chip-project',
      dotClass:  'chip-project',
      label:     'Project',
      labelLong: 'Deep Work',
      vars: { bg: 'var(--project-bg)', fg: 'var(--project-fg)', fill: 'var(--project-fill)' }
    });
  });

  test('COMMUNICATION returns correct shape', () => {
    const result = bucketMeta('COMMUNICATION');
    assert.deepEqual(result, {
      bucket:    'COMMUNICATION',
      chipClass: 'chip-communication',
      dotClass:  'chip-communication',
      label:     'Communication',
      labelLong: 'Communication',
      vars: { bg: 'var(--communication-bg)', fg: 'var(--communication-fg)', fill: 'var(--communication-fill)' }
    });
  });

  test('CI returns correct shape', () => {
    const result = bucketMeta('CI');
    assert.deepEqual(result, {
      bucket:    'CI',
      chipClass: 'chip-ci',
      dotClass:  'chip-ci',
      label:     'Continuous Improvement',
      labelLong: 'Improvement',
      vars: { bg: 'var(--ci-bg)', fg: 'var(--ci-fg)', fill: 'var(--ci-fill)' }
    });
  });

  test('lowercase "project" is normalised to PROJECT shape', () => {
    const result = bucketMeta('project');
    assert.equal(result.bucket, 'PROJECT');
    assert.equal(result.chipClass, 'chip-project');
    assert.equal(result.dotClass, 'chip-project');
    assert.equal(result.label, 'Project');
  });

  test('mixed-case "Communication" is normalised to COMMUNICATION shape', () => {
    const result = bucketMeta('Communication');
    assert.equal(result.bucket, 'COMMUNICATION');
    assert.equal(result.chipClass, 'chip-communication');
  });
});

// ---------------------------------------------------------------------------
// bucketMeta() — fallback / UNKNOWN cases
// ---------------------------------------------------------------------------
describe('bucketMeta — UNKNOWN fallback', () => {
  const UNKNOWN_SHAPE = {
    bucket:    'UNKNOWN',
    chipClass: 'chip-unknown',
    dotClass:  'chip-unknown',
    label:     'Unscheduled',
    labelLong: '',
    vars: {
      bg:   'var(--color-surface-muted)',
      fg:   'var(--color-text-muted)',
      fill: 'var(--color-border-strong)'
    }
  };

  test('null → UNKNOWN', () => {
    assert.deepEqual(bucketMeta(null), UNKNOWN_SHAPE);
  });

  test('undefined → UNKNOWN', () => {
    assert.deepEqual(bucketMeta(undefined), UNKNOWN_SHAPE);
  });

  test('empty string → UNKNOWN', () => {
    assert.deepEqual(bucketMeta(''), UNKNOWN_SHAPE);
  });

  test('unrecognised string → UNKNOWN', () => {
    assert.deepEqual(bucketMeta('GARBAGE'), UNKNOWN_SHAPE);
  });

  test('numeric input → UNKNOWN', () => {
    assert.deepEqual(bucketMeta(42), UNKNOWN_SHAPE);
  });
});

// ---------------------------------------------------------------------------
// Stability and purity
// ---------------------------------------------------------------------------
describe('bucketMeta — stability', () => {
  test('two consecutive calls with same input return value-equal shapes', () => {
    const a = bucketMeta('PROJECT');
    const b = bucketMeta('PROJECT');
    assert.deepEqual(a, b);
    // Must be separate objects (fresh shallow copy per call)
    assert.notEqual(a, b);
  });

  test('returned vars.bg for PROJECT is exactly "var(--project-bg)"', () => {
    assert.equal(bucketMeta('PROJECT').vars.bg, 'var(--project-bg)');
  });

  test('returned vars.fg for CI is exactly "var(--ci-fg)"', () => {
    assert.equal(bucketMeta('CI').vars.fg, 'var(--ci-fg)');
  });

  test('returned vars.fill for COMMUNICATION is exactly "var(--communication-fill)"', () => {
    assert.equal(bucketMeta('COMMUNICATION').vars.fill, 'var(--communication-fill)');
  });
});

// ---------------------------------------------------------------------------
// Named export alias works the same as default export
// ---------------------------------------------------------------------------
describe('bucketMeta — named export', () => {
  test('named export produces the same result as default export', () => {
    assert.deepEqual(namedBucketMeta('PROJECT'), bucketMeta('PROJECT'));
    assert.deepEqual(namedBucketMeta(null), bucketMeta(null));
  });
});

// ---------------------------------------------------------------------------
// Legacy back-compat exports
// ---------------------------------------------------------------------------
describe('BUCKET_CHIP_CLASS back-compat export', () => {
  test('PROJECT → chip-project', () => assert.equal(BUCKET_CHIP_CLASS.PROJECT, 'chip-project'));
  test('COMMUNICATION → chip-communication', () => assert.equal(BUCKET_CHIP_CLASS.COMMUNICATION, 'chip-communication'));
  test('CI → chip-ci', () => assert.equal(BUCKET_CHIP_CLASS.CI, 'chip-ci'));
  test('is frozen', () => assert.equal(Object.isFrozen(BUCKET_CHIP_CLASS), true));
});

describe('BUCKET_DOT_CLASS back-compat export', () => {
  test('PROJECT → chip-project', () => assert.equal(BUCKET_DOT_CLASS.PROJECT, 'chip-project'));
  test('COMMUNICATION → chip-communication', () => assert.equal(BUCKET_DOT_CLASS.COMMUNICATION, 'chip-communication'));
  test('CI → chip-ci', () => assert.equal(BUCKET_DOT_CLASS.CI, 'chip-ci'));
  test('is frozen', () => assert.equal(Object.isFrozen(BUCKET_DOT_CLASS), true));
});

describe('BUCKET_LABELS back-compat export', () => {
  test('PROJECT → Project', () => assert.equal(BUCKET_LABELS.PROJECT, 'Project'));
  test('COMMUNICATION → Communication', () => assert.equal(BUCKET_LABELS.COMMUNICATION, 'Communication'));
  test('CI → Continuous Improvement', () => assert.equal(BUCKET_LABELS.CI, 'Continuous Improvement'));
});

// ---------------------------------------------------------------------------
// C-UX-13 (Iteration 14) — BUCKET_LABELS_LONG + labelLong field (AC13-1..4)
// ---------------------------------------------------------------------------
describe('BUCKET_LABELS_LONG export (AC13-1..3)', () => {
  test('is frozen', () => assert.equal(Object.isFrozen(BUCKET_LABELS_LONG), true));
  test('PROJECT → "Deep Work"', () => assert.equal(BUCKET_LABELS_LONG.PROJECT, 'Deep Work'));
  test('COMMUNICATION → "Communication"', () => assert.equal(BUCKET_LABELS_LONG.COMMUNICATION, 'Communication'));
  test('CI → "Improvement"', () => assert.equal(BUCKET_LABELS_LONG.CI, 'Improvement'));
});

describe('bucketMeta labelLong field (AC13-1..4)', () => {
  test('AC13-1: PROJECT → labelLong "Deep Work", label "Project" preserved', () => {
    const m = bucketMeta('PROJECT');
    assert.equal(m.labelLong, 'Deep Work');
    assert.equal(m.label, 'Project');
  });

  test('AC13-2: CI → labelLong "Improvement"', () => {
    const m = bucketMeta('CI');
    assert.equal(m.labelLong, 'Improvement');
  });

  test('AC13-3: COMMUNICATION → labelLong "Communication"', () => {
    const m = bucketMeta('COMMUNICATION');
    assert.equal(m.labelLong, 'Communication');
  });

  test('AC13-4: null → labelLong ""', () => {
    const m = bucketMeta(null);
    assert.equal(m.labelLong, '');
  });

  test('AC13-4 variant: unknown string → labelLong ""', () => {
    const m = bucketMeta('UNKNOWN_BUCKET');
    assert.equal(m.labelLong, '');
  });

  test('lowercase input normalises and still returns correct labelLong', () => {
    assert.equal(bucketMeta('project').labelLong, 'Deep Work');
    assert.equal(bucketMeta('ci').labelLong, 'Improvement');
  });
});
