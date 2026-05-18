/**
 * TodayGrid — Iter 43 polish bundle tests.
 *
 * Covers:
 *   Item 4: Half-hour grid lines (AC8, AC9)
 *   Item 5: Past-hour dimming (AC10, AC11)
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { TodayGrid } from '../../../js/ui/components/TodayGrid.js';

function mkComposition(overrides = {}) {
  return {
    id: 'comp_iter43_grid',
    userId: 'u',
    state: 'ACCEPTED',
    date: '2026-05-17',
    ...overrides
  };
}

function mkActivity(overrides = {}) {
  return {
    id: overrides.id ?? 'sa_iter43',
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

// ---------------------------------------------------------------------------
// Item 4: Half-hour grid lines (AC8, AC9)
// ---------------------------------------------------------------------------
describe('TodayGrid Iter 43 — Item 4: half-hour grid lines (AC8-AC9)', () => {
  test('AC8: cycle-half-hour-line elements are rendered', () => {
    const html = TodayGrid({ composition: COMP, activities: [] });
    assert.ok(
      html.includes('cycle-half-hour-line'),
      'cycle-half-hour-line must be present in grid output (AC8)'
    );
  });

  test('AC8: half-hour lines appear at :30 offsets within each hour', () => {
    // Default grid: 07:00–19:00, 60px/hr → 12 hours → 12 half-hour lines.
    // First half-hour line is at 07:30 → (0.5) × 60px = 30px.
    const html = TodayGrid({ composition: COMP, activities: [] });
    assert.ok(
      html.includes('top: 30px'),
      'First half-hour line must be at top: 30px (07:30 on 07:00-start, 60px/hr grid)'
    );
  });

  test('AC8: correct number of half-hour lines for default grid (12 hours → 12 lines)', () => {
    const html = TodayGrid({ composition: COMP, activities: [] });
    const count = (html.match(/cycle-half-hour-line/g) ?? []).length;
    assert.equal(count, 12, 'Default 07:00–19:00 grid must have exactly 12 half-hour lines');
  });

  test('AC9: half-hour lines have different class than hour lines', () => {
    const html = TodayGrid({ composition: COMP, activities: [] });
    assert.ok(
      html.includes('cycle-hour-line') && html.includes('cycle-half-hour-line'),
      'Both cycle-hour-line and cycle-half-hour-line must be present; different class = different visual weight'
    );
  });

  test('AC8: half-hour lines have aria-hidden="true" for accessibility', () => {
    const html = TodayGrid({ composition: COMP, activities: [] });
    // Count occurrences — both hour and half-hour lines use aria-hidden.
    // Verify at least the half-hour class + aria-hidden co-occur in the same div.
    assert.ok(
      html.includes('cycle-half-hour-line'),
      'Half-hour lines must render (accessibility check requires class present)'
    );
    // The renderHalfHourLines function emits aria-hidden="true" on each line.
    // Verify the pattern appears near the class.
    const halfHourIdx = html.indexOf('cycle-half-hour-line');
    const aroundLine = html.slice(Math.max(0, halfHourIdx - 20), halfHourIdx + 100);
    assert.ok(
      aroundLine.includes('aria-hidden="true"'),
      'cycle-half-hour-line must be aria-hidden for decorative grid lines'
    );
  });

  test('AC8: half-hour lines absent in null-composition (empty) grid', () => {
    const html = TodayGrid({ composition: null, activities: [] });
    assert.ok(
      !html.includes('cycle-half-hour-line'),
      'No half-hour lines in empty (null-composition) grid'
    );
  });

  test('AC8: custom grid params produce correct half-hour line positions', () => {
    // gridStartHour=8, gridEndHour=10, rowHeightPx=40 → 2 half-hour lines.
    // Line at (0.5 × 40)=20px (08:30) and (1.5 × 40)=60px (09:30).
    const html = TodayGrid({
      composition: COMP,
      activities: [],
      gridStartHour: 8,
      gridEndHour: 10,
      rowHeightPx: 40
    });
    assert.ok(html.includes('top: 20px'), 'First half-hour line at 08:30 must be at top: 20px');
    assert.ok(html.includes('top: 60px'), 'Second half-hour line at 09:30 must be at top: 60px');
    const count = (html.match(/cycle-half-hour-line/g) ?? []).length;
    assert.equal(count, 2, 'Custom 8–10 grid must have exactly 2 half-hour lines');
  });
});

// ---------------------------------------------------------------------------
// Item 5: Past-hour dimming (AC10, AC11)
// ---------------------------------------------------------------------------
describe('TodayGrid Iter 43 — Item 5: past-hour dimming (AC10-AC11)', () => {
  test('AC10: past hours receive cycle-hour-past class', () => {
    // nowMinutesOfDay = 600 (10:00) → hours 07, 08, 09 are past; 10 is current.
    // Supply nowIso for a time of 10:00 on the composition date.
    const html = TodayGrid({
      composition: COMP,
      activities: [],
      nowIso: '2026-05-17T10:00:00.000Z'
    });
    assert.ok(
      html.includes('cycle-hour-past'),
      'cycle-hour-past class must be applied to past hour labels (AC10)'
    );
  });

  test('AC11: current hour does NOT receive cycle-hour-past class', () => {
    // Current hour (10:00) must be cycle-hour-current, not cycle-hour-past.
    const html = TodayGrid({
      composition: COMP,
      activities: [],
      nowIso: '2026-05-17T10:00:00.000Z'
    });
    // Verify current hour has cycle-hour-current but not cycle-hour-past.
    // Extract the span containing cycle-hour-current.
    const currentIdx = html.indexOf('cycle-hour-current');
    assert.ok(currentIdx !== -1, 'cycle-hour-current must be present');
    const currentSpan = html.slice(Math.max(0, currentIdx - 50), currentIdx + 100);
    assert.ok(
      !currentSpan.includes('cycle-hour-past'),
      'Current hour span must NOT also have cycle-hour-past (AC11)'
    );
  });

  test('AC10: no past hours when nowIso is before grid start', () => {
    // If nowIso is 06:00 (before 07:00 grid start), no past hours.
    const html = TodayGrid({
      composition: COMP,
      activities: [],
      nowIso: '2026-05-17T06:00:00.000Z'
    });
    // No past hours (all hours are current or future), so cycle-hour-past absent
    // — but current hour might still get cycle-hour-current if matched.
    // The primary assertion: no cycle-hour-past because nowIso is before grid.
    // Note: parseMinutesOfDay('2026-05-17T06:00:00.000Z') → 360 min → hour=6,
    // which is below gridStartHour=7, so isPast = (7 < 6) = false for all.
    assert.ok(
      !html.includes('cycle-hour-past'),
      'No past hours when nowIso is before grid start hour'
    );
  });

  test('AC10: past-hour dimming absent when nowIso is null', () => {
    const html = TodayGrid({ composition: COMP, activities: [], nowIso: null });
    assert.ok(
      !html.includes('cycle-hour-past'),
      'cycle-hour-past must be absent when nowIso is null (no past-hour info available)'
    );
  });
});
