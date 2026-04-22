/**
 * Tests for ActivityService (Sprint 5 P0-T3).
 *
 * Covers the full ScheduledActivity FSM: start / close / skip.
 *
 *   SCHEDULED → IN_PROGRESS (start)
 *   IN_PROGRESS → CLOSED    (close, artifact required)
 *   SCHEDULED → SKIPPED     (skip, reason required; OTHER requires note)
 *
 * Also verifies:
 *   - ActivityStarted + ActivityStartedLate emission rules
 *   - ActivityCompleted on close
 *   - Output artifact schema validation against catalog entry
 *   - VarianceLogged via VarianceService on skip
 *   - Illegal transitions surface ILLEGAL_TRANSITION
 *   - Atomic rollback on variance-log failure
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  ActivityService,
  validateArtifactRef,
  toPlannedStartDate,
  LATE_START_THRESHOLD_MS
} from '../../js/services/ActivityService.js';
import { VarianceService, VARIANCES_KEY } from '../../js/services/VarianceService.js';
import {
  ACTIVITIES_KEY,
  COMPOSITIONS_KEY
} from '../../js/services/ComposerService.js';
import {
  ActivityStarted,
  ActivityStartedLate,
  ActivityCompleted,
  VarianceLogged
} from '../../js/events/events.js';
import { LocalStorageRepository } from '../../js/persistence/LocalStorageRepository.js';
import { EventBus } from '../../js/events/EventBus.js';
import { ClockService } from '../../js/services/ClockService.js';
import { LocalStorageMock } from '../_helpers/localStorageMock.js';

const FROZEN_NOW = '2026-04-21T09:00:00Z';

function buildService(opts = {}) {
  const storage = new LocalStorageMock();
  const repo = new LocalStorageRepository({ storage });
  const bus = new EventBus();
  const clock = new ClockService({ now: () => opts.now ?? FROZEN_NOW });
  const varianceService = new VarianceService({ repo, bus, clock });
  // Minimal catalog service stub supporting list(userId).
  const catalogService = opts.catalogService ?? {
    list: () => opts.catalog ?? []
  };
  const service = new ActivityService({
    repo,
    bus,
    clock,
    varianceService,
    catalogService
  });
  return { service, repo, bus, clock, varianceService, storage };
}

/**
 * Seed a composition + activity into the repo. Returns the activity.
 */
function seedActivity(ctx, overrides = {}) {
  const activity = {
    id: 'sa_1',
    compositionId: 'comp_1',
    catalogEntryId: 'cat_test',
    bucket: 'PROJECT',
    plannedStartAt: '09:00',
    plannedDurationMinutes: 60,
    actualStartAt: null,
    actualEndAt: null,
    intention: 'Finish the draft',
    state: 'SCHEDULED',
    outputArtifactRef: null,
    reflectionId: null,
    linkedKaizenId: null,
    linkedDmaicStepRef: null,
    linkedPdcaExperimentId: null,
    reasonCodeIfSkipped: null,
    sourceOfSchedule: 'COMPOSER_AUTO',
    createdAt: '2026-04-21T00:00:00Z',
    updatedAt: '2026-04-21T00:00:00Z',
    ...overrides
  };
  const comp = {
    id: activity.compositionId,
    userId: 'u_phil',
    state: 'ACCEPTED',
    startAt: '2026-04-21T00:00:00Z',
    endAt: '2026-04-21T23:59:59Z'
  };
  const acts = ctx.repo.read(ACTIVITIES_KEY) ?? {};
  const comps = ctx.repo.read(COMPOSITIONS_KEY) ?? {};
  acts[activity.id] = activity;
  comps[comp.id] = comp;
  ctx.repo.write(ACTIVITIES_KEY, acts);
  ctx.repo.write(COMPOSITIONS_KEY, comps);
  return activity;
}

// ---------------------------------------------------------------------------

describe('ActivityService — constructor', () => {
  test('throws INVALID_DEPS without repo', () => {
    assert.throws(
      () =>
        new ActivityService({
          bus: new EventBus(),
          clock: new ClockService(),
          varianceService: {}
        }),
      (e) => e.name === 'INVALID_DEPS'
    );
  });

  test('throws INVALID_DEPS without varianceService', () => {
    const storage = new LocalStorageMock();
    const repo = new LocalStorageRepository({ storage });
    assert.throws(
      () =>
        new ActivityService({
          repo,
          bus: new EventBus(),
          clock: new ClockService()
        }),
      (e) => e.name === 'INVALID_DEPS'
    );
  });

  test('constructs with all required deps', () => {
    const { service } = buildService();
    assert.ok(service instanceof ActivityService);
  });
});

// ---------------------------------------------------------------------------

describe('toPlannedStartDate', () => {
  test('HH:MM + refDate anchors to that day', () => {
    const d = toPlannedStartDate('09:15', '2026-04-21T00:00:00Z');
    assert.equal(d.toISOString(), '2026-04-21T09:15:00.000Z');
  });

  test('full ISO string parses directly', () => {
    const d = toPlannedStartDate('2026-04-21T09:15:00Z', null);
    assert.equal(d.toISOString(), '2026-04-21T09:15:00.000Z');
  });

  test('null / missing returns null', () => {
    assert.equal(toPlannedStartDate(null, new Date()), null);
    assert.equal(toPlannedStartDate('', new Date()), null);
  });

  test('garbage returns null', () => {
    assert.equal(toPlannedStartDate('lol', '2026-04-21T00:00:00Z'), null);
  });
});

// ---------------------------------------------------------------------------

describe('validateArtifactRef', () => {
  test('null ref → ARTIFACT_MISSING', () => {
    assert.deepEqual(validateArtifactRef(null, null), {
      ok: false,
      reason: 'ARTIFACT_MISSING'
    });
  });

  test('TEXT with non-empty string → ok', () => {
    const r = validateArtifactRef({ schema: 'TEXT', value: 'hello' }, null);
    assert.equal(r.ok, true);
  });

  test('TEXT with empty string → ARTIFACT_TEXT_EMPTY', () => {
    const r = validateArtifactRef({ schema: 'TEXT', value: '' }, null);
    assert.equal(r.reason, 'ARTIFACT_TEXT_EMPTY');
  });

  test('TWO_LIST with both lists populated → ok', () => {
    const r = validateArtifactRef(
      { schema: 'TWO_LIST', value: { left: ['a'], right: ['b'] } },
      null
    );
    assert.equal(r.ok, true);
  });

  test('TWO_LIST with empty right → ARTIFACT_TWO_LIST_EMPTY', () => {
    const r = validateArtifactRef(
      { schema: 'TWO_LIST', value: { left: ['a'], right: [] } },
      null
    );
    assert.equal(r.reason, 'ARTIFACT_TWO_LIST_EMPTY');
  });

  test('NUMERIC with finite number → ok', () => {
    const r = validateArtifactRef(
      { schema: 'NUMERIC', value: { amount: 42, unit: 'min' } },
      null
    );
    assert.equal(r.ok, true);
  });

  test('NUMERIC with NaN → ARTIFACT_NUMERIC_INVALID', () => {
    const r = validateArtifactRef(
      { schema: 'NUMERIC', value: { amount: Number.NaN } },
      null
    );
    assert.equal(r.reason, 'ARTIFACT_NUMERIC_INVALID');
  });

  test('DOCUMENT with url + title → ok', () => {
    const r = validateArtifactRef(
      { schema: 'DOCUMENT', value: { url: 'https://…', title: 'Draft' } },
      null
    );
    assert.equal(r.ok, true);
  });

  test('CHART missing url → ARTIFACT_REF_INCOMPLETE', () => {
    const r = validateArtifactRef(
      { schema: 'CHART', value: { url: '', title: 't' } },
      null
    );
    assert.equal(r.reason, 'ARTIFACT_REF_INCOMPLETE');
  });

  test('unknown schema → ARTIFACT_SCHEMA_INVALID', () => {
    const r = validateArtifactRef({ schema: 'LOL', value: 'x' }, null);
    assert.equal(r.reason, 'ARTIFACT_SCHEMA_INVALID');
  });

  test('catalog entry schema mismatch → ARTIFACT_SCHEMA_MISMATCH', () => {
    const r = validateArtifactRef(
      { schema: 'TEXT', value: 'x' },
      { outputArtifact: { schema: 'DOCUMENT' } }
    );
    assert.equal(r.reason, 'ARTIFACT_SCHEMA_MISMATCH');
  });
});

// ---------------------------------------------------------------------------

describe('ActivityService.start — happy path', () => {
  let ctx;
  beforeEach(() => { ctx = buildService({ now: '2026-04-21T09:01:00Z' }); seedActivity(ctx); });

  test('SCHEDULED → IN_PROGRESS', () => {
    const updated = ctx.service.start('sa_1');
    assert.equal(updated.state, 'IN_PROGRESS');
  });

  test('sets actualStartAt to clock.now()', () => {
    const updated = ctx.service.start('sa_1');
    assert.equal(updated.actualStartAt, '2026-04-21T09:01:00Z');
  });

  test('publishes ActivityStarted', () => {
    let captured = null;
    ctx.bus.subscribe(ActivityStarted, (p) => { captured = p; });
    ctx.service.start('sa_1');
    assert.ok(captured);
    assert.equal(captured.scheduledActivityId, 'sa_1');
  });

  test('NOT late-start when within 5-min window', () => {
    // planned 09:00, now 09:01 (60s late — not > 5min)
    let lateSeen = null;
    ctx.bus.subscribe(ActivityStartedLate, (p) => { lateSeen = p; });
    ctx.service.start('sa_1');
    assert.equal(lateSeen, null);
  });

  test('persists the IN_PROGRESS state', () => {
    ctx.service.start('sa_1');
    const acts = ctx.repo.read(ACTIVITIES_KEY);
    assert.equal(acts.sa_1.state, 'IN_PROGRESS');
  });
});

describe('ActivityService.start — late start', () => {
  test('emits ActivityStartedLate when now > planned + 5 min', () => {
    const ctx = buildService({ now: '2026-04-21T09:10:00Z' });
    seedActivity(ctx);
    let lateSeen = null;
    ctx.bus.subscribe(ActivityStartedLate, (p) => { lateSeen = p; });
    ctx.service.start('sa_1');
    assert.ok(lateSeen);
    assert.equal(lateSeen.scheduledActivityId, 'sa_1');
    assert.ok(lateSeen.lateBySeconds >= 300);
  });

  test('does NOT emit ActivityStartedLate exactly at threshold', () => {
    // planned 09:00 + 5min = 09:05. Now exactly 09:05:00 is NOT strict-greater.
    const ctx = buildService({ now: '2026-04-21T09:05:00Z' });
    seedActivity(ctx);
    let lateSeen = null;
    ctx.bus.subscribe(ActivityStartedLate, (p) => { lateSeen = p; });
    ctx.service.start('sa_1');
    assert.equal(lateSeen, null);
  });

  test('both ActivityStarted and ActivityStartedLate fire same call', () => {
    const ctx = buildService({ now: '2026-04-21T09:30:00Z' });
    seedActivity(ctx);
    const order = [];
    ctx.bus.subscribe(ActivityStarted, () => order.push('started'));
    ctx.bus.subscribe(ActivityStartedLate, () => order.push('late'));
    ctx.service.start('sa_1');
    assert.deepEqual(order, ['started', 'late']);
  });
});

describe('ActivityService.start — guards', () => {
  test('PROPOSED state → ILLEGAL_TRANSITION', () => {
    const ctx = buildService();
    seedActivity(ctx, { state: 'PROPOSED' });
    assert.throws(() => ctx.service.start('sa_1'), (e) => e.name === 'ILLEGAL_TRANSITION');
  });

  test('IN_PROGRESS → ILLEGAL_TRANSITION (double-start)', () => {
    const ctx = buildService();
    seedActivity(ctx, { state: 'IN_PROGRESS' });
    assert.throws(() => ctx.service.start('sa_1'), (e) => e.name === 'ILLEGAL_TRANSITION');
  });

  test('CLOSED → ILLEGAL_TRANSITION', () => {
    const ctx = buildService();
    seedActivity(ctx, { state: 'CLOSED' });
    assert.throws(() => ctx.service.start('sa_1'), (e) => e.name === 'ILLEGAL_TRANSITION');
  });

  test('SKIPPED → ILLEGAL_TRANSITION', () => {
    const ctx = buildService();
    seedActivity(ctx, { state: 'SKIPPED' });
    assert.throws(() => ctx.service.start('sa_1'), (e) => e.name === 'ILLEGAL_TRANSITION');
  });

  test('unknown id → ACTIVITY_NOT_FOUND', () => {
    const ctx = buildService();
    assert.throws(
      () => ctx.service.start('sa_does_not_exist'),
      (e) => e.name === 'ACTIVITY_NOT_FOUND'
    );
  });

  test('empty id → INVALID_ID', () => {
    const ctx = buildService();
    assert.throws(() => ctx.service.start(''), (e) => e.name === 'INVALID_ID');
  });
});

// ---------------------------------------------------------------------------

describe('ActivityService.close — happy path', () => {
  let ctx;
  beforeEach(() => {
    ctx = buildService({
      catalog: [
        {
          id: 'cat_test',
          outputArtifact: { schema: 'TEXT', name: 'Draft', required: true }
        }
      ]
    });
    seedActivity(ctx, { state: 'IN_PROGRESS', actualStartAt: '2026-04-21T09:00:00Z' });
  });

  test('IN_PROGRESS → CLOSED with valid TEXT artifact', () => {
    const updated = ctx.service.close('sa_1', {
      outputArtifactRef: { schema: 'TEXT', value: 'Done.' }
    });
    assert.equal(updated.state, 'CLOSED');
    assert.equal(updated.outputArtifactRef.value, 'Done.');
    assert.equal(updated.actualEndAt, FROZEN_NOW);
  });

  test('publishes ActivityCompleted', () => {
    let captured = null;
    ctx.bus.subscribe(ActivityCompleted, (p) => { captured = p; });
    ctx.service.close('sa_1', {
      outputArtifactRef: { schema: 'TEXT', value: 'Done.' }
    });
    assert.ok(captured);
    assert.equal(captured.scheduledActivityId, 'sa_1');
  });

  test('persists the CLOSED state + artifact', () => {
    ctx.service.close('sa_1', {
      outputArtifactRef: { schema: 'TEXT', value: 'Done.' }
    });
    const acts = ctx.repo.read(ACTIVITIES_KEY);
    assert.equal(acts.sa_1.state, 'CLOSED');
    assert.equal(acts.sa_1.outputArtifactRef.value, 'Done.');
  });
});

describe('ActivityService.close — guards', () => {
  test('missing outputArtifactRef → CLOSE_REQUIRES_ARTIFACT', () => {
    const ctx = buildService();
    seedActivity(ctx, { state: 'IN_PROGRESS' });
    assert.throws(
      () => ctx.service.close('sa_1', {}),
      (e) => e.name === 'CLOSE_REQUIRES_ARTIFACT'
    );
  });

  test('null outputArtifactRef → CLOSE_REQUIRES_ARTIFACT', () => {
    const ctx = buildService();
    seedActivity(ctx, { state: 'IN_PROGRESS' });
    assert.throws(
      () => ctx.service.close('sa_1', { outputArtifactRef: null }),
      (e) => e.name === 'CLOSE_REQUIRES_ARTIFACT'
    );
  });

  test('artifact schema mismatch → ARTIFACT_SCHEMA_MISMATCH', () => {
    const ctx = buildService({
      catalog: [
        { id: 'cat_test', outputArtifact: { schema: 'DOCUMENT', required: true } }
      ]
    });
    seedActivity(ctx, { state: 'IN_PROGRESS' });
    assert.throws(
      () =>
        ctx.service.close('sa_1', {
          outputArtifactRef: { schema: 'TEXT', value: 'x' }
        }),
      (e) => e.name === 'ARTIFACT_SCHEMA_MISMATCH'
    );
  });

  test('TEXT with empty value → ARTIFACT_TEXT_EMPTY', () => {
    const ctx = buildService({
      catalog: [
        { id: 'cat_test', outputArtifact: { schema: 'TEXT', required: true } }
      ]
    });
    seedActivity(ctx, { state: 'IN_PROGRESS' });
    assert.throws(
      () =>
        ctx.service.close('sa_1', { outputArtifactRef: { schema: 'TEXT', value: '' } }),
      (e) => e.name === 'ARTIFACT_TEXT_EMPTY'
    );
  });

  test('SCHEDULED state → ILLEGAL_TRANSITION', () => {
    const ctx = buildService();
    seedActivity(ctx, { state: 'SCHEDULED' });
    assert.throws(
      () =>
        ctx.service.close('sa_1', {
          outputArtifactRef: { schema: 'TEXT', value: 'x' }
        }),
      (e) => e.name === 'ILLEGAL_TRANSITION'
    );
  });

  test('CLOSED state → ILLEGAL_TRANSITION (double-close)', () => {
    const ctx = buildService();
    seedActivity(ctx, { state: 'CLOSED' });
    assert.throws(
      () =>
        ctx.service.close('sa_1', {
          outputArtifactRef: { schema: 'TEXT', value: 'x' }
        }),
      (e) => e.name === 'ILLEGAL_TRANSITION'
    );
  });

  test('failed close does NOT mutate the activity', () => {
    const ctx = buildService();
    seedActivity(ctx, { state: 'IN_PROGRESS' });
    try {
      ctx.service.close('sa_1', {});
    } catch { /* expected */ }
    const acts = ctx.repo.read(ACTIVITIES_KEY);
    assert.equal(acts.sa_1.state, 'IN_PROGRESS');
    assert.equal(acts.sa_1.actualEndAt, null);
  });
});

// ---------------------------------------------------------------------------

describe('ActivityService.skip — happy path', () => {
  let ctx;
  beforeEach(() => {
    ctx = buildService();
    seedActivity(ctx, { state: 'SCHEDULED' });
  });

  test('SCHEDULED → SKIPPED with reason', () => {
    const { activity } = ctx.service.skip('sa_1', { reasonCode: 'BLOCKED' });
    assert.equal(activity.state, 'SKIPPED');
    assert.equal(activity.reasonCodeIfSkipped, 'BLOCKED');
  });

  test('logs a Variance row via VarianceService', () => {
    const { variance } = ctx.service.skip('sa_1', { reasonCode: 'SICK' });
    assert.ok(variance);
    assert.equal(variance.kind, 'SKIPPED_NON_OPTIONAL');
    assert.equal(variance.reasonCode, 'SICK');
    const map = ctx.repo.read(VARIANCES_KEY);
    assert.ok(map[variance.id]);
  });

  test('publishes VarianceLogged', () => {
    let captured = null;
    ctx.bus.subscribe(VarianceLogged, (p) => { captured = p; });
    ctx.service.skip('sa_1', { reasonCode: 'DEPRIORITIZED' });
    assert.ok(captured);
    assert.equal(captured.reasonCode, 'DEPRIORITIZED');
  });

  test('persists SKIPPED state', () => {
    ctx.service.skip('sa_1', { reasonCode: 'MEETING_CONFLICT' });
    const acts = ctx.repo.read(ACTIVITIES_KEY);
    assert.equal(acts.sa_1.state, 'SKIPPED');
    assert.equal(acts.sa_1.reasonCodeIfSkipped, 'MEETING_CONFLICT');
  });
});

describe('ActivityService.skip — guards', () => {
  let ctx;
  beforeEach(() => {
    ctx = buildService();
    seedActivity(ctx, { state: 'SCHEDULED' });
  });

  test('missing reasonCode → SKIP_REQUIRES_REASON', () => {
    assert.throws(
      () => ctx.service.skip('sa_1', {}),
      (e) => e.name === 'SKIP_REQUIRES_REASON'
    );
  });

  test('empty options object → SKIP_REQUIRES_REASON', () => {
    assert.throws(
      () => ctx.service.skip('sa_1'),
      (e) => e.name === 'SKIP_REQUIRES_REASON'
    );
  });

  test('invalid reasonCode → INVALID_REASON_CODE', () => {
    assert.throws(
      () => ctx.service.skip('sa_1', { reasonCode: 'LOL' }),
      (e) => e.name === 'INVALID_REASON_CODE'
    );
  });

  test('OTHER without note → OTHER_REQUIRES_NOTE', () => {
    assert.throws(
      () => ctx.service.skip('sa_1', { reasonCode: 'OTHER' }),
      (e) => e.name === 'OTHER_REQUIRES_NOTE'
    );
  });

  test('OTHER with empty-string note → OTHER_REQUIRES_NOTE', () => {
    assert.throws(
      () => ctx.service.skip('sa_1', { reasonCode: 'OTHER', note: '' }),
      (e) => e.name === 'OTHER_REQUIRES_NOTE'
    );
  });

  test('OTHER with real note succeeds', () => {
    const { activity, variance } = ctx.service.skip('sa_1', {
      reasonCode: 'OTHER',
      note: 'Fire drill'
    });
    assert.equal(activity.state, 'SKIPPED');
    assert.equal(variance.note, 'Fire drill');
  });

  test('IN_PROGRESS → ILLEGAL_TRANSITION', () => {
    // re-seed in a different state
    const ctx2 = buildService();
    seedActivity(ctx2, { state: 'IN_PROGRESS' });
    assert.throws(
      () => ctx2.service.skip('sa_1', { reasonCode: 'SICK' }),
      (e) => e.name === 'ILLEGAL_TRANSITION'
    );
  });

  test('CLOSED → ILLEGAL_TRANSITION', () => {
    const ctx2 = buildService();
    seedActivity(ctx2, { state: 'CLOSED' });
    assert.throws(
      () => ctx2.service.skip('sa_1', { reasonCode: 'SICK' }),
      (e) => e.name === 'ILLEGAL_TRANSITION'
    );
  });

  test('SKIPPED → ILLEGAL_TRANSITION (double-skip)', () => {
    const ctx2 = buildService();
    seedActivity(ctx2, { state: 'SKIPPED' });
    assert.throws(
      () => ctx2.service.skip('sa_1', { reasonCode: 'SICK' }),
      (e) => e.name === 'ILLEGAL_TRANSITION'
    );
  });

  test('guard failure does NOT mutate the activity', () => {
    try {
      ctx.service.skip('sa_1', { reasonCode: 'OTHER' });
    } catch { /* expected */ }
    const acts = ctx.repo.read(ACTIVITIES_KEY);
    assert.equal(acts.sa_1.state, 'SCHEDULED');
  });
});

describe('ActivityService.skip — atomic rollback', () => {
  test('if variance append throws, activity state rolls back', () => {
    const ctx = buildService();
    seedActivity(ctx, { state: 'SCHEDULED' });
    // First skip succeeds.
    ctx.service.skip('sa_1', { reasonCode: 'SICK' });
    // Re-seed sa_1 back to SCHEDULED (pretend we can).
    const acts = ctx.repo.read(ACTIVITIES_KEY);
    acts.sa_1 = { ...acts.sa_1, state: 'SCHEDULED', reasonCodeIfSkipped: null };
    ctx.repo.write(ACTIVITIES_KEY, acts);
    // Monkey-patch varianceService to always collide on append.
    const service = ctx.service;
    const failingVariance = {
      log: () => {
        const e = new Error('APPEND_ONLY_VIOLATION');
        e.name = 'APPEND_ONLY_VIOLATION';
        throw e;
      }
    };
    service._varianceService = failingVariance;
    assert.throws(
      () => service.skip('sa_1', { reasonCode: 'BLOCKED' }),
      (e) => e.name === 'APPEND_ONLY_VIOLATION'
    );
    const after = ctx.repo.read(ACTIVITIES_KEY);
    assert.equal(after.sa_1.state, 'SCHEDULED'); // rolled back
    assert.equal(after.sa_1.reasonCodeIfSkipped, null);
  });
});

// ---------------------------------------------------------------------------

describe('ActivityService — LATE_START_THRESHOLD_MS', () => {
  test('is 300,000 ms (5 min)', () => {
    assert.equal(LATE_START_THRESHOLD_MS, 5 * 60 * 1000);
  });
});
