/**
 * Sprint 14 Pass 14b — time-editor render tests.
 *
 * Covers:
 *   - Input renders for edit-selected non-protected slot
 *   - Input NOT rendered when not selected
 *   - Input NOT rendered when protected (even if selected)
 *   - value attribute matches plannedStartAt's HH:MM
 *   - data-activity-id matches
 *   - Input is inside the sa-when container
 *   - Protected selected slot keeps static time display
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { ScheduledActivityBlock } from '../../../js/ui/components/ScheduledActivityBlock.js';

function mkActivity(overrides = {}) {
  return {
    id: 'sa_1',
    catalogEntryId: 'cat_some',
    name: 'Some Work',
    bucket: 'PROJECT',
    plannedDurationMinutes: 30,
    plannedStartAt: '10:15',
    state: 'PROPOSED',
    intention: null,
    ...overrides
  };
}

describe('ScheduledActivityBlock — time editor (Sprint 14)', () => {
  test('renders <input type="time"> for edit-selected non-protected slot', () => {
    const html = ScheduledActivityBlock({
      activity: mkActivity({ plannedStartAt: '09:30' }),
      editMode: true,
      editSelected: true
    });
    assert.match(html, /<input[^>]+type="time"/);
    assert.match(html, /class="sa-time-editor"/);
    assert.match(html, /data-action="EDIT_CHANGE_START_TIME"/);
  });

  test('input NOT rendered when edit mode is off', () => {
    const html = ScheduledActivityBlock({
      activity: mkActivity(),
      editMode: false,
      editSelected: false
    });
    assert.doesNotMatch(html, /<input[^>]+type="time"/);
  });

  test('input NOT rendered when slot is NOT edit-selected', () => {
    const html = ScheduledActivityBlock({
      activity: mkActivity(),
      editMode: true,
      editSelected: false
    });
    assert.doesNotMatch(html, /<input[^>]+type="time"/);
  });

  test('input NOT rendered when protected (Daily Standup) even if selected', () => {
    const html = ScheduledActivityBlock({
      activity: mkActivity({
        id: 'sa_standup',
        catalogEntryId: 'cer_daily_standup',
        name: 'Daily Standup',
        bucket: 'COMMUNICATION',
        plannedStartAt: '09:00'
      }),
      editMode: true,
      editSelected: true
    });
    assert.doesNotMatch(html, /<input[^>]+type="time"/);
  });

  test('input NOT rendered when carriedOver (protected rescue) is selected', () => {
    const html = ScheduledActivityBlock({
      activity: mkActivity({ carriedOver: true }),
      editMode: true,
      editSelected: true
    });
    assert.doesNotMatch(html, /<input[^>]+type="time"/);
  });

  test('value attribute matches plannedStartAt HH:MM (raw HH:MM)', () => {
    const html = ScheduledActivityBlock({
      activity: mkActivity({ plannedStartAt: '13:45' }),
      editMode: true,
      editSelected: true
    });
    assert.match(html, /<input[^>]+value="13:45"/);
  });

  test('value attribute matches plannedStartAt HH:MM (ISO source)', () => {
    const html = ScheduledActivityBlock({
      activity: mkActivity({ plannedStartAt: '2026-04-22T08:15:00Z' }),
      editMode: true,
      editSelected: true
    });
    assert.match(html, /<input[^>]+value="08:15"/);
  });

  test('data-activity-id attribute matches activity id', () => {
    const html = ScheduledActivityBlock({
      activity: mkActivity({ id: 'sa_xyz_42' }),
      editMode: true,
      editSelected: true
    });
    assert.match(html, /<input[^>]+data-activity-id="sa_xyz_42"/);
  });

  test('input has aria-label="Start time"', () => {
    const html = ScheduledActivityBlock({
      activity: mkActivity(),
      editMode: true,
      editSelected: true
    });
    assert.match(html, /<input[^>]+aria-label="Start time"/);
  });

  test('input is inside the sa-when container', () => {
    const html = ScheduledActivityBlock({
      activity: mkActivity({ plannedStartAt: '11:00' }),
      editMode: true,
      editSelected: true
    });
    // The sa-when div should contain the <input>, not raw "11:00" text.
    const m = html.match(/<div class="sa-when"[^>]*>([\s\S]*?)<\/div>/);
    assert.ok(m, 'sa-when div not found');
    assert.match(m[1], /<input[^>]+type="time"/);
  });

  test('non-selected block keeps static sa-when text (range form)', () => {
    const html = ScheduledActivityBlock({
      activity: mkActivity({ plannedStartAt: '11:00' }),
      editMode: true,
      editSelected: false
    });
    const m = html.match(/<div class="sa-when"[^>]*>([\s\S]*?)<\/div>/);
    assert.ok(m);
    // Sprint 16a: static label is now "HH:MM–HH:MM" (en-dash U+2013).
    assert.equal(m[1], '11:00\u201311:30');
  });

  test('protected selected slot keeps static sa-when text (range form)', () => {
    const html = ScheduledActivityBlock({
      activity: mkActivity({
        catalogEntryId: 'cer_daily_standup',
        name: 'Daily Standup',
        plannedStartAt: '09:00'
      }),
      editMode: true,
      editSelected: true
    });
    const m = html.match(/<div class="sa-when"[^>]*>([\s\S]*?)<\/div>/);
    assert.ok(m);
    assert.equal(m[1], '09:00\u201309:30');
  });
});
