/**
 * Integration test — full HARD RULE close loop.
 *
 * Sprint 8 demo path:
 *   create opportunity → promote → lockBaseline → markActionDone →
 *   startRemeasurement → captureRemeasurement → close → CLOSED
 *
 * Validates FSM transitions + closeKind derivation end-to-end.
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  KaizenService,
  KAIZENS_KEY,
  REMEASUREMENTS_KEY
} from '../../js/services/KaizenService.js';
import { OpportunityService } from '../../js/services/OpportunityService.js';
import {
  KaizenRemeasurementStarted,
  KaizenRemeasured,
  KaizenClosed
} from '../../js/events/events.js';
import { LocalStorageRepository } from '../../js/persistence/LocalStorageRepository.js';
import { EventBus } from '../../js/events/EventBus.js';
import { ClockService } from '../../js/services/ClockService.js';
import { LocalStorageMock } from '../_helpers/localStorageMock.js';

function buildEnv(initialNow = '2026-04-20T09:00:00Z') {
  const storage = new LocalStorageMock();
  const repo = new LocalStorageRepository({ storage });
  const bus = new EventBus();
  let currentNow = initialNow;
  const clock = new ClockService({ now: () => currentNow });
  const kaizenService = new KaizenService({ repo, bus, clock });
  const opportunityService = new OpportunityService({
    repo,
    bus,
    clock,
    kaizenService
  });
  return {
    repo,
    bus,
    clock,
    kaizenService,
    opportunityService,
    advance: (iso) => {
      currentNow = iso;
    }
  };
}

describe('Integration — full HARD RULE close loop', () => {
  let env;
  beforeEach(() => { env = buildEnv(); });

  test('SUCCESS path: target met → SUCCESS', () => {
    // 1. Create opportunity.
    const opp = env.opportunityService.create({
      userId: 'u_1',
      title: 'Cut meetings',
      problemStatement: 'Mornings destroyed by standups + check-ins.',
      proposedProjectType: 'AD_HOC'
    });
    assert.equal(opp.status, 'INTAKE');

    // 2. Promote.
    env.advance('2026-04-20T10:00:00Z');
    const { kaizen } = env.opportunityService.promote(opp.id);
    assert.equal(kaizen.state, 'DRAFT');
    assert.equal(kaizen.sourceOpportunityId, opp.id);

    // 3. Set goal, add an action.
    env.kaizenService.setGoalStatement(kaizen.id, 'Baseline 10 → target 5 meetings/wk');
    env.kaizenService.addAction(kaizen.id, {
      name: 'Block mornings',
      ownerRef: 'u_1',
      dueDate: '2026-04-30'
    });

    // 4. Lock baseline — transitions DRAFT → ACTIVE.
    env.advance('2026-04-20T11:00:00Z');
    env.kaizenService.lockBaseline(kaizen.id, {
      metricName: 'Meetings per week',
      unit: 'meetings',
      operationalDefinition: 'Count calendar meetings over 5 business days.',
      sampleSize: 4,
      method: 'Calendar extract',
      value: 10,
      metricDirection: 'lower_is_better',
      targetImprovement: -5
    });
    assert.equal(env.kaizenService.get(kaizen.id).state, 'ACTIVE');

    // 5. Mark action done.
    env.advance('2026-04-25T10:00:00Z');
    env.kaizenService.markActionDone(kaizen.id, 0);

    // 6. Start remeasurement — transitions ACTIVE → IN_REMEASUREMENT.
    env.advance('2026-04-27T10:00:00Z');
    let remeasStarted = null;
    env.bus.subscribe(KaizenRemeasurementStarted, (p) => { remeasStarted = p; });
    env.kaizenService.startRemeasurement(kaizen.id, 'u_1');
    assert.equal(env.kaizenService.get(kaizen.id).state, 'IN_REMEASUREMENT');
    assert.ok(remeasStarted);
    assert.equal(remeasStarted.kaizenId, kaizen.id);

    // 7. Capture remeasurement (5 meetings/wk — beats target of -5).
    env.advance('2026-04-30T10:00:00Z');
    let remeas = null;
    env.bus.subscribe(KaizenRemeasured, (p) => { remeas = p; });
    const { remeasurement } = env.kaizenService.captureRemeasurement(kaizen.id, 'u_1', {
      value: 5
    });
    assert.equal(remeasurement.deltaAbsolute, -5);
    assert.equal(remeasurement.beatsBaseline, true);
    assert.ok(remeas);
    assert.equal(remeas.beatsBaseline, true);

    // 8. Close — HARD RULE honored (remeasurement exists).
    env.advance('2026-04-30T11:00:00Z');
    let closed = null;
    env.bus.subscribe(KaizenClosed, (p) => { closed = p; });
    const closedK = env.kaizenService.close(kaizen.id, 'u_1', {
      lessonsLearned: 'Blocking mornings + batching comms was sufficient.'
    });
    assert.equal(closedK.state, 'CLOSED');
    assert.equal(closedK.closeKind, 'SUCCESS');
    assert.ok(closed);
    assert.equal(closed.closeKind, 'SUCCESS');

    // Invariants.
    const all = env.repo.read(KAIZENS_KEY);
    assert.equal(all[kaizen.id].state, 'CLOSED');
    assert.equal(all[kaizen.id].closeKind, 'SUCCESS');
    const rm = env.repo.read(REMEASUREMENTS_KEY);
    assert.ok(rm[closedK.remeasurementId]);
  });

  test('PARTIAL path: beats baseline but target not met', () => {
    const opp = env.opportunityService.create({
      userId: 'u_1',
      title: 'Cycle time',
      problemStatement: 'Tickets sit in review forever',
      proposedProjectType: 'AD_HOC'
    });
    const { kaizen } = env.opportunityService.promote(opp.id);
    env.kaizenService.setGoalStatement(kaizen.id, 'Reduce cycle time');
    env.kaizenService.addAction(kaizen.id, {
      name: 'x', ownerRef: 'u_1', dueDate: '2026-05-01'
    });
    env.kaizenService.lockBaseline(kaizen.id, {
      metricName: 'Cycle time',
      unit: 'days',
      operationalDefinition: 'Open to merge across last 30 tickets.',
      sampleSize: 30,
      method: 'Jira extract',
      value: 10,
      metricDirection: 'lower_is_better',
      targetImprovement: -5 // aim at 5 days
    });
    env.kaizenService.markActionDone(kaizen.id, 0);
    env.kaizenService.startRemeasurement(kaizen.id, 'u_1');
    env.kaizenService.captureRemeasurement(kaizen.id, 'u_1', { value: 8 }); // -2 delta
    const closed = env.kaizenService.close(kaizen.id, 'u_1', {
      lessonsLearned: 'Moved the needle but not enough. Try review rotation next.'
    });
    assert.equal(closed.closeKind, 'PARTIAL');
  });

  test('FAILED_HONEST path: no improvement', () => {
    const opp = env.opportunityService.create({
      userId: 'u_1',
      title: 'Adherence',
      problemStatement: 'Low adherence to deep work blocks',
      proposedProjectType: 'AD_HOC'
    });
    const { kaizen } = env.opportunityService.promote(opp.id);
    env.kaizenService.setGoalStatement(kaizen.id, 'Raise adherence');
    env.kaizenService.addAction(kaizen.id, {
      name: 'x', ownerRef: 'u_1', dueDate: '2026-05-01'
    });
    env.kaizenService.lockBaseline(kaizen.id, {
      metricName: 'Adherence',
      unit: '%',
      operationalDefinition: 'Minutes on-plan / minutes scheduled per week.',
      sampleSize: 5,
      method: 'Log extract',
      value: 70,
      metricDirection: 'higher_is_better'
    });
    env.kaizenService.markActionDone(kaizen.id, 0);
    env.kaizenService.startRemeasurement(kaizen.id, 'u_1');
    env.kaizenService.captureRemeasurement(kaizen.id, 'u_1', { value: 65 });
    const closed = env.kaizenService.close(kaizen.id, 'u_1', {
      lessonsLearned: 'No improvement. Meetings grew. Block length likely wrong.'
    });
    assert.equal(closed.closeKind, 'FAILED_HONEST');
  });

  test('Validated Kaizen surfaces in Portfolio after close', () => {
    const opp = env.opportunityService.create({
      userId: 'u_1',
      title: 'Test opportunity',
      problemStatement: 'Problem text long enough.',
      proposedProjectType: 'AD_HOC'
    });
    const { kaizen } = env.opportunityService.promote(opp.id);
    env.kaizenService.setGoalStatement(kaizen.id, 'g');
    env.kaizenService.addAction(kaizen.id, {
      name: 'x', ownerRef: 'u_1', dueDate: '2026-05-01'
    });
    env.kaizenService.lockBaseline(kaizen.id, {
      metricName: 'M',
      unit: 'u',
      operationalDefinition: 'Something measurable and definable here.',
      sampleSize: 10,
      method: 'method',
      value: 10
    });
    env.kaizenService.markActionDone(kaizen.id, 0);
    env.kaizenService.startRemeasurement(kaizen.id, 'u_1');
    env.kaizenService.captureRemeasurement(kaizen.id, 'u_1', { value: 15 });
    env.kaizenService.close(kaizen.id, 'u_1', {
      lessonsLearned: 'Enough characters to satisfy the minimum requirement.'
    });

    const closedList = env.kaizenService.listByState('u_1', 'CLOSED');
    assert.equal(closedList.length, 1);
    assert.equal(closedList[0].id, kaizen.id);
  });
});
