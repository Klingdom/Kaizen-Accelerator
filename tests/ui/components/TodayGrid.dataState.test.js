/**
 * Today Preview Port — Phase A regression tests.
 * TODAY_PREVIEW_PORT_DELTA.md §8 Phase A.
 *
 * Parse-based tests against app.css. No DOM or component rendering needed.
 *
 * Items covered:
 *   A-1: IN_PROGRESS double-ring halo (AC-DS-IP1, AC-DS-IP2, AC-DS-IP3)
 *   A-2: CLOSED/SKIPPED opacity dimming (AC-DS-CL1, AC-DS-CL2, AC-DS-CL3)
 *   A-3: Hover reduced-motion guard (AC-DS-RM1, AC-DS-RM2)
 *
 * META §A.2 orthogonal pairs: each positive selector paired with a negative
 * assertion that other state values do NOT match the same rules.
 *
 * META §A.4 (FE §4.4): all selectors must be scoped to .cycle-block-positioned
 * to avoid collision with .wk-day[data-state] in WeekGrid.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appCssPath = resolve(__dirname, '../../../app.css');
const css = readFileSync(appCssPath, 'utf8');

// ---------------------------------------------------------------------------
// A-1: IN_PROGRESS double-ring halo
// ---------------------------------------------------------------------------

describe('Phase A — A-1: IN_PROGRESS double-ring halo', () => {
  test('AC-DS-IP1: selector .cycle-block-positioned[data-state="IN_PROGRESS"] exists in app.css', () => {
    assert.ok(
      css.includes('.cycle-block-positioned[data-state="IN_PROGRESS"]'),
      'app.css must contain .cycle-block-positioned[data-state="IN_PROGRESS"] selector'
    );
  });

  test('AC-DS-IP2a: IN_PROGRESS rule uses outline for outer halo ring', () => {
    // Find the IN_PROGRESS rule and verify it has an outline property
    const inProgressIdx = css.indexOf('.cycle-block-positioned[data-state="IN_PROGRESS"]');
    assert.ok(inProgressIdx !== -1, 'IN_PROGRESS selector must exist');
    // Extract the rule block after the selector
    const ruleStart = css.indexOf('{', inProgressIdx);
    const ruleEnd = css.indexOf('}', ruleStart);
    const ruleBody = css.slice(ruleStart, ruleEnd);
    assert.ok(
      ruleBody.includes('outline'),
      'IN_PROGRESS rule must use outline for halo treatment'
    );
  });

  test('AC-DS-IP2b: IN_PROGRESS ::before pseudo has border for inner halo ring', () => {
    // Find the ::before pseudo-element rule
    assert.ok(
      css.includes('.cycle-block-positioned[data-state="IN_PROGRESS"]::before'),
      'IN_PROGRESS must have a ::before pseudo-element for the second ring'
    );
    const pseudoIdx = css.indexOf('.cycle-block-positioned[data-state="IN_PROGRESS"]::before');
    const ruleStart = css.indexOf('{', pseudoIdx);
    const ruleEnd = css.indexOf('}', ruleStart);
    const ruleBody = css.slice(ruleStart, ruleEnd);
    assert.ok(
      ruleBody.includes('border'),
      'IN_PROGRESS ::before must use border for inner halo ring'
    );
  });

  test('AC-DS-IP2c: IN_PROGRESS ::before uses position: absolute (inset halo)', () => {
    const pseudoIdx = css.indexOf('.cycle-block-positioned[data-state="IN_PROGRESS"]::before');
    const ruleStart = css.indexOf('{', pseudoIdx);
    const ruleEnd = css.indexOf('}', ruleStart);
    const ruleBody = css.slice(ruleStart, ruleEnd);
    assert.ok(
      ruleBody.includes('position') && ruleBody.includes('absolute'),
      'IN_PROGRESS ::before must be position: absolute to form an inset ring'
    );
  });

  test('AC-DS-IP3 (orthogonal): SCHEDULED state does NOT have IN_PROGRESS outline selector', () => {
    // No selector should match SCHEDULED with the IN_PROGRESS halo properties
    assert.ok(
      !css.includes('.cycle-block-positioned[data-state="SCHEDULED"]'),
      'SCHEDULED state must NOT have a matching data-state selector (IN_PROGRESS halo must not bleed)'
    );
  });

  test('AC-DS-IP3 (orthogonal): PROPOSED state does NOT match IN_PROGRESS selector', () => {
    // PROPOSED uses .cycle-block-proposed class, not data-state; verify no confusion
    assert.ok(
      !css.includes('[data-state="PROPOSED"]'),
      'PROPOSED state must not use data-state attribute selector (uses .cycle-block-proposed class)'
    );
  });

  test('FE §4.4 scope: IN_PROGRESS selector is scoped to .cycle-block-positioned', () => {
    // Bare [data-state="IN_PROGRESS"] without .cycle-block-positioned prefix would collide
    // with .wk-day[data-state] in WeekGrid. Verify scoped form.
    const bareSelector = /(?<!cycle-block-positioned)\[data-state="IN_PROGRESS"\]/;
    assert.ok(
      !bareSelector.test(css),
      'data-state="IN_PROGRESS" selector must be scoped to .cycle-block-positioned (FE §4.4)'
    );
  });
});

// ---------------------------------------------------------------------------
// A-2: CLOSED / SKIPPED opacity dimming
// ---------------------------------------------------------------------------

describe('Phase A — A-2: CLOSED/SKIPPED opacity dimming', () => {
  test('AC-DS-CL1: CLOSED selector exists in app.css', () => {
    assert.ok(
      css.includes('.cycle-block-positioned[data-state="CLOSED"]'),
      'app.css must contain .cycle-block-positioned[data-state="CLOSED"] selector'
    );
  });

  test('AC-DS-CL1b: CLOSED rule uses opacity for dimming', () => {
    const closedIdx = css.indexOf('.cycle-block-positioned[data-state="CLOSED"]');
    const ruleStart = css.indexOf('{', closedIdx);
    const ruleEnd = css.indexOf('}', ruleStart);
    const ruleBody = css.slice(ruleStart, ruleEnd);
    assert.ok(
      ruleBody.includes('opacity'),
      'CLOSED rule must reduce opacity for visual dimming'
    );
  });

  test('AC-DS-CL1c: CLOSED opacity is less than 1 (block is visually dimmed)', () => {
    const closedIdx = css.indexOf('.cycle-block-positioned[data-state="CLOSED"]');
    const ruleStart = css.indexOf('{', closedIdx);
    const ruleEnd = css.indexOf('}', ruleStart);
    const ruleBody = css.slice(ruleStart, ruleEnd);
    const opacityMatch = ruleBody.match(/opacity\s*:\s*([\d.]+)/);
    assert.ok(opacityMatch, 'CLOSED rule must have a numeric opacity value');
    const opacityValue = parseFloat(opacityMatch[1]);
    assert.ok(
      opacityValue < 1,
      `CLOSED opacity must be < 1 (got ${opacityValue})`
    );
    assert.ok(
      opacityValue >= 0.4,
      `CLOSED opacity should not be invisible (got ${opacityValue}); use >= 0.4 per UX §Q2`
    );
  });

  test('AC-DS-CL2: SKIPPED selector exists in app.css', () => {
    assert.ok(
      css.includes('.cycle-block-positioned[data-state="SKIPPED"]'),
      'app.css must contain .cycle-block-positioned[data-state="SKIPPED"] selector'
    );
  });

  test('AC-DS-CL2b: SKIPPED rule uses opacity for dimming', () => {
    const skippedIdx = css.indexOf('.cycle-block-positioned[data-state="SKIPPED"]');
    const ruleStart = css.indexOf('{', skippedIdx);
    const ruleEnd = css.indexOf('}', ruleStart);
    const ruleBody = css.slice(ruleStart, ruleEnd);
    assert.ok(
      ruleBody.includes('opacity'),
      'SKIPPED rule must reduce opacity for visual dimming'
    );
  });

  test('AC-DS-CL2c: SKIPPED rule uses outline for red skip signal', () => {
    const skippedIdx = css.indexOf('.cycle-block-positioned[data-state="SKIPPED"]');
    const ruleStart = css.indexOf('{', skippedIdx);
    const ruleEnd = css.indexOf('}', ruleStart);
    const ruleBody = css.slice(ruleStart, ruleEnd);
    assert.ok(
      ruleBody.includes('outline'),
      'SKIPPED rule must use outline for the red skip signal (per preview line 882–884)'
    );
  });

  test('AC-DS-CL3 (orthogonal): SCHEDULED state does NOT match CLOSED selector', () => {
    assert.ok(
      !css.includes('.cycle-block-positioned[data-state="SCHEDULED"]'),
      'SCHEDULED state must NOT appear as a data-state selector (must not inherit CLOSED dimming)'
    );
  });

  test('AC-DS-CL3 (orthogonal): IN_PROGRESS state does NOT match CLOSED/SKIPPED selectors', () => {
    // IN_PROGRESS should have full opacity (halo, not dimmed)
    // Verify no rule applies opacity to IN_PROGRESS
    const inProgressIdx = css.indexOf('.cycle-block-positioned[data-state="IN_PROGRESS"]');
    const ruleStart = css.indexOf('{', inProgressIdx);
    const ruleEnd = css.indexOf('}', ruleStart);
    const ruleBody = css.slice(ruleStart, ruleEnd);
    assert.ok(
      !ruleBody.includes('opacity'),
      'IN_PROGRESS rule must NOT set opacity (must remain at full opacity)'
    );
  });

  test('FE §4.4 scope: CLOSED selector is scoped to .cycle-block-positioned', () => {
    const bareSelector = /(?<!cycle-block-positioned)\[data-state="CLOSED"\]/;
    assert.ok(
      !bareSelector.test(css),
      'data-state="CLOSED" selector must be scoped to .cycle-block-positioned (FE §4.4)'
    );
  });

  test('FE §4.4 scope: SKIPPED selector is scoped to .cycle-block-positioned', () => {
    const bareSelector = /(?<!cycle-block-positioned)\[data-state="SKIPPED"\]/;
    assert.ok(
      !bareSelector.test(css),
      'data-state="SKIPPED" selector must be scoped to .cycle-block-positioned (FE §4.4)'
    );
  });
});

// ---------------------------------------------------------------------------
// A-3: Hover reduced-motion guard (WCAG 2.3.3)
// ---------------------------------------------------------------------------

describe('Phase A — A-3: Hover transform reduced-motion guard', () => {
  test('AC-DS-RM1: prefers-reduced-motion block suppresses .cycle-block-positioned:hover transform', () => {
    // Find @media (prefers-reduced-motion: reduce) block(s) and check for hover suppression
    assert.ok(
      css.includes('@media (prefers-reduced-motion: reduce)'),
      'app.css must contain @media (prefers-reduced-motion: reduce) block'
    );
    // Check that within a reduced-motion context, block hover transform is suppressed
    assert.ok(
      css.includes('.cycle-block-positioned:hover'),
      'app.css must have a .cycle-block-positioned:hover rule inside reduced-motion guard'
    );
  });

  test('AC-DS-RM1b: reduced-motion hover rule nullifies the transform', () => {
    // Find the prefers-reduced-motion block that contains .cycle-block-positioned:hover
    const reducedMotionIdx = css.lastIndexOf('@media (prefers-reduced-motion: reduce)');
    assert.ok(reducedMotionIdx !== -1, 'prefers-reduced-motion block must exist');
    const blockStart = css.indexOf('{', reducedMotionIdx);
    // Find matching close brace
    let depth = 0;
    let blockEnd = blockStart;
    for (let i = blockStart; i < css.length; i++) {
      if (css[i] === '{') depth++;
      else if (css[i] === '}') { depth--; if (depth === 0) { blockEnd = i; break; } }
    }
    const block = css.slice(blockStart, blockEnd);
    assert.ok(
      block.includes('.cycle-block-positioned:hover'),
      'The reduced-motion @media block must contain .cycle-block-positioned:hover'
    );
    // Find the hover rule within the block
    const hoverIdx = block.indexOf('.cycle-block-positioned:hover');
    const hoverRuleStart = block.indexOf('{', hoverIdx);
    const hoverRuleEnd = block.indexOf('}', hoverRuleStart);
    const hoverRule = block.slice(hoverRuleStart, hoverRuleEnd);
    assert.ok(
      hoverRule.includes('transform'),
      'Reduced-motion hover rule must explicitly set transform to suppress the lift'
    );
    assert.ok(
      hoverRule.includes('none'),
      'Reduced-motion hover transform must be set to none'
    );
  });

  test('AC-DS-RM2: pattern matches existing reduced-motion rule structure (app.css:945)', () => {
    // The existing reduced-motion block at app.css:945 uses @media (prefers-reduced-motion: reduce)
    // with bare property rules inside. Verify Phase A rule follows the same pattern
    // (not [data-motion="reduced"] which is a separate pattern).
    const reducedMotionMediaBlocks = (css.match(/@media \(prefers-reduced-motion: reduce\)/g) || []);
    assert.ok(
      reducedMotionMediaBlocks.length >= 2,
      `Expected at least 2 prefers-reduced-motion blocks (existing + Phase A new); found ${reducedMotionMediaBlocks.length}`
    );
  });

  test('AC-DS-RM2b: existing reduced-motion block (app.css:945) still covers now-line', () => {
    // Verify the original reduced-motion block was not accidentally removed or broken
    assert.ok(
      css.includes('.cycle-now-line::after'),
      '.cycle-now-line::after must still exist in app.css'
    );
    // Check now-line is still within a reduced-motion block
    const firstReducedMotionIdx = css.indexOf('@media (prefers-reduced-motion: reduce)');
    const blockStart = css.indexOf('{', firstReducedMotionIdx);
    let depth = 0;
    let blockEnd = blockStart;
    for (let i = blockStart; i < css.length; i++) {
      if (css[i] === '{') depth++;
      else if (css[i] === '}') { depth--; if (depth === 0) { blockEnd = i; break; } }
    }
    const block = css.slice(blockStart, blockEnd);
    assert.ok(
      block.includes('.cycle-now-line'),
      'First prefers-reduced-motion block must still contain .cycle-now-line rules (not regressed)'
    );
  });
});
