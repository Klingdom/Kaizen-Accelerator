/**
 * Test for Sprint 6 P1-T3 bug fix: re-composing a Composition for the
 * same date should delete old ScheduledActivity rows before inserting
 * the new ones (prevents duplicates when Fine-tune re-composes).
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  ComposerService,
  ACTIVITIES_KEY,
  COMPOSITIONS_KEY
} from '../../js/services/ComposerService.js';
import { CatalogService } from '../../js/services/CatalogService.js';
import { LocalStorageRepository } from '../../js/persistence/LocalStorageRepository.js';
import { EventBus } from '../../js/events/EventBus.js';
import { ClockService } from '../../js/services/ClockService.js';
import { LocalStorageMock } from '../_helpers/localStorageMock.js';
import {
  buildGoldenComposerInput,
  GOLDEN_FULL_CATALOG
} from '../fixtures/goldenDay.js';

function buildEnv() {
  const storage = new LocalStorageMock();
  const repo = new LocalStorageRepository({ storage });
  const bus = new EventBus();
  const clock = new ClockService({ now: () => '2026-04-21T09:00:00Z' });
  const catalogService = new CatalogService({ repo });
  catalogService.seed(GOLDEN_FULL_CATALOG.map((c) => ({ ...c })));
  const composerService = new ComposerService({ repo, bus, clock, catalogService });
  return { storage, repo, bus, clock, catalogService, composerService };
}

describe('ComposerService.composeDaily — stale ScheduledActivity cleanup', () => {
  let env;
  beforeEach(() => {
    env = buildEnv();
  });

  test('re-compose for same date deletes old child activities', () => {
    const input = buildGoldenComposerInput({
      catalog: GOLDEN_FULL_CATALOG.map((c) => ({ ...c }))
    });
    env.composerService.composeDaily(input);
    const firstActs = Object.values(env.repo.read(ACTIVITIES_KEY) ?? {}).filter(
      (a) => a && a.compositionId
    );
    const compId = firstActs[0].compositionId;

    // Re-compose the same date with a different capacity override.
    const input2 = buildGoldenComposerInput({
      catalog: GOLDEN_FULL_CATALOG.map((c) => ({ ...c }))
    });
    input2.dailyCapacityMinutes = 240; // half
    env.composerService.composeDaily(input2);

    // Same compositionId (derived from userId + date).
    const acts = env.repo.read(ACTIVITIES_KEY) ?? {};
    const children = Object.values(acts).filter(
      (a) => a && a.compositionId === compId
    );
    // The count should match the NEW compose's children count, not the
    // sum of old + new.
    const newChildren =
      Object.keys(env.repo.read(COMPOSITIONS_KEY)).length > 0
        ? children.length
        : 0;
    // Every child must reference the SAME compositionId — no leftovers.
    for (const a of Object.values(acts)) {
      if (a && a.compositionId) {
        assert.equal(a.compositionId, compId);
      }
    }
    // Smoke: we didn't accumulate all the original activities + new ones.
    assert.ok(newChildren <= firstActs.length + 2, 'stale activities should be cleaned up');
    assert.ok(newChildren > 0);
  });

  test('re-compose count matches the new composer result', () => {
    const input = buildGoldenComposerInput({
      catalog: GOLDEN_FULL_CATALOG.map((c) => ({ ...c }))
    });
    env.composerService.composeDaily(input);

    // Re-compose with a different capacity.
    const input2 = buildGoldenComposerInput({
      catalog: GOLDEN_FULL_CATALOG.map((c) => ({ ...c }))
    });
    input2.dailyCapacityMinutes = 600;
    const result2 = env.composerService.composeDaily(input2);
    const expectedCount = result2.composition?.activities?.length ?? 0;

    const acts = env.repo.read(ACTIVITIES_KEY) ?? {};
    const compId = result2.composition.id;
    const children = Object.values(acts).filter(
      (a) => a.compositionId === compId
    );
    assert.equal(children.length, expectedCount);
  });
});
