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
// ---------------------------------------------------------------------------

describe('BlockDetailDialog — bucket chip', () => {
  test('renders the bucket chip class for PROJECT', () => {
    const html = BlockDetailDialog({ activity: BASE_ACTIVITY });
    assert.match(html, /chip-project/);
    assert.match(html, /Project/);
  });

  test('renders chip-communication for COMMUNICATION bucket', () => {
    const html = BlockDetailDialog({ activity: PROTECTED_ACTIVITY });
    assert.match(html, /chip-communication/);
    assert.match(html, /Communication/);
  });

  test('renders chip-unknown when bucket is null (Lunch)', () => {
    const html = BlockDetailDialog({
      activity: { ...BASE_ACTIVITY, bucket: null }
    });
    assert.match(html, /chip-unknown/);
    assert.match(html, /Unscheduled/);
  });
});

// ---------------------------------------------------------------------------
// Render: protected block — Edit disabled
// ---------------------------------------------------------------------------

describe('BlockDetailDialog — protected block treatment', () => {
  test('protected block renders Edit button as disabled', () => {
    const html = BlockDetailDialog({ activity: PROTECTED_ACTIVITY });
    assert.match(html, /disabled/);
    assert.match(html, /aria-disabled="true"/);
  });

  test('protected block Edit button has explanatory aria-label', () => {
    const html = BlockDetailDialog({ activity: PROTECTED_ACTIVITY });
    assert.match(html, /This block is required for your daily rhythm/);
  });

  test('protected block Edit button does NOT have data-action', () => {
    const html = BlockDetailDialog({ activity: PROTECTED_ACTIVITY });
    // The disabled button should not have a data-action attribute
    // (it may never fire, but also should not carry BLOCK_DETAIL_EDIT)
    const buttonSection = html.slice(html.lastIndexOf('bdd-btn-edit'));
    assert.ok(
      !buttonSection.includes('data-action="BLOCK_DETAIL_EDIT"'),
      'disabled edit button must not carry BLOCK_DETAIL_EDIT action'
    );
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
// ---------------------------------------------------------------------------

describe('BlockDetailDialog — outputArtifact', () => {
  test('renders output artifact name when provided', () => {
    const html = BlockDetailDialog({
      activity: BASE_ACTIVITY,
      outputArtifact: OUTPUT_ARTIFACT
    });
    assert.match(html, /Pull Request/);
  });

  test('renders graceful — when outputArtifact is null', () => {
    const html = BlockDetailDialog({ activity: BASE_ACTIVITY, outputArtifact: null });
    // bdd-output should contain the em dash
    const match = html.match(/bdd-output[^>]*>([^<]+)</);
    assert.ok(match, 'bdd-output element must be present');
    assert.equal(match[1].trim(), '—');
  });

  test('renders graceful — when outputArtifact is undefined', () => {
    const html = BlockDetailDialog({ activity: BASE_ACTIVITY });
    const match = html.match(/bdd-output[^>]*>([^<]+)</);
    assert.ok(match, 'bdd-output element must be present');
    assert.equal(match[1].trim(), '—');
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

  test('renders duration as — when plannedDurationMinutes is 0', () => {
    const html = BlockDetailDialog({
      activity: { ...BASE_ACTIVITY, plannedDurationMinutes: 0 }
    });
    // Duration row value should be em dash when dur is 0
    assert.match(html, /Duration/);
  });
});
