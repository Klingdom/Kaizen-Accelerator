/**
 * Tests for KaizenCloseDialog (Sprint 8 P1-T1).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  KaizenCloseDialog,
  KAIZEN_CLOSE_DIALOG_COPY,
  LESSONS_LEARNED_MIN
} from '../../../js/ui/components/KaizenCloseDialog.js';

function kaizen(overrides = {}) {
  return {
    id: 'k_1',
    title: 'Trim meetings',
    problemStatement: 'Too many meetings',
    targetImprovement: null,
    ...overrides
  };
}

function baseline(overrides = {}) {
  return {
    id: 'bm_1',
    value: 10,
    capturedAt: '2026-04-20T10:00:00Z',
    metricDefinition: {
      name: 'Meetings per week',
      unit: 'meetings',
      operationalDefinition: 'Calendar count',
      sampleSize: 4,
      method: 'Manual'
    },
    ...overrides
  };
}

function remeasurement(overrides = {}) {
  return {
    id: 'rm_1',
    value: 13,
    deltaAbsolute: 3,
    deltaPercent: 30,
    beatsBaseline: true,
    capturedAt: '2026-05-01T10:00:00Z',
    ...overrides
  };
}

describe('KaizenCloseDialog — structure', () => {
  test('renders dialog with SUBMIT_CLOSE_KAIZEN_DIALOG action', () => {
    const html = KaizenCloseDialog({
      kaizen: kaizen(),
      baseline: baseline(),
      remeasurement: remeasurement()
    });
    assert.match(html, /role="dialog"/);
    assert.match(html, /data-action="SUBMIT_CLOSE_KAIZEN_DIALOG"/);
  });

  test('cancel button dispatches CLOSE_CLOSE_KAIZEN_DIALOG', () => {
    const html = KaizenCloseDialog({
      kaizen: kaizen(),
      baseline: baseline(),
      remeasurement: remeasurement()
    });
    assert.match(html, /data-action="CLOSE_CLOSE_KAIZEN_DIALOG"/);
  });

  test('shows title + subtitle copy', () => {
    const html = KaizenCloseDialog({
      kaizen: kaizen(),
      baseline: baseline(),
      remeasurement: remeasurement()
    });
    assert.ok(html.includes(KAIZEN_CLOSE_DIALOG_COPY.TITLE));
    assert.ok(html.includes(KAIZEN_CLOSE_DIALOG_COPY.SUBTITLE));
  });

  test('requires lessonsLearned textarea with minlength', () => {
    const html = KaizenCloseDialog({
      kaizen: kaizen(),
      baseline: baseline(),
      remeasurement: remeasurement()
    });
    assert.match(html, /name="lessonsLearned"/);
    assert.match(html, new RegExp(`minlength="${LESSONS_LEARNED_MIN}"`));
  });

  test('char counter reflects pre-filled lessons text', () => {
    const html = KaizenCloseDialog({
      kaizen: kaizen(),
      baseline: baseline(),
      remeasurement: remeasurement(),
      lessonsLearned: 'hello world'
    });
    assert.match(html, /data-char-count="11"/);
  });

  test('shows baseline + remeasurement values + delta', () => {
    const html = KaizenCloseDialog({
      kaizen: kaizen(),
      baseline: baseline({ value: 10 }),
      remeasurement: remeasurement({ value: 13, deltaAbsolute: 3, deltaPercent: 30 })
    });
    assert.ok(html.includes('Meetings per week'));
    assert.ok(html.includes('10')); // baseline value
    assert.ok(html.includes('13')); // remeasurement value
    assert.ok(html.includes('+3'));
    assert.ok(html.includes('+30'));
  });

  test('missing baseline or remeasurement → missing-modal variant', () => {
    const html = KaizenCloseDialog({
      kaizen: kaizen(),
      baseline: null,
      remeasurement: remeasurement()
    });
    assert.match(html, /kcd-modal-missing/);
  });
});

describe('KaizenCloseDialog — closeKind preview', () => {
  test('preview shows SUCCESS when delta >= targetImprovement', () => {
    const html = KaizenCloseDialog({
      kaizen: kaizen({ targetImprovement: 2 }),
      baseline: baseline(),
      remeasurement: remeasurement({ deltaAbsolute: 3, beatsBaseline: true })
    });
    assert.match(html, /data-close-kind="SUCCESS"/);
    assert.ok(html.includes(KAIZEN_CLOSE_DIALOG_COPY.EXPLAIN_SUCCESS));
  });

  test('preview shows PARTIAL when target not met', () => {
    const html = KaizenCloseDialog({
      kaizen: kaizen({ targetImprovement: 10 }),
      baseline: baseline(),
      remeasurement: remeasurement({ deltaAbsolute: 3, beatsBaseline: true })
    });
    assert.match(html, /data-close-kind="PARTIAL"/);
    assert.ok(html.includes(KAIZEN_CLOSE_DIALOG_COPY.EXPLAIN_PARTIAL));
  });

  test('preview shows PARTIAL when no target set (beats=true)', () => {
    const html = KaizenCloseDialog({
      kaizen: kaizen(),
      baseline: baseline(),
      remeasurement: remeasurement({ deltaAbsolute: 3, beatsBaseline: true })
    });
    assert.match(html, /data-close-kind="PARTIAL"/);
  });

  test('preview shows FAILED_HONEST when beats=false', () => {
    const html = KaizenCloseDialog({
      kaizen: kaizen({ targetImprovement: 5 }),
      baseline: baseline(),
      remeasurement: remeasurement({
        deltaAbsolute: -2,
        deltaPercent: -20,
        beatsBaseline: false
      })
    });
    assert.match(html, /data-close-kind="FAILED_HONEST"/);
    assert.ok(html.includes(KAIZEN_CLOSE_DIALOG_COPY.EXPLAIN_FAILED));
  });
});

describe('KaizenCloseDialog — error block', () => {
  test('renders error block when errorName supplied', () => {
    const html = KaizenCloseDialog({
      kaizen: kaizen(),
      baseline: baseline(),
      remeasurement: remeasurement(),
      errorName: 'LESSONS_LEARNED_TOO_SHORT',
      errorMessage: 'too short'
    });
    assert.match(html, /data-error-name="LESSONS_LEARNED_TOO_SHORT"/);
  });
});
