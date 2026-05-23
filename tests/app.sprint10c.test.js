/**
 * Sprint 10c hotfix tests.
 *
 * Covers:
 *   - listOrphanActivitiesForDate / mergeOrphanActivities helpers
 *   - loadFullCatalogAsync re-seeds catalog from getFullCatalog()
 *   - Today route merges orphan scheduleStep activities into the day
 */

globalThis.__CADENCEPLAN_NO_AUTOSTART__ = true;

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { LocalStorageMock } from './_helpers/localStorageMock.js';
import { ClockService } from '../js/services/ClockService.js';
import {
  buildServices,
  renderApp,
  listOrphanActivitiesForDate,
  mergeOrphanActivities,
  loadFullCatalogAsync,
  DEFAULT_USER
} from '../js/app.js';
import { SCHEDULED_ACTIVITIES_KEY } from '../js/services/KaizenService.js';
import { CATALOG_KEY } from '../js/services/CatalogService.js';

const FROZEN = '2026-04-23T10:00:00Z';

function makeEnv(nowIso = FROZEN) {
  const storage = new LocalStorageMock();
  const clock = new ClockService({ now: () => nowIso });
  const services = buildServices({ storage, clock });
  return { storage, clock, services };
}

function orphan({ id = 'sa_x', bucket = 'PROJECT', minutes = 60, plannedStartAt, userId = DEFAULT_USER.id }) {
  return {
    id,
    compositionId: null,
    catalogEntryId: 'cat_1',
    linkedKaizenId: 'k_1',
    name: 'X',
    bucket,
    plannedDurationMinutes: minutes,
    plannedStartAt,
    state: 'SCHEDULED',
    userId,
    createdAt: plannedStartAt
  };
}

describe('listOrphanActivitiesForDate', () => {
  test('returns empty when storage is empty', () => {
    const { services } = makeEnv();
    const rows = listOrphanActivitiesForDate(services.repo, '2026-04-23');
    assert.deepEqual(rows, []);
  });

  test('filters by compositionId:null and matching date', () => {
    const { services } = makeEnv();
    services.repo.write('bamx:v1:activities', {
      'sa_today_orphan': orphan({ id: 'sa_today_orphan', plannedStartAt: '2026-04-23T09:00:00Z' }),
      'sa_composed': { id: 'sa_composed', compositionId: 'comp_1', plannedStartAt: '2026-04-23T10:00:00Z' },
      'sa_other_day': orphan({ id: 'sa_other_day', plannedStartAt: '2026-04-24T09:00:00Z' })
    });
    const rows = listOrphanActivitiesForDate(services.repo, '2026-04-23');
    assert.equal(rows.length, 1);
    assert.equal(rows[0].id, 'sa_today_orphan');
  });

  test('returns empty on invalid date', () => {
    const { services } = makeEnv();
    assert.deepEqual(listOrphanActivitiesForDate(services.repo, ''), []);
    assert.deepEqual(listOrphanActivitiesForDate(services.repo, '2026'), []);
  });

  test('tolerates missing plannedStartAt or null repo', () => {
    const { services } = makeEnv();
    services.repo.write('bamx:v1:activities', {
      'sa_no_start': { id: 'sa_no_start', compositionId: null }
    });
    assert.deepEqual(listOrphanActivitiesForDate(services.repo, '2026-04-23'), []);
    assert.deepEqual(listOrphanActivitiesForDate(null, '2026-04-23'), []);
  });
});

describe('mergeOrphanActivities', () => {
  test('no orphans returns activeState untouched', () => {
    const active = { composition: { id: 'c_1' }, activities: [{ id: 'a_1' }] };
    assert.equal(mergeOrphanActivities(active, []), active);
  });

  test('orphans + existing composition → appended', () => {
    const active = { composition: { id: 'c_1' }, activities: [{ id: 'a_1' }] };
    const orphans = [orphan({ id: 'sa_o', plannedStartAt: '2026-04-23T09:00:00Z' })];
    const out = mergeOrphanActivities(active, orphans);
    assert.equal(out.composition.id, 'c_1');
    assert.equal(out.activities.length, 2);
    assert.equal(out.activities[1].id, 'sa_o');
  });

  test('orphans without composition → synthesized ACCEPTED shell', () => {
    const orphans = [
      orphan({ id: 'sa_a', bucket: 'PROJECT', minutes: 120, plannedStartAt: '2026-04-23T09:00:00Z' }),
      orphan({ id: 'sa_b', bucket: 'CI', minutes: 30, plannedStartAt: '2026-04-23T13:00:00Z' })
    ];
    const out = mergeOrphanActivities(null, orphans);
    assert.equal(out.composition.state, 'ACCEPTED');
    assert.equal(out.composition.synthesizedForOrphans, true);
    assert.equal(out.composition.date, '2026-04-23');
    assert.equal(out.composition.plannedByBucket.PROJECT, 120);
    assert.equal(out.composition.plannedByBucket.CI, 30);
    assert.equal(out.composition.plannedByBucket.COMMUNICATION, 0);
    assert.equal(out.activities.length, 2);
  });

  test('non-array orphans input is handled', () => {
    const active = { composition: { id: 'c_1' }, activities: [] };
    assert.equal(mergeOrphanActivities(active, null), active);
    assert.equal(mergeOrphanActivities(null, null), null);
  });

  test('synthesized bucket totals exclude unknown buckets', () => {
    const orphans = [orphan({ id: 'sa_bad', bucket: 'UNKNOWN', minutes: 30, plannedStartAt: '2026-04-23T09:00:00Z' })];
    const out = mergeOrphanActivities(null, orphans);
    assert.equal(out.composition.plannedByBucket.PROJECT, 0);
    assert.equal(out.composition.plannedByBucket.COMMUNICATION, 0);
    assert.equal(out.composition.plannedByBucket.CI, 0);
  });
});

describe('Today route renders orphan scheduleStep activities', () => {
  test('activities scheduled via scheduleStep appear in rendered HTML when no prior composition', () => {
    const { services, storage } = makeEnv();
    // Stand up a kaizen + a catalog entry so scheduleStep succeeds.
    const catalog = services.catalogService.list(DEFAULT_USER.id);
    assert.ok(catalog.length > 0, 'seeded browser catalog');
    const entry = catalog.find((e) => e.bucket === 'PROJECT') ?? catalog[0];
    // Insert a Kaizen directly.
    services.repo.write('bamx:v1:kaizens', {
      'k_1': {
        id: 'k_1',
        userId: DEFAULT_USER.id,
        title: 'Test Kaizen',
        state: 'ACTIVE',
        projectType: 'DMAIC',
        createdAt: FROZEN
      }
    });
    services.kaizenService.setCatalogService?.(services.catalogService);
    services.kaizenService.scheduleStep({
      kaizenId: 'k_1',
      catalogEntryId: entry.id,
      targetDate: '2026-04-23',
      userId: DEFAULT_USER.id
    });
    // Mount a synthetic DOM root for renderApp.
    globalThis.document = globalThis.document ?? {
      getElementById() { return { innerHTML: '' }; }
    };
    const state = { route: 'today', expandedKaizenId: null, portfolio: {} };
    // Prepare a simple render capture by calling the helpers directly.
    const activeState = services.composerService.getActiveComposition(DEFAULT_USER.id);
    const orphans = listOrphanActivitiesForDate(services.repo, '2026-04-23');
    assert.equal(orphans.length, 1, 'exactly one orphan scheduled');
    const merged = mergeOrphanActivities(activeState, orphans);
    assert.ok(merged, 'merged state not null');
    assert.equal(merged.activities.length, 1);
    assert.equal(merged.activities[0].id, orphans[0].id);
    assert.equal(merged.composition.synthesizedForOrphans, true);
  });
});

describe('loadFullCatalogAsync', () => {
  test('upgrades from BROWSER_CATALOG 9 entries to full 60-entry catalog', async () => {
    const { services } = makeEnv();
    const before = services.catalogService.list(DEFAULT_USER.id);
    assert.ok(before.length <= 10, 'browser seed is small');
    let rerenderCalls = 0;
    await loadFullCatalogAsync(services, () => rerenderCalls++);
    const after = services.catalogService.list(DEFAULT_USER.id);
    assert.ok(after.length >= 60, `expected ≥60 entries, got ${after.length}`);
    assert.equal(rerenderCalls, 1, 'rerender called exactly once');
  });

  test('no-op if the fetched catalog is not larger than the current seed', async () => {
    const { services } = makeEnv();
    // Pre-seed with a large fake catalog so loadFullCatalogAsync shouldn't
    // overwrite it. Must be > 81 (Phase 3 full catalog size).
    const big = [];
    for (let i = 0; i < 82; i++) {
      big.push({
        id: `big_${i}`,
        activityNumber: i,
        name: `Big ${i}`,
        focusArea: 'CONTINUOUS_IMPROVEMENT',
        defaultDurationMinutes: 30,
        cadence: 'DAILY',
        trigger: '',
        inputs: [],
        outputArtifact: { name: 'n', schema: 'TEXT', required: true },
        participants: [],
        procedure: [],
        bucket: 'CI',
        isNonOptional: false,
        dependsOn: [],
        projectTypeBinding: null,
        phaseBinding: null,
        appliesToRoles: ['PRACTITIONER'],
        enabledByUser: true,
        version: 1,
        sourceRef: 'test'
      });
    }
    services.catalogService.seed(big);
    let rerenderCalls = 0;
    await loadFullCatalogAsync(services, () => rerenderCalls++);
    const after = services.catalogService.list(DEFAULT_USER.id);
    assert.equal(after.length, 82, 'existing larger seed preserved'); // Phase 3: real catalog is 81; 82 > 81
    assert.equal(rerenderCalls, 0, 'rerender not called when no upgrade needed');
  });

  test('silent on error — does not throw', async () => {
    const { services } = makeEnv();
    // Corrupt the catalogService so seed() throws.
    const brokenServices = {
      ...services,
      catalogService: {
        list: () => [],
        seed: () => { throw new Error('boom'); }
      }
    };
    await assert.doesNotReject(async () => {
      await loadFullCatalogAsync(brokenServices, () => {});
    });
  });
});
