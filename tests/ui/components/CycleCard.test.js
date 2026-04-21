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

  test('includes BucketStrip', () => {
    const html = CycleCard({
      composition: PROPOSED_COMP,
      activities: SAMPLE_ACTIVITIES
    });
    assert.match(html, /bucket-strip/);
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

  test('activities show Start button (disabled in Sprint 4)', () => {
    const html = CycleCard({ composition: comp, activities: acts });
    assert.match(html, /sa-start/);
    assert.match(html, /disabled/);
  });

  test('no AcceptEditRejectTriad on ACCEPTED', () => {
    const html = CycleCard({ composition: comp, activities: acts });
    assert.ok(!html.includes('class="triad"'));
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

describe('CycleCard — custom targets pass through to BucketStrip', () => {
  test('weekly targets propagate', () => {
    const html = CycleCard({
      composition: PROPOSED_COMP,
      activities: SAMPLE_ACTIVITIES,
      targets: { PROJECT: 1200, COMMUNICATION: 600, CI: 600 },
      floors: { PROJECT: 600, COMMUNICATION: 300, CI: 300 },
      ceilings: { PROJECT: 1320, COMMUNICATION: 750, CI: 750 }
    });
    assert.match(html, /1200/);
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

describe('CycleCard — bucket summary reflects planned minutes', () => {
  test('8-block 4-2-2 sample shows near-golden minutes', () => {
    const html = CycleCard({
      composition: PROPOSED_COMP,
      activities: SAMPLE_ACTIVITIES
    });
    // 240 PROJECT, 105 COMM, 105 CI — but BucketStrip renders these.
    // We just assert the BucketStrip section exists and includes the numbers.
    assert.match(html, />240</);
  });
});
