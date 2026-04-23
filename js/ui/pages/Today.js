/**
 * Today page container (E10-T2 + Sprint 5 additions).
 *
 * Responsibilities:
 *   - Given an active Composition + its children, render a CycleCard.
 *   - If no Composition exists for the user, render the first-run banner
 *     copy + an AutoPlanButton as the primary CTA.
 *   - Render the Fine-tune button + drawer (P1-T2).
 *   - On INFEASIBLE composer result, render InfeasibleBanner (P2-T1).
 *   - Render any open modal (OutputArtifactDialog or SkipReasonModal).
 *
 * Pure function — takes all data via props. The actual repo read is done
 * by `app.js` (the thin boot layer) via `ComposerService.getActiveComposition()`
 * and passed in as `activeState`.
 */

import { esc } from '../mount.js';
import { CycleCard } from '../components/CycleCard.js';
import { AutoPlanButton } from '../components/AutoPlanButton.js';
import { AdherenceDial } from '../components/AdherenceDial.js';
import { FineTuneDrawer, FineTuneButton } from '../components/FineTuneDrawer.js';
import { InfeasibleBanner } from '../components/InfeasibleBanner.js';
import { OutputArtifactDialog } from '../components/OutputArtifactDialog.js';
import { SkipReasonModal } from '../components/SkipReasonModal.js';
import {
  DEFAULT_TARGETS,
  DEFAULT_FLOORS,
  DEFAULT_CEILINGS
} from '../components/BucketStrip.js';

/**
 * Empty-state copy per SCHEDULING_UX §6.5.2.
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
 *   infeasible?: {explain: string[]} | null,
 *   infeasibleExplain?: string[] | null,
 *   adherence?: object,
 *   targets?: object,
 *   floors?: object,
 *   ceilings?: object,
 *   nowIso?: string,
 *   fineTune?: {
 *     open: boolean,
 *     capacityMinutes: number,
 *     externalMinutesToday: number,
 *     activeKaizenId: string | null,
 *     availableKaizens?: Array<{id: string, title: string}>
 *   },
 *   openDialog?: null | {
 *     kind: 'CLOSE' | 'SKIP',
 *     activityId: string,
 *     schema?: string,
 *     artifactDef?: object,
 *     activityName?: string
 *   }
 * }} props
 */
export function Today(props = {}) {
  const activeState = props.activeState ?? null;
  const loading = !!props.loading;
  const isFirstRun = !!props.isFirstRun;
  // Accept either `infeasible` (structured) or legacy `infeasibleExplain`.
  const infeasible =
    props.infeasible ??
    (Array.isArray(props.infeasibleExplain) && props.infeasibleExplain.length > 0
      ? { explain: props.infeasibleExplain }
      : null);
  const adherence = props.adherence ?? {
    adherencePct: null,
    acceptancePct: null,
    kaizenDeltaPct: null,
    daysSinceSignup: 0
  };
  const nowIso = props.nowIso ?? null;
  const fineTune = props.fineTune ?? null;
  const openDialog = props.openDialog ?? null;

  const strips = {
    targets: props.targets ?? DEFAULT_TARGETS,
    floors: props.floors ?? DEFAULT_FLOORS,
    ceilings: props.ceilings ?? DEFAULT_CEILINGS
  };

  // Header — AdherenceDial + Fine-tune trigger.
  const header = `<header class="today-header">
  ${AdherenceDial(adherence)}
  ${FineTuneButton()}
</header>`;

  const drawer = fineTune
    ? FineTuneDrawer({
        capacityMinutes: fineTune.capacityMinutes ?? 480,
        externalMinutesToday: fineTune.externalMinutesToday ?? 0,
        activeKaizenId: fineTune.activeKaizenId ?? null,
        availableKaizens: fineTune.availableKaizens ?? [],
        open: !!fineTune.open
      })
    : '';

  const modal = renderOpenDialog(openDialog);

  if (infeasible) {
    return `<main class="today-page" data-route="today">
  ${header}
  ${InfeasibleBanner({ infeasible })}
  <section class="today-infeasible" aria-live="polite">
    <p class="empty-copy">${esc(TODAY_COPY.INFEASIBLE)}</p>
    ${AutoPlanButton({ loading, variant: 'primary' })}
  </section>
  ${drawer}
  ${modal}
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
  ${drawer}
  ${modal}
</main>`;
  }

  return `<main class="today-page" data-route="today">
  ${header}
  ${CycleCard({
    composition: activeState.composition,
    activities: activeState.activities,
    targets: strips.targets,
    floors: strips.floors,
    ceilings: strips.ceilings,
    nowIso,
    kaizenTitleById: props.kaizenTitleById ?? {}
  })}
  ${drawer}
  ${modal}
</main>`;
}

/**
 * Render any open dialog (CLOSE or SKIP). Returns '' when nothing to show.
 *
 * @param {null | {kind: string, activityId: string, schema?: string, artifactDef?: object, activityName?: string}} openDialog
 * @returns {string}
 */
function renderOpenDialog(openDialog) {
  if (!openDialog || typeof openDialog !== 'object') return '';
  if (openDialog.kind === 'CLOSE') {
    return OutputArtifactDialog({
      activityId: openDialog.activityId,
      schema: openDialog.schema ?? 'TEXT',
      artifactDef: openDialog.artifactDef ?? {}
    });
  }
  if (openDialog.kind === 'SKIP') {
    return SkipReasonModal({
      activityId: openDialog.activityId,
      activityName: openDialog.activityName ?? ''
    });
  }
  return '';
}

export default Today;
