/**
 * Tests for /js/persistence/LocalStorageRepository.js (E1-T4).
 *
 * Uses the in-memory `LocalStorageMock` in /tests/_helpers/localStorageMock.js
 * via constructor dependency injection — no monkey-patching of
 * globalThis.localStorage.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { LocalStorageRepository, KEY_PREFIX } from '../../js/persistence/LocalStorageRepository.js';
import { LocalStorageMock } from '../_helpers/localStorageMock.js';
import { assertRepository } from '../../js/persistence/IRepository.js';

/**
 * Build a fresh (mock, repo) pair so every test starts from empty state.
 * @returns {{ mock: LocalStorageMock, repo: LocalStorageRepository }}
 */
function freshRepo() {
  const mock = new LocalStorageMock();
  const repo = new LocalStorageRepository({ storage: mock });
  return { mock, repo };
}

describe('LocalStorageRepository — construction', () => {
  test('throws if no storage injected and globalThis.localStorage absent', () => {
    const originalLS = globalThis.localStorage;
    try {
      // @ts-ignore — deliberately undefine
      delete globalThis.localStorage;
      assert.throws(
        () => new LocalStorageRepository({}),
        (e) => e.name === 'NO_STORAGE_AVAILABLE'
      );
    } finally {
      if (originalLS) globalThis.localStorage = originalLS;
    }
  });

  test('KEY_PREFIX is the spec-required bamx:v1: prefix', () => {
    assert.equal(KEY_PREFIX, 'bamx:v1:');
  });

  test('satisfies the IRepository contract', () => {
    const { repo } = freshRepo();
    assertRepository(repo);            // core methods
    assertRepository(repo, { strict: true }); // +exportAll/importAll
  });
});

describe('LocalStorageRepository — read/write basics', () => {
  test('read on missing key returns null', () => {
    const { repo } = freshRepo();
    assert.equal(repo.read('bamx:v1:user'), null);
  });

  test('write then read round-trips primitives and nested shapes', () => {
    const { repo } = freshRepo();
    const obj = {
      s: 'hello',
      n: 42,
      b: true,
      nil: null,
      arr: [1, 2, { inner: 'x' }],
      nested: { a: [true, false] }
    };
    repo.write('bamx:v1:user', obj);
    assert.deepEqual(repo.read('bamx:v1:user'), obj);
  });

  test('JSON round-trip preserves ISO Date strings (Date → string convention)', () => {
    const { repo } = freshRepo();
    const iso = '2026-04-18T12:34:56.000Z';
    repo.write('bamx:v1:meta', { createdAt: iso });
    const got = repo.read('bamx:v1:meta');
    assert.equal(got.createdAt, iso);
    assert.equal(typeof got.createdAt, 'string');
  });

  test('write rejects undefined values (INVALID_VALUE)', () => {
    const { repo } = freshRepo();
    assert.throws(
      () => repo.write('bamx:v1:user', undefined),
      (e) => e.name === 'INVALID_VALUE'
    );
  });

  test('key without bamx:v1: prefix rejected (INVALID_KEY_PREFIX)', () => {
    const { repo } = freshRepo();
    assert.throws(
      () => repo.write('user', { x: 1 }),
      (e) => e.name === 'INVALID_KEY_PREFIX'
    );
    assert.throws(
      () => repo.read('user'),
      (e) => e.name === 'INVALID_KEY_PREFIX'
    );
  });

  test('corrupt JSON read throws CORRUPT_STORAGE', () => {
    const { mock, repo } = freshRepo();
    mock.setItem('bamx:v1:compositions', '{not json');
    assert.throws(
      () => repo.read('bamx:v1:compositions'),
      (e) => e.name === 'CORRUPT_STORAGE'
    );
  });
});

describe('LocalStorageRepository — upsert', () => {
  test('upsert inserts into an empty map', () => {
    const { repo } = freshRepo();
    repo.upsert('bamx:v1:catalog', 'ce_1', { id: 'ce_1', name: 'A' });
    assert.deepEqual(repo.read('bamx:v1:catalog'), {
      ce_1: { id: 'ce_1', name: 'A' }
    });
  });

  test('upsert overwrites an existing id', () => {
    const { repo } = freshRepo();
    repo.upsert('bamx:v1:catalog', 'ce_1', { id: 'ce_1', name: 'A' });
    repo.upsert('bamx:v1:catalog', 'ce_1', { id: 'ce_1', name: 'A prime' });
    assert.equal(repo.read('bamx:v1:catalog').ce_1.name, 'A prime');
  });

  test('upsert with empty id rejected (INVALID_ID)', () => {
    const { repo } = freshRepo();
    assert.throws(
      () => repo.upsert('bamx:v1:catalog', '', { x: 1 }),
      (e) => e.name === 'INVALID_ID'
    );
  });
});

describe('LocalStorageRepository — appendOnly', () => {
  test('appendOnly inserts then rejects duplicate with APPEND_ONLY_VIOLATION', () => {
    const { repo } = freshRepo();
    repo.appendOnly('bamx:v1:variances', 'v_1', { id: 'v_1', kind: 'OVERRAN' });
    assert.throws(
      () => repo.appendOnly('bamx:v1:variances', 'v_1', { id: 'v_1', kind: 'UNDERRAN' }),
      (e) => e.name === 'APPEND_ONLY_VIOLATION'
    );
    // Original row unchanged.
    assert.equal(repo.read('bamx:v1:variances').v_1.kind, 'OVERRAN');
  });

  test('appendOnly allows many distinct ids', () => {
    const { repo } = freshRepo();
    for (let i = 0; i < 5; i++) {
      repo.appendOnly('bamx:v1:variances', `v_${i}`, { id: `v_${i}` });
    }
    assert.equal(Object.keys(repo.read('bamx:v1:variances')).length, 5);
  });

  test('appendOnly with empty id rejected (INVALID_ID)', () => {
    const { repo } = freshRepo();
    assert.throws(
      () => repo.appendOnly('bamx:v1:variances', '', { x: 1 }),
      (e) => e.name === 'INVALID_ID'
    );
  });
});

describe('LocalStorageRepository — exportAll / importAll', () => {
  test('exportAll snapshots every bamx:v1:* key', () => {
    const { repo, mock } = freshRepo();
    repo.write('bamx:v1:user', { id: 'u1' });
    repo.upsert('bamx:v1:catalog', 'c1', { id: 'c1' });
    // A key without the prefix — directly poke the mock — must be ignored.
    mock.setItem('other:foreign', '{"nope": true}');
    const blob = repo.exportAll();
    assert.deepEqual(Object.keys(blob).sort(), ['bamx:v1:catalog', 'bamx:v1:user']);
  });

  test('importAll replaces every bamx:v1:* key', () => {
    const { repo } = freshRepo();
    repo.write('bamx:v1:user', { id: 'u1' });
    repo.importAll({ 'bamx:v1:user': { id: 'u2' } });
    assert.deepEqual(repo.read('bamx:v1:user'), { id: 'u2' });
  });

  test('importAll round-trips an exportAll snapshot', () => {
    const a = new LocalStorageRepository({ storage: new LocalStorageMock() });
    a.write('bamx:v1:meta', { schemaVersion: 1, createdAt: '2026-04-18T00:00:00.000Z', lastMigratedAt: null });
    a.upsert('bamx:v1:catalog', 'ce_1', { id: 'ce_1', name: 'X' });
    a.appendOnly('bamx:v1:variances', 'v_1', { id: 'v_1', kind: 'OVERRAN' });

    const blob = a.exportAll();
    const b = new LocalStorageRepository({ storage: new LocalStorageMock() });
    b.importAll(blob);

    assert.deepEqual(b.exportAll(), blob);
  });

  test('importAll rejects non-object blob (INVALID_BLOB)', () => {
    const { repo } = freshRepo();
    assert.throws(
      () => repo.importAll(null),
      (e) => e.name === 'INVALID_BLOB'
    );
  });
});
