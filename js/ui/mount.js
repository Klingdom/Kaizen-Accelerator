/**
 * mount.js — the ONLY module that touches the real DOM.
 *
 * Boundary rules (Sprint 4 hard constraint):
 *   - `document.querySelector`, `innerHTML`, `addEventListener` live ONLY
 *     in this file.
 *   - Components are pure functions returning HTML strings. The mount layer
 *     writes that string into a container.
 *   - Interactions are handled via event delegation: one `click` listener
 *     at the app root reads `data-action` + `data-payload-*` attributes
 *     and dispatches to a registry of handler functions.
 *
 * No runtime deps. No framework.
 */

/**
 * Parse a JSON-encoded `data-payload` attribute value, returning `{}` on
 * empty. Throws with a helpful message if parsing fails so typos surface.
 *
 * @param {string | null | undefined} raw
 * @returns {object}
 */
export function parseDataPayload(raw) {
  if (raw === null || raw === undefined || raw === '') return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed === null || typeof parsed !== 'object') {
      return { value: parsed };
    }
    return parsed;
  } catch (err) {
    const e = new Error(
      `mount.parseDataPayload: bad JSON in data-payload — ${err.message}`
    );
    e.name = 'INVALID_DATA_PAYLOAD';
    e.raw = raw;
    throw e;
  }
}

/**
 * Walk up from `target` until we find an element with `data-action`, or
 * hit the boundary `stopAt` (exclusive). Returns the first such element,
 * or null.
 *
 * @param {any} target        element to start from (duck-typed)
 * @param {any} stopAt        boundary element (exclusive); null for unbounded
 * @returns {any}
 */
export function findActionTarget(target, stopAt = null) {
  let node = target;
  while (node && node !== stopAt) {
    if (
      node.getAttribute &&
      typeof node.getAttribute === 'function' &&
      node.getAttribute('data-action')
    ) {
      return node;
    }
    node = node.parentNode ?? null;
  }
  return null;
}

/**
 * Read the `data-action` and `data-payload` off an element and return a
 * normalized `{action, payload}` record. Returns null if the element has
 * no `data-action`.
 *
 * @param {any} el
 * @returns {{action: string, payload: object} | null}
 */
export function readAction(el) {
  if (!el || typeof el.getAttribute !== 'function') return null;
  const action = el.getAttribute('data-action');
  if (!action) return null;
  const rawPayload = el.getAttribute('data-payload');
  return { action, payload: parseDataPayload(rawPayload) };
}

/**
 * Create an event-delegation dispatcher. Returns a function you can attach
 * as the single click listener at the app root. The dispatcher walks from
 * the event target up to the root, finds the nearest `data-action`
 * element, and invokes `handlers[action](payload, ctx)`.
 *
 * `handlers` is a plain object: `{ ACCEPT: (payload, ctx) => ..., ... }`.
 *
 * Unknown actions are logged to `ctx.onUnknownAction` (if provided) but do
 * NOT throw — prevents the whole page from breaking on a typo.
 *
 * @param {Record<string, (payload: object, ctx: object) => void>} handlers
 * @param {{root?: any, onUnknownAction?: (action: string) => void}} [opts]
 * @returns {(event: {target: any, preventDefault?: () => void}) => void}
 */
export function createDispatcher(handlers, opts = {}) {
  if (!handlers || typeof handlers !== 'object') {
    const err = new Error('createDispatcher: handlers object required');
    err.name = 'INVALID_HANDLERS';
    throw err;
  }
  const root = opts.root ?? null;
  const onUnknown = opts.onUnknownAction ?? null;
  return function dispatch(event) {
    if (!event || !event.target) return;
    const actionEl = findActionTarget(event.target, root?.parentNode ?? null);
    if (!actionEl) return;
    const parsed = readAction(actionEl);
    if (!parsed) return;
    const handler = handlers[parsed.action];
    if (typeof handler !== 'function') {
      if (onUnknown) onUnknown(parsed.action);
      return;
    }
    if (typeof event.preventDefault === 'function') {
      // Let the handler decide about default navigation for anchors.
      // We do NOT preventDefault by default — buttons don't need it.
    }
    handler(parsed.payload, { element: actionEl, event });
  };
}

// ---------------------------------------------------------------------------
// Real-DOM mount helpers. ONLY call these from `js/app.js`.
// ---------------------------------------------------------------------------

/**
 * Render an HTML string into a container element by id. Uses `innerHTML`
 * deliberately — components are pure string producers and the whole tree
 * is re-rendered on each state change.
 *
 * MUST be called only from `js/app.js`. Other modules consume components
 * directly (they receive the string and never touch the DOM).
 *
 * @param {string} containerId
 * @param {string} html
 */
export function mountHtml(containerId, html) {
  /* istanbul ignore next — real DOM only */
  if (typeof document === 'undefined') {
    const err = new Error('mountHtml: document is undefined (not running in a browser)');
    err.name = 'NO_DOCUMENT';
    throw err;
  }
  const el = document.getElementById(containerId);
  if (!el) {
    const err = new Error(`mountHtml: no element with id '${containerId}'`);
    err.name = 'MOUNT_TARGET_MISSING';
    throw err;
  }
  el.innerHTML = html;
}

/**
 * Attach a single click listener at the app root that uses event
 * delegation. Returns the dispatcher (for manual testing / unsubscribe
 * in SPA navigation scenarios).
 *
 * @param {string} rootId
 * @param {Record<string, (payload: object, ctx: object) => void>} handlers
 */
export function attachRootClickListener(rootId, handlers) {
  /* istanbul ignore next — real DOM only */
  if (typeof document === 'undefined') {
    const err = new Error('attachRootClickListener: document is undefined');
    err.name = 'NO_DOCUMENT';
    throw err;
  }
  const root = document.getElementById(rootId);
  if (!root) {
    const err = new Error(`attachRootClickListener: no element with id '${rootId}'`);
    err.name = 'MOUNT_TARGET_MISSING';
    throw err;
  }
  const dispatcher = createDispatcher(handlers, { root });
  root.addEventListener('click', dispatcher);
  return dispatcher;
}

/**
 * HTML-escape a string for safe interpolation into a template literal.
 * Covers the 5 characters that break HTML attribute and text contexts.
 *
 * Every component that interpolates user-or-repo data MUST pass it
 * through `esc()`. Numeric values should be `esc(String(n))`.
 *
 * @param {string | null | undefined} s
 * @returns {string}
 */
export function esc(s) {
  if (s === null || s === undefined) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default {
  parseDataPayload,
  findActionTarget,
  readAction,
  createDispatcher,
  mountHtml,
  attachRootClickListener,
  esc
};
