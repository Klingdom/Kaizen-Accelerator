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
  renumber,
  applyProcedureNormalization,
  PROCEDURE_FILL_INS
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
