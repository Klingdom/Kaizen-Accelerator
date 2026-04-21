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
