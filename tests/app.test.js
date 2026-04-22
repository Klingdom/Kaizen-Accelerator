/**
 * Integration tests for /js/app.js — wires services + handlers end-to-end.
 *
 * We run everything through a pure-Node environment (no `document`), so
 * `start()` and `renderApp()` paths that touch the DOM are not executed
 * here. Instead, we test `buildServices`, `buildComposerInput`,
 * `buildHandlers`, and `computeDaysSinceSignup`.
 */

// Set a flag so importing app.js does NOT auto-start (no DOM available).
globalThis.__CADENCEPLAN_NO_AUTOSTART__ = true;

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { LocalStorageMock } from './_helpers/localStorageMock.js';
import { ClockService } from '../js/services/ClockService.js';
import {
  buildServices,
  buildComposerInput,
  buildHandlers,
  computeDaysSinceSignup,
  DEFAULT_USER
} from '../js/app.js';
import { CATALOG_KEY } from '../js/services/CatalogService.js';
import {
  COMPOSITIONS_KEY,
  ACTIVITIES_KEY
} from '../js/services/ComposerService.js';
import {
  CycleProposed,
  CycleAccepted,
  CycleRejected
} from '../js/events/events.js';

const FROZEN = '2026-04-21T08:00:00Z';

function makeEnv() {
  const storage = new LocalStorageMock();
  const clock = new ClockService({ now: () => FROZEN });
  const services = buildServices({ storage, clock });
  return { storage, clock, services };
}

describe('app.buildServices', () => {
  test('returns a service bundle with repo + bus + clock + services', () => {
    const { services } = makeEnv();
    assert.ok(services.repo);
    assert.ok(services.bus);
    assert.ok(services.clock);
    assert.ok(services.catalogService);
    assert.ok(services.composerService);
  });

  test('seeds the catalog on first boot', () => {
    const { services } = makeEnv();
    const catalog = services.repo.read(CATALOG_KEY) ?? {};
    // Browser seed has 9 entries (min catalog + cer_daily_standup).
    assert.ok(Object.keys(catalog).length >= 8);
  });

  test('does not re-seed if catalog already populated (idempotent)', () => {
    const storage = new LocalStorageMock();
    const clock = new ClockService({ now: () => FROZEN });
    const first = buildServices({ storage, clock });
    // Add a synthetic extra entry to prove no clobber.
    const catMap = first.repo.read(CATALOG_KEY);
    catMap['z_custom'] = { id: 'z_custom', name: 'custom' };
    first.repo.write(CATALOG_KEY, catMap);

    buildServices({ storage, clock });
    const after = storage.getItem(CATALOG_KEY);
    assert.ok(after.includes('z_custom'));
  });

  test('boot creates bamx:v1:meta', () => {
    const { storage } = makeEnv();
    assert.ok(storage.getItem('bamx:v1:meta'));
  });
});

describe('app.buildComposerInput', () => {
  test('builds a valid daily composer input', () => {
    const clock = new ClockService({ now: () => FROZEN });
    const input = buildComposerInput(clock);
    assert.equal(input.cycleType, 'DAILY');
    assert.equal(input.userId, DEFAULT_USER.id);
    assert.equal(input.dailyCapacityMinutes, 480);
    assert.equal(typeof input.date, 'string');
    assert.match(input.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(input.activeKaizen);
    assert.equal(input.externalMinutesToday, 0);
  });

  test('date field reflects clock', () => {
    const clock = new ClockService({ now: () => '2025-12-15T12:00:00Z' });
    const input = buildComposerInput(clock);
    assert.equal(input.date, '2025-12-15');
  });
});

describe('app.computeDaysSinceSignup', () => {
  test('returns 0 for same-day', () => {
    assert.equal(
      computeDaysSinceSignup('2026-04-21T00:00:00Z', '2026-04-21T09:00:00Z'),
      0
    );
  });

  test('returns 7 for 7 days later', () => {
    assert.equal(
      computeDaysSinceSignup('2026-04-14T00:00:00Z', '2026-04-21T00:00:00Z'),
      7
    );
  });

  test('returns 0 for a future createdAt (defensive)', () => {
    assert.equal(
      computeDaysSinceSignup('2099-01-01T00:00:00Z', '2026-04-21T00:00:00Z'),
      0
    );
  });

  test('returns 0 on invalid input', () => {
    assert.equal(computeDaysSinceSignup('nope', 'also nope'), 0);
  });
});

describe('app.buildHandlers — integration', () => {
  let env;
  let state;
  let rerenderCalls;
  let handlers;

  beforeEach(() => {
    env = makeEnv();
    state = {
      route: 'today',
      params: {},
      composerLoading: false,
      infeasibleExplain: null,
      lastError: null,
      fineTune: {
        open: false,
        capacityMinutes: 480,
        externalMinutesToday: 0,
        activeKaizenId: 'k_cadenceplan_mvp',
        availableKaizens: [],
        _snapshotBeforeChange: null
      },
      openDialog: null
    };
    rerenderCalls = 0;
    const rerender = () => { rerenderCalls += 1; };
    handlers = buildHandlers({
      services: env.services,
      state,
      rerender
    });
  });

  test('exposes AUTO_PLAN, ACCEPT, EDIT, REJECT, START_ACTIVITY', () => {
    for (const k of ['AUTO_PLAN', 'ACCEPT', 'EDIT', 'REJECT', 'START_ACTIVITY']) {
      assert.equal(typeof handlers[k], 'function', `missing handler ${k}`);
    }
  });

  test('exposes Sprint 5 handlers: OPEN_CLOSE_DIALOG, SUBMIT_CLOSE_DIALOG, OPEN_SKIP_MODAL, SUBMIT_SKIP_MODAL, FINE_TUNE_TOGGLE, FINE_TUNE_APPLY', () => {
    const keys = [
      'OPEN_CLOSE_DIALOG',
      'CLOSE_CLOSE_DIALOG',
      'SUBMIT_CLOSE_DIALOG',
      'OPEN_SKIP_MODAL',
      'CLOSE_SKIP_MODAL',
      'SUBMIT_SKIP_MODAL',
      'FINE_TUNE_TOGGLE',
      'FINE_TUNE_CANCEL',
      'FINE_TUNE_APPLY',
      'CAPACITY_CHANGE',
      'EXTERNAL_MEETINGS_CHANGE',
      'PROJECT_FOCUS_CHANGE'
    ];
    for (const k of keys) {
      assert.equal(typeof handlers[k], 'function', `missing handler ${k}`);
    }
  });

  test('AUTO_PLAN composes a day and persists the Composition', () => {
    handlers.AUTO_PLAN({});
    const comps = env.services.repo.read(COMPOSITIONS_KEY);
    assert.ok(comps);
    const ids = Object.keys(comps);
    assert.ok(ids.length >= 1);
    assert.equal(comps[ids[0]].state, 'PROPOSED');
  });

  test('AUTO_PLAN publishes CycleProposed', () => {
    const received = [];
    env.services.bus.subscribe(CycleProposed, (p) => received.push(p));
    handlers.AUTO_PLAN({});
    assert.equal(received.length, 1);
  });

  test('AUTO_PLAN triggers re-renders (loading flip)', () => {
    handlers.AUTO_PLAN({});
    assert.ok(rerenderCalls >= 2, 'expected ≥ 2 rerenders (loading start + finish)');
    assert.equal(state.composerLoading, false);
  });

  test('ACCEPT atomically flips Composition + children', () => {
    handlers.AUTO_PLAN({});
    const comps = env.services.repo.read(COMPOSITIONS_KEY);
    const compId = Object.keys(comps)[0];

    const acceptReceived = [];
    env.services.bus.subscribe(CycleAccepted, (p) => acceptReceived.push(p));

    handlers.ACCEPT({ compositionId: compId });

    const after = env.services.repo.read(COMPOSITIONS_KEY)[compId];
    assert.equal(after.state, 'ACCEPTED');
    const acts = env.services.repo.read(ACTIVITIES_KEY);
    for (const a of Object.values(acts).filter((a) => a.compositionId === compId)) {
      assert.equal(a.state, 'SCHEDULED');
    }
    assert.equal(acceptReceived.length, 1);
  });

  test('ACCEPT with missing compositionId is a no-op', () => {
    handlers.ACCEPT({});
    handlers.ACCEPT();
    // No crash; no state.lastError
    assert.equal(state.lastError, null);
  });

  test('REJECT with confirm=true flips to REJECTED', () => {
    handlers.AUTO_PLAN({});
    const comps = env.services.repo.read(COMPOSITIONS_KEY);
    const compId = Object.keys(comps)[0];

    const originalConfirm = globalThis.confirm;
    globalThis.confirm = () => true;

    const rejReceived = [];
    env.services.bus.subscribe(CycleRejected, (p) => rejReceived.push(p));
    try {
      handlers.REJECT({ compositionId: compId });
    } finally {
      globalThis.confirm = originalConfirm;
    }

    const after = env.services.repo.read(COMPOSITIONS_KEY)[compId];
    assert.equal(after.state, 'REJECTED');
    assert.equal(rejReceived.length, 1);
  });

  test('REJECT with confirm=false aborts', () => {
    handlers.AUTO_PLAN({});
    const comps = env.services.repo.read(COMPOSITIONS_KEY);
    const compId = Object.keys(comps)[0];

    const originalConfirm = globalThis.confirm;
    globalThis.confirm = () => false;
    try {
      handlers.REJECT({ compositionId: compId });
    } finally {
      globalThis.confirm = originalConfirm;
    }
    const after = env.services.repo.read(COMPOSITIONS_KEY)[compId];
    assert.equal(after.state, 'PROPOSED');
  });

  test('EDIT is a placeholder (Sprint 6 — drag/drop composer)', () => {
    const originalAlert = globalThis.alert;
    let alertMsg = null;
    globalThis.alert = (m) => { alertMsg = m; };
    try {
      handlers.EDIT({ compositionId: 'c1' });
    } finally {
      globalThis.alert = originalAlert;
    }
    assert.match(alertMsg, /Sprint 6/);
  });

  test('START_ACTIVITY wires to ActivityService.start (Sprint 5)', () => {
    // Compose + accept so SAs are SCHEDULED.
    handlers.AUTO_PLAN({});
    const comps = env.services.repo.read(COMPOSITIONS_KEY);
    const compId = Object.keys(comps)[0];
    handlers.ACCEPT({ compositionId: compId });
    const acts = env.services.repo.read(ACTIVITIES_KEY);
    const firstSa = Object.values(acts).find(
      (a) => a.compositionId === compId && a.state === 'SCHEDULED'
    );
    assert.ok(firstSa, 'no SCHEDULED activity found');
    handlers.START_ACTIVITY({ activityId: firstSa.id });
    const after = env.services.repo.read(ACTIVITIES_KEY)[firstSa.id];
    assert.equal(after.state, 'IN_PROGRESS');
  });

  test('AUTO_PLAN → ACCEPT end-to-end populates the ACTIVE composition', () => {
    handlers.AUTO_PLAN({});
    const comps = env.services.repo.read(COMPOSITIONS_KEY);
    const compId = Object.keys(comps)[0];
    handlers.ACCEPT({ compositionId: compId });
    const active = env.services.composerService.getActiveComposition(
      DEFAULT_USER.id
    );
    assert.ok(active);
    assert.equal(active.composition.state, 'ACCEPTED');
    for (const a of active.activities) {
      assert.equal(a.state, 'SCHEDULED');
    }
  });
});

describe('app — DEFAULT_USER identity', () => {
  test('DEFAULT_USER email matches Phil', () => {
    assert.equal(DEFAULT_USER.email, 'phil@mediafier.ai');
  });

  test('DEFAULT_USER dailyCapacityMinutes = 480', () => {
    assert.equal(DEFAULT_USER.dailyCapacityMinutes, 480);
  });

  test('DEFAULT_USER is PRACTITIONER role', () => {
    assert.deepEqual(DEFAULT_USER.role, ['PRACTITIONER']);
  });
});
