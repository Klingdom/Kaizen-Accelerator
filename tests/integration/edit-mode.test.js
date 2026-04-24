/**
 * Sprint 12 Integration — end-to-end edit mode walk.
 *
 *   1. AUTO_PLAN → PROPOSED composition
 *   2. EDIT(compId) → state.editMode populated
 *   3. EDIT_SELECT_SLOT on a non-protected PROJECT row
 *   4. EDIT_SWAP with a CI catalog entry → activities array updated,
 *      undoStack has 1 entry, toast SUCCESS, BucketStrip will reflect
 *      new totals when Today renders
 *   5. EDIT_UNDO → activities restored, undoStack empty
 *   6. EDIT_SWAP again
 *   7. EDIT_COMMIT → state.editMode cleared, CycleEdited emitted with
 *      swaps[] describing the swap, repo shows DROPPED prior row + fresh
 *      new row, composition state → EDITED, plannedByBucket recomputed.
 */

globalThis.__CADENCEPLAN_NO_AUTOSTART__ = true;

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { LocalStorageMock } from '../_helpers/localStorageMock.js';
import { ClockService } from '../../js/services/ClockService.js';
import {
  buildServices,
  buildHandlers,
  DEFAULT_USER
} from '../../js/app.js';
import {
  COMPOSITIONS_KEY,
  ACTIVITIES_KEY
} from '../../js/services/ComposerService.js';
import { CycleEdited } from '../../js/events/events.js';
import { plannedFromActivities } from '../../js/ui/components/BucketStrip.js';

const FROZEN = '2026-04-22T09:00:00Z';

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
    portfolio: { intakeForm: null, expandedOpportunityId: null, oppFilter: 'all', oppSort: 'newest' },
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

function buildEnv() {
  const storage = new LocalStorageMock();
  const clock = new ClockService({ now: () => FROZEN });
  const services = buildServices({ storage, clock });
  const state = stateStub();
  const rerender = () => {};
  const handlers = buildHandlers({ services, state, rerender });
  return { services, state, handlers };
}

describe('Integration — edit mode end-to-end (Sprint 12)', () => {
  test('full swap + commit flow', () => {
    const { services, state, handlers } = buildEnv();
    const received = [];
    services.bus.subscribe(CycleEdited, (p) => received.push(p));

    // 1. AUTO_PLAN
    handlers.AUTO_PLAN({});
    const compId = Object.keys(services.repo.read(COMPOSITIONS_KEY))[0];
    assert.ok(compId);

    // 2. EDIT
    handlers.EDIT({ compositionId: compId });
    assert.ok(state.editMode);
    const originalPlanned = plannedFromActivities(state.editMode.activities);

    // 3. select a PROJECT slot
    const target = state.editMode.activities.find(
      (a) => a.bucket === 'PROJECT' && !a.carriedOver
    );
    assert.ok(target, 'no PROJECT slot available');
    handlers.EDIT_SELECT_SLOT({ activityId: target.id });
    assert.equal(state.editMode.selectedActivityId, target.id);

    // 4. EDIT_SWAP to a CI entry (non-protected)
    const ciEntry = services.catalogService
      .list(DEFAULT_USER.id)
      .find((c) => c.bucket === 'CI' && c.id !== 'gen_end_of_activity_reflection');
    handlers.EDIT_SWAP({ catalogEntryId: ciEntry.id });
    assert.equal(state.editMode.undoStack.length, 1);
    // BucketStrip would read updated sums:
    const swappedPlanned = plannedFromActivities(state.editMode.activities);
    assert.notDeepEqual(originalPlanned, swappedPlanned);

    // 5. EDIT_UNDO restores
    handlers.EDIT_UNDO({});
    assert.equal(state.editMode.undoStack.length, 0);
    assert.deepEqual(
      plannedFromActivities(state.editMode.activities),
      originalPlanned
    );

    // 6. swap again + commit
    const target2 = state.editMode.activities.find(
      (a) => a.bucket === 'PROJECT' && !a.carriedOver
    );
    handlers.EDIT_SELECT_SLOT({ activityId: target2.id });
    handlers.EDIT_SWAP({ catalogEntryId: ciEntry.id });

    // 7. EDIT_COMMIT
    handlers.EDIT_COMMIT({});
    assert.equal(state.editMode, null);
    assert.equal(received.length, 1);
    assert.equal(received[0].compositionId, compId);
    assert.ok(Array.isArray(received[0].swaps));
    assert.ok(received[0].swaps.length >= 1);

    // Repo state: prior target2 row DROPPED, composition state EDITED
    const after = services.repo.read(ACTIVITIES_KEY);
    assert.equal(after[target2.id].state, 'DROPPED');
    const comp = services.repo.read(COMPOSITIONS_KEY)[compId];
    assert.equal(comp.state, 'EDITED');
    assert.ok(comp.lastEditedAt);
  });

  test('cancel preserves persisted state', () => {
    const { services, state, handlers } = buildEnv();
    handlers.AUTO_PLAN({});
    const compId = Object.keys(services.repo.read(COMPOSITIONS_KEY))[0];
    const beforeActs = { ...services.repo.read(ACTIVITIES_KEY) };
    const beforeComp = { ...services.repo.read(COMPOSITIONS_KEY)[compId] };

    handlers.EDIT({ compositionId: compId });
    const target = state.editMode.activities.find(
      (a) => a.bucket === 'PROJECT' && !a.carriedOver
    );
    handlers.EDIT_SELECT_SLOT({ activityId: target.id });
    const ciEntry = services.catalogService
      .list(DEFAULT_USER.id)
      .find((c) => c.bucket === 'CI' && c.id !== 'gen_end_of_activity_reflection');
    handlers.EDIT_SWAP({ catalogEntryId: ciEntry.id });
    handlers.EDIT_REMOVE_SLOT({ activityId: state.editMode.activities[state.editMode.activities.length - 1].id });

    // Cancel — no persistence side effects.
    handlers.EDIT_CANCEL({});
    assert.equal(state.editMode, null);
    assert.deepEqual(services.repo.read(ACTIVITIES_KEY), beforeActs);
    assert.deepEqual(services.repo.read(COMPOSITIONS_KEY)[compId], beforeComp);
  });

  test('protected blocks cannot be swapped or removed even end-to-end', () => {
    const { services, state, handlers } = buildEnv();
    handlers.AUTO_PLAN({});
    const compId = Object.keys(services.repo.read(COMPOSITIONS_KEY))[0];
    handlers.EDIT({ compositionId: compId });
    const standup = state.editMode.activities.find(
      (a) => a.catalogEntryId === 'cer_daily_standup'
    );
    // try select
    handlers.EDIT_SELECT_SLOT({ activityId: standup.id });
    assert.equal(state.editMode.selectedActivityId, null);
    // try remove
    handlers.EDIT_REMOVE_SLOT({ activityId: standup.id });
    assert.ok(state.editMode.activities.find((a) => a.id === standup.id));
  });

  test('Add-slot flow commits a new row', () => {
    const { services, state, handlers } = buildEnv();
    handlers.AUTO_PLAN({});
    const compId = Object.keys(services.repo.read(COMPOSITIONS_KEY))[0];
    handlers.EDIT({ compositionId: compId });
    handlers.EDIT_ADD_SLOT({});
    const ciEntry = services.catalogService
      .list(DEFAULT_USER.id)
      .find((c) => c.bucket === 'CI' && c.id !== 'gen_end_of_activity_reflection');
    handlers.EDIT_SWAP({ catalogEntryId: ciEntry.id });
    handlers.EDIT_COMMIT({});

    const after = Object.values(services.repo.read(ACTIVITIES_KEY)).filter(
      (a) => a.compositionId === compId && a.catalogEntryId === ciEntry.id && a.state !== 'DROPPED'
    );
    assert.ok(after.length >= 1, 'add-slot did not persist a row');
  });
});
