/**
 * Tests for CatalogBucketView (Sprint 7 P0-T7 sub-component).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  CatalogBucketView,
  groupByBucket,
  BUCKET_ORDER,
  BUCKET_LABELS
} from '../../../js/ui/components/CatalogBucketView.js';

function entry(overrides = {}) {
  return {
    id: 'cat_1',
    activityNumber: 1,
    name: 'Sample Entry',
    focusArea: 'DEEP_WORK',
    defaultDurationMinutes: 60,
    cadence: 'DAILY',
    trigger: '',
    inputs: [],
    outputArtifact: { name: 'Out', schema: 'TEXT', required: true },
    participants: [],
    procedure: [],
    bucket: 'PROJECT',
    isNonOptional: false,
    appliesToRoles: ['PRACTITIONER'],
    enabledByUser: true,
    version: 1,
    sourceRef: '',
    dependsOn: [],
    projectTypeBinding: null,
    phaseBinding: null,
    ...overrides
  };
}

describe('CatalogBucketView — structure', () => {
  test('renders 3 bucket columns', () => {
    const html = CatalogBucketView({ entries: [] });
    const matches = html.match(/data-bucket="(PROJECT|COMMUNICATION|CI)"/g) ?? [];
    // At least one per bucket (data-bucket attribute on column).
    assert.ok(matches.length >= 3);
  });

  test('columns appear in PROJECT / COMMUNICATION / CI order', () => {
    const html = CatalogBucketView({ entries: [] });
    const pIdx = html.indexOf('data-bucket="PROJECT"');
    const cIdx = html.indexOf('data-bucket="COMMUNICATION"');
    const ciIdx = html.indexOf('data-bucket="CI"');
    assert.ok(pIdx < cIdx && cIdx < ciIdx);
  });

  test('each column shows count', () => {
    const html = CatalogBucketView({
      entries: [
        entry({ id: 'a', bucket: 'PROJECT' }),
        entry({ id: 'b', bucket: 'COMMUNICATION' }),
        entry({ id: 'c', bucket: 'CI' })
      ]
    });
    assert.match(html, /data-bucket-count="PROJECT">\(1\)/);
    assert.match(html, /data-bucket-count="COMMUNICATION">\(1\)/);
    assert.match(html, /data-bucket-count="CI">\(1\)/);
  });

  test('empty bucket shows empty placeholder', () => {
    const html = CatalogBucketView({ entries: [] });
    const matches = html.match(/cat-bucket-empty/g) ?? [];
    assert.equal(matches.length, 3);
  });

  test('non-optional lock icon appears', () => {
    const html = CatalogBucketView({
      entries: [entry({ isNonOptional: true })]
    });
    assert.match(html, /cat-card-lock/);
  });

  test('non-optional entries render disabled toggle', () => {
    const html = CatalogBucketView({
      entries: [entry({ id: 'x', isNonOptional: true })]
    });
    assert.match(html, /cat-card-toggle[^"]*"[^>]*disabled/);
  });

  test('optional entry renders enabled toggle', () => {
    const html = CatalogBucketView({
      entries: [entry({ id: 'x', isNonOptional: false })]
    });
    assert.ok(!/cat-card-toggle[^"]*"[^>]*disabled/.test(html));
  });

  test('CATALOG_TOGGLE data-action present', () => {
    const html = CatalogBucketView({ entries: [entry()] });
    assert.match(html, /data-action="CATALOG_TOGGLE"/);
  });

  test('activity number prefix shown', () => {
    const html = CatalogBucketView({
      entries: [entry({ activityNumber: 42 })]
    });
    assert.match(html, /#42/);
  });

  test('projectTypeBinding chip renders when set', () => {
    const html = CatalogBucketView({
      entries: [entry({ projectTypeBinding: 'DMAIC' })]
    });
    assert.match(html, /cat-card-pt/);
    assert.match(html, /DMAIC/);
  });

  test('array projectTypeBinding joined with commas', () => {
    const html = CatalogBucketView({
      entries: [entry({ projectTypeBinding: ['DMAIC', 'KAIZEN_EVENT'] })]
    });
    assert.match(html, /DMAIC, KAIZEN_EVENT/);
  });

  test('dependsOn chip renders count', () => {
    const html = CatalogBucketView({
      entries: [entry({ dependsOn: ['cat_a', 'cat_b'] })]
    });
    assert.match(html, /cat-card-dep/);
    assert.match(html, /depends 2/);
  });
});

describe('groupByBucket', () => {
  test('groups entries by bucket', () => {
    const grouped = groupByBucket([
      entry({ id: 'a', bucket: 'PROJECT' }),
      entry({ id: 'b', bucket: 'COMMUNICATION' }),
      entry({ id: 'c', bucket: 'CI' }),
      entry({ id: 'd', bucket: 'PROJECT' })
    ]);
    assert.equal(grouped.PROJECT.length, 2);
    assert.equal(grouped.COMMUNICATION.length, 1);
    assert.equal(grouped.CI.length, 1);
  });

  test('returns empty arrays for empty input', () => {
    const grouped = groupByBucket([]);
    assert.deepEqual(grouped.PROJECT, []);
    assert.deepEqual(grouped.COMMUNICATION, []);
    assert.deepEqual(grouped.CI, []);
  });

  test('returns empty map on non-array input', () => {
    const grouped = groupByBucket(null);
    assert.deepEqual(grouped.PROJECT, []);
  });

  test('drops entries with unknown bucket', () => {
    const grouped = groupByBucket([
      entry({ id: 'x', bucket: 'UNKNOWN' })
    ]);
    assert.equal(grouped.PROJECT.length, 0);
    assert.equal(grouped.COMMUNICATION.length, 0);
    assert.equal(grouped.CI.length, 0);
  });

  test('sorts by activityNumber asc', () => {
    const grouped = groupByBucket([
      entry({ id: 'a', activityNumber: 5, name: 'B' }),
      entry({ id: 'b', activityNumber: 2, name: 'A' })
    ]);
    assert.equal(grouped.PROJECT[0].id, 'b');
    assert.equal(grouped.PROJECT[1].id, 'a');
  });

  test('sorts entries without activityNumber to end, then by name', () => {
    const grouped = groupByBucket([
      entry({ id: 'x', activityNumber: null, name: 'Zeta' }),
      entry({ id: 'y', activityNumber: 3 }),
      entry({ id: 'z', activityNumber: null, name: 'Alpha' })
    ]);
    assert.equal(grouped.PROJECT[0].id, 'y');
    assert.equal(grouped.PROJECT[1].id, 'z');
    assert.equal(grouped.PROJECT[2].id, 'x');
  });
});

describe('BUCKET_ORDER / BUCKET_LABELS', () => {
  test('order matches PROJECT / COMMUNICATION / CI', () => {
    assert.deepEqual([...BUCKET_ORDER], ['PROJECT', 'COMMUNICATION', 'CI']);
  });

  test('labels provided for all 3', () => {
    assert.ok(BUCKET_LABELS.PROJECT);
    assert.ok(BUCKET_LABELS.COMMUNICATION);
    assert.ok(BUCKET_LABELS.CI);
  });
});
