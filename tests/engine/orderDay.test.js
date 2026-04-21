/**
 * Tests for /js/engine/orderDay.js (E3-T3 step 8).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { orderDay, CEREMONY_ANCHORS } from '../../js/engine/orderDay.js';

function block(overrides = {}) {
  return {
    id: overrides.id ?? 'sa',
    catalogEntryId: overrides.catalogEntryId ?? 'cat',
    name: overrides.name ?? 'X',
    bucket: overrides.bucket ?? 'PROJECT',
    plannedDurationMinutes: overrides.plannedDurationMinutes ?? 60,
    plannedStartAt: null,
    ...overrides
  };
}

describe('orderDay — ceremony anchors', () => {
  test('Daily Standup anchored 09:00', () => {
    const placed = [block({ catalogEntryId: 'cer_daily_standup', bucket: 'COMMUNICATION', plannedDurationMinutes: 15 })];
    orderDay(placed, { date: '2026-04-21' });
    assert.equal(placed[0].plannedStartAt, '09:00');
  });

  test('AM Comm slot anchored 09:15', () => {
    const placed = [
      block({
        catalogEntryId: 'gen_value_added_communication',
        slotKind: 'AM_COMM',
        bucket: 'COMMUNICATION',
        plannedDurationMinutes: 60
      })
    ];
    orderDay(placed, { date: '2026-04-21' });
    assert.equal(placed[0].plannedStartAt, '09:15');
  });

  test('Post-lunch Comm anchored 13:00', () => {
    const placed = [
      block({
        catalogEntryId: 'gen_value_added_communication',
        slotKind: 'POST_LUNCH_COMM',
        bucket: 'COMMUNICATION',
        plannedDurationMinutes: 30
      })
    ];
    orderDay(placed, { date: '2026-04-21' });
    assert.equal(placed[0].plannedStartAt, '13:00');
  });

  test('End-of-Activity Reflection anchored 17:00', () => {
    const placed = [
      block({
        catalogEntryId: 'gen_end_of_activity_reflection',
        name: 'End-of-Activity Reflection',
        bucket: 'CI',
        plannedDurationMinutes: 15
      })
    ];
    orderDay(placed, { date: '2026-04-21' });
    assert.equal(placed[0].plannedStartAt, '17:00');
  });

  test('Sprint Planning anchored 09:30', () => {
    const placed = [
      block({
        catalogEntryId: 'cer_sprint_planning',
        bucket: 'COMMUNICATION',
        plannedDurationMinutes: 120
      })
    ];
    orderDay(placed, { date: '2026-04-20' });
    assert.equal(placed[0].plannedStartAt, '09:30');
  });
});

describe('orderDay — Deep slices packed before lunch', () => {
  test('first Deep slice starts after AM Comm end (AM Comm 09:15+60 = 10:15)', () => {
    const placed = [
      block({
        catalogEntryId: 'gen_value_added_communication',
        slotKind: 'AM_COMM',
        bucket: 'COMMUNICATION',
        plannedDurationMinutes: 60
      }),
      block({ id: 'deep_1', name: 'Deep 1', bucket: 'PROJECT', plannedDurationMinutes: 90 })
    ];
    orderDay(placed, { date: '2026-04-21' });
    assert.equal(placed[1].plannedStartAt, '10:15');
  });

  test('second Deep slice rolls to afternoon when it would cross lunch', () => {
    const placed = [
      block({
        catalogEntryId: 'gen_value_added_communication',
        slotKind: 'AM_COMM',
        bucket: 'COMMUNICATION',
        plannedDurationMinutes: 60
      }),
      block({
        catalogEntryId: 'gen_value_added_communication',
        slotKind: 'POST_LUNCH_COMM',
        bucket: 'COMMUNICATION',
        plannedDurationMinutes: 30
      }),
      block({ id: 'deep_1', name: 'Deep 1', bucket: 'PROJECT', plannedDurationMinutes: 90 }),
      block({ id: 'deep_2', name: 'Deep 2', bucket: 'PROJECT', plannedDurationMinutes: 120 })
    ];
    orderDay(placed, { date: '2026-04-21' });
    assert.equal(placed[2].plannedStartAt, '10:15');
    // Second slice rolls to afternoon starting 13:30 (after post-lunch comm).
    assert.equal(placed[3].plannedStartAt, '13:30');
  });
});

describe('orderDay — CI toward end-of-day', () => {
  test('CI block placed in afternoon after Deep', () => {
    const placed = [
      block({
        catalogEntryId: 'gen_value_added_communication',
        slotKind: 'POST_LUNCH_COMM',
        bucket: 'COMMUNICATION',
        plannedDurationMinutes: 30
      }),
      block({ id: 'ci_1', bucket: 'CI', plannedDurationMinutes: 60 })
    ];
    orderDay(placed, { date: '2026-04-21' });
    assert.ok(placed[1].plannedStartAt);
    const [h, m] = placed[1].plannedStartAt.split(':').map(Number);
    const startMin = h * 60 + m;
    // Should be >= 13:30 (after post-lunch comm)
    assert.ok(startMin >= 13 * 60 + 30);
  });
});

describe('orderDay — exported anchors', () => {
  test('CEREMONY_ANCHORS are fixed', () => {
    assert.equal(CEREMONY_ANCHORS.DAILY_STANDUP, '09:00');
    assert.equal(CEREMONY_ANCHORS.AM_COMM, '09:15');
    assert.equal(CEREMONY_ANCHORS.POST_LUNCH_COMM, '13:00');
    assert.equal(CEREMONY_ANCHORS.END_OF_ACTIVITY_REFLECTION, '17:00');
    assert.equal(CEREMONY_ANCHORS.SPRINT_PLANNING, '09:30');
    assert.equal(CEREMONY_ANCHORS.SPRINT_REVIEW, '14:00');
    assert.equal(CEREMONY_ANCHORS.MID_SPRINT_REVIEW, '15:00');
    assert.equal(CEREMONY_ANCHORS.WEEKLY_REFLECTION, '16:30');
  });
});

describe('orderDay — non-array input is no-op', () => {
  test('non-array input returns as-is', () => {
    assert.equal(orderDay(null, {}), null);
  });
});
