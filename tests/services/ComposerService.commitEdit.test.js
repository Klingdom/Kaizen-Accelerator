/**
 * Sprint 12 — ComposerService.commitEdit tests.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { LocalStorageRepository } from '../../js/persistence/LocalStorageRepository.js';
import { EventBus } from '../../js/events/EventBus.js';
import { ClockService } from '../../js/services/ClockService.js';
import {
  ComposerService,
  COMPOSITIONS_KEY,
  ACTIVITIES_KEY
} from '../../js/services/ComposerService.js';
import { CycleEdited } from '../../js/events/events.js';
import { LocalStorageMock } from '../_helpers/localStorageMock.js';
import {
  buildGoldenComposerInput,
  GOLDEN_FULL_CATALOG
} from '../fixtures/goldenDay.js';

const NOW = '2026-04-22T09:00:00Z';

function buildService(now = NOW) {
  const storage = new LocalStorageMock();
  const repo = new LocalStorageRepository({ storage });
  const bus = new EventBus();
  const clock = new ClockService({ now: () => now });
  const service = new ComposerService({ repo, bus, clock });
  return { service, repo, bus, clock, storage };
}

function seedComposition(service) {
  return service.composeDaily(
    buildGoldenComposerInput({
      catalog: GOLDEN_FULL_CATALOG.map((c) => ({ ...c }))
    })
  );
}

describe('ComposerService.commitEdit — input validation', () => {
  test('throws INVALID_ID when compositionId is missing', () => {
    const { service } = buildService();
    assert.throws(() => service.commitEdit('', [], {}), /INVALID_ID/);
    assert.throws(() => service.commitEdit(null, [], {}), /INVALID_ID/);
  });

  test('throws INVALID_ACTIVITIES when activities is not an array', () => {
    const { service } = buildService();
    assert.throws(() => service.commitEdit('cid', null, {}), /INVALID_ACTIVITIES/);
    assert.throws(() => service.commitEdit('cid', 'nope', {}), /INVALID_ACTIVITIES/);
  });

  test('throws COMPOSITION_NOT_FOUND when the composition does not exist', () => {
    const { service } = buildService();
    assert.throws(
      () => service.commitEdit('nonexistent_id', [], {}),
      /COMPOSITION_NOT_FOUND/
    );
  });
});

describe('ComposerService.commitEdit — persistence', () => {
  test('preserves an unchanged slot by id + catalogEntryId', () => {
    const { service, repo } = buildService();
    const proposed = seedComposition(service);
    const compId = proposed.composition.id;
    const acts = repo.read(ACTIVITIES_KEY);
    const children = Object.values(acts).filter((a) => a.compositionId === compId);
    // Edit: keep all existing (pass through) — should be a no-op.
    service.commitEdit(compId, children.map((a) => ({ ...a })));
    const after = repo.read(ACTIVITIES_KEY);
    const afterChildren = Object.values(after).filter((a) => a.compositionId === compId);
    assert.equal(afterChildren.length, children.length);
    for (const a of afterChildren) {
      assert.notEqual(a.state, 'DROPPED');
    }
  });

  test('swapping a slot (same id, different catalogEntryId) marks prior DROPPED and creates fresh row', () => {
    const { service, repo } = buildService();
    const proposed = seedComposition(service);
    const compId = proposed.composition.id;
    const acts = repo.read(ACTIVITIES_KEY);
    const children = Object.values(acts).filter((a) => a.compositionId === compId);
    // Find a non-protected slot (PROJECT bucket, not carriedOver, not a
    // ceremony). GOLDEN has a generic deep work block.
    const deep = children.find((a) => a.bucket === 'PROJECT');
    assert.ok(deep, 'no PROJECT activity in golden seed');
    const edited = children.map((a) => {
      if (a.id !== deep.id) return { ...a };
      return { ...a, catalogEntryId: 'cat_new_entry', name: 'Swapped Entry' };
    });
    service.commitEdit(compId, edited);
    const after = repo.read(ACTIVITIES_KEY);
    const priorRow = after[deep.id];
    assert.equal(priorRow.state, 'DROPPED');
    // A new row with fresh id should have been written.
    const newRow = Object.values(after).find(
      (r) => r.compositionId === compId && r.catalogEntryId === 'cat_new_entry'
    );
    assert.ok(newRow, 'new swapped row not written');
    assert.notEqual(newRow.id, deep.id);
  });

  test('activity removed from the list is marked DROPPED', () => {
    const { service, repo } = buildService();
    const proposed = seedComposition(service);
    const compId = proposed.composition.id;
    const acts = repo.read(ACTIVITIES_KEY);
    const children = Object.values(acts).filter((a) => a.compositionId === compId);
    const removeTarget = children.find((a) => a.bucket === 'PROJECT');
    const edited = children.filter((a) => a.id !== removeTarget.id).map((a) => ({ ...a }));
    service.commitEdit(compId, edited);
    const after = repo.read(ACTIVITIES_KEY);
    assert.equal(after[removeTarget.id].state, 'DROPPED');
  });

  test('net-new activity (no prior id) is written fresh', () => {
    const { service, repo } = buildService();
    const proposed = seedComposition(service);
    const compId = proposed.composition.id;
    const acts = repo.read(ACTIVITIES_KEY);
    const children = Object.values(acts).filter((a) => a.compositionId === compId);
    const addition = {
      id: 'sa_brand_new',
      catalogEntryId: 'cat_new',
      name: 'Net New',
      bucket: 'CI',
      plannedDurationMinutes: 30,
      state: 'PROPOSED'
    };
    service.commitEdit(compId, [...children.map((a) => ({ ...a })), addition]);
    const after = repo.read(ACTIVITIES_KEY);
    assert.ok(after['sa_brand_new']);
    assert.equal(after['sa_brand_new'].compositionId, compId);
    assert.equal(after['sa_brand_new'].name, 'Net New');
  });

  test('state transitions PROPOSED → EDITED', () => {
    const { service, repo } = buildService();
    const proposed = seedComposition(service);
    const compId = proposed.composition.id;
    const acts = repo.read(ACTIVITIES_KEY);
    const children = Object.values(acts).filter((a) => a.compositionId === compId);
    service.commitEdit(compId, children.map((a) => ({ ...a })));
    const after = repo.read(COMPOSITIONS_KEY)[compId];
    assert.equal(after.state, 'EDITED');
  });

  test('state remains ACCEPTED after edit (does not regress to EDITED)', () => {
    const { service, repo } = buildService();
    const proposed = seedComposition(service);
    const compId = proposed.composition.id;
    service.accept(compId);
    const acts = repo.read(ACTIVITIES_KEY);
    const children = Object.values(acts).filter((a) => a.compositionId === compId);
    service.commitEdit(compId, children.map((a) => ({ ...a })));
    const after = repo.read(COMPOSITIONS_KEY)[compId];
    assert.equal(after.state, 'ACCEPTED');
  });

  test('lastEditedAt is stamped from the clock', () => {
    const { service, repo } = buildService();
    const proposed = seedComposition(service);
    const compId = proposed.composition.id;
    const acts = repo.read(ACTIVITIES_KEY);
    const children = Object.values(acts).filter((a) => a.compositionId === compId);
    service.commitEdit(compId, children.map((a) => ({ ...a })));
    const after = repo.read(COMPOSITIONS_KEY)[compId];
    assert.equal(after.lastEditedAt, NOW);
  });

  test('plannedByBucket is recomputed from survivors', () => {
    const { service, repo } = buildService();
    const proposed = seedComposition(service);
    const compId = proposed.composition.id;
    const acts = repo.read(ACTIVITIES_KEY);
    const children = Object.values(acts).filter((a) => a.compositionId === compId);
    // Remove all PROJECT activities to change the bucket sums.
    const projectRemoved = children
      .filter((a) => a.bucket !== 'PROJECT')
      .map((a) => ({ ...a }));
    service.commitEdit(compId, projectRemoved);
    const after = repo.read(COMPOSITIONS_KEY)[compId];
    assert.equal(after.plannedByBucket.PROJECT, 0);
    assert.ok(after.plannedByBucket.COMMUNICATION > 0);
    assert.ok(after.plannedByBucket.CI > 0);
  });

  test('preserves runtime state on unchanged (same-id + same-catalogEntryId) slots', () => {
    const { service, repo } = buildService();
    const proposed = seedComposition(service);
    const compId = proposed.composition.id;
    // Simulate runtime: accept, start first activity.
    service.accept(compId);
    const acts = repo.read(ACTIVITIES_KEY);
    const schedChildren = Object.values(acts).filter(
      (a) => a.compositionId === compId && a.state === 'SCHEDULED'
    );
    const firstRuntimeRow = {
      ...schedChildren[0],
      state: 'IN_PROGRESS',
      actualStartAt: '2026-04-22T10:00:00Z'
    };
    // Write the runtime state directly.
    const writeback = { ...acts, [firstRuntimeRow.id]: firstRuntimeRow };
    repo.write(ACTIVITIES_KEY, writeback);

    const all = Object.values(repo.read(ACTIVITIES_KEY)).filter(
      (a) => a.compositionId === compId
    );
    service.commitEdit(compId, all.map((a) => ({ ...a })));
    const afterRow = repo.read(ACTIVITIES_KEY)[firstRuntimeRow.id];
    assert.equal(afterRow.state, 'IN_PROGRESS');
    assert.equal(afterRow.actualStartAt, '2026-04-22T10:00:00Z');
  });
});

describe('ComposerService.commitEdit — CycleEdited event', () => {
  test('publishes CycleEdited with compositionId + userId + committedAt', () => {
    const { service, bus, repo } = buildService();
    const received = [];
    bus.subscribe(CycleEdited, (p) => received.push(p));
    const proposed = seedComposition(service);
    const compId = proposed.composition.id;
    const acts = repo.read(ACTIVITIES_KEY);
    const children = Object.values(acts).filter((a) => a.compositionId === compId);
    service.commitEdit(compId, children.map((a) => ({ ...a })));
    assert.equal(received.length, 1);
    assert.equal(received[0].compositionId, compId);
    assert.equal(received[0].userId, proposed.composition.userId);
    assert.equal(received[0].committedAt, NOW);
  });

  test('CycleEdited swaps[] describes swaps', () => {
    const { service, bus, repo } = buildService();
    const received = [];
    bus.subscribe(CycleEdited, (p) => received.push(p));
    const proposed = seedComposition(service);
    const compId = proposed.composition.id;
    const acts = repo.read(ACTIVITIES_KEY);
    const children = Object.values(acts).filter((a) => a.compositionId === compId);
    const deep = children.find((a) => a.bucket === 'PROJECT');
    const edited = children.map((a) =>
      a.id === deep.id ? { ...a, catalogEntryId: 'cat_new_entry' } : { ...a }
    );
    service.commitEdit(compId, edited);
    assert.equal(received.length, 1);
    assert.ok(Array.isArray(received[0].swaps));
    const swap = received[0].swaps.find((s) => s.slotActivityId === deep.id);
    assert.ok(swap);
    assert.equal(swap.fromCatalogEntryId, deep.catalogEntryId);
    assert.equal(swap.toCatalogEntryId, 'cat_new_entry');
  });

  test('CycleEdited swaps[] describes removes (toCatalogEntryId null)', () => {
    const { service, bus, repo } = buildService();
    const received = [];
    bus.subscribe(CycleEdited, (p) => received.push(p));
    const proposed = seedComposition(service);
    const compId = proposed.composition.id;
    const acts = repo.read(ACTIVITIES_KEY);
    const children = Object.values(acts).filter((a) => a.compositionId === compId);
    const removed = children.find((a) => a.bucket === 'PROJECT');
    const edited = children.filter((a) => a.id !== removed.id).map((a) => ({ ...a }));
    service.commitEdit(compId, edited);
    const swap = received[0].swaps.find((s) => s.slotActivityId === removed.id);
    assert.ok(swap);
    assert.equal(swap.toCatalogEntryId, null);
  });

  test('CycleEdited swaps[] describes adds (fromCatalogEntryId null)', () => {
    const { service, bus, repo } = buildService();
    const received = [];
    bus.subscribe(CycleEdited, (p) => received.push(p));
    const proposed = seedComposition(service);
    const compId = proposed.composition.id;
    const acts = repo.read(ACTIVITIES_KEY);
    const children = Object.values(acts).filter((a) => a.compositionId === compId);
    const addition = {
      id: 'sa_brand_new_add',
      catalogEntryId: 'cat_newly_added',
      name: 'Added',
      bucket: 'CI',
      plannedDurationMinutes: 30,
      state: 'PROPOSED'
    };
    service.commitEdit(compId, [...children.map((a) => ({ ...a })), addition]);
    const swap = received[0].swaps.find((s) => s.slotActivityId === 'sa_brand_new_add');
    assert.ok(swap);
    assert.equal(swap.fromCatalogEntryId, null);
    assert.equal(swap.toCatalogEntryId, 'cat_newly_added');
  });

  test('no-op edit still publishes CycleEdited exactly once', () => {
    const { service, bus, repo } = buildService();
    const received = [];
    bus.subscribe(CycleEdited, (p) => received.push(p));
    const proposed = seedComposition(service);
    const compId = proposed.composition.id;
    const acts = repo.read(ACTIVITIES_KEY);
    const children = Object.values(acts).filter((a) => a.compositionId === compId);
    service.commitEdit(compId, children.map((a) => ({ ...a })));
    assert.equal(received.length, 1);
  });
});

describe('ComposerService.commitEdit — atomicity', () => {
  test('returns the latest composition + live children on success', () => {
    const { service, repo } = buildService();
    const proposed = seedComposition(service);
    const compId = proposed.composition.id;
    const acts = repo.read(ACTIVITIES_KEY);
    const children = Object.values(acts).filter((a) => a.compositionId === compId);
    const result = service.commitEdit(compId, children.map((a) => ({ ...a })));
    assert.equal(result.composition.id, compId);
    assert.ok(Array.isArray(result.activities));
    assert.ok(result.activities.length >= children.length);
  });
});
