/**
 * Sprint 7 integration tests for /js/app.js — wires OpportunityService,
 * Portfolio page, and new action handlers.
 */

globalThis.__CADENCEPLAN_NO_AUTOSTART__ = true;

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { LocalStorageMock } from './_helpers/localStorageMock.js';
import { ClockService } from '../js/services/ClockService.js';
import {
  buildServices,
  buildHandlers,
  renderApp,
  DEFAULT_USER,
  PORTFOLIO_PREFS_KEY
} from '../js/app.js';
import { OPPORTUNITIES_KEY } from '../js/services/OpportunityService.js';

const FROZEN = '2026-04-21T08:00:00Z';

function makeEnv() {
  const storage = new LocalStorageMock();
  const clock = new ClockService({ now: () => FROZEN });
  const services = buildServices({ storage, clock });
  return { storage, clock, services };
}

function stateStub() {
  return {
    route: 'portfolio',
    params: {},
    composerLoading: false,
    infeasibleExplain: null,
    lastError: null,
    fineTune: null,
    openDialog: null,
    reflectionSheet: null,
    wizard: null,
    portfolio: {
      intakeForm: null,
      expandedOpportunityId: null,
      oppFilter: 'all',
      oppSort: 'newest'
    },
    catalogView: 'list'
  };
}

describe('app.buildServices — Sprint 7', () => {
  test('returns opportunityService in the bundle', () => {
    const { services } = makeEnv();
    assert.ok(services.opportunityService);
    assert.equal(typeof services.opportunityService.create, 'function');
    assert.equal(typeof services.opportunityService.promote, 'function');
    assert.equal(typeof services.opportunityService.list, 'function');
  });

  test('opportunityService is wired to kaizenService', () => {
    const { services } = makeEnv();
    // Promote requires wired kaizenService — if not wired it throws INVALID_DEPS.
    const opp = services.opportunityService.create({
      userId: DEFAULT_USER.id,
      title: 'X Y Z',
      problemStatement: 'A proper length problem statement',
      proposedProjectType: 'AD_HOC'
    });
    // Should not throw INVALID_DEPS — the kaizen wiring should resolve.
    const { kaizen } = services.opportunityService.promote(opp.id);
    assert.ok(kaizen);
    assert.equal(kaizen.state, 'DRAFT');
  });
});

describe('app handlers — OPP_OPEN_INTAKE / OPP_CANCEL_INTAKE', () => {
  test('OPP_OPEN_INTAKE sets intakeForm', () => {
    const { services } = makeEnv();
    const state = stateStub();
    const handlers = buildHandlers({ services, state, rerender: () => {} });
    handlers.OPP_OPEN_INTAKE();
    assert.ok(state.portfolio.intakeForm);
    assert.equal(state.portfolio.intakeForm.proposedProjectType, 'AD_HOC');
  });

  test('OPP_CANCEL_INTAKE clears intakeForm', () => {
    const { services } = makeEnv();
    const state = stateStub();
    const handlers = buildHandlers({ services, state, rerender: () => {} });
    handlers.OPP_OPEN_INTAKE();
    handlers.OPP_CANCEL_INTAKE();
    assert.equal(state.portfolio.intakeForm, null);
  });
});

describe('app handlers — OPP_SUBMIT_INTAKE', () => {
  /**
   * Build a stub form element that supports extractFormFields.
   */
  function stubForm(fields) {
    const elements = Object.entries(fields).map(([name, value]) => ({
      name,
      value,
      type: 'text',
      getAttribute: () => name
    }));
    return {
      closest: () => null,
      querySelectorAll: () => elements
    };
  }

  test('submits, creates opportunity, clears intakeForm', () => {
    const { services } = makeEnv();
    const state = stateStub();
    const handlers = buildHandlers({ services, state, rerender: () => {} });
    handlers.OPP_OPEN_INTAKE();
    const form = stubForm({
      title: 'New headline',
      problemStatement: 'A proper length problem statement',
      scope: 'Some scope',
      proposedProjectType: 'DMAIC'
    });
    handlers.OPP_SUBMIT_INTAKE({}, { element: form });
    assert.equal(state.portfolio.intakeForm, null);
    const opps = services.opportunityService.list({ userId: DEFAULT_USER.id });
    assert.equal(opps.length, 1);
    assert.equal(opps[0].title, 'New headline');
  });

  test('surfaces validation errors back onto intakeForm state', () => {
    const { services } = makeEnv();
    const state = stateStub();
    const handlers = buildHandlers({ services, state, rerender: () => {} });
    handlers.OPP_OPEN_INTAKE();
    const form = stubForm({
      title: 'x',
      problemStatement: 'too short',
      scope: '',
      proposedProjectType: 'DMAIC'
    });
    handlers.OPP_SUBMIT_INTAKE({}, { element: form });
    assert.ok(state.portfolio.intakeForm, 'intake form should still be open');
    assert.equal(state.portfolio.intakeForm.errorName, 'TITLE_LENGTH');
  });
});

describe('app handlers — OPP_PROMOTE', () => {
  test('promotes the opportunity, creates a Kaizen', () => {
    const { services } = makeEnv();
    const state = stateStub();
    const handlers = buildHandlers({ services, state, rerender: () => {} });
    const opp = services.opportunityService.create({
      userId: DEFAULT_USER.id,
      title: 'Valid',
      problemStatement: 'A proper length problem statement',
      proposedProjectType: 'AD_HOC'
    });
    handlers.OPP_PROMOTE({ opportunityId: opp.id });
    const after = services.opportunityService.get(opp.id);
    assert.equal(after.status, 'PROMOTED');
    const drafts = services.kaizenService.listByState(DEFAULT_USER.id, 'DRAFT');
    assert.equal(drafts.length, 1);
    assert.equal(drafts[0].sourceOpportunityId, opp.id);
  });
});

describe('app handlers — OPP_TOGGLE_EXPAND', () => {
  test('toggles expandedOpportunityId on/off', () => {
    const { services } = makeEnv();
    const state = stateStub();
    const handlers = buildHandlers({ services, state, rerender: () => {} });
    handlers.OPP_TOGGLE_EXPAND({ opportunityId: 'opp_1' });
    assert.equal(state.portfolio.expandedOpportunityId, 'opp_1');
    handlers.OPP_TOGGLE_EXPAND({ opportunityId: 'opp_1' });
    assert.equal(state.portfolio.expandedOpportunityId, null);
    handlers.OPP_TOGGLE_EXPAND({ opportunityId: 'opp_2' });
    assert.equal(state.portfolio.expandedOpportunityId, 'opp_2');
  });
});

describe('app handlers — OPP_FILTER_CHANGE / OPP_SORT_CHANGE with persistence', () => {
  test('filter change persists to localStorage', () => {
    const { services } = makeEnv();
    const state = stateStub();
    const handlers = buildHandlers({ services, state, rerender: () => {} });
    handlers.OPP_FILTER_CHANGE({ value: 'INTAKE' });
    assert.equal(state.portfolio.oppFilter, 'INTAKE');
    const persisted = services.repo.read(PORTFOLIO_PREFS_KEY);
    assert.equal(persisted.oppFilter, 'INTAKE');
  });

  test('sort change persists to localStorage', () => {
    const { services } = makeEnv();
    const state = stateStub();
    const handlers = buildHandlers({ services, state, rerender: () => {} });
    handlers.OPP_SORT_CHANGE({ value: 'oldest' });
    assert.equal(state.portfolio.oppSort, 'oldest');
    const persisted = services.repo.read(PORTFOLIO_PREFS_KEY);
    assert.equal(persisted.oppSort, 'oldest');
  });

  test('picks up value from element.value when payload empty', () => {
    const { services } = makeEnv();
    const state = stateStub();
    const handlers = buildHandlers({ services, state, rerender: () => {} });
    handlers.OPP_FILTER_CHANGE({}, { element: { value: 'PROMOTED' } });
    assert.equal(state.portfolio.oppFilter, 'PROMOTED');
  });
});

describe('app handlers — CATALOG_SET_VIEW', () => {
  test('switches catalog view', () => {
    const { services } = makeEnv();
    const state = stateStub();
    const handlers = buildHandlers({ services, state, rerender: () => {} });
    handlers.CATALOG_SET_VIEW({ view: 'bucket' });
    assert.equal(state.catalogView, 'bucket');
    handlers.CATALOG_SET_VIEW({ view: 'list' });
    assert.equal(state.catalogView, 'list');
  });

  test('ignores invalid payload', () => {
    const { services } = makeEnv();
    const state = stateStub();
    const handlers = buildHandlers({ services, state, rerender: () => {} });
    handlers.CATALOG_SET_VIEW({});
    assert.equal(state.catalogView, 'list');
  });
});

describe('app handlers — CATALOG_TOGGLE', () => {
  test('toggles a catalog entry via catalogService', () => {
    const { services } = makeEnv();
    const state = stateStub();
    const handlers = buildHandlers({ services, state, rerender: () => {} });
    // Pick a non-mandatory entry from the seeded catalog.
    const list = services.catalogService.list(DEFAULT_USER.id);
    const optional = list.find((c) => !c.isNonOptional);
    if (!optional) return; // shouldn't happen but guard anyway
    const beforeEnabled = optional.enabledByUser;
    handlers.CATALOG_TOGGLE({ catalogEntryId: optional.id });
    const after = services.catalogService
      .list(DEFAULT_USER.id)
      .find((c) => c.id === optional.id);
    assert.notEqual(after.enabledByUser, beforeEnabled);
  });
});

describe('app.renderApp — portfolio route (Sprint 7)', () => {
  // renderApp touches mountHtml which needs a DOM — we stub document.
  // If there's no document we verify the renderApp path completes. We
  // patch mountHtml via a minimal DOM stub.

  test('renderApp(portfolio) runs without throwing when document present', () => {
    // Stub a minimal document.
    const innerHtml = { value: '' };
    const containerStub = {
      get innerHTML() { return innerHtml.value; },
      set innerHTML(v) { innerHtml.value = v; }
    };
    const origDoc = globalThis.document;
    globalThis.document = {
      getElementById: (id) => (id === 'app-root' ? containerStub : null)
    };
    try {
      const { services } = makeEnv();
      const state = stateStub();
      state.route = 'portfolio';
      renderApp(services, state);
      // Portfolio main should have landed in the container.
      assert.match(innerHtml.value, /data-route="portfolio"/);
      assert.match(innerHtml.value, /Project Portfolio/);
    } finally {
      globalThis.document = origDoc;
    }
  });
});
