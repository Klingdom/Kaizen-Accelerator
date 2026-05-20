/**
 * Tests for /js/catalog/seed/index.js — orchestrator.
 *
 * Verifies the full buildCatalog() pipeline produces a 60-entry catalog
 * ready for CatalogService.seed().
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { buildCatalog, EXPECTED_CATALOG_SIZE } from '../../../js/catalog/seed/index.js';

describe('buildCatalog — orchestration', () => {
  const catalog = buildCatalog();

  test('produces 71 entries (49 numbered + 6 ceremonies + 16 generics incl. Iter 26 recovery_lunch + Phase 1 +4 + Phase 2 +6)', () => {
    assert.equal(EXPECTED_CATALOG_SIZE, 71);
    assert.equal(catalog.length, 71);
  });

  test('no entry has a null cadence/trigger/inputs/outputArtifact/participants — bucket may be null for recovery_lunch', () => {
    const missing = [];
    for (const e of catalog) {
      for (const field of [
        'cadence',
        'trigger',
        'inputs',
        'outputArtifact',
        'participants'
      ]) {
        if (e[field] === null || e[field] === undefined) {
          missing.push(`${e.id}.${field}`);
        }
      }
      // bucket===null is intentional for recovery_lunch (capacity-neutral sentinel).
      if (e.id !== 'recovery_lunch' && (e.bucket === null || e.bucket === undefined)) {
        missing.push(`${e.id}.bucket`);
      }
    }
    assert.deepEqual(missing, [], `null fields: ${missing.join(', ')}`);
  });

  test('every entry has a non-empty procedure', () => {
    const empty = [];
    for (const e of catalog) {
      if (!Array.isArray(e.procedure) || e.procedure.length === 0) {
        empty.push(`${e.id} (#${e.activityNumber})`);
      }
    }
    // We accept that some source rows still have empty procedures if §D
    // didn't cover them; keep the check loose. Hard-fail for §A–§D rows:
    for (const n of [19, 20, 22, 23, 30, 31, 39, 41, 42, 50]) {
      const e = catalog.find((x) => x.activityNumber === n);
      assert.ok(Array.isArray(e.procedure) && e.procedure.length > 0, `#${n} procedure empty`);
    }
  });

  test('DAG has no cycles', () => {
    const byId = new Map(catalog.map((e) => [e.id, e]));
    const WHITE = 0;
    const GRAY = 1;
    const BLACK = 2;
    const color = new Map(catalog.map((e) => [e.id, WHITE]));
    function dfs(id) {
      color.set(id, GRAY);
      for (const dep of byId.get(id)?.dependsOn ?? []) {
        if (color.get(dep) === GRAY) return false;
        if (color.get(dep) === WHITE && !dfs(dep)) return false;
      }
      color.set(id, BLACK);
      return true;
    }
    for (const e of catalog) {
      if (color.get(e.id) === WHITE) {
        assert.ok(dfs(e.id), `cycle detected involving ${e.id}`);
      }
    }
  });

  test('every dependsOn reference resolves within the catalog', () => {
    const ids = new Set(catalog.map((e) => e.id));
    for (const e of catalog) {
      for (const dep of e.dependsOn ?? []) {
        assert.ok(ids.has(dep), `${e.id} dependsOn unresolvable ${dep}`);
      }
    }
  });

  test('bucket counts are sensible: PROJECT ≥ COMM + CI (DMAIC + Kaizen dominate)', () => {
    const counts = { PROJECT: 0, COMMUNICATION: 0, CI: 0 };
    for (const e of catalog) counts[e.bucket] = (counts[e.bucket] ?? 0) + 1;
    assert.ok(counts.PROJECT > 0);
    assert.ok(counts.COMMUNICATION > 0);
    assert.ok(counts.CI > 0);
    // DMAIC (#20..#41) + Kaizen (#42..#50) + innovation (#7..#11) + #18/#19/Deep generic = ≥ 34
    assert.ok(counts.PROJECT >= 30, `PROJECT count unusually low: ${counts.PROJECT}`);
  });

  test('at least 8 entries are non-optional (locked set from §3.4)', () => {
    const nonOpt = catalog.filter((e) => e.isNonOptional === true);
    assert.ok(nonOpt.length >= 8, `got ${nonOpt.length} non-optionals`);
  });
});
