/**
 * CycleCard — the primary canvas for a Composition (E10-T3).
 *
 * Renders a Composition in one of four variants keyed off
 * `composition.state`:
 *
 *   PROPOSED  — header "Today, composed." + BucketStrip + activity list +
 *               AcceptEditRejectTriad.
 *   ACCEPTED  — header "Today" + BucketStrip + activity list (with Start on
 *               each block, disabled per Sprint 4 scope).
 *   ACTIVE    — same as ACCEPTED but the first activity is pinned.
 *   REJECTED  — empty state copy + AutoPlanButton.
 *   (INFEASIBLE / missing composition handled by Today page — CycleCard
 *    is only called when a Composition exists.)
 *
 * Phase A additions (Today Simplification):
 *   - WhyThisPlan disclosure: collapsed-by-default in header (PROPOSED/ACCEPTED/EDITED)
 *   - MorningRecap disclosure: collapsed-by-default in header (when priorDayRecap truthy)
 *   - EOD reflection CTA: in footer when eodRecap truthy
 *   - aria-live="polite" summary: current activity name in header
 *
 * Pure function. Takes a plain props object and returns an HTML string.
 * No DOM access. Children (BucketStrip, TodayGrid,
 * AcceptEditRejectTriad, AutoPlanButton) are composed by string
 * concatenation.
 *
 * Props:
 *   composition:        object — the Composition row (state, etc.)
 *   activities:         ScheduledActivity[] — the children
 *   targets?:           bucket targets (for BucketStrip)
 *   floors?:            bucket floors
 *   ceilings?:          bucket ceilings
 *   nowIso?:            string — current ISO timestamp (for aria-live + pinning)
 *   priorDayRecap?:     object | null — yesterday recap data (MorningRecap disclosure)
 *   eodRecap?:          object | null — EOD recap data (footer CTA)
 *   whyPlanExpanded?:   boolean — WhyThisPlan disclosure open state
 *   morningRecapExpanded?: boolean — MorningRecap disclosure open state
 */

import { esc } from '../mount.js';
import { parseMinutesOfDay } from '../weekGridMath.js';
import { AcceptEditRejectTriad } from './AcceptEditRejectTriad.js';
import { AutoPlanButton } from './AutoPlanButton.js';
import { WhyThisPlan } from './WhyThisPlan.js';
import { MorningRecap } from './MorningRecap.js';
import { TodayGrid } from './TodayGrid.js';

/**
 * Iter 33: Format a YYYY-MM-DD string as "Thursday, 30 April 2026" for
 * the DM Serif Display date heading (AC4).
 *
 * @param {string} dateIso — "YYYY-MM-DD"
 * @returns {string}
 */
function formatDateDisplay(dateIso) {
  if (!dateIso || typeof dateIso !== 'string') return '';
  // Parse without timezone offset by treating as local midnight.
  const parts = dateIso.split('-');
  if (parts.length !== 3) return dateIso;
  const [y, m, d] = parts.map(Number);
  // Build a local date. Use a specific known date to prevent DST shifts.
  const date = new Date(y, m - 1, d);
  if (Number.isNaN(date.getTime())) return dateIso;
  // Iter 34 (AC7): use browser-native locale so month/day order matches the
  // user's locale. navigator.language may be undefined in non-browser
  // environments (tests); fall back to 'en-US' which is the most common
  // default and matches the en-US month-before-day order in the design spec.
  const locale =
    (typeof navigator !== 'undefined' && navigator.language) || 'en-US';
  return date.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Edit-mode triad: Commit / Cancel / Undo. Rendered in place of
 * AcceptEditRejectTriad while `editMode === true`.
 *
 * @param {{undoCount?: number}} [opts]
 * @returns {string}
 */
function renderEditTriad(opts = {}) {
  const undoCount = Number.isFinite(opts.undoCount) ? opts.undoCount : 0;
  const undoDisabled = undoCount === 0 ? 'disabled aria-disabled="true"' : '';
  return `<div class="triad triad-edit" role="group" aria-label="Edit mode actions">
    <button type="button" class="triad-commit primary" data-action="EDIT_COMMIT" data-payload='{}'>Commit</button>
    <button type="button" class="triad-edit-cancel secondary" data-action="EDIT_CANCEL" data-payload='{}'>Cancel</button>
    <button type="button" class="triad-undo ghost" data-action="EDIT_UNDO" data-payload='{}' ${undoDisabled}>Undo (${esc(String(undoCount))})</button>
  </div>`;
}

// ---------------------------------------------------------------------------
// Phase A helpers — WhyThisPlan disclosure, MorningRecap disclosure,
// aria-live current-activity summary, EOD CTA footer.
// ---------------------------------------------------------------------------

/**
 * Derive the current-activity summary string for the aria-live region.
 * Uses the same IN_PROGRESS→UPCOMING→OPEN_TIME priority that NowPane used,
 * simplified to a single-line string suitable for a screen-reader announcement.
 *
 * Returns a non-empty string always (falls back to "No current activity").
 *
 * @param {object[]} activities
 * @param {string|null} nowIso
 * @returns {string}
 */
function buildCurrentActivitySummary(activities, nowIso) {
  const list = Array.isArray(activities) ? activities : [];

  // 1. IN_PROGRESS wins.
  const inProgress = list.find((a) => a && a.state === 'IN_PROGRESS');
  if (inProgress) {
    const name = inProgress.name ?? inProgress.catalogEntryId ?? 'activity';
    const dur = Number.isFinite(inProgress.plannedDurationMinutes)
      ? inProgress.plannedDurationMinutes
      : 0;
    return `Now: ${name}, ${dur} minutes`;
  }

  // 2. UPCOMING — next SCHEDULED activity in the future.
  if (nowIso && typeof nowIso === 'string') {
    const nowMs = new Date(nowIso).getTime();
    if (!Number.isNaN(nowMs)) {
      // Find next future scheduled activity by plannedStartAt.
      const upcoming = list
        .filter((a) => a && a.state === 'SCHEDULED')
        .map((a) => {
          const start = a.plannedStartAt ?? '';
          // Accept HH:MM strings (no date prefix — assume today).
          const iso = start.length >= 16 && start[10] === 'T'
            ? start
            : /^\d{2}:\d{2}(:\d{2})?$/.test(start)
              ? `${nowIso.slice(0, 10)}T${start.length === 5 ? start + ':00' : start}`
              : null;
          const ms = iso ? new Date(iso).getTime() : NaN;
          return { a, ms };
        })
        .filter(({ ms }) => !Number.isNaN(ms) && ms > nowMs)
        .sort((x, y) => x.ms - y.ms)[0];

      if (upcoming) {
        const name = upcoming.a.name ?? upcoming.a.catalogEntryId ?? 'activity';
        const dur = Number.isFinite(upcoming.a.plannedDurationMinutes)
          ? upcoming.a.plannedDurationMinutes
          : 0;
        return `Up next: ${name}, ${dur} minutes`;
      }
    }
  }

  return 'No current activity';
}

/**
 * Render the WhyThisPlan disclosure region inside the CycleCard header.
 * Collapsed by default. Only shown for PROPOSED / ACCEPTED / EDITED states
 * and only when explain data is present.
 *
 * @param {object} composition
 * @param {boolean} whyPlanExpanded
 * @returns {string}
 */
function renderWhyThisPlanDisclosure(composition, whyPlanExpanded) {
  const state = composition?.state ?? '';
  const eligible =
    state === 'PROPOSED' || state === 'ACCEPTED' || state === 'EDITED';
  if (!eligible) return '';
  const explain = composition?.composerInputsSnapshot?.explain ?? null;
  return WhyThisPlan({ explain, expanded: whyPlanExpanded });
}

/**
 * Render the MorningRecap disclosure region inside the CycleCard header.
 * Collapsed by default (the MorningRecap component itself is the disclosure).
 * Only shown when priorDayRecap is truthy.
 *
 * @param {object|null} priorDayRecap
 * @returns {string}
 */
function renderMorningRecapDisclosure(priorDayRecap) {
  if (!priorDayRecap) return '';
  return MorningRecap({ priorDayRecap });
}

/**
 * Render the EOD reflection CTA in the CycleCard footer.
 * Only shown when eodRecap is truthy and pendingReflectionCount > 0.
 *
 * @param {object|null} eodRecap
 * @returns {string}
 */
function renderEodFooterCta(eodRecap) {
  if (!eodRecap || typeof eodRecap !== 'object') return '';
  const pending = Number.isFinite(eodRecap.pendingReflectionCount)
    ? eodRecap.pendingReflectionCount
    : 0;
  const closed = Number.isFinite(eodRecap.closedCount) ? eodRecap.closedCount : 0;
  const total = Number.isFinite(eodRecap.totalCount) ? eodRecap.totalCount : 0;
  const skipped = Number.isFinite(eodRecap.skippedCount) ? eodRecap.skippedCount : 0;
  const skipPart = skipped > 0 ? ` · ${skipped} skipped` : '';
  const counters = `${closed}/${total} closed${skipPart}`;
  const ctaHtml = pending > 0
    ? `<button class="cycle-eod-cta" data-action="EOD_OPEN_REFLECTION" type="button">Capture reflection →</button>`
    : '';
  return `<div class="cycle-eod-footer" role="note" aria-label="Day complete — ${esc(counters)}">
  <span class="cycle-eod-status">Day complete</span>
  <span class="cycle-eod-counters">${esc(counters)}</span>${ctaHtml ? `\n  ${ctaHtml}` : ''}
</div>`;
}

// ---------------------------------------------------------------------------

/**
 * Copy-only reference. Do not mutate.
 */
export const CARD_COPY = Object.freeze({
  PROPOSED_HEADER: 'Today, composed.',
  ACCEPTED_HEADER: 'Today',
  ACTIVE_HEADER: 'Today (active)',
  REJECTED_EMPTY: 'No day scheduled. Compose again.',
  PROPOSED_INTRO:
    'Here is your proposed day. Accept to schedule, Edit to tweak, Reject to discard.'
});

/**
 * Order activities by plannedStartAt (ISO or HH:MM). Activities without a
 * start time sort to the end, preserving original order.
 *
 * @param {Array<object>} activities
 * @returns {Array<object>}
 */
export function orderActivitiesForDisplay(activities) {
  if (!Array.isArray(activities)) return [];
  // Normalise both ISO and HH:MM strings to integer minutes so mixed-format
  // lists sort by actual wall-clock position rather than lexicographic order.
  const withIdx = activities.map((a, i) => ({
    a,
    i,
    min: parseMinutesOfDay(a.plannedStartAt ?? a.anchor)
  }));
  withIdx.sort((x, y) => {
    if (x.min == null && y.min == null) return x.i - y.i; // both missing → stable
    if (x.min == null) return 1;  // missing sinks to end
    if (y.min == null) return -1;
    if (x.min === y.min) return x.i - y.i; // tie-break on input order (stable)
    return x.min - y.min;
  });
  return withIdx.map((w) => w.a);
}

/**
 * Build a lookup {catalogEntryId → why-entry} from the composition's
 * explain snapshot. Missing snapshot → empty object.
 *
 * @param {object} composition
 * @returns {Record<string, object>}
 */
function buildExplainById(composition) {
  const explain = composition?.composerInputsSnapshot?.explain;
  if (!Array.isArray(explain)) return {};
  const out = {};
  for (const e of explain) {
    if (!e || typeof e !== 'object') continue;
    const ref = e.ref;
    if (typeof ref !== 'string' || !ref) continue;
    // First entry wins (prefer the earliest rule that fired).
    if (!(ref in out)) out[ref] = e;
  }
  return out;
}

/**
 * Render the PROPOSED variant — the hero path.
 *
 * Iter 29 (Phase 1): replaced the 6-column table header + activity list with
 * TodayGrid (single-day calendar grid). The table (sa-col-headers + ul.cycle-activities)
 * is removed. All existing header/triad/footer chrome is preserved unchanged.
 *
 * Iter 33: date heading wrapped in h1.cycle-date-display for DM Serif Display (AC4).
 * PROPOSED state banner added above grid (AC19).
 *
 * In edit mode the calendar grid is still rendered (read-only display of the
 * draft activities); the EditDrawer rendered by Today.js provides the swap UI.
 */
function renderProposed(composition, activities, extras = {}) {
  const compId = composition.id;
  const editMode = !!extras.editMode;
  const undoCount = Number.isFinite(extras.undoCount) ? extras.undoCount : 0;
  const triad = editMode
    ? renderEditTriad({ undoCount })
    : AcceptEditRejectTriad({ compositionId: compId });
  const cardClass = editMode ? 'cycle-card cycle-proposed cycle-editing' : 'cycle-card cycle-proposed';

  // Phase A: disclosure regions + aria-live summary.
  const nowActivitySummary = buildCurrentActivitySummary(activities, extras.nowIso ?? null);
  const whyDisclosure = editMode
    ? ''
    : renderWhyThisPlanDisclosure(composition, extras.whyPlanExpanded ?? false);
  const morningDisclosure = editMode
    ? ''
    : renderMorningRecapDisclosure(extras.priorDayRecap ?? null);
  const eodFooter = renderEodFooterCta(extras.eodRecap ?? null);

  // Iter 33: date heading in DM Serif Display (AC4).
  const dateDisplay = composition.date
    ? `<h1 class="cycle-date-display">${esc(formatDateDisplay(composition.date))}</h1>
    <p class="cycle-date-sub">PROPOSED</p>`
    : `<h1 class="cycle-title">${esc(editMode ? 'Edit today' : CARD_COPY.PROPOSED_HEADER)}</h1>
    <p class="cycle-intro">${esc(editMode ? 'Tap a slot on the left, then pick a swap on the right.' : CARD_COPY.PROPOSED_INTRO)}</p>`;

  // Iter 33: PROPOSED state banner (AC19).
  const proposedBanner = !editMode ? `<div class="cycle-proposed-banner" role="note" aria-label="Plan status: proposed">
    <span class="cycle-proposed-banner-icon">PROPOSED</span>
    Your day plan is ready for review. Dashed-border blocks are proposals — accept to commit.
  </div>` : '';

  // Iter 29 Phase 1 — calendar grid replaces the table.
  // Iter 35 Phase 2: pass dragSession for ghost block rendering.
  // Iter 46 Phase 1: pass catalogEntryById for PROJECT secondary line (AC1–AC4).
  const calendarGrid = TodayGrid({
    composition,
    activities,
    nowIso: extras.nowIso ?? null,
    kaizenTitleById: extras.kaizenTitleById ?? {},
    catalogEntryById: extras.catalogById ?? {},
    compositionState: 'PROPOSED',
    dragSession: extras.dragSession ?? null,
    // rowHeightPx / gridStartHour / gridEndHour use TodayGrid defaults.
  });

  return `<article class="${cardClass}" data-composition-id="${esc(compId)}" data-state="PROPOSED">
  <header class="cycle-header">
    ${dateDisplay}
    <span class="cycle-now-summary" aria-live="polite" aria-atomic="true">${esc(nowActivitySummary)}</span>
${morningDisclosure ? `    ${morningDisclosure}` : ''}${whyDisclosure ? `\n    ${whyDisclosure}` : ''}
  </header>
  ${proposedBanner}
  <div class="cycle-calendar-grid-wrap">
    ${calendarGrid}
  </div>
  ${triad}
${eodFooter ? `  ${eodFooter}` : ''}
</article>`;
}

/**
 * Render the ACCEPTED / ACTIVE / EDITED / CLOSED variant.
 *
 * Iter 29 (Phase 1): replaced the 6-column table + activity list with
 * TodayGrid (single-day calendar grid). All header/triad/footer chrome
 * is preserved unchanged.
 */
function renderAccepted(composition, activities, { isActive, nowIso, kaizenTitleById, catalogById, editMode, selectedActivityId, undoCount, priorDayRecap, eodRecap, whyPlanExpanded, morningRecapExpanded, dragSession }) {
  const compId = composition.id;
  const edit = !!editMode;
  const undoN = Number.isFinite(undoCount) ? undoCount : 0;
  const triad = edit ? renderEditTriad({ undoCount: undoN }) : '';
  const cardClass = edit
    ? `cycle-card cycle-${isActive ? 'active' : 'accepted'} cycle-editing`
    : `cycle-card cycle-${isActive ? 'active' : 'accepted'}`;

  // Phase A: disclosure regions + aria-live summary.
  const nowActivitySummary = buildCurrentActivitySummary(activities, nowIso ?? null);
  const whyDisclosure = edit
    ? ''
    : renderWhyThisPlanDisclosure(composition, whyPlanExpanded ?? false);
  const morningDisclosure = edit
    ? ''
    : renderMorningRecapDisclosure(priorDayRecap ?? null);
  const eodFooter = renderEodFooterCta(eodRecap ?? null);

  // Iter 29 Phase 1 — calendar grid replaces the table.
  // Iter 35 Phase 2: pass dragSession for ghost block rendering (ACCEPTED+ not needed
  // since dragSession is only populated in PROPOSED flow; pass through for correctness).
  // Iter 46 Phase 1: pass catalogEntryById for PROJECT secondary line (AC1–AC4).
  const compState = isActive ? 'ACTIVE' : (composition.state ?? 'ACCEPTED');
  const calendarGrid = TodayGrid({
    composition,
    activities,
    nowIso: nowIso ?? null,
    kaizenTitleById: kaizenTitleById ?? {},
    catalogEntryById: catalogById ?? {},
    compositionState: compState,
    dragSession: dragSession ?? null,
  });

  // Iter 33: date heading in DM Serif Display (AC4).
  const dateDisplay = composition.date && !edit
    ? `<h1 class="cycle-date-display">${esc(formatDateDisplay(composition.date))}</h1>`
    : `<h1 class="cycle-title">${esc(edit ? 'Edit today' : (isActive ? CARD_COPY.ACTIVE_HEADER : CARD_COPY.ACCEPTED_HEADER))}</h1>`;

  return `<article class="${cardClass}" data-composition-id="${esc(compId)}" data-state="${isActive ? 'ACTIVE' : 'ACCEPTED'}">
  <header class="cycle-header">
    ${dateDisplay}
    <span class="cycle-now-summary" aria-live="polite" aria-atomic="true">${esc(nowActivitySummary)}</span>
${morningDisclosure ? `    ${morningDisclosure}` : ''}${whyDisclosure ? `\n    ${whyDisclosure}` : ''}
  </header>
  <div class="cycle-calendar-grid-wrap">
    ${calendarGrid}
  </div>
  ${triad}
${eodFooter ? `  ${eodFooter}` : ''}
</article>`;
}

/**
 * Render the REJECTED variant — empty state.
 */
function renderRejected(composition) {
  const compId = composition?.id ?? '';
  return `<article class="cycle-card cycle-rejected" data-composition-id="${esc(compId)}" data-state="REJECTED">
  <div class="empty-state">
    <p class="empty-copy">${esc(CARD_COPY.REJECTED_EMPTY)}</p>
    ${AutoPlanButton({ variant: 'primary' })}
  </div>
</article>`;
}

/**
 * CycleCard — main entry.
 *
 * @param {{
 *   composition:          object,
 *   activities?:          Array<object>,
 *   nowIso?:              string,
 *   catalog?:             Array<object>,
 *   priorDayRecap?:       object | null,
 *   eodRecap?:            object | null,
 *   whyPlanExpanded?:     boolean,
 *   morningRecapExpanded?: boolean
 * }} props
 * @returns {string}
 */
export function CycleCard(props = {}) {
  const composition = props.composition;
  const activities = props.activities ?? [];
  const nowIso = props.nowIso ?? null;
  const kaizenTitleById =
    props.kaizenTitleById && typeof props.kaizenTitleById === 'object'
      ? props.kaizenTitleById
      : {};
  if (!composition) {
    return '<article class="cycle-card cycle-missing">(no composition)</article>';
  }
  const editMode = !!props.editMode;
  const selectedActivityId = props.selectedActivityId ?? null;
  const undoCount = Number.isFinite(props.undoCount) ? props.undoCount : 0;

  // Phase A: new props for disclosure regions + EOD CTA.
  const priorDayRecap = props.priorDayRecap ?? null;
  const eodRecap = props.eodRecap ?? null;
  const whyPlanExpanded = !!props.whyPlanExpanded;
  const morningRecapExpanded = !!props.morningRecapExpanded;

  // C-UX-COL: build catalogById map once here (O(n)) so TodayGrid
  // can resolve outputArtifact per-activity without passing the full array
  // down to each leaf. Pattern matches the existing explainById and
  // kaizenTitleById lookups.
  const catalogById = {};
  if (Array.isArray(props.catalog)) {
    for (const entry of props.catalog) {
      if (entry && typeof entry.id === 'string') {
        catalogById[entry.id] = entry;
      }
    }
  }

  // Iter 35 Phase 2: dragSession for PROPOSED pending-confirm ghost block.
  const dragSession = props.dragSession ?? null;

  const extras = {
    kaizenTitleById,
    catalogById,
    editMode,
    selectedActivityId,
    undoCount,
    nowIso,
    priorDayRecap,
    eodRecap,
    whyPlanExpanded,
    morningRecapExpanded,
    dragSession
  };

  switch (composition.state) {
    case 'PROPOSED':
      return renderProposed(composition, activities, extras);
    case 'ACCEPTED':
    case 'EDITED':
      return renderAccepted(composition, activities, { isActive: false, nowIso, ...extras });
    case 'ACTIVE':
      return renderAccepted(composition, activities, { isActive: true, nowIso, ...extras });
    case 'REJECTED':
      return renderRejected(composition);
    case 'CLOSED':
      return renderAccepted(composition, activities, { isActive: false, nowIso, ...extras });
    default:
      return `<article class="cycle-card cycle-unknown" data-composition-id="${esc(composition.id ?? '')}" data-state="${esc(composition.state ?? '')}">
  <p>Unknown composition state: ${esc(composition.state ?? 'null')}</p>
</article>`;
  }
}

export default CycleCard;
