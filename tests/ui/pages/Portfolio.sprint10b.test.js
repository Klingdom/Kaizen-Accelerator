/**
 * Sprint 10b Pass A — Portfolio restructure tests.
 *
 * Verifies:
 *   - Catalog section removed from Portfolio
 *   - "Projects" section heading (renamed from "Active Kaizens")
 *   - Project-type sub-buckets preserved (Sprint 10a parity)
 *   - `expandedKaizenId` prop drives exactly one expanded card
 *   - `completedStepsByKaizenId` prop feeds into KaizenCard
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  Portfolio,
  PORTFOLIO_COPY,
  PROJECT_TYPE_GROUPS,
  resolveProjectTypeGroup
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

function catEntry(overrides = {}) {
  return {
    id: 'cat_1',
    activityNumber: 1,
    name: 'Sample',
    bucket: 'PROJECT',
    isNonOptional: false,
    enabledByUser: true,
    dependsOn: [],
    projectTypeBinding: null,
    ...overrides
  };
}

describe('Portfolio — Sprint 10b (catalog removed)', () => {
  test('Catalog section NOT rendered when no kaizens', () => {
    const html = Portfolio();
    assert.ok(!html.includes('pf-catalog'), 'pf-catalog should not appear');
    assert.ok(!html.includes('cat-bucket-view'), 'CatalogBucketView should not be mounted');
  });

  test('Catalog section NOT rendered with catalog entries present', () => {
    const html = Portfolio({
      catalogEntries: [catEntry({ id: 'a' }), catEntry({ id: 'b' })]
    });
    assert.ok(!html.includes('pf-catalog'));
    assert.ok(!html.includes('cat-bucket-view'));
  });

  test('Catalog section missing with a full kaizen + catalog', () => {
    const html = Portfolio({
      activeKaizens: [kaizenActive()],
      catalogEntries: [catEntry()]
    });
    assert.ok(!html.includes('pf-catalog'));
  });
});

describe('Portfolio — Sprint 10b (Projects section heading)', () => {
  test('Heading reads "Projects" with no kaizens', () => {
    const html = Portfolio();
    assert.match(html, /<h2 class="pf-section-title">Projects<\/h2>/);
  });

  test('Heading reads "Projects (N)" when kaizens present', () => {
    const html = Portfolio({
      activeKaizens: [kaizenActive({ id: 'k_a' }), kaizenActive({ id: 'k_b' })]
    });
    assert.match(html, /Projects \(2\)/);
  });

  test('Empty copy references projects, not active kaizens', () => {
    const html = Portfolio();
    assert.match(html, /No projects yet/);
    assert.match(html, /Promote an opportunity to start a project/);
  });

  test('PORTFOLIO_COPY.ACTIVE_EMPTY uses "projects" wording', () => {
    assert.match(PORTFOLIO_COPY.ACTIVE_EMPTY, /No projects yet/);
  });
});

describe('Portfolio — Sprint 10b project-type sub-buckets', () => {
  test('renders 4 sub-buckets when kaizens of each type exist', () => {
    const html = Portfolio({
      activeKaizens: [
        kaizenActive({ id: 'k_acc', projectType: 'KAIZEN_ACCELERATOR_30D' }),
        kaizenActive({ id: 'k_90', projectType: 'KAIZEN_EVENT_90D' }),
        kaizenActive({ id: 'k_dm', projectType: 'DMAIC' }),
        kaizenActive({ id: 'k_ah', projectType: 'AD_HOC' })
      ]
    });
    for (const g of PROJECT_TYPE_GROUPS) {
      assert.match(html, new RegExp(`data-project-type="${g.key}"`));
    }
  });

  test('sub-buckets rendered in order: 30D, 90D, DMAIC, AD_HOC', () => {
    const html = Portfolio({
      activeKaizens: [
        kaizenActive({ id: 'k_ah', projectType: 'AD_HOC' }),
        kaizenActive({ id: 'k_dm', projectType: 'DMAIC' }),
        kaizenActive({ id: 'k_90', projectType: 'KAIZEN_EVENT_90D' }),
        kaizenActive({ id: 'k_acc', projectType: 'KAIZEN_ACCELERATOR_30D' })
      ]
    });
    const iAcc = html.indexOf('data-project-type="KAIZEN_ACCELERATOR_30D"');
    const i90 = html.indexOf('data-project-type="KAIZEN_EVENT_90D"');
    const iDm = html.indexOf('data-project-type="DMAIC"');
    const iAh = html.indexOf('data-project-type="AD_HOC"');
    assert.ok(iAcc >= 0 && i90 > iAcc && iDm > i90 && iAh > iDm);
  });

  test('empty sub-buckets not rendered (only non-empty groups)', () => {
    const html = Portfolio({
      activeKaizens: [kaizenActive({ projectType: 'DMAIC' })]
    });
    assert.match(html, /data-project-type="DMAIC"/);
    assert.ok(!html.includes('data-project-type="KAIZEN_ACCELERATOR_30D"'));
    assert.ok(!html.includes('data-project-type="AD_HOC"'));
  });

  test('legacy KAIZEN_EVENT routed to KAIZEN_EVENT_90D group', () => {
    const html = Portfolio({
      activeKaizens: [kaizenActive({ projectType: 'KAIZEN_EVENT' })]
    });
    assert.match(html, /data-project-type="KAIZEN_EVENT_90D"/);
  });

  test('resolveProjectTypeGroup falls back to AD_HOC for unknown', () => {
    assert.equal(resolveProjectTypeGroup({ projectType: 'UNKNOWN' }), 'AD_HOC');
    assert.equal(resolveProjectTypeGroup({}), 'AD_HOC');
    assert.equal(resolveProjectTypeGroup(null), 'AD_HOC');
  });
});

describe('Portfolio — Sprint 10b expandedKaizenId drives isExpanded', () => {
  test('no expandedKaizenId → no card expanded', () => {
    const html = Portfolio({
      activeKaizens: [kaizenActive()]
    });
    assert.ok(!html.includes('data-expanded="true"'));
  });

  test('matching expandedKaizenId expands exactly one card', () => {
    const html = Portfolio({
      activeKaizens: [
        kaizenActive({ id: 'k_a' }),
        kaizenActive({ id: 'k_b' })
      ],
      expandedKaizenId: 'k_a'
    });
    const matches = html.match(/data-expanded="true"/g) ?? [];
    assert.equal(matches.length, 1);
    assert.match(html, /data-kaizen-id="k_a" data-state="ACTIVE" data-expanded="true"/);
  });

  test('non-matching expandedKaizenId → no expansion', () => {
    const html = Portfolio({
      activeKaizens: [kaizenActive({ id: 'k_a' })],
      expandedKaizenId: 'k_xxx'
    });
    assert.ok(!html.includes('data-expanded="true"'));
  });

  test('expandedKaizenId null → no expansion', () => {
    const html = Portfolio({
      activeKaizens: [kaizenActive()],
      expandedKaizenId: null
    });
    assert.ok(!html.includes('data-expanded="true"'));
  });
});

describe('Portfolio — Sprint 10b section order remains opportunities → validated', () => {
  test('Projects section comes BEFORE Opportunities', () => {
    const html = Portfolio({
      activeKaizens: [kaizenActive()],
      opportunities: [
        {
          id: 'o_1',
          userId: 'u_1',
          title: 'Opp',
          problemStatement: 'x',
          scope: null,
          proposedProjectType: 'AD_HOC',
          status: 'INTAKE',
          createdAt: '2026-04-15T10:00:00Z',
          updatedAt: '2026-04-15T10:00:00Z'
        }
      ]
    });
    const iProj = html.indexOf('pf-active-kaizens');
    const iOpp = html.indexOf('pf-opportunities');
    assert.ok(iProj >= 0);
    assert.ok(iOpp > iProj);
  });

  test('Opportunities section comes BEFORE Validated Kaizens', () => {
    const html = Portfolio({
      closedKaizens: [
        {
          id: 'k_c',
          title: 'Closed K',
          state: 'CLOSED',
          closeKind: 'SUCCESS',
          closedAt: '2026-04-30T10:00:00Z'
        }
      ]
    });
    const iOpp = html.indexOf('pf-opportunities');
    const iVal = html.indexOf('pf-validated-kaizens');
    assert.ok(iOpp >= 0);
    assert.ok(iVal > iOpp);
  });
});

describe('Portfolio — completedStepsByKaizenId prop threading', () => {
  test('passes completed ids into KaizenCard via prop', () => {
    const html = Portfolio({
      activeKaizens: [kaizenActive({ projectType: 'DMAIC' })],
      catalogEntries: [
        catEntry({ id: 'cat_20', activityNumber: 20, name: 'DMAIC Charter', projectTypeBinding: 'DMAIC' }),
        catEntry({ id: 'cat_21', activityNumber: 21, name: 'SIPOC', projectTypeBinding: 'DMAIC' })
      ],
      expandedKaizenId: 'k_1',
      completedStepsByKaizenId: {
        k_1: [
          {
            id: 'ksp_1',
            kaizenId: 'k_1',
            catalogEntryId: 'cat_20',
            userId: 'u_1',
            completedAt: '2026-04-22T10:00:00Z',
            sourceKind: 'portfolio',
            sourceId: null
          }
        ]
      }
    });
    // The done row should render with the timestamp.
    assert.match(html, /data-catalog-entry-id="cat_20"/);
    assert.match(html, /data-step-status="done"/);
    assert.match(html, /2026-04-22T10:00:00Z/);
  });

  test('no completedStepsByKaizenId → first step is "current"', () => {
    const html = Portfolio({
      activeKaizens: [kaizenActive({ projectType: 'DMAIC' })],
      catalogEntries: [
        catEntry({ id: 'cat_20', activityNumber: 20, projectTypeBinding: 'DMAIC' })
      ],
      expandedKaizenId: 'k_1'
    });
    assert.match(html, /data-step-status="current"/);
  });
});
