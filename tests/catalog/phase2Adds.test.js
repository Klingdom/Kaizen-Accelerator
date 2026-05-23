/**
 * Phase 2 catalog additions — acceptance tests.
 *
 * Covers the 6 lens-unique Tier 1 entries dispatched per CATALOG_GAP_DELTA.md §10 Phase 2:
 *
 * PM-unique (catalog-aware gaps):
 *   - gen_decision_meeting          (COMMUNICATION, event-driven)
 *   - gen_dmaic_control_plan        (PROJECT, event-driven, DMAIC-bound)
 *   - gen_project_charter           (PROJECT, event-driven)
 *   - gen_standard_work_update      (CI, event-driven)
 *
 * Research-unique (industry-canonical):
 *   - gen_time_block_planning       (PROJECT, weekly — Newport "Deep Work")
 *   - gen_constraint_identification (CI, monthly — Goldratt TOC Five Focusing Steps)
 *
 * Per-entry tests (6 ACs each):
 *   AC-CAT-{ID}-1: entry exists in compiled catalog with expected id
 *   AC-CAT-{ID}-2: bucket matches expectation
 *   AC-CAT-{ID}-3: procedure is a non-empty array (3–7 steps)
 *   AC-CAT-{ID}-4: cadence is valid (one of the Cadence enum values)
 *   AC-CAT-{ID}-5: outputArtifact.schema is a non-empty string
 *   AC-CAT-{ID}-6: defaultDurationMinutes is a positive integer
 *
 * Cross-cutting (3 ACs):
 *   AC-CAT-PHASE2-CROSS-1: all 6 new entries have unique IDs
 *   AC-CAT-PHASE2-CROSS-2: no Phase 2 entry has the same ID as a Phase 1 or pre-existing entry
 *   AC-CAT-PHASE2-CROSS-3: total catalog size is 71
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { buildCatalog } from '../../js/catalog/seed/index.js';
import { Cadence } from '../../js/domain/types.js';

const VALID_CADENCES = new Set(Object.values(Cadence));

// ─── gen_decision_meeting ────────────────────────────────────────────────────

describe('Phase 2 catalog additions — gen_decision_meeting', () => {
  const catalog = buildCatalog();
  const entry = catalog.find((e) => e.id === 'gen_decision_meeting');

  // AC-CAT-gen_decision_meeting-1
  test('AC-1: entry exists with id gen_decision_meeting', () => {
    assert.ok(entry, 'gen_decision_meeting must exist in compiled catalog');
    assert.equal(entry.id, 'gen_decision_meeting');
  });

  // AC-CAT-gen_decision_meeting-2
  test('AC-2: bucket is COMMUNICATION', () => {
    assert.equal(entry.bucket, 'COMMUNICATION');
  });

  // AC-CAT-gen_decision_meeting-3
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

  // AC-CAT-gen_decision_meeting-4
  test('AC-4: cadence is a valid Cadence value', () => {
    assert.ok(
      VALID_CADENCES.has(entry.cadence),
      `cadence "${entry.cadence}" must be one of ${[...VALID_CADENCES].join(', ')}`
    );
  });

  // AC-CAT-gen_decision_meeting-5
  test('AC-5: outputArtifact.schema is a non-empty string', () => {
    assert.equal(typeof entry.outputArtifact.schema, 'string');
    assert.ok(entry.outputArtifact.schema.length > 0, 'outputArtifact.schema must not be empty');
  });

  // AC-CAT-gen_decision_meeting-6
  test('AC-6: defaultDurationMinutes is a positive integer', () => {
    assert.equal(typeof entry.defaultDurationMinutes, 'number');
    assert.ok(Number.isInteger(entry.defaultDurationMinutes), 'defaultDurationMinutes must be an integer');
    assert.ok(entry.defaultDurationMinutes > 0, 'defaultDurationMinutes must be positive');
  });
});

// ─── gen_dmaic_control_plan ──────────────────────────────────────────────────

describe('Phase 2 catalog additions — gen_dmaic_control_plan', () => {
  const catalog = buildCatalog();
  const entry = catalog.find((e) => e.id === 'gen_dmaic_control_plan');

  // AC-CAT-gen_dmaic_control_plan-1
  test('AC-1: entry exists with id gen_dmaic_control_plan', () => {
    assert.ok(entry, 'gen_dmaic_control_plan must exist in compiled catalog');
    assert.equal(entry.id, 'gen_dmaic_control_plan');
  });

  // AC-CAT-gen_dmaic_control_plan-2
  test('AC-2: bucket is PROJECT', () => {
    assert.equal(entry.bucket, 'PROJECT');
  });

  // AC-CAT-gen_dmaic_control_plan-3
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

  // AC-CAT-gen_dmaic_control_plan-4
  test('AC-4: cadence is a valid Cadence value', () => {
    assert.ok(
      VALID_CADENCES.has(entry.cadence),
      `cadence "${entry.cadence}" must be one of ${[...VALID_CADENCES].join(', ')}`
    );
  });

  // AC-CAT-gen_dmaic_control_plan-5
  test('AC-5: outputArtifact.schema is a non-empty string', () => {
    assert.equal(typeof entry.outputArtifact.schema, 'string');
    assert.ok(entry.outputArtifact.schema.length > 0, 'outputArtifact.schema must not be empty');
  });

  // AC-CAT-gen_dmaic_control_plan-6
  test('AC-6: defaultDurationMinutes is a positive integer', () => {
    assert.equal(typeof entry.defaultDurationMinutes, 'number');
    assert.ok(Number.isInteger(entry.defaultDurationMinutes), 'defaultDurationMinutes must be an integer');
    assert.ok(entry.defaultDurationMinutes > 0, 'defaultDurationMinutes must be positive');
  });

  // DMAIC-specific assertions
  test('AC-DMAIC: projectTypeBinding is DMAIC', () => {
    assert.equal(entry.projectTypeBinding, 'DMAIC', 'gen_dmaic_control_plan must be DMAIC-bound');
  });

  test('AC-DMAIC: phaseBinding is PHASE_4 (Control phase)', () => {
    assert.equal(entry.phaseBinding, 'PHASE_4', 'gen_dmaic_control_plan must bind to PHASE_4 (Control)');
  });
});

// ─── gen_project_charter ─────────────────────────────────────────────────────

describe('Phase 2 catalog additions — gen_project_charter', () => {
  const catalog = buildCatalog();
  const entry = catalog.find((e) => e.id === 'gen_project_charter');

  // AC-CAT-gen_project_charter-1
  test('AC-1: entry exists with id gen_project_charter', () => {
    assert.ok(entry, 'gen_project_charter must exist in compiled catalog');
    assert.equal(entry.id, 'gen_project_charter');
  });

  // AC-CAT-gen_project_charter-2
  test('AC-2: bucket is PROJECT', () => {
    assert.equal(entry.bucket, 'PROJECT');
  });

  // AC-CAT-gen_project_charter-3
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

  // AC-CAT-gen_project_charter-4
  test('AC-4: cadence is a valid Cadence value', () => {
    assert.ok(
      VALID_CADENCES.has(entry.cadence),
      `cadence "${entry.cadence}" must be one of ${[...VALID_CADENCES].join(', ')}`
    );
  });

  // AC-CAT-gen_project_charter-5
  test('AC-5: outputArtifact.schema is a non-empty string', () => {
    assert.equal(typeof entry.outputArtifact.schema, 'string');
    assert.ok(entry.outputArtifact.schema.length > 0, 'outputArtifact.schema must not be empty');
  });

  // AC-CAT-gen_project_charter-6
  test('AC-6: defaultDurationMinutes is a positive integer', () => {
    assert.equal(typeof entry.defaultDurationMinutes, 'number');
    assert.ok(Number.isInteger(entry.defaultDurationMinutes), 'defaultDurationMinutes must be an integer');
    assert.ok(entry.defaultDurationMinutes > 0, 'defaultDurationMinutes must be positive');
  });

  // General project (non-DMAIC/non-Kaizen) — no type binding
  test('AC-GENERAL: projectTypeBinding is null (general, non-type-specific)', () => {
    assert.equal(entry.projectTypeBinding, null, 'gen_project_charter must have projectTypeBinding === null');
  });
});

// ─── gen_standard_work_update ────────────────────────────────────────────────

describe('Phase 2 catalog additions — gen_standard_work_update', () => {
  const catalog = buildCatalog();
  const entry = catalog.find((e) => e.id === 'gen_standard_work_update');

  // AC-CAT-gen_standard_work_update-1
  test('AC-1: entry exists with id gen_standard_work_update', () => {
    assert.ok(entry, 'gen_standard_work_update must exist in compiled catalog');
    assert.equal(entry.id, 'gen_standard_work_update');
  });

  // AC-CAT-gen_standard_work_update-2
  test('AC-2: bucket is CI', () => {
    assert.equal(entry.bucket, 'CI');
  });

  // AC-CAT-gen_standard_work_update-3
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

  // AC-CAT-gen_standard_work_update-4
  test('AC-4: cadence is a valid Cadence value', () => {
    assert.ok(
      VALID_CADENCES.has(entry.cadence),
      `cadence "${entry.cadence}" must be one of ${[...VALID_CADENCES].join(', ')}`
    );
  });

  // AC-CAT-gen_standard_work_update-5
  test('AC-5: outputArtifact.schema is a non-empty string', () => {
    assert.equal(typeof entry.outputArtifact.schema, 'string');
    assert.ok(entry.outputArtifact.schema.length > 0, 'outputArtifact.schema must not be empty');
  });

  // AC-CAT-gen_standard_work_update-6
  test('AC-6: defaultDurationMinutes is a positive integer', () => {
    assert.equal(typeof entry.defaultDurationMinutes, 'number');
    assert.ok(Number.isInteger(entry.defaultDurationMinutes), 'defaultDurationMinutes must be an integer');
    assert.ok(entry.defaultDurationMinutes > 0, 'defaultDurationMinutes must be positive');
  });
});

// ─── gen_time_block_planning ─────────────────────────────────────────────────

describe('Phase 2 catalog additions — gen_time_block_planning', () => {
  const catalog = buildCatalog();
  const entry = catalog.find((e) => e.id === 'gen_time_block_planning');

  // AC-CAT-gen_time_block_planning-1
  test('AC-1: entry exists with id gen_time_block_planning', () => {
    assert.ok(entry, 'gen_time_block_planning must exist in compiled catalog');
    assert.equal(entry.id, 'gen_time_block_planning');
  });

  // AC-CAT-gen_time_block_planning-2
  test('AC-2: bucket is PROJECT', () => {
    assert.equal(entry.bucket, 'PROJECT');
  });

  // AC-CAT-gen_time_block_planning-3
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

  // AC-CAT-gen_time_block_planning-4
  test('AC-4: cadence is WEEKLY (Newport weekly planning ritual)', () => {
    assert.ok(
      VALID_CADENCES.has(entry.cadence),
      `cadence "${entry.cadence}" must be one of ${[...VALID_CADENCES].join(', ')}`
    );
    assert.equal(entry.cadence, 'WEEKLY', 'gen_time_block_planning must have WEEKLY cadence');
  });

  // AC-CAT-gen_time_block_planning-5
  test('AC-5: outputArtifact.schema is a non-empty string', () => {
    assert.equal(typeof entry.outputArtifact.schema, 'string');
    assert.ok(entry.outputArtifact.schema.length > 0, 'outputArtifact.schema must not be empty');
  });

  // AC-CAT-gen_time_block_planning-6
  test('AC-6: defaultDurationMinutes is a positive integer', () => {
    assert.equal(typeof entry.defaultDurationMinutes, 'number');
    assert.ok(Number.isInteger(entry.defaultDurationMinutes), 'defaultDurationMinutes must be an integer');
    assert.ok(entry.defaultDurationMinutes > 0, 'defaultDurationMinutes must be positive');
  });
});

// ─── gen_constraint_identification ──────────────────────────────────────────

describe('Phase 2 catalog additions — gen_constraint_identification', () => {
  const catalog = buildCatalog();
  const entry = catalog.find((e) => e.id === 'gen_constraint_identification');

  // AC-CAT-gen_constraint_identification-1
  test('AC-1: entry exists with id gen_constraint_identification', () => {
    assert.ok(entry, 'gen_constraint_identification must exist in compiled catalog');
    assert.equal(entry.id, 'gen_constraint_identification');
  });

  // AC-CAT-gen_constraint_identification-2
  test('AC-2: bucket is CI', () => {
    assert.equal(entry.bucket, 'CI');
  });

  // AC-CAT-gen_constraint_identification-3
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

  // AC-CAT-gen_constraint_identification-4
  test('AC-4: cadence is MONTHLY (Goldratt TOC monthly diagnostic)', () => {
    assert.ok(
      VALID_CADENCES.has(entry.cadence),
      `cadence "${entry.cadence}" must be one of ${[...VALID_CADENCES].join(', ')}`
    );
    assert.equal(entry.cadence, 'MONTHLY', 'gen_constraint_identification must have MONTHLY cadence');
  });

  // AC-CAT-gen_constraint_identification-5
  test('AC-5: outputArtifact.schema is a non-empty string', () => {
    assert.equal(typeof entry.outputArtifact.schema, 'string');
    assert.ok(entry.outputArtifact.schema.length > 0, 'outputArtifact.schema must not be empty');
  });

  // AC-CAT-gen_constraint_identification-6
  test('AC-6: defaultDurationMinutes is a positive integer', () => {
    assert.equal(typeof entry.defaultDurationMinutes, 'number');
    assert.ok(Number.isInteger(entry.defaultDurationMinutes), 'defaultDurationMinutes must be an integer');
    assert.ok(entry.defaultDurationMinutes > 0, 'defaultDurationMinutes must be positive');
  });
});

// ─── Cross-cutting ───────────────────────────────────────────────────────────

describe('Phase 2 catalog additions — cross-cutting', () => {
  const catalog = buildCatalog();

  const PHASE2_IDS = [
    'gen_decision_meeting',
    'gen_dmaic_control_plan',
    'gen_project_charter',
    'gen_standard_work_update',
    'gen_time_block_planning',
    'gen_constraint_identification'
  ];

  const PHASE1_AND_PREEXISTING_IDS = new Set([
    'gen_structured_one_on_one',
    'gen_stakeholder_status_report',
    'gen_monthly_ci_review',
    'gen_5_whys',
    'gen_deep_work_project',
    'gen_value_added_communication',
    'gen_end_of_activity_reflection',
    'gen_weekly_reflection',
    'gen_lessons_learned',
    'recovery_lunch'
  ]);

  // AC-CAT-PHASE2-CROSS-1
  test('AC-CAT-PHASE2-CROSS-1: all 6 Phase 2 entries are present in the catalog', () => {
    const ids = new Set(catalog.map((e) => e.id));
    for (const id of PHASE2_IDS) {
      assert.ok(ids.has(id), `Phase 2 entry ${id} must be in the catalog`);
    }
  });

  // AC-CAT-PHASE2-CROSS-2 (uniqueness within Phase 2)
  test('AC-CAT-PHASE2-CROSS-2: Phase 2 entries have unique IDs (no duplicates introduced by Phase 2)', () => {
    const phase2Set = new Set(PHASE2_IDS);
    assert.equal(
      phase2Set.size,
      PHASE2_IDS.length,
      'Phase 2 IDs must all be unique among themselves'
    );
  });

  // AC-CAT-PHASE2-CROSS-2b (no collision with Phase 1 or pre-existing)
  test('AC-CAT-PHASE2-CROSS-2b: no Phase 2 ID collides with a Phase 1 or pre-existing entry ID', () => {
    for (const id of PHASE2_IDS) {
      assert.ok(
        !PHASE1_AND_PREEXISTING_IDS.has(id),
        `Phase 2 id ${id} must not collide with Phase 1 or pre-existing entry`
      );
    }
  });

  // AC-CAT-PHASE2-CROSS-3
  test('AC-CAT-PHASE2-CROSS-3: total catalog size is 85 (Phase 3 +10 + Phase 4 +4 added after Phase 2)', () => {
    assert.equal(catalog.length, 85, `expected 85 entries; got ${catalog.length}`);
  });

  test('all catalog IDs remain globally unique after Phase 2 additions', () => {
    const allIds = catalog.map((e) => e.id);
    const uniqueIds = new Set(allIds);
    assert.equal(uniqueIds.size, allIds.length, 'All catalog ids must be unique after Phase 2');
  });

  test('Phase 2 entries all have activityNumber === null (gen_ entries have no numbered activity)', () => {
    for (const id of PHASE2_IDS) {
      const entry = catalog.find((e) => e.id === id);
      assert.equal(entry.activityNumber, null, `${id} must have activityNumber === null`);
    }
  });

  test('Phase 2 entries all have isNonOptional === false (optional by default)', () => {
    for (const id of PHASE2_IDS) {
      const entry = catalog.find((e) => e.id === id);
      assert.equal(entry.isNonOptional, false, `${id} must be optional (isNonOptional === false)`);
    }
  });

  test('Phase 2 entries all have dependsOn as an array (Phase 5 wires edges)', () => {
    for (const id of PHASE2_IDS) {
      const entry = catalog.find((e) => e.id === id);
      assert.ok(Array.isArray(entry.dependsOn), `${id} dependsOn must be an array`);
    }
  });

  test('Phase 2 entries all have enabledByUser === true (generics convention)', () => {
    for (const id of PHASE2_IDS) {
      const entry = catalog.find((e) => e.id === id);
      assert.equal(entry.enabledByUser, true, `${id} must have enabledByUser === true`);
    }
  });

  test('Phase 2 entries all have version === 1', () => {
    for (const id of PHASE2_IDS) {
      const entry = catalog.find((e) => e.id === id);
      assert.equal(entry.version, 1, `${id} must have version === 1`);
    }
  });

  test('COMMUNICATION bucket now has at least 11 entries (was 10 after Phase 1)', () => {
    const commEntries = catalog.filter((e) => e.bucket === 'COMMUNICATION');
    assert.ok(
      commEntries.length >= 11,
      `COMMUNICATION bucket must have at least 11 entries; got ${commEntries.length}`
    );
  });

  test('PROJECT bucket now has at least 35 entries (was 32 before Phase 2)', () => {
    const projectEntries = catalog.filter((e) => e.bucket === 'PROJECT');
    assert.ok(
      projectEntries.length >= 35,
      `PROJECT bucket must have at least 35 entries; got ${projectEntries.length}`
    );
  });

  test('CI bucket now has at least 24 entries (was 22 after Phase 1)', () => {
    const ciEntries = catalog.filter((e) => e.bucket === 'CI');
    assert.ok(
      ciEntries.length >= 24,
      `CI bucket must have at least 24 entries; got ${ciEntries.length}`
    );
  });

  test('gen_dmaic_control_plan is the only Phase 2 entry with a non-null phaseBinding', () => {
    for (const id of PHASE2_IDS) {
      const entry = catalog.find((e) => e.id === id);
      if (id === 'gen_dmaic_control_plan') {
        assert.notEqual(entry.phaseBinding, null, 'gen_dmaic_control_plan must have a non-null phaseBinding');
      } else {
        assert.equal(entry.phaseBinding, null, `${id} must have phaseBinding === null`);
      }
    }
  });

  test('gen_dmaic_control_plan is the only Phase 2 entry with a non-null projectTypeBinding', () => {
    for (const id of PHASE2_IDS) {
      const entry = catalog.find((e) => e.id === id);
      if (id === 'gen_dmaic_control_plan') {
        assert.equal(entry.projectTypeBinding, 'DMAIC', 'gen_dmaic_control_plan must be DMAIC-bound');
      } else {
        assert.equal(entry.projectTypeBinding, null, `${id} must have projectTypeBinding === null`);
      }
    }
  });

  test('Phase 2 entries all have sourceRef as a non-empty string', () => {
    for (const id of PHASE2_IDS) {
      const entry = catalog.find((e) => e.id === id);
      assert.equal(typeof entry.sourceRef, 'string', `${id} sourceRef must be a string`);
      assert.ok(entry.sourceRef.length > 0, `${id} sourceRef must not be empty`);
    }
  });

  test('Phase 2 entries all have appliesToRoles as a non-empty array', () => {
    for (const id of PHASE2_IDS) {
      const entry = catalog.find((e) => e.id === id);
      assert.ok(Array.isArray(entry.appliesToRoles), `${id} appliesToRoles must be an array`);
      assert.ok(entry.appliesToRoles.length > 0, `${id} appliesToRoles must not be empty`);
    }
  });
});
