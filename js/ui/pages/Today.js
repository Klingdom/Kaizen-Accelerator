/**
 * Today page container (E10-T2 + Sprint 5 additions).
 *
 * Phase A simplification (Today Simplification sprint):
 *   Today renders ONLY: header + CycleCard + conditional drawers/modals.
 *   WhyThisPlan, MorningRecap, EOD CTA relocated into CycleCard.
 *   NowPane, RhythmExplainer, UpNextRail, EodClosureStrip removed from render path.
 *   See js/ui/components/_backup/ for archived component files.
 *
 * Phase 2 (Iter 25):
 *   Removed AdherenceDial, FineTuneButton, FineTuneDrawer from render path.
 *   Today header renders only the day badge.
 *   Activity list now has column headers + per-row Update button (EDIT_QUICK_UPDATE).
 *   Dead props removed: adherence, targets, floors, ceilings, fineTune.
 *
 * Responsibilities:
 *   - Given an active Composition + its children, render a CycleCard.
 *   - If no Composition exists for the user, render the first-run banner
 *     copy + an AutoPlanButton as the primary CTA.
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
import { InfeasibleBanner } from '../components/InfeasibleBanner.js';
import { OutputArtifactDialog } from '../components/OutputArtifactDialog.js';
import { SkipReasonModal } from '../components/SkipReasonModal.js';
import { EditDrawer } from '../components/EditDrawer.js';
import { validateEditState } from '../editMode.js';

/**
 * Empty-state copy per SCHEDULING_UX §6.5.2.
 *
 * FIRST_RUN is a warmer, aspirational welcome reserved for a user who has
 * never composed a day. EMPTY is the quieter "any other day without a
 * composition" copy — a returning user sees this after rejecting yesterday's
 * plan or starting fresh. INFEASIBLE fires when the composer returns
 * infeasible and surfaces the Fine-tune pathway.
 */
export const TODAY_COPY = Object.freeze({
  FIRST_RUN:
    'Welcome to CadencePlan. Tap Auto-Plan to compose your first balanced day — you can always adjust before you accept.',
  EMPTY: 'No day scheduled yet. Auto-Plan to see a proposal, or add activities from the Catalog.',
  INFEASIBLE:
    "Composer flagged an infeasible day. Raise your daily capacity or reduce external meetings, then Auto-Plan again."
});

/**
 * Sprint 11 Pass 11c — onboarding hint strip microcopy.
 *
 * Given `daysSinceSignup`, return the appropriate nudge to render under
 * the day badge in the empty state. Bands:
 *   Day 0-1  → welcome + auto-plan callout
 *   Day 2-6  → "X days in" progress nudge
 *   Day 7+   → Friday-reflection nudge
 *
 * Negative / non-finite input → null (no hint).
 *
 * @param {number} daysSinceSignup
 * @returns {string | null}
 */
export function daysSinceSignupHint(daysSinceSignup) {
  if (!Number.isFinite(daysSinceSignup) || daysSinceSignup < 0) return null;
  if (daysSinceSignup <= 1) {
    return 'Welcome to CadencePlan. Tap Auto-Plan to compose your first balanced day.';
  }
  if (daysSinceSignup <= 6) {
    return `You're ${daysSinceSignup} days in. Aim for at least 5 accepted days in your first week.`;
  }
  return "Your first Weekly Reflection is Friday. That's where improvement ideas surface.";
}

/**
 * @param {{
 *   activeState: null | {composition: object, activities: object[]},
 *   loading?: boolean,
 *   isFirstRun?: boolean,
 *   infeasible?: {explain: string[]} | null,
 *   infeasibleExplain?: string[] | null,
 *   daysSinceSignup?: number | null,
 *   nowIso?: string,
 *   openDialog?: null | {
 *     kind: 'CLOSE' | 'SKIP',
 *     activityId: string,
 *     schema?: string,
 *     artifactDef?: object,
 *     activityName?: string
 *   },
 *   priorDayRecap?: {closedCount: number, totalCount: number, skippedCount: number, dateIso: string} | null,
 *   eodRecap?: {closedCount: number, totalCount: number, skippedCount: number, pendingReflectionCount: number} | null,
 *   whyPlanExpanded?: boolean
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
  const nowIso = props.nowIso ?? null;
  const openDialog = props.openDialog ?? null;
  const editMode = props.editMode ?? null; // null when closed; object when open
  // Phase A: props forwarded to CycleCard for disclosure regions + EOD CTA.
  const priorDayRecap = props.priorDayRecap ?? null;
  const eodRecap = props.eodRecap ?? null;
  const whyPlanExpanded = !!props.whyPlanExpanded;

  // Iter 25: daysSinceSignup passed directly (no longer derived from adherence).
  // Falls back to reading from the legacy adherence.daysSinceSignup shape if
  // app.js still passes the old prop during a transition window.
  const rawDaysSinceSignup =
    props.daysSinceSignup != null
      ? props.daysSinceSignup
      : (props.adherence?.daysSinceSignup ?? null);
  const daysSinceSignup = Number.isFinite(rawDaysSinceSignup) ? rawDaysSinceSignup : null;

  // Header — day-counter badge only (Iter 25: AdherenceDial + FineTuneButton removed).
  const dayBadge = daysSinceSignup !== null
    ? `<span class="today-day-badge" aria-label="day ${esc(String(daysSinceSignup + 1))} since signup">Day ${esc(String(daysSinceSignup + 1))}</span>`
    : '';
  const header = `<header class="today-header">
  ${dayBadge}
</header>`;

  const modal = renderOpenDialog(openDialog);

  if (infeasible) {
    return `<main class="today-page" data-route="today">
  ${header}
  ${InfeasibleBanner({ infeasible })}
  <section class="today-infeasible" aria-live="polite">
    <p class="empty-copy">${esc(TODAY_COPY.INFEASIBLE)}</p>
    ${AutoPlanButton({ loading, variant: 'primary' })}
  </section>
  ${modal}
</main>`;
  }

  if (!activeState) {
    const emptyCopy = isFirstRun ? TODAY_COPY.FIRST_RUN : TODAY_COPY.EMPTY;
    // Sprint 11 Pass 11c — onboarding hint strip on empty-state only.
    const hintCopy = daysSinceSignup !== null
      ? daysSinceSignupHint(daysSinceSignup)
      : null;
    const hintHtml = hintCopy
      ? `<p class="today-onboarding-hint" role="note">${esc(hintCopy)}</p>`
      : '';
    return `<main class="today-page" data-route="today">
  ${header}
  ${hintHtml}
  <section class="today-empty">
    <p class="empty-copy">${esc(emptyCopy)}</p>
    ${AutoPlanButton({ loading, variant: 'primary' })}
  </section>
  ${modal}
</main>`;
  }

  // Edit mode: swap activities + editing flags in CycleCard, render the
  // EditDrawer, and dim the surrounding page via the `today-editing` class.
  const isEditing = !!editMode;
  const activitiesForRender = isEditing
    ? editMode.activities
    : activeState.activities;
  const compositionForRender = isEditing
    ? { ...activeState.composition, state: activeState.composition.state }
    : activeState.composition;
  // Iter 25: validateEditState no longer needs bucket targets/floors/ceilings
  // from Today — those were only for BucketStrip which is now removed. We pass
  // empty objects so the call signature is preserved without dead prop drilling.
  const violations = isEditing
    ? validateEditState(activitiesForRender, {}, {}, {}).violations
    : [];
  const editDrawerHtml = isEditing
    ? EditDrawer({
        catalog: props.catalog ?? [],
        activities: activitiesForRender,
        selectedActivityId: editMode.selectedActivityId ?? null,
        search: editMode.searchQuery ?? '',
        projectTypeFilter: editMode.projectTypeFilter ?? 'all',
        expandedBuckets: editMode.expandedBuckets ?? ['PROJECT'],
        undoCount: Array.isArray(editMode.undoStack) ? editMode.undoStack.length : 0,
        violations
      })
    : '';
  const mainClass = isEditing ? 'today-page today-editing' : 'today-page';

  return `<main class="${mainClass}" data-route="today">
  ${header}
  <div class="today-body">
    <div class="today-card-col">
      ${CycleCard({
        composition: compositionForRender,
        activities: activitiesForRender,
        nowIso,
        kaizenTitleById: props.kaizenTitleById ?? {},
        catalog: props.catalog ?? [],
        editMode: isEditing,
        selectedActivityId: isEditing ? editMode.selectedActivityId ?? null : null,
        undoCount: isEditing && Array.isArray(editMode.undoStack) ? editMode.undoStack.length : 0,
        priorDayRecap,
        eodRecap,
        whyPlanExpanded
      })}
    </div>
  </div>
  ${editDrawerHtml}
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
