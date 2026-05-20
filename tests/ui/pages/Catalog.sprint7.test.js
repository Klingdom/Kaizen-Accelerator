/**
 * Tests for Catalog page (Sprint 7 P0-T7 extension — bucket view).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  Catalog,
  CATALOG_COPY,
  CATALOG_VIEW_LIST,
  CATALOG_VIEW_BUCKET
} from '../../../js/ui/pages/Catalog.js';

function entry(overrides = {}) {
  return {
    id: 'cat_1',
    activityNumber: 1,
    name: 'Entry',
    bucket: 'PROJECT',
    isNonOptional: false,
    enabledByUser: true,
    dependsOn: [],
    ...overrides
  };
}

describe('Catalog — view toggle', () => {
  test('renders list view by default', () => {
    const html = Catalog({ entries: [entry()] });
    assert.match(html, /data-view="list"/);
    // List view renders <ul class="cat-list">
    assert.match(html, /class="cat-list"/);
  });

  test('view="bucket" renders CatalogBucketView', () => {
    const html = Catalog({ entries: [entry()], view: 'bucket' });
    assert.match(html, /data-view="bucket"/);
    assert.match(html, /cat-bucket-view/);
  });

  test('invalid view falls back to list', () => {
    const html = Catalog({ entries: [entry()], view: 'nope' });
    assert.match(html, /data-view="list"/);
  });

  test('view toggle buttons present', () => {
    const html = Catalog();
    assert.match(html, /data-action="CATALOG_SET_VIEW"/);
    assert.match(html, new RegExp(CATALOG_COPY.VIEW_LIST));
    assert.match(html, new RegExp(CATALOG_COPY.VIEW_BUCKET));
  });

  test('active view button has cat-view-active class', () => {
    const listHtml = Catalog({ view: 'list' });
    const bucketHtml = Catalog({ view: 'bucket' });
    // Check aria-pressed is true for active
    assert.match(listHtml, /aria-pressed="true"[^>]*>.*List view/);
    assert.match(bucketHtml, /aria-pressed="true"[^>]*>.*By bucket/);
  });
});

describe('Catalog — list view', () => {
  test('renders empty state when entries empty', () => {
    const html = Catalog({ entries: [] });
    assert.match(html, new RegExp(CATALOG_COPY.EMPTY));
  });

  test('shows activity number in list row', () => {
    const html = Catalog({ entries: [entry({ activityNumber: 42 })] });
    assert.match(html, /#42/);
  });

  test('lock icon shown for non-optional', () => {
    const html = Catalog({ entries: [entry({ isNonOptional: true })] });
    assert.match(html, /🔒/);
  });

  test('toggle disabled for non-optional', () => {
    const html = Catalog({ entries: [entry({ isNonOptional: true })] });
    assert.match(html, /cat-list-toggle[^>]*disabled/);
  });

  test('sorts by activityNumber', () => {
    const html = Catalog({
      entries: [
        entry({ id: 'a', activityNumber: 5, name: 'Bravo' }),
        entry({ id: 'b', activityNumber: 2, name: 'Alpha' })
      ]
    });
    assert.ok(html.indexOf('Alpha') < html.indexOf('Bravo'));
  });
});

describe('Catalog — bucket view preserves functionality', () => {
  test('bucket view renders all 3 buckets', () => {
    const html = Catalog({
      entries: [
        entry({ id: 'a', bucket: 'PROJECT' }),
        entry({ id: 'b', bucket: 'COMMUNICATION' }),
        entry({ id: 'c', bucket: 'CI' })
      ],
      view: 'bucket'
    });
    assert.match(html, /data-bucket="PROJECT"/);
    assert.match(html, /data-bucket="COMMUNICATION"/);
    assert.match(html, /data-bucket="CI"/);
  });

  test('toggle preserved across view switch (Sprint 7 P0-T7 requirement)', () => {
    const listHtml = Catalog({
      entries: [entry({ enabledByUser: false })]
    });
    const bucketHtml = Catalog({
      entries: [entry({ enabledByUser: false })],
      view: 'bucket'
    });
    // Both views expose the CATALOG_TOGGLE action.
    assert.match(listHtml, /data-action="CATALOG_TOGGLE"/);
    assert.match(bucketHtml, /data-action="CATALOG_TOGGLE"/);
    // Both views reflect the disabled state (Off).
    assert.match(listHtml, /Off/);
    assert.match(bucketHtml, /Off/);
  });
});

describe('Catalog — bucket count accuracy against full 71-entry seed (Phase 1: +4 convergent Tier 1; Phase 2: +6 lens-unique Tier 1)', () => {
  // Defensive test — uses the actual seed pipeline to verify no silent
  // bucket mapping drift per Sprint 7 hard rule.
  test('seeded catalog has 71 entries total (Iter 26: +1 recovery_lunch; Phase 1: +4; Phase 2: +6)', async () => {
    const { buildCatalog } = await import('../../../js/catalog/seed/index.js');
    const cat = buildCatalog();
    assert.equal(cat.length, 71);
  });

  test('bucket counts for PROJECT/COMMUNICATION/CI sum to 70 (recovery_lunch excluded — bucket null)', async () => {
    const { buildCatalog } = await import('../../../js/catalog/seed/index.js');
    const cat = buildCatalog();
    const counts = { PROJECT: 0, COMMUNICATION: 0, CI: 0 };
    for (const e of cat) {
      // Iter 26: recovery_lunch has bucket===null — skip it in bucket sum.
      if (e.bucket === null || e.bucket === undefined) continue;
      if (counts[e.bucket] === undefined) {
        throw new Error(`unknown bucket: ${e.bucket}`);
      }
      counts[e.bucket] += 1;
    }
    assert.equal(counts.PROJECT + counts.COMMUNICATION + counts.CI, 70);
    assert.ok(counts.PROJECT > 0);
    assert.ok(counts.COMMUNICATION > 0);
    assert.ok(counts.CI > 0);
  });

  test('bucket view column counts match seeded bucket counts', async () => {
    const { buildCatalog } = await import('../../../js/catalog/seed/index.js');
    const cat = buildCatalog();
    const counts = { PROJECT: 0, COMMUNICATION: 0, CI: 0 };
    for (const e of cat) counts[e.bucket] += 1;
    const html = Catalog({ entries: cat, view: 'bucket' });
    assert.match(html, new RegExp(`data-bucket-count="PROJECT">\\(${counts.PROJECT}\\)`));
    assert.match(html, new RegExp(`data-bucket-count="COMMUNICATION">\\(${counts.COMMUNICATION}\\)`));
    assert.match(html, new RegExp(`data-bucket-count="CI">\\(${counts.CI}\\)`));
  });
});

describe('Catalog — exported constants', () => {
  test('CATALOG_VIEW_LIST / CATALOG_VIEW_BUCKET exported', () => {
    assert.equal(CATALOG_VIEW_LIST, 'list');
    assert.equal(CATALOG_VIEW_BUCKET, 'bucket');
  });

  test('CATALOG_COPY populated', () => {
    assert.ok(CATALOG_COPY.TITLE);
    assert.ok(CATALOG_COPY.EMPTY);
    assert.ok(CATALOG_COPY.VIEW_LIST);
    assert.ok(CATALOG_COPY.VIEW_BUCKET);
  });
});
