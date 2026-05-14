/**
 * Iter 38 Phase B — validateComposition new tests.
 *
 * Covers:
 *   - AC3: validateComposition requires POST_DEEP_COMM in valid compositions
 *   - DAILY_NON_OPTIONAL_NAMES includes 'End-of-Deep-Cycles Communication'
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  validateComposition,
  requiredNonOptionals,
  DAILY_NON_OPTIONAL_NAMES
} from '../../js/engine/validateComposition.js';

function act({ name = 'a', bucket = 'PROJECT', minutes = 60, slotKind } = {}) {
  const a = {
    id: `sa_${name}`,
    catalogEntryId: `cat_${name}`,
    name,
    bucket,
    plannedDurationMinutes: minutes
  };
  if (slotKind) a.slotKind = slotKind;
  return a;
}

/**
 * Full valid day per Iter 38 Phase B (COMM = 120 min including POST_DEEP_COMM).
 */
function validDayIter38() {
  return [
    act({ name: 'Daily Standup', bucket: 'COMMUNICATION', minutes: 15 }),
    act({ name: 'AM High-value Communication', bucket: 'COMMUNICATION', minutes: 60 }),
    act({ name: 'Post-lunch High-value Communication', bucket: 'COMMUNICATION', minutes: 30 }),
    act({ name: 'End-of-Deep-Cycles Communication', bucket: 'COMMUNICATION', minutes: 15 }),
    act({ name: 'Deep Work', bucket: 'PROJECT', minutes: 240 }),
    act({ name: 'CI A', bucket: 'CI', minutes: 105 }),
    act({ name: 'End-of-Activity Reflection', bucket: 'CI', minutes: 15 })
  ];
}

// ---------------------------------------------------------------------------
// AC3: POST_DEEP_COMM required
// ---------------------------------------------------------------------------
describe('Iter 38 — AC3: POST_DEEP_COMM required by validateComposition', () => {
  test('composition missing End-of-Deep-Cycles Communication → NON_OPTIONAL_MISSING', () => {
    const acts = validDayIter38().filter((a) => a.name !== 'End-of-Deep-Cycles Communication');
    const out = validateComposition({
      cycleType: 'DAILY',
      activities: acts,
      userDailyCapacityMinutes: 480,
      externalMinutesToday: 0
    });
    assert.equal(out.ok, false);
    assert.equal(out.failureCode, 'NON_OPTIONAL_MISSING');
    assert.ok(
      out.detail.missing.includes('End-of-Deep-Cycles Communication'),
      `missing should include POST_DEEP_COMM name, got: ${JSON.stringify(out.detail.missing)}`
    );
  });

  test('composition with all 5 non-optionals passes NON_OPTIONAL check', () => {
    const out = validateComposition({
      cycleType: 'DAILY',
      activities: validDayIter38(),
      userDailyCapacityMinutes: 480,
      externalMinutesToday: 0
    });
    assert.equal(out.ok, true);
    assert.equal(out.failureCode, null);
  });

  test('DAILY_NON_OPTIONAL_NAMES includes End-of-Deep-Cycles Communication', () => {
    assert.ok(
      DAILY_NON_OPTIONAL_NAMES.includes('End-of-Deep-Cycles Communication'),
      'End-of-Deep-Cycles Communication missing from DAILY_NON_OPTIONAL_NAMES'
    );
  });

  test('requiredNonOptionals returns End-of-Deep-Cycles Communication when absent', () => {
    const missing = requiredNonOptionals('DAILY', []);
    assert.ok(
      missing.includes('End-of-Deep-Cycles Communication'),
      `Expected End-of-Deep-Cycles Communication in missing, got: ${JSON.stringify(missing)}`
    );
  });
});
