/**
 * NowPane — Sprint 15 W3 above-the-CycleCard "now strip".
 *
 * Pure render. Returns an HTML string.
 *
 * Three states, in priority order:
 *
 *   1. IN_PROGRESS — when one activity is currently running, render
 *      "Now: [name]" with elapsed minutes + a Close shortcut button.
 *   2. UPCOMING    — when the next future activity starts within 30
 *      minutes, render "Up next in Xm: [name]" with subtle countdown.
 *   3. OPEN_TIME   — otherwise, render "Open time until Xm" where Xm is
 *      the gap until the next scheduled block. If nothing is scheduled,
 *      render "Open time — nothing on deck."
 *
 * Pure helpers `selectNowState` and `nowPaneVariant` are exported for
 * tests so the variant computation can be exercised without HTML noise.
 *
 * Props:
 *   activities: ScheduledActivity-like rows.
 *   nowIso:     ISO timestamp marking "now".
 */

import { esc } from '../../mount.js';

const TERMINAL_STATES = new Set(['CLOSED', 'SKIPPED', 'DROPPED']);

const UPCOMING_WINDOW_MINUTES = 30;

/**
 * Parse an ISO timestamp into ms. Returns null on failure.
 *
 * @param {string|null|undefined} iso
 * @returns {number|null}
 */
function parseMs(iso) {
  if (typeof iso !== 'string' || iso.length === 0) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.getTime();
}

/**
 * Convert HH:MM-only or ISO plannedStartAt into a comparable ISO string,
 * decorated with `_date` if present.
 *
 * @param {object} a
 * @returns {string|null}
 */
function startAsIso(a) {
  if (!a || typeof a !== 'object') return null;
  const start = a.plannedStartAt;
  if (typeof start !== 'string') return null;
  if (start.length >= 16 && start[10] === 'T') return start;
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(start)) {
    const date = typeof a._date === 'string' ? a._date : null;
    if (!date) return null;
    return `${date}T${start.length === 5 ? start + ':00' : start}`;
  }
  return null;
}

/**
 * Compute the `nowPane` state object.
 *
 *   { kind: 'IN_PROGRESS', activity, elapsedMinutes }
 *   { kind: 'UPCOMING',    activity, minutesUntil }
 *   { kind: 'OPEN_TIME',   nextActivity?, minutesUntil? }
 *
 * Pure helper.
 *
 * @param {object[]} activities
 * @param {string} nowIso
 * @returns {object}
 */
export function selectNowState(activities, nowIso) {
  const list = Array.isArray(activities) ? activities : [];
  const nowMs = parseMs(nowIso);

  // IN_PROGRESS wins. Pick the earliest actualStartAt as the active row.
  const inProgress = list
    .filter((a) => a && a.state === 'IN_PROGRESS')
    .sort((x, y) => {
      const xs = parseMs(x.actualStartAt) ?? Infinity;
      const ys = parseMs(y.actualStartAt) ?? Infinity;
      return xs - ys;
    })[0];
  if (inProgress) {
    const startMs = parseMs(inProgress.actualStartAt);
    let elapsed = 0;
    if (startMs !== null && nowMs !== null && nowMs > startMs) {
      elapsed = Math.floor((nowMs - startMs) / 60000);
    }
    return { kind: 'IN_PROGRESS', activity: inProgress, elapsedMinutes: elapsed };
  }

  // Otherwise look for the next scheduled future row.
  if (nowMs === null) {
    return { kind: 'OPEN_TIME', nextActivity: null, minutesUntil: null };
  }
  const candidates = [];
  for (const a of list) {
    if (!a) continue;
    if (TERMINAL_STATES.has(a.state)) continue;
    if (a.state === 'IN_PROGRESS') continue;
    const iso = startAsIso(a);
    if (!iso) continue;
    const ms = parseMs(iso);
    if (ms === null) continue;
    if (ms <= nowMs) continue;
    candidates.push({ a, ms });
  }
  candidates.sort((x, y) => x.ms - y.ms);
  const next = candidates[0];
  if (!next) {
    return { kind: 'OPEN_TIME', nextActivity: null, minutesUntil: null };
  }
  const minutesUntil = Math.max(0, Math.round((next.ms - nowMs) / 60000));
  if (minutesUntil <= UPCOMING_WINDOW_MINUTES) {
    return { kind: 'UPCOMING', activity: next.a, minutesUntil };
  }
  return { kind: 'OPEN_TIME', nextActivity: next.a, minutesUntil };
}

/**
 * Convenience export: just the kind discriminator.
 *
 * @param {object[]} activities
 * @param {string} nowIso
 * @returns {string}
 */
export function nowPaneVariant(activities, nowIso) {
  return selectNowState(activities, nowIso).kind;
}

/**
 * NowPane main entry.
 *
 * @param {{activities?: object[], nowIso?: string}} props
 * @returns {string}
 */
export function NowPane(props = {}) {
  const activities = Array.isArray(props.activities) ? props.activities : [];
  const nowIso = typeof props.nowIso === 'string' ? props.nowIso : '';
  const state = selectNowState(activities, nowIso);

  if (state.kind === 'IN_PROGRESS') {
    const a = state.activity;
    const closePayload = esc(JSON.stringify({ activityId: a.id ?? '' }));
    return `<section class="now-pane now-pane-in-progress" data-kind="IN_PROGRESS" data-activity-id="${esc(a.id ?? '')}" aria-live="polite">
      <div class="now-pane-body">
        <span class="now-pane-label">Now</span>
        <span class="now-pane-name">${esc(a.name ?? a.catalogEntryId ?? '(unnamed)')}</span>
        <span class="now-pane-elapsed" aria-label="elapsed minutes">${esc(String(state.elapsedMinutes))}m elapsed</span>
      </div>
      <button type="button" class="now-pane-close" data-action="OPEN_CLOSE_DIALOG" data-payload='${closePayload}'>Close</button>
    </section>`;
  }

  if (state.kind === 'UPCOMING') {
    const a = state.activity;
    return `<section class="now-pane now-pane-upcoming" data-kind="UPCOMING" data-activity-id="${esc(a.id ?? '')}" aria-live="polite">
      <span class="now-pane-label">Up next in ${esc(String(state.minutesUntil))}m</span>
      <span class="now-pane-name">${esc(a.name ?? a.catalogEntryId ?? '(unnamed)')}</span>
    </section>`;
  }

  // OPEN_TIME
  const minutesUntil = state.minutesUntil;
  const body = state.nextActivity && Number.isFinite(minutesUntil)
    ? `<span class="now-pane-label">Open time until ${esc(String(minutesUntil))}m</span>
       <span class="now-pane-name">next: ${esc(state.nextActivity.name ?? '(unnamed)')}</span>`
    : `<span class="now-pane-label">Open time</span>
       <span class="now-pane-name">Nothing on deck.</span>`;
  return `<section class="now-pane now-pane-open" data-kind="OPEN_TIME" aria-live="polite">
    ${body}
  </section>`;
}

export default NowPane;
