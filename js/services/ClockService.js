/**
 * ClockService — formalizes `_now` injection (Sprint 4 handoff).
 *
 * Purpose:
 *  - In production (browser), `new ClockService()` returns a service whose
 *    `now()` method returns the real current ISO timestamp.
 *  - In tests, `new ClockService({ now: () => '2026-04-20T09:00:00Z' })`
 *    returns a frozen clock — every call to `.now()` returns the same string.
 *
 * All Sprint 4+ services that need a timestamp MUST receive a `clock`
 * dependency and MUST NOT call `new Date().toISOString()` directly. This
 * makes event emissions and domain state changes deterministic under test.
 *
 * No runtime deps. Pure ES module.
 */

/**
 * @typedef {object} ClockServiceOptions
 * @property {() => (string | Date)} [now]
 *   Factory returning either an ISO string or a Date. If absent, the service
 *   returns real wall-clock time.
 */

export class ClockService {
  /**
   * @param {ClockServiceOptions} [opts]
   */
  constructor(opts = {}) {
    if (opts && typeof opts.now !== 'undefined' && typeof opts.now !== 'function') {
      const err = new Error('ClockService: `now` option must be a function');
      err.name = 'INVALID_CLOCK';
      throw err;
    }
    this._nowFn = opts && typeof opts.now === 'function' ? opts.now : null;
  }

  /**
   * Returns the current ISO timestamp. Frozen clocks return the same
   * string every call; real clocks return `new Date().toISOString()`.
   *
   * @returns {string}
   */
  now() {
    if (this._nowFn) {
      const value = this._nowFn();
      if (value instanceof Date) return value.toISOString();
      if (typeof value !== 'string' || value.length === 0) {
        const err = new Error(
          `ClockService.now: injected factory returned non-string/non-Date (${typeof value})`
        );
        err.name = 'INVALID_CLOCK_VALUE';
        throw err;
      }
      return value;
    }
    return new Date().toISOString();
  }

  /**
   * Returns the current time as a Date. Useful for callers that need a
   * mutable Date (e.g., arithmetic).
   *
   * @returns {Date}
   */
  nowDate() {
    return new Date(this.now());
  }

  /**
   * True if this service is running with an injected (frozen) clock.
   *
   * @returns {boolean}
   */
  isFrozen() {
    return this._nowFn !== null;
  }
}

export default ClockService;
