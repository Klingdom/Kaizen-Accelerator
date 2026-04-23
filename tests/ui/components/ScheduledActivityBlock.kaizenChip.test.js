/**
 * Sprint 10 backlog #2: Kaizen chip on ScheduledActivityBlock across all states.
 *
 * User coordinator-review finding: `part of: [Kaizen]` linkage was only
 * visible in the ACCEPTED variant's sub-label, and the component never
 * rendered a chip. Users couldn't see which Kaizen a proposed activity
 * belonged to before accepting. Fix surfaces a chip on PROPOSED +
 * SCHEDULED + IN_PROGRESS states when the parent passes `kaizenTitle`.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { ScheduledActivityBlock } from '../../../js/ui/components/ScheduledActivityBlock.js';

function act(overrides = {}) {
  return {
    id: 'sa_1',
    catalogEntryId: 'cat_1',
    name: 'DMAIC SIPOC',
    bucket: 'PROJECT',
    plannedStartAt: '2026-04-23T09:00:00Z',
    plannedDurationMinutes: 60,
    state: 'PROPOSED',
    linkedKaizenId: 'k_1',
    ...overrides
  };
}

describe('ScheduledActivityBlock — Kaizen chip', () => {
  test('renders chip when kaizenTitle provided AND linkedKaizenId set', () => {
    const html = ScheduledActivityBlock({
      activity: act(),
      kaizenTitle: 'Q2 Pipeline Cleanup'
    });
    assert.match(html, /class="sa-kaizen-chip"/);
    assert.match(html, /part of: Q2 Pipeline Cleanup/);
  });

  test('no chip when kaizenTitle missing', () => {
    const html = ScheduledActivityBlock({ activity: act() });
    assert.ok(!/sa-kaizen-chip/.test(html));
  });

  test('no chip when activity has no linkedKaizenId', () => {
    const html = ScheduledActivityBlock({
      activity: act({ linkedKaizenId: null }),
      kaizenTitle: 'Some Kaizen'
    });
    assert.ok(!/sa-kaizen-chip/.test(html));
  });

  test('chip renders on PROPOSED state (the hero use-case)', () => {
    const html = ScheduledActivityBlock({
      activity: act({ state: 'PROPOSED' }),
      kaizenTitle: 'Accelerator Project'
    });
    assert.match(html, /sa-kaizen-chip/);
    assert.match(html, /sa-state-proposed/);
  });

  test('chip renders on SCHEDULED state too', () => {
    const html = ScheduledActivityBlock({
      activity: act({ state: 'SCHEDULED' }),
      kaizenTitle: 'My Project'
    });
    assert.match(html, /sa-kaizen-chip/);
    assert.match(html, /sa-state-scheduled/);
  });

  test('chip renders on IN_PROGRESS state too', () => {
    const html = ScheduledActivityBlock({
      activity: act({ state: 'IN_PROGRESS', actualStartAt: '2026-04-23T09:00:00Z' }),
      kaizenTitle: 'My Project',
      nowIso: '2026-04-23T09:30:00Z'
    });
    assert.match(html, /sa-kaizen-chip/);
    assert.match(html, /sa-state-in_progress/);
  });

  test('chip title is HTML-escaped', () => {
    const html = ScheduledActivityBlock({
      activity: act(),
      kaizenTitle: 'Bad <script>alert()</script>'
    });
    assert.ok(!/<script>/.test(html));
    assert.match(html, /&lt;script&gt;/);
  });

  test('empty-string kaizenTitle is treated as missing', () => {
    const html = ScheduledActivityBlock({
      activity: act(),
      kaizenTitle: ''
    });
    assert.ok(!/sa-kaizen-chip/.test(html));
  });
});
