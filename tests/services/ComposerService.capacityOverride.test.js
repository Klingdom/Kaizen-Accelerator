/**
 * Sprint 5 P1-T4 — ComposerService persists capacityMinutesOverride on
 * the Composition's composerInputsSnapshot when the caller sets one.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { LocalStorageRepository } from '../../js/persistence/LocalStorageRepository.js';
import { EventBus } from '../../js/events/EventBus.js';
import { ClockService } from '../../js/services/ClockService.js';
import { ComposerService, COMPOSITIONS_KEY } from '../../js/services/ComposerService.js';
import { LocalStorageMock } from '../_helpers/localStorageMock.js';
import {
  buildGoldenComposerInput,
  GOLDEN_FULL_CATALOG
} from '../fixtures/goldenDay.js';

const FROZEN_NOW = '2026-04-21T08:00:00Z';

function buildService() {
  const storage = new LocalStorageMock();
  const repo = new LocalStorageRepository({ storage });
  const bus = new EventBus();
  const clock = new ClockService({ now: () => FROZEN_NOW });
  const service = new ComposerService({ repo, bus, clock });
  return { service, repo };
}

describe('ComposerService — P1-T4 capacityMinutesOverride', () => {
  test('override lands on composerInputsSnapshot', () => {
    const { service, repo } = buildService();
    const input = buildGoldenComposerInput({
      catalog: GOLDEN_FULL_CATALOG.map((c) => ({ ...c }))
    });
    input.capacityMinutesOverride = 480;
    const r = service.composeDaily(input);
    assert.equal(r.state, 'PROPOSED');
    const compId = r.composition.id;
    const comps = repo.read(COMPOSITIONS_KEY);
    const persisted = comps[compId];
    assert.ok(persisted);
    assert.equal(persisted.composerInputsSnapshot.capacityMinutesOverride, 480);
  });

  test('no override → field absent on snapshot', () => {
    const { service, repo } = buildService();
    const input = buildGoldenComposerInput({
      catalog: GOLDEN_FULL_CATALOG.map((c) => ({ ...c }))
    });
    const r = service.composeDaily(input);
    const compId = r.composition.id;
    const comps = repo.read(COMPOSITIONS_KEY);
    const persisted = comps[compId];
    assert.equal(
      persisted.composerInputsSnapshot.capacityMinutesOverride,
      undefined
    );
  });

  test('override does NOT mutate a stored User row', () => {
    const { service, repo } = buildService();
    const input = buildGoldenComposerInput({
      catalog: GOLDEN_FULL_CATALOG.map((c) => ({ ...c }))
    });
    input.capacityMinutesOverride = 480;
    service.composeDaily(input);
    // ComposerService doesn't touch bamx:v1:users at all.
    const users = repo.read('bamx:v1:users');
    assert.equal(users, null);
  });
});
