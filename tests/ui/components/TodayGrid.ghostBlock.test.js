/**
 * TodayGrid — Phase 3.1 (R3) ghost block NaN positioning regression tests.
 *
 * Bug: dragController.onDragPending sent newStart as HH:MM string only, not
 * minutes-of-day. DRAG_START_PROPOSED stored dragSession.proposedStart from
 * payload.proposedStartMin which was undefined → null. TodayGrid:697 computed
 * null - gridStartHour*60 = NaN → ghost rendered at top:NaNpx (invisible).
 *
 * Fix: dragController now emits proposedStartMin (integer minutes-of-day) in
 * the onDragPending payload. TodayGrid guard requires Number.isFinite().
 *
 * AC coverage:
 *   AC-GB1: dragSession with proposedStart as integer minutes → ghost renders
 *           with finite top and height (not NaN)
 *   AC-GB2: dragSession with proposedStart: null → ghost block NOT rendered
 *           (regression-lock for the prior NaN case)
 *   AC-GB3 (META §A.2): both cases tested — positive and negative paths
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { TodayGrid } from '../../../js/ui/components/TodayGrid.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function mkComposition(overrides = {}) {
  return {
    id: 'comp_gb_1',
    userId: 'u',
    state: 'PROPOSED',
    date: '2026-05-18',
    ...overrides
  };
}

function mkActivity(overrides = {}) {
  return {
    id: 'sa_ghost_1',
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
const DEFAULT_GRID_START = 7; // default gridStartHour
const ROW_HEIGHT = 60;         // default rowHeightPx

// For a proposedStart of 10:00 = 600 min, gridStart=7h=420 min:
// ghostTop = (600 - 420) * (60/60) = 180 * 1 = 180px
const PROPOSED_START_MIN = 600; // 10:00 in minutes-of-day
const PROPOSED_DURATION = 60;   // 60 minutes

// ---------------------------------------------------------------------------
// AC-GB1: integer proposedStart → finite top and height
// ---------------------------------------------------------------------------

describe('TodayGrid ghost block — AC-GB1: integer proposedStart renders correctly', () => {
  test('AC-GB1: ghost block renders when proposedStart is a finite integer', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity()],
      dragSession: {
        activityId: 'sa_ghost_1',
        proposedStart: PROPOSED_START_MIN,
        proposedDuration: PROPOSED_DURATION
      },
      gridStartHour: DEFAULT_GRID_START,
      rowHeightPx: ROW_HEIGHT
    });
    assert.ok(
      html.includes('cycle-block-ghost'),
      'AC-GB1: ghost block element must be rendered when proposedStart is an integer'
    );
  });

  test('AC-GB1: ghost block top value is a finite number (not NaN)', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity()],
      dragSession: {
        activityId: 'sa_ghost_1',
        proposedStart: PROPOSED_START_MIN,
        proposedDuration: PROPOSED_DURATION
      },
      gridStartHour: DEFAULT_GRID_START,
      rowHeightPx: ROW_HEIGHT
    });
    // Extract the top value from the inline style
    const match = html.match(/cycle-block-ghost[\s\S]*?style="top:\s*([\d.]+)px/);
    assert.ok(match, 'AC-GB1: ghost block must have a style with top value');
    const topValue = Number(match[1]);
    assert.ok(Number.isFinite(topValue), `AC-GB1: top must be a finite number, got ${topValue}`);
    assert.ok(!html.includes('top: NaN'), 'AC-GB1: top must not be NaN');
    assert.ok(!html.includes('top:NaN'), 'AC-GB1: top must not be NaN (no-space variant)');
  });

  test('AC-GB1: ghost block height value is a finite number (not NaN)', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity()],
      dragSession: {
        activityId: 'sa_ghost_1',
        proposedStart: PROPOSED_START_MIN,
        proposedDuration: PROPOSED_DURATION
      },
      gridStartHour: DEFAULT_GRID_START,
      rowHeightPx: ROW_HEIGHT
    });
    assert.ok(!html.includes('height: NaN'), 'AC-GB1: height must not be NaN');
    assert.ok(!html.includes('height:NaN'), 'AC-GB1: height must not be NaN (no-space variant)');
  });

  test('AC-GB1: ghost block top matches expected pixel offset', () => {
    // proposedStart=600, gridStart=7h=420min → (600-420) * (60/60) = 180px
    const expectedTop = (PROPOSED_START_MIN - DEFAULT_GRID_START * 60) * (ROW_HEIGHT / 60);
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity()],
      dragSession: {
        activityId: 'sa_ghost_1',
        proposedStart: PROPOSED_START_MIN,
        proposedDuration: PROPOSED_DURATION
      },
      gridStartHour: DEFAULT_GRID_START,
      rowHeightPx: ROW_HEIGHT
    });
    assert.ok(
      html.includes(`top: ${expectedTop}px`),
      `AC-GB1: ghost top must be ${expectedTop}px, matching (${PROPOSED_START_MIN} - ${DEFAULT_GRID_START}*60) * (${ROW_HEIGHT}/60)`
    );
  });
});

// ---------------------------------------------------------------------------
// AC-GB2: null proposedStart → ghost block NOT rendered
// ---------------------------------------------------------------------------

describe('TodayGrid ghost block — AC-GB2: null proposedStart suppresses ghost', () => {
  test('AC-GB2: ghost block is NOT rendered when proposedStart is null', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity()],
      dragSession: {
        activityId: 'sa_ghost_1',
        proposedStart: null,   // the prior bug: null came from undefined proposedStartMin
        proposedDuration: PROPOSED_DURATION
      }
    });
    assert.ok(
      !html.includes('cycle-block-ghost'),
      'AC-GB2: ghost block must NOT be rendered when proposedStart is null (regression-lock for NaN bug)'
    );
  });

  test('AC-GB2: ghost block is NOT rendered when proposedStart is undefined', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity()],
      dragSession: {
        activityId: 'sa_ghost_1',
        // proposedStart intentionally omitted (undefined)
        proposedDuration: PROPOSED_DURATION
      }
    });
    assert.ok(
      !html.includes('cycle-block-ghost'),
      'AC-GB2: ghost block must NOT be rendered when proposedStart is undefined'
    );
  });

  test('AC-GB2: no NaN in output when proposedStart is null', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity()],
      dragSession: {
        activityId: 'sa_ghost_1',
        proposedStart: null,
        proposedDuration: PROPOSED_DURATION
      }
    });
    assert.ok(
      !html.includes('NaN'),
      'AC-GB2: NaN must not appear anywhere in rendered output when proposedStart is null'
    );
  });
});

// ---------------------------------------------------------------------------
// AC-GB3 (META §A.2): dragSession null → no ghost rendered at all
// ---------------------------------------------------------------------------

describe('TodayGrid ghost block — AC-GB3: no dragSession → no ghost', () => {
  test('AC-GB3: no ghost block when dragSession is null', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity()],
      dragSession: null
    });
    assert.ok(
      !html.includes('cycle-block-ghost'),
      'AC-GB3: no ghost rendered when dragSession is null'
    );
  });

  test('AC-GB3: no NaN in output when dragSession is null', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity()],
      dragSession: null
    });
    assert.ok(
      !html.includes('NaN'),
      'AC-GB3: NaN must not appear in rendered output when dragSession is null'
    );
  });
});
