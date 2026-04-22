/**
 * Tests for KaizenService Sprint 8 methods — the HARD RULE close loop.
 *
 * Covers:
 *   startRemeasurement   (P0-T2)
 *   captureRemeasurement (P0-T3)
 *   close                (P0-T4)
 *   abandon              (P0-T5)
 *   deriveCloseKind      (static helper; covers the 3x decision table)
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  KaizenService,
  KAIZENS_KEY,
  BASELINE_METRICS_KEY,
  REMEASUREMENTS_KEY,
  buildRemeasurementId,
  LESSONS_LEARNED_MIN_LENGTH,
  ABANDON_REASON_MIN_LENGTH
} from '../../js/services/KaizenService.js';
import {
  KaizenRemeasurementStarted,
  KaizenRemeasured,
  KaizenClosed,
  KaizenAbandoned
} from '../../js/events/events.js';
import { LocalStorageRepository } from '../../js/persistence/LocalStorageRepository.js';
import { EventBus } from '../../js/events/EventBus.js';
import { ClockService } from '../../js/services/ClockService.js';
import { LocalStorageMock } from '../_helpers/localStorageMock.js';

const FROZEN_NOW = '2026-04-21T10:00:00Z';
const LATER_NOW = '2026-04-30T12:00:00Z';

function buildEnv(nowIso = FROZEN_NOW) {
  const storage = new LocalStorageMock();
  const repo = new LocalStorageRepository({ storage });
  const bus = new EventBus();
  let currentNow = nowIso;
  const clock = new ClockService({ now: () => currentNow });
  const service = new KaizenService({ repo, bus, clock });
  return {
    service,
    repo,
    bus,
    clock,
    advance: (iso) => {
      currentNow = iso;
    }
  };
}

/**
 * Build an ACTIVE Kaizen with a locked baseline, then return the kaizenId.
 */
function seedActiveKaizen(env, {
  userId = 'u_1',
  baselineValue = 42,
  targetImprovement = null,
  metricDirection = 'higher_is_better'
} = {}) {
  const kaizenId = 'k_u_1_seed_1';
  const baselineId = `bm_${kaizenId}`;
  env.repo.write(KAIZENS_KEY, {
    [kaizenId]: {
      id: kaizenId,
      userId,
      title: 'Seeded',
      problemStatement: 'Seeded problem statement',
      goalStatement: 'Seeded goal',
      sourceFrictionSignalIds: [],
      baselineMetricId: baselineId,
      remeasurementId: null,
      actions: [
        { name: 'Action 1', ownerRef: 'u_1', dueDate: '2026-04-22', doneAt: '2026-04-22T11:00:00Z' }
      ],
      state: 'ACTIVE',
      openedAt: '2026-04-20T09:00:00Z',
      closedAt: null,
      closeKind: null,
      resultsNarrativeRef: null,
      projectType: 'AD_HOC',
      phase: null,
      phaseDefinitions: null,
      implementationCostDollars: null,
      annualBenefitsDollars: null,
      startDate: '2026-04-20',
      controlPlanArtifactRef: null,
      controlPlanDraftArtifactRef: null,
      implementationLeadUserId: null,
      roiPassNumber: null,
      roiProjections: null,
      validatedRootCauseArtifactRef: null,
      sustainmentCheckIns: null,
      sustainmentGatePassed: null,
      scopeChanges: [],
      targetCloseDate: null,
      sourcePdcaExperimentId: null,
      sourceOpportunityId: null,
      lessonsLearned: null,
      metricDirection,
      targetImprovement,
      abandoned: false,
      abandonedAt: null,
      abandonReason: null
    }
  });
  env.repo.write(BASELINE_METRICS_KEY, {
    [baselineId]: {
      id: baselineId,
      kaizenId,
      metricDefinition: {
        name: 'Cycle time',
        unit: 'days',
        operationalDefinition: 'Jira ticket open to done elapsed in calendar days.',
        sampleSize: 30,
        method: 'Extract from Jira API'
      },
      value: baselineValue,
      capturedAt: '2026-04-20T09:30:00Z',
      capturedSampleRef: null,
      locked: true
    }
  });
  return kaizenId;
}

/** Build a DRAFT Kaizen. */
function seedDraftKaizen(env, userId = 'u_1') {
  const kaizenId = 'k_draft_1';
  env.repo.write(KAIZENS_KEY, {
    [kaizenId]: {
      id: kaizenId,
      userId,
      title: 'Draft',
      problemStatement: 'Draft problem statement',
      goalStatement: '',
      sourceFrictionSignalIds: [],
      baselineMetricId: null,
      remeasurementId: null,
      actions: [],
      state: 'DRAFT',
      openedAt: '2026-04-21T09:00:00Z',
      closedAt: null,
      closeKind: null,
      resultsNarrativeRef: null,
      projectType: 'AD_HOC',
      phase: null,
      phaseDefinitions: null,
      scopeChanges: [],
      sourceOpportunityId: null,
      abandoned: false,
      abandonedAt: null,
      abandonReason: null
    }
  });
  return kaizenId;
}

// ---------------------------------------------------------------------------
// startRemeasurement
// ---------------------------------------------------------------------------

describe('KaizenService.startRemeasurement — happy path', () => {
  let env;
  beforeEach(() => { env = buildEnv(); });

  test('transitions ACTIVE → IN_REMEASUREMENT', () => {
    const kid = seedActiveKaizen(env);
    const k = env.service.startRemeasurement(kid, 'u_1');
    assert.equal(k.state, 'IN_REMEASUREMENT');
    assert.equal(env.service.get(kid).state, 'IN_REMEASUREMENT');
  });

  test('does not create a Remeasurement row', () => {
    const kid = seedActiveKaizen(env);
    env.service.startRemeasurement(kid, 'u_1');
    const rm = env.repo.read(REMEASUREMENTS_KEY) ?? {};
    assert.equal(Object.keys(rm).length, 0);
  });

  test('emits KaizenRemeasurementStarted with kaizenId+userId+startedAt', () => {
    const kid = seedActiveKaizen(env);
    let captured = null;
    env.bus.subscribe(KaizenRemeasurementStarted, (p) => { captured = p; });
    env.service.startRemeasurement(kid, 'u_1');
    assert.ok(captured);
    assert.equal(captured.kaizenId, kid);
    assert.equal(captured.userId, 'u_1');
    assert.equal(captured.startedAt, FROZEN_NOW);
  });

  test('works when userId omitted (owner check skipped)', () => {
    const kid = seedActiveKaizen(env);
    const k = env.service.startRemeasurement(kid);
    assert.equal(k.state, 'IN_REMEASUREMENT');
  });
});

describe('KaizenService.startRemeasurement — guards', () => {
  let env;
  beforeEach(() => { env = buildEnv(); });

  test('throws KAIZEN_NOT_FOUND on unknown id', () => {
    assert.throws(
      () => env.service.startRemeasurement('nope', 'u_1'),
      (e) => e.name === 'KAIZEN_NOT_FOUND'
    );
  });

  test('throws KAIZEN_NOT_ACTIVE when in DRAFT', () => {
    const kid = seedDraftKaizen(env);
    assert.throws(
      () => env.service.startRemeasurement(kid, 'u_1'),
      (e) => e.name === 'KAIZEN_NOT_ACTIVE'
    );
  });

  test('throws KAIZEN_NOT_ACTIVE when already IN_REMEASUREMENT', () => {
    const kid = seedActiveKaizen(env);
    env.service.startRemeasurement(kid, 'u_1');
    assert.throws(
      () => env.service.startRemeasurement(kid, 'u_1'),
      (e) => e.name === 'KAIZEN_NOT_ACTIVE'
    );
  });

  test('throws KAIZEN_NOT_ACTIVE when CLOSED', () => {
    const kid = seedActiveKaizen(env);
    const kzs = env.repo.read(KAIZENS_KEY);
    kzs[kid].state = 'CLOSED';
    env.repo.write(KAIZENS_KEY, kzs);
    assert.throws(
      () => env.service.startRemeasurement(kid, 'u_1'),
      (e) => e.name === 'KAIZEN_NOT_ACTIVE'
    );
  });

  test('throws KAIZEN_OWNER_MISMATCH when userId does not match', () => {
    const kid = seedActiveKaizen(env, { userId: 'u_1' });
    assert.throws(
      () => env.service.startRemeasurement(kid, 'u_other'),
      (e) => e.name === 'KAIZEN_OWNER_MISMATCH'
    );
  });
});

// ---------------------------------------------------------------------------
// captureRemeasurement
// ---------------------------------------------------------------------------

describe('KaizenService.captureRemeasurement — happy path (higher_is_better default)', () => {
  let env;
  beforeEach(() => { env = buildEnv(); });

  test('creates a Remeasurement row with correct deltas', () => {
    const kid = seedActiveKaizen(env, { baselineValue: 10 });
    env.service.startRemeasurement(kid, 'u_1');
    env.advance(LATER_NOW);
    const { remeasurement } = env.service.captureRemeasurement(kid, 'u_1', {
      value: 16
    });
    assert.equal(remeasurement.value, 16);
    assert.equal(remeasurement.deltaAbsolute, 6);
    assert.equal(remeasurement.deltaPercent, 60);
    assert.equal(remeasurement.beatsBaseline, true);
    assert.equal(remeasurement.capturedAt, LATER_NOW);
    assert.equal(remeasurement.metricDefinitionId, `bm_${kid}`);
  });

  test('negative direction: value below baseline → beatsBaseline=false', () => {
    const kid = seedActiveKaizen(env, { baselineValue: 10 });
    env.service.startRemeasurement(kid, 'u_1');
    const { remeasurement } = env.service.captureRemeasurement(kid, 'u_1', {
      value: 4
    });
    assert.equal(remeasurement.deltaAbsolute, -6);
    assert.equal(remeasurement.deltaPercent, -60);
    assert.equal(remeasurement.beatsBaseline, false);
  });

  test('equal to baseline → deltaAbsolute=0, beatsBaseline=false', () => {
    const kid = seedActiveKaizen(env, { baselineValue: 10 });
    env.service.startRemeasurement(kid, 'u_1');
    const { remeasurement } = env.service.captureRemeasurement(kid, 'u_1', {
      value: 10
    });
    assert.equal(remeasurement.deltaAbsolute, 0);
    assert.equal(remeasurement.beatsBaseline, false);
  });

  test('persists immutably to bamx:v1:remeasurements', () => {
    const kid = seedActiveKaizen(env, { baselineValue: 10 });
    env.service.startRemeasurement(kid, 'u_1');
    env.service.captureRemeasurement(kid, 'u_1', { value: 16 });
    const rm = env.repo.read(REMEASUREMENTS_KEY);
    assert.ok(rm);
    const id = buildRemeasurementId(kid);
    assert.ok(rm[id]);
    assert.equal(rm[id].value, 16);
  });

  test('updates Kaizen.remeasurementId', () => {
    const kid = seedActiveKaizen(env);
    env.service.startRemeasurement(kid, 'u_1');
    env.service.captureRemeasurement(kid, 'u_1', { value: 99 });
    const k = env.service.get(kid);
    assert.equal(k.remeasurementId, buildRemeasurementId(kid));
  });

  test('emits KaizenRemeasured', () => {
    const kid = seedActiveKaizen(env, { baselineValue: 10 });
    env.service.startRemeasurement(kid, 'u_1');
    let captured = null;
    env.bus.subscribe(KaizenRemeasured, (p) => { captured = p; });
    env.service.captureRemeasurement(kid, 'u_1', { value: 16 });
    assert.ok(captured);
    assert.equal(captured.kaizenId, kid);
    assert.equal(captured.value, 16);
    assert.equal(captured.deltaAbsolute, 6);
    assert.equal(captured.deltaPercent, 60);
    assert.equal(captured.beatsBaseline, true);
  });

  test('accepts an evidenceRef', () => {
    const kid = seedActiveKaizen(env);
    env.service.startRemeasurement(kid, 'u_1');
    const { remeasurement } = env.service.captureRemeasurement(kid, 'u_1', {
      value: 99,
      evidenceRef: { schema: 'DOCUMENT', value: { url: 'https://x.com/1', title: 'Evidence' } }
    });
    assert.deepEqual(remeasurement.evidenceRef, {
      schema: 'DOCUMENT',
      value: { url: 'https://x.com/1', title: 'Evidence' }
    });
  });
});

describe('KaizenService.captureRemeasurement — lower_is_better', () => {
  let env;
  beforeEach(() => { env = buildEnv(); });

  test('flips sign convention: value BELOW baseline → beatsBaseline=true', () => {
    const kid = seedActiveKaizen(env, {
      baselineValue: 20,
      metricDirection: 'lower_is_better'
    });
    env.service.startRemeasurement(kid, 'u_1');
    const { remeasurement } = env.service.captureRemeasurement(kid, 'u_1', {
      value: 12
    });
    assert.equal(remeasurement.deltaAbsolute, -8);
    assert.equal(remeasurement.beatsBaseline, true);
  });

  test('value ABOVE baseline with lower_is_better → beatsBaseline=false', () => {
    const kid = seedActiveKaizen(env, {
      baselineValue: 20,
      metricDirection: 'lower_is_better'
    });
    env.service.startRemeasurement(kid, 'u_1');
    const { remeasurement } = env.service.captureRemeasurement(kid, 'u_1', {
      value: 25
    });
    assert.equal(remeasurement.deltaAbsolute, 5);
    assert.equal(remeasurement.beatsBaseline, false);
  });
});

describe('KaizenService.captureRemeasurement — zero baseline safe division', () => {
  let env;
  beforeEach(() => { env = buildEnv(); });

  test('baseline=0 sets deltaPercent to null and still computes delta', () => {
    const kid = seedActiveKaizen(env, { baselineValue: 0 });
    env.service.startRemeasurement(kid, 'u_1');
    const { remeasurement } = env.service.captureRemeasurement(kid, 'u_1', {
      value: 5
    });
    assert.equal(remeasurement.deltaAbsolute, 5);
    assert.equal(remeasurement.deltaPercent, null);
    assert.equal(remeasurement.beatsBaseline, true);
  });
});

describe('KaizenService.captureRemeasurement — guards', () => {
  let env;
  beforeEach(() => { env = buildEnv(); });

  test('throws KAIZEN_NOT_FOUND on unknown id', () => {
    assert.throws(
      () => env.service.captureRemeasurement('nope', 'u_1', { value: 1 }),
      (e) => e.name === 'KAIZEN_NOT_FOUND'
    );
  });

  test('throws KAIZEN_NOT_IN_REMEASUREMENT when ACTIVE', () => {
    const kid = seedActiveKaizen(env);
    assert.throws(
      () => env.service.captureRemeasurement(kid, 'u_1', { value: 5 }),
      (e) => e.name === 'KAIZEN_NOT_IN_REMEASUREMENT'
    );
  });

  test('throws INVALID_METRIC_VALUE on NaN value', () => {
    const kid = seedActiveKaizen(env);
    env.service.startRemeasurement(kid, 'u_1');
    assert.throws(
      () => env.service.captureRemeasurement(kid, 'u_1', { value: Number.NaN }),
      (e) => e.name === 'INVALID_METRIC_VALUE'
    );
  });

  test('throws INVALID_METRIC_VALUE on non-number value', () => {
    const kid = seedActiveKaizen(env);
    env.service.startRemeasurement(kid, 'u_1');
    assert.throws(
      () => env.service.captureRemeasurement(kid, 'u_1', { value: 'seven' }),
      (e) => e.name === 'INVALID_METRIC_VALUE'
    );
  });

  test('throws REMEASUREMENT_ALREADY_CAPTURED on second attempt', () => {
    const kid = seedActiveKaizen(env);
    env.service.startRemeasurement(kid, 'u_1');
    env.service.captureRemeasurement(kid, 'u_1', { value: 99 });
    assert.throws(
      () => env.service.captureRemeasurement(kid, 'u_1', { value: 100 }),
      (e) => e.name === 'REMEASUREMENT_ALREADY_CAPTURED'
    );
  });

  test('throws BASELINE_NOT_LOCKED when baseline absent', () => {
    // Seed an IN_REMEASUREMENT Kaizen with no baselineMetric row.
    env.repo.write(KAIZENS_KEY, {
      k_x: {
        id: 'k_x',
        userId: 'u_1',
        title: 't',
        problemStatement: 'p',
        goalStatement: 'g',
        sourceFrictionSignalIds: [],
        baselineMetricId: 'bm_missing',
        remeasurementId: null,
        actions: [],
        state: 'IN_REMEASUREMENT',
        openedAt: '2026-04-20T09:00:00Z',
        closedAt: null,
        closeKind: null,
        metricDirection: 'higher_is_better',
        scopeChanges: [],
        abandoned: false
      }
    });
    assert.throws(
      () => env.service.captureRemeasurement('k_x', 'u_1', { value: 5 }),
      (e) => e.name === 'BASELINE_NOT_LOCKED'
    );
  });

  test('throws INVALID_EVIDENCE_REF on non-object evidence', () => {
    const kid = seedActiveKaizen(env);
    env.service.startRemeasurement(kid, 'u_1');
    assert.throws(
      () => env.service.captureRemeasurement(kid, 'u_1', {
        value: 5,
        evidenceRef: 'not-an-object'
      }),
      (e) => e.name === 'INVALID_EVIDENCE_REF'
    );
  });

  test('APPEND_ONLY_VIOLATION surfaces if row is manually overwritten', () => {
    // Direct-write conflict: pre-seed a row at the id we will try to capture.
    const kid = seedActiveKaizen(env);
    env.service.startRemeasurement(kid, 'u_1');
    const id = buildRemeasurementId(kid);
    env.repo.write(REMEASUREMENTS_KEY, {
      [id]: { id, kaizenId: kid, value: 0 }
    });
    assert.throws(
      () => env.service.captureRemeasurement(kid, 'u_1', { value: 5 }),
      (e) => e.name === 'APPEND_ONLY_VIOLATION'
    );
  });
});

// ---------------------------------------------------------------------------
// close + deriveCloseKind
// ---------------------------------------------------------------------------

describe('KaizenService.deriveCloseKind — decision table', () => {
  test('beatsBaseline=false → FAILED_HONEST (no target)', () => {
    assert.equal(
      KaizenService.deriveCloseKind({ beatsBaseline: false, deltaAbsolute: -1 }, null),
      'FAILED_HONEST'
    );
  });

  test('beatsBaseline=false → FAILED_HONEST (with target)', () => {
    assert.equal(
      KaizenService.deriveCloseKind({ beatsBaseline: false, deltaAbsolute: -1 }, 5),
      'FAILED_HONEST'
    );
  });

  test('beatsBaseline=true, no target → PARTIAL', () => {
    assert.equal(
      KaizenService.deriveCloseKind({ beatsBaseline: true, deltaAbsolute: 3 }, null),
      'PARTIAL'
    );
  });

  test('beatsBaseline=true, target met → SUCCESS', () => {
    assert.equal(
      KaizenService.deriveCloseKind({ beatsBaseline: true, deltaAbsolute: 5 }, 5),
      'SUCCESS'
    );
    assert.equal(
      KaizenService.deriveCloseKind({ beatsBaseline: true, deltaAbsolute: 7 }, 5),
      'SUCCESS'
    );
  });

  test('beatsBaseline=true, target not met → PARTIAL', () => {
    assert.equal(
      KaizenService.deriveCloseKind({ beatsBaseline: true, deltaAbsolute: 3 }, 5),
      'PARTIAL'
    );
  });

  test('target=0 is treated as no target (any improvement is PARTIAL)', () => {
    assert.equal(
      KaizenService.deriveCloseKind({ beatsBaseline: true, deltaAbsolute: 3 }, 0),
      'PARTIAL'
    );
  });

  test('target absolute value compared (works for lower_is_better negative delta)', () => {
    // lower_is_better: delta=-8, target=-5, |−8|>=|−5| → SUCCESS
    assert.equal(
      KaizenService.deriveCloseKind({ beatsBaseline: true, deltaAbsolute: -8 }, -5),
      'SUCCESS'
    );
  });
});

describe('KaizenService.close — HARD RULE', () => {
  let env;
  beforeEach(() => { env = buildEnv(); });

  test('throws KAIZEN_CLOSE_REQUIRES_REMEASUREMENT when remeasurementId absent', () => {
    const kid = seedActiveKaizen(env);
    env.service.startRemeasurement(kid, 'u_1');
    // Skip the captureRemeasurement step — attempt close anyway.
    assert.throws(
      () => env.service.close(kid, 'u_1', {
        lessonsLearned: 'We learned that we should never close without data.'
      }),
      (e) => e.name === 'KAIZEN_CLOSE_REQUIRES_REMEASUREMENT'
    );
  });

  test('throws KAIZEN_NOT_IN_REMEASUREMENT when in ACTIVE', () => {
    const kid = seedActiveKaizen(env);
    assert.throws(
      () => env.service.close(kid, 'u_1', {
        lessonsLearned: 'We learned that sequencing matters a lot here.'
      }),
      (e) => e.name === 'KAIZEN_NOT_IN_REMEASUREMENT'
    );
  });

  test('throws LESSONS_LEARNED_TOO_SHORT when missing', () => {
    const kid = seedActiveKaizen(env);
    env.service.startRemeasurement(kid, 'u_1');
    env.service.captureRemeasurement(kid, 'u_1', { value: 99 });
    assert.throws(
      () => env.service.close(kid, 'u_1', { lessonsLearned: 'too short' }),
      (e) => e.name === 'LESSONS_LEARNED_TOO_SHORT'
    );
  });

  test('LESSONS_LEARNED_MIN_LENGTH = 20 is exported', () => {
    assert.equal(LESSONS_LEARNED_MIN_LENGTH, 20);
  });
});

describe('KaizenService.close — happy paths', () => {
  let env;
  beforeEach(() => { env = buildEnv(); });

  test('beatsBaseline=true + target met → SUCCESS', () => {
    const kid = seedActiveKaizen(env, {
      baselineValue: 10,
      targetImprovement: 5
    });
    env.service.startRemeasurement(kid, 'u_1');
    env.service.captureRemeasurement(kid, 'u_1', { value: 18 });
    env.advance(LATER_NOW);
    const k = env.service.close(kid, 'u_1', {
      lessonsLearned: 'Root cause: bad queueing. Fix: batch by priority weekly.'
    });
    assert.equal(k.state, 'CLOSED');
    assert.equal(k.closeKind, 'SUCCESS');
    assert.equal(k.closedAt, LATER_NOW);
    assert.ok(typeof k.lessonsLearned === 'string');
    assert.ok(k.lessonsLearned.length >= 20);
  });

  test('beatsBaseline=true + target not met → PARTIAL', () => {
    const kid = seedActiveKaizen(env, {
      baselineValue: 10,
      targetImprovement: 10
    });
    env.service.startRemeasurement(kid, 'u_1');
    env.service.captureRemeasurement(kid, 'u_1', { value: 13 });
    const k = env.service.close(kid, 'u_1', {
      lessonsLearned: 'Partial win — we moved the needle but short of target.'
    });
    assert.equal(k.closeKind, 'PARTIAL');
  });

  test('beatsBaseline=true + no target → PARTIAL', () => {
    const kid = seedActiveKaizen(env, { baselineValue: 10 });
    env.service.startRemeasurement(kid, 'u_1');
    env.service.captureRemeasurement(kid, 'u_1', { value: 13 });
    const k = env.service.close(kid, 'u_1', {
      lessonsLearned: 'Improved, but no explicit target was set up front.'
    });
    assert.equal(k.closeKind, 'PARTIAL');
  });

  test('beatsBaseline=false → FAILED_HONEST', () => {
    const kid = seedActiveKaizen(env, { baselineValue: 10 });
    env.service.startRemeasurement(kid, 'u_1');
    env.service.captureRemeasurement(kid, 'u_1', { value: 8 });
    const k = env.service.close(kid, 'u_1', {
      lessonsLearned: 'No improvement. Root cause was actually the dependency, not scope.'
    });
    assert.equal(k.closeKind, 'FAILED_HONEST');
  });

  test('persists closed state via upsert', () => {
    const kid = seedActiveKaizen(env, { baselineValue: 10 });
    env.service.startRemeasurement(kid, 'u_1');
    env.service.captureRemeasurement(kid, 'u_1', { value: 13 });
    env.service.close(kid, 'u_1', {
      lessonsLearned: 'Valid lessons learned are at least 20 chars here.'
    });
    const all = env.repo.read(KAIZENS_KEY);
    assert.equal(all[kid].state, 'CLOSED');
  });

  test('emits KaizenClosed with closeKind + deltaPercent', () => {
    const kid = seedActiveKaizen(env, {
      baselineValue: 10,
      targetImprovement: 5
    });
    env.service.startRemeasurement(kid, 'u_1');
    env.service.captureRemeasurement(kid, 'u_1', { value: 20 });
    let captured = null;
    env.bus.subscribe(KaizenClosed, (p) => { captured = p; });
    env.service.close(kid, 'u_1', {
      lessonsLearned: 'Huge win. Root cause removal compounded with action #2.'
    });
    assert.ok(captured);
    assert.equal(captured.kaizenId, kid);
    assert.equal(captured.closeKind, 'SUCCESS');
    assert.equal(captured.deltaAbsolute, 10);
    assert.equal(captured.deltaPercent, 100);
  });
});

// ---------------------------------------------------------------------------
// abandon
// ---------------------------------------------------------------------------

describe('KaizenService.abandon — happy path', () => {
  let env;
  beforeEach(() => { env = buildEnv(); });

  test('sets abandoned=true with reason + timestamp', () => {
    const kid = seedDraftKaizen(env);
    const k = env.service.abandon(kid, 'u_1', {
      reason: 'Out of scope for this quarter.'
    });
    assert.equal(k.abandoned, true);
    assert.equal(k.abandonReason, 'Out of scope for this quarter.');
    assert.equal(k.abandonedAt, FROZEN_NOW);
  });

  test('does NOT transition to CLOSED', () => {
    const kid = seedDraftKaizen(env);
    const k = env.service.abandon(kid, 'u_1', {
      reason: 'Blocked by leadership decision.'
    });
    assert.equal(k.state, 'DRAFT');
    assert.notEqual(k.state, 'CLOSED');
    assert.equal(k.closedAt ?? null, null);
    assert.equal(k.closeKind ?? null, null);
  });

  test('emits KaizenAbandoned', () => {
    const kid = seedDraftKaizen(env);
    let captured = null;
    env.bus.subscribe(KaizenAbandoned, (p) => { captured = p; });
    env.service.abandon(kid, 'u_1', {
      reason: 'Strategic deprioritization.'
    });
    assert.ok(captured);
    assert.equal(captured.kaizenId, kid);
    assert.equal(captured.reason, 'Strategic deprioritization.');
    assert.equal(captured.abandonedAt, FROZEN_NOW);
  });

  test('ABANDON_REASON_MIN_LENGTH = 10 is exported', () => {
    assert.equal(ABANDON_REASON_MIN_LENGTH, 10);
  });
});

describe('KaizenService.abandon — guards', () => {
  let env;
  beforeEach(() => { env = buildEnv(); });

  test('throws KAIZEN_NOT_FOUND on unknown id', () => {
    assert.throws(
      () => env.service.abandon('nope', 'u_1', { reason: 'a solid reason' }),
      (e) => e.name === 'KAIZEN_NOT_FOUND'
    );
  });

  test('throws KAIZEN_NOT_IN_DRAFT when ACTIVE', () => {
    const kid = seedActiveKaizen(env);
    assert.throws(
      () => env.service.abandon(kid, 'u_1', { reason: 'Something came up.' }),
      (e) => e.name === 'KAIZEN_NOT_IN_DRAFT'
    );
  });

  test('throws ABANDON_REASON_TOO_SHORT when < 10 chars', () => {
    const kid = seedDraftKaizen(env);
    assert.throws(
      () => env.service.abandon(kid, 'u_1', { reason: 'short' }),
      (e) => e.name === 'ABANDON_REASON_TOO_SHORT'
    );
  });

  test('throws ABANDON_REASON_TOO_SHORT when reason missing', () => {
    const kid = seedDraftKaizen(env);
    assert.throws(
      () => env.service.abandon(kid, 'u_1', {}),
      (e) => e.name === 'ABANDON_REASON_TOO_SHORT'
    );
  });

  test('cannot un-abandon (second call throws KAIZEN_ABANDONED)', () => {
    const kid = seedDraftKaizen(env);
    env.service.abandon(kid, 'u_1', { reason: 'valid reason text' });
    assert.throws(
      () => env.service.abandon(kid, 'u_1', { reason: 'oops try again' }),
      (e) => e.name === 'KAIZEN_ABANDONED'
    );
  });

  test('abandoned Kaizen refuses setGoalStatement', () => {
    const kid = seedDraftKaizen(env);
    env.service.abandon(kid, 'u_1', { reason: 'valid reason text' });
    assert.throws(
      () => env.service.setGoalStatement(kid, 'new goal'),
      (e) => e.name === 'KAIZEN_ABANDONED'
    );
  });

  test('abandoned Kaizen refuses addAction', () => {
    const kid = seedDraftKaizen(env);
    env.service.abandon(kid, 'u_1', { reason: 'valid reason text' });
    assert.throws(
      () => env.service.addAction(kid, {
        name: 'x', ownerRef: 'u', dueDate: '2026-05-01'
      }),
      (e) => e.name === 'KAIZEN_ABANDONED'
    );
  });

  test('throws KAIZEN_OWNER_MISMATCH when userId does not match', () => {
    const kid = seedDraftKaizen(env, 'u_owner');
    assert.throws(
      () => env.service.abandon(kid, 'u_other', { reason: 'valid reason text' }),
      (e) => e.name === 'KAIZEN_OWNER_MISMATCH'
    );
  });
});

// ---------------------------------------------------------------------------
// Remeasurement id + storage key
// ---------------------------------------------------------------------------

describe('REMEASUREMENTS_KEY + buildRemeasurementId', () => {
  test('REMEASUREMENTS_KEY equals bamx:v1:remeasurements', () => {
    assert.equal(REMEASUREMENTS_KEY, 'bamx:v1:remeasurements');
  });

  test('buildRemeasurementId is deterministic from kaizenId', () => {
    assert.equal(buildRemeasurementId('k_foo'), 'rm_k_foo');
    assert.equal(buildRemeasurementId('k_foo'), 'rm_k_foo');
  });
});
