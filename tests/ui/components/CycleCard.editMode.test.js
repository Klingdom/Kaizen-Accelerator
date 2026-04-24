/**
 * Sprint 12 Pass 12c — CycleCard edit-mode render tests.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { CycleCard } from '../../../js/ui/components/CycleCard.js';

function mkComposition(state = 'PROPOSED') {
  return { id: 'comp_1', userId: 'u', state, cycleType: 'DAILY' };
}

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

describe('CycleCard — edit mode (PROPOSED)', () => {
  test('replaces the AcceptEditRejectTriad with Commit/Cancel/Undo', () => {
    const html = CycleCard({
      composition: mkComposition('PROPOSED'),
      activities: [mkActivity()],
      editMode: true
    });
    assert.equal(html.includes('data-action="ACCEPT"'), false);
    assert.equal(html.includes('data-action="REJECT"'), false);
    assert.match(html, /data-action="EDIT_COMMIT"/);
    assert.match(html, /data-action="EDIT_CANCEL"/);
    assert.match(html, /data-action="EDIT_UNDO"/);
  });

  test('adds cycle-editing class', () => {
    const html = CycleCard({
      composition: mkComposition('PROPOSED'),
      activities: [mkActivity()],
      editMode: true
    });
    assert.match(html, /cycle-editing/);
  });

  test('renders "Edit today" title', () => {
    const html = CycleCard({
      composition: mkComposition('PROPOSED'),
      activities: [mkActivity()],
      editMode: true
    });
    assert.match(html, /Edit today/);
  });

  test('Undo button carries undoCount', () => {
    const html = CycleCard({
      composition: mkComposition('PROPOSED'),
      activities: [mkActivity()],
      editMode: true,
      undoCount: 3
    });
    assert.match(html, /Undo \(3\)/);
  });

  test('Undo button disabled when count=0', () => {
    const html = CycleCard({
      composition: mkComposition('PROPOSED'),
      activities: [mkActivity()],
      editMode: true,
      undoCount: 0
    });
    assert.match(html, /data-action="EDIT_UNDO"[^>]*disabled/);
  });

  test('editMode=false preserves AcceptEditRejectTriad', () => {
    const html = CycleCard({
      composition: mkComposition('PROPOSED'),
      activities: [mkActivity()]
    });
    assert.match(html, /data-action="ACCEPT"/);
    assert.match(html, /data-action="EDIT"/);
    assert.match(html, /data-action="REJECT"/);
  });

  test('passes selectedActivityId into activity blocks', () => {
    const acts = [
      mkActivity({ id: 'sa_a' }),
      mkActivity({ id: 'sa_b' })
    ];
    const html = CycleCard({
      composition: mkComposition('PROPOSED'),
      activities: acts,
      editMode: true,
      selectedActivityId: 'sa_b'
    });
    // sa_b should have edit-selected class; sa_a should not.
    const bIdx = html.indexOf('data-activity-id="sa_b"');
    const preB = html.slice(Math.max(0, bIdx - 200), bIdx + 100);
    assert.match(preB, /edit-selected/);
  });
});

describe('CycleCard — edit mode (ACCEPTED)', () => {
  test('also shows Commit/Cancel/Undo in ACCEPTED edit mode', () => {
    const html = CycleCard({
      composition: mkComposition('ACCEPTED'),
      activities: [mkActivity({ state: 'SCHEDULED' })],
      editMode: true
    });
    assert.match(html, /data-action="EDIT_COMMIT"/);
    assert.match(html, /data-action="EDIT_CANCEL"/);
  });

  test('hides runtime Start/Skip actions while editing ACCEPTED', () => {
    const html = CycleCard({
      composition: mkComposition('ACCEPTED'),
      activities: [mkActivity({ state: 'SCHEDULED' })],
      editMode: true
    });
    assert.equal(html.includes('data-action="START_ACTIVITY"'), false);
  });
});
