/**
 * Tests for editMode pure helpers (Sprint 12 Pass 12a).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  isProtectedBlock,
  applySwap,
  applyRemove,
  applyAdd,
  activityFromCatalogEntry,
  computePlannedByBucket,
  validateEditState,
  pushUndo,
  popUndo,
  durationDelta,
  filterCatalog,
  isInToday,
  PROTECTED_CATALOG_IDS,
  PROTECTED_NAMES
} from '../../js/ui/editMode.js';

import { createDeterministicIdGenerator } from '../../js/services/IdGeneratorService.js';

const NOW = '2026-04-22T09:00:00Z';

/** Canonical deterministic generator used across editMode.test.js */
function mkIdGen(seed = 0) {
  return createDeterministicIdGenerator(seed);
}

function mkActivity(overrides = {}) {
  return {
    id: `sa_${Math.random().toString(36).slice(2, 8)}`,
    catalogEntryId: 'cat_some',
    name: 'Some Work',
    bucket: 'PROJECT',
    plannedDurationMinutes: 60,
    plannedStartAt: null,
    state: 'PROPOSED',
    sourceOfSchedule: 'COMPOSER_AUTO',
    ...overrides
  };
}

function mkEntry(overrides = {}) {
  return {
    id: 'cat_new',
    name: 'New Work',
    bucket: 'PROJECT',
    defaultDurationMinutes: 30,
    enabledByUser: true,
    ...overrides
  };
}

describe('editMode.isProtectedBlock', () => {
  test('returns false for a vanilla project block', () => {
    assert.equal(isProtectedBlock(mkActivity()), false);
  });

  test('protects Daily Standup by id', () => {
    assert.equal(isProtectedBlock(mkActivity({ catalogEntryId: 'cer_daily_standup', name: 'Daily Standup' })), true);
  });

  test('protects Sprint Planning by id', () => {
    assert.equal(isProtectedBlock(mkActivity({ catalogEntryId: 'cer_sprint_planning' })), true);
  });

  test('protects Sprint Review by id', () => {
    assert.equal(isProtectedBlock(mkActivity({ catalogEntryId: 'cer_sprint_review' })), true);
  });

  test('protects Sprint Retrospective by id', () => {
    assert.equal(isProtectedBlock(mkActivity({ catalogEntryId: 'cer_sprint_retrospective' })), true);
  });

  test('protects AM High-value Communication via slotKind AM_COMM', () => {
    assert.equal(
      isProtectedBlock(mkActivity({ slotKind: 'AM_COMM', bucket: 'COMMUNICATION' })),
      true
    );
  });

  test('protects Post-lunch Communication via slotKind POST_LUNCH_COMM', () => {
    assert.equal(
      isProtectedBlock(mkActivity({ slotKind: 'POST_LUNCH_COMM', bucket: 'COMMUNICATION' })),
      true
    );
  });

  test('protects End-of-Activity Reflection by id', () => {
    assert.equal(isProtectedBlock(mkActivity({ catalogEntryId: 'gen_end_of_activity_reflection' })), true);
  });

  test('protects R2 rescue (carriedOver=true)', () => {
    assert.equal(isProtectedBlock(mkActivity({ carriedOver: true })), true);
  });

  test('protects strategic Deep payload (PROJECT + strategic=true)', () => {
    assert.equal(isProtectedBlock(mkActivity({ strategic: true })), true);
  });

  test('strategic flag outside PROJECT does NOT protect', () => {
    // strategic is PROJECT-scoped; an accidental strategic:true on a COMM
    // row is not protected.
    assert.equal(
      isProtectedBlock(mkActivity({ bucket: 'COMMUNICATION', strategic: true })),
      false
    );
  });

  test('protects by name even when id is unknown', () => {
    assert.equal(
      isProtectedBlock(mkActivity({ catalogEntryId: 'x', name: 'Daily Standup' })),
      true
    );
  });

  test('null / non-object input returns false', () => {
    assert.equal(isProtectedBlock(null), false);
    assert.equal(isProtectedBlock(undefined), false);
    assert.equal(isProtectedBlock('a'), false);
  });
});

describe('editMode.activityFromCatalogEntry', () => {
  test('materializes a fresh activity with exact id from generator', () => {
    const gen = mkIdGen(0);
    const d = activityFromCatalogEntry(mkEntry(), null, NOW, gen);
    assert.equal(d.id, 'sa_edit_det_0');
    assert.equal(d.catalogEntryId, 'cat_new');
    assert.equal(d.name, 'New Work');
    assert.equal(d.bucket, 'PROJECT');
    assert.equal(d.plannedDurationMinutes, 30);
    assert.equal(d.state, 'PROPOSED');
    assert.equal(d.sourceOfSchedule, 'COMPOSER_EDIT');
    assert.equal(d.updatedAt, NOW);
  });

  test('inherits plannedStartAt + anchor + slotKind from source slot', () => {
    const src = mkActivity({
      plannedStartAt: '09:30',
      anchor: '09:30',
      slotKind: 'PROJECT_DEEP',
      compositionId: 'comp_1',
      state: 'SCHEDULED'
    });
    const gen = mkIdGen(0);
    const d = activityFromCatalogEntry(mkEntry(), src, NOW, gen);
    assert.equal(d.id, 'sa_edit_det_0');
    assert.equal(d.plannedStartAt, '09:30');
    assert.equal(d.anchor, '09:30');
    assert.equal(d.slotKind, 'PROJECT_DEEP');
    assert.equal(d.compositionId, 'comp_1');
    assert.equal(d.state, 'SCHEDULED');
  });

  test('falls back to source slot duration when entry lacks default', () => {
    const src = mkActivity({ plannedDurationMinutes: 90 });
    const gen = mkIdGen(0);
    const d = activityFromCatalogEntry(
      { id: 'x', name: 'Y', bucket: 'PROJECT' },
      src,
      NOW,
      gen
    );
    assert.equal(d.plannedDurationMinutes, 90);
  });

  test('throws INVALID_ENTRY on null', () => {
    const gen = mkIdGen(0);
    assert.throws(() => activityFromCatalogEntry(null, null, NOW, gen), /INVALID_ENTRY/);
  });

  test('throws INVALID_ID_GENERATOR when idGenerator is missing', () => {
    assert.throws(
      () => activityFromCatalogEntry(mkEntry(), null, NOW),
      (err) => err.name === 'INVALID_ID_GENERATOR'
    );
  });

  test('throws INVALID_ID_GENERATOR when idGenerator is not a function', () => {
    assert.throws(
      () => activityFromCatalogEntry(mkEntry(), null, NOW, 'bad-value'),
      (err) => err.name === 'INVALID_ID_GENERATOR'
    );
  });

  test('same generator + same catalogEntry.id produces same id (replayability)', () => {
    const gen1 = mkIdGen(7);
    const gen2 = mkIdGen(7);
    const d1 = activityFromCatalogEntry(mkEntry({ id: 'cat_foo' }), null, NOW, gen1);
    const d2 = activityFromCatalogEntry(mkEntry({ id: 'cat_foo' }), null, NOW, gen2);
    assert.equal(d1.id, d2.id);
  });

  test('different catalogEntry.id with same generator produces different ids (uniqueness)', () => {
    const gen = mkIdGen(0);
    const d1 = activityFromCatalogEntry(mkEntry({ id: 'cat_a' }), null, NOW, gen);
    const d2 = activityFromCatalogEntry(mkEntry({ id: 'cat_b' }), null, NOW, gen);
    assert.notEqual(d1.id, d2.id);
  });
});

describe('editMode.applySwap', () => {
  test('replaces the matching slot in place with exact id', () => {
    const a1 = mkActivity({ id: 'a1' });
    const a2 = mkActivity({ id: 'a2', plannedStartAt: '10:00' });
    const entry = mkEntry();
    const gen = mkIdGen(0);
    const next = applySwap([a1, a2], 'a2', entry, NOW, gen);
    assert.equal(next.length, 2);
    assert.equal(next[0], a1); // unchanged
    assert.equal(next[1].id, 'sa_edit_det_0');
    assert.equal(next[1].catalogEntryId, 'cat_new');
    assert.equal(next[1].plannedStartAt, '10:00');
  });

  test('returns a fresh array (no mutation)', () => {
    const a1 = mkActivity({ id: 'a1' });
    const input = [a1];
    const out = applySwap(input, 'a1', mkEntry(), NOW, mkIdGen(0));
    assert.notEqual(out, input);
  });

  test('no-op when slotActivityId is not found', () => {
    const a1 = mkActivity({ id: 'a1' });
    const out = applySwap([a1], 'zzz', mkEntry(), NOW, mkIdGen(0));
    assert.equal(out.length, 1);
    assert.equal(out[0], a1);
  });

  test('handles non-array input', () => {
    assert.deepEqual(applySwap(null, 'x', mkEntry(), NOW, mkIdGen(0)), []);
  });
});

describe('editMode.applyRemove', () => {
  test('removes the targeted slot', () => {
    const a1 = mkActivity({ id: 'a1' });
    const a2 = mkActivity({ id: 'a2' });
    const out = applyRemove([a1, a2], 'a1');
    assert.equal(out.length, 1);
    assert.equal(out[0].id, 'a2');
  });

  test('no-op when id is absent', () => {
    const a1 = mkActivity({ id: 'a1' });
    const out = applyRemove([a1], 'zzz');
    assert.equal(out.length, 1);
  });

  test('handles non-array input', () => {
    assert.deepEqual(applyRemove(null, 'x'), []);
  });
});

describe('editMode.applyAdd', () => {
  test('appends a new slot materialized from the entry with exact id', () => {
    const a1 = mkActivity({ id: 'a1' });
    const gen = mkIdGen(0);
    const out = applyAdd([a1], mkEntry(), NOW, gen);
    assert.equal(out.length, 2);
    assert.equal(out[1].id, 'sa_edit_det_0');
    assert.equal(out[1].catalogEntryId, 'cat_new');
    assert.equal(out[1].state, 'PROPOSED');
  });

  test('works with empty / null activities', () => {
    const out = applyAdd(null, mkEntry(), NOW, mkIdGen(0));
    assert.equal(out.length, 1);
    assert.equal(out[0].catalogEntryId, 'cat_new');
  });
});

describe('editMode.computePlannedByBucket', () => {
  test('sums minutes per bucket', () => {
    const acts = [
      mkActivity({ bucket: 'PROJECT', plannedDurationMinutes: 120 }),
      mkActivity({ bucket: 'PROJECT', plannedDurationMinutes: 60 }),
      mkActivity({ bucket: 'COMMUNICATION', plannedDurationMinutes: 90 }),
      mkActivity({ bucket: 'CI', plannedDurationMinutes: 30 })
    ];
    const s = computePlannedByBucket(acts);
    assert.equal(s.PROJECT, 180);
    assert.equal(s.COMMUNICATION, 90);
    assert.equal(s.CI, 30);
  });

  test('ignores SKIPPED + DROPPED rows', () => {
    const acts = [
      mkActivity({ bucket: 'PROJECT', plannedDurationMinutes: 60, state: 'SCHEDULED' }),
      mkActivity({ bucket: 'PROJECT', plannedDurationMinutes: 60, state: 'SKIPPED' }),
      mkActivity({ bucket: 'PROJECT', plannedDurationMinutes: 60, state: 'DROPPED' })
    ];
    assert.equal(computePlannedByBucket(acts).PROJECT, 60);
  });

  test('returns zeros on empty input', () => {
    assert.deepEqual(computePlannedByBucket([]), { PROJECT: 0, COMMUNICATION: 0, CI: 0 });
    assert.deepEqual(computePlannedByBucket(null), { PROJECT: 0, COMMUNICATION: 0, CI: 0 });
  });
});

describe('editMode.validateEditState', () => {
  const floors = { PROJECT: 120, COMMUNICATION: 60, CI: 60 };
  const ceilings = { PROJECT: 264, COMMUNICATION: 150, CI: 150 };

  test('ok when every bucket within [floor, ceiling]', () => {
    const acts = [
      mkActivity({ bucket: 'PROJECT', plannedDurationMinutes: 240 }),
      mkActivity({ bucket: 'COMMUNICATION', plannedDurationMinutes: 120 }),
      mkActivity({ bucket: 'CI', plannedDurationMinutes: 120 })
    ];
    const r = validateEditState(acts, null, floors, ceilings);
    assert.equal(r.ok, true);
    assert.deepEqual(r.violations, []);
  });

  test('flags UNDER_FLOOR per bucket', () => {
    const acts = [
      mkActivity({ bucket: 'PROJECT', plannedDurationMinutes: 60 })
    ];
    const r = validateEditState(acts, null, floors, ceilings);
    assert.equal(r.ok, false);
    const proj = r.violations.find((v) => v.bucket === 'PROJECT');
    assert.equal(proj.code, 'UNDER_FLOOR');
    assert.equal(proj.actual, 60);
    assert.equal(proj.bound, 120);
  });

  test('flags OVER_CEILING per bucket', () => {
    const acts = [
      mkActivity({ bucket: 'PROJECT', plannedDurationMinutes: 300 }),
      mkActivity({ bucket: 'COMMUNICATION', plannedDurationMinutes: 100 }),
      mkActivity({ bucket: 'CI', plannedDurationMinutes: 100 })
    ];
    const r = validateEditState(acts, null, floors, ceilings);
    assert.equal(r.ok, false);
    assert.equal(r.violations[0].bucket, 'PROJECT');
    assert.equal(r.violations[0].code, 'OVER_CEILING');
  });
});

describe('editMode.pushUndo + popUndo', () => {
  test('pushes and pops in LIFO order', () => {
    let stack = [];
    stack = pushUndo(stack, [1]);
    stack = pushUndo(stack, [2]);
    stack = pushUndo(stack, [3]);
    const r1 = popUndo(stack);
    assert.deepEqual(r1.snapshot, [3]);
    const r2 = popUndo(r1.stack);
    assert.deepEqual(r2.snapshot, [2]);
  });

  test('cap defaults to 20 steps', () => {
    let stack = [];
    for (let i = 0; i < 25; i += 1) stack = pushUndo(stack, [i]);
    assert.equal(stack.length, 20);
    assert.deepEqual(stack[0], [5]); // oldest 5 dropped
  });

  test('popUndo on empty stack returns snapshot null', () => {
    const r = popUndo([]);
    assert.equal(r.snapshot, null);
    assert.deepEqual(r.stack, []);
  });

  test('pushUndo accepts null / non-array prior stack', () => {
    const next = pushUndo(null, ['s']);
    assert.deepEqual(next, [['s']]);
  });
});

describe('editMode.durationDelta', () => {
  test('positive delta when entry is longer', () => {
    const src = mkActivity({ plannedDurationMinutes: 30 });
    const ent = mkEntry({ defaultDurationMinutes: 60 });
    assert.equal(durationDelta(src, ent), 30);
  });

  test('negative delta when entry is shorter', () => {
    const src = mkActivity({ plannedDurationMinutes: 60 });
    const ent = mkEntry({ defaultDurationMinutes: 15 });
    assert.equal(durationDelta(src, ent), -45);
  });

  test('returns 0 when source is null', () => {
    assert.equal(durationDelta(null, mkEntry()), 0);
  });

  test('returns 0 when entry is null', () => {
    assert.equal(durationDelta(mkActivity(), null), 0);
  });
});

describe('editMode.filterCatalog', () => {
  const catalog = [
    { id: 'cat_1', name: 'Personal L&D', bucket: 'CI', enabledByUser: true },
    { id: 'cat_16', name: 'Connecting w/ teammates', bucket: 'COMMUNICATION', enabledByUser: true },
    {
      id: 'cat_34',
      name: 'DMAIC C&E Matrix',
      bucket: 'PROJECT',
      projectTypeBinding: 'DMAIC',
      enabledByUser: true,
      procedure: ['Identify outputs', 'Build matrix']
    },
    {
      id: 'cat_acc',
      name: '30-day kickoff',
      bucket: 'PROJECT',
      projectTypeBinding: ['KAIZEN_ACCELERATOR_30D'],
      enabledByUser: true
    },
    {
      id: 'cat_generic_deep',
      name: 'Generic Deep Work',
      bucket: 'PROJECT',
      projectTypeBinding: null,
      enabledByUser: true
    },
    { id: 'cat_disabled', name: 'Hidden', bucket: 'CI', enabledByUser: false }
  ];

  test('empty filter returns all enabled entries', () => {
    const out = filterCatalog(catalog);
    assert.equal(out.length, 5);
    assert.equal(out.find((e) => e.id === 'cat_disabled'), undefined);
  });

  test('search matches name case-insensitive', () => {
    const out = filterCatalog(catalog, { search: 'dmaic' });
    assert.equal(out.length, 1);
    assert.equal(out[0].id, 'cat_34');
  });

  test('search matches activityNumber hash', () => {
    const out = filterCatalog([{ id: 'x', activityNumber: 34, bucket: 'PROJECT', name: 'Y', enabledByUser: true }], {
      search: '#34'
    });
    assert.equal(out.length, 1);
  });

  test('search matches procedure text', () => {
    const out = filterCatalog(catalog, { search: 'build matrix' });
    assert.equal(out.length, 1);
    assert.equal(out[0].id, 'cat_34');
  });

  test('projectTypeFilter narrows PROJECT entries but leaves other buckets alone', () => {
    const out = filterCatalog(catalog, { projectTypeFilter: 'DMAIC' });
    const ids = out.map((e) => e.id);
    assert.ok(ids.includes('cat_1')); // CI — unaffected by project filter
    assert.ok(ids.includes('cat_16')); // COMM — unaffected
    assert.ok(ids.includes('cat_34')); // PROJECT + DMAIC
    assert.equal(ids.includes('cat_acc'), false);
    assert.equal(ids.includes('cat_generic_deep'), false);
  });

  test('projectTypeFilter AD_HOC includes only null-binding PROJECT entries', () => {
    const out = filterCatalog(catalog, { projectTypeFilter: 'AD_HOC' });
    const projectIds = out.filter((e) => e.bucket === 'PROJECT').map((e) => e.id);
    assert.deepEqual(projectIds, ['cat_generic_deep']);
  });

  test('projectTypeFilter KAIZEN_EVENT_90D matches KAIZEN_EVENT legacy binding', () => {
    const legacy = [
      {
        id: 'cat_legacy',
        name: 'Legacy 90d',
        bucket: 'PROJECT',
        projectTypeBinding: ['KAIZEN_EVENT'],
        enabledByUser: true
      }
    ];
    const out = filterCatalog(legacy, { projectTypeFilter: 'KAIZEN_EVENT_90D' });
    assert.equal(out.length, 1);
  });
});

describe('editMode.isInToday', () => {
  test('true when catalogEntryId is in the activities array', () => {
    assert.equal(
      isInToday([mkActivity({ catalogEntryId: 'cat_x' })], 'cat_x'),
      true
    );
  });

  test('false when missing', () => {
    assert.equal(isInToday([mkActivity({ catalogEntryId: 'cat_x' })], 'cat_y'), false);
  });

  test('false on empty or null input', () => {
    assert.equal(isInToday([], 'cat_x'), false);
    assert.equal(isInToday(null, 'cat_x'), false);
    assert.equal(isInToday([mkActivity()], ''), false);
  });
});

describe('editMode exports', () => {
  test('PROTECTED_CATALOG_IDS contains all ceremonies + reflection', () => {
    for (const id of [
      'cer_daily_standup',
      'cer_sprint_planning',
      'cer_mid_sprint_review',
      'cer_sprint_review',
      'cer_sprint_retrospective',
      'gen_end_of_activity_reflection'
    ]) {
      assert.ok(PROTECTED_CATALOG_IDS.has(id), `missing ${id}`);
    }
  });

  test('PROTECTED_NAMES includes the 4 non-optional names', () => {
    for (const n of [
      'Daily Standup',
      'AM High-value Communication',
      'Post-lunch High-value Communication',
      'End-of-Activity Reflection'
    ]) {
      assert.ok(PROTECTED_NAMES.has(n), `missing ${n}`);
    }
  });
});
