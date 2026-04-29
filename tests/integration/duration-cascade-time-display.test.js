/**
 * Sprint 14 — Sprint 13 cascade regression guard.
 * Sprint 16a — broadened to assert the rendered "HH:MM–HH:MM" range
 * (en-dash U+2013) instead of just the start time, so an incorrect end
 * time after a duration cascade is now caught here too.
 *
 * Confirms that when `applyDurationChange` bumps a slot's duration, the
 * visible "left column" time-range label (`<div class="sa-when">…</div>`)
 * on downstream butting-up blocks reflects the shifted plannedStartAt,
 * AND the focal block's end time tracks the new duration.
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
 *      div contains the correct HH:MM–HH:MM range labels.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { applyDurationChange } from '../../js/ui/editMode.js';
import { ScheduledActivityBlock } from '../../js/ui/components/ScheduledActivityBlock.js';

const EN_DASH = '\u2013';

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
 * Extract the text inside the first `<div class="sa-when" …>…</div>`.
 * Sprint 16a: the div carries an aria-label when not in time-editor mode,
 * so the regex must allow optional attributes after the class.
 */
function readWhen(html) {
  const m = html.match(/<div class="sa-when"[^>]*>([^<]*)<\/div>/);
  return m ? m[1] : null;
}

describe('Sprint 13 regression — duration cascade updates visible sa-when time', () => {
  test('60 → 90 on slot 1 shifts slots 2 and 3 and the visible range updates', () => {
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

    // Rendered sa-when checks — full ranges, end times encoded.
    assert.equal(
      readWhen(ScheduledActivityBlock({ activity: byId.s1 })),
      `09:00${EN_DASH}10:30`
    );
    assert.equal(
      readWhen(ScheduledActivityBlock({ activity: byId.s2 })),
      `10:30${EN_DASH}11:00`
    );
    assert.equal(
      readWhen(ScheduledActivityBlock({ activity: byId.s3 })),
      `11:00${EN_DASH}12:00`
    );
  });

  test('shrink 60 → 30 on slot 1 pulls visible time earlier and tracks new end', () => {
    const acts = [
      mkActivity({ id: 's1', plannedStartAt: '09:00', plannedDurationMinutes: 60 }),
      mkActivity({ id: 's2', plannedStartAt: '10:00', plannedDurationMinutes: 30 }),
      mkActivity({ id: 's3', plannedStartAt: '10:30', plannedDurationMinutes: 60 })
    ];
    const next = applyDurationChange(acts, 's1', 30);
    const byId = Object.fromEntries(next.map((a) => [a.id, a]));
    assert.equal(byId.s1.plannedDurationMinutes, 30);
    assert.equal(byId.s2.plannedStartAt, '09:30');
    assert.equal(byId.s3.plannedStartAt, '10:00');

    // The focal slot's range should NOT still say 09:00–10:00 — the end
    // must reflect the shrunk duration.
    assert.equal(
      readWhen(ScheduledActivityBlock({ activity: byId.s1 })),
      `09:00${EN_DASH}09:30`
    );
    assert.equal(
      readWhen(ScheduledActivityBlock({ activity: byId.s2 })),
      `09:30${EN_DASH}10:00`
    );
    assert.equal(
      readWhen(ScheduledActivityBlock({ activity: byId.s3 })),
      `10:00${EN_DASH}11:00`
    );
  });

  test('composer-mechanical gap: non-protected gapped successor IS shifted', () => {
    // Bug 2 fix: cascade now crosses composer-introduced gaps. s2 is neither
    // protected nor user-edited so it shifts by the same +30m delta.
    const acts = [
      mkActivity({ id: 's1', plannedStartAt: '09:00', plannedDurationMinutes: 60 }),
      mkActivity({ id: 's2', plannedStartAt: '11:00', plannedDurationMinutes: 30 }) // 60m gap
    ];
    const next = applyDurationChange(acts, 's1', 90);
    const byId = Object.fromEntries(next.map((a) => [a.id, a]));
    // s1 grew by 30m; s2 shifts by the same +30m across the gap.
    assert.equal(byId.s2.plannedStartAt, '11:30');
    assert.equal(
      readWhen(ScheduledActivityBlock({ activity: byId.s1 })),
      `09:00${EN_DASH}10:30`
    );
    assert.equal(
      readWhen(ScheduledActivityBlock({ activity: byId.s2 })),
      `11:30${EN_DASH}12:00`
    );
  });

  test('shrink across composer gap also cascades the non-protected successor', () => {
    // Bug 2 fix: shrink also cascades across composer gaps for non-protected rows.
    const acts = [
      mkActivity({ id: 's1', plannedStartAt: '09:00', plannedDurationMinutes: 60 }),
      mkActivity({ id: 's2', plannedStartAt: '11:00', plannedDurationMinutes: 30 }) // 60m gap
    ];
    const next = applyDurationChange(acts, 's1', 30);
    const byId = Object.fromEntries(next.map((a) => [a.id, a]));
    // s1 shrunk by 30m; s2 shifts by the same -30m across the gap.
    assert.equal(byId.s2.plannedStartAt, '10:30');
    assert.equal(
      readWhen(ScheduledActivityBlock({ activity: byId.s1 })),
      `09:00${EN_DASH}09:30`
    );
    assert.equal(
      readWhen(ScheduledActivityBlock({ activity: byId.s2 })),
      `10:30${EN_DASH}11:00`
    );
  });
});
