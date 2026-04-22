/**
 * VarianceService — Sprint 5 E5 (P0-T4).
 *
 * The single writer for the append-only `bamx:v1:variances` table.
 * Variance rows are permanent once written; attempting to overwrite an
 * existing id throws APPEND_ONLY_VIOLATION (enforced by repo.appendOnly).
 *
 *   log({scheduledActivityId, compositionId, catalogEntryId, userId, kind,
 *        reasonCode, note})  — append a variance, emit VarianceLogged.
 *
 *   list(userId?)            — read all variances (optionally filtered).
 *   listForComposition(id)   — list by compositionId.
 *
 * Guards:
 *   - `reasonCode` must be a valid ReasonCode enum.
 *   - `kind`       must be a valid VarianceKind enum.
 *   - When `reasonCode === 'OTHER'`, `note` must be a non-empty string.
 *
 * No direct `localStorage`; no `Date.now()` / `new Date()` — clock + repo
 * DI only. Pure service, no module state.
 */

import { ReasonCode, VarianceKind } from '../domain/types.js';
import { VarianceLogged } from '../events/events.js';

export const VARIANCES_KEY = 'bamx:v1:variances';

const VALID_REASON_CODES = new Set(Object.values(ReasonCode));
const VALID_VARIANCE_KINDS = new Set(Object.values(VarianceKind));

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
 * Deterministic variance id. Format: `var_<sa>_<logged>` where `logged`
 * is the ISO-stamp with punctuation stripped so the id is a safe map key.
 * Collisions on the same (sa, timestamp) pair are extremely unlikely; if
 * they occur the appendOnly throw surfaces the issue.
 *
 * @param {string} scheduledActivityId
 * @param {string} loggedAt
 * @returns {string}
 */
export function buildVarianceId(scheduledActivityId, loggedAt) {
  const safeSa = String(scheduledActivityId ?? 'unknown').replace(/[^a-zA-Z0-9_]/g, '_');
  const safeTs = String(loggedAt ?? '').replace(/[^0-9]/g, '');
  return `var_${safeSa}_${safeTs}`;
}

export class VarianceService {
  /**
   * @param {{
   *   repo: import('../persistence/IRepository.js').IRepository,
   *   bus: { publish: (event: string, payload: any) => void },
   *   clock: import('./ClockService.js').ClockService
   * }} deps
   */
  constructor({ repo, bus, clock } = {}) {
    if (!repo) fail('INVALID_DEPS', 'VarianceService: repo is required');
    if (!bus || typeof bus.publish !== 'function') {
      fail('INVALID_DEPS', 'VarianceService: bus with publish() is required');
    }
    if (!clock || typeof clock.now !== 'function') {
      fail('INVALID_DEPS', 'VarianceService: clock with now() is required');
    }
    if (typeof repo.appendOnly !== 'function') {
      fail('INVALID_DEPS', 'VarianceService: repo.appendOnly() is required');
    }
    this._repo = repo;
    this._bus = bus;
    this._clock = clock;
  }

  /**
   * Append a Variance row. Returns the persisted variance.
   *
   * @param {{
   *   scheduledActivityId: string,
   *   compositionId: string,
   *   catalogEntryId: string,
   *   userId: string,
   *   kind: string,
   *   reasonCode: string,
   *   note?: string | null,
   *   id?: string
   * }} row
   * @returns {object}
   */
  log(row) {
    if (!row || typeof row !== 'object') {
      fail('INVALID_INPUT', 'VarianceService.log: row is required');
    }
    const {
      scheduledActivityId,
      compositionId,
      catalogEntryId,
      userId,
      kind,
      reasonCode
    } = row;
    const note = row.note ?? null;

    for (const [field, value] of [
      ['scheduledActivityId', scheduledActivityId],
      ['compositionId', compositionId],
      ['catalogEntryId', catalogEntryId],
      ['userId', userId]
    ]) {
      if (typeof value !== 'string' || value.length === 0) {
        fail(
          'INVALID_INPUT',
          `VarianceService.log: '${field}' must be a non-empty string`,
          { field }
        );
      }
    }

    if (!VALID_VARIANCE_KINDS.has(kind)) {
      fail(
        'INVALID_VARIANCE_KIND',
        `VarianceService.log: '${kind}' is not a valid VarianceKind`,
        { kind }
      );
    }
    if (!VALID_REASON_CODES.has(reasonCode)) {
      fail(
        'INVALID_REASON_CODE',
        `VarianceService.log: '${reasonCode}' is not a valid ReasonCode`,
        { reasonCode }
      );
    }

    if (reasonCode === 'OTHER') {
      if (typeof note !== 'string' || note.length === 0) {
        fail(
          'OTHER_REQUIRES_NOTE',
          'VarianceService.log: reasonCode=OTHER requires a non-empty note',
          { reasonCode }
        );
      }
    }

    const loggedAt = this._clock.now();
    const id = row.id ?? buildVarianceId(scheduledActivityId, loggedAt);
    const variance = {
      id,
      scheduledActivityId,
      compositionId,
      catalogEntryId,
      userId,
      kind,
      reasonCode,
      note,
      loggedAt
    };

    // appendOnly throws APPEND_ONLY_VIOLATION on duplicate id — surface as-is.
    this._repo.appendOnly(VARIANCES_KEY, id, variance);

    this._bus.publish(VarianceLogged, {
      varianceId: id,
      scheduledActivityId,
      compositionId,
      catalogEntryId,
      userId,
      kind,
      reasonCode,
      loggedAt
    });

    return variance;
  }

  /**
   * List all variances. Optional `userId` filter.
   *
   * @param {string} [userId]
   * @returns {object[]}
   */
  list(userId) {
    const map = this._repo.read(VARIANCES_KEY) ?? {};
    const all = Object.values(map);
    if (typeof userId === 'string' && userId.length > 0) {
      return all.filter((v) => v && v.userId === userId);
    }
    return all;
  }

  /**
   * List variances for a specific composition.
   *
   * @param {string} compositionId
   * @returns {object[]}
   */
  listForComposition(compositionId) {
    if (typeof compositionId !== 'string' || compositionId.length === 0) {
      fail('INVALID_ID', 'VarianceService.listForComposition: compositionId required');
    }
    const map = this._repo.read(VARIANCES_KEY) ?? {};
    return Object.values(map).filter(
      (v) => v && v.compositionId === compositionId
    );
  }
}

export default VarianceService;
