/**
 * OpportunityService — Sprint 7 P0-T2.
 *
 * Sole writer to `bamx:v1:opportunities`.
 *
 * Lifecycle:
 *   create({userId, title, problemStatement, scope?, proposedProjectType})
 *     — Creates a row with status='INTAKE'. Emits OpportunityCreated.
 *   list({userId, status?})
 *     — Returns rows sorted by createdAt desc. Default filter excludes
 *       PROMOTED / DEFERRED / REJECTED (terminal) unless status is specified.
 *   get(id)
 *     — Plain read.
 *   update(id, {title?, problemStatement?, scope?, proposedProjectType?})
 *     — Only allowed while status=INTAKE. Throws OPPORTUNITY_LOCKED otherwise.
 *   promote(id)
 *     — INTAKE|SCORED → PROMOTED. Calls kaizenService.promoteFromOpportunity
 *       to create a DRAFT Kaizen. Atomic: if Kaizen creation throws, no
 *       write lands on the opportunity. Emits OpportunityPromoted.
 *   defer(id, {deferredUntil, reason?})
 *     — INTAKE|SCORED → DEFERRED. Emits OpportunityDeferred.
 *   reject(id, {reason})
 *     — INTAKE|SCORED → REJECTED. reason must be ≥ 5 chars.
 *       Emits OpportunityRejected.
 *
 * Guards (every one fires with a machine-readable err.name):
 *   INVALID_DEPS
 *   INVALID_INPUT
 *   TITLE_LENGTH              — title outside 3-80 chars
 *   PROBLEM_STATEMENT_LENGTH  — problemStatement outside 10-500 chars
 *   SCOPE_LENGTH              — scope > 300 chars
 *   INVALID_PROJECT_TYPE      — proposedProjectType not in ProjectType enum
 *   REJECTION_REASON_TOO_SHORT — reject reason < 5 chars
 *   OPPORTUNITY_NOT_FOUND
 *   OPPORTUNITY_INVALID_STATE — promote/defer/reject from terminal state
 *   OPPORTUNITY_LOCKED        — update when status != INTAKE
 *   INVALID_DEFERRED_UNTIL
 */

import {
  OpportunityCreated,
  OpportunityPromoted,
  OpportunityDeferred,
  OpportunityRejected
} from '../events/events.js';
import { OpportunityStatus, ProjectType } from '../domain/types.js';

export const OPPORTUNITIES_KEY = 'bamx:v1:opportunities';

export const TITLE_MIN_LENGTH = 3;
export const TITLE_MAX_LENGTH = 80;
export const PROBLEM_MIN_LENGTH = 10;
export const PROBLEM_MAX_LENGTH = 500;
export const SCOPE_MAX_LENGTH = 300;
export const REJECTION_REASON_MIN_LENGTH = 5;

const VALID_PROJECT_TYPES = new Set(Object.values(ProjectType));

const TERMINAL_STATUSES = new Set([
  OpportunityStatus.PROMOTED,
  OpportunityStatus.DEFERRED,
  OpportunityStatus.REJECTED
]);

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
 * Deterministic Opportunity id from userId + createdAt.
 *
 * @param {string} userId
 * @param {string} createdAt
 * @returns {string}
 */
export function buildOpportunityId(userId, createdAt) {
  const safeUser = String(userId ?? 'user').replace(/[^a-zA-Z0-9_]/g, '_');
  const safeTs = String(createdAt ?? '').replace(/[^0-9]/g, '');
  return `opp_${safeUser}_${safeTs}`;
}

/**
 * Validate title (3-80 chars).
 *
 * @param {*} v
 * @param {string} [fieldLabel]
 */
function validateTitle(v, fieldLabel = 'title') {
  if (typeof v !== 'string') {
    fail(
      'INVALID_INPUT',
      `OpportunityService: ${fieldLabel} must be a string`,
      { field: fieldLabel }
    );
  }
  if (v.length < TITLE_MIN_LENGTH || v.length > TITLE_MAX_LENGTH) {
    fail(
      'TITLE_LENGTH',
      `OpportunityService: ${fieldLabel} must be ${TITLE_MIN_LENGTH}-${TITLE_MAX_LENGTH} chars (got ${v.length})`,
      { field: fieldLabel, length: v.length }
    );
  }
}

function validateProblem(v) {
  if (typeof v !== 'string') {
    fail('INVALID_INPUT', 'OpportunityService: problemStatement must be a string');
  }
  if (v.length < PROBLEM_MIN_LENGTH || v.length > PROBLEM_MAX_LENGTH) {
    fail(
      'PROBLEM_STATEMENT_LENGTH',
      `OpportunityService: problemStatement must be ${PROBLEM_MIN_LENGTH}-${PROBLEM_MAX_LENGTH} chars (got ${v.length})`,
      { length: v.length }
    );
  }
}

function validateScope(v) {
  if (v === null || v === undefined) return null;
  if (typeof v !== 'string') {
    fail('INVALID_INPUT', 'OpportunityService: scope must be a string or null');
  }
  if (v.length > SCOPE_MAX_LENGTH) {
    fail(
      'SCOPE_LENGTH',
      `OpportunityService: scope must be ≤ ${SCOPE_MAX_LENGTH} chars (got ${v.length})`,
      { length: v.length }
    );
  }
  return v;
}

function validateProjectType(v) {
  if (typeof v !== 'string' || !VALID_PROJECT_TYPES.has(v)) {
    fail(
      'INVALID_PROJECT_TYPE',
      `OpportunityService: proposedProjectType must be one of ${[...VALID_PROJECT_TYPES].join(' / ')} (got '${v}')`,
      { value: v }
    );
  }
}

export class OpportunityService {
  /**
   * @param {{
   *   repo: import('../persistence/IRepository.js').IRepository,
   *   bus: { publish: (event: string, payload: any) => void },
   *   clock: import('./ClockService.js').ClockService,
   *   kaizenService?: import('./KaizenService.js').KaizenService
   * }} deps
   */
  constructor({ repo, bus, clock, kaizenService } = {}) {
    if (!repo) fail('INVALID_DEPS', 'OpportunityService: repo is required');
    if (!bus || typeof bus.publish !== 'function') {
      fail('INVALID_DEPS', 'OpportunityService: bus with publish() is required');
    }
    if (!clock || typeof clock.now !== 'function') {
      fail('INVALID_DEPS', 'OpportunityService: clock with now() is required');
    }
    this._repo = repo;
    this._bus = bus;
    this._clock = clock;
    this._kaizenService = kaizenService ?? null;
  }

  /**
   * Inject the KaizenService after construction. Required for promote().
   *
   * @param {import('./KaizenService.js').KaizenService} kaizenService
   */
  setKaizenService(kaizenService) {
    this._kaizenService = kaizenService ?? null;
  }

  /**
   * Read all opportunities as an object map.
   *
   * @returns {Record<string, object>}
   */
  _readMap() {
    return this._repo.read(OPPORTUNITIES_KEY) ?? {};
  }

  /**
   * Get a single Opportunity by id.
   *
   * @param {string} id
   * @returns {object|null}
   */
  get(id) {
    const map = this._readMap();
    return map[id] ?? null;
  }

  /**
   * Create an Opportunity in status=INTAKE.
   *
   * @param {{
   *   userId: string,
   *   title: string,
   *   problemStatement: string,
   *   scope?: string|null,
   *   proposedProjectType: string
   * }} input
   * @returns {object} the created opportunity
   */
  create(input) {
    if (!input || typeof input !== 'object') {
      fail('INVALID_INPUT', 'OpportunityService.create: input required');
    }
    const {
      userId,
      title,
      problemStatement,
      proposedProjectType
    } = input;
    if (typeof userId !== 'string' || userId.length === 0) {
      fail('INVALID_INPUT', 'OpportunityService.create: userId required');
    }
    validateTitle(title);
    validateProblem(problemStatement);
    const scope = validateScope(input.scope ?? null);
    validateProjectType(proposedProjectType);

    const now = this._clock.now();
    const id = buildOpportunityId(userId, now);

    const opp = {
      id,
      userId,
      title,
      problemStatement,
      scope,
      proposedProjectType,
      status: OpportunityStatus.INTAKE,
      promotedKaizenId: null,
      deferredUntil: null,
      rejectionReason: null,
      createdAt: now,
      updatedAt: now
    };

    this._repo.upsert(OPPORTUNITIES_KEY, id, opp);

    this._bus.publish(OpportunityCreated, {
      opportunityId: id,
      userId,
      status: OpportunityStatus.INTAKE,
      proposedProjectType,
      createdAt: now
    });

    return opp;
  }

  /**
   * List opportunities with optional filters.
   *
   * By default (no `status` filter) returns only non-terminal rows
   * (INTAKE + SCORED), sorted by createdAt desc.
   *
   * @param {{userId?: string, status?: string, includeTerminal?: boolean}} [opts]
   * @returns {object[]}
   */
  list(opts = {}) {
    const map = this._readMap();
    let all = Object.values(map);
    if (opts && typeof opts.userId === 'string' && opts.userId.length > 0) {
      all = all.filter((o) => o && o.userId === opts.userId);
    }
    if (opts && typeof opts.status === 'string' && opts.status.length > 0) {
      all = all.filter((o) => o && o.status === opts.status);
    } else if (!opts.includeTerminal) {
      all = all.filter((o) => o && !TERMINAL_STATUSES.has(o.status));
    }
    return all.sort((a, b) => {
      const ax = a.createdAt ?? '';
      const bx = b.createdAt ?? '';
      if (ax < bx) return 1;
      if (ax > bx) return -1;
      return 0;
    });
  }

  /**
   * Update a mutable field on an INTAKE opportunity.
   *
   * @param {string} id
   * @param {{title?: string, problemStatement?: string, scope?: string|null, proposedProjectType?: string}} patch
   * @returns {object}
   */
  update(id, patch) {
    const opp = this.get(id);
    if (!opp) {
      fail(
        'OPPORTUNITY_NOT_FOUND',
        `OpportunityService.update: opportunity '${id}' not found`,
        { opportunityId: id }
      );
    }
    if (opp.status !== OpportunityStatus.INTAKE) {
      fail(
        'OPPORTUNITY_LOCKED',
        `OpportunityService.update: opportunity '${id}' is '${opp.status}', can only update INTAKE`,
        { opportunityId: id, status: opp.status }
      );
    }
    if (!patch || typeof patch !== 'object') {
      fail('INVALID_INPUT', 'OpportunityService.update: patch object required');
    }
    /** @type {any} */
    const next = { ...opp };
    if (patch.title !== undefined) {
      validateTitle(patch.title);
      next.title = patch.title;
    }
    if (patch.problemStatement !== undefined) {
      validateProblem(patch.problemStatement);
      next.problemStatement = patch.problemStatement;
    }
    if (patch.scope !== undefined) {
      next.scope = validateScope(patch.scope);
    }
    if (patch.proposedProjectType !== undefined) {
      validateProjectType(patch.proposedProjectType);
      next.proposedProjectType = patch.proposedProjectType;
    }
    next.updatedAt = this._clock.now();
    this._repo.upsert(OPPORTUNITIES_KEY, id, next);
    return next;
  }

  /**
   * Promote an Opportunity to a DRAFT Kaizen.
   *
   * FSM: INTAKE | SCORED → PROMOTED.
   * Atomic: if KaizenService.promoteFromOpportunity throws, the opportunity
   * row is NOT updated. Emits OpportunityPromoted on success.
   *
   * @param {string} id
   * @returns {{opportunity: object, kaizen: object}}
   */
  promote(id) {
    const opp = this.get(id);
    if (!opp) {
      fail(
        'OPPORTUNITY_NOT_FOUND',
        `OpportunityService.promote: opportunity '${id}' not found`,
        { opportunityId: id }
      );
    }
    if (TERMINAL_STATUSES.has(opp.status)) {
      fail(
        'OPPORTUNITY_INVALID_STATE',
        `OpportunityService.promote: opportunity '${id}' is '${opp.status}' (terminal), cannot promote`,
        { opportunityId: id, status: opp.status }
      );
    }

    if (!this._kaizenService ||
        typeof this._kaizenService.promoteFromOpportunity !== 'function') {
      fail(
        'INVALID_DEPS',
        'OpportunityService.promote: kaizenService.promoteFromOpportunity not wired. Call setKaizenService() after construct.'
      );
    }

    // Create the Kaizen FIRST — if this throws, we leak no state.
    const { kaizen } = this._kaizenService.promoteFromOpportunity(id, {
      userId: opp.userId,
      title: opp.title,
      problemStatement: opp.problemStatement,
      projectType: opp.proposedProjectType
    });

    const now = this._clock.now();
    const next = {
      ...opp,
      status: OpportunityStatus.PROMOTED,
      promotedKaizenId: kaizen.id,
      updatedAt: now
    };
    this._repo.upsert(OPPORTUNITIES_KEY, id, next);

    this._bus.publish(OpportunityPromoted, {
      opportunityId: id,
      userId: opp.userId,
      kaizenId: kaizen.id,
      proposedProjectType: opp.proposedProjectType,
      promotedAt: now
    });

    return { opportunity: next, kaizen };
  }

  /**
   * Defer an opportunity for later. Must supply deferredUntil (ISO date).
   *
   * FSM: INTAKE | SCORED → DEFERRED.
   *
   * @param {string} id
   * @param {{deferredUntil: string, reason?: string|null}} input
   * @returns {object}
   */
  defer(id, input) {
    const opp = this.get(id);
    if (!opp) {
      fail(
        'OPPORTUNITY_NOT_FOUND',
        `OpportunityService.defer: opportunity '${id}' not found`,
        { opportunityId: id }
      );
    }
    if (TERMINAL_STATUSES.has(opp.status)) {
      fail(
        'OPPORTUNITY_INVALID_STATE',
        `OpportunityService.defer: opportunity '${id}' is '${opp.status}' (terminal), cannot defer`,
        { opportunityId: id, status: opp.status }
      );
    }
    if (!input || typeof input !== 'object') {
      fail('INVALID_INPUT', 'OpportunityService.defer: input required');
    }
    const { deferredUntil } = input;
    if (typeof deferredUntil !== 'string' || deferredUntil.length === 0) {
      fail(
        'INVALID_DEFERRED_UNTIL',
        'OpportunityService.defer: deferredUntil must be a non-empty ISO date string',
        { deferredUntil }
      );
    }
    const now = this._clock.now();
    const next = {
      ...opp,
      status: OpportunityStatus.DEFERRED,
      deferredUntil,
      rejectionReason:
        typeof input.reason === 'string' && input.reason.length > 0
          ? input.reason
          : opp.rejectionReason,
      updatedAt: now
    };
    this._repo.upsert(OPPORTUNITIES_KEY, id, next);

    this._bus.publish(OpportunityDeferred, {
      opportunityId: id,
      userId: opp.userId,
      deferredUntil,
      reason: input.reason ?? null,
      deferredAt: now
    });

    return next;
  }

  /**
   * Reject an opportunity with a reason (min 5 chars).
   *
   * FSM: INTAKE | SCORED → REJECTED.
   *
   * @param {string} id
   * @param {{reason: string}} input
   * @returns {object}
   */
  reject(id, input) {
    const opp = this.get(id);
    if (!opp) {
      fail(
        'OPPORTUNITY_NOT_FOUND',
        `OpportunityService.reject: opportunity '${id}' not found`,
        { opportunityId: id }
      );
    }
    if (TERMINAL_STATUSES.has(opp.status)) {
      fail(
        'OPPORTUNITY_INVALID_STATE',
        `OpportunityService.reject: opportunity '${id}' is '${opp.status}' (terminal), cannot reject`,
        { opportunityId: id, status: opp.status }
      );
    }
    if (!input || typeof input !== 'object') {
      fail('INVALID_INPUT', 'OpportunityService.reject: input required');
    }
    const { reason } = input;
    if (typeof reason !== 'string' || reason.length < REJECTION_REASON_MIN_LENGTH) {
      fail(
        'REJECTION_REASON_TOO_SHORT',
        `OpportunityService.reject: reason must be ≥ ${REJECTION_REASON_MIN_LENGTH} chars (got ${reason?.length ?? 0})`,
        { length: reason?.length ?? 0 }
      );
    }
    const now = this._clock.now();
    const next = {
      ...opp,
      status: OpportunityStatus.REJECTED,
      rejectionReason: reason,
      updatedAt: now
    };
    this._repo.upsert(OPPORTUNITIES_KEY, id, next);

    this._bus.publish(OpportunityRejected, {
      opportunityId: id,
      userId: opp.userId,
      rejectionReason: reason,
      rejectedAt: now
    });

    return next;
  }
}

export default OpportunityService;
