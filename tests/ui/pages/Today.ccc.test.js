/**
 * Comprehension Complexity Count (CCC) proxy tests — Iteration 21 (C-QA-V2-1).
 *
 * Phase A update (Today Simplification):
 *   Removed 7 regions from REGIONS registry:
 *     morning-recap, rhythm-explainer, now-pane, up-next-mobile,
 *     why-this-plan (top-level), up-next-rail, eod-closure.
 *   These components are no longer rendered directly by Today.js.
 *   WhyThisPlan and MorningRecap are now rendered inside CycleCard.
 *
 * Iter 25 update:
 *   Removed 2 more regions: adherence-dial + bucket-strip.
 *   Today header now renders only the day badge.
 *   BucketStrip removed from CycleCard.
 *   Remaining regions: 3 (header, cycle-card, cycle-activities).
 *   CCC bound updated from ≤6 to ≤4.
 *
 * Iter 42 update (Phase 3 — Cadence Pressure Ring):
 *   Added the CadencePressureRing as a 4th region (cadence-ring) in the Today header.
 *   CCC bound updated from ≤4 to ≤5.
 *   The Ring is the 5th structural element:
 *     header → cadence-ring → cycle-card → cycle-calendar-grid → (bucket-strip in right margin)
 *   With activities present, the REGIONS count is now 4: header, cadence-ring,
 *   cycle-card, cycle-calendar-grid. Bucket strip renders separately (not in REGIONS).
 *   Bound ≤5 gives one slot of headroom for the next Phase 4 addition.
 *   QA note: UX_TODAY_FUTURISTIC_DELTA.md §4 Phase 3 flagged this as HIGH risk —
 *   "CCC upper bound (≤4) at capacity; new structural element pushes count over."
 *   This update is the deliberate resolution per the spec.
 *
 * Based on UX_TODAY_V2_QA.md §1 and UX_TODAY_V2_THEMES.md §5.
 *
 * CCC definition: count of distinct UI regions visible in a rendered Today
 * HTML string. Each named region below scores +1. Assert CCC ≤ 5 for the
 * active-composition (PROPOSED + activities) state.
 *
 * All fixtures are deterministic. No Date.now(), no Math.random().
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { Today } from '../../../js/ui/pages/Today.js';

// ---------------------------------------------------------------------------
// Helper: strip HTML tags and collapse whitespace to count words.
// ---------------------------------------------------------------------------
function visibleText(html) {
  // Remove script/style blocks.
  let t = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  t = t.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  // Strip all remaining tags.
  t = t.replace(/<[^>]+>/g, ' ');
  // Collapse whitespace.
  t = t.replace(/\s+/g, ' ').trim();
  return t;
}

function wordCount(text) {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).length;
}

// ---------------------------------------------------------------------------
// Extract the innermost prose content of a specific CSS class.
// Finds the first occurrence of `class="<cls>"`, then pulls the text content
// of the next attribute-less tag or text node up to 512 chars.
// This deliberately avoids pulling child elements (structural nesting).
// ---------------------------------------------------------------------------
function extractProseText(html, cssClass) {
  const startIdx = html.indexOf(`class="${cssClass}"`);
  if (startIdx === -1) return null;
  // Find the closing > of this opening tag.
  const tagEnd = html.indexOf('>', startIdx);
  if (tagEnd === -1) return null;
  // Grab up to 512 chars of HTML after the opening tag close.
  const candidate = html.slice(tagEnd + 1, tagEnd + 512);
  return visibleText(candidate);
}

// ---------------------------------------------------------------------------
// CCC: count distinct named regions present in the rendered HTML.
//
// Iter 25 registry — 3 regions remain after removing adherence-dial +
// bucket-strip. Bound updated to ≤ 4 (tight enough to catch regressions).
//
// Iter 29 update: cycle-activities replaced by cycle-calendar-grid (TodayGrid).
// Registry updated; count remains 3 (header, cycle-card, cycle-calendar-grid).
//
// Iter 42 update (Phase 3 — Cadence Pressure Ring):
// Added cadence-ring as a 4th region. Bound updated from ≤4 to ≤5.
// The Ring renders in the Today header alongside the day badge when a
// composition with activities is present.
//
// Region registry — each entry is a [name, pattern] pair. A region scores
// +1 if its pattern is found anywhere in the HTML string.
// ---------------------------------------------------------------------------
const REGIONS = [
  ['header',              /class="today-header"/],
  ['cadence-ring',        /class="cadence-ring"/],
  ['cycle-card',          /class="cycle-card/],
  ['cycle-calendar-grid', /class="cycle-calendar-grid/],
];

// Intentionally NOT in REGIONS (Phase A + Iter 25 + Iter 29 removals — kept for reference):
//   morning-recap, rhythm-explainer, now-pane, up-next-mobile,
//   why-this-plan (top-level), up-next-rail, eod-closure,
//   adherence-dial, bucket-strip,
//   cycle-activities (Iter 29: replaced by cycle-calendar-grid inside cycle-card).
// WhyThisPlan and MorningRecap now render INSIDE CycleCard (counted under cycle-card).

function computeCCC(html) {
  return REGIONS.filter(([, pattern]) => pattern.test(html)).length;
}

// ---------------------------------------------------------------------------
// Prose-heavy regions where word-count ≤ 25 is the enforceable contract.
// Phase A: all 4 prior entries are now absent from Today's top-level output.
// WhyThisPlan and MorningRecap content is inside CycleCard — tested separately
// in CycleCard.test.js. No prose regions remain at the Today page level.
// ---------------------------------------------------------------------------
const PROSE_REGIONS = [
  // Phase A: rhythm-explainer-copy, morning-recap, eod-closure-strip,
  // why-this-plan-chip all removed from Today's direct render path.
  // This array is intentionally empty; it will be populated if new copy-bearing
  // regions are added to Today in Phase C (ProjectDiscoveryCard copy).
];

// ---------------------------------------------------------------------------
// Minimal deterministic fixtures.
// ---------------------------------------------------------------------------
function mkComposition(state = 'PROPOSED') {
  return {
    id: 'comp_ccc_1',
    userId: 'user_ccc',
    state,
    cycleType: 'DAILY',
    date: '2026-04-27'
  };
}

function mkActivity(overrides = {}) {
  return {
    id: overrides.id ?? 'sa_ccc_1',
    catalogEntryId: 'cat_deep',
    name: 'Deep Work',
    bucket: 'PROJECT',
    plannedDurationMinutes: 120,
    plannedStartAt: '09:00',
    state: 'PROPOSED',
    ...overrides
  };
}

// Typical-day active-composition fixture (PROPOSED + 3 activities across 3 buckets).
const ACTIVE_STATE = {
  composition: mkComposition('PROPOSED'),
  activities: [
    mkActivity({ id: 'sa_1', name: 'Deep Work', bucket: 'PROJECT', plannedStartAt: '09:00' }),
    mkActivity({ id: 'sa_2', name: 'Team Standup', bucket: 'COMMUNICATION', plannedStartAt: '11:00', plannedDurationMinutes: 30 }),
    mkActivity({ id: 'sa_3', name: 'L&D Reading', bucket: 'CI', plannedStartAt: '14:00', plannedDurationMinutes: 60 })
  ]
};

// Active-composition render — Iter 25: adherence prop removed; daysSinceSignup passed directly.
function renderActiveComposition() {
  return Today({
    activeState: ACTIVE_STATE,
    daysSinceSignup: 5
  });
}

// Empty state — no composition.
function renderEmpty() {
  return Today({
    activeState: null,
    daysSinceSignup: 5
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CCC — active-composition state (PROPOSED + activities)', () => {
  test('AC-Q2: CCC ≤ 5 in active-composition state (Iter 42: cadence-ring adds 4th region)', () => {
    // Iter 42 baseline: 4 regions (header, cadence-ring, cycle-card, cycle-calendar-grid).
    // Bound updated from ≤4 to ≤5 per SW-Q-FUT-3 locked decision and QA Phase 3
    // risk notice (UX_TODAY_FUTURISTIC_DELTA.md §4). One slot of headroom preserved.
    const html = renderActiveComposition();
    const ccc = computeCCC(html);
    assert.ok(
      ccc <= 5,
      `CCC is ${ccc}, expected ≤ 5. Present regions: ${
        REGIONS.filter(([, p]) => p.test(html)).map(([n]) => n).join(', ')
      }`
    );
  });

  test('CCC >= 4 in active-composition state (lower bound guards against silent empties)', () => {
    // Iter 42: minimum 4 regions must be present:
    // header + cadence-ring + cycle-card + cycle-calendar-grid.
    const html = renderActiveComposition();
    const ccc = computeCCC(html);
    assert.ok(
      ccc >= 4,
      `CCC is ${ccc}, expected ≥ 4. Present regions: ${
        REGIONS.filter(([, p]) => p.test(html)).map(([n]) => n).join(', ')
      }`
    );
  });

  test('AC-Q3: prose-heavy region word count ≤ 25 each (no prose regions at Today level)', () => {
    // Phase A: all prose regions have been moved into CycleCard or _backup.
    // This test confirms the PROSE_REGIONS array is empty (no Today-level copy violations).
    const html = renderActiveComposition();
    const failures = [];
    for (const [cssClass, humanName] of PROSE_REGIONS) {
      const text = extractProseText(html, cssClass);
      if (text === null) continue; // region absent — no CCC point
      const wc = wordCount(text);
      if (wc > 25) {
        failures.push(
          `${humanName} (class="${cssClass}"): ${wc} words (limit 25). ` +
          `Preview: "${text.slice(0, 100)}"`
        );
      }
    }
    assert.deepEqual(
      failures,
      [],
      `Prose-region word-count violations:\n${failures.join('\n')}`
    );
  });

  test('Phase A: rhythm-explainer absent from active-composition Today output', () => {
    const html = renderActiveComposition();
    assert.ok(!html.includes('rhythm-explainer'), 'rhythm-explainer must be absent from Today output (Phase A removal)');
  });

  test('Phase A: now-pane absent from active-composition Today output', () => {
    const html = renderActiveComposition();
    assert.ok(!html.includes('now-pane'), 'now-pane must be absent (Phase A; compensated by aria-live in CycleCard)');
  });

  test('Phase A: up-next-rail absent from active-composition Today output', () => {
    const html = renderActiveComposition();
    assert.ok(!html.includes('up-next-rail'), 'up-next-rail must be absent from Today output (source kept for Week.js)');
  });

  test('Phase A: eod-closure-strip absent from active-composition Today output', () => {
    const html = renderActiveComposition();
    assert.ok(!html.includes('eod-closure-strip'), 'eod-closure-strip must be absent (EodClosureStrip moved to _backup; CTA in CycleCard footer)');
  });
});

describe('CCC — empty state', () => {
  test('AC-Q2: CCC ≤ 2 in empty state (header only)', () => {
    const html = renderEmpty();
    const ccc = computeCCC(html);
    assert.ok(
      ccc <= 2,
      `CCC is ${ccc} in empty state, expected ≤ 2. Present regions: ${
        REGIONS.filter(([, p]) => p.test(html)).map(([n]) => n).join(', ')
      }`
    );
  });
});

describe('CCC — regression guard: core regions always present in active state', () => {
  test('Iter 25: bucket-strip is NOT present (removed from CycleCard)', () => {
    const html = renderActiveComposition();
    assert.ok(
      !/class="bucket-strip"/.test(html),
      'bucket-strip must be ABSENT from active-composition HTML (Iter 25 removal)'
    );
  });

  test('Iter 25: adherence-dial is NOT present (removed from Today header)', () => {
    const html = renderActiveComposition();
    assert.ok(
      !/class="adherence-dial"/.test(html),
      'adherence-dial must be ABSENT from Today HTML (Iter 25 removal)'
    );
  });

  test('Iter 29: cycle-calendar-grid is the CCC region replacing cycle-activities', () => {
    // Iter 29: cycle-activities removed; calendar grid is the activity surface.
    const html = renderActiveComposition();
    assert.ok(
      /class="cycle-calendar-grid"/.test(html),
      'cycle-calendar-grid must be present in active-composition HTML (Iter 29 replacement)'
    );
    assert.ok(
      !/class="cycle-activities"/.test(html),
      'cycle-activities must be absent (replaced by TodayGrid in Iter 29)'
    );
  });

  test('Iter 29: sa-col-headers absent (table replaced by calendar grid)', () => {
    // Iter 29: column header row removed; calendar hour rail replaces it.
    const html = renderActiveComposition();
    assert.ok(
      !/sa-col-headers/.test(html),
      'sa-col-headers must be absent in active-composition HTML (Iter 29 removal)'
    );
    assert.ok(
      /cycle-hour-rail/.test(html),
      'cycle-hour-rail must be present (calendar hour labels)'
    );
  });
});
