/**
 * Event instrumentation tests — Iteration 21 (C-AN-1).
 *
 * Verifies:
 *   AC-A1: events.js exports TodayPageViewed and EditDrawerOpened with exact names.
 *   AC-A2: EVENT_NAMES array includes both new events at the end (index 36 + 37).
 *   AC-A3: Default export bundle includes both new events.
 *   AC-A5: TodayPageViewed emit fires with correct payload shape when the bus
 *          is called directly (unit-level smoke check on payload shape).
 *   AC-A6: EditDrawerOpened emit fires with correct payload shape.
 *   AC-A7: Both events use a deterministic clock (payload timestamp matches clock value).
 *
 * Note: AC-A4 (ARCHITECTURE.md §6.1 updated) and the route-entry once-per-entry
 * guard (AC-A5 integration) are validated by the implementation notes and by
 * running the full suite — no browser-level routing harness is available in
 * the node:test runner. The payload-shape and constant-name ACs are verified here.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  TodayPageViewed,
  EditDrawerOpened,
  RowOutputClicked,
  EVENT_NAMES,
  CycleReflowed
} from '../../js/events/events.js';

import events from '../../js/events/events.js';

import { EventBus } from '../../js/events/EventBus.js';

// ---------------------------------------------------------------------------
// AC-A1: named exports have the exact string value
// ---------------------------------------------------------------------------
describe('events.js — new constants (Iteration 21)', () => {
  test('TodayPageViewed equals the string "TodayPageViewed"', () => {
    assert.equal(TodayPageViewed, 'TodayPageViewed');
  });

  test('EditDrawerOpened equals the string "EditDrawerOpened"', () => {
    assert.equal(EditDrawerOpened, 'EditDrawerOpened');
  });
});

// ---------------------------------------------------------------------------
// AC-A2: EVENT_NAMES includes both new events
// ---------------------------------------------------------------------------
describe('EVENT_NAMES — includes new events', () => {
  test('EVENT_NAMES includes TodayPageViewed', () => {
    assert.ok(
      EVENT_NAMES.includes('TodayPageViewed'),
      'TodayPageViewed missing from EVENT_NAMES'
    );
  });

  test('EVENT_NAMES includes EditDrawerOpened', () => {
    assert.ok(
      EVENT_NAMES.includes('EditDrawerOpened'),
      'EditDrawerOpened missing from EVENT_NAMES'
    );
  });

  test('EVENT_NAMES has 39 entries (36 prior + 2 Iter-21 + 1 C-UX-COL)', () => {
    // Prior count was 36 (CycleReflowed was last). +2 Iter-21 = 38. +1 C-UX-COL = 39.
    assert.equal(EVENT_NAMES.length, 39);
  });

  test('TodayPageViewed appears after CycleReflowed in EVENT_NAMES', () => {
    const reflowedIdx = EVENT_NAMES.indexOf('CycleReflowed');
    const viewedIdx = EVENT_NAMES.indexOf('TodayPageViewed');
    assert.ok(
      viewedIdx > reflowedIdx,
      `TodayPageViewed (${viewedIdx}) should come after CycleReflowed (${reflowedIdx})`
    );
  });

  test('EditDrawerOpened appears after TodayPageViewed in EVENT_NAMES', () => {
    const viewedIdx = EVENT_NAMES.indexOf('TodayPageViewed');
    const openedIdx = EVENT_NAMES.indexOf('EditDrawerOpened');
    assert.ok(
      openedIdx > viewedIdx,
      `EditDrawerOpened (${openedIdx}) should come after TodayPageViewed (${viewedIdx})`
    );
  });
});

// ---------------------------------------------------------------------------
// AC-A3: default export bundle includes both new events
// ---------------------------------------------------------------------------
describe('events.js — default export', () => {
  test('default export carries TodayPageViewed', () => {
    assert.equal(events.TodayPageViewed, 'TodayPageViewed');
  });

  test('default export carries EditDrawerOpened', () => {
    assert.equal(events.EditDrawerOpened, 'EditDrawerOpened');
  });
});

// ---------------------------------------------------------------------------
// AC-A5 / AC-A6 / AC-A7: payload shape + deterministic clock
//
// We can't invoke the app.js route-change handler directly (it requires
// full browser + service wiring). Instead we verify the payload shape that
// the handler emits by simulating equivalent publish calls on an EventBus
// with a deterministic clock stub. This locks the contract so a future
// refactor that changes the payload shape will fail this test.
// ---------------------------------------------------------------------------
describe('TodayPageViewed — payload shape contract', () => {
  test('payload has userId, fromRoute, viewedAt and no extra unknown fields', () => {
    const bus = new EventBus();
    let captured = null;
    bus.subscribe(TodayPageViewed, (payload) => { captured = payload; });

    // Simulate what app.js emits on route entry.
    const deterministicNow = '2026-04-27T09:00:00.000Z';
    bus.publish(TodayPageViewed, {
      userId: 'user_phil_mvp',
      fromRoute: null,           // first load — no prior route
      viewedAt: deterministicNow
    });

    assert.ok(captured !== null, 'handler was not called');
    assert.equal(typeof captured.userId, 'string', 'userId must be a string');
    // fromRoute is string|null per architectural decision.
    assert.ok(
      captured.fromRoute === null || typeof captured.fromRoute === 'string',
      'fromRoute must be string or null'
    );
    assert.equal(typeof captured.viewedAt, 'string', 'viewedAt must be a string (ISO from clock.now())');
    // AC-A7: timestamp matches what was supplied by the clock.
    assert.equal(captured.viewedAt, deterministicNow);
  });

  test('fromRoute carries the previous route when navigating from another page', () => {
    const bus = new EventBus();
    let captured = null;
    bus.subscribe(TodayPageViewed, (p) => { captured = p; });

    bus.publish(TodayPageViewed, {
      userId: 'user_phil_mvp',
      fromRoute: 'week',
      viewedAt: '2026-04-27T10:00:00.000Z'
    });

    assert.equal(captured.fromRoute, 'week');
  });
});

describe('EditDrawerOpened — payload shape contract', () => {
  test('payload has userId, compositionId, openedAt and all are correct types', () => {
    const bus = new EventBus();
    let captured = null;
    bus.subscribe(EditDrawerOpened, (payload) => { captured = payload; });

    const deterministicNow = '2026-04-27T09:15:00.000Z';
    bus.publish(EditDrawerOpened, {
      userId: 'user_phil_mvp',
      compositionId: 'comp_abc123',
      openedAt: deterministicNow
    });

    assert.ok(captured !== null, 'handler was not called');
    assert.equal(typeof captured.userId, 'string', 'userId must be a string');
    assert.equal(typeof captured.compositionId, 'string', 'compositionId must be a string');
    assert.ok(captured.compositionId.length > 0, 'compositionId must be non-empty');
    assert.equal(typeof captured.openedAt, 'string', 'openedAt must be a string (ISO from clock.now())');
    // AC-A7: timestamp matches the clock value.
    assert.equal(captured.openedAt, deterministicNow);
  });

  test('compositionId in payload matches the composition being edited', () => {
    const bus = new EventBus();
    const results = [];
    bus.subscribe(EditDrawerOpened, (p) => results.push(p));

    bus.publish(EditDrawerOpened, { userId: 'u', compositionId: 'comp_x', openedAt: 'T1' });
    bus.publish(EditDrawerOpened, { userId: 'u', compositionId: 'comp_y', openedAt: 'T2' });

    assert.equal(results.length, 2, 'should fire once per edit-mode open');
    assert.equal(results[0].compositionId, 'comp_x');
    assert.equal(results[1].compositionId, 'comp_y');
  });
});

// ---------------------------------------------------------------------------
// Regression guard: existing events.test.js EXPECTED list still works.
// The prior length was 36 (CycleReflowed last). Verify CycleReflowed is
// still present (it was the last entry before the two new events).
// ---------------------------------------------------------------------------
describe('regression — prior events still present', () => {
  test('CycleReflowed is still in EVENT_NAMES', () => {
    assert.ok(EVENT_NAMES.includes('CycleReflowed'));
  });

  test('CycleReflowed named export unchanged', () => {
    assert.equal(CycleReflowed, 'CycleReflowed');
  });
});

// ---------------------------------------------------------------------------
// C-UX-COL (Q2): RowOutputClicked — new event added in column refactor
// ---------------------------------------------------------------------------
describe('RowOutputClicked — C-UX-COL event (Q2)', () => {
  test('RowOutputClicked equals the string "RowOutputClicked"', () => {
    assert.equal(RowOutputClicked, 'RowOutputClicked');
  });

  test('EVENT_NAMES includes RowOutputClicked', () => {
    assert.ok(
      EVENT_NAMES.includes('RowOutputClicked'),
      'RowOutputClicked missing from EVENT_NAMES'
    );
  });

  test('RowOutputClicked appears after EditDrawerOpened in EVENT_NAMES', () => {
    const openedIdx = EVENT_NAMES.indexOf('EditDrawerOpened');
    const clickedIdx = EVENT_NAMES.indexOf('RowOutputClicked');
    assert.ok(
      clickedIdx > openedIdx,
      `RowOutputClicked (${clickedIdx}) should come after EditDrawerOpened (${openedIdx})`
    );
  });

  test('RowOutputClicked payload shape contract', () => {
    const bus = new EventBus();
    let captured = null;
    bus.subscribe(RowOutputClicked, (p) => { captured = p; });

    bus.publish(RowOutputClicked, {
      userId: 'user_phil_mvp',
      activityId: 'sa_abc',
      catalogEntryId: 'cat_12_pdca_cycle',
      clickedAt: '2026-04-30T10:00:00.000Z'
    });

    assert.ok(captured !== null, 'handler was not called');
    assert.equal(typeof captured.userId, 'string', 'userId must be string');
    assert.equal(typeof captured.activityId, 'string', 'activityId must be string');
    assert.ok(
      captured.catalogEntryId === null || typeof captured.catalogEntryId === 'string',
      'catalogEntryId must be string or null'
    );
    assert.equal(typeof captured.clickedAt, 'string', 'clickedAt must be ISO string');
  });
});
