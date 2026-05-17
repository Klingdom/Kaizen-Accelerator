/**
 * Tests for js/services/UserPreferencesService.js — Iter 39 Phase 1.
 *
 * AC4: load / save / getDefaults pure tests.
 * AC5: localStorage key bamx.userPreferences.v1.
 * AC8: dark mode token override.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  load,
  save,
  getDefaults,
  USER_PREFS_KEY
} from '../../js/services/UserPreferencesService.js';

// ---------------------------------------------------------------------------
// Minimal in-memory storage stub (avoids LocalStorageRepository prefix guard)
// ---------------------------------------------------------------------------
function makeStorage() {
  const _store = new Map();
  return {
    getItem: (k) => _store.has(k) ? _store.get(k) : null,
    setItem: (k, v) => _store.set(String(k), String(v)),
    removeItem: (k) => _store.delete(k),
    get length() { return _store.size; },
    key: (i) => [..._store.keys()][i] ?? null,
    _store
  };
}

// ---------------------------------------------------------------------------
// getDefaults
// ---------------------------------------------------------------------------
describe('UserPreferencesService.getDefaults', () => {
  test('returns object with themeId=system, motion=full, schemaVersion=v1', () => {
    const d = getDefaults();
    assert.equal(d.themeId, 'system');
    assert.equal(d.motion, 'full');
    assert.equal(d.schemaVersion, 'v1');
  });

  test('returns a fresh object each call', () => {
    const a = getDefaults();
    const b = getDefaults();
    assert.notEqual(a, b);
  });

  test('returned object has exactly 3 keys', () => {
    const d = getDefaults();
    assert.deepEqual(Object.keys(d).sort(), ['motion', 'schemaVersion', 'themeId']);
  });
});

// ---------------------------------------------------------------------------
// USER_PREFS_KEY
// ---------------------------------------------------------------------------
describe('UserPreferencesService — constants', () => {
  test('USER_PREFS_KEY is bamx.userPreferences.v1 (AC5)', () => {
    assert.equal(USER_PREFS_KEY, 'bamx.userPreferences.v1');
  });
});

// ---------------------------------------------------------------------------
// load — first-run (no stored value)
// ---------------------------------------------------------------------------
describe('UserPreferencesService.load — first-run', () => {
  test('returns defaults when storage is empty (AC16)', () => {
    const storage = makeStorage();
    const prefs = load(storage);
    assert.deepEqual(prefs, getDefaults());
  });

  test('returns defaults when repository is null', () => {
    const prefs = load(null);
    assert.deepEqual(prefs, getDefaults());
  });

  test('returns defaults when repository is undefined', () => {
    const prefs = load(undefined);
    assert.deepEqual(prefs, getDefaults());
  });
});

// ---------------------------------------------------------------------------
// save + load round-trip
// ---------------------------------------------------------------------------
describe('UserPreferencesService.save + load round-trip', () => {
  test('saves and reloads themeId=dark', () => {
    const storage = makeStorage();
    save({ themeId: 'dark', motion: 'full', schemaVersion: 'v1' }, storage);
    const loaded = load(storage);
    assert.equal(loaded.themeId, 'dark');
    assert.equal(loaded.motion, 'full');
    assert.equal(loaded.schemaVersion, 'v1');
  });

  test('saves and reloads themeId=light, motion=reduced', () => {
    const storage = makeStorage();
    save({ themeId: 'light', motion: 'reduced', schemaVersion: 'v1' }, storage);
    const loaded = load(storage);
    assert.equal(loaded.themeId, 'light');
    assert.equal(loaded.motion, 'reduced');
  });

  test('saves and reloads themeId=system', () => {
    const storage = makeStorage();
    save({ themeId: 'system', motion: 'full', schemaVersion: 'v1' }, storage);
    const loaded = load(storage);
    assert.equal(loaded.themeId, 'system');
  });

  test('key written to storage matches USER_PREFS_KEY', () => {
    const storage = makeStorage();
    save({ themeId: 'dark', motion: 'reduced', schemaVersion: 'v1' }, storage);
    assert.ok(storage._store.has(USER_PREFS_KEY), 'key should be stored at USER_PREFS_KEY');
  });

  test('stored value is valid JSON', () => {
    const storage = makeStorage();
    save({ themeId: 'dark', motion: 'full', schemaVersion: 'v1' }, storage);
    const raw = storage.getItem(USER_PREFS_KEY);
    assert.doesNotThrow(() => JSON.parse(raw));
    const parsed = JSON.parse(raw);
    assert.equal(parsed.themeId, 'dark');
  });
});

// ---------------------------------------------------------------------------
// load — invalid stored values fall back to defaults
// ---------------------------------------------------------------------------
describe('UserPreferencesService.load — invalid stored values', () => {
  test('invalid themeId falls back to system', () => {
    const storage = makeStorage();
    storage.setItem(USER_PREFS_KEY, JSON.stringify({ themeId: 'NEON', motion: 'full', schemaVersion: 'v1' }));
    const loaded = load(storage);
    assert.equal(loaded.themeId, 'system');
    assert.equal(loaded.motion, 'full');
  });

  test('invalid motion falls back to full', () => {
    const storage = makeStorage();
    storage.setItem(USER_PREFS_KEY, JSON.stringify({ themeId: 'dark', motion: 'STROBE', schemaVersion: 'v1' }));
    const loaded = load(storage);
    assert.equal(loaded.motion, 'full');
    assert.equal(loaded.themeId, 'dark');
  });

  test('corrupt JSON falls back to defaults', () => {
    const storage = makeStorage();
    storage.setItem(USER_PREFS_KEY, 'not-valid-json{{{{');
    const loaded = load(storage);
    assert.deepEqual(loaded, getDefaults());
  });

  test('stored null falls back to defaults', () => {
    const storage = makeStorage();
    storage.setItem(USER_PREFS_KEY, 'null');
    const loaded = load(storage);
    assert.deepEqual(loaded, getDefaults());
  });
});

// ---------------------------------------------------------------------------
// save — guards against invalid inputs
// ---------------------------------------------------------------------------
describe('UserPreferencesService.save — guards', () => {
  test('invalid themeId is coerced to system', () => {
    const storage = makeStorage();
    save({ themeId: 'INVALID', motion: 'full', schemaVersion: 'v1' }, storage);
    const raw = storage.getItem(USER_PREFS_KEY);
    const parsed = JSON.parse(raw);
    assert.equal(parsed.themeId, 'system');
  });

  test('invalid motion is coerced to full', () => {
    const storage = makeStorage();
    save({ themeId: 'dark', motion: 'INVALID', schemaVersion: 'v1' }, storage);
    const raw = storage.getItem(USER_PREFS_KEY);
    const parsed = JSON.parse(raw);
    assert.equal(parsed.motion, 'full');
  });

  test('null prefs is a no-op (does not throw)', () => {
    const storage = makeStorage();
    assert.doesNotThrow(() => save(null, storage));
    assert.equal(storage.getItem(USER_PREFS_KEY), null);
  });

  test('null repository is a no-op (does not throw)', () => {
    assert.doesNotThrow(() => save({ themeId: 'dark', motion: 'full', schemaVersion: 'v1' }, null));
  });
});

// ---------------------------------------------------------------------------
// Integration with LocalStorageRepository via _storage fallback
// ---------------------------------------------------------------------------
describe('UserPreferencesService — LocalStorageRepository integration', () => {
  test('load via _storage fallback when repo.read throws on non-prefixed key', async () => {
    const { LocalStorageRepository } = await import('../../js/persistence/LocalStorageRepository.js');
    const { LocalStorageMock } = await import('../_helpers/localStorageMock.js');
    const storage = new LocalStorageMock();
    const repo = new LocalStorageRepository({ storage });

    // Pre-seed the storage mock with prefs at the dot-key.
    storage.setItem(USER_PREFS_KEY, JSON.stringify({ themeId: 'light', motion: 'reduced', schemaVersion: 'v1' }));

    const loaded = load(repo);
    assert.equal(loaded.themeId, 'light');
    assert.equal(loaded.motion, 'reduced');
  });

  test('save via _storage fallback when repo.write throws on non-prefixed key', async () => {
    const { LocalStorageRepository } = await import('../../js/persistence/LocalStorageRepository.js');
    const { LocalStorageMock } = await import('../_helpers/localStorageMock.js');
    const storage = new LocalStorageMock();
    const repo = new LocalStorageRepository({ storage });

    save({ themeId: 'dark', motion: 'reduced', schemaVersion: 'v1' }, repo);

    const raw = storage.getItem(USER_PREFS_KEY);
    assert.ok(raw, 'value should be stored');
    const parsed = JSON.parse(raw);
    assert.equal(parsed.themeId, 'dark');
    assert.equal(parsed.motion, 'reduced');
  });
});
