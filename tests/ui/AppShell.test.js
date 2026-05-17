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

  test('nav has 5 items — Sprint 11 P0-T1 hides unimplemented insights + settings', () => {
    const html = AppShell({ route: 'today' });
    const navItems = (html.match(/class="nav-item[^"]*"/g) ?? []).length;
    assert.equal(navItems, 5);
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

  test('nav hides insights as text nav item; settings accessible via gear icon only (Iter 39)', () => {
    const html = AppShell({ route: 'today' });
    // insights is still hidden entirely from the nav.
    assert.ok(!html.includes('href="#insights"'));
    // settings is now accessible via the gear icon (not a text nav-item link).
    // Verify it uses the nav-gear class (not nav-item) so it is distinct from text nav.
    assert.match(html, /class="nav-gear"/);
    assert.match(html, /href="#settings"/); // gear icon link
    assert.ok(!html.includes('class="nav-item"[^>]*href="#settings"')); // not a text nav-item
  });

  test('nav includes kaizen route (functional screen)', () => {
    const html = AppShell({ route: 'today' });
    assert.match(html, /href="#kaizen"/);
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

  test('nav uses hash anchors (# prefix) for visible routes', () => {
    const html = AppShell({ route: 'today' });
    assert.match(html, /href="#today"/);
    assert.match(html, /href="#portfolio"/);
    assert.match(html, /href="#week"/);
    assert.match(html, /href="#catalog"/);
    assert.match(html, /href="#kaizen"/);
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
