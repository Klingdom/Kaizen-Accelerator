/**
 * Tests for /js/engine/pickCommFiller.js (E3-T3 step 7).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { pickCommFiller } from '../../js/engine/pickCommFiller.js';

function comm(overrides = {}) {
  return {
    id: overrides.id ?? 'cat_comm',
    activityNumber: overrides.activityNumber ?? null,
    name: overrides.name ?? 'Comm',
    bucket: 'COMMUNICATION',
    enabledByUser: true,
    isNonOptional: false,
    appliesToRoles: ['PRACTITIONER'],
    defaultDurationMinutes: overrides.defaultDurationMinutes ?? 30,
    dependsOn: [],
    ...overrides
  };
}

describe('pickCommFiller — 1:1 on Wed/Thu', () => {
  test('Wednesday (2026-04-22) picks 1:1 (#16) at priority 70', () => {
    const oneOnOne = comm({
      id: 'cat_16_connecting',
      activityNumber: 16,
      name: 'Connecting w/ teammates',
      defaultDurationMinutes: 20
    });
    const team = comm({
      id: 'cat_15_team_meetings',
      activityNumber: 15,
      name: 'High-value team meetings',
      defaultDurationMinutes: 45
    });
    const generic = comm({ id: 'gen_value_added_communication', defaultDurationMinutes: 30 });
    const input = {
      date: '2026-04-22', // Wed
      role: ['PRACTITIONER'],
      catalog: [generic, team, oneOnOne]
    };
    const pick = pickCommFiller(input, [], 60);
    assert.equal(pick.entry.id, 'cat_16_connecting');
    assert.equal(pick.priority, 70);
  });

  test('Thursday (2026-04-23) also picks 1:1', () => {
    const oneOnOne = comm({
      id: 'cat_16_connecting',
      activityNumber: 16,
      name: 'Connecting w/ teammates',
      defaultDurationMinutes: 20
    });
    const input = { date: '2026-04-23', role: ['PRACTITIONER'], catalog: [oneOnOne] };
    const pick = pickCommFiller(input, [], 60);
    assert.equal(pick.priority, 70);
  });
});

describe('pickCommFiller — team meeting on other weekdays', () => {
  test('Tuesday picks team meeting (#15)', () => {
    const team = comm({
      id: 'cat_15_team_meetings',
      activityNumber: 15,
      name: 'High-value team meetings',
      defaultDurationMinutes: 45
    });
    const generic = comm({ id: 'gen_value_added_communication', defaultDurationMinutes: 30 });
    const input = { date: '2026-04-21', role: ['PRACTITIONER'], catalog: [generic, team] };
    const pick = pickCommFiller(input, [], 60);
    assert.equal(pick.entry.id, 'cat_15_team_meetings');
    assert.equal(pick.priority, 50);
  });
});

describe('pickCommFiller — generic fallback', () => {
  test('Wednesday without a named 1:1 falls back to generic', () => {
    const generic = comm({ id: 'gen_value_added_communication', defaultDurationMinutes: 30 });
    const input = { date: '2026-04-22', role: ['PRACTITIONER'], catalog: [generic] };
    const pick = pickCommFiller(input, [], 60);
    assert.equal(pick.entry.id, 'gen_value_added_communication');
    assert.equal(pick.priority, 10);
  });
});

describe('pickCommFiller — deterministic tiebreak', () => {
  test('when two candidates tie at priority 50, id ASC wins', () => {
    const a = comm({
      id: 'a_15_team',
      activityNumber: 15,
      name: 'High-value team meetings',
      defaultDurationMinutes: 30
    });
    const b = comm({
      id: 'b_15_team',
      activityNumber: 15,
      name: 'High-value team meetings',
      defaultDurationMinutes: 30
    });
    const input = { date: '2026-04-21', role: ['PRACTITIONER'], catalog: [b, a] };
    const pick = pickCommFiller(input, [], 60);
    assert.equal(pick.entry.id, 'a_15_team');
  });
});

describe('pickCommFiller — exclusions', () => {
  test('returns null when remainingComm = 0', () => {
    const input = { date: '2026-04-21', role: ['PRACTITIONER'], catalog: [comm({})] };
    assert.equal(pickCommFiller(input, [], 0), null);
  });

  test('excludes already-placed entries', () => {
    const team = comm({ activityNumber: 15, id: 'team_1', name: 'High-value team meetings' });
    const input = { date: '2026-04-21', role: ['PRACTITIONER'], catalog: [team] };
    const placed = [{ catalogEntryId: 'team_1' }];
    assert.equal(pickCommFiller(input, placed, 60), null);
  });

  test('excludes entries < 15 min atomic block', () => {
    const tiny = comm({ id: 'tiny', activityNumber: 15, name: 'High-value team meetings', defaultDurationMinutes: 10 });
    const input = { date: '2026-04-21', role: ['PRACTITIONER'], catalog: [tiny] };
    assert.equal(pickCommFiller(input, [], 60), null);
  });

  test('role gate — leader-only entry excluded for practitioner', () => {
    const leader = comm({ id: 'leader', activityNumber: 15, name: 'High-value team meetings', appliesToRoles: ['LEADER'] });
    const input = { date: '2026-04-21', role: ['PRACTITIONER'], catalog: [leader] };
    assert.equal(pickCommFiller(input, [], 60), null);
  });
});
