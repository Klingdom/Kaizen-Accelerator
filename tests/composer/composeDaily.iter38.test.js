/**
 * Iter 38 Phase B — composeDaily new tests.
 *
 * Covers:
 *   - POST_DEEP_COMM anchor emitted at 15:30 / 15 min / COMMUNICATION
 *   - AC5: default daily COMM total = 120 min
 *   - POST_DEEP_COMM slotKind is 'POST_DEEP_COMM'
 *   - INFEASIBLE rate observation (threshold unchanged)
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { composeDaily, DAILY_NON_OPTIONAL_SET } from '../../js/composer/composeDaily.js';
import { buildGoldenComposerInput, GOLDEN_FULL_CATALOG } from '../fixtures/goldenDay.js';

// Full-day input with no external drain (120 min COMM budget).
function fullDayInput(overrides = {}) {
  return {
    cycleType: 'DAILY',
    userId: 'u_iter38',
    date: '2026-04-30',
    dailyCapacityMinutes: 480,
    externalMinutesToday: 0,
    role: ['PRACTITIONER'],
    varianceQueue: [],
    catalog: overrides.catalog ?? GOLDEN_FULL_CATALOG.map((c) => ({ ...c })),
    activeKaizen: overrides.activeKaizen ?? null,
    priorCompositions: [],
    signals: { inboxOverThreshold: false, documentAwaitingReview: [], innovationStageReady: [] },
    _now: '2026-04-30T09:00:00Z',
    ...overrides
  };
}

// ---------------------------------------------------------------------------
// AC1: DAILY_NON_OPTIONAL_SET includes POST_DEEP_COMM at 15:30 / 15 min / COMMUNICATION
// ---------------------------------------------------------------------------
describe('Iter 38 — AC1: POST_DEEP_COMM in DAILY_NON_OPTIONAL_SET', () => {
  test('DAILY_NON_OPTIONAL_SET has 5 entries', () => {
    assert.equal(DAILY_NON_OPTIONAL_SET.length, 5);
  });

  test('POST_DEEP_COMM entry has correct properties', () => {
    const entry = DAILY_NON_OPTIONAL_SET.find((s) => s.slotKind === 'POST_DEEP_COMM');
    assert.ok(entry, 'POST_DEEP_COMM entry missing from DAILY_NON_OPTIONAL_SET');
    assert.equal(entry.anchor, '15:30');
    assert.equal(entry.defaultMinutes, 15);
    assert.equal(entry.bucket, 'COMMUNICATION');
    assert.equal(entry.name, 'End-of-Deep-Cycles Communication');
    assert.equal(entry.id, 'gen_value_added_communication');
  });
});

// ---------------------------------------------------------------------------
// AC5: Default daily composition outputs exactly 120 min COMMUNICATION
// ---------------------------------------------------------------------------
describe('Iter 38 — AC5: daily COMM total = 120 min on full-day', () => {
  test('full-day composition COMM = 120 min (15+60+30+15)', () => {
    const input = fullDayInput();
    const out = composeDaily(input);
    // May be INFEASIBLE if no deep payload; check placed regardless.
    const commTotal = out.placed
      .filter((p) => p.bucket === 'COMMUNICATION')
      .reduce((s, p) => s + (p.plannedDurationMinutes ?? 0), 0);
    assert.equal(commTotal, 120, `COMM total expected 120, got ${commTotal}`);
  });

  test('POST_DEEP_COMM block appears in placed with slotKind=POST_DEEP_COMM', () => {
    const input = fullDayInput();
    const out = composeDaily(input);
    const postDeep = out.placed.find((p) => p.slotKind === 'POST_DEEP_COMM');
    assert.ok(postDeep, 'POST_DEEP_COMM block missing from placed[]');
    assert.equal(postDeep.name, 'End-of-Deep-Cycles Communication');
    assert.equal(postDeep.plannedDurationMinutes, 15);
    assert.equal(postDeep.bucket, 'COMMUNICATION');
  });

  test('POST_DEEP_COMM anchor is set to 15:30 in orderDay output', () => {
    const input = fullDayInput();
    const out = composeDaily(input);
    const postDeep = out.placed.find((p) => p.slotKind === 'POST_DEEP_COMM');
    assert.ok(postDeep, 'POST_DEEP_COMM block missing');
    // orderDay sets plannedStartAt from the anchor='15:30' in the spec.
    assert.equal(postDeep.plannedStartAt, '15:30');
  });

  test('why[] contains R1_NON_OPTIONAL entry for POST_DEEP_COMM', () => {
    const input = fullDayInput();
    const out = composeDaily(input);
    const r1 = out.why.filter((w) => w.rule === 'R1_NON_OPTIONAL');
    assert.ok(r1.length >= 5, `Expected ≥5 R1_NON_OPTIONAL entries, got ${r1.length}`);
    const hasPostDeep = r1.some((w) => w.detail.includes('End-of-Deep-Cycles'));
    assert.ok(hasPostDeep, 'No R1 entry mentioning End-of-Deep-Cycles');
  });
});

// ---------------------------------------------------------------------------
// AC4: POST_DEEP_COMM present in placed even on lean COMM budget (no relax drop)
// ---------------------------------------------------------------------------
describe('Iter 38 — POST_DEEP_COMM preserved under lean COMM budget', () => {
  test('lean COMM (ext=60): POST_DEEP_COMM stays at 15 min, AM+Post shrink', () => {
    // Golden input has ext=60, COMM target=60.
    // With commNeeded=120 > budget=60: shrink AM+Post; POST_DEEP stays at default.
    const input = buildGoldenComposerInput();
    const out = composeDaily(input);
    const postDeep = out.placed.find((p) => p.slotKind === 'POST_DEEP_COMM');
    assert.ok(postDeep, 'POST_DEEP_COMM missing on lean budget');
    assert.equal(postDeep.plannedDurationMinutes, 15);
  });
});

// ---------------------------------------------------------------------------
// INFEASIBLE rate observation
// ---------------------------------------------------------------------------
describe('Iter 38 — INFEASIBLE rate observation', () => {
  test('full-day with full catalog remains PROPOSED (not INFEASIBLE)', () => {
    const input = fullDayInput({
      activeKaizen: {
        id: 'k_iter38',
        title: 'Test Kaizen',
        state: 'ACTIVE',
        projectType: 'AD_HOC',
        phase: null,
        nextStepActivityNumber: 34
      }
    });
    const out = composeDaily(input);
    // A feasible full-day with DMAIC Kaizen should still compose as PROPOSED.
    assert.equal(out.state, 'PROPOSED',
      `Expected PROPOSED, got ${out.state}. INFEASIBLE detail: ${JSON.stringify(out.infeasible?.explain)}`
    );
  });

  test('overcrowded day (480-min cap with 60-min external) still resolves', () => {
    // This is the golden scenario: ext=60 → effective cap 420. COMM target=60.
    // Composition with POST_DEEP_COMM (15 min, COMM) should still resolve.
    const input = buildGoldenComposerInput({ catalog: GOLDEN_FULL_CATALOG.map((c) => ({ ...c })) });
    const out = composeDaily(input);
    // Golden scenario has been feasible pre-Iter38; verify it still is.
    assert.notEqual(out.state, 'INFEASIBLE',
      `Unexpected INFEASIBLE: ${JSON.stringify(out.infeasible?.explain ?? out.reason)}`
    );
  });
});
