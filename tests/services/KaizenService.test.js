/**
 * Tests for KaizenService (Sprint 6 P0-T5 + P0-T6).
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  KaizenService,
  KAIZENS_KEY,
  BASELINE_METRICS_KEY,
  PROBLEM_STATEMENT_MIN_LENGTH,
  buildKaizenId,
  buildBaselineMetricId
} from '../../js/services/KaizenService.js';
import {
  FrictionService,
  FRICTION_SIGNALS_KEY
} from '../../js/services/FrictionService.js';
import {
  KaizenPromoted,
  KaizenBaselineLocked
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
  const frictionService = new FrictionService({ repo, bus, clock });
  const service = new KaizenService({ repo, bus, clock, frictionService });
  return { service, repo, bus, clock, frictionService };
}

let SEED_COUNTER = 0;
function seedSignals(env, n, tag = 'MEETING_LOAD', userId = 'u_1') {
  const ids = [];
  for (let i = 0; i < n; i += 1) {
    SEED_COUNTER += 1;
    const s = env.frictionService.capture({
      reflectionId: `ref_${SEED_COUNTER}`,
      scheduledActivityId: `sa_${SEED_COUNTER}`,
      userId,
      summary: `sig ${SEED_COUNTER}`,
      tag
    });
    ids.push(s.id);
  }
  return ids;
}

describe('KaizenService — constructor', () => {
  test('throws INVALID_DEPS without repo', () => {
    assert.throws(
      () => new KaizenService({ bus: new EventBus(), clock: new ClockService() }),
      (e) => e.name === 'INVALID_DEPS'
    );
  });

  test('throws INVALID_DEPS without bus', () => {
    const storage = new LocalStorageMock();
    const repo = new LocalStorageRepository({ storage });
    assert.throws(
      () => new KaizenService({ repo, clock: new ClockService() }),
      (e) => e.name === 'INVALID_DEPS'
    );
  });

  test('throws INVALID_DEPS without clock', () => {
    const storage = new LocalStorageMock();
    const repo = new LocalStorageRepository({ storage });
    assert.throws(
      () => new KaizenService({ repo, bus: new EventBus() }),
      (e) => e.name === 'INVALID_DEPS'
    );
  });

  test('constructs with all required deps', () => {
    const { service } = buildEnv();
    assert.ok(service instanceof KaizenService);
  });
});

describe('KaizenService.promote — happy path', () => {
  let env;
  beforeEach(() => {
    env = buildEnv();
  });

  test('creates a DRAFT Kaizen', () => {
    const ids = seedSignals(env, 3);
    const { kaizen } = env.service.promote({
      userId: 'u_1',
      fromFrictionClusterSignalIds: ids,
      problemStatement: 'Too many back-to-back meetings are killing deep work',
      title: 'Reclaim mornings'
    });
    assert.equal(kaizen.state, 'DRAFT');
    assert.equal(kaizen.title, 'Reclaim mornings');
    assert.equal(kaizen.openedAt, FROZEN_NOW);
    assert.equal(kaizen.projectType, 'AD_HOC');
    assert.equal(kaizen.baselineMetricId, null);
  });

  test('flips referenced FrictionSignals to PROMOTED_TO_KAIZEN', () => {
    const ids = seedSignals(env, 3);
    const { kaizen } = env.service.promote({
      userId: 'u_1',
      fromFrictionClusterSignalIds: ids,
      problemStatement: 'A sufficiently long statement about friction'
    });
    const signalMap = env.repo.read(FRICTION_SIGNALS_KEY);
    for (const sid of ids) {
      assert.equal(signalMap[sid].status, 'PROMOTED_TO_KAIZEN');
      assert.equal(signalMap[sid].kaizenId, kaizen.id);
    }
  });

  test('sourceFrictionSignalIds stored on the Kaizen', () => {
    const ids = seedSignals(env, 2);
    const { kaizen } = env.service.promote({
      userId: 'u_1',
      fromFrictionClusterSignalIds: ids,
      problemStatement: 'Some problem statement longer than ten chars'
    });
    assert.deepEqual(kaizen.sourceFrictionSignalIds, ids);
  });

  test('publishes KaizenPromoted', () => {
    const ids = seedSignals(env, 2);
    let captured = null;
    env.bus.subscribe(KaizenPromoted, (p) => {
      captured = p;
    });
    const { kaizen } = env.service.promote({
      userId: 'u_1',
      fromFrictionClusterSignalIds: ids,
      problemStatement: 'A detailed problem statement'
    });
    assert.ok(captured);
    assert.equal(captured.kaizenId, kaizen.id);
    assert.equal(captured.sourceFrictionSignalIds.length, 2);
  });

  test('multiple DRAFT kaizens allowed (MVP cap only applies to ACTIVE)', () => {
    const ids1 = seedSignals(env, 1);
    const ids2 = seedSignals(env, 1, 'TOOL_FRICTION');
    const r1 = env.service.promote({
      userId: 'u_1',
      fromFrictionClusterSignalIds: ids1,
      problemStatement: 'Problem one with lots of text'
    });
    const env2 = { ...env };
    // Fast-forward clock so ids differ.
    const clock2 = new ClockService({ now: () => '2026-04-21T10:05:00Z' });
    const svc2 = new KaizenService({
      repo: env.repo,
      bus: env.bus,
      clock: clock2,
      frictionService: env.frictionService
    });
    const r2 = svc2.promote({
      userId: 'u_1',
      fromFrictionClusterSignalIds: ids2,
      problemStatement: 'Problem two with lots of text'
    });
    assert.notEqual(r1.kaizen.id, r2.kaizen.id);
  });
});

describe('KaizenService.promote — guards', () => {
  test('throws EMPTY_CLUSTER when ids array empty', () => {
    const { service } = buildEnv();
    assert.throws(
      () =>
        service.promote({
          userId: 'u_1',
          fromFrictionClusterSignalIds: [],
          problemStatement: 'A proper length statement'
        }),
      (e) => e.name === 'EMPTY_CLUSTER'
    );
  });

  test('throws EMPTY_CLUSTER when ids missing', () => {
    const { service } = buildEnv();
    assert.throws(
      () =>
        service.promote({
          userId: 'u_1',
          problemStatement: 'A proper length statement'
        }),
      (e) => e.name === 'EMPTY_CLUSTER'
    );
  });

  test('throws PROBLEM_STATEMENT_TOO_SHORT when < min chars', () => {
    const env = buildEnv();
    const ids = seedSignals(env, 1);
    assert.throws(
      () =>
        env.service.promote({
          userId: 'u_1',
          fromFrictionClusterSignalIds: ids,
          problemStatement: 'short'
        }),
      (e) => e.name === 'PROBLEM_STATEMENT_TOO_SHORT'
    );
  });

  test('throws SIGNAL_NOT_FOUND for unknown signal id', () => {
    const env = buildEnv();
    assert.throws(
      () =>
        env.service.promote({
          userId: 'u_1',
          fromFrictionClusterSignalIds: ['fs_ghost'],
          problemStatement: 'A proper length statement'
        }),
      (e) => e.name === 'SIGNAL_NOT_FOUND'
    );
  });

  test('throws SIGNAL_ALREADY_PROMOTED when a signal is terminal', () => {
    const env = buildEnv();
    const ids = seedSignals(env, 2);
    // First promote flips them to PROMOTED_TO_KAIZEN.
    env.service.promote({
      userId: 'u_1',
      fromFrictionClusterSignalIds: ids,
      problemStatement: 'A proper length statement'
    });
    assert.throws(
      () =>
        env.service.promote({
          userId: 'u_1',
          fromFrictionClusterSignalIds: ids,
          problemStatement: 'A proper length statement'
        }),
      (e) => e.name === 'SIGNAL_ALREADY_PROMOTED'
    );
  });

  test('atomic rollback: mixed valid+promoted ids → nothing lands', () => {
    const env = buildEnv();
    const ids = seedSignals(env, 2);
    env.service.promote({
      userId: 'u_1',
      fromFrictionClusterSignalIds: [ids[0]],
      problemStatement: 'First promotion with valid phrasing'
    });
    const kaizensBefore = Object.keys(env.repo.read(KAIZENS_KEY) ?? {}).length;
    assert.throws(
      () =>
        env.service.promote({
          userId: 'u_1',
          fromFrictionClusterSignalIds: ids, // ids[0] is now terminal
          problemStatement: 'Second promotion should fail'
        }),
      (e) => e.name === 'SIGNAL_ALREADY_PROMOTED'
    );
    const kaizensAfter = Object.keys(env.repo.read(KAIZENS_KEY) ?? {}).length;
    assert.equal(kaizensAfter, kaizensBefore, 'no Kaizen should have been created');
    // ids[1] must still be OPEN, NOT touched.
    const signals = env.repo.read(FRICTION_SIGNALS_KEY);
    assert.equal(signals[ids[1]].status, 'OPEN');
  });

  test('throws INVALID_INPUT when userId missing', () => {
    const env = buildEnv();
    const ids = seedSignals(env, 1);
    assert.throws(
      () =>
        env.service.promote({
          fromFrictionClusterSignalIds: ids,
          problemStatement: 'A proper length statement'
        }),
      (e) => e.name === 'INVALID_INPUT'
    );
  });
});

describe('KaizenService.setGoalStatement', () => {
  let env;
  let kaizenId;
  beforeEach(() => {
    env = buildEnv();
    const ids = seedSignals(env, 1);
    const { kaizen } = env.service.promote({
      userId: 'u_1',
      fromFrictionClusterSignalIds: ids,
      problemStatement: 'A detailed problem statement'
    });
    kaizenId = kaizen.id;
  });

  test('persists the goalStatement', () => {
    const k = env.service.setGoalStatement(kaizenId, 'Reduce X from 5 to 2');
    assert.equal(k.goalStatement, 'Reduce X from 5 to 2');
  });

  test('throws KAIZEN_NOT_FOUND on unknown id', () => {
    assert.throws(
      () => env.service.setGoalStatement('k_missing', 'goal'),
      (e) => e.name === 'KAIZEN_NOT_FOUND'
    );
  });
});

describe('KaizenService.addAction / removeAction', () => {
  let env;
  let kaizenId;
  beforeEach(() => {
    env = buildEnv();
    const ids = seedSignals(env, 1);
    kaizenId = env.service.promote({
      userId: 'u_1',
      fromFrictionClusterSignalIds: ids,
      problemStatement: 'A proper problem statement'
    }).kaizen.id;
  });

  test('addAction appends a normalized action', () => {
    const k = env.service.addAction(kaizenId, {
      name: 'Block mornings',
      ownerRef: 'u_1',
      dueDate: '2026-05-01'
    });
    assert.equal(k.actions.length, 1);
    assert.equal(k.actions[0].doneAt, null);
    assert.equal(k.actions[0].strategic, false);
  });

  test('addAction guards missing fields', () => {
    assert.throws(
      () =>
        env.service.addAction(kaizenId, {
          ownerRef: 'u_1',
          dueDate: '2026-05-01'
        }),
      (e) => e.name === 'INVALID_INPUT'
    );
  });

  test('removeAction by index', () => {
    env.service.addAction(kaizenId, {
      name: 'A',
      ownerRef: 'u_1',
      dueDate: '2026-05-01'
    });
    env.service.addAction(kaizenId, {
      name: 'B',
      ownerRef: 'u_1',
      dueDate: '2026-05-02'
    });
    const k = env.service.removeAction(kaizenId, 0);
    assert.equal(k.actions.length, 1);
    assert.equal(k.actions[0].name, 'B');
  });

  test('removeAction invalid index throws', () => {
    assert.throws(
      () => env.service.removeAction(kaizenId, 5),
      (e) => e.name === 'INVALID_INPUT'
    );
  });
});

describe('KaizenService.lockBaseline — happy path', () => {
  let env;
  let kaizenId;
  beforeEach(() => {
    env = buildEnv();
    const ids = seedSignals(env, 2);
    kaizenId = env.service.promote({
      userId: 'u_1',
      fromFrictionClusterSignalIds: ids,
      problemStatement: 'A proper problem statement'
    }).kaizen.id;
    env.service.setGoalStatement(kaizenId, 'Target improvement');
    env.service.addAction(kaizenId, {
      name: 'A1',
      ownerRef: 'u_1',
      dueDate: '2026-05-01'
    });
  });

  test('transitions DRAFT → ACTIVE', () => {
    const { kaizen } = env.service.lockBaseline(kaizenId, {
      metricName: 'Adherence',
      unit: '%',
      operationalDefinition: 'Measured weekly',
      sampleSize: 10,
      method: 'Manual count',
      value: 42
    });
    assert.equal(kaizen.state, 'ACTIVE');
    assert.equal(kaizen.baselineMetricId, buildBaselineMetricId(kaizenId));
  });

  test('persists a locked BaselineMetric', () => {
    env.service.lockBaseline(kaizenId, {
      metricName: 'Adherence',
      unit: '%',
      operationalDefinition: 'Measured weekly',
      sampleSize: 10,
      method: 'Manual count',
      value: 42
    });
    const map = env.repo.read(BASELINE_METRICS_KEY);
    const bm = map[buildBaselineMetricId(kaizenId)];
    assert.ok(bm);
    assert.equal(bm.locked, true);
    assert.equal(bm.value, 42);
    assert.equal(bm.metricDefinition.name, 'Adherence');
    assert.equal(bm.metricDefinition.unit, '%');
    assert.equal(bm.metricDefinition.sampleSize, 10);
  });

  test('publishes KaizenBaselineLocked', () => {
    let captured = null;
    env.bus.subscribe(KaizenBaselineLocked, (p) => {
      captured = p;
    });
    env.service.lockBaseline(kaizenId, {
      metricName: 'Adherence',
      unit: '%',
      operationalDefinition: 'Measured weekly',
      sampleSize: 10,
      method: 'Manual count',
      value: 42
    });
    assert.ok(captured);
    assert.equal(captured.kaizenId, kaizenId);
    assert.equal(captured.value, 42);
  });

  test('getBaselineForKaizen resolves the new baseline', () => {
    env.service.lockBaseline(kaizenId, {
      metricName: 'Adherence',
      unit: '%',
      operationalDefinition: 'Measured weekly',
      sampleSize: 10,
      method: 'Manual count',
      value: 42
    });
    const bm = env.service.getBaselineForKaizen(kaizenId);
    assert.ok(bm);
    assert.equal(bm.locked, true);
  });
});

describe('KaizenService.lockBaseline — guards', () => {
  let env;
  let kaizenId;
  beforeEach(() => {
    env = buildEnv();
    const ids = seedSignals(env, 1);
    kaizenId = env.service.promote({
      userId: 'u_1',
      fromFrictionClusterSignalIds: ids,
      problemStatement: 'A proper problem statement'
    }).kaizen.id;
  });

  function validMetric(overrides = {}) {
    return {
      metricName: 'Adherence',
      unit: '%',
      operationalDefinition: 'weekly',
      sampleSize: 10,
      method: 'manual',
      value: 10,
      ...overrides
    };
  }

  test('throws KAIZEN_NOT_FOUND on unknown id', () => {
    assert.throws(
      () => env.service.lockBaseline('k_missing', validMetric()),
      (e) => e.name === 'KAIZEN_NOT_FOUND'
    );
  });

  test('throws MISSING_ACTIONS when actions empty', () => {
    env.service.setGoalStatement(kaizenId, 'goal');
    assert.throws(
      () => env.service.lockBaseline(kaizenId, validMetric()),
      (e) => e.name === 'MISSING_ACTIONS'
    );
  });

  test('throws MISSING_GOAL_STATEMENT when goal not set', () => {
    env.service.addAction(kaizenId, {
      name: 'a',
      ownerRef: 'u',
      dueDate: '2026-05-01'
    });
    assert.throws(
      () => env.service.lockBaseline(kaizenId, validMetric()),
      (e) => e.name === 'MISSING_GOAL_STATEMENT'
    );
  });

  test('throws INVALID_METRIC_VALUE on non-finite value', () => {
    env.service.setGoalStatement(kaizenId, 'g');
    env.service.addAction(kaizenId, {
      name: 'a',
      ownerRef: 'u',
      dueDate: '2026-05-01'
    });
    assert.throws(
      () => env.service.lockBaseline(kaizenId, validMetric({ value: NaN })),
      (e) => e.name === 'INVALID_METRIC_VALUE'
    );
  });

  test('throws MISSING_METRIC_FIELD on missing metricName', () => {
    env.service.setGoalStatement(kaizenId, 'g');
    env.service.addAction(kaizenId, {
      name: 'a',
      ownerRef: 'u',
      dueDate: '2026-05-01'
    });
    assert.throws(
      () =>
        env.service.lockBaseline(kaizenId, validMetric({ metricName: '' })),
      (e) => e.name === 'MISSING_METRIC_FIELD'
    );
  });

  test('throws MISSING_METRIC_FIELD on zero sampleSize', () => {
    env.service.setGoalStatement(kaizenId, 'g');
    env.service.addAction(kaizenId, {
      name: 'a',
      ownerRef: 'u',
      dueDate: '2026-05-01'
    });
    assert.throws(
      () =>
        env.service.lockBaseline(kaizenId, validMetric({ sampleSize: 0 })),
      (e) => e.name === 'MISSING_METRIC_FIELD'
    );
  });

  test('throws KAIZEN_NOT_IN_DRAFT when already ACTIVE', () => {
    env.service.setGoalStatement(kaizenId, 'g');
    env.service.addAction(kaizenId, {
      name: 'a',
      ownerRef: 'u',
      dueDate: '2026-05-01'
    });
    env.service.lockBaseline(kaizenId, validMetric());
    assert.throws(
      () => env.service.lockBaseline(kaizenId, validMetric()),
      (e) => e.name === 'KAIZEN_NOT_IN_DRAFT'
    );
  });

  test('ACTIVE_KAIZEN_CAP_EXCEEDED when user already has ACTIVE Kaizen', () => {
    env.service.setGoalStatement(kaizenId, 'g');
    env.service.addAction(kaizenId, {
      name: 'a',
      ownerRef: 'u',
      dueDate: '2026-05-01'
    });
    env.service.lockBaseline(kaizenId, validMetric());

    // Seed a second DRAFT kaizen for the same user, then try to lock its baseline.
    const ids2 = seedSignals(env, 1, 'TOOL_FRICTION');
    const clock2 = new ClockService({ now: () => '2026-04-21T11:00:00Z' });
    const svc2 = new KaizenService({
      repo: env.repo,
      bus: env.bus,
      clock: clock2,
      frictionService: env.frictionService
    });
    const k2 = svc2.promote({
      userId: 'u_1',
      fromFrictionClusterSignalIds: ids2,
      problemStatement: 'Second proper problem statement'
    }).kaizen;
    svc2.setGoalStatement(k2.id, 'g');
    svc2.addAction(k2.id, {
      name: 'a',
      ownerRef: 'u',
      dueDate: '2026-05-01'
    });
    assert.throws(
      () => svc2.lockBaseline(k2.id, validMetric()),
      (e) => e.name === 'ACTIVE_KAIZEN_CAP_EXCEEDED'
    );
  });
});

describe('KaizenService.markActionDone', () => {
  test('ACTIVE-only; marks an action with doneAt from clock', () => {
    const env = buildEnv();
    const ids = seedSignals(env, 1);
    const kId = env.service.promote({
      userId: 'u_1',
      fromFrictionClusterSignalIds: ids,
      problemStatement: 'A proper problem statement'
    }).kaizen.id;
    env.service.setGoalStatement(kId, 'g');
    env.service.addAction(kId, {
      name: 'a',
      ownerRef: 'u',
      dueDate: '2026-05-01'
    });
    assert.throws(
      () => env.service.markActionDone(kId, 0),
      (e) => e.name === 'KAIZEN_NOT_ACTIVE'
    );
    env.service.lockBaseline(kId, {
      metricName: 'm',
      unit: 'u',
      operationalDefinition: 'o',
      sampleSize: 10,
      method: 'm',
      value: 1
    });
    const k = env.service.markActionDone(kId, 0);
    assert.equal(k.actions[0].doneAt, FROZEN_NOW);
  });
});

describe('KaizenService.list / listByState', () => {
  test('lists by userId + state', () => {
    const env = buildEnv();
    const ids = seedSignals(env, 1);
    env.service.promote({
      userId: 'u_1',
      fromFrictionClusterSignalIds: ids,
      problemStatement: 'A proper problem statement'
    });
    assert.equal(env.service.list({ userId: 'u_1' }).length, 1);
    assert.equal(env.service.listByState('u_1', 'DRAFT').length, 1);
    assert.equal(env.service.listByState('u_1', 'ACTIVE').length, 0);
    assert.equal(env.service.listByState('u_other', 'DRAFT').length, 0);
  });
});

describe('buildKaizenId + buildBaselineMetricId', () => {
  test('builds deterministic ids', () => {
    const k = buildKaizenId('u_phil', '2026-04-21T10:00:00Z');
    assert.match(k, /^k_u_phil_\d+$/);
    const b = buildBaselineMetricId('k_foo');
    assert.equal(b, 'bm_k_foo');
  });
});

describe('PROBLEM_STATEMENT_MIN_LENGTH', () => {
  test('exports 10', () => {
    assert.equal(PROBLEM_STATEMENT_MIN_LENGTH, 10);
  });
});
