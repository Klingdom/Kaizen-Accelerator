/**
 * Sprint 10b Pass A — KaizenCard expansion + step action buttons.
 *
 * Verifies:
 *   - Collapsed card has Open toggle + current-step chip
 *   - Expanded card renders the full step list
 *   - Status pills: done / current / next / pending
 *   - Action buttons per status:
 *       done     → timestamp only
 *       current  → Complete + Schedule today + Schedule this week
 *       next     → disabled Complete + Schedule today + Schedule this week
 *       pending  → Schedule this week
 *   - Payload JSON correctness on every button
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { KaizenCard, renderStepList } from '../../../js/ui/components/KaizenCard.js';

function catEntry(overrides = {}) {
  return {
    id: 'cat_1',
    activityNumber: 1,
    name: 'Step',
    bucket: 'PROJECT',
    dependsOn: [],
    projectTypeBinding: 'DMAIC',
    ...overrides
  };
}

function activeKaizen(overrides = {}) {
  return {
    id: 'k_1',
    userId: 'u_1',
    title: 'K',
    state: 'ACTIVE',
    projectType: 'DMAIC',
    problemStatement: 'p',
    goalStatement: 'g',
    actions: [{ name: 'a', ownerRef: 'me', dueDate: '2026-04-30', doneAt: null }],
    sourceFrictionSignalIds: [],
    baselineMetricId: 'bm_1',
    abandoned: false,
    ...overrides
  };
}

function dmaic3() {
  return [
    catEntry({ id: 'cat_20', activityNumber: 20, name: 'DMAIC Charter' }),
    catEntry({ id: 'cat_21', activityNumber: 21, name: 'SIPOC' }),
    catEntry({ id: 'cat_22', activityNumber: 22, name: 'VOC' })
  ];
}

describe('KaizenCard — Sprint 10b collapsed state', () => {
  test('ACTIVE card shows Open button', () => {
    const k = activeKaizen();
    const html = KaizenCard({ kaizen: k, catalog: dmaic3(), completedCatalogIds: [] });
    assert.match(html, /data-action="PORTFOLIO_TOGGLE_KAIZEN"/);
    assert.match(html, /class="kz-toggle-open"/);
    assert.match(html, />Open</);
  });

  test('Open button payload carries kaizenId', () => {
    const k = activeKaizen({ id: 'k_abc' });
    const html = KaizenCard({ kaizen: k, catalog: dmaic3(), completedCatalogIds: [] });
    assert.match(html, /data-action="PORTFOLIO_TOGGLE_KAIZEN" data-payload='\{&quot;kaizenId&quot;:&quot;k_abc&quot;\}'/);
  });

  test('collapsed card still shows current-standard-work chip', () => {
    const k = activeKaizen();
    const html = KaizenCard({ kaizen: k, catalog: dmaic3(), completedCatalogIds: [] });
    assert.match(html, /kz-current-sw/);
    assert.match(html, /#20/);
    assert.match(html, /DMAIC Charter/);
  });

  test('collapsed card does NOT render step list', () => {
    const k = activeKaizen();
    const html = KaizenCard({ kaizen: k, catalog: dmaic3(), completedCatalogIds: [] });
    assert.ok(!html.includes('kz-step-list'));
    assert.ok(!html.includes('kz-step-rows'));
  });

  test('IN_REMEASUREMENT card also exposes Open button', () => {
    const k = activeKaizen({ state: 'IN_REMEASUREMENT' });
    const html = KaizenCard({ kaizen: k, catalog: dmaic3(), completedCatalogIds: [] });
    assert.match(html, /data-action="PORTFOLIO_TOGGLE_KAIZEN"/);
  });
});

describe('KaizenCard — Sprint 10b expanded state renders step list', () => {
  test('isExpanded=true → step list present', () => {
    const k = activeKaizen();
    const html = KaizenCard({
      kaizen: k,
      catalog: dmaic3(),
      completedCatalogIds: [],
      isExpanded: true
    });
    assert.match(html, /kz-step-list/);
    assert.match(html, /kz-step-rows/);
  });

  test('data-expanded="true" attribute set on expanded section', () => {
    const k = activeKaizen();
    const html = KaizenCard({
      kaizen: k,
      catalog: dmaic3(),
      completedCatalogIds: [],
      isExpanded: true
    });
    assert.match(html, /data-expanded="true"/);
  });

  test('expanded step count matches filtered catalog size', () => {
    const k = activeKaizen();
    const html = KaizenCard({
      kaizen: k,
      catalog: dmaic3(),
      completedCatalogIds: [],
      isExpanded: true
    });
    assert.match(html, /Standard work \(3 steps\)/);
    const rows = html.match(/class="kz-step-row /g) ?? [];
    assert.equal(rows.length, 3);
  });

  test('expanded card has Collapse footer button', () => {
    const k = activeKaizen();
    const html = KaizenCard({
      kaizen: k,
      catalog: dmaic3(),
      completedCatalogIds: [],
      isExpanded: true
    });
    assert.match(html, /class="kz-expanded-footer"/);
    assert.match(html, />Collapse</);
  });
});

describe('KaizenCard — Sprint 10b status pill classifications', () => {
  test('No completions → first = current, second = next, rest = pending', () => {
    const k = activeKaizen();
    const html = KaizenCard({
      kaizen: k,
      catalog: dmaic3(),
      completedCatalogIds: [],
      isExpanded: true
    });
    assert.match(html, /data-catalog-entry-id="cat_20" data-step-status="current"/);
    assert.match(html, /data-catalog-entry-id="cat_21" data-step-status="next"/);
    assert.match(html, /data-catalog-entry-id="cat_22" data-step-status="pending"/);
  });

  test('After completing #20 → #21 current, #22 next', () => {
    const k = activeKaizen();
    const html = KaizenCard({
      kaizen: k,
      catalog: dmaic3(),
      completedCatalogIds: ['cat_20'],
      isExpanded: true
    });
    assert.match(html, /data-catalog-entry-id="cat_20" data-step-status="done"/);
    assert.match(html, /data-catalog-entry-id="cat_21" data-step-status="current"/);
    assert.match(html, /data-catalog-entry-id="cat_22" data-step-status="next"/);
  });

  test('All completed → no current / next pill', () => {
    const k = activeKaizen();
    const html = KaizenCard({
      kaizen: k,
      catalog: dmaic3(),
      completedCatalogIds: ['cat_20', 'cat_21', 'cat_22'],
      isExpanded: true
    });
    const doneRows = html.match(/data-step-status="done"/g) ?? [];
    assert.equal(doneRows.length, 3);
    assert.ok(!html.includes('data-step-status="current"'));
  });

  test('Pill renders human labels', () => {
    const k = activeKaizen();
    // Need 4 steps to get done + current + next + pending all represented.
    const catalog4 = [
      catEntry({ id: 'cat_20', activityNumber: 20 }),
      catEntry({ id: 'cat_21', activityNumber: 21 }),
      catEntry({ id: 'cat_22', activityNumber: 22 }),
      catEntry({ id: 'cat_23', activityNumber: 23 })
    ];
    const html = KaizenCard({
      kaizen: k,
      catalog: catalog4,
      completedCatalogIds: ['cat_20'],
      isExpanded: true
    });
    assert.match(html, /kz-step-pill-done[^>]*>Done</);
    assert.match(html, /kz-step-pill-current[^>]*>Current</);
    assert.match(html, /kz-step-pill-next[^>]*>Next</);
    assert.match(html, /kz-step-pill-pending[^>]*>Pending</);
  });
});

describe('KaizenCard — Sprint 10b step timestamps on done rows', () => {
  test('done row shows completedAt timestamp when provided', () => {
    const k = activeKaizen();
    const html = KaizenCard({
      kaizen: k,
      catalog: dmaic3(),
      completedCatalogIds: ['cat_20'],
      completedStepTimestamps: { cat_20: '2026-04-22T10:30:00Z' },
      isExpanded: true
    });
    assert.match(html, /kz-step-ts">2026-04-22T10:30:00Z</);
  });

  test('done row has NO action buttons', () => {
    const k = activeKaizen();
    const html = KaizenCard({
      kaizen: k,
      catalog: dmaic3(),
      completedCatalogIds: ['cat_20'],
      completedStepTimestamps: { cat_20: '2026-04-22T10:30:00Z' },
      isExpanded: true
    });
    // Extract the done row HTML fragment.
    const m = html.match(/<li class="kz-step-row kz-step-row-done[^]*?<\/li>/);
    assert.ok(m, 'done row not found');
    assert.ok(!m[0].includes('data-action="KAIZEN_COMPLETE_STEP"'));
    assert.ok(!m[0].includes('data-action="KAIZEN_SCHEDULE_STEP_TODAY"'));
    assert.ok(!m[0].includes('data-action="KAIZEN_SCHEDULE_STEP_WEEK"'));
  });

  test('done row WITHOUT timestamp still has no action buttons', () => {
    const k = activeKaizen();
    const html = KaizenCard({
      kaizen: k,
      catalog: dmaic3(),
      completedCatalogIds: ['cat_20'],
      isExpanded: true
    });
    const m = html.match(/<li class="kz-step-row kz-step-row-done[^]*?<\/li>/);
    assert.ok(m);
    assert.ok(!m[0].includes('KAIZEN_COMPLETE_STEP'));
  });
});

describe('KaizenCard — Sprint 10b current-row action buttons', () => {
  test('current row has all 3 buttons', () => {
    const k = activeKaizen();
    const html = KaizenCard({
      kaizen: k,
      catalog: dmaic3(),
      completedCatalogIds: [],
      isExpanded: true
    });
    const m = html.match(/<li class="kz-step-row kz-step-row-current[^]*?<\/li>/);
    assert.ok(m);
    assert.match(m[0], /data-action="KAIZEN_COMPLETE_STEP"/);
    assert.match(m[0], /data-action="KAIZEN_SCHEDULE_STEP_TODAY"/);
    assert.match(m[0], /data-action="KAIZEN_SCHEDULE_STEP_WEEK"/);
  });

  test('current row payload carries kaizenId + catalogEntryId', () => {
    const k = activeKaizen({ id: 'k_abc' });
    const html = KaizenCard({
      kaizen: k,
      catalog: dmaic3(),
      completedCatalogIds: [],
      isExpanded: true
    });
    assert.match(
      html,
      /data-action="KAIZEN_COMPLETE_STEP" data-payload='\{&quot;kaizenId&quot;:&quot;k_abc&quot;,&quot;catalogEntryId&quot;:&quot;cat_20&quot;\}'/
    );
  });

  test('current Complete button is NOT disabled', () => {
    const k = activeKaizen();
    const html = KaizenCard({
      kaizen: k,
      catalog: dmaic3(),
      completedCatalogIds: [],
      isExpanded: true
    });
    const m = html.match(/<li class="kz-step-row kz-step-row-current[^]*?<\/li>/);
    assert.ok(m);
    // Complete button must not be disabled
    const completeBtn = m[0].match(/<button[^>]*KAIZEN_COMPLETE_STEP[^>]*>/)?.[0] ?? '';
    assert.ok(!completeBtn.includes('disabled'));
  });
});

describe('KaizenCard — Sprint 10b next-row action buttons', () => {
  test('next row shows Schedule today + Schedule this week', () => {
    const k = activeKaizen();
    const html = KaizenCard({
      kaizen: k,
      catalog: dmaic3(),
      completedCatalogIds: [],
      isExpanded: true
    });
    const m = html.match(/<li class="kz-step-row kz-step-row-next[^]*?<\/li>/);
    assert.ok(m);
    assert.match(m[0], /data-action="KAIZEN_SCHEDULE_STEP_TODAY"/);
    assert.match(m[0], /data-action="KAIZEN_SCHEDULE_STEP_WEEK"/);
  });

  test('next row Complete button IS disabled with tooltip "Deps not met."', () => {
    const k = activeKaizen();
    const html = KaizenCard({
      kaizen: k,
      catalog: dmaic3(),
      completedCatalogIds: [],
      isExpanded: true
    });
    const m = html.match(/<li class="kz-step-row kz-step-row-next[^]*?<\/li>/);
    assert.ok(m);
    assert.match(m[0], /disabled[^>]*title="Deps not met\."/);
  });

  test('next row disabled Complete is NOT wired to KAIZEN_COMPLETE_STEP action', () => {
    const k = activeKaizen();
    const html = KaizenCard({
      kaizen: k,
      catalog: dmaic3(),
      completedCatalogIds: [],
      isExpanded: true
    });
    const m = html.match(/<li class="kz-step-row kz-step-row-next[^]*?<\/li>/);
    assert.ok(m);
    assert.ok(!m[0].includes('data-action="KAIZEN_COMPLETE_STEP"'));
  });

  test('next row schedule payload includes catalogEntryId of next step', () => {
    const k = activeKaizen({ id: 'k_z' });
    const html = KaizenCard({
      kaizen: k,
      catalog: dmaic3(),
      completedCatalogIds: [],
      isExpanded: true
    });
    // next step is cat_21
    assert.match(
      html,
      /data-action="KAIZEN_SCHEDULE_STEP_TODAY" data-payload='\{&quot;kaizenId&quot;:&quot;k_z&quot;,&quot;catalogEntryId&quot;:&quot;cat_21&quot;\}'/
    );
  });
});

describe('KaizenCard — Sprint 10b pending-row action buttons', () => {
  test('pending row shows only Schedule this week', () => {
    const k = activeKaizen();
    const html = KaizenCard({
      kaizen: k,
      catalog: dmaic3(),
      completedCatalogIds: [],
      isExpanded: true
    });
    const m = html.match(/<li class="kz-step-row kz-step-row-pending[^]*?<\/li>/);
    assert.ok(m);
    assert.match(m[0], /data-action="KAIZEN_SCHEDULE_STEP_WEEK"/);
  });

  test('pending row does NOT show Complete', () => {
    const k = activeKaizen();
    const html = KaizenCard({
      kaizen: k,
      catalog: dmaic3(),
      completedCatalogIds: [],
      isExpanded: true
    });
    const m = html.match(/<li class="kz-step-row kz-step-row-pending[^]*?<\/li>/);
    assert.ok(m);
    assert.ok(!m[0].includes('KAIZEN_COMPLETE_STEP'));
  });

  test('pending row does NOT show Schedule today', () => {
    const k = activeKaizen();
    const html = KaizenCard({
      kaizen: k,
      catalog: dmaic3(),
      completedCatalogIds: [],
      isExpanded: true
    });
    const m = html.match(/<li class="kz-step-row kz-step-row-pending[^]*?<\/li>/);
    assert.ok(m);
    assert.ok(!m[0].includes('KAIZEN_SCHEDULE_STEP_TODAY'));
  });
});

describe('KaizenCard — Sprint 10b renderStepList edge cases', () => {
  test('empty catalog → empty-state fragment', () => {
    const k = activeKaizen();
    const html = renderStepList(k, [], [], {});
    assert.match(html, /kz-step-list-empty/);
  });

  test('kaizen without projectType → empty-state fragment', () => {
    const html = renderStepList({ id: 'k', title: 't' }, [catEntry()], [], {});
    assert.match(html, /kz-step-list-empty/);
  });

  test('catalog has no entries matching projectType → empty-state fragment', () => {
    const html = renderStepList(
      activeKaizen({ projectType: 'DMAIC' }),
      [catEntry({ projectTypeBinding: 'KAIZEN_EVENT_90D' })],
      [],
      {}
    );
    assert.match(html, /kz-step-list-empty/);
  });

  test('escapes XSS in step names', () => {
    const html = renderStepList(
      activeKaizen(),
      [catEntry({ id: 'cat_x', activityNumber: 20, name: '<script>bad</script>' })],
      [],
      {}
    );
    assert.doesNotMatch(html, /<script>bad/);
    assert.match(html, /&lt;script&gt;/);
  });
});
