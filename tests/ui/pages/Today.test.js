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
// Iter 25 — column header labels + Update button guards
// ---------------------------------------------------------------------------
describe('Today — Iter 25: column headers in activity list', () => {
  test('AC4: column header row renders "Time of Day"', () => {
    const html = Today({ activeState: ACTIVE_STATE });
    assert.ok(html.includes('Time of Day'), 'Expected "Time of Day" column header');
  });

  test('AC4: column header row renders "Focus Area"', () => {
    const html = Today({ activeState: ACTIVE_STATE });
    assert.ok(html.includes('Focus Area'), 'Expected "Focus Area" column header');
  });

  test('AC4: column header row renders "Standard Work Name"', () => {
    const html = Today({ activeState: ACTIVE_STATE });
    assert.ok(html.includes('Standard Work Name'), 'Expected "Standard Work Name" column header');
  });

  test('AC4: column header row renders "Planned Duration"', () => {
    const html = Today({ activeState: ACTIVE_STATE });
    assert.ok(html.includes('Planned Duration'), 'Expected "Planned Duration" column header');
  });

  test('AC4: column header row renders "Expected Output"', () => {
    const html = Today({ activeState: ACTIVE_STATE });
    assert.ok(html.includes('Expected Output'), 'Expected "Expected Output" column header');
  });

  test('AC4: column header row renders "Update" header', () => {
    const html = Today({ activeState: ACTIVE_STATE });
    assert.ok(html.includes('Update'), 'Expected "Update" column header');
  });

  test('AC5: column header row uses role="columnheader" semantics', () => {
    const html = Today({ activeState: ACTIVE_STATE });
    assert.match(html, /role="columnheader"/, 'Expected role="columnheader" for a11y');
  });

  test('AC6: non-protected activity row has an Update button in ACCEPTED state', () => {
    // P0 fix (2026-04-30): Update button must appear in ACCEPTED state (activities
    // are SCHEDULED and the user can legitimately adjust duration post-accept).
    const acceptedState = {
      composition: { ...ACTIVE_STATE.composition, state: 'ACCEPTED' },
      activities: ACTIVE_STATE.activities.map((a) => ({ ...a, state: 'SCHEDULED' }))
    };
    const html = Today({ activeState: acceptedState });
    assert.match(html, /data-action="EDIT_QUICK_UPDATE"/, 'Expected EDIT_QUICK_UPDATE action on Update button in ACCEPTED state');
  });

  test('AC6b: Update button is ABSENT in PROPOSED state (P0 fix guard)', () => {
    // P0 fix (2026-04-30): Update button must NOT appear in PROPOSED state.
    // Clicking Update→Commit on PROPOSED transitions the composition to EDITED
    // with PROPOSED (not SCHEDULED) activities — no Accept/Start/Skip buttons
    // are shown, leaving the user stuck. The PROPOSED triad (Accept/Edit/Reject)
    // handles all plan decisions; Update is only meaningful post-accept.
    const html = Today({ activeState: ACTIVE_STATE });
    assert.ok(
      !html.includes('data-action="EDIT_QUICK_UPDATE"'),
      'Update button must NOT appear in PROPOSED state (stuck-state prevention)'
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
