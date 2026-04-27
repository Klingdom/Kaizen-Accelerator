# Today Page — Implementation & Render Audit (frontend-engineer lens)

## 1. Render Pipeline Trace

A click on any `data-action` element triggers this path:

1. `attachRootClickListener` (mount.js:162) attaches one delegated `click` listener to `#app-root`.
2. `createDispatcher` (mount.js:96) walks from `event.target` up via `findActionTarget` (mount.js:50) until it finds the nearest element carrying `data-action`.
3. `readAction` (mount.js:73) extracts `action` + parses `data-payload` JSON.
4. The matching handler in `buildHandlers` (app.js, ~line 870+) mutates `state` directly — e.g., `EDIT_SELECT_SLOT` sets `state.editMode.selectedActivityId` (app.js:912).
5. Handler calls `rerender()` (app.js:2210), which is `() => renderApp(services, state)`.
6. `renderApp` (app.js:521) reads `state.route === 'today'`, calls `composerService.getActiveComposition`, runs `mergeOrphanActivities`, builds `kaizenTitleById` by iterating `kaizenService.list()`, calls `catalogService.list()`, then calls `Today({...})` (app.js:556–574).
7. `Today` (Today.js:106) calls `validateEditState`, `NowPane`, `UpNextRail` (twice), `CycleCard`, `EditDrawer`, `FineTuneDrawer`, and `renderOpenDialog` — all returning strings.
8. `CycleCard` (CycleCard.js:263) dispatches to `renderProposed` / `renderAccepted` / `renderRejected`, each calling `renderActivityList` which maps over all activities calling `ScheduledActivityBlock`.
9. The assembled `pageHtml` string is wrapped in `AppShell` + `Toast` (app.js:689–692) and written to the DOM via `mountHtml` (mount.js:138), which sets `el.innerHTML = html` — a full subtree replacement on every re-render.

## 2. Component Boundary Audit

| Component | Lines | Pure? | Dependencies | Reuse elsewhere? |
|---|---|---|---|---|
| Today.js | 304 | Yes | CycleCard, NowPane, UpNextRail(×2), EditDrawer, FineTuneDrawer, AdherenceDial, RhythmExplainer, OutputArtifactDialog, SkipReasonModal, BucketStrip (constants), editMode.js (validateEditState) | No — Today-only |
| CycleCard.js | 303 | Yes | BucketStrip, ScheduledActivityBlock, AcceptEditRejectTriad, AutoPlanButton | No |
| ScheduledActivityBlock.js | 287 | Yes | WhyChip, editMode.js (isProtectedBlock, DURATION_OPTIONS), timeFormat.js | Only inside CycleCard |
| EditDrawer.js | 314 | Yes | editMode.js (filterCatalog, isInToday, durationDelta, isProtectedBlock) | No |
| UpNextRail.js | 182 | Yes | esc only | Week page also receives it |
| NowPane.js | 180 | Yes | esc only | No |
| AdherenceDial.js | 76 | Yes | esc | No |
| RhythmExplainer.js | 44 | Yes | esc | No |

No DOM access or `globalThis` usage detected in any component. `globalThis.addEventListener` appears only in app.js:2241,2253 (route listener and keyboard shortcuts) — correctly isolated to the boot layer. All components are strictly pure string producers.

One notable boundary blur: `ScheduledActivityBlock` hard-imports `DURATION_OPTIONS` from `editMode.js` (line 29) and renders edit-mode UI (duration chips, lock icons, edit-select buttons) inline. The component's concern spans normal-mode and edit-mode rendering; extracting edit chrome into a wrapper or variant prop would reduce the surface but is not a current defect.

## 3. State Coupling

`state.editMode` (app.js:354) is a mutable sub-object with eight fields: `compositionId`, `snapshotActivities`, `activities`, `selectedActivityId`, `undoStack`, `searchQuery`, `projectTypeFilter`, `expandedBuckets`. It is initialized wholesale in the `EDIT` handler (app.js:879) and set to `null` on cancel/commit.

`Today.js` receives `editMode` as a prop (line 125) and derives:
- `isEditing` (line 202) — boolean, computed from `!!editMode`
- `activitiesForRender` (line 203–205) — conditional swap between `editMode.activities` and `activeState.activities`
- `violations` (line 209–216) — computed fresh every render by calling `validateEditState(...)` inside `Today`
- `undoCount` (line 224–225) — derived from `editMode.undoStack.length`

`violations` is the only computed-every-render value that has real cost: it iterates activities against targets/floors/ceilings on every re-render, including on every duration-chip click (app.js:1048–1060 → rerender). This could be a pure helper memoized by `[activities, targets, floors, ceilings]` identity if renders become measurably slow as catalog grows.

`kaizenTitleById` is rebuilt on every `renderApp` call by iterating `kaizenService.list()` (app.js:548–553). It does not change unless a Kaizen is added/renamed, but it is not cached. A UX redesign adding more per-activity Kaizen metadata would compound this cost.

A UX redesign that did not change Today's four regions (header, NowPane, body, EditDrawer) would be absorbable purely inside renderers. A redesign that introduced cross-day state (e.g., a "yesterday recap" region) or per-user preference state (e.g., collapsed/expanded sections) would require a new top-level key in `createState()` and a corresponding prop threaded through `Today`.

## 4. Render Cost

**DOM reflows per re-render:** One. `mountHtml` replaces the entire `#app-root` innerHTML in a single assignment (mount.js:151). No incremental patch. The browser performs one full subtree parse + layout pass per action.

**Hot paths in edit mode:**
- Every duration-chip click (EDIT_CHANGE_DURATION, app.js:1031) calls `rerender()` → full Today re-render → `ScheduledActivityBlock` re-renders all N activities, each calling `formatTimeRange` (a `new Date` parse) and `isProtectedBlock`.
- Every `EDIT_SELECT_SLOT` (app.js:912) triggers a re-render that maps all activities in `renderActivityList` (CycleCard.js:110–133) and passes each through `ScheduledActivityBlock`. For a typical day (~8 activities) this is not a bottleneck; at 20+ activities in a full catalog swap session it would be noticeable without memoization.
- `EditDrawer` calls `filterCatalog` + `groupByBucket` on every render (EditDrawer.js:272–273). `groupByBucket` runs a `sort` over all matching entries on every re-render regardless of whether `search` or `projectTypeFilter` changed. With a catalog of 50+ entries this is an O(n log n) hot path per keystroke in the search box.
- `selectUpNext` (UpNextRail.js:94) is called **twice** per render from Today.js:235–251 (once for rail variant, once for mobile). Both iterate the full activities array, build a decorated sort, and slice. This doubles the work for a computation that produces identical sorted input each time. A single call with both variants rendered from the result would halve the cost.

**Re-render frequency:** Every data-action in edit mode calls `rerender()` unconditionally, including search input changes which fire EDIT_SEARCH per keystroke (app.js:1203–1208 pattern). No debounce is present.

**Memoization candidates:**
- `selectUpNext(activities, nowIso)` — pure, same output for same inputs; could be called once and passed to both rail variants.
- `validateEditState(activities, targets, floors, ceilings)` — pure, called every render inside Today.js:209–216.
- `buildExplainById(composition)` — pure, result only changes when composition changes (CycleCard.js:143).
- `kaizenTitleById` map in renderApp (app.js:547–554) — rebuilt on every render, only changes on Kaizen mutation events.

## 5. CSS Architecture

**Selector count:** app.css has approximately 330 total selectors. Of these, roughly 168 are prefixed with component-name tokens (`.today-*`, `.cycle-*`, `.sa-*`, `.up-next*`, `.now-pane*`, `.edit-*`, `.rhythm-*`, `.adherence-*`, `.dial-*`).

**Naming convention:** Component-name prefix, not BEM. The pattern is `[component-abbreviation]-[element]` (e.g., `.sa-block`, `.sa-when`, `.sa-bucket-chip`). Modifiers are appended as additional classes (`.sa-dur-chip-active`, `.cycle-editing`) rather than BEM `--modifier`. This is consistent and readable, though not formally BEM.

**Specificity drift:** No `!important` declarations detected. Specificity is flat — nearly all selectors are single-class. The only compound selectors are state-combinations like `.adherence-dial.empty .dial-number` (app.css:212) and attribute selectors like `.wk-day[data-state="ACCEPTED"]` (app.css:1063).

**Token drift:** The `.sa-dur-chip` block introduced in Sprint 13 (app.css:1927–1984) uses a second token namespace — `var(--color-text-muted, #6b7280)`, `var(--color-border, #d1d5db)`, `var(--color-primary, #2563eb)` — that is not declared in `:root`. These fall through to the inline fallback values, which differ from the design token values in `:root` (`--primary: #0f172a`, `--border: #d6d3d1`). This is a semantic inconsistency: the duration chips use blue-primary (`#2563eb`) while the rest of the UI uses near-black-primary (`#0f172a`).

**Mobile breakpoints:** Ten `@media` rules found. Breakpoints used: `max-width: 600px` (6×), `max-width: 900px` (3×), `max-width: 1024px` (1×). They are scattered throughout app.css co-located with their component blocks, not centralized. The 600px and 900px thresholds are used consistently; the single 1024px breakpoint is for `.wk-grid` only.

## 6. Patterns Worth Extracting

1. **Bucket-chip class system** (`BUCKET_CHIP_CLASS` in ScheduledActivityBlock.js:36–40, `BUCKET_DOT_CLASS` in UpNextRail.js:32–36, `edit-bucket-${bucket.toLowerCase()}` in EditDrawer.js:166). Three parallel maps from bucket key to CSS class, defined independently in three files. A single `bucketMeta(bucket)` helper returning `{ chipClass, dotClass, label, cssVar }` would eliminate drift and serve BucketStrip too.

2. **Empty-state structure** (`.empty-state` + `.empty-copy` in CycleCard.js:243–246, Today.js:191–193, CycleCard.js renderRejected, Week.js:207). The HTML structure is identical: a wrapper div, a paragraph of copy, and optionally an AutoPlanButton. A `EmptyState({ copy, cta })` component returning that structure would make all empty-state rendering consistent and independently testable.

3. **Drawer pattern** (FineTuneDrawer.js and EditDrawer.js share shape: an `<aside>` with `role="dialog"`, a header with title + dismiss ×, a scrollable body, and a sticky footer with action buttons). The structural pattern is identical; only the body content differs. A `DrawerShell({ title, subtitle, dismissAction, body, footer })` wrapper would make both drawers thinner and open the pattern to future drawers (e.g., a "yesterday recap" panel) at zero structural cost.

4. **Edit-mode triad duplication** (`renderEditTriad` in CycleCard.js:48–56 is structurally identical to `renderFooter` in EditDrawer.js:229–239; both render Commit / Cancel / Undo with the same disable logic). One is inside the card, one in the drawer footer. They are independently defined and will drift. A single `EditActionTriad({ undoCount })` helper used by both would keep them in sync.

5. **Onboarding/dismissible banner pattern** (RhythmExplainer.js is a standalone `<aside role="note">` with a dismiss button and a `data-action` hook; InfeasibleBanner presumably follows similar shape). The dismissed-flag-via-prop contract is clean. The pattern is not generalized — a `DismissibleBanner({ heading, body, dismissAction, dismissed })` component would cover RhythmExplainer, onboarding nudges, and any future contextual explainers.

6. **Header pattern** (Today.js:140–144 renders `<header class="today-header">` with day badge + AdherenceDial + FineTuneButton; CycleCard.js:171–175 renders `<header class="cycle-header">` with title + intro text). These are component-local headers with divergent structures, but both follow a badge-or-label + metric-surface + action-button layout. A `PageHeader` or `CardHeader` primitive would enforce consistent spacing and typography hierarchy.

7. **Modal pattern** (OutputArtifactDialog and SkipReasonModal are invoked via `renderOpenDialog` in Today.js:286–302, dispatched by `kind`). The dispatch-by-kind idiom is clean but ad hoc. A `renderModal(openDialog, registry)` helper with a registry map would make adding future modal kinds a one-liner and remove the if-chain.

8. **Toast pattern** (Toast.js:44 is already a standalone pure component, correctly rendered above pageHtml in app.js:689–690). This is the most formalized pattern in the codebase. It is the extraction model the other patterns should follow.

## 7. UX-Redesign Cost Estimates

| Change | Cost | Risk | Notes |
|---|---|---|---|
| Reordering existing regions on Today | S | Low | Today.js is a flat template string; region order is a line-move. No state change. |
| Adding a "yesterday recap" region | M | Low-Med | Requires new prop threaded from renderApp → Today, new state key in createState(), new service call in renderApp. Pure component is trivial; wiring is the cost. |
| Replacing the Day-badge with a richer component | S | Low | `dayBadge` is a single `<span>` at Today.js:137–139. Replace with a component call. No state shape change. |
| Promoting RhythmExplainer to a once-per-session toast | M | Med | Currently render-driven by `rhythmExplainerDismissed` prop. Promoting to Toast requires merging into the toast state machine (app.js:341), adding a `kind` discriminator, and ensuring the existing `RHYTHM_EXPLAINER_DISMISS` handler also clears it from the toast. Risk: the existing per-user-persisted dismissed flag and the session-only toast flag would need to coexist or be unified. |
| Unifying the chip/badge tone system across components | M | Med | Three independent bucket→class maps (see §6, pattern 1) plus the Sprint 13 token namespace split (§5). Requires touching ScheduledActivityBlock, UpNextRail, EditDrawer, and the CSS. No state change, but CSS token consolidation risks visual regression across all pages. |
| Adding day-band onboarding nudges (day 14, day 30) | S | Low | `daysSinceSignupHint` (Today.js:67–76) already implements the band logic. Adding bands is a pure function change + copy update. No state change needed. |
| Extracting a shared `<PageHeader>` pattern across all pages | L | Med | Each page (Today, Week, Portfolio, Catalog, Kaizen, InsightsPortfolio) has a bespoke header. Unifying requires auditing all six header structures, agreeing on a prop contract, and updating CSS. Risk is visual regression and the possibility that some pages have legitimate header divergence that the shared component would need to accommodate via variants. |

## 8. Risk Register for a Cross-Page Theme Pass

1. **CSS token namespace split** (Probability: High, Impact: Med). The Sprint 13 duration-chip block uses `--color-*` tokens not declared in `:root` (app.css:1932–1976). A theme pass that assumes `:root` is the single source of truth would miss these fallback-valued overrides. Mitigation: audit for `var(--color-` before touching `:root`.

2. **`empty-copy` / `empty-state` class reuse across pages** (Probability: Med, Impact: Low-Med). The `.empty-copy` class is used in Today.js, CycleCard.js, and Week.js but has only one CSS rule (app.css:186). Any theme-pass change to `.empty-copy` affects all three pages simultaneously. Mitigation: make empty-state styles explicit per-page or extract a shared `.page-empty-copy` with a deliberate single definition.

3. **Bucket color tokens used inconsistently** (Probability: Med, Impact: Med). `--project-bg`, `--communication-bg`, `--ci-bg` etc. are declared in `:root` but the duration chips re-declare a blue primary (`#2563eb`) that conflicts with `--primary: #0f172a`. A theme pass touching bucket colors would need to decide which primary wins. Mitigation: remove the inline fallbacks from the Sprint 13 block and route them through `:root` tokens before any cross-page pass.

4. **Edit-mode triad duplication diverging under theme pressure** (Probability: Med, Impact: Low). `renderEditTriad` (CycleCard.js:48) and `renderFooter` (EditDrawer.js:229) share logic but not code. A theme pass that changes button classes in one will silently leave the other unchanged. Mitigation: extract shared `EditActionTriad` helper first (§9, step 2).

5. **Breakpoint inconsistency at 1024px** (Probability: Low, Impact: Low). Only `.wk-grid` uses `max-width: 1024px`. All other breakpoints use 600px or 900px. A theme pass introducing layout changes to the Today body grid (`.today-body` flex row) would need to decide whether to adopt 1024px as a third breakpoint or limit to the existing two. Inconsistency would produce unexpected reflow at intermediate viewport widths.

## 9. Recommended Extraction Order

1. **Unify the bucket-chip class maps into a single `bucketMeta()` helper.** This is a zero-risk pure-function extraction (no CSS change, no state change) that immediately eliminates drift between ScheduledActivityBlock, UpNextRail, and EditDrawer. It also creates the foundation for a consistent bucket-tone system before any visual pass begins.

2. **Extract `EditActionTriad` from CycleCard and EditDrawer.** Both files already render functionally identical HTML. Extracting before any theme work prevents the two implementations from diverging under edit-mode UX changes. Low risk, high leverage: any future edit-mode button label or style change becomes a single-site edit.

3. **Consolidate CSS token namespace** — remove `var(--color-*)` fallbacks from the Sprint 13 duration-chip block, map them to existing `:root` tokens, and verify visual parity. This is a prerequisite for any cross-page theme pass.

4. **Extract `EmptyState({ copy, cta })` component.** Currently three separate inlined empty-state structures. Extracting makes every empty state (Today empty, Today infeasible, CycleCard rejected, Week empty) independently testable and visually consistent before any redesign touches them.

5. **Extract `DrawerShell` from FineTuneDrawer and EditDrawer.** Once the structural pattern is formalized, adding any future drawer (e.g., a filter panel on InsightsPortfolio) is a body-content concern only. Do this before any new drawer is added to prevent a third independent implementation.

6. **Deduplicate `selectUpNext` call in Today.js.** Call once, pass the result to both `UpNextRail` invocations (Today.js:235–251). This is a one-line change with no UX impact and removes a guaranteed redundant O(n log n) sort on every Today render.

7. **Add `DismissibleBanner` abstraction covering RhythmExplainer.** Once the pattern is formalized, the Sprint 10 backlog item for additional onboarding nudges (day 14, day 30 bands) becomes a configuration concern, not an HTML-structure concern.
