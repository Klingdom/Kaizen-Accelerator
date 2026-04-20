# The Accelerator — Operating Standard

Owner: Master Black Belt / Kaizen Event Architect / PMO Mechanism Designer
Status: v1.0 — authoritative operating standard for `Kaizen.projectType='KAIZEN_ACCELERATOR_30D'` inside CadencePlan.
Scope: Canonical doctrine for planning, staffing, running, validating, and closing a 30-day Accelerator. Facilitators, PMOs, operational-excellence teams, and AI agents treat this as authoritative. Ground docs: `PROJECT_TYPE_30D_KAIZEN.md` v0.2, `PRODUCT_BLUEPRINT.md` v0.3, `ARCHITECTURE.md` v0.4, `ENGINE_DESIGN.md` v0.3, `CATALOG_GAPS.md` v0.2, `docs/Business Agility Standard Work.txt`, `docs/📘 The BAM Way_ Agile Project Mastery.pdf`.

> This is an **operating standard**, not an architectural spec. It decomposes the 31 catalog entries in `PROJECT_TYPE_30D_KAIZEN.md §3` into the ~70 observable work tasks a real team executes. It names the artifacts, the owners, the decisions, the acceptance gates, and the failure modes. It does not re-specify the FSM or the composer — those remain authoritative in the architecture and engine docs.

---

## Part 1 — Executive Validation of The Accelerator Model

### 1.1 Concise project model

The Accelerator is a 30-day, 5-phase, ROI-validated Kaizen project that takes one named process from "we think it's broken" to "here is the rebaselined number plus signed Finance ROI." It is a discriminated instance of the `Kaizen` entity — same lifecycle, same invariants, plus a frozen 5-phase timeline (Pre-work → Baseline → Kaizen Event → Implementation → Validation) and two ROI fields (`implementationCostDollars`, `annualBenefitsDollars`) that the close gate refuses to bypass. Phase boundaries are enforced by guards in `KaizenService.canAdvancePhase()`: no Phase 2 without a locked baseline, no Phase 3 without named owners and dated actions, no close without a remeasurement on the same metric definition as baseline. The composer scopes Deep-block payload to the current phase; a Kaizen Event week (Phase 2, Days 8–12) packs the PROJECT bucket with Phase 2 catalog entries. The Accelerator's output is not a slide deck — it is a closed `Kaizen` row with locked baseline, remeasurement, Finance-signed ROI, signed control plan, and a Process Owner who now owns sustainment.

### 1.2 Business problem it solves

| # | Pain | What the Accelerator does about it |
|---|---|---|
| 1 | **Process opacity.** Leaders describe processes by anecdote; cycle times and defect rates are guessed. | Phase 1 forces a direct-observation or extract-based baseline (`30d_1_1`) with locked summary statistics before any improvement is proposed. |
| 2 | **Improvement theater.** Workshops produce action lists that die in two weeks; no one tracks which actions shipped or whether they moved a number. | Phase 3 writes actions onto `Kaizen.actions[]` with `ownerRef` + `dueDate`; the Phase 3→4 guard refuses to advance until ≥80% are `doneAt != null`. |
| 3 | **Ungrounded ROI claims.** Finance doesn't trust "we saved 20%" numbers produced by CI teams in isolation. | Phase 4 requires Finance co-sign on both `implementationCostDollars` and `annualBenefitsDollars` before the engine will compute `roi`; negative ROI is allowed to close (with `closeKind='FAILED_HONEST'`) so the portfolio shows truth. |
| 4 | **No control plan, no sustainment.** A win at Day 30 reverts by Day 60 because no one owns the chart. | `30d_4_5_control_plan` requires a named Process Owner, a monitoring metric, a threshold, a rollback trigger, and scheduled 30/60/90 check-ins before close. |
| 5 | **Scope creep and timeline drift.** Most 30-day promises become 90-day commitments. | The 5-phase FSM is day-boxed; `AcceleratorPaceWarning` telemetry fires on any phase exceeding its target (1/7/5/10/7 working days). Phase 2 is hard-capped at 5 calendar days by the catalog. |

### 1.3 Why superior to ad-hoc CI

1. **The primitive is a vetted catalog entry, not a blank Kaizen card.** Every one of the 31 Accelerator activities has pre-authored procedure steps, inputs, output schema, participants, and a bucket routing. A facilitator opens the project with 31 pre-composed blocks of work, not with a whiteboard.
2. **Phase advancement is guard-checked, not self-declared.** Ad-hoc Kaizens advance when the team says they do. Accelerator phases advance only when specific catalog entries are `CLOSED` with required output artifacts — the engine refuses soft advancement.
3. **ROI is a computed field on a pure function, not a spreadsheet claim.** `computeRoi(impl, benefits)` runs the same way every time; Finance sign-off is a precondition, not an afterthought. The number on the Kaizen card is the same number in the portfolio rollup.
4. **Remeasurement uses the same metric definition as baseline.** The close gate compares `remeasurement.metricDefinitionId === baseline.metricDefinitionId`. Ad-hoc efforts compare "time it took yesterday" to "time it takes now" with no operational definition; the Accelerator refuses that comparison.
5. **Baseline SOPs are versioned and diffable.** `30d_1_5` baseline SOPs → `30d_2_7` future-state draft → `30d_3_6` final SOPs form a three-version chain the Process Owner can point at on Day 90 when asked "what actually changed?"

### 1.4 Current-model risks (at the model level)

1. **Risk: Phase 0 (Pre-work) is sized at ≤1 working day but depends on Sponsor availability for charter sign-off.** In practice, Sponsor sign-off is the single biggest schedule slip in all of CI work. Model-level mitigation: allow `30d_0_6` to be completed asynchronously (written sign-off via email-thread artifact), not only synchronously. Flagged for Part 1.6 refinement.
2. **Risk: Phase 1 baseline at 7 days is aggressive for processes with long natural cycle times.** A monthly-closing process or a quarterly-renewal process cannot be baselined in 7 working days with meaningful n. Model-level mitigation: in Phase 0, Facilitator must flag "cycle-time category" and if cycle > 3 days, either pick a sub-process or accept a baseline sample of 5–10 instead of 30. Reflected in Part 7 baseline rules.
3. **Risk: Phase 2 "Kaizen Event week" assumes team availability for 3–5 consecutive days.** Knowledge-work teams rarely clear 5 consecutive days. Model-level mitigation: allow Phase 2 to run as 5 non-consecutive days within a 10-day window, preserving the 5-day workload inside the 30-day envelope.
4. **Risk: `30d_4_3_calculate_roi` assumes a named Finance partner exists and responds within Phase 4's 7-day window.** Many teams do not have a dedicated Finance partner per project. Mitigation: Phase 0 requires identifying a Finance partner in the roster (`30d_0_5`) — elevate from optional to mandatory role for Accelerator. See Part 6.
5. **Risk: Phase 3 "≥80% actions done" gate rewards volume of small changes over completion of large ones.** A team can game the gate with ten trivial actions and one incomplete structural change. Mitigation: require weighted completion using the impact score from `30d_2_6` — if any "strategic" (>2 week) action is incomplete, advance is blocked regardless of count. Reflected in Part 7 gate reviews.
6. **Risk: No signal for scope-change mid-flight.** If the problem statement changes in Phase 2 because root cause analysis surfaces a different process, the baseline is now on the wrong metric. Mitigation: introduce a "scope-change event" that abandons the current Kaizen and starts a new one from Phase 0 — per the `ARCHITECTURE.md §3.3` abandoned-Kaizen path. Do not allow silent scope rotation.
7. **Risk: Control plan (`30d_4_5`) is authored at Day 29 with no time to test sustainment.** Mitigation: author control-plan draft as part of Phase 2 (`30d_2_5` improvements list implies monitoring metrics), not Phase 4; Phase 4 only validates and finalizes. Flagged for Part 1.6.

### 1.5 Critical success factors

1. **Sponsor is named, reachable, and has decision authority for the process's scope before `30d_0_1` starts.** Not "identified during engagement" — named at contract signature.
2. **Baseline metric has a pre-existing operational definition or one is authored in Phase 0.** Metric ambiguity kills Phase 4 comparison.
3. **Process Owner commits to attend Phase 1 validation, all Phase 2 days, and Phase 4 sign-off.** If the Process Owner is "too busy for the event," the project will fail sustainment.
4. **Facilitator has Black Belt level DMAIC fluency and at least one prior Kaizen Event facilitated.** Accelerator is not a beginner's project type.
5. **Finance partner is named in Phase 0 roster and confirms availability for Phase 4 sign-off window.** No Finance → no ROI → no close.
6. **Data-capture method is decided in Phase 0, not Phase 1.** If existing logs don't cover the metric, direct observation must be scheduled into Phase 1 capacity from Day 1.
7. **Team capacity is reserved, not hoped for.** Each team member's calendar has Accelerator blocks held before Phase 0 ends.
8. **No concurrent major process change on the same system.** If the target system is also in a re-platform, baseline and remeasurement will be on different systems of record; defer.

### 1.6 Recommended refinements to the v0.1 design

1. **Add a Finance partner role to the mandatory roster in `30d_0_5`.** v0.1 lists Sponsor + Process Owner + Facilitator + SMEs; add Finance partner as required for Accelerator. Without this, Phase 4 ROI sign-off blocks on a role that was never assigned.
2. **Start the control plan draft in Phase 2, not Phase 4.** Move control-plan drafting (monitoring metric, threshold, response) into `30d_2_5` outputs — Phase 4 (`30d_4_5`) becomes validate + sign, not author. Gives the Process Owner time to challenge sustainment design before it's final.
3. **Promote `30d_0_3_define_problem_statement` acceptance to a separate Sponsor-approval task (`acc_00_04` in Part 3).** v0.1 bundles problem-statement approval into step (d) of `30d_0_3`. Separating it gives a clean observable gate and a named artifact (the "Approved problem statement" memo).
4. **Add "Scope Change → Abandon" as an explicit model-level event.** Currently the path from "we discovered it's a different process" to "start over" is implicit. Make it explicit so facilitators know the only legal response to scope rotation is abandonment + new Kaizen.
5. **Introduce a weighted Phase 3 advance guard.** Add a rule: no strategic (>2-week) action can be incomplete when advancing to Phase 4; the ≥80% count rule applies only when no strategic action is open.

### 1.7 Failure modes and prevention controls

| # | Failure mode | Prevention control |
|---|---|---|
| 1 | **Charter signed on scope the Sponsor does not own.** Sponsor signs a charter for a process that crosses into another VP's territory; halfway through Phase 1, the other VP objects. | `30d_0_6` charter template requires naming every org unit touched by the scope (from `30d_0_2` boundaries) and the Sponsor confirms authority covers all of them. |
| 2 | **Baseline locked on the wrong metric.** Primary metric in `30d_0_4` is "cost per transaction" but the operational definition is "loaded labor cost"; Finance uses fully-absorbed cost for ROI — mismatch. | `30d_0_4` operational definition must name the cost basis (fully-loaded vs marginal) and Finance partner signs `30d_0_4` output before `30d_1_1` starts. |
| 3 | **Improvement theater (actions list without ownership).** Phase 2 produces a backlog; by Day 13 nobody has claimed items. | `30d_3_1_assign_ownership` is a blocking gate; `canAdvancePhase('PHASE_4')` fails if any action has `ownerRef == null`. |
| 4 | **Gamed remeasurement.** Remeasurement uses a different sample frame, exclusion rule, or time window than baseline, showing improvement that is measurement artifact. | Part 7 remeasurement rules require same `metricDefinitionId`, same sample method, same exclusion rule. Facilitator attests. |
| 5 | **ROI inflated by pretending labor savings are hard dollars.** Benefits dollar field is populated with time-saved × fully-loaded rate where no labor was redeployed or released. | `30d_4_3` procedure requires classifying each benefit as Hard / Soft / Cost-Avoidance; Hard requires a P&L line or an FTE-release memo. See Part 7 ROI logic. |
| 6 | **SOP drift (changes implemented but not documented).** Real behavior diverges from `30d_3_6` SOPs; future audits find non-compliance. | `30d_3_6_update_sops_realtime` fires every time a significant change lands in `30d_3_3`; the Phase 3→4 guard requires `30d_3_6` CLOSED. |
| 7 | **No sustainment signal at Day 60.** Process Owner does not open the control plan; regression happens unseen. | Control plan (`30d_4_5`) requires 30/60/90 check-in calendar holds created before close; Facilitator retains a "sustainment check" obligation at Day 90. See Part 7. |

---

## Part 2 — Full Project Lifecycle: the 20 Granular Phases

The v0.1 design defined 5 phases (PHASE_0..PHASE_4). Operating the Accelerator at PMO granularity requires 20 observable sub-phases. Each 20-phase entry maps to a PHASE_N parent; architecture integration is unchanged.

| Sub-phase # | Name | Parent | Days |
|---|---|---|---|
| 01 | Intake and candidate process selection | PHASE_0 | Day -3 to Day 0 |
| 02 | Scope definition and boundary lock | PHASE_0 | Day 0 |
| 03 | Problem statement authoring and Sponsor approval | PHASE_0 | Day 0 |
| 04 | Success metric selection and operational definition | PHASE_0 | Day 0 |
| 05 | Roster assembly and role confirmation | PHASE_0 | Day 0 |
| 06 | Charter sign-off and team kickoff | PHASE_0 | Day 0 |
| 07 | Data-capture method decision and tooling prep | PHASE_1 | Day 1 |
| 08 | Baseline data collection | PHASE_1 | Days 1–4 |
| 09 | Current-state mapping and waste identification | PHASE_1 | Days 4–5 |
| 10 | Baseline SOP authoring | PHASE_1 | Days 5–6 |
| 11 | Baseline validation and metric lock | PHASE_1 | Day 7 |
| 12 | Kaizen Event — current state review and root cause | PHASE_2 | Days 8–9 |
| 13 | Kaizen Event — future-state design and backlog | PHASE_2 | Days 10–12 |
| 14 | Implementation planning and ownership assignment | PHASE_3 | Day 13 |
| 15 | Execution and real-time SOP updates | PHASE_3 | Days 13–22 |
| 16 | Blocker resolution and implementation validation | PHASE_3 | Days 18–23 |
| 17 | Rebaseline and performance delta | PHASE_4 | Days 24–26 |
| 18 | ROI calculation and Finance sign-off | PHASE_4 | Days 26–28 |
| 19 | Control plan, final report, Sponsor close | PHASE_4 | Days 28–30 |
| 20 | Next-process intake recommendation | PHASE_4 | Day 30 |

### Sub-phase 01 — Intake and candidate process selection

- **Purpose.** Convert leadership pain and KPI gaps into 1–2 scorable candidate processes.
- **Business outcome.** Leadership has selected a single process to baseline, with a one-line pain and a one-line measurable gap.
- **Entry criteria.** Engagement signed; Sponsor identified; at least one pain point or KPI gap exists.
- **Exit criteria.** Candidate list of 3–7 ranked on Impact × Feasibility; 1–2 short-listed; Sponsor verbally accepts the short-list.
- **Major decisions.** Which process to focus on; whether any of the candidates is out-of-scope due to concurrent transformation work.
- **Major artifacts.** Intake Diagnostic Brief (A01); Candidate Process Scorecard (A02).
- **Required roles.** Facilitator (owner), Sponsor, optional Process Owner-of-record.
- **BAM scheduling.** Pre-engagement — fits in Communication bucket of Facilitator's baseline weeks.
- **Duration.** 0.5–1 day elapsed; ~4 person-hours.
- **Capacity assumption.** Sponsor is reachable for a 30-minute interview; any supporting KPI report exists.

### Sub-phase 02 — Scope definition and boundary lock

- **Purpose.** Lock a falsifiable start-boundary, end-boundary, systems-of-record, and roles.
- **Business outcome.** Nobody downstream can claim "I thought that was in scope" — the boundary is on paper.
- **Entry criteria.** Candidate selected (sub-phase 01 exit).
- **Exit criteria.** Scoped Process Definition artifact (A03) captures start event, end event, systems, personas, and 3–5 explicit out-of-scope items.
- **Major decisions.** Where the process starts (first triggering event) and ends (observable output event).
- **Major artifacts.** Scoped Process Definition (A03).
- **Required roles.** Facilitator (owner), Process Owner.
- **BAM scheduling.** Single PROJECT Deep block (90 min).
- **Duration.** 0.25 day; ~2 person-hours.
- **Capacity assumption.** Process Owner has 60 minutes for boundary review.

### Sub-phase 03 — Problem statement authoring and Sponsor approval

- **Purpose.** Commit to a single problem statement that is quantified, scoped, and Sponsor-approved.
- **Business outcome.** The team knows what it is trying to change and by how much; Sponsor has signed the statement.
- **Entry criteria.** Scope locked (sub-phase 02 exit).
- **Exit criteria.** Approved Problem Statement artifact (A04) with current state, quantified impact, baseline metric value (placeholder if pre-baseline), target condition, scope reference, timeframe.
- **Major decisions.** Primary impact axis (time, cost, quality, throughput); whether the target is ambitious enough to justify 30 days of team time.
- **Major artifacts.** Approved Problem Statement (A04).
- **Required roles.** Facilitator (owner), Process Owner, Sponsor.
- **BAM scheduling.** 1 PROJECT block authoring (60 min) + 1 COMMUNICATION block Sponsor review (30 min).
- **Duration.** 0.25 day; ~1.5 person-hours.
- **Capacity assumption.** Sponsor available for a 30-minute sign-off call or equivalent async thread.

### Sub-phase 04 — Success metric selection and operational definition

- **Purpose.** Choose one primary metric and one or two secondary metrics; author operational definitions rigorous enough for Phase 4 remeasurement.
- **Business outcome.** "What good looks like" is numeric, definable, measurable, and Finance-acknowledged.
- **Entry criteria.** Problem statement approved.
- **Exit criteria.** KPI Baseline Targets artifact (A05) carries metric name, operational definition, unit, measurement method, sampling plan, baseline target, post-improvement target, owner, and Finance partner acknowledgement (initial).
- **Major decisions.** Primary metric (single choice); whether measurement needs MSA (subjective / manual); cost basis (if cost metric).
- **Major artifacts.** KPI Baseline Targets (A05).
- **Required roles.** Facilitator (owner), Process Owner, Finance partner.
- **BAM scheduling.** 1 PROJECT block (60 min).
- **Duration.** 0.25 day; ~2 person-hours.
- **Capacity assumption.** Finance partner named in the roster can acknowledge the cost basis within 24 hours.

### Sub-phase 05 — Roster assembly and role confirmation

- **Purpose.** Name every required role with a specific human, confirmed availability, and documented accountability.
- **Business outcome.** No role on the Accelerator roster is unassigned on Day 0.
- **Entry criteria.** Metric selected.
- **Exit criteria.** Project Team Roster (A06) with Sponsor, Process Owner, Facilitator, Implementation Lead, ≥2 SMEs, Finance partner, Decision-maker (if different from Sponsor) — each with name, email, role, accountability, and time commitment per phase.
- **Major decisions.** Who carries Implementation Lead (usually Process Owner or a delegate); Finance partner selection.
- **Major artifacts.** Project Team Roster (A06).
- **Required roles.** Facilitator (owner), Process Owner.
- **BAM scheduling.** 1 COMMUNICATION block (45–60 min).
- **Duration.** 0.25 day; ~2 person-hours.
- **Capacity assumption.** Sponsor can make introduction calls or emails within 24 hours if a role is unnamed.

### Sub-phase 06 — Charter sign-off and team kickoff

- **Purpose.** Consolidate scope, problem, metric, roster, and 30-day timeline into one document; Sponsor signs; team kicks off.
- **Business outcome.** Accelerator is formally initiated; `Kaizen` row exists with `phase='PHASE_0'` and frozen `phaseDefinitions`.
- **Entry criteria.** Roster complete.
- **Exit criteria.** Signed Project Charter (A07); `KaizenService.promote()` called with `projectType='KAIZEN_ACCELERATOR_30D'`; `30d_0_6_approve_charter` ScheduledActivity CLOSED; `phase` advances to `PHASE_1` on user action.
- **Major decisions.** Go / no-go; if no-go, artifact retained but Kaizen not promoted.
- **Major artifacts.** Signed Project Charter (A07); Kickoff meeting notes (A08).
- **Required roles.** Facilitator (owner), Sponsor, Process Owner, full team.
- **BAM scheduling.** 1 COMMUNICATION block (60 min sign-off) + 1 COMMUNICATION block (60 min kickoff).
- **Duration.** 0.5 day; ~8 person-hours across roster.
- **Capacity assumption.** All required roles can clear 60 minutes on the kickoff day.

### Sub-phase 07 — Data-capture method decision and tooling prep

- **Purpose.** Decide Option A (existing system logs) vs Option B (direct observation) per `30d_1_1`; prepare extracts, observation templates, and access.
- **Business outcome.** The baseline collection mechanism exists and is tested before the first real observation.
- **Entry criteria.** Phase 1 entered.
- **Exit criteria.** Data-Capture Plan artifact (A09) names method, tool, sample size target (≥30 for Option A, ≥3–5 runs for Option B), access granted, pilot run completed.
- **Major decisions.** Option A vs B; sample size; time-study template if B.
- **Major artifacts.** Data-Capture Plan (A09); pilot capture log (fragment of A10).
- **Required roles.** Facilitator (owner), Analyst, Process Owner (access approval).
- **BAM scheduling.** 1 PROJECT block (120 min).
- **Duration.** 1 day; ~4 person-hours.
- **Capacity assumption.** System access requests complete in ≤24 hours; if they don't, Option B is the fallback.

### Sub-phase 08 — Baseline data collection

- **Purpose.** Capture the baseline dataset per the locked Data-Capture Plan.
- **Business outcome.** A raw, time-stamped dataset sufficient for summary statistics and comparison in Phase 4.
- **Entry criteria.** Data-Capture Plan locked.
- **Exit criteria.** Raw Baseline Dataset (A10) with n ≥ plan; data-quality flags logged; dataset version tagged; stored in Kaizen workspace.
- **Major decisions.** Whether n is sufficient to proceed; whether to extend the capture window if data is sparse.
- **Major artifacts.** Raw Baseline Dataset (A10).
- **Required roles.** Analyst (owner), Facilitator, SMEs (if Option B).
- **BAM scheduling.** Multi-day: 2 PROJECT Deep blocks per day across Days 1–4, plus asynchronous capture.
- **Duration.** 2–4 days; ~24 person-hours cumulative.
- **Capacity assumption.** SMEs available for observation windows; system extracts return within hours.

### Sub-phase 09 — Current-state mapping and waste identification

- **Purpose.** Convert raw data into a visual process map and a TIMWOODS waste analysis.
- **Business outcome.** Team shares one picture of "how it works today" and one ranked list of waste.
- **Entry criteria.** Raw dataset sufficient.
- **Exit criteria.** Current-State Process Map (A11), Activity Breakdown Table (A12), Waste Analysis (A13) all CLOSED.
- **Major decisions.** Which activities to aggregate; how to render handoffs.
- **Major artifacts.** A11, A12, A13.
- **Required roles.** Facilitator (owner), SMEs.
- **BAM scheduling.** 2 PROJECT blocks (180 min + 120 min).
- **Duration.** 1.5 days; ~10 person-hours.
- **Capacity assumption.** SMEs can review the draft map within 24 hours.

### Sub-phase 10 — Baseline SOP authoring

- **Purpose.** Convert the as-is process map + SME knowledge into versioned SOPs (v1.0 "as-is").
- **Business outcome.** Every activity in the scope has a step-by-step procedure with role and system of record.
- **Entry criteria.** Current-state map complete.
- **Exit criteria.** Baseline SOPs (A14) stored in SOP repository, version 1.0, linked from the Kaizen workspace.
- **Major decisions.** Level of detail; which steps deserve subordinate work instructions.
- **Major artifacts.** Baseline SOPs (A14).
- **Required roles.** Facilitator (owner), SMEs.
- **BAM scheduling.** 1 PROJECT block (180 min).
- **Duration.** 1 day; ~6 person-hours.
- **Capacity assumption.** SME sign-off within 24 hours.

### Sub-phase 11 — Baseline validation and metric lock

- **Purpose.** Walk Sponsor and Process Owner through baseline values, maps, and SOPs; capture sign-off; lock `BaselineMetric`.
- **Business outcome.** Baseline is approved; `BaselineMetric.locked === true`; phase can advance to Kaizen Event.
- **Entry criteria.** A10, A11, A12, A13, A14 complete.
- **Exit criteria.** Approved Baseline Sign-off Memo (A15); `30d_1_6_validate_baseline` CLOSED; `Kaizen.baselineMetricId` set; `BaselineMetric.locked === true`.
- **Major decisions.** Accept / correct / re-collect.
- **Major artifacts.** A15; lock event in `Kaizen`.
- **Required roles.** Facilitator (owner), Sponsor, Process Owner, SMEs.
- **BAM scheduling.** 1 COMMUNICATION block (60 min).
- **Duration.** 0.25 day; ~6 person-hours across roster.
- **Capacity assumption.** Sponsor available for sign-off call.

### Sub-phase 12 — Kaizen Event: current-state review and root cause

- **Purpose.** Align the full team on the current state; identify root causes via 5 Whys + Fishbone.
- **Business outcome.** Ranked root-cause list the team has signed off on.
- **Entry criteria.** Baseline locked; Phase 2 entered; event agenda published.
- **Exit criteria.** Shared Understanding Log (A16); Root Cause List (A17) with symptom → cause pairs ranked.
- **Major decisions.** Which causes are root (solvable) vs symptoms.
- **Major artifacts.** A16, A17; Event Agenda (A18).
- **Required roles.** Facilitator (owner), full team, Sponsor (observer).
- **BAM scheduling.** Days 8–9 of Kaizen Event week; 2 full-day events with PROJECT bucket packed.
- **Duration.** 2 days; ~32 person-hours across team.
- **Capacity assumption.** Team clears 80% of calendar for the event window.

### Sub-phase 13 — Kaizen Event: future-state design and backlog

- **Purpose.** Design the future-state flow; enumerate improvements; prioritize into backlog; draft future-state SOPs.
- **Business outcome.** Prioritized Implementation Backlog (A20) + Future-State SOPs draft (A21) + Future-State Map (A19).
- **Entry criteria.** Root causes agreed.
- **Exit criteria.** `30d_2_6_create_backlog` CLOSED; `30d_2_7_define_future_sops` CLOSED; phase can advance to Implementation.
- **Major decisions.** Which improvements are quick-win / medium / strategic; sequencing.
- **Major artifacts.** A19, A20, A21; Improvement Catalog (A22).
- **Required roles.** Facilitator (owner), full team, Process Owner (priority owner).
- **BAM scheduling.** Days 10–12; 3 full-day events.
- **Duration.** 3 days; ~48 person-hours cumulative.
- **Capacity assumption.** Team available for 3 consecutive days.

### Sub-phase 14 — Implementation planning and ownership assignment

- **Purpose.** Write every backlog item into `Kaizen.actions[]` with named owner + due date + acceptance criterion; lock execution schedule.
- **Business outcome.** Phase 3 starts with every action owned and scheduled.
- **Entry criteria.** Phase 3 entered.
- **Exit criteria.** Assigned Backlog (A23) with every item owner + due; Execution Schedule (A24) published to team calendars; `30d_3_1_assign_ownership` CLOSED.
- **Major decisions.** Owner assignments; calendar reservations; escalation path per owner.
- **Major artifacts.** A23, A24.
- **Required roles.** Facilitator (owner), Process Owner, Implementation Lead, named owners.
- **BAM scheduling.** 2 COMMUNICATION blocks (60 min + 60 min).
- **Duration.** 1 day; ~6 person-hours.
- **Capacity assumption.** Named owners can accept assignments within 24 hours.

### Sub-phase 15 — Execution and real-time SOP updates

- **Purpose.** Implement each backlog item; update SOPs as changes land; log before/after per change.
- **Business outcome.** ≥80% of actions marked `doneAt`; SOPs rolled to v2.0-draft → v2.0-final.
- **Entry criteria.** Ownership assigned.
- **Exit criteria.** Implemented Changes Log (A25); Final SOPs (A26) at v2.0.
- **Major decisions.** Go/no-go on each change; rollback if a change regresses.
- **Major artifacts.** A25, A26.
- **Required roles.** Implementation Lead (owner), named action owners, SMEs.
- **BAM scheduling.** Days 13–22; 2 PROJECT Deep blocks per owner per day as needed.
- **Duration.** 8–10 days.
- **Capacity assumption.** Owners have 4h/day capacity in their Deep blocks during implementation weeks.

### Sub-phase 16 — Blocker resolution and implementation validation

- **Purpose.** Track daily completion, surface and resolve blockers; validate that implemented changes are in production.
- **Business outcome.** Blocker log is clean; Phase 3→4 advance guard is satisfied; `30d_3_6_update_sops_realtime` CLOSED.
- **Entry criteria.** Execution underway.
- **Exit criteria.** Execution Dashboard at ≥80% complete; Cleared Constraints Log (A27); all strategic actions complete; SOPs finalized; Phase 3 gate passable.
- **Major decisions.** Which blockers need Sponsor escalation; whether to defer any strategic action (triggers a model-level risk flag).
- **Major artifacts.** A27; Execution Dashboard snapshots (A28).
- **Required roles.** Facilitator (owner), Implementation Lead, Sponsor (on escalation).
- **BAM scheduling.** Daily CI block (15 min) + on-signal COMMUNICATION blocks (60 min).
- **Duration.** Runs in parallel with sub-phase 15; ~3 days of focused Facilitator time.
- **Capacity assumption.** Sponsor reachable for 30-min escalation within 24h.

### Sub-phase 17 — Rebaseline and performance delta

- **Purpose.** Re-run the exact baseline capture method; compute performance delta vs locked baseline.
- **Business outcome.** Remeasurement row exists on `Kaizen` with same `metricDefinitionId` as baseline; Performance Delta artifact computed.
- **Entry criteria.** Phase 4 entered.
- **Exit criteria.** Post-Implementation Dataset (A29); Performance Delta (A30); `30d_4_1_rebaseline` CLOSED; `Kaizen.remeasurementId !== null`.
- **Major decisions.** Sample size sufficient; data-quality flags acceptable.
- **Major artifacts.** A29, A30.
- **Required roles.** Analyst (owner), Facilitator.
- **BAM scheduling.** Days 24–26; 2 PROJECT blocks per day.
- **Duration.** 3 days; ~12 person-hours.
- **Capacity assumption.** Capture method replicable; SMEs still available if Option B.

### Sub-phase 18 — ROI calculation and Finance sign-off

- **Purpose.** Compute implementation cost, annualized benefit, and ROI with Finance partner sign-off.
- **Business outcome.** `Kaizen.implementationCostDollars` and `Kaizen.annualBenefitsDollars` set; `Kaizen.roi` computes; Finance sign-off captured.
- **Entry criteria.** Performance Delta complete.
- **Exit criteria.** Financial Impact artifact (A31); `30d_4_3_calculate_roi` CLOSED; `roi` non-null.
- **Major decisions.** Confidence rating per benefit line (Hard / Soft / Cost-Avoidance); whether to flag negative ROI for PARTIAL close.
- **Major artifacts.** A31.
- **Required roles.** Facilitator (owner), Finance partner, Process Owner.
- **BAM scheduling.** Days 26–28; 2 PROJECT blocks + 1 COMMUNICATION block.
- **Duration.** 2 days; ~8 person-hours.
- **Capacity assumption.** Finance partner responds within 24h.

### Sub-phase 19 — Control plan, final report, Sponsor close

- **Purpose.** Finalize control plan; author final report; Sponsor signs close.
- **Business outcome.** `Kaizen.state = CLOSED` with `closeKind` set; Process Owner owns sustainment.
- **Entry criteria.** ROI signed.
- **Exit criteria.** Control Plan (A32), Executive Summary (A33), Results Memo (A34), Lessons Learned (A35); `30d_4_4_validate_results`, `30d_4_5_control_plan`, `30d_4_6_final_report` all CLOSED; `Kaizen` CLOSED.
- **Major decisions.** `closeKind` (SUCCESS / PARTIAL / FAILED_HONEST); replication recommendation.
- **Major artifacts.** A32, A33, A34, A35.
- **Required roles.** Facilitator (owner), Sponsor, Process Owner, Finance partner.
- **BAM scheduling.** Days 28–30; 2 PROJECT + 2 COMMUNICATION blocks.
- **Duration.** 3 days; ~16 person-hours across roster.
- **Capacity assumption.** Sponsor available for 60-min close session.

### Sub-phase 20 — Next-process intake recommendation

- **Purpose.** Use the lessons and the scorecard from this Accelerator to recommend the next candidate process.
- **Business outcome.** A ranked intake recommendation exists for the next Accelerator, reducing Phase 0 effort for run N+1.
- **Entry criteria.** Accelerator CLOSED.
- **Exit criteria.** Next-Process Recommendation Memo (A36) delivered to Sponsor.
- **Major decisions.** Whether to start the next Accelerator immediately, with this team, on an adjacent process.
- **Major artifacts.** A36.
- **Required roles.** Facilitator (owner), Sponsor.
- **BAM scheduling.** 1 COMMUNICATION block (60 min).
- **Duration.** 0.5 day; ~3 person-hours.
- **Capacity assumption.** Sponsor available for 30-min recommendation call.


---

## Part 3 — Complete Task Inventory

Format: one detail block per task. Parent catalog entry cited as `→ <catalogEntryId>`. Total: 72 tasks.

**Legend.** Effort minutes = single-task active work. Duration (d) = wall-clock. BAM work type: **Deep** (PROJECT bucket), **Communication** (COMMUNICATION bucket), **CI** (CI bucket). Standardization potential: H = same text every run; M = template + fill-in; L = judgment-heavy per run. AI-support: names the agent or AI mode from Part 9.

### PHASE_0 — Pre-work (Sub-phases 01–06)

---

**`acc_01_01` — Conduct Sponsor Voice-of-Leader interview** → `30d_0_1`
- **Purpose.** Capture Sponsor's top 3 pains, top 3 KPI gaps, escalation history for the target org area.
- **Operational definition.** 30-minute structured interview; notes in workspace; 3 pains + 3 gaps + ≥1 escalation example.
- **Required inputs.** Sponsor calendar slot; Voice-of-Leader template; prior quarter scorecard access.
- **Source of inputs.** External (Sponsor); Part 4 template library; Finance scorecard.
- **Activity steps.** (a) Schedule 30-min interview. (b) Open with "What process costs you the most sleep?" (c) Probe for measurable gap per pain. (d) Capture escalation examples verbatim. (e) Store notes.
- **Responsible owner.** Facilitator.
- **Supporting roles.** —.
- **Effort.** 60 min. **Duration.** 0.5d. **BAM type.** Communication.
- **Predecessors.** —. **Successors.** `acc_01_02`, `acc_01_03`.
- **Tools.** Calendar; notes app.
- **Deliverables.** Voice-of-Leader notes (fragment of A01).
- **Outputs.** 3 pains, 3 gaps, ≥1 escalation example.
- **Acceptance.** Notes file; 3 pains with measurable axis; Sponsor acknowledges.
- **Risk if skipped.** Candidate selection becomes Facilitator opinion.
- **Standardization.** M. **AI-support.** Context Agent. **Automation.** L.

---

**`acc_01_02` — Pull KPI-gap rows from prior-quarter scorecard** → `30d_0_1`
- **Purpose.** Ground candidate processes in quantitative KPI gaps.
- **Operational definition.** Extract of scorecard rows where actual < target by ≥10%, tagged by process.
- **Required inputs.** Scorecard data; metric-to-process taxonomy.
- **Source of inputs.** Finance/Ops reporting; Facilitator taxonomy.
- **Activity steps.** (a) Query scorecard. (b) Filter gap ≥10%. (c) Tag by process. (d) Attach to intake brief.
- **Responsible owner.** Analyst. **Supporting.** Facilitator.
- **Effort.** 45 min. **Duration.** 0.25d. **BAM type.** Deep.
- **Predecessors.** — (parallel with `acc_01_01`). **Successors.** `acc_01_03`.
- **Tools.** Scorecard system or BI.
- **Deliverables.** KPI Gap Extract (fragment of A01).
- **Outputs.** 5–15 ranked gap rows.
- **Acceptance.** Every row has quantified gap + process tag.
- **Risk if skipped.** Candidates picked on anecdote.
- **Standardization.** H. **AI-support.** Context Agent. **Automation.** H.

---

**`acc_01_03` — Draft and rank candidate process list** → `30d_0_1`
- **Purpose.** Produce 3–7 candidates scored on Impact × Feasibility.
- **Operational definition.** Candidate Scorecard (A02) with 3–7 rows scored 1–5 on each axis.
- **Required inputs.** Voice-of-Leader notes; KPI Gap Extract.
- **Source of inputs.** `acc_01_01`, `acc_01_02`.
- **Activity steps.** (a) List candidates. (b) Write one-line pain + measurable gap each. (c) Score. (d) Short-list 1–2.
- **Responsible owner.** Facilitator. **Supporting.** Analyst.
- **Effort.** 90 min. **Duration.** 0.5d. **BAM type.** Deep.
- **Predecessors.** `acc_01_01`, `acc_01_02`. **Successors.** `acc_01_04`.
- **Tools.** Scorecard template.
- **Deliverables.** Candidate Process Scorecard (A02).
- **Outputs.** Short-list of 1–2.
- **Acceptance.** ≥3 candidates scored; short-list explicit; tiebreak documented.
- **Risk if skipped.** Opinion-driven selection.
- **Standardization.** M. **AI-support.** Planning Agent. **Automation.** M.

---

**`acc_01_04` — Sponsor short-list review and selection** → `30d_0_1`
- **Purpose.** Sponsor picks one candidate.
- **Operational definition.** 30-min review; one candidate named; decision logged.
- **Required inputs.** A02.
- **Source of inputs.** `acc_01_03`.
- **Activity steps.** (a) Walk Sponsor through scorecard. (b) Answer questions. (c) Capture selection. (d) Log rationale for non-selection.
- **Responsible owner.** Facilitator. **Supporting.** Sponsor.
- **Effort.** 30 min. **Duration.** 0.25d. **BAM type.** Communication.
- **Predecessors.** `acc_01_03`. **Successors.** `acc_02_01`.
- **Tools.** Meeting; scorecard.
- **Deliverables.** Intake Diagnostic Brief (A01) finalized with selection.
- **Outputs.** Named candidate; rationale.
- **Acceptance.** A01 final; Sponsor reply acknowledges.
- **Risk if skipped.** Sponsor can disown project later.
- **Standardization.** M. **AI-support.** —. **Automation.** L.

---

**`acc_02_01` — Identify start and end boundary events** → `30d_0_2`
- **Purpose.** Pin first triggering event and final output event.
- **Operational definition.** Boundaries named as observable system-of-record events.
- **Required inputs.** A01; Process Owner knowledge.
- **Source of inputs.** `acc_01_04`; Process Owner.
- **Activity steps.** (a) Interview Process Owner. (b) Name triggering event in system terms. (c) Name output event. (d) SME sanity-check.
- **Responsible owner.** Facilitator. **Supporting.** Process Owner.
- **Effort.** 45 min. **Duration.** 0.25d. **BAM type.** Deep.
- **Predecessors.** `acc_01_04`. **Successors.** `acc_02_02`.
- **Tools.** Interview notes.
- **Deliverables.** Boundary Definition fragment (A03.1).
- **Outputs.** Start event; end event.
- **Acceptance.** Each boundary is observable with system + field.
- **Risk if skipped.** Scope creep in Phase 2.
- **Standardization.** M. **AI-support.** Context Agent. **Automation.** L.

---

**`acc_02_02` — Enumerate systems, roles, personas in scope** → `30d_0_2`
- **Purpose.** Name every system of record and every role/persona participating.
- **Operational definition.** Systems ≥1; roles ≥2; personas ≥1.
- **Required inputs.** A03.1; system map; org chart.
- **Source of inputs.** `acc_02_01`; IT inventory.
- **Activity steps.** (a) Walk boundary-to-boundary; list systems. (b) List role at each step. (c) Enumerate personas. (d) Note access boundaries.
- **Responsible owner.** Facilitator. **Supporting.** Process Owner, SMEs.
- **Effort.** 60 min. **Duration.** 0.25d. **BAM type.** Deep.
- **Predecessors.** `acc_02_01`. **Successors.** `acc_02_03`.
- **Tools.** System inventory; org chart.
- **Deliverables.** Systems/Roles/Personas fragment (A03.2).
- **Outputs.** Enumerated list.
- **Acceptance.** Every step has ≥1 system + 1 role.
- **Risk if skipped.** Phase 1 access requests block.
- **Standardization.** M. **AI-support.** Context Agent. **Automation.** M.

---

**`acc_02_03` — Author Scoped Process Definition and lock out-of-scope list** → `30d_0_2`
- **Purpose.** Produce A03 with 3–5 explicit out-of-scope items.
- **Operational definition.** A03 carries boundaries, systems, roles, personas, exclusions.
- **Required inputs.** A03.1, A03.2.
- **Source of inputs.** `acc_02_01`, `acc_02_02`.
- **Activity steps.** (a) Combine into A03 template. (b) Ask Process Owner what could be assumed in scope that isn't — capture 3–5. (c) Mark out-of-scope. (d) File.
- **Responsible owner.** Facilitator. **Supporting.** Process Owner.
- **Effort.** 45 min. **Duration.** 0.25d. **BAM type.** Deep.
- **Predecessors.** `acc_02_02`. **Successors.** `acc_03_01`.
- **Tools.** A03 template.
- **Deliverables.** Scoped Process Definition (A03).
- **Outputs.** Final A03.
- **Acceptance.** ≥3 out-of-scope items; Process Owner initials.
- **Risk if skipped.** No defense against scope creep.
- **Standardization.** H. **AI-support.** Composer Explainer. **Automation.** M.

---

**`acc_03_01` — Draft problem statement in Part 5 structure** → `30d_0_3`
- **Purpose.** Author statement with current state, impact (quantified), scope, baseline placeholder, target, timeframe.
- **Operational definition.** Draft (A04.draft) passes Part 5 checklist.
- **Required inputs.** A03; ticket/incident data; scorecard gap.
- **Source of inputs.** `acc_02_03`; ticket system.
- **Activity steps.** (a) Write current state. (b) Quantify impact on time/cost/defects. (c) Reference A03 scope. (d) State baseline (placeholder ok) + target. (e) State timeframe "by Day 30."
- **Responsible owner.** Facilitator. **Supporting.** Process Owner.
- **Effort.** 45 min. **Duration.** 0.25d. **BAM type.** Deep.
- **Predecessors.** `acc_02_03`. **Successors.** `acc_03_02`.
- **Tools.** Part 5 template.
- **Deliverables.** A04.draft.
- **Outputs.** Draft statement.
- **Acceptance.** Passes Part 5 checklist.
- **Risk if skipped.** Phase 4 cannot prove success.
- **Standardization.** H. **AI-support.** Composer Explainer; Planning Agent flags solution-prescribing language. **Automation.** M.

---

**`acc_03_02` — Sponsor problem-statement sign-off** → `30d_0_3`
- **Purpose.** Convert draft to approved with Sponsor acknowledgement.
- **Operational definition.** Written Sponsor approval; A04 marked final.
- **Required inputs.** A04.draft.
- **Source of inputs.** `acc_03_01`.
- **Activity steps.** (a) Send A04.draft with 3 specific questions (baseline, target realism, impact axis). (b) 20-min call or thread. (c) Edit. (d) Capture approval.
- **Responsible owner.** Facilitator. **Supporting.** Sponsor.
- **Effort.** 30 min. **Duration.** 0.25d. **BAM type.** Communication.
- **Predecessors.** `acc_03_01`. **Successors.** `acc_04_01`.
- **Tools.** Email/thread.
- **Deliverables.** Approved Problem Statement (A04).
- **Outputs.** Final A04 with approval.
- **Acceptance.** Sponsor approval captured; A04 status approved.
- **Risk if skipped.** Renegotiation mid-project.
- **Standardization.** M. **AI-support.** —. **Automation.** L.

---

**`acc_04_01` — Select primary metric and secondary metrics** → `30d_0_4`
- **Purpose.** Commit to 1 primary + 1–2 secondary.
- **Operational definition.** Metric names + units; primary flagged.
- **Required inputs.** A04; KPI taxonomy.
- **Source of inputs.** `acc_03_02`.
- **Activity steps.** (a) Propose primary. (b) Check it moves on the A04 pain. (c) Pick 1–2 secondary guardrails. (d) Write.
- **Responsible owner.** Facilitator. **Supporting.** Process Owner.
- **Effort.** 30 min. **Duration.** 0.25d. **BAM type.** Deep.
- **Predecessors.** `acc_03_02`. **Successors.** `acc_04_02`.
- **Tools.** KPI taxonomy.
- **Deliverables.** A05 metric list fragment.
- **Outputs.** Primary + 1–2 secondary.
- **Acceptance.** Primary named; units stated.
- **Risk if skipped.** Phase 1 capture misaligned.
- **Standardization.** M. **AI-support.** Context Agent. **Automation.** L.

---

**`acc_04_02` — Author operational definition, method, sampling plan per metric** → `30d_0_4`
- **Purpose.** Author Phase-4-defensible definitions.
- **Operational definition.** For each metric: definition, unit, method, sampling (n, frequency, stratification), exclusion rule, owner.
- **Required inputs.** Metric list; system access.
- **Source of inputs.** `acc_04_01`.
- **Activity steps.** (a) One-paragraph operational definition. (b) Name method. (c) Specify sample size + frequency. (d) Exclusion rule. (e) Owner.
- **Responsible owner.** Facilitator. **Supporting.** Analyst, Process Owner.
- **Effort.** 60 min. **Duration.** 0.25d. **BAM type.** Deep.
- **Predecessors.** `acc_04_01`. **Successors.** `acc_04_03`.
- **Tools.** A05 template.
- **Deliverables.** A05 definitions section.
- **Outputs.** Operational definitions per metric.
- **Acceptance.** All 6 fields per metric populated.
- **Risk if skipped.** Baseline/remeasurement not comparable.
- **Standardization.** H. **AI-support.** Planning Agent. **Automation.** M.

---

**`acc_04_03` — Finance partner acknowledges cost basis** → `30d_0_4`
- **Purpose.** Finance confirms cost basis pre-Phase 1.
- **Operational definition.** Finance signs A05 on basis (fully-loaded vs marginal).
- **Required inputs.** A05 definitions.
- **Source of inputs.** `acc_04_02`.
- **Activity steps.** (a) Share A05. (b) Ask "Is this the basis we'll use?" (c) Capture reply. (d) Amend if no.
- **Responsible owner.** Facilitator. **Supporting.** Finance partner.
- **Effort.** 30 min. **Duration.** 0.5d. **BAM type.** Communication.
- **Predecessors.** `acc_04_02`. **Successors.** `acc_05_01`.
- **Tools.** Email.
- **Deliverables.** A05 with Finance ack.
- **Outputs.** Finance ack.
- **Acceptance.** Written reply captured.
- **Risk if skipped.** Phase 4 ROI rebuilt.
- **Standardization.** M. **AI-support.** —. **Automation.** L.

---

**`acc_05_01` — Confirm Sponsor, Process Owner, Facilitator, Implementation Lead** → `30d_0_5`
- **Purpose.** Lock the four primary accountable roles.
- **Operational definition.** 4 names + emails + per-phase time commitments in A06.
- **Required inputs.** Org chart; Sponsor introductions.
- **Source of inputs.** `acc_04_03`.
- **Activity steps.** (a) Confirm Sponsor. (b) Confirm Process Owner. (c) Confirm Facilitator. (d) Confirm Implementation Lead.
- **Responsible owner.** Facilitator. **Supporting.** Sponsor.
- **Effort.** 45 min. **Duration.** 0.5d. **BAM type.** Communication.
- **Predecessors.** `acc_04_03`. **Successors.** `acc_05_02`.
- **Tools.** Email.
- **Deliverables.** A06 primary roles section.
- **Outputs.** 4 named roles with time commitments.
- **Acceptance.** Each confirmed.
- **Risk if skipped.** Unowned project.
- **Standardization.** M. **AI-support.** —. **Automation.** L.

---

**`acc_05_02` — Confirm 2–5 SMEs and Finance partner** → `30d_0_5`
- **Purpose.** Fill SME bench; lock Finance partner from `acc_04_03`.
- **Operational definition.** ≥2 SMEs confirmed; Finance partner confirmed for Phase 4.
- **Required inputs.** Process Owner nominations; Finance org.
- **Source of inputs.** `acc_05_01`; `acc_04_03`.
- **Activity steps.** (a) PO nominates SMEs. (b) Facilitator confirms. (c) Finance confirms Phase 4 window.
- **Responsible owner.** Facilitator. **Supporting.** PO, Finance.
- **Effort.** 45 min. **Duration.** 0.5d. **BAM type.** Communication.
- **Predecessors.** `acc_05_01`. **Successors.** `acc_05_03`.
- **Tools.** Email.
- **Deliverables.** A06 supporting roles.
- **Outputs.** SMEs + Finance confirmed.
- **Acceptance.** All supporting roles have confirmed availability.
- **Risk if skipped.** Phase 1 lacks SMEs; Phase 4 lacks Finance.
- **Standardization.** M. **AI-support.** —. **Automation.** L.

---

**`acc_05_03` — Publish roster with accountability and decision rights** → `30d_0_5`
- **Purpose.** Finalize and publish A06.
- **Operational definition.** A06 has every role with name, email, accountability, decision rights, per-phase commitment.
- **Required inputs.** Role confirmations.
- **Source of inputs.** `acc_05_01`, `acc_05_02`.
- **Activity steps.** (a) Consolidate. (b) Write accountability one-liner each. (c) State decision rights. (d) Publish.
- **Responsible owner.** Facilitator. **Supporting.** —.
- **Effort.** 30 min. **Duration.** 0.25d. **BAM type.** Deep.
- **Predecessors.** `acc_05_02`. **Successors.** `acc_06_01`.
- **Tools.** A06 template.
- **Deliverables.** Project Team Roster (A06).
- **Outputs.** Final A06.
- **Acceptance.** Every role populated; decision rights stated.
- **Risk if skipped.** Role ambiguity at execution.
- **Standardization.** H. **AI-support.** Composer Explainer. **Automation.** M.

---

**`acc_06_01` — Consolidate charter (scope + problem + metric + roster + timeline)** → `30d_0_6`
- **Purpose.** Produce signable charter.
- **Operational definition.** A07 carries A03 + A04 + A05 + A06 + 30-day timeline + top-3 risks.
- **Required inputs.** A03, A04, A05, A06.
- **Source of inputs.** PHASE_0 upstream.
- **Activity steps.** (a) Assemble. (b) Insert 30-day timeline. (c) Enumerate top 3 risks. (d) Add sign-off block.
- **Responsible owner.** Facilitator. **Supporting.** PO.
- **Effort.** 45 min. **Duration.** 0.25d. **BAM type.** Deep.
- **Predecessors.** `acc_05_03`. **Successors.** `acc_06_02`.
- **Tools.** Charter template.
- **Deliverables.** A07.draft.
- **Outputs.** Draft charter.
- **Acceptance.** All 5 sub-artifacts embedded.
- **Risk if skipped.** No ceremonial anchor.
- **Standardization.** H. **AI-support.** Composer Explainer. **Automation.** M.

---

**`acc_06_02` — Sponsor charter walk-through and signature** → `30d_0_6`
- **Purpose.** Sponsor signs; phase advances.
- **Operational definition.** Signature; Kaizen promoted; `phase='PHASE_1'`.
- **Required inputs.** A07.draft.
- **Source of inputs.** `acc_06_01`.
- **Activity steps.** (a) 30-min walk. (b) Address questions. (c) Capture signature. (d) `KaizenService.promote()`. (e) Advance phase.
- **Responsible owner.** Facilitator. **Supporting.** Sponsor, PO.
- **Effort.** 45 min. **Duration.** 0.5d. **BAM type.** Communication.
- **Predecessors.** `acc_06_01`. **Successors.** `acc_06_03`.
- **Tools.** Signature tool; CadencePlan.
- **Deliverables.** Signed Project Charter (A07); Kaizen row created.
- **Outputs.** `30d_0_6` CLOSED; phase = PHASE_1.
- **Acceptance.** Signature captured; Kaizen `phase='PHASE_1'`.
- **Risk if skipped.** Accelerator cannot legitimately start.
- **Standardization.** H. **AI-support.** —. **Automation.** L.

---

**`acc_06_03` — Team kickoff session** → `30d_0_6`
- **Purpose.** Align full team on scope, metric, timeline, working agreement.
- **Operational definition.** 60-min kickoff ≥80% roster; notes captured; working agreement signed.
- **Required inputs.** A07.
- **Source of inputs.** `acc_06_02`.
- **Activity steps.** (a) Schedule. (b) Walk A07. (c) Establish standup time, escalation path, decision rules. (d) Record working agreement. (e) File as A08.
- **Responsible owner.** Facilitator. **Supporting.** Full team.
- **Effort.** 60 min. **Duration.** 0.5d. **BAM type.** Communication.
- **Predecessors.** `acc_06_02`. **Successors.** `acc_07_01`.
- **Tools.** Meeting; notes template.
- **Deliverables.** Kickoff Meeting Notes (A08).
- **Outputs.** Working agreement; standup cadence.
- **Acceptance.** Notes filed; standup on calendar.
- **Risk if skipped.** Misaligned team entering Phase 1.
- **Standardization.** M. **AI-support.** —. **Automation.** L.

### PHASE_1 — Baseline (Sub-phases 07–11)

---

**`acc_07_01` — Evaluate Option A (system logs) feasibility** → `30d_1_1`
- **Purpose.** Determine whether existing system logs cover the metric at the required sample frame.
- **Operational definition.** Written feasibility note: source systems, fields, coverage (%), gaps.
- **Required inputs.** A05 operational definitions; system inventory (A03.2).
- **Source of inputs.** `acc_04_02`; `acc_02_02`.
- **Activity steps.** (a) Walk each metric through candidate sources. (b) Confirm fields exist. (c) Estimate coverage. (d) Identify gaps.
- **Responsible owner.** Analyst. **Supporting.** Facilitator, SMEs.
- **Effort.** 60 min. **Duration.** 0.25d. **BAM type.** Deep.
- **Predecessors.** `acc_06_03`. **Successors.** `acc_07_02`.
- **Tools.** System inventory; query tool.
- **Deliverables.** Option A Feasibility Note (fragment of A09).
- **Outputs.** A/B decision rationale.
- **Acceptance.** Written note; decision documented.
- **Risk if skipped.** Collection method chosen on instinct.
- **Standardization.** M. **AI-support.** Context Agent. **Automation.** M.

---

**`acc_07_02` — If Option B, prepare time-study template and observer schedule** → `30d_1_1`
- **Purpose.** Stand up direct-observation mechanics before first capture.
- **Operational definition.** Time-study template with step-level start/stop/wait/handoff fields; ≥2 observer slots scheduled.
- **Required inputs.** Current-state process hypothesis; SME calendars.
- **Source of inputs.** `acc_07_01`; SMEs.
- **Activity steps.** (a) Build template. (b) Pilot template on one run. (c) Fix ambiguities. (d) Schedule 3–5 observation slots.
- **Responsible owner.** Facilitator. **Supporting.** SMEs.
- **Effort.** 90 min. **Duration.** 0.5d. **BAM type.** Deep.
- **Predecessors.** `acc_07_01`. **Successors.** `acc_07_03`.
- **Tools.** Stopwatch + observation log template.
- **Deliverables.** Time-study template (fragment of A09); observer schedule.
- **Outputs.** Template + schedule.
- **Acceptance.** Template pilot-passed; ≥3 observation slots on calendar.
- **Risk if skipped.** Observations produce inconsistent data.
- **Standardization.** M. **AI-support.** —. **Automation.** L.

---

**`acc_07_03` — Confirm access to systems/data sources** → `30d_1_1`
- **Purpose.** Close all access gaps before data collection starts.
- **Operational definition.** Access-granted confirmation for every system in A03.2 that the Data-Capture Plan touches.
- **Required inputs.** A03.2; capture plan draft.
- **Source of inputs.** `acc_02_02`; `acc_07_01`/`acc_07_02`.
- **Activity steps.** (a) Submit access requests. (b) Track to completion. (c) Test login each system. (d) File confirmations.
- **Responsible owner.** Facilitator. **Supporting.** Process Owner, IT.
- **Effort.** 45 min. **Duration.** 1d (bureaucracy).
- **BAM type.** Communication.
- **Predecessors.** `acc_07_02` (or parallel).
- **Successors.** `acc_07_04`.
- **Tools.** IT ticket system.
- **Deliverables.** Access Confirmation Log (fragment of A09).
- **Outputs.** Confirmations.
- **Acceptance.** Every system logged-in-successfully.
- **Risk if skipped.** Collection blocked mid-Phase-1.
- **Standardization.** M. **AI-support.** —. **Automation.** L.

---

**`acc_07_04` — Lock Data-Capture Plan** → `30d_1_1`
- **Purpose.** Freeze the plan that will also be used for Phase 4 rebaseline.
- **Operational definition.** A09 signed by Facilitator + Process Owner + Analyst; locked.
- **Required inputs.** Option A/B decision, template, access.
- **Source of inputs.** `acc_07_01`, `acc_07_02`, `acc_07_03`.
- **Activity steps.** (a) Consolidate into A09. (b) Sample size locked. (c) Sign-off from 3 roles. (d) Mark locked.
- **Responsible owner.** Facilitator. **Supporting.** PO, Analyst.
- **Effort.** 30 min. **Duration.** 0.25d. **BAM type.** Deep.
- **Predecessors.** `acc_07_03`. **Successors.** `acc_08_01`.
- **Tools.** A09 template.
- **Deliverables.** Data-Capture Plan (A09).
- **Outputs.** Locked plan.
- **Acceptance.** 3 sign-offs; locked flag set.
- **Risk if skipped.** Plan drifts; Phase 4 comparison broken.
- **Standardization.** H. **AI-support.** Planning Agent (lint for metric/sample consistency). **Automation.** M.

---

**`acc_08_01` — Execute baseline data collection runs (Option A or B)** → `30d_1_1`
- **Purpose.** Capture n ≥ plan baseline observations.
- **Operational definition.** Dataset exists with n samples and required fields populated.
- **Required inputs.** A09; access.
- **Source of inputs.** `acc_07_04`.
- **Activity steps.** (a) Execute per A09. (b) Log each observation. (c) Annotate anomalies. (d) Store.
- **Responsible owner.** Analyst. **Supporting.** SMEs (if B).
- **Effort.** 180–480 min across runs (process-dependent).
- **Duration.** 2–4d.
- **BAM type.** Deep.
- **Predecessors.** `acc_07_04`. **Successors.** `acc_08_02`.
- **Tools.** Query tool or stopwatch + observation log.
- **Deliverables.** Raw Baseline Dataset (A10, partial).
- **Outputs.** Observations.
- **Acceptance.** n ≥ plan; fields populated; anomalies logged.
- **Risk if skipped.** No baseline; project cannot proceed.
- **Standardization.** M. **AI-support.** Context Agent (pre-fills known sources). **Automation.** M for Option A; L for Option B.

---

**`acc_08_02` — Data-quality check and flag exclusions** → `30d_1_1`
- **Purpose.** Apply A05 exclusion rules; flag data-quality issues; do not discard.
- **Operational definition.** Exclusion log; data-quality flag count.
- **Required inputs.** A10 partial; A05 exclusion rule.
- **Source of inputs.** `acc_08_01`; `acc_04_02`.
- **Activity steps.** (a) Apply exclusion rule. (b) Flag ambiguous cases. (c) Annotate — do not discard. (d) Store clean + raw sets.
- **Responsible owner.** Analyst. **Supporting.** Facilitator.
- **Effort.** 60 min. **Duration.** 0.25d. **BAM type.** Deep.
- **Predecessors.** `acc_08_01`. **Successors.** `acc_08_03`.
- **Tools.** Spreadsheet / notebook.
- **Deliverables.** Cleaned Dataset + Exclusion Log (A10 final).
- **Outputs.** Both sets.
- **Acceptance.** Every excluded row has annotation.
- **Risk if skipped.** Remeasurement cannot replicate exclusions.
- **Standardization.** H. **AI-support.** Planning Agent (diff exclusions across runs). **Automation.** M.

---

**`acc_08_03` — Compute baseline summary statistics** → `30d_1_3`
- **Purpose.** Produce n, mean, median, stdev, min, max, quartiles, and process sigma (if applicable) for the baseline dataset.
- **Operational definition.** Summary stats document with per-metric values.
- **Required inputs.** A10 final.
- **Source of inputs.** `acc_08_02`.
- **Activity steps.** (a) Load dataset. (b) Compute stats per metric. (c) Check for normality if relevant. (d) Write Baseline Stats fragment.
- **Responsible owner.** Analyst. **Supporting.** Facilitator.
- **Effort.** 60 min. **Duration.** 0.25d. **BAM type.** Deep.
- **Predecessors.** `acc_08_02`. **Successors.** `acc_09_01`, `acc_10_01`.
- **Tools.** Spreadsheet / notebook.
- **Deliverables.** Baseline Stats (fragment of A12).
- **Outputs.** Summary stats.
- **Acceptance.** Stats computed for every metric in A05.
- **Risk if skipped.** No ground truth for Phase 4 comparison.
- **Standardization.** H. **AI-support.** —. **Automation.** H.

---

**`acc_09_01` — Build current-state process map** → `30d_1_2`
- **Purpose.** Convert dataset + SME knowledge into visual map (BPMN/swimlane/flowchart).
- **Operational definition.** A11 rendered; every step from A10 represented; handoffs marked.
- **Required inputs.** A10; SME review.
- **Source of inputs.** `acc_08_02`; SMEs.
- **Activity steps.** (a) Identify steps. (b) Sequence. (c) Mark handoffs + system transitions. (d) Render.
- **Responsible owner.** Facilitator. **Supporting.** SMEs.
- **Effort.** 180 min. **Duration.** 0.5d. **BAM type.** Deep.
- **Predecessors.** `acc_08_02`. **Successors.** `acc_09_02`, `acc_09_03`.
- **Tools.** Diagram tool (Lucidchart/Miro/equivalent).
- **Deliverables.** Current-State Process Map (A11).
- **Outputs.** Visual map.
- **Acceptance.** SMEs confirm map is accurate.
- **Risk if skipped.** Team lacks shared picture.
- **Standardization.** M. **AI-support.** Composer Explainer (drafts swimlane from dataset). **Automation.** L.

---

**`acc_09_02` — Compute activity-level metrics per step** → `30d_1_3`
- **Purpose.** For each step on A11, compute cycle time / wait / touch time with n.
- **Operational definition.** A12 table with per-step metrics + n.
- **Required inputs.** A10; A11.
- **Source of inputs.** `acc_08_03`; `acc_09_01`.
- **Activity steps.** (a) For each step, extract durations. (b) Compute cycle/wait/touch. (c) Note n. (d) Write A12 row.
- **Responsible owner.** Analyst. **Supporting.** Facilitator.
- **Effort.** 120 min. **Duration.** 0.5d. **BAM type.** Deep.
- **Predecessors.** `acc_09_01`, `acc_08_03`. **Successors.** `acc_09_03`.
- **Tools.** Spreadsheet.
- **Deliverables.** Activity Breakdown Table (A12).
- **Outputs.** Per-step metrics.
- **Acceptance.** Every step has all metric columns populated; n noted.
- **Risk if skipped.** Waste analysis is opinion.
- **Standardization.** H. **AI-support.** —. **Automation.** H.

---

**`acc_09_03` — TIMWOODS waste scan** → `30d_1_4`
- **Purpose.** Scan for Transport, Inventory, Motion, Waiting, Overproduction, Overprocessing, Defects, Skills-underutilization.
- **Operational definition.** A13 has one row per observation with waste category + step reference + frequency/magnitude rank.
- **Required inputs.** A11, A12.
- **Source of inputs.** `acc_09_01`, `acc_09_02`.
- **Activity steps.** (a) Per category, scan process. (b) Record observation with step ref. (c) Rank. (d) File.
- **Responsible owner.** Facilitator. **Supporting.** SMEs.
- **Effort.** 120 min. **Duration.** 0.5d. **BAM type.** Deep.
- **Predecessors.** `acc_09_02`. **Successors.** `acc_11_01`.
- **Tools.** Waste scan template.
- **Deliverables.** Waste Analysis (A13).
- **Outputs.** Ranked waste list.
- **Acceptance.** All 8 categories scanned; ≥3 observations logged.
- **Risk if skipped.** Team skips to solutions without evidence.
- **Standardization.** M. **AI-support.** Reflection Agent (surface prior patterns). **Automation.** L.

---

**`acc_10_01` — Draft baseline SOPs v1.0** → `30d_1_5`
- **Purpose.** Convert A11 activities into step-by-step procedures.
- **Operational definition.** A14 document set; every activity in A11 has a v1.0 SOP with role + system of record.
- **Required inputs.** A11; A12; SME input.
- **Source of inputs.** `acc_09_01`, `acc_09_02`; SMEs.
- **Activity steps.** (a) Per activity, draft steps. (b) Note role. (c) Note system. (d) Version 1.0.
- **Responsible owner.** Facilitator. **Supporting.** SMEs.
- **Effort.** 180 min. **Duration.** 1d. **BAM type.** Deep.
- **Predecessors.** `acc_09_01`. **Successors.** `acc_10_02`.
- **Tools.** SOP repo (Quip/Docs/Confluence).
- **Deliverables.** Baseline SOPs draft (A14.draft).
- **Outputs.** Draft SOP set.
- **Acceptance.** Every activity has a v1.0 SOP.
- **Risk if skipped.** No as-is documentation; Phase 3 diff impossible.
- **Standardization.** M. **AI-support.** Composer Explainer (drafts from A11+A12). **Automation.** M.

---

**`acc_10_02` — SME review and baseline SOP finalization** → `30d_1_5`
- **Purpose.** SMEs correct SOPs; Facilitator commits v1.0 final.
- **Operational definition.** SMEs acknowledge; v1.0 final in repo.
- **Required inputs.** A14.draft.
- **Source of inputs.** `acc_10_01`.
- **Activity steps.** (a) Share draft with SMEs. (b) Capture corrections. (c) Apply. (d) Commit v1.0.
- **Responsible owner.** Facilitator. **Supporting.** SMEs.
- **Effort.** 90 min. **Duration.** 0.5d. **BAM type.** Communication.
- **Predecessors.** `acc_10_01`. **Successors.** `acc_11_01`.
- **Tools.** SOP repo; comments.
- **Deliverables.** Baseline SOPs (A14, v1.0).
- **Outputs.** Final v1.0 SOPs.
- **Acceptance.** All SMEs acknowledge; version tagged.
- **Risk if skipped.** SOPs wrong; future diff comparison broken.
- **Standardization.** M. **AI-support.** —. **Automation.** L.

---

**`acc_11_01` — Baseline validation meeting (Sponsor + PO walkthrough)** → `30d_1_6`
- **Purpose.** Walk Sponsor + PO through baseline metrics, map, SOPs.
- **Operational definition.** 60-min meeting; stakeholders acknowledge each artifact.
- **Required inputs.** A10 (stats), A11, A12, A13, A14.
- **Source of inputs.** PHASE_1 upstream.
- **Activity steps.** (a) Schedule. (b) Walk each artifact. (c) Capture corrections. (d) Log decisions.
- **Responsible owner.** Facilitator. **Supporting.** Sponsor, PO, SMEs.
- **Effort.** 60 min. **Duration.** 0.25d. **BAM type.** Communication.
- **Predecessors.** `acc_09_03`, `acc_10_02`. **Successors.** `acc_11_02`.
- **Tools.** Meeting.
- **Deliverables.** Baseline Sign-off fragment (A15.draft).
- **Outputs.** Stakeholder acknowledgements.
- **Acceptance.** Sponsor + PO + SMEs sign.
- **Risk if skipped.** Team advances on unchecked baseline.
- **Standardization.** M. **AI-support.** —. **Automation.** L.

---

**`acc_11_02` — Lock BaselineMetric and advance phase** → `30d_1_6`
- **Purpose.** Call `KaizenService.lockBaseline()`; advance to PHASE_2.
- **Operational definition.** `BaselineMetric.locked === true`; `30d_1_6` CLOSED; phase = PHASE_2.
- **Required inputs.** Sign-offs from `acc_11_01`.
- **Source of inputs.** `acc_11_01`.
- **Activity steps.** (a) Capture sign-offs in A15. (b) Lock BaselineMetric. (c) Advance phase.
- **Responsible owner.** Facilitator. **Supporting.** —.
- **Effort.** 15 min. **Duration.** 0.25d. **BAM type.** Deep.
- **Predecessors.** `acc_11_01`. **Successors.** `acc_12_01`.
- **Tools.** CadencePlan.
- **Deliverables.** Approved Baseline Sign-off (A15); phase advance event.
- **Outputs.** `BaselineMetric.locked`; phase = PHASE_2.
- **Acceptance.** Lock flag set; advance event emitted.
- **Risk if skipped.** Phase 2 work is unprotected.
- **Standardization.** H. **AI-support.** —. **Automation.** M.

### PHASE_2 — Kaizen Event (Sub-phases 12–13)

---

**`acc_12_01` — Prepare Kaizen Event agenda and logistics** → `30d_2_1`
- **Purpose.** Lock event window, pre-read, session agenda.
- **Operational definition.** A18 agenda with 3–5 days × half-day sessions; pre-read sent ≥48h prior; calendar holds.
- **Required inputs.** A15 baseline packet; roster.
- **Source of inputs.** `acc_11_02`; A06.
- **Activity steps.** (a) Pick window. (b) Calendar holds. (c) Build agenda. (d) Send pre-read.
- **Responsible owner.** Facilitator. **Supporting.** PO.
- **Effort.** 60 min. **Duration.** 0.5d. **BAM type.** Communication.
- **Predecessors.** `acc_11_02`. **Successors.** `acc_12_02`.
- **Tools.** Calendar; agenda template.
- **Deliverables.** Event Agenda (A18); pre-read package.
- **Outputs.** Locked event window.
- **Acceptance.** ≥80% roster confirmed; pre-read opened.
- **Risk if skipped.** Event runs off-rail.
- **Standardization.** H. **AI-support.** Composer Explainer. **Automation.** M.

---

**`acc_12_02` — Current-state review session with full team** → `30d_2_2`
- **Purpose.** Align team on current state; capture questions/disagreements.
- **Operational definition.** A16 shared-understanding log with ≥5 entries.
- **Required inputs.** A11, A12, A13, A14; agenda.
- **Source of inputs.** PHASE_1 + `acc_12_01`.
- **Activity steps.** (a) Walk current state. (b) Capture questions. (c) Resolve or park. (d) Log.
- **Responsible owner.** Facilitator. **Supporting.** Full team.
- **Effort.** 120 min. **Duration.** 0.5d. **BAM type.** Deep (event bucket).
- **Predecessors.** `acc_12_01`. **Successors.** `acc_12_03`.
- **Tools.** Meeting + whiteboard.
- **Deliverables.** Shared Understanding Log (A16).
- **Outputs.** Aligned team.
- **Acceptance.** ≥5 log entries; parked items recorded.
- **Risk if skipped.** Team solves wrong problem.
- **Standardization.** M. **AI-support.** Reflection Agent (capture patterns). **Automation.** L.

---

**`acc_12_03` — Run 5 Whys on top waste observations** → `30d_2_3`
- **Purpose.** Walk chains from symptom to candidate root cause.
- **Operational definition.** ≥3 5-Why chains documented.
- **Required inputs.** A13 waste analysis.
- **Source of inputs.** `acc_09_03`.
- **Activity steps.** (a) Pick top waste items. (b) Apply 5 Whys each. (c) Capture candidate root causes.
- **Responsible owner.** Facilitator. **Supporting.** Full team.
- **Effort.** 90 min. **Duration.** 0.25d. **BAM type.** Deep.
- **Predecessors.** `acc_12_02`. **Successors.** `acc_12_04`.
- **Tools.** Whiteboard.
- **Deliverables.** 5 Whys output (fragment of A17).
- **Outputs.** Candidate causes.
- **Acceptance.** ≥3 chains with 5 levels.
- **Risk if skipped.** Jumps to solutions.
- **Standardization.** H. **AI-support.** Planning Agent (flags premature termination). **Automation.** L.

---

**`acc_12_04` — Fishbone (6M) diagram for top issue** → `30d_2_3`
- **Purpose.** Structured cause enumeration on top issue.
- **Operational definition.** Fishbone across Methods/Machines/Materials/Measurement/Mother Nature/Man with ≥3 causes per branch relevant.
- **Required inputs.** Top issue from `acc_12_03`.
- **Source of inputs.** `acc_12_03`.
- **Activity steps.** (a) Pick top issue. (b) Brainstorm per 6M. (c) Cluster. (d) Rank.
- **Responsible owner.** Facilitator. **Supporting.** Full team.
- **Effort.** 90 min. **Duration.** 0.25d. **BAM type.** Deep.
- **Predecessors.** `acc_12_03`. **Successors.** `acc_12_05`.
- **Tools.** Whiteboard.
- **Deliverables.** Fishbone (fragment of A17).
- **Outputs.** Ranked causes.
- **Acceptance.** All 6M branches addressed.
- **Risk if skipped.** Narrow root-cause lens.
- **Standardization.** H. **AI-support.** —. **Automation.** L.

---

**`acc_12_05` — Consolidate and rank root cause list** → `30d_2_3`
- **Purpose.** Merge 5 Whys + Fishbone into ranked A17.
- **Operational definition.** A17 with symptom ↔ root cause pairs; ranked; team endorses top 3.
- **Required inputs.** 5 Whys; Fishbone.
- **Source of inputs.** `acc_12_03`, `acc_12_04`.
- **Activity steps.** (a) Merge. (b) Remove duplicates. (c) Rank by impact + solvability. (d) Team endorses top 3.
- **Responsible owner.** Facilitator. **Supporting.** Team.
- **Effort.** 60 min. **Duration.** 0.25d. **BAM type.** Deep.
- **Predecessors.** `acc_12_04`. **Successors.** `acc_13_01`.
- **Tools.** Whiteboard.
- **Deliverables.** Root Cause List (A17).
- **Outputs.** Ranked list.
- **Acceptance.** Top 3 agreed.
- **Risk if skipped.** Team doesn't know what to solve.
- **Standardization.** H. **AI-support.** Planning Agent. **Automation.** L.

---

**`acc_13_01` — Design future-state process map** → `30d_2_4`
- **Purpose.** Draft A19 future-state process removing waste, handoffs.
- **Operational definition.** A19 side-by-side with A11; annotated deltas.
- **Required inputs.** A11, A13, A17.
- **Source of inputs.** `acc_09_01`, `acc_09_03`, `acc_12_05`.
- **Activity steps.** (a) Remove waste steps. (b) Reduce handoffs. (c) Simplify. (d) Render. (e) Side-by-side.
- **Responsible owner.** Facilitator. **Supporting.** Full team.
- **Effort.** 180 min. **Duration.** 0.5d. **BAM type.** Deep.
- **Predecessors.** `acc_12_05`. **Successors.** `acc_13_02`, `acc_13_03`, `acc_13_05`.
- **Tools.** Diagram tool.
- **Deliverables.** Future-State Process Map (A19).
- **Outputs.** A19 + delta list.
- **Acceptance.** Every delta traces to a root cause from A17.
- **Risk if skipped.** Improvements without design.
- **Standardization.** M. **AI-support.** Composer Explainer. **Automation.** L.

---

**`acc_13_02` — Enumerate improvements and categorize** → `30d_2_5`
- **Purpose.** List every change implied by A19; categorize quick / medium / strategic.
- **Operational definition.** Improvement Catalog (A22) with name + category + estimated effort.
- **Required inputs.** A19; A17.
- **Source of inputs.** `acc_13_01`; `acc_12_05`.
- **Activity steps.** (a) Enumerate. (b) Categorize (<1wk / 1–2wk / >2wk). (c) Flag Sponsor decisions. (d) Note expected impact.
- **Responsible owner.** Facilitator. **Supporting.** Team.
- **Effort.** 120 min. **Duration.** 0.5d. **BAM type.** Deep.
- **Predecessors.** `acc_13_01`. **Successors.** `acc_13_03`.
- **Tools.** Spreadsheet.
- **Deliverables.** Improvement Catalog (A22).
- **Outputs.** Categorized improvements.
- **Acceptance.** Every improvement categorized + impact noted.
- **Risk if skipped.** No basis for prioritization.
- **Standardization.** M. **AI-support.** Planning Agent. **Automation.** M.

---

**`acc_13_03` — Prioritize and create implementation backlog** → `30d_2_6`
- **Purpose.** Score (impact × confidence ÷ effort); structure epics/stories/tasks.
- **Operational definition.** A20 prioritized backlog with epic → story → task hierarchy + priority score.
- **Required inputs.** A22.
- **Source of inputs.** `acc_13_02`.
- **Activity steps.** (a) Group into epics. (b) Break into stories/tasks. (c) Score priority. (d) Publish.
- **Responsible owner.** Facilitator. **Supporting.** PO.
- **Effort.** 120 min. **Duration.** 0.5d. **BAM type.** Deep.
- **Predecessors.** `acc_13_02`. **Successors.** `acc_13_04`.
- **Tools.** Backlog tool.
- **Deliverables.** Prioritized Backlog (A20).
- **Outputs.** Final A20.
- **Acceptance.** Hierarchy complete; every item scored.
- **Risk if skipped.** Team works on wrong items first.
- **Standardization.** M. **AI-support.** Planning Agent. **Automation.** M.

---

**`acc_13_04` — Draft control-plan monitoring metrics (early)** → `30d_2_5`
- **Purpose.** Per Part 1.6 refinement, start control plan in Phase 2.
- **Operational definition.** Control-plan draft (fragment of A32) names monitoring metric, frequency, threshold for each strategic improvement.
- **Required inputs.** A20 strategic items.
- **Source of inputs.** `acc_13_03`.
- **Activity steps.** (a) For each strategic item, name monitoring metric. (b) Frequency. (c) Threshold. (d) Response.
- **Responsible owner.** Facilitator. **Supporting.** PO.
- **Effort.** 60 min. **Duration.** 0.25d. **BAM type.** Deep.
- **Predecessors.** `acc_13_03`. **Successors.** `acc_19_01`.
- **Tools.** Control plan template.
- **Deliverables.** Control Plan draft (fragment of A32).
- **Outputs.** Early monitoring design.
- **Acceptance.** Every strategic item has all 4 fields.
- **Risk if skipped.** Control plan authored at Day 29 with no test time.
- **Standardization.** H. **AI-support.** Composer Explainer. **Automation.** M.

---

**`acc_13_05` — Draft future-state SOPs v2.0-draft** → `30d_2_7`
- **Purpose.** Convert A14 v1.0 + A19 into v2.0-draft "to-be" SOPs.
- **Operational definition.** A21 draft SOPs; diff against A14 recorded.
- **Required inputs.** A14, A19, A22.
- **Source of inputs.** `acc_10_02`, `acc_13_01`, `acc_13_02`.
- **Activity steps.** (a) Copy A14 v1.0. (b) Apply A19 changes. (c) Reassign role per step. (d) Mark v2.0-draft.
- **Responsible owner.** Facilitator. **Supporting.** SMEs.
- **Effort.** 180 min. **Duration.** 1d. **BAM type.** Deep.
- **Predecessors.** `acc_13_01`. **Successors.** `acc_14_01`.
- **Tools.** SOP repo.
- **Deliverables.** Future-State SOPs draft (A21).
- **Outputs.** v2.0-draft.
- **Acceptance.** Every A14 SOP has a v2.0-draft counterpart.
- **Risk if skipped.** Phase 3 implements on a napkin.
- **Standardization.** M. **AI-support.** Composer Explainer. **Automation.** M.

---

**`acc_13_06` — Advance to PHASE_3** → `30d_2_6` + `30d_2_7`
- **Purpose.** Phase-gate check + advance.
- **Operational definition.** `30d_2_6` + `30d_2_7` CLOSED; phase = PHASE_3; backlog → `Kaizen.actions[]`.
- **Required inputs.** A20, A21.
- **Source of inputs.** `acc_13_03`, `acc_13_05`.
- **Activity steps.** (a) Verify both CLOSED. (b) Populate `Kaizen.actions[]`. (c) Advance phase.
- **Responsible owner.** Facilitator. **Supporting.** —.
- **Effort.** 15 min. **Duration.** 0.25d. **BAM type.** Deep.
- **Predecessors.** `acc_13_03`, `acc_13_05`. **Successors.** `acc_14_01`.
- **Tools.** CadencePlan.
- **Deliverables.** Phase advance event.
- **Outputs.** phase = PHASE_3.
- **Acceptance.** Guard passes; advance event emitted.
- **Risk if skipped.** —.
- **Standardization.** H. **AI-support.** —. **Automation.** H.

### PHASE_3 — Implementation (Sub-phases 14–16)

---

**`acc_14_01` — Assign owner + due date per backlog item** → `30d_3_1`
- **Purpose.** Every item in A20 gets a named owner + due date.
- **Operational definition.** A23 with 100% coverage; `Kaizen.actions[]` populated.
- **Required inputs.** A20; A06 roster.
- **Source of inputs.** `acc_13_03`, `acc_05_03`.
- **Activity steps.** (a) Per item, assign owner. (b) Due date. (c) Confirm acceptance. (d) Write to `Kaizen.actions[]`.
- **Responsible owner.** Facilitator. **Supporting.** PO, Implementation Lead.
- **Effort.** 60 min. **Duration.** 0.5d. **BAM type.** Communication.
- **Predecessors.** `acc_13_06`. **Successors.** `acc_14_02`.
- **Tools.** A20 + Kaizen entity.
- **Deliverables.** Assigned Backlog (A23).
- **Outputs.** Ownership map.
- **Acceptance.** Every item has owner + due; owners accepted.
- **Risk if skipped.** Improvement theater.
- **Standardization.** H. **AI-support.** Planning Agent (flags over-assigned owners). **Automation.** M.

---

**`acc_14_02` — Author acceptance criterion per action** → `30d_3_1`
- **Purpose.** Observable "done" per item so `doneAt` is falsifiable.
- **Operational definition.** Every A23 item has a one-line acceptance criterion ("Feature X deployed to production and used for Y transactions").
- **Required inputs.** A23 items.
- **Source of inputs.** `acc_14_01`.
- **Activity steps.** (a) Per item, write acceptance criterion. (b) Check observability. (c) Add to entity.
- **Responsible owner.** Facilitator. **Supporting.** Action owners.
- **Effort.** 45 min. **Duration.** 0.25d. **BAM type.** Deep.
- **Predecessors.** `acc_14_01`. **Successors.** `acc_14_03`.
- **Tools.** A23.
- **Deliverables.** A23 with criteria.
- **Outputs.** Criteria.
- **Acceptance.** Each criterion is observable.
- **Risk if skipped.** "Done" becomes opinion.
- **Standardization.** H. **AI-support.** Planning Agent (lint vague criteria). **Automation.** M.

---

**`acc_14_03` — Reserve execution blocks on owner calendars** → `30d_3_2`
- **Purpose.** Deep blocks reserved across Days 13–23 per owner.
- **Operational definition.** A24 execution schedule with blocks on each owner's calendar.
- **Required inputs.** A23; owner calendars.
- **Source of inputs.** `acc_14_02`; CadencePlan composer.
- **Activity steps.** (a) Compute per-owner capacity. (b) Reserve blocks. (c) Confirm coverage.
- **Responsible owner.** Facilitator. **Supporting.** Owners.
- **Effort.** 60 min. **Duration.** 0.25d. **BAM type.** Communication.
- **Predecessors.** `acc_14_02`. **Successors.** `acc_15_01`.
- **Tools.** Calendar + composer.
- **Deliverables.** Execution Schedule (A24).
- **Outputs.** Reserved blocks.
- **Acceptance.** All items fit within reserved capacity.
- **Risk if skipped.** Execution crushed by other meetings.
- **Standardization.** M. **AI-support.** Composer Explainer. **Automation.** H.

---

**`acc_15_01` — Execute improvements (per-item, repeat)** → `30d_3_3`
- **Purpose.** Implement each backlog item per acceptance criterion.
- **Operational definition.** `doneAt` set on action when criterion met + before/after log entry made.
- **Required inputs.** A23; A24; A21 future SOPs; system access.
- **Source of inputs.** `acc_14_01`, `acc_14_03`, `acc_13_05`.
- **Activity steps.** (a) Open Deep block. (b) Execute per SOP. (c) Verify acceptance. (d) Log before/after in A25. (e) Mark action `doneAt`.
- **Responsible owner.** Action owner. **Supporting.** SMEs, Implementation Lead.
- **Effort.** 60–480 min per item.
- **Duration.** Days 13–22.
- **BAM type.** Deep.
- **Predecessors.** `acc_14_03`. **Successors.** `acc_15_02`, `acc_16_01`.
- **Tools.** Systems of record.
- **Deliverables.** Implemented Changes Log rows (A25).
- **Outputs.** Changed behavior; `doneAt` set.
- **Acceptance.** Acceptance criterion met; log entry filed.
- **Risk if skipped.** Backlog not shipped.
- **Standardization.** L. **AI-support.** Momentum Agent (coaching on next step). **Automation.** L.

---

**`acc_15_02` — Update SOPs as changes land** → `30d_3_6`
- **Purpose.** Keep A26 current; bump versions as improvements ship.
- **Operational definition.** Every A25 entry has a matching SOP bump in A26.
- **Required inputs.** A21, A25.
- **Source of inputs.** `acc_13_05`, `acc_15_01`.
- **Activity steps.** (a) Per change, open SOP. (b) Apply change. (c) Bump version. (d) Commit.
- **Responsible owner.** SME. **Supporting.** Facilitator.
- **Effort.** 30 min per update.
- **Duration.** Days 13–23.
- **BAM type.** CI.
- **Predecessors.** `acc_15_01`. **Successors.** `acc_16_03`.
- **Tools.** SOP repo.
- **Deliverables.** Final SOPs (A26).
- **Outputs.** Versioned SOPs.
- **Acceptance.** A25-A26 1:1.
- **Risk if skipped.** SOP drift.
- **Standardization.** M. **AI-support.** Composer Explainer (auto-draft SOP deltas). **Automation.** M.

---

**`acc_16_01` — Daily execution progress check** → `30d_3_4`
- **Purpose.** Daily completion rate + blocker surface.
- **Operational definition.** A28 dashboard snapshot per day in Phase 3; completion %, blocker count.
- **Required inputs.** A23, A25.
- **Source of inputs.** `acc_15_01`.
- **Activity steps.** (a) Check completion rate. (b) List open blockers. (c) Update dashboard. (d) Post summary to team.
- **Responsible owner.** Facilitator. **Supporting.** Implementation Lead.
- **Effort.** 15 min. **Duration.** daily.
- **BAM type.** CI.
- **Predecessors.** —. **Successors.** `acc_16_02` (on signal).
- **Tools.** Dashboard.
- **Deliverables.** Execution Dashboard Snapshot (A28).
- **Outputs.** Daily snapshot.
- **Acceptance.** Snapshot exists each workday.
- **Risk if skipped.** Drift invisible.
- **Standardization.** H. **AI-support.** Momentum Agent. **Automation.** H.

---

**`acc_16_02` — Blocker triage and resolution** → `30d_3_5`
- **Purpose.** Turn each flagged blocker into action: decide / access / scope / capacity.
- **Operational definition.** Every blocker logged with triage category + resolution action + owner; resolved or escalated within 24h.
- **Required inputs.** Blocker from `acc_16_01`.
- **Source of inputs.** `acc_16_01`.
- **Activity steps.** (a) Triage. (b) Decide path. (c) Escalate to Sponsor if decision-class. (d) Document.
- **Responsible owner.** Facilitator. **Supporting.** Sponsor on escalation.
- **Effort.** 30–60 min.
- **Duration.** On-signal.
- **BAM type.** Communication.
- **Predecessors.** `acc_16_01`. **Successors.** `acc_15_01` (unblock).
- **Tools.** Blocker log.
- **Deliverables.** Cleared Constraints Log (A27).
- **Outputs.** Resolutions.
- **Acceptance.** 100% blockers have resolution or escalation within 24h.
- **Risk if skipped.** Execution stalls.
- **Standardization.** M. **AI-support.** Planning Agent (flags recurring blocker patterns). **Automation.** L.

---

**`acc_16_03` — Weighted completion check and Phase 3→4 advance** → `30d_3_6`
- **Purpose.** Verify ≥80% action count AND zero open strategic actions; advance phase.
- **Operational definition.** `Kaizen.actions` ≥80% doneAt AND no strategic item open AND `30d_3_6` CLOSED.
- **Required inputs.** A23, A25, A26.
- **Source of inputs.** PHASE_3 upstream.
- **Activity steps.** (a) Compute completion ratio. (b) Check strategic items. (c) Advance phase.
- **Responsible owner.** Facilitator. **Supporting.** PO.
- **Effort.** 30 min. **Duration.** 0.25d. **BAM type.** Deep.
- **Predecessors.** `acc_15_02`, `acc_16_01`. **Successors.** `acc_17_01`.
- **Tools.** CadencePlan.
- **Deliverables.** Phase advance event.
- **Outputs.** phase = PHASE_4.
- **Acceptance.** Guard passes including the Part 1.6 strategic-item rule.
- **Risk if skipped.** Phase 4 starts on incomplete implementation.
- **Standardization.** H. **AI-support.** —. **Automation.** H.

### PHASE_4 — Validation + ROI (Sub-phases 17–20)

---

**`acc_17_01` — Re-execute data collection identically to baseline** → `30d_4_1`
- **Purpose.** Reproduce A09 method exactly; capture post-implementation dataset.
- **Operational definition.** Post-implementation dataset (A29) with n = A09 plan; same method, same sample frame, same exclusion rule.
- **Required inputs.** A09; access; A10 comparison.
- **Source of inputs.** `acc_07_04`, `acc_08_02`.
- **Activity steps.** (a) Re-run extracts or observations per A09. (b) Apply exclusions. (c) Annotate any definition changes (flag if any). (d) Store.
- **Responsible owner.** Analyst. **Supporting.** SMEs, Facilitator.
- **Effort.** 180–480 min across runs.
- **Duration.** 2–3 days.
- **BAM type.** Deep.
- **Predecessors.** `acc_16_03`. **Successors.** `acc_17_02`.
- **Tools.** Per A09.
- **Deliverables.** Post-Implementation Dataset (A29).
- **Outputs.** Dataset.
- **Acceptance.** Method matches A09; n matches; exclusions identical.
- **Risk if skipped.** No remeasurement.
- **Standardization.** H. **AI-support.** Planning Agent (lint method drift). **Automation.** M.

---

**`acc_17_02` — Compute post-implementation summary statistics** → `30d_4_1`
- **Purpose.** Same stats as `acc_08_03` on A29.
- **Operational definition.** Summary stats doc per metric.
- **Required inputs.** A29.
- **Source of inputs.** `acc_17_01`.
- **Activity steps.** (a) Load dataset. (b) Compute stats. (c) Sanity check.
- **Responsible owner.** Analyst. **Supporting.** Facilitator.
- **Effort.** 60 min. **Duration.** 0.25d. **BAM type.** Deep.
- **Predecessors.** `acc_17_01`. **Successors.** `acc_17_03`.
- **Tools.** Spreadsheet / notebook.
- **Deliverables.** Post-Implementation Stats (fragment of A30).
- **Outputs.** Stats.
- **Acceptance.** All metrics computed.
- **Risk if skipped.** No basis for delta.
- **Standardization.** H. **AI-support.** —. **Automation.** H.

---

**`acc_17_03` — Build performance delta (baseline vs post)** → `30d_4_2`
- **Purpose.** Compute absolute + % deltas per metric.
- **Operational definition.** A30 table: metric | baseline | post | absolute Δ | %Δ | confidence flag.
- **Required inputs.** A12 baseline stats, `acc_17_02` post stats.
- **Source of inputs.** `acc_08_03`, `acc_17_02`.
- **Activity steps.** (a) Pair metrics. (b) Compute deltas. (c) Flag significance. (d) Write A30.
- **Responsible owner.** Analyst. **Supporting.** Facilitator.
- **Effort.** 90 min. **Duration.** 0.25d. **BAM type.** Deep.
- **Predecessors.** `acc_17_02`. **Successors.** `acc_17_04`.
- **Tools.** Spreadsheet.
- **Deliverables.** Performance Delta (A30).
- **Outputs.** Delta table.
- **Acceptance.** Every baseline metric has paired post value.
- **Risk if skipped.** No objective improvement claim.
- **Standardization.** H. **AI-support.** —. **Automation.** H.

---

**`acc_17_04` — Create Remeasurement row and satisfy metric definition match** → `30d_4_1`
- **Purpose.** Bind A29 as the `Remeasurement` on Kaizen.
- **Operational definition.** `Kaizen.remeasurementId` set; `remeasurement.metricDefinitionId === baseline.metricDefinitionId`.
- **Required inputs.** A29; locked baseline.
- **Source of inputs.** `acc_17_01`; `acc_11_02`.
- **Activity steps.** (a) Create Remeasurement. (b) Bind to Kaizen. (c) Verify metricDefinitionId match.
- **Responsible owner.** Facilitator. **Supporting.** —.
- **Effort.** 15 min. **Duration.** 0.25d. **BAM type.** Deep.
- **Predecessors.** `acc_17_03`. **Successors.** `acc_18_01`.
- **Tools.** CadencePlan.
- **Deliverables.** Remeasurement row.
- **Outputs.** `Kaizen.remeasurementId != null`.
- **Acceptance.** Close-gate readiness.
- **Risk if skipped.** Close gate fails.
- **Standardization.** H. **AI-support.** —. **Automation.** H.

---

**`acc_18_01` — Identify benefit categories and classify (Hard / Soft / Cost-Avoidance)** → `30d_4_3`
- **Purpose.** Per Part 7 ROI logic, classify benefits.
- **Operational definition.** A31 draft with each benefit line carrying category + dollar value + evidence.
- **Required inputs.** A30; unit cost data from Finance.
- **Source of inputs.** `acc_17_03`; Finance.
- **Activity steps.** (a) Enumerate benefit lines. (b) Per line, classify. (c) Quantify. (d) Attach evidence.
- **Responsible owner.** Facilitator. **Supporting.** Finance, PO.
- **Effort.** 90 min. **Duration.** 0.5d. **BAM type.** Deep.
- **Predecessors.** `acc_17_03`. **Successors.** `acc_18_02`.
- **Tools.** A31 template.
- **Deliverables.** Benefit Classification (fragment of A31).
- **Outputs.** Classified benefits.
- **Acceptance.** Every line has category + evidence.
- **Risk if skipped.** Inflated ROI claims.
- **Standardization.** H. **AI-support.** Planning Agent (flag missing evidence). **Automation.** M.

---

**`acc_18_02` — Compute annualized benefit and implementation cost** → `30d_4_3`
- **Purpose.** Produce the two dollar values the engine writes to Kaizen.
- **Operational definition.** `implementationCostDollars` + `annualBenefitsDollars` computed.
- **Required inputs.** Cost log from Phase 3; benefit classification from `acc_18_01`.
- **Source of inputs.** `acc_15_01`, `acc_18_01`.
- **Activity steps.** (a) Sum implementation cost (people + tools + systems). (b) Annualize benefit (12× monthly Δ). (c) Note confidence rating overall.
- **Responsible owner.** Facilitator. **Supporting.** Finance.
- **Effort.** 60 min. **Duration.** 0.25d. **BAM type.** Deep.
- **Predecessors.** `acc_18_01`. **Successors.** `acc_18_03`.
- **Tools.** Spreadsheet.
- **Deliverables.** A31 quantification.
- **Outputs.** Two numbers.
- **Acceptance.** Both non-null.
- **Risk if skipped.** No ROI.
- **Standardization.** H. **AI-support.** —. **Automation.** M.

---

**`acc_18_03` — Finance partner sign-off on ROI** → `30d_4_3`
- **Purpose.** Finance co-signs before values written to Kaizen.
- **Operational definition.** Finance written approval; A31 final; values written; `Kaizen.roi` computes non-null.
- **Required inputs.** A31.
- **Source of inputs.** `acc_18_02`.
- **Activity steps.** (a) Walk Finance through A31. (b) Address challenges. (c) Capture sign-off. (d) Write to Kaizen.
- **Responsible owner.** Facilitator. **Supporting.** Finance.
- **Effort.** 60 min. **Duration.** 0.5–1d (Finance turnaround).
- **BAM type.** Communication.
- **Predecessors.** `acc_18_02`. **Successors.** `acc_19_01`.
- **Tools.** CadencePlan; email.
- **Deliverables.** Financial Impact (A31, signed); values on Kaizen.
- **Outputs.** `roi` computed.
- **Acceptance.** Finance signature; Kaizen fields set.
- **Risk if skipped.** Close gate fails; portfolio mistrust.
- **Standardization.** H. **AI-support.** —. **Automation.** L.

---

**`acc_19_01` — Finalize control plan with Process Owner** → `30d_4_5`
- **Purpose.** Convert `acc_13_04` draft into signed A32 with 30/60/90 check-ins.
- **Operational definition.** A32 signed by PO; calendar holds for 30/60/90 created.
- **Required inputs.** Control-plan draft from `acc_13_04`; A30; A26.
- **Source of inputs.** `acc_13_04`, `acc_17_03`, `acc_15_02`.
- **Activity steps.** (a) Update thresholds based on rebaseline. (b) Assign sustainment owner (PO). (c) Define regression response. (d) Create 30/60/90 calendar holds. (e) PO signs.
- **Responsible owner.** Facilitator. **Supporting.** PO.
- **Effort.** 120 min. **Duration.** 0.5d. **BAM type.** Deep.
- **Predecessors.** `acc_18_03`. **Successors.** `acc_19_02`.
- **Tools.** Control plan template; calendar.
- **Deliverables.** Control Plan (A32).
- **Outputs.** Signed A32; calendar holds.
- **Acceptance.** PO signature; holds visible on PO calendar.
- **Risk if skipped.** Sustainment fails post-close.
- **Standardization.** H. **AI-support.** Composer Explainer. **Automation.** M.

---

**`acc_19_02` — Stakeholder validation meeting** → `30d_4_4`
- **Purpose.** Sponsor + PO review deltas and ROI; capture sign-off.
- **Operational definition.** A34 results memo signed by Sponsor + PO.
- **Required inputs.** A30, A31, A32.
- **Source of inputs.** `acc_17_03`, `acc_18_03`, `acc_19_01`.
- **Activity steps.** (a) Walk results. (b) Address concerns. (c) Capture sign-off. (d) File A34.
- **Responsible owner.** Facilitator. **Supporting.** Sponsor, PO.
- **Effort.** 60 min. **Duration.** 0.5d. **BAM type.** Communication.
- **Predecessors.** `acc_19_01`. **Successors.** `acc_19_03`.
- **Tools.** Meeting.
- **Deliverables.** Approved Results Memo (A34).
- **Outputs.** Sign-offs.
- **Acceptance.** Sponsor + PO signatures.
- **Risk if skipped.** Close without alignment.
- **Standardization.** M. **AI-support.** —. **Automation.** L.

---

**`acc_19_03` — Author final report (executive summary)** → `30d_4_6`
- **Purpose.** Produce A33 exec summary binding baseline → solution → ROI.
- **Operational definition.** 3–6 page doc with baseline/future state/SOPs/ROI/control plan; populates `Kaizen.resultsNarrativeRef`.
- **Required inputs.** A11, A19, A26, A30, A31, A32.
- **Source of inputs.** PHASE_1–4 upstream.
- **Activity steps.** (a) Draft exec summary. (b) Attach sub-artifacts. (c) Present to Sponsor. (d) File.
- **Responsible owner.** Facilitator. **Supporting.** PO.
- **Effort.** 180 min. **Duration.** 0.5d. **BAM type.** Deep.
- **Predecessors.** `acc_19_02`. **Successors.** `acc_19_04`.
- **Tools.** Report template.
- **Deliverables.** Executive Summary (A33).
- **Outputs.** Final report.
- **Acceptance.** Sponsor reads; `resultsNarrativeRef` set.
- **Risk if skipped.** Portfolio without audit trail.
- **Standardization.** H. **AI-support.** Composer Explainer. **Automation.** M.

---

**`acc_19_04` — Capture lessons learned** → `30d_4_6`
- **Purpose.** Author A35 lessons memo for future Accelerators.
- **Operational definition.** 1–2 page doc: what worked / what didn't / what to replicate / anti-patterns encountered.
- **Required inputs.** Facilitator observations; team retro.
- **Source of inputs.** `acc_19_03` + team feedback.
- **Activity steps.** (a) Run 30-min retro. (b) Synthesize. (c) Write A35. (d) File.
- **Responsible owner.** Facilitator. **Supporting.** Team.
- **Effort.** 60 min. **Duration.** 0.25d. **BAM type.** CI.
- **Predecessors.** `acc_19_03`. **Successors.** `acc_19_05`, `acc_20_01`.
- **Tools.** Retro template.
- **Deliverables.** Lessons Learned (A35).
- **Outputs.** Memo.
- **Acceptance.** ≥5 lessons; ≥2 anti-patterns.
- **Risk if skipped.** Next Accelerator repeats mistakes.
- **Standardization.** H. **AI-support.** Reflection Agent. **Automation.** M.

---

**`acc_19_05` — Close the Kaizen (compute closeKind; `state=CLOSED`)** → `30d_4_6`
- **Purpose.** Call `KaizenService.closeAccelerator()`; set `closeKind` (SUCCESS / PARTIAL / FAILED_HONEST).
- **Operational definition.** `Kaizen.state = CLOSED`; all close gate inputs present.
- **Required inputs.** A31, A32, A33; remeasurement; roi.
- **Source of inputs.** PHASE_4 upstream.
- **Activity steps.** (a) Verify gate. (b) Compute closeKind. (c) Close.
- **Responsible owner.** Facilitator. **Supporting.** Sponsor.
- **Effort.** 15 min. **Duration.** 0.25d. **BAM type.** Deep.
- **Predecessors.** `acc_19_04`. **Successors.** `acc_20_01`.
- **Tools.** CadencePlan.
- **Deliverables.** Close event.
- **Outputs.** `state=CLOSED`; `closeKind` set.
- **Acceptance.** Gate passes; event emitted.
- **Risk if skipped.** Kaizen never closes; sustainment unclear.
- **Standardization.** H. **AI-support.** —. **Automation.** H.

---

**`acc_20_01` — Draft next-process intake recommendation** → `30d_4_6`
- **Purpose.** Use scorecard A02 + lessons A35 to recommend the next process.
- **Operational definition.** A36 memo with ranked next candidates and Accelerator-fit score.
- **Required inputs.** A02; A35; updated Sponsor pain list.
- **Source of inputs.** `acc_01_03`, `acc_19_04`; fresh Sponsor intake.
- **Activity steps.** (a) Pull unselected candidates from A02. (b) Re-score with lessons. (c) Identify top candidate. (d) Write memo.
- **Responsible owner.** Facilitator. **Supporting.** —.
- **Effort.** 60 min. **Duration.** 0.25d. **BAM type.** Deep.
- **Predecessors.** `acc_19_04`. **Successors.** `acc_20_02`.
- **Tools.** Scorecard template.
- **Deliverables.** Next-Process Recommendation Memo (A36, draft).
- **Outputs.** Ranked recommendation.
- **Acceptance.** Top candidate + rationale stated.
- **Risk if skipped.** Next Accelerator restarts intake from zero.
- **Standardization.** M. **AI-support.** Context Agent. **Automation.** M.

---

**`acc_20_02` — Sponsor readout and Accelerator N+1 decision** → `30d_4_6`
- **Purpose.** Present recommendation; Sponsor decides continue / pause / different team.
- **Operational definition.** 30-min call; decision logged in A36 final.
- **Required inputs.** A36 draft.
- **Source of inputs.** `acc_20_01`.
- **Activity steps.** (a) Present. (b) Discuss. (c) Log decision.
- **Responsible owner.** Facilitator. **Supporting.** Sponsor.
- **Effort.** 30 min. **Duration.** 0.25d. **BAM type.** Communication.
- **Predecessors.** `acc_20_01`. **Successors.** —.
- **Tools.** Meeting.
- **Deliverables.** Next-Process Recommendation Memo (A36, final).
- **Outputs.** Sponsor decision.
- **Acceptance.** Decision logged.
- **Risk if skipped.** Program momentum lost.
- **Standardization.** M. **AI-support.** —. **Automation.** L.

### Inter-phase glue tasks

---

**`acc_gl_01` — Daily standup during active execution (Phases 1, 2, 3, 4)** → generic Standup
- **Purpose.** 15-min standup every working day of the Accelerator.
- **Operational definition.** Attendance ≥70% roster; blocker call-out; next 24h plan.
- **Required inputs.** Running backlog/blocker log.
- **Source of inputs.** Current phase work-product.
- **Activity steps.** (a) What happened yesterday. (b) What's next. (c) Blockers.
- **Responsible owner.** Facilitator. **Supporting.** Team.
- **Effort.** 15 min. **Duration.** daily.
- **BAM type.** Communication.
- **Predecessors.** `acc_06_03`. **Successors.** —.
- **Tools.** Meeting.
- **Deliverables.** Standup notes (rolling).
- **Outputs.** Alignment.
- **Acceptance.** Notes captured each day.
- **Risk if skipped.** Drift.
- **Standardization.** H. **AI-support.** —. **Automation.** L.

---

**`acc_gl_02` — End-of-activity 60-second reflection (per scheduled catalog activity)** → generic Reflection
- **Purpose.** Capture plan vs actual + friction signal at activity close.
- **Operational definition.** `Reflection` row created for every closed `ScheduledActivity`.
- **Required inputs.** Activity close event.
- **Source of inputs.** CadencePlan.
- **Activity steps.** (a) Plan vs actual. (b) One friction signal.
- **Responsible owner.** Activity owner. **Supporting.** —.
- **Effort.** 1 min. **Duration.** at close.
- **BAM type.** CI.
- **Predecessors.** Any activity. **Successors.** —.
- **Tools.** CadencePlan.
- **Deliverables.** Reflection row.
- **Outputs.** Friction signals into pipeline.
- **Acceptance.** ≥75% reflection rate per blueprint §7.2.
- **Risk if skipped.** Lost signal.
- **Standardization.** H. **AI-support.** Reflection Agent. **Automation.** H.

---

**`acc_gl_03` — Weekly phase-gate review (internal)** → —
- **Purpose.** Facilitator self-audit end of each Accelerator week.
- **Operational definition.** 30-min block each Friday; gate readiness checked against Part 7 gate review.
- **Required inputs.** Current phase artifacts.
- **Source of inputs.** Phase work-product.
- **Activity steps.** (a) Check gate artifacts. (b) Spot drift. (c) Adjust next-week plan.
- **Responsible owner.** Facilitator. **Supporting.** —.
- **Effort.** 30 min. **Duration.** weekly.
- **BAM type.** CI.
- **Predecessors.** —. **Successors.** —.
- **Tools.** Part 7 checklist.
- **Deliverables.** Weekly gate-review note.
- **Outputs.** Adjustment plan.
- **Acceptance.** Note exists each week.
- **Risk if skipped.** Late-phase surprise.
- **Standardization.** H. **AI-support.** Planning Agent. **Automation.** M.

---

**`acc_gl_04` — Scope-change abandon-and-restart handler** → —
- **Purpose.** Explicit path when Phase 2 reveals the wrong process.
- **Operational definition.** If scope rotates, mark Kaizen `abandoned=true`; file scope-change memo; start new Phase 0 Kaizen.
- **Required inputs.** Scope-change signal.
- **Source of inputs.** `acc_12_05` or later.
- **Activity steps.** (a) Log evidence. (b) Sponsor decision. (c) Abandon current. (d) New Phase 0.
- **Responsible owner.** Facilitator. **Supporting.** Sponsor.
- **Effort.** 120 min. **Duration.** 0.5d. **BAM type.** Communication.
- **Predecessors.** Any scope-rotation discovery. **Successors.** `acc_01_01` (new).
- **Tools.** CadencePlan; memo.
- **Deliverables.** Scope-Change Memo.
- **Outputs.** Abandoned Kaizen.
- **Acceptance.** New Kaizen started from Phase 0.
- **Risk if skipped.** Silent scope drift kills ROI validity.
- **Standardization.** H. **AI-support.** —. **Automation.** L.

---

**`acc_gl_05` — Sustainment check at Day 60 and Day 90** → —
- **Purpose.** Facilitator revisits control plan post-close; catches regression.
- **Operational definition.** Snapshot of monitoring metric vs threshold; regression flag if triggered.
- **Required inputs.** A32 control plan; current metric.
- **Source of inputs.** `acc_19_01`.
- **Activity steps.** (a) Pull current metric. (b) Compare to threshold. (c) Notify PO. (d) Log.
- **Responsible owner.** Facilitator. **Supporting.** PO.
- **Effort.** 45 min per check.
- **Duration.** Day 60, Day 90.
- **BAM type.** CI.
- **Predecessors.** `acc_19_01`. **Successors.** —.
- **Tools.** Monitoring dashboard.
- **Deliverables.** Sustainment note.
- **Outputs.** Regression flag or pass.
- **Acceptance.** Note filed at each checkpoint.
- **Risk if skipped.** Wins revert invisibly.
- **Standardization.** H. **AI-support.** Momentum Agent. **Automation.** M.

---

## Part 4 — Artifact Specification Library

Every artifact the Accelerator produces is specified here. Artifact IDs A01–A36 are the canonical names used in Part 3. The user's 25-item list is fully covered; 11 additional artifacts identified during validation are explicitly flagged **[Added during validation]**.

### A01 — Intake Diagnostic Brief

- **Purpose.** Capture Sponsor pains, KPI gaps, candidate rationale pre-charter.
- **Why it matters.** Without it, candidate selection is opinion; post-hoc justification is impossible.
- **Owner.** Facilitator.
- **Phase created.** Sub-phase 01.
- **Source inputs.** Voice-of-Leader interviews; prior-quarter scorecard; engagement scope.
- **Required sections.** Engagement context (1 paragraph); Sponsor verbatim pains (3); KPI gaps (5–15 rows with quantified gap); escalation history (≥1 example); candidate list (embedded A02); selected candidate with rationale; non-selection rationale for alternatives.
- **Acceptance criteria.** Sponsor pains + KPI gaps both populated; selected candidate explicit; Sponsor acknowledged.
- **Downstream uses.** `acc_02_01` (boundary definition); `acc_20_01` (next-process recommendation).
- **Typical failure modes.** Thin (missing measurable gaps); stale (pulls last year's scorecard); fabricated (pains not traceable to interview notes).
- **Template guidance.** 2–4 pages; embed links to interview notes and scorecard extract; do not invent pains.

### A02 — Candidate Process Scorecard

- **Purpose.** Rank 3–7 candidate processes on Impact × Feasibility.
- **Why it matters.** Makes selection falsifiable; provides next-Accelerator intake.
- **Owner.** Facilitator.
- **Phase created.** Sub-phase 01.
- **Source inputs.** A01 pains + gaps.
- **Required sections.** For each candidate: name; one-line pain; one-line measurable gap; Impact score (1–5); Feasibility score (1–5); rationale per axis; short-list flag.
- **Acceptance criteria.** ≥3 candidates; scores sum to a total; short-list explicit.
- **Downstream uses.** `acc_01_04`; `acc_20_01` (re-use for next-process intake).
- **Typical failure modes.** Scores without rationale; feasibility ignored.
- **Template guidance.** 1 page table.

### A03 — Scoped Process Definition

- **Purpose.** Lock falsifiable process scope.
- **Why it matters.** Without it, Phase 2 scope rotation is silent.
- **Owner.** Facilitator; Process Owner initials.
- **Phase created.** Sub-phase 02.
- **Source inputs.** A01; Process Owner interviews; system inventory; org chart.
- **Required sections.** Start event (system + field); End event (system + field); Systems in scope (≥1); Roles/personas (≥2); Out-of-scope items (3–5); Assumptions.
- **Acceptance criteria.** All fields populated; 3–5 out-of-scope items; Process Owner initials.
- **Downstream uses.** `acc_03_01` (problem statement scope ref); `acc_07_03` (access requests); `acc_08_01` (capture scope).
- **Typical failure modes.** Boundary events vague ("when work starts"); no out-of-scope list.
- **Template guidance.** 1–2 pages; use system-of-record field names verbatim.

### A04 — Approved Problem Statement

- **Purpose.** Signed, quantified problem the Accelerator will solve.
- **Why it matters.** Gates baseline metric selection; determines Phase 4 "did we win?" question.
- **Owner.** Facilitator; Sponsor signs.
- **Phase created.** Sub-phase 03.
- **Source inputs.** A03; ticket/incident data; scorecard.
- **Required sections.** Current state (paragraph); Impact (quantified on 1+ axes: time/cost/quality/throughput); Scope ref (A03); Baseline metric value (placeholder pre-Phase 1); Target condition; Timeframe ("by Day 30"); Sponsor signature.
- **Acceptance criteria.** Passes Part 5 checklist; Sponsor acknowledgement captured.
- **Downstream uses.** `acc_04_01`; A07 charter; A33 final report.
- **Typical failure modes.** Vague impact; solution-prescribing language; unbounded scope.
- **Template guidance.** 1 page using Part 5 fill-in template verbatim.

### A05 — KPI Baseline Targets

- **Purpose.** Lock the metrics, operational definitions, and sample plans.
- **Why it matters.** Baseline and remeasurement depend on identical definitions.
- **Owner.** Facilitator; Finance acknowledges cost basis.
- **Phase created.** Sub-phase 04.
- **Source inputs.** A04; KPI taxonomy; Finance cost basis.
- **Required sections.** Per metric: name; primary/secondary flag; operational definition (paragraph); unit; method; sample size (n); sample frequency; stratification rule; exclusion rule; measurement owner; baseline target (numeric); post-improvement target; cost basis (if cost metric); Finance acknowledgement.
- **Acceptance criteria.** All 12 fields present per metric; Finance ack on cost basis.
- **Downstream uses.** A07; A09 data-capture plan; A30 performance delta; A31 ROI.
- **Typical failure modes.** Definition ambiguous; sample size missing.
- **Template guidance.** 1 page per metric in a table.

### A06 — Project Team Roster

- **Purpose.** Every required role named with accountability and decision rights.
- **Why it matters.** Unassigned roles stop Phase 4 sign-offs.
- **Owner.** Facilitator.
- **Phase created.** Sub-phase 05.
- **Source inputs.** Org chart; Sponsor introductions.
- **Required sections.** Per role: name, email, role (Sponsor / Process Owner / Facilitator / Implementation Lead / SME / Finance partner / Decision-maker / Analyst); accountability one-liner; decision rights; per-phase time commitment (hours/week by phase); confirmation status.
- **Acceptance criteria.** Every required role has a named person; per-phase commitment confirmed.
- **Downstream uses.** A07; `acc_14_01` ownership; `acc_18_03` Finance sign-off.
- **Typical failure modes.** Roles TBD; no Finance partner named.
- **Template guidance.** 1 page table.

### A07 — Signed Project Charter

- **Purpose.** Consolidated kickoff document; Sponsor authorization.
- **Why it matters.** Without signature, Accelerator cannot be legitimately invoked; Kaizen cannot be promoted.
- **Owner.** Facilitator; Sponsor signs.
- **Phase created.** Sub-phase 06.
- **Source inputs.** A03, A04, A05, A06.
- **Required sections.** Summary page; A03 scope; A04 problem; A05 metrics; A06 roster; 30-day timeline visual (Gantt or bar); Top 3 risks + mitigations; Sponsor signature block; Date.
- **Acceptance criteria.** All 5 source artifacts embedded; Sponsor signature; timeline shows 5 phases with dates.
- **Downstream uses.** Everything downstream; Kaizen `resultsNarrativeRef` cross-reference.
- **Typical failure modes.** Sponsor hasn't read it; timeline is aspirational.
- **Template guidance.** 4–8 pages; include a 1-page "I am committing to" cover for Sponsor.

### A08 — Kickoff Meeting Notes **[Added during validation]**

- **Purpose.** Working agreement + standup cadence + escalation path captured from kickoff.
- **Why it matters.** Team execution depends on a shared operating agreement.
- **Owner.** Facilitator.
- **Phase created.** Sub-phase 06.
- **Source inputs.** Kickoff session.
- **Required sections.** Attendees; standup time; escalation path; decision-making rule; communication channel; working agreement.
- **Acceptance criteria.** Standup time set; ≥80% attendance; working agreement signed.
- **Downstream uses.** `acc_gl_01` standup; escalations during Phase 3.
- **Typical failure modes.** Implicit agreements that nobody holds later.
- **Template guidance.** 1 page.

### A09 — Data-Capture Plan **[Added during validation]**

- **Purpose.** Locked Phase 1 capture mechanism that Phase 4 rebaseline will reproduce.
- **Why it matters.** Remeasurement integrity depends on method replication.
- **Owner.** Analyst; Facilitator + Process Owner co-sign.
- **Phase created.** Sub-phase 07.
- **Source inputs.** A05 definitions; A03.2 systems; access confirmations.
- **Required sections.** Option (A/B); Per metric: source system / observation template; Sample size; Sample frequency; Stratification rule; Exclusion rule; Observers (if B); Access log; Pilot results; Lock date.
- **Acceptance criteria.** Pilot passed; three role sign-offs; locked flag set.
- **Downstream uses.** A10; A29; `acc_17_01`.
- **Typical failure modes.** Method drifts between baseline and rebaseline.
- **Template guidance.** 1–2 pages.

### A10 — Raw Baseline Dataset

- **Purpose.** The time-stamped dataset the baseline is computed from.
- **Why it matters.** Evidence for locked BaselineMetric; re-computable if audit needed.
- **Owner.** Analyst.
- **Phase created.** Sub-phase 08.
- **Source inputs.** System logs or observation logs per A09.
- **Required sections.** Cleaned dataset file; Raw (pre-exclusion) dataset file; Exclusion log (row-level); Data-quality flag log; Version tag; Collection window.
- **Acceptance criteria.** n ≥ A09 plan; every excluded row annotated.
- **Downstream uses.** A12; A15; A30 comparison.
- **Typical failure modes.** Raw discarded; no exclusion log; dataset not versioned.
- **Template guidance.** Store in Kaizen workspace; link from A10 header doc.

### A11 — Current-State Process Map

- **Purpose.** Visual current-state flow.
- **Why it matters.** Shared team picture; basis for waste and future-state design.
- **Owner.** Facilitator; SMEs validate.
- **Phase created.** Sub-phase 09.
- **Source inputs.** A10; SME interviews.
- **Required sections.** Swimlane or BPMN; Every activity from A10; Handoffs marked; System transitions marked; Wait vs touch visible.
- **Acceptance criteria.** SME acknowledgement; handoffs counted.
- **Downstream uses.** A12; A13; A19; A33.
- **Typical failure modes.** Missing handoffs (invisible waste); over-aggregated steps.
- **Template guidance.** One diagram; support it with a step list.

### A12 — Activity Breakdown Table

- **Purpose.** Per-step cycle/wait/touch times with n.
- **Why it matters.** Quantified basis for waste ranking and Phase 4 improvement claims.
- **Owner.** Analyst.
- **Phase created.** Sub-phase 09.
- **Source inputs.** A10, A11.
- **Required sections.** Per step: cycle time (mean, stdev, n); wait time; touch time; unit; notes.
- **Acceptance criteria.** Every A11 step has a row; n noted.
- **Downstream uses.** A13; A30 compare.
- **Typical failure modes.** Missing n; units ambiguous.
- **Template guidance.** Spreadsheet; link from Kaizen workspace.

### A13 — Waste Analysis (TIMWOODS)

- **Purpose.** TIMWOODS scan with ranked observations.
- **Why it matters.** Root cause candidates start here.
- **Owner.** Facilitator.
- **Phase created.** Sub-phase 09.
- **Source inputs.** A11, A12.
- **Required sections.** Per observation: category (T/I/M/W/O/O/D/S); step reference; observation description; frequency/magnitude rank.
- **Acceptance criteria.** All 8 categories scanned; ≥3 observations.
- **Downstream uses.** A17 root cause; A19 future state.
- **Typical failure modes.** Only 2–3 categories addressed.
- **Template guidance.** Two-list table (category | observation).

### A14 — Baseline SOPs (v1.0 as-is)

- **Purpose.** As-is procedures for every activity in A11.
- **Why it matters.** Phase 3 diff and Phase 4 audit rely on v1.0 existing.
- **Owner.** Facilitator; SMEs validate.
- **Phase created.** Sub-phase 10.
- **Source inputs.** A11, A12; SME input.
- **Required sections.** Per SOP: title; version (1.0); owning role; system of record; step-by-step procedure; inputs; outputs; notes.
- **Acceptance criteria.** Every A11 activity has a v1.0 SOP; SMEs acknowledge.
- **Downstream uses.** A21; A26; A33.
- **Typical failure modes.** Over-detailed or under-detailed; no role assignments.
- **Template guidance.** 1 SOP per page; standard template.

### A15 — Approved Baseline Sign-off Memo

- **Purpose.** Stakeholder sign-off on baseline metrics, map, SOPs.
- **Why it matters.** Phase 2 advance guard; locks `BaselineMetric`.
- **Owner.** Facilitator.
- **Phase created.** Sub-phase 11.
- **Source inputs.** A10, A11, A12, A13, A14.
- **Required sections.** Baseline metric values; summary statistics; map reference; waste summary; SOP reference; Sponsor signature; Process Owner signature; SME signatures.
- **Acceptance criteria.** 3+ signatures; metric lock date.
- **Downstream uses.** Phase 2 advance; A33.
- **Typical failure modes.** Signature only from Sponsor; SMEs didn't see the map.
- **Template guidance.** 1 page + linked references.

### A16 — Shared Understanding Log **[Added during validation]**

- **Purpose.** Capture team questions, disagreements, parked items from Phase 2 current-state review.
- **Why it matters.** Pre-empts Phase 3 "I thought we agreed X."
- **Owner.** Facilitator.
- **Phase created.** Sub-phase 12.
- **Source inputs.** Current-state review session.
- **Required sections.** Attendees; questions raised; disagreements; parked items; decisions made.
- **Acceptance criteria.** ≥5 entries.
- **Downstream uses.** Phase 2 root-cause discussion.
- **Typical failure modes.** Not captured.
- **Template guidance.** Running log.

### A17 — Root Cause List

- **Purpose.** Ranked symptom → root cause pairs.
- **Why it matters.** No solution without root cause; enforces Principle 2.
- **Owner.** Facilitator.
- **Phase created.** Sub-phase 12.
- **Source inputs.** 5 Whys + Fishbone outputs.
- **Required sections.** Per pair: symptom; root cause; 5-Why chain OR Fishbone branch; rank; team endorsement flag.
- **Acceptance criteria.** ≥3 causes; top 3 endorsed.
- **Downstream uses.** A19; A22.
- **Typical failure modes.** Solutions dressed as causes.
- **Template guidance.** Two-list table (symptom | cause).

### A18 — Event Agenda **[Added during validation]**

- **Purpose.** Phase 2 day-by-day schedule.
- **Why it matters.** Holds the 3–5 day event window together.
- **Owner.** Facilitator.
- **Phase created.** Sub-phase 12.
- **Source inputs.** A15; roster.
- **Required sections.** Per event day: session agenda (half-day blocks); owner per session; prework; outputs.
- **Acceptance criteria.** ≥80% roster confirmed; pre-read sent ≥48h prior.
- **Downstream uses.** Runs the event.
- **Typical failure modes.** Pre-read missing; time not blocked.
- **Template guidance.** 1 page.

### A19 — Future-State Process Map

- **Purpose.** To-be flow with waste removed.
- **Why it matters.** Basis for improvements enumeration and SOP v2.0.
- **Owner.** Facilitator.
- **Phase created.** Sub-phase 13.
- **Source inputs.** A11, A13, A17.
- **Required sections.** Swimlane; delta annotations; side-by-side with A11.
- **Acceptance criteria.** Every delta traces to A17.
- **Downstream uses.** A20; A21.
- **Typical failure modes.** Improvements without root-cause link.
- **Template guidance.** Diagram + delta table.

### A20 — Prioritized Implementation Backlog

- **Purpose.** Sequenced epic → story → task backlog with priority scores.
- **Why it matters.** Phase 3 ownership assignment reads from here.
- **Owner.** Facilitator; Process Owner priority lead.
- **Phase created.** Sub-phase 13.
- **Source inputs.** A22.
- **Required sections.** Epics; stories; tasks; priority score; category (quick/medium/strategic); estimated effort; expected impact.
- **Acceptance criteria.** Hierarchy complete; every item scored.
- **Downstream uses.** `Kaizen.actions[]`; A23.
- **Typical failure modes.** Flat list; no strategic items surfaced.
- **Template guidance.** Backlog tool + exported 1-page summary.

### A21 — Future-State SOPs (v2.0-draft)

- **Purpose.** To-be procedures drafted during the event.
- **Why it matters.** Phase 3 executes against these; v2.0-final ships when changes land.
- **Owner.** Facilitator; SMEs review.
- **Phase created.** Sub-phase 13.
- **Source inputs.** A14, A19, A22.
- **Required sections.** Per SOP: title; version (2.0-draft); owning role; system; step-by-step; diff vs v1.0.
- **Acceptance criteria.** Every A14 SOP has a v2.0-draft counterpart.
- **Downstream uses.** A26; A33.
- **Typical failure modes.** Draft lacks diff; role not updated.
- **Template guidance.** Same template as A14 plus diff block.

### A22 — Improvement Catalog **[Added during validation]**

- **Purpose.** Raw list of every improvement implied by A19, before prioritization.
- **Why it matters.** Captures ideas that don't make the cut; seed for future Accelerators.
- **Owner.** Facilitator.
- **Phase created.** Sub-phase 13.
- **Source inputs.** A19.
- **Required sections.** Per improvement: name; category (quick/medium/strategic); effort; impact; Sponsor-decision flag.
- **Acceptance criteria.** Every improvement categorized.
- **Downstream uses.** A20; A35 lessons.
- **Typical failure modes.** Collapsed into A20 with loss of rejected ideas.
- **Template guidance.** Two-list table.

### A23 — Assigned Backlog

- **Purpose.** A20 with owner + due date + acceptance criterion per item.
- **Why it matters.** Principle 3: no implementation without ownership.
- **Owner.** Facilitator.
- **Phase created.** Sub-phase 14.
- **Source inputs.** A20; A06.
- **Required sections.** A20 hierarchy + per item: `ownerRef`; `dueDate`; acceptance criterion; status.
- **Acceptance criteria.** 100% coverage; owners accepted; criteria observable.
- **Downstream uses.** `Kaizen.actions[]`; A24; A25.
- **Typical failure modes.** Unowned items; vague criteria.
- **Template guidance.** 1 page + linked backlog.

### A24 — Execution Schedule **[Added during validation]**

- **Purpose.** Per-owner calendar blocks across Days 13–23.
- **Why it matters.** Execution capacity reserved, not hoped.
- **Owner.** Facilitator.
- **Phase created.** Sub-phase 14.
- **Source inputs.** A23; owner calendars; composer.
- **Required sections.** Per owner: daily block allocation; buffer; escalation windows.
- **Acceptance criteria.** All items fit capacity.
- **Downstream uses.** `acc_15_01`.
- **Typical failure modes.** Capacity pretends blocks exist; real calendar is crushed.
- **Template guidance.** Per-owner table + calendar export.

### A25 — Implemented Changes Log

- **Purpose.** Running log of changes shipped with before/after per change.
- **Why it matters.** Audit trail + basis for Phase 4 diff.
- **Owner.** Implementation Lead.
- **Phase created.** Sub-phase 15.
- **Source inputs.** Execution events.
- **Required sections.** Per change: date; owner; action id; before (numeric or narrative); after; SOP diff link.
- **Acceptance criteria.** 1 entry per shipped change.
- **Downstream uses.** A26, A30, A31, A33.
- **Typical failure modes.** Missing entries; "before" not captured.
- **Template guidance.** Running spreadsheet.

### A26 — Final SOPs (v2.0-final)

- **Purpose.** SOPs matching implemented reality.
- **Why it matters.** Sustainment; audit; onboarding.
- **Owner.** Facilitator; SMEs commit.
- **Phase created.** Sub-phase 15/16.
- **Source inputs.** A21, A25.
- **Required sections.** Per SOP: title; version (2.0); role; system; steps; change log.
- **Acceptance criteria.** A25-A26 1:1.
- **Downstream uses.** A33; Process Owner sustainment.
- **Typical failure modes.** SOP drift (real behavior ≠ SOP).
- **Template guidance.** Versioned in repo.

### A27 — Cleared Constraints Log **[Added during validation]**

- **Purpose.** Blocker + resolution evidence.
- **Why it matters.** Demonstrates Phase 3 rigor; basis for Sponsor escalations and lessons.
- **Owner.** Facilitator.
- **Phase created.** Sub-phase 16.
- **Source inputs.** Daily blocker flags.
- **Required sections.** Per blocker: date raised; category (decision/access/scope/capacity); owner; resolution; date cleared; escalation flag.
- **Acceptance criteria.** 100% resolved or escalated within 24h.
- **Downstream uses.** A35 lessons.
- **Typical failure modes.** Unresolved blockers dropped off.
- **Template guidance.** Running log.

### A28 — Execution Dashboard Snapshots **[Added during validation]**

- **Purpose.** Daily completion % + blocker count; rolling record.
- **Why it matters.** Evidence of daily cadence; feed for Part 7 health checks.
- **Owner.** Facilitator.
- **Phase created.** Sub-phase 16.
- **Source inputs.** A23, A25.
- **Required sections.** Per day: completion %; open blockers; strategic-item status; trend.
- **Acceptance criteria.** One entry per workday in Phase 3.
- **Downstream uses.** A33; Part 7 gate review.
- **Typical failure modes.** Missed days.
- **Template guidance.** Dashboard + daily export.

### A29 — Post-Implementation Dataset

- **Purpose.** Remeasurement dataset identical in method to A10.
- **Why it matters.** Close-gate data.
- **Owner.** Analyst.
- **Phase created.** Sub-phase 17.
- **Source inputs.** A09 method; current systems.
- **Required sections.** Same as A10; plus method-drift notes (if any).
- **Acceptance criteria.** n = A09 plan; method matches; exclusions identical.
- **Downstream uses.** A30; `Remeasurement` row.
- **Typical failure modes.** Method drift unflagged.
- **Template guidance.** Link from workspace.

### A30 — Performance Delta

- **Purpose.** Baseline vs post comparison table.
- **Why it matters.** Tells the team whether it worked.
- **Owner.** Analyst.
- **Phase created.** Sub-phase 17.
- **Source inputs.** A10, A29, A05.
- **Required sections.** Per metric: baseline value; post value; absolute Δ; %Δ; significance flag.
- **Acceptance criteria.** Every baseline metric paired.
- **Downstream uses.** A31; A33; A34.
- **Typical failure modes.** Unpaired secondary metrics.
- **Template guidance.** Two-list + summary.

### A31 — Financial Impact

- **Purpose.** `implementationCostDollars` + `annualBenefitsDollars` with Finance sign-off.
- **Why it matters.** `Kaizen.roi` depends on it.
- **Owner.** Facilitator; Finance signs.
- **Phase created.** Sub-phase 18.
- **Source inputs.** A30; cost log; unit costs.
- **Required sections.** Benefit line items (name | category Hard/Soft/Cost-Avoidance | dollar value | evidence); implementation cost line items (people | tools | systems | dollar value); Annualized benefit total; Implementation cost total; Confidence rating; Finance signature + date.
- **Acceptance criteria.** Finance signature; both totals non-null.
- **Downstream uses.** Kaizen field write; A33, A34.
- **Typical failure modes.** Soft dollars claimed as Hard; missing evidence.
- **Template guidance.** 1 page.

### A32 — Control Plan

- **Purpose.** Sustainment model: metric, frequency, threshold, response, owner.
- **Why it matters.** Without it, wins revert.
- **Owner.** Facilitator; Process Owner signs.
- **Phase created.** Sub-phase 13 (draft) → Sub-phase 19 (final).
- **Source inputs.** A26, A30, `acc_13_04` draft.
- **Required sections.** Per monitored metric: name; frequency; threshold; regression response; owner (PO). Plus 30/60/90 check-in calendar holds.
- **Acceptance criteria.** PO signature; calendar holds created on PO calendar.
- **Downstream uses.** `acc_gl_05` sustainment checks; A33.
- **Typical failure modes.** Thresholds set without baseline reference; no response defined.
- **Template guidance.** 1–2 pages.

### A33 — Executive Summary (final report)

- **Purpose.** Problem → solution → ROI narrative binding all artifacts.
- **Why it matters.** Sponsor audience; portfolio archive.
- **Owner.** Facilitator.
- **Phase created.** Sub-phase 19.
- **Source inputs.** A03, A04, A11, A19, A26, A30, A31, A32.
- **Required sections.** Executive summary (1 page); Problem (A04); Baseline (A11/A12/A15); Future state (A19); Changes shipped (A25); Results (A30); ROI (A31); Control plan (A32); Lessons (A35).
- **Acceptance criteria.** Every source artifact referenced; Sponsor reads; `Kaizen.resultsNarrativeRef` set.
- **Downstream uses.** Portfolio archive; next-process intake.
- **Typical failure modes.** Missing sections; marketing language.
- **Template guidance.** 3–6 pages.

### A34 — Approved Results Memo **[Added during validation]**

- **Purpose.** Sponsor + Process Owner sign-off on results.
- **Why it matters.** Close-gate completeness.
- **Owner.** Facilitator.
- **Phase created.** Sub-phase 19.
- **Source inputs.** A30, A31, A32.
- **Required sections.** Result summary; signatures; close decision.
- **Acceptance criteria.** Sponsor + PO signatures.
- **Downstream uses.** Close event; A33.
- **Typical failure modes.** Only Sponsor signs.
- **Template guidance.** 1 page.

### A35 — Lessons Learned **[Added during validation]**

- **Purpose.** What worked / didn't / replicate / anti-patterns.
- **Why it matters.** Next Accelerator learns; program builds compounding ability.
- **Owner.** Facilitator.
- **Phase created.** Sub-phase 19.
- **Source inputs.** Team retro; A27, A28, A35 precedents.
- **Required sections.** What worked; what didn't; anti-patterns encountered; recommendations for next run.
- **Acceptance criteria.** ≥5 lessons; ≥2 anti-patterns.
- **Downstream uses.** A36 next-process memo; facilitator library.
- **Typical failure modes.** Sanitized to the point of uselessness.
- **Template guidance.** 1–2 pages.

### A36 — Next-Process Recommendation Memo

- **Purpose.** Top candidate for Accelerator N+1.
- **Why it matters.** Reduces next run's intake cost; keeps program momentum.
- **Owner.** Facilitator; Sponsor decides.
- **Phase created.** Sub-phase 20.
- **Source inputs.** A02 (re-scored); A35; fresh Sponsor input.
- **Required sections.** Updated scorecard; top candidate; Accelerator-fit score; timing recommendation; resource assumption.
- **Acceptance criteria.** Sponsor decision captured.
- **Downstream uses.** Next Accelerator's A01.
- **Typical failure modes.** Skipped; program loses momentum.
- **Template guidance.** 1 page.

---

## Part 5 — Problem Statement Framework

A problem statement that cannot be rebaselined is useless. A problem statement that prescribes a solution is not a problem statement. This framework is the fill-in standard for `30d_0_3` and A04.

### 5.1 Required structure

A problem statement has exactly six components, in order:

1. **Current state.** One paragraph, past/present tense. What happens today, observably, for the in-scope process.
2. **Impact.** One or more quantified effects on time, cost, quality, or throughput. Who is hurt, how much, how often. At least one number.
3. **Scope.** Reference to A03 Scoped Process Definition — boundary events + systems + out-of-scope.
4. **Baseline metric with value.** The primary metric from A05, with a baseline value (placeholder `TBD — locked in Phase 1` acceptable pre-baseline).
5. **Target condition.** Specific post-improvement target for the primary metric (e.g., "cycle time reduced from 6 days to ≤2 days").
6. **Timeframe.** "By Day 30 of this Accelerator."

### 5.2 Good examples

**Example 1 — Invoice approval (cycle time).**

> *Current state.* Vendor invoices entering the AP inbox take an average of 6.2 business days from receipt to posting in NetSuite (n=120, last 30 business days; method: NetSuite `Invoice.posted_at` minus `Invoice.received_at`). Delays concentrate in two handoffs: AP clerk to Approver (median 3.1 days) and Approver to Posting (median 1.8 days).
>
> *Impact.* Late-payment penalties totaled $42,000 in the last quarter; 31% of vendors missed early-payment discount windows, costing $18,000 in foregone 2/10 net 30 discounts. AP clerk overtime averaged 12 hours/week.
>
> *Scope.* A03 defines scope from Invoice.received_at in the AP mailbox through Invoice.posted_at in NetSuite. Out-of-scope: procurement initiation, disputed invoices, intercompany transfers.
>
> *Baseline metric.* Average invoice-approval cycle time; current baseline 6.2 business days (to be locked in Phase 1).
>
> *Target condition.* Average invoice-approval cycle time ≤ 2.5 business days, with 95th percentile ≤ 5 days.
>
> *Timeframe.* By Day 30 of this Accelerator.

**Example 2 — Customer onboarding (defect rate).**

> *Current state.* New SaaS customers require an average of 4.3 onboarding tickets (n=87, last 60 days; method: Zendesk tag = "onboarding") before they reach first-value (defined as first workflow run). 18% of customers churn in month 1.
>
> *Impact.* Onboarding-related support cost averaged $840 per new customer ($73,080 last quarter); month-1 churn represented $52,000 in lost ARR.
>
> *Scope.* A03 defines scope from Contract.signed_at through Workflow.first_run_at. Out-of-scope: marketing handoff, billing setup, enterprise implementations (>50 seats).
>
> *Baseline metric.* Average onboarding-tickets-per-customer (primary); month-1 churn rate (secondary). Baselines to be locked in Phase 1.
>
> *Target condition.* Onboarding tickets per customer ≤ 1.5; month-1 churn ≤ 10%.
>
> *Timeframe.* By Day 30.

**Example 3 — Code review (throughput).**

> *Current state.* Pull requests sit in "awaiting review" state an average of 38 hours before first reviewer response (n=210, last 30 days; method: GitHub `PR.opened_at` to first review comment). 22% of PRs exceed 72 hours.
>
> *Impact.* Engineers report losing context after >24h wait; context-switching overhead estimated at 2 hours per engineer per week (120 engineers × 2h × $95/h fully-loaded = $988,000/year). Release velocity dropped 15% quarter-over-quarter per the engineering scorecard.
>
> *Scope.* A03 defines scope from PR.opened_at to first review comment in primary monorepo. Out-of-scope: draft PRs, bot-authored PRs, docs-only PRs.
>
> *Baseline metric.* Mean time-to-first-review (primary); % of PRs > 72h wait (secondary). Baselines to be locked in Phase 1.
>
> *Target condition.* Mean time-to-first-review ≤ 8 hours (business hours); % > 72h ≤ 5%.
>
> *Timeframe.* By Day 30.

### 5.3 Bad examples (what's wrong)

**Bad example 1 — Invoice approval.**

> *"Our invoice process is too slow. We need to speed it up and improve approver responsiveness."*

- **What's wrong.** No quantified current state ("too slow"). No impact numbers. No scope reference. No baseline value. Solution-prescribing ("improve approver responsiveness" presumes the fix). No timeframe. Unbounded.

**Bad example 2 — Customer onboarding.**

> *"Customer onboarding should be easier and more automated so that customers feel great about us. Target: a 50% improvement in satisfaction within a quarter."*

- **What's wrong.** "Easier" and "more automated" are not observable current states. "Feel great about us" is not a metric. "50% improvement in satisfaction" does not name a metric or baseline (improvement *from what*?). Solution-prescribing (automation is the fix). No scope. "Within a quarter" is longer than 30 days and ambiguous.

**Bad example 3 — Code review.**

> *"PR review times are variable and we want to make them consistent. Goal: reduce variance by X% by end of year."*

- **What's wrong.** "Variable" is not quantified (stdev? range? tail?). "Make them consistent" can mean slower-but-steady (not what's wanted). "X%" is not a number. "By end of year" is not aligned with Accelerator 30-day envelope. No baseline. No scope. No ticket-system method.

### 5.4 Measurable components

Quantify: baseline value; volume (per day/week/month); impact dollars (at least one axis); sample size; time window of measurement; method of measurement.

### 5.5 Operational boundaries

The scope section references A03. The statement explicitly names the out-of-scope items. Minimum 3 out-of-scope items, drawn from candidates that a reasonable teammate might assume are included.

### 5.6 Top 10 problem-statement failures

1. Vague impact language without numbers ("significant", "major", "painful").
2. Missing baseline value or method.
3. Target stated as a percentage change without a baseline anchor.
4. Solution-prescribing language ("we need to automate X").
5. Unbounded scope (no out-of-scope items; no systems named).
6. Multiple primary metrics (ambiguous success).
7. Target timeframe exceeding 30 days.
8. Metric with no operational definition (cost without basis; time without end-event).
9. "Who is hurt" missing — stakeholder consequence not stated.
10. Over-quantified narrative hiding a weak signal (15 metrics; primary unclear).

### 5.7 Chain to charter and ROI

```
A04 Problem Statement
   │ primary metric →
   ▼
A05 Baseline Targets (operational definitions)
   │ baseline value (locked Phase 1) + target →
   ▼
A10 Baseline Dataset → BaselineMetric (locked)
   │ same metricDefinitionId →
   ▼
A29 Post-Implementation Dataset → Remeasurement
   │ delta →
   ▼
A30 Performance Delta
   │ benefit quantification →
   ▼
A31 Financial Impact → Kaizen.roi
   │ evidence of target met →
   ▼
A33 Executive Summary
```

Every link in the chain reads upward to the problem statement. If A04 is vague, every downstream link is vague.

### 5.8 Reusable template

```
Problem Statement — [Process Name]
Status: [Draft / Approved] · Sponsor: [Name] · Date: [YYYY-MM-DD]

Current state
[One paragraph, past/present tense, observable, quantified.]
Measurement method: [System, field, sample, window.]

Impact
[Quantified effect on time/cost/quality/throughput.]
Dollars: $[X] per [period] [source].
Who is hurt: [stakeholder], frequency: [per period].

Scope
Reference: A03 Scoped Process Definition, v[version].
Start event: [system.field].
End event: [system.field].
Out-of-scope: [≥3 explicit exclusions].

Baseline metric
Primary: [metric name] — current value [X unit] (locked in Phase 1).
Secondary: [metric 1], [metric 2].

Target condition
Primary: [metric] [operator] [value unit], [percentile if applicable].
Secondary: [...].

Timeframe
By Day 30 of this Accelerator (target close: [date]).

Approval
Sponsor: ______________________ Date: _________
Process Owner: ________________ Date: _________
Facilitator: __________________ Date: _________
```

---

## Part 6 — Capacity Model and BAM Scheduling Logic

### 6.1 Roles — Minimum viable vs ideal

| Role | Minimum viable | Ideal | Accountability | Decision rights |
|---|---|---|---|---|
| **Leadership Sponsor** | VP or above with authority over the scope | Named at engagement signature | Go/no-go; escalation; ROI sign-off | Kill decision; out-of-scope item addition; resource reallocation |
| **Facilitator** | Black Belt certified or equivalent; ≥1 prior Kaizen Event | DMAIC-fluent; CadencePlan trained | Method rigor; artifact quality; phase gates | Method calls; artifact acceptance; standup cadence |
| **Process Owner** | Day-to-day owner of the scope | Named before Phase 0 | Baseline acceptance; backlog priority; SOP ownership; sustainment post-close | Backlog priority; SOP approval; sustainment response |
| **Implementation Lead** | Often same as Process Owner | Delegated senior IC | Day 13–23 execution velocity | Sequencing of actions; escalation of blockers |
| **Subject Matter Experts (2–5)** | Practitioners of the process | Covers all in-scope steps | Baseline accuracy; SOP realism; validation | Correct inaccurate artifacts |
| **Analyst** | Data capability (SQL, spreadsheets) | Embedded in Ops or Analytics | A10, A12, A29, A30 | Method proposals; exclusion rule authoring |
| **Finance Partner** | Operations or FP&A partner | Embedded in Finance | A05 cost-basis ack; A31 ROI sign-off | Cost basis; confidence rating acceptance |
| **Decision-maker** | Defaults to Sponsor | Separate for large-scope processes | Scope calls in Phase 2 | Abandonment; scope rotation |

### 6.2 Weekly capacity commitments (hours per role per phase)

| Role | Phase 0 | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Total |
|---|---|---|---|---|---|---|
| Sponsor | 2 | 1 | 1 | 0.5 | 3 | 7.5 |
| Facilitator | 8 | 20 | 28 | 15 | 20 | 91 |
| Process Owner | 4 | 6 | 16 | 8 | 6 | 40 |
| Implementation Lead | 1 | 2 | 12 | 16 | 3 | 34 |
| SME ×3 (avg per SME) | 1 | 6 | 14 | 4 | 3 | 28 |
| Analyst | 1 | 14 | 4 | 2 | 10 | 31 |
| Finance Partner | 1 | 0.5 | 0 | 0 | 4 | 5.5 |

Column totals assume the Accelerator's 5 phases span 30 calendar days / ~22 working days. Kaizen Week (Phase 2) is the crunch; Facilitator effectively runs a full-time week.

### 6.3 Kaizen Week detail (Phase 2, Days 8–12)

Facilitator hours: ~7h/day × 4 days = 28h event + 2–4h prep/recap per day = 30–32h.
Process Owner: full event attendance = 5–6h/day × 4 days = ~22h.
SMEs: present 70–80% of event blocks = 4h/day × 4 days = ~16h each.
Analyst: surfacing baseline data + building tables during event = ~4h.
Sponsor: observer in 1 opening + 1 closing session = ~2h.

If Phase 2 runs as non-consecutive days within a 10-day window, multiply calendar days by 2× but preserve total hours.

### 6.4 Deep / Communication / CI block routing

- **Deep (PROJECT) blocks.** All authoring: A03, A04, A09, A11, A14, A19, A20, A21, A22, A25, A26, A32, A33, A35. All analysis: A10, A12, A13, A17, A29, A30, A31. Event sessions 12–13.
- **Communication blocks.** Sponsor reviews (A04, A07, A11→A15, A34); roster confirmations (A06); ownership assignments (A23); blocker escalations (A27); Finance sign-off (A31); close readout.
- **CI blocks.** Daily execution progress checks (`acc_16_01`); SOP real-time updates (`acc_15_02`); lessons capture (A35); sustainment checks (`acc_gl_05`).

### 6.5 Baseline week (Days 1–7) pattern — one Facilitator day

| Time | Mon | Tue | Wed | Thu | Fri |
|---|---|---|---|---|---|
| 09:00 | Standup (COMM 15) | Standup | Standup | Standup | Standup |
| 09:15 | A09 Data-Capture Plan (PROJECT) | A10 baseline collection (PROJECT) | A11 process mapping (PROJECT) | A13 TIMWOODS scan (PROJECT) | A15 validation meeting (COMM) |
| 11:15 | AM COMM block (access requests) | A10 continued | A12 activity metrics (PROJECT) | A14 SOP drafting (PROJECT) | Lock baseline + advance (CI) |
| 12:00 | Lunch | Lunch | Lunch | Lunch | Lunch |
| 13:00 | PM COMM (SME sync) | PM COMM (Analyst sync) | PM COMM (PO sync) | PM COMM (Sponsor pre-brief) | PM COMM (Phase 2 prep) |
| 13:30 | A09 pilot run (PROJECT) | A10 QA + stats (PROJECT) | A12 table finalize (PROJECT) | A14 SOP draft cont. (PROJECT) | Event agenda A18 (PROJECT) |
| 15:30 | Reflection + CI (end-of-activity reviews) | Reflection + CI | Reflection + CI | Reflection + CI | Weekly gate-review (`acc_gl_03`) (CI) |
| 16:30 | End | End | End | End | End |

### 6.6 Kaizen Week (Phase 2, Days 8–12) pattern

| Time | Day 8 | Day 9 | Day 10 | Day 11 | Day 12 |
|---|---|---|---|---|---|
| 09:00 | Standup | Standup | Standup | Standup | Standup |
| 09:15 | Current-state review (PROJECT 120) | 5 Whys session (PROJECT 120) | Future-state design (PROJECT 180) | Backlog prioritization (PROJECT 120) | SOP v2.0-draft (PROJECT 180) |
| 11:15 | Shared understanding log (CI) | Fishbone (PROJECT 90) | — | — | — |
| 12:00 | Lunch | Lunch | Lunch | Lunch | Lunch |
| 13:00 | Root cause pre-work (PROJECT 120) | Consolidate A17 (PROJECT 60) | Improvement enumeration (PROJECT 120) | Control plan draft (PROJECT 60) | Phase advance check (CI) |
| 15:00 | Daily recap (COMM 30) | Daily recap (COMM 30) | Daily recap (COMM 30) | Sponsor pre-close check-in (COMM 30) | Sponsor read-out (COMM 60) |
| 15:30 | Reflection (CI) | Reflection (CI) | Reflection (CI) | Reflection (CI) | Reflection (CI) |
| 16:30 | End | End | End | End | End |

### 6.7 Implementation week (Days 13–19 or 20–23) pattern — one owner day

| Time | Mon | Tue | Wed | Thu | Fri |
|---|---|---|---|---|---|
| 09:00 | Standup | Standup | Standup | Standup | Standup |
| 09:15 | Execute action N (PROJECT 120) | Execute action N+1 (PROJECT 120) | Execute action N+2 (PROJECT 120) | Execute action N+3 (PROJECT 120) | SOP finalization (PROJECT 120) |
| 11:15 | Blocker triage (COMM 30) if any | Blocker triage if any | Blocker triage if any | Blocker triage if any | Blocker triage if any |
| 12:00 | Lunch | Lunch | Lunch | Lunch | Lunch |
| 13:00 | Execute cont. (PROJECT 120) | Execute cont. (PROJECT 120) | Execute cont. (PROJECT 120) | Execute cont. (PROJECT 120) | Weekly gate-review (CI 30) |
| 15:00 | Daily progress check (CI 15) | Daily progress check (CI 15) | Daily progress check (CI 15) | Daily progress check (CI 15) | Daily progress check (CI 15) |
| 15:15 | SOP real-time update (CI 30) | SOP real-time update (CI 30) | SOP real-time update (CI 30) | SOP real-time update (CI 30) | SOP real-time update (CI 30) |
| 15:45 | PM COMM (1:1 owner sync) | PM COMM (Sponsor update) | PM COMM (SME sync) | PM COMM (PO sync) | PM COMM (Week close) |
| 16:15 | Reflection (CI) | Reflection | Reflection | Reflection | Reflection |
| 16:30 | End | End | End | End | End |

### 6.8 Rebaseline week (Days 24–30) pattern — Facilitator day

| Time | Mon | Tue | Wed | Thu | Fri |
|---|---|---|---|---|---|
| 09:00 | Standup | Standup | Standup | Standup | Standup |
| 09:15 | A29 rebaseline capture (PROJECT 120) | A30 delta build (PROJECT 90) | A31 ROI authoring (PROJECT 120) | A32 control plan final (PROJECT 120) | A33 exec summary (PROJECT 180) |
| 11:15 | A29 QA (PROJECT 60) | A31 prep (PROJECT 60) | Finance sign-off session (COMM 60) | A34 stakeholder validation (COMM 60) | A35 lessons (CI 60) |
| 12:00 | Lunch | Lunch | Lunch | Lunch | Lunch |
| 13:00 | A29 stats (PROJECT 60) | A31 benefit classification (PROJECT 90) | A31 revise if needed (PROJECT 60) | A33 draft (PROJECT 120) | Close event + advance (CI 30) |
| 14:00 | PM COMM (Analyst sync) | PM COMM (Finance pre-brief) | PM COMM (PO sync on A32) | PM COMM (Sponsor pre-brief) | PM COMM (Sponsor close readout) |
| 14:30 | A30 start (PROJECT 60) | A31 drafting (PROJECT 60) | A32 drafting (PROJECT 120) | A33 continued (PROJECT 90) | A36 next-process memo (PROJECT 60) |
| 15:30 | Daily progress (CI 15) | Daily progress | Daily progress | Daily progress | Sustainment setup (CI 30) |
| 15:45 | Reflection (CI) | Reflection | Reflection | Reflection | Reflection |
| 16:30 | End | End | End | End | End |

### 6.9 Capacity risk thresholds

- **Yellow.** Any role's committed hours for the upcoming phase exceed 60% of their normal weekly capacity.
- **Red.** Any role's committed hours exceed 80% of normal weekly capacity, OR any required role is unassigned, OR Phase 2 cannot clear 5 consecutive-equivalent days within a 10-day window.
- **Action on Yellow.** Facilitator warns Sponsor; considers scope reduction.
- **Action on Red.** Facilitator escalates to Sponsor; either Sponsor adds capacity or Accelerator is deferred.

### 6.10 Escalation triggers

- **To Sponsor (same day).** Any missing decision-class blocker in Phase 3; any scope-rotation signal; any Finance non-response >48h.
- **To PMO / Program lead (within 48h).** Any capacity Red; any strategic action at risk of non-completion by Day 23; any method drift on rebaseline.
- **To abandon.** Scope rotation confirmed; Sponsor unavailable for charter or close; baseline cannot lock by Day 7 (even with 3-day extension).

---

## Part 7 — Validation and Control Model

### 7.1 Baseline and rebaseline measurement rules

**Rule B1 — Method parity.** The capture method in A09 is frozen at Phase 1 end. Rebaseline (A29) re-runs the exact same method: same data source, same query, same observation template, same observers (where possible), same time-of-day window.

**Rule B2 — Exclusion parity.** The exclusion rule in A09 is frozen. Rebaseline applies the same exclusion rule to A29. Every excluded row is logged; no silent drops.

**Rule B3 — Sample size.** Baseline n ≥ plan in A09. Rebaseline n = baseline n (±10%). Where baseline n was 30 and post-implementation volume does not support 30 within Phase 4's window, accept a minimum of 10 — but flag in A30 as "low-n rebaseline".

**Rule B4 — Metric definition parity.** `remeasurement.metricDefinitionId === baseline.metricDefinitionId`. Close gate fails otherwise.

**Rule B5 — Outlier handling.** If baseline included outliers and they were kept, rebaseline keeps outliers the same way. If baseline winsorized at 95th percentile, rebaseline winsorizes at the same percentile.

**Rule B6 — Process-change disclosure.** If any process change other than the Accelerator's improvements happened between baseline and rebaseline (system upgrade, org change, policy change), A30 must disclose and A31 must reduce claimed benefit proportionally.

### 7.2 Metric operational definitions

Every metric in A05 carries these fields (repeated from Part 4 but enforced here):

1. **Name.** Unambiguous, human-readable.
2. **Definition.** A paragraph that makes the metric falsifiable for a teammate who has never seen the process.
3. **Unit of measure.** Explicit (hours, days, count, ratio, currency).
4. **Measurement method.** System + field, or observation template.
5. **Sample size + frequency + stratification.**
6. **Exclusion rule.** What runs are dropped and why.
7. **Owner.** Who captures.

### 7.3 ROI logic

Formula (per ARCHITECTURE.md §2.9):

```
roi = (annualBenefitsDollars - implementationCostDollars) / implementationCostDollars
```

**Implementation cost inputs.**
- People time on Phase 0–4 at fully-loaded rate.
- Tools / software purchased or subscribed for this Accelerator.
- Systems changes / engineering time applied.
- Training or coaching costs.
- External consultant time.

**Annualized benefit inputs.**
- Hard dollars: line items on the P&L (reduced vendor spend, captured discounts, recovered revenue). Require P&L line reference.
- Soft dollars: time savings × fully-loaded rate only where a redeployment or FTE-release memo exists. Without the memo, benefit is cost-avoidance, not soft.
- Cost-avoidance: penalties prevented, risks removed, future cost averted. Require a basis calculation (volume × unit penalty × likelihood).

Annualization = 12 × monthly improvement. Monthly improvement = (baseline monthly cost − post-implementation monthly cost), normalized to a month where volume is steady. If volume is seasonal, annualize across the full seasonal cycle rather than multiplying a single month.

**Confidence rating.**
- **Hard.** Every line item has a P&L reference or FTE-release memo.
- **Soft.** No P&L reference; savings are time-based; redeployment asserted but not yet executed.
- **Cost-Avoidance.** Prevented future cost; requires basis calculation.

### 7.4 Confidence thresholds

| Outcome | Definition |
|---|---|
| **Validated** | Primary metric delta ≥ target AND rebaseline n ≥ baseline n AND ROI ≥ 0 AND method parity attested AND Finance signed Hard or Hard-majority. `closeKind = SUCCESS`. |
| **Promising** | Primary metric delta between 50% and 100% of target AND method parity attested. `closeKind = PARTIAL`. |
| **Inconclusive** | Metric moved but method drifted, or n was too low to be significant. `closeKind = PARTIAL` with "inconclusive" note. |
| **Failed (honest)** | Primary metric unchanged or worsened. `closeKind = FAILED_HONEST`. Still closed; lessons captured. |

### 7.5 Defect/quality checks on rebaseline

- Method-drift score (manual check): how many A09 steps changed? >0 triggers flag.
- n vs plan: rebaseline ≥ baseline × 0.9 or flagged.
- Outlier presence vs baseline: similar proportion (±10 percentage points) or flagged.
- Time-of-day / day-of-week coverage: same proportion or flagged.

### 7.6 Documentation quality checks

Every artifact has:
- Required sections per Part 4 complete.
- Evidence attached (raw data, links, screenshots, emails).
- Sign-off captured where required.
- Version tagged.
- Stored in the Kaizen workspace.

### 7.7 Project health checks

Mid-phase signals that the Accelerator is drifting:

| Phase | Signal | Action |
|---|---|---|
| Phase 0 | Sponsor hasn't replied to charter in 48h | Facilitator escalates via alt channel; if 72h, consider deferral |
| Phase 1 | Data-capture pilot failed; Option A extract missing fields | Switch to Option B with observers; extend Phase 1 by 1 day if needed, reduce Phase 2 by 1 day |
| Phase 2 | Root cause list <3 entries by Day 9 | Facilitator extends root cause session; reduces future-state session proportionally |
| Phase 3 | Completion <25% by Day 17 | Escalate to Sponsor; review if strategic items need re-scoping |
| Phase 4 | Finance unresponsive by Day 27 | Sponsor escalates; set hard Finance SLA of Day 28 |

### 7.8 Phase gate reviews (20 gates)

For each of the 20 sub-phases, the reviewer asks:

1. Intake: Sponsor pains captured from interview? KPI gaps quantified? Candidate selected?
2. Scope: Start and end events named with system/field? Out-of-scope list ≥3?
3. Problem statement: Part 5 checklist passed? Sponsor approval?
4. Metrics: Operational definitions complete? Finance cost-basis ack?
5. Roster: All required roles named with per-phase commitments? Finance partner confirmed?
6. Charter: Sponsor signature? Kaizen promoted? Phase = PHASE_1?
7. Data-capture plan: Option chosen with rationale? Pilot passed? Access confirmed?
8. Baseline collection: n ≥ plan? Exclusions logged? Version tagged?
9. Mapping/waste: SME acknowledgement? TIMWOODS all 8 categories?
10. SOPs v1.0: One SOP per activity? SME acknowledgement?
11. Baseline validation: 3+ signatures? Metric locked?
12. Event current-state + root cause: ≥3 root-cause chains? Top 3 endorsed?
13. Event future-state + backlog: Deltas trace to root causes? Backlog prioritized?
14. Ownership: Every action owned + due + acceptance criterion observable?
15. Execution: Daily dashboard live? Blockers triaged within 24h?
16. Phase 3 advance: ≥80% actions done AND zero strategic items open AND SOPs v2.0 final?
17. Rebaseline: Method matches A09? n ≥ baseline × 0.9? Remeasurement bound to Kaizen?
18. ROI: Benefits classified H/S/CA? Finance sign-off? `roi` computed?
19. Close: Control plan signed with calendar holds? Exec summary complete? closeKind correct?
20. Next-process: Scorecard re-scored with lessons? Sponsor decision captured?

### 7.9 Closure requirements

For `Kaizen.state = CLOSED` with `closeKind = SUCCESS`:

- `30d_4_1_rebaseline` CLOSED
- `Kaizen.remeasurementId !== null`
- `remeasurement.metricDefinitionId === baseline.metricDefinitionId`
- `Kaizen.roi !== null`
- `Kaizen.roi >= 0`
- Primary metric delta ≥ target
- `30d_4_5_control_plan` CLOSED with PO signature
- `30d_4_6_final_report` CLOSED
- A15, A31, A32, A33, A34 all present
- Method-parity attestation in A30

---

## Part 8 — Risks, Anti-Patterns, and Mitigation

| # | Risk | Why it happens | Impact | Early warning | Mitigation | Owner |
|---|---|---|---|---|---|---|
| R1 | **Facilitator inexperience.** Facilitator lacks Black Belt fluency; runs Kaizen Event as brainstorm. | Demand exceeds Facilitator supply; firm promotes mid-level to facilitate. | Weak root-cause analysis; backlog of opinions not solutions; ROI challengeable. | No 5-Why chains by end of Day 9; Root Cause List < 3 entries. | Require ≥1 prior Kaizen Event; pair-facilitation with senior for first run; PMO reviews A17. | PMO |
| R2 | **Data quality — no system logs + no observation time.** Option A not feasible; Option B not staffed. | Facilitator discovered access gap in Phase 1; SME bandwidth not reserved. | No baseline; project stalls or fakes data. | `acc_07_01` feasibility note fails; `acc_07_03` access requests pending ≥3 days. | Phase 0 pre-flight checklist on data access; SME observation slots reserved on calendar during Phase 0. | Facilitator |
| R3 | **Leadership misalignment mid-flight.** Sponsor changes mind in Phase 2; wants a different scope. | Executive attention rotates; peer-VP raises concern about scope. | Charter invalidated; rework; abandoned or scope-rotated Kaizen. | Sponsor starts asking "what about process X?" in Phase 1 checkpoints. | A07 charter names every org unit touched; Sponsor re-confirms at Phase 1 end; `acc_gl_04` abandon/restart path. | Sponsor |
| R4 | **Scope creep in Phase 2.** Event exposes upstream issues; team wants to absorb. | Root cause crosses the A03 boundary. | Timeline slips; Phase 3 implementation unbounded. | Improvements in A22 reference upstream systems outside A03. | Facilitator holds A03 boundary; upstream causes logged as "out-of-scope follow-ups" for next Accelerator. | Facilitator |
| R5 | **Implementation delay — owner unavailable.** Assigned owner dedicates to a different priority. | Competing priorities; no reserved calendar. | `doneAt` not set; Phase 3 advance blocked; Day 23 gate fails. | `acc_16_01` dashboard stuck on the same actions for 3 consecutive days. | `acc_14_03` calendar reservation; Sponsor can escalate to owner's manager; Facilitator proposes reassignment. | Implementation Lead |
| R6 | **False ROI — soft dollars claimed as Hard.** Benefits computed from time-saved × rate with no redeployment. | Pressure to show positive ROI; Finance absent or rubber-stamps. | Portfolio ROI inflated; Finance eventually challenges; trust erodes. | A31 has "time saved" lines with no FTE-release memo. | Part 7 ROI logic enforced; Finance required on A05 and A31; Hard claims need P&L reference or memo. | Finance partner |
| R7 | **SOP drift.** Real behavior diverges from A26; audit finds non-compliance. | `acc_15_02` skipped; SMEs update SOPs late or never. | Phase 4 diff comparison broken; sustainment impossible. | A25 and A26 diverge in row count. | `30d_3_6` gate requires A26 parity; Facilitator spot-checks on Day 20. | Facilitator |
| R8 | **Kaizen-week-as-theater.** Phase 2 runs as a workshop with slides but no decisions; root cause list is brainstormed, not analyzed. | Facilitator runs consensus rather than rigor. | A17 weak; A19 arbitrary; Phase 3 solves wrong problem. | A17 has single-level "whys"; Fishbone ignores 6M. | Facilitator script includes 5-Why termination criteria; Planning Agent flags premature termination. | Facilitator |
| R9 | **Stakeholder no-show.** Sponsor skips Phase 1 validation or Phase 4 close. | Calendar reality for senior leaders. | Baseline never locked; close blocked; timeline slips. | No Sponsor RSVP for `acc_11_01` or `acc_19_02` within 24h of request. | Charter pre-schedules calendar holds for Phase 1 validation and Phase 4 close; PMO escalates if declined. | Facilitator + PMO |
| R10 | **Tool/system access blockers.** IT ticket for data access takes 5 days. | Org bureaucracy; no named IT partner. | Phase 1 baseline delayed; Option B fallback required. | `acc_07_03` access ticket open ≥ 48h. | Phase 0 names an IT partner; Facilitator escalates at 48h. | Facilitator |
| R11 | **Regulatory/compliance surprise.** A proposed improvement violates a compliance requirement in Phase 2. | SME or Process Owner did not surface compliance context. | Future-state redesign; backlog rework; possible scope reduction. | Compliance-flagged item surfaces after A19 published. | A06 includes a Compliance liaison as optional role when scope touches regulated data; `acc_02_03` captures compliance constraints as out-of-scope items. | Facilitator |
| R12 | **Change fatigue.** Team has just finished another transformation; capacity and willingness low. | Overlapping programs; HR/ops bandwidth full. | Low engagement; artifacts thin; sustainment fragile. | Attendance <70% in standups or event sessions. | Phase 0 capacity check against concurrent programs; Sponsor coordinates with HR/PMO to sequence. | Sponsor |
| R13 | **Metric instability (non-stationary process).** Baseline is measured during an anomalous period (quarter-end, migration). | Phase 1 window happened to overlap with an anomaly. | Baseline non-representative; Phase 4 delta misleading. | A12 stdev exceptionally high; anomalies flagged in A10. | Facilitator extends baseline window by 2 days; A15 sign-off requires explicit "representative period" attestation. | Analyst |
| R14 | **Silent abandonment without documentation.** Project dies quietly; no lessons captured. | Sponsor disengages; team moves on; no formal close. | Org loses learning; pattern repeats. | No standup notes for 3 consecutive days; no artifact updates for 5 days. | `acc_gl_04` formal abandon path; Facilitator must file A35 lessons even on abandonment. | Facilitator |
| R15 | **Negative ROI hidden.** Team publishes a "win" narrative despite `roi < 0`. | Political pressure; fear of FAILED_HONEST close. | Portfolio mistrust when the truth surfaces. | A31 signed despite cost > benefit; A33 avoids ROI section. | Engine enforces `closeKind` from `roi` sign; A33 template requires explicit ROI section; PMO spot-checks. | PMO |
| R16 | **Sponsor signature bottleneck.** Every sign-off (A04, A07, A15, A34) blocks on one calendar. | Single Sponsor for many concurrent Accelerators. | Timeline drift; multiple projects stalled on same person. | Sign-offs queued >48h across two Accelerators. | Sponsor delegate for specific artifacts (A04, A15) where possible; Sponsor retains A07 and A34. | Sponsor |

---

## Part 9 — AI-Native Implementation Opportunities

Binding the 20 sub-phases to the five agents specified in `AI_AGENTS.md` (Planning, Momentum, Context, Reflection, Composer Explainer). No new agents are introduced.

### 9.1 Sub-phase 01 — Intake and candidate process selection

- **Human-required.** Candidate selection (`acc_01_04`). Sponsor pain interpretation.
- **AI-assisted.** KPI-gap pull (`acc_01_02`) with Context Agent pre-populating source fields. Scorecard drafting (`acc_01_03`) with Planning Agent flagging candidates with weak baseline-feasibility.
- **AI-automatable.** Structured extract of scorecard rows. Template population for A02.

### 9.2 Sub-phase 02 — Scope definition

- **Human-required.** Boundary-event decision (`acc_02_01`).
- **AI-assisted.** System/role/persona enumeration (`acc_02_02`) with Context Agent pulling from prior Accelerators on same org. A03 drafting by Composer Explainer.
- **AI-automatable.** Template population; out-of-scope suggestions from pattern library.

### 9.3 Sub-phase 03 — Problem statement

- **Human-required.** Sponsor approval (`acc_03_02`).
- **AI-assisted.** Composer Explainer drafts A04 from A01 + A03; Planning Agent flags solution-prescribing language and vague impact.
- **AI-automatable.** Checklist lint (Part 5 checklist).

### 9.4 Sub-phase 04 — Metrics

- **Human-required.** Primary metric choice (`acc_04_01`). Finance cost-basis ack.
- **AI-assisted.** Operational definition drafting (`acc_04_02`) with Planning Agent lint for ambiguity.
- **AI-automatable.** Metric taxonomy lookup; sample-size suggestion based on process category.

### 9.5 Sub-phase 05 — Roster

- **Human-required.** Role confirmations.
- **AI-assisted.** Context Agent surfaces prior Accelerator rosters for similar scopes.
- **AI-automatable.** Template population.

### 9.6 Sub-phase 06 — Charter + kickoff

- **Human-required.** Sponsor signature; working agreement.
- **AI-assisted.** Composer Explainer consolidates A07 from upstream artifacts.
- **AI-automatable.** Timeline visual generation.

### 9.7 Sub-phase 07 — Data-capture decision

- **Human-required.** Option A/B call (`acc_07_01`).
- **AI-assisted.** Context Agent pre-populates known data sources.
- **AI-automatable.** Access ticket generation.

### 9.8 Sub-phase 08 — Baseline collection

- **Human-required.** Observations (Option B).
- **AI-assisted.** Planning Agent diffs exclusions across runs.
- **AI-automatable.** Summary stats computation (`acc_08_03`).

### 9.9 Sub-phase 09 — Mapping + waste

- **Human-required.** SME validation; TIMWOODS judgment.
- **AI-assisted.** Composer Explainer drafts swimlane from dataset; Reflection Agent surfaces prior TIMWOODS patterns.
- **AI-automatable.** Activity Breakdown Table from timestamped dataset.

### 9.10 Sub-phase 10 — Baseline SOPs

- **Human-required.** SME acknowledgement.
- **AI-assisted.** Composer Explainer drafts SOPs from A11 + A12.
- **AI-automatable.** Template population; version tagging.

### 9.11 Sub-phase 11 — Baseline validation + lock

- **Human-required.** Sponsor + PO + SME sign-offs.
- **AI-assisted.** —.
- **AI-automatable.** BaselineMetric lock mechanics.

### 9.12 Sub-phase 12 — Current-state review + root cause

- **Human-required.** Full team engagement; 5-Why + Fishbone judgment.
- **AI-assisted.** Planning Agent flags premature 5-Why termination.
- **AI-automatable.** Fishbone template scaffolding.

### 9.13 Sub-phase 13 — Future-state + backlog

- **Human-required.** Future-state design judgment; backlog prioritization.
- **AI-assisted.** Composer Explainer diffs A19 vs A11; Planning Agent scores improvements.
- **AI-automatable.** SOP v2.0-draft from A14 + A19 deltas.

### 9.14 Sub-phase 14 — Ownership

- **Human-required.** Owner acceptance.
- **AI-assisted.** Planning Agent flags over-assigned owners; Composer Explainer generates acceptance criteria drafts.
- **AI-automatable.** Calendar reservation across owners.

### 9.15 Sub-phase 15 — Execution

- **Human-required.** Implementing changes.
- **AI-assisted.** Momentum Agent coaches on next step per owner.
- **AI-automatable.** SOP real-time delta generation; change log template population.

### 9.16 Sub-phase 16 — Blocker resolution

- **Human-required.** Sponsor escalation calls.
- **AI-assisted.** Planning Agent flags recurring blocker patterns.
- **AI-automatable.** Dashboard snapshot generation.

### 9.17 Sub-phase 17 — Rebaseline + delta

- **Human-required.** Observations (Option B).
- **AI-assisted.** Planning Agent lints method drift vs A09.
- **AI-automatable.** Summary stats; delta computation.

### 9.18 Sub-phase 18 — ROI

- **Human-required.** Benefit classification judgment; Finance sign-off.
- **AI-assisted.** Planning Agent flags missing evidence on Hard claims.
- **AI-automatable.** `computeRoi()` call; annualization math.

### 9.19 Sub-phase 19 — Control plan + report

- **Human-required.** PO signature; Sponsor readout.
- **AI-assisted.** Composer Explainer drafts A32 from `acc_13_04` draft + A30; drafts A33 from all upstream artifacts; Reflection Agent synthesizes A35.
- **AI-automatable.** Calendar hold creation for 30/60/90.

### 9.20 Sub-phase 20 — Next-process

- **Human-required.** Sponsor decision.
- **AI-assisted.** Context Agent re-scores A02 with lessons.
- **AI-automatable.** Memo template population.

### 9.21 Telemetry to capture per agent

- Planning Agent: flag hit-rate; user accept/dismiss per flag category.
- Momentum Agent: coaching impression → action-taken conversion.
- Context Agent: pre-populate suggestion acceptance.
- Reflection Agent: lesson-generation acceptance.
- Composer Explainer: why-chip expand rate on Accelerator blocks.

---

## Part 10 — Final Deliverable Set and Operationalization

### 10.1 Deliverable index

| Deliverable | Location in this standard |
|---|---|
| The refined project standard | Part 1 + Part 2 |
| Complete task catalog | Part 3 (72 tasks) |
| Complete artifact catalog | Part 4 (A01–A36; 36 artifacts) |
| Phase-gate model | Part 2 entry/exit + Part 7 gate reviews (20 gates) |
| Capacity model | Part 6.1 – 6.3 |
| BAM scheduling guide | Part 6.5 – 6.8 (four worked calendar patterns) |
| Problem statement template | Part 5.8 |
| Project closure and ROI validation standard | Part 7 |
| Risk register | Part 8 |
| AI binding | Part 9 |

### 10.2 Next steps for operationalization

**As a BAM project type.**

1. **Patch `PROJECT_TYPE_30D_KAIZEN.md` §3:** add Finance partner to `30d_0_5` required participants (currently lists Facilitator + Process Owner). Part 1.6 refinement #1.
2. **Patch `PROJECT_TYPE_30D_KAIZEN.md` §3.3:** add a control-plan draft output to `30d_2_5_define_improvements` (monitoring metric, frequency, threshold, response per strategic item). Part 1.6 refinement #2.
3. **Patch `PROJECT_TYPE_30D_KAIZEN.md` §4.2:** Phase 3→4 guard should gate on "no strategic action open" in addition to ≥80% count. Part 1.6 refinement #5.
4. **Patch `ARCHITECTURE.md` §3.4 (Phase FSM):** add explicit scope-change event → abandoned state transition. Part 1.6 refinement #4.
5. **Patch `DELIVERY_PLAN.md` E13-T2:** extend `canAdvancePhase('PHASE_4')` to implement the weighted strategic-item rule.

**As a software product workflow.**

6. **E13 epic refinement:** add E13-T10 "Accelerator operating standard surfaces" — surfaces that render Part 7 gate review questions inline on KaizenCard at each phase boundary.
7. **New epic E14 — Pipeline / Portfolio views:** the current spec covers one Accelerator at a time; PMOs run multiple concurrent Accelerators across Sponsors. Portfolio view would render a pipeline of Accelerators by phase with ROI rollup and sustainment status. Not covered by v0.1; flagged for coordinator synthesis.
8. **New epic E15 — Sustainment engine:** implements `acc_gl_05` Day 60 and Day 90 sustainment checks as scheduled activities post-CLOSED. Current FSM has no states for post-close monitoring; consider a `SUSTAINING` state with `Kaizen.sustainmentMetricId` + 30/60/90 check-in rows.
9. **Artifact template library:** 36 artifacts require a seed library of editable templates. Not currently in `CATALOG_GAPS.md`. Add §J "Accelerator artifact template library" with 1-page specs per A01–A36.
10. **Intake form / candidate-process UI:** Part 3 sub-phase 01 implies an intake UI that doesn't exist. `/kaizen/accelerator/intake` placeholder route; surfaces A01/A02 authoring.

**As an AI-agent-compatible operating model.**

11. **Agent binding table:** add to `AI_AGENTS.md` §2.6 "Accelerator bindings" with Part 9's 20 sub-phase → agent mappings.
12. **Telemetry:** capture per-task-template AI acceptance rate (Part 9.21 events) to drive the Accelerator's artifact-template continuous improvement.
13. **Agent guardrails:** Planning Agent flags solution-prescribing language in A04 — add rubric to agent config. Similar rubric for `acc_14_02` acceptance criteria observability.

### 10.3 Doc inconsistencies flagged for the coordinator

- **Finance partner role.** `PROJECT_TYPE_30D_KAIZEN.md §3.1` `30d_0_5_identify_stakeholders` does not list Finance partner as a required role for Accelerator, yet `30d_4_3_calculate_roi` requires Finance sign-off. Inconsistency: the role needed for close is never required at kickoff. Fix in §3.1.
- **Control plan timing.** `PROJECT_TYPE_30D_KAIZEN.md §3.5` places control plan exclusively in Phase 4. Authoring at Day 29 leaves no sustainment test time. This standard recommends moving control-plan draft to Phase 2 (part of `30d_2_5`).
- **Phase 3 weighted completion.** `PROJECT_TYPE_30D_KAIZEN.md §4.3` Phase 3→4 guard computes a simple ratio; this ignores strategic-item weighting. Fix recommended in §4.3.
- **Scope-change path.** No explicit event exists in `ARCHITECTURE.md §3.4` for scope rotation. Currently the only path is manual abandonment. Recommend `ScopeChangeAbandoned` event.
- **Sustainment after CLOSED.** `ARCHITECTURE.md §3.3` has no post-CLOSED state for sustainment monitoring. `acc_gl_05` cannot be modeled as a scheduled activity against a CLOSED Kaizen without a new state or extension.
- **Artifact 25 vs 36.** User brief names 25 artifacts; this standard adds 11 during validation. Coordinator should decide whether to promote the 11 additions to the catalog (recommendation: yes, because they are gate-enforceable; see A08, A09, A16, A18, A22, A24, A27, A28, A34, A35 and the reused A36 per user list).

### 10.4 Estimated effort to run one full Accelerator

Using the Part 6.2 per-role weekly totals across the 30-day envelope:

| Role | Total hours |
|---|---|
| Sponsor | 7.5 |
| Facilitator | 91 |
| Process Owner | 40 |
| Implementation Lead | 34 |
| SMEs (3 × 28) | 84 |
| Analyst | 31 |
| Finance Partner | 5.5 |

**Total person-hours across all roles: ~293 hours per Accelerator (single run, one process).** At fully-loaded $95/hr average, that is ~$27,800 in people cost. This is the implementation-cost floor that A31 Hard inputs must clear for any ROI > 0 claim.

A PMO running Accelerators in parallel can amortize Facilitator and Analyst time across runs (not 1:1 scaling). Sponsor and Process Owner time does not amortize.

---

## Glossary

| Term | Definition |
|---|---|
| **The Accelerator** | 30-day Kaizen Accelerator project type; Kaizen with `projectType='KAIZEN_ACCELERATOR_30D'`. |
| **CadencePlan** | The product. |
| **BAM OS** | Internal engine reference. |
| **The Agility Mechanism** | The methodology. |
| **Cadence Day / Week / Sprint / Month** | User-facing cycle names. |
| **Standard Work Catalog** | The primitive library. |
| **The 4-2-2 Day** | Daily composition pattern (4h PROJECT / 2h COMMUNICATION / 2h CI). |
| **Friction Signal / Validated Kaizen** | Feature nouns. |
| **Deep Block** | 4h PROJECT bucket chunk. |
| **Phase gate** | Catalog entry whose closure is required to advance phase. |
| **Pace warning** | Non-blocking telemetry when phase exceeds target days. |
| **Weighted completion** | Phase 3→4 guard extension: ≥80% count AND zero strategic items open. |
| **Method parity** | Rebaseline uses identical method, exclusions, sample frame as baseline. |
| **Sustainment** | Post-close Day 60 and Day 90 monitoring of control plan. |
