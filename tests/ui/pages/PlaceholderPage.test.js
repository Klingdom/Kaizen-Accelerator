/**
 * Tests for PlaceholderPage — placeholder for non-Today routes.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { PlaceholderPage, PLACEHOLDER_SPRINTS } from '../../../js/ui/pages/PlaceholderPage.js';

describe('PlaceholderPage', () => {
  test('renders a placeholder-page section', () => {
    const html = PlaceholderPage({ route: 'week' });
    assert.match(html, /<section class="placeholder-page"/);
  });

  test('capitalizes route in title', () => {
    const html = PlaceholderPage({ route: 'kaizen' });
    assert.match(html, /<h1>Kaizen<\/h1>/);
  });

  test('week route ships in Sprint 5 per backlog', () => {
    const html = PlaceholderPage({ route: 'week' });
    assert.match(html, /Ships in Sprint 5/);
  });

  test('catalog route ships in Sprint 5', () => {
    const html = PlaceholderPage({ route: 'catalog' });
    assert.match(html, /Ships in Sprint 5/);
  });

  test('kaizen route ships in Sprint 6', () => {
    const html = PlaceholderPage({ route: 'kaizen' });
    assert.match(html, /Ships in Sprint 6/);
  });

  test('insights route ships in Sprint 6', () => {
    const html = PlaceholderPage({ route: 'insights' });
    assert.match(html, /Ships in Sprint 6/);
  });

  test('settings route ships in Sprint 6', () => {
    const html = PlaceholderPage({ route: 'settings' });
    assert.match(html, /Ships in Sprint 6/);
  });

  test('unknown route falls back to "a later sprint"', () => {
    const html = PlaceholderPage({ route: 'xyz' });
    assert.match(html, /a later sprint/);
  });

  test('data-route attribute reflects the route', () => {
    const html = PlaceholderPage({ route: 'week' });
    assert.match(html, /data-route="week"/);
  });

  test('includes explanatory sub-copy', () => {
    const html = PlaceholderPage({ route: 'week' });
    assert.match(html, /This page is a stub/);
  });

  test('no route prop still produces valid HTML', () => {
    const html = PlaceholderPage();
    assert.ok(typeof html === 'string');
    assert.ok(html.length > 0);
  });

  test('PLACEHOLDER_SPRINTS has entries for 5 deferred routes', () => {
    assert.equal(Object.keys(PLACEHOLDER_SPRINTS).length, 5);
    assert.ok(PLACEHOLDER_SPRINTS.week);
    assert.ok(PLACEHOLDER_SPRINTS.catalog);
    assert.ok(PLACEHOLDER_SPRINTS.kaizen);
    assert.ok(PLACEHOLDER_SPRINTS.insights);
    assert.ok(PLACEHOLDER_SPRINTS.settings);
  });
});
