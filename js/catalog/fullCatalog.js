/**
 * fullCatalog — unified 60-entry catalog accessor (Sprint 5 P0-T1).
 *
 * In Node (tests + build): `getFullCatalog()` runs the full
 * `buildCatalog()` pipeline (which reads the source Markdown via
 * node:fs). The result is cached in-module.
 *
 * In the browser: `getFullCatalog()` synchronously returns the static
 * JSON import at `./seed/fullCatalog.json`. The JSON is produced by
 * `exportFullCatalog.js` — run once whenever catalog inputs change.
 *
 * The `BROWSER_CATALOG` fallback (9-entry hacky seed) is preserved here
 * ONLY as a last-resort boot path for browsers that haven't yet loaded
 * the generated JSON. The browser bundler / vanilla <script type=module>
 * path should prefer `getFullCatalogSync()` which will read the JSON
 * on first call.
 *
 * This module is ES-module only; no runtime deps.
 */

import { BROWSER_CATALOG } from './browserSeed.js';

/** Module-level cache. Populated on first successful read. */
let _cached = null;

/**
 * Node-only loader: dynamically imports the seed pipeline. Returns the
 * full 60-entry catalog. Throws if the environment lacks `node:fs`
 * (i.e. the browser).
 *
 * @returns {Promise<Array<object>>}
 */
async function loadFromNodePipeline() {
  /* istanbul ignore next — only in Node */
  const mod = await import('./seed/index.js');
  return mod.buildCatalog();
}

/**
 * Load the JSON blob via fetch for browser consumption. Returns null if
 * the fetch fails (file not present, 404, network error).
 *
 * Why fetch and not `import(... { with: { type: 'json' } })`: import
 * attributes require a recent browser (Chrome 123+, Firefox 127+, Safari
 * 17.2+). When the import throws on older engines, the catch block
 * silently falls back to the 9-entry BROWSER_CATALOG stub and the user
 * sees a gutted Catalog page. Fetch works in every modern browser and
 * gives us an explicit status code to check.
 *
 * @returns {Promise<Array<object> | null>}
 */
async function loadFromJsonImport() {
  try {
    /* istanbul ignore next — browser / bundled only */
    const url = new URL('./seed/fullCatalog.json', import.meta.url);
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}

/**
 * Returns the full catalog. Async; works in both Node (uses the seed
 * pipeline) and the browser (reads the JSON bundle).
 *
 * @returns {Promise<Array<object>>}
 */
export async function getFullCatalog() {
  if (_cached) return _cached;
  const isNode =
    typeof process !== 'undefined' &&
    process.versions &&
    typeof process.versions.node === 'string';
  if (isNode) {
    _cached = await loadFromNodePipeline();
    return _cached;
  }
  const json = await loadFromJsonImport();
  if (json) {
    _cached = json;
    return _cached;
  }
  // Final fallback: ship the 9-entry browser seed so the app boots.
  _cached = BROWSER_CATALOG.map((c) => ({ ...c }));
  return _cached;
}

/**
 * Synchronous accessor for the cached catalog. Returns `null` if nothing
 * has been loaded yet. Callers should invoke `getFullCatalog()` once at
 * app boot, then use this for subsequent sync reads.
 *
 * @returns {Array<object> | null}
 */
export function getCachedCatalog() {
  return _cached;
}

/**
 * Test-only: reset the cache.
 *
 * @returns {void}
 */
export function __resetCache() {
  _cached = null;
}

export default getFullCatalog;
