/**
 * Tests for AppShell — pure shell render.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { AppShell } from '../../js/ui/AppShell.js';

describe('AppShell — structure', () => {
  test('renders an app-shell div', () => {
    const html = AppShell({ route: 'today', pageHtml: '' });
    assert.match(html, /class="app-shell"/);
  });

  test('data-route reflects the active route', () => {
    const html = AppShell({ route: 'week', pageHtml: '' });
    assert.match(html, /data-route="week"/);
  });

  test('embeds the pageHtml inside app-content', () => {
    const inner = '<p id="probe">inner content</p>';
    const html = AppShell({ route: 'today', pageHtml: inner });
    assert.match(html, /<div class="app-content">[\s\S]*id="probe"[\s\S]*<\/div>/);
  });

  test('nav has 7 items (one per MVP route — Portfolio added in Sprint 7)', () => {
    const html = AppShell({ route: 'today' });
    const navItems = (html.match(/class="nav-item[^"]*"/g) ?? []).length;
    assert.equal(navItems, 7);
  });

  test('nav includes Portfolio in 2nd position after Today (Sprint 7)', () => {
    const html = AppShell({ route: 'today' });
    assert.match(html, /href="#portfolio"/);
    // Today must appear before Portfolio; Portfolio before Week.
    const todayIdx = html.indexOf('href="#today"');
    const portfolioIdx = html.indexOf('href="#portfolio"');
    const weekIdx = html.indexOf('href="#week"');
    assert.ok(todayIdx >= 0 && portfolioIdx > todayIdx);
    assert.ok(weekIdx > portfolioIdx);
  });

  test('active route carries the "active" class', () => {
    const html = AppShell({ route: 'kaizen' });
    assert.match(html, /href="#kaizen" class="nav-item active"/);
  });

  test('active route carries aria-current="page"', () => {
    const html = AppShell({ route: 'week' });
    assert.match(html, /href="#week"[^>]*aria-current="page"/);
  });

  test('inactive routes do NOT carry aria-current', () => {
    const html = AppShell({ route: 'today' });
    assert.ok(!/href="#week"[^>]*aria-current/.test(html));
  });

  test('nav uses hash anchors (# prefix)', () => {
    const html = AppShell({ route: 'today' });
    assert.match(html, /href="#today"/);
    assert.match(html, /href="#week"/);
    assert.match(html, /href="#catalog"/);
    assert.match(html, /href="#kaizen"/);
    assert.match(html, /href="#insights"/);
    assert.match(html, /href="#settings"/);
  });

  test('brand "CadencePlan" present', () => {
    const html = AppShell({ route: 'today' });
    assert.match(html, /CadencePlan/);
  });

  test('default route=today when not provided', () => {
    const html = AppShell();
    assert.match(html, /data-route="today"/);
  });

  test('nav role + aria-label for accessibility', () => {
    const html = AppShell();
    assert.match(html, /role="navigation"/);
    assert.match(html, /aria-label="Primary"/);
  });
});
