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
  CycleEdited,
  CycleRejected,
  ComposerInfeasible,
  CycleReflowed
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
 * Parse a plannedStartAt value (HH:MM, HH:MM:SS, ISO) into
 * minutes-of-day. Returns null when unparseable.
 *
 * @param {string | null | undefined} value
 * @returns {number | null}
 */
function parseStartMinutesForReflow(value) {
  if (typeof value !== 'string' || value.length === 0) return null;
  if (/^\d{2}:\d{2}$/.test(value)) {
    const [h, m] = value.split(':').map(Number);
    return h * 60 + m;
  }
  if (/^\d{2}:\d{2}:\d{2}$/.test(value)) {
    const [h, m] = value.slice(0, 5).split(':').map(Number);
    return h * 60 + m;
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

/**
 * Format minutes-of-day back into a string of the same shape as
 * `original`. Preserves the date prefix on ISO inputs.
 *
 * @param {string | null | undefined} original
 * @param {number} minutes
 * @returns {string}
 */
function formatStartMinutesForReflow(original, minutes) {
  const hh = String(Math.floor(((minutes % 1440) + 1440) % 1440 / 60)).padStart(2, '0');
  const mm = String((((minutes % 1440) + 1440) % 1440) % 60).padStart(2, '0');
  if (typeof original !== 'string' || original.length === 0) {
    return `${hh}:${mm}`;
  }
  if (/^\d{2}:\d{2}$/.test(original)) return `${hh}:${mm}`;
  if (/^\d{2}:\d{2}:\d{2}$/.test(original)) return `${hh}:${mm}:${original.slice(6, 8)}`;
  // ISO-shaped — preserve everything except HH/MM.
  const isoMatch = original.match(/^(.*T)(\d{2}):(\d{2})(:\d{2}(?:\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?$/);
  if (isoMatch) {
    const [, prefix, , , secFrac = '', tz = ''] = isoMatch;
    return `${prefix}${hh}:${mm}${secFrac}${tz}`;
  }
  return `${hh}:${mm}`;
}

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
    let nextActs = { ...priorActs };

    // Sprint 6 P1-T3: if a Composition with this id already exists (Fine-tune
    // re-compose case), delete every ScheduledActivity row that belonged to
    // it before writing the new children. Prevents duplicate rows when the
    // user re-composes with a different capacity.
    if (priorComps[composition.id]) {
      nextActs = Object.fromEntries(
        Object.entries(nextActs).filter(
          ([, a]) => !a || a.compositionId !== composition.id
        )
      );
    }

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
   * Sprint 12 — persist an edited activity list against an existing
   * Composition. Atomic replace:
   *
   *   - For each existing child, if a new child with the same `id` AND
   *     the same `catalogEntryId` is present in `newActivities`, preserve
   *     `actualStartAt` / `state` (the catalog entry wasn't swapped, so
   *     runtime facts survive).
   *   - For each existing child NOT present in `newActivities`, mark
   *     `state: 'DROPPED'` (keeps the row for audit).
   *   - For each new activity (no matching prior id), write it fresh.
   *
   * Recomputes `composition.plannedByBucket`. Bumps `composition.state` to
   * 'EDITED' if currently PROPOSED; leaves it alone if ACCEPTED / ACTIVE
   * (editing post-accept is a content change, not a re-decision).
   *
   * Publishes `CycleEdited` with `{compositionId, userId, swaps, committedAt}`.
   *
   * @param {string} compositionId
   * @param {object[]} newActivities  the edited activity list (may share
   *                                  ids with the prior children for
   *                                  preserved slots, or carry fresh ids
   *                                  for swaps/adds)
   * @param {{userId?: string}} [_opts]
   * @returns {{composition: object, activities: object[]}}
   */
  commitEdit(compositionId, newActivities, _opts = {}) {
    if (typeof compositionId !== 'string' || compositionId.length === 0) {
      fail('INVALID_ID', 'ComposerService.commitEdit: compositionId is required');
    }
    if (!Array.isArray(newActivities)) {
      fail(
        'INVALID_ACTIVITIES',
        'ComposerService.commitEdit: newActivities must be an array'
      );
    }
    const comps = this._repo.read(COMPOSITIONS_KEY) ?? {};
    const comp = comps[compositionId];
    if (!comp) {
      fail(
        'COMPOSITION_NOT_FOUND',
        `ComposerService.commitEdit: composition '${compositionId}' not found`,
        { compositionId }
      );
    }

    const acts = this._repo.read(ACTIVITIES_KEY) ?? {};
    const priorChildren = Object.values(acts).filter(
      (a) => a && a.compositionId === compositionId
    );
    const priorById = new Map(priorChildren.map((a) => [a.id, a]));

    const now = this._clock.now();
    const nextActs = { ...acts };

    // Track swaps for the CycleEdited payload.
    const swaps = [];
    const seenIds = new Set();

    for (const edited of newActivities) {
      if (!edited || typeof edited !== 'object') continue;
      const id = edited.id;
      if (typeof id !== 'string' || id.length === 0) continue;
      seenIds.add(id);
      const prior = priorById.get(id);
      if (prior && prior.catalogEntryId === edited.catalogEntryId) {
        // Unchanged slot — preserve runtime state.
        nextActs[id] = {
          ...prior,
          ...edited,
          // Do NOT clobber actualStartAt / runtime state / outputArtifactRef.
          state: prior.state,
          actualStartAt: prior.actualStartAt,
          compositionId,
          updatedAt: now
        };
        continue;
      }
      // New or swapped slot. If there was a prior row with the same id but
      // different catalogEntryId, mark the prior DROPPED (audit trail) and
      // write the new one under a fresh id to avoid losing the original.
      if (prior) {
        swaps.push({
          slotActivityId: prior.id,
          fromCatalogEntryId: prior.catalogEntryId,
          toCatalogEntryId: edited.catalogEntryId
        });
        nextActs[prior.id] = { ...prior, state: 'DROPPED', updatedAt: now };
        const freshId = `${id}_edit_${now}`;
        nextActs[freshId] = {
          ...edited,
          id: freshId,
          compositionId,
          updatedAt: now
        };
      } else {
        // Net-new slot from Add-new flow.
        swaps.push({
          slotActivityId: id,
          fromCatalogEntryId: null,
          toCatalogEntryId: edited.catalogEntryId
        });
        nextActs[id] = {
          ...edited,
          compositionId,
          updatedAt: now
        };
      }
    }

    // Any prior children not present in newActivities → DROPPED.
    for (const prior of priorChildren) {
      if (seenIds.has(prior.id)) continue;
      if (prior.state === 'DROPPED') continue;
      swaps.push({
        slotActivityId: prior.id,
        fromCatalogEntryId: prior.catalogEntryId,
        toCatalogEntryId: null
      });
      nextActs[prior.id] = { ...prior, state: 'DROPPED', updatedAt: now };
    }

    // Recompute plannedByBucket from the surviving non-DROPPED rows.
    const survivors = Object.values(nextActs).filter(
      (a) => a && a.compositionId === compositionId && a.state !== 'DROPPED'
    );
    const plannedByBucket = { PROJECT: 0, COMMUNICATION: 0, CI: 0 };
    for (const a of survivors) {
      if (a.state === 'SKIPPED') continue;
      if (plannedByBucket[a.bucket] !== undefined) {
        plannedByBucket[a.bucket] += Number(a.plannedDurationMinutes ?? 0);
      }
    }

    const nextState =
      comp.state === 'PROPOSED' ? 'EDITED' : comp.state;
    const nextComp = {
      ...comp,
      state: nextState,
      plannedByBucket,
      lastEditedAt: now
    };
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
        `ComposerService.commitEdit: persistence failed — ${err.message}`,
        { cause: err, compositionId }
      );
    }

    this._bus.publish(CycleEdited, {
      compositionId,
      userId: nextComp.userId,
      swaps,
      committedAt: now
    });

    const children = Object.values(nextActs).filter(
      (a) => a && a.compositionId === compositionId
    );
    return { composition: nextComp, activities: children };
  }

  /**
   * Sprint 15 W5 — reflow today's day.
   *
   * After a runtime event (ActivityCompleted, ActivityStartedLate, ...),
   * re-tile remaining PROPOSED/SCHEDULED activities into the open time
   * around already-anchored ones. Pure positional repack: no add, no
   * remove, no swap. Activities in IN_PROGRESS, CLOSED, SKIPPED, or
   * DROPPED states are PRESERVED verbatim; flexible activities (PROPOSED,
   * SCHEDULED) get new `plannedStartAt` values that slot around the
   * preserved blocks.
   *
   *   ┌─ before ──┐    ┌─ after a 09:00 close ─┐
   *   │ 09 P (in) │    │ 09 P (closed)         │
   *   │ 10 P      │    │ 10 P  (slid up?)       │
   *   │ 11 C      │    │ 11 C  (slid up?)       │
   *
   * (For MVP: flexible activities keep their relative order but their
   * starts compress backward to butt up against the latest preserved
   * end-time; nothing slides past 19:00 to avoid runaway days.)
   *
   * No-op (returns null) when:
   *   - no composition for the user on the given date,
   *   - no flexible activities remain,
   *   - all activities are in terminal/preserved state.
   *
   * Emits `CycleReflowed` with the count of shifted vs. preserved rows.
   *
   * @param {{userId: string, date: string, trigger?: string}} input
   * @returns {{composition: object, activities: object[], shifted: number, preserved: number} | null}
   */
  reflow(input) {
    if (!input || typeof input !== 'object') {
      fail('INVALID_INPUT', 'ComposerService.reflow: input is required');
    }
    const { userId, date } = input;
    const trigger = typeof input.trigger === 'string' ? input.trigger : 'ActivityCompleted';
    if (typeof userId !== 'string' || userId.length === 0) {
      fail('INVALID_INPUT', 'ComposerService.reflow: userId is required');
    }
    if (typeof date !== 'string' || date.length < 10) {
      fail('INVALID_INPUT', 'ComposerService.reflow: date is required (YYYY-MM-DD)');
    }

    const comps = this._repo.read(COMPOSITIONS_KEY) ?? {};
    // Pick the latest active composition matching the user + date.
    const candidates = Object.values(comps).filter((c) => {
      if (!c) return false;
      if (c.userId !== userId) return false;
      if (!ACTIVE_STATES.has(c.state)) return false;
      const cDate = typeof c.startAt === 'string' ? c.startAt.slice(0, 10) : null;
      const dDate = typeof c.date === 'string' ? c.date : null;
      return cDate === date || dDate === date;
    });
    if (candidates.length === 0) return null;
    candidates.sort((a, b) => {
      const at = a.proposedAt ?? '';
      const bt = b.proposedAt ?? '';
      if (at < bt) return 1;
      if (at > bt) return -1;
      return 0;
    });
    const composition = candidates[0];

    const acts = this._repo.read(ACTIVITIES_KEY) ?? {};
    const children = Object.values(acts).filter(
      (a) => a && a.compositionId === composition.id
    );
    if (children.length === 0) return null;

    // Partition.
    const PRESERVED_STATES = new Set(['IN_PROGRESS', 'CLOSED', 'SKIPPED', 'DROPPED']);
    const preserved = children.filter((a) => PRESERVED_STATES.has(a.state));
    const flexible = children.filter(
      (a) => a.state === 'PROPOSED' || a.state === 'SCHEDULED'
    );
    if (flexible.length === 0) return null;

    // Compute the latest preserved end (in minutes-of-day). Flexible
    // activities will be repacked starting at that time (or at their
    // earliest natural start, whichever is later).
    let preservedEnd = null;
    for (const a of preserved) {
      const start = parseStartMinutesForReflow(a.plannedStartAt);
      if (start === null) continue;
      const dur = Number(a.plannedDurationMinutes ?? 0);
      const end = start + dur;
      if (preservedEnd === null || end > preservedEnd) preservedEnd = end;
    }

    // Sort flexible by current plannedStartAt to keep relative order.
    flexible.sort((x, y) => {
      const xs = parseStartMinutesForReflow(x.plannedStartAt) ?? Infinity;
      const ys = parseStartMinutesForReflow(y.plannedStartAt) ?? Infinity;
      return xs - ys;
    });

    const now = this._clock.now();
    let cursor = preservedEnd;
    let shifted = 0;
    const updatedFlexible = flexible.map((a) => {
      const origStart = parseStartMinutesForReflow(a.plannedStartAt);
      const dur = Number(a.plannedDurationMinutes ?? 0);
      // The new start is the later of:
      //   (cursor) — butted up against the latest preserved end, or
      //   (origStart) — its own original time, if that's already later.
      let nextStart;
      if (cursor !== null && origStart !== null) {
        nextStart = Math.max(cursor, origStart);
      } else if (cursor !== null) {
        nextStart = cursor;
      } else if (origStart !== null) {
        nextStart = origStart;
      } else {
        // Nothing to anchor on — leave plannedStartAt alone.
        cursor = null;
        return { ...a, updatedAt: now };
      }
      cursor = nextStart + dur;
      const newPlannedStartAt = formatStartMinutesForReflow(
        a.plannedStartAt,
        nextStart
      );
      const changed = newPlannedStartAt !== a.plannedStartAt;
      if (changed) shifted += 1;
      return {
        ...a,
        plannedStartAt: newPlannedStartAt,
        updatedAt: now
      };
    });

    // Persist the shifted children.
    const nextActs = { ...acts };
    for (const a of updatedFlexible) {
      nextActs[a.id] = a;
    }
    this._repo.write(ACTIVITIES_KEY, nextActs);

    this._bus.publish(CycleReflowed, {
      compositionId: composition.id,
      userId,
      scope: 'DAILY',
      trigger,
      reflowedAt: now,
      shifted,
      preserved: preserved.length
    });

    const allChildren = Object.values(nextActs).filter(
      (a) => a && a.compositionId === composition.id
    );
    return {
      composition,
      activities: allChildren,
      shifted,
      preserved: preserved.length
    };
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
