/**
 * Tests for js/ui/focusTrap.js — WCAG §2.1.2 focus containment utility.
 *
 * All tests run in Node via node:test. The focusTrap utility accepts an
 * injectable `_doc` stub via the options object, so no real browser document
 * is required.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  installFocusTrap,
  releaseFocusTrap,
  getFocusableElements
} from '../../js/ui/focusTrap.js';

// ---------------------------------------------------------------------------
// Stub builders
// ---------------------------------------------------------------------------

/**
 * Create a minimal stub button-like element.
 *
 * @param {{ name?: string }} [opts]
 * @returns {object}
 */
function makeBtn(opts = {}) {
  const el = {
    _name: opts.name ?? 'btn',
    _focused: false,
    tagName: 'BUTTON',
    disabled: false,
    offsetParent: {}, // non-null → visible
    getAttribute: () => null,
    focus() { this._focused = true; },
    blur() { this._focused = false; }
  };
  return el;
}

/**
 * Build a stub document object. `activeElement` is writable so tests can
 * change it between keydown events.
 *
 * @param {{ activeElement?: object }} [opts]
 * @returns {object}
 */
function makeDoc(opts = {}) {
  const listeners = {};
  const doc = {
    _activeElement: opts.activeElement ?? null,
    get activeElement() { return this._activeElement; },
    set activeElement(v) { this._activeElement = v; },
    addEventListener(type, fn, capture) {
      if (!listeners[type]) listeners[type] = [];
      listeners[type].push(fn);
    },
    removeEventListener(type, fn, _capture) {
      if (!listeners[type]) return;
      listeners[type] = listeners[type].filter((f) => f !== fn);
    },
    listenerCount(type) {
      return (listeners[type] ?? []).length;
    },
    dispatchKeydown(ev) {
      for (const fn of (listeners.keydown ?? [])) {
        fn(ev);
      }
    },
    contains: () => true,
    querySelector: () => null,
    body: { focus() {} }
  };
  return doc;
}

/**
 * Build a minimal root element whose querySelectorAll returns `children`.
 *
 * @param {object[]} children
 * @returns {object}
 */
function makeRoot(children = []) {
  return {
    querySelectorAll: () => children
  };
}

// ---------------------------------------------------------------------------
// getFocusableElements
// ---------------------------------------------------------------------------

describe('getFocusableElements', () => {
  test('returns empty array when rootEl is null', () => {
    assert.deepEqual(getFocusableElements(null), []);
  });

  test('returns empty array when rootEl is undefined', () => {
    assert.deepEqual(getFocusableElements(undefined), []);
  });

  test('returns empty array when rootEl has no querySelectorAll', () => {
    assert.deepEqual(getFocusableElements({}), []);
  });

  test('returns elements from querySelectorAll (visible filter passes when offsetParent is set)', () => {
    const btn = makeBtn();
    const root = makeRoot([btn]);
    const result = getFocusableElements(root);
    assert.deepEqual(result, [btn]);
  });

  test('filters out elements with null offsetParent (hidden)', () => {
    const hidden = { ...makeBtn(), offsetParent: null };
    const root = makeRoot([hidden]);
    const result = getFocusableElements(root);
    assert.deepEqual(result, []);
  });
});

// ---------------------------------------------------------------------------
// installFocusTrap — null/undefined rootEl (AC8)
// ---------------------------------------------------------------------------

describe('installFocusTrap — null root (AC8)', () => {
  test('returns a handle even when rootEl is null', () => {
    const doc = makeDoc();
    const handle = installFocusTrap(null, { _doc: doc });
    assert.ok(handle !== null && typeof handle === 'object', 'handle must be an object');
    assert.doesNotThrow(() => releaseFocusTrap(handle));
  });

  test('returns a handle when rootEl is undefined', () => {
    const doc = makeDoc();
    const handle = installFocusTrap(undefined, { _doc: doc });
    assert.ok(handle !== null && typeof handle === 'object');
    assert.doesNotThrow(() => releaseFocusTrap(handle));
  });

  test('no focusable elements — install does not throw', () => {
    const doc = makeDoc();
    const root = makeRoot([]); // empty
    assert.doesNotThrow(() => {
      const h = installFocusTrap(root, { _doc: doc });
      releaseFocusTrap(h);
    });
  });
});

// ---------------------------------------------------------------------------
// AC3: installFocusTrap returns a teardown handle
// ---------------------------------------------------------------------------

describe('installFocusTrap — returns teardown handle (AC3)', () => {
  test('handle has _listener function after install with focusable elements', () => {
    const doc = makeDoc();
    const root = makeRoot([makeBtn()]);
    const handle = installFocusTrap(root, { _doc: doc });
    assert.ok(typeof handle._listener === 'function', 'handle._listener must be a function');
    releaseFocusTrap(handle);
  });

  test('handle _listener is null for no-op install (null root)', () => {
    const doc = makeDoc();
    const handle = installFocusTrap(null, { _doc: doc });
    assert.equal(handle._listener, null, 'no-op handle must have null _listener');
  });
});

// ---------------------------------------------------------------------------
// AC6: Focus moves to first focusable on install
// ---------------------------------------------------------------------------

describe('installFocusTrap — focus on first element (AC6)', () => {
  test('first focusable element receives focus on install', () => {
    const doc = makeDoc();
    const first = makeBtn({ name: 'first' });
    const second = makeBtn({ name: 'second' });
    const root = makeRoot([first, second]);
    installFocusTrap(root, { _doc: doc });
    assert.ok(first._focused, 'first focusable should be focused on install');
    assert.ok(!second._focused, 'second focusable should not be focused');
  });

  test('no crash when no focusable elements (AC8)', () => {
    const doc = makeDoc();
    const root = makeRoot([]);
    assert.doesNotThrow(() => {
      const h = installFocusTrap(root, { _doc: doc });
      releaseFocusTrap(h);
    });
  });
});

// ---------------------------------------------------------------------------
// AC7: Focus restores to saved trigger on release
// ---------------------------------------------------------------------------

describe('releaseFocusTrap — restore focus to trigger (AC7)', () => {
  test('restores focus to the element that was active before install', () => {
    let restored = false;
    const trigger = { focus() { restored = true; } };
    const doc = makeDoc({ activeElement: trigger });
    doc.contains = () => true;

    const root = makeRoot([makeBtn()]);
    const handle = installFocusTrap(root, { _doc: doc });
    releaseFocusTrap(handle);

    assert.ok(restored, 'trigger element should be refocused on release');
  });

  test('falls back to doc.body when saved trigger is no longer in DOM', () => {
    let bodyFocused = false;
    const trigger = { focus() {} };
    const doc = makeDoc({ activeElement: trigger });
    doc.contains = () => false; // simulate removed-from-DOM
    doc.body = { focus() { bodyFocused = true; } };

    const root = makeRoot([makeBtn()]);
    const handle = installFocusTrap(root, { _doc: doc });
    releaseFocusTrap(handle);

    assert.ok(bodyFocused, 'body should receive focus when trigger is no longer in DOM');
  });

  test('no throw when saved trigger has no focus method', () => {
    const trigger = {}; // no .focus()
    const doc = makeDoc({ activeElement: trigger });
    const root = makeRoot([makeBtn()]);
    const handle = installFocusTrap(root, { _doc: doc });
    assert.doesNotThrow(() => releaseFocusTrap(handle));
  });
});

// ---------------------------------------------------------------------------
// AC4: Tab from last focusable wraps to first
// ---------------------------------------------------------------------------

describe('installFocusTrap — Tab wrap forward (AC4)', () => {
  test('Tab from last focusable element wraps to first', () => {
    const first = makeBtn({ name: 'first' });
    const last = makeBtn({ name: 'last' });
    const doc = makeDoc({ activeElement: last }); // last is active
    const root = makeRoot([first, last]);
    const handle = installFocusTrap(root, { _doc: doc });

    let prevented = false;
    doc.dispatchKeydown({
      key: 'Tab',
      shiftKey: false,
      preventDefault: () => { prevented = true; }
    });

    assert.ok(prevented, 'Tab from last should call preventDefault');
    assert.ok(first._focused, 'focus should wrap to first element');

    releaseFocusTrap(handle);
  });

  test('Tab from non-last element does NOT wrap (normal browser behaviour)', () => {
    const first = makeBtn({ name: 'first' });
    const middle = makeBtn({ name: 'middle' });
    const last = makeBtn({ name: 'last' });
    const doc = makeDoc({ activeElement: middle }); // middle is active
    const root = makeRoot([first, middle, last]);
    const handle = installFocusTrap(root, { _doc: doc });

    let prevented = false;
    first._focused = false; // reset
    doc.dispatchKeydown({
      key: 'Tab',
      shiftKey: false,
      preventDefault: () => { prevented = true; }
    });

    assert.ok(!prevented, 'Tab from middle should not preventDefault');
    assert.ok(!first._focused, 'focus should NOT jump to first from middle');

    releaseFocusTrap(handle);
  });
});

// ---------------------------------------------------------------------------
// AC5: Shift+Tab from first focusable wraps to last
// ---------------------------------------------------------------------------

describe('installFocusTrap — Shift+Tab wrap backward (AC5)', () => {
  test('Shift+Tab from first focusable wraps to last', () => {
    const first = makeBtn({ name: 'first' });
    const last = makeBtn({ name: 'last' });
    const doc = makeDoc({ activeElement: first }); // first is active
    const root = makeRoot([first, last]);
    const handle = installFocusTrap(root, { _doc: doc });

    let prevented = false;
    doc.dispatchKeydown({
      key: 'Tab',
      shiftKey: true,
      preventDefault: () => { prevented = true; }
    });

    assert.ok(prevented, 'Shift+Tab from first should call preventDefault');
    assert.ok(last._focused, 'focus should wrap to last element');

    releaseFocusTrap(handle);
  });

  test('Shift+Tab from non-first element does NOT wrap', () => {
    const first = makeBtn({ name: 'first' });
    const middle = makeBtn({ name: 'middle' });
    const last = makeBtn({ name: 'last' });
    const doc = makeDoc({ activeElement: middle }); // middle is active
    const root = makeRoot([first, middle, last]);
    const handle = installFocusTrap(root, { _doc: doc });

    let prevented = false;
    last._focused = false; // reset
    doc.dispatchKeydown({
      key: 'Tab',
      shiftKey: true,
      preventDefault: () => { prevented = true; }
    });

    assert.ok(!prevented, 'Shift+Tab from middle should not preventDefault');
    assert.ok(!last._focused, 'focus should NOT jump to last from middle');

    releaseFocusTrap(handle);
  });

  test('Tab with no focusable elements calls preventDefault but does not throw (AC8)', () => {
    const doc = makeDoc();
    const root = makeRoot([]);
    const handle = installFocusTrap(root, { _doc: doc });

    let prevented = false;
    assert.doesNotThrow(() => {
      doc.dispatchKeydown({
        key: 'Tab',
        shiftKey: false,
        preventDefault: () => { prevented = true; }
      });
    });
    assert.ok(prevented, 'Tab with no focusables should prevent default');

    releaseFocusTrap(handle);
  });
});

// ---------------------------------------------------------------------------
// Escape key callback
// ---------------------------------------------------------------------------

describe('installFocusTrap — Escape key (onEscape callback)', () => {
  test('Escape fires onEscape callback when provided', () => {
    let escaped = false;
    const doc = makeDoc();
    const root = makeRoot([makeBtn()]);
    const handle = installFocusTrap(root, {
      _doc: doc,
      onEscape: () => { escaped = true; }
    });

    doc.dispatchKeydown({
      key: 'Escape',
      shiftKey: false,
      preventDefault: () => {}
    });

    assert.ok(escaped, 'onEscape should be called when Escape is pressed');
    releaseFocusTrap(handle);
  });

  test('Escape without onEscape does not throw', () => {
    const doc = makeDoc();
    const root = makeRoot([makeBtn()]);
    const handle = installFocusTrap(root, { _doc: doc });

    assert.doesNotThrow(() => {
      doc.dispatchKeydown({
        key: 'Escape',
        shiftKey: false,
        preventDefault: () => {}
      });
    });

    releaseFocusTrap(handle);
  });
});

// ---------------------------------------------------------------------------
// AC11: Multiple installs — no listener leaks
// ---------------------------------------------------------------------------

describe('installFocusTrap — multiple installs (AC11)', () => {
  test('each install adds one listener; each release removes exactly one', () => {
    const doc = makeDoc();
    const root = makeRoot([makeBtn()]);

    assert.equal(doc.listenerCount('keydown'), 0, 'start with 0 listeners');

    const h1 = installFocusTrap(root, { _doc: doc });
    assert.equal(doc.listenerCount('keydown'), 1, 'first install → 1 listener');

    const h2 = installFocusTrap(root, { _doc: doc });
    assert.equal(doc.listenerCount('keydown'), 2, 'second install → 2 listeners');

    releaseFocusTrap(h1);
    assert.equal(doc.listenerCount('keydown'), 1, 'first release → 1 listener');

    releaseFocusTrap(h2);
    assert.equal(doc.listenerCount('keydown'), 0, 'second release → 0 listeners');
  });

  test('releasing same handle twice does not double-remove', () => {
    const doc = makeDoc();
    const root = makeRoot([makeBtn()]);
    const handle = installFocusTrap(root, { _doc: doc });

    releaseFocusTrap(handle);
    assert.equal(doc.listenerCount('keydown'), 0);

    assert.doesNotThrow(() => releaseFocusTrap(handle), 'double release must not throw');
    assert.equal(doc.listenerCount('keydown'), 0, 'still 0 listeners after double release');
  });
});

// ---------------------------------------------------------------------------
// releaseFocusTrap — null/missing handle
// ---------------------------------------------------------------------------

describe('releaseFocusTrap — null/missing handle', () => {
  test('releaseFocusTrap(null) does not throw', () => {
    assert.doesNotThrow(() => releaseFocusTrap(null));
  });

  test('releaseFocusTrap(undefined) does not throw', () => {
    assert.doesNotThrow(() => releaseFocusTrap(undefined));
  });
});
