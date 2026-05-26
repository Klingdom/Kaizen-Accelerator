/**
 * Today Preview Port — Phase C regression tests.
 * TODAY_PREVIEW_PORT_DELTA.md §8 Phase C.
 *
 * Parse-based tests against app.css. No DOM or component rendering needed.
 *
 * Items covered:
 *   C-1: Easing token vocabulary (--ease-spring, --ease-bounce, --ease-std)
 *   C-2: Shadow token vocabulary (--shadow-sm, --shadow-md, --shadow-lg)
 *   C-3: Ambient page depth (body::before radial glow)
 *   C-4: Nav chrome luminance hierarchy (hex → semantic tokens)
 *
 * Token discipline: Iter 39 lesson — no --color-* tokens introduced.
 * All new tokens additive; existing animations updated to use them.
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
// C-1: Easing token vocabulary
// ---------------------------------------------------------------------------

describe('Phase C — C-1: Easing token vocabulary', () => {
  test('AC-TOK-EASE-1: --ease-spring is defined in :root', () => {
    assert.ok(
      css.includes('--ease-spring'),
      ':root must define --ease-spring token'
    );
  });

  test('AC-TOK-EASE-2: --ease-bounce is defined in :root', () => {
    assert.ok(
      css.includes('--ease-bounce'),
      ':root must define --ease-bounce token'
    );
  });

  test('AC-TOK-EASE-3: --ease-std is defined in :root', () => {
    assert.ok(
      css.includes('--ease-std'),
      ':root must define --ease-std token'
    );
  });

  test('AC-TOK-EASE-4: --ease-spring uses cubic-bezier(0.16, 1, 0.3, 1) (preview-extracted)', () => {
    // Extract :root block
    const rootIdx = css.indexOf(':root {');
    const rootStart = css.indexOf('{', rootIdx);
    const rootEnd = css.indexOf('}', rootStart);
    const rootBlock = css.slice(rootStart, rootEnd);
    assert.ok(
      rootBlock.includes('--ease-spring') && rootBlock.includes('cubic-bezier(0.16, 1, 0.3, 1)'),
      '--ease-spring must equal cubic-bezier(0.16, 1, 0.3, 1) per preview line 32'
    );
  });

  test('AC-TOK-EASE-5: --ease-bounce uses cubic-bezier(0.34, 1.56, 0.64, 1) (preview-extracted)', () => {
    const rootIdx = css.indexOf(':root {');
    const rootStart = css.indexOf('{', rootIdx);
    const rootEnd = css.indexOf('}', rootStart);
    const rootBlock = css.slice(rootStart, rootEnd);
    assert.ok(
      rootBlock.includes('--ease-bounce') && rootBlock.includes('cubic-bezier(0.34, 1.56, 0.64, 1)'),
      '--ease-bounce must equal cubic-bezier(0.34, 1.56, 0.64, 1) per preview line 33'
    );
  });

  test('AC-TOK-EASE-6: --ease-std uses cubic-bezier(0.4, 0, 0.2, 1) (preview-extracted)', () => {
    const rootIdx = css.indexOf(':root {');
    const rootStart = css.indexOf('{', rootIdx);
    const rootEnd = css.indexOf('}', rootStart);
    const rootBlock = css.slice(rootStart, rootEnd);
    assert.ok(
      rootBlock.includes('--ease-std') && rootBlock.includes('cubic-bezier(0.4, 0, 0.2, 1)'),
      '--ease-std must equal cubic-bezier(0.4, 0, 0.2, 1) per preview line 34'
    );
  });

  test('AC-TOK-EASE-7: blockReveal animation uses --ease-spring token (not hardcoded cubic-bezier)', () => {
    // Find blockReveal on cycle-block-positioned
    assert.ok(
      css.includes('blockReveal 280ms var(--ease-spring)'),
      'blockReveal animation on .cycle-block-positioned must use var(--ease-spring) token'
    );
  });

  test('AC-TOK-EASE-8: dialogEnter animation uses --ease-bounce token (not hardcoded cubic-bezier)', () => {
    assert.ok(
      css.includes('dialogEnter 240ms var(--ease-bounce)'),
      'dialogEnter animation on .bdd-panel must use var(--ease-bounce) token'
    );
  });

  test('AC-TOK-EASE-9: cadence arc transition uses --ease-std token', () => {
    assert.ok(
      css.includes('var(--ease-std)'),
      'Cadence arc stroke-dashoffset transition must use var(--ease-std) token'
    );
  });

  test('AC-TOK-EASE-10: no orphaned hardcoded cubic-bezier values remain in animation properties', () => {
    // All cubic-bezier occurrences should now only be in the :root token definitions themselves
    const lines = css.split('\n');
    const offenders = lines.filter(line => {
      // Line has cubic-bezier but is NOT in a token definition (:root variable) or comment
      const isTrimmed = line.trim();
      const isTokenDef = /--ease-\w+\s*:/.test(isTrimmed);
      const isComment = isTrimmed.startsWith('*') || isTrimmed.startsWith('//') || isTrimmed.startsWith('/*');
      return isTrimmed.includes('cubic-bezier') && !isTokenDef && !isComment;
    });
    assert.equal(
      offenders.length,
      0,
      `All cubic-bezier literals should be replaced with tokens. Remaining:\n${offenders.join('\n')}`
    );
  });
});

// ---------------------------------------------------------------------------
// C-2: Shadow token vocabulary
// ---------------------------------------------------------------------------

describe('Phase C — C-2: Shadow token vocabulary', () => {
  test('AC-TOK-SHADOW-1: --shadow-sm is defined', () => {
    assert.ok(
      css.includes('--shadow-sm'),
      'app.css must define --shadow-sm token'
    );
  });

  test('AC-TOK-SHADOW-2: --shadow-md is defined', () => {
    assert.ok(
      css.includes('--shadow-md'),
      'app.css must define --shadow-md token'
    );
  });

  test('AC-TOK-SHADOW-3: --shadow-lg is defined', () => {
    assert.ok(
      css.includes('--shadow-lg'),
      'app.css must define --shadow-lg token'
    );
  });

  test('AC-TOK-SHADOW-4: --shadow-sm defined in :root (light mode defaults)', () => {
    const rootIdx = css.indexOf(':root {');
    const rootStart = css.indexOf('{', rootIdx);
    const rootEnd = css.indexOf('}', rootStart);
    const rootBlock = css.slice(rootStart, rootEnd);
    assert.ok(
      rootBlock.includes('--shadow-sm'),
      '--shadow-sm must be defined in :root for light mode defaults'
    );
  });

  test('AC-TOK-SHADOW-5: dark mode overrides shadow tokens with higher opacity values', () => {
    // Find [data-theme="dark"] block and verify shadow tokens are overridden
    const darkIdx = css.indexOf('[data-theme="dark"] {');
    assert.ok(darkIdx !== -1, '[data-theme="dark"] block must exist');
    const darkStart = css.indexOf('{', darkIdx);
    let depth = 0;
    let darkEnd = darkStart;
    for (let i = darkStart; i < css.length; i++) {
      if (css[i] === '{') depth++;
      else if (css[i] === '}') { depth--; if (depth === 0) { darkEnd = i; break; } }
    }
    const darkBlock = css.slice(darkStart, darkEnd);
    assert.ok(
      darkBlock.includes('--shadow-sm') && darkBlock.includes('--shadow-md') && darkBlock.includes('--shadow-lg'),
      '[data-theme="dark"] must override all three shadow tokens (higher opacity for dark backgrounds)'
    );
  });

  test('AC-TOK-SHADOW-6: existing --shadow token preserved (backward compat)', () => {
    assert.ok(
      css.includes('--shadow:'),
      'Original --shadow token must be preserved for backward compatibility'
    );
  });
});

// ---------------------------------------------------------------------------
// C-3: Ambient page depth
// ---------------------------------------------------------------------------

// Helper: find rule body for a given selector (standalone rule, not in comments)
function findStandaloneRuleBody(cssSource, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp('(?:^|\\n)' + escaped + '\\s*\\{', 'm');
  const m = re.exec(cssSource);
  if (!m) return null;
  const ruleStart = m.index + m[0].lastIndexOf('{');
  // Find matching close brace, handling nested braces
  let depth = 0;
  let ruleEnd = ruleStart;
  for (let i = ruleStart; i < cssSource.length; i++) {
    if (cssSource[i] === '{') depth++;
    else if (cssSource[i] === '}') { depth--; if (depth === 0) { ruleEnd = i; break; } }
  }
  return cssSource.slice(ruleStart, ruleEnd);
}

describe('Phase C — C-3: Ambient page depth (body::before)', () => {
  test('AC-AMBIENT-1: body::before rule exists as a standalone CSS rule', () => {
    const ruleBody = findStandaloneRuleBody(css, 'body::before');
    assert.ok(
      ruleBody !== null,
      'app.css must contain a standalone body::before rule for ambient page depth'
    );
  });

  test('AC-AMBIENT-2: body::before uses radial-gradient for glow effect', () => {
    const ruleBody = findStandaloneRuleBody(css, 'body::before');
    assert.ok(ruleBody !== null, 'body::before rule must exist');
    assert.ok(
      ruleBody.includes('radial-gradient'),
      'body::before must use radial-gradient for ambient glow'
    );
  });

  test('AC-AMBIENT-3: body::before references --project-glow token', () => {
    const ruleBody = findStandaloneRuleBody(css, 'body::before');
    assert.ok(ruleBody !== null, 'body::before rule must exist');
    assert.ok(
      ruleBody.includes('--project-glow'),
      'body::before must reference var(--project-glow) for the green top-left glow'
    );
  });

  test('AC-AMBIENT-4: body::before references --ci-glow token', () => {
    const ruleBody = findStandaloneRuleBody(css, 'body::before');
    assert.ok(ruleBody !== null, 'body::before rule must exist');
    assert.ok(
      ruleBody.includes('--ci-glow'),
      'body::before must reference var(--ci-glow) for the purple bottom-right glow'
    );
  });

  test('AC-AMBIENT-5: body::before is pointer-events: none (does not block interaction)', () => {
    const ruleBody = findStandaloneRuleBody(css, 'body::before');
    assert.ok(ruleBody !== null, 'body::before rule must exist');
    assert.ok(
      ruleBody.includes('pointer-events') && ruleBody.includes('none'),
      'body::before must be pointer-events: none — ambient overlay must not block interaction'
    );
  });

  test('AC-AMBIENT-6: body::before is position: fixed (follows scroll)', () => {
    const ruleBody = findStandaloneRuleBody(css, 'body::before');
    assert.ok(ruleBody !== null, 'body::before rule must exist');
    assert.ok(
      ruleBody.includes('fixed'),
      'body::before must be position: fixed per preview — follows scroll as ambient background'
    );
  });

  test('AC-TOK-GLOW-1: --project-glow is defined in :root', () => {
    assert.ok(
      css.includes('--project-glow'),
      ':root must define --project-glow token'
    );
  });

  test('AC-TOK-GLOW-2: --ci-glow is defined in :root', () => {
    assert.ok(
      css.includes('--ci-glow'),
      ':root must define --ci-glow token'
    );
  });

  test('AC-TOK-GLOW-3: --project-glow and --ci-glow are overridden in dark mode', () => {
    const darkIdx = css.indexOf('[data-theme="dark"] {');
    const darkStart = css.indexOf('{', darkIdx);
    let depth = 0;
    let darkEnd = darkStart;
    for (let i = darkStart; i < css.length; i++) {
      if (css[i] === '{') depth++;
      else if (css[i] === '}') { depth--; if (depth === 0) { darkEnd = i; break; } }
    }
    const darkBlock = css.slice(darkStart, darkEnd);
    assert.ok(
      darkBlock.includes('--project-glow') && darkBlock.includes('--ci-glow'),
      '[data-theme="dark"] must override --project-glow and --ci-glow (higher opacity for dark bg)'
    );
  });
});

// ---------------------------------------------------------------------------
// C-4: Nav chrome luminance hierarchy
// ---------------------------------------------------------------------------

describe('Phase C — C-4: Nav chrome luminance hierarchy', () => {
  test('AC-NAV-LUM-1: .nav-item:hover uses --surface-2 (not hardcoded hex)', () => {
    // Find .nav-item:hover rule
    const navHoverIdx = css.indexOf('.nav-item:hover');
    assert.ok(navHoverIdx !== -1, '.nav-item:hover must exist');
    const ruleStart = css.indexOf('{', navHoverIdx);
    const ruleEnd = css.indexOf('}', ruleStart);
    const ruleBody = css.slice(ruleStart, ruleEnd);
    assert.ok(
      ruleBody.includes('--surface-2'),
      '.nav-item:hover must use var(--surface-2) not hardcoded hex (Linear 2026 pattern)'
    );
  });

  test('AC-NAV-LUM-2: .nav-item:hover does NOT use hardcoded #f5f5f4', () => {
    const navHoverIdx = css.indexOf('.nav-item:hover');
    const ruleStart = css.indexOf('{', navHoverIdx);
    const ruleEnd = css.indexOf('}', ruleStart);
    const ruleBody = css.slice(ruleStart, ruleEnd);
    assert.ok(
      !ruleBody.includes('#f5f5f4'),
      '.nav-item:hover must not use hardcoded #f5f5f4 — replaced with semantic token'
    );
  });

  test('AC-NAV-LUM-3: .nav-item.active uses --surface-3 (not hardcoded hex)', () => {
    const navActiveIdx = css.indexOf('.nav-item.active');
    assert.ok(navActiveIdx !== -1, '.nav-item.active must exist');
    const ruleStart = css.indexOf('{', navActiveIdx);
    const ruleEnd = css.indexOf('}', ruleStart);
    const ruleBody = css.slice(ruleStart, ruleEnd);
    assert.ok(
      ruleBody.includes('--surface-3'),
      '.nav-item.active must use var(--surface-3) not hardcoded hex'
    );
  });

  test('AC-NAV-LUM-4: .nav-item.active does NOT use hardcoded #e7e5e4', () => {
    const navActiveIdx = css.indexOf('.nav-item.active');
    const ruleStart = css.indexOf('{', navActiveIdx);
    const ruleEnd = css.indexOf('}', ruleStart);
    const ruleBody = css.slice(ruleStart, ruleEnd);
    assert.ok(
      !ruleBody.includes('#e7e5e4'),
      '.nav-item.active must not use hardcoded #e7e5e4 — replaced with semantic token'
    );
  });

  test('AC-NAV-LUM-5: --surface-2 and --surface-3 are defined in dark mode block', () => {
    // Verify surface tokens exist in dark mode so nav works correctly in dark theme
    const darkIdx = css.indexOf('[data-theme="dark"] {');
    const darkStart = css.indexOf('{', darkIdx);
    let depth = 0;
    let darkEnd = darkStart;
    for (let i = darkStart; i < css.length; i++) {
      if (css[i] === '{') depth++;
      else if (css[i] === '}') { depth--; if (depth === 0) { darkEnd = i; break; } }
    }
    const darkBlock = css.slice(darkStart, darkEnd);
    assert.ok(
      darkBlock.includes('--surface-2') && darkBlock.includes('--surface-3'),
      '[data-theme="dark"] must define --surface-2 and --surface-3 for correct nav dark-mode rendering'
    );
  });
});
