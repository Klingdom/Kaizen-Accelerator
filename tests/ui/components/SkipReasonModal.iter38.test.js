/**
 * Iter 38 Phase B — SkipReasonModal CI sacredness tests (SW-Q10, AC8, AC9).
 *
 * Covers:
 *   - AC8: CI skip flow shows sacred-confirm step + CISacredConfirmBanner rendered
 *   - AC9: Non-CI skip flow does NOT show the sacred-confirm banner
 *   - CISkipConfirmed event constant exported from events.js
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { SkipReasonModal, CISacredConfirmBanner } from '../../../js/ui/components/SkipReasonModal.js';
import { CISkipConfirmed, EVENT_NAMES } from '../../../js/events/events.js';

// ---------------------------------------------------------------------------
// AC6: CISkipConfirmed event constant exported from events.js
// ---------------------------------------------------------------------------
describe('Iter 38 — AC6: CISkipConfirmed event constant', () => {
  test('CISkipConfirmed equals the string "CISkipConfirmed"', () => {
    assert.equal(CISkipConfirmed, 'CISkipConfirmed');
  });

  test('CISkipConfirmed is in EVENT_NAMES', () => {
    assert.ok(
      EVENT_NAMES.includes('CISkipConfirmed'),
      'CISkipConfirmed missing from EVENT_NAMES'
    );
  });
});

// ---------------------------------------------------------------------------
// AC8: CI-bucket activity shows sacred-confirm banner
// ---------------------------------------------------------------------------
describe('Iter 38 — AC8: CI skip shows sacred-confirm step', () => {
  test('isCIActivity=true renders CI sacred banner in modal', () => {
    const html = SkipReasonModal({
      activityId: 'sa_reflection',
      activityName: 'End-of-Activity Reflection',
      isCIActivity: true
    });
    assert.match(html, /srm-ci-sacred/, 'CI sacred banner class should be present for CI activities');
    assert.match(
      html,
      /Continuous Improvement/,
      'CI sacred copy should mention "Continuous Improvement"'
    );
  });

  test('isCIActivity=true sets data-is-ci="true" on section', () => {
    const html = SkipReasonModal({
      activityId: 'sa_ci_block',
      isCIActivity: true
    });
    assert.match(html, /data-is-ci="true"/);
  });

  test('CI sacred banner contains mindfulness copy and skip warning', () => {
    const banner = CISacredConfirmBanner();
    assert.match(banner, /srm-ci-sacred/);
    assert.match(banner, /Continuous Improvement/);
    assert.match(banner, /tomorrow easier/);
  });
});

// ---------------------------------------------------------------------------
// AC9: Non-CI activities do NOT show the sacred-confirm banner
// ---------------------------------------------------------------------------
describe('Iter 38 — AC9: non-CI skip does NOT show sacred banner', () => {
  test('isCIActivity=false (default) omits CI sacred banner', () => {
    const html = SkipReasonModal({
      activityId: 'sa_comm_block',
      activityName: 'AM High-value Communication'
    });
    assert.ok(
      !html.includes('srm-ci-sacred'),
      'CI sacred banner should NOT appear for non-CI activities'
    );
    assert.ok(
      !html.includes('Continuous Improvement'),
      'Sacred copy should NOT appear for non-CI activities'
    );
  });

  test('isCIActivity=false explicitly also omits banner', () => {
    const html = SkipReasonModal({
      activityId: 'sa_project_block',
      isCIActivity: false
    });
    assert.ok(!html.includes('srm-ci-sacred'));
  });

  test('data-is-ci is "false" for non-CI activities', () => {
    const html = SkipReasonModal({ activityId: 'sa_project' });
    assert.match(html, /data-is-ci="false"/);
  });

  test('standard skip modal still renders 6 radio options for CI activities', () => {
    const html = SkipReasonModal({
      activityId: 'sa_ci',
      isCIActivity: true
    });
    const matches = html.match(/<input[^>]*type="radio"/g) ?? [];
    assert.equal(matches.length, 6, 'CI modal should still have 6 reason radios');
  });

  test('payload includes isCIActivity flag for app.js handler', () => {
    const html = SkipReasonModal({
      activityId: 'sa_ci_1',
      isCIActivity: true
    });
    // The payload JSON string is HTML-escaped in the attribute value
    // (single-quoted attribute; double-quotes become &quot;).
    // Either the escaped or raw form is acceptable — confirm isCIActivity:true appears.
    const hasFlag = html.includes('&quot;isCIActivity&quot;:true') ||
                    html.includes('"isCIActivity":true');
    assert.ok(hasFlag, 'Payload should include isCIActivity:true (escaped or raw)');
  });
});
