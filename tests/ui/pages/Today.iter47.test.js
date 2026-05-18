/**
 * Today page — Iter 47 Phase 2 tests.
 *
 * AC coverage:
 *  AC13: Lunch block click does NOT open BlockDetailDialog
 *  AC14: Lunch block click shows inline tooltip with time + auto-protected note
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { Today } from '../../../js/ui/pages/Today.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function mkComposition(overrides = {}) {
  return {
    id: 'comp_47',
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
const LUNCH = mkActivity({
  id: 'sa_lunch',
  bucket: null,
  name: 'Lunch',
  plannedStartAt: '12:00',
  plannedDurationMinutes: 30
});
const PROJECT = mkActivity({ id: 'sa_proj', plannedStartAt: '09:00' });

// ---------------------------------------------------------------------------
// AC13: Lunch tooltip replaces BlockDetailDialog for lunch
// ---------------------------------------------------------------------------

describe('Today Iter47 — AC13: lunch tooltip (no dialog)', () => {
  test('AC13: lunchTooltip prop renders lunch-tooltip element', () => {
    const html = Today({
      activeState: { composition: COMP, activities: [LUNCH, PROJECT] },
      lunchTooltip: { timeRange: '12:00–12:30' }
    });
    assert.ok(html.includes('lunch-tooltip'), 'lunch-tooltip element must render when lunchTooltip prop is set (AC13)');
  });

  test('AC13: lunch tooltip shows the time range', () => {
    const html = Today({
      activeState: { composition: COMP, activities: [LUNCH, PROJECT] },
      lunchTooltip: { timeRange: '12:00–12:30' }
    });
    assert.ok(html.includes('12:00'), 'Lunch tooltip must show start time (AC14)');
  });

  test('AC14: lunch tooltip shows auto-protected note', () => {
    const html = Today({
      activeState: { composition: COMP, activities: [LUNCH, PROJECT] },
      lunchTooltip: { timeRange: '12:00–12:30' }
    });
    assert.ok(
      html.includes('not editable') || html.includes('Auto-protected'),
      'Lunch tooltip must show auto-protected note (AC14)'
    );
  });

  test('AC14: lunch tooltip has CLOSE_LUNCH_TOOLTIP action for dismiss', () => {
    const html = Today({
      activeState: { composition: COMP, activities: [LUNCH, PROJECT] },
      lunchTooltip: { timeRange: '12:00–12:30' }
    });
    assert.ok(html.includes('CLOSE_LUNCH_TOOLTIP'), 'Lunch tooltip must have CLOSE_LUNCH_TOOLTIP action');
  });

  test('AC13: when lunchTooltip is null, no lunch-tooltip element renders', () => {
    const html = Today({
      activeState: { composition: COMP, activities: [LUNCH, PROJECT] },
      lunchTooltip: null
    });
    assert.ok(!html.includes('lunch-tooltip'), 'No lunch-tooltip when lunchTooltip is null');
  });

  test('AC13: lunch-tooltip is NOT a bdd-modal (not BlockDetailDialog)', () => {
    const html = Today({
      activeState: { composition: COMP, activities: [LUNCH, PROJECT] },
      lunchTooltip: { timeRange: '12:00–12:30' }
    });
    // When lunch tooltip is shown, blockDetail would be null (they are mutually exclusive by design)
    // Ensure the lunch tooltip IS present and the bdd-modal is NOT present simultaneously
    assert.ok(html.includes('lunch-tooltip'), 'Lunch tooltip renders');
    // With no blockDetail prop, bdd-modal should not appear
    assert.ok(!html.includes('bdd-modal'), 'BlockDetailDialog must not render when only lunchTooltip is shown');
  });
});

// ---------------------------------------------------------------------------
// AC14: Lunch tooltip content (time + auto-protected note)
// ---------------------------------------------------------------------------

describe('Today Iter47 — AC14: lunch tooltip content', () => {
  test('AC14: tooltip contains "Lunch" label', () => {
    const html = Today({
      activeState: { composition: COMP, activities: [LUNCH, PROJECT] },
      lunchTooltip: { timeRange: '12:00–12:30' }
    });
    assert.ok(html.includes('lunch-tooltip-label') || html.includes('Lunch'), 'Lunch label must appear in tooltip');
  });

  test('AC14: tooltip has role=tooltip for WCAG', () => {
    const html = Today({
      activeState: { composition: COMP, activities: [LUNCH, PROJECT] },
      lunchTooltip: { timeRange: '12:00–12:30' }
    });
    assert.ok(html.includes('role="tooltip"'), 'Lunch tooltip must have role=tooltip for accessibility (AC20)');
  });

  test('AC14: tooltip with different time range renders correctly', () => {
    const html = Today({
      activeState: { composition: COMP, activities: [LUNCH, PROJECT] },
      lunchTooltip: { timeRange: '13:00–13:30' }
    });
    assert.ok(html.includes('13:00'), 'Custom time range must appear in tooltip');
  });
});
