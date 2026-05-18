/**
 * Tests for BlockDetailDialog (Iter 30).
 *
 * Min 10 tests covering all ACs for the popover render layer.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { BlockDetailDialog } from '../../../js/ui/components/BlockDetailDialog.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const BASE_ACTIVITY = {
  id: 'sa_focus_block',
  name: 'Deep Work Session',
  bucket: 'PROJECT',
  plannedStartAt: '09:00',
  plannedDurationMinutes: 120,
  state: 'SCHEDULED',
  catalogEntryId: 'cat_deep_work'
};

const PROTECTED_ACTIVITY = {
  id: 'sa_standup',
  name: 'Daily Standup',
  bucket: 'COMMUNICATION',
  plannedStartAt: '09:00',
  plannedDurationMinutes: 15,
  state: 'SCHEDULED',
  catalogEntryId: 'cer_daily_standup'
};

const OUTPUT_ARTIFACT = {
  name: 'Pull Request',
  schema: 'TEXT',
  kind: 'pr'
};

// ---------------------------------------------------------------------------
// Render: activity name
// ---------------------------------------------------------------------------

describe('BlockDetailDialog — activity name', () => {
  test('renders the activity name in a heading', () => {
    const html = BlockDetailDialog({ activity: BASE_ACTIVITY });
    assert.match(html, /Deep Work Session/);
  });

  test('heading has id="bdd-title" for aria-labelledby', () => {
    const html = BlockDetailDialog({ activity: BASE_ACTIVITY });
    assert.match(html, /id="bdd-title"/);
    assert.match(html, /class="bdd-title"/);
  });
});

// ---------------------------------------------------------------------------
// Render: time range
// ---------------------------------------------------------------------------

describe('BlockDetailDialog — time range', () => {
  test('renders the time range (HH:MM–HH:MM format)', () => {
    const html = BlockDetailDialog({ activity: BASE_ACTIVITY });
    // 09:00 + 120 min = 11:00
    assert.match(html, /09:00/);
    assert.match(html, /11:00/);
  });

  test('renders — when no plannedStartAt', () => {
    const html = BlockDetailDialog({
      activity: { ...BASE_ACTIVITY, plannedStartAt: undefined }
    });
    // Time row still present but shows em dash
    assert.match(html, /bdd-time/);
    assert.match(html, /—/);
  });
});

// ---------------------------------------------------------------------------
// Render: bucket chip
// Iter 47 Phase 2 AC8: Bucket-label text rows REMOVED from dialog.
// The color bar accent at the top carries the semantic; text chip is gone.
// ---------------------------------------------------------------------------

describe('BlockDetailDialog — bucket chip (Phase 2: bucket-label text row removed)', () => {
  test('AC8: dialog does NOT render bucket-label text chip for PROJECT', () => {
    const html = BlockDetailDialog({ activity: BASE_ACTIVITY });
    // The color bar class still uses chip-project in its own class name,
    // but the standalone bucket-label chip row is gone.
    // We verify the dl/bdd-body does not contain a "Bucket" label row.
    assert.ok(!html.includes('<dt class="bdd-label">Bucket</dt>'), 'Bucket label row must be absent (AC8)');
  });

  test('AC8: dialog does NOT render bucket-label text chip for COMMUNICATION', () => {
    const html = BlockDetailDialog({ activity: PROTECTED_ACTIVITY });
    assert.ok(!html.includes('<dt class="bdd-label">Bucket</dt>'), 'Bucket label row must be absent for COMMUNICATION (AC8)');
  });

  test('AC8: color bar still renders for PROJECT (carries semantic via class)', () => {
    const html = BlockDetailDialog({ activity: BASE_ACTIVITY });
    // Color bar class uses bdd-color-bar-project — confirms bucket color still present
    assert.ok(html.includes('bdd-color-bar'), 'Color bar must still render (carries bucket semantic)');
  });
});

// ---------------------------------------------------------------------------
// Render: protected block — Edit button behavior
// Iter 47 Phase 2 AC7: Disabled Edit button REMOVED from protected blocks.
// Dialog still shows all info; just no Edit button at all.
// ---------------------------------------------------------------------------

describe('BlockDetailDialog — protected block treatment (Phase 2: disabled Edit removed)', () => {
  test('AC7: protected block does NOT render a disabled Edit button', () => {
    const html = BlockDetailDialog({ activity: PROTECTED_ACTIVITY });
    // The disabled Edit button is completely removed (AC7).
    assert.ok(!html.includes('aria-disabled="true"'), 'Disabled Edit button must be absent (AC7)');
    assert.ok(!html.includes('bdd-btn-edit'), 'bdd-btn-edit must be absent on protected blocks (AC7)');
  });

  test('AC7: protected block does NOT have BLOCK_DETAIL_EDIT action', () => {
    const html = BlockDetailDialog({ activity: PROTECTED_ACTIVITY });
    assert.ok(
      !html.includes('data-action="BLOCK_DETAIL_EDIT"'),
      'Protected block must not carry BLOCK_DETAIL_EDIT action (AC7)'
    );
  });

  test('AC7: protected block dialog still shows name, time, and close button', () => {
    const html = BlockDetailDialog({ activity: PROTECTED_ACTIVITY });
    // Dialog still shows all the info — just no Edit button.
    assert.match(html, /Daily Standup/);
    assert.match(html, /CLOSE_BLOCK_DETAIL/);
    assert.match(html, /bdd-title/);
  });
});

// ---------------------------------------------------------------------------
// Render: non-protected block — Edit button active
// ---------------------------------------------------------------------------

describe('BlockDetailDialog — non-protected block Edit button', () => {
  test('non-protected block shows enabled Edit button with BLOCK_DETAIL_EDIT action', () => {
    const html = BlockDetailDialog({ activity: BASE_ACTIVITY });
    assert.match(html, /data-action="BLOCK_DETAIL_EDIT"/);
    assert.ok(!html.includes('aria-disabled="true"'), 'enabled edit must not have aria-disabled');
  });

  test('Edit button payload includes activityId', () => {
    const html = BlockDetailDialog({ activity: BASE_ACTIVITY });
    assert.match(html, /sa_focus_block/);
    // data-payload should contain the activityId
    const payloadMatch = html.match(/data-action="BLOCK_DETAIL_EDIT"[^>]*data-payload='([^']+)'/s) ??
                         html.match(/data-payload='([^']+)'[^>]*data-action="BLOCK_DETAIL_EDIT"/s);
    assert.ok(payloadMatch, 'Edit button must have data-payload');
    const payload = JSON.parse(payloadMatch[1].replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"'));
    assert.equal(payload.activityId, 'sa_focus_block');
  });
});

// ---------------------------------------------------------------------------
// Render: Close button
// ---------------------------------------------------------------------------

describe('BlockDetailDialog — Close button', () => {
  test('Close button dispatches CLOSE_BLOCK_DETAIL', () => {
    const html = BlockDetailDialog({ activity: BASE_ACTIVITY });
    assert.match(html, /data-action="CLOSE_BLOCK_DETAIL"/);
  });
});

// ---------------------------------------------------------------------------
// Render: linked Kaizen chip
// ---------------------------------------------------------------------------

describe('BlockDetailDialog — linked kaizen chip', () => {
  test('renders kaizen title chip when kaizenTitle is provided', () => {
    const html = BlockDetailDialog({
      activity: { ...BASE_ACTIVITY, linkedKaizenId: 'k_1' },
      kaizenTitle: 'Ship CadencePlan MVP'
    });
    assert.match(html, /Ship CadencePlan MVP/);
    assert.match(html, /bdd-kaizen-chip/);
  });

  test('does NOT render kaizen row when kaizenTitle is null', () => {
    const html = BlockDetailDialog({ activity: BASE_ACTIVITY, kaizenTitle: null });
    assert.ok(!html.includes('bdd-kaizen-chip'), 'kaizen chip must be absent when no kaizen');
    assert.ok(!html.includes('bdd-row-kaizen'), 'kaizen row must be absent when no kaizen');
  });
});

// ---------------------------------------------------------------------------
// Render: outputArtifact
// Iter 47 Phase 2: output row shown when outputName present; OMITTED when null.
// No "—" shown for null — we simply omit the row entirely (cleaner UX).
// ---------------------------------------------------------------------------

describe('BlockDetailDialog — outputArtifact (Phase 2: row omitted when null)', () => {
  test('renders output artifact name when provided', () => {
    const html = BlockDetailDialog({
      activity: BASE_ACTIVITY,
      outputArtifact: OUTPUT_ARTIFACT
    });
    assert.match(html, /Pull Request/);
    assert.ok(html.includes('bdd-output'), 'bdd-output element must be present when artifact exists');
  });

  test('Phase 2: output row OMITTED (not shown as em dash) when outputArtifact is null', () => {
    const html = BlockDetailDialog({ activity: BASE_ACTIVITY, outputArtifact: null });
    // Row is omitted when there is no artifact — no "—" fallback.
    assert.ok(!html.includes('bdd-output'), 'bdd-output element must be absent when outputArtifact is null (Phase 2)');
  });

  test('Phase 2: output row OMITTED when outputArtifact is undefined', () => {
    const html = BlockDetailDialog({ activity: BASE_ACTIVITY });
    // Row absent — not showing a useless "—".
    assert.ok(!html.includes('bdd-output'), 'bdd-output element must be absent when no outputArtifact (Phase 2)');
  });
});

// ---------------------------------------------------------------------------
// ARIA attributes
// ---------------------------------------------------------------------------

describe('BlockDetailDialog — ARIA attributes', () => {
  test('root section has role="dialog"', () => {
    const html = BlockDetailDialog({ activity: BASE_ACTIVITY });
    assert.match(html, /role="dialog"/);
  });

  test('root section has aria-modal="true"', () => {
    const html = BlockDetailDialog({ activity: BASE_ACTIVITY });
    assert.match(html, /aria-modal="true"/);
  });

  test('root section has aria-labelledby="bdd-title"', () => {
    const html = BlockDetailDialog({ activity: BASE_ACTIVITY });
    assert.match(html, /aria-labelledby="bdd-title"/);
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('BlockDetailDialog — edge cases', () => {
  test('returns empty string when activity is null', () => {
    const html = BlockDetailDialog({ activity: null });
    assert.equal(html, '');
  });

  test('returns empty string when no props', () => {
    const html = BlockDetailDialog();
    assert.equal(html, '');
  });

  test('falls back to catalogEntryId when name is absent', () => {
    const html = BlockDetailDialog({
      activity: { ...BASE_ACTIVITY, name: undefined, catalogEntryId: 'cat_entry_xyz' }
    });
    assert.match(html, /cat_entry_xyz/);
  });

  test('Phase 2 AC9: standalone Duration row REMOVED — only Time row remains', () => {
    const html = BlockDetailDialog({
      activity: { ...BASE_ACTIVITY, plannedDurationMinutes: 0 }
    });
    // Duration row is removed (AC9). The time range still exists.
    assert.ok(!html.includes('<dt class="bdd-label">Duration</dt>'), 'Duration row must be absent (AC9)');
    assert.ok(html.includes('bdd-time'), 'Time row must still be present');
  });
});

// ---------------------------------------------------------------------------
// Iter 46 Phase 1 — AC5: full catalogEntry prop threading
// ---------------------------------------------------------------------------
describe('BlockDetailDialog — Iter 46 full catalogEntry prop (AC5)', () => {
  const CATALOG_ENTRY_WITH_ARTIFACT = {
    id: 'cat_deep_work',
    outputArtifact: { name: 'SIPOC Diagram', schema: 'DOCUMENT' },
    participants: 'Team lead + engineer',
    trigger: 'Sprint kickoff'
  };

  test('AC5: catalogEntry.outputArtifact.name takes precedence over outputArtifact prop', () => {
    const html = BlockDetailDialog({
      activity: BASE_ACTIVITY,
      catalogEntry: CATALOG_ENTRY_WITH_ARTIFACT,
      outputArtifact: { name: 'OLD Artifact' }   // should be ignored in favor of catalogEntry
    });
    assert.match(html, /SIPOC Diagram/);
    assert.ok(!html.includes('OLD Artifact'), 'catalogEntry.outputArtifact must override separate outputArtifact prop');
  });

  test('AC5: catalogEntry null falls back to outputArtifact prop', () => {
    const html = BlockDetailDialog({
      activity: BASE_ACTIVITY,
      catalogEntry: null,
      outputArtifact: OUTPUT_ARTIFACT
    });
    assert.match(html, /Pull Request/);
  });
});

// ---------------------------------------------------------------------------
// Iter 46 Phase 1 — AC6–AC8: COMMUNICATION participants + trigger rows
// ---------------------------------------------------------------------------
describe('BlockDetailDialog — Iter 46 COMMUNICATION participants + trigger (AC6–AC8)', () => {
  const COMM_ACTIVITY = {
    id: 'sa_am_comm',
    name: 'AM Communication',
    bucket: 'COMMUNICATION',
    plannedStartAt: '09:15',
    plannedDurationMinutes: 60,
    state: 'SCHEDULED',
    catalogEntryId: 'cat_am_comm'
  };

  const CATALOG_COMM = {
    id: 'cat_am_comm',
    participants: 'Product team',
    trigger: 'Daily 9:15 anchor slot'
  };

  test('AC6: COMMUNICATION block shows participants row when catalogEntry.participants present', () => {
    const html = BlockDetailDialog({
      activity: COMM_ACTIVITY,
      catalogEntry: CATALOG_COMM
    });
    assert.ok(html.includes('bdd-row-participants'), 'Participants row must be present for COMMUNICATION with participants');
    assert.ok(html.includes('Product team'), 'Participants text must appear in dialog');
  });

  test('AC7: COMMUNICATION block shows trigger row when catalogEntry.trigger present', () => {
    const html = BlockDetailDialog({
      activity: COMM_ACTIVITY,
      catalogEntry: CATALOG_COMM
    });
    assert.ok(html.includes('bdd-row-trigger'), 'Trigger row must be present for COMMUNICATION with trigger');
    assert.ok(html.includes('Daily 9:15 anchor slot'), 'Trigger text must appear in dialog');
  });

  test('AC8: COMMUNICATION block — missing participants field skips that row gracefully', () => {
    const html = BlockDetailDialog({
      activity: COMM_ACTIVITY,
      catalogEntry: { id: 'cat_am_comm', trigger: 'Daily anchor' }
    });
    assert.ok(!html.includes('bdd-row-participants'), 'Participants row must be absent when field is missing');
    assert.ok(html.includes('bdd-row-trigger'), 'Trigger row must still render when present');
  });

  test('AC8: COMMUNICATION block — missing trigger field skips that row gracefully', () => {
    const html = BlockDetailDialog({
      activity: COMM_ACTIVITY,
      catalogEntry: { id: 'cat_am_comm', participants: 'Product team' }
    });
    assert.ok(!html.includes('bdd-row-trigger'), 'Trigger row must be absent when field is missing');
    assert.ok(html.includes('bdd-row-participants'), 'Participants row must still render when present');
  });

  test('AC8: COMMUNICATION block — null catalogEntry renders no participants/trigger rows', () => {
    const html = BlockDetailDialog({
      activity: COMM_ACTIVITY,
      catalogEntry: null
    });
    assert.ok(!html.includes('bdd-row-participants'), 'No participants row when catalogEntry is null');
    assert.ok(!html.includes('bdd-row-trigger'), 'No trigger row when catalogEntry is null');
  });

  test('AC9: PROJECT block does NOT show participants/trigger rows even with catalogEntry', () => {
    const html = BlockDetailDialog({
      activity: BASE_ACTIVITY,  // bucket: PROJECT
      catalogEntry: { id: 'cat_deep', participants: 'Solo', trigger: 'DMAIC step' }
    });
    assert.ok(!html.includes('bdd-row-participants'), 'No participants row on PROJECT bucket');
    assert.ok(!html.includes('bdd-row-trigger'), 'No trigger row on PROJECT bucket');
  });

  test('AC9: CI block does NOT show participants/trigger rows even with catalogEntry', () => {
    const CI_ACTIVITY = {
      id: 'sa_ci',
      name: 'PDCA Cycle',
      bucket: 'CI',
      plannedStartAt: '16:00',
      plannedDurationMinutes: 30,
      state: 'SCHEDULED',
      catalogEntryId: 'cat_pdca'
    };
    const html = BlockDetailDialog({
      activity: CI_ACTIVITY,
      catalogEntry: { id: 'cat_pdca', participants: 'Team', trigger: 'Experiment tick' }
    });
    assert.ok(!html.includes('bdd-row-participants'), 'No participants row on CI bucket');
    assert.ok(!html.includes('bdd-row-trigger'), 'No trigger row on CI bucket');
  });
});
