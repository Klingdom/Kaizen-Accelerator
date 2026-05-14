/**
 * Sprint 10b Pass B — integration tests for the 4 new action handlers.
 *
 * Covers:
 *   PORTFOLIO_TOGGLE_KAIZEN
 *   KAIZEN_COMPLETE_STEP
 *   KAIZEN_SCHEDULE_STEP_TODAY
 *   KAIZEN_SCHEDULE_STEP_WEEK
 */

globalThis.__CADENCEPLAN_NO_AUTOSTART__ = true;

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { LocalStorageMock } from './_helpers/localStorageMock.js';
import { ClockService } from '../js/services/ClockService.js';
import {
  buildServices,
  buildHandlers,
  renderApp,
  DEFAULT_USER
} from '../js/app.js';
import {
  KAIZENS_KEY,
  STEP_PROGRESS_KEY,
  SCHEDULED_ACTIVITIES_KEY
} from '../js/services/KaizenService.js';
import { CATALOG_KEY } from '../js/services/CatalogService.js';

const FROZEN = '2026-04-22T10:00:00Z';

function makeEnv(nowIso = FROZEN) {
  const storage = new LocalStorageMock();
  const clock = new ClockService({ now: () => nowIso });
  const services = buildServices({ storage, clock });
  return { storage, clock, services };
}

/**
 * Seed a DMAIC kaizen + 3-step catalog so the step handlers have data to
 * act on.
 */
function seedDmaicK(env, { kaizenId = 'k_dm_1' } = {}) {
  // Seed the catalog — overwrite the browser seed with DMAIC entries.
  env.services.repo.write(CATALOG_KEY, {
    cat_20: {
      id: 'cat_20',
      activityNumber: 20,
      name: 'Charter',
      bucket: 'PROJECT',
      dependsOn: [],
      projectTypeBinding: 'DMAIC',
      defaultDurationMinutes: 90,
      enabledByUser: true,
      isNonOptional: false
    },
    cat_21: {
      id: 'cat_21',
      activityNumber: 21,
      name: 'SIPOC',
      bucket: 'PROJECT',
      dependsOn: ['cat_20'],
      projectTypeBinding: 'DMAIC',
      defaultDurationMinutes: 60,
      enabledByUser: true,
      isNonOptional: false
    },
    cat_22: {
      id: 'cat_22',
      activityNumber: 22,
      name: 'VOC',
      bucket: 'PROJECT',
      dependsOn: ['cat_21'],
      projectTypeBinding: 'DMAIC',
      defaultDurationMinutes: 60,
      enabledByUser: true,
      isNonOptional: false
    }
  });
  env.services.repo.write(KAIZENS_KEY, {
    [kaizenId]: {
      id: kaizenId,
      userId: DEFAULT_USER.id,
      title: 'DMAIC K',
      problemStatement: 'p',
      goalStatement: 'g',
      state: 'ACTIVE',
      projectType: 'DMAIC',
      actions: [],
      sourceFrictionSignalIds: [],
      baselineMetricId: 'bm_1',
      openedAt: FROZEN,
      abandoned: false
    }
  });
  return kaizenId;
}

function stateStub() {
  return {
    route: 'portfolio',
    params: {},
    composerLoading: false,
    infeasibleExplain: null,
    lastError: null,
    composerConfig: null,
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
    expandedKaizenId: null
  };
}

describe('PORTFOLIO_TOGGLE_KAIZEN handler', () => {
  test('sets expandedKaizenId when previously null', () => {
    const env = makeEnv();
    const state = stateStub();
    const handlers = buildHandlers({ services: env.services, state, rerender: () => {} });
    handlers.PORTFOLIO_TOGGLE_KAIZEN({ kaizenId: 'k_abc' });
    assert.equal(state.expandedKaizenId, 'k_abc');
  });

  test('toggles back to null when same kaizenId clicked', () => {
    const env = makeEnv();
    const state = stateStub();
    state.expandedKaizenId = 'k_abc';
    const handlers = buildHandlers({ services: env.services, state, rerender: () => {} });
    handlers.PORTFOLIO_TOGGLE_KAIZEN({ kaizenId: 'k_abc' });
    assert.equal(state.expandedKaizenId, null);
  });

  test('switches to different kaizenId when another card clicked', () => {
    const env = makeEnv();
    const state = stateStub();
    state.expandedKaizenId = 'k_a';
    const handlers = buildHandlers({ services: env.services, state, rerender: () => {} });
    handlers.PORTFOLIO_TOGGLE_KAIZEN({ kaizenId: 'k_b' });
    assert.equal(state.expandedKaizenId, 'k_b');
  });

  test('no-op without kaizenId in payload', () => {
    const env = makeEnv();
    const state = stateStub();
    const handlers = buildHandlers({ services: env.services, state, rerender: () => {} });
    handlers.PORTFOLIO_TOGGLE_KAIZEN({});
    assert.equal(state.expandedKaizenId, null);
  });

  test('re-renders after toggle (rerender called)', () => {
    const env = makeEnv();
    const state = stateStub();
    let calls = 0;
    const handlers = buildHandlers({
      services: env.services,
      state,
      rerender: () => {
        calls += 1;
      }
    });
    handlers.PORTFOLIO_TOGGLE_KAIZEN({ kaizenId: 'k_a' });
    assert.equal(calls, 1);
  });
});

describe('KAIZEN_COMPLETE_STEP handler', () => {
  test('invokes kaizenService.completeStep with portfolio sourceKind', () => {
    const env = makeEnv();
    const kid = seedDmaicK(env);
    const state = stateStub();
    const handlers = buildHandlers({ services: env.services, state, rerender: () => {} });
    handlers.KAIZEN_COMPLETE_STEP({ kaizenId: kid, catalogEntryId: 'cat_20' });
    const rows = env.services.kaizenService.getCompletedStepsForKaizen(kid);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].catalogEntryId, 'cat_20');
    assert.equal(rows[0].sourceKind, 'portfolio');
  });

  test('uses DEFAULT_USER.id as userId', () => {
    const env = makeEnv();
    const kid = seedDmaicK(env);
    const state = stateStub();
    const handlers = buildHandlers({ services: env.services, state, rerender: () => {} });
    handlers.KAIZEN_COMPLETE_STEP({ kaizenId: kid, catalogEntryId: 'cat_20' });
    const rows = env.services.kaizenService.getCompletedStepsForKaizen(kid);
    assert.equal(rows[0].userId, DEFAULT_USER.id);
  });

  test('STEP_NOT_CURRENT error lands on state.lastError (not thrown)', () => {
    const env = makeEnv();
    const kid = seedDmaicK(env);
    const state = stateStub();
    const handlers = buildHandlers({ services: env.services, state, rerender: () => {} });
    // Attempt to skip past cat_20 — cat_22 is not current.
    handlers.KAIZEN_COMPLETE_STEP({ kaizenId: kid, catalogEntryId: 'cat_22' });
    assert.ok(state.lastError);
    assert.equal(state.lastError.name, 'STEP_NOT_CURRENT');
  });

  test('no-op when payload missing kaizenId or catalogEntryId', () => {
    const env = makeEnv();
    const state = stateStub();
    const handlers = buildHandlers({ services: env.services, state, rerender: () => {} });
    handlers.KAIZEN_COMPLETE_STEP({ catalogEntryId: 'cat_20' });
    handlers.KAIZEN_COMPLETE_STEP({ kaizenId: 'k' });
    handlers.KAIZEN_COMPLETE_STEP(null);
    assert.equal(state.lastError, null);
  });

  test('triggers rerender on success', () => {
    const env = makeEnv();
    const kid = seedDmaicK(env);
    const state = stateStub();
    let calls = 0;
    const handlers = buildHandlers({
      services: env.services,
      state,
      rerender: () => {
        calls += 1;
      }
    });
    handlers.KAIZEN_COMPLETE_STEP({ kaizenId: kid, catalogEntryId: 'cat_20' });
    assert.equal(calls, 1);
  });
});

describe('KAIZEN_SCHEDULE_STEP_TODAY handler', () => {
  test('creates a ScheduledActivity on today\'s date', () => {
    const env = makeEnv();
    const kid = seedDmaicK(env);
    const state = stateStub();
    const handlers = buildHandlers({ services: env.services, state, rerender: () => {} });
    handlers.KAIZEN_SCHEDULE_STEP_TODAY({ kaizenId: kid, catalogEntryId: 'cat_20' });
    const map = env.services.repo.read(SCHEDULED_ACTIVITIES_KEY) ?? {};
    const rows = Object.values(map).filter((sa) => sa.linkedKaizenId === kid);
    assert.equal(rows.length, 1);
    const sa = rows[0];
    // Today = 2026-04-22 from FROZEN; start 09:00 UTC.
    assert.equal(sa.plannedStartAt, '2026-04-22T09:00:00Z');
  });

  test('no-op when kaizenId or catalogEntryId missing', () => {
    const env = makeEnv();
    const state = stateStub();
    const handlers = buildHandlers({ services: env.services, state, rerender: () => {} });
    handlers.KAIZEN_SCHEDULE_STEP_TODAY({});
    handlers.KAIZEN_SCHEDULE_STEP_TODAY(null);
    assert.equal(state.lastError, null);
  });

  test('triggers rerender on success', () => {
    const env = makeEnv();
    const kid = seedDmaicK(env);
    const state = stateStub();
    let calls = 0;
    const handlers = buildHandlers({
      services: env.services,
      state,
      rerender: () => {
        calls += 1;
      }
    });
    handlers.KAIZEN_SCHEDULE_STEP_TODAY({ kaizenId: kid, catalogEntryId: 'cat_20' });
    assert.equal(calls, 1);
  });

  test('catches scheduleStep errors to state.lastError', () => {
    const env = makeEnv();
    const state = stateStub();
    // No seed → unknown kaizen.
    const handlers = buildHandlers({ services: env.services, state, rerender: () => {} });
    handlers.KAIZEN_SCHEDULE_STEP_TODAY({ kaizenId: 'nope', catalogEntryId: 'x' });
    assert.ok(state.lastError);
  });
});

describe('KAIZEN_SCHEDULE_STEP_WEEK handler', () => {
  test('sets location.hash to #week (MVP routing)', () => {
    const env = makeEnv();
    const state = stateStub();
    const handlers = buildHandlers({ services: env.services, state, rerender: () => {} });
    const fakeLocation = { hash: '#portfolio' };
    const priorLoc = globalThis.location;
    globalThis.location = fakeLocation;
    try {
      handlers.KAIZEN_SCHEDULE_STEP_WEEK({ kaizenId: 'k_a', catalogEntryId: 'cat_1' });
      assert.equal(fakeLocation.hash, '#week');
    } finally {
      globalThis.location = priorLoc;
    }
  });

  test('no-op without payload', () => {
    const env = makeEnv();
    const state = stateStub();
    const handlers = buildHandlers({ services: env.services, state, rerender: () => {} });
    // No throw even when payload is absent.
    handlers.KAIZEN_SCHEDULE_STEP_WEEK({});
    handlers.KAIZEN_SCHEDULE_STEP_WEEK(null);
    assert.ok(true);
  });
});

describe('Portfolio renders completedStepsByKaizenId through renderApp', () => {
  test('renderApp on /portfolio uses kaizenService.getCompletedStepsByKaizenId()', () => {
    const env = makeEnv();
    const kid = seedDmaicK(env);
    // Pre-complete cat_20 via the service.
    env.services.kaizenService.completeStep({
      kaizenId: kid,
      catalogEntryId: 'cat_20',
      userId: DEFAULT_USER.id
    });
    const state = stateStub();
    state.expandedKaizenId = kid;

    // Build a minimal render surface: mount root.
    const doc = globalThis.document;
    globalThis.document = {
      getElementById: () => ({ innerHTML: '' })
    };
    let mountedHtml = '';
    const origGetById = globalThis.document.getElementById;
    globalThis.document.getElementById = () => ({
      set innerHTML(html) {
        mountedHtml = html;
      },
      get innerHTML() {
        return mountedHtml;
      }
    });
    try {
      renderApp(env.services, state);
    } finally {
      globalThis.document = doc;
    }
    assert.match(mountedHtml, /data-step-status="done"/);
    assert.match(mountedHtml, /data-catalog-entry-id="cat_20"/);
  });
});
