/**
 * ScheduledActivityBlock — one row per activity.
 *
 * Pure render. Returns an HTML string.
 *
 * Props:
 *   activity:          required — ScheduledActivity row
 *   showStart:         boolean — show the Start button (enabled in Sprint 5)
 *   pinned:            boolean — pin-the-first-block styling
 *   compositionState:  string — parent composition state (affects intention readout)
 *   nowIso:            string — ISO timestamp for elapsed-timer readout on IN_PROGRESS
 *   explainEntry:      {ref, rule, detail} — if provided and composition is
 *                      PROPOSED, a WhyChip is rendered on the trailing edge.
 *   kaizenTitle:       string — when the activity is linkedKaizenId-bound,
 *                      render a "part of: [title]" chip under the name.
 *                      Surfaced across ALL states including PROPOSED so the
 *                      user sees project linkage before accepting.
 *
 * State variants (Sprint 5):
 *   PROPOSED     — bucket chip + read-only intention + why-chip (if given)
 *   SCHEDULED    — same + enabled Start button + Skip button
 *   IN_PROGRESS  — elapsed timer + Close button (artifact dialog on click)
 *   CLOSED       — state label "closed" + no actions
 *   SKIPPED      — state label "skipped" + reason label
 */

import { esc } from '../mount.js';
import { WhyChip } from './WhyChip.js';
import { isProtectedBlock, DURATION_OPTIONS } from '../editMode.js';
import { formatTime, formatTimeRange } from '../timeFormat.js';

// Re-exported so existing callers (and tests) keep working after the
// Sprint 16a extraction.
export { formatTime, formatTimeRange };

const BUCKET_CHIP_CLASS = {
  PROJECT: 'chip-project',
  COMMUNICATION: 'chip-communication',
  CI: 'chip-ci'
};

/**
 * Return a human label for the activity state.
 *
 * @param {string} state
 * @returns {string}
 */
function stateLabel(state) {
  switch (state) {
    case 'PROPOSED':
      return 'proposed';
    case 'SCHEDULED':
      return 'scheduled';
    case 'IN_PROGRESS':
      return 'in progress';
    case 'CLOSED':
      return 'closed';
    case 'SKIPPED':
      return 'skipped';
    case 'DROPPED':
      return 'dropped';
    default:
      return state ?? '';
  }
}

/**
 * Compute whole-minute elapsed between two ISO timestamps (or 0 if either
 * is invalid / unset).
 *
 * @param {string|null|undefined} startIso
 * @param {string|null|undefined} nowIso
 * @returns {number}
 */
export function computeElapsedMinutes(startIso, nowIso) {
  if (!startIso || !nowIso) return 0;
  const s = new Date(startIso);
  const n = new Date(nowIso);
  if (Number.isNaN(s.getTime()) || Number.isNaN(n.getTime())) return 0;
  const ms = n.getTime() - s.getTime();
  if (ms <= 0) return 0;
  return Math.floor(ms / 60000);
}

/**
 * Render the action surface for each state. Returns an HTML fragment or ''.
 *
 * @param {object} a        activity
 * @param {boolean} showStart
 * @returns {string}
 */
function renderActions(a, showStart) {
  const id = a.id ?? '';
  const payload = esc(JSON.stringify({ activityId: id }));
  switch (a.state) {
    case 'SCHEDULED': {
      if (!showStart) return '';
      const startBtn = `<button type="button" class="sa-start" data-action="START_ACTIVITY" data-payload='${payload}'>Start</button>`;
      const skipBtn = `<button type="button" class="sa-skip" data-action="OPEN_SKIP_MODAL" data-payload='${payload}'>Skip</button>`;
      return `<div class="sa-actions">${startBtn}${skipBtn}</div>`;
    }
    case 'IN_PROGRESS': {
      const closeBtn = `<button type="button" class="sa-close" data-action="OPEN_CLOSE_DIALOG" data-payload='${payload}'>Close</button>`;
      return `<div class="sa-actions">${closeBtn}</div>`;
    }
    default:
      return '';
  }
}

/**
 * Render the elapsed-timer readout for IN_PROGRESS state.
 *
 * @param {object} a        activity
 * @param {string|null|undefined} nowIso
 * @returns {string}
 */
function renderElapsed(a, nowIso) {
  if (a.state !== 'IN_PROGRESS') return '';
  const elapsed = computeElapsedMinutes(a.actualStartAt, nowIso);
  return `<div class="sa-elapsed" aria-label="elapsed minutes">${esc(String(elapsed))}m elapsed</div>`;
}

/**
 * Render the six duration chips (Sprint 13). The current duration's chip
 * gets the active class + aria-pressed="true"; the rest aria-pressed="false".
 * Each chip carries a JSON payload `{activityId, minutes}` so the
 * data-action dispatcher in app.js can route EDIT_CHANGE_DURATION.
 *
 * @param {object} a         activity
 * @param {number} current   current plannedDurationMinutes
 * @returns {string}
 */
function renderDurationChips(a, current) {
  const id = a.id ?? '';
  const rowLabel =
    `<div class="sa-duration-label" aria-label="current duration">duration: ${esc(String(current))}m</div>`;
  const chips = DURATION_OPTIONS.map((m) => {
    const active = m === current;
    const cls = active ? 'sa-dur-chip sa-dur-chip-active' : 'sa-dur-chip';
    const payload = esc(JSON.stringify({ activityId: id, minutes: m }));
    return `<button type="button" class="${cls}" data-action="EDIT_CHANGE_DURATION" data-payload='${payload}' aria-pressed="${active ? 'true' : 'false'}" aria-label="Set duration to ${m} minutes">${m}m</button>`;
  }).join('');
  return `${rowLabel}<div class="sa-duration-chips" role="group" aria-label="duration chips">${chips}</div>`;
}

/**
 * Render the skipped-reason label for SKIPPED state.
 *
 * @param {object} a    activity
 * @returns {string}
 */
function renderSkipReason(a) {
  if (a.state !== 'SKIPPED' || !a.reasonCodeIfSkipped) return '';
  return `<div class="sa-skip-reason" aria-label="skip reason">${esc(a.reasonCodeIfSkipped)}</div>`;
}

/**
 * Render a single ScheduledActivity row.
 *
 * @param {{
 *   activity: object,
 *   showStart?: boolean,
 *   pinned?: boolean,
 *   compositionState?: string,
 *   nowIso?: string,
 *   explainEntry?: {ref: string, rule: string, detail: string} | null,
 *   editMode?: boolean,
 *   editSelected?: boolean
 * }} props
 * @returns {string}
 */
export function ScheduledActivityBlock(props = {}) {
  const a = props.activity;
  if (!a || typeof a !== 'object') {
    return '<li class="sa-block sa-missing">(no activity)</li>';
  }
  const showStart = !!props.showStart;
  const pinned = !!props.pinned;
  const compositionState = props.compositionState ?? '';
  const nowIso = props.nowIso ?? null;
  const explainEntry = props.explainEntry ?? null;
  const kaizenTitle =
    typeof props.kaizenTitle === 'string' && props.kaizenTitle.length > 0
      ? props.kaizenTitle
      : null;
  const editMode = !!props.editMode;
  const editSelected = !!props.editSelected;
  const protectedBlock = editMode ? isProtectedBlock(a) : false;

  const chipClass = BUCKET_CHIP_CLASS[a.bucket] ?? 'chip-unknown';
  const time = formatTime(a.plannedStartAt ?? a.anchor);
  // Sprint 16a: surface the time as a "HH:MM–HH:MM" range alongside the
  // existing single-time used by the edit-mode <input type="time">.
  const timeRange = formatTimeRange(a.plannedStartAt ?? a.anchor, a.plannedDurationMinutes);
  // Sprint 14: when a non-protected slot is edit-selected, swap the static
  // time label for a native <input type="time"> so the user can change the
  // plannedStartAt directly.
  const timeEditable = editMode && editSelected && !protectedBlock;
  const name = a.name ?? a.catalogEntryId ?? '(unnamed)';
  const duration = a.plannedDurationMinutes ?? 0;
  const intention = a.intention ?? '';
  const state = a.state ?? 'PROPOSED';
  const carried = a.carriedOver ? '<span class="carried-badge" title="carried from yesterday">carried</span>' : '';
  const kaizenChip = (kaizenTitle && a.linkedKaizenId)
    ? `<span class="sa-kaizen-chip" aria-label="part of Kaizen ${esc(kaizenTitle)}">part of: ${esc(kaizenTitle)}</span>`
    : '';

  const classes = [
    'sa-block',
    `sa-state-${esc(state).toLowerCase()}`,
    pinned ? 'pinned' : '',
    editMode && !protectedBlock ? 'edit-selectable' : '',
    editMode && protectedBlock ? 'edit-protected' : '',
    editMode && editSelected ? 'edit-selected' : ''
  ].filter(Boolean).join(' ');

  // Intention is read-only this sprint (placeholder from §6.5.8).
  const intentionBlock = `<div class="sa-intention" aria-label="intention">${
    intention
      ? esc(intention)
      : '<span class="placeholder">One line: what outcome by close?</span>'
  }</div>`;

  // Why-chip: only rendered for PROPOSED compositions (PROPOSED state) with
  // a matching explain entry. On ACCEPTED/ACTIVE we hide it per Sprint 5 spec.
  const showWhyChip =
    !!explainEntry &&
    (compositionState === 'PROPOSED' || (!compositionState && state === 'PROPOSED'));
  const whyChip = showWhyChip ? WhyChip({ entry: explainEntry }) : '';

  const activityIdPayload = esc(JSON.stringify({ activityId: a.id ?? '' }));
  // Edit-mode chrome: lock icon for protected, × to remove + select hotspot
  // for everything else.
  const editChrome = editMode
    ? (protectedBlock
        ? `<span class="sa-lock" title="Protected — required for your daily rhythm" aria-label="Protected block">🔒</span>`
        : `<div class="sa-edit-actions">
            <button type="button" class="sa-edit-select" data-action="EDIT_SELECT_SLOT" data-payload='${activityIdPayload}' aria-label="Select this slot to swap">Select</button>
            <button type="button" class="sa-edit-remove" data-action="EDIT_REMOVE_SLOT" data-payload='${activityIdPayload}' aria-label="Remove this slot">×</button>
          </div>`)
    : '';
  const selectAttrs = (editMode && !protectedBlock)
    ? ` data-action="EDIT_SELECT_SLOT" data-payload='${activityIdPayload}'`
    : '';
  // Hide normal Start/Skip/Close actions while in edit mode.
  const runtimeActions = editMode ? '' : renderActions(a, showStart);

  // Sprint 13: duration chips appear when a non-protected slot is
  // edit-selected. Six options come from DURATION_OPTIONS.
  const durationChips = (editMode && editSelected && !protectedBlock)
    ? renderDurationChips(a, duration)
    : '';

  const whenInner = timeEditable
    ? `<input type="time" class="sa-time-editor" data-action="EDIT_CHANGE_START_TIME" data-activity-id="${esc(a.id ?? '')}" value="${esc(time)}" aria-label="Start time">`
    : esc(timeRange);
  // Sprint 16a — keep an explicit aria-label on the time column so screen
  // readers still verbalize "starts at HH:MM, N minutes" even though the
  // visible text now reads as "HH:MM–HH:MM".
  const whenAria = (time && !timeEditable)
    ? ` aria-label="starts at ${esc(time)}, ${esc(String(duration))} minutes"`
    : '';

  // Sprint 15 W4 — surface the user-edited tone signal so CSS can swap
  // between desaturated (composer-built) and saturated (user-edited)
  // backgrounds.
  const userEdited = a.userEdited === true;

  return `<li class="${classes}" data-activity-id="${esc(a.id ?? '')}" data-bucket="${esc(a.bucket ?? '')}" data-user-edited="${userEdited ? 'true' : 'false'}"${selectAttrs}>
  <div class="sa-when"${whenAria}>${whenInner}</div>
  <div class="sa-bucket-chip ${esc(chipClass)}" aria-label="bucket ${esc(a.bucket ?? '')}">${esc(a.bucket ?? '')}</div>
  <div class="sa-name">${esc(name)}${carried}${kaizenChip}</div>
  <div class="sa-duration">${esc(String(duration))}m</div>
  ${intentionBlock}
  ${renderElapsed(a, nowIso)}
  ${renderSkipReason(a)}
  <div class="sa-state-label">${esc(stateLabel(state))}</div>
  ${runtimeActions}
  ${editChrome}
  ${durationChips}
  ${whyChip}
</li>`;
}

export default ScheduledActivityBlock;
