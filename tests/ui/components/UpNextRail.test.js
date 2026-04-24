/**
 * Tests for /js/ui/components/UpNextRail.js (Sprint 15 W2).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { UpNextRail, selectUpNext, activitySortKey } from '../../../js/ui/components/UpNextRail.js';

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

describe('activitySortKey', () => {
  test('returns ISO start verbatim for ISO plannedStartAt', () => {
    assert.equal(
      activitySortKey({ plannedStartAt: '2026-04-22T11:00:00Z' }),
      '2026-04-22T11:00:00Z'
    );
  });

  test('combines _date + HH:MM into ISO-like key', () => {
    const out = activitySortKey({ plannedStartAt: '11:00', _date: '2026-04-22' });
    assert.equal(out, '2026-04-22T11:00:00');
  });

  test('returns null when HH:MM has no _date', () => {
    assert.equal(activitySortKey({ plannedStartAt: '11:00' }), null);
  });

  test('returns null on missing/invalid input', () => {
    assert.equal(activitySortKey(null), null);
    assert.equal(activitySortKey({}), null);
    assert.equal(activitySortKey({ plannedStartAt: 'bogus' }), null);
  });
});

describe('selectUpNext', () => {
  test('filters out past activities', () => {
    const acts = [
      stubActivity({ id: 'past', plannedStartAt: '2026-04-22T09:00:00Z' }),
      stubActivity({ id: 'future', plannedStartAt: '2026-04-22T11:00:00Z' })
    ];
    const out = selectUpNext(acts, NOW);
    assert.equal(out.length, 1);
    assert.equal(out[0].id, 'future');
  });

  test('filters out CLOSED / SKIPPED / DROPPED / IN_PROGRESS rows', () => {
    const acts = [
      stubActivity({ id: 'closed', state: 'CLOSED', plannedStartAt: '2026-04-22T11:00:00Z' }),
      stubActivity({ id: 'skipped', state: 'SKIPPED', plannedStartAt: '2026-04-22T12:00:00Z' }),
      stubActivity({ id: 'dropped', state: 'DROPPED', plannedStartAt: '2026-04-22T13:00:00Z' }),
      stubActivity({ id: 'inprog', state: 'IN_PROGRESS', plannedStartAt: '2026-04-22T14:00:00Z' }),
      stubActivity({ id: 'good', state: 'SCHEDULED', plannedStartAt: '2026-04-22T15:00:00Z' })
    ];
    const out = selectUpNext(acts, NOW);
    assert.equal(out.length, 1);
    assert.equal(out[0].id, 'good');
  });

  test('keeps PROPOSED and SCHEDULED states', () => {
    const acts = [
      stubActivity({ id: 'p', state: 'PROPOSED', plannedStartAt: '2026-04-22T11:00:00Z' }),
      stubActivity({ id: 's', state: 'SCHEDULED', plannedStartAt: '2026-04-22T12:00:00Z' })
    ];
    const out = selectUpNext(acts, NOW);
    assert.equal(out.length, 2);
  });

  test('sorts ascending by start time', () => {
    const acts = [
      stubActivity({ id: 'late', plannedStartAt: '2026-04-22T15:00:00Z' }),
      stubActivity({ id: 'early', plannedStartAt: '2026-04-22T11:00:00Z' }),
      stubActivity({ id: 'mid', plannedStartAt: '2026-04-22T13:00:00Z' })
    ];
    const out = selectUpNext(acts, NOW);
    assert.deepEqual(out.map((a) => a.id), ['early', 'mid', 'late']);
  });

  test('returns empty when nowIso is missing', () => {
    const acts = [stubActivity()];
    assert.deepEqual(selectUpNext(acts, ''), []);
    assert.deepEqual(selectUpNext(acts, null), []);
  });

  test('returns empty when activities is not an array', () => {
    assert.deepEqual(selectUpNext(null, NOW), []);
    assert.deepEqual(selectUpNext(undefined, NOW), []);
  });

  test('handles HH:MM activities decorated with _date', () => {
    const acts = [
      { id: 'a', name: 'A', bucket: 'PROJECT', plannedDurationMinutes: 60, plannedStartAt: '11:00', _date: '2026-04-22', state: 'PROPOSED' },
      { id: 'b', name: 'B', bucket: 'PROJECT', plannedDurationMinutes: 60, plannedStartAt: '09:00', _date: '2026-04-22', state: 'PROPOSED' }
    ];
    // HH:MM-only without ISO suffix means the sort key is "2026-04-22T11:00:00".
    // Compared against "2026-04-22T10:00:00Z", the trailing 'Z' means string
    // comparisons may differ. Test the deterministic outcome: 'a' is at 11:00
    // (after 10:00 NOW), 'b' is at 09:00 (before NOW).
    const out = selectUpNext(acts, NOW);
    assert.equal(out.length, 1);
    assert.equal(out[0].id, 'a');
  });
});

describe('UpNextRail — rendering', () => {
  test('renders an <aside> with Up next title', () => {
    const html = UpNextRail({
      activities: [stubActivity()],
      nowIso: NOW
    });
    assert.match(html, /class="up-next-rail"/);
    assert.match(html, /<aside/);
    assert.match(html, />Up next</);
  });

  test('exposes data-variant="rail" by default', () => {
    const html = UpNextRail({
      activities: [stubActivity()],
      nowIso: NOW
    });
    assert.match(html, /data-variant="rail"/);
  });

  test('mobile variant exposes data-variant="mobile" + extra class', () => {
    const html = UpNextRail({
      activities: [stubActivity()],
      nowIso: NOW,
      variant: 'mobile'
    });
    assert.match(html, /class="up-next-rail up-next-mobile"/);
    assert.match(html, /data-variant="mobile"/);
  });

  test('renders empty state when no activities upcoming', () => {
    const html = UpNextRail({
      activities: [],
      nowIso: NOW
    });
    assert.match(html, /class="up-next-empty"/);
    assert.match(html, /Nothing else scheduled/);
  });

  test('renders empty state when all rows are past', () => {
    const acts = [stubActivity({ plannedStartAt: '2026-04-22T08:00:00Z' })];
    const html = UpNextRail({ activities: acts, nowIso: NOW });
    assert.match(html, /class="up-next-empty"/);
  });

  test('renders rows with time, name, duration, bucket dot', () => {
    const html = UpNextRail({
      activities: [stubActivity({ name: 'Charter', plannedDurationMinutes: 90 })],
      nowIso: NOW
    });
    assert.match(html, /class="up-next-time">11:00</);
    assert.match(html, />Charter</);
    assert.match(html, /up-next-dot-project/);
    assert.match(html, /class="up-next-dur">90m</);
  });

  test('renders bucket dot classes for each bucket', () => {
    const html = UpNextRail({
      activities: [
        stubActivity({ id: 'p', bucket: 'PROJECT', plannedStartAt: '2026-04-22T11:00:00Z' }),
        stubActivity({ id: 'c', bucket: 'COMMUNICATION', plannedStartAt: '2026-04-22T12:00:00Z' }),
        stubActivity({ id: 'i', bucket: 'CI', plannedStartAt: '2026-04-22T13:00:00Z' })
      ],
      nowIso: NOW
    });
    assert.match(html, /up-next-dot-project/);
    assert.match(html, /up-next-dot-communication/);
    assert.match(html, /up-next-dot-ci/);
  });

  test('renders kaizen chip when title is provided', () => {
    const html = UpNextRail({
      activities: [stubActivity({ linkedKaizenId: 'k1' })],
      nowIso: NOW,
      kaizenTitleById: { k1: 'Demo Kaizen' }
    });
    assert.match(html, /class="up-next-kaizen"/);
    assert.match(html, />Demo Kaizen</);
  });

  test('omits kaizen chip when no title is found', () => {
    const html = UpNextRail({
      activities: [stubActivity({ linkedKaizenId: 'k1' })],
      nowIso: NOW
    });
    assert.doesNotMatch(html, /up-next-kaizen/);
  });

  test('limits to 5 rows by default', () => {
    const acts = [];
    for (let i = 0; i < 12; i += 1) {
      acts.push(stubActivity({
        id: `a${i}`,
        plannedStartAt: `2026-04-22T${String(11 + i).padStart(2, '0')}:00:00Z`
      }));
    }
    const html = UpNextRail({ activities: acts, nowIso: NOW });
    const matches = html.match(/class="up-next-row"/g);
    assert.equal(matches?.length, 5);
  });

  test('respects custom limit', () => {
    const acts = [];
    for (let i = 0; i < 12; i += 1) {
      acts.push(stubActivity({
        id: `a${i}`,
        plannedStartAt: `2026-04-22T${String(11 + i).padStart(2, '0')}:00:00Z`
      }));
    }
    const html = UpNextRail({ activities: acts, nowIso: NOW, limit: 3 });
    const matches = html.match(/class="up-next-row"/g);
    assert.equal(matches?.length, 3);
  });

  test('escapes attacker name input', () => {
    const html = UpNextRail({
      activities: [stubActivity({ name: '<img onerror=alert(1)>' })],
      nowIso: NOW
    });
    assert.doesNotMatch(html, /<img onerror=alert\(1\)>/);
    assert.match(html, /&lt;img onerror=alert\(1\)&gt;/);
  });

  test('row carries data-activity-id and data-bucket', () => {
    const html = UpNextRail({
      activities: [stubActivity({ id: 'sa1', bucket: 'PROJECT' })],
      nowIso: NOW
    });
    assert.match(html, /data-activity-id="sa1"/);
    assert.match(html, /data-bucket="PROJECT"/);
  });
});
