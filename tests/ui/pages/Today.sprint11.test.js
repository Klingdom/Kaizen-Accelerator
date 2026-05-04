/**
 * Sprint 11 Pass 11c — Today page onboarding hint strip.
 *
 * Covers:
 *   - daysSinceSignupHint banding
 *   - Hint renders on empty-state only (not when a composition is active)
 *   - Hint does NOT render when daysSinceSignup is null / negative
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { Today, daysSinceSignupHint } from '../../../js/ui/pages/Today.js';

describe('daysSinceSignupHint — banding', () => {
  test('Day 0 returns welcome copy', () => {
    const s = daysSinceSignupHint(0);
    assert.ok(s);
    assert.match(s, /Welcome to CadencePlan/);
    assert.match(s, /Auto-Plan/);
  });

  test('Day 1 returns welcome copy', () => {
    const s = daysSinceSignupHint(1);
    assert.ok(s);
    assert.match(s, /Welcome to CadencePlan/);
  });

  test('Day 2 returns progress nudge', () => {
    const s = daysSinceSignupHint(2);
    assert.match(s, /2 days in/);
    assert.match(s, /5 accepted days/);
  });

  test('Day 6 returns progress nudge with day count', () => {
    const s = daysSinceSignupHint(6);
    assert.match(s, /6 days in/);
  });

  test('Day 7 returns Friday reflection nudge', () => {
    const s = daysSinceSignupHint(7);
    assert.match(s, /Weekly Reflection is Friday/);
  });

  test('Day 30 still returns Friday reflection nudge', () => {
    const s = daysSinceSignupHint(30);
    assert.match(s, /Weekly Reflection is Friday/);
  });

  test('negative daysSinceSignup → null', () => {
    assert.equal(daysSinceSignupHint(-1), null);
  });

  test('non-finite → null', () => {
    assert.equal(daysSinceSignupHint(NaN), null);
    assert.equal(daysSinceSignupHint(undefined), null);
    assert.equal(daysSinceSignupHint(null), null);
  });
});

describe('Today page — onboarding hint rendering', () => {
  test('renders hint strip on empty-state at Day 0', () => {
    const html = Today({
      activeState: null,
      adherence: { daysSinceSignup: 0 }
    });
    assert.match(html, /class="today-onboarding-hint"/);
    assert.match(html, /Welcome to CadencePlan/);
  });

  test('renders progress-band hint at Day 3', () => {
    const html = Today({
      activeState: null,
      adherence: { daysSinceSignup: 3 }
    });
    assert.match(html, /3 days in/);
  });

  test('renders Friday-reflection hint at Day 10', () => {
    const html = Today({
      activeState: null,
      adherence: { daysSinceSignup: 10 }
    });
    assert.match(html, /Weekly Reflection is Friday/);
  });

  test('does NOT render hint when a composition is active', () => {
    // Minimal fake composition + activities.
    const html = Today({
      activeState: {
        composition: {
          id: 'c1',
          capacityMinutes: 480,
          bucketTargets: { PROJECT: 240, COMMUNICATION: 120, CI: 120 },
          bucketFloors: { PROJECT: 120, COMMUNICATION: 60, CI: 60 },
          bucketCeilings: { PROJECT: 264, COMMUNICATION: 150, CI: 150 },
          plannedByBucket: { PROJECT: 0, COMMUNICATION: 0, CI: 0 }
        },
        activities: []
      },
      adherence: { daysSinceSignup: 0 }
    });
    assert.ok(!html.includes('today-onboarding-hint'));
  });

  test('does NOT render hint when daysSinceSignup is absent (Iter 25 behaviour)', () => {
    // Iter 25: daysSinceSignup defaults to null when omitted (no legacy default of 0).
    // No daysSinceSignup → no day badge → no onboarding hint.
    const html = Today({
      activeState: null
      // neither daysSinceSignup nor adherence provided
    });
    assert.ok(!html.includes('today-onboarding-hint'), 'hint must not render when daysSinceSignup is absent');
    assert.ok(!html.includes('today-day-badge'), 'day badge must not render when daysSinceSignup is absent');
  });

  test('hint renders in empty state (Phase A: rhythm-explainer removed, ordering test removed)', () => {
    // Phase A: RhythmExplainer moved to _backup. The DOM-ordering assertion
    // between hint and rhythm-explainer is no longer applicable.
    // Guard: confirm the hint still renders without the explainer.
    const html = Today({
      activeState: null,
      adherence: { daysSinceSignup: 0 }
    });
    const hintIdx = html.indexOf('today-onboarding-hint');
    assert.ok(hintIdx >= 0, 'expected hint to render');
    assert.ok(!html.includes('rhythm-explainer'), 'rhythm-explainer must not render (Phase A removal)');
  });

  test('hint also renders on infeasible state (empty-ish state)', () => {
    // Infeasible page is its own branch; per brief the hint only shows on
    // empty-state. Capture that it does NOT show on infeasible.
    const html = Today({
      activeState: null,
      adherence: { daysSinceSignup: 0 },
      infeasible: { explain: ['Capacity too low'] }
    });
    assert.ok(!html.includes('today-onboarding-hint'));
  });
});
