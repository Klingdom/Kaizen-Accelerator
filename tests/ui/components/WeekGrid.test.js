/**
 * Tests for /js/ui/components/WeekGrid.js (Sprint 15 W1).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { WeekGrid } from '../../../js/ui/components/WeekGrid.js';

function stubDay({ date = '2026-04-20', dayIdx = 0, activities, state = 'PROPOSED' } = {}) {
  const acts = activities ?? [
    {
      id: `sa_p_${date}`,
      catalogEntryId: 'cat_20',
      name: 'DMAIC Charter',
      bucket: 'PROJECT',
      plannedDurationMinutes: 120,
      plannedStartAt: '09:00',
      state: 'PROPOSED'
    },
    {
      id: `sa_c_${date}`,
      catalogEntryId: 'cer_daily_standup',
      name: 'Daily Standup',
      bucket: 'COMMUNICATION',
      plannedDurationMinutes: 15,
      plannedStartAt: '09:00',
      state: 'PROPOSED'
    },
    {
      id: `sa_ci_${date}`,
      catalogEntryId: 'gen_end_of_activity_reflection',
      name: 'End-of-Activity Reflection',
      bucket: 'CI',
      plannedDurationMinutes: 15,
      plannedStartAt: '17:00',
      state: 'PROPOSED'
    }
  ];
  return { id: `wcomp_user_${date}`, date, dayIdx, state, activities: acts };
}

function stubWeekly(overrides = {}) {
  return {
    id: 'wcomp_user_2026-04-20',
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
    ],
    ...overrides
  };
}

describe('WeekGrid — null/empty inputs', () => {
  test('returns empty string when no weeklyComposition', () => {
    assert.equal(WeekGrid({}), '');
    assert.equal(WeekGrid({ weeklyComposition: null }), '');
    assert.equal(WeekGrid(), '');
  });
});

describe('WeekGrid — top-level structure', () => {
  test('renders the .wg-grid wrapper with style vars', () => {
    const html = WeekGrid({ weeklyComposition: stubWeekly() });
    assert.match(html, /class="wg-grid"/);
    assert.match(html, /--wg-start-hour: 7/);
    assert.match(html, /--wg-end-hour: 19/);
    assert.match(html, /--wg-row-height: 60px/);
  });

  test('exposes data-weekly-id on the grid wrapper', () => {
    const html = WeekGrid({ weeklyComposition: stubWeekly() });
    assert.match(html, /data-weekly-id="wcomp_user_2026-04-20"/);
  });

  test('renders the hour rail with 13 hour labels (07..19)', () => {
    const html = WeekGrid({ weeklyComposition: stubWeekly() });
    assert.match(html, /class="wg-hour-rail"/);
    assert.match(html, />07:00</);
    assert.match(html, />12:00</);
    assert.match(html, />19:00</);
    const matches = html.match(/class="wg-hour"/g);
    assert.equal(matches?.length, 13);
  });

  test('renders 5 day columns', () => {
    const html = WeekGrid({ weeklyComposition: stubWeekly() });
    for (let i = 0; i < 5; i += 1) {
      assert.match(html, new RegExp(`data-day-index="${i}"`));
    }
  });

  test('respects custom gridStartHour / gridEndHour / rowHeightPx', () => {
    const html = WeekGrid({
      weeklyComposition: stubWeekly(),
      gridStartHour: 8,
      gridEndHour: 18,
      rowHeightPx: 30
    });
    assert.match(html, /--wg-start-hour: 8/);
    assert.match(html, /--wg-end-hour: 18/);
    assert.match(html, /--wg-row-height: 30px/);
    // Hour rail should now span 08..18 (11 hours).
    const matches = html.match(/class="wg-hour"/g);
    assert.equal(matches?.length, 11);
    assert.match(html, />08:00</);
    assert.match(html, />18:00</);
    assert.doesNotMatch(html, />07:00</);
    assert.doesNotMatch(html, />19:00</);
  });
});

describe('WeekGrid — day columns', () => {
  test('day column header includes weekday + date', () => {
    const html = WeekGrid({ weeklyComposition: stubWeekly() });
    assert.match(html, />Mon</);
    assert.match(html, />Tue</);
    assert.match(html, />Wed</);
    assert.match(html, />Thu</);
    assert.match(html, />Fri</);
    assert.match(html, />2026-04-20</);
    assert.match(html, />2026-04-24</);
  });

  test('PROPOSED day does NOT render its own Accept button (legacy DayPreview owns that affordance)', () => {
    const html = WeekGrid({ weeklyComposition: stubWeekly() });
    assert.doesNotMatch(html, /data-action="WEEK_ACCEPT_DAY"/);
  });

  test('ACCEPTED day shows state label in the column header', () => {
    const w = stubWeekly();
    w.days[0] = stubDay({ date: '2026-04-20', dayIdx: 0, state: 'ACCEPTED' });
    const html = WeekGrid({ weeklyComposition: w });
    assert.match(html, /class="wg-day-state">ACCEPTED</);
  });

  test('PROPOSED day omits the wg-day-state label', () => {
    const html = WeekGrid({ weeklyComposition: stubWeekly() });
    assert.doesNotMatch(html, /class="wg-day-state"/);
  });

  test('day with null members renders empty wg-day-col-empty', () => {
    const w = stubWeekly();
    w.days[2] = null;
    const html = WeekGrid({ weeklyComposition: w });
    assert.match(html, /wg-day-col-empty/);
  });

  test('timeline height is (gridEndHour - gridStartHour) * rowHeightPx', () => {
    const html = WeekGrid({ weeklyComposition: stubWeekly() });
    assert.match(html, /class="wg-timeline" style="height: 720px"/);
  });

  test('respects custom row height for timeline height', () => {
    const html = WeekGrid({
      weeklyComposition: stubWeekly(),
      rowHeightPx: 30
    });
    // 12 rows * 30 = 360px
    assert.match(html, /class="wg-timeline" style="height: 360px"/);
  });
});

describe('WeekGrid — block positioning', () => {
  test('renders blocks with absolute top/height inline styles', () => {
    const html = WeekGrid({ weeklyComposition: stubWeekly() });
    assert.match(html, /class="wg-block[^"]*" style="top: \d+px; height: \d+px"/);
  });

  test('09:00 / 120-min PROJECT lands at top: 120px height: 120px', () => {
    const html = WeekGrid({ weeklyComposition: stubWeekly() });
    assert.match(html, /style="top: 120px; height: 120px"[^>]*data-bucket="PROJECT"/);
  });

  test('17:00 / 15-min CI lands at top: 600px height: 15px', () => {
    const html = WeekGrid({ weeklyComposition: stubWeekly() });
    assert.match(html, /style="top: 600px; height: 15px"[^>]*data-bucket="CI"/);
  });

  test('block carries data-bucket + bucket chip class', () => {
    const html = WeekGrid({ weeklyComposition: stubWeekly() });
    assert.match(html, /class="wg-block chip-project"[^>]*data-bucket="PROJECT"/);
    assert.match(html, /class="wg-block chip-communication"[^>]*data-bucket="COMMUNICATION"/);
    assert.match(html, /class="wg-block chip-ci"[^>]*data-bucket="CI"/);
  });

  test('block carries data-activity-id', () => {
    const html = WeekGrid({ weeklyComposition: stubWeekly() });
    assert.match(html, /data-activity-id="sa_p_2026-04-20"/);
  });

  test('block name + duration + time render', () => {
    const html = WeekGrid({ weeklyComposition: stubWeekly() });
    assert.match(html, />DMAIC Charter</);
    assert.match(html, />120m</);
    assert.match(html, />09:00</);
  });

  test('Sprint 16a: tall blocks render the HH:MM–HH:MM range', () => {
    const html = WeekGrid({ weeklyComposition: stubWeekly() });
    // PROJECT 09:00/120m is height 120 ≥ 40, so the range form is shown.
    assert.match(html, />09:00\u201311:00</);
  });

  test('Sprint 16a: short blocks (<40px) fall back to start-only', () => {
    const day = stubDay({
      date: '2026-04-20',
      dayIdx: 0,
      activities: [
        {
          id: 'short_block',
          name: 'Short',
          bucket: 'CI',
          plannedDurationMinutes: 15,
          plannedStartAt: '09:00',
          state: 'PROPOSED'
        }
      ]
    });
    const w = stubWeekly();
    w.days[0] = day;
    const html = WeekGrid({ weeklyComposition: w });
    // 15px height < 40 → render only the start, no en-dash.
    const blockMatch = html.match(/<article class="wg-block[^"]*"[^>]*data-activity-id="short_block"[^>]*>[\s\S]*?<\/article>/);
    assert.ok(blockMatch, 'short block not found');
    assert.match(blockMatch[0], /class="wg-block-time">09:00</);
    assert.doesNotMatch(blockMatch[0], /\u2013/);
  });

  test('Sprint 16a: 40px-threshold block renders the range', () => {
    const day = stubDay({
      date: '2026-04-20',
      dayIdx: 0,
      activities: [
        {
          id: 'forty_block',
          name: 'Forty',
          bucket: 'PROJECT',
          plannedDurationMinutes: 40,
          plannedStartAt: '10:00',
          state: 'PROPOSED'
        }
      ]
    });
    const w = stubWeekly();
    w.days[0] = day;
    const html = WeekGrid({ weeklyComposition: w });
    // 40m at default rowHeightPx 60 ⇒ 40px height ⇒ at threshold ⇒ range.
    assert.match(html, /class="wg-block-time">10:00\u201310:40</);
  });

  test('skips blocks without a parseable plannedStartAt', () => {
    const day = stubDay({
      date: '2026-04-20',
      dayIdx: 0,
      activities: [
        {
          id: 'no_start',
          name: 'No start',
          bucket: 'PROJECT',
          plannedDurationMinutes: 60,
          plannedStartAt: null,
          state: 'PROPOSED'
        }
      ]
    });
    const w = stubWeekly();
    w.days[0] = day;
    const html = WeekGrid({ weeklyComposition: w });
    assert.doesNotMatch(html, /data-activity-id="no_start"/);
  });

  test('skips blocks with zero or negative duration', () => {
    const day = stubDay({
      date: '2026-04-20',
      dayIdx: 0,
      activities: [
        {
          id: 'zero_dur',
          name: 'Zero',
          bucket: 'PROJECT',
          plannedDurationMinutes: 0,
          plannedStartAt: '09:00',
          state: 'PROPOSED'
        }
      ]
    });
    const w = stubWeekly();
    w.days[0] = day;
    const html = WeekGrid({ weeklyComposition: w });
    assert.doesNotMatch(html, /data-activity-id="zero_dur"/);
  });
});

describe('WeekGrid — userEdited tone signal', () => {
  test('default activities render data-user-edited="false"', () => {
    const html = WeekGrid({ weeklyComposition: stubWeekly() });
    assert.match(html, /data-user-edited="false"/);
  });

  test('activity with userEdited=true renders data-user-edited="true"', () => {
    const day = stubDay({
      date: '2026-04-20',
      dayIdx: 0,
      activities: [
        {
          id: 'edited_one',
          name: 'User-edited',
          bucket: 'PROJECT',
          plannedDurationMinutes: 60,
          plannedStartAt: '09:00',
          state: 'PROPOSED',
          userEdited: true
        }
      ]
    });
    const w = stubWeekly();
    w.days[0] = day;
    const html = WeekGrid({ weeklyComposition: w });
    assert.match(html, /data-user-edited="true"/);
  });

  test('userEdited=false explicitly still renders "false"', () => {
    const day = stubDay({
      date: '2026-04-20',
      dayIdx: 0,
      activities: [
        {
          id: 'composer_one',
          name: 'Composer-built',
          bucket: 'PROJECT',
          plannedDurationMinutes: 60,
          plannedStartAt: '09:00',
          state: 'PROPOSED',
          userEdited: false
        }
      ]
    });
    const w = stubWeekly();
    w.days[0] = day;
    const html = WeekGrid({ weeklyComposition: w });
    assert.match(html, /data-user-edited="false"/);
  });
});

describe('WeekGrid — Kaizen chip', () => {
  test('renders kaizen title chip when linkedKaizenId + lookup hit', () => {
    const day = stubDay({
      date: '2026-04-20',
      dayIdx: 0,
      activities: [
        {
          id: 'k_act',
          name: 'Define Charter',
          bucket: 'PROJECT',
          plannedDurationMinutes: 60,
          plannedStartAt: '09:00',
          state: 'PROPOSED',
          linkedKaizenId: 'k_demo'
        }
      ]
    });
    const w = stubWeekly();
    w.days[0] = day;
    const html = WeekGrid({
      weeklyComposition: w,
      kaizenTitleById: { k_demo: 'Demo Kaizen' }
    });
    assert.match(html, /class="wg-block-kaizen"/);
    assert.match(html, />Demo Kaizen</);
  });

  test('omits chip when no kaizen lookup is provided', () => {
    const day = stubDay({
      date: '2026-04-20',
      dayIdx: 0,
      activities: [
        {
          id: 'k_act',
          name: 'Define Charter',
          bucket: 'PROJECT',
          plannedDurationMinutes: 60,
          plannedStartAt: '09:00',
          state: 'PROPOSED',
          linkedKaizenId: 'k_demo'
        }
      ]
    });
    const w = stubWeekly();
    w.days[0] = day;
    const html = WeekGrid({ weeklyComposition: w });
    assert.doesNotMatch(html, /wg-block-kaizen/);
  });
});

describe('WeekGrid — now-line', () => {
  test('renders .wg-now-line on the matching date column when nowIso is in window', () => {
    const html = WeekGrid({
      weeklyComposition: stubWeekly(),
      nowIso: '2026-04-22T10:00:00Z'
    });
    assert.match(html, /class="wg-now-line" style="top: 180px"/);
  });

  test('does NOT render now-line on non-matching dates', () => {
    const html = WeekGrid({
      weeklyComposition: stubWeekly(),
      nowIso: '2026-04-22T10:00:00Z'
    });
    // Only one now-line in the entire grid.
    const matches = html.match(/wg-now-line/g);
    assert.equal(matches?.length, 1);
  });

  test('does NOT render now-line at all when nowIso is outside the week', () => {
    const html = WeekGrid({
      weeklyComposition: stubWeekly(),
      nowIso: '2026-04-30T10:00:00Z'
    });
    assert.doesNotMatch(html, /wg-now-line/);
  });

  test('does NOT render now-line when nowIso is before grid start hour', () => {
    const html = WeekGrid({
      weeklyComposition: stubWeekly(),
      nowIso: '2026-04-22T05:00:00Z'
    });
    assert.doesNotMatch(html, /wg-now-line/);
  });

  test('does NOT render now-line when nowIso is after grid end hour', () => {
    const html = WeekGrid({
      weeklyComposition: stubWeekly(),
      nowIso: '2026-04-22T20:00:00Z'
    });
    assert.doesNotMatch(html, /wg-now-line/);
  });

  test('does NOT render now-line when nowIso is not provided', () => {
    const html = WeekGrid({ weeklyComposition: stubWeekly() });
    assert.doesNotMatch(html, /wg-now-line/);
  });
});

describe('WeekGrid — escapes attacker input', () => {
  test('activity name is HTML-escaped', () => {
    const day = stubDay({
      date: '2026-04-20',
      dayIdx: 0,
      activities: [
        {
          id: 'evil',
          name: '<script>alert(1)</script>',
          bucket: 'PROJECT',
          plannedDurationMinutes: 60,
          plannedStartAt: '09:00',
          state: 'PROPOSED'
        }
      ]
    });
    const w = stubWeekly();
    w.days[0] = day;
    const html = WeekGrid({ weeklyComposition: w });
    assert.doesNotMatch(html, /<script>alert\(1\)<\/script>/);
    assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  });
});
