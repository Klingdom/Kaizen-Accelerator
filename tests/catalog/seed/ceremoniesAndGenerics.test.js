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

  test('produces exactly 11 entries (6 ceremonies + 5 generics)', () => {
    assert.equal(all.length, 11);
  });

  test('6 ceremony ids are all present', () => {
    const ids = new Set(all.map((e) => e.id));
    for (const id of Object.values(CEREMONY_IDS)) {
      assert.ok(ids.has(id), `missing ceremony id ${id}`);
    }
  });

  test('5 generic ids are all present (incl. Lessons Learned per §H.2 v0.3.1)', () => {
    const ids = new Set(all.map((e) => e.id));
    for (const id of Object.values(GENERIC_IDS)) {
      assert.ok(ids.has(id), `missing generic id ${id}`);
    }
    assert.ok(ids.has('gen_lessons_learned'));
  });

  test('every entry has every required field populated (no nulls on ceremony/generic)', () => {
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
      assert.ok(Array.isArray(e.inputs) && e.inputs.length > 0);
      assert.equal(typeof e.outputArtifact, 'object');
      assert.equal(typeof e.outputArtifact.name, 'string');
      assert.equal(typeof e.outputArtifact.schema, 'string');
      assert.equal(e.outputArtifact.required, true);
      assert.ok(Array.isArray(e.participants) && e.participants.length > 0);
      assert.ok(Array.isArray(e.procedure) && e.procedure.length > 0);
      assert.equal(typeof e.bucket, 'string');
      assert.equal(typeof e.isNonOptional, 'boolean');
      assert.ok(Array.isArray(e.dependsOn));
      assert.ok(Array.isArray(e.appliesToRoles) && e.appliesToRoles.length > 0);
      assert.equal(e.enabledByUser, true);
      assert.equal(e.version, 1);
    }
  });

  test('ceremonies land in COMMUNICATION bucket with focusArea=CEREMONY', () => {
    for (const id of Object.values(CEREMONY_IDS)) {
      const c = all.find((e) => e.id === id);
      assert.equal(c.bucket, 'COMMUNICATION', `${id} should be COMMUNICATION`);
      assert.equal(c.focusArea, 'CEREMONY');
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
});
