/**
 * Tests for /js/ui/weekGridMath.js (Sprint 15 W1).
 *
 * Pure positioning math for the hour-grid Week view.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  parseMinutesOfDay,
  extractDateIso,
  topOffsetPx,
  heightPx,
  nowLineOffsetPx,
  hourRailLabels,
  DEFAULT_GRID_START_HOUR,
  DEFAULT_GRID_END_HOUR,
  DEFAULT_ROW_HEIGHT_PX
} from '../../js/ui/weekGridMath.js';

describe('weekGridMath defaults', () => {
  test('exports 7..19 as default grid window', () => {
    assert.equal(DEFAULT_GRID_START_HOUR, 7);
    assert.equal(DEFAULT_GRID_END_HOUR, 19);
  });

  test('exports 60 as default row height', () => {
    assert.equal(DEFAULT_ROW_HEIGHT_PX, 60);
  });
});

describe('parseMinutesOfDay', () => {
  test('parses HH:MM strings', () => {
    assert.equal(parseMinutesOfDay('09:00'), 540);
    assert.equal(parseMinutesOfDay('00:00'), 0);
    assert.equal(parseMinutesOfDay('23:59'), 23 * 60 + 59);
  });

  test('parses HH:MM:SS strings (drops seconds)', () => {
    assert.equal(parseMinutesOfDay('09:00:30'), 540);
    assert.equal(parseMinutesOfDay('14:45:59'), 14 * 60 + 45);
  });

  test('parses ISO timestamps with Z (UTC components)', () => {
    assert.equal(parseMinutesOfDay('2026-04-22T09:00:00Z'), 540);
    assert.equal(parseMinutesOfDay('2026-04-22T17:30:00Z'), 17 * 60 + 30);
  });

  test('returns null for null/undefined', () => {
    assert.equal(parseMinutesOfDay(null), null);
    assert.equal(parseMinutesOfDay(undefined), null);
  });

  test('returns null for empty string', () => {
    assert.equal(parseMinutesOfDay(''), null);
  });

  test('returns null for non-string input', () => {
    assert.equal(parseMinutesOfDay(123), null);
    assert.equal(parseMinutesOfDay({}), null);
  });

  test('returns null for unparseable strings', () => {
    assert.equal(parseMinutesOfDay('not a date'), null);
  });
});

describe('extractDateIso', () => {
  test('extracts YYYY-MM-DD from a full ISO timestamp', () => {
    assert.equal(extractDateIso('2026-04-22T09:00:00Z'), '2026-04-22');
  });

  test('returns the date itself when value is YYYY-MM-DD', () => {
    assert.equal(extractDateIso('2026-04-22'), '2026-04-22');
  });

  test('returns null on too-short input', () => {
    assert.equal(extractDateIso('2026'), null);
    assert.equal(extractDateIso(''), null);
  });

  test('returns null on non-string', () => {
    assert.equal(extractDateIso(null), null);
    assert.equal(extractDateIso(undefined), null);
    assert.equal(extractDateIso(42), null);
  });
});

describe('topOffsetPx — basic positioning', () => {
  test('07:00 (grid start) is 0px', () => {
    assert.equal(topOffsetPx('07:00', 7, 60), 0);
  });

  test('08:00 is 60px (one hour past start)', () => {
    assert.equal(topOffsetPx('08:00', 7, 60), 60);
  });

  test('09:30 is 150px (2.5 hours past start)', () => {
    assert.equal(topOffsetPx('09:30', 7, 60), 150);
  });

  test('19:00 is 720px (12 hours past start)', () => {
    assert.equal(topOffsetPx('19:00', 7, 60), 720);
  });

  test('uses default grid start when omitted', () => {
    // Default 7. So 09:00 → 120px @ default 60 row.
    assert.equal(topOffsetPx('09:00'), 120);
  });

  test('returns null for missing/unparseable start', () => {
    assert.equal(topOffsetPx(null, 7, 60), null);
    assert.equal(topOffsetPx(undefined, 7, 60), null);
    assert.equal(topOffsetPx('', 7, 60), null);
    assert.equal(topOffsetPx('not-a-date', 7, 60), null);
  });

  test('clamps to 0 when start is BEFORE the grid window', () => {
    assert.equal(topOffsetPx('06:00', 7, 60), 0);
    assert.equal(topOffsetPx('05:30', 7, 60), 0);
    assert.equal(topOffsetPx('00:00', 7, 60), 0);
  });

  test('does NOT clamp the upper bound — late hours overflow', () => {
    // 20:00 → 13 hours past 7 → 780px even though grid ends at 19:00.
    assert.equal(topOffsetPx('20:00', 7, 60), 780);
  });

  test('handles ISO timestamps', () => {
    assert.equal(topOffsetPx('2026-04-22T09:00:00Z', 7, 60), 120);
  });

  test('alternative row height scales linearly', () => {
    // 30px rows: 09:00 → 60px instead of 120px.
    assert.equal(topOffsetPx('09:00', 7, 30), 60);
    // 120px rows: 09:00 → 240px.
    assert.equal(topOffsetPx('09:00', 7, 120), 240);
  });

  test('alternative grid start shifts everything', () => {
    // gridStartHour=8 → 09:00 is 60px (was 120 with start=7).
    assert.equal(topOffsetPx('09:00', 8, 60), 60);
  });
});

describe('heightPx', () => {
  test('60-min block is 60px @ 60-row', () => {
    assert.equal(heightPx(60, 60), 60);
  });

  test('30-min block is 30px @ 60-row', () => {
    assert.equal(heightPx(30, 60), 30);
  });

  test('15-min block is 15px @ 60-row', () => {
    assert.equal(heightPx(15, 60), 15);
  });

  test('120-min block is 120px @ 60-row', () => {
    assert.equal(heightPx(120, 60), 120);
  });

  test('uses default row height when omitted', () => {
    assert.equal(heightPx(60), 60);
  });

  test('returns 0 for zero/negative durations', () => {
    assert.equal(heightPx(0, 60), 0);
    assert.equal(heightPx(-30, 60), 0);
  });

  test('returns 0 for non-finite durations', () => {
    assert.equal(heightPx(NaN, 60), 0);
    assert.equal(heightPx(Infinity, 60), 0);
  });

  test('returns 0 for undefined', () => {
    assert.equal(heightPx(undefined, 60), 0);
    assert.equal(heightPx(null, 60), 0);
  });

  test('scales with row height', () => {
    assert.equal(heightPx(30, 30), 15);
    assert.equal(heightPx(60, 120), 120);
  });
});

describe('nowLineOffsetPx', () => {
  test('returns offset when nowIso is in the same date and within window', () => {
    const out = nowLineOffsetPx('2026-04-22T09:00:00Z', '2026-04-22', 7, 19, 60);
    assert.equal(out, 120);
  });

  test('returns null when nowIso is on a different date', () => {
    const out = nowLineOffsetPx('2026-04-23T09:00:00Z', '2026-04-22', 7, 19, 60);
    assert.equal(out, null);
  });

  test('returns null when nowIso is before grid start hour', () => {
    const out = nowLineOffsetPx('2026-04-22T05:30:00Z', '2026-04-22', 7, 19, 60);
    assert.equal(out, null);
  });

  test('returns null when nowIso is after grid end hour', () => {
    const out = nowLineOffsetPx('2026-04-22T20:00:00Z', '2026-04-22', 7, 19, 60);
    assert.equal(out, null);
  });

  test('boundary at 07:00 returns 0', () => {
    assert.equal(nowLineOffsetPx('2026-04-22T07:00:00Z', '2026-04-22', 7, 19, 60), 0);
  });

  test('boundary at 19:00 returns end-of-grid (720px)', () => {
    assert.equal(nowLineOffsetPx('2026-04-22T19:00:00Z', '2026-04-22', 7, 19, 60), 720);
  });

  test('returns null on malformed nowIso', () => {
    assert.equal(nowLineOffsetPx('garbage', '2026-04-22', 7, 19, 60), null);
  });

  test('returns null on non-string inputs', () => {
    assert.equal(nowLineOffsetPx(null, '2026-04-22'), null);
    assert.equal(nowLineOffsetPx('2026-04-22T09:00:00Z', null), null);
    assert.equal(nowLineOffsetPx(42, '2026-04-22'), null);
  });

  test('uses default grid params when omitted', () => {
    assert.equal(nowLineOffsetPx('2026-04-22T08:00:00Z', '2026-04-22'), 60);
  });

  test('alternate row height scales the now-line offset', () => {
    assert.equal(nowLineOffsetPx('2026-04-22T09:00:00Z', '2026-04-22', 7, 19, 30), 60);
  });
});

describe('hourRailLabels', () => {
  test('returns 13 labels for default 07..19 window', () => {
    const labels = hourRailLabels();
    assert.equal(labels.length, 13);
    assert.equal(labels[0], '07:00');
    assert.equal(labels[labels.length - 1], '19:00');
  });

  test('zero-pads single-digit hours', () => {
    const labels = hourRailLabels(0, 5);
    assert.deepEqual(labels, ['00:00', '01:00', '02:00', '03:00', '04:00', '05:00']);
  });

  test('returns single label when start === end', () => {
    const labels = hourRailLabels(8, 8);
    assert.deepEqual(labels, ['08:00']);
  });

  test('produces ascending sequence', () => {
    const labels = hourRailLabels(10, 12);
    assert.deepEqual(labels, ['10:00', '11:00', '12:00']);
  });
});
