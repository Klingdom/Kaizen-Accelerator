/**
 * Sprint 16a — tests for the shared time-format helpers.
 *
 * `formatTime` was previously inlined in
 * `js/ui/components/ScheduledActivityBlock.js`. The semantics are
 * preserved verbatim, but live in `js/ui/timeFormat.js` so the new
 * `formatTimeRange` companion can reuse the parsing.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { formatTime, formatTimeRange } from '../../js/ui/timeFormat.js';

const EN_DASH = '\u2013';

describe('formatTime — preserved semantics', () => {
  test('HH:MM passes through', () => {
    assert.equal(formatTime('09:15'), '09:15');
  });

  test('HH:MM:SS truncates', () => {
    assert.equal(formatTime('09:15:30'), '09:15');
  });

  test('ISO timestamp → HH:MM in UTC', () => {
    assert.equal(formatTime('2026-04-22T09:00:00Z'), '09:00');
  });

  test('empty / null / undefined returns empty', () => {
    assert.equal(formatTime(''), '');
    assert.equal(formatTime(null), '');
    assert.equal(formatTime(undefined), '');
  });

  test('invalid input returns empty', () => {
    assert.equal(formatTime('not-a-date'), '');
  });
});

describe('formatTimeRange — happy paths', () => {
  test('HH:MM start + 60 minutes → 09:00–10:00', () => {
    assert.equal(formatTimeRange('09:00', 60), `09:00${EN_DASH}10:00`);
  });

  test('ISO timestamp + 90 minutes → 09:00–10:30', () => {
    assert.equal(
      formatTimeRange('2026-04-22T09:00:00Z', 90),
      `09:00${EN_DASH}10:30`
    );
  });

  test('HH:MM:SS start + 45 minutes → 09:15–10:00', () => {
    assert.equal(formatTimeRange('09:15:00', 45), `09:15${EN_DASH}10:00`);
  });

  test('HH:MM start + 45 minutes → 09:15–10:00', () => {
    assert.equal(formatTimeRange('09:15', 45), `09:15${EN_DASH}10:00`);
  });

  test('hour boundary: 09:00 + 120 → 09:00–11:00', () => {
    assert.equal(formatTimeRange('09:00', 120), `09:00${EN_DASH}11:00`);
  });

  test('uses en-dash U+2013, not hyphen', () => {
    const out = formatTimeRange('09:00', 60);
    assert.ok(out.includes('\u2013'));
    assert.ok(!out.includes(' - '));
    // Plain hyphen-minus must not appear between the times.
    assert.equal(out, '09:00\u201310:00');
  });
});

describe('formatTimeRange — degenerate inputs', () => {
  test('missing start → empty string', () => {
    assert.equal(formatTimeRange(null, 60), '');
    assert.equal(formatTimeRange(undefined, 60), '');
    assert.equal(formatTimeRange('', 60), '');
  });

  test('unparseable start → empty string', () => {
    assert.equal(formatTimeRange('not-a-date', 60), '');
  });

  test('missing duration → just the start time', () => {
    assert.equal(formatTimeRange('09:00', null), '09:00');
    assert.equal(formatTimeRange('09:00', undefined), '09:00');
  });

  test('zero duration → just the start time', () => {
    assert.equal(formatTimeRange('09:00', 0), '09:00');
  });

  test('negative duration → just the start time', () => {
    assert.equal(formatTimeRange('09:00', -30), '09:00');
  });

  test('non-numeric duration → just the start time', () => {
    assert.equal(formatTimeRange('09:00', 'sixty'), '09:00');
    assert.equal(formatTimeRange('09:00', NaN), '09:00');
  });
});

describe('formatTimeRange — midnight wrap', () => {
  test('23:30 + 60 → 23:30–00:30 (wraps modulo 24h)', () => {
    assert.equal(formatTimeRange('23:30', 60), `23:30${EN_DASH}00:30`);
  });

  test('23:00 + 60 → 23:00–00:00 (top of midnight)', () => {
    assert.equal(formatTimeRange('23:00', 60), `23:00${EN_DASH}00:00`);
  });

  test('long durations wrap once (09:00 + 1500 → 10:00 next day, shown as 10:00)', () => {
    // 1500 minutes = 25h. 09:00 + 25h ≡ 10:00 next day. Modulo 24h → 10:00.
    assert.equal(formatTimeRange('09:00', 1500), `09:00${EN_DASH}10:00`);
  });
});
