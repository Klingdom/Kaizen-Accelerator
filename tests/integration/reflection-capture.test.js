/**
 * Integration — Sprint 6 reflection-capture loop.
 *
 * Walks compose → accept → start → close → Reflection stubbed (pending=true)
 * → capture → pending=false + ReflectionCaptured with onTime=true.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { LocalStorageRepository } from '../../js/persistence/LocalStorageRepository.js';
import { EventBus } from '../../js/events/EventBus.js';
import { ClockService } from '../../js/services/ClockService.js';
import { CatalogService } from '../../js/services/CatalogService.js';
import {
  ComposerService,
  ACTIVITIES_KEY
} from '../../js/services/ComposerService.js';
import { VarianceService } from '../../js/services/VarianceService.js';
import { ActivityService } from '../../js/services/ActivityService.js';
import { ReflectionService, REFLECTIONS_KEY } from '../../js/services/ReflectionService.js';
import { FrictionService } from '../../js/services/FrictionService.js';
import {
  ActivityCompleted,
  ReflectionStubbed,
  ReflectionCaptured
} from '../../js/events/events.js';
import { LocalStorageMock } from '../_helpers/localStorageMock.js';
import {
  buildGoldenComposerInput,
  GOLDEN_FULL_CATALOG
} from '../fixtures/goldenDay.js';

const FROZEN_NOW = '2026-04-21T09:00:00Z';

function buildEnv(nowIso = FROZEN_NOW) {
  const storage = new LocalStorageMock();
  const repo = new LocalStorageRepository({ storage });
  const bus = new EventBus();
  const clock = new ClockService({ now: () => nowIso });
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
  const frictionService = new FrictionService({ repo, bus, clock });
  const reflectionService = new ReflectionService({
    repo,
    bus,
    clock,
    frictionService
  });
  // Subscribe the service to ActivityCompleted (boot-time wiring mirror).
  bus.subscribe(ActivityCompleted, (payload) => {
    const acts = repo.read(ACTIVITIES_KEY) ?? {};
    const sa = acts[payload.scheduledActivityId];
    if (!sa) return;
    const existing = reflectionService.getByScheduledActivityId(sa.id);
    if (!existing) {
      try {
        reflectionService.stubOnClose({ ...sa, userId: sa.userId ?? 'u_1' });
      } catch (e) {
        if (e.name !== 'REFLECTION_ALREADY_EXISTS') throw e;
      }
    }
  });
  return {
    repo,
    bus,
    clock,
    catalogService,
    composerService,
    varianceService,
    activityService,
    reflectionService,
    frictionService
  };
}

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

describe('Integration — reflection-capture loop', () => {
  test('close activity → Reflection stubbed → capture → pending=false + onTime', () => {
    const env = buildEnv();
    const input = buildGoldenComposerInput({
      catalog: GOLDEN_FULL_CATALOG.map((c) => ({ ...c }))
    });
    const result = env.composerService.composeDaily(input);
    const compId = result.composition.id;
    env.composerService.accept(compId);

    const acts = env.repo.read(ACTIVITIES_KEY);
    const first = Object.values(acts).find((a) => a.compositionId === compId);
    env.activityService.start(first.id);

    const catalogEntry = env.catalogService
      .list(input.userId)
      .find((c) => c.id === first.catalogEntryId);
    const schema = catalogEntry?.outputArtifact?.schema ?? 'TEXT';

    const stubbedEvents = [];
    env.bus.subscribe(ReflectionStubbed, (p) => stubbedEvents.push(p));

    env.activityService.close(first.id, {
      outputArtifactRef: buildArtifactForSchema(schema)
    });

    // Reflection should be stubbed (pending=true) via the subscriber.
    assert.equal(stubbedEvents.length, 1);
    const reflectionMap = env.repo.read(REFLECTIONS_KEY);
    const reflections = Object.values(reflectionMap);
    assert.equal(reflections.length, 1);
    assert.equal(reflections[0].pending, true);

    // Capture the reflection within the window → onTime=true.
    const capturedEvents = [];
    env.bus.subscribe(ReflectionCaptured, (p) => capturedEvents.push(p));
    const res = env.reflectionService.capture(reflections[0].id, {
      whatWentWell: 'Stayed focused.'
    });

    assert.equal(res.reflection.pending, false);
    assert.equal(capturedEvents.length, 1);
    assert.equal(capturedEvents[0].onTime, true);
    // And the row is persisted with capturedAt=now.
    const after = env.repo.read(REFLECTIONS_KEY)[reflections[0].id];
    assert.equal(after.pending, false);
    assert.equal(after.capturedAt, FROZEN_NOW);
  });

  test('capture with frictionFlag=true creates FrictionSignal', () => {
    const env = buildEnv();
    const input = buildGoldenComposerInput({
      catalog: GOLDEN_FULL_CATALOG.map((c) => ({ ...c }))
    });
    const result = env.composerService.composeDaily(input);
    env.composerService.accept(result.composition.id);
    const acts = env.repo.read(ACTIVITIES_KEY);
    const first = Object.values(acts).find(
      (a) => a.compositionId === result.composition.id
    );
    env.activityService.start(first.id);
    const catalogEntry = env.catalogService
      .list(input.userId)
      .find((c) => c.id === first.catalogEntryId);
    env.activityService.close(first.id, {
      outputArtifactRef: buildArtifactForSchema(
        catalogEntry?.outputArtifact?.schema ?? 'TEXT'
      )
    });
    const reflection = env.reflectionService
      .listPending()[0];
    const res = env.reflectionService.capture(reflection.id, {
      whatToImprove: 'Too many meetings',
      frictionFlag: true,
      frictionTag: 'MEETING_LOAD',
      frictionSummary: 'Back-to-back meetings drained focus'
    });
    assert.ok(res.frictionSignal);
    assert.equal(res.frictionSignal.tag, 'MEETING_LOAD');
    assert.equal(res.frictionSignal.status, 'OPEN');
    const signalsMap = env.repo.read('bamx:v1:frictionSignals');
    assert.ok(signalsMap[res.frictionSignal.id]);
  });
});
