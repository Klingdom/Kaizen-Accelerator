/**
 * Test for Sprint 6 P1-T3 bug fix: Composition.startAt must end with 'Z'
 * so downstream parsers treat it as UTC-deterministic.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { composeDaily } from '../../js/composer/composeDaily.js';
import { GOLDEN_FULL_CATALOG, buildGoldenComposerInput } from '../fixtures/goldenDay.js';

describe('composeDaily — Composition.startAt timezone suffix', () => {
  test('startAt ends with Z (UTC)', () => {
    const input = buildGoldenComposerInput({
      catalog: GOLDEN_FULL_CATALOG.map((c) => ({ ...c }))
    });
    const result = composeDaily(input);
    assert.equal(result.state, 'PROPOSED');
    assert.match(result.composition.startAt, /Z$/);
    assert.match(result.composition.endAt, /Z$/);
  });

  test('new Date(startAt) is a valid UTC date', () => {
    const input = buildGoldenComposerInput({
      catalog: GOLDEN_FULL_CATALOG.map((c) => ({ ...c }))
    });
    const result = composeDaily(input);
    const d = new Date(result.composition.startAt);
    assert.ok(!Number.isNaN(d.getTime()));
    // Matches the input date.
    assert.equal(d.toISOString().slice(0, 10), input.date);
  });
});
