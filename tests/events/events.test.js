/**
 * Tests for /js/events/events.js (E1-T3).
 *
 * For every event name declared in ARCHITECTURE §6.1, the module must
 * export a named string constant whose value equals the event name.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import * as events from '../../js/events/events.js';
import { EVENT_NAMES } from '../../js/events/events.js';

// This is the authoritative list — verbatim from ARCHITECTURE §6.1.
// v0.5 renamed AcceleratorPaceWarning → ProjectPaceWarning and added
// ScopeChangeRequested (22 + 3 = 25 total).
// Sprint 7 adds 4 Opportunity* events for the Portfolio intake funnel
// (25 + 4 = 29 total).
const EXPECTED = [
  'CycleProposed',
  'CycleAccepted',
  'CycleEdited',
  'CycleRejected',
  'CompositionStarted',
  'CompositionClosed',
  'ActivityStarted',
  'ActivityStartedLate',
  'ActivityCompleted',
  'ReflectionStubbed',
  'ReflectionCaptured',
  'VarianceLogged',
  'FrictionSignalCaptured',
  'WeeklyReflectionCompleted',
  'KaizenPromoted',
  'KaizenBaselineLocked',
  'KaizenRemeasured',
  'KaizenClosed',
  'PdcaExperimentOpened',
  'PdcaTickCommitted',
  'PdcaExperimentClosed',
  'ComposerInfeasible',
  'ProjectPhaseAdvanced',
  'ProjectPaceWarning',
  'ScopeChangeRequested',
  'OpportunityCreated',
  'OpportunityPromoted',
  'OpportunityDeferred',
  'OpportunityRejected'
];

describe('events.js — every §6.1 event has a named export', () => {
  for (const name of EXPECTED) {
    test(`${name} exported and equals '${name}'`, () => {
      assert.equal(events[name], name);
    });
  }
});

describe('events.js — EVENT_NAMES list', () => {
  test('EVENT_NAMES contains every expected event', () => {
    for (const name of EXPECTED) {
      assert.ok(EVENT_NAMES.includes(name), `${name} missing from EVENT_NAMES`);
    }
  });

  test('EVENT_NAMES has exactly the expected length', () => {
    assert.equal(EVENT_NAMES.length, EXPECTED.length);
  });

  test('EVENT_NAMES is frozen', () => {
    assert.ok(Object.isFrozen(EVENT_NAMES));
  });
});

describe('events.js — default export is a namespaced bundle', () => {
  test('default export carries the same constants', () => {
    const def = events.default;
    for (const name of EXPECTED) {
      assert.equal(def[name], name);
    }
  });
});
