/**
 * TodayGrid — Iter 48 Phase 3 tests.
 *
 * Phase 3A: Kaizen sub-labels on PROJECT + CI cards (AC1, AC2, AC3, AC4)
 * Phase 3B: Visual indicator for CI blocks WITHOUT kaizen link (AC5, AC6, AC7)
 *
 * META §A.2 application (mandatory per spec):
 *   Every per-bucket addition has an orthogonal test confirming OTHER buckets
 *   do NOT receive the treatment.
 *
 * META §A.3 reconciliation (documented inline):
 *   - .cycle-block-kaizen-sublabel: NEW in Iter 48 — no prior rule existed.
 *   - .cycle-block-ci-unlinked: NEW in Iter 48 — no prior rule existed.
 *   Both are additive; no existing CSS rules conflict.
 *
 * AC coverage:
 *   AC1:  PROJECT blocks with linkedKaizenId show kaizen sub-label (≥56px)
 *   AC2:  CI blocks with linkedKaizenId show kaizen sub-label (≥56px)
 *   AC3:  COMMUNICATION blocks do NOT show kaizen sub-label (§A.2 orthogonal)
 *   AC4:  Lunch blocks do NOT show kaizen sub-label (§A.2 orthogonal)
 *   AC5:  CI blocks WITHOUT linkedKaizenId show unlinked indicator
 *   AC6:  Sprint ceremony CI blocks do NOT show unlinked indicator (anchors)
 *   AC7:  PROJECT blocks WITHOUT linkedKaizenId do NOT show unlinked indicator
 *   AC15: kaizenTitleById missing for linkedKaizenId → graceful skip (AC15/4F)
 *   AC17: META §A.2 — orthogonal tests for every addition
 *   AC18: META §A.3 — new CSS class audit documented
 *   AC19: All Iter 47 functionality preserved
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { TodayGrid } from '../../../js/ui/components/TodayGrid.js';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

function mkComposition(overrides = {}) {
  return {
    id: 'comp_48_1',
    userId: 'u',
    state: 'ACCEPTED',
    date: '2026-04-30',
    ...overrides
  };
}

function mkActivity(overrides = {}) {
  return {
    id: 'sa_1',
    catalogEntryId: 'cat_deep',
    name: 'Deep Work',
    bucket: 'PROJECT',
    plannedDurationMinutes: 60,
    plannedStartAt: '10:00',
    state: 'SCHEDULED',
    ...overrides
  };
}

const COMP = mkComposition();
const KAIZEN_MAP = { k1: 'Reduce Meeting Load', k2: 'Improve Release Cadence' };

// A 60-minute block at 10:00 renders at 60px — this is ≥56px so sub-labels show.
const TALL_BLOCK_MINS = 60;    // ≥56px (height = 60px)
const SHORT_BLOCK_MINS = 30;   // 30px < 56px — sub-label must NOT show

// ---------------------------------------------------------------------------
// AC1: Kaizen sub-label on PROJECT blocks with linkedKaizenId
// ---------------------------------------------------------------------------

describe('TodayGrid Iter48 — Phase 3A: kaizen sub-label on PROJECT (AC1)', () => {
  test('AC1: PROJECT block with linkedKaizenId shows cycle-block-kaizen-sublabel', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({
        bucket: 'PROJECT',
        linkedKaizenId: 'k1',
        plannedDurationMinutes: TALL_BLOCK_MINS
      })],
      kaizenTitleById: KAIZEN_MAP
    });
    assert.ok(
      html.includes('cycle-block-kaizen-sublabel'),
      'PROJECT block with linkedKaizenId must show cycle-block-kaizen-sublabel (AC1)'
    );
  });

  test('AC1: PROJECT block sub-label shows the kaizen title text', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({
        bucket: 'PROJECT',
        linkedKaizenId: 'k1',
        plannedDurationMinutes: TALL_BLOCK_MINS
      })],
      kaizenTitleById: KAIZEN_MAP
    });
    assert.ok(
      html.includes('Reduce Meeting Load'),
      'Kaizen title text must appear in PROJECT block sub-label (AC1)'
    );
  });

  test('AC1: PROJECT block sub-label is height-gated — hidden when block < 56px', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({
        bucket: 'PROJECT',
        linkedKaizenId: 'k1',
        plannedDurationMinutes: SHORT_BLOCK_MINS  // 30px < 56px
      })],
      kaizenTitleById: KAIZEN_MAP
    });
    assert.ok(
      !html.includes('cycle-block-kaizen-sublabel'),
      'PROJECT kaizen sub-label must be hidden when block height < 56px (AC1 height gate)'
    );
  });

  test('AC1: PROJECT block without linkedKaizenId does NOT show kaizen sub-label', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({
        bucket: 'PROJECT',
        plannedDurationMinutes: TALL_BLOCK_MINS
        // no linkedKaizenId
      })]
    });
    assert.ok(
      !html.includes('cycle-block-kaizen-sublabel'),
      'PROJECT block without linkedKaizenId must not show kaizen sub-label (AC1)'
    );
  });

  // META §A.2 orthogonal: COMMUNICATION does not get PROJECT's sub-label
  test('META §A.2: COMM block with linkedKaizenId does NOT show kaizen sub-label (AC3)', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({
        bucket: 'COMMUNICATION',
        linkedKaizenId: 'k1',
        plannedDurationMinutes: TALL_BLOCK_MINS
      })],
      kaizenTitleById: KAIZEN_MAP
    });
    assert.ok(
      !html.includes('cycle-block-kaizen-sublabel'),
      'COMM block must NOT show kaizen sub-label — only PROJECT and CI get it (AC3 orthogonal)'
    );
  });

  // META §A.2 orthogonal: Lunch does not get sub-label
  test('META §A.2: Lunch block does NOT show kaizen sub-label (AC4)', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({
        bucket: null,
        name: 'Lunch',
        linkedKaizenId: 'k1',
        plannedDurationMinutes: TALL_BLOCK_MINS
      })],
      kaizenTitleById: KAIZEN_MAP
    });
    assert.ok(
      !html.includes('cycle-block-kaizen-sublabel'),
      'Lunch block must NOT show kaizen sub-label (AC4 orthogonal)'
    );
  });
});

// ---------------------------------------------------------------------------
// AC2: Kaizen sub-label on CI blocks with linkedKaizenId
// ---------------------------------------------------------------------------

describe('TodayGrid Iter48 — Phase 3A: kaizen sub-label on CI (AC2)', () => {
  test('AC2: CI block with linkedKaizenId shows cycle-block-kaizen-sublabel', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({
        bucket: 'CI',
        catalogEntryId: 'cat_pdca',
        name: 'PDCA Cycle',
        linkedKaizenId: 'k2',
        plannedDurationMinutes: TALL_BLOCK_MINS
      })],
      kaizenTitleById: KAIZEN_MAP
    });
    assert.ok(
      html.includes('cycle-block-kaizen-sublabel'),
      'CI block with linkedKaizenId must show cycle-block-kaizen-sublabel (AC2)'
    );
    assert.ok(
      html.includes('Improve Release Cadence'),
      'CI block sub-label must show the kaizen title text (AC2)'
    );
  });

  test('AC2: CI sub-label is height-gated — hidden when block < 56px', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({
        bucket: 'CI',
        catalogEntryId: 'cat_pdca',
        name: 'PDCA Cycle',
        linkedKaizenId: 'k2',
        plannedDurationMinutes: SHORT_BLOCK_MINS
      })],
      kaizenTitleById: KAIZEN_MAP
    });
    assert.ok(
      !html.includes('cycle-block-kaizen-sublabel'),
      'CI kaizen sub-label must be hidden when block height < 56px (AC2 height gate)'
    );
  });

  test('AC2: EoAR CI block with linkedKaizenId shows sub-label', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({
        bucket: 'CI',
        catalogEntryId: 'gen_end_of_activity_reflection',
        name: 'End-of-Activity Reflection',
        linkedKaizenId: 'k1',
        plannedDurationMinutes: TALL_BLOCK_MINS,
        plannedStartAt: '17:00'
      })],
      kaizenTitleById: KAIZEN_MAP
    });
    assert.ok(
      html.includes('cycle-block-kaizen-sublabel'),
      'EoAR CI block with linkedKaizenId must show kaizen sub-label (AC2)'
    );
  });

  // META §A.2 orthogonal: PROJECT already has sub-label (AC1) —
  // confirm CI sub-label logic is independent (separate renderCIBlock call)
  test('META §A.2: CI sub-label and PROJECT sub-label are independent renderers', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [
        mkActivity({ id: 'p1', bucket: 'PROJECT', linkedKaizenId: 'k1', plannedDurationMinutes: TALL_BLOCK_MINS, plannedStartAt: '09:00' }),
        mkActivity({ id: 'ci1', bucket: 'CI', catalogEntryId: 'cat_pdca', name: 'PDCA', linkedKaizenId: 'k2', plannedDurationMinutes: TALL_BLOCK_MINS, plannedStartAt: '11:00' })
      ],
      kaizenTitleById: KAIZEN_MAP
    });
    const subLabelCount = (html.match(/cycle-block-kaizen-sublabel/g) ?? []).length;
    assert.ok(subLabelCount >= 2, `Both PROJECT and CI should have sub-labels; found ${subLabelCount}`);
    assert.ok(html.includes('Reduce Meeting Load'), 'PROJECT kaizen title in output');
    assert.ok(html.includes('Improve Release Cadence'), 'CI kaizen title in output');
  });
});

// ---------------------------------------------------------------------------
// AC5: CI blocks WITHOUT linkedKaizenId show unlinked indicator
// AC6: Sprint ceremonies do NOT show unlinked indicator
// AC7: PROJECT blocks without linkedKaizenId do NOT show unlinked indicator
// ---------------------------------------------------------------------------

describe('TodayGrid Iter48 — Phase 3B: CI unlinked indicator (AC5, AC6, AC7)', () => {
  test('AC5: user-added CI block without linkedKaizenId shows cycle-block-ci-unlinked', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({
        bucket: 'CI',
        catalogEntryId: 'cat_pdca',
        name: 'PDCA Cycle',
        plannedDurationMinutes: TALL_BLOCK_MINS
        // no linkedKaizenId
      })]
    });
    assert.ok(
      html.includes('cycle-block-ci-unlinked'),
      'User-added CI block without linkedKaizenId must show cycle-block-ci-unlinked indicator (AC5)'
    );
  });

  test('AC5: user-added CI block with linkedKaizenId does NOT show unlinked indicator', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({
        bucket: 'CI',
        catalogEntryId: 'cat_pdca',
        name: 'PDCA Cycle',
        linkedKaizenId: 'k1',
        plannedDurationMinutes: TALL_BLOCK_MINS
      })],
      kaizenTitleById: KAIZEN_MAP
    });
    assert.ok(
      !html.includes('cycle-block-ci-unlinked'),
      'CI block WITH linkedKaizenId must NOT show unlinked indicator (AC5)'
    );
  });

  test('AC6: EoAR block without linkedKaizenId does NOT show unlinked indicator (has sacred indicator)', () => {
    // EoAR has its own sacred indicator — the "unlinked" indicator is for user-added CI only.
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({
        bucket: 'CI',
        catalogEntryId: 'gen_end_of_activity_reflection',
        name: 'End-of-Activity Reflection',
        plannedDurationMinutes: TALL_BLOCK_MINS,
        plannedStartAt: '17:00'
        // no linkedKaizenId
      })]
    });
    assert.ok(
      !html.includes('cycle-block-ci-unlinked'),
      'EoAR block must NOT show unlinked indicator — it has its own sacred indicator (AC6)'
    );
  });

  test('AC6: sprint ceremony CI block without linkedKaizenId does NOT show unlinked indicator', () => {
    // Sprint ceremonies are protected anchors — they are not user-added CI.
    // The protected_ flag excludes them from the unlinked treatment.
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({
        bucket: 'CI',
        catalogEntryId: 'cer_sprint_planning',
        name: 'Sprint Planning',
        plannedStartAt: '09:00',
        plannedDurationMinutes: 60
        // no linkedKaizenId — sprint ceremonies typically don't link to a kaizen
      })]
    });
    assert.ok(
      !html.includes('cycle-block-ci-unlinked'),
      'Sprint ceremony must NOT show unlinked indicator — it is a protected anchor (AC6)'
    );
  });

  test('AC6: sprint retrospective without linkedKaizenId does NOT show unlinked indicator', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({
        bucket: 'CI',
        catalogEntryId: 'cer_sprint_retrospective',
        name: 'Sprint Retrospective',
        plannedStartAt: '10:00',
        plannedDurationMinutes: 90
      })]
    });
    assert.ok(
      !html.includes('cycle-block-ci-unlinked'),
      'Sprint Retrospective must NOT show unlinked indicator — protected anchor (AC6)'
    );
  });

  // META §A.2 orthogonal: PROJECT without kaizen does NOT show CI unlinked indicator
  test('META §A.2 AC7: PROJECT block without linkedKaizenId does NOT show cycle-block-ci-unlinked', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({
        bucket: 'PROJECT',
        plannedDurationMinutes: TALL_BLOCK_MINS
        // no linkedKaizenId
      })]
    });
    assert.ok(
      !html.includes('cycle-block-ci-unlinked'),
      'PROJECT block must NOT show CI unlinked indicator — it only applies to CI (AC7 §A.2)'
    );
  });

  // META §A.2 orthogonal: COMM without kaizen does NOT show CI unlinked indicator
  test('META §A.2: COMM block without linkedKaizenId does NOT show cycle-block-ci-unlinked', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({
        bucket: 'COMMUNICATION',
        plannedDurationMinutes: TALL_BLOCK_MINS
      })]
    });
    assert.ok(
      !html.includes('cycle-block-ci-unlinked'),
      'COMM block must NOT show CI unlinked indicator — only CI gets it (§A.2 orthogonal)'
    );
  });

  // META §A.2 orthogonal: Lunch does NOT show CI unlinked indicator
  test('META §A.2: Lunch block does NOT show cycle-block-ci-unlinked', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({
        bucket: null,
        name: 'Lunch',
        plannedDurationMinutes: 30,
        plannedStartAt: '12:00'
      })]
    });
    assert.ok(
      !html.includes('cycle-block-ci-unlinked'),
      'Lunch block must NOT show CI unlinked indicator (§A.2 orthogonal)'
    );
  });
});

// ---------------------------------------------------------------------------
// Phase 4F: Graceful degradation (AC13, AC14, AC15)
// ---------------------------------------------------------------------------

describe('TodayGrid Iter48 — Phase 4F: graceful degradation', () => {
  test('AC15: linkedKaizenId set but kaizenTitleById has no entry → no sub-label rendered', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({
        bucket: 'PROJECT',
        linkedKaizenId: 'k_unknown',
        plannedDurationMinutes: TALL_BLOCK_MINS
      })],
      kaizenTitleById: {}  // empty map — no title for k_unknown
    });
    assert.ok(
      !html.includes('cycle-block-kaizen-sublabel'),
      'When kaizenTitleById has no entry for linkedKaizenId, no sub-label must render (AC15)'
    );
  });

  test('AC15: CI block with linkedKaizenId but missing title → no sub-label, no crash', () => {
    let html;
    assert.doesNotThrow(() => {
      html = TodayGrid({
        composition: COMP,
        activities: [mkActivity({
          bucket: 'CI',
          catalogEntryId: 'cat_pdca',
          name: 'PDCA Cycle',
          linkedKaizenId: 'k_missing',
          plannedDurationMinutes: TALL_BLOCK_MINS
        })],
        kaizenTitleById: { k_other: 'Some Other Kaizen' }
      });
    }, 'TodayGrid must not throw when kaizenTitleById has no entry for linkedKaizenId (AC15)');
    assert.ok(!html.includes('cycle-block-kaizen-sublabel'), 'No sub-label without kaizen title (AC15)');
  });

  test('AC13: PROJECT block with missing intention AND missing outputArtifact → no secondary line, no crash', () => {
    let html;
    assert.doesNotThrow(() => {
      html = TodayGrid({
        composition: COMP,
        activities: [mkActivity({
          bucket: 'PROJECT',
          plannedDurationMinutes: TALL_BLOCK_MINS
          // no intention, no catalogEntryId → catalogEntry is null
        })],
        catalogEntryById: {}  // empty → catalogEntry null
      });
    }, 'TodayGrid must not throw when intention and outputArtifact are both missing (AC13)');
    assert.ok(!html.includes('cycle-block-secondary'), 'No secondary line when both intention and artifact are missing (AC13)');
    assert.ok(html.includes('cycle-block-name'), 'Activity name must still render (AC13)');
  });

  test('AC13: PROJECT block with intention renders secondary even when outputArtifact missing', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({
        bucket: 'PROJECT',
        plannedDurationMinutes: TALL_BLOCK_MINS,
        intention: 'Ship the board deck'
      })],
      catalogEntryById: {}  // no artifact
    });
    assert.ok(html.includes('cycle-block-secondary'), 'Secondary line renders from intention when artifact missing (AC13)');
    assert.ok(html.includes('Ship the board deck'), 'Intention text appears in secondary line (AC13)');
  });
});

// ---------------------------------------------------------------------------
// AC19: All Iter 47 functionality preserved
// ---------------------------------------------------------------------------

describe('TodayGrid Iter48 — AC19: Iter 47 functionality preserved', () => {
  test('AC19: EoAR still gets cycle-block-sacred class (Iter 47)', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({
        bucket: 'CI',
        catalogEntryId: 'gen_end_of_activity_reflection',
        name: 'EoAR',
        plannedStartAt: '17:00',
        plannedDurationMinutes: 15
      })]
    });
    assert.ok(html.includes('cycle-block-sacred'), 'EoAR still gets cycle-block-sacred (Iter 47 preserved)');
  });

  test('AC19: Lunch block still emits OPEN_LUNCH_TOOLTIP (Iter 47)', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({ bucket: null, name: 'Lunch', plannedStartAt: '12:00', plannedDurationMinutes: 30 })]
    });
    assert.ok(html.includes('OPEN_LUNCH_TOOLTIP'), 'Lunch tooltip action still fires (Iter 47 preserved)');
    assert.ok(!html.includes('OPEN_BLOCK_DETAIL'), 'Lunch must not emit OPEN_BLOCK_DETAIL (Iter 47 preserved)');
  });

  test('AC19: PROJECT secondary line (Iter 46) still renders', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({
        bucket: 'PROJECT',
        plannedDurationMinutes: 60,
        intention: 'Deliver prototype'
      })]
    });
    assert.ok(html.includes('cycle-block-secondary'), 'PROJECT secondary line (Iter 46) still renders (AC19)');
  });

  test('AC19: kaizen sub-label renders for linked blocks at ≥56px (Phase 3.2 consolidation)', () => {
    // Phase 3.2 (R3): for h ≥ 56px, sub-label wins over chip — no dual representation.
    // The data-kaizen-linked attribute and aria-label still convey the kaizen signal.
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({
        bucket: 'PROJECT',
        linkedKaizenId: 'k1',
        plannedDurationMinutes: 60  // 60px >= 56px → sub-label shown, chip suppressed
      })],
      kaizenTitleById: KAIZEN_MAP
    });
    assert.ok(html.includes('cycle-block-kaizen-sublabel'), 'Kaizen sub-label renders for tall linked blocks (Phase 3.2)');
    assert.ok(html.includes('data-kaizen-linked="true"'), 'data-kaizen-linked attribute preserved (AC19)');
  });

  test('AC19: kaizen chip glow-ring still renders for short linked blocks (h < 56px)', () => {
    // Phase 3.2 (R3): chip is retained for h < 56px so kaizen signal is never dropped.
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({
        bucket: 'PROJECT',
        linkedKaizenId: 'k1',
        plannedDurationMinutes: 30  // 30px < 56px → chip shown, sub-label suppressed
      })],
      kaizenTitleById: KAIZEN_MAP
    });
    assert.ok(html.includes('cycle-block-kaizen-linked'), 'Kaizen glow-ring chip preserved for short blocks (AC19)');
    assert.ok(!html.includes('cycle-block-kaizen-sublabel'), 'Sub-label suppressed for short blocks (h < 56px)');
  });

  test('AC19: all block types render without crash in mixed grid', () => {
    let html;
    assert.doesNotThrow(() => {
      html = TodayGrid({
        composition: COMP,
        activities: [
          mkActivity({ id: 'p1', bucket: 'PROJECT', linkedKaizenId: 'k1', plannedStartAt: '08:00', plannedDurationMinutes: 60 }),
          mkActivity({ id: 'c1', bucket: 'COMMUNICATION', name: 'Standup', plannedStartAt: '09:15', plannedDurationMinutes: 15 }),
          mkActivity({ id: 'ci1', bucket: 'CI', catalogEntryId: 'cat_pdca', name: 'PDCA', plannedStartAt: '10:00', plannedDurationMinutes: 60 }),
          mkActivity({ id: 'ear1', bucket: 'CI', catalogEntryId: 'gen_end_of_activity_reflection', name: 'EoAR', plannedStartAt: '12:00', plannedDurationMinutes: 15 }),
          mkActivity({ id: 'l1', bucket: null, name: 'Lunch', plannedStartAt: '13:00', plannedDurationMinutes: 30 })
        ],
        kaizenTitleById: KAIZEN_MAP
      });
    }, 'Mixed-bucket grid must not crash (AC19)');
    assert.ok(html.includes('data-activity-id="p1"'), 'PROJECT renders');
    assert.ok(html.includes('data-activity-id="c1"'), 'COMM renders');
    assert.ok(html.includes('data-activity-id="ci1"'), 'CI renders');
    assert.ok(html.includes('data-activity-id="ear1"'), 'EoAR renders');
    assert.ok(html.includes('data-activity-id="l1"'), 'Lunch renders');
    assert.ok(html.includes('cycle-block-ci-unlinked'), 'Unlinked CI indicator on PDCA block');
    assert.ok(!html.includes('cycle-block-ci-unlinked') === false, 'ci-unlinked present in grid');
  });
});

// ---------------------------------------------------------------------------
// Phase 3.2 (R3): Kaizen dual representation — sub-label wins at h >= 56px
// AC-KZ1: Block with kaizenTitle and h >= 56 renders sub-label but NOT chip
// AC-KZ2: Block with kaizenTitle and h < 56 renders chip but NOT sub-label
// AC-KZ3: Block without kaizenTitle renders neither
// ---------------------------------------------------------------------------

describe('TodayGrid Phase 3.2 — kaizen dual representation consolidation', () => {
  test('AC-KZ1: PROJECT block with kaizenTitle and h >= 56px shows sub-label but NOT chip', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({
        bucket: 'PROJECT',
        linkedKaizenId: 'k1',
        plannedDurationMinutes: TALL_BLOCK_MINS   // 60px >= 56px
      })],
      kaizenTitleById: KAIZEN_MAP
    });
    assert.ok(
      html.includes('cycle-block-kaizen-sublabel'),
      'AC-KZ1: sub-label must render for tall PROJECT block with kaizenTitle'
    );
    // chip uses class cycle-block-kaizen-linked -- must NOT appear when sub-label wins
    const chipCount = (html.match(/cycle-block-kaizen-linked/g) ?? []).length;
    assert.equal(chipCount, 0,
      'AC-KZ1: chip (cycle-block-kaizen-linked) must NOT render alongside sub-label on tall PROJECT block'
    );
  });

  test('AC-KZ1: CI block with kaizenTitle and h >= 56px shows sub-label but NOT chip', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({
        bucket: 'CI',
        catalogEntryId: 'cat_pdca',
        name: 'PDCA Cycle',
        linkedKaizenId: 'k2',
        plannedDurationMinutes: TALL_BLOCK_MINS   // 60px >= 56px
      })],
      kaizenTitleById: KAIZEN_MAP
    });
    assert.ok(
      html.includes('cycle-block-kaizen-sublabel'),
      'AC-KZ1: sub-label must render for tall CI block with kaizenTitle'
    );
    const chipCount = (html.match(/cycle-block-kaizen-linked/g) ?? []).length;
    assert.equal(chipCount, 0,
      'AC-KZ1: chip must NOT render alongside sub-label on tall CI block'
    );
  });

  test('AC-KZ2: PROJECT block with kaizenTitle and h < 56px shows chip but NOT sub-label', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({
        bucket: 'PROJECT',
        linkedKaizenId: 'k1',
        plannedDurationMinutes: SHORT_BLOCK_MINS  // 30px < 56px
      })],
      kaizenTitleById: KAIZEN_MAP
    });
    assert.ok(
      html.includes('cycle-block-kaizen-linked'),
      'AC-KZ2: chip must render for short PROJECT block with kaizenTitle'
    );
    assert.ok(
      !html.includes('cycle-block-kaizen-sublabel'),
      'AC-KZ2: sub-label must NOT render for short PROJECT block (height gate preserved)'
    );
  });

  test('AC-KZ2: CI block with kaizenTitle and h < 56px shows chip but NOT sub-label', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({
        bucket: 'CI',
        catalogEntryId: 'cat_pdca',
        name: 'PDCA Cycle',
        linkedKaizenId: 'k2',
        plannedDurationMinutes: SHORT_BLOCK_MINS  // 30px < 56px
      })],
      kaizenTitleById: KAIZEN_MAP
    });
    assert.ok(
      html.includes('cycle-block-kaizen-linked'),
      'AC-KZ2: chip must render for short CI block with kaizenTitle'
    );
    assert.ok(
      !html.includes('cycle-block-kaizen-sublabel'),
      'AC-KZ2: sub-label must NOT render for short CI block (height gate preserved)'
    );
  });

  test('AC-KZ3: PROJECT block without kaizenTitle renders neither sub-label nor chip', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({
        bucket: 'PROJECT',
        plannedDurationMinutes: TALL_BLOCK_MINS
        // no linkedKaizenId
      })]
    });
    assert.ok(
      !html.includes('cycle-block-kaizen-sublabel'),
      'AC-KZ3: no sub-label when kaizenTitle is absent (PROJECT)'
    );
    assert.ok(
      !html.includes('cycle-block-kaizen-linked'),
      'AC-KZ3: no chip when kaizenTitle is absent (PROJECT)'
    );
  });

  test('AC-KZ3: CI block without kaizenTitle renders neither sub-label nor chip', () => {
    const html = TodayGrid({
      composition: COMP,
      activities: [mkActivity({
        bucket: 'CI',
        catalogEntryId: 'cat_pdca',
        name: 'PDCA Cycle',
        plannedDurationMinutes: TALL_BLOCK_MINS
        // no linkedKaizenId
      })]
    });
    assert.ok(
      !html.includes('cycle-block-kaizen-sublabel'),
      'AC-KZ3: no sub-label when kaizenTitle is absent (CI)'
    );
    assert.ok(
      !html.includes('cycle-block-kaizen-linked'),
      'AC-KZ3: no chip when kaizenTitle is absent (CI)'
    );
  });
});
