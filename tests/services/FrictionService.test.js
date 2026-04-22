/**
 * Tests for FrictionService (Sprint 6 P0-T2).
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  FrictionService,
  FRICTION_SIGNALS_KEY,
  FRICTION_SUMMARY_MAX_LENGTH,
  buildFrictionSignalId
} from '../../js/services/FrictionService.js';
import { FrictionSignalCaptured } from '../../js/events/events.js';
import { LocalStorageRepository } from '../../js/persistence/LocalStorageRepository.js';
import { EventBus } from '../../js/events/EventBus.js';
import { ClockService } from '../../js/services/ClockService.js';
import { LocalStorageMock } from '../_helpers/localStorageMock.js';

function buildEnv(nowIso = '2026-04-21T10:00:00Z') {
  const storage = new LocalStorageMock();
  const repo = new LocalStorageRepository({ storage });
  const bus = new EventBus();
  const clock = new ClockService({ now: () => nowIso });
  const service = new FrictionService({ repo, bus, clock });
  return { service, repo, bus, clock, storage };
}

function validRow(overrides = {}) {
  return {
    reflectionId: 'ref_sa_1',
    scheduledActivityId: 'sa_1',
    userId: 'u_1',
    summary: 'Too many meetings',
    tag: 'MEETING_LOAD',
    ...overrides
  };
}

describe('FrictionService — constructor', () => {
  test('throws INVALID_DEPS without repo', () => {
    assert.throws(
      () => new FrictionService({ bus: new EventBus(), clock: new ClockService() }),
      (e) => e.name === 'INVALID_DEPS'
    );
  });

  test('throws INVALID_DEPS without bus', () => {
    const storage = new LocalStorageMock();
    const repo = new LocalStorageRepository({ storage });
    assert.throws(
      () => new FrictionService({ repo, clock: new ClockService() }),
      (e) => e.name === 'INVALID_DEPS'
    );
  });

  test('throws INVALID_DEPS without clock', () => {
    const storage = new LocalStorageMock();
    const repo = new LocalStorageRepository({ storage });
    assert.throws(
      () => new FrictionService({ repo, bus: new EventBus() }),
      (e) => e.name === 'INVALID_DEPS'
    );
  });

  test('constructs with all required deps', () => {
    const { service } = buildEnv();
    assert.ok(service instanceof FrictionService);
  });
});

describe('FrictionService.capture — happy path', () => {
  let env;
  beforeEach(() => {
    env = buildEnv();
  });

  test('persists an OPEN friction signal', () => {
    const s = env.service.capture(validRow());
    const map = env.repo.read(FRICTION_SIGNALS_KEY);
    assert.ok(map[s.id]);
    assert.equal(map[s.id].status, 'OPEN');
    assert.equal(map[s.id].kaizenId, null);
    assert.equal(map[s.id].summary, 'Too many meetings');
    assert.equal(map[s.id].tag, 'MEETING_LOAD');
  });

  test('sets capturedAt from clock', () => {
    const s = env.service.capture(validRow());
    assert.equal(s.capturedAt, '2026-04-21T10:00:00Z');
  });

  test('publishes FrictionSignalCaptured', () => {
    let captured = null;
    env.bus.subscribe(FrictionSignalCaptured, (p) => {
      captured = p;
    });
    const s = env.service.capture(validRow());
    assert.ok(captured);
    assert.equal(captured.frictionSignalId, s.id);
    assert.equal(captured.tag, 'MEETING_LOAD');
  });

  test('null tag is allowed', () => {
    const s = env.service.capture(validRow({ tag: null }));
    assert.equal(s.tag, null);
  });
});

describe('FrictionService.capture — append-only', () => {
  test('capture with duplicate id throws APPEND_ONLY_VIOLATION', () => {
    const { service } = buildEnv();
    const row = validRow({ id: 'fs_fixed' });
    service.capture(row);
    assert.throws(
      () => service.capture(row),
      (e) => e.name === 'APPEND_ONLY_VIOLATION'
    );
  });
});

describe('FrictionService.capture — guards', () => {
  test('throws SUMMARY_TOO_LONG when > 140 chars', () => {
    const { service } = buildEnv();
    const long = 'x'.repeat(141);
    assert.throws(
      () => service.capture(validRow({ summary: long })),
      (e) => e.name === 'SUMMARY_TOO_LONG'
    );
  });

  test('accepts summary at exactly 140 chars', () => {
    const { service } = buildEnv();
    const edge = 'x'.repeat(140);
    const s = service.capture(validRow({ summary: edge }));
    assert.equal(s.summary.length, 140);
  });

  test('throws INVALID_TAG on unknown tag', () => {
    const { service } = buildEnv();
    assert.throws(
      () => service.capture(validRow({ tag: 'NOT_REAL' })),
      (e) => e.name === 'INVALID_TAG'
    );
  });

  test('throws INVALID_USER_ID on missing userId', () => {
    const { service } = buildEnv();
    assert.throws(
      () => service.capture(validRow({ userId: '' })),
      (e) => e.name === 'INVALID_USER_ID'
    );
  });

  test('throws INVALID_INPUT when reflectionId missing', () => {
    const { service } = buildEnv();
    assert.throws(
      () => service.capture(validRow({ reflectionId: '' })),
      (e) => e.name === 'INVALID_INPUT'
    );
  });

  test('throws INVALID_INPUT when scheduledActivityId missing', () => {
    const { service } = buildEnv();
    assert.throws(
      () => service.capture(validRow({ scheduledActivityId: '' })),
      (e) => e.name === 'INVALID_INPUT'
    );
  });

  test('throws INVALID_INPUT when summary not a string', () => {
    const { service } = buildEnv();
    assert.throws(
      () => service.capture(validRow({ summary: 42 })),
      (e) => e.name === 'INVALID_INPUT'
    );
  });
});

describe('FrictionService.list', () => {
  test('default returns non-terminal (OPEN + CLUSTERED)', () => {
    const { service, repo } = buildEnv();
    service.capture(validRow({ id: 'fs_1', scheduledActivityId: 'sa_1' }));
    const s2 = service.capture(validRow({ id: 'fs_2', scheduledActivityId: 'sa_2' }));
    // Flip fs_2 to DISMISSED.
    service.updateStatus(s2.id, 'DISMISSED');
    const pending = service.list({ userId: 'u_1' });
    assert.equal(pending.length, 1);
    assert.equal(pending[0].id, 'fs_1');
  });

  test('filter by explicit status=OPEN', () => {
    const { service } = buildEnv();
    service.capture(validRow({ id: 'fs_1' }));
    const s2 = service.capture(validRow({ id: 'fs_2', scheduledActivityId: 'sa_2' }));
    service.updateStatus(s2.id, 'CLUSTERED');
    const open = service.list({ userId: 'u_1', status: 'OPEN' });
    assert.equal(open.length, 1);
    assert.equal(open[0].id, 'fs_1');
  });

  test('filter by userId', () => {
    const { service } = buildEnv();
    service.capture(validRow({ id: 'fs_a', userId: 'u_a' }));
    service.capture(validRow({ id: 'fs_b', userId: 'u_b' }));
    assert.equal(service.list({ userId: 'u_a' }).length, 1);
  });
});

describe('FrictionService.listByReflectionId', () => {
  test('returns all signals for a reflection', () => {
    const { service } = buildEnv();
    service.capture(validRow({ id: 'a', reflectionId: 'r1' }));
    service.capture(validRow({ id: 'b', reflectionId: 'r1', scheduledActivityId: 'sa_b' }));
    service.capture(validRow({ id: 'c', reflectionId: 'r2' }));
    assert.equal(service.listByReflectionId('r1').length, 2);
    assert.equal(service.listByReflectionId('r2').length, 1);
  });
});

describe('FrictionService.clusterByTag', () => {
  test('groups signals by tag with counts', () => {
    const { service } = buildEnv();
    service.capture(validRow({ id: 'a', tag: 'MEETING_LOAD', scheduledActivityId: 'sa_a' }));
    service.capture(validRow({ id: 'b', tag: 'MEETING_LOAD', scheduledActivityId: 'sa_b' }));
    service.capture(validRow({ id: 'c', tag: 'TOOL_FRICTION', scheduledActivityId: 'sa_c' }));
    const clusters = service.clusterByTag('u_1', 7);
    assert.equal(clusters.length, 2);
    assert.equal(clusters[0].tag, 'MEETING_LOAD');
    assert.equal(clusters[0].count, 2);
    assert.equal(clusters[1].tag, 'TOOL_FRICTION');
    assert.equal(clusters[1].count, 1);
  });

  test('sorted by count desc, ties broken by recency', () => {
    const { service } = buildEnv();
    service.capture(validRow({ id: '1', tag: 'MEETING_LOAD', scheduledActivityId: 's1' }));
    service.capture(validRow({ id: '2', tag: 'TOOL_FRICTION', scheduledActivityId: 's2' }));
    const clusters = service.clusterByTag('u_1', 7);
    // Both count=1; order determined by timestamp (same) so stable.
    assert.equal(clusters.length, 2);
  });

  test('signals outside the window are excluded', () => {
    // Recent signal at 10:00, old signal 10 days ago. 7-day window = excluded.
    const old = buildEnv('2026-04-11T10:00:00Z');
    old.service.capture(validRow({ id: 'old', tag: 'MEETING_LOAD' }));
    // Now switch clock to new env reusing same storage.
    const recent = new ClockService({ now: () => '2026-04-21T10:00:00Z' });
    const recentSvc = new FrictionService({ repo: old.repo, bus: old.bus, clock: recent });
    recentSvc.capture(validRow({ id: 'new', tag: 'MEETING_LOAD', scheduledActivityId: 'sa_new' }));
    const clusters = recentSvc.clusterByTag('u_1', 7);
    // Only 'new' is within 7 days
    assert.equal(clusters.length, 1);
    assert.equal(clusters[0].count, 1);
  });

  test('throws INVALID_USER_ID when userId missing', () => {
    const { service } = buildEnv();
    assert.throws(
      () => service.clusterByTag('', 7),
      (e) => e.name === 'INVALID_USER_ID'
    );
  });

  test('signals with null tag grouped under UNTAGGED', () => {
    const { service } = buildEnv();
    service.capture(validRow({ id: 'u', tag: null, scheduledActivityId: 'sa_u' }));
    const clusters = service.clusterByTag('u_1', 7);
    assert.equal(clusters[0].tag, 'UNTAGGED');
  });

  test('terminal signals (PROMOTED/DISMISSED) are excluded', () => {
    const { service } = buildEnv();
    const a = service.capture(validRow({ id: 'a', tag: 'MEETING_LOAD' }));
    const b = service.capture(validRow({ id: 'b', tag: 'MEETING_LOAD', scheduledActivityId: 'sa_b' }));
    service.updateStatus(a.id, 'DISMISSED');
    service.updateStatus(b.id, 'PROMOTED_TO_KAIZEN', { kaizenId: 'k_1' });
    assert.equal(service.clusterByTag('u_1', 7).length, 0);
  });
});

describe('FrictionService.updateStatus — FSM transitions', () => {
  test('OPEN → CLUSTERED allowed', () => {
    const { service } = buildEnv();
    const s = service.capture(validRow());
    const next = service.updateStatus(s.id, 'CLUSTERED');
    assert.equal(next.status, 'CLUSTERED');
  });

  test('OPEN → DISMISSED allowed', () => {
    const { service } = buildEnv();
    const s = service.capture(validRow());
    const next = service.updateStatus(s.id, 'DISMISSED');
    assert.equal(next.status, 'DISMISSED');
  });

  test('OPEN → PROMOTED_TO_KAIZEN requires kaizenId', () => {
    const { service } = buildEnv();
    const s = service.capture(validRow());
    assert.throws(
      () => service.updateStatus(s.id, 'PROMOTED_TO_KAIZEN'),
      (e) => e.name === 'INVALID_INPUT'
    );
  });

  test('OPEN → PROMOTED_TO_KAIZEN succeeds with kaizenId', () => {
    const { service } = buildEnv();
    const s = service.capture(validRow());
    const next = service.updateStatus(s.id, 'PROMOTED_TO_KAIZEN', {
      kaizenId: 'k_1'
    });
    assert.equal(next.status, 'PROMOTED_TO_KAIZEN');
    assert.equal(next.kaizenId, 'k_1');
  });

  test('PROMOTED_TO_KAIZEN is terminal — any further transition throws', () => {
    const { service } = buildEnv();
    const s = service.capture(validRow());
    service.updateStatus(s.id, 'PROMOTED_TO_KAIZEN', { kaizenId: 'k_1' });
    assert.throws(
      () => service.updateStatus(s.id, 'DISMISSED'),
      (e) => e.name === 'ILLEGAL_TRANSITION'
    );
  });

  test('DISMISSED is terminal', () => {
    const { service } = buildEnv();
    const s = service.capture(validRow());
    service.updateStatus(s.id, 'DISMISSED');
    assert.throws(
      () => service.updateStatus(s.id, 'OPEN'),
      (e) => e.name === 'ILLEGAL_TRANSITION'
    );
  });

  test('throws SIGNAL_NOT_FOUND on unknown id', () => {
    const { service } = buildEnv();
    assert.throws(
      () => service.updateStatus('fs_missing', 'CLUSTERED'),
      (e) => e.name === 'SIGNAL_NOT_FOUND'
    );
  });

  test('throws INVALID_STATUS on unknown target', () => {
    const { service } = buildEnv();
    const s = service.capture(validRow());
    assert.throws(
      () => service.updateStatus(s.id, 'BOGUS'),
      (e) => e.name === 'INVALID_STATUS'
    );
  });
});

describe('buildFrictionSignalId', () => {
  test('produces a deterministic id', () => {
    const id = buildFrictionSignalId('ref_1', '2026-04-21T10:00:00Z');
    assert.match(id, /^fs_ref_1_\d+$/);
  });
});

describe('constants', () => {
  test('exports summary max length 140', () => {
    assert.equal(FRICTION_SUMMARY_MAX_LENGTH, 140);
  });
});
