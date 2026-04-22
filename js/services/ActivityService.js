/**
 * ActivityService — Sprint 5 E5 (P0-T3).
 *
 * Sole writer to the state columns on `bamx:v1:activities` after
 * ComposerService.composeDaily() seeds rows in PROPOSED state.
 *
 * Methods:
 *   start(scheduledActivityId)                         SCHEDULED → IN_PROGRESS
 *   close(scheduledActivityId, {outputArtifactRef})    IN_PROGRESS → CLOSED
 *   skip(scheduledActivityId, {reasonCode, note})      SCHEDULED → SKIPPED
 *
 * All transitions are atomic. Guards throw named errors on failure; no
 * partial writes. Per ARCHITECTURE §3.2 FSM + ENGINE_DESIGN §5.2.
 *
 * Event emission (ARCHITECTURE §6.1):
 *   start()  → ActivityStarted; plus ActivityStartedLate if now > plannedStartAt + 5 min
 *   close()  → ActivityCompleted
 *   skip()   → VarianceLogged (via VarianceService)
 *
 * Dependencies injected via constructor:
 *   repo              — LocalStorageRepository
 *   bus               — EventBus
 *   clock             — ClockService
 *   composerService   — for catalog lookups on schema validation (optional)
 *   varianceService   — required: the append-only log writer
 *   catalogService    — for resolving CatalogEntry output-artifact schema
 *
 * Pure service — no module-level state, no direct `Date.now()` /
 * `localStorage` access.
 */

import { ACTIVITIES_KEY, COMPOSITIONS_KEY } from './ComposerService.js';
import {
  ActivityStarted,
  ActivityStartedLate,
  ActivityCompleted
} from '../events/events.js';
import { ReasonCode, ArtifactSchema } from '../domain/types.js';

/** Late-start threshold per Sprint 5 spec: > 5 min past plannedStartAt. */
export const LATE_START_THRESHOLD_MS = 5 * 60 * 1000;

const VALID_REASON_CODES = new Set(Object.values(ReasonCode));
const VALID_ARTIFACT_SCHEMAS = new Set(Object.values(ArtifactSchema));

/**
 * Legal FSM transitions per ARCHITECTURE §3.2 + ENGINE_DESIGN §5.2.
 * `null` target means illegal.
 */
const ACTIVITY_TRANSITIONS = Object.freeze({
  START: Object.freeze({ SCHEDULED: 'IN_PROGRESS' }),
  CLOSE: Object.freeze({ IN_PROGRESS: 'CLOSED' }),
  SKIP: Object.freeze({ SCHEDULED: 'SKIPPED' })
});

/**
 * Raise a named error with optional detail fields.
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

/**
 * Convert `plannedStartAt` — which may be an ISO timestamp, 'HH:MM', or
 * 'HH:MM:SS' — into a Date using the `referenceDate` as the day anchor.
 *
 * Returns null if no meaningful start time can be computed (e.g. missing
 * anchor). Callers should treat null as "cannot compute lateness"; we
 * skip the late-start check in that case rather than guessing.
 *
 * @param {string|null|undefined} plannedStartAt
 * @param {string|Date} referenceDate
 * @returns {Date|null}
 */
export function toPlannedStartDate(plannedStartAt, referenceDate) {
  if (!plannedStartAt || typeof plannedStartAt !== 'string') return null;
  // Full ISO timestamp (with or without fractional seconds).
  if (/T\d{2}:\d{2}/.test(plannedStartAt)) {
    const d = new Date(plannedStartAt);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  // HH:MM or HH:MM:SS anchored to the reference date.
  const refDate =
    referenceDate instanceof Date ? referenceDate : new Date(referenceDate);
  if (Number.isNaN(refDate.getTime())) return null;
  const m = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(plannedStartAt);
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  const ss = m[3] ? Number(m[3]) : 0;
  // Anchor to UTC day midnight + offset — matches the composer's ISO day start.
  const anchored = new Date(
    Date.UTC(
      refDate.getUTCFullYear(),
      refDate.getUTCMonth(),
      refDate.getUTCDate(),
      hh,
      mm,
      ss,
      0
    )
  );
  return anchored;
}

/**
 * Validate an OutputArtifactRef against the catalog entry's schema.
 *
 * Returns `{ok: true}` on pass, else `{ok: false, reason}`.
 *
 * @param {object|null|undefined} ref
 * @param {object|null|undefined} catalogEntry
 * @returns {{ok: true} | {ok: false, reason: string}}
 */
export function validateArtifactRef(ref, catalogEntry) {
  if (!ref || typeof ref !== 'object') {
    return { ok: false, reason: 'ARTIFACT_MISSING' };
  }
  const { schema, value } = ref;
  if (!VALID_ARTIFACT_SCHEMAS.has(schema)) {
    return { ok: false, reason: 'ARTIFACT_SCHEMA_INVALID' };
  }
  // If we know the catalog entry, enforce the schema match.
  if (catalogEntry && catalogEntry.outputArtifact) {
    const expected = catalogEntry.outputArtifact.schema;
    if (expected && expected !== schema) {
      return { ok: false, reason: 'ARTIFACT_SCHEMA_MISMATCH' };
    }
  }
  // Per-schema value shape checks — the UI dialog collects; we validate again
  // here so the service is the single source of truth.
  switch (schema) {
    case 'TEXT':
      if (typeof value !== 'string' || value.length === 0) {
        return { ok: false, reason: 'ARTIFACT_TEXT_EMPTY' };
      }
      return { ok: true };
    case 'TWO_LIST':
      if (
        !value ||
        typeof value !== 'object' ||
        !Array.isArray(value.left) ||
        !Array.isArray(value.right) ||
        value.left.length === 0 ||
        value.right.length === 0
      ) {
        return { ok: false, reason: 'ARTIFACT_TWO_LIST_EMPTY' };
      }
      return { ok: true };
    case 'NUMERIC':
      if (
        !value ||
        typeof value !== 'object' ||
        typeof value.amount !== 'number' ||
        !Number.isFinite(value.amount)
      ) {
        return { ok: false, reason: 'ARTIFACT_NUMERIC_INVALID' };
      }
      return { ok: true };
    case 'DOCUMENT':
    case 'CHART':
      if (
        !value ||
        typeof value !== 'object' ||
        typeof value.url !== 'string' ||
        value.url.length === 0 ||
        typeof value.title !== 'string' ||
        value.title.length === 0
      ) {
        return { ok: false, reason: 'ARTIFACT_REF_INCOMPLETE' };
      }
      return { ok: true };
    default:
      return { ok: false, reason: 'ARTIFACT_SCHEMA_INVALID' };
  }
}

export class ActivityService {
  /**
   * @param {{
   *   repo: import('../persistence/IRepository.js').IRepository,
   *   bus: { publish: (event: string, payload: any) => void },
   *   clock: import('./ClockService.js').ClockService,
   *   varianceService: import('./VarianceService.js').VarianceService,
   *   catalogService?: import('./CatalogService.js').CatalogService,
   *   composerService?: import('./ComposerService.js').ComposerService
   * }} deps
   */
  constructor({ repo, bus, clock, varianceService, catalogService, composerService } = {}) {
    if (!repo) fail('INVALID_DEPS', 'ActivityService: repo is required');
    if (!bus || typeof bus.publish !== 'function') {
      fail('INVALID_DEPS', 'ActivityService: bus with publish() is required');
    }
    if (!clock || typeof clock.now !== 'function') {
      fail('INVALID_DEPS', 'ActivityService: clock with now() is required');
    }
    if (!varianceService || typeof varianceService.log !== 'function') {
      fail('INVALID_DEPS', 'ActivityService: varianceService.log() is required');
    }
    this._repo = repo;
    this._bus = bus;
    this._clock = clock;
    this._varianceService = varianceService;
    this._catalogService = catalogService ?? null;
    this._composerService = composerService ?? null;
  }

  /**
   * Read the ScheduledActivity row. Throws ACTIVITY_NOT_FOUND if absent.
   *
   * @private
   * @param {string} id
   * @returns {object}
   */
  _readActivity(id) {
    if (typeof id !== 'string' || id.length === 0) {
      fail('INVALID_ID', 'ActivityService: scheduledActivityId is required');
    }
    const acts = this._repo.read(ACTIVITIES_KEY) ?? {};
    const a = acts[id];
    if (!a) {
      fail(
        'ACTIVITY_NOT_FOUND',
        `ActivityService: scheduledActivity '${id}' not found`,
        { scheduledActivityId: id }
      );
    }
    return a;
  }

  /**
   * Write a single ScheduledActivity row back. Wraps in try/restore so a
   * failed write rolls back in-memory state.
   *
   * @private
   * @param {object} activity
   */
  _writeActivity(activity) {
    const acts = this._repo.read(ACTIVITIES_KEY) ?? {};
    const next = { ...acts, [activity.id]: activity };
    this._repo.write(ACTIVITIES_KEY, next);
  }

  /**
   * Resolve the catalog entry for a given activity's catalogEntryId.
   * Returns null if we can't resolve (test might not wire catalogService).
   *
   * @private
   * @param {object} activity
   * @returns {object|null}
   */
  _resolveCatalogEntry(activity) {
    if (!this._catalogService) return null;
    const list = this._catalogService.list(activity.userId ?? null);
    if (!Array.isArray(list)) return null;
    return list.find((c) => c && c.id === activity.catalogEntryId) ?? null;
  }

  /**
   * Transition SCHEDULED → IN_PROGRESS.
   *
   * Emits ActivityStarted; if `now > plannedStartAt + 5 min` also emits
   * ActivityStartedLate (same transaction).
   *
   * @param {string} scheduledActivityId
   * @returns {object} the updated activity
   */
  start(scheduledActivityId) {
    const a = this._readActivity(scheduledActivityId);
    const target = ACTIVITY_TRANSITIONS.START[a.state];
    if (!target) {
      fail(
        'ILLEGAL_TRANSITION',
        `ActivityService.start: activity '${scheduledActivityId}' is '${a.state}', cannot START (expected SCHEDULED)`,
        { scheduledActivityId, fromState: a.state }
      );
    }
    const now = this._clock.now();
    const nextActivity = {
      ...a,
      state: target,
      actualStartAt: now,
      updatedAt: now
    };
    this._writeActivity(nextActivity);

    // Derive the reference date for HH:MM anchors from the activity's
    // plannedStartAt if it's already an ISO, else from the composition's
    // startAt (read lazily to avoid a second repo call when not needed).
    const planned = toPlannedStartDate(a.plannedStartAt, this._deriveRefDate(a));
    let lateBy = null;
    if (planned) {
      const nowDate = new Date(now);
      if (!Number.isNaN(nowDate.getTime())) {
        const deltaMs = nowDate.getTime() - planned.getTime();
        if (deltaMs > LATE_START_THRESHOLD_MS) {
          lateBy = Math.round(deltaMs / 1000);
        }
      }
    }

    this._bus.publish(ActivityStarted, {
      scheduledActivityId,
      compositionId: a.compositionId,
      actualStartAt: now,
      plannedStartAt: a.plannedStartAt ?? null
    });
    if (lateBy !== null) {
      this._bus.publish(ActivityStartedLate, {
        scheduledActivityId,
        compositionId: a.compositionId,
        actualStartAt: now,
        plannedStartAt: a.plannedStartAt ?? null,
        lateBySeconds: lateBy
      });
    }

    return nextActivity;
  }

  /**
   * Transition IN_PROGRESS → CLOSED with an OutputArtifactRef matching the
   * catalog entry's schema.
   *
   * @param {string} scheduledActivityId
   * @param {{outputArtifactRef: object}} options
   * @returns {object} the updated activity
   */
  close(scheduledActivityId, options) {
    const a = this._readActivity(scheduledActivityId);
    const target = ACTIVITY_TRANSITIONS.CLOSE[a.state];
    if (!target) {
      fail(
        'ILLEGAL_TRANSITION',
        `ActivityService.close: activity '${scheduledActivityId}' is '${a.state}', cannot CLOSE (expected IN_PROGRESS)`,
        { scheduledActivityId, fromState: a.state }
      );
    }
    const ref = options ? options.outputArtifactRef : null;
    if (!ref) {
      fail(
        'CLOSE_REQUIRES_ARTIFACT',
        'ActivityService.close: outputArtifactRef is required',
        { scheduledActivityId }
      );
    }
    const entry = this._resolveCatalogEntry(a);
    const check = validateArtifactRef(ref, entry);
    if (!check.ok) {
      fail(
        check.reason,
        `ActivityService.close: artifact failed validation — ${check.reason}`,
        { scheduledActivityId, reason: check.reason }
      );
    }

    const now = this._clock.now();
    const nextActivity = {
      ...a,
      state: target,
      actualEndAt: now,
      outputArtifactRef: { schema: ref.schema, value: ref.value },
      updatedAt: now
    };
    this._writeActivity(nextActivity);

    this._bus.publish(ActivityCompleted, {
      scheduledActivityId,
      compositionId: a.compositionId,
      actualEndAt: now,
      outputArtifactSchema: ref.schema
    });

    return nextActivity;
  }

  /**
   * Transition SCHEDULED → SKIPPED with a ReasonCode. Logs a Variance
   * (kind=SKIPPED_NON_OPTIONAL) via VarianceService.
   *
   * @param {string} scheduledActivityId
   * @param {{reasonCode: string, note?: string|null}} options
   * @returns {{activity: object, variance: object}}
   */
  skip(scheduledActivityId, options) {
    const a = this._readActivity(scheduledActivityId);
    const target = ACTIVITY_TRANSITIONS.SKIP[a.state];
    if (!target) {
      fail(
        'ILLEGAL_TRANSITION',
        `ActivityService.skip: activity '${scheduledActivityId}' is '${a.state}', cannot SKIP (expected SCHEDULED)`,
        { scheduledActivityId, fromState: a.state }
      );
    }
    const reasonCode = options ? options.reasonCode : undefined;
    const note = options && options.note !== undefined ? options.note : null;
    if (!reasonCode) {
      fail(
        'SKIP_REQUIRES_REASON',
        'ActivityService.skip: reasonCode is required',
        { scheduledActivityId }
      );
    }
    if (!VALID_REASON_CODES.has(reasonCode)) {
      fail(
        'INVALID_REASON_CODE',
        `ActivityService.skip: '${reasonCode}' is not a valid ReasonCode`,
        { scheduledActivityId, reasonCode }
      );
    }
    if (reasonCode === 'OTHER') {
      if (typeof note !== 'string' || note.length === 0) {
        fail(
          'OTHER_REQUIRES_NOTE',
          'ActivityService.skip: reasonCode=OTHER requires a non-empty note',
          { scheduledActivityId, reasonCode }
        );
      }
    }

    const now = this._clock.now();
    const nextActivity = {
      ...a,
      state: target,
      reasonCodeIfSkipped: reasonCode,
      updatedAt: now
    };

    // Look up the composition to get userId (ScheduledActivity has compositionId
    // but not userId directly in the composer's output shape).
    const userId = this._resolveUserId(a);

    // Write activity first; if variance append fails we roll back.
    const priorActs = this._repo.read(ACTIVITIES_KEY) ?? {};
    this._writeActivity(nextActivity);
    let variance;
    try {
      variance = this._varianceService.log({
        scheduledActivityId,
        compositionId: a.compositionId,
        catalogEntryId: a.catalogEntryId,
        userId,
        kind: 'SKIPPED_NON_OPTIONAL',
        reasonCode,
        note
      });
    } catch (err) {
      // Roll back activity state.
      this._repo.write(ACTIVITIES_KEY, priorActs);
      throw err;
    }

    return { activity: nextActivity, variance };
  }

  /**
   * Resolve the parent composition's userId. Falls back to the activity's
   * own userId field if present (legacy/test fixtures).
   *
   * @private
   * @param {object} activity
   * @returns {string}
   */
  _resolveUserId(activity) {
    if (typeof activity.userId === 'string' && activity.userId.length > 0) {
      return activity.userId;
    }
    const comps = this._repo.read(COMPOSITIONS_KEY) ?? {};
    const comp = comps[activity.compositionId];
    if (comp && typeof comp.userId === 'string' && comp.userId.length > 0) {
      return comp.userId;
    }
    return 'user_unknown';
  }

  /**
   * Derive a reference date for HH:MM anchors from a ScheduledActivity.
   * Prefers the composition startAt, falls back to today.
   *
   * If `startAt` is an ISO-ish string without a timezone suffix, we append
   * 'Z' so the parse is UTC-deterministic — avoids TZ-sensitivity in tests.
   *
   * @private
   * @param {object} activity
   * @returns {Date}
   */
  _deriveRefDate(activity) {
    const comps = this._repo.read(COMPOSITIONS_KEY) ?? {};
    const comp = comps[activity.compositionId];
    if (comp && typeof comp.startAt === 'string') {
      let s = comp.startAt;
      // Force UTC interpretation when no TZ suffix present.
      if (/T\d{2}:\d{2}/.test(s) && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(s)) {
        s = `${s}Z`;
      }
      const d = new Date(s);
      if (!Number.isNaN(d.getTime())) return d;
    }
    return this._clock.nowDate();
  }
}

export default ActivityService;
