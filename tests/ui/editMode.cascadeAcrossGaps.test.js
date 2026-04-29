/**
 * Sprint 16 Bug 2 — cascade across composer-mechanical gaps.
 *
 * New invariant: the cascade never stops on gap size. Instead:
 *   - Protected rows (name / catalogEntryId / slotKind) are anchors → don't
 *     shift, and break the cascade for all subsequent rows.
 *   - userEdited === true rows are user-pinned anchors → don't shift, and
 *     break the cascade for all subsequent rows.
 *   - All other rows (regardless of gap size) are shifted by the same delta.
 *
 * Covers ACs 2-1 through 2-5.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  applyDurationChange,
  applyStartTimeChange,
  PROTECTED_NAMES
} from '../../js/ui/editMode.js';

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

function mkProtected(overrides = {}) {
  return mkActivity({
    id: 'lunch',
    catalogEntryId: 'cer_daily_standup',
    name: 'Daily Standup',
    bucket: 'COMMUNICATION',
    plannedDurationMinutes: 15,
    ...overrides
  });
}

// ── applyDurationChange ──────────────────────────────────────────────────────

describe('Bug 2 — applyDurationChange cascade invariant', () => {
  test('AC2-2: full cascade when no protected/user-edited rows between activities', () => {
    // A(09:30,60) B(10:30,30) C(11:00,60) — all butting-up, no protected.
    const acts = [
      mkActivity({ id: 'a', plannedStartAt: '09:30', plannedDurationMinutes: 60 }),
      mkActivity({ id: 'b', plannedStartAt: '10:30', plannedDurationMinutes: 30 }),
      mkActivity({ id: 'c', plannedStartAt: '11:00', plannedDurationMinutes: 60 })
    ];
    const next = applyDurationChange(acts, 'a', 90);
    const byId = Object.fromEntries(next.map((a) => [a.id, a]));
    assert.equal(byId.a.plannedDurationMinutes, 90);
    assert.equal(byId.b.plannedStartAt, '11:00'); // shifted +30m
    assert.equal(byId.c.plannedStartAt, '11:30'); // shifted +30m
  });

  test('AC2-3: cascade crosses a composer-mechanical gap (non-protected, non-user-edited)', () => {
    // A(09:30,60) ends at 10:30, B starts at 11:00 — 30m composer gap.
    const acts = [
      mkActivity({ id: 'a', plannedStartAt: '09:30', plannedDurationMinutes: 60 }),
      mkActivity({ id: 'b', plannedStartAt: '11:00', plannedDurationMinutes: 30 })
    ];
    const next = applyDurationChange(acts, 'a', 90);
    const byId = Object.fromEntries(next.map((a) => [a.id, a]));
    assert.equal(byId.a.plannedDurationMinutes, 90);
    assert.equal(byId.b.plannedStartAt, '11:30'); // shifted +30m across the gap
  });

  test('AC2-1: protected row is NOT shifted; cascade stops after it', () => {
    // A(09:30,60), Standup(12:00,anchored/protected), B(13:00,30), C(13:30,60)
    // Changing A from 60→90m (+30 delta). Standup is protected — stays at 12:00.
    // B and C are downstream of the protected row → also not shifted.
    const acts = [
      mkActivity({ id: 'a', plannedStartAt: '09:30', plannedDurationMinutes: 60 }),
      mkProtected({ id: 'standup_p', plannedStartAt: '12:00', plannedDurationMinutes: 15 }),
      mkActivity({ id: 'b', plannedStartAt: '13:00', plannedDurationMinutes: 30 }),
      mkActivity({ id: 'c', plannedStartAt: '13:30', plannedDurationMinutes: 60 })
    ];
    const next = applyDurationChange(acts, 'a', 90);
    const byId = Object.fromEntries(next.map((a) => [a.id, a]));
    assert.equal(byId.a.plannedDurationMinutes, 90);
    assert.equal(byId.standup_p.plannedStartAt, '12:00'); // protected — pinned
    assert.equal(byId.b.plannedStartAt, '13:00'); // after pin — not shifted
    assert.equal(byId.c.plannedStartAt, '13:30'); // after pin — not shifted
  });

  test('AC2-4: userEdited row is NOT shifted; cascade stops after it', () => {
    // A(09:30,60), B(11:00,30,userEdited), C(11:30,60)
    // Changing A from 60→90 (+30 delta). B is user-pinned → stays at 11:00.
    // C is after the pin → not shifted.
    const acts = [
      mkActivity({ id: 'a', plannedStartAt: '09:30', plannedDurationMinutes: 60 }),
      mkActivity({ id: 'b', plannedStartAt: '11:00', plannedDurationMinutes: 30, userEdited: true }),
      mkActivity({ id: 'c', plannedStartAt: '11:30', plannedDurationMinutes: 60 })
    ];
    const next = applyDurationChange(acts, 'a', 90);
    const byId = Object.fromEntries(next.map((a) => [a.id, a]));
    assert.equal(byId.a.plannedDurationMinutes, 90);
    assert.equal(byId.b.plannedStartAt, '11:00'); // user-pinned — stays
    assert.equal(byId.c.plannedStartAt, '11:30'); // after pin — not shifted
  });

  test('non-protected, non-userEdited rows before a protected row ARE shifted', () => {
    // A(09:00,60), B(10:00,30) — both non-protected. Protected row after both.
    // Growing A by 30m shifts B, then stops at protected.
    const acts = [
      mkActivity({ id: 'a', plannedStartAt: '09:00', plannedDurationMinutes: 60 }),
      mkActivity({ id: 'b', plannedStartAt: '10:00', plannedDurationMinutes: 30 }),
      mkProtected({ id: 'prot', plannedStartAt: '12:00', plannedDurationMinutes: 15 }),
      mkActivity({ id: 'c', plannedStartAt: '13:00', plannedDurationMinutes: 60 })
    ];
    const next = applyDurationChange(acts, 'a', 90);
    const byId = Object.fromEntries(next.map((a) => [a.id, a]));
    assert.equal(byId.b.plannedStartAt, '10:30'); // shifted +30m (before protected)
    assert.equal(byId.prot.plannedStartAt, '12:00'); // protected, not shifted
    assert.equal(byId.c.plannedStartAt, '13:00'); // after protected, not shifted
  });

  test('multiple non-protected gapped rows all shift by the same delta', () => {
    // Three rows with composer gaps between them — all should shift.
    const acts = [
      mkActivity({ id: 'a', plannedStartAt: '09:00', plannedDurationMinutes: 60 }),
      mkActivity({ id: 'b', plannedStartAt: '10:30', plannedDurationMinutes: 30 }), // 30m gap
      mkActivity({ id: 'c', plannedStartAt: '12:00', plannedDurationMinutes: 60 }), // 60m gap
      mkActivity({ id: 'd', plannedStartAt: '14:00', plannedDurationMinutes: 30 })  // 60m gap
    ];
    const next = applyDurationChange(acts, 'a', 90);
    const byId = Object.fromEntries(next.map((a) => [a.id, a]));
    assert.equal(byId.b.plannedStartAt, '11:00'); // +30m
    assert.equal(byId.c.plannedStartAt, '12:30'); // +30m
    assert.equal(byId.d.plannedStartAt, '14:30'); // +30m
  });

  test('slotKind-protected row acts as an anchor', () => {
    const acts = [
      mkActivity({ id: 'a', plannedStartAt: '09:00', plannedDurationMinutes: 60 }),
      mkActivity({
        id: 'am_comm',
        slotKind: 'AM_COMM',
        name: 'AM High-value Communication',
        plannedStartAt: '10:30',
        plannedDurationMinutes: 60
      }),
      mkActivity({ id: 'b', plannedStartAt: '12:00', plannedDurationMinutes: 30 })
    ];
    const next = applyDurationChange(acts, 'a', 90);
    const byId = Object.fromEntries(next.map((a) => [a.id, a]));
    // AM_COMM is in PROTECTED_SLOT_KINDS → not shifted, cascade stops.
    assert.equal(byId.am_comm.plannedStartAt, '10:30');
    assert.equal(byId.b.plannedStartAt, '12:00');
  });
});

// ── applyStartTimeChange ─────────────────────────────────────────────────────

describe('Bug 2 — applyStartTimeChange cascade invariant (AC2-5)', () => {
  test('cascade crosses a composer-mechanical gap for non-protected rows', () => {
    // A(09:00,60) ends at 10:00, B starts at 11:00 — 60m composer gap.
    // Moving A to 09:30 (+30m delta) should cascade to B.
    const acts = [
      mkActivity({ id: 'a', plannedStartAt: '09:00', plannedDurationMinutes: 60 }),
      mkActivity({ id: 'b', plannedStartAt: '11:00', plannedDurationMinutes: 30 })
    ];
    const next = applyStartTimeChange(acts, 'a', '09:30');
    const byId = Object.fromEntries(next.map((a) => [a.id, a]));
    assert.equal(byId.a.plannedStartAt, '09:30');
    assert.equal(byId.b.plannedStartAt, '11:30'); // shifted +30m across the gap
  });

  test('protected row stops cascade in applyStartTimeChange too', () => {
    const acts = [
      mkActivity({ id: 'a', plannedStartAt: '09:00', plannedDurationMinutes: 60 }),
      mkProtected({ id: 'prot', plannedStartAt: '11:00', plannedDurationMinutes: 15 }),
      mkActivity({ id: 'c', plannedStartAt: '12:00', plannedDurationMinutes: 30 })
    ];
    const next = applyStartTimeChange(acts, 'a', '09:30');
    const byId = Object.fromEntries(next.map((a) => [a.id, a]));
    assert.equal(byId.a.plannedStartAt, '09:30');
    assert.equal(byId.prot.plannedStartAt, '11:00'); // protected — pinned
    assert.equal(byId.c.plannedStartAt, '12:00');    // after pin — not shifted
  });

  test('userEdited row stops cascade in applyStartTimeChange', () => {
    const acts = [
      mkActivity({ id: 'a', plannedStartAt: '09:00', plannedDurationMinutes: 60 }),
      mkActivity({ id: 'b', plannedStartAt: '11:00', plannedDurationMinutes: 30, userEdited: true }),
      mkActivity({ id: 'c', plannedStartAt: '11:30', plannedDurationMinutes: 60 })
    ];
    const next = applyStartTimeChange(acts, 'a', '09:30');
    const byId = Object.fromEntries(next.map((a) => [a.id, a]));
    assert.equal(byId.a.plannedStartAt, '09:30');
    assert.equal(byId.b.plannedStartAt, '11:00'); // user-pinned
    assert.equal(byId.c.plannedStartAt, '11:30'); // after pin — not shifted
  });

  test('multiple gapped non-protected rows all shift by same delta', () => {
    const acts = [
      mkActivity({ id: 'a', plannedStartAt: '09:00', plannedDurationMinutes: 60 }),
      mkActivity({ id: 'b', plannedStartAt: '11:00', plannedDurationMinutes: 30 }),
      mkActivity({ id: 'c', plannedStartAt: '13:00', plannedDurationMinutes: 60 })
    ];
    const next = applyStartTimeChange(acts, 'a', '09:30');
    const byId = Object.fromEntries(next.map((a) => [a.id, a]));
    assert.equal(byId.b.plannedStartAt, '11:30');
    assert.equal(byId.c.plannedStartAt, '13:30');
  });
});
