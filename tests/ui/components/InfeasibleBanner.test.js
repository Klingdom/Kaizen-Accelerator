/**
 * Tests for InfeasibleBanner (Sprint 5 P2-T1).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  InfeasibleBanner,
  INFEASIBLE_COPY
} from '../../../js/ui/components/InfeasibleBanner.js';

describe('InfeasibleBanner', () => {
  test('renders with role=alert', () => {
    const html = InfeasibleBanner({});
    assert.match(html, /role="alert"/);
  });

  test('headline copy', () => {
    const html = InfeasibleBanner({});
    assert.match(html, new RegExp(INFEASIBLE_COPY.HEADLINE.replace("'", "&#39;")));
  });

  test('body copy', () => {
    const html = InfeasibleBanner({});
    assert.match(html, new RegExp(INFEASIBLE_COPY.BODY));
  });

  test('includes a Fine-tune button', () => {
    const html = InfeasibleBanner({});
    assert.match(html, /class="fine-tune-btn"/);
    assert.match(html, /data-action="FINE_TUNE_TOGGLE"/);
  });

  test('renders up to 3 explain bullets', () => {
    const html = InfeasibleBanner({
      infeasible: {
        explain: ['Line A', 'Line B', 'Line C', 'Line D']
      }
    });
    const lis = html.match(/<li>/g) ?? [];
    assert.equal(lis.length, 3);
    assert.match(html, /Line A/);
    assert.match(html, /Line C/);
    assert.ok(!html.includes('Line D'));
  });

  test('no explain → no bullet list', () => {
    const html = InfeasibleBanner({});
    assert.ok(!html.includes('<ul'));
  });

  test('escapes explain content', () => {
    const html = InfeasibleBanner({
      infeasible: { explain: ['<script>alert(1)</script>'] }
    });
    assert.ok(!html.includes('<script>alert'));
    assert.match(html, /&lt;script/);
  });

  test('data-state="INFEASIBLE"', () => {
    const html = InfeasibleBanner({});
    assert.match(html, /data-state="INFEASIBLE"/);
  });
});
