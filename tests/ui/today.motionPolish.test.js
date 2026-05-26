/**
 * Today Preview Port — Phase B regression tests.
 * TODAY_PREVIEW_PORT_DELTA.md §8 Phase B.
 *
 * Parse-based tests against app.css. No DOM or component rendering needed.
 *
 * Items covered:
 *   B-1: proposedShimmer keyframe on PROPOSED blocks
 *   B-2: blockReveal direction fix (translateX → translateY + scale)
 *   B-3: nowPulse keyframe on now-line dot
 *   B-4: Now-label glass pill (frosted, not flat)
 *   B-5: BDD dialog backdrop blur
 *   B-6: Kaizen ping two-ring upgrade (kaizenRing)
 *
 * All animations must have reduced-motion guards per WCAG 2.3.3.
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
// B-1: proposedShimmer keyframe on PROPOSED blocks
// ---------------------------------------------------------------------------

describe('Phase B — B-1: proposedShimmer on PROPOSED blocks', () => {
  test('B-1a: @keyframes proposedShimmer is defined in app.css', () => {
    assert.ok(
      css.includes('@keyframes proposedShimmer'),
      'app.css must define @keyframes proposedShimmer'
    );
  });

  test('B-1b: proposedShimmer uses filter: brightness at 50% keyframe', () => {
    const shimmerIdx = css.indexOf('@keyframes proposedShimmer');
    const blockStart = css.indexOf('{', shimmerIdx);
    let depth = 0;
    let blockEnd = blockStart;
    for (let i = blockStart; i < css.length; i++) {
      if (css[i] === '{') depth++;
      else if (css[i] === '}') { depth--; if (depth === 0) { blockEnd = i; break; } }
    }
    const block = css.slice(blockStart, blockEnd);
    assert.ok(
      block.includes('filter') && block.includes('brightness'),
      'proposedShimmer must use filter: brightness for the pulse effect'
    );
    // Verify 50% keyframe exists (temporal pulse)
    assert.ok(
      block.includes('50%'),
      'proposedShimmer must have a 50% keyframe for the peak of the pulse'
    );
  });

  test('B-1c: .cycle-block-proposed references proposedShimmer animation', () => {
    const proposedIdx = css.indexOf('.cycle-block-proposed');
    assert.ok(proposedIdx !== -1, '.cycle-block-proposed rule must exist');
    const ruleStart = css.indexOf('{', proposedIdx);
    const ruleEnd = css.indexOf('}', ruleStart);
    const ruleBody = css.slice(ruleStart, ruleEnd);
    assert.ok(
      ruleBody.includes('proposedShimmer'),
      '.cycle-block-proposed must reference proposedShimmer in its animation property'
    );
  });

  test('B-1d: proposedShimmer has 2.2s duration (preview-intentional timing)', () => {
    const proposedIdx = css.indexOf('.cycle-block-proposed');
    const ruleStart = css.indexOf('{', proposedIdx);
    const ruleEnd = css.indexOf('}', ruleStart);
    const ruleBody = css.slice(ruleStart, ruleEnd);
    assert.ok(
      ruleBody.includes('2.2s'),
      'proposedShimmer must have 2.2s duration per preview design intent'
    );
  });

  test('B-1e: reduced-motion guard suppresses proposedShimmer on PROPOSED blocks', () => {
    // Find a prefers-reduced-motion block that contains .cycle-block-proposed
    assert.ok(
      css.includes('.cycle-block-proposed'),
      '.cycle-block-proposed must exist'
    );
    // Check reduced-motion blocks contain cycle-block-proposed suppression
    const reducedBlocks = [];
    let searchFrom = 0;
    while (true) {
      const idx = css.indexOf('@media (prefers-reduced-motion: reduce)', searchFrom);
      if (idx === -1) break;
      const blockStart = css.indexOf('{', idx);
      let depth = 0;
      let blockEnd = blockStart;
      for (let i = blockStart; i < css.length; i++) {
        if (css[i] === '{') depth++;
        else if (css[i] === '}') { depth--; if (depth === 0) { blockEnd = i; break; } }
      }
      reducedBlocks.push(css.slice(blockStart, blockEnd));
      searchFrom = blockEnd;
    }
    const hasProposedGuard = reducedBlocks.some(b => b.includes('.cycle-block-proposed'));
    assert.ok(
      hasProposedGuard,
      'A prefers-reduced-motion block must suppress animation on .cycle-block-proposed'
    );
  });
});

// ---------------------------------------------------------------------------
// B-2: blockReveal direction fix
// ---------------------------------------------------------------------------

describe('Phase B — B-2: blockReveal direction fix', () => {
  test('B-2a: @keyframes blockReveal exists', () => {
    assert.ok(
      css.includes('@keyframes blockReveal'),
      'app.css must define @keyframes blockReveal'
    );
  });

  test('B-2b: blockReveal from-state uses translateY (not translateX)', () => {
    const blockRevealIdx = css.indexOf('@keyframes blockReveal');
    const blockStart = css.indexOf('{', blockRevealIdx);
    let depth = 0;
    let blockEnd = blockStart;
    for (let i = blockStart; i < css.length; i++) {
      if (css[i] === '{') depth++;
      else if (css[i] === '}') { depth--; if (depth === 0) { blockEnd = i; break; } }
    }
    const block = css.slice(blockStart, blockEnd);
    assert.ok(
      block.includes('translateY'),
      'blockReveal from-state must use translateY (spatially correct for vertical calendar)'
    );
    assert.ok(
      !block.includes('translateX(-6px)'),
      'blockReveal must NOT use translateX(-6px) — the leftward slide was the bug'
    );
  });

  test('B-2c: blockReveal from-state uses scale(0.98) for physical settling', () => {
    const blockRevealIdx = css.indexOf('@keyframes blockReveal');
    const blockStart = css.indexOf('{', blockRevealIdx);
    let depth = 0;
    let blockEnd = blockStart;
    for (let i = blockStart; i < css.length; i++) {
      if (css[i] === '{') depth++;
      else if (css[i] === '}') { depth--; if (depth === 0) { blockEnd = i; break; } }
    }
    const block = css.slice(blockStart, blockEnd);
    assert.ok(
      block.includes('scale(0.98)'),
      'blockReveal must include scale(0.98) in from-state for physical settling effect'
    );
  });

  test('B-2d: blockReveal to-state returns to scale(1) and translateY(0)', () => {
    const blockRevealIdx = css.indexOf('@keyframes blockReveal');
    const blockStart = css.indexOf('{', blockRevealIdx);
    let depth = 0;
    let blockEnd = blockStart;
    for (let i = blockStart; i < css.length; i++) {
      if (css[i] === '{') depth++;
      else if (css[i] === '}') { depth--; if (depth === 0) { blockEnd = i; break; } }
    }
    const block = css.slice(blockStart, blockEnd);
    assert.ok(
      block.includes('scale(1)'),
      'blockReveal to-state must return to scale(1)'
    );
  });
});

// ---------------------------------------------------------------------------
// B-3: nowPulse keyframe on now-line dot
// ---------------------------------------------------------------------------

describe('Phase B — B-3: nowPulse on now-line ::before dot', () => {
  test('B-3a: @keyframes nowPulse is defined in app.css', () => {
    assert.ok(
      css.includes('@keyframes nowPulse'),
      'app.css must define @keyframes nowPulse'
    );
  });

  test('B-3b: nowPulse includes scale and opacity transitions', () => {
    const nowPulseIdx = css.indexOf('@keyframes nowPulse');
    const blockStart = css.indexOf('{', nowPulseIdx);
    let depth = 0;
    let blockEnd = blockStart;
    for (let i = blockStart; i < css.length; i++) {
      if (css[i] === '{') depth++;
      else if (css[i] === '}') { depth--; if (depth === 0) { blockEnd = i; break; } }
    }
    const block = css.slice(blockStart, blockEnd);
    assert.ok(
      block.includes('scale'),
      'nowPulse must include scale transform (preview line 1120)'
    );
    assert.ok(
      block.includes('opacity'),
      'nowPulse must include opacity transition (preview line 1121: opacity 1→0.75)'
    );
  });

  test('B-3c: .cycle-now-line::before references nowPulse animation', () => {
    const dotIdx = css.indexOf('.cycle-now-line::before');
    assert.ok(dotIdx !== -1, '.cycle-now-line::before must exist');
    const ruleStart = css.indexOf('{', dotIdx);
    const ruleEnd = css.indexOf('}', ruleStart);
    const ruleBody = css.slice(ruleStart, ruleEnd);
    assert.ok(
      ruleBody.includes('nowPulse'),
      '.cycle-now-line::before must use nowPulse animation (not dotBreathe)'
    );
  });

  test('B-3d: nowPulse is NOT still using dotBreathe on ::before dot', () => {
    const dotIdx = css.indexOf('.cycle-now-line::before');
    const ruleStart = css.indexOf('{', dotIdx);
    const ruleEnd = css.indexOf('}', ruleStart);
    const ruleBody = css.slice(ruleStart, ruleEnd);
    assert.ok(
      !ruleBody.includes('dotBreathe'),
      '.cycle-now-line::before must reference nowPulse not dotBreathe (B-3 fix)'
    );
  });

  test('B-3e: existing prefers-reduced-motion block still covers now-line ::before', () => {
    // The first reduced-motion block at app.css:966 covers ::before animation: none
    const firstReducedIdx = css.indexOf('@media (prefers-reduced-motion: reduce)');
    const blockStart = css.indexOf('{', firstReducedIdx);
    let depth = 0;
    let blockEnd = blockStart;
    for (let i = blockStart; i < css.length; i++) {
      if (css[i] === '{') depth++;
      else if (css[i] === '}') { depth--; if (depth === 0) { blockEnd = i; break; } }
    }
    const block = css.slice(blockStart, blockEnd);
    assert.ok(
      block.includes('.cycle-now-line::before'),
      'First prefers-reduced-motion block must still suppress ::before animation'
    );
  });
});

// ---------------------------------------------------------------------------
// B-4: Now-label glass pill
// ---------------------------------------------------------------------------

// Helper: find a CSS rule body by selector (as a standalone rule, not in comments)
function findRuleBody(cssSource, selector) {
  // Match selector as start-of-rule (after newline or semicolon, not inside a comment)
  // Use a regex that looks for the selector followed by optional whitespace then '{'
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp('(?:^|\\n)' + escaped + '\\s*\\{', 'm');
  const m = re.exec(cssSource);
  if (!m) return null;
  const ruleStart = m.index + m[0].lastIndexOf('{');
  const ruleEnd = cssSource.indexOf('}', ruleStart);
  return cssSource.slice(ruleStart, ruleEnd);
}

describe('Phase B — B-4: Now-label glass pill', () => {
  test('B-4a: .cycle-now-label has backdrop-filter blur', () => {
    const ruleBody = findRuleBody(css, '.cycle-now-label');
    assert.ok(ruleBody !== null, '.cycle-now-label rule must exist as a standalone selector');
    assert.ok(
      ruleBody.includes('backdrop-filter'),
      '.cycle-now-label must have backdrop-filter for glass pill effect'
    );
    assert.ok(
      ruleBody.includes('blur'),
      '.cycle-now-label backdrop-filter must include blur'
    );
  });

  test('B-4b: .cycle-now-label has a border for glass edge definition', () => {
    const ruleBody = findRuleBody(css, '.cycle-now-label');
    assert.ok(ruleBody !== null, '.cycle-now-label rule must exist');
    assert.ok(
      ruleBody.includes('border'),
      '.cycle-now-label must have a border to define the glass pill edge'
    );
  });

  test('B-4c: .cycle-now-label background is semi-transparent (not opaque)', () => {
    const ruleBody = findRuleBody(css, '.cycle-now-label');
    assert.ok(ruleBody !== null, '.cycle-now-label rule must exist');
    assert.ok(
      !ruleBody.includes('rgba(255,255,255,0.9)') && !ruleBody.includes('rgba(255, 255, 255, 0.9)'),
      '.cycle-now-label must not use 0.9 opacity (was flat opaque; glass pill uses 0.85 or lower)'
    );
    assert.ok(
      ruleBody.includes('rgba'),
      '.cycle-now-label background must use rgba for semi-transparency'
    );
  });

  test('B-4d: dark-mode override exists for .cycle-now-label', () => {
    assert.ok(
      css.includes('[data-theme="dark"] .cycle-now-label'),
      'A dark-mode override must exist for .cycle-now-label glass pill'
    );
  });
});

// ---------------------------------------------------------------------------
// B-5: BDD dialog backdrop blur
// ---------------------------------------------------------------------------

describe('Phase B — B-5: BDD backdrop blur', () => {
  test('B-5a: .bdd-backdrop has backdrop-filter blur', () => {
    const backdropIdx = css.indexOf('.bdd-backdrop');
    assert.ok(backdropIdx !== -1, '.bdd-backdrop must exist');
    const ruleStart = css.indexOf('{', backdropIdx);
    const ruleEnd = css.indexOf('}', ruleStart);
    const ruleBody = css.slice(ruleStart, ruleEnd);
    assert.ok(
      ruleBody.includes('backdrop-filter'),
      '.bdd-backdrop must have backdrop-filter for frosted-glass separation'
    );
    assert.ok(
      ruleBody.includes('blur'),
      '.bdd-backdrop backdrop-filter must include blur'
    );
  });

  test('B-5b: @keyframes backdropIn is defined', () => {
    assert.ok(
      css.includes('@keyframes backdropIn'),
      'app.css must define @keyframes backdropIn (preview-named keyframe)'
    );
  });

  test('B-5c: @keyframes dialogIn is defined for BDD panel entrance', () => {
    assert.ok(
      css.includes('@keyframes dialogIn'),
      'app.css must define @keyframes dialogIn for BDD panel entrance animation'
    );
  });

  test('B-5d: dialogIn keyframe uses translate+scale entrance', () => {
    const dialogInIdx = css.indexOf('@keyframes dialogIn');
    const blockStart = css.indexOf('{', dialogInIdx);
    let depth = 0;
    let blockEnd = blockStart;
    for (let i = blockStart; i < css.length; i++) {
      if (css[i] === '{') depth++;
      else if (css[i] === '}') { depth--; if (depth === 0) { blockEnd = i; break; } }
    }
    const block = css.slice(blockStart, blockEnd);
    assert.ok(
      block.includes('translate') && block.includes('scale'),
      'dialogIn must use translate+scale for the entrance animation'
    );
  });

  test('B-5e: existing backdropFade keyframe is preserved (compatibility)', () => {
    assert.ok(
      css.includes('@keyframes backdropFade'),
      '@keyframes backdropFade must be preserved for backward compatibility'
    );
  });
});

// ---------------------------------------------------------------------------
// B-6: Kaizen ping two-ring upgrade
// ---------------------------------------------------------------------------

describe('Phase B — B-6: Kaizen ping two-ring upgrade', () => {
  test('B-6a: @keyframes kaizenRing is defined', () => {
    assert.ok(
      css.includes('@keyframes kaizenRing'),
      'app.css must define @keyframes kaizenRing (two-ring upgrade from kaizenPing)'
    );
  });

  test('B-6b: kaizenRing uses two concurrent box-shadow rings', () => {
    const kaizenRingIdx = css.indexOf('@keyframes kaizenRing');
    const blockStart = css.indexOf('{', kaizenRingIdx);
    let depth = 0;
    let blockEnd = blockStart;
    for (let i = blockStart; i < css.length; i++) {
      if (css[i] === '{') depth++;
      else if (css[i] === '}') { depth--; if (depth === 0) { blockEnd = i; break; } }
    }
    const block = css.slice(blockStart, blockEnd);
    assert.ok(
      block.includes('box-shadow'),
      'kaizenRing must use box-shadow for ring expansion'
    );
    // Two rings: two box-shadow values separated by comma
    // At 30% keyframe: two shadows defined
    assert.ok(
      block.includes('30%'),
      'kaizenRing must have a 30% keyframe for first ring expansion'
    );
    assert.ok(
      block.includes('60%'),
      'kaizenRing must have a 60% keyframe for second ring expansion'
    );
  });

  test('B-6c: .cycle-block-kaizen-linked references kaizenRing animation', () => {
    const kaizenIdx = css.indexOf('.cycle-block-kaizen-linked');
    assert.ok(kaizenIdx !== -1, '.cycle-block-kaizen-linked must exist');
    const ruleStart = css.indexOf('{', kaizenIdx);
    const ruleEnd = css.indexOf('}', ruleStart);
    const ruleBody = css.slice(ruleStart, ruleEnd);
    assert.ok(
      ruleBody.includes('kaizenRing'),
      '.cycle-block-kaizen-linked must reference kaizenRing animation (not kaizenPing)'
    );
  });

  test('B-6d: reduced-motion guard suppresses kaizenRing on kaizen-linked blocks', () => {
    const reducedBlocks = [];
    let searchFrom = 0;
    while (true) {
      const idx = css.indexOf('@media (prefers-reduced-motion: reduce)', searchFrom);
      if (idx === -1) break;
      const blockStart = css.indexOf('{', idx);
      let depth = 0;
      let blockEnd = blockStart;
      for (let i = blockStart; i < css.length; i++) {
        if (css[i] === '{') depth++;
        else if (css[i] === '}') { depth--; if (depth === 0) { blockEnd = i; break; } }
      }
      reducedBlocks.push(css.slice(blockStart, blockEnd));
      searchFrom = blockEnd;
    }
    const hasKaizenGuard = reducedBlocks.some(b => b.includes('.cycle-block-kaizen-linked'));
    assert.ok(
      hasKaizenGuard,
      'A prefers-reduced-motion block must suppress animation on .cycle-block-kaizen-linked'
    );
  });

  test('B-6e: kaizenPing keyframe is preserved for backward compatibility', () => {
    assert.ok(
      css.includes('@keyframes kaizenPing'),
      '@keyframes kaizenPing must be preserved (not deleted) for backward compatibility'
    );
  });
});
