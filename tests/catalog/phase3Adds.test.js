/**
 * Phase 3 catalog additions — acceptance tests.
 *
 * Covers the 10 Tier 2 entries dispatched per CATALOG_GAP_DELTA.md §10 Phase 3
 * (consolidated from both lens artifacts after de-duplication per delta §6).
 *
 * Research-authored (5):
 *   - gen_pre_meeting_prep          (COMMUNICATION, event-driven — Lencioni "Death by Meeting")
 *   - gen_crucial_conversation_prep (COMMUNICATION, event-driven — Patterson STATE model)
 *   - gen_async_written_update      (COMMUNICATION, weekly    — GitLab Remote Playbook; SW-Q4 deferred)
 *   - gen_habit_streak_review       (CI, weekly               — Clear "Atomic Habits"; SW-Q5 deferred)
 *   - gen_hansei                    (CI, event-driven         — Liker "The Toyota Way" Prin. 14; SW-Q3 deferred)
 *
 * PM-authored (5):
 *   - gen_external_sync             (COMMUNICATION, event-driven — customer/vendor/partner sync)
 *   - gen_incident_comms            (COMMUNICATION, event-driven — crisis/incident comms protocol)
 *   - gen_learning_debrief          (CI, event-driven            — L&D close loop; absorbs gen_reading_for_synthesis)
 *   - gen_project_closure           (PROJECT, event-driven       — non-DMAIC/Kaizen closure gate)
 *   - gen_technical_spec_authoring  (PROJECT, event-driven       — knowledge-work deliverable standard)
 *
 * Dropped (covered by prior phases):
 *   - gen_weekly_project_status     — superseded by gen_stakeholder_status_report (Phase 1)
 *   - gen_annual_reflection         — consolidated into gen_hansei (delta §6)
 *   - gen_reading_for_synthesis     — consolidated into gen_learning_debrief (delta §6)
 *
 * Per-entry tests (~6 ACs each):
 *   AC-CAT-{ID}-1: entry exists in compiled catalog with expected id
 *   AC-CAT-{ID}-2: bucket matches expectation
 *   AC-CAT-{ID}-3: procedure is a non-empty array (3–7 steps)
 *   AC-CAT-{ID}-4: cadence is valid (one of the Cadence enum values)
 *   AC-CAT-{ID}-5: outputArtifact.schema is a non-empty string
 *   AC-CAT-{ID}-6: defaultDurationMinutes is a positive integer
 *
 * Cross-cutting (6 ACs):
 *   AC-CAT-PHASE3-CROSS-1: all 10 new entries have unique IDs
 *   AC-CAT-PHASE3-CROSS-2: no Phase 3 entry has the same ID as a Phase 1 or Phase 2 entry
 *   AC-CAT-PHASE3-CROSS-3: total catalog size is 85 (Phase 4 +4 added after Phase 3)
 *   AC-CAT-PHASE3-CROSS-4: COMMUNICATION bucket has 16 entries (unchanged in Phase 4)
 *   AC-CAT-PHASE3-CROSS-5: CI bucket has 30 entries (Phase 4 +3)
 *   AC-CAT-PHASE3-CROSS-6: PROJECT bucket has 38 entries (Phase 4 +1)
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { buildCatalog } from '../../js/catalog/seed/index.js';
import { Cadence } from '../../js/domain/types.js';

const VALID_CADENCES = new Set(Object.values(Cadence));

// ─── gen_pre_meeting_prep ────────────────────────────────────────────────────

describe('Phase 3 catalog additions — gen_pre_meeting_prep', () => {
  const catalog = buildCatalog();
  const entry = catalog.find((e) => e.id === 'gen_pre_meeting_prep');

  // AC-CAT-gen_pre_meeting_prep-1
  test('AC-1: entry exists with id gen_pre_meeting_prep', () => {
    assert.ok(entry, 'gen_pre_meeting_prep must exist in compiled catalog');
    assert.equal(entry.id, 'gen_pre_meeting_prep');
  });

  // AC-CAT-gen_pre_meeting_prep-2
  test('AC-2: bucket is COMMUNICATION', () => {
    assert.equal(entry.bucket, 'COMMUNICATION');
  });

  // AC-CAT-gen_pre_meeting_prep-3
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

  // AC-CAT-gen_pre_meeting_prep-4
  test('AC-4: cadence is a valid Cadence value', () => {
    assert.ok(
      VALID_CADENCES.has(entry.cadence),
      `cadence "${entry.cadence}" must be one of ${[...VALID_CADENCES].join(', ')}`
    );
  });

  // AC-CAT-gen_pre_meeting_prep-5
  test('AC-5: outputArtifact.schema is a non-empty string', () => {
    assert.equal(typeof entry.outputArtifact.schema, 'string');
    assert.ok(entry.outputArtifact.schema.length > 0, 'outputArtifact.schema must not be empty');
  });

  // AC-CAT-gen_pre_meeting_prep-6
  test('AC-6: defaultDurationMinutes is a positive integer', () => {
    assert.equal(typeof entry.defaultDurationMinutes, 'number');
    assert.ok(Number.isInteger(entry.defaultDurationMinutes), 'defaultDurationMinutes must be an integer');
    assert.ok(entry.defaultDurationMinutes > 0, 'defaultDurationMinutes must be positive');
  });
});

// ─── gen_crucial_conversation_prep ──────────────────────────────────────────

describe('Phase 3 catalog additions — gen_crucial_conversation_prep', () => {
  const catalog = buildCatalog();
  const entry = catalog.find((e) => e.id === 'gen_crucial_conversation_prep');

  // AC-CAT-gen_crucial_conversation_prep-1
  test('AC-1: entry exists with id gen_crucial_conversation_prep', () => {
    assert.ok(entry, 'gen_crucial_conversation_prep must exist in compiled catalog');
    assert.equal(entry.id, 'gen_crucial_conversation_prep');
  });

  // AC-CAT-gen_crucial_conversation_prep-2
  test('AC-2: bucket is COMMUNICATION', () => {
    assert.equal(entry.bucket, 'COMMUNICATION');
  });

  // AC-CAT-gen_crucial_conversation_prep-3
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

  // AC-CAT-gen_crucial_conversation_prep-4
  test('AC-4: cadence is a valid Cadence value', () => {
    assert.ok(
      VALID_CADENCES.has(entry.cadence),
      `cadence "${entry.cadence}" must be one of ${[...VALID_CADENCES].join(', ')}`
    );
  });

  // AC-CAT-gen_crucial_conversation_prep-5
  test('AC-5: outputArtifact.schema is a non-empty string', () => {
    assert.equal(typeof entry.outputArtifact.schema, 'string');
    assert.ok(entry.outputArtifact.schema.length > 0, 'outputArtifact.schema must not be empty');
  });

  // AC-CAT-gen_crucial_conversation_prep-6
  test('AC-6: defaultDurationMinutes is a positive integer', () => {
    assert.equal(typeof entry.defaultDurationMinutes, 'number');
    assert.ok(Number.isInteger(entry.defaultDurationMinutes), 'defaultDurationMinutes must be an integer');
    assert.ok(entry.defaultDurationMinutes > 0, 'defaultDurationMinutes must be positive');
  });
});

// ─── gen_async_written_update ────────────────────────────────────────────────

describe('Phase 3 catalog additions — gen_async_written_update', () => {
  const catalog = buildCatalog();
  const entry = catalog.find((e) => e.id === 'gen_async_written_update');

  // AC-CAT-gen_async_written_update-1
  test('AC-1: entry exists with id gen_async_written_update', () => {
    assert.ok(entry, 'gen_async_written_update must exist in compiled catalog');
    assert.equal(entry.id, 'gen_async_written_update');
  });

  // AC-CAT-gen_async_written_update-2
  test('AC-2: bucket is COMMUNICATION', () => {
    assert.equal(entry.bucket, 'COMMUNICATION');
  });

  // AC-CAT-gen_async_written_update-3
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

  // AC-CAT-gen_async_written_update-4
  test('AC-4: cadence is a valid Cadence value', () => {
    assert.ok(
      VALID_CADENCES.has(entry.cadence),
      `cadence "${entry.cadence}" must be one of ${[...VALID_CADENCES].join(', ')}`
    );
  });

  // AC-CAT-gen_async_written_update-5
  test('AC-5: outputArtifact.schema is a non-empty string', () => {
    assert.equal(typeof entry.outputArtifact.schema, 'string');
    assert.ok(entry.outputArtifact.schema.length > 0, 'outputArtifact.schema must not be empty');
  });

  // AC-CAT-gen_async_written_update-6
  test('AC-6: defaultDurationMinutes is a positive integer', () => {
    assert.equal(typeof entry.defaultDurationMinutes, 'number');
    assert.ok(Number.isInteger(entry.defaultDurationMinutes), 'defaultDurationMinutes must be an integer');
    assert.ok(entry.defaultDurationMinutes > 0, 'defaultDurationMinutes must be positive');
  });
});

// ─── gen_habit_streak_review ─────────────────────────────────────────────────

describe('Phase 3 catalog additions — gen_habit_streak_review', () => {
  const catalog = buildCatalog();
  const entry = catalog.find((e) => e.id === 'gen_habit_streak_review');

  // AC-CAT-gen_habit_streak_review-1
  test('AC-1: entry exists with id gen_habit_streak_review', () => {
    assert.ok(entry, 'gen_habit_streak_review must exist in compiled catalog');
    assert.equal(entry.id, 'gen_habit_streak_review');
  });

  // AC-CAT-gen_habit_streak_review-2
  test('AC-2: bucket is CI', () => {
    assert.equal(entry.bucket, 'CI');
  });

  // AC-CAT-gen_habit_streak_review-3
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

  // AC-CAT-gen_habit_streak_review-4
  test('AC-4: cadence is a valid Cadence value', () => {
    assert.ok(
      VALID_CADENCES.has(entry.cadence),
      `cadence "${entry.cadence}" must be one of ${[...VALID_CADENCES].join(', ')}`
    );
  });

  // AC-CAT-gen_habit_streak_review-5
  test('AC-5: outputArtifact.schema is a non-empty string', () => {
    assert.equal(typeof entry.outputArtifact.schema, 'string');
    assert.ok(entry.outputArtifact.schema.length > 0, 'outputArtifact.schema must not be empty');
  });

  // AC-CAT-gen_habit_streak_review-6
  test('AC-6: defaultDurationMinutes is a positive integer', () => {
    assert.equal(typeof entry.defaultDurationMinutes, 'number');
    assert.ok(Number.isInteger(entry.defaultDurationMinutes), 'defaultDurationMinutes must be an integer');
    assert.ok(entry.defaultDurationMinutes > 0, 'defaultDurationMinutes must be positive');
  });
});

// ─── gen_hansei ───────────────────────────────────────────────────────────────

describe('Phase 3 catalog additions — gen_hansei', () => {
  const catalog = buildCatalog();
  const entry = catalog.find((e) => e.id === 'gen_hansei');

  // AC-CAT-gen_hansei-1
  test('AC-1: entry exists with id gen_hansei', () => {
    assert.ok(entry, 'gen_hansei must exist in compiled catalog');
    assert.equal(entry.id, 'gen_hansei');
  });

  // AC-CAT-gen_hansei-2
  test('AC-2: bucket is CI', () => {
    assert.equal(entry.bucket, 'CI');
  });

  // AC-CAT-gen_hansei-3
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

  // AC-CAT-gen_hansei-4
  test('AC-4: cadence is a valid Cadence value', () => {
    assert.ok(
      VALID_CADENCES.has(entry.cadence),
      `cadence "${entry.cadence}" must be one of ${[...VALID_CADENCES].join(', ')}`
    );
  });

  // AC-CAT-gen_hansei-5
  test('AC-5: outputArtifact.schema is a non-empty string', () => {
    assert.equal(typeof entry.outputArtifact.schema, 'string');
    assert.ok(entry.outputArtifact.schema.length > 0, 'outputArtifact.schema must not be empty');
  });

  // AC-CAT-gen_hansei-6
  test('AC-6: defaultDurationMinutes is a positive integer', () => {
    assert.equal(typeof entry.defaultDurationMinutes, 'number');
    assert.ok(Number.isInteger(entry.defaultDurationMinutes), 'defaultDurationMinutes must be an integer');
    assert.ok(entry.defaultDurationMinutes > 0, 'defaultDurationMinutes must be positive');
  });
});

// ─── gen_external_sync ───────────────────────────────────────────────────────

describe('Phase 3 catalog additions — gen_external_sync', () => {
  const catalog = buildCatalog();
  const entry = catalog.find((e) => e.id === 'gen_external_sync');

  // AC-CAT-gen_external_sync-1
  test('AC-1: entry exists with id gen_external_sync', () => {
    assert.ok(entry, 'gen_external_sync must exist in compiled catalog');
    assert.equal(entry.id, 'gen_external_sync');
  });

  // AC-CAT-gen_external_sync-2
  test('AC-2: bucket is COMMUNICATION', () => {
    assert.equal(entry.bucket, 'COMMUNICATION');
  });

  // AC-CAT-gen_external_sync-3
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

  // AC-CAT-gen_external_sync-4
  test('AC-4: cadence is a valid Cadence value', () => {
    assert.ok(
      VALID_CADENCES.has(entry.cadence),
      `cadence "${entry.cadence}" must be one of ${[...VALID_CADENCES].join(', ')}`
    );
  });

  // AC-CAT-gen_external_sync-5
  test('AC-5: outputArtifact.schema is a non-empty string', () => {
    assert.equal(typeof entry.outputArtifact.schema, 'string');
    assert.ok(entry.outputArtifact.schema.length > 0, 'outputArtifact.schema must not be empty');
  });

  // AC-CAT-gen_external_sync-6
  test('AC-6: defaultDurationMinutes is a positive integer', () => {
    assert.equal(typeof entry.defaultDurationMinutes, 'number');
    assert.ok(Number.isInteger(entry.defaultDurationMinutes), 'defaultDurationMinutes must be an integer');
    assert.ok(entry.defaultDurationMinutes > 0, 'defaultDurationMinutes must be positive');
  });
});

// ─── gen_incident_comms ──────────────────────────────────────────────────────

describe('Phase 3 catalog additions — gen_incident_comms', () => {
  const catalog = buildCatalog();
  const entry = catalog.find((e) => e.id === 'gen_incident_comms');

  // AC-CAT-gen_incident_comms-1
  test('AC-1: entry exists with id gen_incident_comms', () => {
    assert.ok(entry, 'gen_incident_comms must exist in compiled catalog');
    assert.equal(entry.id, 'gen_incident_comms');
  });

  // AC-CAT-gen_incident_comms-2
  test('AC-2: bucket is COMMUNICATION', () => {
    assert.equal(entry.bucket, 'COMMUNICATION');
  });

  // AC-CAT-gen_incident_comms-3
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

  // AC-CAT-gen_incident_comms-4
  test('AC-4: cadence is a valid Cadence value', () => {
    assert.ok(
      VALID_CADENCES.has(entry.cadence),
      `cadence "${entry.cadence}" must be one of ${[...VALID_CADENCES].join(', ')}`
    );
  });

  // AC-CAT-gen_incident_comms-5
  test('AC-5: outputArtifact.schema is a non-empty string', () => {
    assert.equal(typeof entry.outputArtifact.schema, 'string');
    assert.ok(entry.outputArtifact.schema.length > 0, 'outputArtifact.schema must not be empty');
  });

  // AC-CAT-gen_incident_comms-6
  test('AC-6: defaultDurationMinutes is a positive integer', () => {
    assert.equal(typeof entry.defaultDurationMinutes, 'number');
    assert.ok(Number.isInteger(entry.defaultDurationMinutes), 'defaultDurationMinutes must be an integer');
    assert.ok(entry.defaultDurationMinutes > 0, 'defaultDurationMinutes must be positive');
  });
});

// ─── gen_learning_debrief ────────────────────────────────────────────────────

describe('Phase 3 catalog additions — gen_learning_debrief', () => {
  const catalog = buildCatalog();
  const entry = catalog.find((e) => e.id === 'gen_learning_debrief');

  // AC-CAT-gen_learning_debrief-1
  test('AC-1: entry exists with id gen_learning_debrief', () => {
    assert.ok(entry, 'gen_learning_debrief must exist in compiled catalog');
    assert.equal(entry.id, 'gen_learning_debrief');
  });

  // AC-CAT-gen_learning_debrief-2
  test('AC-2: bucket is CI', () => {
    assert.equal(entry.bucket, 'CI');
  });

  // AC-CAT-gen_learning_debrief-3
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

  // AC-CAT-gen_learning_debrief-4
  test('AC-4: cadence is a valid Cadence value', () => {
    assert.ok(
      VALID_CADENCES.has(entry.cadence),
      `cadence "${entry.cadence}" must be one of ${[...VALID_CADENCES].join(', ')}`
    );
  });

  // AC-CAT-gen_learning_debrief-5
  test('AC-5: outputArtifact.schema is a non-empty string', () => {
    assert.equal(typeof entry.outputArtifact.schema, 'string');
    assert.ok(entry.outputArtifact.schema.length > 0, 'outputArtifact.schema must not be empty');
  });

  // AC-CAT-gen_learning_debrief-6
  test('AC-6: defaultDurationMinutes is a positive integer', () => {
    assert.equal(typeof entry.defaultDurationMinutes, 'number');
    assert.ok(Number.isInteger(entry.defaultDurationMinutes), 'defaultDurationMinutes must be an integer');
    assert.ok(entry.defaultDurationMinutes > 0, 'defaultDurationMinutes must be positive');
  });
});

// ─── gen_project_closure ─────────────────────────────────────────────────────

describe('Phase 3 catalog additions — gen_project_closure', () => {
  const catalog = buildCatalog();
  const entry = catalog.find((e) => e.id === 'gen_project_closure');

  // AC-CAT-gen_project_closure-1
  test('AC-1: entry exists with id gen_project_closure', () => {
    assert.ok(entry, 'gen_project_closure must exist in compiled catalog');
    assert.equal(entry.id, 'gen_project_closure');
  });

  // AC-CAT-gen_project_closure-2
  test('AC-2: bucket is PROJECT', () => {
    assert.equal(entry.bucket, 'PROJECT');
  });

  // AC-CAT-gen_project_closure-3
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

  // AC-CAT-gen_project_closure-4
  test('AC-4: cadence is a valid Cadence value', () => {
    assert.ok(
      VALID_CADENCES.has(entry.cadence),
      `cadence "${entry.cadence}" must be one of ${[...VALID_CADENCES].join(', ')}`
    );
  });

  // AC-CAT-gen_project_closure-5
  test('AC-5: outputArtifact.schema is a non-empty string', () => {
    assert.equal(typeof entry.outputArtifact.schema, 'string');
    assert.ok(entry.outputArtifact.schema.length > 0, 'outputArtifact.schema must not be empty');
  });

  // AC-CAT-gen_project_closure-6
  test('AC-6: defaultDurationMinutes is a positive integer', () => {
    assert.equal(typeof entry.defaultDurationMinutes, 'number');
    assert.ok(Number.isInteger(entry.defaultDurationMinutes), 'defaultDurationMinutes must be an integer');
    assert.ok(entry.defaultDurationMinutes > 0, 'defaultDurationMinutes must be positive');
  });
});

// ─── gen_technical_spec_authoring ────────────────────────────────────────────

describe('Phase 3 catalog additions — gen_technical_spec_authoring', () => {
  const catalog = buildCatalog();
  const entry = catalog.find((e) => e.id === 'gen_technical_spec_authoring');

  // AC-CAT-gen_technical_spec_authoring-1
  test('AC-1: entry exists with id gen_technical_spec_authoring', () => {
    assert.ok(entry, 'gen_technical_spec_authoring must exist in compiled catalog');
    assert.equal(entry.id, 'gen_technical_spec_authoring');
  });

  // AC-CAT-gen_technical_spec_authoring-2
  test('AC-2: bucket is PROJECT', () => {
    assert.equal(entry.bucket, 'PROJECT');
  });

  // AC-CAT-gen_technical_spec_authoring-3
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

  // AC-CAT-gen_technical_spec_authoring-4
  test('AC-4: cadence is a valid Cadence value', () => {
    assert.ok(
      VALID_CADENCES.has(entry.cadence),
      `cadence "${entry.cadence}" must be one of ${[...VALID_CADENCES].join(', ')}`
    );
  });

  // AC-CAT-gen_technical_spec_authoring-5
  test('AC-5: outputArtifact.schema is a non-empty string', () => {
    assert.equal(typeof entry.outputArtifact.schema, 'string');
    assert.ok(entry.outputArtifact.schema.length > 0, 'outputArtifact.schema must not be empty');
  });

  // AC-CAT-gen_technical_spec_authoring-6
  test('AC-6: defaultDurationMinutes is a positive integer', () => {
    assert.equal(typeof entry.defaultDurationMinutes, 'number');
    assert.ok(Number.isInteger(entry.defaultDurationMinutes), 'defaultDurationMinutes must be an integer');
    assert.ok(entry.defaultDurationMinutes > 0, 'defaultDurationMinutes must be positive');
  });
});

// ─── Cross-cutting validations ───────────────────────────────────────────────

describe('Phase 3 catalog additions — cross-cutting', () => {
  const catalog = buildCatalog();

  const PHASE3_IDS = [
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
  ];

  const PHASE1_AND_2_IDS = new Set([
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
    'gen_constraint_identification'
  ]);

  // AC-CAT-PHASE3-CROSS-1
  test('AC-CROSS-1: all 10 Phase 3 entries have unique IDs', () => {
    const ids = PHASE3_IDS;
    assert.equal(
      new Set(ids).size,
      ids.length,
      `Phase 3 IDs must be unique; found duplicates`
    );
  });

  // AC-CAT-PHASE3-CROSS-2
  test('AC-CROSS-2: no Phase 3 entry has the same ID as a Phase 1 or Phase 2 entry', () => {
    const overlaps = PHASE3_IDS.filter((id) => PHASE1_AND_2_IDS.has(id));
    assert.deepEqual(
      overlaps,
      [],
      `Phase 3 IDs must not overlap with Phase 1/2: ${overlaps.join(', ')}`
    );
  });

  // AC-CAT-PHASE3-CROSS-3
  test('AC-CROSS-3: total catalog size is 85 (Phase 4 +4 Tier 3 added after Phase 3)', () => {
    assert.equal(catalog.length, 85, `expected 85 entries, got ${catalog.length}`);
  });

  // AC-CAT-PHASE3-CROSS-4
  test('AC-CROSS-4: COMMUNICATION bucket has 16 entries (8 original + 3 Phase 1 + 1 Phase 2 + 4 Phase 3 Research + 2 Phase 3 PM... wait — see note)', () => {
    // Phase 3 adds 5 COMMUNICATION entries:
    //   gen_pre_meeting_prep, gen_crucial_conversation_prep, gen_async_written_update (Research)
    //   gen_external_sync, gen_incident_comms (PM)
    // Pre-Phase-3 baseline was 11 (Phase 2 end).
    // 11 + 5 = 16.
    const commEntries = catalog.filter((e) => e.bucket === 'COMMUNICATION');
    assert.equal(
      commEntries.length,
      16,
      `COMMUNICATION bucket should have 16 entries; got ${commEntries.length}`
    );
  });

  // AC-CAT-PHASE3-CROSS-5
  test('AC-CROSS-5: CI bucket has 30 entries (Phase 4 +3 Tier 3 added after Phase 3)', () => {
    // Phase 3 adds 3 CI entries (27 at Phase 3 end).
    // Phase 4 adds 3 CI entries: gen_improvement_experiment_log, gen_focus_metrics_review, gen_personal_kanban_review.
    // 27 + 3 = 30.
    const ciEntries = catalog.filter((e) => e.bucket === 'CI');
    assert.equal(
      ciEntries.length,
      30,
      `CI bucket should have 30 entries; got ${ciEntries.length}`
    );
  });

  // AC-CAT-PHASE3-CROSS-6
  test('AC-CROSS-6: PROJECT bucket has 38 entries (Phase 4 +1 Tier 3 added after Phase 3)', () => {
    // Phase 3 ends at 37 PROJECT entries.
    // Phase 4 adds 1 PROJECT entry: gen_project_kickoff.
    // 37 + 1 = 38.
    const projectEntries = catalog.filter((e) => e.bucket === 'PROJECT');
    assert.equal(
      projectEntries.length,
      38,
      `PROJECT bucket should have 38 entries; got ${projectEntries.length}`
    );
  });

  // Additional: verify all Phase 3 entries have correct field shapes

  test('all Phase 3 entries have enabledByUser=true', () => {
    for (const id of PHASE3_IDS) {
      const e = catalog.find((c) => c.id === id);
      assert.ok(e, `${id} not found in catalog`);
      assert.equal(e.enabledByUser, true, `${id} must have enabledByUser=true`);
    }
  });

  test('all Phase 3 entries have activityNumber=null', () => {
    for (const id of PHASE3_IDS) {
      const e = catalog.find((c) => c.id === id);
      assert.ok(e, `${id} not found in catalog`);
      assert.equal(e.activityNumber, null, `${id} must have activityNumber=null`);
    }
  });

  test('all Phase 3 entries have version=1', () => {
    for (const id of PHASE3_IDS) {
      const e = catalog.find((c) => c.id === id);
      assert.ok(e, `${id} not found in catalog`);
      assert.equal(e.version, 1, `${id} must have version=1`);
    }
  });

  test('all Phase 3 entries have isNonOptional=false', () => {
    for (const id of PHASE3_IDS) {
      const e = catalog.find((c) => c.id === id);
      assert.ok(e, `${id} not found in catalog`);
      assert.equal(e.isNonOptional, false, `${id} must have isNonOptional=false`);
    }
  });

  test('all Phase 3 entries have projectTypeBinding=null (none are DMAIC-specific)', () => {
    for (const id of PHASE3_IDS) {
      const e = catalog.find((c) => c.id === id);
      assert.ok(e, `${id} not found in catalog`);
      assert.equal(e.projectTypeBinding, null, `${id} must have projectTypeBinding=null`);
    }
  });

  test('all Phase 3 entries have phaseBinding=null', () => {
    for (const id of PHASE3_IDS) {
      const e = catalog.find((c) => c.id === id);
      assert.ok(e, `${id} not found in catalog`);
      assert.equal(e.phaseBinding, null, `${id} must have phaseBinding=null`);
    }
  });

  test('all Phase 3 entries have dependsOn=[] (cross-bucket wiring deferred to Phase 5)', () => {
    for (const id of PHASE3_IDS) {
      const e = catalog.find((c) => c.id === id);
      assert.ok(e, `${id} not found in catalog`);
      assert.ok(Array.isArray(e.dependsOn), `${id} dependsOn must be an array`);
      assert.equal(e.dependsOn.length, 0, `${id} dependsOn must be empty for Phase 3`);
    }
  });

  test('all Phase 3 entries have non-empty appliesToRoles', () => {
    for (const id of PHASE3_IDS) {
      const e = catalog.find((c) => c.id === id);
      assert.ok(e, `${id} not found in catalog`);
      assert.ok(
        Array.isArray(e.appliesToRoles) && e.appliesToRoles.length > 0,
        `${id} must have at least one appliesToRoles value`
      );
    }
  });

  test('all Phase 3 entries have outputArtifact.required=true', () => {
    for (const id of PHASE3_IDS) {
      const e = catalog.find((c) => c.id === id);
      assert.ok(e, `${id} not found in catalog`);
      assert.equal(
        e.outputArtifact.required,
        true,
        `${id} outputArtifact.required must be true`
      );
    }
  });

  test('dropped IDs are absent from catalog (gen_annual_reflection, gen_reading_for_synthesis, gen_weekly_project_status)', () => {
    const droppedIds = [
      'gen_annual_reflection',
      'gen_reading_for_synthesis',
      'gen_weekly_project_status'
    ];
    const catalogIds = new Set(catalog.map((e) => e.id));
    for (const id of droppedIds) {
      assert.ok(!catalogIds.has(id), `${id} should NOT be in catalog (dropped per delta §6)`);
    }
  });

  test('DMAIC count is still 23 — no new DMAIC-specific entries in Phase 3', () => {
    const dmaicEntries = catalog.filter((e) => e.projectTypeBinding === 'DMAIC');
    assert.equal(
      dmaicEntries.length,
      23,
      `DMAIC count must remain 23; got ${dmaicEntries.length}`
    );
  });
});
