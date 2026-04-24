/**
 * Week page (Sprint 9 Pass 9c + Sprint 10b Pass C).
 *
 * Renders the weekly composer surface:
 *   - Header with the Mon..Fri range + "Plan this week" primary action.
 *   - Empty state if no WeeklyComposition exists.
 *   - 5-column grid (Mon..Fri). Each column:
 *       - day header (weekday short + ISO date)
 *       - total planned minutes
 *       - tight BucketStrip (PROJECT/COMMUNICATION/CI chips)
 *       - DayPreview list of activities
 *       - per-day "Accept" button
 *   - Footer with "Accept all 5 days" primary action.
 *
 * Sprint 10b Pass C simplifies the header (one primary "Plan this week"
 * action) and swaps the per-day dl for a compact total + BucketStrip.
 *
 * Pure function — takes props, returns an HTML string.
 */

import { esc } from '../mount.js';
import { WeekGrid } from '../components/WeekGrid.js';
import { UpNextRail } from '../components/UpNextRail.js';

export const WEEK_COPY = Object.freeze({
  TITLE: 'Week Plan',
  PROPOSE: 'Plan this week',
  ACCEPT_ALL: 'Accept all 5 days',
  EMPTY: 'No week plan yet. Tap Plan this week to compose a Mon–Fri schedule.',
  DAY_EMPTY: 'No activities scheduled.'
});

const WEEKDAY_SHORT = Object.freeze(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);

/**
 * Format a range header like "Mon Apr 20 – Fri Apr 24".
 *
 * @param {string} weekStartIso
 * @param {string} weekEndIso
 * @returns {string}
 */
export function formatWeekRange(weekStartIso, weekEndIso) {
  if (typeof weekStartIso !== 'string' || typeof weekEndIso !== 'string') return '';
  const s = parseIso(weekStartIso);
  const e = parseIso(weekEndIso);
  if (!s || !e) return `${weekStartIso} – ${weekEndIso}`;
  return `Mon ${monthDay(s)} – Fri ${monthDay(e)}`;
}

/**
 * Parse YYYY-MM-DD → Date (UTC). Returns null on failure.
 *
 * @param {string} iso
 * @returns {Date|null}
 */
function parseIso(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

const MONTHS_SHORT = Object.freeze([
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
]);

function monthDay(d) {
  const m = MONTHS_SHORT[d.getUTCMonth()];
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${m} ${day}`;
}

/**
 * Render a single activity block inside a DayPreview.
 *
 * @param {object} a
 * @returns {string}
 */
function renderActivity(a) {
  if (!a || typeof a !== 'object') return '';
  const bucket = a.bucket ?? '';
  const bucketClass =
    bucket === 'PROJECT'
      ? 'chip-project'
      : bucket === 'COMMUNICATION'
      ? 'chip-communication'
      : 'chip-ci';
  const name = a.name ?? a.catalogEntryId ?? '(unnamed)';
  const dur = a.plannedDurationMinutes ?? 0;
  const kaizenBadge = a.linkedKaizenId
    ? `<span class="wk-kaizen-chip" title="Kaizen payload">▶</span>`
    : '';
  return `<li class="wk-day-activity" data-bucket="${esc(bucket)}">
    <span class="wk-chip ${esc(bucketClass)}">${esc(bucket)}</span>
    <span class="wk-activity-name">${esc(name)}${kaizenBadge}</span>
    <span class="wk-activity-dur">${esc(String(dur))}m</span>
  </li>`;
}

/**
 * DayPreview — renders one column (one day of the week).
 *
 * @param {{
 *   weeklyCompositionId: string,
 *   day: object,
 *   dayIdx: number
 * }} props
 * @returns {string}
 */
export function DayPreview(props = {}) {
  const day = props.day ?? null;
  const dayIdx = typeof props.dayIdx === 'number' ? props.dayIdx : 0;
  if (!day) {
    return `<section class="wk-day wk-day-empty" data-day-idx="${esc(String(dayIdx))}">
      <header class="wk-day-header">
        <span class="wk-day-label">${esc(WEEKDAY_SHORT[dayIdx] ?? '')}</span>
      </header>
      <p class="wk-empty">${esc(WEEK_COPY.DAY_EMPTY)}</p>
    </section>`;
  }
  const activities = Array.isArray(day.activities) ? day.activities : [];
  const items = activities.map((a) => renderActivity(a)).join('\n');
  const pb = day.plannedByBucket ?? { PROJECT: 0, COMMUNICATION: 0, CI: 0 };
  const totalMinutes =
    (pb.PROJECT ?? 0) + (pb.COMMUNICATION ?? 0) + (pb.CI ?? 0);
  const state = day.state ?? 'PROPOSED';
  const acceptPayload = esc(
    JSON.stringify({
      weeklyCompositionId: props.weeklyCompositionId ?? '',
      dayIndex: dayIdx
    })
  );
  const acceptBtn =
    state === 'PROPOSED'
      ? `<button type="button" class="wk-accept-day" data-action="WEEK_ACCEPT_DAY" data-payload='${acceptPayload}'>Accept day</button>`
      : `<span class="wk-day-state">${esc(state)}</span>`;
  return `<section class="wk-day" data-day-idx="${esc(String(dayIdx))}" data-date="${esc(day.date ?? '')}" data-state="${esc(state)}">
    <header class="wk-day-header">
      <span class="wk-day-label">${esc(WEEKDAY_SHORT[dayIdx] ?? '')}</span>
      <span class="wk-day-date">${esc(day.date ?? '')}</span>
      <span class="wk-day-total" aria-label="total minutes">${esc(String(totalMinutes))}m</span>
    </header>
    <dl class="wk-day-totals">
      <dt>Project</dt><dd>${esc(String(pb.PROJECT))}m</dd>
      <dt>Comm</dt><dd>${esc(String(pb.COMMUNICATION))}m</dd>
      <dt>CI</dt><dd>${esc(String(pb.CI))}m</dd>
    </dl>
    <ul class="wk-day-list" role="list">${items}</ul>
    <footer class="wk-day-footer">
      ${acceptBtn}
    </footer>
  </section>`;
}

/**
 * Flatten every activity across the 5 weekly days into a single array
 * (used by UpNextRail). Pure helper.
 *
 * @param {object|null} weekly
 * @returns {object[]}
 */
function flattenWeeklyActivities(weekly) {
  if (!weekly || !Array.isArray(weekly.days)) return [];
  const flat = [];
  for (const d of weekly.days) {
    if (!d || !Array.isArray(d.activities)) continue;
    for (const a of d.activities) {
      if (!a) continue;
      // Decorate with the day's date so UpNextRail can build a sortable
      // ISO key when plannedStartAt is HH:MM-only.
      flat.push({ ...a, _date: d.date ?? null });
    }
  }
  return flat;
}

/**
 * Week page component.
 *
 * @param {{
 *   weeklyComposition?: object|null,
 *   weekStart?: string,
 *   weekEnd?: string,
 *   kaizens?: object[],
 *   nowIso?: string,
 *   kaizenTitleById?: Record<string, string>,
 * }} props
 * @returns {string}
 */
export function Week(props = {}) {
  const weekly = props.weeklyComposition ?? null;
  const defaultWeekStart = props.weekStart ?? null;
  const nowIso = typeof props.nowIso === 'string' ? props.nowIso : null;
  const kaizenTitleById = props.kaizenTitleById ?? {};

  if (!weekly) {
    const proposePayload = esc(
      JSON.stringify(defaultWeekStart ? { weekStart: defaultWeekStart } : {})
    );
    return `<main class="week-page" data-route="week">
      <header class="wk-page-header">
        <h1 class="wk-page-title">${esc(WEEK_COPY.TITLE)}</h1>
        <button type="button" class="wk-propose" data-action="WEEK_PROPOSE" data-payload='${proposePayload}'>${esc(WEEK_COPY.PROPOSE)}</button>
      </header>
      <section class="wk-empty-section" aria-live="polite">
        <p class="empty-copy">${esc(WEEK_COPY.EMPTY)}</p>
      </section>
    </main>`;
  }

  const range = formatWeekRange(weekly.weekStart, weekly.weekEnd);
  const state = weekly.state ?? 'PROPOSED';
  const proposePayload = esc(
    JSON.stringify({ weekStart: weekly.weekStart })
  );
  const acceptAllPayload = esc(
    JSON.stringify({ weeklyCompositionId: weekly.id })
  );

  const cols = (weekly.days ?? [])
    .map((day, i) =>
      DayPreview({ day, dayIdx: i, weeklyCompositionId: weekly.id })
    )
    .join('\n');

  const acceptAllBtn =
    state === 'PROPOSED'
      ? `<button type="button" class="wk-accept-all" data-action="WEEK_ACCEPT_ALL" data-payload='${acceptAllPayload}'>${esc(WEEK_COPY.ACCEPT_ALL)}</button>`
      : `<span class="wk-state-label">${esc(state)}</span>`;

  // Sprint 15 W1 — primary visualization is now the hour-grid timeline.
  const gridHtml = WeekGrid({
    weeklyComposition: weekly,
    nowIso,
    kaizenTitleById
  });

  // Sprint 15 W2 — Up Next rail to the right of the grid (desktop-only via CSS).
  const flatActivities = flattenWeeklyActivities(weekly);
  const upNextHtml = UpNextRail({
    activities: flatActivities,
    nowIso,
    kaizenTitleById,
    limit: 5,
    variant: 'rail'
  });

  return `<main class="week-page" data-route="week" data-weekly-id="${esc(weekly.id ?? '')}" data-state="${esc(state)}">
    <header class="wk-page-header">
      <div class="wk-header-text">
        <h1 class="wk-page-title">${esc(WEEK_COPY.TITLE)}</h1>
        <p class="wk-range">${esc(range)}</p>
      </div>
      <div class="wk-header-actions">
        <button type="button" class="wk-propose wk-propose-primary" data-action="WEEK_PROPOSE" data-payload='${proposePayload}'>${esc(WEEK_COPY.PROPOSE)}</button>
      </div>
    </header>
    <div class="wk-body">
      <section class="wk-grid-wrap" aria-label="Week timeline">
        ${gridHtml}
      </section>
      ${upNextHtml}
    </div>
    <section class="wk-grid" role="list" aria-label="Week day summary">
      ${cols}
    </section>
    <footer class="wk-footer">
      ${acceptAllBtn}
    </footer>
  </main>`;
}

export default Week;
