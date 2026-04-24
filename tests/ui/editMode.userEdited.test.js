/**
 * Sprint 15 W4 — editMode helpers stamp `userEdited: true` onto the
 * changed slot so the renderer can use the saturated tone.
 *
 * Helpers covered:
 *   - applySwap            (replacement comes from activityFromCatalogEntry)
 *   - applyAdd             (fresh slot from activityFromCatalogEntry)
 *   - applyDurationChange  (target slot mutates in place)
 *   - applyStartTimeChange (target slot mutates in place)
 *   - applyRemove          (no flip — it just drops the row)
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  applySwap,
  applyAdd,
  applyDurationChange,
  applyStartTimeChange,
  applyRemove,
  activityFromCatalogEntry
} from '../../js/ui/editMode.js';

const NOW = '2026-04-22T09:00:00Z';

function stubActivity(overrides = {}) {
  return {
    id: 'sa_x',
    catalogEntryId: 'cat_x',
    name: 'Some activity',
    bucket: 'PROJECT',
    plannedDurationMinutes: 60,
    plannedStartAt: '09:00',
    state: 'PROPOSED',
    ...overrides
  };
}

function stubCatalogEntry(overrides = {}) {
  return {
    id: 'cat_y',
    name: 'New Activity',
    bucket: 'PROJECT',
    defaultDurationMinutes: 60,
    enabledByUser: true,
    ...overrides
  };
}

describe('activityFromCatalogEntry — sets userEdited true', () => {
  test('a freshly materialized draft is flagged userEdited:true', () => {
    const entry = stubCatalogEntry();
    const draft = activityFromCatalogEntry(entry, null, NOW, 'sa_new_1');
    assert.equal(draft.userEdited, true);
  });
});

describe('applySwap — flips userEdited on the swapped slot', () => {
  test('swapped slot is userEdited:true even if the source was composer-built', () => {
    const acts = [stubActivity({ id: 'orig', userEdited: false })];
    const next = applySwap(acts, 'orig', stubCatalogEntry({ id: 'cat_swap' }), NOW);
    assert.equal(next.length, 1);
    assert.equal(next[0].userEdited, true);
  });

  test('untouched slots keep their original userEdited status', () => {
    const acts = [
      stubActivity({ id: 'a', userEdited: false }),
      stubActivity({ id: 'b', userEdited: false })
    ];
    const next = applySwap(acts, 'a', stubCatalogEntry({ id: 'cat_swap' }), NOW);
    // `b` was not the swap target — should remain composer-built.
    const b = next.find((x) => x.id === 'b');
    assert.equal(b.userEdited, false);
  });
});

describe('applyAdd — flips userEdited on the new slot', () => {
  test('appended slot is userEdited:true', () => {
    const acts = [stubActivity({ id: 'orig', userEdited: false })];
    const next = applyAdd(acts, stubCatalogEntry({ id: 'cat_added' }), NOW);
    assert.equal(next.length, 2);
    const added = next.find((a) => a.catalogEntryId === 'cat_added');
    assert.equal(added.userEdited, true);
  });

  test('original slots remain untouched', () => {
    const acts = [stubActivity({ id: 'orig', userEdited: false })];
    const next = applyAdd(acts, stubCatalogEntry({ id: 'cat_added' }), NOW);
    const orig = next.find((a) => a.id === 'orig');
    assert.equal(orig.userEdited, false);
  });
});

describe('applyDurationChange — flips userEdited on the changed slot', () => {
  test('changed slot is userEdited:true', () => {
    const acts = [stubActivity({ id: 'a', plannedDurationMinutes: 60, userEdited: false })];
    const next = applyDurationChange(acts, 'a', 90);
    const a = next.find((x) => x.id === 'a');
    assert.equal(a.plannedDurationMinutes, 90);
    assert.equal(a.userEdited, true);
  });

  test('cascaded successor slots stay userEdited:false', () => {
    // Two butting-up activities. Change the first; the second should
    // shift but should NOT itself become userEdited.
    const acts = [
      stubActivity({ id: 'a', plannedStartAt: '09:00', plannedDurationMinutes: 60, userEdited: false }),
      stubActivity({ id: 'b', plannedStartAt: '10:00', plannedDurationMinutes: 60, userEdited: false })
    ];
    const next = applyDurationChange(acts, 'a', 90);
    const b = next.find((x) => x.id === 'b');
    // The cascade shifts the start time but the user did not directly
    // edit `b`.
    assert.equal(b.userEdited, false);
  });

  test('a no-op duration change still flags target as userEdited', () => {
    const acts = [stubActivity({ id: 'a', plannedDurationMinutes: 60, userEdited: false })];
    const next = applyDurationChange(acts, 'a', 60);
    const a = next.find((x) => x.id === 'a');
    assert.equal(a.userEdited, true);
  });
});

describe('applyStartTimeChange — flips userEdited on the changed slot', () => {
  test('changed slot is userEdited:true', () => {
    const acts = [stubActivity({ id: 'a', plannedStartAt: '09:00', plannedDurationMinutes: 60, userEdited: false })];
    const next = applyStartTimeChange(acts, 'a', '10:00');
    const a = next.find((x) => x.id === 'a');
    assert.equal(a.plannedStartAt, '10:00');
    assert.equal(a.userEdited, true);
  });

  test('cascaded successor slots stay userEdited:false', () => {
    // Two butting-up activities. Move the first; the second cascades.
    const acts = [
      stubActivity({ id: 'a', plannedStartAt: '09:00', plannedDurationMinutes: 60, userEdited: false }),
      stubActivity({ id: 'b', plannedStartAt: '10:00', plannedDurationMinutes: 60, userEdited: false })
    ];
    const next = applyStartTimeChange(acts, 'a', '10:00');
    const b = next.find((x) => x.id === 'b');
    assert.equal(b.userEdited, false);
  });
});

describe('applyRemove — does not touch surviving slots\' userEdited flag', () => {
  test('survivors retain their userEdited status', () => {
    const acts = [
      stubActivity({ id: 'a', userEdited: false }),
      stubActivity({ id: 'b', userEdited: true }),
      stubActivity({ id: 'c', userEdited: false })
    ];
    const next = applyRemove(acts, 'a');
    assert.equal(next.length, 2);
    const b = next.find((x) => x.id === 'b');
    const c = next.find((x) => x.id === 'c');
    assert.equal(b.userEdited, true);
    assert.equal(c.userEdited, false);
  });
});
