/**
 * Sprint 15 W5 — ComposerService.reflow tests.
 *
 * Verifies:
 *   - reflow preserves IN_PROGRESS / CLOSED / SKIPPED / DROPPED state
 *   - reflow updates PROPOSED / SCHEDULED activities' plannedStartAt
 *   - reflow does nothing when no PROPOSED/SCHEDULED remain
 *   - reflow returns null when no active composition matches
 *   - CycleReflowed event is published with the right payload
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  ComposerService,
  ACTIVITIES_KEY,
  COMPOSITIONS_KEY
} from '../../js/services/ComposerService.js';
import { LocalStorageRepository } from '../../js/persistence/LocalStorageRepository.js';
import { EventBus } from '../../js/events/EventBus.js';
import { ClockService } from '../../js/services/ClockService.js';
import { LocalStorageMock } from '../_helpers/localStorageMock.js';
import { CycleReflowed } from '../../js/events/events.js';

const FROZEN_NOW = '2026-04-22T12:00:00Z';

function buildEnv() {
  const storage = new LocalStorageMock();
  const repo = new LocalStorageRepository({ storage });
  const bus = new EventBus();
  const clock = new ClockService({ now: () => FROZEN_NOW });
  const composerService = new ComposerService({ repo, bus, clock });
  return { storage, repo, bus, clock, composerService };
}

function seedComposition(repo, { state = 'ACCEPTED', date = '2026-04-22' } = {}) {
  const comp = {
    id: 'comp_user_phil_2026-04-22',
    userId: 'user_phil_mvp',
    cycleType: 'DAILY',
    state,
    startAt: `${date}T00:00:00Z`,
    endAt: `${date}T23:59:59Z`,
    proposedAt: `${date}T08:00:00Z`,
    decidedAt: state === 'ACCEPTED' ? `${date}T08:30:00Z` : null,
    closedAt: null,
    parentCompositionId: null,
    composerInputsSnapshot: { capacityMinutes: 480 }
  };
  const comps = repo.read(COMPOSITIONS_KEY) ?? {};
  repo.write(COMPOSITIONS_KEY, { ...comps, [comp.id]: comp });
  return comp;
}

function seedActivities(repo, compositionId, rows) {
  const acts = repo.read(ACTIVITIES_KEY) ?? {};
  const next = { ...acts };
  for (const r of rows) {
    next[r.id] = { ...r, compositionId };
  }
  repo.write(ACTIVITIES_KEY, next);
}

describe('ComposerService.reflow — input validation', () => {
  let env;
  beforeEach(() => { env = buildEnv(); });

  test('throws when input is missing', () => {
    assert.throws(() => env.composerService.reflow(), { name: 'INVALID_INPUT' });
    assert.throws(() => env.composerService.reflow(null), { name: 'INVALID_INPUT' });
  });

  test('throws when userId is missing', () => {
    assert.throws(
      () => env.composerService.reflow({ date: '2026-04-22' }),
      { name: 'INVALID_INPUT' }
    );
  });

  test('throws when date is missing or short', () => {
    assert.throws(
      () => env.composerService.reflow({ userId: 'user_phil_mvp' }),
      { name: 'INVALID_INPUT' }
    );
    assert.throws(
      () => env.composerService.reflow({ userId: 'user_phil_mvp', date: 'short' }),
      { name: 'INVALID_INPUT' }
    );
  });
});

describe('ComposerService.reflow — empty state', () => {
  let env;
  beforeEach(() => { env = buildEnv(); });

  test('returns null when no active composition exists', () => {
    const out = env.composerService.reflow({
      userId: 'user_phil_mvp',
      date: '2026-04-22'
    });
    assert.equal(out, null);
  });

  test('returns null when composition exists but has no children', () => {
    seedComposition(env.repo);
    const out = env.composerService.reflow({
      userId: 'user_phil_mvp',
      date: '2026-04-22'
    });
    assert.equal(out, null);
  });

  test('returns null when all children are in terminal/preserved states', () => {
    const comp = seedComposition(env.repo);
    seedActivities(env.repo, comp.id, [
      {
        id: 'closed_a',
        catalogEntryId: 'cat_x',
        bucket: 'PROJECT',
        plannedDurationMinutes: 60,
        plannedStartAt: '09:00',
        state: 'CLOSED',
        actualStartAt: '2026-04-22T09:00:00Z'
      },
      {
        id: 'inprog_b',
        catalogEntryId: 'cat_y',
        bucket: 'COMMUNICATION',
        plannedDurationMinutes: 30,
        plannedStartAt: '10:00',
        state: 'IN_PROGRESS',
        actualStartAt: '2026-04-22T10:00:00Z'
      }
    ]);
    const out = env.composerService.reflow({
      userId: 'user_phil_mvp',
      date: '2026-04-22'
    });
    assert.equal(out, null);
  });

  test('returns null when the composition matches a different user', () => {
    seedComposition(env.repo);
    const out = env.composerService.reflow({
      userId: 'user_other',
      date: '2026-04-22'
    });
    assert.equal(out, null);
  });

  test('returns null when the composition matches a different date', () => {
    seedComposition(env.repo);
    const out = env.composerService.reflow({
      userId: 'user_phil_mvp',
      date: '2026-04-23'
    });
    assert.equal(out, null);
  });
});

describe('ComposerService.reflow — preserves IN_PROGRESS / CLOSED', () => {
  let env;
  beforeEach(() => { env = buildEnv(); });

  test('preserves the plannedStartAt of CLOSED activities', () => {
    const comp = seedComposition(env.repo);
    seedActivities(env.repo, comp.id, [
      {
        id: 'a_closed',
        catalogEntryId: 'cat_x',
        bucket: 'PROJECT',
        plannedDurationMinutes: 60,
        plannedStartAt: '09:00',
        state: 'CLOSED'
      },
      {
        id: 'b_pending',
        catalogEntryId: 'cat_y',
        bucket: 'PROJECT',
        plannedDurationMinutes: 60,
        plannedStartAt: '10:00',
        state: 'PROPOSED'
      }
    ]);
    env.composerService.reflow({ userId: 'user_phil_mvp', date: '2026-04-22' });
    const acts = env.repo.read(ACTIVITIES_KEY) ?? {};
    assert.equal(acts.a_closed.plannedStartAt, '09:00');
    assert.equal(acts.a_closed.state, 'CLOSED');
  });

  test('preserves the plannedStartAt of IN_PROGRESS activities', () => {
    const comp = seedComposition(env.repo);
    seedActivities(env.repo, comp.id, [
      {
        id: 'a_inprog',
        catalogEntryId: 'cat_x',
        bucket: 'PROJECT',
        plannedDurationMinutes: 60,
        plannedStartAt: '09:00',
        state: 'IN_PROGRESS',
        actualStartAt: '2026-04-22T09:00:00Z'
      },
      {
        id: 'b_pending',
        catalogEntryId: 'cat_y',
        bucket: 'PROJECT',
        plannedDurationMinutes: 60,
        plannedStartAt: '10:00',
        state: 'PROPOSED'
      }
    ]);
    env.composerService.reflow({ userId: 'user_phil_mvp', date: '2026-04-22' });
    const acts = env.repo.read(ACTIVITIES_KEY) ?? {};
    assert.equal(acts.a_inprog.plannedStartAt, '09:00');
    assert.equal(acts.a_inprog.state, 'IN_PROGRESS');
  });

  test('preserves SKIPPED and DROPPED states', () => {
    const comp = seedComposition(env.repo);
    seedActivities(env.repo, comp.id, [
      {
        id: 'a_skipped',
        catalogEntryId: 'cat_x',
        bucket: 'PROJECT',
        plannedDurationMinutes: 60,
        plannedStartAt: '09:00',
        state: 'SKIPPED'
      },
      {
        id: 'b_dropped',
        catalogEntryId: 'cat_y',
        bucket: 'PROJECT',
        plannedDurationMinutes: 60,
        plannedStartAt: '10:00',
        state: 'DROPPED'
      },
      {
        id: 'c_pending',
        catalogEntryId: 'cat_z',
        bucket: 'PROJECT',
        plannedDurationMinutes: 60,
        plannedStartAt: '11:00',
        state: 'PROPOSED'
      }
    ]);
    env.composerService.reflow({ userId: 'user_phil_mvp', date: '2026-04-22' });
    const acts = env.repo.read(ACTIVITIES_KEY) ?? {};
    assert.equal(acts.a_skipped.state, 'SKIPPED');
    assert.equal(acts.b_dropped.state, 'DROPPED');
  });
});

describe('ComposerService.reflow — repacks PROPOSED/SCHEDULED', () => {
  let env;
  beforeEach(() => { env = buildEnv(); });

  test('flexible activities slot AFTER the latest preserved end time', () => {
    const comp = seedComposition(env.repo);
    // 09:00–10:30 is CLOSED, 12:00 PROPOSED block should slide back to 10:30.
    seedActivities(env.repo, comp.id, [
      {
        id: 'closed',
        catalogEntryId: 'cat_x',
        bucket: 'PROJECT',
        plannedDurationMinutes: 90,
        plannedStartAt: '09:00',
        state: 'CLOSED'
      },
      {
        id: 'pending',
        catalogEntryId: 'cat_y',
        bucket: 'PROJECT',
        plannedDurationMinutes: 60,
        plannedStartAt: '12:00',
        state: 'PROPOSED'
      }
    ]);
    env.composerService.reflow({ userId: 'user_phil_mvp', date: '2026-04-22' });
    const acts = env.repo.read(ACTIVITIES_KEY) ?? {};
    assert.equal(acts.pending.plannedStartAt, '12:00'); // already later than 10:30 → no shift
  });

  test('flexible activity STARTING before preserved end gets pulled forward', () => {
    const comp = seedComposition(env.repo);
    seedActivities(env.repo, comp.id, [
      {
        id: 'closed',
        catalogEntryId: 'cat_x',
        bucket: 'PROJECT',
        plannedDurationMinutes: 90,
        plannedStartAt: '09:00',
        state: 'CLOSED'
      },
      {
        id: 'pending',
        catalogEntryId: 'cat_y',
        bucket: 'PROJECT',
        plannedDurationMinutes: 60,
        plannedStartAt: '09:30',
        state: 'PROPOSED'
      }
    ]);
    env.composerService.reflow({ userId: 'user_phil_mvp', date: '2026-04-22' });
    const acts = env.repo.read(ACTIVITIES_KEY) ?? {};
    // Should slide to 10:30 (closed end).
    assert.equal(acts.pending.plannedStartAt, '10:30');
  });

  test('two consecutive flexibles butt up against each other', () => {
    const comp = seedComposition(env.repo);
    seedActivities(env.repo, comp.id, [
      {
        id: 'closed',
        catalogEntryId: 'cat_x',
        bucket: 'PROJECT',
        plannedDurationMinutes: 60,
        plannedStartAt: '09:00',
        state: 'CLOSED'
      },
      {
        id: 'pa',
        catalogEntryId: 'cat_y',
        bucket: 'PROJECT',
        plannedDurationMinutes: 30,
        plannedStartAt: '09:00',
        state: 'PROPOSED'
      },
      {
        id: 'pb',
        catalogEntryId: 'cat_z',
        bucket: 'PROJECT',
        plannedDurationMinutes: 60,
        plannedStartAt: '09:30',
        state: 'PROPOSED'
      }
    ]);
    env.composerService.reflow({ userId: 'user_phil_mvp', date: '2026-04-22' });
    const acts = env.repo.read(ACTIVITIES_KEY) ?? {};
    // closed ends at 10:00 → pa starts at 10:00, ends 10:30 → pb starts 10:30.
    assert.equal(acts.pa.plannedStartAt, '10:00');
    assert.equal(acts.pb.plannedStartAt, '10:30');
  });

  test('handles ISO-shaped plannedStartAt by preserving the date prefix', () => {
    const comp = seedComposition(env.repo);
    seedActivities(env.repo, comp.id, [
      {
        id: 'closed',
        catalogEntryId: 'cat_x',
        bucket: 'PROJECT',
        plannedDurationMinutes: 60,
        plannedStartAt: '2026-04-22T09:00:00Z',
        state: 'CLOSED'
      },
      {
        id: 'pending',
        catalogEntryId: 'cat_y',
        bucket: 'PROJECT',
        plannedDurationMinutes: 60,
        plannedStartAt: '2026-04-22T08:00:00Z',
        state: 'PROPOSED'
      }
    ]);
    env.composerService.reflow({ userId: 'user_phil_mvp', date: '2026-04-22' });
    const acts = env.repo.read(ACTIVITIES_KEY) ?? {};
    assert.equal(acts.pending.plannedStartAt, '2026-04-22T10:00:00Z');
  });

  test('shifted count reports number of moved blocks', () => {
    const comp = seedComposition(env.repo);
    seedActivities(env.repo, comp.id, [
      {
        id: 'closed',
        catalogEntryId: 'cat_x',
        bucket: 'PROJECT',
        plannedDurationMinutes: 60,
        plannedStartAt: '09:00',
        state: 'CLOSED'
      },
      {
        id: 'pa',
        catalogEntryId: 'cat_y',
        bucket: 'PROJECT',
        plannedDurationMinutes: 30,
        plannedStartAt: '09:00',
        state: 'PROPOSED'
      },
      {
        id: 'pb',
        catalogEntryId: 'cat_z',
        bucket: 'PROJECT',
        plannedDurationMinutes: 60,
        plannedStartAt: '11:00',
        state: 'PROPOSED'
      }
    ]);
    const out = env.composerService.reflow({ userId: 'user_phil_mvp', date: '2026-04-22' });
    assert.ok(out);
    assert.ok(out.shifted >= 1);
  });
});

describe('ComposerService.reflow — emits CycleReflowed', () => {
  let env;
  beforeEach(() => { env = buildEnv(); });

  test('publishes CycleReflowed with scope DAILY + trigger', () => {
    const comp = seedComposition(env.repo);
    seedActivities(env.repo, comp.id, [
      {
        id: 'closed',
        catalogEntryId: 'cat_x',
        bucket: 'PROJECT',
        plannedDurationMinutes: 60,
        plannedStartAt: '09:00',
        state: 'CLOSED'
      },
      {
        id: 'pending',
        catalogEntryId: 'cat_y',
        bucket: 'PROJECT',
        plannedDurationMinutes: 60,
        plannedStartAt: '10:00',
        state: 'PROPOSED'
      }
    ]);
    const captured = [];
    env.bus.subscribe(CycleReflowed, (p) => captured.push(p));
    env.composerService.reflow({
      userId: 'user_phil_mvp',
      date: '2026-04-22',
      trigger: 'ActivityCompleted'
    });
    assert.equal(captured.length, 1);
    assert.equal(captured[0].compositionId, comp.id);
    assert.equal(captured[0].userId, 'user_phil_mvp');
    assert.equal(captured[0].scope, 'DAILY');
    assert.equal(captured[0].trigger, 'ActivityCompleted');
    assert.ok(typeof captured[0].reflowedAt === 'string');
    assert.ok(typeof captured[0].shifted === 'number');
    assert.ok(typeof captured[0].preserved === 'number');
  });

  test('default trigger is ActivityCompleted when omitted', () => {
    const comp = seedComposition(env.repo);
    seedActivities(env.repo, comp.id, [
      {
        id: 'closed',
        catalogEntryId: 'cat_x',
        bucket: 'PROJECT',
        plannedDurationMinutes: 60,
        plannedStartAt: '09:00',
        state: 'CLOSED'
      },
      {
        id: 'pending',
        catalogEntryId: 'cat_y',
        bucket: 'PROJECT',
        plannedDurationMinutes: 60,
        plannedStartAt: '10:00',
        state: 'PROPOSED'
      }
    ]);
    const captured = [];
    env.bus.subscribe(CycleReflowed, (p) => captured.push(p));
    env.composerService.reflow({ userId: 'user_phil_mvp', date: '2026-04-22' });
    assert.equal(captured[0].trigger, 'ActivityCompleted');
  });

  test('does not publish CycleReflowed when reflow is a no-op', () => {
    const captured = [];
    env.bus.subscribe(CycleReflowed, (p) => captured.push(p));
    env.composerService.reflow({ userId: 'user_phil_mvp', date: '2026-04-22' });
    assert.equal(captured.length, 0);
  });
});

describe('ComposerService.reflow — full sweep (sanity)', () => {
  let env;
  beforeEach(() => { env = buildEnv(); });

  test('mixed-state day reflows correctly end-to-end', () => {
    const comp = seedComposition(env.repo);
    seedActivities(env.repo, comp.id, [
      {
        id: 'a_closed',
        catalogEntryId: 'cat_x',
        bucket: 'PROJECT',
        plannedDurationMinutes: 90,
        plannedStartAt: '09:00',
        state: 'CLOSED'
      },
      {
        id: 'b_inprog',
        catalogEntryId: 'cat_y',
        bucket: 'COMMUNICATION',
        plannedDurationMinutes: 30,
        plannedStartAt: '10:30',
        state: 'IN_PROGRESS'
      },
      {
        id: 'c_pending',
        catalogEntryId: 'cat_z',
        bucket: 'CI',
        plannedDurationMinutes: 60,
        plannedStartAt: '10:30',
        state: 'PROPOSED'
      },
      {
        id: 'd_pending',
        catalogEntryId: 'cat_w',
        bucket: 'CI',
        plannedDurationMinutes: 30,
        plannedStartAt: '14:00',
        state: 'SCHEDULED'
      }
    ]);
    const result = env.composerService.reflow({
      userId: 'user_phil_mvp',
      date: '2026-04-22'
    });
    assert.ok(result);
    assert.equal(result.preserved, 2);

    const acts = env.repo.read(ACTIVITIES_KEY);
    // Preserved blocks unchanged.
    assert.equal(acts.a_closed.plannedStartAt, '09:00');
    assert.equal(acts.b_inprog.plannedStartAt, '10:30');
    // Latest preserved end = 10:30 + 30 = 11:00. So c_pending → 11:00.
    assert.equal(acts.c_pending.plannedStartAt, '11:00');
    // d_pending originally 14:00 — still later than c's end (12:00) →
    // stays at 14:00.
    assert.equal(acts.d_pending.plannedStartAt, '14:00');
  });
});
