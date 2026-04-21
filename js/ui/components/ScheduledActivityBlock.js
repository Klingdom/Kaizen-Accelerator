/**
 * ScheduledActivityBlock — one row per activity (E10-T5).
 *
 * Pure render. Returns an HTML string.
 *
 * Props:
 *   activity:        required — ScheduledActivity row
 *   showStart:       boolean — show the Start button (disabled in this sprint)
 *   pinned:          boolean — pin-the-first-block styling
 *   compositionState: string — parent composition state (affects intention readout)
 *
 * Start button Sprint-4 note:
 *   Per Sprint 4 backlog E10-T5, Start is disabled with tooltip "Ships in Sprint 5".
 *
 * The intention field renders read-only in this sprint (per §6.5.8 placeholder).
 */

import { esc } from '../mount.js';

/**
 * Format a planned start time (ISO or HH:MM) to "HH:MM".
 *
 * @param {string | null | undefined} iso
 * @returns {string}
 */
export function formatTime(iso) {
  if (!iso) return '';
  // Accept raw HH:MM first (composer anchors come as e.g. '09:00').
  if (/^\d{2}:\d{2}$/.test(iso)) return iso;
  if (/^\d{2}:\d{2}:\d{2}$/.test(iso)) return iso.slice(0, 5);
  // ISO timestamp — extract HH:MM from Date().
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

const BUCKET_CHIP_CLASS = {
  PROJECT: 'chip-project',
  COMMUNICATION: 'chip-communication',
  CI: 'chip-ci'
};

/**
 * Return a human label for the activity state.
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
 * Render a single ScheduledActivity row.
 *
 * @param {{
 *   activity: object,
 *   showStart?: boolean,
 *   pinned?: boolean,
 *   compositionState?: string
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

  const chipClass = BUCKET_CHIP_CLASS[a.bucket] ?? 'chip-unknown';
  const time = formatTime(a.plannedStartAt ?? a.anchor);
  const name = a.name ?? a.catalogEntryId ?? '(unnamed)';
  const duration = a.plannedDurationMinutes ?? 0;
  const intention = a.intention ?? '';
  const state = a.state ?? 'PROPOSED';
  const carried = a.carriedOver ? '<span class="carried-badge" title="carried from yesterday">carried</span>' : '';

  const classes = [
    'sa-block',
    `sa-state-${esc(state).toLowerCase()}`,
    pinned ? 'pinned' : ''
  ].filter(Boolean).join(' ');

  // Start button — disabled in Sprint 4 (action ships in Sprint 5).
  const startButton = showStart
    ? `<button type="button" class="sa-start" disabled aria-disabled="true" title="Ships in Sprint 5" data-action="START_ACTIVITY" data-payload='${esc(JSON.stringify({ activityId: a.id }))}'>Start</button>`
    : '';

  // Intention is read-only this sprint (placeholder from §6.5.8).
  const intentionBlock = `<div class="sa-intention" aria-label="intention">${
    intention
      ? esc(intention)
      : '<span class="placeholder">One line: what outcome by close?</span>'
  }</div>`;

  return `<li class="${classes}" data-activity-id="${esc(a.id ?? '')}" data-bucket="${esc(a.bucket ?? '')}">
  <div class="sa-when">${esc(time)}</div>
  <div class="sa-bucket-chip ${esc(chipClass)}" aria-label="bucket ${esc(a.bucket ?? '')}">${esc(a.bucket ?? '')}</div>
  <div class="sa-name">${esc(name)}${carried}</div>
  <div class="sa-duration">${esc(String(duration))}m</div>
  ${intentionBlock}
  <div class="sa-state-label">${esc(stateLabel(state))}</div>
  ${startButton}
</li>`;
}

export default ScheduledActivityBlock;
