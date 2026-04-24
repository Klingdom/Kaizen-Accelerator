/**
 * Sprint 13 Pass 13b — ScheduledActivityBlock duration-chip render tests.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { ScheduledActivityBlock } from '../../../js/ui/components/ScheduledActivityBlock.js';

function mkActivity(overrides = {}) {
  return {
    id: 'sa_1',
    catalogEntryId: 'cat_work',
    name: 'Focus Block',
    bucket: 'PROJECT',
    plannedDurationMinutes: 60,
    plannedStartAt: '10:00',
    state: 'PROPOSED',
    ...overrides
  };
}

describe('ScheduledActivityBlock — duration chips: visibility', () => {
  test('no chips when editMode is false', () => {
    const html = ScheduledActivityBlock({
      activity: mkActivity(),
      editMode: false,
      editSelected: true
    });
    assert.equal(html.includes('sa-duration-chips'), false);
    assert.equal(html.includes('data-action="EDIT_CHANGE_DURATION"'), false);
  });

  test('no chips when not edit-selected', () => {
    const html = ScheduledActivityBlock({
      activity: mkActivity(),
      editMode: true,
      editSelected: false
    });
    assert.equal(html.includes('sa-duration-chips'), false);
  });

  test('no chips when the slot is protected (Daily Standup)', () => {
    const a = mkActivity({
      catalogEntryId: 'cer_daily_standup',
      name: 'Daily Standup',
      bucket: 'COMMUNICATION'
    });
    const html = ScheduledActivityBlock({
      activity: a,
      editMode: true,
      editSelected: true
    });
    assert.equal(html.includes('sa-duration-chips'), false);
    assert.equal(html.includes('data-action="EDIT_CHANGE_DURATION"'), false);
  });

  test('no chips when the slot is protected (carriedOver=true)', () => {
    const html = ScheduledActivityBlock({
      activity: mkActivity({ carriedOver: true }),
      editMode: true,
      editSelected: true
    });
    assert.equal(html.includes('sa-duration-chips'), false);
  });

  test('chips render for a non-protected edit-selected block', () => {
    const html = ScheduledActivityBlock({
      activity: mkActivity(),
      editMode: true,
      editSelected: true
    });
    assert.match(html, /sa-duration-chips/);
    assert.match(html, /data-action="EDIT_CHANGE_DURATION"/);
  });
});

describe('ScheduledActivityBlock — duration chips: structure', () => {
  test('renders exactly six chips', () => {
    const html = ScheduledActivityBlock({
      activity: mkActivity(),
      editMode: true,
      editSelected: true
    });
    const matches = html.match(/data-action="EDIT_CHANGE_DURATION"/g) ?? [];
    assert.equal(matches.length, 6);
  });

  test('chips carry 15, 30, 45, 60, 75, 90 minute labels', () => {
    const html = ScheduledActivityBlock({
      activity: mkActivity(),
      editMode: true,
      editSelected: true
    });
    for (const m of [15, 30, 45, 60, 75, 90]) {
      // chip text is exactly `${m}m`.
      assert.match(html, new RegExp(`>${m}m<\\/button>`));
    }
  });

  test('active chip reflects current plannedDurationMinutes', () => {
    const html = ScheduledActivityBlock({
      activity: mkActivity({ plannedDurationMinutes: 45 }),
      editMode: true,
      editSelected: true
    });
    // The active chip should have sa-dur-chip-active class AND aria-pressed="true".
    assert.match(html, /class="sa-dur-chip sa-dur-chip-active"[^>]*aria-pressed="true"[^>]*>45m<\/button>/);
  });

  test('non-active chips have aria-pressed="false"', () => {
    const html = ScheduledActivityBlock({
      activity: mkActivity({ plannedDurationMinutes: 60 }),
      editMode: true,
      editSelected: true
    });
    // The 30-minute chip should be aria-pressed="false" and NOT have active class.
    assert.match(html, /class="sa-dur-chip"[^>]*aria-pressed="false"[^>]*>30m<\/button>/);
  });

  test('payload JSON carries activityId + minutes', () => {
    const html = ScheduledActivityBlock({
      activity: mkActivity({ id: 'sa_abc', plannedDurationMinutes: 60 }),
      editMode: true,
      editSelected: true
    });
    // Spot-check 3 chips. esc() replaces " with &quot;, so we look for the escaped form.
    assert.match(html, /data-payload='\{&quot;activityId&quot;:&quot;sa_abc&quot;,&quot;minutes&quot;:15\}'/);
    assert.match(html, /data-payload='\{&quot;activityId&quot;:&quot;sa_abc&quot;,&quot;minutes&quot;:60\}'/);
    assert.match(html, /data-payload='\{&quot;activityId&quot;:&quot;sa_abc&quot;,&quot;minutes&quot;:90\}'/);
  });

  test('duration label is rendered above the chip row for accessibility', () => {
    const html = ScheduledActivityBlock({
      activity: mkActivity({ plannedDurationMinutes: 75 }),
      editMode: true,
      editSelected: true
    });
    assert.match(html, /sa-duration-label[^>]*>duration: 75m</);
  });

  test('chip row carries a role=group with aria-label', () => {
    const html = ScheduledActivityBlock({
      activity: mkActivity(),
      editMode: true,
      editSelected: true
    });
    assert.match(html, /role="group"[^>]*aria-label="duration chips"/);
  });

  test('current-duration chip is still present even for non-standard current values', () => {
    // Current is 25 (not in DURATION_OPTIONS) — no chip should be active,
    // but the 6 chips still render.
    const html = ScheduledActivityBlock({
      activity: mkActivity({ plannedDurationMinutes: 25 }),
      editMode: true,
      editSelected: true
    });
    const matches = html.match(/data-action="EDIT_CHANGE_DURATION"/g) ?? [];
    assert.equal(matches.length, 6);
    assert.equal(html.includes('sa-dur-chip-active'), false);
  });

  test('each chip is a real <button type="button">', () => {
    const html = ScheduledActivityBlock({
      activity: mkActivity(),
      editMode: true,
      editSelected: true
    });
    const btnMatches = html.match(/<button type="button" class="sa-dur-chip/g) ?? [];
    assert.equal(btnMatches.length, 6);
  });
});

describe('ScheduledActivityBlock — duration chips: co-existence with edit chrome', () => {
  test('chips render alongside Select + Remove buttons', () => {
    const html = ScheduledActivityBlock({
      activity: mkActivity(),
      editMode: true,
      editSelected: true
    });
    assert.match(html, /data-action="EDIT_SELECT_SLOT"/);
    assert.match(html, /data-action="EDIT_REMOVE_SLOT"/);
    assert.match(html, /data-action="EDIT_CHANGE_DURATION"/);
  });

  test('protected block: chips absent AND lock present', () => {
    const html = ScheduledActivityBlock({
      activity: mkActivity({
        catalogEntryId: 'cer_daily_standup',
        name: 'Daily Standup'
      }),
      editMode: true,
      editSelected: true
    });
    assert.match(html, /sa-lock/);
    assert.equal(html.includes('sa-duration-chips'), false);
  });
});
