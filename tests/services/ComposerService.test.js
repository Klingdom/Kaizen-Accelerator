/**
 * Tests for ComposerService (Sprint 4 handoff).
 *
 * Covers:
 *   - composeDaily() persists Composition + Activities + publishes CycleProposed
 *   - accept(id) atomic PROPOSED→ACCEPTED + all children PROPOSED→SCHEDULED
 *   - accept() rejects illegal transitions with NO partial writes
 *   - reject(id) transitions PROPOSED→REJECTED + publishes CycleRejected
 *   - getActiveComposition returns latest non-terminal composition + children
 *   - getComposition returns by id
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { LocalStorageRepository } from '../../js/persistence/LocalStorageRepository.js';
import { EventBus } from '../../js/events/EventBus.js';
import { ClockService } from '../../js/services/ClockService.js';
import {
  ComposerService,
  COMPOSITIONS_KEY,
  ACTIVITIES_KEY
} from '../../js/services/ComposerService.js';
import {
  CycleProposed,
  CycleAccepted,
  CycleRejected,
  ComposerInfeasible
} from '../../js/events/events.js';
import { LocalStorageMock } from '../_helpers/localStorageMock.js';
import {
  buildGoldenComposerInput,
  GOLDEN_FULL_CATALOG
} from '../fixtures/goldenDay.js';

const FROZEN_NOW = '2026-04-21T08:00:00Z';

/**
 * Build a ready-to-feed ComposerInput that will produce a PROPOSED
 * (feasible) output. The min catalog fixture omits the Deep payload
 * entry so we use the full catalog.
 */
function goldenInput(overrides = {}) {
  return buildGoldenComposerInput({
    catalog: GOLDEN_FULL_CATALOG.map((c) => ({ ...c })),
    ...overrides
  });
}

function buildService() {
  const storage = new LocalStorageMock();
  const repo = new LocalStorageRepository({ storage });
  const bus = new EventBus();
  const clock = new ClockService({ now: () => FROZEN_NOW });
  const service = new ComposerService({ repo, bus, clock });
  return { service, repo, bus, clock, storage };
}

describe('ComposerService — constructor validation', () => {
  test('throws INVALID_DEPS without repo', () => {
    assert.throws(
      () => new ComposerService({ bus: new EventBus(), clock: new ClockService() }),
      /INVALID_DEPS/
    );
  });

  test('throws INVALID_DEPS without bus', () => {
    const storage = new LocalStorageMock();
    const repo = new LocalStorageRepository({ storage });
    assert.throws(
      () => new ComposerService({ repo, clock: new ClockService() }),
      /INVALID_DEPS/
    );
  });

  test('throws INVALID_DEPS without clock', () => {
    const storage = new LocalStorageMock();
    const repo = new LocalStorageRepository({ storage });
    assert.throws(
      () => new ComposerService({ repo, bus: new EventBus() }),
      /INVALID_DEPS/
    );
  });

  test('throws INVALID_DEPS with bus missing publish()', () => {
    const storage = new LocalStorageMock();
    const repo = new LocalStorageRepository({ storage });
    assert.throws(
      () =>
        new ComposerService({
          repo,
          bus: {},
          clock: new ClockService()
        }),
      /INVALID_DEPS/
    );
  });

  test('constructs with all required deps', () => {
    const { service } = buildService();
    assert.ok(service instanceof ComposerService);
  });
});

describe('ComposerService.composeDaily — persistence + events', () => {
  test('persists a feasible Composition under bamx:v1:compositions', () => {
    const { service, repo } = buildService();
    const input = goldenInput();
    const result = service.composeDaily(input);
    assert.equal(result.state, 'PROPOSED');
    const comps = repo.read(COMPOSITIONS_KEY);
    assert.ok(comps);
    assert.ok(comps[result.composition.id]);
    assert.equal(comps[result.composition.id].state, 'PROPOSED');
  });

  test('persists child activities under bamx:v1:activities', () => {
    const { service, repo } = buildService();
    const result = service.composeDaily(goldenInput());
    const acts = repo.read(ACTIVITIES_KEY);
    assert.ok(acts);
    const compId = result.composition.id;
    const children = Object.values(acts).filter((a) => a.compositionId === compId);
    assert.ok(children.length >= 4);
    for (const a of children) {
      assert.equal(a.state, 'PROPOSED');
      assert.equal(a.compositionId, compId);
    }
  });

  test('publishes CycleProposed with compositionId + userId + date + cycleType', () => {
    const { service, bus } = buildService();
    const received = [];
    bus.subscribe(CycleProposed, (p) => received.push(p));
    const input = goldenInput();
    const result = service.composeDaily(input);
    assert.equal(received.length, 1);
    assert.equal(received[0].compositionId, result.composition.id);
    assert.equal(received[0].userId, input.userId);
    assert.equal(received[0].cycleType, 'DAILY');
    assert.equal(received[0].date, input.date);
  });

  test('persisted Composition does not duplicate activities array', () => {
    const { service, repo } = buildService();
    const result = service.composeDaily(goldenInput());
    const persisted = repo.read(COMPOSITIONS_KEY)[result.composition.id];
    assert.equal(persisted.activities, undefined);
  });

  test('calls the pure composer with a _now from ClockService', () => {
    const { service, repo } = buildService();
    const input = goldenInput();
    delete input._now;
    const result = service.composeDaily(input);
    const comp = repo.read(COMPOSITIONS_KEY)[result.composition.id];
    assert.equal(comp.proposedAt, FROZEN_NOW);
  });

  test('respects caller-supplied _now when set', () => {
    const { service, repo } = buildService();
    const explicit = '2026-04-21T23:45:00Z';
    const result = service.composeDaily(
      goldenInput({ _now: explicit })
    );
    const comp = repo.read(COMPOSITIONS_KEY)[result.composition.id];
    assert.equal(comp.proposedAt, explicit);
  });

  test('rejects non-object input', () => {
    const { service } = buildService();
    assert.throws(() => service.composeDaily(null), /INVALID_INPUT/);
    assert.throws(() => service.composeDaily(undefined), /INVALID_INPUT/);
    assert.throws(() => service.composeDaily('bad'), /INVALID_INPUT/);
  });

  test('two successive composes persist two Compositions (no clobber)', () => {
    const { service, repo } = buildService();
    const r1 = service.composeDaily(goldenInput());
    const r2 = service.composeDaily({
      ...goldenInput(),
      date: '2026-04-22',
      userId: 'user_phil_mvp'
    });
    assert.notEqual(r1.composition.id, r2.composition.id);
    const comps = repo.read(COMPOSITIONS_KEY);
    assert.ok(comps[r1.composition.id]);
    assert.ok(comps[r2.composition.id]);
  });

  test('INFEASIBLE result publishes ComposerInfeasible and does NOT persist', () => {
    const { service, repo, bus } = buildService();
    const received = [];
    bus.subscribe(ComposerInfeasible, (p) => received.push(p));
    const infeasibleInput = {
      cycleType: 'DAILY',
      userId: 'u_infeasible',
      date: '2026-04-21',
      dailyCapacityMinutes: 60, // way below the 15+60+30+15 = 120 non-optionals
      externalMinutesToday: 0,
      role: ['PRACTITIONER'],
      varianceQueue: [],
      catalog: []
    };
    const result = service.composeDaily(infeasibleInput);
    assert.equal(result.state, 'INFEASIBLE');
    assert.equal(received.length, 1);
    const comps = repo.read(COMPOSITIONS_KEY) ?? {};
    assert.equal(Object.keys(comps).length, 0);
  });

  test('CycleProposed is NOT published when INFEASIBLE', () => {
    const { service, bus } = buildService();
    const proposed = [];
    bus.subscribe(CycleProposed, (p) => proposed.push(p));
    service.composeDaily({
      cycleType: 'DAILY',
      userId: 'u_infeasible',
      date: '2026-04-21',
      dailyCapacityMinutes: 60,
      externalMinutesToday: 0,
      role: [],
      varianceQueue: [],
      catalog: []
    });
    assert.equal(proposed.length, 0);
  });
});

describe('ComposerService.accept — atomic transition', () => {
  let service;
  let repo;
  let bus;
  let composition;
  let activitiesBefore;

  beforeEach(() => {
    const built = buildService();
    service = built.service;
    repo = built.repo;
    bus = built.bus;
    const result = service.composeDaily(goldenInput());
    composition = result.composition;
    activitiesBefore = Object.values(repo.read(ACTIVITIES_KEY)).filter(
      (a) => a.compositionId === composition.id
    );
  });

  test('flips Composition PROPOSED → ACCEPTED', () => {
    const result = service.accept(composition.id);
    assert.equal(result.composition.state, 'ACCEPTED');
    const persisted = repo.read(COMPOSITIONS_KEY)[composition.id];
    assert.equal(persisted.state, 'ACCEPTED');
  });

  test('flips every child ScheduledActivity PROPOSED → SCHEDULED', () => {
    service.accept(composition.id);
    const acts = repo.read(ACTIVITIES_KEY);
    for (const a of activitiesBefore) {
      assert.equal(acts[a.id].state, 'SCHEDULED');
    }
  });

  test('stamps decidedAt from ClockService', () => {
    service.accept(composition.id);
    const persisted = repo.read(COMPOSITIONS_KEY)[composition.id];
    assert.equal(persisted.decidedAt, FROZEN_NOW);
  });

  test('stamps updatedAt on each child from ClockService', () => {
    service.accept(composition.id);
    const acts = repo.read(ACTIVITIES_KEY);
    for (const a of activitiesBefore) {
      assert.equal(acts[a.id].updatedAt, FROZEN_NOW);
    }
  });

  test('publishes CycleAccepted with compositionId + edited=false', () => {
    const received = [];
    bus.subscribe(CycleAccepted, (p) => received.push(p));
    service.accept(composition.id);
    assert.equal(received.length, 1);
    assert.equal(received[0].compositionId, composition.id);
    assert.equal(received[0].edited, false);
    assert.equal(received[0].userId, composition.userId);
    assert.equal(received[0].cycleType, 'DAILY');
  });

  test('throws COMPOSITION_NOT_FOUND for unknown id', () => {
    assert.throws(() => service.accept('nope_id'), /COMPOSITION_NOT_FOUND/);
  });

  test('throws INVALID_ID for empty string id', () => {
    assert.throws(() => service.accept(''), /INVALID_ID/);
    assert.throws(() => service.accept(null), /INVALID_ID/);
    assert.throws(() => service.accept(undefined), /INVALID_ID/);
  });

  test('throws ILLEGAL_TRANSITION when composition is already ACCEPTED', () => {
    service.accept(composition.id);
    assert.throws(() => service.accept(composition.id), /ILLEGAL_TRANSITION/);
  });

  test('throws ILLEGAL_TRANSITION when composition is REJECTED', () => {
    service.reject(composition.id);
    assert.throws(() => service.accept(composition.id), /ILLEGAL_TRANSITION/);
  });

  test('throws ILLEGAL_TRANSITION when a child is NOT PROPOSED — no state change', () => {
    // Manually corrupt one child to simulate a mid-life state
    const acts = repo.read(ACTIVITIES_KEY);
    const [first, ...rest] = activitiesBefore;
    acts[first.id] = { ...acts[first.id], state: 'SKIPPED' };
    repo.write(ACTIVITIES_KEY, acts);

    assert.throws(
      () => service.accept(composition.id),
      (err) => err.name === 'ILLEGAL_TRANSITION'
    );

    // Assert composition still PROPOSED AND other children still PROPOSED
    const compAfter = repo.read(COMPOSITIONS_KEY)[composition.id];
    assert.equal(compAfter.state, 'PROPOSED');
    const actsAfter = repo.read(ACTIVITIES_KEY);
    for (const a of rest) {
      assert.equal(actsAfter[a.id].state, 'PROPOSED');
    }
    assert.equal(actsAfter[first.id].state, 'SKIPPED');
  });

  test('ILLEGAL_TRANSITION error carries badActivities list', () => {
    const acts = repo.read(ACTIVITIES_KEY);
    const [first, second] = activitiesBefore;
    acts[first.id] = { ...acts[first.id], state: 'SKIPPED' };
    acts[second.id] = { ...acts[second.id], state: 'SKIPPED' };
    repo.write(ACTIVITIES_KEY, acts);

    try {
      service.accept(composition.id);
      assert.fail('expected throw');
    } catch (err) {
      assert.equal(err.name, 'ILLEGAL_TRANSITION');
      assert.ok(Array.isArray(err.badActivities));
      assert.equal(err.badActivities.length, 2);
    }
  });

  test('returns {composition, activities} shape', () => {
    const out = service.accept(composition.id);
    assert.ok(out.composition);
    assert.ok(Array.isArray(out.activities));
    assert.equal(out.activities.length, activitiesBefore.length);
    for (const a of out.activities) {
      assert.equal(a.state, 'SCHEDULED');
    }
  });

  test('accept does not publish CycleProposed (only CycleAccepted)', () => {
    const proposed = [];
    const accepted = [];
    bus.subscribe(CycleProposed, (p) => proposed.push(p));
    bus.subscribe(CycleAccepted, (p) => accepted.push(p));
    service.accept(composition.id);
    assert.equal(proposed.length, 0);
    assert.equal(accepted.length, 1);
  });
});

describe('ComposerService.reject', () => {
  test('flips Composition PROPOSED → REJECTED', () => {
    const { service, repo } = buildService();
    const r = service.composeDaily(goldenInput());
    service.reject(r.composition.id, 'Out sick');
    const persisted = repo.read(COMPOSITIONS_KEY)[r.composition.id];
    assert.equal(persisted.state, 'REJECTED');
    assert.equal(persisted.rejectionReason, 'Out sick');
  });

  test('publishes CycleRejected with reason', () => {
    const { service, bus } = buildService();
    const r = service.composeDaily(goldenInput());
    const received = [];
    bus.subscribe(CycleRejected, (p) => received.push(p));
    service.reject(r.composition.id, 'Not today');
    assert.equal(received.length, 1);
    assert.equal(received[0].compositionId, r.composition.id);
    assert.equal(received[0].reason, 'Not today');
  });

  test('accepts omitted reason (defaults to null)', () => {
    const { service, repo, bus } = buildService();
    const r = service.composeDaily(goldenInput());
    const received = [];
    bus.subscribe(CycleRejected, (p) => received.push(p));
    service.reject(r.composition.id);
    assert.equal(received[0].reason, null);
    const persisted = repo.read(COMPOSITIONS_KEY)[r.composition.id];
    assert.equal(persisted.rejectionReason, null);
  });

  test('stamps decidedAt from ClockService', () => {
    const { service, repo } = buildService();
    const r = service.composeDaily(goldenInput());
    service.reject(r.composition.id);
    const persisted = repo.read(COMPOSITIONS_KEY)[r.composition.id];
    assert.equal(persisted.decidedAt, FROZEN_NOW);
  });

  test('throws INVALID_ID for empty id', () => {
    const { service } = buildService();
    assert.throws(() => service.reject(''), /INVALID_ID/);
  });

  test('throws COMPOSITION_NOT_FOUND for unknown id', () => {
    const { service } = buildService();
    assert.throws(() => service.reject('nope_id'), /COMPOSITION_NOT_FOUND/);
  });

  test('throws ILLEGAL_TRANSITION on already-ACCEPTED', () => {
    const { service } = buildService();
    const r = service.composeDaily(goldenInput());
    service.accept(r.composition.id);
    assert.throws(() => service.reject(r.composition.id), /ILLEGAL_TRANSITION/);
  });

  test('throws ILLEGAL_TRANSITION on double-reject', () => {
    const { service } = buildService();
    const r = service.composeDaily(goldenInput());
    service.reject(r.composition.id);
    assert.throws(() => service.reject(r.composition.id), /ILLEGAL_TRANSITION/);
  });
});

describe('ComposerService.getActiveComposition', () => {
  test('returns null when no Composition exists', () => {
    const { service } = buildService();
    assert.equal(service.getActiveComposition('user_phil_mvp'), null);
  });

  test('returns the only PROPOSED composition + its children', () => {
    const { service } = buildService();
    const r = service.composeDaily(goldenInput());
    const out = service.getActiveComposition('user_phil_mvp');
    assert.ok(out);
    assert.equal(out.composition.id, r.composition.id);
    assert.ok(out.activities.length >= 4);
  });

  test('returns an ACCEPTED composition (not filtered out)', () => {
    const { service } = buildService();
    const r = service.composeDaily(goldenInput());
    service.accept(r.composition.id);
    const out = service.getActiveComposition('user_phil_mvp');
    assert.ok(out);
    assert.equal(out.composition.state, 'ACCEPTED');
  });

  test('filters out REJECTED compositions', () => {
    const { service } = buildService();
    const r = service.composeDaily(goldenInput());
    service.reject(r.composition.id);
    assert.equal(service.getActiveComposition('user_phil_mvp'), null);
  });

  test('returns most recent composition when multiple exist for same user', () => {
    const { service } = buildService();
    // Two composes for different dates — different ids
    const a = service.composeDaily({
      ...goldenInput(),
      _now: '2026-04-21T08:00:00Z',
      date: '2026-04-21'
    });
    const b = service.composeDaily({
      ...goldenInput(),
      _now: '2026-04-22T08:00:00Z',
      date: '2026-04-22'
    });
    const out = service.getActiveComposition('user_phil_mvp');
    assert.equal(out.composition.id, b.composition.id);
  });

  test('does not return another user\'s composition', () => {
    const { service } = buildService();
    service.composeDaily({
      ...goldenInput(),
      userId: 'user_other',
      date: '2026-04-21'
    });
    assert.equal(service.getActiveComposition('user_phil_mvp'), null);
  });

  test('throws INVALID_ID for empty userId', () => {
    const { service } = buildService();
    assert.throws(() => service.getActiveComposition(''), /INVALID_ID/);
  });
});

describe('ComposerService.getComposition', () => {
  test('returns composition + activities by id', () => {
    const { service } = buildService();
    const r = service.composeDaily(goldenInput());
    const out = service.getComposition(r.composition.id);
    assert.ok(out);
    assert.equal(out.composition.id, r.composition.id);
    assert.ok(Array.isArray(out.activities));
    assert.ok(out.activities.length >= 4);
  });

  test('returns null for unknown id', () => {
    const { service } = buildService();
    assert.equal(service.getComposition('nope_id'), null);
  });
});

describe('ComposerService — catalog resolution via injected CatalogService', () => {
  test('pulls catalog from CatalogService when input omits it', async () => {
    const { LocalStorageRepository: Repo } = await import('../../js/persistence/LocalStorageRepository.js');
    const { CatalogService } = await import('../../js/services/CatalogService.js');
    const { GOLDEN_FULL_CATALOG } = await import('../fixtures/goldenDay.js');

    const storage = new LocalStorageMock();
    const repo = new Repo({ storage });
    const catalogService = new CatalogService({ repo });
    catalogService.seed(GOLDEN_FULL_CATALOG.map((c) => ({ ...c })));
    const bus = new EventBus();
    const clock = new ClockService({ now: () => FROZEN_NOW });
    const service = new ComposerService({ repo, bus, clock, catalogService });

    // Build input with catalog explicitly stripped
    const input = buildGoldenComposerInput();
    delete input.catalog;
    const result = service.composeDaily(input);
    assert.equal(result.state, 'PROPOSED');
    // The Deep payload should have been picked from the full catalog (cat_34)
    const children = Object.values(repo.read(ACTIVITIES_KEY)).filter(
      (a) => a.compositionId === result.composition.id && a.bucket === 'PROJECT'
    );
    assert.ok(children.length >= 1);
  });
});
