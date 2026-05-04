#!/usr/bin/env node
/**
 * exportFullCatalog — Node build script (P0-T1 Sprint 5).
 *
 * Runs the full 7-stage seed pipeline (source50 → ceremoniesAndGenerics
 * → fillGaps → bulkFill → bucketMap → markNonOptional → dmaicDag) and
 * writes the result to `js/catalog/seed/fullCatalog.json`.
 *
 * Usage:
 *   node js/catalog/seed/exportFullCatalog.js
 *   node js/catalog/seed/exportFullCatalog.js --out path/to/out.json
 *
 * Run manually once per catalog change. The file it produces is the
 * browser's static catalog import — `js/catalog/fullCatalog.js` reads it
 * at load time with `import ... with { type: 'json' }`.
 *
 * Node-only. Never imported in the browser.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { buildCatalog, EXPECTED_CATALOG_SIZE } from './index.js';

/**
 * Resolve the default output path. Relative to THIS file.
 *
 * @returns {string}
 */
function defaultOutPath() {
  const here = dirname(fileURLToPath(import.meta.url));
  return resolve(here, 'fullCatalog.json');
}

/**
 * Build the catalog, validate its size and DAG, and write it as pretty
 * JSON to `outPath`. Returns the count of entries written.
 *
 * @param {{outPath?: string}} [opts]
 * @returns {number}
 */
export function exportFullCatalog(opts = {}) {
  const outPath = opts.outPath ?? defaultOutPath();
  const catalog = buildCatalog();
  if (catalog.length !== EXPECTED_CATALOG_SIZE) {
    const err = new Error(
      `exportFullCatalog: got ${catalog.length} entries, expected ${EXPECTED_CATALOG_SIZE}`
    );
    err.name = 'CATALOG_SIZE_MISMATCH';
    throw err;
  }
  // Sanity: every entry has the fields the browser will consume.
  // Iter 26: recovery_lunch has bucket===null intentionally (capacity-neutral
  // sentinel). Allow null bucket for that entry only.
  const missing = [];
  for (const e of catalog) {
    if (typeof e.id !== 'string') missing.push(`${e.id}.id`);
    if (e.id !== 'recovery_lunch' && typeof e.bucket !== 'string') missing.push(`${e.id}.bucket`);
    if (typeof e.isNonOptional !== 'boolean') missing.push(`${e.id}.isNonOptional`);
    if (!Array.isArray(e.dependsOn)) missing.push(`${e.id}.dependsOn`);
  }
  if (missing.length > 0) {
    const err = new Error(
      `exportFullCatalog: required fields missing — ${missing.join(', ')}`
    );
    err.name = 'CATALOG_FIELD_MISSING';
    throw err;
  }

  mkdirSync(dirname(outPath), { recursive: true });
  const json = JSON.stringify(catalog, null, 2);
  writeFileSync(outPath, json + '\n', 'utf8');
  return catalog.length;
}

// Run when invoked directly.
/* istanbul ignore next — CLI entry */
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('exportFullCatalog.js')) {
  try {
    const argIdx = process.argv.indexOf('--out');
    const outPath = argIdx >= 0 ? process.argv[argIdx + 1] : undefined;
    const n = exportFullCatalog(outPath ? { outPath } : undefined);
    // eslint-disable-next-line no-console
    console.log(`exportFullCatalog: wrote ${n} entries`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`exportFullCatalog: ${err.name}: ${err.message}`);
    process.exit(1);
  }
}

export default exportFullCatalog;
