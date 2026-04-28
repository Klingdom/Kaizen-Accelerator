# BAM-X Kaizen OS — Changelog

This file records meaningful product, architecture, and process changes per improvement-loop iteration. Sprint-level granularity prior to Iteration 9 is captured in `SPRINT_*_NOTES.md`. Loop-level granularity from Iteration 9 onward is captured here and in `ITERATION_LOG.md`.

Format: each iteration is a top-level section. Each entry states **what changed**, **why**, and **impact** (test counts, runtime, behaviour delta).

---

## Iteration 15 — 2026-04-27 — EOD Closure Ritual (C-UX-3)

### What changed
- **New file** `js/ui/components/EodClosureStrip.js` (64 lines) — pure component renders single-line strip below CycleCard when "day done" condition holds; suppresses to empty string when `eodRecap` is null. Mirrors Iteration 14's MorningRecap pattern.
- **`Today.js` updated**: `EodClosureStrip` renders BELOW CycleCard in the proposed/accepted/edited render branch only. Empty / infeasible / loading branches do not render the strip.
- **`app.js` updated**:
  - New `computeEodRecap(state, activities, nowIso)` helper — returns null unless triggered; computes "all terminal" check (every non-DROPPED activity in CLOSED or SKIPPED) AND/OR "time passed" check (`nowIso >= lastActivityEndIso` where `lastActivityEndIso` = max of `plannedStartAt + plannedDurationMinutes` across activities); returns `{closedCount, totalCount, skippedCount, pendingReflectionCount}` when triggered.
  - New `EOD_OPEN_REFLECTION` action handler — finds oldest pending reflection via `services.reflectionService.listPending()` (sorted by `createdAt`), opens via existing `openReflectionSheet()` flow at line 2469.
- **`app.css`**: new `.eod-closure-strip` style block (44 lines) using only existing T1 tokens; zero new `:root` definitions.
- **2 new test files** (506 lines, 46 new tests):
  - `tests/ui/components/EodClosureStrip.test.js` (184 lines, 25 tests) — null path, AC3-1, AC3-2, AC3-7, AC3-8, singular/plural, accessibility, XSS safety.
  - `tests/app.iteration15.test.js` (322 lines, 21 tests) — `computeEodRecap` unit cases + `EOD_OPEN_REFLECTION` handler.
- **Updated** `tests/ui/pages/Today.test.js` (+~230 lines) — Iteration 15 integration tests AC3-1 through AC3-11.

### Why
Convergent finding across 4 lenses in Iteration 12 synthesis (PM, Growth, Competitive, Analytics): "Today closes cold." No "day complete" confirmation, no pending-reflection nudge, no bridge to tomorrow. Habit loop had no defined end. C-UX-3 ranked score 12 in IMPROVEMENT_BACKLOG; user explicit "go" per "a then b" sequencing after Iteration 14 shipped the morning bookend (C-UX-10).

### Architectural note
Architect's PRD §244 open question — "Is `lastActivityEndsAt` derivable from existing composition data?" — confirmed YES this iteration. Computed via `max(plannedStartAt + plannedDurationMinutes)` across activities. No new schema, no persistence change. Pure composition over existing data.

### Impact
- **Test suite**: 2,751 → **2,810 passing** (+59). 0 failing. 676 suites. Runtime **1.92s** (45% headroom under 3.5s budget).
- **All 11 acceptance criteria** (AC3-1..11) PASS, no descopes.
- **Integrity preserved**: composer, domain types, event bus, ReflectionService all untouched (verified via `git diff --name-only`).
- **T1 token freeze respected**: zero new CSS token definitions added.
- **Time spent**: ~1.5h actual vs ~5h estimate.

### User-visible change after deploy
When the day's last activity ends OR all activities reach terminal state (CLOSED/SKIPPED), a single-line EOD strip appears below the CycleCard:

> *"Day complete · 5/6 closed · 1 skipped · 2 reflections pending [Capture reflection →]"*

Capture CTA opens the existing `ReflectionSheet` for the oldest pending reflection via existing flow. Strip suppresses on empty / infeasible / loading states; CTA suppresses when zero reflections pending.

### Strategic outcome
Daily ritual bookend structurally complete — morning bridge IN (C-UX-10, Iteration 14), end-of-day strip OUT (C-UX-3, this iteration). Today no longer closes cold. The convergent UX gap from Iteration 12 synthesis is now closed.

### Backlog updates
- C-UX-3 → **DONE**.
- New top OPEN tier (all score 13): C-UX-6 (modal focus traps), C-UX-8 (action-button aria-labels), C-AN-1 (top-of-funnel events).
- C-PM-4 (End-of-day reflection prompt, score 12) — overlaps significantly with C-UX-3; recommend marking DONE-BY-PROXY in next governance pass.

### Spec deviations
Zero.

### Meta-coordinator trigger
Per CLAUDE.md, meta-coordinator should run every 3 completed improvement loops. Iterations 13, 14, 15 are now complete — trigger met. Recommend evaluating: scoring weights (Iteration 14 bundled 3 score-11/12/13 items successfully), bundling discipline ("ONE item per loop" interpreted as "one coherent feature shipment" worked for Iteration 14), Define-phase ROI (3 Define artifacts produced 1.5h implementation vs 6h estimate), candidate generation patterns (governance backfill of 2 missed convergent findings worked smoothly).

---

## Iteration 14 — 2026-04-27 — CadencePlan Today v1: Morning Recap + Why Chip + BalanceMeter Rename (C-UX-10 + C-UX-12 + C-UX-13)

### What changed
- **3 Define-phase artifacts** (831 lines) responding to Phil's 14-module CadencePlan product brief, bounded to Today:
  - `PRD_CADENCEPLAN_TODAY.md` (269 lines, product-manager) — triage of all 14 brief modules; 3 ALREADY-COVERED, 0 IN-SCOPE-TODAY-MVP (no §4.1 changes), 4 IN-SCOPE-TODAY-POST-MVP, 4 IN-SCOPE-CROSS-PAGE, 1 DEFERRED, 4 EXCLUDED.
  - `ARCHITECTURE_DELTA_CADENCEPLAN.md` (353 lines, system-architect) — concluded ~85% of brief surface already built; recommendation PROCEED-WITH-DESCOPE.
  - `UX_DELTA_CADENCEPLAN_TODAY.md` (209 lines, ux-designer) — aesthetic option (c) hybrid (Linear precision + Sunsama calmness); color option (c) keep T1 hex, rename labels only.
- **Strong cross-agent convergence** on 4 strategic conflicts: (1) bucket colors → keep T1 freeze, rename labels only; (2) drag-and-drop → reject (Iteration 12 anti-pattern verdict honored); (3) stack → vanilla; (4) scope → Today-only.
- **2 new components**:
  - `js/ui/components/MorningRecap.js` (49 lines) — renders one-line strip ("Yesterday: 5/6 closed · 1 skipped" or "fresh start today"); suppresses on day 0 or no prior-day data within 7 days.
  - `js/ui/components/WhyThisPlan.js` (119 lines) — collapsible plan-rationale chip reading `composition.composerInputsSnapshot.explain`; rule-grouped display in canonical order (R1 Non-optional anchors → R2 Carry-overs → R3 Kaizen-aligned → R4 Phase ceremony → R5 Deep payload → R6 CI rotation → R7 Comm slots → R9 Relaxed); aria-expanded.
- **`bucketMeta` extended**: `BUCKET_LABELS_LONG = {PROJECT: 'Deep Work', COMMUNICATION: 'Communication', CI: 'Improvement'}` added; `.labelLong` field on return shape.
- **`BucketStrip` relabeled**: now displays "Deep Work / Communication / Improvement" instead of "PROJECT / COMMUNICATION / CI". CSS classes (`bucket-row.bucket-project`, `chip-project`, etc.) unchanged — T1 freeze respected.
- **`Today` page updated**: `MorningRecap` renders above `RhythmExplainer` in all 3 render branches (empty / infeasible / proposed-or-active); `WhyThisPlan` renders above `CycleCard` for proposed/accepted/edited (non-edit-mode) states only.
- **`app.js` updated**: added `computePriorDayRecap()` helper that scans up to 7 days back for most recent Composition with closed/skipped activities; added `whyPlanExpanded` state; added `TOGGLE_WHY_PLAN` action handler.
- **2 new test files** (275 lines, 70 new tests):
  - `tests/ui/components/MorningRecap.test.js` (107 lines)
  - `tests/ui/components/WhyThisPlan.test.js` (168 lines)
- **Updated existing tests**: `bucketMeta.test.js` extended for `.labelLong` field; `BucketStrip.test.js` label assertions updated; `Today.test.js` added integration tests for the 3 new behaviors.

### Why
User asked to "revisit the today page to incorporate a design and plan based on" a 14-module CadencePlan product brief. Treated as Define-phase intake (precedent: Iteration 9 PRD intake of similar 14-pt scheduling brief). All 3 agents converged on a small additive package that ships the brief's highest-leverage Today ideas without churning T1 tokens or violating Iteration 12 anti-pattern verdicts. User selected "Path A then B" — Iteration 14 ships Package A (3 items: morning recap + why chip + balance meter rename); Iteration 15 will add C-UX-3 EOD closure ritual.

### Architectural insight
Architect found that the brief's "Why this plan?" feature is already 95% implemented in the composer engine — `composeDaily.js` emits a structured `why[]` rationale array (line 263) which is persisted at `Composition.composerInputsSnapshot.explain` (line 661). The remaining 5% was Today.js rendering. C-UX-12 became a render-only fix instead of a composer change.

### Impact
- **Test suite**: 2,681 → **2,751 passing** (+70). 0 failing. 651 suites. Runtime **1.88s** (46% headroom under 3.5s budget).
- **All 16 acceptance criteria** (AC10-1..5 + AC12-1..5 + AC13-1..6) PASS, no descopes.
- **Integrity preserved**: composer, domain types, event bus, persistence layer all untouched (verified via `git diff --name-only`).
- **T1 token freeze respected**: zero new CSS token definitions added (verified via grep).
- **BucketStrip CSS classes unchanged**: 46 T1 visual-regression tests still passing.
- **Time spent**: ~1.5-2h actual vs ~6h estimate. Define-phase rigor + clean architectural separation = sub-3× efficiency.

### User-visible changes after deploy
1. **Morning recap strip** above the rhythm explainer ("Yesterday: 5/6 closed · 1 skipped") — appears when prior-day data exists within 7 days; suppresses on day 0 or older.
2. **"Why this plan?" disclosure chip** near CycleCard header on proposed/accepted/edited cycles — click to expand and see the composer's rule-grouped rationale.
3. **BucketStrip labels** change from "PROJECT / COMMUNICATION / CI" (internal jargon) to "Deep Work / Communication / Improvement" (user-friendly). Same colors, same data, friendlier vocabulary.

### Backlog updates
- C-UX-10 → **DONE** (top-ranked score 14 OPEN item, now closed).
- C-UX-12 → **DONE**.
- C-UX-13 → **DONE**.
- New top OPEN tier (all score 13): C-UX-6 (modal focus traps), C-UX-8 (action-button aria-labels), C-AN-1 (top-of-funnel events).
- Iteration 15 queued: C-UX-3 (EOD closure ritual) per user's "a then b" sequencing.

### Spec deviations
Zero.

---

## Iteration 13 — 2026-04-27 — T1 Bucket-Tone Token Consolidation (C-UX-1)

### What changed
- **Define-phase artifact** `T1_TOKEN_SPEC.md` (244 lines) — system-architect produced a build-ready spec with 5 user-approved MVP scope decisions. Spec recommended PROCEED; user signed off before build dispatch.
- **New file** `js/ui/bucketMeta.js` (89 lines) — pure helper `bucketMeta(bucket)` returning `{bucket, chipClass, dotClass, label, vars: {bg, fg, fill}}`. Consolidates 4 previous derivation sites (3 JS maps + 1 inline ternary) into a single source of truth. Back-compat exports `BUCKET_CHIP_CLASS`, `BUCKET_DOT_CLASS`, `BUCKET_LABELS` via `Object.freeze({...})`.
- **CSS token rename**: `--color-primary` → `--accent-primary` (and `-contrast` variant) at all 3 `var()` call-sites. Resolves the Sprint 13 conflict with `:root --primary: #0f172a`. Hex values unchanged.
- **UpNextRail class rewrite**: `.up-next-dot-{project|communication|ci}` → compound `.up-next-dot.chip-{bucket}`. Aligns with every other bucket-tinted surface. JS now emits `<span class="up-next-dot chip-project">` so `bucketMeta().dotClass` reuses the chip token.
- **New `@media (forced-colors: active)` block** covering 18 selectors with `Mark`/`MarkText`/`CanvasText` system colors. WCAG forced-colors compliance for Windows High Contrast mode.
- **Migrated components**: `ScheduledActivityBlock.js`, `WeekGrid.js`, `UpNextRail.js`, and `Week.js` all import `bucketMeta` and removed their local lookup tables. Each now calls `bucketMeta(bucket).chipClass` (or `.dotClass`).
- **New tests** `tests/ui/bucketMeta.test.js` (150 lines, unit) and `tests/ui/bucketMeta.regression.test.js` (265 lines, component-level visual-regression locks for SAB / WeekGrid / UpNextRail / Week page + 6 CSS structural assertions).
- **Updated** `tests/ui/components/UpNextRail.test.js` — 3 assertions migrated from `up-next-dot-project` to `up-next-dot chip-project` per spec §8 step 6.

### Why
Iteration 12's 7-lens UX review identified T1 as the **prerequisite** for T2–T10 cross-page theme work. Three independent bucket→class maps plus 1 inline ternary would silently diverge under any cross-page visual pass. Sprint 13 introduced `--color-primary: #2563eb` that conflicted with the existing `:root --primary: #0f172a`. WCAG forced-colors mode was unhandled. CLAUDE.md selection bias #1 ("determinism improvements") and #2 ("traceability improvements") both apply — token consolidation removes a class of silent drift.

### Spec scope decisions (user-approved)
1. **Naming policy Option A** — keep `--primary` and `--project-*` / `--communication-*` / `--ci-*`; rename only the conflicting `--color-primary` → `--accent-primary`. Lowest churn.
2. **`bucketMeta()` API** — single pure function with `{bucket, chipClass, dotClass, label, vars}` shape; UNKNOWN fallback for null/unknown buckets.
3. **Forced-colors block** — 18 selectors covered, `Mark`/`MarkText`/`CanvasText` system colors.
4. **Visual regression locking** — 14 component-level class-string assertions + 6 CSS structural assertions before refactor lands.
5. **UpNextRail class rename** — compound `.up-next-dot.chip-{bucket}` aligns with every other bucket-tinted surface.

### Impact
- **Test suite**: 2,635 → **2,681 passing** (+46). 0 failing. 632 suites. Runtime **1.86s** (47% headroom under 3.5s budget).
- **All 8 acceptance criteria** (AC1–AC8) PASS, no descopes invoked.
- **AC6 verification**: `app.css:296-342` (BucketStrip canonical pattern) byte-identical via git-diff line-range scan.
- **AC1 verification**: grep for `BUCKET_CHIP_CLASS = {` literal returns 0 in `js/`.
- **AC4 verification**: grep for `@media (forced-colors: active)` in `app.css` returns 1.
- **AC7 verification**: grep for `--color-primary` in `app.css` returns 0.
- **AC8 verification**: grep for `up-next-dot-project|up-next-dot-communication|up-next-dot-ci` in `app.css` and `js/` returns 0.
- **Time spent**: ~1h actual vs 5.5h estimate. Spec rigor + advance reconnaissance compounded into a faster build.
- **Strategic outcome**: T1 prerequisite landed. Iterations 14+ can apply themes T2–T10 to Week / InsightsPortfolio / Portfolio / Kaizen / Catalog without painting on cracked tokens.

### Backlog updates
- C-UX-1 → **DONE**.
- New top OPEN tier (all score 13): C-UX-6 (modal focus traps), C-UX-8 (action-button aria-labels), C-AN-1 (top-of-funnel events). All a11y/measurement work, all S effort.
- Cross-page application path: Iteration 14 = apply T2–T10 to Week per `UX_DELTA_OTHER_PAGES.md` recommended sequencing.

### Spec deviation (1 minor)
Spec §5 described renaming `--color-primary: #2563eb;` from a `:root` block, but `app.css` had no `:root` definition for `--color-primary` — the token existed only as inline `var(--color-primary, #2563eb)` fallback values. Implementer correctly applied the rename to all 3 `var()` call-sites. No functional behavior change. Documented in implementer report.

---

## Iteration 12 — 2026-04-27 — Cross-Page UX Review (Define phase)

### What changed
- **9 Define-phase artifacts** (1,766 lines) produced by 8 specialist agents in parallel + synthesis:
  - `UX_REVIEW_TODAY_DESIGN.md` (ux-designer, 217 lines)
  - `UX_REVIEW_TODAY_PRODUCT.md` (product-manager, 137 lines)
  - `UX_REVIEW_TODAY_FRONTEND.md` (frontend-engineer, 136 lines)
  - `UX_REVIEW_TODAY_QA.md` (qa-engineer, 148 lines)
  - `UX_REVIEW_TODAY_GROWTH.md` (growth-strategist, 143 lines)
  - `UX_REVIEW_TODAY_ANALYTICS.md` (analytics, 246 lines)
  - `UX_REVIEW_TODAY_COMPETITIVE.md` (competitive-researcher findings persisted by coordinator, 125 lines)
  - `UX_DESIGN_THEMES.md` (ux-designer synthesis, 228 lines)
  - `UX_DELTA_OTHER_PAGES.md` (ux-designer synthesis, 386 lines)
- **9 new candidates** added to `IMPROVEMENT_BACKLOG.md`: C-UX-1 through C-UX-9 plus C-AN-1. Backlog now has 17 ranked OPEN items.
- **No code changes.** Suite remains 2,635 / 0 / 1.83s.

### Why
User asked for a multi-lens review of Today's UX with cross-page applicability. Treated as Define-phase orchestration, not implementation. The 7-lens parallel review (UX, PM, frontend, QA, growth, analytics, competitive) ensured no single perspective dominated the synthesis.

### The 10 canonical Design Themes (synthesis output)
T1 Bucket-Tone Token Consistency · T2 Stateful Card Chrome · T3 Closure Ritual · T4 Anchor + Secondary Affordance · T5 Empty-State Warmth Ladder · T6 Drawer Pattern · T7 Page Header Trio · T8 Modal Focus-Trap · T9 Day-Band Onboarding Cadence · T10 Now / Up-Next Discipline.

### Convergent findings (≥4 lenses agreed)
1. EOD closure ritual missing (PM, Growth, Competitive, Analytics)
2. Morning yesterday-recap missing (Growth, Competitive, PM, Design)
3. Bucket-tone token drift (Design, Frontend, QA)
4. Action-button aria-label gap (Design, QA, Frontend)
5. NowPane / UpNextRail duplication (Design, PM, Frontend)
6. Top-of-funnel events missing (Analytics, Growth)
7. AdherenceDial punitive when null (Growth, Design, Competitive)

### Cross-page sequencing recommendation
Week → InsightsPortfolio → Portfolio → Kaizen → Catalog. Estimated 3 implementation loops × ~16-20h = ~50h at BAM 24h/week capacity.

### Process learning
7-lens parallel review produced higher-quality candidates than the single-PM-pass model used in Iteration 9. Convergent-finding signal (≥4 lenses agreeing) maps reliably to score-13 candidates. Recommendation written into `IMPROVEMENT_BACKLOG.md`: when a backlog feels stale (>6 weeks without refresh), trigger a multi-lens review pass.

### Backlog updates
- 9 new candidates: C-UX-1 (T1 tokens, score 12, **PREREQUISITE**), C-UX-2 (BucketStrip blackout, 11), C-UX-3 (Closure ritual, 12), C-UX-4 (Empty-state ladder, 11), C-UX-5 (Page header trio, 8), C-UX-6 (Modal focus trap, 13), C-UX-7 (Now/UpNext dedupe, 11), C-UX-8 (Action button aria, 13), C-UX-9 (Day-band copy, 10).
- 1 new analytics candidate: C-AN-1 (Top-of-funnel events, 13).

### Recommended next iteration
**Iteration 13: C-UX-1 (T1 Bucket-Tone Token Consolidation)** — prerequisite for T2–T10. Despite score 12 not being the highest, synthesis explicitly named it the foundation; every cross-page visual pass depends on it.

---

## Iteration 11 — 2026-04-27 — E14 Validated Kaizen Portfolio (C-PM-2)

### What changed
- **Define-phase artifact** `E14_PORTFOLIO_SPEC.md` (214 lines) — system-architect produced a build-ready spec with 5 user-approved MVP descope decisions. Spec recommended PROCEED-WITH-DESCOPE; user signed off before build dispatch.
- **New file** `js/services/validatedKaizenSelectors.js` (213 lines) — pure functions: `isValidatedKaizen`, `summarizeValidated`, `filterValidated`, `kaizensToCsv`, plus URL-sync helpers `parseFilterQuery` / `serializeFilterQuery`.
- **New file** `js/ui/pages/InsightsPortfolio.js` (281 lines) — analytics page rendered at `/#insights/portfolio`. Header shows count chips ("Validated: N · Showing M") and "Total Annual Benefits: $X" formatted via `Intl.NumberFormat`. Filter controls: closeKind toggle group, projectType toggle group, Lead select. Table renders one row per filtered Validated Kaizen with closeKind badge, delta, ROI, close date, and Finance-signed tag (when present). CSV export via `Blob` + `URL.createObjectURL` + transient `<a download>`. RFC 4180 minimal-quoting compliance.
- **New tests** `tests/services/validatedKaizenSelectors.test.js` (238 lines) and `tests/ui/pages/InsightsPortfolio.test.js` (247 lines) — 53 new tests across 15 new suites covering the predicate, summarize, filter, CSV serialize, parse/serialize URL filter helpers, and end-to-end page render including AC6 URL filter persistence and AC8 CSV-hostile title quoting.
- **Modified** `js/app.js` — single `else if` dispatch branch in `renderApp()` for `state.route === 'insights' && state.params?.sub === 'portfolio'`. Existing `insights` (no sub) continues resolving to `PlaceholderPage`.
- **Modified** `js/ui/router.js` — doc comment only.

### Why
E14 is `PRODUCT_BLUEPRINT §4.1` item 4 — a MVP must-have. The "validated Kaizen" claim is the product's most credible buyer-facing differentiator, and without a portfolio surface it could not be demonstrated end-to-end. Recon discovered most primitives (`ValidatedKaizenCard.js`, Portfolio.js Validated section, all required Kaizen domain fields) were already shipped in Sprint 8 P1-T4 — the actual gap was a dedicated analytics route with filters, counts, sum, and CSV export.

### MVP descope decisions (documented in spec §2; re-open triggers in §9)
1. **Validated predicate relaxed**: requires `CLOSED + (SUCCESS|PARTIAL) + !abandoned + remeasurement != null`. Drops "statistically-validated" requirement until E15 ships `Remeasurement.statisticallySignificant`.
2. **Finance-signed**: display-only tag using `roiProjections[last].financePartnerUserId`. Not a filter. Re-opens when a Finance co-sign workflow lands.
3. **Sponsor filter**: dropped. Substituted with **Lead filter** (`implementationLeadUserId`). Re-opens if Kaizen entity gains a `sponsorUserId` field.
4. **Route choice**: Option A — new `/#insights/portfolio` route reusing existing primitives. `/portfolio` Validated section untouched.
5. **CSV contract**: `Blob` download, filename `validated-kaizens-YYYY-MM-DD.csv`, RFC 4180 minimal quoting.

### Impact
- **Test suite**: 2,582 → **2,635 passing** (+53). 0 failing. 620 suites. Runtime **2.61s** — under the 3.5s budget with 25% headroom.
- **All 10 acceptance criteria** (AC1–AC10) PASS, no descopes invoked at build time.
- **AC7 verification**: `git diff --name-only` confirms `Portfolio.js` and `ValidatedKaizenCard.js` are untouched.
- **R1/R2 risks resolved**: dispatch landed cleanly in `renderApp()`; URL sync via `locationHash` prop injection from `globalThis.location.hash`.
- **MVP gap closed**: E14 now ✅ Shipped in epic coverage. Two MVP epics remain (E13, E18).

### Backlog updates
- C-PM-2 → **DONE**.
- New top OPEN candidates: C-PM-4 (end-of-day reflection prompt, score 12), C-SA-2 (`EDITED_FROM_PROPOSAL` variance writers, score 12), C-PM-5 (E18 ImplementationBacklog, score 10).

### Spec deviation (1 minor)
- 4 copy strings (`INSIGHTS_PORTFOLIO_TITLE`, `_EMPTY`, `_EXPORT_BUTTON`, `_SUM_LABEL`) co-located in `InsightsPortfolio.js` as `INSIGHTS_PORTFOLIO_COPY` rather than added to `js/ui/copy.js`. Justified: Portfolio.js was untouchable per AC7; co-locating strings with the consuming page is the cleaner pattern.

### TODO markers (only 2, both per spec §2.1)
- `validatedKaizenSelectors.js:8` — `TODO(E15)`: tighten predicate to require `remeasurement.statisticallySignificant === true` when E15 ships.
- `InsightsPortfolio.js:10` — `TODO(E15)`: surface statistically-significant badge when E15 ships.

---

## Iteration 10 — 2026-04-27 — Deterministic edit-mode IDs (C-SA-1)

### What changed
- **New file** `js/services/IdGeneratorService.js` (91 lines) — production class using `crypto.randomUUID()` with a monotonic-counter fallback; ships alongside a `createDeterministicIdGenerator(seed)` factory for tests.
- **API change** in `js/ui/editMode.js`: `activityFromCatalogEntry`, `applySwap`, and `applyAdd` now **require** an `idGenerator: function` parameter (Option A — no backwards-compat fallback). They throw `INVALID_ID_GENERATOR` on missing input.
- **Boot wiring** in `js/app.js`: `buildServices` now constructs and exposes `services.idGenerator`. Both edit-mode call sites (`applyAdd` line ~909, `applySwap` line ~940) thread the generator through.
- **New tests** `tests/services/IdGeneratorService.test.js` (107 lines, 13 tests covering replayability, uniqueness, prefix preservation, invalid-prefix rejection).
- **Updated tests** `tests/ui/editMode.test.js`, `tests/ui/editMode.userEdited.test.js` — all callers inject a deterministic generator; previous regex-prefix assertions (`/^sa_edit_/`) replaced with exact-id equality.

### Why
The architect candidate C-SA-1 (Priority Score 13) flagged `editMode.js:84` as the only place in the codebase still using `Date.now()` + `Math.random()` for ID minting — every other writer service explicitly forbids it. Edit-mode swaps were non-replayable from the event log, and existing tests asserted on regex prefixes (a hidden test seam). CLAUDE.md selection bias #1 is "determinism improvements"; this candidate matched directly.

C-SA-1 was selected after the originally-chosen Iteration 10 item (C-PM-3, "PROPOSED-state Kaizen chip", Priority Score 14) was disqualified at pre-implementation validation: the feature had already shipped in commit `32ed008` on 2026-04-23, predating the auto-memory note that flagged it. The Iteration 9 candidate-generation pass trusted stale evidence; future passes must grep current code before scoring "unshipped" claims.

### Impact
- **Test suite**: 2,565 → **2,582 passing** (+17). 0 failing. 605 suites. Runtime **2.14s** (was ~2.55s) — under the 3.5s budget with 39% headroom.
- **Determinism**: `grep` on `js/ui/editMode.js` for `Date.now\|Math.random` returns zero matches.
- **Audit-integrity blocker (P0)**: cleared.
- **Test seam**: closed — exact-id equality replaces regex-prefix assertions in 6+ test cases.

### Backlog updates
- C-PM-3 → **DONE** (validation: shipped in commit `32ed008`, 2026-04-23).
- C-SA-1 → **DONE** (this iteration).
- C-PM-1 → **BLOCKED-ON-E13** (no phase scaffolding to attach to until E13 lands).
- New top OPEN candidates: C-PM-2 (E14 portfolio), C-PM-4 (end-of-day reflection), C-SA-2 (`EDITED_FROM_PROPOSAL` writers).

### Process learning written into the loop
1. **Pre-implementation reconnaissance is mandatory.** The orchestrator's grep on `js/ui/components/{ScheduledActivityBlock,WeekGrid}.js` caught C-PM-3 as already-shipped before any code was written. Without that step, the loop would have produced a no-op refactor.
2. **Candidate generation must verify currency.** `IMPROVEMENT_BACKLOG.md` candidates that claim "X is unshipped" must include a grep timestamp or commit-SHA reference to prove the gap is real at scoring time.

---

## Iteration 9 — 2026-04-27 — Governance recovery

### What changed
- **New files**: `SYSTEM_HEALTH.md` (105 lines), `IMPROVEMENT_BACKLOG.md` (148 lines), `ITERATION_LOG.md` (105 lines).
- **Define-phase artifacts** (parallel orchestration on the same day): `PRD_SCHEDULING_ENGINE.md` (209 lines), `ARCHITECTURE_DELTA_E19_E21.md` (305 lines) — produced in response to Phil's 14-point scheduling-engine expansion proposal; both agents independently recommended deferring the expansion until E13/E14/E18 ship.

### Why
The improvement loop specified in `CLAUDE.md` (Improvement Loop Mode) requires a deterministic substrate of governance artifacts to operate. Prior to Iteration 9 the system had only sprint notes — no consolidated health view, no scored backlog, no iteration log. Path 1 of the recovery decision (MVP-first) was selected to bootstrap the substrate before resuming MVP-completion work.

### Impact
- **No code changes**, no test-suite delta. Suite remained at 2,565 / 0 / ~2.55s.
- **Process**: improvement loop now has a deterministic operating substrate. 11 evidence-anchored candidates scored. 8 historical sprints reconstructed in `ITERATION_LOG.md`.

---

## Pre-Iteration 9

Sprint-level granularity for Sprint 1 → Sprint 16a is preserved in `SPRINT_*_NOTES.md` files in the repo root. Key shipped milestones (chronological):

- **Sprint 16a** (`6887cab`) — `HH:MM–HH:MM` time-range labels on every activity block.
- **Sprint 15** (`5899061`) — Motion-style Week hour-grid + Now pane + auto re-plan.
- **Sprint 14** (`ec97751`) — Configurable start-time editing in Edit mode.
- **Sprint 13** (`c08b3c2`) — Duration chips on selected slot in Edit mode.
- **Sprints 11+12** (`14f8d82`) — Ship-ready polish + Today edit mode.
- **Sprint 10c** (`32ed008`) — `part of: [Kaizen]` chip on PROPOSED activity blocks.
- **Sprint 10b** (`1f1d0fd`) — Portfolio project cards + step actions + Week/Catalog cleanup.
- **Sprint 10a** (`ea328b6`) — Catalog rebucket + Portfolio project-type sub-buckets.
- **Sprint 9** (`f3694ea`) — Weekly composer + Week page + catalog `projectTypeBinding` filter.
- **Sprint 8** (`777016d`) — Kaizen close loop + HARD RULE enforcement.
- **Sprint 7** (`c60b96e`) — Project Portfolio + Opportunity intake + Catalog bucket view.
- **Sprint 6** (`a7282c6`) — Reflection + friction + Kaizen lifecycle (promote + baseline).
- **Sprint 5** (`d9215d4`) — Methodology + activity runtime + fine-tune + variance.
- **Sprint 4** (`8709201`) — E10 UI Shell — app browser-demoable.
- **Sprint 3** (`80d7082`) — `composeDaily` end-to-end + `validateComposition` + `canRebucket`.
- **Sprint 2** (`3addb15`) — Full catalog seed + `CatalogService` + `composeDaily` skeleton.
- **Sprint 1** (`dcca90c`) — Code aligned with `ARCHITECTURE` v0.6 (v0.5 + v0.6 drift).

For per-sprint detail (files touched, test deltas, deviations) see the corresponding `SPRINT_*_NOTES.md`.

---

_Maintainer: coordinator. Append a new top-level section per improvement loop iteration. Do not edit historical entries._
