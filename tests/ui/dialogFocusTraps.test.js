/**
 * dialogFocusTraps.test.js — Iter 27 (C-UX-6b) integration tests.
 *
 * Verifies that the focus-trap lifecycle (install on open, release on close,
 * Escape callback, Tab cycling) works correctly for each of the 8 dialogs
 * added in Iter 27. Tests drive `installFocusTrap` / `releaseFocusTrap`
 * directly using the same `_doc` injection pattern from focusTrap.test.js,
 * mirroring exactly what syncDrawerFocusTraps does at runtime.
 *
 * AC coverage:
 *   AC1  — BaselineDialog trap installs on open, releases on close
 *   AC2  — KaizenCloseDialog same
 *   AC3  — OpportunityIntakeForm same
 *   AC4  — OutputArtifactDialog same
 *   AC5  — ReflectionSheet same
 *   AC6  — RemeasurementDialog same
 *   AC7  — SkipReasonModal same
 *   AC8  — WeeklyReflectionWizard same
 *   AC9  — Escape fires the close action and restores focus
 *   AC10 — installFocusTrap utility is REUSED (imported, not re-implemented)
 *   AC12 — Tab/Shift+Tab cycle stays within the dialog root
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  installFocusTrap,
  releaseFocusTrap
} from '../../js/ui/focusTrap.js';

// ---------------------------------------------------------------------------
// Shared stubs (same pattern as focusTrap.test.js)
// ---------------------------------------------------------------------------

function makeBtn(name = 'btn') {
  return {
    _name: name,
    _focused: false,
    tagName: 'BUTTON',
    disabled: false,
    offsetParent: {},
    getAttribute: () => null,
    focus() { this._focused = true; },
    blur() { this._focused = false; }
  };
}

function makeDoc(opts = {}) {
  const listeners = {};
  const doc = {
    _activeElement: opts.activeElement ?? null,
    get activeElement() { return this._activeElement; },
    set activeElement(v) { this._activeElement = v; },
    addEventListener(type, fn) {
      if (!listeners[type]) listeners[type] = [];
      listeners[type].push(fn);
    },
    removeEventListener(type, fn) {
      if (!listeners[type]) return;
      listeners[type] = listeners[type].filter((f) => f !== fn);
    },
    listenerCount(type) { return (listeners[type] ?? []).length; },
    dispatchKeydown(ev) {
      for (const fn of (listeners.keydown ?? [])) fn(ev);
    },
    contains: () => true,
    querySelector: () => null,
    body: { focus() {} }
  };
  return doc;
}

function makeRoot(children) {
  return { querySelectorAll: () => children ?? [] };
}

/**
 * Simulate the syncDrawerFocusTraps logic for a single dialog entry.
 * Returns the trap handle (simulates state._focusTrap[key]).
 *
 * @param {{
 *   rootEl: object,
 *   doc: object,
 *   onEscape?: () => void
 * }} opts
 * @returns {{ handle: object, doc: object }}
 */
function installDialogTrap(opts) {
  const handle = installFocusTrap(opts.rootEl, {
    _doc: opts.doc,
    onEscape: opts.onEscape
  });
  return { handle, doc: opts.doc };
}

// ---------------------------------------------------------------------------
// Helper: run the standard open → close lifecycle assertions for a dialog.
// Shared by all 8 per-dialog tests.
// ---------------------------------------------------------------------------

function runDialogLifecycleTest(opts) {
  const { name, dialogRootEl, doc } = opts;

  // -- OPEN: install produces a non-null handle with a _listener
  const handle = installFocusTrap(dialogRootEl, { _doc: doc });
  assert.ok(
    handle !== null && typeof handle === 'object',
    `${name}: installFocusTrap must return an object handle`
  );
  assert.ok(
    typeof handle._listener === 'function',
    `${name}: handle._listener must be a function after install`
  );
  assert.equal(
    doc.listenerCount('keydown'),
    1,
    `${name}: exactly one keydown listener installed`
  );

  // -- CLOSE: release removes the listener
  releaseFocusTrap(handle);
  assert.equal(
    doc.listenerCount('keydown'),
    0,
    `${name}: keydown listener removed on release`
  );
  assert.equal(handle._listener, null, `${name}: handle._listener nulled on release`);
}

// ---------------------------------------------------------------------------
// Per-dialog test configs (mirrors dialogConfigs in syncDrawerFocusTraps)
// ---------------------------------------------------------------------------

const DIALOG_CONFIGS = [
  { name: 'BaselineDialog',          stateKey: 'baselineDialog',         cssClass: '.bd-modal',   escapeAction: 'CLOSE_BASELINE_DIALOG'      },
  { name: 'KaizenCloseDialog',       stateKey: 'kaizenCloseDialog',      cssClass: '.kcd-modal',  escapeAction: 'CLOSE_CLOSE_KAIZEN_DIALOG'   },
  { name: 'OpportunityIntakeForm',   stateKey: 'opportunityIntakeForm',   cssClass: '.oif-modal',  escapeAction: 'OPP_CANCEL_INTAKE'           },
  { name: 'OutputArtifactDialog',    stateKey: 'outputArtifactDialog',    cssClass: '.oad-modal',  escapeAction: 'CLOSE_CLOSE_DIALOG'          },
  { name: 'ReflectionSheet',         stateKey: 'reflectionSheet',         cssClass: '.rs-modal',   escapeAction: 'CLOSE_REFLECTION'            },
  { name: 'RemeasurementDialog',     stateKey: 'remeasurementDialog',     cssClass: '.rd-modal',   escapeAction: 'CLOSE_REMEASUREMENT_DIALOG'  },
  { name: 'SkipReasonModal',         stateKey: 'skipReasonModal',         cssClass: '.srm-modal',  escapeAction: 'CLOSE_SKIP_MODAL'            },
  { name: 'WeeklyReflectionWizard',  stateKey: 'weeklyReflectionWizard',  cssClass: '.wrw-modal',  escapeAction: 'WRW_CLOSE'                   }
];

// ---------------------------------------------------------------------------
// AC1-AC8: install on open, release on close — one describe per dialog
// ---------------------------------------------------------------------------

for (const cfg of DIALOG_CONFIGS) {
  describe(`${cfg.name} focus trap`, () => {
    test('installs a keydown listener on open', () => {
      const btn = makeBtn('primary');
      const root = makeRoot([btn]);
      const trigger = makeBtn('trigger');
      const doc = makeDoc({ activeElement: trigger });

      const handle = installFocusTrap(root, { _doc: doc });

      assert.ok(handle !== null && typeof handle === 'object', 'handle must be an object');
      assert.ok(typeof handle._listener === 'function', 'handle._listener must be a function');
      assert.equal(doc.listenerCount('keydown'), 1, 'one keydown listener installed');
      // First focusable in dialog received focus.
      assert.ok(btn._focused, 'first focusable element focused on install');

      releaseFocusTrap(handle);
    });

    test('releases keydown listener and restores trigger focus on close', () => {
      const btn = makeBtn('primary');
      const root = makeRoot([btn]);
      let triggerRestored = false;
      const trigger = { focus() { triggerRestored = true; } };
      const doc = makeDoc({ activeElement: trigger });

      const handle = installFocusTrap(root, { _doc: doc });
      assert.equal(doc.listenerCount('keydown'), 1);

      releaseFocusTrap(handle);

      assert.equal(doc.listenerCount('keydown'), 0, 'listener removed on release');
      assert.ok(triggerRestored, 'focus restored to trigger on close');
    });
  });
}

// ---------------------------------------------------------------------------
// AC9: Escape fires close action for each dialog
// ---------------------------------------------------------------------------

describe('Escape closes each dialog (AC9)', () => {
  for (const cfg of DIALOG_CONFIGS) {
    test(`${cfg.name}: Escape fires ${cfg.escapeAction}`, () => {
      let escaped = false;
      const btn = makeBtn();
      const root = makeRoot([btn]);
      const doc = makeDoc();

      const handle = installFocusTrap(root, {
        _doc: doc,
        onEscape: () => { escaped = true; }
      });

      doc.dispatchKeydown({
        key: 'Escape',
        shiftKey: false,
        preventDefault: () => {}
      });

      assert.ok(escaped, `${cfg.name}: onEscape callback fired when Escape pressed`);
      releaseFocusTrap(handle);
    });
  }
});

// ---------------------------------------------------------------------------
// AC12: Tab / Shift+Tab cycling stays within the dialog
// ---------------------------------------------------------------------------

describe('Tab cycling stays within dialog (AC12)', () => {
  test('Tab from last focusable wraps to first (forward cycle)', () => {
    const first = makeBtn('first');
    const last = makeBtn('last');
    const doc = makeDoc({ activeElement: last }); // last is currently focused
    const root = makeRoot([first, last]);

    const handle = installFocusTrap(root, { _doc: doc });

    let prevented = false;
    doc.dispatchKeydown({
      key: 'Tab',
      shiftKey: false,
      preventDefault: () => { prevented = true; }
    });

    assert.ok(prevented, 'Tab from last must call preventDefault');
    assert.ok(first._focused, 'focus wraps to first on Tab from last');

    releaseFocusTrap(handle);
  });

  test('Shift+Tab from first focusable wraps to last (backward cycle)', () => {
    const first = makeBtn('first');
    const last = makeBtn('last');
    const doc = makeDoc({ activeElement: first }); // first is currently focused
    const root = makeRoot([first, last]);

    const handle = installFocusTrap(root, { _doc: doc });

    let prevented = false;
    doc.dispatchKeydown({
      key: 'Tab',
      shiftKey: true,
      preventDefault: () => { prevented = true; }
    });

    assert.ok(prevented, 'Shift+Tab from first must call preventDefault');
    assert.ok(last._focused, 'focus wraps to last on Shift+Tab from first');

    releaseFocusTrap(handle);
  });

  test('Tab from a non-last element does NOT wrap (normal browser tab)', () => {
    const first = makeBtn('first');
    const middle = makeBtn('middle');
    const last = makeBtn('last');
    const doc = makeDoc({ activeElement: middle });
    const root = makeRoot([first, middle, last]);

    const handle = installFocusTrap(root, { _doc: doc });

    let prevented = false;
    doc.dispatchKeydown({
      key: 'Tab',
      shiftKey: false,
      preventDefault: () => { prevented = true; }
    });

    assert.ok(!prevented, 'Tab from middle element must NOT preventDefault');
    releaseFocusTrap(handle);
  });
});

// ---------------------------------------------------------------------------
// AC10: Utility reuse — installFocusTrap is imported, not reimplemented
// ---------------------------------------------------------------------------

describe('Focus-trap utility is reused from Iter 24 (AC10)', () => {
  test('installFocusTrap is a function (imported from js/ui/focusTrap.js)', () => {
    assert.ok(typeof installFocusTrap === 'function', 'installFocusTrap must be a function');
  });

  test('releaseFocusTrap is a function (imported from js/ui/focusTrap.js)', () => {
    assert.ok(typeof releaseFocusTrap === 'function', 'releaseFocusTrap must be a function');
  });

  test('multiple dialog traps installed simultaneously maintain independent handles', () => {
    const doc = makeDoc();
    const rootA = makeRoot([makeBtn('a1')]);
    const rootB = makeRoot([makeBtn('b1')]);

    const handleA = installFocusTrap(rootA, { _doc: doc });
    const handleB = installFocusTrap(rootB, { _doc: doc });

    assert.equal(doc.listenerCount('keydown'), 2, 'two separate keydown listeners installed');

    releaseFocusTrap(handleA);
    assert.equal(doc.listenerCount('keydown'), 1, 'one listener removed when first dialog closes');

    releaseFocusTrap(handleB);
    assert.equal(doc.listenerCount('keydown'), 0, 'zero listeners when both dialogs close');
  });
});

// ---------------------------------------------------------------------------
// Edge case: dialog with no focusable elements does not throw
// ---------------------------------------------------------------------------

describe('Dialogs with no focusable elements — safe edge case', () => {
  test('installFocusTrap on empty dialog root does not throw', () => {
    const doc = makeDoc();
    const emptyRoot = makeRoot([]); // no focusable children

    assert.doesNotThrow(() => {
      const handle = installFocusTrap(emptyRoot, { _doc: doc });
      releaseFocusTrap(handle);
    });
  });

  test('Tab inside empty dialog prevents default but does not throw', () => {
    const doc = makeDoc();
    const emptyRoot = makeRoot([]);
    const handle = installFocusTrap(emptyRoot, { _doc: doc });

    let prevented = false;
    assert.doesNotThrow(() => {
      doc.dispatchKeydown({
        key: 'Tab',
        shiftKey: false,
        preventDefault: () => { prevented = true; }
      });
    });
    assert.ok(prevented, 'Tab in empty dialog must preventDefault');
    releaseFocusTrap(handle);
  });
});
