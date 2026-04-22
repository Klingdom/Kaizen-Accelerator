/**
 * Tests for KaizenCard component DRAFT + ACTIVE variants (Sprint 6 P0-T7).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { KaizenCard } from '../../../js/ui/components/KaizenCard.js';

function draftKaizen(overrides = {}) {
  return {
    id: 'k_1',
    userId: 'u_1',
    title: 'Reclaim mornings',
    problemStatement: 'Too many meetings',
    goalStatement: '',
    sourceFrictionSignalIds: ['fs_1', 'fs_2', 'fs_3'],
    baselineMetricId: null,
    actions: [],
    state: 'DRAFT',
    openedAt: '2026-04-21T10:00:00Z',
    ...overrides
  };
}

function activeKaizen(overrides = {}) {
  return {
    id: 'k_1',
    userId: 'u_1',
    title: 'Reclaim mornings',
    problemStatement: 'Too many meetings',
    goalStatement: 'Reduce meetings from 5 to 2 per morning',
    sourceFrictionSignalIds: ['fs_1', 'fs_2'],
    baselineMetricId: 'bm_k_1',
    actions: [
      {
        name: 'Block morning focus',
        ownerRef: 'u_1',
        dueDate: '2026-05-01',
        doneAt: null
      }
    ],
    state: 'ACTIVE',
    openedAt: '2026-04-21T10:00:00Z',
    ...overrides
  };
}

describe('KaizenCard — empty/unknown', () => {
  test('empty kaizen renders empty stub', () => {
    const html = KaizenCard({ kaizen: null });
    assert.ok(html.includes('kz-card-empty'));
  });

  test('IN_REMEASUREMENT now renders the Sprint-8 in-remeasurement card', () => {
    // Sprint 8 P1-T2 replaced the stub with a real IN_REMEASUREMENT variant.
    const html = KaizenCard({
      kaizen: { id: 'k', title: 't', state: 'IN_REMEASUREMENT' }
    });
    assert.ok(html.includes('kz-card-in-remeasurement'));
    assert.ok(html.includes('IN REMEASUREMENT'));
  });
});

describe('KaizenCard — DRAFT variant', () => {
  test('renders DRAFT badge + title + problem statement', () => {
    const html = KaizenCard({ kaizen: draftKaizen() });
    assert.ok(html.includes('DRAFT'));
    assert.ok(html.includes('Reclaim mornings'));
    assert.ok(html.includes('Too many meetings'));
  });

  test('shows sourced-from friction-signal count', () => {
    const html = KaizenCard({ kaizen: draftKaizen() });
    assert.ok(html.includes('Sourced from 3 friction signals'));
  });

  test('lock-baseline button is disabled when goal + actions missing', () => {
    const html = KaizenCard({ kaizen: draftKaizen() });
    const idx = html.indexOf('data-action="KAIZEN_LOCK_BASELINE"');
    assert.ok(idx > 0);
    const slice = html.slice(idx - 200, idx + 200);
    assert.ok(slice.includes('disabled'));
  });

  test('lock-baseline button is enabled when goal + >=1 action present', () => {
    const html = KaizenCard({
      kaizen: draftKaizen({
        goalStatement: 'g',
        actions: [
          {
            name: 'A',
            ownerRef: 'u',
            dueDate: '2026-05-01',
            doneAt: null
          }
        ]
      })
    });
    const idx = html.indexOf('data-action="KAIZEN_LOCK_BASELINE"');
    const slice = html.slice(idx - 200, idx + 200);
    assert.ok(!slice.includes('disabled'));
  });

  test('renders add-action form in DRAFT', () => {
    const html = KaizenCard({ kaizen: draftKaizen() });
    assert.ok(html.includes('data-action="KAIZEN_ADD_ACTION"'));
    assert.ok(html.includes('name="name"'));
    assert.ok(html.includes('name="ownerRef"'));
    assert.ok(html.includes('name="dueDate"'));
  });

  test('DRAFT action rows include remove buttons', () => {
    const html = KaizenCard({
      kaizen: draftKaizen({
        actions: [
          {
            name: 'Block AM',
            ownerRef: 'u',
            dueDate: '2026-05-01',
            doneAt: null
          }
        ]
      })
    });
    assert.ok(html.includes('data-action="KAIZEN_REMOVE_ACTION"'));
    assert.ok(html.includes('Block AM'));
  });

  test('goal textarea pre-fills existing goalStatement', () => {
    const html = KaizenCard({
      kaizen: draftKaizen({ goalStatement: 'Target 2 by 5/1' })
    });
    assert.ok(html.includes('>Target 2 by 5/1</textarea>'));
  });
});

describe('KaizenCard — ACTIVE variant', () => {
  const baseline = {
    id: 'bm_k_1',
    kaizenId: 'k_1',
    metricDefinition: {
      name: 'Adherence',
      unit: '%',
      sampleSize: 10,
      method: 'm',
      operationalDefinition: 'o'
    },
    value: 42,
    capturedAt: '2026-04-21T10:00:00Z',
    locked: true
  };

  test('renders ACTIVE badge + goal (read-only)', () => {
    const html = KaizenCard({ kaizen: activeKaizen(), baseline });
    assert.ok(html.includes('ACTIVE'));
    assert.ok(html.includes('Reduce meetings from 5 to 2 per morning'));
    // Goal is rendered as <p>, not editable textarea
    assert.ok(!html.includes('name="goalStatement"'));
  });

  test('renders baseline block with metric name + value + locked=Yes', () => {
    const html = KaizenCard({ kaizen: activeKaizen(), baseline });
    assert.ok(html.includes('Adherence'));
    assert.ok(html.includes('42'));
    assert.ok(html.includes('Locked'));
    assert.ok(html.includes('Yes'));
  });

  test('actions have check-off handler', () => {
    const html = KaizenCard({ kaizen: activeKaizen(), baseline });
    assert.ok(html.includes('data-action="KAIZEN_MARK_ACTION_DONE"'));
  });

  test('ready-to-remeasure shown when all actions done', () => {
    const html = KaizenCard({
      kaizen: activeKaizen({
        actions: [
          {
            name: 'A',
            ownerRef: 'u',
            dueDate: '2026-05-01',
            doneAt: '2026-04-25T12:00:00Z'
          }
        ]
      }),
      baseline
    });
    assert.ok(html.includes('Ready to remeasure'));
    assert.ok(html.includes('KAIZEN_START_REMEASUREMENT'));
  });

  test('ready-to-remeasure NOT shown when actions incomplete', () => {
    const html = KaizenCard({ kaizen: activeKaizen(), baseline });
    assert.ok(!html.includes('Ready to remeasure'));
  });

  test('abandon button NOT on ACTIVE (Sprint 8 moved to DRAFT only)', () => {
    // Sprint 8: KaizenService.abandon() only operates on DRAFT, so the UI
    // affordance moved. ACTIVE cards expose Start remeasurement instead.
    const html = KaizenCard({ kaizen: activeKaizen(), baseline });
    assert.ok(!html.includes('data-action="KAIZEN_ABANDON"'));
  });

  test('shows placeholder when baseline is null', () => {
    const html = KaizenCard({ kaizen: activeKaizen(), baseline: null });
    assert.ok(html.includes('Baseline not resolved'));
  });
});
