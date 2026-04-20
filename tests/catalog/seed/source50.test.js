/**
 * Tests for /js/catalog/seed/source50.js (E2-T2 Sprint-1 stub — first 10 rows).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { parseSource10, parseSourceText, STUB_ROW_LIMIT } from '../../../js/catalog/seed/source50.js';

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
    // 2.0 hours × 60 = 120 minutes.
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
    // 0.5 hours × 60 = 30 minutes.
    assert.equal(r.defaultDurationMinutes, 30);
  });

  test('entry 3: Document Review', () => {
    assert.equal(rows[3].activityNumber, 4);
    assert.match(rows[3].name, /Document Review/i);
  });

  test('entry 4: Team Introductions and Engagements', () => {
    assert.equal(rows[4].activityNumber, 5);
    assert.match(rows[4].name, /Team Introductions/i);
    // 1.0 hours × 60 = 60 minutes.
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

  test('Sprint-2 fields are left null (cadence, trigger, inputs, outputArtifact, participants, bucket, isNonOptional, dependsOn, projectTypeBinding, phaseBinding, appliesToRoles)', () => {
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
        assert.equal(r[field], null, `${r.id}.${field} should be null in Sprint 1 stub`);
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
});
