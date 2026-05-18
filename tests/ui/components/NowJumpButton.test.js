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
