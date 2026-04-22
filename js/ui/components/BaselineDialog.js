/**
 * BaselineDialog — Sprint 8 P0-T7.
 *
 * Pure render. Modal form that replaces the Sprint 6 `globalThis.prompt()`
 * stub for KAIZEN_LOCK_BASELINE. Collects the full MetricDefinition + the
 * Sprint 8 `metricDirection` field + optional `targetImprovement`, then
 * submits via SUBMIT_BASELINE_DIALOG.
 *
 * Fields:
 *   metricName              (3-60 chars)
 *   unit                    (1-20 chars)
 *   operationalDefinition   (20-500 chars, textarea)
 *   sampleSize              (positive integer)
 *   method                  (textarea)
 *   value                   (finite number, baseline reading)
 *   metricDirection         (radio; higher_is_better default)
 *   targetImprovement       (optional finite number)
 *
 * Buttons:
 *   "Lock Baseline"  — primary, submits form
 *   "Cancel"         — dispatches CLOSE_BASELINE_DIALOG
 *
 * Service validation (KaizenService.lockBaseline) is authoritative; this
 * UI is convenience. On submit `extractBaselineFields` normalizes the raw
 * field map into the shape lockBaseline() expects.
 */

import { esc } from '../mount.js';
import { MetricDirection } from '../../domain/types.js';

export const BASELINE_DIALOG_COPY = Object.freeze({
  TITLE: 'Lock the baseline',
  SUBTITLE: 'Baselines are immutable once locked — be honest about how you will measure.',
  METRIC_NAME_LABEL: 'Metric name',
  METRIC_NAME_HINT: 'e.g. "Cycle time in days"',
  UNIT_LABEL: 'Unit',
  UNIT_HINT: 'e.g. "days", "defects/1000"',
  OPERATIONAL_LABEL: 'Operational definition',
  OPERATIONAL_HINT: 'How is this measured, exactly? Who, when, with what tool?',
  SAMPLE_LABEL: 'Sample size',
  SAMPLE_HINT: 'e.g. 30 observations',
  METHOD_LABEL: 'Measurement method',
  METHOD_HINT: 'e.g. "Extract from Jira tickets with status=Done in last 30 days."',
  VALUE_LABEL: 'Baseline value',
  DIRECTION_LABEL: 'Metric direction',
  DIRECTION_HIGHER: 'Higher is better (e.g. throughput, adherence)',
  DIRECTION_LOWER: 'Lower is better (e.g. cycle time, defect rate)',
  TARGET_LABEL: 'Target improvement (optional)',
  TARGET_HINT: 'Absolute delta you aim to achieve. Used to derive closeKind.',
  SUBMIT: 'Lock Baseline',
  CANCEL: 'Cancel',
  IRREVERSIBLE_WARNING: 'Locking the baseline transitions this Kaizen to ACTIVE. You cannot edit the baseline after lock.'
});

export const BASELINE_LIMITS = Object.freeze({
  METRIC_NAME_MIN: 3,
  METRIC_NAME_MAX: 60,
  UNIT_MIN: 1,
  UNIT_MAX: 20,
  OPERATIONAL_MIN: 20,
  OPERATIONAL_MAX: 500,
  SAMPLE_MIN: 1
});

/**
 * @param {{
 *   kaizenId: string,
 *   metricName?: string,
 *   unit?: string,
 *   operationalDefinition?: string,
 *   sampleSize?: number|string,
 *   method?: string,
 *   value?: number|string,
 *   metricDirection?: string,
 *   targetImprovement?: number|string|null,
 *   errorName?: string|null,
 *   errorMessage?: string|null
 * }} props
 * @returns {string}
 */
export function BaselineDialog(props = {}) {
  const kaizenId = props.kaizenId ?? '';
  const metricName = props.metricName ?? '';
  const unit = props.unit ?? '';
  const operationalDefinition = props.operationalDefinition ?? '';
  const sampleSize = props.sampleSize ?? '';
  const method = props.method ?? '';
  const value = props.value ?? '';
  const targetImprovement = props.targetImprovement ?? '';
  const metricDirection =
    props.metricDirection === MetricDirection.LOWER_IS_BETTER
      ? MetricDirection.LOWER_IS_BETTER
      : MetricDirection.HIGHER_IS_BETTER;
  const errorName = props.errorName ?? null;
  const errorMessage = props.errorMessage ?? null;

  const payload = esc(JSON.stringify({ kaizenId }));
  const higherChecked =
    metricDirection === MetricDirection.HIGHER_IS_BETTER ? 'checked' : '';
  const lowerChecked =
    metricDirection === MetricDirection.LOWER_IS_BETTER ? 'checked' : '';

  const errorHtml = errorName
    ? `<p class="bd-error" data-error-name="${esc(errorName)}">${esc(errorMessage || errorName)}</p>`
    : '';

  return `<section class="bd-modal" role="dialog" aria-modal="true" data-dialog="baseline" data-kaizen-id="${esc(kaizenId)}">
  <form class="bd-form" data-action="SUBMIT_BASELINE_DIALOG" data-payload='${payload}'>
    <header class="bd-header">
      <h2 class="bd-title">${esc(BASELINE_DIALOG_COPY.TITLE)}</h2>
      <p class="bd-subtitle">${esc(BASELINE_DIALOG_COPY.SUBTITLE)}</p>
    </header>
    ${errorHtml}
    <label class="bd-label">
      <span class="bd-label-text">${esc(BASELINE_DIALOG_COPY.METRIC_NAME_LABEL)}</span>
      <input class="bd-input" type="text" name="metricName" minlength="${BASELINE_LIMITS.METRIC_NAME_MIN}" maxlength="${BASELINE_LIMITS.METRIC_NAME_MAX}" required value="${esc(metricName)}" placeholder="${esc(BASELINE_DIALOG_COPY.METRIC_NAME_HINT)}" />
    </label>
    <label class="bd-label">
      <span class="bd-label-text">${esc(BASELINE_DIALOG_COPY.UNIT_LABEL)}</span>
      <input class="bd-input" type="text" name="unit" minlength="${BASELINE_LIMITS.UNIT_MIN}" maxlength="${BASELINE_LIMITS.UNIT_MAX}" required value="${esc(unit)}" placeholder="${esc(BASELINE_DIALOG_COPY.UNIT_HINT)}" />
    </label>
    <label class="bd-label">
      <span class="bd-label-text">${esc(BASELINE_DIALOG_COPY.OPERATIONAL_LABEL)}</span>
      <textarea class="bd-textarea" name="operationalDefinition" rows="3" minlength="${BASELINE_LIMITS.OPERATIONAL_MIN}" maxlength="${BASELINE_LIMITS.OPERATIONAL_MAX}" required placeholder="${esc(BASELINE_DIALOG_COPY.OPERATIONAL_HINT)}">${esc(operationalDefinition)}</textarea>
    </label>
    <label class="bd-label">
      <span class="bd-label-text">${esc(BASELINE_DIALOG_COPY.SAMPLE_LABEL)}</span>
      <input class="bd-input" type="number" name="sampleSize" min="1" step="1" required value="${esc(String(sampleSize))}" placeholder="${esc(BASELINE_DIALOG_COPY.SAMPLE_HINT)}" />
    </label>
    <label class="bd-label">
      <span class="bd-label-text">${esc(BASELINE_DIALOG_COPY.METHOD_LABEL)}</span>
      <textarea class="bd-textarea" name="method" rows="2" required placeholder="${esc(BASELINE_DIALOG_COPY.METHOD_HINT)}">${esc(method)}</textarea>
    </label>
    <label class="bd-label">
      <span class="bd-label-text">${esc(BASELINE_DIALOG_COPY.VALUE_LABEL)}</span>
      <input class="bd-input" type="number" name="value" step="any" required value="${esc(String(value))}" />
    </label>
    <fieldset class="bd-fieldset">
      <legend class="bd-legend">${esc(BASELINE_DIALOG_COPY.DIRECTION_LABEL)}</legend>
      <label class="bd-radio">
        <input type="radio" name="metricDirection" value="higher_is_better" ${higherChecked} />
        <span>${esc(BASELINE_DIALOG_COPY.DIRECTION_HIGHER)}</span>
      </label>
      <label class="bd-radio">
        <input type="radio" name="metricDirection" value="lower_is_better" ${lowerChecked} />
        <span>${esc(BASELINE_DIALOG_COPY.DIRECTION_LOWER)}</span>
      </label>
    </fieldset>
    <label class="bd-label">
      <span class="bd-label-text">${esc(BASELINE_DIALOG_COPY.TARGET_LABEL)}</span>
      <input class="bd-input" type="number" name="targetImprovement" step="any" value="${esc(String(targetImprovement))}" placeholder="${esc(BASELINE_DIALOG_COPY.TARGET_HINT)}" />
    </label>
    <p class="bd-warning">${esc(BASELINE_DIALOG_COPY.IRREVERSIBLE_WARNING)}</p>
    <footer class="bd-footer">
      <button type="button" class="bd-cancel" data-action="CLOSE_BASELINE_DIALOG">${esc(BASELINE_DIALOG_COPY.CANCEL)}</button>
      <button type="submit" class="bd-submit">${esc(BASELINE_DIALOG_COPY.SUBMIT)}</button>
    </footer>
  </form>
</section>`;
}

/**
 * Normalize a raw name→value field map from `extractFormFields()` into the
 * shape KaizenService.lockBaseline() expects. Numeric fields are coerced
 * here (strings → numbers) so the service can enforce its own finite-number
 * checks.
 *
 * @param {Record<string, string>} fields
 * @returns {{
 *   metricName: string,
 *   unit: string,
 *   operationalDefinition: string,
 *   sampleSize: number,
 *   method: string,
 *   value: number,
 *   metricDirection: string,
 *   targetImprovement: number|null
 * }}
 */
export function extractBaselineFields(fields = {}) {
  const f = fields && typeof fields === 'object' ? fields : {};
  const direction = f.metricDirection === MetricDirection.LOWER_IS_BETTER
    ? MetricDirection.LOWER_IS_BETTER
    : MetricDirection.HIGHER_IS_BETTER;
  const targetRaw = f.targetImprovement;
  const targetNum = targetRaw === undefined || targetRaw === null || targetRaw === ''
    ? null
    : Number(targetRaw);
  return {
    metricName: String(f.metricName ?? '').trim(),
    unit: String(f.unit ?? '').trim(),
    operationalDefinition: String(f.operationalDefinition ?? '').trim(),
    sampleSize: Number(f.sampleSize),
    method: String(f.method ?? '').trim(),
    value: Number(f.value),
    metricDirection: direction,
    targetImprovement:
      targetNum !== null && Number.isFinite(targetNum) ? targetNum : null
  };
}

export default BaselineDialog;
