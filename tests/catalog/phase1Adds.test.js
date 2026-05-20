/**
 * Phase 1 catalog additions — acceptance tests.
 *
 * Covers the 4 convergent Tier 1 entries dispatched per CATALOG_GAP_DELTA.md §10 Phase 1:
 *   - gen_structured_one_on_one  (COMMUNICATION, weekly)
 *   - gen_stakeholder_status_report (COMMUNICATION, weekly)
 *   - gen_monthly_ci_review (CI, monthly)
 *   - gen_5_whys (CI, event-driven)
 *
 * Each entry gets 6 ACs:
 *   AC-{ID}-1: entry exists in the compiled catalog with the expected id
 *   AC-{ID}-2: bucket matches expectation (COMMUNICATION or CI)
 *   AC-{ID}-3: procedure is a non-empty array (3–7 entries)
 *   AC-{ID}-4: cadence is one of the valid Cadence values
 *   AC-{ID}-5: outputArtifact.name is a non-empty string
 *   AC-{ID}-6: defaultDurationMinutes is a positive integer
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { buildCatalog } from '../../js/catalog/seed/index.js';
import { Cadence } from '../../js/domain/types.js';

const VALID_CADENCES = new Set(Object.values(Cadence));

describe('Phase 1 catalog additions — gen_structured_one_on_one', () => {
  const catalog = buildCatalog();
  const entry = catalog.find((e) => e.id === 'gen_structured_one_on_one');

  // AC-gen_structured_one_on_one-1
  test('AC-1: entry exists with id gen_structured_one_on_one', () => {
    assert.ok(entry, 'gen_structured_one_on_one must exist in compiled catalog');
    assert.equal(entry.id, 'gen_structured_one_on_one');
  });

  // AC-gen_structured_one_on_one-2
  test('AC-2: bucket is COMMUNICATION', () => {
    assert.equal(entry.bucket, 'COMMUNICATION');
  });

  // AC-gen_structured_one_on_one-3
  test('AC-3: procedure is a non-empty array (3–7 steps)', () => {
    assert.ok(Array.isArray(entry.procedure), 'procedure must be an array');
    assert.ok(entry.procedure.length >= 3, `procedure must have at least 3 steps; got ${entry.procedure.length}`);
    assert.ok(entry.procedure.length <= 7, `procedure must have at most 7 steps; got ${entry.procedure.length}`);
  });

  // AC-gen_structured_one_on_one-4
  test('AC-4: cadence is a valid Cadence value', () => {
    assert.ok(VALID_CADENCES.has(entry.cadence), `cadence "${entry.cadence}" must be one of ${[...VALID_CADENCES].join(', ')}`);
  });

  // AC-gen_structured_one_on_one-5
  test('AC-5: outputArtifact.name is a non-empty string', () => {
    assert.equal(typeof entry.outputArtifact.name, 'string');
    assert.ok(entry.outputArtifact.name.length > 0, 'outputArtifact.name must not be empty');
  });

  // AC-gen_structured_one_on_one-6
  test('AC-6: defaultDurationMinutes is a positive integer', () => {
    assert.equal(typeof entry.defaultDurationMinutes, 'number');
    assert.ok(Number.isInteger(entry.defaultDurationMinutes), 'defaultDurationMinutes must be an integer');
    assert.ok(entry.defaultDurationMinutes > 0, 'defaultDurationMinutes must be positive');
  });
});

describe('Phase 1 catalog additions — gen_stakeholder_status_report', () => {
  const catalog = buildCatalog();
  const entry = catalog.find((e) => e.id === 'gen_stakeholder_status_report');

  // AC-gen_stakeholder_status_report-1
  test('AC-1: entry exists with id gen_stakeholder_status_report', () => {
    assert.ok(entry, 'gen_stakeholder_status_report must exist in compiled catalog');
    assert.equal(entry.id, 'gen_stakeholder_status_report');
  });

  // AC-gen_stakeholder_status_report-2
  test('AC-2: bucket is COMMUNICATION', () => {
    assert.equal(entry.bucket, 'COMMUNICATION');
  });

  // AC-gen_stakeholder_status_report-3
  test('AC-3: procedure is a non-empty array (3–7 steps)', () => {
    assert.ok(Array.isArray(entry.procedure), 'procedure must be an array');
    assert.ok(entry.procedure.length >= 3, `procedure must have at least 3 steps; got ${entry.procedure.length}`);
    assert.ok(entry.procedure.length <= 7, `procedure must have at most 7 steps; got ${entry.procedure.length}`);
  });

  // AC-gen_stakeholder_status_report-4
  test('AC-4: cadence is a valid Cadence value', () => {
    assert.ok(VALID_CADENCES.has(entry.cadence), `cadence "${entry.cadence}" must be one of ${[...VALID_CADENCES].join(', ')}`);
  });

  // AC-gen_stakeholder_status_report-5
  test('AC-5: outputArtifact.name is a non-empty string', () => {
    assert.equal(typeof entry.outputArtifact.name, 'string');
    assert.ok(entry.outputArtifact.name.length > 0, 'outputArtifact.name must not be empty');
  });

  // AC-gen_stakeholder_status_report-6
  test('AC-6: defaultDurationMinutes is a positive integer', () => {
    assert.equal(typeof entry.defaultDurationMinutes, 'number');
    assert.ok(Number.isInteger(entry.defaultDurationMinutes), 'defaultDurationMinutes must be an integer');
    assert.ok(entry.defaultDurationMinutes > 0, 'defaultDurationMinutes must be positive');
  });
});

describe('Phase 1 catalog additions — gen_monthly_ci_review', () => {
  const catalog = buildCatalog();
  const entry = catalog.find((e) => e.id === 'gen_monthly_ci_review');

  // AC-gen_monthly_ci_review-1
  test('AC-1: entry exists with id gen_monthly_ci_review', () => {
    assert.ok(entry, 'gen_monthly_ci_review must exist in compiled catalog');
    assert.equal(entry.id, 'gen_monthly_ci_review');
  });

  // AC-gen_monthly_ci_review-2
  test('AC-2: bucket is CI', () => {
    assert.equal(entry.bucket, 'CI');
  });

  // AC-gen_monthly_ci_review-3
  test('AC-3: procedure is a non-empty array (3–7 steps)', () => {
    assert.ok(Array.isArray(entry.procedure), 'procedure must be an array');
    assert.ok(entry.procedure.length >= 3, `procedure must have at least 3 steps; got ${entry.procedure.length}`);
    assert.ok(entry.procedure.length <= 7, `procedure must have at most 7 steps; got ${entry.procedure.length}`);
  });

  // AC-gen_monthly_ci_review-4
  test('AC-4: cadence is MONTHLY', () => {
    assert.ok(VALID_CADENCES.has(entry.cadence), `cadence "${entry.cadence}" must be one of ${[...VALID_CADENCES].join(', ')}`);
    assert.equal(entry.cadence, 'MONTHLY', 'gen_monthly_ci_review must have MONTHLY cadence');
  });

  // AC-gen_monthly_ci_review-5
  test('AC-5: outputArtifact.name is a non-empty string', () => {
    assert.equal(typeof entry.outputArtifact.name, 'string');
    assert.ok(entry.outputArtifact.name.length > 0, 'outputArtifact.name must not be empty');
  });

  // AC-gen_monthly_ci_review-6
  test('AC-6: defaultDurationMinutes is a positive integer', () => {
    assert.equal(typeof entry.defaultDurationMinutes, 'number');
    assert.ok(Number.isInteger(entry.defaultDurationMinutes), 'defaultDurationMinutes must be an integer');
    assert.ok(entry.defaultDurationMinutes > 0, 'defaultDurationMinutes must be positive');
  });
});

describe('Phase 1 catalog additions — gen_5_whys', () => {
  const catalog = buildCatalog();
  const entry = catalog.find((e) => e.id === 'gen_5_whys');

  // AC-gen_5_whys-1
  test('AC-1: entry exists with id gen_5_whys', () => {
    assert.ok(entry, 'gen_5_whys must exist in compiled catalog');
    assert.equal(entry.id, 'gen_5_whys');
  });

  // AC-gen_5_whys-2
  test('AC-2: bucket is CI', () => {
    assert.equal(entry.bucket, 'CI');
  });

  // AC-gen_5_whys-3
  test('AC-3: procedure is a non-empty array (3–7 steps)', () => {
    assert.ok(Array.isArray(entry.procedure), 'procedure must be an array');
    assert.ok(entry.procedure.length >= 3, `procedure must have at least 3 steps; got ${entry.procedure.length}`);
    assert.ok(entry.procedure.length <= 7, `procedure must have at most 7 steps; got ${entry.procedure.length}`);
  });

  // AC-gen_5_whys-4
  test('AC-4: cadence is a valid Cadence value', () => {
    assert.ok(VALID_CADENCES.has(entry.cadence), `cadence "${entry.cadence}" must be one of ${[...VALID_CADENCES].join(', ')}`);
  });

  // AC-gen_5_whys-5
  test('AC-5: outputArtifact.name is a non-empty string', () => {
    assert.equal(typeof entry.outputArtifact.name, 'string');
    assert.ok(entry.outputArtifact.name.length > 0, 'outputArtifact.name must not be empty');
  });

  // AC-gen_5_whys-6
  test('AC-6: defaultDurationMinutes is a positive integer', () => {
    assert.equal(typeof entry.defaultDurationMinutes, 'number');
    assert.ok(Number.isInteger(entry.defaultDurationMinutes), 'defaultDurationMinutes must be an integer');
    assert.ok(entry.defaultDurationMinutes > 0, 'defaultDurationMinutes must be positive');
  });
});

describe('Phase 1 catalog additions — cross-cutting', () => {
  const catalog = buildCatalog();
  const PHASE1_IDS = [
    'gen_structured_one_on_one',
    'gen_stakeholder_status_report',
    'gen_monthly_ci_review',
    'gen_5_whys'
  ];

  test('all 4 Phase 1 entries are present in the catalog', () => {
    const ids = new Set(catalog.map((e) => e.id));
    for (const id of PHASE1_IDS) {
      assert.ok(ids.has(id), `Phase 1 entry ${id} must be in the catalog`);
    }
  });

  test('Phase 1 entries have unique ids (no duplicates introduced)', () => {
    const allIds = catalog.map((e) => e.id);
    const uniqueIds = new Set(allIds);
    assert.equal(uniqueIds.size, allIds.length, 'All catalog ids must be unique');
  });

  test('Phase 1 entries all have activityNumber === null (gen_ entries have no numbered activity)', () => {
    for (const id of PHASE1_IDS) {
      const entry = catalog.find((e) => e.id === id);
      assert.equal(entry.activityNumber, null, `${id} must have activityNumber === null`);
    }
  });

  test('Phase 1 entries all have isNonOptional === false (optional by default)', () => {
    for (const id of PHASE1_IDS) {
      const entry = catalog.find((e) => e.id === id);
      assert.equal(entry.isNonOptional, false, `${id} must be optional (isNonOptional === false)`);
    }
  });

  test('Phase 1 entries all have dependsOn as an array', () => {
    for (const id of PHASE1_IDS) {
      const entry = catalog.find((e) => e.id === id);
      assert.ok(Array.isArray(entry.dependsOn), `${id} dependsOn must be an array`);
    }
  });

  test('gen_monthly_ci_review dependsOn gen_weekly_reflection which exists in catalog', () => {
    const entry = catalog.find((e) => e.id === 'gen_monthly_ci_review');
    assert.ok(entry.dependsOn.includes('gen_weekly_reflection'), 'gen_monthly_ci_review must dependOn gen_weekly_reflection');
    const dep = catalog.find((e) => e.id === 'gen_weekly_reflection');
    assert.ok(dep, 'gen_weekly_reflection must exist in catalog (dependsOn target must resolve)');
  });

  test('COMMUNICATION bucket now has at least 10 entries (was 8 before Phase 1)', () => {
    const commEntries = catalog.filter((e) => e.bucket === 'COMMUNICATION');
    assert.ok(commEntries.length >= 10, `COMMUNICATION bucket must have at least 10 entries; got ${commEntries.length}`);
  });

  test('CI bucket now has at least 22 entries (was 20 before Phase 1)', () => {
    const ciEntries = catalog.filter((e) => e.bucket === 'CI');
    assert.ok(ciEntries.length >= 22, `CI bucket must have at least 22 entries; got ${ciEntries.length}`);
  });
});
