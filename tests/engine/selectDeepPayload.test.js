/**
 * Tests for /js/engine/selectDeepPayload.js (E3-T3 step 5).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  selectDeepPayload,
  eligibleDmaicPayloadSteps,
  pickHighestPriority,
  findGenericDeep
} from '../../js/engine/selectDeepPayload.js';

function entry(overrides = {}) {
  return {
    id: overrides.id ?? 'cat',
    activityNumber: overrides.activityNumber ?? null,
    name: overrides.name ?? 'Entry',
    bucket: 'PROJECT',
    defaultDurationMinutes: 120,
    dependsOn: [],
    projectTypeBinding: null,
    phaseBinding: null,
    appliesToRoles: [],
    enabledByUser: true,
    isNonOptional: false,
    ...overrides
  };
}

function genericDeep() {
  return entry({ id: 'gen_deep_work_project', name: 'Deep Work — Project Task (generic)' });
}

describe('selectDeepPayload — no active Kaizen', () => {
  test('returns generic Deep Work when activeKaizen is null', () => {
    const input = { activeKaizen: null, catalog: [genericDeep()] };
    const result = selectDeepPayload(input);
    assert.equal(result.id, 'gen_deep_work_project');
  });

  test('returns null when catalog has no generic Deep', () => {
    const input = { activeKaizen: null, catalog: [] };
    assert.equal(selectDeepPayload(input), null);
  });
});

describe('selectDeepPayload — active Kaizen DAG walk', () => {
  test('returns the next DMAIC step whose prereqs are all closed', () => {
    const step20 = entry({
      id: 'cat_20_charter',
      activityNumber: 20,
      name: 'Charter',
      projectTypeBinding: 'DMAIC',
      dependsOn: []
    });
    const step21 = entry({
      id: 'cat_21_sipoc',
      activityNumber: 21,
      name: 'SIPOC',
      projectTypeBinding: 'DMAIC',
      dependsOn: ['cat_20_charter']
    });
    const kaizen = { id: 'k1', projectType: 'DMAIC', phase: null };
    const closedSA = [
      { linkedKaizenId: 'k1', catalogEntryId: 'cat_20_charter', state: 'CLOSED' }
    ];
    const input = {
      activeKaizen: kaizen,
      catalog: [step20, step21, genericDeep()],
      scheduledActivities: closedSA
    };
    const result = selectDeepPayload(input);
    assert.equal(result.id, 'cat_21_sipoc');
  });

  test('falls back to generic Deep when all DMAIC steps closed', () => {
    const step20 = entry({
      id: 'cat_20_charter',
      activityNumber: 20,
      name: 'Charter',
      projectTypeBinding: 'DMAIC'
    });
    const kaizen = { id: 'k1', projectType: 'DMAIC' };
    const closedSA = [
      { linkedKaizenId: 'k1', catalogEntryId: 'cat_20_charter', state: 'CLOSED' }
    ];
    const input = {
      activeKaizen: kaizen,
      catalog: [step20, genericDeep()],
      scheduledActivities: closedSA
    };
    const result = selectDeepPayload(input);
    assert.equal(result.id, 'gen_deep_work_project');
  });

  test('uses nextStepActivityNumber hint as fallback when DAG empty', () => {
    const step34 = entry({
      id: 'cat_34_cause_and_effect',
      activityNumber: 34,
      name: 'Cause & Effect Matrix',
      // No projectTypeBinding — DAG filter yields nothing.
      projectTypeBinding: null
    });
    const kaizen = {
      id: 'k1',
      projectType: 'DMAIC',
      phase: null,
      nextStepActivityNumber: 34
    };
    const input = {
      activeKaizen: kaizen,
      catalog: [step34, genericDeep()],
      scheduledActivities: []
    };
    const result = selectDeepPayload(input);
    assert.equal(result.id, 'cat_34_cause_and_effect');
  });
});

describe('eligibleDmaicPayloadSteps — DAG + binding filter', () => {
  test('filters by projectTypeBinding', () => {
    const dmaic = entry({ id: 'dmaic_x', projectTypeBinding: 'DMAIC' });
    const other = entry({ id: 'other_y', projectTypeBinding: 'KAIZEN_EVENT' });
    const kaizen = { id: 'k', projectType: 'DMAIC' };
    const result = eligibleDmaicPayloadSteps(kaizen, [dmaic, other], []);
    assert.equal(result.length, 1);
    assert.equal(result[0].id, 'dmaic_x');
  });

  test('projectTypeBinding may be an array — contains check works', () => {
    const dual = entry({
      id: 'dual',
      projectTypeBinding: ['KAIZEN_EVENT', 'KAIZEN_EVENT_90D']
    });
    const kaizen = { id: 'k', projectType: 'KAIZEN_EVENT_90D', phase: null };
    const result = eligibleDmaicPayloadSteps(kaizen, [dual], []);
    assert.equal(result.length, 1);
  });

  test('filters by phaseBinding when set', () => {
    const phase1 = entry({
      id: 'p1',
      projectTypeBinding: 'KAIZEN_ACCELERATOR_30D',
      phaseBinding: 'PHASE_1'
    });
    const phase3 = entry({
      id: 'p3',
      projectTypeBinding: 'KAIZEN_ACCELERATOR_30D',
      phaseBinding: 'PHASE_3'
    });
    const kaizen = { id: 'k', projectType: 'KAIZEN_ACCELERATOR_30D', phase: 'PHASE_1' };
    const result = eligibleDmaicPayloadSteps(kaizen, [phase1, phase3], []);
    assert.equal(result.length, 1);
    assert.equal(result[0].id, 'p1');
  });

  test('excludes steps whose prereqs are not closed', () => {
    const step = entry({
      id: 's1',
      projectTypeBinding: 'DMAIC',
      dependsOn: ['prereq_a']
    });
    const kaizen = { id: 'k', projectType: 'DMAIC' };
    assert.equal(eligibleDmaicPayloadSteps(kaizen, [step], []).length, 0);
  });

  test('excludes already-closed steps', () => {
    const step = entry({ id: 's1', projectTypeBinding: 'DMAIC' });
    const kaizen = { id: 'k', projectType: 'DMAIC' };
    const sas = [{ linkedKaizenId: 'k', catalogEntryId: 's1', state: 'CLOSED' }];
    assert.equal(eligibleDmaicPayloadSteps(kaizen, [step], sas).length, 0);
  });
});

describe('pickHighestPriority — deterministic tiebreak chain', () => {
  test('phase match wins over activity number', () => {
    const a = entry({ id: 'a', activityNumber: 30 }); // MEASURE
    const b = entry({ id: 'b', activityNumber: 25 }); // MEASURE
    const c = entry({ id: 'c', activityNumber: 21 }); // DEFINE
    const pick = pickHighestPriority([c, a, b], 'MEASURE', []);
    // Both a and b are MEASURE; a=30 > b=25, so b wins by activityNumber ASC.
    assert.equal(pick.id, 'b');
  });

  test('activity number ASC when phases all match', () => {
    const a = entry({ id: 'a', activityNumber: 30 });
    const b = entry({ id: 'b', activityNumber: 22 });
    const pick = pickHighestPriority([a, b], null, []);
    assert.equal(pick.id, 'b');
  });

  test('id ASC when activity numbers equal (or absent)', () => {
    const a = entry({ id: 'z_a' });
    const b = entry({ id: 'a_b' });
    const pick = pickHighestPriority([a, b], null, []);
    assert.equal(pick.id, 'a_b');
  });

  test('returns null for empty', () => {
    assert.equal(pickHighestPriority([], 'DEFINE', []), null);
  });
});

describe('findGenericDeep', () => {
  test('returns gen_deep_work_project by id', () => {
    const g = genericDeep();
    assert.equal(findGenericDeep([g]).id, 'gen_deep_work_project');
  });

  test('returns null when absent', () => {
    assert.equal(findGenericDeep([]), null);
  });
});
