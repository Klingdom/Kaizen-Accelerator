/**
 * In-memory localStorage mock for Node tests.
 *
 * Implements the Web Storage surface `LocalStorageRepository` consumes:
 *   getItem, setItem, removeItem, length, key(i).
 *
 * We DO NOT assign this to `globalThis.localStorage`. Instead, tests
 * instantiate a mock and inject it into the repository via constructor DI,
 * per the Sprint-1 hard rule against module-level monkey-patching.
 */

export class LocalStorageMock {
  constructor() {
    /** @type {Map<string, string>} */
    this._store = new Map();
  }

  get length() {
    return this._store.size;
  }

  /**
   * @param {number} index
   * @returns {string | null}
   */
  key(index) {
    if (index < 0 || index >= this._store.size) return null;
    let i = 0;
    for (const k of this._store.keys()) {
      if (i === index) return k;
      i++;
    }
    return null;
  }

  /**
   * @param {string} key
   * @returns {string | null}
   */
  getItem(key) {
    return this._store.has(key) ? this._store.get(key) : null;
  }

  /**
   * @param {string} key
   * @param {string} value
   */
  setItem(key, value) {
    // Match the real Storage spec: coerce to string.
    this._store.set(String(key), String(value));
  }

  /**
   * @param {string} key
   */
  removeItem(key) {
    this._store.delete(key);
  }

  clear() {
    this._store.clear();
  }
}

export default LocalStorageMock;
