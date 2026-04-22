/**
 * Tests for ValidatedKaizenCard (Sprint 8 P1-T4).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { ValidatedKaizenCard } from '../../../js/ui/components/ValidatedKaizenCard.js';

function closedKaizen(overrides = {}) {
  return {
    id: 'k_1',
    title: 'Trim meetings',
    state: 'CLOSED',
    closeKind: 'SUCCESS',
    closedAt: '2026-05-01T12:00:00Z',
    ...overrides
  };
}

describe('ValidatedKaizenCard — structure', () => {
  test('renders li.vk-row with data-kaizen-id + data-close-kind', () => {
    const html = ValidatedKaizenCard({
      kaizen: closedKaizen(),
      remeasurement: {
        deltaAbsolute: 6,
        deltaPercent: 60,
        beatsBaseline: true
      }
    });
    assert.match(html, /^<li class="vk-row"/);
    assert.match(html, /data-kaizen-id="k_1"/);
    assert.match(html, /data-close-kind="SUCCESS"/);
  });

  test('renders title', () => {
    const html = ValidatedKaizenCard({ kaizen: closedKaizen() });
    assert.ok(html.includes('Trim meetings'));
  });

  test('renders closeKind badge with correct class', () => {
    const htmlSuccess = ValidatedKaizenCard({
      kaizen: closedKaizen({ closeKind: 'SUCCESS' })
    });
    assert.match(htmlSuccess, /vk-close-success/);

    const htmlPartial = ValidatedKaizenCard({
      kaizen: closedKaizen({ closeKind: 'PARTIAL' })
    });
    assert.match(htmlPartial, /vk-close-partial/);

    const htmlFailed = ValidatedKaizenCard({
      kaizen: closedKaizen({ closeKind: 'FAILED_HONEST' })
    });
    assert.match(htmlFailed, /vk-close-failed_honest/);
  });

  test('FAILED_HONEST label is "FAILED HONEST" (space)', () => {
    const html = ValidatedKaizenCard({
      kaizen: closedKaizen({ closeKind: 'FAILED_HONEST' })
    });
    assert.ok(html.includes('FAILED HONEST'));
  });

  test('renders closedAt timestamp', () => {
    const html = ValidatedKaizenCard({ kaizen: closedKaizen() });
    assert.match(html, /datetime="2026-05-01T12:00:00Z"/);
  });

  test('renders delta percent when remeasurement supplied', () => {
    const html = ValidatedKaizenCard({
      kaizen: closedKaizen(),
      remeasurement: { deltaAbsolute: 6, deltaPercent: 60, beatsBaseline: true }
    });
    assert.ok(html.includes('+60%'));
  });

  test('renders em-dash when no remeasurement', () => {
    const html = ValidatedKaizenCard({ kaizen: closedKaizen() });
    assert.ok(html.includes('—'));
  });

  test('renders N/A when deltaPercent is null (zero baseline)', () => {
    const html = ValidatedKaizenCard({
      kaizen: closedKaizen(),
      remeasurement: { deltaAbsolute: 3, deltaPercent: null, beatsBaseline: true }
    });
    assert.ok(html.includes('N/A'));
  });

  test('returns empty string for null kaizen', () => {
    assert.equal(ValidatedKaizenCard({ kaizen: null }), '');
    assert.equal(ValidatedKaizenCard({}), '');
  });
});
