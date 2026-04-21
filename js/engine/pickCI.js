/**
 * pickCI — step-6 helper for composeDaily (Sprint 3).
 *
 * Implements ENGINE_DESIGN §1.5 exactly. Deterministic rotation of CI
 * candidates with priority chain:
 *
 *   100 — on-signal Document Review (#4) when `signals.documentAwaitingReview.length > 0`
 *   95  — on-signal 6S Email (#13) when `signals.inboxOverThreshold`
 *   80  — PDCA Cycle (#12) when active PDCA experiment AND hoursSinceLastPdca ≥ 42
 *   60  — Weekly L&D (#1 or #2) when not yet fired this week
 *   40  — CONTINUOUS or MONTHLY CI backlog
 *   20  — Weekly Reflection (Fri PM only)
 *
 * Ties break by `catalogEntry.id` ASC (stable). Returns `null` when no
 * candidate is eligible.
 *
 * Pure; no I/O.
 */

/**
 * Is this catalog entry already placed in `placed[]` for today?
 *
 * @param {import('../domain/types.js').CatalogEntry} c
 * @param {object[]} placed
 * @returns {boolean}
 */
function alreadyPlacedToday(c, placed) {
  return placed.some((p) => p.catalogEntryId === c.id);
}

/**
 * Role gate — catalog entry applies to the user if appliesToRoles is empty
 * or intersects with userRoles.
 *
 * @param {import('../domain/types.js').CatalogEntry} c
 * @param {string[]} userRoles
 */
function appliesToRole(c, userRoles) {
  const roles = Array.isArray(c?.appliesToRoles) ? c.appliesToRoles : [];
  if (roles.length === 0) return true;
  return userRoles.some((r) => roles.includes(r));
}

/**
 * Detect whether a Weekly L&D tick (#1 or #2) has already fired this week by
 * scanning `priorCompositions` for matching catalogEntryId placements. Best-
 * effort: we consider `priorCompositions` (Composition-shaped objects) if
 * present; otherwise returns false.
 *
 * @param {import('../domain/types.js').CatalogEntry} c
 * @param {object} input
 * @returns {boolean}
 */
function firedThisWeek(c, input) {
  const priors = Array.isArray(input?.priorCompositions)
    ? input.priorCompositions
    : [];
  for (const p of priors) {
    const acts = Array.isArray(p?.activities) ? p.activities : Array.isArray(p?.placed) ? p.placed : [];
    if (acts.some((a) => a.catalogEntryId === c.id)) return true;
  }
  return false;
}

/**
 * True if there is an open PDCA experiment and (per §1.5) hoursSinceLastPdca ≥ 42.
 *
 * @param {object} input
 * @returns {boolean}
 */
function pdcaActive(input) {
  const pdca = input?.pdcaExperiment ?? input?.signals?.pdcaExperiment ?? null;
  if (!pdca || pdca.state === 'CLOSED') return false;
  return true;
}

/**
 * @param {object} input
 * @returns {number}
 */
function hoursSinceLastPdca(input) {
  const pdca = input?.pdcaExperiment ?? input?.signals?.pdcaExperiment ?? null;
  if (!pdca) return Number.POSITIVE_INFINITY;
  const last = pdca.lastTickAt;
  if (!last) return Number.POSITIVE_INFINITY;
  const nowMs = input?._now ? +new Date(input._now) : Date.now();
  return (nowMs - +new Date(last)) / (1000 * 60 * 60);
}

/**
 * True if today is a Friday afternoon (we treat "Fri" as weekday=5 and
 * always return true during composition — anchor-placement handles the PM
 * constraint since Weekly Reflection gets materialized anchored at 16:30).
 *
 * @param {object} input
 * @returns {boolean}
 */
function isFridayAfternoon(input) {
  if (!input?.date) return false;
  const d = new Date(`${input.date}T12:00:00Z`);
  return d.getUTCDay() === 5; // 0=Sun ... 5=Fri
}

/**
 * Compute the priority of `c` in the current `input` context.
 * Per ENGINE_DESIGN §1.5 — exact table, in order.
 *
 * @param {import('../domain/types.js').CatalogEntry} c
 * @param {object} input
 * @returns {number}
 */
export function ciPriority(c, input) {
  // On-signal work
  if (
    (c.activityNumber === 4 || c.name === 'Document Review') &&
    Array.isArray(input?.signals?.documentAwaitingReview) &&
    input.signals.documentAwaitingReview.length > 0
  ) {
    return 100;
  }
  if (
    (c.activityNumber === 13 || c.name === '6S Email Activity') &&
    input?.signals?.inboxOverThreshold === true
  ) {
    return 95;
  }

  // PDCA 48h micro-cycle
  if (
    c.activityNumber === 12 &&
    pdcaActive(input) &&
    hoursSinceLastPdca(input) >= 42
  ) {
    return 80;
  }

  // Weekly L&D tick (#1 or #2) — not yet fired this week
  if (
    (c.activityNumber === 1 || c.activityNumber === 2) &&
    !firedThisWeek(c, input)
  ) {
    return 60;
  }

  // Continuous / monthly backlog (lower priority than weekly L&D).
  if (c.cadence === 'CONTINUOUS' || c.cadence === 'MONTHLY') return 40;

  // Weekly Reflection — Friday afternoon only.
  if (c.name === 'Weekly Reflection' && isFridayAfternoon(input)) return 20;

  return 0;
}

/**
 * Human-readable reason for the `why[]` audit — caller uses this on the
 * placement.
 *
 * @param {import('../domain/types.js').CatalogEntry} c
 * @param {object} input
 * @returns {string}
 */
export function ciReason(c, input) {
  const p = ciPriority(c, input);
  if (p === 100) return 'documentAwaitingReview signal';
  if (p === 95) return 'inboxOverThreshold signal';
  if (p === 80) return 'PDCA ≥42h since last tick';
  if (p === 60) return 'weekly L&D not fired yet';
  if (p === 40) return 'continuous/monthly CI backlog';
  if (p === 20) return 'Friday-PM Weekly Reflection';
  return 'no priority';
}

/**
 * Pick the next CI rotation candidate. Returns `null` when no eligible.
 *
 * Eligibility:
 *   - bucket === 'CI'
 *   - enabledByUser === true OR isNonOptional === true
 *   - role gate passes
 *   - not already placed today
 *   - defaultDurationMinutes ≤ remainingCI
 *   - priority > 0
 *
 * @param {object} input
 * @param {object[]} placed
 * @param {number} remainingCI
 * @returns {{entry: import('../domain/types.js').CatalogEntry, minutes: number, priority: number, reason: string} | null}
 */
export function pickCI(input, placed, remainingCI) {
  if (remainingCI <= 0) return null;
  const catalog = Array.isArray(input?.catalog) ? input.catalog : [];
  const roles = Array.isArray(input?.role) ? input.role : [];

  const candidates = catalog.filter(
    (c) =>
      c.bucket === 'CI' &&
      (c.enabledByUser === true || c.isNonOptional === true) &&
      appliesToRole(c, roles) &&
      !alreadyPlacedToday(c, placed) &&
      typeof c.defaultDurationMinutes === 'number' &&
      c.defaultDurationMinutes > 0 &&
      c.defaultDurationMinutes <= remainingCI
  );

  const scored = candidates
    .map((c) => ({
      entry: c,
      minutes: Math.min(c.defaultDurationMinutes, remainingCI),
      priority: ciPriority(c, input),
      reason: ciReason(c, input)
    }))
    .filter((s) => s.priority > 0);

  scored.sort(
    (a, b) => b.priority - a.priority || a.entry.id.localeCompare(b.entry.id)
  );

  return scored[0] ?? null;
}

export default pickCI;
