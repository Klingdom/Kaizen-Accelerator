/**
 * Tests for /js/catalog/seed/fillGaps.js (E2-T4).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { applyFillGaps, FILLED_ACTIVITY_NUMBERS } from '../../../js/catalog/seed/fillGaps.js';
import { parseSource50 } from '../../../js/catalog/seed/source50.js';

describe('applyFillGaps — §A rows (19, 20) fill from skeletons', () => {
  const raw = parseSource50();
  const filled = applyFillGaps(raw);

  test('FILLED_ACTIVITY_NUMBERS lists the 23 §A–§D rows', () => {
    // §A: 19, 20 + (#17 reserved, Quarterly Planning handled in ceremonies) = 2
    // §B: 23, 24, 25, 26, 42, 50 = 6
    // §C: 22, 27, 28, 39, 43, 49 = 6
    // §D: 30, 31, 33, 35, 36, 38, 41 = 7
    // Total = 21 fills in FILLS map (Quarterly Planning lives in ceremonies).
    assert.ok(FILLED_ACTIVITY_NUMBERS.length >= 20, `got ${FILLED_ACTIVITY_NUMBERS.length}`);
    for (const n of [19, 20, 22, 23, 24, 25, 26, 27, 28, 30, 31, 33, 35, 36, 38, 39, 41, 42, 43, 49, 50]) {
      assert.ok(FILLED_ACTIVITY_NUMBERS.includes(n), `missing fill for #${n}`);
    }
  });

  test('#19 skeleton picks up duration + procedure', () => {
    const r = filled.find((x) => x.activityNumber === 19);
    assert.ok(r);
    assert.equal(r.defaultDurationMinutes, 120);
    assert.ok(Array.isArray(r.procedure) && r.procedure.length >= 5);
    assert.equal(r.cadence, 'SPRINT');
    assert.ok(r.outputArtifact);
    assert.equal(r.outputArtifact.name, 'Updated Program Plan');
  });

  test('#20 skeleton picks up duration + 9-step Charter procedure', () => {
    const r = filled.find((x) => x.activityNumber === 20);
    assert.ok(r);
    assert.equal(r.defaultDurationMinutes, 120);
    assert.ok(Array.isArray(r.procedure) && r.procedure.length >= 8);
    assert.equal(r.cadence, 'EVENT_DRIVEN');
    assert.deepEqual(r.participants, ['Project Lead', 'Process Owner', 'Sponsor', 'CI Champion']);
  });
});

describe('applyFillGaps — §B rows pick up metadata', () => {
  const filled = applyFillGaps(parseSource50());

  test('#23 Stakeholder Analysis has outputArtifact + participants', () => {
    const r = filled.find((x) => x.activityNumber === 23);
    assert.ok(r.outputArtifact);
    assert.match(r.outputArtifact.name, /Stakeholder/);
    assert.ok(r.participants.length >= 2);
    assert.equal(r.cadence, 'EVENT_DRIVEN');
  });

  test('#42 Kaizen Charter picks up 8-step procedure + Sponsor participant', () => {
    const r = filled.find((x) => x.activityNumber === 42);
    assert.ok(r);
    assert.ok(Array.isArray(r.procedure) && r.procedure.length >= 8);
    assert.ok(r.participants.includes('Sponsor'));
  });
});

describe('applyFillGaps — §C rows pick up inline procedure', () => {
  const filled = applyFillGaps(parseSource50());

  test('#39 Financial Benefit Translator has 7-step procedure + Finance partner', () => {
    const r = filled.find((x) => x.activityNumber === 39);
    assert.ok(r);
    assert.ok(Array.isArray(r.procedure) && r.procedure.length >= 7);
    assert.ok(r.participants.some((p) => /Finance/i.test(p)));
  });

  test('#22 Output DCP replaces template link with 5-step procedure', () => {
    const r = filled.find((x) => x.activityNumber === 22);
    assert.ok(r);
    assert.ok(Array.isArray(r.procedure) && r.procedure.length >= 5);
  });
});

describe('applyFillGaps — §D rows pick up full content', () => {
  const filled = applyFillGaps(parseSource50());

  test('#31 MSA Report picks up Gage R&R procedure', () => {
    const r = filled.find((x) => x.activityNumber === 31);
    assert.ok(r);
    assert.ok(Array.isArray(r.procedure) && r.procedure.length >= 6);
    assert.match(r.outputArtifact.name, /MSA|Gage/i);
  });

  test('#41 Project Results Narrative has 9-section procedure', () => {
    const r = filled.find((x) => x.activityNumber === 41);
    assert.ok(r);
    assert.ok(Array.isArray(r.procedure) && r.procedure.length >= 9);
  });
});

describe('applyFillGaps — non-target rows pass through untouched', () => {
  const raw = parseSource50();
  const filled = applyFillGaps(raw);

  test('row #1 (not in §A–§D) keeps its parser-derived values', () => {
    const rRaw = raw.find((x) => x.activityNumber === 1);
    const rFill = filled.find((x) => x.activityNumber === 1);
    assert.equal(rFill.defaultDurationMinutes, rRaw.defaultDurationMinutes);
    assert.deepEqual(rFill.procedure, rRaw.procedure);
    // Metadata fields still null (bulkFill populates later).
    assert.equal(rFill.cadence, null);
    assert.equal(rFill.outputArtifact, null);
  });
});
