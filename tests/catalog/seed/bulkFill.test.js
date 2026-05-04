/**
 * Tests for /js/catalog/seed/bulkFill.js (E2-T5).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { applyBulkFill } from '../../../js/catalog/seed/bulkFill.js';
import { applyFillGaps } from '../../../js/catalog/seed/fillGaps.js';
import { parseSource50 } from '../../../js/catalog/seed/source50.js';
import { buildCeremoniesAndGenerics } from '../../../js/catalog/seed/ceremoniesAndGenerics.js';

describe('applyBulkFill — §E defaults land on every entry', () => {
  const drafts = [...parseSource50(), ...buildCeremoniesAndGenerics()];
  const afterFill = applyFillGaps(drafts);
  const final = applyBulkFill(afterFill);

  test('every entry has cadence, trigger, inputs, outputArtifact, participants populated', () => {
    for (const e of final) {
      assert.ok(e.cadence, `${e.id}.cadence missing`);
      assert.ok(e.trigger, `${e.id}.trigger missing`);
      // Iter 26: recovery_lunch has inputs:[] intentionally (no required inputs for lunch).
      if (e.id !== 'recovery_lunch') {
        assert.ok(Array.isArray(e.inputs) && e.inputs.length > 0, `${e.id}.inputs missing`);
      } else {
        assert.ok(Array.isArray(e.inputs), 'recovery_lunch.inputs must be an array');
      }
      assert.ok(e.outputArtifact, `${e.id}.outputArtifact missing`);
      assert.ok(Array.isArray(e.participants) && e.participants.length > 0, `${e.id}.participants missing`);
      assert.ok(Array.isArray(e.appliesToRoles) && e.appliesToRoles.length > 0, `${e.id}.appliesToRoles missing`);
    }
  });

  test('§E.1 cadence rule applied: #1,#2,#6 → CONTINUOUS', () => {
    for (const n of [1, 2, 6]) {
      const r = final.find((e) => e.activityNumber === n);
      assert.equal(r.cadence, 'CONTINUOUS');
    }
  });

  test('§E.1 cadence rule: #3,#5 → MONTHLY', () => {
    for (const n of [3, 5]) {
      const r = final.find((e) => e.activityNumber === n);
      assert.equal(r.cadence, 'MONTHLY');
    }
  });

  test('§E.1 cadence rule: #12 → EVERY_48H (PDCA)', () => {
    const r = final.find((e) => e.activityNumber === 12);
    assert.equal(r.cadence, 'EVERY_48H');
  });

  test('§E.1 cadence rule: #14 → DAILY (Time-blocking)', () => {
    const r = final.find((e) => e.activityNumber === 14);
    assert.equal(r.cadence, 'DAILY');
  });

  test('§E.1 cadence rule: DMAIC #20–#41 → EVENT_DRIVEN (except #38 Backlog = SPRINT per §D.6)', () => {
    for (let n = 20; n <= 41; n++) {
      if (n === 38) continue; // DMAIC Improvement Backlog is SPRINT-cadenced per §D.6
      const r = final.find((e) => e.activityNumber === n);
      assert.ok(r, `#${n} missing`);
      assert.equal(r.cadence, 'EVENT_DRIVEN', `#${n} cadence should be EVENT_DRIVEN`);
    }
    // #38 is the documented SPRINT exception.
    const r38 = final.find((e) => e.activityNumber === 38);
    assert.equal(r38.cadence, 'SPRINT');
  });

  test('§E.1 cadence rule: Kaizen #42–#50 → EVENT_DRIVEN', () => {
    for (let n = 42; n <= 50; n++) {
      const r = final.find((e) => e.activityNumber === n);
      assert.ok(r, `#${n} missing`);
      assert.equal(r.cadence, 'EVENT_DRIVEN', `#${n} cadence should be EVENT_DRIVEN`);
    }
  });

  test('§E.4 participants: CI personal tick rows → just Self', () => {
    for (const n of [1, 12, 13]) {
      const r = final.find((e) => e.activityNumber === n);
      assert.deepEqual(r.participants, ['Self']);
    }
  });

  test('§E.5 trigger: ON_SIGNAL rows get a signal-based trigger default', () => {
    const r = final.find((e) => e.activityNumber === 4);
    assert.equal(r.cadence, 'ON_SIGNAL');
    assert.match(r.trigger, /signal/i);
  });

  test('dependsOn initialized to [] on entries not in the DAG', () => {
    const r = final.find((e) => e.activityNumber === 1);
    assert.ok(Array.isArray(r.dependsOn));
    assert.equal(r.dependsOn.length, 0);
  });

  test('isNonOptional defaults to false on non-ceremony rows', () => {
    const r = final.find((e) => e.activityNumber === 1);
    assert.equal(r.isNonOptional, false);
  });

  test('§A/§B/§C/§D fills are preserved through bulkFill (no clobbering)', () => {
    const r20 = final.find((e) => e.activityNumber === 20);
    assert.equal(r20.cadence, 'EVENT_DRIVEN');
    assert.equal(r20.defaultDurationMinutes, 120);
    assert.ok(r20.procedure.length >= 8);
  });

  test('appliesToRoles default includes all 4 roles for non-ceremonies', () => {
    const r = final.find((e) => e.activityNumber === 1);
    assert.ok(r.appliesToRoles.includes('PRACTITIONER'));
    assert.ok(r.appliesToRoles.includes('FACILITATOR'));
    assert.ok(r.appliesToRoles.includes('LEADER'));
  });
});
