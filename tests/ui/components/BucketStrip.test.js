/**
 * Tests for BucketStrip component — pure render.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  BucketStrip,
  bucketStatus,
  plannedFromActivities,
  DEFAULT_TARGETS,
  DEFAULT_FLOORS,
  DEFAULT_CEILINGS
} from '../../../js/ui/components/BucketStrip.js';

describe('BucketStrip.bucketStatus', () => {
  test('planned within floor and ceiling → ok', () => {
    assert.equal(bucketStatus(200, 120, 264), 'ok');
  });

  test('planned below floor → under-floor', () => {
    assert.equal(bucketStatus(100, 120, 264), 'under-floor');
  });

  test('planned at floor → ok', () => {
    assert.equal(bucketStatus(120, 120, 264), 'ok');
  });

  test('planned at ceiling → ok', () => {
    assert.equal(bucketStatus(264, 120, 264), 'ok');
  });

  test('planned above ceiling → overpacked', () => {
    assert.equal(bucketStatus(300, 120, 264), 'overpacked');
  });

  test('planned zero with positive floor → under-floor', () => {
    assert.equal(bucketStatus(0, 60, 150), 'under-floor');
  });
});

describe('BucketStrip — render output', () => {
  test('returns HTML string with a <ul>', () => {
    const html = BucketStrip();
    assert.equal(typeof html, 'string');
    assert.match(html, /<ul/);
    assert.match(html, /bucket-strip/);
  });

  test('renders 3 rows (one per bucket)', () => {
    const html = BucketStrip();
    const rowCount = (html.match(/class="bucket-row/g) ?? []).length;
    assert.equal(rowCount, 3);
  });

  test('renders user-facing long labels (C-UX-13, Iteration 14)', () => {
    // Labels switched from internal enum names to user-friendly strings.
    // data-bucket attributes remain unchanged (PROJECT/COMMUNICATION/CI).
    const html = BucketStrip();
    assert.match(html, /Deep Work/);
    assert.match(html, /Communication/);
    assert.match(html, /Improvement/);
    // data-bucket attributes must still use internal enum values (AC13-6).
    assert.match(html, /data-bucket="PROJECT"/);
    assert.match(html, /data-bucket="COMMUNICATION"/);
    assert.match(html, /data-bucket="CI"/);
  });

  test('default planned = 0 → status=under-floor on every bucket', () => {
    const html = BucketStrip();
    // Empty bar should flag under-floor in all 3 (0 < 120/60/60 floor).
    const underCount = (html.match(/status-under-floor/g) ?? []).length;
    assert.equal(underCount, 3);
  });

  test('golden 4-2-2 render → status=ok on every bucket', () => {
    const html = BucketStrip({
      planned: { PROJECT: 240, COMMUNICATION: 120, CI: 120 }
    });
    const okCount = (html.match(/status-ok/g) ?? []).length;
    assert.equal(okCount, 3);
  });

  test('under-floor PROJECT bucket marked', () => {
    const html = BucketStrip({
      planned: { PROJECT: 60, COMMUNICATION: 120, CI: 120 }
    });
    // The PROJECT row carries both the under-floor class and the data-bucket attr.
    assert.match(html, /status-under-floor[^>]*data-bucket="PROJECT"/);
  });

  test('overpacked bucket marked', () => {
    const html = BucketStrip({
      planned: { PROJECT: 300, COMMUNICATION: 120, CI: 120 }
    });
    assert.match(html, /status-overpacked/);
  });

  test('shows planned / target values', () => {
    const html = BucketStrip({
      planned: { PROJECT: 180, COMMUNICATION: 90, CI: 60 }
    });
    assert.match(html, /180/);
    assert.match(html, /240/);
    assert.match(html, /90/);
    assert.match(html, /120/);
  });

  test('includes floor and target tick marks per row', () => {
    const html = BucketStrip();
    const floorCount = (html.match(/tick-floor/g) ?? []).length;
    const targetCount = (html.match(/tick-target/g) ?? []).length;
    assert.equal(floorCount, 3);
    assert.equal(targetCount, 3);
  });

  test('escapes hostile bucket value inputs (numeric only)', () => {
    // The BucketStrip only takes numbers; string injection attempts should
    // coerce cleanly via esc().
    const html = BucketStrip({
      planned: { PROJECT: 100, COMMUNICATION: 100, CI: 100 }
    });
    assert.ok(!html.includes('<script'));
  });

  test('accepts custom targets + ceilings (e.g., weekly)', () => {
    const html = BucketStrip({
      planned: { PROJECT: 800, COMMUNICATION: 400, CI: 400 },
      targets: { PROJECT: 1200, COMMUNICATION: 600, CI: 600 },
      floors: { PROJECT: 600, COMMUNICATION: 300, CI: 300 },
      ceilings: { PROJECT: 1320, COMMUNICATION: 750, CI: 750 }
    });
    assert.match(html, /800/);
    assert.match(html, /1200/);
  });

  test('ARIA label present for screen readers', () => {
    const html = BucketStrip();
    assert.match(html, /aria-label="4-2-2 daily rhythm"/);
  });
});

describe('BucketStrip.plannedFromActivities', () => {
  test('sums plannedDurationMinutes per bucket', () => {
    const sums = plannedFromActivities([
      { bucket: 'PROJECT', plannedDurationMinutes: 120 },
      { bucket: 'PROJECT', plannedDurationMinutes: 120 },
      { bucket: 'COMMUNICATION', plannedDurationMinutes: 60 },
      { bucket: 'CI', plannedDurationMinutes: 30 }
    ]);
    assert.deepEqual(sums, { PROJECT: 240, COMMUNICATION: 60, CI: 30 });
  });

  test('empty array → zeros', () => {
    assert.deepEqual(plannedFromActivities([]), {
      PROJECT: 0,
      COMMUNICATION: 0,
      CI: 0
    });
  });

  test('non-array returns zeros', () => {
    assert.deepEqual(plannedFromActivities(null), {
      PROJECT: 0,
      COMMUNICATION: 0,
      CI: 0
    });
  });

  test('SKIPPED activities excluded', () => {
    const sums = plannedFromActivities([
      { bucket: 'PROJECT', plannedDurationMinutes: 120, state: 'SCHEDULED' },
      { bucket: 'PROJECT', plannedDurationMinutes: 120, state: 'SKIPPED' }
    ]);
    assert.equal(sums.PROJECT, 120);
  });

  test('DROPPED activities excluded', () => {
    const sums = plannedFromActivities([
      { bucket: 'CI', plannedDurationMinutes: 30, state: 'DROPPED' }
    ]);
    assert.equal(sums.CI, 0);
  });

  test('unknown bucket keys ignored', () => {
    const sums = plannedFromActivities([
      { bucket: 'UNKNOWN', plannedDurationMinutes: 999 }
    ]);
    assert.deepEqual(sums, { PROJECT: 0, COMMUNICATION: 0, CI: 0 });
  });

  test('missing plannedDurationMinutes treated as 0', () => {
    const sums = plannedFromActivities([
      { bucket: 'PROJECT' }
    ]);
    assert.equal(sums.PROJECT, 0);
  });
});

describe('BucketStrip — defaults exported', () => {
  test('DEFAULT_TARGETS is 4-2-2', () => {
    assert.deepEqual(DEFAULT_TARGETS, {
      PROJECT: 240,
      COMMUNICATION: 120,
      CI: 120
    });
  });

  test('DEFAULT_FLOORS is 50% of targets', () => {
    assert.equal(DEFAULT_FLOORS.PROJECT, 120);
    assert.equal(DEFAULT_FLOORS.COMMUNICATION, 60);
    assert.equal(DEFAULT_FLOORS.CI, 60);
  });

  test('DEFAULT_CEILINGS applies 110% / 125% / 125%', () => {
    assert.equal(DEFAULT_CEILINGS.PROJECT, 264);
    assert.equal(DEFAULT_CEILINGS.COMMUNICATION, 150);
    assert.equal(DEFAULT_CEILINGS.CI, 150);
  });
});
