/**
 * EventBus — in-memory synchronous pub/sub (E1-T2).
 *
 * Contract (ARCHITECTURE §6.3):
 *  - `subscribe(event, fn)` registers `fn` for `event`; subscribing the SAME
 *    function object twice is a no-op (idempotent).
 *  - `publish(event, payload)` calls every subscriber synchronously with
 *    `payload`; publishing to an event with zero subscribers is a silent no-op.
 *  - Dispatch is synchronous — handlers run on the call stack of `publish`.
 *
 * No external deps. Zero global state (per-instance).
 */

export class EventBus {
  constructor() {
    /** @type {Map<string, Set<Function>>} */
    this._subs = new Map();
  }

  /**
   * Register a handler for an event. Same fn subscribed twice registers once.
   *
   * @param {string} event
   * @param {(payload: any) => void} fn
   * @returns {() => void} unsubscribe
   */
  subscribe(event, fn) {
    if (typeof event !== 'string' || event.length === 0) {
      const err = new Error('EventBus.subscribe: event must be a non-empty string');
      err.name = 'INVALID_EVENT_NAME';
      throw err;
    }
    if (typeof fn !== 'function') {
      const err = new Error('EventBus.subscribe: fn must be a function');
      err.name = 'INVALID_HANDLER';
      throw err;
    }
    let set = this._subs.get(event);
    if (!set) {
      set = new Set();
      this._subs.set(event, set);
    }
    // Set semantics give us idempotent subscribe: add of an existing fn is no-op.
    set.add(fn);
    return () => this.unsubscribe(event, fn);
  }

  /**
   * Remove a previously-subscribed handler. No-op if not registered.
   *
   * @param {string} event
   * @param {Function} fn
   */
  unsubscribe(event, fn) {
    const set = this._subs.get(event);
    if (!set) return;
    set.delete(fn);
    if (set.size === 0) this._subs.delete(event);
  }

  /**
   * Synchronously fire every subscriber for `event`. Unknown events no-op.
   *
   * Handler errors are collected and re-thrown as an AggregateError after
   * all handlers have had the chance to run, so one failing subscriber does
   * not silently starve the others. MVP contract: publishers treat errors
   * as bugs; in normal operation no handler should throw.
   *
   * @param {string} event
   * @param {*} [payload]
   */
  publish(event, payload) {
    const set = this._subs.get(event);
    if (!set || set.size === 0) return;
    // Snapshot to decouple iteration from mutation during dispatch.
    const snapshot = Array.from(set);
    const errors = [];
    for (const fn of snapshot) {
      try {
        fn(payload);
      } catch (err) {
        errors.push(err);
      }
    }
    if (errors.length === 1) throw errors[0];
    if (errors.length > 1) {
      throw new AggregateError(errors, `EventBus.publish('${event}') — ${errors.length} handler errors`);
    }
  }

  /**
   * How many handlers are registered for `event`. Test helper.
   *
   * @param {string} event
   * @returns {number}
   */
  subscriberCount(event) {
    const set = this._subs.get(event);
    return set ? set.size : 0;
  }

  /** Reset all subscriptions. Test helper. */
  clear() {
    this._subs.clear();
  }
}

export default EventBus;
