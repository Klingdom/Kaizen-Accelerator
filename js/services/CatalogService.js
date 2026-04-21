/**
 * CatalogService (E2-T9).
 *
 * Responsibilities:
 *   - `list(userId)`                     — return the user's catalog view.
 *   - `toggleEnabled(id, userId)`        — flip `enabledByUser`; reject on
 *                                          non-optional entries.
 *   - `validateDag(catalog?)`            — verify the `dependsOn` edges form
 *                                          a DAG (no cycles, no dangling refs).
 *
 * Storage: reads / writes `bamx:v1:catalog` through the repo. For MVP the
 * catalog is seeded at boot (by a future boot task wired in Sprint 3+) and
 * then user-specific toggles live in the same map on the entry's
 * `enabledByUser` field — single-user MVP, so no per-user overlay key is
 * needed yet.
 *
 * Pure service: side effects ONLY on `repo`. No module-level state.
 */

export const CATALOG_KEY = 'bamx:v1:catalog';

/**
 * Raise a named error.
 *
 * @param {string} name
 * @param {string} message
 * @param {object} [detail]
 * @returns {never}
 */
function fail(name, message, detail) {
  const err = new Error(message);
  err.name = name;
  if (detail) {
    // Guard: a detail.name would clobber the error name via Object.assign.
    // Skip the `name` key if present — callers should use a different key.
    for (const [k, v] of Object.entries(detail)) {
      if (k === 'name') continue;
      err[k] = v;
    }
  }
  throw err;
}

/**
 * Cycle-detecting topological sort. Returns `{ok, cycle}` where `cycle` is
 * the id chain of the first detected cycle (if any).
 *
 * @param {Array<{id: string, dependsOn: string[]}>} nodes
 * @returns {{ok: true} | {ok: false, cycle: string[]}}
 */
function topoSort(nodes) {
  const byId = new Map(nodes.map((n) => [n.id, n]));

  const WHITE = 0; // unvisited
  const GRAY = 1;  // on current stack
  const BLACK = 2; // fully processed
  const color = new Map(nodes.map((n) => [n.id, WHITE]));
  const parent = new Map();

  /**
   * @param {string} id
   * @returns {string[] | null}
   */
  function dfs(id) {
    color.set(id, GRAY);
    const node = byId.get(id);
    if (node) {
      for (const dep of node.dependsOn ?? []) {
        if (!byId.has(dep)) {
          fail('DAG_UNRESOLVED_REF', `catalog entry '${id}' dependsOn missing '${dep}'`, {
            id,
            dep
          });
        }
        const depColor = color.get(dep);
        if (depColor === GRAY) {
          // Build cycle chain.
          const chain = [dep];
          let cur = id;
          while (cur && cur !== dep) {
            chain.push(cur);
            cur = parent.get(cur);
          }
          chain.push(dep);
          return chain.reverse();
        }
        if (depColor === WHITE) {
          parent.set(dep, id);
          const c = dfs(dep);
          if (c) return c;
        }
      }
    }
    color.set(id, BLACK);
    return null;
  }

  for (const n of nodes) {
    if (color.get(n.id) === WHITE) {
      const cycle = dfs(n.id);
      if (cycle) return { ok: false, cycle };
    }
  }
  return { ok: true };
}

export class CatalogService {
  /**
   * @param {{
   *   repo: import('../persistence/IRepository.js').IRepository,
   *   eventBus?: {publish: (name: string, payload: any) => void}
   * }} deps
   */
  constructor({ repo, eventBus }) {
    if (!repo) fail('INVALID_DEPS', 'CatalogService: repo is required');
    this._repo = repo;
    this._eventBus = eventBus ?? null;
  }

  /**
   * Seed the catalog map. Idempotent: overwrites the existing catalog key.
   * Validates the DAG before persisting.
   *
   * @param {import('../domain/types.js').CatalogEntry[]} catalog
   */
  seed(catalog) {
    if (!Array.isArray(catalog)) {
      fail('INVALID_SEED', 'CatalogService.seed: catalog must be an array');
    }
    const check = this.validateDag(catalog);
    if (!check.ok) {
      fail('DAG_CYCLE', `CatalogService.seed: DAG cycle detected: ${check.cycle.join(' → ')}`, {
        cycle: check.cycle
      });
    }
    // Flatten array to id-keyed map for the storage key layout.
    const map = {};
    for (const e of catalog) {
      if (!e.id || typeof e.id !== 'string') {
        fail('INVALID_ENTRY', 'CatalogService.seed: every entry must have a string id');
      }
      if (map[e.id]) {
        fail('DUPLICATE_ID', `CatalogService.seed: duplicate entry id '${e.id}'`, { id: e.id });
      }
      map[e.id] = e;
    }
    this._repo.write(CATALOG_KEY, map);
  }

  /**
   * Return the user's catalog view. MVP is single-user — `userId` is accepted
   * for forward compatibility with role-based filtering but does not affect
   * the read. Entries with `enabledByUser=false` are still returned; the
   * consumer (e.g. composer) filters as needed.
   *
   * @param {string} _userId
   * @returns {import('../domain/types.js').CatalogEntry[]}
   */
  list(_userId) {
    const map = this._repo.read(CATALOG_KEY) ?? {};
    return Object.values(map);
  }

  /**
   * Toggle `enabledByUser` on the entry with id `entryId`. Rejects when the
   * entry is non-optional (cannot be disabled — locked by
   * ENGINE_DESIGN §3.4 / PRODUCT_BLUEPRINT §3.4) AND the target flip is to
   * `false`. Flipping to `true` is always allowed.
   *
   * Returns the updated entry.
   *
   * @param {string} entryId
   * @param {string} _userId
   * @returns {import('../domain/types.js').CatalogEntry}
   */
  toggleEnabled(entryId, _userId) {
    const map = this._repo.read(CATALOG_KEY) ?? {};
    const entry = map[entryId];
    if (!entry) {
      fail('ENTRY_NOT_FOUND', `CatalogService.toggleEnabled: no entry with id '${entryId}'`, {
        entryId
      });
    }
    const newValue = !entry.enabledByUser;
    if (newValue === false && entry.isNonOptional === true) {
      fail(
        'NON_OPTIONAL_DISABLE',
        `CatalogService.toggleEnabled: cannot disable non-optional entry '${entryId}'`,
        // NOTE: don't put `name` in the detail — Object.assign would clobber
        // err.name with this entry's display name. Use `entryName` instead.
        { entryId, entryName: entry.name }
      );
    }
    const updated = { ...entry, enabledByUser: newValue };
    map[entryId] = updated;
    this._repo.write(CATALOG_KEY, map);
    return updated;
  }

  /**
   * Validate the `dependsOn` graph is a DAG. Returns `{ok:true}` on clean
   * graph, else `{ok:false, cycle:[id,...]}`.
   *
   * Accepts an explicit catalog array (for seed-time validation before
   * writing) OR reads from the repo (for post-seed re-checks).
   *
   * @param {import('../domain/types.js').CatalogEntry[]} [catalog]
   * @returns {{ok: true} | {ok: false, cycle: string[]}}
   */
  validateDag(catalog) {
    const source = catalog ?? this.list();
    const nodes = source.map((e) => ({
      id: e.id,
      dependsOn: Array.isArray(e.dependsOn) ? e.dependsOn : []
    }));
    return topoSort(nodes);
  }
}

export default CatalogService;
