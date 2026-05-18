/**
 * CadencePlan MVP — single-page app entry (Sprint 4 + Sprint 5).
 *
 * Sprint 5 additions:
 *   - ActivityService / VarianceService wired
 *   - START_ACTIVITY handler (SCHEDULED → IN_PROGRESS)
 *   - OPEN_CLOSE_DIALOG + SUBMIT_CLOSE_DIALOG + CLOSE_CLOSE_DIALOG
 *   - OPEN_SKIP_MODAL + SUBMIT_SKIP_MODAL + CLOSE_SKIP_MODAL
 *   - Fine-tune drawer + re-compose pipeline (P1-T2)
 *   - InfeasibleBanner (P2-T1)
 *   - SmartDefaults ensureUser() on boot
 *
 * This file is the ONLY place that:
 *   - calls `document.*` (via `js/ui/mount.js` helpers)
 *   - reads `window.location.hash`
 *   - attaches `hashchange` listeners
 *   - writes state-dependent UI
 *
 * Every other module is pure: takes data in, returns strings / values out.
 */

import { boot } from './boot.js';
import { LocalStorageRepository } from './persistence/LocalStorageRepository.js';
import { EventBus } from './events/EventBus.js';
import { ClockService } from './services/ClockService.js';
import { IdGeneratorService } from './services/IdGeneratorService.js';
import { CatalogService, CATALOG_KEY } from './services/CatalogService.js';
import { ComposerService } from './services/ComposerService.js';
import { VarianceService } from './services/VarianceService.js';
import { ActivityService } from './services/ActivityService.js';
import { ReflectionService } from './services/ReflectionService.js';
import { FrictionService } from './services/FrictionService.js';
import { KaizenService } from './services/KaizenService.js';
import { OpportunityService } from './services/OpportunityService.js';
import { WeeklyComposerService } from './services/WeeklyComposerService.js';
import { ensureUser } from './services/SmartDefaults.js';
import {
  CycleProposed,
  CycleAccepted,
  CycleRejected,
  ComposerInfeasible,
  ActivityStarted,
  ActivityCompleted,
  VarianceLogged,
  ReflectionStubbed,
  ReflectionCaptured,
  FrictionSignalCaptured,
  KaizenPromoted,
  KaizenBaselineLocked,
  KaizenRemeasurementStarted,
  KaizenRemeasured,
  KaizenClosed,
  KaizenAbandoned,
  OpportunityCreated,
  OpportunityPromoted,
  OpportunityDeferred,
  OpportunityRejected,
  WeeklyCycleProposed,
  WeeklyCycleAccepted,
  KaizenStepCompleted,
  KaizenStepScheduled,
  CycleEdited,
  ActivityStartedLate,
  CycleReflowed,
  TodayPageViewed,
  EditDrawerOpened,
  RowOutputClicked,
  CISkipConfirmed
} from './events/events.js';
import { BROWSER_CATALOG } from './catalog/browserSeed.js';
import { getFullCatalog } from './catalog/fullCatalog.js';
import { AppShell } from './ui/AppShell.js';
import { Today } from './ui/pages/Today.js';
import { Kaizen as KaizenPage } from './ui/pages/Kaizen.js';
import { Portfolio } from './ui/pages/Portfolio.js';
import { Catalog as CatalogPage } from './ui/pages/Catalog.js';
import { Week as WeekPage } from './ui/pages/Week.js';
import { PlaceholderPage } from './ui/pages/PlaceholderPage.js';
import { Settings } from './ui/pages/Settings.js';
import * as UserPreferencesService from './services/UserPreferencesService.js';
import { USER_PREFS_KEY } from './services/UserPreferencesService.js';
import { InsightsPortfolio } from './ui/pages/InsightsPortfolio.js';
import { parseArtifactFields } from './ui/components/OutputArtifactDialog.js';
import { ReflectionSheet } from './ui/components/ReflectionSheet.js';
import { BlockDetailDialog } from './ui/components/BlockDetailDialog.js';
import { CatalogPickerDialog } from './ui/components/CatalogPickerDialog.js';
import {
  BaselineDialog,
  extractBaselineFields
} from './ui/components/BaselineDialog.js';
import {
  RemeasurementDialog,
  extractRemeasurementFields
} from './ui/components/RemeasurementDialog.js';
import { KaizenCloseDialog } from './ui/components/KaizenCloseDialog.js';
import { Toast, ToastKind } from './ui/components/Toast.js';
import {
  isProtectedBlock,
  applySwap,
  applyRemove,
  applyAdd,
  applyDurationChange,
  applyStartTimeChange,
  pushUndo,
  popUndo,
  DURATION_OPTIONS
} from './ui/editMode.js';
import {
  mountHtml,
  attachRootClickListener
} from './ui/mount.js';
import {
  installFocusTrap,
  releaseFocusTrap
} from './ui/focusTrap.js';
import {
  createRouteListener,
  parseHash,
  buildHash
} from './ui/router.js';
import { detectOverlap, installDragController } from './ui/dragController.js';

/**
 * Default user — single-user MVP. A future sprint replaces this with a
 * real Settings-driven User row.
 */
export const DEFAULT_USER = Object.freeze({
  id: 'user_phil_mvp',
  name: 'Phil',
  email: 'phil@mediafier.ai',
  role: ['PRACTITIONER'],
  dailyCapacityMinutes: 480,
  workDays: [1, 2, 3, 4, 5],
  sprintAnchorDate: '2026-04-20',
  timezone: 'America/Los_Angeles',
  deepSlicePreference: '2x2h',
  createdAt: '2026-04-01T00:00:00Z'
});

const APP_ROOT_ID = 'app-root';

/**
 * Build the app services. Exported for tests and for the browser
 * bootstrapper. Side effects: reads/writes localStorage (via the repo),
 * seeds the catalog if empty.
 *
 * @param {{storage?: object, clock?: ClockService}} [deps]
 * @returns {object}
 */
export function buildServices(deps = {}) {
  const repo = new LocalStorageRepository({
    storage: deps.storage ?? globalThis.localStorage
  });
  const bus = new EventBus();
  const clock = deps.clock ?? new ClockService();
  // C-SA-1: injected id generator keeps edit-mode ids deterministic.
  // Tests override this with createDeterministicIdGenerator(seed).
  const idGenerator = deps.idGenerator ?? new IdGeneratorService();

  boot(repo, { now: () => clock.nowDate() });

  const catalogService = new CatalogService({ repo });
  // Seed only if empty — idempotent across reloads.
  const existing = repo.read(CATALOG_KEY);
  if (!existing || Object.keys(existing).length === 0) {
    // Browser path uses the 9-entry browserSeed until fullCatalog.json is
    // present (generated by exportFullCatalog). Tests use the full
    // pipeline via their own CatalogService.seed() calls.
    catalogService.seed(BROWSER_CATALOG.map((c) => ({ ...c })));
  }

  const composerService = new ComposerService({
    repo,
    bus,
    clock,
    catalogService
  });
  const varianceService = new VarianceService({ repo, bus, clock });
  const activityService = new ActivityService({
    repo,
    bus,
    clock,
    varianceService,
    catalogService,
    composerService
  });

  // Sprint 6 — reflection loop + kaizen services.
  const frictionService = new FrictionService({ repo, bus, clock });
  const reflectionService = new ReflectionService({ repo, bus, clock });
  reflectionService.setFrictionService(frictionService);
  const kaizenService = new KaizenService({ repo, bus, clock });
  kaizenService.setFrictionService(frictionService);
  // Sprint 10b Pass B — step methods need the catalog.
  kaizenService.setCatalogService({
    list: () => catalogService.list(DEFAULT_USER.id)
  });

  // Sprint 7 — Opportunity intake service.
  const opportunityService = new OpportunityService({
    repo,
    bus,
    clock,
    kaizenService
  });

  // Sprint 9 — Weekly composer service.
  const weeklyComposerService = new WeeklyComposerService({
    repo,
    bus,
    clock,
    composerService,
    catalogService,
    kaizenService,
    activityService
  });

  // Ensure a User row exists with smart defaults (Sprint 5 P0-T2).
  ensureUser({
    repo,
    clock,
    userId: DEFAULT_USER.id,
    name: DEFAULT_USER.name,
    email: DEFAULT_USER.email
  });

  return {
    repo,
    bus,
    clock,
    idGenerator,
    catalogService,
    composerService,
    varianceService,
    activityService,
    reflectionService,
    frictionService,
    kaizenService,
    opportunityService,
    weeklyComposerService
  };
}

/**
 * Build a composer input from the default user. Accepts optional
 * overrides for the fine-tune drawer: `capacityMinutesOverride` and
 * `externalMinutesToday` land on composerInputsSnapshot.
 *
 * @param {ClockService} clock
 * @param {{capacityMinutesOverride?: number, externalMinutesToday?: number, activeKaizenId?: string|null}} [overrides]
 * @returns {object}
 */
export function buildComposerInput(clock, overrides = {}) {
  const date = clock.nowDate().toISOString().slice(0, 10);
  const effectiveCapacity =
    typeof overrides.capacityMinutesOverride === 'number'
      ? overrides.capacityMinutesOverride
      : DEFAULT_USER.dailyCapacityMinutes;
  const effectiveExternal =
    typeof overrides.externalMinutesToday === 'number'
      ? overrides.externalMinutesToday
      : 0;

  const input = {
    cycleType: 'DAILY',
    userId: DEFAULT_USER.id,
    date,
    role: [...DEFAULT_USER.role],
    dailyCapacityMinutes: effectiveCapacity,
    externalMinutesToday: effectiveExternal,
    // Sprint 5: expose the override for downstream Composition snapshot.
    capacityMinutesOverride:
      typeof overrides.capacityMinutesOverride === 'number'
        ? overrides.capacityMinutesOverride
        : null,
    sprintPhase: 'EXECUTION',
    sprintAnchorDate: DEFAULT_USER.sprintAnchorDate,
    user: {
      deepSlicePreference: DEFAULT_USER.deepSlicePreference,
      sprintAnchorDate: DEFAULT_USER.sprintAnchorDate
    },
    activeKaizen:
      overrides.activeKaizenId === null
        ? null
        : {
            id: overrides.activeKaizenId ?? 'k_cadenceplan_mvp',
            title: 'Ship CadencePlan MVP',
            state: 'ACTIVE',
            projectType: 'DMAIC',
            nextStepActivityNumber: 34
          },
    varianceQueue: [],
    priorCompositions: [],
    signals: {
      inboxOverThreshold: false,
      documentAwaitingReview: [],
      innovationStageReady: []
    },
    pdcaExperiment: null
  };
  return input;
}

/**
 * App state — the single render-fed object. `renderApp()` reads from
 * this (plus the repo) to produce HTML; handlers mutate it and call
 * renderApp() again.
 */
function createState() {
  return {
    route: 'today',
    params: {},
    // Iter 39 — Luminous Constraint Phase 1: user theme/motion preferences.
    // Loaded from localStorage at boot; defaults to {themeId:'system', motion:'full'}.
    userPreferences: UserPreferencesService.getDefaults(),
    composerLoading: false,
    infeasibleExplain: null,
    lastError: null,
    // Iter 34: renamed from fineTune (drawer removed in Iter 25).
    // Holds user-customizable composer inputs. Dead fields (open,
    // _snapshotBeforeChange) dropped; only load-bearing fields kept.
    composerConfig: {
      capacityMinutes: DEFAULT_USER.dailyCapacityMinutes,
      externalMinutesToday: 0,
      activeKaizenId: 'k_cadenceplan_mvp',
      availableKaizens: []
    },
    // Sprint 5: open dialog state (CLOSE artifact modal OR SKIP reason modal).
    openDialog: null,
    // Sprint 6: reflection sheet (opens on ActivityCompleted).
    reflectionSheet: null,
    // Sprint 6: weekly reflection wizard state.
    wizard: null,
    // Sprint 7 P0-T5 / T6: Portfolio state.
    portfolio: {
      intakeForm: null,           // when truthy, OpportunityIntakeForm is shown
      expandedOpportunityId: null, // P1-T1 inline expand
      oppFilter: 'all',
      oppSort: 'newest'
    },
    // Sprint 7 P0-T7: Catalog page view toggle (list / bucket).
    catalogView: 'list',
    // Sprint 8: Kaizen HARD RULE close loop dialogs.
    baselineDialog: null,          // { kaizenId, fields..., errorName?, errorMessage? }
    remeasurementDialog: null,     // { kaizenId, currentValue, evidenceSchema, evidenceValue, errorName? }
    closeKaizenDialog: null,       // { kaizenId, lessonsLearned, errorName? }
    kaizenAbandonForm: null,       // { kaizenId } — when truthy, inline abandon form open
    // Sprint 10b Pass B — Portfolio expand/collapse for projects.
    expandedKaizenId: null,
    // Sprint 10 backlog #3 — once dismissed, the 4-2-2 onboarding banner
    // never shows again. Hydrated from repo at boot.
    rhythmExplainerDismissed: false,
    // Sprint 11 P0-T3 — top-level toast. `null` hides the banner;
    // `{kind, message, id}` renders above pageHtml. `id` helps
    // `setTimeout` decide whether the currently-showing toast is still
    // the one it was scheduled to clear.
    toast: null,
    // Sprint 12 — Edit mode. null when closed. When the user clicks Edit
    // on a CycleCard this becomes:
    //   {
    //     compositionId,
    //     snapshotActivities: original activities[] (for Cancel),
    //     activities: mutable working array,
    //     selectedActivityId: slot currently selected for swap (or
    //       '__new__' when the user wants to add a new slot),
    //     undoStack: prior activities[] snapshots,
    //     searchQuery, projectTypeFilter,
    //     expandedBuckets: ['PROJECT', 'COMMUNICATION', 'CI']
    //   }
    editMode: null,
    // Iter 30 — block detail popover. null = closed; {activityId} = open.
    blockDetail: null,
    // Iter 47 Phase 2 — Lunch tooltip. null = hidden; {timeRange} = visible.
    // Replaces BlockDetailDialog for lunch blocks (AC13, AC14).
    lunchTooltip: null,
    // Iter 36 — catalog picker dialog. null = closed; {startMinutes, search, bucketFilter} = open.
    catalogPickerDialog: null,
    // Iter 35 — drag-and-drop state (Phase 2).
    // dragSession: null when idle; set during PROPOSED pending-confirm flow.
    //   Shape: { activityId, activityName, newStart, newDuration, originalStart,
    //            originalDuration, mode, proposedStart, proposedDuration }
    dragSession: null,
    // conflictBanner: null when no overlap; set after a drag commit that overlaps.
    //   Shape: { activityId, activityName, againstName, againstStartHHMM,
    //            originalStart, originalDuration, mode }
    conflictBanner: null,
    // C-UX-12 (Iteration 14) — "Why this plan?" disclosure chip state.
    // Collapses on each new page load (plan changes daily).
    whyPlanExpanded: false,
    // C-UX-6: focus trap handles for EditDrawer, FineTuneDrawer, and all 8
    // modal dialogs wired in Iter 27 (C-UX-6b). Each handle is the opaque
    // object returned by installFocusTrap(); null means trap not installed.
    _focusTrap: {
      editDrawer: null,
      fineTuneDrawer: null,
      // Iter 27 — 8 remaining dialogs.
      baselineDialog: null,
      kaizenCloseDialog: null,
      opportunityIntakeForm: null,
      outputArtifactDialog: null,
      reflectionSheet: null,
      remeasurementDialog: null,
      skipReasonModal: null,
      weeklyReflectionWizard: null,
      // Iter 30 — block detail popover.
      blockDetailDialog: null,
      // Iter 36 — catalog picker dialog.
      catalogPickerDialog: null
    }
  };
}

/**
 * Default toast time-to-live in ms. Short enough to feel responsive,
 * long enough for success + error copy to be read.
 */
export const TOAST_TTL_MS = 3000;

/**
 * Show a toast. Idempotent: each call replaces whatever toast was
 * showing. Schedules a clearing rerender via `setTimeout`. Safe in test
 * environments that don't provide `setTimeout` (no-op).
 *
 * @param {object} state
 * @param {string} kind           — one of `ToastKind`
 * @param {string} message
 * @param {() => void} rerender
 * @param {number} [ttlMs]
 */
export function showToast(state, kind, message, rerender, ttlMs = TOAST_TTL_MS) {
  if (!state || typeof state !== 'object') return;
  if (typeof message !== 'string' || message.length === 0) return;
  const k = typeof kind === 'string' && kind in ToastKind ? kind : ToastKind.INFO;
  const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  state.toast = { kind: k, message, id };
  if (typeof globalThis.setTimeout === 'function' && ttlMs > 0) {
    const handle = globalThis.setTimeout(() => {
      // Only clear if the same toast is still showing. A newer toast that
      // replaced us has its own timer.
      if (state.toast && state.toast.id === id) {
        state.toast = null;
        if (typeof rerender === 'function') rerender();
      }
    }, ttlMs);
    // In Node (tests) `setTimeout` returns a Timeout with `.unref()` so
    // the pending timer does not keep the event loop alive. Browsers
    // return a numeric handle with no `.unref()`; guard both.
    if (handle && typeof handle.unref === 'function') {
      handle.unref();
    }
  }
}

/**
 * LocalStorage key for persisted Portfolio filter/sort preferences (P1-T3).
 */
export const PORTFOLIO_PREFS_KEY = 'bamx:v1:portfolioPrefs';

/**
 * LocalStorage key for the 4-2-2 rhythm-explainer dismissal (Sprint 10
 * backlog #3). Single boolean flag; once dismissed the banner never
 * shows again for that browser profile.
 */
export const RHYTHM_EXPLAINER_KEY = 'bamx:v1:prefs:rhythm-explainer-dismissed';

/**
 * Iter 35 — pure minute-of-day parser for drag overlap detection.
 * Mirrors the logic in weekGridMath.js / dragController.js without
 * an import cycle.
 *
 * @param {string} value
 * @returns {number|null}
 */
function _parseMinutes(value) {
  if (!value || typeof value !== 'string') return null;
  if (/^\d{2}:\d{2}$/.test(value)) {
    const [h, m] = value.split(':').map(Number);
    return h * 60 + m;
  }
  if (/^\d{2}:\d{2}:\d{2}$/.test(value)) {
    const [h, m] = value.slice(0, 5).split(':').map(Number);
    return h * 60 + m;
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

/**
 * Load persisted Portfolio filter/sort prefs (best-effort).
 *
 * @param {object} repo
 * @returns {{oppFilter?: string, oppSort?: string}|null}
 */
function loadPortfolioPrefs(repo) {
  try {
    return repo.read(PORTFOLIO_PREFS_KEY) ?? null;
  } catch {
    return null;
  }
}

/**
 * Persist Portfolio filter/sort prefs (best-effort; never throws).
 *
 * @param {object} repo
 * @param {{oppFilter: string, oppSort: string}} prefs
 */
function savePortfolioPrefs(repo, prefs) {
  try {
    repo.write(PORTFOLIO_PREFS_KEY, prefs);
  } catch {
    /* swallow */
  }
}

/**
 * Sprint 10c: list "orphan" ScheduledActivity rows for a given date.
 *
 * KaizenService.scheduleStep creates rows with `compositionId: null` so
 * the user can schedule a standard-work step directly from Portfolio
 * without an active Composition. ComposerService.getActiveComposition
 * filters those rows out (it only returns children of the latest
 * PROPOSED/ACCEPTED composition), so without this helper those rows
 * persist in storage but never render anywhere.
 *
 * @param {{read: (key: string) => any}} repo
 * @param {string} dateIso   YYYY-MM-DD
 * @returns {object[]}
 */
export function listOrphanActivitiesForDate(repo, dateIso) {
  if (!repo || typeof dateIso !== 'string' || dateIso.length < 10) return [];
  const acts = repo.read('bamx:v1:activities') ?? {};
  return Object.values(acts).filter(
    (a) =>
      a &&
      (a.compositionId == null) &&
      typeof a.plannedStartAt === 'string' &&
      a.plannedStartAt.slice(0, 10) === dateIso
  );
}

/**
 * Sprint 10c: merge orphan activities (from scheduleStep) into the
 * active state returned by `ComposerService.getActiveComposition`. If no
 * composition exists yet but orphans are present, synthesize a minimal
 * ACCEPTED composition so Today can render them — the composition id is
 * a stable sentinel ('synth_orphan_day') and callers can detect the
 * synthesized state via `composition.synthesizedForOrphans === true`.
 *
 * @param {null | {composition: object, activities: object[]}} activeState
 * @param {object[]} orphans
 * @returns {null | {composition: object, activities: object[]}}
 */
export function mergeOrphanActivities(activeState, orphans) {
  if (!Array.isArray(orphans) || orphans.length === 0) return activeState;
  if (activeState) {
    return {
      composition: activeState.composition,
      activities: [...activeState.activities, ...orphans]
    };
  }
  const plannedByBucket = { PROJECT: 0, COMMUNICATION: 0, CI: 0 };
  for (const a of orphans) {
    if (plannedByBucket[a.bucket] !== undefined) {
      plannedByBucket[a.bucket] += Number(a.plannedDurationMinutes ?? 0);
    }
  }
  const anchor = orphans[0];
  const dateIso = typeof anchor.plannedStartAt === 'string'
    ? anchor.plannedStartAt.slice(0, 10)
    : '';
  return {
    composition: {
      id: 'synth_orphan_day',
      userId: anchor.userId ?? '',
      date: dateIso,
      state: 'ACCEPTED',
      proposedAt: anchor.createdAt ?? '',
      acceptedAt: anchor.createdAt ?? '',
      capacityMinutes: 480,
      bucketTargets: { PROJECT: 240, COMMUNICATION: 120, CI: 120 },
      bucketFloors: { PROJECT: 120, COMMUNICATION: 60, CI: 60 },
      bucketCeilings: { PROJECT: 264, COMMUNICATION: 150, CI: 150 },
      plannedByBucket,
      synthesizedForOrphans: true
    },
    activities: [...orphans]
  };
}

/**
 * C-UX-6 / C-UX-6b: Synchronise focus-trap installation with current drawer
 * and dialog open/closed state. Called after every mountHtml so the trap
 * always targets fresh DOM.
 *
 * Drawers (EditDrawer, FineTuneDrawer) are rendered as `<aside>` elements.
 * Dialogs are rendered as `<section role="dialog">` elements inside the page.
 * We query them by their stable CSS class names after each render.
 *
 * This function is a no-op when `document` is not available (i.e. in tests).
 *
 * @param {object} state
 * @param {Record<string, Function>} [handlers]  — action handler map, used for
 *   onEscape callbacks so Escape closes the dialog and triggers focus-restore.
 */
/* istanbul ignore next — browser only */
function syncDrawerFocusTraps(state, handlers = {}) {
  if (typeof document === 'undefined') return;
  if (!state._focusTrap) return;

  // --- EditDrawer ---
  const editOpen = !!state.editMode;
  if (editOpen && !state._focusTrap.editDrawer) {
    const el = document.querySelector('.edit-drawer');
    state._focusTrap.editDrawer = installFocusTrap(el ?? null);
  } else if (!editOpen && state._focusTrap.editDrawer) {
    releaseFocusTrap(state._focusTrap.editDrawer);
    state._focusTrap.editDrawer = null;
  }

  // --- FineTuneDrawer (Iter 34: drawer removed in Iter 25; always release) ---
  if (state._focusTrap.fineTuneDrawer) {
    releaseFocusTrap(state._focusTrap.fineTuneDrawer);
    state._focusTrap.fineTuneDrawer = null;
  }

  // ---- Iter 27 (C-UX-6b): 8 remaining modal dialogs -------------------
  // Each entry: [stateFlag, trapKey, cssSelector, escapeHandlerName]
  // stateFlag  — truthy when the dialog is open
  // trapKey    — key on state._focusTrap to store the handle
  // cssSelector — querySelector to locate the dialog root in the DOM
  // escapeHandlerName — handler to invoke when Escape is pressed inside trap
  const dialogConfigs = [
    {
      open: !!state.baselineDialog,
      key: 'baselineDialog',
      selector: '.bd-modal',
      onEscapeAction: 'CLOSE_BASELINE_DIALOG'
    },
    {
      open: !!state.closeKaizenDialog,
      key: 'kaizenCloseDialog',
      selector: '.kcd-modal',
      onEscapeAction: 'CLOSE_CLOSE_KAIZEN_DIALOG'
    },
    {
      open: !!(state.portfolio && state.portfolio.intakeForm),
      key: 'opportunityIntakeForm',
      selector: '.oif-modal',
      onEscapeAction: 'OPP_CANCEL_INTAKE'
    },
    {
      open: !!(state.openDialog && state.openDialog.kind === 'CLOSE'),
      key: 'outputArtifactDialog',
      selector: '.oad-modal',
      onEscapeAction: 'CLOSE_CLOSE_DIALOG'
    },
    {
      open: !!state.reflectionSheet,
      key: 'reflectionSheet',
      selector: '.rs-modal',
      onEscapeAction: 'CLOSE_REFLECTION'
    },
    {
      open: !!state.remeasurementDialog,
      key: 'remeasurementDialog',
      selector: '.rd-modal',
      onEscapeAction: 'CLOSE_REMEASUREMENT_DIALOG'
    },
    {
      open: !!(state.openDialog && state.openDialog.kind === 'SKIP'),
      key: 'skipReasonModal',
      selector: '.srm-modal',
      onEscapeAction: 'CLOSE_SKIP_MODAL'
    },
    {
      open: !!state.wizard,
      key: 'weeklyReflectionWizard',
      selector: '.wrw-modal',
      onEscapeAction: 'WRW_CLOSE'
    },
    // Iter 30 — block detail popover.
    {
      open: !!state.blockDetail,
      key: 'blockDetailDialog',
      selector: '.bdd-modal',
      onEscapeAction: 'CLOSE_BLOCK_DETAIL'
    },
    // Iter 36 — catalog picker dialog.
    {
      open: !!state.catalogPickerDialog,
      key: 'catalogPickerDialog',
      selector: '.cpd-modal',
      onEscapeAction: 'CLOSE_CATALOG_PICKER'
    }
  ];

  for (const cfg of dialogConfigs) {
    if (cfg.open && !state._focusTrap[cfg.key]) {
      const el = document.querySelector(cfg.selector);
      const onEscape = typeof handlers[cfg.onEscapeAction] === 'function'
        ? () => handlers[cfg.onEscapeAction]({})
        : undefined;
      state._focusTrap[cfg.key] = installFocusTrap(el ?? null, { onEscape });
    } else if (!cfg.open && state._focusTrap[cfg.key]) {
      releaseFocusTrap(state._focusTrap[cfg.key]);
      state._focusTrap[cfg.key] = null;
    }
  }
}

/**
 * Render the entire app into the DOM. Pure shell around the pure page
 * components; real DOM only via `mountHtml`.
 *
 * @param {object} services
 * @param {object} state
 * @param {Record<string, Function>} [handlers]  — optional action handler map;
 *   forwarded to syncDrawerFocusTraps for dialog Escape wiring (Iter 27).
 */
export function renderApp(services, state, handlers = {}) {
  const {
    composerService,
    kaizenService,
    frictionService,
    opportunityService,
    catalogService,
    weeklyComposerService
  } = services;
  let pageHtml;

  if (state.route === 'today') {
    const activeState = composerService.getActiveComposition(DEFAULT_USER.id);
    // Sprint 10c fix: scheduleStep creates ScheduledActivity rows with
    // compositionId:null; getActiveComposition filters them out. Merge
    // today's orphan activities back into the active state so they show
    // up on the Today page.
    const todayDate = services.clock.now().slice(0, 10);
    const orphans = listOrphanActivitiesForDate(services.repo, todayDate);
    const mergedActiveState = mergeOrphanActivities(activeState, orphans);
    const daysSinceSignup = computeDaysSinceSignup(
      DEFAULT_USER.createdAt,
      services.clock.now()
    );
    // Build the kaizenId → title lookup so activity blocks can render a
    // "part of: [title]" chip across all states (Sprint 10 backlog item #2).
    const kaizenTitleById = {};
    if (kaizenService && typeof kaizenService.list === 'function') {
      for (const k of kaizenService.list({ userId: DEFAULT_USER.id }) ?? []) {
        if (k && typeof k.id === 'string') {
          kaizenTitleById[k.id] = k.title ?? k.name ?? k.id;
        }
      }
    }
    const catalogForEdit = catalogService ? catalogService.list(DEFAULT_USER.id) : [];
    // C-UX-10 (Iteration 14): compute prior-day recap (suppressed on day 0).
    const priorDayRecap = daysSinceSignup > 0
      ? computePriorDayRecap(services.repo, DEFAULT_USER.id, todayDate)
      : null;
    // C-UX-3 (Iteration 15): compute EOD closure recap.
    // Only computed when a real composition with activities exists.
    let eodRecap = null;
    if (mergedActiveState && Array.isArray(mergedActiveState.activities)) {
      const pendingCount = services.reflectionService
        ? services.reflectionService.listPending().length
        : 0;
      eodRecap = computeEodRecap(
        mergedActiveState.composition?.state ?? null,
        mergedActiveState.activities,
        services.clock.now(),
        pendingCount
      );
    }
    const todayHtml = Today({
      activeState: mergedActiveState,
      loading: state.composerLoading,
      isFirstRun: activeState === null && daysSinceSignup <= 1,
      infeasibleExplain: state.infeasibleExplain,
      daysSinceSignup,
      nowIso: services.clock.now(),
      openDialog: state.openDialog,
      kaizenTitleById,
      editMode: state.editMode,
      catalog: catalogForEdit,
      priorDayRecap,
      eodRecap,
      whyPlanExpanded: !!state.whyPlanExpanded,
      // Iter 30: block detail popover state.
      blockDetail: state.blockDetail ?? null,
      // Iter 35 Phase 2: drag state slices.
      dragSession:    state.dragSession    ?? null,
      conflictBanner: state.conflictBanner ?? null,
      // Iter 36: catalog picker dialog state.
      catalogPickerDialog: state.catalogPickerDialog ?? null,
      // Iter 47 Phase 2: lunch tooltip state (AC13, AC14).
      lunchTooltip: state.lunchTooltip ?? null
    });
    const reflectionSheetHtml = state.reflectionSheet
      ? ReflectionSheet(state.reflectionSheet)
      : '';
    pageHtml = `${todayHtml}${reflectionSheetHtml}`;
  } else if (state.route === 'portfolio' && opportunityService && kaizenService) {
    const userId = DEFAULT_USER.id;
    const activeKaizens = [
      ...kaizenService.listByState(userId, 'ACTIVE'),
      ...kaizenService.listByState(userId, 'IN_REMEASUREMENT')
    ];
    const closedKaizens = kaizenService.listByState(userId, 'CLOSED');
    const remeasurementsByKaizenId = {};
    for (const k of closedKaizens) {
      const rm = kaizenService.getRemeasurementForKaizen(k.id);
      if (rm) remeasurementsByKaizenId[k.id] = rm;
    }
    const opportunities = opportunityService.list({
      userId,
      includeTerminal: true
    });
    const catalogEntries = catalogService ? catalogService.list(userId) : [];
    const completedStepsByKaizenId =
      typeof kaizenService.getCompletedStepsByKaizenId === 'function'
        ? kaizenService.getCompletedStepsByKaizenId()
        : {};
    pageHtml = Portfolio({
      activeKaizens,
      closedKaizens,
      remeasurementsByKaizenId,
      opportunities,
      catalogEntries,
      completedStepsByKaizenId,
      expandedKaizenId: state.expandedKaizenId ?? null,
      nowIso: services.clock.now(),
      intakeForm: state.portfolio?.intakeForm ?? null,
      expandedOpportunityId: state.portfolio?.expandedOpportunityId ?? null,
      oppFilter: state.portfolio?.oppFilter ?? 'all',
      oppSort: state.portfolio?.oppSort ?? 'newest'
    });
  } else if (state.route === 'catalog' && catalogService) {
    const userId = DEFAULT_USER.id;
    const entries = catalogService.list(userId);
    pageHtml = CatalogPage({
      entries,
      view: state.catalogView ?? 'list'
    });
  } else if (state.route === 'week' && weeklyComposerService) {
    const userId = DEFAULT_USER.id;
    const weekStart =
      state.weekStartOverride ?? computeMondayIso(services.clock.now());
    const weeklyComposition =
      weeklyComposerService.getLatestProposed(userId);
    pageHtml = WeekPage({
      weeklyComposition,
      weekStart
    });
  } else if (state.route === 'kaizen' && kaizenService && frictionService) {
    const userId = DEFAULT_USER.id;
    const active =
      kaizenService.listByState(userId, 'ACTIVE')[0] ??
      kaizenService.listByState(userId, 'IN_REMEASUREMENT')[0] ??
      null;
    const drafts = kaizenService.listByState(userId, 'DRAFT');
    const baseline = active
      ? kaizenService.getBaselineForKaizen(active.id)
      : null;
    const remeasurement = active
      ? kaizenService.getRemeasurementForKaizen(active.id)
      : null;
    const openFrictionSignals = frictionService.list({
      userId,
      status: 'OPEN'
    });
    const kaizenHtml = KaizenPage({
      activeKaizen: active,
      draftKaizens: drafts,
      baseline,
      remeasurement,
      openFrictionSignals,
      wizardState: state.wizard,
      abandonForm: state.kaizenAbandonForm
    });
    const dialogHtml = renderKaizenDialogs(services, state);
    pageHtml = `${kaizenHtml}${dialogHtml}`;
  } else if (state.route === 'insights' && state.params?.sub === 'portfolio' && kaizenService) {
    // E14 / C-PM-2: Validated Kaizen Portfolio analytics page at /#insights/portfolio
    const userId = DEFAULT_USER.id;
    const closedKaizens = kaizenService.listByState(userId, 'CLOSED');
    const remeasurementsByKaizenId = {};
    const baselinesByKaizenId = {};
    for (const k of closedKaizens) {
      const rm = kaizenService.getRemeasurementForKaizen(k.id);
      if (rm) remeasurementsByKaizenId[k.id] = rm;
      const bl = kaizenService.getBaselineForKaizen(k.id);
      if (bl) baselinesByKaizenId[k.id] = bl;
    }
    // Pass the raw location hash so InsightsPortfolio can parse filter query params (AC6)
    const locationHash =
      typeof globalThis !== 'undefined' && globalThis.location
        ? (globalThis.location.hash ?? '')
        : '';
    pageHtml = InsightsPortfolio({
      kaizens: closedKaizens,
      remeasurementsByKaizenId,
      baselinesByKaizenId,
      nowIso: services.clock.now(),
      locationHash
    });
  } else if (state.route === 'settings') {
    // Iter 39 — Luminous Constraint Phase 1: dedicated settings page (AC12).
    const prefs = state.userPreferences ?? UserPreferencesService.getDefaults();
    pageHtml = Settings({
      themeId: prefs.themeId,
      motion: prefs.motion
    });
  } else {
    pageHtml = PlaceholderPage({ route: state.route });
  }

  // Sprint 11 P0-T3: overlay toast above the page content. `Toast(null)`
  // returns an empty string so no wrapper is emitted when no toast is set.
  const toastHtml = Toast(state.toast ?? null);
  const pageWithToast = `${toastHtml}${pageHtml}`;
  const shellHtml = AppShell({ route: state.route, pageHtml: pageWithToast });
  mountHtml(APP_ROOT_ID, shellHtml);
  // C-UX-6 / C-UX-6b: install/release focus traps after every render so
  // the trap always matches the current DOM. Passes handlers for dialog
  // Escape wiring (Iter 27). Browser-only; mountHtml is already guarded,
  // so this block is unreachable in test environments.
  /* istanbul ignore next — browser only */
  syncDrawerFocusTraps(state, handlers);
}

/**
 * Render any open Sprint 8 Kaizen dialogs into a string (baseline /
 * remeasurement / close). Empty string when none are open.
 *
 * @param {object} services
 * @param {object} state
 * @returns {string}
 */
function renderKaizenDialogs(services, state) {
  let html = '';
  if (state.baselineDialog) {
    html += BaselineDialog(state.baselineDialog);
  }
  if (state.remeasurementDialog) {
    const bd = services.kaizenService.getBaselineForKaizen(
      state.remeasurementDialog.kaizenId
    );
    const k = services.kaizenService.get(state.remeasurementDialog.kaizenId);
    html += RemeasurementDialog({
      ...state.remeasurementDialog,
      baseline: bd,
      metricDirection: k?.metricDirection ?? 'higher_is_better'
    });
  }
  if (state.closeKaizenDialog) {
    const k = services.kaizenService.get(state.closeKaizenDialog.kaizenId);
    const bd = services.kaizenService.getBaselineForKaizen(
      state.closeKaizenDialog.kaizenId
    );
    const rm = services.kaizenService.getRemeasurementForKaizen(
      state.closeKaizenDialog.kaizenId
    );
    html += KaizenCloseDialog({
      ...state.closeKaizenDialog,
      kaizen: k,
      baseline: bd,
      remeasurement: rm
    });
  }
  return html;
}

/**
 * Compute the ISO date (YYYY-MM-DD) of the Monday of the week containing
 * `nowIso`. Always returns a Monday. Used by the Week page to default the
 * "Plan this week" payload.
 *
 * @param {string} nowIso
 * @returns {string}
 */
export function computeMondayIso(nowIso) {
  const d = new Date(nowIso);
  if (Number.isNaN(d.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }
  // getUTCDay: 0 = Sun, 1 = Mon, ... 6 = Sat. Roll back to Monday.
  const wd = d.getUTCDay();
  const offset = wd === 0 ? 6 : wd - 1; // Sun → 6 days back, Mon → 0, Tue → 1, ...
  const mon = new Date(d.getTime());
  mon.setUTCDate(mon.getUTCDate() - offset);
  const y = mon.getUTCFullYear();
  const m = String(mon.getUTCMonth() + 1).padStart(2, '0');
  const day = String(mon.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Compute days since signup, rounded down.
 *
 * @param {string} createdAtIso
 * @param {string} nowIso
 * @returns {number}
 */
export function computeDaysSinceSignup(createdAtIso, nowIso) {
  const a = new Date(createdAtIso);
  const b = new Date(nowIso);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
  const ms = b.getTime() - a.getTime();
  if (ms < 0) return 0;
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

/**
 * C-UX-10 (Iteration 14) — Compute the prior-day recap for the morning strip.
 *
 * Reads all compositions for `userId` and finds the most recent one on a date
 * strictly before `todayDateIso` (up to 7 calendar days back). Returns counts
 * only when at least one activity is CLOSED or SKIPPED.
 *
 * Returns null when:
 *   - no composition found within the 7-day window, or
 *   - the found composition has zero CLOSED and zero SKIPPED activities.
 *
 * Pure read — no mutations, no events.
 *
 * @param {object} repo     — LocalStorageRepository
 * @param {string} userId
 * @param {string} todayDateIso  — 'YYYY-MM-DD'
 * @returns {{closedCount: number, totalCount: number, skippedCount: number, dateIso: string} | null}
 */
export function computePriorDayRecap(repo, userId, todayDateIso) {
  if (!repo || typeof userId !== 'string' || typeof todayDateIso !== 'string') return null;

  const comps = repo.read('bamx:v1:compositions') ?? {};
  const acts  = repo.read('bamx:v1:activities')   ?? {};

  // Build a date string 7 days before today for the lower bound.
  const todayMs = new Date(todayDateIso + 'T00:00:00Z').getTime();
  if (Number.isNaN(todayMs)) return null;
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  // Collect all compositions for this user on prior days (not today,
  // not before the 7-day window). Use the composition's `startAt` or `date`
  // field to derive the composition date.
  const candidates = [];
  for (const comp of Object.values(comps)) {
    if (!comp || comp.userId !== userId) continue;
    // Derive the composition date from startAt or id pattern.
    let compDateIso = null;
    if (typeof comp.startAt === 'string' && comp.startAt.length >= 10) {
      compDateIso = comp.startAt.slice(0, 10);
    }
    if (!compDateIso) continue;
    if (compDateIso >= todayDateIso) continue; // not a prior day
    const compMs = new Date(compDateIso + 'T00:00:00Z').getTime();
    if (todayMs - compMs > sevenDaysMs) continue; // outside 7-day window
    candidates.push({ comp, compDateIso });
  }

  if (candidates.length === 0) return null;

  // Pick the most recent prior composition (latest compDateIso, then latest proposedAt).
  candidates.sort((a, b) => {
    if (a.compDateIso > b.compDateIso) return -1;
    if (a.compDateIso < b.compDateIso) return 1;
    const at = a.comp.proposedAt ?? '';
    const bt = b.comp.proposedAt ?? '';
    return bt > at ? 1 : bt < at ? -1 : 0;
  });

  const { comp: latest, compDateIso: dateIso } = candidates[0];
  const children = Object.values(acts).filter(
    (a) => a && a.compositionId === latest.id
  );

  const closedCount  = children.filter((a) => a.state === 'CLOSED').length;
  const skippedCount = children.filter((a) => a.state === 'SKIPPED').length;
  const totalCount   = children.length;

  // Only return a recap when there's meaningful data (at least one terminal
  // activity observed, so we know the day actually ran).
  if (closedCount === 0 && skippedCount === 0) return null;

  return { closedCount, totalCount, skippedCount, dateIso };
}

/**
 * C-UX-3 (Iteration 15) — compute the EOD closure recap for the current day.
 *
 * Returns null when the strip should NOT render:
 *   - activities array is empty
 *   - composition state is not PROPOSED, ACCEPTED, or EDITED
 *   - neither trigger condition holds
 *
 * Trigger conditions (either suffices):
 *   1. "All terminal": every non-DROPPED activity is in state CLOSED or SKIPPED.
 *   2. "Time has passed": nowIso >= lastActivityEndIso, where lastActivityEndIso
 *      is the max of (plannedStartAt + plannedDurationMinutes) across all activities.
 *
 * DROPPED activities are excluded from totalCount and skippedCount in the
 * returned object. Only CLOSED + SKIPPED contribute to the "all terminal" check
 * (DROPPED is implicitly excluded from the non-DROPPED set).
 *
 * Date math for lastActivityEndIso uses UTC to match ISO start timestamps
 * stored by the ComposerService.
 *
 * Pure read — no mutations, no events.
 *
 * @param {string | null} compositionState  — e.g. 'PROPOSED' | 'ACCEPTED' | 'EDITED'
 * @param {object[]} activities             — array of ScheduledActivity objects
 * @param {string | null} nowIso            — current ISO timestamp
 * @param {number} pendingReflectionCount   — count of pending reflections (pre-computed by caller)
 * @returns {{closedCount: number, totalCount: number, skippedCount: number, pendingReflectionCount: number} | null}
 */
export function computeEodRecap(compositionState, activities, nowIso, pendingReflectionCount) {
  // Only show strip on compositions that have a plan.
  const ELIGIBLE_STATES = new Set(['PROPOSED', 'ACCEPTED', 'EDITED']);
  if (!compositionState || !ELIGIBLE_STATES.has(compositionState)) return null;
  if (!Array.isArray(activities) || activities.length === 0) return null;

  // Separate DROPPED from non-DROPPED activities.
  const nonDropped = activities.filter((a) => a && a.state !== 'DROPPED');
  if (nonDropped.length === 0) return null;

  // Trigger 1: all non-DROPPED activities are in a terminal state.
  const TERMINAL = new Set(['CLOSED', 'SKIPPED', 'DROPPED']);
  const allTerminal = nonDropped.every((a) => TERMINAL.has(a.state));

  // Trigger 2: wall clock has passed the end of the last activity.
  let timePassed = false;
  if (nowIso && typeof nowIso === 'string') {
    const nowMs = new Date(nowIso).getTime();
    if (Number.isFinite(nowMs)) {
      let maxEndMs = -Infinity;
      for (const a of activities) {
        if (!a || !a.plannedStartAt) continue;
        // plannedStartAt may be an ISO timestamp ('2026-04-27T09:00:00Z')
        // or a bare HH:MM string ('09:00'). For bare HH:MM we treat it as UTC
        // today — this matches how the composer and formatTime behave.
        let startMs;
        const startStr = String(a.plannedStartAt);
        if (/^\d{2}:\d{2}(:\d{2})?$/.test(startStr)) {
          // Bare time — prepend today's date in UTC.
          const todayDate = nowIso.slice(0, 10);
          startMs = new Date(`${todayDate}T${startStr.slice(0, 5)}:00Z`).getTime();
        } else {
          startMs = new Date(startStr).getTime();
        }
        if (!Number.isFinite(startMs)) continue;
        const dur = Number.isFinite(Number(a.plannedDurationMinutes)) ? Number(a.plannedDurationMinutes) : 0;
        const endMs = startMs + dur * 60 * 1000;
        if (endMs > maxEndMs) maxEndMs = endMs;
      }
      if (Number.isFinite(maxEndMs) && nowMs >= maxEndMs) {
        timePassed = true;
      }
    }
  }

  if (!allTerminal && !timePassed) return null;

  // Build counts (DROPPED excluded from totals).
  const closedCount  = nonDropped.filter((a) => a.state === 'CLOSED').length;
  const skippedCount = nonDropped.filter((a) => a.state === 'SKIPPED').length;
  const totalCount   = nonDropped.length;

  return {
    closedCount,
    totalCount,
    skippedCount,
    pendingReflectionCount: Number.isFinite(pendingReflectionCount) ? pendingReflectionCount : 0
  };
}

/**
 * Look up an activity + its catalog entry. Returns {activity, entry} or
 * null if either is missing.
 *
 * @param {object} services
 * @param {string} activityId
 * @returns {{activity: object, entry: object|null} | null}
 */
function lookupActivity(services, activityId) {
  const acts = services.repo.read('bamx:v1:activities') ?? {};
  const activity = acts[activityId];
  if (!activity) return null;
  const list = services.catalogService.list(DEFAULT_USER.id);
  const entry = list.find((c) => c && c.id === activity.catalogEntryId) ?? null;
  return { activity, entry };
}

/**
 * Iter 39 — Apply user preferences to the `<html>` element.
 *
 * Sets `data-theme` to the chosen ThemeId ('system' | 'light' | 'dark').
 * Sets `data-motion` to the chosen MotionPreference ('full' | 'reduced').
 *
 * When themeId === 'system', the CSS handles the OS preference via
 * `@media (prefers-color-scheme: dark)` + `[data-theme="system"]` combo.
 *
 * No-op when `document` is not available (test environment).
 *
 * @param {{ themeId: string, motion: string }} prefs
 */
/* istanbul ignore next — browser only */
export function applyPreferences(prefs) {
  if (typeof document === 'undefined') return;
  if (!prefs || typeof prefs !== 'object') return;
  const html = document.documentElement;
  if (typeof prefs.themeId === 'string') {
    html.setAttribute('data-theme', prefs.themeId);
  }
  if (typeof prefs.motion === 'string') {
    html.setAttribute('data-motion', prefs.motion);
  }
}

/**
 * Build the click handler registry.
 *
 * @param {{services: object, state: object, rerender: () => void}} scope
 */
export function buildHandlers(scope) {
  const { services, state, rerender } = scope;

  function runCompose(overrides) {
    state.composerLoading = true;
    state.lastError = null;
    state.infeasibleExplain = null;
    rerender();
    try {
      const input = buildComposerInput(services.clock, overrides);
      const result = services.composerService.composeDaily(input);
      if (result.state === 'INFEASIBLE') {
        state.infeasibleExplain = result.infeasible?.explain ?? [];
        // Surface infeasibility as a toast alongside the banner — the
        // banner lives under the loading spinner and is easy to miss.
        showToast(
          state,
          ToastKind.ERROR,
          "Today's plan is infeasible. See the suggestions above to adjust.",
          rerender
        );
      }
    } catch (err) {
      state.lastError = err;
      showToast(
        state,
        ToastKind.ERROR,
        `Compose failed: ${err.message ?? err.name ?? 'unknown error'}`,
        rerender
      );
    } finally {
      state.composerLoading = false;
      rerender();
    }
  }

  return {
    AUTO_PLAN(_payload) {
      const cfg = state.composerConfig ?? null;
      const override =
        cfg && typeof cfg.capacityMinutes === 'number' &&
        cfg.capacityMinutes !== DEFAULT_USER.dailyCapacityMinutes
          ? cfg.capacityMinutes
          : undefined;
      runCompose({
        capacityMinutesOverride: override,
        externalMinutesToday: cfg?.externalMinutesToday ?? 0,
        activeKaizenId: cfg?.activeKaizenId ?? undefined
      });
    },

    TOAST_DISMISS(_payload) {
      state.toast = null;
      rerender();
    },

    // Iter 43 Item 7 — Jump to Now (AC15).
    // Scrolls the now-line into viewport center with smooth behavior.
    // Browser-only: guarded by typeof document check so unit tests pass.
    /* istanbul ignore next — browser-only DOM scroll */
    SCROLL_TO_NOW(_payload) {
      if (typeof document === 'undefined') return;
      const nowLine = document.querySelector('.cycle-now-line');
      if (nowLine) {
        nowLine.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    },

    // Iter 39 — Luminous Constraint Phase 1 (AC6, AC14).
    // Live-apply theme change: update state + persist + apply data-attribute.
    PREF_CHANGE_THEME(payload, ctx) {
      // The themeId may come from payload.themeId (unit tests) or from
      // the radio input's data-theme-id attribute via the click-delegate ctx.
      let themeId = payload && typeof payload.themeId === 'string' ? payload.themeId : null;
      if (!themeId && ctx && ctx.element) {
        themeId = ctx.element.dataset?.themeId ?? ctx.element.getAttribute('data-theme-id');
      }
      if (!themeId) return;
      if (!state.userPreferences) state.userPreferences = UserPreferencesService.getDefaults();
      state.userPreferences = { ...state.userPreferences, themeId };
      UserPreferencesService.save(state.userPreferences, services.repo);
      applyPreferences(state.userPreferences);
      rerender();
    },

    // Live-apply motion change: update state + persist + apply data-attribute.
    PREF_CHANGE_MOTION(payload, ctx) {
      let motion = payload && typeof payload.motion === 'string' ? payload.motion : null;
      if (!motion && ctx && ctx.element) {
        motion = ctx.element.dataset?.motion ?? ctx.element.getAttribute('data-motion');
      }
      if (!motion) return;
      if (!state.userPreferences) state.userPreferences = UserPreferencesService.getDefaults();
      state.userPreferences = { ...state.userPreferences, motion };
      UserPreferencesService.save(state.userPreferences, services.repo);
      applyPreferences(state.userPreferences);
      rerender();
    },

    ACCEPT(payload) {
      if (!payload || !payload.compositionId) return;
      try {
        services.composerService.accept(payload.compositionId);
        showToast(state, ToastKind.SUCCESS, "Today's plan accepted.", rerender);
      } catch (err) {
        state.lastError = err;
        showToast(
          state,
          ToastKind.ERROR,
          `Accept failed: ${err.message ?? err.name ?? 'unknown error'}`,
          rerender
        );
      }
      rerender();
    },

    EDIT(payload) {
      // Sprint 12 — enter edit mode. Snapshot the current composition's
      // activities so Cancel can restore them verbatim.
      if (!payload || !payload.compositionId) return;
      const active = services.composerService.getComposition(payload.compositionId);
      if (!active) return;
      const snapshot = active.activities.map((a) => ({ ...a }));
      state.editMode = {
        compositionId: payload.compositionId,
        snapshotActivities: snapshot,
        activities: snapshot.map((a) => ({ ...a })),
        selectedActivityId: null,
        undoStack: [],
        searchQuery: '',
        projectTypeFilter: 'all',
        expandedBuckets: ['PROJECT']
      };
      // Iteration 21 (C-AN-1): emit EditDrawerOpened once per edit-mode open.
      // Timestamp via services.clock.now() for determinism in tests.
      services.bus.publish(EditDrawerOpened, {
        userId: DEFAULT_USER.id,
        compositionId: payload.compositionId,
        openedAt: services.clock.now()
      });
      rerender();
    },

    EDIT_EXIT(_payload) {
      state.editMode = null;
      rerender();
    },

    EDIT_SELECT_SLOT(payload) {
      if (!state.editMode) return;
      if (!payload || typeof payload.activityId !== 'string') return;
      // Protected slots cannot be selected for swap.
      const target = state.editMode.activities.find((a) => a.id === payload.activityId);
      if (!target) return;
      if (isProtectedBlock(target)) {
        showToast(
          state,
          ToastKind.INFO,
          "This block can't be changed — it's required for your daily rhythm.",
          rerender
        );
        return;
      }
      state.editMode.selectedActivityId = payload.activityId;
      rerender();
    },

    // Iter 25: EDIT_QUICK_UPDATE — shortcut from the per-row Update button.
    // Enters edit mode (if not already open) for the composition that owns the
    // activity, then selects that activity so duration chips immediately appear.
    // If already in edit mode, just selects the slot (no-op on protected blocks).
    EDIT_QUICK_UPDATE(payload) {
      if (!payload || typeof payload.activityId !== 'string') return;
      const activityId = payload.activityId;

      // If not in edit mode, find the owning composition and enter edit mode.
      if (!state.editMode) {
        const activeState = services.composerService.getActiveComposition(DEFAULT_USER.id);
        if (!activeState) return;
        const compositionId = activeState.composition.id;
        const active = services.composerService.getComposition(compositionId);
        if (!active) return;
        const snapshot = active.activities.map((a) => ({ ...a }));
        state.editMode = {
          compositionId,
          snapshotActivities: snapshot,
          activities: snapshot.map((a) => ({ ...a })),
          selectedActivityId: null,
          undoStack: [],
          searchQuery: '',
          projectTypeFilter: 'all',
          expandedBuckets: ['PROJECT']
        };
        services.bus.publish(EditDrawerOpened, {
          userId: DEFAULT_USER.id,
          compositionId,
          openedAt: services.clock.now()
        });
      }

      // Now select the target slot (protected slots are rejected by EDIT_SELECT_SLOT logic).
      const target = state.editMode.activities.find((a) => a.id === activityId);
      if (!target) { rerender(); return; }
      if (isProtectedBlock(target)) {
        showToast(
          state,
          ToastKind.INFO,
          "This block can't be changed — it's required for your daily rhythm.",
          rerender
        );
        rerender();
        return;
      }
      state.editMode.selectedActivityId = activityId;
      rerender();
    },

    // ---- Iter 30: Block detail popover ------------------------------------

    OPEN_BLOCK_DETAIL(payload) {
      if (!payload || typeof payload.activityId !== 'string') return;
      state.blockDetail = { activityId: payload.activityId };
      rerender();
    },

    CLOSE_BLOCK_DETAIL(_payload) {
      state.blockDetail = null;
      rerender();
    },

    // ---- Iter 47 Phase 2: Lunch inline tooltip (AC13, AC14) ----------------
    // Lunch blocks emit OPEN_LUNCH_TOOLTIP instead of OPEN_BLOCK_DETAIL.
    // The tooltip shows time + auto-protected note; no full dialog.

    OPEN_LUNCH_TOOLTIP(payload) {
      if (!payload) return;
      const timeRange = typeof payload.timeRange === 'string' ? payload.timeRange : 'Lunch';
      state.lunchTooltip = { timeRange };
      rerender();
    },

    CLOSE_LUNCH_TOOLTIP(_payload) {
      state.lunchTooltip = null;
      rerender();
    },

    // ---- Iter 36: Catalog picker dialog (click-empty-time insertion) --------

    // CLICK_EMPTY_TIME — fired by the transparent overlay in TodayGrid when
    // the user clicks on an empty time slot. Computes the clicked minute from
    // the click event's clientY + the timeline element's bounding rect,
    // snaps to 15-min increments, and opens the CatalogPickerDialog.
    CLICK_EMPTY_TIME(_payload, ctx) {
      // Ensure no block was clicked (block clicks absorb via OPEN_BLOCK_DETAIL
      // before bubbling to the overlay — AC11 satisfied by event delegation order).
      // Guard: must have a live event to read clientY from.
      if (!ctx || !ctx.event) return;

      // Find the timeline element to get its bounding rect.
      /* istanbul ignore next — browser only */
      const timelineEl = typeof document !== 'undefined'
        ? document.querySelector('.cycle-timeline')
        : null;
      if (!timelineEl || typeof timelineEl.getBoundingClientRect !== 'function') return;

      const rect = timelineEl.getBoundingClientRect();
      const relativeY = ctx.event.clientY - rect.top;

      // Read grid constants from the overlay element's data attributes
      // (rendered by TodayGrid so the handler never needs to import them).
      const overlayEl = typeof document !== 'undefined'
        ? document.querySelector('.cycle-empty-overlay')
        : null;
      const gridStartHour = overlayEl
        ? Number(overlayEl.getAttribute('data-grid-start-hour') ?? 7)
        : 7;
      const rowHeightPx = overlayEl
        ? Number(overlayEl.getAttribute('data-row-height-px') ?? 60)
        : 60;
      const snapMinutes = overlayEl
        ? Number(overlayEl.getAttribute('data-snap-minutes') ?? 15)
        : 15;

      // Convert Y position to minutes of day.
      const rawMinutes = gridStartHour * 60 + (relativeY / rowHeightPx) * 60;
      const snappedMinutes = Math.round(rawMinutes / snapMinutes) * snapMinutes;
      const clampedMinutes = Math.max(gridStartHour * 60, Math.min(19 * 60, snappedMinutes));

      state.catalogPickerDialog = {
        startMinutes: clampedMinutes,
        search: '',
        bucketFilter: 'ALL'
      };
      rerender();
    },

    CLOSE_CATALOG_PICKER(_payload) {
      state.catalogPickerDialog = null;
      rerender();
    },

    // CPD_SEARCH — fired by the search input's input event (not click).
    // Value is read from ctx.element.value in the input listener wired in start().
    CPD_SEARCH(_payload, ctx) {
      if (!state.catalogPickerDialog) return;
      const value = ctx?.element?.value ?? '';
      state.catalogPickerDialog = {
        ...state.catalogPickerDialog,
        search: value
      };
      rerender();
    },

    CPD_BUCKET_FILTER(payload) {
      if (!state.catalogPickerDialog) return;
      if (!payload || typeof payload.bucket !== 'string') return;
      state.catalogPickerDialog = {
        ...state.catalogPickerDialog,
        bucketFilter: payload.bucket
      };
      rerender();
    },

    // INSERT_ACTIVITY_AT_TIME — user selected a catalog entry from the picker.
    // Constructs a new ScheduledActivity from the entry + clicked start time,
    // pushes to the composition (via edit-mode infrastructure), then closes
    // the picker.
    //
    // Composition state transitions (AC9):
    //   PROPOSED → composition stays PROPOSED (insertion is part of the draft)
    //   ACCEPTED / EDITED → composition transitions to EDITED
    //
    // Overlap detection (AC10): reuses detectOverlap from dragController.js.
    INSERT_ACTIVITY_AT_TIME(payload) {
      if (!payload || typeof payload.catalogEntryId !== 'string') return;
      if (!Number.isFinite(payload.startMinutes)) return;

      const catalog = services.catalogService.list(DEFAULT_USER.id) ?? [];
      const entry = catalog.find((e) => e && e.id === payload.catalogEntryId);
      if (!entry) {
        showToast(state, ToastKind.ERROR, 'Catalog entry not found.', rerender);
        return;
      }

      // Ensure edit mode is open — auto-enter if needed (mirrors _ensureEditMode).
      const opened = this._ensureEditMode();
      if (!opened) {
        showToast(state, ToastKind.ERROR, 'No active plan to insert into.', rerender);
        return;
      }

      // Convert startMinutes to HH:MM.
      const h = Math.floor(payload.startMinutes / 60);
      const m = payload.startMinutes % 60;
      const startHHMM = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

      const now = services.clock.now();
      const idGen = (p) => services.idGenerator.generate(p);

      // Snapshot for undo.
      state.editMode.undoStack = pushUndo(
        state.editMode.undoStack,
        state.editMode.activities.map((a) => ({ ...a }))
      );

      // Build a new ScheduledActivity from the catalog entry + clicked start.
      // Reuses activityFromCatalogEntry so ID prefix and shape are consistent.
      const newActivity = {
        id: idGen('sa_insert'),
        catalogEntryId: entry.id,
        name: entry.name ?? entry.id,
        bucket: entry.bucket,
        plannedDurationMinutes: entry.defaultDurationMinutes ?? 30,
        plannedStartAt: startHHMM,
        state: 'PROPOSED',
        sourceOfSchedule: 'USER_INSERT',
        userEdited: true,
        updatedAt: now
      };

      state.editMode.activities = [...state.editMode.activities, newActivity];

      // Overlap detection (AC10): reuse detectOverlap from dragController.js.
      const overlap = detectOverlap(
        state.editMode.activities,
        newActivity.id,
        payload.startMinutes,
        newActivity.plannedDurationMinutes
      );
      if (overlap) {
        state.conflictBanner = {
          activityId:       newActivity.id,
          activityName:     newActivity.name,
          againstName:      overlap.againstName,
          againstStartHHMM: overlap.againstStartHHMM,
          originalStart:    startHHMM,
          originalDuration: newActivity.plannedDurationMinutes,
          mode:             'insert'
        };
      }

      // Close the picker.
      state.catalogPickerDialog = null;
      showToast(state, ToastKind.SUCCESS, `Added ${entry.name} at ${startHHMM}.`, rerender);
      rerender();
    },

    // ---- End Iter 36 ----------------------------------------------------------

    // Closes the popover, enters edit mode for the owning composition, and
    // selects the activity — reuses the EDIT_QUICK_UPDATE pattern.
    BLOCK_DETAIL_EDIT(payload) {
      if (!payload || typeof payload.activityId !== 'string') return;
      const activityId = payload.activityId;

      // Close the popover first.
      state.blockDetail = null;

      // Enter edit mode (or stay in it) using the same logic as EDIT_QUICK_UPDATE.
      if (!state.editMode) {
        const activeState = services.composerService.getActiveComposition(DEFAULT_USER.id);
        if (!activeState) { rerender(); return; }
        const compositionId = activeState.composition.id;
        const active = services.composerService.getComposition(compositionId);
        if (!active) { rerender(); return; }
        const snapshot = active.activities.map((a) => ({ ...a }));
        state.editMode = {
          compositionId,
          snapshotActivities: snapshot,
          activities: snapshot.map((a) => ({ ...a })),
          selectedActivityId: null,
          undoStack: [],
          searchQuery: '',
          projectTypeFilter: 'all',
          expandedBuckets: ['PROJECT']
        };
        services.bus.publish(EditDrawerOpened, {
          userId: DEFAULT_USER.id,
          compositionId,
          openedAt: services.clock.now()
        });
      }

      // Select the slot (protected slots are silently rejected per EDIT_SELECT_SLOT logic).
      const target = state.editMode.activities.find((a) => a.id === activityId);
      if (!target) { rerender(); return; }
      if (isProtectedBlock(target)) {
        showToast(
          state,
          ToastKind.INFO,
          "This block can't be changed — it's required for your daily rhythm.",
          rerender
        );
        rerender();
        return;
      }
      state.editMode.selectedActivityId = activityId;
      rerender();
    },

    EDIT_ADD_SLOT(_payload) {
      if (!state.editMode) return;
      state.editMode.selectedActivityId = '__new__';
      rerender();
    },

    EDIT_SWAP(payload) {
      if (!state.editMode) return;
      if (!payload || typeof payload.catalogEntryId !== 'string') return;
      const catalog = services.catalogService.list(DEFAULT_USER.id) ?? [];
      const entry = catalog.find((e) => e && e.id === payload.catalogEntryId);
      if (!entry) {
        showToast(state, ToastKind.ERROR, 'Catalog entry not found.', rerender);
        return;
      }
      const { selectedActivityId } = state.editMode;
      const now = services.clock.now();
      if (selectedActivityId === '__new__') {
        // Add-new flow — append a fresh slot.
        state.editMode.undoStack = pushUndo(
          state.editMode.undoStack,
          state.editMode.activities.map((a) => ({ ...a }))
        );
        state.editMode.activities = applyAdd(state.editMode.activities, entry, now, (p) => services.idGenerator.generate(p));
        state.editMode.selectedActivityId = null;
        showToast(state, ToastKind.SUCCESS, `Added ${entry.name}.`, rerender);
        rerender();
        return;
      }
      if (!selectedActivityId) {
        showToast(
          state,
          ToastKind.INFO,
          'Pick a slot in the schedule first, then tap a card to swap.',
          rerender
        );
        return;
      }
      const target = state.editMode.activities.find((a) => a.id === selectedActivityId);
      if (!target) return;
      if (isProtectedBlock(target)) {
        showToast(
          state,
          ToastKind.ERROR,
          "This block can't be changed — it's required for your daily rhythm.",
          rerender
        );
        return;
      }
      state.editMode.undoStack = pushUndo(
        state.editMode.undoStack,
        state.editMode.activities.map((a) => ({ ...a }))
      );
      const oldName = target.name;
      state.editMode.activities = applySwap(
        state.editMode.activities,
        selectedActivityId,
        entry,
        now,
        (p) => services.idGenerator.generate(p)
      );
      state.editMode.selectedActivityId = null;
      showToast(
        state,
        ToastKind.SUCCESS,
        `Swapped ${oldName} → ${entry.name}.`,
        rerender
      );
      rerender();
    },

    EDIT_REMOVE_SLOT(payload) {
      if (!state.editMode) return;
      if (!payload || typeof payload.activityId !== 'string') return;
      const target = state.editMode.activities.find((a) => a.id === payload.activityId);
      if (!target) return;
      if (isProtectedBlock(target)) {
        showToast(
          state,
          ToastKind.ERROR,
          "This block can't be removed — it's required for your daily rhythm.",
          rerender
        );
        return;
      }
      state.editMode.undoStack = pushUndo(
        state.editMode.undoStack,
        state.editMode.activities.map((a) => ({ ...a }))
      );
      state.editMode.activities = applyRemove(state.editMode.activities, payload.activityId);
      if (state.editMode.selectedActivityId === payload.activityId) {
        state.editMode.selectedActivityId = null;
      }
      showToast(state, ToastKind.SUCCESS, `Removed ${target.name}.`, rerender);
      rerender();
    },

    EDIT_UNDO(_payload) {
      if (!state.editMode) return;
      const { stack, snapshot } = popUndo(state.editMode.undoStack);
      if (!snapshot) {
        showToast(state, ToastKind.INFO, 'Nothing to undo.', rerender);
        return;
      }
      state.editMode.undoStack = stack;
      state.editMode.activities = snapshot;
      state.editMode.selectedActivityId = null;
      showToast(state, ToastKind.INFO, 'Undid last change.', rerender);
      rerender();
    },

    // Sprint 13 — change the selected slot's duration via the chip row.
    // Cascades subsequent butting-up slots via applyDurationChange; pushes
    // a snapshot onto the undo stack so Ctrl+Z reverts.
    EDIT_CHANGE_DURATION(payload) {
      if (!state.editMode) return;
      if (!payload || typeof payload.activityId !== 'string') return;
      const minutes = Number(payload.minutes);
      if (!DURATION_OPTIONS.includes(minutes)) return; // silent no-op
      const target = state.editMode.activities.find((a) => a && a.id === payload.activityId);
      if (!target) return;
      if (isProtectedBlock(target)) {
        showToast(
          state,
          ToastKind.ERROR,
          "This block's duration is fixed.",
          rerender
        );
        return;
      }
      const oldDuration = Number(target.plannedDurationMinutes ?? 0);
      if (oldDuration === minutes) return; // nothing to do
      state.editMode.undoStack = pushUndo(
        state.editMode.undoStack,
        state.editMode.activities.map((a) => ({ ...a }))
      );
      try {
        state.editMode.activities = applyDurationChange(
          state.editMode.activities,
          payload.activityId,
          minutes
        );
      } catch (err) {
        // Roll back the undo push so the stack stays accurate.
        state.editMode.undoStack = state.editMode.undoStack.slice(0, -1);
        state.lastError = err;
        showToast(
          state,
          ToastKind.ERROR,
          `Duration change failed: ${err.message ?? err.name ?? 'unknown error'}`,
          rerender
        );
        return;
      }
      showToast(
        state,
        ToastKind.SUCCESS,
        `Duration: ${oldDuration}m → ${minutes}m`,
        rerender
      );
      rerender();
    },

    // Sprint 14 — change the selected slot's start time via the native
    // <input type="time"> editor on the sa-when column. Cascades
    // subsequent butting-up slots via applyStartTimeChange; pushes a
    // snapshot onto the undo stack so Ctrl+Z reverts. The new HH:MM value
    // may arrive either directly in payload.value (e.g. unit tests) or via
    // ctx.element.value when the `change` event delegate fires.
    EDIT_CHANGE_START_TIME(payload, ctx) {
      if (!state.editMode) return;
      if (!payload || typeof payload.activityId !== 'string') return;
      let newHHMM = typeof payload.value === 'string' ? payload.value : null;
      if (newHHMM == null && ctx?.element && typeof ctx.element.value === 'string') {
        newHHMM = ctx.element.value;
      }
      if (typeof newHHMM !== 'string' || newHHMM.length === 0) {
        showToast(
          state,
          ToastKind.ERROR,
          'Pick a valid start time (HH:MM).',
          rerender
        );
        return;
      }
      const target = state.editMode.activities.find(
        (a) => a && a.id === payload.activityId
      );
      if (!target) return;
      if (isProtectedBlock(target)) {
        showToast(
          state,
          ToastKind.ERROR,
          "This block's start time is fixed.",
          rerender
        );
        return;
      }
      // Format the old HH:MM for the toast from whatever shape is stored.
      const oldRaw = String(target.plannedStartAt ?? '');
      let oldHHMM = '';
      if (/^\d{2}:\d{2}$/.test(oldRaw)) oldHHMM = oldRaw;
      else if (/^\d{2}:\d{2}:\d{2}$/.test(oldRaw)) oldHHMM = oldRaw.slice(0, 5);
      else {
        const d = new Date(oldRaw);
        if (!Number.isNaN(d.getTime())) {
          oldHHMM =
            String(d.getUTCHours()).padStart(2, '0') +
            ':' +
            String(d.getUTCMinutes()).padStart(2, '0');
        }
      }
      if (oldHHMM === newHHMM) return; // nothing to do
      state.editMode.undoStack = pushUndo(
        state.editMode.undoStack,
        state.editMode.activities.map((a) => ({ ...a }))
      );
      let nextActivities;
      try {
        nextActivities = applyStartTimeChange(
          state.editMode.activities,
          payload.activityId,
          newHHMM
        );
      } catch (err) {
        // Roll back the undo push so the stack stays accurate.
        state.editMode.undoStack = state.editMode.undoStack.slice(0, -1);
        state.lastError = err;
        if (err && err.name === 'OVERLAPS_PRIOR') {
          const priorEnd = err.priorEndHHMM ?? '';
          showToast(
            state,
            ToastKind.ERROR,
            `Would overlap prior block (ends ${priorEnd}). Pick a later time.`,
            rerender
          );
        } else if (err && err.name === 'INVALID_TIME') {
          showToast(
            state,
            ToastKind.ERROR,
            'Pick a valid start time (HH:MM).',
            rerender
          );
        } else if (err && err.name === 'PROTECTED_BLOCK') {
          showToast(
            state,
            ToastKind.ERROR,
            "This block's start time is fixed.",
            rerender
          );
        } else {
          showToast(
            state,
            ToastKind.ERROR,
            `Start-time change failed: ${err?.message ?? err?.name ?? 'unknown error'}`,
            rerender
          );
        }
        // Rerender so the bound <input type="time"> snaps back to the
        // previous plannedStartAt (the input's value attribute is the
        // source of truth for the rendered HTML).
        rerender();
        return;
      }
      state.editMode.activities = nextActivities;
      showToast(
        state,
        ToastKind.SUCCESS,
        `Start time: ${oldHHMM} → ${newHHMM}`,
        rerender
      );
      rerender();
    },

    EDIT_BUCKET_TOGGLE(payload) {
      if (!state.editMode) return;
      if (!payload || typeof payload.bucket !== 'string') return;
      const list = state.editMode.expandedBuckets ?? [];
      if (list.includes(payload.bucket)) {
        state.editMode.expandedBuckets = list.filter((b) => b !== payload.bucket);
      } else {
        state.editMode.expandedBuckets = [...list, payload.bucket];
      }
      rerender();
    },

    EDIT_SEARCH(payload, ctx) {
      if (!state.editMode) return;
      let value = payload?.value;
      if (typeof value !== 'string' && ctx?.element && typeof ctx.element.value === 'string') {
        value = ctx.element.value;
      }
      state.editMode.searchQuery = typeof value === 'string' ? value : '';
      rerender();
    },

    EDIT_PROJECT_TYPE_FILTER(payload, ctx) {
      if (!state.editMode) return;
      let value = payload?.projectType ?? payload?.value;
      if (typeof value !== 'string' && ctx?.element && typeof ctx.element.value === 'string') {
        value = ctx.element.value;
      }
      if (typeof value !== 'string') return;
      state.editMode.projectTypeFilter = value;
      rerender();
    },

    EDIT_COMMIT(_payload) {
      if (!state.editMode) return;
      const { compositionId, activities } = state.editMode;
      try {
        services.composerService.commitEdit(compositionId, activities, {
          userId: DEFAULT_USER.id
        });
        state.editMode = null;
        showToast(state, ToastKind.SUCCESS, 'Edits saved.', rerender);
      } catch (err) {
        state.lastError = err;
        showToast(
          state,
          ToastKind.ERROR,
          `Commit failed: ${err.message ?? err.name ?? 'unknown error'}`,
          rerender
        );
      }
      rerender();
    },

    EDIT_CANCEL(_payload) {
      if (!state.editMode) return;
      state.editMode = null;
      showToast(state, ToastKind.INFO, 'Edit cancelled.', rerender);
      rerender();
    },

    // ---- Iter 35 Phase 2: Drag-and-drop handlers --------------------------
    //
    // DRAG_START_PROPOSED: called by installDragController via onDragPending
    //   when composition.state === 'PROPOSED'. Stores pending changes in
    //   state.dragSession; a confirm banner renders above the grid.
    //
    // DRAG_COMMIT: called by installDragController via onDragCommit when
    //   composition.state ∈ {ACCEPTED, EDITED}. Immediately dispatches
    //   EDIT_CHANGE_START_TIME / EDIT_CHANGE_DURATION.
    //
    // DRAG_CONFIRM: user clicked Confirm in the PROPOSED pending-confirm
    //   banner. Dispatches the stored pending changes.
    //
    // DRAG_CANCEL: user clicked Cancel in the PROPOSED pending-confirm
    //   banner. Clears state.dragSession; no mutation.
    //
    // CONFLICT_REVERT: user clicked Revert in the conflict banner.
    //   Re-fires EDIT_CHANGE_* with original values.
    //
    // CONFLICT_KEEP: user clicked "Keep (manual fix)". Dismisses banner.
    //
    // UNDO_DRAG_COMMIT: undo the most recent drag commit (triggered by
    //   30-second undo toast). Pops the undo stack.

    // Internal helper: ensure edit mode is open for the active composition.
    // Mirrors EDIT_QUICK_UPDATE logic to avoid code duplication.
    _ensureEditMode() {
      if (state.editMode) return true;
      const activeState = services.composerService.getActiveComposition(DEFAULT_USER.id);
      if (!activeState) return false;
      const compositionId = activeState.composition.id;
      const active = services.composerService.getComposition(compositionId);
      if (!active) return false;
      const snapshot = active.activities.map((a) => ({ ...a }));
      state.editMode = {
        compositionId,
        snapshotActivities: snapshot,
        activities: snapshot.map((a) => ({ ...a })),
        selectedActivityId: null,
        undoStack: [],
        searchQuery: '',
        projectTypeFilter: 'all',
        expandedBuckets: ['PROJECT']
      };
      services.bus.publish(EditDrawerOpened, {
        userId: DEFAULT_USER.id,
        compositionId,
        openedAt: services.clock.now()
      });
      return true;
    },

    // Called by drag controller when composition.state === 'PROPOSED'.
    // Stores pending drag in state.dragSession; banner renders above grid.
    DRAG_START_PROPOSED(payload) {
      if (!payload || typeof payload.activityId !== 'string') return;
      // Find the activity for name lookup.
      const activeState = services.composerService.getActiveComposition(DEFAULT_USER.id);
      const activityName = activeState
        ? (activeState.activities.find((a) => a && a.id === payload.activityId)?.name ?? payload.activityId)
        : payload.activityId;
      state.dragSession = {
        activityId:       payload.activityId,
        activityName,
        newStart:         payload.newStart,
        newDuration:      payload.newDuration,
        originalStart:    payload.originalStart,
        originalDuration: payload.originalDuration,
        mode:             payload.mode,
        // proposedStart/Duration for ghost block (minutes of day).
        proposedStart:    payload.proposedStartMin ?? null,
        proposedDuration: payload.newDuration
      };
      rerender();
    },

    // Called by drag controller when composition.state ∈ {ACCEPTED, EDITED}.
    // Commits immediately via existing EDIT_CHANGE_* actions.
    DRAG_COMMIT(payload) {
      if (!payload || typeof payload.activityId !== 'string') return;

      // Ensure edit mode is open (auto-enter if needed).
      const opened = this._ensureEditMode();
      if (!opened) return;

      // Snapshot the original values BEFORE applying changes (for conflict revert).
      const originalActivity = state.editMode.activities.find((a) => a && a.id === payload.activityId);
      const originalStart    = originalActivity
        ? String(originalActivity.plannedStartAt ?? '')
        : (payload.originalStart ?? '');
      const originalDuration = originalActivity
        ? Number(originalActivity.plannedDurationMinutes ?? 0)
        : (payload.originalDuration ?? 0);

      if (payload.mode === 'move' || payload.mode === 'resize') {
        // For resize: duration changes. For move: start time changes.
        if (payload.mode === 'resize') {
          this.EDIT_CHANGE_DURATION({
            activityId: payload.activityId,
            minutes: payload.newDuration
          });
        } else {
          this.EDIT_CHANGE_START_TIME({
            activityId: payload.activityId,
            value: payload.newStart
          });
        }
      }

      // Check for overlap after the commit.
      const updatedActivities = state.editMode ? state.editMode.activities : [];
      const updatedActivity   = updatedActivities.find((a) => a && a.id === payload.activityId);
      if (updatedActivity) {
        const updatedStartMin  = _parseMinutes(updatedActivity.plannedStartAt ?? '');
        const updatedDurationN = Number(updatedActivity.plannedDurationMinutes ?? 0);
        const overlap = updatedStartMin !== null
          ? detectOverlap(updatedActivities, payload.activityId, updatedStartMin, updatedDurationN)
          : null;
        if (overlap) {
          state.conflictBanner = {
            activityId:       payload.activityId,
            activityName:     updatedActivity.name ?? payload.activityId,
            againstName:      overlap.againstName,
            againstStartHHMM: overlap.againstStartHHMM,
            originalStart,
            originalDuration,
            mode:             payload.mode
          };
          rerender();
          return;
        }
      }

      // Show undo toast (30-second window per spec).
      const actName = updatedActivity?.name ?? payload.activityId;
      const toastMsg = payload.mode === 'move'
        ? `Moved ${actName} to ${payload.newStart}. Undo?`
        : `Resized ${actName} to ${payload.newDuration}min. Undo?`;
      // NOTE: using standard TOAST_TTL_MS (3s) for now; 30s undo toast
      // would require a UndoToast component with a dedicated action.
      // The undo stack in editMode already supports EDIT_UNDO (Ctrl+Z).
      showToast(state, ToastKind.SUCCESS, toastMsg, rerender);
      rerender();
    },

    // Confirm drag in PROPOSED state — commits the pending dragSession changes.
    DRAG_CONFIRM(payload) {
      if (!state.dragSession) return;
      const session = state.dragSession;
      state.dragSession = null;

      // Ensure edit mode is open.
      const opened = this._ensureEditMode();
      if (!opened) return;

      if (session.mode === 'resize') {
        this.EDIT_CHANGE_DURATION({
          activityId: session.activityId,
          minutes: session.newDuration
        });
      } else {
        this.EDIT_CHANGE_START_TIME({
          activityId: session.activityId,
          value: session.newStart
        });
      }

      // Check for overlap after confirm.
      const updatedActivities = state.editMode ? state.editMode.activities : [];
      const updatedAct   = updatedActivities.find((a) => a && a.id === session.activityId);
      const updatedSMin  = updatedAct ? _parseMinutes(updatedAct.plannedStartAt ?? '') : null;
      const updatedDurN  = updatedAct ? Number(updatedAct.plannedDurationMinutes ?? 0) : 0;
      const overlap = updatedSMin !== null
        ? detectOverlap(updatedActivities, session.activityId, updatedSMin, updatedDurN)
        : null;
      if (overlap) {
        state.conflictBanner = {
          activityId:       session.activityId,
          activityName:     updatedAct?.name ?? session.activityId,
          againstName:      overlap.againstName,
          againstStartHHMM: overlap.againstStartHHMM,
          originalStart:    session.originalStart,
          originalDuration: session.originalDuration,
          mode:             session.mode
        };
      }
      rerender();
    },

    // Cancel drag in PROPOSED state — clears dragSession without mutation.
    DRAG_CANCEL(_payload) {
      state.dragSession = null;
      rerender();
    },

    // Revert a drag commit — re-applies original values via EDIT_CHANGE_*.
    CONFLICT_REVERT(payload) {
      if (!payload || typeof payload.activityId !== 'string') return;
      state.conflictBanner = null;

      if (!state.editMode) return;

      if (payload.mode === 'resize') {
        this.EDIT_CHANGE_DURATION({
          activityId: payload.activityId,
          minutes: Number(payload.originalDuration)
        });
      } else {
        this.EDIT_CHANGE_START_TIME({
          activityId: payload.activityId,
          value: String(payload.originalStart ?? '')
        });
      }
      showToast(state, ToastKind.INFO, 'Drag reverted.', rerender);
      rerender();
    },

    // Dismiss the conflict banner — user will fix manually.
    CONFLICT_KEEP(_payload) {
      state.conflictBanner = null;
      rerender();
    },

    // Undo the most recent drag commit via the edit-mode undo stack.
    UNDO_DRAG_COMMIT(_payload) {
      this.EDIT_UNDO({});
    },

    // ---- End Iter 35 drag handlers ----------------------------------------

    REJECT(payload) {
      if (!payload || !payload.compositionId) return;
      const confirmFn = globalThis.confirm ?? (() => true);
      const ok = confirmFn(
        "Reject today's plan? You'll need to build manually or wait for tomorrow."
      );
      if (!ok) return;
      try {
        services.composerService.reject(payload.compositionId);
      } catch (err) {
        state.lastError = err;
      }
      rerender();
    },

    // ---- Sprint 5: ScheduledActivity runtime -------------------------------

    START_ACTIVITY(payload) {
      if (!payload || !payload.activityId) return;
      try {
        services.activityService.start(payload.activityId);
      } catch (err) {
        state.lastError = err;
      }
      rerender();
    },

    OPEN_CLOSE_DIALOG(payload) {
      if (!payload || !payload.activityId) return;
      const looked = lookupActivity(services, payload.activityId);
      if (!looked) return;
      const schema = looked.entry?.outputArtifact?.schema ?? 'TEXT';
      state.openDialog = {
        kind: 'CLOSE',
        activityId: payload.activityId,
        schema,
        artifactDef: looked.entry?.outputArtifact ?? { schema, name: 'Output' }
      };
      rerender();
    },

    // C-UX-COL (Q2): clicking .sa-artifact opens OutputArtifactDialog early
    // (before the activity is closed) and emits RowOutputClicked for analytics.
    // Reuses the existing OPEN_CLOSE_DIALOG flow — same dialog, same schema
    // resolution. The user can review the artifact definition, then dismiss
    // without submitting (CLOSE_CLOSE_DIALOG handles the dismissal).
    OPEN_OUTPUT_ARTIFACT(payload) {
      if (!payload || !payload.activityId) return;
      const looked = lookupActivity(services, payload.activityId);
      if (!looked) return;
      const schema = looked.entry?.outputArtifact?.schema ?? 'TEXT';
      state.openDialog = {
        kind: 'CLOSE',
        activityId: payload.activityId,
        schema,
        artifactDef: looked.entry?.outputArtifact ?? { schema, name: 'Output' }
      };
      // Emit RowOutputClicked analytics event.
      services.bus.publish(RowOutputClicked, {
        userId: DEFAULT_USER.id,
        activityId: payload.activityId,
        catalogEntryId: looked.activity?.catalogEntryId ?? null,
        clickedAt: services.clock.now()
      });
      rerender();
    },

    CLOSE_CLOSE_DIALOG(_payload) {
      state.openDialog = null;
      rerender();
    },

    SUBMIT_CLOSE_DIALOG(payload, ctx) {
      // Payload from form submit is the {activityId, schema} we stamped
      // on data-payload. The actual form field values are pulled off the
      // form element (if provided) via ctx.element.
      if (!payload || !payload.activityId) return;
      const schema = payload.schema ?? state.openDialog?.schema ?? 'TEXT';
      const fields = extractFormFields(ctx?.element);
      const ref = parseArtifactFields(schema, fields);
      try {
        services.activityService.close(payload.activityId, { outputArtifactRef: ref });
        state.openDialog = null;
        showToast(state, ToastKind.SUCCESS, 'Activity closed.', rerender);
      } catch (err) {
        state.lastError = err;
        showToast(
          state,
          ToastKind.ERROR,
          `Could not close activity: ${err.message ?? err.name ?? 'unknown error'}`,
          rerender
        );
      }
      rerender();
    },

    OPEN_SKIP_MODAL(payload) {
      if (!payload || !payload.activityId) return;
      const looked = lookupActivity(services, payload.activityId);
      state.openDialog = {
        kind: 'SKIP',
        activityId: payload.activityId,
        activityName: looked?.entry?.name ?? looked?.activity?.name ?? payload.activityId
      };
      rerender();
    },

    CLOSE_SKIP_MODAL(_payload) {
      state.openDialog = null;
      rerender();
    },

    SUBMIT_SKIP_MODAL(payload, ctx) {
      if (!payload || !payload.activityId) return;
      const fields = extractFormFields(ctx?.element);
      const reasonCode = fields.reasonCode ?? null;
      const note = fields.note ?? null;
      try {
        services.activityService.skip(payload.activityId, { reasonCode, note });
        // Iter 38 (SW-Q10 CI sacredness): emit CISkipConfirmed when user
        // confirms skip on a CI activity. Telemetry-only — no consumer yet.
        if (payload.isCIActivity === true) {
          services.bus.publish(CISkipConfirmed, {
            userId: DEFAULT_USER.id,
            activityId: payload.activityId,
            reasonCode,
            confirmedAt: services.clock.now()
          });
        }
        state.openDialog = null;
        showToast(state, ToastKind.SUCCESS, 'Activity skipped.', rerender);
      } catch (err) {
        state.lastError = err;
        showToast(
          state,
          ToastKind.ERROR,
          `Skip failed: ${err.message ?? err.name ?? 'unknown error'}`,
          rerender
        );
      }
      rerender();
    },

    // ---- Iter 34: Composer config (renamed from Sprint 5 Fine-tune drawer) --
    // FINE_TUNE_TOGGLE and FINE_TUNE_CANCEL deleted (drawer no longer exists).
    // FINE_TUNE_APPLY renamed to COMPOSER_CONFIG_APPLY.

    CAPACITY_CHANGE(payload) {
      if (!state.composerConfig) return;
      if (!payload || typeof payload.minutes !== 'number') return;
      state.composerConfig.capacityMinutes = payload.minutes;
      rerender();
    },

    EXTERNAL_MEETINGS_CHANGE(payload) {
      if (!state.composerConfig) return;
      if (!payload || typeof payload.minutes !== 'number') return;
      state.composerConfig.externalMinutesToday = payload.minutes;
      rerender();
    },

    PROJECT_FOCUS_CHANGE(payload, ctx) {
      if (!state.composerConfig) return;
      let kaizenId = payload?.kaizenId ?? null;
      if (!kaizenId && ctx?.element && typeof ctx.element.value === 'string') {
        kaizenId = ctx.element.value || null;
      }
      state.composerConfig.activeKaizenId = kaizenId;
      rerender();
    },

    COMPOSER_CONFIG_APPLY(_payload) {
      // Apply current composerConfig values and re-compose the day.
      const cfg = state.composerConfig ?? {};
      const override =
        typeof cfg.capacityMinutes === 'number' &&
        cfg.capacityMinutes !== DEFAULT_USER.dailyCapacityMinutes
          ? cfg.capacityMinutes
          : undefined;
      runCompose({
        capacityMinutesOverride: override,
        externalMinutesToday: cfg.externalMinutesToday ?? 0,
        activeKaizenId: cfg.activeKaizenId ?? undefined
      });
    },

    // ---- Sprint 6: Reflection loop ------------------------------------------

    SUBMIT_REFLECTION(payload, ctx) {
      if (!payload || !payload.reflectionId) return;
      const fields = extractFormFields(ctx?.element);
      try {
        services.reflectionService.capture(payload.reflectionId, {
          whatWentWell: fields.whatWentWell ?? null,
          whatToImprove: fields.whatToImprove ?? null,
          frictionFlag: Boolean(fields.frictionFlag),
          frictionTag: fields.frictionTag ?? null,
          frictionSummary: fields.frictionSummary ?? null,
          userId: DEFAULT_USER.id
        });
        state.reflectionSheet = null;
      } catch (err) {
        state.lastError = err;
      }
      rerender();
    },

    SKIP_REFLECTION(_payload) {
      state.reflectionSheet = null;
      rerender();
    },

    CLOSE_REFLECTION(_payload) {
      state.reflectionSheet = null;
      rerender();
    },

    TOGGLE_FRICTION(_payload, ctx) {
      if (!state.reflectionSheet) return;
      const el = ctx?.element;
      // If the change originated from a checkbox, use its checked state;
      // otherwise toggle.
      if (el && typeof el.checked === 'boolean') {
        state.reflectionSheet.frictionChecked = el.checked;
      } else {
        state.reflectionSheet.frictionChecked = !state.reflectionSheet.frictionChecked;
      }
      rerender();
    },

    // ---- Sprint 6: Kaizen + Weekly Reflection wizard -----------------------

    WRW_OPEN(_payload) {
      const clusters = services.frictionService.clusterByTag(DEFAULT_USER.id, 7);
      state.wizard = {
        step: 1,
        clusters,
        selectedTag: clusters[0]?.tag ?? null,
        title: '',
        problemStatement: '',
        goalStatement: '',
        errorName: null
      };
      rerender();
    },

    WRW_CLOSE(_payload) {
      state.wizard = null;
      rerender();
    },

    WRW_BACK(_payload) {
      if (!state.wizard) return;
      state.wizard.step = Math.max(1, state.wizard.step - 1);
      rerender();
    },

    WRW_NEXT(payload, ctx) {
      if (!state.wizard) return;
      // If the next action comes from the step-3 form, grab field values.
      const fields = ctx?.element ? extractFormFields(ctx.element) : {};
      if (state.wizard.step === 3) {
        if (typeof fields.title === 'string') state.wizard.title = fields.title;
        if (typeof fields.problemStatement === 'string')
          state.wizard.problemStatement = fields.problemStatement;
        if (typeof fields.goalStatement === 'string')
          state.wizard.goalStatement = fields.goalStatement;
      }
      state.wizard.step = Math.min(4, state.wizard.step + 1);
      rerender();
    },

    WRW_PICK_CLUSTER(payload) {
      if (!state.wizard) return;
      if (typeof payload?.tag === 'string') {
        state.wizard.selectedTag = payload.tag;
      }
      rerender();
    },

    WRW_SUBMIT(_payload) {
      if (!state.wizard) return;
      const cluster = (state.wizard.clusters ?? []).find(
        (c) => c.tag === state.wizard.selectedTag
      ) ?? state.wizard.clusters?.[0];
      if (!cluster) {
        state.wizard.errorName = 'NO_CLUSTER_SELECTED';
        rerender();
        return;
      }
      try {
        services.kaizenService.promote({
          userId: DEFAULT_USER.id,
          fromFrictionClusterSignalIds: cluster.signalIds,
          problemStatement: state.wizard.problemStatement,
          title: state.wizard.title,
          goalStatement: state.wizard.goalStatement ?? ''
        });
        state.wizard = null;
        // Navigate to #kaizen to see the new DRAFT.
        if (typeof globalThis.location !== 'undefined') {
          globalThis.location.hash = '#kaizen';
        }
      } catch (err) {
        state.wizard.errorName = err.name ?? 'PROMOTE_FAILED';
        state.lastError = err;
      }
      rerender();
    },

    KAIZEN_SET_GOAL(payload, ctx) {
      if (!payload || !payload.kaizenId) return;
      const fields = extractFormFields(ctx?.element);
      try {
        services.kaizenService.setGoalStatement(
          payload.kaizenId,
          fields.goalStatement ?? ''
        );
      } catch (err) {
        state.lastError = err;
      }
      rerender();
    },

    // Sprint 11 P1-T2: re-classify a DRAFT Kaizen's projectType.
    KAIZEN_UPDATE_PROJECT_TYPE(payload, ctx) {
      if (!payload || !payload.kaizenId) return;
      const fields = extractFormFields(ctx?.element);
      const newProjectType = fields.newProjectType ?? null;
      try {
        services.kaizenService.updateProjectType({
          kaizenId: payload.kaizenId,
          newProjectType,
          userId: DEFAULT_USER.id
        });
        showToast(state, ToastKind.SUCCESS, 'Project type updated.', rerender);
      } catch (err) {
        state.lastError = err;
        showToast(
          state,
          ToastKind.ERROR,
          `Project-type update failed: ${err.message ?? err.name ?? 'unknown error'}`,
          rerender
        );
      }
      rerender();
    },

    KAIZEN_ADD_ACTION(payload, ctx) {
      if (!payload || !payload.kaizenId) return;
      const fields = extractFormFields(ctx?.element);
      try {
        services.kaizenService.addAction(payload.kaizenId, {
          name: fields.name ?? '',
          ownerRef: fields.ownerRef ?? '',
          dueDate: fields.dueDate ?? ''
        });
      } catch (err) {
        state.lastError = err;
      }
      rerender();
    },

    KAIZEN_REMOVE_ACTION(payload) {
      if (!payload || !payload.kaizenId || typeof payload.index !== 'number') return;
      try {
        services.kaizenService.removeAction(payload.kaizenId, payload.index);
      } catch (err) {
        state.lastError = err;
      }
      rerender();
    },

    KAIZEN_MARK_ACTION_DONE(payload) {
      if (!payload || !payload.kaizenId || typeof payload.index !== 'number') return;
      try {
        services.kaizenService.markActionDone(payload.kaizenId, payload.index);
      } catch (err) {
        state.lastError = err;
      }
      rerender();
    },

    KAIZEN_LOCK_BASELINE(payload) {
      if (!payload || !payload.kaizenId) return;
      // Sprint 8 P0-T7: open the BaselineDialog.
      state.baselineDialog = {
        kaizenId: payload.kaizenId,
        metricName: '',
        unit: '',
        operationalDefinition: '',
        sampleSize: '',
        method: '',
        value: '',
        metricDirection: 'higher_is_better',
        targetImprovement: '',
        errorName: null,
        errorMessage: null
      };
      rerender();
    },

    CLOSE_BASELINE_DIALOG(_payload) {
      state.baselineDialog = null;
      rerender();
    },

    SUBMIT_BASELINE_DIALOG(payload, ctx) {
      if (!payload || !payload.kaizenId) return;
      const fields = extractFormFields(ctx?.element);
      const normalized = extractBaselineFields(fields);
      try {
        services.kaizenService.lockBaseline(payload.kaizenId, normalized);
        state.baselineDialog = null;
      } catch (err) {
        state.baselineDialog = {
          ...(state.baselineDialog ?? {}),
          ...normalized,
          kaizenId: payload.kaizenId,
          errorName: err.name ?? 'LOCK_FAILED',
          errorMessage: err.message ?? ''
        };
        state.lastError = err;
      }
      rerender();
    },

    KAIZEN_START_REMEASUREMENT(payload) {
      if (!payload || !payload.kaizenId) return;
      try {
        services.kaizenService.startRemeasurement(payload.kaizenId, DEFAULT_USER.id);
      } catch (err) {
        state.lastError = err;
      }
      rerender();
    },

    KAIZEN_OPEN_REMEASUREMENT_DIALOG(payload) {
      if (!payload || !payload.kaizenId) return;
      state.remeasurementDialog = {
        kaizenId: payload.kaizenId,
        currentValue: '',
        evidenceSchema: '',
        evidenceValue: '',
        errorName: null,
        errorMessage: null
      };
      rerender();
    },

    CLOSE_REMEASUREMENT_DIALOG(_payload) {
      state.remeasurementDialog = null;
      rerender();
    },

    REMEASUREMENT_PREVIEW_CHANGE(_payload, ctx) {
      if (!state.remeasurementDialog) return;
      const el = ctx?.element;
      if (el && typeof el.value === 'string') {
        state.remeasurementDialog.currentValue = el.value;
      }
      rerender();
    },

    SUBMIT_REMEASUREMENT_DIALOG(payload, ctx) {
      if (!payload || !payload.kaizenId) return;
      const fields = extractFormFields(ctx?.element);
      const normalized = extractRemeasurementFields(fields);
      try {
        services.kaizenService.captureRemeasurement(
          payload.kaizenId,
          DEFAULT_USER.id,
          normalized
        );
        state.remeasurementDialog = null;
      } catch (err) {
        state.remeasurementDialog = {
          ...(state.remeasurementDialog ?? {}),
          currentValue: fields.currentValue ?? '',
          evidenceSchema: fields.evidenceSchema ?? '',
          evidenceValue: fields.evidenceValue ?? '',
          errorName: err.name ?? 'CAPTURE_FAILED',
          errorMessage: err.message ?? ''
        };
        state.lastError = err;
      }
      rerender();
    },

    KAIZEN_OPEN_CLOSE_DIALOG(payload) {
      if (!payload || !payload.kaizenId) return;
      state.closeKaizenDialog = {
        kaizenId: payload.kaizenId,
        lessonsLearned: '',
        errorName: null,
        errorMessage: null
      };
      rerender();
    },

    CLOSE_CLOSE_KAIZEN_DIALOG(_payload) {
      state.closeKaizenDialog = null;
      rerender();
    },

    SUBMIT_CLOSE_KAIZEN_DIALOG(payload, ctx) {
      if (!payload || !payload.kaizenId) return;
      const fields = extractFormFields(ctx?.element);
      try {
        services.kaizenService.close(payload.kaizenId, DEFAULT_USER.id, {
          lessonsLearned: fields.lessonsLearned ?? ''
        });
        state.closeKaizenDialog = null;
      } catch (err) {
        state.closeKaizenDialog = {
          ...(state.closeKaizenDialog ?? {}),
          lessonsLearned: fields.lessonsLearned ?? '',
          errorName: err.name ?? 'CLOSE_FAILED',
          errorMessage: err.message ?? ''
        };
        state.lastError = err;
      }
      rerender();
    },

    KAIZEN_ABANDON(payload) {
      if (!payload || !payload.kaizenId) return;
      state.kaizenAbandonForm = { kaizenId: payload.kaizenId };
      rerender();
    },

    KAIZEN_CANCEL_ABANDON(_payload) {
      state.kaizenAbandonForm = null;
      rerender();
    },

    KAIZEN_CONFIRM_ABANDON(payload, ctx) {
      if (!payload || !payload.kaizenId) return;
      const fields = extractFormFields(ctx?.element);
      try {
        services.kaizenService.abandon(payload.kaizenId, DEFAULT_USER.id, {
          reason: fields.reason ?? ''
        });
        state.kaizenAbandonForm = null;
      } catch (err) {
        state.lastError = err;
      }
      rerender();
    },

    // ---- Sprint 7: Portfolio / Opportunity intake ---------------------------

    OPP_OPEN_INTAKE(_payload) {
      if (!state.portfolio) {
        state.portfolio = { intakeForm: null, expandedOpportunityId: null };
      }
      state.portfolio.intakeForm = {
        title: '',
        problemStatement: '',
        scope: '',
        proposedProjectType: 'AD_HOC',
        // Sprint 11 P1-T1 — richer intake fields (optional).
        currentState: '',
        desiredState: '',
        primaryStakeholder: '',
        errorName: null,
        errorMessage: null
      };
      rerender();
    },

    OPP_CANCEL_INTAKE(_payload) {
      if (state.portfolio) {
        state.portfolio.intakeForm = null;
      }
      rerender();
    },

    OPP_SUBMIT_INTAKE(_payload, ctx) {
      if (!state.portfolio) return;
      const fields = extractFormFields(ctx?.element);
      if (!services.opportunityService) return;
      try {
        services.opportunityService.create({
          userId: DEFAULT_USER.id,
          title: (fields.title ?? '').trim(),
          problemStatement: (fields.problemStatement ?? '').trim(),
          scope: fields.scope ? String(fields.scope).trim() : null,
          proposedProjectType: fields.proposedProjectType ?? 'AD_HOC',
          currentState: fields.currentState ? String(fields.currentState).trim() : null,
          desiredState: fields.desiredState ? String(fields.desiredState).trim() : null,
          primaryStakeholder: fields.primaryStakeholder ? String(fields.primaryStakeholder).trim() : null
        });
        state.portfolio.intakeForm = null;
        showToast(state, ToastKind.SUCCESS, 'Opportunity captured.', rerender);
      } catch (err) {
        state.portfolio.intakeForm = {
          ...(state.portfolio.intakeForm ?? {}),
          title: fields.title ?? '',
          problemStatement: fields.problemStatement ?? '',
          scope: fields.scope ?? '',
          proposedProjectType: fields.proposedProjectType ?? 'AD_HOC',
          currentState: fields.currentState ?? '',
          desiredState: fields.desiredState ?? '',
          primaryStakeholder: fields.primaryStakeholder ?? '',
          errorName: err.name ?? 'INTAKE_FAILED',
          errorMessage: err.message ?? ''
        };
        state.lastError = err;
        showToast(
          state,
          ToastKind.ERROR,
          `Could not capture opportunity: ${err.message ?? err.name ?? 'unknown error'}`,
          rerender
        );
      }
      rerender();
    },

    OPP_PROMOTE(payload) {
      if (!payload || !payload.opportunityId) return;
      if (!services.opportunityService) return;
      try {
        services.opportunityService.promote(payload.opportunityId);
        showToast(state, ToastKind.SUCCESS, 'Opportunity promoted to a DRAFT Kaizen.', rerender);
      } catch (err) {
        state.lastError = err;
        showToast(
          state,
          ToastKind.ERROR,
          `Promote failed: ${err.message ?? err.name ?? 'unknown error'}`,
          rerender
        );
      }
      rerender();
    },

    OPP_DEFER(payload) {
      if (!payload || !payload.opportunityId) return;
      if (!services.opportunityService) return;
      const promptFn = globalThis.prompt ?? null;
      let deferredUntil = null;
      if (promptFn) {
        deferredUntil = promptFn('Defer until (YYYY-MM-DD)') ?? null;
      }
      if (!deferredUntil) {
        // Default: 14 days out if no prompt available.
        const d = new Date(services.clock.now());
        d.setDate(d.getDate() + 14);
        deferredUntil = d.toISOString().slice(0, 10);
      }
      try {
        services.opportunityService.defer(payload.opportunityId, { deferredUntil });
      } catch (err) {
        state.lastError = err;
      }
      rerender();
    },

    OPP_REJECT(payload) {
      if (!payload || !payload.opportunityId) return;
      if (!services.opportunityService) return;
      const promptFn = globalThis.prompt ?? null;
      let reason = null;
      if (promptFn) {
        reason = promptFn('Why reject? (at least 5 chars)') ?? null;
      }
      if (!reason || reason.length < 5) {
        // UI guard: without reason, bail.
        return;
      }
      try {
        services.opportunityService.reject(payload.opportunityId, { reason });
      } catch (err) {
        state.lastError = err;
      }
      rerender();
    },

    OPP_TOGGLE_EXPAND(payload) {
      if (!state.portfolio) return;
      if (!payload || !payload.opportunityId) return;
      if (state.portfolio.expandedOpportunityId === payload.opportunityId) {
        state.portfolio.expandedOpportunityId = null;
      } else {
        state.portfolio.expandedOpportunityId = payload.opportunityId;
      }
      rerender();
    },

    OPP_FILTER_CHANGE(payload, ctx) {
      if (!state.portfolio) return;
      let value = payload?.value;
      if (!value && ctx?.element && typeof ctx.element.value === 'string') {
        value = ctx.element.value;
      }
      if (typeof value === 'string') {
        state.portfolio.oppFilter = value;
        savePortfolioPrefs(services.repo, {
          oppFilter: state.portfolio.oppFilter,
          oppSort: state.portfolio.oppSort
        });
      }
      rerender();
    },

    OPP_SORT_CHANGE(payload, ctx) {
      if (!state.portfolio) return;
      let value = payload?.value;
      if (!value && ctx?.element && typeof ctx.element.value === 'string') {
        value = ctx.element.value;
      }
      if (typeof value === 'string') {
        state.portfolio.oppSort = value;
        savePortfolioPrefs(services.repo, {
          oppFilter: state.portfolio.oppFilter,
          oppSort: state.portfolio.oppSort
        });
      }
      rerender();
    },

    // ---- Sprint 7: Catalog view toggle (P0-T7) ------------------------------

    CATALOG_SET_VIEW(payload) {
      if (!payload || typeof payload.view !== 'string') return;
      state.catalogView = payload.view;
      rerender();
    },

    CATALOG_TOGGLE(payload) {
      if (!payload || !payload.catalogEntryId) return;
      if (!services.catalogService) return;
      try {
        services.catalogService.toggleEnabled(
          payload.catalogEntryId,
          DEFAULT_USER.id
        );
      } catch (err) {
        state.lastError = err;
      }
      rerender();
    },

    // ---- Sprint 9: Weekly composer --------------------------------------

    WEEK_PROPOSE(payload) {
      if (!services.weeklyComposerService) return;
      const weekStart =
        payload?.weekStart ?? computeMondayIso(services.clock.now());
      try {
        services.weeklyComposerService.proposeWeek({
          weekStart,
          userId: DEFAULT_USER.id,
          dailyCapacityMinutes: DEFAULT_USER.dailyCapacityMinutes
        });
      } catch (err) {
        state.lastError = err;
      }
      rerender();
    },

    WEEK_ACCEPT_DAY(payload) {
      if (!payload || !payload.weeklyCompositionId) return;
      if (typeof payload.dayIndex !== 'number') return;
      if (!services.weeklyComposerService) return;
      try {
        services.weeklyComposerService.acceptDay(
          payload.weeklyCompositionId,
          payload.dayIndex
        );
      } catch (err) {
        state.lastError = err;
      }
      rerender();
    },

    WEEK_ACCEPT_ALL(payload) {
      if (!payload || !payload.weeklyCompositionId) return;
      if (!services.weeklyComposerService) return;
      try {
        services.weeklyComposerService.acceptWeek(payload.weeklyCompositionId);
      } catch (err) {
        state.lastError = err;
      }
      rerender();
    },

    // ---- Sprint 10 backlog #3: 4-2-2 rhythm explainer ----

    RHYTHM_EXPLAINER_DISMISS(_payload) {
      state.rhythmExplainerDismissed = true;
      try {
        services.repo.write(RHYTHM_EXPLAINER_KEY, true);
      } catch {
        /* swallow — dismissal will reappear next session, not fatal */
      }
      rerender();
    },

    // C-UX-12 (Iteration 14) — toggle "Why this plan?" chip.
    TOGGLE_WHY_PLAN(_payload) {
      state.whyPlanExpanded = !state.whyPlanExpanded;
      rerender();
    },

    // C-UX-3 (Iteration 15) — open ReflectionSheet for the oldest pending
    // reflection from the EOD closure strip CTA.
    EOD_OPEN_REFLECTION(_payload) {
      const pending = services.reflectionService
        ? services.reflectionService.listPending()
        : [];
      if (pending.length === 0) return;
      // Find the oldest pending reflection by its createdAt field (or first
      // in list order if timestamps are absent).
      const oldest = pending.reduce((best, r) => {
        if (!best) return r;
        const bestAt = best.createdAt ?? '';
        const rAt    = r.createdAt    ?? '';
        return rAt < bestAt ? r : best;
      }, null);
      if (!oldest) return;
      // Resolve the scheduled activity for display metadata.
      const acts = services.repo.read('bamx:v1:activities') ?? {};
      const sa   = oldest.scheduledActivityId ? acts[oldest.scheduledActivityId] : null;
      const catalog = services.catalogService
        ? services.catalogService.list(DEFAULT_USER.id)
        : [];
      const entry = sa
        ? ((catalog ?? []).find((c) => c && c.id === sa.catalogEntryId) ?? null)
        : null;
      state.reflectionSheet = {
        reflectionId:            oldest.id,
        activityId:              oldest.scheduledActivityId ?? null,
        activityName:            entry?.name ?? sa?.name ?? oldest.id,
        plannedDurationMinutes:  sa?.plannedDurationMinutes  ?? 0,
        planVsActualMinutes:     oldest.planVsActualMinutes  ?? 0,
        actualDurationMinutes:
          (sa?.plannedDurationMinutes ?? 0) + (oldest.planVsActualMinutes ?? 0),
        isNonOptional:  entry?.isNonOptional === true,
        frictionChecked: false
      };
      rerender();
    },

    // ---- Sprint 10b Pass B: Portfolio project expand + step actions ----

    PORTFOLIO_TOGGLE_KAIZEN(payload) {
      if (!payload || typeof payload.kaizenId !== 'string') return;
      if (state.expandedKaizenId === payload.kaizenId) {
        state.expandedKaizenId = null;
      } else {
        state.expandedKaizenId = payload.kaizenId;
      }
      rerender();
    },

    KAIZEN_COMPLETE_STEP(payload) {
      if (!payload || !payload.kaizenId || !payload.catalogEntryId) return;
      try {
        services.kaizenService.completeStep({
          kaizenId: payload.kaizenId,
          catalogEntryId: payload.catalogEntryId,
          userId: DEFAULT_USER.id,
          sourceKind: 'portfolio'
        });
        showToast(state, ToastKind.SUCCESS, 'Step marked complete.', rerender);
      } catch (err) {
        state.lastError = err;
        if (err && err.name === 'STEP_NOT_CURRENT') {
          showToast(
            state,
            ToastKind.ERROR,
            'Complete the current step before jumping ahead.',
            rerender
          );
        } else {
          showToast(
            state,
            ToastKind.ERROR,
            `Complete failed: ${err.message ?? err.name ?? 'unknown error'}`,
            rerender
          );
        }
      }
      rerender();
    },

    KAIZEN_SCHEDULE_STEP_TODAY(payload) {
      if (!payload || !payload.kaizenId || !payload.catalogEntryId) return;
      const todayIso = services.clock.now().slice(0, 10);
      try {
        services.kaizenService.scheduleStep({
          kaizenId: payload.kaizenId,
          catalogEntryId: payload.catalogEntryId,
          targetDate: todayIso,
          userId: DEFAULT_USER.id
        });
        showToast(state, ToastKind.SUCCESS, 'Step scheduled for today.', rerender);
      } catch (err) {
        state.lastError = err;
        showToast(
          state,
          ToastKind.ERROR,
          `Schedule failed: ${err.message ?? err.name ?? 'unknown error'}`,
          rerender
        );
      }
      rerender();
    },

    KAIZEN_SCHEDULE_STEP_WEEK(payload) {
      if (!payload || !payload.kaizenId || !payload.catalogEntryId) return;
      // MVP: navigate to /#week; the user runs Plan this week to surface
      // the step on Monday of the current week. See SPRINT_10B_NOTES.md.
      if (typeof globalThis.location !== 'undefined') {
        globalThis.location.hash = '#week';
      }
      rerender();
    }
  };
}

/**
 * Extract form fields into a plain object. Duck-typed so tests can pass
 * a stub form element with a `.querySelectorAll()` that returns items
 * with `.name` + `.value` + `.type` + `.checked`.
 *
 * @param {any} form
 * @returns {Record<string, string>}
 */
export function extractFormFields(form) {
  if (!form) return {};
  // If the click target isn't the form itself, walk up to a closest form.
  let f = form;
  if (typeof f.closest === 'function') {
    const fallback = f.closest('form');
    if (fallback) f = fallback;
  }
  if (typeof f.querySelectorAll !== 'function') return {};
  const out = {};
  const fields = f.querySelectorAll('input, textarea, select');
  if (!fields || typeof fields[Symbol.iterator] !== 'function') return {};
  for (const el of fields) {
    const name = el.name ?? el.getAttribute?.('name');
    if (!name) continue;
    const type = el.type ?? 'text';
    if ((type === 'radio' || type === 'checkbox') && !el.checked) continue;
    out[name] = el.value ?? '';
  }
  return out;
}

/**
 * Boot the SPA. Called from `app.html` with `<script type="module">`.
 * Safe to call only from a browser environment.
 */
export function start() {
  /* istanbul ignore next — real DOM only */
  if (typeof document === 'undefined') {
    throw new Error('start(): no document available; must run in a browser.');
  }
  const services = buildServices();
  const state = createState();

  // Iter 39 — Luminous Constraint Phase 1: load and apply user preferences
  // early in boot, before first render, so the correct theme is applied
  // before any paint (AC6).
  {
    const savedUserPrefs = UserPreferencesService.load(services.repo);
    state.userPreferences = savedUserPrefs;
    applyPreferences(savedUserPrefs);

    // AC7: when themeId === 'system', listen for OS dark/light transitions
    // and update the data-theme attribute. The CSS [data-theme="system"] +
    // prefers-color-scheme combo handles the visual switch automatically, but
    // we still call applyPreferences so any JS-driven code stays in sync.
    /* istanbul ignore next — browser only */
    if (typeof globalThis.matchMedia === 'function') {
      try {
        const mq = globalThis.matchMedia('(prefers-color-scheme: dark)');
        const onColorSchemeChange = () => {
          if (state.userPreferences && state.userPreferences.themeId === 'system') {
            applyPreferences(state.userPreferences);
          }
        };
        if (typeof mq.addEventListener === 'function') {
          mq.addEventListener('change', onColorSchemeChange);
        } else if (typeof mq.addListener === 'function') {
          // Deprecated but present in some older browsers.
          mq.addListener(onColorSchemeChange);
        }
      } catch {
        /* swallow — optional enhancement */
      }
    }
  }

  // Restore persisted Portfolio prefs (Sprint 7 P1-T3).
  const savedPrefs = loadPortfolioPrefs(services.repo);
  if (savedPrefs && typeof savedPrefs === 'object') {
    if (typeof savedPrefs.oppFilter === 'string') {
      state.portfolio.oppFilter = savedPrefs.oppFilter;
    }
    if (typeof savedPrefs.oppSort === 'string') {
      state.portfolio.oppSort = savedPrefs.oppSort;
    }
  }

  // Restore 4-2-2 rhythm explainer dismissal (Sprint 10 backlog #3).
  try {
    if (services.repo.read(RHYTHM_EXPLAINER_KEY) === true) {
      state.rhythmExplainerDismissed = true;
    }
  } catch {
    /* swallow */
  }

  services.bus.subscribe(CycleProposed, () => {});
  services.bus.subscribe(CycleAccepted, () => {});
  services.bus.subscribe(CycleEdited, () => {});
  services.bus.subscribe(CycleRejected, () => {});
  services.bus.subscribe(ComposerInfeasible, () => {});
  services.bus.subscribe(ActivityStarted, () => {});
  services.bus.subscribe(VarianceLogged, () => {});
  services.bus.subscribe(ReflectionStubbed, () => {});
  services.bus.subscribe(ReflectionCaptured, () => {});
  services.bus.subscribe(FrictionSignalCaptured, () => {});
  services.bus.subscribe(KaizenPromoted, () => {});
  services.bus.subscribe(KaizenBaselineLocked, () => {});
  services.bus.subscribe(KaizenRemeasurementStarted, () => {});
  services.bus.subscribe(KaizenRemeasured, () => {});
  services.bus.subscribe(KaizenClosed, () => {});
  services.bus.subscribe(KaizenAbandoned, () => {});
  services.bus.subscribe(OpportunityCreated, () => {});
  services.bus.subscribe(OpportunityPromoted, () => {});
  services.bus.subscribe(OpportunityDeferred, () => {});
  services.bus.subscribe(OpportunityRejected, () => {});
  services.bus.subscribe(WeeklyCycleProposed, () => {});
  services.bus.subscribe(WeeklyCycleAccepted, () => {});
  services.bus.subscribe(KaizenStepCompleted, () => {});
  services.bus.subscribe(KaizenStepScheduled, () => {});
  services.bus.subscribe(CycleReflowed, () => {});
  // Iteration 21 (C-AN-1) — no-op subscribers; future MetricsService will consume.
  services.bus.subscribe(TodayPageViewed, () => {});
  services.bus.subscribe(EditDrawerOpened, () => {});
  services.bus.subscribe(CISkipConfirmed, () => {}); // Iter 38 telemetry no-op subscriber
  // C-UX-COL (Q2): no-op subscriber for RowOutputClicked; future MetricsService
  // will consume for proactive artifact engagement rate metric.
  services.bus.subscribe(RowOutputClicked, () => {});

  // Iter 27 (C-UX-6b): _handlers is a mutable reference so rerender can
  // forward it to syncDrawerFocusTraps for Escape wiring even though handlers
  // are built after rerender is defined. Populated below after buildHandlers().
  let _handlers = {};
  const rerender = () => renderApp(services, state, _handlers);

  // Sprint 6 P0-T4: bridge ActivityCompleted → ReflectionService.stubOnClose,
  // then surface the ReflectionSheet. Keeps the service graph acyclic.
  services.bus.subscribe(ActivityCompleted, (payload) => {
    handleActivityCompleted(services, state, payload);
    // Sprint 15 W5 — reflow today's plan if PROPOSED/SCHEDULED rows remain.
    handleReflowOnRuntimeEvent(services, state, 'ActivityCompleted', rerender);
    rerender();
  });

  // Sprint 15 W5 — also reflow when an activity starts late.
  services.bus.subscribe(ActivityStartedLate, () => {
    handleReflowOnRuntimeEvent(services, state, 'ActivityStartedLate', rerender);
    rerender();
  });

  // Sprint 15 W5 — when a Kaizen step is completed elsewhere (e.g. from
  // Portfolio), reflow the future days of any PROPOSED weekly cycle.
  services.bus.subscribe(KaizenStepCompleted, () => {
    handleWeeklyReflowOnRuntimeEvent(services, state, 'KaizenStepCompleted', rerender);
    rerender();
  });

  // Iteration 21 (C-AN-1): track the previous route so we can emit
  // TodayPageViewed exactly once per route-entry (not on every render).
  let _prevRoute = null;

  const listener = createRouteListener((parsed) => {
    const incomingRoute = parsed.route;
    const fromRoute = _prevRoute;          // capture before mutating
    const wasOnToday = fromRoute === 'today';
    _prevRoute = incomingRoute;
    state.route = incomingRoute;
    state.params = parsed.params;
    // Emit TodayPageViewed once per route-entry to 'today', not on every render.
    // Fires on first load (fromRoute===null) and on every navigation TO today
    // from a different route. Does NOT re-fire when state mutations call rerender()
    // because the route hasn't changed — listener is only invoked on hashchange.
    if (incomingRoute === 'today' && !wasOnToday) {
      services.bus.publish(TodayPageViewed, {
        userId: DEFAULT_USER.id,
        fromRoute,
        viewedAt: services.clock.now(),
        layoutVersion: 'v2'  // C-UX-COL: cohort split for pre/post column refactor
      });
    }
    rerender();
  });

  listener();
  globalThis.addEventListener('hashchange', listener);

  const handlers = buildHandlers({ services, state, rerender });
  // Iter 27: wire handlers into rerender's focus-trap sync (see _handlers above).
  _handlers = handlers;
  attachRootClickListener(APP_ROOT_ID, handlers);

  // Sprint 12: keyboard shortcuts scoped to edit mode.
  //   Esc        → EDIT_CANCEL
  //   Ctrl/Cmd+Z → EDIT_UNDO
  // Sprint 13: arrow keys cycle DURATION_OPTIONS when a slot is selected.
  //   ArrowLeft  → one step down (stops at 15)
  //   ArrowRight → one step up   (stops at 90)
  // C-UX-6: Escape also closes FineTuneDrawer when it is open (regardless of
  //         whether edit mode is active). Escape is always honoured from inside
  //         a modal even when focus is on a form element (WCAG intent).
  /* istanbul ignore next — browser only */
  globalThis.addEventListener('keydown', (ev) => {
    // (Iter 34: FineTuneDrawer Escape branch removed — drawer no longer exists.)
    if (!state.editMode) return;
    // Skip shortcuts while the user is typing in a form field.
    const tag = ev.target?.tagName?.toLowerCase?.();
    const isTyping = tag === 'input' || tag === 'textarea' || tag === 'select' || ev.target?.isContentEditable === true;
    if (ev.key === 'Escape' && !isTyping) {
      ev.preventDefault();
      handlers.EDIT_CANCEL({});
    } else if ((ev.ctrlKey || ev.metaKey) && ev.key === 'z') {
      ev.preventDefault();
      handlers.EDIT_UNDO({});
    } else if ((ev.key === 'ArrowLeft' || ev.key === 'ArrowRight') && !isTyping) {
      handleDurationArrowKey(ev, state, handlers);
    }
  });

  // Sprint 12: search input needs `input` events (the click dispatcher only
  // handles buttons). Delegate on the app root.
  // Sprint 14: <input type="time"> fires `change` (not `click`), so add a
  // sibling `change` delegate that routes `EDIT_CHANGE_START_TIME`.
  /* istanbul ignore next — browser only */
  const root = document.getElementById(APP_ROOT_ID);
  if (root) {
    root.addEventListener('input', (ev) => {
      const el = ev.target;
      if (!el || typeof el.getAttribute !== 'function') return;
      const action = el.getAttribute('data-action');
      if (action === 'EDIT_SEARCH') {
        handlers.EDIT_SEARCH({ value: el.value ?? '' });
      } else if (action === 'CPD_SEARCH') {
        // Iter 36: catalog picker search input.
        handlers.CPD_SEARCH({}, { element: el, event: ev });
      }
    });
    root.addEventListener('change', (ev) => {
      const el = ev.target;
      if (!el || typeof el.getAttribute !== 'function') return;
      if (el.getAttribute('data-action') !== 'EDIT_CHANGE_START_TIME') return;
      const activityId = el.getAttribute('data-activity-id') ?? '';
      handlers.EDIT_CHANGE_START_TIME(
        { activityId, value: el.value ?? '' },
        { element: el, event: ev }
      );
    });
  }

  // Iter 35 Phase 2: install drag controller on the today-page timeline.
  // Uses a MutationObserver to re-attach whenever the .cycle-timeline element
  // is remounted (e.g. after a full rerender changes the route).
  /* istanbul ignore next — browser only */
  {
    let _dragHandle = null;

    function _syncDragController() {
      const timelineEl = document.querySelector('.cycle-timeline');
      if (!timelineEl) {
        if (_dragHandle) { _dragHandle.release(); _dragHandle = null; }
        return;
      }
      // Already attached to this element.
      if (_dragHandle && _dragHandle._el === timelineEl) return;
      if (_dragHandle) { _dragHandle.release(); _dragHandle = null; }

      const activeState = services.composerService.getActiveComposition(DEFAULT_USER.id);
      const compState = activeState?.composition?.state ?? null;

      _dragHandle = installDragController(timelineEl, {
        getCompositionState() {
          const as = services.composerService.getActiveComposition(DEFAULT_USER.id);
          return as?.composition?.state ?? 'PROPOSED';
        },
        isProtected(activityId) {
          const as = services.composerService.getActiveComposition(DEFAULT_USER.id);
          const activities = state.editMode ? state.editMode.activities : (as?.activities ?? []);
          const a = activities.find((x) => x && x.id === activityId);
          return a ? isProtectedBlock(a) : false;
        },
        isInProgress(activityId) {
          const as = services.composerService.getActiveComposition(DEFAULT_USER.id);
          const activities = as?.activities ?? [];
          const a = activities.find((x) => x && x.id === activityId);
          return a ? (a.state === 'IN_PROGRESS') : false;
        },
        onDragPreview(_preview) {
          // Ghost position is handled by inline style in dragController.
          // No rerender needed for move preview.
        },
        onDragCommit(result) {
          handlers.DRAG_COMMIT(result);
        },
        onDragPending(result) {
          handlers.DRAG_START_PROPOSED(result);
        },
        onProtectedAttempt() {
          showToast(state, ToastKind.INFO,
            "This block can't be moved — it's required for your daily rhythm.", rerender);
          rerender();
        },
        onInProgressAttempt() {
          showToast(state, ToastKind.INFO,
            'This block is in progress and cannot be moved.', rerender);
          rerender();
        }
      });
      // Tag handle with element reference for change detection.
      _dragHandle._el = timelineEl;
    }

    // Initial attach after first render.
    _syncDragController();

    // Re-attach whenever the DOM changes (rerenders replace the timeline element).
    if (typeof MutationObserver !== 'undefined') {
      const mo = new MutationObserver(() => _syncDragController());
      mo.observe(document.body, { childList: true, subtree: true });
    }
  }

  // Sprint 10c: upgrade BROWSER_CATALOG (9 entries) → full 60-entry catalog
  // asynchronously after boot. Non-blocking so the app renders immediately
  // with the browser seed; re-renders once the fetch resolves.
  loadFullCatalogAsync(services, rerender);
}

/**
 * Sprint 13 — pure-ish helper that maps a keyboard event while a slot is
 * selected in Edit mode to an EDIT_CHANGE_DURATION dispatch. Separated
 * from the listener so we can unit-test the boundary logic (wrap at 15,
 * cap at 90, no-op when no slot is selected) without touching DOM.
 *
 * @param {{key: string, preventDefault?: () => void}} ev
 * @param {object} state
 * @param {Record<string, Function>} handlers
 * @returns {boolean}   true when a dispatch fired
 */
export function handleDurationArrowKey(ev, state, handlers) {
  if (!state || !state.editMode) return false;
  const selectedId = state.editMode.selectedActivityId;
  if (typeof selectedId !== 'string' || selectedId.length === 0 || selectedId === '__new__') {
    return false;
  }
  const target = state.editMode.activities.find((a) => a && a.id === selectedId);
  if (!target) return false;
  if (isProtectedBlock(target)) return false;
  const current = Number(target.plannedDurationMinutes ?? 0);
  // Snap to the nearest DURATION_OPTIONS index, then step.
  let idx = DURATION_OPTIONS.indexOf(current);
  if (idx < 0) {
    // Snap to the closest option below (or 0 if below the floor).
    idx = 0;
    for (let i = 0; i < DURATION_OPTIONS.length; i += 1) {
      if (DURATION_OPTIONS[i] <= current) idx = i;
    }
  }
  let nextIdx = idx;
  if (ev.key === 'ArrowLeft') {
    nextIdx = Math.max(0, idx - 1);
  } else if (ev.key === 'ArrowRight') {
    nextIdx = Math.min(DURATION_OPTIONS.length - 1, idx + 1);
  } else {
    return false;
  }
  const nextMinutes = DURATION_OPTIONS[nextIdx];
  if (nextMinutes === current) {
    // At boundary — preventDefault to swallow the key, no dispatch.
    if (typeof ev.preventDefault === 'function') ev.preventDefault();
    return false;
  }
  if (typeof ev.preventDefault === 'function') ev.preventDefault();
  handlers.EDIT_CHANGE_DURATION({ activityId: selectedId, minutes: nextMinutes });
  return true;
}

/**
 * Fetch the full 60-entry catalog JSON and re-seed `catalogService` if the
 * fetch returns more entries than currently seeded. Silent on failure —
 * the app keeps using BROWSER_CATALOG so it never regresses.
 *
 * Only called from `start()`, which is itself browser-only.
 *
 * @param {object} services
 * @param {() => void} rerender
 * @returns {Promise<void>}
 */
export async function loadFullCatalogAsync(services, rerender) {
  try {
    const full = await getFullCatalog();
    if (!Array.isArray(full) || full.length === 0) return;
    const currentCount = Array.isArray(services.catalogService.list(DEFAULT_USER.id))
      ? services.catalogService.list(DEFAULT_USER.id).length
      : 0;
    if (full.length <= currentCount) return;
    services.catalogService.seed(full.map((c) => ({ ...c })));
    if (typeof rerender === 'function') rerender();
  } catch (err) {
    if (typeof console !== 'undefined') {
      // eslint-disable-next-line no-console
      console.warn('loadFullCatalogAsync: full catalog fetch failed; using BROWSER_CATALOG fallback', err);
    }
  }
}

/**
 * ActivityCompleted subscriber — stubs a Reflection and opens the
 * ReflectionSheet modal. Exported for tests.
 *
 * @param {object} services
 * @param {object} state
 * @param {{scheduledActivityId: string, compositionId?: string, actualEndAt?: string}} payload
 */
export function handleActivityCompleted(services, state, payload) {
  if (!payload || !payload.scheduledActivityId) return;
  const acts = services.repo.read('bamx:v1:activities') ?? {};
  const sa = acts[payload.scheduledActivityId];
  if (!sa) return;
  // Idempotent: if a Reflection already exists for this activity, just
  // open the sheet. Otherwise stub one.
  let reflection =
    services.reflectionService.getByScheduledActivityId(sa.id);
  if (!reflection) {
    try {
      const enrichedSa = {
        ...sa,
        userId:
          typeof sa.userId === 'string' && sa.userId.length > 0
            ? sa.userId
            : DEFAULT_USER.id
      };
      reflection = services.reflectionService.stubOnClose(enrichedSa);
    } catch (err) {
      if (err && err.name !== 'REFLECTION_ALREADY_EXISTS') {
        state.lastError = err;
        return;
      }
      reflection = services.reflectionService.getByScheduledActivityId(sa.id);
    }
  }
  if (!reflection || reflection.pending === false) return;
  // Resolve the catalog entry for display name + non-optional gating.
  const catalog = services.catalogService.list(DEFAULT_USER.id);
  const entry =
    (catalog ?? []).find((c) => c && c.id === sa.catalogEntryId) ?? null;
  state.reflectionSheet = {
    reflectionId: reflection.id,
    activityId: sa.id,
    activityName: entry?.name ?? sa.name ?? sa.id,
    plannedDurationMinutes: sa.plannedDurationMinutes ?? 0,
    planVsActualMinutes: reflection.planVsActualMinutes ?? 0,
    actualDurationMinutes:
      (sa.plannedDurationMinutes ?? 0) + (reflection.planVsActualMinutes ?? 0),
    isNonOptional: entry?.isNonOptional === true,
    frictionChecked: false
  };
}

/**
 * Sprint 15 W5 — reflow today's plan if any PROPOSED/SCHEDULED activities
 * remain. Skips silently when the day is fully executed (no flexible
 * activities) or when no active composition exists. Surfaces a toast on
 * the count of shifted blocks so the user gets feedback.
 *
 * Exported for tests.
 *
 * @param {object} services
 * @param {object} state
 * @param {string} trigger
 * @param {(): void} rerender
 */
export function handleReflowOnRuntimeEvent(services, state, trigger, rerender) {
  if (!services || !services.composerService) return;
  const todayDate = services.clock.now().slice(0, 10);
  try {
    const result = services.composerService.reflow({
      userId: DEFAULT_USER.id,
      date: todayDate,
      trigger
    });
    if (!result || result.shifted === 0) return;
    showToast(
      state,
      ToastKind.INFO,
      `Plan re-flowed: ${result.shifted} ${result.shifted === 1 ? 'activity' : 'activities'} shifted.`,
      rerender
    );
  } catch (err) {
    /* istanbul ignore next — defensive */
    state.lastError = err;
  }
}

/**
 * Sprint 15 W5 — reflow the weekly cycle for the current Monday if a
 * PROPOSED weekly composition exists with future days.
 *
 * Exported for tests.
 *
 * @param {object} services
 * @param {object} state
 * @param {string} trigger
 * @param {(): void} rerender
 */
export function handleWeeklyReflowOnRuntimeEvent(services, state, trigger, rerender) {
  if (!services || !services.weeklyComposerService) return;
  const weekStart = computeMondayIso(services.clock.now());
  try {
    const updated = services.weeklyComposerService.reflow({
      userId: DEFAULT_USER.id,
      weekStart,
      trigger
    });
    if (!updated) return;
    showToast(state, ToastKind.INFO, 'Week plan re-flowed.', rerender);
  } catch (err) {
    /* istanbul ignore next — defensive */
    state.lastError = err;
  }
}

// Auto-start when loaded as the page script (not when imported by tests).
/* istanbul ignore next — browser-only side effect */
if (
  typeof document !== 'undefined' &&
  typeof globalThis.__CADENCEPLAN_NO_AUTOSTART__ === 'undefined'
) {
  queueMicrotask(() => {
    try {
      start();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('CadencePlan failed to start:', err);
    }
  });
}

export default {
  buildServices,
  buildComposerInput,
  renderApp,
  buildHandlers,
  computeDaysSinceSignup,
  computePriorDayRecap,
  computeEodRecap,
  extractFormFields,
  handleActivityCompleted,
  handleDurationArrowKey,
  start,
  DEFAULT_USER,
  APP_ROOT_ID,
  parseHash,
  buildHash
};
