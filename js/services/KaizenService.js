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
  KaizenBaselineLocked
} from '../events/events.js';
import {
  KaizenState,
  FrictionStatus,
  ProjectType
} from '../domain/types.js';

export const KAIZENS_KEY = 'bamx:v1:kaizens';
export const BASELINE_METRICS_KEY = 'bamx:v1:baselineMetrics';

export const PROBLEM_STATEMENT_MIN_LENGTH = 10;

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
      sourceOpportunityId: null
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

    const nextKaizen = {
      ...k,
      baselineMetricId: baselineId,
      state: KaizenState.ACTIVE
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
      sourceOpportunityId: opportunityId
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
}

export default KaizenService;
