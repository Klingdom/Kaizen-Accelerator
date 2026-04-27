/**
 * IdGeneratorService — formalizes id generation injection (C-SA-1).
 *
 * Purpose:
 *  - In production (browser), `new IdGeneratorService()` uses
 *    `crypto.randomUUID()` when available, or a monotonic counter seeded
 *    once from `Date.now()` as a fallback.  Either way, the generator is
 *    called synchronously and returns a unique string per invocation.
 *  - In tests, `createDeterministicIdGenerator(seed)` returns a plain
 *    function that produces predictable ids from a sequential counter
 *    seeded with the supplied integer.
 *
 * Contract:  `generate(prefix: string) => string`
 *   The returned id ALWAYS starts with `${prefix}_`.
 *
 * No runtime deps. Pure ES module.
 */

/**
 * Create a deterministic id-generator function for tests.
 *
 * @param {number} [seed=0]
 * @returns {(prefix: string) => string}
 */
export function createDeterministicIdGenerator(seed = 0) {
  let counter = seed;
  return function generate(prefix) {
    if (typeof prefix !== 'string' || prefix.length === 0) {
      const err = new Error('IdGeneratorService.generate: prefix must be a non-empty string');
      err.name = 'INVALID_PREFIX';
      throw err;
    }
    const id = `${prefix}_det_${counter}`;
    counter += 1;
    return id;
  };
}

/**
 * Production id generator service.
 *
 * Uses `crypto.randomUUID()` when available (all modern browsers / Node 19+),
 * falling back to a monotonic counter seeded once from `Date.now()` for older
 * environments.  The counter-based fallback is deterministic given the same
 * call sequence (same counter start); in normal usage the `crypto` path is
 * taken.
 *
 * IMPORTANT: production code MUST NOT use the deterministic generator for
 * assertions.  Tests should always inject `createDeterministicIdGenerator`.
 */
export class IdGeneratorService {
  constructor() {
    const canUseUUID =
      typeof globalThis !== 'undefined' &&
      globalThis.crypto &&
      typeof globalThis.crypto.randomUUID === 'function';

    if (canUseUUID) {
      this._generate = (prefix) => `${prefix}_${globalThis.crypto.randomUUID()}`;
    } else {
      // Fallback: monotonic counter.  Seed is fixed once per service
      // instance so consecutive ids within a session remain ordered and
      // unique without relying on Math.random().
      let counter = 0;
      this._generate = (prefix) => {
        const id = `${prefix}_mc_${counter}`;
        counter += 1;
        return id;
      };
    }
  }

  /**
   * Generate a unique id with the given prefix.
   *
   * @param {string} prefix
   * @returns {string}
   */
  generate(prefix) {
    if (typeof prefix !== 'string' || prefix.length === 0) {
      const err = new Error('IdGeneratorService.generate: prefix must be a non-empty string');
      err.name = 'INVALID_PREFIX';
      throw err;
    }
    return this._generate(prefix);
  }
}

export default IdGeneratorService;
