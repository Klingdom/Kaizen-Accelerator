/**
 * BlockDetailDialog — Phase 1 (steps-to-complete) tests.
 *
 * AC coverage (STEPS_TO_COMPLETE_DELTA.md §3 + PM §4):
 *   AC-ST1  PROJECT + procedure populated → renders <ol class="bdd-steps-list">
 *   AC-ST2  PROJECT + empty procedure []  → type-specific empty state copy
 *   AC-ST3  PROJECT + no catalogEntry     → type-specific empty state copy
 *   AC-ST4  CI + procedure populated      → renders <ol class="bdd-steps-list">
 *   AC-ST5  CI + empty procedure          → CI-specific empty state copy (different from PROJECT)
 *   AC-ST6  COMMUNICATION bucket          → NO .bdd-steps-section rendered
 *   AC-ST7  LUNCH (bucket: null)          → NO .bdd-steps-section rendered
 *   AC-ST8  gen_end_of_activity_reflection → NO .bdd-steps-section (has Start Reflection action)
 *   AC-ST9  Heading copy                  → exactly "Steps to complete"
 *   AC-ST10 Step order                    → steps render in source array order
 *   AC-ST11 XSS guard                     → step text with <script> is esc()-escaped
 *   AC-ST12 META §A.2 orthogonal bucket   → PROJECT shows section AND COMM does not (paired)
 *   AC-ST13 META §A.2 orthogonal states   → same activity, populated vs empty; structure consistent
 *   AC-ST14 PROTECTED CI ceremony + procedure → renders steps normally (no isProtected guard)
 *   AC-ST15 CI empty vs PROJECT empty     → different copy (regression-lock per-type empty states)
 *
 * Pattern mirrors BlockDetailDialog.iter47.test.js per FE artifact §4.
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

const BASE_CI = {
  id: 'sa_ci',
  name: 'PDCA Cycle',
  bucket: 'CI',
  plannedStartAt: '14:00',
  plannedDurationMinutes: 30,
  state: 'SCHEDULED',
  catalogEntryId: 'cat_pdca'
};

const BASE_COMM = {
  id: 'sa_comm',
  name: 'Daily Standup',
  bucket: 'COMMUNICATION',
  plannedStartAt: '09:00',
  plannedDurationMinutes: 15,
  state: 'SCHEDULED',
  catalogEntryId: 'cer_daily_standup'
};

const LUNCH_ACT = {
  id: 'sa_lunch',
  name: 'Lunch',
  bucket: null,
  plannedStartAt: '12:30',
  plannedDurationMinutes: 30,
  state: 'SCHEDULED',
  catalogEntryId: 'recovery_lunch'
};

// Protected CI ceremony (cer_sprint_planning is in PROTECTED_CATALOG_IDS)
const PROTECTED_CI = {
  id: 'sa_sprint_planning',
  name: 'Sprint Planning',
  bucket: 'CI',
  plannedStartAt: '09:00',
  plannedDurationMinutes: 120,
  state: 'SCHEDULED',
  catalogEntryId: 'cer_sprint_planning'
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

// Catalog entries
const CAT_WITH_PROCEDURE = {
  id: 'cat_deep_work',
  procedure: [
    'Define the problem statement.',
    'Gather data samples.',
    'Analyse patterns and root causes.'
  ]
};

const CAT_EMPTY_PROCEDURE = {
  id: 'cat_deep_work_bare',
  procedure: []
};

const CAT_NO_PROCEDURE = {
  id: 'cat_no_proc'
  // procedure field absent
};

const CAT_CI_WITH_PROCEDURE = {
  id: 'cat_pdca',
  procedure: [
    'Plan: define goal and expected outcome.',
    'Do: execute the change on a small scale.',
    'Check: measure results against the plan.',
    'Act: standardise or iterate.'
  ]
};

const CAT_CI_EMPTY_PROCEDURE = {
  id: 'cat_pdca_bare',
  procedure: []
};

// Protected ceremony catalog entry with a real procedure
const CAT_PROTECTED_WITH_PROCEDURE = {
  id: 'cer_sprint_planning',
  procedure: [
    'Review the product backlog.',
    'Select items for the sprint.',
    'Break items into tasks and estimate.'
  ]
};

// ---------------------------------------------------------------------------
// AC-ST1: PROJECT + procedure populated → renders <ol class="bdd-steps-list">
// ---------------------------------------------------------------------------

describe('BlockDetailDialog steps — AC-ST1: PROJECT with populated procedure', () => {
  test('AC-ST1: renders .bdd-steps-section', () => {
    const html = BlockDetailDialog({ activity: BASE_PROJECT, catalogEntry: CAT_WITH_PROCEDURE });
    assert.ok(html.includes('bdd-steps-section'),
      'AC-ST1: PROJECT with procedure must render .bdd-steps-section');
  });

  test('AC-ST1: renders <ol class="bdd-steps-list">', () => {
    const html = BlockDetailDialog({ activity: BASE_PROJECT, catalogEntry: CAT_WITH_PROCEDURE });
    assert.ok(html.includes('bdd-steps-list'),
      'AC-ST1: PROJECT with procedure must render .bdd-steps-list <ol>');
  });

  test('AC-ST1: each step text appears in the output', () => {
    const html = BlockDetailDialog({ activity: BASE_PROJECT, catalogEntry: CAT_WITH_PROCEDURE });
    assert.ok(html.includes('Define the problem statement.'),
      'AC-ST1: first step text must appear');
    assert.ok(html.includes('Gather data samples.'),
      'AC-ST1: second step text must appear');
    assert.ok(html.includes('Analyse patterns and root causes.'),
      'AC-ST1: third step text must appear');
  });
});

// ---------------------------------------------------------------------------
// AC-ST2: PROJECT + empty procedure [] → type-specific empty state copy
// ---------------------------------------------------------------------------

describe('BlockDetailDialog steps — AC-ST2: PROJECT with empty procedure []', () => {
  test('AC-ST2: renders .bdd-steps-section--empty', () => {
    const html = BlockDetailDialog({ activity: BASE_PROJECT, catalogEntry: CAT_EMPTY_PROCEDURE });
    assert.ok(html.includes('bdd-steps-section--empty'),
      'AC-ST2: empty procedure must render .bdd-steps-section--empty');
  });

  test('AC-ST2: does NOT render .bdd-steps-list', () => {
    const html = BlockDetailDialog({ activity: BASE_PROJECT, catalogEntry: CAT_EMPTY_PROCEDURE });
    assert.ok(!html.includes('bdd-steps-list'),
      'AC-ST2: empty procedure must NOT render .bdd-steps-list');
  });

  test('AC-ST2: renders PROJECT-specific empty state copy', () => {
    const html = BlockDetailDialog({ activity: BASE_PROJECT, catalogEntry: CAT_EMPTY_PROCEDURE });
    assert.ok(html.includes('No steps defined for this work type yet.'),
      'AC-ST2: PROJECT empty state must say "...work type..."');
  });
});

// ---------------------------------------------------------------------------
// AC-ST3: PROJECT + no catalogEntry → type-specific empty state copy
// ---------------------------------------------------------------------------

describe('BlockDetailDialog steps — AC-ST3: PROJECT with no catalogEntry', () => {
  test('AC-ST3: renders .bdd-steps-section--empty when catalogEntry is null', () => {
    const html = BlockDetailDialog({ activity: BASE_PROJECT, catalogEntry: null });
    assert.ok(html.includes('bdd-steps-section--empty'),
      'AC-ST3: null catalogEntry must render .bdd-steps-section--empty');
  });

  test('AC-ST3: renders PROJECT-specific empty state copy when catalogEntry is null', () => {
    const html = BlockDetailDialog({ activity: BASE_PROJECT, catalogEntry: null });
    assert.ok(html.includes('No steps defined for this work type yet.'),
      'AC-ST3: null catalogEntry PROJECT empty state must say "...work type..."');
  });

  test('AC-ST3: renders .bdd-steps-section--empty when catalogEntry has no procedure field', () => {
    const html = BlockDetailDialog({ activity: BASE_PROJECT, catalogEntry: CAT_NO_PROCEDURE });
    assert.ok(html.includes('bdd-steps-section--empty'),
      'AC-ST3: catalogEntry without procedure must render empty state');
  });
});

// ---------------------------------------------------------------------------
// AC-ST4: CI + procedure populated → renders <ol class="bdd-steps-list">
// ---------------------------------------------------------------------------

describe('BlockDetailDialog steps — AC-ST4: CI with populated procedure', () => {
  test('AC-ST4: renders .bdd-steps-section', () => {
    const html = BlockDetailDialog({ activity: BASE_CI, catalogEntry: CAT_CI_WITH_PROCEDURE });
    assert.ok(html.includes('bdd-steps-section'),
      'AC-ST4: CI with procedure must render .bdd-steps-section');
  });

  test('AC-ST4: renders <ol class="bdd-steps-list">', () => {
    const html = BlockDetailDialog({ activity: BASE_CI, catalogEntry: CAT_CI_WITH_PROCEDURE });
    assert.ok(html.includes('bdd-steps-list'),
      'AC-ST4: CI with procedure must render .bdd-steps-list');
  });
});

// ---------------------------------------------------------------------------
// AC-ST5: CI + empty procedure → CI-specific empty state copy
// ---------------------------------------------------------------------------

describe('BlockDetailDialog steps — AC-ST5: CI with empty procedure', () => {
  test('AC-ST5: renders .bdd-steps-section--empty', () => {
    const html = BlockDetailDialog({ activity: BASE_CI, catalogEntry: CAT_CI_EMPTY_PROCEDURE });
    assert.ok(html.includes('bdd-steps-section--empty'),
      'AC-ST5: CI empty procedure must render .bdd-steps-section--empty');
  });

  test('AC-ST5: renders CI-specific empty state copy ("improvement activity")', () => {
    const html = BlockDetailDialog({ activity: BASE_CI, catalogEntry: CAT_CI_EMPTY_PROCEDURE });
    assert.ok(html.includes('No steps defined for this improvement activity yet.'),
      'AC-ST5: CI empty state must say "...improvement activity..."');
  });

  test('AC-ST5: does NOT render .bdd-steps-list', () => {
    const html = BlockDetailDialog({ activity: BASE_CI, catalogEntry: CAT_CI_EMPTY_PROCEDURE });
    assert.ok(!html.includes('bdd-steps-list'),
      'AC-ST5: CI empty procedure must NOT render .bdd-steps-list');
  });
});

// ---------------------------------------------------------------------------
// AC-ST6: COMMUNICATION bucket → NO .bdd-steps-section rendered
// ---------------------------------------------------------------------------

describe('BlockDetailDialog steps — AC-ST6: COMMUNICATION bucket skips steps section', () => {
  test('AC-ST6: COMM block does NOT render .bdd-steps-section', () => {
    const html = BlockDetailDialog({
      activity: BASE_COMM,
      catalogEntry: CAT_WITH_PROCEDURE // has procedure — must still be skipped
    });
    assert.ok(!html.includes('bdd-steps-section'),
      'AC-ST6: COMM block must NOT render .bdd-steps-section regardless of catalogEntry');
  });

  test('AC-ST6: COMM block with no catalogEntry also has no steps section', () => {
    const html = BlockDetailDialog({ activity: BASE_COMM, catalogEntry: null });
    assert.ok(!html.includes('bdd-steps-section'),
      'AC-ST6: COMM block with no catalogEntry must have no steps section');
  });
});

// ---------------------------------------------------------------------------
// AC-ST7: LUNCH (bucket: null) → NO .bdd-steps-section rendered
// ---------------------------------------------------------------------------

describe('BlockDetailDialog steps — AC-ST7: LUNCH (bucket=null) skips steps section', () => {
  test('AC-ST7: LUNCH activity does NOT render .bdd-steps-section', () => {
    const html = BlockDetailDialog({
      activity: LUNCH_ACT,
      catalogEntry: CAT_WITH_PROCEDURE
    });
    assert.ok(!html.includes('bdd-steps-section'),
      'AC-ST7: LUNCH (bucket=null) must NOT render .bdd-steps-section');
  });
});

// ---------------------------------------------------------------------------
// AC-ST8: gen_end_of_activity_reflection → NO .bdd-steps-section (EoAR exclusion)
// ---------------------------------------------------------------------------

describe('BlockDetailDialog steps — AC-ST8: EoAR exclusion', () => {
  test('AC-ST8: EoAR does NOT render .bdd-steps-section (has Start Reflection action)', () => {
    const html = BlockDetailDialog({
      activity: EAR,
      catalogEntry: CAT_WITH_PROCEDURE // even with populated procedure — must skip
    });
    assert.ok(!html.includes('bdd-steps-section'),
      'AC-ST8: gen_end_of_activity_reflection must NOT render .bdd-steps-section');
  });

  test('AC-ST8: EoAR still shows Start Reflection button (existing action preserved)', () => {
    const html = BlockDetailDialog({ activity: EAR });
    assert.ok(html.includes('bdd-btn-reflect'),
      'AC-ST8: EoAR must still show Start Reflection button');
    assert.ok(html.includes('EOD_OPEN_REFLECTION'),
      'AC-ST8: EoAR must still dispatch EOD_OPEN_REFLECTION');
  });
});

// ---------------------------------------------------------------------------
// AC-ST9: Heading copy — exactly "Steps to complete" (regression-lock noun phrase)
// ---------------------------------------------------------------------------

describe('BlockDetailDialog steps — AC-ST9: heading copy regression-lock', () => {
  test('AC-ST9: PROJECT steps heading is exactly "Steps to complete"', () => {
    const html = BlockDetailDialog({ activity: BASE_PROJECT, catalogEntry: CAT_WITH_PROCEDURE });
    assert.ok(html.includes('Steps to complete'),
      'AC-ST9: PROJECT steps heading must be "Steps to complete"');
  });

  test('AC-ST9: CI steps heading is exactly "Steps to complete"', () => {
    const html = BlockDetailDialog({ activity: BASE_CI, catalogEntry: CAT_CI_WITH_PROCEDURE });
    assert.ok(html.includes('Steps to complete'),
      'AC-ST9: CI steps heading must be "Steps to complete"');
  });

  test('AC-ST9: heading renders inside .bdd-steps-heading class', () => {
    const html = BlockDetailDialog({ activity: BASE_PROJECT, catalogEntry: CAT_WITH_PROCEDURE });
    assert.ok(html.includes('bdd-steps-heading'),
      'AC-ST9: heading must use .bdd-steps-heading class');
    // Heading text appears — check both the class and the text co-occur
    const headingIdx = html.indexOf('bdd-steps-heading');
    const textIdx    = html.indexOf('Steps to complete');
    assert.ok(headingIdx !== -1 && textIdx !== -1,
      'AC-ST9: both class and text must be present');
  });

  test('AC-ST9: empty state also shows heading "Steps to complete"', () => {
    const html = BlockDetailDialog({ activity: BASE_PROJECT, catalogEntry: CAT_EMPTY_PROCEDURE });
    assert.ok(html.includes('Steps to complete'),
      'AC-ST9: empty state must also render the heading');
  });
});

// ---------------------------------------------------------------------------
// AC-ST10: Step order — steps render in source array order
// ---------------------------------------------------------------------------

describe('BlockDetailDialog steps — AC-ST10: step source order preserved', () => {
  test('AC-ST10: steps appear in array index order', () => {
    const html = BlockDetailDialog({ activity: BASE_PROJECT, catalogEntry: CAT_WITH_PROCEDURE });
    const idx0 = html.indexOf('Define the problem statement.');
    const idx1 = html.indexOf('Gather data samples.');
    const idx2 = html.indexOf('Analyse patterns and root causes.');
    assert.ok(idx0 < idx1 && idx1 < idx2,
      'AC-ST10: steps must appear in source order (index 0 before 1 before 2)');
  });
});

// ---------------------------------------------------------------------------
// AC-ST11: XSS guard — step text with <script> is HTML-escaped via esc()
// ---------------------------------------------------------------------------

describe('BlockDetailDialog steps — AC-ST11: XSS guard via esc()', () => {
  test('AC-ST11: <script> in step text is escaped and not executed as markup', () => {
    const xssCatalog = {
      id: 'cat_xss',
      procedure: ['Normal step.', '<script>alert("xss")</script>']
    };
    const html = BlockDetailDialog({ activity: BASE_PROJECT, catalogEntry: xssCatalog });
    // The raw <script> tag must NOT appear verbatim
    assert.ok(!html.includes('<script>alert'),
      'AC-ST11: raw <script> must not appear in output');
    // Escaped form must appear instead
    assert.ok(html.includes('&lt;script&gt;'),
      'AC-ST11: <script> must be HTML-escaped to &lt;script&gt;');
  });

  test('AC-ST11: < > & characters in step text are all escaped', () => {
    const xssCatalog = {
      id: 'cat_xss2',
      procedure: ['A < B & C > D']
    };
    const html = BlockDetailDialog({ activity: BASE_PROJECT, catalogEntry: xssCatalog });
    assert.ok(!html.includes('A < B'),
      'AC-ST11: raw < must be escaped');
    assert.ok(html.includes('&lt;') || html.includes('&amp;') || html.includes('&gt;'),
      'AC-ST11: at least one HTML entity must appear from escaped step text');
  });
});

// ---------------------------------------------------------------------------
// AC-ST12: META §A.2 orthogonal — bucket dispatch: PROJECT shows AND COMM does not
// ---------------------------------------------------------------------------

describe('BlockDetailDialog steps — AC-ST12: META §A.2 orthogonal bucket dispatch', () => {
  test('AC-ST12: PROJECT shows .bdd-steps-section AND COMM does not (paired)', () => {
    const projectHtml = BlockDetailDialog({ activity: BASE_PROJECT, catalogEntry: CAT_WITH_PROCEDURE });
    const commHtml    = BlockDetailDialog({ activity: BASE_COMM,    catalogEntry: CAT_WITH_PROCEDURE });

    assert.ok(projectHtml.includes('bdd-steps-section'),
      'AC-ST12: PROJECT must show .bdd-steps-section');
    assert.ok(!commHtml.includes('bdd-steps-section'),
      'AC-ST12: COMM must NOT show .bdd-steps-section (orthogonal to PROJECT)');
  });

  test('AC-ST12: CI shows .bdd-steps-section AND LUNCH does not (paired)', () => {
    const ciHtml    = BlockDetailDialog({ activity: BASE_CI,    catalogEntry: CAT_CI_WITH_PROCEDURE });
    const lunchHtml = BlockDetailDialog({ activity: LUNCH_ACT,  catalogEntry: CAT_WITH_PROCEDURE });

    assert.ok(ciHtml.includes('bdd-steps-section'),
      'AC-ST12: CI must show .bdd-steps-section');
    assert.ok(!lunchHtml.includes('bdd-steps-section'),
      'AC-ST12: LUNCH must NOT show .bdd-steps-section');
  });
});

// ---------------------------------------------------------------------------
// AC-ST13: META §A.2 orthogonal — populated vs empty states: structure consistent
// ---------------------------------------------------------------------------

describe('BlockDetailDialog steps — AC-ST13: META §A.2 orthogonal populated vs empty', () => {
  test('AC-ST13: same PROJECT activity, populated procedure → shows list, empty → shows empty state', () => {
    const populatedHtml = BlockDetailDialog({ activity: BASE_PROJECT, catalogEntry: CAT_WITH_PROCEDURE });
    const emptyHtml     = BlockDetailDialog({ activity: BASE_PROJECT, catalogEntry: CAT_EMPTY_PROCEDURE });

    // Populated: list renders
    assert.ok(populatedHtml.includes('bdd-steps-list'),
      'AC-ST13: populated must show .bdd-steps-list');
    assert.ok(!populatedHtml.includes('bdd-steps-section--empty'),
      'AC-ST13: populated must NOT show .bdd-steps-section--empty');

    // Empty: list absent, empty-state renders
    assert.ok(!emptyHtml.includes('bdd-steps-list'),
      'AC-ST13: empty must NOT show .bdd-steps-list');
    assert.ok(emptyHtml.includes('bdd-steps-section--empty'),
      'AC-ST13: empty must show .bdd-steps-section--empty');
  });

  test('AC-ST13: both states render .bdd-steps-section (outer wrapper consistent)', () => {
    const populatedHtml = BlockDetailDialog({ activity: BASE_PROJECT, catalogEntry: CAT_WITH_PROCEDURE });
    const emptyHtml     = BlockDetailDialog({ activity: BASE_PROJECT, catalogEntry: CAT_EMPTY_PROCEDURE });

    assert.ok(populatedHtml.includes('bdd-steps-section'),
      'AC-ST13: populated must render .bdd-steps-section wrapper');
    assert.ok(emptyHtml.includes('bdd-steps-section'),
      'AC-ST13: empty must also render .bdd-steps-section wrapper');
  });
});

// ---------------------------------------------------------------------------
// AC-ST14: PROTECTED CI ceremony with procedure → renders steps normally
//          (no isProtected guard — DELTA §3.1 "render normally per bucket")
// ---------------------------------------------------------------------------

describe('BlockDetailDialog steps — AC-ST14: PROTECTED CI ceremony with procedure', () => {
  test('AC-ST14: protected Sprint Planning with procedure renders .bdd-steps-section', () => {
    const html = BlockDetailDialog({
      activity: PROTECTED_CI,
      catalogEntry: CAT_PROTECTED_WITH_PROCEDURE
    });
    assert.ok(html.includes('bdd-steps-section'),
      'AC-ST14: protected CI ceremony must render .bdd-steps-section (no isProtected guard)');
  });

  test('AC-ST14: protected Sprint Planning with procedure renders .bdd-steps-list', () => {
    const html = BlockDetailDialog({
      activity: PROTECTED_CI,
      catalogEntry: CAT_PROTECTED_WITH_PROCEDURE
    });
    assert.ok(html.includes('bdd-steps-list'),
      'AC-ST14: protected CI ceremony must render .bdd-steps-list with steps');
  });

  test('AC-ST14: protected Sprint Planning step text appears', () => {
    const html = BlockDetailDialog({
      activity: PROTECTED_CI,
      catalogEntry: CAT_PROTECTED_WITH_PROCEDURE
    });
    assert.ok(html.includes('Review the product backlog.'),
      'AC-ST14: step text must appear for protected CI ceremony');
  });
});

// ---------------------------------------------------------------------------
// AC-ST15: CI empty vs PROJECT empty have DIFFERENT copy
//          (orthogonal regression-lock for type-specific empty states)
// ---------------------------------------------------------------------------

describe('BlockDetailDialog steps — AC-ST15: CI and PROJECT empty states have different copy', () => {
  test('AC-ST15: PROJECT empty state uses "work type" copy, NOT "improvement activity"', () => {
    const html = BlockDetailDialog({ activity: BASE_PROJECT, catalogEntry: CAT_EMPTY_PROCEDURE });
    assert.ok(html.includes('No steps defined for this work type yet.'),
      'AC-ST15: PROJECT must use "work type" copy');
    assert.ok(!html.includes('improvement activity'),
      'AC-ST15: PROJECT must NOT use CI "improvement activity" copy');
  });

  test('AC-ST15: CI empty state uses "improvement activity" copy, NOT "work type"', () => {
    const html = BlockDetailDialog({ activity: BASE_CI, catalogEntry: CAT_CI_EMPTY_PROCEDURE });
    assert.ok(html.includes('No steps defined for this improvement activity yet.'),
      'AC-ST15: CI must use "improvement activity" copy');
    assert.ok(!html.includes('work type'),
      'AC-ST15: CI must NOT use PROJECT "work type" copy');
  });
});
