/**
 * Tests for /js/catalog/seed/markNonOptional.js (E2-T7).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { applyMarkNonOptional, NON_OPTIONAL_IDS } from '../../../js/catalog/seed/markNonOptional.js';
import { applyBulkFill } from '../../../js/catalog/seed/bulkFill.js';
import { applyFillGaps } from '../../../js/catalog/seed/fillGaps.js';
import { parseSource50 } from '../../../js/catalog/seed/source50.js';
import { buildCeremoniesAndGenerics } from '../../../js/catalog/seed/ceremoniesAndGenerics.js';

describe('applyMarkNonOptional — locked list from ENGINE_DESIGN §3.4', () => {
  const drafts = [...parseSource50(), ...buildCeremoniesAndGenerics()];
  const final = applyMarkNonOptional(applyBulkFill(applyFillGaps(drafts)));

  test('NON_OPTIONAL_IDS is the 8-id locked list', () => {
    assert.equal(NON_OPTIONAL_IDS.length, 8);
    assert.ok(NON_OPTIONAL_IDS.includes('cer_daily_standup'));
    assert.ok(NON_OPTIONAL_IDS.includes('cer_sprint_planning'));
    assert.ok(NON_OPTIONAL_IDS.includes('cer_mid_sprint_review'));
    assert.ok(NON_OPTIONAL_IDS.includes('cer_sprint_review'));
    assert.ok(NON_OPTIONAL_IDS.includes('cer_sprint_retrospective'));
    assert.ok(NON_OPTIONAL_IDS.includes('gen_end_of_activity_reflection'));
    assert.ok(NON_OPTIONAL_IDS.includes('gen_weekly_reflection'));
    assert.ok(NON_OPTIONAL_IDS.includes('gen_lessons_learned'));
  });

  test('every locked-list id is flagged isNonOptional=true', () => {
    for (const id of NON_OPTIONAL_IDS) {
      const e = final.find((x) => x.id === id);
      assert.ok(e, `id ${id} missing from final catalog`);
      assert.equal(e.isNonOptional, true, `${id} should be non-optional`);
    }
  });

  test('entries outside the locked list remain optional', () => {
    const r1 = final.find((e) => e.activityNumber === 1);
    assert.equal(r1.isNonOptional, false);
    const r14 = final.find((e) => e.activityNumber === 14);
    assert.equal(r14.isNonOptional, false);
  });

  test('is idempotent — running twice produces the same result', () => {
    const once = applyMarkNonOptional(final);
    const twice = applyMarkNonOptional(once);
    assert.deepEqual(
      twice.map((e) => [e.id, e.isNonOptional]),
      once.map((e) => [e.id, e.isNonOptional])
    );
  });
});
