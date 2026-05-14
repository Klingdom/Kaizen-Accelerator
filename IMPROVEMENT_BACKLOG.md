# BAM-X Kaizen OS — Improvement Backlog

## Scoring Model

`Total = Impact + Strategic alignment + Learning value + Confidence − Effort − Risk + ConvergenceBonus`

Where `ConvergenceBonus = min(3, max(0, lens_count − 1))`:
- 1 lens → +0 (ordinary single-perspective candidate)
- 2 lenses → +1
- 3 lenses → +2
- 4+ lenses → +3 (cap)

All base scores are integers on a 1–5 scale per dimension. Items are sorted descending by Total.

**Score-13 gate**: No candidate may be scored ≥ 13 unless ≥ 3 lenses have independently evaluated it. Single-lens candidates that compute Total ≥ 13 by formula are capped at 12 until multi-lens evaluation lands.

**Required candidate fields** (per coordinator.md §3): Title · Type · Problem · Expected benefit · Evidence · Impact · Strategic · Learning · Confidence · Effort · Risk · **Lens count** · **Lenses** (e.g., `["UX","QA","Frontend"]`) · Total Score.

_Scoring model updated Iteration 18 per META_REVIEW.md §6.4 + §6.6._

---

## Top Ranked (post-Iteration 20 — Today UX v2 review)

Iteration 20's 7-lens v2 review reaffirmed several existing OPEN candidates with higher lens counts, unlocking ConvergenceBonus per §6.4. Three new candidates were added (C-UX-V2-1, C-UX-V2-2, C-QA-V2-1). The top tier now reflects that.

| Rank | ID | Title | Type | Score | Lens | Status | 1-line |
|---|---|---|---|---|---|---|---|
| — | C-PM-3 | PROPOSED-state Kaizen chip | fix | 14 | — | **DONE** | Already shipped commit `32ed008`. |
| — | C-SA-1 | Make `activityFromCatalogEntry` deterministic | fix | 13 | — | **DONE (Iter 10)** | Suite 2,565→2,582. |
| — | C-PM-2 | `/insights/portfolio` MVP route (E14) | improvement | 13 | — | **DONE (Iter 11)** | Suite 2,582→2,635. |
| — | C-UX-1 | Bucket-tone token consolidation (T1) | improvement | 12 | — | **DONE (Iter 13)** | Suite 2,635→2,681. |
| — | C-UX-10 | Morning yesterday-recap strip | improvement | 14 | — | **DONE (Iter 14)** | Suite 2,681→2,751. |
| — | C-UX-12 | "Why this plan?" rationale chip | improvement | 13 | — | **DONE (Iter 14)** | Suite 2,681→2,751. |
| — | C-UX-13 | BalanceMeter vocabulary upgrade | improvement | 11 | — | **DONE (Iter 14)** | Suite 2,681→2,751. |
| — | C-UX-3 | EOD closure ritual / day-end strip | improvement | 12 | — | **DONE (Iter 15)** | Suite 2,751→2,810. |
| — | C-PM-4 | EOD reflection prompt | improvement | 12 | — | **DONE-BY-PROXY (Iter 17)** | Implemented by C-UX-3. |
| — | C-SA-4 | Composer must populate `Composition.date` | fix | 12 | — | **DONE (Iter 19)** | Suite 2,834→2,843. |
| — | C-SA-5 | Composer must not place CI overlapping anchored reflection | fix | 12 | — | **DONE (Iter 19)** | Suite 2,834→2,843. |
| — | C-PM-1 | ProjectPaceWarning visible signal | improvement | 13 | — | **BLOCKED-ON-E13** | Requires E13 phase logic. |
| — | C-AN-1 | Top-of-funnel event instrumentation | improvement | 16 | 4 | **DONE (Iter 21)** | Shipped. `TodayPageViewed` + `EditDrawerOpened` events in `js/events/events.js`; emitted from `app.js`; documented in ARCHITECTURE.md §6.1. Suite 2,843→2,866. AC-A1..7 PASS. 14-day baseline window opens at next deploy. |
| — | C-UX-6 | Modal focus-trap discipline (T8) | fix | 16 | 4 (UX+PM+QA+Frontend) | **DONE (Iter 24)** | Shipped. WCAG §2.1.2 conformance fixed on EditDrawer + FineTuneDrawer via reusable `js/ui/focusTrap.js` utility. `aria-modal="true"` + `aria-label` added; Tab/Shift+Tab cycles within dialog; Escape closes + restores focus to trigger. Suite 2,899→2,929. AC1–12 PASS. Runtime 3.67s→3.49s (Iter 23 overshoot resolved). |
| — | C-UX-6b | Focus-trap rollout to remaining 8 dialogs | fix | 14 | 1 (Frontend audit) | **DONE (Iter 27)** | Shipped. Mechanical rollout of `installFocusTrap` (Iter 24) to BaselineDialog + KaizenCloseDialog + OpportunityIntakeForm + OutputArtifactDialog + ReflectionSheet + RemeasurementDialog + SkipReasonModal + WeeklyReflectionWizard via extended `syncDrawerFocusTraps` + `dialogConfigs[]`. Reused `installFocusTrap.onEscape` callback option — no new escape mechanism. WCAG §2.1.2 conformance now covers all 10 modal surfaces. Suite 2,986→3,018. AC1–12 PASS. ⚠️ Runtime 4.03s (15% over budget — meta-review trigger critically due). |
| — | C-FE-HOTFIX-1 | P0: Today page stuck after Accept+Update | fix | (P0) | 1 (FE debug) | **DONE (Iter 28)** | Shipped. Root cause: Iter 25's per-row Update button rendered on PROPOSED composition state too. Click Update on PROPOSED → editMode → Commit → composition→EDITED but activity states stay PROPOSED → CycleCard.renderAccepted has no actionable buttons (Accept/Edit/Reject is PROPOSED-only; Start/Skip require activity-state≠PROPOSED). User stuck. Fix: 1-line condition `compositionState !== 'PROPOSED'` on Update button visibility in `ScheduledActivityBlock.js`. 17 regression tests added covering AUTO_PLAN→ACCEPT→render pipeline. 0 §6.5 hits. Suite 3,018→3,036. Runtime 3.39s (recovered). |
| — | C-PM-CAL-P1 | Today calendar Phase 1: visual calendar grid replaces table | improvement | 15 | 6 (UX+PM+Architect+FE+QA+Competitive) | **DONE (Iter 29)** | Shipped. 6/6 lens convergence on table-replacement. New `js/ui/components/TodayGrid.js` (~251 LOC) using existing `weekGridMath.js` positioning. Hour rail 07:00–19:00, red now-line, bucket-colored blocks, dashed outline for PROPOSED (Reclaim.ai pattern), muted-gray lunch block, click-block emits `OPEN_BLOCK_DETAIL` action. WeekGrid untouched (FE option c). 0 §6.5 hits. Suite 3,036→3,078. AC1–10 PASS. ⚠️ Runtime 4.37s; per-test 1.42ms (under META §7.1 1.5ms ceiling). |
| — | C-PM-CAL-P1b | Phase 1 calendar completion: click-block detail dialog | improvement | 12 | 1 (FE follow-up) | **DONE (Iter 30)** | Shipped. New `BlockDetailDialog.js` (~115 LOC) — activity name + bucket chip + time range + duration + expected output + linked kaizen + Edit/Close. 3 new action handlers (OPEN_BLOCK_DETAIL, CLOSE_BLOCK_DETAIL, BLOCK_DETAIL_EDIT atomic). Reuses Iter 24 focus-trap + Iter 27 onEscape pattern. Protected blocks render Edit disabled. 10th modal surface now properly focus-trapped. 0 §6.5 hits. Suite 3,078→3,106. Runtime 4.03s recovered (per-test 1.30ms). AC1–12 PASS. |
| — | C-UX-COLOR | Bucket-color theming: green / yellow / purple | improvement | 12 | 1 (FE) | **DONE (Iter 31)** | Shipped. Phil's directive: green PROJECT (pays the bills), yellow COMMUNICATION (golden opportunities), purple CI (his favorite + CI-expert). Pure CSS rotation in `:root` block via `bucketMeta.js` abstraction. Today calendar blocks use saturated `--*-fill` with white text (Option a — "make each card filled"); other surfaces retain pale `--*-bg` tint preserving contrast. All 6 fg/bg pairs verified WCAG AA+ (chips AAA 7+:1; block fills AA 4.5+:1). Lunch chip-unknown muted-gray unchanged. 0 §6.5 hits. 0 JS changes. Suite 3,106 (unchanged). AC1–12 PASS. |
| — | C-PM-CAL-P2 | Today calendar Phase 2: drag-to-move + drag-to-resize | improvement | 15 | 6 (UX+PM+Architect+FE+QA+Competitive) | **DONE (Iter 35)** | Shipped. SW-Q-CAL-01/03 ANSWERED via batch (scoped semantics per synthesis option c; warning-on-overlap per PM default). New `js/ui/dragController.js` (~441 LOC) — pure pointer-event controller, dependency-injectable. 15-min snap; bottom-edge resize; ghost block; 5px click-threshold; touch-action: none on resize handle. Drag commit: PROPOSED → pending Confirm/Cancel banner; ACCEPTED/EDITED+ → immediate via existing EDIT_CHANGE_START_TIME + EDIT_CHANGE_DURATION (reused, 0 §6.5 hits). Conflict banner with Revert/Keep actions on overlap. Safety gates: protected blocks have no drag handles; IN_PROGRESS blocked at pointerdown. 7 new orchestration handlers (DRAG_START_PROPOSED, DRAG_COMMIT, DRAG_CONFIRM, DRAG_CANCEL, CONFLICT_REVERT, CONFLICT_KEEP, UNDO_DRAG_COMMIT). Suite 3,107→3,153. AC1–18 PASS. Runtime 4.03s (per-test 1.28ms — 15% headroom). |
| 8 | C-PM-CAL-P3 | Today calendar Phase 3: click-empty-time insert | improvement | 13 | 6 | **OPEN — Phil-blocked** | Click empty time slot in calendar grid → quick-add popover routing through Catalog picker. LOW risk; additive only. **Blocks on SW-Q-CAL-02 (insert behavior)**. |
| — | C-FE-1 | BROWSER_CATALOG missing `recovery_lunch` entry | fix | 8 | 1 (FE follow-up from Iter 28) | **DONE (Iter 32)** | Shipped. Added `recovery_lunch` entry to `js/catalog/browserSeed.js` (9→10 entries). Matches seed entry shape (`bucket: null`, `defaultDurationMinutes: 30`, `focusArea: 'CONTINUOUS_IMPROVEMENT'`). Eliminates pre-async-hydration window where lunch row would render without metadata. 0 §6.5 hits. |
| — | C-FE-2 | CycleCard.js dead code removal (post-Iter 29) | fix | 6 | 1 (FE follow-up from Iter 29) | **DONE (Iter 32)** | Shipped. Removed `renderActivityList`, `renderActivityColumnHeaders`, `ScheduledActivityBlock` import, stale comments. Net -62 LOC. `ScheduledActivityBlock.js` source file retained as regression guard. 0 §6.5 hits. Suite 3,106 (unchanged). |
| — | C-UX-AESTHETIC | Chartered Minimalism redesign — Today page | improvement | 14 | 1 (FE w/ frontend-design skill) | **DONE (Iter 33)** | Shipped. `frontend-design` skill applied; 2-pass dispatch (proposal + implementation). Typography: DM Serif Display + DM Sans + DM Mono (replaces system-font stack — skill's #1 anti-pattern). Block fills: 2-stop linear-gradients (Iter 31 colors preserved). Motion: page-load stagger reveal, block hover-lift, now-line breathing, dialog scale-fade, kaizen-ping signature. Spatial: right-margin bucket strip, hour-rail typography, vertical hairline grid, PROPOSED state banner. 7 production files touched; 0 §6.5 hits. CSS LOC +241 net. AC1–20 PASS. Suite 3,106 (unchanged). Runtime 3.65s (per-test 1.18ms — 21% headroom under META §7.1). |
| — | C-FE-3 | state.fineTune slice cleanup (post-Iter 25) | fix | 8 | 1 (FE follow-up) | **DONE (Iter 34)** | Shipped. Renamed `state.fineTune` → `state.composerConfig` across `js/app.js` + 12 test files (13 occurrences). Dropped dead fields (`open`, `_snapshotBeforeChange`). Deleted handlers FINE_TUNE_TOGGLE + FINE_TUNE_CANCEL (drawer-management, drawer doesn't exist). Renamed FINE_TUNE_APPLY → COMPOSER_CONFIG_APPLY. Kept compose-pipeline-critical handlers (CAPACITY_CHANGE, EXTERNAL_MEETINGS_CHANGE, PROJECT_FOCUS_CHANGE) with internal references updated. AUTO_PLAN compose-input shape preserved — engine untouched. 0 §6.5 hits. |
| — | C-FE-4 | formatDateDisplay locale handling (post-Iter 33) | fix | 4 | 1 (FE follow-up) | **DONE (Iter 34)** | Shipped. `js/ui/components/CycleCard.js:64` changed from hardcoded `'en-GB'` to `(typeof navigator !== 'undefined' && navigator.language) || 'en-US'`. Browser users see native locale (e.g., "Wednesday, May 14, 2026" for en-US; "Wednesday, 14 May 2026" for en-GB). Node test env: navigator undefined → en-US fallback deterministic. `Intl.DateTimeFormat` options unchanged. 0 §6.5 hits. |
| — | C-UX-V2-1 | Auto-collapse RhythmExplainer + suppress on infeasible | improvement | 15 | 5 (UX+PM+Growth+QA+Competitive) | **DONE-BY-PROXY (Iter 23)** | Marked DONE-BY-PROXY at Iter 27 meta-review §7.5 sweep. RhythmExplainer.js was moved to `js/ui/components/_backup/` in Iter 23 as part of Today simplify Phase A. The "auto-collapse" premise no longer applies — the component no longer renders on Today. |
| **4** | **C-UX-V2-2** | Single Commit surface + keyboard shortcut (E-to-edit, Enter-to-commit) | improvement | **14** | **5** (UX+PM+Frontend+QA+Competitive) | OPEN | Dual Commit/Cancel/Undo triad in CycleCard + EditDrawer + mouse-required edit-entry. Highest-leverage for <60s target. **Iter 20 NEW.** |
| — | C-UX-2 | BucketStrip blackout fix in edit mode (T2) | fix | 14 | 4 | **DONE (Iter 21)** | Shipped. `app.css` selector at line ~1524 narrowed to `.cycle-activities` + `.triad` only. BucketStrip visible during edit. AC-U2-1..4 PASS. |
| — | C-UX-COL | Today row column refactor (intention→outputArtifact, remove state label) | improvement | 18 | 6 | **DONE (Iter 22)** | Shipped. 6-lens convergence (UX+PM+FE+QA+Analytics+Competitive). 5 columns down from 6. `.sa-intention` placeholder replaced with `.sa-artifact` (clickable, opens OutputArtifactDialog); `.sa-state-label` removed; `<li>` aria-label semantic encoding; `layoutVersion: 'v2'` cohort tag; `RowOutputClicked` event. 0 §6.5 hits except 1 permitted event addition. Suite 2,866→2,892. AC-01..10 PASS. |
| — | C-PM-SIMPLIFY-A | Today page Phase A: pure UI strip + 4 compensations | improvement | 15 | 7 | **DONE (Iter 23)** | Shipped. 7-lens convergence (UX+PM+Architect+FE+QA+Growth+Competitive). 11 → 5 regions on Today page. WhyThisPlan + MorningRecap relocated as collapsed disclosures inside CycleCard (per 6/7 lens recommendation; pure deletion would have been "strategic regression to Motion-tier opaque" per Competitive). EOD CTA relocated to CycleCard footer. NowPane compensated by `aria-live="polite"` summary. RhythmExplainer + NowPane + EodClosureStrip moved to `_backup/`. 0 §6.5 hits. Suite 2,892→2,899. AC A1–A10 PASS. |
| — | C-PM-SIMPLIFY-A2 | Today page Phase 2 strip + table-style schedule | improvement | 13 | 1 | **DONE (Iter 25)** | Shipped. User-directive: removed AdherenceDial + BucketStrip (both PROPOSED + ACCEPTED) + FineTuneButton/Drawer wiring; added 6-column header row (Time of Day · Focus Area · Standard Work Name · Planned Duration · Expected Output · Update); per-row Update button on non-protected rows wires `EDIT_QUICK_UPDATE` (1-click duration entry). 0 §6.5 hits. CCC 5→3. Suite 2,929→2,943. AC1–13 PASS. ⚠️ Runtime 3.80s (9% over budget). |
| — | C-PM-LUNCH | Time-blocked lunch as editable ScheduledActivity | improvement | 13 | 2 (Architect + PM Define 2026-04-30) | **DONE (Iter 26)** | Shipped. User-directive Phase 2 + 3-week-paused Define-pass closure. New `js/composer/lunchBlock.js` helper; `injectLunchBlock` called post-orderDay/pre-validate in both composeDaily + composeWeekly. New CatalogEntry `recovery_lunch` (60→61 entries): 30 min @ 12:00, `bucket: null` capacity-neutral sentinel, `focusArea: CONTINUOUS_IMPROVEMENT` (no §6.5 hit on types.js), skippable + movable. validateComposition filters `bucket===null`. 3 §6.5 hits exactly as architect predicted (composeDaily, composeWeekly, validateComposition); zero touches to orderDay/types/events. Suite 2,943→2,986. AC1–16 PASS. Runtime 3.53s (recovered from Iter 25 overshoot). |
| 4 | C-PM-SIMPLIFY-B | Today page Phase B: composer rebalance (4h project + 2h comm + end-of-deep-cycles + CI sacred) | improvement | 12 | 7 | **OPEN — Phil-blocked** | Composer rebalance per Phil directive: add POST_DEEP_COMM anchor, raise comm budget to 120 min, mark CI as sacred. **HIGH risk** per QA (~15 hardcoded composer/capacity tests will need recalculation; INFEASIBLE rate may rise). 6 §6.5 hits. **Blocks on Phil's SW-Q6–Q10 standard-work answers** (anchor placement, default duration, standup-vs-AM-comm semantics, canonical CI block, sacredness mechanism). |
| 5 | C-PM-SIMPLIFY-C | Today page Phase C: no-projects discovery branch | improvement | 13 | 7 | **OPEN — Phil-blocked** | When user has 0 projects, Today shows ProjectDiscoveryCard leading to project type selection. Architect confirmed Project ≠ new entity (Kaizen IS the project proxy via `KaizenService`). LOW risk; additive. 1 §6.5 hit (`hasActiveProject` boolean on ComposerInput). **Blocks on Phil's SW-Q1–Q5 standard-work content** (project discovery activities, governance, approval, assignment, project types inventory). |
| 6 | C-UX-8 | Action-button aria-labels carry activity name | fix | 13 | 1 | OPEN | Start/Skip/Close announce as bare verb. WCAG §4.1.2. |
| — | C-QA-V2-1 | Comprehension Complexity Count (CCC) proxy test | fix | 13 | 3 | **DONE (Iter 21)** | Shipped. New `tests/ui/pages/Today.ccc.test.js` (245 lines, 9 tests). Asserts CCC ≤ 12 active-composition + per-region word count ≤ 25. AC-Q1..4 PASS. |
| — | C-UX-12 | "Why this plan?" rationale chip | improvement | 13 | **DONE (Iteration 14)** | Shipped — `WhyThisPlan` component reads `composerInputsSnapshot.explain`; expand/collapse with aria-expanded; rule-grouped display. AC12-1..5 PASS. |
| — | C-PM-4 | End-of-day reflection prompt (T3) | improvement | 12 | **DONE-BY-PROXY (Iteration 17)** | Iteration 15's C-UX-3 EOD closure ritual implements the same capability — strip surfaces pending reflections + opens existing ReflectionSheet for the oldest pending one. Closed via meta-review backlog adjustment §7.1. |
| — | C-UX-3 | Closure ritual + day-end strip (T3) | improvement | 12 | **DONE (Iteration 15)** | Shipped — `EodClosureStrip` renders below CycleCard when day done; CTA opens ReflectionSheet for oldest pending reflection. Suite 2,751→2,810. AC3-1..11 PASS. Daily ritual bookend complete. |
| — | **C-SA-5** | **Composer must not place CI activities overlapping anchored reflection** | **fix** | **12** | **DONE (Iteration 19)** | Shipped per arch-delta §3.4 Option A. `orderDay.js:183-185` empty `if`-body replaced with `break`; `afternoonCap` extended to honor Mid-Sprint/Sprint-Review/Retro anchors. Suite 2,834→2,843. AC-B1..4 PASS. Same fix closes 14:30/15:00 Mid-Sprint overlap. |
| — | **C-SA-4** | **Composer must populate `Composition.date`** (renamed from `compositionDate` per architect convention) | **fix** | **12** | **DONE (Iteration 19)** | Shipped per arch-delta §2.3. `date: input.date` added at `composeDaily.js:664`; typedef updated at `types.js:417`. Field name `date` (matches `composeWeekly.buildDay`). Suite 2,834→2,843. AC-A1..3 PASS. Note: orchestrator recon claim that field was "declared in typedef" was wrong — typedef never declared it; was added in this iteration. |
| 7 | C-SA-2 | Append `EDITED_FROM_PROPOSAL` Variance rows | fix | 12 | OPEN | Duration/start-time edits emit no append-only audit row. |
| 8 | C-QA-2 | `WeeklyComposerService.reflow` test coverage | fix | 12 | OPEN | Sprint 15 W5 deliverable has zero test references. |
| 9 | C-QA-3 | `formatTimeRange` DST-offset ISO test | improvement | 12 | OPEN | All fixtures use UTC `Z`; non-Z ISO input silently mis-displays. |
| 10 | C-UX-2 | BucketStrip blackout fix in edit mode (T2) | fix | 11 | OPEN | `today-editing` over-applies opacity 0.4 to BucketStrip — invariant feedback hidden during the edit that triggers it. (UX §IA failure.) |
| — | C-UX-13 | BalanceMeter vocabulary upgrade (T1 label-only) | improvement | 11 | **DONE (Iteration 14)** | Shipped — `BUCKET_LABELS_LONG` added to `bucketMeta.js`; BucketStrip displays "Deep Work / Communication / Improvement" labels. T1 hex tokens unchanged. AC13-1..6 PASS. |
| **10** | **C-UX-11** | **AdherenceDial momentum signal pre-day-7** | **improvement** | **11** | **OPEN** | **Dial shows dashes for 7 straight days; users with 3 days of progress see no momentum signal. Growth §4 AR-2 ranked biggest activation risk.** |
| 12 | C-UX-4 | Empty-state warmth ladder (T5) | improvement | 11 | OPEN | Other pages have cold empty states (Week / Portfolio / Catalog / InsightsPortfolio); Today's `daysSinceSignupHint` is the model. |
| — | C-UX-7 | Now / Up-Next duplication fix (T10) | fix | 11 | **DONE-BY-PROXY (Iter 23)** | Marked DONE-BY-PROXY at Iter 27 meta-review §7.5 sweep. NowPane.js moved to `js/ui/components/_backup/` AND UpNextRail removed from Today.js render path (UpNextRail.js source kept for Week.js dep). The duplication on Today no longer exists — both surfaces removed. |
| 14 | C-SA-3 | Collapse duplicated protected-block lists | improvement | 11 | OPEN | `editMode.js` hardcodes lists that mirror but are not derived from `composeDaily.js`. |
| 15 | C-PM-5 | `ImplementationBacklog` first-class entity (E18) | improvement | 10 | OPEN | E18 MVP must-have; Kaizen actions remain a JSON blob. |
| 16 | C-QA-1 | A11y assertions on WeekGrid + UpNextRail | improvement | 10 | OPEN | Existing components have aria-labels but no test assertions on them. |
| 17 | C-UX-5 | Page header trio standardization (T7) | improvement | 8 | OPEN | Every page has bespoke header; no shared `<h1>` + status + primary-action contract. Touches all 5 pages. |
| 18 | C-UX-9 | Day-band onboarding cadence (T9) | improvement | 8 | OPEN | Only days 0–1 / 2–6 / 7+ have copy; days 14 / 21 / 30 / 60 / 90 missing. |

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
- **Status: DONE (Iteration 13, 2026-04-27)**
- Type: improvement
- Problem: `app.css` had `--primary: #0f172a` (`:root`) AND `--color-primary: #2563eb` (Sprint 13 chip rules) as conflicting "primary" tokens. Three independent bucket→CSS-class maps (plus 1 inline ternary) would silently drift under any visual pass. WCAG forced-colors mode unhandled.
- **Resolution**: Built per `T1_TOKEN_SPEC.md` (system-architect, 244 lines, user-approved). New `js/ui/bucketMeta.js` (89 lines) consolidates 4 derivation sites into single pure helper returning `{bucket, chipClass, dotClass, label, vars}`. `--color-primary` renamed to `--accent-primary` per spec §2.1 (Option A naming policy). UpNextRail dot classes migrated to compound `chip-{bucket}` form. New `@media (forced-colors: active)` block covers 18 selectors using `Mark`/`MarkText`/`CanvasText`. Suite 2,635 → 2,681 (+46 tests across 12 new suites incl. 14 component-level visual-regression locks). All 8 ACs PASS. BucketStrip canonical pattern (`app.css:296-342`) byte-identical via git-diff line-range verification. Prerequisite for T2–T10 NOW LANDED.
- Evidence at scoring time: UX §4 (token split), Frontend §5–§6 pattern 1, QA §8 pattern 7.
- Impact 4 / Strategic 5 / Learning 3 / Confidence 5 / Effort 3 / Risk 2
- Total: 12

### C-UX-2: BucketStrip blackout fix in edit mode (Theme T2)
- Status: OPEN
- Type: fix
- Problem: `app.css:1519–1527` `.today-editing .cycle-card:not(.cycle-editing)` applies `opacity: 0.4; pointer-events: none` to the BucketStrip — exactly when the user needs to watch bucket totals respond to swap choices.
- Expected benefit: Functional IA fix; users see invariant feedback during the action that most triggers it.
- Evidence: UX §IA failure §4 (most urgent).
- Impact 3 / Strategic 3 / Learning 2 / Confidence 5 / Effort 1 / Risk 1
- Total: 11

### C-UX-3: Closure ritual / day-end strip (Theme T3)
- **Status: DONE (Iteration 15, 2026-04-27)**
- Type: improvement
- Problem: Today closed cold. No "day complete" confirmation, no pending-reflection nudge, no bridge to tomorrow. Convergent across 4 lenses.
- **Resolution**: New `js/ui/components/EodClosureStrip.js` (64 lines) renders single-line strip below CycleCard when day-done condition holds. Trigger: every non-DROPPED activity terminal (CLOSED/SKIPPED) OR `nowIso >= lastActivityEnd`. Strip displays "Day complete · N/M closed · K skipped · P reflections pending"; CTA "Capture reflection →" opens ReflectionSheet for oldest pending reflection via existing `openReflectionSheet()` flow at `app.js:2469`. Architect's open question (is `lastActivityEndsAt` derivable?) confirmed YES — computed from `max(plannedStartAt + plannedDurationMinutes)` across activities. Suite 2,751 → 2,810 (+59). All 11 ACs PASS. Daily ritual bookend complete (paired with C-UX-10 Morning recap from Iteration 14).
- Evidence at scoring time: PM §3 (C-PM-4), Growth §3 HR-3 / §7 rank 2, Competitive §3 pattern 4 / §6 rank 4, Analytics §3 step 9.
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

### C-UX-10: Morning yesterday-recap strip (Today)
- Status: OPEN
- Type: improvement
- Problem: Today opens cold. No yesterday recap, no momentum signal, no summary of what fed into the proposed plan. Convergent across 4 lenses (Growth §3 HR-1 single-worst friction, Competitive §3 pattern 1 + §6 rank 1, PM §3 latent jobs, Design §5 Flow 1 rated 3/5). Single most copy-able pattern from comparators — 5 of 8 (Sunsama, Motion, Akiflow, Tana, Todoist) implement some form of it.
- Expected benefit: One-line morning recap strip ("Yesterday: 5/6 closed · 1 skipped" or similar). Closes the open-of-day end of the daily ritual; gives users continuity between sessions; reduces stateless-feel attrition.
- Evidence: Growth §3 HR-1, §7 rank 1; Competitive §3 pattern 1, §6 rank 1, §9 north-star Sunsama; PM §3; Design §5 Flow 1; UX_DESIGN_THEMES.md §2 convergent finding 2.
- Architectural notes: AdherenceDial computation already reads yesterday's closed/skipped counts. Pure additive render block; no FSM, no schema, no event-bus changes. Safe to ship behind a flag if needed.
- Implementation hint: Single render block above the rhythm explainer / below the header on Today. Hidden if `daysSinceSignup === 0` (no yesterday).
- Impact 5 / Strategic 4 / Learning 4 / Confidence 4 / Effort 2 / Risk 1
- **Total: 14 — highest-ranked OPEN item.**
- Note: Governance backfill 2026-04-27. Surfaced in Iteration 12 synthesis but missed at candidate-generation time.

### C-UX-11: AdherenceDial momentum signal pre-day-7
- Status: OPEN
- Type: improvement
- Problem: AdherenceDial shows null/dashes for first 7 days. A user who has accepted plans for 3 days running sees no progress signal. Growth §4 AR-2 ranked this the **biggest activation risk** before §7.4 metric is even measurable. The blank period IS the primary attrition window.
- Expected benefit: Day counter and accepted-day pip row visible during days 0–6 before percentages unlock at day 7. Display-state change only; metric logic and dial-percent computation unchanged.
- Evidence: Growth §1, §4 AR-2 (biggest activation risk), §6 (copy rated cold), §7 rank 3; Design §5 Flow 1 friction; Competitive §3 pattern 7 (4 comparators show consistency visualization); UX_DESIGN_THEMES.md §2 convergent finding 7.
- Architectural notes: Display-only change to `AdherenceDial` component. No new data path; `daysSinceSignup` and accept history are already available. Pip-row shows last N days (filled if accepted, empty if not); auto-hides when percentages unlock at day 7.
- Implementation hint: Modify `AdherenceDial` render to branch on `daysSinceSignup < 7`. Pre-day-7 variant: pip row + day counter. Day-7+ variant: existing percentage triplet.
- Impact 4 / Strategic 3 / Learning 3 / Confidence 4 / Effort 2 / Risk 1
- Total: 11
- Note: Governance backfill 2026-04-27. Surfaced in Iteration 12 synthesis but missed at candidate-generation time.

---

_Last updated 2026-04-27 after Iteration 13 + governance backfill. C-UX-10 (morning yesterday-recap, score 14) is now the highest-ranked OPEN item. Next-loop selection options: (a) C-UX-10 morning recap — convergent #1 finding, biggest visible UX shift; (b) bundle C-UX-6 + C-UX-8 + C-AN-1 — three score-13 a11y/measurement items totaling ~6h; (c) C-UX-3 / C-PM-4 EOD closure ritual — convergent #1 EOD finding._

---

## C-SA-4: Composer must populate `Composition.compositionDate`
- Status: OPEN
- Type: fix
- Problem: The `Composition` typedef in `js/domain/types.js` declares `compositionDate: string` (ISO date), but a grep on `js/` shows **zero writers** of that field. Composer never sets it. Production diagnostic 2026-04-30 confirms `compositionDate=undefined` on every composition in localStorage.
- Expected benefit: Date-based queries become possible. `getActiveComposition` can correctly filter to today's date instead of falling back to the most-recent active composition (which currently surfaces 8-day-old PROPOSED compositions to users). Iteration 14's morning-recap helper (`computePriorDayRecap`) requires this field. Iteration 15's EOD strip indirectly depends on date filtering.
- Evidence: Production console diagnostic 2026-04-30; `grep compositionDate js/` returns 0 hits; typedef at `js/domain/types.js`.
- Lens count: 1 (system-architect via diagnostic interpretation)
- Lenses: ["Architect"]
- Impact 4 (multiple downstream features depend on it) / Strategic 4 (data integrity / determinism) / Learning 3 / Confidence 5 / Effort 2 / Risk 2 / ConvergenceBonus 0
- Total: 12 (capped at 12 per §6.4 score-13 gate — needs ≥3-lens evaluation)
- Note: Lens count will increase after architect produces `ARCHITECTURE_DELTA_COMPOSER_BUGS.md`. QA review of the fix would bring lens count to 3, unlocking score-13 promotion.

## C-SA-5: Composer must not place CI activities overlapping anchored ceremonies
- Status: OPEN
- Type: fix
- Problem: `js/engine/orderDay.js:182-188` CI rotation loop has an empty `if (ciCursor + duration > reflectionStart) { /* comment only */ }` body. The original comment says "still place (validator surfaces)" but `validateComposition` does not flag the overlap. Production diagnostic 2026-04-30 confirms a 60-minute Team Introductions activity placed at 17:00 — directly overlapping the 15-minute End-of-Activity Reflection ceremony anchored at 17:00.
- Expected benefit: Schedule correctness. Composer produces internally consistent schedules where anchored ceremonies' time slots are exclusively reserved.
- Evidence: Production console diagnostic 2026-04-30 (`17:00 +60m CI Team Introductions` AND `17:00 +15m CI End-of-Activity Reflection` in the same composition); `js/engine/orderDay.js:182-188`.
- Lens count: 1 (system-architect via diagnostic interpretation)
- Lenses: ["Architect"]
- Impact 5 (direct schedule-correctness bug) / Strategic 5 (4-2-2 invariant integrity) / Learning 3 / Confidence 5 / Effort 3 / Risk 3 / ConvergenceBonus 0
- Total: 12 (capped at 12 per §6.4 score-13 gate — needs ≥3-lens evaluation)
- Note: Lens count will increase after architect produces `ARCHITECTURE_DELTA_COMPOSER_BUGS.md`. Same as C-SA-4.

---

_Last updated 2026-04-30 after production diagnostic. Two new composer-engine candidates added (C-SA-4, C-SA-5). Both require Define-pass per §6.3 (user-reported defects) and architecture-delta artifact per §6.5 (composer/engine boundary protection). System-architect dispatched to produce `ARCHITECTURE_DELTA_COMPOSER_BUGS.md` before any code changes._

---

## C-UX-V2-1: Auto-collapse RhythmExplainer + suppress on infeasible (Iter 20)
- Status: OPEN
- Type: improvement
- Problem: `RhythmExplainer` (`js/ui/components/RhythmExplainer.js:31`, called from `Today.js:160`) renders unconditionally on every state — including ACTIVE composition, INFEASIBLE, and returning-user contexts. A 57-word, full-weight card occupies above-the-fold zone for any user who hasn't tapped "Got it." Pushes the plan below the fold on mobile.
- Expected benefit: Returning users see plan in <10s budget instead of 4-6s wasted on onboarding card. First-run users get a one-time onboarding moment, then it collapses to a chip on subsequent sessions.
- Evidence: UX §SK-1 (4-6s/session cost cited), PM §2 ("biggest job-coverage gap vs the 10s target"), Growth §3+§4 ("biggest first-run AND returning-user blocker"), QA §3 (forces extra scan-and-skip step), Competitive §3 (Sunsama-style fast morning, no modal).
- Lens count: **5** (UX, PM, Growth, QA, Competitive)
- Lenses: ["UX", "PM", "Growth", "QA", "Competitive"]
- Impact 4 / Strategic 4 / Learning 3 / Confidence 4 / Effort 2 / Risk 1 / **ConvergenceBonus +3**
- **Total: 15** (clears §6.4 score-13 gate)
- Open question: collapse-trigger threshold — first-dismiss vs day-band suppression at day 1, day 3, etc. Default: first-dismiss + auto-suppress at day 3 regardless of dismissal state.

## C-UX-V2-2: Single Commit surface + keyboard-first edit (Iter 20)
- Status: OPEN
- Type: improvement
- Problem: Two issues bundled: (1) Both `CycleCard.js:52-55` (`renderEditTriad`) AND `EditDrawer.js:229-239` (`renderFooter`) render Commit/Cancel/Undo simultaneously during edit-mode (2-3s confusion + accidental wrong-commit). (2) Edit-mode entry requires mouse — competitor evidence (Akiflow, Sunsama, Linear) shows keyboard-first edit (E to enter, Enter to commit) as the highest-leverage <60s improvement.
- Expected benefit: <60s update-and-start target reachable on the keyboard-only path. Resolves Frontend §3 duplicate-renderer drift risk.
- Evidence: UX §SK-2 (dual triad cited), PM §3 ("edit-entry discoverability — biggest 60s gap"), Frontend §3 ("renderEditTriad and renderFooter are functionally identical, will diverge under theme pressure"), QA §3 (TOC ~25-45 vs target <10), Competitive §6 (Akiflow command bar + Sunsama X-key).
- Lens count: **5** (UX, PM, Frontend, QA, Competitive)
- Lenses: ["UX", "PM", "Frontend", "QA", "Competitive"]
- Impact 4 / Strategic 4 / Learning 3 / Confidence 4 / Effort 2 (S if scope (a) — label fix + triad suppression + keybind; M if scope (b) — unified drawer redesign) / Risk 2 / **ConvergenceBonus +3**
- **Total: 14** (clears §6.4 score-13 gate)
- Open question: scope (a) label-fix + triad-suppression vs (b) unified drawer redesign. Default: (a) — minimal blast radius, faster shipment, preserves drawer separation.

## C-QA-V2-1: Comprehension Complexity Count (CCC) proxy test (Iter 20)
- Status: OPEN
- Type: fix
- Problem: No automated way to measure progress toward Phil's <10s comprehension target. Without an automated metric, every iteration's claim that it improved comprehension is unfalsifiable.
- Expected benefit: A pure-HTML-parse unit test that asserts `CCC <= 12` on the rendered Today HTML, plus a word-count-per-region cap of 25 (~10s at 150 wpm). Caught at CI time; regressions surface immediately.
- Evidence: QA §3 + §4 (proposed Comprehension Complexity Count and Task Op Count metrics with concrete formulas).
- Lens count: **3** (QA, Analytics, Frontend implicit)
- Lenses: ["QA", "Analytics", "Frontend"]
- Impact 3 / Strategic 4 / Learning 4 / Confidence 5 / Effort 1 / Risk 1 / **ConvergenceBonus +2**
- **Total: 16** ← actually wait, recompute: 3+4+4+5-1-1+2 = 16
- Hmm let me re-verify: this is a simple test infrastructure addition. Let me cap effort + impact more conservatively.
- Recompute: I 3 / S 3 / L 3 / C 5 / E 1 / R 1 = 13 base + 0 bonus = 13. With +2 bonus (3 lenses): **15**. Cap by §6.4 not needed (≥3 lenses). **Score: 13** (more conservative; QA proposal is solid but small).

---

_Iteration 20 candidate scoring update: 7-lens v2 review re-evaluated several existing OPEN candidates. Lens counts increased; ConvergenceBonus applied per §6.4. New top-tier: C-AN-1 (16), C-UX-6 (16), C-UX-V2-1 (15), C-UX-V2-2 (14), C-UX-2 (14)._

## C-SA-6: Validator should detect activity time-window overlaps
- Status: OPEN
- Type: fix
- Problem: `js/engine/validateComposition.js` has zero overlap detection. The "validator surfaces" comment at `orderDay.js:184` was misleading — there's no validator that catches overlapping `plannedStartAt + plannedDurationMinutes`. Iteration 19 fixed the placement bug at the composer level (`orderDay.js`), but defense-in-depth would also detect overlaps at validation time, catching any future composer bug or manual edit that violates the invariant.
- Expected benefit: Defense-in-depth correctness. Catches overlap bugs from any source (composer, edit-mode, future automation), not just the one path Iteration 19 fixed.
- Evidence: Architect confirmed during arch-delta §3.2 audit; deferred from Iteration 19 scope per architect §3.4 Option A choice.
- Lens count: 1 (system-architect via arch-delta audit)
- Lenses: ["Architect"]
- Impact 3 (defense-in-depth, not user-facing) / Strategic 4 (data integrity / determinism principle) / Learning 2 / Confidence 5 / Effort 2 / Risk 2 / ConvergenceBonus 0
- Total: 10 (capped at 12 per §6.4 gate but underlying score is 10)

---

## C-UX-COL-1: CLOSED-state actual/planned duration ratio (Iter 22 deferral)
- Status: OPEN
- Type: improvement
- Problem: Once a block is CLOSED, the row still shows just `{plannedDurationMinutes}m`. The actual time tracked is invisible on the row — only inspectable via dialog or downstream insight pages. Sunsama shows planned-vs-actual on every row; BAM-X has the data but doesn't surface it.
- Expected benefit: Inline planned-vs-actual ratio creates a meaningful deviation signal at-glance (e.g., "47m / 45m" = slight overrun). Reinforces evidence-linkage on completed activities.
- Evidence: UX_TODAY_COLUMNS_UX.md §recommendations (CLOSED-state enhancement on `.sa-duration`); UX_TODAY_COLUMNS_COMPETITIVE.md §7 Rank 1 (Sunsama planned-time chip pattern).
- Lens count: 2 (UX, Competitive)
- Lenses: ["UX", "Competitive"]
- Open questions:
  - O-1: Does ActivityService record `closedAt` / `actualDurationMinutes` anywhere? UX artifact flagged this as Q-open. Confirm before scoring.
- Impact 3 / Strategic 3 / Learning 3 / Confidence 4 / Effort 2 / Risk 1 / ConvergenceBonus +1
- **Total: 11**

---

## C-UX-COL-2: Linear-style section grouping for Today rows (Iter 22 deferral)
- Status: OPEN
- Type: improvement
- Problem: All rows render in a single flat list regardless of state. Linear and Motion both group rows into sections (Todo / In Progress / Done; Today / Overdue) which dramatically compresses scanning latency.
- Expected benefit: Section grouping (PROPOSED / SCHEDULED / IN_PROGRESS / CLOSED+SKIPPED) makes state communicable through position rather than label. Latency proxy: time-to-find-current-block should drop. Validates the Iter 22 state-label removal by replacing the lost cue with a stronger one.
- Evidence: UX_TODAY_COLUMNS_COMPETITIVE.md §7 Rank 2 (Linear icon-only status with section grouping).
- Lens count: 1 (Competitive)
- Lenses: ["Competitive"]
- Open questions:
  - Does this fight the existing CycleCard composition-state model (which groups by composition, not by activity-state within composition)?
  - Section ordering: chronological (current first) or by-state-priority (active → scheduled → done)?
- Impact 4 / Strategic 3 / Learning 3 / Confidence 3 / Effort 3 / Risk 2 / ConvergenceBonus 0
- **Total: 8** (capped per §6.4 — single-lens score-13 gate)

---

## C-AN-3: `producedExpectedOutput: boolean` field on ActivityCompleted (Iter 22 deferral)
- Status: OPEN
- Type: improvement
- Problem: `ActivityCompleted` payload doesn't distinguish whether the user produced the catalog-documented `outputArtifact` versus filing an ad-hoc artifact. Without this, we can't compute the analytics KPI "% of activities closed with the expected output" — which is the validation metric for the Iter 22 column refactor.
- Expected benefit: Validates whether surfacing `outputArtifact` inline (Iter 22) drives users to actually produce that documented output. Closes the analytics measurement loop on the column refactor.
- Evidence: UX_TODAY_COLUMNS_ANALYTICS.md §3 (event payload changes section).
- Lens count: 1 (Analytics)
- Lenses: ["Analytics"]
- Open questions:
  - Touches `js/events/events.js` (§6.5) — payload shape change requires arch-delta. Additive field probably backward-compatible but needs confirmation.
  - Where is the comparison done — at close-dialog submit time (compare submitted artifact kind to expected) or at event-emit time?
- Impact 3 / Strategic 4 / Learning 4 / Confidence 4 / Effort 2 / Risk 2 / ConvergenceBonus 0
- **Total: 11** (capped per §6.4 — single-lens score-13 gate; needs PM lens to unlock)
