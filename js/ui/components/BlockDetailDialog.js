/**
 * BlockDetailDialog — lightweight activity-detail popover (Iter 30).
 *
 * Pure render. Returns an HTML string. No DOM access. Anchored or centered
 * overlay; not a full-screen modal per the locked design decision.
 *
 * Props:
 *   activity       object  — ScheduledActivity row (required)
 *   kaizenTitle?   string  — resolved kaizen title (from kaizenTitleById)
 *   outputArtifact? object — resolved outputArtifact def from catalog entry
 *
 * Locked decisions (Iter 30 brief):
 *   - Protected blocks: Edit button rendered DISABLED with explanatory aria-label.
 *   - Edit button action: dispatches CLOSE_BLOCK_DETAIL then EDIT + EDIT_SELECT_SLOT
 *     via a dedicated BLOCK_DETAIL_EDIT action handled in app.js.
 *   - Close button: dispatches CLOSE_BLOCK_DETAIL.
 *   - ARIA: role="dialog" + aria-modal="true" + aria-labelledby referencing the
 *     activity name heading (id="bdd-title").
 *
 * §6.5 boundary: js/ui/components/ — frontend only.
 */

import { esc } from '../mount.js';
import { formatTimeRange } from '../timeFormat.js';
import bucketMeta from '../bucketMeta.js';
import { isProtectedBlock } from '../editMode.js';

/**
 * BlockDetailDialog component.
 *
 * @param {{
 *   activity:        object,
 *   kaizenTitle?:    string | null,
 *   outputArtifact?: object | null
 * }} props
 * @returns {string}
 */
export function BlockDetailDialog(props = {}) {
  const activity = props.activity ?? null;
  if (!activity || typeof activity !== 'object') return '';

  const kaizenTitle = typeof props.kaizenTitle === 'string' && props.kaizenTitle.length > 0
    ? props.kaizenTitle
    : null;
  const outputArtifact = props.outputArtifact ?? null;

  // --- Activity data ---
  const name = activity.name ?? activity.catalogEntryId ?? '(unnamed)';
  const activityId = activity.id ?? '';
  const bucket = activity.bucket ?? null;
  const meta = bucketMeta(bucket);
  const bucketLabel = bucket ? meta.label : 'Unscheduled';
  const bucketChipClass = bucket ? meta.chipClass : 'chip-unknown';

  // Time range.
  const startValue = activity.plannedStartAt ?? activity.anchor ?? null;
  const dur = Number(activity.plannedDurationMinutes ?? 0);
  const timeRange = startValue ? formatTimeRange(startValue, dur) : '—';

  // Duration label.
  const durationLabel = dur > 0 ? `${dur} min` : '—';

  // Expected output — graceful fallback.
  const outputName = outputArtifact
    ? (outputArtifact.name ?? outputArtifact.kind ?? outputArtifact.schema ?? '—')
    : '—';

  // Protected block treatment.
  const protected_ = isProtectedBlock(activity);
  const editPayload = esc(JSON.stringify({ activityId }));
  const closePayload = esc(JSON.stringify({}));

  // Edit button — disabled with explanatory aria-label for protected blocks.
  const editBtn = protected_
    ? `<button
        class="bdd-btn bdd-btn-edit"
        disabled
        aria-label="This block is required for your daily rhythm"
        aria-disabled="true"
      >Edit</button>`
    : `<button
        class="bdd-btn bdd-btn-edit"
        data-action="BLOCK_DETAIL_EDIT"
        data-payload='${editPayload}'
        aria-label="Edit this activity"
      >Edit</button>`;

  // Kaizen chip — only when linked.
  const kaizenChip = kaizenTitle
    ? `<span class="bdd-kaizen-chip chip-ci" aria-label="part of Kaizen ${esc(kaizenTitle)}">${esc(kaizenTitle)}</span>`
    : '';

  // Iter 33: bucket color accent bar at top of dialog (AC13).
  const colorBarClass = bucket ? `bdd-color-bar bdd-color-bar-${bucketChipClass.replace('chip-', '')}` : '';
  const colorBar = colorBarClass ? `<div class="${esc(colorBarClass)}" aria-hidden="true"></div>` : '';

  return `<section
  class="bdd-modal"
  role="dialog"
  aria-modal="true"
  aria-labelledby="bdd-title"
  data-activity-id="${esc(activityId)}"
>
  <div class="bdd-backdrop" data-action="CLOSE_BLOCK_DETAIL" data-payload='${closePayload}' aria-hidden="true"></div>
  <div class="bdd-panel">
    ${colorBar}
    <header class="bdd-header">
      <h2 class="bdd-title" id="bdd-title">${esc(name)}</h2>
      <button
        class="bdd-btn bdd-btn-close"
        data-action="CLOSE_BLOCK_DETAIL"
        data-payload='${closePayload}'
        aria-label="Close activity detail"
      >&times;</button>
    </header>
    <dl class="bdd-body">
      <div class="bdd-row">
        <dt class="bdd-label">Bucket</dt>
        <dd class="bdd-value">
          <span class="bdd-chip ${esc(bucketChipClass)}">${esc(bucketLabel)}</span>
        </dd>
      </div>
      <div class="bdd-row">
        <dt class="bdd-label">Time</dt>
        <dd class="bdd-value bdd-time">${esc(timeRange)}</dd>
      </div>
      <div class="bdd-row">
        <dt class="bdd-label">Duration</dt>
        <dd class="bdd-value">${esc(durationLabel)}</dd>
      </div>
      <div class="bdd-row">
        <dt class="bdd-label">Expected output</dt>
        <dd class="bdd-value bdd-output">${esc(outputName)}</dd>
      </div>${kaizenChip ? `
      <div class="bdd-row bdd-row-kaizen">
        <dt class="bdd-label">Kaizen</dt>
        <dd class="bdd-value">${kaizenChip}</dd>
      </div>` : ''}
    </dl>
    <footer class="bdd-footer">
      ${editBtn}
    </footer>
  </div>
</section>`;
}

export default BlockDetailDialog;
