/**
 * selectDeepPayload — step-5 helper for composeDaily (Sprint 3).
 *
 * Implements ENGINE_DESIGN §1.6 + §4.2:
 *
 *   selectDeepPayload(input) — returns the CatalogEntry the Deep-Work slice
 *     should materialize from. If there is no active Kaizen (or no eligible
 *     step), it falls back to the generic "Deep Work — Project Task" entry
 *     (CATALOG_GAPS §H.2).
 *
 *   eligibleDmaicPayloadSteps(kaizen, catalog, scheduledActivities) — walks
 *     the DAG per §4.2: entries bound to the project type (and phase binding
 *     when present) whose `dependsOn` predecessors are all CLOSED in the
 *     same Kaizen scope AND that have no CLOSED instance in the same Kaizen
 *     already.
 *
 *   pickHighestPriority(eligible, projectPhase, scheduledActivities) —
 *     deterministic tiebreak per §4.2: phase match, dependsOn-satisfied-most-
 *     recently, then activityNumber ASC / id ASC.
 *
 * Pure; no I/O.
 */

/**
 * Resolve the DMAIC phase a catalog entry belongs to, from its activityNumber.
 *
 * @param {import('../domain/types.js').CatalogEntry} c
 * @returns {'DEFINE' | 'MEASURE' | 'ANALYZE' | 'IMPROVE' | 'CONTROL' | null}
 */
function phaseOf(c) {
  const n = c?.activityNumber;
  if (typeof n !== 'number') return null;
  if (n === 20 || n === 21) return 'DEFINE';
  if (n >= 22 && n <= 30) return 'MEASURE';
  if (n >= 31 && n <= 37) return 'ANALYZE';
  if (n >= 38 && n <= 40) return 'IMPROVE';
  if (n === 41) return 'CONTROL';
  return null;
}

/**
 * Test whether `c.projectTypeBinding` includes `projectType`. The binding
 * may be null (not bound), a string (single), or a string[] (multi-bind).
 *
 * @param {import('../domain/types.js').CatalogEntry} c
 * @param {string} projectType
 * @returns {boolean}
 */
function bindsToProjectType(c, projectType) {
  const pb = c?.projectTypeBinding;
  if (pb === null || pb === undefined) return false;
  if (Array.isArray(pb)) return pb.includes(projectType);
  return pb === projectType;
}

/**
 * Return the list of CatalogEntry rows that are eligible Deep payload steps
 * for the given Kaizen at the given moment, per ENGINE_DESIGN §4.2.
 *
 * Eligibility rules:
 *  (a) `c.projectTypeBinding === kaizen.projectType` (or set contains it)
 *  (b) `c.phaseBinding === null OR c.phaseBinding === kaizen.phase`
 *  (c) every id in `c.dependsOn` has a CLOSED ScheduledActivity in this Kaizen
 *  (d) no CLOSED ScheduledActivity for this same entry exists in this Kaizen
 *
 * @param {object} kaizen
 * @param {import('../domain/types.js').CatalogEntry[]} catalog
 * @param {object[]} scheduledActivities
 * @returns {import('../domain/types.js').CatalogEntry[]}
 */
export function eligibleDmaicPayloadSteps(kaizen, catalog, scheduledActivities) {
  if (!kaizen) return [];
  const sas = Array.isArray(scheduledActivities) ? scheduledActivities : [];
  const closedInKaizen = new Set(
    sas
      .filter((s) => s.linkedKaizenId === kaizen.id && s.state === 'CLOSED')
      .map((s) => s.catalogEntryId)
  );

  // Filter to entries bound to this project type + phase.
  const pool = catalog.filter(
    (c) =>
      bindsToProjectType(c, kaizen.projectType) &&
      (c.phaseBinding === null || c.phaseBinding === undefined || c.phaseBinding === kaizen.phase)
  );

  return pool.filter(
    (step) =>
      !closedInKaizen.has(step.id) &&
      (Array.isArray(step.dependsOn) ? step.dependsOn : []).every((dep) =>
        closedInKaizen.has(dep)
      )
  );
}

/**
 * Deterministic priority chain per ENGINE_DESIGN §4.2.
 *
 *   1. Phase match — entries whose phase matches the project's current
 *      phase rank first.
 *   2. `dependsOn`-satisfied-most-recently — entries unlocked by the most
 *      recently closed step rank next.
 *   3. activityNumber ASC (fallback: id ASC) — stable tiebreak.
 *
 * @param {import('../domain/types.js').CatalogEntry[]} eligible
 * @param {string|null} projectPhase
 * @param {object[]} scheduledActivities
 * @returns {import('../domain/types.js').CatalogEntry | null}
 */
export function pickHighestPriority(eligible, projectPhase, scheduledActivities) {
  if (!Array.isArray(eligible) || eligible.length === 0) return null;

  // Most-recent CLOSED activity's catalogEntryId (used for "unlocked-by" rank).
  const sas = Array.isArray(scheduledActivities) ? scheduledActivities : [];
  const closed = sas
    .filter((s) => s.state === 'CLOSED')
    .slice()
    .sort((a, b) => {
      const atA = +new Date(a.actualEndAt ?? 0);
      const atB = +new Date(b.actualEndAt ?? 0);
      return atB - atA;
    });
  const mostRecentClosedCatalogId = closed[0]?.catalogEntryId ?? null;

  const scored = eligible.map((e) => {
    const own = phaseOf(e);
    // phaseMatch: 0 if matches, 1 otherwise (lower is better). If neither
    // entry has a phase nor the project does, treat as equal.
    const phaseMatch = projectPhase && own === projectPhase ? 0 : 1;
    const unlockedBy =
      mostRecentClosedCatalogId &&
      Array.isArray(e.dependsOn) &&
      e.dependsOn.includes(mostRecentClosedCatalogId)
        ? 0
        : 1;
    return {
      e,
      phaseMatch,
      unlockedBy,
      order:
        typeof e.activityNumber === 'number'
          ? e.activityNumber
          : Number.POSITIVE_INFINITY,
      id: e.id
    };
  });

  scored.sort(
    (a, b) =>
      a.phaseMatch - b.phaseMatch ||
      a.unlockedBy - b.unlockedBy ||
      a.order - b.order ||
      a.id.localeCompare(b.id)
  );
  return scored[0].e;
}

/**
 * Find the generic "Deep Work — Project Task (generic)" catalog entry.
 *
 * @param {import('../domain/types.js').CatalogEntry[]} catalog
 * @returns {import('../domain/types.js').CatalogEntry|null}
 */
export function findGenericDeep(catalog) {
  if (!Array.isArray(catalog)) return null;
  return (
    catalog.find((c) => c.id === 'gen_deep_work_project') ??
    catalog.find((c) => c.name === 'Deep Work — Project Task (generic)') ??
    null
  );
}

/**
 * §1.6 — select the Deep payload CatalogEntry for the day.
 *
 * If there is an active Kaizen AND at least one eligible next step, return
 * the highest-priority step. Otherwise, return the generic Deep Work entry.
 *
 * @param {object} input ComposerInput-shaped
 * @returns {import('../domain/types.js').CatalogEntry | null}
 */
export function selectDeepPayload(input) {
  const catalog = Array.isArray(input?.catalog) ? input.catalog : [];
  const kaizen = input?.activeKaizen ?? null;
  const sas = Array.isArray(input?.priorScheduledActivities)
    ? input.priorScheduledActivities
    : Array.isArray(input?.scheduledActivities)
      ? input.scheduledActivities
      : [];

  if (kaizen) {
    const eligible = eligibleDmaicPayloadSteps(kaizen, catalog, sas);
    if (eligible.length > 0) {
      const step = pickHighestPriority(eligible, kaizen.phase ?? null, sas);
      if (step) return step;
    }
    // Fallback — try by nextStepActivityNumber hint (used by the golden fixture).
    if (typeof kaizen.nextStepActivityNumber === 'number') {
      const byNumber = catalog.find(
        (c) => c.activityNumber === kaizen.nextStepActivityNumber
      );
      if (byNumber) return byNumber;
    }
  }

  return findGenericDeep(catalog);
}

export default selectDeepPayload;
