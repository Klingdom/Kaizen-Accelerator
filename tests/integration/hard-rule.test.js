/**
 * Integration test — the HARD RULE.
 *
 * "A Kaizen cannot be CLOSED without a captured Remeasurement."
 *
 * Concretely this means `KaizenService.close()` throws
 * `KAIZEN_CLOSE_REQUIRES_REMEASUREMENT` for:
 *   - ACTIVE Kaizen (no remeasurement yet)           — rejected by state check
 *   - IN_REMEASUREMENT with no Remeasurement row     — rejected by HARD RULE
 *   - DRAFT (before baseline lock)                   — rejected by state check
 *   - fresh promoteFromOpportunity (DRAFT)           — rejected by state check
 *
 * The HARD RULE is enforced at the SERVICE layer, not the UI. Even if the UI
 * allowed the click, the service must throw.
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { KaizenService, KAIZENS_KEY } from '../../js/services/KaizenService.js';
import { OpportunityService } from '../../js/services/OpportunityService.js';
import { LocalStorageRepository } from '../../js/persistence/LocalStorageRepository.js';
import { EventBus } from '../../js/events/EventBus.js';
import { ClockService } from '../../js/services/ClockService.js';
import { LocalStorageMock } from '../_helpers/localStorageMock.js';

function buildEnv() {
  const storage = new LocalStorageMock();
  const repo = new LocalStorageRepository({ storage });
  const bus = new EventBus();
  const clock = new ClockService({ now: () => '2026-04-23T10:00:00Z' });
  const kaizenService = new KaizenService({ repo, bus, clock });
  const opportunityService = new OpportunityService({
    repo, bus, clock, kaizenService
  });
  return { repo, bus, clock, kaizenService, opportunityService };
}

describe('HARD RULE — cannot close without a captured Remeasurement', () => {
  let env;
  beforeEach(() => { env = buildEnv(); });

  test('IN_REMEASUREMENT without captured row → KAIZEN_CLOSE_REQUIRES_REMEASUREMENT', () => {
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
      operationalDefinition: 'A reasonably long operational definition here.',
      sampleSize: 10,
      method: 'method',
      value: 10
    });
    env.kaizenService.startRemeasurement(kaizen.id, 'u_1');

    // HARD RULE check — no captureRemeasurement was called.
    assert.throws(
      () => env.kaizenService.close(kaizen.id, 'u_1', {
        lessonsLearned: 'At least 20 chars of lessons learned text present.'
      }),
      (e) => e.name === 'KAIZEN_CLOSE_REQUIRES_REMEASUREMENT'
    );

    // Kaizen must still be IN_REMEASUREMENT (no partial write).
    assert.equal(
      env.kaizenService.get(kaizen.id).state,
      'IN_REMEASUREMENT'
    );
  });

  test('ACTIVE → close() throws KAIZEN_NOT_IN_REMEASUREMENT (state gate)', () => {
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
      operationalDefinition: 'Sufficient operational definition text.',
      sampleSize: 10,
      method: 'method',
      value: 10
    });
    assert.throws(
      () => env.kaizenService.close(kaizen.id, 'u_1', {
        lessonsLearned: 'Something something twenty plus chars.'
      }),
      (e) => e.name === 'KAIZEN_NOT_IN_REMEASUREMENT'
    );
  });

  test('DRAFT → close() throws KAIZEN_NOT_IN_REMEASUREMENT (state gate)', () => {
    const opp = env.opportunityService.create({
      userId: 'u_1',
      title: 'Test opportunity',
      problemStatement: 'Problem text long enough.',
      proposedProjectType: 'AD_HOC'
    });
    const { kaizen } = env.opportunityService.promote(opp.id);
    assert.throws(
      () => env.kaizenService.close(kaizen.id, 'u_1', {
        lessonsLearned: 'Something something twenty plus chars.'
      }),
      (e) => e.name === 'KAIZEN_NOT_IN_REMEASUREMENT'
    );
  });

  test('attempted close of non-existent kaizen → KAIZEN_NOT_FOUND', () => {
    assert.throws(
      () => env.kaizenService.close('nope', 'u_1', {
        lessonsLearned: 'Something something twenty plus chars.'
      }),
      (e) => e.name === 'KAIZEN_NOT_FOUND'
    );
  });

  test('MACHINE-READABLE error has name + detail', () => {
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
      operationalDefinition: 'Sufficient operational definition text.',
      sampleSize: 10,
      method: 'method',
      value: 10
    });
    env.kaizenService.startRemeasurement(kaizen.id, 'u_1');
    try {
      env.kaizenService.close(kaizen.id, 'u_1', {
        lessonsLearned: 'At least 20 chars of lessons learned here.'
      });
      assert.fail('expected close to throw');
    } catch (err) {
      assert.equal(err.name, 'KAIZEN_CLOSE_REQUIRES_REMEASUREMENT');
      assert.equal(err.kaizenId, kaizen.id);
    }
  });
});
