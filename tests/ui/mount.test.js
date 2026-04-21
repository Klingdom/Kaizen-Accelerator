/**
 * Tests for /js/ui/mount.js — the pure helpers (no real DOM).
 *
 * We build a minimal DOM-ish stub inline (<100 lines) to exercise
 * `findActionTarget`, `readAction`, and `createDispatcher`. The
 * real-DOM helpers `mountHtml` / `attachRootClickListener` are not
 * exercised here — they're the `document.*` boundary and guarded by
 * throws when `document` is undefined.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  parseDataPayload,
  findActionTarget,
  readAction,
  createDispatcher,
  esc
} from '../../js/ui/mount.js';

/**
 * Minimal element stub — implements `getAttribute` + `parentNode`.
 */
function el(attrs = {}, parent = null) {
  return {
    _attrs: attrs,
    parentNode: parent,
    getAttribute(name) {
      return this._attrs[name] ?? null;
    }
  };
}

describe('mount.parseDataPayload', () => {
  test('empty string returns {}', () => {
    assert.deepEqual(parseDataPayload(''), {});
  });

  test('null returns {}', () => {
    assert.deepEqual(parseDataPayload(null), {});
  });

  test('undefined returns {}', () => {
    assert.deepEqual(parseDataPayload(undefined), {});
  });

  test('parses valid JSON object', () => {
    assert.deepEqual(parseDataPayload('{"id":"x","n":3}'), { id: 'x', n: 3 });
  });

  test('wraps non-object primitives in {value:...}', () => {
    assert.deepEqual(parseDataPayload('42'), { value: 42 });
    assert.deepEqual(parseDataPayload('"hello"'), { value: 'hello' });
    assert.deepEqual(parseDataPayload('true'), { value: true });
    assert.deepEqual(parseDataPayload('null'), { value: null });
  });

  test('throws INVALID_DATA_PAYLOAD on bad JSON', () => {
    assert.throws(() => parseDataPayload('{not-json'), /INVALID_DATA_PAYLOAD/);
  });
});

describe('mount.findActionTarget', () => {
  test('returns the element itself when it has data-action', () => {
    const btn = el({ 'data-action': 'ACCEPT' });
    assert.equal(findActionTarget(btn), btn);
  });

  test('walks up to parent when target lacks data-action', () => {
    const btn = el({ 'data-action': 'ACCEPT' });
    const inner = el({}, btn);
    assert.equal(findActionTarget(inner), btn);
  });

  test('walks up multiple levels', () => {
    const btn = el({ 'data-action': 'ACCEPT' });
    const mid = el({}, btn);
    const leaf = el({}, mid);
    assert.equal(findActionTarget(leaf), btn);
  });

  test('returns null if no ancestor has data-action', () => {
    const leaf = el({}, el({}, null));
    assert.equal(findActionTarget(leaf), null);
  });

  test('stops at the boundary', () => {
    const root = el({ 'data-action': 'ROOT' });
    const mid = el({}, root);
    const leaf = el({}, mid);
    assert.equal(findActionTarget(leaf, root), null);
  });

  test('handles null target', () => {
    assert.equal(findActionTarget(null), null);
  });
});

describe('mount.readAction', () => {
  test('reads data-action + data-payload', () => {
    const btn = el({
      'data-action': 'REJECT',
      'data-payload': '{"reason":"sick"}'
    });
    assert.deepEqual(readAction(btn), {
      action: 'REJECT',
      payload: { reason: 'sick' }
    });
  });

  test('default payload when data-payload absent', () => {
    const btn = el({ 'data-action': 'ACCEPT' });
    assert.deepEqual(readAction(btn), { action: 'ACCEPT', payload: {} });
  });

  test('returns null when element has no data-action', () => {
    assert.equal(readAction(el({ foo: 'bar' })), null);
  });

  test('returns null when element is null', () => {
    assert.equal(readAction(null), null);
  });

  test('returns null when element has no getAttribute', () => {
    assert.equal(readAction({}), null);
  });
});

describe('mount.createDispatcher', () => {
  test('routes data-action to matching handler', () => {
    const calls = [];
    const handlers = {
      ACCEPT: (payload, ctx) => calls.push({ action: 'ACCEPT', payload, ctx })
    };
    const dispatch = createDispatcher(handlers);
    const btn = el({ 'data-action': 'ACCEPT', 'data-payload': '{"id":"c1"}' });
    dispatch({ target: btn });
    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0].payload, { id: 'c1' });
    assert.equal(calls[0].action, 'ACCEPT');
  });

  test('walks DOM to find data-action', () => {
    const calls = [];
    const handlers = { X: (p) => calls.push(p) };
    const dispatch = createDispatcher(handlers);
    const btn = el({ 'data-action': 'X', 'data-payload': '{"a":1}' });
    const inner = el({}, btn);
    dispatch({ target: inner });
    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0], { a: 1 });
  });

  test('does not throw for elements without data-action', () => {
    const handlers = { X: () => {} };
    const dispatch = createDispatcher(handlers);
    const leaf = el({});
    assert.doesNotThrow(() => dispatch({ target: leaf }));
  });

  test('unknown action reports via onUnknownAction (no throw)', () => {
    const unknowns = [];
    const dispatch = createDispatcher(
      { FOO: () => {} },
      { onUnknownAction: (a) => unknowns.push(a) }
    );
    dispatch({ target: el({ 'data-action': 'BAR' }) });
    assert.deepEqual(unknowns, ['BAR']);
  });

  test('unknown action silently no-ops when no onUnknownAction', () => {
    const dispatch = createDispatcher({ FOO: () => {} });
    assert.doesNotThrow(() =>
      dispatch({ target: el({ 'data-action': 'BAR' }) })
    );
  });

  test('throws INVALID_HANDLERS when handlers is falsy', () => {
    assert.throws(() => createDispatcher(null), /INVALID_HANDLERS/);
    assert.throws(() => createDispatcher('bad'), /INVALID_HANDLERS/);
  });

  test('bad event (no target) no-ops', () => {
    const dispatch = createDispatcher({});
    assert.doesNotThrow(() => dispatch({}));
    assert.doesNotThrow(() => dispatch(null));
  });

  test('passes ctx object with element + event to handler', () => {
    const ctx = [];
    const dispatch = createDispatcher({
      X: (_p, c) => ctx.push(c)
    });
    const btn = el({ 'data-action': 'X' });
    const ev = { target: btn };
    dispatch(ev);
    assert.equal(ctx[0].element, btn);
    assert.equal(ctx[0].event, ev);
  });
});

describe('mount.esc — HTML escaping', () => {
  test('escapes ampersand first to avoid double-encoding', () => {
    assert.equal(esc('a & b'), 'a &amp; b');
  });

  test('escapes < > " \' ', () => {
    assert.equal(esc('<script>'), '&lt;script&gt;');
    assert.equal(esc('a"b'), 'a&quot;b');
    assert.equal(esc("a'b"), 'a&#39;b');
  });

  test('null and undefined return empty string', () => {
    assert.equal(esc(null), '');
    assert.equal(esc(undefined), '');
  });

  test('numbers coerce to string', () => {
    assert.equal(esc(42), '42');
  });

  test('boolean coerces to string', () => {
    assert.equal(esc(true), 'true');
  });

  test('empty string returns empty string', () => {
    assert.equal(esc(''), '');
  });

  test('full attack payload is neutralized', () => {
    const attack = `<img src="x" onerror="alert('pwn')">`;
    const safe = esc(attack);
    assert.ok(!safe.includes('<'));
    assert.ok(!safe.includes('>'));
    assert.ok(!safe.includes('"'));
  });
});
