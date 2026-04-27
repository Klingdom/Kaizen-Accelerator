# BAM-X Kaizen OS — Improvement Backlog

## Scoring Model

`Total = Impact + Strategic alignment + Learning value + Confidence − Effort − Risk`

All scores are integers on a 1–5 scale per dimension. Items are sorted descending by Total.

---

## Top 10 Ranked (post-Iteration 11)

| Rank | ID | Title | Type | Score | Status | 1-line problem |
|---|---|---|---|---|---|---|
| — | C-PM-3 | PROPOSED-state Kaizen chip | fix | 14 | **DONE** | Validation failure caught in Iteration 10: already shipped in commit `32ed008` (Apr 23). |
| — | C-SA-1 | Make `activityFromCatalogEntry` deterministic | fix | 13 | **DONE (Iteration 10)** | Shipped via `IdGeneratorService` injection. Suite 2,565→2,582. |
| — | C-PM-2 | `/insights/portfolio` MVP route (E14) | improvement | 13 | **DONE (Iteration 11)** | Shipped per `E14_PORTFOLIO_SPEC.md`. Suite 2,582→2,635. AC1–AC10 all PASS. |
| — | C-PM-1 | ProjectPaceWarning visible signal | improvement | 13 | **BLOCKED-ON-E13** | Requires E13 phase logic scaffolding; E13 not started. |
| 1 | C-PM-4 | End-of-day reflection prompt | improvement | 12 | OPEN | No end-of-day nudge exists; day-14 reflection rate target (≥75%) has no activation driver. |
| 2 | C-SA-2 | Append `EDITED_FROM_PROPOSAL` Variance rows | fix | 12 | OPEN | Duration/start-time edits emit no append-only audit row, leaving the variance log incomplete. |
| 3 | C-QA-2 | `WeeklyComposerService.reflow` test coverage | fix | 12 | OPEN | `reflow` shipped in Sprint 15 W5 but has zero test references in its test file. |
| 4 | C-QA-3 | `formatTimeRange` DST-offset ISO test | improvement | 12 | OPEN | All fixtures use UTC `Z`; non-Z ISO input silently mis-displays due to `getUTCHours` semantics. |
| 5 | C-SA-3 | Collapse duplicated protected-block lists | improvement | 11 | OPEN | `editMode.js` hardcodes lists that mirror but are not derived from `composeDaily.js`, risking silent drift. |
| 6 | C-PM-5 | `ImplementationBacklog` first-class entity (E18) | improvement | 10 | OPEN | E18 is MVP must-have; Kaizen actions remain a JSON blob, blocking Sustainment Gate and Phase 3→4 veto. |
| 7 | C-QA-1 | A11y assertions on WeekGrid + UpNextRail | improvement | 10 | OPEN | `WeekGrid.test.js` has zero aria-label assertions; UpNextRail aria contract unverified. |

### Loop Process Notes (Iteration 10 learning)

Iteration 9's candidate-generation pass produced two stale candidates (C-PM-3 already-shipped, C-PM-1 blocked-on-prerequisite). Future candidate generation MUST grep against `js/` and `git log` to confirm the gap is real before scoring.

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

_Generated: 2026-04-27. Last updated after Iteration 10. Next loop trigger: coordinator selects top OPEN item (currently C-PM-2 / C-PM-4 / C-SA-2 tied tier at scores 13–12), assigns agents, opens a sprint._
