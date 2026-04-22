/**
 * Tests for WhyChip (Sprint 5 P1-T3).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { WhyChip, summarizeWhy } from '../../../js/ui/components/WhyChip.js';

describe('summarizeWhy', () => {
  test('combines rule + detail', () => {
    assert.equal(
      summarizeWhy({ rule: 'R1', detail: 'because' }),
      'R1 — because'
    );
  });

  test('just detail when rule missing', () => {
    assert.equal(summarizeWhy({ detail: 'x' }), 'x');
  });

  test('just rule when detail missing', () => {
    assert.equal(summarizeWhy({ rule: 'r' }), 'r');
  });

  test('empty on null', () => {
    assert.equal(summarizeWhy(null), '');
  });

  test('empty on empty object', () => {
    assert.equal(summarizeWhy({}), '');
  });
});

describe('WhyChip', () => {
  test('null entry → empty string', () => {
    assert.equal(WhyChip({ entry: null }), '');
  });

  test('missing entry → empty string', () => {
    assert.equal(WhyChip({}), '');
  });

  test('empty summary → empty string', () => {
    assert.equal(WhyChip({ entry: {} }), '');
  });

  test('renders a span with why-chip class', () => {
    const html = WhyChip({
      entry: { ref: 'cat_34', rule: 'R3', detail: 'DMAIC #34 ready' }
    });
    assert.match(html, /class="why-chip"/);
  });

  test('sets title attribute with summary', () => {
    const html = WhyChip({
      entry: { ref: 'cat_34', rule: 'R3', detail: 'DMAIC #34 ready' }
    });
    assert.match(html, /title="R3 . DMAIC #34 ready"/);
  });

  test('includes data-ref attribute', () => {
    const html = WhyChip({
      entry: { ref: 'cat_34', rule: 'R3', detail: 'why' }
    });
    assert.match(html, /data-ref="cat_34"/);
  });

  test('includes data-rule attribute', () => {
    const html = WhyChip({
      entry: { ref: 'cat_34', rule: 'R5_DEEP_PAYLOAD', detail: 'why' }
    });
    assert.match(html, /data-rule="R5_DEEP_PAYLOAD"/);
  });

  test('escapes HTML in detail', () => {
    const html = WhyChip({
      entry: { ref: 'x', rule: 'r', detail: '<script>alert(1)</script>' }
    });
    assert.ok(!html.includes('<script>alert'));
    assert.match(html, /&lt;script&gt;/);
  });

  test('has role=note', () => {
    const html = WhyChip({ entry: { ref: 'x', rule: 'r', detail: 'd' } });
    assert.match(html, /role="note"/);
  });
});
