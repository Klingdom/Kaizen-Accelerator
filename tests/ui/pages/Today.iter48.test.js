/**
 * Today page — Iter 48 Phase 3 + Phase 4 tests.
 *
 * Phase 3C (AC8, AC9, AC10): bucket-strip removal
 * Phase 4D (AC11): page-header date echo removal
 * Phase 4E (AC12): long activity name truncation (CSS concern; JS emission tested here)
 * Phase 4F (AC13, AC14, AC15): missing-data graceful degradation
 *
 * META §A.2 application:
 *   - Bucket-strip removal: verify cadence ring STILL present (AC10)
 *   - Date echo removal: verify cycle-date-display h1 STILL present in CycleCard
 *
 * META §A.3 reconciliation (CLOSED — Phase 2 R3):
 *   - cycle-bucket-strip CSS: deleted from app.css in Phase 2B (R3). Previously inert.
 *   - today-header-date CSS: deleted from app.css in Phase 2B (R3). Previously inert.
 *   - No new CSS classes introduced by Today.js in this phase.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { Today } from '../../../js/ui/pages/Today.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function mkComposition(overrides = {}) {
  return {
    id: 'comp_48_today',
    userId: 'u1',
    state: 'ACCEPTED',
    date: '2026-04-30',
    ...overrides
  };
}

function mkActivity(overrides = {}) {
  return {
    id: 'sa_1',
    catalogEntryId: 'cat_deep',
    name: 'Deep Work',
    bucket: 'PROJECT',
    plannedDurationMinutes: 60,
    plannedStartAt: '10:00',
    state: 'SCHEDULED',
    ...overrides
  };
}

const COMP = mkComposition();
const ACT = mkActivity();
const ACTIVE = { composition: COMP, activities: [ACT] };

// ---------------------------------------------------------------------------
// Phase 3C: bucket-strip removal (AC8, AC9, AC10)
// ---------------------------------------------------------------------------

describe('Today Iter48 — Phase 3C: bucket strip removed (AC8, AC9, AC10)', () => {
  test('AC8: cycle-bucket-strip is NOT in Today page output', () => {
    const html = Today({ activeState: ACTIVE });
    assert.ok(
      !html.includes('cycle-bucket-strip'),
      'cycle-bucket-strip must be absent after Iter 48 Phase 3C removal (AC8)'
    );
  });

  test('AC8: today-body-with-strip layout class is NOT used', () => {
    const html = Today({ activeState: ACTIVE });
    assert.ok(
      !html.includes('today-body-with-strip'),
      'today-body-with-strip must be absent — single-column layout takes over (AC8)'
    );
  });

  test('AC9: today-body single-column layout is used instead', () => {
    const html = Today({ activeState: ACTIVE });
    assert.ok(
      html.includes('today-body'),
      'today-body wrapper must still render as single-column layout (AC9)'
    );
  });

  test('AC9: today-card-col wrapper present inside today-body', () => {
    const html = Today({ activeState: ACTIVE });
    assert.ok(
      html.includes('today-card-col'),
      'today-card-col must render inside today-body (AC9)'
    );
  });

  test('AC10: Cadence Pressure Ring (cadence-ring) still visible in header', () => {
    const html = Today({ activeState: ACTIVE });
    assert.ok(
      html.includes('cadence-ring'),
      'cadence-ring must still be present in header after strip removal (AC10)'
    );
  });

  test('AC10: Ring SVG arcs still render with activities', () => {
    const html = Today({ activeState: ACTIVE });
    // Ring renders as an SVG with stroke arcs — check for SVG presence
    assert.ok(
      html.includes('cadence-ring') && html.includes('svg'),
      'Ring SVG must render with composition activities present (AC10)'
    );
  });

  // META §A.2 orthogonal: bucket strip absent even in editing state
  test('META §A.2: bucket strip absent in edit mode too', () => {
    const html = Today({
      activeState: ACTIVE,
      editMode: {
        activities: [ACT],
        selectedActivityId: null,
        undoStack: [],
        searchQuery: ''
      }
    });
    assert.ok(
      !html.includes('cycle-bucket-strip'),
      'cycle-bucket-strip must also be absent in edit mode (§A.2 orthogonal)'
    );
  });

  // META §A.2 orthogonal: CycleCard still renders (core content unaffected)
  test('META §A.2: CycleCard still renders after strip removal', () => {
    const html = Today({ activeState: ACTIVE });
    assert.ok(
      html.includes('cycle-card') || html.includes('cycle-calendar-grid'),
      'CycleCard must still render after bucket strip removal — core content unaffected (§A.2)'
    );
  });

  test('AC8: bucket strip absent in empty state (no composition)', () => {
    const html = Today({ activeState: null });
    assert.ok(
      !html.includes('cycle-bucket-strip'),
      'cycle-bucket-strip was never in empty state — still absent (AC8)'
    );
  });

  test('AC8: bucket strip absent in infeasible state', () => {
    const html = Today({
      activeState: null,
      infeasible: { explain: ['Too many meetings'] }
    });
    assert.ok(
      !html.includes('cycle-bucket-strip'),
      'cycle-bucket-strip must be absent in infeasible state (AC8)'
    );
  });
});

// ---------------------------------------------------------------------------
// Phase 4D: page-header date echo removed (AC11)
// ---------------------------------------------------------------------------

describe('Today Iter48 — Phase 4D: header date echo removed (AC11)', () => {
  test('AC11: today-header-date NOT present in page header', () => {
    const html = Today({ activeState: ACTIVE });
    assert.ok(
      !html.includes('today-header-date'),
      'today-header-date must NOT be in header after Iter 48 Phase 4D removal (AC11)'
    );
  });

  test('AC11: cycle-date-display h1 inside CycleCard still shows the date', () => {
    const html = Today({ activeState: ACTIVE });
    assert.ok(
      html.includes('cycle-date-display'),
      'cycle-date-display h1 in CycleCard must be preserved — semantic date owner (AC11)'
    );
  });

  test('AC11: today-header-center still renders (holds activity summary)', () => {
    const html = Today({ activeState: ACTIVE });
    assert.ok(
      html.includes('today-header-center'),
      'today-header-center must still render to hold the Now/Next activity summary (AC11)'
    );
  });

  test('AC11: header has Ring + activity summary + Day Badge (3 elements, not 5)', () => {
    const html = Today({
      activeState: ACTIVE,
      daysSinceSignup: 5,
      nowIso: '2026-04-30T10:30:00.000Z'
    });
    // After removal the 3 header elements should all be present:
    assert.ok(html.includes('cadence-ring'), 'Ring present (element 1)');
    assert.ok(html.includes('today-header-activity') || html.includes('today-header-center'), 'Activity/center present (element 2)');
    assert.ok(html.includes('today-day-badge'), 'Day Badge present (element 3)');
    // Date echo must be absent:
    assert.ok(!html.includes('today-header-date'), 'Date echo absent (not a 4th element)');
  });

  // META §A.2 orthogonal: date echo removed even when no composition
  test('META §A.2: today-header-date absent in empty state (as before, unchanged)', () => {
    const html = Today({ activeState: null });
    assert.ok(
      !html.includes('today-header-date'),
      'today-header-date was always absent in empty state — still absent (§A.2 orthogonal)'
    );
  });

  // META §A.2 orthogonal: CycleCard date preserved with compositions that have dates
  test('META §A.2: CycleCard cycle-date-display still works with various composition dates', () => {
    const htmlA = Today({ activeState: { composition: mkComposition({ date: '2026-01-01' }), activities: [ACT] } });
    const htmlB = Today({ activeState: { composition: mkComposition({ date: '2026-12-31' }), activities: [ACT] } });
    assert.ok(htmlA.includes('cycle-date-display'), 'cycle-date-display renders for Jan 1');
    assert.ok(htmlB.includes('cycle-date-display'), 'cycle-date-display renders for Dec 31');
    // Neither should have the page-header echo:
    assert.ok(!htmlA.includes('today-header-date'), 'No header date echo for Jan 1');
    assert.ok(!htmlB.includes('today-header-date'), 'No header date echo for Dec 31');
  });
});

// ---------------------------------------------------------------------------
// Phase 4E: Long activity name truncation via CSS (AC12)
// JS verifies the name text is emitted; CSS handles visual truncation.
// ---------------------------------------------------------------------------

describe('Today Iter48 — Phase 4E: long activity name handling (AC12)', () => {
  const LONG_NAME = 'This is a Very Long Activity Name That Exceeds Forty Characters';

  test('AC12: long activity name text is emitted by TodayGrid (CSS handles truncation)', () => {
    const html = Today({
      activeState: {
        composition: COMP,
        activities: [mkActivity({ name: LONG_NAME, plannedDurationMinutes: 60 })]
      }
    });
    // The HTML contains the truncated name — CSS text-overflow:ellipsis does the visual cut.
    assert.ok(
      html.includes(LONG_NAME.slice(0, 20)),
      'Long activity name text must be emitted (CSS handles visual truncation) (AC12)'
    );
  });

  test('AC12: cycle-block-name element carries the name for CSS truncation', () => {
    const html = Today({
      activeState: {
        composition: COMP,
        activities: [mkActivity({ name: LONG_NAME })]
      }
    });
    // cycle-block-name has overflow:hidden and text-overflow:ellipsis in CSS
    assert.ok(html.includes('cycle-block-name'), 'cycle-block-name element must be present for CSS truncation (AC12)');
  });
});

// ---------------------------------------------------------------------------
// Phase 4F: Missing-data graceful degradation (AC13, AC14, AC15)
// ---------------------------------------------------------------------------

describe('Today Iter48 — Phase 4F: missing-data graceful degradation', () => {
  test('AC13: PROJECT activity with missing intention + outputArtifact renders without crash', () => {
    let html;
    assert.doesNotThrow(() => {
      html = Today({
        activeState: {
          composition: COMP,
          activities: [mkActivity({
            bucket: 'PROJECT',
            // no intention, catalogEntryId maps to nothing in catalog
            plannedDurationMinutes: 60
          })]
        },
        catalog: []  // empty catalog → catalogEntry null
      });
    }, 'Today must not crash when PROJECT activity has no intention or outputArtifact (AC13)');
    assert.ok(html.includes('today-page'), 'Page renders even with missing PROJECT fields (AC13)');
  });

  test('AC14: COMM activity with missing participants + trigger renders without crash', () => {
    let html;
    assert.doesNotThrow(() => {
      html = Today({
        activeState: {
          composition: COMP,
          activities: [mkActivity({
            bucket: 'COMMUNICATION',
            name: 'Team Sync',
            plannedDurationMinutes: 30,
            plannedStartAt: '09:00'
            // no catalogEntryId → participants and trigger undefined
          })]
        },
        catalog: []
      });
    }, 'Today must not crash when COMM activity has no participants or trigger (AC14)');
    assert.ok(html.includes('today-page'), 'Page renders even with missing COMM fields (AC14)');
  });

  test('AC15: linkedKaizenId set but kaizenTitleById has no entry → no crash, graceful skip', () => {
    let html;
    assert.doesNotThrow(() => {
      html = Today({
        activeState: {
          composition: COMP,
          activities: [mkActivity({
            bucket: 'PROJECT',
            linkedKaizenId: 'k_nonexistent'
          })]
        },
        kaizenTitleById: {}  // empty → no title for k_nonexistent
      });
    }, 'Today must not crash when linkedKaizenId has no kaizenTitleById entry (AC15)');
    assert.ok(html.includes('today-page'), 'Page renders even with unmapped kaizenId (AC15)');
    // The block should still render, just without the kaizen chip
    assert.ok(html.includes('cycle-block-name'), 'Activity block still renders (AC15)');
  });

  test('AC15: undefined kaizenTitleById prop → graceful fallback (no crash)', () => {
    let html;
    assert.doesNotThrow(() => {
      html = Today({
        activeState: {
          composition: COMP,
          activities: [mkActivity({ bucket: 'PROJECT', linkedKaizenId: 'k1' })]
        }
        // kaizenTitleById NOT passed → defaults to {}
      });
    }, 'Today must not crash when kaizenTitleById is not passed (AC15)');
    assert.ok(html.includes('cycle-calendar-grid') || html.includes('cycle-block'), 'Grid renders without kaizenTitleById (AC15)');
  });
});

// ---------------------------------------------------------------------------
// Cross-cutting: verify all Iter 47 functionality preserved (AC19)
// ---------------------------------------------------------------------------

describe('Today Iter48 — AC19: Iter 47 functionality preserved', () => {
  test('AC19: lunch tooltip still works (Iter 47 AC13)', () => {
    const html = Today({
      activeState: {
        composition: COMP,
        activities: [mkActivity({ bucket: null, name: 'Lunch', plannedStartAt: '12:00', plannedDurationMinutes: 30 })]
      },
      lunchTooltip: { timeRange: '12:00–12:30' }
    });
    assert.ok(html.includes('lunch-tooltip'), 'Lunch tooltip still renders (Iter 47 AC19)');
  });

  test('AC19: block detail dialog still renders when blockDetail prop is set', () => {
    const actWithId = mkActivity({ id: 'sa_detail' });
    const html = Today({
      activeState: { composition: COMP, activities: [actWithId] },
      blockDetail: { activityId: 'sa_detail' }
    });
    assert.ok(html.includes('bdd-modal'), 'Block detail dialog still renders (Iter 47 preserved)');
  });

  test('AC19: edit drawer still renders when editMode prop is set', () => {
    const html = Today({
      activeState: ACTIVE,
      editMode: {
        activities: [ACT],
        selectedActivityId: null,
        undoStack: [],
        searchQuery: '',
        projectTypeFilter: 'all',
        expandedBuckets: ['PROJECT']
      },
      catalog: []
    });
    assert.ok(
      html.includes('today-editing') || html.includes('edit-drawer'),
      'Edit drawer and editing class still render (Iter 47 preserved)'
    );
  });

  test('AC19: drag confirm banner still renders when dragSession prop is set', () => {
    const html = Today({
      activeState: ACTIVE,
      dragSession: {
        activityId: 'sa_1',
        activityName: 'Deep Work',
        newStart: '11:00',
        newDuration: 60,
        originalStart: '10:00',
        originalDuration: 60,
        mode: 'move'
      }
    });
    assert.ok(html.includes('today-drag-confirm-banner'), 'Drag confirm banner still renders (Iter 47 preserved)');
  });
});
