/**
 * Tests for /js/events/EventBus.js (E1-T2).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { EventBus } from '../../js/events/EventBus.js';

describe('EventBus — basic pub/sub', () => {
  test('subscribe → publish fires the handler with payload', () => {
    const bus = new EventBus();
    let seen = null;
    bus.subscribe('Evt', (p) => { seen = p; });
    bus.publish('Evt', { x: 7 });
    assert.deepEqual(seen, { x: 7 });
  });

  test('publish with no subscribers is a silent no-op', () => {
    const bus = new EventBus();
    // No assertion needed beyond "does not throw".
    bus.publish('NoOne', { any: 'payload' });
  });

  test('publish without a payload passes undefined through', () => {
    const bus = new EventBus();
    let called = false;
    let passed = 'sentinel';
    bus.subscribe('X', (p) => {
      called = true;
      passed = p;
    });
    bus.publish('X');
    assert.equal(called, true);
    assert.equal(passed, undefined);
  });
});

describe('EventBus — idempotent subscribe', () => {
  test('same fn subscribed twice fires once per publish', () => {
    const bus = new EventBus();
    let count = 0;
    const fn = () => { count++; };
    bus.subscribe('Evt', fn);
    bus.subscribe('Evt', fn); // no-op per contract
    bus.publish('Evt', {});
    assert.equal(count, 1);
    assert.equal(bus.subscriberCount('Evt'), 1);
  });

  test('distinct fns both fire', () => {
    const bus = new EventBus();
    let a = 0, b = 0;
    bus.subscribe('Evt', () => { a++; });
    bus.subscribe('Evt', () => { b++; });
    bus.publish('Evt', {});
    assert.equal(a, 1);
    assert.equal(b, 1);
    assert.equal(bus.subscriberCount('Evt'), 2);
  });
});

describe('EventBus — dispatch is synchronous', () => {
  test('handler runs before publish returns', () => {
    const bus = new EventBus();
    const order = [];
    bus.subscribe('Evt', () => { order.push('handler'); });
    order.push('before');
    bus.publish('Evt', {});
    order.push('after');
    assert.deepEqual(order, ['before', 'handler', 'after']);
  });
});

describe('EventBus — unsubscribe', () => {
  test('returned teardown removes the handler', () => {
    const bus = new EventBus();
    let count = 0;
    const off = bus.subscribe('Evt', () => { count++; });
    bus.publish('Evt', {});
    off();
    bus.publish('Evt', {});
    assert.equal(count, 1);
    assert.equal(bus.subscriberCount('Evt'), 0);
  });

  test('unsubscribe of an unknown handler is a no-op', () => {
    const bus = new EventBus();
    bus.unsubscribe('Evt', () => {});
    // Passes simply by not throwing.
  });
});

describe('EventBus — input validation', () => {
  test('subscribe with non-string event throws INVALID_EVENT_NAME', () => {
    const bus = new EventBus();
    assert.throws(
      () => bus.subscribe(123, () => {}),
      (e) => e.name === 'INVALID_EVENT_NAME'
    );
  });

  test('subscribe with non-function handler throws INVALID_HANDLER', () => {
    const bus = new EventBus();
    assert.throws(
      () => bus.subscribe('Evt', 'not-a-fn'),
      (e) => e.name === 'INVALID_HANDLER'
    );
  });
});

describe('EventBus — handler errors', () => {
  test('single handler error propagates to publish caller', () => {
    const bus = new EventBus();
    bus.subscribe('Evt', () => { throw new Error('boom'); });
    assert.throws(() => bus.publish('Evt'), /boom/);
  });

  test('multiple handler errors aggregate', () => {
    const bus = new EventBus();
    bus.subscribe('Evt', () => { throw new Error('a'); });
    bus.subscribe('Evt', () => { throw new Error('b'); });
    assert.throws(
      () => bus.publish('Evt'),
      (e) => e instanceof AggregateError && e.errors.length === 2
    );
  });
});
