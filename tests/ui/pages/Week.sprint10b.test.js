/**
 * Sprint 10b Pass C — Week page simplification tests.
 *
 * Verifies the cleaned header + per-day total minutes while preserving
 * the Sprint 9 behaviour (5 days + bucket chips + accept buttons).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { Week, DayPreview, WEEK_COPY } from '../../../js/ui/pages/Week.js';

function stubWeekly() {
  return {
    id: 'wcomp_demo_2026-04-20',
    userId: 'user_test',
    weekStart: '2026-04-20',
    weekEnd: '2026-04-24',
    state: 'PROPOSED',
    days: [
      stubDay({ date: '2026-04-20', dayIdx: 0 }),
      stubDay({ date: '2026-04-21', dayIdx: 1 }),
      stubDay({ date: '2026-04-22', dayIdx: 2 }),
      stubDay({ date: '2026-04-23', dayIdx: 3 }),
      stubDay({ date: '2026-04-24', dayIdx: 4 })
    ]
  };
}

function stubDay({ date = '2026-04-20', dayIdx = 0 } = {}) {
  const acts = [
    {
      id: `sa_p_${date}`,
      name: 'P1',
      catalogEntryId: 'cat_p1',
      bucket: 'PROJECT',
      plannedDurationMinutes: 120,
      state: 'PROPOSED'
    },
    {
      id: `sa_c_${date}`,
      name: 'C1',
      catalogEntryId: 'cat_c1',
      bucket: 'COMMUNICATION',
      plannedDurationMinutes: 30,
      state: 'PROPOSED'
    },
    {
      id: `sa_ci_${date}`,
      name: 'I1',
      catalogEntryId: 'cat_i1',
      bucket: 'CI',
      plannedDurationMinutes: 45,
      state: 'PROPOSED'
    }
  ];
  const pb = { PROJECT: 120, COMMUNICATION: 30, CI: 45 };
  return {
    id: `wcomp_demo_${date}`,
    userId: 'user_test',
    date,
    dayIdx,
    state: 'PROPOSED',
    activities: acts,
    plannedByBucket: pb
  };
}

describe('Week — Sprint 10b header cleanup', () => {
  test('populated-state header shows the primary "Plan this week" action', () => {
    const html = Week({ weeklyComposition: stubWeekly() });
    assert.match(html, new RegExp(`class="wk-propose wk-propose-primary"[^>]*data-action="WEEK_PROPOSE"`));
    assert.match(html, new RegExp(`>${WEEK_COPY.PROPOSE}<`));
  });

  test('empty-state still renders "Plan this week" CTA', () => {
    const html = Week({});
    assert.match(html, /data-action="WEEK_PROPOSE"/);
    assert.match(html, /Plan this week/);
  });

  test('title + week range both rendered on populated state', () => {
    const html = Week({ weeklyComposition: stubWeekly() });
    assert.match(html, /Week Plan/);
    assert.match(html, /Mon Apr 20 – Fri Apr 24/);
  });
});

describe('Week — Sprint 10b per-day total minutes', () => {
  test('each day renders a total-minutes field', () => {
    const html = Week({ weeklyComposition: stubWeekly() });
    const matches = html.match(/class="wk-day-total"/g) ?? [];
    assert.equal(matches.length, 5);
  });

  test('total matches sum of bucket minutes', () => {
    const html = DayPreview({
      day: stubDay({ date: '2026-04-20' }),
      dayIdx: 0,
      weeklyCompositionId: 'w'
    });
    // 120 + 30 + 45 = 195
    assert.match(html, /aria-label="total minutes">195m</);
  });

  test('total-minutes has aria-label for accessibility', () => {
    const html = Week({ weeklyComposition: stubWeekly() });
    assert.match(html, /aria-label="total minutes"/);
  });
});

describe('Week — Sprint 10b preserves Sprint 9 behaviour', () => {
  test('5 day columns still present', () => {
    const html = Week({ weeklyComposition: stubWeekly() });
    for (let i = 0; i < 5; i += 1) {
      assert.match(html, new RegExp(`data-day-idx="${i}"`));
    }
  });

  test('bucket chips still rendered', () => {
    const html = Week({ weeklyComposition: stubWeekly() });
    assert.match(html, /chip-project/);
    assert.match(html, /chip-communication/);
    assert.match(html, /chip-ci/);
  });

  test('accept-day + accept-all still rendered for PROPOSED', () => {
    const html = Week({ weeklyComposition: stubWeekly() });
    const perDay = html.match(/data-action="WEEK_ACCEPT_DAY"/g) ?? [];
    assert.equal(perDay.length, 5);
    assert.match(html, /data-action="WEEK_ACCEPT_ALL"/);
  });
});
