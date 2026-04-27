/**
 * Component-level visual-regression locks — spec §2.4 / §7.
 *
 * These tests assert the exact class strings emitted by every bucket-aware
 * component so any drift is caught immediately. They are written against the
 * post-refactor API (bucketMeta), but the class tokens they assert are
 * identical to the pre-refactor output — the refactor is a pure rename of the
 * derivation site, not of the CSS classes themselves.
 *
 * No DOM, no I/O, all fixtures deterministic.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { ScheduledActivityBlock } from '../../js/ui/components/ScheduledActivityBlock.js';
import { WeekGrid } from '../../js/ui/components/WeekGrid.js';
import { UpNextRail } from '../../js/ui/components/UpNextRail.js';
import { Week } from '../../js/ui/pages/Week.js';

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const NOW_ISO = '2026-04-22T09:00:00Z';
const FUTURE_ISO = '2026-04-22T11:00:00Z';

function stubActivity(overrides = {}) {
  return {
    id: 'sa_reg_1',
    name: 'Regression Activity',
    bucket: 'PROJECT',
    plannedDurationMinutes: 60,
    plannedStartAt: FUTURE_ISO,
    state: 'SCHEDULED',
    ...overrides
  };
}

// ---------------------------------------------------------------------------
// ScheduledActivityBlock
// ---------------------------------------------------------------------------
describe('ScheduledActivityBlock — bucket chip class regression', () => {
  test('PROJECT bucket → sa-bucket-chip chip-project', () => {
    const html = ScheduledActivityBlock({ activity: stubActivity({ bucket: 'PROJECT' }) });
    assert.ok(html.includes('sa-bucket-chip chip-project'), `Expected class not found. HTML: ${html.slice(0, 400)}`);
  });

  test('COMMUNICATION bucket → sa-bucket-chip chip-communication', () => {
    const html = ScheduledActivityBlock({ activity: stubActivity({ bucket: 'COMMUNICATION' }) });
    assert.ok(html.includes('sa-bucket-chip chip-communication'), `Expected class not found.`);
  });

  test('CI bucket → sa-bucket-chip chip-ci', () => {
    const html = ScheduledActivityBlock({ activity: stubActivity({ bucket: 'CI' }) });
    assert.ok(html.includes('sa-bucket-chip chip-ci'), `Expected class not found.`);
  });

  test('null bucket → sa-bucket-chip chip-unknown', () => {
    const html = ScheduledActivityBlock({ activity: stubActivity({ bucket: null }) });
    assert.ok(html.includes('sa-bucket-chip chip-unknown'), `Expected chip-unknown. HTML: ${html.slice(0, 400)}`);
  });
});

// ---------------------------------------------------------------------------
// WeekGrid block
// ---------------------------------------------------------------------------

function stubWeeklyForGrid(bucket) {
  return {
    id: 'wcomp_reg',
    userId: 'user_test',
    weekStart: '2026-04-21',
    weekEnd: '2026-04-25',
    state: 'PROPOSED',
    days: [
      {
        id: 'day_reg_0',
        date: '2026-04-21',
        dayIdx: 0,
        state: 'PROPOSED',
        activities: [
          {
            id: 'sa_wg_reg',
            name: 'Grid Regression',
            bucket,
            plannedDurationMinutes: 120,
            plannedStartAt: '09:00',
            state: 'PROPOSED'
          }
        ]
      },
      { id: 'day_reg_1', date: '2026-04-22', dayIdx: 1, state: 'PROPOSED', activities: [] },
      { id: 'day_reg_2', date: '2026-04-23', dayIdx: 2, state: 'PROPOSED', activities: [] },
      { id: 'day_reg_3', date: '2026-04-24', dayIdx: 3, state: 'PROPOSED', activities: [] },
      { id: 'day_reg_4', date: '2026-04-25', dayIdx: 4, state: 'PROPOSED', activities: [] }
    ]
  };
}

describe('WeekGrid block — bucket chip class regression', () => {
  test('PROJECT bucket → wg-block chip-project', () => {
    const html = WeekGrid({ weeklyComposition: stubWeeklyForGrid('PROJECT') });
    assert.ok(html.includes('wg-block chip-project'), `Expected class not found. HTML snippet: ${html.slice(0, 500)}`);
  });

  test('COMMUNICATION bucket → wg-block chip-communication', () => {
    const html = WeekGrid({ weeklyComposition: stubWeeklyForGrid('COMMUNICATION') });
    assert.ok(html.includes('wg-block chip-communication'), `Expected class not found.`);
  });

  test('CI bucket → wg-block chip-ci', () => {
    const html = WeekGrid({ weeklyComposition: stubWeeklyForGrid('CI') });
    assert.ok(html.includes('wg-block chip-ci'), `Expected class not found.`);
  });
});

// ---------------------------------------------------------------------------
// UpNextRail dot
// ---------------------------------------------------------------------------

function stubUpNextActivity(bucket) {
  return {
    id: `sa_un_${bucket}`,
    name: `UpNext ${bucket}`,
    bucket,
    plannedDurationMinutes: 45,
    plannedStartAt: FUTURE_ISO,
    state: 'SCHEDULED'
  };
}

describe('UpNextRail dot — compound class regression (post-rename)', () => {
  test('PROJECT bucket → up-next-dot chip-project', () => {
    const html = UpNextRail({
      activities: [stubUpNextActivity('PROJECT')],
      nowIso: NOW_ISO
    });
    assert.ok(html.includes('up-next-dot chip-project'), `Expected compound class. HTML: ${html.slice(0, 400)}`);
  });

  test('COMMUNICATION bucket → up-next-dot chip-communication', () => {
    const html = UpNextRail({
      activities: [stubUpNextActivity('COMMUNICATION')],
      nowIso: NOW_ISO
    });
    assert.ok(html.includes('up-next-dot chip-communication'), `Expected compound class.`);
  });

  test('CI bucket → up-next-dot chip-ci', () => {
    const html = UpNextRail({
      activities: [stubUpNextActivity('CI')],
      nowIso: NOW_ISO
    });
    assert.ok(html.includes('up-next-dot chip-ci'), `Expected compound class.`);
  });

  test('null bucket → up-next-dot chip-unknown', () => {
    const html = UpNextRail({
      activities: [stubUpNextActivity(null)],
      nowIso: NOW_ISO
    });
    assert.ok(html.includes('up-next-dot chip-unknown'), `Expected chip-unknown compound class.`);
  });
});

// ---------------------------------------------------------------------------
// Week page chip (DayPreview activity chip via Week)
// ---------------------------------------------------------------------------

function stubWeeklyForPage(bucket) {
  return {
    id: 'wcomp_page_reg',
    userId: 'user_test',
    weekStart: '2026-04-21',
    weekEnd: '2026-04-25',
    state: 'PROPOSED',
    days: [
      {
        id: 'day_page_0',
        date: '2026-04-21',
        dayIdx: 0,
        state: 'PROPOSED',
        activities: [
          {
            id: 'sa_page_reg',
            name: 'Page Regression',
            bucket,
            plannedDurationMinutes: 60,
            state: 'PROPOSED'
          }
        ]
      },
      { id: 'day_page_1', date: '2026-04-22', dayIdx: 1, state: 'PROPOSED', activities: [] },
      { id: 'day_page_2', date: '2026-04-23', dayIdx: 2, state: 'PROPOSED', activities: [] },
      { id: 'day_page_3', date: '2026-04-24', dayIdx: 3, state: 'PROPOSED', activities: [] },
      { id: 'day_page_4', date: '2026-04-25', dayIdx: 4, state: 'PROPOSED', activities: [] }
    ]
  };
}

describe('Week page chip — bucket class regression', () => {
  test('PROJECT bucket → wk-chip chip-project', () => {
    const html = Week({ weeklyComposition: stubWeeklyForPage('PROJECT'), nowIso: NOW_ISO });
    assert.ok(html.includes('wk-chip chip-project'), `Expected class not found.`);
  });

  test('COMMUNICATION bucket → wk-chip chip-communication', () => {
    const html = Week({ weeklyComposition: stubWeeklyForPage('COMMUNICATION'), nowIso: NOW_ISO });
    assert.ok(html.includes('wk-chip chip-communication'), `Expected class not found.`);
  });

  test('CI bucket → wk-chip chip-ci', () => {
    const html = Week({ weeklyComposition: stubWeeklyForPage('CI'), nowIso: NOW_ISO });
    assert.ok(html.includes('wk-chip chip-ci'), `Expected class not found.`);
  });
});

// ---------------------------------------------------------------------------
// CSS structural assertions
// ---------------------------------------------------------------------------

describe('app.css structural locks', () => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const cssPath = path.resolve(__dirname, '../../app.css');
  const css = readFileSync(cssPath, 'utf-8');

  test('forced-colors block appears exactly once', () => {
    const matches = (css.match(/@media \(forced-colors: active\)/g) ?? []).length;
    assert.equal(matches, 1, `Expected 1 forced-colors block, found ${matches}`);
  });

  test('--accent-primary token is present (as var reference)', () => {
    assert.ok(
      css.includes('var(--accent-primary,') || css.includes('--accent-primary:'),
      'Expected --accent-primary reference in app.css'
    );
  });

  test('--color-primary reference does not appear (deprecated name gone)', () => {
    // The rename covers both `:root` declarations and `var()` references.
    // Neither form of the old name should remain.
    assert.ok(
      !css.includes('var(--color-primary,') && !css.includes('--color-primary:'),
      '--color-primary must not appear in app.css'
    );
  });

  test('BucketStrip canonical selector .bucket-row.bucket-project is preserved', () => {
    assert.ok(css.includes('.bucket-row.bucket-project'), 'BucketStrip canonical selector must be preserved');
  });

  test('unified .up-next-dot.chip-project compound selector is present', () => {
    assert.ok(css.includes('.up-next-dot.chip-project'), 'Expected unified compound selector in app.css');
  });

  test('old .up-next-dot-project selector does not appear', () => {
    assert.ok(!css.includes('.up-next-dot-project'), 'Deprecated .up-next-dot-project must not appear in app.css');
  });
});
