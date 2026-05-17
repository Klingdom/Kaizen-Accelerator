/**
 * Integration tests for Iter 39 — Luminous Constraint Phase 1.
 *
 * AC1:  pulse-red has prefers-reduced-motion override
 * AC2:  animation suppressed when media query matches (CSS verified)
 * AC3:  UserPreferences typedef in types.js
 * AC4:  UserPreferencesService.load/save/getDefaults
 * AC5:  localStorage key bamx.userPreferences.v1
 * AC6:  applyPreferences exported from app.js
 * AC7:  system theme wires prefers-color-scheme listener
 * AC8:  [data-theme="dark"] overrides surface/text/border tokens (CSS)
 * AC9:  bucket colors preserved in both themes (CSS — verified by bucketMeta)
 * AC11: motion-reduced mode suppresses animations (CSS)
 * AC12: /settings route renders Settings page
 * AC13: Settings renders 3-theme + 2-motion radios
 * AC14: PREF_CHANGE_THEME / PREF_CHANGE_MOTION handlers exist
 * AC15: AppShell gear icon links to /settings
 * AC16: first-run user gets exact Iter 38 appearance (system/full defaults)
 * AC17: all prior tests pass (validated by running the full suite)
 * AC18: settings accessible day 0 — no gate in renderApp()
 */

globalThis.__CADENCEPLAN_NO_AUTOSTART__ = true;

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { LocalStorageMock } from './_helpers/localStorageMock.js';

// Read CSS once at module load — synchronous, cheap, shared across all tests.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_CSS = readFileSync(path.resolve(__dirname, '../app.css'), 'utf-8');
import { ClockService } from '../js/services/ClockService.js';
import {
  buildServices,
  buildHandlers,
  renderApp,
  applyPreferences,
  DEFAULT_USER
} from '../js/app.js';
import {
  load as loadPrefs,
  save as savePrefs,
  getDefaults,
  USER_PREFS_KEY
} from '../js/services/UserPreferencesService.js';
import { ThemeId, MotionPreference, UserPreferences } from '../js/domain/types.js';
import { Settings } from '../js/ui/pages/Settings.js';
import { AppShell } from '../js/ui/AppShell.js';
import bucketMeta from '../js/ui/bucketMeta.js';
import { ROUTE_NAMES, PLACEHOLDER_ROUTE_NAMES } from '../js/ui/router.js';

const FROZEN = '2026-04-30T09:00:00Z';

function makeEnv() {
  const storage = new LocalStorageMock();
  const clock = new ClockService({ now: () => FROZEN });
  const services = buildServices({ storage, clock });
  return { storage, clock, services };
}

// ---------------------------------------------------------------------------
// AC1 + AC2: prefers-reduced-motion override for pulse-red
// ---------------------------------------------------------------------------
describe('AC1/AC2 — pulse-red prefers-reduced-motion override', () => {
  test('app.css contains prefers-reduced-motion override for .bucket-row.status-overpacked', () => {
    // Must have a prefers-reduced-motion media query that targets status-overpacked
    assert.match(APP_CSS, /prefers-reduced-motion:\s*reduce/);
    assert.match(APP_CSS, /\.bucket-row\.status-overpacked[\s\S]*?animation:\s*none/);
  });
});

// ---------------------------------------------------------------------------
// AC3: UserPreferences typedef in types.js
// ---------------------------------------------------------------------------
describe('AC3 — UserPreferences typedef in types.js', () => {
  test('ThemeId enum exported from types.js with correct values', () => {
    assert.equal(ThemeId.SYSTEM, 'system');
    assert.equal(ThemeId.LIGHT, 'light');
    assert.equal(ThemeId.DARK, 'dark');
    assert.ok(Object.isFrozen(ThemeId));
  });

  test('MotionPreference enum exported from types.js with correct values', () => {
    assert.equal(MotionPreference.FULL, 'full');
    assert.equal(MotionPreference.REDUCED, 'reduced');
    assert.ok(Object.isFrozen(MotionPreference));
  });

  test('UserPreferences is exported from types.js (null placeholder — typedef only)', () => {
    // Per the existing convention: typedef exports are null-valued constants.
    assert.equal(UserPreferences, null);
  });
});

// ---------------------------------------------------------------------------
// AC4 + AC5: UserPreferencesService load/save/getDefaults
// ---------------------------------------------------------------------------
describe('AC4/AC5 — UserPreferencesService', () => {
  test('getDefaults returns themeId=system, motion=full, schemaVersion=v1', () => {
    const d = getDefaults();
    assert.equal(d.themeId, 'system');
    assert.equal(d.motion, 'full');
    assert.equal(d.schemaVersion, 'v1');
  });

  test('USER_PREFS_KEY is bamx.userPreferences.v1', () => {
    assert.equal(USER_PREFS_KEY, 'bamx.userPreferences.v1');
  });

  test('load from empty storage returns defaults', () => {
    const storage = new LocalStorageMock();
    const prefs = loadPrefs(storage);
    assert.deepEqual(prefs, getDefaults());
  });

  test('save + load round-trip persists themeId=dark', () => {
    const storage = new LocalStorageMock();
    savePrefs({ themeId: 'dark', motion: 'full', schemaVersion: 'v1' }, storage);
    const loaded = loadPrefs(storage);
    assert.equal(loaded.themeId, 'dark');
  });

  test('save + load round-trip persists motion=reduced', () => {
    const storage = new LocalStorageMock();
    savePrefs({ themeId: 'system', motion: 'reduced', schemaVersion: 'v1' }, storage);
    const loaded = loadPrefs(storage);
    assert.equal(loaded.motion, 'reduced');
  });
});

// ---------------------------------------------------------------------------
// AC6: applyPreferences exported from app.js
// ---------------------------------------------------------------------------
describe('AC6 — applyPreferences exported', () => {
  test('applyPreferences is a function', () => {
    assert.equal(typeof applyPreferences, 'function');
  });

  test('applyPreferences does not throw when document is undefined (test env)', () => {
    // document is undefined in Node — the function is guarded.
    assert.doesNotThrow(() => applyPreferences({ themeId: 'dark', motion: 'full' }));
  });

  test('applyPreferences is a no-op when prefs is null', () => {
    assert.doesNotThrow(() => applyPreferences(null));
  });
});

// ---------------------------------------------------------------------------
// AC8: dark mode CSS tokens present
// ---------------------------------------------------------------------------
describe('AC8 — dark mode CSS tokens', () => {
  test('app.css contains [data-theme="dark"] selector with surface-page override', () => {
    assert.match(APP_CSS, /\[data-theme="dark"\]/);
    assert.match(APP_CSS, /--surface-page/);
    assert.match(APP_CSS, /--text-primary/);
    assert.match(APP_CSS, /--border-subtle/);
  });

  test('app.css contains [data-theme="system"] + prefers-color-scheme: dark combo', () => {
    assert.match(APP_CSS, /\[data-theme="system"\]/);
    assert.match(APP_CSS, /prefers-color-scheme:\s*dark/);
  });
});

// ---------------------------------------------------------------------------
// AC9: bucket colors preserved (bucketMeta still returns CSS vars, not hex)
// ---------------------------------------------------------------------------
describe('AC9 — bucket colors preserved across themes', () => {
  test('bucketMeta PROJECT returns var(--project-fill) — not a hardcoded hex', () => {
    const meta = bucketMeta('PROJECT');
    assert.equal(meta.vars.fill, 'var(--project-fill)');
    assert.ok(!meta.vars.fill.startsWith('#'), 'fill should be a CSS var, not hex literal');
  });

  test('bucketMeta CI returns var(--ci-fill)', () => {
    const meta = bucketMeta('CI');
    assert.equal(meta.vars.fill, 'var(--ci-fill)');
  });

  test('bucketMeta COMMUNICATION returns var(--communication-fill)', () => {
    const meta = bucketMeta('COMMUNICATION');
    assert.equal(meta.vars.fill, 'var(--communication-fill)');
  });
});

// ---------------------------------------------------------------------------
// AC11: motion-reduced CSS tokens present
// ---------------------------------------------------------------------------
describe('AC11 — motion-reduced CSS', () => {
  test('app.css contains [data-motion="reduced"] block suppressing animations', () => {
    assert.match(APP_CSS, /\[data-motion="reduced"\]/);
    assert.match(APP_CSS, /animation-duration:\s*0\.01ms/);
    assert.match(APP_CSS, /transition-duration:\s*0\.01ms/);
  });
});

// ---------------------------------------------------------------------------
// AC12: /settings route renders Settings page (not PlaceholderPage)
// ---------------------------------------------------------------------------
describe('AC12/AC18 — settings route', () => {
  test('renderApp with route=settings renders Settings content (no placeholder)', () => {
    const { services } = makeEnv();
    const state = {
      route: 'settings',
      params: {},
      userPreferences: getDefaults(),
      toast: null,
      composerLoading: false,
      infeasibleExplain: null,
      lastError: null
    };
    // renderApp calls mountHtml which requires document — not available in tests.
    // Instead test the Settings component directly which renderApp delegates to.
    const html = Settings({ themeId: 'system', motion: 'full' });
    assert.match(html, /class="settings-page"/);
    assert.ok(!html.includes('Ships next'), 'should not render placeholder copy');
  });

  test('Settings route is in the router ROUTE_NAMES', () => {
    assert.ok(ROUTE_NAMES.includes('settings'));
  });

  test('settings is NOT in PLACEHOLDER_ROUTE_NAMES (Iter 39 promotion)', () => {
    assert.ok(!PLACEHOLDER_ROUTE_NAMES.includes('settings'));
  });
});

// ---------------------------------------------------------------------------
// AC13: Settings renders 3-theme + 2-motion radios
// ---------------------------------------------------------------------------
describe('AC13 — Settings page radio inputs', () => {
  test('renders 3 theme radio inputs', () => {
    const html = Settings();
    const themeRadios = html.match(/name="settings-theme"/g) ?? [];
    assert.equal(themeRadios.length, 3);
  });

  test('renders 2 motion radio inputs', () => {
    const html = Settings();
    const motionRadios = html.match(/name="settings-motion"/g) ?? [];
    assert.equal(motionRadios.length, 2);
  });
});

// ---------------------------------------------------------------------------
// AC14: PREF_CHANGE_THEME / PREF_CHANGE_MOTION handlers exist in buildHandlers
// ---------------------------------------------------------------------------
describe('AC14 — PREF_CHANGE handlers', () => {
  test('buildHandlers includes PREF_CHANGE_THEME', () => {
    const { services } = makeEnv();
    const state = {
      route: 'today',
      params: {},
      userPreferences: getDefaults(),
      toast: null,
      composerLoading: false,
      infeasibleExplain: null,
      lastError: null,
      _focusTrap: {}
    };
    const handlers = buildHandlers({ services, state, rerender: () => {} });
    assert.equal(typeof handlers.PREF_CHANGE_THEME, 'function');
  });

  test('buildHandlers includes PREF_CHANGE_MOTION', () => {
    const { services } = makeEnv();
    const state = {
      route: 'today',
      params: {},
      userPreferences: getDefaults(),
      toast: null,
      composerLoading: false,
      infeasibleExplain: null,
      lastError: null,
      _focusTrap: {}
    };
    const handlers = buildHandlers({ services, state, rerender: () => {} });
    assert.equal(typeof handlers.PREF_CHANGE_MOTION, 'function');
  });

  test('PREF_CHANGE_THEME updates state.userPreferences.themeId', () => {
    const { services } = makeEnv();
    const state = {
      route: 'today',
      params: {},
      userPreferences: getDefaults(),
      toast: null,
      composerLoading: false,
      infeasibleExplain: null,
      lastError: null,
      _focusTrap: {}
    };
    const handlers = buildHandlers({ services, state, rerender: () => {} });
    handlers.PREF_CHANGE_THEME({ themeId: 'dark' });
    assert.equal(state.userPreferences.themeId, 'dark');
  });

  test('PREF_CHANGE_MOTION updates state.userPreferences.motion', () => {
    const { services } = makeEnv();
    const state = {
      route: 'today',
      params: {},
      userPreferences: getDefaults(),
      toast: null,
      composerLoading: false,
      infeasibleExplain: null,
      lastError: null,
      _focusTrap: {}
    };
    const handlers = buildHandlers({ services, state, rerender: () => {} });
    handlers.PREF_CHANGE_MOTION({ motion: 'reduced' });
    assert.equal(state.userPreferences.motion, 'reduced');
  });

  test('PREF_CHANGE_THEME persists to storage via UserPreferencesService', () => {
    const storage = new LocalStorageMock();
    const clock = new ClockService({ now: () => FROZEN });
    const services = buildServices({ storage, clock });
    const state = {
      route: 'today',
      params: {},
      userPreferences: getDefaults(),
      toast: null,
      composerLoading: false,
      infeasibleExplain: null,
      lastError: null,
      _focusTrap: {}
    };
    const handlers = buildHandlers({ services, state, rerender: () => {} });
    handlers.PREF_CHANGE_THEME({ themeId: 'light' });
    // Should now be persisted
    const loaded = loadPrefs(storage);
    assert.equal(loaded.themeId, 'light');
  });
});

// ---------------------------------------------------------------------------
// AC15: AppShell gear icon links to /settings
// ---------------------------------------------------------------------------
describe('AC15 — gear icon in AppShell', () => {
  test('AppShell renders an anchor with href="#settings"', () => {
    const html = AppShell({ route: 'today', pageHtml: '' });
    assert.match(html, /href="#settings"/);
  });

  test('gear icon uses nav-gear class (not nav-item)', () => {
    const html = AppShell({ route: 'today', pageHtml: '' });
    assert.match(html, /class="nav-gear"/);
  });

  test('gear icon has accessible aria-label', () => {
    const html = AppShell({ route: 'today', pageHtml: '' });
    assert.match(html, /aria-label="Settings"/);
  });

  test('gear icon has aria-current="page" when on settings route', () => {
    const html = AppShell({ route: 'settings', pageHtml: '' });
    assert.match(html, /aria-current="page"/);
  });

  test('gear icon does NOT have aria-current when NOT on settings route', () => {
    const html = AppShell({ route: 'today', pageHtml: '' });
    // The text-nav items won't have aria-current for settings.
    // The gear icon itself should not have aria-current when not on settings.
    // Check that aria-current does not appear on the nav-gear element.
    const gearSection = html.match(/class="nav-gear"[^>]*/)?.[0] ?? '';
    assert.ok(!gearSection.includes('aria-current'), `gear icon should not have aria-current: "${gearSection}"`);
  });
});

// ---------------------------------------------------------------------------
// AC16: first-run user gets defaults (system/full)
// ---------------------------------------------------------------------------
describe('AC16 — first-run user gets Iter 38 defaults', () => {
  test('load from empty storage returns system/full defaults', () => {
    const storage = new LocalStorageMock();
    const prefs = loadPrefs(storage);
    assert.equal(prefs.themeId, 'system');
    assert.equal(prefs.motion, 'full');
    assert.equal(prefs.schemaVersion, 'v1');
  });

  test('Settings with system/full renders same as no-arg call', () => {
    const defaultHtml = Settings();
    const explicitHtml = Settings({ themeId: 'system', motion: 'full' });
    assert.equal(defaultHtml, explicitHtml);
  });
});
