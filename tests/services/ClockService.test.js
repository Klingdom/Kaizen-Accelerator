/**
 * Tests for ClockService (Sprint 4 handoff).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { ClockService } from '../../js/services/ClockService.js';

describe('ClockService — real clock (no injection)', () => {
  test('now() returns a valid ISO string', () => {
    const clock = new ClockService();
    const iso = clock.now();
    assert.equal(typeof iso, 'string');
    // ISO 8601 sanity: YYYY-MM-DDTHH:MM:SS(.sss)Z
    assert.match(iso, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/);
  });

  test('now() parseable as Date', () => {
    const clock = new ClockService();
    const d = new Date(clock.now());
    assert.ok(!Number.isNaN(d.getTime()));
  });

  test('nowDate() returns a Date instance', () => {
    const clock = new ClockService();
    const d = clock.nowDate();
    assert.ok(d instanceof Date);
    assert.ok(!Number.isNaN(d.getTime()));
  });

  test('isFrozen() returns false for real clock', () => {
    const clock = new ClockService();
    assert.equal(clock.isFrozen(), false);
  });

  test('two consecutive now() calls return monotonic (non-decreasing) ISO strings', () => {
    const clock = new ClockService();
    const a = clock.now();
    const b = clock.now();
    assert.ok(b >= a, `expected ${b} >= ${a}`);
  });
});

describe('ClockService — frozen clock (injected)', () => {
  test('now() returns the injected ISO string verbatim', () => {
    const frozen = '2026-04-20T09:00:00Z';
    const clock = new ClockService({ now: () => frozen });
    assert.equal(clock.now(), frozen);
  });

  test('two consecutive now() calls return the same ISO string', () => {
    const clock = new ClockService({ now: () => '2026-04-20T09:00:00Z' });
    assert.equal(clock.now(), clock.now());
  });

  test('accepts a Date-returning factory and converts to ISO', () => {
    const d = new Date('2026-04-20T09:00:00Z');
    const clock = new ClockService({ now: () => d });
    assert.equal(clock.now(), d.toISOString());
  });

  test('isFrozen() returns true when factory injected', () => {
    const clock = new ClockService({ now: () => '2026-04-20T09:00:00Z' });
    assert.equal(clock.isFrozen(), true);
  });

  test('nowDate() parses frozen string to a Date', () => {
    const frozen = '2026-04-20T09:00:00.000Z';
    const clock = new ClockService({ now: () => frozen });
    const d = clock.nowDate();
    assert.equal(d.toISOString(), frozen);
  });

  test('factory can return different values over time (simulate tick)', () => {
    let t = 0;
    const ticks = ['2026-04-20T09:00:00Z', '2026-04-20T09:00:01Z'];
    const clock = new ClockService({ now: () => ticks[t++] ?? ticks[ticks.length - 1] });
    assert.equal(clock.now(), '2026-04-20T09:00:00Z');
    assert.equal(clock.now(), '2026-04-20T09:00:01Z');
  });
});

describe('ClockService — validation', () => {
  test('non-function `now` option throws INVALID_CLOCK', () => {
    assert.throws(
      () => new ClockService({ now: 'not a function' }),
      /INVALID_CLOCK/
    );
  });

  test('non-string/non-Date return value throws INVALID_CLOCK_VALUE', () => {
    const clock = new ClockService({ now: () => 12345 });
    assert.throws(() => clock.now(), /INVALID_CLOCK_VALUE/);
  });

  test('empty string return throws INVALID_CLOCK_VALUE', () => {
    const clock = new ClockService({ now: () => '' });
    assert.throws(() => clock.now(), /INVALID_CLOCK_VALUE/);
  });

  test('null `now` option is treated as absent (real clock)', () => {
    const clock = new ClockService({ now: undefined });
    assert.equal(clock.isFrozen(), false);
  });

  test('empty options object works (real clock)', () => {
    const clock = new ClockService({});
    assert.equal(typeof clock.now(), 'string');
  });

  test('no options arg works (real clock)', () => {
    const clock = new ClockService();
    assert.equal(typeof clock.now(), 'string');
  });
});
