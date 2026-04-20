# BAM-X Kaizen OS — Delivery Plan

Owner: Product Manager (delivery-engineering bias)
Status: v0.2 — v0.2 adds **E13 — 30-Day Kaizen Accelerator Project Type** per coordinator decision 2026-04-19 (see `ARCHITECTURE.md §9` item 15). Adds MVP hooks on E1 and E10 (Kaizen/CatalogEntry schema fields, disabled nav placeholder). Timeline extends from ~75 → ~100 project days. Adds R13 (procedure-text blocker) and R14 (Phase 2 4-2-2 pressure) to §5. Grounded in `PRODUCT_BLUEPRINT.md` v0.3, `ARCHITECTURE.md` v0.4, `ENGINE_DESIGN.md` v0.3, `CATALOG_GAPS.md` v0.1 + new §I, `UX_FLOWS.md` v0.2.2, and `PROJECT_TYPE_30D_KAIZEN.md` v0.1.
Capacity assumption (global): 1 FTE engineer. 60% to this project per the BAM 4-2-2 model on a 40h/week — **24h PROJECT / week; 48h PROJECT / sprint (2 weeks).** This is the only capacity used below. No second engineer assumed.

Estimate buckets: **S ≤ 2d**, **M 2–5d**, **L 5–10d**. "Day" = 6 PROJECT hours (standard BAM workday). An S task consumes ≤ 12h, an M 12–30h, an L 30–60h.

MVP scope is bounded by blueprint §4.1 (5 must-haves) + §4.2 Should-wait excluded + §4.3 Excluded never considered. Nothing in this plan extends beyond §4.1.

---

## 1. Epic Breakdown

Thirteen epics. Each is 5–15 engineer-days. Each names its MVP must-have, traces to source docs, names upstream dependencies, and states its DONE artifact.

| Epic | Title | MVP must-have served | Traces to | Depends on | DONE definition |
|---|---|---|---|---|---|
| **E1** | Core State Foundation | (1) Catalog, (2) Daily composer, (3) Weekly composer, (4) Reflection+Kaizen, (5) Dashboard — *all* depend on it | `ARCHITECTURE §1.1, §2.1–§2.13, §6, §7.1`; `ENGINE_DESIGN §5` | — | Entity models (14 entities, 4 FSMs) exercised by unit tests. `EventBus.publish/subscribe` + `LocalStorageRepository` with `appendOnly` passing append-only-violation test. Boot path loads empty state + seeds `bamx:v1:meta`. |
| **E2** | Catalog Seed + Service | (1) Standard Work Catalog as seeded data | `CATALOG_GAPS §A–D, §E, §H.1, §H.2`; `ARCHITECTURE §2.2, §8`; `ENGINE_DESIGN §3` | E1 | 60 `CatalogEntry` rows seeded (50 src + 6 ceremonies + 4 generics). DAG validation passes on seed. `CatalogService.disable(id)` rejects on `isNonOptional=true`. `/catalog` route reads + writes `enabledByUser`. |
| **E3** | Composer Engine | (2) Daily composer, (3) Weekly composer | `ARCHITECTURE §4.1–§4.7`; `ENGINE_DESIGN §1.1–§1.9, §3.2, §3.3` | E1, E2 | `composeDaily(input)` + `composeWeekly(input)` produce `PROPOSED` compositions from the locked DAILY_NON_OPTIONAL_SET. `pickCI`, `selectDeepPayload`, `eligibleDmaicPayloadSteps`, `orderDay` each unit-tested. INFEASIBLE returns `InfeasibleResult` per §4.7 with all 4 `suggestedActions`. `ComposerInfeasible` event emits. |
| **E4** | Capacity + Invariant Engine | (2) Daily composer, (3) Weekly composer | `ARCHITECTURE §5.1–§5.6, §8`; `ENGINE_DESIGN §2.1–§2.6` | E1 | `computeBucketTargets/Floors/Ceilings`, `validateComposition`, `validateWeekly`, `canRebucket` all unit-tested. Daily 4-2-2 enforced at every composition save; blocked save on floor/ceiling/over-capacity/non-optional-missing. `externalMinutesToday` drains COMMUNICATION per §5.5. |
| **E5** | Activity Runtime | (1) completion yields artifact, (4) reflection infrastructure | `ARCHITECTURE §2.5, §3.2, §6.1`; `ENGINE_DESIGN §5.2`; `UX_FLOWS §2.2, §2.5, §4.4, §4.5` | E1, E2 | `ActivityService.start/close/skip` enforce guards (output artifact at close, reason code on skip, `OTHER` requires note, atomic Variance emit, `ActivityStartedLate` when >5m late, PDCA-orphan-tick block). Output artifact form renders for all 5 schemas. |
| **E6** | Reflection Runtime | (4) end-of-cycle reflection + Kaizen promotion | `ARCHITECTURE §2.6, §2.8, §6.1 §6.2`; `ENGINE_DESIGN §4.4, §5.5`; `UX_FLOWS §2.2 step 4, §2.3, §5.4` | E1, E5 | `ReflectionService.stubOnClose` subscribes to `ActivityCompleted`, auto-stubs `pending=true`. `capture()` flips `pending=false`, emits `ReflectionCaptured` with 15-min on-time flag. `FrictionSignalCaptured` emits when flagged. `KaizenCandidateQueue.cluster()` groups by tag with dismissed-cluster retention. |
| **E7** | Kaizen Lifecycle | (4) Kaizen promotion, close-with-evidence | `ARCHITECTURE §2.9, §2.10, §2.11, §3.3`; `ENGINE_DESIGN §4.3, §5.3`; `UX_FLOWS §2.3 step 4, §2.4` | E1, E6 | `KaizenService.promote/lockBaseline/startRemeasurement/close/abandon` enforce FSM + HARD RULE (close requires matching-metric remeasurement). MVP cap (1 active). Abandon path transitions to DRAFT with `abandoned=true`, never to CLOSED. `readyToRemeasure` computed property. |
| **E8** | PDCA Experiment + DMAIC DAG Payload | (4) Kaizen — DMAIC-backed payload + PDCA cadence | `ARCHITECTURE §2.13, §4.5 R9, §9 item 12`; `ENGINE_DESIGN §4.1, §4.2` | E1, E3, E7 | `PdcaExperiment` FSM (PLAN/DO/CHECK/ACT/CLOSED) with graduation on 3 consecutive hits. `ActivityService.start()` rejects orphan #12 tick when an experiment is open. `eligibleDmaicPayloadSteps` walks the DAG via `CatalogEntry.dependsOn`; `pickHighestPriority` enforces phase-match → recency → catalog-order tiebreak. Deep block carries `linkedDmaicStepRef`. |
| **E9** | Metrics + Insights | (5) Adherence + composition dashboard | `ARCHITECTURE §2.12, §6.2`; `ENGINE_DESIGN §5.7`; `UX_FLOWS §3.9, §6.1–§6.4`; blueprint §7.2, §7.3, §7.4 | E5, E6, E7 | `MetricsService.recompute` subscribes to event set; writes `MetricsSnapshot` for rolling 14-day window. `getLatestSnapshot(userId)` returns sync. `AdherenceDial` on `/today` shows the three blueprint §4.1 item 5 numbers. `/insights`, `/insights/variance`, `/insights/friction` read-only. Variance correction is a new row; no edit. |
| **E10** | UI Shell | (2)(3)(4)(5) — all UI surfaces | `UX_FLOWS §1.1–§1.4, §2.1–§2.5, §3, §4.1–§4.7, §6` | E3, E5, E6, E7, E9 | 5 top-level routes (`/today`, `/week`, `/catalog`, `/kaizen`, `/insights`) + sub-routes per §1.2. All 10 components (CycleCard, BucketStrip, ScheduledActivityBlock, CatalogPicker, IntentionField, ReflectionSheet, WeeklyReflectionWizard, KaizenCard, AdherenceDial, VarianceLogEntry) render empty/loading/success/error states. All 5 flows (§2.1–§2.5) demoable end-to-end. |
| **E11** | Coaching Microcopy System | (4)(5) — reflection nudges + adherence coaching | `UX_FLOWS §4.6, §5.1–§5.10` | E9, E10 | 10 named triggers emit inline coaching strings per §5. Inline, non-blocking, ≤ 20 words, no emoji. Triggers wired to events (`CycleAccepted` first time, `CycleEdited` x3, `VarianceLogged` reasonCode=ESCALATION x2/week, reflection-capture lateness, `KaizenActivate` with 0 actions, composer drop-rule violations, `FrictionSignalCaptured` x3 same tag, 2-consecutive-pending reflections, `CycleRejected` confirm). |
| **E12** | Persistence + Migration | Data integrity for (1)–(5) | `ARCHITECTURE §7.1, §7.2, §7.6`; `ENGINE_DESIGN §5.6` | E1 | `bamx:v1:meta.schemaVersion` read on boot; migration runner executes pending steps forward-only with pre-migrate backup. `exportData()` / `importData()` round-trip passes golden-blob test. Port-compat validator confirms no "embedded children" hacks. `bamx:v1:variances` `appendOnly` enforced. `bamx:v1:clusterDismissals` + `bamx:v1:pdca` keys provisioned. |
| **E13** | 30-Day Kaizen Accelerator Project Type | (6) 30-Day Kaizen Accelerator — phased Kaizen with ROI gate | `PROJECT_TYPE_30D_KAIZEN.md §1–§11`; `ARCHITECTURE §2.2, §2.9, §3.4, §6.1, §8, §9 item 15`; `ENGINE_DESIGN §4.2`; `UX_FLOWS §3.8, §3.12, §1.2`; `CATALOG_GAPS §I` | E2 (catalog seed), E7 (Kaizen lifecycle), E10 (UI shell) | 31 Accelerator catalog entries seeded with `projectTypeBinding` + `phaseBinding`; Phase FSM + `canAdvancePhase()` + `advancePhase()` land + unit-tested per `PROJECT_TYPE_30D_KAIZEN.md §4`; composer `eligibleDmaicPayloadSteps` filters by phase; `RoiEngine.computeRoi` + `KaizenService.applyRoiArtifact` pure-function-tested; `KaizenCard` renders `PhaseStepper` + `RoiPanel` gated on `projectType`; `/kaizen/:id/phase/:phaseId` and `/kaizen/:id/roi` routes live; `AcceleratorPaceWarning` emits on prior-phase duration over target; close refused without captured ROI. |

**Dependency graph (execution order):**

```
E1 ─┬─ E2 ─┬─ E3 ─┬─ E8 ─┐
    │      │      │      │
    │      │      └─ E10 ─ E11
    │      │             │
    │      └─ E5 ─ E6 ─ E7 ┘
    │                     │
    ├─ E4 (parallel w/ E3)┤
    │                     │
    └─ E12 (parallel w/ E1 from day 1)
                          │
                          └─ E9 (after E5/E6/E7)

E2 ─┐
E7 ─┼─► E13 (30-Day Accelerator — after E2 + E7 + E10)
E10 ┘
```

---

## 2. Detailed Backlog

### E1 — Core State Foundation

| ID | Title | Scope (≤ 25 words) | Primary artifact / signature | Deps | Output | Estimate |
|---|---|---|---|---|---|---|
| E1-T1 | JSDoc typedefs for all 14 entities | Author typedefs exactly matching `ARCHITECTURE §2.1–§2.13` fields. No new fields. | `/js/domain/types.js` with typedefs for `CatalogEntry`, `User`, `Composition`, `ScheduledActivity`, `Reflection`, `Variance`, `FrictionSignal`, `Kaizen`, `BaselineMetric`, `Remeasurement`, `MetricsSnapshot`, `PdcaExperiment` | — | 14 typedefs committed; grep shows every field named in architecture is present. | S |
| E1-T2 | `EventBus` module | In-memory pub/sub, synchronous dispatch, subscribe-idempotent. | `/js/events/EventBus.js`: `subscribe(event, fn)`, `publish(event, payload)` | E1-T1 | Unit tests: subscribe → publish → handler fired; double-subscribe no-op; unknown-event publish is no-op. | S |
| E1-T3 | MVP event catalog constants | Named constants for all 18 events in `ARCHITECTURE §6.1`. | `/js/events/events.js` exporting string constants | E1-T2 | Constants named verbatim per §6.1; import-shape unit test. | S |
| E1-T4 | `LocalStorageRepository` | Read/write/upsert per `ARCHITECTURE §7.1`. `bamx:v1:*` key prefix. | `/js/persistence/LocalStorageRepository.js`: `read`, `write`, `upsert`, `appendOnly` | E1-T1 | `APPEND_ONLY_VIOLATION` thrown on overwrite of existing key in appendOnly map. JSON round-trip test on each entity type. | M |
| E1-T5 | `IRepository` interface contract | Interface that future Postgres adapter will implement. | `/js/persistence/IRepository.js` with documented methods | E1-T4 | Services compile against interface only; localStorage impl passes contract test. | S |
| E1-T6 | Boot path | Load meta; if missing, create. Hydrate services from repo. | `/js/boot.js` | E1-T4, E1-T5 | First load creates `bamx:v1:meta` with `schemaVersion:1`; subsequent loads read it. | S |
| E1-T7 | Composition FSM guard module | Pure functions that assert legal transitions per `ARCHITECTURE §3.1`. | `/js/domain/fsm/composition.js`: `canTransition(from, to, ctx)` | E1-T1 | Illegal transitions (PROPOSED → ACTIVE direct) throw; legal ones return `{ok:true}`. Unit tested against the full table in §3.1. | S |
| E1-T8 | ScheduledActivity FSM guard module | Same, for SA. Includes IN_PROGRESS → SKIPPED disallow per §3.2. | `/js/domain/fsm/scheduledActivity.js` | E1-T1 | Unit test: IN_PROGRESS → SKIPPED throws; close requires outputArtifact+reflection (non-optional); skip requires reasonCode. | M |
| E1-T9 | Kaizen FSM guard module (HARD RULE) | Close requires `remeasurementId !== null` AND matching metric. Abandon → DRAFT only. | `/js/domain/fsm/kaizen.js` | E1-T1 | Unit test: close without remeasurement throws `REMEASUREMENT_REQUIRED`. Abandon never reaches CLOSED. | M |
| E1-T10 | Schema typedefs for Accelerator project-type fields | Add `ProjectType` enum + `Kaizen.projectType/phase/phaseDefinitions/implementationCostDollars/annualBenefitsDollars/startDate/controlPlanArtifactRef`, plus `CatalogEntry.projectTypeBinding/phaseBinding`. MVP hook for Next's E13. | Edits to `/js/domain/types.js` | E1-T1 | Typedefs match `ARCHITECTURE.md §2.2, §2.9`. Default `projectType='AD_HOC'` on legacy-Kaizen migration. | S (≤ 0.5d) |

**E1 total: 10 tasks (1S + 3S + 1M + ...) ≈ 8.5–10.5d (L epic).**

---

### E2 — Catalog Seed + Service

| ID | Title | Scope | Artifact | Deps | Output | Estimate |
|---|---|---|---|---|---|---|
| E2-T1 | **BLOCKER — resolve `CATALOG_GAPS §F` open questions** | Phil decision required: #17 status, #19/#20/Quarterly durations, DMAIC procedure source, Ch.14 role overlay, §E bulk-fill accept, external template status. | Written decisions in `CATALOG_GAPS.md §F` resolved; catalog seed builder unblocked. | — | All 6 §F questions marked RESOLVED. | S (Phil-time, not engineering) |
| E2-T2 | Seed loader for 50 source rows | Parse `docs/Business Agility Standard Work.txt` into 50 `CatalogEntry` drafts with source-row metadata. | `/js/catalog/seed/source50.js` | E2-T1, E1-T1 | 50 entries produced; `sourceRef` points to the correct row. | M |
| E2-T3 | Seed ceremonies + generics | 6 BAM ceremonies + 4 generics per `CATALOG_GAPS §H.2`. | `/js/catalog/seed/ceremoniesAndGenerics.js` | E2-T1, E1-T1 | 10 additional entries with `bucket` assigned from §H.1. | S |
| E2-T4 | Apply §A–D content fills | Durations, procedures, inputs, outputs, participants, triggers from `CATALOG_GAPS §A–§D`. | Seed patch step in `/js/catalog/seed/fillGaps.js` | E2-T1, E2-T2 | 23 rows updated with §A–D content. Test: every patched field is non-empty. | M |
| E2-T5 | Apply §E bulk-fill defaults | For remaining rows, apply §E.1–§E.5 rules for cadence, inputs, outputs, participants, trigger. | Seed patch step in `/js/catalog/seed/bulkFill.js` | E2-T4 | All 60 entries have all 9 required fields. Test: no null/empty field on any entry. | M |
| E2-T6 | Apply §H.1 bucket mapping | Assign `bucket` per the approved table. DMAIC #20–41 = PROJECT; Kaizen #42–50 = PROJECT. | Seed patch step in `/js/catalog/seed/bucketMap.js` | E2-T4 | `bucket` set on all schedulable entries. Test: every entry the Daily composer can place has a bucket. | S |
| E2-T7 | Mark non-optional set | Flip `isNonOptional=true` on the locked §3.4 list: Daily Standup, AM Comm, Post-lunch Comm, End-of-Activity Reflection, Sprint Planning, Mid-Sprint Review, Sprint Review, Sprint Retrospective, Weekly Reflection. | Seed patch in `/js/catalog/seed/markNonOptional.js` | E2-T3 | Matching the `DAILY_NON_OPTIONAL_SET` + weekly + sprint lists in `ENGINE_DESIGN §3.4`. | S |
| E2-T8 | Author DMAIC DAG edges (`dependsOn`) | Phase-aware edges: Charter #20 → SIPOC #21; SIPOC → Stakeholder #23 + Comm Plan #24 + Risk #25; DCP #22 → Baseline #28 → Control Chart #29, Capability #30; VOC/VOB/VOA #26 → C&E #34; Detailed Process Maps #32 → C&E #34; C&E #34 → Input DCP #35 → Correlation #36 → FMEA #37 → Backlog #38 → Financial #39 → Implemented #40 → Narrative #41. | Seed patch in `/js/catalog/seed/dmaicDag.js` | E2-T2 | Edge set committed; cycle-free validator passes. | M |
| E2-T9 | `CatalogService` | `list(userId)`, `toggleEnabled(id, userId)`, `validateDag()`. Rejects disable on non-optional. | `/js/services/CatalogService.js` | E2-T2..T8, E1-T4 | Unit tests: non-optional disable rejected; DAG validator catches cycles. | M |

**E2 total: 9 tasks ≈ 8–11d.**

---

### E3 — Composer Engine

| ID | Title | Scope | Artifact | Deps | Output | Estimate |
|---|---|---|---|---|---|---|
| E3-T1 | `ComposerInput` contract | Build the input object from User, Composition history, signals. | `/js/composer/buildInput.js` | E1, E2 | Returns exact `ENGINE_DESIGN §1.1` shape. Unit test against fixture User. | S |
| E3-T2 | `computeBucketTargets` | Half-day scaling + external drain + COMM floor 60. | `/js/capacity/computeBucketTargets.js` | E1, E4-T1 | Unit tests for full day, half day, ext=60, ext=150 (floor clamp). | S |
| E3-T3 | `composeDaily` — 10-step algorithm | Non-optionals → variance rescue → phase ceremony → deep payload → CI rotation → comm filler → order → validate → retry-or-INFEASIBLE → build. | `/js/composer/composeDaily.js` | E2-T9, E3-T1, E3-T2, E4-T2 | Golden fixture test: the §1.9 worked example produces the exact 10-row composition. | L |
| E3-T4 | `pickCI` heuristic | Priority table 100/95/80/60/40/20 exactly per `ENGINE_DESIGN §1.5`. Stable tiebreak by `id`. | `/js/composer/pickCI.js` | E3-T1 | Unit tests per priority tier. Determinism test: same input → same output across 100 runs. | M |
| E3-T5 | `selectDeepPayload` + `eligibleDmaicPayloadSteps` | DAG traversal via `dependsOn`; returns generic Deep when nothing eligible. | `/js/composer/selectDeep.js`, `/js/composer/eligibleDmaic.js` | E2-T8, E7 | Eligibility test: before prerequisites closed → empty; after → unlocked step returned. | M |
| E3-T6 | `pickHighestPriority` (DMAIC) | Phase match → recency → activityNumber. | `/js/composer/pickHighestPriority.js` | E3-T5 | Deterministic tiebreak test. | S |
| E3-T7 | `orderDay` | Anchor Daily Standup 09:00 etc.; Deep-before-lunch; CI toward close; Reflection meta-slot 17:00 last. | `/js/composer/orderDay.js` | E3-T3 | Time-anchor test: Standup < AM Comm < Deep1 < Lunch < Deep2 < CI blocks < Reflection. | M |
| E3-T8 | `sliceDeep` | 2×2h default, 4×1h when `User.deepSlicePreference='4x1h'`. | `/js/composer/sliceDeep.js` | E3-T3 | Test both preference modes produce correct slice count. | S |
| E3-T9 | INFEASIBLE path + `suggestedActions` | Return `InfeasibleResult` shape per `ARCHITECTURE §4.7` + `ENGINE_DESIGN §1.8`. Never silently truncate. Emit `ComposerInfeasible`. | `/js/composer/infeasible.js` | E3-T3 | Force-infeasible test: 60-min capacity → `{kind:'INFEASIBLE', shortfallMinutes:..., suggestedActions:[...]}`. | M |
| E3-T10 | `composeWeekly` — W1..W5 steps | Five daily compositions + weekly non-optional attach + cross-day PROJECT ≥ 1200 invariant + rebalance. | `/js/composer/composeWeekly.js` | E3-T3, E4-T4 | Weekly golden test: Mon-Fri produces 5 dailies + Weekly Reflection anchored Fri PM. | L |
| E3-T11 | Composer accept/edit/reject APIs | `ComposerService.accept/acceptEdited/reject/tickClock`. Atomic flips per `ENGINE_DESIGN §5.1`. | `/js/services/ComposerService.js` | E3-T3, E3-T10, E1-T7 | Atomic transition: composition + children flip together. Rollback on failure. | M |
| E3-T12 | Composer variance queue subscriber | On `VarianceLogged kind=SKIPPED_NON_OPTIONAL`: add to next-cycle `varianceQueue`. | Subscription wiring in `ComposerService` | E3-T11, E1-T2 | Skip today → composer rescues tomorrow (flagged `carriedOver:true`). | S |

**E3 total: 12 tasks ≈ 13–15d.**

---

### E4 — Capacity + Invariant Engine

| ID | Title | Scope | Artifact | Deps | Output | Estimate |
|---|---|---|---|---|---|---|
| E4-T1 | `computeBucketFloors/Ceilings` | 50% floor; 110% PROJECT / 125% COMM-CI ceilings. | `/js/capacity/floorsAndCeilings.js` | E1 | Matches `ENGINE_DESIGN §2.2`. | S |
| E4-T2 | `validateComposition` | All 9 failure codes. Returns `{ok, failureCode, detail}`. | `/js/invariant/validateComposition.js` | E4-T1 | Each failure code has a unit test producing its exact detail object. | M |
| E4-T3 | `validateWeekly` + `rebalanceWeeklyProject` | PROJECT ≥ 1200 across 5 days; per-day ≤ cap; CI → PROJECT rebalance. | `/js/invariant/validateWeekly.js` | E4-T2 | Tests: shortfall triggers rebalance; un-rebalancable week → INFEASIBLE. | M |
| E4-T4 | `canRebucket` | Pure function used by UI drag-to-rebucket. | `/js/invariant/canRebucket.js` | E4-T2 | Drop-rule test: legal drops return ok; floor-violating drops return fail. | S |
| E4-T5 | `computeVarianceOnClose` — hysteresis 10m | Emits OVERRAN / UNDERRAN variances with `note="+Nm"`. | `/js/invariant/computeVarianceOnClose.js` | E1 | Three tests: delta=5m (no variance), delta=+15m (OVERRAN), delta=-15m (UNDERRAN). | S |
| E4-T6 | Invariant violation message formatter | UI-side message templates per `ENGINE_DESIGN §2.5` + `UX_FLOWS §4.3`. | `/js/invariant/messages.js` | E4-T2 | Every failure code has an exact message with injected numbers. | S |
| E4-T7 | Enforce invariants at every composition save | Wire `validateComposition` into `ComposerService.accept/acceptEdited`. | Wire-up in `ComposerService` | E4-T2, E3-T11 | E2E test: user-edit that violates floor blocks save; inline message shown. | S |

**E4 total: 7 tasks ≈ 6–8d.**

---

### E5 — Activity Runtime

| ID | Title | Scope | Artifact | Deps | Output | Estimate |
|---|---|---|---|---|---|---|
| E5-T1 | `ActivityService.start(id)` | SCHEDULED → IN_PROGRESS; set `actualStartAt`; emit `ActivityStarted`; emit `ActivityStartedLate` if `now - plannedStartAt > 5m`. | `/js/services/ActivityService.js` | E1-T8, E1-T2 | Unit tests for both start paths. Late-start test confirms second event emitted. | M |
| E5-T2 | `ActivityService.close(id, {outputArtifactRef, reflection?})` | IN_PROGRESS → CLOSED; guard: output artifact non-null + schema match; non-optional → reflection row (pending OK); emit `ActivityCompleted`. | Same service | E5-T1, E4-T5 | Guard tests: missing artifact → throw; wrong schema → throw; non-optional without reflection stub → throw. | L |
| E5-T3 | Output artifact schema validator | TEXT / TWO_LIST / NUMERIC / DOCUMENT / CHART per `UX_FLOWS §4.5`. | `/js/artifacts/validate.js` | E1 | 5 schema tests. | S |
| E5-T4 | `ActivityService.skip(id, {reasonCode, note})` | Non-optional only. Atomic emit of `Variance { kind: SKIPPED_NON_OPTIONAL }`. `reasonCode=OTHER` requires non-empty note. IN_PROGRESS → SKIPPED disallowed. | Same service | E1-T8, E12 (appendOnly) | Atomicity test: either both repo write + event fire, or neither. OTHER-without-note rejected. | M |
| E5-T5 | PDCA orphan-tick block | `start()` rejects catalog #12 without `linkedPdcaExperimentId` if user has an open experiment. | Guard in `ActivityService.start` | E5-T1, E8 | Unit test: open experiment + orphan #12 → throw `PDCA_ORPHAN_TICK`. | S |
| E5-T6 | `VarianceService.log()` | Append-only insert. Rejects on duplicate id. Enforces OTHER-requires-note. | `/js/services/VarianceService.js` | E1-T4 (appendOnly) | Append-only test: second write with same id throws. | S |
| E5-T7 | Auto-skip-at-day-close | `ClockService.tickClock()` sees composition `endAt` with un-started SCHEDULED non-optional → modal reason-code prompt; on confirm → skip. | Wire in ClockService | E5-T4 | E2E test: close-day with unstarted block triggers modal. | M |

**E5 total: 7 tasks ≈ 7–9d.**

---

### E6 — Reflection Runtime

| ID | Title | Scope | Artifact | Deps | Output | Estimate |
|---|---|---|---|---|---|---|
| E6-T1 | `ReflectionService.stubOnClose` | Subscribes to `ActivityCompleted`. If parent catalogEntry non-optional, writes `Reflection{ pending:true }`, emits `ReflectionStubbed`. | `/js/services/ReflectionService.js` | E5-T2, E1-T2 | E2E test: close non-optional → pending reflection row exists. | M |
| E6-T2 | `ReflectionService.capture(id, {whatWentWell, whatToImprove, frictionFlag})` | Flip `pending=false`, set `capturedAt=now`. Emit `ReflectionCaptured { onTime }`. At least one text field required. If `frictionFlag` → create `FrictionSignal`. | Same service | E6-T1 | Guard test: empty both fields → reject. onTime=true iff `capturedAt - actualEndAt <= 15m`. | M |
| E6-T3 | `ReflectionService.captureWeekly(dmaicDraft, promoteClusterId?)` | `kind=WEEKLY`; all 4 DMAIC fields required. Closes the Weekly Reflection activity. Emits `WeeklyReflectionCompleted`. | Same service | E6-T2, E7-T1 | Test: empty DMAIC field → cannot save. Promote path creates Kaizen. | M |
| E6-T4 | `FrictionSignalService` | Create, tag, transition OPEN → CLUSTERED → PROMOTED/DISMISSED. | `/js/services/FrictionSignalService.js` | E6-T2 | FSM tests match `ENGINE_DESIGN §5.4`. | S |
| E6-T5 | `KaizenCandidateQueue.cluster` | Group OPEN signals by tag; recency score; top-3 for WeeklyReflectionWizard step 4. | `/js/queue/KaizenCandidateQueue.js` | E6-T4 | Deterministic ordering test. | M |
| E6-T6 | Dismissed-cluster retention | On dismiss, append to `bamx:v1:clusterDismissals`. Expose "similar-dismissed-N-weeks-ago" lookup by tag. | Same queue module | E6-T5, E12 | Test: dismiss cluster; next week same tag → lookup returns N weeks. | S |
| E6-T7 | 15-min on-time banner wiring | "N reflections pending" banner on `/today`; links back to ReflectionSheet; `pending → false` on capture. | `/js/ui/PendingReflectionBanner.js` | E6-T2, E10 | UI test: stubbed reflection → banner shows. Capture → banner hides. | S |

**E6 total: 7 tasks ≈ 7–9d.**

---

### E7 — Kaizen Lifecycle

| ID | Title | Scope | Artifact | Deps | Output | Estimate |
|---|---|---|---|---|---|---|
| E7-T1 | `KaizenService.promote(cluster)` | Create Kaizen in DRAFT with `sourceFrictionSignalIds`. MVP cap: reject if any existing Kaizen in ACTIVE or IN_REMEASUREMENT. Emit `KaizenPromoted`. | `/js/services/KaizenService.js` | E1-T9, E6-T5 | Cap test: promote twice → second rejects `KAIZEN_CAP_REACHED_MVP`. | M |
| E7-T2 | `KaizenService.lockBaseline` | DRAFT → ACTIVE. Requires `goalStatement`, ≥ 1 action, baseline row `locked=true`. | Same service | E7-T1 | Guard tests for each precondition. | M |
| E7-T3 | `KaizenService.startRemeasurement` | ACTIVE → IN_REMEASUREMENT. No guard on actions (honest-failure close possible). | Same service | E7-T2 | Transition allowed even with open actions. | S |
| E7-T4 | `KaizenService.close` (HARD RULE) | IN_REMEASUREMENT → CLOSED. Guards: `remeasurementId !== null` AND `r.metricDefinitionId === baseline.metricDefinitionId`. Compute `closeKind`. Emit `KaizenClosed`. | Same service | E7-T3 | **HARD-RULE test**: close without remeasurement throws `REMEASUREMENT_REQUIRED`. Metric-mismatch throws `METRIC_MISMATCH`. | M |
| E7-T5 | `KaizenService.captureRemeasurement` | Create Remeasurement row. Compute `deltaAbsolute`, `deltaPercent`, `beatsBaseline`. Emit `KaizenRemeasured`. | Same service | E7-T3 | Delta math test. | S |
| E7-T6 | `KaizenService.abandon` | DRAFT → DRAFT with `abandoned=true`. Never CLOSED. | Same service | E7-T1 | Test: abandon → `/insights` portfolio shows in "abandoned" list, not "closed". | S |
| E7-T7 | `readyToRemeasure` computed property | Returns true iff `state=ACTIVE AND actions.every(a => a.doneAt)`. Not blocking. | Getter on Kaizen view model | E7-T2 | Visibility hint only; does not gate any transition. | S |
| E7-T8 | Baseline `locked` enforcement | Post-save, BaselineMetric rejects updates. | Guard in repo for `bamx:v1:baselines` | E1-T4 | Overwrite test throws. | S |

**E7 total: 8 tasks ≈ 6–9d.**

---

### E8 — PDCA Experiment + DMAIC DAG Payload

| ID | Title | Scope | Artifact | Deps | Output | Estimate |
|---|---|---|---|---|---|---|
| E8-T1 | `PdcaExperiment` entity + FSM module | PLAN/DO/CHECK/ACT/CLOSED transitions per `ARCHITECTURE §2.13, §3` + `ENGINE_DESIGN §4.1`. | `/js/domain/fsm/pdca.js` | E1-T1 | Transition table test (7 rows). | M |
| E8-T2 | `PdcaService.openExperiment` | Guard: no open experiment for user. Write `bamx:v1:pdca`. Emit `PdcaExperimentOpened`. | `/js/services/PdcaService.js` | E8-T1 | MVP cap: second open rejects. | S |
| E8-T3 | `PdcaService.tick` | Called when catalog #12 closes with NUMERIC artifact. Append to `tickActivityIds`, advance FSM, recompute `consecutiveTargetHits`. Graduate on ≥ 3. | Same service | E8-T2, E5-T2 | Graduation test: 3 consecutive target-met ticks → closedReason='GRADUATED'. | M |
| E8-T4 | `PdcaService.abandon / supersedeByKaizen` | Terminal CLOSED transitions with correct `closedReason`. | Same service | E8-T1 | Both paths tested. | S |
| E8-T5 | `eligibleDmaicPayloadSteps` | Already in E3-T5 but here: wire it to Kaizen's active project scope; return entries unlocked by `dependsOn`. Exclude already-closed-for-this-Kaizen. | `/js/composer/eligibleDmaic.js` (finalize) | E2-T8, E3-T5, E7 | DAG test: before SIPOC closed → Stakeholder unavailable; after → available. | M |
| E8-T6 | `linkedDmaicStepRef` on Deep block | Composer writes `{kaizenId, catalogEntryId}` on the Deep `ScheduledActivity`. | Wire in `selectDeepPayload` | E8-T5, E3-T3 | E2E: Deep block on `/today` shows "part of: [Kaizen]" sub-label bound to `linkedDmaicStepRef`. | S |
| E8-T7 | PDCA tick scheduling hook | `pickCI` priority 80 when experiment open AND `hoursSinceLastPdca >= 42`. | Wire in `pickCI` | E3-T4, E8-T2 | Scheduling test: 42h-since-last → placed; 40h → not. | S |

**E8 total: 7 tasks ≈ 6–8d.**

---

### E9 — Metrics + Insights

| ID | Title | Scope | Artifact | Deps | Output | Estimate |
|---|---|---|---|---|---|---|
| E9-T1 | `MetricsService.recompute(userId)` | Subscribes to 8 events per `ARCHITECTURE §6.2`. Writes `MetricsSnapshot` for rolling 14-day window. | `/js/services/MetricsService.js` | E5, E6, E7 | After `ActivityCompleted`, snapshot refreshed; test values match golden calc. | L |
| E9-T2 | `getLatestSnapshot(userId)` sync read | O(1) read from `bamx:v1:metrics latestFor:<userId>`. | Same service | E9-T1 | Every page load <5ms. | S |
| E9-T3 | `adherencePercent` calculator | Non-optional activities closed-with-artifact ÷ scheduled, over 14 days. | Pure fn in `/js/metrics/adherence.js` | E5, E2 | Fixture test: 7/10 non-optional closed → 70%. | S |
| E9-T4 | `compositionAcceptanceDaily/Weekly` | Accepted without edit ÷ proposed, per cycle type. Rejected cycles count against denominator. | Pure fn in `/js/metrics/acceptance.js` | E3-T11 | Edited accept = no; rejected = no. | S |
| E9-T5 | `reflectionRatePercent` | `pending=false AND on-time` ÷ non-optional closes, 14-day window. | Pure fn in `/js/metrics/reflection.js` | E6 | Pending or late → excluded from numerator. | S |
| E9-T6 | `activeKaizenDeltaPercent` | If active Kaizen has remeasurement → deltaPercent; else null. | Pure fn in `/js/metrics/kaizenDelta.js` | E7 | No active Kaizen → null; no remeasurement → null. | S |
| E9-T7 | `/insights` page (read-only) | Renders 3 AdherenceDial numbers + recent variances + recent friction signals. | `/js/ui/pages/Insights.js` | E9-T1, E10 | Clicks into `/insights/variance` and `/insights/friction`. No edit surfaces. | M |
| E9-T8 | `/insights/variance` + Add-correction | Append-only viewer; corrections are new rows with `kind=OTHER note="supersedes …"`. | `/js/ui/pages/VarianceLog.js` | E5-T6, E9-T7 | Correction test: new row created; original unchanged. | S |
| E9-T9 | Variance correction UI in VarianceLogEntry | "Add correction" link only (no edit/delete). | Component wiring | E9-T8 | UI snapshot test: no edit/delete buttons. | S |

**E9 total: 9 tasks ≈ 7–10d.**

---

### E10 — UI Shell

| ID | Title | Scope | Artifact | Deps | Output | Estimate |
|---|---|---|---|---|---|---|
| E10-T1 | Route shell + 5 top-level nav | `/today`, `/week`, `/catalog`, `/kaizen`, `/insights`. Disabled placeholders for `/sprint`, `/month`, `/team`, `/integrations`, `/catalog/editor`. | `/js/ui/router.js`, `/js/ui/Shell.js` | E1-T6 | Nav visible; disabled entries show "Ships in Next" message. | M |
| E10-T2 | `CycleCard` component | Empty/Loading/Success/Error/Invariant-violation states per `UX_FLOWS §3.1`. | `/js/ui/components/CycleCard.js` | E3-T11, E4-T6 | All 5 states render; Accept/Edit/Reject buttons wired. | M |
| E10-T3 | `BucketStrip` component | 3 stacked bars PROJECT/COMMUNICATION/CI; planned + actual overlay; floor dashed line; ceiling overpack pulse. | `/js/ui/components/BucketStrip.js` | E9-T1 | Visual states per §3.2. Used on `/today`, composer Edit, `/week`. | M |
| E10-T4 | `ScheduledActivityBlock` component | 5 variant styles (PROPOSED/SCHEDULED/IN_PROGRESS/CLOSED/SKIPPED). Skip link on non-optional. Start/Close buttons. | `/js/ui/components/ScheduledActivityBlock.js` | E5, E10-T2 | All 5 variants pass snapshot test. | M |
| E10-T5 | `CatalogPicker` component | Grouped by bucket; filtered by role + `enabledByUser`; non-optional not pickable as replacement. | `/js/ui/components/CatalogPicker.js` | E2-T9 | Used only in composer Edit mode. | S |
| E10-T6 | `IntentionField` component | Required on non-optional. Validated at Start. | `/js/ui/components/IntentionField.js` | E10-T4 | Start rejected when empty on non-optional. | S |
| E10-T7 | `ReflectionSheet` component | Plan-vs-actual pre-filled; one free-text field; friction checkbox; Save + Skip (Skip disabled on non-optional). | `/js/ui/components/ReflectionSheet.js` | E6-T2, E5-T2 | All 5 states per §3.6. Flow 2.2 step 4 demoable end-to-end. | M |
| E10-T8 | `WeeklyReflectionWizard` component | 5 steps (Define/Measure/Analyze/Improve-promote/Close). Insufficient-evidence disabling. Dismissed-history hint. | `/js/ui/components/WeeklyReflectionWizard.js` | E6-T3, E6-T6 | All 5 steps flow end-to-end. Promote creates Kaizen. | L |
| E10-T9 | `KaizenCard` component | 5 sub-states (DRAFT/ACTIVE/IN_REMEASUREMENT/CLOSED/abandoned). Close button disabled without remeasurement with microcopy above. | `/js/ui/components/KaizenCard.js` | E7 | HARD-RULE visible in UI: close disabled with exact microcopy. | M |
| E10-T10 | `AdherenceDial` component | 3 numbers with sparklines. First-week empty state. Tapping opens `/insights`. | `/js/ui/components/AdherenceDial.js` | E9-T2 | Always visible on `/today`. | S |
| E10-T11 | `VarianceLogEntry` component | Read-only row + "Add correction" link. Chain indicator for superseding rows. | `/js/ui/components/VarianceLogEntry.js` | E9-T8 | Used on `/insights/variance`. | S |
| E10-T12 | Drag-to-reorder / rebucket (flow 2.1 step 2b) | Uses `canRebucket`; red drop target on violation; block snaps back; BucketStrip live-updates. | `/js/ui/composerEdit.js` | E4-T4, E10-T2 | E2E: illegal drop rejected inline. | M |
| E10-T13 | `/today/activity/:id/skip` reason-code modal | 5 radios + OTHER text field. Submit disabled until reason selected. | Modal overlay in Shell | E5-T4 | Flow 2.5 demoable. | S |
| E10-T14 | `/today` layout with top-strip PROJECT + Deep emphasis | PROJECT top bar; Deep blocks 1.5× visual weight; Deep block interruption warning per `UX_FLOWS §6.4`. | `/js/ui/pages/Today.js` | E10-T2, E10-T3, E10-T4 | Deep-displacement confirm modal fires per §6.4 rule 3. | M |
| E10-T15 | `/week` view with 5 daily BucketStrip miniatures + Deep headline | Deep minutes KPI; 5 miniatures; `/week/compose`, `/week/reflect`, `/week/day/:isoDate/compose` sub-routes. | `/js/ui/pages/Week.js` | E10-T3, E10-T8 | Demoable Monday-morning Weekly compose + Friday Weekly Reflection. | M |
| E10-T16 | Disabled `/kaizen/accelerator` nav route placeholder | "Ships in Sprint N" placeholder route to avoid 404s during Sprint 1 while E13 task surfaces haven't landed. Nav item disabled with one-line explanation. | `/js/ui/router.js` addition | E10-T1 | Nav shows disabled "30-Day Accelerator" item; tapping shows "Accelerator lands with E13 — start from the Kaizen detail view." | S (≤ 0.5d) |

**E10 total: 16 tasks ≈ 14.5–15.5d.**

---

### E11 — Coaching Microcopy System

| ID | Title | Scope | Artifact | Deps | Output | Estimate |
|---|---|---|---|---|---|---|
| E11-T1 | Microcopy registry | Map of 10 trigger IDs → string templates per `UX_FLOWS §5.1–§5.10`. ≤ 20 words, no emoji, no "!", no "rockstar". | `/js/ui/coaching/registry.js` | — | Lint rule rejects >20 words / emoji / "!". | S |
| E11-T2 | Trigger engine (event → microcopy) | Subscribes to events; evaluates conditions (e.g., "3rd edit in a row", "2 ESCALATION skips this week"); emits display event. | `/js/ui/coaching/engine.js` | E1-T2, E11-T1 | Each of the 10 triggers has a unit test covering trip condition. | M |
| E11-T3 | Inline coaching renderer | Non-blocking inline strings per component. No dismiss-OK required. | `/js/ui/coaching/renderer.js` | E11-T2, E10 | 10 triggers render at correct location (AdherenceDial, composer Edit, activity block, ReflectionSheet, KaizenCard, drop target, Today banner, Close confirm, Reject confirm). | M |
| E11-T4 | E2E coverage per trigger | For each of the 10 triggers: fixture that trips it + assert microcopy visible. | `/tests/e11-coaching/*.test.js` | E11-T3 | 10 passing tests. | M |
| E11-T5 | Voice audit | QA pass: every string is product voice, not consultant voice. | Review checklist run over registry | E11-T1 | Checklist signed off; no blocked strings. | S |

**E11 total: 5 tasks ≈ 4–6d.**

---

### E12 — Persistence + Migration

| ID | Title | Scope | Artifact | Deps | Output | Estimate |
|---|---|---|---|---|---|---|
| E12-T1 | `bamx:v1:*` key layout | Provision all 13 keys per `ARCHITECTURE §7.1`. | `/js/persistence/keys.js` | E1-T4 | All keys documented + exported. | S |
| E12-T2 | `appendOnly` for variance | `variances` writes use `LocalStorageRepository.appendOnly`; overwrite throws. | Wire in `VarianceService` | E1-T4, E5-T6 | **Variance append-only at storage** — invariant test: direct repo write with existing id throws. | S |
| E12-T3 | Schema version + boot migration runner | `meta.schemaVersion` read; ordered migrations in `/js/persistence/migrations/*.js`; forward-only; pre-migrate backup. | `/js/persistence/MigrationEngine.js` | E1-T6 | Test: stub a v1→v2 migration; run; meta updated; backup written under `bamx:v1:backup:preMigrate:<ts>`. | M |
| E12-T4 | `exportData()` / `importData()` | Single JSON blob with all `bamx:v1:*` keys; import replaces all after backup. | `/js/persistence/portable.js` | E12-T1 | Round-trip test: export → wipe → import → deep-equal original. | M |
| E12-T5 | Port-compat validator | Lint step ensuring no "embedded children on parent" hacks. | `/scripts/port-compat.js` | E12-T1 | Run on CI; fails if any entity has an array-of-children field instead of FK id. | S |
| E12-T6 | `bamx:v1:clusterDismissals` provision | Key + bounded 50-tag retention. | Wiring in `KaizenCandidateQueue` | E6-T6 | Cap test: 51st dismissal evicts oldest. | S |
| E12-T7 | `bamx:v1:pdca` provision | Active + last-10-closed retention. | Wiring in `PdcaService` | E8-T2 | Cap test: 11th closed experiment evicts oldest. | S |
| E12-T8 | 5MB ceiling telemetry | Boot-time estimate; warn at 80% / force archive at 95%. | `/js/persistence/sizeMonitor.js` | E12-T1 | Test: fill storage to 80% → warning banner. | S |
| E12-T9 | Optional 90-day archive path | Compositions > 90 days → `bamx:v1:archive:<yyyymm>`; removed from hot keys. | `/js/persistence/archive.js` | E12-T8 | Archive test: 91-day-old composition moves. | S |

**E12 total: 9 tasks ≈ 6–8d.**

---

### E13 — 30-Day Kaizen Accelerator Project Type

Traces to `PROJECT_TYPE_30D_KAIZEN.md §11`. Depends on E2 (catalog seed), E7 (Kaizen lifecycle), E10 (UI shell). **Blocker:** the 31 entries' procedure text must be authored by Phil / Black-Belt partner before E13-T1 starts — see `CATALOG_GAPS §I.2` + R13 in §5.

| ID | Title | Scope | Artifact | Deps | Output | Estimate |
|---|---|---|---|---|---|---|
| E13-T1 | Seed 31 Accelerator catalog entries | Write rows per `PROJECT_TYPE_30D_KAIZEN.md §3` + `CATALOG_GAPS §I.1`: name, bucket, `defaultDurationMinutes`, `cadence`, `trigger`, `inputs`, `outputArtifact`, `participants`, `procedure`, `dependsOn`, `projectTypeBinding='KAIZEN_ACCELERATOR_30D'`, `phaseBinding`, `isNonOptional`, `focusArea='KAIZEN_ACCELERATOR_30D'`. | Seed patch in `/js/catalog/seed/accelerator30d.js` | E2-T9, E1-T10, **procedure-text blocker resolved** | 31 entries loaded; DAG cycle-free; phase-gate entries flagged `isNonOptional=true`. | M |
| E13-T2 | Add `ProjectType` enum + `Kaizen.projectType/phase/phaseDefinitions` fields | Land schema extensions in domain model and migrations; backfill existing Kaizens to `projectType='AD_HOC'`. | Edits to `/js/domain/types.js`, migration script in `/js/persistence/migrations/` | E1-T10, E12-T3 | Legacy Kaizens read with `projectType='AD_HOC'`; new promotion path accepts a `projectType` argument. | S |
| E13-T3 | Add `CatalogEntry.projectTypeBinding + phaseBinding` fields | Land fields on CatalogEntry; update CatalogService validators; add DAG validator that rejects phase-binding across phase boundaries. | Edits to `CatalogService`, `/js/catalog/validate.js` | E1-T10, E2-T9 | Seeded entries round-trip the new fields; validator rejects a `dependsOn` edge that crosses phase with a null `phaseBinding` on one side. | S |
| E13-T4 | Phase FSM + `KaizenService.advancePhase()` / `canAdvancePhase()` | Implement the 5-state FSM + abandoned path per `ARCHITECTURE §3.4` and `PROJECT_TYPE_30D_KAIZEN.md §4.3`. Emits `ProjectPhaseAdvanced`. | Edits to `/js/services/KaizenService.js`, new `/js/domain/fsm/acceleratorPhase.js` | E13-T2, E7 | All 5 guard transitions unit-tested; failing guard throws named error (`BASELINE_NOT_APPROVED`, `ROOT_CAUSE_MISSING`, `UNOWNED_ACTION`, `ROI_NOT_VALIDATED`). | M |
| E13-T5 | Extend composer `eligibleDmaicPayloadSteps` with phase filter | Per `ENGINE_DESIGN §4.2` revision. Preserve priority-ranking function. Add Phase 1 / Phase 3 payload-isolation test from `PROJECT_TYPE_30D_KAIZEN.md §5.4`. | Edits to `/js/composer/eligibleDmaic.js` | E13-T3, E3-T5 | Unit test: during PHASE_1 a Phase 3 entry never appears in eligible set; after `advancePhase()` to PHASE_3 the Phase 3 entries appear. | S |
| E13-T6 | `RoiEngine.computeRoi()` pure function + ROI capture flow | Implement `computeRoi(impCost, annualBenefits) -> number|null` per `PROJECT_TYPE_30D_KAIZEN.md §6.1`. Wire `KaizenService.applyRoiArtifact()` to the `30d_4_3_calculate_roi` close path. | `/js/engine/RoiEngine.js`, edits to `KaizenService` | E13-T2, E13-T4 | Three-variant pure-function test (positive, zero, negative ROI); `null` when either input missing or cost=0. | S |
| E13-T7 | `KaizenCard` PhaseStepper sub-element | Render only when `projectType='KAIZEN_ACCELERATOR_30D'`. 5-node stepper, guard-status on current node, inline advance button. Per `UX_FLOWS §3.8`. | `/js/ui/components/PhaseStepper.js` + wiring in `KaizenCard` | E13-T4, E10-T9 | All 5 phase nodes render; advance fires `canAdvancePhase()` and either advances or shows guard message. | M |
| E13-T8 | `RoiPanel` sub-component + `/kaizen/:id/roi` route | Editable in PHASE_4, read-only after close. Binds to `Kaizen.implementationCostDollars`, `annualBenefitsDollars`, `roi`. Per `UX_FLOWS §3.12`. | `/js/ui/components/RoiPanel.js`, route entry in router | E13-T6, E10-T9 | Save path invokes `applyRoiArtifact`; inline validation ("both fields required") shown before phase advancement to CLOSED. | M |
| E13-T9 | `AcceleratorPaceWarning` event emission + inline warning microcopy | Compute pace per `PROJECT_TYPE_30D_KAIZEN.md §9`: `User.workDays` intersected with elapsed calendar days. No holiday model. Emit event on `advancePhase()` when prior phase's elapsed working days > spec target. Inline coaching string on KaizenCard per `UX_FLOWS §5` pattern. | Edits to `KaizenService.advancePhase()` + `/js/ui/coaching/registry.js` | E13-T4, E11-T1 | Unit test: 9-working-day Phase 1 emits `AcceleratorPaceWarning { phase:'PHASE_1', expectedMaxDays:7, actualDays:9 }`; 7-day Phase 1 emits nothing. | S |

**E13 total: 9 tasks ≈ 5–8d (depends on procedure-text blocker clearing before T1 starts).**

---

**Grand total: 115 tasks** across 13 epics (E1 10, E2 9, E3 12, E4 7, E5 7, E6 7, E7 8, E8 7, E9 9, E10 16, E11 5, E12 9, E13 9).

---

## 3. 30-60-90 Plan

### Window 1 — Days 1–30 — "Compose a valid day on a trustworthy backbone"

| | |
|---|---|
| Theme | Build the deterministic backbone (state + catalog seed + composer + invariants) and prove the Daily composer produces a valid 4-2-2 day from the real seed. |
| Epics worked on | E1 (100%), E2 (100%), E4 (100%), E12 (60%), E3 (70%), E10 (20% — shell + CycleCard + BucketStrip + CatalogPicker) |
| Demoable outcomes at window end | (a) On `/today`, a composed `PROPOSED` day renders in CycleCard with BucketStrip showing 240/120/120. (b) User can Accept, Edit (drag within / across buckets respecting canRebucket), or Reject. (c) INFEASIBLE day shows guided remediation. (d) `/catalog` shows 60 seeded entries; toggling `enabledByUser` persists; non-optional disable blocked. |
| Go / no-go gate to Window 2 | **Invariant**: `validateComposition` passes for the golden §1.9 worked example composed from real seed; rejects a hand-broken day with the correct exact message. **Metric**: composer run time < 100ms on localStorage fixture; 100% of §4.7 `suggestedActions` render. |

### Window 2 — Days 31–60 — "Run the day, capture evidence, open a Kaizen"

| | |
|---|---|
| Theme | Activity runtime + reflection + friction capture + Kaizen promotion — the evidence loop. |
| Epics worked on | E3 (to 100%), E5 (100%), E6 (100%), E8 (100%), E7 (70% — promote + lockBaseline + startRemeasurement), E10 (to 70% — ScheduledActivityBlock, ReflectionSheet, WeeklyReflectionWizard, skip modal) |
| Demoable outcomes at window end | (a) User starts a scheduled activity, closes with output artifact matching schema, reflection sheet auto-opens, pending-flip records on-time flag. (b) Skipping a non-optional requires a reason code; OTHER requires a note; variance appears on `/insights/variance` as a new row. (c) Friday Weekly Reflection wizard runs; top friction cluster promotes to a Kaizen in DRAFT; baseline locks. (d) PDCA experiment opens and its tick fires on 48h cadence. |
| Go / no-go gate to Window 3 | **Invariant**: Variance append-only holds (direct repo overwrite rejected). **Invariant**: PDCA orphan tick rejected when experiment open. **Metric**: `ReflectionCaptured` with `onTime=true` observed on ≥ 3 fixture activities within 15m. |

### Window 3 — Days 61–90 — "Close a Kaizen with evidence and light up the dashboard"

| | |
|---|---|
| Theme | Kaizen close with HARD RULE, Metrics + Insights, Coaching microcopy, `/week` view + Weekly composer run-through. Prepare blueprint §7.4 launch-metric instrumentation. |
| Epics worked on | E7 (to 100%), E9 (100%), E10 (to 100%), E11 (100%), E12 (to 100%) |
| Demoable outcomes at window end | (a) Kaizen with baseline + actions + remeasurement closes with `closeKind ∈ {SUCCESS, PARTIAL, FAILED_HONEST}`; attempt-to-close without remeasurement is refused inline. (b) `/today` shows AdherenceDial with three numbers and sparklines; `/insights` shows variance + friction. (c) 10 coaching microcopy triggers fire at the right place. (d) `/week` shows 5 daily BucketStrip miniatures, the Deep minutes headline, and the Weekly composer Accept/Edit/Reject cycle. (e) Export / import round-trip works; schemaVersion advances on migration. |
| 90-day end state vs blueprint §7.4 | **Yes — the launch metric is computable.** Each signup's composed-and-accepted Daily cycles, each day's `Reflection(kind=END_OF_ACTIVITY) pending=false`, and the `Reflection(kind=WEEKLY)` row are all persisted entities. `MetricsService` can compute "% of signups who by day 14 have ≥ 7 accepted-or-edited Daily compositions + ≥ 1 END_OF_ACTIVITY reflection on each + 1 WEEKLY reflection." Denominator = signups (all users in repo). Numerator = query over compositions/reflections per the above. |

**Net:** at day 90, a real single user can run a full Daily + Weekly cycle end-to-end, capture evidence, promote a Kaizen, close it with remeasurement, and see their three dashboard numbers. The launch metric is measurable.

### Window 4 — Days 91–~100 — "Accelerator project type (E13)"

| | |
|---|---|
| Theme | Land the 30-Day Kaizen Accelerator project type on the MVP backbone. Stretches the project timeline from ~75 to ~100 project days per coordinator decision 15 (`ARCHITECTURE.md §9`). |
| Epics worked on | E13 (100%). Depends on E2, E7, E10 (all 100% by Day 90). |
| Demoable outcomes at window end | (a) A user promotes a Kaizen with `projectType='KAIZEN_ACCELERATOR_30D'`; `KaizenCard` renders the 5-node `PhaseStepper` with Phase 0 current. (b) Closing `30d_0_6_approve_charter` with a DOCUMENT artifact advances to Phase 1. (c) During Phase 1 the composer's Deep payload comes only from the six Phase 1 entries; no Phase 3 task appears. (d) `30d_4_3_calculate_roi` close captures `implementationCostDollars` and `annualBenefitsDollars`; `RoiPanel` renders the computed ROI. (e) Close refused until both ROI inputs captured AND `30d_4_5_control_plan` + `30d_4_6_final_report` closed AND Remeasurement captured. (f) `AcceleratorPaceWarning` emits on a deliberately-slow Phase 1 fixture (9 working days vs 7 target). |
| Launch-metric preservation | Blueprint §7.4 launch metric (day-14 composition + reflection rate) remains computable at day 90 exactly as before. **Accelerator completion doesn't need to be demonstrated for the launch metric** — it only needs to be *open-able* at day 90 (user can start an Accelerator; phase advance works; ROI capture works). Full 30-day Accelerator run-through is not required for launch success. |

---

## 4. Sprint Plan (first 2 sprints detailed)

**Capacity (re-stated):** 1 FTE engineer, 60% project time per BAM 4-2-2 = **24h PROJECT / week = 48h PROJECT / sprint**. Estimate mapping: S ≤ 12h; M 12–30h; L 30–60h. Plan fills sprint to ≤ 48h.

### Sprint 1 (Days 1–14) — "Foundation + seed"

| | |
|---|---|
| Sprint goal | End-of-sprint a boot path loads meta, hydrates a seeded catalog of 60 entries with DAG validated, and `validateComposition` correctly accepts the golden §1.9 fixture and rejects hand-broken variants. |
| Capacity | 48h PROJECT. Tasks below total 46h. |
| Sprint Backlog | E1-T1 (S, 10h) + E1-T2 (S, 4h) + E1-T3 (S, 2h) + E1-T4 (M, 14h) + E1-T5 (S, 4h) + E1-T6 (S, 4h) + E2-T1 (Phil-blocker, 0h eng) + E2-T2 (M, 8h start; finish Sprint 2). **Remaining**: start E4-T1 (S, 4h). **Total: 50h — trim E2-T2 scope to parser stub (M→6h)** → 48h. |
| Sprint Review demo | 1) `bamx:v1:meta` written on first boot; reboot reads it. 2) `EventBus.publish('ActivityCompleted', {...})` fires a subscribed handler. 3) `LocalStorageRepository.appendOnly` throws on duplicate id. 4) JSDoc typedefs grep-verified for all 14 entities. 5) First 10 rows of the 50-source catalog parsed into `CatalogEntry` drafts. |
| Retro risks | (a) E2-T1 `CATALOG_GAPS §F` unresolved — parser will mis-fill the 4 unknown rows (Phil blocker). (b) `LocalStorageRepository` JSON round-trip corner cases (undefined vs null) eat half a day. (c) FSM typedefs sprawl — keep them lean; don't model abandoned states we don't use. |
| Mid-sprint check (Fri Wk1) | E1-T1..T4 merged; `appendOnly` test green; E1-T6 boot path drafted. If not, Sprint 1 will slip E2-T2 entirely into Sprint 2. |

### Sprint 2 (Days 15–28) — "Composer produces a valid 4-2-2 day"

| | |
|---|---|
| Sprint goal | End-of-sprint `composeDaily(input)` produces the exact §1.9 golden composition from the real seed; `/today` renders CycleCard with BucketStrip in PROPOSED state and Accept / Edit / Reject buttons wired (Accept flips to SCHEDULED atomically). |
| Capacity | 48h PROJECT. Tasks below total 46h. |
| Sprint Backlog | Finish E2-T2 (6h) + E2-T3 (S, 4h) + E2-T4 (M, 10h) + E2-T5 (M, 6h) + E2-T6 (S, 3h) + E2-T7 (S, 3h) + E2-T9 (M, 6h) + E3-T1 (S, 2h) + E3-T2 (S, 3h) + **START** E3-T3 (L, 3h this sprint, rest Sprint 3). **Total: 46h.** |
| Sprint Review demo | 1) 60 `CatalogEntry` rows seeded, visible at `/catalog`, with bucket and non-optional flags correct. 2) Toggle `enabledByUser` on a configurable entry persists; disable on non-optional rejected. 3) `composeDaily` returns the 4-block non-optional skeleton for a full 480min day. 4) `computeBucketTargets` correctly computes half-day and externalMinutesToday=60 cases. 5) CatalogService DAG validator rejects a seed with a cycle. |
| Retro risks | (a) E2-T4 `CATALOG_GAPS §A–§D` procedure fills are tedious and error-prone — carve 2h for QA checklist. (b) E2-T8 DMAIC DAG authoring pulled ahead to unblock Sprint 3's E3-T5; if it slips, Sprint 3 drags. (c) `composeDaily` step-by-step pseudo-code in `ENGINE_DESIGN §1.2` is dense; resist the urge to refactor — translate literally. |
| Mid-sprint check (Fri Wk1 of Sprint 2) | E2-T2 complete; E2-T3/T4/T5 merged; `/catalog` route shows seeded rows with correct bucket tags. If not, pull E3-T1/T2 forward into Sprint 3 and slide E3-T3 start to Sprint 3 Day 1. |

**Consistency check:** every task ID in Sprints 1–2 appears in §2 with matching scope. No task invented here.

---

## 5. Risks & Mitigations

| # | Risk | Kind | Prob | Impact | Mitigation (concrete action) | Owner | Trigger signal |
|---|---|---|---|---|---|---|---|
| R1 | **Catalog seed quality gaps** — `CATALOG_GAPS §F` open questions unresolved before E2-T2 starts | SCOPE | H | H | E2-T1 is an explicit Sprint 1 blocker task on Phil (not engineering time). Every Sprint 1 standup asks "§F status?" If Sprint 1 Friday check hits and §F is open, engineering proceeds with documented default values (§E bulk-fill + placeholders for the 4 unknowns) and logs a known-debt variance; real values patched before launch. | PM | §F not resolved by Sprint 1 mid-sprint check |
| R2 | **localStorage 5MB ceiling hit before Postgres port** | TECH | M | H | E12-T8 adds boot-time size monitor with 80% warn / 95% archive. E12-T9 ships the 90-day archive path as part of MVP persistence. `port-compat validator` (E12-T5) ensures shapes land in Postgres unchanged. | Backend | sizeMonitor emits `STORAGE_WARN` event |
| R3 | **4-2-2 invariant feels punitive to real users** | PRODUCT | M | H | MVP ships with `CycleCard` showing the exact violation + actionable remediation (E4-T6, E11-T3). Instrument `CycleEdited` + `CycleRejected` rate per user; if > 40% of daily cycles are rejected in week-2 of the first 5 users, open a scope ticket to relax floors to 25% (currently 50%). DO NOT ship the relaxation preemptively. | PM | `CycleRejected` rate > 40% for ≥ 3 users in a 7-day window |
| R4 | **DMAIC DAG edges (`CatalogEntry.dependsOn`) not authored in time** | SCOPE | H | H | E2-T8 is explicit and sized M (10h). Authored by PM (me) during Sprint 2, reviewed against `CATALOG_GAPS §A.4`, §B, §C, §D procedure inputs. If E2-T8 slips past Sprint 2, `selectDeepPayload` falls back to `Deep Work — Project Task (generic)` — Kaizen still works, DMAIC walk just doesn't auto-sequence. | PM | E2-T8 not merged by Sprint 2 Fri Wk2 |
| R5 | **Kaizen HARD RULE frustrates first-wave users into abandonment** | PRODUCT | M | H | Abandon path (E7-T6) explicitly exists and keeps the portfolio truthful. KaizenCard microcopy (E11, trigger 5.6) names the rule before the user tries. Measure: ratio of `KaizenService.abandon()` to `KaizenService.close()` in first 5 users; if abandon > close, pair with user to coach through remeasurement before reopening the scope decision. | PM | Abandon:Close ratio > 1.0 across first 5 users at 30 days |
| R6 | **INFEASIBLE frequency > 20% of composer runs** indicates the capacity model is wrong | TECH | M | M | E9-T1 instruments `ComposerInfeasible` count per user per week as a leading indicator. If > 20%, the most likely root cause is `externalMinutesToday` inputs too high or `User.dailyCapacityMinutes` too low. Triage via `composerInputsSnapshot.explain` on the infeasible days. Do NOT silently relax non-optionals — that defeats the product. | Backend | MetricsService logs INFEASIBLE > 20% for any user over 7 days |
| R7 | **Reflection pending auto-stub balloons** (users close everything without reflecting) | PRODUCT | M | M | `pending=true` rows already stubbed per `ARCHITECTURE §2.6`. Banner on `/today` (E6-T7) pings every 2 pending. Microcopy 5.9 fires at 2 consecutive pending. Measure: `reflectionRatePercent` on AdherenceDial. If < 50% at user day 7, the banner becomes sticky until cleared. | Frontend | `reflectionRatePercent < 50% at user day 7` |
| R8 | **Single-user MVP misses team insight loop** — when is "team mode" right? | SCOPE | M | M | Team rollup + shared ceremonies explicitly Next per blueprint §5.2. Trigger to promote: ≥ 2 MVP users working at the same company for ≥ 14 days AND requesting "how are they doing?" view. Until then, single-user team ceremonies (placeholder participant list) ship as-is. | PM | ≥ 2 co-worker MVP users + 1 request |
| R9 | **DMAIC walk in Deep block surfaces user as homework** — engineering-heavy terminology frustrates non-CI-Champion users | PRODUCT | M | M | Catalog entry view (`/catalog/:id`) names each DMAIC step in plain language next to its number. `selectDeepPayload` falls back to `Deep Work — Project Task (generic)` when activeKaizen is null, so Practitioners don't see #26 VOC/VOB/VOA. Champion role unlocks the heavier entries; others won't see them by default (E8-T5 + role gating in `ENGINE_DESIGN §3.6`). | PM | Users ask "what's VOC" in first 7 days |
| R10 | **Reflection 15-min on-time window is too tight** | PRODUCT | M | M | Engineering instruments `onTime` as a boolean on each reflection. If < 30% of reflections are `onTime=true` across the first 5 users after day 7, reassess the window (e.g., extend to 30 min) before launch. Microcopy 5.4 already frames late-capture as "fine, just note it" to avoid guilt spirals. | PM | `onTime=true` < 30% across first 5 users |
| R11 | **MVP cap of 1 active Kaizen feels restrictive to CI Champion persona** | PRODUCT | L | M | MVP cap is explicit. Champion persona is a blueprint §6.4 user — not prioritized for MVP launch. Multiple concurrent Kaizens ship in Next per §5.2. If a Champion signs up and complains, that's qualitative data for the Next scope decision, not an MVP change. | PM | Champion-role signup complains about cap |
| R12 | **1 FTE engineer timeline pressure** — 13 epics (incl. E13) × 5–15d = 65–188 engineer days; stretched to ~100 project days per decision 15 | OPS | H | H | Capacity math is tight. Three buffers: (a) E11 coaching microcopy scope is strictly the 10 named triggers — no extras. (b) E10-T14 Deep emphasis is "full-width treatment" only; drag gestures are basic. (c) E13 sized M (5–8d); Window 4 is dedicated to it. Hard cut if slipping: descope AdherenceDial sparklines (save 2d) and `/week` Deep-minutes headline (save 3d) to Next. Do NOT cut any invariant enforcement, the HARD RULE, or the Accelerator phase/ROI guards. | PM | Sprint 1 or 2 burndown slips >20% |
| R13 | **Accelerator procedure-text not authored by Phil before E13-T1.** `CATALOG_GAPS §I.2` names 31 procedure blocks to write; if they aren't reviewed before E13 begins, the Accelerator ships with placeholder procedures that users will see in-product. | SCOPE | M | H | PM / Black-Belt dedicated authoring sprint before E13 starts (Sprint 12 or Window 4 Day 1–3). Drafts exist in `PROJECT_TYPE_30D_KAIZEN.md §3` as a starting point. Fallback: ship placeholder procedure text with a "DRAFT" flag rendered in the catalog detail view; patch real procedures in before Accelerator GA. Do NOT block E13-T1 on procedure review if it means missing the 100-day mark; ship draft with flag. | PM / Black-Belt partner | Window 4 Day 1 check: if procedure authoring not at ≥ 90% by Day 1 AM, engineering proceeds with DRAFT flag. |
| R14 | **Phase 2 4-2-2 pressure.** Phase 2 packs PROJECT-bucket Deep blocks with Phase 2 catalog entries for 3–5 consecutive days. The 4-2-2 invariant is preserved (no per-day override, per decision 15) but users running a Kaizen Event virtually may hit `ComposerInfeasible` when real external meetings overflow COMMUNICATION. | PRODUCT | M | M | Expose capacity settings prominently during Phase 2 (settings link inline on `PhaseStepper` when `phase='PHASE_2'`); users can raise `dailyCapacityMinutes` for the event window. Instrument `ComposerInfeasible` fired count during Phase 2. **Trigger:** `ComposerInfeasible` fires > 2× during any user's Phase 2 → prompt user to raise capacity or trim the external-meeting load for the event window. Do NOT add a Phase 2 per-day 4-2-2 override; that defeats the product. | PM | `ComposerInfeasible` count > 2 during any user's Phase 2 window |

---

## Appendix A — Hard rules traceability

Each hard rule from the prompt is reflected in at least one task:

| Hard rule | Task(s) |
|---|---|
| Kaizen cannot close without matching-metric remeasurement | **E7-T4** (+ E1-T9 guard) |
| Daily 4-2-2 invariant enforced at composition save | **E4-T2, E4-T7** |
| Non-optional activities cannot be silently skipped; skip requires reason code; OTHER requires note | **E5-T4** (+ E5-T6 at storage, E10-T13 at UI) |
| Every activity close produces required output artifact matching CatalogEntry schema | **E5-T2, E5-T3** |
| Variance log is append-only at storage | **E1-T4** (appendOnly), **E12-T2** (wiring), **E5-T6** (service) |
| PDCA tick blocked without open PdcaExperiment | **E5-T5** (orphan-tick guard) |
| Composer never silently truncates; returns InfeasibleResult with suggestedActions | **E3-T9** |

## Appendix B — Launch-metric plumbing (blueprint §7.4)

The 90-day launch metric — "% of signups with ≥ 7 accepted/edited Daily compositions + 1 END_OF_ACTIVITY reflection per + 1 WEEKLY reflection by day 14" — is computable at the 90-day mark because:

- **Daily composition count per user:** `select count(*) from compositions where user_id=? and cycle_type='DAILY' and state in ('ACCEPTED','ACTIVE','CLOSED')` — available after E3-T11 + E1-T4.
- **END_OF_ACTIVITY reflections captured (non-pending):** `select count(*) from reflections where user_id=? and kind='END_OF_ACTIVITY' and pending=false` — available after E6-T2.
- **WEEKLY reflections completed:** `select count(*) from reflections where user_id=? and kind='WEEKLY'` — available after E6-T3.
- **Day-14 boundary:** `User.createdAt` (E1-T1) + 14 calendar days.

`MetricsService.recompute` (E9-T1) produces this query against the seeded, live-written data. No additional schema is required.
