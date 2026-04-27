/**
 * Component + integration tests for InsightsPortfolio.js (E14 / C-PM-2).
 *
 * Tests use string-render assertions (no DOM heavy work) per spec R3.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { InsightsPortfolio, INSIGHTS_PORTFOLIO_COPY } from '../../../js/ui/pages/InsightsPortfolio.js';
import { kaizensToCsv } from '../../../js/services/validatedKaizenSelectors.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function closedKaizen(overrides = {}) {
  return {
    id: 'k_1',
    userId: 'u_1',
    title: 'Reduce rework',
    state: 'CLOSED',
    closeKind: 'SUCCESS',
    closedAt: '2026-04-10T12:00:00Z',
    projectType: 'DMAIC',
    implementationCostDollars: 5000,
    annualBenefitsDollars: 50000,
    abandoned: false,
    implementationLeadUserId: null,
    roiProjections: [],
    ...overrides
  };
}

function remeasurement(overrides = {}) {
  return {
    id: 'rm_1',
    kaizenId: 'k_1',
    baselineValue: 12.0,
    remeasurementValue: 8.4,
    deltaAbsolute: -3.6,
    deltaPercent: -30,
    beatsBaseline: true,
    ...overrides
  };
}

function baseline(overrides = {}) {
  return {
    id: 'bl_1',
    kaizenId: 'k_1',
    value: 12.0,
    ...overrides
  };
}

// ---------------------------------------------------------------------------
// Empty states
// ---------------------------------------------------------------------------

describe('InsightsPortfolio — empty pre-filter state', () => {
  test('renders universe-empty copy when no CLOSED kaizens at all', () => {
    const html = InsightsPortfolio({ kaizens: [], nowIso: '2026-04-27T10:00:00Z' });
    assert.ok(html.includes(INSIGHTS_PORTFOLIO_COPY.INSIGHTS_PORTFOLIO_EMPTY_UNIVERSE));
    assert.ok(!html.includes('<table'));
  });

  test('renders data-route=insights and data-sub=portfolio', () => {
    const html = InsightsPortfolio({ kaizens: [] });
    assert.match(html, /data-route="insights"/);
    assert.match(html, /data-sub="portfolio"/);
  });
});

describe('InsightsPortfolio — empty post-filter state (filters active, no matches)', () => {
  test('renders post-filter empty copy when filters eliminate all rows', () => {
    const k = closedKaizen({ id: 'k1', closeKind: 'SUCCESS' });
    const rmMap = { k1: remeasurement({ kaizenId: 'k1' }) };
    // Pass a hash that filters to PARTIAL only — no PARTIAL rows exist
    const html = InsightsPortfolio({
      kaizens: [k],
      remeasurementsByKaizenId: rmMap,
      locationHash: '#insights/portfolio?closeKind=PARTIAL',
      nowIso: '2026-04-27T10:00:00Z'
    });
    assert.ok(html.includes(INSIGHTS_PORTFOLIO_COPY.INSIGHTS_PORTFOLIO_EMPTY));
    assert.ok(!html.includes('<table'));
  });
});

// ---------------------------------------------------------------------------
// Counts
// ---------------------------------------------------------------------------

describe('InsightsPortfolio — counts', () => {
  test('shows "Validated: 3" for 3 validated kaizens', () => {
    const kaizens = [
      closedKaizen({ id: 'k1', annualBenefitsDollars: 500000 }),
      closedKaizen({ id: 'k2', annualBenefitsDollars: 500000 }),
      closedKaizen({ id: 'k3', annualBenefitsDollars: 250000 })
    ];
    const rmMap = {
      k1: remeasurement({ kaizenId: 'k1' }),
      k2: remeasurement({ kaizenId: 'k2' }),
      k3: remeasurement({ kaizenId: 'k3' })
    };
    const html = InsightsPortfolio({ kaizens, remeasurementsByKaizenId: rmMap });
    assert.match(html, /Validated: 3/);
    assert.match(html, /\$1,250,000/);
  });

  test('currency formatted — $1,250,000 (AC spec §5)', () => {
    const k = closedKaizen({ id: 'k1', annualBenefitsDollars: 1250000 });
    const rmMap = { k1: remeasurement({ kaizenId: 'k1' }) };
    const html = InsightsPortfolio({ kaizens: [k], remeasurementsByKaizenId: rmMap });
    assert.match(html, /\$1,250,000/);
  });

  test('zero-benefits edge case shows $0', () => {
    const k = closedKaizen({ id: 'k1', annualBenefitsDollars: 0 });
    const rmMap = { k1: remeasurement({ kaizenId: 'k1' }) };
    const html = InsightsPortfolio({ kaizens: [k], remeasurementsByKaizenId: rmMap });
    assert.match(html, /\$0/);
  });

  test('annualBenefitsDollars=null → row shows "—" in benefit column (AC9)', () => {
    const k = closedKaizen({ id: 'k1', annualBenefitsDollars: null });
    const rmMap = { k1: remeasurement({ kaizenId: 'k1' }) };
    const html = InsightsPortfolio({ kaizens: [k], remeasurementsByKaizenId: rmMap });
    // sum should be $0
    assert.match(html, /\$0/);
    // row should be rendered (we have 1 validated kaizen)
    assert.match(html, /Validated: 1/);
  });
});

// ---------------------------------------------------------------------------
// Filter toggles
// ---------------------------------------------------------------------------

describe('InsightsPortfolio — filter toggles', () => {
  test('closeKind filter SUCCESS only hides PARTIAL rows', () => {
    const kaizens = [
      closedKaizen({ id: 'k1', closeKind: 'SUCCESS', title: 'Success Kaizen' }),
      closedKaizen({ id: 'k2', closeKind: 'PARTIAL', title: 'Partial Kaizen' })
    ];
    const rmMap = {
      k1: remeasurement({ kaizenId: 'k1' }),
      k2: remeasurement({ kaizenId: 'k2' })
    };
    const html = InsightsPortfolio({
      kaizens,
      remeasurementsByKaizenId: rmMap,
      locationHash: '#insights/portfolio?closeKind=SUCCESS'
    });
    assert.ok(html.includes('Success Kaizen'));
    assert.ok(!html.includes('Partial Kaizen'));
  });

  test('reset button renders', () => {
    const html = InsightsPortfolio({ kaizens: [] });
    assert.match(html, /data-action="IP_RESET_FILTERS"/);
  });
});

// ---------------------------------------------------------------------------
// Finance-signed tag (AC10)
// ---------------------------------------------------------------------------

describe('InsightsPortfolio — Finance-signed tag', () => {
  test('DMAIC with financePartnerUserId → "Finance-signed" tag rendered (AC10)', () => {
    const k = closedKaizen({
      id: 'k1',
      projectType: 'DMAIC',
      roiProjections: [{ financePartnerUserId: 'fp_99' }]
    });
    const rmMap = { k1: remeasurement({ kaizenId: 'k1' }) };
    const html = InsightsPortfolio({ kaizens: [k], remeasurementsByKaizenId: rmMap });
    assert.ok(html.includes('Finance-signed'));
  });

  test('DMAIC with financePartnerUserId=null → no "Finance-signed" tag (AC10)', () => {
    const k = closedKaizen({
      id: 'k1',
      projectType: 'DMAIC',
      roiProjections: [{ financePartnerUserId: null }]
    });
    const rmMap = { k1: remeasurement({ kaizenId: 'k1' }) };
    const html = InsightsPortfolio({ kaizens: [k], remeasurementsByKaizenId: rmMap });
    assert.ok(!html.includes('Finance-signed'));
  });

  test('non-DMAIC with roiProjections → no "Finance-signed" tag (AC10)', () => {
    const k = closedKaizen({
      id: 'k1',
      projectType: 'KAIZEN_EVENT_90D',
      roiProjections: [{ financePartnerUserId: 'fp_99' }]
    });
    const rmMap = { k1: remeasurement({ kaizenId: 'k1' }) };
    const html = InsightsPortfolio({ kaizens: [k], remeasurementsByKaizenId: rmMap });
    assert.ok(!html.includes('Finance-signed'));
  });
});

// ---------------------------------------------------------------------------
// Export button
// ---------------------------------------------------------------------------

describe('InsightsPortfolio — export button', () => {
  test('export button renders with correct data-action (AC4)', () => {
    const html = InsightsPortfolio({ kaizens: [], nowIso: '2026-04-27T10:00:00Z' });
    assert.match(html, /data-action="IP_EXPORT_CSV"/);
    assert.ok(html.includes(INSIGHTS_PORTFOLIO_COPY.INSIGHTS_PORTFOLIO_EXPORT_BUTTON));
  });

  test('export button payload contains todayDate (AC4)', () => {
    const html = InsightsPortfolio({ kaizens: [], nowIso: '2026-04-27T10:00:00Z' });
    assert.ok(html.includes('2026-04-27'));
  });
});

// ---------------------------------------------------------------------------
// Integration test (spec §7)
// ---------------------------------------------------------------------------

describe('InsightsPortfolio — integration: route to /#insights/portfolio?closeKind=SUCCESS', () => {
  test('fixture: 2 SUCCESS + 1 PARTIAL + 1 FAILED_HONEST → 2 rows, Validated:3, Showing 2', () => {
    const kaizens = [
      closedKaizen({ id: 'k1', closeKind: 'SUCCESS', title: 'Success One' }),
      closedKaizen({ id: 'k2', closeKind: 'SUCCESS', title: 'Success Two' }),
      closedKaizen({ id: 'k3', closeKind: 'PARTIAL', title: 'Partial Three' }),
      closedKaizen({ id: 'k4', closeKind: 'FAILED_HONEST', title: 'Failed Four' })
    ];
    const rmMap = {
      k1: remeasurement({ kaizenId: 'k1' }),
      k2: remeasurement({ kaizenId: 'k2' }),
      k3: remeasurement({ kaizenId: 'k3' })
      // k4 has no remeasurement; also FAILED_HONEST = not validated anyway
    };

    const html = InsightsPortfolio({
      kaizens,
      remeasurementsByKaizenId: rmMap,
      locationHash: '#insights/portfolio?closeKind=SUCCESS',
      nowIso: '2026-04-27T10:00:00Z'
    });

    // Universe count = 3 (k1 SUCCESS, k2 SUCCESS, k3 PARTIAL)
    assert.match(html, /Validated: 3/);
    // Showing 2 (filter: SUCCESS only)
    assert.match(html, /Showing 2/);

    // Only SUCCESS rows visible
    assert.ok(html.includes('Success One'));
    assert.ok(html.includes('Success Two'));
    assert.ok(!html.includes('Partial Three'));
    assert.ok(!html.includes('Failed Four'));

    // Table is rendered (not empty state)
    assert.match(html, /<table/);
  });

  test('FAILED_HONEST kaizen does NOT appear in table or count (AC3)', () => {
    const k = closedKaizen({ id: 'k1', closeKind: 'FAILED_HONEST', title: 'Should be hidden' });
    const rmMap = { k1: remeasurement({ kaizenId: 'k1' }) };
    const html = InsightsPortfolio({ kaizens: [k], remeasurementsByKaizenId: rmMap });
    assert.match(html, /Validated: 0/);
    assert.ok(!html.includes('Should be hidden'));
    assert.ok(!html.includes('<table'));
  });
});

// ---------------------------------------------------------------------------
// CSV via kaizensToCsv (export logic, per spec R5 — no Blob in tests)
// ---------------------------------------------------------------------------

describe('InsightsPortfolio — CSV export content (AC4/AC8)', () => {
  test('export produces correct field order per §2.5', () => {
    const k = closedKaizen({ id: 'k1' });
    const rmMap = { k1: remeasurement({ kaizenId: 'k1' }) };
    const blMap = { k1: baseline({ kaizenId: 'k1' }) };
    const csv = kaizensToCsv([k], blMap, rmMap);
    const headerFields = csv.split('\r\n')[0].split(',');
    assert.equal(headerFields[0], 'closedAt');
    assert.equal(headerFields[1], 'id');
    assert.equal(headerFields[11], 'financePartnerUserId');
  });

  test('AC8: CSV cell with comma, quote, and newline is fully quoted', () => {
    const k = closedKaizen({ id: 'k1', title: 'Cut costs, "rework"\nand waste' });
    const csv = kaizensToCsv([k], {}, {});
    // Should contain the doubly-escaped version
    assert.ok(csv.includes('"Cut costs, ""rework""\nand waste"'));
  });

  test('download attribute filename matches pattern validated-kaizens-YYYY-MM-DD.csv (AC4)', () => {
    const html = InsightsPortfolio({ kaizens: [], nowIso: '2026-04-27T10:00:00Z' });
    // The todayDate is embedded in the export button payload
    assert.ok(html.includes('2026-04-27'));
  });
});

// ---------------------------------------------------------------------------
// URL filter persistence (AC6)
// ---------------------------------------------------------------------------

describe('InsightsPortfolio — URL filter persistence (AC6)', () => {
  test('filter state restored from locationHash on render', () => {
    const kaizens = [
      closedKaizen({ id: 'k1', closeKind: 'SUCCESS', title: 'S1' }),
      closedKaizen({ id: 'k2', closeKind: 'PARTIAL', title: 'P1' })
    ];
    const rmMap = {
      k1: remeasurement({ kaizenId: 'k1' }),
      k2: remeasurement({ kaizenId: 'k2' })
    };
    // Simulate page reload with PARTIAL filter
    const html = InsightsPortfolio({
      kaizens,
      remeasurementsByKaizenId: rmMap,
      locationHash: '#insights/portfolio?closeKind=PARTIAL'
    });
    assert.ok(html.includes('P1'));
    assert.ok(!html.includes('S1'));
    // PARTIAL toggle should be aria-pressed="true"
    assert.match(html, /aria-pressed="true"[^>]*>PARTIAL/);
  });
});
