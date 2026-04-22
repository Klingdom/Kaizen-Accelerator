/**
 * Tests for Kaizen page (Sprint 6 P1-T2).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { Kaizen, KAIZEN_COPY } from '../../../js/ui/pages/Kaizen.js';

describe('Kaizen page — empty state', () => {
  test('renders empty-state copy + start-wizard button when no kaizens', () => {
    const html = Kaizen({});
    assert.ok(html.includes(KAIZEN_COPY.EMPTY_TITLE));
    assert.ok(html.includes(KAIZEN_COPY.CTA));
    assert.ok(html.includes('data-action="WRW_OPEN"'));
  });

  test('shows friction summary when present', () => {
    const html = Kaizen({
      openFrictionSignals: [
        { id: 'a', tag: 'MEETING_LOAD', summary: 'too many meetings' },
        { id: 'b', tag: 'TOOL_FRICTION', summary: 'slack is slow' }
      ]
    });
    assert.ok(html.includes('too many meetings'));
    assert.ok(html.includes('slack is slow'));
  });

  test('shows "no open friction" copy when signals array empty', () => {
    const html = Kaizen({ openFrictionSignals: [] });
    assert.ok(html.includes('No open friction signals yet'));
  });
});

describe('Kaizen page — active state', () => {
  test('renders active Kaizen card when one exists', () => {
    const html = Kaizen({
      activeKaizen: {
        id: 'k_1',
        title: 'Reclaim mornings',
        problemStatement: 'meetings',
        goalStatement: 'cut by half',
        actions: [],
        state: 'ACTIVE'
      },
      baseline: {
        id: 'bm_k_1',
        kaizenId: 'k_1',
        metricDefinition: { name: 'Adherence', unit: '%' },
        value: 42,
        capturedAt: '2026-04-21T10:00:00Z',
        locked: true
      }
    });
    assert.ok(html.includes('Active Kaizen'));
    assert.ok(html.includes('Reclaim mornings'));
    assert.ok(html.includes('ACTIVE'));
  });

  test('start-wizard button NOT shown when active kaizen exists', () => {
    const html = Kaizen({
      activeKaizen: {
        id: 'k_1',
        title: 't',
        problemStatement: 'p',
        goalStatement: 'g',
        actions: [],
        state: 'ACTIVE'
      }
    });
    assert.ok(!html.includes(KAIZEN_COPY.CTA));
  });
});

describe('Kaizen page — draft state', () => {
  test('renders drafts when drafts array non-empty', () => {
    const html = Kaizen({
      draftKaizens: [
        {
          id: 'k_d',
          title: 'In progress',
          problemStatement: 'p',
          goalStatement: '',
          actions: [],
          sourceFrictionSignalIds: ['a', 'b'],
          state: 'DRAFT'
        }
      ]
    });
    assert.ok(html.includes('Drafts'));
    assert.ok(html.includes('In progress'));
    assert.ok(html.includes('DRAFT'));
  });

  test('wizard modal renders when wizardState present', () => {
    const html = Kaizen({
      wizardState: { step: 1, clusters: [] }
    });
    assert.ok(html.includes('wrw-modal'));
  });
});
