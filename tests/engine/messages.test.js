/**
 * Tests for /js/engine/messages.js (E4-T6).
 *
 * Exact UX_FLOWS §4.3 text templates.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { formatInvariantMessage } from '../../js/engine/messages.js';

describe('formatInvariantMessage — exact text per UX_FLOWS §4.3', () => {
  test('DEEP_UNDER_FLOOR', () => {
    const msg = formatInvariantMessage({
      failureCode: 'DEEP_UNDER_FLOOR',
      detail: { actual: 180, floor: 240 }
    });
    assert.equal(
      msg,
      'PROJECT bucket is 180 min, needs ≥ 240. Move an activity to PROJECT or replace a Communication block.'
    );
  });

  test('COMM_UNDER_FLOOR', () => {
    const msg = formatInvariantMessage({
      failureCode: 'COMM_UNDER_FLOOR',
      detail: { actual: 60, floor: 60 }
    });
    assert.equal(
      msg,
      'COMMUNICATION bucket is 60 min, needs ≥ 60. Add a 1:1 or a team meeting.'
    );
  });

  test('CI_UNDER_FLOOR', () => {
    const msg = formatInvariantMessage({
      failureCode: 'CI_UNDER_FLOOR',
      detail: { actual: 40, floor: 60 }
    });
    assert.equal(
      msg,
      'CI bucket is 40 min, needs ≥ 60. Add a PDCA tick or L&D block.'
    );
  });

  test('PROJECT_OVERPACKED', () => {
    const msg = formatInvariantMessage({
      failureCode: 'PROJECT_OVERPACKED',
      detail: { actual: 295, ceiling: 264 }
    });
    assert.equal(
      msg,
      'PROJECT is 295 min, ceiling is 264. Remove a block or shorten one.'
    );
  });

  test('COMM_OVERPACKED', () => {
    const msg = formatInvariantMessage({
      failureCode: 'COMM_OVERPACKED',
      detail: { actual: 165, ceiling: 150 }
    });
    assert.equal(
      msg,
      'COMMUNICATION is 165 min, ceiling is 150. Remove a meeting or shorten one.'
    );
  });

  test('CI_OVERPACKED', () => {
    const msg = formatInvariantMessage({
      failureCode: 'CI_OVERPACKED',
      detail: { actual: 160, ceiling: 150 }
    });
    assert.equal(
      msg,
      'CI is 160 min, ceiling is 150. Remove a CI block or shorten one.'
    );
  });

  test('NON_OPTIONAL_MISSING — single missing', () => {
    const msg = formatInvariantMessage({
      failureCode: 'NON_OPTIONAL_MISSING',
      detail: { missing: ['Daily Standup'] }
    });
    assert.equal(
      msg,
      "Missing: [Daily Standup]. The day can't save without it. Re-add from Catalog."
    );
  });

  test('NON_OPTIONAL_MISSING — multiple missing', () => {
    const msg = formatInvariantMessage({
      failureCode: 'NON_OPTIONAL_MISSING',
      detail: { missing: ['Daily Standup', 'End-of-Activity Reflection'] }
    });
    assert.equal(
      msg,
      "Missing: [Daily Standup, End-of-Activity Reflection]. The day can't save without it. Re-add from Catalog."
    );
  });

  test('OVER_CAPACITY', () => {
    const msg = formatInvariantMessage({
      failureCode: 'OVER_CAPACITY',
      detail: { total: 510, cap: 480, overBy: 30 }
    });
    assert.equal(msg, 'Day totals 510 min, your capacity is 480. Remove 30 min.');
  });

  test('WEEKLY_PROJECT_UNDER_FLOOR', () => {
    const msg = formatInvariantMessage({
      failureCode: 'WEEKLY_PROJECT_UNDER_FLOOR',
      detail: { projectMinutes: 900, shortfallBy: 300 }
    });
    assert.equal(
      msg,
      'Week has 900 PROJECT min, needs ≥ 1200. Add 300 min of Deep to the week.'
    );
  });

  test('INFEASIBLE', () => {
    const msg = formatInvariantMessage({ failureCode: 'INFEASIBLE', detail: {} });
    assert.ok(msg.includes('infeasible'));
  });

  test('unknown failureCode falls through', () => {
    const msg = formatInvariantMessage({ failureCode: 'NEW_CODE', detail: {} });
    assert.equal(msg, 'Validation failed: NEW_CODE');
  });

  test('null input returns empty', () => {
    assert.equal(formatInvariantMessage(), '');
    assert.equal(formatInvariantMessage({}), '');
  });
});
