/**
 * P0 Regression test — "Today page gets stuck after accepting a schedule."
 *
 * Coordinator-filed bug (2026-04-30). Covers the full AUTO_PLAN → ACCEPT →
 * render pipeline that the existing test suite did NOT exercise.
 *
 * Coverage gap identified: no test called renderApp() on the 'today' route
 * after an ACCEPT action. The existing smoke test (tests/_smoke.test.js)
 * only checked service-layer state (composition.state, activity.state) —
 * never the rendered HTML that the user sees.
 *
 * These tests act as both the regression guard and the definitive spec:
 *   AC1: After ACCEPT, Today renders cycle-accepted (not cycle-proposed).
 *   AC2: After ACCEPT, the Accept button is absent (no data-action="ACCEPT").
 *   AC3: After ACCEPT, Start buttons are present (data-action="START_ACTIVITY").
 *   AC4: After ACCEPT, Skip buttons are present (data-action="OPEN_SKIP_MODAL").
 *   AC5: After ACCEPT, the Lunch block renders (Iter 26 injection).
 *   AC6: After ACCEPT → START_ACTIVITY, Today renders In-Progress activity.
 *   AC7: ACCEPT handler calls rerender() exactly once on success.
 *   AC8: ACCEPT with a bad compositionId shows ERROR toast + no stuck state.
 *   AC9: After ACCEPT, no infeasible banner is rendered.
 *   AC10: renderApp() produces non-empty HTML on the today route post-accept.
 *   AC11: After ACCEPT, composition state in repo is 'ACCEPTED'.
 *   AC12: After ACCEPT, all activities in repo are 'SCHEDULED'.
 */

globalThis.__CADENCEPLAN_NO_AUTOSTART__ = true;

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { LocalStorageMock } from './_helpers/localStorageMock.js';
import { ClockService } from '../js/services/ClockService.js';
import {
  buildServices,
  buildHandlers,
  buildComposerInput,
  renderApp,
  DEFAULT_USER
} from '../js/app.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FROZEN = '2026-04-30T09:00:00Z';

function makeEnv(nowIso = FROZEN) {
  const storage = new LocalStorageMock();
  const clock = new ClockService({ now: () => nowIso });
  const services = buildServices({ storage, clock });
  return { storage, clock, services };
}

/**
 * Full state object matching createState() shape, so renderApp() and
 * buildHandlers() receive the correct structure.
 */
function stateStub(overrides = {}) {
  return {
    route: 'today',
    params: {},
    composerLoading: false,
    infeasibleExplain: null,
    lastError: null,
    composerConfig: {
      capacityMinutes: DEFAULT_USER.dailyCapacityMinutes,
      externalMinutesToday: 0,
      activeKaizenId: 'k_cadenceplan_mvp',
      availableKaizens: []
    },
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
    baselineDialog: null,
    remeasurementDialog: null,
    closeKaizenDialog: null,
    kaizenAbandonForm: null,
    expandedKaizenId: null,
    rhythmExplainerDismissed: false,
    toast: null,
    editMode: null,
    whyPlanExpanded: false,
    // Iter 27 focus-trap handles — all null at boot.
    _focusTrap: {
      editDrawer: null,
      fineTuneDrawer: null,
      baselineDialog: null,
      kaizenCloseDialog: null,
      opportunityIntakeForm: null,
      outputArtifactDialog: null,
      reflectionSheet: null,
      remeasurementDialog: null,
      skipReasonModal: null,
      weeklyReflectionWizard: null
    },
    ...overrides
  };
}

/**
 * Build a fake DOM surface that captures the last innerHTML written by
 * renderApp() / mountHtml(). Used to inspect render output without a real
 * browser.
 */
function makeMockDom() {
  let mountedHtml = '';
  const mockEl = {
    set innerHTML(html) { mountedHtml = html; },
    get innerHTML() { return mountedHtml; }
  };
  const origDoc = globalThis.document;
  const mockDoc = {
    getElementById: (id) => id === 'app-root' ? mockEl : null,
    querySelector: () => null,  // focus-trap selectors
    activeElement: null
  };
  return {
    install() { globalThis.document = mockDoc; },
    restore() { globalThis.document = origDoc; },
    get html() { return mountedHtml; }
  };
}

/**
 * Run AUTO_PLAN via handlers, then accept the resulting composition.
 * Returns the compositionId of the accepted plan.
 */
function composeThenAccept(env, state, handlers) {
  handlers.AUTO_PLAN({});
  const active = env.services.composerService.getActiveComposition(DEFAULT_USER.id);
  assert.ok(active, 'AUTO_PLAN should produce an active composition');
  assert.equal(active.composition.state, 'PROPOSED');
  handlers.ACCEPT({ compositionId: active.composition.id });
  return active.composition.id;
}

// ---------------------------------------------------------------------------
// AC1-5: renderApp HTML output after ACCEPT
// ---------------------------------------------------------------------------
describe('P0 regression: Today page after ACCEPT — renderApp HTML', () => {
  let env, state, handlers, dom, compId;

  // Setup once for all ACs in this describe block.
  // Each test uses a fresh env + state to stay independent.

  test('AC1: renders cycle-accepted (not cycle-proposed) after ACCEPT', () => {
    env = makeEnv();
    state = stateStub();
    handlers = buildHandlers({ services: env.services, state, rerender: () => {} });
    dom = makeMockDom();
    dom.install();
    try {
      compId = composeThenAccept(env, state, handlers);
      renderApp(env.services, state);
      assert.ok(dom.html.includes('cycle-accepted'), 'Expected cycle-accepted in rendered HTML');
      assert.ok(!dom.html.includes('cycle-proposed'), 'Must NOT contain cycle-proposed after ACCEPT');
    } finally {
      dom.restore();
    }
  });

  test('AC2: Accept button absent after ACCEPT (no data-action="ACCEPT" in output)', () => {
    env = makeEnv();
    state = stateStub();
    handlers = buildHandlers({ services: env.services, state, rerender: () => {} });
    dom = makeMockDom();
    dom.install();
    try {
      composeThenAccept(env, state, handlers);
      renderApp(env.services, state);
      // The ACCEPT button must be gone — user cannot accept twice.
      assert.ok(
        !dom.html.includes('data-action="ACCEPT"'),
        'ACCEPT button must be absent from the today page after accepting'
      );
    } finally {
      dom.restore();
    }
  });

  test('AC3 (Iter 29): Calendar blocks present after ACCEPT (click-block opens Start/Skip via OPEN_BLOCK_DETAIL)', () => {
    // Iter 29 Phase 1: START_ACTIVITY and OPEN_SKIP_MODAL are no longer inline
    // on the calendar grid surface. They are accessible via the block-detail
    // popover triggered by OPEN_BLOCK_DETAIL (click on a calendar block).
    // This test confirms the calendar grid renders blocks for the ACCEPTED plan.
    env = makeEnv();
    state = stateStub();
    handlers = buildHandlers({ services: env.services, state, rerender: () => {} });
    dom = makeMockDom();
    dom.install();
    try {
      composeThenAccept(env, state, handlers);
      renderApp(env.services, state);
      // Calendar blocks must render (blocks carry OPEN_BLOCK_DETAIL action).
      assert.ok(
        dom.html.includes('cycle-block-positioned'),
        'Calendar blocks must appear for SCHEDULED activities after ACCEPT'
      );
      assert.ok(
        dom.html.includes('OPEN_BLOCK_DETAIL'),
        'OPEN_BLOCK_DETAIL action must be on blocks (click → Start/Skip in popover)'
      );
    } finally {
      dom.restore();
    }
  });

  test('AC4 (Iter 29): ACCEPTED calendar grid renders chip-communication blocks (standup, comm)', () => {
    // Iter 29: OPEN_SKIP_MODAL is no longer inline; it is in the block-detail popover.
    // This test confirms communication-bucket blocks render correctly post-ACCEPT.
    env = makeEnv();
    state = stateStub();
    handlers = buildHandlers({ services: env.services, state, rerender: () => {} });
    dom = makeMockDom();
    dom.install();
    try {
      composeThenAccept(env, state, handlers);
      renderApp(env.services, state);
      assert.ok(
        dom.html.includes('chip-communication'),
        'Communication blocks must appear in the ACCEPTED calendar grid'
      );
    } finally {
      dom.restore();
    }
  });

  test('AC5: Lunch block renders in ACCEPTED plan (Iter 26 injection)', () => {
    env = makeEnv();
    state = stateStub();
    handlers = buildHandlers({ services: env.services, state, rerender: () => {} });
    dom = makeMockDom();
    dom.install();
    try {
      composeThenAccept(env, state, handlers);
      renderApp(env.services, state);
      assert.ok(
        dom.html.includes('Lunch'),
        'Lunch block (Iter 26) must render in the ACCEPTED plan'
      );
    } finally {
      dom.restore();
    }
  });

  test('AC9: No infeasible banner after successful ACCEPT', () => {
    env = makeEnv();
    state = stateStub();
    handlers = buildHandlers({ services: env.services, state, rerender: () => {} });
    dom = makeMockDom();
    dom.install();
    try {
      composeThenAccept(env, state, handlers);
      renderApp(env.services, state);
      assert.ok(!dom.html.includes('infeasible'), 'No infeasible banner after successful ACCEPT');
    } finally {
      dom.restore();
    }
  });

  test('AC10: renderApp produces non-empty HTML on today route post-accept', () => {
    env = makeEnv();
    state = stateStub();
    handlers = buildHandlers({ services: env.services, state, rerender: () => {} });
    dom = makeMockDom();
    dom.install();
    try {
      composeThenAccept(env, state, handlers);
      renderApp(env.services, state);
      assert.ok(dom.html.length > 500, 'renderApp should produce substantial HTML');
      assert.ok(dom.html.includes('data-route="today"'), 'Should include data-route today');
    } finally {
      dom.restore();
    }
  });
});

// ---------------------------------------------------------------------------
// AC6: renderApp after START_ACTIVITY
// ---------------------------------------------------------------------------
describe('P0 regression: Today page after ACCEPT + START_ACTIVITY', () => {
  test('AC6 (Iter 29): After ACCEPT → START_ACTIVITY, calendar block shows IN_PROGRESS data-state', () => {
    // Iter 29 Phase 1: IN_PROGRESS state is encoded on the calendar block via
    // data-state="IN_PROGRESS". The elapsed timer and Close button are accessible
    // via the block-detail popover (OPEN_BLOCK_DETAIL) — not inline on the block surface.
    const env = makeEnv();
    const state = stateStub();
    const handlers = buildHandlers({ services: env.services, state, rerender: () => {} });
    const dom = makeMockDom();
    dom.install();
    try {
      composeThenAccept(env, state, handlers);

      // Find a non-lunch SCHEDULED activity to start.
      const active = env.services.composerService.getActiveComposition(DEFAULT_USER.id);
      const scheduledAct = active.activities.find(
        (a) => a.state === 'SCHEDULED' && a.bucket !== null
      );
      assert.ok(scheduledAct, 'Should have at least one non-lunch SCHEDULED activity');

      handlers.START_ACTIVITY({ activityId: scheduledAct.id });
      renderApp(env.services, state);

      // The started activity should now have data-state="IN_PROGRESS" on its calendar block.
      assert.ok(
        dom.html.includes('data-state="IN_PROGRESS"'),
        'Started activity should render with data-state="IN_PROGRESS" on the calendar block'
      );
      // The block still carries OPEN_BLOCK_DETAIL so the user can access Close/elapsed timer.
      assert.ok(
        dom.html.includes('OPEN_BLOCK_DETAIL'),
        'OPEN_BLOCK_DETAIL must be present so user can access Close/elapsed timer via popover'
      );
    } finally {
      dom.restore();
    }
  });
});

// ---------------------------------------------------------------------------
// AC7: rerender call count
// ---------------------------------------------------------------------------
describe('P0 regression: ACCEPT handler rerender behaviour', () => {
  test('AC7: ACCEPT handler calls rerender() exactly once on success', () => {
    const env = makeEnv();
    const state = stateStub();
    let rerenderCalls = 0;
    const rerender = () => { rerenderCalls++; };
    const handlers = buildHandlers({ services: env.services, state, rerender });

    handlers.AUTO_PLAN({});
    rerenderCalls = 0; // reset after AUTO_PLAN rerenders

    const active = env.services.composerService.getActiveComposition(DEFAULT_USER.id);
    handlers.ACCEPT({ compositionId: active.composition.id });

    assert.equal(rerenderCalls, 1, 'ACCEPT must call rerender() exactly once after success');
  });

  test('AC7b: ACCEPT with missing compositionId is a no-op (no rerender, no state change)', () => {
    const env = makeEnv();
    const state = stateStub();
    let rerenderCalls = 0;
    const handlers = buildHandlers({
      services: env.services,
      state,
      rerender: () => { rerenderCalls++; }
    });

    handlers.AUTO_PLAN({});
    rerenderCalls = 0;

    handlers.ACCEPT({}); // missing compositionId
    assert.equal(rerenderCalls, 0, 'ACCEPT with no compositionId must NOT call rerender');
  });
});

// ---------------------------------------------------------------------------
// AC8: Error path — ACCEPT with bad compositionId
// ---------------------------------------------------------------------------
describe('P0 regression: ACCEPT with invalid compositionId shows error state', () => {
  test('AC8: ACCEPT with unknown compositionId shows ERROR toast (no stuck)', () => {
    const env = makeEnv();
    const state = stateStub();
    let rerenderCalls = 0;
    const handlers = buildHandlers({
      services: env.services,
      state,
      rerender: () => { rerenderCalls++; }
    });

    // No compose — repo is empty. This simulates a stale compositionId.
    handlers.ACCEPT({ compositionId: 'comp_stale_old_id' });

    assert.ok(state.toast, 'Should set a toast on ACCEPT failure');
    assert.equal(state.toast.kind, 'ERROR', 'Toast should be ERROR kind');
    assert.equal(rerenderCalls, 1, 'rerender() must still be called on failure');
  });
});

// ---------------------------------------------------------------------------
// AC11-12: Service layer state after ACCEPT
// ---------------------------------------------------------------------------
describe('P0 regression: Service state after ACCEPT', () => {
  test('AC11: composition.state is ACCEPTED in repo after accept', () => {
    const env = makeEnv();
    const state = stateStub();
    const handlers = buildHandlers({ services: env.services, state, rerender: () => {} });

    handlers.AUTO_PLAN({});
    const active = env.services.composerService.getActiveComposition(DEFAULT_USER.id);
    handlers.ACCEPT({ compositionId: active.composition.id });

    const afterActive = env.services.composerService.getActiveComposition(DEFAULT_USER.id);
    assert.equal(afterActive.composition.state, 'ACCEPTED');
  });

  test('AC12: all activities are SCHEDULED in repo after accept', () => {
    const env = makeEnv();
    const state = stateStub();
    const handlers = buildHandlers({ services: env.services, state, rerender: () => {} });

    handlers.AUTO_PLAN({});
    const active = env.services.composerService.getActiveComposition(DEFAULT_USER.id);
    handlers.ACCEPT({ compositionId: active.composition.id });

    const afterActive = env.services.composerService.getActiveComposition(DEFAULT_USER.id);
    for (const a of afterActive.activities) {
      assert.equal(
        a.state,
        'SCHEDULED',
        `Activity '${a.name ?? a.id}' should be SCHEDULED after ACCEPT`
      );
    }
  });

  test('AC12b: Lunch block (Iter 26) is SCHEDULED after accept', () => {
    const env = makeEnv();
    const state = stateStub();
    const handlers = buildHandlers({ services: env.services, state, rerender: () => {} });

    handlers.AUTO_PLAN({});
    const active = env.services.composerService.getActiveComposition(DEFAULT_USER.id);
    handlers.ACCEPT({ compositionId: active.composition.id });

    const afterActive = env.services.composerService.getActiveComposition(DEFAULT_USER.id);
    const lunch = afterActive.activities.find(
      (a) => a.catalogEntryId === 'recovery_lunch' || a.name === 'Lunch'
    );
    assert.ok(lunch, 'Lunch block should exist in ACCEPTED plan (Iter 26)');
    assert.equal(lunch.state, 'SCHEDULED', 'Lunch block should be SCHEDULED after ACCEPT');
  });
});

// ---------------------------------------------------------------------------
// P0 root cause tests — EDIT_QUICK_UPDATE stuck state prevention
// ---------------------------------------------------------------------------
describe('P0 root cause: Update button absent in PROPOSED state (stuck-state guard)', () => {
  test('Update button absent from renderApp output in PROPOSED state', () => {
    const env = makeEnv();
    const state = stateStub();
    const handlers = buildHandlers({ services: env.services, state, rerender: () => {} });
    const dom = makeMockDom();
    dom.install();
    try {
      // Compose but do NOT accept — stay in PROPOSED state.
      handlers.AUTO_PLAN({});
      renderApp(env.services, state);
      assert.ok(
        !dom.html.includes('data-action="EDIT_QUICK_UPDATE"'),
        'Update button must NOT appear in PROPOSED state — prevents stuck state'
      );
    } finally {
      dom.restore();
    }
  });

  test('Iter 29: Calendar grid renders ACCEPTED blocks with OPEN_BLOCK_DETAIL (replaces inline Update button)', () => {
    // Iter 29 Phase 1: The inline EDIT_QUICK_UPDATE (Update) button is removed from
    // the calendar surface. Duration/time edits are accessed via:
    //   1. OPEN_BLOCK_DETAIL click → detail popover → Edit button → EditDrawer
    // This test confirms the ACCEPTED calendar grid renders correctly.
    const env = makeEnv();
    const state = stateStub();
    const handlers = buildHandlers({ services: env.services, state, rerender: () => {} });
    const dom = makeMockDom();
    dom.install();
    try {
      composeThenAccept(env, state, handlers);
      renderApp(env.services, state);
      assert.ok(
        dom.html.includes('cycle-block-positioned'),
        'Calendar blocks must render in ACCEPTED state'
      );
      assert.ok(
        dom.html.includes('OPEN_BLOCK_DETAIL'),
        'OPEN_BLOCK_DETAIL must be on blocks (entry point for duration/time edits in Iter 29)'
      );
    } finally {
      dom.restore();
    }
  });

  test('EDIT_QUICK_UPDATE on PROPOSED does not block Accept button', () => {
    // This test documents the stuck-state scenario. Even if editMode is
    // triggered on PROPOSED, the Cancel button is always present so the user
    // can escape back to the Accept/Edit/Reject triad.
    const env = makeEnv();
    const state = stateStub();
    const handlers = buildHandlers({ services: env.services, state, rerender: () => {} });
    const dom = makeMockDom();
    dom.install();
    try {
      handlers.AUTO_PLAN({});
      const active = env.services.composerService.getActiveComposition(DEFAULT_USER.id);
      // Simulate entering edit mode on PROPOSED via EDIT_QUICK_UPDATE (e.g. via
      // keyboard/programmatic trigger, not the UI button which is now hidden).
      handlers.EDIT_QUICK_UPDATE({ activityId: active.activities[0]?.id });
      renderApp(env.services, state);
      // Edit mode is open: Cancel button must be visible.
      assert.ok(
        dom.html.includes('data-action="EDIT_CANCEL"'),
        'Cancel button must be present in edit mode so user can escape back to Accept triad'
      );
    } finally {
      dom.restore();
    }
  });
});
