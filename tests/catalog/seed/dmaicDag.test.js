/**
 * Tests for /js/catalog/seed/dmaicDag.js.
 *
 * §J DMAIC DAG edges and §K.4 Kaizen DAG edges. Sprint 2 seeds these so
 * Sprint 3's composer selectDeepPayload can walk them.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  applyDmaicDag,
  DMAIC_EDGE_TABLE,
  KAIZEN_EDGE_TABLE
} from '../../../js/catalog/seed/dmaicDag.js';
import { applyBulkFill } from '../../../js/catalog/seed/bulkFill.js';
import { applyFillGaps } from '../../../js/catalog/seed/fillGaps.js';
import { parseSource50 } from '../../../js/catalog/seed/source50.js';
import { buildCeremoniesAndGenerics } from '../../../js/catalog/seed/ceremoniesAndGenerics.js';

describe('DMAIC_EDGE_TABLE — structural checks', () => {
  test('covers #20..#41 (22 rows — #39 represented once; pass-2 handled at composer time)', () => {
    const keys = Object.keys(DMAIC_EDGE_TABLE)
      .map((n) => Number.parseInt(n, 10))
      .sort((a, b) => a - b);
    for (let n = 20; n <= 41; n++) {
      assert.ok(keys.includes(n), `missing edge row for DMAIC #${n}`);
    }
    assert.equal(keys.length, 22);
  });

  test('#20 is the entry point with empty dependsOn', () => {
    assert.deepEqual(DMAIC_EDGE_TABLE[20], []);
  });

  test('§J.1 refinement edges: #28 dependsOn [#22, #31]', () => {
    assert.deepEqual(DMAIC_EDGE_TABLE[28], [22, 31]);
  });

  test('§J.1 refinement edges: #33 dependsOn [#22, #36]', () => {
    assert.deepEqual(DMAIC_EDGE_TABLE[33], [22, 36]);
  });

  test('#39 depends on [#38, #33] (pass-1 projected)', () => {
    assert.deepEqual(DMAIC_EDGE_TABLE[39], [38, 33]);
  });

  test('#41 Results Narrative depends on #40 + #39', () => {
    assert.deepEqual(DMAIC_EDGE_TABLE[41], [40, 39]);
  });
});

describe('KAIZEN_EDGE_TABLE — §K.4 structural checks', () => {
  test('covers #42..#50', () => {
    for (let n = 42; n <= 50; n++) {
      assert.ok(KAIZEN_EDGE_TABLE[n] !== undefined, `missing #${n}`);
    }
  });

  test('#42 is the entry point', () => {
    assert.deepEqual(KAIZEN_EDGE_TABLE[42], []);
  });

  test('#44 Event Scheduling depends on [#42, #43]', () => {
    assert.deepEqual(KAIZEN_EDGE_TABLE[44], [42, 43]);
  });

  test('chain #45 → #46 → #47 → #48 → #49 → #50', () => {
    assert.deepEqual(KAIZEN_EDGE_TABLE[45], [44]);
    assert.deepEqual(KAIZEN_EDGE_TABLE[46], [45]);
    assert.deepEqual(KAIZEN_EDGE_TABLE[47], [46]);
    assert.deepEqual(KAIZEN_EDGE_TABLE[48], [47]);
    assert.deepEqual(KAIZEN_EDGE_TABLE[49], [48]);
    assert.deepEqual(KAIZEN_EDGE_TABLE[50], [49]);
  });
});

describe('applyDmaicDag — resolves numbers to ids against the catalog', () => {
  const drafts = [...parseSource50(), ...buildCeremoniesAndGenerics()];
  const final = applyDmaicDag(applyBulkFill(applyFillGaps(drafts)));

  test('DMAIC rows get a dependsOn list of catalog-entry ids', () => {
    const r21 = final.find((e) => e.activityNumber === 21);
    const r20 = final.find((e) => e.activityNumber === 20);
    assert.ok(r21);
    assert.ok(r20);
    assert.deepEqual(r21.dependsOn, [r20.id]);
  });

  test('#28 references the ids for #22 and #31', () => {
    const r28 = final.find((e) => e.activityNumber === 28);
    const r22 = final.find((e) => e.activityNumber === 22);
    const r31 = final.find((e) => e.activityNumber === 31);
    assert.deepEqual(r28.dependsOn, [r22.id, r31.id]);
  });

  test('Kaizen chain #45..#50 correctly linked by id', () => {
    const byNum = new Map(final.map((e) => [e.activityNumber, e]));
    assert.deepEqual(byNum.get(45).dependsOn, [byNum.get(44).id]);
    assert.deepEqual(byNum.get(50).dependsOn, [byNum.get(49).id]);
  });

  test('non-DMAIC rows retain [] dependsOn', () => {
    const r1 = final.find((e) => e.activityNumber === 1);
    assert.deepEqual(r1.dependsOn, []);
  });

  test('throws DAG_PREREQ_NOT_FOUND when a prereq catalog row is missing', () => {
    // Synthetic: a single #21 row with no #20 in the catalog.
    const fake = [
      {
        id: 'cat_21_fake',
        activityNumber: 21,
        name: 'DMAIC SIPOC',
        dependsOn: []
      }
    ];
    assert.throws(
      () => applyDmaicDag(fake),
      (e) => e.name === 'DAG_PREREQ_NOT_FOUND'
    );
  });
});
