/**
 * Tests for ReflectionService (Sprint 6 P0-T1).
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  ReflectionService,
  REFLECTIONS_KEY,
  buildReflectionId,
  computePlanVsActualMinutes,
  REFLECTION_ON_TIME_THRESHOLD_MS
} from '../../js/services/ReflectionService.js';
import { FrictionService } from '../../js/services/FrictionService.js';
import {
  ReflectionStubbed,
  ReflectionCaptured,
  FrictionSignalCaptured
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
  const service = new ReflectionService({ repo, bus, clock, frictionService });
  return { service, repo, bus, clock, frictionService, storage };
}

function saFixture(overrides = {}) {
  return {
    id: 'sa_1',
    compositionId: 'comp_1',
    catalogEntryId: 'cat_1',
    userId: 'u_1',
    plannedDurationMinutes: 60,
    actualStartAt: '2026-04-21T09:00:00Z',
    actualEndAt: '2026-04-21T09:50:00Z',
    state: 'CLOSED',
    ...overrides
  };
}

describe('ReflectionService — constructor', () => {
  test('throws INVALID_DEPS without repo', () => {
    assert.throws(
      () => new ReflectionService({ bus: new EventBus(), clock: new ClockService() }),
      (e) => e.name === 'INVALID_DEPS'
    );
  });

  test('throws INVALID_DEPS without bus', () => {
    const storage = new LocalStorageMock();
    const repo = new LocalStorageRepository({ storage });
    assert.throws(
      () => new ReflectionService({ repo, clock: new ClockService() }),
      (e) => e.name === 'INVALID_DEPS'
    );
  });

  test('throws INVALID_DEPS without clock', () => {
    const storage = new LocalStorageMock();
    const repo = new LocalStorageRepository({ storage });
    assert.throws(
      () => new ReflectionService({ repo, bus: new EventBus() }),
      (e) => e.name === 'INVALID_DEPS'
    );
  });

  test('constructs with all required deps', () => {
    const { service } = buildEnv();
    assert.ok(service instanceof ReflectionService);
  });
});

describe('computePlanVsActualMinutes', () => {
  test('returns 0 for missing start/end', () => {
    assert.equal(computePlanVsActualMinutes(null), 0);
    assert.equal(computePlanVsActualMinutes({}), 0);
    assert.equal(
      computePlanVsActualMinutes({
        plannedDurationMinutes: 60,
        actualStartAt: null,
        actualEndAt: null
      }),
      0
    );
  });

  test('computes signed delta when activity ran long', () => {
    const d = computePlanVsActualMinutes({
      plannedDurationMinutes: 60,
      actualStartAt: '2026-04-21T09:00:00Z',
      actualEndAt: '2026-04-21T10:12:00Z'
    });
    assert.equal(d, 12);
  });

  test('computes signed delta when activity ran short', () => {
    const d = computePlanVsActualMinutes({
      plannedDurationMinutes: 60,
      actualStartAt: '2026-04-21T09:00:00Z',
      actualEndAt: '2026-04-21T09:45:00Z'
    });
    assert.equal(d, -15);
  });
});

describe('buildReflectionId', () => {
  test('produces a deterministic id', () => {
    assert.equal(buildReflectionId('sa_42'), 'ref_sa_42');
  });
  test('sanitizes unsafe characters', () => {
    // 'sa/../42' has four non-word chars: /, ., ., /
    assert.equal(buildReflectionId('sa/../42'), 'ref_sa____42');
  });
});

describe('ReflectionService.stubOnClose — happy path', () => {
  let env;
  beforeEach(() => {
    env = buildEnv();
  });

  test('persists a pending reflection at bamx:v1:reflections', () => {
    const r = env.service.stubOnClose(saFixture());
    const map = env.repo.read(REFLECTIONS_KEY);
    assert.ok(map[r.id], 'reflection not persisted');
    assert.equal(map[r.id].pending, true);
    assert.equal(map[r.id].scheduledActivityId, 'sa_1');
    assert.equal(map[r.id].capturedAt, null);
  });

  test('computes planVsActualMinutes from scheduled activity times', () => {
    const r = env.service.stubOnClose(saFixture());
    // planned=60, actual = 50 → -10
    assert.equal(r.planVsActualMinutes, -10);
  });

  test('kind is END_OF_ACTIVITY by default', () => {
    const r = env.service.stubOnClose(saFixture());
    assert.equal(r.kind, 'END_OF_ACTIVITY');
  });

  test('publishes ReflectionStubbed with reflectionId', () => {
    let captured = null;
    env.bus.subscribe(ReflectionStubbed, (p) => {
      captured = p;
    });
    const r = env.service.stubOnClose(saFixture());
    assert.ok(captured);
    assert.equal(captured.reflectionId, r.id);
    assert.equal(captured.scheduledActivityId, 'sa_1');
  });

  test('getByScheduledActivityId returns the stub', () => {
    env.service.stubOnClose(saFixture());
    const r = env.service.getByScheduledActivityId('sa_1');
    assert.ok(r);
    assert.equal(r.pending, true);
  });
});

describe('ReflectionService.stubOnClose — guards', () => {
  test('throws INVALID_INPUT when scheduledActivity missing', () => {
    const { service } = buildEnv();
    assert.throws(() => service.stubOnClose(null), (e) => e.name === 'INVALID_INPUT');
  });

  test('throws INVALID_INPUT when sa.id missing', () => {
    const { service } = buildEnv();
    assert.throws(
      () => service.stubOnClose(saFixture({ id: undefined })),
      (e) => e.name === 'INVALID_INPUT'
    );
  });

  test('throws REFLECTION_ALREADY_EXISTS on second stub for same activity', () => {
    const { service } = buildEnv();
    service.stubOnClose(saFixture());
    assert.throws(
      () => service.stubOnClose(saFixture()),
      (e) => e.name === 'REFLECTION_ALREADY_EXISTS'
    );
  });
});

describe('ReflectionService.capture — happy path', () => {
  let env;
  beforeEach(() => {
    env = buildEnv();
    const sa = saFixture();
    // Seed the activities map so on-time detection has actualEndAt.
    env.repo.write('bamx:v1:activities', { [sa.id]: sa });
    env.stub = env.service.stubOnClose(sa);
  });

  test('flips pending=false + sets capturedAt from clock', () => {
    const out = env.service.capture(env.stub.id, {
      whatWentWell: 'Focused work session'
    });
    assert.equal(out.reflection.pending, false);
    assert.equal(out.reflection.capturedAt, FROZEN_NOW);
  });

  test('stores whatWentWell / whatToImprove', () => {
    const out = env.service.capture(env.stub.id, {
      whatWentWell: 'win',
      whatToImprove: 'fix'
    });
    assert.equal(out.reflection.whatWentWell, 'win');
    assert.equal(out.reflection.whatToImprove, 'fix');
  });

  test('ReflectionCaptured published with onTime=true for quick capture', () => {
    // capture at 10:00, actualEndAt at 09:50 → delta 10 min → onTime
    let captured = null;
    env.bus.subscribe(ReflectionCaptured, (p) => {
      captured = p;
    });
    env.service.capture(env.stub.id, { whatWentWell: 'w' });
    assert.ok(captured);
    assert.equal(captured.onTime, true);
  });

  test('ReflectionCaptured onTime=false when capture is > 15 min late', () => {
    // build new env with clock at T+20 min
    const late = buildEnv('2026-04-21T10:15:00Z');
    const sa = saFixture();
    late.repo.write('bamx:v1:activities', { [sa.id]: sa });
    const stub = late.service.stubOnClose(sa);

    // Re-build with clock at 20 min past end.
    const late2 = buildEnv('2026-04-21T10:20:00Z');
    // Copy persistence across by replaying sa + stub write
    late2.repo.write('bamx:v1:activities', { [sa.id]: sa });
    late2.repo.upsert(
      REFLECTIONS_KEY,
      stub.id,
      late.repo.read(REFLECTIONS_KEY)[stub.id]
    );
    let captured = null;
    late2.bus.subscribe(ReflectionCaptured, (p) => {
      captured = p;
    });
    late2.service.capture(stub.id, { whatWentWell: 'w' });
    assert.ok(captured);
    assert.equal(captured.onTime, false);
  });

  test('onTime boundary at exactly 15 min — inclusive', () => {
    const justIn = buildEnv('2026-04-21T10:05:00Z'); // 15 min after 09:50
    const sa = saFixture();
    justIn.repo.write('bamx:v1:activities', { [sa.id]: sa });
    const stub = justIn.service.stubOnClose(sa);
    let captured = null;
    justIn.bus.subscribe(ReflectionCaptured, (p) => {
      captured = p;
    });
    justIn.service.capture(stub.id, { whatWentWell: 'w' });
    assert.equal(captured.onTime, true);
  });
});

describe('ReflectionService.capture — friction flag', () => {
  let env;
  beforeEach(() => {
    env = buildEnv();
    const sa = saFixture();
    env.repo.write('bamx:v1:activities', { [sa.id]: sa });
    env.stub = env.service.stubOnClose(sa);
  });

  test('frictionFlag=true creates FrictionSignal + links id', () => {
    const out = env.service.capture(env.stub.id, {
      whatToImprove: 'Too many meetings',
      frictionFlag: true,
      frictionTag: 'MEETING_LOAD',
      frictionSummary: 'Back-to-back blocked deep work'
    });
    assert.ok(out.frictionSignal);
    assert.equal(out.frictionSignal.tag, 'MEETING_LOAD');
    assert.equal(out.reflection.frictionFlag, true);
    assert.equal(out.reflection.frictionSignalId, out.frictionSignal.id);
  });

  test('frictionSignalId written to the persisted row', () => {
    const out = env.service.capture(env.stub.id, {
      whatToImprove: 'w',
      frictionFlag: true,
      frictionTag: 'TOOL_FRICTION',
      frictionSummary: 's'
    });
    const r = env.repo.read(REFLECTIONS_KEY)[env.stub.id];
    assert.equal(r.frictionSignalId, out.frictionSignal.id);
  });

  test('FrictionSignalCaptured event fires', () => {
    let captured = null;
    env.bus.subscribe(FrictionSignalCaptured, (p) => {
      captured = p;
    });
    env.service.capture(env.stub.id, {
      whatToImprove: 'w',
      frictionFlag: true,
      frictionTag: 'MEETING_LOAD',
      frictionSummary: 's'
    });
    assert.ok(captured);
    assert.equal(captured.tag, 'MEETING_LOAD');
  });

  test('frictionFlag=false does not create a signal', () => {
    const out = env.service.capture(env.stub.id, {
      whatWentWell: 'w'
    });
    assert.equal(out.frictionSignal, null);
    assert.equal(out.reflection.frictionFlag, false);
    assert.equal(out.reflection.frictionSignalId, null);
  });

  test('frictionFlag=true with no FrictionService wired throws', () => {
    const { repo, bus, clock } = buildEnv();
    const service = new ReflectionService({ repo, bus, clock });
    const sa = saFixture();
    repo.write('bamx:v1:activities', { [sa.id]: sa });
    const stub = service.stubOnClose(sa);
    assert.throws(
      () =>
        service.capture(stub.id, {
          whatWentWell: 'w',
          frictionFlag: true,
          frictionSummary: 's'
        }),
      (e) => e.name === 'FRICTION_SERVICE_UNAVAILABLE'
    );
  });
});

describe('ReflectionService.capture — guards', () => {
  let env;
  beforeEach(() => {
    env = buildEnv();
    const sa = saFixture();
    env.repo.write('bamx:v1:activities', { [sa.id]: sa });
    env.stub = env.service.stubOnClose(sa);
  });

  test('throws REFLECTION_NOT_FOUND on unknown id', () => {
    assert.throws(
      () => env.service.capture('ref_missing', { whatWentWell: 'w' }),
      (e) => e.name === 'REFLECTION_NOT_FOUND'
    );
  });

  test('throws REFLECTION_ALREADY_CAPTURED on second capture', () => {
    env.service.capture(env.stub.id, { whatWentWell: 'ok' });
    assert.throws(
      () => env.service.capture(env.stub.id, { whatWentWell: 'again' }),
      (e) => e.name === 'REFLECTION_ALREADY_CAPTURED'
    );
  });

  test('throws REFLECTION_REQUIRES_TEXT when both text fields empty', () => {
    assert.throws(
      () => env.service.capture(env.stub.id, {}),
      (e) => e.name === 'REFLECTION_REQUIRES_TEXT'
    );
  });

  test('throws REFLECTION_REQUIRES_TEXT when text fields are empty strings', () => {
    assert.throws(
      () =>
        env.service.capture(env.stub.id, {
          whatWentWell: '',
          whatToImprove: ''
        }),
      (e) => e.name === 'REFLECTION_REQUIRES_TEXT'
    );
  });

  test('throws INVALID_INPUT when reflectionId empty', () => {
    assert.throws(
      () => env.service.capture('', { whatWentWell: 'w' }),
      (e) => e.name === 'INVALID_INPUT'
    );
  });
});

describe('ReflectionService.listPending', () => {
  test('returns pending reflections only', () => {
    const env = buildEnv();
    const sa1 = saFixture({ id: 'sa_1' });
    const sa2 = saFixture({ id: 'sa_2' });
    env.repo.write('bamx:v1:activities', { [sa1.id]: sa1, [sa2.id]: sa2 });
    const r1 = env.service.stubOnClose(sa1);
    env.service.stubOnClose(sa2);
    env.service.capture(r1.id, { whatWentWell: 'w' });
    const pending = env.service.listPending();
    assert.equal(pending.length, 1);
    assert.equal(pending[0].scheduledActivityId, 'sa_2');
  });
});

describe('ReflectionService.setFrictionService', () => {
  test('allows late wiring of FrictionService', () => {
    const storage = new LocalStorageMock();
    const repo = new LocalStorageRepository({ storage });
    const bus = new EventBus();
    const clock = new ClockService({ now: () => FROZEN_NOW });
    const service = new ReflectionService({ repo, bus, clock });
    const frictionService = new FrictionService({ repo, bus, clock });
    service.setFrictionService(frictionService);
    const sa = saFixture();
    repo.write('bamx:v1:activities', { [sa.id]: sa });
    const stub = service.stubOnClose(sa);
    const out = service.capture(stub.id, {
      whatToImprove: 'x',
      frictionFlag: true,
      frictionSummary: 'y',
      frictionTag: 'OTHER'
    });
    assert.ok(out.frictionSignal);
  });
});

describe('ReflectionService — on-time threshold constant', () => {
  test('exports 15-min threshold in ms', () => {
    assert.equal(REFLECTION_ON_TIME_THRESHOLD_MS, 15 * 60 * 1000);
  });
});
