/**
 * Tests for AutoPlanButton — pure render.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { AutoPlanButton } from '../../../js/ui/components/AutoPlanButton.js';

describe('AutoPlanButton — default (idle) state', () => {
  test('renders a <button>', () => {
    assert.match(AutoPlanButton(), /^<button/);
  });

  test('default label is "Auto-Plan" (verbatim §6.5.1)', () => {
    assert.match(AutoPlanButton(), />Auto-Plan</);
  });

  test('never renders the forbidden "Auto-plan my day!" string', () => {
    const html = AutoPlanButton();
    assert.ok(!html.includes('Auto-plan my day!'));
  });

  test('data-action="AUTO_PLAN"', () => {
    assert.match(AutoPlanButton(), /data-action="AUTO_PLAN"/);
  });

  test('default variant is primary', () => {
    assert.match(AutoPlanButton(), /class="[^"]*\bprimary\b/);
  });

  test('aria-label set for accessibility', () => {
    assert.match(AutoPlanButton(), /aria-label="Auto-plan today"/);
  });

  test('not disabled when idle', () => {
    const html = AutoPlanButton();
    assert.ok(!html.includes('disabled'));
  });
});

describe('AutoPlanButton — loading state', () => {
  test('loading=true → label "Composing…"', () => {
    const html = AutoPlanButton({ loading: true });
    assert.match(html, />Composing…</);
  });

  test('loading=true → button disabled', () => {
    const html = AutoPlanButton({ loading: true });
    assert.match(html, /disabled/);
    assert.match(html, /aria-disabled="true"/);
  });

  test('loading=true adds loading class', () => {
    const html = AutoPlanButton({ loading: true });
    assert.match(html, /\bloading\b/);
  });

  test('loading=false → no loading class', () => {
    const html = AutoPlanButton({ loading: false });
    assert.ok(!/class="[^"]*\bloading\b/.test(html));
  });
});

describe('AutoPlanButton — variants', () => {
  test('secondary variant renders with secondary class', () => {
    const html = AutoPlanButton({ variant: 'secondary' });
    assert.match(html, /\bsecondary\b/);
    assert.ok(!/class="[^"]*\bprimary\b/.test(html));
  });

  test('unknown variant defaults to primary', () => {
    const html = AutoPlanButton({ variant: 'tertiary' });
    assert.match(html, /\bprimary\b/);
  });
});
