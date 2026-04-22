/**
 * Tests for WeeklyReflectionWizard component (Sprint 6 P1-T1).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { WeeklyReflectionWizard } from '../../../js/ui/components/WeeklyReflectionWizard.js';

const CLUSTERS = [
  { tag: 'MEETING_LOAD', count: 3, signalIds: ['a', 'b', 'c'] },
  { tag: 'TOOL_FRICTION', count: 2, signalIds: ['d', 'e'] },
  { tag: 'OTHER', count: 1, signalIds: ['f'] }
];

describe('WeeklyReflectionWizard — step 1 (pre-read)', () => {
  test('renders cluster list sorted by count', () => {
    const html = WeeklyReflectionWizard({ step: 1, clusters: CLUSTERS });
    assert.ok(html.includes('Meeting load'));
    assert.ok(html.includes('Tool friction'));
    // Count=3 must appear before count=1 in output
    const mlIdx = html.indexOf('Meeting load');
    const otherIdx = html.indexOf('Other');
    assert.ok(mlIdx > 0 && otherIdx > mlIdx);
  });

  test('renders empty copy when no clusters', () => {
    const html = WeeklyReflectionWizard({ step: 1, clusters: [] });
    assert.ok(html.includes('No friction signals'));
  });

  test('has a Next button in step 1', () => {
    const html = WeeklyReflectionWizard({ step: 1, clusters: CLUSTERS });
    assert.ok(html.includes('data-action="WRW_NEXT"'));
  });
});

describe('WeeklyReflectionWizard — step 2 (pick cluster)', () => {
  test('auto-selects the highest-count cluster', () => {
    const html = WeeklyReflectionWizard({ step: 2, clusters: CLUSTERS });
    assert.ok(html.includes('Meeting load'));
    assert.ok(html.includes('aria-selected="true"'));
  });

  test('honors an explicit selectedTag override', () => {
    const html = WeeklyReflectionWizard({
      step: 2,
      clusters: CLUSTERS,
      selectedTag: 'OTHER'
    });
    // The currently-selected label block should mention "Other".
    assert.ok(html.includes('Selected: <strong>Other</strong>'));
  });

  test('renders pick buttons for each cluster', () => {
    const html = WeeklyReflectionWizard({ step: 2, clusters: CLUSTERS });
    assert.ok(html.includes('data-action="WRW_PICK_CLUSTER"'));
  });
});

describe('WeeklyReflectionWizard — step 3 (write)', () => {
  test('renders title + problemStatement + goalStatement inputs', () => {
    const html = WeeklyReflectionWizard({
      step: 3,
      clusters: CLUSTERS,
      selectedTag: 'MEETING_LOAD',
      title: '',
      problemStatement: '',
      goalStatement: ''
    });
    assert.ok(html.includes('name="title"'));
    assert.ok(html.includes('name="problemStatement"'));
    assert.ok(html.includes('name="goalStatement"'));
  });

  test('pre-fills prior values', () => {
    const html = WeeklyReflectionWizard({
      step: 3,
      clusters: CLUSTERS,
      selectedTag: 'MEETING_LOAD',
      title: 'Reclaim',
      problemStatement: 'Too many back-to-back meetings',
      goalStatement: 'Reduce by 40%'
    });
    assert.ok(html.includes('value="Reclaim"'));
    assert.ok(html.includes('Too many back-to-back meetings'));
    assert.ok(html.includes('Reduce by 40%'));
  });

  test('enforces min-length on problemStatement', () => {
    const html = WeeklyReflectionWizard({
      step: 3,
      clusters: CLUSTERS,
      selectedTag: 'MEETING_LOAD'
    });
    assert.ok(html.includes('minlength="10"'));
  });
});

describe('WeeklyReflectionWizard — step 4 (confirm)', () => {
  test('renders a confirmation summary + submit button', () => {
    const html = WeeklyReflectionWizard({
      step: 4,
      clusters: CLUSTERS,
      selectedTag: 'MEETING_LOAD',
      title: 'Reclaim mornings',
      problemStatement: 'Too many back-to-back',
      goalStatement: 'Target 40% reduction'
    });
    assert.ok(html.includes('Reclaim mornings'));
    assert.ok(html.includes('Meeting load (3 signals)'));
    assert.ok(html.includes('Target 40% reduction'));
    assert.ok(html.includes('data-action="WRW_SUBMIT"'));
  });

  test('submit button replaces next button at step 4', () => {
    const html = WeeklyReflectionWizard({
      step: 4,
      clusters: CLUSTERS,
      selectedTag: 'MEETING_LOAD',
      title: 't',
      problemStatement: 'p',
      goalStatement: 'g'
    });
    // Note: Next also shows up in step 3 form; at step 4 we only need submit.
    assert.ok(html.includes('data-action="WRW_SUBMIT"'));
    assert.ok(!html.includes('data-action="WRW_NEXT"'));
  });

  test('back button visible on all steps except 1', () => {
    const h1 = WeeklyReflectionWizard({ step: 1, clusters: CLUSTERS });
    assert.ok(!h1.includes('data-action="WRW_BACK"'));
    const h2 = WeeklyReflectionWizard({ step: 2, clusters: CLUSTERS });
    assert.ok(h2.includes('data-action="WRW_BACK"'));
  });
});

describe('WeeklyReflectionWizard — error banner', () => {
  test('renders error name when present', () => {
    const html = WeeklyReflectionWizard({
      step: 4,
      clusters: CLUSTERS,
      selectedTag: 'MEETING_LOAD',
      title: 't',
      problemStatement: 'p',
      goalStatement: 'g',
      errorName: 'PROBLEM_STATEMENT_TOO_SHORT'
    });
    assert.ok(html.includes('PROBLEM_STATEMENT_TOO_SHORT'));
    assert.ok(html.includes('role="alert"'));
  });
});

describe('WeeklyReflectionWizard — close button', () => {
  test('each step has a close button wired to WRW_CLOSE', () => {
    for (const step of [1, 2, 3, 4]) {
      const html = WeeklyReflectionWizard({ step, clusters: CLUSTERS });
      assert.ok(html.includes('data-action="WRW_CLOSE"'), `step ${step}`);
    }
  });
});
