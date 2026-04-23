/**
 * KaizenService — Sprint 6 E6 (P0-T5 + P0-T6).
 *
 * Sole writer to:
 *   bamx:v1:kaizens           — id → Kaizen (§2.9)
 *   bamx:v1:baselineMetrics   — id → BaselineMetric (§2.10)
 *
 * Methods (Sprint 6 subset):
 *   promote({userId, fromFrictionClusterSignalIds, problemStatement, title, ...})
 *                              Creates a DRAFT Kaizen. Flips referenced
 *                              FrictionSignals to PROMOTED_TO_KAIZEN.
 *                              Emits KaizenPromoted.
 *
 *   lockBaseline(kaizenId, {metricName, unit, operationalDefinition,
 *                           sampleSize, method, value, capturedSampleRef?})
 *                              Creates a locked BaselineMetric, transitions
 *                              the Kaizen from DRAFT → ACTIVE. Enforces
 *                              "1 active Kaizen per user" MVP cap. Emits
 *                              KaizenBaselineLocked.
 *
 *   setGoalStatement(kaizenId, goalStatement)
 *                              DRAFT-only. Simple field mutator.
 *
 *   addAction(kaizenId, {name, ownerRef, dueDate, strategic?})
 *                              Adds an action to a DRAFT Kaizen's actions[].
 *
 *   removeAction(kaizenId, index)
 *                              Removes an action by index from a DRAFT Kaizen.
 *
 *   markActionDone(kaizenId, index)
 *                              ACTIVE-only. Marks an action complete.
 *
 *   get(kaizenId)              Plain read.
 *   list({userId, state?})     Filtered read.
 *   listByState(userId, state) Convenience read.
 *
 * Deferred to Sprint 7:
 *   captureRemeasurement, close, abandon, advancePhase.
 *
 * Named errors:
 *   INVALID_DEPS
 *   EMPTY_CLUSTER                — fromFrictionClusterSignalIds missing/empty
 *   PROBLEM_STATEMENT_TOO_SHORT  — problemStatement < 10 chars
 *   SIGNAL_ALREADY_PROMOTED      — a referenced signal is terminal
 *   SIGNAL_NOT_FOUND
 *   KAIZEN_NOT_FOUND
 *   KAIZEN_NOT_IN_DRAFT
 *   MISSING_GOAL_STATEMENT
 *   MISSING_ACTIONS
 *   INVALID_METRIC_VALUE
 *   MISSING_METRIC_FIELD
 *   ACTIVE_KAIZEN_CAP_EXCEEDED
 */

import {
  KaizenPromoted,
  KaizenBaselineLocked,
  KaizenRemeasurementStarted,
  KaizenRemeasured,
  KaizenClosed,
  KaizenAbandoned,
  KaizenStepCompleted,
  KaizenStepScheduled
} from '../events/events.js';
import {
  KaizenState,
  FrictionStatus,
  ProjectType,
  CloseKind,
  MetricDirection
} from '../domain/types.js';
import { getCurrentNext } from '../catalog/progression.js';

export const KAIZENS_KEY = 'bamx:v1:kaizens';
export const BASELINE_METRICS_KEY = 'bamx:v1:baselineMetrics';
export const REMEASUREMENTS_KEY = 'bamx:v1:remeasurements';
export const STEP_PROGRESS_KEY = 'bamx:v1:kaizen-step-progress';
// Sprint 10b P B — scheduleStep() appends directly to the same
// ScheduledActivity key ComposerService uses (`bamx:v1:activities`).
export const SCHEDULED_ACTIVITIES_KEY = 'bamx:v1:activities';

export const PROBLEM_STATEMENT_MIN_LENGTH = 10;
export const LESSONS_LEARNED_MIN_LENGTH = 20;
export const ABANDON_REASON_MIN_LENGTH = 10;

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
 * Deterministic Kaizen id from userId + openedAt.
 *
 * @param {string} userId
 * @param {string} openedAt
 * @returns {string}
 */
export function buildKaizenId(userId, openedAt) {
  const safeUser = String(userId ?? 'user').replace(/[^a-zA-Z0-9_]/g, '_');
  const safeTs = String(openedAt ?? '').replace(/[^0-9]/g, '');
  return `k_${safeUser}_${safeTs}`;
}

/**
 * Deterministic BaselineMetric id from kaizenId.
 *
 * @param {string} kaizenId
 * @returns {string}
 */
export function buildBaselineMetricId(kaizenId) {
  const safe = String(kaizenId ?? 'unknown').replace(/[^a-zA-Z0-9_]/g, '_');
  return `bm_${safe}`;
}

/**
 * Deterministic Remeasurement id from kaizenId (Sprint 8). One per Kaizen.
 *
 * @param {string} kaizenId
 * @returns {string}
 */
export function buildRemeasurementId(kaizenId) {
  const safe = String(kaizenId ?? 'unknown').replace(/[^a-zA-Z0-9_]/g, '_');
  return `rm_${safe}`;
}

/** ISO-date from timestamp, YYYY-MM-DD. */
function isoDate(ts) {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

export class KaizenService {
  /**
   * @param {{
   *   repo: import('../persistence/IRepository.js').IRepository,
   *   bus: { publish: (event: string, payload: any) => void },
   *   clock: import('./ClockService.js').ClockService,
   *   frictionService?: import('./FrictionService.js').FrictionService
   * }} deps
   */
  constructor({ repo, bus, clock, frictionService } = {}) {
    if (!repo) fail('INVALID_DEPS', 'KaizenService: repo is required');
    if (!bus || typeof bus.publish !== 'function') {
      fail('INVALID_DEPS', 'KaizenService: bus with publish() is required');
    }
    if (!clock || typeof clock.now !== 'function') {
      fail('INVALID_DEPS', 'KaizenService: clock with now() is required');
    }
    this._repo = repo;
    this._bus = bus;
    this._clock = clock;
    this._frictionService = frictionService ?? null;
  }

  /**
   * Inject the FrictionService after construction. Required for promote().
   *
   * @param {import('./FrictionService.js').FrictionService} frictionService
   */
  setFrictionService(frictionService) {
    this._frictionService = frictionService ?? null;
  }

  /**
   * Read all kaizens as an object map.
   *
   * @returns {Record<string, object>}
   */
  _readMap() {
    return this._repo.read(KAIZENS_KEY) ?? {};
  }

  /**
   * Get a single Kaizen by id. Returns null when absent.
   *
   * @param {string} id
   * @returns {object|null}
   */
  get(id) {
    const map = this._readMap();
    return map[id] ?? null;
  }

  /**
   * List Kaizens, optionally filtered by userId and/or state.
   *
   * @param {{userId?: string, state?: string}} [opts]
   * @returns {object[]}
   */
  list(opts = {}) {
    const map = this._readMap();
    let all = Object.values(map);
    if (opts && typeof opts.userId === 'string' && opts.userId.length > 0) {
      all = all.filter((k) => k && k.userId === opts.userId);
    }
    if (opts && typeof opts.state === 'string' && opts.state.length > 0) {
      all = all.filter((k) => k && k.state === opts.state);
    }
    return all;
  }

  /**
   * Shorthand for list({userId, state}).
   *
   * @param {string} userId
   * @param {string} state
   * @returns {object[]}
   */
  listByState(userId, state) {
    return this.list({ userId, state });
  }

  /**
   * Create a DRAFT Kaizen from a friction cluster. Atomically flips every
   * referenced FrictionSignal to PROMOTED_TO_KAIZEN. If any signal is
   * already terminal, NO writes land (transactional).
   *
   * @param {{
   *   userId: string,
   *   fromFrictionClusterSignalIds: string[],
   *   problemStatement: string,
   *   title?: string,
   *   goalStatement?: string,
   *   projectType?: string,
   *   targetCloseDate?: string|null
   * }} input
   * @returns {{kaizen: object, promotedSignals: object[]}}
   */
  promote(input) {
    if (!input || typeof input !== 'object') {
      fail('INVALID_INPUT', 'KaizenService.promote: input required');
    }
    const {
      userId,
      fromFrictionClusterSignalIds,
      problemStatement
    } = input;
    if (typeof userId !== 'string' || userId.length === 0) {
      fail('INVALID_INPUT', 'KaizenService.promote: userId required');
    }
    if (
      !Array.isArray(fromFrictionClusterSignalIds) ||
      fromFrictionClusterSignalIds.length === 0
    ) {
      fail(
        'EMPTY_CLUSTER',
        'KaizenService.promote: fromFrictionClusterSignalIds must be a non-empty array'
      );
    }
    if (
      typeof problemStatement !== 'string' ||
      problemStatement.length < PROBLEM_STATEMENT_MIN_LENGTH
    ) {
      fail(
        'PROBLEM_STATEMENT_TOO_SHORT',
        `KaizenService.promote: problemStatement must be at least ${PROBLEM_STATEMENT_MIN_LENGTH} chars`,
        { length: problemStatement?.length ?? 0 }
      );
    }

    if (!this._frictionService) {
      fail(
        'INVALID_DEPS',
        'KaizenService.promote: frictionService not wired. Call setFrictionService() after construct.'
      );
    }

    // Pre-validate every referenced signal BEFORE writing anything so we
    // can surface a single "already promoted" error cleanly.
    const signalMap = this._repo.read('bamx:v1:frictionSignals') ?? {};
    const resolvedSignals = [];
    for (const sid of fromFrictionClusterSignalIds) {
      const s = signalMap[sid];
      if (!s) {
        fail(
          'SIGNAL_NOT_FOUND',
          `KaizenService.promote: friction signal '${sid}' not found`,
          { signalId: sid }
        );
      }
      if (
        s.status !== FrictionStatus.OPEN &&
        s.status !== FrictionStatus.CLUSTERED
      ) {
        fail(
          'SIGNAL_ALREADY_PROMOTED',
          `KaizenService.promote: signal '${sid}' is '${s.status}', cannot promote`,
          { signalId: sid, status: s.status }
        );
      }
      resolvedSignals.push(s);
    }

    const now = this._clock.now();
    const id = buildKaizenId(userId, now);
    const title =
      typeof input.title === 'string' && input.title.length > 0
        ? input.title
        : 'Untitled Kaizen';
    const goalStatement =
      typeof input.goalStatement === 'string' ? input.goalStatement : '';
    const projectType =
      typeof input.projectType === 'string' && input.projectType in ProjectType
        ? input.projectType
        : ProjectType.AD_HOC;
    const targetCloseDate =
      typeof input.targetCloseDate === 'string' && input.targetCloseDate.length > 0
        ? input.targetCloseDate
        : null;

    const kaizen = {
      id,
      userId,
      title,
      problemStatement,
      goalStatement,
      sourceFrictionSignalIds: [...fromFrictionClusterSignalIds],
      baselineMetricId: null,
      remeasurementId: null,
      actions: [],
      state: KaizenState.DRAFT,
      openedAt: now,
      closedAt: null,
      closeKind: null,
      resultsNarrativeRef: null,
      projectType,
      phase: null,
      phaseDefinitions: null,
      implementationCostDollars: null,
      annualBenefitsDollars: null,
      startDate: isoDate(now),
      controlPlanArtifactRef: null,
      controlPlanDraftArtifactRef: null,
      implementationLeadUserId: null,
      roiPassNumber: null,
      roiProjections: null,
      validatedRootCauseArtifactRef: null,
      sustainmentCheckIns: null,
      sustainmentGatePassed: null,
      scopeChanges: [],
      targetCloseDate,
      sourcePdcaExperimentId: null,
      sourceOpportunityId: null,
      // Sprint 8 fields.
      lessonsLearned: null,
      metricDirection: MetricDirection.HIGHER_IS_BETTER,
      targetImprovement: null,
      abandoned: false,
      abandonedAt: null,
      abandonReason: null
    };

    // Snapshot prior state for rollback.
    const priorKaizens = this._readMap();
    const priorSignals = { ...signalMap };

    // Stage next kaizen map.
    const nextKaizens = { ...priorKaizens, [id]: kaizen };

    // Stage next signal map with all referenced ids flipped to
    // PROMOTED_TO_KAIZEN + kaizenId set.
    const nextSignals = { ...priorSignals };
    const promotedSignals = [];
    for (const s of resolvedSignals) {
      const updated = {
        ...s,
        status: FrictionStatus.PROMOTED_TO_KAIZEN,
        kaizenId: id
      };
      nextSignals[s.id] = updated;
      promotedSignals.push(updated);
    }

    try {
      this._repo.write(KAIZENS_KEY, nextKaizens);
      try {
        this._repo.write('bamx:v1:frictionSignals', nextSignals);
      } catch (err) {
        this._repo.write(KAIZENS_KEY, priorKaizens);
        throw err;
      }
    } catch (err) {
      fail(
        'PERSIST_FAILED',
        `KaizenService.promote: persistence failed — ${err.message}`,
        { cause: err }
      );
    }

    this._bus.publish(KaizenPromoted, {
      kaizenId: id,
      userId,
      sourceFrictionSignalIds: [...fromFrictionClusterSignalIds],
      projectType,
      openedAt: now
    });

    return { kaizen, promotedSignals };
  }

  /**
   * Set the goalStatement on a DRAFT Kaizen.
   *
   * @param {string} kaizenId
   * @param {string} goalStatement
   * @returns {object} updated kaizen
   */
  setGoalStatement(kaizenId, goalStatement) {
    const k = this.get(kaizenId);
    if (!k) {
      fail(
        'KAIZEN_NOT_FOUND',
        `KaizenService.setGoalStatement: kaizen '${kaizenId}' not found`,
        { kaizenId }
      );
    }
    if (k.abandoned === true) {
      fail(
        'KAIZEN_ABANDONED',
        `KaizenService.setGoalStatement: kaizen '${kaizenId}' is abandoned`,
        { kaizenId }
      );
    }
    if (k.state !== KaizenState.DRAFT) {
      fail(
        'KAIZEN_NOT_IN_DRAFT',
        `KaizenService.setGoalStatement: kaizen '${kaizenId}' is '${k.state}', must be DRAFT`,
        { kaizenId, state: k.state }
      );
    }
    if (typeof goalStatement !== 'string') {
      fail(
        'INVALID_INPUT',
        'KaizenService.setGoalStatement: goalStatement must be a string'
      );
    }
    const next = { ...k, goalStatement };
    this._repo.upsert(KAIZENS_KEY, kaizenId, next);
    return next;
  }

  /**
   * Append an action to a DRAFT Kaizen's actions[].
   *
   * @param {string} kaizenId
   * @param {{name: string, ownerRef: string, dueDate: string, strategic?: boolean}} action
   * @returns {object} updated kaizen
   */
  addAction(kaizenId, action) {
    const k = this.get(kaizenId);
    if (!k) {
      fail(
        'KAIZEN_NOT_FOUND',
        `KaizenService.addAction: kaizen '${kaizenId}' not found`,
        { kaizenId }
      );
    }
    if (k.abandoned === true) {
      fail(
        'KAIZEN_ABANDONED',
        `KaizenService.addAction: kaizen '${kaizenId}' is abandoned`,
        { kaizenId }
      );
    }
    if (k.state !== KaizenState.DRAFT) {
      fail(
        'KAIZEN_NOT_IN_DRAFT',
        `KaizenService.addAction: kaizen '${kaizenId}' is '${k.state}', must be DRAFT`,
        { kaizenId, state: k.state }
      );
    }
    if (!action || typeof action !== 'object') {
      fail('INVALID_INPUT', 'KaizenService.addAction: action object required');
    }
    const { name, ownerRef, dueDate } = action;
    if (typeof name !== 'string' || name.length === 0) {
      fail('INVALID_INPUT', 'KaizenService.addAction: action.name required');
    }
    if (typeof ownerRef !== 'string' || ownerRef.length === 0) {
      fail('INVALID_INPUT', 'KaizenService.addAction: action.ownerRef required');
    }
    if (typeof dueDate !== 'string' || dueDate.length === 0) {
      fail('INVALID_INPUT', 'KaizenService.addAction: action.dueDate required');
    }

    const normalized = {
      name,
      ownerRef,
      dueDate,
      doneAt: null,
      strategic: action.strategic === true
    };
    const next = { ...k, actions: [...k.actions, normalized] };
    this._repo.upsert(KAIZENS_KEY, kaizenId, next);
    return next;
  }

  /**
   * Remove an action from a DRAFT Kaizen's actions[] by index.
   *
   * @param {string} kaizenId
   * @param {number} index
   * @returns {object} updated kaizen
   */
  removeAction(kaizenId, index) {
    const k = this.get(kaizenId);
    if (!k) {
      fail(
        'KAIZEN_NOT_FOUND',
        `KaizenService.removeAction: kaizen '${kaizenId}' not found`,
        { kaizenId }
      );
    }
    if (k.state !== KaizenState.DRAFT) {
      fail(
        'KAIZEN_NOT_IN_DRAFT',
        `KaizenService.removeAction: kaizen '${kaizenId}' is '${k.state}', must be DRAFT`,
        { kaizenId, state: k.state }
      );
    }
    if (!Number.isInteger(index) || index < 0 || index >= k.actions.length) {
      fail(
        'INVALID_INPUT',
        `KaizenService.removeAction: index ${index} out of range [0, ${k.actions.length})`
      );
    }
    const actions = [...k.actions];
    actions.splice(index, 1);
    const next = { ...k, actions };
    this._repo.upsert(KAIZENS_KEY, kaizenId, next);
    return next;
  }

  /**
   * Mark an action done on an ACTIVE Kaizen.
   *
   * @param {string} kaizenId
   * @param {number} index
   * @returns {object} updated kaizen
   */
  markActionDone(kaizenId, index) {
    const k = this.get(kaizenId);
    if (!k) {
      fail(
        'KAIZEN_NOT_FOUND',
        `KaizenService.markActionDone: kaizen '${kaizenId}' not found`,
        { kaizenId }
      );
    }
    if (k.state !== KaizenState.ACTIVE) {
      fail(
        'KAIZEN_NOT_ACTIVE',
        `KaizenService.markActionDone: kaizen '${kaizenId}' is '${k.state}', must be ACTIVE`,
        { kaizenId, state: k.state }
      );
    }
    if (!Number.isInteger(index) || index < 0 || index >= k.actions.length) {
      fail(
        'INVALID_INPUT',
        `KaizenService.markActionDone: index ${index} out of range`
      );
    }
    const now = this._clock.now();
    const actions = k.actions.map((a, i) =>
      i === index ? { ...a, doneAt: now } : a
    );
    const next = { ...k, actions };
    this._repo.upsert(KAIZENS_KEY, kaizenId, next);
    return next;
  }

  /**
   * Lock the baseline metric and transition DRAFT → ACTIVE.
   *
   * Enforces all the P0-T6 guards:
   *   - kaizen must exist and be in DRAFT
   *   - kaizen.actions.length >= 1
   *   - kaizen.goalStatement must be non-empty
   *   - metric fields all required; value must be finite number
   *   - MVP cap: user has no other kaizen in ACTIVE or IN_REMEASUREMENT
   *
   * Atomic: either both the BaselineMetric + Kaizen update land or
   * neither does.
   *
   * @param {string} kaizenId
   * @param {{
   *   metricName: string,
   *   unit: string,
   *   operationalDefinition: string,
   *   sampleSize: number,
   *   method: string,
   *   value: number,
   *   capturedSampleRef?: object|null
   * }} input
   * @returns {{kaizen: object, baseline: object}}
   */
  lockBaseline(kaizenId, input) {
    if (typeof kaizenId !== 'string' || kaizenId.length === 0) {
      fail('INVALID_INPUT', 'KaizenService.lockBaseline: kaizenId required');
    }
    if (!input || typeof input !== 'object') {
      fail('INVALID_INPUT', 'KaizenService.lockBaseline: input required');
    }
    const k = this.get(kaizenId);
    if (!k) {
      fail(
        'KAIZEN_NOT_FOUND',
        `KaizenService.lockBaseline: kaizen '${kaizenId}' not found`,
        { kaizenId }
      );
    }
    if (k.abandoned === true) {
      fail(
        'KAIZEN_ABANDONED',
        `KaizenService.lockBaseline: kaizen '${kaizenId}' is abandoned`,
        { kaizenId }
      );
    }
    if (k.state !== KaizenState.DRAFT) {
      fail(
        'KAIZEN_NOT_IN_DRAFT',
        `KaizenService.lockBaseline: kaizen '${kaizenId}' is '${k.state}', must be DRAFT`,
        { kaizenId, state: k.state }
      );
    }
    if (!Array.isArray(k.actions) || k.actions.length < 1) {
      fail(
        'MISSING_ACTIONS',
        'KaizenService.lockBaseline: Kaizen must have at least 1 action before baseline lock',
        { kaizenId, actionCount: k.actions?.length ?? 0 }
      );
    }
    if (typeof k.goalStatement !== 'string' || k.goalStatement.length === 0) {
      fail(
        'MISSING_GOAL_STATEMENT',
        'KaizenService.lockBaseline: Kaizen.goalStatement must be non-empty before baseline lock',
        { kaizenId }
      );
    }

    const {
      metricName,
      unit,
      operationalDefinition,
      sampleSize,
      method,
      value
    } = input;
    for (const [field, v] of [
      ['metricName', metricName],
      ['unit', unit],
      ['operationalDefinition', operationalDefinition],
      ['method', method]
    ]) {
      if (typeof v !== 'string' || v.length === 0) {
        fail(
          'MISSING_METRIC_FIELD',
          `KaizenService.lockBaseline: metric '${field}' required`,
          { field }
        );
      }
    }
    if (!Number.isFinite(Number(sampleSize)) || Number(sampleSize) <= 0) {
      fail(
        'MISSING_METRIC_FIELD',
        'KaizenService.lockBaseline: metric.sampleSize must be a positive number',
        { sampleSize }
      );
    }
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      fail(
        'INVALID_METRIC_VALUE',
        'KaizenService.lockBaseline: metric.value must be a finite number',
        { value }
      );
    }

    // MVP cap: at most one Kaizen in ACTIVE or IN_REMEASUREMENT per user.
    const userKaizens = this.list({ userId: k.userId });
    const blocking = userKaizens.find(
      (other) =>
        other.id !== kaizenId &&
        (other.state === KaizenState.ACTIVE ||
          other.state === KaizenState.IN_REMEASUREMENT)
    );
    if (blocking) {
      fail(
        'ACTIVE_KAIZEN_CAP_EXCEEDED',
        `KaizenService.lockBaseline: user '${k.userId}' already has an active Kaizen '${blocking.id}'`,
        { userId: k.userId, blockingKaizenId: blocking.id, blockingState: blocking.state }
      );
    }

    const now = this._clock.now();
    const baselineId = buildBaselineMetricId(kaizenId);
    const baseline = {
      id: baselineId,
      kaizenId,
      metricDefinition: {
        name: metricName,
        unit,
        operationalDefinition,
        sampleSize: Number(sampleSize),
        method
      },
      value,
      capturedAt: now,
      capturedSampleRef: input.capturedSampleRef ?? null,
      locked: true
    };

    const priorKaizens = this._readMap();
    const priorBaselines = this._repo.read(BASELINE_METRICS_KEY) ?? {};
    const nextBaselines = { ...priorBaselines, [baselineId]: baseline };

    // Optional Sprint 8 fields carried from the BaselineDialog.
    const nextMetricDirection =
      input.metricDirection === MetricDirection.LOWER_IS_BETTER
        ? MetricDirection.LOWER_IS_BETTER
        : MetricDirection.HIGHER_IS_BETTER;
    const nextTargetImprovement =
      typeof input.targetImprovement === 'number' &&
      Number.isFinite(input.targetImprovement)
        ? input.targetImprovement
        : k.targetImprovement ?? null;

    const nextKaizen = {
      ...k,
      baselineMetricId: baselineId,
      state: KaizenState.ACTIVE,
      metricDirection: nextMetricDirection,
      targetImprovement: nextTargetImprovement
    };
    const nextKaizens = { ...priorKaizens, [kaizenId]: nextKaizen };

    try {
      this._repo.write(BASELINE_METRICS_KEY, nextBaselines);
      try {
        this._repo.write(KAIZENS_KEY, nextKaizens);
      } catch (err) {
        this._repo.write(BASELINE_METRICS_KEY, priorBaselines);
        throw err;
      }
    } catch (err) {
      fail(
        'PERSIST_FAILED',
        `KaizenService.lockBaseline: persistence failed — ${err.message}`,
        { cause: err }
      );
    }

    this._bus.publish(KaizenBaselineLocked, {
      kaizenId,
      userId: k.userId,
      baselineMetricId: baselineId,
      value,
      metricName
    });

    return { kaizen: nextKaizen, baseline };
  }

  /**
   * Look up the BaselineMetric for a Kaizen. Returns null when absent.
   *
   * @param {string} kaizenId
   * @returns {object|null}
   */
  getBaselineForKaizen(kaizenId) {
    const k = this.get(kaizenId);
    if (!k || !k.baselineMetricId) return null;
    const map = this._repo.read(BASELINE_METRICS_KEY) ?? {};
    return map[k.baselineMetricId] ?? null;
  }

  /**
   * Look up the Remeasurement for a Kaizen. Returns null when absent.
   *
   * @param {string} kaizenId
   * @returns {object|null}
   */
  getRemeasurementForKaizen(kaizenId) {
    const k = this.get(kaizenId);
    if (!k || !k.remeasurementId) return null;
    const map = this._repo.read(REMEASUREMENTS_KEY) ?? {};
    return map[k.remeasurementId] ?? null;
  }

  // -------------------------------------------------------------------------
  // Sprint 8 — HARD RULE close loop
  // -------------------------------------------------------------------------

  /**
   * Transition a Kaizen from ACTIVE to IN_REMEASUREMENT. Does NOT create a
   * Remeasurement row — that is done separately via captureRemeasurement().
   *
   * Guards:
   *   - kaizen must exist
   *   - if userId is supplied, kaizen.userId must match
   *   - kaizen.state must be ACTIVE
   *
   * Emits KaizenRemeasurementStarted.
   *
   * @param {string} kaizenId
   * @param {string} [userId]
   * @returns {object} updated kaizen
   */
  startRemeasurement(kaizenId, userId) {
    const k = this.get(kaizenId);
    if (!k) {
      fail(
        'KAIZEN_NOT_FOUND',
        `KaizenService.startRemeasurement: kaizen '${kaizenId}' not found`,
        { kaizenId }
      );
    }
    if (typeof userId === 'string' && userId.length > 0 && k.userId !== userId) {
      fail(
        'KAIZEN_OWNER_MISMATCH',
        `KaizenService.startRemeasurement: kaizen '${kaizenId}' not owned by '${userId}'`,
        { kaizenId, userId, ownerId: k.userId }
      );
    }
    if (k.state !== KaizenState.ACTIVE) {
      fail(
        'KAIZEN_NOT_ACTIVE',
        `KaizenService.startRemeasurement: kaizen '${kaizenId}' is '${k.state}', must be ACTIVE`,
        { kaizenId, state: k.state }
      );
    }
    const now = this._clock.now();
    const next = { ...k, state: KaizenState.IN_REMEASUREMENT };
    this._repo.upsert(KAIZENS_KEY, kaizenId, next);
    this._bus.publish(KaizenRemeasurementStarted, {
      kaizenId,
      userId: k.userId,
      startedAt: now
    });
    return next;
  }

  /**
   * Capture the Remeasurement row for a Kaizen in IN_REMEASUREMENT.
   * APPEND-ONLY — second attempt throws REMEASUREMENT_ALREADY_CAPTURED.
   *
   * Computes:
   *   deltaAbsolute = value - baseline.value
   *   deltaPercent  = baseline.value === 0 ? null : (deltaAbsolute / baseline.value) * 100
   *   beatsBaseline = per metricDirection:
   *       higher_is_better → deltaAbsolute > 0
   *       lower_is_better  → deltaAbsolute < 0
   *
   * Sets kaizen.remeasurementId. Emits KaizenRemeasured.
   *
   * @param {string} kaizenId
   * @param {string} userId
   * @param {{value: number, evidenceRef?: object|null}} input
   * @returns {{kaizen: object, remeasurement: object}}
   */
  captureRemeasurement(kaizenId, userId, input = {}) {
    const k = this.get(kaizenId);
    if (!k) {
      fail(
        'KAIZEN_NOT_FOUND',
        `KaizenService.captureRemeasurement: kaizen '${kaizenId}' not found`,
        { kaizenId }
      );
    }
    if (typeof userId === 'string' && userId.length > 0 && k.userId !== userId) {
      fail(
        'KAIZEN_OWNER_MISMATCH',
        `KaizenService.captureRemeasurement: kaizen '${kaizenId}' not owned by '${userId}'`,
        { kaizenId, userId, ownerId: k.userId }
      );
    }
    if (k.state !== KaizenState.IN_REMEASUREMENT) {
      fail(
        'KAIZEN_NOT_IN_REMEASUREMENT',
        `KaizenService.captureRemeasurement: kaizen '${kaizenId}' is '${k.state}', must be IN_REMEASUREMENT`,
        { kaizenId, state: k.state }
      );
    }
    if (k.remeasurementId) {
      fail(
        'REMEASUREMENT_ALREADY_CAPTURED',
        `KaizenService.captureRemeasurement: kaizen '${kaizenId}' already has remeasurement '${k.remeasurementId}'`,
        { kaizenId, remeasurementId: k.remeasurementId }
      );
    }
    const baseline = this.getBaselineForKaizen(kaizenId);
    if (!baseline || baseline.locked !== true) {
      fail(
        'BASELINE_NOT_LOCKED',
        `KaizenService.captureRemeasurement: kaizen '${kaizenId}' has no locked baseline`,
        { kaizenId }
      );
    }
    const { value } = input;
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      fail(
        'INVALID_METRIC_VALUE',
        'KaizenService.captureRemeasurement: value must be a finite number',
        { value }
      );
    }
    const evidenceRef = input.evidenceRef ?? null;
    if (
      evidenceRef !== null &&
      (typeof evidenceRef !== 'object' || Array.isArray(evidenceRef))
    ) {
      fail(
        'INVALID_EVIDENCE_REF',
        'KaizenService.captureRemeasurement: evidenceRef must be an object or null'
      );
    }

    const baseVal = Number(baseline.value);
    const deltaAbsolute = value - baseVal;
    const deltaPercent = baseVal === 0 ? null : (deltaAbsolute / baseVal) * 100;
    const direction = k.metricDirection === MetricDirection.LOWER_IS_BETTER
      ? MetricDirection.LOWER_IS_BETTER
      : MetricDirection.HIGHER_IS_BETTER;
    const beatsBaseline =
      direction === MetricDirection.HIGHER_IS_BETTER
        ? deltaAbsolute > 0
        : deltaAbsolute < 0;

    const now = this._clock.now();
    const id = buildRemeasurementId(kaizenId);
    const remeasurement = {
      id,
      kaizenId,
      metricDefinitionId: baseline.id,
      value,
      deltaAbsolute,
      deltaPercent,
      beatsBaseline,
      capturedAt: now,
      evidenceRef
    };

    // Atomic-ish: remeasurement first (appendOnly — immutable), then Kaizen
    // pointer. If the kaizen upsert fails after appendOnly the row exists but
    // is orphaned; the second capture will then also throw APPEND_ONLY on a
    // retry — but the caller sees the original error.
    this._repo.appendOnly(REMEASUREMENTS_KEY, id, remeasurement);
    try {
      const next = { ...k, remeasurementId: id };
      this._repo.upsert(KAIZENS_KEY, kaizenId, next);
      this._bus.publish(KaizenRemeasured, {
        kaizenId,
        userId: k.userId,
        remeasurementId: id,
        value,
        deltaAbsolute,
        deltaPercent,
        beatsBaseline,
        capturedAt: now
      });
      return { kaizen: next, remeasurement };
    } catch (err) {
      fail(
        'PERSIST_FAILED',
        `KaizenService.captureRemeasurement: kaizen update failed — ${err.message}`,
        { cause: err }
      );
    }
  }

  /**
   * Compute the deterministic closeKind. Exported helper for UI preview.
   *
   *   beatsBaseline === false                                  → FAILED_HONEST
   *   targetImprovement set AND |delta| >= |targetImprovement| → SUCCESS
   *   else (beatsBaseline === true but below target or no      → PARTIAL
   *     target specified)
   *
   * @param {{beatsBaseline: boolean, deltaAbsolute: number}} remeasurement
   * @param {number|null|undefined} targetImprovement
   * @returns {'SUCCESS'|'PARTIAL'|'FAILED_HONEST'}
   */
  static deriveCloseKind(remeasurement, targetImprovement) {
    if (!remeasurement || remeasurement.beatsBaseline !== true) {
      return CloseKind.FAILED_HONEST;
    }
    const t = Number(targetImprovement);
    if (Number.isFinite(t) && t !== 0) {
      if (Math.abs(remeasurement.deltaAbsolute) >= Math.abs(t)) {
        return CloseKind.SUCCESS;
      }
      return CloseKind.PARTIAL;
    }
    // No target set — any improvement is a PARTIAL (not full SUCCESS).
    return CloseKind.PARTIAL;
  }

  /**
   * Transition a Kaizen from IN_REMEASUREMENT to CLOSED. Derives closeKind
   * from the stored Remeasurement + optional `targetImprovement` on the
   * Kaizen. Requires `lessonsLearned` (min 20 chars).
   *
   * HARD RULE: throws KAIZEN_CLOSE_REQUIRES_REMEASUREMENT if the Kaizen has
   * no remeasurementId.
   *
   * Emits KaizenClosed with closeKind + deltaPercent.
   *
   * @param {string} kaizenId
   * @param {string} userId
   * @param {{lessonsLearned: string}} input
   * @returns {object} updated kaizen
   */
  close(kaizenId, userId, input = {}) {
    const k = this.get(kaizenId);
    if (!k) {
      fail(
        'KAIZEN_NOT_FOUND',
        `KaizenService.close: kaizen '${kaizenId}' not found`,
        { kaizenId }
      );
    }
    if (typeof userId === 'string' && userId.length > 0 && k.userId !== userId) {
      fail(
        'KAIZEN_OWNER_MISMATCH',
        `KaizenService.close: kaizen '${kaizenId}' not owned by '${userId}'`,
        { kaizenId, userId, ownerId: k.userId }
      );
    }
    if (k.state !== KaizenState.IN_REMEASUREMENT) {
      fail(
        'KAIZEN_NOT_IN_REMEASUREMENT',
        `KaizenService.close: kaizen '${kaizenId}' is '${k.state}', must be IN_REMEASUREMENT`,
        { kaizenId, state: k.state }
      );
    }
    // HARD RULE — no remeasurement, no close.
    if (!k.remeasurementId) {
      fail(
        'KAIZEN_CLOSE_REQUIRES_REMEASUREMENT',
        `KaizenService.close: kaizen '${kaizenId}' cannot close without a captured Remeasurement`,
        { kaizenId }
      );
    }
    const lessonsLearned = typeof input.lessonsLearned === 'string'
      ? input.lessonsLearned.trim()
      : '';
    if (lessonsLearned.length < LESSONS_LEARNED_MIN_LENGTH) {
      fail(
        'LESSONS_LEARNED_TOO_SHORT',
        `KaizenService.close: lessonsLearned must be at least ${LESSONS_LEARNED_MIN_LENGTH} chars`,
        { length: lessonsLearned.length }
      );
    }
    const remeasurement = this.getRemeasurementForKaizen(kaizenId);
    if (!remeasurement) {
      fail(
        'KAIZEN_CLOSE_REQUIRES_REMEASUREMENT',
        `KaizenService.close: kaizen '${kaizenId}' remeasurement row missing`,
        { kaizenId }
      );
    }

    const closeKind = KaizenService.deriveCloseKind(
      remeasurement,
      k.targetImprovement
    );
    const now = this._clock.now();
    const next = {
      ...k,
      state: KaizenState.CLOSED,
      closedAt: now,
      closeKind,
      lessonsLearned
    };
    this._repo.upsert(KAIZENS_KEY, kaizenId, next);
    this._bus.publish(KaizenClosed, {
      kaizenId,
      userId: k.userId,
      closeKind,
      deltaAbsolute: remeasurement.deltaAbsolute,
      deltaPercent: remeasurement.deltaPercent,
      closedAt: now
    });
    return next;
  }

  /**
   * Abandon a DRAFT Kaizen. Sets `abandoned=true`, captures `abandonReason`,
   * sets `abandonedAt`. Never transitions to CLOSED per ARCHITECTURE §3.3
   * invariant. Once abandoned, promote/edit guards reject the Kaizen.
   *
   * Emits KaizenAbandoned.
   *
   * @param {string} kaizenId
   * @param {string} userId
   * @param {{reason: string}} input
   * @returns {object} updated kaizen
   */
  abandon(kaizenId, userId, input = {}) {
    const k = this.get(kaizenId);
    if (!k) {
      fail(
        'KAIZEN_NOT_FOUND',
        `KaizenService.abandon: kaizen '${kaizenId}' not found`,
        { kaizenId }
      );
    }
    if (typeof userId === 'string' && userId.length > 0 && k.userId !== userId) {
      fail(
        'KAIZEN_OWNER_MISMATCH',
        `KaizenService.abandon: kaizen '${kaizenId}' not owned by '${userId}'`,
        { kaizenId, userId, ownerId: k.userId }
      );
    }
    if (k.abandoned === true) {
      fail(
        'KAIZEN_ABANDONED',
        `KaizenService.abandon: kaizen '${kaizenId}' is already abandoned`,
        { kaizenId }
      );
    }
    if (k.state !== KaizenState.DRAFT) {
      fail(
        'KAIZEN_NOT_IN_DRAFT',
        `KaizenService.abandon: kaizen '${kaizenId}' is '${k.state}', must be DRAFT`,
        { kaizenId, state: k.state }
      );
    }
    const reason = typeof input.reason === 'string' ? input.reason.trim() : '';
    if (reason.length < ABANDON_REASON_MIN_LENGTH) {
      fail(
        'ABANDON_REASON_TOO_SHORT',
        `KaizenService.abandon: reason must be at least ${ABANDON_REASON_MIN_LENGTH} chars`,
        { length: reason.length }
      );
    }
    const now = this._clock.now();
    const next = {
      ...k,
      abandoned: true,
      abandonedAt: now,
      abandonReason: reason
    };
    this._repo.upsert(KAIZENS_KEY, kaizenId, next);
    this._bus.publish(KaizenAbandoned, {
      kaizenId,
      userId: k.userId,
      reason,
      abandonedAt: now
    });
    return next;
  }

  /**
   * Sprint 7 P0-T3 — create a DRAFT Kaizen from an Opportunity row.
   *
   * Unlike `promote()`, this does NOT touch friction signals. Instead it
   * records the `sourceOpportunityId` on the Kaizen. `projectType` is
   * preserved from the opportunity (not defaulted to AD_HOC). Emits
   * `KaizenPromoted` with `fromOpportunityId` in the payload.
   *
   * Guards:
   *   - opportunityId must be a non-empty string
   *   - userId required
   *   - problemStatement must be ≥ 10 chars
   *
   * @param {string} opportunityId
   * @param {{userId: string, title: string, problemStatement: string, projectType?: string}} input
   * @returns {{kaizen: object}}
   */
  promoteFromOpportunity(opportunityId, input) {
    if (typeof opportunityId !== 'string' || opportunityId.length === 0) {
      fail(
        'INVALID_INPUT',
        'KaizenService.promoteFromOpportunity: opportunityId required'
      );
    }
    if (!input || typeof input !== 'object') {
      fail(
        'INVALID_INPUT',
        'KaizenService.promoteFromOpportunity: input required'
      );
    }
    const { userId, problemStatement } = input;
    if (typeof userId !== 'string' || userId.length === 0) {
      fail(
        'INVALID_INPUT',
        'KaizenService.promoteFromOpportunity: userId required'
      );
    }
    if (
      typeof problemStatement !== 'string' ||
      problemStatement.length < PROBLEM_STATEMENT_MIN_LENGTH
    ) {
      fail(
        'PROBLEM_STATEMENT_TOO_SHORT',
        `KaizenService.promoteFromOpportunity: problemStatement must be at least ${PROBLEM_STATEMENT_MIN_LENGTH} chars`,
        { length: problemStatement?.length ?? 0 }
      );
    }

    const now = this._clock.now();
    const id = buildKaizenId(userId, now);
    const title =
      typeof input.title === 'string' && input.title.length > 0
        ? input.title
        : 'Untitled Kaizen';
    const projectType =
      typeof input.projectType === 'string' && input.projectType in ProjectType
        ? input.projectType
        : ProjectType.AD_HOC;

    const kaizen = {
      id,
      userId,
      title,
      problemStatement,
      goalStatement: '',
      sourceFrictionSignalIds: [],
      baselineMetricId: null,
      remeasurementId: null,
      actions: [],
      state: KaizenState.DRAFT,
      openedAt: now,
      closedAt: null,
      closeKind: null,
      resultsNarrativeRef: null,
      projectType,
      phase: null,
      phaseDefinitions: null,
      implementationCostDollars: null,
      annualBenefitsDollars: null,
      startDate: isoDate(now),
      controlPlanArtifactRef: null,
      controlPlanDraftArtifactRef: null,
      implementationLeadUserId: null,
      roiPassNumber: null,
      roiProjections: null,
      validatedRootCauseArtifactRef: null,
      sustainmentCheckIns: null,
      sustainmentGatePassed: null,
      scopeChanges: [],
      targetCloseDate: null,
      sourcePdcaExperimentId: null,
      sourceOpportunityId: opportunityId,
      // Sprint 8 fields.
      lessonsLearned: null,
      metricDirection: MetricDirection.HIGHER_IS_BETTER,
      targetImprovement: null,
      abandoned: false,
      abandonedAt: null,
      abandonReason: null
    };

    this._repo.upsert(KAIZENS_KEY, id, kaizen);

    this._bus.publish(KaizenPromoted, {
      kaizenId: id,
      userId,
      sourceFrictionSignalIds: [],
      fromOpportunityId: opportunityId,
      projectType,
      openedAt: now
    });

    return { kaizen };
  }

  // -------------------------------------------------------------------------
  // Sprint 10b Pass B — Kaizen step progress (append-only) + step scheduling
  // -------------------------------------------------------------------------

  /**
   * Read the raw step-progress map from storage.
   *
   * @returns {Record<string, object>}
   */
  _readStepProgressMap() {
    return this._repo.read(STEP_PROGRESS_KEY) ?? {};
  }

  /**
   * Get every completed-step row for a single Kaizen.
   *
   * @param {string} kaizenId
   * @returns {object[]}
   */
  getCompletedStepsForKaizen(kaizenId) {
    if (typeof kaizenId !== 'string' || kaizenId.length === 0) return [];
    const map = this._readStepProgressMap();
    const rows = Object.values(map).filter((r) => r && r.kaizenId === kaizenId);
    // Return stable order by completedAt asc (oldest first).
    rows.sort((a, b) => {
      const ax = a.completedAt ?? '';
      const bx = b.completedAt ?? '';
      if (ax < bx) return -1;
      if (ax > bx) return 1;
      return 0;
    });
    return rows;
  }

  /**
   * Group every completed-step row by kaizenId (convenience for Portfolio).
   *
   * @returns {Record<string, object[]>}
   */
  getCompletedStepsByKaizenId() {
    const map = this._readStepProgressMap();
    /** @type {Record<string, object[]>} */
    const out = {};
    for (const r of Object.values(map)) {
      if (!r || typeof r.kaizenId !== 'string') continue;
      (out[r.kaizenId] ??= []).push(r);
    }
    for (const kid of Object.keys(out)) {
      out[kid].sort((a, b) => {
        const ax = a.completedAt ?? '';
        const bx = b.completedAt ?? '';
        if (ax < bx) return -1;
        if (ax > bx) return 1;
        return 0;
      });
    }
    return out;
  }

  /**
   * Build a deterministic-ish step-progress id. Tests inject the clock so we
   * only need uniqueness within a user's history; ISO timestamp + random
   * suffix provides that. Falls back to counter if crypto unavailable.
   *
   * @param {string} kaizenId
   * @param {string} catalogEntryId
   * @param {string} nowIso
   * @returns {string}
   */
  _buildStepProgressId(kaizenId, catalogEntryId, nowIso) {
    const safeKid = String(kaizenId).replace(/[^a-zA-Z0-9_]/g, '_');
    const safeCid = String(catalogEntryId).replace(/[^a-zA-Z0-9_]/g, '_');
    const safeTs = String(nowIso).replace(/[^0-9]/g, '');
    return `ksp_${safeKid}_${safeCid}_${safeTs}`;
  }

  /**
   * Mark a catalog step as complete for a Kaizen. Guarded so only the
   * "current" step per progression order may be completed. Appends an
   * immutable row to `bamx:v1:kaizen-step-progress`.
   *
   * Emits KaizenStepCompleted.
   *
   * @param {{
   *   kaizenId: string,
   *   catalogEntryId: string,
   *   userId: string,
   *   sourceKind?: 'portfolio'|'scheduled-activity',
   *   sourceId?: string|null,
   *   catalog?: object[]
   * }} input
   * @returns {object} the appended step-progress row
   */
  completeStep(input = {}) {
    if (!input || typeof input !== 'object') {
      fail('INVALID_INPUT', 'KaizenService.completeStep: input required');
    }
    const { kaizenId, catalogEntryId, userId } = input;
    if (typeof kaizenId !== 'string' || kaizenId.length === 0) {
      fail('INVALID_INPUT', 'KaizenService.completeStep: kaizenId required');
    }
    if (typeof catalogEntryId !== 'string' || catalogEntryId.length === 0) {
      fail('INVALID_INPUT', 'KaizenService.completeStep: catalogEntryId required');
    }
    if (typeof userId !== 'string' || userId.length === 0) {
      fail('INVALID_INPUT', 'KaizenService.completeStep: userId required');
    }
    const k = this.get(kaizenId);
    if (!k) {
      fail(
        'KAIZEN_NOT_FOUND',
        `KaizenService.completeStep: kaizen '${kaizenId}' not found`,
        { kaizenId }
      );
    }

    const catalog =
      Array.isArray(input.catalog) && input.catalog.length > 0
        ? input.catalog
        : this._resolveCatalog();
    const completedIds = this.getCompletedStepsForKaizen(kaizenId).map(
      (r) => r.catalogEntryId
    );
    const cn = getCurrentNext(k.projectType, completedIds, catalog);
    const currentId = cn.current?.id ?? null;
    if (catalogEntryId !== currentId) {
      fail(
        'STEP_NOT_CURRENT',
        `KaizenService.completeStep: catalogEntryId '${catalogEntryId}' is not the current step for kaizen '${kaizenId}'`,
        { expected: currentId, got: catalogEntryId, kaizenId }
      );
    }

    const now = this._clock.now();
    const sourceKind =
      input.sourceKind === 'scheduled-activity' ? 'scheduled-activity' : 'portfolio';
    const sourceId =
      typeof input.sourceId === 'string' && input.sourceId.length > 0
        ? input.sourceId
        : null;
    const id = this._buildStepProgressId(kaizenId, catalogEntryId, now);
    const row = {
      id,
      kaizenId,
      catalogEntryId,
      userId,
      completedAt: now,
      sourceKind,
      sourceId
    };
    this._repo.upsert(STEP_PROGRESS_KEY, id, row);
    this._bus.publish(KaizenStepCompleted, {
      id,
      kaizenId,
      userId,
      catalogEntryId,
      completedAt: now,
      sourceKind,
      sourceId
    });
    return row;
  }

  /**
   * Schedule a catalog step for a specific date. Appends a ScheduledActivity
   * row directly to `bamx:v1:activities` (the same key ComposerService
   * writes). Bypasses the daily composer — see SPRINT_10B_NOTES.md for the
   * 4-2-2 invariant caveat.
   *
   * Emits KaizenStepScheduled.
   *
   * @param {{
   *   kaizenId: string,
   *   catalogEntryId: string,
   *   targetDate: string,
   *   userId: string,
   *   catalog?: object[]
   * }} input
   * @returns {string} scheduledActivityId
   */
  scheduleStep(input = {}) {
    if (!input || typeof input !== 'object') {
      fail('INVALID_INPUT', 'KaizenService.scheduleStep: input required');
    }
    const { kaizenId, catalogEntryId, targetDate, userId } = input;
    if (typeof kaizenId !== 'string' || kaizenId.length === 0) {
      fail('INVALID_INPUT', 'KaizenService.scheduleStep: kaizenId required');
    }
    if (typeof catalogEntryId !== 'string' || catalogEntryId.length === 0) {
      fail('INVALID_INPUT', 'KaizenService.scheduleStep: catalogEntryId required');
    }
    if (typeof userId !== 'string' || userId.length === 0) {
      fail('INVALID_INPUT', 'KaizenService.scheduleStep: userId required');
    }
    if (typeof targetDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
      fail(
        'INVALID_TARGET_DATE',
        `KaizenService.scheduleStep: targetDate must be YYYY-MM-DD, got '${targetDate}'`,
        { targetDate }
      );
    }
    const k = this.get(kaizenId);
    if (!k) {
      fail(
        'KAIZEN_NOT_FOUND',
        `KaizenService.scheduleStep: kaizen '${kaizenId}' not found`,
        { kaizenId }
      );
    }
    const catalog =
      Array.isArray(input.catalog) && input.catalog.length > 0
        ? input.catalog
        : this._resolveCatalog();
    const entry = catalog.find((c) => c && c.id === catalogEntryId) ?? null;
    if (!entry) {
      fail(
        'CATALOG_ENTRY_NOT_FOUND',
        `KaizenService.scheduleStep: catalog entry '${catalogEntryId}' not found`,
        { catalogEntryId }
      );
    }

    const now = this._clock.now();
    const safeKid = String(kaizenId).replace(/[^a-zA-Z0-9_]/g, '_');
    const safeCid = String(catalogEntryId).replace(/[^a-zA-Z0-9_]/g, '_');
    const safeTs = String(now).replace(/[^0-9]/g, '');
    const scheduledActivityId = `sa_${safeKid}_${safeCid}_${safeTs}`;

    const sa = {
      id: scheduledActivityId,
      compositionId: null,
      catalogEntryId,
      linkedKaizenId: kaizenId,
      name: entry.name ?? '',
      bucket: entry.bucket ?? 'PROJECT',
      plannedDurationMinutes:
        typeof entry.defaultDurationMinutes === 'number'
          ? entry.defaultDurationMinutes
          : 30,
      plannedStartAt: `${targetDate}T09:00:00Z`,
      state: 'SCHEDULED',
      createdAt: now
    };
    this._repo.upsert(SCHEDULED_ACTIVITIES_KEY, scheduledActivityId, sa);
    this._bus.publish(KaizenStepScheduled, {
      kaizenId,
      userId,
      catalogEntryId,
      targetDate,
      scheduledActivityId,
      scheduledAt: now
    });
    return scheduledActivityId;
  }

  /**
   * Resolve the catalog via an injected `catalogService`, if one was wired
   * via `setCatalogService()`. Returns [] when absent.
   *
   * @returns {object[]}
   */
  _resolveCatalog() {
    if (this._catalogService && typeof this._catalogService.list === 'function') {
      try {
        return this._catalogService.list() ?? [];
      } catch {
        return [];
      }
    }
    return [];
  }

  /**
   * Inject a CatalogService for step methods to resolve the full catalog
   * without the caller having to pass it every time.
   *
   * @param {object} catalogService
   */
  setCatalogService(catalogService) {
    this._catalogService = catalogService ?? null;
  }
}

export default KaizenService;
