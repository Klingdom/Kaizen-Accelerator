/**
 * Sprint 13 Pass 13c — EDIT_CHANGE_DURATION handler + arrow-key cycling.
 */

globalThis.__CADENCEPLAN_NO_AUTOSTART__ = true;

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { LocalStorageMock } from './_helpers/localStorageMock.js';
import { ClockService } from '../js/services/ClockService.js';
import {
  buildServices,
  buildHandlers,
  handleDurationArrowKey,
  DEFAULT_USER
} from '../js/app.js';
import { COMPOSITIONS_KEY } from '../js/services/ComposerService.js';

const FROZEN = '2026-04-22T10:00:00Z';

function makeEnv(nowIso = FROZEN) {
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
    fineTune: {
      open: false,
      capacityMinutes: DEFAULT_USER.dailyCapacityMinutes,
      externalMinutesToday: 0,
      activeKaizenId: null,
      availableKaizens: [],
      _snapshotBeforeChange: null
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
    editMode: null
  };
}

function seedAndBuildHandlers() {
  const env = makeEnv();
  const state = stateStub();
  let rerenderCalls = 0;
  const rerender = () => { rerenderCalls += 1; };
  const handlers = buildHandlers({ services: env.services, state, rerender });
  handlers.AUTO_PLAN({});
  const comps = env.services.repo.read(COMPOSITIONS_KEY);
  const compId = Object.keys(comps)[0];
  return { env, state, handlers, compId, rerenderCount: () => rerenderCalls };
}

function pickNonProtectedTarget(state) {
  return state.editMode.activities.find(
    (a) =>
      a.bucket === 'PROJECT' &&
      !a.carriedOver &&
      a.catalogEntryId !== 'cer_daily_standup' &&
      a.catalogEntryId !== 'gen_end_of_activity_reflection' &&
      a.strategic !== true
  );
}

describe('Sprint 13 — EDIT_CHANGE_DURATION handler', () => {
  test('updates the selected slot and pushes an undo snapshot', () => {
    const { state, handlers, compId } = seedAndBuildHandlers();
    handlers.EDIT({ compositionId: compId });
    const target = pickNonProtectedTarget(state);
    assert.ok(target, 'no non-protected target');
    const oldDuration = target.plannedDurationMinutes;
    // Pick a value different from the current one.
    const next = [15, 30, 45, 60, 75, 90].find((m) => m !== oldDuration);
    handlers.EDIT_CHANGE_DURATION({ activityId: target.id, minutes: next });
    const updated = state.editMode.activities.find((a) => a.id === target.id);
    assert.equal(updated.plannedDurationMinutes, next);
    assert.equal(state.editMode.undoStack.length, 1);
    assert.ok(state.toast);
    assert.match(state.toast.message, /Duration: \d+m → \d+m/);
  });

  test('success toast reports old → new', () => {
    const { state, handlers, compId } = seedAndBuildHandlers();
    handlers.EDIT({ compositionId: compId });
    const target = pickNonProtectedTarget(state);
    const old = target.plannedDurationMinutes;
    const next = [15, 30, 45, 60, 75, 90].find((m) => m !== old);
    handlers.EDIT_CHANGE_DURATION({ activityId: target.id, minutes: next });
    assert.match(state.toast.message, new RegExp(`Duration: ${old}m → ${next}m`));
  });

  test('protected slot rejects with an error toast + no mutation', () => {
    const { state, handlers, compId } = seedAndBuildHandlers();
    handlers.EDIT({ compositionId: compId });
    const standup = state.editMode.activities.find((a) => a.catalogEntryId === 'cer_daily_standup');
    assert.ok(standup, 'no daily standup');
    const beforeDuration = standup.plannedDurationMinutes;
    const beforeUndo = state.editMode.undoStack.length;
    handlers.EDIT_CHANGE_DURATION({ activityId: standup.id, minutes: 30 });
    const after = state.editMode.activities.find((a) => a.id === standup.id);
    assert.equal(after.plannedDurationMinutes, beforeDuration);
    assert.equal(state.editMode.undoStack.length, beforeUndo);
    assert.ok(state.toast);
    assert.match(state.toast.message, /duration is fixed/i);
  });

  test('invalid minutes (not in DURATION_OPTIONS) is a silent no-op', () => {
    const { state, handlers, compId } = seedAndBuildHandlers();
    handlers.EDIT({ compositionId: compId });
    const target = pickNonProtectedTarget(state);
    const beforeDuration = target.plannedDurationMinutes;
    state.toast = null;
    handlers.EDIT_CHANGE_DURATION({ activityId: target.id, minutes: 42 });
    const after = state.editMode.activities.find((a) => a.id === target.id);
    assert.equal(after.plannedDurationMinutes, beforeDuration);
    assert.equal(state.editMode.undoStack.length, 0);
    assert.equal(state.toast, null);
  });

  test('no-op when editMode is null', () => {
    const { state, handlers } = seedAndBuildHandlers();
    state.toast = null;
    handlers.EDIT_CHANGE_DURATION({ activityId: 'whatever', minutes: 30 });
    assert.equal(state.editMode, null);
    assert.equal(state.toast, null);
  });

  test('no-op when activityId is missing', () => {
    const { state, handlers, compId } = seedAndBuildHandlers();
    handlers.EDIT({ compositionId: compId });
    handlers.EDIT_CHANGE_DURATION({ minutes: 30 });
    assert.equal(state.editMode.undoStack.length, 0);
  });

  test('no-op when the target slot does not exist', () => {
    const { state, handlers, compId } = seedAndBuildHandlers();
    handlers.EDIT({ compositionId: compId });
    handlers.EDIT_CHANGE_DURATION({ activityId: 'not_a_real_id', minutes: 30 });
    assert.equal(state.editMode.undoStack.length, 0);
  });

  test('no-op when the new duration matches the current duration', () => {
    const { state, handlers, compId } = seedAndBuildHandlers();
    handlers.EDIT({ compositionId: compId });
    const target = pickNonProtectedTarget(state);
    state.toast = null;
    handlers.EDIT_CHANGE_DURATION({
      activityId: target.id,
      minutes: target.plannedDurationMinutes
    });
    assert.equal(state.editMode.undoStack.length, 0);
    assert.equal(state.toast, null);
  });
});

describe('Sprint 13 — EDIT_CHANGE_DURATION + EDIT_UNDO integration', () => {
  test('undo reverts a duration change', () => {
    const { state, handlers, compId } = seedAndBuildHandlers();
    handlers.EDIT({ compositionId: compId });
    const target = pickNonProtectedTarget(state);
    const old = target.plannedDurationMinutes;
    const next = [15, 30, 45, 60, 75, 90].find((m) => m !== old);
    handlers.EDIT_CHANGE_DURATION({ activityId: target.id, minutes: next });
    handlers.EDIT_UNDO({});
    const restored = state.editMode.activities.find((a) => a.id === target.id);
    assert.equal(restored.plannedDurationMinutes, old);
    assert.equal(state.editMode.undoStack.length, 0);
  });
});

describe('Sprint 13 — arrow keys navigate DURATION_OPTIONS', () => {
  function setupWithSelected() {
    const { state, handlers, compId } = seedAndBuildHandlers();
    handlers.EDIT({ compositionId: compId });
    const target = pickNonProtectedTarget(state);
    // Normalize to a known duration (60m) so we can test all four boundaries.
    handlers.EDIT_CHANGE_DURATION({ activityId: target.id, minutes: 60 });
    state.editMode.selectedActivityId = target.id;
    return { state, handlers, target };
  }

  test('ArrowRight increments from 60 → 75', () => {
    const { state, handlers, target } = setupWithSelected();
    let prevented = false;
    handleDurationArrowKey({ key: 'ArrowRight', preventDefault: () => { prevented = true; } }, state, handlers);
    const after = state.editMode.activities.find((a) => a.id === target.id);
    assert.equal(after.plannedDurationMinutes, 75);
    assert.equal(prevented, true);
  });

  test('ArrowLeft decrements from 60 → 45', () => {
    const { state, handlers, target } = setupWithSelected();
    handleDurationArrowKey({ key: 'ArrowLeft', preventDefault: () => {} }, state, handlers);
    const after = state.editMode.activities.find((a) => a.id === target.id);
    assert.equal(after.plannedDurationMinutes, 45);
  });

  test('ArrowLeft at 15 (floor) stays at 15 + no dispatch', () => {
    const { state, handlers, target } = setupWithSelected();
    handlers.EDIT_CHANGE_DURATION({ activityId: target.id, minutes: 15 });
    state.editMode.selectedActivityId = target.id;
    const beforeUndo = state.editMode.undoStack.length;
    handleDurationArrowKey({ key: 'ArrowLeft', preventDefault: () => {} }, state, handlers);
    const after = state.editMode.activities.find((a) => a.id === target.id);
    assert.equal(after.plannedDurationMinutes, 15);
    assert.equal(state.editMode.undoStack.length, beforeUndo);
  });

  test('ArrowRight at 90 (ceiling) stays at 90 + no dispatch', () => {
    const { state, handlers, target } = setupWithSelected();
    handlers.EDIT_CHANGE_DURATION({ activityId: target.id, minutes: 90 });
    state.editMode.selectedActivityId = target.id;
    const beforeUndo = state.editMode.undoStack.length;
    handleDurationArrowKey({ key: 'ArrowRight', preventDefault: () => {} }, state, handlers);
    const after = state.editMode.activities.find((a) => a.id === target.id);
    assert.equal(after.plannedDurationMinutes, 90);
    assert.equal(state.editMode.undoStack.length, beforeUndo);
  });

  test('no-op when no slot is selected', () => {
    const { state, handlers, compId } = seedAndBuildHandlers();
    handlers.EDIT({ compositionId: compId });
    state.editMode.selectedActivityId = null;
    const beforeUndo = state.editMode.undoStack.length;
    const dispatched = handleDurationArrowKey({ key: 'ArrowRight', preventDefault: () => {} }, state, handlers);
    assert.equal(dispatched, false);
    assert.equal(state.editMode.undoStack.length, beforeUndo);
  });

  test('no-op when selection is the __new__ sentinel', () => {
    const { state, handlers, compId } = seedAndBuildHandlers();
    handlers.EDIT({ compositionId: compId });
    state.editMode.selectedActivityId = '__new__';
    const dispatched = handleDurationArrowKey({ key: 'ArrowRight', preventDefault: () => {} }, state, handlers);
    assert.equal(dispatched, false);
  });

  test('no-op when the selected slot is protected', () => {
    const { state, handlers, compId } = seedAndBuildHandlers();
    handlers.EDIT({ compositionId: compId });
    const standup = state.editMode.activities.find((a) => a.catalogEntryId === 'cer_daily_standup');
    // Force-set (bypass the select guard) so we can verify the arrow handler rejects.
    state.editMode.selectedActivityId = standup.id;
    const dispatched = handleDurationArrowKey({ key: 'ArrowRight', preventDefault: () => {} }, state, handlers);
    assert.equal(dispatched, false);
  });

  test('non-arrow keys are ignored', () => {
    const { state, handlers, target } = setupWithSelected();
    const dispatched = handleDurationArrowKey({ key: 'Enter', preventDefault: () => {} }, state, handlers);
    assert.equal(dispatched, false);
    const after = state.editMode.activities.find((a) => a.id === target.id);
    assert.equal(after.plannedDurationMinutes, 60);
  });

  test('snaps a non-standard current duration (25m) to nearest option below (15) then steps', () => {
    const { state, handlers, compId } = seedAndBuildHandlers();
    handlers.EDIT({ compositionId: compId });
    const target = pickNonProtectedTarget(state);
    // Directly inject a non-canonical duration.
    target.plannedDurationMinutes = 25;
    state.editMode.selectedActivityId = target.id;
    handleDurationArrowKey({ key: 'ArrowRight', preventDefault: () => {} }, state, handlers);
    const after = state.editMode.activities.find((a) => a.id === target.id);
    // 25 snaps down to 15 (index 0), ArrowRight → 30.
    assert.equal(after.plannedDurationMinutes, 30);
  });
});
