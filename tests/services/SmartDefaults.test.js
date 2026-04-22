/**
 * Tests for SmartDefaults (Sprint 5 P0-T2).
 *
 * Verifies defaults inference produces a valid User on first launch,
 * Monday-of-ISO-week math across sample dates, and timezone inference
 * via Intl.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  buildUserDefaults,
  ensureUser,
  mondayOfIsoWeek,
  inferTimezone,
  USERS_KEY,
  DEFAULT_DAILY_CAPACITY_MIN,
  DEFAULT_ROLE,
  DEFAULT_WORK_DAYS,
  DEFAULT_DEEP_SLICE
} from '../../js/services/SmartDefaults.js';
import { LocalStorageRepository } from '../../js/persistence/LocalStorageRepository.js';
import { LocalStorageMock } from '../_helpers/localStorageMock.js';
import { ClockService } from '../../js/services/ClockService.js';

function newRepo() {
  const storage = new LocalStorageMock();
  return { repo: new LocalStorageRepository({ storage }), storage };
}

describe('mondayOfIsoWeek', () => {
  test('Monday 2026-04-20 returns itself', () => {
    assert.equal(mondayOfIsoWeek('2026-04-20T12:00:00Z'), '2026-04-20');
  });

  test('Tuesday 2026-04-21 returns Monday 2026-04-20', () => {
    assert.equal(mondayOfIsoWeek('2026-04-21T00:00:00Z'), '2026-04-20');
  });

  test('Friday 2026-04-24 returns Monday 2026-04-20', () => {
    assert.equal(mondayOfIsoWeek('2026-04-24T09:00:00Z'), '2026-04-20');
  });

  test('Saturday 2026-04-25 returns Monday 2026-04-20', () => {
    assert.equal(mondayOfIsoWeek('2026-04-25T09:00:00Z'), '2026-04-20');
  });

  test('Sunday 2026-04-26 returns Monday 2026-04-20', () => {
    assert.equal(mondayOfIsoWeek('2026-04-26T09:00:00Z'), '2026-04-20');
  });

  test('Monday 2026-01-05 returns itself', () => {
    assert.equal(mondayOfIsoWeek('2026-01-05T00:00:00Z'), '2026-01-05');
  });

  test('Sunday 2026-01-04 returns prior Monday 2025-12-29', () => {
    assert.equal(mondayOfIsoWeek('2026-01-04T09:00:00Z'), '2025-12-29');
  });

  test('throws INVALID_DATE on unparseable input', () => {
    assert.throws(() => mondayOfIsoWeek('not-a-date'), (e) => e.name === 'INVALID_DATE');
  });
});

describe('inferTimezone', () => {
  test('returns a non-empty string', () => {
    const tz = inferTimezone();
    assert.equal(typeof tz, 'string');
    assert.ok(tz.length > 0);
  });
});

describe('buildUserDefaults', () => {
  test('returns role=[PRACTITIONER] by default', () => {
    const u = buildUserDefaults({ now: '2026-04-20T09:00:00Z' });
    assert.deepEqual(u.role, DEFAULT_ROLE.slice());
  });

  test('returns dailyCapacityMinutes=480 by default', () => {
    const u = buildUserDefaults({ now: '2026-04-20T09:00:00Z' });
    assert.equal(u.dailyCapacityMinutes, DEFAULT_DAILY_CAPACITY_MIN);
    assert.equal(u.dailyCapacityMinutes, 480);
  });

  test('returns deepSlicePreference=2x2h by default', () => {
    const u = buildUserDefaults({ now: '2026-04-20T09:00:00Z' });
    assert.equal(u.deepSlicePreference, DEFAULT_DEEP_SLICE);
    assert.equal(u.deepSlicePreference, '2x2h');
  });

  test('returns workDays=[1..5] by default', () => {
    const u = buildUserDefaults({ now: '2026-04-20T09:00:00Z' });
    assert.deepEqual(u.workDays, DEFAULT_WORK_DAYS.slice());
  });

  test('sprintAnchorDate is Monday of the ISO week', () => {
    // Tuesday 2026-04-21 → Monday 2026-04-20
    const u = buildUserDefaults({ now: '2026-04-21T14:00:00Z' });
    assert.equal(u.sprintAnchorDate, '2026-04-20');
  });

  test('timezone is set from Intl (non-empty)', () => {
    const u = buildUserDefaults({ now: '2026-04-20T09:00:00Z' });
    assert.equal(typeof u.timezone, 'string');
    assert.ok(u.timezone.length > 0);
  });

  test('createdAt equals the `now` value passed in', () => {
    const u = buildUserDefaults({ now: '2026-04-20T09:00:00Z' });
    assert.equal(u.createdAt, '2026-04-20T09:00:00Z');
  });

  test('accepts overrides', () => {
    const u = buildUserDefaults({
      now: '2026-04-20T09:00:00Z',
      overrides: {
        dailyCapacityMinutes: 360,
        timezone: 'America/New_York',
        deepSlicePreference: '4x1h',
        workDays: [2, 3, 4, 5, 6],
        role: ['FACILITATOR']
      }
    });
    assert.equal(u.dailyCapacityMinutes, 360);
    assert.equal(u.timezone, 'America/New_York');
    assert.equal(u.deepSlicePreference, '4x1h');
    assert.deepEqual(u.workDays, [2, 3, 4, 5, 6]);
    assert.deepEqual(u.role, ['FACILITATOR']);
  });

  test('throws INVALID_INPUT on missing now', () => {
    assert.throws(() => buildUserDefaults({}), (e) => e.name === 'INVALID_INPUT');
  });

  test('throws INVALID_INPUT on bad now', () => {
    assert.throws(
      () => buildUserDefaults({ now: 'nonsense' }),
      (e) => e.name === 'INVALID_INPUT'
    );
  });
});

describe('ensureUser', () => {
  test('creates a new User row with smart defaults when absent', () => {
    const { repo } = newRepo();
    const clock = new ClockService({ now: () => '2026-04-20T09:00:00Z' });
    const u = ensureUser({ repo, clock, userId: 'u_test' });
    assert.equal(u.id, 'u_test');
    assert.equal(u.dailyCapacityMinutes, 480);
    const map = repo.read(USERS_KEY);
    assert.ok(map.u_test);
  });

  test('returns the existing User row on subsequent calls', () => {
    const { repo } = newRepo();
    const clock = new ClockService({ now: () => '2026-04-20T09:00:00Z' });
    const first = ensureUser({ repo, clock, userId: 'u_test' });
    // Mutate the underlying row to prove ensureUser returns the persisted one.
    const map = repo.read(USERS_KEY);
    map.u_test.dailyCapacityMinutes = 999;
    repo.write(USERS_KEY, map);
    const second = ensureUser({ repo, clock, userId: 'u_test' });
    assert.equal(second.dailyCapacityMinutes, 999);
    assert.notEqual(second.dailyCapacityMinutes, first.dailyCapacityMinutes);
  });

  test('throws INVALID_DEPS without repo', () => {
    const clock = new ClockService();
    assert.throws(() => ensureUser({ clock }), (e) => e.name === 'INVALID_DEPS');
  });

  test('throws INVALID_DEPS without clock', () => {
    const { repo } = newRepo();
    assert.throws(() => ensureUser({ repo }), (e) => e.name === 'INVALID_DEPS');
  });

  test('idempotent — calling twice produces the same row', () => {
    const { repo } = newRepo();
    const clock = new ClockService({ now: () => '2026-04-20T09:00:00Z' });
    const a = ensureUser({ repo, clock, userId: 'u_same' });
    const b = ensureUser({ repo, clock, userId: 'u_same' });
    assert.deepEqual(a, b);
  });

  test('name + email propagate to new row', () => {
    const { repo } = newRepo();
    const clock = new ClockService({ now: () => '2026-04-20T09:00:00Z' });
    const u = ensureUser({
      repo,
      clock,
      userId: 'u_phil',
      name: 'Phil',
      email: 'phil@mediafier.ai'
    });
    assert.equal(u.name, 'Phil');
    assert.equal(u.email, 'phil@mediafier.ai');
  });

  test('first-run happy path produces a User that passes composer shape checks', () => {
    const { repo } = newRepo();
    const clock = new ClockService({ now: () => '2026-04-20T09:00:00Z' });
    const u = ensureUser({ repo, clock });
    assert.ok(Array.isArray(u.role));
    assert.equal(typeof u.dailyCapacityMinutes, 'number');
    assert.ok(Array.isArray(u.workDays));
    assert.equal(typeof u.sprintAnchorDate, 'string');
    assert.equal(typeof u.timezone, 'string');
    assert.ok(u.deepSlicePreference === '2x2h' || u.deepSlicePreference === '4x1h');
    assert.equal(typeof u.createdAt, 'string');
  });
});
