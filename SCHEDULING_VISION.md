# CadencePlan — Scheduling System Design (Phases 1–2)

Owner: Product Manager + Backend/Logic Engineer Agents
Status: Draft v0.1 — covers Phase 1 (Product Definition) and Phase 2 (Scheduling System Design) of the CadencePlan subsystem inside BAM OS. Grounded in `PRODUCT_BLUEPRINT.md` v0.3, `ARCHITECTURE.md` v0.6, `ENGINE_DESIGN.md` v0.4.1, `CATALOG_GAPS.md` v0.3.1, `UX_FLOWS.md` v0.2.
Scope: authoritative product + engineering reference for the CadencePlan scheduler. No new entities; every rule cites an upstream doc.

> **Vocabulary lock.** CadencePlan (this subsystem) / BAM OS (the product) / Cadence Day | Cadence Week | Cadence Sprint | Cadence Month (the four composition cycles, per `ARCHITECTURE §2.4`) / The 4-2-2 Day (Deep 4h + Communication 2h + CI 2h, `PRODUCT_BLUEPRINT §3.2`) / Deep Block (`bucket=PROJECT` slice, `ENGINE_DESIGN §1.6`) / Standard Work Catalog (`CatalogEntry`, `ARCHITECTURE §2.2`) / Validated Kaizen (`Kaizen.state=CLOSED` with `Remeasurement`, `ARCHITECTURE §2.9`) / Friction Signal (`ARCHITECTURE §2.8`). Project types: **DMAIC / KAIZEN_EVENT / KAIZEN_EVENT_90D / KAIZEN_ACCELERATOR_30D / AD_HOC** + **PDCA** (catalog `#12`, 48h micro-cycle). Set-valued project binding per `CATALOG_GAPS §K.2`.

---

## Part 1 — Product Definition

### 1.1 Vision

CadencePlan is the **executable standard-work composer** inside BAM OS. It takes the Standard Work Catalog (~50 vetted activities + generics + project-type packs), the user's capacity signal, and the active Kaizen's phase, and emits a filled Cadence Day / Week / Sprint / Month that the user **Accepts, Edits, or Rejects** in under sixty seconds (`PRODUCT_BLUEPRINT §2`, `ENGINE_DESIGN §1`). It is **not a calendar** (no event creation, invites, free-draw grid — `PRODUCT_BLUEPRINT §4.3`) and **not a task app** (every block is an instance of a catalog entry with a known procedure + required output, `ARCHITECTURE §2.2`). The primitive is the catalog entry; the output is composed standard work with evidence attached; the KPI is one Validated Kaizen per monthly-active user per month (`PRODUCT_BLUEPRINT §7.5`).

### 1.2 Design Principles

1. **Defaults over setup.** New users get a composed Day before their second login; setup wizard is zero-length (`PRODUCT_BLUEPRINT §6.1` JTBD #1). Opinion shipped as seed data.
2. **Opinionated over flexible.** The 4-2-2 Day is a domain invariant, not a user preference (`ARCHITECTURE §2.4.1`). Non-optional set cannot be silently dropped (`PRODUCT_BLUEPRINT §3.4`).
3. **Sub-60s-or-bust.** From "open app" → "tomorrow scheduled" must finish within 60 seconds on the happy path (`PRODUCT_BLUEPRINT §7.3` leading indicator + `UX_FLOWS §4.1` Accept/Edit/Reject moment).
4. **Protect Deep Work absolutely.** Deep blocks precede lunch; external meetings drain COMMUNICATION first, never PROJECT (`ENGINE_DESIGN §2.1`, `ARCHITECTURE §5.5`). Skipping a Deep block logs a `Variance` row (`ARCHITECTURE §2.7`).
5. **Evidence before activity.** No `ScheduledActivity` closes without its `outputArtifactRef` (`ARCHITECTURE §2.5` invariant). No Kaizen closes without a `Remeasurement` that beats `BaselineMetric` (`ARCHITECTURE §2.9`).
6. **One source of truth per time block.** `ScheduledActivity.bucket` is frozen at schedule time; the composer never re-infers (`ARCHITECTURE §2.5`, `CATALOG_GAPS §H.1`). Manual edits re-emit `InvariantEngine` checks, they do not bypass them.
7. **Deterministic over AI-magical.** The MVP composer is rule-based and inspectable — every placement appends to `composerInputsSnapshot.explain[]` (`ENGINE_DESIGN §1.2` why-trail). AI coaching is a Next-state overlay (`PRODUCT_BLUEPRINT §5.2`), not a dependency.
8. **Composition, not scheduling.** Cycles are compositions of catalog entries, not free-form event plans (`PRODUCT_BLUEPRINT §2`, `§3.2`). The user does not "draw a day"; they accept/edit a proposed composition.

### 1.3 Core User Problems

1. **Blank-calendar paralysis.** Every day starts from zero; rituals exist on paper but don't happen (`PRODUCT_BLUEPRINT §6.1` pain points). CadencePlan ships tomorrow already composed.
2. **Deep Work leaks.** "Strategy block" is silently eaten by escalations; no audit trail (`PRODUCT_BLUEPRINT §6.2`). Variance log with reason codes makes the cost visible (`ARCHITECTURE §2.7`).
3. **Rituals that don't run.** Sprint Planning / Review / Retro on the doc; no evidence they fired (`PRODUCT_BLUEPRINT §6.3`). Non-optional set enforcement + adherence % make this measurable (`PRODUCT_BLUEPRINT §7.2`).
4. **Kaizen-by-workshop.** Improvements invented on a Monday brainstorm, not promoted from real friction (`PRODUCT_BLUEPRINT §6.4`). FrictionSignal → Kaizen promotion pipeline solves it (`ENGINE_DESIGN §4.5`).
5. **Baseline-free "wins."** Results claimed without before/after numbers (`PRODUCT_BLUEPRINT §2`). `BaselineMetric` + `Remeasurement` required at close (`ARCHITECTURE §2.9`).
6. **CI time crushed by reactive work.** 2h CI block routinely lost (`PRODUCT_BLUEPRINT §6.1`). CadencePlan anchors CI in the Daily composer (`ENGINE_DESIGN §1.2` STEP 6) with `CI floor ≥ 60 min` guard.
7. **Context-switch tax.** Half-day fragmented across five topics. Default 2×2h Deep slice (`User.deepSlicePreference='2x2h'`, `ARCHITECTURE §2.3`) plus ordering rule "Deep before lunch" (`ENGINE_DESIGN §1.7`) enforce contiguous focus.
8. **Silent capacity overrun.** Classic apps happily pack 10h into an 8h day. CadencePlan returns `INFEASIBLE` with a guided remediation list rather than silently truncate (`ARCHITECTURE §4.7`, `ENGINE_DESIGN §1.8`).

### 1.4 User Stories (12)

Five of twelve are sub-60s flow; rest cover edits, project types, and visibility.

1. *(sub-60s)* As a Practitioner I can open BAM OS at 08:58 and Accept tomorrow's proposed 4-2-2 Day in one tap so I start executing at 09:00 standup without re-planning (`PRODUCT_BLUEPRINT §6.1` JTBD #1).
2. *(sub-60s)* As a Practitioner I can see "composed because" rationale on every block (`composerInputsSnapshot.explain`, `ENGINE_DESIGN §1.2`) so I trust the defaults without clicking into each one.
3. *(sub-60s)* As a Practitioner I can tap Reject with a one-line reason and re-compose in under 5 seconds when the day is wrong so the composer learns (`UX_FLOWS §4.1`).
4. *(sub-60s)* As a Practitioner I can drag a configurable CI block up into my AM slot without the 4-2-2 shape breaking (drop rule in `UX_FLOWS §4.2`) so edits feel instant.
5. *(sub-60s)* As a Practitioner I can Accept Monday's Weekly composition on Sunday evening in under 60 seconds so the work week is pre-committed (`PRODUCT_BLUEPRINT §7.3`).
6. As a Practitioner I can close a `ScheduledActivity` with a 60-second reflection that writes straight into the catalog entry's required output so evidence is captured in the moment (`PRODUCT_BLUEPRINT §6.1` JTBD #2).
7. As a Practitioner I can run a 20-minute Weekly Reflection that pulls the week's variances into a DMAIC-lite worksheet so one Kaizen promotes from evidence (`PRODUCT_BLUEPRINT §6.1` JTBD #3).
8. As a Practitioner running a 30-Day Kaizen Accelerator I can see only Phase-N tasks in my Deep payload list so I don't prematurely work Phase 3 tasks during Phase 1 (`ENGINE_DESIGN §4.2` phase-binding filter).
9. As a CI Champion I can open a DMAIC Kaizen and see the DAG-derived next-eligible steps so parallel async work is possible without re-ordering manually (`CATALOG_GAPS §J`, `ARCHITECTURE §4.5 R9`).
10. As a Leader I can defend a broken Deep block with one-tap variance + reason code so quarterly cost of interruptions is auditable (`ARCHITECTURE §2.7`, `PRODUCT_BLUEPRINT §6.2`).
11. As a Practitioner I can mark a day `INFEASIBLE` after raising capacity, reducing external, or skipping a ceremony with reason so I never silently over-commit (`ARCHITECTURE §4.7`).
12. As a Practitioner I can see adherence %, composition-acceptance %, and active-Kaizen delta on login so I know whether BAM OS is actually running for me (`PRODUCT_BLUEPRINT §5.1` dashboard).

### 1.5 JTBDs (6)

1. **Schedule tomorrow.** When I close today's work, I want tomorrow already composed as a 4-2-2 Day of catalog activities, so I can start executing at 09:00 standup without planning from zero. *(primary scheduling JTBD; `PRODUCT_BLUEPRINT §6.1` #1)*
2. **Capture evidence.** When I close a scheduled catalog activity, I want a 60-second reflection that writes the required output artifact, so the week's evidence is captured while it is still fresh. *(`PRODUCT_BLUEPRINT §6.1` #2)*
3. **Promote Kaizen from evidence.** When a week ends, I want a guided 20-minute Weekly Reflection over my own variances and friction signals, so one concrete improvement promotes from evidence instead of memory. *(`PRODUCT_BLUEPRINT §6.1` #3, `ENGINE_DESIGN §4.5`)*
4. **Protect Deep Work.** When an escalation breaks a Deep block, I want a one-tap variance with reason code, so by quarter-end the variance log shows the true cost of interruptions. *(`PRODUCT_BLUEPRINT §6.2`)*
5. **Run a multi-sprint DMAIC.** When I advance a DMAIC Kaizen, I want the composer to auto-pick the next DAG-eligible step into my Deep block, so the project progresses without me tracking the walk manually. *(`PRODUCT_BLUEPRINT §3.5`, `ENGINE_DESIGN §4.2`)*
6. **Close with validated results.** When I close a Kaizen, I want the system to refuse closure without a remeasured number (or a captured honest-failure narrative), so the portfolio shows truth. *(`PRODUCT_BLUEPRINT §6.4`, `ARCHITECTURE §2.9`)*

### 1.6 Success Criteria

| # | Metric | Target (90-day MVP) | Source |
|---|---|---|---|
| 1 | Sub-60s composition flow (open → Accept/Edit/Reject) — p75 latency | ≤ 60 s | `PRODUCT_BLUEPRINT §7.3` leading indicator + design principle 1.2.3 |
| 2 | Standard Work adherence (non-optional activities completed with required artifact, last 14d) | ≥ 70% WAU | `PRODUCT_BLUEPRINT §7.2` |
| 3 | Composition acceptance rate — Daily cycle, Accept-without-edit | ≥ 60% | `PRODUCT_BLUEPRINT §7.2` |
| 4 | Composition acceptance rate — Weekly cycle, Accept-without-edit | ≥ 50% | `PRODUCT_BLUEPRINT §7.2` |
| 5 | End-of-activity reflection rate (within 15 min of close) | ≥ 75% | `PRODUCT_BLUEPRINT §7.2` |
| 6 | Validated Kaizen throughput | ≥ 1 per user per month | `PRODUCT_BLUEPRINT §7.2`, §7.5 |
| 7 | INFEASIBLE rate — % of compose invocations returning INFEASIBLE | ≤ 5% after day 14 | `ARCHITECTURE §4.7`, `ENGINE_DESIGN §1.8` (chronic over-schedule indicator) |
| 8 | Launch metric — Day-14 active composition-and-reflection rate | ≥ 35% of signups | `PRODUCT_BLUEPRINT §7.4` |

### 1.7 Constraints

1. **Single-user MVP.** No multi-participant scheduling; team ceremonies placed on the individual's calendar (`CATALOG_GAPS §H.3`).
2. **Deterministic composer only.** No LLM in the critical path; AI coaching deferred (`PRODUCT_BLUEPRINT §5.2`, `ENGINE_DESIGN §1`).
3. **localStorage persistence in MVP.** No backend API; forward-compat to Postgres in Next (`ARCHITECTURE §7.1`).
4. **8h default daily capacity.** Override lives on `Composition.externalMinutesToday` or a one-day User override; does not mutate default (`ARCHITECTURE §2.3`).
5. **One active Kaizen per user in MVP.** Cap of 3 in Next (`PRODUCT_BLUEPRINT §5.2`, `ARCHITECTURE §2.9`).
6. **No external calendar sync in MVP.** Manual `externalMinutesToday` entry only (`ARCHITECTURE §5.5`).
7. **Non-optional set is domain-invariant.** The four daily anchors cannot be disabled per-user (`PRODUCT_BLUEPRINT §3.4`, `ENGINE_DESIGN §1.2` DAILY_NON_OPTIONAL_SET).
8. **4-2-2 shape validated at Composition `ACCEPTED` → `ACTIVE` transition** by `InvariantEngine`, not by UI (`ARCHITECTURE §2.4.1`, §3.1).

### 1.8 Differentiators (6 items, none existing in market competitors)

1. **Catalog-primitive scheduling.** Every block is an instance of a vetted catalog entry with a defined procedure + required output artifact — no product on the market ships the ~50-entry BAM catalog as seeded, schedulable data (`PRODUCT_BLUEPRINT §2`, `ARCHITECTURE §2.2`).
2. **4-2-2 shape as a domain invariant.** Competitors treat time-blocking as a user preference; BAM OS validates 4-2-2 at every Composition state transition and rejects saves that violate it (`ARCHITECTURE §2.4.1`, §5.2).
3. **DAG-based DMAIC payload selection with parallel eligibility.** Eligible DMAIC steps are derived from `CatalogEntry.dependsOn` (22-edge DAG, `CATALOG_GAPS §J`) and multiple entries can fire in parallel Deep blocks — not a strict numeric #20 → #41 walk (`ARCHITECTURE §4.5 R9`, `ENGINE_DESIGN §4.2`).
4. **Phase-binding filter for phased project types.** Accelerator (5 phases) and Kaizen 90 (4 phases) filter Deep payload to the Kaizen's active phase; no product surfaces a Phase 3 task during Phase 1 (`ARCHITECTURE §2.2`, `ENGINE_DESIGN §4.2`).
5. **INFEASIBLE-as-first-class.** When capacity cannot hold non-optionals + ceremonies, CadencePlan returns a structured `InfeasibleResult` with ordered remediation buttons — it does not silently truncate (`ARCHITECTURE §4.7`, `ENGINE_DESIGN §1.8`). No competitor does this.
6. **Validated-Kaizen close gate.** Kaizen close requires a `Remeasurement` referencing the same `MetricDefinition` as the locked `BaselineMetric` (`ARCHITECTURE §2.9`, §2.11). Competitor retrospective tools accept prose "wins"; BAM OS refuses them.

---

## Part 2 — Scheduling System Design

### 2.1 Conceptual Scheduling Model

```
          ┌──────────────────────────┐
          │  Standard Work Catalog   │  CatalogEntry (bucket, cadence, dependsOn,
          │   (~50 + generics +      │   projectTypeBinding, phaseBinding, output)
          │    project-type packs)   │   — ARCHITECTURE §2.2
          └───────────┬──────────────┘
                      │  materialize(entry, input)
                      ▼
          ┌──────────────────────────┐
          │    ScheduledActivity     │  one instance inside a Composition;
          │  (bucket FROZEN here)    │  carries intention, output, reflection,
          │                          │  linkedKaizenId, linkedDmaicStepRef
          └───────────┬──────────────┘  — ARCHITECTURE §2.5
                      │  child-of
                      ▼
          ┌──────────────────────────┐
          │       Composition        │  cycleType ∈ {DAILY, WEEKLY, SPRINT,
          │  (Day / Week / Sprint /  │   MONTHLY}; parentCompositionId links
          │     Month)               │   Daily → Weekly → Sprint → Monthly
          └───────────┬──────────────┘  — ARCHITECTURE §2.4
                      │  belongs-to
                      ▼
          ┌──────────────────────────┐
          │          Cycle           │  abstract time-box, not a stored row;
          │  (domain concept)        │  realized concretely as a Composition
          └──────────────────────────┘

Daily composition must satisfy the 4-2-2 invariant:
    PROJECT   = 240 min  (Deep Work)
    COMMUNICATION = 120 min  (anchors 09:00, 09:15, 13:00 + fillers)
    CI        = 120 min  (anchors 17:00 reflection + rotation)
Totals scale proportionally for half-day capacity (2-1-1) per ENGINE_DESIGN §2.1.
```

**Invariant chain.** CatalogEntry has an immutable `bucket` (`PROJECT | COMMUNICATION | CI`, `CATALOG_GAPS §H.1`). At materialize time, `ScheduledActivity.bucket` is frozen from the entry's bucket and never re-inferred (`ARCHITECTURE §2.5`). The Daily Composition aggregates minutes per bucket; at any `ACCEPTED | EDITED | ACTIVE | CLOSED` state, the 4-2-2 shape **must hold** plus the non-optional set **must be present** (`ARCHITECTURE §2.4.1`). The 4-2-2 Day is a **domain invariant, not a user preference** (`PRODUCT_BLUEPRINT §3.2`, design principle #2).

**Cycle hierarchy.** Weekly contains exactly 5 Daily child compositions plus weekly non-optionals attached to anchor days (`ARCHITECTURE §2.4.1`, `ENGINE_DESIGN §1.3` STEP W3). Sprint (Next) contains 2 Weekly. Monthly (Next) contains ~2 Sprints. Each level's composer **calls down** to the level below (`composeWeekly` invokes `composeDaily` for each workday, `ENGINE_DESIGN §1.3`).

### 2.2 Project Type Model

Five project types are first-class discriminators on `Kaizen.projectType` (`ARCHITECTURE §2.9`), plus PDCA as a distinct micro-cycle entity (`PdcaExperiment`, `ARCHITECTURE §2.13`).

| Enum | Phase Structure | Duration | Catalog Range | Authoritative Doc |
|---|---|---|---|---|
| `DMAIC` | Derived (DEFINE → MEASURE → ANALYZE → IMPROVE → CONTROL) from `phaseFor()` max-activity-# | Multi-sprint (typ. 3–6 sprints) | #20–#41 (+ project-type-bound generics) via 22-edge DAG | `DMAIC_STANDARD.md` v1.0 + `CATALOG_GAPS §J` DAG |
| `KAIZEN_EVENT` | Linear walk #42 → #50 (no phase binding) | 1–5 day burst | #42–#50 | `KAIZEN_EVENT_STANDARD.md` v1.0 |
| `KAIZEN_EVENT_90D` | `PRE_EVENT → EVENT → POST_EVENT → SUSTAIN` (4 phases) | 90-day window | #42–#50 set-valued bound + ~73 `kze_*` tasks | `KAIZEN_EVENT_STANDARD.md` v1.0 §3 + `CATALOG_GAPS §K` |
| `KAIZEN_ACCELERATOR_30D` | `PHASE_0 → PHASE_1 → PHASE_2 → PHASE_3 → PHASE_4` (5 phases, weighted P3→P4 guard) | 30 days | 31 `30d_*` entries | `PROJECT_TYPE_30D_KAIZEN.md` v1.0 + `ACCELERATOR_STANDARD.md` v1.0 |
| `AD_HOC` | None (no phases, no DAG) | User-declared `targetCloseDate`; overrun emits `ProjectPaceWarning{kind=AD_HOC_OVERRUN}` | Cross-project catalog entries + generics | `ADHOC_PDCA_STANDARD.md` v1.0 |
| `PDCA` (entity `PdcaExperiment`) | `PLAN → DO → CHECK → ACT` (iterate or graduate at 3 consecutive target hits) | 48-hour micro-cycle, up to 10 ticks then mandatory review | Catalog `#12` only | `ENGINE_DESIGN §4.1` + `ADHOC_PDCA_STANDARD.md` v1.0 |

**Set-valued binding.** Catalog #42–#50 bind to BOTH `KAIZEN_EVENT` and `KAIZEN_EVENT_90D` via `projectTypeBinding: ['KAIZEN_EVENT', 'KAIZEN_EVENT_90D']` (`CATALOG_GAPS §K`, `ARCHITECTURE §2.2`). Phase filter applied only when project type is the phased variant (`CATALOG_GAPS §K.2`).

**Payload selection** (`selectDeepPayload`, `ENGINE_DESIGN §1.6` + §4.2) is project-type-agnostic: filters by `projectTypeBinding` match, then `phaseBinding` match (if non-null), then DAG prerequisite satisfaction, then de-dupe against already-closed.

### 2.3 Task + Deliverable Data Model

User-facing vocabulary maps onto the existing entity set with no new stored entities required.

| User term | Entity mapping | Location |
|---|---|---|
| Task / "thing to do today" | `ScheduledActivity` — a materialized `CatalogEntry` instance inside a `Composition` | `ARCHITECTURE §2.5` |
| Subtask | `ScheduledActivity.intention` **field** (one-line declared outcome); multiple ScheduledActivity rows for one catalog entry = multi-slice (e.g., 2×2h Deep slices = 2 rows) | `ARCHITECTURE §2.5`, `ENGINE_DESIGN §1.6` sliceDeep |
| Deliverable | `ScheduledActivity.outputArtifactRef` — `{ schema, value }` matching `CatalogEntry.outputArtifact.schema` (TEXT / TWO_LIST / NUMERIC / DOCUMENT / CHART) | `ARCHITECTURE §2.2`, §2.5 |
| Milestone | Kaizen phase transition (`Kaizen.phase` change emits `ProjectPhaseAdvanced`) or a specific gate-task `ScheduledActivity` `CLOSED` state — **derived**, not stored as a standalone entity | `ENGINE_DESIGN §4.2` + `ARCHITECTURE §3.3` Kaizen FSM + phase-gate tasks per `CATALOG_GAPS §I.1` |
| Project | `Kaizen` row with `projectType` discriminator (DMAIC / KAIZEN_EVENT / KAIZEN_EVENT_90D / KAIZEN_ACCELERATOR_30D / AD_HOC) | `ARCHITECTURE §2.9` |
| Recurring rhythm | `CatalogEntry.cadence` enum (`DAILY | WEEKLY | SPRINT | MONTHLY | QUARTERLY | CONTINUOUS | ON_SIGNAL | EVENT_DRIVEN | EVERY_48H`), resolved into ScheduledActivity placements by Cycle composers | `ARCHITECTURE §2.2` + `ENGINE_DESIGN §3.2` cadence-to-placement mapping |
| Dependency | `CatalogEntry.dependsOn[]` — referenced by composer's `eligibleDmaicPayloadSteps()` DAG traversal | `ARCHITECTURE §2.2` + `ENGINE_DESIGN §4.2` |

**Coverage check.** Every user-visible "thing I plan" maps to `ScheduledActivity` or `Kaizen`. The four MVP entities `Composition`, `ScheduledActivity`, `Reflection`, `Variance` plus `Kaizen` + `BaselineMetric` + `Remeasurement` carry the full task/deliverable/milestone model.

> **Architecture gap:** None. The user-facing vocabulary is fully covered by the 12-entity `ARCHITECTURE §2.1` set without introducing a `Task` / `Subtask` / `Deliverable` / `Milestone` entity. Milestones are *derived* from Kaizen-phase transitions or gate-task CLOSED states; subtasks are the `intention` field + multi-slice pattern.

### 2.4 Scheduling Rules Engine (composer orchestration)

`ComposerService.composeDaily(input)` is the deterministic 10-step algorithm in `ENGINE_DESIGN §1.2`. Do **not** duplicate pseudo-code here; the authoritative implementation lives there. Steps named only, with one-line role:

1. **STEP 1 — Compute bucket targets.** `computeBucketTargets(input)` derives `{PROJECT, COMMUNICATION, CI}` targets scaled to capacity and reduced by `externalMinutesToday` (drains COMMUNICATION only). Per `ENGINE_DESIGN §2.1`.
2. **STEP 2 — Place daily non-optionals.** Four anchors from `DAILY_NON_OPTIONAL_SET` (Standup, AM Comm, Post-lunch Comm, End-of-Activity Reflection meta-slot). Per `ENGINE_DESIGN §1.2` + `PRODUCT_BLUEPRINT §3.4`.
3. **STEP 3 — Rescue yesterday's variance queue.** `SKIPPED_NON_OPTIONAL` variances get placement preference today if they fit remaining bucket budget. Rule R2 (`ARCHITECTURE §4.5`).
4. **STEP 4 — Place sprint-phase ceremonies.** PLANNING_DAY → Sprint Planning; MID_SPRINT_DAY → Mid-Sprint Review; REVIEW_DAY → Sprint Review + Retro. Phase ceremonies cannot be skipped silently (`ENGINE_DESIGN §1.2` STEP 4 assertion). Rule R4.
5. **STEP 5 — Place Deep Work payload.** `selectDeepPayload(input)` picks either the DAG-eligible DMAIC/Kaizen step or `Deep Work — Project Task (generic)`. Sliced per `User.deepSlicePreference` (default 2×2h). Rule R3 + R9.
6. **STEP 6 — Fill CI bucket by rotation.** `pickCI(input, placed, remainingCI)` picks next CI entry by priority (PDCA 80, L&D, 6S Email if inbox tripped, Document Review if pending). PDCA guard: ≥ 42h since last tick (`ENGINE_DESIGN §1.5`).
7. **STEP 7 — Fill COMMUNICATION bucket.** Wed/Thu → 1:1 (#16); else team meeting (#15); fallback generic Value-Added Communication (`CATALOG_GAPS §H.2`).
8. **STEP 8 — Order the day.** `orderDay(placed, input)` sets `plannedStartAt` for each block — Standup 09:00, AM Comm 09:15, Deep before lunch, Post-lunch Comm 13:00, CI toward EOD, Reflection 17:00. No bucket totals change. Per `ENGINE_DESIGN §1.7`.
9. **STEP 9 — Validate against `InvariantEngine`.** `validateComposition({cycleType, activities, userDailyCapacityMinutes, externalMinutesToday})` returns `{ok, failureCode, detail}`. If failed, one relaxation retry; else surface INFEASIBLE per §2.8 / `ENGINE_DESIGN §1.8`. Rule R8.
10. **STEP 10 — Build PROPOSED Composition.** Freezes `composerInputsSnapshot.explain[]` why-trail, returns `state='PROPOSED'` with all children `state='PROPOSED'` + `sourceOfSchedule='COMPOSER_AUTO'`.

**Weekly composer** (`composeWeekly`, `ENGINE_DESIGN §1.3`) calls `composeDaily` per workday, then STEP W3 attaches weekly non-optionals (Mid-Sprint Review, 1:1, L&D tick, 6S Email if tripped, Weekly Reflection on Fri PM) to anchor days, then STEP W4 enforces the cross-day PROJECT ≥ 1200 min weekly invariant (`ENGINE_DESIGN §2.3`).

### 2.5 Prioritization Logic

**Scoring formula** (used by `pickCI`, `pickCommFiller`, and by `pickHighestPriority` when multiple DAG-eligible DMAIC steps are candidates for a Deep block):

```
score = 3·phase_match
      + 2·unlock_recency
      + 2·urgency
      + 2·strategic_flag
      − 1·context_switch
      − 1·effort_mismatch
```

**Weight rationale.**

| Term | Weight | Why this weight |
|---|---|---|
| `phase_match` (1 if entry's `phaseBinding` === Kaizen.phase; 0.5 if null; 0 otherwise) | **+3 (dominant)** | Per `ENGINE_DESIGN §4.2` tiebreak #1: phase mismatch is the strongest disqualifier for phased project types. Accelerator Phase 3 task must not appear in Phase 1. Weight 3× over any contextual signal. |
| `unlock_recency` (1 if entry was unlocked by the most recently CLOSED dependency; else 0) | **+2** | Preserves momentum on the DMAIC DAG walk — when `#21 SIPOC` just closed, `#23 Stakeholder Analysis` should outrank `#32 Process Maps` even though both are eligible. Per `ENGINE_DESIGN §4.2` tiebreak #2. |
| `urgency` (1 if variance-rescue candidate or due-date within 48h; 0.5 if within 1 week; 0 otherwise) | **+2** | R2 variance-rescue must outrank casual CI rotation (`ARCHITECTURE §4.5 R2`); AD_HOC targetCloseDate within 48h elevates similarly. Paired with strategic_flag (both +2) to balance planned vs. time-pressured work. |
| `strategic_flag` (1 if `action.strategic === true` on the linked Kaizen; 0 otherwise) | **+2** | Accelerator Phase-3→4 gate refuses to advance with open strategic items (`ENGINE_DESIGN §4.2.2`). Elevating strategic-flagged payload reduces the chance the gate fires. Equal weight to urgency — neither dominates. |
| `context_switch` (1 if payload's project type differs from most-recent Deep block's project type; else 0) | **−1** | Penalizes jumping between DMAIC project and 30-Day Accelerator payload within the same day. Weight 1 (not 2) because sometimes a rescue is worth the switch. |
| `effort_mismatch` (1 if `entry.defaultDurationMinutes` > `remainingBucketMin` + 30; else 0) | **−1** | Penalizes scheduling a 240-min entry into a 120-min remaining slot. Low weight because `sliceDeep` can often resolve; not a hard disqualifier. |

**Tiebreak chain** (when scores equal, stable order): `activityNumber ASC`, then `id ASC`, per `ENGINE_DESIGN §4.2` tiebreak #3. Ensures deterministic output for identical inputs.

**One-block worked example.** Suppose the Deep block is being filled. Active Kaizen: DMAIC, `phase='ANALYZE'`. Two DAG-eligible steps: `#34 C&E Matrix` (just unlocked by `#32 Process Maps CLOSED` 10 min ago) and `#37 FMEA` (unlocked earlier, but `#36 Correlation` not yet closed — actually ineligible, so drop). Remaining Deep = 240 min. Most recent Deep block on 2026-04-17 was a DMAIC `#32` (same project).

| Candidate | phase_match | unlock_recency | urgency | strategic_flag | context_switch | effort_mismatch | **score** |
|---|---|---|---|---|---|---|---|
| `#34 C&E Matrix` (180 min, ANALYZE-phase, recently unlocked, not strategic, same project) | 3·1 = 3 | 2·1 = 2 | 2·0 = 0 | 2·0 = 0 | −1·0 = 0 | −1·0 = 0 | **5** |
| Generic `Deep Work — Project Task` (240 min, no phase, no unlock link, urgent only if variance; not strategic; same project) | 3·0.5 = 1.5 | 2·0 = 0 | 2·0 = 0 | 2·0 = 0 | −1·0 = 0 | −1·0 = 0 | **1.5** |

Winner: `#34 C&E Matrix` with score 5. Composer places it in the 09:30 Deep slot, linkedDmaicStepRef set, and adds why-row `{ref: '#34', rule: 'R3_KAIZEN_LINK', detail: 'ANALYZE phase, unlocked by #32'}`. Remaining Deep = 60 min → filled with `Deep Work — Project Task (generic)` as top-up.

### 2.6 Default Time-Blocking Logic

**Ceremony anchors** (from `ENGINE_DESIGN §1.2` DAILY_NON_OPTIONAL_SET + §1.7 orderDay):

| Anchor time | Block | Bucket | Default Min | Rationale |
|---|---|---|---|---|
| 09:00 | Daily Standup | COMMUNICATION | 15 | Same time each work day per `.txt` procedure; BAM ritual |
| 09:15 | AM High-value Communication Time-blocking | COMMUNICATION | 60 | Contiguous with standup; batch-processes morning comms before Deep |
| — | **Deep Block(s)** | PROJECT | 240 | Placed **before lunch** by `orderDay` (`ENGINE_DESIGN §1.7`); default 2×2h slice 10:15–12:15 or split around an external meeting |
| 13:00 | Post-lunch High-value Communication Time-blocking | COMMUNICATION | 30 | Post-lunch recovery slot; second comms batch |
| — | CI rotation (PDCA / L&D / 6S / Doc Review) | CI | 90–105 | Placed toward EOD (`ENGINE_DESIGN §1.7`) so analytical work is foregrounded earlier; CI is reflection/learning-heavy, better suited to lower-energy afternoon |
| 17:00 | End-of-Activity Reflection (meta-slot) | CI | 15 | Close-of-day reserve ensuring 60-sec reflections fit inside capacity (`ENGINE_DESIGN §1.2`) |

**Ordering rules** (from `ENGINE_DESIGN §1.7`): (a) Standup first; (b) AM Comm block contiguous with Standup; (c) Deep blocks placed before lunch; (d) External meetings (`externalMinutesToday`) locked to their stored times, Deep re-slices around them; (e) Post-lunch Comm anchored at 13:00; (f) CI rotation in afternoon; (g) Reflection meta-slot last. These are **heuristic, not invariant** — the user may drag within constraints (§2.7).

**Deep-before-lunch rule.** Protects focus energy (`PRODUCT_BLUEPRINT §6.1` pain point: CI time crushed, Deep time leaks). If external meeting lands in 10:00–12:00, `sliceDeep` splits (e.g., 09:15–10:00 Deep slice 1, then external 10:00–11:00, then 11:00–12:15 Deep slice 2) — see worked example `ENGINE_DESIGN §1.9`.

**CI-toward-EOD rationale.** CI activities (PDCA ticks, L&D reading, 6S Email, Document Review) are lower-cognitive-load + interruptible; afternoon placement respects energy curve and leaves EOD reflection slot uncontested.

### 2.7 Drag-and-Drop Rules

Per `UX_FLOWS §4.2` drop rule, edits on a CycleCard in Edit mode must preserve 4-2-2 invariants. Every drop triggers a client-side invariant check before commit; invalid drops snap back with a red outline + tooltip ("Can't drop here — would push PROJECT to 180 min (needs ≥ 240)").

**Eight edit primitives** (allowed / disallowed grid):

| # | Edit | Allowed? | Rule / constraint | Authority |
|---|---|---|---|---|
| 1 | **Reorder within bucket** | Always allowed | Changes only `plannedStartAt`; bucket totals unchanged | `UX_FLOWS §4.2` bullet 2 |
| 2 | **Rebucket configurable block** | Allowed iff destination bucket stays ≤ ceiling AND source bucket stays ≥ floor after the move | Drop rule body; tooltip names the bucket + number | `UX_FLOWS §4.2` bullet 3 |
| 3 | **Rebucket non-optional block** | **Disallowed** (bucket is frozen at schedule time; non-optional anchors are bucket-locked by catalog seed) | `ARCHITECTURE §2.5` invariant ("bucket is frozen at schedule time") + lock icon on drag handle `UX_FLOWS §4.2` bullet 1 |
| 4 | **Cross-day move** | Allowed only within the same Weekly Composition, configurable blocks only; re-validates both source-day and destination-day 4-2-2 invariants | `UX_FLOWS §4.2` + `ENGINE_DESIGN §1.3` weekly invariants |
| 5 | **Resize block (change plannedDurationMinutes)** | Allowed for configurable blocks within `[entry.minDuration ?? 15, min(entry.defaultDurationMinutes + 30, remainingBucketMin)]`; disallowed for non-optional anchors and phase ceremonies | `ENGINE_DESIGN §2.2` ceilings + `UX_FLOWS §4.3` validation messages |
| 6 | **Split block** (e.g., single 120-min Deep into 2×60) | Allowed only for Deep (PROJECT) blocks, subject to `User.deepSlicePreference` ≤ 4 slices/day | `ENGINE_DESIGN §1.6` sliceDeep semantics |
| 7 | **Swap** (drag one configurable onto another, exchanging positions) | Allowed if both are in the same bucket OR both are configurable and the rebucket rule (#2) holds for each | Composite of #1 + #2 rules |
| 8 | **Snap-to-15-min** | All drops snap `plannedStartAt` to the nearest 15-min tick; all resizes snap to 15-min increments (minimum granularity) | `UX_FLOWS §4.2` live BucketStrip preview uses 15-min ticks |

**Non-drop primitive.** Users **cannot draw a new block on a grid** (no free-form calendar builder); new blocks enter only via CatalogPicker, which respects role-gating, cadence guards, and project-type binding (`UX_FLOWS §4.2` "No free-form calendar builder" + `ENGINE_DESIGN §3.6`).

### 2.8 Conflict Resolution

When two candidate blocks contend for the same time slot or remaining bucket budget, CadencePlan applies a deterministic priority chain. Order is strict and top-wins.

**Priority chain** (highest-priority wins):

1. **Non-optional status.** Any `catalogEntry.isNonOptional === true` entry outranks any configurable entry. Never drop a non-optional to fit a configurable. Rule R1 (`ARCHITECTURE §4.5`, `PRODUCT_BLUEPRINT §3.4`).
2. **Strategic flag.** Within the non-optional tier, or within the configurable tier, a block whose `linkedKaizenId.actions[].strategic === true` outranks a non-strategic block. Per `ACCELERATOR_STANDARD §1.6` #5 weighted advance guard and `ENGINE_DESIGN §4.2.2`.
3. **Earlier-unlocked.** DAG-eligible entries rank by recency of the unlock event — the step unlocked by the most-recently-CLOSED prerequisite wins. Preserves momentum. Per `ENGINE_DESIGN §4.2` tiebreak #2.
4. **Sooner-due.** For AD_HOC Kaizens with `targetCloseDate`, blocks on projects with earlier due dates outrank later ones. Rule mirrors urgency term in §2.5 scoring.
5. **`catalogEntry.id` ASC (or `activityNumber` ASC where applicable).** Final stable tiebreak — guarantees deterministic output for identical inputs. Per `ENGINE_DESIGN §4.2` tiebreak #3.

**When a phase ceremony would be dropped by the chain** (rule R1 + phase-ceremony-cannot-be-skipped assertion, `ENGINE_DESIGN §1.2` STEP 4): composer short-circuits to INFEASIBLE (§2.9) with `suggestedActions[]` ordered `RAISE_CAPACITY` → `REDUCE_EXTERNAL` → `SKIP_CEREMONY_WITH_REASON`. Never silently truncates. Per `ARCHITECTURE §4.7`.

**PDCA orphan tick protection.** If a user has an open `PdcaExperiment` and tries to start a `#12` tick without `linkedPdcaExperimentId`, `ActivityService.start()` rejects — user must either bind to the open experiment or abandon it first. Per `ARCHITECTURE §2.13` invariant + `ENGINE_DESIGN §4.1`.

### 2.9 Rebalance Logic

**Trigger.** `validateComposition()` returns `{ok: false, failureCode: 'OVER_CAPACITY' | 'BUCKET_OVER_CEILING'}` after Step 9 of `composeDaily` (`ENGINE_DESIGN §1.2`). Or user manual edit pushes composition out of invariant via drag-drop or resize.

**Three-step ladder** (`ENGINE_DESIGN §1.2` STEP 9 relaxConfigurable + §1.8):

- **(a) Defer least-strategic configurable.** Walk `placed[]` in reverse priority order (lowest §2.5 score first) among configurable, non-phase-ceremony blocks. Remove the first candidate that — when removed — brings totals back inside ceilings + keeps floors. This is the single relaxation retry in STEP 9 of `composeDaily`.
- **(b) Move to tomorrow if cadence-compatible.** For configurable blocks whose cadence is `WEEKLY | MONTHLY | EVENT_DRIVEN | ON_SIGNAL`, emit a deferral instruction to attach the block to tomorrow's Daily composition by seeding `varianceQueue` with kind `RESCHEDULED` (`ARCHITECTURE §2.7`). Blocks with `cadence=DAILY` or `EVERY_48H` cannot defer — they stay on today's attempt. The deferral is an explicit rebalancing action, not a silent drop.
- **(c) Return `InfeasibleResult`.** If (a) and (b) cannot restore invariants — i.e., the non-optional set + phase ceremonies alone exceed capacity — the composer returns the structured `InfeasibleResult` per `ARCHITECTURE §4.7` shape with `{totalRequiredMinutes, capacityMinutes, shortfallMinutes, bucketShortfalls, suggestedActions[], explain[]}`. UI renders explain lines + ordered action buttons.

**Emitted event.** `ComposerInfeasible` fires for both MetricsService (chronic over-schedule KPI, §1.6 #7) and the UI CycleCard infeasibility state. Per `ENGINE_DESIGN §1.8`.

**Never silently truncate.** A composition cannot be saved with a failed invariant — no partial states. Enforced at `validateComposition` + at the `Composition` FSM `PROPOSED → ACCEPTED` guard (`ARCHITECTURE §3.1`).

### 2.10 Day / Week / Sprint / Month Generation

**Dispatch contract.** `ComposerService.composeCycle(cycleType, input)` dispatches to the type-specific composer:

```
composeCycle(cycleType, input) =
  switch (cycleType):
    DAILY   → composeDaily(input)       // ENGINE_DESIGN §1.2
    WEEKLY  → composeWeekly(input)      // ENGINE_DESIGN §1.3
    SPRINT  → composeSprint(input)      // reserved in ComposerService, Next
    MONTHLY → composeMonthly(input)     // reserved in ComposerService, Next
```

All four share the `ComposerInput` contract (`ENGINE_DESIGN §1.1`, mirrors `ARCHITECTURE §4.1`). Sprint/Monthly dispatch stubs exist today so downstream callers don't branch on cycle type.

**MVP vs Next per cycle.**

| Cycle | MVP | Next | Authority |
|---|---|---|---|
| **Cadence Day** (`DAILY`) | **Ships.** `composeDaily` 10-step algorithm; full 4-2-2 invariant; non-optional set; DAG payload selection; INFEASIBLE path; why-trail. | Phase-ceremony skip UX polish; AI "coaching" overlay on empty/goal-less blocks. | `PRODUCT_BLUEPRINT §5.1`, `ENGINE_DESIGN §1.2` |
| **Cadence Week** (`WEEKLY`) | **Ships.** `composeWeekly` calls `composeDaily` × 5 workdays + attaches weekly non-optionals to anchor days; weekly cross-day PROJECT ≥ 1200 min invariant; Fri PM Weekly Reflection anchor. | AI pre-fill of DMAIC worksheet for the Weekly Reflection. | `PRODUCT_BLUEPRINT §5.1`, `ENGINE_DESIGN §1.3` |
| **Cadence Sprint** (`SPRINT`) | **Deferred.** MVP user places Sprint Planning / Mid-Sprint / Review / Retro manually on the correct Weekly composition day (Mon Wk1, Fri Wk1, Fri Wk2). | **Ships.** `composeSprint` produces 2 Weekly compositions + sprint ceremonies + sprint-phase state machine + 6+1 quarterly awareness (Sprint 7 reset). | `PRODUCT_BLUEPRINT §4.1` Assumption + §5.2, `ARCHITECTURE §4.4` |
| **Cadence Month** (`MONTHLY`) | **Deferred.** MVP user hand-places Company Compliance Training, Team L&D review, Quarterly Planning at quarter boundaries. | **Ships.** `composeMonthly` produces 2 Sprint compositions + Monthly Check-in + quarter-boundary Quarterly Planning trigger. | `PRODUCT_BLUEPRINT §4.1` + §5.2, `ARCHITECTURE §4.4` |

**Parent linkage.** Daily Composition rows carry `parentCompositionId` pointing at the containing Weekly (in MVP) or Sprint/Monthly (in Next). Per `ARCHITECTURE §2.4`. The chain is Daily → Weekly → Sprint → Monthly but each level is optional (a standalone Daily need not have a Weekly parent).

**State cohesion.** Accepting a Weekly composition atomically transitions all 5 child Dailies from `PROPOSED` to `ACCEPTED` (`ARCHITECTURE §3.1`); editing one child Daily keeps the Weekly in `PROPOSED` until explicit accept. Enforced by the Composition FSM, not by UI.

**Deferred composers' interface reservation.** `composeSprint(input)` and `composeMonthly(input)` exist in `ComposerService` today with a stub that returns `{state: 'INFEASIBLE', reason: 'NOT_IMPLEMENTED_MVP'}`. This preserves the dispatch contract so the UI never branches on "is this cycle type supported?" Per `ARCHITECTURE §4.4`.

**Why Sprint/Monthly defer.** Daily + Weekly already cover >80% of a user's scheduled time (`PRODUCT_BLUEPRINT §4.1` Assumption). Sprint composer correctly requires modeling sprint phase, two-week rollovers, and the 6+1 quarterly pattern — none of which add behavior a user can't get by hand-placing Sprint Planning on the correct Mon Wk1 via Weekly composer edit in MVP.

---

## Appendix — Upstream References

- `PRODUCT_BLUEPRINT.md` v0.3 — product scope, JTBDs, metrics, non-optional set (§3.4)
- `ARCHITECTURE.md` v0.6 — entities (§2), FSMs (§3), scheduling engine (§4), capacity (§5), INFEASIBLE (§4.7)
- `ENGINE_DESIGN.md` v0.4.1 — composer algorithms (§1.2 10-step, §1.3 weekly), payload selection (§1.6, §4.2), INFEASIBLE shape (§1.8), DMAIC DAG (§4.2.1)
- `CATALOG_GAPS.md` v0.3.1 — bucket mapping (§H), 30-Day Accelerator entries (§I), DMAIC DAG edges (§J), Kaizen 90 bindings (§K)
- `UX_FLOWS.md` v0.2 — Accept/Edit/Reject (§4.1), drag-to-rebucket drop rule (§4.2), validation messages (§4.3)
- Operating standards: `DMAIC_STANDARD.md` v1.0, `KAIZEN_EVENT_STANDARD.md` v1.0, `ACCELERATOR_STANDARD.md` v1.0, `ADHOC_PDCA_STANDARD.md` v1.0, `PROJECT_TYPE_30D_KAIZEN.md` v1.0
