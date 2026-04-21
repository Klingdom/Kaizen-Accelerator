/**
 * Tests for AdherenceDial — pure render (placeholder in Sprint 4).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { AdherenceDial } from '../../../js/ui/components/AdherenceDial.js';

describe('AdherenceDial — empty/pre-baseline state', () => {
  test('no props + daysSinceSignup=0 → empty render', () => {
    const html = AdherenceDial();
    assert.match(html, /empty/);
    assert.match(html, /Building your baseline/);
  });

  test('empty render shows three dashes', () => {
    const html = AdherenceDial({ daysSinceSignup: 2 });
    const dashes = (html.match(/—/g) ?? []).length;
    assert.ok(dashes >= 3);
  });

  test('empty copy matches §6.5.2 verbatim', () => {
    const html = AdherenceDial();
    assert.match(html, /Building your baseline\. Numbers populate after day 7\./);
  });

  test('aria-label="Adherence" set', () => {
    const html = AdherenceDial();
    assert.match(html, /aria-label="Adherence"/);
  });
});

describe('AdherenceDial — populated state', () => {
  test('adherence=82 renders "82%"', () => {
    const html = AdherenceDial({
      adherencePct: 82,
      acceptancePct: 91,
      kaizenDeltaPct: 14,
      daysSinceSignup: 14
    });
    assert.match(html, />82%</);
  });

  test('acceptance=91 renders "91%"', () => {
    const html = AdherenceDial({
      adherencePct: 82,
      acceptancePct: 91,
      kaizenDeltaPct: 14,
      daysSinceSignup: 14
    });
    assert.match(html, />91%</);
  });

  test('kaizen delta positive prefixed with +', () => {
    const html = AdherenceDial({
      adherencePct: 82,
      acceptancePct: 91,
      kaizenDeltaPct: 14,
      daysSinceSignup: 14
    });
    assert.match(html, />\+14%</);
  });

  test('kaizen delta zero renders "0%"', () => {
    const html = AdherenceDial({
      adherencePct: 82,
      acceptancePct: 91,
      kaizenDeltaPct: 0,
      daysSinceSignup: 14
    });
    assert.match(html, />0%</);
  });

  test('kaizen delta negative renders "-N%"', () => {
    const html = AdherenceDial({
      adherencePct: 82,
      acceptancePct: 91,
      kaizenDeltaPct: -5,
      daysSinceSignup: 14
    });
    assert.match(html, />-5%</);
  });

  test('labels: Adherence / Acceptance / Kaizen delta', () => {
    const html = AdherenceDial({
      adherencePct: 50,
      acceptancePct: 60,
      kaizenDeltaPct: 0,
      daysSinceSignup: 14
    });
    assert.match(html, />Adherence</);
    assert.match(html, />Acceptance</);
    assert.match(html, />Kaizen delta</);
  });
});

describe('AdherenceDial — mixed null values post-baseline', () => {
  test('null kaizen delta renders "—" (no active Kaizen)', () => {
    const html = AdherenceDial({
      adherencePct: 50,
      acceptancePct: 60,
      kaizenDeltaPct: null,
      daysSinceSignup: 14
    });
    assert.match(html, /—/);
  });

  test('day 7 with real numbers → populated variant', () => {
    const html = AdherenceDial({
      adherencePct: 70,
      acceptancePct: 80,
      kaizenDeltaPct: 5,
      daysSinceSignup: 7
    });
    assert.ok(!html.includes('Building your baseline'));
  });
});

describe('AdherenceDial — rounding', () => {
  test('adherence fractional rounds', () => {
    const html = AdherenceDial({
      adherencePct: 82.6,
      acceptancePct: 91.2,
      kaizenDeltaPct: 13.7,
      daysSinceSignup: 30
    });
    assert.match(html, />83%</);
    assert.match(html, />91%</);
    assert.match(html, />\+14%</);
  });
});

describe('AdherenceDial — structure', () => {
  test('populated render contains 3 dial-cell divs', () => {
    const html = AdherenceDial({
      adherencePct: 80,
      acceptancePct: 80,
      kaizenDeltaPct: 0,
      daysSinceSignup: 30
    });
    const cells = (html.match(/class="dial-cell"/g) ?? []).length;
    assert.equal(cells, 3);
  });

  test('renders a <section> root', () => {
    const html = AdherenceDial({
      adherencePct: 80,
      acceptancePct: 80,
      kaizenDeltaPct: 0,
      daysSinceSignup: 30
    });
    assert.match(html, /^<section/);
  });
});
