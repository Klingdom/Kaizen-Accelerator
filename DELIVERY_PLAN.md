# BAM-X Kaizen OS — Delivery Plan

Owner: Product Manager (delivery-engineering bias)
Status: v0.3 — v0.3 folds the three operating standards (`ACCELERATOR_STANDARD.md` v1.0, `DMAIC_STANDARD.md` v1.0, `KAIZEN_EVENT_STANDARD.md` v1.0) into delivery. Adds five new epics — **E14 Validated Kaizen Portfolio** (5d, MVP), **E15 Statistical Analysis Surfaces** (10d, post-launch with DMAIC), **E16 MSA Workflow** (5d, post-launch with DMAIC), **E17 Kaizen 90 Phase Support** (5d, with Kaizen 90 activation), **E18 Implementation Backlog Tracker** (10d, MVP). Extends E7, E8, E13 with tasks for Finance co-sign, Phase 3→4 weighted guard, Sustainment Gate, two-pass ROI, validated-root-cause, Control Plan drafting at Phase 2, DMAIC DAG edges from §J, Kaizen 90 catalog bindings from §K. Timeline extends from ~100 → ~135 project days; the 30-60-90 plan becomes 30-60-90-120-150 (5 windows). Adds R15–R18 to §5 (two-pass ROI, Sustainment Gate, strategic veto, Implementation Lead availability). Grounded in `ARCHITECTURE.md` v0.5, `ENGINE_DESIGN.md` v0.4, `CATALOG_GAPS.md` v0.3, the three operating standards at v1.0, `UX_FLOWS.md` v0.2.2, and `PROJECT_TYPE_30D_KAIZEN.md` v0.1. v0.2 added **E13 — 30-Day Kaizen Accelerator Project Type** per coordinator decision 2026-04-19 (see `ARCHITECTURE.md §9` item 15). Added MVP hooks on E1 and E10 (Kaizen/CatalogEntry schema fields, disabled nav placeholder). Timeline extended from ~75 → ~100 project days. Added R13 (procedure-text blocker) and R14 (Phase 2 4-2-2 pressure) to §5. Grounded in `PRODUCT_BLUEPRINT.md` v0.3, `ARCHITECTURE.md` v0.4, `ENGINE_DESIGN.md` v0.3, `CATALOG_GAPS.md` v0.1 + new §I, `UX_FLOWS.md` v0.2.2, and `PROJECT_TYPE_30D_KAIZEN.md` v0.1.
Capacity assumption (global): 1 FTE engineer. 60% to this project per the BAM 4-2-2 model on a 40h/week — **24h PROJECT / week; 48h PROJECT / sprint (2 weeks).** This is the only capacity used below. No second engineer assumed.

Estimate buckets: **S ≤ 2d**, **M 2–5d**, **L 5–10d**. "Day" = 6 PROJECT hours (standard BAM workday). An S task consumes ≤ 12h, an M 12–30h, an L 30–60h.

MVP scope is bounded by blueprint §4.1 (5 must-haves) + §4.2 Should-wait excluded + §4.3 Excluded never considered. Nothing in this plan extends beyond §4.1.

---

## 1. Epic Breakdown

Eighteen epics (13 from v0.2 + 5 new in v0.3 per operating-standard refinements). Each is 5–15 engineer-days. Each names its MVP must-have, traces to source docs, names upstream dependencies, and states its DONE artifact. Of the five new epics: E14 + E18 ship with MVP core (needed to validate the Kaizen claim); E17 ships with Kaizen 90 projectType activation; E15 + E16 ship post-launch with DMAIC (DMAIC-specific).

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
| **E13** | 30-Day Kaizen Accelerator Project Type | (6) 30-Day Kaizen Accelerator — phased Kaizen with ROI gate | `PROJECT_TYPE_30D_KAIZEN.md §1–§11`; `ARCHITECTURE §2.2, §2.9, §3.4, §6.1, §8, §9 items 15, 21`; `ENGINE_DESIGN §4.2, §4.2.2`; `UX_FLOWS §3.8, §3.12, §1.2`; `CATALOG_GAPS §I`; `ACCELERATOR_STANDARD §1.6` | E2 (catalog seed), E7 (Kaizen lifecycle), E10 (UI shell) | 31 Accelerator catalog entries seeded with `projectTypeBinding` + `phaseBinding`; Phase FSM + `canAdvancePhase()` + `advancePhase()` land + unit-tested per `PROJECT_TYPE_30D_KAIZEN.md §4`; composer `eligibleDmaicPayloadSteps` filters by phase; `RoiEngine.computeRoi` + `KaizenService.applyRoiArtifact` pure-function-tested; `KaizenCard` renders `PhaseStepper` + `RoiPanel` gated on `projectType`; `/kaizen/:id/phase/:phaseId` and `/kaizen/:id/roi` routes live; `ProjectPaceWarning` emits on prior-phase duration over target; close refused without captured ROI. v0.3 additions: Phase 3→4 weighted guard with strategic veto; Control Plan drafting at Phase 2 (not Phase 4); Finance partner mandatory at `30d_0_5`. |
| **E14** | Validated Kaizen Portfolio | (7) Validated Kaizen portfolio view — MVP must-have for Kaizen claim | `ARCHITECTURE §2.9, §9 item 22`; all 3 operating standards `§11`; brand-architecture analysis | E7 (Kaizen lifecycle), E9 (Metrics), E10 (UI shell) | `/insights/portfolio` route shows all Validated Kaizens with baseline/remeasurement/delta/close-kind/ROI/close date. Filter by projectType, closeKind, sponsor. Export CSV. Counts: total CLOSED with SUCCESS or PARTIAL; sum of annualBenefitsDollars across Validated set. Enforces "Validated Kaizen" definition from DMAIC glossary: CLOSED + statistically-validated post-improvement delta + Finance-signed. |
| **E15** | Statistical Analysis Surfaces | (8) DMAIC MSA / Capability / Control Chart / Hypothesis Test viewers — post-launch with DMAIC | `DMAIC_STANDARD §11.3` items 3, 6; `DMAIC_STANDARD §6` | E9 (Metrics), E16 (MSA workflow provides the first artifact to surface) | Control chart component (Western Electric rules with signal-detection). Capability report view with Cp/Cpk/Pp/Ppk + normality plots. Hypothesis test results log with pre-registered hypothesis list + multiple-comparison correction flag. MSA report surface (feeds E16). All four viewers accept a `ScheduledActivity.outputArtifactRef.value` payload and render a rich visualization. Ships with DMAIC project type in post-launch window. |
| **E16** | MSA Workflow | (9) MSA design → execution → dispositions (DMAIC) — post-launch with DMAIC | `DMAIC_STANDARD §11.3` item 4 + §6.2 | E15 | Gage R&R execution UI with 10-sample × 2–3-appraiser × 2–3-trial matrix capture. Kappa computation for attribute systems. Accept/reject gate at 10% (ACCEPTABLE) / 30% (MARGINAL) thresholds. MSA artifact carries `acceptanceRating` field read by `ActivityService.close()` for `#28` Baseline. Wires the MSA-before-Baseline invariant (`ARCHITECTURE §8`). |
| **E17** | Kaizen Event 90D Phase Support | (10) Kaizen 90 phased project type activation | `KAIZEN_EVENT_STANDARD §11.2–§11.5`; `ARCHITECTURE §2.9, §3.4.1, §9 items 16–19`; `ENGINE_DESIGN §4.4, §4.4.1`; `CATALOG_GAPS §K` | E2 (catalog seed including §K bindings), E7 (Kaizen lifecycle), E10 (UI shell), E18 (for backlog / adoption log / sustainment gate calc) | `KAIZEN_EVENT_90D` `projectType` handling throughout composer (via existing `eligibleDmaicPayloadSteps` + project-type filter); `KaizenCard` `PhaseStepper` variant for 4 phases (PRE_EVENT/EVENT/POST_EVENT/SUSTAIN); phase advance guards including Sustainment Gate; `canAttemptRebaseline` helper; route updates (`/kaizen/:id/phase/PRE_EVENT` etc); seed migration for `#42`–`#50` with set-valued `projectTypeBinding` per §K; Implementation Lead assignment flow at project create; `sustainmentGatePassed` attestation UI at Day 68+. |
| **E18** | Implementation Backlog Tracker | (11) Kaizen 90 backlog + adoption + sustainment calc — MVP must-have for Kaizen 90 Sustainment Gate to function | `KAIZEN_EVENT_STANDARD §11.2` item 5 + §11.3 E18; `ARCHITECTURE §2.9 actions[].strategic`; `ENGINE_DESIGN §4.4.1` | E7 (Kaizen lifecycle) | `ImplementationBacklog` first-class entity with rich fields (acceptance criterion, size, sprint, priority score, before/after link) — refactoring from `Kaizen.actions[]` JSON blob. Weekly status tracking. Issue/Risk Log (A25 per `KAIZEN_EVENT_STANDARD §4`). Adoption log (A28) with daily adoption percent per process step. Sustainment Gate calculator exposing `canAttemptRebaseline()` output to UI. Cross-functional roster builder. Required before Kaizen 90 can go live because Sustainment Gate calc depends on adoption log availability; without E18, the POST_EVENT → SUSTAIN transition cannot evaluate. Also powers E13's Phase 3→4 strategic-veto calc by providing the `strategic` flag storage location. |

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

v0.3 additions:
E7 ─┬─► E14 (Validated Portfolio — after E7 + E9 + E10; MVP)
E9 ─┤
E10 ┘
                                                        
E7 ─────► E18 (Implementation Backlog — after E7; MVP prerequisite for E17)

E2 ─┐
E7 ─┼─► E17 (Kaizen 90 Phase Support — after E2 + E7 + E10 + E18; with Kaizen 90 activation)
E10 ┤
E18 ┘

E9 ─────► E16 (MSA Workflow — post-launch with DMAIC) ─► E15 (Stats Surfaces — post-launch)
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
| E13-T9 | `ProjectPaceWarning` event emission + inline warning microcopy (renamed v0.3 from `AcceleratorPaceWarning` per `ARCHITECTURE §9` item 19) | Compute pace per `PROJECT_TYPE_30D_KAIZEN.md §9`: `User.workDays` intersected with elapsed calendar days. No holiday model. Emit event on `advancePhase()` when prior phase's elapsed working days > spec target. Inline coaching string on KaizenCard per `UX_FLOWS §5` pattern. | Edits to `KaizenService.advancePhase()` + `/js/ui/coaching/registry.js` | E13-T4, E11-T1 | Unit test: 9-working-day Phase 1 emits `ProjectPaceWarning { projectType:'KAIZEN_ACCELERATOR_30D', phase:'PHASE_1', expectedMaxDays:7, actualDays:9 }`; 7-day Phase 1 emits nothing. | S |

**E13 total: 9 tasks ≈ 5–8d (depends on procedure-text blocker clearing before T1 starts).**

**v0.3 extensions to E13** (per operating-standard refinements; each lands inside the existing E13 window, not adding new epic days):

| ID | Title | Scope | Artifact | Deps | Output | Estimate |
|---|---|---|---|---|---|---|
| E13-T10 | Phase 3 → Phase 4 weighted guard with strategic veto | Per `ACCELERATOR_STANDARD §1.6` refinement #5 + `ENGINE_DESIGN §4.2.2`. Extend `canAdvancePhase('PHASE_4')` to additionally check `!actions.some(a => a.strategic === true && a.doneAt === null)`. Throws `STRATEGIC_ITEM_OPEN` on failure. | Edits to `/js/domain/fsm/acceleratorPhase.js` | E13-T4, E18 (for `strategic` flag storage) | Unit test: 90% completion + open strategic action → advance refused with `STRATEGIC_ITEM_OPEN`. 90% + no open strategic → advance allowed. | S |
| E13-T11 | Control Plan drafting at Phase 2 exit | Per `ACCELERATOR_STANDARD §1.6` refinement #2. Extend `canAdvancePhase('PHASE_3')` to require `controlPlanDraftArtifactRef !== null`. Add `30d_2_5_define_improvements` output spec to include monitoring metric, frequency, threshold, response. | Edits to `/js/domain/fsm/acceleratorPhase.js`; catalog seed patch for `30d_2_5` output schema | E13-T1, E13-T4 | Unit test: PHASE_2 → PHASE_3 refused without draft; allowed with draft. UI test: Phase 4 `30d_4_5_control_plan` pre-fills from draft. | S |
| E13-T12 | Finance partner mandatory at `30d_0_5` | Per `ACCELERATOR_STANDARD §1.6` refinement #1. Extend `30d_0_5_identify_stakeholders` required-roles to include `FINANCE_PARTNER`. Enforced in `ActivityService.close()` for `30d_0_5` — refuses close if no roster entry has `FINANCE_PARTNER` role. | Catalog seed patch + `ActivityService.close()` guard | E13-T1 | Unit test: roster without `FINANCE_PARTNER` → close refused with `FINANCE_PARTNER_MISSING`. | S |
| E13-T13 | `ProjectPaceWarning` rename (from `AcceleratorPaceWarning`) | Breaking event rename per `ARCHITECTURE §9` item 19. Update constant in `/js/events/events.js`, update all subscribers, add `projectType` field to payload. | Edits across `/js/events/`, `/js/services/KaizenService.js`, `/js/ui/coaching/` | E13-T9 | Grep confirms no remaining `AcceleratorPaceWarning` references; coaching microcopy registry updated. | S |

**E13 v0.3 extensions total: 4 tasks ≈ 2–3d** (additive to the original 9-task 5–8d estimate).

---

### E14 — Validated Kaizen Portfolio (new in v0.3)

**Traces to:** `ARCHITECTURE §2.9, §9 item 22`; all 3 operating standards `§11` recaps; brand-architecture analysis. **MVP must-have** because the "Validated Kaizen" concept is the product's core proof-point; without the portfolio view, users can't see the artifact they've been told to produce.

| ID | Title | Scope | Artifact | Deps | Output | Estimate |
|---|---|---|---|---|---|---|
| E14-T1 | Validated Kaizen query | Query CLOSED Kaizens with `closeKind ∈ {SUCCESS, PARTIAL}` + Finance-signed ROI (`roiProjections` non-empty for DMAIC, `implementationCostDollars !== null` for others). | `/js/services/PortfolioService.js:listValidatedKaizens(userId)` | E7 | Returns array sorted by `closedAt` DESC; each row has `{kaizenId, title, projectType, baselineValue, remeasurementValue, deltaPercent, closeKind, annualBenefitsDollars, roi, closedAt}`. | M |
| E14-T2 | `/insights/portfolio` route + page | Table of Validated Kaizens with columns: title, type, baseline, remeasurement, delta%, close-kind, ROI, closed date. Filter by projectType, closeKind, sponsor. CSV export. | `/js/ui/pages/Portfolio.js`, route in `/js/ui/router.js` | E14-T1, E10-T1 | Nav visible. Empty state "No validated Kaizens yet." 5-row fixture test renders. | M |
| E14-T3 | Portfolio aggregate counters | Total Validated count; sum of `annualBenefitsDollars` across Validated; percent Hard vs. Soft benefits (from `roiProjections[].benefitClassification` when available). | Pure functions in `/js/metrics/portfolio.js` | E14-T1 | 3 unit tests covering each counter. | S |
| E14-T4 | Portfolio CSV export | Export filtered portfolio view as a CSV downloadable file (single user, MVP). | `/js/persistence/exportCsv.js` + UI button | E14-T2 | CSV round-trip test: generated CSV parses back to same records. | S |
| E14-T5 | Validated Kaizen definition docs | Inline info tooltip on Portfolio page: "A Validated Kaizen is a CLOSED project with: (a) matching-metric remeasurement, (b) `closeKind ∈ {SUCCESS, PARTIAL}`, (c) Finance-signed ROI. Failed-honest closes are valuable but not Validated." | Microcopy in `/js/ui/coaching/registry.js` | E14-T2 | Tooltip test. | S |

**E14 total: 5 tasks ≈ 4–5d.**

---

### E15 — Statistical Analysis Surfaces (new in v0.3; post-launch with DMAIC)

**Traces to:** `DMAIC_STANDARD §11.3` items 3, 6 + §6. Post-launch — DMAIC ships after MVP; until E15, Black Belts export to Minitab/JMP/R/Python and attach outputs as artifact PDFs.

| ID | Title | Scope | Artifact | Deps | Output | Estimate |
|---|---|---|---|---|---|---|
| E15-T1 | Control Chart component | X-bar-R or I-MR chart with control-limits + Western Electric signal-detection rules. Accepts a `NUMERIC` artifact value series. Renders inline on `ScheduledActivity` view. | `/js/ui/components/ControlChart.js` | E10 | 4 rule-violation fixture tests (WE 1–4). Chart renders SVG. | L |
| E15-T2 | Capability Report viewer | Cp/Cpk/Pp/Ppk computation + normality plot (histogram + normal probability plot + Anderson-Darling). Accepts an artifact value series + USL/LSL. | `/js/ui/components/CapabilityReport.js` | E10 | Capability fixture: Cpk=1.33 canonical case. | M |
| E15-T3 | Hypothesis Test Results Log viewer | Pre-registered hypothesis list + test results + Bonferroni/FDR correction flag. Artifact A20 spec from `DMAIC_STANDARD §4`. | `/js/ui/components/HypothesisLog.js` | E10 | 3 hypotheses fixture; 2 significant, 1 not; Bonferroni adjusted p shown. | M |
| E15-T4 | Regression Diagnostics viewer | R², p-values, residual plots (homoscedasticity, normality, pattern detection), VIF flag. | `/js/ui/components/RegressionDiagnostics.js` | E10 | Regression fixture with 3 significant X's + 1 high-VIF X flagged. | M |
| E15-T5 | Planning Agent rulepack — DMAIC stats lints | Machine-checkable rules per `DMAIC_STANDARD §11.4` item 3: hypothesis test without pre-registration timestamp (error); k > 3 tests without correction (error); VIF > 10 (warning); Cpk on non-normal without transform (warning); MSA > 30% with Baseline close (error). | `/js/ai/agents/planning/dmaicRules.js` | E15-T1..T4 | 5 unit tests covering each rule. | M |

**E15 total: 5 tasks ≈ 8–10d.**

---

### E16 — MSA Workflow (new in v0.3; post-launch with DMAIC)

**Traces to:** `DMAIC_STANDARD §11.3` item 4 + §6.2; enables the `ARCHITECTURE §8` invariant "DMAIC Baseline requires MSA closed with acceptance rating."

| ID | Title | Scope | Artifact | Deps | Output | Estimate |
|---|---|---|---|---|---|---|
| E16-T1 | MSA capture grid UI | 10-sample × 2–3-appraiser × 2–3-trial matrix input form. Validates each cell is numeric. | `/js/ui/components/MsaCaptureGrid.js` | E10 | Grid accepts capture; submit disabled until complete. | M |
| E16-T2 | Gage R&R computation (ANOVA method) | Compute %R&R = 100 × √(EV² + AV²) / TV. Returns `acceptanceRating ∈ {'ACCEPTABLE', 'MARGINAL_ACCEPTABLE', 'UNACCEPTABLE'}`. | `/js/engine/msa/gageRR.js` | — | 3 fixtures: R&R=8% → ACCEPTABLE; R&R=22% → MARGINAL_ACCEPTABLE; R&R=41% → UNACCEPTABLE. | M |
| E16-T3 | Kappa computation (attribute) | Cohen's or Fleiss' kappa for attribute measurement systems. Threshold: Kappa ≥ 0.7 → acceptable. | `/js/engine/msa/kappa.js` | — | 2 fixtures: Kappa=0.82 → ACCEPTABLE; Kappa=0.55 → UNACCEPTABLE. | S |
| E16-T4 | `#31 MSA Report` artifact schema extension | Artifact output structure: `{method: 'GAGE_RR'|'KAPPA', data: [[...]], results: {percentRR?, kappa?, acceptanceRating}, runAt, appraisers[]}`. | Catalog seed patch for `#31` | E16-T2, E16-T3 | Seed test: artifact validator accepts the shape. | S |
| E16-T5 | `ActivityService.close()` guard for `#28` | When closing Baseline (`#28`), read the MSA artifact from the same Kaizen scope; refuse close if `acceptanceRating === 'UNACCEPTABLE'`. | Edits to `/js/services/ActivityService.js` | E16-T4, E2-T8 | Unit test: close `#28` with UNACCEPTABLE MSA → throws `MSA_UNACCEPTABLE`. | S |

**E16 total: 5 tasks ≈ 5–6d.**

---

### E17 — Kaizen Event 90D Phase Support (new in v0.3)

**Traces to:** `KAIZEN_EVENT_STANDARD §11.2–§11.5`; `ARCHITECTURE §2.9, §3.4.1, §9 items 16–19`; `ENGINE_DESIGN §4.4, §4.4.1`; `CATALOG_GAPS §K`. Ships with Kaizen 90 projectType activation — NOT in core MVP window, but before first Kaizen 90 go-live.

| ID | Title | Scope | Artifact | Deps | Output | Estimate |
|---|---|---|---|---|---|---|
| E17-T1 | Add `KAIZEN_EVENT_90D` to `ProjectType` enum + Kaizen extensions | Land `KAIZEN_EVENT_90D` enum value; add `Kaizen.implementationLeadUserId`, `sustainmentGatePassed`, `phaseDefinitions` seeder for Kaizen 90's 4 phases. Update `projectTypeBinding` field type to support string OR string[]. | Edits to `/js/domain/types.js`, migration in `/js/persistence/migrations/` | E13-T2, E12 | Backfill migration leaves existing Kaizens unchanged. | S |
| E17-T2 | Seed §K catalog bindings for `#42`–`#50` | Patch catalog `#42`–`#50` to have `projectTypeBinding: ['KAIZEN_EVENT', 'KAIZEN_EVENT_90D']` + `phaseBinding` per K.1 table. Seed the ~73 `kze_*` orchestration tasks from `KAIZEN_EVENT_STANDARD §3`. | Seed patch in `/js/catalog/seed/kaizenEvent90.js` | E17-T1, E2-T9 | 82 entries seeded (9 public anchors + 73 kze_* tasks). DAG validator passes. | M |
| E17-T3 | Phase FSM for Kaizen 90 + `canAdvancePhase()` | Implement the 4-state FSM per `ARCHITECTURE §3.4.1`. Extend `canAdvancePhase()` to route by `projectType`. Emits `ProjectPhaseAdvanced`. | New `/js/domain/fsm/kaizen90Phase.js`, edits to `/js/services/KaizenService.js` | E17-T1 | All 4 guard transitions unit-tested; failing guard throws named error. | M |
| E17-T4 | Sustainment Gate helper + attestation | `canAttemptRebaseline(kaizen, adoptionLog)` per `ENGINE_DESIGN §4.4.1`. `KaizenService.attestSustainmentGate()` flips `sustainmentGatePassed` to true. Guard in `KaizenService.startRemeasurement()` for Kaizen 90 refuses unless `sustainmentGatePassed === true`. | `/js/engine/kaizen90/sustainmentGate.js`, edits to `KaizenService` | E17-T3, E18 (adoption log source) | Test: attempt `startRemeasurement` without gate pass → throws `SUSTAINMENT_GATE_NOT_PASSED`. | M |
| E17-T5 | `KaizenCard` PhaseStepper variant for Kaizen 90 | 4-node stepper (PRE_EVENT/EVENT/POST_EVENT/SUSTAIN). Distinct from Accelerator's 5-node variant. Driven by `Kaizen.phaseDefinitions` snapshot. Sustainment Gate info panel visible at Day 68+. | `/js/ui/components/PhaseStepper.js` (variant) + wiring in `KaizenCard` | E17-T3, E13-T7 | All 4 phase nodes render; attestation UI surfaces. | M |
| E17-T6 | Implementation Lead assignment UI at project create | At Kaizen 90 promote flow, require selecting a user with `IMPLEMENTATION_LEAD` role, distinct from Facilitator / Process Owner. Surfaces Part 1.3 decision table from `KAIZEN_EVENT_STANDARD` alongside the project-type picker. | New project-type intake view + validation | E17-T1 | UI blocks promote until role selected; validator rejects same-user-as-Facilitator. | M |

**E17 total: 6 tasks ≈ 5–7d.**

---

### E18 — Implementation Backlog Tracker (new in v0.3)

**Traces to:** `KAIZEN_EVENT_STANDARD §11.2` item 5 + §11.3 E18 description; `ARCHITECTURE §2.9 actions[].strategic`; `ENGINE_DESIGN §4.4.1`. **MVP must-have** because Kaizen 90 Sustainment Gate cannot function without the adoption log, and Accelerator Phase 3→4 strategic veto needs the `strategic` flag storage.

| ID | Title | Scope | Artifact | Deps | Output | Estimate |
|---|---|---|---|---|---|---|
| E18-T1 | `ImplementationBacklog` entity | Define entity: `{id, kaizenId, items: [{id, name, acceptanceCriterion, size, sprint, priorityScore, ownerRef, strategic: boolean, doneAt, beforeLink, afterLink}]}`. Supersedes `Kaizen.actions[]` for Kaizen 90; back-populates simplified view on Kaizen.actions for legacy. | `/js/domain/ImplementationBacklog.js`, persistence key `bamx:v1:backlogs` | E1, E12 | Entity tests; migration back-populates existing Kaizens' `actions[]` into `items[]`. | M |
| E18-T2 | Backlog CRUD service | Create / update / delete / reorder items. Rejects edit when `doneAt !== null` on a completed item (append-only for done items). | `/js/services/BacklogService.js` | E18-T1 | CRUD tests; done-item edit rejected. | S |
| E18-T3 | Weekly sprint status tracking | Weekly rollup: items planned, items completed, velocity = completed / planned. Emits `ProjectPaceWarning` with `kind='SPRINT_VELOCITY_UNDER_60'` when < 60%. | `/js/engine/kaizen90/sprintVelocity.js` | E18-T2 | 4-fixture test; velocity thresholds emit warnings correctly. | M |
| E18-T4 | Issue / Risk log (A25) | Separate entity for issues + risks encountered during POST_EVENT. P×I scoring. Mitigation owner per risk. | `/js/domain/IssueLog.js` + service | E18-T1 | CRUD tests. | S |
| E18-T5 | Adoption log (A28) | Daily adoption-percent per process step. Event stream. `kze_postevent_12` (adoption audit) closes daily, appending a row. | `/js/domain/AdoptionLog.js` + service | E18-T1 | Append-only tests. Read API returns trailing-N-days view. | M |
| E18-T6 | Sustainment Gate calculator surface | UI panel on `KaizenCard` for Kaizen 90 showing `canAttemptRebaseline()` output: consecutive adoption hits, rollback count, eligibility flag. Refreshes on every adoption-log append. | `/js/ui/components/SustainmentGatePanel.js` | E18-T5, E17-T4 | Panel test: 10-day fixture → eligible=true; 9-day → eligible=false. | M |
| E18-T7 | Backlog UI + drag-to-reorder | Table view with acceptance criterion, priority, sprint. Reorder by priority drag. Strategic-item badge. Filter by sprint. | `/js/ui/components/BacklogTable.js` | E18-T2 | Drag test: reorder persists. | L |

**E18 total: 7 tasks ≈ 8–10d.**

---

**v0.3 extensions to E7, E8** (lightweight additions, no new epic days beyond originals):

| ID | Title | Scope | Artifact | Deps | Output | Estimate |
|---|---|---|---|---|---|---|
| E7-T9 | Finance partner co-sign enforcement | Per `ARCHITECTURE §2.9` invariant + §8 cross-ref. `KaizenService.applyRoiArtifact()` refuses write unless co-signer has `FINANCE_PARTNER` role. Records `financePartnerUserId` on `roiProjections[]` row (DMAIC) or the ROI ScheduledActivity's `outputArtifactRef` (Accelerator / Kaizen 90). | Edits to `/js/services/KaizenService.js` | E7-T4, E13-T6 | Unit test: non-finance user → refuses; finance user → accepts + records. | S |
| E7-T10 | Two-pass ROI tracking for DMAIC | Per `DMAIC_STANDARD §1.5` refinement #4. `KaizenService.applyRoiArtifact({passNumber})` appends to `roiProjections[]`. Close guard refuses unless `roiProjections.length === 2` for DMAIC. | Edits to `/js/services/KaizenService.js` | E7-T9 | Unit test: DMAIC close with only pass 1 → throws `DMAIC_ROI_PASS_2_MISSING`. | S |
| E7-T11 | `validatedRootCauseArtifactRef` for DMAIC Analyze exit | Per `ARCHITECTURE §2.9` invariant. Extend DMAIC phase-derivation in `phaseFor()` to refuse Improve-eligibility unless `validatedRootCauseArtifactRef !== null AND confoundCheckPassed === true`. | Edits to `/js/composer/eligibleDmaic.js` + `KaizenService` | E7-T9 | Unit test: DMAIC Improve entry ineligible until root-cause artifact validated. | S |
| E7-T12 | Sustainment check-ins auto-seed on CLOSED | Per `ARCHITECTURE §2.9` invariant. On CLOSED with `closeKind ∈ {SUCCESS, PARTIAL}`, seed 3 rows at Day 30/60/90 post-close into `Kaizen.sustainmentCheckIns[]`. Append-only after due date passes. | Edits to `/js/services/KaizenService.js` | E7-T4 | Unit test: close triggers 3 rows. Missed row stays with `completedAt=null`. | S |
| E7-T13 | Sustainment Gate guard on `startRemeasurement` for Kaizen 90 | See E17-T4 — placed here for cross-reference. Tested alongside E17. | Already in E17-T4 | — | — | 0 (cross-ref) |
| E7-T14 | `ScopeChangeRequested` event + `Kaizen.scopeChanges[]` append | Per `ARCHITECTURE §6.1` + §9 item 20. `KaizenService.appendScopeChange()` appends and emits. Does NOT auto-pause. | Edits to `/js/services/KaizenService.js`, `/js/events/events.js` | E7-T1 | Unit test: append + event fire; Kaizen state unchanged. | S |
| E8-T8 | §J DMAIC DAG edge seed | Seed the full §J DMAIC `dependsOn` edge list including `#28 dependsOn [#22, #31]`, `#33 dependsOn [#22, #36]`, and the two-pass `#39` semantics via `linkedDmaicStepRef.passNumber`. | Seed patch in `/js/catalog/seed/dmaicDag.js` (extend existing E2-T8) | E2-T8 | 22 DMAIC edges seeded; DAG validator passes. Two-pass `#39` scheduling test. | S |

**E7 v0.3 total: +6 tasks ≈ 3d.** **E8 v0.3 total: +1 task ≈ 0.5d.**

---

**Grand total: 152 tasks** across 18 epics (E1 10, E2 9, E3 12, E4 7, E5 7, E6 7, E7 14, E8 8, E9 9, E10 16, E11 5, E12 9, E13 13, E14 5, E15 5, E16 5, E17 6, E18 7).

---

## 3. 30-60-90-120-150 Plan (5 windows, v0.3)

The v0.2 plan had 4 windows (30-60-90 core + Window 4 Accelerator, ~100 project days). v0.3 adds five new epics (E14–E18, ~35 engineer-days) and reshapes to a 5-window plan (~135 project days total). MVP core remains Windows 1–3 (90 days); Window 4 is Accelerator + E14 + E18 (the MVP-must-have portion of v0.3 additions); Window 5 is Kaizen 90 activation + DMAIC statistical surfaces.

### 3.1 Cumulative effort summary (v0.3)

| New epic | Effort | Ships in window | Rationale for window placement |
|---|---|---|---|
| **E14** Validated Portfolio | 5d | **Window 4 (MVP core)** | MVP must-have — "Validated Kaizen" is the product's proof-point |
| **E18** Implementation Backlog | 10d | **Window 4 (MVP core)** | Prereq for E17 Sustainment Gate calc; provides `strategic` flag storage for Accelerator E13-T10 |
| **E15** Statistical Analysis Surfaces | 10d | Window 5 (post-launch with DMAIC) | DMAIC-specific; DMAIC doesn't ship in MVP core |
| **E16** MSA Workflow | 5d | Window 5 (post-launch with DMAIC) | DMAIC-specific; enables MSA-before-Baseline invariant |
| **E17** Kaizen 90 Phase Support | 5d | Window 5 (Kaizen 90 activation) | Depends on E18 adoption log + backlog entity |

**Total: +35 engineer-days.** Original v0.2 plan was ~100 project days. v0.3 plan is ~135 project days.

### 3.2 30-60-90-120-150 Plan

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

**Net (Day 90 — launch):** a real single user can run a full Daily + Weekly cycle end-to-end, capture evidence, promote a Kaizen, close it with remeasurement, and see their three dashboard numbers. The launch metric is measurable.

**Net (Day 120 — end of Window 4):** user can also run a 30-Day Accelerator start-to-finish, see Validated Kaizen portfolio, and track Implementation Backlog.

**Net (Day 150 — end of Window 5, v0.3 complete):** user can run a 90-Day Kaizen Event with Sustainment Gate at Day 70, run DMAIC projects with in-product statistical surfaces (MSA / Capability / Control Chart / Hypothesis Log / Regression Diagnostics), and two-pass Financial Benefit Translator with Finance co-sign. All 26 refinements from the three operating standards are enforced in the invariant engine.

### Window 4 — Days 91–~120 — "Accelerator + Portfolio + Backlog Tracker (E13 + E14 + E18 + E13 v0.3 extensions + E7 v0.3 extensions)"

| | |
|---|---|
| Theme | Land the 30-Day Kaizen Accelerator project type on the MVP backbone + ship Validated Kaizen Portfolio + Implementation Backlog Tracker. Timeline extends from Day 90 to ~Day 120 per `ARCHITECTURE §9` items 15 + 22. |
| Epics worked on | E13 (100%, including v0.3 extensions E13-T10..T13 for weighted guard, Control Plan at Phase 2, Finance mandatory, `ProjectPaceWarning` rename). E14 (100%, Validated Portfolio). E18 (100%, Implementation Backlog — note: E18 is a prereq for E17's Sustainment Gate calc, but its outputs also back Accelerator's strategic-item storage). E7 v0.3 extensions (T9–T12, T14). |
| Demoable outcomes at window end | (a) Accelerator demos per v0.2 (phase advance, ROI capture, close refused without ROI). (b) **New:** PHASE_3 → PHASE_4 refused when an open strategic action exists, with microcopy "Strategic item #N is open — complete or defer before advancing." (c) **New:** `30d_2_5_define_improvements` produces a Control Plan draft; Phase 4 `30d_4_5_control_plan` pre-fills from it. (d) **New:** Finance partner required in `30d_0_5` roster; close refused without. (e) **New:** `/insights/portfolio` shows all Validated Kaizens with CSV export. (f) **New:** `ImplementationBacklog` entity; sprint-velocity rollup; strategic-flag storage. (g) `ProjectPaceWarning` emits on slow Phase 1 (replaces old `AcceleratorPaceWarning`). |
| Launch-metric preservation | Blueprint §7.4 launch metric (day-14 composition + reflection rate) remains computable at day 90 exactly as before. **Accelerator completion doesn't need to be demonstrated for the launch metric** — it only needs to be *open-able* at day 90. Portfolio and Backlog additions surface Validated Kaizen claims. |

### Window 5 — Days 121–~150 — "Kaizen 90 activation + DMAIC stats surfaces (E17 + E15 + E16 + E7 v0.3 stats extensions)"

| | |
|---|---|
| Theme | Activate `KAIZEN_EVENT_90D` project type end-to-end; ship DMAIC statistical analysis viewers + MSA workflow. |
| Epics worked on | E17 (100%, Kaizen 90 Phase Support including §K catalog bindings, Phase FSM, Sustainment Gate calculator+attestation, Implementation Lead assignment). E15 (100%, Statistical Analysis Surfaces — Control Chart / Capability / Hypothesis Log / Regression Diagnostics / Planning-Agent stats rulepack). E16 (100%, MSA Workflow — capture grid, Gage R&R ANOVA, Kappa, `ActivityService.close()` guard for `#28` Baseline). E7 v0.3 extensions continued (T10 two-pass ROI, T11 validated root cause). |
| Demoable outcomes at window end | (a) A user promotes a Kaizen with `projectType='KAIZEN_EVENT_90D'`, assigns an Implementation Lead distinct from Facilitator; `KaizenCard` renders 4-node PhaseStepper for PRE_EVENT. (b) Day 68 fixture test: Sustainment Gate panel shows consecutive-hit count; Facilitator attests; `sustainmentGatePassed=true`; POST_EVENT → SUSTAIN allowed. (c) Control Chart component renders an X-bar-R chart with Western Electric signal detection. (d) MSA capture grid accepts a 10×3×3 Gage R&R dataset; `acceptanceRating='MARGINAL_ACCEPTABLE'`; `#28` Baseline close allowed; same grid with R&R=41% refuses Baseline close. (e) Two-pass Financial Benefit Translator: DMAIC Improve close appends pass-1 row; Control close appends pass-2 with reconciliation delta; narrative close requires `roiProjections.length === 2`. (f) Planning Agent flags "hypothesis test without pre-registration timestamp" on a fixture artifact. |
| Launch-metric preservation | Launch metric unchanged. Window 5 epics are additive post-launch surfaces; the MVP 90-day launch metric was already green at Day 90. |
| Gate | **Window 5 gate is the exit gate for v0.3 operating-standard folding.** All 26 refinements implemented; all invariants tested; all named epics (E14–E18 + E7/E8/E13 extensions) shipped. Post-gate: production ops; new epics driven by customer feedback. |

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
| R15 | **Two-pass Financial Benefit Translator complexity (DMAIC).** Catalog `#39` scheduled twice in DMAIC creates potential for double-counting. A user might confuse pass-1 projection with pass-2 actual when reading the `roiProjections[]` log, or a rogue service write could append a third row. | TECH | M | M | Enforce pass-number discipline via `Kaizen.roiPassNumber` field + validator on `KaizenService.applyRoiArtifact({passNumber})` — refuses writes with unexpected pass numbers. Portfolio view (E14) always shows pass-2 for closed DMAIC projects; pass-1 is developer-inspectable only. Reconciliation delta > 30% flags MBB review. | Backend | `roiProjections.length > 2` ever observed in any record |
| R16 | **Sustainment Gate blocks Kaizen 90 closure.** Kaizen 90 could stall at Day 70+ if adoption doesn't hit 80%. Project cannot close without gate pass; Facilitator may feel pressure to rubber-stamp. | PRODUCT | M | H | Clear escalation path: on Day 68 the `SustainmentGatePanel` (E18-T6) shows eligibility + rollback count + missing days. If not eligible by Day 77, inline microcopy: "Gate extension is the right call. Sponsor approval extends POST_EVENT by 2 weeks." Abandonment path remains available. Weekly Sponsor checkpoint (`kze_postevent_18` per `KAIZEN_EVENT_STANDARD §3`) ensures Sponsor sees the risk by Day 45, not Day 77. | PM | Kaizen 90 stuck at POST_EVENT > Day 77 for any project |
| R17 | **Strategic-item veto creates Phase 3→4 advancement deadlock (Accelerator).** A user may have 90% of actions closed but one stuck strategic item; advance refused; 30-day window slips. | PRODUCT | L | M | Sponsor override path exists via `ScopeChangeRequested` with `approved=true + approvedBy=<sponsor_userId>` — flips a computed `sponsorOverridePhase3` flag. Override is logged as a scope-change Variance-equivalent for audit. Microcopy on blocked advance names the specific strategic item and offers "Request Sponsor override" affordance. | PM | Any Accelerator advances from PHASE_3 → PHASE_4 with an open strategic item (via override) |
| R18 | **Implementation Lead availability (Kaizen 90).** Kaizen 90 needs a dedicated ~50% allocation for Days 20–70; if the person rotates mid-project, velocity drops and Sustainment Gate risk climbs. | OPS | M | H | Named backup on charter at project create (enforced at E17-T6 intake flow — `implementationLeadBackupUserId` field, optional but strongly recommended). If primary rotates, backup auto-notified; `ProjectPaceWarning` fires with `kind='IMPLEMENTATION_LEAD_CHANGED'`. | PM | IL change event detected during POST_EVENT |

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
