/**
 * Phase 2C (R3) — Modal mutual-exclusion regression tests.
 *
 * AC-MX1: EOD_OPEN_REFLECTION clears state.blockDetail before opening
 *         the reflection sheet (no double-overlay on EoAR Start Reflection).
 * AC-MX2: OPEN_BLOCK_DETAIL is a no-op when state.dragSession is non-null
 *         (drag-confirm banner must be resolved first; no state mutation,
 *         no rerender call).
 * AC-MX3: OPEN_BLOCK_DETAIL proceeds normally when state.dragSession is null.
 * AC-MX4 (META §A.2 orthogonal): All three cases verified with explicit
 *         fixture setup; no shared mutation between cases.
 *
 * Convergent findings from UX_TODAY_REVIEW_R3_DELTA.md §3.3 (2/3 lenses):
 *   - FE flagged EOD_OPEN_REFLECTION → state.blockDetail not cleared (§1-F)
 *   - QA flagged OPEN_BLOCK_DETAIL + DRAG_CONFIRM banner co-existence (Risk 3)
 */

globalThis.__CADENCEPLAN_NO_AUTOSTART__ = true;

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  buildServices,
  buildHandlers,
  DEFAULT_USER
} from '../js/app.js';
import { LocalStorageMock } from './_helpers/localStorageMock.js';
import { ClockService } from '../js/services/ClockService.js';

// ---------------------------------------------------------------------------
// Test environment helpers
// ---------------------------------------------------------------------------

const FROZEN_NOW = '2026-04-27T17:30:00Z';

function makeEnv(nowIso = FROZEN_NOW) {
  const storage = new LocalStorageMock();
  const clock = new ClockService({ now: () => nowIso });
  const services = buildServices({ storage, clock });
  return { storage, clock, services };
}

/**
 * Minimal state stub with all fields that the handlers under test read or write.
 * Each test gets its own fresh copy via makeState() to prevent cross-case mutation.
 */
function makeState(overrides = {}) {
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
    blockDetail: null,
    dragSession: null,
    lunchTooltip: null,
    catalogPickerDialog: null,
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
    whyPlanExpanded: false,
    ...overrides
  };
}

/**
 * Stub a pending reflection in the repo so EOD_OPEN_REFLECTION has
 * something to open. Returns the reflection id.
 */
function stubPendingReflection(services) {
  const reflectionId = 'ref_mx_test_001';
  services.repo.write('bamx:v1:reflections', {
    [reflectionId]: {
      id: reflectionId,
      pending: true,
      createdAt: '2026-04-27T15:00:00Z',
      scheduledActivityId: null,
      planVsActualMinutes: 0
    }
  });
  return reflectionId;
}

/** Minimal dragSession fixture matching the shape in state.js / app.js:2086. */
const DRAG_SESSION_FIXTURE = {
  activityId:       'sa_drag_001',
  activityName:     'Deep Work',
  newStart:         '10:00',
  newDuration:      90,
  originalStart:    '09:00',
  originalDuration: 60,
  mode:             'move'
};

// ---------------------------------------------------------------------------
// AC-MX1: EOD_OPEN_REFLECTION clears state.blockDetail before opening sheet
// ---------------------------------------------------------------------------

describe('AC-MX1: EOD_OPEN_REFLECTION clears blockDetail before opening sheet', () => {
  test('AC-MX1a: blockDetail is null after EOD_OPEN_REFLECTION fires with open block', () => {
    const { services } = makeEnv();
    stubPendingReflection(services);

    // Simulate the double-overlay sequence: BlockDetailDialog was open before
    // the user clicked "Start Reflection" inside it.
    const state = makeState({
      blockDetail: { activityId: 'sa_eod_001' }
    });

    let rerenderCalls = 0;
    const handlers = buildHandlers({
      services,
      state,
      rerender: () => { rerenderCalls += 1; }
    });

    handlers.EOD_OPEN_REFLECTION({});

    assert.equal(
      state.blockDetail,
      null,
      'AC-MX1a: blockDetail must be null after EOD_OPEN_REFLECTION (mutual-exclusion guard)'
    );
  });

  test('AC-MX1b: reflectionSheet is populated after EOD_OPEN_REFLECTION fires', () => {
    const { services } = makeEnv();
    const reflectionId = stubPendingReflection(services);

    const state = makeState({
      blockDetail: { activityId: 'sa_eod_002' }
    });

    const handlers = buildHandlers({ services, state, rerender: () => {} });
    handlers.EOD_OPEN_REFLECTION({});

    assert.notEqual(
      state.reflectionSheet,
      null,
      'AC-MX1b: reflectionSheet must be set after EOD_OPEN_REFLECTION'
    );
    assert.equal(
      state.reflectionSheet.reflectionId,
      reflectionId,
      'AC-MX1b: reflectionSheet must reference the pending reflection'
    );
  });

  test('AC-MX1c (orthogonal): blockDetail stays null when it was already null before handler', () => {
    const { services } = makeEnv();
    stubPendingReflection(services);

    // blockDetail was already null — guard must not break anything
    const state = makeState({ blockDetail: null });

    const handlers = buildHandlers({ services, state, rerender: () => {} });
    handlers.EOD_OPEN_REFLECTION({});

    assert.equal(
      state.blockDetail,
      null,
      'AC-MX1c: blockDetail must remain null when already null (idempotent guard)'
    );
    assert.notEqual(state.reflectionSheet, null, 'AC-MX1c: reflectionSheet still opened');
  });
});

// ---------------------------------------------------------------------------
// AC-MX2: OPEN_BLOCK_DETAIL is a no-op when dragSession is non-null
// ---------------------------------------------------------------------------

describe('AC-MX2: OPEN_BLOCK_DETAIL no-op when dragSession is non-null', () => {
  test('AC-MX2a: blockDetail stays null when dragSession is set', () => {
    const { services } = makeEnv();
    const state = makeState({
      blockDetail: null,
      dragSession: DRAG_SESSION_FIXTURE
    });

    let rerenderCalls = 0;
    const handlers = buildHandlers({
      services,
      state,
      rerender: () => { rerenderCalls += 1; }
    });

    handlers.OPEN_BLOCK_DETAIL({ activityId: 'sa_block_001' });

    assert.equal(
      state.blockDetail,
      null,
      'AC-MX2a: blockDetail must remain null when drag-confirm banner is active'
    );
  });

  test('AC-MX2b: rerender is NOT called when dragSession blocks OPEN_BLOCK_DETAIL', () => {
    const { services } = makeEnv();
    const state = makeState({
      blockDetail: null,
      dragSession: DRAG_SESSION_FIXTURE
    });

    let rerenderCalls = 0;
    const handlers = buildHandlers({
      services,
      state,
      rerender: () => { rerenderCalls += 1; }
    });

    handlers.OPEN_BLOCK_DETAIL({ activityId: 'sa_block_002' });

    assert.equal(
      rerenderCalls,
      0,
      'AC-MX2b: rerender must not be called when OPEN_BLOCK_DETAIL is blocked by dragSession'
    );
  });

  test('AC-MX2c: dragSession remains unchanged after blocked OPEN_BLOCK_DETAIL', () => {
    const { services } = makeEnv();
    const state = makeState({
      blockDetail: null,
      dragSession: { ...DRAG_SESSION_FIXTURE }
    });

    const handlers = buildHandlers({ services, state, rerender: () => {} });
    handlers.OPEN_BLOCK_DETAIL({ activityId: 'sa_block_003' });

    assert.equal(
      state.dragSession.activityId,
      DRAG_SESSION_FIXTURE.activityId,
      'AC-MX2c: dragSession must not be mutated by blocked OPEN_BLOCK_DETAIL'
    );
  });
});

// ---------------------------------------------------------------------------
// AC-MX3: OPEN_BLOCK_DETAIL proceeds normally when dragSession is null
// ---------------------------------------------------------------------------

describe('AC-MX3: OPEN_BLOCK_DETAIL proceeds normally when dragSession is null', () => {
  test('AC-MX3a: blockDetail is set when dragSession is null', () => {
    const { services } = makeEnv();
    const state = makeState({
      blockDetail: null,
      dragSession: null
    });

    let rerenderCalls = 0;
    const handlers = buildHandlers({
      services,
      state,
      rerender: () => { rerenderCalls += 1; }
    });

    handlers.OPEN_BLOCK_DETAIL({ activityId: 'sa_normal_001' });

    assert.deepEqual(
      state.blockDetail,
      { activityId: 'sa_normal_001' },
      'AC-MX3a: blockDetail must be set when no dragSession is active'
    );
  });

  test('AC-MX3b: rerender IS called when OPEN_BLOCK_DETAIL succeeds (no dragSession)', () => {
    const { services } = makeEnv();
    const state = makeState({
      blockDetail: null,
      dragSession: null
    });

    let rerenderCalls = 0;
    const handlers = buildHandlers({
      services,
      state,
      rerender: () => { rerenderCalls += 1; }
    });

    handlers.OPEN_BLOCK_DETAIL({ activityId: 'sa_normal_002' });

    assert.equal(
      rerenderCalls,
      1,
      'AC-MX3b: rerender must be called exactly once when OPEN_BLOCK_DETAIL succeeds'
    );
  });

  test('AC-MX3c: null payload is still rejected (guard unchanged)', () => {
    const { services } = makeEnv();
    const state = makeState({ blockDetail: null, dragSession: null });

    let rerenderCalls = 0;
    const handlers = buildHandlers({
      services,
      state,
      rerender: () => { rerenderCalls += 1; }
    });

    handlers.OPEN_BLOCK_DETAIL(null);

    assert.equal(state.blockDetail, null, 'AC-MX3c: null payload must be rejected');
    assert.equal(rerenderCalls, 0, 'AC-MX3c: no rerender on null payload');
  });
});

// ---------------------------------------------------------------------------
// AC-MX4 (META §A.2 orthogonal): Confirm state isolation between test cases
// ---------------------------------------------------------------------------

describe('AC-MX4 (META §A.2): state isolation — each case uses independent fixtures', () => {
  test('AC-MX4a: MX2 state does not bleed into MX3 (fresh makeState per case)', () => {
    const { services: sA } = makeEnv();
    const stateA = makeState({ dragSession: DRAG_SESSION_FIXTURE });
    const handlerA = buildHandlers({ services: sA, state: stateA, rerender: () => {} });
    handlerA.OPEN_BLOCK_DETAIL({ activityId: 'sa_isolation_001' });
    // stateA.blockDetail should still be null (blocked)

    const { services: sB } = makeEnv();
    const stateB = makeState({ dragSession: null });
    const handlerB = buildHandlers({ services: sB, state: stateB, rerender: () => {} });
    handlerB.OPEN_BLOCK_DETAIL({ activityId: 'sa_isolation_002' });
    // stateB.blockDetail should be set (no block)

    assert.equal(
      stateA.blockDetail,
      null,
      'AC-MX4a: stateA (with dragSession) must have blockDetail=null'
    );
    assert.deepEqual(
      stateB.blockDetail,
      { activityId: 'sa_isolation_002' },
      'AC-MX4a: stateB (no dragSession) must have blockDetail set'
    );
  });

  test('AC-MX4b: MX1 blockDetail clear does not affect a separate state instance', () => {
    const { services: sA } = makeEnv();
    stubPendingReflection(sA);
    const stateA = makeState({ blockDetail: { activityId: 'sa_iso_a' } });
    const handlerA = buildHandlers({ services: sA, state: stateA, rerender: () => {} });
    handlerA.EOD_OPEN_REFLECTION({});

    const { services: sB } = makeEnv();
    // stateB has a blockDetail that should NOT be touched by stateA's handler
    const stateB = makeState({ blockDetail: { activityId: 'sa_iso_b' } });

    assert.equal(stateA.blockDetail, null, 'AC-MX4b: stateA blockDetail cleared by its handler');
    assert.deepEqual(
      stateB.blockDetail,
      { activityId: 'sa_iso_b' },
      'AC-MX4b: stateB blockDetail untouched — fully independent state object'
    );
  });
});
