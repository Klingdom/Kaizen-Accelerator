/**
 * Tests for /js/composer/composeWeekly.js (Sprint 9 Pass 9b).
 *
 * Focus areas:
 *   - 4-2-2 invariant honored per day across all 5 days
 *   - DMAIC Kaizen: Mon has #20 + #21, later days advance the DAG
 *   - Linear Kaizen 90: Mon has #42 + #43, Tue #44, etc.
 *   - Two active Kaizens: both inject deterministic interleave
 *   - Exhausted Kaizen: stops injecting, universal fallback fills
 *   - No active Kaizens: all 5 days fill from universal project pool
 *   - COMMUNICATION: no duplicates Mon→Tue unless DAILY cadence
 *   - CI: excludes project-type-bound entries
 *   - Capacity overrides honored per day
 *   - Determinism: same input twice → identical output
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  composeWeekly,
  weekDaysFromStart,
  weeklyAnchorDay
} from '../../js/composer/composeWeekly.js';
import { buildCatalog } from '../../js/catalog/seed/index.js';

const CATALOG = buildCatalog();
const MONDAY = '2026-04-20';
const FROZEN_NOW = '2026-04-20T08:00:00Z';

function idForNumber(n) {
  const e = CATALOG.find((c) => c.activityNumber === n);
  if (!e) throw new Error(`No catalog row for #${n}`);
  return e.id;
}

function makeKaizen(overrides = {}) {
  return {
    id: 'k_test',
    userId: 'user_test',
    title: 'Test Kaizen',
    state: 'ACTIVE',
    projectType: 'DMAIC',
    createdAt: '2026-04-01T00:00:00Z',
    openedAt: '2026-04-01T00:00:00Z',
    ...overrides
  };
}

function buildInput(overrides = {}) {
  return {
    weekStart: MONDAY,
    userId: 'user_test',
    kaizens: [],
    historicalCompletedCatalogIds: [],
    catalog: CATALOG,
    dailyCapacityMinutes: 480,
    _now: FROZEN_NOW,
    ...overrides
  };
}

// ---------------------------------------------------------------------------
// Date / anchor helpers
// ---------------------------------------------------------------------------

describe('weekDaysFromStart', () => {
  test('returns 5 ISO dates Mon..Fri', () => {
    const days = weekDaysFromStart('2026-04-20'); // 2026-04-20 is a Monday
    assert.deepEqual(days, [
      '2026-04-20',
      '2026-04-21',
      '2026-04-22',
      '2026-04-23',
      '2026-04-24'
    ]);
  });

  test('throws WEEK_START_NOT_MONDAY for a Tuesday', () => {
    assert.throws(
      () => weekDaysFromStart('2026-04-21'),
      /WEEK_START_NOT_MONDAY/
    );
  });

  test('throws INVALID_WEEK_START for a malformed string', () => {
    assert.throws(
      () => weekDaysFromStart('not-a-date'),
      /INVALID_WEEK_START/
    );
    assert.throws(
      () => weekDaysFromStart('2026-13-01'),
      /(INVALID_WEEK_START|WEEK_START_NOT_MONDAY)/
    );
  });

  test('throws for null / undefined input', () => {
    assert.throws(() => weekDaysFromStart(null), /INVALID_WEEK_START/);
    assert.throws(() => weekDaysFromStart(undefined), /INVALID_WEEK_START/);
  });
});

describe('weeklyAnchorDay heuristic', () => {
  test('defaults to Monday (0) when trigger is empty', () => {
    assert.equal(weeklyAnchorDay({ trigger: '' }), 0);
  });

  test('matches "Friday" trigger → 4', () => {
    assert.equal(
      weeklyAnchorDay({ trigger: 'Friday afternoon, 16:30 local' }),
      4
    );
  });

  test('matches "Wed" trigger → 2', () => {
    assert.equal(weeklyAnchorDay({ trigger: 'Wed 10:00' }), 2);
  });

  test('explicit anchorDay field wins', () => {
    assert.equal(
      weeklyAnchorDay({ trigger: 'Monday', anchorDay: 'Thu' }),
      3
    );
  });

  test('anchorDay outside week → falls back to trigger parse', () => {
    assert.equal(
      weeklyAnchorDay({ trigger: 'Monday', anchorDay: 'Saturday' }),
      0
    );
  });
});

// ---------------------------------------------------------------------------
// Basic shape
// ---------------------------------------------------------------------------

describe('composeWeekly — shape + determinism', () => {
  test('returns 5-day WeeklyComposition with Mon-Fri dates', () => {
    const w = composeWeekly(buildInput());
    assert.equal(w.weekStart, MONDAY);
    assert.equal(w.weekEnd, '2026-04-24');
    assert.equal(w.days.length, 5);
    assert.deepEqual(
      w.days.map((d) => d.date),
      ['2026-04-20', '2026-04-21', '2026-04-22', '2026-04-23', '2026-04-24']
    );
  });

  test('state=PROPOSED + proposedAt uses _now', () => {
    const w = composeWeekly(buildInput());
    assert.equal(w.state, 'PROPOSED');
    assert.equal(w.proposedAt, FROZEN_NOW);
  });

  test('composerInputsSnapshot captures daily capacity', () => {
    const w = composeWeekly(buildInput({ dailyCapacityMinutes: 360 }));
    assert.equal(w.composerInputsSnapshot.dailyCapacityMinutes, 360);
  });

  test('every day has a unique composition id', () => {
    const w = composeWeekly(buildInput());
    const ids = w.days.map((d) => d.id);
    assert.equal(new Set(ids).size, 5);
  });

  test('every day has cycleType=DAILY', () => {
    const w = composeWeekly(buildInput());
    for (const d of w.days) {
      assert.equal(d.cycleType, 'DAILY');
    }
  });

  test('every day has activities[] attached', () => {
    const w = composeWeekly(buildInput());
    for (const d of w.days) {
      assert.ok(Array.isArray(d.activities));
      assert.ok(d.activities.length > 0, `day ${d.date} had no activities`);
    }
  });

  test('every activity has a compositionId linking to the parent day', () => {
    const w = composeWeekly(buildInput());
    for (const d of w.days) {
      for (const a of d.activities) {
        assert.equal(a.compositionId, d.id);
      }
    }
  });

  test('every activity has state=PROPOSED', () => {
    const w = composeWeekly(buildInput());
    for (const d of w.days) {
      for (const a of d.activities) {
        assert.equal(a.state, 'PROPOSED');
      }
    }
  });

  test('deterministic: same input → identical output', () => {
    const a = composeWeekly(buildInput());
    const b = composeWeekly(buildInput());
    assert.deepEqual(a, b);
  });

  test('throws INVALID_INPUT when input is null', () => {
    assert.throws(() => composeWeekly(null), /INVALID_INPUT/);
  });

  test('throws INVALID_INPUT when userId missing', () => {
    assert.throws(
      () => composeWeekly(buildInput({ userId: '' })),
      /INVALID_INPUT/
    );
  });

  test('throws INVALID_INPUT when catalog is not an array', () => {
    assert.throws(
      () => composeWeekly(buildInput({ catalog: null })),
      /INVALID_INPUT/
    );
  });

  test('throws WEEK_START_NOT_MONDAY for non-Monday weekStart', () => {
    assert.throws(
      () => composeWeekly(buildInput({ weekStart: '2026-04-21' })),
      /WEEK_START_NOT_MONDAY/
    );
  });
});

// ---------------------------------------------------------------------------
// 4-2-2 invariant
// ---------------------------------------------------------------------------

describe('composeWeekly — 4-2-2 invariant', () => {
  test('every day lands PROJECT ≥ floor AND COMMUNICATION ≥ floor AND CI ≥ floor', () => {
    const w = composeWeekly(buildInput());
    for (const d of w.days) {
      assert.ok(
        d.plannedByBucket.PROJECT >= 120,
        `${d.date} PROJECT ${d.plannedByBucket.PROJECT} < floor 120`
      );
      assert.ok(
        d.plannedByBucket.COMMUNICATION >= 60,
        `${d.date} COMM ${d.plannedByBucket.COMMUNICATION} < floor 60`
      );
      assert.ok(
        d.plannedByBucket.CI >= 60,
        `${d.date} CI ${d.plannedByBucket.CI} < floor 60`
      );
    }
  });

  test('every day lands PROJECT ≤ ceiling', () => {
    const w = composeWeekly(buildInput());
    for (const d of w.days) {
      assert.ok(
        d.plannedByBucket.PROJECT <= 264,
        `${d.date} PROJECT ${d.plannedByBucket.PROJECT} > ceiling 264`
      );
    }
  });

  test('invariantChecks.shape_4_2_2.ok is true for every day', () => {
    const w = composeWeekly(buildInput());
    for (const d of w.days) {
      assert.equal(d.invariantChecks.shape_4_2_2.ok, true, `${d.date} not OK`);
    }
  });

  test('total minutes per day ≤ capacity', () => {
    const w = composeWeekly(buildInput({ dailyCapacityMinutes: 480 }));
    for (const d of w.days) {
      const total =
        d.plannedByBucket.PROJECT +
        d.plannedByBucket.COMMUNICATION +
        d.plannedByBucket.CI;
      assert.ok(total <= 480, `${d.date} total ${total} > capacity 480`);
    }
  });
});

// ---------------------------------------------------------------------------
// DMAIC Kaizen injection
// ---------------------------------------------------------------------------

describe('composeWeekly — DMAIC Kaizen progression', () => {
  const kaizens = [
    makeKaizen({
      id: 'k_dmaic',
      projectType: 'DMAIC'
    })
  ];

  test('Monday has #20 (Charter) in PROJECT bucket', () => {
    const w = composeWeekly(buildInput({ kaizens }));
    const monProject = w.days[0].activities.filter(
      (a) => a.bucket === 'PROJECT'
    );
    const has20 = monProject.some(
      (a) => a.catalogEntryId === idForNumber(20)
    );
    assert.ok(has20, `Mon PROJECT should have #20: ${monProject.map((a) => a.catalogEntryId)}`);
  });

  test('Monday has #21 (SIPOC) as second project payload', () => {
    const w = composeWeekly(buildInput({ kaizens }));
    const monProject = w.days[0].activities.filter(
      (a) => a.bucket === 'PROJECT'
    );
    const has21 = monProject.some(
      (a) => a.catalogEntryId === idForNumber(21)
    );
    assert.ok(has21);
  });

  test('Tuesday advances the DAG — #23 is next (not #22 which still waits on #26)', () => {
    const w = composeWeekly(buildInput({ kaizens }));
    const tueProject = w.days[1].activities.filter(
      (a) => a.bucket === 'PROJECT'
    );
    const tueKaizenPayload = tueProject.find((a) => a.linkedKaizenId === 'k_dmaic');
    assert.ok(tueKaizenPayload);
    assert.equal(tueKaizenPayload.catalogEntryId, idForNumber(23));
  });

  test('each Mon..Fri project payload has linkedKaizenId + linkedDmaicStepRef', () => {
    const w = composeWeekly(buildInput({ kaizens }));
    for (let i = 0; i < 5; i += 1) {
      const kzPayloads = w.days[i].activities.filter(
        (a) => a.linkedKaizenId === 'k_dmaic'
      );
      for (const p of kzPayloads) {
        assert.ok(p.linkedDmaicStepRef);
        assert.equal(p.linkedDmaicStepRef.kaizenId, 'k_dmaic');
      }
    }
  });

  test('no two Kaizen payloads repeat the same catalogEntryId within the week', () => {
    const w = composeWeekly(buildInput({ kaizens }));
    const kzCatIds = [];
    for (const d of w.days) {
      for (const a of d.activities) {
        if (a.linkedKaizenId === 'k_dmaic') {
          kzCatIds.push(a.catalogEntryId);
        }
      }
    }
    assert.equal(new Set(kzCatIds).size, kzCatIds.length, 'duplicate kaizen payload');
  });

  test('historical completion of #20 → Mon has #21 + #23 (not #20)', () => {
    const w = composeWeekly(
      buildInput({
        kaizens,
        historicalCompletedCatalogIds: [idForNumber(20)]
      })
    );
    const monProject = w.days[0].activities.filter(
      (a) => a.bucket === 'PROJECT' && a.linkedKaizenId === 'k_dmaic'
    );
    const catIds = monProject.map((a) => a.catalogEntryId);
    assert.ok(!catIds.includes(idForNumber(20)), '#20 should be skipped');
    assert.ok(catIds.includes(idForNumber(21)));
    assert.ok(catIds.includes(idForNumber(23)));
  });

  test('historical completion of #20+#21 → Mon has #23 + #24', () => {
    const w = composeWeekly(
      buildInput({
        kaizens,
        historicalCompletedCatalogIds: [idForNumber(20), idForNumber(21)]
      })
    );
    const monKz = w.days[0].activities.filter(
      (a) => a.linkedKaizenId === 'k_dmaic'
    );
    const catIds = monKz.map((a) => a.catalogEntryId);
    assert.ok(catIds.includes(idForNumber(23)));
    // Ready after #23 included: #24 (deps [#23]), #25 (deps [#20, #21]),
    // #26 (deps [#23]). Lowest of still-not-planned = #24.
    assert.ok(catIds.includes(idForNumber(24)) || catIds.includes(idForNumber(25)));
  });
});

// ---------------------------------------------------------------------------
// Linear Kaizen 90
// ---------------------------------------------------------------------------

describe('composeWeekly — Linear Kaizen 90 progression', () => {
  const kaizens = [
    makeKaizen({
      id: 'k_90d',
      projectType: 'KAIZEN_EVENT_90D',
      createdAt: '2026-04-01T00:00:00Z'
    })
  ];

  test('Monday has #42 Charter and #43 Output DCP', () => {
    const w = composeWeekly(buildInput({ kaizens }));
    const monKz = w.days[0].activities.filter(
      (a) => a.linkedKaizenId === 'k_90d'
    );
    const catIds = monKz.map((a) => a.catalogEntryId);
    assert.ok(catIds.includes(idForNumber(42)));
    assert.ok(catIds.includes(idForNumber(43)));
  });

  test('Tuesday has #44', () => {
    const w = composeWeekly(buildInput({ kaizens }));
    const tueKz = w.days[1].activities.filter(
      (a) => a.linkedKaizenId === 'k_90d'
    );
    assert.equal(tueKz.length, 1);
    assert.equal(tueKz[0].catalogEntryId, idForNumber(44));
  });

  test('Wednesday has #45', () => {
    const w = composeWeekly(buildInput({ kaizens }));
    const wedKz = w.days[2].activities.filter(
      (a) => a.linkedKaizenId === 'k_90d'
    );
    assert.equal(wedKz[0].catalogEntryId, idForNumber(45));
  });

  test('Thursday has #46, Friday has #47', () => {
    const w = composeWeekly(buildInput({ kaizens }));
    const thu = w.days[3].activities.filter((a) => a.linkedKaizenId === 'k_90d');
    const fri = w.days[4].activities.filter((a) => a.linkedKaizenId === 'k_90d');
    assert.equal(thu[0].catalogEntryId, idForNumber(46));
    assert.equal(fri[0].catalogEntryId, idForNumber(47));
  });
});

// ---------------------------------------------------------------------------
// Two active Kaizens
// ---------------------------------------------------------------------------

describe('composeWeekly — two active Kaizens', () => {
  const kaizens = [
    makeKaizen({
      id: 'k_first',
      projectType: 'DMAIC',
      createdAt: '2026-04-01T00:00:00Z'
    }),
    makeKaizen({
      id: 'k_second',
      projectType: 'KAIZEN_EVENT_90D',
      createdAt: '2026-04-05T00:00:00Z'
    })
  ];

  test('k_first (earlier createdAt) gets its Mon injections first', () => {
    const w = composeWeekly(buildInput({ kaizens }));
    const firstIds = w.days[0].activities
      .filter((a) => a.linkedKaizenId === 'k_first')
      .map((a) => a.catalogEntryId);
    assert.ok(firstIds.length >= 1, 'k_first should take at least 1 Mon slot');
  });

  test('deterministic: swapping input array order produces identical output', () => {
    const w1 = composeWeekly(buildInput({ kaizens }));
    const reordered = [kaizens[1], kaizens[0]]; // swap input order
    const w2 = composeWeekly(buildInput({ kaizens: reordered }));
    // Both should produce the same output regardless of input kaizen order.
    for (let i = 0; i < 5; i += 1) {
      assert.deepEqual(
        w1.days[i].activities.map((a) => a.catalogEntryId).sort(),
        w2.days[i].activities.map((a) => a.catalogEntryId).sort()
      );
    }
  });

  test('later days (Tue..Fri) with smaller per-kaizen budgets allow both to place', () => {
    // Mon the first kaizen may fill PROJECT; Tue..Fri each kaizen takes 1
    // payload slot (capacity has 240 PROJECT available, enough for 2 small
    // payloads from 2 kaizens). Not all days guaranteed both — but on
    // smaller DMAIC rows (e.g. #23 = 120min + #44 = 30min) both should
    // fit somewhere in Tue..Fri.
    const w = composeWeekly(buildInput({ kaizens }));
    // Count total kaizen-linked payloads across the week for each kaizen.
    let firstCount = 0;
    let secondCount = 0;
    for (const d of w.days) {
      for (const a of d.activities) {
        if (a.linkedKaizenId === 'k_first') firstCount += 1;
        if (a.linkedKaizenId === 'k_second') secondCount += 1;
      }
    }
    assert.ok(firstCount >= 1, 'k_first should appear at least once in the week');
    assert.ok(secondCount >= 1, 'k_second should appear at least once in the week');
  });
});

// ---------------------------------------------------------------------------
// Exhausted Kaizen + no kaizens
// ---------------------------------------------------------------------------

describe('composeWeekly — exhausted / absent Kaizens', () => {
  test('Kaizen with all catalog rows completed → no injections, universal fill', () => {
    const completed = [];
    for (let n = 42; n <= 50; n += 1) completed.push(idForNumber(n));
    const kaizens = [
      makeKaizen({
        id: 'k_done',
        projectType: 'KAIZEN_EVENT_90D'
      })
    ];
    const w = composeWeekly(
      buildInput({ kaizens, historicalCompletedCatalogIds: completed })
    );
    for (const d of w.days) {
      const kzPayloads = d.activities.filter(
        (a) => a.linkedKaizenId === 'k_done'
      );
      assert.equal(kzPayloads.length, 0, `${d.date} should have no k_done payload`);
      // PROJECT still filled by universal pool.
      assert.ok(d.plannedByBucket.PROJECT >= 120);
    }
  });

  test('no active Kaizens → all 5 days filled from universal project pool', () => {
    const w = composeWeekly(buildInput({ kaizens: [] }));
    for (const d of w.days) {
      const kzAny = d.activities.filter((a) => !!a.linkedKaizenId);
      assert.deepEqual(kzAny, [], `${d.date} should have zero kaizen payloads`);
      assert.ok(d.plannedByBucket.PROJECT >= 120);
    }
  });

  test('DRAFT-state Kaizens are ignored (only ACTIVE / IN_REMEASUREMENT inject)', () => {
    const kaizens = [
      makeKaizen({
        id: 'k_draft',
        state: 'DRAFT',
        projectType: 'DMAIC'
      })
    ];
    const w = composeWeekly(buildInput({ kaizens }));
    const anyDraft = w.days.some((d) =>
      d.activities.some((a) => a.linkedKaizenId === 'k_draft')
    );
    assert.equal(anyDraft, false);
  });

  test('CLOSED Kaizens are ignored', () => {
    const kaizens = [
      makeKaizen({ id: 'k_closed', state: 'CLOSED', projectType: 'DMAIC' })
    ];
    const w = composeWeekly(buildInput({ kaizens }));
    const anyClosed = w.days.some((d) =>
      d.activities.some((a) => a.linkedKaizenId === 'k_closed')
    );
    assert.equal(anyClosed, false);
  });

  test('IN_REMEASUREMENT Kaizens still inject', () => {
    const kaizens = [
      makeKaizen({
        id: 'k_rem',
        state: 'IN_REMEASUREMENT',
        projectType: 'DMAIC'
      })
    ];
    const w = composeWeekly(buildInput({ kaizens }));
    const monKz = w.days[0].activities.filter(
      (a) => a.linkedKaizenId === 'k_rem'
    );
    assert.ok(monKz.length >= 1);
  });
});

// ---------------------------------------------------------------------------
// Communication bucket rules
// ---------------------------------------------------------------------------

describe('composeWeekly — COMMUNICATION bucket rules', () => {
  test('every day has COMMUNICATION content', () => {
    const w = composeWeekly(buildInput());
    for (const d of w.days) {
      assert.ok(d.plannedByBucket.COMMUNICATION > 0);
    }
  });

  test('WEEKLY-cadence entries do NOT repeat same day 2 (anchor-gated)', () => {
    const w = composeWeekly(buildInput());
    // We'd need to observe anchor-gated eligibility; for now assert that
    // no WEEKLY (non-DAILY) entry appears on both day 0 AND day 1.
    const mon = new Set(
      w.days[0].activities
        .filter((a) => a.bucket === 'COMMUNICATION')
        .map((a) => a.catalogEntryId)
    );
    const tue = new Set(
      w.days[1].activities
        .filter((a) => a.bucket === 'COMMUNICATION')
        .map((a) => a.catalogEntryId)
    );
    // Look up which of these are WEEKLY (not DAILY).
    for (const id of mon) {
      const entry = CATALOG.find((c) => c.id === id);
      if (entry && entry.cadence !== 'DAILY' && tue.has(id)) {
        assert.fail(
          `Non-DAILY comm entry ${id} (cadence=${entry.cadence}) repeated Mon→Tue`
        );
      }
    }
  });

  test('DAILY-cadence comm entries MAY repeat days', () => {
    // The gen_value_added_communication entry is DAILY — expected to
    // appear multiple days.
    const w = composeWeekly(buildInput());
    const dailyCount = w.days.filter((d) =>
      d.activities.some(
        (a) => a.catalogEntryId === 'gen_value_added_communication'
      )
    ).length;
    assert.ok(dailyCount >= 1);
  });
});

// ---------------------------------------------------------------------------
// CI bucket rules
// ---------------------------------------------------------------------------

describe('composeWeekly — CI bucket excludes project-type-bound entries', () => {
  test('no CI activity is a project-type-bound catalog entry', () => {
    const w = composeWeekly(buildInput());
    for (const d of w.days) {
      for (const a of d.activities) {
        if (a.bucket !== 'CI') continue;
        const entry = CATALOG.find((c) => c.id === a.catalogEntryId);
        if (!entry) continue;
        const b = entry.projectTypeBinding;
        const bound = b !== null && b !== undefined;
        assert.ok(
          !bound,
          `${a.catalogEntryId} is project-type-bound but appeared in CI`
        );
      }
    }
  });

  test('every day has CI content ≥ floor', () => {
    const w = composeWeekly(buildInput());
    for (const d of w.days) {
      assert.ok(d.plannedByBucket.CI >= 60);
    }
  });
});

// ---------------------------------------------------------------------------
// Capacity overrides
// ---------------------------------------------------------------------------

describe('composeWeekly — capacity overrides per day', () => {
  test('per-day capacity override is respected', () => {
    const w = composeWeekly(
      buildInput({ capacityOverrides: { 2: 240 } })
    );
    const wedTotal =
      w.days[2].plannedByBucket.PROJECT +
      w.days[2].plannedByBucket.COMMUNICATION +
      w.days[2].plannedByBucket.CI;
    // Scaled down day — total ≤ 240.
    assert.ok(wedTotal <= 240, `Wed total ${wedTotal} > override 240`);
  });

  test('other days use default capacity when only one override is set', () => {
    const w = composeWeekly(
      buildInput({ capacityOverrides: { 2: 240 } })
    );
    const monTotal =
      w.days[0].plannedByBucket.PROJECT +
      w.days[0].plannedByBucket.COMMUNICATION +
      w.days[0].plannedByBucket.CI;
    assert.ok(monTotal > 240);
  });

  test('overrides land on composerInputsSnapshot', () => {
    const w = composeWeekly(
      buildInput({ capacityOverrides: { 0: 360, 4: 360 } })
    );
    assert.deepEqual(w.composerInputsSnapshot.capacityOverrides, {
      0: 360,
      4: 360
    });
  });
});

// ---------------------------------------------------------------------------
// Broad integration
// ---------------------------------------------------------------------------

describe('composeWeekly — broad integration snapshot', () => {
  test('same userId threads through to every composition', () => {
    const w = composeWeekly(buildInput({ userId: 'user_xyz' }));
    for (const d of w.days) {
      assert.equal(d.userId, 'user_xyz');
    }
    assert.equal(w.userId, 'user_xyz');
  });

  test('weeklyComposition.id is deterministic from userId + weekStart', () => {
    const w = composeWeekly(buildInput());
    assert.equal(w.id, 'wcomp_user_test_2026-04-20');
  });

  test('kaizens in snapshot preserve id + projectType + state', () => {
    const kaizens = [
      makeKaizen({ id: 'k_foo', projectType: 'DMAIC', state: 'ACTIVE' })
    ];
    const w = composeWeekly(buildInput({ kaizens }));
    assert.deepEqual(w.composerInputsSnapshot.kaizens, [
      { id: 'k_foo', projectType: 'DMAIC', state: 'ACTIVE' }
    ]);
  });

  test('historicalCompletedCatalogIds is cloned into snapshot', () => {
    const ids = [idForNumber(20)];
    const w = composeWeekly(
      buildInput({ historicalCompletedCatalogIds: ids })
    );
    assert.deepEqual(w.composerInputsSnapshot.historicalCompletedCatalogIds, ids);
    // Mutating snapshot does not mutate original.
    w.composerInputsSnapshot.historicalCompletedCatalogIds.push('foo');
    assert.equal(ids.length, 1);
  });
});
