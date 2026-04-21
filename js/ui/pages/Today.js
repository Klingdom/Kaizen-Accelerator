/**
 * Today page container (E10-T2).
 *
 * Responsibilities:
 *   - Given an active Composition + its children, render a CycleCard.
 *   - If no Composition exists for the user, render the first-run banner
 *     copy + an AutoPlanButton as the primary CTA.
 *
 * Pure function — takes all data via props. The actual repo read is done
 * by `app.js` (the thin boot layer) via `ComposerService.getActiveComposition()`
 * and passed in as `activeState`.
 *
 * Loading states: Sprint 4 defers shimmer skeletons. The current design
 * shows immediately-populated content; skeletons ship in a later sprint
 * if the load budget requires them.
 */

import { esc } from '../mount.js';
import { CycleCard } from '../components/CycleCard.js';
import { AutoPlanButton } from '../components/AutoPlanButton.js';
import { AdherenceDial } from '../components/AdherenceDial.js';
import {
  DEFAULT_TARGETS,
  DEFAULT_FLOORS,
  DEFAULT_CEILINGS
} from '../components/BucketStrip.js';

/**
 * Empty-state copy per SCHEDULING_UX §6.5.2.
 *   Today (first-time) → "Welcome. Tap Auto-Plan to compose your first day."
 *   Today (mid-usage)  → "No day scheduled. Auto-Plan, or add activities from the Catalog."
 */
export const TODAY_COPY = Object.freeze({
  FIRST_RUN: 'Welcome. Tap Auto-Plan to compose your first day.',
  EMPTY: 'No day scheduled. Auto-Plan, or add activities from the Catalog.',
  INFEASIBLE:
    "Composer flagged an infeasible day. Raise your daily capacity or reduce external meetings, then Auto-Plan again."
});

/**
 * @param {{
 *   activeState: null | {composition: object, activities: object[]},
 *   loading?: boolean,
 *   isFirstRun?: boolean,
 *   infeasibleExplain?: string[] | null,
 *   adherence?: {adherencePct: number | null, acceptancePct: number | null, kaizenDeltaPct: number | null, daysSinceSignup: number},
 *   targets?: object,
 *   floors?: object,
 *   ceilings?: object
 * }} props
 */
export function Today(props = {}) {
  const activeState = props.activeState ?? null;
  const loading = !!props.loading;
  const isFirstRun = !!props.isFirstRun;
  const infeasibleExplain = props.infeasibleExplain ?? null;
  const adherence = props.adherence ?? {
    adherencePct: null,
    acceptancePct: null,
    kaizenDeltaPct: null,
    daysSinceSignup: 0
  };

  const strips = {
    targets: props.targets ?? DEFAULT_TARGETS,
    floors: props.floors ?? DEFAULT_FLOORS,
    ceilings: props.ceilings ?? DEFAULT_CEILINGS
  };

  // Header — AdherenceDial always renders.
  const header = `<header class="today-header">
  ${AdherenceDial(adherence)}
</header>`;

  if (infeasibleExplain && infeasibleExplain.length > 0) {
    return `<main class="today-page" data-route="today">
  ${header}
  <section class="today-infeasible" aria-live="polite">
    <p class="empty-copy">${esc(TODAY_COPY.INFEASIBLE)}</p>
    <ul class="infeasible-explain">
${infeasibleExplain.map((line) => `      <li>${esc(line)}</li>`).join('\n')}
    </ul>
    ${AutoPlanButton({ loading, variant: 'primary' })}
  </section>
</main>`;
  }

  if (!activeState) {
    const emptyCopy = isFirstRun ? TODAY_COPY.FIRST_RUN : TODAY_COPY.EMPTY;
    return `<main class="today-page" data-route="today">
  ${header}
  <section class="today-empty">
    <p class="empty-copy">${esc(emptyCopy)}</p>
    ${AutoPlanButton({ loading, variant: 'primary' })}
  </section>
</main>`;
  }

  return `<main class="today-page" data-route="today">
  ${header}
  ${CycleCard({
    composition: activeState.composition,
    activities: activeState.activities,
    targets: strips.targets,
    floors: strips.floors,
    ceilings: strips.ceilings
  })}
</main>`;
}

export default Today;
