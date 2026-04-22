/**
 * Tests for BaselineDialog (Sprint 8 P0-T7).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  BaselineDialog,
  BASELINE_DIALOG_COPY,
  BASELINE_LIMITS,
  extractBaselineFields
} from '../../../js/ui/components/BaselineDialog.js';

describe('BaselineDialog — structure', () => {
  test('renders a modal with role=dialog + SUBMIT_BASELINE_DIALOG action', () => {
    const html = BaselineDialog({ kaizenId: 'k_1' });
    assert.match(html, /role="dialog"/);
    assert.match(html, /data-action="SUBMIT_BASELINE_DIALOG"/);
    // Payload is esc()-encoded so " becomes &quot;.
    assert.ok(html.includes('data-payload=\'{&quot;kaizenId&quot;:&quot;k_1&quot;}\''));
  });

  test('renders the title + subtitle copy', () => {
    const html = BaselineDialog({ kaizenId: 'k_1' });
    assert.ok(html.includes(BASELINE_DIALOG_COPY.TITLE));
    assert.ok(html.includes(BASELINE_DIALOG_COPY.SUBTITLE));
  });

  test('renders every required field', () => {
    const html = BaselineDialog({ kaizenId: 'k_1' });
    assert.match(html, /name="metricName"/);
    assert.match(html, /name="unit"/);
    assert.match(html, /name="operationalDefinition"/);
    assert.match(html, /name="sampleSize"/);
    assert.match(html, /name="method"/);
    assert.match(html, /name="value"/);
    assert.match(html, /name="metricDirection"/);
    assert.match(html, /name="targetImprovement"/);
  });

  test('marks operationalDefinition minlength/maxlength from limits', () => {
    const html = BaselineDialog({ kaizenId: 'k_1' });
    assert.match(html, new RegExp(`minlength="${BASELINE_LIMITS.OPERATIONAL_MIN}"`));
    assert.match(html, new RegExp(`maxlength="${BASELINE_LIMITS.OPERATIONAL_MAX}"`));
  });

  test('metric direction defaults to higher_is_better', () => {
    const html = BaselineDialog({ kaizenId: 'k_1' });
    const higherIdx = html.indexOf('value="higher_is_better"');
    const nextQuote = html.indexOf('"', higherIdx + 24);
    const slice = html.slice(higherIdx, nextQuote + 200);
    assert.ok(slice.includes('checked'));
  });

  test('respects lower_is_better selection when passed in', () => {
    const html = BaselineDialog({
      kaizenId: 'k_1',
      metricDirection: 'lower_is_better'
    });
    const lowerIdx = html.indexOf('value="lower_is_better"');
    const slice = html.slice(lowerIdx, lowerIdx + 200);
    assert.ok(slice.includes('checked'));
  });

  test('submit button is labeled "Lock Baseline"', () => {
    const html = BaselineDialog({ kaizenId: 'k_1' });
    assert.match(html, new RegExp(BASELINE_DIALOG_COPY.SUBMIT));
  });

  test('cancel button dispatches CLOSE_BASELINE_DIALOG', () => {
    const html = BaselineDialog({ kaizenId: 'k_1' });
    assert.match(html, /data-action="CLOSE_BASELINE_DIALOG"/);
  });

  test('irreversible warning is shown', () => {
    const html = BaselineDialog({ kaizenId: 'k_1' });
    assert.ok(html.includes(BASELINE_DIALOG_COPY.IRREVERSIBLE_WARNING));
  });

  test('prefilled values render in inputs', () => {
    const html = BaselineDialog({
      kaizenId: 'k_1',
      metricName: 'Cycle time',
      unit: 'days',
      value: 42
    });
    assert.ok(html.includes('value="Cycle time"'));
    assert.ok(html.includes('value="days"'));
    assert.ok(html.includes('value="42"'));
  });

  test('errorName renders error block', () => {
    const html = BaselineDialog({
      kaizenId: 'k_1',
      errorName: 'MISSING_METRIC_FIELD',
      errorMessage: 'metricName required'
    });
    assert.match(html, /data-error-name="MISSING_METRIC_FIELD"/);
    assert.match(html, /metricName required/);
  });

  test('escapes kaizenId into data-payload', () => {
    const html = BaselineDialog({ kaizenId: 'k_<x>' });
    assert.ok(!html.includes('k_<x>'));
    assert.ok(html.includes('k_&lt;x&gt;'));
  });
});

describe('extractBaselineFields — normalization', () => {
  test('trims strings and coerces numbers', () => {
    const out = extractBaselineFields({
      metricName: '  Cycle  ',
      unit: 'days',
      operationalDefinition: 'Long enough op-def string for tests.',
      sampleSize: '30',
      method: 'Jira extract',
      value: '42.5',
      metricDirection: 'higher_is_better',
      targetImprovement: '10'
    });
    assert.equal(out.metricName, 'Cycle');
    assert.equal(out.unit, 'days');
    assert.equal(out.sampleSize, 30);
    assert.equal(out.value, 42.5);
    assert.equal(out.targetImprovement, 10);
    assert.equal(out.metricDirection, 'higher_is_better');
  });

  test('targetImprovement empty string → null', () => {
    const out = extractBaselineFields({ targetImprovement: '' });
    assert.equal(out.targetImprovement, null);
  });

  test('targetImprovement missing → null', () => {
    const out = extractBaselineFields({});
    assert.equal(out.targetImprovement, null);
  });

  test('targetImprovement non-numeric → null', () => {
    const out = extractBaselineFields({ targetImprovement: 'abc' });
    assert.equal(out.targetImprovement, null);
  });

  test('unknown metricDirection falls back to higher_is_better', () => {
    const out = extractBaselineFields({ metricDirection: 'garbage' });
    assert.equal(out.metricDirection, 'higher_is_better');
  });

  test('lower_is_better preserved', () => {
    const out = extractBaselineFields({ metricDirection: 'lower_is_better' });
    assert.equal(out.metricDirection, 'lower_is_better');
  });

  test('missing value → NaN (service re-validates)', () => {
    const out = extractBaselineFields({});
    assert.ok(Number.isNaN(out.value));
  });

  test('accepts non-object input gracefully', () => {
    const out = extractBaselineFields(null);
    assert.equal(out.metricName, '');
    assert.equal(out.metricDirection, 'higher_is_better');
  });
});
