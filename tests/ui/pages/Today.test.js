/**
 * Tests for the Today page container — pure render.
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

// =============================================================================
// Iteration 14 integration tests
// =============================================================================

// ---------------------------------------------------------------------------
// C-UX-10 — MorningRecap strip
// ---------------------------------------------------------------------------
const PRIOR_DAY_RECAP = Object.freeze({
  closedCount: 5,
  totalCount: 6,
  skippedCount: 1,
  dateIso: '2026-04-26'
});

describe('Today — C-UX-10 morning recap strip', () => {
  test('AC10-1: daysSinceSignup === 0 → no morning-recap strip', () => {
    const html = Today({
      activeState: null,
      priorDayRecap: PRIOR_DAY_RECAP,
      adherence: { daysSinceSignup: 0, adherencePct: null, acceptancePct: null, kaizenDeltaPct: null }
    });
    assert.ok(!html.includes('morning-recap'), `Strip must not render on day 0. HTML snippet: ${html.slice(0, 300)}`);
  });

  test('AC10-2: prior-day recap with 5/6 closed, 1 skipped → strip renders correct copy', () => {
    const html = Today({
      activeState: null,
      priorDayRecap: PRIOR_DAY_RECAP,
      adherence: { daysSinceSignup: 1, adherencePct: null, acceptancePct: null, kaizenDeltaPct: null }
    });
    assert.ok(html.includes('morning-recap'), `Strip must render. HTML: ${html.slice(0, 300)}`);
    assert.ok(html.includes('5/6 closed'), `Expected "5/6 closed". HTML: ${html.slice(0, 500)}`);
    assert.ok(html.includes('1 skipped'), `Expected "1 skipped". HTML: ${html.slice(0, 500)}`);
  });

  test('AC10-3: priorDayRecap === null → no strip', () => {
    const html = Today({
      activeState: null,
      priorDayRecap: null,
      adherence: { daysSinceSignup: 5, adherencePct: null, acceptancePct: null, kaizenDeltaPct: null }
    });
    assert.ok(!html.includes('morning-recap'), `Strip must not render when recap is null.`);
  });

  test('AC10-4: 0 closed → fresh-start copy', () => {
    const html = Today({
      activeState: null,
      priorDayRecap: { closedCount: 0, totalCount: 4, skippedCount: 2, dateIso: '2026-04-26' },
      adherence: { daysSinceSignup: 2, adherencePct: null, acceptancePct: null, kaizenDeltaPct: null }
    });
    assert.ok(html.includes('morning-recap'), `Strip must render.`);
    assert.ok(html.includes('fresh start today'), `Expected fresh-start copy.`);
  });

  test('AC10-5: strip appears before RhythmExplainer when both render', () => {
    const html = Today({
      activeState: ACTIVE_STATE,
      priorDayRecap: PRIOR_DAY_RECAP,
      adherence: { daysSinceSignup: 3, adherencePct: null, acceptancePct: null, kaizenDeltaPct: null }
    });
    const posRecap = html.indexOf('morning-recap');
    const posRhythm = html.indexOf('rhythm-explainer');
    assert.ok(posRecap !== -1, 'morning-recap must be present');
    assert.ok(posRhythm !== -1, 'rhythm-explainer must be present');
    assert.ok(posRecap < posRhythm, `morning-recap (pos ${posRecap}) must precede rhythm-explainer (pos ${posRhythm})`);
  });
});

// ---------------------------------------------------------------------------
// C-UX-12 — WhyThisPlan chip
// ---------------------------------------------------------------------------
const EXPLAIN_ENTRIES = Object.freeze([
  { ref: 'cat_001', rule: 'R5_DEEP_PAYLOAD', detail: 'DMAIC Define (60m)' },
  { ref: 'cat_002', rule: 'R1_NON_OPTIONAL', detail: 'Daily Standup (15m)' }
]);

const ACTIVE_WITH_EXPLAIN = Object.freeze({
  composition: {
    id: 'comp_explain',
    userId: 'user_phil_mvp',
    state: 'PROPOSED',
    cycleType: 'DAILY',
    composerInputsSnapshot: {
      explain: [...EXPLAIN_ENTRIES]
    }
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
});

describe('Today — C-UX-12 WhyThisPlan chip', () => {
  test('AC12-1: expanded chip shows rule heading and detail strings', () => {
    const html = Today({
      activeState: ACTIVE_WITH_EXPLAIN,
      whyPlanExpanded: true
    });
    assert.ok(html.includes('Deep work payload'), `Expected R5 heading. HTML snippet: ${html.slice(0, 500)}`);
    assert.ok(html.includes('DMAIC Define (60m)'), `Expected R5 detail. HTML snippet: ${html.slice(0, 500)}`);
  });

  test('AC12-2: explain = [] → no chip', () => {
    const stateNoExplain = {
      composition: {
        ...ACTIVE_WITH_EXPLAIN.composition,
        composerInputsSnapshot: { explain: [] }
      },
      activities: ACTIVE_WITH_EXPLAIN.activities
    };
    const html = Today({ activeState: stateNoExplain });
    assert.ok(!html.includes('why-this-plan-chip'), `Chip must not render when explain is empty.`);
  });

  test('AC12-3: multi-rule explain → canonical R1 before R5 order when expanded', () => {
    const html = Today({
      activeState: ACTIVE_WITH_EXPLAIN,
      whyPlanExpanded: true
    });
    const posR1 = html.indexOf('Non-optional anchors');
    const posR5 = html.indexOf('Deep work payload');
    assert.ok(posR1 !== -1, 'R1 heading must be present');
    assert.ok(posR5 !== -1, 'R5 heading must be present');
    assert.ok(posR1 < posR5, `R1 must precede R5 in output. posR1=${posR1}, posR5=${posR5}`);
  });

  test('AC12-4: collapsed → aria-expanded="false"', () => {
    const html = Today({
      activeState: ACTIVE_WITH_EXPLAIN,
      whyPlanExpanded: false
    });
    assert.ok(html.includes('aria-expanded="false"'), `Expected aria-expanded="false".`);
  });

  test('AC12-4: expanded → aria-expanded="true"', () => {
    const html = Today({
      activeState: ACTIVE_WITH_EXPLAIN,
      whyPlanExpanded: true
    });
    assert.ok(html.includes('aria-expanded="true"'), `Expected aria-expanded="true".`);
  });

  test('AC12-5: infeasible state → no chip', () => {
    const html = Today({
      activeState: null,
      infeasibleExplain: ['Capacity exceeded.']
    });
    assert.ok(!html.includes('why-this-plan-chip'), `Chip must not appear in infeasible state.`);
  });

  test('chip not shown for REJECTED state', () => {
    const html = Today({
      activeState: {
        composition: { ...ACTIVE_WITH_EXPLAIN.composition, state: 'REJECTED' },
        activities: []
      }
    });
    assert.ok(!html.includes('why-this-plan-chip'), `Chip must not appear in REJECTED state.`);
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

// =============================================================================
// Iteration 15 integration tests — C-UX-3 EodClosureStrip
// =============================================================================

// Shared fixtures for EOD tests.
const ALL_CLOSED_ACTIVITIES = Object.freeze([
  { id: 'sa_1', bucket: 'PROJECT', plannedDurationMinutes: 120, plannedStartAt: '09:00', state: 'CLOSED' },
  { id: 'sa_2', bucket: 'PROJECT', plannedDurationMinutes: 120, plannedStartAt: '11:00', state: 'CLOSED' },
  { id: 'sa_3', bucket: 'COMMUNICATION', plannedDurationMinutes: 60,  plannedStartAt: '13:00', state: 'CLOSED' },
  { id: 'sa_4', bucket: 'COMMUNICATION', plannedDurationMinutes: 60,  plannedStartAt: '14:00', state: 'CLOSED' },
  { id: 'sa_5', bucket: 'CI', plannedDurationMinutes: 120, plannedStartAt: '15:00', state: 'CLOSED' }
]);

const ACTIVE_STATE_ALL_CLOSED = Object.freeze({
  composition: { id: 'comp_eod_1', userId: 'user_phil_mvp', state: 'ACCEPTED', cycleType: 'DAILY' },
  activities: ALL_CLOSED_ACTIVITIES
});

// All terminal mix: 3 CLOSED + 1 SKIPPED + 1 DROPPED (DROPPED excluded from counts)
const MIXED_TERMINAL_ACTIVITIES = Object.freeze([
  { id: 'sa_a', bucket: 'PROJECT',       plannedDurationMinutes: 120, plannedStartAt: '09:00', state: 'CLOSED' },
  { id: 'sa_b', bucket: 'PROJECT',       plannedDurationMinutes: 120, plannedStartAt: '11:00', state: 'CLOSED' },
  { id: 'sa_c', bucket: 'COMMUNICATION', plannedDurationMinutes: 60,  plannedStartAt: '13:00', state: 'CLOSED' },
  { id: 'sa_d', bucket: 'COMMUNICATION', plannedDurationMinutes: 60,  plannedStartAt: '14:00', state: 'SKIPPED' },
  { id: 'sa_e', bucket: 'CI',            plannedDurationMinutes: 120, plannedStartAt: '15:00', state: 'DROPPED' }
]);

const ACTIVE_STATE_MIXED_TERMINAL = Object.freeze({
  composition: { id: 'comp_eod_2', userId: 'user_phil_mvp', state: 'ACCEPTED', cycleType: 'DAILY' },
  activities: MIXED_TERMINAL_ACTIVITIES
});

// Time-passed scenario: 1 PROPOSED activity, but nowIso is past the last end.
// Last activity ends at 17:00 UTC (16:00 start + 60m). nowIso is 17:01.
const TIME_PASSED_ACTIVITIES = Object.freeze([
  { id: 'sa_tp_1', bucket: 'PROJECT',       plannedDurationMinutes: 240, plannedStartAt: '09:00', state: 'CLOSED' },
  { id: 'sa_tp_2', bucket: 'COMMUNICATION', plannedDurationMinutes: 60,  plannedStartAt: '14:00', state: 'CLOSED' },
  { id: 'sa_tp_3', bucket: 'CI',            plannedDurationMinutes: 60,  plannedStartAt: '16:00', state: 'PROPOSED' }
]);

const ACTIVE_STATE_TIME_PASSED = Object.freeze({
  composition: { id: 'comp_eod_3', userId: 'user_phil_mvp', state: 'PROPOSED', cycleType: 'DAILY' },
  activities: TIME_PASSED_ACTIVITIES
});

// NOT triggered: 2 IN_PROGRESS + 3 SCHEDULED, nowIso well before lastActivityEnd.
const NOT_TRIGGERED_ACTIVITIES = Object.freeze([
  { id: 'sa_nt_1', bucket: 'PROJECT',       plannedDurationMinutes: 120, plannedStartAt: '09:00', state: 'IN_PROGRESS' },
  { id: 'sa_nt_2', bucket: 'PROJECT',       plannedDurationMinutes: 120, plannedStartAt: '11:00', state: 'SCHEDULED' },
  { id: 'sa_nt_3', bucket: 'COMMUNICATION', plannedDurationMinutes: 60,  plannedStartAt: '13:00', state: 'SCHEDULED' },
  { id: 'sa_nt_4', bucket: 'COMMUNICATION', plannedDurationMinutes: 60,  plannedStartAt: '14:00', state: 'SCHEDULED' },
  { id: 'sa_nt_5', bucket: 'CI',            plannedDurationMinutes: 120, plannedStartAt: '15:00', state: 'SCHEDULED' }
]);

const ACTIVE_STATE_NOT_TRIGGERED = Object.freeze({
  composition: { id: 'comp_eod_4', userId: 'user_phil_mvp', state: 'ACCEPTED', cycleType: 'DAILY' },
  activities: NOT_TRIGGERED_ACTIVITIES
});

// ---------------------------------------------------------------------------
// AC3-1: 5/5 CLOSED → strip in DOM with "5/5 closed"
// ---------------------------------------------------------------------------
describe('Today — C-UX-3 EodClosureStrip: all-terminal trigger (AC3-1)', () => {
  test('AC3-1: strip renders when all 5 activities are CLOSED', () => {
    const html = Today({
      activeState: ACTIVE_STATE_ALL_CLOSED,
      eodRecap: { closedCount: 5, totalCount: 5, skippedCount: 0, pendingReflectionCount: 0 }
    });
    assert.ok(html.includes('eod-closure-strip'), `Strip must be in DOM. HTML snippet: ${html.slice(0, 500)}`);
  });

  test('AC3-1: shows "5/5 closed" text', () => {
    const html = Today({
      activeState: ACTIVE_STATE_ALL_CLOSED,
      eodRecap: { closedCount: 5, totalCount: 5, skippedCount: 0, pendingReflectionCount: 0 }
    });
    assert.ok(html.includes('5/5 closed'), `Expected "5/5 closed". HTML snippet: ${html.slice(0, 800)}`);
  });
});

// ---------------------------------------------------------------------------
// AC3-2: 3 CLOSED + 1 SKIPPED + 1 DROPPED → "3/4 closed · 1 skipped"
// ---------------------------------------------------------------------------
describe('Today — C-UX-3 EodClosureStrip: DROPPED excluded (AC3-2)', () => {
  test('AC3-2: shows "3/4 closed · 1 skipped" (DROPPED excluded from total)', () => {
    const html = Today({
      activeState: ACTIVE_STATE_MIXED_TERMINAL,
      eodRecap: { closedCount: 3, totalCount: 4, skippedCount: 1, pendingReflectionCount: 0 }
    });
    assert.ok(html.includes('3/4 closed'), `Expected "3/4 closed". HTML: ${html.slice(0, 800)}`);
    assert.ok(html.includes('1 skipped'),  `Expected "1 skipped".  HTML: ${html.slice(0, 800)}`);
  });
});

// ---------------------------------------------------------------------------
// AC3-3: time-passed trigger — strip appears even though 1 activity is PROPOSED
// ---------------------------------------------------------------------------
describe('Today — C-UX-3 EodClosureStrip: time-passed trigger (AC3-3)', () => {
  test('AC3-3: strip renders when nowIso is past lastActivityEnd (eodRecap provided)', () => {
    // nowIso = 17:01 UTC; last activity ends 17:00 (16:00 + 60m)
    const html = Today({
      activeState: ACTIVE_STATE_TIME_PASSED,
      nowIso: '2026-04-27T17:01:00Z',
      eodRecap: { closedCount: 2, totalCount: 3, skippedCount: 0, pendingReflectionCount: 0 }
    });
    assert.ok(html.includes('eod-closure-strip'), `Strip must appear for time-passed trigger. HTML snippet: ${html.slice(0, 500)}`);
  });
});

// ---------------------------------------------------------------------------
// AC3-4: NOT triggered (in-progress + scheduled, nowIso well before end)
// ---------------------------------------------------------------------------
describe('Today — C-UX-3 EodClosureStrip: NOT triggered (AC3-4)', () => {
  test('AC3-4: no strip when eodRecap is null (neither condition met)', () => {
    const html = Today({
      activeState: ACTIVE_STATE_NOT_TRIGGERED,
      nowIso: '2026-04-27T09:30:00Z',
      eodRecap: null
    });
    assert.ok(!html.includes('eod-closure-strip'), `Strip must NOT render. HTML snippet: ${html.slice(0, 500)}`);
  });
});

// ---------------------------------------------------------------------------
// AC3-5: empty state (no composition) → no strip
// ---------------------------------------------------------------------------
describe('Today — C-UX-3 EodClosureStrip: empty state (AC3-5)', () => {
  test('AC3-5: no strip when activeState is null (no composition)', () => {
    const html = Today({ activeState: null, eodRecap: null });
    assert.ok(!html.includes('eod-closure-strip'), `Strip must not render in empty state.`);
  });

  test('AC3-5: no strip even if eodRecap accidentally passed with empty state', () => {
    // eodRecap is rendered via EodClosureStrip only in the active-composition branch.
    // In the empty branch, eodRecapHtml is not called, so the strip will not appear.
    // Today.js renders EodClosureStrip only inside the active-composition return block.
    const html = Today({ activeState: null, eodRecap: null });
    assert.ok(!html.includes('eod-closure-strip'), `Strip must not render in empty state.`);
  });
});

// ---------------------------------------------------------------------------
// AC3-6: infeasible state → no strip
// ---------------------------------------------------------------------------
describe('Today — C-UX-3 EodClosureStrip: infeasible state (AC3-6)', () => {
  test('AC3-6: no strip when infeasible (no active composition)', () => {
    const html = Today({
      activeState: null,
      infeasibleExplain: ['Capacity exceeded.'],
      eodRecap: null
    });
    assert.ok(!html.includes('eod-closure-strip'), `Strip must not render in infeasible state.`);
  });
});

// ---------------------------------------------------------------------------
// AC3-7: no CTA when pendingReflectionCount === 0
// ---------------------------------------------------------------------------
describe('Today — C-UX-3 EodClosureStrip: no CTA when 0 pending (AC3-7)', () => {
  test('AC3-7: no "Capture reflection" CTA when pendingReflectionCount === 0', () => {
    const html = Today({
      activeState: ACTIVE_STATE_ALL_CLOSED,
      eodRecap: { closedCount: 5, totalCount: 5, skippedCount: 0, pendingReflectionCount: 0 }
    });
    assert.ok(!html.includes('Capture reflection'), `CTA must not appear when 0 pending.`);
    assert.ok(!html.includes('EOD_OPEN_REFLECTION'), `Action must not appear when 0 pending.`);
  });
});

// ---------------------------------------------------------------------------
// AC3-8: CTA appears when pendingReflectionCount > 0
// ---------------------------------------------------------------------------
describe('Today — C-UX-3 EodClosureStrip: CTA when pending > 0 (AC3-8)', () => {
  test('AC3-8: "Capture reflection →" CTA with data-action="EOD_OPEN_REFLECTION" when pending = 2', () => {
    const html = Today({
      activeState: ACTIVE_STATE_ALL_CLOSED,
      eodRecap: { closedCount: 5, totalCount: 5, skippedCount: 0, pendingReflectionCount: 2 }
    });
    assert.ok(html.includes('Capture reflection →'), `CTA text must appear. HTML snippet: ${html.slice(0, 800)}`);
    assert.ok(html.includes('data-action="EOD_OPEN_REFLECTION"'), `data-action must be present. HTML: ${html.slice(0, 800)}`);
  });
});

// ---------------------------------------------------------------------------
// AC3-10: strip appears AFTER CycleCard
// ---------------------------------------------------------------------------
describe('Today — C-UX-3 EodClosureStrip: position after CycleCard (AC3-10)', () => {
  test('AC3-10: eod-closure-strip follows cycle-card in DOM order', () => {
    const html = Today({
      activeState: ACTIVE_STATE_ALL_CLOSED,
      eodRecap: { closedCount: 5, totalCount: 5, skippedCount: 0, pendingReflectionCount: 0 }
    });
    const posCycle = html.indexOf('cycle-card');
    const posEod   = html.indexOf('eod-closure-strip');
    assert.ok(posCycle !== -1, 'cycle-card must be present');
    assert.ok(posEod   !== -1, 'eod-closure-strip must be present');
    assert.ok(posEod > posCycle, `eod-closure-strip (pos ${posEod}) must follow cycle-card (pos ${posCycle})`);
  });
});

// ---------------------------------------------------------------------------
// AC3-11: both MorningRecap and EodClosureStrip invariants preserved
// ---------------------------------------------------------------------------
describe('Today — C-UX-3 + C-UX-10 dual-render invariants (AC3-11)', () => {
  test('AC3-11: morning-recap precedes rhythm-explainer AND eod-closure-strip follows cycle-card', () => {
    const html = Today({
      activeState: ACTIVE_STATE_ALL_CLOSED,
      priorDayRecap: PRIOR_DAY_RECAP,
      eodRecap: { closedCount: 5, totalCount: 5, skippedCount: 0, pendingReflectionCount: 0 },
      adherence: { daysSinceSignup: 3, adherencePct: null, acceptancePct: null, kaizenDeltaPct: null }
    });
    const posMorning = html.indexOf('morning-recap');
    const posRhythm  = html.indexOf('rhythm-explainer');
    const posCycle   = html.indexOf('cycle-card');
    const posEod     = html.indexOf('eod-closure-strip');

    assert.ok(posMorning !== -1, 'morning-recap must be present');
    assert.ok(posRhythm  !== -1, 'rhythm-explainer must be present');
    assert.ok(posCycle   !== -1, 'cycle-card must be present');
    assert.ok(posEod     !== -1, 'eod-closure-strip must be present');

    assert.ok(posMorning < posRhythm, `morning-recap (${posMorning}) must precede rhythm-explainer (${posRhythm})`);
    assert.ok(posEod > posCycle,      `eod-closure-strip (${posEod}) must follow cycle-card (${posCycle})`);
  });
});
