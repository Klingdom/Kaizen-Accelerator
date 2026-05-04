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

  test('AdherenceDial header always renders', () => {
    const html = Today({ activeState: ACTIVE_STATE });
    assert.match(html, /adherence-dial/);
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

describe('Today — adherence passthrough', () => {
  test('passes adherence props to AdherenceDial', () => {
    const html = Today({
      activeState: null,
      adherence: {
        adherencePct: 82,
        acceptancePct: 91,
        kaizenDeltaPct: 14,
        daysSinceSignup: 14
      }
    });
    assert.match(html, />82%</);
    assert.match(html, />91%</);
    assert.match(html, />\+14%</);
  });

  test('default adherence → empty dial copy', () => {
    const html = Today({ activeState: null });
    assert.match(html, /Building your baseline/);
  });
});

// ---------------------------------------------------------------------------
// C-UX-13 — BucketStrip BalanceMeter labels
// ---------------------------------------------------------------------------
describe('Today — C-UX-13 BucketStrip label rename', () => {
  test('AC13-5: renders "Deep Work" label in active state', () => {
    const html = Today({ activeState: ACTIVE_STATE });
    assert.ok(html.includes('Deep Work'), `Expected "Deep Work" label. HTML snippet: ${html.slice(0, 1000)}`);
  });

  test('AC13-5: renders "Communication" label in active state', () => {
    const html = Today({ activeState: ACTIVE_STATE });
    assert.ok(html.includes('Communication'), `Expected "Communication" label.`);
  });

  test('AC13-5: renders "Improvement" label in active state', () => {
    const html = Today({ activeState: ACTIVE_STATE });
    assert.ok(html.includes('Improvement'), `Expected "Improvement" label.`);
  });

  test('AC13-6: chip-project class string is preserved', () => {
    const html = Today({ activeState: ACTIVE_STATE });
    assert.ok(html.includes('chip-project') || html.includes('bucket-project'), `Expected class. HTML snippet: ${html.slice(0, 1000)}`);
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
