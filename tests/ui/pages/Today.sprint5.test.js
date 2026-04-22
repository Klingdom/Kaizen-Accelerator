/**
 * Sprint 5 extensions to Today.test.js — covers fine-tune, dialogs,
 * infeasible banner.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { Today } from '../../../js/ui/pages/Today.js';

describe('Today — Fine-tune drawer', () => {
  test('renders a Fine-tune button in the header', () => {
    const html = Today({ activeState: null });
    assert.match(html, /class="fine-tune-btn"/);
    assert.match(html, /data-action="FINE_TUNE_TOGGLE"/);
  });

  test('when fineTune.open=true, the drawer is visible', () => {
    const html = Today({
      activeState: null,
      fineTune: {
        open: true,
        capacityMinutes: 480,
        externalMinutesToday: 0,
        activeKaizenId: null
      }
    });
    assert.match(html, /ftd-drawer[^"]*ftd-open/);
    assert.match(html, /aria-hidden="false"/);
  });

  test('when fineTune.open=false, drawer is hidden', () => {
    const html = Today({
      activeState: null,
      fineTune: {
        open: false,
        capacityMinutes: 480,
        externalMinutesToday: 0,
        activeKaizenId: null
      }
    });
    assert.match(html, /aria-hidden="true"/);
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
    // Fine-tune button appears inside the banner too.
    const fineTuneMatches = (html.match(/fine-tune-btn/g) ?? []).length;
    assert.ok(fineTuneMatches >= 2, `expected at least 2 fine-tune buttons (header + banner), got ${fineTuneMatches}`);
  });

  test('accepts structured infeasible prop too', () => {
    const html = Today({
      activeState: null,
      infeasible: { explain: ['x'] }
    });
    assert.match(html, /infeasible-banner/);
  });
});
