/**
 * Tests for the Today page container — pure render.
 *
 * Phase A update: Removed describe blocks for MorningRecap, RhythmExplainer,
 * WhyThisPlan, and EodClosureStrip presence on the Today page — these are no
 * longer rendered by Today.js. Those components are now tested via CycleCard
 * (WhyThisPlan, MorningRecap) or moved to _backup (RhythmExplainer,
 * EodClosureStrip). Removed AC10-*, AC12-*, AC3-* describe blocks (~280 lines).
 *
 * Retained: empty state, first-run, loaded state, ACCEPTED, REJECTED,
 * infeasible, loading, adherence passthrough, C-UX-13 BucketStrip labels.
 *
 * New guards: confirm removed components do NOT appear in Today output.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { Today, TODAY_COPY } from '../../../js/ui/pages/Today.js';
import { DEFAULT_TARGETS } from '../../../js/ui/components/BucketStrip.js';

const ACTIVE_STATE = {
  composition: {
    id: 'comp_today',
    userId: 'user_phil_mvp',
    state: 'PROPOSED',
    cycleType: 'DAILY'
  },
  activities: [
    {
      id: 'sa_standup',
      name: 'Daily Standup',
      bucket: 'COMMUNICATION',
      plannedDurationMinutes: 15,
      plannedStartAt: '09:00',
      state: 'PROPOSED'
    },
    {
      id: 'sa_focus',
      name: 'Deep Work',
      bucket: 'PROJECT',
      plannedDurationMinutes: 120,
      plannedStartAt: '10:00',
      state: 'PROPOSED'
    }
  ]
};

describe('Today — empty state (no active composition)', () => {
  test('renders the EMPTY copy', () => {
    const html = Today({ activeState: null });
    assert.match(html, new RegExp(TODAY_COPY.EMPTY));
  });

  test('renders an Auto-Plan primary button', () => {
    const html = Today({ activeState: null });
    assert.match(html, /auto-plan-btn[^"]*primary/);
    assert.match(html, /data-action="AUTO_PLAN"/);
  });

  test('root element has data-route="today"', () => {
    const html = Today({ activeState: null });
    assert.match(html, /data-route="today"/);
  });

  test('no CycleCard in empty state', () => {
    const html = Today({ activeState: null });
    assert.ok(!html.includes('cycle-card'));
  });
});

describe('Today — first-run variant', () => {
  test('isFirstRun=true uses the welcome copy', () => {
    const html = Today({ activeState: null, isFirstRun: true });
    assert.match(html, new RegExp(TODAY_COPY.FIRST_RUN));
  });

  test('isFirstRun=false uses the empty copy', () => {
    const html = Today({ activeState: null, isFirstRun: false });
    assert.match(html, new RegExp(TODAY_COPY.EMPTY));
  });
});

describe('Today — loaded state with a PROPOSED composition', () => {
  test('renders a CycleCard', () => {
    const html = Today({ activeState: ACTIVE_STATE });
    assert.match(html, /cycle-card/);
    assert.match(html, /cycle-proposed/);
  });

  test('renders the AcceptEditRejectTriad', () => {
    const html = Today({ activeState: ACTIVE_STATE });
    assert.match(html, /data-action="ACCEPT"/);
    assert.match(html, /data-action="EDIT"/);
    assert.match(html, /data-action="REJECT"/);
  });

  test('no empty-state copy on loaded', () => {
    const html = Today({ activeState: ACTIVE_STATE });
    assert.ok(!html.includes(TODAY_COPY.EMPTY));
    assert.ok(!html.includes(TODAY_COPY.FIRST_RUN));
  });

  test('Iter 25: AdherenceDial is NOT rendered (removed from Today header)', () => {
    const html = Today({ activeState: ACTIVE_STATE });
    assert.ok(!html.includes('adherence-dial'), 'adherence-dial must be absent from Today output (Iter 25 removal)');
  });

  test('Iter 25: FineTuneButton is NOT rendered', () => {
    const html = Today({ activeState: ACTIVE_STATE });
    assert.ok(!html.includes('ftd-btn'), 'FineTuneButton must be absent from Today output (Iter 25 removal)');
  });
});

describe('Today — ACCEPTED composition', () => {
  test('renders cycle-accepted', () => {
    const html = Today({
      activeState: {
        composition: { ...ACTIVE_STATE.composition, state: 'ACCEPTED' },
        activities: ACTIVE_STATE.activities.map((a) => ({ ...a, state: 'SCHEDULED' }))
      }
    });
    assert.match(html, /cycle-accepted/);
  });
});

describe('Today — REJECTED composition', () => {
  test('renders cycle-rejected empty state with AutoPlanButton', () => {
    const html = Today({
      activeState: {
        composition: { ...ACTIVE_STATE.composition, state: 'REJECTED' },
        activities: []
      }
    });
    assert.match(html, /cycle-rejected/);
    assert.match(html, /No day scheduled\. Compose again\./);
    assert.match(html, /auto-plan-btn/);
  });
});

describe('Today — infeasible state', () => {
  test('renders the infeasibility copy + explain list + AutoPlanButton', () => {
    const html = Today({
      activeState: null,
      infeasibleExplain: [
        'Required 510 min; capacity 480 min.',
        'Validation failed on OVER_CAPACITY.'
      ]
    });
    assert.match(html, new RegExp(TODAY_COPY.INFEASIBLE));
    assert.match(html, /Required 510 min/);
    assert.match(html, /Validation failed/);
    assert.match(html, /auto-plan-btn/);
  });

  test('empty explain array → normal empty render', () => {
    const html = Today({ activeState: null, infeasibleExplain: [] });
    assert.match(html, new RegExp(TODAY_COPY.EMPTY));
  });
});

describe('Today — loading state', () => {
  test('loading=true while empty → AutoPlanButton in loading mode', () => {
    const html = Today({ activeState: null, loading: true });
    assert.match(html, /Composing…/);
    assert.match(html, /auto-plan-btn[^"]*loading/);
  });
});

describe('Today — daysSinceSignup passthrough (Iter 25)', () => {
  test('daysSinceSignup=14 renders Day 15 badge', () => {
    const html = Today({
      activeState: null,
      daysSinceSignup: 14
    });
    assert.match(html, /Day 15/);
    assert.match(html, /today-day-badge/);
  });

  test('daysSinceSignup via legacy adherence.daysSinceSignup still works', () => {
    const html = Today({
      activeState: null,
      adherence: { daysSinceSignup: 7 }
    });
    assert.match(html, /Day 8/);
  });

  test('no daysSinceSignup → no day badge', () => {
    const html = Today({ activeState: null });
    assert.ok(!html.includes('today-day-badge'));
  });
});

// ---------------------------------------------------------------------------
// Iter 29 — calendar grid replaces the 6-column table
// ---------------------------------------------------------------------------
describe('Today — Iter 29: calendar grid in place of 6-column table', () => {
  test('AC1: Today renders a calendar grid with hour rail (not a table)', () => {
    const html = Today({ activeState: ACTIVE_STATE });
    assert.ok(html.includes('cycle-calendar-grid'), 'cycle-calendar-grid must be present (Iter 29)');
    assert.ok(html.includes('cycle-hour-rail'), 'hour rail must be present');
    assert.ok(!html.includes('sa-col-headers'), 'sa-col-headers must be absent (table replaced)');
  });

  test('AC2: hour rail labels render 07:00 through 19:00', () => {
    const html = Today({ activeState: ACTIVE_STATE });
    // 13 hour labels: 07:00..19:00 inclusive.
    assert.ok(html.includes('07:00'), 'hour rail must include 07:00');
    assert.ok(html.includes('19:00'), 'hour rail must include 19:00');
    assert.ok(html.includes('cycle-hour'), 'cycle-hour spans must be present');
  });

  test('AC3: activity blocks are absolutely positioned via inline style', () => {
    const html = Today({ activeState: ACTIVE_STATE });
    // Blocks rendered with top/height inline styles for positioning.
    // Iter 33: animation-delay is now also included in the style attribute.
    assert.ok(html.includes('cycle-block-positioned'), 'cycle-block-positioned must be present');
    assert.match(html, /style="top: \d+px; height: \d+px/, 'blocks must have inline positioning');
  });

  test('AC4: blocks are colored by bucket via chipClass', () => {
    const acceptedState = {
      composition: { ...ACTIVE_STATE.composition, state: 'ACCEPTED' },
      activities: ACTIVE_STATE.activities.map((a) => ({ ...a, state: 'SCHEDULED' }))
    };
    const html = Today({ activeState: acceptedState });
    // Deep Work is PROJECT → chip-project; Daily Standup is COMMUNICATION → chip-communication.
    assert.ok(html.includes('chip-project'), 'PROJECT block must use chip-project class');
    assert.ok(html.includes('chip-communication'), 'COMMUNICATION block must use chip-communication class');
  });

  test('AC6 (Iter 29): Update button replaced by OPEN_BLOCK_DETAIL click action on blocks', () => {
    // Iter 29: inline Update button removed. Block click opens detail popover (OPEN_BLOCK_DETAIL).
    // EDIT_QUICK_UPDATE is still available from the EditDrawer path.
    const acceptedState = {
      composition: { ...ACTIVE_STATE.composition, state: 'ACCEPTED' },
      activities: ACTIVE_STATE.activities.map((a) => ({ ...a, state: 'SCHEDULED' }))
    };
    const html = Today({ activeState: acceptedState });
    assert.ok(html.includes('OPEN_BLOCK_DETAIL'), 'OPEN_BLOCK_DETAIL action must be on calendar blocks');
    assert.ok(!html.includes('sa-col-headers'), 'column headers must be absent');
  });

  test('AC6b (P0 guard preserved): no EDIT_QUICK_UPDATE inline in PROPOSED state', () => {
    // P0 fix (2026-04-30): Update button must NOT appear in PROPOSED state.
    // Iter 29: this guard is now trivially satisfied since the inline Update button
    // was part of the table (removed). OPEN_BLOCK_DETAIL is used instead, and
    // the popover can conditionally suppress Edit for PROPOSED blocks.
    const html = Today({ activeState: ACTIVE_STATE });
    assert.ok(
      !html.includes('data-action="EDIT_QUICK_UPDATE"'),
      'EDIT_QUICK_UPDATE must not appear in PROPOSED state (stuck-state prevention preserved)'
    );
  });
});

// ---------------------------------------------------------------------------
// Phase A guards — removed components must NOT appear in Today output.
// AC1: zero morning-recap, AC2: zero rhythm-explainer,
// AC3: zero now-pane + up-next-rail, AC4: zero why-this-plan (top-level) + eod-closure-strip.
// ---------------------------------------------------------------------------
describe('Today — Phase A: removed components absent from Today output (AC1–AC4)', () => {
  test('AC1: no morning-recap in Today output (now in CycleCard)', () => {
    // MorningRecap is now rendered inside CycleCard, not directly by Today.
    // Today.js no longer has the MorningRecap import or render call.
    // This guard confirms the old direct-render path is gone.
    // (CycleCard tests cover MorningRecap disclosure functionality.)
    const html = Today({ activeState: null });
    assert.ok(!html.includes('morning-recap'), 'morning-recap must not be rendered by Today.js directly in empty state');
  });

  test('AC2: no rhythm-explainer in Today output', () => {
    const html = Today({ activeState: null });
    assert.ok(!html.includes('rhythm-explainer'), 'rhythm-explainer must not render (moved to _backup)');
  });

  test('AC2: no rhythm-explainer even with active composition', () => {
    const html = Today({ activeState: ACTIVE_STATE });
    assert.ok(!html.includes('rhythm-explainer'), 'rhythm-explainer must not render (moved to _backup)');
  });

  test('AC3: no now-pane in Today output', () => {
    const html = Today({
      activeState: ACTIVE_STATE,
      nowIso: '2026-04-27T09:30:00Z'
    });
    assert.ok(!html.includes('now-pane'), 'now-pane must not render (moved to _backup; compensated by aria-live in CycleCard)');
  });

  test('AC3: no up-next-rail in Today output', () => {
    const html = Today({
      activeState: ACTIVE_STATE,
      nowIso: '2026-04-27T09:30:00Z'
    });
    assert.ok(!html.includes('up-next-rail'), 'up-next-rail must not render in Today (source kept for Week.js)');
  });

  test('AC4: no eod-closure-strip at top level in Today output', () => {
    // EodClosureStrip component removed; EOD CTA relocated to CycleCard footer.
    const html = Today({
      activeState: ACTIVE_STATE,
      eodRecap: { closedCount: 5, totalCount: 5, skippedCount: 0, pendingReflectionCount: 2 }
    });
    assert.ok(!html.includes('eod-closure-strip'), 'eod-closure-strip class must not appear (EodClosureStrip moved to _backup; CTA in cycle-eod-footer)');
  });

  test('A4: EOD_OPEN_REFLECTION action still reachable when eodRecap has pending reflections', () => {
    const html = Today({
      activeState: ACTIVE_STATE,
      eodRecap: { closedCount: 5, totalCount: 5, skippedCount: 0, pendingReflectionCount: 2 }
    });
    assert.ok(html.includes('EOD_OPEN_REFLECTION'), 'EOD_OPEN_REFLECTION data-action must be present inside CycleCard footer');
  });

  test('A4: no EOD_OPEN_REFLECTION when pendingReflectionCount is 0', () => {
    const html = Today({
      activeState: ACTIVE_STATE,
      eodRecap: { closedCount: 5, totalCount: 5, skippedCount: 0, pendingReflectionCount: 0 }
    });
    assert.ok(!html.includes('EOD_OPEN_REFLECTION'), 'EOD_OPEN_REFLECTION must not appear when pending=0');
  });

  test('A5: aria-live polite current-activity summary in CycleCard header', () => {
    const html = Today({ activeState: ACTIVE_STATE });
    assert.match(html, /aria-live="polite"/, 'CycleCard header must include aria-live="polite" for current-activity announcement');
  });
});

// ---------------------------------------------------------------------------
// Iter 30 — BlockDetailDialog rendering via blockDetail prop
// ---------------------------------------------------------------------------
describe('Today — Iter 30: BlockDetailDialog rendered when blockDetail set', () => {
  const ACTIVE_STATE_WITH_IDS = {
    composition: {
      id: 'comp_today',
      userId: 'user_phil_mvp',
      state: 'ACCEPTED',
      cycleType: 'DAILY'
    },
    activities: [
      {
        id: 'sa_focus_block',
        name: 'Deep Work Session',
        bucket: 'PROJECT',
        plannedDurationMinutes: 120,
        plannedStartAt: '09:00',
        state: 'SCHEDULED',
        catalogEntryId: 'cat_deep_work'
      },
      {
        id: 'sa_standup',
        name: 'Daily Standup',
        bucket: 'COMMUNICATION',
        plannedDurationMinutes: 15,
        plannedStartAt: '11:00',
        state: 'SCHEDULED',
        catalogEntryId: 'cer_daily_standup'
      }
    ]
  };

  test('AC3: BlockDetailDialog renders when blockDetail is non-null', () => {
    const html = Today({
      activeState: ACTIVE_STATE_WITH_IDS,
      blockDetail: { activityId: 'sa_focus_block' }
    });
    assert.ok(html.includes('bdd-modal'), 'bdd-modal must be present when blockDetail is set');
    assert.ok(html.includes('Deep Work Session'), 'activity name must appear in detail dialog');
  });

  test('AC3: BlockDetailDialog NOT rendered when blockDetail is null', () => {
    const html = Today({
      activeState: ACTIVE_STATE_WITH_IDS,
      blockDetail: null
    });
    assert.ok(!html.includes('bdd-modal'), 'bdd-modal must be absent when blockDetail is null');
  });

  test('AC8: dialog has role="dialog" + aria-modal="true"', () => {
    const html = Today({
      activeState: ACTIVE_STATE_WITH_IDS,
      blockDetail: { activityId: 'sa_focus_block' }
    });
    assert.match(html, /role="dialog"/);
    assert.match(html, /aria-modal="true"/);
  });
});

// ---------------------------------------------------------------------------
// Iter 37 — renderBucketStrip() canonical default targets (bug fix)
// Verifies that the right-margin cycle-bucket-strip uses BucketStrip.DEFAULT_TARGETS
// as fallback (240/120/120) not the old Iter 33 invented values (270/120/240).
// ---------------------------------------------------------------------------
describe('Today — Iter 37: renderBucketStrip uses canonical DEFAULT_TARGETS', () => {
  const ACTIVITIES_ALL_BUCKETS = [
    {
      id: 'sa_deep',
      name: 'Deep Work',
      bucket: 'PROJECT',
      plannedDurationMinutes: 120,
      plannedStartAt: '09:00',
      state: 'SCHEDULED'
    },
    {
      id: 'sa_standup',
      name: 'Daily Standup',
      bucket: 'COMMUNICATION',
      plannedDurationMinutes: 30,
      plannedStartAt: '11:00',
      state: 'SCHEDULED'
    },
    {
      id: 'sa_retro',
      name: 'Retrospective',
      bucket: 'CI',
      plannedDurationMinutes: 60,
      plannedStartAt: '14:00',
      state: 'SCHEDULED'
    }
  ];

  const STATE_NO_TARGETS = {
    composition: {
      id: 'comp_iter37',
      userId: 'user_phil_mvp',
      state: 'ACCEPTED',
      cycleType: 'DAILY'
      // intentionally NO targets field — forces fallback to DEFAULT_TARGETS
    },
    activities: ACTIVITIES_ALL_BUCKETS
  };

  test('AC2: PROJECT target display is 4h (240m), not 4h 30m (270m)', () => {
    const html = Today({ activeState: STATE_NO_TARGETS });
    // The bucket strip formats 240m as "4h" and shows "target 4h".
    assert.ok(html.includes('cycle-bucket-strip'), 'cycle-bucket-strip must be present');
    assert.ok(
      html.includes('target 4h'),
      'PROJECT target must show 4h (240m from DEFAULT_TARGETS), not 4h 30m (old buggy 270)'
    );
    assert.ok(
      !html.includes('target 4h 30m'),
      'old buggy PROJECT target 270m (4h 30m) must not appear'
    );
  });

  test('AC4: CI target display is 2h (120m), not 4h (240m)', () => {
    const html = Today({ activeState: STATE_NO_TARGETS });
    // CI planned=60m, target=120m → "target 2h"
    // Old bug: target=240m → "target 4h" which would collide with PROJECT target in a wrong way;
    // now the only "target 4h" is for PROJECT, and CI must show "target 2h".
    const matches = [...html.matchAll(/target 2h/g)];
    assert.ok(
      matches.length >= 2,
      'Both COMMUNICATION (2h) and CI (2h) must show "target 2h" — CI target must be 120m not 240m'
    );
  });

  test('AC8: composition.targets values override DEFAULT_TARGETS when present', () => {
    const stateWithTargets = {
      composition: {
        id: 'comp_iter37_override',
        userId: 'user_phil_mvp',
        state: 'ACCEPTED',
        cycleType: 'DAILY',
        targets: { PROJECT: 300, COMMUNICATION: 90, CI: 90 }
      },
      activities: ACTIVITIES_ALL_BUCKETS
    };
    const html = Today({ activeState: stateWithTargets });
    // 300m = 5h, 90m = 1h 30m
    assert.ok(html.includes('target 5h'), 'explicit PROJECT target 300m must render as "target 5h"');
    assert.ok(
      !html.includes('target 4h'),
      'DEFAULT_TARGETS PROJECT (4h) must not appear when composition provides explicit targets'
    );
  });

  test('DEFAULT_TARGETS export is 240/120/120 (contract check)', () => {
    assert.equal(DEFAULT_TARGETS.PROJECT, 240);
    assert.equal(DEFAULT_TARGETS.COMMUNICATION, 120);
    assert.equal(DEFAULT_TARGETS.CI, 120);
  });
});
