/**
 * Tests for ScheduledActivityBlock — pure render.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  ScheduledActivityBlock,
  formatTime
} from '../../../js/ui/components/ScheduledActivityBlock.js';

describe('ScheduledActivityBlock.formatTime', () => {
  test('HH:MM passes through', () => {
    assert.equal(formatTime('09:15'), '09:15');
  });

  test('HH:MM:SS truncates', () => {
    assert.equal(formatTime('09:15:30'), '09:15');
  });

  test('ISO timestamp → HH:MM in UTC', () => {
    assert.equal(formatTime('2026-04-21T09:15:00Z'), '09:15');
  });

  test('empty / null returns empty', () => {
    assert.equal(formatTime(''), '');
    assert.equal(formatTime(null), '');
    assert.equal(formatTime(undefined), '');
  });

  test('invalid ISO returns empty', () => {
    assert.equal(formatTime('not-a-date'), '');
  });
});

describe('ScheduledActivityBlock — structure', () => {
  const baseActivity = {
    id: 'sa_1',
    catalogEntryId: 'cat_12_pdca_cycle',
    name: 'PDCA Cycle',
    bucket: 'CI',
    plannedDurationMinutes: 30,
    plannedStartAt: '10:15',
    state: 'PROPOSED',
    intention: null
  };

  test('missing activity → placeholder LI', () => {
    const html = ScheduledActivityBlock();
    assert.match(html, /sa-missing/);
  });

  test('renders an <li> with sa-block class', () => {
    const html = ScheduledActivityBlock({ activity: baseActivity });
    assert.match(html, /^<li/);
    assert.match(html, /class="sa-block/);
  });

  test('renders planned minutes', () => {
    const html = ScheduledActivityBlock({ activity: baseActivity });
    assert.match(html, />30m</);
  });

  test('renders bucket chip with bucket-specific class', () => {
    const html = ScheduledActivityBlock({ activity: baseActivity });
    assert.match(html, /chip-ci/);
  });

  test('PROJECT bucket uses chip-project class', () => {
    const html = ScheduledActivityBlock({
      activity: { ...baseActivity, bucket: 'PROJECT' }
    });
    assert.match(html, /chip-project/);
  });

  test('COMMUNICATION bucket uses chip-communication class', () => {
    const html = ScheduledActivityBlock({
      activity: { ...baseActivity, bucket: 'COMMUNICATION' }
    });
    assert.match(html, /chip-communication/);
  });

  test('renders the activity name', () => {
    const html = ScheduledActivityBlock({ activity: baseActivity });
    assert.match(html, /PDCA Cycle/);
  });

  test('carries data-activity-id attribute', () => {
    const html = ScheduledActivityBlock({ activity: baseActivity });
    assert.match(html, /data-activity-id="sa_1"/);
  });

  test('carries data-bucket attribute', () => {
    const html = ScheduledActivityBlock({ activity: baseActivity });
    assert.match(html, /data-bucket="CI"/);
  });

  test('renders plannedStartAt as HH:MM', () => {
    const html = ScheduledActivityBlock({ activity: baseActivity });
    assert.match(html, /10:15/);
  });

  test('falls back to anchor when plannedStartAt missing', () => {
    const html = ScheduledActivityBlock({
      activity: { ...baseActivity, plannedStartAt: null, anchor: '13:00' }
    });
    assert.match(html, /13:00/);
  });

  test('Sprint 16a: sa-when shows the HH:MM–HH:MM time range', () => {
    const html = ScheduledActivityBlock({ activity: baseActivity });
    // baseActivity: 10:15 + 30m → 10:15–10:45 (en-dash U+2013).
    const m = html.match(/<div class="sa-when"[^>]*>([\s\S]*?)<\/div>/);
    assert.ok(m, 'sa-when div not found');
    assert.equal(m[1], '10:15\u201310:45');
  });

  test('Sprint 16a: sa-when carries aria-label "starts at HH:MM, N minutes"', () => {
    const html = ScheduledActivityBlock({ activity: baseActivity });
    assert.match(html, /<div class="sa-when" aria-label="starts at 10:15, 30 minutes">/);
  });
});

describe('ScheduledActivityBlock — state variants', () => {
  const baseActivity = {
    id: 'sa_1',
    name: 'Daily Standup',
    bucket: 'COMMUNICATION',
    plannedDurationMinutes: 15,
    plannedStartAt: '09:00'
  };

  test('PROPOSED state → state label "proposed"', () => {
    const html = ScheduledActivityBlock({
      activity: { ...baseActivity, state: 'PROPOSED' }
    });
    assert.match(html, /sa-state-proposed/);
    assert.match(html, />proposed</);
  });

  test('SCHEDULED state → state label "scheduled"', () => {
    const html = ScheduledActivityBlock({
      activity: { ...baseActivity, state: 'SCHEDULED' }
    });
    assert.match(html, /sa-state-scheduled/);
    assert.match(html, />scheduled</);
  });

  test('IN_PROGRESS state → "in progress" label', () => {
    const html = ScheduledActivityBlock({
      activity: { ...baseActivity, state: 'IN_PROGRESS' }
    });
    assert.match(html, /sa-state-in_progress/);
    assert.match(html, />in progress</);
  });

  test('CLOSED state → "closed" label', () => {
    const html = ScheduledActivityBlock({
      activity: { ...baseActivity, state: 'CLOSED' }
    });
    assert.match(html, /sa-state-closed/);
  });

  test('SKIPPED state → "skipped" label', () => {
    const html = ScheduledActivityBlock({
      activity: { ...baseActivity, state: 'SKIPPED' }
    });
    assert.match(html, /sa-state-skipped/);
  });
});

describe('ScheduledActivityBlock — Start button (Sprint 5 enabled)', () => {
  const baseActivity = {
    id: 'sa_start_test',
    name: 'Deep Block',
    bucket: 'PROJECT',
    plannedDurationMinutes: 120,
    plannedStartAt: '10:15',
    state: 'SCHEDULED'
  };

  test('showStart=false → no Start button', () => {
    const html = ScheduledActivityBlock({ activity: baseActivity });
    assert.ok(!html.includes('sa-start'));
  });

  test('showStart=true → Start button rendered', () => {
    const html = ScheduledActivityBlock({
      activity: baseActivity,
      showStart: true
    });
    assert.match(html, /<button[^>]*class="sa-start"/);
  });

  test('Start button is NOT disabled (Sprint 5 ships it)', () => {
    const html = ScheduledActivityBlock({
      activity: baseActivity,
      showStart: true
    });
    assert.ok(!/sa-start[^>]*\sdisabled/.test(html));
    assert.ok(!/aria-disabled="true"/.test(html));
  });

  test('Start button has data-action=START_ACTIVITY', () => {
    const html = ScheduledActivityBlock({
      activity: baseActivity,
      showStart: true
    });
    assert.match(html, /data-action="START_ACTIVITY"/);
  });

  test('Start button payload carries the activity id', () => {
    const html = ScheduledActivityBlock({
      activity: baseActivity,
      showStart: true
    });
    assert.match(html, /activityId.*sa_start_test/);
  });

  test('SCHEDULED block renders a Skip button', () => {
    const html = ScheduledActivityBlock({
      activity: baseActivity,
      showStart: true
    });
    assert.match(html, /<button[^>]*class="sa-skip"/);
    assert.match(html, /data-action="OPEN_SKIP_MODAL"/);
  });

  test('Skip button payload carries the activity id', () => {
    const html = ScheduledActivityBlock({
      activity: baseActivity,
      showStart: true
    });
    assert.match(html, /sa-skip[^>]*activityId.*sa_start_test/);
  });
});

describe('ScheduledActivityBlock — IN_PROGRESS variant', () => {
  const baseActivity = {
    id: 'sa_running',
    name: 'Deep Block',
    bucket: 'PROJECT',
    plannedDurationMinutes: 120,
    plannedStartAt: '10:15',
    state: 'IN_PROGRESS',
    actualStartAt: '2026-04-21T10:15:00Z'
  };

  test('renders a Close button (no Start)', () => {
    const html = ScheduledActivityBlock({
      activity: baseActivity,
      showStart: true,
      nowIso: '2026-04-21T11:00:00Z'
    });
    assert.match(html, /<button[^>]*class="sa-close"/);
    assert.ok(!/class="sa-start"/.test(html));
  });

  test('Close button uses data-action=OPEN_CLOSE_DIALOG', () => {
    const html = ScheduledActivityBlock({
      activity: baseActivity,
      showStart: true,
      nowIso: '2026-04-21T11:00:00Z'
    });
    assert.match(html, /data-action="OPEN_CLOSE_DIALOG"/);
  });

  test('renders the elapsed-minute readout', () => {
    const html = ScheduledActivityBlock({
      activity: baseActivity,
      showStart: true,
      nowIso: '2026-04-21T11:00:00Z'
    });
    assert.match(html, /45m elapsed/);
  });

  test('elapsed of 0 when nowIso missing', () => {
    const html = ScheduledActivityBlock({
      activity: baseActivity,
      showStart: true
    });
    assert.match(html, /0m elapsed/);
  });
});

describe('ScheduledActivityBlock — SKIPPED variant', () => {
  test('renders the reason code label', () => {
    const html = ScheduledActivityBlock({
      activity: {
        id: 'sa_s',
        name: 'Standup',
        bucket: 'COMMUNICATION',
        plannedDurationMinutes: 15,
        plannedStartAt: '09:00',
        state: 'SKIPPED',
        reasonCodeIfSkipped: 'MEETING_CONFLICT'
      }
    });
    assert.match(html, /sa-skip-reason/);
    assert.match(html, /MEETING_CONFLICT/);
  });
});

describe('ScheduledActivityBlock — why chip', () => {
  test('renders the why-chip when composition PROPOSED + explain provided', () => {
    const html = ScheduledActivityBlock({
      activity: {
        id: 'sa_why',
        name: 'PDCA',
        bucket: 'CI',
        plannedDurationMinutes: 30,
        state: 'PROPOSED'
      },
      compositionState: 'PROPOSED',
      explainEntry: { ref: 'cat_12_pdca_cycle', rule: 'R5_CI_ROTATION', detail: 'CI rotation fill' }
    });
    assert.match(html, /why-chip/);
    assert.match(html, /CI rotation fill/);
  });

  test('hides the why-chip on ACCEPTED composition', () => {
    const html = ScheduledActivityBlock({
      activity: {
        id: 'sa_why',
        name: 'PDCA',
        bucket: 'CI',
        plannedDurationMinutes: 30,
        state: 'SCHEDULED'
      },
      compositionState: 'ACCEPTED',
      explainEntry: { ref: 'cat_12_pdca_cycle', rule: 'R5_CI_ROTATION', detail: 'x' }
    });
    assert.ok(!html.includes('why-chip'));
  });

  test('no explainEntry → no why-chip', () => {
    const html = ScheduledActivityBlock({
      activity: {
        id: 'sa_w',
        name: 'x',
        bucket: 'CI',
        plannedDurationMinutes: 30,
        state: 'PROPOSED'
      },
      compositionState: 'PROPOSED'
    });
    assert.ok(!html.includes('why-chip'));
  });
});

describe('ScheduledActivityBlock — computeElapsedMinutes', () => {
  test('45 minutes between two ISO stamps', () => {
    const mins = ScheduledActivityBlock({
      activity: {
        id: 'x',
        name: 'y',
        bucket: 'PROJECT',
        plannedDurationMinutes: 60,
        state: 'IN_PROGRESS',
        actualStartAt: '2026-04-21T10:15:00Z'
      },
      nowIso: '2026-04-21T11:00:00Z'
    });
    assert.match(mins, /45m elapsed/);
  });
});

describe('ScheduledActivityBlock — intention (read-only)', () => {
  const baseActivity = {
    id: 'sa_i',
    name: 'Deep Block',
    bucket: 'PROJECT',
    plannedDurationMinutes: 120,
    state: 'PROPOSED'
  };

  test('empty intention renders placeholder copy from §6.5.8', () => {
    const html = ScheduledActivityBlock({ activity: baseActivity });
    assert.match(html, /One line: what outcome by close\?/);
  });

  test('set intention renders the value', () => {
    const html = ScheduledActivityBlock({
      activity: { ...baseActivity, intention: 'Close the PRFAQ draft' }
    });
    assert.match(html, /Close the PRFAQ draft/);
    assert.ok(!html.includes('One line: what outcome'));
  });

  test('intention is HTML-escaped', () => {
    const html = ScheduledActivityBlock({
      activity: { ...baseActivity, intention: '<script>alert(1)</script>' }
    });
    assert.ok(!html.includes('<script>alert'));
    assert.match(html, /&lt;script&gt;/);
  });
});

describe('ScheduledActivityBlock — carried-over badge', () => {
  test('carriedOver=true renders "carried" badge', () => {
    const html = ScheduledActivityBlock({
      activity: {
        id: 'sa_c',
        name: 'L&D Tracker',
        bucket: 'CI',
        plannedDurationMinutes: 60,
        state: 'PROPOSED',
        carriedOver: true
      }
    });
    assert.match(html, /carried-badge/);
  });

  test('carriedOver=false → no carried badge', () => {
    const html = ScheduledActivityBlock({
      activity: {
        id: 'sa_c',
        name: 'L&D Tracker',
        bucket: 'CI',
        plannedDurationMinutes: 60,
        state: 'PROPOSED'
      }
    });
    assert.ok(!html.includes('carried-badge'));
  });
});

describe('ScheduledActivityBlock — pinned variant', () => {
  const a = {
    id: 'sa_p',
    name: 'Daily Standup',
    bucket: 'COMMUNICATION',
    plannedDurationMinutes: 15,
    state: 'SCHEDULED'
  };

  test('pinned=true adds "pinned" class', () => {
    const html = ScheduledActivityBlock({ activity: a, pinned: true });
    assert.match(html, /class="[^"]*pinned/);
  });

  test('pinned=false does not add the class', () => {
    const html = ScheduledActivityBlock({ activity: a });
    assert.ok(!/\bpinned\b/.test(html));
  });
});

describe('ScheduledActivityBlock — XSS / injection', () => {
  test('name escapes HTML', () => {
    const html = ScheduledActivityBlock({
      activity: {
        id: 'sa_xss',
        name: '<img src=x onerror=alert(1)>',
        bucket: 'PROJECT',
        plannedDurationMinutes: 30,
        state: 'PROPOSED'
      }
    });
    assert.ok(!html.includes('<img src=x'));
    assert.match(html, /&lt;img/);
  });

  test('id escapes quotes', () => {
    const html = ScheduledActivityBlock({
      activity: {
        id: 'sa"onerror=alert(1)',
        name: 'x',
        bucket: 'CI',
        plannedDurationMinutes: 30,
        state: 'PROPOSED'
      }
    });
    assert.ok(!html.includes('sa"onerror'));
    assert.match(html, /&quot;/);
  });
});
