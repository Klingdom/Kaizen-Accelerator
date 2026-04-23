/**
 * Sprint 10b Pass C — Catalog is the sole catalog surface.
 *
 * Verifies:
 *   - Portfolio NEVER renders CatalogBucketView markup
 *   - Catalog page DOES render CatalogBucketView (when bucket view selected)
 *   - AppShell nav still exposes /#catalog as a primary route
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { Portfolio } from '../../js/ui/pages/Portfolio.js';
import { Catalog, CATALOG_VIEW_BUCKET } from '../../js/ui/pages/Catalog.js';
import { AppShell } from '../../js/ui/AppShell.js';

function catEntry(overrides = {}) {
  return {
    id: 'cat_1',
    activityNumber: 1,
    name: 'Demo',
    bucket: 'PROJECT',
    dependsOn: [],
    projectTypeBinding: null,
    enabledByUser: true,
    isNonOptional: false,
    ...overrides
  };
}

function kaizenActive(overrides = {}) {
  return {
    id: 'k_1',
    userId: 'u_1',
    title: 'Some K',
    state: 'ACTIVE',
    projectType: 'DMAIC',
    problemStatement: 'p',
    goalStatement: 'g',
    actions: [],
    sourceFrictionSignalIds: [],
    baselineMetricId: 'bm_1',
    abandoned: false,
    ...overrides
  };
}

describe('Portfolio — no CatalogBucketView markup', () => {
  test('empty portfolio has no cat-bucket-view', () => {
    const html = Portfolio();
    assert.ok(!html.includes('cat-bucket-view'));
  });

  test('portfolio with 1 kaizen + full catalog still has no cat-bucket-view', () => {
    const html = Portfolio({
      activeKaizens: [kaizenActive()],
      catalogEntries: [
        catEntry({ id: 'a', bucket: 'PROJECT' }),
        catEntry({ id: 'b', bucket: 'COMMUNICATION' }),
        catEntry({ id: 'c', bucket: 'CI' })
      ]
    });
    assert.ok(!html.includes('cat-bucket-view'));
  });

  test('portfolio with opportunities still has no cat-bucket-view', () => {
    const html = Portfolio({
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
      ],
      catalogEntries: [catEntry()]
    });
    assert.ok(!html.includes('cat-bucket-view'));
    assert.ok(!html.includes('pf-catalog'));
  });
});

describe('Catalog page — CatalogBucketView is present when selected', () => {
  test('by-bucket view renders cat-bucket-view markup', () => {
    const html = Catalog({
      entries: [
        catEntry({ id: 'a', bucket: 'PROJECT' }),
        catEntry({ id: 'b', bucket: 'COMMUNICATION' })
      ],
      view: CATALOG_VIEW_BUCKET
    });
    assert.match(html, /cat-bucket-view/);
  });

  test('Catalog page has data-route="catalog"', () => {
    const html = Catalog({ entries: [], view: CATALOG_VIEW_BUCKET });
    assert.match(html, /data-route="catalog"/);
  });

  test('list view + bucket toggle both exist on the Catalog page', () => {
    const html = Catalog({ entries: [catEntry()], view: 'list' });
    assert.match(html, /CATALOG_SET_VIEW/);
  });
});

describe('AppShell nav — /#catalog route still exposed', () => {
  test('nav anchor for catalog route is rendered', () => {
    const html = AppShell({ route: 'today', pageHtml: '' });
    assert.match(html, /href="#catalog"/);
  });

  test('catalog nav item uses the "Catalog" label', () => {
    const html = AppShell({ route: 'today', pageHtml: '' });
    assert.match(html, />Catalog</);
  });

  test('route=catalog highlights the catalog nav item as active', () => {
    const html = AppShell({ route: 'catalog', pageHtml: '' });
    assert.match(html, /href="#catalog"[^>]*class="nav-item active"/);
  });
});

describe('Integration: Portfolio ↔ Catalog separation', () => {
  test('pf-catalog selector exists ONLY on Catalog page, not Portfolio', () => {
    const pfHtml = Portfolio({
      activeKaizens: [kaizenActive()],
      catalogEntries: [catEntry()]
    });
    assert.ok(!pfHtml.includes('pf-catalog'));
    // Catalog page uses cat-page / cat-bucket-view; no pf-catalog leak.
    const catHtml = Catalog({ entries: [catEntry()], view: CATALOG_VIEW_BUCKET });
    assert.ok(!catHtml.includes('pf-catalog'));
    assert.match(catHtml, /cat-bucket-view/);
  });
});
