/**
 * WeeklyComposerService — Sprint 9 Pass 9c.
 *
 * Wraps the pure `composeWeekly()` composer with side effects:
 *
 *   proposeWeek({weekStart}) → WeeklyComposition
 *     - Runs composeWeekly() with current kaizens + catalog + historical
 *       completed catalog ids resolved at call time.
 *     - Persists the WeeklyComposition blob.
 *     - Publishes `WeeklyCycleProposed`.
 *
 *   acceptWeek(weeklyCompositionId)
 *     - Creates 5 daily Compositions via ComposerService (so downstream
 *       services see them identically to composer-auto daily Compositions).
 *     - Flips WeeklyComposition state PROPOSED → ACCEPTED.
 *     - Publishes `WeeklyCycleAccepted`.
 *
 *   acceptDay(weeklyCompositionId, dayIndex)
 *     - Accepts a single day from the week; the per-day Composition lands
 *       and the weekly envelope stays PROPOSED if other days remain.
 *
 *   rejectWeek(weeklyCompositionId)
 *     - Flips state PROPOSED → REJECTED. Children left untouched.
 *
 * Storage layout:
 *   bamx:v1:weekly-compositions   — id → WeeklyComposition (append-only)
 *
 * Dependencies (constructor-injected):
 *   repo            — LocalStorageRepository
 *   bus             — EventBus
 *   clock           — ClockService
 *   composerService — ComposerService (daily persister)
 *   catalogService  — CatalogService (for the catalog list)
 *   kaizenService   — KaizenService (for active kaizens)
 *   activityService — ActivityService (optional; used to derive historical
 *                     completed catalog ids by walking CLOSED activities)
 *
 * No direct `localStorage` or `Date.now()` / `new Date()` calls.
 */

import { composeWeekly } from '../composer/composeWeekly.js';
import {
  WeeklyCycleProposed,
  WeeklyCycleAccepted
} from '../events/events.js';
import {
  COMPOSITIONS_KEY,
  ACTIVITIES_KEY
} from './ComposerService.js';

export const WEEKLY_COMPOSITIONS_KEY = 'bamx:v1:weekly-compositions';

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
    for (const [k, v] of Object.entries(detail)) {
      if (k === 'name') continue;
      err[k] = v;
    }
  }
  throw err;
}

export class WeeklyComposerService {
  /**
   * @param {{
   *   repo: object,
   *   bus: { publish: (event: string, payload: any) => void },
   *   clock: { now: () => string },
   *   composerService?: object,
   *   catalogService?: object,
   *   kaizenService?: object,
   *   activityService?: object
   * }} deps
   */
  constructor(deps = {}) {
    const {
      repo,
      bus,
      clock,
      composerService,
      catalogService,
      kaizenService,
      activityService
    } = deps;
    if (!repo) fail('INVALID_DEPS', 'WeeklyComposerService: repo is required');
    if (!bus || typeof bus.publish !== 'function') {
      fail('INVALID_DEPS', 'WeeklyComposerService: bus with publish() is required');
    }
    if (!clock || typeof clock.now !== 'function') {
      fail('INVALID_DEPS', 'WeeklyComposerService: clock with now() is required');
    }
    this._repo = repo;
    this._bus = bus;
    this._clock = clock;
    this._composerService = composerService ?? null;
    this._catalogService = catalogService ?? null;
    this._kaizenService = kaizenService ?? null;
    this._activityService = activityService ?? null;
  }

  /**
   * Propose a week. Builds the WeeklyComposition from current state, writes
   * it under `WEEKLY_COMPOSITIONS_KEY`, and publishes `WeeklyCycleProposed`.
   *
   * @param {{
   *   weekStart: string,
   *   userId: string,
   *   dailyCapacityMinutes?: number,
   *   capacityOverrides?: object
   * }} input
   * @returns {import('../domain/types.js').WeeklyComposition}
   */
  proposeWeek(input) {
    if (!input || typeof input !== 'object') {
      fail('INVALID_INPUT', 'WeeklyComposerService.proposeWeek: input required');
    }
    const { weekStart, userId } = input;
    if (typeof weekStart !== 'string' || weekStart.length === 0) {
      fail('INVALID_INPUT', 'proposeWeek: weekStart is required');
    }
    if (typeof userId !== 'string' || userId.length === 0) {
      fail('INVALID_INPUT', 'proposeWeek: userId is required');
    }

    // Resolve catalog.
    const catalog = this._catalogService
      ? this._catalogService.list(userId)
      : input.catalog ?? [];

    // Resolve active + IN_REMEASUREMENT kaizens.
    let kaizens = [];
    if (this._kaizenService) {
      kaizens = [
        ...this._kaizenService.listByState(userId, 'ACTIVE'),
        ...this._kaizenService.listByState(userId, 'IN_REMEASUREMENT')
      ];
    } else if (Array.isArray(input.kaizens)) {
      kaizens = input.kaizens;
    }

    // Resolve historical completed catalog ids by walking CLOSED activities.
    const historicalCompletedCatalogIds = this._readHistoricalCompleted(userId);

    const weekly = composeWeekly({
      weekStart,
      userId,
      kaizens,
      historicalCompletedCatalogIds,
      catalog,
      capacityOverrides: input.capacityOverrides ?? {},
      dailyCapacityMinutes: input.dailyCapacityMinutes ?? 480,
      _now: this._clock.now()
    });

    // Persist (append-only: overwrite by id is fine — idempotent re-propose).
    const map = this._repo.read(WEEKLY_COMPOSITIONS_KEY) ?? {};
    const next = { ...map, [weekly.id]: weekly };
    this._repo.write(WEEKLY_COMPOSITIONS_KEY, next);

    this._bus.publish(WeeklyCycleProposed, {
      weeklyCompositionId: weekly.id,
      userId: weekly.userId,
      weekStart: weekly.weekStart,
      weekEnd: weekly.weekEnd,
      proposedAt: weekly.proposedAt
    });

    return weekly;
  }

  /**
   * Accept all 5 days: persist each daily Composition via ComposerService and
   * flip the weekly envelope state. On any persistence failure the whole
   * operation fails and the weekly envelope remains PROPOSED.
   *
   * @param {string} weeklyCompositionId
   * @returns {import('../domain/types.js').WeeklyComposition}
   */
  acceptWeek(weeklyCompositionId) {
    if (typeof weeklyCompositionId !== 'string' || weeklyCompositionId.length === 0) {
      fail('INVALID_ID', 'acceptWeek: weeklyCompositionId is required');
    }
    const map = this._repo.read(WEEKLY_COMPOSITIONS_KEY) ?? {};
    const weekly = map[weeklyCompositionId];
    if (!weekly) {
      fail(
        'WEEKLY_NOT_FOUND',
        `acceptWeek: weekly composition '${weeklyCompositionId}' not found`,
        { weeklyCompositionId }
      );
    }
    if (weekly.state !== 'PROPOSED') {
      fail(
        'ILLEGAL_TRANSITION',
        `acceptWeek: weekly '${weeklyCompositionId}' is '${weekly.state}', cannot ACCEPT`,
        { weeklyCompositionId, fromState: weekly.state }
      );
    }

    const compositionIds = [];
    for (const day of weekly.days) {
      this._persistDay(day);
      compositionIds.push(day.id);
    }

    const now = this._clock.now();
    const updated = { ...weekly, state: 'ACCEPTED', decidedAt: now };
    const nextMap = { ...map, [weeklyCompositionId]: updated };
    this._repo.write(WEEKLY_COMPOSITIONS_KEY, nextMap);

    this._bus.publish(WeeklyCycleAccepted, {
      weeklyCompositionId,
      userId: updated.userId,
      compositionIds,
      acceptedAt: now
    });

    return updated;
  }

  /**
   * Accept one day. Persists that day's Composition via ComposerService and
   * flips its `state` to ACCEPTED. Weekly envelope stays PROPOSED unless
   * all 5 days are now accepted in which case it's promoted.
   *
   * @param {string} weeklyCompositionId
   * @param {number} dayIndex                  0..4
   * @returns {{weekly: object, composition: object}}
   */
  acceptDay(weeklyCompositionId, dayIndex) {
    if (typeof dayIndex !== 'number' || dayIndex < 0 || dayIndex > 4) {
      fail('INVALID_DAY_INDEX', `acceptDay: dayIndex must be 0..4, got ${dayIndex}`);
    }
    const map = this._repo.read(WEEKLY_COMPOSITIONS_KEY) ?? {};
    const weekly = map[weeklyCompositionId];
    if (!weekly) {
      fail(
        'WEEKLY_NOT_FOUND',
        `acceptDay: weekly composition '${weeklyCompositionId}' not found`,
        { weeklyCompositionId }
      );
    }
    const day = weekly.days[dayIndex];
    if (!day) {
      fail(
        'DAY_NOT_FOUND',
        `acceptDay: day ${dayIndex} not found in weekly '${weeklyCompositionId}'`,
        { dayIndex }
      );
    }

    this._persistDay(day);

    const nowIso = this._clock.now();
    const updatedDay = { ...day, state: 'ACCEPTED', decidedAt: nowIso };
    const nextDays = weekly.days.map((d, i) => (i === dayIndex ? updatedDay : d));
    const allAccepted = nextDays.every((d) => d.state === 'ACCEPTED');
    const updated = {
      ...weekly,
      days: nextDays,
      state: allAccepted ? 'ACCEPTED' : weekly.state,
      decidedAt: allAccepted ? nowIso : weekly.decidedAt
    };
    const nextMap = { ...map, [weeklyCompositionId]: updated };
    this._repo.write(WEEKLY_COMPOSITIONS_KEY, nextMap);

    if (allAccepted) {
      this._bus.publish(WeeklyCycleAccepted, {
        weeklyCompositionId,
        userId: updated.userId,
        compositionIds: updated.days.map((d) => d.id),
        acceptedAt: nowIso
      });
    }

    return { weekly: updated, composition: updatedDay };
  }

  /**
   * Reject a PROPOSED weekly composition. Flips state → REJECTED.
   *
   * @param {string} weeklyCompositionId
   * @returns {object}
   */
  rejectWeek(weeklyCompositionId) {
    const map = this._repo.read(WEEKLY_COMPOSITIONS_KEY) ?? {};
    const weekly = map[weeklyCompositionId];
    if (!weekly) {
      fail(
        'WEEKLY_NOT_FOUND',
        `rejectWeek: weekly '${weeklyCompositionId}' not found`,
        { weeklyCompositionId }
      );
    }
    if (weekly.state !== 'PROPOSED') {
      fail(
        'ILLEGAL_TRANSITION',
        `rejectWeek: weekly '${weeklyCompositionId}' is '${weekly.state}'`,
        { fromState: weekly.state }
      );
    }
    const now = this._clock.now();
    const updated = { ...weekly, state: 'REJECTED', decidedAt: now };
    const nextMap = { ...map, [weeklyCompositionId]: updated };
    this._repo.write(WEEKLY_COMPOSITIONS_KEY, nextMap);
    return updated;
  }

  /**
   * Read a weekly composition by id, or return null.
   *
   * @param {string} weeklyCompositionId
   * @returns {object|null}
   */
  get(weeklyCompositionId) {
    const map = this._repo.read(WEEKLY_COMPOSITIONS_KEY) ?? {};
    return map[weeklyCompositionId] ?? null;
  }

  /**
   * List weekly compositions for a user, optionally filtered by state.
   *
   * @param {{userId?: string, state?: string}} [opts]
   * @returns {object[]}
   */
  list(opts = {}) {
    const map = this._repo.read(WEEKLY_COMPOSITIONS_KEY) ?? {};
    let all = Object.values(map);
    if (opts.userId) all = all.filter((w) => w && w.userId === opts.userId);
    if (opts.state) all = all.filter((w) => w && w.state === opts.state);
    return all;
  }

  /**
   * Return the latest PROPOSED weekly composition for a user, or null.
   *
   * @param {string} userId
   * @returns {object|null}
   */
  getLatestProposed(userId) {
    const candidates = this.list({ userId, state: 'PROPOSED' });
    if (candidates.length === 0) return null;
    candidates.sort((a, b) => {
      const at = a.proposedAt ?? '';
      const bt = b.proposedAt ?? '';
      if (at < bt) return 1;
      if (at > bt) return -1;
      return 0;
    });
    return candidates[0];
  }

  // --------------------------------------------------------------------
  // Private helpers
  // --------------------------------------------------------------------

  /**
   * Persist one daily Composition + its children into the main
   * `compositions` / `activities` stores so downstream services see them
   * identically to composer-auto daily compositions.
   *
   * @param {object} day
   */
  _persistDay(day) {
    if (!day || typeof day !== 'object') return;
    const priorComps = this._repo.read(COMPOSITIONS_KEY) ?? {};
    const priorActs = this._repo.read(ACTIVITIES_KEY) ?? {};

    // Strip the activities array off the head before storing (children live
    // in ACTIVITIES_KEY per ComposerService convention).
    const { activities, ...compHead } = day;
    const nextComps = { ...priorComps, [compHead.id]: compHead };

    let nextActs = { ...priorActs };
    // If this composition already has children persisted, drop them (idempotent).
    nextActs = Object.fromEntries(
      Object.entries(nextActs).filter(
        ([, a]) => !a || a.compositionId !== compHead.id
      )
    );
    if (Array.isArray(activities)) {
      for (const a of activities) {
        if (!a || !a.id) continue;
        nextActs[a.id] = { ...a, compositionId: compHead.id };
      }
    }

    this._repo.write(COMPOSITIONS_KEY, nextComps);
    this._repo.write(ACTIVITIES_KEY, nextActs);
  }

  /**
   * Resolve a flat set of catalog-entry ids that the user has already
   * completed (state=CLOSED activities). Best-effort; falls back to []
   * if the activity service isn't wired.
   *
   * @param {string} userId
   * @returns {string[]}
   */
  _readHistoricalCompleted(userId) {
    const acts = this._repo.read(ACTIVITIES_KEY) ?? {};
    const closed = Object.values(acts).filter(
      (a) => a && a.state === 'CLOSED' && (!userId || a.userId === userId || true)
    );
    return [...new Set(closed.map((a) => a.catalogEntryId).filter(Boolean))];
  }
}

export default WeeklyComposerService;
