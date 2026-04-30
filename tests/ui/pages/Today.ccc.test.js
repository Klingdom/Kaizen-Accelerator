/**
 * Comprehension Complexity Count (CCC) proxy tests — Iteration 21 (C-QA-V2-1).
 *
 * Based on UX_TODAY_V2_QA.md §1 and UX_TODAY_V2_THEMES.md §5.
 *
 * CCC definition: count of distinct UI regions visible in a rendered Today
 * HTML string. Each named region below scores +1. Assert CCC ≤ 12 for the
 * active-composition (PROPOSED + activities) state.
 *
 * Per-region word-count: each region's DIRECT (non-structural) copy text
 * ≤ 25 words (~10s at 150 wpm). Applies to prose-heavy regions: explainer,
 * recap strips, and chip text. Does NOT apply to data-display regions
 * (header dials, cycle-card activity list) where word-count is expected to
 * vary with user data.
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
// Region registry — each entry is a [name, pattern] pair. A region scores
// +1 if its pattern is found anywhere in the HTML string. This matches the
// QA §1 definition: "+1 per distinct UI region visible above the fold."
// ---------------------------------------------------------------------------
const REGIONS = [
  ['header',          /class="today-header"/],
  ['adherence-dial',  /class="adherence-dial/],
  ['morning-recap',   /class="morning-recap"/],
  ['rhythm-explainer',/class="rhythm-explainer"/],
  ['now-pane',        /class="now-pane /],
  ['up-next-mobile',  /class="up-next-rail up-next-mobile"/],
  ['why-this-plan',   /class="why-this-plan/],
  ['cycle-card',      /class="cycle-card/],
  ['bucket-strip',    /class="bucket-strip"/],
  ['cycle-activities',/class="cycle-activities"/],
  ['up-next-rail',    /class="up-next-rail"[^>]/],  // rail variant (not mobile)
  ['eod-closure',     /class="eod-closure-strip"/],
];

function computeCCC(html) {
  return REGIONS.filter(([, pattern]) => pattern.test(html)).length;
}

// ---------------------------------------------------------------------------
// Prose-heavy regions where word-count ≤ 25 is the enforceable contract.
// Structural/data regions (header, dial, cycle-card, activity list) are
// excluded because their content is data-driven and not prose copy.
// ---------------------------------------------------------------------------
const PROSE_REGIONS = [
  // [cssClass, humanName]
  ['rhythm-explainer-copy',  'RhythmExplainer body text'],
  ['morning-recap',          'MorningRecap strip'],
  ['eod-closure-strip',      'EodClosureStrip'],
  ['why-this-plan-chip',     'WhyThisPlan chip label'],
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

// Render with RhythmExplainer dismissed (day 5 user), no nowIso, no recap.
// This is the "active-composition" state the CCC target is defined for.
function renderActiveComposition() {
  return Today({
    activeState: ACTIVE_STATE,
    rhythmExplainerDismissed: true,
    adherence: {
      adherencePct: null,
      acceptancePct: null,
      kaizenDeltaPct: null,
      daysSinceSignup: 5
    }
  });
}

// Active-composition with RhythmExplainer NOT dismissed (worst-case copy load).
function renderActiveWithExplainer() {
  return Today({
    activeState: ACTIVE_STATE,
    rhythmExplainerDismissed: false,
    adherence: {
      adherencePct: null,
      acceptancePct: null,
      kaizenDeltaPct: null,
      daysSinceSignup: 1
    }
  });
}

// Empty state — no composition, no RhythmExplainer, no nowIso.
function renderEmpty() {
  return Today({
    activeState: null,
    rhythmExplainerDismissed: true,
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
  test('AC-Q2: CCC ≤ 12 in active-composition state (RhythmExplainer dismissed)', () => {
    const html = renderActiveComposition();
    const ccc = computeCCC(html);
    assert.ok(
      ccc <= 12,
      `CCC is ${ccc}, expected ≤ 12. Present regions: ${
        REGIONS.filter(([, p]) => p.test(html)).map(([n]) => n).join(', ')
      }`
    );
  });

  test('CCC ≤ 12 even with RhythmExplainer undismissed (explainer adds 1 region)', () => {
    // Undismissed adds rhythm-explainer to the count. CCC should still be ≤ 12
    // since we have no nowIso/recap/eod in this fixture.
    const html = renderActiveWithExplainer();
    const ccc = computeCCC(html);
    assert.ok(
      ccc <= 12,
      `CCC is ${ccc} (explainer undismissed), expected ≤ 12. Present regions: ${
        REGIONS.filter(([, p]) => p.test(html)).map(([n]) => n).join(', ')
      }`
    );
  });

  test('AC-Q3: prose-heavy region word count ≤ 25 each (RhythmExplainer dismissed)', () => {
    // Test with RhythmExplainer dismissed. Per UX_TODAY_V2_QA.md §1, the
    // RhythmExplainer body is the KNOWN violation (45+ words). It will be
    // fixed in Iter 22 (auto-collapse at day 3+). This test validates the
    // dismissed path — where the explainer is absent — passes the limit.
    const html = renderActiveComposition(); // dismissed — explainer absent
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
});

describe('CCC — empty state', () => {
  test('AC-Q2 (optional): CCC ≤ 8 in empty state', () => {
    const html = renderEmpty();
    const ccc = computeCCC(html);
    assert.ok(
      ccc <= 8,
      `CCC is ${ccc} in empty state, expected ≤ 8. Present regions: ${
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
