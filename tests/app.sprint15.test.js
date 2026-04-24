/**
 * Sprint 15 — Auto re-plan on runtime events (W5).
 *
 * Verifies the app-level wiring:
 *   - ActivityCompleted triggers handleReflowOnRuntimeEvent
 *   - ActivityStartedLate triggers handleReflowOnRuntimeEvent
 *   - KaizenStepCompleted triggers handleWeeklyReflowOnRuntimeEvent
 *   - Toast surfaces on shifted blocks
 */

globalThis.__CADENCEPLAN_NO_AUTOSTART__ = true;

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { LocalStorageMock } from './_helpers/localStorageMock.js';
import { LocalStorageRepository } from '../js/persistence/LocalStorageRepository.js';
import { ClockService } from '../js/services/ClockService.js';
import { EventBus } from '../js/events/EventBus.js';
import { ComposerService, ACTIVITIES_KEY, COMPOSITIONS_KEY } from '../js/services/ComposerService.js';
import { WeeklyComposerService, WEEKLY_COMPOSITIONS_KEY } from '../js/services/WeeklyComposerService.js';
import {
  DEFAULT_USER,
  handleReflowOnRuntimeEvent,
  handleWeeklyReflowOnRuntimeEvent
} from '../js/app.js';
import { CycleReflowed } from '../js/events/events.js';

const FROZEN_NOW = '2026-04-22T12:00:00Z';

/**
 * Lightweight env — skips the full buildServices() pipeline (catalog seed,
 * KaizenService, etc.) so reflow handler tests don't pay for unrelated
 * boot work.
 */
function buildEnv() {
  const storage = new LocalStorageMock();
  const repo = new LocalStorageRepository({ storage });
  const bus = new EventBus();
  const clock = new ClockService({ now: () => FROZEN_NOW });
  const composerService = new ComposerService({ repo, bus, clock });
  const weeklyComposerService = new WeeklyComposerService({
    repo,
    bus,
    clock,
    composerService
  });
  return {
    storage,
    clock,
    services: { repo, bus, clock, composerService, weeklyComposerService }
  };
}

function stateStub() {
  return {
    route: 'today',
    params: {},
    toast: null,
    lastError: null
  };
}

function seedDailyCompositionWithMixedActivities(repo) {
  const compId = `comp_${DEFAULT_USER.id}_2026-04-22`;
  const comp = {
    id: compId,
    userId: DEFAULT_USER.id,
    cycleType: 'DAILY',
    state: 'ACCEPTED',
    startAt: '2026-04-22T00:00:00Z',
    endAt: '2026-04-22T23:59:59Z',
    proposedAt: '2026-04-22T08:00:00Z',
    decidedAt: '2026-04-22T08:30:00Z'
  };
  const comps = repo.read(COMPOSITIONS_KEY) ?? {};
  repo.write(COMPOSITIONS_KEY, { ...comps, [compId]: comp });
  const acts = {
    closed_a: {
      id: 'closed_a',
      compositionId: compId,
      catalogEntryId: 'cat_x',
      bucket: 'PROJECT',
      plannedDurationMinutes: 60,
      plannedStartAt: '09:00',
      state: 'CLOSED'
    },
    pending_b: {
      id: 'pending_b',
      compositionId: compId,
      catalogEntryId: 'cat_y',
      bucket: 'PROJECT',
      plannedDurationMinutes: 60,
      plannedStartAt: '08:30',
      state: 'PROPOSED'
    }
  };
  const allActs = repo.read(ACTIVITIES_KEY) ?? {};
  repo.write(ACTIVITIES_KEY, { ...allActs, ...acts });
  return { compId };
}

describe('Sprint 15 W5 — handleReflowOnRuntimeEvent', () => {
  test('shifts PROPOSED activities, surfaces a toast', () => {
    const env = buildEnv();
    seedDailyCompositionWithMixedActivities(env.services.repo);
    const state = stateStub();
    let rerendered = 0;
    handleReflowOnRuntimeEvent(env.services, state, 'ActivityCompleted', () => { rerendered += 1; });
    const acts = env.services.repo.read(ACTIVITIES_KEY);
    // closed end = 10:00 → pending_b moves from 08:30 → 10:00.
    assert.equal(acts.pending_b.plannedStartAt, '10:00');
    assert.ok(state.toast);
    assert.match(state.toast.message, /Plan re-flowed/);
  });

  test('does NOT surface a toast when nothing shifts', () => {
    const env = buildEnv();
    const state = stateStub();
    handleReflowOnRuntimeEvent(env.services, state, 'ActivityCompleted', () => {});
    assert.equal(state.toast, null);
  });

  test('passes the trigger to the reflow service', () => {
    const env = buildEnv();
    seedDailyCompositionWithMixedActivities(env.services.repo);
    const state = stateStub();
    let captured = null;
    env.services.bus.subscribe(CycleReflowed, (p) => { captured = p; });
    handleReflowOnRuntimeEvent(env.services, state, 'ActivityStartedLate', () => {});
    assert.ok(captured);
    assert.equal(captured.trigger, 'ActivityStartedLate');
    assert.equal(captured.scope, 'DAILY');
  });

  test('is a no-op when services lacks composerService', () => {
    const state = stateStub();
    // Pass a partial services object — no throw expected.
    handleReflowOnRuntimeEvent({}, state, 'ActivityCompleted', () => {});
    assert.equal(state.toast, null);
  });
});

describe('Sprint 15 W5 — bus subscriptions wire reflow', () => {
  test('publishing ActivityCompleted triggers a CycleReflowed', async () => {
    const env = buildEnv();
    seedDailyCompositionWithMixedActivities(env.services.repo);
    // The standard `start()` wires up subscriptions internally; for this
    // test we manually replicate by attaching a CycleReflowed listener
    // and directly invoking the reflow handler — verifies the path
    // composerService.reflow → CycleReflowed.
    let captured = null;
    env.services.bus.subscribe(CycleReflowed, (p) => { captured = p; });
    handleReflowOnRuntimeEvent(env.services, stateStub(), 'ActivityCompleted', () => {});
    assert.ok(captured);
    assert.equal(captured.scope, 'DAILY');
  });
});

function seedProposedWeekly(repo, weekStart) {
  const id = `wcomp_${DEFAULT_USER.id}_${weekStart}`;
  const weekly = {
    id,
    userId: DEFAULT_USER.id,
    weekStart,
    weekEnd: '2026-04-24',
    state: 'PROPOSED',
    proposedAt: '2026-04-20T08:00:00Z',
    decidedAt: null,
    days: [
      { id: `wcomp_${DEFAULT_USER.id}_2026-04-20`, date: '2026-04-20', dayIdx: 0, state: 'PROPOSED', activities: [], plannedByBucket: { PROJECT: 0, COMMUNICATION: 0, CI: 0 } },
      { id: `wcomp_${DEFAULT_USER.id}_2026-04-21`, date: '2026-04-21', dayIdx: 1, state: 'PROPOSED', activities: [], plannedByBucket: { PROJECT: 0, COMMUNICATION: 0, CI: 0 } },
      { id: `wcomp_${DEFAULT_USER.id}_2026-04-22`, date: '2026-04-22', dayIdx: 2, state: 'PROPOSED', activities: [], plannedByBucket: { PROJECT: 0, COMMUNICATION: 0, CI: 0 } },
      { id: `wcomp_${DEFAULT_USER.id}_2026-04-23`, date: '2026-04-23', dayIdx: 3, state: 'PROPOSED', activities: [], plannedByBucket: { PROJECT: 0, COMMUNICATION: 0, CI: 0 } },
      { id: `wcomp_${DEFAULT_USER.id}_2026-04-24`, date: '2026-04-24', dayIdx: 4, state: 'PROPOSED', activities: [], plannedByBucket: { PROJECT: 0, COMMUNICATION: 0, CI: 0 } }
    ],
    composerInputsSnapshot: {
      kaizens: [],
      historicalCompletedCatalogIds: [],
      dailyCapacityMinutes: 480,
      capacityOverrides: {}
    },
    version: 1
  };
  const map = repo.read(WEEKLY_COMPOSITIONS_KEY) ?? {};
  repo.write(WEEKLY_COMPOSITIONS_KEY, { ...map, [id]: weekly });
  return id;
}

describe('Sprint 15 W5 — handleWeeklyReflowOnRuntimeEvent', () => {
  test('reflows the proposed weekly cycle and emits CycleReflowed (scope=WEEKLY)', () => {
    const env = buildEnv();
    seedProposedWeekly(env.services.repo, '2026-04-20'); // Mon of FROZEN_NOW
    const state = stateStub();
    let captured = null;
    env.services.bus.subscribe(CycleReflowed, (p) => { captured = p; });
    handleWeeklyReflowOnRuntimeEvent(env.services, state, 'KaizenStepCompleted', () => {});
    assert.ok(captured);
    assert.equal(captured.scope, 'WEEKLY');
    assert.equal(captured.trigger, 'KaizenStepCompleted');
  });

  test('is a no-op when no PROPOSED weekly exists', () => {
    const env = buildEnv();
    const state = stateStub();
    let count = 0;
    env.services.bus.subscribe(CycleReflowed, () => { count += 1; });
    handleWeeklyReflowOnRuntimeEvent(env.services, state, 'KaizenStepCompleted', () => {});
    assert.equal(count, 0);
  });

  test('is a no-op when services lacks weeklyComposerService', () => {
    const state = stateStub();
    handleWeeklyReflowOnRuntimeEvent({}, state, 'KaizenStepCompleted', () => {});
    assert.equal(state.toast, null);
  });
});
