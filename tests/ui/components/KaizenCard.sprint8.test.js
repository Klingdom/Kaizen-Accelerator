/**
 * Tests for KaizenCard Sprint 8 variants (P1-T2 + P1-T3).
 *
 *   IN_REMEASUREMENT — with + without remeasurement
 *   CLOSED           — all 3 closeKind badges
 *   ABANDONED        — rendered regardless of state
 *   DRAFT abandon form — inline confirm/cancel
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { KaizenCard } from '../../../js/ui/components/KaizenCard.js';

function draft(overrides = {}) {
  return {
    id: 'k_d',
    userId: 'u_1',
    title: 'Draft K',
    problemStatement: 'p',
    goalStatement: '',
    sourceFrictionSignalIds: [],
    baselineMetricId: null,
    actions: [],
    state: 'DRAFT',
    openedAt: '2026-04-20T10:00:00Z',
    ...overrides
  };
}

function inRemeasurement(overrides = {}) {
  return {
    id: 'k_r',
    userId: 'u_1',
    title: 'Remeasuring',
    problemStatement: 'p',
    goalStatement: 'g',
    sourceFrictionSignalIds: [],
    baselineMetricId: 'bm_k_r',
    remeasurementId: null,
    actions: [
      { name: 'A', ownerRef: 'u_1', dueDate: '2026-04-25', doneAt: '2026-04-25T10:00:00Z' }
    ],
    state: 'IN_REMEASUREMENT',
    openedAt: '2026-04-20T10:00:00Z',
    ...overrides
  };
}

function closed(overrides = {}) {
  return {
    id: 'k_c',
    userId: 'u_1',
    title: 'Closed K',
    problemStatement: 'p',
    goalStatement: 'g',
    sourceFrictionSignalIds: [],
    baselineMetricId: 'bm_k_c',
    remeasurementId: 'rm_k_c',
    actions: [],
    state: 'CLOSED',
    openedAt: '2026-04-20T10:00:00Z',
    closedAt: '2026-05-01T12:00:00Z',
    closeKind: 'SUCCESS',
    lessonsLearned: 'Queueing was the root cause — batched by priority weekly.',
    ...overrides
  };
}

const baseline = {
  id: 'bm',
  value: 10,
  capturedAt: '2026-04-20T10:00:00Z',
  locked: true,
  metricDefinition: { name: 'Cycle', unit: 'days' }
};

const remeasurement = {
  id: 'rm',
  value: 16,
  deltaAbsolute: 6,
  deltaPercent: 60,
  beatsBaseline: true,
  capturedAt: '2026-05-01T10:00:00Z'
};

// ---------------------------------------------------------------------------
// IN_REMEASUREMENT variant
// ---------------------------------------------------------------------------

describe('KaizenCard IN_REMEASUREMENT — without remeasurement', () => {
  test('renders kz-card-in-remeasurement with IN REMEASUREMENT badge', () => {
    const html = KaizenCard({ kaizen: inRemeasurement(), baseline });
    assert.match(html, /kz-card-in-remeasurement/);
    assert.ok(html.includes('IN REMEASUREMENT'));
  });

  test('shows "Capture remeasurement" primary button', () => {
    const html = KaizenCard({ kaizen: inRemeasurement(), baseline });
    assert.match(html, /data-action="KAIZEN_OPEN_REMEASUREMENT_DIALOG"/);
  });

  test('locked baseline is shown', () => {
    const html = KaizenCard({ kaizen: inRemeasurement(), baseline });
    assert.ok(html.includes('Cycle'));
    assert.ok(html.includes('days'));
  });

  test('close-kaizen button is NOT shown without remeasurement', () => {
    const html = KaizenCard({ kaizen: inRemeasurement(), baseline });
    assert.ok(!html.includes('data-action="KAIZEN_OPEN_CLOSE_DIALOG"'));
  });

  test('"Back to ACTIVE" button is present but disabled', () => {
    const html = KaizenCard({ kaizen: inRemeasurement(), baseline });
    assert.match(html, /kz-back-to-active.*disabled/);
  });
});

describe('KaizenCard IN_REMEASUREMENT — with remeasurement', () => {
  test('shows delta dl', () => {
    const html = KaizenCard({
      kaizen: inRemeasurement({ remeasurementId: 'rm' }),
      baseline,
      remeasurement
    });
    assert.match(html, /kz-remeasurement-meta/);
    assert.ok(html.includes('+6'));
    assert.ok(html.includes('+60%'));
  });

  test('shows "Close Kaizen" button', () => {
    const html = KaizenCard({
      kaizen: inRemeasurement({ remeasurementId: 'rm' }),
      baseline,
      remeasurement
    });
    assert.match(html, /data-action="KAIZEN_OPEN_CLOSE_DIALOG"/);
  });

  test('capture button is NOT shown once remeasurement exists', () => {
    const html = KaizenCard({
      kaizen: inRemeasurement({ remeasurementId: 'rm' }),
      baseline,
      remeasurement
    });
    assert.ok(!html.includes('KAIZEN_OPEN_REMEASUREMENT_DIALOG'));
  });
});

// ---------------------------------------------------------------------------
// CLOSED variant
// ---------------------------------------------------------------------------

describe('KaizenCard CLOSED — badge color mapping', () => {
  test('SUCCESS badge class', () => {
    const html = KaizenCard({
      kaizen: closed({ closeKind: 'SUCCESS' }),
      baseline,
      remeasurement
    });
    assert.match(html, /kz-close-success/);
    assert.ok(html.includes('SUCCESS'));
  });

  test('PARTIAL badge class', () => {
    const html = KaizenCard({
      kaizen: closed({ closeKind: 'PARTIAL' }),
      baseline,
      remeasurement
    });
    assert.match(html, /kz-close-partial/);
    assert.ok(html.includes('PARTIAL'));
  });

  test('FAILED_HONEST badge class', () => {
    const html = KaizenCard({
      kaizen: closed({ closeKind: 'FAILED_HONEST' }),
      baseline,
      remeasurement
    });
    assert.match(html, /kz-close-failed_honest/);
    assert.ok(html.includes('FAILED HONEST'));
  });
});

describe('KaizenCard CLOSED — content', () => {
  test('no action buttons on CLOSED (read-only)', () => {
    const html = KaizenCard({
      kaizen: closed(),
      baseline,
      remeasurement
    });
    assert.ok(!html.includes('data-action="KAIZEN_LOCK_BASELINE"'));
    assert.ok(!html.includes('data-action="KAIZEN_MARK_ACTION_DONE"'));
    assert.ok(!html.includes('data-action="KAIZEN_OPEN_CLOSE_DIALOG"'));
  });

  test('shows lessons learned', () => {
    const html = KaizenCard({
      kaizen: closed({ lessonsLearned: 'Root cause was queueing; batched weekly.' }),
      baseline,
      remeasurement
    });
    assert.ok(html.includes('Root cause was queueing; batched weekly.'));
  });

  test('shows closedAt timestamp', () => {
    const html = KaizenCard({
      kaizen: closed(),
      baseline,
      remeasurement
    });
    assert.ok(html.includes('2026-05-01T12:00:00Z'));
  });

  test('shows baseline + remeasurement delta', () => {
    const html = KaizenCard({
      kaizen: closed(),
      baseline,
      remeasurement
    });
    assert.match(html, /kz-baseline-meta/);
    assert.match(html, /kz-remeasurement-meta/);
  });
});

// ---------------------------------------------------------------------------
// ABANDONED variant
// ---------------------------------------------------------------------------

describe('KaizenCard ABANDONED — renders on abandoned=true', () => {
  test('renders kz-card-abandoned with ABANDONED badge', () => {
    const html = KaizenCard({
      kaizen: draft({
        abandoned: true,
        abandonedAt: '2026-04-22T10:00:00Z',
        abandonReason: 'Out of scope for this quarter.'
      })
    });
    assert.match(html, /kz-card-abandoned/);
    assert.ok(html.includes('ABANDONED'));
  });

  test('renders reason', () => {
    const html = KaizenCard({
      kaizen: draft({
        abandoned: true,
        abandonReason: 'Blocked by leadership.'
      })
    });
    assert.ok(html.includes('Blocked by leadership.'));
  });

  test('no lock-baseline button on abandoned', () => {
    const html = KaizenCard({
      kaizen: draft({
        abandoned: true,
        abandonReason: 'Scope shift.'
      })
    });
    assert.ok(!html.includes('data-action="KAIZEN_LOCK_BASELINE"'));
  });
});

// ---------------------------------------------------------------------------
// DRAFT inline abandon form
// ---------------------------------------------------------------------------

describe('KaizenCard DRAFT — abandon form', () => {
  test('abandon button present on DRAFT by default', () => {
    const html = KaizenCard({ kaizen: draft() });
    assert.match(html, /data-action="KAIZEN_ABANDON"/);
  });

  test('inline abandon form renders when abandonFormOpen=true', () => {
    const html = KaizenCard({ kaizen: draft(), abandonFormOpen: true });
    assert.match(html, /data-action="KAIZEN_CONFIRM_ABANDON"/);
    assert.match(html, /data-action="KAIZEN_CANCEL_ABANDON"/);
    assert.match(html, /name="reason"/);
  });

  test('abandon reason textarea enforces minlength=10', () => {
    const html = KaizenCard({ kaizen: draft(), abandonFormOpen: true });
    assert.match(html, /minlength="10"/);
  });

  test('opening the form hides the plain abandon button', () => {
    const html = KaizenCard({ kaizen: draft(), abandonFormOpen: true });
    // The button with data-action KAIZEN_ABANDON is replaced by the form.
    assert.ok(!html.includes('data-action="KAIZEN_ABANDON"'));
  });
});
