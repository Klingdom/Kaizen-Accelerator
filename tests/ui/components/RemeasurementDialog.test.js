/**
 * Tests for RemeasurementDialog (Sprint 8 P0-T8).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  RemeasurementDialog,
  REMEASUREMENT_DIALOG_COPY,
  EVIDENCE_SCHEMAS,
  computeRemeasurementPreview,
  extractRemeasurementFields
} from '../../../js/ui/components/RemeasurementDialog.js';

function baselineFixture(overrides = {}) {
  return {
    id: 'bm_1',
    kaizenId: 'k_1',
    value: 10,
    capturedAt: '2026-04-20T10:00:00Z',
    locked: true,
    metricDefinition: {
      name: 'Cycle time',
      unit: 'days',
      operationalDefinition: 'Jira ticket open to done',
      sampleSize: 30,
      method: 'Extract'
    },
    ...overrides
  };
}

describe('RemeasurementDialog — structure', () => {
  test('renders dialog with SUBMIT_REMEASUREMENT_DIALOG action', () => {
    const html = RemeasurementDialog({
      kaizenId: 'k_1',
      baseline: baselineFixture()
    });
    assert.match(html, /data-action="SUBMIT_REMEASUREMENT_DIALOG"/);
    assert.match(html, /role="dialog"/);
  });

  test('renders baseline reference block (read-only)', () => {
    const html = RemeasurementDialog({
      kaizenId: 'k_1',
      baseline: baselineFixture()
    });
    assert.ok(html.includes('Cycle time'));
    assert.ok(html.includes('days'));
    assert.ok(html.includes('Jira ticket open to done'));
    assert.ok(html.includes(REMEASUREMENT_DIALOG_COPY.BASELINE_REF_HEADING));
  });

  test('shows current-value input', () => {
    const html = RemeasurementDialog({
      kaizenId: 'k_1',
      baseline: baselineFixture()
    });
    assert.match(html, /name="currentValue"/);
  });

  test('shows evidence schema select with all 3 schemas', () => {
    const html = RemeasurementDialog({
      kaizenId: 'k_1',
      baseline: baselineFixture()
    });
    for (const s of EVIDENCE_SCHEMAS) {
      assert.ok(html.includes(`value="${s}"`));
    }
  });

  test('empty current value shows preview placeholder', () => {
    const html = RemeasurementDialog({
      kaizenId: 'k_1',
      baseline: baselineFixture()
    });
    assert.ok(html.includes(REMEASUREMENT_DIALOG_COPY.PREVIEW_NO_VALUE));
  });

  test('cancel button dispatches CLOSE_REMEASUREMENT_DIALOG', () => {
    const html = RemeasurementDialog({
      kaizenId: 'k_1',
      baseline: baselineFixture()
    });
    assert.match(html, /data-action="CLOSE_REMEASUREMENT_DIALOG"/);
  });

  test('missing baseline renders explanatory message', () => {
    const html = RemeasurementDialog({ kaizenId: 'k_1', baseline: null });
    assert.match(html, /rd-baseline-missing/);
  });
});

describe('RemeasurementDialog — live preview (higher_is_better)', () => {
  test('positive delta shown with plus sign + beats=YES', () => {
    const html = RemeasurementDialog({
      kaizenId: 'k_1',
      baseline: baselineFixture({ value: 10 }),
      currentValue: 16
    });
    assert.match(html, /data-beats-baseline="true"/);
    assert.ok(html.includes('+6'));
    assert.ok(html.includes('+60%'));
    assert.match(html, /<strong>YES<\/strong>/);
  });

  test('negative delta with higher_is_better → beats=NO', () => {
    const html = RemeasurementDialog({
      kaizenId: 'k_1',
      baseline: baselineFixture({ value: 10 }),
      currentValue: 4
    });
    assert.match(html, /data-beats-baseline="false"/);
    assert.match(html, /<strong>NO<\/strong>/);
  });

  test('zero-baseline case shows N/A percent', () => {
    const html = RemeasurementDialog({
      kaizenId: 'k_1',
      baseline: baselineFixture({ value: 0 }),
      currentValue: 5
    });
    assert.ok(html.includes('N/A'));
  });
});

describe('RemeasurementDialog — live preview (lower_is_better)', () => {
  test('negative delta → beats=YES when lower_is_better', () => {
    const html = RemeasurementDialog({
      kaizenId: 'k_1',
      baseline: baselineFixture({ value: 20 }),
      metricDirection: 'lower_is_better',
      currentValue: 12
    });
    assert.match(html, /data-beats-baseline="true"/);
    assert.match(html, /<strong>YES<\/strong>/);
  });

  test('positive delta → beats=NO when lower_is_better', () => {
    const html = RemeasurementDialog({
      kaizenId: 'k_1',
      baseline: baselineFixture({ value: 20 }),
      metricDirection: 'lower_is_better',
      currentValue: 25
    });
    assert.match(html, /data-beats-baseline="false"/);
  });
});

describe('computeRemeasurementPreview — direct checks', () => {
  test('returns null if baseline or current non-finite', () => {
    assert.equal(computeRemeasurementPreview(NaN, 5, 'higher_is_better'), null);
    assert.equal(computeRemeasurementPreview(10, NaN, 'higher_is_better'), null);
  });

  test('matches service-side math for higher_is_better', () => {
    const p = computeRemeasurementPreview(10, 16, 'higher_is_better');
    assert.equal(p.deltaAbsolute, 6);
    assert.equal(p.deltaPercent, 60);
    assert.equal(p.beatsBaseline, true);
  });

  test('baseline=0 → deltaPercent=null', () => {
    const p = computeRemeasurementPreview(0, 5, 'higher_is_better');
    assert.equal(p.deltaPercent, null);
    assert.equal(p.beatsBaseline, true);
  });

  test('lower_is_better flips sign', () => {
    const p = computeRemeasurementPreview(20, 12, 'lower_is_better');
    assert.equal(p.beatsBaseline, true);
    const p2 = computeRemeasurementPreview(20, 25, 'lower_is_better');
    assert.equal(p2.beatsBaseline, false);
  });
});

describe('extractRemeasurementFields — normalization', () => {
  test('coerces currentValue to number', () => {
    const out = extractRemeasurementFields({ currentValue: '42.5' });
    assert.equal(out.value, 42.5);
  });

  test('evidenceRef null when schema + value missing', () => {
    const out = extractRemeasurementFields({ currentValue: '1' });
    assert.equal(out.evidenceRef, null);
  });

  test('evidenceRef populated when schema + value present', () => {
    const out = extractRemeasurementFields({
      currentValue: '1',
      evidenceSchema: 'DOCUMENT',
      evidenceValue: 'https://x.com/y'
    });
    assert.deepEqual(out.evidenceRef, {
      schema: 'DOCUMENT',
      value: 'https://x.com/y'
    });
  });

  test('evidenceRef null when schema invalid', () => {
    const out = extractRemeasurementFields({
      currentValue: '1',
      evidenceSchema: 'NOPE',
      evidenceValue: 'x'
    });
    assert.equal(out.evidenceRef, null);
  });

  test('empty evidence value → null ref', () => {
    const out = extractRemeasurementFields({
      currentValue: '1',
      evidenceSchema: 'TEXT',
      evidenceValue: '   '
    });
    assert.equal(out.evidenceRef, null);
  });
});
