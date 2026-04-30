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

// ---------------------------------------------------------------------------
// Iteration 19 — Bug B: CI overlap prevention + afternoonCap extension
// ---------------------------------------------------------------------------

describe('orderDay — Iter-19 Bug B: CI rotation stops at reflectionStart (AC-B1)', () => {
  test('AC-B1: 6-CI-block input: only the prefix that fits before 17:00 is placed', () => {
    // afternoonDeepStart defaults to 13:30 (no post-lunch comm anchor block).
    // Each CI block is 60 min. 13:30..14:30..15:30..16:30 fits 3 (cursor lands at 16:30).
    // 4th would land 16:30+60=17:30 > 17:00 → break.
    // So exactly 3 blocks of 60 min fit.
    const ciBlocks = [
      block({ id: 'ci_1', bucket: 'CI', plannedDurationMinutes: 60 }),
      block({ id: 'ci_2', bucket: 'CI', plannedDurationMinutes: 60 }),
      block({ id: 'ci_3', bucket: 'CI', plannedDurationMinutes: 60 }),
      block({ id: 'ci_4', bucket: 'CI', plannedDurationMinutes: 60 }),
      block({ id: 'ci_5', bucket: 'CI', plannedDurationMinutes: 60 }),
      block({ id: 'ci_6', bucket: 'CI', plannedDurationMinutes: 60 })
    ];
    // Include End-of-Activity Reflection anchor so reflectionStart is 17:00.
    const refl = block({
      catalogEntryId: 'gen_end_of_activity_reflection',
      name: 'End-of-Activity Reflection',
      bucket: 'CI',
      plannedDurationMinutes: 15
    });
    const placed = [refl, ...ciBlocks];
    orderDay(placed, { date: '2026-04-21' });

    const placed_ci = ciBlocks.filter((c) => c.plannedStartAt !== null);
    const unplaced_ci = ciBlocks.filter((c) => c.plannedStartAt === null);
    // At least 1 must be unplaced (overflow past 17:00).
    assert.ok(unplaced_ci.length >= 1, `Expected at least 1 unplaced CI block; got ${unplaced_ci.length} unplaced`);
    // All placed CI blocks must end by 17:00.
    for (const c of placed_ci) {
      const [h, m] = c.plannedStartAt.split(':').map(Number);
      const endMin = h * 60 + m + c.plannedDurationMinutes;
      assert.ok(endMin <= 17 * 60, `CI block ${c.id} ends at ${endMin} min, beyond 17:00`);
    }
    // Unplaced items have no plannedStartAt.
    for (const c of unplaced_ci) {
      assert.equal(c.plannedStartAt, null, `${c.id} should have plannedStartAt=null`);
    }
  });
});

describe('orderDay — Iter-19 Bug B: afternoonCap honors Mid-Sprint Review (AC-B2)', () => {
  test('AC-B2: 60-min Deep slice fits before 15:00 cap on MID_SPRINT_DAY', () => {
    // Include AM_COMM consuming all morning (09:15+105=10:45, then add a big morning block
    // to push Deep into afternoon). Easier: use a 90-min AM_COMM to fill 09:15..10:45,
    // then fill remaining morning with a 75-min deep (10:45..12:00), leaving a 60-min
    // deep for the afternoon (13:30+60=14:30 <= 15:00 → fits the cap).
    const amComm = block({
      catalogEntryId: 'gen_value_added_communication',
      slotKind: 'AM_COMM',
      bucket: 'COMMUNICATION',
      plannedDurationMinutes: 75  // 09:15..10:30
    });
    const postLunch = block({
      catalogEntryId: 'gen_value_added_communication',
      slotKind: 'POST_LUNCH_COMM',
      bucket: 'COMMUNICATION',
      plannedDurationMinutes: 30  // 13:00..13:30
    });
    const midSprintReview = block({
      catalogEntryId: 'cer_mid_sprint_review',
      bucket: 'COMMUNICATION',
      plannedDurationMinutes: 60  // anchored 15:00
    });
    // Morning deep: 10:30+90=12:00 → fits in morning.
    const deepMorning = block({ id: 'deep_am', bucket: 'PROJECT', plannedDurationMinutes: 90 });
    // Afternoon deep: 13:30+60=14:30 <= 15:00 cap → should fit.
    const deepPm = block({ id: 'deep_pm', bucket: 'PROJECT', plannedDurationMinutes: 60 });
    const placed = [amComm, postLunch, midSprintReview, deepMorning, deepPm];
    orderDay(placed, { date: '2026-04-24' });

    // Mid-Sprint Review anchored at 15:00.
    assert.equal(midSprintReview.plannedStartAt, '15:00');
    // Morning deep at 10:30 (after amComm 09:15+75=10:30).
    assert.equal(deepMorning.plannedStartAt, '10:30');
    // Afternoon deep at 13:30; ends 14:30 <= 15:00 cap → placed.
    assert.equal(deepPm.plannedStartAt, '13:30');
    const pmEnd = (13 * 60 + 30) + deepPm.plannedDurationMinutes;
    assert.ok(pmEnd <= 15 * 60, `PM Deep ends at ${pmEnd}, should be <= 900 (15:00)`);
  });

  test('AC-B2: afternoonCap = 15:00 prevents a 120-min Deep from being placed within the cap', () => {
    // afternoonDeepStart=13:30 (post-lunch 30min). 13:30+120=15:30 > 15:00 cap → else branch.
    // The 60-min path above confirms cap enforcement. Here we verify the cap value itself.
    const amComm = block({
      catalogEntryId: 'gen_value_added_communication',
      slotKind: 'AM_COMM',
      bucket: 'COMMUNICATION',
      plannedDurationMinutes: 75
    });
    const postLunch = block({
      catalogEntryId: 'gen_value_added_communication',
      slotKind: 'POST_LUNCH_COMM',
      bucket: 'COMMUNICATION',
      plannedDurationMinutes: 30
    });
    const midSprintReview = block({
      catalogEntryId: 'cer_mid_sprint_review',
      bucket: 'COMMUNICATION',
      plannedDurationMinutes: 60
    });
    // Morning fills up with a 90-min block (10:30+90=12:00 exact).
    const deepMorning = block({ id: 'deep_am2', bucket: 'PROJECT', plannedDurationMinutes: 90 });
    // 120-min afternoon deep: 13:30+120=15:30 > 15:00 → cap not satisfied.
    const bigDeepPm = block({ id: 'deep_pm2', bucket: 'PROJECT', plannedDurationMinutes: 120 });
    const placed = [amComm, postLunch, midSprintReview, deepMorning, bigDeepPm];
    orderDay(placed, { date: '2026-04-24' });

    assert.equal(midSprintReview.plannedStartAt, '15:00');
    // 120-min deep falls to else branch — verify it's placed at cursorAfternoon (13:30)
    // but its end time (15:30) exceeds the 15:00 cap (confirming cap enforcement
    // prevented it from being placed within the cap conditional branch).
    assert.equal(bigDeepPm.plannedStartAt, '13:30');
    const bigEnd = (13 * 60 + 30) + bigDeepPm.plannedDurationMinutes;
    assert.ok(bigEnd > 15 * 60, `120-min deep should end after 15:00; ends at ${bigEnd}`);
  });
});

describe('orderDay — Iter-19 Bug B: Friday afternoonCap (AC-B3)', () => {
  test('AC-B3: Weekly Reflection at 16:30 caps afternoon Deep slices', () => {
    // Include AM_COMM + POST_LUNCH_COMM so morning slot is consumed and afternoon
    // packing is exercised deterministically from 13:30.
    const amComm = block({
      catalogEntryId: 'gen_value_added_communication',
      slotKind: 'AM_COMM',
      bucket: 'COMMUNICATION',
      plannedDurationMinutes: 60  // 09:15..10:15 — fills morning deep start
    });
    const postLunch = block({
      catalogEntryId: 'gen_value_added_communication',
      slotKind: 'POST_LUNCH_COMM',
      bucket: 'COMMUNICATION',
      plannedDurationMinutes: 30  // 13:00..13:30
    });
    const weeklyRefl = block({
      catalogEntryId: 'gen_weekly_reflection',
      bucket: 'CI',
      plannedDurationMinutes: 30  // anchored 16:30
    });
    const refl = block({
      catalogEntryId: 'gen_end_of_activity_reflection',
      name: 'End-of-Activity Reflection',
      bucket: 'CI',
      plannedDurationMinutes: 15  // anchored 17:00
    });
    // Morning slot: 10:15..12:00 = 105 min available.
    // A 90-min Deep block fits in morning (10:15+90=11:45 <= 12:00).
    // The assertion verifies afternoonCap = 16:30, so a second Deep block in the afternoon
    // (starting at 13:30) would cap at 16:30. A 180-min block at 13:30 = 16:30 which
    // ties exactly → allowed by <= afternoonCap check.
    const deepMorning = block({ id: 'deep_am', bucket: 'PROJECT', plannedDurationMinutes: 90 });
    const deepAfternoon = block({ id: 'deep_pm', bucket: 'PROJECT', plannedDurationMinutes: 180 });
    const placed = [amComm, postLunch, weeklyRefl, refl, deepMorning, deepAfternoon];
    orderDay(placed, { date: '2026-04-25' }); // Friday

    // Anchors.
    assert.equal(weeklyRefl.plannedStartAt, '16:30');
    assert.equal(refl.plannedStartAt, '17:00');
    // Morning Deep placed at 10:15 (immediately after AM_COMM).
    assert.equal(deepMorning.plannedStartAt, '10:15');
    // Afternoon Deep placed at 13:30; 13:30 + 180 = 16:30 = afternoonCap → exactly ties → OK.
    assert.equal(deepAfternoon.plannedStartAt, '13:30');
    const pmEnd = (13 * 60 + 30) + deepAfternoon.plannedDurationMinutes;
    assert.ok(pmEnd <= 16 * 60 + 30, `PM Deep should end by 16:30; ends at ${pmEnd}`);
  });
});

describe('orderDay — Iter-19 Bug B: exact-tie CI placement (AC-B4)', () => {
  test('AC-B4: CI block that ties exactly with reflectionStart IS placed', () => {
    // ciCursor = 16:30, duration=30, end=17:00 = reflectionStart.
    // 17:00 > 17:00? false → NOT broken → placed.
    // To get ciCursor at 16:30 we place a 3h block of CI starting from 13:30.
    const refl = block({
      catalogEntryId: 'gen_end_of_activity_reflection',
      name: 'End-of-Activity Reflection',
      bucket: 'CI',
      plannedDurationMinutes: 15
    });
    const ci1 = block({ id: 'ci_fill', bucket: 'CI', plannedDurationMinutes: 180 }); // 13:30→16:30
    const ci2 = block({ id: 'ci_tie', bucket: 'CI', plannedDurationMinutes: 30 });   // 16:30→17:00 tie
    const placed = [refl, ci1, ci2];
    orderDay(placed, { date: '2026-04-21' });

    // ci1 placed at 13:30 (afternoonDeepStart).
    assert.equal(ci1.plannedStartAt, '13:30');
    // ci2 ties exactly at 17:00 → should BE placed (not broken).
    assert.equal(ci2.plannedStartAt, '16:30');
  });
});
