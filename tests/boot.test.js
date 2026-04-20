/**
 * Tests for /js/boot.js (E1-T6).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { boot, META_KEY, CURRENT_SCHEMA_VERSION } from '../js/boot.js';
import { LocalStorageRepository } from '../js/persistence/LocalStorageRepository.js';
import { LocalStorageMock } from './_helpers/localStorageMock.js';

function freshRepo() {
  return new LocalStorageRepository({ storage: new LocalStorageMock() });
}

describe('boot', () => {
  test('first call creates meta with schemaVersion=1 and ISO createdAt', () => {
    const repo = freshRepo();
    const fixedNow = new Date('2026-04-18T12:00:00.000Z');
    const meta = boot(repo, { now: () => fixedNow });

    assert.equal(meta.schemaVersion, CURRENT_SCHEMA_VERSION);
    assert.equal(meta.schemaVersion, 1);
    assert.equal(meta.createdAt, '2026-04-18T12:00:00.000Z');
    assert.equal(meta.lastMigratedAt, null);

    // Meta row persists to the repo under the spec key.
    assert.deepEqual(repo.read(META_KEY), meta);
  });

  test('subsequent call reads the same meta unchanged', () => {
    const repo = freshRepo();
    const firstNow = new Date('2026-04-18T12:00:00.000Z');
    const first = boot(repo, { now: () => firstNow });

    const secondNow = new Date('2027-01-01T00:00:00.000Z');
    const second = boot(repo, { now: () => secondNow });

    // Same object content — createdAt is NOT refreshed on the second call.
    assert.deepEqual(second, first);
    assert.equal(second.createdAt, '2026-04-18T12:00:00.000Z');
  });

  test('META_KEY is the spec-required path', () => {
    assert.equal(META_KEY, 'bamx:v1:meta');
  });

  test('rejects on a non-repository input (NOT_A_REPOSITORY)', () => {
    assert.throws(
      () => boot({}),
      (e) => e.name === 'NOT_A_REPOSITORY'
    );
  });

  test('detects corrupt meta (CORRUPT_META)', () => {
    const repo = freshRepo();
    // Write a malformed meta row directly.
    repo.write(META_KEY, { schemaVersion: 'nope' });
    assert.throws(
      () => boot(repo),
      (e) => e.name === 'CORRUPT_META'
    );
  });
});
