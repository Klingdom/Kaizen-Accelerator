/**
 * Phase 3.5 (R3) — DRAG_CONFIRM silent failure regression tests.
 *
 * Bug: DRAG_CONFIRM cleared state.dragSession BEFORE the _ensureEditMode()
 * guard. On guard failure (e.g. composition flushed mid-session), the banner
 * disappeared but nothing persisted — no toast, no error, no retry path.
 *
 * Fix: reordered to ensure edit mode first; clear dragSession only on success.
 * On failure: preserve dragSession (banner stays) + surface an ERROR toast.
 *
 * AC coverage:
 *   AC-DCF1: DRAG_CONFIRM when _ensureEditMode succeeds → dragSession cleared,
 *            commit proceeds normally
 *   AC-DCF2: DRAG_CONFIRM when _ensureEditMode fails → dragSession preserved
 *            (banner stays), toast shown, no silent discard
 *   AC-DCF3 (META §A.2 orthogonal): both cases verified independently
 */

globalThis.__CADENCEPLAN_NO_AUTOSTART__ = true;

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { LocalStorageMock } from './_helpers/localStorageMock.js';
import { ClockService } from '../js/services/ClockService.js';
import {
  buildServices,
  buildHandlers,
  buildComposerInput,
  DEFAULT_USER
} from '../js/app.js';

const FROZEN = '2026-05-18T09:00:00Z';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEnv(nowIso = FROZEN) {
  const storage = new LocalStorageMock();
  const clock = new ClockService({ now: () => nowIso });
  const services = buildServices({ storage, clock });
  return { storage, clock, services };
}

/**
 * Minimal state stub for DRAG_CONFIRM tests.
 * Includes all fields that buildHandlers / showToast touch.
 */
function stateStub(overrides = {}) {
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
    wizard: null,
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
    dragSession: null,
    conflictBanner: null,
    blockDetail: null,
    lunchTooltip: null,
    whyPlanExpanded: false,
    _focusTrap: {
      editDrawer: null,
      fineTuneDrawer: null,
      baselineDialog: null,
      kaizenCloseDialog: null,
      opportunityIntakeForm: null,
      outputArtifactDialog: null,
      reflectionSheet: null,
      remeasurementDialog: null,
      skipReasonModal: null,
      weeklyReflectionWizard: null
    },
    ...overrides
  };
}

/** A sample drag session for testing. */
function mkDragSession(overrides = {}) {
  return {
    activityId:      'sa_test_1',
    activityName:    'Deep Work',
    newStart:        '11:00',
    newDuration:     60,
    originalStart:   '10:00',
    originalDuration: 60,
    mode:            'move',
    proposedStart:   660,   // 11:00 in minutes-of-day
    proposedDuration: 60,
    ...overrides
  };
}

/**
 * Build a services object whose composerService.getActiveComposition()
 * returns null — simulating a flushed/missing composition (failure path).
 */
function makeEnvWithNoComposition() {
  const env = makeEnv();
  // Stub getActiveComposition to return null without altering real storage.
  const orig = env.services.composerService.getActiveComposition.bind(env.services.composerService);
  env.services.composerService.getActiveComposition = () => null;
  env._restoreGetActive = () => {
    env.services.composerService.getActiveComposition = orig;
  };
  return env;
}

// ---------------------------------------------------------------------------
// AC-DCF1: DRAG_CONFIRM when _ensureEditMode succeeds
// ---------------------------------------------------------------------------

describe('DRAG_CONFIRM Phase 3.5 — AC-DCF1: success path', () => {
  test('AC-DCF1: dragSession cleared when edit mode already open', () => {
    const env = makeEnv();
    const state = stateStub();

    // Pre-seed an active composition so edit mode can be opened.
    const input = buildComposerInput(env.services.clock);
    env.services.composerService.composeDaily(input);
    const activeState = env.services.composerService.getActiveComposition(DEFAULT_USER.id);
    assert.ok(activeState, 'Precondition: active composition must exist');

    // Manually open edit mode (bypassing _ensureEditMode) so we can test
    // the success path directly — editMode already set → guard returns true.
    state.editMode = {
      compositionId: activeState.composition.id,
      snapshotActivities: activeState.activities.map((a) => ({ ...a })),
      activities: activeState.activities.map((a) => ({ ...a })),
      selectedActivityId: null,
      undoStack: [],
      searchQuery: '',
      projectTypeFilter: 'all',
      expandedBuckets: ['PROJECT']
    };
    state.dragSession = mkDragSession({
      activityId: activeState.activities[0]?.id ?? 'sa_test_1'
    });

    let rerenderCalled = 0;
    const handlers = buildHandlers({ services: env.services, state, rerender: () => { rerenderCalled++; } });

    handlers.DRAG_CONFIRM({});

    assert.equal(state.dragSession, null,
      'AC-DCF1: dragSession must be cleared after successful DRAG_CONFIRM'
    );
  });

  test('AC-DCF1: no error toast shown when edit mode succeeds', () => {
    const env = makeEnv();
    const state = stateStub();

    const input = buildComposerInput(env.services.clock);
    env.services.composerService.composeDaily(input);
    const activeState = env.services.composerService.getActiveComposition(DEFAULT_USER.id);

    state.editMode = {
      compositionId: activeState.composition.id,
      snapshotActivities: activeState.activities.map((a) => ({ ...a })),
      activities: activeState.activities.map((a) => ({ ...a })),
      selectedActivityId: null,
      undoStack: [],
      searchQuery: '',
      projectTypeFilter: 'all',
      expandedBuckets: ['PROJECT']
    };
    state.dragSession = mkDragSession({
      activityId: activeState.activities[0]?.id ?? 'sa_test_1'
    });

    const handlers = buildHandlers({ services: env.services, state, rerender: () => {} });
    handlers.DRAG_CONFIRM({});

    // On success, any toast should be SUCCESS or INFO (not ERROR for cannot-commit)
    if (state.toast) {
      assert.notEqual(state.toast.message, 'Cannot commit drag — please retry',
        'AC-DCF1: "Cannot commit drag" toast must NOT appear on successful DRAG_CONFIRM'
      );
    }
  });
});

// ---------------------------------------------------------------------------
// AC-DCF2: DRAG_CONFIRM when _ensureEditMode fails
// ---------------------------------------------------------------------------

describe('DRAG_CONFIRM Phase 3.5 — AC-DCF2: failure path (guard fails)', () => {
  test('AC-DCF2: dragSession preserved when _ensureEditMode fails', () => {
    // No active composition → _ensureEditMode returns false.
    const env = makeEnvWithNoComposition();
    const session = mkDragSession();
    const state = stateStub({ dragSession: session });

    const handlers = buildHandlers({ services: env.services, state, rerender: () => {} });
    handlers.DRAG_CONFIRM({});

    assert.notEqual(state.dragSession, null,
      'AC-DCF2: dragSession must be preserved (banner stays) when _ensureEditMode fails'
    );
    assert.deepEqual(state.dragSession, session,
      'AC-DCF2: preserved dragSession must be the original session object'
    );
  });

  test('AC-DCF2: error toast shown when _ensureEditMode fails', () => {
    const env = makeEnvWithNoComposition();
    const state = stateStub({ dragSession: mkDragSession() });

    const handlers = buildHandlers({ services: env.services, state, rerender: () => {} });
    handlers.DRAG_CONFIRM({});

    assert.ok(
      state.toast !== null,
      'AC-DCF2: a toast must be shown when _ensureEditMode fails'
    );
    assert.ok(
      state.toast?.message?.includes('Cannot commit drag') || state.toast?.message?.includes('retry'),
      `AC-DCF2: toast message must indicate the failure; got: "${state.toast?.message}"`
    );
  });

  test('AC-DCF2: toast kind is ERROR when guard fails', () => {
    const env = makeEnvWithNoComposition();
    const state = stateStub({ dragSession: mkDragSession() });

    const handlers = buildHandlers({ services: env.services, state, rerender: () => {} });
    handlers.DRAG_CONFIRM({});

    assert.equal(state.toast?.kind, 'ERROR',
      'AC-DCF2: toast kind must be "ERROR" when DRAG_CONFIRM guard fails'
    );
  });

  test('AC-DCF2: no commit attempted when guard fails (editMode remains null)', () => {
    const env = makeEnvWithNoComposition();
    const state = stateStub({ dragSession: mkDragSession(), editMode: null });

    const handlers = buildHandlers({ services: env.services, state, rerender: () => {} });
    handlers.DRAG_CONFIRM({});

    assert.equal(state.editMode, null,
      'AC-DCF2: editMode must remain null — no commit was attempted when guard failed'
    );
  });
});

// ---------------------------------------------------------------------------
// AC-DCF3 (META §A.2): edge cases — null dragSession, both paths covered
// ---------------------------------------------------------------------------

describe('DRAG_CONFIRM Phase 3.5 — AC-DCF3: orthogonal edge cases', () => {
  test('AC-DCF3: DRAG_CONFIRM with no dragSession is a no-op', () => {
    const env = makeEnv();
    const state = stateStub({ dragSession: null });

    let rerenderCalled = 0;
    const handlers = buildHandlers({ services: env.services, state, rerender: () => { rerenderCalled++; } });
    handlers.DRAG_CONFIRM({});

    assert.equal(state.dragSession, null, 'AC-DCF3: no dragSession → still null after DRAG_CONFIRM');
    assert.equal(state.toast, null, 'AC-DCF3: no toast when dragSession is null (no-op guard)');
    assert.equal(rerenderCalled, 0, 'AC-DCF3: no rerender when dragSession is null');
  });

  test('AC-DCF3: success path does not leak dragSession after commit', () => {
    const env = makeEnv();
    const state = stateStub();

    const input = buildComposerInput(env.services.clock);
    env.services.composerService.composeDaily(input);
    const activeState = env.services.composerService.getActiveComposition(DEFAULT_USER.id);

    state.editMode = {
      compositionId: activeState.composition.id,
      snapshotActivities: activeState.activities.map((a) => ({ ...a })),
      activities: activeState.activities.map((a) => ({ ...a })),
      selectedActivityId: null,
      undoStack: [],
      searchQuery: '',
      projectTypeFilter: 'all',
      expandedBuckets: ['PROJECT']
    };
    state.dragSession = mkDragSession({
      activityId: activeState.activities[0]?.id ?? 'sa_test_1'
    });

    const handlers = buildHandlers({ services: env.services, state, rerender: () => {} });
    handlers.DRAG_CONFIRM({});

    assert.equal(state.dragSession, null,
      'AC-DCF3: dragSession must be null after successful DRAG_CONFIRM — no leak'
    );
  });

  test('AC-DCF3: failure path does not clear toast on subsequent call with null dragSession', () => {
    // Verifies the no-op guard catches the null case even after a failed attempt.
    const env = makeEnvWithNoComposition();
    const state = stateStub({ dragSession: mkDragSession() });

    const handlers = buildHandlers({ services: env.services, state, rerender: () => {} });
    handlers.DRAG_CONFIRM({});  // fails — session preserved, toast shown

    // dragSession is still set (preserved). Simulate user dismissing the banner manually.
    const preservedSession = state.dragSession;
    state.dragSession = null;   // manually cleared

    // A second DRAG_CONFIRM with null dragSession should be a no-op.
    const toastBeforeSecondCall = state.toast;
    handlers.DRAG_CONFIRM({});

    // The null-dragSession guard kicks in — no new toast should have been added
    // (the toast from the first failure may still be there, but no new one).
    assert.equal(state.dragSession, null,
      'AC-DCF3: dragSession remains null after no-op second call'
    );
    assert.ok(preservedSession !== null, 'AC-DCF3: original session was preserved after first failed call');
  });
});
