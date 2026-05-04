/**
 * Smoke test — exercises the full `AUTO_PLAN → ACCEPT` path with the
 * actual browser catalog seed, exactly as the app.html flow runs.
 */

globalThis.__CADENCEPLAN_NO_AUTOSTART__ = true;

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { LocalStorageMock } from './_helpers/localStorageMock.js';
import { ClockService } from '../js/services/ClockService.js';
import { buildServices, buildHandlers, DEFAULT_USER } from '../js/app.js';

test('smoke: AUTO_PLAN produces a feasible PROPOSED composition with browser seed', () => {
  const storage = new LocalStorageMock();
  const clock = new ClockService({ now: () => '2026-04-21T08:00:00Z' });
  const services = buildServices({ storage, clock });
  const state = {
    route: 'today',
    params: {},
    composerLoading: false,
    infeasibleExplain: null,
    lastError: null
  };
  const handlers = buildHandlers({
    services,
    state,
    rerender: () => {}
  });
  handlers.AUTO_PLAN({});
  assert.equal(state.infeasibleExplain, null, 'composer should not be infeasible');
  const active = services.composerService.getActiveComposition(DEFAULT_USER.id);
  assert.ok(active);
  assert.equal(active.composition.state, 'PROPOSED');
  assert.ok(active.activities.length >= 7); // Iter 26: +1 lunch block
});

test('smoke: AUTO_PLAN → ACCEPT gives ACCEPTED + all SCHEDULED', () => {
  const storage = new LocalStorageMock();
  const clock = new ClockService({ now: () => '2026-04-21T08:00:00Z' });
  const services = buildServices({ storage, clock });
  const state = {
    route: 'today',
    params: {},
    composerLoading: false,
    infeasibleExplain: null,
    lastError: null
  };
  const handlers = buildHandlers({
    services,
    state,
    rerender: () => {}
  });
  handlers.AUTO_PLAN({});
  const active = services.composerService.getActiveComposition(DEFAULT_USER.id);
  handlers.ACCEPT({ compositionId: active.composition.id });
  const after = services.composerService.getActiveComposition(DEFAULT_USER.id);
  assert.equal(after.composition.state, 'ACCEPTED');
  for (const a of after.activities) {
    assert.equal(a.state, 'SCHEDULED', `${a.id} should be SCHEDULED`);
  }
});
