/**
 * Tests for the Portfolio page (Sprint 7 P0-T5).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  Portfolio,
  PORTFOLIO_COPY,
  OPP_FILTER_VALUES,
  OPP_SORT_VALUES
} from '../../../js/ui/pages/Portfolio.js';

function kaizenActive(overrides = {}) {
  return {
    id: 'k_1',
    userId: 'u_1',
    title: 'Active K',
    problemStatement: 'a problem',
    goalStatement: 'a goal',
    sourceFrictionSignalIds: [],
    baselineMetricId: 'bm_1',
    actions: [],
    state: 'ACTIVE',
    openedAt: '2026-04-21T10:00:00Z',
    projectType: 'DMAIC',
    ...overrides
  };
}

function opp(overrides = {}) {
  return {
    id: 'opp_1',
    userId: 'u_1',
    title: 'Reduce meetings',
    problemStatement: 'Too many meetings',
    scope: null,
    proposedProjectType: 'DMAIC',
    status: 'INTAKE',
    promotedKaizenId: null,
    deferredUntil: null,
    rejectionReason: null,
    createdAt: '2026-04-15T10:00:00Z',
    updatedAt: '2026-04-15T10:00:00Z',
    ...overrides
  };
}

describe('Portfolio — structure', () => {
  test('renders a main with data-route=portfolio', () => {
    const html = Portfolio();
    assert.match(html, /<main class="pf-page" data-route="portfolio">/);
  });

  test('renders title + New Opportunity button', () => {
    const html = Portfolio();
    assert.match(html, new RegExp(PORTFOLIO_COPY.TITLE));
    assert.match(html, new RegExp(PORTFOLIO_COPY.NEW_OPP));
    assert.match(html, /data-action="OPP_OPEN_INTAKE"/);
  });

  test('renders all 3 sections', () => {
    const html = Portfolio();
    assert.match(html, /pf-active-kaizens/);
    assert.match(html, /pf-opportunities/);
    assert.match(html, /pf-catalog/);
  });
});

describe('Portfolio — empty states', () => {
  test('active kaizens section empty state', () => {
    const html = Portfolio();
    assert.match(html, new RegExp(PORTFOLIO_COPY.ACTIVE_EMPTY));
  });

  test('opportunities section empty state', () => {
    const html = Portfolio();
    assert.match(html, new RegExp(PORTFOLIO_COPY.OPPORTUNITIES_EMPTY));
  });
});

describe('Portfolio — Active Kaizens section', () => {
  test('renders kaizen cards when provided', () => {
    const html = Portfolio({ activeKaizens: [kaizenActive({ title: 'First Kaizen' })] });
    assert.match(html, /First Kaizen/);
    assert.match(html, /kz-card-active/);
  });

  test('count shown in header', () => {
    const html = Portfolio({ activeKaizens: [kaizenActive(), kaizenActive({ id: 'k_2' })] });
    assert.match(html, /Active Kaizens \(2\)/);
  });
});

describe('Portfolio — Opportunities section', () => {
  test('renders opportunity rows when provided', () => {
    const html = Portfolio({
      opportunities: [opp({ title: 'My Opportunity' })],
      nowIso: '2026-04-21T10:00:00Z'
    });
    assert.match(html, /My Opportunity/);
  });

  test('filter and sort select boxes render', () => {
    const html = Portfolio({ opportunities: [opp()] });
    assert.match(html, /data-action="OPP_FILTER_CHANGE"/);
    assert.match(html, /data-action="OPP_SORT_CHANGE"/);
  });

  test('filter="INTAKE" only shows INTAKE rows', () => {
    const html = Portfolio({
      opportunities: [
        opp({ id: 'o1', title: 'Intake One', status: 'INTAKE' }),
        opp({ id: 'o2', title: 'Rejected Two', status: 'REJECTED' })
      ],
      oppFilter: 'INTAKE'
    });
    assert.match(html, /Intake One/);
    assert.ok(!html.includes('Rejected Two'));
  });

  test('filter="REJECTED" only shows rejected rows', () => {
    const html = Portfolio({
      opportunities: [
        opp({ id: 'o1', title: 'Intake One', status: 'INTAKE' }),
        opp({ id: 'o2', title: 'Rejected Two', status: 'REJECTED' })
      ],
      oppFilter: 'REJECTED'
    });
    assert.match(html, /Rejected Two/);
    assert.ok(!html.includes('Intake One'));
  });

  test('sort="newest" puts recent first', () => {
    const html = Portfolio({
      opportunities: [
        opp({ id: 'o1', title: 'ZZZolder', createdAt: '2026-04-01T10:00:00Z' }),
        opp({ id: 'o2', title: 'AAAfresh', createdAt: '2026-04-20T10:00:00Z' })
      ],
      oppSort: 'newest',
      nowIso: '2026-04-21T10:00:00Z'
    });
    assert.ok(html.indexOf('AAAfresh') < html.indexOf('ZZZolder'));
  });

  test('sort="oldest" puts oldest first', () => {
    const html = Portfolio({
      opportunities: [
        opp({ id: 'o1', title: 'ZZZolder', createdAt: '2026-04-01T10:00:00Z' }),
        opp({ id: 'o2', title: 'AAAfresh', createdAt: '2026-04-20T10:00:00Z' })
      ],
      oppSort: 'oldest',
      nowIso: '2026-04-21T10:00:00Z'
    });
    assert.ok(html.indexOf('ZZZolder') < html.indexOf('AAAfresh'));
  });

  test('sort="projectType" sorts alphabetically', () => {
    const html = Portfolio({
      opportunities: [
        opp({ id: 'o1', title: 'Kaizen Event One', proposedProjectType: 'KAIZEN_EVENT' }),
        opp({ id: 'o2', title: 'DMAIC One', proposedProjectType: 'DMAIC' })
      ],
      oppSort: 'projectType'
    });
    assert.ok(html.indexOf('DMAIC One') < html.indexOf('Kaizen Event One'));
  });

  test('invalid filter value falls back to all', () => {
    const html = Portfolio({
      opportunities: [opp({ title: 'Visible' })],
      oppFilter: 'bogus'
    });
    assert.match(html, /Visible/);
  });
});

describe('Portfolio — expanded opportunity', () => {
  test('expandedOpportunityId=o1 expands matching row', () => {
    const html = Portfolio({
      opportunities: [opp({ id: 'o1', scope: 'Specific scope' })],
      expandedOpportunityId: 'o1'
    });
    assert.match(html, /opp-row-expanded/);
    assert.match(html, /Specific scope/);
  });

  test('no expanded panel without matching id', () => {
    const html = Portfolio({
      opportunities: [opp({ id: 'o1' })]
    });
    assert.ok(!html.includes('opp-row-expanded'));
  });
});

describe('Portfolio — intake modal overlay', () => {
  test('intakeForm=null → no modal', () => {
    const html = Portfolio({ intakeForm: null });
    assert.ok(!html.includes('oif-modal'));
  });

  test('intakeForm=truthy → shows OpportunityIntakeForm', () => {
    const html = Portfolio({ intakeForm: { title: '', problemStatement: '' } });
    assert.match(html, /oif-modal/);
    assert.match(html, /data-action="OPP_SUBMIT_INTAKE"/);
  });
});

describe('Portfolio — Standard Work Catalog section', () => {
  function catEntry(overrides = {}) {
    return {
      id: 'cat_1',
      activityNumber: 1,
      name: 'Sample',
      bucket: 'PROJECT',
      isNonOptional: false,
      enabledByUser: true,
      dependsOn: [],
      ...overrides
    };
  }

  test('catalog section embeds the CatalogBucketView', () => {
    const html = Portfolio({
      catalogEntries: [catEntry()]
    });
    assert.match(html, /cat-bucket-view/);
  });

  test('catalog entries flow into the column', () => {
    const html = Portfolio({
      catalogEntries: [
        catEntry({ id: 'a', bucket: 'PROJECT' }),
        catEntry({ id: 'b', bucket: 'COMMUNICATION' }),
        catEntry({ id: 'c', bucket: 'CI' })
      ]
    });
    assert.match(html, /data-bucket-count="PROJECT">\(1\)/);
    assert.match(html, /data-bucket-count="COMMUNICATION">\(1\)/);
    assert.match(html, /data-bucket-count="CI">\(1\)/);
  });
});

describe('Portfolio — exported constants', () => {
  test('PORTFOLIO_COPY has title/new-opp strings', () => {
    assert.ok(PORTFOLIO_COPY.TITLE);
    assert.ok(PORTFOLIO_COPY.NEW_OPP);
    assert.ok(PORTFOLIO_COPY.ACTIVE_EMPTY);
    assert.ok(PORTFOLIO_COPY.OPPORTUNITIES_EMPTY);
  });

  test('OPP_FILTER_VALUES includes all 5 statuses + all', () => {
    assert.ok(OPP_FILTER_VALUES.includes('all'));
    for (const s of ['INTAKE', 'SCORED', 'PROMOTED', 'DEFERRED', 'REJECTED']) {
      assert.ok(OPP_FILTER_VALUES.includes(s));
    }
  });

  test('OPP_SORT_VALUES covers newest / oldest / projectType', () => {
    assert.deepEqual([...OPP_SORT_VALUES].sort(), [
      'newest',
      'oldest',
      'projectType'
    ]);
  });
});
