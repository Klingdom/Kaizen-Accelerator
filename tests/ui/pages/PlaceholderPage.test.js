/**
 * Tests for PlaceholderPage — the "Ships next" polite message rendered
 * for unimplemented routes reachable via direct URL.
 *
 * Sprint 11 P0-T1 simplified this page: the old "Ships in Sprint N" copy
 * (which referenced a fixed internal schedule) was replaced with a
 * stable "Ships next" message plus a link back to Today.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { PlaceholderPage, PLACEHOLDER_SPRINTS } from '../../../js/ui/pages/PlaceholderPage.js';

describe('PlaceholderPage', () => {
  test('renders a placeholder-page section', () => {
    const html = PlaceholderPage({ route: 'insights' });
    assert.match(html, /<section class="placeholder-page"/);
  });

  test('capitalizes route in title', () => {
    const html = PlaceholderPage({ route: 'insights' });
    assert.match(html, /<h1>Insights<\/h1>/);
  });

  test('settings route renders "Ships next" message', () => {
    const html = PlaceholderPage({ route: 'settings' });
    assert.match(html, /Ships next\./);
  });

  test('insights route renders "Ships next" message', () => {
    const html = PlaceholderPage({ route: 'insights' });
    assert.match(html, /Ships next\./);
  });

  test('back-link to Today is present', () => {
    const html = PlaceholderPage({ route: 'insights' });
    assert.match(html, /href="#today"/);
    assert.match(html, />Today<\/a>/);
  });

  test('data-route attribute reflects the route', () => {
    const html = PlaceholderPage({ route: 'insights' });
    assert.match(html, /data-route="insights"/);
  });

  test('includes explanatory sub-copy', () => {
    const html = PlaceholderPage({ route: 'insights' });
    assert.match(html, /roadmap but hasn't shipped yet/);
  });

  test('no route prop still produces valid HTML', () => {
    const html = PlaceholderPage();
    assert.ok(typeof html === 'string');
    assert.ok(html.length > 0);
  });

  test('PLACEHOLDER_SPRINTS legacy export is still present (back-compat)', () => {
    // Sprint 11 no longer consults this map — the page renders a single
    // "Ships next" line — but callers may still import the symbol.
    assert.ok(PLACEHOLDER_SPRINTS && typeof PLACEHOLDER_SPRINTS === 'object');
  });
});
