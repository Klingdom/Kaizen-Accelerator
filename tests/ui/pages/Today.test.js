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
