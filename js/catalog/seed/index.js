/**
 * Catalog seed orchestrator (E2 — assembles T2..T8).
 *
 * Runs the seed pipeline in a deterministic order:
 *   1. Parse 49 numbered rows from the source file           (source50)
 *   2. Add 6 ceremonies + 5 generics                          (ceremoniesAndGenerics)
 *   3. Apply §A–§D content fills                              (fillGaps)
 *   4. Apply §E bulk-fill defaults                            (bulkFill)
 *   5. Apply §H.1 bucket mapping                              (bucketMap)
 *   6. Flip isNonOptional=true on the locked set              (markNonOptional)
 *   7. Apply §J DMAIC + §K.4 Kaizen DAG edges                 (dmaicDag)
 *   8. Stamp projectTypeBinding on DMAIC / Kaizen rows         (projectTypeBindings — Sprint 9)
 *
 * Output: a fully-populated array of `CatalogEntry` rows, ready for
 * `CatalogService` to persist. Every row has all 9 PRODUCT_BLUEPRINT §3.1
 * fields + bucket + isNonOptional + dependsOn + projectTypeBinding.
 *
 * Pure function; no I/O beyond the source-file read (node:fs in source50).
 */

import { parseSource50 } from './source50.js';
import { buildCeremoniesAndGenerics } from './ceremoniesAndGenerics.js';
import { applyFillGaps } from './fillGaps.js';
import { applyBulkFill } from './bulkFill.js';
import { applyBucketMap } from './bucketMap.js';
import { applyMarkNonOptional } from './markNonOptional.js';
import { applyDmaicDag } from './dmaicDag.js';
import { applyProjectTypeBindings } from './projectTypeBindings.js';
import { applyProcedureNormalization } from './normalizeProcedures.js';

/**
 * Build the fully-populated catalog. Accepts the source file path (for
 * tests that want to pin a fixture path).
 *
 * Total output size: 49 (numbered rows, no #17) + 6 ceremonies + 5 generics
 * = **60 entries**.
 *
 * @param {{sourceFilePath?: string}} [opts]
 * @returns {import('../../domain/types.js').CatalogEntry[]}
 */
export function buildCatalog(opts = {}) {
  const numbered = parseSource50(opts);
  const cerAndGen = buildCeremoniesAndGenerics();

  // Combine and run the fill pipeline in order.
  let catalog = [...numbered, ...cerAndGen];
  catalog = applyFillGaps(catalog);
  catalog = applyBulkFill(catalog);
  catalog = applyBucketMap(catalog);
  catalog = applyMarkNonOptional(catalog);
  catalog = applyDmaicDag(catalog);
  catalog = applyProjectTypeBindings(catalog);
  catalog = applyProcedureNormalization(catalog);

  return catalog;
}

/**
 * Expected row count: 49 numbered (no #17) + 6 ceremonies + 5 generics.
 */
export const EXPECTED_CATALOG_SIZE = 60;

export default buildCatalog;
