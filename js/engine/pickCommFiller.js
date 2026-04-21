/**
 * pickCommFiller — step-7 helper for composeDaily (Sprint 3).
 *
 * Implements ENGINE_DESIGN §1.2 step 7:
 *   - Wed/Thu → 1:1 (#16 "Connecting w/ teammates")
 *   - Other weekdays → team meeting (#15 "High-value team meetings")
 *   - Generic Value-Added Communication (§H.2) fallback.
 *
 * Deterministic tiebreak: catalog id ASC. Returns `null` when no candidate
 * is eligible (remainingCOMM too small, all gated out, etc.).
 *
 * Pure; no I/O.
 */

/**
 * @param {object} c
 * @param {object[]} placed
 * @returns {boolean}
 */
function alreadyPlacedToday(c, placed) {
  return placed.some((p) => p.catalogEntryId === c.id);
}

/**
 * Return 0..6 weekday for the given date (0=Sun..6=Sat). We read the date
 * as UTC midday to avoid DST edge effects.
 *
 * @param {string} iso
 * @returns {number}
 */
function dowFor(iso) {
  if (!iso) return -1;
  return new Date(`${iso}T12:00:00Z`).getUTCDay();
}

/**
 * @param {import('../domain/types.js').CatalogEntry} c
 * @param {string[]} userRoles
 * @returns {boolean}
 */
function appliesToRole(c, userRoles) {
  const roles = Array.isArray(c?.appliesToRoles) ? c.appliesToRoles : [];
  if (roles.length === 0) return true;
  return userRoles.some((r) => roles.includes(r));
}

/**
 * Pick a COMMUNICATION filler candidate for today.
 *
 * Priority:
 *   - 70 — named 1:1 (#16 Connecting w/ teammates) on Wed/Thu
 *   - 50 — team meeting (#15 High-value team meetings) otherwise
 *   - 10 — generic Value-Added Communication (fallback)
 *
 * @param {object} input
 * @param {object[]} placed
 * @param {number} remainingComm
 * @returns {{entry: object, minutes: number, priority: number, reason: string}|null}
 */
export function pickCommFiller(input, placed, remainingComm) {
  if (remainingComm <= 0) return null;
  const catalog = Array.isArray(input?.catalog) ? input.catalog : [];
  const roles = Array.isArray(input?.role) ? input.role : [];
  const dow = dowFor(input?.date);

  /** @type {{entry: any, minutes: number, priority: number, reason: string}[]} */
  const scored = [];

  for (const c of catalog) {
    if (c.bucket !== 'COMMUNICATION') continue;
    if (!(c.enabledByUser === true || c.isNonOptional === true)) continue;
    if (!appliesToRole(c, roles)) continue;
    if (alreadyPlacedToday(c, placed)) continue;
    if (typeof c.defaultDurationMinutes !== 'number' || c.defaultDurationMinutes <= 0) continue;

    const minutes = Math.min(c.defaultDurationMinutes, remainingComm);
    if (minutes < 15) continue; // must fit at least a 15-min atomic block

    // Priority mapping
    let priority = 0;
    let reason = '';
    const isOneOnOne = c.activityNumber === 16 || c.name === 'Connecting w/ teammates';
    const isTeamMeeting = c.activityNumber === 15 || c.name === 'High-value team meetings';
    const isGeneric = c.id === 'gen_value_added_communication';

    if (isOneOnOne && (dow === 3 || dow === 4)) {
      priority = 70;
      reason = '1:1 on Wed/Thu anchor';
    } else if (isTeamMeeting) {
      priority = 50;
      reason = 'team meeting weekday default';
    } else if (isGeneric) {
      priority = 10;
      reason = 'generic Value-Added Communication fallback';
    }

    if (priority > 0) {
      scored.push({ entry: c, minutes, priority, reason });
    }
  }

  scored.sort((a, b) => b.priority - a.priority || a.entry.id.localeCompare(b.entry.id));
  return scored[0] ?? null;
}

export default pickCommFiller;
