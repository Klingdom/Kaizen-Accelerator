/**
 * Tests for Toast (Sprint 11 P0-T3).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { Toast, ToastKind } from '../../../js/ui/components/Toast.js';

describe('Toast — empty / degenerate cases', () => {
  test('null props → empty string', () => {
    assert.equal(Toast(null), '');
  });

  test('undefined props → empty string', () => {
    assert.equal(Toast(undefined), '');
  });

  test('non-object props → empty string', () => {
    assert.equal(Toast('hello'), '');
  });

  test('missing message → empty string', () => {
    assert.equal(Toast({ kind: 'SUCCESS' }), '');
  });

  test('empty-string message → empty string', () => {
    assert.equal(Toast({ kind: 'SUCCESS', message: '' }), '');
  });
});

describe('Toast — rendering', () => {
  test('SUCCESS kind renders with toast-success class', () => {
    const html = Toast({ kind: 'SUCCESS', message: 'Saved!' });
    assert.match(html, /class="toast toast-success"/);
    assert.match(html, /Saved!/);
  });

  test('ERROR kind renders with toast-error class', () => {
    const html = Toast({ kind: 'ERROR', message: 'Boom.' });
    assert.match(html, /class="toast toast-error"/);
    assert.match(html, /Boom\./);
  });

  test('INFO kind renders with toast-info class', () => {
    const html = Toast({ kind: 'INFO', message: 'FYI' });
    assert.match(html, /class="toast toast-info"/);
    assert.match(html, /FYI/);
  });

  test('unknown kind falls back to INFO', () => {
    const html = Toast({ kind: 'BOGUS', message: 'hi' });
    assert.match(html, /class="toast toast-info"/);
    assert.match(html, /data-toast-kind="INFO"/);
  });

  test('escapes HTML in the message', () => {
    const html = Toast({ kind: 'ERROR', message: '<script>alert(1)</script>' });
    assert.ok(!html.includes('<script>alert(1)</script>'));
    assert.match(html, /&lt;script&gt;/);
  });

  test('renders a dismiss button wired to TOAST_DISMISS', () => {
    const html = Toast({ kind: 'SUCCESS', message: 'ok' });
    assert.match(html, /data-action="TOAST_DISMISS"/);
    assert.match(html, /aria-label="Dismiss"/);
  });

  test('dismiss button has a visible × glyph', () => {
    const html = Toast({ kind: 'SUCCESS', message: 'ok' });
    assert.match(html, />×</);
  });

  test('SUCCESS uses role=status with aria-live=polite', () => {
    const html = Toast({ kind: 'SUCCESS', message: 'ok' });
    assert.match(html, /role="status"/);
    assert.match(html, /aria-live="polite"/);
  });

  test('ERROR uses role=alert with aria-live=assertive', () => {
    const html = Toast({ kind: 'ERROR', message: 'bad' });
    assert.match(html, /role="alert"/);
    assert.match(html, /aria-live="assertive"/);
  });

  test('data-toast-kind attribute present', () => {
    const html = Toast({ kind: 'SUCCESS', message: 'ok' });
    assert.match(html, /data-toast-kind="SUCCESS"/);
  });
});

describe('ToastKind export', () => {
  test('exposes SUCCESS / ERROR / INFO', () => {
    assert.equal(ToastKind.SUCCESS, 'SUCCESS');
    assert.equal(ToastKind.ERROR, 'ERROR');
    assert.equal(ToastKind.INFO, 'INFO');
  });

  test('is frozen', () => {
    assert.throws(() => {
      ToastKind.FOO = 'foo';
    });
  });
});
