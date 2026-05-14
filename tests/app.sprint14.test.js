/**
 * Sprint 14 Pass 14c — EDIT_CHANGE_START_TIME handler tests.
 */

globalThis.__CADENCEPLAN_NO_AUTOSTART__ = true;

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { LocalStorageMock } from './_helpers/localStorageMock.js';
import { ClockService } from '../js/services/ClockService.js';
import {
  buildServices,
  buildHandlers,
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
      a.strategic !== true &&
      a.plannedStartAt
  );
}

/**
 * Extract HH:MM from a plannedStartAt value.
 */
function toHHMM(v) {
  if (!v) return '';
  if (/^\d{2}:\d{2}$/.test(v)) return v;
  if (/^\d{2}:\d{2}:\d{2}$/.test(v)) return v.slice(0, 5);
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '';
  return (
    String(d.getUTCHours()).padStart(2, '0') +
    ':' +
    String(d.getUTCMinutes()).padStart(2, '0')
  );
}

describe('Sprint 14 — EDIT_CHANGE_START_TIME handler', () => {
  test('happy path: change start time updates the activity and pushes undo', () => {
    const { state, handlers, compId } = seedAndBuildHandlers();
    handlers.EDIT({ compositionId: compId });
    const target = pickNonProtectedTarget(state);
    assert.ok(target, 'no non-protected target with plannedStartAt');
    const oldHHMM = toHHMM(target.plannedStartAt);
    // Pick a later-than-any-prior time that still fits the day.
    // 17:30 is late enough to be after any composer-emitted prior block.
    const newValue = '17:30';
    handlers.EDIT_CHANGE_START_TIME({
      activityId: target.id,
      value: newValue
    });
    const updated = state.editMode.activities.find((a) => a.id === target.id);
    assert.equal(toHHMM(updated.plannedStartAt), newValue);
    assert.equal(state.editMode.undoStack.length, 1);
    assert.ok(state.toast);
    assert.match(state.toast.message, new RegExp(`Start time: ${oldHHMM} → ${newValue}`));
  });

  test('success toast reports old → new', () => {
    const { state, handlers, compId } = seedAndBuildHandlers();
    handlers.EDIT({ compositionId: compId });
    const target = pickNonProtectedTarget(state);
    const oldHHMM = toHHMM(target.plannedStartAt);
    handlers.EDIT_CHANGE_START_TIME({
      activityId: target.id,
      value: '17:45'
    });
    assert.match(state.toast.message, new RegExp(`Start time: ${oldHHMM} → 17:45`));
  });

  test('OVERLAPS_PRIOR shows error toast + reverts undo push', () => {
    const { state, handlers, compId } = seedAndBuildHandlers();
    handlers.EDIT({ compositionId: compId });
    const target = pickNonProtectedTarget(state);
    const beforeDuration = target.plannedStartAt;
    // Try to set the target to 00:00 — guaranteed to overlap the prior
    // block (Daily Standup at 09:00).
    handlers.EDIT_CHANGE_START_TIME({
      activityId: target.id,
      value: '00:00'
    });
    const after = state.editMode.activities.find((a) => a.id === target.id);
    assert.equal(after.plannedStartAt, beforeDuration); // unchanged
    assert.equal(state.editMode.undoStack.length, 0); // pushed then rolled back
    assert.ok(state.toast);
    assert.match(state.toast.message, /Would overlap prior block/);
    assert.match(state.toast.message, /ends \d{2}:\d{2}/);
  });

  test('protected slot rejects with an error toast + no mutation', () => {
    const { state, handlers, compId } = seedAndBuildHandlers();
    handlers.EDIT({ compositionId: compId });
    const standup = state.editMode.activities.find(
      (a) => a.catalogEntryId === 'cer_daily_standup'
    );
    assert.ok(standup);
    const before = standup.plannedStartAt;
    handlers.EDIT_CHANGE_START_TIME({
      activityId: standup.id,
      value: '08:30'
    });
    const after = state.editMode.activities.find((a) => a.id === standup.id);
    assert.equal(after.plannedStartAt, before);
    assert.equal(state.editMode.undoStack.length, 0);
    assert.ok(state.toast);
    assert.match(state.toast.message, /start time is fixed/i);
  });

  test('invalid HH:MM shows error toast + no mutation', () => {
    const { state, handlers, compId } = seedAndBuildHandlers();
    handlers.EDIT({ compositionId: compId });
    const target = pickNonProtectedTarget(state);
    const before = target.plannedStartAt;
    handlers.EDIT_CHANGE_START_TIME({
      activityId: target.id,
      value: 'not-a-time'
    });
    const after = state.editMode.activities.find((a) => a.id === target.id);
    assert.equal(after.plannedStartAt, before);
    assert.equal(state.editMode.undoStack.length, 0);
    assert.ok(state.toast);
    assert.match(state.toast.message, /valid start time/i);
  });

  test('empty value shows error toast + no mutation', () => {
    const { state, handlers, compId } = seedAndBuildHandlers();
    handlers.EDIT({ compositionId: compId });
    const target = pickNonProtectedTarget(state);
    const before = target.plannedStartAt;
    handlers.EDIT_CHANGE_START_TIME({
      activityId: target.id,
      value: ''
    });
    const after = state.editMode.activities.find((a) => a.id === target.id);
    assert.equal(after.plannedStartAt, before);
    assert.equal(state.editMode.undoStack.length, 0);
    assert.ok(state.toast);
  });

  test('no-op when editMode is null', () => {
    const { state, handlers } = seedAndBuildHandlers();
    state.toast = null;
    handlers.EDIT_CHANGE_START_TIME({ activityId: 'whatever', value: '10:00' });
    assert.equal(state.editMode, null);
    assert.equal(state.toast, null);
  });

  test('no-op when activityId is missing', () => {
    const { state, handlers, compId } = seedAndBuildHandlers();
    handlers.EDIT({ compositionId: compId });
    handlers.EDIT_CHANGE_START_TIME({ value: '10:00' });
    assert.equal(state.editMode.undoStack.length, 0);
  });

  test('no-op when the target slot does not exist', () => {
    const { state, handlers, compId } = seedAndBuildHandlers();
    handlers.EDIT({ compositionId: compId });
    handlers.EDIT_CHANGE_START_TIME({
      activityId: 'not_a_real_id',
      value: '10:00'
    });
    assert.equal(state.editMode.undoStack.length, 0);
  });

  test('no-op when new HH:MM matches the current HH:MM', () => {
    const { state, handlers, compId } = seedAndBuildHandlers();
    handlers.EDIT({ compositionId: compId });
    const target = pickNonProtectedTarget(state);
    const current = toHHMM(target.plannedStartAt);
    state.toast = null;
    handlers.EDIT_CHANGE_START_TIME({
      activityId: target.id,
      value: current
    });
    assert.equal(state.editMode.undoStack.length, 0);
    assert.equal(state.toast, null);
  });

  test('reads value from ctx.element when payload.value missing', () => {
    const { state, handlers, compId } = seedAndBuildHandlers();
    handlers.EDIT({ compositionId: compId });
    const target = pickNonProtectedTarget(state);
    const oldHHMM = toHHMM(target.plannedStartAt);
    const fakeElement = { value: '17:30' };
    handlers.EDIT_CHANGE_START_TIME(
      { activityId: target.id },
      { element: fakeElement }
    );
    const updated = state.editMode.activities.find((a) => a.id === target.id);
    assert.equal(toHHMM(updated.plannedStartAt), '17:30');
    assert.match(state.toast.message, new RegExp(`${oldHHMM} → 17:30`));
  });
});

describe('Sprint 14 — EDIT_CHANGE_START_TIME + EDIT_UNDO integration', () => {
  test('undo reverts a start-time change', () => {
    const { state, handlers, compId } = seedAndBuildHandlers();
    handlers.EDIT({ compositionId: compId });
    const target = pickNonProtectedTarget(state);
    const oldPlannedStartAt = target.plannedStartAt;
    handlers.EDIT_CHANGE_START_TIME({
      activityId: target.id,
      value: '17:30'
    });
    const intermediate = state.editMode.activities.find((a) => a.id === target.id);
    assert.equal(toHHMM(intermediate.plannedStartAt), '17:30');
    handlers.EDIT_UNDO({});
    const restored = state.editMode.activities.find((a) => a.id === target.id);
    assert.equal(restored.plannedStartAt, oldPlannedStartAt);
    assert.equal(state.editMode.undoStack.length, 0);
  });

  test('undo after overlap rejection is a no-op on top (nothing pushed)', () => {
    const { state, handlers, compId } = seedAndBuildHandlers();
    handlers.EDIT({ compositionId: compId });
    const target = pickNonProtectedTarget(state);
    handlers.EDIT_CHANGE_START_TIME({
      activityId: target.id,
      value: '00:00'
    });
    assert.equal(state.editMode.undoStack.length, 0);
    // Undo stack still empty; EDIT_UNDO should surface the "Nothing to undo" info.
    state.toast = null;
    handlers.EDIT_UNDO({});
    assert.ok(state.toast);
    assert.match(state.toast.message, /Nothing to undo/i);
  });
});

describe('Sprint 14 — cascade integration via handler', () => {
  test('shifting a middle slot cascades butting-up successors', () => {
    const { state, handlers, compId } = seedAndBuildHandlers();
    handlers.EDIT({ compositionId: compId });
    // Install a controlled schedule so we can verify cascade deterministically.
    state.editMode.activities = [
      {
        id: 'x1',
        catalogEntryId: 'cat_foo',
        name: 'X1',
        bucket: 'PROJECT',
        plannedStartAt: '13:00',
        plannedDurationMinutes: 60,
        state: 'PROPOSED'
      },
      {
        id: 'x2',
        catalogEntryId: 'cat_bar',
        name: 'X2',
        bucket: 'PROJECT',
        plannedStartAt: '14:00',
        plannedDurationMinutes: 30,
        state: 'PROPOSED'
      }
    ];
    // Move X1 from 13:00 → 13:30. X2 was butting up → should shift to 14:30.
    handlers.EDIT_CHANGE_START_TIME({
      activityId: 'x1',
      value: '13:30'
    });
    const byId = Object.fromEntries(state.editMode.activities.map((a) => [a.id, a]));
    assert.equal(byId.x1.plannedStartAt, '13:30');
    assert.equal(byId.x2.plannedStartAt, '14:30');
  });
});
