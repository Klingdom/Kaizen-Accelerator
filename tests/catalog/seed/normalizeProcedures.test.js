/**
 * Tests for js/catalog/seed/normalizeProcedures.js (2026-04-23).
 *
 * Confirms:
 *   - stripPrefix handles letter / roman / digit prefixes
 *   - renumber emits sequential "N. " prefixes
 *   - applyProcedureNormalization fills the 11 previously-empty entries
 *     and renumbers the rest
 *   - Every entry in the built catalog ends up with a numbered, non-empty
 *     procedure
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  stripPrefix,
  rewriteBodyLetterRefs,
  renumber,
  applyProcedureNormalization,
  PROCEDURE_FILL_INS,
  CATALOG_NAME_OVERRIDES,
  CATALOG_PROCEDURE_REPLACEMENTS
} from '../../../js/catalog/seed/normalizeProcedures.js';
import { buildCatalog } from '../../../js/catalog/seed/index.js';

describe('stripPrefix', () => {
  test('strips lowercase letter prefix with period', () => {
    assert.equal(stripPrefix('a. Do a thing'), 'Do a thing');
  });

  test('strips uppercase letter prefix', () => {
    assert.equal(stripPrefix('B. Second thing'), 'Second thing');
  });

  test('strips roman-numeral prefix', () => {
    assert.equal(stripPrefix('vii. Seventh step'), 'Seventh step');
  });

  test('strips digit prefix with period', () => {
    assert.equal(stripPrefix('3. Third step'), 'Third step');
  });

  test('strips digit prefix with paren', () => {
    assert.equal(stripPrefix('4) Fourth'), 'Fourth');
  });

  test('preserves inner content even if it contains letter prefixes', () => {
    assert.equal(stripPrefix('a. return to step d for retry'), 'return to step d for retry');
  });

  test('returns empty string on non-string input', () => {
    assert.equal(stripPrefix(null), '');
    assert.equal(stripPrefix(undefined), '');
    assert.equal(stripPrefix(42), '');
  });

  test('trims leading whitespace with prefix', () => {
    assert.equal(stripPrefix('   c.    Indented'), 'Indented');
  });
});

describe('rewriteBodyLetterRefs', () => {
  test('rewrites "step d" to "step 4"', () => {
    assert.equal(rewriteBodyLetterRefs('return to step d to retry'), 'return to step 4 to retry');
  });

  test('rewrites uppercase "step D."', () => {
    assert.equal(rewriteBodyLetterRefs('go to step D. and propose'), 'go to step 4. and propose');
  });

  test('rewrites multiple references in one line', () => {
    assert.equal(
      rewriteBodyLetterRefs('compare step a to step c'),
      'compare step 1 to step 3'
    );
  });

  test('leaves "step iii" alone (multi-character token)', () => {
    assert.equal(rewriteBodyLetterRefs('see step iii for details'), 'see step iii for details');
  });

  test('leaves "stepchild" alone (no whitespace)', () => {
    assert.equal(rewriteBodyLetterRefs('My stepchild is here'), 'My stepchild is here');
  });

  test('non-string input returns empty', () => {
    assert.equal(rewriteBodyLetterRefs(null), '');
    assert.equal(rewriteBodyLetterRefs(42), '');
  });
});

describe('renumber', () => {
  test('emits sequential "N. " prefixes', () => {
    const out = renumber(['a. first', 'b. second', 'c. third']);
    assert.deepEqual(out, ['1. first', '2. second', '3. third']);
  });

  test('drops empty entries', () => {
    const out = renumber(['a. first', '', 'b. second']);
    assert.deepEqual(out, ['1. first', '2. second']);
  });

  test('flattens mixed letter + roman prefixes into flat sequence', () => {
    const out = renumber(['a. main', 'i. sub-one', 'ii. sub-two', 'b. next main']);
    assert.deepEqual(out, ['1. main', '2. sub-one', '3. sub-two', '4. next main']);
  });

  test('returns empty array on non-array input', () => {
    assert.deepEqual(renumber(null), []);
    assert.deepEqual(renumber(undefined), []);
  });
});

describe('applyProcedureNormalization', () => {
  test('fills in an entry that had empty procedure', () => {
    const drafts = [
      { id: 'cat_21', activityNumber: 21, name: 'DMAIC SIPOC', procedure: [] }
    ];
    const out = applyProcedureNormalization(drafts);
    assert.ok(out[0].procedure.length > 0);
    assert.ok(/^1\. /.test(out[0].procedure[0]));
  });

  test('renumbers an already-lettered procedure', () => {
    const drafts = [
      {
        id: 'cat_1',
        activityNumber: 1,
        name: 'Personal L&D',
        procedure: ['a. alpha', 'b. beta', 'c. gamma']
      }
    ];
    const out = applyProcedureNormalization(drafts);
    assert.deepEqual(out[0].procedure, ['1. alpha', '2. beta', '3. gamma']);
  });

  test('does not mutate the input drafts array', () => {
    const drafts = [
      {
        id: 'cat_1',
        activityNumber: 1,
        procedure: ['a. alpha']
      }
    ];
    const snapshot = JSON.parse(JSON.stringify(drafts));
    applyProcedureNormalization(drafts);
    assert.deepEqual(drafts, snapshot);
  });

  test('fill-ins cover every activityNumber we knew was empty', () => {
    const expectedFillIns = [14, 15, 16, 18, 21, 29, 34, 37, 45, 46, 47];
    for (const n of expectedFillIns) {
      assert.ok(
        Array.isArray(PROCEDURE_FILL_INS[n]) && PROCEDURE_FILL_INS[n].length > 0,
        `PROCEDURE_FILL_INS[${n}] should be a non-empty array`
      );
    }
  });
});

describe('buildCatalog end-to-end — every entry has a numbered procedure', () => {
  const catalog = buildCatalog();

  test('every entry has a non-empty procedure', () => {
    for (const e of catalog) {
      assert.ok(
        Array.isArray(e.procedure) && e.procedure.length > 0,
        `${e.id} (#${e.activityNumber}) has empty procedure`
      );
    }
  });

  test('every procedure step starts with "N. "', () => {
    for (const e of catalog) {
      for (let i = 0; i < e.procedure.length; i++) {
        const expected = `${i + 1}. `;
        assert.ok(
          e.procedure[i].startsWith(expected),
          `${e.id} step ${i + 1} does not start with "${expected}": ${JSON.stringify(e.procedure[i])}`
        );
      }
    }
  });
});

describe('Sprint 11 P1-T3 — catalog editorial overrides', () => {
  test('CATALOG_NAME_OVERRIDES covers #3 / #16 / #48', () => {
    assert.equal(CATALOG_NAME_OVERRIDES[3], 'Professional Compliance Training (L&D Tracker)');
    assert.equal(CATALOG_NAME_OVERRIDES[16], 'Peer Connection 1:1s');
    assert.equal(CATALOG_NAME_OVERRIDES[48], 'Kaizen Implemented Improvements — Rollup Tracker');
  });

  test('CATALOG_PROCEDURE_REPLACEMENTS has 5 steps for #3', () => {
    const steps = CATALOG_PROCEDURE_REPLACEMENTS[3];
    assert.ok(Array.isArray(steps));
    assert.equal(steps.length, 5);
  });

  test('CATALOG_PROCEDURE_REPLACEMENTS explains #48 as a rollup tracker', () => {
    const steps = CATALOG_PROCEDURE_REPLACEMENTS[48];
    assert.ok(Array.isArray(steps));
    assert.ok(steps.some((s) => /rollup tracker|not a single work/i.test(s)));
  });

  test('name override wins over parser-sourced name (#3)', () => {
    const drafts = [
      { id: 'cat_3', activityNumber: 3, name: 'Company Compliance Training (L&D Tracker)', procedure: ['a. step'] }
    ];
    const out = applyProcedureNormalization(drafts);
    assert.equal(out[0].name, 'Professional Compliance Training (L&D Tracker)');
  });

  test('name override wins over parser-sourced name (#16)', () => {
    const drafts = [
      { id: 'cat_16', activityNumber: 16, name: 'Connecting with other Companyians (15-60 minutes)', procedure: [] }
    ];
    const out = applyProcedureNormalization(drafts);
    assert.equal(out[0].name, 'Peer Connection 1:1s');
  });

  test('name override wins over parser-sourced name (#48)', () => {
    const drafts = [
      { id: 'cat_48', activityNumber: 48, name: 'Kaizen Implemented Improvements', procedure: ['a. old step'] }
    ];
    const out = applyProcedureNormalization(drafts);
    assert.equal(out[0].name, 'Kaizen Implemented Improvements — Rollup Tracker');
  });

  test('#3 procedure is replaced with the 5-step compliance flow', () => {
    const drafts = [
      { id: 'cat_3', activityNumber: 3, name: 'Whatever', procedure: ['a. old step that should be discarded'] }
    ];
    const out = applyProcedureNormalization(drafts);
    assert.equal(out[0].procedure.length, 5);
    // First step numbered "1. " and references the current training cycle.
    assert.match(out[0].procedure[0], /^1\. /);
    assert.match(out[0].procedure[0], /compliance courses/i);
  });

  test('#48 procedure is replaced with rollup-tracker language', () => {
    const drafts = [
      { id: 'cat_48', activityNumber: 48, name: 'Whatever', procedure: ['a. old step'] }
    ];
    const out = applyProcedureNormalization(drafts);
    assert.ok(out[0].procedure.some((s) => /rollup tracker|not a single work/i.test(s)));
  });

  test('#16 uses the existing PROCEDURE_FILL_IN (not a replacement)', () => {
    // #16 keeps its Sprint 10 fill-in (6-step Peer 1:1s); only the name
    // is overridden. CATALOG_PROCEDURE_REPLACEMENTS[16] should be absent.
    assert.equal(CATALOG_PROCEDURE_REPLACEMENTS[16], undefined);
    const drafts = [
      { id: 'cat_16', activityNumber: 16, name: 'Whatever', procedure: [] }
    ];
    const out = applyProcedureNormalization(drafts);
    // Fill-in is 6 steps.
    assert.equal(out[0].procedure.length, 6);
  });

  test('other entries are untouched by the overrides', () => {
    const drafts = [
      { id: 'cat_1', activityNumber: 1, name: 'Personal L&D', procedure: ['a. alpha'] }
    ];
    const out = applyProcedureNormalization(drafts);
    assert.equal(out[0].name, 'Personal L&D');
    assert.deepEqual(out[0].procedure, ['1. alpha']);
  });

  test('buildCatalog end-to-end applies overrides to #3 / #16 / #48', () => {
    const catalog = buildCatalog();
    const entry3 = catalog.find((e) => e.activityNumber === 3);
    const entry16 = catalog.find((e) => e.activityNumber === 16);
    const entry48 = catalog.find((e) => e.activityNumber === 48);
    assert.equal(entry3.name, 'Professional Compliance Training (L&D Tracker)');
    assert.equal(entry16.name, 'Peer Connection 1:1s');
    assert.equal(entry48.name, 'Kaizen Implemented Improvements — Rollup Tracker');
    // #3 gets the expanded 5-step procedure.
    assert.equal(entry3.procedure.length, 5);
    // #48 procedure includes the rollup-tracker language.
    assert.ok(entry48.procedure.some((s) => /rollup tracker/i.test(s)));
  });
});
