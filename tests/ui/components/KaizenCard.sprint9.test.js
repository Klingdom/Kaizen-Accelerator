/**
 * Sprint 9 Pass 9c — KaizenCard currentStandardWork chip tests.
 *
 * Verifies the "▶ #N Name" chip rendered inline under the card title when
 * a catalog + projectType are provided.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  KaizenCard,
  renderCurrentStandardWorkChip
} from '../../../js/ui/components/KaizenCard.js';
import { buildCatalog } from '../../../js/catalog/seed/index.js';

const CATALOG = buildCatalog();

function idForNumber(n) {
  const e = CATALOG.find((c) => c.activityNumber === n);
  if (!e) throw new Error(`No catalog row for #${n}`);
  return e.id;
}

function makeDmaicActive(overrides = {}) {
  return {
    id: 'k_active',
    title: 'Reduce DMAIC cycle time',
    state: 'ACTIVE',
    projectType: 'DMAIC',
    problemStatement: 'Problem',
    goalStatement: 'Goal X → Y by Z',
    sourceFrictionSignalIds: [],
    actions: [{ name: 'a', ownerRef: 'me', dueDate: '2026-05-01', doneAt: null }],
    abandoned: false,
    ...overrides
  };
}

describe('renderCurrentStandardWorkChip — pure helper', () => {
  test('returns empty string when kaizen is null', () => {
    assert.equal(renderCurrentStandardWorkChip(null, CATALOG, []), '');
  });

  test('returns empty string when projectType missing', () => {
    assert.equal(
      renderCurrentStandardWorkChip({ id: 'k' }, CATALOG, []),
      ''
    );
  });

  test('returns empty string when catalog is empty', () => {
    const k = makeDmaicActive();
    assert.equal(renderCurrentStandardWorkChip(k, [], []), '');
  });

  test('returns empty string when all DMAIC rows completed', () => {
    const completed = [];
    for (let n = 20; n <= 41; n += 1) completed.push(idForNumber(n));
    const k = makeDmaicActive();
    assert.equal(renderCurrentStandardWorkChip(k, CATALOG, completed), '');
  });

  test('DMAIC Kaizen with no completion → chip with #20 Charter', () => {
    const k = makeDmaicActive();
    const chip = renderCurrentStandardWorkChip(k, CATALOG, []);
    assert.match(chip, /▶/);
    assert.match(chip, /#20/);
    assert.match(chip, /DMAIC Project Charter/);
  });

  test('After #20 completed, chip shows #21 SIPOC', () => {
    const k = makeDmaicActive();
    const chip = renderCurrentStandardWorkChip(k, CATALOG, [idForNumber(20)]);
    assert.match(chip, /#21/);
  });

  test('Kaizen 90 with no completion → chip shows #42 Charter', () => {
    const k = makeDmaicActive({ projectType: 'KAIZEN_EVENT_90D' });
    const chip = renderCurrentStandardWorkChip(k, CATALOG, []);
    assert.match(chip, /#42/);
  });

  test('chip uses aria-label for accessibility', () => {
    const k = makeDmaicActive();
    const chip = renderCurrentStandardWorkChip(k, CATALOG, []);
    assert.match(chip, /aria-label="current standard work"/);
  });

  test('chip HTML is escape-safe for maliciously crafted activityNumber', () => {
    // There's no way to inject HTML through activityNumber (it's a number).
    // But we can verify the name is escaped. Build a fake catalog + fake
    // kaizen.
    const fakeCatalog = [
      {
        id: 'cat_99_x',
        activityNumber: 99,
        name: '<script>bad</script>',
        projectTypeBinding: 'DMAIC',
        dependsOn: [],
        bucket: 'PROJECT'
      }
    ];
    const k = { projectType: 'DMAIC' };
    const chip = renderCurrentStandardWorkChip(k, fakeCatalog, []);
    assert.doesNotMatch(chip, /<script>bad/);
    assert.match(chip, /&lt;script&gt;/);
  });

  test('accelerator-bound entries → chip shown for Accelerator Kaizen', () => {
    const fakeCatalog = [
      {
        id: 'cat_acc_phase0_intake',
        activityNumber: 100,
        name: 'Phase 0 Intake',
        projectTypeBinding: 'KAIZEN_ACCELERATOR_30D',
        dependsOn: [],
        bucket: 'PROJECT'
      }
    ];
    const k = { projectType: 'KAIZEN_ACCELERATOR_30D' };
    const chip = renderCurrentStandardWorkChip(k, fakeCatalog, []);
    assert.match(chip, /Phase 0 Intake/);
  });
});

describe('KaizenCard — currentStandardWork chip integration', () => {
  test('ACTIVE Kaizen card renders chip when catalog passed', () => {
    const k = makeDmaicActive();
    const html = KaizenCard({
      kaizen: k,
      catalog: CATALOG,
      completedCatalogIds: []
    });
    assert.match(html, /kz-current-sw/);
    assert.match(html, /#20/);
  });

  test('ACTIVE Kaizen card WITHOUT catalog → no chip', () => {
    const k = makeDmaicActive();
    const html = KaizenCard({ kaizen: k });
    assert.doesNotMatch(html, /kz-current-sw/);
  });

  test('DRAFT Kaizen card renders chip', () => {
    const k = makeDmaicActive({ state: 'DRAFT' });
    const html = KaizenCard({
      kaizen: k,
      catalog: CATALOG,
      completedCatalogIds: []
    });
    assert.match(html, /kz-current-sw/);
  });

  test('IN_REMEASUREMENT Kaizen card renders chip', () => {
    const k = makeDmaicActive({ state: 'IN_REMEASUREMENT' });
    const html = KaizenCard({
      kaizen: k,
      catalog: CATALOG,
      completedCatalogIds: []
    });
    assert.match(html, /kz-current-sw/);
  });

  test('CLOSED Kaizen card does NOT render chip (work complete)', () => {
    const k = makeDmaicActive({ state: 'CLOSED', closedAt: '2026-04-01T00:00:00Z' });
    const html = KaizenCard({
      kaizen: k,
      catalog: CATALOG,
      completedCatalogIds: []
    });
    assert.doesNotMatch(html, /kz-current-sw/);
  });

  test('ABANDONED Kaizen card does NOT render chip', () => {
    const k = makeDmaicActive({ abandoned: true, abandonReason: 'stale' });
    const html = KaizenCard({
      kaizen: k,
      catalog: CATALOG,
      completedCatalogIds: []
    });
    assert.doesNotMatch(html, /kz-current-sw/);
  });

  test('Ad-hoc Kaizen (AD_HOC projectType) with single PDCA anchor shows chip', () => {
    const k = makeDmaicActive({ projectType: 'AD_HOC' });
    const html = KaizenCard({
      kaizen: k,
      catalog: CATALOG,
      completedCatalogIds: []
    });
    assert.match(html, /kz-current-sw/);
    // AD_HOC binds to #12 (PDCA Cycle).
    assert.match(html, /#12/);
  });
});
