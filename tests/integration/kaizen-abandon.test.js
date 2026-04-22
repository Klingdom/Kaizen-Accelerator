/**
 * Integration test — DRAFT Kaizen abandon loop.
 *
 * Promote an Opportunity → DRAFT → abandon → abandoned=true, state still
 * DRAFT (per ARCHITECTURE §3.3 invariant that abandoned Kaizens never
 * transition to CLOSED). Edit/promote attempts after abandon throw
 * KAIZEN_ABANDONED.
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { KaizenService, KAIZENS_KEY } from '../../js/services/KaizenService.js';
import { OpportunityService } from '../../js/services/OpportunityService.js';
import { KaizenAbandoned } from '../../js/events/events.js';
import { LocalStorageRepository } from '../../js/persistence/LocalStorageRepository.js';
import { EventBus } from '../../js/events/EventBus.js';
import { ClockService } from '../../js/services/ClockService.js';
import { LocalStorageMock } from '../_helpers/localStorageMock.js';

function buildEnv() {
  const storage = new LocalStorageMock();
  const repo = new LocalStorageRepository({ storage });
  const bus = new EventBus();
  const clock = new ClockService({ now: () => '2026-04-22T10:00:00Z' });
  const kaizenService = new KaizenService({ repo, bus, clock });
  const opportunityService = new OpportunityService({
    repo, bus, clock, kaizenService
  });
  return { repo, bus, clock, kaizenService, opportunityService };
}

describe('Integration — abandon a DRAFT Kaizen', () => {
  let env;
  beforeEach(() => { env = buildEnv(); });

  test('abandon flips flag but keeps state=DRAFT (never CLOSED)', () => {
    const opp = env.opportunityService.create({
      userId: 'u_1',
      title: 'Test opportunity',
      problemStatement: 'Problem text long enough.',
      proposedProjectType: 'AD_HOC'
    });
    const { kaizen } = env.opportunityService.promote(opp.id);
    const updated = env.kaizenService.abandon(kaizen.id, 'u_1', {
      reason: 'Deprioritized by leadership this quarter.'
    });
    assert.equal(updated.abandoned, true);
    assert.equal(updated.state, 'DRAFT');
    assert.notEqual(updated.state, 'CLOSED');
    assert.equal(updated.abandonedAt, '2026-04-22T10:00:00Z');

    // Persisted.
    const all = env.repo.read(KAIZENS_KEY);
    assert.equal(all[kaizen.id].abandoned, true);
    assert.equal(all[kaizen.id].state, 'DRAFT');
  });

  test('emits KaizenAbandoned', () => {
    const opp = env.opportunityService.create({
      userId: 'u_1',
      title: 'Test opportunity',
      problemStatement: 'Problem text long enough.',
      proposedProjectType: 'AD_HOC'
    });
    const { kaizen } = env.opportunityService.promote(opp.id);
    let captured = null;
    env.bus.subscribe(KaizenAbandoned, (p) => { captured = p; });
    env.kaizenService.abandon(kaizen.id, 'u_1', {
      reason: 'Enough words for reason min length check.'
    });
    assert.ok(captured);
    assert.equal(captured.kaizenId, kaizen.id);
    assert.equal(captured.userId, 'u_1');
  });

  test('editing an abandoned Kaizen throws KAIZEN_ABANDONED', () => {
    const opp = env.opportunityService.create({
      userId: 'u_1',
      title: 'Test opportunity',
      problemStatement: 'Problem text long enough.',
      proposedProjectType: 'AD_HOC'
    });
    const { kaizen } = env.opportunityService.promote(opp.id);
    env.kaizenService.abandon(kaizen.id, 'u_1', {
      reason: 'Out of scope for Q2 portfolio plan.'
    });
    assert.throws(
      () => env.kaizenService.addAction(kaizen.id, {
        name: 'x', ownerRef: 'u_1', dueDate: '2026-05-01'
      }),
      (e) => e.name === 'KAIZEN_ABANDONED'
    );
    assert.throws(
      () => env.kaizenService.setGoalStatement(kaizen.id, 'new goal'),
      (e) => e.name === 'KAIZEN_ABANDONED'
    );
  });

  test('cannot un-abandon', () => {
    const opp = env.opportunityService.create({
      userId: 'u_1',
      title: 'Test opportunity',
      problemStatement: 'Problem text long enough.',
      proposedProjectType: 'AD_HOC'
    });
    const { kaizen } = env.opportunityService.promote(opp.id);
    env.kaizenService.abandon(kaizen.id, 'u_1', {
      reason: 'Original reason value.'
    });
    assert.throws(
      () => env.kaizenService.abandon(kaizen.id, 'u_1', {
        reason: 'Second reason value.'
      }),
      (e) => e.name === 'KAIZEN_ABANDONED'
    );
  });
});
