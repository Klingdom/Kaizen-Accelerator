/**
 * Sprint 14 — Sprint 13 cascade regression guard.
 *
 * Confirms that when `applyDurationChange` bumps a slot's duration, the
 * visible "left column" time label (`<div class="sa-when">…</div>`) on
 * downstream butting-up blocks reflects the shifted plannedStartAt.
 *
 * The user report said:
 *   "When the duration for a standard work card is edited the time on
 *    the left should update."
 *
 * We drive a small three-activity schedule (09:00/60m, 10:00/30m,
 * 10:30/60m), bump slot 1 from 60→90, then:
 *   1. Assert the downstream activities' plannedStartAt have shifted to
 *      10:30 and 11:00 respectively.
 *   2. Render ScheduledActivityBlock for each and confirm the `sa-when`
 *      div contains the correct HH:MM labels.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { applyDurationChange } from '../../js/ui/editMode.js';
import { ScheduledActivityBlock } from '../../js/ui/components/ScheduledActivityBlock.js';

function mkActivity(overrides = {}) {
  return {
    id: `sa_${Math.random().toString(36).slice(2, 8)}`,
    catalogEntryId: 'cat_some',
    name: 'Some Work',
    bucket: 'PROJECT',
    plannedDurationMinutes: 60,
    plannedStartAt: null,
    state: 'PROPOSED',
    sourceOfSchedule: 'COMPOSER_AUTO',
    ...overrides
  };
}

/**
 * Extract the text inside the first `<div class="sa-when">…</div>`.
 */
function readWhen(html) {
  const m = html.match(/<div class="sa-when">([^<]*)<\/div>/);
  return m ? m[1] : null;
}

describe('Sprint 13 regression — duration cascade updates visible sa-when time', () => {
  test('60 → 90 on slot 1 shifts slots 2 and 3 and the visible time updates', () => {
    const acts = [
      mkActivity({ id: 's1', name: 'S1', plannedStartAt: '09:00', plannedDurationMinutes: 60 }),
      mkActivity({ id: 's2', name: 'S2', plannedStartAt: '10:00', plannedDurationMinutes: 30 }),
      mkActivity({ id: 's3', name: 'S3', plannedStartAt: '10:30', plannedDurationMinutes: 60 })
    ];
    const next = applyDurationChange(acts, 's1', 90);
    const byId = Object.fromEntries(next.map((a) => [a.id, a]));

    // plannedStartAt cascade checks
    assert.equal(byId.s1.plannedStartAt, '09:00');
    assert.equal(byId.s1.plannedDurationMinutes, 90);
    assert.equal(byId.s2.plannedStartAt, '10:30');
    assert.equal(byId.s3.plannedStartAt, '11:00');

    // Rendered sa-when checks
    assert.equal(readWhen(ScheduledActivityBlock({ activity: byId.s1 })), '09:00');
    assert.equal(readWhen(ScheduledActivityBlock({ activity: byId.s2 })), '10:30');
    assert.equal(readWhen(ScheduledActivityBlock({ activity: byId.s3 })), '11:00');
  });

  test('shrink 60 → 30 on slot 1 pulls visible time earlier', () => {
    const acts = [
      mkActivity({ id: 's1', plannedStartAt: '09:00', plannedDurationMinutes: 60 }),
      mkActivity({ id: 's2', plannedStartAt: '10:00', plannedDurationMinutes: 30 }),
      mkActivity({ id: 's3', plannedStartAt: '10:30', plannedDurationMinutes: 60 })
    ];
    const next = applyDurationChange(acts, 's1', 30);
    const byId = Object.fromEntries(next.map((a) => [a.id, a]));
    assert.equal(byId.s2.plannedStartAt, '09:30');
    assert.equal(byId.s3.plannedStartAt, '10:00');

    assert.equal(readWhen(ScheduledActivityBlock({ activity: byId.s2 })), '09:30');
    assert.equal(readWhen(ScheduledActivityBlock({ activity: byId.s3 })), '10:00');
  });

  test('gapped successor keeps its visible time unchanged', () => {
    const acts = [
      mkActivity({ id: 's1', plannedStartAt: '09:00', plannedDurationMinutes: 60 }),
      mkActivity({ id: 's2', plannedStartAt: '11:00', plannedDurationMinutes: 30 }) // 60m gap
    ];
    const next = applyDurationChange(acts, 's1', 90);
    const byId = Object.fromEntries(next.map((a) => [a.id, a]));
    assert.equal(byId.s2.plannedStartAt, '11:00');
    assert.equal(readWhen(ScheduledActivityBlock({ activity: byId.s2 })), '11:00');
  });
});
