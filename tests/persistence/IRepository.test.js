/**
 * Tests for /js/persistence/IRepository.js (E1-T5).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  assertRepository,
  REQUIRED_METHODS,
  CORE_METHODS
} from '../../js/persistence/IRepository.js';
import { LocalStorageRepository } from '../../js/persistence/LocalStorageRepository.js';
import { LocalStorageMock } from '../_helpers/localStorageMock.js';

describe('assertRepository', () => {
  test('passes on LocalStorageRepository (core + strict)', () => {
    const repo = new LocalStorageRepository({ storage: new LocalStorageMock() });
    assertRepository(repo);
    assertRepository(repo, { strict: true });
  });

  test('fails on plain empty object (NOT_A_REPOSITORY)', () => {
    assert.throws(
      () => assertRepository({}),
      (e) => e.name === 'NOT_A_REPOSITORY'
    );
  });

  test('fails on null / undefined / primitives', () => {
    for (const bad of [null, undefined, 42, 'repo']) {
      assert.throws(
        () => assertRepository(bad),
        (e) => e.name === 'NOT_A_REPOSITORY',
        `should reject ${bad}`
      );
    }
  });

  test('strict mode rejects a repo missing exportAll/importAll', () => {
    const partial = {
      read() {},
      write() {},
      upsert() {},
      appendOnly() {}
    };
    // Core passes.
    assertRepository(partial);
    // Strict fails and the error carries the missing list.
    assert.throws(
      () => assertRepository(partial, { strict: true }),
      (e) => {
        assert.equal(e.name, 'NOT_A_REPOSITORY');
        assert.deepEqual(e.missing.sort(), ['exportAll', 'importAll']);
        return true;
      }
    );
  });

  test('REQUIRED_METHODS + CORE_METHODS are frozen lists', () => {
    assert.ok(Object.isFrozen(REQUIRED_METHODS));
    assert.ok(Object.isFrozen(CORE_METHODS));
    assert.deepEqual(CORE_METHODS, ['read', 'write', 'upsert', 'appendOnly']);
    assert.deepEqual(
      REQUIRED_METHODS,
      ['read', 'write', 'upsert', 'appendOnly', 'exportAll', 'importAll']
    );
  });
});
