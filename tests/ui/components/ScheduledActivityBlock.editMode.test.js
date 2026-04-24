/**
 * Sprint 12 Pass 12c — ScheduledActivityBlock edit-mode render tests.
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

describe('ScheduledActivityBlock — edit mode: non-protected row', () => {
  test('adds "edit-selectable" class', () => {
    const html = ScheduledActivityBlock({ activity: mkActivity(), editMode: true });
    assert.match(html, /class="[^"]*edit-selectable[^"]*"/);
  });

  test('renders EDIT_SELECT_SLOT + EDIT_REMOVE_SLOT buttons', () => {
    const html = ScheduledActivityBlock({ activity: mkActivity(), editMode: true });
    assert.match(html, /data-action="EDIT_SELECT_SLOT"/);
    assert.match(html, /data-action="EDIT_REMOVE_SLOT"/);
  });

  test('row itself has EDIT_SELECT_SLOT data-action (click-hotspot)', () => {
    const html = ScheduledActivityBlock({ activity: mkActivity(), editMode: true });
    // The <li> should carry the select action so clicking anywhere on the
    // row selects it.
    assert.match(html, /^<li class="[^"]*edit-selectable[^"]*"[^>]*data-action="EDIT_SELECT_SLOT"/);
  });

  test('editSelected=true adds "edit-selected" class', () => {
    const html = ScheduledActivityBlock({
      activity: mkActivity(),
      editMode: true,
      editSelected: true
    });
    assert.match(html, /edit-selected/);
  });

  test('hides normal Start/Skip/Close actions while editing', () => {
    const html = ScheduledActivityBlock({
      activity: mkActivity({ state: 'SCHEDULED' }),
      editMode: true,
      showStart: true
    });
    assert.equal(html.includes('data-action="START_ACTIVITY"'), false);
    assert.equal(html.includes('data-action="OPEN_SKIP_MODAL"'), false);
  });
});

describe('ScheduledActivityBlock — edit mode: protected row', () => {
  test('Daily Standup gets "edit-protected" class + lock icon', () => {
    const a = mkActivity({
      catalogEntryId: 'cer_daily_standup',
      name: 'Daily Standup',
      bucket: 'COMMUNICATION'
    });
    const html = ScheduledActivityBlock({ activity: a, editMode: true });
    assert.match(html, /edit-protected/);
    assert.match(html, /sa-lock/);
    assert.match(html, /🔒/);
  });

  test('protected row does NOT render select/remove buttons', () => {
    const a = mkActivity({
      catalogEntryId: 'cer_daily_standup',
      name: 'Daily Standup'
    });
    const html = ScheduledActivityBlock({ activity: a, editMode: true });
    assert.equal(html.includes('data-action="EDIT_SELECT_SLOT"'), false);
    assert.equal(html.includes('data-action="EDIT_REMOVE_SLOT"'), false);
  });

  test('R2 rescue (carriedOver=true) is protected', () => {
    const html = ScheduledActivityBlock({
      activity: mkActivity({ carriedOver: true }),
      editMode: true
    });
    assert.match(html, /edit-protected/);
    assert.match(html, /sa-lock/);
  });

  test('strategic PROJECT activity is protected', () => {
    const html = ScheduledActivityBlock({
      activity: mkActivity({ strategic: true }),
      editMode: true
    });
    assert.match(html, /edit-protected/);
  });
});

describe('ScheduledActivityBlock — no edit mode', () => {
  test('editMode=false omits edit chrome', () => {
    const html = ScheduledActivityBlock({ activity: mkActivity() });
    assert.equal(html.includes('edit-selectable'), false);
    assert.equal(html.includes('edit-protected'), false);
    assert.equal(html.includes('data-action="EDIT_SELECT_SLOT"'), false);
  });
});
