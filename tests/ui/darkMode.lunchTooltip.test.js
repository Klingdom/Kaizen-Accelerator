/**
 * AC-DM1 / AC-DM2 — Phase 1 (R3) regression tests: dark-mode token substitution.
 *
 * Parse-based tests against app.css source. No DOM rendering needed.
 *
 * Convergent finding (3/3 lenses) from UX_TODAY_REVIEW_R3_DELTA.md §3.1.
 * The lunch tooltip and bdd-rationale rules bypassed the Iter 39 semantic token
 * layer and used --color-* fallbacks that are not declared in the dark-mode
 * override block at app.css:3889. Fixed by mapping to canonical tokens.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appCssPath = resolve(__dirname, '../../app.css');
const css = readFileSync(appCssPath, 'utf8');

// ---------------------------------------------------------------------------
// Helpers — extract a CSS rule block by class selector
// ---------------------------------------------------------------------------

/**
 * Returns the text content of the first CSS rule matching `selector`.
 * Simple extraction: finds `.selector {` ... `}` (not nested).
 */
function extractRule(cssSource, selector) {
  // Escape selector for regex use
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(escaped + '\\s*\\{([^}]+)\\}');
  const m = cssSource.match(re);
  return m ? m[1] : null;
}

// ---------------------------------------------------------------------------
// AC-DM1: .lunch-tooltip-content uses --surface-card, not --color-surface
// ---------------------------------------------------------------------------

describe('AC-DM1: .lunch-tooltip-content dark-mode token', () => {
  const block = extractRule(css, '.lunch-tooltip-content');

  test('block is present in app.css', () => {
    assert.ok(block !== null, '.lunch-tooltip-content rule not found in app.css');
  });

  test('background uses --surface-card (canonical Iter 39 token)', () => {
    assert.ok(
      block.includes('--surface-card'),
      'Expected background: var(--surface-card, ...) but found: ' + block
    );
  });

  test('background does NOT use --color-surface (undeclared in dark-mode block)', () => {
    assert.ok(
      !block.includes('--color-surface'),
      '--color-surface must not appear in .lunch-tooltip-content; it is not declared in [data-theme="dark"]'
    );
  });

  test('border uses --border-subtle (canonical Iter 39 token)', () => {
    assert.ok(
      block.includes('--border-subtle'),
      'Expected border: var(--border-subtle, ...) but found: ' + block
    );
  });

  test('border does NOT use --color-border (undeclared in dark-mode block)', () => {
    assert.ok(
      !block.includes('--color-border'),
      '--color-border must not appear in .lunch-tooltip-content; it is not declared in [data-theme="dark"]'
    );
  });
});

// ---------------------------------------------------------------------------
// AC-DM1 (child spans): tooltip label / time / note tokens
// ---------------------------------------------------------------------------

describe('AC-DM1 child spans: lunch tooltip label/time/note token substitution', () => {
  test('.lunch-tooltip-label uses --text-primary (not --color-text)', () => {
    const block = extractRule(css, '.lunch-tooltip-label');
    assert.ok(block !== null, '.lunch-tooltip-label rule not found');
    assert.ok(
      block.includes('--text-primary'),
      'Expected color: var(--text-primary, ...) in .lunch-tooltip-label'
    );
    assert.ok(
      !block.includes('--color-text'),
      '--color-text must not appear in .lunch-tooltip-label'
    );
  });

  test('.lunch-tooltip-time uses --text-secondary (not --color-text-secondary)', () => {
    const block = extractRule(css, '.lunch-tooltip-time');
    assert.ok(block !== null, '.lunch-tooltip-time rule not found');
    assert.ok(
      block.includes('--text-secondary'),
      'Expected color: var(--text-secondary, ...) in .lunch-tooltip-time'
    );
    assert.ok(
      !block.includes('--color-text-secondary'),
      '--color-text-secondary must not appear in .lunch-tooltip-time'
    );
  });

  test('.lunch-tooltip-note uses --text-muted (not --color-text-muted)', () => {
    const block = extractRule(css, '.lunch-tooltip-note');
    assert.ok(block !== null, '.lunch-tooltip-note rule not found');
    assert.ok(
      block.includes('--text-muted'),
      'Expected color: var(--text-muted, ...) in .lunch-tooltip-note'
    );
    assert.ok(
      !block.includes('--color-text-muted'),
      '--color-text-muted must not appear in .lunch-tooltip-note'
    );
  });
});

// ---------------------------------------------------------------------------
// AC-DM2: .bdd-rationale uses --text-secondary, not --color-text-secondary
// ---------------------------------------------------------------------------

describe('AC-DM2: .bdd-rationale dark-mode token', () => {
  const block = extractRule(css, '.bdd-rationale');

  test('block is present in app.css', () => {
    assert.ok(block !== null, '.bdd-rationale rule not found in app.css');
  });

  test('color uses --text-secondary (canonical Iter 39 token)', () => {
    assert.ok(
      block.includes('--text-secondary'),
      'Expected color: var(--text-secondary, ...) but found: ' + block
    );
  });

  test('color does NOT use --color-text-secondary (undeclared in dark-mode block)', () => {
    assert.ok(
      !block.includes('--color-text-secondary'),
      '--color-text-secondary must not appear in .bdd-rationale; it is not declared in [data-theme="dark"]'
    );
  });
});
