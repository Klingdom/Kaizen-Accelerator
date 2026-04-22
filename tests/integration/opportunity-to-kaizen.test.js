/**
 * Integration test — Sprint 7.
 *
 * Exercises the full flow: OpportunityService.create → promote → DRAFT
 * Kaizen persisted with sourceOpportunityId = opportunity.id AND
 * opportunity.status = PROMOTED AND KaizenPromoted event carries
 * fromOpportunityId.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  OpportunityService,
  OPPORTUNITIES_KEY
} from '../../js/services/OpportunityService.js';
import {
  KaizenService,
  KAIZENS_KEY
} from '../../js/services/KaizenService.js';
import {
  OpportunityCreated,
  OpportunityPromoted,
  KaizenPromoted
} from '../../js/events/events.js';
import { LocalStorageRepository } from '../../js/persistence/LocalStorageRepository.js';
import { EventBus } from '../../js/events/EventBus.js';
import { ClockService } from '../../js/services/ClockService.js';
import { LocalStorageMock } from '../_helpers/localStorageMock.js';

const FROZEN_NOW = '2026-04-21T10:00:00Z';

function buildEnv() {
  const storage = new LocalStorageMock();
  const repo = new LocalStorageRepository({ storage });
  const bus = new EventBus();
  const clock = new ClockService({ now: () => FROZEN_NOW });
  const kaizenService = new KaizenService({ repo, bus, clock });
  const opportunityService = new OpportunityService({
    repo,
    bus,
    clock,
    kaizenService
  });
  return { opportunityService, kaizenService, repo, bus, clock };
}

describe('integration — opportunity-to-kaizen', () => {
  test('create → promote → DRAFT Kaizen with sourceOpportunityId', () => {
    const env = buildEnv();

    const events = [];
    env.bus.subscribe(OpportunityCreated, (p) => events.push({ type: 'OppCreated', payload: p }));
    env.bus.subscribe(OpportunityPromoted, (p) => events.push({ type: 'OppPromoted', payload: p }));
    env.bus.subscribe(KaizenPromoted, (p) => events.push({ type: 'KaizenPromoted', payload: p }));

    // Step 1: Create the opportunity.
    const opp = env.opportunityService.create({
      userId: 'u_phil',
      title: 'Reduce meeting thrash',
      problemStatement: 'Back-to-back meetings erode deep work capacity.',
      scope: 'In: recurring standups. Out: 1:1s.',
      proposedProjectType: 'DMAIC'
    });

    assert.equal(opp.status, 'INTAKE');
    assert.equal(opp.title, 'Reduce meeting thrash');
    assert.equal(opp.proposedProjectType, 'DMAIC');

    // Step 2: Promote the opportunity.
    const { opportunity, kaizen } = env.opportunityService.promote(opp.id);

    // Opportunity updated.
    assert.equal(opportunity.status, 'PROMOTED');
    assert.equal(opportunity.promotedKaizenId, kaizen.id);

    // Kaizen properties.
    assert.equal(kaizen.state, 'DRAFT');
    assert.equal(kaizen.title, 'Reduce meeting thrash');
    assert.equal(kaizen.problemStatement, 'Back-to-back meetings erode deep work capacity.');
    assert.equal(kaizen.projectType, 'DMAIC');
    assert.equal(kaizen.sourceOpportunityId, opp.id);
    assert.deepEqual(kaizen.sourceFrictionSignalIds, []);

    // Persistence: both records landed under bamx:v1:* keys.
    const oppsMap = env.repo.read(OPPORTUNITIES_KEY);
    const kaizensMap = env.repo.read(KAIZENS_KEY);
    assert.equal(oppsMap[opp.id].status, 'PROMOTED');
    assert.equal(oppsMap[opp.id].promotedKaizenId, kaizen.id);
    assert.equal(kaizensMap[kaizen.id].sourceOpportunityId, opp.id);

    // Events: OpportunityCreated, OpportunityPromoted, KaizenPromoted.
    const kaizenPromoted = events.find((e) => e.type === 'KaizenPromoted');
    assert.ok(kaizenPromoted);
    assert.equal(kaizenPromoted.payload.fromOpportunityId, opp.id);
    assert.deepEqual(kaizenPromoted.payload.sourceFrictionSignalIds, []);

    const oppCreated = events.find((e) => e.type === 'OppCreated');
    assert.ok(oppCreated);
    assert.equal(oppCreated.payload.opportunityId, opp.id);

    const oppPromoted = events.find((e) => e.type === 'OppPromoted');
    assert.ok(oppPromoted);
    assert.equal(oppPromoted.payload.kaizenId, kaizen.id);
  });

  test('promote is atomic: kaizen write happens before opportunity update', () => {
    // If kaizen creation threw, opp would remain INTAKE. We verify by
    // injecting a failing kaizenService.
    const storage = new LocalStorageMock();
    const repo = new LocalStorageRepository({ storage });
    const bus = new EventBus();
    const clock = new ClockService({ now: () => FROZEN_NOW });
    const failingKaizen = {
      promoteFromOpportunity: () => {
        const err = new Error('boom');
        err.name = 'FAKE_FAILURE';
        throw err;
      }
    };
    const opportunityService = new OpportunityService({
      repo,
      bus,
      clock,
      kaizenService: failingKaizen
    });
    const opp = opportunityService.create({
      userId: 'u_1',
      title: 'x y z',
      problemStatement: '1234567890abc',
      proposedProjectType: 'AD_HOC'
    });
    assert.throws(
      () => opportunityService.promote(opp.id),
      (e) => e.name === 'FAKE_FAILURE'
    );
    const after = opportunityService.get(opp.id);
    assert.equal(after.status, 'INTAKE', 'opportunity should NOT be updated on kaizen failure');
    assert.equal(after.promotedKaizenId, null);
  });

  test('defer then cannot promote', () => {
    const env = buildEnv();
    const opp = env.opportunityService.create({
      userId: 'u_1',
      title: 'deferred opp',
      problemStatement: 'A sufficiently long problem statement',
      proposedProjectType: 'AD_HOC'
    });
    env.opportunityService.defer(opp.id, { deferredUntil: '2026-06-01' });
    assert.throws(
      () => env.opportunityService.promote(opp.id),
      (e) => e.name === 'OPPORTUNITY_INVALID_STATE'
    );
  });

  test('multiple opportunities per user are independent', () => {
    const env = buildEnv();
    const o1 = env.opportunityService.create({
      userId: 'u_1',
      title: 'First',
      problemStatement: 'First problem statement that is long enough',
      proposedProjectType: 'AD_HOC'
    });
    // Shift clock for a distinct id.
    const clock2 = new ClockService({ now: () => '2026-04-21T11:00:00Z' });
    const svc2 = new OpportunityService({
      repo: env.repo,
      bus: env.bus,
      clock: clock2,
      kaizenService: env.kaizenService
    });
    const o2 = svc2.create({
      userId: 'u_1',
      title: 'Second',
      problemStatement: 'Second problem statement that is long enough',
      proposedProjectType: 'KAIZEN_EVENT'
    });
    assert.notEqual(o1.id, o2.id);
    const list = env.opportunityService.list({ userId: 'u_1' });
    assert.equal(list.length, 2);
  });
});
