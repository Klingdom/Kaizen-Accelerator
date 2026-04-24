/**
 * Sprint 11 P1-T1 — richer Opportunity intake fields
 * (currentState / desiredState / primaryStakeholder).
 *
 * Covers:
 *   - create() accepts the 3 optional fields and validates length.
 *   - create() treats absent / null / empty-string as null (no write).
 *   - update() allows modifying the 3 fields while status=INTAKE.
 *   - promote() copies the 3 fields onto the created Kaizen.
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { LocalStorageMock } from '../_helpers/localStorageMock.js';
import { ClockService } from '../../js/services/ClockService.js';
import { EventBus } from '../../js/events/EventBus.js';
import {
  OpportunityService,
  OPPORTUNITIES_KEY,
  STATE_FIELD_MIN_LENGTH,
  STATE_FIELD_MAX_LENGTH,
  STAKEHOLDER_MIN_LENGTH,
  STAKEHOLDER_MAX_LENGTH
} from '../../js/services/OpportunityService.js';
import { KaizenService, KAIZENS_KEY } from '../../js/services/KaizenService.js';
import { LocalStorageRepository } from '../../js/persistence/LocalStorageRepository.js';

const FROZEN = '2026-04-22T09:00:00Z';
const USER = 'user_test';

function makeEnv() {
  const storage = new LocalStorageMock();
  const repo = new LocalStorageRepository({ storage });
  const bus = new EventBus();
  const clock = new ClockService({ now: () => FROZEN });
  const kaizenService = new KaizenService({ repo, bus, clock });
  const service = new OpportunityService({ repo, bus, clock, kaizenService });
  return { storage, repo, bus, clock, service, kaizenService };
}

function makeValidInput(overrides = {}) {
  return {
    userId: USER,
    title: 'A valid title',
    problemStatement: 'A reasonable problem description of enough length.',
    scope: null,
    proposedProjectType: 'AD_HOC',
    ...overrides
  };
}

describe('OpportunityService.create — richer intake fields', () => {
  test('accepts currentState within bounds', () => {
    const { service } = makeEnv();
    const body = 'Currently manual, error-prone, takes 30+ minutes per run.';
    const opp = service.create(makeValidInput({ currentState: body }));
    assert.equal(opp.currentState, body);
  });

  test('accepts desiredState within bounds', () => {
    const { service } = makeEnv();
    const body = 'Automated in under 3 minutes with full audit trail.';
    const opp = service.create(makeValidInput({ desiredState: body }));
    assert.equal(opp.desiredState, body);
  });

  test('accepts primaryStakeholder within bounds', () => {
    const { service } = makeEnv();
    const opp = service.create(makeValidInput({ primaryStakeholder: 'Ops Team Lead' }));
    assert.equal(opp.primaryStakeholder, 'Ops Team Lead');
  });

  test('missing currentState → null', () => {
    const { service } = makeEnv();
    const opp = service.create(makeValidInput());
    assert.equal(opp.currentState, null);
  });

  test('empty-string currentState → null', () => {
    const { service } = makeEnv();
    const opp = service.create(makeValidInput({ currentState: '' }));
    assert.equal(opp.currentState, null);
  });

  test('explicit null primaryStakeholder → null', () => {
    const { service } = makeEnv();
    const opp = service.create(makeValidInput({ primaryStakeholder: null }));
    assert.equal(opp.primaryStakeholder, null);
  });

  test('currentState below min throws STATE_FIELD_LENGTH', () => {
    const { service } = makeEnv();
    const short = 'x'.repeat(STATE_FIELD_MIN_LENGTH - 1);
    assert.throws(
      () => service.create(makeValidInput({ currentState: short })),
      /STATE_FIELD_LENGTH/
    );
  });

  test('desiredState above max throws STATE_FIELD_LENGTH', () => {
    const { service } = makeEnv();
    const long = 'x'.repeat(STATE_FIELD_MAX_LENGTH + 1);
    assert.throws(
      () => service.create(makeValidInput({ desiredState: long })),
      /STATE_FIELD_LENGTH/
    );
  });

  test('primaryStakeholder below min throws STAKEHOLDER_LENGTH', () => {
    const { service } = makeEnv();
    const short = 'x'.repeat(STAKEHOLDER_MIN_LENGTH - 1);
    assert.throws(
      () => service.create(makeValidInput({ primaryStakeholder: short })),
      /STAKEHOLDER_LENGTH/
    );
  });

  test('primaryStakeholder above max throws STAKEHOLDER_LENGTH', () => {
    const { service } = makeEnv();
    const long = 'x'.repeat(STAKEHOLDER_MAX_LENGTH + 1);
    assert.throws(
      () => service.create(makeValidInput({ primaryStakeholder: long })),
      /STAKEHOLDER_LENGTH/
    );
  });

  test('non-string currentState throws INVALID_INPUT', () => {
    const { service } = makeEnv();
    assert.throws(
      () => service.create(makeValidInput({ currentState: 123 })),
      /INVALID_INPUT/
    );
  });

  test('non-string primaryStakeholder throws INVALID_INPUT', () => {
    const { service } = makeEnv();
    assert.throws(
      () => service.create(makeValidInput({ primaryStakeholder: {} })),
      /INVALID_INPUT/
    );
  });
});

describe('OpportunityService.update — richer intake fields mutable while INTAKE', () => {
  test('update sets currentState', () => {
    const { service } = makeEnv();
    const opp = service.create(makeValidInput());
    const body = 'Updated current-state description at acceptable length.';
    const next = service.update(opp.id, { currentState: body });
    assert.equal(next.currentState, body);
  });

  test('update sets desiredState', () => {
    const { service } = makeEnv();
    const opp = service.create(makeValidInput());
    const body = 'Updated desired-state description at acceptable length.';
    const next = service.update(opp.id, { desiredState: body });
    assert.equal(next.desiredState, body);
  });

  test('update sets primaryStakeholder', () => {
    const { service } = makeEnv();
    const opp = service.create(makeValidInput());
    const next = service.update(opp.id, { primaryStakeholder: 'New Owner' });
    assert.equal(next.primaryStakeholder, 'New Owner');
  });

  test('update clears currentState via null', () => {
    const { service } = makeEnv();
    const opp = service.create(makeValidInput({
      currentState: 'Initial current state that fits bounds.'
    }));
    const next = service.update(opp.id, { currentState: null });
    assert.equal(next.currentState, null);
  });

  test('update rejects too-short currentState', () => {
    const { service } = makeEnv();
    const opp = service.create(makeValidInput());
    assert.throws(
      () => service.update(opp.id, { currentState: 'x' }),
      /STATE_FIELD_LENGTH/
    );
  });
});

describe('OpportunityService.promote — copies richer fields onto the Kaizen', () => {
  test('currentState lands on the created Kaizen', () => {
    const { service, repo } = makeEnv();
    const body = 'Manual process takes 30 minutes, error-prone in 1/10 runs.';
    const opp = service.create(makeValidInput({ currentState: body }));
    const { kaizen } = service.promote(opp.id);
    assert.equal(kaizen.currentState, body);
    // Also assert the stored Kaizen reflects the field.
    const stored = (repo.read(KAIZENS_KEY) ?? {})[kaizen.id];
    assert.equal(stored.currentState, body);
  });

  test('desiredState lands on the created Kaizen', () => {
    const { service } = makeEnv();
    const body = 'Target: automate end-to-end in <3 minutes with 100% trace.';
    const opp = service.create(makeValidInput({ desiredState: body }));
    const { kaizen } = service.promote(opp.id);
    assert.equal(kaizen.desiredState, body);
  });

  test('primaryStakeholder lands on the created Kaizen', () => {
    const { service } = makeEnv();
    const opp = service.create(makeValidInput({ primaryStakeholder: 'Ops Lead' }));
    const { kaizen } = service.promote(opp.id);
    assert.equal(kaizen.primaryStakeholder, 'Ops Lead');
  });

  test('all three fields null on Kaizen when Opportunity had none', () => {
    const { service } = makeEnv();
    const opp = service.create(makeValidInput());
    const { kaizen } = service.promote(opp.id);
    assert.equal(kaizen.currentState, null);
    assert.equal(kaizen.desiredState, null);
    assert.equal(kaizen.primaryStakeholder, null);
  });

  test('promote does not break when Kaizen typedef lacks the fields', () => {
    // Sanity: a promoted Kaizen should still have all the legacy fields.
    const { service } = makeEnv();
    const opp = service.create(makeValidInput({ primaryStakeholder: 'Owner' }));
    const { kaizen } = service.promote(opp.id);
    assert.equal(kaizen.state, 'DRAFT');
    assert.equal(kaizen.projectType, 'AD_HOC');
    assert.equal(kaizen.sourceOpportunityId, opp.id);
  });
});

describe('OpportunityIntakeForm shape (sanity) — fields render through', () => {
  test('stored opportunity persists the 3 new fields', () => {
    const { service, repo } = makeEnv();
    const opp = service.create(makeValidInput({
      currentState: 'Current state copy of acceptable length.',
      desiredState: 'Desired state copy of acceptable length.',
      primaryStakeholder: 'Primary Stakeholder Name'
    }));
    const stored = (repo.read(OPPORTUNITIES_KEY) ?? {})[opp.id];
    assert.equal(stored.currentState, 'Current state copy of acceptable length.');
    assert.equal(stored.desiredState, 'Desired state copy of acceptable length.');
    assert.equal(stored.primaryStakeholder, 'Primary Stakeholder Name');
  });
});
