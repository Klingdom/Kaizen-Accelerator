/**
 * Tests for fullCatalog — unified catalog accessor (Sprint 5 P0-T1).
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  getFullCatalog,
  getCachedCatalog,
  __resetCache
} from '../../js/catalog/fullCatalog.js';
import { EXPECTED_CATALOG_SIZE } from '../../js/catalog/seed/index.js';

describe('fullCatalog — Node pipeline path', () => {
  beforeEach(() => {
    __resetCache();
  });

  test('getFullCatalog returns 60 entries', async () => {
    const catalog = await getFullCatalog();
    assert.equal(catalog.length, EXPECTED_CATALOG_SIZE);
    assert.equal(catalog.length, 60);
  });

  test('getFullCatalog is idempotent (returns same instance on second call)', async () => {
    const a = await getFullCatalog();
    const b = await getFullCatalog();
    assert.equal(a, b);
  });

  test('getCachedCatalog returns null before first load', () => {
    __resetCache();
    assert.equal(getCachedCatalog(), null);
  });

  test('getCachedCatalog returns the cached array after first load', async () => {
    await getFullCatalog();
    const cached = getCachedCatalog();
    assert.ok(Array.isArray(cached));
    assert.equal(cached.length, 60);
  });

  test('every entry has a bucket', async () => {
    const catalog = await getFullCatalog();
    const missing = catalog.filter((e) => !e.bucket);
    assert.deepEqual(missing, []);
  });

  test('every entry has an isNonOptional boolean', async () => {
    const catalog = await getFullCatalog();
    const bad = catalog.filter((e) => typeof e.isNonOptional !== 'boolean');
    assert.deepEqual(bad, []);
  });
});
