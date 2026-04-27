# BAM-X Kaizen OS — Changelog

This file records meaningful product, architecture, and process changes per improvement-loop iteration. Sprint-level granularity prior to Iteration 9 is captured in `SPRINT_*_NOTES.md`. Loop-level granularity from Iteration 9 onward is captured here and in `ITERATION_LOG.md`.

Format: each iteration is a top-level section. Each entry states **what changed**, **why**, and **impact** (test counts, runtime, behaviour delta).

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
