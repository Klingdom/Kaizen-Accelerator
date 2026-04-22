/**
 * Tests for /js/ui/pages/Week.js (Sprint 9 Pass 9c).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  Week,
  DayPreview,
  formatWeekRange,
  WEEK_COPY
} from '../../../js/ui/pages/Week.js';

function stubWeeklyComposition(overrides = {}) {
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

function stubDay({ date = '2026-04-20', dayIdx = 0, activities, state = 'PROPOSED' } = {}) {
  const acts =
    activities ??
    [
      {
        id: `sa_p_${date}_1`,
        catalogEntryId: 'cat_20',
        name: 'DMAIC Charter',
        bucket: 'PROJECT',
        plannedDurationMinutes: 120,
        state: 'PROPOSED',
        linkedKaizenId: 'k_demo'
      },
      {
        id: `sa_c_${date}_1`,
        catalogEntryId: 'cer_daily_standup',
        name: 'Daily Standup',
        bucket: 'COMMUNICATION',
        plannedDurationMinutes: 15,
        state: 'PROPOSED'
      },
      {
        id: `sa_ci_${date}_1`,
        catalogEntryId: 'gen_end_of_activity_reflection',
        name: 'End-of-Activity Reflection',
        bucket: 'CI',
        plannedDurationMinutes: 15,
        state: 'PROPOSED'
      }
    ];
  const pb = { PROJECT: 0, COMMUNICATION: 0, CI: 0 };
  for (const a of acts) pb[a.bucket] = (pb[a.bucket] ?? 0) + a.plannedDurationMinutes;
  return {
    id: `wcomp_user_${date}`,
    userId: 'user_test',
    cycleType: 'DAILY',
    startAt: `${date}T00:00:00Z`,
    endAt: `${date}T23:59:59Z`,
    state,
    date,
    dayIdx,
    activities: acts,
    plannedByBucket: pb
  };
}

// ---------------------------------------------------------------------------
// formatWeekRange
// ---------------------------------------------------------------------------

describe('formatWeekRange', () => {
  test('formats valid ISO dates into "Mon Apr 20 – Fri Apr 24"', () => {
    assert.equal(
      formatWeekRange('2026-04-20', '2026-04-24'),
      'Mon Apr 20 – Fri Apr 24'
    );
  });

  test('falls back to raw dates on malformed input', () => {
    const out = formatWeekRange('bogus', 'also-bad');
    assert.match(out, /bogus/);
  });

  test('returns empty string for null inputs', () => {
    assert.equal(formatWeekRange(null, null), '');
    assert.equal(formatWeekRange(undefined, undefined), '');
  });

  test('handles January → single-digit months correctly', () => {
    assert.match(
      formatWeekRange('2026-01-05', '2026-01-09'),
      /Mon Jan 05 – Fri Jan 09/
    );
  });
});

// ---------------------------------------------------------------------------
// Week — empty state
// ---------------------------------------------------------------------------

describe('Week — empty state', () => {
  test('renders the propose button when no weeklyComposition', () => {
    const html = Week({});
    assert.match(html, /data-action="WEEK_PROPOSE"/);
    assert.match(html, /Plan this week/);
  });

  test('renders the empty-state copy', () => {
    const html = Week({});
    assert.match(html, /No week plan yet/);
  });

  test('does NOT render a 5-col grid in empty state', () => {
    const html = Week({});
    assert.doesNotMatch(html, /class="wk-grid"/);
  });

  test('weekStart in props passes through to propose payload', () => {
    const html = Week({ weekStart: '2026-04-20' });
    assert.match(html, /&quot;weekStart&quot;:&quot;2026-04-20&quot;/);
  });

  test('main has data-route="week"', () => {
    const html = Week({});
    assert.match(html, /data-route="week"/);
  });
});

// ---------------------------------------------------------------------------
// Week — populated state
// ---------------------------------------------------------------------------

describe('Week — populated state', () => {
  test('renders title + range header', () => {
    const html = Week({ weeklyComposition: stubWeeklyComposition() });
    assert.match(html, /Week Plan/);
    assert.match(html, /Mon Apr 20 – Fri Apr 24/);
  });

  test('renders 5 day columns (Mon..Fri)', () => {
    const html = Week({ weeklyComposition: stubWeeklyComposition() });
    // Each day column has data-day-idx.
    for (let i = 0; i < 5; i += 1) {
      assert.match(html, new RegExp(`data-day-idx="${i}"`));
    }
  });

  test('each day has weekday short label', () => {
    const html = Week({ weeklyComposition: stubWeeklyComposition() });
    for (const label of ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']) {
      assert.match(html, new RegExp(`>${label}</`));
    }
  });

  test('each day has an Accept button with WEEK_ACCEPT_DAY action', () => {
    const html = Week({ weeklyComposition: stubWeeklyComposition() });
    const matches = html.match(/data-action="WEEK_ACCEPT_DAY"/g);
    assert.equal(matches?.length, 5);
  });

  test('accept-all button present in footer', () => {
    const html = Week({ weeklyComposition: stubWeeklyComposition() });
    assert.match(html, /data-action="WEEK_ACCEPT_ALL"/);
    assert.match(html, /Accept all 5 days/);
  });

  test('accept-day payload includes weeklyCompositionId + dayIndex', () => {
    const html = Week({ weeklyComposition: stubWeeklyComposition() });
    // Payloads are HTML-escaped (esc() encodes ").
    assert.match(html, /&quot;weeklyCompositionId&quot;:&quot;wcomp_user_2026-04-20&quot;/);
    assert.match(html, /&quot;dayIndex&quot;:0/);
    assert.match(html, /&quot;dayIndex&quot;:4/);
  });

  test('main has data-weekly-id + data-state attributes', () => {
    const html = Week({ weeklyComposition: stubWeeklyComposition() });
    assert.match(html, /data-weekly-id="wcomp_user_2026-04-20"/);
    assert.match(html, /data-state="PROPOSED"/);
  });

  test('ACCEPTED state hides the per-day + accept-all buttons', () => {
    const weekly = stubWeeklyComposition({ state: 'ACCEPTED' });
    const html = Week({ weeklyComposition: weekly });
    assert.doesNotMatch(html, /data-action="WEEK_ACCEPT_ALL"/);
  });

  test('per-day ACCEPTED state shows state label instead of Accept button', () => {
    const weekly = stubWeeklyComposition();
    weekly.days[0] = stubDay({ date: '2026-04-20', dayIdx: 0, state: 'ACCEPTED' });
    const html = Week({ weeklyComposition: weekly });
    // Count of WEEK_ACCEPT_DAY actions should be 4 (not 5).
    const matches = html.match(/data-action="WEEK_ACCEPT_DAY"/g);
    assert.equal(matches?.length, 4);
  });

  test('renders activities with bucket chips', () => {
    const html = Week({ weeklyComposition: stubWeeklyComposition() });
    assert.match(html, /chip-project/);
    assert.match(html, /chip-communication/);
    assert.match(html, /chip-ci/);
  });

  test('renders kaizen chip on Kaizen-linked activities', () => {
    const html = Week({ weeklyComposition: stubWeeklyComposition() });
    assert.match(html, /wk-kaizen-chip/);
  });

  test('renders per-bucket planned minutes', () => {
    const html = Week({ weeklyComposition: stubWeeklyComposition() });
    assert.match(html, />Project</);
    assert.match(html, />Comm</);
    assert.match(html, />CI</);
    // Minute values (from stubDay): PROJECT=120, COMM=15, CI=15.
    assert.match(html, />120m</);
  });
});

// ---------------------------------------------------------------------------
// DayPreview edge cases
// ---------------------------------------------------------------------------

describe('DayPreview', () => {
  test('renders empty state when day is null', () => {
    const html = DayPreview({ day: null, dayIdx: 0 });
    assert.match(html, /wk-day-empty/);
    assert.match(html, />Mon</);
  });

  test('day data attributes include date + state', () => {
    const html = DayPreview({
      day: stubDay({ date: '2026-04-20', state: 'PROPOSED' }),
      dayIdx: 0,
      weeklyCompositionId: 'w1'
    });
    assert.match(html, /data-date="2026-04-20"/);
    assert.match(html, /data-state="PROPOSED"/);
  });

  test('activity-list includes all activities', () => {
    const html = DayPreview({
      day: stubDay({ date: '2026-04-20', dayIdx: 0 }),
      dayIdx: 0,
      weeklyCompositionId: 'w1'
    });
    assert.match(html, /DMAIC Charter/);
    assert.match(html, /Daily Standup/);
  });

  test('activity-list handles empty activity array', () => {
    const html = DayPreview({
      day: stubDay({ date: '2026-04-20', dayIdx: 0, activities: [] }),
      dayIdx: 0,
      weeklyCompositionId: 'w1'
    });
    assert.match(html, /class="wk-day-list"/);
  });

  test('escapes potentially dangerous activity names', () => {
    const malicious = stubDay({
      date: '2026-04-20',
      dayIdx: 0,
      activities: [
        {
          id: 'a1',
          catalogEntryId: 'c1',
          name: '<script>alert(1)</script>',
          bucket: 'PROJECT',
          plannedDurationMinutes: 30
        }
      ]
    });
    const html = DayPreview({
      day: malicious,
      dayIdx: 0,
      weeklyCompositionId: 'w1'
    });
    assert.doesNotMatch(html, /<script>alert/);
    assert.match(html, /&lt;script&gt;/);
  });
});

// ---------------------------------------------------------------------------
// WEEK_COPY export
// ---------------------------------------------------------------------------

describe('WEEK_COPY', () => {
  test('exposes the expected keys', () => {
    for (const k of ['TITLE', 'PROPOSE', 'ACCEPT_ALL', 'EMPTY', 'DAY_EMPTY']) {
      assert.ok(typeof WEEK_COPY[k] === 'string');
    }
  });

  test('is frozen', () => {
    assert.ok(Object.isFrozen(WEEK_COPY));
  });
});
