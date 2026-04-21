/**
 * CadencePlan MVP — single-page app entry (Sprint 4).
 *
 * Wires:
 *   - boot (creates `bamx:v1:meta`)
 *   - CatalogService.seed() with the browser seed
 *   - ComposerService (persists + publishes)
 *   - hash-based router
 *   - AppShell + Today page render pipeline
 *   - Event delegation on the app root for Accept / Edit / Reject /
 *     AUTO_PLAN / nav clicks.
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
import { CatalogService, CATALOG_KEY } from './services/CatalogService.js';
import { ComposerService } from './services/ComposerService.js';
import {
  CycleProposed,
  CycleAccepted,
  CycleRejected,
  ComposerInfeasible
} from './events/events.js';
import { BROWSER_CATALOG } from './catalog/browserSeed.js';
import { AppShell } from './ui/AppShell.js';
import { Today } from './ui/pages/Today.js';
import { PlaceholderPage } from './ui/pages/PlaceholderPage.js';
import {
  mountHtml,
  attachRootClickListener
} from './ui/mount.js';
import {
  createRouteListener,
  parseHash,
  buildHash
} from './ui/router.js';

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

  boot(repo, { now: () => clock.nowDate() });

  const catalogService = new CatalogService({ repo });
  // Seed only if empty — idempotent across reloads.
  const existing = repo.read(CATALOG_KEY);
  if (!existing || Object.keys(existing).length === 0) {
    catalogService.seed(BROWSER_CATALOG.map((c) => ({ ...c })));
  }

  const composerService = new ComposerService({
    repo,
    bus,
    clock,
    catalogService
  });

  return { repo, bus, clock, catalogService, composerService };
}

/**
 * Build a composer input from the default user, ready for composeDaily.
 *
 * @param {ClockService} clock
 * @returns {object}
 */
export function buildComposerInput(clock) {
  const date = clock.nowDate().toISOString().slice(0, 10);
  return {
    cycleType: 'DAILY',
    userId: DEFAULT_USER.id,
    date,
    role: [...DEFAULT_USER.role],
    dailyCapacityMinutes: DEFAULT_USER.dailyCapacityMinutes,
    externalMinutesToday: 0,
    sprintPhase: 'EXECUTION',
    sprintAnchorDate: DEFAULT_USER.sprintAnchorDate,
    user: {
      deepSlicePreference: DEFAULT_USER.deepSlicePreference,
      sprintAnchorDate: DEFAULT_USER.sprintAnchorDate
    },
    activeKaizen: {
      id: 'k_cadenceplan_mvp',
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
    composerLoading: false,
    infeasibleExplain: null,
    lastError: null
  };
}

/**
 * Render the entire app into the DOM. Pure shell around the pure page
 * components; real DOM only via `mountHtml`.
 *
 * @param {object} services
 * @param {object} state
 */
export function renderApp(services, state) {
  const { composerService } = services;
  let pageHtml;

  if (state.route === 'today') {
    const activeState = composerService.getActiveComposition(DEFAULT_USER.id);
    const daysSinceSignup = computeDaysSinceSignup(
      DEFAULT_USER.createdAt,
      services.clock.now()
    );
    pageHtml = Today({
      activeState,
      loading: state.composerLoading,
      isFirstRun: activeState === null && daysSinceSignup <= 1,
      infeasibleExplain: state.infeasibleExplain,
      adherence: {
        adherencePct: null,
        acceptancePct: null,
        kaizenDeltaPct: null,
        daysSinceSignup
      }
    });
  } else {
    pageHtml = PlaceholderPage({ route: state.route });
  }

  const shellHtml = AppShell({ route: state.route, pageHtml });
  mountHtml(APP_ROOT_ID, shellHtml);
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
 * Build the click handler registry. Each entry is a function (payload,
 * ctx) called by the dispatcher in mount.js.
 *
 * Exported for tests: handlers are pure-ish (mutate state, call service
 * methods) so we can unit-test them with a stub service.
 *
 * @param {{services: object, state: object, rerender: () => void}} scope
 */
export function buildHandlers(scope) {
  const { services, state, rerender } = scope;

  return {
    AUTO_PLAN(_payload) {
      state.composerLoading = true;
      state.lastError = null;
      state.infeasibleExplain = null;
      rerender();
      try {
        const input = buildComposerInput(services.clock);
        const result = services.composerService.composeDaily(input);
        if (result.state === 'INFEASIBLE') {
          state.infeasibleExplain = result.infeasible?.explain ?? [];
        }
      } catch (err) {
        state.lastError = err;
      } finally {
        state.composerLoading = false;
        rerender();
      }
    },

    ACCEPT(payload) {
      if (!payload || !payload.compositionId) return;
      try {
        services.composerService.accept(payload.compositionId);
      } catch (err) {
        state.lastError = err;
      }
      rerender();
    },

    EDIT(payload) {
      // Sprint 4 defer: Edit routes to a placeholder — the real Edit
      // composer with drag/drop ships in Sprint 5.
      if (typeof globalThis.alert === 'function') {
        globalThis.alert('Edit composer ships in Sprint 5.');
      }
    },

    REJECT(payload) {
      if (!payload || !payload.compositionId) return;
      // §6.5.10 confirmation dialog copy: "Reject today's plan?" / body
      // / [Reject] [Cancel]. In MVP we use the browser's native confirm.
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

    START_ACTIVITY(_payload) {
      // Sprint 4 defer: Start ships in Sprint 5 with ActivityService.
      if (typeof globalThis.alert === 'function') {
        globalThis.alert('Start ships in Sprint 5.');
      }
    }
  };
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

  // Subscribe to bus events for future wiring (audit log, metrics, etc.).
  services.bus.subscribe(CycleProposed, () => {});
  services.bus.subscribe(CycleAccepted, () => {});
  services.bus.subscribe(CycleRejected, () => {});
  services.bus.subscribe(ComposerInfeasible, () => {});

  const rerender = () => renderApp(services, state);

  const listener = createRouteListener((parsed) => {
    state.route = parsed.route;
    state.params = parsed.params;
    rerender();
  });

  // Kick router once on load + on every hashchange.
  listener();
  globalThis.addEventListener('hashchange', listener);

  // Attach click delegation.
  attachRootClickListener(APP_ROOT_ID, buildHandlers({ services, state, rerender }));
}

// Auto-start when loaded as the page script (not when imported by tests).
/* istanbul ignore next — browser-only side effect */
if (
  typeof document !== 'undefined' &&
  typeof globalThis.__CADENCEPLAN_NO_AUTOSTART__ === 'undefined'
) {
  // Defer to next tick so the module finishes loading before DOM work.
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
  start,
  DEFAULT_USER,
  APP_ROOT_ID,
  parseHash,
  buildHash
};
