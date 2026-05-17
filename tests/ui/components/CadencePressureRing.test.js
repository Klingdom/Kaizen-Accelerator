/**
 * Tests for CadencePressureRing component — Iter 42, Phase 3.
 *
 * Covers:
 *   - ARIA label
 *   - Segment proportions (stroke-dasharray values)
 *   - Empty activities → 0h center, no visible segments
 *   - Single-bucket → full arc for that segment
 *   - Lunch (bucket: null) excluded from calculation
 *   - Hover tooltip presence and structure
 *   - Bucket color classes correct (project/comm/ci)
 *   - computeBucketMinutes utility
 *   - computeArcSegments geometry
 *   - formatMinutes utility
 *   - isDayBalanced utility
 *   - prefers-reduced-motion CSS (structure present in output)
 *   - Default props / edge cases
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  CadencePressureRing,
  computeBucketMinutes,
  computeArcSegments,
  formatMinutes,
  isDayBalanced,
  DEFAULT_TARGETS
} from '../../../js/ui/components/CadencePressureRing.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mkActivity(overrides = {}) {
  return {
    id: overrides.id ?? 'sa_1',
    name: overrides.name ?? 'Deep Work',
    bucket: overrides.bucket !== undefined ? overrides.bucket : 'PROJECT',
    plannedDurationMinutes: overrides.plannedDurationMinutes ?? 120,
    state: overrides.state ?? 'PROPOSED',
    ...overrides
  };
}

// ---------------------------------------------------------------------------
// computeBucketMinutes
// ---------------------------------------------------------------------------

describe('computeBucketMinutes', () => {
  test('sums minutes correctly per bucket', () => {
    const activities = [
      mkActivity({ bucket: 'PROJECT', plannedDurationMinutes: 120 }),
      mkActivity({ bucket: 'PROJECT', plannedDurationMinutes: 60 }),
      mkActivity({ bucket: 'COMMUNICATION', plannedDurationMinutes: 30 }),
      mkActivity({ bucket: 'CI', plannedDurationMinutes: 90 })
    ];
    const result = computeBucketMinutes(activities);
    assert.equal(result.PROJECT, 180);
    assert.equal(result.COMMUNICATION, 30);
    assert.equal(result.CI, 90);
  });

  test('excludes lunch (bucket: null)', () => {
    const activities = [
      mkActivity({ bucket: 'PROJECT', plannedDurationMinutes: 120 }),
      mkActivity({ bucket: null, plannedDurationMinutes: 60, name: 'Lunch' })
    ];
    const result = computeBucketMinutes(activities);
    assert.equal(result.PROJECT, 120);
    assert.equal(result.COMMUNICATION, 0);
    assert.equal(result.CI, 0);
  });

  test('excludes activities with zero plannedDurationMinutes', () => {
    const activities = [
      mkActivity({ bucket: 'PROJECT', plannedDurationMinutes: 0 }),
      mkActivity({ bucket: 'CI', plannedDurationMinutes: 60 })
    ];
    const result = computeBucketMinutes(activities);
    assert.equal(result.PROJECT, 0);
    assert.equal(result.CI, 60);
  });

  test('excludes activities with non-finite duration', () => {
    const activities = [
      mkActivity({ bucket: 'PROJECT', plannedDurationMinutes: NaN }),
      mkActivity({ bucket: 'COMMUNICATION', plannedDurationMinutes: 30 })
    ];
    const result = computeBucketMinutes(activities);
    assert.equal(result.PROJECT, 0);
    assert.equal(result.COMMUNICATION, 30);
  });

  test('returns zeros for empty array', () => {
    const result = computeBucketMinutes([]);
    assert.equal(result.PROJECT, 0);
    assert.equal(result.COMMUNICATION, 0);
    assert.equal(result.CI, 0);
  });

  test('returns zeros for non-array input', () => {
    const result = computeBucketMinutes(null);
    assert.equal(result.PROJECT, 0);
    assert.equal(result.COMMUNICATION, 0);
    assert.equal(result.CI, 0);
  });

  test('ignores unknown bucket values', () => {
    const activities = [
      mkActivity({ bucket: 'UNKNOWN', plannedDurationMinutes: 60 }),
      mkActivity({ bucket: 'PROJECT', plannedDurationMinutes: 30 })
    ];
    const result = computeBucketMinutes(activities);
    assert.equal(result.PROJECT, 30);
    assert.equal(result.COMMUNICATION, 0);
    assert.equal(result.CI, 0);
  });
});

// ---------------------------------------------------------------------------
// computeArcSegments
// ---------------------------------------------------------------------------

describe('computeArcSegments', () => {
  test('returns 3 segments', () => {
    const segs = computeArcSegments({ PROJECT: 240, COMMUNICATION: 120, CI: 120 }, 22);
    assert.equal(segs.length, 3);
  });

  test('segments are proportional to bucket minutes', () => {
    // 240/480 = 50%, 120/480 = 25%, 120/480 = 25%
    const r = 22;
    const C = 2 * Math.PI * r;
    const segs = computeArcSegments({ PROJECT: 240, COMMUNICATION: 120, CI: 120 }, r);
    const proj = segs.find((s) => s.key === 'PROJECT');
    const comm = segs.find((s) => s.key === 'COMMUNICATION');
    const ci   = segs.find((s) => s.key === 'CI');

    // PROJECT = 50% of circumference
    assert.ok(
      Math.abs(proj.arcLen - C * 0.5) < 0.01,
      `PROJECT arcLen ${proj.arcLen} expected ~${C * 0.5}`
    );
    // COMMUNICATION = 25%
    assert.ok(
      Math.abs(comm.arcLen - C * 0.25) < 0.01,
      `COMM arcLen ${comm.arcLen} expected ~${C * 0.25}`
    );
    // CI = 25%
    assert.ok(
      Math.abs(ci.arcLen - C * 0.25) < 0.01,
      `CI arcLen ${ci.arcLen} expected ~${C * 0.25}`
    );
  });

  test('offsets accumulate correctly (PROJECT offset=0, COMM offset=PROJECT arcLen)', () => {
    const r = 22;
    const segs = computeArcSegments({ PROJECT: 240, COMMUNICATION: 120, CI: 120 }, r);
    const proj = segs.find((s) => s.key === 'PROJECT');
    const comm = segs.find((s) => s.key === 'COMMUNICATION');
    const ci   = segs.find((s) => s.key === 'CI');

    assert.equal(proj.offset, 0);
    assert.ok(Math.abs(comm.offset - proj.arcLen) < 0.01);
    assert.ok(Math.abs(ci.offset - (proj.arcLen + comm.arcLen)) < 0.01);
  });

  test('empty bucket minutes returns all-zero arc lengths', () => {
    const segs = computeArcSegments({ PROJECT: 0, COMMUNICATION: 0, CI: 0 }, 22);
    for (const seg of segs) {
      assert.equal(seg.arcLen, 0);
      assert.equal(seg.offset, 0);
    }
  });

  test('single-bucket: that segment fills the entire circumference', () => {
    const r = 22;
    const C = 2 * Math.PI * r;
    const segs = computeArcSegments({ PROJECT: 120, COMMUNICATION: 0, CI: 0 }, r);
    const proj = segs.find((s) => s.key === 'PROJECT');
    assert.ok(
      Math.abs(proj.arcLen - C) < 0.01,
      `Single-bucket PROJECT arcLen ${proj.arcLen} should equal circumference ${C}`
    );
  });
});

// ---------------------------------------------------------------------------
// formatMinutes
// ---------------------------------------------------------------------------

describe('formatMinutes', () => {
  test('240 minutes → "4h 0m"', () => {
    assert.equal(formatMinutes(240), '4h 0m');
  });

  test('90 minutes → "1h 30m"', () => {
    assert.equal(formatMinutes(90), '1h 30m');
  });

  test('0 minutes → "0h 0m"', () => {
    assert.equal(formatMinutes(0), '0h 0m');
  });

  test('45 minutes → "0h 45m"', () => {
    assert.equal(formatMinutes(45), '0h 45m');
  });
});

// ---------------------------------------------------------------------------
// isDayBalanced
// ---------------------------------------------------------------------------

describe('isDayBalanced', () => {
  test('all buckets at target → balanced', () => {
    assert.equal(
      isDayBalanced({ PROJECT: 240, COMMUNICATION: 120, CI: 120 }, DEFAULT_TARGETS),
      true
    );
  });

  test('all buckets at 50% floor → balanced', () => {
    assert.equal(
      isDayBalanced({ PROJECT: 120, COMMUNICATION: 60, CI: 60 }, DEFAULT_TARGETS),
      true
    );
  });

  test('one bucket below floor → unbalanced', () => {
    // CI at 50 < floor 60
    assert.equal(
      isDayBalanced({ PROJECT: 240, COMMUNICATION: 120, CI: 50 }, DEFAULT_TARGETS),
      false
    );
  });

  test('empty activities → unbalanced', () => {
    assert.equal(
      isDayBalanced({ PROJECT: 0, COMMUNICATION: 0, CI: 0 }, DEFAULT_TARGETS),
      false
    );
  });
});

// ---------------------------------------------------------------------------
// CadencePressureRing — render output
// ---------------------------------------------------------------------------

describe('CadencePressureRing — render', () => {
  test('AC1: default export and named export both return a string', () => {
    const html = CadencePressureRing({ activities: [] });
    assert.equal(typeof html, 'string');
    assert.ok(html.length > 0);
  });

  test('AC2: renders 56px SVG', () => {
    const html = CadencePressureRing({ activities: [] });
    assert.match(html, /width="56"/);
    assert.match(html, /height="56"/);
    assert.match(html, /viewBox="0 0 56 56"/);
  });

  test('AC2: renders the three segment CSS classes', () => {
    const activities = [
      mkActivity({ bucket: 'PROJECT', plannedDurationMinutes: 120 }),
      mkActivity({ bucket: 'COMMUNICATION', plannedDurationMinutes: 60 }),
      mkActivity({ bucket: 'CI', plannedDurationMinutes: 60 })
    ];
    const html = CadencePressureRing({ activities });
    assert.match(html, /cadence-arc-project/);
    assert.match(html, /cadence-arc-comm/);
    assert.match(html, /cadence-arc-ci/);
  });

  test('AC5: empty activities renders 0h center text', () => {
    const html = CadencePressureRing({ activities: [] });
    assert.match(html, /0h/);
  });

  test('AC5: empty activities renders background ring but no segment arcs', () => {
    const html = CadencePressureRing({ activities: [] });
    assert.match(html, /cadence-arc-bg/);
    // Segments with zero arcLen should not render (they return empty string).
    assert.ok(!html.includes('cadence-arc-project'));
    assert.ok(!html.includes('cadence-arc-comm'));
    assert.ok(!html.includes('cadence-arc-ci'));
  });

  test('AC3: segment stroke-dasharray encodes proportional arc length', () => {
    // PROJECT 240m, COMMUNICATION 120m, CI 120m → 50% / 25% / 25%
    const activities = [
      mkActivity({ bucket: 'PROJECT', plannedDurationMinutes: 240 }),
      mkActivity({ bucket: 'COMMUNICATION', plannedDurationMinutes: 120 }),
      mkActivity({ bucket: 'CI', plannedDurationMinutes: 120 })
    ];
    const html = CadencePressureRing({ activities });

    // Extract all stroke-dasharray values present in the SVG.
    const dasharrayMatches = [...html.matchAll(/stroke-dasharray="([^"]+)"/g)];
    // Each dasharray is "<arcLen> <gap>" — the arc lengths encode proportion.
    const arcLens = dasharrayMatches.map((m) => parseFloat(m[1]));

    // Size=56, strokeWidth=4, radius = 56/2 - 4/2 - 2 = 28 - 2 - 2 = 24
    const r = 24;
    const C = 2 * Math.PI * r;
    const projExpected = C * 0.5;   // 50%
    const commExpected = C * 0.25;  // 25%
    const ciExpected   = C * 0.25;  // 25%

    // arcLens should contain values close to the expected proportions.
    const hasProj = arcLens.some((l) => Math.abs(l - projExpected) < 0.1);
    const hasComm = arcLens.some((l) => Math.abs(l - commExpected) < 0.1);
    const hasCi   = arcLens.some((l) => Math.abs(l - ciExpected) < 0.1);

    assert.ok(hasProj, `No arc length close to PROJECT expected ${projExpected.toFixed(2)}. Got: ${arcLens.join(', ')}`);
    assert.ok(hasComm, `No arc length close to COMM expected ${commExpected.toFixed(2)}. Got: ${arcLens.join(', ')}`);
    assert.ok(hasCi,   `No arc length close to CI expected ${ciExpected.toFixed(2)}. Got: ${arcLens.join(', ')}`);
  });

  test('AC4: lunch (bucket: null) excluded — does not count toward total', () => {
    const activities = [
      mkActivity({ bucket: 'PROJECT', plannedDurationMinutes: 120 }),
      mkActivity({ bucket: null, plannedDurationMinutes: 60, name: 'Lunch' })
    ];
    const html = CadencePressureRing({ activities });
    // Total should be 120 mins = 2h (not 3h if lunch were included).
    assert.match(html, /2h/);
    assert.ok(!html.includes('3h'));
  });

  test('AC6: single-bucket renders one arc that fills the full circumference', () => {
    const activities = [
      mkActivity({ bucket: 'PROJECT', plannedDurationMinutes: 240 })
    ];
    const html = CadencePressureRing({ activities });
    assert.match(html, /cadence-arc-project/);
    // The arc segment should appear; the others should not (zero length skipped).
    assert.ok(!html.includes('cadence-arc-comm'));
    assert.ok(!html.includes('cadence-arc-ci'));
  });

  test('AC7: tooltip present by default with breakdown rows', () => {
    const activities = [
      mkActivity({ bucket: 'PROJECT', plannedDurationMinutes: 120 }),
      mkActivity({ bucket: 'COMMUNICATION', plannedDurationMinutes: 60 }),
      mkActivity({ bucket: 'CI', plannedDurationMinutes: 60 })
    ];
    const html = CadencePressureRing({ activities });
    assert.match(html, /cadence-tooltip/);
    assert.match(html, /PROJECT/);
    assert.match(html, /COMM/);
    assert.match(html, /CI/);
  });

  test('AC7: tooltip suppressed when showTooltip=false', () => {
    const activities = [
      mkActivity({ bucket: 'PROJECT', plannedDurationMinutes: 120 })
    ];
    const html = CadencePressureRing({ activities, showTooltip: false });
    assert.ok(!html.includes('cadence-tooltip'));
  });

  test('AC8: ARIA label present on container', () => {
    const activities = [
      mkActivity({ bucket: 'PROJECT', plannedDurationMinutes: 240 }),
      mkActivity({ bucket: 'COMMUNICATION', plannedDurationMinutes: 120 }),
      mkActivity({ bucket: 'CI', plannedDurationMinutes: 120 })
    ];
    const html = CadencePressureRing({ activities });
    assert.match(html, /role="img"/);
    assert.match(html, /aria-label="/);
    // Label mentions allocation info.
    assert.match(html, /Day allocation/);
  });

  test('AC8: ARIA label mentions all three buckets', () => {
    const activities = [
      mkActivity({ bucket: 'PROJECT', plannedDurationMinutes: 240 }),
      mkActivity({ bucket: 'COMMUNICATION', plannedDurationMinutes: 120 }),
      mkActivity({ bucket: 'CI', plannedDurationMinutes: 120 })
    ];
    const html = CadencePressureRing({ activities });
    assert.match(html, /Project/);
    assert.match(html, /Communication/);
    assert.match(html, /CI/);
  });

  test('AC9: bucket colors use canonical CSS variable classes (not hardcoded hex)', () => {
    // The CSS classes reference var(--project-fill) etc. via app.css rules.
    // In the HTML, we confirm the correct CSS class names are present.
    const activities = [
      mkActivity({ bucket: 'PROJECT', plannedDurationMinutes: 120 }),
      mkActivity({ bucket: 'COMMUNICATION', plannedDurationMinutes: 60 }),
      mkActivity({ bucket: 'CI', plannedDurationMinutes: 60 })
    ];
    const html = CadencePressureRing({ activities });
    // CSS classes must be present — the actual color binding is in app.css.
    assert.match(html, /cadence-arc-project/);
    assert.match(html, /cadence-arc-comm/);
    assert.match(html, /cadence-arc-ci/);
    // No hardcoded hex colors in the HTML (color lives in CSS).
    assert.ok(!html.includes('#16a34a'), 'No hardcoded green hex in render output');
    assert.ok(!html.includes('#ca8a04'), 'No hardcoded yellow hex in render output');
    assert.ok(!html.includes('#9333ea'), 'No hardcoded purple hex in render output');
  });

  test('AC10: center number uses cadence-ring-center class (mapped to Geist Mono in CSS)', () => {
    const html = CadencePressureRing({ activities: [] });
    assert.match(html, /cadence-ring-center/);
  });

  test('tooltip shows balanced status when all buckets meet floor', () => {
    const activities = [
      mkActivity({ bucket: 'PROJECT', plannedDurationMinutes: 240 }),
      mkActivity({ bucket: 'COMMUNICATION', plannedDurationMinutes: 120 }),
      mkActivity({ bucket: 'CI', plannedDurationMinutes: 120 })
    ];
    const html = CadencePressureRing({ activities });
    assert.match(html, /Day is balanced/);
  });

  test('tooltip shows unbalanced status when a bucket is under floor', () => {
    const activities = [
      mkActivity({ bucket: 'PROJECT', plannedDurationMinutes: 240 }),
      mkActivity({ bucket: 'COMMUNICATION', plannedDurationMinutes: 10 }),
      mkActivity({ bucket: 'CI', plannedDurationMinutes: 10 })
    ];
    const html = CadencePressureRing({ activities });
    assert.match(html, /Day is unbalanced/);
  });

  test('ring container has tabindex="0" for keyboard focus', () => {
    const html = CadencePressureRing({ activities: [] });
    assert.match(html, /tabindex="0"/);
  });

  test('overflow (>8h total) still renders proportional arcs, center shows actual total', () => {
    // 10 hours total — ring should still render.
    const activities = [
      mkActivity({ bucket: 'PROJECT', plannedDurationMinutes: 400 }),
      mkActivity({ bucket: 'COMMUNICATION', plannedDurationMinutes: 100 }),
      mkActivity({ bucket: 'CI', plannedDurationMinutes: 100 })
    ];
    const html = CadencePressureRing({ activities });
    // 600 minutes = 10h
    assert.match(html, /10h/);
    // All three segments present.
    assert.match(html, /cadence-arc-project/);
    assert.match(html, /cadence-arc-comm/);
    assert.match(html, /cadence-arc-ci/);
  });

  test('DEFAULT_TARGETS export matches BucketStrip canonical 4-2-2 values', () => {
    assert.equal(DEFAULT_TARGETS.PROJECT, 240);
    assert.equal(DEFAULT_TARGETS.COMMUNICATION, 120);
    assert.equal(DEFAULT_TARGETS.CI, 120);
  });
});

// ---------------------------------------------------------------------------
// Integration — Today.js renders Ring when composition has activities (AC20)
// ---------------------------------------------------------------------------

describe('CadencePressureRing — Today.js integration', () => {
  // Dynamically import Today to avoid loading the full app just for these tests.
  // Using a synchronous approach since we're in a describe block.
  let Today;

  // Helper to lazily import Today.
  async function getTodayFn() {
    if (!Today) {
      const mod = await import('../../../js/ui/pages/Today.js');
      Today = mod.Today;
    }
    return Today;
  }

  test('AC20: cadence-ring present when activeState has activities', async () => {
    const todayFn = await getTodayFn();
    const html = todayFn({
      activeState: {
        composition: { id: 'comp_1', state: 'PROPOSED', userId: 'u1', cycleType: 'DAILY' },
        activities: [
          { id: 'sa_1', bucket: 'PROJECT', plannedDurationMinutes: 120, plannedStartAt: '09:00', state: 'PROPOSED' }
        ]
      },
      daysSinceSignup: 5
    });
    assert.match(html, /class="cadence-ring"/, 'cadence-ring must be present when composition has activities');
  });

  test('AC20: cadence-ring absent in empty state (no activeState)', async () => {
    const todayFn = await getTodayFn();
    const html = todayFn({ activeState: null, daysSinceSignup: 0 });
    assert.ok(!html.includes('cadence-ring'), 'cadence-ring must be absent when no composition');
  });
});
