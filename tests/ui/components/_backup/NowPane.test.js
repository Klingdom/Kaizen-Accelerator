/**
 * Tests for /js/ui/components/NowPane.js (Sprint 15 W3).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { NowPane, selectNowState, nowPaneVariant } from '../../../../js/ui/components/_backup/NowPane.js';

const NOW = '2026-04-22T10:00:00Z';

function stubActivity(overrides = {}) {
  return {
    id: 'sa_x',
    name: 'Some activity',
    bucket: 'PROJECT',
    plannedDurationMinutes: 60,
    plannedStartAt: '2026-04-22T11:00:00Z',
    state: 'SCHEDULED',
    ...overrides
  };
}

describe('selectNowState — IN_PROGRESS', () => {
  test('detects IN_PROGRESS row and computes elapsed minutes', () => {
    const acts = [
      stubActivity({
        id: 'live',
        state: 'IN_PROGRESS',
        actualStartAt: '2026-04-22T09:30:00Z'
      })
    ];
    const out = selectNowState(acts, NOW);
    assert.equal(out.kind, 'IN_PROGRESS');
    assert.equal(out.activity.id, 'live');
    assert.equal(out.elapsedMinutes, 30);
  });

  test('elapsed clamps to 0 when actualStartAt is in the future', () => {
    const acts = [
      stubActivity({
        id: 'live',
        state: 'IN_PROGRESS',
        actualStartAt: '2026-04-22T11:00:00Z'
      })
    ];
    const out = selectNowState(acts, NOW);
    assert.equal(out.kind, 'IN_PROGRESS');
    assert.equal(out.elapsedMinutes, 0);
  });

  test('IN_PROGRESS wins over an upcoming row', () => {
    const acts = [
      stubActivity({ id: 'soon', plannedStartAt: '2026-04-22T10:10:00Z' }),
      stubActivity({
        id: 'live',
        state: 'IN_PROGRESS',
        actualStartAt: '2026-04-22T09:55:00Z'
      })
    ];
    const out = selectNowState(acts, NOW);
    assert.equal(out.kind, 'IN_PROGRESS');
    assert.equal(out.activity.id, 'live');
  });

  test('picks the earliest IN_PROGRESS when there are several', () => {
    const acts = [
      stubActivity({
        id: 'late',
        state: 'IN_PROGRESS',
        actualStartAt: '2026-04-22T09:50:00Z'
      }),
      stubActivity({
        id: 'early',
        state: 'IN_PROGRESS',
        actualStartAt: '2026-04-22T09:30:00Z'
      })
    ];
    const out = selectNowState(acts, NOW);
    assert.equal(out.kind, 'IN_PROGRESS');
    assert.equal(out.activity.id, 'early');
  });
});

describe('selectNowState — UPCOMING', () => {
  test('returns UPCOMING when next future row is within 30 min', () => {
    const acts = [
      stubActivity({ id: 'soon', plannedStartAt: '2026-04-22T10:15:00Z' })
    ];
    const out = selectNowState(acts, NOW);
    assert.equal(out.kind, 'UPCOMING');
    assert.equal(out.activity.id, 'soon');
    assert.equal(out.minutesUntil, 15);
  });

  test('boundary at exactly 30 minutes is UPCOMING', () => {
    const acts = [
      stubActivity({ id: 'edge', plannedStartAt: '2026-04-22T10:30:00Z' })
    ];
    const out = selectNowState(acts, NOW);
    assert.equal(out.kind, 'UPCOMING');
    assert.equal(out.minutesUntil, 30);
  });

  test('beyond 30 minutes flips to OPEN_TIME', () => {
    const acts = [
      stubActivity({ id: 'far', plannedStartAt: '2026-04-22T10:31:00Z' })
    ];
    const out = selectNowState(acts, NOW);
    assert.equal(out.kind, 'OPEN_TIME');
  });
});

describe('selectNowState — OPEN_TIME', () => {
  test('returns OPEN_TIME with minutesUntil + nextActivity for far-future block', () => {
    const acts = [
      stubActivity({ id: 'far', plannedStartAt: '2026-04-22T13:00:00Z' })
    ];
    const out = selectNowState(acts, NOW);
    assert.equal(out.kind, 'OPEN_TIME');
    assert.equal(out.minutesUntil, 180);
    assert.equal(out.nextActivity.id, 'far');
  });

  test('returns OPEN_TIME with null nextActivity when nothing scheduled', () => {
    const out = selectNowState([], NOW);
    assert.equal(out.kind, 'OPEN_TIME');
    assert.equal(out.nextActivity, null);
    assert.equal(out.minutesUntil, null);
  });

  test('skips CLOSED / SKIPPED / DROPPED rows when computing next', () => {
    const acts = [
      stubActivity({ id: 'closed', state: 'CLOSED', plannedStartAt: '2026-04-22T11:00:00Z' }),
      stubActivity({ id: 'skipped', state: 'SKIPPED', plannedStartAt: '2026-04-22T12:00:00Z' }),
      stubActivity({ id: 'dropped', state: 'DROPPED', plannedStartAt: '2026-04-22T13:00:00Z' }),
      stubActivity({ id: 'real', plannedStartAt: '2026-04-22T14:00:00Z' })
    ];
    const out = selectNowState(acts, NOW);
    assert.equal(out.kind, 'OPEN_TIME');
    assert.equal(out.nextActivity.id, 'real');
  });

  test('returns OPEN_TIME with null fields when nowIso is not parseable', () => {
    const acts = [stubActivity()];
    const out = selectNowState(acts, '');
    assert.equal(out.kind, 'OPEN_TIME');
    assert.equal(out.nextActivity, null);
    assert.equal(out.minutesUntil, null);
  });
});

describe('nowPaneVariant', () => {
  test('returns the kind discriminator', () => {
    assert.equal(nowPaneVariant([], NOW), 'OPEN_TIME');
    assert.equal(
      nowPaneVariant([stubActivity({ plannedStartAt: '2026-04-22T10:10:00Z' })], NOW),
      'UPCOMING'
    );
    assert.equal(
      nowPaneVariant([stubActivity({ state: 'IN_PROGRESS', actualStartAt: '2026-04-22T09:30:00Z' })], NOW),
      'IN_PROGRESS'
    );
  });
});

describe('NowPane — rendering', () => {
  test('IN_PROGRESS renders Now label + name + elapsed + Close button', () => {
    const html = NowPane({
      activities: [
        stubActivity({
          id: 'live',
          name: 'Charter',
          state: 'IN_PROGRESS',
          actualStartAt: '2026-04-22T09:30:00Z'
        })
      ],
      nowIso: NOW
    });
    assert.match(html, /class="now-pane now-pane-in-progress"/);
    assert.match(html, /data-kind="IN_PROGRESS"/);
    assert.match(html, />Now</);
    assert.match(html, />Charter</);
    assert.match(html, />30m elapsed</);
    assert.match(html, /data-action="OPEN_CLOSE_DIALOG"/);
    assert.match(html, /data-payload='\{&quot;activityId&quot;:&quot;live&quot;\}'/);
  });

  test('UPCOMING renders countdown + name', () => {
    const html = NowPane({
      activities: [stubActivity({ id: 'soon', name: 'Standup', plannedStartAt: '2026-04-22T10:15:00Z' })],
      nowIso: NOW
    });
    assert.match(html, /class="now-pane now-pane-upcoming"/);
    assert.match(html, /data-kind="UPCOMING"/);
    assert.match(html, />Up next in 15m</);
    assert.match(html, />Standup</);
  });

  test('OPEN_TIME with nextActivity renders minutesUntil + name', () => {
    const html = NowPane({
      activities: [stubActivity({ id: 'far', name: 'Far', plannedStartAt: '2026-04-22T13:00:00Z' })],
      nowIso: NOW
    });
    assert.match(html, /class="now-pane now-pane-open"/);
    assert.match(html, />Open time until 180m</);
    assert.match(html, />next: Far</);
  });

  test('OPEN_TIME empty renders "Nothing on deck."', () => {
    const html = NowPane({ activities: [], nowIso: NOW });
    assert.match(html, /Nothing on deck/);
  });

  test('escapes attacker activity name in IN_PROGRESS', () => {
    const html = NowPane({
      activities: [
        stubActivity({
          id: 'live',
          name: '<script>alert(1)</script>',
          state: 'IN_PROGRESS',
          actualStartAt: '2026-04-22T09:30:00Z'
        })
      ],
      nowIso: NOW
    });
    assert.doesNotMatch(html, /<script>alert\(1\)<\/script>/);
    assert.match(html, /&lt;script&gt;/);
  });

  test('IN_PROGRESS exposes data-activity-id on the section', () => {
    const html = NowPane({
      activities: [
        stubActivity({ id: 'live', state: 'IN_PROGRESS', actualStartAt: '2026-04-22T09:30:00Z' })
      ],
      nowIso: NOW
    });
    assert.match(html, /data-activity-id="live"/);
  });
});
