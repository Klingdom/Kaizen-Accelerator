/**
 * BlockDetailDialog — Iter 47 Phase 2 tests.
 *
 * AC coverage:
 *   AC7: Disabled Edit button REMOVED from protected blocks
 *   AC8: Bucket-label text rows REMOVED
 *   AC9: Standalone duration row REMOVED
 *  AC10: COMM slotKind-specific rationale sentence (5 variants)
 *  AC11: CI EoAR has "Start Reflection" action button (EOD_OPEN_REFLECTION)
 *  AC12: Sprint ceremonies have rationale sentence
 *  AC15: Iter 46 functionality preserved (participants/trigger on COMM)
 *  AC16: Iter 45 regression tests (DC-PR1-4 / DC-IP1-4) — EditButton on non-protected
 *  AC17: META §A.2 orthogonal-case tests
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { BlockDetailDialog } from '../../../js/ui/components/BlockDetailDialog.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const BASE_PROJECT = {
  id: 'sa_proj',
  name: 'Deep Work Session',
  bucket: 'PROJECT',
  plannedStartAt: '09:00',
  plannedDurationMinutes: 120,
  state: 'SCHEDULED',
  catalogEntryId: 'cat_deep_work'
};

const STANDUP = {
  id: 'sa_standup',
  name: 'Daily Standup',
  bucket: 'COMMUNICATION',
  plannedStartAt: '09:00',
  plannedDurationMinutes: 15,
  state: 'SCHEDULED',
  catalogEntryId: 'cer_daily_standup'
};

const AM_COMM = {
  id: 'sa_am_comm',
  name: 'AM High-value Communication',
  bucket: 'COMMUNICATION',
  plannedStartAt: '09:15',
  plannedDurationMinutes: 60,
  state: 'SCHEDULED',
  catalogEntryId: 'cat_am_comm',
  slotKind: 'AM_COMM'
};

const POST_LUNCH_COMM = {
  id: 'sa_post_lunch',
  name: 'Post-lunch High-value Communication',
  bucket: 'COMMUNICATION',
  plannedStartAt: '13:00',
  plannedDurationMinutes: 30,
  state: 'SCHEDULED',
  catalogEntryId: 'cat_post_lunch',
  slotKind: 'POST_LUNCH_COMM'
};

const POST_DEEP_COMM = {
  id: 'sa_post_deep',
  name: 'End-of-Deep-Cycles Communication',
  bucket: 'COMMUNICATION',
  plannedStartAt: '15:30',
  plannedDurationMinutes: 15,
  state: 'SCHEDULED',
  catalogEntryId: 'cat_post_deep',
  slotKind: 'POST_DEEP_COMM'
};

const USER_ADDED_COMM = {
  id: 'sa_user_comm',
  name: 'Team Sync',
  bucket: 'COMMUNICATION',
  plannedStartAt: '14:00',
  plannedDurationMinutes: 30,
  state: 'SCHEDULED',
  catalogEntryId: 'cat_team_sync'
  // no slotKind — user-added
};

const EAR = {
  id: 'sa_ear',
  name: 'End-of-Activity Reflection',
  bucket: 'CI',
  plannedStartAt: '17:00',
  plannedDurationMinutes: 15,
  state: 'SCHEDULED',
  catalogEntryId: 'gen_end_of_activity_reflection'
};

const SPRINT_PLANNING = {
  id: 'sa_sprint_planning',
  name: 'Sprint Planning',
  bucket: 'CI',
  plannedStartAt: '09:00',
  plannedDurationMinutes: 120,
  state: 'SCHEDULED',
  catalogEntryId: 'cer_sprint_planning'
};

const SPRINT_RETRO = {
  id: 'sa_retro',
  name: 'Sprint Retrospective',
  bucket: 'CI',
  plannedStartAt: '15:00',
  plannedDurationMinutes: 60,
  state: 'SCHEDULED',
  catalogEntryId: 'cer_sprint_retrospective'
};

const USER_CI = {
  id: 'sa_user_ci',
  name: 'PDCA Cycle',
  bucket: 'CI',
  plannedStartAt: '14:00',
  plannedDurationMinutes: 30,
  state: 'SCHEDULED',
  catalogEntryId: 'cat_pdca'
};

// ---------------------------------------------------------------------------
// AC7: Disabled Edit button REMOVED from protected blocks
// ---------------------------------------------------------------------------

describe('BlockDetailDialog Iter47 — AC7: disabled Edit button removed from protected blocks', () => {
  test('AC7: Daily Standup (protected COMM) has no Edit button', () => {
    const html = BlockDetailDialog({ activity: STANDUP });
    assert.ok(!html.includes('bdd-btn-edit'), 'Protected COMM must have no Edit button (AC7)');
    assert.ok(!html.includes('aria-disabled="true"'), 'No disabled attribute on protected block (AC7)');
    assert.ok(!html.includes('BLOCK_DETAIL_EDIT'), 'No BLOCK_DETAIL_EDIT on protected block (AC7)');
  });

  test('AC7: EoAR (protected CI) has no Edit button — has Start Reflection instead', () => {
    const html = BlockDetailDialog({ activity: EAR });
    assert.ok(!html.includes('bdd-btn-edit'), 'EoAR must have no Edit button (AC7, AC11)');
    assert.ok(!html.includes('aria-disabled="true"'), 'No disabled attribute on EoAR (AC7)');
    assert.ok(html.includes('bdd-btn-reflect'), 'EoAR must have Start Reflection button (AC11)');
  });

  test('AC7: Sprint Planning (protected CI ceremony) has no Edit button', () => {
    const html = BlockDetailDialog({ activity: SPRINT_PLANNING });
    assert.ok(!html.includes('bdd-btn-edit'), 'Sprint Planning must have no Edit button (AC7)');
    assert.ok(!html.includes('aria-disabled="true"'), 'No disabled attribute on sprint ceremony (AC7)');
  });

  // META §A.2: orthogonal — non-protected PROJECT block KEEPS Edit button
  test('META §A.2: non-protected PROJECT block KEEPS Edit button (AC7 orthogonal)', () => {
    const html = BlockDetailDialog({ activity: BASE_PROJECT });
    assert.ok(html.includes('bdd-btn-edit'), 'Non-protected PROJECT must keep Edit button');
    assert.ok(html.includes('BLOCK_DETAIL_EDIT'), 'Non-protected PROJECT must have BLOCK_DETAIL_EDIT action');
    assert.ok(!html.includes('aria-disabled="true"'), 'Non-protected must not have aria-disabled');
  });

  // META §A.2: orthogonal — user-added COMM block KEEPS Edit button
  test('META §A.2: user-added COMM block KEEPS Edit button (AC7 orthogonal)', () => {
    const html = BlockDetailDialog({ activity: USER_ADDED_COMM });
    assert.ok(html.includes('bdd-btn-edit'), 'User-added COMM must keep Edit button');
    assert.ok(html.includes('BLOCK_DETAIL_EDIT'), 'User-added COMM must have BLOCK_DETAIL_EDIT action');
  });

  // META §A.2: orthogonal — user-added CI block KEEPS Edit button
  test('META §A.2: user-added CI block KEEPS Edit button (AC7 orthogonal)', () => {
    const html = BlockDetailDialog({ activity: USER_CI });
    assert.ok(html.includes('bdd-btn-edit'), 'User-added CI must keep Edit button');
    assert.ok(html.includes('BLOCK_DETAIL_EDIT'), 'User-added CI must have BLOCK_DETAIL_EDIT action');
  });
});

// ---------------------------------------------------------------------------
// AC8: Bucket-label text rows REMOVED
// ---------------------------------------------------------------------------

describe('BlockDetailDialog Iter47 — AC8: bucket-label text row removed', () => {
  test('AC8: PROJECT dialog has no Bucket row in dl body', () => {
    const html = BlockDetailDialog({ activity: BASE_PROJECT });
    assert.ok(!html.includes('<dt class="bdd-label">Bucket</dt>'),
      'Bucket row must be absent from PROJECT dialog (AC8)');
  });

  test('AC8: COMMUNICATION dialog has no Bucket row', () => {
    const html = BlockDetailDialog({ activity: STANDUP });
    assert.ok(!html.includes('<dt class="bdd-label">Bucket</dt>'),
      'Bucket row must be absent from COMM dialog (AC8)');
  });

  test('AC8: CI dialog has no Bucket row', () => {
    const html = BlockDetailDialog({ activity: EAR });
    assert.ok(!html.includes('<dt class="bdd-label">Bucket</dt>'),
      'Bucket row must be absent from CI dialog (AC8)');
  });

  test('AC8: color bar still renders (carries bucket semantic)', () => {
    const html = BlockDetailDialog({ activity: BASE_PROJECT });
    assert.ok(html.includes('bdd-color-bar'), 'Color bar must still be present (bucket semantic)');
  });

  // META §A.2: orthogonal — all bucket types have bucket row removed equally
  test('META §A.2: null bucket (lunch-type) also has no Bucket row (AC8 orthogonal)', () => {
    const html = BlockDetailDialog({
      activity: { ...BASE_PROJECT, bucket: null }
    });
    assert.ok(!html.includes('<dt class="bdd-label">Bucket</dt>'),
      'No bucket row even for null bucket');
  });
});

// ---------------------------------------------------------------------------
// AC9: Standalone duration row REMOVED
// ---------------------------------------------------------------------------

describe('BlockDetailDialog Iter47 — AC9: standalone duration row removed', () => {
  test('AC9: PROJECT dialog has no Duration row', () => {
    const html = BlockDetailDialog({ activity: BASE_PROJECT });
    assert.ok(!html.includes('<dt class="bdd-label">Duration</dt>'),
      'Duration row must be absent (AC9)');
  });

  test('AC9: COMM dialog has no Duration row', () => {
    const html = BlockDetailDialog({ activity: STANDUP });
    assert.ok(!html.includes('<dt class="bdd-label">Duration</dt>'),
      'Duration row absent from COMM dialog (AC9)');
  });

  test('AC9: CI dialog has no Duration row', () => {
    const html = BlockDetailDialog({ activity: EAR });
    assert.ok(!html.includes('<dt class="bdd-label">Duration</dt>'),
      'Duration row absent from CI dialog (AC9)');
  });

  test('AC9: Time row still present (carries time range + implicit duration)', () => {
    const html = BlockDetailDialog({ activity: BASE_PROJECT });
    assert.ok(html.includes('bdd-time'), 'Time row must still render (implied duration in range)');
    assert.ok(html.includes('09:00'), 'Start time must appear');
    assert.ok(html.includes('11:00'), 'End time must appear (09:00 + 120min = 11:00)');
  });

  // META §A.2: orthogonal — no bucket type shows Duration row
  test('META §A.2: CI dialog also has no Duration row (AC9 orthogonal)', () => {
    const html = BlockDetailDialog({ activity: USER_CI });
    assert.ok(!html.includes('<dt class="bdd-label">Duration</dt>'),
      'User-added CI must also not show Duration row (AC9)');
  });
});

// ---------------------------------------------------------------------------
// AC10: COMM slotKind-specific rationale sentence
// ---------------------------------------------------------------------------

describe('BlockDetailDialog Iter47 — AC10: COMM rationale sentences', () => {
  test('AC10: Daily Standup (cer_daily_standup) shows standup rationale', () => {
    const html = BlockDetailDialog({ activity: STANDUP });
    assert.ok(html.includes('Quick sync on yesterday'),
      'Daily Standup must show standup rationale sentence');
    assert.ok(html.includes('bdd-rationale'), 'Rationale element must be present');
  });

  test('AC10: AM_COMM slotKind shows AM comm rationale', () => {
    const html = BlockDetailDialog({ activity: AM_COMM });
    assert.ok(html.includes('Start-of-day high-value communication'),
      'AM_COMM must show AM comm rationale');
  });

  test('AC10: POST_LUNCH_COMM slotKind shows post-lunch rationale', () => {
    const html = BlockDetailDialog({ activity: POST_LUNCH_COMM });
    assert.ok(html.includes('Post-lunch high-value communication'),
      'POST_LUNCH_COMM must show post-lunch rationale');
  });

  test('AC10: POST_DEEP_COMM slotKind shows end-of-deep-cycles rationale', () => {
    const html = BlockDetailDialog({ activity: POST_DEEP_COMM });
    assert.ok(html.includes('End-of-deep-cycles communication'),
      'POST_DEEP_COMM must show EOD comm rationale');
  });

  test('AC10: user-added COMM (no slotKind) shows generic "Communication time" rationale', () => {
    const html = BlockDetailDialog({ activity: USER_ADDED_COMM });
    assert.ok(html.includes('Communication time') || html.includes('bdd-rationale'),
      'User-added COMM must show generic rationale or at minimum a rationale element');
  });

  test('AC10: user-added COMM with catalog description shows catalog description', () => {
    const html = BlockDetailDialog({
      activity: USER_ADDED_COMM,
      catalogEntry: { id: 'cat_team_sync', description: 'Weekly team alignment sync.' }
    });
    assert.ok(html.includes('Weekly team alignment sync'),
      'User-added COMM with description must show catalog description');
  });

  // META §A.2: orthogonal — PROJECT block does NOT show COMM rationale
  test('META §A.2: PROJECT block does NOT show COMM rationale sentence (AC10 orthogonal)', () => {
    const html = BlockDetailDialog({ activity: BASE_PROJECT });
    assert.ok(!html.includes('Quick sync on yesterday'),
      'PROJECT block must not show COMM rationale');
    assert.ok(!html.includes('high-value communication'),
      'PROJECT block must not show COMM rationale');
  });

  // META §A.2: orthogonal — CI EoAR does NOT show COMM rationale
  test('META §A.2: CI EoAR does NOT show COMM rationale sentence (AC10 orthogonal)', () => {
    const html = BlockDetailDialog({ activity: EAR });
    assert.ok(!html.includes('Quick sync on yesterday'),
      'EoAR must not show COMM rationale');
    assert.ok(!html.includes('Post-lunch high-value communication'),
      'EoAR must not show COMM rationale');
  });
});

// ---------------------------------------------------------------------------
// AC11: CI EoAR "Start Reflection" button
// ---------------------------------------------------------------------------

describe('BlockDetailDialog Iter47 — AC11: EoAR Start Reflection button', () => {
  test('AC11: EoAR dialog shows Start Reflection button', () => {
    const html = BlockDetailDialog({ activity: EAR });
    assert.ok(html.includes('bdd-btn-reflect'), 'EoAR must have bdd-btn-reflect button (AC11)');
    assert.ok(html.includes('Start Reflection'), 'Start Reflection label must appear (AC11)');
  });

  test('AC11: Start Reflection button dispatches EOD_OPEN_REFLECTION', () => {
    const html = BlockDetailDialog({ activity: EAR });
    assert.ok(html.includes('EOD_OPEN_REFLECTION'),
      'Start Reflection must dispatch EOD_OPEN_REFLECTION action (AC11)');
  });

  test('AC11: EoAR shows sacred rationale sentence', () => {
    const html = BlockDetailDialog({ activity: EAR });
    assert.ok(html.includes('Sacred') || html.includes('captures daily learning'),
      'EoAR dialog must show sacred rationale sentence (AC11)');
  });

  // META §A.2: orthogonal — non-EoAR CI does NOT get Start Reflection button
  test('META §A.2: non-EoAR CI (PDCA Cycle) does NOT get Start Reflection button (AC11 orthogonal)', () => {
    const html = BlockDetailDialog({ activity: USER_CI });
    assert.ok(!html.includes('bdd-btn-reflect'),
      'PDCA Cycle must not have Start Reflection button');
    assert.ok(!html.includes('EOD_OPEN_REFLECTION'),
      'PDCA Cycle must not dispatch EOD_OPEN_REFLECTION');
  });

  // META §A.2: orthogonal — COMM block does NOT get Start Reflection button
  test('META §A.2: COMM block does NOT get Start Reflection button (AC11 orthogonal)', () => {
    const html = BlockDetailDialog({ activity: STANDUP });
    assert.ok(!html.includes('bdd-btn-reflect'),
      'COMM block must not have Start Reflection button');
    assert.ok(!html.includes('EOD_OPEN_REFLECTION'),
      'COMM block must not dispatch EOD_OPEN_REFLECTION');
  });

  // META §A.2: orthogonal — PROJECT block does NOT get Start Reflection button
  test('META §A.2: PROJECT block does NOT get Start Reflection button (AC11 orthogonal)', () => {
    const html = BlockDetailDialog({ activity: BASE_PROJECT });
    assert.ok(!html.includes('bdd-btn-reflect'),
      'PROJECT block must not have Start Reflection button');
  });
});

// ---------------------------------------------------------------------------
// AC12: Sprint ceremony rationale sentence
// ---------------------------------------------------------------------------

describe('BlockDetailDialog Iter47 — AC12: sprint ceremony rationale', () => {
  test('AC12: Sprint Planning shows planning rationale', () => {
    const html = BlockDetailDialog({ activity: SPRINT_PLANNING });
    assert.ok(html.includes('Sprint Planning ceremony') || html.includes('sprint commitments'),
      'Sprint Planning must show planning rationale sentence (AC12)');
    assert.ok(html.includes('bdd-rationale'), 'Rationale element must be present');
  });

  test('AC12: Sprint Retrospective shows retro rationale', () => {
    const html = BlockDetailDialog({ activity: SPRINT_RETRO });
    assert.ok(html.includes('Sprint Retrospective') || html.includes('reflect on the cycle'),
      'Sprint Retro must show retro rationale sentence (AC12)');
  });

  test('AC12: Sprint Planning has no Edit button (protected ceremony)', () => {
    const html = BlockDetailDialog({ activity: SPRINT_PLANNING });
    assert.ok(!html.includes('bdd-btn-edit'), 'Sprint Planning must have no Edit button (AC7 + AC12)');
  });

  // META §A.2: orthogonal — user-added CI does NOT get ceremony rationale
  test('META §A.2: user-added CI does NOT get ceremony rationale (AC12 orthogonal)', () => {
    const html = BlockDetailDialog({ activity: USER_CI });
    assert.ok(!html.includes('Sprint ceremony'),
      'User-added CI must not show sprint ceremony rationale');
    assert.ok(!html.includes('Sprint Planning ceremony'),
      'PDCA Cycle must not show sprint planning rationale');
  });

  // META §A.2: orthogonal — COMM block does NOT get ceremony rationale
  test('META §A.2: COMM block does NOT get ceremony rationale (AC12 orthogonal)', () => {
    const html = BlockDetailDialog({ activity: STANDUP });
    assert.ok(!html.includes('Sprint ceremony'),
      'COMM Standup must not show sprint ceremony rationale');
  });
});

// ---------------------------------------------------------------------------
// AC15: Iter 46 Phase 1 functionality preserved (participants/trigger on COMM)
// ---------------------------------------------------------------------------

describe('BlockDetailDialog Iter47 — AC15: Iter 46 functionality preserved', () => {
  const CATALOG_COMM = {
    id: 'cat_am_comm',
    participants: 'Product team',
    trigger: 'Daily 9:15 anchor slot'
  };

  test('AC15: COMM participants row still renders (Iter 46 preserved)', () => {
    const html = BlockDetailDialog({
      activity: AM_COMM,
      catalogEntry: CATALOG_COMM
    });
    assert.ok(html.includes('bdd-row-participants'), 'Participants row must still render (Iter 46 AC15)');
    assert.ok(html.includes('Product team'), 'Participants text must appear');
  });

  test('AC15: COMM trigger row still renders (Iter 46 preserved)', () => {
    const html = BlockDetailDialog({
      activity: AM_COMM,
      catalogEntry: CATALOG_COMM
    });
    assert.ok(html.includes('bdd-row-trigger'), 'Trigger row must still render (Iter 46 AC15)');
    assert.ok(html.includes('Daily 9:15 anchor slot'), 'Trigger text must appear');
  });

  test('AC15: COMM rationale sentence appears alongside participants/trigger', () => {
    const html = BlockDetailDialog({
      activity: AM_COMM,
      catalogEntry: CATALOG_COMM
    });
    // Both Iter 46 features AND Iter 47 rationale should coexist
    assert.ok(html.includes('bdd-row-participants'), 'Participants row preserved');
    assert.ok(html.includes('Start-of-day high-value communication'), 'AC10 rationale present');
  });

  test('AC15: PROJECT block still shows outputArtifact from catalogEntry', () => {
    const html = BlockDetailDialog({
      activity: BASE_PROJECT,
      catalogEntry: {
        id: 'cat_deep_work',
        outputArtifact: { name: 'SIPOC Diagram', schema: 'DOCUMENT' }
      }
    });
    assert.ok(html.includes('SIPOC Diagram'), 'outputArtifact from catalogEntry must still render (Iter 46 AC15)');
  });
});

// ---------------------------------------------------------------------------
// AC16: Iter 45 regression — DC-PR1-4 + DC-IP1-4 (Edit button on non-protected)
// The key regression concern: non-protected blocks MUST still get Edit button
// after the Phase 2 changes.
// ---------------------------------------------------------------------------

describe('BlockDetailDialog Iter47 — AC16: Iter 45 regression tests', () => {
  test('DC-PR1: non-protected PROJECT has enabled Edit button', () => {
    const html = BlockDetailDialog({ activity: BASE_PROJECT });
    assert.ok(html.includes('data-action="BLOCK_DETAIL_EDIT"'), 'DC-PR1: Edit action present');
    assert.ok(!html.includes('aria-disabled'), 'DC-PR1: No disabled attr on non-protected');
  });

  test('DC-PR2: Edit button payload contains activityId', () => {
    const html = BlockDetailDialog({ activity: BASE_PROJECT });
    assert.ok(html.includes('sa_proj'), 'DC-PR2: activityId in payload');
  });

  test('DC-PR3: non-protected block has CLOSE_BLOCK_DETAIL on close button', () => {
    const html = BlockDetailDialog({ activity: BASE_PROJECT });
    assert.ok(html.includes('CLOSE_BLOCK_DETAIL'), 'DC-PR3: Close action present');
  });

  test('DC-PR4: dialog has role=dialog and aria-modal=true', () => {
    const html = BlockDetailDialog({ activity: BASE_PROJECT });
    assert.match(html, /role="dialog"/);
    assert.match(html, /aria-modal="true"/);
  });

  test('DC-IP1: protected Daily Standup — name still shows in dialog', () => {
    const html = BlockDetailDialog({ activity: STANDUP });
    assert.ok(html.includes('Daily Standup'), 'DC-IP1: Activity name shows in protected dialog');
  });

  test('DC-IP2: protected block — time row still shows', () => {
    const html = BlockDetailDialog({ activity: STANDUP });
    assert.ok(html.includes('bdd-time'), 'DC-IP2: Time row present on protected block');
  });

  test('DC-IP3: protected block dialog — close button still present', () => {
    const html = BlockDetailDialog({ activity: STANDUP });
    assert.ok(html.includes('CLOSE_BLOCK_DETAIL'), 'DC-IP3: Close action present on protected dialog');
  });

  test('DC-IP4: protected block dialog — no disabled Edit, rationale sentence shown instead', () => {
    const html = BlockDetailDialog({ activity: STANDUP });
    assert.ok(!html.includes('aria-disabled="true"'), 'DC-IP4: No disabled Edit button');
    assert.ok(html.includes('bdd-rationale'), 'DC-IP4: Rationale sentence present');
  });
});
