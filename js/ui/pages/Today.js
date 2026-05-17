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
import { BlockDetailDialog } from '../components/BlockDetailDialog.js';
import { CatalogPickerDialog } from '../components/CatalogPickerDialog.js';
import { validateEditState } from '../editMode.js';
import { DEFAULT_TARGETS } from '../components/BucketStrip.js';
// Iter 42 Phase 3 — Cadence Pressure Ring (signature pattern).
import { CadencePressureRing } from '../components/CadencePressureRing.js';

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
 *   whyPlanExpanded?: boolean,
 *   blockDetail?: {activityId: string} | null,
 *   kaizenTitleById?: Record<string, string>,
 *   catalog?: object[],
 *   dragSession?: object | null,        — Iter 35: PROPOSED pending-confirm state
 *   conflictBanner?: object | null,     — Iter 35: post-commit overlap warning
 *   catalogPickerDialog?: object | null — Iter 36: catalog picker state {startMinutes, search, bucketFilter}
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
  // Iter 30 — block detail popover.
  const blockDetail = props.blockDetail ?? null;
  // Iter 35 — drag state slices.
  const dragSession    = props.dragSession    ?? null;
  const conflictBanner = props.conflictBanner ?? null;
  // Iter 36 — catalog picker dialog.
  const catalogPickerDialog = props.catalogPickerDialog ?? null;
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

  // Iter 42 Phase 3 — Cadence Pressure Ring. Render when a composition exists
  // with activities; absent in empty / infeasible states (ring needs data to mean
  // something). Targets from composition snapshot when available, otherwise
  // canonical 4-2-2 defaults from BucketStrip.DEFAULT_TARGETS.
  // In edit mode, use the draft activities so the ring reflects live changes.
  // Note: editMode is already defined above (line ~123); !!editMode resolves isEditing.
  const ringActivities = activeState
    ? (!!editMode && editMode.activities ? editMode.activities : activeState.activities)
    : null;
  const ringHtml = ringActivities
    ? CadencePressureRing({
        activities: ringActivities,
        targets: DEFAULT_TARGETS
      })
    : '';

  const header = `<header class="today-header">
  ${ringHtml}
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

  // Iter 30 — render block detail popover when blockDetail is set.
  const blockDetailHtml = renderBlockDetailDialog(
    blockDetail,
    activeState,
    props.kaizenTitleById ?? {},
    props.catalog ?? []
  );

  // Iter 36 — render catalog picker dialog when catalogPickerDialog is set.
  const catalogPickerHtml = catalogPickerDialog
    ? CatalogPickerDialog({
        catalog: props.catalog ?? [],
        startMinutes: catalogPickerDialog.startMinutes ?? 0,
        search: catalogPickerDialog.search ?? '',
        bucketFilter: catalogPickerDialog.bucketFilter ?? 'ALL'
      })
    : '';

  const mainClass = isEditing ? 'today-page today-editing' : 'today-page';

  // Iter 35 Phase 2: drag-confirm banner for PROPOSED pending-commit flow (AC8).
  const dragConfirmBannerHtml = dragSession
    ? renderDragConfirmBanner(dragSession)
    : '';

  // Iter 35 Phase 2: conflict/overlap warning banner (AC10–AC13).
  const conflictBannerHtml = conflictBanner
    ? renderConflictBanner(conflictBanner)
    : '';

  // Iter 33: bucket strip in right margin (AC9). Only shown when not editing.
  const bucketStripHtml = !isEditing
    ? renderBucketStrip(activitiesForRender, compositionForRender)
    : '';

  // Iter 33: use flex layout with bucket strip alongside grid (AC9).
  const bodyWrapper = bucketStripHtml
    ? `<div class="today-body-with-strip">
    <div class="today-grid-col">
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
        whyPlanExpanded,
        dragSession
      })}
    </div>
    ${bucketStripHtml}
  </div>`
    : `<div class="today-body">
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
        whyPlanExpanded,
        dragSession
      })}
    </div>
  </div>`;

  return `<main class="${mainClass}" data-route="today">
  ${header}
  ${dragConfirmBannerHtml}
  ${conflictBannerHtml}
  ${bodyWrapper}
  ${editDrawerHtml}
  ${modal}
  ${blockDetailHtml}
  ${catalogPickerHtml}
</main>`;
}

/**
 * Iter 33 — render right-margin bucket summary strip (AC9).
 * Computes minutes-per-bucket from the activities array. Target values are
 * looked up from the composition's targets snapshot when available, otherwise
 * canonical defaults from BucketStrip.DEFAULT_TARGETS are used
 * (PROJECT 240m, COMMUNICATION 120m, CI 120m per BucketStrip.DEFAULT_TARGETS).
 *
 * @param {object[]} activities
 * @param {object} composition
 * @returns {string}
 */
function renderBucketStrip(activities, composition) {
  if (!Array.isArray(activities) || activities.length === 0) return '';

  // Compute actual minutes per bucket.
  const totals = { PROJECT: 0, COMMUNICATION: 0, CI: 0 };
  for (const a of activities) {
    const b = a.bucket;
    if (b && b in totals) {
      totals[b] += Number(a.plannedDurationMinutes ?? 0);
    }
  }

  // Target minutes — from composition targets if present, else canonical
  // 4-2-2 defaults from BucketStrip.DEFAULT_TARGETS (single source of truth).
  const targetMins = {
    PROJECT:       composition?.targets?.PROJECT       ?? DEFAULT_TARGETS.PROJECT,
    COMMUNICATION: composition?.targets?.COMMUNICATION ?? DEFAULT_TARGETS.COMMUNICATION,
    CI:            composition?.targets?.CI            ?? DEFAULT_TARGETS.CI,
  };

  function fmtMins(mins) {
    if (mins === 0) return '0m';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  }

  function bucketRow(bucketKey, displayName, cssNameClass, fillClass) {
    const actual = totals[bucketKey] ?? 0;
    const target = targetMins[bucketKey] ?? 1;
    const pct = Math.min(Math.round((actual / target) * 100), 100);
    return `<div class="cycle-bucket-row">
      <div class="cycle-bucket-row-label">
        <span class="cycle-bucket-name ${esc(cssNameClass)}">${esc(displayName)}</span>
        <span class="cycle-bucket-value">${esc(fmtMins(actual))}</span>
      </div>
      <div class="cycle-bucket-track">
        <div class="cycle-bucket-fill ${esc(fillClass)}" style="width: ${pct}%" aria-hidden="true"></div>
      </div>
      <p class="cycle-bucket-sub">target ${esc(fmtMins(target))}</p>
    </div>`;
  }

  return `<aside class="cycle-bucket-strip" aria-label="Bucket capacity summary">
  <p class="cycle-bucket-strip-heading">Today's Load</p>
  ${bucketRow('PROJECT', 'Deep Work', 'cycle-bucket-name-project', 'cycle-bucket-fill-project')}
  ${bucketRow('COMMUNICATION', 'Comms', 'cycle-bucket-name-communication', 'cycle-bucket-fill-communication')}
  ${bucketRow('CI', 'CI', 'cycle-bucket-name-ci', 'cycle-bucket-fill-ci')}
</aside>`;
}

/**
 * Iter 35 Phase 2 — render the drag-confirm banner for PROPOSED compositions.
 *
 * When a drag completes on a PROPOSED composition, the change is queued as
 * pending (not committed). This banner prompts the user to Confirm or Cancel.
 *
 * Actions dispatched:
 *   DRAG_CONFIRM — commits the pending drag via existing EDIT_CHANGE_* actions
 *   DRAG_CANCEL  — clears state.dragSession; no underlying mutation
 *
 * @param {{
 *   activityId: string,
 *   activityName?: string,
 *   newStart: string,
 *   newDuration: number,
 *   originalStart: string,
 *   originalDuration: number,
 *   mode: string
 * }} session
 * @returns {string}
 */
function renderDragConfirmBanner(session) {
  if (!session || typeof session.activityId !== 'string') return '';

  const name = session.activityName ? esc(session.activityName) : 'block';
  const newStart = session.newStart ? esc(session.newStart) : '';
  const mode = session.mode === 'resize' ? 'resize' : 'move';
  const actionVerb = mode === 'resize' ? `Resize ${name} to ${session.newDuration}min?` : `Move ${name} to ${newStart}?`;

  const payloadConfirm = JSON.stringify({ activityId: session.activityId });
  const payloadCancel  = JSON.stringify({});

  return `<div class="today-drag-confirm-banner" role="alert" aria-live="assertive">
  <span class="today-drag-confirm-message">${actionVerb}</span>
  <div class="today-drag-confirm-actions">
    <button class="today-drag-confirm-btn today-drag-confirm-btn--confirm"
      data-action="DRAG_CONFIRM"
      data-payload='${esc(payloadConfirm)}'>Confirm</button>
    <button class="today-drag-confirm-btn today-drag-confirm-btn--cancel"
      data-action="DRAG_CANCEL"
      data-payload='${esc(payloadCancel)}'>Cancel</button>
  </div>
</div>`;
}

/**
 * Iter 35 Phase 2 — render the conflict/overlap warning banner (SW-Q-CAL-03).
 *
 * Shown after a drag commit that results in time-range overlap with another
 * non-protected activity. Non-blocking: the drop has already fired; the user
 * can Revert or Keep (manual fix).
 *
 * Actions dispatched:
 *   CONFLICT_REVERT — re-fires EDIT_CHANGE_* with original values
 *   CONFLICT_KEEP   — dismisses banner; user manually fixes
 *
 * @param {{
 *   activityId: string,
 *   activityName?: string,
 *   againstName: string,
 *   againstStartHHMM: string,
 *   originalStart: string,
 *   originalDuration: number,
 *   mode: string
 * }} banner
 * @returns {string}
 */
function renderConflictBanner(banner) {
  if (!banner || typeof banner.activityId !== 'string') return '';

  const againstName  = banner.againstName     ? esc(banner.againstName)     : 'another block';
  const againstStart = banner.againstStartHHMM ? esc(banner.againstStartHHMM) : '';

  const warningText = againstStart
    ? `This change overlaps ${againstName} at ${againstStart}.`
    : `This change overlaps ${againstName}.`;

  const payloadRevert = JSON.stringify({
    activityId:       banner.activityId,
    originalStart:    banner.originalStart,
    originalDuration: banner.originalDuration,
    mode:             banner.mode
  });
  const payloadKeep = JSON.stringify({});

  return `<div class="today-conflict-banner" role="alert" aria-live="assertive">
  <span class="today-conflict-icon" aria-hidden="true">&#x26A0;</span>
  <span class="today-conflict-message">${warningText}</span>
  <div class="today-conflict-actions">
    <button class="today-conflict-btn today-conflict-btn--revert"
      data-action="CONFLICT_REVERT"
      data-payload='${esc(payloadRevert)}'>Revert</button>
    <button class="today-conflict-btn today-conflict-btn--keep"
      data-action="CONFLICT_KEEP"
      data-payload='${esc(payloadKeep)}'>Keep (manual fix)</button>
  </div>
</div>`;
}

/**
 * Iter 30 — render the BlockDetailDialog when blockDetail is non-null.
 *
 * Looks up the activity from activeState.activities by id, resolves the
 * kaizen title and catalog outputArtifact, then delegates to the pure
 * BlockDetailDialog render function. Returns '' when the dialog is closed
 * or the activity cannot be found.
 *
 * @param {{activityId: string} | null} blockDetail
 * @param {{composition: object, activities: object[]} | null} activeState
 * @param {Record<string, string>} kaizenTitleById
 * @param {object[]} catalog
 * @returns {string}
 */
function renderBlockDetailDialog(blockDetail, activeState, kaizenTitleById, catalog) {
  if (!blockDetail || typeof blockDetail.activityId !== 'string') return '';
  if (!activeState || !Array.isArray(activeState.activities)) return '';

  const activity = activeState.activities.find((a) => a && a.id === blockDetail.activityId);
  if (!activity) return '';

  // Resolve kaizen title from the lookup map.
  const kaizenTitle = activity.linkedKaizenId && kaizenTitleById[activity.linkedKaizenId]
    ? kaizenTitleById[activity.linkedKaizenId]
    : null;

  // Resolve outputArtifact from catalog entry.
  const catalogEntry = Array.isArray(catalog)
    ? catalog.find((c) => c && c.id === activity.catalogEntryId) ?? null
    : null;
  const outputArtifact = catalogEntry?.outputArtifact ?? null;

  return BlockDetailDialog({ activity, kaizenTitle, outputArtifact });
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
