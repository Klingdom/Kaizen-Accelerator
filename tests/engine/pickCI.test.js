/**
 * Tests for /js/engine/pickCI.js (E3-T3 step 6).
 *
 * Priority rotation per ENGINE_DESIGN §1.5.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { pickCI, ciPriority, ciReason } from '../../js/engine/pickCI.js';

function ciEntry(overrides = {}) {
  return {
    id: overrides.id ?? 'cat_x',
    activityNumber: overrides.activityNumber ?? null,
    name: overrides.name ?? 'CI Entry',
    bucket: 'CI',
    enabledByUser: true,
    isNonOptional: false,
    appliesToRoles: ['PRACTITIONER'],
    defaultDurationMinutes: overrides.defaultDurationMinutes ?? 60,
    cadence: overrides.cadence ?? 'CONTINUOUS',
    dependsOn: [],
    ...overrides
  };
}

describe('pickCI — priority 100: Document Review on signal', () => {
  test('returns Document Review when signal fires', () => {
    const docReview = ciEntry({
      id: 'cat_4_document_review',
      activityNumber: 4,
      name: 'Document Review',
      defaultDurationMinutes: 30
    });
    const sixS = ciEntry({
      id: 'cat_13_6s_email',
      activityNumber: 13,
      name: '6S Email Activity',
      defaultDurationMinutes: 30
    });
    const input = {
      date: '2026-04-21',
      role: ['PRACTITIONER'],
      catalog: [sixS, docReview],
      signals: { inboxOverThreshold: true, documentAwaitingReview: ['prfaq_1'], innovationStageReady: [] }
    };
    const pick = pickCI(input, [], 120);
    assert.ok(pick);
    assert.equal(pick.entry.id, 'cat_4_document_review');
    assert.equal(pick.priority, 100);
  });
});

describe('pickCI — priority 95: 6S Email on signal', () => {
  test('returns 6S Email when inboxOverThreshold is true (no doc review signal)', () => {
    const sixS = ciEntry({
      id: 'cat_13_6s_email',
      activityNumber: 13,
      name: '6S Email Activity',
      defaultDurationMinutes: 30
    });
    const input = {
      date: '2026-04-21',
      role: ['PRACTITIONER'],
      catalog: [sixS],
      signals: { inboxOverThreshold: true, documentAwaitingReview: [], innovationStageReady: [] }
    };
    const pick = pickCI(input, [], 120);
    assert.equal(pick.entry.id, 'cat_13_6s_email');
    assert.equal(pick.priority, 95);
  });
});

describe('pickCI — priority 80: PDCA 48h tick', () => {
  test('returns PDCA when active AND hoursSinceLastPdca >= 42', () => {
    const pdca = ciEntry({
      id: 'cat_12_pdca_cycle',
      activityNumber: 12,
      name: 'PDCA Cycle',
      cadence: 'EVERY_48H',
      defaultDurationMinutes: 30
    });
    const input = {
      _now: '2026-04-21T12:00:00Z',
      date: '2026-04-21',
      role: ['PRACTITIONER'],
      catalog: [pdca],
      pdcaExperiment: {
        state: 'DO',
        lastTickAt: '2026-04-19T12:00:00Z' // 48h ago
      },
      signals: { inboxOverThreshold: false, documentAwaitingReview: [], innovationStageReady: [] }
    };
    const pick = pickCI(input, [], 120);
    assert.equal(pick.entry.id, 'cat_12_pdca_cycle');
    assert.equal(pick.priority, 80);
  });

  test('PDCA NOT picked when hoursSinceLastPdca < 42', () => {
    const pdca = ciEntry({
      id: 'cat_12_pdca_cycle',
      activityNumber: 12,
      name: 'PDCA Cycle',
      cadence: 'EVERY_48H'
    });
    const input = {
      _now: '2026-04-21T12:00:00Z',
      date: '2026-04-21',
      role: ['PRACTITIONER'],
      catalog: [pdca],
      pdcaExperiment: {
        state: 'DO',
        lastTickAt: '2026-04-21T00:00:00Z'
      },
      signals: {}
    };
    assert.equal(ciPriority(pdca, input), 0);
  });
});

describe('pickCI — priority 60: weekly L&D tick', () => {
  test('returns Personal L&D when not yet fired this week', () => {
    const ld = ciEntry({
      id: 'cat_1_personal_ld',
      activityNumber: 1,
      name: 'Personal Learning and Development (L&D Tracker)',
      defaultDurationMinutes: 60
    });
    const input = {
      date: '2026-04-21',
      role: ['PRACTITIONER'],
      catalog: [ld],
      priorCompositions: [],
      signals: {}
    };
    const pick = pickCI(input, [], 120);
    assert.equal(pick.entry.id, 'cat_1_personal_ld');
    assert.equal(pick.priority, 60);
  });

  test('Personal L&D does NOT get priority 60 when already fired this week', () => {
    const ld = ciEntry({
      id: 'cat_1_personal_ld',
      activityNumber: 1,
      name: 'Personal Learning and Development (L&D Tracker)',
      // WEEKLY cadence — no 40-fallback contamination
      cadence: 'WEEKLY'
    });
    const input = {
      date: '2026-04-21',
      role: ['PRACTITIONER'],
      catalog: [ld],
      priorCompositions: [{ activities: [{ catalogEntryId: 'cat_1_personal_ld' }] }],
      signals: {}
    };
    // Falls through to the default 0 since cadence=WEEKLY (not CONTINUOUS/MONTHLY).
    assert.equal(ciPriority(ld, input), 0);
  });
});

describe('pickCI — priority 40: continuous/monthly fallback', () => {
  test('CONTINUOUS entry gets priority 40', () => {
    const cont = ciEntry({ id: 'cat_6_explore', cadence: 'CONTINUOUS' });
    assert.equal(ciPriority(cont, { signals: {}, date: '2026-04-21' }), 40);
  });

  test('MONTHLY entry gets priority 40', () => {
    const m = ciEntry({ id: 'cat_3_compliance', cadence: 'MONTHLY' });
    assert.equal(ciPriority(m, { signals: {}, date: '2026-04-21' }), 40);
  });
});

describe('pickCI — priority 20: Weekly Reflection Fri only', () => {
  test('Weekly Reflection gets priority 20 on Friday', () => {
    const wr = ciEntry({
      id: 'gen_weekly_reflection',
      name: 'Weekly Reflection',
      cadence: 'WEEKLY'
    });
    // 2026-04-24 is a Friday.
    assert.equal(ciPriority(wr, { signals: {}, date: '2026-04-24' }), 20);
  });

  test('Weekly Reflection priority 0 on Tuesday', () => {
    const wr = ciEntry({
      id: 'gen_weekly_reflection',
      name: 'Weekly Reflection',
      cadence: 'WEEKLY'
    });
    assert.equal(ciPriority(wr, { signals: {}, date: '2026-04-21' }), 0);
  });
});

describe('pickCI — deterministic tiebreak', () => {
  test('ties break by catalogEntry.id ASC', () => {
    const a = ciEntry({ id: 'a_continuous', cadence: 'CONTINUOUS' });
    const b = ciEntry({ id: 'b_continuous', cadence: 'CONTINUOUS' });
    const input = {
      date: '2026-04-21',
      role: ['PRACTITIONER'],
      catalog: [b, a],
      signals: {}
    };
    const pick = pickCI(input, [], 120);
    assert.equal(pick.entry.id, 'a_continuous');
  });
});

describe('pickCI — exclusions', () => {
  test('returns null when remainingCI = 0', () => {
    const ld = ciEntry({ activityNumber: 1, name: 'Personal L&D' });
    const input = { date: '2026-04-21', role: ['PRACTITIONER'], catalog: [ld], signals: {} };
    assert.equal(pickCI(input, [], 0), null);
  });

  test('excludes entries not bucket=CI', () => {
    const deep = ciEntry({ id: 'cat_18', bucket: 'PROJECT', cadence: 'CONTINUOUS' });
    const input = { date: '2026-04-21', role: ['PRACTITIONER'], catalog: [deep], signals: {} };
    assert.equal(pickCI(input, [], 120), null);
  });

  test('excludes entries not enabled by user', () => {
    const cont = ciEntry({ id: 'cat_x', cadence: 'CONTINUOUS', enabledByUser: false });
    const input = { date: '2026-04-21', role: ['PRACTITIONER'], catalog: [cont], signals: {} };
    assert.equal(pickCI(input, [], 120), null);
  });

  test('excludes already-placed entries', () => {
    const ld = ciEntry({ activityNumber: 1, id: 'ld_1', name: 'Personal L&D' });
    const input = { date: '2026-04-21', role: ['PRACTITIONER'], catalog: [ld], signals: {}, priorCompositions: [] };
    const placed = [{ catalogEntryId: 'ld_1' }];
    assert.equal(pickCI(input, placed, 120), null);
  });

  test('excludes duration > remainingCI', () => {
    const big = ciEntry({ id: 'big', cadence: 'CONTINUOUS', defaultDurationMinutes: 200 });
    const input = { date: '2026-04-21', role: ['PRACTITIONER'], catalog: [big], signals: {} };
    assert.equal(pickCI(input, [], 120), null);
  });

  test('role gate — excludes entries that do not apply to user role', () => {
    const leaderOnly = ciEntry({ id: 'leader_1', cadence: 'CONTINUOUS', appliesToRoles: ['LEADER'] });
    const input = { date: '2026-04-21', role: ['PRACTITIONER'], catalog: [leaderOnly], signals: {} };
    assert.equal(pickCI(input, [], 120), null);
  });
});

describe('pickCI — ciReason', () => {
  test('produces human-readable reasons', () => {
    const docReview = ciEntry({ activityNumber: 4, name: 'Document Review' });
    const signalInput = {
      signals: { documentAwaitingReview: ['x'], inboxOverThreshold: false, innovationStageReady: [] }
    };
    assert.ok(ciReason(docReview, signalInput).includes('documentAwaitingReview'));

    const pdca = ciEntry({ activityNumber: 12, name: 'PDCA Cycle' });
    assert.equal(
      ciReason(pdca, {
        _now: '2026-04-21T12:00:00Z',
        pdcaExperiment: { state: 'DO', lastTickAt: '2026-04-19T12:00:00Z' },
        signals: {}
      }),
      'PDCA ≥42h since last tick'
    );
  });
});
