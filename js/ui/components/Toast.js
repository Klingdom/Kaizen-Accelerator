/**
 * Toast — dismissible status banner (Sprint 11 P0-T3).
 *
 * Pure render. Fixed-position overlay shown above the page content when
 * `state.toast` is non-null. Auto-dismisses in the app.js handler via
 * `setTimeout`; click × to dismiss immediately.
 *
 * Render contract:
 *   - Null / undefined props → empty string (nothing overlays the page).
 *   - Known kinds: `SUCCESS`, `ERROR`, `INFO`. Unknown kinds fall back to
 *     `INFO` so the caller can't break the page with a typo.
 *
 * Events:
 *   TOAST_DISMISS — click × button
 */

import { esc } from '../mount.js';

/**
 * Toast kind constants (mirrored in app.js and Toast tests).
 */
export const ToastKind = Object.freeze({
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR',
  INFO: 'INFO'
});

const KIND_CLASS = Object.freeze({
  SUCCESS: 'toast-success',
  ERROR: 'toast-error',
  INFO: 'toast-info'
});

const KIND_ARIA_ROLE = Object.freeze({
  SUCCESS: 'status',
  ERROR: 'alert',
  INFO: 'status'
});

/**
 * @param {{kind?: string, message?: string} | null | undefined} props
 * @returns {string}
 */
export function Toast(props) {
  if (!props || typeof props !== 'object') return '';
  const rawKind = typeof props.kind === 'string' ? props.kind : ToastKind.INFO;
  const kind = KIND_CLASS[rawKind] ? rawKind : ToastKind.INFO;
  const message = typeof props.message === 'string' ? props.message : '';
  if (message.length === 0) return '';
  const cls = KIND_CLASS[kind];
  const role = KIND_ARIA_ROLE[kind];
  // aria-live polite for status, assertive for alert — browsers already
  // announce `role="alert"` assertively; we pin it for belt-and-braces.
  const ariaLive = kind === ToastKind.ERROR ? 'assertive' : 'polite';
  return `<aside class="toast ${esc(cls)}" role="${esc(role)}" aria-live="${esc(ariaLive)}" data-toast-kind="${esc(kind)}">
    <div class="toast-body">${esc(message)}</div>
    <button type="button" class="toast-dismiss" aria-label="Dismiss" data-action="TOAST_DISMISS" data-payload='{}'>×</button>
  </aside>`;
}

export default Toast;
