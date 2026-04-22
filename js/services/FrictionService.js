/**
 * FrictionService — Sprint 6 E6 (P0-T2).
 *
 * The SINGLE writer for the append-only `bamx:v1:frictionSignals` table.
 * Once a FrictionSignal is captured it is immutable except via the
 * `updateStatus()` method (the only status mutator), which itself is
 * restricted to transitions allowed by the FrictionSignal FSM
 * (ENGINE_DESIGN §5.4). PROMOTED_TO_KAIZEN is terminal.
 *
 * Methods:
 *   capture({reflectionId, scheduledActivityId, userId, summary, tag})
 *                                    — create OPEN signal; emit FrictionSignalCaptured
 *   list({userId, status?})          — read signals, optional status filter
 *   listByReflectionId(reflectionId) — all signals belonging to a reflection
 *   clusterByTag(userId, windowDays) — group OPEN+CLUSTERED signals by tag
 *                                      within the N-day window ending now
 *   updateStatus(id, nextStatus, {kaizenId?})
 *                                    — only way to mutate status (used
 *                                      internally by KaizenService.promote)
 *
 * Guards:
 *   SUMMARY_TOO_LONG    — summary.length > 140
 *   INVALID_TAG         — tag not in FrictionTag enum
 *   INVALID_USER_ID     — userId must be non-empty string
 *   INVALID_STATUS      — updateStatus with illegal target
 *   ILLEGAL_TRANSITION  — e.g. PROMOTED_TO_KAIZEN is terminal
 *   SIGNAL_NOT_FOUND    — updateStatus on unknown id
 *
 * No direct localStorage or Date. Pure DI. Per ARCHITECTURE §2.8.
 */

import { FrictionSignalCaptured } from '../events/events.js';
import { FrictionTag, FrictionStatus } from '../domain/types.js';

export const FRICTION_SIGNALS_KEY = 'bamx:v1:frictionSignals';

export const FRICTION_SUMMARY_MAX_LENGTH = 140;
export const DEFAULT_CLUSTER_WINDOW_DAYS = 7;

const VALID_TAGS = new Set(Object.values(FrictionTag));
const VALID_STATUSES = new Set(Object.values(FrictionStatus));

/** Statuses that count toward pending/clusterable (non-terminal). */
const NON_TERMINAL_STATUSES = new Set([
  FrictionStatus.OPEN,
  FrictionStatus.CLUSTERED
]);

/**
 * Legal FSM transitions per ENGINE_DESIGN §5.4.
 */
const TRANSITIONS = Object.freeze({
  OPEN: new Set(['CLUSTERED', 'PROMOTED_TO_KAIZEN', 'DISMISSED']),
  CLUSTERED: new Set(['OPEN', 'PROMOTED_TO_KAIZEN', 'DISMISSED']),
  PROMOTED_TO_KAIZEN: new Set(),
  DISMISSED: new Set()
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

/**
 * Deterministic FrictionSignal id.
 *
 * @param {string} reflectionId
 * @param {string} capturedAt
 * @returns {string}
 */
export function buildFrictionSignalId(reflectionId, capturedAt) {
  const safeRef = String(reflectionId ?? 'unknown').replace(
    /[^a-zA-Z0-9_]/g,
    '_'
  );
  const safeTs = String(capturedAt ?? '').replace(/[^0-9]/g, '');
  return `fs_${safeRef}_${safeTs}`;
}

export class FrictionService {
  /**
   * @param {{
   *   repo: import('../persistence/IRepository.js').IRepository,
   *   bus: { publish: (event: string, payload: any) => void },
   *   clock: import('./ClockService.js').ClockService
   * }} deps
   */
  constructor({ repo, bus, clock } = {}) {
    if (!repo) fail('INVALID_DEPS', 'FrictionService: repo is required');
    if (!bus || typeof bus.publish !== 'function') {
      fail('INVALID_DEPS', 'FrictionService: bus with publish() is required');
    }
    if (!clock || typeof clock.now !== 'function') {
      fail('INVALID_DEPS', 'FrictionService: clock with now() is required');
    }
    if (typeof repo.appendOnly !== 'function') {
      fail('INVALID_DEPS', 'FrictionService: repo.appendOnly() is required');
    }
    this._repo = repo;
    this._bus = bus;
    this._clock = clock;
  }

  /**
   * Append a FrictionSignal row. Returns the persisted signal.
   *
   * @param {{
   *   reflectionId: string,
   *   scheduledActivityId: string,
   *   userId: string,
   *   summary: string,
   *   tag?: string|null,
   *   id?: string
   * }} row
   * @returns {object}
   */
  capture(row) {
    if (!row || typeof row !== 'object') {
      fail('INVALID_INPUT', 'FrictionService.capture: row required');
    }
    const {
      reflectionId,
      scheduledActivityId,
      userId,
      summary
    } = row;
    const tag = row.tag ?? null;

    if (typeof reflectionId !== 'string' || reflectionId.length === 0) {
      fail(
        'INVALID_INPUT',
        'FrictionService.capture: reflectionId must be a non-empty string'
      );
    }
    if (
      typeof scheduledActivityId !== 'string' ||
      scheduledActivityId.length === 0
    ) {
      fail(
        'INVALID_INPUT',
        'FrictionService.capture: scheduledActivityId must be a non-empty string'
      );
    }
    if (typeof userId !== 'string' || userId.length === 0) {
      fail(
        'INVALID_USER_ID',
        'FrictionService.capture: userId must be a non-empty string'
      );
    }
    if (typeof summary !== 'string') {
      fail('INVALID_INPUT', 'FrictionService.capture: summary must be a string');
    }
    if (summary.length > FRICTION_SUMMARY_MAX_LENGTH) {
      fail(
        'SUMMARY_TOO_LONG',
        `FrictionService.capture: summary exceeds ${FRICTION_SUMMARY_MAX_LENGTH} chars (got ${summary.length})`,
        { length: summary.length, max: FRICTION_SUMMARY_MAX_LENGTH }
      );
    }
    if (tag !== null && !VALID_TAGS.has(tag)) {
      fail(
        'INVALID_TAG',
        `FrictionService.capture: '${tag}' is not a valid FrictionTag`,
        { tag }
      );
    }

    const capturedAt = this._clock.now();
    const id = row.id ?? buildFrictionSignalId(reflectionId, capturedAt);
    const signal = {
      id,
      reflectionId,
      scheduledActivityId,
      userId,
      summary,
      tag,
      status: FrictionStatus.OPEN,
      kaizenId: null,
      capturedAt
    };

    // appendOnly enforces the "once written, never overwritten" rule for
    // the base row. Status transitions use a different code path that
    // read-modify-writes via `repo.upsert` but routes through
    // `updateStatus` so transitions are validated.
    this._repo.appendOnly(FRICTION_SIGNALS_KEY, id, signal);

    this._bus.publish(FrictionSignalCaptured, {
      frictionSignalId: id,
      reflectionId,
      scheduledActivityId,
      userId,
      tag,
      capturedAt
    });

    return signal;
  }

  /**
   * Read all friction signals. Optional filters by `userId` and `status`.
   *
   * @param {{userId?: string, status?: string|'__nonTerminal__'}} [opts]
   * @returns {object[]}
   */
  list(opts = {}) {
    const { userId, status } = opts ?? {};
    const map = this._repo.read(FRICTION_SIGNALS_KEY) ?? {};
    let all = Object.values(map);
    if (typeof userId === 'string' && userId.length > 0) {
      all = all.filter((s) => s && s.userId === userId);
    }
    if (typeof status === 'string' && status.length > 0) {
      if (status === '__nonTerminal__') {
        all = all.filter((s) => s && NON_TERMINAL_STATUSES.has(s.status));
      } else {
        all = all.filter((s) => s && s.status === status);
      }
    } else if (status === undefined) {
      // Default: non-terminal only (the useful "pending" set).
      all = all.filter((s) => s && NON_TERMINAL_STATUSES.has(s.status));
    }
    return all;
  }

  /**
   * List every signal linked to a reflection (any status).
   *
   * @param {string} reflectionId
   * @returns {object[]}
   */
  listByReflectionId(reflectionId) {
    if (typeof reflectionId !== 'string' || reflectionId.length === 0) return [];
    const map = this._repo.read(FRICTION_SIGNALS_KEY) ?? {};
    return Object.values(map).filter(
      (s) => s && s.reflectionId === reflectionId
    );
  }

  /**
   * Cluster OPEN + CLUSTERED signals for a user by `tag`, within a
   * window of `windowDays` ending at the clock's current time.
   *
   * @param {string} userId
   * @param {number} [windowDays=7]
   * @returns {{tag: string, count: number, signalIds: string[], latestCapturedAt: string|null}[]}
   */
  clusterByTag(userId, windowDays = DEFAULT_CLUSTER_WINDOW_DAYS) {
    if (typeof userId !== 'string' || userId.length === 0) {
      fail('INVALID_USER_ID', 'FrictionService.clusterByTag: userId required');
    }
    const days = Number.isFinite(windowDays) && windowDays > 0 ? windowDays : 7;
    const nowMs = new Date(this._clock.now()).getTime();
    const windowMs = days * 24 * 60 * 60 * 1000;
    const cutoffMs = nowMs - windowMs;

    const inWindow = this.list({ userId, status: '__nonTerminal__' }).filter(
      (s) => {
        const t = new Date(s.capturedAt).getTime();
        if (!Number.isFinite(t)) return false;
        return t >= cutoffMs;
      }
    );

    /** @type {Map<string, {tag: string, signalIds: string[], latest: number}>} */
    const groups = new Map();
    for (const s of inWindow) {
      const tagKey = s.tag ?? 'UNTAGGED';
      const entry = groups.get(tagKey) ?? {
        tag: tagKey,
        signalIds: [],
        latest: 0
      };
      entry.signalIds.push(s.id);
      const ts = new Date(s.capturedAt).getTime();
      if (Number.isFinite(ts) && ts > entry.latest) entry.latest = ts;
      groups.set(tagKey, entry);
    }

    const clusters = Array.from(groups.values()).map((g) => ({
      tag: g.tag,
      count: g.signalIds.length,
      signalIds: g.signalIds,
      latestCapturedAt: g.latest > 0 ? new Date(g.latest).toISOString() : null
    }));

    // Sort by count desc, then latestCapturedAt desc (recent wins ties).
    clusters.sort((a, b) => {
      if (a.count !== b.count) return b.count - a.count;
      const at = a.latestCapturedAt ?? '';
      const bt = b.latestCapturedAt ?? '';
      if (at < bt) return 1;
      if (at > bt) return -1;
      return 0;
    });
    return clusters;
  }

  /**
   * Update a signal's status. Validates FSM transitions per §5.4.
   * PROMOTED_TO_KAIZEN + DISMISSED are terminal; OPEN ↔ CLUSTERED is
   * allowed. Optional `kaizenId` is only accepted when moving to
   * PROMOTED_TO_KAIZEN.
   *
   * @param {string} id
   * @param {string} nextStatus
   * @param {{kaizenId?: string}} [opts]
   * @returns {object} the updated signal
   */
  updateStatus(id, nextStatus, opts = {}) {
    if (typeof id !== 'string' || id.length === 0) {
      fail('INVALID_INPUT', 'FrictionService.updateStatus: id required');
    }
    if (!VALID_STATUSES.has(nextStatus)) {
      fail(
        'INVALID_STATUS',
        `FrictionService.updateStatus: '${nextStatus}' is not a valid FrictionStatus`
      );
    }
    const map = this._repo.read(FRICTION_SIGNALS_KEY) ?? {};
    const signal = map[id];
    if (!signal) {
      fail(
        'SIGNAL_NOT_FOUND',
        `FrictionService.updateStatus: signal '${id}' not found`,
        { id }
      );
    }
    const allowed = TRANSITIONS[signal.status] ?? new Set();
    if (!allowed.has(nextStatus)) {
      fail(
        'ILLEGAL_TRANSITION',
        `FrictionService.updateStatus: signal '${id}' in '${signal.status}' cannot transition to '${nextStatus}'`,
        { id, fromStatus: signal.status, toStatus: nextStatus }
      );
    }
    const next = { ...signal, status: nextStatus };
    if (nextStatus === FrictionStatus.PROMOTED_TO_KAIZEN) {
      if (typeof opts.kaizenId !== 'string' || opts.kaizenId.length === 0) {
        fail(
          'INVALID_INPUT',
          'FrictionService.updateStatus: kaizenId required when transitioning to PROMOTED_TO_KAIZEN'
        );
      }
      next.kaizenId = opts.kaizenId;
    }
    // Write via upsert (the base row's immutability is protected by the
    // appendOnly guard on capture; subsequent status-only writes are
    // intentional).
    map[id] = next;
    this._repo.write(FRICTION_SIGNALS_KEY, map);
    return next;
  }
}

export default FrictionService;
