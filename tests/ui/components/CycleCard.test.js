/**
 * Tests for CycleCard — pure render with 4+ state variants.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  CycleCard,
  CARD_COPY,
  orderActivitiesForDisplay
} from '../../../js/ui/components/CycleCard.js';

const SAMPLE_ACTIVITIES = [
  {
    id: 'sa_standup',
    name: 'Daily Standup',
    bucket: 'COMMUNICATION',
    plannedDurationMinutes: 15,
    plannedStartAt: '09:00',
    state: 'PROPOSED'
  },
  {
    id: 'sa_am_comm',
    name: 'AM High-value Communication',
    bucket: 'COMMUNICATION',
    plannedDurationMinutes: 60,
    plannedStartAt: '09:15',
    state: 'PROPOSED'
  },
  {
    id: 'sa_deep_1',
    name: 'Deep Work (slice 1)',
    bucket: 'PROJECT',
    plannedDurationMinutes: 120,
    plannedStartAt: '10:15',
    state: 'PROPOSED'
  },
  {
    id: 'sa_post_lunch',
    name: 'Post-lunch High-value Communication',
    bucket: 'COMMUNICATION',
    plannedDurationMinutes: 30,
    plannedStartAt: '13:00',
    state: 'PROPOSED'
  },
  {
    id: 'sa_deep_2',
    name: 'Deep Work (slice 2)',
    bucket: 'PROJECT',
    plannedDurationMinutes: 120,
    plannedStartAt: '13:30',
    state: 'PROPOSED'
  },
  {
    id: 'sa_pdca',
    name: 'PDCA Cycle',
    bucket: 'CI',
    plannedDurationMinutes: 30,
    plannedStartAt: '15:30',
    state: 'PROPOSED'
  },
  {
    id: 'sa_ld',
    name: 'L&D Tracker',
    bucket: 'CI',
    plannedDurationMinutes: 60,
    plannedStartAt: '16:00',
    state: 'PROPOSED'
  },
  {
    id: 'sa_eod_refl',
    name: 'End-of-Activity Reflection',
    bucket: 'CI',
    plannedDurationMinutes: 15,
    plannedStartAt: '17:00',
    state: 'PROPOSED'
  }
];

const PROPOSED_COMP = {
  id: 'comp_today',
  userId: 'user_phil_mvp',
  state: 'PROPOSED',
  cycleType: 'DAILY'
};

describe('CycleCard — missing composition', () => {
  test('no composition → cycle-missing placeholder', () => {
    assert.match(CycleCard(), /cycle-missing/);
  });
});

describe('CycleCard — PROPOSED variant', () => {
  test('returns HTML with cycle-proposed class', () => {
    const html = CycleCard({
      composition: PROPOSED_COMP,
      activities: SAMPLE_ACTIVITIES
    });
    assert.match(html, /cycle-proposed/);
    assert.match(html, /data-state="PROPOSED"/);
  });

  test('renders PROPOSED header copy', () => {
    const html = CycleCard({
      composition: PROPOSED_COMP,
      activities: SAMPLE_ACTIVITIES
    });
    assert.match(html, new RegExp(CARD_COPY.PROPOSED_HEADER));
  });

  test('Iter 25: does NOT include BucketStrip (removed)', () => {
    const html = CycleCard({
      composition: PROPOSED_COMP,
      activities: SAMPLE_ACTIVITIES
    });
    assert.ok(!html.includes('bucket-strip'), 'bucket-strip must be absent (Iter 25 removal)');
  });

  test('Iter 25: includes column header row with 6 headers', () => {
    const html = CycleCard({
      composition: PROPOSED_COMP,
      activities: SAMPLE_ACTIVITIES
    });
    assert.ok(html.includes('sa-col-headers'), 'sa-col-headers must be present');
    assert.ok(html.includes('Time of Day'), 'Time of Day header must be present');
    assert.ok(html.includes('Focus Area'), 'Focus Area header must be present');
    assert.ok(html.includes('Standard Work Name'), 'Standard Work Name header must be present');
    assert.ok(html.includes('Planned Duration'), 'Planned Duration header must be present');
    assert.ok(html.includes('Expected Output'), 'Expected Output header must be present');
    assert.match(html, /role="columnheader"/, 'role="columnheader" must be present for a11y');
  });

  test('includes all 8 activity blocks in plan order', () => {
    const html = CycleCard({
      composition: PROPOSED_COMP,
      activities: SAMPLE_ACTIVITIES
    });
    const count = (html.match(/sa-block/g) ?? []).length;
    assert.equal(count, 8);
  });

  test('activities rendered without Start button', () => {
    const html = CycleCard({
      composition: PROPOSED_COMP,
      activities: SAMPLE_ACTIVITIES
    });
    assert.ok(!html.includes('sa-start'));
  });

  test('includes the AcceptEditRejectTriad', () => {
    const html = CycleCard({
      composition: PROPOSED_COMP,
      activities: SAMPLE_ACTIVITIES
    });
    assert.match(html, /class="triad"/);
    assert.match(html, /data-action="ACCEPT"/);
    assert.match(html, /data-action="EDIT"/);
    assert.match(html, /data-action="REJECT"/);
  });

  test('data-composition-id on card root', () => {
    const html = CycleCard({
      composition: PROPOSED_COMP,
      activities: SAMPLE_ACTIVITIES
    });
    assert.match(html, /data-composition-id="comp_today"/);
  });

  test('empty activities list → sa-empty', () => {
    const html = CycleCard({
      composition: PROPOSED_COMP,
      activities: []
    });
    assert.match(html, /sa-empty/);
  });

  test('activity order: 09:00 before 09:15 before 10:15…', () => {
    const html = CycleCard({
      composition: PROPOSED_COMP,
      activities: SAMPLE_ACTIVITIES.slice().reverse()
    });
    const idxStandup = html.indexOf('Daily Standup');
    const idxAmComm = html.indexOf('AM High-value');
    const idxDeep = html.indexOf('Deep Work (slice 1)');
    assert.ok(idxStandup < idxAmComm);
    assert.ok(idxAmComm < idxDeep);
  });
});

describe('CycleCard — ACCEPTED variant', () => {
  const comp = { ...PROPOSED_COMP, state: 'ACCEPTED' };
  const acts = SAMPLE_ACTIVITIES.map((a) => ({ ...a, state: 'SCHEDULED' }));

  test('cycle-accepted class + ACCEPTED state', () => {
    const html = CycleCard({ composition: comp, activities: acts });
    assert.match(html, /cycle-accepted/);
    assert.match(html, /data-state="ACCEPTED"/);
  });

  test('header is ACCEPTED_HEADER (no "composed" suffix)', () => {
    const html = CycleCard({ composition: comp, activities: acts });
    assert.match(html, new RegExp(`<h1[^>]*>${CARD_COPY.ACCEPTED_HEADER}</h1>`));
    assert.ok(!html.includes(CARD_COPY.PROPOSED_HEADER));
  });

  test('activities show Start button (enabled in Sprint 5)', () => {
    const html = CycleCard({ composition: comp, activities: acts });
    assert.match(html, /sa-start/);
    // Sprint 5 drops the Sprint-4 `disabled` flag on the Start button.
    assert.ok(!/sa-start[^>]*\sdisabled/.test(html));
  });

  test('no AcceptEditRejectTriad on ACCEPTED', () => {
    const html = CycleCard({ composition: comp, activities: acts });
    assert.ok(!html.includes('class="triad"'));
  });
});

describe('CycleCard — Sprint 5 why-chip (PROPOSED only)', () => {
  test('renders why-chips on PROPOSED when snapshot.explain matches', () => {
    const comp = {
      ...PROPOSED_COMP,
      composerInputsSnapshot: {
        role: ['PRACTITIONER'],
        capacityMinutes: 480,
        explain: [
          {
            ref: 'cer_daily_standup',
            rule: 'R1_NON_OPTIONAL',
            detail: 'Daily Standup @ 09:00'
          }
        ]
      }
    };
    const html = CycleCard({
      composition: comp,
      activities: [
        {
          id: 'sa_standup',
          catalogEntryId: 'cer_daily_standup',
          name: 'Daily Standup',
          bucket: 'COMMUNICATION',
          plannedStartAt: '09:00',
          plannedDurationMinutes: 15,
          state: 'PROPOSED'
        }
      ]
    });
    assert.match(html, /why-chip/);
    assert.match(html, /R1_NON_OPTIONAL/);
  });

  test('hides why-chip on ACCEPTED composition', () => {
    const comp = {
      ...PROPOSED_COMP,
      state: 'ACCEPTED',
      composerInputsSnapshot: {
        explain: [{ ref: 'cer_daily_standup', rule: 'R1', detail: 'x' }]
      }
    };
    const html = CycleCard({
      composition: comp,
      activities: [
        {
          id: 'sa_standup',
          catalogEntryId: 'cer_daily_standup',
          name: 'Daily Standup',
          bucket: 'COMMUNICATION',
          plannedStartAt: '09:00',
          plannedDurationMinutes: 15,
          state: 'SCHEDULED'
        }
      ]
    });
    assert.ok(!html.includes('why-chip'));
  });
});

describe('CycleCard — ACTIVE variant', () => {
  const comp = { ...PROPOSED_COMP, state: 'ACTIVE' };
  const acts = SAMPLE_ACTIVITIES.map((a, i) =>
    i === 0 ? { ...a, state: 'IN_PROGRESS' } : { ...a, state: 'SCHEDULED' }
  );

  test('cycle-active class + ACTIVE state', () => {
    const html = CycleCard({ composition: comp, activities: acts });
    assert.match(html, /cycle-active/);
    assert.match(html, /data-state="ACTIVE"/);
  });

  test('first in-progress activity is pinned', () => {
    const html = CycleCard({ composition: comp, activities: acts });
    assert.match(html, /pinned/);
  });
});

describe('CycleCard — REJECTED variant', () => {
  const comp = { ...PROPOSED_COMP, state: 'REJECTED' };

  test('cycle-rejected class + empty state copy', () => {
    const html = CycleCard({ composition: comp, activities: [] });
    assert.match(html, /cycle-rejected/);
    assert.match(html, new RegExp(CARD_COPY.REJECTED_EMPTY));
  });

  test('includes AutoPlanButton', () => {
    const html = CycleCard({ composition: comp, activities: [] });
    assert.match(html, /auto-plan-btn/);
    assert.match(html, /data-action="AUTO_PLAN"/);
  });

  test('no triad on REJECTED', () => {
    const html = CycleCard({ composition: comp });
    assert.ok(!html.includes('class="triad"'));
  });

  test('no activities list on REJECTED', () => {
    const html = CycleCard({
      composition: comp,
      activities: SAMPLE_ACTIVITIES
    });
    assert.ok(!html.includes('sa-block'));
  });
});

describe('CycleCard — unknown state', () => {
  test('renders cycle-unknown', () => {
    const html = CycleCard({
      composition: { id: 'c1', state: 'WAT' },
      activities: []
    });
    assert.match(html, /cycle-unknown/);
    assert.match(html, /WAT/);
  });
});

describe('CycleCard — Iter 25: BucketStrip removed, targets props are no-op', () => {
  test('targets/floors/ceilings props are accepted but no longer render BucketStrip', () => {
    const html = CycleCard({
      composition: PROPOSED_COMP,
      activities: SAMPLE_ACTIVITIES,
      targets: { PROJECT: 1200, COMMUNICATION: 600, CI: 600 },
      floors: { PROJECT: 600, COMMUNICATION: 300, CI: 300 },
      ceilings: { PROJECT: 1320, COMMUNICATION: 750, CI: 750 }
    });
    assert.ok(!html.includes('bucket-strip'), 'bucket-strip must be absent even when targets passed');
    assert.ok(html.includes('cycle-activities'), 'cycle-activities must still render');
  });
});

describe('CycleCard.orderActivitiesForDisplay', () => {
  test('sorts by plannedStartAt ascending', () => {
    const out = orderActivitiesForDisplay([
      { id: 'c', plannedStartAt: '13:00' },
      { id: 'a', plannedStartAt: '09:00' },
      { id: 'b', plannedStartAt: '10:00' }
    ]);
    assert.deepEqual(out.map((x) => x.id), ['a', 'b', 'c']);
  });

  test('activities without plannedStartAt sort to end', () => {
    const out = orderActivitiesForDisplay([
      { id: 'a', plannedStartAt: '09:00' },
      { id: 'noTime' },
      { id: 'b', plannedStartAt: '10:00' }
    ]);
    assert.deepEqual(out.map((x) => x.id), ['a', 'b', 'noTime']);
  });

  test('uses anchor as fallback', () => {
    const out = orderActivitiesForDisplay([
      { id: 'b', anchor: '13:00' },
      { id: 'a', anchor: '09:00' }
    ]);
    assert.deepEqual(out.map((x) => x.id), ['a', 'b']);
  });

  test('empty array → empty array', () => {
    assert.deepEqual(orderActivitiesForDisplay([]), []);
  });

  test('non-array → empty array', () => {
    assert.deepEqual(orderActivitiesForDisplay(null), []);
    assert.deepEqual(orderActivitiesForDisplay(undefined), []);
  });

  test('does not mutate input array', () => {
    const input = [
      { id: 'c', plannedStartAt: '13:00' },
      { id: 'a', plannedStartAt: '09:00' }
    ];
    const copy = input.slice();
    orderActivitiesForDisplay(input);
    assert.deepEqual(input, copy);
  });
});

describe('CycleCard — Iter 25: bucket minutes no longer rendered in BucketStrip', () => {
  test('activity durations are visible in sa-duration columns, not BucketStrip', () => {
    const html = CycleCard({
      composition: PROPOSED_COMP,
      activities: SAMPLE_ACTIVITIES
    });
    // BucketStrip is removed; activity durations still render via sa-duration.
    assert.ok(!html.includes('bucket-strip'), 'BucketStrip must be absent');
    assert.ok(html.includes('sa-duration'), 'sa-duration columns must still render');
  });
});

// ---------------------------------------------------------------------------
// Phase A additions — WhyThisPlan disclosure, MorningRecap disclosure,
// EOD CTA footer, aria-live current-activity summary.
// ---------------------------------------------------------------------------

const EXPLAIN_ENTRIES = [
  { ref: 'cat_001', rule: 'R5_DEEP_PAYLOAD', detail: 'DMAIC Define (60m)' },
  { ref: 'cat_002', rule: 'R1_NON_OPTIONAL', detail: 'Daily Standup (15m)' }
];

const PROPOSED_COMP_WITH_EXPLAIN = {
  ...PROPOSED_COMP,
  composerInputsSnapshot: { explain: EXPLAIN_ENTRIES }
};

const PRIOR_DAY_RECAP = {
  closedCount: 4,
  totalCount: 5,
  skippedCount: 1,
  dateIso: '2026-04-27'
};

const EOD_RECAP = {
  closedCount: 5,
  totalCount: 5,
  skippedCount: 0,
  pendingReflectionCount: 2
};

const EOD_RECAP_NO_PENDING = {
  closedCount: 5,
  totalCount: 5,
  skippedCount: 0,
  pendingReflectionCount: 0
};

describe('CycleCard — Phase A: WhyThisPlan disclosure in header (A2)', () => {
  test('A2: WhyThisPlan collapsed button renders in PROPOSED header when explain data present', () => {
    const html = CycleCard({
      composition: PROPOSED_COMP_WITH_EXPLAIN,
      activities: SAMPLE_ACTIVITIES,
      whyPlanExpanded: false
    });
    assert.ok(html.includes('why-this-plan'), 'why-this-plan must be present in CycleCard');
    assert.ok(html.includes('aria-expanded="false"'), 'chip must be collapsed by default');
    assert.ok(html.includes('TOGGLE_WHY_PLAN'), 'toggle action must be wired');
  });

  test('A2: WhyThisPlan expanded when whyPlanExpanded=true', () => {
    const html = CycleCard({
      composition: PROPOSED_COMP_WITH_EXPLAIN,
      activities: SAMPLE_ACTIVITIES,
      whyPlanExpanded: true
    });
    assert.ok(html.includes('aria-expanded="true"'), 'chip must be expanded');
    assert.ok(html.includes('Deep work payload'), 'R5 heading must render when expanded');
    assert.ok(html.includes('DMAIC Define (60m)'), 'detail must render when expanded');
  });

  test('A2: WhyThisPlan absent when explain is empty', () => {
    const compNoExplain = {
      ...PROPOSED_COMP,
      composerInputsSnapshot: { explain: [] }
    };
    const html = CycleCard({
      composition: compNoExplain,
      activities: SAMPLE_ACTIVITIES
    });
    assert.ok(!html.includes('why-this-plan'), 'why-this-plan must not render when explain is empty');
  });

  test('A2: WhyThisPlan absent in ACCEPTED state when no explain data', () => {
    const html = CycleCard({
      composition: { ...PROPOSED_COMP, state: 'ACCEPTED' },
      activities: SAMPLE_ACTIVITIES.map((a) => ({ ...a, state: 'SCHEDULED' }))
    });
    assert.ok(!html.includes('why-this-plan'), 'why-this-plan must not render without explain data');
  });

  test('A2: WhyThisPlan absent during edit mode (not distracting)', () => {
    const html = CycleCard({
      composition: PROPOSED_COMP_WITH_EXPLAIN,
      activities: SAMPLE_ACTIVITIES,
      editMode: true,
      whyPlanExpanded: false
    });
    assert.ok(!html.includes('why-this-plan'), 'why-this-plan must be suppressed in edit mode');
  });
});

describe('CycleCard — Phase A: MorningRecap disclosure in header (A3)', () => {
  test('A3: MorningRecap renders in CycleCard header when priorDayRecap is truthy', () => {
    const html = CycleCard({
      composition: PROPOSED_COMP,
      activities: SAMPLE_ACTIVITIES,
      priorDayRecap: PRIOR_DAY_RECAP
    });
    assert.ok(html.includes('morning-recap'), 'morning-recap must render in CycleCard when priorDayRecap present');
    assert.ok(html.includes('4/5 closed'), 'recap copy must include closed count');
    assert.ok(html.includes('1 skipped'), 'recap copy must include skip count');
  });

  test('A3: MorningRecap absent when priorDayRecap is null', () => {
    const html = CycleCard({
      composition: PROPOSED_COMP,
      activities: SAMPLE_ACTIVITIES,
      priorDayRecap: null
    });
    assert.ok(!html.includes('morning-recap'), 'morning-recap must not render when priorDayRecap is null');
  });

  test('A3: MorningRecap absent when priorDayRecap not provided', () => {
    const html = CycleCard({
      composition: PROPOSED_COMP,
      activities: SAMPLE_ACTIVITIES
    });
    assert.ok(!html.includes('morning-recap'), 'morning-recap must not render when priorDayRecap not provided');
  });

  test('A3: MorningRecap suppressed in edit mode', () => {
    const html = CycleCard({
      composition: PROPOSED_COMP,
      activities: SAMPLE_ACTIVITIES,
      priorDayRecap: PRIOR_DAY_RECAP,
      editMode: true
    });
    assert.ok(!html.includes('morning-recap'), 'morning-recap must be suppressed in edit mode');
  });
});

describe('CycleCard — Phase A: EOD reflection CTA in footer (A4)', () => {
  test('A4: EOD footer renders when eodRecap has pendingReflectionCount > 0', () => {
    const html = CycleCard({
      composition: PROPOSED_COMP,
      activities: SAMPLE_ACTIVITIES,
      eodRecap: EOD_RECAP
    });
    assert.ok(html.includes('cycle-eod-footer'), 'cycle-eod-footer must render when eodRecap present');
    assert.ok(html.includes('EOD_OPEN_REFLECTION'), 'EOD_OPEN_REFLECTION action must be present');
    assert.ok(html.includes('Capture reflection'), 'CTA text must be present');
  });

  test('A4: EOD footer shows counters without CTA when pendingReflectionCount === 0', () => {
    const html = CycleCard({
      composition: PROPOSED_COMP,
      activities: SAMPLE_ACTIVITIES,
      eodRecap: EOD_RECAP_NO_PENDING
    });
    assert.ok(html.includes('cycle-eod-footer'), 'cycle-eod-footer must render even when no pending');
    assert.ok(!html.includes('EOD_OPEN_REFLECTION'), 'EOD_OPEN_REFLECTION must not appear when pending=0');
    assert.ok(html.includes('5/5 closed'), 'counters must still render');
  });

  test('A4: no EOD footer when eodRecap is null', () => {
    const html = CycleCard({
      composition: PROPOSED_COMP,
      activities: SAMPLE_ACTIVITIES,
      eodRecap: null
    });
    assert.ok(!html.includes('cycle-eod-footer'), 'cycle-eod-footer must not render when eodRecap is null');
    assert.ok(!html.includes('EOD_OPEN_REFLECTION'), 'EOD_OPEN_REFLECTION must not appear');
  });

  test('A4: no EOD footer when eodRecap not provided', () => {
    const html = CycleCard({
      composition: PROPOSED_COMP,
      activities: SAMPLE_ACTIVITIES
    });
    assert.ok(!html.includes('cycle-eod-footer'), 'cycle-eod-footer must not render when eodRecap not provided');
  });

  test('A4: EOD footer also renders in ACCEPTED state', () => {
    const html = CycleCard({
      composition: { ...PROPOSED_COMP, state: 'ACCEPTED' },
      activities: SAMPLE_ACTIVITIES.map((a) => ({ ...a, state: 'CLOSED' })),
      eodRecap: EOD_RECAP
    });
    assert.ok(html.includes('cycle-eod-footer'), 'cycle-eod-footer must render in ACCEPTED state');
    assert.ok(html.includes('EOD_OPEN_REFLECTION'), 'EOD action must be reachable in ACCEPTED state');
  });
});

describe('CycleCard — Phase A: aria-live current-activity summary (A5)', () => {
  test('A5: header contains aria-live="polite" region', () => {
    const html = CycleCard({
      composition: PROPOSED_COMP,
      activities: SAMPLE_ACTIVITIES
    });
    assert.match(html, /aria-live="polite"/, 'CycleCard header must have aria-live="polite"');
    assert.match(html, /cycle-now-summary/, 'cycle-now-summary element must be present');
  });

  test('A5: aria-live region names the current in-progress activity', () => {
    const activitiesWithInProgress = SAMPLE_ACTIVITIES.map((a, i) =>
      i === 0 ? { ...a, state: 'IN_PROGRESS' } : a
    );
    const html = CycleCard({
      composition: { ...PROPOSED_COMP, state: 'ACTIVE' },
      activities: activitiesWithInProgress,
      nowIso: '2026-04-27T09:15:00Z'
    });
    assert.ok(html.includes('Now: Daily Standup'), 'aria-live must name the IN_PROGRESS activity');
  });

  test('A5: aria-live falls back to "No current activity" when nothing in progress', () => {
    const html = CycleCard({
      composition: PROPOSED_COMP,
      activities: SAMPLE_ACTIVITIES
      // no nowIso → SCHEDULED activities with no date context → fallback
    });
    assert.ok(
      html.includes('No current activity') || html.includes('Up next:'),
      'aria-live must have a non-empty summary'
    );
  });

  test('A5: aria-atomic="true" on the live region', () => {
    const html = CycleCard({
      composition: PROPOSED_COMP,
      activities: SAMPLE_ACTIVITIES
    });
    assert.match(html, /aria-atomic="true"/, 'live region must have aria-atomic="true"');
  });
});
