/**
 * Wiring tests for Sprint 9 Week page in app.js.
 *
 * - Route #week renders the Week page with a Plan-this-week CTA.
 * - WEEK_PROPOSE handler runs proposeWeek via WeeklyComposerService.
 * - WEEK_ACCEPT_DAY / WEEK_ACCEPT_ALL handlers wire through.
 * - computeMondayIso helper rolls arbitrary timestamps to Monday.
 */

// Block auto-start before importing app.js.
globalThis.__CADENCEPLAN_NO_AUTOSTART__ = true;

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  buildServices,
  buildHandlers,
  renderApp,
  computeMondayIso,
  DEFAULT_USER
} from '../js/app.js';
import { LocalStorageMock } from './_helpers/localStorageMock.js';
import { ClockService } from '../js/services/ClockService.js';
import { WEEKLY_COMPOSITIONS_KEY } from '../js/services/WeeklyComposerService.js';
import { COMPOSITIONS_KEY } from '../js/services/ComposerService.js';

// Minimal DOM shim so AppShell mount works in Node.
function stubDom() {
  const roots = new Map();
  const priorDoc = globalThis.document;
  globalThis.document = {
    getElementById(id) {
      let el = roots.get(id);
      if (!el) {
        el = {
          id,
          innerHTML: '',
          outerHTML: '',
          addEventListener() {},
          removeEventListener() {}
        };
        roots.set(id, el);
      }
      return el;
    }
  };
  // Track for cleanup (caller can restore if needed).
  roots._priorDoc = priorDoc;
  return roots;
}

const FROZEN_NOW = '2026-04-22T12:00:00Z'; // Wed → Mon of same week = 2026-04-20

function buildHarness() {
  const storage = new LocalStorageMock();
  const clock = new ClockService({ now: () => FROZEN_NOW });
  const services = buildServices({ storage, clock });
  const state = createMinState();
  return { services, state, storage, clock };
}

function createMinState() {
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
    portfolio: { intakeForm: null, expandedOpportunityId: null, oppFilter: 'all', oppSort: 'newest' },
    catalogView: 'list',
    baselineDialog: null,
    remeasurementDialog: null,
    closeKaizenDialog: null,
    kaizenAbandonForm: null,
    weekStartOverride: null
  };
}

// ---------------------------------------------------------------------------
// computeMondayIso
// ---------------------------------------------------------------------------

describe('computeMondayIso', () => {
  test('Monday → same date', () => {
    assert.equal(computeMondayIso('2026-04-20T10:00:00Z'), '2026-04-20');
  });

  test('Wednesday rolls back to Monday', () => {
    assert.equal(computeMondayIso('2026-04-22T12:00:00Z'), '2026-04-20');
  });

  test('Sunday rolls back to previous Monday', () => {
    // 2026-04-19 = Sunday → previous Monday = 2026-04-13
    assert.equal(computeMondayIso('2026-04-19T10:00:00Z'), '2026-04-13');
  });

  test('Friday rolls back to Monday of same week', () => {
    // 2026-04-24 = Friday → Monday = 2026-04-20
    assert.equal(computeMondayIso('2026-04-24T08:00:00Z'), '2026-04-20');
  });

  test('invalid iso falls back to today', () => {
    const out = computeMondayIso('not-a-date');
    assert.match(out, /^\d{4}-\d{2}-\d{2}$/);
  });
});

// ---------------------------------------------------------------------------
// Route rendering
// ---------------------------------------------------------------------------

describe('app.js — #week route rendering', () => {
  let roots;
  beforeEach(() => { roots = stubDom(); });

  test('renders Week page with Plan this week button when no weekly exists', () => {
    const { services, state } = buildHarness();
    state.route = 'week';
    renderApp(services, state);
    const root = roots.get('app-root');
    assert.ok(root, 'app-root element should exist');
    assert.match(root.innerHTML, /data-action="WEEK_PROPOSE"/);
    assert.match(root.innerHTML, /Plan this week/);
  });

  test('after proposeWeek, the Week page shows 5 day columns', () => {
    const { services, state } = buildHarness();
    state.route = 'week';
    services.weeklyComposerService.proposeWeek({
      weekStart: '2026-04-20',
      userId: DEFAULT_USER.id
    });
    renderApp(services, state);
    const root = roots.get('app-root');
    for (let i = 0; i < 5; i += 1) {
      assert.match(root.innerHTML, new RegExp(`data-day-idx="${i}"`));
    }
  });

  test('5 WEEK_ACCEPT_DAY buttons present after proposeWeek', () => {
    const { services, state } = buildHarness();
    state.route = 'week';
    services.weeklyComposerService.proposeWeek({
      weekStart: '2026-04-20',
      userId: DEFAULT_USER.id
    });
    renderApp(services, state);
    const root = roots.get('app-root');
    const matches = root.innerHTML.match(/data-action="WEEK_ACCEPT_DAY"/g);
    assert.equal(matches?.length, 5);
  });

  test('WEEK_ACCEPT_ALL button present', () => {
    const { services, state } = buildHarness();
    state.route = 'week';
    services.weeklyComposerService.proposeWeek({
      weekStart: '2026-04-20',
      userId: DEFAULT_USER.id
    });
    renderApp(services, state);
    const root = roots.get('app-root');
    assert.match(root.innerHTML, /data-action="WEEK_ACCEPT_ALL"/);
  });
});

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

describe('buildHandlers — WEEK_PROPOSE', () => {
  let roots;
  beforeEach(() => { roots = stubDom(); });

  test('runs proposeWeek + persists under WEEKLY_COMPOSITIONS_KEY', () => {
    const { services, state, storage } = buildHarness();
    let renders = 0;
    const rerender = () => { renders += 1; };
    const handlers = buildHandlers({ services, state, rerender });
    handlers.WEEK_PROPOSE({ weekStart: '2026-04-20' });
    const map = services.repo.read(WEEKLY_COMPOSITIONS_KEY);
    const keys = Object.keys(map ?? {});
    assert.equal(keys.length, 1);
    assert.equal(renders, 1);
  });

  test('defaults weekStart to current Monday when not in payload', () => {
    const { services, state } = buildHarness();
    const handlers = buildHandlers({ services, state, rerender: () => {} });
    handlers.WEEK_PROPOSE(null);
    const map = services.repo.read(WEEKLY_COMPOSITIONS_KEY);
    const keys = Object.keys(map ?? {});
    assert.equal(keys.length, 1);
    const weekly = map[keys[0]];
    assert.equal(weekly.weekStart, '2026-04-20');
  });
});

describe('buildHandlers — WEEK_ACCEPT_ALL', () => {
  let roots;
  beforeEach(() => { roots = stubDom(); });

  test('creates 5 Compositions in COMPOSITIONS_KEY', () => {
    const { services, state } = buildHarness();
    const handlers = buildHandlers({ services, state, rerender: () => {} });
    handlers.WEEK_PROPOSE({ weekStart: '2026-04-20' });
    const weeklyMap = services.repo.read(WEEKLY_COMPOSITIONS_KEY);
    const weeklyId = Object.keys(weeklyMap)[0];
    handlers.WEEK_ACCEPT_ALL({ weeklyCompositionId: weeklyId });
    const comps = services.repo.read(COMPOSITIONS_KEY);
    assert.equal(Object.keys(comps ?? {}).length, 5);
  });

  test('no-op when payload missing weeklyCompositionId', () => {
    const { services, state } = buildHarness();
    const handlers = buildHandlers({ services, state, rerender: () => {} });
    handlers.WEEK_PROPOSE({ weekStart: '2026-04-20' });
    handlers.WEEK_ACCEPT_ALL(null);
    // still PROPOSED
    const weeklyMap = services.repo.read(WEEKLY_COMPOSITIONS_KEY);
    const weekly = Object.values(weeklyMap)[0];
    assert.equal(weekly.state, 'PROPOSED');
  });
});

describe('buildHandlers — WEEK_ACCEPT_DAY', () => {
  let roots;
  beforeEach(() => { roots = stubDom(); });

  test('accepts a single day', () => {
    const { services, state } = buildHarness();
    const handlers = buildHandlers({ services, state, rerender: () => {} });
    handlers.WEEK_PROPOSE({ weekStart: '2026-04-20' });
    const weeklyMap = services.repo.read(WEEKLY_COMPOSITIONS_KEY);
    const weeklyId = Object.keys(weeklyMap)[0];
    handlers.WEEK_ACCEPT_DAY({ weeklyCompositionId: weeklyId, dayIndex: 2 });
    const comps = services.repo.read(COMPOSITIONS_KEY);
    assert.equal(Object.keys(comps ?? {}).length, 1);
  });

  test('no-op when dayIndex is not a number', () => {
    const { services, state } = buildHarness();
    const handlers = buildHandlers({ services, state, rerender: () => {} });
    handlers.WEEK_PROPOSE({ weekStart: '2026-04-20' });
    const weeklyMap = services.repo.read(WEEKLY_COMPOSITIONS_KEY);
    const weeklyId = Object.keys(weeklyMap)[0];
    handlers.WEEK_ACCEPT_DAY({ weeklyCompositionId: weeklyId, dayIndex: 'foo' });
    const comps = services.repo.read(COMPOSITIONS_KEY) ?? {};
    assert.equal(Object.keys(comps).length, 0);
  });
});
