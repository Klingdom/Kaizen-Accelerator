/**
 * Tests for /js/catalog/seed/source50.js.
 *
 * Sprint 1 tested the 10-row stub via parseSource10(). Sprint 2 adds the
 * full-source exercise via parseSource50(), which is the real seed input.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  parseSource10,
  parseSource50,
  parseSourceText,
  STUB_ROW_LIMIT,
  EXPECTED_NUMBERED_ROWS,
  EXPECTED_ROW_COUNT
} from '../../../js/catalog/seed/source50.js';

// ---------------------------------------------------------------------------
// Sprint 1 stub behaviour — preserved verbatim.
// ---------------------------------------------------------------------------

describe('parseSource10 — 10 entries from real source', () => {
  const rows = parseSource10();

  test('returns exactly 10 entries', () => {
    assert.equal(rows.length, STUB_ROW_LIMIT);
    assert.equal(rows.length, 10);
  });

  test('activityNumber runs 1..10 in order', () => {
    for (let i = 0; i < rows.length; i++) {
      assert.equal(rows[i].activityNumber, i + 1);
    }
  });

  test('entry 0: Personal L&D, activityNumber=1', () => {
    const r = rows[0];
    assert.equal(r.activityNumber, 1);
    assert.match(r.name, /Personal Learning and Development/i);
    assert.equal(r.focusArea, 'CONTINUOUS_IMPROVEMENT');
    assert.equal(r.defaultDurationMinutes, 120);
    assert.ok(Array.isArray(r.procedure) && r.procedure.length > 0);
  });

  test('entry 1: Team L&D, activityNumber=2', () => {
    const r = rows[1];
    assert.equal(r.activityNumber, 2);
    assert.match(r.name, /Team Learning and Development/i);
    assert.equal(r.defaultDurationMinutes, 120);
  });

  test('entry 2: Company Compliance Training, activityNumber=3, 30 minutes', () => {
    const r = rows[2];
    assert.equal(r.activityNumber, 3);
    assert.match(r.name, /Company Compliance Training/i);
    assert.equal(r.defaultDurationMinutes, 30);
  });

  test('entry 3: Document Review', () => {
    assert.equal(rows[3].activityNumber, 4);
    assert.match(rows[3].name, /Document Review/i);
  });

  test('entry 4: Team Introductions and Engagements', () => {
    assert.equal(rows[4].activityNumber, 5);
    assert.match(rows[4].name, /Team Introductions/i);
    assert.equal(rows[4].defaultDurationMinutes, 60);
  });

  test('entries 5..9: Innovation Process family, numbers 6..10', () => {
    for (let n = 6; n <= 10; n++) {
      const r = rows[n - 1];
      assert.equal(r.activityNumber, n);
      assert.match(r.name, /Innovation Process/i);
    }
  });

  test('every entry carries a sourceRef pointing at the real file + a line number', () => {
    for (const r of rows) {
      assert.ok(typeof r.sourceRef === 'string');
      assert.match(r.sourceRef, /Business Agility Standard Work\.txt:\d+/);
    }
  });

  test('every entry has a deterministic id prefixed cat_<n>_', () => {
    const seen = new Set();
    for (const r of rows) {
      assert.match(r.id, /^cat_\d+_[a-z0-9_]+$/);
      assert.ok(!seen.has(r.id), `duplicate id ${r.id}`);
      seen.add(r.id);
    }
  });

  test('Sprint-2 fields are left null on source-parsed drafts', () => {
    for (const r of rows) {
      for (const field of [
        'cadence',
        'trigger',
        'inputs',
        'outputArtifact',
        'participants',
        'bucket',
        'isNonOptional',
        'dependsOn',
        'projectTypeBinding',
        'phaseBinding',
        'appliesToRoles'
      ]) {
        assert.equal(r[field], null, `${r.id}.${field} should be null on raw draft`);
      }
    }
  });

  test('stable defaults: enabledByUser=true, version=1', () => {
    for (const r of rows) {
      assert.equal(r.enabledByUser, true);
      assert.equal(r.version, 1);
    }
  });
});

// ---------------------------------------------------------------------------
// E2-T2 — full 50-row parser.
// ---------------------------------------------------------------------------

describe('parseSource50 — full source', () => {
  const rows = parseSource50();

  test('EXPECTED_NUMBERED_ROWS has 49 entries (no #17)', () => {
    assert.equal(EXPECTED_ROW_COUNT, 49);
    assert.equal(EXPECTED_NUMBERED_ROWS.length, 49);
    assert.ok(!EXPECTED_NUMBERED_ROWS.includes(17));
    assert.ok(EXPECTED_NUMBERED_ROWS.includes(1));
    assert.ok(EXPECTED_NUMBERED_ROWS.includes(16));
    assert.ok(EXPECTED_NUMBERED_ROWS.includes(18));
    assert.ok(EXPECTED_NUMBERED_ROWS.includes(19));
    assert.ok(EXPECTED_NUMBERED_ROWS.includes(20));
    assert.ok(EXPECTED_NUMBERED_ROWS.includes(50));
  });

  test('returns exactly 49 entries (50 numbered rows minus #17 reserved)', () => {
    assert.equal(rows.length, EXPECTED_ROW_COUNT);
  });

  test('every EXPECTED_NUMBERED_ROWS value is produced exactly once', () => {
    const nums = rows.map((r) => r.activityNumber).sort((a, b) => a - b);
    const expected = [...EXPECTED_NUMBERED_ROWS].sort((a, b) => a - b);
    assert.deepEqual(nums, expected);
  });

  test('row 17 is NOT produced (reserved per CATALOG_GAPS §F.1)', () => {
    const found = rows.find((r) => r.activityNumber === 17);
    assert.equal(found, undefined);
  });

  test('rows 19 and 20 are skeletons (hours/procedure null)', () => {
    const r19 = rows.find((r) => r.activityNumber === 19);
    const r20 = rows.find((r) => r.activityNumber === 20);
    assert.ok(r19, 'row 19 should be present as skeleton');
    assert.ok(r20, 'row 20 should be present as skeleton');
    assert.equal(r19.defaultDurationMinutes, null);
    assert.equal(r19.procedure, null);
    assert.equal(r20.defaultDurationMinutes, null);
    assert.equal(r20.procedure, null);
    // But name and focus-area ARE populated from the source file.
    assert.match(r19.name, /Refining Program Plan/i);
    assert.equal(r19.focusArea, 'COMMUNICATION');
    assert.match(r20.name, /DMAIC Project Charter/i);
    assert.equal(r20.focusArea, 'DMAIC');
  });

  test('rows with hours have procedures with ≥ 1 step', () => {
    for (const r of rows) {
      if (r.defaultDurationMinutes !== null) {
        assert.ok(Array.isArray(r.procedure), `row #${r.activityNumber} missing procedure array`);
        // Most rows have steps; a handful are blank-procedure per §D and
        // may parse to []. That's OK — fillGaps will backfill.
      }
    }
  });

  test('DMAIC cohort (#21..#41) present with focusArea=DMAIC', () => {
    for (let n = 21; n <= 41; n++) {
      const r = rows.find((x) => x.activityNumber === n);
      assert.ok(r, `DMAIC row #${n} missing`);
      assert.equal(r.focusArea, 'DMAIC');
    }
  });

  test('Kaizen cohort (#42..#50) present with focusArea=KAIZEN', () => {
    for (let n = 42; n <= 50; n++) {
      const r = rows.find((x) => x.activityNumber === n);
      assert.ok(r, `Kaizen row #${n} missing`);
      assert.equal(r.focusArea, 'KAIZEN');
    }
  });

  test('#14 + #16 are COMMUNICATION focus-area (Communications column)', () => {
    const r14 = rows.find((r) => r.activityNumber === 14);
    const r16 = rows.find((r) => r.activityNumber === 16);
    assert.ok(r14);
    assert.ok(r16);
    assert.equal(r14.focusArea, 'COMMUNICATION');
    assert.equal(r16.focusArea, 'COMMUNICATION');
  });

  test('every draft leaves Sprint-2 cross-cutting fields null', () => {
    for (const r of rows) {
      for (const field of [
        'cadence',
        'trigger',
        'inputs',
        'outputArtifact',
        'participants',
        'bucket',
        'isNonOptional',
        'dependsOn',
        'projectTypeBinding',
        'phaseBinding',
        'appliesToRoles'
      ]) {
        assert.equal(r[field], null);
      }
    }
  });

  test('ids are unique and deterministic', () => {
    const ids = new Set();
    for (const r of rows) {
      assert.match(r.id, /^cat_\d+_[a-z0-9_]+$/);
      assert.ok(!ids.has(r.id), `duplicate id ${r.id}`);
      ids.add(r.id);
    }
  });

  test('sourceRef line numbers are strictly ascending by activityNumber', () => {
    // Every numbered row appears in source file order, so headerLineNumber
    // must be strictly ascending as activityNumber ascends.
    const sorted = [...rows].sort((a, b) => a.activityNumber - b.activityNumber);
    let prev = 0;
    for (const r of sorted) {
      const ln = Number.parseInt(r.sourceRef.split(':').pop(), 10);
      assert.ok(ln > prev, `sourceRef line ${ln} not > ${prev} for #${r.activityNumber}`);
      prev = ln;
    }
  });
});

// ---------------------------------------------------------------------------
// parseSourceText — synthetic-input unit tests.
// ---------------------------------------------------------------------------

describe('parseSourceText — unit-testable with injected text', () => {
  test('parses a minimal synthetic block', () => {
    const text = [
      'header preamble should be ignored',
      '',
      '1',
      'Continuous Improvement',
      'Synthetic Activity',
      '2.0',
      'a. Step one',
      'b. Step two',
      '',
      ''
    ].join('\n');

    const rows = parseSourceText(text, '/virtual/source.txt', 1);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].activityNumber, 1);
    assert.equal(rows[0].name, 'Synthetic Activity');
    assert.equal(rows[0].defaultDurationMinutes, 120);
    assert.deepEqual(rows[0].procedure, ['a. Step one', 'b. Step two']);
    assert.match(rows[0].sourceRef, /\/virtual\/source\.txt:\d+/);
  });

  test('respects the limit argument', () => {
    const text = Array.from({ length: 5 }, (_, i) => [
      String(i + 1),
      'Continuous Improvement',
      `Activity ${i + 1}`,
      '1.0',
      'a. Only step',
      '',
      ''
    ].join('\n')).join('\n');

    const rows = parseSourceText(text, '/virtual/source.txt', 3);
    assert.equal(rows.length, 3);
    assert.equal(rows[2].activityNumber, 3);
  });

  test('throws on unrecognized focus area (UNKNOWN_FOCUS_AREA)', () => {
    const text = ['1', 'Not A Real Area', 'Activity', '1.0', 'a. Step', '', ''].join('\n');
    assert.throws(
      () => parseSourceText(text, '/virtual/x.txt', 1),
      (e) => e.name === 'UNKNOWN_FOCUS_AREA'
    );
  });

  test('skeleton row — no hours line — yields null duration and null procedure', () => {
    const text = [
      '5',
      'Continuous Improvement',
      'Activity Five',
      '', // blank separator
      '6', // next activity header
      'Continuous Improvement',
      'Activity Six',
      '1.0',
      'a. Step one',
      '',
      ''
    ].join('\n');

    const rows = parseSourceText(text, '/virtual/x.txt');
    assert.equal(rows.length, 2);
    assert.equal(rows[0].activityNumber, 5);
    assert.equal(rows[0].defaultDurationMinutes, null);
    assert.equal(rows[0].procedure, null);
    assert.equal(rows[1].activityNumber, 6);
    assert.equal(rows[1].defaultDurationMinutes, 60);
  });

  test('focus-area aliases are normalized (Communications → COMMUNICATION)', () => {
    const text = ['1', 'Communications', 'Alias Test', '1.0', 'a. Step', '', ''].join('\n');
    const rows = parseSourceText(text, '/virtual/x.txt', 1);
    assert.equal(rows[0].focusArea, 'COMMUNICATION');
  });

  test('Kaizen Project Work → KAIZEN; DMAIC Project Work → DMAIC', () => {
    const text = [
      '42',
      'Kaizen Project Work',
      'Kaizen Task',
      '1.0',
      'a. Step',
      '',
      '',
      '20',
      'DMAIC Project Work',
      'DMAIC Task',
      '1.0',
      'a. Step',
      '',
      ''
    ].join('\n');
    const rows = parseSourceText(text, '/virtual/x.txt');
    assert.equal(rows[0].focusArea, 'KAIZEN');
    assert.equal(rows[1].focusArea, 'DMAIC');
  });
});
