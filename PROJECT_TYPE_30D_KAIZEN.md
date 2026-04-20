# BAM-X Kaizen OS — Project Type: 30-Day Kaizen Accelerator

Owner: Master Black Belt / Product Architect / Systems Engineer Agent
Status: Draft v0.1 — grounded in `PRODUCT_BLUEPRINT.md` v0.2, `ARCHITECTURE.md` v0.3.1, `ENGINE_DESIGN.md` v0.2, `CATALOG_GAPS.md` v0.1, `UX_FLOWS.md` v0.2.1, `DELIVERY_PLAN.md` v0.1.
Scope: Canonical specification for the `KAIZEN_ACCELERATOR_30D` project type. This document is the authoritative source of truth for its domain shape, catalog seed, phase FSM, composer behavior, ROI model, UX surfaces, and delivery impact. Existing docs are not edited here — upstream patches are itemized in §12.

> **Design stance.** The 30-Day Accelerator is not a new application or a new entity class. It is a **discriminated instance of `Kaizen`** (the existing entity from `ARCHITECTURE.md §2.9`) with a locked 5-phase timeline, 31 new catalog entries in its scope, and two ROI fields. Everything else — scheduling, reflection, variance, remeasurement, adherence — flows through the existing engine. This preserves MVP's "one active Kaizen per user" cap and ships on the same backbone the DMAIC and Kaizen-event modes already use.

---

## 1. Overview & Core Principle

### 1.1 The four non-negotiables (engine invariants)

The 30-Day Accelerator enforces four rules that together define the method. Each is a locked engine invariant; each names the service that owns it so violations cannot be bypassed by any UI path.

| # | Principle | Engine invariant | Owner service | Failure mode |
|---|---|---|---|---|
| 1 | **No improvement without baseline** | A Kaizen with `projectType='KAIZEN_ACCELERATOR_30D'` cannot transition `PHASE_1 → PHASE_2` unless catalog entry `30d_1_6_validate_baseline` has a `CLOSED` `ScheduledActivity` inside this Kaizen AND `BaselineMetric.locked === true` on `Kaizen.baselineMetricId`. | `KaizenService.advancePhase()` + `InvariantEngine.canAdvancePhase()` | Throws `BASELINE_NOT_APPROVED` |
| 2 | **No solution without root cause** | `PHASE_2 → PHASE_3` blocked unless catalog entry `30d_2_3_root_cause_analysis` has a `CLOSED` `ScheduledActivity` in this Kaizen with `outputArtifactRef.schema='TEXT'` present AND `30d_2_4_design_future_state` closed. | `KaizenService.advancePhase()` | Throws `ROOT_CAUSE_MISSING` |
| 3 | **No implementation without ownership** | Every action in `Kaizen.actions[]` that was created in Phase 3 must carry a non-null `ownerRef` AND `dueDate` before `PHASE_3 → PHASE_4`. Additionally, `30d_3_1_assign_ownership` must be closed. | `KaizenService.advancePhase()` + action-schema validator | Throws `UNOWNED_ACTION` |
| 4 | **No success without validated ROI** | `PHASE_4 → CLOSED` blocked unless `Kaizen.remeasurementId !== null` (existing HARD RULE from `ARCHITECTURE.md §3.3`) AND `Kaizen.annualBenefitsDollars !== null` AND `Kaizen.implementationCostDollars !== null` AND `Kaizen.roi` computed AND `30d_4_4_validate_results`, `30d_4_5_control_plan`, and `30d_4_6_final_report` all closed. | `KaizenService.closeAccelerator()` | Throws `ROI_NOT_VALIDATED` |

### 1.2 Success criteria as engine guardrails

The user's four success criteria ("scoped in 1 day, baseline in 1 week, implementation in 2 weeks, ROI by day 30") are enforced as soft warnings in the engine (they emit telemetry; they do not block). See §9 for the guard definitions.

---

## 2. Project Type in the BAM-X Model

### 2.1 New `ProjectType` enum on `Kaizen`

Today `ARCHITECTURE.md §2.9` models a Kaizen with an implicit `mode` (DMAIC via catalog #20–#41, or KAIZEN_EVENT via #42–#50). That implicit mode is formalized as a first-class discriminator:

```ts
// NEW enum (patch ARCHITECTURE.md §2.9)
type ProjectType =
  | 'DMAIC'                    // payload walks the DMAIC #20–#41 DAG (existing behavior)
  | 'KAIZEN_EVENT'             // payload walks the Kaizen-event #42–#50 sequence (existing behavior)
  | 'KAIZEN_ACCELERATOR_30D'   // NEW — 5-phase 30-day consulting engagement format
  | 'AD_HOC'                   // NEW — user-driven Kaizen from a friction cluster with no locked timeline (today's default; implicit before this patch)
```

**Reframe of existing modes.** DMAIC and KAIZEN_EVENT become explicit `projectType` values, not hidden behavior. `AD_HOC` captures the existing "user promotes from Weekly Reflection, no timeline structure" path, which is how MVP Kaizens currently behave.

### 2.2 New fields on `Kaizen`

| Field | Type | Notes |
|---|---|---|
| `projectType` | `ProjectType` | NEW. Defaults to `AD_HOC`. Set at promotion time. Immutable once set (changing project type mid-flight is a new abandonment + new Kaizen). |
| `phase` | `'PHASE_0' \| 'PHASE_1' \| 'PHASE_2' \| 'PHASE_3' \| 'PHASE_4' \| null` | NEW. Null for `AD_HOC` and `DMAIC` (DMAIC derives phase from DAG per `ENGINE_DESIGN §4.2`). Required non-null for `KAIZEN_ACCELERATOR_30D`. Advanced by `KaizenService.advancePhase()`. |
| `phaseDefinitions` | `ProjectPhaseDefinition[] \| null` | NEW. Frozen snapshot of phase structure at Kaizen creation time. For `KAIZEN_ACCELERATOR_30D`, seeded with the 5 phases from §3. Immutable. Shape: `{ id, name, daysFromStart: [startDay, endDay], catalogEntryIds: string[], advancementGuard: string }`. |
| `implementationCostDollars` | `number \| null` | NEW. Captured by catalog entry `30d_4_3_calculate_roi` output artifact. Null until captured. |
| `annualBenefitsDollars` | `number \| null` | NEW. Captured by same entry. Null until captured. |
| `roi` | `number \| null` | NEW. **Computed, not stored** — on read, `roi = (annualBenefitsDollars − implementationCostDollars) / implementationCostDollars` when both inputs are non-null; else `null`. Pure function in `RoiEngine`. |
| `startDate` | `date (ISO) \| null` | NEW. Kaizen start date (Day 0). For `KAIZEN_ACCELERATOR_30D`, drives phase-date calculations and the "30 days to ROI" banner. |

### 2.3 New fields on `CatalogEntry`

Two new fields on the primitive catalog entity, needed for project-type scoping and phase binding of the 31 seed entries in §3:

| Field | Type | Notes |
|---|---|---|
| `projectTypeBinding` | `ProjectType \| null` | NEW. If non-null, this entry is only eligible as payload when the user's active Kaizen has a matching `projectType`. Null means available to all project types (e.g., DMAIC #20–#41 entries keep `projectTypeBinding='DMAIC'`; Kaizen-event #42–#50 get `'KAIZEN_EVENT'`; the 30-Day Accelerator seed gets `'KAIZEN_ACCELERATOR_30D'`; generic entries like Daily Standup stay `null`). |
| `phaseBinding` | `string \| null` | NEW. For phased project types, which phase id this entry belongs to (e.g., `'PHASE_1'`). Null for entries not bound to a phase. Used by the composer to filter Deep-block payload to the current phase. |

### 2.4 Why no new top-level entity

The 30-Day Accelerator could have been its own entity class (`Accelerator30D`). It is not, for three reasons:

1. **Everything on a 30-Day Accelerator is already a Kaizen concern.** It has a baseline, a goal, actions, and a remeasurement that must beat baseline — the exact `Kaizen` FSM from `ARCHITECTURE.md §3.3`.
2. **MVP caps one active Kaizen per user** (blueprint §4.1). A separate entity would either duplicate the cap or break it. As a discriminator on Kaizen, the cap is preserved verbatim.
3. **DMAIC and Kaizen Event are precedent.** `ENGINE_DESIGN §4.2` and §4.3 already treat a "project type" as a discriminator on Kaizen plus a distinct catalog scope. The Accelerator is the third member of this family.

### 2.5 Relationship to existing entities

```
User 1—1 Kaizen (MVP cap, projectType='KAIZEN_ACCELERATOR_30D')
                │
                ├─ 1—1 BaselineMetric          (locked end of PHASE_1)
                ├─ 0..1 Remeasurement          (captured in PHASE_4)
                ├─ 1—* FrictionSignal          (sourceFrictionSignalIds; optional for accelerator — can be created cold from leadership input)
                ├─ 1—31 ScheduledActivity      (one per accelerator task, some generic blocks, spread across 30 days)
                └─ 1—5  phaseDefinitions[]     (frozen at create; not an entity — a stored array on Kaizen)
```

No new entities. Every artifact maps to an existing one.

---

## 3. Full Catalog Entry Seed

**31 new entries**, one per user task (0.1–0.6, 1.1–1.6, 2.1–2.7, 3.1–3.6, 4.1–4.6), all with:
- `projectTypeBinding = 'KAIZEN_ACCELERATOR_30D'`
- `focusArea = 'KAIZEN_ACCELERATOR_30D'` (NEW focusArea enum value — see patch in §12)
- `appliesToRoles = ['CHAMPION', 'FACILITATOR', 'LEADER']` by default; individual entries may narrow
- `isNonOptional = true` when the entry is a phase gate (every "output" task the user named); the non-gated substeps are `isNonOptional = false` but are still required for phase advancement via `phaseDefinitions[].catalogEntryIds`.
- `version = 1`, `sourceRef = "PROJECT_TYPE_30D_KAIZEN.md §3"`

Bucket mapping follows `CATALOG_GAPS.md §H` rules literally: stakeholder conversations / approvals → `COMMUNICATION`; analytical / authoring / execution work → `PROJECT`; tracking / adjustment / reflection → `CI`.

### 3.1 Phase 0 — Alignment + Scoping (Pre-work)

| Id | Name | Bucket | Default min | Cadence | Trigger | Inputs | Output artifact (name, schema) | Participants | Procedure | dependsOn |
|---|---|---|---|---|---|---|---|---|---|---|
| `30d_0_1_identify_candidate_process` | Identify Candidate Process | COMMUNICATION | 60 | EVENT_DRIVEN | Engagement kickoff | Leadership input, pain-point list, KPI gap report | `{ name: "Candidate process list", schema: "TEXT", required: true }` | Facilitator + Leader(s) | a. Gather leadership pain points. b. Pull top KPI gaps. c. Draft candidate process list (3–7 candidates). d. Short-list with Leader. | [] |
| `30d_0_2_define_project_scope` | Define Project Scope | PROJECT | 90 | EVENT_DRIVEN | Candidate selected | `30d_0_1_identify_candidate_process` output | `{ name: "Scoped process definition", schema: "DOCUMENT", required: true }` | Facilitator + Process Owner | a. Define start boundary. b. Define end boundary. c. List systems involved. d. Identify roles / personas touching the process. e. Document in scope template. | [`30d_0_1_identify_candidate_process`] |
| `30d_0_3_define_problem_statement` | Define Problem Statement | PROJECT | 60 | EVENT_DRIVEN | Scope defined | `30d_0_2_define_project_scope` output, incident / ticket data | `{ name: "Approved problem statement", schema: "TEXT", required: true }` | Facilitator + Process Owner + Sponsor | a. State current state in one paragraph. b. Quantify impact: time, cost, defects. c. Capture who is hurt and how often. d. Review with Sponsor. | [`30d_0_2_define_project_scope`] |
| `30d_0_4_define_success_metrics` | Define Success Metrics | PROJECT | 60 | EVENT_DRIVEN | Problem statement approved | Problem statement, process KPIs | `{ name: "KPI baseline targets", schema: "TWO_LIST", required: true }` (list 1 = metric name, list 2 = target) | Facilitator + Process Owner | a. Pick 1 primary metric (cycle time, throughput, defect rate, or cost per transaction). b. Pick 1–2 secondary metrics. c. Propose target values (Baseline X → Target Y). d. Align with Sponsor. | [`30d_0_3_define_problem_statement`] |
| `30d_0_5_identify_stakeholders` | Identify Stakeholders + Team | COMMUNICATION | 60 | EVENT_DRIVEN | Metrics defined | Scope definition, org chart | `{ name: "Project team roster", schema: "DOCUMENT", required: true }` | Facilitator + Process Owner | a. Identify Process Owner. b. Identify 2–5 SMEs. c. Confirm Facilitator. d. Confirm Sponsor. e. Capture roster with roles and contact. | [`30d_0_4_define_success_metrics`] |
| `30d_0_6_approve_charter` | Approve Project Charter | COMMUNICATION | 60 | EVENT_DRIVEN | Roster complete | Scope, problem, metrics, roster, proposed 30-day timeline | `{ name: "Signed project charter", schema: "DOCUMENT", required: true }` | Sponsor + Process Owner + Facilitator | a. Consolidate Charter document. b. Walk Sponsor through scope / problem / metrics / timeline. c. Obtain Sponsor signature. d. Publish to team. | [`30d_0_5_identify_stakeholders`] |

**Phase 0 gate** (`PHASE_0 → PHASE_1`): `30d_0_6_approve_charter` CLOSED with a non-null DOCUMENT artifact.

### 3.2 Phase 1 — Baseline (Days 1–7)

| Id | Name | Bucket | Default min | Cadence | Trigger | Inputs | Output artifact | Participants | Procedure | dependsOn |
|---|---|---|---|---|---|---|---|---|---|---|
| `30d_1_1_collect_workflow_data` | Collect Workflow Data | PROJECT | 240 | EVENT_DRIVEN | Charter signed | Systems access list, Ledgerium AI recording kit (optional, Next-phase) | `{ name: "Raw workflow data", schema: "DOCUMENT", required: true }` (link to dataset or recording) | Facilitator + SMEs | a. Choose capture method: Option A (existing system logs / reports) or Option B (Ledgerium AI workflow recording — *Next-phase integration*). b. For Option A: pull 30 recent process instances. c. For Option B: record 3–5 end-to-end runs capturing steps, time, systems. d. Store raw data with link. | [`30d_0_6_approve_charter`] |
| `30d_1_2_build_current_state_map` | Build Current-State Process Map | PROJECT | 180 | EVENT_DRIVEN | Data collected | `30d_1_1_collect_workflow_data` output | `{ name: "Current-state process map", schema: "DOCUMENT", required: true }` (visual) | Facilitator + SMEs | a. Identify each step from the data. b. Sequence activities in order. c. Note handoffs and system transitions. d. Render visual map (BPMN, swimlane, or flowchart). | [`30d_1_1_collect_workflow_data`] |
| `30d_1_3_define_activity_metrics` | Define Activity-Level Metrics | PROJECT | 120 | EVENT_DRIVEN | Map built | Process map, raw data | `{ name: "Activity breakdown table", schema: "DOCUMENT", required: true }` | Facilitator | a. For each activity on the map, compute cycle time, wait time, touch time. b. Note unit of measure. c. Note n (sample size). d. Build the activity breakdown table. | [`30d_1_2_build_current_state_map`] |
| `30d_1_4_identify_waste` | Identify Waste (TIMWOODS) | PROJECT | 120 | EVENT_DRIVEN | Metrics defined | Activity breakdown, process map | `{ name: "Waste analysis", schema: "TWO_LIST", required: true }` (list 1 = waste category, list 2 = observation) | Facilitator + SMEs | a. For each TIMWOODS category — Transport, Inventory, Motion, Waiting, Overproduction, Overprocessing, Defects, Skills underutilization — scan the process. b. Record observations with step reference. c. Rank by frequency / magnitude. | [`30d_1_3_define_activity_metrics`] |
| `30d_1_5_generate_baseline_sops` | Generate Current-State SOPs | PROJECT | 180 | EVENT_DRIVEN | Map + waste done | Process map, activity metrics, SME interviews | `{ name: "Baseline SOPs", schema: "DOCUMENT", required: true }` (versioned document set) | Facilitator + SMEs | a. Convert each activity into a step-by-step SOP. b. Note role responsibilities. c. Note system of record per step. d. Version 1.0 ("as-is"). e. Store in SOP repository. | [`30d_1_2_build_current_state_map`] |
| `30d_1_6_validate_baseline` | Validate Baseline with Stakeholders | COMMUNICATION | 60 | EVENT_DRIVEN | Metrics + SOPs drafted | Activity metrics, SOPs, process map | `{ name: "Approved baseline", schema: "DOCUMENT", required: true }` (sign-off memo) | Sponsor + Process Owner + Facilitator | a. Walk Sponsor through baseline metric values. b. Review current-state map and SOPs with Process Owner + SMEs. c. Address corrections. d. Capture sign-off. e. Lock `BaselineMetric` on the `Kaizen` (triggers `BaselineMetric.locked=true`). | [`30d_1_3_define_activity_metrics`, `30d_1_4_identify_waste`, `30d_1_5_generate_baseline_sops`] |

**Phase 1 gate** (`PHASE_1 → PHASE_2`): `30d_1_6_validate_baseline` CLOSED AND `Kaizen.baselineMetricId` set AND `BaselineMetric.locked === true`.

### 3.3 Phase 2 — Kaizen Event (Days 8–12)

Phase 2 runs as a **3–5 day virtual Kaizen intensive** (or optional on-site); the composer treats its days as a "Kaizen Event week" where PROJECT bucket is entirely filled with Phase 2 tasks. See §5 for the composer behavior.

| Id | Name | Bucket | Default min | Cadence | Trigger | Inputs | Output artifact | Participants | Procedure | dependsOn |
|---|---|---|---|---|---|---|---|---|---|---|
| `30d_2_1_prepare_event` | Prepare Kaizen Event | COMMUNICATION | 60 | EVENT_DRIVEN | Baseline approved | Approved baseline, team roster | `{ name: "Event agenda", schema: "DOCUMENT", required: true }` | Facilitator | a. Pick event window (3–5 consecutive days virtual; or on-site). b. Block time on team calendars. c. Share baseline packet in advance. d. Draft session-by-session agenda. | [`30d_1_6_validate_baseline`] |
| `30d_2_2_review_current_state` | Review Current State | COMMUNICATION | 120 | EVENT_DRIVEN | Event kickoff | Baseline packet, process map, SOPs | `{ name: "Shared understanding log", schema: "TEXT", required: true }` | Facilitator + Team | a. Walk the team through the current-state map. b. Align on pain points. c. Capture questions, clarifications, disagreements. d. Log a shared understanding record. | [`30d_2_1_prepare_event`] |
| `30d_2_3_root_cause_analysis` | Perform Root Cause Analysis | PROJECT | 180 | EVENT_DRIVEN | Current state reviewed | Waste analysis, activity metrics, team observations | `{ name: "Root cause list", schema: "TWO_LIST", required: true }` (list 1 = symptom, list 2 = root cause) | Facilitator + Team | a. Apply 5 Whys on top waste observations. b. Build Fishbone (6M categories) for top issue. c. Cluster causes; prioritize. d. Document ranked root cause list. | [`30d_2_2_review_current_state`] |
| `30d_2_4_design_future_state` | Design Future-State Workflow | PROJECT | 180 | EVENT_DRIVEN | Root causes identified | Root cause list, waste analysis, current-state map | `{ name: "Future-state process map", schema: "DOCUMENT", required: true }` | Facilitator + Team | a. Remove waste steps. b. Reduce handoffs. c. Simplify flow. d. Render new map. e. Compare side-by-side with current-state. | [`30d_2_3_root_cause_analysis`] |
| `30d_2_5_define_improvements` | Define Improvements | PROJECT | 120 | EVENT_DRIVEN | Future state designed | Future-state map, root cause list | `{ name: "Improvement list", schema: "TWO_LIST", required: true }` (list 1 = improvement name, list 2 = category [quick win / medium / strategic]) | Facilitator + Team | a. Enumerate every change implied by the future state. b. Categorize: quick win (< 1 week), medium effort (1–2 weeks), strategic (> 2 weeks). c. Flag any that require Sponsor decision. | [`30d_2_4_design_future_state`] |
| `30d_2_6_create_backlog` | Create Implementation Backlog | PROJECT | 120 | EVENT_DRIVEN | Improvements defined | Improvement list | `{ name: "Prioritized backlog", schema: "DOCUMENT", required: true }` | Facilitator + Process Owner | a. Group improvements into epics. b. Break epics into stories. c. Break stories into tasks. d. Score priority (impact × confidence ÷ effort). e. Publish prioritized backlog. | [`30d_2_5_define_improvements`] |
| `30d_2_7_define_future_sops` | Define Future-State SOPs | PROJECT | 180 | EVENT_DRIVEN | Backlog created | Future-state map, improvement list, baseline SOPs | `{ name: "Future SOPs", schema: "DOCUMENT", required: true }` (draft; finalized in Phase 3) | Facilitator + SMEs | a. Update each SOP to match future state. b. Assign new role responsibilities. c. Mark as "Draft v2.0 — to-be". d. Store alongside baseline SOPs for diffing. | [`30d_2_4_design_future_state`] |

**Phase 2 gate** (`PHASE_2 → PHASE_3`): `30d_2_6_create_backlog` CLOSED AND `30d_2_7_define_future_sops` CLOSED.

### 3.4 Phase 3 — Implementation (Days 13–23)

| Id | Name | Bucket | Default min | Cadence | Trigger | Inputs | Output artifact | Participants | Procedure | dependsOn |
|---|---|---|---|---|---|---|---|---|---|---|
| `30d_3_1_assign_ownership` | Assign Ownership | COMMUNICATION | 60 | EVENT_DRIVEN | Backlog prioritized | Prioritized backlog, roster | `{ name: "Assigned backlog", schema: "DOCUMENT", required: true }` (every item has owner + due date) | Facilitator + Process Owner | a. For each backlog item: assign an owner. b. Set a due date. c. Confirm owner acceptance. d. Write back to `Kaizen.actions[]` with `{name, ownerRef, dueDate, doneAt: null}`. | [`30d_2_6_create_backlog`] |
| `30d_3_2_schedule_work_blocks` | Schedule Work Blocks | COMMUNICATION | 60 | EVENT_DRIVEN | Ownership assigned | Assigned backlog, owner calendars | `{ name: "Execution schedule", schema: "DOCUMENT", required: true }` | Facilitator | a. For each owner, reserve Deep (implementation), Communication (decisions), and CI (adjustments) blocks across Days 13–23 — these fold into the user's existing Daily cycles via the composer. b. Confirm coverage. | [`30d_3_1_assign_ownership`] |
| `30d_3_3_execute_improvements` | Execute Improvements | PROJECT | 240 | EVENT_DRIVEN | Blocks scheduled | Assigned backlog, future SOPs, systems access | `{ name: "Implemented changes log", schema: "DOCUMENT", required: true }` (running log) | Owner(s) | a. Update systems per backlog item. b. Change workflows. c. Train users on SOP diffs. d. Log each change with before/after. (This entry is scheduled multiple times across Days 13–23 — one per Deep block.) | [`30d_3_2_schedule_work_blocks`] |
| `30d_3_4_track_progress_daily` | Track Progress Daily | CI | 15 | DAILY | Every day in Phase 3 | Assigned backlog, execution schedule | `{ name: "Execution dashboard snapshot", schema: "NUMERIC", required: true }` (completion rate %) | Facilitator | a. Check completion rate. b. Note blockers. c. Update dashboard. (Fires once per day in Phase 3; fills CI slot.) | [`30d_3_2_schedule_work_blocks`] |
| `30d_3_5_resolve_blockers` | Resolve Blockers | COMMUNICATION | 60 | ON_SIGNAL | Blocker flagged by `30d_3_4` | Blocker list | `{ name: "Cleared constraints log", schema: "TEXT", required: true }` | Facilitator + Sponsor (when needed) | a. Triage blocker: decision, access, scope, capacity. b. Escalate to Sponsor if decision required. c. Document resolution. d. Close blocker. | [`30d_3_4_track_progress_daily`] |
| `30d_3_6_update_sops_realtime` | Update SOPs in Real-Time | CI | 30 | EVENT_DRIVEN | Change implemented | Future SOPs (draft), executed changes | `{ name: "Final SOPs", schema: "DOCUMENT", required: true }` (versioned) | SMEs | a. Reflect actual changes in SOPs. b. Bump SOP version. c. Commit to repository. (Fires as changes land; rolls up by end of Phase 3.) | [`30d_3_3_execute_improvements`] |

**Phase 3 gate** (`PHASE_3 → PHASE_4`): **80% completion OR all non-optional closed.** Specifically: `30d_3_1_assign_ownership` CLOSED AND `30d_3_6_update_sops_realtime` CLOSED AND `Kaizen.actions.filter(a => a.doneAt !== null).length / Kaizen.actions.length >= 0.80`.

### 3.5 Phase 4 — Validation + ROI (Days 24–30)

| Id | Name | Bucket | Default min | Cadence | Trigger | Inputs | Output artifact | Participants | Procedure | dependsOn |
|---|---|---|---|---|---|---|---|---|---|---|
| `30d_4_1_rebaseline` | Rebaseline Workflow | PROJECT | 180 | EVENT_DRIVEN | Phase 4 entered | Executed changes log, systems access, Ledgerium AI (if used initially) | `{ name: "Post-implementation dataset", schema: "DOCUMENT", required: true }` | Facilitator + SMEs | a. Repeat the method used in `30d_1_1_collect_workflow_data` — existing-system data or Ledgerium AI re-recording. b. Capture 30 instances or 3–5 runs. c. Store linked dataset. | [] |
| `30d_4_2_compare_before_after` | Compare Before vs After | PROJECT | 90 | EVENT_DRIVEN | Rebaseline done | Baseline dataset, post-implementation dataset | `{ name: "Performance delta", schema: "TWO_LIST", required: true }` (list 1 = metric, list 2 = baseline → post value + %) | Facilitator | a. Compute cycle time reduction. b. Compute defect reduction. c. Compute throughput increase. d. Note secondary metric deltas. | [`30d_4_1_rebaseline`] |
| `30d_4_3_calculate_roi` | Calculate Financial Impact | PROJECT | 120 | EVENT_DRIVEN | Deltas computed | Performance delta, unit cost data from Finance, implementation cost log | `{ name: "Financial impact", schema: "NUMERIC", required: true }` — **writes `Kaizen.implementationCostDollars`, `Kaizen.annualBenefitsDollars`; triggers `Kaizen.roi` computation** | Facilitator + Finance partner | a. Sum implementation cost (people, tools, systems). b. Quantify annual benefits (labor savings, defect reduction $, throughput $). c. Write both values to Kaizen. d. Engine computes `roi = (annualBenefits − implementationCost) / implementationCost`. e. Finance signs off. (Reuses `#39 DMAIC Financial Benefit Translator` pattern — see §6.) | [`30d_4_2_compare_before_after`] |
| `30d_4_4_validate_results` | Validate Results with Stakeholders | COMMUNICATION | 60 | EVENT_DRIVEN | ROI calculated | Performance delta, ROI, implementation log | `{ name: "Approved results memo", schema: "DOCUMENT", required: true }` | Sponsor + Process Owner + Facilitator | a. Review deltas with Sponsor. b. Confirm accuracy with Process Owner. c. Address concerns. d. Capture sign-off. | [`30d_4_3_calculate_roi`] |
| `30d_4_5_control_plan` | Create Control Plan | PROJECT | 120 | EVENT_DRIVEN | Results validated | Final SOPs, ROI, Process Owner | `{ name: "Control plan", schema: "DOCUMENT", required: true }` | Facilitator + Process Owner | a. Define ongoing monitoring (metric, frequency, threshold). b. Assign sustainment ownership (typically Process Owner). c. Define response if regression. d. Schedule 30/60/90 check-ins. e. Process Owner signs. | [`30d_4_4_validate_results`] |
| `30d_4_6_final_report` | Final Report | PROJECT | 180 | EVENT_DRIVEN | Control plan signed | Baseline, future state, SOPs, ROI, control plan | `{ name: "Executive summary", schema: "DOCUMENT", required: true }` — populates `Kaizen.resultsNarrativeRef` | Facilitator | a. Draft exec summary: problem → solution → ROI. b. Attach baseline vs future state. c. Attach SOPs. d. Attach ROI and control plan. e. Present to Sponsor; file with Kaizen record. | [`30d_4_5_control_plan`] |

**Phase 4 gate** (`PHASE_4 → CLOSED`): `30d_4_1_rebaseline` CLOSED AND `Kaizen.remeasurementId !== null` (existing HARD RULE — the rebaseline output becomes the `Remeasurement` row) AND `Kaizen.roi !== null` (i.e. both ROI inputs captured) AND `30d_4_5_control_plan` CLOSED AND `30d_4_6_final_report` CLOSED.

### 3.6 Non-optional flags

Non-optional (`isNonOptional = true`) for the 30-Day Accelerator: every entry that represents a **phase gate output** — 0.6, 1.6, 2.6, 2.7, 3.1, 3.6, 4.1, 4.3, 4.4, 4.5, 4.6. The other 20 are `isNonOptional = false` but still required for their phase's advancement guard. `CatalogService.delete()` continues to reject any non-optional.

---

## 4. Phase FSM

### 4.1 States & transitions (only applies when `Kaizen.projectType === 'KAIZEN_ACCELERATOR_30D'`)

```
          (Kaizen.state=DRAFT, baseline-locked, activated as ACCELERATOR_30D)
                              │
                              v
                          +--------+
                          | PHASE_0 |  ← null phase on create, immediately advances to PHASE_0
                          +---+-----+
                              |
            30d_0_6 CLOSED   |
                              v
                          +--------+
                          | PHASE_1 |
                          +---+-----+
                              |
       30d_1_6 CLOSED + BaselineMetric.locked=true
                              v
                          +--------+
                          | PHASE_2 |
                          +---+-----+
                              |
        30d_2_6 CLOSED AND 30d_2_7 CLOSED
                              v
                          +--------+
                          | PHASE_3 |
                          +---+-----+
                              |
      30d_3_1 CLOSED AND 30d_3_6 CLOSED AND
      actions done ratio ≥ 0.80
                              v
                          +--------+
                          | PHASE_4 |
                          +---+-----+
                              |
  30d_4_1 CLOSED AND Kaizen.remeasurementId!=null AND
  Kaizen.roi!=null AND 30d_4_5 CLOSED AND 30d_4_6 CLOSED
                              v
                          +---------+
                          | CLOSED  |  ← uses existing Kaizen FSM CLOSED state with closeKind
                          +---------+

  ABANDONED path (any phase): Kaizen.state → DRAFT with abandoned=true, never CLOSED
  (per ARCHITECTURE.md §3.3 — same as existing Kaizen abandonment path).
```

### 4.2 Transition table

| FROM | TO | Trigger | Guard (`canAdvancePhase()`) | Side effects | Emits |
|---|---|---|---|---|---|
| (create) | PHASE_0 | `KaizenService.promote()` with `projectType='KAIZEN_ACCELERATOR_30D'` | Always | Freezes `phaseDefinitions`, sets `startDate`, creates `ScheduledActivity` row for `30d_0_1` in the next Daily composition | `KaizenPromoted`, `ProjectPhaseAdvanced{from:null, to:'PHASE_0'}` |
| PHASE_0 | PHASE_1 | User taps "Advance to Phase 1" on KaizenCard | `30d_0_6_approve_charter` CLOSED AND its `outputArtifactRef.schema === 'DOCUMENT'` with non-null value | Composer eligible payload set flips to Phase 1 entries | `ProjectPhaseAdvanced{from:'PHASE_0', to:'PHASE_1'}` |
| PHASE_1 | PHASE_2 | User taps "Advance to Phase 2" | `30d_1_6_validate_baseline` CLOSED AND `Kaizen.baselineMetricId !== null` AND `BaselineMetric.locked === true` | Kaizen transitions `DRAFT → ACTIVE` (existing Kaizen FSM — baseline locked + goal set + ≥1 action implied by `30d_0_4` target + `30d_3_1` assignment queued). Composer enters "Kaizen Event week" mode for Phase 2 days. | `ProjectPhaseAdvanced`, `KaizenBaselineLocked` |
| PHASE_2 | PHASE_3 | User taps "Advance to Phase 3" | `30d_2_6_create_backlog` CLOSED AND `30d_2_7_define_future_sops` CLOSED | `Kaizen.actions[]` populated from backlog entries (each backlog line item becomes an action) | `ProjectPhaseAdvanced` |
| PHASE_3 | PHASE_4 | User taps "Advance to Phase 4" OR system auto-prompts at Day 24 | `30d_3_1_assign_ownership` CLOSED AND `30d_3_6_update_sops_realtime` CLOSED AND `Kaizen.actions.filter(a=>a.doneAt!==null).length / Kaizen.actions.length >= 0.80` | Kaizen transitions `ACTIVE → IN_REMEASUREMENT` (existing Kaizen FSM) — Phase 4 is the remeasurement window | `ProjectPhaseAdvanced`, (existing `KaizenService.startRemeasurement()` side effects) |
| PHASE_4 | CLOSED | User taps "Close Kaizen" on KaizenCard | `30d_4_1_rebaseline` CLOSED AND `Kaizen.remeasurementId !== null` AND `remeasurement.metricDefinitionId === baseline.metricDefinitionId` AND `Kaizen.roi !== null` AND `30d_4_5_control_plan` CLOSED AND `30d_4_6_final_report` CLOSED | Existing Kaizen close: `closeKind ∈ {SUCCESS, PARTIAL, FAILED_HONEST}` computed from `remeasurement.beatsBaseline` + `roi` sign | `ProjectPhaseAdvanced{to:'CLOSED'}`, `KaizenClosed` |
| ANY | abandoned (DRAFT) | User taps "Abandon" | — | Sets `abandoned=true`, never `CLOSED` (per `ARCHITECTURE.md §3.3`) | `KaizenAbandoned` (already exists implicitly; formalize in §12 patch) |

### 4.3 Guard implementation

```js
// NEW — in KaizenService
const canAdvancePhase = (kaizenId, toPhase) => {
  const k = repo.get('kaizens', kaizenId);
  if (k.projectType !== 'KAIZEN_ACCELERATOR_30D') throw new Error('NOT_ACCELERATOR');
  const defs = k.phaseDefinitions;                        // frozen at create
  const closedIds = scheduledActivitiesForKaizen(kaizenId, 'CLOSED').map(s => s.catalogEntryId);

  switch (toPhase) {
    case 'PHASE_1': return closedIds.includes('30d_0_6_approve_charter');
    case 'PHASE_2':
      return closedIds.includes('30d_1_6_validate_baseline')
        && repo.get('baselines', k.baselineMetricId)?.locked === true;
    case 'PHASE_3':
      return closedIds.includes('30d_2_6_create_backlog')
        && closedIds.includes('30d_2_7_define_future_sops');
    case 'PHASE_4':
      const ratio = k.actions.length
        ? k.actions.filter(a => a.doneAt !== null).length / k.actions.length
        : 0;
      return closedIds.includes('30d_3_1_assign_ownership')
        && closedIds.includes('30d_3_6_update_sops_realtime')
        && ratio >= 0.80;
    case 'CLOSED':
      return closedIds.includes('30d_4_1_rebaseline')
        && k.remeasurementId !== null
        && k.roi !== null
        && closedIds.includes('30d_4_5_control_plan')
        && closedIds.includes('30d_4_6_final_report');
  }
};

const advancePhase = (kaizenId, toPhase) => {
  if (!canAdvancePhase(kaizenId, toPhase)) throw new Error('PHASE_GUARD_FAILED');
  const k = repo.get('kaizens', kaizenId);
  const from = k.phase;
  repo.upsert('kaizens', kaizenId, { ...k, phase: toPhase });
  EventBus.publish('ProjectPhaseAdvanced', { kaizenId, from, to: toPhase });
};
```

### 4.4 New event

| Event | Payload | Primary subscribers |
|---|---|---|
| `ProjectPhaseAdvanced` | `{ kaizenId, from, to, advancedAt }` | ComposerService (re-filters eligible payload by new phase), MetricsService (phase-duration leading indicator), UI (re-render KaizenCard phase stepper) |

---

## 5. Composer Behavior

### 5.1 Deep-block payload filter (extends `ENGINE_DESIGN §1.6`)

When `input.activeKaizen?.projectType === 'KAIZEN_ACCELERATOR_30D'`, `selectDeepPayload()` changes one step:

```js
// EXTENDED — selectDeepPayload for accelerator
const selectDeepPayload = (input) => {
  const k = input.activeKaizen;
  if (!k) return findCatalogEntry(input.catalog, 'Deep Work — Project Task (generic)');

  if (k.projectType === 'KAIZEN_ACCELERATOR_30D') {
    const eligible = input.catalog.filter(c =>
      c.projectTypeBinding === 'KAIZEN_ACCELERATOR_30D' &&
      c.phaseBinding === k.phase &&                              // NEW — phase gate
      c.dependsOn.every(dep => isClosedForKaizen(dep, k.id)) &&  // DAG check (same R9 as DMAIC)
      !isClosedForKaizen(c.id, k.id)                              // not already done
    );
    if (eligible.length === 0) {
      // All Phase tasks complete — generic Deep to keep the day valid; user should advance phase
      return findCatalogEntry(input.catalog, 'Deep Work — Project Task (generic)');
    }
    return pickHighestPriorityPhase(eligible, k);                 // see §5.2
  }

  // DMAIC and KAIZEN_EVENT fall through to existing logic from ENGINE_DESIGN §1.6
  return nextDmaicOrKaizenStep(k, input.catalog) ?? genericDeep(input);
};
```

### 5.2 Priority within an eligible set

1. Tasks in the current phase.
2. Tasks unlocked most recently (preserves momentum).
3. `isNonOptional === true` ranks above configurable — phase gates finish first.
4. Alphabetical by `id` (stable deterministic tiebreak).

### 5.3 Bucket routing per the user's spec

Phase 0 tasks go to COMMUNICATION except 0.2, 0.3, 0.4 which are authoring work → PROJECT. Phase 1.4 (TIMWOODS) and 1.5 (SOPs) are PROJECT. Phase 2 is a **dedicated Kaizen Event window**: the composer packs PROJECT bucket entirely with Phase 2 entries on Days 8–12, with COMMUNICATION holding only the Daily Standup + anchor ceremonies. Phase 3 is a **mix**: PROJECT for execution (3.3), COMMUNICATION for decisions (3.1, 3.2, 3.5), CI for tracking/adjustments (3.4, 3.6). Phase 4 is **heavy COMMUNICATION** (4.4 validation) + PROJECT (4.1 rebaseline, 4.3 ROI, 4.5 plan, 4.6 report).

### 5.4 Worked example — Day 4 of Phase 1, 60-min external meeting

**Input state:**
- User: Facilitator role, `dailyCapacityMinutes = 480`, `deepSlicePreference = '2x2h'`
- Date: Thursday Day 4 of accelerator (Phase 1, Day 4 of Baseline week)
- `externalMinutesToday = 60` (stakeholder touchbase 11:00–12:00)
- `activeKaizen`: `{ projectType: 'KAIZEN_ACCELERATOR_30D', phase: 'PHASE_1', id: 'k_accel_001', baselineMetricId: null (not yet locked) }`
- `30d_1_1_collect_workflow_data` and `30d_1_2_build_current_state_map` already CLOSED on prior days.
- Eligible Phase 1 payload: `30d_1_3_define_activity_metrics`, `30d_1_4_identify_waste`, `30d_1_5_generate_baseline_sops` (1.3 is the depends-on root for 1.4).
- `signals = { inboxOverThreshold: false, documentAwaitingReview: [], innovationStageReady: [] }`

**Bucket targets** (§2.1 of ENGINE_DESIGN): `{PROJECT: 240, COMMUNICATION: 60, CI: 120}` (COMM reduced by 60 external).

**Composed day (minute-by-minute):**

| Time | Activity | Bucket | Min | Linked | Why |
|---|---|---|---|---|---|
| 09:00 | Daily Standup | COMMUNICATION | 15 | — | R1_NON_OPTIONAL |
| 09:15 | AM High-value Communication | COMMUNICATION | 30 | — | R1 (shrunk from 60→30 to fit 60-min COMM target alongside post-lunch block) |
| 09:45 | Deep Work — **30d_1_3_define_activity_metrics** (slice 1) | PROJECT | 120 | `linkedKaizenId=k_accel_001, linkedDmaicStepRef={kaizenId, catalogEntryId:'30d_1_3_...'}` | R3_KAIZEN_LINK + R_PHASE_BINDING (Phase 1 eligible, dependsOn satisfied, isNonOptional=false but highest priority given unlocked-most-recently tiebreak) |
| 11:00 | [external meeting] | — | 60 | external | externalMinutesToday reservation |
| 12:00 | [lunch] | — | — | — | — |
| 13:00 | Post-lunch High-value Communication | COMMUNICATION | 15 | — | R1 |
| 13:15 | Deep Work — **30d_1_3** (slice 2, completes the activity) | PROJECT | 120 | same | R3 — 2×2h slicing; slice 2 closes the 240-min allocation |
| 15:15 | Track Progress Daily (**30d_3_4**) — NOT ELIGIBLE (Phase 1) | — | — | — | skipped by filter |
| 15:15 | PDCA Cycle | CI | 30 | — | R_CI_ROTATION (no active PDCA for this accelerator — optional; fills slack) |
| 15:45 | Personal L&D | CI | 60 | — | R_CI_ROTATION (weekly tick not fired this week) |
| 16:45 | End-of-Activity Reflection (meta) | CI | 15 | — | R1_NON_OPTIONAL |
| 17:00 | — | — | — | — | day close |

**Totals:** PROJECT 240, COMMUNICATION 60, CI 105 + 15 meta = 120. Total 420 + 60 external = 480 cap. Composer emits `PROPOSED` composition; user accepts; when `30d_1_3` closes, the reflection flag surfaces any friction; the next day the composer picks `30d_1_4` (TIMWOODS) as the unlocked successor.

**Phase 2 change.** On Day 8 (first day of Phase 2), the same composer algorithm produces a **Kaizen Event day**: the PROJECT bucket holds a single 4h block bound to `30d_2_1_prepare_event` or `30d_2_2_review_current_state`, and Phase-2 Deep blocks continue through Day 12 in strict `dependsOn` order. The user explicitly flagged this in the spec ("Virtual Kaizen Event treated as a 3–5 day Deep intensive").

### 5.5 Phase advancement is UI-driven, composer-reactive

The composer does **not** auto-advance phase. Phase advancement is a user action on KaizenCard (or a Sponsor-countersigned action for gated phases). The composer reacts to `ProjectPhaseAdvanced` by re-filtering eligible payload on the next `composeDaily()` invocation.

---

## 6. ROI & Financial Impact Model

### 6.1 Data flow

```
30d_4_3_calculate_roi ScheduledActivity.close()
   │
   ├─ outputArtifactRef.schema = 'NUMERIC' (captured as { implementationCostDollars, annualBenefitsDollars })
   │
   ├─ KaizenService.applyRoiArtifact(kaizenId, artifact) →
   │     repo.upsert('kaizens', { ...k,
   │       implementationCostDollars: artifact.implementationCostDollars,
   │       annualBenefitsDollars: artifact.annualBenefitsDollars
   │     })
   │
   └─ Kaizen.roi is a getter — pure function over the two fields

// Pure function — no side effects, fully unit-testable
const computeRoi = (implementationCostDollars, annualBenefitsDollars) => {
  if (implementationCostDollars == null || annualBenefitsDollars == null) return null;
  if (implementationCostDollars === 0) return null;  // undefined ROI; engine surfaces "Finance review required"
  return (annualBenefitsDollars - implementationCostDollars) / implementationCostDollars;
};
```

### 6.2 Validation (no ROI without remeasurement)

`KaizenService.applyRoiArtifact()` refuses to accept `30d_4_3` close unless:
1. `30d_4_1_rebaseline` is CLOSED (post-implementation data exists).
2. `Kaizen.remeasurementId !== null` OR the rebaseline's output artifact will be used to create the `Remeasurement` row atomically. (The rebaseline output **becomes** the Remeasurement: its `metricDefinitionId` must match `Kaizen.baselineMetricId`'s metric definition.)

This is the fourth non-negotiable from §1 — "no ROI without validation" — encoded as a service-level precondition.

### 6.3 Display

ROI is surfaced on `KaizenCard` in the new ROI panel (§7.2) using the exact formula. Three variants render:
- `roi > 0`: positive ROI, ratio formatted as percent (e.g., "ROI: 325%"), bar chart showing annualBenefits vs implementationCost.
- `roi === 0`: break-even, "ROI: 0% — investment matches annual benefit."
- `roi < 0`: negative ROI, "ROI: -45% — Finance review required." (Closes are still allowed with `closeKind='PARTIAL'` or `'FAILED_HONEST'` — truthfulness of portfolio is preserved, per blueprint §7.2.)

### 6.4 Relationship to DMAIC #39 Financial Benefit Translator

`#39 DMAIC Financial Benefit Translator` in `CATALOG_GAPS §C.4` is the same pattern, scoped to DMAIC projects over a longer horizon. The 30-Day Accelerator reuses its **procedure shape** (identify categories → quantify current → project post → annualize → confidence rating → Finance sign-off) but writes to two stored fields on Kaizen instead of a standalone document. The two coexist: DMAIC projects use #39; Accelerators use `30d_4_3`. Finance sign-off is required for both. Under `RoiEngine`, both call `computeRoi()`.

---

## 7. UX Surfaces

### 7.1 Touched components and routes

| UX_FLOWS component/route | Change |
|---|---|
| `/kaizen/:id` (route) | When `Kaizen.projectType === 'KAIZEN_ACCELERATOR_30D'`, renders the 5-step phase stepper + ROI panel (when PHASE_4) in addition to the existing Baseline / Goal / Actions / Remeasurement layout. |
| `KaizenCard` (§3.8) | Adds `PhaseStepper` sub-component (see §7.2) and `RoiPanel` sub-component (see §7.3). Both gated on `projectType`. |
| `ScheduledActivityBlock` (§3.3) | When the block's `catalogEntryId` is bound to the accelerator, shows a small "Phase N" chip next to the existing bucket chip. No behavior change. |
| `CycleCard` (§3.1) | On PHASE_2 days, shows a "Kaizen Event Day X of 5" banner across the top of the day. Non-blocking; informational. |
| `AdherenceDial` (§3.9) | When an accelerator is active, the third number ("delta on active Kaizen's primary metric") is replaced on the PHASE_4 view with the ROI percentage. Before PHASE_4 the third number remains baseline-to-current delta when a Remeasurement is captured, else "baseline locked, no remeasurement yet". |
| `/kaizen/:id/accelerator` (NEW sub-route) | Phase-by-phase task list with per-phase completion bars. Surfaces the 31 tasks grouped by phase. Tapping a task routes to the scheduled activity (`/today/activity/:id`) if scheduled today or shows "scheduled for Day N". |

### 7.2 PhaseStepper sub-component on KaizenCard

```
┌────────────────────────────────────────────────────────────────────┐
│ 30-Day Kaizen Accelerator — Day 12 of 30                           │
│                                                                    │
│  [●] Phase 0     [●] Phase 1     [●] Phase 2     [○] Phase 3   …  │
│      Pre-work        Baseline        Kaizen Event    Implementation │
│      Days …          Days 1–7        Days 8–12       Days 13–23    │
│      Charter ✓       Baseline ✓     → Advance to Phase 3 [button]  │
│                                                                    │
│  Can't advance: backlog not prioritized yet (30d_2_6 open).        │
└────────────────────────────────────────────────────────────────────┘
```

- 5 dots (filled = completed phase, semi-filled = current, hollow = future).
- Below each dot: phase name + days range + most-recent milestone.
- Current phase shows an "Advance to Phase N+1" button.
- Tapping the button calls `canAdvancePhase()`. If returns false, shows an inline guard-check message with the specific blocking entry (e.g., *"Can't advance to Phase 2: baseline not approved by all stakeholders (30d_1_6 not closed)."*).

### 7.3 RoiPanel sub-component on KaizenCard

Shown only when `projectType === 'KAIZEN_ACCELERATOR_30D' AND phase === 'PHASE_4'`.

```
┌────────────────────────────────────────────────────────────────────┐
│ Financial Impact                                                   │
│                                                                    │
│   Implementation cost    $45,000                                   │
│   Annual benefits       $150,000                                   │
│   ─────────────────────────────                                    │
│   ROI                   +233%   (computed)                          │
│                                                                    │
│   Captured: 30d_4_3 · 2026-05-14 · Signed off: Finance             │
└────────────────────────────────────────────────────────────────────┘
```

Read-only panel. Values sourced from `Kaizen.implementationCostDollars`, `Kaizen.annualBenefitsDollars`, `Kaizen.roi` (getter). Signed-off date and approver pulled from the `30d_4_3` scheduled activity's `outputArtifactRef`.

### 7.4 Hidden vs MVP vs Next

Per the "MVP cap = 1 active Kaizen" rule in blueprint §4.1, the Accelerator fits within MVP's cap because it *is* the Kaizen. However, **the UX surfaces in §7.2 and §7.3 are Next**, not MVP — see §10 for the scope call.

---

## 8. SOP & Control Plan as Artifacts

### 8.1 Storage model

All four "document artifact" entries — baseline SOPs (`30d_1_5`), future SOPs (`30d_2_7`), final SOPs (`30d_3_6`), control plan (`30d_4_5`) — are modeled as `CatalogEntry.outputArtifact.schema = 'DOCUMENT'` (per `UX_FLOWS §4.5` DOCUMENT schema).

- The artifact value is stored on the `ScheduledActivity.outputArtifactRef` as `{ schema: 'DOCUMENT', value: { title: string, url: string, version: string, updatedAt: ISO } }`.
- Versioning is external (repo / Quip / Google Docs / similar). BAM-X stores the link + version string.
- Retrieval: `KaizenService.getArtifact(kaizenId, catalogEntryId)` returns the latest `ScheduledActivity.outputArtifactRef` for that entry within that Kaizen scope.

### 8.2 Why this fits MVP without new entities

The `ScheduledActivity.outputArtifactRef` field already exists and already accepts `schema='DOCUMENT'`. The "SOPs as versioned artifacts" requirement doesn't need a new Document entity — it's a link + version string on an existing field. Document management (rich diffing, content storage, in-app editing) is explicitly out of MVP (blueprint §4.3 "Generic AI chat or document generation outside the composer / reflection / DMAIC moments").

### 8.3 Final SOPs as a rolling update

`30d_3_6_update_sops_realtime` is scheduled multiple times across Days 13–23 (once per significant change). Each close updates the SOP version. The "final" SOP is simply the latest `outputArtifactRef` for `30d_3_6` within this Kaizen — retrieved via the same `getArtifact` helper.

---

## 9. Success Criteria as Guard Rails

The user's four success criteria translate to engine guards as follows. **None block phase advancement** — they emit telemetry warnings and surface inline coaching (per the E11 pattern in `DELIVERY_PLAN.md`).

| Criterion | Engine guard | Emit |
|---|---|---|
| Process scoped in 1 day | If `PHASE_0` elapsed working days > 1 at advance-time, emit warning | `AcceleratorPaceWarning { phase:'PHASE_0', targetDays:1, actualDays }` |
| Baseline completed in 1 week | If `PHASE_1` elapsed working days > 7 at advance-time, emit warning | `AcceleratorPaceWarning { phase:'PHASE_1', targetDays:7 }` |
| Improvements implemented in 2 weeks | If `PHASE_3` elapsed working days > 10 at advance-time (Days 13–23 = 11 days, so 10 working days), emit warning | `AcceleratorPaceWarning { phase:'PHASE_3', targetDays:10 }` |
| ROI validated by day 30 | If CLOSE occurs > Day 30 from `startDate`, emit warning | `AcceleratorPaceWarning { phase:'CLOSED', targetDays:30 }` |

Warnings render as inline coaching on KaizenCard: *"Phase 1 took 9 days; target is 7. Consider trimming scope for the next accelerator."* (see microcopy pattern in `UX_FLOWS §5`).

Additional engine invariant — **no concurrent accelerator plus another active Kaizen**: `KaizenService.promote()` continues to enforce the MVP cap of 1 active Kaizen, which already covers this case (a 30-Day Accelerator is a Kaizen).

---

## 10. MVP vs Next Positioning

### 10.1 Recommendation: **Next** (not MVP)

The 30-Day Kaizen Accelerator ships in **Next**, not MVP. Justification:

1. **MVP scope is already full.** `DELIVERY_PLAN.md` estimates 104 tasks across 12 epics at ~75 project days — the current plan already trims to fit. Adding the Accelerator adds 5–8 engineer days on top of the existing 12 epics.
2. **Catalog authoring effort is real.** 31 new entries × ~30 min each = ~15 hours. Procedure text, dependsOn edges, bucket assignments, and artifact schemas all need PM / Black-Belt review before seed — similar to `CATALOG_GAPS §A–D` gap-fill, which is already sized as an M task in E2-T4.
3. **The value proposition needs Next anyway.** A validated 30-Day Accelerator delivery assumes multi-participant team mode (Sponsor + Process Owner + SMEs + Facilitator) is at least partially live. Blueprint §5.2 explicitly defers team rollup to Next. Shipping the accelerator in MVP as a solo experience shrinks its value.
4. **Three MVP extensions required.** (a) `ProjectType` + `phase` + `phaseDefinitions` on Kaizen; (b) `projectTypeBinding` + `phaseBinding` on CatalogEntry; (c) ROI fields. These are additive schema changes (cheap), but the KaizenCard phase stepper + ROI panel (~2 days each) + composer phase-binding filter (~1 day) + guard implementation (~1 day) add up. Better spent on hardening MVP.

### 10.2 What does ship to MVP to *prepare* for Next

Two small MVP patches (≤ 1 engineer day total) keep the door open without the full build:

1. Add `projectType: ProjectType` (default `AD_HOC`) and `projectTypeBinding: ProjectType | null` (default `null`) to the schema version so the localStorage migration is ready when Next lands.
2. Ship a disabled `/kaizen/accelerator` placeholder route per the `UX_FLOWS §1.3` pattern ("Ships in Next. Until then, run a Kaizen from Weekly Reflection as an ad-hoc project.").

### 10.3 What ships in Next (the actual accelerator)

- 31 catalog entries seeded (E_ACCEL-T1)
- Phase FSM + guards (E_ACCEL-T2)
- Composer `phaseBinding` filter (E_ACCEL-T3)
- KaizenCard `PhaseStepper` (E_ACCEL-T4)
- `RoiPanel` + `computeRoi` (E_ACCEL-T5)
- `AcceleratorPaceWarning` pace guards + inline coaching (E_ACCEL-T6)
- `/kaizen/:id/accelerator` sub-route (E_ACCEL-T7)

**Estimated total: 5–8 engineer days** on top of existing Next epics.

---

## 11. Delivery Plan Impact

### 11.1 Proposed new epic

**E13 — 30-Day Kaizen Accelerator Project Type** (Next phase, not MVP). Sized **M–L** (5–8 days). Depends on E2 (catalog seed), E7 (Kaizen lifecycle), E10 (UI shell).

| Task ID | Title | Scope | Est |
|---|---|---|---|
| E13-T1 | Catalog seed for 31 accelerator entries | Author rows per §3 tables; wire `projectTypeBinding`, `phaseBinding`, `dependsOn`, bucket mapping, non-optional flags. | M |
| E13-T2 | Phase FSM + `canAdvancePhase` + `advancePhase` | Guards per §4.3. Emit `ProjectPhaseAdvanced`. | M |
| E13-T3 | Composer phase-binding filter | Extend `selectDeepPayload` per §5.1. Extend `pickHighestPriorityPhase`. Worked-example test per §5.4. | S |
| E13-T4 | `Kaizen` schema patches | Add `projectType`, `phase`, `phaseDefinitions`, `implementationCostDollars`, `annualBenefitsDollars`, `startDate`. Migration v2 seeds existing Kaizens with `projectType='AD_HOC'`. | S |
| E13-T5 | `RoiEngine.computeRoi` + `applyRoiArtifact` | Pure function; guarded by §6.2 precondition. | S |
| E13-T6 | `PhaseStepper` component on KaizenCard | 5-step stepper + advance button + guard-check inline message. | M |
| E13-T7 | `RoiPanel` component on KaizenCard | Read-only panel gated on PHASE_4. | S |
| E13-T8 | `AcceleratorPaceWarning` engine + microcopy | 4 pace guards per §9; inline coaching strings. | S |
| E13-T9 | `/kaizen/:id/accelerator` sub-route | Task list by phase; routes to today's scheduled block. | S |

**E13 total: 9 tasks ≈ 5–8d.**

### 11.2 Extensions to existing epics (MVP hooks for Next)

Two small MVP tasks as described in §10.2:

- **E1-T1 extension:** add `projectType` + `phase` + `phaseDefinitions` + ROI fields to the `Kaizen` typedef (and add `projectTypeBinding` + `phaseBinding` to `CatalogEntry`). S, ≤ 1h.
- **E10-T1 extension:** add disabled `/kaizen/accelerator` route to the "Ships in Next" list. S, ≤ 30 min.

### 11.3 Dependency graph update

```
E1 → E7 → E13 (Next epic)
           ↑
E2 ───────┘
E3 ───────┘  (phase-binding filter depends on composer)
E10 ──────┘  (PhaseStepper, RoiPanel depend on UI shell + KaizenCard)
```

---

## 12. Upstream Doc Patch List

Patches to existing docs. Each patch is itemized with section + change + rough line count; the coordinator should sequence them in the order listed.

### 12.1 `PRODUCT_BLUEPRINT.md`

| Section | Change | ~Lines |
|---|---|---|
| §3 (new subsection §3.5 "Project Types") | Introduce `ProjectType` concept and list DMAIC / KAIZEN_EVENT / KAIZEN_ACCELERATOR_30D / AD_HOC. Note 30-Day Accelerator fits MVP's "one active Kaizen per user" cap. | +20 |
| §4.2 (Next) | Add bullet: "30-Day Kaizen Accelerator project type — 5-phase 30-day engagement format with 31 dedicated catalog entries, phase FSM, and ROI panel." | +2 |
| §5.2 (Next feature hierarchy) | Add line item for `KAIZEN_ACCELERATOR_30D` project type. | +1 |
| §6 (new subsection §6.5 optional) | Add JTBD statement for Consultant / Black Belt persona running a 30-Day Accelerator. Optional — can ship without. | +15 |

### 12.2 `ARCHITECTURE.md`

| Section | Change | ~Lines |
|---|---|---|
| §2.1 (Entity overview) | Footnote noting Kaizen now carries a `projectType` discriminator; no new entity. | +1 |
| §2.2 (CatalogEntry) | Add `projectTypeBinding: ProjectType \| null` and `phaseBinding: string \| null` fields to the table + invariants. | +4 |
| §2.9 (Kaizen) | Add `projectType`, `phase`, `phaseDefinitions`, `implementationCostDollars`, `annualBenefitsDollars`, `roi` (getter), `startDate` fields. Extend invariants: phase guards apply when `projectType='KAIZEN_ACCELERATOR_30D'`. | +12 |
| §2 (new §2.15 "ProjectType enum") | Define the enum and list the four members. | +8 |
| §3.3 (Kaizen FSM) | Note: when `projectType='KAIZEN_ACCELERATOR_30D'`, FSM composes with a phase sub-FSM (refer to `PROJECT_TYPE_30D_KAIZEN.md §4`). DRAFT→ACTIVE happens at PHASE_1→PHASE_2 gate; ACTIVE→IN_REMEASUREMENT at PHASE_3→PHASE_4 gate. | +6 |
| §6.1 (event catalog) | Add `ProjectPhaseAdvanced` and `AcceleratorPaceWarning` rows. | +2 |
| §7.1 (persistence keys) | Note: Kaizen rows now carry the new fields; no new key needed. | +1 |
| §8 (invariant cross-reference) | Add four rows for the four non-negotiables from §1. | +4 |
| §9 (decisions log) | Add decision #15: "ProjectType discriminator — RESOLVED. `Kaizen.projectType` formalizes DMAIC/KAIZEN_EVENT/KAIZEN_ACCELERATOR_30D/AD_HOC modes; see `PROJECT_TYPE_30D_KAIZEN.md`." | +4 |

### 12.3 `ENGINE_DESIGN.md`

| Section | Change | ~Lines |
|---|---|---|
| §1.6 (Deep Work payload selection) | Extend to cover `projectType='KAIZEN_ACCELERATOR_30D'` — phase-binding filter, see `PROJECT_TYPE_30D_KAIZEN.md §5.1`. | +15 |
| §4 (new §4.4 "Project Type — 30-Day Kaizen Accelerator") | Cross-reference to `PROJECT_TYPE_30D_KAIZEN.md`; summarize the phase FSM in table form; name the new pure function `computeRoi()`. | +30 |
| §4.2 (DMAIC section) | One-liner: "DMAIC projects are one member of a `ProjectType` family (DMAIC / KAIZEN_EVENT / KAIZEN_ACCELERATOR_30D / AD_HOC); see §4.4 for the 30-Day Accelerator." | +2 |

### 12.4 `UX_FLOWS.md`

| Section | Change | ~Lines |
|---|---|---|
| §1.2 (route tree) | Add `/kaizen/:id/accelerator` read-only route under `/kaizen/:id`. Add placeholder `/kaizen/accelerator` (Ships in Next) in §1.3. | +3 |
| §3.8 (KaizenCard) | Add two sub-components: `PhaseStepper` (gated on `projectType='KAIZEN_ACCELERATOR_30D'`) and `RoiPanel` (gated on PHASE_4). Per-state renderings per `PROJECT_TYPE_30D_KAIZEN.md §7`. | +20 |
| §3 (new §3.12 `PhaseStepper`) | Full component spec: binds to Kaizen; 5 states per phase; Accept/Edit/Advance interactions. | +25 |
| §3 (new §3.13 `RoiPanel`) | Full component spec: binds to Kaizen (read-only). | +15 |
| §5 (coaching microcopy) | Add 4 triggers for `AcceleratorPaceWarning` (one per phase). | +8 |

### 12.5 `CATALOG_GAPS.md`

| Section | Change | ~Lines |
|---|---|---|
| New §I "30-Day Kaizen Accelerator catalog seed" | Reference `PROJECT_TYPE_30D_KAIZEN.md §3` as the authoritative source for 31 new entries. Note the new `focusArea = KAIZEN_ACCELERATOR_30D`, the `projectTypeBinding`, and the `phaseBinding`. Bucket mapping inline-quoted from `PROJECT_TYPE_30D_KAIZEN.md §3`. | +60 |
| §H.1 (bucket mapping table) | Append row group "30-Day Accelerator entries (30d_0_1 … 30d_4_6)" with bucket per task. | +32 |
| §E.1 (cadence rule-based inference) | Add rule: "30-Day Accelerator step gated by prior step completion → Event-driven within accelerator phase." | +1 |

### 12.6 `DELIVERY_PLAN.md`

| Section | Change | ~Lines |
|---|---|---|
| §1 (Epic Breakdown) | Add new row **E13 — 30-Day Kaizen Accelerator Project Type**. Depends on E2, E7, E10. Tagged Next. | +2 |
| §2 (Detailed Backlog) | Add new subsection **E13** with 9 tasks per `PROJECT_TYPE_30D_KAIZEN.md §11.1`. | +30 |
| §2 (E1) | Add sub-task E1-T10 for `Kaizen` + `CatalogEntry` new-field typedefs (MVP hook). | +2 |
| §2 (E10) | Add sub-task E10-T16 for `/kaizen/accelerator` placeholder. | +2 |
| §3 (30-60-90 Plan) | Unchanged for MVP. Add footnote: "E13 + E_ACCEL UI components slated for Next window." | +2 |
| §5 (Risks) | Add R13: "Accelerator seed mis-calibration — 31 tasks × procedure text risks errors. Mitigation: PM/Black Belt pair-review before seed." | +2 |

---

## 13. Glossary

| Term | Definition |
|---|---|
| **Accelerator** | Shorthand for a 30-Day Kaizen Accelerator Kaizen (i.e., `Kaizen.projectType === 'KAIZEN_ACCELERATOR_30D'`). |
| **Phase gate** | A catalog entry whose closure is required to advance to the next phase — the `isNonOptional=true` entries in §3. |
| **Pace warning** | A non-blocking engine warning emitted when a phase elapses more working days than the user's spec targets (§9). |
| **ROI** | `(annualBenefitsDollars − implementationCostDollars) / implementationCostDollars`. Pure function; no inventory. |
| **Phase-binding filter** | The composer rule that narrows eligible Deep-block payload to entries whose `phaseBinding` matches the Kaizen's current `phase` (§5.1). |
| **Ledgerium AI** | Optional workflow-recording integration referenced in `30d_1_1` and `30d_4_1`. Not designed here; noted as a Next-phase integration per user brief. |
