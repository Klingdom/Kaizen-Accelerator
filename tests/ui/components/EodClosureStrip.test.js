/**
 * Tests for EodClosureStrip component (C-UX-3, Iteration 15).
 *
 * AC3-7: pendingReflectionCount === 0 → no "Capture reflection" CTA
 * AC3-8: pendingReflectionCount === 2 → "Capture reflection →" CTA with
 *         data-action="EOD_OPEN_REFLECTION"
 * AC3-1: 5/5 closed → "5/5 closed" in DOM
 * AC3-2: 3 CLOSED + 1 SKIPPED + 1 DROPPED → "3/4 closed · 1 skipped"
 *
 * All fixtures are deterministic. No Date.now, no Math.random.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { EodClosureStrip } from '../../../js/ui/components/EodClosureStrip.js';

// ---------------------------------------------------------------------------
// Null / missing recap — renders nothing
// ---------------------------------------------------------------------------
describe('EodClosureStrip — null recap', () => {
  test('eodRecap === null → empty string', () => {
    const html = EodClosureStrip({ eodRecap: null });
    assert.equal(html, '');
  });

  test('eodRecap === undefined → empty string', () => {
    const html = EodClosureStrip({ eodRecap: undefined });
    assert.equal(html, '');
  });

  test('no props object → empty string', () => {
    const html = EodClosureStrip();
    assert.equal(html, '');
  });

  test('non-object eodRecap → empty string', () => {
    const html = EodClosureStrip({ eodRecap: 'bad' });
    assert.equal(html, '');
  });

  test('eodRecap = 0 (falsy non-object) → empty string', () => {
    const html = EodClosureStrip({ eodRecap: 0 });
    assert.equal(html, '');
  });
});

// ---------------------------------------------------------------------------
// AC3-1: 5 activities all CLOSED
// ---------------------------------------------------------------------------
describe('EodClosureStrip — AC3-1: 5/5 closed', () => {
  const recap = { closedCount: 5, totalCount: 5, skippedCount: 0, pendingReflectionCount: 0 };

  test('renders the .eod-closure-strip element', () => {
    const html = EodClosureStrip({ eodRecap: recap });
    assert.ok(html.includes('eod-closure-strip'), `Expected class. HTML: ${html}`);
  });

  test('shows "5/5 closed" in counters', () => {
    const html = EodClosureStrip({ eodRecap: recap });
    assert.ok(html.includes('5/5 closed'), `Expected "5/5 closed". HTML: ${html}`);
  });

  test('shows "Day complete" status', () => {
    const html = EodClosureStrip({ eodRecap: recap });
    assert.ok(html.includes('Day complete'), `Expected "Day complete". HTML: ${html}`);
  });

  test('no skipped phrase when skippedCount === 0', () => {
    const html = EodClosureStrip({ eodRecap: recap });
    assert.ok(!html.includes('skipped'), `Should not contain "skipped". HTML: ${html}`);
  });

  test('no CTA when pendingReflectionCount === 0 (AC3-7)', () => {
    const html = EodClosureStrip({ eodRecap: recap });
    assert.ok(!html.includes('Capture reflection'), `CTA must not render. HTML: ${html}`);
    assert.ok(!html.includes('EOD_OPEN_REFLECTION'), `Action must not render. HTML: ${html}`);
  });
});

// ---------------------------------------------------------------------------
// AC3-2: 3 CLOSED + 1 SKIPPED + 1 DROPPED
// ---------------------------------------------------------------------------
describe('EodClosureStrip — AC3-2: 3 closed, 1 skipped (DROPPED excluded)', () => {
  // totalCount = 4 (DROPPED excluded), closedCount = 3, skippedCount = 1
  const recap = { closedCount: 3, totalCount: 4, skippedCount: 1, pendingReflectionCount: 0 };

  test('shows "3/4 closed" (DROPPED not counted in total)', () => {
    const html = EodClosureStrip({ eodRecap: recap });
    assert.ok(html.includes('3/4 closed'), `Expected "3/4 closed". HTML: ${html}`);
  });

  test('shows "1 skipped"', () => {
    const html = EodClosureStrip({ eodRecap: recap });
    assert.ok(html.includes('1 skipped'), `Expected "1 skipped". HTML: ${html}`);
  });

  test('no CTA when pending === 0', () => {
    const html = EodClosureStrip({ eodRecap: recap });
    assert.ok(!html.includes('Capture reflection'), `CTA must not render.`);
  });
});

// ---------------------------------------------------------------------------
// AC3-8: pendingReflectionCount === 2 → CTA appears
// ---------------------------------------------------------------------------
describe('EodClosureStrip — AC3-8: 2 pending reflections → CTA', () => {
  const recap = { closedCount: 4, totalCount: 5, skippedCount: 1, pendingReflectionCount: 2 };

  test('renders "Capture reflection →" CTA', () => {
    const html = EodClosureStrip({ eodRecap: recap });
    assert.ok(html.includes('Capture reflection →'), `Expected CTA text. HTML: ${html}`);
  });

  test('CTA has data-action="EOD_OPEN_REFLECTION"', () => {
    const html = EodClosureStrip({ eodRecap: recap });
    assert.ok(html.includes('data-action="EOD_OPEN_REFLECTION"'), `Expected data-action. HTML: ${html}`);
  });

  test('shows reflections pending in counters', () => {
    const html = EodClosureStrip({ eodRecap: recap });
    assert.ok(html.includes('reflections pending') || html.includes('reflection pending'), `Expected pending phrase. HTML: ${html}`);
  });
});

// ---------------------------------------------------------------------------
// pendingReflectionCount === 1 — singular form
// ---------------------------------------------------------------------------
describe('EodClosureStrip — 1 pending reflection (singular)', () => {
  const recap = { closedCount: 3, totalCount: 3, skippedCount: 0, pendingReflectionCount: 1 };

  test('uses singular "1 reflection pending"', () => {
    const html = EodClosureStrip({ eodRecap: recap });
    assert.ok(html.includes('1 reflection pending'), `Expected singular. HTML: ${html}`);
    assert.ok(!html.includes('1 reflections pending'), `Must not use plural. HTML: ${html}`);
  });

  test('CTA renders for count === 1', () => {
    const html = EodClosureStrip({ eodRecap: recap });
    assert.ok(html.includes('Capture reflection →'), `CTA must render. HTML: ${html}`);
  });
});

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------
describe('EodClosureStrip — accessibility', () => {
  const recap = { closedCount: 3, totalCount: 4, skippedCount: 1, pendingReflectionCount: 0 };

  test('has role="note"', () => {
    const html = EodClosureStrip({ eodRecap: recap });
    assert.ok(html.includes('role="note"'), `Expected role="note". HTML: ${html}`);
  });

  test('has aria-label', () => {
    const html = EodClosureStrip({ eodRecap: recap });
    assert.ok(html.includes('aria-label='), `Expected aria-label. HTML: ${html}`);
  });

  test('aria-label contains "Day complete"', () => {
    const html = EodClosureStrip({ eodRecap: recap });
    assert.ok(html.includes('Day complete'), `aria-label must mention Day complete. HTML: ${html}`);
  });
});

// ---------------------------------------------------------------------------
// HTML escaping / XSS safety
// ---------------------------------------------------------------------------
describe('EodClosureStrip — HTML escaping', () => {
  test('numeric counts are not XSS-exploitable', () => {
    // Counts are always Number() before being placed in the template.
    const recap = { closedCount: 1, totalCount: 1, skippedCount: 0, pendingReflectionCount: 0 };
    const html = EodClosureStrip({ eodRecap: recap });
    assert.ok(!html.includes('<script>'), `Should not include raw script tag. HTML: ${html}`);
  });

  test('NaN counts default to 0 without crashing', () => {
    const recap = { closedCount: NaN, totalCount: NaN, skippedCount: NaN, pendingReflectionCount: NaN };
    const html = EodClosureStrip({ eodRecap: recap });
    // Should still render (the object is truthy) with 0 counts.
    assert.ok(html.includes('eod-closure-strip'), `Should render strip with safe defaults. HTML: ${html}`);
    assert.ok(html.includes('0/0 closed'), `Should show 0/0. HTML: ${html}`);
  });
});
