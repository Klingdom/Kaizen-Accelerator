/**
 * Tests for /js/catalog/seed/projectTypeBindings.js (Sprint 9 Pass 9a).
 *
 * The seed step stamps `projectTypeBinding` on DMAIC / Kaizen / PDCA
 * catalog rows per the rule table documented in the module header.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  applyProjectTypeBindings,
  resolveProjectTypeBinding
} from '../../../js/catalog/seed/projectTypeBindings.js';
import { buildCatalog } from '../../../js/catalog/seed/index.js';

describe('projectTypeBindings — resolveProjectTypeBinding()', () => {
  test('#12 PDCA returns AD_HOC', () => {
    const e = { id: 'cat_12_pdca_cycle', activityNumber: 12 };
    assert.equal(resolveProjectTypeBinding(e), 'AD_HOC');
  });

  test('#20 DMAIC charter returns DMAIC', () => {
    const e = { id: 'cat_20_dmaic_charter', activityNumber: 20 };
    assert.equal(resolveProjectTypeBinding(e), 'DMAIC');
  });

  test('#30 (mid-range DMAIC) returns DMAIC', () => {
    const e = { id: 'cat_30_foo', activityNumber: 30 };
    assert.equal(resolveProjectTypeBinding(e), 'DMAIC');
  });

  test('#41 (last DMAIC) returns DMAIC', () => {
    const e = { id: 'cat_41_foo', activityNumber: 41 };
    assert.equal(resolveProjectTypeBinding(e), 'DMAIC');
  });

  test('#42 Kaizen Charter returns set-valued binding (Event + Event_90D + Accelerator_30D)', () => {
    const e = { id: 'cat_42_kaizen_charter', activityNumber: 42 };
    const binding = resolveProjectTypeBinding(e);
    assert.ok(Array.isArray(binding));
    assert.deepEqual([...binding].sort(), ['KAIZEN_ACCELERATOR_30D', 'KAIZEN_EVENT', 'KAIZEN_EVENT_90D']);
  });

  test('#50 Process Owner Transition returns set-valued binding (all three Kaizen types)', () => {
    const e = { id: 'cat_50_foo', activityNumber: 50 };
    const binding = resolveProjectTypeBinding(e);
    assert.ok(Array.isArray(binding));
    assert.deepEqual([...binding].sort(), ['KAIZEN_ACCELERATOR_30D', 'KAIZEN_EVENT', 'KAIZEN_EVENT_90D']);
  });

  test('returned set-valued bindings are fresh copies (not the frozen seed)', () => {
    const a = resolveProjectTypeBinding({ id: 'cat_42_foo', activityNumber: 42 });
    const b = resolveProjectTypeBinding({ id: 'cat_42_foo', activityNumber: 42 });
    assert.notStrictEqual(a, b, 'should return fresh array each call');
    assert.ok(!Object.isFrozen(a), 'returned arrays should be caller-mutable');
  });

  test('#1 L&D returns null (universal CI)', () => {
    const e = { id: 'cat_1_ld', activityNumber: 1 };
    assert.equal(resolveProjectTypeBinding(e), null);
  });

  test('#15 Team meetings returns null (universal COMM)', () => {
    const e = { id: 'cat_15_team_meetings', activityNumber: 15 };
    assert.equal(resolveProjectTypeBinding(e), null);
  });

  test('#18 Document writing returns null (universal)', () => {
    const e = { id: 'cat_18_doc_writing', activityNumber: 18 };
    assert.equal(resolveProjectTypeBinding(e), null);
  });

  test('ceremony rows (null activityNumber) return null', () => {
    const e = { id: 'cer_daily_standup', activityNumber: null };
    assert.equal(resolveProjectTypeBinding(e), null);
  });

  test('generic rows (gen_*) return null', () => {
    const e = { id: 'gen_deep_work_project', activityNumber: null };
    assert.equal(resolveProjectTypeBinding(e), null);
  });

  test('Accelerator id prefix cat_acc_ binds to KAIZEN_ACCELERATOR_30D', () => {
    const e = { id: 'cat_acc_phase0_charter', activityNumber: null };
    assert.equal(resolveProjectTypeBinding(e), 'KAIZEN_ACCELERATOR_30D');
  });

  test('Accelerator id prefix kza_ binds to KAIZEN_ACCELERATOR_30D', () => {
    const e = { id: 'kza_preevent_01', activityNumber: null };
    assert.equal(resolveProjectTypeBinding(e), 'KAIZEN_ACCELERATOR_30D');
  });

  test('focusArea KAIZEN_ACCELERATOR_30D binds to KAIZEN_ACCELERATOR_30D', () => {
    const e = {
      id: 'cat_xyz',
      activityNumber: null,
      focusArea: 'KAIZEN_ACCELERATOR_30D'
    };
    assert.equal(resolveProjectTypeBinding(e), 'KAIZEN_ACCELERATOR_30D');
  });
});

describe('projectTypeBindings — applyProjectTypeBindings()', () => {
  test('overwrites null bindings in-place', () => {
    const drafts = [
      { id: 'cat_20_foo', activityNumber: 20, projectTypeBinding: null },
      { id: 'cat_30_foo', activityNumber: 30, projectTypeBinding: null }
    ];
    const out = applyProjectTypeBindings(drafts);
    assert.equal(out[0].projectTypeBinding, 'DMAIC');
    assert.equal(out[1].projectTypeBinding, 'DMAIC');
  });

  test('does NOT overwrite a pre-existing non-null binding', () => {
    const drafts = [
      {
        id: 'cat_20_foo',
        activityNumber: 20,
        projectTypeBinding: 'KAIZEN_ACCELERATOR_30D'
      }
    ];
    const out = applyProjectTypeBindings(drafts);
    assert.equal(out[0].projectTypeBinding, 'KAIZEN_ACCELERATOR_30D');
  });

  test('returns a new array (does not mutate input)', () => {
    const drafts = [
      { id: 'cat_20_foo', activityNumber: 20, projectTypeBinding: null }
    ];
    const out = applyProjectTypeBindings(drafts);
    assert.notStrictEqual(drafts, out);
    assert.equal(drafts[0].projectTypeBinding, null);
  });

  test('sets universal rows to null (already null stays null)', () => {
    const drafts = [
      { id: 'cat_1_foo', activityNumber: 1, projectTypeBinding: null },
      { id: 'cer_daily_standup', activityNumber: null, projectTypeBinding: null }
    ];
    const out = applyProjectTypeBindings(drafts);
    assert.equal(out[0].projectTypeBinding, null);
    assert.equal(out[1].projectTypeBinding, null);
  });

  test('applies Kaizen anchors as array including KAIZEN_ACCELERATOR_30D', () => {
    const drafts = [
      { id: 'cat_42_kaizen_charter', activityNumber: 42, projectTypeBinding: null }
    ];
    const out = applyProjectTypeBindings(drafts);
    assert.ok(Array.isArray(out[0].projectTypeBinding));
    assert.deepEqual(
      [...out[0].projectTypeBinding].sort(),
      ['KAIZEN_ACCELERATOR_30D', 'KAIZEN_EVENT', 'KAIZEN_EVENT_90D']
    );
  });
});

describe('projectTypeBindings — end-to-end via buildCatalog()', () => {
  const catalog = buildCatalog();

  test('every row has an explicitly-set projectTypeBinding field', () => {
    for (const e of catalog) {
      assert.ok(
        'projectTypeBinding' in e,
        `${e.id} is missing projectTypeBinding`
      );
    }
  });

  test('every DMAIC #20..#41 row is bound to DMAIC', () => {
    for (let n = 20; n <= 41; n += 1) {
      const e = catalog.find((c) => c.activityNumber === n);
      assert.ok(e, `missing catalog row for #${n}`);
      assert.equal(
        e.projectTypeBinding,
        'DMAIC',
        `#${n} (${e.id}) expected DMAIC, got ${JSON.stringify(e.projectTypeBinding)}`
      );
    }
  });

  test('every Kaizen #42..#50 row is bound to all three Kaizen project types', () => {
    for (let n = 42; n <= 50; n += 1) {
      const e = catalog.find((c) => c.activityNumber === n);
      assert.ok(e, `missing catalog row for #${n}`);
      assert.ok(
        Array.isArray(e.projectTypeBinding),
        `#${n} projectTypeBinding should be array, got ${JSON.stringify(e.projectTypeBinding)}`
      );
      assert.deepEqual(
        [...e.projectTypeBinding].sort(),
        ['KAIZEN_ACCELERATOR_30D', 'KAIZEN_EVENT', 'KAIZEN_EVENT_90D']
      );
    }
  });

  test('#12 PDCA is bound to AD_HOC', () => {
    const e = catalog.find((c) => c.activityNumber === 12);
    assert.ok(e);
    assert.equal(e.projectTypeBinding, 'AD_HOC');
  });

  test('ceremonies are all bound to null (universal)', () => {
    const ceremonies = catalog.filter(
      (c) => c.id.startsWith('cer_')
    );
    assert.ok(ceremonies.length >= 6);
    for (const c of ceremonies) {
      assert.equal(
        c.projectTypeBinding,
        null,
        `${c.id} expected null binding`
      );
    }
  });

  test('generics (gen_*) are all bound to null', () => {
    const generics = catalog.filter((c) => c.id.startsWith('gen_'));
    assert.ok(generics.length >= 5);
    for (const g of generics) {
      assert.equal(g.projectTypeBinding, null, `${g.id} expected null`);
    }
  });

  test('rows #1..#11 + #13..#19 (except none in 17) are null (universal)', () => {
    const universalNumbers = [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
      13, 14, 15, 16, 18, 19
    ];
    for (const n of universalNumbers) {
      const e = catalog.find((c) => c.activityNumber === n);
      if (!e) continue;
      assert.equal(
        e.projectTypeBinding,
        null,
        `#${n} (${e.id}) expected null, got ${JSON.stringify(e.projectTypeBinding)}`
      );
    }
  });

  test('total count of DMAIC-bound entries equals 22', () => {
    const dmaic = catalog.filter((c) => c.projectTypeBinding === 'DMAIC');
    assert.equal(dmaic.length, 22);
  });

  test('total count of Kaizen-bound (array) entries equals 9', () => {
    const kaizen = catalog.filter((c) => Array.isArray(c.projectTypeBinding));
    assert.equal(kaizen.length, 9);
  });

  test('integration: no DMAIC (#20..#41) row has stray null binding', () => {
    const strayNulls = catalog.filter(
      (c) =>
        typeof c.activityNumber === 'number' &&
        c.activityNumber >= 20 &&
        c.activityNumber <= 41 &&
        c.projectTypeBinding === null
    );
    assert.deepEqual(
      strayNulls.map((c) => c.id),
      [],
      'DMAIC rows should never have null projectTypeBinding'
    );
  });

  test('integration: no Kaizen (#42..#50) row has stray null binding', () => {
    const strayNulls = catalog.filter(
      (c) =>
        typeof c.activityNumber === 'number' &&
        c.activityNumber >= 42 &&
        c.activityNumber <= 50 &&
        c.projectTypeBinding === null
    );
    assert.deepEqual(strayNulls.map((c) => c.id), []);
  });
});
