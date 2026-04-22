/**
 * ComposerService — Sprint 4 handoff wrapper.
 *
 * Wraps the pure `composeDaily()` function with side effects:
 *
 *   composeDaily({ input })        — runs the pure composer, persists the
 *                                    Composition + children, publishes
 *                                    `CycleProposed`. Returns the composer
 *                                    result object.
 *
 *   accept(compositionId)          — atomic transition:
 *                                    Composition: PROPOSED → ACCEPTED
 *                                    all child SA:  PROPOSED → SCHEDULED
 *                                    Publishes `CycleAccepted`. Throws if
 *                                    any transition is illegal; no partial
 *                                    writes land.
 *
 *   reject(compositionId, reason?) — Composition: PROPOSED → REJECTED.
 *                                    Publishes `CycleRejected`. Children
 *                                    are left in PROPOSED (terminal for the
 *                                    composition, so they are orphaned).
 *
 *   getActiveComposition(userId)   — returns the latest
 *                                    non-REJECTED/non-CLOSED Composition for
 *                                    the user (PROPOSED, ACCEPTED, EDITED,
 *                                    or ACTIVE) + its children. Used by
 *                                    the Today page to decide whether to
 *                                    render the CycleCard or the AutoPlan
 *                                    empty state.
 *
 * Storage layout (ARCHITECTURE §7.1):
 *   bamx:v1:compositions  — id → Composition
 *   bamx:v1:activities    — id → ScheduledActivity
 *
 * Dependencies injected via constructor:
 *   repo            — LocalStorageRepository (or test double)
 *   bus             — EventBus (or object exposing .publish)
 *   clock           — ClockService (for deterministic `proposedAt` /
 *                     `decidedAt` / `closedAt` stamps)
 *   catalogService  — CatalogService (for resolving the catalog input)
 *
 * No direct `localStorage` reads/writes; no `Date.now()` / `new Date()`.
 * Pure service — no module-level state.
 */

import { composeDaily } from '../composer/composeDaily.js';
import {
  CycleProposed,
  CycleAccepted,
  CycleRejected,
  ComposerInfeasible
} from '../events/events.js';

export const COMPOSITIONS_KEY = 'bamx:v1:compositions';
export const ACTIVITIES_KEY = 'bamx:v1:activities';

/**
 * States a Composition can be in and still be "active" (renderable on
 * `/today`). REJECTED and CLOSED are terminal for the Today view; we
 * never resurface them as the active card.
 */
const ACTIVE_STATES = new Set(['PROPOSED', 'ACCEPTED', 'EDITED', 'ACTIVE']);

/**
 * Legal FSM transitions per ARCHITECTURE §3.1 + §3.2.
 *
 * `null` target means terminal / illegal source for that action.
 */
const COMPOSITION_TRANSITIONS = Object.freeze({
  ACCEPT: Object.freeze({ PROPOSED: 'ACCEPTED' }),
  REJECT: Object.freeze({ PROPOSED: 'REJECTED' })
});

const ACTIVITY_TRANSITIONS = Object.freeze({
  ON_ACCEPT: Object.freeze({ PROPOSED: 'SCHEDULED' })
});

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

export class ComposerService {
  /**
   * @param {{
   *   repo: import('../persistence/IRepository.js').IRepository,
   *   bus: { publish: (event: string, payload: any) => void },
   *   clock: import('./ClockService.js').ClockService,
   *   catalogService?: import('./CatalogService.js').CatalogService
   * }} deps
   */
  constructor({ repo, bus, clock, catalogService } = {}) {
    if (!repo) fail('INVALID_DEPS', 'ComposerService: repo is required');
    if (!bus || typeof bus.publish !== 'function') {
      fail('INVALID_DEPS', 'ComposerService: bus with publish() is required');
    }
    if (!clock || typeof clock.now !== 'function') {
      fail('INVALID_DEPS', 'ComposerService: clock with now() is required');
    }
    this._repo = repo;
    this._bus = bus;
    this._clock = clock;
    this._catalogService = catalogService ?? null;
  }

  /**
   * Run the pure daily composer and persist outputs.
   *
   * If the composer returns INFEASIBLE, we publish `ComposerInfeasible`
   * and return the infeasible result — no Composition is persisted.
   *
   * @param {object} input  ComposerInput per ENGINE_DESIGN §1.1
   * @returns {object} composer result
   */
  composeDaily(input) {
    if (!input || typeof input !== 'object') {
      fail('INVALID_INPUT', 'ComposerService.composeDaily: input is required');
    }
    // If the caller did not supply a catalog AND we have a CatalogService,
    // resolve one. Keeps the pure composer ignorant of storage.
    const effectiveInput = { ...input };
    if (!Array.isArray(effectiveInput.catalog) && this._catalogService) {
      effectiveInput.catalog = this._catalogService.list(effectiveInput.userId);
    }
    // Inject a deterministic `_now` for the pure composer.
    if (typeof effectiveInput._now === 'undefined') {
      effectiveInput._now = this._clock.now();
    }

    const result = composeDaily(effectiveInput);

    // Sprint 5 P1-T4: persist the fine-tune capacity override on the
    // composition snapshot (if the caller set one). Composer does not
    // mutate `User.dailyCapacityMinutes`; the override is a per-day
    // annotation only. Tomorrow's compose reverts to the User default.
    if (
      result &&
      result.composition &&
      typeof effectiveInput.capacityMinutesOverride === 'number'
    ) {
      result.composition.composerInputsSnapshot = {
        ...(result.composition.composerInputsSnapshot ?? {}),
        capacityMinutesOverride: effectiveInput.capacityMinutesOverride
      };
    }

    if (result.state === 'INFEASIBLE') {
      this._bus.publish(ComposerInfeasible, {
        userId: effectiveInput.userId,
        date: effectiveInput.date,
        infeasible: result.infeasible
      });
      return result;
    }

    // Persist the Composition + ScheduledActivity rows atomically.
    const composition = result.composition;
    const activities = composition.activities ?? [];

    // Read current maps, mutate in memory, write back. Two writes — if the
    // second throws the first is rolled back below by restoring the prior
    // snapshot.
    const priorComps = this._repo.read(COMPOSITIONS_KEY) ?? {};
    const priorActs = this._repo.read(ACTIVITIES_KEY) ?? {};

    const nextComps = { ...priorComps };
    const nextActs = { ...priorActs };

    // Store the Composition WITHOUT the embedded activities array (children
    // live in bamx:v1:activities) so there's no duplication.
    const { activities: _ignored, ...compHead } = composition;
    nextComps[composition.id] = compHead;

    for (const a of activities) {
      if (!a.id || typeof a.id !== 'string') {
        fail(
          'INVALID_ACTIVITY',
          'ComposerService.composeDaily: every ScheduledActivity must have a string id'
        );
      }
      nextActs[a.id] = { ...a, compositionId: composition.id };
    }

    // Two-phase commit with rollback on failure. LocalStorage setItem is
    // atomic per key; this mimics a transaction across the two keys.
    try {
      this._repo.write(COMPOSITIONS_KEY, nextComps);
      try {
        this._repo.write(ACTIVITIES_KEY, nextActs);
      } catch (err) {
        // Rollback compositions write.
        this._repo.write(COMPOSITIONS_KEY, priorComps);
        throw err;
      }
    } catch (err) {
      fail(
        'PERSIST_FAILED',
        `ComposerService.composeDaily: persistence failed — ${err.message}`,
        { cause: err }
      );
    }

    this._bus.publish(CycleProposed, {
      compositionId: composition.id,
      userId: composition.userId,
      cycleType: composition.cycleType,
      date: effectiveInput.date
    });

    return result;
  }

  /**
   * Atomically flip Composition PROPOSED → ACCEPTED and every child
   * ScheduledActivity PROPOSED → SCHEDULED. If any transition is illegal
   * (e.g., child is not PROPOSED), the whole operation throws and no
   * state is mutated.
   *
   * @param {string} compositionId
   * @returns {{composition: object, activities: object[]}}
   */
  accept(compositionId) {
    if (typeof compositionId !== 'string' || compositionId.length === 0) {
      fail('INVALID_ID', 'ComposerService.accept: compositionId is required');
    }
    const comps = this._repo.read(COMPOSITIONS_KEY) ?? {};
    const acts = this._repo.read(ACTIVITIES_KEY) ?? {};

    const comp = comps[compositionId];
    if (!comp) {
      fail(
        'COMPOSITION_NOT_FOUND',
        `ComposerService.accept: composition '${compositionId}' not found`,
        { compositionId }
      );
    }

    const targetCompState = COMPOSITION_TRANSITIONS.ACCEPT[comp.state];
    if (!targetCompState) {
      fail(
        'ILLEGAL_TRANSITION',
        `ComposerService.accept: composition '${compositionId}' is '${comp.state}', cannot ACCEPT (expected PROPOSED)`,
        { compositionId, fromState: comp.state }
      );
    }

    const children = Object.values(acts).filter(
      (a) => a && a.compositionId === compositionId
    );

    // Pre-validate: every child must be PROPOSED. Collect ALL failures first
    // so the error message names every bad child, not just the first.
    const bad = children.filter(
      (a) => ACTIVITY_TRANSITIONS.ON_ACCEPT[a.state] === undefined
    );
    if (bad.length > 0) {
      fail(
        'ILLEGAL_TRANSITION',
        `ComposerService.accept: ${bad.length} child activity(ies) not in PROPOSED state`,
        {
          compositionId,
          badActivities: bad.map((a) => ({ id: a.id, state: a.state }))
        }
      );
    }

    // All transitions legal — apply.
    const now = this._clock.now();
    const nextComp = { ...comp, state: 'ACCEPTED', decidedAt: now };
    const nextActs = { ...acts };
    for (const a of children) {
      nextActs[a.id] = {
        ...a,
        state: 'SCHEDULED',
        updatedAt: now
      };
    }
    const nextComps = { ...comps, [compositionId]: nextComp };

    // Two-phase write with rollback.
    const priorComps = comps;
    const priorActs = acts;
    try {
      this._repo.write(COMPOSITIONS_KEY, nextComps);
      try {
        this._repo.write(ACTIVITIES_KEY, nextActs);
      } catch (err) {
        this._repo.write(COMPOSITIONS_KEY, priorComps);
        throw err;
      }
    } catch (err) {
      fail(
        'PERSIST_FAILED',
        `ComposerService.accept: persistence failed — ${err.message}`,
        { cause: err, compositionId }
      );
    }

    this._bus.publish(CycleAccepted, {
      compositionId,
      userId: nextComp.userId,
      cycleType: nextComp.cycleType,
      edited: false
    });

    return {
      composition: nextComp,
      activities: children.map((a) => nextActs[a.id])
    };
  }

  /**
   * Flip Composition PROPOSED → REJECTED.
   *
   * @param {string} compositionId
   * @param {string} [reason]
   * @returns {object} the rejected composition
   */
  reject(compositionId, reason) {
    if (typeof compositionId !== 'string' || compositionId.length === 0) {
      fail('INVALID_ID', 'ComposerService.reject: compositionId is required');
    }
    const comps = this._repo.read(COMPOSITIONS_KEY) ?? {};
    const comp = comps[compositionId];
    if (!comp) {
      fail(
        'COMPOSITION_NOT_FOUND',
        `ComposerService.reject: composition '${compositionId}' not found`,
        { compositionId }
      );
    }
    const targetState = COMPOSITION_TRANSITIONS.REJECT[comp.state];
    if (!targetState) {
      fail(
        'ILLEGAL_TRANSITION',
        `ComposerService.reject: composition '${compositionId}' is '${comp.state}', cannot REJECT (expected PROPOSED)`,
        { compositionId, fromState: comp.state }
      );
    }

    const now = this._clock.now();
    const nextComp = {
      ...comp,
      state: 'REJECTED',
      decidedAt: now,
      rejectionReason: reason ?? null
    };
    const nextComps = { ...comps, [compositionId]: nextComp };
    this._repo.write(COMPOSITIONS_KEY, nextComps);

    this._bus.publish(CycleRejected, {
      compositionId,
      userId: nextComp.userId,
      cycleType: nextComp.cycleType,
      reason: reason ?? null
    });

    return nextComp;
  }

  /**
   * Return the latest active Composition for the user (+ its children),
   * or `null` if none exists. "Active" means state ∈ {PROPOSED, ACCEPTED,
   * EDITED, ACTIVE}. Terminal states (REJECTED, CLOSED) are filtered out.
   *
   * Orders by `proposedAt` descending so the most recent proposal wins
   * if there are multiple (e.g., yesterday's CLOSED + today's PROPOSED).
   *
   * @param {string} userId
   * @returns {{composition: object, activities: object[]} | null}
   */
  getActiveComposition(userId) {
    if (typeof userId !== 'string' || userId.length === 0) {
      fail('INVALID_ID', 'ComposerService.getActiveComposition: userId is required');
    }
    const comps = this._repo.read(COMPOSITIONS_KEY) ?? {};
    const candidates = Object.values(comps).filter(
      (c) => c && c.userId === userId && ACTIVE_STATES.has(c.state)
    );
    if (candidates.length === 0) return null;

    candidates.sort((a, b) => {
      const at = a.proposedAt ?? '';
      const bt = b.proposedAt ?? '';
      if (at < bt) return 1;
      if (at > bt) return -1;
      return 0;
    });
    const latest = candidates[0];
    const acts = this._repo.read(ACTIVITIES_KEY) ?? {};
    const activities = Object.values(acts).filter(
      (a) => a && a.compositionId === latest.id
    );
    return { composition: latest, activities };
  }

  /**
   * Return the Composition by id (+ its children), or null if absent.
   *
   * @param {string} compositionId
   * @returns {{composition: object, activities: object[]} | null}
   */
  getComposition(compositionId) {
    const comps = this._repo.read(COMPOSITIONS_KEY) ?? {};
    const comp = comps[compositionId];
    if (!comp) return null;
    const acts = this._repo.read(ACTIVITIES_KEY) ?? {};
    const activities = Object.values(acts).filter(
      (a) => a && a.compositionId === compositionId
    );
    return { composition: comp, activities };
  }
}

export default ComposerService;
