/**
 * Tests for ScheduledActivityBlock — pure render.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  ScheduledActivityBlock,
  formatTime
} from '../../../js/ui/components/ScheduledActivityBlock.js';

describe('ScheduledActivityBlock.formatTime', () => {
  test('HH:MM passes through', () => {
    assert.equal(formatTime('09:15'), '09:15');
  });

  test('HH:MM:SS truncates', () => {
    assert.equal(formatTime('09:15:30'), '09:15');
  });

  test('ISO timestamp → HH:MM in UTC', () => {
    assert.equal(formatTime('2026-04-21T09:15:00Z'), '09:15');
  });

  test('empty / null returns empty', () => {
    assert.equal(formatTime(''), '');
    assert.equal(formatTime(null), '');
    assert.equal(formatTime(undefined), '');
  });

  test('invalid ISO returns empty', () => {
    assert.equal(formatTime('not-a-date'), '');
  });
});

describe('ScheduledActivityBlock — structure', () => {
  const baseActivity = {
    id: 'sa_1',
    catalogEntryId: 'cat_12_pdca_cycle',
    name: 'PDCA Cycle',
    bucket: 'CI',
    plannedDurationMinutes: 30,
    plannedStartAt: '10:15',
    state: 'PROPOSED',
    intention: null
  };

  test('missing activity → placeholder LI', () => {
    const html = ScheduledActivityBlock();
    assert.match(html, /sa-missing/);
  });

  test('renders an <li> with sa-block class', () => {
    const html = ScheduledActivityBlock({ activity: baseActivity });
    assert.match(html, /^<li/);
    assert.match(html, /class="sa-block/);
  });

  test('renders planned minutes', () => {
    const html = ScheduledActivityBlock({ activity: baseActivity });
    assert.match(html, />30m</);
  });

  test('renders bucket chip with bucket-specific class', () => {
    const html = ScheduledActivityBlock({ activity: baseActivity });
    assert.match(html, /chip-ci/);
  });

  test('PROJECT bucket uses chip-project class', () => {
    const html = ScheduledActivityBlock({
      activity: { ...baseActivity, bucket: 'PROJECT' }
    });
    assert.match(html, /chip-project/);
  });

  test('COMMUNICATION bucket uses chip-communication class', () => {
    const html = ScheduledActivityBlock({
      activity: { ...baseActivity, bucket: 'COMMUNICATION' }
    });
    assert.match(html, /chip-communication/);
  });

  test('renders the activity name', () => {
    const html = ScheduledActivityBlock({ activity: baseActivity });
    assert.match(html, /PDCA Cycle/);
  });

  test('carries data-activity-id attribute', () => {
    const html = ScheduledActivityBlock({ activity: baseActivity });
    assert.match(html, /data-activity-id="sa_1"/);
  });

  test('carries data-bucket attribute', () => {
    const html = ScheduledActivityBlock({ activity: baseActivity });
    assert.match(html, /data-bucket="CI"/);
  });

  test('renders plannedStartAt as HH:MM', () => {
    const html = ScheduledActivityBlock({ activity: baseActivity });
    assert.match(html, /10:15/);
  });

  test('falls back to anchor when plannedStartAt missing', () => {
    const html = ScheduledActivityBlock({
      activity: { ...baseActivity, plannedStartAt: null, anchor: '13:00' }
    });
    assert.match(html, /13:00/);
  });

  test('Sprint 16a: sa-when shows the HH:MM–HH:MM time range', () => {
    const html = ScheduledActivityBlock({ activity: baseActivity });
    // baseActivity: 10:15 + 30m → 10:15–10:45 (en-dash U+2013).
    const m = html.match(/<div class="sa-when"[^>]*>([\s\S]*?)<\/div>/);
    assert.ok(m, 'sa-when div not found');
    assert.equal(m[1], '10:15\u201310:45');
  });

  test('Sprint 16a: sa-when carries aria-label "starts at HH:MM, N minutes"', () => {
    const html = ScheduledActivityBlock({ activity: baseActivity });
    assert.match(html, /<div class="sa-when" aria-label="starts at 10:15, 30 minutes">/);
  });
});

describe('ScheduledActivityBlock — state variants', () => {
  const baseActivity = {
    id: 'sa_1',
    name: 'Daily Standup',
    bucket: 'COMMUNICATION',
    plannedDurationMinutes: 15,
    plannedStartAt: '09:00'
  };

  // AC-04: .sa-state-label text is removed; state communicated via CSS class
  // on <li> and aria-label only.
  test('PROPOSED state → sa-state-proposed class on <li> (no text label)', () => {
    const html = ScheduledActivityBlock({
      activity: { ...baseActivity, state: 'PROPOSED' }
    });
    assert.match(html, /sa-state-proposed/);
    // State text must NOT appear as visible label content
    assert.ok(!html.includes('sa-state-label'), 'sa-state-label element must be absent');
  });

  test('SCHEDULED state → sa-state-scheduled class on <li> (no text label)', () => {
    const html = ScheduledActivityBlock({
      activity: { ...baseActivity, state: 'SCHEDULED' }
    });
    assert.match(html, /sa-state-scheduled/);
    assert.ok(!html.includes('sa-state-label'), 'sa-state-label element must be absent');
  });

  test('IN_PROGRESS state → sa-state-in_progress class on <li> (no text label)', () => {
    const html = ScheduledActivityBlock({
      activity: { ...baseActivity, state: 'IN_PROGRESS' }
    });
    assert.match(html, /sa-state-in_progress/);
    assert.ok(!html.includes('sa-state-label'), 'sa-state-label element must be absent');
  });

  // AC-05: CLOSED state still readable via CSS class (opacity 0.55 applied by CSS)
  test('CLOSED state → sa-state-closed class on <li>', () => {
    const html = ScheduledActivityBlock({
      activity: { ...baseActivity, state: 'CLOSED' }
    });
    assert.match(html, /sa-state-closed/);
  });

  // AC-06: SKIPPED state still readable via CSS class + skip-reason chip
  test('SKIPPED state → sa-state-skipped class on <li>', () => {
    const html = ScheduledActivityBlock({
      activity: { ...baseActivity, state: 'SKIPPED' }
    });
    assert.match(html, /sa-state-skipped/);
  });
});

describe('ScheduledActivityBlock — Start button (Sprint 5 enabled)', () => {
  const baseActivity = {
    id: 'sa_start_test',
    name: 'Deep Block',
    bucket: 'PROJECT',
    plannedDurationMinutes: 120,
    plannedStartAt: '10:15',
    state: 'SCHEDULED'
  };

  test('showStart=false → no Start button', () => {
    const html = ScheduledActivityBlock({ activity: baseActivity });
    assert.ok(!html.includes('sa-start'));
  });

  test('showStart=true → Start button rendered', () => {
    const html = ScheduledActivityBlock({
      activity: baseActivity,
      showStart: true
    });
    assert.match(html, /<button[^>]*class="sa-start"/);
  });

  test('Start button is NOT disabled (Sprint 5 ships it)', () => {
    const html = ScheduledActivityBlock({
      activity: baseActivity,
      showStart: true
    });
    assert.ok(!/sa-start[^>]*\sdisabled/.test(html));
    assert.ok(!/aria-disabled="true"/.test(html));
  });

  test('Start button has data-action=START_ACTIVITY', () => {
    const html = ScheduledActivityBlock({
      activity: baseActivity,
      showStart: true
    });
    assert.match(html, /data-action="START_ACTIVITY"/);
  });

  test('Start button payload carries the activity id', () => {
    const html = ScheduledActivityBlock({
      activity: baseActivity,
      showStart: true
    });
    assert.match(html, /activityId.*sa_start_test/);
  });

  test('SCHEDULED block renders a Skip button', () => {
    const html = ScheduledActivityBlock({
      activity: baseActivity,
      showStart: true
    });
    assert.match(html, /<button[^>]*class="sa-skip"/);
    assert.match(html, /data-action="OPEN_SKIP_MODAL"/);
  });

  test('Skip button payload carries the activity id', () => {
    const html = ScheduledActivityBlock({
      activity: baseActivity,
      showStart: true
    });
    assert.match(html, /sa-skip[^>]*activityId.*sa_start_test/);
  });
});

describe('ScheduledActivityBlock — IN_PROGRESS variant', () => {
  const baseActivity = {
    id: 'sa_running',
    name: 'Deep Block',
    bucket: 'PROJECT',
    plannedDurationMinutes: 120,
    plannedStartAt: '10:15',
    state: 'IN_PROGRESS',
    actualStartAt: '2026-04-21T10:15:00Z'
  };

  test('renders a Close button (no Start)', () => {
    const html = ScheduledActivityBlock({
      activity: baseActivity,
      showStart: true,
      nowIso: '2026-04-21T11:00:00Z'
    });
    assert.match(html, /<button[^>]*class="sa-close"/);
    assert.ok(!/class="sa-start"/.test(html));
  });

  test('Close button uses data-action=OPEN_CLOSE_DIALOG', () => {
    const html = ScheduledActivityBlock({
      activity: baseActivity,
      showStart: true,
      nowIso: '2026-04-21T11:00:00Z'
    });
    assert.match(html, /data-action="OPEN_CLOSE_DIALOG"/);
  });

  test('renders the elapsed-minute readout', () => {
    const html = ScheduledActivityBlock({
      activity: baseActivity,
      showStart: true,
      nowIso: '2026-04-21T11:00:00Z'
    });
    assert.match(html, /45m elapsed/);
  });

  test('elapsed of 0 when nowIso missing', () => {
    const html = ScheduledActivityBlock({
      activity: baseActivity,
      showStart: true
    });
    assert.match(html, /0m elapsed/);
  });
});

describe('ScheduledActivityBlock — SKIPPED variant', () => {
  test('renders the reason code label', () => {
    const html = ScheduledActivityBlock({
      activity: {
        id: 'sa_s',
        name: 'Standup',
        bucket: 'COMMUNICATION',
        plannedDurationMinutes: 15,
        plannedStartAt: '09:00',
        state: 'SKIPPED',
        reasonCodeIfSkipped: 'MEETING_CONFLICT'
      }
    });
    assert.match(html, /sa-skip-reason/);
    assert.match(html, /MEETING_CONFLICT/);
  });
});

describe('ScheduledActivityBlock — why chip', () => {
  test('renders the why-chip when composition PROPOSED + explain provided', () => {
    const html = ScheduledActivityBlock({
      activity: {
        id: 'sa_why',
        name: 'PDCA',
        bucket: 'CI',
        plannedDurationMinutes: 30,
        state: 'PROPOSED'
      },
      compositionState: 'PROPOSED',
      explainEntry: { ref: 'cat_12_pdca_cycle', rule: 'R5_CI_ROTATION', detail: 'CI rotation fill' }
    });
    assert.match(html, /why-chip/);
    assert.match(html, /CI rotation fill/);
  });

  test('hides the why-chip on ACCEPTED composition', () => {
    const html = ScheduledActivityBlock({
      activity: {
        id: 'sa_why',
        name: 'PDCA',
        bucket: 'CI',
        plannedDurationMinutes: 30,
        state: 'SCHEDULED'
      },
      compositionState: 'ACCEPTED',
      explainEntry: { ref: 'cat_12_pdca_cycle', rule: 'R5_CI_ROTATION', detail: 'x' }
    });
    assert.ok(!html.includes('why-chip'));
  });

  test('no explainEntry → no why-chip', () => {
    const html = ScheduledActivityBlock({
      activity: {
        id: 'sa_w',
        name: 'x',
        bucket: 'CI',
        plannedDurationMinutes: 30,
        state: 'PROPOSED'
      },
      compositionState: 'PROPOSED'
    });
    assert.ok(!html.includes('why-chip'));
  });
});

describe('ScheduledActivityBlock — computeElapsedMinutes', () => {
  test('45 minutes between two ISO stamps', () => {
    const mins = ScheduledActivityBlock({
      activity: {
        id: 'x',
        name: 'y',
        bucket: 'PROJECT',
        plannedDurationMinutes: 60,
        state: 'IN_PROGRESS',
        actualStartAt: '2026-04-21T10:15:00Z'
      },
      nowIso: '2026-04-21T11:00:00Z'
    });
    assert.match(mins, /45m elapsed/);
  });
});

// AC-01/AC-02/AC-08: intention tests redirected to test outputArtifact rendering.
// The old .sa-intention placeholder tests are replaced with .sa-artifact column tests.
describe('ScheduledActivityBlock — outputArtifact column (replaces intention)', () => {
  const baseActivity = {
    id: 'sa_i',
    name: 'Deep Block',
    bucket: 'PROJECT',
    plannedDurationMinutes: 120,
    state: 'PROPOSED'
  };

  // AC-01: no .sa-intention element in rendered output
  test('old .sa-intention placeholder text does NOT appear', () => {
    const html = ScheduledActivityBlock({ activity: baseActivity });
    assert.ok(!html.includes('One line: what outcome by close?'), 'old intention placeholder must be absent');
    assert.ok(!html.includes('sa-intention'), '.sa-intention class must be absent');
  });

  // AC-02: outputArtifact.name renders when provided
  test('renders outputArtifact.name when provided', () => {
    const html = ScheduledActivityBlock({
      activity: baseActivity,
      outputArtifact: { name: 'Sprint Backlog', schema: 'DOCUMENT', required: true }
    });
    assert.match(html, /Sprint Backlog/);
    assert.match(html, /sa-artifact/);
  });

  // AC-02: outputArtifact.name is HTML-escaped (XSS guard)
  test('outputArtifact.name is HTML-escaped', () => {
    const html = ScheduledActivityBlock({
      activity: baseActivity,
      outputArtifact: { name: '<script>xss</script>', schema: 'TEXT', required: true }
    });
    assert.ok(!html.includes('<script>xss'), 'unescaped script tag must not appear');
    assert.match(html, /&lt;script&gt;/);
  });
});

describe('ScheduledActivityBlock — carried-over badge', () => {
  test('carriedOver=true renders "carried" badge', () => {
    const html = ScheduledActivityBlock({
      activity: {
        id: 'sa_c',
        name: 'L&D Tracker',
        bucket: 'CI',
        plannedDurationMinutes: 60,
        state: 'PROPOSED',
        carriedOver: true
      }
    });
    assert.match(html, /carried-badge/);
  });

  test('carriedOver=false → no carried badge', () => {
    const html = ScheduledActivityBlock({
      activity: {
        id: 'sa_c',
        name: 'L&D Tracker',
        bucket: 'CI',
        plannedDurationMinutes: 60,
        state: 'PROPOSED'
      }
    });
    assert.ok(!html.includes('carried-badge'));
  });
});

describe('ScheduledActivityBlock — pinned variant', () => {
  const a = {
    id: 'sa_p',
    name: 'Daily Standup',
    bucket: 'COMMUNICATION',
    plannedDurationMinutes: 15,
    state: 'SCHEDULED'
  };

  test('pinned=true adds "pinned" class', () => {
    const html = ScheduledActivityBlock({ activity: a, pinned: true });
    assert.match(html, /class="[^"]*pinned/);
  });

  test('pinned=false does not add the class', () => {
    const html = ScheduledActivityBlock({ activity: a });
    assert.ok(!/\bpinned\b/.test(html));
  });
});

describe('ScheduledActivityBlock — XSS / injection', () => {
  test('name escapes HTML', () => {
    const html = ScheduledActivityBlock({
      activity: {
        id: 'sa_xss',
        name: '<img src=x onerror=alert(1)>',
        bucket: 'PROJECT',
        plannedDurationMinutes: 30,
        state: 'PROPOSED'
      }
    });
    assert.ok(!html.includes('<img src=x'));
    assert.match(html, /&lt;img/);
  });

  test('id escapes quotes', () => {
    const html = ScheduledActivityBlock({
      activity: {
        id: 'sa"onerror=alert(1)',
        name: 'x',
        bucket: 'CI',
        plannedDurationMinutes: 30,
        state: 'PROPOSED'
      }
    });
    assert.ok(!html.includes('sa"onerror'));
    assert.match(html, /&quot;/);
  });
});

// ============================================================
// C-UX-COL refactor — new tests (13 total)
// ============================================================

describe('ScheduledActivityBlock — AC-01/AC-04: state-label removal', () => {
  const base = {
    id: 'sa_t',
    name: 'Test Activity',
    bucket: 'CI',
    plannedDurationMinutes: 30,
    plannedStartAt: '09:00'
  };

  // AC-04: the literal text "proposed", "scheduled", "in progress" must not
  // appear inside a .sa-state-label element.
  test('no .sa-state-label element in any state', () => {
    for (const state of ['PROPOSED', 'SCHEDULED', 'IN_PROGRESS', 'CLOSED', 'SKIPPED']) {
      const html = ScheduledActivityBlock({ activity: { ...base, state } });
      assert.ok(!html.includes('sa-state-label'),
        `sa-state-label must not appear for state ${state}`);
    }
  });

  // AC-09: stateLabel() function is retained (exported indirectly — verifiable by
  // checking the module exports; the function is used in aria-label generation).
  // We verify its output appears in aria-label, not in a label div.
  test('state string appears in <li> aria-label, not in a label div', () => {
    const html = ScheduledActivityBlock({
      activity: { ...base, state: 'PROPOSED' }
    });
    assert.match(html, /aria-label="Activity:[^"]*proposed[^"]*"/);
    assert.ok(!html.includes('sa-state-label'));
  });
});

describe('ScheduledActivityBlock — AC-02/AC-03: outputArtifact column', () => {
  const base = {
    id: 'sa_oa',
    name: 'PDCA Cycle',
    bucket: 'CI',
    plannedDurationMinutes: 30,
    plannedStartAt: '10:00',
    state: 'PROPOSED'
  };

  // Test 1 (QA §5 #1): outputArtifact.name renders when CatalogEntry has one
  test('renders outputArtifact.name when provided', () => {
    const html = ScheduledActivityBlock({
      activity: base,
      outputArtifact: { name: 'Current-condition measurement', schema: 'NUMERIC', required: true }
    });
    assert.match(html, /Current-condition measurement/);
    assert.match(html, /class="sa-artifact"/);
  });

  // Test 2 (QA §5 #2): fallback to kind is not needed per Q1 decision —
  // we use name always. Verify name takes priority over schema display.
  test('outputArtifact.name takes priority; schema is not exposed in row', () => {
    const html = ScheduledActivityBlock({
      activity: base,
      outputArtifact: { name: 'C&E Matrix', schema: 'DOCUMENT', required: true }
    });
    assert.match(html, /C&amp;E Matrix/);        // HTML-escaped
    // schema type should not appear as a visible label in row
    assert.ok(!html.includes('>DOCUMENT<'), 'schema string must not appear as row text');
  });

  // Test 3 (QA §5 #3): null outputArtifact renders empty without breaking grid
  test('null outputArtifact renders empty sa-artifact-empty div (AC-03)', () => {
    const html = ScheduledActivityBlock({
      activity: base,
      outputArtifact: null
    });
    assert.match(html, /sa-artifact sa-artifact-empty/);
    assert.ok(!html.includes('undefined'), 'must not render the string "undefined"');
    assert.ok(!html.includes('One line'), 'must not render old intention placeholder');
  });

  // Test 4 (QA §5 #3): missing outputArtifact prop renders safely (no prop = null)
  test('missing outputArtifact prop renders safely empty', () => {
    const html = ScheduledActivityBlock({ activity: base });
    assert.match(html, /sa-artifact/);
    assert.ok(!html.includes('undefined'));
  });

  // Test 5 (QA §6 edge case #4): outputArtifact.name with HTML special chars
  test('outputArtifact.name HTML-escaped (XSS guard)', () => {
    const html = ScheduledActivityBlock({
      activity: base,
      outputArtifact: { name: '<script>alert(1)</script>', schema: 'TEXT', required: true }
    });
    assert.ok(!html.includes('<script>alert'), 'raw script tag must not appear');
    assert.match(html, /&lt;script&gt;/);
  });

  // Test 6 (edge case): empty string name treated as null
  test('empty string outputArtifact.name renders empty column (EC-07)', () => {
    const html = ScheduledActivityBlock({
      activity: base,
      outputArtifact: { name: '', schema: 'TEXT', required: true }
    });
    assert.match(html, /sa-artifact sa-artifact-empty/);
  });
});

describe('ScheduledActivityBlock — AC-04/Q2: .sa-artifact click target', () => {
  const base = {
    id: 'sa_click',
    name: 'Sprint Retro',
    bucket: 'CI',
    plannedDurationMinutes: 60,
    plannedStartAt: '14:00',
    state: 'SCHEDULED'
  };

  // Test 4 (QA §5 #4): click on .sa-artifact opens OutputArtifactDialog (data-action wired)
  test('.sa-artifact has data-action=OPEN_OUTPUT_ARTIFACT when name present', () => {
    const html = ScheduledActivityBlock({
      activity: base,
      outputArtifact: { name: 'Retrospective Actions', schema: 'TWO_LIST', required: true }
    });
    assert.match(html, /data-action="OPEN_OUTPUT_ARTIFACT"/);
  });

  // Test 5 (QA §5 #5): payload carries activityId
  test('.sa-artifact data-payload contains activityId', () => {
    const html = ScheduledActivityBlock({
      activity: base,
      outputArtifact: { name: 'Retrospective Actions', schema: 'TWO_LIST', required: true }
    });
    assert.match(html, /data-action="OPEN_OUTPUT_ARTIFACT"[^>]*sa_click/);
  });

  // Empty artifact has NO click action (collapses silently)
  test('.sa-artifact-empty does NOT have data-action', () => {
    const html = ScheduledActivityBlock({
      activity: base,
      outputArtifact: null
    });
    // The empty div should not carry the click handler
    const emptyMatch = html.match(/sa-artifact-empty[^>]*/);
    assert.ok(emptyMatch, 'sa-artifact-empty must be present');
    assert.ok(!emptyMatch[0].includes('OPEN_OUTPUT_ARTIFACT'), 'empty column must not be clickable');
  });
});

describe('ScheduledActivityBlock — Q7: ARIA state in <li>', () => {
  const base = {
    id: 'sa_aria',
    name: 'Daily Standup',
    bucket: 'COMMUNICATION',
    plannedDurationMinutes: 15,
    plannedStartAt: '09:00'
  };

  // Test 7 (QA §5 #7): <li> aria-label includes name, state, time, duration
  test('<li> aria-label encodes name, state, time, duration for PROPOSED', () => {
    const html = ScheduledActivityBlock({
      activity: { ...base, state: 'PROPOSED' }
    });
    assert.match(html, /aria-label="Activity: Daily Standup, proposed, 09:00, 15 minutes"/);
  });

  test('<li> aria-label encodes IN_PROGRESS state', () => {
    const html = ScheduledActivityBlock({
      activity: { ...base, state: 'IN_PROGRESS' }
    });
    assert.match(html, /aria-label="Activity: Daily Standup, in progress, 09:00, 15 minutes"/);
  });

  test('<li> aria-label encodes CLOSED state', () => {
    const html = ScheduledActivityBlock({
      activity: { ...base, state: 'CLOSED' }
    });
    assert.match(html, /aria-label="Activity: Daily Standup, closed, 09:00, 15 minutes"/);
  });

  test('<li> aria-label encodes SKIPPED state', () => {
    const html = ScheduledActivityBlock({
      activity: { ...base, state: 'SKIPPED' }
    });
    assert.match(html, /aria-label="Activity: Daily Standup, skipped, 09:00, 15 minutes"/);
  });
});

describe('ScheduledActivityBlock — AC-05/AC-06: state readability without label', () => {
  const base = {
    id: 'sa_rd',
    name: 'Test',
    bucket: 'PROJECT',
    plannedDurationMinutes: 60,
    plannedStartAt: '10:00'
  };

  // Test 9 (QA §5): IN_PROGRESS elapsed timer still renders
  test('IN_PROGRESS: elapsed timer renders alongside artifact column', () => {
    const html = ScheduledActivityBlock({
      activity: {
        ...base, state: 'IN_PROGRESS',
        actualStartAt: '2026-04-30T10:00:00Z'
      },
      nowIso: '2026-04-30T10:45:00Z',
      outputArtifact: { name: '1-Pager', schema: 'DOCUMENT', required: true }
    });
    assert.match(html, /sa-elapsed/);
    assert.match(html, /45m elapsed/);
    assert.match(html, /1-Pager/);
  });

  // Test 10 (QA §5): SKIPPED skip-reason still renders
  test('SKIPPED: skip-reason chip still renders', () => {
    const html = ScheduledActivityBlock({
      activity: {
        ...base, state: 'SKIPPED',
        reasonCodeIfSkipped: 'MEETING_CONFLICT'
      }
    });
    assert.match(html, /sa-skip-reason/);
    assert.match(html, /MEETING_CONFLICT/);
    assert.match(html, /sa-state-skipped/);
  });

  // Test 11 (QA §5): CLOSED row has sa-state-closed class
  test('CLOSED: row has sa-state-closed class even without label', () => {
    const html = ScheduledActivityBlock({
      activity: { ...base, state: 'CLOSED' }
    });
    assert.match(html, /sa-state-closed/);
    assert.ok(!html.includes('sa-state-label'), 'no text label element');
  });
});

describe('ScheduledActivityBlock — AC-07: edit mode preserved', () => {
  const base = {
    id: 'sa_edit',
    name: 'PDCA Cycle',
    bucket: 'CI',
    plannedDurationMinutes: 30,
    plannedStartAt: '10:00',
    state: 'PROPOSED',
    catalogEntryId: 'cat_12_pdca'
  };

  // Test 8 (QA §5): edit-mode chrome positions correctly
  test('edit mode: Select and Remove buttons render correctly', () => {
    const html = ScheduledActivityBlock({
      activity: base,
      editMode: true,
      editSelected: false,
      outputArtifact: { name: 'PDCA Output', schema: 'TEXT', required: true }
    });
    assert.match(html, /data-action="EDIT_SELECT_SLOT"/);
    assert.match(html, /data-action="EDIT_REMOVE_SLOT"/);
    // Artifact column still renders in edit mode (read-only)
    assert.match(html, /PDCA Output/);
  });

  test('edit mode: artifact column read-only (no edit input added)', () => {
    const html = ScheduledActivityBlock({
      activity: base,
      editMode: true,
      editSelected: true,
      outputArtifact: { name: 'Sprint Backlog', schema: 'DOCUMENT', required: true }
    });
    assert.match(html, /Sprint Backlog/);
    // No edit input injected for the artifact column
    assert.ok(!/<input[^>]*Sprint Backlog/.test(html), 'artifact column must be read-only');
  });
});

describe('ScheduledActivityBlock — AC-03: Lunch/null-catalog rows', () => {
  // Test 12 (QA §5): Lunch block (no outputArtifact) renders empty artifact column
  test('null outputArtifact (Lunch block) renders empty column without breaking grid', () => {
    const html = ScheduledActivityBlock({
      activity: {
        id: 'sa_lunch',
        name: 'Lunch',
        bucket: 'CI',
        plannedDurationMinutes: 60,
        plannedStartAt: '12:00',
        state: 'SCHEDULED',
        catalogEntryId: 'gen_lunch'
      },
      outputArtifact: null,
      showStart: true
    });
    assert.match(html, /sa-artifact sa-artifact-empty/);
    // Grid integrity: other columns still present
    assert.match(html, /sa-when/);
    assert.match(html, /sa-bucket-chip/);
    assert.match(html, /sa-name/);
    assert.match(html, /sa-duration/);
    assert.ok(!html.includes('undefined'), 'no undefined in output');
  });
});
