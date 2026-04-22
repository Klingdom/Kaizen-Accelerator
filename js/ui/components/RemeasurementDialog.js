/**
 * RemeasurementDialog — Sprint 8 P0-T8.
 *
 * Pure render. Modal for capturing the Remeasurement reading on a Kaizen
 * in IN_REMEASUREMENT (or ACTIVE — app.js calls startRemeasurement first).
 *
 * Reads baseline metric metadata (read-only) and emits a live preview of
 * delta + beatsBaseline on the rendered HTML. The preview is computed at
 * render time from the most recently-submitted `currentValue` prop so it
 * matches the service-side derivation EXACTLY (no separate UI logic).
 *
 * Fields:
 *   currentValue             (finite number, same unit as baseline)
 *   evidenceSchema           (optional: TEXT / DOCUMENT / CHART)
 *   evidenceValue            (optional: URL or free text, depending on schema)
 *
 * Buttons:
 *   "Capture Remeasurement"  — primary
 *   "Cancel"                 — dispatches CLOSE_REMEASUREMENT_DIALOG
 */

import { esc } from '../mount.js';
import { MetricDirection } from '../../domain/types.js';

export const REMEASUREMENT_DIALOG_COPY = Object.freeze({
  TITLE: 'Capture Remeasurement',
  SUBTITLE: 'Capture the SAME metric you baselined. Evidence optional but encouraged.',
  BASELINE_REF_HEADING: 'Baseline (locked)',
  CURRENT_VALUE_LABEL: 'Current value',
  EVIDENCE_SCHEMA_LABEL: 'Evidence type (optional)',
  EVIDENCE_VALUE_LABEL: 'Evidence value (optional)',
  SUBMIT: 'Capture Remeasurement',
  CANCEL: 'Cancel',
  PREVIEW_NO_VALUE: 'Enter a value to preview the delta.'
});

export const EVIDENCE_SCHEMAS = Object.freeze(['TEXT', 'DOCUMENT', 'CHART']);

/**
 * Compute the preview delta + beatsBaseline for a prospective current value
 * against a baseline. Mirrors KaizenService.captureRemeasurement exactly.
 *
 * Returns null if any input is non-finite / missing.
 *
 * @param {number} baselineValue
 * @param {number} currentValue
 * @param {string} metricDirection
 * @returns {{
 *   deltaAbsolute: number,
 *   deltaPercent: number|null,
 *   beatsBaseline: boolean
 * } | null}
 */
export function computeRemeasurementPreview(
  baselineValue,
  currentValue,
  metricDirection
) {
  const b = Number(baselineValue);
  const v = Number(currentValue);
  if (!Number.isFinite(b) || !Number.isFinite(v)) return null;
  const deltaAbsolute = v - b;
  const deltaPercent = b === 0 ? null : (deltaAbsolute / b) * 100;
  const direction = metricDirection === MetricDirection.LOWER_IS_BETTER
    ? MetricDirection.LOWER_IS_BETTER
    : MetricDirection.HIGHER_IS_BETTER;
  const beatsBaseline =
    direction === MetricDirection.HIGHER_IS_BETTER
      ? deltaAbsolute > 0
      : deltaAbsolute < 0;
  return { deltaAbsolute, deltaPercent, beatsBaseline };
}

/**
 * @param {{
 *   kaizenId: string,
 *   baseline: {
 *     value: number,
 *     metricDefinition: {name: string, unit: string, operationalDefinition: string}
 *   },
 *   metricDirection?: string,
 *   currentValue?: number|string,
 *   evidenceSchema?: string,
 *   evidenceValue?: string,
 *   errorName?: string|null,
 *   errorMessage?: string|null
 * }} props
 * @returns {string}
 */
export function RemeasurementDialog(props = {}) {
  const kaizenId = props.kaizenId ?? '';
  const baseline = props.baseline ?? null;
  const currentValue = props.currentValue ?? '';
  const evidenceSchema = EVIDENCE_SCHEMAS.includes(props.evidenceSchema)
    ? props.evidenceSchema
    : '';
  const evidenceValue = props.evidenceValue ?? '';
  const metricDirection = props.metricDirection === MetricDirection.LOWER_IS_BETTER
    ? MetricDirection.LOWER_IS_BETTER
    : MetricDirection.HIGHER_IS_BETTER;
  const errorName = props.errorName ?? null;
  const errorMessage = props.errorMessage ?? null;

  const payload = esc(JSON.stringify({ kaizenId }));
  const md = baseline?.metricDefinition ?? {};
  const baselineValue = Number(baseline?.value);
  const baselineUnit = md.unit ?? '';
  const currentNum = currentValue === '' || currentValue === null || currentValue === undefined
    ? NaN
    : Number(currentValue);

  const preview = computeRemeasurementPreview(
    baselineValue,
    currentNum,
    metricDirection
  );
  const previewHtml = renderPreview(baselineValue, baselineUnit, preview);

  const schemaOptions = ['', ...EVIDENCE_SCHEMAS]
    .map((s) => {
      const selected = s === evidenceSchema ? 'selected' : '';
      const label = s === '' ? '(none)' : s;
      return `<option value="${esc(s)}" ${selected}>${esc(label)}</option>`;
    })
    .join('\n');

  const errorHtml = errorName
    ? `<p class="rd-error" data-error-name="${esc(errorName)}">${esc(errorMessage || errorName)}</p>`
    : '';

  return `<section class="rd-modal" role="dialog" aria-modal="true" data-dialog="remeasurement" data-kaizen-id="${esc(kaizenId)}">
  <form class="rd-form" data-action="SUBMIT_REMEASUREMENT_DIALOG" data-payload='${payload}'>
    <header class="rd-header">
      <h2 class="rd-title">${esc(REMEASUREMENT_DIALOG_COPY.TITLE)}</h2>
      <p class="rd-subtitle">${esc(REMEASUREMENT_DIALOG_COPY.SUBTITLE)}</p>
    </header>
    ${errorHtml}
    ${renderBaselineRef(baseline)}
    <label class="rd-label">
      <span class="rd-label-text">${esc(REMEASUREMENT_DIALOG_COPY.CURRENT_VALUE_LABEL)} <span class="rd-unit">(${esc(baselineUnit)})</span></span>
      <input class="rd-input" type="number" name="currentValue" step="any" required value="${esc(String(currentValue))}" data-action="REMEASUREMENT_PREVIEW_CHANGE" data-payload='${payload}' />
    </label>
    <label class="rd-label">
      <span class="rd-label-text">${esc(REMEASUREMENT_DIALOG_COPY.EVIDENCE_SCHEMA_LABEL)}</span>
      <select class="rd-select" name="evidenceSchema">
        ${schemaOptions}
      </select>
    </label>
    <label class="rd-label">
      <span class="rd-label-text">${esc(REMEASUREMENT_DIALOG_COPY.EVIDENCE_VALUE_LABEL)}</span>
      <input class="rd-input" type="text" name="evidenceValue" value="${esc(evidenceValue)}" placeholder="URL, doc title, or free text" />
    </label>
    ${previewHtml}
    <footer class="rd-footer">
      <button type="button" class="rd-cancel" data-action="CLOSE_REMEASUREMENT_DIALOG">${esc(REMEASUREMENT_DIALOG_COPY.CANCEL)}</button>
      <button type="submit" class="rd-submit">${esc(REMEASUREMENT_DIALOG_COPY.SUBMIT)}</button>
    </footer>
  </form>
</section>`;
}

/**
 * Render the read-only baseline reference block.
 *
 * @param {object|null} baseline
 * @returns {string}
 */
function renderBaselineRef(baseline) {
  if (!baseline) {
    return `<section class="rd-baseline-missing"><p>Baseline missing.</p></section>`;
  }
  const md = baseline.metricDefinition ?? {};
  return `<section class="rd-baseline-ref">
    <h3 class="rd-baseline-heading">${esc(REMEASUREMENT_DIALOG_COPY.BASELINE_REF_HEADING)}</h3>
    <dl class="rd-baseline-meta">
      <dt>Metric</dt><dd>${esc(md.name ?? '')}</dd>
      <dt>Unit</dt><dd>${esc(md.unit ?? '')}</dd>
      <dt>Baseline value</dt><dd>${esc(String(baseline.value ?? ''))}</dd>
      <dt>Operational definition</dt><dd class="rd-op-def">${esc(md.operationalDefinition ?? '')}</dd>
    </dl>
  </section>`;
}

/**
 * Render the live preview block.
 *
 * @param {number} baselineValue
 * @param {string} unit
 * @param {null|{deltaAbsolute: number, deltaPercent: number|null, beatsBaseline: boolean}} preview
 * @returns {string}
 */
function renderPreview(baselineValue, unit, preview) {
  if (!preview) {
    return `<p class="rd-preview rd-preview-empty">${esc(REMEASUREMENT_DIALOG_COPY.PREVIEW_NO_VALUE)}</p>`;
  }
  const signedDelta =
    (preview.deltaAbsolute >= 0 ? '+' : '') + formatNumber(preview.deltaAbsolute);
  const pctPart =
    preview.deltaPercent === null
      ? ' (baseline = 0; % N/A)'
      : ` (${preview.deltaPercent >= 0 ? '+' : ''}${formatNumber(preview.deltaPercent)}%)`;
  const beats = preview.beatsBaseline ? 'YES' : 'NO';
  const cls = preview.beatsBaseline ? 'rd-preview rd-preview-beats' : 'rd-preview rd-preview-miss';
  return `<p class="${cls}" data-beats-baseline="${esc(String(preview.beatsBaseline))}">
    Baseline ${esc(formatNumber(baselineValue))} ${esc(unit)} → current value. Delta ${esc(signedDelta)} ${esc(unit)}${esc(pctPart)}.
    Beats baseline: <strong>${esc(beats)}</strong>.
  </p>`;
}

/**
 * Format a number with up to 4 significant fractional digits, trimming
 * trailing zeroes.
 *
 * @param {number} n
 * @returns {string}
 */
function formatNumber(n) {
  if (!Number.isFinite(n)) return String(n);
  const rounded = Math.round(n * 10000) / 10000;
  return String(rounded);
}

/**
 * Normalize a raw name→value field map from extractFormFields() into the
 * shape captureRemeasurement() expects.
 *
 * @param {Record<string, string>} fields
 * @returns {{value: number, evidenceRef: object|null}}
 */
export function extractRemeasurementFields(fields = {}) {
  const f = fields && typeof fields === 'object' ? fields : {};
  const value = Number(f.currentValue);
  const schema = EVIDENCE_SCHEMAS.includes(f.evidenceSchema)
    ? f.evidenceSchema
    : null;
  const raw = typeof f.evidenceValue === 'string' ? f.evidenceValue.trim() : '';
  const evidenceRef = schema && raw.length > 0
    ? { schema, value: raw }
    : null;
  return { value, evidenceRef };
}

export default RemeasurementDialog;
