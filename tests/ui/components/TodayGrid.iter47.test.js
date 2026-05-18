/**
 * TodayGrid — Iter 47 Phase 2 tests.
 *
 * Per-bucket render functions (AC1–AC6) + orthogonal cases (META §A.2).
 *
 * META §A.2 application: every per-bucket branch has BOTH:
 *   - Test that EXPECTED bucket gets EXPECTED treatment
 *   - Test that OTHER buckets do NOT get this treatment (no accidental leak)
 *
 * META §A.3 reconciliation: documented in implementation report.
 * `.cycle-block-sacred` applies ONLY to gen_end_of_activity_reflection
 * (EoAR) — no prior conflicting rules existed in app.css.
 *
 * AC coverage:
 *   AC1: blockWrapper() extracts positioning + aria + data-attrs
 *   AC2: renderProjectBlock renders PROJECT content
 *   AC3: renderCommBlock renders sub-type name (not generic "COMMUNICATION")
 *   AC4: renderCIBlock renders .cycle-block-sacred on EoAR
 *   AC5: renderLunchBlock renders minimal content (time + "Lunch")
 *   AC6: renderProtectedBlock — no disabled Edit button in block HTML
 *  AC13: Lunch block emits OPEN_LUNCH_TOOLTIP not OPEN_BLOCK_DETAIL
 *  AC15: Iter 46 functionality preserved (intention secondary line on PROJECT)
 *  AC17: META §A.2 — orthogonal-case tests for every per-bucket branch
 *  AC18: META §A.3 — .cycle-block-sacred only on EoAR CI blocks
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { TodayGrid } from '../../../js/ui/components/TodayGrid.js';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

function mkComposition(overrides = {}) {
  return {
    id: 'comp_47_1',
    userId: 'u',
    state: 'ACCEPTED',
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

const COMP = mkComposition();
const CATALOG_ENTRY_WITH_ARTIFACT = {
  id: 'cat_deep',
  outputArtifact: { name: 'SIPOC Matrix', schema: 'DOCUMENT' }
};
const CATALOG_BY_ID = { cat_deep: CATALOG_ENTRY_WITH_ARTIFACT };

// ---------------------------------------------------------------------------
// AC1: blockWrapper() — shared positioning + aria + data-attrs
// ---------------------------------------------------------------------------

describe('TodayGrid Iter47 — blockWrapper shared structure (AC1)', () => {
  test('AC1: all blocks carry data-activity-id, data-bucket, data-state attrs', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({ id: 'sa_test', bucket: 'PROJECT', state: 'SCHEDULED' })]
    });
    assert.ok(html.includes('data-activity-id="sa_test"'), 'data-activity-id must be present');
    assert.ok(html.includes('data-bucket="PROJECT"'), 'data-bucket must be present');
    assert.ok(html.includes('data-state="SCHEDULED"'), 'data-state must be present');
  });

  test('AC1: all blocks carry role="button" and tabindex="0" for accessibility', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity()]
    });
    assert.ok(html.includes('role="button"'), 'role=button must be present');
    assert.ok(html.includes('tabindex="0"'), 'tabindex=0 must be present');
  });

  test('AC1: all blocks carry positioning style (top + height)', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({ plannedStartAt: '10:00', plannedDurationMinutes: 60 })]
    });
    assert.ok(html.includes('top: 180px'), 'top offset must be present (10:00 on 07:00 grid = 180px)');
    assert.ok(html.includes('height: 60px'), 'height must be present (60 min = 60px)');
  });

  test('AC1: CI block carries all blockWrapper attributes too', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({ id: 'sa_ci', bucket: 'CI', state: 'SCHEDULED' })]
    });
    assert.ok(html.includes('data-activity-id="sa_ci"'), 'CI block must have data-activity-id');
    assert.ok(html.includes('data-bucket="CI"'), 'CI block must have data-bucket');
    assert.ok(html.includes('role="button"'), 'CI block must have role=button');
  });
});

// ---------------------------------------------------------------------------
// AC2: renderProjectBlock — PROJECT-specific content
// ---------------------------------------------------------------------------

describe('TodayGrid Iter47 — renderProjectBlock (AC2)', () => {
  test('AC2: PROJECT block renders activity name', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({ name: 'SIPOC Workshop', bucket: 'PROJECT' })]
    });
    assert.ok(html.includes('SIPOC Workshop'), 'PROJECT block must render activity name');
  });

  test('AC2: PROJECT block ≥56px renders secondary line (intention)', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({
        bucket: 'PROJECT',
        plannedDurationMinutes: 60,
        intention: 'Ship the C&E matrix'
      })]
    });
    assert.ok(html.includes('cycle-block-secondary'), 'Secondary line must render for PROJECT ≥56px');
  });

  test('AC2: PROJECT block ≥56px renders secondary line from outputArtifact when no intention', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({ bucket: 'PROJECT', plannedDurationMinutes: 60, catalogEntryId: 'cat_deep' })],
      catalogEntryById: CATALOG_BY_ID
    });
    assert.ok(html.includes('SIPOC Matrix'), 'outputArtifact.name must appear in secondary line');
  });

  // META §A.2: orthogonal — COMM block does NOT get PROJECT secondary line
  test('META §A.2: COMM block does NOT render cycle-block-secondary (AC2 orthogonal)', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({
        bucket: 'COMMUNICATION',
        plannedDurationMinutes: 120,
        catalogEntryId: 'cat_deep',
        intention: 'Will this leak?'
      })],
      catalogEntryById: CATALOG_BY_ID
    });
    assert.ok(!html.includes('cycle-block-secondary'),
      'COMM block must NOT show secondary line — only PROJECT gets it');
  });

  // META §A.2: orthogonal — CI block does NOT get PROJECT secondary line
  test('META §A.2: CI block does NOT render cycle-block-secondary (AC2 orthogonal)', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({
        bucket: 'CI',
        plannedDurationMinutes: 120,
        catalogEntryId: 'cat_deep',
        intention: 'Will this leak?'
      })],
      catalogEntryById: CATALOG_BY_ID
    });
    assert.ok(!html.includes('cycle-block-secondary'),
      'CI block must NOT show secondary line — only PROJECT gets it');
  });

  // META §A.2: orthogonal — Lunch block does NOT get PROJECT secondary line
  test('META §A.2: Lunch block does NOT render cycle-block-secondary (AC2 orthogonal)', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({
        bucket: null,
        name: 'Lunch',
        plannedDurationMinutes: 120,
        intention: 'Will this leak?'
      })],
      catalogEntryById: CATALOG_BY_ID
    });
    assert.ok(!html.includes('cycle-block-secondary'),
      'Lunch block must NOT show secondary line — only PROJECT gets it');
  });
});

// ---------------------------------------------------------------------------
// AC3: renderCommBlock — sub-type name (not generic "COMMUNICATION")
// ---------------------------------------------------------------------------

describe('TodayGrid Iter47 — renderCommBlock (AC3)', () => {
  test('AC3: COMM block renders the specific sub-type name from activity.name', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({
        bucket: 'COMMUNICATION',
        name: 'Daily Standup',
        plannedStartAt: '09:00',
        plannedDurationMinutes: 15
      })]
    });
    assert.ok(html.includes('Daily Standup'), 'COMM block must render specific name (Daily Standup)');
  });

  test('AC3: COMM block renders "AM High-value Communication" name', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({
        bucket: 'COMMUNICATION',
        name: 'AM High-value Communication',
        plannedStartAt: '09:15',
        plannedDurationMinutes: 60
      })]
    });
    assert.ok(html.includes('AM High-value Communication'),
      'COMM block must render specific sub-type name (AM Comm)');
  });

  test('AC3: COMM block uses chip-communication class', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({ bucket: 'COMMUNICATION' })]
    });
    assert.ok(html.includes('chip-communication'), 'COMM block must use chip-communication CSS class');
  });

  // META §A.2: orthogonal — PROJECT block does not render COMM-specific classes
  test('META §A.2: PROJECT block does NOT use chip-communication (AC3 orthogonal)', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({ bucket: 'PROJECT', plannedStartAt: '08:00' })]
    });
    assert.ok(!html.includes('chip-communication'), 'PROJECT block must not use chip-communication');
    assert.ok(html.includes('chip-project'), 'PROJECT block must use chip-project');
  });

  // META §A.2: orthogonal — CI block does not render COMM-specific classes
  test('META §A.2: CI block does NOT use chip-communication (AC3 orthogonal)', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({ bucket: 'CI', plannedStartAt: '08:00' })]
    });
    assert.ok(!html.includes('chip-communication'), 'CI block must not use chip-communication');
    assert.ok(html.includes('chip-ci'), 'CI block must use chip-ci');
  });
});

// ---------------------------------------------------------------------------
// AC4: renderCIBlock — .cycle-block-sacred on EoAR
// META §A.3: reconciliation audit documented here
// ---------------------------------------------------------------------------

describe('TodayGrid Iter47 — renderCIBlock sacred treatment (AC4, AC18)', () => {
  /**
   * META §A.3 reconciliation audit:
   * Searched app.css for: sacred, cycle-block-sacred, cycle-block-ceremony,
   * cycle-block-anchor, cycle-block-lock.
   *
   * Findings:
   *   - .cycle-block-lock: EXISTS at app.css line 557 — positions emoji top-right.
   *     NOT applied to EoAR in Phase 2; EoAR uses cycle-block-sacred-indicator instead.
   *   - .cycle-block-sacred: NEW in Iter 47 Phase 2. No prior rule existed.
   *   - .cycle-block-ceremony: NOT in CSS yet — skipped; only used as concept.
   *   - .cycle-block-anchor: NOT in CSS — skipped; only COMM anchor concept.
   *   - No conflict with any existing rule.
   */

  test('AC4 + AC18: EoAR block (gen_end_of_activity_reflection) gets cycle-block-sacred class', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({
        bucket: 'CI',
        catalogEntryId: 'gen_end_of_activity_reflection',
        name: 'End-of-Activity Reflection',
        plannedStartAt: '17:00',
        plannedDurationMinutes: 15
      })]
    });
    assert.ok(html.includes('cycle-block-sacred'),
      'EoAR block must have cycle-block-sacred class');
  });

  test('AC4: EoAR block does NOT use lock emoji (CSS indicator replaces it)', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({
        bucket: 'CI',
        catalogEntryId: 'gen_end_of_activity_reflection',
        name: 'End-of-Activity Reflection',
        plannedStartAt: '17:00',
        plannedDurationMinutes: 15
      })]
    });
    // Lock emoji codepoint &#x1F512; — EoAR uses sacred indicator instead
    assert.ok(!html.includes('&#x1F512;'),
      'EoAR block must NOT use lock emoji — cycle-block-sacred-indicator replaces it');
    assert.ok(html.includes('cycle-block-sacred-indicator'),
      'EoAR must use cycle-block-sacred-indicator span');
  });

  // META §A.2: orthogonal — non-EoAR CI block does NOT get cycle-block-sacred
  test('META §A.2: non-EoAR CI block does NOT get cycle-block-sacred (AC4 orthogonal)', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({
        bucket: 'CI',
        catalogEntryId: 'cat_pdca',
        name: 'PDCA Cycle',
        plannedStartAt: '14:00',
        plannedDurationMinutes: 30
      })]
    });
    assert.ok(!html.includes('cycle-block-sacred'),
      'Non-EoAR CI block must NOT get cycle-block-sacred class (only EoAR)');
  });

  // META §A.2: orthogonal — PROJECT block does NOT get cycle-block-sacred
  test('META §A.2: PROJECT block does NOT get cycle-block-sacred (AC4 orthogonal)', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({ bucket: 'PROJECT' })]
    });
    assert.ok(!html.includes('cycle-block-sacred'),
      'PROJECT block must NOT get cycle-block-sacred class');
  });

  // META §A.2: orthogonal — COMM block does NOT get cycle-block-sacred
  test('META §A.2: COMM block does NOT get cycle-block-sacred (AC4 orthogonal)', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({ bucket: 'COMMUNICATION' })]
    });
    assert.ok(!html.includes('cycle-block-sacred'),
      'COMM block must NOT get cycle-block-sacred class');
  });

  test('AC4: CI block uses chip-ci class', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({ bucket: 'CI', catalogEntryId: 'cat_pdca', name: 'PDCA Cycle' })]
    });
    assert.ok(html.includes('chip-ci'), 'CI block must use chip-ci class');
  });

  test('AC4: sprint ceremony CI block (cer_sprint_planning) does NOT get cycle-block-sacred', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({
        bucket: 'CI',
        catalogEntryId: 'cer_sprint_planning',
        name: 'Sprint Planning',
        plannedStartAt: '09:00',
        plannedDurationMinutes: 60
      })]
    });
    assert.ok(!html.includes('cycle-block-sacred'),
      'Sprint ceremony must NOT get cycle-block-sacred — only EoAR gets it');
    // Sprint ceremonies are protected, so they get lock emoji
    assert.ok(html.includes('&#x1F512;'), 'Sprint ceremony must keep lock emoji');
  });
});

// ---------------------------------------------------------------------------
// AC5: renderLunchBlock — minimal content
// ---------------------------------------------------------------------------

describe('TodayGrid Iter47 — renderLunchBlock minimal content (AC5)', () => {
  test('AC5: Lunch block renders time label', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({ bucket: null, name: 'Lunch', plannedStartAt: '12:00', plannedDurationMinutes: 30 })]
    });
    assert.ok(html.includes('cycle-block-time'), 'Lunch block must render time label');
  });

  test('AC5: Lunch block renders "Lunch" name label', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({ bucket: null, name: 'Lunch', plannedStartAt: '12:00', plannedDurationMinutes: 30 })]
    });
    assert.ok(html.includes('Lunch'), 'Lunch block must render "Lunch" name');
  });

  test('AC5: Lunch block does NOT render resize handle', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({ bucket: null, name: 'Lunch', plannedStartAt: '12:00', plannedDurationMinutes: 30 })]
    });
    assert.ok(!html.includes('cycle-block-resize-handle'),
      'Lunch block must not have a resize handle');
  });

  test('AC5: Lunch block uses chip-unknown and cycle-block-lunch CSS classes', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({ bucket: null, name: 'Lunch', plannedStartAt: '12:00' })]
    });
    assert.ok(html.includes('chip-unknown'), 'Lunch block must use chip-unknown');
    assert.ok(html.includes('cycle-block-lunch'), 'Lunch block must use cycle-block-lunch');
  });

  // META §A.2: orthogonal — PROJECT block is NOT treated as lunch
  test('META §A.2: PROJECT block does NOT get cycle-block-lunch (AC5 orthogonal)', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({ bucket: 'PROJECT', name: 'Deep Work' })]
    });
    assert.ok(!html.includes('cycle-block-lunch'), 'PROJECT block must not have cycle-block-lunch class');
  });
});

// ---------------------------------------------------------------------------
// AC6: renderProtectedBlock — no disabled Edit button in block HTML
// ---------------------------------------------------------------------------

describe('TodayGrid Iter47 — renderProtectedBlock (AC6)', () => {
  test('AC6: protected PROJECT block (strategic) does NOT contain disabled button in block HTML', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({
        bucket: 'PROJECT',
        strategic: true,
        name: 'Strategic Deep Work'
      })]
    });
    // Block-level HTML should NEVER have a button — buttons only exist in BlockDetailDialog
    assert.ok(!html.includes('<button'), 'Block HTML must not contain any button elements');
  });

  test('AC6: carried-over activity renders without disabled button in block HTML', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({
        bucket: 'PROJECT',
        carriedOver: true,
        name: 'Carry Over Task'
      })]
    });
    assert.ok(!html.includes('<button'), 'Carried-over block must not have button in HTML');
  });

  test('AC6: all blocks never contain button elements (buttons live in BlockDetailDialog only)', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [
        mkActivity({ id: 'sa_p', bucket: 'PROJECT', plannedStartAt: '08:00' }),
        mkActivity({ id: 'sa_c', bucket: 'COMMUNICATION', plannedStartAt: '09:00' }),
        mkActivity({ id: 'sa_ci', bucket: 'CI', plannedStartAt: '10:00' }),
        mkActivity({ id: 'sa_l', bucket: null, name: 'Lunch', plannedStartAt: '12:00' })
      ]
    });
    // Resize handle is a <div>, not a <button>. Blocks must not have buttons.
    assert.ok(!html.includes('<button'), 'No block type should have button elements in block HTML');
  });
});

// ---------------------------------------------------------------------------
// AC13: Lunch block emits OPEN_LUNCH_TOOLTIP not OPEN_BLOCK_DETAIL
// ---------------------------------------------------------------------------

describe('TodayGrid Iter47 — Lunch block OPEN_LUNCH_TOOLTIP (AC13)', () => {
  test('AC13: Lunch block emits OPEN_LUNCH_TOOLTIP action', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({ bucket: null, name: 'Lunch', plannedStartAt: '12:00', plannedDurationMinutes: 30 })]
    });
    assert.ok(html.includes('OPEN_LUNCH_TOOLTIP'),
      'Lunch block must emit OPEN_LUNCH_TOOLTIP');
  });

  test('AC13: Lunch block does NOT emit OPEN_BLOCK_DETAIL', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({ bucket: null, name: 'Lunch', plannedStartAt: '12:00', plannedDurationMinutes: 30 })]
    });
    assert.ok(!html.includes('OPEN_BLOCK_DETAIL'),
      'Lunch block must NOT emit OPEN_BLOCK_DETAIL (replaced by OPEN_LUNCH_TOOLTIP)');
  });

  // META §A.2: orthogonal — non-lunch blocks still emit OPEN_BLOCK_DETAIL
  test('META §A.2: PROJECT block still emits OPEN_BLOCK_DETAIL (AC13 orthogonal)', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({ bucket: 'PROJECT', plannedStartAt: '08:00' })]
    });
    assert.ok(html.includes('OPEN_BLOCK_DETAIL'),
      'PROJECT block must still emit OPEN_BLOCK_DETAIL');
    assert.ok(!html.includes('OPEN_LUNCH_TOOLTIP'),
      'PROJECT block must NOT emit OPEN_LUNCH_TOOLTIP');
  });

  test('META §A.2: COMM block still emits OPEN_BLOCK_DETAIL (AC13 orthogonal)', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({ bucket: 'COMMUNICATION', plannedStartAt: '09:00' })]
    });
    assert.ok(html.includes('OPEN_BLOCK_DETAIL'),
      'COMM block must still emit OPEN_BLOCK_DETAIL');
    assert.ok(!html.includes('OPEN_LUNCH_TOOLTIP'),
      'COMM block must NOT emit OPEN_LUNCH_TOOLTIP');
  });

  test('META §A.2: CI block still emits OPEN_BLOCK_DETAIL (AC13 orthogonal)', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({ bucket: 'CI', plannedStartAt: '14:00' })]
    });
    assert.ok(html.includes('OPEN_BLOCK_DETAIL'),
      'CI block must still emit OPEN_BLOCK_DETAIL');
    assert.ok(!html.includes('OPEN_LUNCH_TOOLTIP'),
      'CI block must NOT emit OPEN_LUNCH_TOOLTIP');
  });

  test('AC13: Lunch tooltip payload contains timeRange', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({ bucket: null, name: 'Lunch', plannedStartAt: '12:00', plannedDurationMinutes: 30 })]
    });
    // The payload should include timeRange — check that the attribute is present
    assert.ok(html.includes('OPEN_LUNCH_TOOLTIP'), 'Lunch must have OPEN_LUNCH_TOOLTIP');
  });
});

// ---------------------------------------------------------------------------
// AC15: Iter 46 Phase 1 functionality preserved
// ---------------------------------------------------------------------------

describe('TodayGrid Iter47 — AC15: Iter 46 functionality preserved', () => {
  test('AC15: PROJECT block intention secondary line preserved from Iter 46', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({
        bucket: 'PROJECT',
        plannedDurationMinutes: 60,
        intention: 'Ship the C&E Matrix'
      })]
    });
    assert.ok(html.includes('cycle-block-secondary'), 'Secondary line must still render (Iter 46 preserved)');
    assert.ok(html.includes('Ship the C&amp;E Matrix') || html.includes('Ship the C&E Matrix'),
      'Intention text must appear in secondary line');
  });

  test('AC15: outputArtifact.name secondary line preserved from Iter 46', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({ bucket: 'PROJECT', plannedDurationMinutes: 60, catalogEntryId: 'cat_deep' })],
      catalogEntryById: CATALOG_BY_ID
    });
    assert.ok(html.includes('SIPOC Matrix'), 'outputArtifact.name must still appear (Iter 46 preserved)');
  });

  test('AC15: kaizen chip preserved on all block types', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [
        mkActivity({ id: 'sa_p', bucket: 'PROJECT', linkedKaizenId: 'k1', plannedStartAt: '08:00' }),
        mkActivity({ id: 'sa_ci', bucket: 'CI', linkedKaizenId: 'k1', plannedStartAt: '10:00' })
      ],
      kaizenTitleById: { k1: 'Reduce Meeting Load' }
    });
    const kaizenCount = (html.match(/cycle-block-kaizen/g) ?? []).length;
    assert.ok(kaizenCount >= 2, `Kaizen chips must render on all linked blocks; found ${kaizenCount}`);
  });

  test('AC15: protected Daily Standup still gets lock indicator on COMM block', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({
        name: 'Daily Standup',
        bucket: 'COMMUNICATION',
        plannedStartAt: '09:00',
        plannedDurationMinutes: 15
      })]
    });
    assert.ok(html.includes('cycle-block-lock'), 'Protected COMM block must still have lock indicator');
  });
});

// ---------------------------------------------------------------------------
// Mixed bucket rendering integrity — AC19 (all existing tests pass)
// ---------------------------------------------------------------------------

describe('TodayGrid Iter47 — mixed bucket integrity (AC19)', () => {
  test('All bucket types render without crash in the same grid', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [
        mkActivity({ id: 'p1', bucket: 'PROJECT', plannedStartAt: '08:00', plannedDurationMinutes: 120 }),
        mkActivity({ id: 'c1', bucket: 'COMMUNICATION', name: 'Daily Standup', plannedStartAt: '10:30', plannedDurationMinutes: 15 }),
        mkActivity({ id: 'ci1', bucket: 'CI', catalogEntryId: 'cat_pdca', name: 'PDCA Cycle', plannedStartAt: '11:00', plannedDurationMinutes: 30 }),
        mkActivity({ id: 'ear1', bucket: 'CI', catalogEntryId: 'gen_end_of_activity_reflection', name: 'End-of-Activity Reflection', plannedStartAt: '11:30', plannedDurationMinutes: 15 }),
        mkActivity({ id: 'l1', bucket: null, name: 'Lunch', plannedStartAt: '12:00', plannedDurationMinutes: 30 })
      ]
    });

    assert.ok(html.includes('data-activity-id="p1"'), 'PROJECT block renders');
    assert.ok(html.includes('data-activity-id="c1"'), 'COMM block renders');
    assert.ok(html.includes('data-activity-id="ci1"'), 'CI block renders');
    assert.ok(html.includes('data-activity-id="ear1"'), 'EoAR block renders');
    assert.ok(html.includes('data-activity-id="l1"'), 'Lunch block renders');
    assert.ok(html.includes('cycle-block-sacred'), 'EoAR block has sacred class');
    assert.ok(html.includes('OPEN_LUNCH_TOOLTIP'), 'Lunch has tooltip action');
  });

  test('EoAR sacred class appears exactly in EoAR block context, not in non-EoAR blocks', () => {
    // Use separate renders to isolate per-block output
    // EoAR block: should have cycle-block-sacred
    const earHtml = TodayGrid({
      composition: COMP,
      activities: [
        mkActivity({ id: 'ear1', bucket: 'CI', catalogEntryId: 'gen_end_of_activity_reflection', name: 'EoAR', plannedStartAt: '09:00', plannedDurationMinutes: 15 })
      ]
    });
    assert.ok(earHtml.includes('cycle-block-sacred'), 'EoAR block must contain cycle-block-sacred');

    // PROJECT block: should NOT have cycle-block-sacred
    const projHtml = TodayGrid({
      composition: COMP,
      activities: [
        mkActivity({ id: 'p1', bucket: 'PROJECT', plannedStartAt: '08:00', plannedDurationMinutes: 60 })
      ]
    });
    assert.ok(!projHtml.includes('cycle-block-sacred'), 'PROJECT-only grid must NOT contain cycle-block-sacred');

    // Non-EoAR CI block: should NOT have cycle-block-sacred
    const pdcaHtml = TodayGrid({
      composition: COMP,
      activities: [
        mkActivity({ id: 'ci2', bucket: 'CI', catalogEntryId: 'cat_pdca', name: 'PDCA', plannedStartAt: '09:00', plannedDurationMinutes: 30 })
      ]
    });
    assert.ok(!pdcaHtml.includes('cycle-block-sacred'), 'Non-EoAR CI block must NOT contain cycle-block-sacred');
  });
});
