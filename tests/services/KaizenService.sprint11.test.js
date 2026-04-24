/**
 * Sprint 11 P1-T2 — KaizenService.updateProjectType on DRAFT Kaizens.
 *
 * Covers:
 *   - updateProjectType happy path: 5 valid project types
 *   - Guards: KAIZEN_NOT_FOUND, KAIZEN_ABANDONED, KAIZEN_NOT_IN_DRAFT,
 *     INVALID_PROJECT_TYPE, INVALID_INPUT
 *   - No-op when newProjectType matches current
 *   - Does not emit a new event (project-type change on DRAFT is not
 *     audit-worthy; baseline-lock captures the final projectType).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  KaizenService,
  KAIZENS_KEY
} from '../../js/services/KaizenService.js';
import {
  KaizenPromoted,
  KaizenBaselineLocked
} from '../../js/events/events.js';
import { LocalStorageRepository } from '../../js/persistence/LocalStorageRepository.js';
import { EventBus } from '../../js/events/EventBus.js';
import { ClockService } from '../../js/services/ClockService.js';
import { LocalStorageMock } from '../_helpers/localStorageMock.js';

const FROZEN = '2026-04-22T10:00:00Z';

function buildEnv(nowIso = FROZEN) {
  const storage = new LocalStorageMock();
  const repo = new LocalStorageRepository({ storage });
  const bus = new EventBus();
  const clock = new ClockService({ now: () => nowIso });
  const service = new KaizenService({ repo, bus, clock });
  return { service, repo, bus, clock, storage };
}

function seedDraft(env, { kaizenId = 'k_draft', projectType = 'AD_HOC', abandoned = false, userId = 'u_1', state = 'DRAFT' } = {}) {
  const existing = env.repo.read(KAIZENS_KEY) ?? {};
  env.repo.write(KAIZENS_KEY, {
    ...existing,
    [kaizenId]: {
      id: kaizenId,
      userId,
      title: 'Draft K',
      problemStatement: 'A draft Kaizen',
      goalStatement: '',
      state,
      projectType,
      actions: [],
      sourceFrictionSignalIds: [],
      baselineMetricId: null,
      openedAt: FROZEN,
      abandoned
    }
  });
  return kaizenId;
}

describe('KaizenService.updateProjectType — happy path', () => {
  test('DMAIC → KAIZEN_EVENT on DRAFT', () => {
    const env = buildEnv();
    const kid = seedDraft(env, { projectType: 'DMAIC' });
    const next = env.service.updateProjectType({
      kaizenId: kid,
      newProjectType: 'KAIZEN_EVENT',
      userId: 'u_1'
    });
    assert.equal(next.projectType, 'KAIZEN_EVENT');
  });

  test('change persists to storage', () => {
    const env = buildEnv();
    const kid = seedDraft(env, { projectType: 'AD_HOC' });
    env.service.updateProjectType({
      kaizenId: kid,
      newProjectType: 'DMAIC'
    });
    const stored = (env.repo.read(KAIZENS_KEY) ?? {})[kid];
    assert.equal(stored.projectType, 'DMAIC');
  });

  test('all 5 project types are accepted', () => {
    for (const pt of [
      'DMAIC',
      'KAIZEN_EVENT',
      'KAIZEN_EVENT_90D',
      'KAIZEN_ACCELERATOR_30D',
      'AD_HOC'
    ]) {
      const env = buildEnv();
      const kid = seedDraft(env, { projectType: 'AD_HOC' });
      const next = env.service.updateProjectType({
        kaizenId: kid,
        newProjectType: pt
      });
      assert.equal(next.projectType, pt);
    }
  });

  test('no-op when newProjectType matches current (idempotent read)', () => {
    const env = buildEnv();
    const kid = seedDraft(env, { projectType: 'DMAIC' });
    const before = (env.repo.read(KAIZENS_KEY) ?? {})[kid];
    const next = env.service.updateProjectType({
      kaizenId: kid,
      newProjectType: 'DMAIC'
    });
    assert.equal(next.projectType, 'DMAIC');
    // updatedAt / openedAt unchanged.
    const after = (env.repo.read(KAIZENS_KEY) ?? {})[kid];
    assert.deepEqual(after, before);
  });

  test('preserves untouched fields', () => {
    const env = buildEnv();
    const kid = seedDraft(env, { projectType: 'AD_HOC' });
    env.service.updateProjectType({
      kaizenId: kid,
      newProjectType: 'KAIZEN_EVENT_90D'
    });
    const stored = (env.repo.read(KAIZENS_KEY) ?? {})[kid];
    assert.equal(stored.title, 'Draft K');
    assert.equal(stored.problemStatement, 'A draft Kaizen');
    assert.equal(stored.state, 'DRAFT');
  });
});

describe('KaizenService.updateProjectType — guards', () => {
  test('missing input throws INVALID_INPUT', () => {
    const env = buildEnv();
    assert.throws(
      () => env.service.updateProjectType(null),
      /INVALID_INPUT/
    );
    assert.throws(
      () => env.service.updateProjectType(undefined),
      /INVALID_INPUT/
    );
  });

  test('missing kaizenId throws INVALID_INPUT', () => {
    const env = buildEnv();
    assert.throws(
      () => env.service.updateProjectType({ newProjectType: 'DMAIC' }),
      /INVALID_INPUT/
    );
  });

  test('empty string kaizenId throws INVALID_INPUT', () => {
    const env = buildEnv();
    assert.throws(
      () => env.service.updateProjectType({ kaizenId: '', newProjectType: 'DMAIC' }),
      /INVALID_INPUT/
    );
  });

  test('unknown kaizenId throws KAIZEN_NOT_FOUND', () => {
    const env = buildEnv();
    assert.throws(
      () => env.service.updateProjectType({ kaizenId: 'bogus', newProjectType: 'DMAIC' }),
      /KAIZEN_NOT_FOUND/
    );
  });

  test('ACTIVE kaizen throws KAIZEN_NOT_IN_DRAFT', () => {
    const env = buildEnv();
    const kid = seedDraft(env, { state: 'ACTIVE' });
    assert.throws(
      () => env.service.updateProjectType({ kaizenId: kid, newProjectType: 'DMAIC' }),
      /KAIZEN_NOT_IN_DRAFT/
    );
  });

  test('CLOSED kaizen throws KAIZEN_NOT_IN_DRAFT', () => {
    const env = buildEnv();
    const kid = seedDraft(env, { state: 'CLOSED' });
    assert.throws(
      () => env.service.updateProjectType({ kaizenId: kid, newProjectType: 'DMAIC' }),
      /KAIZEN_NOT_IN_DRAFT/
    );
  });

  test('abandoned kaizen throws KAIZEN_ABANDONED', () => {
    const env = buildEnv();
    const kid = seedDraft(env, { abandoned: true });
    assert.throws(
      () => env.service.updateProjectType({ kaizenId: kid, newProjectType: 'DMAIC' }),
      /KAIZEN_ABANDONED/
    );
  });

  test('invalid newProjectType throws INVALID_PROJECT_TYPE', () => {
    const env = buildEnv();
    const kid = seedDraft(env);
    assert.throws(
      () => env.service.updateProjectType({ kaizenId: kid, newProjectType: 'BOGUS' }),
      /INVALID_PROJECT_TYPE/
    );
  });

  test('non-string newProjectType throws INVALID_PROJECT_TYPE', () => {
    const env = buildEnv();
    const kid = seedDraft(env);
    assert.throws(
      () => env.service.updateProjectType({ kaizenId: kid, newProjectType: 123 }),
      /INVALID_PROJECT_TYPE/
    );
    assert.throws(
      () => env.service.updateProjectType({ kaizenId: kid, newProjectType: null }),
      /INVALID_PROJECT_TYPE/
    );
  });
});

describe('KaizenService.updateProjectType — event semantics', () => {
  test('does NOT emit KaizenPromoted or KaizenBaselineLocked on type change', () => {
    const env = buildEnv();
    const kid = seedDraft(env, { projectType: 'AD_HOC' });
    const events = [];
    env.bus.subscribe(KaizenPromoted, (p) => events.push(['promoted', p]));
    env.bus.subscribe(KaizenBaselineLocked, (p) => events.push(['locked', p]));
    env.service.updateProjectType({ kaizenId: kid, newProjectType: 'DMAIC' });
    assert.equal(events.length, 0);
  });

  test('returned object reflects the new projectType', () => {
    const env = buildEnv();
    const kid = seedDraft(env, { projectType: 'AD_HOC' });
    const returned = env.service.updateProjectType({
      kaizenId: kid,
      newProjectType: 'KAIZEN_ACCELERATOR_30D'
    });
    assert.equal(returned.projectType, 'KAIZEN_ACCELERATOR_30D');
    assert.equal(returned.id, kid);
  });
});
