/**
 * Iteration 15 — computeEodRecap unit tests (C-UX-3).
 *
 * Also covers the EOD_OPEN_REFLECTION handler via buildHandlers.
 *
 * AC3-1: all 5 CLOSED → recap returned with correct counts
 * AC3-2: 3 CLOSED + 1 SKIPPED + 1 DROPPED → DROPPED excluded from totals
 * AC3-3: time-passed trigger → recap returned even when 1 activity is PROPOSED
 * AC3-4: 2 IN_PROGRESS + 3 SCHEDULED + nowIso before end → null
 * AC3-5: empty activities array → null
 * AC3-6: null compositionState → null
 * AC3-9: EOD_OPEN_REFLECTION handler opens ReflectionSheet for oldest pending
 */

globalThis.__CADENCEPLAN_NO_AUTOSTART__ = true;

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  computeEodRecap,
  buildServices,
  buildHandlers,
  DEFAULT_USER
} from '../js/app.js';
import { LocalStorageMock } from './_helpers/localStorageMock.js';
import { ClockService } from '../js/services/ClockService.js';

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
function makeEnv(nowIso = '2026-04-27T17:30:00Z') {
  const storage = new LocalStorageMock();
  const clock = new ClockService({ now: () => nowIso });
  const services = buildServices({ storage, clock });
  return { storage, clock, services };
}

function stateStub() {
  return {
    route: 'today',
    params: {},
    composerLoading: false,
    infeasibleExplain: null,
    lastError: null,
    composerConfig: {
      capacityMinutes: DEFAULT_USER.dailyCapacityMinutes,
      externalMinutesToday: 0,
      activeKaizenId: null,
      availableKaizens: []
    },
    openDialog: null,
    reflectionSheet: null,
    portfolio: {
      intakeForm: null,
      expandedOpportunityId: null,
      oppFilter: 'all',
      oppSort: 'newest'
    },
    catalogView: 'list',
    baselineDialog: null,
    remeasurementDialog: null,
    closeKaizenDialog: null,
    kaizenAbandonForm: null,
    expandedKaizenId: null,
    rhythmExplainerDismissed: false,
    toast: null,
    editMode: null,
    whyPlanExpanded: false
  };
}

// ---------------------------------------------------------------------------
// Fixture activities
// ---------------------------------------------------------------------------
const ALL_CLOSED_5 = [
  { id: 'sa1', state: 'CLOSED',   plannedStartAt: '09:00', plannedDurationMinutes: 120 },
  { id: 'sa2', state: 'CLOSED',   plannedStartAt: '11:00', plannedDurationMinutes: 120 },
  { id: 'sa3', state: 'CLOSED',   plannedStartAt: '13:00', plannedDurationMinutes: 60  },
  { id: 'sa4', state: 'CLOSED',   plannedStartAt: '14:00', plannedDurationMinutes: 60  },
  { id: 'sa5', state: 'CLOSED',   plannedStartAt: '15:00', plannedDurationMinutes: 120 }
];

const MIXED_TERMINAL = [
  { id: 'sa_a', state: 'CLOSED',   plannedStartAt: '09:00', plannedDurationMinutes: 120 },
  { id: 'sa_b', state: 'CLOSED',   plannedStartAt: '11:00', plannedDurationMinutes: 120 },
  { id: 'sa_c', state: 'CLOSED',   plannedStartAt: '13:00', plannedDurationMinutes: 60  },
  { id: 'sa_d', state: 'SKIPPED',  plannedStartAt: '14:00', plannedDurationMinutes: 60  },
  { id: 'sa_e', state: 'DROPPED',  plannedStartAt: '15:00', plannedDurationMinutes: 120 }
];

// 1 PROPOSED, but nowIso (17:01 UTC) is past last activity end (17:00 UTC).
// Activities use ISO timestamps so the date comparison is unambiguous.
const TIME_PASSED_ACTS = [
  { id: 'sa_tp1', state: 'CLOSED',   plannedStartAt: '2026-04-27T09:00:00Z', plannedDurationMinutes: 240 },
  { id: 'sa_tp2', state: 'CLOSED',   plannedStartAt: '2026-04-27T14:00:00Z', plannedDurationMinutes: 60  },
  { id: 'sa_tp3', state: 'PROPOSED', plannedStartAt: '2026-04-27T16:00:00Z', plannedDurationMinutes: 60  }
  // last end = 17:00 UTC
];

const NOT_TRIGGERED_ACTS = [
  { id: 'sa_nt1', state: 'IN_PROGRESS', plannedStartAt: '09:00', plannedDurationMinutes: 120 },
  { id: 'sa_nt2', state: 'SCHEDULED',   plannedStartAt: '11:00', plannedDurationMinutes: 120 },
  { id: 'sa_nt3', state: 'SCHEDULED',   plannedStartAt: '13:00', plannedDurationMinutes: 60  },
  { id: 'sa_nt4', state: 'SCHEDULED',   plannedStartAt: '14:00', plannedDurationMinutes: 60  },
  { id: 'sa_nt5', state: 'SCHEDULED',   plannedStartAt: '15:00', plannedDurationMinutes: 120 }
  // last end = 17:00 UTC for HH:MM + date prefix, but nowIso = 09:30 → not triggered
];

// ---------------------------------------------------------------------------
// computeEodRecap — basic null conditions
// ---------------------------------------------------------------------------
describe('computeEodRecap — null conditions', () => {
  test('returns null for empty activities array (AC3-5)', () => {
    assert.equal(computeEodRecap('ACCEPTED', [], '2026-04-27T17:30:00Z', 0), null);
  });

  test('returns null for null activities (AC3-5)', () => {
    assert.equal(computeEodRecap('ACCEPTED', null, '2026-04-27T17:30:00Z', 0), null);
  });

  test('returns null when compositionState is null (AC3-6)', () => {
    assert.equal(computeEodRecap(null, ALL_CLOSED_5, '2026-04-27T17:30:00Z', 0), null);
  });

  test('returns null when compositionState is ACTIVE (ineligible state)', () => {
    assert.equal(computeEodRecap('ACTIVE', ALL_CLOSED_5, '2026-04-27T17:30:00Z', 0), null);
  });

  test('returns null when compositionState is REJECTED', () => {
    assert.equal(computeEodRecap('REJECTED', ALL_CLOSED_5, '2026-04-27T17:30:00Z', 0), null);
  });
});

// ---------------------------------------------------------------------------
// AC3-1: all 5 CLOSED — "all terminal" trigger
// ---------------------------------------------------------------------------
describe('computeEodRecap — AC3-1: all 5 CLOSED', () => {
  const recap = computeEodRecap('ACCEPTED', ALL_CLOSED_5, '2026-04-27T17:30:00Z', 0);

  test('returns non-null object', () => {
    assert.notEqual(recap, null, 'Expected a recap object');
  });

  test('closedCount === 5', () => {
    assert.equal(recap.closedCount, 5);
  });

  test('totalCount === 5', () => {
    assert.equal(recap.totalCount, 5);
  });

  test('skippedCount === 0', () => {
    assert.equal(recap.skippedCount, 0);
  });

  test('pendingReflectionCount threaded through correctly', () => {
    const r = computeEodRecap('ACCEPTED', ALL_CLOSED_5, '2026-04-27T17:30:00Z', 3);
    assert.equal(r.pendingReflectionCount, 3);
  });
});

// ---------------------------------------------------------------------------
// AC3-2: 3 CLOSED + 1 SKIPPED + 1 DROPPED — DROPPED excluded
// ---------------------------------------------------------------------------
describe('computeEodRecap — AC3-2: DROPPED excluded', () => {
  const recap = computeEodRecap('ACCEPTED', MIXED_TERMINAL, '2026-04-27T17:30:00Z', 0);

  test('returns non-null object', () => {
    assert.notEqual(recap, null);
  });

  test('closedCount === 3', () => {
    assert.equal(recap.closedCount, 3);
  });

  test('totalCount === 4 (DROPPED excluded)', () => {
    assert.equal(recap.totalCount, 4);
  });

  test('skippedCount === 1', () => {
    assert.equal(recap.skippedCount, 1);
  });
});

// ---------------------------------------------------------------------------
// AC3-3: time-passed trigger — 1 PROPOSED but nowIso past lastActivityEnd
// ---------------------------------------------------------------------------
describe('computeEodRecap — AC3-3: time-passed trigger', () => {
  // lastActivityEnd = 17:00 UTC; nowIso = 17:01 UTC
  const recap = computeEodRecap('PROPOSED', TIME_PASSED_ACTS, '2026-04-27T17:01:00Z', 0);

  test('returns non-null object (time-passed trigger fires)', () => {
    assert.notEqual(recap, null, 'Expected strip to trigger when nowIso >= lastActivityEnd');
  });

  test('closedCount === 2 (the two CLOSED activities)', () => {
    assert.equal(recap.closedCount, 2);
  });

  test('totalCount === 3 (no DROPPED; all 3 count)', () => {
    assert.equal(recap.totalCount, 3);
  });
});

// ---------------------------------------------------------------------------
// AC3-3 negative: nowIso exactly at lastActivityEnd (boundary — must trigger)
// ---------------------------------------------------------------------------
describe('computeEodRecap — AC3-3: boundary (nowIso === lastActivityEnd)', () => {
  // lastActivityEnd = 2026-04-27T17:00:00Z; nowIso = same
  const recap = computeEodRecap('PROPOSED', TIME_PASSED_ACTS, '2026-04-27T17:00:00Z', 0);

  test('triggers at nowIso === lastActivityEndIso', () => {
    assert.notEqual(recap, null, 'nowIso >= lastActivityEnd should trigger (>=, not >)');
  });
});

// ---------------------------------------------------------------------------
// AC3-4: NOT triggered — IN_PROGRESS + SCHEDULED, nowIso well before end
// ---------------------------------------------------------------------------
describe('computeEodRecap — AC3-4: NOT triggered', () => {
  // HH:MM activities; nowIso = 09:30 UTC on 2026-04-27 — last end is 17:00
  const recap = computeEodRecap('ACCEPTED', NOT_TRIGGERED_ACTS, '2026-04-27T09:30:00Z', 0);

  test('returns null when neither condition holds', () => {
    assert.equal(recap, null, 'Expected null — day is not done yet');
  });
});

// ---------------------------------------------------------------------------
// PROPOSED / EDITED state eligibility
// ---------------------------------------------------------------------------
describe('computeEodRecap — eligible states', () => {
  test('PROPOSED state is eligible', () => {
    const r = computeEodRecap('PROPOSED', ALL_CLOSED_5, '2026-04-27T17:30:00Z', 0);
    assert.notEqual(r, null);
  });

  test('EDITED state is eligible', () => {
    const r = computeEodRecap('EDITED', ALL_CLOSED_5, '2026-04-27T17:30:00Z', 0);
    assert.notEqual(r, null);
  });
});

// ---------------------------------------------------------------------------
// AC3-9: EOD_OPEN_REFLECTION handler opens ReflectionSheet for oldest pending
// ---------------------------------------------------------------------------
describe('EOD_OPEN_REFLECTION handler (AC3-9)', () => {
  test('no-op when no pending reflections', () => {
    const { services } = makeEnv();
    const state = stateStub();
    let rerenderCalled = false;
    const handlers = buildHandlers({ services, state, rerender: () => { rerenderCalled = true; } });

    handlers.EOD_OPEN_REFLECTION({});
    assert.equal(state.reflectionSheet, null, 'state.reflectionSheet must stay null when no pending');
    assert.equal(rerenderCalled, false, 'rerender must not be called with no pending');
  });

  test('opens reflectionSheet for oldest pending reflection when one exists', () => {
    const { services } = makeEnv();
    const state = stateStub();

    // Stub a pending reflection directly via the repo so we can test the handler
    // without needing a full activity → close flow.
    const reflectionId = 'ref_eod_test_001';
    const reflections = {
      [reflectionId]: {
        id: reflectionId,
        pending: true,
        createdAt: '2026-04-27T15:00:00Z',
        scheduledActivityId: null,
        planVsActualMinutes: 0
      }
    };
    services.repo.write('bamx:v1:reflections', reflections);

    let rerenderCalled = false;
    const handlers = buildHandlers({ services, state, rerender: () => { rerenderCalled = true; } });

    handlers.EOD_OPEN_REFLECTION({});

    assert.notEqual(state.reflectionSheet, null, 'reflectionSheet must be set after handler');
    assert.equal(state.reflectionSheet.reflectionId, reflectionId);
    assert.equal(rerenderCalled, true, 'rerender must be called');
  });

  test('opens oldest reflection when multiple pending exist', () => {
    const { services } = makeEnv();
    const state = stateStub();

    const newer = {
      id: 'ref_newer',
      pending: true,
      createdAt: '2026-04-27T16:00:00Z',
      scheduledActivityId: null,
      planVsActualMinutes: 0
    };
    const older = {
      id: 'ref_older',
      pending: true,
      createdAt: '2026-04-27T14:00:00Z',
      scheduledActivityId: null,
      planVsActualMinutes: 0
    };
    services.repo.write('bamx:v1:reflections', {
      [newer.id]: newer,
      [older.id]: older
    });

    const handlers = buildHandlers({ services, state, rerender: () => {} });
    handlers.EOD_OPEN_REFLECTION({});

    assert.equal(
      state.reflectionSheet.reflectionId,
      'ref_older',
      'Must open the oldest pending reflection'
    );
  });
});
