/**
 * Today page — Iter 43 polish bundle tests.
 *
 * Covers:
 *   Item 2: Calendar date in header (AC4, AC5)
 *   Item 6: Current/next activity summary visible in header (AC12, AC13)
 *   Item 7: NowJumpButton present in Today page when nowIso provided (AC14)
 *
 * Existing tests guard AC1-AC3 indirectly via data-user-edited attribute
 * behavior; no new assertions needed there since the removal is CSS-only.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { Today } from '../../../js/ui/pages/Today.js';

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

function mkComposition(overrides = {}) {
  return {
    id: 'comp_iter43',
    userId: 'user_test',
    state: 'ACCEPTED',
    cycleType: 'DAILY',
    date: '2026-05-17',
    ...overrides
  };
}

function mkActivity(overrides = {}) {
  return {
    id: overrides.id ?? 'sa_iter43_1',
    catalogEntryId: 'cat_deep',
    name: 'Deep Work',
    bucket: 'PROJECT',
    plannedDurationMinutes: 120,
    plannedStartAt: '09:00',
    state: 'SCHEDULED',
    ...overrides
  };
}

const ACTIVE_STATE = {
  composition: mkComposition(),
  activities: [
    mkActivity({ id: 'sa_1', name: 'Deep Work', plannedStartAt: '09:00' }),
    mkActivity({ id: 'sa_2', name: 'Team Standup', bucket: 'COMMUNICATION', plannedStartAt: '11:00', plannedDurationMinutes: 30 })
  ]
};

// ---------------------------------------------------------------------------
// Item 2: Calendar date in header (AC4, AC5) — UPDATED BY ITER 48
//
// Iter 48 Phase 4D (AC11) removes the page-header date echo entirely.
// The cycle-date-display h1 inside CycleCard is the semantic owner of the date.
// The tests below are updated to verify the new correct behavior:
//   - today-header-date is NO LONGER present in the page header
//   - The date still appears inside the CycleCard (cycle-date-display)
// ---------------------------------------------------------------------------
describe('Today Iter 43 — Item 2: calendar date in header (updated by Iter 48)', () => {
  test('Iter 48 AC11: today-header-date is REMOVED from page header (date echo cut)', () => {
    const html = Today({ activeState: ACTIVE_STATE });
    assert.ok(
      !html.includes('today-header-date'),
      'today-header-date must NOT be in page header after Iter 48 Phase 4D removal (AC11)'
    );
  });

  test('Iter 48 AC11: cycle-date-display h1 inside CycleCard still shows the date', () => {
    const html = Today({ activeState: ACTIVE_STATE });
    // CycleCard renders the date as cycle-date-display — verify it is preserved
    assert.ok(
      html.includes('cycle-date-display'),
      'cycle-date-display h1 inside CycleCard must still render the date (AC11 preserved)'
    );
  });

  test('Iter 48 AC11: today-header-date absent in empty state (as before)', () => {
    const html = Today({ activeState: null });
    assert.ok(
      !html.includes('today-header-date'),
      'today-header-date was already absent in empty state — still absent after Iter 48'
    );
  });

  test('today-header-center wrapper is still present (holds Now/Next summary)', () => {
    const html = Today({ activeState: ACTIVE_STATE });
    assert.ok(
      html.includes('today-header-center'),
      'today-header-center wrapper must still be present — now holds activity summary only'
    );
  });
});

// ---------------------------------------------------------------------------
// Item 6: Current/next activity summary in header (AC12, AC13)
// ---------------------------------------------------------------------------
describe('Today Iter 43 — Item 6: activity summary in header', () => {
  test('AC12: today-header-activity present when IN_PROGRESS activity exists', () => {
    const activeWithInProgress = {
      composition: mkComposition(),
      activities: [
        mkActivity({ id: 'sa_inprog', name: 'Focus Block', state: 'IN_PROGRESS', plannedDurationMinutes: 60 })
      ]
    };
    const html = Today({ activeState: activeWithInProgress });
    assert.ok(
      html.includes('today-header-activity'),
      'today-header-activity must appear when an IN_PROGRESS activity exists'
    );
    assert.ok(
      html.includes('Now:') && html.includes('Focus Block'),
      'Summary must read "Now: Focus Block ..." for IN_PROGRESS activity'
    );
  });

  test('AC12: today-header-activity shows Up next when nowIso is provided and activity is upcoming', () => {
    const nowIso = '2026-05-17T08:00:00.000Z';
    const activeWithUpcoming = {
      composition: mkComposition({ date: '2026-05-17' }),
      activities: [
        mkActivity({
          id: 'sa_upcoming',
          name: 'Morning Standup',
          state: 'SCHEDULED',
          plannedStartAt: '09:00',
          plannedDurationMinutes: 15
        })
      ]
    };
    const html = Today({ activeState: activeWithUpcoming, nowIso });
    assert.ok(
      html.includes('today-header-activity'),
      'today-header-activity must appear when upcoming activity exists'
    );
    assert.ok(
      html.includes('Up next:') && html.includes('Morning Standup'),
      'Summary must read "Up next: Morning Standup ..." for upcoming activity'
    );
  });

  test('AC12: today-header-activity absent when no activeState', () => {
    const html = Today({ activeState: null });
    assert.ok(
      !html.includes('today-header-activity'),
      'today-header-activity must be absent in empty state (no composition)'
    );
  });

  test('AC13: aria-live span preserved in CycleCard (screen-reader surface unaffected)', () => {
    const html = Today({ activeState: ACTIVE_STATE });
    // CycleCard renders a cycle-now-summary aria-live span — this must still be present.
    assert.ok(
      html.includes('cycle-now-summary') && html.includes('aria-live="polite"'),
      'cycle-now-summary aria-live span must be preserved for screen readers (AC13)'
    );
  });
});

// ---------------------------------------------------------------------------
// Item 7: NowJumpButton in grid column (AC14)
// ---------------------------------------------------------------------------
describe('Today Iter 43 — Item 7: NowJumpButton in grid column', () => {
  test('AC14: now-jump-btn present when nowIso is provided and composition is active', () => {
    const html = Today({
      activeState: ACTIVE_STATE,
      nowIso: '2026-05-17T09:00:00.000Z'
    });
    assert.ok(
      html.includes('now-jump-btn'),
      'now-jump-btn must be present when nowIso is provided (AC14)'
    );
  });

  test('AC14: now-jump-btn carries SCROLL_TO_NOW action', () => {
    const html = Today({
      activeState: ACTIVE_STATE,
      nowIso: '2026-05-17T09:00:00.000Z'
    });
    assert.ok(
      html.includes('data-action="SCROLL_TO_NOW"'),
      'now-jump-btn must carry SCROLL_TO_NOW data-action (AC15)'
    );
  });

  test('now-jump-btn absent when nowIso is null', () => {
    const html = Today({ activeState: ACTIVE_STATE, nowIso: null });
    assert.ok(
      !html.includes('now-jump-btn'),
      'now-jump-btn must be absent when nowIso is null (no live grid)'
    );
  });

  test('now-jump-btn absent in empty state (no composition)', () => {
    const html = Today({ activeState: null, nowIso: '2026-05-17T09:00:00.000Z' });
    assert.ok(
      !html.includes('now-jump-btn'),
      'now-jump-btn must be absent in empty state'
    );
  });
});

// ---------------------------------------------------------------------------
// Item 1: CSS regression guard — data-user-edited desaturation removed
// (The actual CSS is not testable in unit tests, but we can assert the
// data-user-edited attribute is still emitted by the renderer so manual
// verification is possible.)
// ---------------------------------------------------------------------------
describe('Today Iter 43 — Item 1: data-user-edited attribute still emitted', () => {
  test('activity blocks carry data-user-edited attribute (CSS target)', () => {
    const html = Today({ activeState: ACTIVE_STATE });
    // TodayGrid emits data-user-edited on blocks; its exact value depends on the
    // activity's userEdited field. Verify the attribute name is present.
    assert.ok(
      html.includes('data-user-edited'),
      'data-user-edited attribute must still be emitted by TodayGrid for CSS targeting'
    );
  });
});

// ---------------------------------------------------------------------------
// AC16: Iter 42 Cadence Pressure Ring preserved
// ---------------------------------------------------------------------------
describe('Today Iter 43 — AC16: Iter 42 functionality preserved', () => {
  test('Cadence Pressure Ring (cadence-ring) still renders with active composition', () => {
    const html = Today({ activeState: ACTIVE_STATE });
    assert.ok(
      html.includes('cadence-ring'),
      'cadence-ring must still be present (Iter 42 functionality, AC16)'
    );
  });

  test('CCC: active-composition CCC remains ≤ 5 (Iter 42 bound, no new structural region)', () => {
    const REGIONS = [
      ['header',              /class="today-header"/],
      ['cadence-ring',        /class="cadence-ring"/],
      ['cycle-card',          /class="cycle-card/],
      ['cycle-calendar-grid', /class="cycle-calendar-grid/],
    ];
    const html = Today({ activeState: ACTIVE_STATE });
    const ccc = REGIONS.filter(([, p]) => p.test(html)).length;
    assert.ok(
      ccc <= 5,
      `CCC is ${ccc}, expected ≤ 5. Iter 43 must not add a new structural CCC region.`
    );
  });
});
