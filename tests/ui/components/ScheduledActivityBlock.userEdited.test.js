/**
 * Sprint 15 W4 — ScheduledActivityBlock surfaces the userEdited tone
 * signal as a `data-user-edited` attribute. Composer-built rows render
 * `false` (or omit the field), user-edited rows render `true`.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { ScheduledActivityBlock } from '../../../js/ui/components/ScheduledActivityBlock.js';

function stubActivity(overrides = {}) {
  return {
    id: 'sa_x',
    catalogEntryId: 'cat_x',
    name: 'Some activity',
    bucket: 'PROJECT',
    plannedDurationMinutes: 60,
    plannedStartAt: '09:00',
    state: 'SCHEDULED',
    ...overrides
  };
}

describe('ScheduledActivityBlock — data-user-edited', () => {
  test('renders data-user-edited="false" when userEdited is missing', () => {
    const html = ScheduledActivityBlock({ activity: stubActivity() });
    assert.match(html, /data-user-edited="false"/);
  });

  test('renders data-user-edited="false" when userEdited is explicitly false', () => {
    const html = ScheduledActivityBlock({ activity: stubActivity({ userEdited: false }) });
    assert.match(html, /data-user-edited="false"/);
  });

  test('renders data-user-edited="true" when userEdited is true', () => {
    const html = ScheduledActivityBlock({ activity: stubActivity({ userEdited: true }) });
    assert.match(html, /data-user-edited="true"/);
  });

  test('renders data-user-edited="false" for composer-built activities (no flag)', () => {
    // Simulating composer output: no `userEdited` field at all.
    const composerActivity = {
      id: 'sa_p_d0_p1',
      catalogEntryId: 'cat_20',
      name: 'DMAIC Charter',
      bucket: 'PROJECT',
      plannedDurationMinutes: 120,
      plannedStartAt: '09:00',
      state: 'PROPOSED',
      sourceOfSchedule: 'COMPOSER_AUTO'
    };
    const html = ScheduledActivityBlock({ activity: composerActivity });
    assert.match(html, /data-user-edited="false"/);
  });

  test('truthy non-boolean values do NOT flip to true (strict equality)', () => {
    const html = ScheduledActivityBlock({
      activity: stubActivity({ userEdited: 'yes' })
    });
    // `userEdited === true` is the gate — the renderer should treat
    // anything else as false.
    assert.match(html, /data-user-edited="false"/);
  });
});
