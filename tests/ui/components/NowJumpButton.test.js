/**
 * NowJumpButton — Iter 43 Item 7 unit tests (AC14, AC15).
 *
 * Verifies: renders a sticky button, carries SCROLL_TO_NOW action,
 * has accessible label, contains visible "Now" text.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { NowJumpButton } from '../../../js/ui/components/NowJumpButton.js';

describe('NowJumpButton — render', () => {
  test('renders a <button> element', () => {
    const html = NowJumpButton();
    assert.ok(html.includes('<button'), 'Must render a <button> element');
  });

  test('carries data-action="SCROLL_TO_NOW"', () => {
    const html = NowJumpButton();
    assert.ok(
      html.includes('data-action="SCROLL_TO_NOW"'),
      'Must carry SCROLL_TO_NOW action for app.js click delegate'
    );
  });

  test('has class now-jump-btn for CSS targeting', () => {
    const html = NowJumpButton();
    assert.ok(html.includes('class="now-jump-btn"'), 'Must have now-jump-btn class');
  });

  test('has accessible aria-label', () => {
    const html = NowJumpButton();
    assert.ok(
      html.includes('aria-label="Jump to current time"'),
      'Must have aria-label for screen readers (WCAG AA, AC18)'
    );
  });

  test('contains visible "Now" text for sighted users', () => {
    const html = NowJumpButton();
    assert.ok(html.includes('Now'), 'Must contain "Now" text for visual affordance');
  });

  test('has type="button" to prevent accidental form submission', () => {
    const html = NowJumpButton();
    assert.ok(html.includes('type="button"'), 'Must declare type="button"');
  });
});

// ---------------------------------------------------------------------------
// Phase 3.3 (R3): directional arrow removed — AC-NJ1/2/3
// ---------------------------------------------------------------------------

describe('NowJumpButton Phase 3.3 — no directional arrow', () => {
  test('AC-NJ1: button text is "Now" (no arrow prefix)', () => {
    const html = NowJumpButton();
    // Must contain "Now" as visible text
    assert.ok(html.includes('>Now<'), 'AC-NJ1: button content must be plain "Now" with no arrow');
  });

  test('AC-NJ2: click dispatches SCROLL_TO_NOW', () => {
    const html = NowJumpButton();
    assert.ok(
      html.includes('data-action="SCROLL_TO_NOW"'),
      'AC-NJ2: button must carry data-action="SCROLL_TO_NOW" for click delegate'
    );
  });

  test('AC-NJ3: no down-arrow character in rendered output', () => {
    const html = NowJumpButton();
    // Must not contain the down-arrow in any encoding variant
    assert.ok(
      !html.includes('↓'),
      'AC-NJ3: rendered HTML must not contain the ↓ Unicode character'
    );
    assert.ok(
      !html.includes('&#8595;'),
      'AC-NJ3: rendered HTML must not contain the &#8595; HTML entity'
    );
    assert.ok(
      !html.includes('&#x2193;'),
      'AC-NJ3: rendered HTML must not contain the &#x2193; hex entity'
    );
  });
});
