/**
 * LocalStorageRepository — MVP persistence (E1-T4).
 *
 * Implements the IRepository contract in `./IRepository.js`.
 * All keys use the `bamx:v1:` prefix per ARCHITECTURE §7.1.
 *
 * Browser/Node portable: reads `globalThis.localStorage` by default but
 * accepts an injected `storage` (any object with `getItem`, `setItem`,
 * `removeItem`, and an iterable `key(i)` + `length` surface) via the
 * constructor. Node tests pass the in-memory mock in
 * `/tests/_helpers/localStorageMock.js`.
 */

import { REQUIRED_METHODS } from './IRepository.js';

/** All bamx:v1:* keys share this prefix per ARCHITECTURE §7.1. */
export const KEY_PREFIX = 'bamx:v1:';

/**
 * Throws a named Error. Pattern used throughout the module so tests can
 * assert on `err.name` rather than message strings.
 *
 * @param {string} name
 * @param {string} message
 * @param {object} [detail]
 * @returns {never}
 */
function fail(name, message, detail) {
  const err = new Error(message);
  err.name = name;
  if (detail) Object.assign(err, detail);
  throw err;
}

/**
 * Minimum storage surface we rely on. `localStorage` satisfies this in the
 * browser; tests inject an in-memory mock that satisfies the same shape.
 *
 * @typedef {object} StorageLike
 * @property {(key: string) => string | null} getItem
 * @property {(key: string, value: string) => void} setItem
 * @property {(key: string) => void} removeItem
 * @property {number} length
 * @property {(index: number) => string | null} key
 */

export class LocalStorageRepository {
  /**
   * @param {{storage?: StorageLike, prefix?: string}} [opts]
   */
  constructor({ storage, prefix = KEY_PREFIX } = {}) {
    /** @type {StorageLike} */
    this._storage = storage ?? /** @type {any} */ (globalThis.localStorage);
    if (!this._storage || typeof this._storage.getItem !== 'function') {
      fail(
        'NO_STORAGE_AVAILABLE',
        'LocalStorageRepository: no storage injected and globalThis.localStorage is unavailable'
      );
    }
    this._prefix = prefix;
  }

  /**
   * Enforce the bamx:v1:* prefix. Keys without the prefix throw so typos
   * don't silently land in a cousin key and violate the port-compat rule.
   *
   * @param {string} key
   */
  _requirePrefix(key) {
    if (typeof key !== 'string' || !key.startsWith(this._prefix)) {
      fail(
        'INVALID_KEY_PREFIX',
        `LocalStorageRepository: key must start with '${this._prefix}', got '${key}'`
      );
    }
  }

  /**
   * Read and JSON-parse the stored value at `key`.
   * Returns `null` when the key is absent or contains the literal 'null'.
   *
   * @param {string} key
   * @returns {any}
   */
  read(key) {
    this._requirePrefix(key);
    const raw = this._storage.getItem(key);
    if (raw === null || raw === undefined) return null;
    try {
      return JSON.parse(raw);
    } catch (err) {
      fail(
        'CORRUPT_STORAGE',
        `LocalStorageRepository.read('${key}'): JSON parse failed — ${err.message}`,
        { key, raw }
      );
    }
  }

  /**
   * JSON-stringify and write `value` at `key`.
   *
   * `undefined` is rejected explicitly — `JSON.stringify(undefined)` returns
   * `undefined` (not 'null'), which would wipe the key on `setItem`. Callers
   * should pass `null` for intentionally-empty values.
   *
   * @param {string} key
   * @param {any} value
   */
  write(key, value) {
    this._requirePrefix(key);
    if (value === undefined) {
      fail(
        'INVALID_VALUE',
        `LocalStorageRepository.write('${key}'): value must not be undefined (use null)`
      );
    }
    const serialized = JSON.stringify(value);
    this._storage.setItem(key, serialized);
  }

  /**
   * Insert-or-overwrite `obj` at `id` inside the keyed map at `mapKey`.
   *
   * @param {string} mapKey
   * @param {string} id
   * @param {any} obj
   */
  upsert(mapKey, id, obj) {
    this._requirePrefix(mapKey);
    if (typeof id !== 'string' || id.length === 0) {
      fail('INVALID_ID', `LocalStorageRepository.upsert: id must be a non-empty string`);
    }
    const map = this.read(mapKey) ?? {};
    map[id] = obj;
    this.write(mapKey, map);
  }

  /**
   * Insert `obj` at `id` in the keyed map at `mapKey`. Throws
   * APPEND_ONLY_VIOLATION if the id already exists.
   *
   * Used for `bamx:v1:variances` per ARCHITECTURE §7.1 + §2.7.
   *
   * @param {string} mapKey
   * @param {string} id
   * @param {any} obj
   */
  appendOnly(mapKey, id, obj) {
    this._requirePrefix(mapKey);
    if (typeof id !== 'string' || id.length === 0) {
      fail('INVALID_ID', `LocalStorageRepository.appendOnly: id must be a non-empty string`);
    }
    const map = this.read(mapKey) ?? {};
    if (Object.prototype.hasOwnProperty.call(map, id)) {
      fail(
        'APPEND_ONLY_VIOLATION',
        `LocalStorageRepository.appendOnly: id '${id}' already exists in '${mapKey}'`,
        { mapKey, id }
      );
    }
    map[id] = obj;
    this.write(mapKey, map);
  }

  /**
   * Snapshot every bamx:v1:* key currently in storage. Sprint-2/E12 stub —
   * the full export/import round-trip lands with E12-T4.
   *
   * @returns {Record<string, any>}
   */
  exportAll() {
    /** @type {Record<string, any>} */
    const out = {};
    const len = this._storage.length || 0;
    for (let i = 0; i < len; i++) {
      const k = this._storage.key(i);
      if (k !== null && k !== undefined && k.startsWith(this._prefix)) {
        out[k] = this.read(k);
      }
    }
    return out;
  }

  /**
   * Replace every bamx:v1:* key with the contents of `blob`. Keys not in
   * `blob` are cleared. Sprint-2/E12 stub.
   *
   * @param {Record<string, any>} blob
   */
  importAll(blob) {
    if (blob === null || typeof blob !== 'object') {
      fail('INVALID_BLOB', 'LocalStorageRepository.importAll: blob must be an object');
    }
    // Wipe current bamx:v1:* keys.
    const currentKeys = [];
    const len = this._storage.length || 0;
    for (let i = 0; i < len; i++) {
      const k = this._storage.key(i);
      if (k !== null && k !== undefined && k.startsWith(this._prefix)) {
        currentKeys.push(k);
      }
    }
    for (const k of currentKeys) this._storage.removeItem(k);
    for (const [k, v] of Object.entries(blob)) {
      this._requirePrefix(k);
      this.write(k, v);
    }
  }
}

// Compile-time sanity: verify the class declares every required method.
// Runs once at module load; cheap.
for (const m of REQUIRED_METHODS) {
  if (typeof LocalStorageRepository.prototype[m] !== 'function') {
    throw new Error(
      `LocalStorageRepository is missing required IRepository method: ${m}`
    );
  }
}

export default LocalStorageRepository;
