/**
 * KaizenCloseDialog — Sprint 8 P1-T1.
 *
 * Pure render. Modal for closing a Kaizen in IN_REMEASUREMENT. Shows a
 * read-only summary of baseline + remeasurement + computed closeKind, then
 * requires a lessonsLearned textarea (min 20 chars).
 *
 * Fields:
 *   lessonsLearned  (20+ chars, textarea)
 *
 * Buttons:
 *   "Close Kaizen"  — primary, dispatches SUBMIT_CLOSE_KAIZEN_DIALOG
 *   "Cancel"        — dispatches CLOSE_CLOSE_KAIZEN_DIALOG
 */

import { esc } from '../mount.js';
import { KaizenService } from '../../services/KaizenService.js';

export const KAIZEN_CLOSE_DIALOG_COPY = Object.freeze({
  TITLE: 'Close Kaizen',
  SUBTITLE: 'Once closed, the Kaizen becomes a read-only record in your portfolio.',
  LESSONS_LABEL: 'Lessons learned (min 20 chars)',
  LESSONS_HINT: 'What worked? What would you do differently next time?',
  SUBMIT: 'Close Kaizen',
  CANCEL: 'Cancel',
  EXPLAIN_SUCCESS: 'Success: beats baseline AND hits target improvement.',
  EXPLAIN_PARTIAL: 'Partial win: some improvement, but below target (or no target set).',
  EXPLAIN_FAILED: 'Failed honest: no improvement (or worse). Capture lessons and move on.'
});

export const LESSONS_LEARNED_MIN = 20;

const CLOSE_KIND_EXPLANATIONS = Object.freeze({
  SUCCESS: KAIZEN_CLOSE_DIALOG_COPY.EXPLAIN_SUCCESS,
  PARTIAL: KAIZEN_CLOSE_DIALOG_COPY.EXPLAIN_PARTIAL,
  FAILED_HONEST: KAIZEN_CLOSE_DIALOG_COPY.EXPLAIN_FAILED
});

/**
 * @param {{
 *   kaizen: object,
 *   baseline: object,
 *   remeasurement: object,
 *   lessonsLearned?: string,
 *   errorName?: string|null,
 *   errorMessage?: string|null
 * }} props
 * @returns {string}
 */
export function KaizenCloseDialog(props = {}) {
  const kaizen = props.kaizen;
  const baseline = props.baseline;
  const remeasurement = props.remeasurement;
  if (!kaizen || !baseline || !remeasurement) {
    return `<section class="kcd-modal kcd-modal-missing" role="dialog">
      <p class="kcd-error">Cannot close — missing baseline or remeasurement.</p>
      <button type="button" class="kcd-cancel" data-action="CLOSE_CLOSE_KAIZEN_DIALOG">Dismiss</button>
    </section>`;
  }

  const lessonsLearned = typeof props.lessonsLearned === 'string'
    ? props.lessonsLearned
    : '';
  const charCount = lessonsLearned.length;
  const errorName = props.errorName ?? null;
  const errorMessage = props.errorMessage ?? null;

  const closeKind = KaizenService.deriveCloseKind(
    remeasurement,
    kaizen.targetImprovement
  );
  const explain = CLOSE_KIND_EXPLANATIONS[closeKind] ?? '';
  const badgeClass = `kcd-badge kcd-badge-${esc(closeKind.toLowerCase())}`;

  const payload = esc(JSON.stringify({ kaizenId: kaizen.id }));
  const md = baseline.metricDefinition ?? {};

  const errorHtml = errorName
    ? `<p class="kcd-error" data-error-name="${esc(errorName)}">${esc(errorMessage || errorName)}</p>`
    : '';

  const pctPart =
    remeasurement.deltaPercent === null
      ? ' (baseline=0; % N/A)'
      : ` (${remeasurement.deltaPercent >= 0 ? '+' : ''}${formatNum(remeasurement.deltaPercent)}%)`;
  const signedAbs =
    (remeasurement.deltaAbsolute >= 0 ? '+' : '') + formatNum(remeasurement.deltaAbsolute);

  return `<section class="kcd-modal" role="dialog" aria-modal="true" data-dialog="close-kaizen" data-kaizen-id="${esc(kaizen.id)}">
  <form class="kcd-form" data-action="SUBMIT_CLOSE_KAIZEN_DIALOG" data-payload='${payload}'>
    <header class="kcd-header">
      <h2 class="kcd-title">${esc(KAIZEN_CLOSE_DIALOG_COPY.TITLE)}</h2>
      <p class="kcd-subtitle">${esc(KAIZEN_CLOSE_DIALOG_COPY.SUBTITLE)}</p>
    </header>
    ${errorHtml}
    <section class="kcd-summary">
      <h3 class="kcd-sub">${esc(kaizen.title || 'Untitled Kaizen')}</h3>
      <p class="kcd-problem">${esc(kaizen.problemStatement ?? '')}</p>
      <dl class="kcd-meta">
        <dt>Metric</dt><dd>${esc(md.name ?? '')} (${esc(md.unit ?? '')})</dd>
        <dt>Baseline</dt><dd>${esc(formatNum(baseline.value))} · ${esc(baseline.capturedAt ?? '')}</dd>
        <dt>Remeasurement</dt><dd>${esc(formatNum(remeasurement.value))} · ${esc(remeasurement.capturedAt ?? '')}</dd>
        <dt>Delta</dt><dd>${esc(signedAbs)} ${esc(md.unit ?? '')}${esc(pctPart)}</dd>
        <dt>Beats baseline</dt><dd>${remeasurement.beatsBaseline ? 'Yes' : 'No'}</dd>
      </dl>
      <p class="kcd-preview">
        Close kind: <span class="${badgeClass}" data-close-kind="${esc(closeKind)}">${esc(closeKind)}</span>
        <span class="kcd-explain">${esc(explain)}</span>
      </p>
    </section>
    <label class="kcd-label">
      <span class="kcd-label-text">${esc(KAIZEN_CLOSE_DIALOG_COPY.LESSONS_LABEL)}</span>
      <textarea class="kcd-textarea" name="lessonsLearned" rows="4" minlength="${LESSONS_LEARNED_MIN}" required placeholder="${esc(KAIZEN_CLOSE_DIALOG_COPY.LESSONS_HINT)}">${esc(lessonsLearned)}</textarea>
      <span class="kcd-counter" data-char-count="${esc(String(charCount))}">${esc(String(charCount))} / ${esc(String(LESSONS_LEARNED_MIN))} min</span>
    </label>
    <footer class="kcd-footer">
      <button type="button" class="kcd-cancel" data-action="CLOSE_CLOSE_KAIZEN_DIALOG">${esc(KAIZEN_CLOSE_DIALOG_COPY.CANCEL)}</button>
      <button type="submit" class="kcd-submit">${esc(KAIZEN_CLOSE_DIALOG_COPY.SUBMIT)}</button>
    </footer>
  </form>
</section>`;
}

function formatNum(n) {
  if (n === null || n === undefined) return '';
  if (!Number.isFinite(Number(n))) return String(n);
  const rounded = Math.round(Number(n) * 10000) / 10000;
  return String(rounded);
}

export default KaizenCloseDialog;
