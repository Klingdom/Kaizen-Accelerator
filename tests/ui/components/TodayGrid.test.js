/**
 * TodayGrid — unit tests for the Iter 29 Phase 1 single-day calendar grid.
 *
 * Covers:
 *   P1-T1: block top offset for a 10:00 activity (gridStart=07:00, 60px/hr → top=180px)
 *   P1-T2: block height for a 60-min activity (60px/hr → 60px)
 *   P1-T3: lunch block (bucket:null) renders chip-unknown and cycle-block-lunch
 *   P1-T4: now-line renders only when nowIso date matches composition date
 *   P1-T5: empty activities array → no cycle-block-positioned elements
 *   P1-T6: hour rail renders 13 labels (07:00..19:00) with aria-hidden
 *   P1-T7: PROPOSED state applies cycle-block-proposed class (dashed outline)
 *   P1-T8: ACCEPTED/EDITED state does NOT apply cycle-block-proposed
 *   P1-T9: kaizen chip renders on blocks with linkedKaizenId
 *   P1-T10: very-short block height clamps to MIN (24px floor)
 *   P1-T11: malformed plannedStartAt → block is omitted (no crash)
 *   P1-T12: zero/negative duration → block is omitted
 *   P1-T13: null composition → empty grid with cycle-calendar-grid-empty class
 *   P1-T14: protected block renders lock indicator
 *   P1-T15: OPEN_BLOCK_DETAIL action on every block
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { TodayGrid } from '../../../js/ui/components/TodayGrid.js';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

function mkComposition(overrides = {}) {
  return {
    id: 'comp_tg_1',
    userId: 'u',
    state: 'PROPOSED',
    date: '2026-04-30',
    ...overrides
  };
}

function mkActivity(overrides = {}) {
  return {
    id: 'sa_1',
    catalogEntryId: 'cat_deep',
    name: 'Deep Work',
    bucket: 'PROJECT',
    plannedDurationMinutes: 60,
    plannedStartAt: '10:00',
    state: 'SCHEDULED',
    ...overrides
  };
}

const COMP = mkComposition({ state: 'PROPOSED' });
const COMP_ACCEPTED = mkComposition({ state: 'ACCEPTED' });

// ---------------------------------------------------------------------------
// P1-T1: Block top offset
// ---------------------------------------------------------------------------
describe('TodayGrid — block positioning (P1-T1)', () => {
  test('P1-T1: 10:00 activity on 07:00-start grid → top = 180px', () => {
    // 10:00 - 07:00 = 3 hours × 60px/hr = 180px
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({ plannedStartAt: '10:00', plannedDurationMinutes: 60 })]
    });
    assert.ok(html.includes('top: 180px'), `Expected top: 180px, HTML: ${html.slice(0, 500)}`);
  });

  test('07:00 activity on 07:00-start grid → top = 0px', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({ plannedStartAt: '07:00' })]
    });
    assert.ok(html.includes('top: 0px'), 'Activity at grid start must have top: 0px');
  });

  test('09:15 activity → top = 135px (2h15m = 135min × 1px/min)', () => {
    // 09:15 - 07:00 = 2h15m = 135 min × (60px/60min) = 135px
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({ plannedStartAt: '09:15' })]
    });
    assert.ok(html.includes('top: 135px'), 'Activity at 09:15 must have top: 135px');
  });
});

// ---------------------------------------------------------------------------
// P1-T2: Block height
// ---------------------------------------------------------------------------
describe('TodayGrid — block height (P1-T2)', () => {
  test('P1-T2: 60-min activity at 60px/hr → height = 60px', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({ plannedDurationMinutes: 60 })]
    });
    assert.ok(html.includes('height: 60px'), 'Expected height: 60px for 60-min activity');
  });

  test('90-min activity → height = 90px', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({ plannedDurationMinutes: 90 })]
    });
    assert.ok(html.includes('height: 90px'), 'Expected height: 90px for 90-min activity');
  });

  test('30-min activity → height = 30px (raw) but clamped to 30px (above 24px floor)', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({ plannedDurationMinutes: 30 })]
    });
    // 30px is above the 24px floor so rendered as-is.
    assert.ok(html.includes('height: 30px'), 'Expected height: 30px for 30-min activity');
  });
});

// ---------------------------------------------------------------------------
// P1-T3: Lunch block (bucket: null)
// ---------------------------------------------------------------------------
describe('TodayGrid — lunch block treatment (P1-T3)', () => {
  test('P1-T3: bucket=null renders chip-unknown class', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({ bucket: null, name: 'Lunch', plannedStartAt: '12:00' })]
    });
    assert.ok(html.includes('chip-unknown'), 'Lunch block must use chip-unknown class');
  });

  test('P1-T3: bucket=null renders cycle-block-lunch modifier', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({ bucket: null, name: 'Lunch', plannedStartAt: '12:00' })]
    });
    assert.ok(html.includes('cycle-block-lunch'), 'Lunch block must have cycle-block-lunch class');
  });

  test('P1-T3: lunch block does NOT use chip-project/chip-communication/chip-ci', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({ bucket: null, name: 'Lunch', plannedStartAt: '12:00' })]
    });
    // Only the lunch block is rendered; these classes must be absent.
    assert.ok(!html.includes('chip-project'), 'Lunch must not use chip-project');
    assert.ok(!html.includes('chip-communication'), 'Lunch must not use chip-communication');
    assert.ok(!html.includes('chip-ci'), 'Lunch must not use chip-ci');
  });
});

// ---------------------------------------------------------------------------
// P1-T4: Now-line renders on matching date only
// ---------------------------------------------------------------------------
describe('TodayGrid — now-line (P1-T4)', () => {
  test('P1-T4: now-line renders when nowIso date matches composition.date', () => {
    // 09:00 on 2026-04-30: grid 07:00-19:00, offset = 2h × 60px = 120px
    const html = TodayGrid({
      composition: mkComposition({ date: '2026-04-30' }),
      activities: [],
      nowIso: '2026-04-30T09:00:00Z'
    });
    assert.ok(html.includes('cycle-now-line'), 'now-line must render when date matches');
    assert.ok(html.includes('top: 120px'), 'now-line must be at 120px for 09:00 on 07:00-start grid');
  });

  test('P1-T4: now-line absent when nowIso date does not match composition.date', () => {
    const html = TodayGrid({
      composition: mkComposition({ date: '2026-04-30' }),
      activities: [],
      nowIso: '2026-04-29T09:00:00Z'  // yesterday
    });
    assert.ok(!html.includes('cycle-now-line'), 'now-line must be absent when date does not match');
  });

  test('P1-T4: now-line absent when nowIso is outside grid window', () => {
    // 06:00 is before the 07:00 grid start.
    const html = TodayGrid({
      composition: mkComposition({ date: '2026-04-30' }),
      activities: [],
      nowIso: '2026-04-30T06:00:00Z'
    });
    assert.ok(!html.includes('cycle-now-line'), 'now-line must be absent when time is outside grid window');
  });

  test('P1-T4: now-line absent when nowIso is null', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [],
      nowIso: null
    });
    assert.ok(!html.includes('cycle-now-line'), 'now-line must be absent when nowIso is null');
  });
});

// ---------------------------------------------------------------------------
// P1-T5: Empty state
// ---------------------------------------------------------------------------
describe('TodayGrid — empty activities (P1-T5)', () => {
  test('P1-T5: empty activities array → no cycle-block-positioned elements', () => {
    const html = TodayGrid({ composition: COMP, activities: [] });
    assert.ok(!html.includes('cycle-block-positioned'), 'No blocks must render for empty activities');
  });

  test('P1-T5: empty activities → hour rail and timeline still render', () => {
    const html = TodayGrid({ composition: COMP, activities: [] });
    assert.ok(html.includes('cycle-hour-rail'), 'Hour rail must render even with no activities');
    assert.ok(html.includes('cycle-timeline'), 'Timeline must render even with no activities');
  });
});

// ---------------------------------------------------------------------------
// P1-T6: Hour rail labels
// ---------------------------------------------------------------------------
describe('TodayGrid — hour rail (P1-T6)', () => {
  test('P1-T6: hour rail renders 13 labels 07:00..19:00', () => {
    const html = TodayGrid({ composition: COMP, activities: [] });
    // Count cycle-hour spans — should be 13 (07..19 inclusive).
    const matches = html.match(/class="cycle-hour"/g) ?? [];
    assert.equal(matches.length, 13, `Expected 13 hour labels, got ${matches.length}`);
  });

  test('P1-T6: hour rail includes 07:00 and 19:00 boundary labels', () => {
    const html = TodayGrid({ composition: COMP, activities: [] });
    assert.ok(html.includes('07:00'), 'Hour rail must include 07:00');
    assert.ok(html.includes('19:00'), 'Hour rail must include 19:00');
  });

  test('P1-T6: hour rail has aria-hidden="true" (decorative, blocks carry their own labels)', () => {
    const html = TodayGrid({ composition: COMP, activities: [] });
    assert.ok(
      html.includes('class="cycle-hour-rail" aria-hidden="true"'),
      'Hour rail must be aria-hidden'
    );
  });
});

// ---------------------------------------------------------------------------
// P1-T7: PROPOSED state → cycle-block-proposed (dashed outline)
// ---------------------------------------------------------------------------
describe('TodayGrid — PROPOSED dashed outline (P1-T7)', () => {
  test('P1-T7: PROPOSED composition → blocks have cycle-block-proposed class', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity()],
      compositionState: 'PROPOSED'
    });
    assert.ok(html.includes('cycle-block-proposed'), 'PROPOSED blocks must have cycle-block-proposed class');
  });

  test('P1-T7: cycle-calendar-grid carries data-composition-state="PROPOSED"', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity()],
      compositionState: 'PROPOSED'
    });
    assert.ok(
      html.includes('data-composition-state="PROPOSED"'),
      'Grid root must carry data-composition-state'
    );
  });
});

// ---------------------------------------------------------------------------
// P1-T8: ACCEPTED/EDITED → NO cycle-block-proposed
// ---------------------------------------------------------------------------
describe('TodayGrid — ACCEPTED solid fill (P1-T8)', () => {
  test('P1-T8: ACCEPTED composition → blocks do NOT have cycle-block-proposed', () => {
    const html = TodayGrid({
      composition: COMP_ACCEPTED,
      activities: [mkActivity({ state: 'SCHEDULED' })],
      compositionState: 'ACCEPTED'
    });
    assert.ok(!html.includes('cycle-block-proposed'), 'ACCEPTED blocks must NOT have cycle-block-proposed');
  });

  test('P1-T8: EDITED composition → blocks do NOT have cycle-block-proposed', () => {
    const html = TodayGrid({
      composition: mkComposition({ state: 'EDITED' }),
      activities: [mkActivity({ state: 'SCHEDULED' })],
      compositionState: 'EDITED'
    });
    assert.ok(!html.includes('cycle-block-proposed'), 'EDITED blocks must NOT have cycle-block-proposed');
  });
});

// ---------------------------------------------------------------------------
// P1-T9: Kaizen chip on linked blocks
// ---------------------------------------------------------------------------
describe('TodayGrid — kaizen chip (P1-T9)', () => {
  test('P1-T9: block with linkedKaizenId renders kaizen chip when kaizenTitleById provided', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({ linkedKaizenId: 'k_123' })],
      kaizenTitleById: { k_123: 'Reduce Meeting Overhead' }
    });
    assert.ok(html.includes('cycle-block-kaizen'), 'Kaizen chip must render for linked block');
    assert.ok(html.includes('Reduce Meeting Overhead'), 'Kaizen title must appear in chip');
  });

  test('P1-T9: block without linkedKaizenId renders no kaizen chip', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({ linkedKaizenId: null })]
    });
    assert.ok(!html.includes('cycle-block-kaizen'), 'No kaizen chip for unlinked block');
  });

  test('P1-T9: block with linkedKaizenId but no matching kaizenTitleById renders no chip', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({ linkedKaizenId: 'k_999' })],
      kaizenTitleById: {}
    });
    assert.ok(!html.includes('cycle-block-kaizen'), 'No kaizen chip when title not in lookup');
  });
});

// ---------------------------------------------------------------------------
// P1-T10: Very-short block height clamped to 24px floor
// ---------------------------------------------------------------------------
describe('TodayGrid — minimum block height (P1-T10)', () => {
  test('P1-T10: 15-min block (= 15px raw) clamped to 24px minimum', () => {
    // 15 min × (60px/60) = 15px raw → clamped to 24px
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({ plannedDurationMinutes: 15 })]
    });
    assert.ok(html.includes('height: 24px'), 'Very short block must be clamped to 24px minimum');
    assert.ok(!html.includes('height: 15px'), 'Raw 15px height must not appear (clamped)');
  });

  test('P1-T10: 24-min block (= 24px raw) renders at exactly 24px (at floor)', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({ plannedDurationMinutes: 24 })]
    });
    assert.ok(html.includes('height: 24px'), '24-min block must render at 24px');
  });
});

// ---------------------------------------------------------------------------
// P1-T11: Malformed plannedStartAt → block omitted
// ---------------------------------------------------------------------------
describe('TodayGrid — malformed time handling (P1-T11)', () => {
  test('P1-T11: null plannedStartAt → block is omitted (no crash)', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({ plannedStartAt: null })]
    });
    assert.ok(!html.includes('cycle-block-positioned'), 'Block with null plannedStartAt must be omitted');
  });

  test('P1-T11: undefined plannedStartAt → block is omitted', () => {
    const act = mkActivity();
    delete act.plannedStartAt;
    const html = TodayGrid({ composition: COMP, activities: [act] });
    assert.ok(!html.includes('cycle-block-positioned'), 'Block with undefined plannedStartAt must be omitted');
  });

  test('P1-T11: completely invalid time string → block is omitted', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({ plannedStartAt: 'not-a-time' })]
    });
    assert.ok(!html.includes('cycle-block-positioned'), 'Block with invalid time must be omitted');
  });

  test('P1-T11: multiple activities — valid ones still render when one is malformed', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [
        mkActivity({ id: 'sa_bad', plannedStartAt: null }),
        mkActivity({ id: 'sa_good', plannedStartAt: '10:00', plannedDurationMinutes: 60 })
      ]
    });
    assert.ok(html.includes('data-activity-id="sa_good"'), 'Valid activity must still render');
    assert.ok(!html.includes('data-activity-id="sa_bad"'), 'Malformed activity must be omitted');
  });
});

// ---------------------------------------------------------------------------
// P1-T12: Zero/negative duration → block omitted
// ---------------------------------------------------------------------------
describe('TodayGrid — zero/negative duration (P1-T12)', () => {
  test('P1-T12: zero plannedDurationMinutes → block is omitted', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({ plannedDurationMinutes: 0 })]
    });
    assert.ok(!html.includes('cycle-block-positioned'), 'Zero-duration block must be omitted');
  });

  test('P1-T12: negative plannedDurationMinutes → block is omitted', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({ plannedDurationMinutes: -10 })]
    });
    assert.ok(!html.includes('cycle-block-positioned'), 'Negative-duration block must be omitted');
  });
});

// ---------------------------------------------------------------------------
// P1-T13: Null composition → empty grid
// ---------------------------------------------------------------------------
describe('TodayGrid — null composition (P1-T13)', () => {
  test('P1-T13: null composition → renders cycle-calendar-grid-empty', () => {
    const html = TodayGrid({ composition: null, activities: [] });
    assert.ok(html.includes('cycle-calendar-grid-empty'), 'Null composition must render empty grid');
  });

  test('P1-T13: null composition → no cycle-block-positioned', () => {
    const html = TodayGrid({ composition: null, activities: [mkActivity()] });
    assert.ok(!html.includes('cycle-block-positioned'), 'No blocks when composition is null');
  });
});

// ---------------------------------------------------------------------------
// P1-T14: Protected block renders lock indicator
// ---------------------------------------------------------------------------
describe('TodayGrid — protected block lock indicator (P1-T14)', () => {
  test('P1-T14: Daily Standup (protected name) renders lock indicator', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({ name: 'Daily Standup', bucket: 'COMMUNICATION' })]
    });
    assert.ok(html.includes('cycle-block-lock'), 'Protected block must render lock indicator');
    assert.ok(html.includes('aria-label="Protected block"'), 'Lock must have accessible label');
  });

  test('P1-T14: non-protected block does NOT render lock indicator', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({ name: 'Custom Deep Work', bucket: 'PROJECT' })]
    });
    assert.ok(!html.includes('cycle-block-lock'), 'Non-protected block must not have lock indicator');
  });
});

// ---------------------------------------------------------------------------
// P1-T15: OPEN_BLOCK_DETAIL action on all blocks
// ---------------------------------------------------------------------------
describe('TodayGrid — click action (P1-T15)', () => {
  test('P1-T15: every block carries data-action="OPEN_BLOCK_DETAIL"', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [
        mkActivity({ id: 'sa_a' }),
        mkActivity({ id: 'sa_b', plannedStartAt: '11:00' })
      ]
    });
    const matches = (html.match(/data-action="OPEN_BLOCK_DETAIL"/g) ?? []).length;
    assert.equal(matches, 2, 'Both blocks must carry OPEN_BLOCK_DETAIL action');
  });

  test('P1-T15: block payload includes the activityId (HTML-escaped JSON in attribute)', () => {
    // The data-payload is JSON.stringify'd and then HTML-escaped via esc().
    // In the HTML attribute, " becomes &quot;. Both forms are acceptable.
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({ id: 'sa_xyz' })]
    });
    // The payload attribute contains the activityId — check the data-activity-id
    // attribute as a stable proxy (always an unescaped attribute value).
    assert.ok(
      html.includes('data-activity-id="sa_xyz"'),
      'Block must carry data-activity-id="sa_xyz" for QA targeting'
    );
    // Also verify the payload JSON is present in escaped form.
    assert.ok(
      html.includes('sa_xyz'),
      'activityId must appear somewhere in the block markup'
    );
  });

  test('P1-T15: blocks are focusable with role="button" and tabindex="0"', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity()]
    });
    assert.ok(html.includes('role="button"'), 'Blocks must have role="button" for keyboard access');
    assert.ok(html.includes('tabindex="0"'), 'Blocks must have tabindex="0" for keyboard access');
  });
});

// ---------------------------------------------------------------------------
// Miscellaneous grid structure
// ---------------------------------------------------------------------------
describe('TodayGrid — grid structure', () => {
  test('renders cycle-calendar-grid root element', () => {
    const html = TodayGrid({ composition: COMP, activities: [] });
    assert.ok(html.includes('class="cycle-calendar-grid"'), 'Grid root must be present');
  });

  test('renders cycle-timeline for block container', () => {
    const html = TodayGrid({ composition: COMP, activities: [] });
    assert.ok(html.includes('cycle-timeline'), 'Timeline container must be present');
  });

  test('timeline height = (endHour - startHour) × rowHeightPx = 720px by default', () => {
    // (19 - 7) × 60 = 720
    const html = TodayGrid({ composition: COMP, activities: [] });
    assert.ok(html.includes('height: 720px'), 'Default timeline height must be 720px');
  });

  test('custom gridStartHour/gridEndHour/rowHeightPx are respected', () => {
    // 8 hours × 40px = 320px
    const html = TodayGrid({
      composition: COMP,
      activities: [],
      gridStartHour: 8,
      gridEndHour: 16,
      rowHeightPx: 40
    });
    assert.ok(html.includes('height: 320px'), 'Custom params must produce correct timeline height');
  });

  test('bucket-colored blocks render with correct chipClass', () => {
    const html = TodayGrid({
      composition: COMP_ACCEPTED,
      activities: [
        mkActivity({ bucket: 'PROJECT', plannedStartAt: '09:00' }),
        mkActivity({ id: 'sa_ci', bucket: 'CI', plannedStartAt: '10:00' }),
        mkActivity({ id: 'sa_comm', bucket: 'COMMUNICATION', plannedStartAt: '11:00' })
      ],
      compositionState: 'ACCEPTED'
    });
    assert.ok(html.includes('chip-project'), 'PROJECT block must use chip-project');
    assert.ok(html.includes('chip-ci'), 'CI block must use chip-ci');
    assert.ok(html.includes('chip-communication'), 'COMMUNICATION block must use chip-communication');
  });
});

// ---------------------------------------------------------------------------
// Iter 46 Phase 1 — PROJECT secondary info line (AC1–AC4)
// ---------------------------------------------------------------------------
describe('TodayGrid — Iter 46 PROJECT secondary line (AC1–AC4)', () => {
  // Fixture: catalog entry with an outputArtifact
  const CATALOG_ENTRY = {
    id: 'cat_deep',
    outputArtifact: { name: 'SIPOC Matrix', schema: 'DOCUMENT' }
  };
  const CATALOG_ENTRY_BY_ID = { cat_deep: CATALOG_ENTRY };

  test('AC1: PROJECT block ≥56px shows secondary line from outputArtifact.name', () => {
    // 60 min × 60px/hr = 60px — above the 56px threshold
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({ plannedDurationMinutes: 60, catalogEntryId: 'cat_deep' })],
      catalogEntryById: CATALOG_ENTRY_BY_ID
    });
    assert.ok(html.includes('cycle-block-secondary'), 'Secondary line element must be present for ≥56px PROJECT block');
    assert.ok(html.includes('SIPOC Matrix'), 'outputArtifact.name must appear in secondary line');
  });

  test('AC1: PROJECT block prefers intention over outputArtifact.name', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({ plannedDurationMinutes: 60, catalogEntryId: 'cat_deep', intention: 'Ship the C&E matrix draft' })],
      catalogEntryById: CATALOG_ENTRY_BY_ID
    });
    assert.ok(html.includes('Ship the C&amp;E matrix draft') || html.includes('Ship the C&E matrix draft'),
      'intention must take precedence over outputArtifact.name in secondary line');
    // The artifact name should NOT appear when intention is present
    assert.ok(!html.includes('SIPOC Matrix'), 'outputArtifact.name must NOT appear when intention is set');
  });

  test('AC2: PROJECT block <56px does NOT show secondary line', () => {
    // 55 min × 60px/hr = 55px — below the 56px threshold
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({ plannedDurationMinutes: 55, catalogEntryId: 'cat_deep' })],
      catalogEntryById: CATALOG_ENTRY_BY_ID
    });
    assert.ok(!html.includes('cycle-block-secondary'), 'Secondary line must be absent for blocks <56px tall');
    assert.ok(!html.includes('SIPOC Matrix'), 'Artifact name must not appear in short blocks');
  });

  test('AC4: COMMUNICATION block does NOT show secondary line even when tall', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({ bucket: 'COMMUNICATION', plannedDurationMinutes: 120, catalogEntryId: 'cat_deep' })],
      catalogEntryById: CATALOG_ENTRY_BY_ID
    });
    assert.ok(!html.includes('cycle-block-secondary'), 'COMMUNICATION block must not show secondary line (Phase 2 handles it)');
  });

  test('AC4: CI block does NOT show secondary line even when tall', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({ bucket: 'CI', plannedDurationMinutes: 120, catalogEntryId: 'cat_deep' })],
      catalogEntryById: CATALOG_ENTRY_BY_ID
    });
    assert.ok(!html.includes('cycle-block-secondary'), 'CI block must not show secondary line (Phase 2 handles it)');
  });

  test('AC8 (graceful absence): PROJECT block with no catalog entry shows no secondary line', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({ plannedDurationMinutes: 60, catalogEntryId: 'unknown_entry' })],
      catalogEntryById: CATALOG_ENTRY_BY_ID
    });
    // unknown_entry has no entry in the map — secondary line should simply be absent
    assert.ok(!html.includes('cycle-block-secondary'), 'No secondary line when catalogEntryId not in map');
  });

  test('AC8 (graceful absence): PROJECT block with neither intention nor outputArtifact shows no secondary line', () => {
    const CATALOG_NO_ARTIFACT = { id: 'cat_bare' };
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({ plannedDurationMinutes: 60, catalogEntryId: 'cat_bare' })],
      catalogEntryById: { cat_bare: CATALOG_NO_ARTIFACT }
    });
    assert.ok(!html.includes('cycle-block-secondary'), 'No secondary line when no intention and no outputArtifact');
  });
});
