/**
 * Tests for EditDrawer component (Sprint 12 Pass 12b).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { EditDrawer } from '../../../js/ui/components/EditDrawer.js';

function mkEntry(overrides = {}) {
  return {
    id: 'cat_x',
    name: 'X Activity',
    bucket: 'PROJECT',
    defaultDurationMinutes: 60,
    cadence: 'WEEKLY',
    enabledByUser: true,
    activityNumber: 10,
    projectTypeBinding: null,
    ...overrides
  };
}

function mkActivity(overrides = {}) {
  return {
    id: 'sa_1',
    catalogEntryId: 'cat_existing',
    name: 'Existing',
    bucket: 'PROJECT',
    plannedDurationMinutes: 60,
    state: 'PROPOSED',
    ...overrides
  };
}

const CATALOG = [
  mkEntry({ id: 'cat_ci_1', name: 'L&D', bucket: 'CI', activityNumber: 1 }),
  mkEntry({
    id: 'cat_ci_2',
    name: 'PDCA Cycle',
    bucket: 'CI',
    activityNumber: 12,
    defaultDurationMinutes: 30
  }),
  mkEntry({
    id: 'cat_comm_1',
    name: 'Team meetings',
    bucket: 'COMMUNICATION',
    activityNumber: 15,
    defaultDurationMinutes: 45
  }),
  mkEntry({
    id: 'cat_comm_2',
    name: '1:1 with teammates',
    bucket: 'COMMUNICATION',
    activityNumber: 16,
    defaultDurationMinutes: 30
  }),
  mkEntry({
    id: 'cat_proj_1',
    name: 'Generic Deep',
    bucket: 'PROJECT',
    activityNumber: null,
    defaultDurationMinutes: 120,
    projectTypeBinding: null
  }),
  mkEntry({
    id: 'cat_proj_dmaic',
    name: 'C&E Matrix',
    bucket: 'PROJECT',
    activityNumber: 34,
    defaultDurationMinutes: 60,
    projectTypeBinding: 'DMAIC'
  }),
  mkEntry({
    id: 'cat_proj_accelerator',
    name: 'Accelerator kickoff',
    bucket: 'PROJECT',
    activityNumber: 50,
    defaultDurationMinutes: 90,
    projectTypeBinding: ['KAIZEN_ACCELERATOR_30D']
  })
];

describe('EditDrawer — structural contract', () => {
  test('renders a drawer with role="dialog"', () => {
    const html = EditDrawer({ catalog: CATALOG });
    assert.match(html, /class="edit-drawer edit-drawer-open"/);
    assert.match(html, /role="dialog"/);
  });

  test('renders a dismiss × that wires EDIT_CANCEL', () => {
    const html = EditDrawer({ catalog: CATALOG });
    assert.match(html, /edit-drawer-dismiss/);
    assert.match(html, /data-action="EDIT_CANCEL"/);
  });

  test('renders a search input wired to EDIT_SEARCH', () => {
    const html = EditDrawer({ catalog: CATALOG });
    assert.match(html, /class="edit-search-input"/);
    assert.match(html, /data-action="EDIT_SEARCH"/);
  });

  test('renders 3 bucket cards (PROJECT, COMMUNICATION, CI)', () => {
    const html = EditDrawer({ catalog: CATALOG });
    assert.match(html, /data-bucket="PROJECT"/);
    assert.match(html, /data-bucket="COMMUNICATION"/);
    assert.match(html, /data-bucket="CI"/);
  });

  test('renders sticky footer with Commit / Cancel / Undo / Add', () => {
    const html = EditDrawer({ catalog: CATALOG });
    assert.match(html, /class="edit-drawer-footer"/);
    assert.match(html, /data-action="EDIT_COMMIT"/);
    assert.match(html, /data-action="EDIT_CANCEL"/);
    assert.match(html, /data-action="EDIT_UNDO"/);
    assert.match(html, /data-action="EDIT_ADD_SLOT"/);
  });

  test('Undo button is disabled when undoCount is 0', () => {
    const html = EditDrawer({ catalog: CATALOG, undoCount: 0 });
    assert.match(html, /data-action="EDIT_UNDO"[^>]*disabled/);
  });

  test('Undo button is enabled when undoCount is > 0', () => {
    const html = EditDrawer({ catalog: CATALOG, undoCount: 3 });
    const idx = html.indexOf('data-action="EDIT_UNDO"');
    const chunk = html.slice(idx, idx + 120);
    assert.equal(chunk.includes('disabled'), false);
    assert.match(html, /Undo \(3\)/);
  });
});

describe('EditDrawer — bucket expand/collapse', () => {
  test('collapsed buckets hide their catalog list', () => {
    const html = EditDrawer({ catalog: CATALOG, expandedBuckets: [] });
    // Each bucket shows the header, but the body ul should not render.
    assert.equal(html.includes('edit-catalog-list'), false);
  });

  test('expanding PROJECT shows its entries', () => {
    const html = EditDrawer({ catalog: CATALOG, expandedBuckets: ['PROJECT'] });
    assert.match(html, /edit-catalog-list/);
    assert.match(html, /data-catalog-entry-id="cat_proj_1"/);
    assert.match(html, /data-catalog-entry-id="cat_proj_dmaic"/);
  });

  test('expanding CI shows only CI entries in its panel', () => {
    const html = EditDrawer({ catalog: CATALOG, expandedBuckets: ['CI'] });
    // CI entries present
    assert.match(html, /data-catalog-entry-id="cat_ci_1"/);
    assert.match(html, /data-catalog-entry-id="cat_ci_2"/);
    // PROJECT entries NOT present (bucket collapsed)
    assert.equal(html.includes('data-catalog-entry-id="cat_proj_1"'), false);
  });

  test('bucket header button has correct aria-expanded', () => {
    const html = EditDrawer({ catalog: CATALOG, expandedBuckets: ['CI'] });
    assert.match(html, /aria-expanded="true"[^>]*>[^<]*<span class="edit-bucket-chevron">▾/);
  });
});

describe('EditDrawer — project-type filter', () => {
  test('filter pill row renders only when PROJECT panel is expanded', () => {
    const collapsed = EditDrawer({ catalog: CATALOG, expandedBuckets: [] });
    assert.equal(collapsed.includes('edit-pt-filter'), false);
    const expanded = EditDrawer({ catalog: CATALOG, expandedBuckets: ['PROJECT'] });
    assert.match(expanded, /class="edit-pt-filter"/);
  });

  test('filter pills carry EDIT_PROJECT_TYPE_FILTER action', () => {
    const html = EditDrawer({ catalog: CATALOG, expandedBuckets: ['PROJECT'] });
    assert.match(html, /data-action="EDIT_PROJECT_TYPE_FILTER"/);
  });

  test('filter narrows PROJECT entries when set to DMAIC', () => {
    const html = EditDrawer({
      catalog: CATALOG,
      expandedBuckets: ['PROJECT'],
      projectTypeFilter: 'DMAIC'
    });
    assert.match(html, /data-catalog-entry-id="cat_proj_dmaic"/);
    assert.equal(html.includes('data-catalog-entry-id="cat_proj_1"'), false);
    assert.equal(html.includes('data-catalog-entry-id="cat_proj_accelerator"'), false);
  });

  test('AD_HOC filter returns null-binding PROJECT entries only', () => {
    const html = EditDrawer({
      catalog: CATALOG,
      expandedBuckets: ['PROJECT'],
      projectTypeFilter: 'AD_HOC'
    });
    assert.match(html, /data-catalog-entry-id="cat_proj_1"/);
    assert.equal(html.includes('data-catalog-entry-id="cat_proj_dmaic"'), false);
  });

  test('current filter pill is marked .active', () => {
    const html = EditDrawer({
      catalog: CATALOG,
      expandedBuckets: ['PROJECT'],
      projectTypeFilter: 'DMAIC'
    });
    // Locate the DMAIC pill and verify it has the "active" class.
    const dmaicIdx = html.indexOf('projectType&quot;:&quot;DMAIC');
    assert.ok(dmaicIdx > 0, 'DMAIC pill not rendered');
    // Walk backwards to the preceding class="..." for this pill.
    const preceding = html.slice(Math.max(0, dmaicIdx - 200), dmaicIdx);
    assert.match(preceding, /edit-pt-pill active/);
  });
});

describe('EditDrawer — search', () => {
  test('search narrows entries by name', () => {
    const html = EditDrawer({
      catalog: CATALOG,
      expandedBuckets: ['PROJECT', 'COMMUNICATION', 'CI'],
      search: 'pdca'
    });
    assert.match(html, /data-catalog-entry-id="cat_ci_2"/);
    assert.equal(html.includes('data-catalog-entry-id="cat_ci_1"'), false);
  });

  test('empty search shows all enabled entries', () => {
    const html = EditDrawer({
      catalog: CATALOG,
      expandedBuckets: ['PROJECT', 'COMMUNICATION', 'CI']
    });
    for (const e of CATALOG) {
      assert.match(html, new RegExp(`data-catalog-entry-id="${e.id}"`));
    }
  });

  test('search input keeps the current value', () => {
    const html = EditDrawer({
      catalog: CATALOG,
      search: 'team'
    });
    assert.match(html, /value="team"/);
  });
});

describe('EditDrawer — "In today" badge', () => {
  test('shows In today for any catalog entry currently in activities', () => {
    const acts = [
      mkActivity({ catalogEntryId: 'cat_ci_1', bucket: 'CI' })
    ];
    const html = EditDrawer({
      catalog: CATALOG,
      activities: acts,
      expandedBuckets: ['PROJECT', 'COMMUNICATION', 'CI']
    });
    // The CI-1 card should have the badge
    const card = html.slice(html.indexOf('cat_ci_1') - 10);
    const end = card.indexOf('</li>');
    const chunk = card.slice(0, end + 5);
    assert.match(chunk, /edc-in-today/);
  });

  test('no badge when entry is not in today', () => {
    const acts = [mkActivity({ catalogEntryId: 'cat_other' })];
    const html = EditDrawer({
      catalog: [mkEntry({ id: 'cat_proj_1', bucket: 'PROJECT' })],
      activities: acts,
      expandedBuckets: ['PROJECT']
    });
    assert.equal(html.includes('edc-in-today'), false);
  });
});

describe('EditDrawer — duration delta chip', () => {
  test('no delta chip when no slot is selected', () => {
    const html = EditDrawer({
      catalog: CATALOG,
      expandedBuckets: ['PROJECT']
    });
    assert.equal(html.includes('edc-delta'), false);
  });

  test('shows +delta when swap would add minutes', () => {
    const activities = [
      mkActivity({ id: 'sa_sel', bucket: 'PROJECT', plannedDurationMinutes: 30 })
    ];
    const html = EditDrawer({
      catalog: [mkEntry({ id: 'cat_big', bucket: 'PROJECT', defaultDurationMinutes: 90 })],
      activities,
      selectedActivityId: 'sa_sel',
      expandedBuckets: ['PROJECT']
    });
    assert.match(html, /edc-delta edc-delta-plus/);
    assert.match(html, /\+60m/);
  });

  test('shows -delta when swap would shrink minutes', () => {
    const activities = [
      mkActivity({ id: 'sa_sel', bucket: 'PROJECT', plannedDurationMinutes: 90 })
    ];
    const html = EditDrawer({
      catalog: [mkEntry({ id: 'cat_small', bucket: 'PROJECT', defaultDurationMinutes: 30 })],
      activities,
      selectedActivityId: 'sa_sel',
      expandedBuckets: ['PROJECT']
    });
    assert.match(html, /edc-delta edc-delta-minus/);
    // 30 − 90 = −60
    assert.match(html, /-60m/);
  });
});

describe('EditDrawer — header messaging', () => {
  test('default subtitle when no slot selected', () => {
    const html = EditDrawer({ catalog: CATALOG });
    assert.match(html, /Pick a slot, then tap a card to swap/);
  });

  test('subtitle mentions the selected slot name', () => {
    const activities = [
      mkActivity({ id: 'sa_abc', name: 'Deep Focus Session' })
    ];
    const html = EditDrawer({
      catalog: CATALOG,
      activities,
      selectedActivityId: 'sa_abc'
    });
    // esc() html-escapes the embedded quotes; match the escaped form.
    assert.match(html, /Swap &quot;Deep Focus Session&quot; with/);
  });

  test("__new__ selector renders 'pick a card to add' subtitle", () => {
    const html = EditDrawer({
      catalog: CATALOG,
      selectedActivityId: '__new__'
    });
    assert.match(html, /Pick a card to add it to your schedule/);
  });
});

describe('EditDrawer — violations highlight', () => {
  test('PROJECT UNDER_FLOOR adds edit-bucket-violated class to PROJECT row', () => {
    const html = EditDrawer({
      catalog: CATALOG,
      violations: [{ bucket: 'PROJECT', code: 'UNDER_FLOOR', actual: 60, bound: 120 }]
    });
    assert.match(html, /edit-bucket-project[^"]*edit-bucket-violated/);
  });

  test('no violations → no violated class anywhere', () => {
    const html = EditDrawer({ catalog: CATALOG, violations: [] });
    assert.equal(html.includes('edit-bucket-violated'), false);
  });
});

describe('EditDrawer — count badges', () => {
  test('bucket count reflects filtered entry count', () => {
    const html = EditDrawer({ catalog: CATALOG, expandedBuckets: ['CI'] });
    // CI has 2 entries
    assert.match(html, /data-bucket="CI"[^<]*<button[\s\S]*?\(2\)/);
  });

  test('CI shows (0) when no CI entries', () => {
    const projOnly = [CATALOG[4]]; // just one PROJECT entry
    const html = EditDrawer({ catalog: projOnly, expandedBuckets: ['CI'] });
    assert.match(html, /data-bucket="CI"[\s\S]*?\(0\)/);
  });
});

describe('EditDrawer — sort order within bucket', () => {
  test('entries are sorted by activityNumber asc then name asc', () => {
    const html = EditDrawer({ catalog: CATALOG, expandedBuckets: ['CI'] });
    const idx1 = html.indexOf('cat_ci_1'); // num=1
    const idx12 = html.indexOf('cat_ci_2'); // num=12
    assert.ok(idx1 < idx12);
  });
});

describe('EditDrawer — empty state', () => {
  test('shows "No matching entries." when bucket is empty after filtering', () => {
    const html = EditDrawer({
      catalog: CATALOG,
      expandedBuckets: ['CI'],
      search: 'nonexistent-token-abc123'
    });
    assert.match(html, /No matching entries/);
  });
});
