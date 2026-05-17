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
  ROUTE_NAMES,
  VISIBLE_ROUTE_NAMES,
  PLACEHOLDER_ROUTE_NAMES
} from '../../js/ui/router.js';

describe('router — ROUTES / ROUTE_NAMES constants', () => {
  test('ROUTES has exactly 7 MVP routes (Sprint 7 adds PORTFOLIO)', () => {
    assert.deepEqual(Object.keys(ROUTES).sort(), [
      'CATALOG',
      'INSIGHTS',
      'KAIZEN',
      'PORTFOLIO',
      'SETTINGS',
      'TODAY',
      'WEEK'
    ]);
  });

  test('ROUTE_NAMES lists the 7 routes in lowercase form', () => {
    assert.deepEqual([...ROUTE_NAMES].sort(), [
      'catalog',
      'insights',
      'kaizen',
      'portfolio',
      'settings',
      'today',
      'week'
    ]);
  });

  test('portfolio is in 2nd position (after today)', () => {
    assert.equal(ROUTE_NAMES[0], 'today');
    assert.equal(ROUTE_NAMES[1], 'portfolio');
  });

  test('#portfolio → portfolio', () => {
    assert.deepEqual(parseHash('#portfolio'), { route: 'portfolio', params: {} });
  });

  test('ROUTES is frozen', () => {
    assert.throws(() => {
      ROUTES.FOO = 'bar';
    });
  });
});

describe('router — VISIBLE_ROUTE_NAMES (Sprint 11 P0-T1)', () => {
  test('VISIBLE_ROUTE_NAMES is a 5-item subset of ROUTE_NAMES', () => {
    assert.equal(VISIBLE_ROUTE_NAMES.length, 5);
    for (const r of VISIBLE_ROUTE_NAMES) {
      assert.ok(ROUTE_NAMES.includes(r), `visible route '${r}' missing from ROUTE_NAMES`);
    }
  });

  test('VISIBLE_ROUTE_NAMES lists the 5 shipped screens in expected order', () => {
    assert.deepEqual([...VISIBLE_ROUTE_NAMES], [
      'today',
      'portfolio',
      'week',
      'catalog',
      'kaizen'
    ]);
  });

  test('VISIBLE_ROUTE_NAMES does NOT contain insights (placeholder) or settings (gear-icon-only)', () => {
    // Iter 39: settings ships as a real page but is accessed via the gear icon
    // in AppShell — not via a text nav link — so it stays out of VISIBLE_ROUTE_NAMES.
    assert.ok(!VISIBLE_ROUTE_NAMES.includes('insights'));
    assert.ok(!VISIBLE_ROUTE_NAMES.includes('settings'));
  });

  test('VISIBLE_ROUTE_NAMES is frozen', () => {
    assert.throws(() => {
      VISIBLE_ROUTE_NAMES.push('foo');
    });
  });

  test('PLACEHOLDER_ROUTE_NAMES lists the 1 remaining placeholder route (Iter 39: settings promoted)', () => {
    // Iter 39: settings was promoted from PlaceholderPage to a real Settings
    // page; only `insights` remains as a placeholder.
    assert.deepEqual([...PLACEHOLDER_ROUTE_NAMES], ['insights']);
  });

  test('VISIBLE, PLACEHOLDER, and gear-icon-only routes together cover ROUTE_NAMES', () => {
    // Iter 39: `settings` is its own category — real page, gear-icon access.
    // It is neither in VISIBLE (no text nav link) nor in PLACEHOLDER (real page).
    const gearOnlyRoutes = ['settings'];
    const covered = new Set([
      ...VISIBLE_ROUTE_NAMES,
      ...PLACEHOLDER_ROUTE_NAMES,
      ...gearOnlyRoutes
    ]);
    assert.equal(covered.size, ROUTE_NAMES.length);
    for (const r of ROUTE_NAMES) {
      assert.ok(covered.has(r), `route '${r}' uncategorised`);
    }
  });

  test('direct URL access to insights still parses (not hidden from router)', () => {
    assert.deepEqual(parseHash('#insights'), { route: 'insights', params: {} });
  });

  test('direct URL access to settings still parses', () => {
    assert.deepEqual(parseHash('#settings'), { route: 'settings', params: {} });
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
