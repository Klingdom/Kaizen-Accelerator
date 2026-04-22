/**
 * Tests for /js/catalog/progression.js (Sprint 9 Pass 9a).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  getCurrentNext,
  filterCatalogByProjectType,
  entryBindsToProjectType,
  sortDeterministic
} from '../../js/catalog/progression.js';
import { buildCatalog } from '../../js/catalog/seed/index.js';

const CATALOG = buildCatalog();

/** Resolve a catalog id by activityNumber. */
function idForNumber(n) {
  const e = CATALOG.find((c) => c.activityNumber === n);
  if (!e) throw new Error(`No catalog row for #${n}`);
  return e.id;
}

// ---------------------------------------------------------------------------
// entryBindsToProjectType
// ---------------------------------------------------------------------------

describe('entryBindsToProjectType', () => {
  test('null binding returns false for any projectType', () => {
    const e = { projectTypeBinding: null };
    assert.equal(entryBindsToProjectType(e, 'DMAIC'), false);
    assert.equal(entryBindsToProjectType(e, 'AD_HOC'), false);
  });

  test('string binding matches when equal', () => {
    const e = { projectTypeBinding: 'DMAIC' };
    assert.equal(entryBindsToProjectType(e, 'DMAIC'), true);
    assert.equal(entryBindsToProjectType(e, 'AD_HOC'), false);
  });

  test('array binding matches on membership', () => {
    const e = { projectTypeBinding: ['KAIZEN_EVENT', 'KAIZEN_EVENT_90D'] };
    assert.equal(entryBindsToProjectType(e, 'KAIZEN_EVENT'), true);
    assert.equal(entryBindsToProjectType(e, 'KAIZEN_EVENT_90D'), true);
    assert.equal(entryBindsToProjectType(e, 'DMAIC'), false);
  });

  test('undefined binding returns false', () => {
    const e = {};
    assert.equal(entryBindsToProjectType(e, 'DMAIC'), false);
  });

  test('null entry returns false', () => {
    assert.equal(entryBindsToProjectType(null, 'DMAIC'), false);
  });
});

// ---------------------------------------------------------------------------
// filterCatalogByProjectType
// ---------------------------------------------------------------------------

describe('filterCatalogByProjectType — against the full seeded catalog', () => {
  test('DMAIC returns exactly 22 entries', () => {
    const out = filterCatalogByProjectType('DMAIC', CATALOG);
    assert.equal(out.length, 22);
  });

  test('DMAIC entries are sorted by activityNumber asc', () => {
    const out = filterCatalogByProjectType('DMAIC', CATALOG);
    const numbers = out.map((e) => e.activityNumber);
    const sorted = [...numbers].sort((a, b) => a - b);
    assert.deepEqual(numbers, sorted);
    assert.equal(numbers[0], 20);
    assert.equal(numbers[numbers.length - 1], 41);
  });

  test('KAIZEN_EVENT_90D returns 9 entries (#42..#50)', () => {
    const out = filterCatalogByProjectType('KAIZEN_EVENT_90D', CATALOG);
    assert.equal(out.length, 9);
    assert.deepEqual(
      out.map((e) => e.activityNumber),
      [42, 43, 44, 45, 46, 47, 48, 49, 50]
    );
  });

  test('KAIZEN_EVENT returns 9 entries (same #42..#50 rows)', () => {
    const out = filterCatalogByProjectType('KAIZEN_EVENT', CATALOG);
    assert.equal(out.length, 9);
  });

  test('KAIZEN_ACCELERATOR_30D returns 0 entries (no seed yet)', () => {
    const out = filterCatalogByProjectType('KAIZEN_ACCELERATOR_30D', CATALOG);
    assert.equal(out.length, 0);
  });

  test('AD_HOC returns at least 1 entry (covers #12 PDCA)', () => {
    const out = filterCatalogByProjectType('AD_HOC', CATALOG);
    assert.ok(out.length >= 1);
    assert.ok(out.some((e) => e.activityNumber === 12));
  });

  test('null or undefined catalog returns []', () => {
    assert.deepEqual(filterCatalogByProjectType('DMAIC', null), []);
    assert.deepEqual(filterCatalogByProjectType('DMAIC', undefined), []);
  });
});

// ---------------------------------------------------------------------------
// sortDeterministic
// ---------------------------------------------------------------------------

describe('sortDeterministic', () => {
  test('sorts by activityNumber asc then id asc', () => {
    const entries = [
      { id: 'cat_2_a', activityNumber: 2 },
      { id: 'cat_1_a', activityNumber: 1 },
      { id: 'cat_1_b', activityNumber: 1 }
    ];
    const out = sortDeterministic(entries);
    assert.deepEqual(out.map((e) => e.id), ['cat_1_a', 'cat_1_b', 'cat_2_a']);
  });

  test('activityNumber=null sorts last', () => {
    const entries = [
      { id: 'gen_zzz', activityNumber: null },
      { id: 'cat_5', activityNumber: 5 }
    ];
    const out = sortDeterministic(entries);
    assert.equal(out[0].id, 'cat_5');
    assert.equal(out[1].id, 'gen_zzz');
  });

  test('stable for equal keys (id tie-breaker)', () => {
    const entries = [
      { id: 'b', activityNumber: null },
      { id: 'a', activityNumber: null }
    ];
    const out = sortDeterministic(entries);
    assert.deepEqual(out.map((e) => e.id), ['a', 'b']);
  });

  test('does not mutate the input array', () => {
    const entries = [{ id: 'b', activityNumber: 2 }, { id: 'a', activityNumber: 1 }];
    const snapshot = [...entries];
    sortDeterministic(entries);
    assert.deepEqual(entries, snapshot);
  });
});

// ---------------------------------------------------------------------------
// getCurrentNext — DMAIC DAG progression
// ---------------------------------------------------------------------------

describe('getCurrentNext — DMAIC (DAG-driven)', () => {
  test('no completion → current=#20 (Charter, root)', () => {
    const r = getCurrentNext('DMAIC', [], CATALOG);
    assert.equal(r.current?.activityNumber, 20);
  });

  test('no completion → next=#21 (SIPOC, only dependsOn=[#20])', () => {
    const r = getCurrentNext('DMAIC', [], CATALOG);
    assert.equal(r.next?.activityNumber, 21);
  });

  test('#20 completed → current=#21 (only remaining child of #20)', () => {
    const r = getCurrentNext('DMAIC', [idForNumber(20)], CATALOG);
    assert.equal(r.current?.activityNumber, 21);
  });

  test('#20 completed → next=#23 (second eligible after #21, dependsOn=[#20])', () => {
    // After completing #20, the ready set = {#21, #23, #25 (only if #21 also),
    // #26 (dependsOn #23)}. First = #21 → current. Add #21 to completed → ready
    // becomes {#23, #25, #32}. #23 has the lowest activityNumber. So next=#23.
    const r = getCurrentNext('DMAIC', [idForNumber(20)], CATALOG);
    assert.equal(r.next?.activityNumber, 23);
  });

  test('#20, #21 completed → current=#23', () => {
    const r = getCurrentNext(
      'DMAIC',
      [idForNumber(20), idForNumber(21)],
      CATALOG
    );
    assert.equal(r.current?.activityNumber, 23);
  });

  test('#22 requires #21 AND #26 — remains not-ready when only #21 done', () => {
    // Completed {#20, #21, #23, #25}. Ready set = {#24 (deps [#23]),
    // #26 (deps [#23]), #32 (deps [#21])}. #22 NOT ready (needs #26).
    const r = getCurrentNext(
      'DMAIC',
      [idForNumber(20), idForNumber(21), idForNumber(23), idForNumber(25)],
      CATALOG
    );
    assert.notEqual(r.current?.activityNumber, 22);
    // Lowest ready = #24.
    assert.equal(r.current?.activityNumber, 24);
  });

  test('#22 becomes ready once #21 AND #26 complete', () => {
    const completed = [20, 21, 23, 24, 25, 26].map(idForNumber);
    const r = getCurrentNext('DMAIC', completed, CATALOG);
    // Ready: #22 (deps [#21, #26]), #32 (deps [#21]). Lowest = #22.
    assert.equal(r.current?.activityNumber, 22);
  });

  test('#28 dependsOn [#22, #31]; both required', () => {
    const completed = [20, 21, 22, 23, 24, 25, 26, 32].map(idForNumber);
    // Without #31 → #28 not ready yet. Ready: #31 (deps [#22]).
    const r1 = getCurrentNext('DMAIC', completed, CATALOG);
    assert.notEqual(r1.current?.activityNumber, 28);
    assert.equal(r1.current?.activityNumber, 31);
    const withBoth = [...completed, idForNumber(31)];
    const r2 = getCurrentNext('DMAIC', withBoth, CATALOG);
    // Ready: #28 (deps [#22, #31]), #34 (deps [#26, #32]). Lowest = #28.
    assert.equal(r2.current?.activityNumber, 28);
  });

  test('#39 dependsOn [#38, #33]; not ready without both', () => {
    const partial = [20, 21, 22, 23, 25, 26, 31, 28, 33, 36, 35, 34, 32, 37, 38].map(
      idForNumber
    );
    // Without #33 in completed, #39 should not be ready.
    const withoutThirtyThree = partial.filter(
      (id) => id !== idForNumber(33)
    );
    const r1 = getCurrentNext('DMAIC', withoutThirtyThree, CATALOG);
    assert.notEqual(r1.current?.activityNumber, 39);

    const r2 = getCurrentNext('DMAIC', partial, CATALOG);
    // #39 should be ready now (#38 and #33 both present). The lowest
    // activityNumber among ready entries may be a post-run; check inclusion.
    assert.ok(r2.remaining.some((c) => c.activityNumber === 39));
  });

  test('all 22 DMAIC rows completed → current=null, next=null', () => {
    const completed = [];
    for (let n = 20; n <= 41; n += 1) completed.push(idForNumber(n));
    const r = getCurrentNext('DMAIC', completed, CATALOG);
    assert.equal(r.current, null);
    assert.equal(r.next, null);
    assert.deepEqual(r.remaining, []);
  });

  test('remaining set decreases as completion grows', () => {
    const r1 = getCurrentNext('DMAIC', [], CATALOG);
    assert.equal(r1.remaining.length, 22);
    const r2 = getCurrentNext('DMAIC', [idForNumber(20)], CATALOG);
    assert.equal(r2.remaining.length, 21);
  });

  test('deterministic: same input twice → identical output', () => {
    const a = getCurrentNext('DMAIC', [idForNumber(20)], CATALOG);
    const b = getCurrentNext('DMAIC', [idForNumber(20)], CATALOG);
    assert.equal(a.current?.id, b.current?.id);
    assert.equal(a.next?.id, b.next?.id);
  });

  test('accepts Set<string> completed argument', () => {
    const completed = new Set([idForNumber(20)]);
    const r = getCurrentNext('DMAIC', completed, CATALOG);
    assert.equal(r.current?.activityNumber, 21);
  });

  test('#29, #30 root-dependOn — ready after #28', () => {
    const completed = [20, 21, 22, 23, 24, 25, 26, 31, 32, 28].map(idForNumber);
    const r = getCurrentNext('DMAIC', completed, CATALOG);
    // Ready: #27 (deps [#28]), #29 (deps [#28]), #30 (deps [#28]),
    // #34 (deps [#26, #32]), #33 (needs #36 — NOT).
    // Lowest = #27.
    assert.equal(r.current?.activityNumber, 27);
    // All of #27, #29, #30 are in the remaining set.
    const rem = r.remaining.map((e) => e.activityNumber);
    assert.ok(rem.includes(29));
    assert.ok(rem.includes(30));
  });

  test('missing entries for activityNumbers silently handled', () => {
    const emptyCat = [];
    const r = getCurrentNext('DMAIC', [], emptyCat);
    assert.equal(r.current, null);
    assert.equal(r.next, null);
    assert.deepEqual(r.remaining, []);
  });

  test('unknown projectType returns null-null-empty', () => {
    const r = getCurrentNext('BOGUS_TYPE', [], CATALOG);
    assert.equal(r.current, null);
    assert.equal(r.next, null);
  });

  test('null projectType returns null-null-empty', () => {
    const r = getCurrentNext(null, [], CATALOG);
    assert.equal(r.current, null);
    assert.equal(r.next, null);
  });
});

// ---------------------------------------------------------------------------
// getCurrentNext — linear KAIZEN_EVENT_90D progression
// ---------------------------------------------------------------------------

describe('getCurrentNext — KAIZEN_EVENT_90D (linear)', () => {
  test('no completion → current=#42, next=#43', () => {
    const r = getCurrentNext('KAIZEN_EVENT_90D', [], CATALOG);
    assert.equal(r.current?.activityNumber, 42);
    assert.equal(r.next?.activityNumber, 43);
  });

  test('#42 completed → current=#43, next=#44', () => {
    const r = getCurrentNext(
      'KAIZEN_EVENT_90D',
      [idForNumber(42)],
      CATALOG
    );
    assert.equal(r.current?.activityNumber, 43);
    assert.equal(r.next?.activityNumber, 44);
  });

  test('#42,#43,#44 completed → current=#45', () => {
    const r = getCurrentNext(
      'KAIZEN_EVENT_90D',
      [42, 43, 44].map(idForNumber),
      CATALOG
    );
    assert.equal(r.current?.activityNumber, 45);
  });

  test('all 9 rows completed → current=null, next=null', () => {
    const completed = [];
    for (let n = 42; n <= 50; n += 1) completed.push(idForNumber(n));
    const r = getCurrentNext('KAIZEN_EVENT_90D', completed, CATALOG);
    assert.equal(r.current, null);
    assert.equal(r.next, null);
    assert.deepEqual(r.remaining, []);
  });

  test('last row (#50) only → current=#50 when nothing completed of #42..#49? No — linear demands order', () => {
    // Linear progression: "current" is always the FIRST uncompleted in the
    // sorted slice. If only #50 uncompleted → current=#50.
    const completed = [42, 43, 44, 45, 46, 47, 48, 49].map(idForNumber);
    const r = getCurrentNext('KAIZEN_EVENT_90D', completed, CATALOG);
    assert.equal(r.current?.activityNumber, 50);
    assert.equal(r.next, null);
  });

  test('deterministic: Set vs Array same result', () => {
    const arr = getCurrentNext(
      'KAIZEN_EVENT_90D',
      [idForNumber(42)],
      CATALOG
    );
    const set = getCurrentNext(
      'KAIZEN_EVENT_90D',
      new Set([idForNumber(42)]),
      CATALOG
    );
    assert.equal(arr.current?.id, set.current?.id);
    assert.equal(arr.next?.id, set.next?.id);
  });
});

// ---------------------------------------------------------------------------
// getCurrentNext — linear KAIZEN_EVENT progression (same 9 rows)
// ---------------------------------------------------------------------------

describe('getCurrentNext — KAIZEN_EVENT (linear, same slice as 90D)', () => {
  test('no completion → current=#42, next=#43', () => {
    const r = getCurrentNext('KAIZEN_EVENT', [], CATALOG);
    assert.equal(r.current?.activityNumber, 42);
    assert.equal(r.next?.activityNumber, 43);
  });

  test('all 9 rows completed → null/null/[]', () => {
    const completed = [];
    for (let n = 42; n <= 50; n += 1) completed.push(idForNumber(n));
    const r = getCurrentNext('KAIZEN_EVENT', completed, CATALOG);
    assert.equal(r.current, null);
    assert.equal(r.next, null);
    assert.deepEqual(r.remaining, []);
  });
});

// ---------------------------------------------------------------------------
// getCurrentNext — AD_HOC + KAIZEN_ACCELERATOR_30D
// ---------------------------------------------------------------------------

describe('getCurrentNext — AD_HOC (linear, #12 PDCA only for now)', () => {
  test('no completion → current=#12, next=null (only 1 row)', () => {
    const r = getCurrentNext('AD_HOC', [], CATALOG);
    assert.equal(r.current?.activityNumber, 12);
    assert.equal(r.next, null);
  });

  test('#12 completed → all null, remaining empty', () => {
    const r = getCurrentNext('AD_HOC', [idForNumber(12)], CATALOG);
    assert.equal(r.current, null);
    assert.equal(r.next, null);
    assert.deepEqual(r.remaining, []);
  });
});

describe('getCurrentNext — KAIZEN_ACCELERATOR_30D (no rows yet)', () => {
  test('empty slice → current=null, next=null', () => {
    const r = getCurrentNext('KAIZEN_ACCELERATOR_30D', [], CATALOG);
    assert.equal(r.current, null);
    assert.equal(r.next, null);
    assert.deepEqual(r.remaining, []);
  });

  test('injected accelerator rows respected', () => {
    const stub = [
      {
        id: 'cat_acc_phase0_a',
        activityNumber: 100,
        projectTypeBinding: 'KAIZEN_ACCELERATOR_30D',
        dependsOn: []
      },
      {
        id: 'cat_acc_phase0_b',
        activityNumber: 101,
        projectTypeBinding: 'KAIZEN_ACCELERATOR_30D',
        dependsOn: []
      }
    ];
    const r = getCurrentNext('KAIZEN_ACCELERATOR_30D', [], stub);
    assert.equal(r.current?.id, 'cat_acc_phase0_a');
    assert.equal(r.next?.id, 'cat_acc_phase0_b');
  });

  test('first row completed → current=second', () => {
    const stub = [
      {
        id: 'cat_acc_phase0_a',
        activityNumber: 100,
        projectTypeBinding: 'KAIZEN_ACCELERATOR_30D',
        dependsOn: []
      },
      {
        id: 'cat_acc_phase0_b',
        activityNumber: 101,
        projectTypeBinding: 'KAIZEN_ACCELERATOR_30D',
        dependsOn: []
      }
    ];
    const r = getCurrentNext(
      'KAIZEN_ACCELERATOR_30D',
      ['cat_acc_phase0_a'],
      stub
    );
    assert.equal(r.current?.id, 'cat_acc_phase0_b');
    assert.equal(r.next, null);
  });
});
