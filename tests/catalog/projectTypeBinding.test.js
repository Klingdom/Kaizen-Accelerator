/**
 * Integration test: every catalog entry must have a valid projectTypeBinding.
 *
 * Acceptance criterion #2 for Sprint 9: "Every catalog entry has
 * `projectTypeBinding` set to a valid value OR `null`. Integration test
 * confirms no stray nulls where bindings should exist."
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { buildCatalog } from '../../js/catalog/seed/index.js';
import { ProjectType } from '../../js/domain/types.js';

const VALID_TYPES = new Set(Object.values(ProjectType));

describe('Catalog — projectTypeBinding integrity', () => {
  const catalog = buildCatalog();

  test('every entry has a projectTypeBinding field (present, not undefined)', () => {
    const missing = catalog.filter((c) => !('projectTypeBinding' in c));
    assert.deepEqual(missing.map((c) => c.id), []);
  });

  test('every binding value is null | string (valid ProjectType) | string[] of valid ProjectTypes', () => {
    const invalid = [];
    for (const c of catalog) {
      const b = c.projectTypeBinding;
      if (b === null) continue;
      if (typeof b === 'string') {
        if (!VALID_TYPES.has(b)) invalid.push(`${c.id}: string ${b}`);
        continue;
      }
      if (Array.isArray(b)) {
        for (const v of b) {
          if (!VALID_TYPES.has(v)) {
            invalid.push(`${c.id}: array element ${v}`);
          }
        }
        continue;
      }
      invalid.push(`${c.id}: wrong shape ${typeof b}`);
    }
    assert.deepEqual(invalid, [], `invalid bindings: ${invalid.join(', ')}`);
  });

  test('no DMAIC row (#20..#41) has a stray null binding', () => {
    const stray = catalog.filter(
      (c) =>
        typeof c.activityNumber === 'number' &&
        c.activityNumber >= 20 &&
        c.activityNumber <= 41 &&
        c.projectTypeBinding === null
    );
    assert.deepEqual(
      stray.map((c) => c.id),
      [],
      'DMAIC rows should bind to DMAIC'
    );
  });

  test('no Kaizen-anchor row (#42..#50) has a stray null binding', () => {
    const stray = catalog.filter(
      (c) =>
        typeof c.activityNumber === 'number' &&
        c.activityNumber >= 42 &&
        c.activityNumber <= 50 &&
        c.projectTypeBinding === null
    );
    assert.deepEqual(stray.map((c) => c.id), []);
  });

  test('#12 PDCA binds to AD_HOC', () => {
    const e = catalog.find((c) => c.activityNumber === 12);
    assert.ok(e);
    assert.equal(e.projectTypeBinding, 'AD_HOC');
  });

  test('ceremonies (cer_*) bind to null', () => {
    const bad = catalog.filter(
      (c) => c.id.startsWith('cer_') && c.projectTypeBinding !== null
    );
    assert.deepEqual(bad.map((c) => c.id), []);
  });

  test('generics (gen_*) bind to null — except gen_dmaic_control_plan (Phase 2 DMAIC-bound)', () => {
    const bad = catalog.filter(
      (c) => c.id.startsWith('gen_') && c.projectTypeBinding !== null
             && c.id !== 'gen_dmaic_control_plan' // Phase 2: intentional DMAIC binding
    );
    assert.deepEqual(bad.map((c) => c.id), []);
  });

  test('DMAIC-bound count equals 23 (22 numbered + gen_dmaic_control_plan Phase 2)', () => {
    const n = catalog.filter((c) => c.projectTypeBinding === 'DMAIC').length;
    assert.equal(n, 23);
  });

  test('AD_HOC-bound count is at least 1 (covers #12)', () => {
    const n = catalog.filter((c) => c.projectTypeBinding === 'AD_HOC').length;
    assert.ok(n >= 1);
  });

  test('array-bound count (Kaizen anchors) equals 9', () => {
    const n = catalog.filter((c) => Array.isArray(c.projectTypeBinding)).length;
    assert.equal(n, 9);
  });
});
