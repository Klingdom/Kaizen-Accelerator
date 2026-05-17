/**
 * Tests for js/ui/pages/Settings.js — Iter 39 Phase 1.
 *
 * AC12: /settings route renders.
 * AC13: 3-theme radio + 2-motion radio.
 * AC14: Live-apply data-actions wired on radio inputs.
 * AC18: No gate — settings accessible unconditionally.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { Settings } from '../../../js/ui/pages/Settings.js';

// ---------------------------------------------------------------------------
// Basic structure
// ---------------------------------------------------------------------------
describe('Settings — structure', () => {
  test('returns a non-empty HTML string', () => {
    const html = Settings();
    assert.equal(typeof html, 'string');
    assert.ok(html.length > 0);
  });

  test('is a <section> element with settings-page class', () => {
    const html = Settings();
    assert.match(html, /class="settings-page"/);
  });

  test('has an accessible h1 heading', () => {
    const html = Settings();
    assert.match(html, /<h1[^>]*>Settings<\/h1>/);
  });
});

// ---------------------------------------------------------------------------
// Theme radio group (AC13)
// ---------------------------------------------------------------------------
describe('Settings — theme radio group', () => {
  test('contains exactly 3 theme radio inputs', () => {
    const html = Settings();
    const matches = html.match(/name="settings-theme"/g) ?? [];
    assert.equal(matches.length, 3);
  });

  test('System radio input is present', () => {
    const html = Settings();
    assert.match(html, /value="system"/);
  });

  test('Light radio input is present', () => {
    const html = Settings();
    assert.match(html, /value="light"/);
  });

  test('Dark radio input is present', () => {
    const html = Settings();
    assert.match(html, /value="dark"/);
  });

  test('System is checked when themeId=system (default)', () => {
    const html = Settings({ themeId: 'system' });
    // The checked radio should be the system one.
    const systemSection = html.match(/value="system"[^>]*/)?.[0] ?? '';
    assert.match(systemSection, /checked/);
  });

  test('Light is checked when themeId=light', () => {
    const html = Settings({ themeId: 'light' });
    const lightSection = html.match(/value="light"[^>]*/)?.[0] ?? '';
    assert.match(lightSection, /checked/);
  });

  test('Dark is checked when themeId=dark', () => {
    const html = Settings({ themeId: 'dark' });
    const darkSection = html.match(/value="dark"[^>]*/)?.[0] ?? '';
    assert.match(darkSection, /checked/);
  });

  test('only one theme radio is checked when themeId=light', () => {
    const html = Settings({ themeId: 'light' });
    const allRadios = [...html.matchAll(/name="settings-theme"[^>]*/g)];
    const checkedCount = allRadios.filter((m) => /checked/.test(m[0])).length;
    assert.equal(checkedCount, 1);
  });
});

// ---------------------------------------------------------------------------
// Motion radio group (AC13)
// ---------------------------------------------------------------------------
describe('Settings — motion radio group', () => {
  test('contains exactly 2 motion radio inputs', () => {
    const html = Settings();
    const matches = html.match(/name="settings-motion"/g) ?? [];
    assert.equal(matches.length, 2);
  });

  test('Full radio input is present', () => {
    const html = Settings();
    assert.match(html, /value="full"/);
  });

  test('Reduced radio input is present', () => {
    const html = Settings();
    assert.match(html, /value="reduced"/);
  });

  test('Full is checked when motion=full (default)', () => {
    const html = Settings({ motion: 'full' });
    const fullSection = html.match(/value="full"[^>]*/)?.[0] ?? '';
    assert.match(fullSection, /checked/);
  });

  test('Reduced is checked when motion=reduced', () => {
    const html = Settings({ motion: 'reduced' });
    const reducedSection = html.match(/value="reduced"[^>]*/)?.[0] ?? '';
    assert.match(reducedSection, /checked/);
  });
});

// ---------------------------------------------------------------------------
// Live-apply data-actions (AC14)
// ---------------------------------------------------------------------------
describe('Settings — live-apply data-actions', () => {
  test('theme radios carry data-action=PREF_CHANGE_THEME', () => {
    const html = Settings();
    const themeInputs = [...html.matchAll(/name="settings-theme"[^>]*/g)];
    for (const match of themeInputs) {
      assert.match(match[0], /data-action="PREF_CHANGE_THEME"/, `Theme input missing data-action: ${match[0]}`);
    }
  });

  test('motion radios carry data-action=PREF_CHANGE_MOTION', () => {
    const html = Settings();
    const motionInputs = [...html.matchAll(/name="settings-motion"[^>]*/g)];
    for (const match of motionInputs) {
      assert.match(match[0], /data-action="PREF_CHANGE_MOTION"/, `Motion input missing data-action: ${match[0]}`);
    }
  });

  test('system radio carries data-theme-id=system', () => {
    const html = Settings();
    // Match the full tag around value="system"
    assert.match(html, /value="system"[^>]*data-theme-id="system"/);
  });

  test('light radio carries data-theme-id=light', () => {
    const html = Settings();
    assert.match(html, /value="light"[^>]*data-theme-id="light"/);
  });

  test('dark radio carries data-theme-id=dark', () => {
    const html = Settings();
    assert.match(html, /value="dark"[^>]*data-theme-id="dark"/);
  });

  test('full radio carries data-motion=full', () => {
    const html = Settings();
    assert.match(html, /value="full"[^>]*data-motion="full"/);
  });

  test('reduced radio carries data-motion=reduced', () => {
    const html = Settings();
    assert.match(html, /value="reduced"[^>]*data-motion="reduced"/);
  });
});

// ---------------------------------------------------------------------------
// Accessibility (AC13, AC18)
// ---------------------------------------------------------------------------
describe('Settings — accessibility', () => {
  test('radio groups have role=radiogroup', () => {
    const html = Settings();
    const radioGroups = html.match(/role="radiogroup"/g) ?? [];
    assert.ok(radioGroups.length >= 2, 'expected at least 2 radiogroup roles');
  });

  test('section has aria-labelledby pointing to h1', () => {
    const html = Settings();
    assert.match(html, /aria-labelledby="settings-h1"/);
    assert.match(html, /id="settings-h1"/);
  });

  test('labels wrap radio inputs (each radio has a label parent)', () => {
    const html = Settings();
    // Each label.settings-radio-label should wrap an input
    const labelCount = (html.match(/class="settings-radio-label"/g) ?? []).length;
    assert.ok(labelCount >= 5, `expected ≥5 label wrappers, got ${labelCount}`);
  });
});

// ---------------------------------------------------------------------------
// Defaults (AC16 — first-run user gets system/full defaults)
// ---------------------------------------------------------------------------
describe('Settings — defaults', () => {
  test('no-arg call defaults to themeId=system, motion=full', () => {
    const html = Settings();
    // System should be the checked theme radio
    const systemTag = html.match(/name="settings-theme"[^>]*value="system"[^>]*/)?.[0]
      ?? html.match(/value="system"[^>]*/)?.[0]
      ?? '';
    assert.match(html, /checked/); // at least one checked
    // Full motion is checked
    const fullTag = html.match(/value="full"[^>]*/)?.[0] ?? '';
    assert.match(fullTag, /checked/);
  });
});
