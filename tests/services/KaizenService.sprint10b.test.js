/**
 * Sprint 10b Pass B — KaizenService step-progress + scheduling methods.
 *
 * Covers:
 *   completeStep       — happy path + guards (not current, not found)
 *   scheduleStep       — happy path + guards (date format, missing entry)
 *   getCompletedStepsForKaizen     — filter + ordering
 *   getCompletedStepsByKaizenId    — group by kaizenId
 *   Event emissions
 *   Append-only semantics
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  KaizenService,
  KAIZENS_KEY,
  STEP_PROGRESS_KEY,
  SCHEDULED_ACTIVITIES_KEY
} from '../../js/services/KaizenService.js';
import {
  KaizenStepCompleted,
  KaizenStepScheduled
} from '../../js/events/events.js';
import { LocalStorageRepository } from '../../js/persistence/LocalStorageRepository.js';
import { EventBus } from '../../js/events/EventBus.js';
import { ClockService } from '../../js/services/ClockService.js';
import { LocalStorageMock } from '../_helpers/localStorageMock.js';

const FROZEN = '2026-04-22T10:00:00Z';

function buildEnv(nowIso = FROZEN) {
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
    storage,
    advance: (iso) => {
      currentNow = iso;
    }
  };
}

function seedDmaicKaizen(env, { kaizenId = 'k_dm_1', userId = 'u_1' } = {}) {
  const existing = env.repo.read(KAIZENS_KEY) ?? {};
  env.repo.write(KAIZENS_KEY, {
    ...existing,
    [kaizenId]: {
      id: kaizenId,
      userId,
      title: 'DMAIC K',
      problemStatement: 'p',
      goalStatement: 'g',
      state: 'ACTIVE',
      projectType: 'DMAIC',
      actions: [],
      sourceFrictionSignalIds: [],
      baselineMetricId: 'bm_1',
      openedAt: FROZEN,
      abandoned: false
    }
  });
  return kaizenId;
}

function dmaicCatalog() {
  return [
    {
      id: 'cat_20',
      activityNumber: 20,
      name: 'DMAIC Charter',
      bucket: 'PROJECT',
      dependsOn: [],
      projectTypeBinding: 'DMAIC',
      defaultDurationMinutes: 90
    },
    {
      id: 'cat_21',
      activityNumber: 21,
      name: 'SIPOC',
      bucket: 'PROJECT',
      dependsOn: ['cat_20'],
      projectTypeBinding: 'DMAIC',
      defaultDurationMinutes: 60
    },
    {
      id: 'cat_22',
      activityNumber: 22,
      name: 'VOC',
      bucket: 'PROJECT',
      dependsOn: ['cat_21'],
      projectTypeBinding: 'DMAIC',
      defaultDurationMinutes: 60
    }
  ];
}

describe('KaizenService.completeStep — happy path', () => {
  test('returns an append-only row with expected shape', () => {
    const env = buildEnv();
    const kid = seedDmaicKaizen(env);
    const row = env.service.completeStep({
      kaizenId: kid,
      catalogEntryId: 'cat_20',
      userId: 'u_1',
      catalog: dmaicCatalog()
    });
    assert.ok(row);
    assert.equal(row.kaizenId, kid);
    assert.equal(row.catalogEntryId, 'cat_20');
    assert.equal(row.userId, 'u_1');
    assert.equal(row.completedAt, FROZEN);
    assert.equal(row.sourceKind, 'portfolio');
    assert.equal(row.sourceId, null);
    assert.ok(row.id.startsWith('ksp_'));
  });

  test('persists the row under STEP_PROGRESS_KEY', () => {
    const env = buildEnv();
    const kid = seedDmaicKaizen(env);
    env.service.completeStep({
      kaizenId: kid,
      catalogEntryId: 'cat_20',
      userId: 'u_1',
      catalog: dmaicCatalog()
    });
    const map = env.repo.read(STEP_PROGRESS_KEY) ?? {};
    const rows = Object.values(map);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].catalogEntryId, 'cat_20');
  });

  test('sourceKind defaults to portfolio', () => {
    const env = buildEnv();
    const kid = seedDmaicKaizen(env);
    const row = env.service.completeStep({
      kaizenId: kid,
      catalogEntryId: 'cat_20',
      userId: 'u_1',
      catalog: dmaicCatalog()
    });
    assert.equal(row.sourceKind, 'portfolio');
  });

  test('sourceKind=scheduled-activity + sourceId accepted', () => {
    const env = buildEnv();
    const kid = seedDmaicKaizen(env);
    const row = env.service.completeStep({
      kaizenId: kid,
      catalogEntryId: 'cat_20',
      userId: 'u_1',
      sourceKind: 'scheduled-activity',
      sourceId: 'sa_1',
      catalog: dmaicCatalog()
    });
    assert.equal(row.sourceKind, 'scheduled-activity');
    assert.equal(row.sourceId, 'sa_1');
  });

  test('after completing #20, #21 becomes current', () => {
    const env = buildEnv();
    const kid = seedDmaicKaizen(env);
    env.service.completeStep({
      kaizenId: kid,
      catalogEntryId: 'cat_20',
      userId: 'u_1',
      catalog: dmaicCatalog()
    });
    env.advance('2026-04-22T11:00:00Z');
    const row2 = env.service.completeStep({
      kaizenId: kid,
      catalogEntryId: 'cat_21',
      userId: 'u_1',
      catalog: dmaicCatalog()
    });
    assert.equal(row2.catalogEntryId, 'cat_21');
  });

  test('completeStep emits KaizenStepCompleted with full payload', () => {
    const env = buildEnv();
    const kid = seedDmaicKaizen(env);
    const captured = [];
    env.bus.subscribe(KaizenStepCompleted, (p) => captured.push(p));
    env.service.completeStep({
      kaizenId: kid,
      catalogEntryId: 'cat_20',
      userId: 'u_1',
      catalog: dmaicCatalog()
    });
    assert.equal(captured.length, 1);
    const ev = captured[0];
    assert.equal(ev.kaizenId, kid);
    assert.equal(ev.catalogEntryId, 'cat_20');
    assert.equal(ev.userId, 'u_1');
    assert.equal(ev.sourceKind, 'portfolio');
    assert.equal(ev.sourceId, null);
    assert.equal(ev.completedAt, FROZEN);
    assert.ok(ev.id);
  });
});

describe('KaizenService.completeStep — guards', () => {
  test('throws STEP_NOT_CURRENT when step isn\'t the current one', () => {
    const env = buildEnv();
    const kid = seedDmaicKaizen(env);
    assert.throws(
      () =>
        env.service.completeStep({
          kaizenId: kid,
          catalogEntryId: 'cat_22', // jump ahead
          userId: 'u_1',
          catalog: dmaicCatalog()
        }),
      /not the current step/
    );
  });

  test('STEP_NOT_CURRENT carries expected + got in detail', () => {
    const env = buildEnv();
    const kid = seedDmaicKaizen(env);
    try {
      env.service.completeStep({
        kaizenId: kid,
        catalogEntryId: 'cat_22',
        userId: 'u_1',
        catalog: dmaicCatalog()
      });
      assert.fail('expected throw');
    } catch (err) {
      assert.equal(err.name, 'STEP_NOT_CURRENT');
      assert.equal(err.expected, 'cat_20');
      assert.equal(err.got, 'cat_22');
      assert.equal(err.kaizenId, kid);
    }
  });

  test('throws KAIZEN_NOT_FOUND when kaizenId is unknown', () => {
    const env = buildEnv();
    assert.throws(
      () =>
        env.service.completeStep({
          kaizenId: 'nope',
          catalogEntryId: 'cat_20',
          userId: 'u_1',
          catalog: dmaicCatalog()
        }),
      /KAIZEN_NOT_FOUND|not found/
    );
  });

  test('throws INVALID_INPUT when kaizenId is missing', () => {
    const env = buildEnv();
    assert.throws(
      () =>
        env.service.completeStep({
          catalogEntryId: 'cat_20',
          userId: 'u_1',
          catalog: dmaicCatalog()
        }),
      /kaizenId required/
    );
  });

  test('throws INVALID_INPUT when catalogEntryId is missing', () => {
    const env = buildEnv();
    const kid = seedDmaicKaizen(env);
    assert.throws(
      () =>
        env.service.completeStep({
          kaizenId: kid,
          userId: 'u_1',
          catalog: dmaicCatalog()
        }),
      /catalogEntryId required/
    );
  });

  test('throws INVALID_INPUT when userId is missing', () => {
    const env = buildEnv();
    const kid = seedDmaicKaizen(env);
    assert.throws(
      () =>
        env.service.completeStep({
          kaizenId: kid,
          catalogEntryId: 'cat_20',
          catalog: dmaicCatalog()
        }),
      /userId required/
    );
  });

  test('does NOT emit event when guard fails', () => {
    const env = buildEnv();
    const kid = seedDmaicKaizen(env);
    const captured = [];
    env.bus.subscribe(KaizenStepCompleted, (p) => captured.push(p));
    try {
      env.service.completeStep({
        kaizenId: kid,
        catalogEntryId: 'cat_22',
        userId: 'u_1',
        catalog: dmaicCatalog()
      });
    } catch {
      /* expected */
    }
    assert.equal(captured.length, 0);
  });
});

describe('KaizenService.scheduleStep — happy path', () => {
  test('creates a ScheduledActivity under SCHEDULED_ACTIVITIES_KEY', () => {
    const env = buildEnv();
    const kid = seedDmaicKaizen(env);
    const saId = env.service.scheduleStep({
      kaizenId: kid,
      catalogEntryId: 'cat_20',
      targetDate: '2026-04-23',
      userId: 'u_1',
      catalog: dmaicCatalog()
    });
    assert.ok(typeof saId === 'string' && saId.length > 0);
    const map = env.repo.read(SCHEDULED_ACTIVITIES_KEY) ?? {};
    const sa = map[saId];
    assert.ok(sa);
    assert.equal(sa.id, saId);
    assert.equal(sa.catalogEntryId, 'cat_20');
    assert.equal(sa.linkedKaizenId, kid);
    assert.equal(sa.name, 'DMAIC Charter');
    assert.equal(sa.bucket, 'PROJECT');
    assert.equal(sa.plannedDurationMinutes, 90);
    assert.equal(sa.plannedStartAt, '2026-04-23T09:00:00Z');
    assert.equal(sa.state, 'SCHEDULED');
    assert.equal(sa.compositionId, null);
    assert.equal(sa.createdAt, FROZEN);
  });

  test('scheduleStep emits KaizenStepScheduled with full payload', () => {
    const env = buildEnv();
    const kid = seedDmaicKaizen(env);
    const captured = [];
    env.bus.subscribe(KaizenStepScheduled, (p) => captured.push(p));
    const saId = env.service.scheduleStep({
      kaizenId: kid,
      catalogEntryId: 'cat_20',
      targetDate: '2026-04-23',
      userId: 'u_1',
      catalog: dmaicCatalog()
    });
    assert.equal(captured.length, 1);
    const ev = captured[0];
    assert.equal(ev.kaizenId, kid);
    assert.equal(ev.catalogEntryId, 'cat_20');
    assert.equal(ev.targetDate, '2026-04-23');
    assert.equal(ev.userId, 'u_1');
    assert.equal(ev.scheduledActivityId, saId);
    assert.equal(ev.scheduledAt, FROZEN);
  });

  test('schedules a non-current step (pending) — no progression guard', () => {
    const env = buildEnv();
    const kid = seedDmaicKaizen(env);
    // cat_22 is pending but scheduleStep does not block it.
    const saId = env.service.scheduleStep({
      kaizenId: kid,
      catalogEntryId: 'cat_22',
      targetDate: '2026-04-24',
      userId: 'u_1',
      catalog: dmaicCatalog()
    });
    assert.ok(saId);
  });

  test('falls back to 30 min duration when defaultDurationMinutes absent', () => {
    const env = buildEnv();
    const kid = seedDmaicKaizen(env);
    const noDefault = [
      {
        id: 'cat_nd',
        activityNumber: 20,
        name: 'No duration',
        bucket: 'PROJECT',
        dependsOn: [],
        projectTypeBinding: 'DMAIC'
      }
    ];
    // Also need the kaizen's projectType to match this catalog.
    env.repo.upsert(KAIZENS_KEY, kid, {
      ...env.service.get(kid),
      projectType: 'DMAIC'
    });
    const saId = env.service.scheduleStep({
      kaizenId: kid,
      catalogEntryId: 'cat_nd',
      targetDate: '2026-04-23',
      userId: 'u_1',
      catalog: noDefault
    });
    const sa = (env.repo.read(SCHEDULED_ACTIVITIES_KEY) ?? {})[saId];
    assert.equal(sa.plannedDurationMinutes, 30);
  });

  test('returned id starts with sa_', () => {
    const env = buildEnv();
    const kid = seedDmaicKaizen(env);
    const saId = env.service.scheduleStep({
      kaizenId: kid,
      catalogEntryId: 'cat_20',
      targetDate: '2026-04-23',
      userId: 'u_1',
      catalog: dmaicCatalog()
    });
    assert.ok(saId.startsWith('sa_'));
  });
});

describe('KaizenService.scheduleStep — guards', () => {
  test('throws INVALID_TARGET_DATE when date is missing', () => {
    const env = buildEnv();
    const kid = seedDmaicKaizen(env);
    assert.throws(
      () =>
        env.service.scheduleStep({
          kaizenId: kid,
          catalogEntryId: 'cat_20',
          userId: 'u_1',
          catalog: dmaicCatalog()
        }),
      /YYYY-MM-DD/
    );
  });

  test('throws INVALID_TARGET_DATE when date is malformed', () => {
    const env = buildEnv();
    const kid = seedDmaicKaizen(env);
    assert.throws(
      () =>
        env.service.scheduleStep({
          kaizenId: kid,
          catalogEntryId: 'cat_20',
          targetDate: 'tomorrow',
          userId: 'u_1',
          catalog: dmaicCatalog()
        }),
      /YYYY-MM-DD/
    );
  });

  test('throws KAIZEN_NOT_FOUND for unknown kaizen', () => {
    const env = buildEnv();
    assert.throws(
      () =>
        env.service.scheduleStep({
          kaizenId: 'nope',
          catalogEntryId: 'cat_20',
          targetDate: '2026-04-23',
          userId: 'u_1',
          catalog: dmaicCatalog()
        }),
      /not found/
    );
  });

  test('throws CATALOG_ENTRY_NOT_FOUND when entry missing from catalog', () => {
    const env = buildEnv();
    const kid = seedDmaicKaizen(env);
    assert.throws(
      () =>
        env.service.scheduleStep({
          kaizenId: kid,
          catalogEntryId: 'cat_unknown',
          targetDate: '2026-04-23',
          userId: 'u_1',
          catalog: dmaicCatalog()
        }),
      /CATALOG_ENTRY_NOT_FOUND|catalog entry/
    );
  });

  test('throws INVALID_INPUT when userId is missing', () => {
    const env = buildEnv();
    const kid = seedDmaicKaizen(env);
    assert.throws(
      () =>
        env.service.scheduleStep({
          kaizenId: kid,
          catalogEntryId: 'cat_20',
          targetDate: '2026-04-23',
          catalog: dmaicCatalog()
        }),
      /userId required/
    );
  });
});

describe('KaizenService.getCompletedStepsForKaizen', () => {
  test('returns [] when no progress exists', () => {
    const env = buildEnv();
    seedDmaicKaizen(env);
    const rows = env.service.getCompletedStepsForKaizen('k_dm_1');
    assert.equal(rows.length, 0);
  });

  test('returns only rows for the given kaizenId', () => {
    const env = buildEnv();
    seedDmaicKaizen(env, { kaizenId: 'k_a' });
    seedDmaicKaizen(env, { kaizenId: 'k_b' });
    env.service.completeStep({
      kaizenId: 'k_a',
      catalogEntryId: 'cat_20',
      userId: 'u_1',
      catalog: dmaicCatalog()
    });
    env.advance('2026-04-22T10:05:00Z');
    env.service.completeStep({
      kaizenId: 'k_b',
      catalogEntryId: 'cat_20',
      userId: 'u_1',
      catalog: dmaicCatalog()
    });
    const a = env.service.getCompletedStepsForKaizen('k_a');
    const b = env.service.getCompletedStepsForKaizen('k_b');
    assert.equal(a.length, 1);
    assert.equal(a[0].kaizenId, 'k_a');
    assert.equal(b.length, 1);
    assert.equal(b[0].kaizenId, 'k_b');
  });

  test('orders rows by completedAt ascending', () => {
    const env = buildEnv();
    const kid = seedDmaicKaizen(env);
    env.advance('2026-04-22T10:00:00Z');
    env.service.completeStep({
      kaizenId: kid,
      catalogEntryId: 'cat_20',
      userId: 'u_1',
      catalog: dmaicCatalog()
    });
    env.advance('2026-04-22T11:00:00Z');
    env.service.completeStep({
      kaizenId: kid,
      catalogEntryId: 'cat_21',
      userId: 'u_1',
      catalog: dmaicCatalog()
    });
    const rows = env.service.getCompletedStepsForKaizen(kid);
    assert.equal(rows.length, 2);
    assert.equal(rows[0].catalogEntryId, 'cat_20');
    assert.equal(rows[1].catalogEntryId, 'cat_21');
  });

  test('returns [] for empty/missing kaizenId', () => {
    const env = buildEnv();
    assert.deepEqual(env.service.getCompletedStepsForKaizen(''), []);
    assert.deepEqual(env.service.getCompletedStepsForKaizen(undefined), []);
  });
});

describe('KaizenService.getCompletedStepsByKaizenId', () => {
  test('returns empty object when no progress exists', () => {
    const env = buildEnv();
    assert.deepEqual(env.service.getCompletedStepsByKaizenId(), {});
  });

  test('groups rows by kaizenId', () => {
    const env = buildEnv();
    seedDmaicKaizen(env, { kaizenId: 'k_a' });
    seedDmaicKaizen(env, { kaizenId: 'k_b' });
    env.service.completeStep({
      kaizenId: 'k_a',
      catalogEntryId: 'cat_20',
      userId: 'u_1',
      catalog: dmaicCatalog()
    });
    env.advance('2026-04-22T10:05:00Z');
    env.service.completeStep({
      kaizenId: 'k_b',
      catalogEntryId: 'cat_20',
      userId: 'u_1',
      catalog: dmaicCatalog()
    });
    const grouped = env.service.getCompletedStepsByKaizenId();
    assert.equal(Object.keys(grouped).length, 2);
    assert.equal(grouped.k_a.length, 1);
    assert.equal(grouped.k_b.length, 1);
  });

  test('rows in each group are ordered by completedAt asc', () => {
    const env = buildEnv();
    const kid = seedDmaicKaizen(env);
    env.advance('2026-04-22T12:00:00Z');
    env.service.completeStep({
      kaizenId: kid,
      catalogEntryId: 'cat_20',
      userId: 'u_1',
      catalog: dmaicCatalog()
    });
    env.advance('2026-04-22T10:00:00Z');
    // Second row has an earlier timestamp — sort should reorder.
    env.service.completeStep({
      kaizenId: kid,
      catalogEntryId: 'cat_21',
      userId: 'u_1',
      catalog: dmaicCatalog()
    });
    const grouped = env.service.getCompletedStepsByKaizenId();
    assert.equal(grouped[kid][0].completedAt < grouped[kid][1].completedAt, true);
  });
});

describe('KaizenService step methods — append-only semantics', () => {
  test('each completeStep creates a distinct row id', () => {
    const env = buildEnv();
    const kid = seedDmaicKaizen(env);
    env.service.completeStep({
      kaizenId: kid,
      catalogEntryId: 'cat_20',
      userId: 'u_1',
      catalog: dmaicCatalog()
    });
    env.advance('2026-04-22T10:05:00Z');
    env.service.completeStep({
      kaizenId: kid,
      catalogEntryId: 'cat_21',
      userId: 'u_1',
      catalog: dmaicCatalog()
    });
    const map = env.repo.read(STEP_PROGRESS_KEY) ?? {};
    assert.equal(Object.keys(map).length, 2);
  });

  test('two scheduleStep calls create two SAs', () => {
    const env = buildEnv();
    const kid = seedDmaicKaizen(env);
    env.service.scheduleStep({
      kaizenId: kid,
      catalogEntryId: 'cat_20',
      targetDate: '2026-04-23',
      userId: 'u_1',
      catalog: dmaicCatalog()
    });
    env.advance('2026-04-22T11:00:00Z');
    env.service.scheduleStep({
      kaizenId: kid,
      catalogEntryId: 'cat_21',
      targetDate: '2026-04-24',
      userId: 'u_1',
      catalog: dmaicCatalog()
    });
    const map = env.repo.read(SCHEDULED_ACTIVITIES_KEY) ?? {};
    assert.equal(Object.keys(map).length, 2);
  });
});

describe('KaizenService step methods — catalog resolution via setCatalogService', () => {
  test('completeStep uses injected catalogService when no catalog passed', () => {
    const env = buildEnv();
    const kid = seedDmaicKaizen(env);
    env.service.setCatalogService({
      list: () => dmaicCatalog()
    });
    const row = env.service.completeStep({
      kaizenId: kid,
      catalogEntryId: 'cat_20',
      userId: 'u_1'
    });
    assert.equal(row.catalogEntryId, 'cat_20');
  });

  test('scheduleStep uses injected catalogService when no catalog passed', () => {
    const env = buildEnv();
    const kid = seedDmaicKaizen(env);
    env.service.setCatalogService({
      list: () => dmaicCatalog()
    });
    const saId = env.service.scheduleStep({
      kaizenId: kid,
      catalogEntryId: 'cat_20',
      targetDate: '2026-04-23',
      userId: 'u_1'
    });
    assert.ok(saId.startsWith('sa_'));
  });
});
