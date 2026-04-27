# Architecture Delta — CadencePlan Today (response to 14-module brief)

Owner: system-architect
Status: v0.1 — sized in response to 14-module brief, bounded to Today.
Companion to PRD_CADENCEPLAN_TODAY.md (PM) and UX_DELTA_CADENCEPLAN_TODAY.md (UX).

## 1. Executive Summary

- (a) **0 new entities** strictly required for Today-bounded work; **1 net-new optional sub-record** (`User.energyWindows`) if §3.2 is funded; the brief's other "new" entities (PlanningHorizon, PlanningPreference, OpportunityScore, WorkType) are either out-of-scope-for-Today (Portfolio surfaces) or already modeled under different names.
- (b) **3 new fields on existing entities** in the Today-bounded subset: `User.energyWindows[]` (§3.2), `Composition.composerInputsSnapshot.unscheduledTasks[]` (§3.7), `Kaizen.nextBestActionRef` (§3.6, derived/cached). Plus 0–1 optional `Composition.composerInputsSnapshot.conflicts[]` if §3.5 is funded as structured rather than reusing `InfeasibleResult`.
- (c) **Total estimated 18–24 engineer-days** at BAM 24h/week capacity for the architect-recommended subset (§§3.1c, 3.4, 3.7, 3.10 + light 3.5; descope §§3.2, 3.3, 3.6, 3.8, 3.9). Calendar shift: **3.0–4.0 weeks**, fits inside one MVP epic slot.

## 2. Existing-Architecture Check — what the brief already has

| Brief item | Existing equivalent | Citation |
|---|---|---|
| §1 "Generate Best Plan" | `AutoPlanButton` + `composeDaily` | `js/ui/components/AutoPlanButton.js:24`; `js/composer/composeDaily.js:231` |
| §1 workload meter | `BucketStrip` (4-2-2 visualization) | `js/ui/components/BucketStrip.js:1-72` |
| §1 conflict warnings | `InfeasibleBanner` + `InfeasibleResult` shape | `js/composer/composeDaily.js:570-614`; `js/domain/types.js:735` |
| §1 one-click replan | `WeeklyComposerService.reflow` + `CycleReflowed` event | `js/services/WeeklyComposerService.js`; `js/events/events.js:100` |
| §1 calendar export | Out of scope — not in repo (correctly deferred) | — |
| §2 engine inputs | `ComposerInput` accepts capacity, role, varianceQueue, externalMinutes, activeKaizen, sprintAnchorDate, deepSlicePreference | `js/composer/composeDaily.js:231-260` |
| §2 30/60/90 blocks | Sprint 13 duration chips on selected slot | `js/ui/components/EditDrawer.js`; sprint 13 commit `c08b3c2` |
| §2 deep-in-high-energy / comm-after-lunch | Hardcoded anchors in `DAILY_NON_OPTIONAL_SET` (09:00 standup, 09:15 AM comm, 13:00 post-lunch comm) + `selectDeepPayload` for project work | `js/composer/composeDaily.js:39-70`, `400-474` |
| §2 surface unscheduled work | INFEASIBLE result with `bucketShortfalls` + `suggestedActions` | `js/composer/composeDaily.js:570-614` |
| §3 DMAIC / Kaizen Event / Custom | `ProjectType` enum (5 values incl. DMAIC, KAIZEN_EVENT, KAIZEN_EVENT_90D, KAIZEN_ACCELERATOR_30D, AD_HOC) | `js/domain/types.js:27-35` |
| §3 30-Day Accelerator | E13 (planned, blocked on catalog procedure text) | `DELIVERY_PLAN.md:290` |
| §4 Opportunities/Chartered/Active/Waiting/Completed/Improvement-Backlog | `OpportunityStatus` FSM + `KaizenState` FSM + `Portfolio.js` page | `js/domain/types.js:266-280`; existing Portfolio route |
| §5 reflection | `ReflectionService` + `Reflection` entity (END_OF_ACTIVITY + WEEKLY) | `js/domain/types.js:236-241` |
| §6 User | exists; `dailyCapacityMinutes`, `workDays`, `sprintAnchorDate`, `timezone`, `deepSlicePreference`, `roles[]` | `js/domain/types.js:382-397` |
| §6 Project | `Kaizen` entity (rich) | `js/domain/types.js:537-592` |
| §6 ProjectPhase | `Kaizen.phase` + `phaseDefinitions` for phased project types | `js/domain/types.js:555-557` |
| §6 Task | `ScheduledActivity` (block-level work) + `Kaizen.actions[]` (project-level) | `js/domain/types.js:451-473`, `546` |
| §6 ScheduleBlock | `ScheduledActivity` | same |
| §6 CalendarEvent | `externalMinutesToday` on `Composition.composerInputsSnapshot` | `js/composer/composeDaily.js:657` |
| §6 Reflection / ImprovementLog | `Reflection` + `Variance` (append-only) | `js/domain/types.js:496-512` |
| §6 WorkType (DEEP/COMM/IMPROVEMENT) | `Bucket` enum (PROJECT/COMMUNICATION/CI) | `js/domain/types.js:72-76` |
| §7 visual design (futuristic dark) | T1 token freeze (Iteration 13); dark mode foundation | `T1_TOKEN_SPEC.md:1-60` |
| §8 /dashboard | `/today` route | `js/ui/pages/Today.js:1` |
| §8 /portfolio | `/insights/portfolio` (E14 done) | `js/ui/pages/InsightsPortfolio.js` |
| §8 /reflection | Weekly Reflection page | shipped pre-Iteration 13 |
| §10 ProjectCard | `KaizenCard` | shipped |
| §10 ScheduleBlockCard | `ScheduledActivityBlock` | `js/ui/components/ScheduledActivityBlock.js` |
| §10 ReplanButton | `AutoPlanButton` (conceptually replan-on-click) + reflow | `AutoPlanButton.js`; `WeeklyComposerService.reflow` |
| §11 10-step planner | `composeDaily` 10 steps with explicit STEP comments + `why[]` rationale array | `js/composer/composeDaily.js:1-20`, `263`, `310-554` |
| §11 "return blocks/unscheduled/conflicts/explanation" | Composer already returns `placed[]`, `validation`, `infeasible.bucketShortfalls`, `why[]` (rationale rows ref/rule/detail) | `js/composer/composeDaily.js:683-699` |
| §12 demo data | `seedCatalogIfEmpty` + DEFAULT_TARGETS fixtures | shipped |
| §13 4-2-2 visible | `BucketStrip` ships per Sprint 4+ | shipped |
| §13 draggable | EditDrawer chip-based slot reorder, Sprint 13/14 | shipped |
| §13 reflection learning | `ReflectionService` + `WeeklyReflectionCompleted` event | shipped |

**Conclusion:** ≈85% of the brief's surface is already built or named. The brief's primary architectural deltas reduce to 10 items in §3 below; only 4 of those are Today-bounded and worth funding now.

## 3. Genuine Architectural Deltas

### 3.1 WorkType enum (DEEP_WORK / COMMUNICATION / IMPROVEMENT)

Existing: `Bucket = {PROJECT, COMMUNICATION, CI}` (`js/domain/types.js:72-76`). Three options:

- **(a) Rename** existing `Bucket` → `WorkType` and rename values (`PROJECT`→`DEEP_WORK`, `CI`→`IMPROVEMENT`). Cost: cascade through 60-row catalog (`bucket` field), 2,681 tests, every component (`BucketStrip`, `bucketMeta`, `ScheduledActivityBlock`, `WeekGrid`, etc.), invariants engine, T1 token namespace (`--project-bg` → `--deep-work-bg`), persistence (rows already written use uppercase `PROJECT`/`COMMUNICATION`/`CI` — needs migration). **Estimate: L (8–10d).**
- **(b) Add WorkType as separate concept**. Creates dual model. Composer would need to map both. **Reject.**
- **(c) Treat WorkType as display alias for Bucket** — pure UI label mapping in `bucketMeta`. **Estimate: S (≤ 1d).** Add `BUCKET_LABELS_LONG = {PROJECT: 'Deep Work', COMMUNICATION: 'Communication', CI: 'Improvement'}`; `WorkTypeBadge` is a thin renderer over `bucketMeta`.

**Recommend (c).** Internal nomenclature stays semantically correct (PROJECT = "the project that block advances," not literally "deep work"); user-facing copy can read "Deep Work" without engineering churn. (a) is a 2-week tax with zero functional benefit and high T1-token regression risk.

### 3.2 Energy windows on User entity

Brief §2 asks composer to "place deep in high-energy windows." Currently no energy concept; deep is anchored implicitly via `DAILY_NON_OPTIONAL_SET` (comm at 09:00, 09:15, 13:00) and Deep slices fill the remaining morning by default in `orderDay`.

Sketch:
```
User.energyWindows: Array<{
  startHour: number,   // 0-23
  endHour: number,     // exclusive
  level: 'high'|'medium'|'low'
}> | undefined        // optional; default = derived from current behavior
```

Composer changes: `orderDay` would need to score each Deep slice against energy level; tiebreak rule must be deterministic (no `Math.random`); seed-from-input only. Risk: composer determinism (R-CP-1). Estimate: **M (4–5d)** — 1d data + 2d composer + 1–2d tests.

**Recommend descope for Today bounding.** No current acceptance criterion measures "deep was placed in high-energy window"; user can already pin start times via Sprint 14 inline edit. Re-open if observed misplacement is logged as a friction signal ≥3 times.

### 3.3 Planning Horizon (Day/Week/Sprint/Month/Quarter)

Currently `/today` (Day), `/week` (Week, shipped Sprint 15). Sprint exists conceptually (`User.sprintAnchorDate`, `sprintCeremonyDays`); Month/Quarter not modeled.

Two options:
- **(a)** Display-only `HorizonSelector` on Today that links to existing routes (`/today`, `/week`); Sprint/Month/Quarter labeled "Coming". **Estimate: S (1–2d).**
- **(b)** Horizon-aware composer with multi-day planning algorithm. **Estimate: L (10d+)** + entirely new `composeMonthly` / `composeSprintly` services. Out of scope for Today.

**Recommend (a) only if PM declares it acceptance-critical.** Otherwise descope — the existing top nav already routes between Today and Week.

### 3.4 "Why this plan?" explanation surface

Composer already emits a structured rationale array. Each composer rule (R1_NON_OPTIONAL, R2_VARIANCE_RESCUE, R3_KAIZEN_LINK, R4_PHASE_CEREMONY, R5_DEEP_PAYLOAD, R6_CI_ROTATION, R7_COMM_FILLER, R9_RELAXED) appends to `why[]`:

```
{ ref: catalogEntryId, rule: 'R5_DEEP_PAYLOAD', detail: 'Block name (XmM)' }
```

Persisted at `Composition.composerInputsSnapshot.explain` (`js/composer/composeDaily.js:661`).

**Delta is UI-only:** a `WhyThisPlan` component reads `composition.composerInputsSnapshot.explain` and renders the rule-grouped list. No composer change. No persistence change. Estimate: **S (1–2d)** for the component + ~30 tests + a one-line addition in `Today.js`.

This is the highest-leverage win in the entire brief.

### 3.5 ConflictWarning surface

Composer currently differentiates two failure modes: (1) capacity-exceeded → `INFEASIBLE` result (`composeDaily.js:570-614`) with `bucketShortfalls` + `suggestedActions`; (2) successful compose with under-floor or over-ceiling buckets → handled inside `validateComposition` and visually surfaced via `BucketStrip` `under-floor`/`overpacked` classes (`BucketStrip.js:68-72`).

Brief asks for "conflict warnings" that imply something between INFEASIBLE and OK. Two paths:
- **(a)** Reuse — render existing `InfeasibleBanner` more aggressively, add a softer "tight-day" variant when shortfall is small. **Estimate: S (1d).**
- **(b)** Add structured `Composition.composerInputsSnapshot.conflicts: Array<{kind, scope, message, suggestedAction?}>`. **Estimate: M (3–4d)** + persistence migration risk.

**Recommend (a).** The existing INFEASIBLE shape already covers the warnings the brief describes (over-capacity, bucket shortfalls). Adding a new structured field duplicates it without new information.

### 3.6 NextBestAction per project

Brief §10 asks for `NextBestActionCard`. Currently no per-Kaizen "next best action" computation. The natural derivation is:

- For `projectType='DMAIC'`: next eligible step from `ComposerService.eligibleDmaicPayloadSteps()` (already exists per ENGINE_DESIGN §4.2).
- For `projectType ∈ {KAIZEN_ACCELERATOR_30D, KAIZEN_EVENT_90D}`: next non-completed `phaseDefinitions[currentPhase].nonOptionalCatalogEntryIds[]` row.
- For `AD_HOC`: next undone `actions[]` row.

Sketch: `kaizenSelectors.computeNextBestAction(kaizen, scheduledActivities)` → `{ catalogEntryId, name, rationale }` or `null`.

**Hard dependency:** for Accelerator and Kaizen-90 types, this is **blocked on E13/E18** (per `IMPROVEMENT_BACKLOG C-PM-1` already-flagged blocker). DMAIC + AD_HOC paths are unblocked.

Estimate: **M (3–4d)** for the selector + UI card on Today + ~25 tests, scoped to DMAIC+AD_HOC. Phased project types light up automatically once E13/E18 land.

**Recommend descope for now.** Reopen when E13 lands. (R-CP-2.)

### 3.7 UnscheduledWorkTray

Today, when capacity is exceeded the composer returns INFEASIBLE — the Today page renders `InfeasibleBanner` and offers `Auto-Plan` again. There is no concept of "tasks that didn't fit but are still pending."

The closest existing concept: `varianceQueueRescued` (`composeDaily.js:321`) carries yesterday's skipped non-optionals into today.

To add an UnscheduledWorkTray:
```
ComposerResult.unscheduledTasks: Array<{
  catalogEntryId,
  name,
  bucket,
  reason: 'CAPACITY_EXCEEDED'|'PHASE_LOCK'|'DEPENDENCY_UNMET',
  carryStrategy: 'NEXT_DAY'|'DEFER'
}>
```

Stored under `composerInputsSnapshot.unscheduledTasks`. Composer change: when `relaxConfigurable` drops blocks, record them here instead of (or in addition to) the `R9_RELAXED` why-row.

Estimate: **S–M (2–3d).** Composer change is small, UI tray is medium, persistence is append-only-friendly.

**Recommend** if PM accepts the lower-friction "Auto-Plan again with adjusted inputs" flow — moderate value, low risk.

### 3.8 PlanningPreference

Brief §6 names `PlanningPreference` (preferred comm windows, etc.). Currently all preferences live as scalar fields on `User`: `dailyCapacityMinutes`, `workDays[]`, `sprintAnchorDate`, `timezone`, `deepSlicePreference`. Comm windows are hardcoded constants in `DAILY_NON_OPTIONAL_SET`.

To make them user-configurable would require:
```
User.preferences: {
  amCommWindow: { startHour, endHour },
  postLunchCommWindow: { startHour, endHour },
  deepSlicePreference: '2x2h'|'4x1h',  // already exists; lift here
  energyWindows?: [...]                // see §3.2
}
```

Estimate: **M (3–5d).** Composer would consume `User.preferences.amCommWindow` in `DAILY_NON_OPTIONAL_SET` materialization. Migration: optional; legacy users get hardcoded defaults.

**Recommend descope.** No current acceptance criterion measures "user changed comm window." Re-open when ≥3 friction signals report "comm window wrong for me."

### 3.9 OpportunityScore formula

Brief §4 specifies `strategic*0.35 + urgency*0.20 + confidence*0.15 + impact*0.20 - effort*0.10`. The `Opportunity` entity exists (`js/domain/types.js:679-698`) with `proposedProjectType` and `status` but no scoring inputs.

**Out of scope for Today bounding.** Lives entirely on Portfolio page. Defer to a Portfolio-bounded delta. Note the formula works against fields that don't yet exist on Opportunity; spec'ing them is itself a 2-day exercise.

### 3.10 Replan event (UserRequestedReplan)

`CycleReflowed` exists (`js/events/events.js:100`) but is auto-triggered by `WeeklyComposerService.reflow` when the user accepts a week mid-week. It is not user-button-triggered.

Brief §1 wants a one-click "Replan" button on Today. Behaviour: re-run `composeDaily` against the current day, replacing the `PROPOSED` composition (or asking for confirmation if `ACCEPTED`).

Two paths:
- **(a)** Add `UserRequestedReplan` event + button that calls `ComposerService.composeDaily(...)` again. Re-uses existing AutoPlan delegation (`AUTO_PLAN` action). **Estimate: S (1–2d).**
- **(b)** Add nothing; the existing `AutoPlanButton` already does this on the empty-state and could be exposed when a composition is active.

**Recommend (a) with the button being a re-skinned `AutoPlanButton` when a composition is already PROPOSED/ACCEPTED.** New event name is correct for analytics traceability (R-CP-5: surface a loading state since compose can take >100ms on large catalogs).

## 4. Vanilla-JS Feasibility per Component (brief §10)

| Component | Already exists? | Vanilla-JS feasible? | Effort | Notes |
|---|---|---|---|---|
| PlanningCockpit | Partial (Today page is the cockpit) | Yes | S | Add Why panel + Replan button to existing `Today.js`; do not introduce a new container. |
| HorizonSelector | No | Yes | S | Display-only links across `/today` `/week`; Sprint/Month/Quarter labeled "Coming". Recommend descope. |
| GeneratePlanButton | Yes — `AutoPlanButton` | Yes | — | No work. |
| ScheduleGrid | Yes — `CycleCard` + `ScheduledActivityBlock` (Today) and `WeekGrid` (Week) | Yes | — | No work. |
| ScheduleBlockCard | Yes — `ScheduledActivityBlock` | Yes | — | No work. |
| WorkTypeBadge | Partial — bucket chips exist via `bucketMeta` | Yes | S | Extend `bucketMeta` with `longLabel` (§3.1c). |
| BalanceMeter | Yes — `BucketStrip` | Yes | — | UX owns visual treatment; honor T1 token freeze. |
| ProjectCard | Yes — `KaizenCard` | Yes | — | No work. |
| OpportunityScoreCard | No | Yes | M | Out of scope for Today bounding. Defer. |
| ReflectionPanel | Yes — `WeeklyReflection` page + `ReflectionService` | Yes | — | No work. |
| NextBestActionCard | No | Yes | M | Blocked on E13/E18 for phased types. DMAIC+AD_HOC unblocked. **Recommend descope.** |
| UnscheduledWorkTray | No | Yes | S–M | Composer surfaces dropped blocks; UI is a side rail or banner. |
| ProjectTemplateSelector | Out of scope for Today | Yes | M | Lives on Kaizen creation flow, not Today. |
| CalendarExportButton | No | Yes (ICS file generation pure-JS) | M | Not on Today page. Defer. |
| ReplanButton | Yes — `AutoPlanButton` re-skin | Yes | S | §3.10. |

## 5. Composer Engine Impact (brief §11 ten-step algorithm)

The composer already implements all 10 steps explicitly under their own STEP headings (`composeDaily.js:243-700`). Mapping:

| Brief step | Existing composer step | Delta | Effort | Risk |
|---|---|---|---|---|
| 1. Load windows | STEP 1 — `computeBucketTargets` + `computeBucketFloors` + `computeBucketCeilings` | None | — | — |
| 2. Reserve events | STEP 2 — DAILY_NON_OPTIONAL_SET + AM/POST anchors | None | — | — |
| 3. Reserve comm windows | STEP 2 (09:15 AM, 13:00 post-lunch) | None | — | — |
| 4. Place deep in high-energy | STEP 5 — `selectDeepPayload` + `sliceDeep` | Energy-aware scoring (§3.2) | M | R-CP-1 |
| 5. Place project tasks per dependencies | STEP 5 + DMAIC DAG via `eligibleDmaicPayloadSteps` (`ENGINE_DESIGN §4.2`) | None | — | — |
| 6. Place comm around collab | STEP 7 — `pickCommFiller` | None | — | — |
| 7. Place CI in reflection windows | STEP 6 — `pickCI` rotation | None | — | — |
| 8. Split to 90 min max | STEP 5 — `sliceDeep('2x2h'\|'4x1h')` | Brief asks 30/60/90 — already configurable | — | — |
| 9. Fill remaining | STEP 6 + STEP 7 | None | — | — |
| 10. Return blocks/unscheduled/conflicts/explanation | STEP 10 — returns `placed`, `varianceQueueRescued`, `why`, `validation`, `infeasible.bucketShortfalls` | Add `unscheduledTasks` (§3.7) to fully match | S–M | Low |

**Net composer change: 0–1 small additions.** The existing 10-step pipeline is structurally identical to the brief's algorithm. The only meaningful delta is energy-window scoring (R-CP-1, descoped) and unscheduled-tasks accounting (S–M, recommended).

**Determinism guard:** every composer step is currently deterministic (no `Date.now`, no `Math.random`; clock injected via `input._now`; ids derived). Any new scoring rule must explicitly inject tiebreaks (catalog-id lex order is the existing pattern in `pickCI`).

## 6. Persistence + Migration Plan

- **New `bamx:v1:*` keys:** 0 if architect-recommended subset is funded. (Optional `bamx:v1:user-preferences` if §3.8 lands; descoped.)
- **schemaVersion bump:** Not required. `User.energyWindows` and `Kaizen.nextBestActionRef` would be nullable extensions; legacy reads default to `undefined`.
- **Backward compat:** `Composition.composerInputsSnapshot.unscheduledTasks` (§3.7) reads as `[]` when absent. No breaking change.
- **Append-only impact:** §3.7 unscheduled-tasks is a frozen snapshot field, not a new event log; no append-only invariants touched. §3.10 `UserRequestedReplan` event is fire-and-forget; emits `Variance{kind: 'EDITED_FROM_PROPOSAL'}` if it overwrites an ACCEPTED composition (already specced via `C-SA-2` in `IMPROVEMENT_BACKLOG.md:99-106`).

## 7. Event Catalog Diff

| Event | New? | Emitter | Subscribers | Notes |
|---|---|---|---|---|
| `UserRequestedReplan` | Yes (§3.10) | `Today.js` action handler | `ComposerService.composeDaily` re-runs; `MetricsService` increments replan counter | Analytics only; no FSM impact |
| `PlanExplanationGenerated` | **No — recommend NOT adding** | — | — | The `why[]` array is already attached to `Composition.composerInputsSnapshot.explain`; no separate event needed |

`MetricsService` recompute trigger: `UserRequestedReplan` should NOT trigger recompute (replan is mid-day; metrics windowed daily/weekly). Just log to `agent-telemetry`.

## 8. Determinism Risk Audit

| New input | Date.now / Math.random / iter order? | Mitigation |
|---|---|---|
| `User.energyWindows` (§3.2 — descoped) | Yes — would need scoring tiebreak. Current `pickCI` uses catalog-id lex order; `selectDeepPayload` uses DAG topological order. Adding energy score must add explicit tiebreak in same pattern. | If funded later: extend `selectDeepPayload` with energy score; secondary sort by `catalogEntryId` ASC. |
| `Composition.unscheduledTasks` (§3.7) | No — ordered by drop-order from `relaxConfigurable`, which is itself deterministic | No change |
| `UserRequestedReplan` event timestamp | Already-handled — `ClockService` injection pattern (`ComposerService.js`) | No change |
| NextBestAction selector (§3.6 — descoped) | DMAIC path uses existing DAG; AD_HOC path uses `actions[]` array order | If funded later: explicit `actions[].sortIndex` tiebreak |

**No new determinism break in the recommended subset.** Composer remains a pure function; new additions are additive snapshot fields with deterministic computation order.

## 9. Test Seam Audit

- **Suite baseline:** 2,681 tests post-Iteration 13.
- **Suite runtime:** 1.86s of 3.5s budget (47% headroom).
- **Estimated test additions per accepted item:**
  - §3.4 `WhyThisPlan` component: ~25 tests (rule-grouping, dedupe, empty-state, every R-rule covered, T1-token regression lock).
  - §3.10 Replan button + event: ~15 tests (state transitions for PROPOSED→PROPOSED-replaced, ACCEPTED→confirmation flow, event emission).
  - §3.7 UnscheduledWorkTray: ~20 tests (composer field shape, UI tray render, drop-reason coverage).
  - §3.5(a) Tight-day INFEASIBLE variant: ~10 tests.
  - §3.1(c) WorkType label aliasing: ~8 tests.
- **Total delta: ~78 tests → 2,759.** Runtime impact at avg 0.7ms/test ≈ +55ms. Suite stays comfortably under budget.
- **Visual regression strategy:** the existing T1 pattern (`tests/ui/bucketMeta.regression.test.js` per `T1_TOKEN_SPEC §2.4`) — text-render snapshots on each component's emitted HTML string. Apply the same pattern to any new component (WhyThisPlan, Replan button skin, UnscheduledWorkTray).

## 10. Per-Item Sizing for Today-bounded Candidates

| ID | Title | Estimate | Risk (1-5) | Prerequisites | Blast radius |
|---|---|---|---|---|---|
| C-UX-12 | "Why this plan?" panel | S (1–2d) | 1 | None — `why[]` already persisted | Today.js: +1 component. No composer change. No persistence change. |
| C-UX-13 | Reframe BucketStrip as Balance Meter | S (1d) | 2 | UX owns visual; honor T1 freeze | `BucketStrip.js` CSS only; no DOM structure change recommended. |
| C-UX-14 | One-click Replan | S (1–2d) | 3 | New `UserRequestedReplan` event | Today.js + new event const + ComposerService listener. R-CP-5: needs loading state. |
| C-UX-15 | NextBestActionCard | M (3–4d) | 4 | **Blocked on E13/E18 for phased types**; DMAIC+AD_HOC unblocked | New selector + new component + Today.js layout slot. **Recommend defer.** |
| C-UX-16 | UnscheduledWorkTray | S–M (2–3d) | 2 | Composer field addition (§3.7) | composeDaily.js +1 field; new tray component; no migration. |
| C-UX-17 | Energy-window awareness | M (4–5d) | 4 | Schema add + composer scoring rule | composeDaily.js scoring change — R-CP-1 high risk. **Recommend defer.** |

Plus PM-territory additions:
- HorizonSelector (display only): **S (1d)** — recommend only if PM declares acceptance-critical.
- Structured ConflictWarning (new field): **M (3–4d)** — recommend NOT funding; reuse INFEASIBLE.

## 11. Total Capacity Cost

| Item | Estimate (eng-days) | At BAM 24h/week (3d/wk) | Calendar weeks |
|---|---|---|---|
| C-UX-12 Why panel | 2 | | 0.7 |
| C-UX-13 Balance Meter polish | 1 | | 0.3 |
| C-UX-14 Replan button + event | 2 | | 0.7 |
| C-UX-16 UnscheduledWorkTray | 3 | | 1.0 |
| §3.5(a) tight-day INFEASIBLE variant | 1 | | 0.3 |
| §3.1(c) WorkType label alias | 1 | | 0.3 |
| Buffer (test churn + integration) | 2–4 | | 0.7–1.3 |
| **TOTAL (recommended)** | **12–14d** | | **4.0–4.7 weeks** |
| Stretch (HorizonSelector display-only) | +1 | | +0.3 |
| Stretch (NextBestAction DMAIC-only) | +3 | | +1.0 |
| **TOTAL (with stretch)** | **16–18d** | | **5.3–6.0 weeks** |

If §3.2 (energy) and §3.6 (full NextBestAction) and §3.8 (PlanningPreference) are also funded, total balloons to **30–40d / 10–13 weeks** — that is a separate epic, not a Today increment.

**MVP timeline shift at recommended scope: 3.0–4.0 weeks** (one MVP epic slot).

## 12. Sequencing Recommendation

Defer to PM's recommended sequencing. Architect adds two ordering constraints:

1. **WorkType label alias (§3.1c)** must land before any new component the brief introduces, because every new component will reach for `bucketMeta` and we want the long-label additions in place once.
2. **Why panel (§3.4)** has no prerequisites and is the highest signal-to-effort win. Recommend it first to validate the rationale-rendering pattern before building dependent surfaces.
3. **UnscheduledWorkTray (§3.7)** must follow Replan button (§3.10) — replan is what creates the user expectation that "things didn't fit, here's why."
4. **NextBestActionCard (§3.6)** must wait for E13 to land. Document the dependency loudly in PRD so it isn't promised to users prematurely.

No deviations from PM sequencing expected for the recommended subset.

## 13. Risk Register

| ID | Risk | P | I | Mitigation |
|---|---|---|---|---|
| R-CP-1 | Energy-window scoring breaks composer determinism | Med | High | Defer §3.2; if funded, require explicit `catalogEntryId` ASC tiebreak per existing `pickCI` pattern; add deterministic-replay test. |
| R-CP-2 | NextBestAction depends on E13/E18 (unshipped) | High | Med | Descope phased-type paths; ship DMAIC+AD_HOC only or defer entirely. Re-open when E13 lands. |
| R-CP-3 | Why-panel surface area drift (composer adds rules without UI knowing) | Med | Low | The `WhyThisPlan` component must accept ANY `rule` string and render with sensible default grouping — no rule allowlist. Add a regression test that asserts every existing composer R-rule has a label entry; failing label = "rule needs UI mapping." |
| R-CP-4 | Balance-Meter visual change regresses T1 tokens | Low | High | UX visual change MUST go through `bucketMeta` (no new bucket-color variables); add T1 regression test per `T1_TOKEN_SPEC §2.4`. |
| R-CP-5 | Replan exposes user to compose latency | Med | Med | Add loading state on the button (existing AutoPlanButton has it: `loading` prop disables + shows "Composing…", `AutoPlanButton.js:25-27`). For >500ms, gate behind a confirm dialog if composition is ACCEPTED (don't blow away accepted state silently). |
| R-CP-6 | UnscheduledWorkTray creates implicit "things will be picked up tomorrow" expectation | Med | Med | Tray copy must say explicitly: "These didn't fit today. They'll be reconsidered when you Auto-Plan tomorrow IF they're non-optional." Variance-rescue path is already specced; just be honest about it. |
| R-CP-7 | Why panel exposes rule names like `R5_DEEP_PAYLOAD` to users (developer codes leaking into UI) | High | Low | Mandatory rule→user-label map. PM owns final copy; architect provides the map shape and the failing-test gate. |
| R-CP-8 | WorkType-as-alias (§3.1c) creates two names for the same concept in copy and code | Low | Med | Document in `GLOSSARY.md`: "Internal: PROJECT/COMMUNICATION/CI. User-facing: Deep Work / Communication / Improvement. Both refer to the same Bucket field." Forbid mixing in code review. |

## 14. Open Architectural Questions

1. **Does PM accept renaming "Bucket" labels to "Deep Work / Communication / Improvement" in user copy while keeping internal enum?**
   *Default if silent:* Yes — adopt §3.1(c). Saves 8d.
2. **Is HorizonSelector acceptance-critical for the brief or aspirational?**
   *Default if silent:* Aspirational; descope.
3. **Should Replan replace an ACCEPTED composition without confirmation, or always prompt?**
   *Default if silent:* Always prompt when composition is ACCEPTED (data already entered into the day). Replace silently when composition is PROPOSED.
4. **NextBestAction: ship DMAIC+AD_HOC subset now, or wait for E13?**
   *Default if silent:* Wait for E13 to avoid mixed-mode inconsistency on the Today page.
5. **UnscheduledWorkTray: tray location (right rail next to UpNextRail) or banner above CycleCard?**
   *Default if silent:* Banner above CycleCard — INFEASIBLE banner already lives there; tray is a single-row extension of that pattern.
6. **Does the brief's `30/60/90 min` (§2) override the existing `2x2h | 4x1h` `User.deepSlicePreference`?**
   *Default if silent:* No. Existing chip-based slot resize (Sprint 13) covers the 30/60/90 use case; deepSlicePreference governs initial composition only.
7. **Do we emit a `PlanExplanationGenerated` event?**
   *Default if silent:* No. The `why[]` array is part of the existing `CycleProposed` event payload via the persisted `composerInputsSnapshot.explain`. New event would be redundant.

## 15. Recommendation

**PROCEED-WITH-DESCOPE.**

The 14-module brief reads as aspirational comprehensive scope. Architectural triage shows ~85% is already built or named under different vocabulary, ~5% is genuinely Today-additive (Why panel, Replan button, UnscheduledWorkTray, WorkType label alias, BalanceMeter polish), and ~10% is either out-of-scope-for-Today (Portfolio, OpportunityScore, CalendarExport, OpportunityScoreCard) or blocked on existing roadmap epics (NextBestAction needs E13). The cheap-and-correct path is 12–14 engineer-days (3.0–4.0 calendar weeks) shipping §§3.4 + 3.10 + 3.7 + 3.5(a) + 3.1(c). Energy-windows (§3.2), full NextBestAction (§3.6), and PlanningPreference (§3.8) should be deferred — each is moderate-cost (3–5d) and gated on either (a) E13 unshipping, or (b) friction-signal evidence that the feature is actually missing for users. Do not fund a WorkType rename (§3.1a) — it is an 8-day no-functional-benefit tax. Honor the T1 token freeze for any visual change.
