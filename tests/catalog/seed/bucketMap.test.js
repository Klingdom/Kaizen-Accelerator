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

  test('#4 Document Review → CI (user reclassification 2026-04-22)', () => {
    assert.equal(pipeline.find((e) => e.activityNumber === 4).bucket, 'CI');
  });

  test('#5 Team Introductions → CI (user reclassification 2026-04-22)', () => {
    assert.equal(pipeline.find((e) => e.activityNumber === 5).bucket, 'CI');
  });

  test('#7–#11 Innovation sub-phases → CI (user reclassification 2026-04-22)', () => {
    for (let n = 7; n <= 11; n++) {
      assert.equal(
        pipeline.find((e) => e.activityNumber === n).bucket,
        'CI',
        `#${n} should be CI`
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

  test('#18 Document Writing → COMMUNICATION (user reclassification 2026-04-22)', () => {
    assert.equal(pipeline.find((e) => e.activityNumber === 18).bucket, 'COMMUNICATION');
  });

  test('#19 Refining Program Plan → COMMUNICATION (user reclassification 2026-04-22)', () => {
    assert.equal(pipeline.find((e) => e.activityNumber === 19).bucket, 'COMMUNICATION');
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

  test('every entry in final pipeline has a non-null bucket value (recovery_lunch excepted — intentional null)', () => {
    for (const e of pipeline) {
      // Iter 26: recovery_lunch has bucket===null intentionally (capacity-neutral).
      if (e.id === 'recovery_lunch') {
        assert.equal(e.bucket, null, 'recovery_lunch must keep bucket===null through bucketMap');
        continue;
      }
      assert.ok(e.bucket, `${e.id} missing bucket`);
      assert.ok(['PROJECT', 'COMMUNICATION', 'CI'].includes(e.bucket), `${e.id} bucket invalid: ${e.bucket}`);
    }
  });

  test('Daily Standup + Mid-Sprint Review stay in COMMUNICATION', () => {
    const standup = pipeline.find((e) => e.id === 'cer_daily_standup');
    assert.equal(standup.bucket, 'COMMUNICATION');
    const mid = pipeline.find((e) => e.id === 'cer_mid_sprint_review');
    assert.equal(mid.bucket, 'COMMUNICATION');
  });

  test('Quarterly + Sprint Planning + Review + Retro ceremonies are CI (user reclassification 2026-04-22)', () => {
    for (const id of [
      'cer_quarterly_planning',
      'cer_sprint_planning',
      'cer_sprint_review',
      'cer_sprint_retrospective'
    ]) {
      assert.equal(pipeline.find((e) => e.id === id).bucket, 'CI', `${id} should be CI`);
    }
  });
});
