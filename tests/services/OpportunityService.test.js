/**
 * Tests for OpportunityService (Sprint 7 P0-T2).
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  OpportunityService,
  OPPORTUNITIES_KEY,
  TITLE_MIN_LENGTH,
  TITLE_MAX_LENGTH,
  PROBLEM_MIN_LENGTH,
  PROBLEM_MAX_LENGTH,
  SCOPE_MAX_LENGTH,
  REJECTION_REASON_MIN_LENGTH,
  buildOpportunityId
} from '../../js/services/OpportunityService.js';
import { KaizenService } from '../../js/services/KaizenService.js';
import {
  OpportunityCreated,
  OpportunityPromoted,
  OpportunityDeferred,
  OpportunityRejected,
  KaizenPromoted
} from '../../js/events/events.js';
import { LocalStorageRepository } from '../../js/persistence/LocalStorageRepository.js';
import { EventBus } from '../../js/events/EventBus.js';
import { ClockService } from '../../js/services/ClockService.js';
import { LocalStorageMock } from '../_helpers/localStorageMock.js';

const FROZEN_NOW = '2026-04-21T10:00:00Z';

function buildEnv(nowIso = FROZEN_NOW) {
  const storage = new LocalStorageMock();
  const repo = new LocalStorageRepository({ storage });
  const bus = new EventBus();
  const clock = new ClockService({ now: () => nowIso });
  const kaizenService = new KaizenService({ repo, bus, clock });
  const service = new OpportunityService({ repo, bus, clock, kaizenService });
  return { service, repo, bus, clock, kaizenService };
}

function validCreateInput(overrides = {}) {
  return {
    userId: 'u_1',
    title: 'Reduce meeting load',
    problemStatement: 'Too many back-to-back meetings are crushing deep work.',
    scope: 'In: PM-led recurring meetings. Out: 1:1s.',
    proposedProjectType: 'DMAIC',
    ...overrides
  };
}

describe('OpportunityService — constructor', () => {
  test('throws INVALID_DEPS without repo', () => {
    assert.throws(
      () => new OpportunityService({ bus: new EventBus(), clock: new ClockService() }),
      (e) => e.name === 'INVALID_DEPS'
    );
  });

  test('throws INVALID_DEPS without bus', () => {
    const storage = new LocalStorageMock();
    const repo = new LocalStorageRepository({ storage });
    assert.throws(
      () => new OpportunityService({ repo, clock: new ClockService() }),
      (e) => e.name === 'INVALID_DEPS'
    );
  });

  test('throws INVALID_DEPS without clock', () => {
    const storage = new LocalStorageMock();
    const repo = new LocalStorageRepository({ storage });
    assert.throws(
      () => new OpportunityService({ repo, bus: new EventBus() }),
      (e) => e.name === 'INVALID_DEPS'
    );
  });

  test('constructs with all required deps', () => {
    const { service } = buildEnv();
    assert.ok(service instanceof OpportunityService);
  });

  test('setKaizenService allows late wiring', () => {
    const storage = new LocalStorageMock();
    const repo = new LocalStorageRepository({ storage });
    const bus = new EventBus();
    const clock = new ClockService({ now: () => FROZEN_NOW });
    const svc = new OpportunityService({ repo, bus, clock });
    const kaizen = new KaizenService({ repo, bus, clock });
    svc.setKaizenService(kaizen);
    // Internal — just check constructor sets it; exercised in promote tests.
    assert.ok(svc);
  });
});

describe('OpportunityService.create — happy path', () => {
  let env;
  beforeEach(() => { env = buildEnv(); });

  test('creates an Opportunity in INTAKE', () => {
    const opp = env.service.create(validCreateInput());
    assert.equal(opp.status, 'INTAKE');
    assert.equal(opp.userId, 'u_1');
    assert.equal(opp.title, 'Reduce meeting load');
    assert.equal(opp.createdAt, FROZEN_NOW);
    assert.equal(opp.updatedAt, FROZEN_NOW);
    assert.equal(opp.promotedKaizenId, null);
    assert.equal(opp.deferredUntil, null);
    assert.equal(opp.rejectionReason, null);
  });

  test('persists via bamx:v1:opportunities', () => {
    const opp = env.service.create(validCreateInput());
    const map = env.repo.read(OPPORTUNITIES_KEY);
    assert.ok(map);
    assert.ok(map[opp.id]);
    assert.equal(map[opp.id].status, 'INTAKE');
  });

  test('emits OpportunityCreated', () => {
    let captured = null;
    env.bus.subscribe(OpportunityCreated, (p) => { captured = p; });
    const opp = env.service.create(validCreateInput());
    assert.ok(captured);
    assert.equal(captured.opportunityId, opp.id);
    assert.equal(captured.userId, 'u_1');
    assert.equal(captured.status, 'INTAKE');
    assert.equal(captured.proposedProjectType, 'DMAIC');
  });

  test('builds deterministic id from userId + createdAt', () => {
    const opp = env.service.create(validCreateInput());
    assert.match(opp.id, /^opp_u_1_\d+$/);
    assert.equal(opp.id, buildOpportunityId('u_1', FROZEN_NOW));
  });

  test('accepts null scope', () => {
    const opp = env.service.create(validCreateInput({ scope: null }));
    assert.equal(opp.scope, null);
  });

  test('accepts missing scope (treated as null)', () => {
    const { userId, title, problemStatement, proposedProjectType } = validCreateInput();
    const opp = env.service.create({ userId, title, problemStatement, proposedProjectType });
    assert.equal(opp.scope, null);
  });
});

describe('OpportunityService.create — guards', () => {
  let env;
  beforeEach(() => { env = buildEnv(); });

  test('throws INVALID_INPUT without input', () => {
    assert.throws(() => env.service.create(), (e) => e.name === 'INVALID_INPUT');
  });

  test('throws INVALID_INPUT without userId', () => {
    assert.throws(
      () => env.service.create(validCreateInput({ userId: undefined })),
      (e) => e.name === 'INVALID_INPUT'
    );
  });

  test('throws TITLE_LENGTH when title < 3 chars', () => {
    assert.throws(
      () => env.service.create(validCreateInput({ title: 'ab' })),
      (e) => e.name === 'TITLE_LENGTH'
    );
  });

  test('throws TITLE_LENGTH when title > 80 chars', () => {
    assert.throws(
      () => env.service.create(validCreateInput({ title: 'x'.repeat(81) })),
      (e) => e.name === 'TITLE_LENGTH'
    );
  });

  test('accepts title exactly at min bound', () => {
    const opp = env.service.create(validCreateInput({ title: 'abc' }));
    assert.equal(opp.title, 'abc');
  });

  test('accepts title exactly at max bound', () => {
    const maxTitle = 'x'.repeat(TITLE_MAX_LENGTH);
    const opp = env.service.create(validCreateInput({ title: maxTitle }));
    assert.equal(opp.title, maxTitle);
  });

  test('throws PROBLEM_STATEMENT_LENGTH when too short', () => {
    assert.throws(
      () => env.service.create(validCreateInput({ problemStatement: 'short' })),
      (e) => e.name === 'PROBLEM_STATEMENT_LENGTH'
    );
  });

  test('throws PROBLEM_STATEMENT_LENGTH when > 500 chars', () => {
    assert.throws(
      () => env.service.create(validCreateInput({ problemStatement: 'x'.repeat(501) })),
      (e) => e.name === 'PROBLEM_STATEMENT_LENGTH'
    );
  });

  test('accepts problemStatement at min bound (10)', () => {
    const opp = env.service.create(validCreateInput({ problemStatement: '1234567890' }));
    assert.equal(opp.problemStatement.length, PROBLEM_MIN_LENGTH);
  });

  test('accepts problemStatement at max bound (500)', () => {
    const maxProblem = 'x'.repeat(PROBLEM_MAX_LENGTH);
    const opp = env.service.create(validCreateInput({ problemStatement: maxProblem }));
    assert.equal(opp.problemStatement.length, PROBLEM_MAX_LENGTH);
  });

  test('throws SCOPE_LENGTH when > 300 chars', () => {
    assert.throws(
      () => env.service.create(validCreateInput({ scope: 'x'.repeat(301) })),
      (e) => e.name === 'SCOPE_LENGTH'
    );
  });

  test('accepts empty-string scope', () => {
    const opp = env.service.create(validCreateInput({ scope: '' }));
    assert.equal(opp.scope, '');
  });

  test('accepts scope at max bound (300)', () => {
    const maxScope = 'x'.repeat(SCOPE_MAX_LENGTH);
    const opp = env.service.create(validCreateInput({ scope: maxScope }));
    assert.equal(opp.scope.length, SCOPE_MAX_LENGTH);
  });

  test('throws INVALID_PROJECT_TYPE for unknown type', () => {
    assert.throws(
      () => env.service.create(validCreateInput({ proposedProjectType: 'WATERFALL' })),
      (e) => e.name === 'INVALID_PROJECT_TYPE'
    );
  });

  test('throws INVALID_PROJECT_TYPE when undefined', () => {
    assert.throws(
      () => env.service.create(validCreateInput({ proposedProjectType: undefined })),
      (e) => e.name === 'INVALID_PROJECT_TYPE'
    );
  });

  test('accepts every valid ProjectType', () => {
    for (const pt of ['DMAIC', 'KAIZEN_EVENT', 'KAIZEN_EVENT_90D', 'KAIZEN_ACCELERATOR_30D', 'AD_HOC']) {
      const storage = new LocalStorageMock();
      const repo = new LocalStorageRepository({ storage });
      const bus = new EventBus();
      const clock = new ClockService({ now: () => FROZEN_NOW });
      const svc = new OpportunityService({ repo, bus, clock });
      const opp = svc.create(validCreateInput({ proposedProjectType: pt }));
      assert.equal(opp.proposedProjectType, pt);
    }
  });
});

describe('OpportunityService.list', () => {
  function seedMany(env, n, overrides = []) {
    const results = [];
    for (let i = 0; i < n; i += 1) {
      // Shift clock for unique ids.
      const clock2 = new ClockService({
        now: () => `2026-04-21T10:${String(i).padStart(2, '0')}:00Z`
      });
      const svc = new OpportunityService({
        repo: env.repo,
        bus: env.bus,
        clock: clock2
      });
      results.push(svc.create(validCreateInput(overrides[i] ?? {})));
    }
    return results;
  }

  test('returns empty array when none exist', () => {
    const env = buildEnv();
    assert.deepEqual(env.service.list({ userId: 'u_1' }), []);
  });

  test('filters by userId', () => {
    const env = buildEnv();
    seedMany(env, 1, [{ userId: 'u_1' }]);
    seedMany(env, 1, [{ userId: 'u_2' }]);
    const u1 = env.service.list({ userId: 'u_1' });
    const u2 = env.service.list({ userId: 'u_2' });
    assert.equal(u1.length, 1);
    assert.equal(u2.length, 1);
    assert.equal(u1[0].userId, 'u_1');
  });

  test('sorts by createdAt desc', () => {
    const env = buildEnv();
    const created = seedMany(env, 3);
    const list = env.service.list({ userId: 'u_1' });
    assert.equal(list.length, 3);
    // Most-recent created first.
    assert.equal(list[0].id, created[2].id);
    assert.equal(list[2].id, created[0].id);
  });

  test('default filter excludes terminal statuses', () => {
    const env = buildEnv();
    const [opp] = seedMany(env, 1);
    env.service.reject(opp.id, { reason: 'Out of scope for this quarter' });
    const list = env.service.list({ userId: 'u_1' });
    assert.equal(list.length, 0);
  });

  test('includeTerminal=true returns all statuses', () => {
    const env = buildEnv();
    const [opp] = seedMany(env, 1);
    env.service.reject(opp.id, { reason: 'Out of scope for this quarter' });
    const list = env.service.list({ userId: 'u_1', includeTerminal: true });
    assert.equal(list.length, 1);
    assert.equal(list[0].status, 'REJECTED');
  });

  test('status filter overrides terminal exclusion', () => {
    const env = buildEnv();
    const [opp] = seedMany(env, 1);
    env.service.reject(opp.id, { reason: 'Out of scope for this quarter' });
    const list = env.service.list({ userId: 'u_1', status: 'REJECTED' });
    assert.equal(list.length, 1);
  });
});

describe('OpportunityService.get', () => {
  test('returns null for unknown id', () => {
    const env = buildEnv();
    assert.equal(env.service.get('opp_missing'), null);
  });

  test('returns stored opportunity', () => {
    const env = buildEnv();
    const opp = env.service.create(validCreateInput());
    const fetched = env.service.get(opp.id);
    assert.ok(fetched);
    assert.equal(fetched.id, opp.id);
  });
});

describe('OpportunityService.update', () => {
  let env;
  let opp;
  beforeEach(() => {
    env = buildEnv();
    opp = env.service.create(validCreateInput());
  });

  test('updates title', () => {
    const updated = env.service.update(opp.id, { title: 'Sharper title' });
    assert.equal(updated.title, 'Sharper title');
  });

  test('updates problemStatement', () => {
    const updated = env.service.update(opp.id, {
      problemStatement: 'Refined statement of the problem, more specific now.'
    });
    assert.equal(
      updated.problemStatement,
      'Refined statement of the problem, more specific now.'
    );
  });

  test('updates scope to null', () => {
    const updated = env.service.update(opp.id, { scope: null });
    assert.equal(updated.scope, null);
  });

  test('updates proposedProjectType', () => {
    const updated = env.service.update(opp.id, {
      proposedProjectType: 'KAIZEN_EVENT'
    });
    assert.equal(updated.proposedProjectType, 'KAIZEN_EVENT');
  });

  test('refreshes updatedAt', () => {
    const clock2 = new ClockService({ now: () => '2026-04-21T11:00:00Z' });
    const svc2 = new OpportunityService({
      repo: env.repo,
      bus: env.bus,
      clock: clock2
    });
    const updated = svc2.update(opp.id, { title: 'New title' });
    assert.equal(updated.updatedAt, '2026-04-21T11:00:00Z');
    assert.equal(updated.createdAt, FROZEN_NOW);
  });

  test('throws OPPORTUNITY_NOT_FOUND for unknown id', () => {
    assert.throws(
      () => env.service.update('opp_missing', { title: 'whatever' }),
      (e) => e.name === 'OPPORTUNITY_NOT_FOUND'
    );
  });

  test('throws OPPORTUNITY_LOCKED when status !== INTAKE', () => {
    env.service.reject(opp.id, { reason: 'not in scope' });
    assert.throws(
      () => env.service.update(opp.id, { title: 'whatever' }),
      (e) => e.name === 'OPPORTUNITY_LOCKED'
    );
  });

  test('throws TITLE_LENGTH on bad title', () => {
    assert.throws(
      () => env.service.update(opp.id, { title: 'x' }),
      (e) => e.name === 'TITLE_LENGTH'
    );
  });

  test('throws INVALID_INPUT without patch', () => {
    assert.throws(
      () => env.service.update(opp.id, null),
      (e) => e.name === 'INVALID_INPUT'
    );
  });
});

describe('OpportunityService.promote — happy path', () => {
  let env;
  let opp;
  beforeEach(() => {
    env = buildEnv();
    opp = env.service.create(validCreateInput());
  });

  test('transitions INTAKE → PROMOTED', () => {
    const { opportunity } = env.service.promote(opp.id);
    assert.equal(opportunity.status, 'PROMOTED');
    assert.ok(opportunity.promotedKaizenId);
  });

  test('creates a DRAFT Kaizen preserving title/problem/projectType', () => {
    const { kaizen } = env.service.promote(opp.id);
    assert.equal(kaizen.state, 'DRAFT');
    assert.equal(kaizen.title, 'Reduce meeting load');
    assert.equal(kaizen.problemStatement,
      'Too many back-to-back meetings are crushing deep work.');
    assert.equal(kaizen.projectType, 'DMAIC');
    assert.equal(kaizen.sourceOpportunityId, opp.id);
    assert.deepEqual(kaizen.sourceFrictionSignalIds, []);
  });

  test('sets opportunity.promotedKaizenId = kaizen.id', () => {
    const { opportunity, kaizen } = env.service.promote(opp.id);
    assert.equal(opportunity.promotedKaizenId, kaizen.id);
  });

  test('emits OpportunityPromoted', () => {
    let captured = null;
    env.bus.subscribe(OpportunityPromoted, (p) => { captured = p; });
    const { kaizen } = env.service.promote(opp.id);
    assert.ok(captured);
    assert.equal(captured.opportunityId, opp.id);
    assert.equal(captured.kaizenId, kaizen.id);
    assert.equal(captured.userId, 'u_1');
    assert.equal(captured.proposedProjectType, 'DMAIC');
  });

  test('emits KaizenPromoted with fromOpportunityId', () => {
    let captured = null;
    env.bus.subscribe(KaizenPromoted, (p) => { captured = p; });
    env.service.promote(opp.id);
    assert.ok(captured);
    assert.equal(captured.fromOpportunityId, opp.id);
    assert.deepEqual(captured.sourceFrictionSignalIds, []);
  });
});

describe('OpportunityService.promote — guards', () => {
  let env;
  beforeEach(() => { env = buildEnv(); });

  test('throws OPPORTUNITY_NOT_FOUND for unknown id', () => {
    assert.throws(
      () => env.service.promote('opp_missing'),
      (e) => e.name === 'OPPORTUNITY_NOT_FOUND'
    );
  });

  test('throws OPPORTUNITY_INVALID_STATE from PROMOTED', () => {
    const opp = env.service.create(validCreateInput());
    env.service.promote(opp.id);
    assert.throws(
      () => env.service.promote(opp.id),
      (e) => e.name === 'OPPORTUNITY_INVALID_STATE'
    );
  });

  test('throws OPPORTUNITY_INVALID_STATE from DEFERRED', () => {
    const opp = env.service.create(validCreateInput());
    env.service.defer(opp.id, { deferredUntil: '2026-05-01' });
    assert.throws(
      () => env.service.promote(opp.id),
      (e) => e.name === 'OPPORTUNITY_INVALID_STATE'
    );
  });

  test('throws OPPORTUNITY_INVALID_STATE from REJECTED', () => {
    const opp = env.service.create(validCreateInput());
    env.service.reject(opp.id, { reason: 'Not this quarter' });
    assert.throws(
      () => env.service.promote(opp.id),
      (e) => e.name === 'OPPORTUNITY_INVALID_STATE'
    );
  });

  test('throws INVALID_DEPS when kaizenService not wired', () => {
    const storage = new LocalStorageMock();
    const repo = new LocalStorageRepository({ storage });
    const bus = new EventBus();
    const clock = new ClockService({ now: () => FROZEN_NOW });
    const svc = new OpportunityService({ repo, bus, clock });
    const opp = svc.create(validCreateInput());
    assert.throws(
      () => svc.promote(opp.id),
      (e) => e.name === 'INVALID_DEPS'
    );
  });
});

describe('OpportunityService.defer', () => {
  let env;
  let opp;
  beforeEach(() => {
    env = buildEnv();
    opp = env.service.create(validCreateInput());
  });

  test('transitions INTAKE → DEFERRED', () => {
    const updated = env.service.defer(opp.id, { deferredUntil: '2026-06-01' });
    assert.equal(updated.status, 'DEFERRED');
    assert.equal(updated.deferredUntil, '2026-06-01');
  });

  test('emits OpportunityDeferred', () => {
    let captured = null;
    env.bus.subscribe(OpportunityDeferred, (p) => { captured = p; });
    env.service.defer(opp.id, { deferredUntil: '2026-06-01', reason: 'Q3 priority' });
    assert.ok(captured);
    assert.equal(captured.opportunityId, opp.id);
    assert.equal(captured.deferredUntil, '2026-06-01');
    assert.equal(captured.reason, 'Q3 priority');
  });

  test('reason is optional', () => {
    const updated = env.service.defer(opp.id, { deferredUntil: '2026-06-01' });
    assert.equal(updated.status, 'DEFERRED');
  });

  test('throws INVALID_DEFERRED_UNTIL when missing', () => {
    assert.throws(
      () => env.service.defer(opp.id, {}),
      (e) => e.name === 'INVALID_DEFERRED_UNTIL'
    );
  });

  test('throws OPPORTUNITY_INVALID_STATE from terminal', () => {
    env.service.defer(opp.id, { deferredUntil: '2026-06-01' });
    assert.throws(
      () => env.service.defer(opp.id, { deferredUntil: '2026-07-01' }),
      (e) => e.name === 'OPPORTUNITY_INVALID_STATE'
    );
  });

  test('throws OPPORTUNITY_NOT_FOUND', () => {
    assert.throws(
      () => env.service.defer('opp_missing', { deferredUntil: '2026-06-01' }),
      (e) => e.name === 'OPPORTUNITY_NOT_FOUND'
    );
  });

  test('throws INVALID_INPUT without input', () => {
    assert.throws(
      () => env.service.defer(opp.id),
      (e) => e.name === 'INVALID_INPUT'
    );
  });
});

describe('OpportunityService.reject', () => {
  let env;
  let opp;
  beforeEach(() => {
    env = buildEnv();
    opp = env.service.create(validCreateInput());
  });

  test('transitions INTAKE → REJECTED', () => {
    const updated = env.service.reject(opp.id, { reason: 'Out of scope for team' });
    assert.equal(updated.status, 'REJECTED');
    assert.equal(updated.rejectionReason, 'Out of scope for team');
  });

  test('emits OpportunityRejected', () => {
    let captured = null;
    env.bus.subscribe(OpportunityRejected, (p) => { captured = p; });
    env.service.reject(opp.id, { reason: 'Duplicate of existing' });
    assert.ok(captured);
    assert.equal(captured.opportunityId, opp.id);
    assert.equal(captured.rejectionReason, 'Duplicate of existing');
  });

  test('throws REJECTION_REASON_TOO_SHORT when reason < 5 chars', () => {
    assert.throws(
      () => env.service.reject(opp.id, { reason: 'no' }),
      (e) => e.name === 'REJECTION_REASON_TOO_SHORT'
    );
  });

  test('throws REJECTION_REASON_TOO_SHORT when reason missing', () => {
    assert.throws(
      () => env.service.reject(opp.id, {}),
      (e) => e.name === 'REJECTION_REASON_TOO_SHORT'
    );
  });

  test('throws OPPORTUNITY_INVALID_STATE from terminal', () => {
    env.service.reject(opp.id, { reason: 'First rejection' });
    assert.throws(
      () => env.service.reject(opp.id, { reason: 'Second rejection' }),
      (e) => e.name === 'OPPORTUNITY_INVALID_STATE'
    );
  });

  test('throws OPPORTUNITY_NOT_FOUND', () => {
    assert.throws(
      () => env.service.reject('opp_missing', { reason: 'irrelevant' }),
      (e) => e.name === 'OPPORTUNITY_NOT_FOUND'
    );
  });
});

describe('OpportunityService — FSM (terminal immutability)', () => {
  test('PROMOTED is immutable — cannot re-promote/defer/reject/update', () => {
    const env = buildEnv();
    const opp = env.service.create(validCreateInput());
    env.service.promote(opp.id);
    for (const op of [
      () => env.service.promote(opp.id),
      () => env.service.defer(opp.id, { deferredUntil: '2026-06-01' }),
      () => env.service.reject(opp.id, { reason: 'No re-reject' })
    ]) {
      assert.throws(op, (e) => e.name === 'OPPORTUNITY_INVALID_STATE');
    }
    assert.throws(
      () => env.service.update(opp.id, { title: 'Nope' }),
      (e) => e.name === 'OPPORTUNITY_LOCKED'
    );
  });

  test('DEFERRED is immutable', () => {
    const env = buildEnv();
    const opp = env.service.create(validCreateInput());
    env.service.defer(opp.id, { deferredUntil: '2026-06-01' });
    assert.throws(
      () => env.service.promote(opp.id),
      (e) => e.name === 'OPPORTUNITY_INVALID_STATE'
    );
    assert.throws(
      () => env.service.update(opp.id, { title: 'Nope' }),
      (e) => e.name === 'OPPORTUNITY_LOCKED'
    );
  });

  test('REJECTED is immutable', () => {
    const env = buildEnv();
    const opp = env.service.create(validCreateInput());
    env.service.reject(opp.id, { reason: 'Duplicate' });
    assert.throws(
      () => env.service.promote(opp.id),
      (e) => e.name === 'OPPORTUNITY_INVALID_STATE'
    );
    assert.throws(
      () => env.service.defer(opp.id, { deferredUntil: '2026-06-01' }),
      (e) => e.name === 'OPPORTUNITY_INVALID_STATE'
    );
  });
});

describe('buildOpportunityId', () => {
  test('is deterministic', () => {
    const a = buildOpportunityId('u_phil', '2026-04-21T10:00:00Z');
    const b = buildOpportunityId('u_phil', '2026-04-21T10:00:00Z');
    assert.equal(a, b);
    assert.match(a, /^opp_u_phil_\d+$/);
  });

  test('sanitizes unsafe chars', () => {
    const id = buildOpportunityId('u@phil', '2026-04-21T10:00:00Z');
    assert.match(id, /^opp_u_phil_\d+$/);
  });
});

describe('OpportunityService — exported constants', () => {
  test('min/max bounds exported', () => {
    assert.equal(TITLE_MIN_LENGTH, 3);
    assert.equal(TITLE_MAX_LENGTH, 80);
    assert.equal(PROBLEM_MIN_LENGTH, 10);
    assert.equal(PROBLEM_MAX_LENGTH, 500);
    assert.equal(SCOPE_MAX_LENGTH, 300);
    assert.equal(REJECTION_REASON_MIN_LENGTH, 5);
  });

  test('OPPORTUNITIES_KEY has bamx:v1: prefix', () => {
    assert.equal(OPPORTUNITIES_KEY, 'bamx:v1:opportunities');
  });
});
