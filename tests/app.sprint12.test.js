/**
 * Sprint 12 integration tests — edit-mode handlers.
 *
 * Covers:
 *   - EDIT populates state.editMode with a snapshot
 *   - EDIT_EXIT clears editMode
 *   - EDIT_SELECT_SLOT for non-protected, rejects protected with toast
 *   - EDIT_ADD_SLOT sets selectedActivityId=__new__
 *   - EDIT_SWAP applies swap, pushes undo, clears selection
 *   - EDIT_SWAP against protected slot shows error toast and no mutation
 *   - EDIT_REMOVE_SLOT removes non-protected, blocks protected
 *   - EDIT_UNDO pops the undo stack and restores prior activities
 *   - EDIT_BUCKET_TOGGLE toggles expanded state
 *   - EDIT_SEARCH + EDIT_PROJECT_TYPE_FILTER update state
 *   - EDIT_COMMIT calls ComposerService.commitEdit and clears editMode
 *   - EDIT_CANCEL restores snapshot (by simply dropping editMode)
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
import {
  COMPOSITIONS_KEY,
  ACTIVITIES_KEY
} from '../js/services/ComposerService.js';
import { CycleEdited } from '../js/events/events.js';

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

/**
 * Build handlers + seed a composition so EDIT has a target.
 */
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

describe('Sprint 12 — EDIT handler (entry)', () => {
  test('populates state.editMode with a deep snapshot', () => {
    const { state, handlers, compId } = seedAndBuildHandlers();
    handlers.EDIT({ compositionId: compId });
    assert.ok(state.editMode);
    assert.equal(state.editMode.compositionId, compId);
    assert.ok(Array.isArray(state.editMode.snapshotActivities));
    assert.ok(state.editMode.snapshotActivities.length > 0);
    assert.notEqual(state.editMode.activities, state.editMode.snapshotActivities);
    // initialize with PROJECT expanded and empty undoStack
    assert.deepEqual(state.editMode.expandedBuckets, ['PROJECT']);
    assert.deepEqual(state.editMode.undoStack, []);
    assert.equal(state.editMode.selectedActivityId, null);
  });

  test('missing composition id → no-op', () => {
    const { state, handlers } = seedAndBuildHandlers();
    handlers.EDIT({});
    assert.equal(state.editMode, null);
  });

  test('EDIT_EXIT clears editMode', () => {
    const { state, handlers, compId } = seedAndBuildHandlers();
    handlers.EDIT({ compositionId: compId });
    handlers.EDIT_EXIT({});
    assert.equal(state.editMode, null);
  });
});

describe('Sprint 12 — EDIT_SELECT_SLOT', () => {
  test('selects a non-protected activity', () => {
    const { state, handlers, compId } = seedAndBuildHandlers();
    handlers.EDIT({ compositionId: compId });
    const proj = state.editMode.activities.find((a) => a.bucket === 'PROJECT' && !a.carriedOver);
    assert.ok(proj, 'no PROJECT activity');
    handlers.EDIT_SELECT_SLOT({ activityId: proj.id });
    assert.equal(state.editMode.selectedActivityId, proj.id);
  });

  test('rejects a protected slot (Daily Standup) with an info toast', () => {
    const { state, handlers, compId } = seedAndBuildHandlers();
    handlers.EDIT({ compositionId: compId });
    const standup = state.editMode.activities.find((a) => a.catalogEntryId === 'cer_daily_standup');
    assert.ok(standup, 'no daily standup');
    handlers.EDIT_SELECT_SLOT({ activityId: standup.id });
    assert.equal(state.editMode.selectedActivityId, null);
    assert.ok(state.toast);
    assert.match(state.toast.message, /required for your daily rhythm/);
  });

  test('no-op when editMode is null', () => {
    const { state, handlers } = seedAndBuildHandlers();
    handlers.EDIT_SELECT_SLOT({ activityId: 'whatever' });
    assert.equal(state.editMode, null);
  });
});

describe('Sprint 12 — EDIT_SWAP', () => {
  function swapEnv() {
    const { env, state, handlers, compId } = seedAndBuildHandlers();
    handlers.EDIT({ compositionId: compId });
    // find a non-protected target
    const target = state.editMode.activities.find(
      (a) => a.bucket === 'PROJECT' && !a.carriedOver && a.catalogEntryId !== 'cer_daily_standup'
    );
    return { env, state, handlers, compId, target };
  }

  test('swap replaces the selected slot and pushes undo', () => {
    const { env, state, handlers, target } = swapEnv();
    handlers.EDIT_SELECT_SLOT({ activityId: target.id });
    // Pick any enabled catalog entry — use an L&D CI entry from browserSeed
    const catalog = env.services.catalogService.list(DEFAULT_USER.id);
    const ciEntry = catalog.find((c) => c.bucket === 'CI' && c.id !== 'gen_end_of_activity_reflection');
    assert.ok(ciEntry, 'no CI entry to swap to');
    const before = state.editMode.activities.length;
    handlers.EDIT_SWAP({ catalogEntryId: ciEntry.id });
    assert.equal(state.editMode.activities.length, before);
    // The target id should have been replaced (new row in that position)
    const newRow = state.editMode.activities.find((a) => a.catalogEntryId === ciEntry.id);
    assert.ok(newRow);
    assert.equal(state.editMode.selectedActivityId, null);
    assert.equal(state.editMode.undoStack.length, 1);
    assert.ok(state.toast);
    assert.match(state.toast.message, /Swapped/);
  });

  test('swap against protected slot is blocked with error toast', () => {
    const { env, state, handlers } = swapEnv();
    const standup = state.editMode.activities.find((a) => a.catalogEntryId === 'cer_daily_standup');
    // Bypass select (forcibly set selectedActivityId to a protected id)
    state.editMode.selectedActivityId = standup.id;
    const catalog = env.services.catalogService.list(DEFAULT_USER.id);
    const ciEntry = catalog.find((c) => c.bucket === 'CI');
    handlers.EDIT_SWAP({ catalogEntryId: ciEntry.id });
    assert.match(state.toast.message, /required for your daily rhythm/);
    // activities unchanged — still has standup
    assert.ok(state.editMode.activities.find((a) => a.catalogEntryId === 'cer_daily_standup'));
    // undoStack NOT pushed
    assert.equal(state.editMode.undoStack.length, 0);
  });

  test('swap with no slot selected shows an info toast', () => {
    const { env, state, handlers } = swapEnv();
    const catalog = env.services.catalogService.list(DEFAULT_USER.id);
    const ciEntry = catalog.find((c) => c.bucket === 'CI');
    handlers.EDIT_SWAP({ catalogEntryId: ciEntry.id });
    assert.match(state.toast.message, /Pick a slot/);
  });

  test('swap with unknown catalogEntryId shows an error toast', () => {
    const { state, handlers, target } = swapEnv();
    handlers.EDIT_SELECT_SLOT({ activityId: target.id });
    handlers.EDIT_SWAP({ catalogEntryId: 'nonexistent_cat_entry' });
    assert.match(state.toast.message, /not found/);
  });
});

describe('Sprint 12 — EDIT_ADD_SLOT', () => {
  test('sets selectedActivityId=__new__ so next swap appends', () => {
    const { env, state, handlers, compId } = seedAndBuildHandlers();
    handlers.EDIT({ compositionId: compId });
    handlers.EDIT_ADD_SLOT({});
    assert.equal(state.editMode.selectedActivityId, '__new__');
    const catalog = env.services.catalogService.list(DEFAULT_USER.id);
    const ciEntry = catalog.find((c) => c.bucket === 'CI');
    const before = state.editMode.activities.length;
    handlers.EDIT_SWAP({ catalogEntryId: ciEntry.id });
    assert.equal(state.editMode.activities.length, before + 1);
    assert.equal(state.editMode.selectedActivityId, null);
    assert.match(state.toast.message, /Added/);
  });
});

describe('Sprint 12 — EDIT_REMOVE_SLOT', () => {
  test('removes a non-protected activity + pushes undo', () => {
    const { state, handlers, compId } = seedAndBuildHandlers();
    handlers.EDIT({ compositionId: compId });
    const target = state.editMode.activities.find(
      (a) => a.bucket === 'PROJECT' && !a.carriedOver
    );
    const before = state.editMode.activities.length;
    handlers.EDIT_REMOVE_SLOT({ activityId: target.id });
    assert.equal(state.editMode.activities.length, before - 1);
    assert.equal(state.editMode.undoStack.length, 1);
  });

  test('blocks removal of protected slot + shows error toast', () => {
    const { state, handlers, compId } = seedAndBuildHandlers();
    handlers.EDIT({ compositionId: compId });
    const standup = state.editMode.activities.find((a) => a.catalogEntryId === 'cer_daily_standup');
    const before = state.editMode.activities.length;
    handlers.EDIT_REMOVE_SLOT({ activityId: standup.id });
    assert.equal(state.editMode.activities.length, before);
    assert.match(state.toast.message, /required for your daily rhythm/);
  });

  test('clears selection if the removed slot was selected', () => {
    const { state, handlers, compId } = seedAndBuildHandlers();
    handlers.EDIT({ compositionId: compId });
    const target = state.editMode.activities.find(
      (a) => a.bucket === 'PROJECT' && !a.carriedOver
    );
    handlers.EDIT_SELECT_SLOT({ activityId: target.id });
    handlers.EDIT_REMOVE_SLOT({ activityId: target.id });
    assert.equal(state.editMode.selectedActivityId, null);
  });
});

describe('Sprint 12 — EDIT_UNDO', () => {
  test('restores the previous activities array', () => {
    const { env, state, handlers, compId } = seedAndBuildHandlers();
    handlers.EDIT({ compositionId: compId });
    const target = state.editMode.activities.find(
      (a) => a.bucket === 'PROJECT' && !a.carriedOver
    );
    handlers.EDIT_SELECT_SLOT({ activityId: target.id });
    const catalog = env.services.catalogService.list(DEFAULT_USER.id);
    const ciEntry = catalog.find((c) => c.bucket === 'CI');
    const beforeIds = state.editMode.activities.map((a) => a.catalogEntryId);
    handlers.EDIT_SWAP({ catalogEntryId: ciEntry.id });
    handlers.EDIT_UNDO({});
    const afterIds = state.editMode.activities.map((a) => a.catalogEntryId);
    assert.deepEqual(afterIds, beforeIds);
    assert.equal(state.editMode.undoStack.length, 0);
  });

  test('info toast when stack is empty', () => {
    const { state, handlers, compId } = seedAndBuildHandlers();
    handlers.EDIT({ compositionId: compId });
    handlers.EDIT_UNDO({});
    assert.match(state.toast.message, /Nothing to undo/);
  });

  test('undo stack preserves at least 5 successive swaps', () => {
    const { env, state, handlers, compId } = seedAndBuildHandlers();
    handlers.EDIT({ compositionId: compId });
    const catalog = env.services.catalogService.list(DEFAULT_USER.id);
    const ciEntries = catalog.filter(
      (c) => c.bucket === 'CI' && c.id !== 'gen_end_of_activity_reflection'
    );
    // Each swap replaces the target with a fresh-id row. We re-look up the
    // first non-protected PROJECT/CI activity after each swap.
    for (let i = 0; i < 5; i += 1) {
      const tgt = state.editMode.activities.find(
        (a) => !a.carriedOver && a.bucket !== 'COMMUNICATION' && a.catalogEntryId !== 'cer_daily_standup' && a.catalogEntryId !== 'gen_end_of_activity_reflection'
      );
      handlers.EDIT_SELECT_SLOT({ activityId: tgt.id });
      handlers.EDIT_SWAP({ catalogEntryId: ciEntries[i % ciEntries.length].id });
    }
    assert.ok(state.editMode.undoStack.length >= 5, `undo stack length ${state.editMode.undoStack.length}`);
  });
});

describe('Sprint 12 — EDIT_BUCKET_TOGGLE', () => {
  test('toggling a bucket expands/collapses it', () => {
    const { state, handlers, compId } = seedAndBuildHandlers();
    handlers.EDIT({ compositionId: compId });
    assert.deepEqual(state.editMode.expandedBuckets, ['PROJECT']);
    handlers.EDIT_BUCKET_TOGGLE({ bucket: 'CI' });
    assert.ok(state.editMode.expandedBuckets.includes('CI'));
    handlers.EDIT_BUCKET_TOGGLE({ bucket: 'CI' });
    assert.ok(!state.editMode.expandedBuckets.includes('CI'));
  });
});

describe('Sprint 12 — EDIT_SEARCH + EDIT_PROJECT_TYPE_FILTER', () => {
  test('EDIT_SEARCH updates searchQuery', () => {
    const { state, handlers, compId } = seedAndBuildHandlers();
    handlers.EDIT({ compositionId: compId });
    handlers.EDIT_SEARCH({ value: 'deep' });
    assert.equal(state.editMode.searchQuery, 'deep');
  });

  test('EDIT_SEARCH falls back to ctx.element.value', () => {
    const { state, handlers, compId } = seedAndBuildHandlers();
    handlers.EDIT({ compositionId: compId });
    handlers.EDIT_SEARCH({}, { element: { value: 'pdca' } });
    assert.equal(state.editMode.searchQuery, 'pdca');
  });

  test('EDIT_PROJECT_TYPE_FILTER updates projectTypeFilter', () => {
    const { state, handlers, compId } = seedAndBuildHandlers();
    handlers.EDIT({ compositionId: compId });
    handlers.EDIT_PROJECT_TYPE_FILTER({ projectType: 'DMAIC' });
    assert.equal(state.editMode.projectTypeFilter, 'DMAIC');
  });
});

describe('Sprint 12 — EDIT_COMMIT', () => {
  test('commits via ComposerService.commitEdit, clears editMode, emits CycleEdited', () => {
    const { env, state, handlers, compId } = seedAndBuildHandlers();
    const received = [];
    env.services.bus.subscribe(CycleEdited, (p) => received.push(p));
    handlers.EDIT({ compositionId: compId });
    handlers.EDIT_COMMIT({});
    assert.equal(state.editMode, null);
    assert.equal(received.length, 1);
    assert.equal(received[0].compositionId, compId);
    assert.match(state.toast.message, /Edits saved/);
  });

  test('persists edited activities via the repo', () => {
    const { env, state, handlers, compId } = seedAndBuildHandlers();
    handlers.EDIT({ compositionId: compId });
    const target = state.editMode.activities.find(
      (a) => a.bucket === 'PROJECT' && !a.carriedOver
    );
    handlers.EDIT_SELECT_SLOT({ activityId: target.id });
    const catalog = env.services.catalogService.list(DEFAULT_USER.id);
    const ciEntry = catalog.find((c) => c.bucket === 'CI');
    handlers.EDIT_SWAP({ catalogEntryId: ciEntry.id });
    handlers.EDIT_COMMIT({});
    const activities = env.services.repo.read(ACTIVITIES_KEY);
    // Original target row should now be DROPPED
    assert.equal(activities[target.id].state, 'DROPPED');
    // The new row (catalogEntryId=ciEntry.id) should be present
    const newRow = Object.values(activities).find(
      (a) => a.compositionId === compId && a.catalogEntryId === ciEntry.id && a.state !== 'DROPPED'
    );
    assert.ok(newRow);
  });
});

describe('Sprint 12 — EDIT_CANCEL', () => {
  test('cancel clears editMode and shows info toast', () => {
    const { state, handlers, compId } = seedAndBuildHandlers();
    handlers.EDIT({ compositionId: compId });
    handlers.EDIT_CANCEL({});
    assert.equal(state.editMode, null);
    assert.match(state.toast.message, /Edit cancelled/);
  });

  test('cancel does NOT persist pending swaps', () => {
    const { env, state, handlers, compId } = seedAndBuildHandlers();
    handlers.EDIT({ compositionId: compId });
    const target = state.editMode.activities.find(
      (a) => a.bucket === 'PROJECT' && !a.carriedOver
    );
    const before = env.services.repo.read(ACTIVITIES_KEY);
    handlers.EDIT_SELECT_SLOT({ activityId: target.id });
    const catalog = env.services.catalogService.list(DEFAULT_USER.id);
    const ciEntry = catalog.find((c) => c.bucket === 'CI');
    handlers.EDIT_SWAP({ catalogEntryId: ciEntry.id });
    handlers.EDIT_CANCEL({});
    const after = env.services.repo.read(ACTIVITIES_KEY);
    assert.deepEqual(before, after);
  });
});
