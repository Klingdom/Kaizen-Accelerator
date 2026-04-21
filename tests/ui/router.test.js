/**
 * Tests for /js/ui/router.js — pure hash-based router.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  parseHash,
  buildHash,
  createRouteListener,
  ROUTES,
  ROUTE_NAMES
} from '../../js/ui/router.js';

describe('router — ROUTES / ROUTE_NAMES constants', () => {
  test('ROUTES has exactly 6 MVP routes', () => {
    assert.deepEqual(Object.keys(ROUTES).sort(), [
      'CATALOG',
      'INSIGHTS',
      'KAIZEN',
      'SETTINGS',
      'TODAY',
      'WEEK'
    ]);
  });

  test('ROUTE_NAMES lists the 6 routes in lowercase form', () => {
    assert.deepEqual([...ROUTE_NAMES].sort(), [
      'catalog',
      'insights',
      'kaizen',
      'settings',
      'today',
      'week'
    ]);
  });

  test('ROUTES is frozen', () => {
    assert.throws(() => {
      ROUTES.FOO = 'bar';
    });
  });
});

describe('router.parseHash — primary routing', () => {
  test('empty hash defaults to today', () => {
    assert.deepEqual(parseHash(''), { route: 'today', params: {} });
  });

  test('# alone defaults to today', () => {
    assert.deepEqual(parseHash('#'), { route: 'today', params: {} });
  });

  test('null defaults to today', () => {
    assert.deepEqual(parseHash(null), { route: 'today', params: {} });
  });

  test('undefined defaults to today', () => {
    assert.deepEqual(parseHash(undefined), { route: 'today', params: {} });
  });

  test('#today → today', () => {
    assert.deepEqual(parseHash('#today'), { route: 'today', params: {} });
  });

  test('#week → week', () => {
    assert.deepEqual(parseHash('#week'), { route: 'week', params: {} });
  });

  test('#catalog → catalog', () => {
    assert.deepEqual(parseHash('#catalog'), { route: 'catalog', params: {} });
  });

  test('#kaizen → kaizen', () => {
    assert.deepEqual(parseHash('#kaizen'), { route: 'kaizen', params: {} });
  });

  test('#insights → insights', () => {
    assert.deepEqual(parseHash('#insights'), { route: 'insights', params: {} });
  });

  test('#settings → settings', () => {
    assert.deepEqual(parseHash('#settings'), { route: 'settings', params: {} });
  });

  test('unknown route falls back to today', () => {
    assert.deepEqual(parseHash('#nope'), { route: 'today', params: {} });
    assert.deepEqual(parseHash('#admin'), { route: 'today', params: {} });
  });

  test('hash without # prefix still parses', () => {
    assert.deepEqual(parseHash('today'), { route: 'today', params: {} });
  });
});

describe('router.parseHash — sub-path params', () => {
  test('#today/compose → sub=compose', () => {
    assert.deepEqual(parseHash('#today/compose'), {
      route: 'today',
      params: { sub: 'compose' }
    });
  });

  test('#kaizen/k1/baseline → sub=k1 id=baseline', () => {
    assert.deepEqual(parseHash('#kaizen/k1/baseline'), {
      route: 'kaizen',
      params: { sub: 'k1', id: 'baseline' }
    });
  });

  test('trailing slash strips cleanly', () => {
    assert.deepEqual(parseHash('#today/'), { route: 'today', params: {} });
  });

  test('empty sub-segments are filtered', () => {
    assert.deepEqual(parseHash('#today///compose'), {
      route: 'today',
      params: { sub: 'compose' }
    });
  });
});

describe('router.buildHash', () => {
  test('today → #today', () => {
    assert.equal(buildHash('today'), '#today');
  });

  test('today + sub=compose → #today/compose', () => {
    assert.equal(buildHash('today', { sub: 'compose' }), '#today/compose');
  });

  test('kaizen + sub + id → #kaizen/sub/id', () => {
    assert.equal(buildHash('kaizen', { sub: 'k1', id: 'baseline' }), '#kaizen/k1/baseline');
  });

  test('unknown route throws UNKNOWN_ROUTE', () => {
    assert.throws(() => buildHash('bogus'), /UNKNOWN_ROUTE/);
  });

  test('round-trip: parseHash(buildHash(r)) → {route: r}', () => {
    for (const r of ROUTE_NAMES) {
      const hash = buildHash(r);
      const parsed = parseHash(hash);
      assert.equal(parsed.route, r);
    }
  });
});

describe('router.createRouteListener', () => {
  test('invokes onRoute with parseHash(hash) when called', () => {
    const received = [];
    const listener = createRouteListener((p) => received.push(p), {
      locationProvider: () => ({ hash: '#week' })
    });
    listener();
    assert.equal(received.length, 1);
    assert.equal(received[0].route, 'week');
  });

  test('re-reads location on every call', () => {
    const states = ['#today', '#week', '#insights'];
    let i = 0;
    const received = [];
    const listener = createRouteListener((p) => received.push(p), {
      locationProvider: () => ({ hash: states[i++] })
    });
    listener();
    listener();
    listener();
    assert.deepEqual(
      received.map((r) => r.route),
      ['today', 'week', 'insights']
    );
  });

  test('handles empty-hash case', () => {
    const received = [];
    const listener = createRouteListener((p) => received.push(p), {
      locationProvider: () => ({ hash: '' })
    });
    listener();
    assert.equal(received[0].route, 'today');
  });

  test('throws INVALID_LISTENER when callback is not a function', () => {
    assert.throws(() => createRouteListener(null), /INVALID_LISTENER/);
    assert.throws(() => createRouteListener('fn'), /INVALID_LISTENER/);
  });

  test('handles missing location provider gracefully', () => {
    const received = [];
    const listener = createRouteListener((p) => received.push(p), {
      locationProvider: () => undefined
    });
    listener();
    assert.equal(received[0].route, 'today');
  });
});
