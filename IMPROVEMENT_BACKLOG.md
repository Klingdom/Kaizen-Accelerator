# BAM-X Kaizen OS — Improvement Backlog

## Scoring Model

`Total = Impact + Strategic alignment + Learning value + Confidence − Effort − Risk`

All scores are integers on a 1–5 scale per dimension. Items are sorted descending by Total.

---

## Top Ranked (post-Iteration 12)

Iteration 12 (Define-phase cross-page UX review) added 9 new theme-derived candidates (`C-UX-*` and `C-AN-1`). The full review is in `UX_DESIGN_THEMES.md` and `UX_DELTA_OTHER_PAGES.md` plus 7 per-lens reviews.

| Rank | ID | Title | Type | Score | Status | 1-line problem |
|---|---|---|---|---|---|---|
| — | C-PM-3 | PROPOSED-state Kaizen chip | fix | 14 | **DONE** | Already shipped commit `32ed008` (validation failure caught Iteration 10). |
| — | C-SA-1 | Make `activityFromCatalogEntry` deterministic | fix | 13 | **DONE (Iteration 10)** | Shipped via `IdGeneratorService`. Suite 2,565→2,582. |
| — | C-PM-2 | `/insights/portfolio` MVP route (E14) | improvement | 13 | **DONE (Iteration 11)** | Shipped per spec. Suite 2,582→2,635. |
| — | C-PM-1 | ProjectPaceWarning visible signal | improvement | 13 | **BLOCKED-ON-E13** | Requires E13 phase logic; not started. |
| 1 | C-UX-6 | Modal focus-trap discipline (T8) | fix | 13 | OPEN | EditDrawer + FineTuneDrawer have no focus trap; WCAG §2.1.2 failure. (QA §2.) |
| 2 | C-UX-8 | Action-button aria-labels carry activity name (T7) | fix | 13 | OPEN | Start/Skip/Close on every block announce as bare verb, no context. WCAG §4.1.2. (QA §1.) |
| 3 | C-AN-1 | Top-of-funnel event instrumentation | improvement | 13 | OPEN | No `TodayPageViewed` / `AutoPlanButtonClicked`; redesign cannot be measured. (Analytics §3.) |
| 4 | C-PM-4 | End-of-day reflection prompt (T3) | improvement | 12 | OPEN | No EOD nudge; day-14 reflection rate target (≥75%) has no activation driver. **Theme T3.** |
| 5 | C-UX-1 | Bucket-tone token consolidation (T1) | improvement | 12 | OPEN | Sprint 13 `--color-*` tokens conflict with `:root` `--*` tokens; 3 independent bucket→class maps will drift. **Prerequisite for T2–T10.** (UX §4, Frontend §5–§6.) |
| 6 | C-UX-3 | Closure ritual + day-end strip (T3) | improvement | 12 | OPEN | Today closes cold; no "day complete" confirmation, no bridge to tomorrow. Convergent across PM, Growth, Competitive, Analytics. |
| 7 | C-SA-2 | Append `EDITED_FROM_PROPOSAL` Variance rows | fix | 12 | OPEN | Duration/start-time edits emit no append-only audit row. |
| 8 | C-QA-2 | `WeeklyComposerService.reflow` test coverage | fix | 12 | OPEN | Sprint 15 W5 deliverable has zero test references. |
| 9 | C-QA-3 | `formatTimeRange` DST-offset ISO test | improvement | 12 | OPEN | All fixtures use UTC `Z`; non-Z ISO input silently mis-displays. |
| 10 | C-UX-2 | BucketStrip blackout fix in edit mode (T2) | fix | 11 | OPEN | `today-editing` over-applies opacity 0.4 to BucketStrip — invariant feedback hidden during the edit that triggers it. (UX §IA failure.) |
| 11 | C-UX-4 | Empty-state warmth ladder (T5) | improvement | 11 | OPEN | Other pages have cold empty states (Week / Portfolio / Catalog / InsightsPortfolio); Today's `daysSinceSignupHint` is the model. |
| 12 | C-UX-7 | Now / Up-Next duplication fix (T10) | fix | 11 | OPEN | NowPane UPCOMING + UpNextRail row 1 surface the same activity simultaneously. (UX §4, Frontend §4.) |
| 13 | C-SA-3 | Collapse duplicated protected-block lists | improvement | 11 | OPEN | `editMode.js` hardcodes lists that mirror but are not derived from `composeDaily.js`. |
| 14 | C-PM-5 | `ImplementationBacklog` first-class entity (E18) | improvement | 10 | OPEN | E18 MVP must-have; Kaizen actions remain a JSON blob. |
| 15 | C-QA-1 | A11y assertions on WeekGrid + UpNextRail | improvement | 10 | OPEN | Existing components have aria-labels but no test assertions on them. |
| 16 | C-UX-5 | Page header trio standardization (T7) | improvement | 8 | OPEN | Every page has bespoke header; no shared `<h1>` + status + primary-action contract. Touches all 5 pages. |
| 17 | C-UX-9 | Day-band onboarding cadence (T9) | improvement | 8 | OPEN | Only days 0–1 / 2–6 / 7+ have copy; days 14 / 21 / 30 / 60 / 90 missing. |

### Loop Process Notes (Iteration 10 learning)

Iteration 9's candidate-generation pass produced two stale candidates (C-PM-3 already-shipped, C-PM-1 blocked-on-prerequisite). Future candidate generation MUST grep against `js/` and `git log` to confirm the gap is real before scoring.

### Loop Process Notes (Iteration 12 learning)

The Define-phase 7-lens parallel review produced higher-quality candidates than the single-PM-pass model used in Iteration 9. Convergent-finding signal (≥4 lenses agreeing) maps reliably to score-13 candidates. Recommendation: when a backlog feels stale (>6 weeks without refresh), trigger a multi-lens review pass rather than a single-agent regeneration.

---

## Full Candidate Detail

### C-PM-3: Surface a PROPOSED-state Kaizen chip in the composer and KaizenCard
- **Status: DONE** (validation failure caught in Iteration 10 — feature already shipped 2026-04-23)
- Type: fix
- Problem (as scored): Sprint 10 P0 backlog flagged a PROPOSED-state Kaizen chip as unshipped.
- **Resolution**: Shipped in commit `32ed008` *"Today: render 'part of: [Kaizen]' chip on PROPOSED activity blocks"*. Both `js/ui/components/ScheduledActivityBlock.js:16` and `js/ui/components/WeekGrid.js:96-101` render the chip across all states including PROPOSED. Test file `tests/ui/components/ScheduledActivityBlock.kaizenChip.test.js` (97 lines, +8 tests) covers the contract.
- **Loop learning**: Auto-memory note + Sprint 9 evidence were stale. Candidate-generation must grep current code before scoring "unshipped" claims.
- Original score: Impact 4 / Strategic 5 / Learning 2 / Confidence 5 / Effort 1 / Risk 1 = 14

### C-PM-1: Expose ProjectPaceWarning as a visible in-product signal on KaizenCard
- **Status: BLOCKED-ON-E13** (reclassified in Iteration 10)
- Type: improvement
- Problem: ProjectPaceWarning specified in E13 + carried as Sprint 10 P2 but unshipped. 30-Day Accelerator users have no signal when a phase exceeds target duration.
- Expected benefit: Non-blocking phase-pace warning on active KaizenCard.
- Evidence: DELIVERY_PLAN.md E13; auto-memory Sprint 10 P2.
- **Blocker**: E13 (Accelerator phase logic) is 🔴 not started per SYSTEM_HEALTH. ProjectPaceWarning has no phase-FSM scaffolding to attach to. Re-open this candidate when E13 lands.
- Impact 4 / Strategic 5 / Learning 3 / Confidence 4 / Effort 2 / Risk 1
- Total: 13

### C-PM-2: Ship /insights/portfolio MVP route (E14 — Validated Kaizen Portfolio)
- **Status: DONE (Iteration 11, 2026-04-27)**
- Type: improvement
- Problem: E14 was MVP must-have but unshipped. No view surfaced validated portfolio after a successful close.
- **Resolution**: Built per `E14_PORTFOLIO_SPEC.md` (system-architect, 214 lines, user-approved). New `js/services/validatedKaizenSelectors.js` (213 lines, 4 named exports) + `js/ui/pages/InsightsPortfolio.js` (281 lines). Route lives at `/#insights/portfolio`. Filters: closeKind, projectType, Lead. CSV export via `Blob` (RFC 4180 quoting). Counts: Validated universe + post-filter showing + sum of annualBenefitsDollars. Suite 2,582 → 2,635 (+53). All 10 acceptance criteria PASS, no descopes invoked. `Portfolio.js` and `ValidatedKaizenCard.js` untouched (AC7).
- **MVP descopes documented in spec §2** (re-open triggers in §9): relaxed Validated predicate (no statistical-validation requirement until E15); Finance-signed as display-only tag (no Finance co-sign workflow yet); sponsor filter replaced with Lead filter (no `sponsor` field on Kaizen entity).
- Evidence at scoring time: DELIVERY_PLAN.md line 32; PRODUCT_BLUEPRINT §4.1 item 4.
- Impact 5 / Strategic 5 / Learning 4 / Confidence 4 / Effort 3 / Risk 2
- Total: 13

### C-SA-1: Make editMode.activityFromCatalogEntry deterministic by injecting clock + id-generator
- **Status: DONE (Iteration 10, 2026-04-27)**
- Type: fix
- Problem: js/ui/editMode.js:84 minted ids via Date.now() + Math.random(); other writer services explicitly forbid this. Edit-mode swaps were non-replayable from event log.
- **Resolution**: New `IdGeneratorService` (91 lines) follows existing `ClockService` injection pattern. `activityFromCatalogEntry`, `applySwap`, `applyAdd` now require an `idGenerator: function` parameter; throw `INVALID_ID_GENERATOR` on missing. Boot wiring in `js/app.js` provides production generator (`crypto.randomUUID()` with monotonic-counter fallback). Tests use `createDeterministicIdGenerator(seed)` factory. Suite 2,565 → 2,582 (+17). Zero `Date.now` / `Math.random` matches in `editMode.js`.
- Evidence at scoring time: js/ui/editMode.js:84.
- Impact 4 / Strategic 5 / Learning 3 / Confidence 5 / Effort 2 / Risk 2
- Total: 13

### C-PM-4: Add a first-run reflection prompt at end-of-day (activation gap)
- Status: OPEN
- Type: improvement
- Problem: PRODUCT_BLUEPRINT §7.3 launch metric requires ≥1 reflection on each of 7 days within day 14; no end-of-day reflection prompt currently surfaces.
- Expected benefit: Time-triggered nudge increases day-14 reflection rate toward ≥75%.
- Evidence: PRODUCT_BLUEPRINT §7.3; SPRINT_11_NOTES Pass 11c.
- Impact 4 / Strategic 4 / Learning 4 / Confidence 3 / Effort 2 / Risk 1
- Total: 12

### C-SA-2: Append Variance{kind:'EDITED_FROM_PROPOSAL'} rows for in-place duration/start-time edits
- Status: OPEN
- Type: fix
- Problem: editMode.js EDIT_CHANGE_DURATION/START_TIME mutate state with userEdited:true, but ComposerService.commitEdit only emits swap-shaped variances. Pure tweaks land with no append-only audit row.
- Expected benefit: Restores traceability from CycleEdited to per-slot Variance evidence; unblocks E14 metrics.
- Evidence: js/domain/types.js:174 declares EDITED_FROM_PROPOSAL; grep shows zero writers of that kind.
- Impact 4 / Strategic 5 / Learning 3 / Confidence 4 / Effort 2 / Risk 2
- Total: 12

### C-QA-2: WeeklyComposerService.reflow has no test coverage
- Status: OPEN
- Type: fix
- Problem: SPRINT_15_NOTES documents WeeklyComposerService.reflow as W5 deliverable; tests/services/WeeklyComposerService.test.js has zero references to reflow. ACCEPTED no-op + lastReflowedAt invariants untested.
- Expected benefit: Dedicated test file catches breaking changes before production.
- Evidence: tests/services/WeeklyComposerService.test.js (zero matches); SPRINT_15_NOTES line 108.
- Impact 4 / Strategic 4 / Learning 3 / Confidence 5 / Effort 2 / Risk 2
- Total: 12

### C-QA-3: formatTimeRange has no DST-offset ISO input test
- Status: OPEN
- Type: improvement
- Problem: tests/ui/timeFormat.test.js tests against UTC Z and bare HH:MM, never a non-UTC offset like 2026-03-29T09:00:00+01:00. formatTime calls new Date(iso) + getUTCHours, so a non-Z ISO silently mis-displays.
- Expected benefit: Test confirms UTC-only contract or exposes display bug before DST-edge users hit it.
- Evidence: js/ui/timeFormat.js:29-32; tests/ui/timeFormat.test.js (all ISO fixtures end Z).
- Impact 3 / Strategic 3 / Learning 4 / Confidence 4 / Effort 1 / Risk 1
- Total: 12

### C-SA-3: Collapse duplicated protected-block lists into a single composer-owned source of truth
- Status: OPEN
- Type: improvement
- Problem: editMode.js:24-49 hardcodes PROTECTED_CATALOG_IDS / NAMES / SLOT_KINDS that mirror but are not derived from composeDaily.js's DAILY_NON_OPTIONAL_SET. Renames silently desync.
- Expected benefit: One FSM-correctness boundary; eliminates quiet drift.
- Evidence: js/ui/editMode.js:33.
- Impact 3 / Strategic 4 / Learning 3 / Confidence 5 / Effort 2 / Risk 2
- Total: 11

### C-PM-5: Implement ImplementationBacklog entity as a first-class record (E18 foundation)
- Status: OPEN
- Type: improvement
- Problem: E18 is MVP must-have powering Sustainment Gate (Kaizen 90) and Phase 3→4 strategic-veto (Accelerator). Currently Kaizen actions are a JSON blob.
- Expected benefit: First-class entity unblocks E17 + E13 Phase 3→4 guard.
- Evidence: DELIVERY_PLAN.md line 36.
- Impact 5 / Strategic 5 / Learning 3 / Confidence 4 / Effort 4 / Risk 3
- Total: 10

### C-QA-1: A11y assertions missing on WeekGrid blocks and UpNextRail
- Status: OPEN
- Type: improvement
- Problem: WeekGrid.js emits aria-labels but tests/ui/components/WeekGrid.test.js has zero aria-label assertions on .wg-block; UpNextRail's <aside aria-label="Up next"> never asserted.
- Expected benefit: Lock aria contracts for newest Sprint 15 components.
- Evidence: tests/ui/components/WeekGrid.test.js (zero aria-label matches); js/ui/components/UpNextRail.js:167.
- Impact 3 / Strategic 3 / Learning 2 / Confidence 5 / Effort 2 / Risk 1
- Total: 10

---

## Status Legend

| Status | Meaning |
|---|---|
| OPEN | Not yet selected for a loop iteration |
| IN_PROGRESS | Currently being implemented in active sprint |
| DONE | Shipped and validated; logged in ITERATION_LOG |
| BLOCKED-ON-{X} | Cannot proceed until prerequisite X ships |
| DEFERRED | Explicitly postponed; requires a recorded reason |

---

_Generated: 2026-04-27. Last updated after Iteration 12 (Define-phase cross-page UX review)._

## Iteration 12 New Candidates — Detail

### C-UX-1: Bucket-tone token consolidation (Theme T1)
- Status: OPEN
- Type: improvement
- Problem: `app.css` has both `--primary: #0f172a` (`:root`) and `--color-primary: #2563eb` (Sprint 13 chip rules). Three independent bucket→CSS-class maps in `ScheduledActivityBlock.js`, `UpNextRail.js`, and `EditDrawer.js` will silently drift under any visual pass. WCAG forced-colors mode unhandled.
- Expected benefit: Single source of truth for bucket tone; prerequisite for T2–T10. Cross-page visual consistency.
- Evidence: UX §4 (token split), Frontend §5–§6 pattern 1, QA §8 pattern 7.
- Impact 4 / Strategic 5 / Learning 3 / Confidence 5 / Effort 3 / Risk 2
- Total: 12
- **Note: PREREQUISITE for any cross-page visual theme work. Should run as Iteration 13 even though score is not the highest.**

### C-UX-2: BucketStrip blackout fix in edit mode (Theme T2)
- Status: OPEN
- Type: fix
- Problem: `app.css:1519–1527` `.today-editing .cycle-card:not(.cycle-editing)` applies `opacity: 0.4; pointer-events: none` to the BucketStrip — exactly when the user needs to watch bucket totals respond to swap choices.
- Expected benefit: Functional IA fix; users see invariant feedback during the action that most triggers it.
- Evidence: UX §IA failure §4 (most urgent).
- Impact 3 / Strategic 3 / Learning 2 / Confidence 5 / Effort 1 / Risk 1
- Total: 11

### C-UX-3: Closure ritual / day-end strip (Theme T3)
- Status: OPEN
- Type: improvement
- Problem: Today closes cold. No "day complete" confirmation, no pending-reflection nudge, no bridge to tomorrow. Convergent across 4 lenses.
- Expected benefit: Closes the daily habit loop; drives day-14 reflection rate toward ≥75% target.
- Evidence: PM §3 (C-PM-4), Growth §3 HR-3 / §7 rank 2, Competitive §3 pattern 4 / §6 rank 4, Analytics §3 step 9.
- Open question: Is `lastActivityEndsAt` derivable from existing composition data?
- Impact 5 / Strategic 5 / Learning 4 / Confidence 3 / Effort 3 / Risk 2
- Total: 12

### C-UX-4: Empty-state warmth ladder (Theme T5)
- Status: OPEN
- Type: improvement
- Problem: Today has `daysSinceSignupHint` but Week / Portfolio / Catalog / InsightsPortfolio empty states are cold one-liners.
- Expected benefit: Day-band copy across all 5 pages; consistent warmth ladder.
- Evidence: Growth §6, UX §8 theme 5, Competitive §6 (yesterday recap pattern).
- Impact 3 / Strategic 4 / Learning 3 / Confidence 4 / Effort 2 / Risk 1
- Total: 11

### C-UX-5: Page header trio standardization (Theme T7)
- Status: OPEN
- Type: improvement
- Problem: Every page has bespoke header structure; no shared contract for `<h1>` + status signal + primary action. Today empty state is missing `<h1>`.
- Expected benefit: Consistent landing structure; resolves a11y missing-h1 gap.
- Evidence: Frontend §6 pattern (PageHeader extraction L cost), QA §1, UX §8 theme 8.
- Impact 3 / Strategic 4 / Learning 2 / Confidence 4 / Effort 3 / Risk 2
- Total: 8

### C-UX-6: Modal focus-trap discipline (Theme T8)
- Status: OPEN
- Type: fix
- Problem: `EditDrawer` and `FineTuneDrawer` do not implement focus traps; Tab escapes both into dimmed background.
- Expected benefit: WCAG §2.1.2 compliance; SR users can navigate dialogs predictably.
- Evidence: QA §2 (worst a11y gap secondary).
- Impact 4 / Strategic 4 / Learning 3 / Confidence 5 / Effort 2 / Risk 1
- Total: 13

### C-UX-7: Now / Up-Next duplication fix (Theme T10)
- Status: OPEN
- Type: fix
- Problem: NowPane UPCOMING and UpNextRail row 1 surface the same activity simultaneously; on mobile a third surface appears. `selectUpNext` computed twice per render.
- Expected benefit: Cleaner IA; one canonical "coming up" surface; render-cost reduction.
- Evidence: UX §4 / §7 improvement 1, Frontend §4.
- Impact 3 / Strategic 3 / Learning 2 / Confidence 5 / Effort 1 / Risk 1
- Total: 11

### C-UX-8: Action-button aria-labels carry activity name (Theme T7)
- Status: OPEN
- Type: fix
- Problem: Start, Close, Skip buttons on every `ScheduledActivityBlock` carry no activity name in their `aria-label`. Screen reader announces bare "Start button" with no context.
- Expected benefit: WCAG §4.1.2 compliance; SR users can distinguish per-activity actions.
- Evidence: QA §1 (worst a11y gap on Today), UX §7 improvement 7, Frontend §6.
- Impact 4 / Strategic 4 / Learning 2 / Confidence 5 / Effort 1 / Risk 1
- Total: 13

### C-UX-9: Day-band onboarding cadence (Theme T9)
- Status: OPEN
- Type: improvement
- Problem: `daysSinceSignupHint` only covers days 0–1 / 2–6 / 7+. Recommended bands: 0 / 1 / 3 / 7 / 14 / 21 / 30 / 60 / 90 each tied to a Blueprint §7.x milestone.
- Expected benefit: Lifecycle-aware copy; sustained engagement past day 14.
- Evidence: Growth §9, UX §8 theme 9.
- Impact 3 / Strategic 4 / Learning 3 / Confidence 3 / Effort 2 / Risk 1
- Total: 10

### C-AN-1: Top-of-funnel event instrumentation
- Status: OPEN
- Type: fix
- Problem: No `TodayPageViewed` event; no `AutoPlanButtonClicked` event. Today funnel has no step-1 / step-2 denominator. A UX redesign that changes CTA placement cannot be measured.
- Expected benefit: Measurable redesign; baseline N captured before any visual change ships.
- Evidence: Analytics §3, §5 gaps 1–2.
- Impact 4 / Strategic 4 / Learning 4 / Confidence 5 / Effort 2 / Risk 2
- Total: 13

---

_Last updated 2026-04-27 after Iteration 12. Next loop trigger: coordinator recommends C-UX-1 (T1 token consolidation) as Iteration 13 — prerequisite for cross-page theme application even though score is tied with multiple peers. Awaiting Phil go-ahead._
