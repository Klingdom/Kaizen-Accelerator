/**
 * Tests for /js/catalog/seed/bucketMap.js (E2-T6).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { applyBucketMap } from '../../../js/catalog/seed/bucketMap.js';
import { applyBulkFill } from '../../../js/catalog/seed/bulkFill.js';
import { applyFillGaps } from '../../../js/catalog/seed/fillGaps.js';
import { parseSource50 } from '../../../js/catalog/seed/source50.js';
import { buildCeremoniesAndGenerics } from '../../../js/catalog/seed/ceremoniesAndGenerics.js';

describe('applyBucketMap — §H.1 approved table', () => {
  const pipeline = applyBucketMap(
    applyBulkFill(applyFillGaps([...parseSource50(), ...buildCeremoniesAndGenerics()]))
  );

  test('#1 Personal L&D → CI', () => {
    assert.equal(pipeline.find((e) => e.activityNumber === 1).bucket, 'CI');
  });

  test('#4 Document Review → COMMUNICATION', () => {
    assert.equal(pipeline.find((e) => e.activityNumber === 4).bucket, 'COMMUNICATION');
  });

  test('#7–#11 Innovation pipeline → PROJECT', () => {
    for (let n = 7; n <= 11; n++) {
      assert.equal(
        pipeline.find((e) => e.activityNumber === n).bucket,
        'PROJECT',
        `#${n} should be PROJECT`
      );
    }
  });

  test('#12 PDCA Cycle → CI', () => {
    assert.equal(pipeline.find((e) => e.activityNumber === 12).bucket, 'CI');
  });

  test('#13 6S Email → CI (moved from COMMUNICATION per 2026-04-18)', () => {
    assert.equal(pipeline.find((e) => e.activityNumber === 13).bucket, 'CI');
  });

  test('#14–#16 Communications family → COMMUNICATION', () => {
    for (const n of [14, 15, 16]) {
      assert.equal(
        pipeline.find((e) => e.activityNumber === n).bucket,
        'COMMUNICATION',
        `#${n} should be COMMUNICATION`
      );
    }
  });

  test('#18 Document Writing → PROJECT', () => {
    assert.equal(pipeline.find((e) => e.activityNumber === 18).bucket, 'PROJECT');
  });

  test('#19 Refining Program Plan → PROJECT', () => {
    assert.equal(pipeline.find((e) => e.activityNumber === 19).bucket, 'PROJECT');
  });

  test('DMAIC #20–#41 all → PROJECT', () => {
    for (let n = 20; n <= 41; n++) {
      assert.equal(
        pipeline.find((e) => e.activityNumber === n).bucket,
        'PROJECT',
        `#${n} should be PROJECT`
      );
    }
  });

  test('Kaizen #42–#50 all → PROJECT', () => {
    for (let n = 42; n <= 50; n++) {
      assert.equal(
        pipeline.find((e) => e.activityNumber === n).bucket,
        'PROJECT',
        `#${n} should be PROJECT`
      );
    }
  });

  test('every entry in final pipeline has a non-null bucket value', () => {
    for (const e of pipeline) {
      assert.ok(e.bucket, `${e.id} missing bucket`);
      assert.ok(['PROJECT', 'COMMUNICATION', 'CI'].includes(e.bucket), `${e.id} bucket invalid: ${e.bucket}`);
    }
  });

  test('ceremonies (pre-set buckets) are preserved', () => {
    const standup = pipeline.find((e) => e.id === 'cer_daily_standup');
    assert.equal(standup.bucket, 'COMMUNICATION');
  });
});
