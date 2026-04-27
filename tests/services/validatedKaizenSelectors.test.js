/**
 * Unit tests for validatedKaizenSelectors.js (E14 / C-PM-2).
 * ~22 tests covering isValidatedKaizen, summarizeValidated, filterValidated,
 * kaizensToCsv, parseFilterQuery, and serializeFilterQuery.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  isValidatedKaizen,
  summarizeValidated,
  filterValidated,
  kaizensToCsv,
  parseFilterQuery,
  serializeFilterQuery
} from '../../js/services/validatedKaizenSelectors.js';

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
// isValidatedKaizen
// ---------------------------------------------------------------------------

describe('isValidatedKaizen', () => {
  test('CLOSED+SUCCESS+remeas → true', () => {
    assert.ok(isValidatedKaizen(closedKaizen(), remeasurement()));
  });

  test('CLOSED+PARTIAL+remeas → true', () => {
    assert.ok(isValidatedKaizen(closedKaizen({ closeKind: 'PARTIAL' }), remeasurement()));
  });

  test('CLOSED+FAILED_HONEST → false', () => {
    assert.ok(!isValidatedKaizen(closedKaizen({ closeKind: 'FAILED_HONEST' }), remeasurement()));
  });

  test('CLOSED+SUCCESS+abandoned=true → false', () => {
    assert.ok(!isValidatedKaizen(closedKaizen({ abandoned: true }), remeasurement()));
  });

  test('CLOSED+SUCCESS+remeas=null → false', () => {
    assert.ok(!isValidatedKaizen(closedKaizen(), null));
  });

  test('ACTIVE+SUCCESS → false', () => {
    assert.ok(!isValidatedKaizen(closedKaizen({ state: 'ACTIVE' }), remeasurement()));
  });

  test('null kaizen → false', () => {
    assert.ok(!isValidatedKaizen(null, remeasurement()));
  });
});

// ---------------------------------------------------------------------------
// summarizeValidated
// ---------------------------------------------------------------------------

describe('summarizeValidated', () => {
  test('empty input → zeros', () => {
    const r = summarizeValidated([], {});
    assert.equal(r.count, 0);
    assert.equal(r.totalBenefitsDollars, 0);
    assert.deepEqual(r.byCloseKind, { SUCCESS: 0, PARTIAL: 0 });
  });

  test('mixed validated/non-validated → only validated counted', () => {
    const kaizens = [
      closedKaizen({ id: 'k1', annualBenefitsDollars: 10000 }),
      closedKaizen({ id: 'k2', closeKind: 'FAILED_HONEST', annualBenefitsDollars: 5000 }),
      closedKaizen({ id: 'k3', closeKind: 'PARTIAL', annualBenefitsDollars: 3000 })
    ];
    const rmMap = {
      k1: remeasurement({ kaizenId: 'k1' }),
      k3: remeasurement({ kaizenId: 'k3' })
    };
    const r = summarizeValidated(kaizens, rmMap);
    assert.equal(r.count, 2);
    assert.equal(r.totalBenefitsDollars, 13000);
    assert.equal(r.byCloseKind.SUCCESS, 1);
    assert.equal(r.byCloseKind.PARTIAL, 1);
  });

  test('null annualBenefitsDollars treated as 0 in sum but row counted', () => {
    const k = closedKaizen({ id: 'k1', annualBenefitsDollars: null });
    const rmMap = { k1: remeasurement() };
    const r = summarizeValidated([k], rmMap);
    assert.equal(r.count, 1);
    assert.equal(r.totalBenefitsDollars, 0);
  });

  test('byCloseKind accurate', () => {
    const kaizens = [
      closedKaizen({ id: 'k1', closeKind: 'SUCCESS' }),
      closedKaizen({ id: 'k2', closeKind: 'SUCCESS' }),
      closedKaizen({ id: 'k3', closeKind: 'PARTIAL' })
    ];
    const rmMap = {
      k1: remeasurement(),
      k2: remeasurement(),
      k3: remeasurement()
    };
    const r = summarizeValidated(kaizens, rmMap);
    assert.equal(r.byCloseKind.SUCCESS, 2);
    assert.equal(r.byCloseKind.PARTIAL, 1);
  });
});

// ---------------------------------------------------------------------------
// filterValidated
// ---------------------------------------------------------------------------

describe('filterValidated', () => {
  const kaizens = [
    closedKaizen({ id: 'k1', closeKind: 'SUCCESS', projectType: 'DMAIC', implementationLeadUserId: 'u_lead' }),
    closedKaizen({ id: 'k2', closeKind: 'PARTIAL', projectType: 'KAIZEN_EVENT_90D', implementationLeadUserId: null }),
    closedKaizen({ id: 'k3', closeKind: 'FAILED_HONEST', projectType: 'DMAIC', implementationLeadUserId: null }),
    closedKaizen({ id: 'k4', closeKind: 'SUCCESS', projectType: 'KAIZEN_ACCELERATOR_30D', implementationLeadUserId: null })
  ];
  const rmMap = {
    k1: remeasurement({ kaizenId: 'k1' }),
    k2: remeasurement({ kaizenId: 'k2' }),
    // k3 missing = not validated anyway
    k4: remeasurement({ kaizenId: 'k4' })
  };

  test('empty filterSet matches all validated', () => {
    const r = filterValidated(kaizens, rmMap, {});
    // k1 (SUCCESS DMAIC), k2 (PARTIAL KAIZEN_EVENT_90D), k4 (SUCCESS KAIZEN_ACCELERATOR_30D)
    assert.equal(r.length, 3);
  });

  test('closeKind filter — SUCCESS only', () => {
    const r = filterValidated(kaizens, rmMap, { closeKinds: new Set(['SUCCESS']) });
    assert.equal(r.length, 2);
    assert.ok(r.every((k) => k.closeKind === 'SUCCESS'));
  });

  test('projectType filter — DMAIC only', () => {
    const r = filterValidated(kaizens, rmMap, { projectTypes: new Set(['DMAIC']) });
    assert.equal(r.length, 1);
    assert.equal(r[0].id, 'k1');
  });

  test('lead filter — u_lead only', () => {
    const r = filterValidated(kaizens, rmMap, { leadUserId: 'u_lead' });
    assert.equal(r.length, 1);
    assert.equal(r[0].id, 'k1');
  });

  test('combined filters — SUCCESS + DMAIC', () => {
    const r = filterValidated(kaizens, rmMap, {
      closeKinds: new Set(['SUCCESS']),
      projectTypes: new Set(['DMAIC'])
    });
    assert.equal(r.length, 1);
    assert.equal(r[0].id, 'k1');
  });
});

// ---------------------------------------------------------------------------
// kaizensToCsv
// ---------------------------------------------------------------------------

describe('kaizensToCsv', () => {
  test('header row present in first line', () => {
    const csv = kaizensToCsv([], {}, {});
    const firstLine = csv.split('\r\n')[0];
    assert.ok(firstLine.includes('closedAt'));
    assert.ok(firstLine.includes('id'));
    assert.ok(firstLine.includes('title'));
  });

  test('field order matches §2.5', () => {
    const csv = kaizensToCsv([], {}, {});
    const firstLine = csv.split('\r\n')[0];
    const fields = firstLine.split(',');
    assert.equal(fields[0], 'closedAt');
    assert.equal(fields[1], 'id');
    assert.equal(fields[2], 'title');
    assert.equal(fields[3], 'projectType');
    assert.equal(fields[4], 'closeKind');
    assert.equal(fields[5], 'baselineValue');
    assert.equal(fields[6], 'remeasurementValue');
    assert.equal(fields[7], 'deltaAbsolute');
    assert.equal(fields[8], 'deltaPercent');
    assert.equal(fields[9], 'implementationCostDollars');
    assert.equal(fields[10], 'annualBenefitsDollars');
    assert.equal(fields[11], 'financePartnerUserId');
  });

  test('embedded comma → RFC 4180 quoted', () => {
    const k = closedKaizen({ id: 'k1', title: 'Reduce cost, rework' });
    const csv = kaizensToCsv([k], { k1: baseline() }, { k1: remeasurement() });
    assert.ok(csv.includes('"Reduce cost, rework"'));
  });

  test('embedded double-quote → doubled inside quotes (AC8)', () => {
    const k = closedKaizen({ id: 'k1', title: 'He said "hello"' });
    const csv = kaizensToCsv([k], { k1: baseline() }, { k1: remeasurement() });
    assert.ok(csv.includes('"He said ""hello"""'));
  });

  test('embedded newline → quoted (AC8)', () => {
    const k = closedKaizen({ id: 'k1', title: 'Line1\nLine2' });
    const csv = kaizensToCsv([k], { k1: baseline() }, { k1: remeasurement() });
    assert.ok(csv.includes('"Line1\nLine2"'));
  });

  test('combined hostile chars: comma + quote + newline in same title (AC8)', () => {
    const k = closedKaizen({ id: 'k1', title: 'He said "hi,\nthere"' });
    const csv = kaizensToCsv([k], { k1: baseline() }, { k1: remeasurement() });
    assert.ok(csv.includes('"He said ""hi,\nthere"""'));
  });

  test('null values → empty cell', () => {
    const k = closedKaizen({ id: 'k1', annualBenefitsDollars: null, implementationCostDollars: null });
    const csv = kaizensToCsv([k], {}, {});
    // annualBenefitsDollars and implementationCostDollars columns should be empty
    const dataLine = csv.split('\r\n')[1];
    assert.ok(typeof dataLine === 'string');
    // The row should have 12 fields
    const parts = dataLine.split(',');
    assert.equal(parts.length, 12);
  });

  test('CRLF line terminator', () => {
    const csv = kaizensToCsv([], {}, {});
    assert.ok(csv.includes('\r\n'));
    assert.ok(!csv.includes('\n\n'));
  });
});

// ---------------------------------------------------------------------------
// parseFilterQuery / serializeFilterQuery
// ---------------------------------------------------------------------------

describe('parseFilterQuery', () => {
  test('no query string → defaults (both closeKinds, all projectTypes, no lead)', () => {
    const r = parseFilterQuery('#insights/portfolio');
    assert.ok(r.closeKinds.has('SUCCESS'));
    assert.ok(r.closeKinds.has('PARTIAL'));
    assert.equal(r.projectTypes.size, 4);
    assert.equal(r.leadUserId, null);
  });

  test('closeKind=SUCCESS → only SUCCESS', () => {
    const r = parseFilterQuery('#insights/portfolio?closeKind=SUCCESS');
    assert.ok(r.closeKinds.has('SUCCESS'));
    assert.ok(!r.closeKinds.has('PARTIAL'));
  });

  test('projectType=DMAIC → only DMAIC', () => {
    const r = parseFilterQuery('#insights/portfolio?projectType=DMAIC');
    assert.ok(r.projectTypes.has('DMAIC'));
    assert.equal(r.projectTypes.size, 1);
  });

  test('lead=user_42 → leadUserId set', () => {
    const r = parseFilterQuery('#insights/portfolio?lead=user_42');
    assert.equal(r.leadUserId, 'user_42');
  });

  test('unknown keys ignored, valid keys parsed', () => {
    const r = parseFilterQuery('#insights/portfolio?foo=bar&closeKind=PARTIAL');
    assert.ok(r.closeKinds.has('PARTIAL'));
    assert.equal(r.closeKinds.size, 1);
  });

  test('missing keys default correctly', () => {
    const r = parseFilterQuery('#insights/portfolio?lead=u1');
    // closeKinds and projectTypes should still be defaults
    assert.ok(r.closeKinds.has('SUCCESS'));
    assert.ok(r.closeKinds.has('PARTIAL'));
    assert.equal(r.projectTypes.size, 4);
  });
});

describe('serializeFilterQuery', () => {
  test('default state → empty string (no query string needed)', () => {
    const fs = {
      closeKinds: new Set(['SUCCESS', 'PARTIAL']),
      projectTypes: new Set(['KAIZEN_ACCELERATOR_30D', 'KAIZEN_EVENT_90D', 'DMAIC', 'AD_HOC']),
      leadUserId: null
    };
    assert.equal(serializeFilterQuery(fs), '');
  });

  test('non-default closeKinds → serialized', () => {
    const fs = {
      closeKinds: new Set(['SUCCESS']),
      projectTypes: new Set(['KAIZEN_ACCELERATOR_30D', 'KAIZEN_EVENT_90D', 'DMAIC', 'AD_HOC']),
      leadUserId: null
    };
    assert.ok(serializeFilterQuery(fs).includes('closeKind=SUCCESS'));
  });

  test('round-trip fidelity', () => {
    const fs = {
      closeKinds: new Set(['SUCCESS']),
      projectTypes: new Set(['DMAIC']),
      leadUserId: 'user_42'
    };
    const qs = serializeFilterQuery(fs);
    const restored = parseFilterQuery('#insights/portfolio?' + qs);
    assert.ok(restored.closeKinds.has('SUCCESS'));
    assert.ok(!restored.closeKinds.has('PARTIAL'));
    assert.ok(restored.projectTypes.has('DMAIC'));
    assert.equal(restored.projectTypes.size, 1);
    assert.equal(restored.leadUserId, 'user_42');
  });
});
