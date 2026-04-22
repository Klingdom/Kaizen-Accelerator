/**
 * Tests for WeeklyComposerService (Sprint 9 Pass 9c).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { LocalStorageRepository } from '../../js/persistence/LocalStorageRepository.js';
import { EventBus } from '../../js/events/EventBus.js';
import { ClockService } from '../../js/services/ClockService.js';
import { CatalogService } from '../../js/services/CatalogService.js';
import {
  WeeklyComposerService,
  WEEKLY_COMPOSITIONS_KEY
} from '../../js/services/WeeklyComposerService.js';
import {
  COMPOSITIONS_KEY,
  ACTIVITIES_KEY
} from '../../js/services/ComposerService.js';
import {
  WeeklyCycleProposed,
  WeeklyCycleAccepted
} from '../../js/events/events.js';
import { LocalStorageMock } from '../_helpers/localStorageMock.js';
import { buildCatalog } from '../../js/catalog/seed/index.js';

const USER_ID = 'user_test';
const FROZEN_NOW = '2026-04-20T08:00:00Z';
const MONDAY = '2026-04-20';

/**
 * Minimal stub kaizen service supplying active kaizens on demand.
 */
function stubKaizenService(active = [], inRem = []) {
  return {
    listByState(userId, state) {
      if (state === 'ACTIVE') return active.filter((k) => k.userId === userId);
      if (state === 'IN_REMEASUREMENT') return inRem.filter((k) => k.userId === userId);
      return [];
    }
  };
}

function buildService({ kaizens = [], inRem = [] } = {}) {
  const storage = new LocalStorageMock();
  const repo = new LocalStorageRepository({ storage });
  const bus = new EventBus();
  const clock = new ClockService({ now: () => FROZEN_NOW });
  const catalogService = new CatalogService({ repo });
  catalogService.seed(buildCatalog().map((c) => ({ ...c })));
  const service = new WeeklyComposerService({
    repo,
    bus,
    clock,
    catalogService,
    kaizenService: stubKaizenService(kaizens, inRem)
  });
  return { service, repo, bus, clock, storage, catalogService };
}

// ---------------------------------------------------------------------------
// Construction
// ---------------------------------------------------------------------------

describe('WeeklyComposerService — construction validation', () => {
  test('throws INVALID_DEPS without repo', () => {
    assert.throws(
      () => new WeeklyComposerService({ bus: new EventBus(), clock: new ClockService() }),
      /INVALID_DEPS/
    );
  });

  test('throws INVALID_DEPS without bus', () => {
    const storage = new LocalStorageMock();
    const repo = new LocalStorageRepository({ storage });
    assert.throws(
      () => new WeeklyComposerService({ repo, clock: new ClockService() }),
      /INVALID_DEPS/
    );
  });

  test('throws INVALID_DEPS without clock', () => {
    const storage = new LocalStorageMock();
    const repo = new LocalStorageRepository({ storage });
    assert.throws(
      () => new WeeklyComposerService({ repo, bus: new EventBus() }),
      /INVALID_DEPS/
    );
  });

  test('constructs with minimal deps (no kaizenService / composerService)', () => {
    const storage = new LocalStorageMock();
    const repo = new LocalStorageRepository({ storage });
    const clock = new ClockService({ now: () => FROZEN_NOW });
    const bus = new EventBus();
    const service = new WeeklyComposerService({ repo, bus, clock });
    assert.ok(service);
  });
});

// ---------------------------------------------------------------------------
// proposeWeek
// ---------------------------------------------------------------------------

describe('WeeklyComposerService — proposeWeek', () => {
  test('persists a WeeklyComposition under WEEKLY_COMPOSITIONS_KEY', () => {
    const { service, repo } = buildService();
    const w = service.proposeWeek({ weekStart: MONDAY, userId: USER_ID });
    const map = repo.read(WEEKLY_COMPOSITIONS_KEY);
    assert.ok(map[w.id]);
    assert.equal(map[w.id].id, w.id);
  });

  test('publishes WeeklyCycleProposed with payload', () => {
    const { service, bus } = buildService();
    const captured = [];
    bus.subscribe(WeeklyCycleProposed, (p) => captured.push(p));
    const w = service.proposeWeek({ weekStart: MONDAY, userId: USER_ID });
    assert.equal(captured.length, 1);
    assert.equal(captured[0].weeklyCompositionId, w.id);
    assert.equal(captured[0].userId, USER_ID);
    assert.equal(captured[0].weekStart, MONDAY);
    assert.equal(captured[0].proposedAt, FROZEN_NOW);
  });

  test('returns a 5-day WeeklyComposition', () => {
    const { service } = buildService();
    const w = service.proposeWeek({ weekStart: MONDAY, userId: USER_ID });
    assert.equal(w.days.length, 5);
    assert.equal(w.state, 'PROPOSED');
  });

  test('throws INVALID_INPUT when input null', () => {
    const { service } = buildService();
    assert.throws(() => service.proposeWeek(null), /INVALID_INPUT/);
  });

  test('throws INVALID_INPUT when userId missing', () => {
    const { service } = buildService();
    assert.throws(
      () => service.proposeWeek({ weekStart: MONDAY, userId: '' }),
      /INVALID_INPUT/
    );
  });

  test('throws INVALID_INPUT when weekStart missing', () => {
    const { service } = buildService();
    assert.throws(
      () => service.proposeWeek({ weekStart: '', userId: USER_ID }),
      /INVALID_INPUT/
    );
  });

  test('re-proposing same weekStart overwrites the prior blob (idempotent)', () => {
    const { service, repo } = buildService();
    service.proposeWeek({ weekStart: MONDAY, userId: USER_ID });
    const firstCount = Object.keys(
      repo.read(WEEKLY_COMPOSITIONS_KEY)
    ).length;
    service.proposeWeek({ weekStart: MONDAY, userId: USER_ID });
    const secondCount = Object.keys(
      repo.read(WEEKLY_COMPOSITIONS_KEY)
    ).length;
    assert.equal(firstCount, secondCount);
  });

  test('uses injected active kaizens from the kaizenService', () => {
    const kaizens = [
      {
        id: 'k_one',
        userId: USER_ID,
        state: 'ACTIVE',
        projectType: 'DMAIC',
        createdAt: '2026-04-01T00:00:00Z'
      }
    ];
    const { service } = buildService({ kaizens });
    const w = service.proposeWeek({ weekStart: MONDAY, userId: USER_ID });
    assert.equal(w.composerInputsSnapshot.kaizens.length, 1);
    assert.equal(w.composerInputsSnapshot.kaizens[0].id, 'k_one');
  });

  test('includes IN_REMEASUREMENT kaizens as active', () => {
    const inRem = [
      {
        id: 'k_rem',
        userId: USER_ID,
        state: 'IN_REMEASUREMENT',
        projectType: 'DMAIC',
        createdAt: '2026-04-01T00:00:00Z'
      }
    ];
    const { service } = buildService({ inRem });
    const w = service.proposeWeek({ weekStart: MONDAY, userId: USER_ID });
    assert.equal(w.composerInputsSnapshot.kaizens.length, 1);
    assert.equal(w.composerInputsSnapshot.kaizens[0].id, 'k_rem');
  });
});

// ---------------------------------------------------------------------------
// acceptWeek
// ---------------------------------------------------------------------------

describe('WeeklyComposerService — acceptWeek', () => {
  test('persists every daily Composition into COMPOSITIONS_KEY', () => {
    const { service, repo } = buildService();
    const w = service.proposeWeek({ weekStart: MONDAY, userId: USER_ID });
    service.acceptWeek(w.id);
    const comps = repo.read(COMPOSITIONS_KEY);
    for (const d of w.days) {
      assert.ok(comps[d.id], `missing composition ${d.id}`);
    }
  });

  test('persists every child ScheduledActivity into ACTIVITIES_KEY', () => {
    const { service, repo } = buildService();
    const w = service.proposeWeek({ weekStart: MONDAY, userId: USER_ID });
    service.acceptWeek(w.id);
    const acts = repo.read(ACTIVITIES_KEY);
    let totalExpected = 0;
    for (const d of w.days) totalExpected += d.activities.length;
    assert.equal(Object.keys(acts).length, totalExpected);
  });

  test('flips state to ACCEPTED + stamps decidedAt', () => {
    const { service } = buildService();
    const w = service.proposeWeek({ weekStart: MONDAY, userId: USER_ID });
    const updated = service.acceptWeek(w.id);
    assert.equal(updated.state, 'ACCEPTED');
    assert.equal(updated.decidedAt, FROZEN_NOW);
  });

  test('publishes WeeklyCycleAccepted with the 5 composition ids', () => {
    const { service, bus } = buildService();
    const captured = [];
    bus.subscribe(WeeklyCycleAccepted, (p) => captured.push(p));
    const w = service.proposeWeek({ weekStart: MONDAY, userId: USER_ID });
    service.acceptWeek(w.id);
    assert.equal(captured.length, 1);
    assert.equal(captured[0].compositionIds.length, 5);
    assert.equal(captured[0].userId, USER_ID);
  });

  test('throws WEEKLY_NOT_FOUND when id is unknown', () => {
    const { service } = buildService();
    assert.throws(() => service.acceptWeek('nope'), /WEEKLY_NOT_FOUND/);
  });

  test('throws ILLEGAL_TRANSITION when state is already ACCEPTED', () => {
    const { service } = buildService();
    const w = service.proposeWeek({ weekStart: MONDAY, userId: USER_ID });
    service.acceptWeek(w.id);
    assert.throws(() => service.acceptWeek(w.id), /ILLEGAL_TRANSITION/);
  });

  test('throws INVALID_ID when id is empty', () => {
    const { service } = buildService();
    assert.throws(() => service.acceptWeek(''), /INVALID_ID/);
  });
});

// ---------------------------------------------------------------------------
// acceptDay
// ---------------------------------------------------------------------------

describe('WeeklyComposerService — acceptDay', () => {
  test('persists only the specified day', () => {
    const { service, repo } = buildService();
    const w = service.proposeWeek({ weekStart: MONDAY, userId: USER_ID });
    service.acceptDay(w.id, 0);
    const comps = repo.read(COMPOSITIONS_KEY);
    const persistedIds = Object.keys(comps);
    assert.equal(persistedIds.length, 1);
    assert.equal(persistedIds[0], w.days[0].id);
  });

  test('weekly stays PROPOSED until all 5 days are accepted', () => {
    const { service } = buildService();
    const w = service.proposeWeek({ weekStart: MONDAY, userId: USER_ID });
    service.acceptDay(w.id, 0);
    const wmap = service.get(w.id);
    assert.equal(wmap.state, 'PROPOSED');
  });

  test('weekly transitions to ACCEPTED after all 5 days accepted', () => {
    const { service } = buildService();
    const w = service.proposeWeek({ weekStart: MONDAY, userId: USER_ID });
    for (let i = 0; i < 5; i += 1) service.acceptDay(w.id, i);
    const wmap = service.get(w.id);
    assert.equal(wmap.state, 'ACCEPTED');
  });

  test('WeeklyCycleAccepted fires on final acceptDay', () => {
    const { service, bus } = buildService();
    const captured = [];
    bus.subscribe(WeeklyCycleAccepted, (p) => captured.push(p));
    const w = service.proposeWeek({ weekStart: MONDAY, userId: USER_ID });
    for (let i = 0; i < 4; i += 1) service.acceptDay(w.id, i);
    assert.equal(captured.length, 0);
    service.acceptDay(w.id, 4);
    assert.equal(captured.length, 1);
  });

  test('throws INVALID_DAY_INDEX for index < 0', () => {
    const { service } = buildService();
    const w = service.proposeWeek({ weekStart: MONDAY, userId: USER_ID });
    assert.throws(() => service.acceptDay(w.id, -1), /INVALID_DAY_INDEX/);
  });

  test('throws INVALID_DAY_INDEX for index > 4', () => {
    const { service } = buildService();
    const w = service.proposeWeek({ weekStart: MONDAY, userId: USER_ID });
    assert.throws(() => service.acceptDay(w.id, 5), /INVALID_DAY_INDEX/);
  });

  test('throws WEEKLY_NOT_FOUND for unknown id', () => {
    const { service } = buildService();
    assert.throws(() => service.acceptDay('nope', 0), /WEEKLY_NOT_FOUND/);
  });
});

// ---------------------------------------------------------------------------
// rejectWeek
// ---------------------------------------------------------------------------

describe('WeeklyComposerService — rejectWeek', () => {
  test('flips state to REJECTED + stamps decidedAt', () => {
    const { service } = buildService();
    const w = service.proposeWeek({ weekStart: MONDAY, userId: USER_ID });
    const rejected = service.rejectWeek(w.id);
    assert.equal(rejected.state, 'REJECTED');
    assert.equal(rejected.decidedAt, FROZEN_NOW);
  });

  test('throws WEEKLY_NOT_FOUND for unknown id', () => {
    const { service } = buildService();
    assert.throws(() => service.rejectWeek('nope'), /WEEKLY_NOT_FOUND/);
  });

  test('throws ILLEGAL_TRANSITION when already ACCEPTED', () => {
    const { service } = buildService();
    const w = service.proposeWeek({ weekStart: MONDAY, userId: USER_ID });
    service.acceptWeek(w.id);
    assert.throws(() => service.rejectWeek(w.id), /ILLEGAL_TRANSITION/);
  });
});

// ---------------------------------------------------------------------------
// get / list / getLatestProposed
// ---------------------------------------------------------------------------

describe('WeeklyComposerService — read helpers', () => {
  test('get returns null when id unknown', () => {
    const { service } = buildService();
    assert.equal(service.get('nope'), null);
  });

  test('get returns the weekly by id', () => {
    const { service } = buildService();
    const w = service.proposeWeek({ weekStart: MONDAY, userId: USER_ID });
    assert.equal(service.get(w.id).id, w.id);
  });

  test('list filters by userId + state', () => {
    const { service } = buildService();
    service.proposeWeek({ weekStart: MONDAY, userId: USER_ID });
    service.proposeWeek({ weekStart: MONDAY, userId: 'other_user' });
    const mine = service.list({ userId: USER_ID, state: 'PROPOSED' });
    assert.equal(mine.length, 1);
    assert.equal(mine[0].userId, USER_ID);
  });

  test('getLatestProposed returns null when none exist', () => {
    const { service } = buildService();
    assert.equal(service.getLatestProposed(USER_ID), null);
  });

  test('getLatestProposed returns the proposed weekly', () => {
    const { service } = buildService();
    const w = service.proposeWeek({ weekStart: MONDAY, userId: USER_ID });
    assert.equal(service.getLatestProposed(USER_ID)?.id, w.id);
  });

  test('getLatestProposed returns null after the weekly is accepted', () => {
    const { service } = buildService();
    const w = service.proposeWeek({ weekStart: MONDAY, userId: USER_ID });
    service.acceptWeek(w.id);
    assert.equal(service.getLatestProposed(USER_ID), null);
  });
});
