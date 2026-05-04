/**
 * focusTrap.js — WCAG §2.1.2 keyboard-focus containment utility.
 *
 * Provides two exports:
 *   installFocusTrap(rootEl, options?) → handle
 *   releaseFocusTrap(handle)
 *
 * The handle is an opaque object. Callers must store it and pass it to
 * releaseFocusTrap when the drawer/modal closes, otherwise the keydown
 * listener will leak.
 *
 * Behaviour:
 *   - Saves the currently-focused element before installation.
 *   - Moves focus to the first focusable element inside rootEl.
 *   - Intercepts Tab and Shift+Tab to cycle focus within rootEl.
 *   - releaseFocusTrap removes the listener and restores focus to the
 *     saved trigger element (falls back to document.body).
 *
 * Edge cases handled:
 *   - No focusable elements: does not throw; focus stays wherever it was.
 *   - rootEl is null/undefined: install is a no-op, release is a no-op.
 *   - Multiple installs without releases: each returns its own handle;
 *     releasing one handle does not affect others.
 *
 * Testability:
 *   The optional `_doc` parameter lets tests inject a document stub. When
 *   omitted it falls back to the global `document` (browser-only).
 */

/** @typedef {{ _listener: ((ev: KeyboardEvent) => void) | null, _savedFocus: Element | null, _root: Element | null, _doc: object | null }} FocusTrapHandle */

/**
 * CSS selector for elements that can receive keyboard focus in normal
 * browser tab order (not disabled, not inert, not hidden).
 */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(', ');

/**
 * Return the live list of focusable elements inside rootEl, filtered to
 * those that are visible (offsetParent check covers display:none subtrees;
 * this is intentionally a best-effort heuristic suitable for drawer overlays
 * that are already in the visible DOM when the trap installs).
 *
 * @param {Element | null | undefined} rootEl
 * @returns {Element[]}
 */
export function getFocusableElements(rootEl) {
  if (!rootEl || typeof rootEl.querySelectorAll !== 'function') return [];
  const candidates = Array.from(rootEl.querySelectorAll(FOCUSABLE_SELECTOR));
  // Filter out elements that are visually hidden.
  return candidates.filter((el) => {
    if (typeof el.offsetParent !== 'undefined' && el.offsetParent === null) {
      // Allow position:fixed elements (e.g. sticky headers inside drawers).
      const style = typeof getComputedStyle === 'function'
        ? getComputedStyle(el)
        : null;
      if (!style || style.position !== 'fixed') return false;
    }
    return true;
  });
}

/**
 * Install a focus trap on rootEl.
 *
 * @param {Element | null | undefined} rootEl  The drawer/modal root element.
 * @param {{
 *   onEscape?: () => void,
 *   _doc?: object
 * }} [options]
 *   onEscape — optional callback invoked when Escape is pressed inside the
 *              trap. The trap does NOT release itself; the caller decides.
 *   _doc     — injectable document object for unit tests (omit in production).
 * @returns {FocusTrapHandle}
 */
export function installFocusTrap(rootEl, options = {}) {
  // Resolve the document: injected stub or real global.
  const doc = options._doc ?? (typeof document !== 'undefined' ? document : null);

  // Capture saved focus BEFORE we move focus anywhere.
  const savedFocus = (doc && doc.activeElement) || null;

  /** @type {FocusTrapHandle} */
  const handle = {
    _listener: null,
    _savedFocus: savedFocus,
    _root: rootEl ?? null,
    _doc: doc
  };

  if (!rootEl || typeof rootEl.querySelectorAll !== 'function') {
    return handle; // no-op handle; release will still restore focus safely
  }

  // Move focus to first focusable element.
  const focusables = getFocusableElements(rootEl);
  if (focusables.length > 0 && typeof focusables[0].focus === 'function') {
    focusables[0].focus();
  }

  const listener = (ev) => {
    if (ev.key === 'Escape') {
      if (typeof options.onEscape === 'function') {
        options.onEscape();
      }
      return;
    }

    if (ev.key !== 'Tab') return;

    // Re-query each time so dynamically added elements are respected.
    const els = getFocusableElements(rootEl);
    if (els.length === 0) {
      ev.preventDefault();
      return;
    }

    const first = els[0];
    const last = els[els.length - 1];

    // Read active element from the injected or real document.
    const active = doc ? doc.activeElement : null;

    if (ev.shiftKey) {
      // Shift+Tab from first → wrap to last.
      if (active === first) {
        ev.preventDefault();
        if (typeof last.focus === 'function') last.focus();
      }
    } else {
      // Tab from last → wrap to first.
      if (active === last) {
        ev.preventDefault();
        if (typeof first.focus === 'function') first.focus();
      }
    }
  };

  handle._listener = listener;

  if (doc && typeof doc.addEventListener === 'function') {
    doc.addEventListener('keydown', listener, true); // capture phase
  }

  return handle;
}

/**
 * Release a focus trap installed by installFocusTrap. Removes the keydown
 * listener and restores focus to the previously-focused element.
 *
 * @param {FocusTrapHandle | null | undefined} handle
 */
export function releaseFocusTrap(handle) {
  if (!handle) return;

  const doc = handle._doc;

  if (handle._listener && doc && typeof doc.removeEventListener === 'function') {
    doc.removeEventListener('keydown', handle._listener, true);
    handle._listener = null;
  }

  // Restore focus.
  const target = handle._savedFocus;
  if (target && typeof target.focus === 'function') {
    try {
      const inDom = doc && typeof doc.contains === 'function'
        ? doc.contains(target)
        : true; // if we can't check, optimistically try to focus
      if (inDom) {
        target.focus();
      } else {
        // Fallback to body or main.
        const fallback = doc
          ? (doc.querySelector?.('main') ?? doc.body ?? null)
          : null;
        if (fallback && typeof fallback.focus === 'function') {
          fallback.focus();
        }
      }
    } catch (_e) {
      // Swallow any DOM exceptions during teardown (e.g. detached iframes).
    }
  }

  handle._savedFocus = null;
  handle._root = null;
  handle._doc = null;
}
