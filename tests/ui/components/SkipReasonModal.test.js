/**
 * Tests for SkipReasonModal (Sprint 5 P1-T1).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { SkipReasonModal, SKIP_REASONS } from '../../../js/ui/components/SkipReasonModal.js';

describe('SkipReasonModal — structure', () => {
  test('renders a <section role=dialog>', () => {
    const html = SkipReasonModal({ activityId: 'sa_1' });
    assert.match(html, /<section[^>]*class="srm-modal"/);
    assert.match(html, /role="dialog"/);
  });

  test('carries activity id on data-attr', () => {
    const html = SkipReasonModal({ activityId: 'sa_1' });
    assert.match(html, /data-activity-id="sa_1"/);
  });

  test('renders Cancel + Log-skip buttons', () => {
    const html = SkipReasonModal({ activityId: 'sa_1' });
    assert.match(html, /<button[^>]*class="srm-cancel"/);
    assert.match(html, /<button[^>]*class="srm-submit"/);
    assert.match(html, /data-action="CLOSE_SKIP_MODAL"/);
    assert.match(html, /data-action="SUBMIT_SKIP_MODAL"/);
  });

  test('renders 6 radio options', () => {
    const html = SkipReasonModal({ activityId: 'sa_1' });
    const matches = html.match(/<input[^>]*type="radio"/g) ?? [];
    assert.equal(matches.length, 6);
  });

  test('every ReasonCode appears as a value', () => {
    const html = SkipReasonModal({ activityId: 'sa_1' });
    for (const { code } of SKIP_REASONS) {
      assert.ok(html.includes(`value="${code}"`), `missing value="${code}"`);
    }
  });

  test('all reasonCode radios required', () => {
    const html = SkipReasonModal({ activityId: 'sa_1' });
    const matches = html.match(/<input[^>]*required/g) ?? [];
    // 6 radios with required attribute.
    assert.ok(matches.length >= 6);
  });

  test('OTHER note textarea is present (hidden until OTHER chosen)', () => {
    const html = SkipReasonModal({ activityId: 'sa_1' });
    assert.match(html, /<textarea[^>]*name="note"/);
    assert.match(html, /data-shown-when="OTHER"/);
  });

  test('selectedReason pre-checks that radio', () => {
    const html = SkipReasonModal({ activityId: 'sa_1', selectedReason: 'SICK' });
    assert.match(html, /value="SICK"[^>]*checked/);
  });

  test('no selected → no radio is checked', () => {
    const html = SkipReasonModal({ activityId: 'sa_1' });
    assert.ok(!html.includes('checked'));
  });

  test('renders activity name in title when provided', () => {
    const html = SkipReasonModal({
      activityId: 'sa_1',
      activityName: 'PDCA Cycle'
    });
    assert.match(html, /Skip: PDCA Cycle/);
  });

  test('falls back to id when name absent', () => {
    const html = SkipReasonModal({ activityId: 'sa_xx' });
    assert.match(html, /Skip: sa_xx/);
  });
});

describe('SkipReasonModal — XSS', () => {
  test('activity name escapes', () => {
    const html = SkipReasonModal({
      activityId: 'sa_1',
      activityName: '<img src=x onerror=alert(1)>'
    });
    assert.ok(!html.includes('<img src=x'));
    assert.match(html, /&lt;img/);
  });
});

describe('SKIP_REASONS', () => {
  test('has 6 entries', () => {
    assert.equal(SKIP_REASONS.length, 6);
  });

  test('every entry has code + label', () => {
    for (const r of SKIP_REASONS) {
      assert.equal(typeof r.code, 'string');
      assert.equal(typeof r.label, 'string');
    }
  });

  test('OTHER is present', () => {
    assert.ok(SKIP_REASONS.some((r) => r.code === 'OTHER'));
  });
});
