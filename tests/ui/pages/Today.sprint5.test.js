/**
 * Sprint 5 extensions to Today.test.js — covers dialogs, infeasible banner.
 *
 * Iter 25: Removed Fine-tune drawer tests (FineTuneButton + FineTuneDrawer
 * removed from Today render path). InfeasibleBanner test updated to not
 * assert fine-tune button presence in Today header.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { Today } from '../../../js/ui/pages/Today.js';

describe('Today — Iter 25: Fine-tune drawer removed', () => {
  test('no Fine-tune button in Today header (Iter 25 removal)', () => {
    const html = Today({ activeState: null });
    assert.ok(!html.includes('fine-tune-btn'), 'FineTuneButton must be absent from Today header');
    assert.ok(!html.includes('FINE_TUNE_TOGGLE'), 'FINE_TUNE_TOGGLE action must not appear in Today');
  });

  test('fineTune prop is accepted but ignored (no drawer rendered)', () => {
    const html = Today({
      activeState: null,
      fineTune: {
        open: true,
        capacityMinutes: 480,
        externalMinutesToday: 0,
        activeKaizenId: null
      }
    });
    assert.ok(!html.includes('ftd-drawer'), 'FineTuneDrawer must not render (Iter 25 removal)');
    assert.ok(!html.includes('fine-tune-btn'), 'FineTuneButton must not render');
  });
});

describe('Today — openDialog (Close artifact)', () => {
  test('renders OutputArtifactDialog for CLOSE dialog', () => {
    const html = Today({
      activeState: null,
      openDialog: {
        kind: 'CLOSE',
        activityId: 'sa_1',
        schema: 'TEXT',
        artifactDef: { name: 'Note', schema: 'TEXT' }
      }
    });
    assert.match(html, /class="oad-modal"/);
    assert.match(html, /data-activity-id="sa_1"/);
    assert.match(html, /data-schema="TEXT"/);
  });

  test('renders SkipReasonModal for SKIP dialog', () => {
    const html = Today({
      activeState: null,
      openDialog: {
        kind: 'SKIP',
        activityId: 'sa_1',
        activityName: 'PDCA'
      }
    });
    assert.match(html, /class="srm-modal"/);
    assert.match(html, /Skip: PDCA/);
  });

  test('no dialog when openDialog is null', () => {
    const html = Today({ activeState: null });
    assert.ok(!html.includes('class="oad-modal"'));
    assert.ok(!html.includes('class="srm-modal"'));
  });
});

describe('Today — InfeasibleBanner (P2-T1)', () => {
  test('renders InfeasibleBanner on infeasible result', () => {
    const html = Today({
      activeState: null,
      infeasibleExplain: [
        'Required 510 min; capacity 480 min.',
        'Validation failed on OVER_CAPACITY.'
      ]
    });
    assert.match(html, /class="infeasible-banner"/);
    assert.match(html, /role="alert"/);
    // InfeasibleBanner renders its own fine-tune button internally (in the banner).
    // Today header no longer has a fine-tune button (Iter 25).
    const fineTuneMatches = (html.match(/fine-tune-btn/g) ?? []).length;
    assert.ok(fineTuneMatches >= 1, `expected at least 1 fine-tune button (in banner), got ${fineTuneMatches}`);
  });

  test('accepts structured infeasible prop too', () => {
    const html = Today({
      activeState: null,
      infeasible: { explain: ['x'] }
    });
    assert.match(html, /infeasible-banner/);
  });
});
