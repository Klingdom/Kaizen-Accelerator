/**
 * SmartDefaults — Sprint 5 (P0-T2).
 *
 * Per METHODOLOGY_RECOMMENDATION §8 "auto-population methodology":
 * on first-login (no User row yet), infer sensible defaults so the user
 * can reach `/today` → Auto-Plan → Start without a Settings step.
 *
 * Inferred fields (METHODOLOGY_MECHANICS §4 smart defaults):
 *   - timezone              Intl.DateTimeFormat().resolvedOptions().timeZone
 *   - sprintAnchorDate      Monday of current ISO week (ISO date)
 *   - role                  'PRACTITIONER' (first MVP persona)
 *   - dailyCapacityMinutes  480
 *   - deepSlicePreference   '2x2h'
 *   - workDays              [1,2,3,4,5]  (ISO Mon–Fri)
 *
 * Pure functions + a tiny ensureUser() helper that reads/writes the
 * `bamx:v1:users` map via the repo. No Date.now(); clock is injected.
 */

export const USERS_KEY = 'bamx:v1:users';

/** The canonical default-role for every new User in v1 MVP. */
export const DEFAULT_ROLE = Object.freeze(['PRACTITIONER']);

/** Default workDays = Monday..Friday (ISO day-of-week). */
export const DEFAULT_WORK_DAYS = Object.freeze([1, 2, 3, 4, 5]);

/** Default daily capacity in minutes (8 hours). */
export const DEFAULT_DAILY_CAPACITY_MIN = 480;

/** Default deep-slice preference. */
export const DEFAULT_DEEP_SLICE = '2x2h';

/**
 * Compute the ISO date (YYYY-MM-DD) of Monday in the same ISO week as
 * `date`. Uses UTC arithmetic so it's deterministic across timezones.
 *
 * ISO week: Monday = 1, Sunday = 7. For a given date:
 *   - if day-of-week = 1 (Mon), return the date itself
 *   - else walk back (day − 1) days
 *
 * @param {Date|string} date
 * @returns {string} ISO date (YYYY-MM-DD)
 */
export function mondayOfIsoWeek(date) {
  const d = date instanceof Date ? new Date(date.getTime()) : new Date(date);
  if (Number.isNaN(d.getTime())) {
    const err = new Error(`mondayOfIsoWeek: invalid date '${date}'`);
    err.name = 'INVALID_DATE';
    throw err;
  }
  // getUTCDay(): Sun=0..Sat=6. ISO weekday: Mon=1..Sun=7.
  const sunDay = d.getUTCDay();
  const isoDay = sunDay === 0 ? 7 : sunDay;
  const offset = isoDay - 1;
  const mon = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - offset)
  );
  return mon.toISOString().slice(0, 10);
}

/**
 * Infer the browser's timezone via Intl. Falls back to 'UTC' when Intl
 * is unavailable (Node 20+ has Intl; still defensive).
 *
 * @returns {string}
 */
export function inferTimezone() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (typeof tz === 'string' && tz.length > 0) return tz;
  } catch {
    /* fallthrough */
  }
  return 'UTC';
}

/**
 * Build a complete User row using smart defaults. Intended for
 * first-time users. Missing fields on `overrides` fall back to defaults.
 *
 * `now` is an ISO timestamp — use ClockService.now().
 *
 * @param {{
 *   userId?: string,
 *   name?: string,
 *   email?: string,
 *   now: string,
 *   overrides?: object
 * }} args
 * @returns {object}
 */
export function buildUserDefaults({ userId, name, email, now, overrides = {} } = {}) {
  if (typeof now !== 'string' || now.length === 0) {
    const err = new Error('buildUserDefaults: `now` ISO timestamp is required');
    err.name = 'INVALID_INPUT';
    throw err;
  }
  const today = new Date(now);
  if (Number.isNaN(today.getTime())) {
    const err = new Error(`buildUserDefaults: invalid 'now' value '${now}'`);
    err.name = 'INVALID_INPUT';
    throw err;
  }
  const timezone = overrides.timezone ?? inferTimezone();
  const sprintAnchorDate = overrides.sprintAnchorDate ?? mondayOfIsoWeek(today);
  const role = overrides.role ?? [...DEFAULT_ROLE];
  const dailyCapacityMinutes =
    typeof overrides.dailyCapacityMinutes === 'number'
      ? overrides.dailyCapacityMinutes
      : DEFAULT_DAILY_CAPACITY_MIN;
  const deepSlicePreference = overrides.deepSlicePreference ?? DEFAULT_DEEP_SLICE;
  const workDays = overrides.workDays ?? [...DEFAULT_WORK_DAYS];

  return {
    id: userId ?? 'user_phil_mvp',
    name: name ?? 'You',
    email: email ?? '',
    role: Array.isArray(role) ? [...role] : [role],
    dailyCapacityMinutes,
    workDays: [...workDays],
    sprintAnchorDate,
    timezone,
    deepSlicePreference,
    createdAt: now
  };
}

/**
 * Ensure a User row exists at `repo.bamx:v1:users[userId]`. If absent,
 * constructs one with smart defaults and writes it. Returns the User.
 *
 * Idempotent: subsequent calls return the persisted row.
 *
 * @param {{
 *   repo: import('../persistence/IRepository.js').IRepository,
 *   clock: import('./ClockService.js').ClockService,
 *   userId?: string,
 *   name?: string,
 *   email?: string,
 *   overrides?: object
 * }} args
 * @returns {object}
 */
export function ensureUser({ repo, clock, userId, name, email, overrides } = {}) {
  if (!repo) {
    const err = new Error('ensureUser: repo is required');
    err.name = 'INVALID_DEPS';
    throw err;
  }
  if (!clock || typeof clock.now !== 'function') {
    const err = new Error('ensureUser: clock.now() is required');
    err.name = 'INVALID_DEPS';
    throw err;
  }
  const resolvedUserId = userId ?? 'user_phil_mvp';
  const map = repo.read(USERS_KEY) ?? {};
  if (map[resolvedUserId]) {
    return map[resolvedUserId];
  }
  const fresh = buildUserDefaults({
    userId: resolvedUserId,
    name,
    email,
    now: clock.now(),
    overrides
  });
  const next = { ...map, [resolvedUserId]: fresh };
  repo.write(USERS_KEY, next);
  return fresh;
}

export default {
  USERS_KEY,
  DEFAULT_ROLE,
  DEFAULT_WORK_DAYS,
  DEFAULT_DAILY_CAPACITY_MIN,
  DEFAULT_DEEP_SLICE,
  mondayOfIsoWeek,
  inferTimezone,
  buildUserDefaults,
  ensureUser
};
