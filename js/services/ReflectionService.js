/**
 * ReflectionService — Sprint 6 E6 (P0-T1).
 *
 * Owner of the `bamx:v1:reflections` keyed map. Implements the
 * Reflection FSM (ENGINE_DESIGN §5.5):
 *
 *   (new) → pending=true          via stubOnClose(scheduledActivity)
 *   pending=true → pending=false  via capture(id, { ...fields })
 *
 * Subscribes to `ActivityCompleted` at boot (wired in app.js) — the
 * service itself is graph-acyclic: ActivityService does not call
 * ReflectionService. Instead app.js bridges the bus event to
 * `reflectionService.stubOnClose(activity)`.
 *
 * Persistence:
 *   bamx:v1:reflections — id → Reflection (§2.6)
 *
 * Events emitted:
 *   ReflectionStubbed   — on stubOnClose, post-persist
 *   ReflectionCaptured  — on capture, post-persist, carries onTime boolean
 *
 * Named errors:
 *   INVALID_DEPS
 *   REFLECTION_ALREADY_EXISTS      — stubOnClose called twice for same activity
 *   REFLECTION_NOT_FOUND           — capture on unknown id
 *   REFLECTION_ALREADY_CAPTURED    — capture on pending=false row
 *   REFLECTION_REQUIRES_TEXT       — capture with both text fields empty
 *   INVALID_INPUT
 *
 * No direct `localStorage`; no `Date.now()`. Pure service.
 */

import {
  ReflectionStubbed,
  ReflectionCaptured
} from '../events/events.js';
import { ReflectionKind } from '../domain/types.js';

export const REFLECTIONS_KEY = 'bamx:v1:reflections';

/** Late-capture threshold — "on time" is within 15 min of actualEndAt. */
export const REFLECTION_ON_TIME_THRESHOLD_MS = 15 * 60 * 1000;

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

/**
 * Deterministic reflection id. Format: `ref_<sa>`.
 *
 * @param {string} scheduledActivityId
 * @returns {string}
 */
export function buildReflectionId(scheduledActivityId) {
  const safe = String(scheduledActivityId ?? 'unknown').replace(
    /[^a-zA-Z0-9_]/g,
    '_'
  );
  return `ref_${safe}`;
}

/**
 * Compute planVsActualMinutes: `(actualEnd - actualStart) - plannedDuration`.
 * Positive = overran; negative = underran. Returns 0 if we can't compute.
 *
 * @param {object} activity
 * @returns {number}
 */
export function computePlanVsActualMinutes(activity) {
  if (!activity || typeof activity !== 'object') return 0;
  const planned = Number(activity.plannedDurationMinutes);
  const startAt = activity.actualStartAt;
  const endAt = activity.actualEndAt;
  if (!startAt || !endAt) return 0;
  const s = new Date(startAt).getTime();
  const e = new Date(endAt).getTime();
  if (!Number.isFinite(s) || !Number.isFinite(e)) return 0;
  const actualMin = Math.round((e - s) / 60000);
  const plannedMin = Number.isFinite(planned) ? planned : 0;
  return actualMin - plannedMin;
}

export class ReflectionService {
  /**
   * @param {{
   *   repo: import('../persistence/IRepository.js').IRepository,
   *   bus: { publish: (event: string, payload: any) => void },
   *   clock: import('./ClockService.js').ClockService,
   *   frictionService?: import('./FrictionService.js').FrictionService
   * }} deps
   */
  constructor({ repo, bus, clock, frictionService } = {}) {
    if (!repo) fail('INVALID_DEPS', 'ReflectionService: repo is required');
    if (!bus || typeof bus.publish !== 'function') {
      fail('INVALID_DEPS', 'ReflectionService: bus with publish() is required');
    }
    if (!clock || typeof clock.now !== 'function') {
      fail('INVALID_DEPS', 'ReflectionService: clock with now() is required');
    }
    this._repo = repo;
    this._bus = bus;
    this._clock = clock;
    this._frictionService = frictionService ?? null;
  }

  /**
   * Inject the FrictionService after construction — used by app.js to
   * resolve the cycle (ReflectionService may or may not want a Friction
   * dependency at build time; wiring at boot is cleaner).
   *
   * @param {import('./FrictionService.js').FrictionService} frictionService
   */
  setFrictionService(frictionService) {
    this._frictionService = frictionService ?? null;
  }

  /**
   * Read all reflections (helpful in tests).
   *
   * @returns {object[]}
   */
  _readAll() {
    const map = this._repo.read(REFLECTIONS_KEY) ?? {};
    return Object.values(map);
  }

  /**
   * Look up a Reflection by id.
   *
   * @param {string} id
   * @returns {object|null}
   */
  getById(id) {
    const map = this._repo.read(REFLECTIONS_KEY) ?? {};
    return map[id] ?? null;
  }

  /**
   * Look up a Reflection by scheduledActivityId. Returns null when absent.
   *
   * @param {string} scheduledActivityId
   * @returns {object|null}
   */
  getByScheduledActivityId(scheduledActivityId) {
    if (
      typeof scheduledActivityId !== 'string' ||
      scheduledActivityId.length === 0
    ) {
      return null;
    }
    const map = this._repo.read(REFLECTIONS_KEY) ?? {};
    for (const r of Object.values(map)) {
      if (r && r.scheduledActivityId === scheduledActivityId) return r;
    }
    return null;
  }

  /**
   * Stub a Reflection row with pending=true for a just-closed activity.
   *
   * Throws REFLECTION_ALREADY_EXISTS if a Reflection is already present
   * for this scheduledActivityId — preserves the "exactly one" invariant.
   *
   * @param {object} scheduledActivity
   * @returns {object} the persisted reflection stub
   */
  stubOnClose(scheduledActivity) {
    if (!scheduledActivity || typeof scheduledActivity !== 'object') {
      fail(
        'INVALID_INPUT',
        'ReflectionService.stubOnClose: scheduledActivity is required'
      );
    }
    const sa = scheduledActivity;
    if (typeof sa.id !== 'string' || sa.id.length === 0) {
      fail(
        'INVALID_INPUT',
        'ReflectionService.stubOnClose: scheduledActivity.id required'
      );
    }
    const existing = this.getByScheduledActivityId(sa.id);
    if (existing) {
      fail(
        'REFLECTION_ALREADY_EXISTS',
        `ReflectionService.stubOnClose: reflection already exists for activity '${sa.id}'`,
        { scheduledActivityId: sa.id, reflectionId: existing.id }
      );
    }

    const id = buildReflectionId(sa.id);
    const planVsActualMinutes = computePlanVsActualMinutes(sa);
    const reflection = {
      id,
      scheduledActivityId: sa.id,
      userId: sa.userId ?? null,
      pending: true,
      capturedAt: null,
      planVsActualMinutes,
      whatWentWell: null,
      whatToImprove: null,
      frictionFlag: false,
      frictionSignalId: null,
      kind: ReflectionKind.END_OF_ACTIVITY,
      dmaicDraft: null
    };

    this._repo.upsert(REFLECTIONS_KEY, id, reflection);
    this._bus.publish(ReflectionStubbed, {
      reflectionId: id,
      scheduledActivityId: sa.id,
      planVsActualMinutes
    });

    return reflection;
  }

  /**
   * Capture (complete) a pending Reflection. Flips pending=false, sets
   * `capturedAt`, persists whatWentWell/whatToImprove/frictionFlag, and
   * (if frictionFlag=true) creates a FrictionSignal via FrictionService.
   *
   * @param {string} reflectionId
   * @param {{
   *   whatWentWell?: string|null,
   *   whatToImprove?: string|null,
   *   frictionFlag?: boolean,
   *   frictionSummary?: string|null,
   *   frictionTag?: string|null,
   *   scheduledActivity?: object,
   *   userId?: string
   * }} fields
   * @returns {{reflection: object, onTime: boolean, frictionSignal: object|null}}
   */
  capture(reflectionId, fields = {}) {
    if (typeof reflectionId !== 'string' || reflectionId.length === 0) {
      fail('INVALID_INPUT', 'ReflectionService.capture: reflectionId required');
    }
    const existing = this.getById(reflectionId);
    if (!existing) {
      fail(
        'REFLECTION_NOT_FOUND',
        `ReflectionService.capture: reflection '${reflectionId}' not found`,
        { reflectionId }
      );
    }
    if (existing.pending === false) {
      fail(
        'REFLECTION_ALREADY_CAPTURED',
        `ReflectionService.capture: reflection '${reflectionId}' already captured`,
        { reflectionId, capturedAt: existing.capturedAt }
      );
    }

    const whatWentWell =
      typeof fields.whatWentWell === 'string' && fields.whatWentWell.length > 0
        ? fields.whatWentWell
        : null;
    const whatToImprove =
      typeof fields.whatToImprove === 'string' && fields.whatToImprove.length > 0
        ? fields.whatToImprove
        : null;

    if (whatWentWell === null && whatToImprove === null) {
      fail(
        'REFLECTION_REQUIRES_TEXT',
        'ReflectionService.capture: at least one of whatWentWell / whatToImprove must be non-empty',
        { reflectionId }
      );
    }

    const frictionFlag = fields.frictionFlag === true;
    const now = this._clock.now();

    // Compute on-time BEFORE persisting so the event payload is accurate.
    const onTime = this._computeOnTime(existing, fields.scheduledActivity, now);

    // Create friction signal first (so we can set frictionSignalId).
    let frictionSignal = null;
    if (frictionFlag) {
      if (!this._frictionService) {
        fail(
          'FRICTION_SERVICE_UNAVAILABLE',
          'ReflectionService.capture: frictionFlag=true but FrictionService not wired'
        );
      }
      const summary =
        typeof fields.frictionSummary === 'string' &&
        fields.frictionSummary.length > 0
          ? fields.frictionSummary
          : whatToImprove ?? whatWentWell ?? '';
      const tag =
        typeof fields.frictionTag === 'string' && fields.frictionTag.length > 0
          ? fields.frictionTag
          : null;
      const userId =
        fields.userId ?? existing.userId ?? 'user_unknown';
      frictionSignal = this._frictionService.capture({
        reflectionId,
        scheduledActivityId: existing.scheduledActivityId,
        userId,
        summary,
        tag
      });
    }

    const next = {
      ...existing,
      pending: false,
      capturedAt: now,
      whatWentWell,
      whatToImprove,
      frictionFlag,
      frictionSignalId: frictionSignal ? frictionSignal.id : null
    };
    this._repo.upsert(REFLECTIONS_KEY, reflectionId, next);

    this._bus.publish(ReflectionCaptured, {
      reflectionId,
      scheduledActivityId: existing.scheduledActivityId,
      capturedAt: now,
      onTime,
      frictionFlag,
      frictionSignalId: frictionSignal ? frictionSignal.id : null
    });

    return { reflection: next, onTime, frictionSignal };
  }

  /**
   * Compute on-time-ness of a capture. Prefers the scheduledActivity's
   * actualEndAt when provided; falls back to reading the activity from
   * the shared activities map via the repo (best effort).
   *
   * @param {object} reflection
   * @param {object|undefined} scheduledActivity
   * @param {string} nowIso
   * @returns {boolean}
   */
  _computeOnTime(reflection, scheduledActivity, nowIso) {
    let actualEndAt = null;
    if (scheduledActivity && typeof scheduledActivity === 'object') {
      actualEndAt = scheduledActivity.actualEndAt ?? null;
    }
    if (!actualEndAt && reflection && reflection.scheduledActivityId) {
      const acts = this._repo.read('bamx:v1:activities') ?? {};
      const sa = acts[reflection.scheduledActivityId];
      if (sa) actualEndAt = sa.actualEndAt ?? null;
    }
    if (!actualEndAt) return false;
    const endMs = new Date(actualEndAt).getTime();
    const nowMs = new Date(nowIso).getTime();
    if (!Number.isFinite(endMs) || !Number.isFinite(nowMs)) return false;
    return nowMs - endMs <= REFLECTION_ON_TIME_THRESHOLD_MS;
  }

  /**
   * List all pending reflections (helpful for wizards / debugging).
   *
   * @returns {object[]}
   */
  listPending() {
    return this._readAll().filter((r) => r && r.pending === true);
  }
}

export default ReflectionService;
