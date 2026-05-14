/**
 * Iter 38 Phase B — relaxConfigurable new tests.
 *
 * Covers:
 *   - AC4: relaxConfigurable preserves POST_DEEP_COMM under relaxation
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { relaxOnce } from '../../js/engine/relaxConfigurable.js';

function block(overrides = {}) {
  return {
    id: overrides.id ?? 'sa',
    catalogEntryId: overrides.catalogEntryId ?? 'cat',
    name: overrides.name ?? 'X',
    bucket: overrides.bucket ?? 'CI',
    plannedDurationMinutes: overrides.plannedDurationMinutes ?? 30,
    ...overrides
  };
}

// ---------------------------------------------------------------------------
// AC4: POST_DEEP_COMM is in PROTECTED set — never dropped by relaxOnce
// ---------------------------------------------------------------------------
describe('Iter 38 — AC4: POST_DEEP_COMM protected from relaxation', () => {
  test('POST_DEEP_COMM by slotKind is protected — relaxOnce returns null', () => {
    const placed = [
      block({
        id: 'post_deep',
        bucket: 'COMMUNICATION',
        catalogEntryId: 'gen_value_added_communication',
        slotKind: 'POST_DEEP_COMM',
        name: 'End-of-Deep-Cycles Communication',
        plannedDurationMinutes: 15
      })
    ];
    assert.equal(
      relaxOnce(placed, 'COMM_OVERPACKED'),
      null,
      'POST_DEEP_COMM should be protected — relaxOnce should return null'
    );
  });

  test('POST_DEEP_COMM by name is protected — relaxOnce returns null', () => {
    const placed = [
      block({
        id: 'post_deep_by_name',
        bucket: 'COMMUNICATION',
        catalogEntryId: 'gen_value_added_communication',
        name: 'End-of-Deep-Cycles Communication',
        plannedDurationMinutes: 15
      })
    ];
    assert.equal(
      relaxOnce(placed, 'COMM_OVERPACKED'),
      null,
      'POST_DEEP_COMM by name should be protected'
    );
  });

  test('when POST_DEEP_COMM is present with a relaxable CI block, CI block drops first', () => {
    const placed = [
      block({
        id: 'post_deep',
        bucket: 'COMMUNICATION',
        catalogEntryId: 'gen_value_added_communication',
        slotKind: 'POST_DEEP_COMM',
        name: 'End-of-Deep-Cycles Communication',
        plannedDurationMinutes: 15
      }),
      block({
        id: 'ci_low',
        bucket: 'CI',
        ciPriority: 15,
        name: 'Low-priority CI'
      })
    ];
    const step = relaxOnce(placed, 'OVER_CAPACITY');
    assert.ok(step, 'Expected a relaxation step');
    assert.equal(step.dropped.id, 'ci_low', 'CI block should drop first, not POST_DEEP_COMM');
  });
});
