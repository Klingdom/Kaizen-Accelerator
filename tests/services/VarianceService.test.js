/**
 * Tests for VarianceService (Sprint 5 P0-T4).
 *
 * Covers:
 *   - log() appends a variance + emits VarianceLogged
 *   - append-only: re-writing an existing id throws APPEND_ONLY_VIOLATION
 *   - OTHER reasonCode without a note throws OTHER_REQUIRES_NOTE
 *   - Invalid kind / reasonCode throw named errors
 *   - Required field validation
 *   - list() and listForComposition() read helpers
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { VarianceService, VARIANCES_KEY, buildVarianceId } from '../../js/services/VarianceService.js';
import { VarianceLogged } from '../../js/events/events.js';
import { LocalStorageRepository } from '../../js/persistence/LocalStorageRepository.js';
import { EventBus } from '../../js/events/EventBus.js';
import { ClockService } from '../../js/services/ClockService.js';
import { LocalStorageMock } from '../_helpers/localStorageMock.js';

const FROZEN_NOW = '2026-04-21T09:00:00Z';

function buildService() {
  const storage = new LocalStorageMock();
  const repo = new LocalStorageRepository({ storage });
  const bus = new EventBus();
  const clock = new ClockService({ now: () => FROZEN_NOW });
  const service = new VarianceService({ repo, bus, clock });
  return { service, repo, bus, clock, storage };
}

function validRow(overrides = {}) {
  return {
    scheduledActivityId: 'sa_1',
    compositionId: 'comp_1',
    catalogEntryId: 'cat_1',
    userId: 'u_1',
    kind: 'SKIPPED_NON_OPTIONAL',
    reasonCode: 'MEETING_CONFLICT',
    note: null,
    ...overrides
  };
}

describe('VarianceService — constructor', () => {
  test('throws INVALID_DEPS without repo', () => {
    assert.throws(
      () => new VarianceService({ bus: new EventBus(), clock: new ClockService() }),
      (e) => e.name === 'INVALID_DEPS'
    );
  });

  test('throws INVALID_DEPS without bus', () => {
    const storage = new LocalStorageMock();
    const repo = new LocalStorageRepository({ storage });
    assert.throws(
      () => new VarianceService({ repo, clock: new ClockService() }),
      (e) => e.name === 'INVALID_DEPS'
    );
  });

  test('throws INVALID_DEPS without clock', () => {
    const storage = new LocalStorageMock();
    const repo = new LocalStorageRepository({ storage });
    assert.throws(
      () => new VarianceService({ repo, bus: new EventBus() }),
      (e) => e.name === 'INVALID_DEPS'
    );
  });

  test('constructs with all required deps', () => {
    const { service } = buildService();
    assert.ok(service instanceof VarianceService);
  });
});

describe('VarianceService.log — happy path', () => {
  let ctx;
  beforeEach(() => { ctx = buildService(); });

  test('persists a variance row at bamx:v1:variances', () => {
    const v = ctx.service.log(validRow());
    const map = ctx.repo.read(VARIANCES_KEY);
    assert.ok(map[v.id]);
    assert.equal(map[v.id].scheduledActivityId, 'sa_1');
  });

  test('persisted variance has loggedAt from clock', () => {
    const v = ctx.service.log(validRow());
    assert.equal(v.loggedAt, FROZEN_NOW);
  });

  test('publishes VarianceLogged with the variance id', () => {
    let captured = null;
    ctx.bus.subscribe(VarianceLogged, (p) => { captured = p; });
    const v = ctx.service.log(validRow());
    assert.ok(captured, 'VarianceLogged not published');
    assert.equal(captured.varianceId, v.id);
    assert.equal(captured.scheduledActivityId, 'sa_1');
  });

  test('includes all declared fields on the persisted row', () => {
    const v = ctx.service.log(validRow({ reasonCode: 'SICK' }));
    assert.equal(v.compositionId, 'comp_1');
    assert.equal(v.catalogEntryId, 'cat_1');
    assert.equal(v.userId, 'u_1');
    assert.equal(v.kind, 'SKIPPED_NON_OPTIONAL');
    assert.equal(v.reasonCode, 'SICK');
    assert.equal(v.note, null);
  });

  test('returns the same variance object it persisted', () => {
    const v = ctx.service.log(validRow());
    const map = ctx.repo.read(VARIANCES_KEY);
    assert.deepEqual(map[v.id], v);
  });
});

describe('VarianceService.log — append-only', () => {
  test('overwriting an existing id throws APPEND_ONLY_VIOLATION', () => {
    const { service } = buildService();
    const row = validRow({ id: 'var_fixed_id' });
    service.log(row);
    assert.throws(
      () => service.log(row),
      (e) => e.name === 'APPEND_ONLY_VIOLATION'
    );
  });

  test('distinct ids succeed even with identical fields', () => {
    const { service } = buildService();
    const v1 = service.log(validRow({ id: 'var_a' }));
    const v2 = service.log(validRow({ id: 'var_b' }));
    assert.equal(v1.id, 'var_a');
    assert.equal(v2.id, 'var_b');
  });
});

describe('VarianceService.log — guard: OTHER requires note', () => {
  test('OTHER without note throws OTHER_REQUIRES_NOTE', () => {
    const { service } = buildService();
    assert.throws(
      () => service.log(validRow({ reasonCode: 'OTHER', note: null })),
      (e) => e.name === 'OTHER_REQUIRES_NOTE'
    );
  });

  test('OTHER with empty-string note throws OTHER_REQUIRES_NOTE', () => {
    const { service } = buildService();
    assert.throws(
      () => service.log(validRow({ reasonCode: 'OTHER', note: '' })),
      (e) => e.name === 'OTHER_REQUIRES_NOTE'
    );
  });

  test('OTHER with real note succeeds', () => {
    const { service } = buildService();
    const v = service.log(
      validRow({ reasonCode: 'OTHER', note: 'Fire drill pulled me away' })
    );
    assert.equal(v.note, 'Fire drill pulled me away');
    assert.equal(v.reasonCode, 'OTHER');
  });

  test('non-OTHER without note succeeds', () => {
    const { service } = buildService();
    const v = service.log(validRow({ reasonCode: 'SICK', note: null }));
    assert.equal(v.reasonCode, 'SICK');
  });
});

describe('VarianceService.log — enum validation', () => {
  test('invalid kind throws INVALID_VARIANCE_KIND', () => {
    const { service } = buildService();
    assert.throws(
      () => service.log(validRow({ kind: 'NOT_A_KIND' })),
      (e) => e.name === 'INVALID_VARIANCE_KIND'
    );
  });

  test('invalid reasonCode throws INVALID_REASON_CODE', () => {
    const { service } = buildService();
    assert.throws(
      () => service.log(validRow({ reasonCode: 'LOL' })),
      (e) => e.name === 'INVALID_REASON_CODE'
    );
  });

  test('every valid kind works', () => {
    const kinds = [
      'SKIPPED_NON_OPTIONAL',
      'OVERRAN',
      'UNDERRAN',
      'RESCHEDULED',
      'EDITED_FROM_PROPOSAL'
    ];
    for (const k of kinds) {
      const { service } = buildService();
      const v = service.log(validRow({ kind: k, id: `var_${k}` }));
      assert.equal(v.kind, k);
    }
  });

  test('every valid reasonCode works', () => {
    const codes = [
      'ESCALATION',
      'MEETING_CONFLICT',
      'SICK',
      'BLOCKED',
      'DEPRIORITIZED'
    ];
    for (const c of codes) {
      const { service } = buildService();
      const v = service.log(validRow({ reasonCode: c, id: `var_${c}` }));
      assert.equal(v.reasonCode, c);
    }
  });
});

describe('VarianceService.log — required fields', () => {
  test('missing scheduledActivityId throws INVALID_INPUT', () => {
    const { service } = buildService();
    assert.throws(
      () => service.log(validRow({ scheduledActivityId: '' })),
      (e) => e.name === 'INVALID_INPUT'
    );
  });

  test('missing userId throws INVALID_INPUT', () => {
    const { service } = buildService();
    assert.throws(
      () => service.log(validRow({ userId: '' })),
      (e) => e.name === 'INVALID_INPUT'
    );
  });

  test('null row throws INVALID_INPUT', () => {
    const { service } = buildService();
    assert.throws(() => service.log(null), (e) => e.name === 'INVALID_INPUT');
  });
});

describe('VarianceService.list + listForComposition', () => {
  test('list returns [] when empty', () => {
    const { service } = buildService();
    assert.deepEqual(service.list(), []);
  });

  test('list returns all variances', () => {
    const { service } = buildService();
    service.log(validRow({ id: 'v1', scheduledActivityId: 'sa_1' }));
    service.log(validRow({ id: 'v2', scheduledActivityId: 'sa_2' }));
    assert.equal(service.list().length, 2);
  });

  test('list filters by userId', () => {
    const { service } = buildService();
    service.log(validRow({ id: 'v1', userId: 'u_a' }));
    service.log(validRow({ id: 'v2', userId: 'u_b' }));
    assert.equal(service.list('u_a').length, 1);
    assert.equal(service.list('u_b').length, 1);
    assert.equal(service.list('u_c').length, 0);
  });

  test('listForComposition filters by compositionId', () => {
    const { service } = buildService();
    service.log(validRow({ id: 'v1', compositionId: 'c_1' }));
    service.log(validRow({ id: 'v2', compositionId: 'c_2' }));
    assert.equal(service.listForComposition('c_1').length, 1);
    assert.equal(service.listForComposition('c_2').length, 1);
  });
});

describe('buildVarianceId', () => {
  test('produces a stable id shape', () => {
    const id = buildVarianceId('sa_123', '2026-04-21T09:00:00Z');
    assert.match(id, /^var_sa_123_\d+$/);
  });

  test('sanitizes unsafe characters in id components', () => {
    // 'sa/../..' has 6 non-word chars after 'sa'; safeTs becomes '' for
    // non-digit input. Format: `var_${safeSa}_${safeTs}` → 'var_sa______' + '_' + ''.
    const id = buildVarianceId('sa/../..', '<bad>');
    assert.match(id, /^var_sa_+_$/);
  });
});
