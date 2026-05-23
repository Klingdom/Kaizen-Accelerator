/**
 * Phase 4 catalog additions — acceptance tests.
 *
 * Covers the 4 Tier 3 entries dispatched per CATALOG_GAP_DELTA.md §7 Tier 3.
 * gen_reading_for_synthesis DROPPED — consolidated into gen_learning_debrief in Phase 3.
 *
 * PROJECT (+1):
 *   - gen_project_kickoff         (PROJECT, event-driven — PMBOK 7th Ed. Sec. 4.3.2 + Scrum Guide 2020 "Sprint Zero")
 *
 * CI (+3):
 *   - gen_improvement_experiment_log (CI, event-driven — PM PDCA experiment log; Toyota Kata + Lean Startup)
 *   - gen_focus_metrics_review       (CI, weekly        — McChesney 4DX Discipline 2; Doerr Ch. 9)
 *   - gen_personal_kanban_review     (CI, daily         — Benson/Barry "Personal Kanban" Rules 1-2)
 *
 * Research Tier 3 procedure authorship note:
 *   Entries 11 (gen_project_kickoff), 12 (gen_focus_metrics_review), and 13 (gen_personal_kanban_review)
 *   were presented in condensed format in CATALOG_GAP_RESEARCH.md §3 — they had id, name, bucket,
 *   duration, cadence, trigger, source, but NO full procedure array. Procedures were authored from
 *   canonical industry sources (PMBOK, Scrum Guide, 4DX, Personal Kanban) following the step pattern
 *   prescribed in the dispatch brief.
 *
 *   Entry 4 (gen_improvement_experiment_log) from CATALOG_GAP_PM.md Tier 3 had a full procedure block.
 *
 * Per-entry tests (~6 ACs each):
 *   AC-CAT-{ID}-1: entry exists in compiled catalog with expected id
 *   AC-CAT-{ID}-2: bucket matches expectation
 *   AC-CAT-{ID}-3: procedure is a non-empty array (3–7 steps)
 *   AC-CAT-{ID}-4: cadence is valid (one of the Cadence enum values)
 *   AC-CAT-{ID}-5: outputArtifact.schema is a non-empty string
 *   AC-CAT-{ID}-6: defaultDurationMinutes is a positive integer
 *
 * Cross-cutting (~10 ACs):
 *   AC-CAT-PHASE4-CROSS-1: all 4 new entries have unique IDs
 *   AC-CAT-PHASE4-CROSS-2: no Phase 4 entry has the same ID as a Phase 1, 2, or 3 entry
 *   AC-CAT-PHASE4-CROSS-3: total catalog size is 85
 *   AC-CAT-PHASE4-CROSS-4: COMMUNICATION bucket has 16 entries (unchanged — no Tier 3 COMM entries)
 *   AC-CAT-PHASE4-CROSS-5: CI bucket has 30 entries (+3 from Phase 4)
 *   AC-CAT-PHASE4-CROSS-6: PROJECT bucket has 38 entries (+1 from Phase 4)
 *   AC-CAT-PHASE4-CROSS-7: gen_reading_for_synthesis is absent (dropped per delta §7)
 *   AC-CAT-PHASE4-CROSS-8: all Phase 4 entries have enabledByUser=true
 *   AC-CAT-PHASE4-CROSS-9: all Phase 4 entries have activityNumber=null
 *   AC-CAT-PHASE4-CROSS-10: all Phase 4 entries have version=1
 *   AC-CAT-PHASE4-CROSS-11: all Phase 4 entries have isNonOptional=false
 *   AC-CAT-PHASE4-CROSS-12: all Phase 4 entries have projectTypeBinding=null
 *   AC-CAT-PHASE4-CROSS-13: all Phase 4 entries have phaseBinding=null
 *   AC-CAT-PHASE4-CROSS-14: all Phase 4 entries have dependsOn=[]
 *   AC-CAT-PHASE4-CROSS-15: all Phase 4 entries have non-empty appliesToRoles
 *   AC-CAT-PHASE4-CROSS-16: all Phase 4 entries have outputArtifact.required=true
 *   AC-CAT-PHASE4-CROSS-17: DMAIC count is still 23 — no new DMAIC-specific entries in Phase 4
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { buildCatalog } from '../../js/catalog/seed/index.js';
import { Cadence } from '../../js/domain/types.js';

const VALID_CADENCES = new Set(Object.values(Cadence));

// ─── gen_project_kickoff ─────────────────────────────────────────────────────

describe('Phase 4 catalog additions — gen_project_kickoff', () => {
  const catalog = buildCatalog();
  const entry = catalog.find((e) => e.id === 'gen_project_kickoff');

  // AC-CAT-gen_project_kickoff-1
  test('AC-1: entry exists with id gen_project_kickoff', () => {
    assert.ok(entry, 'gen_project_kickoff must exist in compiled catalog');
    assert.equal(entry.id, 'gen_project_kickoff');
  });

  // AC-CAT-gen_project_kickoff-2
  test('AC-2: bucket is PROJECT', () => {
    assert.equal(entry.bucket, 'PROJECT');
  });

  // AC-CAT-gen_project_kickoff-3
  test('AC-3: procedure is a non-empty array (3–7 steps)', () => {
    assert.ok(Array.isArray(entry.procedure), 'procedure must be an array');
    assert.ok(
      entry.procedure.length >= 3,
      `procedure must have at least 3 steps; got ${entry.procedure.length}`
    );
    assert.ok(
      entry.procedure.length <= 7,
      `procedure must have at most 7 steps; got ${entry.procedure.length}`
    );
  });

  // AC-CAT-gen_project_kickoff-4
  test('AC-4: cadence is a valid Cadence value', () => {
    assert.ok(
      VALID_CADENCES.has(entry.cadence),
      `cadence "${entry.cadence}" must be one of ${[...VALID_CADENCES].join(', ')}`
    );
  });

  // AC-CAT-gen_project_kickoff-5
  test('AC-5: outputArtifact.schema is a non-empty string', () => {
    assert.equal(typeof entry.outputArtifact.schema, 'string');
    assert.ok(entry.outputArtifact.schema.length > 0, 'outputArtifact.schema must not be empty');
  });

  // AC-CAT-gen_project_kickoff-6
  test('AC-6: defaultDurationMinutes is a positive integer', () => {
    assert.equal(typeof entry.defaultDurationMinutes, 'number');
    assert.ok(Number.isInteger(entry.defaultDurationMinutes), 'defaultDurationMinutes must be an integer');
    assert.ok(entry.defaultDurationMinutes > 0, 'defaultDurationMinutes must be positive');
  });
});

// ─── gen_improvement_experiment_log ──────────────────────────────────────────

describe('Phase 4 catalog additions — gen_improvement_experiment_log', () => {
  const catalog = buildCatalog();
  const entry = catalog.find((e) => e.id === 'gen_improvement_experiment_log');

  // AC-CAT-gen_improvement_experiment_log-1
  test('AC-1: entry exists with id gen_improvement_experiment_log', () => {
    assert.ok(entry, 'gen_improvement_experiment_log must exist in compiled catalog');
    assert.equal(entry.id, 'gen_improvement_experiment_log');
  });

  // AC-CAT-gen_improvement_experiment_log-2
  test('AC-2: bucket is CI', () => {
    assert.equal(entry.bucket, 'CI');
  });

  // AC-CAT-gen_improvement_experiment_log-3
  test('AC-3: procedure is a non-empty array (3–7 steps)', () => {
    assert.ok(Array.isArray(entry.procedure), 'procedure must be an array');
    assert.ok(
      entry.procedure.length >= 3,
      `procedure must have at least 3 steps; got ${entry.procedure.length}`
    );
    assert.ok(
      entry.procedure.length <= 7,
      `procedure must have at most 7 steps; got ${entry.procedure.length}`
    );
  });

  // AC-CAT-gen_improvement_experiment_log-4
  test('AC-4: cadence is a valid Cadence value', () => {
    assert.ok(
      VALID_CADENCES.has(entry.cadence),
      `cadence "${entry.cadence}" must be one of ${[...VALID_CADENCES].join(', ')}`
    );
  });

  // AC-CAT-gen_improvement_experiment_log-5
  test('AC-5: outputArtifact.schema is a non-empty string', () => {
    assert.equal(typeof entry.outputArtifact.schema, 'string');
    assert.ok(entry.outputArtifact.schema.length > 0, 'outputArtifact.schema must not be empty');
  });

  // AC-CAT-gen_improvement_experiment_log-6
  test('AC-6: defaultDurationMinutes is a positive integer', () => {
    assert.equal(typeof entry.defaultDurationMinutes, 'number');
    assert.ok(Number.isInteger(entry.defaultDurationMinutes), 'defaultDurationMinutes must be an integer');
    assert.ok(entry.defaultDurationMinutes > 0, 'defaultDurationMinutes must be positive');
  });
});

// ─── gen_focus_metrics_review ────────────────────────────────────────────────

describe('Phase 4 catalog additions — gen_focus_metrics_review', () => {
  const catalog = buildCatalog();
  const entry = catalog.find((e) => e.id === 'gen_focus_metrics_review');

  // AC-CAT-gen_focus_metrics_review-1
  test('AC-1: entry exists with id gen_focus_metrics_review', () => {
    assert.ok(entry, 'gen_focus_metrics_review must exist in compiled catalog');
    assert.equal(entry.id, 'gen_focus_metrics_review');
  });

  // AC-CAT-gen_focus_metrics_review-2
  test('AC-2: bucket is CI', () => {
    assert.equal(entry.bucket, 'CI');
  });

  // AC-CAT-gen_focus_metrics_review-3
  test('AC-3: procedure is a non-empty array (3–7 steps)', () => {
    assert.ok(Array.isArray(entry.procedure), 'procedure must be an array');
    assert.ok(
      entry.procedure.length >= 3,
      `procedure must have at least 3 steps; got ${entry.procedure.length}`
    );
    assert.ok(
      entry.procedure.length <= 7,
      `procedure must have at most 7 steps; got ${entry.procedure.length}`
    );
  });

  // AC-CAT-gen_focus_metrics_review-4
  test('AC-4: cadence is a valid Cadence value', () => {
    assert.ok(
      VALID_CADENCES.has(entry.cadence),
      `cadence "${entry.cadence}" must be one of ${[...VALID_CADENCES].join(', ')}`
    );
  });

  // AC-CAT-gen_focus_metrics_review-5
  test('AC-5: outputArtifact.schema is a non-empty string', () => {
    assert.equal(typeof entry.outputArtifact.schema, 'string');
    assert.ok(entry.outputArtifact.schema.length > 0, 'outputArtifact.schema must not be empty');
  });

  // AC-CAT-gen_focus_metrics_review-6
  test('AC-6: defaultDurationMinutes is a positive integer', () => {
    assert.equal(typeof entry.defaultDurationMinutes, 'number');
    assert.ok(Number.isInteger(entry.defaultDurationMinutes), 'defaultDurationMinutes must be an integer');
    assert.ok(entry.defaultDurationMinutes > 0, 'defaultDurationMinutes must be positive');
  });
});

// ─── gen_personal_kanban_review ──────────────────────────────────────────────

describe('Phase 4 catalog additions — gen_personal_kanban_review', () => {
  const catalog = buildCatalog();
  const entry = catalog.find((e) => e.id === 'gen_personal_kanban_review');

  // AC-CAT-gen_personal_kanban_review-1
  test('AC-1: entry exists with id gen_personal_kanban_review', () => {
    assert.ok(entry, 'gen_personal_kanban_review must exist in compiled catalog');
    assert.equal(entry.id, 'gen_personal_kanban_review');
  });

  // AC-CAT-gen_personal_kanban_review-2
  test('AC-2: bucket is CI', () => {
    assert.equal(entry.bucket, 'CI');
  });

  // AC-CAT-gen_personal_kanban_review-3
  test('AC-3: procedure is a non-empty array (3–7 steps)', () => {
    assert.ok(Array.isArray(entry.procedure), 'procedure must be an array');
    assert.ok(
      entry.procedure.length >= 3,
      `procedure must have at least 3 steps; got ${entry.procedure.length}`
    );
    assert.ok(
      entry.procedure.length <= 7,
      `procedure must have at most 7 steps; got ${entry.procedure.length}`
    );
  });

  // AC-CAT-gen_personal_kanban_review-4
  test('AC-4: cadence is a valid Cadence value', () => {
    assert.ok(
      VALID_CADENCES.has(entry.cadence),
      `cadence "${entry.cadence}" must be one of ${[...VALID_CADENCES].join(', ')}`
    );
  });

  // AC-CAT-gen_personal_kanban_review-5
  test('AC-5: outputArtifact.schema is a non-empty string', () => {
    assert.equal(typeof entry.outputArtifact.schema, 'string');
    assert.ok(entry.outputArtifact.schema.length > 0, 'outputArtifact.schema must not be empty');
  });

  // AC-CAT-gen_personal_kanban_review-6
  test('AC-6: defaultDurationMinutes is a positive integer', () => {
    assert.equal(typeof entry.defaultDurationMinutes, 'number');
    assert.ok(Number.isInteger(entry.defaultDurationMinutes), 'defaultDurationMinutes must be an integer');
    assert.ok(entry.defaultDurationMinutes > 0, 'defaultDurationMinutes must be positive');
  });
});

// ─── Cross-cutting validations ────────────────────────────────────────────────

describe('Phase 4 catalog additions — cross-cutting', () => {
  const catalog = buildCatalog();

  const PHASE4_IDS = [
    'gen_project_kickoff',
    'gen_improvement_experiment_log',
    'gen_focus_metrics_review',
    'gen_personal_kanban_review'
  ];

  const PRIOR_PHASE_IDS = new Set([
    // Phase 1 convergent Tier 1
    'gen_structured_one_on_one',
    'gen_stakeholder_status_report',
    'gen_monthly_ci_review',
    'gen_5_whys',
    // Phase 2 PM-unique + Research-unique Tier 1
    'gen_decision_meeting',
    'gen_dmaic_control_plan',
    'gen_project_charter',
    'gen_standard_work_update',
    'gen_time_block_planning',
    'gen_constraint_identification',
    // Phase 3 Tier 2
    'gen_pre_meeting_prep',
    'gen_crucial_conversation_prep',
    'gen_async_written_update',
    'gen_habit_streak_review',
    'gen_hansei',
    'gen_external_sync',
    'gen_incident_comms',
    'gen_learning_debrief',
    'gen_project_closure',
    'gen_technical_spec_authoring'
  ]);

  // AC-CAT-PHASE4-CROSS-1
  test('AC-CROSS-1: all 4 Phase 4 entries have unique IDs', () => {
    assert.equal(
      new Set(PHASE4_IDS).size,
      PHASE4_IDS.length,
      'Phase 4 IDs must be unique; found duplicates'
    );
  });

  // AC-CAT-PHASE4-CROSS-2
  test('AC-CROSS-2: no Phase 4 entry has the same ID as a prior-phase entry', () => {
    const overlaps = PHASE4_IDS.filter((id) => PRIOR_PHASE_IDS.has(id));
    assert.deepEqual(
      overlaps,
      [],
      `Phase 4 IDs must not overlap with Phase 1/2/3: ${overlaps.join(', ')}`
    );
  });

  // AC-CAT-PHASE4-CROSS-3
  test('AC-CROSS-3: total catalog size is 85', () => {
    assert.equal(catalog.length, 85, `expected 85 entries, got ${catalog.length}`);
  });

  // AC-CAT-PHASE4-CROSS-4
  test('AC-CROSS-4: COMMUNICATION bucket has 16 entries (unchanged — no Tier 3 COMM entries in Phase 4)', () => {
    const commEntries = catalog.filter((e) => e.bucket === 'COMMUNICATION');
    assert.equal(
      commEntries.length,
      16,
      `COMMUNICATION bucket should have 16 entries; got ${commEntries.length}`
    );
  });

  // AC-CAT-PHASE4-CROSS-5
  test('AC-CROSS-5: CI bucket has 30 entries (+3 from Phase 4: improvement_experiment_log, focus_metrics_review, personal_kanban_review)', () => {
    const ciEntries = catalog.filter((e) => e.bucket === 'CI');
    assert.equal(
      ciEntries.length,
      30,
      `CI bucket should have 30 entries; got ${ciEntries.length}`
    );
  });

  // AC-CAT-PHASE4-CROSS-6
  test('AC-CROSS-6: PROJECT bucket has 38 entries (+1 from Phase 4: gen_project_kickoff)', () => {
    const projectEntries = catalog.filter((e) => e.bucket === 'PROJECT');
    assert.equal(
      projectEntries.length,
      38,
      `PROJECT bucket should have 38 entries; got ${projectEntries.length}`
    );
  });

  // AC-CAT-PHASE4-CROSS-7
  test('AC-CROSS-7: gen_reading_for_synthesis is absent (dropped — consolidated into gen_learning_debrief Phase 3)', () => {
    const catalogIds = new Set(catalog.map((e) => e.id));
    assert.ok(
      !catalogIds.has('gen_reading_for_synthesis'),
      'gen_reading_for_synthesis must NOT be in catalog (dropped per delta §7)'
    );
  });

  // AC-CAT-PHASE4-CROSS-8
  test('AC-CROSS-8: all Phase 4 entries have enabledByUser=true', () => {
    for (const id of PHASE4_IDS) {
      const e = catalog.find((c) => c.id === id);
      assert.ok(e, `${id} not found in catalog`);
      assert.equal(e.enabledByUser, true, `${id} must have enabledByUser=true`);
    }
  });

  // AC-CAT-PHASE4-CROSS-9
  test('AC-CROSS-9: all Phase 4 entries have activityNumber=null', () => {
    for (const id of PHASE4_IDS) {
      const e = catalog.find((c) => c.id === id);
      assert.ok(e, `${id} not found in catalog`);
      assert.equal(e.activityNumber, null, `${id} must have activityNumber=null`);
    }
  });

  // AC-CAT-PHASE4-CROSS-10
  test('AC-CROSS-10: all Phase 4 entries have version=1', () => {
    for (const id of PHASE4_IDS) {
      const e = catalog.find((c) => c.id === id);
      assert.ok(e, `${id} not found in catalog`);
      assert.equal(e.version, 1, `${id} must have version=1`);
    }
  });

  // AC-CAT-PHASE4-CROSS-11
  test('AC-CROSS-11: all Phase 4 entries have isNonOptional=false', () => {
    for (const id of PHASE4_IDS) {
      const e = catalog.find((c) => c.id === id);
      assert.ok(e, `${id} not found in catalog`);
      assert.equal(e.isNonOptional, false, `${id} must have isNonOptional=false`);
    }
  });

  // AC-CAT-PHASE4-CROSS-12
  test('AC-CROSS-12: all Phase 4 entries have projectTypeBinding=null (none are DMAIC-specific)', () => {
    for (const id of PHASE4_IDS) {
      const e = catalog.find((c) => c.id === id);
      assert.ok(e, `${id} not found in catalog`);
      assert.equal(e.projectTypeBinding, null, `${id} must have projectTypeBinding=null`);
    }
  });

  // AC-CAT-PHASE4-CROSS-13
  test('AC-CROSS-13: all Phase 4 entries have phaseBinding=null', () => {
    for (const id of PHASE4_IDS) {
      const e = catalog.find((c) => c.id === id);
      assert.ok(e, `${id} not found in catalog`);
      assert.equal(e.phaseBinding, null, `${id} must have phaseBinding=null`);
    }
  });

  // AC-CAT-PHASE4-CROSS-14
  test('AC-CROSS-14: all Phase 4 entries have dependsOn=[] (cross-bucket wiring deferred to Phase 5)', () => {
    for (const id of PHASE4_IDS) {
      const e = catalog.find((c) => c.id === id);
      assert.ok(e, `${id} not found in catalog`);
      assert.ok(Array.isArray(e.dependsOn), `${id} dependsOn must be an array`);
      assert.equal(e.dependsOn.length, 0, `${id} dependsOn must be empty for Phase 4`);
    }
  });

  // AC-CAT-PHASE4-CROSS-15
  test('AC-CROSS-15: all Phase 4 entries have non-empty appliesToRoles', () => {
    for (const id of PHASE4_IDS) {
      const e = catalog.find((c) => c.id === id);
      assert.ok(e, `${id} not found in catalog`);
      assert.ok(
        Array.isArray(e.appliesToRoles) && e.appliesToRoles.length > 0,
        `${id} must have at least one appliesToRoles value`
      );
    }
  });

  // AC-CAT-PHASE4-CROSS-16
  test('AC-CROSS-16: all Phase 4 entries have outputArtifact.required=true', () => {
    for (const id of PHASE4_IDS) {
      const e = catalog.find((c) => c.id === id);
      assert.ok(e, `${id} not found in catalog`);
      assert.equal(
        e.outputArtifact.required,
        true,
        `${id} outputArtifact.required must be true`
      );
    }
  });

  // AC-CAT-PHASE4-CROSS-17
  test('AC-CROSS-17: DMAIC count is still 23 — no new DMAIC-specific entries in Phase 4', () => {
    const dmaicEntries = catalog.filter((e) => e.projectTypeBinding === 'DMAIC');
    assert.equal(
      dmaicEntries.length,
      23,
      `DMAIC count must remain 23; got ${dmaicEntries.length}`
    );
  });

  // Additional: verify all catalog IDs remain globally unique after Phase 4
  test('all catalog IDs remain globally unique after Phase 4 additions', () => {
    const allIds = catalog.map((e) => e.id);
    const uniqueIds = new Set(allIds);
    assert.equal(uniqueIds.size, allIds.length, 'All catalog ids must be unique after Phase 4');
  });
});
