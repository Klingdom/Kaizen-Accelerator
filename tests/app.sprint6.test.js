/**
 * Tests for Sprint 6 app.js wiring: handleActivityCompleted, boot-time
 * subscriber behavior, and renderApp of the new Kaizen route.
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  buildServices,
  handleActivityCompleted,
  renderApp,
  buildHandlers,
  DEFAULT_USER
} from '../js/app.js';
import { ClockService } from '../js/services/ClockService.js';
import { ACTIVITIES_KEY } from '../js/services/ComposerService.js';
import { REFLECTIONS_KEY } from '../js/services/ReflectionService.js';
import { LocalStorageMock } from './_helpers/localStorageMock.js';

const FROZEN_NOW = '2026-04-21T09:00:00Z';

function buildEnv() {
  const storage = new LocalStorageMock();
  const clock = new ClockService({ now: () => FROZEN_NOW });
  const services = buildServices({ storage, clock });
  return { services, clock, storage };
}

describe('buildServices — Sprint 6', () => {
  test('wires ReflectionService, FrictionService, KaizenService', () => {
    const { services } = buildEnv();
    assert.ok(services.reflectionService);
    assert.ok(services.frictionService);
    assert.ok(services.kaizenService);
  });

  test('reflectionService has FrictionService wired', () => {
    const { services } = buildEnv();
    // Indirect: capture a reflection with frictionFlag=true shouldn't
    // throw FRICTION_SERVICE_UNAVAILABLE.
    const sa = {
      id: 'sa_x',
      userId: DEFAULT_USER.id,
      plannedDurationMinutes: 30,
      actualStartAt: '2026-04-21T08:30:00Z',
      actualEndAt: '2026-04-21T09:00:00Z'
    };
    services.repo.write(ACTIVITIES_KEY, { [sa.id]: sa });
    const stub = services.reflectionService.stubOnClose(sa);
    const out = services.reflectionService.capture(stub.id, {
      whatToImprove: 'X',
      frictionFlag: true,
      frictionSummary: 'summary',
      frictionTag: 'OTHER'
    });
    assert.ok(out.frictionSignal);
  });
});

describe('handleActivityCompleted', () => {
  let env;
  beforeEach(() => {
    env = buildEnv();
    // Seed an IN_PROGRESS activity + flip to CLOSED in repo.
    const sa = {
      id: 'sa_test',
      compositionId: 'c_1',
      catalogEntryId: 'cat_1',
      userId: DEFAULT_USER.id,
      plannedDurationMinutes: 60,
      actualStartAt: '2026-04-21T08:00:00Z',
      actualEndAt: '2026-04-21T09:10:00Z',
      state: 'CLOSED'
    };
    env.services.repo.write(ACTIVITIES_KEY, { [sa.id]: sa });
    env.state = { reflectionSheet: null, lastError: null };
  });

  test('stubs a reflection when payload has a scheduledActivityId', () => {
    handleActivityCompleted(env.services, env.state, {
      scheduledActivityId: 'sa_test'
    });
    const map = env.services.repo.read(REFLECTIONS_KEY) ?? {};
    const rs = Object.values(map);
    assert.equal(rs.length, 1);
    assert.equal(rs[0].pending, true);
  });

  test('opens the reflectionSheet state', () => {
    handleActivityCompleted(env.services, env.state, {
      scheduledActivityId: 'sa_test'
    });
    assert.ok(env.state.reflectionSheet);
    assert.equal(env.state.reflectionSheet.activityId, 'sa_test');
    assert.equal(env.state.reflectionSheet.frictionChecked, false);
  });

  test('idempotent: second call does not double-stub', () => {
    handleActivityCompleted(env.services, env.state, {
      scheduledActivityId: 'sa_test'
    });
    handleActivityCompleted(env.services, env.state, {
      scheduledActivityId: 'sa_test'
    });
    const map = env.services.repo.read(REFLECTIONS_KEY) ?? {};
    assert.equal(Object.keys(map).length, 1);
  });

  test('no-op when payload missing scheduledActivityId', () => {
    handleActivityCompleted(env.services, env.state, {});
    assert.equal(env.state.reflectionSheet, null);
  });

  test('no-op when activity not in repo', () => {
    handleActivityCompleted(env.services, env.state, {
      scheduledActivityId: 'sa_ghost'
    });
    assert.equal(env.state.reflectionSheet, null);
  });

  test('skipped when the reflection already non-pending', () => {
    const stub = env.services.reflectionService.stubOnClose({
      id: 'sa_test',
      userId: DEFAULT_USER.id,
      plannedDurationMinutes: 60,
      actualStartAt: '2026-04-21T08:00:00Z',
      actualEndAt: '2026-04-21T09:10:00Z'
    });
    env.services.reflectionService.capture(stub.id, {
      whatWentWell: 'already'
    });
    env.state.reflectionSheet = null;
    handleActivityCompleted(env.services, env.state, {
      scheduledActivityId: 'sa_test'
    });
    assert.equal(env.state.reflectionSheet, null);
  });
});

describe('buildHandlers — Sprint 6 kaizen actions', () => {
  let env;
  let handlers;
  let state;
  let rerenderCount;
  beforeEach(() => {
    env = buildEnv();
    rerenderCount = 0;
    state = {
      reflectionSheet: null,
      wizard: null,
      lastError: null,
      composerConfig: null,
      openDialog: null
    };
    const rerender = () => {
      rerenderCount += 1;
    };
    handlers = buildHandlers({ services: env.services, state, rerender });
  });

  test('WRW_OPEN populates wizard state', () => {
    handlers.WRW_OPEN({});
    assert.ok(state.wizard);
    assert.equal(state.wizard.step, 1);
    assert.ok(rerenderCount >= 1);
  });

  test('WRW_CLOSE clears wizard', () => {
    state.wizard = { step: 2, clusters: [] };
    handlers.WRW_CLOSE({});
    assert.equal(state.wizard, null);
  });

  test('WRW_NEXT advances step', () => {
    state.wizard = { step: 1, clusters: [], selectedTag: null };
    handlers.WRW_NEXT({});
    assert.equal(state.wizard.step, 2);
  });

  test('WRW_BACK retreats step (min 1)', () => {
    state.wizard = { step: 2, clusters: [] };
    handlers.WRW_BACK({});
    assert.equal(state.wizard.step, 1);
    handlers.WRW_BACK({});
    assert.equal(state.wizard.step, 1);
  });

  test('SKIP_REFLECTION clears reflectionSheet', () => {
    state.reflectionSheet = { reflectionId: 'r', activityId: 'a' };
    handlers.SKIP_REFLECTION({});
    assert.equal(state.reflectionSheet, null);
  });

  test('TOGGLE_FRICTION toggles frictionChecked', () => {
    state.reflectionSheet = {
      reflectionId: 'r',
      activityId: 'a',
      frictionChecked: false
    };
    handlers.TOGGLE_FRICTION({}, { element: { checked: true } });
    assert.equal(state.reflectionSheet.frictionChecked, true);
  });
});
