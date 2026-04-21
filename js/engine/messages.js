/**
 * messages — invariant violation message formatter (E4-T6).
 *
 * Implements ENGINE_DESIGN §2.5 + UX_FLOWS §4.3 verbatim text templates.
 * Given a `{failureCode, detail}` payload (as returned by validateComposition),
 * produces the exact inline string the UI renders above the Accept button.
 *
 * Pure; no I/O.
 */

/**
 * Format an invariant violation message.
 *
 * @param {{failureCode: string, detail: object}} result
 * @returns {string}
 */
export function formatInvariantMessage({ failureCode, detail } = {}) {
  if (!failureCode) return '';
  const d = detail ?? {};
  switch (failureCode) {
    case 'DEEP_UNDER_FLOOR':
      return `PROJECT bucket is ${d.actual} min, needs ≥ ${d.floor}. Move an activity to PROJECT or replace a Communication block.`;
    case 'COMM_UNDER_FLOOR':
      return `COMMUNICATION bucket is ${d.actual} min, needs ≥ ${d.floor}. Add a 1:1 or a team meeting.`;
    case 'CI_UNDER_FLOOR':
      return `CI bucket is ${d.actual} min, needs ≥ ${d.floor}. Add a PDCA tick or L&D block.`;
    case 'PROJECT_OVERPACKED':
      return `PROJECT is ${d.actual} min, ceiling is ${d.ceiling}. Remove a block or shorten one.`;
    case 'COMM_OVERPACKED':
      return `COMMUNICATION is ${d.actual} min, ceiling is ${d.ceiling}. Remove a meeting or shorten one.`;
    case 'CI_OVERPACKED':
      return `CI is ${d.actual} min, ceiling is ${d.ceiling}. Remove a CI block or shorten one.`;
    case 'NON_OPTIONAL_MISSING':
      return `Missing: [${Array.isArray(d.missing) ? d.missing.join(', ') : ''}]. The day can't save without it. Re-add from Catalog.`;
    case 'OVER_CAPACITY':
      return `Day totals ${d.total} min, your capacity is ${d.cap}. Remove ${d.overBy} min.`;
    case 'WEEKLY_PROJECT_UNDER_FLOOR':
      return `Week has ${d.projectMinutes} PROJECT min, needs ≥ 1200. Add ${d.shortfallBy} min of Deep to the week.`;
    case 'INFEASIBLE':
      return 'Day is infeasible — see suggested actions to resolve.';
    default:
      return `Validation failed: ${failureCode}`;
  }
}

export default formatInvariantMessage;
