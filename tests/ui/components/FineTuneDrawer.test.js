/**
 * Tests for FineTuneDrawer (Sprint 5 P1-T2).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  FineTuneDrawer,
  FineTuneButton,
  CAPACITY_OPTIONS,
  EXTERNAL_OPTIONS
} from '../../../js/ui/components/FineTuneDrawer.js';

describe('FineTuneButton', () => {
  test('renders a button with data-action=FINE_TUNE_TOGGLE', () => {
    const html = FineTuneButton();
    assert.match(html, /<button[^>]*class="fine-tune-btn"/);
    assert.match(html, /data-action="FINE_TUNE_TOGGLE"/);
  });
});

describe('FineTuneDrawer — structure', () => {
  test('renders as aside with role=dialog', () => {
    const html = FineTuneDrawer({ capacityMinutes: 480 });
    assert.match(html, /<aside[^>]*class="ftd-drawer/);
    assert.match(html, /role="dialog"/);
  });

  test('closed by default (aria-hidden=true)', () => {
    const html = FineTuneDrawer({ capacityMinutes: 480 });
    assert.match(html, /aria-hidden="true"/);
    assert.ok(!html.includes('ftd-open'));
  });

  test('open=true → aria-hidden=false + ftd-open class', () => {
    const html = FineTuneDrawer({ capacityMinutes: 480, open: true });
    assert.match(html, /aria-hidden="false"/);
    assert.match(html, /ftd-open/);
  });

  test('open=true renders aria-modal="true" (AC2 — WCAG §2.1.2)', () => {
    const html = FineTuneDrawer({ capacityMinutes: 480, open: true });
    assert.match(html, /aria-modal="true"/);
  });

  test('closed does NOT render aria-modal (not modal when hidden)', () => {
    const html = FineTuneDrawer({ capacityMinutes: 480, open: false });
    assert.ok(!html.includes('aria-modal'), 'closed drawer should not have aria-modal');
  });

  test('renders aria-label="Fine-tune day capacity" (AC2)', () => {
    const html = FineTuneDrawer({ capacityMinutes: 480 });
    assert.match(html, /aria-label="Fine-tune day capacity"/);
  });

  test('has a Cancel + Apply button', () => {
    const html = FineTuneDrawer({ capacityMinutes: 480 });
    assert.match(html, /<button[^>]*class="ftd-cancel"/);
    assert.match(html, /<button[^>]*class="ftd-apply"/);
    assert.match(html, /data-action="FINE_TUNE_CANCEL"/);
    assert.match(html, /data-action="FINE_TUNE_APPLY"/);
  });
});

describe('FineTuneDrawer — capacity radios', () => {
  test('renders all 4 capacity options', () => {
    const html = FineTuneDrawer({ capacityMinutes: 480 });
    for (const m of CAPACITY_OPTIONS) {
      assert.match(html, new RegExp(`value="${m}"`));
    }
  });

  test('CAPACITY_OPTIONS has 240/360/480/600', () => {
    assert.deepEqual(CAPACITY_OPTIONS.slice(), [240, 360, 480, 600]);
  });

  test('selected value is checked', () => {
    const html = FineTuneDrawer({ capacityMinutes: 360 });
    assert.match(html, /name="capacity"[^>]*value="360"[^/]*checked/);
  });

  test('radio emits CAPACITY_CHANGE via data-action', () => {
    const html = FineTuneDrawer({ capacityMinutes: 480 });
    assert.match(html, /name="capacity"[^>]*data-action="CAPACITY_CHANGE"/);
  });
});

describe('FineTuneDrawer — external meetings', () => {
  test('renders 5 external options (0/30/60/90/120)', () => {
    const html = FineTuneDrawer({ capacityMinutes: 480 });
    for (const m of EXTERNAL_OPTIONS) {
      assert.match(html, new RegExp(`name="external"[^>]*value="${m}"`));
    }
  });

  test('EXTERNAL_OPTIONS equals 0/30/60/90/120', () => {
    assert.deepEqual(EXTERNAL_OPTIONS.slice(), [0, 30, 60, 90, 120]);
  });

  test('selected value is checked', () => {
    const html = FineTuneDrawer({
      capacityMinutes: 480,
      externalMinutesToday: 60
    });
    assert.match(html, /name="external"[^>]*value="60"[^/]*checked/);
  });

  test('default 0 is checked when omitted', () => {
    const html = FineTuneDrawer({ capacityMinutes: 480 });
    assert.match(html, /name="external"[^>]*value="0"[^/]*checked/);
  });
});

describe('FineTuneDrawer — project focus select', () => {
  test('No-focus option selected by default', () => {
    const html = FineTuneDrawer({ capacityMinutes: 480, activeKaizenId: null });
    assert.match(html, /<option[^>]*value=""[^>]*selected/);
  });

  test('lists available Kaizens as options', () => {
    const html = FineTuneDrawer({
      capacityMinutes: 480,
      availableKaizens: [
        { id: 'k_a', title: 'Kaizen A' },
        { id: 'k_b', title: 'Kaizen B' }
      ]
    });
    assert.match(html, /<option[^>]*value="k_a"/);
    assert.match(html, />Kaizen A</);
    assert.match(html, />Kaizen B</);
  });

  test('selects the active Kaizen', () => {
    const html = FineTuneDrawer({
      capacityMinutes: 480,
      activeKaizenId: 'k_b',
      availableKaizens: [
        { id: 'k_a', title: 'Kaizen A' },
        { id: 'k_b', title: 'Kaizen B' }
      ]
    });
    assert.match(html, /value="k_b"[^>]*selected/);
  });

  test('select carries PROJECT_FOCUS_CHANGE action', () => {
    const html = FineTuneDrawer({ capacityMinutes: 480 });
    assert.match(html, /<select[^>]*data-action="PROJECT_FOCUS_CHANGE"/);
  });
});

describe('FineTuneDrawer — XSS', () => {
  test('kaizen title escapes', () => {
    const html = FineTuneDrawer({
      capacityMinutes: 480,
      availableKaizens: [
        { id: 'k', title: '<img src=x onerror=alert(1)>' }
      ]
    });
    assert.ok(!html.includes('<img src=x'));
    assert.match(html, /&lt;img/);
  });
});
