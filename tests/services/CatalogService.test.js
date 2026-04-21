/**
 * Tests for /js/services/CatalogService.js (E2-T9).
 *
 * Acceptance (from DELIVERY_PLAN §2 E2-T9):
 *   - list(userId)
 *   - toggleEnabled(id, userId) — rejects disable on non-optional
 *   - validateDag() — detects cycles + unresolved refs
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { CatalogService, CATALOG_KEY } from '../../js/services/CatalogService.js';
import { LocalStorageRepository } from '../../js/persistence/LocalStorageRepository.js';
import { LocalStorageMock } from '../_helpers/localStorageMock.js';
import { buildCatalog } from '../../js/catalog/seed/index.js';

function newService() {
  const storage = new LocalStorageMock();
  const repo = new LocalStorageRepository({ storage });
  return { service: new CatalogService({ repo }), repo, storage };
}

describe('CatalogService — seed + list', () => {
  test('seed persists a 60-entry catalog; list() returns all 60', () => {
    const { service } = newService();
    const catalog = buildCatalog();
    service.seed(catalog);
    const listed = service.list('u_phil');
    assert.equal(listed.length, catalog.length);
  });

  test('seed rejects invalid array input', () => {
    const { service } = newService();
    assert.throws(
      () => service.seed(null),
      (e) => e.name === 'INVALID_SEED'
    );
  });

  test('seed rejects duplicate ids', () => {
    const { service } = newService();
    const dup = [
      { id: 'a', dependsOn: [], isNonOptional: false, enabledByUser: true },
      { id: 'a', dependsOn: [], isNonOptional: false, enabledByUser: true }
    ];
    assert.throws(
      () => service.seed(dup),
      (e) => e.name === 'DUPLICATE_ID'
    );
  });

  test('seed rejects entry without a string id', () => {
    const { service } = newService();
    assert.throws(
      () => service.seed([{ name: 'nope', dependsOn: [] }]),
      (e) => e.name === 'INVALID_ENTRY'
    );
  });
});

describe('CatalogService.toggleEnabled', () => {
  test('toggles enabledByUser from true to false on an optional entry', () => {
    const { service } = newService();
    service.seed([
      { id: 'opt_a', dependsOn: [], isNonOptional: false, enabledByUser: true },
      { id: 'opt_b', dependsOn: [], isNonOptional: false, enabledByUser: true }
    ]);
    const updated = service.toggleEnabled('opt_a', 'u_phil');
    assert.equal(updated.enabledByUser, false);
    const again = service.toggleEnabled('opt_a', 'u_phil');
    assert.equal(again.enabledByUser, true);
  });

  test('rejects disable on non-optional entry (NON_OPTIONAL_DISABLE)', () => {
    const { service } = newService();
    service.seed([
      { id: 'lock_a', dependsOn: [], isNonOptional: true, enabledByUser: true }
    ]);
    assert.throws(
      () => service.toggleEnabled('lock_a', 'u_phil'),
      (e) => e.name === 'NON_OPTIONAL_DISABLE'
    );
  });

  test('allows re-enabling a non-optional entry (flip to true always ok)', () => {
    const { service } = newService();
    service.seed([
      { id: 'lock_a', dependsOn: [], isNonOptional: true, enabledByUser: false }
    ]);
    const updated = service.toggleEnabled('lock_a', 'u_phil');
    assert.equal(updated.enabledByUser, true);
  });

  test('throws ENTRY_NOT_FOUND for an unknown id', () => {
    const { service } = newService();
    service.seed([]);
    assert.throws(
      () => service.toggleEnabled('nope', 'u_phil'),
      (e) => e.name === 'ENTRY_NOT_FOUND'
    );
  });

  test('persists the toggle — repo read reflects the change', () => {
    const { service, repo } = newService();
    service.seed([
      { id: 'opt_a', dependsOn: [], isNonOptional: false, enabledByUser: true }
    ]);
    service.toggleEnabled('opt_a', 'u_phil');
    const stored = repo.read(CATALOG_KEY);
    assert.equal(stored.opt_a.enabledByUser, false);
  });
});

describe('CatalogService.validateDag — cycle detection', () => {
  test('full seeded catalog has no cycles', () => {
    const { service } = newService();
    const catalog = buildCatalog();
    const result = service.validateDag(catalog);
    assert.equal(result.ok, true);
  });

  test('detects a 2-node cycle a → b → a', () => {
    const { service } = newService();
    const cycleCat = [
      { id: 'a', dependsOn: ['b'], isNonOptional: false, enabledByUser: true },
      { id: 'b', dependsOn: ['a'], isNonOptional: false, enabledByUser: true }
    ];
    const result = service.validateDag(cycleCat);
    assert.equal(result.ok, false);
    assert.ok(Array.isArray(result.cycle));
    assert.ok(result.cycle.length >= 2);
  });

  test('detects a 3-node cycle a → b → c → a', () => {
    const { service } = newService();
    const cycleCat = [
      { id: 'a', dependsOn: ['b'] },
      { id: 'b', dependsOn: ['c'] },
      { id: 'c', dependsOn: ['a'] }
    ];
    const result = service.validateDag(cycleCat);
    assert.equal(result.ok, false);
  });

  test('seed() throws DAG_CYCLE when seeding a cyclic catalog', () => {
    const { service } = newService();
    const bad = [
      { id: 'x', dependsOn: ['y'], isNonOptional: false, enabledByUser: true },
      { id: 'y', dependsOn: ['x'], isNonOptional: false, enabledByUser: true }
    ];
    assert.throws(
      () => service.seed(bad),
      (e) => e.name === 'DAG_CYCLE'
    );
  });

  test('detects unresolved dependsOn reference', () => {
    const { service } = newService();
    const dangling = [{ id: 'x', dependsOn: ['does_not_exist'] }];
    assert.throws(
      () => service.validateDag(dangling),
      (e) => e.name === 'DAG_UNRESOLVED_REF'
    );
  });

  test('validateDag reads from repo when no catalog argument passed', () => {
    const { service } = newService();
    service.seed([
      { id: 'a', dependsOn: [], isNonOptional: false, enabledByUser: true },
      { id: 'b', dependsOn: ['a'], isNonOptional: false, enabledByUser: true }
    ]);
    const result = service.validateDag();
    assert.equal(result.ok, true);
  });
});

describe('CatalogService — constructor', () => {
  test('throws on missing repo', () => {
    assert.throws(
      () => new CatalogService({}),
      (e) => e.name === 'INVALID_DEPS'
    );
  });
});
