/**
 * Tests for MorningRecap component (C-UX-10, Iteration 14).
 *
 * AC10-1: daysSinceSignup === 0 → strip suppressed (handled by Today, but
 *         MorningRecap itself renders nothing when priorDayRecap is null).
 * AC10-2: 5/6 closed, 1 skipped → "Yesterday: 5/6 closed · 1 skipped"
 * AC10-3: no prior-day recap → renders nothing
 * AC10-4: 0 closed, M total   → "Yesterday: 0/M closed — fresh start today"
 * AC10-5: strip appears before RhythmExplainer (asserted in Today tests)
 *
 * All fixtures deterministic. No Date.now, no Math.random.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { MorningRecap } from '../../../js/ui/components/MorningRecap.js';

// ---------------------------------------------------------------------------
// Null / missing recap
// ---------------------------------------------------------------------------
describe('MorningRecap — null recap (AC10-1 / AC10-3)', () => {
  test('priorDayRecap === null → empty string', () => {
    const html = MorningRecap({ priorDayRecap: null });
    assert.equal(html, '');
  });

  test('priorDayRecap === undefined → empty string', () => {
    const html = MorningRecap({ priorDayRecap: undefined });
    assert.equal(html, '');
  });

  test('no props object → empty string', () => {
    const html = MorningRecap();
    assert.equal(html, '');
  });

  test('non-object priorDayRecap → empty string', () => {
    const html = MorningRecap({ priorDayRecap: 'bad' });
    assert.equal(html, '');
  });
});

// ---------------------------------------------------------------------------
// AC10-2: 5 closed, 6 total, 1 skipped
// ---------------------------------------------------------------------------
describe('MorningRecap — closed count ≥ 1 (AC10-2)', () => {
  const recap = { closedCount: 5, totalCount: 6, skippedCount: 1, dateIso: '2026-04-26' };

  test('renders the .morning-recap element', () => {
    const html = MorningRecap({ priorDayRecap: recap });
    assert.ok(html.includes('morning-recap'), `Expected class. HTML: ${html}`);
  });

  test('shows closed count and total', () => {
    const html = MorningRecap({ priorDayRecap: recap });
    assert.ok(html.includes('5/6 closed'), `Expected "5/6 closed". HTML: ${html}`);
  });

  test('shows skipped count when > 0', () => {
    const html = MorningRecap({ priorDayRecap: recap });
    assert.ok(html.includes('1 skipped'), `Expected "1 skipped". HTML: ${html}`);
  });

  test('copy starts with "Yesterday:"', () => {
    const html = MorningRecap({ priorDayRecap: recap });
    assert.ok(html.includes('Yesterday:'), `Expected "Yesterday:". HTML: ${html}`);
  });
});

// ---------------------------------------------------------------------------
// AC10-2 variant: 0 skipped (no skip part in copy)
// ---------------------------------------------------------------------------
describe('MorningRecap — closed ≥ 1 but skipped = 0', () => {
  const recap = { closedCount: 3, totalCount: 4, skippedCount: 0, dateIso: '2026-04-26' };

  test('omits the skipped phrase when skippedCount is 0', () => {
    const html = MorningRecap({ priorDayRecap: recap });
    assert.ok(!html.includes('skipped'), `Should not contain "skipped". HTML: ${html}`);
  });

  test('still shows the closed/total fraction', () => {
    const html = MorningRecap({ priorDayRecap: recap });
    assert.ok(html.includes('3/4 closed'), `Expected "3/4 closed". HTML: ${html}`);
  });
});

// ---------------------------------------------------------------------------
// AC10-4: 0 closed → fresh start copy
// ---------------------------------------------------------------------------
describe('MorningRecap — 0 closed (AC10-4)', () => {
  const recap = { closedCount: 0, totalCount: 4, skippedCount: 2, dateIso: '2026-04-26' };

  test('renders fresh-start copy when closedCount is 0', () => {
    const html = MorningRecap({ priorDayRecap: recap });
    assert.ok(html.includes('fresh start today'), `Expected "fresh start today". HTML: ${html}`);
  });

  test('shows 0/M fraction', () => {
    const html = MorningRecap({ priorDayRecap: recap });
    assert.ok(html.includes('0/4 closed'), `Expected "0/4 closed". HTML: ${html}`);
  });

  test('still renders the .morning-recap element', () => {
    const html = MorningRecap({ priorDayRecap: recap });
    assert.ok(html.includes('morning-recap'), `Expected class. HTML: ${html}`);
  });
});

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------
describe('MorningRecap — accessibility', () => {
  test('has role="note"', () => {
    const recap = { closedCount: 2, totalCount: 3, skippedCount: 0, dateIso: '2026-04-26' };
    const html = MorningRecap({ priorDayRecap: recap });
    assert.ok(html.includes('role="note"'), `Expected role="note". HTML: ${html}`);
  });

  test('has aria-label', () => {
    const recap = { closedCount: 2, totalCount: 3, skippedCount: 0, dateIso: '2026-04-26' };
    const html = MorningRecap({ priorDayRecap: recap });
    assert.ok(html.includes('aria-label='), `Expected aria-label. HTML: ${html}`);
  });
});

// ---------------------------------------------------------------------------
// XSS safety
// ---------------------------------------------------------------------------
describe('MorningRecap — HTML escaping', () => {
  test('dateIso is not rendered directly in copy (not XSS-relevant path)', () => {
    // The component doesn't render dateIso in visible copy; this confirms
    // counts are numeric-safe.
    const recap = { closedCount: 1, totalCount: 1, skippedCount: 0, dateIso: '<script>x</script>' };
    const html = MorningRecap({ priorDayRecap: recap });
    assert.ok(!html.includes('<script>'), `Should not include raw script tag. HTML: ${html}`);
  });
});
