/**
 * Tests for /js/engine/relaxConfigurable.js (E3-T3 step 9 retry).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  relaxConfigurable,
  relaxOnce
} from '../../js/engine/relaxConfigurable.js';

function block(overrides = {}) {
  return {
    id: overrides.id ?? 'sa',
    catalogEntryId: overrides.catalogEntryId ?? 'cat',
    name: overrides.name ?? 'X',
    bucket: overrides.bucket ?? 'CI',
    plannedDurationMinutes: overrides.plannedDurationMinutes ?? 30,
    ...overrides
  };
}

describe('relaxOnce — priority chain', () => {
  test('drops CI with priority ≤20 first (tail)', () => {
    const placed = [
      block({ id: 'wr', bucket: 'CI', ciPriority: 20, name: 'Weekly Reflection' }),
      block({ id: 'ld', bucket: 'CI', ciPriority: 60, name: 'L&D' }),
      block({ id: 'pdca', bucket: 'CI', ciPriority: 80, name: 'PDCA' })
    ];
    const step = relaxOnce(placed, 'CI_OVERPACKED');
    assert.ok(step);
    assert.equal(step.dropped.id, 'wr');
  });

  test('drops CI 40-60 rank AFTER 20-rank CI', () => {
    const placed = [
      block({ id: 'ld', bucket: 'CI', ciPriority: 60, name: 'L&D' }),
      block({ id: 'cont', bucket: 'CI', ciPriority: 40, name: 'Continuous' })
    ];
    const step = relaxOnce(placed, 'CI_OVERPACKED');
    // Both are rank-2, first-in (ld) should drop per idx tiebreak.
    assert.ok(step);
    assert.equal(step.dropped.id, 'ld');
  });

  test('drops generic COMM filler before 1:1', () => {
    const placed = [
      block({
        id: 'generic',
        bucket: 'COMMUNICATION',
        catalogEntryId: 'gen_value_added_communication',
        name: 'Value-Added Communication (generic)'
      }),
      block({
        id: 'oneonone',
        bucket: 'COMMUNICATION',
        catalogEntryId: 'cat_16_connecting_w_teammates',
        name: 'Connecting w/ teammates'
      })
    ];
    const step = relaxOnce(placed, 'COMM_OVERPACKED');
    assert.ok(step);
    assert.equal(step.dropped.id, 'generic');
  });

  test('drops non-strategic Deep LAST (before strategic veto)', () => {
    const placed = [
      block({ id: 'deep', bucket: 'PROJECT', strategic: false, name: 'DMAIC #34' })
    ];
    const step = relaxOnce(placed, 'PROJECT_OVERPACKED');
    assert.ok(step);
    assert.equal(step.dropped.id, 'deep');
  });
});

describe('relaxOnce — protected blocks never drop', () => {
  test('Daily Standup is protected', () => {
    const placed = [
      block({
        id: 'standup',
        bucket: 'COMMUNICATION',
        catalogEntryId: 'cer_daily_standup',
        name: 'Daily Standup'
      })
    ];
    assert.equal(relaxOnce(placed, 'COMM_OVERPACKED'), null);
  });

  test('AM Comm slot protected', () => {
    const placed = [
      block({ id: 'am', bucket: 'COMMUNICATION', slotKind: 'AM_COMM', name: 'AM Comm' })
    ];
    assert.equal(relaxOnce(placed, 'COMM_OVERPACKED'), null);
  });

  test('Post-lunch Comm slot protected', () => {
    const placed = [
      block({ id: 'post', bucket: 'COMMUNICATION', slotKind: 'POST_LUNCH_COMM', name: 'Post Comm' })
    ];
    assert.equal(relaxOnce(placed, 'COMM_OVERPACKED'), null);
  });

  test('End-of-Activity Reflection protected', () => {
    const placed = [
      block({
        id: 'refl',
        bucket: 'CI',
        catalogEntryId: 'gen_end_of_activity_reflection',
        name: 'End-of-Activity Reflection'
      })
    ];
    assert.equal(relaxOnce(placed, 'CI_OVERPACKED'), null);
  });

  test('Strategic-flagged Deep protected', () => {
    const placed = [
      block({
        id: 'strategic_deep',
        bucket: 'PROJECT',
        strategic: true,
        name: 'Strategic DMAIC'
      })
    ];
    assert.equal(relaxOnce(placed, 'PROJECT_OVERPACKED'), null);
  });

  test('R2 carried-over rescue protected', () => {
    const placed = [
      block({
        id: 'carry',
        bucket: 'CI',
        carriedOver: true,
        name: 'Rescued Yesterday'
      })
    ];
    assert.equal(relaxOnce(placed, 'CI_OVERPACKED'), null);
  });
});

describe('relaxConfigurable — iteration until feasible or exhausted', () => {
  test('iteratively drops blocks until validateFn returns ok', () => {
    const placed = [
      block({ id: 'a', bucket: 'CI', ciPriority: 20 }),
      block({ id: 'b', bucket: 'CI', ciPriority: 40 }),
      block({ id: 'c', bucket: 'CI', ciPriority: 60 })
    ];
    let calls = 0;
    const fakeValidator = (acts) => {
      calls += 1;
      if (acts.length <= 1) return { ok: true, failureCode: null, detail: {} };
      return { ok: false, failureCode: 'CI_OVERPACKED', detail: {} };
    };
    const result = relaxConfigurable(placed, fakeValidator);
    assert.equal(result.placed.length, 1);
    assert.equal(result.dropped.length, 2);
    assert.equal(result.result.ok, true);
  });

  test('returns the unreachable failure when relaxation exhausts', () => {
    const placed = [
      block({
        id: 'standup',
        bucket: 'COMMUNICATION',
        catalogEntryId: 'cer_daily_standup'
      }) // protected
    ];
    const failingValidator = () => ({ ok: false, failureCode: 'COMM_OVERPACKED', detail: {} });
    const result = relaxConfigurable(placed, failingValidator);
    assert.equal(result.placed.length, 1); // nothing dropped
    assert.equal(result.dropped.length, 0);
    assert.equal(result.result.ok, false);
  });
});
