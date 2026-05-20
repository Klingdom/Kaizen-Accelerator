/**
 * Tests for /js/catalog/seed/ceremoniesAndGenerics.js (E2-T3).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  buildCeremoniesAndGenerics,
  CEREMONY_IDS,
  GENERIC_IDS
} from '../../../js/catalog/seed/ceremoniesAndGenerics.js';

describe('buildCeremoniesAndGenerics — sizes and shape', () => {
  const all = buildCeremoniesAndGenerics();

  test('produces exactly 16 entries (6 ceremonies + 10 generics incl. Iter 26 recovery_lunch + Phase 1 +4)', () => {
    assert.equal(all.length, 16);
  });

  test('6 ceremony ids are all present', () => {
    const ids = new Set(all.map((e) => e.id));
    for (const id of Object.values(CEREMONY_IDS)) {
      assert.ok(ids.has(id), `missing ceremony id ${id}`);
    }
  });

  test('10 generic ids are all present (incl. Lessons Learned + Iter 26 recovery_lunch + Phase 1 +4)', () => {
    const ids = new Set(all.map((e) => e.id));
    for (const id of Object.values(GENERIC_IDS)) {
      assert.ok(ids.has(id), `missing generic id ${id}`);
    }
    assert.ok(ids.has('gen_lessons_learned'));
    assert.ok(ids.has('recovery_lunch'), 'Iter 26: recovery_lunch must be present');
  });

  test('every entry has every required field populated (no nulls on ceremony/generic; bucket null allowed for recovery_lunch)', () => {
    for (const e of all) {
      assert.equal(typeof e.id, 'string');
      assert.equal(e.activityNumber, null);
      assert.equal(typeof e.name, 'string');
      assert.ok(e.name.length > 0);
      assert.equal(typeof e.focusArea, 'string');
      assert.equal(typeof e.defaultDurationMinutes, 'number');
      assert.ok(e.defaultDurationMinutes > 0);
      assert.equal(typeof e.cadence, 'string');
      assert.equal(typeof e.trigger, 'string');
      // recovery_lunch has inputs:[] (no inputs for a lunch break)
      if (e.id !== 'recovery_lunch') {
        assert.ok(Array.isArray(e.inputs) && e.inputs.length > 0, `${e.id} inputs empty`);
      } else {
        assert.ok(Array.isArray(e.inputs), 'recovery_lunch inputs must be an array');
      }
      assert.equal(typeof e.outputArtifact, 'object');
      assert.equal(typeof e.outputArtifact.name, 'string');
      assert.equal(typeof e.outputArtifact.schema, 'string');
      // recovery_lunch has outputArtifact.required=false (no artifact produced).
      // All other entries must have required=true.
      if (e.id !== 'recovery_lunch') {
        assert.equal(e.outputArtifact.required, true, `${e.id} outputArtifact.required must be true`);
      } else {
        assert.equal(e.outputArtifact.required, false, 'recovery_lunch outputArtifact.required must be false');
      }
      assert.ok(Array.isArray(e.participants) && e.participants.length > 0);
      assert.ok(Array.isArray(e.procedure) && e.procedure.length > 0);
      // recovery_lunch has bucket===null (capacity-neutral sentinel).
      if (e.id !== 'recovery_lunch') {
        assert.equal(typeof e.bucket, 'string', `${e.id} bucket must be a string`);
      } else {
        assert.equal(e.bucket, null, 'recovery_lunch bucket must be null');
      }
      assert.equal(typeof e.isNonOptional, 'boolean');
      assert.ok(Array.isArray(e.dependsOn));
      assert.ok(Array.isArray(e.appliesToRoles) && e.appliesToRoles.length > 0);
      assert.equal(e.enabledByUser, true);
      assert.equal(e.version, 1);
    }
  });

  test('ceremonies carry focusArea=CEREMONY and correct bucket per 2026-04-22 reclassification', () => {
    // Daily Standup + Mid-Sprint Review remain COMM (live checkpoint rhythm).
    // Quarterly Planning + Sprint Planning/Review/Retro moved to CI.
    const expectedBucket = {
      [CEREMONY_IDS.DAILY_STANDUP]: 'COMMUNICATION',
      [CEREMONY_IDS.MID_SPRINT_REVIEW]: 'COMMUNICATION',
      [CEREMONY_IDS.QUARTERLY_PLANNING]: 'CI',
      [CEREMONY_IDS.SPRINT_PLANNING]: 'CI',
      [CEREMONY_IDS.SPRINT_REVIEW]: 'CI',
      [CEREMONY_IDS.SPRINT_RETROSPECTIVE]: 'CI'
    };
    for (const id of Object.values(CEREMONY_IDS)) {
      const c = all.find((e) => e.id === id);
      assert.equal(c.focusArea, 'CEREMONY');
      assert.equal(c.bucket, expectedBucket[id], `${id} should be ${expectedBucket[id]}`);
    }
  });

  test('Sprint-ceremonies + Daily Standup flagged isNonOptional=true', () => {
    const non = [
      CEREMONY_IDS.DAILY_STANDUP,
      CEREMONY_IDS.SPRINT_PLANNING,
      CEREMONY_IDS.MID_SPRINT_REVIEW,
      CEREMONY_IDS.SPRINT_REVIEW,
      CEREMONY_IDS.SPRINT_RETROSPECTIVE
    ];
    for (const id of non) {
      const c = all.find((e) => e.id === id);
      assert.equal(c.isNonOptional, true, `${id} should be non-optional`);
    }
  });

  test('Quarterly Planning is NOT non-optional (manual-only in MVP)', () => {
    const c = all.find((e) => e.id === CEREMONY_IDS.QUARTERLY_PLANNING);
    assert.equal(c.isNonOptional, false);
  });

  test('Deep Work generic lives in PROJECT bucket', () => {
    const d = all.find((e) => e.id === GENERIC_IDS.DEEP_GENERIC);
    assert.equal(d.bucket, 'PROJECT');
    assert.equal(d.focusArea, 'DEEP_WORK');
  });

  test('Value-Added Communication generic lives in COMMUNICATION bucket', () => {
    const c = all.find((e) => e.id === GENERIC_IDS.COMM_GENERIC);
    assert.equal(c.bucket, 'COMMUNICATION');
  });

  test('End-of-Activity Reflection + Weekly Reflection + Lessons Learned land in CI and are non-optional', () => {
    for (const id of [
      GENERIC_IDS.END_OF_ACTIVITY_REFLECTION,
      GENERIC_IDS.WEEKLY_REFLECTION,
      GENERIC_IDS.LESSONS_LEARNED
    ]) {
      const g = all.find((e) => e.id === id);
      assert.equal(g.bucket, 'CI');
      assert.equal(g.isNonOptional, true);
    }
  });

  test('all ids are unique', () => {
    const ids = all.map((e) => e.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  test('Lessons Learned carries Kaizen-close-invariant metadata (schema=DOCUMENT, required=true)', () => {
    const ll = all.find((e) => e.id === GENERIC_IDS.LESSONS_LEARNED);
    assert.equal(ll.outputArtifact.schema, 'DOCUMENT');
    assert.equal(ll.outputArtifact.required, true);
  });

  // --- Iter 26: recovery_lunch specific assertions ---

  test('Iter 26: recovery_lunch exists with id=recovery_lunch', () => {
    const lunch = all.find((e) => e.id === GENERIC_IDS.LUNCH);
    assert.ok(lunch, 'recovery_lunch must exist in buildCeremoniesAndGenerics()');
    assert.equal(lunch.id, 'recovery_lunch');
  });

  test('Iter 26: recovery_lunch has correct fields (AC1, AC8, AC14, AC15)', () => {
    const lunch = all.find((e) => e.id === 'recovery_lunch');
    assert.equal(lunch.name, 'Lunch');
    // AC15: 30 min (Phil directive), NOT the architect original 60
    assert.equal(lunch.defaultDurationMinutes, 30, 'AC15: duration must be 30 min');
    assert.equal(lunch.defaultStart, '12:00', 'AC1: default start must be 12:00');
    // AC8: lunch is optional (skippable) and not an anchor
    assert.equal(lunch.isNonOptional, false, 'AC8: lunch must be skippable');
    assert.equal(lunch.isAnchor, undefined, 'isAnchor is false (not stored as explicit true)');
    // AC14: no artifact required
    assert.equal(lunch.outputArtifact.required, false, 'AC14: outputArtifact.required must be false');
    // Capacity-neutral sentinel
    assert.equal(lunch.bucket, null, 'AC2: bucket must be null (capacity-neutral)');
    assert.equal(lunch.slotKind, 'LUNCH');
    assert.equal(lunch.cadence, 'DAILY');
    assert.equal(lunch.enabledByUser, true);
  });
});
