/**
 * UpNextRail — Sprint 15 W2 right-rail "Up next" surface.
 *
 * Pure render. Returns an HTML string.
 *
 * Filters activities to those whose plannedStartAt is in the future
 * (after `nowIso`), excluding CLOSED / SKIPPED / DROPPED rows. Renders up
 * to `limit` (default 5) compact rows: time + bucket dot + name + Kaizen
 * chip + duration.
 *
 * Two visual variants:
 *   variant: 'rail'   — vertical 280px-wide column, rendered to the right
 *                       of WeekGrid on /#week and CycleCard on /#today.
 *   variant: 'mobile' — horizontal compact list above CycleCard on
 *                       /#today when the right rail is hidden by media
 *                       query.
 *
 * Props:
 *   activities:        ScheduledActivity-like rows. plannedStartAt should
 *                      be either an ISO timestamp OR an `HH:MM` value
 *                      decorated with a parallel `_date` (`YYYY-MM-DD`)
 *                      key so future-time comparisons can resolve.
 *   nowIso:            ISO timestamp marking "now"; required for filtering
 *                      future-only.
 *   kaizenTitleById?:  optional Record<kaizenId, title> for chips.
 *   limit?:            number — defaults to 5.
 *   variant?:          'rail' | 'mobile' — defaults to 'rail'.
 */

import { esc } from '../mount.js';

const BUCKET_DOT_CLASS = {
  PROJECT: 'up-next-dot-project',
  COMMUNICATION: 'up-next-dot-communication',
  CI: 'up-next-dot-ci'
};

const TERMINAL_STATES = new Set(['CLOSED', 'SKIPPED', 'DROPPED']);

/**
 * Build a sort key for an activity. Prefer plannedStartAt if it's an
 * ISO-shaped string; otherwise compose `_date + 'T' + HH:MM` so HH:MM-only
 * values still sort across days.
 *
 * Returns null when nothing parseable.
 *
 * @param {object} a
 * @returns {string|null}
 */
export function activitySortKey(a) {
  if (!a || typeof a !== 'object') return null;
  const start = typeof a.plannedStartAt === 'string' ? a.plannedStartAt : null;
  if (!start) return null;
  if (start.length >= 16 && start[10] === 'T') return start;
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(start)) {
    const date = typeof a._date === 'string' && a._date.length >= 10 ? a._date : null;
    if (date) return `${date}T${start.length === 5 ? start + ':00' : start}`;
    return null;
  }
  // Try Date parsing as a last resort.
  const d = new Date(start);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

/**
 * Format the display "HH:MM" for a row.
 *
 * @param {object} a
 * @returns {string}
 */
function formatTime(a) {
  if (!a) return '';
  const start = a.plannedStartAt ?? '';
  if (typeof start !== 'string' || start.length === 0) return '';
  if (/^\d{2}:\d{2}$/.test(start)) return start;
  if (/^\d{2}:\d{2}:\d{2}$/.test(start)) return start.slice(0, 5);
  const d = new Date(start);
  if (Number.isNaN(d.getTime())) return '';
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * Filter + sort activities to produce the "up next" sequence.
 *
 * Pure helper — exported for tests.
 *
 * @param {object[]} activities
 * @param {string} nowIso
 * @returns {object[]}
 */
export function selectUpNext(activities, nowIso) {
  if (!Array.isArray(activities)) return [];
  if (typeof nowIso !== 'string' || nowIso.length === 0) return [];
  const decorated = [];
  for (const a of activities) {
    if (!a || typeof a !== 'object') continue;
    if (TERMINAL_STATES.has(a.state)) continue;
    if (a.state === 'IN_PROGRESS') continue;
    const key = activitySortKey(a);
    if (!key) continue;
    if (key <= nowIso) continue;
    decorated.push({ a, key });
  }
  decorated.sort((x, y) => {
    if (x.key < y.key) return -1;
    if (x.key > y.key) return 1;
    return 0;
  });
  return decorated.map((d) => d.a);
}

/**
 * Render one row of the rail.
 *
 * @param {object} a
 * @param {Record<string, string>} kaizenTitleById
 * @returns {string}
 */
function renderRow(a, kaizenTitleById) {
  const bucket = a.bucket ?? '';
  const dotClass = BUCKET_DOT_CLASS[bucket] ?? 'up-next-dot-unknown';
  const time = formatTime(a);
  const name = a.name ?? a.catalogEntryId ?? '(unnamed)';
  const dur = Number(a.plannedDurationMinutes ?? 0);
  const kaizenId = a.linkedKaizenId ?? null;
  const kaizenTitle = kaizenId && kaizenTitleById && kaizenTitleById[kaizenId]
    ? kaizenTitleById[kaizenId]
    : null;
  const kaizenChip = kaizenTitle
    ? `<span class="up-next-kaizen" aria-label="part of Kaizen ${esc(kaizenTitle)}">${esc(kaizenTitle)}</span>`
    : '';
  return `<li class="up-next-row" data-activity-id="${esc(a.id ?? '')}" data-bucket="${esc(bucket)}">
    <span class="up-next-time">${esc(time)}</span>
    <span class="up-next-dot ${esc(dotClass)}" aria-hidden="true"></span>
    <span class="up-next-name">${esc(name)}</span>
    ${kaizenChip}
    <span class="up-next-dur">${esc(String(dur))}m</span>
  </li>`;
}

/**
 * UpNextRail main entry.
 *
 * @param {{
 *   activities?: object[],
 *   nowIso?: string,
 *   kaizenTitleById?: Record<string, string>,
 *   limit?: number,
 *   variant?: string
 * }} props
 * @returns {string}
 */
export function UpNextRail(props = {}) {
  const activities = Array.isArray(props.activities) ? props.activities : [];
  const nowIso = typeof props.nowIso === 'string' ? props.nowIso : '';
  const kaizenTitleById = props.kaizenTitleById ?? {};
  const limit = Number.isFinite(props.limit) && props.limit > 0 ? props.limit : 5;
  const variant = props.variant === 'mobile' ? 'mobile' : 'rail';

  const upcoming = selectUpNext(activities, nowIso).slice(0, limit);
  const className = variant === 'mobile' ? 'up-next-rail up-next-mobile' : 'up-next-rail';

  if (upcoming.length === 0) {
    return `<aside class="${className}" data-variant="${variant}" aria-label="Up next">
      <header class="up-next-header"><h2 class="up-next-title">Up next</h2></header>
      <p class="up-next-empty">Nothing else scheduled.</p>
    </aside>`;
  }

  const rows = upcoming.map((a) => renderRow(a, kaizenTitleById)).join('\n');
  return `<aside class="${className}" data-variant="${variant}" aria-label="Up next">
    <header class="up-next-header"><h2 class="up-next-title">Up next</h2></header>
    <ul class="up-next-list" role="list">
      ${rows}
    </ul>
  </aside>`;
}

export default UpNextRail;
