/**
 * Boot path (E1-T6).
 *
 * On first load: create `bamx:v1:meta` with
 *   { schemaVersion: 1, createdAt: <ISO-now>, lastMigratedAt: null }
 * On subsequent loads: read the meta row and return it unchanged.
 *
 * This is intentionally minimal for Sprint 1. The migration runner
 * (E12-T3) plugs in later sprints — it will read `meta.schemaVersion`
 * and walk pending migrations forward-only.
 */

import { assertRepository } from './persistence/IRepository.js';

/** The single meta key. ARCHITECTURE §7.1. */
export const META_KEY = 'bamx:v1:meta';

/** MVP schema version. Bumped by migrations in later sprints. */
export const CURRENT_SCHEMA_VERSION = 1;

/**
 * @typedef {object} BamxMeta
 * @property {number} schemaVersion
 * @property {string} createdAt            // ISO timestamp
 * @property {string|null} lastMigratedAt  // ISO timestamp or null
 */

/**
 * Perform the Sprint-1 boot step. Idempotent: safe to call on every app load.
 *
 * @param {import('./persistence/IRepository.js').IRepository} repo
 * @param {{now?: () => Date}} [opts] Inject a clock for deterministic tests.
 * @returns {BamxMeta}
 */
export function boot(repo, { now = () => new Date() } = {}) {
  assertRepository(repo);
  const existing = repo.read(META_KEY);
  if (existing && typeof existing === 'object') {
    // Shape-validate the existing meta so a corrupted row fails fast.
    if (
      typeof existing.schemaVersion !== 'number' ||
      typeof existing.createdAt !== 'string'
    ) {
      const err = new Error(
        `boot: corrupted meta at '${META_KEY}' — missing required fields`
      );
      err.name = 'CORRUPT_META';
      throw err;
    }
    return /** @type {BamxMeta} */ (existing);
  }
  /** @type {BamxMeta} */
  const fresh = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    createdAt: now().toISOString(),
    lastMigratedAt: null
  };
  repo.write(META_KEY, fresh);
  return fresh;
}

export default boot;
