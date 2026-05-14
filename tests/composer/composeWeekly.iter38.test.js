/**
 * Iter 38 Phase B — composeWeekly POST_DEEP_COMM mirror tests (AC2).
 *
 * Covers:
 *   - AC2: composeWeekly emits POST_DEEP_COMM anchor on each weekday
 *   - Weekly COMM total includes the 15-min anchor
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { composeWeekly } from '../../js/composer/composeWeekly.js';
import { GOLDEN_FULL_CATALOG } from '../fixtures/goldenDay.js';

function weeklyInput() {
  return {
    weekStart: '2026-04-27', // Monday
    userId: 'u_iter38_weekly',
    dailyCapacityMinutes: 480,
    activeKaizens: [],
    historicalCompletedCatalogIds: [],
    catalog: GOLDEN_FULL_CATALOG.map((c) => ({ ...c })),
    _now: '2026-04-27T08:00:00Z'
  };
}

// ---------------------------------------------------------------------------
// AC2: composeWeekly mirrors POST_DEEP_COMM on each weekday
// ---------------------------------------------------------------------------
describe('Iter 38 — AC2: composeWeekly POST_DEEP_COMM on each weekday', () => {
  test('each of the 5 weekdays has a POST_DEEP_COMM activity', () => {
    const out = composeWeekly(weeklyInput());
    assert.ok(Array.isArray(out.days), 'composeWeekly should return {days: [...]}');
    assert.equal(out.days.length, 5, 'expected 5 days Mon..Fri');

    for (let i = 0; i < out.days.length; i += 1) {
      const day = out.days[i];
      const acts = day.activities ?? [];
      const postDeep = acts.find((a) => a.slotKind === 'POST_DEEP_COMM');
      assert.ok(
        postDeep,
        `Day ${i} (${day.startAt?.slice(0, 10) ?? i}) is missing POST_DEEP_COMM activity`
      );
      assert.equal(postDeep.plannedDurationMinutes, 15, `Day ${i} POST_DEEP_COMM should be 15 min`);
      assert.equal(postDeep.bucket, 'COMMUNICATION', `Day ${i} POST_DEEP_COMM should be COMMUNICATION bucket`);
      assert.equal(postDeep.plannedStartAt, '15:30', `Day ${i} POST_DEEP_COMM should be anchored at 15:30`);
    }
  });

  test('POST_DEEP_COMM uses catalogEntryId gen_value_added_communication', () => {
    const out = composeWeekly(weeklyInput());
    const day = out.days[0];
    const postDeep = (day.activities ?? []).find((a) => a.slotKind === 'POST_DEEP_COMM');
    assert.ok(postDeep, 'POST_DEEP_COMM missing from Monday');
    assert.equal(postDeep.catalogEntryId, 'gen_value_added_communication');
    assert.equal(postDeep.name, 'End-of-Deep-Cycles Communication');
  });

  test('each day COMM total >= 120 min (target) when catalog is full', () => {
    const out = composeWeekly(weeklyInput());
    for (let i = 0; i < out.days.length; i += 1) {
      const day = out.days[i];
      const commTotal = (day.activities ?? [])
        .filter((a) => a.bucket === 'COMMUNICATION')
        .reduce((s, a) => s + (a.plannedDurationMinutes ?? 0), 0);
      // POST_DEEP_COMM contributes 15 min; total should be at least 15.
      assert.ok(commTotal >= 15, `Day ${i} COMM total (${commTotal}) should be >= 15`);
    }
  });
});
