/**
 * Tests for KaizenService.promoteFromOpportunity (Sprint 7 P0-T3).
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  KaizenService,
  KAIZENS_KEY
} from '../../js/services/KaizenService.js';
import { KaizenPromoted } from '../../js/events/events.js';
import { LocalStorageRepository } from '../../js/persistence/LocalStorageRepository.js';
import { EventBus } from '../../js/events/EventBus.js';
import { ClockService } from '../../js/services/ClockService.js';
import { LocalStorageMock } from '../_helpers/localStorageMock.js';

const FROZEN_NOW = '2026-04-21T10:00:00Z';

function buildEnv(nowIso = FROZEN_NOW) {
  const storage = new LocalStorageMock();
  const repo = new LocalStorageRepository({ storage });
  const bus = new EventBus();
  const clock = new ClockService({ now: () => nowIso });
  const service = new KaizenService({ repo, bus, clock });
  return { service, repo, bus, clock };
}

describe('KaizenService.promoteFromOpportunity — happy path', () => {
  let env;
  beforeEach(() => { env = buildEnv(); });

  test('creates a DRAFT Kaizen preserving title/problem/projectType', () => {
    const { kaizen } = env.service.promoteFromOpportunity('opp_u_1_42', {
      userId: 'u_1',
      title: 'Reduce meeting load',
      problemStatement: 'Too many meetings are crushing deep work.',
      projectType: 'DMAIC'
    });
    assert.equal(kaizen.state, 'DRAFT');
    assert.equal(kaizen.title, 'Reduce meeting load');
    assert.equal(kaizen.problemStatement,
      'Too many meetings are crushing deep work.');
    assert.equal(kaizen.projectType, 'DMAIC');
  });

  test('sets sourceOpportunityId = opportunityId', () => {
    const { kaizen } = env.service.promoteFromOpportunity('opp_u_1_42', {
      userId: 'u_1',
      title: 'T',
      problemStatement: 'Problem statement long enough.',
      projectType: 'AD_HOC'
    });
    assert.equal(kaizen.sourceOpportunityId, 'opp_u_1_42');
  });

  test('sourceFrictionSignalIds is empty (not null)', () => {
    const { kaizen } = env.service.promoteFromOpportunity('opp_u_1_42', {
      userId: 'u_1',
      title: 'T',
      problemStatement: 'Problem statement long enough.',
      projectType: 'AD_HOC'
    });
    assert.deepEqual(kaizen.sourceFrictionSignalIds, []);
  });

  test('persists into bamx:v1:kaizens', () => {
    const { kaizen } = env.service.promoteFromOpportunity('opp_u_1_42', {
      userId: 'u_1',
      title: 'T',
      problemStatement: 'Problem statement long enough.',
      projectType: 'DMAIC'
    });
    const map = env.repo.read(KAIZENS_KEY);
    assert.ok(map[kaizen.id]);
    assert.equal(map[kaizen.id].sourceOpportunityId, 'opp_u_1_42');
  });

  test('emits KaizenPromoted with fromOpportunityId', () => {
    let captured = null;
    env.bus.subscribe(KaizenPromoted, (p) => { captured = p; });
    const { kaizen } = env.service.promoteFromOpportunity('opp_u_1_42', {
      userId: 'u_1',
      title: 'T',
      problemStatement: 'Problem statement long enough.',
      projectType: 'KAIZEN_EVENT'
    });
    assert.ok(captured);
    assert.equal(captured.kaizenId, kaizen.id);
    assert.equal(captured.fromOpportunityId, 'opp_u_1_42');
    assert.equal(captured.projectType, 'KAIZEN_EVENT');
    assert.deepEqual(captured.sourceFrictionSignalIds, []);
  });

  test('defaults missing projectType to AD_HOC', () => {
    const { kaizen } = env.service.promoteFromOpportunity('opp_u_1_42', {
      userId: 'u_1',
      title: 'T',
      problemStatement: 'Problem statement long enough.'
    });
    assert.equal(kaizen.projectType, 'AD_HOC');
  });

  test('defaults title to Untitled Kaizen when empty', () => {
    const { kaizen } = env.service.promoteFromOpportunity('opp_u_1_42', {
      userId: 'u_1',
      title: '',
      problemStatement: 'Problem statement long enough.',
      projectType: 'AD_HOC'
    });
    assert.equal(kaizen.title, 'Untitled Kaizen');
  });

  test('no baseline, no actions on a fresh DRAFT', () => {
    const { kaizen } = env.service.promoteFromOpportunity('opp_u_1_42', {
      userId: 'u_1',
      title: 'T',
      problemStatement: 'Problem statement long enough.',
      projectType: 'AD_HOC'
    });
    assert.equal(kaizen.baselineMetricId, null);
    assert.deepEqual(kaizen.actions, []);
    assert.equal(kaizen.goalStatement, '');
  });
});

describe('KaizenService.promoteFromOpportunity — guards', () => {
  let env;
  beforeEach(() => { env = buildEnv(); });

  test('throws INVALID_INPUT without opportunityId', () => {
    assert.throws(
      () => env.service.promoteFromOpportunity('', {
        userId: 'u_1',
        title: 'T',
        problemStatement: 'Problem statement long enough.'
      }),
      (e) => e.name === 'INVALID_INPUT'
    );
  });

  test('throws INVALID_INPUT without input object', () => {
    assert.throws(
      () => env.service.promoteFromOpportunity('opp_u_1_42'),
      (e) => e.name === 'INVALID_INPUT'
    );
  });

  test('throws INVALID_INPUT without userId', () => {
    assert.throws(
      () => env.service.promoteFromOpportunity('opp_u_1_42', {
        title: 'T',
        problemStatement: 'Problem statement long enough.'
      }),
      (e) => e.name === 'INVALID_INPUT'
    );
  });

  test('throws PROBLEM_STATEMENT_TOO_SHORT when < 10 chars', () => {
    assert.throws(
      () => env.service.promoteFromOpportunity('opp_u_1_42', {
        userId: 'u_1',
        title: 'T',
        problemStatement: 'short'
      }),
      (e) => e.name === 'PROBLEM_STATEMENT_TOO_SHORT'
    );
  });

  test('throws PROBLEM_STATEMENT_TOO_SHORT when missing', () => {
    assert.throws(
      () => env.service.promoteFromOpportunity('opp_u_1_42', {
        userId: 'u_1',
        title: 'T'
      }),
      (e) => e.name === 'PROBLEM_STATEMENT_TOO_SHORT'
    );
  });
});

describe('KaizenService existing promote — sourceOpportunityId initialized to null', () => {
  test('promote() from friction cluster sets sourceOpportunityId=null', () => {
    const env = buildEnv();
    // Seed a friction signal so promote() works.
    env.repo.write('bamx:v1:frictionSignals', {
      fs_1: {
        id: 'fs_1',
        reflectionId: 'r1',
        scheduledActivityId: 's1',
        userId: 'u_1',
        summary: 'meeting overload',
        tag: 'MEETING_LOAD',
        status: 'OPEN',
        kaizenId: null,
        capturedAt: '2026-04-20T10:00:00Z'
      }
    });
    // Stub the friction service — promote() just needs signals map lookup.
    const stubFriction = { /* just needs to be truthy */ };
    env.service.setFrictionService(stubFriction);
    const { kaizen } = env.service.promote({
      userId: 'u_1',
      fromFrictionClusterSignalIds: ['fs_1'],
      problemStatement: 'A proper length problem statement'
    });
    assert.equal(kaizen.sourceOpportunityId, null);
  });
});
