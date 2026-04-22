/**
 * Integration — Sprint 5 E5 Activity Runtime.
 *
 * Walks the full happy path:
 *   1. ComposerService.composeDaily(goldenInput) → PROPOSED composition
 *   2. ComposerService.accept(id)               → composition ACCEPTED, all SAs SCHEDULED
 *   3. ActivityService.start(firstSa.id)        → first SA IN_PROGRESS
 *   4. ActivityService.close(firstSa.id, ref)   → first SA CLOSED, artifact persisted
 *   5. Next SCHEDULED SA is still pinned (exists as next action)
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { LocalStorageRepository } from '../../js/persistence/LocalStorageRepository.js';
import { EventBus } from '../../js/events/EventBus.js';
import { ClockService } from '../../js/services/ClockService.js';
import { CatalogService } from '../../js/services/CatalogService.js';
import { ComposerService, ACTIVITIES_KEY, COMPOSITIONS_KEY } from '../../js/services/ComposerService.js';
import { VarianceService } from '../../js/services/VarianceService.js';
import { ActivityService } from '../../js/services/ActivityService.js';
import {
  ActivityStarted,
  ActivityCompleted
} from '../../js/events/events.js';
import { LocalStorageMock } from '../_helpers/localStorageMock.js';
import {
  buildGoldenComposerInput,
  GOLDEN_FULL_CATALOG
} from '../fixtures/goldenDay.js';

const FROZEN_NOW = '2026-04-21T09:00:00Z';

function buildEnv() {
  const storage = new LocalStorageMock();
  const repo = new LocalStorageRepository({ storage });
  const bus = new EventBus();
  const clock = new ClockService({ now: () => FROZEN_NOW });
  const catalogService = new CatalogService({ repo });
  catalogService.seed(GOLDEN_FULL_CATALOG.map((c) => ({ ...c })));
  const composerService = new ComposerService({ repo, bus, clock, catalogService });
  const varianceService = new VarianceService({ repo, bus, clock });
  const activityService = new ActivityService({
    repo,
    bus,
    clock,
    varianceService,
    catalogService,
    composerService
  });
  return { storage, repo, bus, clock, catalogService, composerService, varianceService, activityService };
}

describe('Integration — compose → accept → start → close', () => {
  test('walks the full happy path end-to-end', () => {
    const env = buildEnv();
    const input = buildGoldenComposerInput({
      catalog: GOLDEN_FULL_CATALOG.map((c) => ({ ...c }))
    });

    // 1. composeDaily.
    const result = env.composerService.composeDaily(input);
    assert.equal(result.state, 'PROPOSED');

    // 2. accept.
    const compId = result.composition.id;
    env.composerService.accept(compId);
    const acts = env.repo.read(ACTIVITIES_KEY);
    const children = Object.values(acts).filter((a) => a.compositionId === compId);
    assert.ok(children.length > 0);
    for (const a of children) {
      assert.equal(a.state, 'SCHEDULED');
    }

    // 3. start the first SCHEDULED activity.
    const first = children[0];
    const startedEvents = [];
    env.bus.subscribe(ActivityStarted, (p) => startedEvents.push(p));
    env.activityService.start(first.id);
    const afterStart = env.repo.read(ACTIVITIES_KEY)[first.id];
    assert.equal(afterStart.state, 'IN_PROGRESS');
    assert.equal(afterStart.actualStartAt, FROZEN_NOW);
    assert.equal(startedEvents.length, 1);

    // 4. close with artifact. Use the catalog entry's schema.
    const entry = env.catalogService.list(input.userId).find(
      (c) => c.id === first.catalogEntryId
    );
    const schema = entry?.outputArtifact?.schema ?? 'TEXT';
    const ref = buildArtifactForSchema(schema);
    const completedEvents = [];
    env.bus.subscribe(ActivityCompleted, (p) => completedEvents.push(p));
    env.activityService.close(first.id, { outputArtifactRef: ref });

    const afterClose = env.repo.read(ACTIVITIES_KEY)[first.id];
    assert.equal(afterClose.state, 'CLOSED');
    assert.equal(afterClose.actualEndAt, FROZEN_NOW);
    assert.ok(afterClose.outputArtifactRef);
    assert.equal(afterClose.outputArtifactRef.schema, schema);
    assert.equal(completedEvents.length, 1);

    // 5. A SCHEDULED activity remains to be pinned next.
    const remaining = Object.values(env.repo.read(ACTIVITIES_KEY)).filter(
      (a) => a.compositionId === compId && a.state === 'SCHEDULED'
    );
    assert.ok(remaining.length >= 1, 'expected at least one more SCHEDULED activity');
  });

  test('close fails without a valid artifact → activity remains IN_PROGRESS', () => {
    const env = buildEnv();
    const input = buildGoldenComposerInput({
      catalog: GOLDEN_FULL_CATALOG.map((c) => ({ ...c }))
    });
    env.composerService.composeDaily(input);
    const comps = env.repo.read(COMPOSITIONS_KEY);
    const compId = Object.keys(comps)[0];
    env.composerService.accept(compId);
    const acts = env.repo.read(ACTIVITIES_KEY);
    const first = Object.values(acts).find((a) => a.compositionId === compId);
    env.activityService.start(first.id);

    assert.throws(
      () => env.activityService.close(first.id, { outputArtifactRef: null }),
      (e) => e.name === 'CLOSE_REQUIRES_ARTIFACT'
    );
    const after = env.repo.read(ACTIVITIES_KEY)[first.id];
    assert.equal(after.state, 'IN_PROGRESS');
  });
});

/**
 * Build a valid artifact value for a given schema.
 *
 * @param {string} schema
 * @returns {object}
 */
function buildArtifactForSchema(schema) {
  switch (schema) {
    case 'TEXT':
      return { schema, value: 'Done.' };
    case 'TWO_LIST':
      return { schema, value: { left: ['a'], right: ['b'] } };
    case 'NUMERIC':
      return { schema, value: { amount: 10, unit: 'min' } };
    case 'DOCUMENT':
    case 'CHART':
      return { schema, value: { url: 'https://example', title: 'Result' } };
    default:
      return { schema: 'TEXT', value: 'Done.' };
  }
}
