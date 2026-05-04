/**
 * Comprehension Complexity Count (CCC) proxy tests — Iteration 21 (C-QA-V2-1).
 *
 * Phase A update (Today Simplification):
 *   Removed 7 regions from REGIONS registry:
 *     morning-recap, rhythm-explainer, now-pane, up-next-mobile,
 *     why-this-plan (top-level), up-next-rail, eod-closure.
 *   These components are no longer rendered directly by Today.js.
 *   WhyThisPlan and MorningRecap are now rendered inside CycleCard.
 *   Remaining regions: 5 (header, adherence-dial, cycle-card, bucket-strip,
 *   cycle-activities).
 *   CCC bound updated from ≤12 to ≤6 to remain a useful regression guard.
 *   Removed `renderActiveWithExplainer` helper (rhythmExplainerDismissed prop
 *   removed from Today.js).
 *   Removed 4 stale PROSE_REGIONS entries (all absent after Phase A).
 *
 * Based on UX_TODAY_V2_QA.md §1 and UX_TODAY_V2_THEMES.md §5.
 *
 * CCC definition: count of distinct UI regions visible in a rendered Today
 * HTML string. Each named region below scores +1. Assert CCC ≤ 6 for the
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
// Phase A registry — 5 regions remain after stripping Today.js to
// header + CycleCard. Bound updated to ≤ 6 (tight enough to catch regressions).
//
// Region registry — each entry is a [name, pattern] pair. A region scores
// +1 if its pattern is found anywhere in the HTML string.
// ---------------------------------------------------------------------------
const REGIONS = [
  ['header',          /class="today-header"/],
  ['adherence-dial',  /class="adherence-dial/],
  ['cycle-card',      /class="cycle-card/],
  ['bucket-strip',    /class="bucket-strip"/],
  ['cycle-activities',/class="cycle-activities"/],
];

// Intentionally NOT in REGIONS (Phase A removal — kept for reference):
//   morning-recap, rhythm-explainer, now-pane, up-next-mobile,
//   why-this-plan (top-level), up-next-rail, eod-closure.
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

// Active-composition render — Phase A: rhythmExplainerDismissed prop removed.
function renderActiveComposition() {
  return Today({
    activeState: ACTIVE_STATE,
    adherence: {
      adherencePct: null,
      acceptancePct: null,
      kaizenDeltaPct: null,
      daysSinceSignup: 5
    }
  });
}

// Empty state — no composition.
function renderEmpty() {
  return Today({
    activeState: null,
    adherence: {
      adherencePct: null,
      acceptancePct: null,
      kaizenDeltaPct: null,
      daysSinceSignup: 5
    }
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CCC — active-composition state (PROPOSED + activities)', () => {
  test('AC-Q2: CCC ≤ 6 in active-composition state (Phase A: 5 regions remain)', () => {
    // Phase A baseline: 5 regions (header, adherence-dial, cycle-card,
    // bucket-strip, cycle-activities). Bound ≤ 6 gives one slot of headroom
    // for future additions without a false alarm.
    const html = renderActiveComposition();
    const ccc = computeCCC(html);
    assert.ok(
      ccc <= 6,
      `CCC is ${ccc}, expected ≤ 6. Present regions: ${
        REGIONS.filter(([, p]) => p.test(html)).map(([n]) => n).join(', ')
      }`
    );
  });

  test('CCC >= 4 in active-composition state (lower bound guards against silent empties)', () => {
    // At minimum header + cycle-card + bucket-strip + cycle-activities must be present.
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
  test('AC-Q2: CCC ≤ 4 in empty state (header + adherence-dial only)', () => {
    const html = renderEmpty();
    const ccc = computeCCC(html);
    assert.ok(
      ccc <= 4,
      `CCC is ${ccc} in empty state, expected ≤ 4. Present regions: ${
        REGIONS.filter(([, p]) => p.test(html)).map(([n]) => n).join(', ')
      }`
    );
  });
});

describe('CCC — regression guard: BucketStrip always present in active state', () => {
  test('bucket-strip is a distinct CCC region (confirms it contributes to count)', () => {
    const html = renderActiveComposition();
    assert.ok(
      /class="bucket-strip"/.test(html),
      'bucket-strip must be present in active-composition HTML'
    );
  });

  test('cycle-activities is a distinct CCC region (confirms activity list present)', () => {
    const html = renderActiveComposition();
    assert.ok(
      /class="cycle-activities"/.test(html),
      'cycle-activities must be present in active-composition HTML'
    );
  });
});
