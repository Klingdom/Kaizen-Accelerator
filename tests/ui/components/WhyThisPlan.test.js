/**
 * Tests for WhyThisPlan component (C-UX-12, Iteration 14).
 *
 * AC12-1: explain with R5_DEEP_PAYLOAD entries → heading + detail strings visible when expanded
 * AC12-2: explain = []  → no chip rendered
 * AC12-3: 3 rules (R1, R5, R7) → canonical order R1 < R5 < R7 when expanded
 * AC12-4: collapsed → aria-expanded="false"; expanded → aria-expanded="true"
 * AC12-5: empty/infeasible state (handled by Today; component returns '' for empty explain)
 *
 * All fixtures deterministic. No Date.now, no Math.random.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { WhyThisPlan } from '../../../js/ui/components/WhyThisPlan.js';

// ---------------------------------------------------------------------------
// AC12-2: empty / missing explain → render nothing
// ---------------------------------------------------------------------------
describe('WhyThisPlan — empty explain (AC12-2)', () => {
  test('explain = [] → empty string', () => {
    assert.equal(WhyThisPlan({ explain: [], expanded: false }), '');
  });

  test('explain = null → empty string', () => {
    assert.equal(WhyThisPlan({ explain: null, expanded: false }), '');
  });

  test('explain = undefined → empty string', () => {
    assert.equal(WhyThisPlan({ explain: undefined, expanded: false }), '');
  });

  test('no props → empty string', () => {
    assert.equal(WhyThisPlan(), '');
  });
});

// ---------------------------------------------------------------------------
// AC12-4: collapsed state
// ---------------------------------------------------------------------------
describe('WhyThisPlan — collapsed state (AC12-4)', () => {
  const explain = [{ ref: 'cat_001', rule: 'R5_DEEP_PAYLOAD', detail: 'Deep work block (90m)' }];

  test('renders the chip button', () => {
    const html = WhyThisPlan({ explain, expanded: false });
    assert.ok(html.includes('why-this-plan-chip'), `Expected chip class. HTML: ${html}`);
  });

  test('aria-expanded="false" when collapsed', () => {
    const html = WhyThisPlan({ explain, expanded: false });
    assert.ok(html.includes('aria-expanded="false"'), `Expected aria-expanded="false". HTML: ${html}`);
  });

  test('chip has data-action="TOGGLE_WHY_PLAN"', () => {
    const html = WhyThisPlan({ explain, expanded: false });
    assert.ok(html.includes('data-action="TOGGLE_WHY_PLAN"'), `Expected data-action. HTML: ${html}`);
  });

  test('collapsed state does NOT render the rule list', () => {
    const html = WhyThisPlan({ explain, expanded: false });
    assert.ok(!html.includes('why-list'), `Should not render rule list when collapsed. HTML: ${html}`);
  });
});

// ---------------------------------------------------------------------------
// AC12-1 + AC12-4: expanded state with R5_DEEP_PAYLOAD
// ---------------------------------------------------------------------------
describe('WhyThisPlan — expanded state with R5 (AC12-1 / AC12-4)', () => {
  const explain = [
    { ref: 'cat_001', rule: 'R5_DEEP_PAYLOAD', detail: 'DMAIC Define block (60m)' },
    { ref: 'cat_002', rule: 'R5_DEEP_PAYLOAD', detail: 'Generic deep work (90m)' }
  ];

  test('aria-expanded="true" when expanded', () => {
    const html = WhyThisPlan({ explain, expanded: true });
    assert.ok(html.includes('aria-expanded="true"'), `Expected aria-expanded="true". HTML: ${html}`);
  });

  test('renders the why-list element', () => {
    const html = WhyThisPlan({ explain, expanded: true });
    assert.ok(html.includes('why-list'), `Expected why-list. HTML: ${html}`);
  });

  test('renders the "Deep work payload" rule heading (AC12-1)', () => {
    const html = WhyThisPlan({ explain, expanded: true });
    assert.ok(html.includes('Deep work payload'), `Expected heading. HTML: ${html}`);
  });

  test('renders first detail string (AC12-1)', () => {
    const html = WhyThisPlan({ explain, expanded: true });
    assert.ok(html.includes('DMAIC Define block (60m)'), `Expected first detail. HTML: ${html}`);
  });

  test('renders second detail string (AC12-1)', () => {
    const html = WhyThisPlan({ explain, expanded: true });
    assert.ok(html.includes('Generic deep work (90m)'), `Expected second detail. HTML: ${html}`);
  });
});

// ---------------------------------------------------------------------------
// AC12-3: canonical rule order — R1 < R5 < R7
// ---------------------------------------------------------------------------
describe('WhyThisPlan — canonical rule order (AC12-3)', () => {
  const explain = [
    { ref: 'cat_x', rule: 'R7_COMM_FILLER',  detail: 'Comm slot' },
    { ref: 'cat_y', rule: 'R1_NON_OPTIONAL', detail: 'Standup' },
    { ref: 'cat_z', rule: 'R5_DEEP_PAYLOAD', detail: 'Deep block' }
  ];

  test('R1 heading appears before R5 heading', () => {
    const html = WhyThisPlan({ explain, expanded: true });
    const posR1 = html.indexOf('Non-optional anchors');
    const posR5 = html.indexOf('Deep work payload');
    assert.ok(posR1 !== -1, 'R1 heading must be present');
    assert.ok(posR5 !== -1, 'R5 heading must be present');
    assert.ok(posR1 < posR5, `R1 must come before R5. posR1=${posR1}, posR5=${posR5}`);
  });

  test('R5 heading appears before R7 heading', () => {
    const html = WhyThisPlan({ explain, expanded: true });
    const posR5 = html.indexOf('Deep work payload');
    const posR7 = html.indexOf('Communication slots');
    assert.ok(posR5 !== -1, 'R5 heading must be present');
    assert.ok(posR7 !== -1, 'R7 heading must be present');
    assert.ok(posR5 < posR7, `R5 must come before R7. posR5=${posR5}, posR7=${posR7}`);
  });
});

// ---------------------------------------------------------------------------
// All 8 canonical rule labels
// ---------------------------------------------------------------------------
describe('WhyThisPlan — all canonical rule labels', () => {
  const ALL_RULES = [
    { rule: 'R1_NON_OPTIONAL',   label: 'Non-optional anchors' },
    { rule: 'R2_VARIANCE_RESCUE',label: "carry-overs" }, // apostrophe in "Yesterday's" is HTML-encoded; match suffix
    { rule: 'R3_KAIZEN_LINK',    label: 'Kaizen-aligned deep work' },
    { rule: 'R4_PHASE_CEREMONY', label: 'Phase ceremony (Accelerator/DMAIC)' },
    { rule: 'R5_DEEP_PAYLOAD',   label: 'Deep work payload' },
    { rule: 'R6_CI_ROTATION',    label: 'Continuous improvement' },
    { rule: 'R7_COMM_FILLER',    label: 'Communication slots' },
    { rule: 'R9_RELAXED',        label: 'Relaxed constraints applied' }
  ];

  for (const { rule, label } of ALL_RULES) {
    test(`${rule} → "${label}"`, () => {
      const explain = [{ ref: 'cat_test', rule, detail: `Detail for ${rule}` }];
      const html = WhyThisPlan({ explain, expanded: true });
      assert.ok(html.includes(label), `Expected label "${label}" for rule ${rule}. HTML: ${html.slice(0, 400)}`);
    });
  }
});

// ---------------------------------------------------------------------------
// Unknown rule — graceful degrade (R-CP-3 mitigation)
// ---------------------------------------------------------------------------
describe('WhyThisPlan — unknown rule falls back to rule key', () => {
  test('R99_FUTURE renders with the rule key as heading', () => {
    const explain = [{ ref: 'cat_001', rule: 'R99_FUTURE', detail: 'Future rule detail' }];
    const html = WhyThisPlan({ explain, expanded: true });
    assert.ok(html.includes('R99_FUTURE'), `Expected rule key as fallback heading. HTML: ${html}`);
  });
});

// ---------------------------------------------------------------------------
// XSS / escaping
// ---------------------------------------------------------------------------
describe('WhyThisPlan — HTML escaping', () => {
  test('detail containing HTML is escaped', () => {
    const explain = [{ ref: 'cat_001', rule: 'R5_DEEP_PAYLOAD', detail: '<script>bad()</script>' }];
    const html = WhyThisPlan({ explain, expanded: true });
    assert.ok(!html.includes('<script>'), `Raw script tag must not appear. HTML: ${html}`);
  });
});

// ---------------------------------------------------------------------------
// Structural: expanded variant uses <dl>
// ---------------------------------------------------------------------------
describe('WhyThisPlan — expanded uses dl/dt/dd structure', () => {
  const explain = [{ ref: 'cat_001', rule: 'R1_NON_OPTIONAL', detail: 'Standup' }];

  test('expanded HTML contains <dl>', () => {
    const html = WhyThisPlan({ explain, expanded: true });
    assert.ok(html.includes('<dl'), `Expected <dl>. HTML: ${html}`);
  });

  test('expanded HTML contains <dt>', () => {
    const html = WhyThisPlan({ explain, expanded: true });
    assert.ok(html.includes('<dt'), `Expected <dt>. HTML: ${html}`);
  });

  test('expanded HTML contains <dd>', () => {
    const html = WhyThisPlan({ explain, expanded: true });
    assert.ok(html.includes('<dd'), `Expected <dd>. HTML: ${html}`);
  });
});
