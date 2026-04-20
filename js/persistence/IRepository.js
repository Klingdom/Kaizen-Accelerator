/**
 * IRepository — documented repository interface contract (E1-T5).
 *
 * Sprint 1 ships the MVP `LocalStorageRepository` implementation. In later
 * work the Postgres adapter will implement the same interface. Services
 * compile against THIS interface only; never against `LocalStorageRepository`
 * concretely.
 *
 * The interface is expressed as a JSDoc `@typedef` plus a runtime
 * `assertRepository(repo)` helper that checks every required method exists.
 * That's enough for MVP dependency-injection: services call
 * `assertRepository(repo)` in their constructor and fail fast on a bad wire.
 *
 * Semantics (ARCHITECTURE §7.1):
 *  - `read(key): any`                       — returns parsed JSON or null.
 *  - `write(key, value): void`              — stores JSON-stringified value.
 *  - `upsert(mapKey, id, obj): void`        — insert or overwrite in a keyed map.
 *  - `appendOnly(mapKey, id, obj): void`    — insert only; overwrite throws
 *                                             an Error with name 'APPEND_ONLY_VIOLATION'.
 *  - `exportAll(): object`                  — snapshot of every bamx:v1:* key.
 *  - `importAll(blob): void`                — replace every bamx:v1:* key from blob.
 *
 * Methods 5 and 6 are Sprint-2/E12 stubs; see E12-T4 in DELIVERY_PLAN.md.
 * The interface declares them so Sprint 2 has a stable contract to grow into.
 */

/**
 * @typedef {object} IRepository
 * @property {(key: string) => any} read
 * @property {(key: string, value: any) => void} write
 * @property {(mapKey: string, id: string, obj: any) => void} upsert
 * @property {(mapKey: string, id: string, obj: any) => void} appendOnly
 * @property {() => Record<string, any>} exportAll
 * @property {(blob: Record<string, any>) => void} importAll
 */

/** Required method names on any IRepository implementation. */
export const REQUIRED_METHODS = Object.freeze([
  'read',
  'write',
  'upsert',
  'appendOnly',
  'exportAll',
  'importAll'
]);

/**
 * Methods services compile against directly in Sprint 1. Sprint 2 services
 * will add `exportAll` / `importAll` consumption (E12).
 */
export const CORE_METHODS = Object.freeze([
  'read',
  'write',
  'upsert',
  'appendOnly'
]);

/**
 * Throws a named Error if `repo` is missing any required method.
 *
 * Error.name = 'NOT_A_REPOSITORY' so tests can assert on name.
 *
 * @param {IRepository|any} repo
 * @param {{strict?: boolean}} [opts] If strict (default false), checks all 6
 *   methods including exportAll/importAll. Otherwise checks only CORE_METHODS.
 * @returns {IRepository} the same repo, for chaining.
 */
export function assertRepository(repo, { strict = false } = {}) {
  if (repo === null || repo === undefined || typeof repo !== 'object') {
    const err = new Error('assertRepository: repo must be a non-null object');
    err.name = 'NOT_A_REPOSITORY';
    throw err;
  }
  const required = strict ? REQUIRED_METHODS : CORE_METHODS;
  const missing = required.filter((m) => typeof repo[m] !== 'function');
  if (missing.length > 0) {
    const err = new Error(
      `assertRepository: repo missing method(s): ${missing.join(', ')}`
    );
    err.name = 'NOT_A_REPOSITORY';
    // @ts-ignore — attach detail for inspection
    err.missing = missing;
    throw err;
  }
  return repo;
}

export default { assertRepository, REQUIRED_METHODS, CORE_METHODS };
