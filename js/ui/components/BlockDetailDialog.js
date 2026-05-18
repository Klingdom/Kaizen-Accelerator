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
 * Iter 30 locked decisions:
 *   - Edit button action: dispatches CLOSE_BLOCK_DETAIL then EDIT + EDIT_SELECT_SLOT
 *     via a dedicated BLOCK_DETAIL_EDIT action handled in app.js.
 *   - Close button: dispatches CLOSE_BLOCK_DETAIL.
 *   - ARIA: role="dialog" + aria-modal="true" + aria-labelledby referencing the
 *     activity name heading (id="bdd-title").
 *
 * Iter 47 Phase 2 changes:
 *   AC7: Disabled Edit button REMOVED from protected blocks — dialog still shows
 *        all info; user just cannot edit. Rationale sentence replaces it.
 *   AC8: Bucket-label text rows ("PROJECT"/"COMMUNICATION"/"CI") REMOVED —
 *        color bar already carries the semantic.
 *   AC9: Standalone duration row REMOVED — time range already includes duration.
 *   AC10: COMM dialog shows slotKind-specific rationale sentence (5 variants).
 *   AC11: CI End-of-Activity Reflection has "Start Reflection" action button
 *         dispatching EOD_OPEN_REFLECTION.
 *   AC12: Sprint ceremonies have rationale sentence.
 *   AC15: Iter 46 Phase 1 functionality preserved (participants/trigger on COMM).
 *
 * §6.5 boundary: js/ui/components/ — frontend only.
 */

import { esc } from '../mount.js';
import { formatTimeRange } from '../timeFormat.js';
import bucketMeta from '../bucketMeta.js';
import { isProtectedBlock, PROTECTED_CATALOG_IDS } from '../editMode.js';

// ---------------------------------------------------------------------------
// Iter 47 Phase 2 — Rationale lookup tables (AC10, AC12)
// ---------------------------------------------------------------------------

/**
 * COMM sub-type rationale sentences keyed on catalogEntryId OR slotKind.
 * Tried in order: catalogEntryId first, then slotKind, then generic fallback.
 *
 * AC10: 5 variants documented in Phase 2 scope.
 */
const COMM_RATIONALE_BY_CATALOG_ID = Object.freeze({
  'cer_daily_standup': 'Quick sync on yesterday → today → blockers.'
});

const COMM_RATIONALE_BY_SLOT_KIND = Object.freeze({
  'DAILY_STANDUP':   'Quick sync on yesterday → today → blockers.',
  'AM_COMM':         'Start-of-day high-value communication.',
  'POST_LUNCH_COMM': 'Post-lunch high-value communication.',
  'POST_DEEP_COMM':  'End-of-deep-cycles communication.'
});

/**
 * CI sprint ceremony rationale sentences keyed on catalogEntryId.
 * AC12: Sprint ceremonies get rationale sentence pattern.
 */
const CI_CEREMONY_RATIONALE = Object.freeze({
  'cer_sprint_planning':      'Sprint Planning ceremony — align team on sprint commitments.',
  'cer_mid_sprint_review':    'Mid-Sprint Review — track progress against sprint goal.',
  'cer_sprint_review':        'Sprint Review ceremony — demo completed work to stakeholders.',
  'cer_sprint_retrospective': 'Sprint Retrospective — reflect on the cycle and improve the system.'
});

/** CatalogEntryId for End-of-Activity Reflection. */
const EAR_CATALOG_ID = 'gen_end_of_activity_reflection';

/**
 * Derive the COMM rationale sentence for an activity.
 * Priority: catalogEntryId → slotKind → catalogEntry.description → generic.
 *
 * @param {object} activity
 * @param {object|null} catalogEntry
 * @returns {string}
 */
function getCommRationale(activity, catalogEntry) {
  // 1. CatalogEntryId match.
  const byId = COMM_RATIONALE_BY_CATALOG_ID[activity.catalogEntryId ?? ''];
  if (byId) return byId;

  // 2. SlotKind match.
  const bySlot = COMM_RATIONALE_BY_SLOT_KIND[activity.slotKind ?? ''];
  if (bySlot) return bySlot;

  // 3. Catalog entry description (user-added COMM with description).
  if (catalogEntry && typeof catalogEntry.description === 'string' && catalogEntry.description.trim()) {
    return catalogEntry.description.trim();
  }

  // 4. Generic fallback for user-added COMM.
  return 'Communication time.';
}

// ---------------------------------------------------------------------------
// BlockDetailDialog component
// ---------------------------------------------------------------------------

/**
 * BlockDetailDialog component.
 *
 * Iter 46 Phase 1: accepts full `catalogEntry` object (AC5) in addition to
 * backward-compatible `outputArtifact`. When `catalogEntry` is provided it
 * takes precedence for outputArtifact resolution. COMMUNICATION blocks gain
 * `participants` and `trigger` rows when those fields are present (AC6–AC8).
 *
 * Iter 47 Phase 2: removes disabled Edit button on protected blocks (AC7),
 * removes bucket-label text row (AC8), removes standalone duration row (AC9),
 * adds COMM rationale sentences (AC10), adds CI EoAR "Start Reflection" button
 * (AC11), adds sprint ceremony rationale (AC12).
 *
 * @param {{
 *   activity:        object,
 *   kaizenTitle?:    string | null,
 *   outputArtifact?: object | null,
 *   catalogEntry?:   object | null
 * }} props
 * @returns {string}
 */
export function BlockDetailDialog(props = {}) {
  const activity = props.activity ?? null;
  if (!activity || typeof activity !== 'object') return '';

  const kaizenTitle = typeof props.kaizenTitle === 'string' && props.kaizenTitle.length > 0
    ? props.kaizenTitle
    : null;

  // Iter 46 Phase 1: prefer full catalogEntry prop; fall back to outputArtifact prop
  // for backward compatibility with call sites not yet passing catalogEntry.
  const catalogEntry = props.catalogEntry ?? null;
  const outputArtifact = catalogEntry?.outputArtifact ?? props.outputArtifact ?? null;

  // --- Activity data ---
  const name = activity.name ?? activity.catalogEntryId ?? '(unnamed)';
  const activityId = activity.id ?? '';
  const bucket = activity.bucket ?? null;
  const meta = bucketMeta(bucket);
  const bucketChipClass = bucket ? meta.chipClass : 'chip-unknown';

  // Time range (includes duration semantically — e.g. "09:00–10:00" = 60 min).
  const startValue = activity.plannedStartAt ?? activity.anchor ?? null;
  const dur = Number(activity.plannedDurationMinutes ?? 0);
  const timeRange = startValue ? formatTimeRange(startValue, dur) : '—';

  // AC9: Standalone duration row REMOVED — time range already shows start+end.
  // The duration label is preserved as a variable in case it's needed for
  // aria-labels but NOT rendered as a separate row.

  // Expected output — graceful fallback.
  const outputName = outputArtifact
    ? (outputArtifact.name ?? outputArtifact.kind ?? outputArtifact.schema ?? null)
    : null;

  // Iter 46 Phase 1 — COMMUNICATION bucket: participants + trigger rows (AC6–AC8).
  // Only render rows when the field is present and non-empty. Graceful absence:
  // missing or empty strings silently skip the row (AC8). Other bucket types
  // are unaffected (AC9 Iter 46 / AC15 Iter 47).
  const isComm = bucket === 'COMMUNICATION';
  const isCI = bucket === 'CI';
  const isProject = bucket === 'PROJECT';

  const participantsText = isComm && catalogEntry && typeof catalogEntry.participants === 'string' && catalogEntry.participants.trim()
    ? catalogEntry.participants.trim()
    : null;
  const triggerText = isComm && catalogEntry && typeof catalogEntry.trigger === 'string' && catalogEntry.trigger.trim()
    ? catalogEntry.trigger.trim()
    : null;

  const participantsRow = participantsText
    ? `<div class="bdd-row bdd-row-participants">
        <dt class="bdd-label">Who&#x2019;s involved</dt>
        <dd class="bdd-value bdd-comm-detail">${esc(participantsText)}</dd>
      </div>`
    : '';

  const triggerRow = triggerText
    ? `<div class="bdd-row bdd-row-trigger">
        <dt class="bdd-label">What kicks this off</dt>
        <dd class="bdd-value bdd-comm-detail">${esc(triggerText)}</dd>
      </div>`
    : '';

  // Protected block detection.
  const protected_ = isProtectedBlock(activity);
  const editPayload = esc(JSON.stringify({ activityId }));
  const closePayload = esc(JSON.stringify({}));

  // Iter 47 Phase 2 — AC7: REMOVE disabled Edit button on protected blocks.
  // Non-protected blocks keep the enabled Edit button.
  // The rationale sentence (see below) replaces the disabled button visual space.
  const editBtn = protected_
    ? '' // AC7: No disabled Edit button — simply omit it.
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

  // ---------------------------------------------------------------------------
  // Iter 47 Phase 2 — Per-type rationale sentence + footer actions (AC10–AC12)
  // ---------------------------------------------------------------------------

  let rationaleHtml = '';
  let footerAction = editBtn;

  if (isComm) {
    // AC10: COMM — slotKind-specific rationale sentence (5 variants).
    const rationale = getCommRationale(activity, catalogEntry);
    rationaleHtml = `<p class="bdd-rationale">${esc(rationale)}</p>`;
    // Protected COMM: no Edit button (already omitted above). Non-protected: keep Edit.
  }

  if (isCI) {
    const isEoAR = activity.catalogEntryId === EAR_CATALOG_ID;
    const isCeremony = PROTECTED_CATALOG_IDS.has(activity.catalogEntryId ?? '') && !isEoAR;

    if (isEoAR) {
      // AC11: EoAR — rationale + "Start Reflection" action button.
      rationaleHtml = `<p class="bdd-rationale">Sacred — captures daily learning. Cannot be removed.</p>`;
      // "Start Reflection" dispatches EOD_OPEN_REFLECTION (existing action in app.js).
      // It also closes the block detail dialog first.
      footerAction = `<button
        class="bdd-btn bdd-btn-reflect"
        data-action="EOD_OPEN_REFLECTION"
        data-payload='${closePayload}'
        aria-label="Start your End-of-Activity Reflection"
      >Start Reflection</button>`;
    } else if (isCeremony) {
      // AC12: Sprint ceremonies — rationale sentence.
      const ceremonyRationale = CI_CEREMONY_RATIONALE[activity.catalogEntryId ?? '']
        ?? 'Sprint ceremony — scheduled with your team.';
      rationaleHtml = `<p class="bdd-rationale">${esc(ceremonyRationale)}</p>`;
      // Protected ceremony: no Edit button (already omitted above).
    }
  }

  // ---------------------------------------------------------------------------
  // Iter 47 Phase 2 — Output row: omit when outputName is null (don't show "—")
  // ---------------------------------------------------------------------------
  const outputRow = outputName
    ? `<div class="bdd-row">
        <dt class="bdd-label">Expected output</dt>
        <dd class="bdd-value bdd-output">${esc(outputName)}</dd>
      </div>`
    : '';

  // ---------------------------------------------------------------------------
  // Iter 47 Phase 2 — AC8: Bucket-label text row REMOVED.
  // The color bar accent at the top already carries the bucket semantic.
  // ---------------------------------------------------------------------------

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
        <dt class="bdd-label">Time</dt>
        <dd class="bdd-value bdd-time">${esc(timeRange)}</dd>
      </div>${outputRow}${participantsRow}${triggerRow}${kaizenChip ? `
      <div class="bdd-row bdd-row-kaizen">
        <dt class="bdd-label">Kaizen</dt>
        <dd class="bdd-value">${kaizenChip}</dd>
      </div>` : ''}
    </dl>${rationaleHtml ? `
    <div class="bdd-rationale-section">${rationaleHtml}</div>` : ''}
    <footer class="bdd-footer">
      ${footerAction}
    </footer>
  </div>
</section>`;
}

export default BlockDetailDialog;
