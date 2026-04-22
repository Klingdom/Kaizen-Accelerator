/**
 * Integration — Sprint 5 E5 Variance (skip path).
 *
 * Walks:
 *   1. composeDaily → PROPOSED
 *   2. accept → composition ACCEPTED, SAs SCHEDULED
 *   3. ActivityService.skip(sa, { reasonCode: 'BLOCKED' }) → SA SKIPPED
 *   4. A Variance row lands in `bamx:v1:variances` with kind=SKIPPED_NON_OPTIONAL
 *   5. VarianceLogged event is emitted
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { LocalStorageRepository } from '../../js/persistence/LocalStorageRepository.js';
import { EventBus } from '../../js/events/EventBus.js';
import { ClockService } from '../../js/services/ClockService.js';
import { CatalogService } from '../../js/services/CatalogService.js';
import { ComposerService, ACTIVITIES_KEY, COMPOSITIONS_KEY } from '../../js/services/ComposerService.js';
import { VarianceService, VARIANCES_KEY } from '../../js/services/VarianceService.js';
import { ActivityService } from '../../js/services/ActivityService.js';
import { VarianceLogged } from '../../js/events/events.js';
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

describe('Integration — compose → accept → skip → variance', () => {
  test('skip creates a Variance row in bamx:v1:variances', () => {
    const env = buildEnv();
    const input = buildGoldenComposerInput({
      catalog: GOLDEN_FULL_CATALOG.map((c) => ({ ...c }))
    });
    env.composerService.composeDaily(input);
    const compId = Object.keys(env.repo.read(COMPOSITIONS_KEY))[0];
    env.composerService.accept(compId);

    const first = Object.values(env.repo.read(ACTIVITIES_KEY)).find(
      (a) => a.compositionId === compId
    );

    const varEvents = [];
    env.bus.subscribe(VarianceLogged, (p) => varEvents.push(p));

    env.activityService.skip(first.id, { reasonCode: 'BLOCKED' });

    const after = env.repo.read(ACTIVITIES_KEY)[first.id];
    assert.equal(after.state, 'SKIPPED');
    assert.equal(after.reasonCodeIfSkipped, 'BLOCKED');

    const variances = env.repo.read(VARIANCES_KEY);
    const rows = Object.values(variances).filter(
      (v) => v.scheduledActivityId === first.id
    );
    assert.equal(rows.length, 1);
    assert.equal(rows[0].kind, 'SKIPPED_NON_OPTIONAL');
    assert.equal(rows[0].reasonCode, 'BLOCKED');
    assert.equal(rows[0].compositionId, compId);

    assert.equal(varEvents.length, 1);
  });

  test('skip with reason=OTHER and note is persisted', () => {
    const env = buildEnv();
    const input = buildGoldenComposerInput({
      catalog: GOLDEN_FULL_CATALOG.map((c) => ({ ...c }))
    });
    env.composerService.composeDaily(input);
    const compId = Object.keys(env.repo.read(COMPOSITIONS_KEY))[0];
    env.composerService.accept(compId);

    const first = Object.values(env.repo.read(ACTIVITIES_KEY)).find(
      (a) => a.compositionId === compId
    );

    env.activityService.skip(first.id, {
      reasonCode: 'OTHER',
      note: 'Surprise offsite'
    });
    const variances = Object.values(env.repo.read(VARIANCES_KEY));
    const row = variances.find((v) => v.scheduledActivityId === first.id);
    assert.ok(row);
    assert.equal(row.reasonCode, 'OTHER');
    assert.equal(row.note, 'Surprise offsite');
  });

  test('append-only: second skip of the same SA would throw (SA already SKIPPED)', () => {
    // Once SA is SKIPPED the FSM blocks a second skip with ILLEGAL_TRANSITION.
    const env = buildEnv();
    const input = buildGoldenComposerInput({
      catalog: GOLDEN_FULL_CATALOG.map((c) => ({ ...c }))
    });
    env.composerService.composeDaily(input);
    const compId = Object.keys(env.repo.read(COMPOSITIONS_KEY))[0];
    env.composerService.accept(compId);
    const first = Object.values(env.repo.read(ACTIVITIES_KEY)).find(
      (a) => a.compositionId === compId
    );

    env.activityService.skip(first.id, { reasonCode: 'SICK' });
    assert.throws(
      () => env.activityService.skip(first.id, { reasonCode: 'SICK' }),
      (e) => e.name === 'ILLEGAL_TRANSITION'
    );
  });
});
