/**
 * Tests for the Portfolio page Validated Kaizens section (Sprint 8 P1-T4).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { Portfolio, PORTFOLIO_COPY } from '../../../js/ui/pages/Portfolio.js';

function closedKaizen(overrides = {}) {
  return {
    id: 'k_1',
    userId: 'u_1',
    title: 'Closed K',
    problemStatement: 'p',
    goalStatement: 'g',
    state: 'CLOSED',
    closeKind: 'SUCCESS',
    closedAt: '2026-05-01T12:00:00Z',
    actions: [],
    ...overrides
  };
}

describe('Portfolio — Validated Kaizens section', () => {
  test('renders pf-validated-kaizens section', () => {
    const html = Portfolio({ closedKaizens: [closedKaizen()] });
    assert.match(html, /pf-validated-kaizens/);
  });

  test('empty-state copy shown when no closed Kaizens', () => {
    const html = Portfolio({ closedKaizens: [] });
    assert.ok(html.includes(PORTFOLIO_COPY.VALIDATED_EMPTY));
  });

  test('renders one ValidatedKaizenCard per closed Kaizen', () => {
    const html = Portfolio({
      closedKaizens: [
        closedKaizen({ id: 'k_1', title: 'One' }),
        closedKaizen({ id: 'k_2', title: 'Two' })
      ]
    });
    const matches = html.match(/vk-row/g);
    assert.ok(matches);
    assert.equal(matches.length, 2);
  });

  test('title counter reflects the count', () => {
    const html = Portfolio({
      closedKaizens: [
        closedKaizen({ id: 'k_1' }),
        closedKaizen({ id: 'k_2' })
      ]
    });
    assert.match(html, /Validated Kaizens \(2\)/);
  });

  test('sorted by closedAt descending', () => {
    const html = Portfolio({
      closedKaizens: [
        closedKaizen({ id: 'k_old', title: 'Old', closedAt: '2026-04-01T10:00:00Z' }),
        closedKaizen({ id: 'k_new', title: 'New', closedAt: '2026-05-01T10:00:00Z' }),
        closedKaizen({ id: 'k_mid', title: 'Mid', closedAt: '2026-04-15T10:00:00Z' })
      ]
    });
    const newIdx = html.indexOf('k_new');
    const midIdx = html.indexOf('k_mid');
    const oldIdx = html.indexOf('k_old');
    assert.ok(newIdx > 0);
    assert.ok(midIdx > 0);
    assert.ok(oldIdx > 0);
    assert.ok(newIdx < midIdx);
    assert.ok(midIdx < oldIdx);
  });

  test('passes remeasurementsByKaizenId into each row', () => {
    const html = Portfolio({
      closedKaizens: [closedKaizen()],
      remeasurementsByKaizenId: {
        k_1: { deltaAbsolute: 6, deltaPercent: 60, beatsBaseline: true }
      }
    });
    assert.ok(html.includes('+60%'));
  });

  test('section renders AFTER opportunities + BEFORE catalog', () => {
    const html = Portfolio({
      closedKaizens: [closedKaizen()]
    });
    const oppIdx = html.indexOf('pf-opportunities');
    const valIdx = html.indexOf('pf-validated-kaizens');
    const catIdx = html.indexOf('pf-catalog');
    assert.ok(oppIdx < valIdx);
    assert.ok(valIdx < catIdx);
  });
});
