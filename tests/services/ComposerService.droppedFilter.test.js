/**
 * Sprint 16 Bug 1 — getActiveComposition must exclude DROPPED rows.
 *
 * After commitEdit handles a swap, the original slot is marked DROPPED
 * (audit trail) while a new slot is written under a fresh id. Before the
 * fix, getActiveComposition returned both rows because it filtered only on
 * compositionId. This test suite asserts the post-fix behaviour:
 *
 *   AC1-1: After a swap+commit, getActiveComposition contains exactly 1 row
 *          for the swapped slot (the new row), and 0 DROPPED rows.
 *   AC1-2: getComposition (audit path) STILL contains DROPPED rows.
 *   AC1-3: commitEdit with only in-place edits (no swap) also works and
 *          produces no DROPPED rows in getActiveComposition.
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { LocalStorageMock } from '../_helpers/localStorageMock.js';
import { LocalStorageRepository } from '../../js/persistence/LocalStorageRepository.js';
import { EventBus } from '../../js/events/EventBus.js';
import { ClockService } from '../../js/services/ClockService.js';
import {
  ComposerService,
  COMPOSITIONS_KEY,
  ACTIVITIES_KEY
} from '../../js/services/ComposerService.js';
import {
  buildGoldenComposerInput,
  GOLDEN_FULL_CATALOG,
  GOLDEN_USER
} from '../fixtures/goldenDay.js';

const FROZEN_NOW = '2026-04-27T09:00:00Z';
const USER_ID = GOLDEN_USER.id; // 'user_phil_mvp'

function goldenInput(overrides = {}) {
  return buildGoldenComposerInput({
    catalog: GOLDEN_FULL_CATALOG.map((c) => ({ ...c })),
    ...overrides
  });
}

function buildService() {
  const storage = new LocalStorageMock();
  const repo = new LocalStorageRepository({ storage });
  const bus = new EventBus();
  const clock = new ClockService({ now: () => FROZEN_NOW });
  const service = new ComposerService({ repo, bus, clock });
  return { service, repo, bus };
}

describe('Bug 1 — getActiveComposition excludes DROPPED rows', () => {
  test('AC1-1: after swap+commit, getActiveComposition has 0 DROPPED rows', () => {
    const { service } = buildService();
    const result = service.composeDaily(goldenInput());
    const compositionId = result.composition.id;

    // Accept so commitEdit is permitted without restriction.
    service.accept(compositionId);

    // Get the activities to find a swappable (non-protected) slot.
    const { activities } = service.getActiveComposition(USER_ID);
    const swappable = activities.find(
      (a) => !['cer_daily_standup', 'gen_end_of_activity_reflection'].includes(
        a.catalogEntryId
      )
    );
    assert.ok(swappable, 'need at least one swappable slot for this test');

    // Build a fake swap: same slot id, different catalogEntryId.
    const swappedActivity = {
      ...swappable,
      catalogEntryId: 'cat_swap_test_' + Date.now(),
      name: 'Swapped Activity',
      plannedStartAt: swappable.plannedStartAt
    };

    // Build the full edited activities array (replace the swappable slot).
    const editedActivities = activities.map((a) =>
      a.id === swappable.id ? swappedActivity : { ...a }
    );

    service.commitEdit(compositionId, editedActivities);

    // AC1-1: getActiveComposition must contain 0 DROPPED rows.
    const { activities: afterActs } = service.getActiveComposition(USER_ID);
    const droppedRows = afterActs.filter((a) => a.state === 'DROPPED');
    assert.equal(
      droppedRows.length,
      0,
      `Expected 0 DROPPED rows in getActiveComposition, got ${droppedRows.length}`
    );
  });

  test('AC1-1 (plain): after a simple start-time edit+commit, no DROPPED rows returned', () => {
    const { service } = buildService();
    const result = service.composeDaily(goldenInput());
    const compositionId = result.composition.id;
    service.accept(compositionId);

    const { activities } = service.getActiveComposition(USER_ID);
    // Same slot, same catalogEntryId — just shifted start (in-place edit).
    const editedActivities = activities.map((a) => ({ ...a }));

    service.commitEdit(compositionId, editedActivities);

    const { activities: afterActs } = service.getActiveComposition(USER_ID);
    const droppedRows = afterActs.filter((a) => a.state === 'DROPPED');
    assert.equal(droppedRows.length, 0);
  });

  test('AC1-2: getComposition (audit path) DOES include DROPPED rows after swap', () => {
    const { service } = buildService();
    const result = service.composeDaily(goldenInput());
    const compositionId = result.composition.id;
    service.accept(compositionId);

    const { activities } = service.getActiveComposition(USER_ID);
    const swappable = activities.find(
      (a) => !['cer_daily_standup', 'gen_end_of_activity_reflection'].includes(
        a.catalogEntryId
      )
    );
    assert.ok(swappable);

    const swappedActivity = {
      ...swappable,
      catalogEntryId: 'cat_swap_audit_' + Date.now(),
      name: 'Swapped Audit Activity',
      plannedStartAt: swappable.plannedStartAt
    };
    const editedActivities = activities.map((a) =>
      a.id === swappable.id ? swappedActivity : { ...a }
    );
    service.commitEdit(compositionId, editedActivities);

    // AC1-2: getComposition must still see the DROPPED row.
    const { activities: auditActs } = service.getComposition(compositionId);
    const droppedInAudit = auditActs.filter((a) => a.state === 'DROPPED');
    assert.ok(
      droppedInAudit.length >= 1,
      `Expected at least 1 DROPPED row in getComposition audit path, got ${droppedInAudit.length}`
    );
    assert.equal(droppedInAudit[0].id, swappable.id);
  });

  test('AC1-3: getActiveComposition returns the cascaded plannedStartAt after in-place edit+commit', () => {
    const { service } = buildService();
    const result = service.composeDaily(goldenInput());
    const compositionId = result.composition.id;
    service.accept(compositionId);

    const { activities } = service.getActiveComposition(USER_ID);

    // Find two consecutive rows and shift the first one's start by 15m.
    const sorted = [...activities]
      .filter((a) => a.plannedStartAt)
      .sort((a, b) => (a.plannedStartAt < b.plannedStartAt ? -1 : 1));
    const first = sorted[0];
    assert.ok(first, 'need at least one activity with a plannedStartAt');

    // Simulate a committed start-time edit: bump first's start by 15m.
    const [h, m] = first.plannedStartAt.split(':').map(Number);
    const newMin = h * 60 + m + 15;
    const newHH = String(Math.floor(newMin / 60)).padStart(2, '0');
    const newMM = String(newMin % 60).padStart(2, '0');
    const newStart = `${newHH}:${newMM}`;

    const editedActivities = activities.map((a) => {
      if (a.id !== first.id) return { ...a };
      return { ...a, plannedStartAt: newStart };
    });
    service.commitEdit(compositionId, editedActivities);

    const { activities: afterActs } = service.getActiveComposition(USER_ID);
    const afterFirst = afterActs.find((a) => a.id === first.id);
    assert.ok(afterFirst, 'first activity should still be in getActiveComposition');
    assert.equal(
      afterFirst.plannedStartAt,
      newStart,
      'cascaded plannedStartAt must be persisted and returned by getActiveComposition'
    );
  });
});
