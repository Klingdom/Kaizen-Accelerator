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
 * Pure function. Takes a plain props object and returns an HTML string.
 * No DOM access. Children (BucketStrip, ScheduledActivityBlock,
 * AcceptEditRejectTriad, AutoPlanButton) are composed by string
 * concatenation.
 *
 * Props:
 *   composition: object — the Composition row (state, etc.)
 *   activities:  ScheduledActivity[] — the children
 *   targets?:    bucket targets (for BucketStrip)
 *   floors?:     bucket floors
 *   ceilings?:   bucket ceilings
 */

import { esc } from '../mount.js';
import {
  BucketStrip,
  plannedFromActivities,
  DEFAULT_TARGETS,
  DEFAULT_FLOORS,
  DEFAULT_CEILINGS
} from './BucketStrip.js';
import { ScheduledActivityBlock } from './ScheduledActivityBlock.js';
import { AcceptEditRejectTriad } from './AcceptEditRejectTriad.js';
import { AutoPlanButton } from './AutoPlanButton.js';

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
  const copy = activities.slice();
  copy.sort((a, b) => {
    const ap = a.plannedStartAt ?? a.anchor ?? '';
    const bp = b.plannedStartAt ?? b.anchor ?? '';
    if (ap && bp) {
      if (ap < bp) return -1;
      if (ap > bp) return 1;
      return 0;
    }
    if (ap && !bp) return -1;
    if (!ap && bp) return 1;
    return 0;
  });
  return copy;
}

/**
 * Sort the activities, then render them as a list of ScheduledActivityBlock
 * items. For ACCEPTED/ACTIVE states we pass showStart=true so the Start /
 * Skip / Close buttons render. For PROPOSED we do not — the decision
 * hasn't been made yet.
 *
 * @param {Array<object>} activities
 * @param {{
 *   showStart: boolean,
 *   pinnedId?: string,
 *   nowIso?: string,
 *   compositionState?: string,
 *   explainById?: Record<string, {ref: string, rule: string, detail: string}>
 * }} opts
 */
function renderActivityList(activities, opts) {
  const ordered = orderActivitiesForDisplay(activities);
  if (ordered.length === 0) {
    return '<li class="sa-empty">No activities.</li>';
  }
  const explainById = opts.explainById ?? {};
  return ordered
    .map((a) =>
      ScheduledActivityBlock({
        activity: a,
        showStart: opts.showStart,
        pinned: opts.pinnedId === a.id,
        nowIso: opts.nowIso,
        compositionState: opts.compositionState,
        explainEntry: explainById[a.catalogEntryId] ?? null
      })
    )
    .join('\n');
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
 */
function renderProposed(composition, activities, strips) {
  const compId = composition.id;
  const planned = plannedFromActivities(activities);
  const explainById = buildExplainById(composition);
  return `<article class="cycle-card cycle-proposed" data-composition-id="${esc(compId)}" data-state="PROPOSED">
  <header class="cycle-header">
    <h1 class="cycle-title">${esc(CARD_COPY.PROPOSED_HEADER)}</h1>
    <p class="cycle-intro">${esc(CARD_COPY.PROPOSED_INTRO)}</p>
  </header>
  ${BucketStrip({
    planned,
    targets: strips.targets,
    floors: strips.floors,
    ceilings: strips.ceilings
  })}
  <ul class="cycle-activities" role="list">
${renderActivityList(activities, {
    showStart: false,
    compositionState: 'PROPOSED',
    explainById
  })}
  </ul>
  ${AcceptEditRejectTriad({ compositionId: compId })}
</article>`;
}

/**
 * Render the ACCEPTED / ACTIVE variant.
 */
function renderAccepted(composition, activities, strips, { isActive, nowIso }) {
  const compId = composition.id;
  const planned = plannedFromActivities(activities);
  // Pin: prefer IN_PROGRESS, else first SCHEDULED.
  const inProgress = activities.find((a) => a.state === 'IN_PROGRESS');
  const pinnedActivity =
    inProgress ?? activities.find((a) => a.state === 'SCHEDULED');
  return `<article class="cycle-card cycle-${isActive ? 'active' : 'accepted'}" data-composition-id="${esc(compId)}" data-state="${isActive ? 'ACTIVE' : 'ACCEPTED'}">
  <header class="cycle-header">
    <h1 class="cycle-title">${esc(isActive ? CARD_COPY.ACTIVE_HEADER : CARD_COPY.ACCEPTED_HEADER)}</h1>
  </header>
  ${BucketStrip({
    planned,
    targets: strips.targets,
    floors: strips.floors,
    ceilings: strips.ceilings
  })}
  <ul class="cycle-activities" role="list">
${renderActivityList(activities, {
    showStart: true,
    pinnedId: pinnedActivity?.id,
    nowIso,
    compositionState: isActive ? 'ACTIVE' : 'ACCEPTED'
  })}
  </ul>
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
 *   composition: object,
 *   activities?: Array<object>,
 *   targets?: object,
 *   floors?: object,
 *   ceilings?: object,
 *   nowIso?: string
 * }} props
 * @returns {string}
 */
export function CycleCard(props = {}) {
  const composition = props.composition;
  const activities = props.activities ?? [];
  const nowIso = props.nowIso ?? null;
  if (!composition) {
    return '<article class="cycle-card cycle-missing">(no composition)</article>';
  }
  const strips = {
    targets: props.targets ?? DEFAULT_TARGETS,
    floors: props.floors ?? DEFAULT_FLOORS,
    ceilings: props.ceilings ?? DEFAULT_CEILINGS
  };

  switch (composition.state) {
    case 'PROPOSED':
      return renderProposed(composition, activities, strips);
    case 'ACCEPTED':
    case 'EDITED':
      return renderAccepted(composition, activities, strips, { isActive: false, nowIso });
    case 'ACTIVE':
      return renderAccepted(composition, activities, strips, { isActive: true, nowIso });
    case 'REJECTED':
      return renderRejected(composition);
    case 'CLOSED':
      return renderAccepted(composition, activities, strips, { isActive: false, nowIso });
    default:
      return `<article class="cycle-card cycle-unknown" data-composition-id="${esc(composition.id ?? '')}" data-state="${esc(composition.state ?? '')}">
  <p>Unknown composition state: ${esc(composition.state ?? 'null')}</p>
</article>`;
  }
}

export default CycleCard;
