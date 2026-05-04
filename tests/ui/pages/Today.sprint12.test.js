/**
 * Sprint 12 — Today page edit-mode rendering tests.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { Today } from '../../../js/ui/pages/Today.js';

function mkComposition(state = 'PROPOSED') {
  return {
    id: 'comp_1',
    userId: 'u',
    state,
    cycleType: 'DAILY',
    date: '2026-04-22'
  };
}

function mkActivity(overrides = {}) {
  return {
    id: 'sa_1',
    catalogEntryId: 'cat_work',
    name: 'Focus Block',
    bucket: 'PROJECT',
    plannedDurationMinutes: 60,
    plannedStartAt: '10:00',
    state: 'PROPOSED',
    ...overrides
  };
}

const CATALOG = [
  {
    id: 'cat_proj_1',
    name: 'Generic Deep',
    bucket: 'PROJECT',
    defaultDurationMinutes: 120,
    enabledByUser: true
  },
  {
    id: 'cat_ci_1',
    name: 'L&D',
    bucket: 'CI',
    defaultDurationMinutes: 60,
    enabledByUser: true
  }
];

describe('Today — edit mode render', () => {
  test('editMode prop renders EditDrawer + dims the page', () => {
    const html = Today({
      activeState: {
        composition: mkComposition(),
        activities: [mkActivity()]
      },
      editMode: {
        compositionId: 'comp_1',
        snapshotActivities: [mkActivity()],
        activities: [mkActivity()],
        selectedActivityId: null,
        undoStack: [],
        searchQuery: '',
        projectTypeFilter: 'all',
        expandedBuckets: ['PROJECT']
      },
      catalog: CATALOG
    });
    assert.match(html, /today-editing/);
    assert.match(html, /class="edit-drawer edit-drawer-open"/);
  });

  test('no editMode → no drawer', () => {
    const html = Today({
      activeState: {
        composition: mkComposition(),
        activities: [mkActivity()]
      }
    });
    assert.equal(html.includes('edit-drawer'), false);
    assert.equal(html.includes('today-editing'), false);
  });

  test('Iter 25: BucketStrip removed — editMode.activities shown in activity list, not strip', () => {
    // BucketStrip was removed from CycleCard in Iter 25.
    // Activity durations are still visible in .sa-duration columns.
    const edited = [
      mkActivity({ bucket: 'PROJECT', plannedDurationMinutes: 30 }),
      mkActivity({ id: 'sa_2', bucket: 'CI', plannedDurationMinutes: 90 })
    ];
    const html = Today({
      activeState: {
        composition: mkComposition(),
        activities: [mkActivity({ plannedDurationMinutes: 240 })] // original
      },
      editMode: {
        compositionId: 'comp_1',
        snapshotActivities: [],
        activities: edited,
        selectedActivityId: null,
        undoStack: [],
        searchQuery: '',
        projectTypeFilter: 'all',
        expandedBuckets: ['PROJECT']
      },
      catalog: CATALOG
    });
    // BucketStrip must be absent.
    assert.ok(!html.includes('bucket-strip'), 'BucketStrip must be absent (Iter 25)');
    // Activity durations still render in sa-duration spans.
    assert.match(html, /30m/, 'PROJECT 30m must appear in sa-duration');
    assert.match(html, /90m/, 'CI 90m must appear in sa-duration');
  });

  test('EditDrawer receives editMode.selectedActivityId', () => {
    const html = Today({
      activeState: {
        composition: mkComposition(),
        activities: [mkActivity({ id: 'sa_a' })]
      },
      editMode: {
        compositionId: 'comp_1',
        snapshotActivities: [],
        activities: [mkActivity({ id: 'sa_a', name: 'Focus A' })],
        selectedActivityId: 'sa_a',
        undoStack: [],
        searchQuery: '',
        projectTypeFilter: 'all',
        expandedBuckets: ['PROJECT']
      },
      catalog: CATALOG
    });
    // subtitle mentions selected slot
    assert.match(html, /Swap &quot;Focus A&quot; with/);
  });

  test('CycleCard shows Commit/Cancel/Undo bar in edit mode', () => {
    const html = Today({
      activeState: {
        composition: mkComposition(),
        activities: [mkActivity()]
      },
      editMode: {
        compositionId: 'comp_1',
        snapshotActivities: [],
        activities: [mkActivity()],
        selectedActivityId: null,
        undoStack: [{}, {}],
        searchQuery: '',
        projectTypeFilter: 'all',
        expandedBuckets: ['PROJECT']
      },
      catalog: CATALOG
    });
    assert.match(html, /data-action="EDIT_COMMIT"/);
    assert.match(html, /data-action="EDIT_CANCEL"/);
    assert.match(html, /Undo \(2\)/);
  });
});
