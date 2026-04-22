/**
 * router.js — hash-based SPA router (Sprint 4).
 *
 * Routes are keyed off `window.location.hash`. Each route maps to a page
 * render function (see `js/ui/pages/*`). The router itself is pure: it
 * takes a hash string and returns `{route, params}`. The `mount()` layer
 * subscribes to `hashchange` events and calls the router.
 *
 * Routes (MVP):
 *   #today      → active CycleCard or AutoPlanButton empty state
 *   #week       → placeholder "Ships in Sprint 5"
 *   #catalog    → placeholder
 *   #kaizen     → placeholder
 *   #insights   → placeholder
 *   #settings   → placeholder
 *
 * Unknown hashes default to `#today`.
 *
 * No runtime deps. No DOM access.
 */

/**
 * Canonical route names the MVP knows about. Anything outside this list
 * falls back to `today`.
 */
export const ROUTES = Object.freeze({
  TODAY: 'today',
  PORTFOLIO: 'portfolio',
  WEEK: 'week',
  CATALOG: 'catalog',
  KAIZEN: 'kaizen',
  INSIGHTS: 'insights',
  SETTINGS: 'settings'
});

// Portfolio is positioned 2nd (after Today) per Sprint 7 spec.
export const ROUTE_NAMES = Object.freeze([
  'today',
  'portfolio',
  'week',
  'catalog',
  'kaizen',
  'insights',
  'settings'
]);

const KNOWN = new Set(ROUTE_NAMES);

/**
 * Parse a hash string into `{route, params}`.
 *
 * Accepted forms:
 *   ''           → { route: 'today', params: {} }
 *   '#'          → { route: 'today', params: {} }
 *   '#today'     → { route: 'today', params: {} }
 *   '#week'      → { route: 'week',  params: {} }
 *   '#today/compose' → { route: 'today', params: { sub: 'compose' } }
 *
 * Unknown primary segments fall back to 'today'.
 *
 * @param {string} hash
 * @returns {{route: string, params: Record<string, string>}}
 */
export function parseHash(hash) {
  if (typeof hash !== 'string' || hash.length === 0 || hash === '#') {
    return { route: 'today', params: {} };
  }
  const stripped = hash.startsWith('#') ? hash.slice(1) : hash;
  if (stripped.length === 0) return { route: 'today', params: {} };

  const parts = stripped.split('/').filter((p) => p.length > 0);
  const primary = parts[0] ?? 'today';
  const route = KNOWN.has(primary) ? primary : 'today';
  /** @type {Record<string, string>} */
  const params = {};
  if (parts[1]) params.sub = parts[1];
  if (parts[2]) params.id = parts[2];
  return { route, params };
}

/**
 * Build a hash string from a `{route, params}`. Inverse of parseHash for
 * the happy path.
 *
 * @param {string} route
 * @param {{sub?: string, id?: string}} [params]
 * @returns {string}
 */
export function buildHash(route, params = {}) {
  if (!KNOWN.has(route)) {
    const err = new Error(`buildHash: unknown route '${route}'`);
    err.name = 'UNKNOWN_ROUTE';
    throw err;
  }
  let out = `#${route}`;
  if (params.sub) out += `/${params.sub}`;
  if (params.id) out += `/${params.id}`;
  return out;
}

/**
 * Route-change listener factory. Returns a function that reads
 * `locationProvider().hash`, parses it, and calls `onRoute(parsed)`.
 *
 * `locationProvider` defaults to `() => globalThis.location`. In Node
 * tests, pass a stub.
 *
 * @param {(parsed: {route: string, params: object}) => void} onRoute
 * @param {{locationProvider?: () => {hash: string}}} [opts]
 * @returns {() => void} listener; call it to re-read the hash
 */
export function createRouteListener(onRoute, opts = {}) {
  if (typeof onRoute !== 'function') {
    const err = new Error('createRouteListener: onRoute must be a function');
    err.name = 'INVALID_LISTENER';
    throw err;
  }
  const getLocation = opts.locationProvider ?? (() => globalThis.location);
  return function notify() {
    const loc = getLocation();
    const hash = (loc && typeof loc.hash === 'string') ? loc.hash : '';
    onRoute(parseHash(hash));
  };
}

export default {
  ROUTES,
  ROUTE_NAMES,
  parseHash,
  buildHash,
  createRouteListener
};
