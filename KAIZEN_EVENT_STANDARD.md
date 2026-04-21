# CadencePlan Kaizen 90 — Operating Standard

Owner: Master Black Belt / Kaizen Event Architect / PMO Governance Architect / AI-Native Operating Model Designer
Status: v1.0 — authoritative operating standard for the **90-Day Kaizen Event Project** inside CadencePlan. Recommended architectural binding: `Kaizen.projectType='KAIZEN_EVENT_90D'` (Option B — see Part 11). Catalog anchors: `#42`–`#50` (Business Agility Standard Work Kaizen Event set).
Scope: Canonical doctrine for planning, staffing, running, validating, and closing a 90-day cross-functional Kaizen Event Project with a 5-day Kaizen Week as its center of gravity. Facilitators, PMOs, operational-excellence teams, Process Owners, and AI agents treat this as authoritative. Ground docs: `ACCELERATOR_STANDARD.md` v1.0, `DMAIC_STANDARD.md` v1.0, `PROJECT_TYPE_30D_KAIZEN.md` v0.2, `PRODUCT_BLUEPRINT.md` v0.3, `ARCHITECTURE.md` v0.4 (§2.9 Kaizen, §3.3 Kaizen FSM, §3.4 Phase FSM, §4.5 R9 DAG, §6.1 events), `ENGINE_DESIGN.md` v0.3 (§4.2 DMAIC DAG, §4.3 Kaizen Event burst), `CATALOG_GAPS.md` v0.2 (§B.5, §B.6, §C.5, §C.6 for #42–#50 canonical procedures), `docs/Business Agility Standard Work.txt`, `UX_FLOWS.md` v0.2.2, `DELIVERY_PLAN.md` v0.2, `AI_AGENTS.md` v0.1.

> This is an **operating standard**, not an architectural spec. It extends the 9 BAM Kaizen Event catalog entries (`#42`–`#50`) — originally designed in `ENGINE_DESIGN.md §4.3` for a 1–5 day burst — into the ~88 observable work tasks a cross-functional team executes across a 90-day envelope. It names the artifacts, the owners, the decisions, the acceptance gates, and the failure modes. It does not re-specify the Kaizen FSM or the composer — those remain authoritative in `ARCHITECTURE.md §3.3` and `ENGINE_DESIGN.md §1` / §4.3. The 90-Day Kaizen differs from The Accelerator (30-day) in three operationally material ways: (1) it is built around a week-long **Kaizen Week** of co-located team redesign, which the Accelerator compresses into 5 non-consecutive days; (2) it budgets **10 weeks of post-event implementation** plus **3 weeks of sustainment**, which 30 days cannot hold; (3) its scope is **cross-functional medium-high complexity** — processes crossing 2–4 org units — which The Accelerator deliberately scopes down to a single functional unit. It differs from DMAIC in that DMAIC spends the time on statistical rigor (regression, DOE, Capability) while 90-Day Kaizen spends it on **cross-functional change management and adoption**.

---

## Part 1 — Executive Validation of the 90-Day Kaizen Event Model

### 1.1 Concise project model

A 90-Day Kaizen Event Project in CadencePlan is a `Kaizen` record with `projectType='KAIZEN_EVENT_90D'` (recommended — see Part 11 architectural call) running across four macro-phases over ~13 working weeks: **Pre-Event** (Days 1–14), **Event** (Days 15–19, the Kaizen Week), **Post-Event Implementation** (Days 20–70), and **Sustainment** (Days 71–90). The project walks the 9 BAM Kaizen Event catalog entries `#42`–`#50` as phase-bound payload, with ~79 additional operationally distinct tasks layered as intake, baseline capture, cross-functional stakeholder alignment, pre-event preparation, daily event operations, post-event backlog execution, change management, SOP adoption, rebaseline, ROI sign-off, Control plan authoring, and Process Owner transition.

Phase boundaries are enforceable by guards analogous to the Accelerator's `canAdvancePhase()` (`ARCHITECTURE.md §3.4`): no Event without a locked Charter + baseline; no Post-Event without a signed Implementation Backlog; no Sustainment without ≥80% strategic items done AND adoption held for ≥5 consecutive working days; no close without rebaseline on the same `metricDefinitionId` as baseline AND Finance-signed ROI AND signed Control Plan. The composer scopes Deep-block payload to the current phase; the Kaizen Week (Phase 2, Days 15–19) packs the PROJECT bucket with `#45`–`#47` Event-phase activities plus event-internal breakouts in COMMUNICATION blocks.

The Kaizen 90 output is not a kaizen poster on a wall — it is a CLOSED `Kaizen` row with locked baseline, rebaseline on the identical metric definition, Finance-signed ROI (Hard / Soft / Cost-Avoidance classification applied), a signed Control Plan with live monitoring, a `#49` Results Narrative 3-Pager (extended to ~6 pages for the 90-day scope), a `#50` Process Owner Transition document, and a Process Owner who now owns the redesigned process.

### 1.2 Business problem it solves

The 90-Day Kaizen Event Project exists because four classes of operational problem fall between the Accelerator and DMAIC — and between a simple 5-day Kaizen Event and a formal multi-month project:

| # | Pain | What Kaizen 90 does about it |
|---|---|---|
| 1 | **Cross-functional processes with no single owner.** Order-to-cash, hire-to-retire, patient intake, procure-to-pay — nobody owns them; handoff defects dominate; each function blames the next. The Accelerator's 30-day envelope cannot complete cross-functional redesign + adoption. | Pre-Event phase forces multi-function roster + accountability matrix; Kaizen Week forces co-located redesign with all functions in the room; Post-Event 10 weeks gives enough runway for all functions to adopt together. |
| 2 | **Event theater.** A team runs a 5-day Kaizen event, generates a backlog of 30 items, and 60 days later 7 are done, 15 are still "in progress," and 8 have been quietly forgotten. No rebaseline, no ROI, no sustainment. | Post-Event Implementation phase is day-boxed with weekly sprint rhythm; Sustainment gate refuses to open rebaseline until adoption has held for 2 consecutive weeks; Close gate refuses without rebaseline + Finance sign-off. |
| 3 | **Implementation runway gap.** Many processes cannot be redesigned AND adopted in 30 days — training, SOP rollout, system configuration, multi-team coordination take longer. But they don't need 6 months of DMAIC statistics; the root cause is already known. | 90 days gives a realistic envelope: 2 weeks to scope + baseline + prep, 1 week to redesign, 10 weeks to implement + train + adopt, 3 weeks to rebaseline + validate + sustain. |
| 4 | **ROI that doesn't survive Finance.** CI teams publish "we saved 20%" claims; Finance finds the math uses fully-loaded labor rates on time-savings with no redeployment plan; program credibility erodes. | Part 8 ROI model requires Hard / Soft / Cost-Avoidance classification per benefit line, Finance partner named at Pre-Event (not Sustainment), and Finance co-sign on `implementationCostDollars` + `annualBenefitsDollars` before `KaizenService.close()` will compute `roi`. Negative ROI is allowed to close with `closeKind='FAILED_HONEST'` so the portfolio shows truth. |

### 1.3 When to use Kaizen 90 vs The Accelerator vs DMAIC vs simple 5-day Kaizen Event

This is the single most consequential decision in the CadencePlan project-type taxonomy. Use the decision table strictly.

| Axis | 5-day Kaizen Event (standalone) | The Accelerator (30-day) | **Kaizen 90 (90-day)** | DMAIC (4–10 months) |
|---|---|---|---|---|
| **Scope breadth** | 1 function, 1 sub-process | 1 function, 1 process | **2–4 functions, 1 cross-functional process** | 2–6 functions, 1 chronic-variance process |
| **Complexity** | Low-medium | Medium | **Medium-high** | High |
| **Root cause state** | Known | Known or easily discoverable | **Known — but implementation crosses boundaries** | Unknown; must be statistically validated |
| **Kaizen Week redesign central?** | Yes, but stops at event-end | No — distributed across 5 non-consecutive days | **Yes, Days 15–19 co-located** | No — redesign is distributed across Improve sprints |
| **Implementation runway required** | 0–30 days sustainment | 22 working days | **50 working days post-event** | 60–90 working days across Improve + Control |
| **Statistical rigor required** | Descriptive stats; before/after compare | Summary stats; Cpk if spec limits | **Summary stats + adoption tracking** | Hypothesis testing, regression, Capability, Control charts |
| **Baseline n** | 10 samples or 1 representative window | ≥30 continuous or 3–5 observational runs | **≥30 continuous OR ≥100 proportions; cross-functional handoff sampling** | n ≥ 30 continuous or n ≥ 100 proportions; MSA mandatory |
| **Typical cross-functional handoffs in scope** | 0–1 | 0–1 | **2–4** | 3–6 |
| **Change-management weight** | Light (event team = adopter) | Medium (single function adopts) | **Heavy — named ChM plan, training, sentiment tracking** | Medium-Heavy (Control plan does most of the ChM work) |
| **Process Owner commitment** | 3–5 event days + 30-day check | 30 days across 5 phases | **90 days across 4 macro-phases; 100% during Kaizen Week** | 4–10 months; 4 non-negotiable touchpoints |
| **Sponsor time** | 2–4 h | 4–6 h | **8–12 h across 90 days** | 10–15 h across 4–10 months |
| **Typical annualized ROI** | $10K–$250K | $50K–$1M | **$200K–$3M** | $250K–$10M |
| **Required roles beyond core** | SMEs | Finance partner, Analyst | **Finance partner, Implementation Lead (new), Change-Management partner** | Black Belt cert, Master Black Belt reviewer, Analyst |

**Operational decision rules (apply in order):**

1. **If the root cause is unknown and the problem is chronic high-variance:** DMAIC. Not Kaizen 90 — Kaizen 90 assumes root cause is known by end of Kaizen Week Day 1.
2. **If the process is single-function, single-owner, and can be redesigned + adopted in 30 days:** The Accelerator. Kaizen 90 is overkill; 60 of its 90 days would be dead time.
3. **If the team can redesign AND adopt in 5 days (pure tactical burst, no cross-functional implementation):** 5-day Kaizen Event standalone. Kaizen 90's Pre-Event + Post-Event phases add ceremony without value.
4. **If the process crosses 2–4 functions, has known root causes but non-trivial cross-functional adoption cost, and needs rebaselined ROI inside a quarter:** **Kaizen 90.** This is its native terrain.
5. **If leadership wants the ritual of a Kaizen Week AND needs implementation tracking AND 30 days is insufficient for cross-functional rollout:** **Kaizen 90.** Do not choose Accelerator just because it is shorter — the Accelerator's guard gates will refuse to advance if implementation isn't done by Day 23.

**Promotion and demotion paths:**

- Kaizen 90 → Accelerator: if Pre-Event discovers the scope is single-function after all, abandon and restart as Accelerator. Do not silently re-scope.
- Accelerator → Kaizen 90: if Phase 2 reveals the process actually crosses 3 functions, abandon and restart as Kaizen 90. Do not extend the Accelerator's envelope.
- Kaizen 90 → DMAIC: if Kaizen Week Day 2 (root cause) cannot converge on a validated cause because variability is too high, abandon and promote to DMAIC. The Pre-Event baseline seeds `#28` DMAIC Baseline.
- 5-day Kaizen Event → Kaizen 90: if a standalone Kaizen Event's 30-day sustainment check shows <50% backlog done, promote the residual to Kaizen 90 with a new Charter covering the unfinished scope.

### 1.4 Why a 90-Day Kaizen exists — the implementation-orphan problem

A standalone 5-day Kaizen Event leaves implementation orphaned. Industry data shows that 55–70% of Kaizen events fail sustainment at 90 days not because the redesign was wrong, but because:

1. The event ends Friday; Monday everyone returns to BAU with a 30-item backlog nobody owns.
2. The Process Owner commits "verbally" during the event but has no protected capacity Monday.
3. Training materials are drafted on Day 5 but never delivered.
4. System configuration changes require IT tickets that take 4 weeks — by which time the momentum is gone.
5. Sponsor attended Day 1 and Day 5 and does not revisit until the 90-day check, where a flat metric is blamed on "poor execution."
6. No rebaseline — the team claims success based on Kaizen Week anecdotes, Finance refuses to book benefit, the program loses credibility.

The 90-Day Kaizen exists because **the event is only ~5% of the work**. Kaizen 90 budgets the other 95% explicitly: named owners, reserved Deep blocks, weekly sprint rhythm during Days 20–70, daily standup during Pre-Event and Event and weekly status during implementation, and a dedicated Sustainment gate (Part 7 §7.9).

### 1.5 Why traditional Kaizen events fail — five named failure modes

1. **Event theater (no execution follow-through).** The week produces a poster, a photo, and a backlog; nothing ships in the next 30 days. Root cause: the event is organizationally separate from the team's operating cadence; no weekly status rhythm locks the backlog to reality.
2. **Baseline theater.** "The current cycle time is about 3 days" — no measurement system, no sample size, no operational definition. The rebaseline is equally anecdotal. Root cause: Pre-Event is compressed into 2 days with no Baseline data-capture plan.
3. **Process Owner absenteeism.** The PO attends Day 1 (kickoff) and Day 5 (readouts) but skips Days 2–4 (where redesign happens). Root cause: nobody named "Process Owner attendance for all 5 days" as a Sponsor-enforced non-negotiable at charter.
4. **No rebaseline — drift invisible.** Event closes with a future-state poster; 90 days later, nobody re-runs the measurement. Sustainment claim is hope, not data. Root cause: rebaseline was never scheduled; Control plan is a PDF nobody opens.
5. **ROI inflation or ROI silence.** Either "we saved $800K!" (fully-loaded labor × time-saved × FTE-count × 0.8 with no redeployment) or silence ("we didn't want to put a number on it"). Root cause: no Finance partner named at Pre-Event; benefit classification absent; Sponsor wants a number, team invents one.

### 1.6 Key weaknesses in current Kaizen-Event approaches (industry-wide)

1. **Roster ambiguity on cross-functional scope.** Five-day events routinely underweight Function B's participation because "we'll loop them in for training after"; Function B then reverse-engineers the redesign unfavorably.
2. **Compressed Pre-Event.** Traditional practice budgets 1–3 days of pre-work; this is insufficient for cross-functional scope + baseline n ≥ 30.
3. **No backlog prioritization model.** Post-event backlogs are flat "to-do" lists with no impact × ease sequencing; teams default to easy items first and defer structural changes until momentum dies.
4. **Training-without-adoption.** Training is delivered once, attendance logged, adoption never checked. Weeks 8–10 performance shows old behavior because 30% of the affected population never actually practiced the new SOP.
5. **Control plan drafted at Day 90.** Control plan is often authored the day before close, with no time to pilot. Real sustainment practice starts after handoff, when nobody is watching.
6. **Single-project orientation.** Traditional Kaizen events are not seen as a portfolio feeder. The next process is intaken fresh; scorecard rationale from the prior event is not reused.
7. **No telemetry.** No data on standup attendance, Deep-block protection, SOP adoption rate, backlog velocity — so the Facilitator's only signal is subjective.

### 1.7 Refinements to make Kaizen 90 execution-ready (5 concrete)

1. **Move Charter sign-off to Day 4 (not Day 1 of Kaizen Week).** The Charter must be signed *before* the Kaizen Week starts. Pre-Event Days 1–14 produce the signed Charter, baseline, SOPs, and stakeholder alignment. Kaizen Week Day 1 opens with the Charter on the wall, not being written live.
2. **Require Finance partner on Pre-Event roster (not "we'll find one later").** Same refinement the Accelerator made — elevate Finance from "nice-to-have" to required role at Pre-Event Day 5. Without this, Day 85 ROI sign-off blocks on a role never assigned.
3. **Author Control plan draft during Kaizen Week Day 5 (not Day 85).** Part 7 Sustainment model requires the Control plan to *exist* in draft form by end of Kaizen Week; Days 70–90 only validate and finalize. Gives the Process Owner 10 weeks to challenge sustainment design before it's signed.
4. **Introduce the Sustainment Gate at Day 70.** Before rebaseline starts, verify adoption has held for 2 consecutive working weeks. If not, delay rebaseline by 2 weeks; flag to Sponsor. Rebaselining on an un-adopted SOP produces false-negative ROI.
5. **Weekly backlog tracking ceremony — not daily.** Days 20–70 use a 30-min Monday planning + 15-min Wednesday check + 30-min Friday demo/retro. Daily standup during implementation is diminishing-returns overhead; weekly rhythm matches the cross-functional team's attention pattern better.

### 1.8 Critical success factors (8)

1. **Sponsor named, reachable, and has decision authority for ALL org units in scope before `#42` Charter signing.** Cross-functional scope makes Sponsor authority a hard constraint; if Sponsor only owns Function A, the project dies at Week 7 when Function B refuses a structural change.
2. **Process Owner commits to 100% attendance at Kaizen Week (all 5 days), weekly Post-Event status, and Sustainment Gate.** "Too busy for the full week" = project failure.
3. **Finance partner named on Pre-Event roster Day 5 with availability for Day 78–85 ROI window.**
4. **Baseline has operational definition and measurement method before Kaizen Week starts.** The Event cannot be scheduled without `#43` Output DCP approved.
5. **Implementation Lead named (separate from Facilitator and Process Owner) for Days 20–70.** This is the difference between 30% and 80% backlog completion.
6. **Cross-functional roster has an Executive Sponsor from each function OR a single cross-functional Sponsor with confirmed authority over all.** Named at Charter.
7. **Change-Management partner identified by Day 10.** Not "we'll handle comms internally"; a named person owns the communication cadence, training, and adoption tracking.
8. **Team capacity reserved, not hoped for.** Kaizen Week is 100% commitment; Post-Event blocks are held on calendars before Day 14.

### 1.9 Failure modes and prevention controls (7)

| # | Failure mode | Prevention control |
|---|---|---|
| 1 | **Charter signed on scope spanning a VP who wasn't at the table.** Sponsor signs; Day 30 the cross-functional redesign hits the other VP's territory; redesign rejected. | `#42` Charter procedure requires enumerating every org unit touched by the scope (from SIPOC draft); Sponsor confirms authority covers all of them OR a second Sponsor co-signs. Audit check at `kze_preevent_18`. |
| 2 | **Baseline locked on cross-functional metric with no handoff measurement.** Primary metric is "order-to-cash cycle time" but measurement is taken only in Function A's system; handoff waits to Function B are invisible. | `#43` Output DCP procedure requires measurement points at every handoff boundary; sample plan requires ≥5 observations per handoff. Covered in `kze_preevent_11`. |
| 3 | **Event theater.** Kaizen Week produces a 40-item backlog; Day 50 shows 6 items done, 20 in progress, 14 forgotten. | Post-Event weekly tracking (`kze_postevent_04`, `_05`, `_06`) publishes velocity to Sponsor; Sustainment Gate at Day 70 requires ≥80% of strategic items done OR a Sponsor-approved deferral memo per unfinished strategic item. |
| 4 | **Training without adoption.** Training delivered Week 5; SOP used by 40% of adopters at Week 8. | `kze_postevent_09` training rollout is paired with `kze_postevent_14` adoption-rate audits at Weeks 6, 8, 10. <80% adoption at Week 8 triggers re-training or SOP redesign. |
| 5 | **Sustainment Gate passed on 1 week of good data.** 2-week requirement is reduced to "this week's number looks good." | `kze_sustain_02` procedure requires 2 consecutive working weeks with adoption ≥80% AND no rollback events; Facilitator attests. |
| 6 | **ROI inflation via soft dollars.** Benefits claim is "14 FTE-hours/week × $75/hr × 50 weeks × 30 people = $1.58M" with no redeployment plan. | `kze_sustain_07` requires Hard / Soft / Cost-Avoidance classification; Hard requires P&L line or FTE-release memo; Finance co-sign required before Kaizen fields are written. |
| 7 | **Process Owner transition incomplete.** `#50` signed on paper; 30 days later PO says "I never received the rollback playbook." | `#50` procedure at `kze_sustain_12` requires 30/60/90 calendar holds created on PO calendar; rollback playbook attached; Facilitator retains sustainment-check obligation at Day 120 and 180. |

### 1.10 When 90 days is NOT enough — scenarios that require DMAIC or split-project

90 days is a hard constraint, not a soft guideline. Flag these scenarios during Pre-Event:

- **Process with > 4 functional boundaries.** Change-management overhead exceeds 10 weeks post-event capacity. Split into two sequential Kaizen 90s on paired-function scope, or escalate to DMAIC.
- **Regulatory-validation required on changes.** If changes require a 6-month validation cycle (FDA, FAA, SOX-sensitive financial controls), 90 days cannot close. Pre-Event must confirm validation is not in scope, OR extend to DMAIC with validation built into Control.
- **Cycle time > 2 weeks per process instance.** Baseline n ≥ 30 requires 60 weeks of observation. Use stratified sample (n ≥ 10 per stratum) OR pick a sub-process with shorter cycle OR promote to DMAIC with longer Measure.
- **Concurrent major system change on a primary system of record.** If the target system is also in a re-platform or major release, baseline and rebaseline will span different systems. Defer 90 days, re-evaluate.
- **No single Sponsor with authority.** Two VPs, each claiming half the scope, no shared boss below the CEO. This is an organizational problem, not a Kaizen problem. Escalate; do not open Kaizen 90.

If any of the above is discovered during Pre-Event, the Facilitator's only legal move is **scope-change abandon**: mark the `Kaizen` abandoned, file a scope-change memo, restart with the correct project type. Silent extension to 120 or 180 days is prohibited; the project-type invariant is part of the portfolio trust model.

### 1.11 Architectural reconciliation (forward reference to Part 11)

`ENGINE_DESIGN.md §4.3` currently defines `KAIZEN_EVENT` as a 1–5 day burst using catalog `#42`–`#50` with no phase structure (the existing `Kaizen.phase` field is explicitly null for `projectType='KAIZEN_EVENT'` per `ARCHITECTURE.md §2.9`). Kaizen 90 extends this use of `#42`–`#50` into a 90-day envelope with a 4-macro-phase structure analogous to the Accelerator's 5-phase structure.

Two reconciliation options:

- **Option A.** Extend the existing `KAIZEN_EVENT` projectType to carry a phase structure. The 1–5 day burst becomes a phase inside KAIZEN_EVENT. Requires invalidating the current `ARCHITECTURE.md §2.9` invariant that "`KAIZEN_EVENT` has no phase."
- **Option B.** Add a new `KAIZEN_EVENT_90D` projectType distinct from `KAIZEN_EVENT`. Mirrors `KAIZEN_ACCELERATOR_30D` precedent. Adds one enum value; preserves existing `KAIZEN_EVENT` semantics for 1–5 day bursts.

**Recommendation: Option B.** Full rationale, trade-offs, and migration plan in Part 11 §11.1. Summary: Option B costs one enum value and a few service-routing branches; Option A costs an invariant inversion across the composer, the guards, and the UI PhaseStepper, plus a data migration for any existing `KAIZEN_EVENT` row. The precedent set by `KAIZEN_ACCELERATOR_30D` is decisive — adding sibling distinct projectTypes for phased variants is already the repository pattern.

---

## Part 2 — Full Project Lifecycle: 19 Granular Phases Across 4 Macro-Phases

The v0.1 model defines 4 macro-phases (Pre-Event, Event, Post-Event, Sustainment). Operating at PMO granularity requires 19 observable sub-phases. Each maps to a macro-phase; architecture integration is one enum (`Kaizen.phase ∈ {'PRE_EVENT','EVENT','POST_EVENT','SUSTAIN'}`), with sub-phases exposed as UI-level milestones, not additional FSM states.

| Sub-phase # | Name | Macro-phase | Days |
|---|---|---|---|
| 01 | Intake and process selection | PRE_EVENT | Day 1–3 |
| 02 | Scoring and candidate confirmation | PRE_EVENT | Day 3 |
| 03 | Charter authoring and Sponsor sign-off | PRE_EVENT | Day 4 |
| 04 | KPI tree and baseline metric selection | PRE_EVENT | Day 5 |
| 05 | Stakeholder map and cross-functional roster | PRE_EVENT | Day 6–7 |
| 06 | Baseline data-capture plan and dataset collection | PRE_EVENT | Day 7–11 |
| 07 | Current-state mapping and SOP authoring | PRE_EVENT | Day 11–13 |
| 08 | Kaizen Week scheduling, logistics, pre-reads | PRE_EVENT | Day 13–14 |
| 09 | Kaizen Week Day 1 — SIPOC + current-state alignment | EVENT | Day 15 |
| 10 | Kaizen Week Day 2 — Root cause + prioritized inputs | EVENT | Day 16 |
| 11 | Kaizen Week Day 3 — Future-state design + FMEA | EVENT | Day 17 |
| 12 | Kaizen Week Day 4 — Backlog + SOP drafting | EVENT | Day 18 |
| 13 | Kaizen Week Day 5 — Readouts, Control draft, commitments | EVENT | Day 19 |
| 14 | Implementation planning and sprint kickoff | POST_EVENT | Day 20–21 |
| 15 | Backlog execution (weekly sprint rhythm) | POST_EVENT | Day 20–70 |
| 16 | Change management, training, and rollout | POST_EVENT | Day 25–65 |
| 17 | Adoption monitoring and SOP versioning | POST_EVENT | Day 30–70 |
| 18 | Rebaseline, ROI, Control plan finalization | SUSTAIN | Day 71–85 |
| 19 | Executive readout, Process Owner transition, next-process intake | SUSTAIN | Day 85–90 |

### Sub-phase 01 — Intake and process selection

- **Purpose.** Convert leadership pain and KPI gaps into 1–3 scorable cross-functional candidate processes.
- **Business outcome.** Leadership short-list of 1–3 candidate cross-functional processes with verified cross-functional scope (≥2 org units touched).
- **Entry criteria.** Engagement signed; Sponsor identified; ≥1 KPI gap exists with cross-functional implication.
- **Exit criteria.** Candidate list ranked on Impact × Feasibility × Cross-Functional-Complexity; 1 selected; Sponsor verbally confirms.
- **Key decisions.** Is the problem truly cross-functional? (Single-function → Accelerator.) Is root cause known? (Unknown → DMAIC.)
- **Required artifacts.** Intake Diagnostic (A01); Process Scoring Matrix (A02).
- **Required roles.** Facilitator (owner), Sponsor, optional Process Owner-of-record.
- **BAM scheduling.** 1–2 COMMUNICATION blocks for interviews; 1 PROJECT block for scoring.
- **Duration.** 2–3 days elapsed; ~6 person-hours.
- **Capacity assumption.** Sponsor reachable for 30-min interview; prior-quarter cross-functional scorecard accessible.

### Sub-phase 02 — Scoring and candidate confirmation

- **Purpose.** Lock a single candidate using the scoring matrix; validate cross-functional scope and root-cause-known status.
- **Business outcome.** One candidate selected with documented rationale; alternative candidates retained for next-process intake.
- **Entry criteria.** Candidate list exists.
- **Exit criteria.** A02 Process Scoring Matrix completed; selected candidate explicit; no objection from Sponsor or any touched-function leader.
- **Key decisions.** Go / reject / rescope.
- **Required artifacts.** A02 (finalized).
- **Required roles.** Facilitator (owner), Sponsor, function leaders (light touch).
- **BAM scheduling.** 1 COMMUNICATION block (60 min) for scoring review.
- **Duration.** 1 day elapsed; ~3 person-hours.
- **Capacity assumption.** Function leaders respond within 24 hours to cross-functional-scope ping.

### Sub-phase 03 — Charter authoring and Sponsor sign-off

- **Purpose.** Author `#42` Kaizen Charter covering problem, scope, team, timeline, sponsor authority, cross-functional org units touched; Sponsor signs.
- **Business outcome.** Signed Charter; `Kaizen` row created with `projectType='KAIZEN_EVENT_90D'`; `phase='PRE_EVENT'`; `startDate` = today.
- **Entry criteria.** Candidate confirmed.
- **Exit criteria.** A03 Charter signed; `KaizenService.promote()` called; `#42` catalog entry CLOSED.
- **Key decisions.** Go / no-go on Charter content; Sponsor authority over all org units confirmed or second Sponsor co-signs.
- **Required artifacts.** Charter (A03).
- **Required roles.** Facilitator (owner), Sponsor, Process Owner-of-record.
- **BAM scheduling.** 1 PROJECT block (120 min, per catalog `#42` duration) for authoring; 1 COMMUNICATION block (60 min) for sign-off.
- **Duration.** 1 day elapsed; ~5 person-hours.
- **Capacity assumption.** Sponsor 60 min for sign-off.

### Sub-phase 04 — KPI tree and baseline metric selection

- **Purpose.** Build a 2–3 level KPI tree linking strategic objective → primary Y metric → sub-metrics; select primary + secondary metrics with operational definitions.
- **Business outcome.** KPI Tree (A04) and draft KPI Baseline Targets (A05) with operational definitions, cost basis (if cost metric), and Finance acknowledgement target date.
- **Entry criteria.** Charter signed.
- **Exit criteria.** A04 KPI Tree and A05 Baseline Targets drafted; primary Y selected; Finance partner acknowledges cost basis within 24 h.
- **Key decisions.** Which Y is primary (1 only); cross-functional handoff metrics included as secondary; cost basis for ROI.
- **Required artifacts.** A04 KPI Tree; A05 KPI Baseline Targets.
- **Required roles.** Facilitator (owner), Process Owner, Finance partner.
- **BAM scheduling.** 2 PROJECT blocks (60 + 90 min).
- **Duration.** 1 day elapsed; ~4 person-hours.
- **Capacity assumption.** Finance partner on roster by Day 4 EOD.

### Sub-phase 05 — Stakeholder map and cross-functional roster

- **Purpose.** Enumerate every stakeholder by function; score Influence × Interest; confirm core team, SME pool, Implementation Lead, Change-Management partner.
- **Business outcome.** Stakeholder Map (A06) + Project Team Roster (A07) with every required role named with confirmed per-phase time commitment.
- **Entry criteria.** KPI tree drafted.
- **Exit criteria.** A06 + A07 complete; no role unassigned; Kaizen Week attendance confirmed for PO + SMEs + Facilitator + core team.
- **Key decisions.** Who is Implementation Lead; Change-Management partner; which SMEs attend full Kaizen Week vs on-demand.
- **Required artifacts.** A06; A07.
- **Required roles.** Facilitator (owner), Sponsor, Process Owner.
- **BAM scheduling.** 2 COMMUNICATION blocks (90 + 60 min).
- **Duration.** 2 days elapsed; ~8 person-hours.
- **Capacity assumption.** Sponsor makes introduction calls within 48 h for any unnamed role.

### Sub-phase 06 — Baseline data-capture plan and dataset collection

- **Purpose.** Author `#43` Output DCP; execute baseline data collection to n ≥ 30 continuous or n ≥ 100 proportions with cross-functional handoff measurement points.
- **Business outcome.** Locked Baseline Dataset (A08) with summary statistics; `#43` CLOSED; `BaselineMetric.locked=true`.
- **Entry criteria.** Roster complete.
- **Exit criteria.** A08 baseline dataset with n ≥ plan; handoff boundary observations ≥ 5 per handoff; `BaselineMetric` row locked on `Kaizen`.
- **Key decisions.** Option A (system extract) vs Option B (direct observation); sample size per handoff; whether MSA is needed (attribute metric → Kappa gate).
- **Required artifacts.** Data-Capture Plan (embedded in `#43`); Baseline Dataset (A08).
- **Required roles.** Facilitator (owner), Analyst, SMEs, Process Owner (access approval).
- **BAM scheduling.** Multi-day: 2 PROJECT Deep blocks per day across Days 7–11.
- **Duration.** 5 days elapsed; ~24 person-hours.
- **Capacity assumption.** System access granted ≤ 48 h; SMEs available for observation windows if Option B.

### Sub-phase 07 — Current-state mapping and SOP authoring

- **Purpose.** Convert baseline data + SME knowledge into cross-functional swimlane current-state map and baseline SOPs v1.0.
- **Business outcome.** Current-State Process Map (A09), Baseline SOPs (A10), and initial Waste Log (A11) — all ready for Kaizen Week Day 1.
- **Entry criteria.** Baseline locked.
- **Exit criteria.** A09 swimlane map with every function's lane populated; A10 SOP per activity; A11 waste log with ≥10 items.
- **Key decisions.** Aggregation level; how to render handoffs; which steps deserve work instructions.
- **Required artifacts.** A09; A10; A11.
- **Required roles.** Facilitator (owner), SMEs from each function, Process Owner (review).
- **BAM scheduling.** 3 PROJECT blocks (180 + 120 + 120 min).
- **Duration.** 3 days elapsed; ~18 person-hours.
- **Capacity assumption.** SMEs from each function available for 2-hour review sessions.

### Sub-phase 08 — Kaizen Week scheduling, logistics, pre-reads

- **Purpose.** Execute `#44` Event Scheduling; lock Kaizen Week dates, room, facilitation materials, pre-reads to all participants.
- **Business outcome.** Kaizen Agenda (A12) published; pre-reads delivered; room reserved; participants have calendars cleared for all 5 days.
- **Entry criteria.** Current-state artifacts ready.
- **Exit criteria.** A12 5-day agenda; 100% confirmed attendance across core team + SMEs + Process Owner; pre-reads acknowledged.
- **Key decisions.** In-person vs hybrid; non-consecutive days (rare; discouraged); alternate-SME plan.
- **Required artifacts.** A12 Kaizen Agenda.
- **Required roles.** Facilitator (owner), Sponsor (attendance confirmation), Process Owner, core team.
- **BAM scheduling.** 1 PROJECT block (60 min) + 1 COMMUNICATION block (60 min).
- **Duration.** 2 days elapsed; ~4 person-hours.
- **Capacity assumption.** Room and catering owned by Facilitator with 2-week lead time.

### Sub-phase 09 — Kaizen Week Day 1: SIPOC + current-state alignment

- **Purpose.** Run `#45` Event SIPOC; align full team on current state; confirm Charter + baseline + scope on the wall.
- **Business outcome.** Shared Understanding Log (A13); SIPOC on the wall; any scope disagreement surfaced Day 1 (not Day 4).
- **Entry criteria.** Kaizen Week begins; pre-reads reviewed.
- **Exit criteria.** `#45` SIPOC CLOSED; A13 captured; team signed off on current-state map.
- **Key decisions.** Scope tweaks (bounded — any significant change triggers `kze_gl_04` scope-change handler).
- **Required artifacts.** A13 Shared Understanding Log; `#45` SIPOC output.
- **Required roles.** Facilitator (owner), full team, Process Owner, SMEs, Sponsor (Day 1 kickoff observer).
- **BAM scheduling.** Full-day event; PROJECT bucket packed.
- **Duration.** 1 day; ~40 person-hours cumulative across team.
- **Capacity assumption.** Team 100% for 8 hours.

### Sub-phase 10 — Kaizen Week Day 2: root cause + prioritized inputs

- **Purpose.** Execute `#46` Prioritized Inputs; run root-cause analysis (5-Whys + Fishbone); confirm the validated root cause IS known (if not, trigger DMAIC escalation).
- **Business outcome.** Root-cause list with ranked inputs (A14); prioritized-inputs artifact from `#46`.
- **Entry criteria.** Day 1 artifacts complete.
- **Exit criteria.** `#46` CLOSED; A14 ranked root cause list; decision explicit: "root cause known — proceed" or "root cause unknown — escalate to DMAIC."
- **Key decisions.** Which causes are root (solvable) vs symptoms; escalate-to-DMAIC trigger if team cannot converge.
- **Required artifacts.** A14 Root Cause List.
- **Required roles.** Facilitator (owner), full team, Process Owner.
- **BAM scheduling.** Full-day event.
- **Duration.** 1 day; ~40 person-hours.
- **Capacity assumption.** Team 100%.

### Sub-phase 11 — Kaizen Week Day 3: future-state design + FMEA

- **Purpose.** Design future-state process; run `#47` FMEA on the design; identify risks pre-implementation.
- **Business outcome.** Future-State Map (A15); FMEA (A16) with Severity × Occurrence × Detection (SOD) scored and RPN ranked; ≥3 recommended mitigations on top-RPN items.
- **Entry criteria.** Day 2 root cause agreed.
- **Exit criteria.** A15 future-state map with every function's lane redesigned; `#47` FMEA CLOSED with RPN scoring + mitigations.
- **Key decisions.** Scope of future-state changes; which FMEA failure modes to design out vs detect-only.
- **Required artifacts.** A15; A16 FMEA.
- **Required roles.** Facilitator (owner), full team.
- **BAM scheduling.** Full-day event.
- **Duration.** 1 day; ~40 person-hours.
- **Capacity assumption.** Team 100%.

### Sub-phase 12 — Kaizen Week Day 4: backlog + SOP drafting

- **Purpose.** Translate future-state + FMEA mitigations into Implementation Backlog; draft Future-State SOPs; size and sequence items.
- **Business outcome.** Implementation Backlog (A17) with owner, due date, acceptance criterion per item; Future-State SOPs v2.0-draft (A18).
- **Entry criteria.** Day 3 future-state + FMEA done.
- **Exit criteria.** A17 with every item sized (S/M/L) and sequenced; A18 draft SOPs covering every activity in future-state; Decision Log (A19) capturing Kaizen Week decisions.
- **Key decisions.** Which items are quick-win / medium / strategic; sequencing (structural first); ownership per item.
- **Required artifacts.** A17; A18; A19 Decision Log.
- **Required roles.** Facilitator (owner), full team, Process Owner (priority owner), Implementation Lead (sequencer).
- **BAM scheduling.** Full-day event.
- **Duration.** 1 day; ~40 person-hours.
- **Capacity assumption.** Team 100%.

### Sub-phase 13 — Kaizen Week Day 5: readouts, Control draft, commitments

- **Purpose.** Run Sponsor readout; author Control Plan v1-draft; capture commitments per item; kick off Post-Event phase.
- **Business outcome.** Sponsor signs Day 5 commitments memo; Control Plan draft (A20) authored; Rollout Checklist (A21) initialized; `Kaizen.phase` advances to `POST_EVENT`.
- **Entry criteria.** Backlog + SOPs drafted.
- **Exit criteria.** Sponsor sign-off on Day 5 commitments; A20 Control Plan draft; A21 Rollout Checklist seeded; all 9 catalog entries `#42`–`#47` CLOSED (`#48`–`#50` span Post-Event / Sustain).
- **Key decisions.** Phase advance; any last-minute scope refinement; Sponsor's Day-70 check cadence.
- **Required artifacts.** A20 Control Plan draft; A21 Rollout Checklist; Commitments Memo (A22).
- **Required roles.** Facilitator (owner), Sponsor, Process Owner, full team, Finance partner (observer).
- **BAM scheduling.** 4 hours event + 4 hours readout/commitment.
- **Duration.** 1 day; ~40 person-hours.
- **Capacity assumption.** Sponsor 2 h for readout.

### Sub-phase 14 — Implementation planning and sprint kickoff

- **Purpose.** Convert A17 backlog into weekly sprint plan Weeks 4–10; confirm owner capacity on each item; kick off weekly rhythm.
- **Business outcome.** Sprint Plan (A23) with Week 4–10 item assignments; owner calendars reserved; weekly cadence confirmed (Mon 30-min plan, Wed 15-min check, Fri 30-min demo/retro).
- **Entry criteria.** POST_EVENT phase entered.
- **Exit criteria.** A23 published; owner confirmations received; `#48` Implemented Improvements initiated (this is a long-running activity spanning Post-Event).
- **Key decisions.** Sprint sequence; parallel vs sequential items; escalation path per owner.
- **Required artifacts.** A23 Sprint Plan.
- **Required roles.** Facilitator (owner), Implementation Lead, Process Owner, named owners.
- **BAM scheduling.** 2 COMMUNICATION blocks (60 + 60 min).
- **Duration.** 2 days elapsed; ~10 person-hours.
- **Capacity assumption.** Named owners available within 24 h.

### Sub-phase 15 — Backlog execution (weekly sprint rhythm)

- **Purpose.** Execute the Implementation Backlog across 7 weekly sprints; maintain weekly operating rhythm; track velocity.
- **Business outcome.** ≥80% of items marked done; SOPs updated; `#48` catalog entry accumulates implementation evidence (~23h catalog allocation is spread across these 7 weeks).
- **Entry criteria.** Sprint plan published.
- **Exit criteria.** Weekly Status Reports (A24) published Weeks 4–10; ≥80% of strategic items complete by Day 65; velocity trend visible to Sponsor.
- **Key decisions.** Weekly go/no-go on at-risk items; escalation triggers; re-sequencing.
- **Required artifacts.** A24 Weekly Status Reports; rolling updates to A17 Backlog; Issue/Risk Log (A25).
- **Required roles.** Implementation Lead (owner), named action owners, Facilitator (tracking), Process Owner.
- **BAM scheduling.** Monday 30-min plan + Wednesday 15-min check + Friday 30-min demo/retro (all COMMUNICATION bucket); 2 PROJECT Deep blocks per owner per week for execution.
- **Duration.** 7 weeks elapsed; ~120–180 person-hours across team.
- **Capacity assumption.** Owners have 4–8 h/week protected for backlog execution.

### Sub-phase 16 — Change management, training, and rollout

- **Purpose.** Author Change Management Plan; deliver Training (A26); execute Rollout Checklist (A21).
- **Business outcome.** Change Management Plan (A27) published; ≥90% target-audience training attendance; rollout checkpoint 1 (pilot) and checkpoint 2 (full) complete.
- **Entry criteria.** First structural items landing Week 5.
- **Exit criteria.** A27 plan; A26 training delivered; A21 rollout checklist ≥90% complete.
- **Key decisions.** Communication cadence; training format (live vs recorded); rollout wave size.
- **Required artifacts.** A27 ChM Plan; A26 Training Materials; A21 rollout checkpoints.
- **Required roles.** Change-Management partner (owner), Facilitator, Process Owner, SMEs (trainers).
- **BAM scheduling.** Weekly COMMUNICATION block 60 min during active rollout.
- **Duration.** 6 weeks elapsed; ~40 person-hours.
- **Capacity assumption.** ChM partner 4 h/week; target audience releases 2 h for training.

### Sub-phase 17 — Adoption monitoring and SOP versioning

- **Purpose.** Audit SOP adoption at Weeks 6, 8, 10; version SOPs as reality forces changes; maintain Adoption Log (A28).
- **Business outcome.** Adoption ≥80% by Week 8; SOPs at v2.0-final by Day 70; adoption telemetry visible to Sponsor.
- **Entry criteria.** Rollout in progress.
- **Exit criteria.** A28 audit 1 (Week 6), audit 2 (Week 8), audit 3 (Week 10) complete; SOP v2.0 published.
- **Key decisions.** Re-training vs SOP redesign when adoption < 80%; SOP version bumps on each structural change.
- **Required artifacts.** A28 Adoption Log; versioned Future-State SOPs (A18 → A18-v2).
- **Required roles.** Process Owner (owner), SMEs, Change-Management partner.
- **BAM scheduling.** 1 CI block (45 min) per audit cycle.
- **Duration.** 4–6 weeks elapsed; ~12 person-hours.
- **Capacity assumption.** Auditors observe ≥10 production instances per audit.

### Sub-phase 18 — Rebaseline, ROI, Control plan finalization

- **Purpose.** Re-run baseline measurement method identically; compute delta; execute `#49` Results Narrative; finalize Control Plan; Finance co-signs ROI.
- **Business outcome.** `Kaizen.remeasurementId` set; `implementationCostDollars` + `annualBenefitsDollars` captured; Control Plan (A20 → A20-final) signed; Financial Impact (A29) signed by Finance; `Kaizen.roi` computes.
- **Entry criteria.** Sustainment Gate passed: adoption ≥80% for 2 consecutive working weeks; no rollback events.
- **Exit criteria.** A08 rebaseline dataset; A29 ROI + Finance sign-off; A20-final Control Plan signed by Process Owner + Sponsor; `#49` CLOSED.
- **Key decisions.** Confidence rating per benefit line; `closeKind` candidate; any deferred items.
- **Required artifacts.** Rebaseline Dataset (A30); ROI Calculation (A29); Final Control Plan (A20-final); Monitoring Dashboard (A31); Executive Report (A32); Results Narrative (`#49` output).
- **Required roles.** Facilitator (owner), Analyst (rebaseline), Finance partner (ROI signature), Process Owner (Control sign-off), Sponsor.
- **BAM scheduling.** 4 PROJECT blocks + 2 COMMUNICATION blocks across Days 71–85.
- **Duration.** 15 days elapsed; ~40 person-hours.
- **Capacity assumption.** Finance responds ≤ 48 h; Analyst 8 h/week for rebaseline.

### Sub-phase 19 — Executive readout, Process Owner transition, next-process intake

- **Purpose.** Present A32 Executive Report; execute `#50` Process Owner Transition; recommend next process.
- **Business outcome.** `Kaizen.state=CLOSED` with `closeKind`; `#50` transition signed; Process Owner owns sustainment; 30/60/90 check-in calendar holds created; Next-Process Recommendation (A33) delivered.
- **Entry criteria.** ROI signed; Control plan signed.
- **Exit criteria.** A32 presented and acknowledged; `#50` CLOSED; Kaizen CLOSED.
- **Key decisions.** `closeKind` (SUCCESS / PARTIAL / FAILED_HONEST); recommendation to continue/pause/different team; replication opportunities.
- **Required artifacts.** A32 Executive Report; `#50` Transition document; A33 Next-Process Recommendation; Lessons Learned memo (A34).
- **Required roles.** Facilitator (owner), Process Owner (transition co-signer), Sponsor (close signer), Finance partner (observer).
- **BAM scheduling.** 2 COMMUNICATION blocks (60 + 60 min) + 1 PROJECT block (90 min, reports).
- **Duration.** 5 days elapsed; ~15 person-hours.
- **Capacity assumption.** Sponsor available for close readout.

### 2.20 Aggregate duration and person-hours

Summing across the 4 macro-phases, a typical 90-Day Kaizen runs:

| Macro-phase | Days | Facilitator hrs | Process Owner hrs | Sponsor hrs | Implementation Lead hrs | Core Team hrs (total across 6) | SME hrs (total across 4) | Finance hrs | ChM partner hrs | Analyst hrs |
|---|---|---|---|---|---|---|---|---|---|---|
| Pre-Event | 14 | 60 | 30 | 3 | 8 | 24 | 32 | 2 | 4 | 18 |
| Event (Kaizen Week) | 5 | 40 | 40 | 6 | 40 | 200 | 120 | 2 | 4 | 10 |
| Post-Event Implementation | 50 | 80 | 100 | 3 | 150 | 180 | 40 | 2 | 40 | 12 |
| Sustainment | 20 | 30 | 25 | 3 | 15 | 18 | 8 | 8 | 6 | 16 |
| **Total** | **90** | **210** | **195** | **15** | **213** | **422** | **200** | **14** | **54** | **56** |

**Grand total person-hours: ~1,379** across the team for a single 90-Day Kaizen Event Project. This sits between the Accelerator (~293 person-hours) and DMAIC (~598 person-hours); the higher total reflects cross-functional team size (6 core team + 4 SMEs vs the Accelerator's 2–3 SMEs) and the 50-day Post-Event implementation runway, not per-role heavier load. Per-role load is comparable or lighter than DMAIC on the Black Belt axis because Kaizen 90 requires no regression / DOE / Capability analysis — the time trades from statistical rigor (DMAIC) to cross-functional change management (Kaizen 90).

### 2.21 Phase derivation note — architecture integration

Per the Part 11 recommended Option B, `projectType='KAIZEN_EVENT_90D'` stores a `phase` field on `Kaizen` with enum `{'PRE_EVENT', 'EVENT', 'POST_EVENT', 'SUSTAIN'}`. Sub-phases 01–19 are UI-level milestones, not FSM states — they are tracked via scheduled-activity close events and catalog-entry `#42`–`#50` close events. `Kaizen.phaseDefinitions` is frozen at `promote()` with the 4 macro-phases; guards enforce phase-advance only when macro-phase exit criteria are met. Composer filters Deep-block payload to `CatalogEntry.phaseBinding === Kaizen.phase`, mirroring the Accelerator pattern.

---

## Part 3 — Complete Task Inventory

Format: one detail block per task. Parent catalog entry cited as `→ <catalogEntryId>` where applicable (`#42`–`#50`). Total: 88 tasks (18 Pre-Event + 22 Event + 23 Post-Event + 15 Sustainment + 10 inter-phase glue).

**Legend.** Effort minutes = single-task active work. Duration (d) = wall-clock. BAM work type: **Deep** (PROJECT bucket), **Communication** (COMMUNICATION bucket), **CI** (CI bucket). Standardization potential: H = same text every run; M = template + fill-in; L = judgment-heavy per run. AI-support names the agent or AI mode from Part 10.

### PRE_EVENT — Days 1–14 (Sub-phases 01–08)

---

**`kze_preevent_01` — Conduct Sponsor Voice-of-Leader interview**
- **Purpose.** Capture Sponsor's top 3 cross-functional pains, top 3 KPI gaps, escalation history across functions.
- **Operational definition.** 45-minute structured interview; notes in workspace; 3 pains + 3 gaps + ≥1 cross-functional escalation example.
- **Required inputs.** Sponsor calendar; Voice-of-Leader template; prior quarter cross-functional scorecard.
- **Source of inputs.** External (Sponsor); Part 4 A01 template; Finance scorecard.
- **Activity steps.** (a) Schedule 45-min interview. (b) Open with "Which cross-functional process costs the most sleep?" (c) Probe for measurable gap per pain. (d) Capture escalation examples verbatim with function names. (e) Confirm cross-functional scope per pain. (f) Store notes.
- **Responsible owner.** Facilitator.
- **Supporting.** —.
- **Effort.** 75 min. **Duration.** 0.5d. **BAM type.** Communication.
- **Predecessors.** —. **Successors.** `kze_preevent_02`, `kze_preevent_03`.
- **Tools.** Calendar; notes app.
- **Deliverables.** Voice-of-Leader notes (fragment of A01).
- **Outputs.** 3 pains, 3 gaps, ≥1 escalation, ≥2 functions named per pain.
- **Acceptance.** Sponsor acknowledges notes; cross-functional scope explicit.
- **Risk if skipped.** Candidate selection becomes Facilitator opinion; cross-functional scope missed.
- **Standardization.** M. **AI-support.** Context Agent. **Automation.** L.

---

**`kze_preevent_02` — Pull KPI gap rows from prior-quarter cross-functional scorecard**
- **Purpose.** Ground candidate processes in quantitative KPI gaps with cross-functional signature.
- **Operational definition.** Extract of scorecard rows where actual < target by ≥ 10% AND process touches ≥ 2 functions, tagged by process.
- **Required inputs.** Scorecard data; function-to-process taxonomy.
- **Source of inputs.** Finance / Ops dashboards.
- **Activity steps.** (a) Query scorecard for missed-target rows. (b) Tag each row by process. (c) Flag cross-functional rows (≥2 functions). (d) Rank by gap magnitude. (e) Attach to A01.
- **Responsible owner.** Analyst. **Supporting.** Facilitator.
- **Effort.** 60 min. **Duration.** 0.5d. **BAM type.** Deep.
- **Predecessors.** `kze_preevent_01`. **Successors.** `kze_preevent_03`.
- **Tools.** BI tools; spreadsheet.
- **Deliverables.** KPI gap extract (fragment of A01).
- **Outputs.** 5–15 cross-functional KPI gap rows.
- **Acceptance.** Every row has function tag + gap value.
- **Risk if skipped.** A02 scoring becomes subjective.
- **Standardization.** H. **AI-support.** Context Agent. **Automation.** M.

---

**`kze_preevent_03` — Draft candidate process list (3–5 cross-functional candidates)**
- **Purpose.** Merge VOL pains + KPI gaps into a candidate list of 3–5 cross-functional processes.
- **Operational definition.** A02-format list with name, one-line pain, one-line gap, tentative functions-touched count.
- **Required inputs.** `kze_preevent_01` notes; `kze_preevent_02` extract.
- **Source of inputs.** Upstream.
- **Activity steps.** (a) Cluster pains and gaps by process. (b) Confirm ≥2 functions touched per candidate. (c) Write one-line description per candidate. (d) Draft A02.
- **Responsible owner.** Facilitator. **Supporting.** —.
- **Effort.** 45 min. **Duration.** 0.5d. **BAM type.** Deep.
- **Predecessors.** `kze_preevent_01`, `kze_preevent_02`. **Successors.** `kze_preevent_04`.
- **Tools.** A02 template.
- **Deliverables.** Candidate list (draft A02).
- **Outputs.** 3–5 candidates.
- **Acceptance.** Each candidate has ≥2 functions.
- **Risk if skipped.** Scoring lacks input.
- **Standardization.** M. **AI-support.** Context Agent. **Automation.** M.

---

**`kze_preevent_04` — Score candidates on Impact × Feasibility × Cross-Functional-Complexity**
- **Purpose.** Score A02 candidates on 3 axes; produce selection rationale.
- **Operational definition.** A02 with per-candidate scores (1–5) on Impact, Feasibility, Cross-Functional-Complexity; rationale per axis.
- **Required inputs.** Draft A02.
- **Source of inputs.** `kze_preevent_03`.
- **Activity steps.** (a) Score Impact (KPI gap × strategic alignment). (b) Score Feasibility (data availability + Sponsor authority + Process Owner available). (c) Score Cross-Functional-Complexity (lower is easier). (d) Write rationale per score. (e) Compute total.
- **Responsible owner.** Facilitator. **Supporting.** Sponsor (axis validation).
- **Effort.** 90 min. **Duration.** 0.5d. **BAM type.** Deep.
- **Predecessors.** `kze_preevent_03`. **Successors.** `kze_preevent_05`.
- **Tools.** A02 template.
- **Deliverables.** A02 Process Scoring Matrix (scored).
- **Outputs.** Ranked list.
- **Acceptance.** Every candidate scored on 3 axes with rationale.
- **Risk if skipped.** Selection defaults to loudest pain.
- **Standardization.** H. **AI-support.** Planning Agent. **Automation.** M.

---

**`kze_preevent_05` — Sponsor candidate confirmation call**
- **Purpose.** Sponsor picks one candidate; confirms cross-functional scope; confirms Sponsor authority covers all touched functions.
- **Operational definition.** 30-min call; candidate picked; authority confirmed; alternatives deferred with rationale.
- **Required inputs.** Scored A02.
- **Source of inputs.** `kze_preevent_04`.
- **Activity steps.** (a) Walk Sponsor through A02. (b) Sponsor picks. (c) Confirm authority over all functions (or identify co-Sponsor). (d) Document decision.
- **Responsible owner.** Facilitator. **Supporting.** Sponsor.
- **Effort.** 30 min. **Duration.** 0.25d. **BAM type.** Communication.
- **Predecessors.** `kze_preevent_04`. **Successors.** `kze_preevent_06`.
- **Tools.** Meeting.
- **Deliverables.** Selection memo (fragment of A02).
- **Outputs.** 1 candidate selected; authority explicit.
- **Acceptance.** Sponsor acknowledges authority OR co-Sponsor named.
- **Risk if skipped.** Week 7 authority blocker.
- **Standardization.** M. **AI-support.** —. **Automation.** L.

---

**`kze_preevent_06` — Author Kaizen Charter draft** → `#42`
- **Purpose.** Author `#42` Kaizen Charter draft per catalog procedure: problem, business case, scope, goal, team, timeline, risks.
- **Operational definition.** A03 Charter draft with all 8 required sections populated, including every org unit touched by scope.
- **Required inputs.** A01, A02; Sponsor authority confirmation; Process Owner verbal commitment.
- **Source of inputs.** `kze_preevent_01`, `kze_preevent_05`.
- **Activity steps.** (a) Problem statement (1 paragraph with scope + pain). (b) Business case (current waste/cost/risk; expected benefit). (c) Event scope (in/out/functions). (d) Goal statement (baseline X → target Y by Day 90). (e) Event team (Lead, PO, SMEs, Sponsor). (f) 90-day timeline visual. (g) Top 3 risks + initial mitigations. (h) Sponsor signature block.
- **Responsible owner.** Facilitator. **Supporting.** Process Owner, Sponsor (preview).
- **Effort.** 120 min (matches catalog `#42` duration). **Duration.** 1d. **BAM type.** Deep.
- **Predecessors.** `kze_preevent_05`. **Successors.** `kze_preevent_07`.
- **Tools.** A03 template.
- **Deliverables.** Charter draft (A03 v0.1).
- **Outputs.** Draft for Sponsor review.
- **Acceptance.** All 8 sections populated; every function named.
- **Risk if skipped.** `#42` catalog entry cannot close.
- **Standardization.** M. **AI-support.** Composer Explainer (auto-draft scope + functions). **Automation.** M.

---

**`kze_preevent_07` — Sponsor Charter sign-off** → `#42`
- **Purpose.** Sponsor signs A03; `#42` closes; `Kaizen` row promoted with `projectType='KAIZEN_EVENT_90D'`.
- **Operational definition.** Signed Charter; `KaizenService.promote()` called; `#42` ScheduledActivity CLOSED; `Kaizen.phase='PRE_EVENT'` seeded.
- **Required inputs.** A03 draft.
- **Source of inputs.** `kze_preevent_06`.
- **Activity steps.** (a) 45-min walkthrough with Sponsor. (b) Address any concerns. (c) Capture signature. (d) `promote()`. (e) `#42` close.
- **Responsible owner.** Facilitator. **Supporting.** Sponsor, Process Owner.
- **Effort.** 60 min. **Duration.** 0.5d. **BAM type.** Communication.
- **Predecessors.** `kze_preevent_06`. **Successors.** `kze_preevent_08`, `kze_preevent_09`, `kze_preevent_10`.
- **Tools.** CadencePlan; e-signature.
- **Deliverables.** Signed Charter (A03); `Kaizen` row.
- **Outputs.** `Kaizen.state='DRAFT'`; `phase='PRE_EVENT'`; `#42` CLOSED.
- **Acceptance.** Signature captured; row exists.
- **Risk if skipped.** No legitimate project.
- **Standardization.** H. **AI-support.** —. **Automation.** M.

---

**`kze_preevent_08` — Build KPI tree**
- **Purpose.** Build A04 KPI tree linking strategic objective → primary Y → sub-metrics (including cross-functional handoff metrics).
- **Operational definition.** A04 with 2–3 levels; primary Y selected; handoff metrics as secondaries.
- **Required inputs.** A03 goal; VOL pains; KPI gap extract.
- **Source of inputs.** `kze_preevent_07`, `kze_preevent_02`.
- **Activity steps.** (a) Name strategic objective. (b) Identify primary Y. (c) Decompose into 2–4 sub-metrics. (d) Flag handoff metrics. (e) Draw tree.
- **Responsible owner.** Facilitator. **Supporting.** Process Owner, Finance partner (cost-metric validation).
- **Effort.** 60 min. **Duration.** 0.5d. **BAM type.** Deep.
- **Predecessors.** `kze_preevent_07`. **Successors.** `kze_preevent_09`.
- **Tools.** A04 template.
- **Deliverables.** KPI Tree (A04).
- **Outputs.** 1 primary Y; 3–6 secondaries.
- **Acceptance.** Every handoff represented.
- **Risk if skipped.** Baseline unlinked from strategy.
- **Standardization.** M. **AI-support.** Planning Agent. **Automation.** L.

---

**`kze_preevent_09` — Draft baseline metric operational definitions (A05)**
- **Purpose.** Author A05 KPI Baseline Targets per metric: operational definition, unit, method, sample size, sample frequency, stratification, exclusion, owner, baseline target, post-improvement target, cost basis.
- **Operational definition.** A05 populated for primary + secondary metrics; Finance partner acknowledges cost basis.
- **Required inputs.** A04; Finance cost basis; measurement tool inventory.
- **Source of inputs.** `kze_preevent_08`.
- **Activity steps.** (a) Per metric, write operational definition (paragraph). (b) Specify unit, method, n, frequency. (c) Define stratification (e.g., by function or handoff). (d) Define exclusion rule. (e) Name measurement owner. (f) Ack Finance on cost metrics.
- **Responsible owner.** Facilitator. **Supporting.** Process Owner, Finance partner.
- **Effort.** 90 min. **Duration.** 0.5d. **BAM type.** Deep.
- **Predecessors.** `kze_preevent_08`. **Successors.** `kze_preevent_11`.
- **Tools.** A05 template.
- **Deliverables.** KPI Baseline Targets (A05 draft).
- **Outputs.** Operational definitions per metric.
- **Acceptance.** Finance ack on cost basis; definitions unambiguous.
- **Risk if skipped.** Rebaseline drifts from baseline.
- **Standardization.** H. **AI-support.** Composer Explainer. **Automation.** L.

---

**`kze_preevent_10` — Assemble cross-functional roster (A06 + A07)**
- **Purpose.** Identify Stakeholder Map (A06) + Project Team Roster (A07) with role, function, accountability, per-phase commitment.
- **Operational definition.** A06 2x2 Influence × Interest grid; A07 with every required role filled.
- **Required inputs.** Org chart; A03 scope; Sponsor introductions.
- **Source of inputs.** `kze_preevent_07`.
- **Activity steps.** (a) List all stakeholders. (b) Rate Influence × Interest. (c) Plot 2x2. (d) Fill A07: Sponsor, co-Sponsor (if applicable), PO, Facilitator, Implementation Lead, Change-Mgmt partner, Finance partner, SMEs (4 — one per function), core team (4–6). (e) Per role: name, email, function, per-phase hours.
- **Responsible owner.** Facilitator. **Supporting.** Process Owner, Sponsor.
- **Effort.** 120 min. **Duration.** 1d. **BAM type.** Communication.
- **Predecessors.** `kze_preevent_07`. **Successors.** `kze_preevent_12`.
- **Tools.** A06, A07 templates.
- **Deliverables.** A06 Stakeholder Map; A07 Roster.
- **Outputs.** Fully staffed roster.
- **Acceptance.** Every required role filled; Finance + ChM partner named.
- **Risk if skipped.** Week 50 handoff blocker.
- **Standardization.** M. **AI-support.** Planning Agent. **Automation.** L.

---

**`kze_preevent_11` — Author `#43` Output Data Collection Plan** → `#43`
- **Purpose.** Per catalog `#43` procedure, author DCP for baseline measurement with pre-event and rebaseline sampling plans, cross-functional handoff measurement points.
- **Operational definition.** `#43` DCP CLOSED: 1–3 CTQ metrics; per-metric operational definition, method, pre-event n, rebaseline n (same method), owner, storage; ≥1 handoff observation point per function pair.
- **Required inputs.** A05 definitions; Kaizen Charter goal.
- **Source of inputs.** `kze_preevent_09`, `kze_preevent_07`.
- **Activity steps.** (a) List CTQ metrics from Charter. (b) Per metric, specify operational definition, unit, method. (c) Pre-event sampling plan (n ≥ 30 continuous or ≥100 proportions; ≥5 handoff observations per function pair). (d) Rebaseline sampling plan (identical method; same n). (e) If attribute/subjective, schedule 1-hour compressed MSA (3 appraisers × 5 samples). (f) Schedule rebaseline calendar hold at Day 78. (g) Store DCP with Charter.
- **Responsible owner.** Facilitator. **Supporting.** Analyst, Process Owner.
- **Effort.** 120 min (matches catalog `#43` duration). **Duration.** 1d. **BAM type.** Deep.
- **Predecessors.** `kze_preevent_09`. **Successors.** `kze_preevent_12`, `kze_preevent_13`.
- **Tools.** `#43` template.
- **Deliverables.** DCP artifact (`#43` output); Rebaseline Calendar Hold.
- **Outputs.** Locked DCP.
- **Acceptance.** Handoff points ≥ 1 per function pair; rebaseline schedule locked.
- **Risk if skipped.** Baseline missing handoff data; rebaseline drifts.
- **Standardization.** H. **AI-support.** Composer Explainer. **Automation.** M.

---

**`kze_preevent_12` — Run compressed MSA if needed**
- **Purpose.** If any metric is subjective / manual, run 1-hour compressed MSA (3 appraisers × 5 samples) per Part 8 §8.3.
- **Operational definition.** MSA report with Gage R&R < 30% (continuous) or Kappa ≥ 0.7 (attribute); OR measurement system fixed and re-run.
- **Required inputs.** `#43` DCP; 5 representative samples; 3 trained appraisers.
- **Source of inputs.** `kze_preevent_11`.
- **Activity steps.** (a) Select 5 representative samples. (b) Brief 3 appraisers. (c) Have each measure 5 samples twice in randomized order. (d) Compute Gage R&R or Kappa. (e) Accept or fix-and-rerun.
- **Responsible owner.** Analyst. **Supporting.** Facilitator, SMEs.
- **Effort.** 60 min + analysis 30 min. **Duration.** 0.5d. **BAM type.** Deep.
- **Predecessors.** `kze_preevent_11`. **Successors.** `kze_preevent_13`.
- **Tools.** Spreadsheet / notebook.
- **Deliverables.** MSA report (fragment of A08).
- **Outputs.** Acceptable measurement system or fix list.
- **Acceptance.** Gage R&R < 30% OR Kappa ≥ 0.7; OR fix plan.
- **Risk if skipped.** Baseline built on noise.
- **Standardization.** H. **AI-support.** —. **Automation.** M.

---

**`kze_preevent_13` — Execute baseline data collection** → `#43`
- **Purpose.** Collect baseline dataset per DCP; capture raw time-stamped observations including handoff boundaries.
- **Operational definition.** A08 Raw Baseline Dataset with n ≥ DCP plan; handoff-boundary observations ≥ 5 per handoff; data-quality flags logged.
- **Required inputs.** DCP (`#43`); MSA (if needed); system access.
- **Source of inputs.** `kze_preevent_11`, `kze_preevent_12`.
- **Activity steps.** (a) Execute DCP capture (Option A or B). (b) Log observations with time stamps. (c) Flag data quality issues. (d) Collect handoff-boundary observations. (e) Store dataset with version tag.
- **Responsible owner.** Analyst. **Supporting.** SMEs, Facilitator.
- **Effort.** 240 min cumulative. **Duration.** 3d. **BAM type.** Deep.
- **Predecessors.** `kze_preevent_12`. **Successors.** `kze_preevent_14`.
- **Tools.** Per DCP.
- **Deliverables.** Raw Baseline Dataset (A08).
- **Outputs.** Dataset.
- **Acceptance.** n ≥ plan; handoff n ≥ 5 per pair.
- **Risk if skipped.** No baseline.
- **Standardization.** H. **AI-support.** Planning Agent (lint method drift). **Automation.** M.

---

**`kze_preevent_14` — Compute baseline summary statistics and lock BaselineMetric**
- **Purpose.** Compute mean/median/SD/min/max/Cpk (if spec limits) per metric; lock `BaselineMetric` on Kaizen.
- **Operational definition.** A08 includes stats; `Kaizen.baselineMetricId` set; `BaselineMetric.locked=true`.
- **Required inputs.** A08 raw data.
- **Source of inputs.** `kze_preevent_13`.
- **Activity steps.** (a) Compute stats per metric. (b) Compute Cpk if spec limits exist. (c) Stratify by handoff. (d) Write summary. (e) Lock `BaselineMetric`.
- **Responsible owner.** Analyst. **Supporting.** Facilitator.
- **Effort.** 90 min. **Duration.** 0.5d. **BAM type.** Deep.
- **Predecessors.** `kze_preevent_13`. **Successors.** `kze_preevent_18`.
- **Tools.** Spreadsheet / notebook; CadencePlan.
- **Deliverables.** Baseline stats doc (fragment of A08); locked `BaselineMetric` row.
- **Outputs.** Stats; lock.
- **Acceptance.** Stats computed; lock flag set.
- **Risk if skipped.** Rebaseline has no anchor.
- **Standardization.** H. **AI-support.** —. **Automation.** H.

---

**`kze_preevent_15` — Author Current-State Process Map (cross-functional swimlane)**
- **Purpose.** Convert baseline observations + SME knowledge into A09 swimlane with every function's lane.
- **Operational definition.** A09 with ≥1 lane per function; every handoff rendered; activity count + duration per step.
- **Required inputs.** A08 data; SME interviews.
- **Source of inputs.** `kze_preevent_13`.
- **Activity steps.** (a) Interview 1 SME per function (30 min each). (b) Draft lanes. (c) Render handoffs. (d) Annotate activity duration. (e) Validate with SMEs.
- **Responsible owner.** Facilitator. **Supporting.** SMEs.
- **Effort.** 180 min. **Duration.** 1d. **BAM type.** Deep.
- **Predecessors.** `kze_preevent_13`. **Successors.** `kze_preevent_16`, `kze_preevent_17`.
- **Tools.** Mapping tool.
- **Deliverables.** Current-State Map (A09).
- **Outputs.** Swimlane.
- **Acceptance.** Every function has a lane; every handoff rendered.
- **Risk if skipped.** Kaizen Week Day 1 loses half a day re-drawing.
- **Standardization.** M. **AI-support.** Context Agent (process mining). **Automation.** L.

---

**`kze_preevent_16` — Author Baseline SOPs v1.0 (A10)**
- **Purpose.** Per activity in A09, author v1.0 "as-is" SOP.
- **Operational definition.** A10 with per-activity step-by-step, role, system of record; version 1.0 tagged.
- **Required inputs.** A09 map; SME knowledge.
- **Source of inputs.** `kze_preevent_15`.
- **Activity steps.** (a) Per activity, write steps. (b) Name role + system. (c) SME review. (d) Version-tag v1.0. (e) Store in SOP repo.
- **Responsible owner.** Facilitator. **Supporting.** SMEs, Process Owner.
- **Effort.** 180 min. **Duration.** 1d. **BAM type.** Deep.
- **Predecessors.** `kze_preevent_15`. **Successors.** `kze_preevent_18`.
- **Tools.** SOP repo.
- **Deliverables.** Baseline SOPs (A10).
- **Outputs.** v1.0 SOPs.
- **Acceptance.** Every activity has SOP; SME sign-off.
- **Risk if skipped.** No baseline for SOP diff at close.
- **Standardization.** M. **AI-support.** Composer Explainer (auto-draft SOP from swimlane). **Automation.** M.

---

**`kze_preevent_17` — Draft Waste Log and handoff-defect log (A11)**
- **Purpose.** Use A08 data + A09 map to enumerate TIMWOODS waste + handoff defects; seed for Kaizen Week root-cause.
- **Operational definition.** A11 with ≥10 waste items; ≥3 handoff defect classes.
- **Required inputs.** A08; A09.
- **Source of inputs.** `kze_preevent_13`, `kze_preevent_15`.
- **Activity steps.** (a) Walk A09 step by step. (b) Tag each step with TIMWOODS categories. (c) Log handoff defects from A08. (d) Rank by frequency × severity.
- **Responsible owner.** Facilitator. **Supporting.** SMEs.
- **Effort.** 90 min. **Duration.** 0.5d. **BAM type.** Deep.
- **Predecessors.** `kze_preevent_15`. **Successors.** `kze_preevent_18`.
- **Tools.** A11 template.
- **Deliverables.** Waste Log (A11).
- **Outputs.** Ranked waste.
- **Acceptance.** ≥10 items; handoff defects identified.
- **Risk if skipped.** Kaizen Week Day 2 starts blind.
- **Standardization.** M. **AI-support.** Reflection Agent (friction pattern surfacing). **Automation.** L.

---

**`kze_preevent_18` — Baseline validation and stakeholder walk-through**
- **Purpose.** Walk Sponsor + PO + function leaders through A08 stats, A09 map, A10 SOPs, A11 waste; capture sign-off.
- **Operational definition.** Approved Baseline Sign-off Memo (A08-sign-off); any dissent resolved or deferred explicitly.
- **Required inputs.** A08, A09, A10, A11.
- **Source of inputs.** upstream Pre-Event.
- **Activity steps.** (a) 60-min walk-through with Sponsor + PO + function leaders. (b) Address challenges. (c) Capture sign-off. (d) File memo.
- **Responsible owner.** Facilitator. **Supporting.** Sponsor, PO, function leaders, SMEs.
- **Effort.** 60 min. **Duration.** 0.5d. **BAM type.** Communication.
- **Predecessors.** `kze_preevent_14`, `kze_preevent_16`, `kze_preevent_17`. **Successors.** `kze_preevent_19`.
- **Tools.** Meeting.
- **Deliverables.** Baseline Sign-off Memo.
- **Outputs.** Sign-off.
- **Acceptance.** All function leaders acknowledge.
- **Risk if skipped.** Day 1 of Kaizen Week re-litigates current state.
- **Standardization.** H. **AI-support.** —. **Automation.** L.

---

**`kze_preevent_19` — Execute `#44` Event Scheduling** → `#44`
- **Purpose.** Run catalog `#44`: pick Kaizen Week dates, confirm room, logistics, catering, AV, pre-reads to participants.
- **Operational definition.** `#44` CLOSED: 5 consecutive working days picked; room booked; 100% attendance confirmed; pre-read packet delivered 3 working days before Day 1.
- **Required inputs.** A07 roster; Sponsor date constraints; room availability.
- **Source of inputs.** `kze_preevent_10`, `kze_preevent_18`.
- **Activity steps.** (a) Pick 5 consecutive working days. (b) Confirm room. (c) Confirm attendance with every roster member individually. (d) Prepare pre-read packet (A03 Charter + A04 KPI Tree + A05 KPI Targets + A08 baseline summary + A09 map + A10 SOPs + A11 waste). (e) Deliver 3 working days ahead. (f) Book catering. (g) Lock AV (mapping wall, sticky notes, markers, printer, projector). (h) Schedule Sponsor Day 1 kickoff + Day 5 readout.
- **Responsible owner.** Facilitator. **Supporting.** Admin support.
- **Effort.** 60 min (matches catalog `#44`). **Duration.** 0.5d. **BAM type.** Deep.
- **Predecessors.** `kze_preevent_18`. **Successors.** `kze_event_01`.
- **Tools.** Calendar; `#44` template.
- **Deliverables.** `#44` output; Kaizen Agenda (A12 v0.1).
- **Outputs.** Scheduled event.
- **Acceptance.** 100% confirmed attendance; packet delivered; room locked.
- **Risk if skipped.** Event happens with scope drift.
- **Standardization.** H. **AI-support.** Composer Explainer (agenda template). **Automation.** M.

### EVENT — Days 15–19 (Kaizen Week, Sub-phases 09–13)

---

**`kze_event_01` — Day 1 opening: Charter + baseline readout + working agreement**
- **Purpose.** Open Kaizen Week; Charter on wall; baseline confirmed; working agreement set.
- **Operational definition.** 60-min opening; A03 on wall; A08 stats on wall; team signs working agreement.
- **Required inputs.** Pre-read acknowledgements; A03, A08.
- **Source of inputs.** Pre-Event.
- **Activity steps.** (a) Sponsor 15-min commitment statement. (b) Facilitator walks Charter. (c) Walk baseline stats. (d) Team sets working agreement (phones, breaks, decisions, escalation). (e) Sign.
- **Responsible owner.** Facilitator. **Supporting.** Sponsor, Process Owner, team.
- **Effort.** 60 min. **Duration.** 0.25d. **BAM type.** Communication.
- **Predecessors.** `kze_preevent_19`. **Successors.** `kze_event_02`.
- **Tools.** Room; wall; markers.
- **Deliverables.** Working Agreement (fragment of A13).
- **Outputs.** Aligned team.
- **Acceptance.** All present; agreement signed.
- **Risk if skipped.** Day 1 drifts.
- **Standardization.** H. **AI-support.** —. **Automation.** L.

---

**`kze_event_02` — Day 1 mid-morning: `#45` Event SIPOC** → `#45`
- **Purpose.** Execute catalog `#45` Event SIPOC: enumerate Suppliers, Inputs, Process, Outputs, Customers with the full cross-functional team.
- **Operational definition.** `#45` CLOSED: SIPOC wall-artifact with ≥5 high-level process steps; ≥2 per SIPOC column; Customer CTQs cross-referenced to A04 KPI tree.
- **Required inputs.** A09 current-state map; A04 KPI tree.
- **Source of inputs.** `kze_event_01`.
- **Activity steps.** (a) Facilitator draws SIPOC on wall. (b) Team fills Process (5–9 high-level steps). (c) Team fills Inputs per step. (d) Team fills Suppliers. (e) Team fills Outputs per step. (f) Team fills Customers. (g) Cross-reference Customer CTQs to KPI tree.
- **Responsible owner.** Facilitator. **Supporting.** full team.
- **Effort.** 60 min (matches catalog `#45`). **Duration.** 0.25d. **BAM type.** Deep.
- **Predecessors.** `kze_event_01`. **Successors.** `kze_event_03`.
- **Tools.** Wall; sticky notes.
- **Deliverables.** SIPOC (`#45` output).
- **Outputs.** SIPOC.
- **Acceptance.** ≥5 steps; every column populated.
- **Risk if skipped.** Scope fuzzy.
- **Standardization.** H. **AI-support.** Composer Explainer (SIPOC prompt templates). **Automation.** L.

---

**`kze_event_03` — Day 1 afternoon: Current-state deep dive**
- **Purpose.** Walk A09 map step-by-step with full team; every function confirms or corrects.
- **Operational definition.** Final Current-State Map (A09 v1.1) with corrections; Shared Understanding Log (A13) with ≥10 entries.
- **Required inputs.** A09; SIPOC (`#45`).
- **Source of inputs.** `kze_event_02`.
- **Activity steps.** (a) Walk map step-by-step. (b) Each function confirms accuracy of its lane. (c) Correct on the wall. (d) Log corrections in A13. (e) Note pain points per step.
- **Responsible owner.** Facilitator. **Supporting.** full team.
- **Effort.** 180 min. **Duration.** 0.5d. **BAM type.** Deep.
- **Predecessors.** `kze_event_02`. **Successors.** `kze_event_04`.
- **Tools.** Wall.
- **Deliverables.** A09 v1.1; A13.
- **Outputs.** Validated current state.
- **Acceptance.** Every function confirms.
- **Risk if skipped.** Future-state built on broken current state.
- **Standardization.** M. **AI-support.** —. **Automation.** L.

---

**`kze_event_04` — Day 1 close: Day 2 pre-brief**
- **Purpose.** 30-min close; Day 2 plan; homework assignments.
- **Operational definition.** Written Day 2 agenda; each team member leaves with a prep task.
- **Required inputs.** Day 1 artifacts.
- **Source of inputs.** `kze_event_03`.
- **Activity steps.** (a) Recap. (b) Day 2 agenda. (c) Homework. (d) Dismiss.
- **Responsible owner.** Facilitator. **Supporting.** team.
- **Effort.** 30 min. **Duration.** 0.25d. **BAM type.** Communication.
- **Predecessors.** `kze_event_03`. **Successors.** `kze_event_05`.
- **Tools.** Agenda sheet.
- **Deliverables.** Day 2 agenda.
- **Outputs.** Aligned team.
- **Acceptance.** Agenda distributed.
- **Risk if skipped.** Day 2 starts cold.
- **Standardization.** H. **AI-support.** —. **Automation.** L.

---

**`kze_event_05` — Day 2 opening: 5-Whys on top waste items**
- **Purpose.** Run 5-Whys on the top 5 waste items from A11; surface root causes.
- **Operational definition.** 5-Whys chain per top-5 waste items; each chain ends in a plausibly-solvable root cause.
- **Required inputs.** A11 Waste Log; A09 map.
- **Source of inputs.** `kze_event_04`.
- **Activity steps.** (a) Facilitator scribes. (b) For each of top 5 waste items, ask Why 5 times. (c) Capture chain on wall. (d) Rank by solvability × impact.
- **Responsible owner.** Facilitator. **Supporting.** full team.
- **Effort.** 120 min. **Duration.** 0.5d. **BAM type.** Deep.
- **Predecessors.** `kze_event_04`. **Successors.** `kze_event_06`.
- **Tools.** Wall; 5-Whys template.
- **Deliverables.** 5-Whys chains (fragment of A14).
- **Outputs.** 5 root-cause chains.
- **Acceptance.** Each chain terminates in a solvable cause.
- **Risk if skipped.** Future-state targets symptoms.
- **Standardization.** M. **AI-support.** Reflection Agent (pattern). **Automation.** L.

---

**`kze_event_06` — Day 2 midday: Fishbone (Ishikawa) on primary Y**
- **Purpose.** Complementary Fishbone on the primary Y: 6M categories (Man, Machine, Method, Material, Measurement, Mother Nature).
- **Operational definition.** A14 Fishbone with ≥3 causes per category; primary drivers circled.
- **Required inputs.** A09; A14 5-Whys.
- **Source of inputs.** `kze_event_05`.
- **Activity steps.** (a) Draw fishbone. (b) Brainstorm per category. (c) Dot-vote top drivers. (d) Capture.
- **Responsible owner.** Facilitator. **Supporting.** full team.
- **Effort.** 90 min. **Duration.** 0.25d. **BAM type.** Deep.
- **Predecessors.** `kze_event_05`. **Successors.** `kze_event_07`.
- **Tools.** Wall.
- **Deliverables.** Fishbone (fragment of A14).
- **Outputs.** Root-cause long list.
- **Acceptance.** ≥18 causes enumerated.
- **Risk if skipped.** Narrow root-cause view.
- **Standardization.** M. **AI-support.** —. **Automation.** L.

---

**`kze_event_07` — Day 2 afternoon: `#46` Prioritized Inputs** → `#46`
- **Purpose.** Execute catalog `#46`: rank X inputs by leverage on Y; commit to top 3–5.
- **Operational definition.** `#46` CLOSED: X inputs enumerated from 5-Whys + Fishbone; scored Impact × Controllability; top 3–5 selected.
- **Required inputs.** A14 root causes; `#45` SIPOC.
- **Source of inputs.** `kze_event_05`, `kze_event_06`.
- **Activity steps.** (a) Consolidate X list from 5-Whys + Fishbone (deduplicate). (b) Score Impact on Y (1–5). (c) Score Controllability (1–5 — can we actually change this?). (d) Compute Impact × Controllability. (e) Pick top 3–5. (f) Write rationale.
- **Responsible owner.** Facilitator. **Supporting.** full team, Process Owner.
- **Effort.** 30 min (matches catalog `#46`). **Duration.** 0.25d. **BAM type.** Deep.
- **Predecessors.** `kze_event_06`. **Successors.** `kze_event_08`.
- **Tools.** `#46` template.
- **Deliverables.** Prioritized Inputs (`#46` output); A14 final.
- **Outputs.** Top 3–5 X's.
- **Acceptance.** Scored list; commitment.
- **Risk if skipped.** Future-state scope infinite.
- **Standardization.** H. **AI-support.** Planning Agent. **Automation.** M.

---

**`kze_event_08` — Day 2 close: DMAIC-escalation decision**
- **Purpose.** Explicit gate: can we converge on validated root cause? If no, abandon and promote to DMAIC.
- **Operational definition.** Documented decision: "root cause known — proceed to Day 3 future-state" OR "root cause unknown — abandon Kaizen 90, open DMAIC."
- **Required inputs.** A14, `#46` output.
- **Source of inputs.** `kze_event_07`.
- **Activity steps.** (a) Facilitator asks team: "Can we design a future state that credibly attacks root cause with ≥ 80% confidence?" (b) Majority vote. (c) If no, file scope-change memo; abandon. (d) If yes, proceed.
- **Responsible owner.** Facilitator. **Supporting.** Process Owner, Sponsor (remote consultation).
- **Effort.** 30 min. **Duration.** 0.25d. **BAM type.** Communication.
- **Predecessors.** `kze_event_07`. **Successors.** `kze_event_09` (if proceed) OR `kze_gl_04` (if abandon).
- **Tools.** Meeting.
- **Deliverables.** Decision memo (fragment of A19 Decision Log).
- **Outputs.** Proceed / abandon decision.
- **Acceptance.** Decision explicit.
- **Risk if skipped.** Future-state built on unvalidated cause; Day 90 fails.
- **Standardization.** H. **AI-support.** —. **Automation.** L.

---

**`kze_event_09` — Day 3 opening: Future-state design sprint**
- **Purpose.** Redesign the process attacking the top 3–5 X's from `#46`; draft future-state swimlane.
- **Operational definition.** A15 Future-State Map with lanes for every function; every top-X attacked by ≥ 1 design change; handoffs simplified or eliminated.
- **Required inputs.** A09 current-state; `#46` prioritized inputs.
- **Source of inputs.** `kze_event_07`.
- **Activity steps.** (a) Pick target cycle time / defect rate from A05. (b) Break team into 2 sub-teams. (c) Sub-teams redesign independently (60 min). (d) Plenary — merge best. (e) Draft final future-state.
- **Responsible owner.** Facilitator. **Supporting.** full team.
- **Effort.** 180 min. **Duration.** 0.5d. **BAM type.** Deep.
- **Predecessors.** `kze_event_08`. **Successors.** `kze_event_10`.
- **Tools.** Wall.
- **Deliverables.** Future-State Map (A15 draft).
- **Outputs.** Future state.
- **Acceptance.** Every top-X attacked.
- **Risk if skipped.** Day 3 produces cosmetics.
- **Standardization.** L. **AI-support.** —. **Automation.** L.

---

**`kze_event_10` — Day 3 afternoon: `#47` FMEA on future-state** → `#47`
- **Purpose.** Execute catalog `#47` FMEA: identify failure modes of the future-state design; score Severity × Occurrence × Detection; rank RPN.
- **Operational definition.** `#47` CLOSED: ≥15 failure modes; SOD scored; RPN computed; top-quartile RPN items have mitigations.
- **Required inputs.** A15 Future-State Map.
- **Source of inputs.** `kze_event_09`.
- **Activity steps.** (a) Walk future-state step-by-step. (b) Per step, brainstorm "what could go wrong?" (c) Score Severity (1–10), Occurrence (1–10), Detection (1–10). (d) Compute RPN = S × O × D. (e) Rank. (f) For top-quartile RPN (or RPN > 100), design mitigation. (g) Write Action column.
- **Responsible owner.** Facilitator. **Supporting.** full team.
- **Effort.** 240 min (matches catalog `#47`). **Duration.** 0.5d. **BAM type.** Deep.
- **Predecessors.** `kze_event_09`. **Successors.** `kze_event_11`.
- **Tools.** `#47` template; wall.
- **Deliverables.** FMEA (A16; `#47` output).
- **Outputs.** Ranked failure modes + mitigations.
- **Acceptance.** ≥15 modes; top-quartile has mitigations.
- **Risk if skipped.** Future-state ships bugs.
- **Standardization.** H. **AI-support.** Composer Explainer (FMEA prompts). **Automation.** L.

---

**`kze_event_11` — Day 4 morning: Backlog authoring**
- **Purpose.** Translate future-state + FMEA mitigations into A17 Implementation Backlog with owner, due date, acceptance criterion per item.
- **Operational definition.** A17 with ≥20 items; every item has owner + due + acceptance; sized S/M/L; sequenced.
- **Required inputs.** A15 Future-State; A16 FMEA; A07 Roster.
- **Source of inputs.** `kze_event_10`.
- **Activity steps.** (a) Enumerate structural changes from future-state. (b) Enumerate FMEA mitigations. (c) Enumerate training and comm items. (d) Per item: owner, due date, acceptance criterion, size (S/M/L), priority. (e) Sequence (structural first, polish last). (f) Dot-vote priority; adjust.
- **Responsible owner.** Facilitator. **Supporting.** full team, Process Owner, Implementation Lead.
- **Effort.** 180 min. **Duration.** 0.5d. **BAM type.** Deep.
- **Predecessors.** `kze_event_10`. **Successors.** `kze_event_12`.
- **Tools.** A17 template.
- **Deliverables.** Implementation Backlog (A17 draft).
- **Outputs.** Prioritized backlog.
- **Acceptance.** Every item owned + sized.
- **Risk if skipped.** Post-Event has no plan.
- **Standardization.** M. **AI-support.** Planning Agent (RICE/WSJF scoring). **Automation.** M.

---

**`kze_event_12` — Day 4 midday: Future-state SOP drafting**
- **Purpose.** Draft A18 Future-State SOPs v2.0-draft covering every activity in the future-state map.
- **Operational definition.** A18 draft SOP per activity; diff vs A10 baseline visible.
- **Required inputs.** A15; A10.
- **Source of inputs.** `kze_event_09`.
- **Activity steps.** (a) Split team by function. (b) Per function, author v2.0 draft SOPs for lanes. (c) Plenary review. (d) Version-tag v2.0-draft.
- **Responsible owner.** Facilitator. **Supporting.** full team, SMEs.
- **Effort.** 180 min. **Duration.** 0.5d. **BAM type.** Deep.
- **Predecessors.** `kze_event_09`. **Successors.** `kze_event_13`.
- **Tools.** SOP repo.
- **Deliverables.** Future-State SOPs draft (A18).
- **Outputs.** v2.0-draft SOPs.
- **Acceptance.** Every activity covered.
- **Risk if skipped.** Implementation has no SOP target.
- **Standardization.** M. **AI-support.** Composer Explainer (SOP auto-draft from map). **Automation.** M.

---

**`kze_event_13` — Day 4 afternoon: Decision Log consolidation**
- **Purpose.** Consolidate all Kaizen Week decisions (scope refinements, prioritization, FMEA mitigations deferred, scope changes) into A19 Decision Log.
- **Operational definition.** A19 with every decision captured: date, decision, rationale, decider.
- **Required inputs.** All Day 1–4 artifacts.
- **Source of inputs.** upstream.
- **Activity steps.** (a) Facilitator walks artifacts. (b) Enumerate decisions. (c) Capture context per decision. (d) Write A19.
- **Responsible owner.** Facilitator. **Supporting.** scribe.
- **Effort.** 60 min. **Duration.** 0.25d. **BAM type.** Deep.
- **Predecessors.** `kze_event_11`, `kze_event_12`. **Successors.** `kze_event_14`.
- **Tools.** A19 template.
- **Deliverables.** Decision Log (A19).
- **Outputs.** Audit trail.
- **Acceptance.** Every decision captured.
- **Risk if skipped.** Rationale forgotten at Day 85.
- **Standardization.** H. **AI-support.** Reflection Agent. **Automation.** M.

---

**`kze_event_14` — Day 5 opening: Control Plan draft**
- **Purpose.** Per Part 1.7 refinement #3, draft Control Plan v1 during Kaizen Week (not Day 85); name monitoring metric, threshold, response, owner.
- **Operational definition.** A20 Control Plan draft: monitoring metric (= primary Y from A05); threshold; out-of-control response; rollback trigger; owner = Process Owner; 30/60/90 check-in cadence seeded.
- **Required inputs.** A05 KPI targets; A15 future-state; A20 template.
- **Source of inputs.** upstream.
- **Activity steps.** (a) Identify monitoring metric (primary Y). (b) Set threshold (acceptable range). (c) Define out-of-control response (who acts, within what SLA). (d) Define rollback trigger (when do we revert?). (e) Name Process Owner as accountable. (f) Seed 30/60/90 check-in cadence on calendar.
- **Responsible owner.** Facilitator. **Supporting.** Process Owner, Sponsor.
- **Effort.** 90 min. **Duration.** 0.25d. **BAM type.** Deep.
- **Predecessors.** `kze_event_13`. **Successors.** `kze_event_15`.
- **Tools.** A20 template.
- **Deliverables.** Control Plan draft (A20 v0.1).
- **Outputs.** Draft.
- **Acceptance.** All fields populated.
- **Risk if skipped.** Day 85 rush; sustainment undesigned.
- **Standardization.** H. **AI-support.** Composer Explainer. **Automation.** M.

---

**`kze_event_15` — Day 5 midday: Rollout Checklist seeding**
- **Purpose.** Seed A21 Rollout Checklist with all rollout steps from A17 backlog training + communication + SOP publication + system configuration.
- **Operational definition.** A21 with ≥15 rollout steps; each step has owner + date + acceptance.
- **Required inputs.** A17 backlog.
- **Source of inputs.** `kze_event_11`.
- **Activity steps.** (a) Filter A17 for rollout-flavored items. (b) Add SOP publication steps. (c) Add comm steps. (d) Add training steps. (e) Add rollback-ready acceptance per step.
- **Responsible owner.** Change-Management partner. **Supporting.** Facilitator, Implementation Lead.
- **Effort.** 60 min. **Duration.** 0.25d. **BAM type.** Deep.
- **Predecessors.** `kze_event_11`. **Successors.** `kze_event_16`.
- **Tools.** A21 template.
- **Deliverables.** Rollout Checklist (A21 v0.1).
- **Outputs.** Rollout plan seed.
- **Acceptance.** ≥15 steps.
- **Risk if skipped.** Rollout ad-hoc.
- **Standardization.** H. **AI-support.** Composer Explainer. **Automation.** M.

---

**`kze_event_16` — Day 5 afternoon: Sponsor readout and commitments memo**
- **Purpose.** Sponsor readout: presents future-state + backlog + training + ROI projection; Sponsor signs Day 5 commitments.
- **Operational definition.** A22 Commitments Memo: Sponsor's top-3 commitments (weekly status attendance, Sustainment Gate sign-off, rebaseline authorization); PO commitments; team commitments; signed.
- **Required inputs.** A15, A16, A17, A18, A20, A21.
- **Source of inputs.** Day 1–5 upstream.
- **Activity steps.** (a) 45-min readout: current state, root causes, future state, FMEA, backlog, Control Plan draft, rollout. (b) Sponsor Q&A. (c) Draft Commitments memo. (d) Sign. (e) Celebrate.
- **Responsible owner.** Facilitator. **Supporting.** Sponsor, Process Owner, team, Finance partner (observer).
- **Effort.** 90 min. **Duration.** 0.5d. **BAM type.** Communication.
- **Predecessors.** `kze_event_14`, `kze_event_15`. **Successors.** `kze_event_17`.
- **Tools.** Meeting.
- **Deliverables.** Commitments Memo (A22).
- **Outputs.** Sign-off.
- **Acceptance.** Signatures captured.
- **Risk if skipped.** No handoff to Post-Event.
- **Standardization.** M. **AI-support.** —. **Automation.** L.

---

**`kze_event_17` — Day 5 close: phase advance to POST_EVENT**
- **Purpose.** Facilitator calls `advancePhase()`; `Kaizen.phase='POST_EVENT'`.
- **Operational definition.** Phase advance event emitted; sub-phase 13 exit criteria met: `#42`–`#47` CLOSED; Control draft + backlog + SOPs + rollout published.
- **Required inputs.** A22 signatures.
- **Source of inputs.** `kze_event_16`.
- **Activity steps.** (a) Verify exit gate. (b) Call `advancePhase()`. (c) Emit telemetry.
- **Responsible owner.** Facilitator. **Supporting.** —.
- **Effort.** 15 min. **Duration.** 0.25d. **BAM type.** CI.
- **Predecessors.** `kze_event_16`. **Successors.** `kze_postevent_01`.
- **Tools.** CadencePlan.
- **Deliverables.** `ProjectPhaseAdvanced` event.
- **Outputs.** phase=POST_EVENT.
- **Acceptance.** Event emitted.
- **Risk if skipped.** Composer doesn't filter Post-Event payload.
- **Standardization.** H. **AI-support.** —. **Automation.** H.

### POST_EVENT — Days 20–70 (Implementation, Sub-phases 14–17)

---

**`kze_postevent_01` — Day 20: Sprint Plan authoring**
- **Purpose.** Convert A17 backlog into A23 Sprint Plan for Weeks 4–10 (7 sprints); sequence by dependency + impact.
- **Operational definition.** A23 with 7 weekly sprints; each sprint has 3–7 items; every item from A17 placed.
- **Required inputs.** A17 backlog.
- **Source of inputs.** Event phase.
- **Activity steps.** (a) Sequence items by structural→polish. (b) Chunk into 7 sprints. (c) Confirm capacity per owner per sprint. (d) Lock Sprint 1. (e) Publish A23.
- **Responsible owner.** Implementation Lead. **Supporting.** Facilitator, Process Owner, owners.
- **Effort.** 120 min. **Duration.** 1d. **BAM type.** Deep.
- **Predecessors.** `kze_event_17`. **Successors.** `kze_postevent_02`.
- **Tools.** Sprint planning tool / spreadsheet.
- **Deliverables.** Sprint Plan (A23).
- **Outputs.** 7-sprint plan.
- **Acceptance.** Every A17 item placed; capacity fits.
- **Risk if skipped.** Implementation chaos.
- **Standardization.** M. **AI-support.** Planning Agent (capacity fit). **Automation.** M.

---

**`kze_postevent_02` — Day 20–21: Owner commitment and calendar reservation**
- **Purpose.** Every owner accepts assignment; Deep blocks reserved on calendar for Weeks 4–10.
- **Operational definition.** 100% accept rate; calendar holds visible; composer Deep-block payload routing confirmed.
- **Required inputs.** A23.
- **Source of inputs.** `kze_postevent_01`.
- **Activity steps.** (a) Facilitator sends accept requests. (b) Owners accept or counter. (c) Place Deep-block holds. (d) Confirm.
- **Responsible owner.** Facilitator. **Supporting.** owners.
- **Effort.** 60 min. **Duration.** 1d. **BAM type.** Communication.
- **Predecessors.** `kze_postevent_01`. **Successors.** `kze_postevent_03`.
- **Tools.** Calendar + composer.
- **Deliverables.** Owner-commitment record.
- **Outputs.** Reserved blocks.
- **Acceptance.** 100% accept.
- **Risk if skipped.** Calendar competes with BAU.
- **Standardization.** H. **AI-support.** Composer Explainer. **Automation.** H.

---

**`kze_postevent_03` — Weekly Monday planning (Weeks 4–10)**
- **Purpose.** 30-min Monday planning: confirm week's items; surface risks; adjust sequence.
- **Operational definition.** Weekly planning note with: items for this week, owners, at-risk flags, blockers from last week.
- **Required inputs.** A23; prior Friday demo/retro.
- **Source of inputs.** `kze_postevent_01`, `kze_postevent_06`.
- **Activity steps.** (a) Review Sprint Plan week. (b) Confirm owner status per item. (c) Flag at-risk. (d) Adjust sequence if needed. (e) Publish note.
- **Responsible owner.** Implementation Lead. **Supporting.** team.
- **Effort.** 30 min. **Duration.** weekly. **BAM type.** Communication.
- **Predecessors.** `kze_postevent_02`. **Successors.** `kze_postevent_04`.
- **Tools.** Meeting.
- **Deliverables.** Weekly planning note (fragment of A24).
- **Outputs.** Aligned week.
- **Acceptance.** Note published by Mon 10am.
- **Risk if skipped.** Week drifts.
- **Standardization.** H. **AI-support.** Planning Agent (risk surfacing). **Automation.** L.

---

**`kze_postevent_04` — Weekly Wednesday mid-week check**
- **Purpose.** 15-min Wed check: are items on track? blockers?
- **Operational definition.** Wed note: % complete by owner; blockers flagged; mitigation assigned.
- **Required inputs.** Monday plan.
- **Source of inputs.** `kze_postevent_03`.
- **Activity steps.** (a) Ask each owner. (b) Log blockers. (c) Assign mitigation.
- **Responsible owner.** Implementation Lead. **Supporting.** team.
- **Effort.** 15 min. **Duration.** weekly. **BAM type.** Communication.
- **Predecessors.** `kze_postevent_03`. **Successors.** `kze_postevent_05`.
- **Tools.** Meeting.
- **Deliverables.** Wed check note (fragment of A24).
- **Outputs.** Blocker list.
- **Acceptance.** Note captured.
- **Risk if skipped.** Friday surprise.
- **Standardization.** H. **AI-support.** Momentum Agent. **Automation.** L.

---

**`kze_postevent_05` — Execute backlog items (per owner, per sprint)** → `#48`
- **Purpose.** Per item, execute per acceptance criterion; log before/after; mark doneAt. Accumulates evidence for catalog `#48` Implemented Improvements (23h catalog duration distributes across 7 sprints).
- **Operational definition.** Each item has doneAt timestamp + before/after log + SOP update reference.
- **Required inputs.** A17; A18 future-state SOPs; system access.
- **Source of inputs.** `kze_postevent_02`.
- **Activity steps.** (a) Open Deep block. (b) Execute per SOP. (c) Verify acceptance. (d) Log before/after. (e) Mark doneAt. (f) Trigger SOP versioning (`kze_postevent_07`). (g) Update A17.
- **Responsible owner.** Action owner (per-item). **Supporting.** Implementation Lead, SMEs.
- **Effort.** 60–480 min per item. **Duration.** Weeks 4–10. **BAM type.** Deep.
- **Predecessors.** `kze_postevent_02`. **Successors.** `kze_postevent_06`, `kze_postevent_07`.
- **Tools.** Systems of record.
- **Deliverables.** Implemented item (fragment of `#48`); before/after log.
- **Outputs.** Shipped change.
- **Acceptance.** Acceptance criterion met; log filed.
- **Risk if skipped.** Backlog doesn't ship.
- **Standardization.** L. **AI-support.** Momentum Agent (coaching). **Automation.** L.

---

**`kze_postevent_06` — Weekly Friday demo and retro**
- **Purpose.** 30-min Fri: demo items shipped this week; retro on sprint; feed into next Mon.
- **Operational definition.** Fri note: items demoed, retro observations, actions for next week.
- **Required inputs.** Week's work.
- **Source of inputs.** `kze_postevent_05`.
- **Activity steps.** (a) Owners demo shipped items (2 min each). (b) 10-min retro (what worked, what didn't). (c) 3 actions for next sprint.
- **Responsible owner.** Implementation Lead. **Supporting.** Process Owner, team.
- **Effort.** 30 min. **Duration.** weekly. **BAM type.** Communication.
- **Predecessors.** `kze_postevent_05`. **Successors.** `kze_postevent_03` (next week).
- **Tools.** Meeting.
- **Deliverables.** Fri demo/retro note (fragment of A24).
- **Outputs.** Sprint close.
- **Acceptance.** Note filed.
- **Risk if skipped.** Sprint velocity invisible.
- **Standardization.** H. **AI-support.** Reflection Agent. **Automation.** L.

---

**`kze_postevent_07` — SOP versioning on each structural change**
- **Purpose.** Every time a structural item ships, bump the relevant SOP version and publish.
- **Operational definition.** A18 SOP for affected activity has a version bump matching the item; published to repo.
- **Required inputs.** Shipped item from `kze_postevent_05`.
- **Source of inputs.** `kze_postevent_05`.
- **Activity steps.** (a) Per shipped item, identify affected SOP. (b) Apply change to SOP. (c) Bump version. (d) Publish. (e) Notify affected roles.
- **Responsible owner.** SME (per function). **Supporting.** Facilitator.
- **Effort.** 30 min per update. **Duration.** rolling. **BAM type.** CI.
- **Predecessors.** `kze_postevent_05`. **Successors.** `kze_postevent_14`.
- **Tools.** SOP repo.
- **Deliverables.** SOP version bump.
- **Outputs.** Versioned SOP.
- **Acceptance.** Every structural item has SOP bump.
- **Risk if skipped.** SOP drift at Day 70.
- **Standardization.** M. **AI-support.** Composer Explainer (auto-draft SOP diffs). **Automation.** M.

---

**`kze_postevent_08` — Weekly status report to Sponsor**
- **Purpose.** End-of-week rollup to Sponsor: % complete, velocity, at-risk items, asks.
- **Operational definition.** A24 Weekly Status Report delivered Fri EOB or Mon 8am.
- **Required inputs.** Week's sprint data.
- **Source of inputs.** `kze_postevent_03` – `_06`.
- **Activity steps.** (a) Aggregate velocity. (b) Spot at-risk. (c) Write rollup. (d) Flag any Sponsor-ask. (e) Send.
- **Responsible owner.** Facilitator. **Supporting.** Implementation Lead.
- **Effort.** 30 min. **Duration.** weekly. **BAM type.** Deep.
- **Predecessors.** `kze_postevent_06`. **Successors.** —.
- **Tools.** A24 template.
- **Deliverables.** Weekly Status Report (A24).
- **Outputs.** Sponsor visibility.
- **Acceptance.** Delivered every week.
- **Risk if skipped.** Sponsor discovers slippage at Day 70.
- **Standardization.** H. **AI-support.** Composer Explainer (auto-draft status). **Automation.** H.

---

**`kze_postevent_09` — Author Change Management Plan (A27)**
- **Purpose.** Author A27: communication cadence, training design, adoption plan, sentiment tracking.
- **Operational definition.** A27 with: impacted audience list, communication cadence (per audience × channel × frequency × format × owner), training design (format, duration, delivery window), adoption-tracking method.
- **Required inputs.** A15 future-state; A18 SOPs; A17 backlog.
- **Source of inputs.** Event + early Post-Event.
- **Activity steps.** (a) Enumerate impacted audiences. (b) Per audience, design comm cadence. (c) Design training. (d) Design adoption tracking. (e) Review with Sponsor.
- **Responsible owner.** Change-Management partner. **Supporting.** Facilitator, Process Owner.
- **Effort.** 240 min. **Duration.** 2d. **BAM type.** Deep.
- **Predecessors.** `kze_event_17`. **Successors.** `kze_postevent_10`, `kze_postevent_11`.
- **Tools.** A27 template.
- **Deliverables.** Change Management Plan (A27).
- **Outputs.** Plan.
- **Acceptance.** All impacted audiences covered.
- **Risk if skipped.** Adoption fails.
- **Standardization.** M. **AI-support.** Composer Explainer. **Automation.** L.

---

**`kze_postevent_10` — Author Training Materials (A26)**
- **Purpose.** Build A26 Training Materials per A27 design: slides, quick-reference cards, video demo, hands-on exercises.
- **Operational definition.** A26 covers every v2.0 SOP; training duration ≤ 90 min per audience; assessment included.
- **Required inputs.** A18 SOPs; A27 design.
- **Source of inputs.** `kze_postevent_09`.
- **Activity steps.** (a) Outline. (b) Build slides. (c) Build cards. (d) Record demo. (e) Design assessment. (f) Pilot-test with 2 adopters. (g) Iterate.
- **Responsible owner.** Change-Management partner. **Supporting.** SMEs, trainer.
- **Effort.** 360 min. **Duration.** 3d. **BAM type.** Deep.
- **Predecessors.** `kze_postevent_09`. **Successors.** `kze_postevent_12`.
- **Tools.** Slide tool; video; LMS.
- **Deliverables.** Training Materials (A26).
- **Outputs.** Materials.
- **Acceptance.** Pilot-tested.
- **Risk if skipped.** Training fails.
- **Standardization.** H. **AI-support.** Composer Explainer (first-draft slides from SOPs). **Automation.** M.

---

**`kze_postevent_11` — Stakeholder communication (per A27 cadence)**
- **Purpose.** Execute A27 communication cadence: stakeholder updates, impacted-audience announcements.
- **Operational definition.** Per A27, each channel × audience has scheduled comms; adherence ≥ 90%.
- **Required inputs.** A27.
- **Source of inputs.** `kze_postevent_09`.
- **Activity steps.** (a) Author comm. (b) Review. (c) Send per schedule. (d) Log acknowledgement.
- **Responsible owner.** Change-Management partner. **Supporting.** Facilitator.
- **Effort.** 30 min per comm. **Duration.** Weeks 4–10. **BAM type.** Communication.
- **Predecessors.** `kze_postevent_09`. **Successors.** —.
- **Tools.** Email; chat; intranet.
- **Deliverables.** Comms record.
- **Outputs.** Informed stakeholders.
- **Acceptance.** ≥ 90% cadence adherence.
- **Risk if skipped.** Rumor fills void.
- **Standardization.** M. **AI-support.** Composer Explainer (first-draft comms). **Automation.** M.

---

**`kze_postevent_12` — Deliver training (live or async)**
- **Purpose.** Run training sessions per A26 + A27.
- **Operational definition.** Per target audience, ≥90% attendance OR ≥90% completion of async; assessment pass rate ≥80%.
- **Required inputs.** A26; audience list.
- **Source of inputs.** `kze_postevent_10`.
- **Activity steps.** (a) Schedule sessions. (b) Deliver. (c) Administer assessment. (d) Log attendance + pass rate. (e) Follow-up on misses.
- **Responsible owner.** Change-Management partner. **Supporting.** SMEs, trainer.
- **Effort.** 90 min per session. **Duration.** Weeks 5–7. **BAM type.** Communication.
- **Predecessors.** `kze_postevent_10`. **Successors.** `kze_postevent_13`, `kze_postevent_14`.
- **Tools.** Training platform.
- **Deliverables.** Training attendance log.
- **Outputs.** Trained population.
- **Acceptance.** ≥90% attendance; ≥80% assessment pass.
- **Risk if skipped.** Adoption fails.
- **Standardization.** H. **AI-support.** —. **Automation.** M.

---

**`kze_postevent_13` — Execute rollout checkpoints (pilot + full)**
- **Purpose.** Execute A21 Rollout Checklist: pilot rollout first, then full.
- **Operational definition.** A21 checkpoint 1 (pilot — 1 team or 1 site) complete at Week 6; checkpoint 2 (full) complete at Week 9.
- **Required inputs.** A21; A18 SOPs; trained population.
- **Source of inputs.** `kze_postevent_12`.
- **Activity steps.** (a) Pilot rollout — 1 wave. (b) 2 weeks of pilot data. (c) Retro. (d) Adjust. (e) Full rollout. (f) 2 weeks of full data. (g) Close A21.
- **Responsible owner.** Change-Management partner. **Supporting.** Process Owner, Implementation Lead.
- **Effort.** Variable. **Duration.** Weeks 6–9. **BAM type.** Deep.
- **Predecessors.** `kze_postevent_12`. **Successors.** `kze_postevent_14`.
- **Tools.** A21.
- **Deliverables.** Rollout Checklist completed.
- **Outputs.** Full rollout.
- **Acceptance.** Both checkpoints closed.
- **Risk if skipped.** Big-bang fails.
- **Standardization.** H. **AI-support.** Composer Explainer (checklist). **Automation.** M.

---

**`kze_postevent_14` — Adoption audits (Weeks 6, 8, 10)**
- **Purpose.** Audit SOP adoption at 3 checkpoints; log adoption rate per function; feed re-training triggers.
- **Operational definition.** A28 Adoption Log with 3 audit entries; rate per function; <80% triggers action.
- **Required inputs.** A18 v2.0 SOPs; trained population; production sample.
- **Source of inputs.** `kze_postevent_12`, `kze_postevent_13`.
- **Activity steps.** (a) Observe ≥10 instances per function. (b) Score adherence to v2.0 SOP. (c) Log rate. (d) Flag <80%. (e) Trigger re-training or SOP redesign.
- **Responsible owner.** Process Owner. **Supporting.** SMEs, ChM partner.
- **Effort.** 90 min per audit. **Duration.** Weeks 6, 8, 10. **BAM type.** CI.
- **Predecessors.** `kze_postevent_12`. **Successors.** `kze_postevent_15`.
- **Tools.** Audit template; observation.
- **Deliverables.** Adoption Log (A28).
- **Outputs.** Rate per function.
- **Acceptance.** 3 audits complete; <80% triggers documented action.
- **Risk if skipped.** Rebaseline on unadopted SOP.
- **Standardization.** H. **AI-support.** Reflection Agent (pattern). **Automation.** M.

---

**`kze_postevent_15` — Adoption remediation (on-signal)**
- **Purpose.** When `kze_postevent_14` flags <80% adoption, triage: re-train, redesign SOP, or escalate.
- **Operational definition.** Per flagged function, action taken within 5 working days; follow-up audit next cycle.
- **Required inputs.** A28 flag.
- **Source of inputs.** `kze_postevent_14`.
- **Activity steps.** (a) Root-cause the gap. (b) Choose re-train / redesign / escalate. (c) Execute. (d) Re-audit.
- **Responsible owner.** Change-Management partner. **Supporting.** Process Owner, Facilitator.
- **Effort.** 120 min per remediation. **Duration.** on-signal. **BAM type.** Communication.
- **Predecessors.** `kze_postevent_14`. **Successors.** `kze_postevent_14` (re-audit).
- **Tools.** —.
- **Deliverables.** Remediation plan entry in A28.
- **Outputs.** Adoption recovered.
- **Acceptance.** Rate ≥80% at next audit.
- **Risk if skipped.** Rebaseline fails.
- **Standardization.** M. **AI-support.** Planning Agent. **Automation.** L.

---

**`kze_postevent_16` — Issue/risk triage (on-signal)**
- **Purpose.** Per flagged issue from `kze_postevent_04` or `_08` or `_13`, triage and assign.
- **Operational definition.** A25 Issue/Risk Log entry with severity (S1/S2/S3), owner, SLA.
- **Required inputs.** Issue signal.
- **Source of inputs.** upstream.
- **Activity steps.** (a) Log. (b) Score severity. (c) Assign owner. (d) Set SLA. (e) Track to close.
- **Responsible owner.** Facilitator. **Supporting.** Sponsor (S1 escalations).
- **Effort.** 30 min per issue. **Duration.** on-signal. **BAM type.** Communication.
- **Predecessors.** any. **Successors.** `kze_postevent_05` (unblock).
- **Tools.** A25.
- **Deliverables.** Issue log entry.
- **Outputs.** Triaged.
- **Acceptance.** All S1 within 24 h; S2 within 72 h.
- **Risk if skipped.** Execution stalls invisibly.
- **Standardization.** H. **AI-support.** Planning Agent (pattern). **Automation.** M.

---

**`kze_postevent_17` — Sponsor escalation (on-signal, S1 only)**
- **Purpose.** When S1 issue stalls > 24 h, escalate to Sponsor per A22 commitments.
- **Operational definition.** 30-min Sponsor call; decision captured; action resumed.
- **Required inputs.** S1 issue from A25.
- **Source of inputs.** `kze_postevent_16`.
- **Activity steps.** (a) Brief Sponsor. (b) Present options. (c) Capture decision. (d) Log in A25 + A19 Decision Log.
- **Responsible owner.** Facilitator. **Supporting.** Sponsor.
- **Effort.** 30 min. **Duration.** on-signal. **BAM type.** Communication.
- **Predecessors.** `kze_postevent_16`. **Successors.** `kze_postevent_05` (resumed).
- **Tools.** Meeting.
- **Deliverables.** Sponsor decision.
- **Outputs.** Unblocked.
- **Acceptance.** Decision within 24 h of escalation.
- **Risk if skipped.** S1 festers.
- **Standardization.** H. **AI-support.** —. **Automation.** L.

---

**`kze_postevent_18` — Mid-project Sponsor checkpoint (Day 45)**
- **Purpose.** Day 45 explicit Sponsor checkpoint: progress vs plan; Sustainment Gate risk flag.
- **Operational definition.** 45-min readout; confidence rating (G/Y/R); risk flags; commitments reaffirmed.
- **Required inputs.** A24 status reports to date.
- **Source of inputs.** `kze_postevent_08`.
- **Activity steps.** (a) Facilitator prep. (b) Sponsor readout. (c) Adjust plan. (d) Log.
- **Responsible owner.** Facilitator. **Supporting.** Sponsor, Process Owner, Implementation Lead.
- **Effort.** 60 min. **Duration.** Day 45. **BAM type.** Communication.
- **Predecessors.** `kze_postevent_08`. **Successors.** `kze_postevent_03` (adjusted).
- **Tools.** Meeting.
- **Deliverables.** Mid-project checkpoint note.
- **Outputs.** Adjusted plan.
- **Acceptance.** G/Y/R rating explicit.
- **Risk if skipped.** Day 70 surprise.
- **Standardization.** H. **AI-support.** Reflection Agent. **Automation.** L.

---

**`kze_postevent_19` — Weekly capacity protection audit**
- **Purpose.** Verify owners' Deep blocks are not being eaten by BAU; raise with managers if <60%.
- **Operational definition.** Per owner per week, % of scheduled Deep blocks that actually ran; <60% triggers intervention.
- **Required inputs.** Composer telemetry.
- **Source of inputs.** CadencePlan.
- **Activity steps.** (a) Pull telemetry. (b) Compute per owner. (c) Flag <60%. (d) Raise with owner's manager.
- **Responsible owner.** Facilitator. **Supporting.** Implementation Lead.
- **Effort.** 30 min weekly. **Duration.** weekly. **BAM type.** CI.
- **Predecessors.** `kze_postevent_02`. **Successors.** escalation if needed.
- **Tools.** Composer telemetry.
- **Deliverables.** Capacity-protection log.
- **Outputs.** Protected capacity.
- **Acceptance.** ≥60% per owner per week.
- **Risk if skipped.** Backlog velocity drops invisibly.
- **Standardization.** H. **AI-support.** Momentum Agent. **Automation.** H.

---

**`kze_postevent_20` — Implementation completion check (Day 65)**
- **Purpose.** Day 65 check: ≥80% of strategic items done? if not, Sponsor decision on deferrals or extended Post-Event.
- **Operational definition.** A17 rollup: strategic items complete %; deferrals documented with Sponsor sign-off.
- **Required inputs.** A17.
- **Source of inputs.** `kze_postevent_05`.
- **Activity steps.** (a) Compute strategic complete %. (b) If <80%, list unfinished. (c) Sponsor decision per item. (d) Document in A19.
- **Responsible owner.** Facilitator. **Supporting.** Sponsor, Implementation Lead.
- **Effort.** 60 min. **Duration.** Day 65. **BAM type.** Deep.
- **Predecessors.** `kze_postevent_05`. **Successors.** `kze_postevent_21`.
- **Tools.** A17.
- **Deliverables.** Completion check memo.
- **Outputs.** Deferral decisions.
- **Acceptance.** Strategic complete ≥80% OR deferrals signed.
- **Risk if skipped.** Sustainment Gate fails.
- **Standardization.** H. **AI-support.** Planning Agent. **Automation.** H.

---

**`kze_postevent_21` — Pre-Sustainment adoption confirmation (Day 68–70)**
- **Purpose.** Confirm adoption ≥80% held for 2 consecutive weeks per Part 7 §7.9 Sustainment Gate.
- **Operational definition.** Last 2 adoption audits ≥80%; no rollback events in last 2 weeks.
- **Required inputs.** A28 Adoption Log; rollback log (in A25).
- **Source of inputs.** `kze_postevent_14`, `kze_postevent_16`.
- **Activity steps.** (a) Review last 2 audits. (b) Confirm ≥80%. (c) Check rollback log. (d) Decide gate pass/fail.
- **Responsible owner.** Facilitator. **Supporting.** Process Owner.
- **Effort.** 30 min. **Duration.** Day 68–70. **BAM type.** CI.
- **Predecessors.** `kze_postevent_14`. **Successors.** `kze_postevent_22`.
- **Tools.** A28.
- **Deliverables.** Sustainment Gate decision.
- **Outputs.** Pass/fail.
- **Acceptance.** ≥80% × 2 weeks, no rollbacks.
- **Risk if skipped.** Rebaseline on unstable state.
- **Standardization.** H. **AI-support.** —. **Automation.** H.

---

**`kze_postevent_22` — Phase advance to SUSTAIN (Day 70)**
- **Purpose.** Sustainment Gate passed; `Kaizen.phase` advances.
- **Operational definition.** `ProjectPhaseAdvanced{from:'POST_EVENT',to:'SUSTAIN'}` emitted.
- **Required inputs.** Gate pass from `kze_postevent_21`.
- **Source of inputs.** `kze_postevent_21`.
- **Activity steps.** (a) Call `advancePhase()`. (b) Confirm.
- **Responsible owner.** Facilitator. **Supporting.** —.
- **Effort.** 15 min. **Duration.** 0.25d. **BAM type.** CI.
- **Predecessors.** `kze_postevent_21`. **Successors.** `kze_sustain_01`.
- **Tools.** CadencePlan.
- **Deliverables.** Phase advance event.
- **Outputs.** phase=SUSTAIN.
- **Acceptance.** Event emitted.
- **Risk if skipped.** Composer can't filter Sustain payload.
- **Standardization.** H. **AI-support.** —. **Automation.** H.

### SUSTAIN — Days 71–90 (Sub-phases 18–19)

---

**`kze_sustain_01` — Rebaseline data collection kickoff (Day 71)**
- **Purpose.** Kick off rebaseline using identical method as `kze_preevent_13` per DCP (`#43`).
- **Operational definition.** Analyst has access; observation windows scheduled; same method/n/exclusions as baseline.
- **Required inputs.** `#43` DCP; access.
- **Source of inputs.** `kze_preevent_11`.
- **Activity steps.** (a) Pull DCP. (b) Schedule observation windows. (c) Confirm access. (d) Kick off.
- **Responsible owner.** Analyst. **Supporting.** Facilitator.
- **Effort.** 30 min. **Duration.** 0.25d. **BAM type.** Deep.
- **Predecessors.** `kze_postevent_22`. **Successors.** `kze_sustain_02`.
- **Tools.** Per DCP.
- **Deliverables.** Rebaseline collection schedule.
- **Outputs.** Kickoff.
- **Acceptance.** Method matches baseline.
- **Risk if skipped.** Rebaseline delayed.
- **Standardization.** H. **AI-support.** Planning Agent (lint drift). **Automation.** M.

---

**`kze_sustain_02` — Execute rebaseline data collection**
- **Purpose.** Collect A30 Rebaseline Dataset per method.
- **Operational definition.** A30 with n ≥ baseline n × 0.9; same exclusions; handoff observations ≥ baseline.
- **Required inputs.** DCP; access.
- **Source of inputs.** `kze_sustain_01`.
- **Activity steps.** (a) Collect. (b) Log exclusions. (c) Flag data quality. (d) Store.
- **Responsible owner.** Analyst. **Supporting.** SMEs.
- **Effort.** 240 min cumulative. **Duration.** 3–5d. **BAM type.** Deep.
- **Predecessors.** `kze_sustain_01`. **Successors.** `kze_sustain_03`.
- **Tools.** Per DCP.
- **Deliverables.** Rebaseline Dataset (A30).
- **Outputs.** Dataset.
- **Acceptance.** n ≥ plan; method match attested.
- **Risk if skipped.** No delta.
- **Standardization.** H. **AI-support.** —. **Automation.** M.

---

**`kze_sustain_03` — Compute post-implementation summary statistics**
- **Purpose.** Compute stats on A30; compute delta vs locked baseline.
- **Operational definition.** Delta table: metric | baseline | post | absolute Δ | % Δ | confidence.
- **Required inputs.** A08 baseline stats; A30.
- **Source of inputs.** `kze_sustain_02`.
- **Activity steps.** (a) Compute stats. (b) Pair with baseline. (c) Compute deltas. (d) Flag significance (simple two-sample t or proportion).
- **Responsible owner.** Analyst. **Supporting.** Facilitator.
- **Effort.** 90 min. **Duration.** 0.5d. **BAM type.** Deep.
- **Predecessors.** `kze_sustain_02`. **Successors.** `kze_sustain_04`.
- **Tools.** Spreadsheet / notebook.
- **Deliverables.** Performance Delta (fragment of A32).
- **Outputs.** Delta.
- **Acceptance.** Every baseline metric has paired post value.
- **Risk if skipped.** No objective claim.
- **Standardization.** H. **AI-support.** —. **Automation.** H.

---

**`kze_sustain_04` — Create Remeasurement row on Kaizen**
- **Purpose.** Bind A30 as `Remeasurement`; satisfy metric-definition-match guard.
- **Operational definition.** `Kaizen.remeasurementId` set; `remeasurement.metricDefinitionId === baseline.metricDefinitionId`.
- **Required inputs.** A30; locked baseline.
- **Source of inputs.** `kze_sustain_02`, `kze_preevent_14`.
- **Activity steps.** (a) Create Remeasurement. (b) Bind. (c) Verify match. (d) Compute `beatsBaseline`.
- **Responsible owner.** Facilitator. **Supporting.** —.
- **Effort.** 15 min. **Duration.** 0.25d. **BAM type.** Deep.
- **Predecessors.** `kze_sustain_03`. **Successors.** `kze_sustain_07`.
- **Tools.** CadencePlan.
- **Deliverables.** Remeasurement row.
- **Outputs.** `remeasurementId != null`.
- **Acceptance.** Close-gate ready for remeasurement guard.
- **Risk if skipped.** Close impossible.
- **Standardization.** H. **AI-support.** —. **Automation.** H.

---

**`kze_sustain_05` — Build Monitoring Dashboard (A31)**
- **Purpose.** Per A20 Control Plan, build live monitoring dashboard with threshold lines and ownership.
- **Operational definition.** A31 dashboard live at linkable URL; threshold annotated; PO as dashboard owner; auto-refresh daily or per DCP cadence.
- **Required inputs.** A20; A30 trend.
- **Source of inputs.** `kze_event_14`, `kze_sustain_02`.
- **Activity steps.** (a) Pick viz tool. (b) Build chart. (c) Add threshold. (d) Set auto-refresh. (e) Name PO as owner. (f) Publish.
- **Responsible owner.** Analyst. **Supporting.** Process Owner.
- **Effort.** 180 min. **Duration.** 1d. **BAM type.** Deep.
- **Predecessors.** `kze_event_14`. **Successors.** `kze_sustain_06`.
- **Tools.** BI tool (Looker/Tableau/Sheets).
- **Deliverables.** Monitoring Dashboard (A31).
- **Outputs.** Live dashboard.
- **Acceptance.** PO can open; auto-refresh verified.
- **Risk if skipped.** Control plan is paper.
- **Standardization.** M. **AI-support.** Composer Explainer (dashboard templates). **Automation.** M.

---

**`kze_sustain_06` — Finalize Control Plan (A20-final)**
- **Purpose.** Update A20 draft with rebaseline-adjusted thresholds; PO + Sponsor sign; create 30/60/90 check-in calendar holds.
- **Operational definition.** A20-final signed by PO + Sponsor; 30/60/90 holds on PO calendar; rollback playbook attached.
- **Required inputs.** A20 draft; A30 rebaseline; A31 dashboard.
- **Source of inputs.** `kze_event_14`, `kze_sustain_02`, `kze_sustain_05`.
- **Activity steps.** (a) Update thresholds. (b) Attach rollback playbook. (c) PO sign. (d) Sponsor sign. (e) Create 30/60/90 calendar holds on PO calendar. (f) File.
- **Responsible owner.** Facilitator. **Supporting.** PO, Sponsor.
- **Effort.** 120 min. **Duration.** 1d. **BAM type.** Deep.
- **Predecessors.** `kze_sustain_05`. **Successors.** `kze_sustain_10`.
- **Tools.** A20 template; calendar.
- **Deliverables.** Final Control Plan (A20-final); holds.
- **Outputs.** Signed Control Plan.
- **Acceptance.** PO + Sponsor signatures; holds visible.
- **Risk if skipped.** Sustainment drifts.
- **Standardization.** H. **AI-support.** Composer Explainer. **Automation.** M.

---

**`kze_sustain_07` — Benefit classification (Hard / Soft / Cost-Avoidance)**
- **Purpose.** Per Part 8 ROI logic, classify each benefit line.
- **Operational definition.** A29 Financial Impact draft with per-line classification + dollar value + evidence.
- **Required inputs.** Delta table from `kze_sustain_03`; unit-cost data from Finance.
- **Source of inputs.** `kze_sustain_03`; Finance.
- **Activity steps.** (a) Enumerate benefit lines. (b) Classify. (c) Quantify. (d) Attach evidence.
- **Responsible owner.** Facilitator. **Supporting.** Finance, PO.
- **Effort.** 120 min. **Duration.** 1d. **BAM type.** Deep.
- **Predecessors.** `kze_sustain_03`. **Successors.** `kze_sustain_08`.
- **Tools.** A29 template.
- **Deliverables.** Benefit classification (fragment of A29).
- **Outputs.** Classified benefits.
- **Acceptance.** Every line classified; Hard has P&L or FTE-release evidence.
- **Risk if skipped.** Inflated ROI.
- **Standardization.** H. **AI-support.** Planning Agent. **Automation.** M.

---

**`kze_sustain_08` — Compute implementation cost + annualized benefit**
- **Purpose.** Sum implementation cost (people + tools + systems); annualize benefit.
- **Operational definition.** `implementationCostDollars` + `annualBenefitsDollars` computed.
- **Required inputs.** Cost log; benefit classification.
- **Source of inputs.** `kze_postevent_05`, `kze_sustain_07`.
- **Activity steps.** (a) Sum people-hours × loaded rate. (b) Sum tool + system cost. (c) Annualize monthly delta (12×). (d) Confidence rating overall.
- **Responsible owner.** Facilitator. **Supporting.** Finance.
- **Effort.** 90 min. **Duration.** 0.5d. **BAM type.** Deep.
- **Predecessors.** `kze_sustain_07`. **Successors.** `kze_sustain_09`.
- **Tools.** Spreadsheet.
- **Deliverables.** A29 quantification.
- **Outputs.** Two dollar values.
- **Acceptance.** Both non-null.
- **Risk if skipped.** No ROI.
- **Standardization.** H. **AI-support.** —. **Automation.** M.

---

**`kze_sustain_09` — Finance sign-off on ROI**
- **Purpose.** Finance co-signs A29; values written to `Kaizen`.
- **Operational definition.** A29 signed; `implementationCostDollars` + `annualBenefitsDollars` written; `Kaizen.roi` computes.
- **Required inputs.** A29.
- **Source of inputs.** `kze_sustain_08`.
- **Activity steps.** (a) Walk Finance through A29. (b) Address challenges. (c) Capture signature. (d) Write to Kaizen.
- **Responsible owner.** Facilitator. **Supporting.** Finance.
- **Effort.** 60 min. **Duration.** 0.5–1d (Finance turnaround). **BAM type.** Communication.
- **Predecessors.** `kze_sustain_08`. **Successors.** `kze_sustain_10`.
- **Tools.** CadencePlan; email.
- **Deliverables.** Signed A29; Kaizen fields set.
- **Outputs.** `roi` computed.
- **Acceptance.** Finance signature.
- **Risk if skipped.** Close gate fails.
- **Standardization.** H. **AI-support.** —. **Automation.** L.

---

**`kze_sustain_10` — Execute `#49` Results Narrative 3-Pager** → `#49`
- **Purpose.** Per catalog `#49` procedure, author Results Narrative (extended to ~6 pages for 90-day scope).
- **Operational definition.** `#49` CLOSED: Page 1 Problem & Goal; Page 2 What Was Done; Page 3 Results; Page 4 Cross-Functional Insights; Page 5 Financial Benefit with confidence; Page 6 Lessons + PO transition status.
- **Required inputs.** A03, A17, A18, A20-final, A29, A30.
- **Source of inputs.** upstream.
- **Activity steps.** (a) Page 1 Problem & Goal: baseline, goal, team, dates, Process Owner. (b) Page 2 What Was Done: implemented items, SOP changes, before/after process diagram. (c) Page 3 Results: remeasured primary metric, delta absolute + %, secondary metrics. (d) Page 4 Cross-Functional Insights: handoff defect rate before/after; function-specific wins. (e) Page 5 Financial Benefit (Hard/Soft/Cost-Avoidance with confidence). (f) Page 6 Lessons + `#50` transition status. (g) Publish.
- **Responsible owner.** Facilitator. **Supporting.** Analyst, Process Owner.
- **Effort.** 180 min (catalog `#49` is 2h; 6-page extension adds 60 min). **Duration.** 1d. **BAM type.** Deep.
- **Predecessors.** `kze_sustain_06`, `kze_sustain_09`. **Successors.** `kze_sustain_11`.
- **Tools.** `#49` template.
- **Deliverables.** Results Narrative (`#49` output).
- **Outputs.** 6-page narrative.
- **Acceptance.** All 6 pages populated.
- **Risk if skipped.** No audit trail.
- **Standardization.** H. **AI-support.** Composer Explainer (first-draft from artifacts). **Automation.** M.

---

**`kze_sustain_11` — Executive readout (Sponsor + function leaders)**
- **Purpose.** Present A32 Executive Report; Sponsor + function leaders approve close.
- **Operational definition.** 60-min readout; A32 signed by Sponsor; function leaders acknowledge.
- **Required inputs.** A32; `#49` narrative; A29; A30; A20-final.
- **Source of inputs.** upstream.
- **Activity steps.** (a) Prep A32 Executive Report. (b) Schedule 60-min meeting. (c) Present. (d) Address. (e) Capture sign-off.
- **Responsible owner.** Facilitator. **Supporting.** Sponsor, Process Owner, function leaders, Finance.
- **Effort.** 90 min. **Duration.** 0.5d. **BAM type.** Communication.
- **Predecessors.** `kze_sustain_10`. **Successors.** `kze_sustain_12`.
- **Tools.** Meeting.
- **Deliverables.** Executive Report (A32) signed.
- **Outputs.** Sign-off.
- **Acceptance.** Sponsor + ≥1 function leader per function sign.
- **Risk if skipped.** Close without alignment.
- **Standardization.** M. **AI-support.** —. **Automation.** L.

---

**`kze_sustain_12` — Execute `#50` Process Owner Transition** → `#50`
- **Purpose.** Per catalog `#50` procedure, walk PO through implemented improvements + Control Plan + rollback; PO accepts sustainment.
- **Operational definition.** `#50` CLOSED: signed Transition document; PO accepts ongoing monitoring; 30/60/90 calendar holds on PO calendar confirmed; rollback playbook delivered.
- **Required inputs.** `#49` narrative; A20-final; A31 dashboard.
- **Source of inputs.** `kze_sustain_10`, `kze_sustain_06`, `kze_sustain_05`.
- **Activity steps.** (a) Walk PO through each implemented improvement + current performance vs baseline. (b) Confirm control measures (updated SOP, Control Chart thresholds, rollback). (c) Transfer monitoring ownership. (d) Confirm 30/60/90 check-in calendar holds. (e) PO + Facilitator sign Transition document. (f) File.
- **Responsible owner.** Facilitator. **Supporting.** Process Owner.
- **Effort.** 60 min (matches catalog `#50`). **Duration.** 0.5d. **BAM type.** Communication.
- **Predecessors.** `kze_sustain_11`. **Successors.** `kze_sustain_13`.
- **Tools.** `#50` template.
- **Deliverables.** Transition document (`#50` output).
- **Outputs.** Signed transition.
- **Acceptance.** Both signatures.
- **Risk if skipped.** Ownership ambiguous at Day 120.
- **Standardization.** H. **AI-support.** —. **Automation.** L.

---

**`kze_sustain_13` — Close the Kaizen**
- **Purpose.** Call `KaizenService.close()`; compute `closeKind`; emit `KaizenClosed`.
- **Operational definition.** `Kaizen.state='CLOSED'`; `closeKind ∈ {SUCCESS, PARTIAL, FAILED_HONEST}`.
- **Required inputs.** All close-gate inputs present.
- **Source of inputs.** upstream.
- **Activity steps.** (a) Verify gate: remeasurementId + roi + controlPlanArtifactRef. (b) Compute closeKind per remeasurement. (c) Call close(). (d) Emit event.
- **Responsible owner.** Facilitator. **Supporting.** —.
- **Effort.** 15 min. **Duration.** 0.25d. **BAM type.** Deep.
- **Predecessors.** `kze_sustain_12`. **Successors.** `kze_sustain_14`.
- **Tools.** CadencePlan.
- **Deliverables.** Close event.
- **Outputs.** state=CLOSED; closeKind set.
- **Acceptance.** Gate passes.
- **Risk if skipped.** Kaizen never closes.
- **Standardization.** H. **AI-support.** —. **Automation.** H.

---

**`kze_sustain_14` — Lessons Learned and Next-Process Recommendation (A33, A34)**
- **Purpose.** Author A34 Lessons Learned and A33 Next-Process Recommendation.
- **Operational definition.** A34: what worked / what didn't / what to replicate / anti-patterns. A33: next-candidate ranking re-scored with lessons.
- **Required inputs.** Kaizen Week retros + Post-Event retros; A02 candidate scorecard.
- **Source of inputs.** upstream + `kze_preevent_04`.
- **Activity steps.** (a) Run 30-min final retro. (b) Synthesize lessons. (c) Write A34. (d) Re-score A02 candidates. (e) Recommend next.
- **Responsible owner.** Facilitator. **Supporting.** team.
- **Effort.** 120 min. **Duration.** 1d. **BAM type.** CI.
- **Predecessors.** `kze_sustain_13`. **Successors.** `kze_sustain_15`.
- **Tools.** Retro template; A33/A34 templates.
- **Deliverables.** A34, A33 drafts.
- **Outputs.** Memos.
- **Acceptance.** ≥5 lessons; ≥1 next-candidate recommended.
- **Risk if skipped.** Next Kaizen 90 repeats mistakes.
- **Standardization.** H. **AI-support.** Reflection Agent. **Automation.** M.

---

**`kze_sustain_15` — Sponsor handoff and N+1 decision**
- **Purpose.** Deliver A33 to Sponsor; Sponsor decides continue / pause / different team.
- **Operational definition.** 30-min call; decision logged; A33 final.
- **Required inputs.** A33 draft.
- **Source of inputs.** `kze_sustain_14`.
- **Activity steps.** (a) Present. (b) Discuss. (c) Log decision.
- **Responsible owner.** Facilitator. **Supporting.** Sponsor.
- **Effort.** 30 min. **Duration.** 0.25d. **BAM type.** Communication.
- **Predecessors.** `kze_sustain_14`. **Successors.** —.
- **Tools.** Meeting.
- **Deliverables.** A33 final.
- **Outputs.** Sponsor decision.
- **Acceptance.** Decision logged.
- **Risk if skipped.** Program momentum lost.
- **Standardization.** M. **AI-support.** —. **Automation.** L.

### Inter-phase glue tasks

---

**`kze_gl_01` — Daily standup during Kaizen Week (Days 15–19 only)**
- **Purpose.** Daily 15-min standup during the Kaizen Week.
- **Operational definition.** Attendance ≥90%; each person gives yesterday / today / blockers.
- **Required inputs.** Prior day's artifacts.
- **Source of inputs.** upstream day.
- **Activity steps.** (a) Roll call. (b) Round-robin. (c) Blockers.
- **Responsible owner.** Facilitator. **Supporting.** team.
- **Effort.** 15 min. **Duration.** daily. **BAM type.** Communication.
- **Predecessors.** `kze_event_01`. **Successors.** day's work.
- **Tools.** Room.
- **Deliverables.** Standup notes.
- **Outputs.** Alignment.
- **Acceptance.** Notes captured.
- **Risk if skipped.** Day drifts.
- **Standardization.** H. **AI-support.** —. **Automation.** L.

---

**`kze_gl_02` — End-of-activity 60-second reflection (per activity)**
- **Purpose.** Capture plan vs actual + friction signal at every activity close.
- **Operational definition.** `Reflection` row per closed `ScheduledActivity`.
- **Required inputs.** Activity close event.
- **Source of inputs.** CadencePlan.
- **Activity steps.** (a) Plan vs actual. (b) Friction signal.
- **Responsible owner.** Activity owner. **Supporting.** —.
- **Effort.** 1 min. **Duration.** at close. **BAM type.** CI.
- **Predecessors.** any. **Successors.** —.
- **Tools.** CadencePlan.
- **Deliverables.** Reflection row.
- **Outputs.** Signal into pipeline.
- **Acceptance.** ≥75% reflection rate.
- **Risk if skipped.** Lost signal.
- **Standardization.** H. **AI-support.** Reflection Agent. **Automation.** H.

---

**`kze_gl_03` — Weekly facilitator gate-review**
- **Purpose.** Facilitator self-audit Fri each week of 90-day project.
- **Operational definition.** 30-min block each Friday; gate readiness per phase.
- **Required inputs.** Current-phase artifacts.
- **Source of inputs.** ongoing.
- **Activity steps.** (a) Check gate artifacts. (b) Spot drift. (c) Adjust next-week plan.
- **Responsible owner.** Facilitator. **Supporting.** —.
- **Effort.** 30 min. **Duration.** weekly. **BAM type.** CI.
- **Predecessors.** —. **Successors.** —.
- **Tools.** Part 7 checklist.
- **Deliverables.** Weekly gate-review note.
- **Outputs.** Adjustment plan.
- **Acceptance.** Note exists each week.
- **Risk if skipped.** Late-phase surprise.
- **Standardization.** H. **AI-support.** Planning Agent. **Automation.** M.

---

**`kze_gl_04` — Scope-change abandon-and-restart handler**
- **Purpose.** Explicit path when scope rotates mid-flight.
- **Operational definition.** If scope rotates, mark Kaizen `abandoned=true`; file scope-change memo; start new Kaizen with correct project type.
- **Required inputs.** Scope-change signal.
- **Source of inputs.** any phase discovery.
- **Activity steps.** (a) Log evidence. (b) Sponsor decision. (c) Abandon current. (d) Start new (Accelerator, Kaizen 90, or DMAIC as indicated).
- **Responsible owner.** Facilitator. **Supporting.** Sponsor.
- **Effort.** 120 min. **Duration.** 0.5d. **BAM type.** Communication.
- **Predecessors.** any scope-rotation signal. **Successors.** new Kaizen Pre-Event.
- **Tools.** CadencePlan; memo.
- **Deliverables.** Scope-Change Memo.
- **Outputs.** Abandoned Kaizen.
- **Acceptance.** New Kaizen opened with correct projectType.
- **Risk if skipped.** Silent scope drift.
- **Standardization.** H. **AI-support.** —. **Automation.** L.

---

**`kze_gl_05` — Day-120 and Day-180 post-close sustainment checks**
- **Purpose.** Facilitator revisits Control plan post-close to catch regression.
- **Operational definition.** At Day 120 and Day 180, snapshot metric vs threshold; regression flag if triggered.
- **Required inputs.** A20-final; A31 dashboard.
- **Source of inputs.** `kze_sustain_06`, `kze_sustain_05`.
- **Activity steps.** (a) Pull current metric. (b) Compare to threshold. (c) Notify PO. (d) Log.
- **Responsible owner.** Facilitator. **Supporting.** PO.
- **Effort.** 45 min per check. **Duration.** Day 120, Day 180. **BAM type.** CI.
- **Predecessors.** `kze_sustain_06`. **Successors.** —.
- **Tools.** Dashboard.
- **Deliverables.** Sustainment note.
- **Outputs.** Flag or pass.
- **Acceptance.** Note filed.
- **Risk if skipped.** Wins revert invisibly.
- **Standardization.** H. **AI-support.** Momentum Agent. **Automation.** M.

---

**`kze_gl_06` — Ad-hoc SME ask triage**
- **Purpose.** When a task needs an SME outside the roster (e.g., Legal, InfoSec), triage and engage.
- **Operational definition.** SME ask logged; engaged within 48 h.
- **Required inputs.** Ask signal.
- **Source of inputs.** any task.
- **Activity steps.** (a) Log ask. (b) Identify SME. (c) Engage. (d) Confirm ≤48 h.
- **Responsible owner.** Facilitator. **Supporting.** Sponsor (if access issue).
- **Effort.** 30 min per ask. **Duration.** on-signal. **BAM type.** Communication.
- **Predecessors.** any. **Successors.** task unblocked.
- **Tools.** —.
- **Deliverables.** SME engagement log.
- **Outputs.** Unblocked task.
- **Acceptance.** Response ≤48 h.
- **Risk if skipped.** Task stalls.
- **Standardization.** M. **AI-support.** —. **Automation.** L.

---

**`kze_gl_07` — Monthly Finance checkpoint**
- **Purpose.** Monthly 30-min with Finance partner: cost-log review, benefit projection refresh.
- **Operational definition.** 3 monthly checkpoints (Days 30, 60, 90-area); cost log reconciled; benefit projection updated.
- **Required inputs.** Cost log; benefit delta.
- **Source of inputs.** `kze_postevent_05`.
- **Activity steps.** (a) Review cost. (b) Refresh projection. (c) Flag variance.
- **Responsible owner.** Facilitator. **Supporting.** Finance.
- **Effort.** 30 min. **Duration.** monthly. **BAM type.** Communication.
- **Predecessors.** —. **Successors.** —.
- **Tools.** Spreadsheet.
- **Deliverables.** Finance checkpoint note.
- **Outputs.** Refreshed projection.
- **Acceptance.** 3 checkpoints held.
- **Risk if skipped.** ROI surprise at Day 85.
- **Standardization.** H. **AI-support.** —. **Automation.** L.

---

**`kze_gl_08` — Rollback event handler**
- **Purpose.** If a shipped change causes unintended harm, execute rollback per Control Plan's rollback playbook.
- **Operational definition.** Rollback executed within 4 h of trigger; incident logged; Sustainment Gate clock resets.
- **Required inputs.** Rollback trigger.
- **Source of inputs.** A28 audit or real-time signal.
- **Activity steps.** (a) Trigger evaluation. (b) Sponsor notification. (c) Execute rollback playbook. (d) Log incident. (e) Reset Sustainment Gate clock.
- **Responsible owner.** Process Owner. **Supporting.** Facilitator, SMEs, Sponsor (notification).
- **Effort.** Variable. **Duration.** on-signal. **BAM type.** Deep.
- **Predecessors.** Rollback trigger. **Successors.** `kze_postevent_21` (reset).
- **Tools.** Rollback playbook.
- **Deliverables.** Incident log.
- **Outputs.** Restored state.
- **Acceptance.** Rollback complete; incident logged.
- **Risk if skipped.** Production harm.
- **Standardization.** M. **AI-support.** —. **Automation.** L.

---

**`kze_gl_09` — Stakeholder sentiment pulse (optional)**
- **Purpose.** Optional 3-question pulse at Weeks 4, 7, 10 to impacted audience.
- **Operational definition.** 3-Q pulse; ≥30% response; sentiment score.
- **Required inputs.** Audience list from A27.
- **Source of inputs.** `kze_postevent_09`.
- **Activity steps.** (a) Send 3-Q pulse. (b) Collect. (c) Score. (d) Feed to `kze_postevent_15` if negative.
- **Responsible owner.** Change-Management partner. **Supporting.** —.
- **Effort.** 30 min. **Duration.** Weeks 4, 7, 10. **BAM type.** CI.
- **Predecessors.** `kze_postevent_09`. **Successors.** `kze_postevent_15` (on signal).
- **Tools.** Survey.
- **Deliverables.** Sentiment log.
- **Outputs.** Sentiment signal.
- **Acceptance.** 3 pulses completed.
- **Risk if skipped.** Adoption failure by surprise.
- **Standardization.** H. **AI-support.** Reflection Agent (sentiment extraction). **Automation.** M.

---

**`kze_gl_10` — Portfolio telemetry publication**
- **Purpose.** Publish Kaizen 90 telemetry to portfolio dashboard weekly.
- **Operational definition.** Per-week: phase, velocity, backlog %, adoption %, G/Y/R.
- **Required inputs.** CadencePlan state.
- **Source of inputs.** ongoing.
- **Activity steps.** (a) Pull state. (b) Compute. (c) Publish.
- **Responsible owner.** Facilitator. **Supporting.** —.
- **Effort.** 15 min weekly. **Duration.** weekly. **BAM type.** CI.
- **Predecessors.** —. **Successors.** —.
- **Tools.** Portfolio dashboard.
- **Deliverables.** Telemetry row.
- **Outputs.** Portfolio visibility.
- **Acceptance.** Published weekly.
- **Risk if skipped.** PMO blind.
- **Standardization.** H. **AI-support.** Composer Explainer. **Automation.** H.

---

**Task count summary.** 18 Pre-Event + 17 Event + 22 Post-Event + 15 Sustainment + 10 Inter-phase glue = **82 operationally distinct tasks**, against a target of 70–100. Each task cites its parent catalog entry where applicable (`#42`–`#50` span Pre-Event / Event / Post-Event / Sustainment). Catalog `#48` Implemented Improvements is distributed across `kze_postevent_05` (per-item execution) + `kze_postevent_13` (rollout) + `kze_postevent_14` (adoption). Catalog `#42`, `#43`, `#44` close in Pre-Event. Catalog `#45`, `#46`, `#47` close in Event. Catalog `#49` + `#50` close in Sustainment.

---

## Part 4 — Artifact Specification Library

Every artifact the 90-Day Kaizen produces is specified here. Artifact IDs A01–A34 are the canonical names used in Part 3. The user's 21-item list is fully covered; 13 additional artifacts identified during validation are explicitly flagged **[Added during validation]**.

### A01 — Intake Diagnostic

- **Purpose.** Capture Sponsor pains, cross-functional KPI gaps, candidate rationale pre-charter.
- **Why it matters.** Without it, candidate selection is opinion; post-hoc justification is impossible; cross-functional scope evidence is missing.
- **Owner.** Facilitator.
- **Phase created.** Sub-phase 01 (PRE_EVENT).
- **Source inputs.** Voice-of-Leader interviews; prior-quarter cross-functional scorecard; engagement scope.
- **Required sections/fields.** Engagement context (1 paragraph); Sponsor verbatim pains (3 with cross-functional scope tagged); KPI gaps (5–15 rows with quantified gap + functions touched); cross-functional escalation examples (≥1); initial candidate long-list; selected shortlist rationale; non-selection rationale for alternatives.
- **Acceptance criteria.** Pains + gaps populated; every candidate has ≥2 functions named; Sponsor acknowledged notes.
- **Downstream uses.** A02 scoring input; Sub-phase 19 next-process recommendation.
- **Typical failure modes.** Thin (missing measurable gaps); stale scorecard; fabricated pains.
- **Standard template guidance.** 2–4 pages; embed interview-note links; cross-functional scope explicit per pain.

### A02 — Process Scoring Matrix

- **Purpose.** Rank 3–5 cross-functional candidate processes on Impact × Feasibility × Cross-Functional-Complexity.
- **Why it matters.** Makes selection falsifiable; provides next-Kaizen intake scorecard.
- **Owner.** Facilitator.
- **Phase created.** Sub-phase 02.
- **Source inputs.** A01 pains + gaps.
- **Required sections/fields.** Per candidate: name; one-line pain; one-line gap; functions touched (list); Impact score (1–5); Feasibility score (1–5); Cross-Functional-Complexity score (1–5, lower = easier); rationale per axis; total score; shortlist flag; selection decision.
- **Acceptance criteria.** ≥3 candidates; scores on all three axes; rationale per score; selected candidate explicit.
- **Downstream uses.** A03 Charter; A33 next-process recommendation; Sponsor confirmation call.
- **Typical failure modes.** Scores without rationale; cross-functional complexity scored low (1–2) when it should be 4–5 (project gets wrongly scoped as Accelerator).
- **Standard template guidance.** 1-page table; include an axis-definition glossary footer.

### A03 — Charter (Kaizen Charter, catalog `#42` artifact)

- **Purpose.** Signed authorization for the 90-Day Kaizen; names scope, team, timeline, problem, goal, Sponsor authority.
- **Why it matters.** Without signature, project cannot be legitimately invoked; `Kaizen` row cannot be promoted; all downstream sign-offs depend on Charter authority.
- **Owner.** Facilitator drafts; Sponsor signs.
- **Phase created.** Sub-phase 03.
- **Source inputs.** A01, A02, Sponsor authority confirmation, Process Owner verbal commitment.
- **Required sections/fields.** (a) Problem statement (1 paragraph with scope + pain); (b) Business case (current waste/cost/risk; expected benefit); (c) Event scope — in/out/functions (every org unit named); (d) Goal statement (baseline X → target Y by Day 90); (e) Event team roster (names, functions); (f) 90-day timeline visual; (g) Top 3 risks + initial mitigations; (h) Sponsor (+ co-Sponsor if applicable) signature block; (i) Date.
- **Acceptance criteria.** All 9 sections populated; every touched org unit listed; Sponsor signature captured; `Kaizen` row promoted with `projectType='KAIZEN_EVENT_90D'`.
- **Downstream uses.** Kaizen Week Day 1 opening; every phase gate references Charter scope.
- **Typical failure modes.** Sponsor hasn't read it; timeline is aspirational; org unit missing.
- **Standard template guidance.** 4–6 pages; include a 1-page Sponsor-facing "I am committing to" cover.

### A04 — KPI Tree

- **Purpose.** Link strategic objective → primary Y → sub-metrics (including cross-functional handoff metrics) in a 2–3 level tree.
- **Why it matters.** Makes the baseline metric strategically justified; prevents "random metric" selection.
- **Owner.** Facilitator.
- **Phase created.** Sub-phase 04.
- **Source inputs.** A03 goal; prior-quarter KPI gaps; strategic objective.
- **Required sections/fields.** Level 1: strategic objective (1 sentence); Level 2: primary Y (exactly 1); Level 3: secondary metrics (3–6, including ≥1 per handoff); per-metric: name, definition sketch, cross-functional tag if applicable.
- **Acceptance criteria.** Exactly 1 primary Y; handoffs represented; tree is acyclic and hierarchical.
- **Downstream uses.** A05 KPI Baseline Targets; Kaizen Week Day 1 alignment; rebaseline comparison.
- **Typical failure modes.** Multiple "primary" metrics (decision dodging); no handoff metrics on cross-functional scope.
- **Standard template guidance.** 1-page tree diagram + 1 page of metric sketches.

### A05 — KPI Baseline Targets

- **Purpose.** Lock operational definitions, sample plans, and targets for every metric in A04.
- **Why it matters.** Baseline and rebaseline depend on identical definitions; Finance ROI depends on cost basis acknowledgement.
- **Owner.** Facilitator; Finance partner acknowledges cost basis.
- **Phase created.** Sub-phase 04.
- **Source inputs.** A04 tree; Finance cost basis; measurement tool inventory.
- **Required sections/fields.** Per metric: name; primary/secondary flag; operational definition (paragraph); unit; measurement method; sample size n; sample frequency; stratification rule (handoff, function); exclusion rule; measurement owner; baseline target (numeric); post-improvement target; cost basis (if cost metric); Finance partner acknowledgement.
- **Acceptance criteria.** All 13 fields populated per metric; Finance ack on all cost metrics; operational definition unambiguous.
- **Downstream uses.** `#43` Output DCP; A08 baseline dataset; A29 ROI; A30 rebaseline.
- **Typical failure modes.** Ambiguous definition; sample size missing; cost basis blank.
- **Standard template guidance.** 1 page per metric as a table.

### A06 — Stakeholder Map

- **Purpose.** 2×2 Influence × Interest grid of every impacted stakeholder with engagement approach.
- **Why it matters.** Cross-functional scope means 15–40 stakeholders; unmanaged stakeholders block implementation.
- **Owner.** Facilitator.
- **Phase created.** Sub-phase 05.
- **Source inputs.** Org chart; A03 scope; Sponsor introductions.
- **Required sections/fields.** Per stakeholder: name, function, role, Influence (H/M/L), Interest (H/M/L), quadrant, engagement approach, owner of engagement.
- **Acceptance criteria.** ≥10 stakeholders; every function represented; quadrant 1 (H-I × H-I) has ≤10 entries (otherwise over-broad scope).
- **Downstream uses.** A27 Change Management Plan; `kze_postevent_11` stakeholder comms; Kaizen Week invites.
- **Typical failure modes.** Peer function VPs missed; auditors/compliance skipped.
- **Standard template guidance.** 2×2 grid + 1 page of stakeholder detail rows.

### A07 — Project Team Roster

- **Purpose.** Every required role named with function, confirmed per-phase time commitment.
- **Why it matters.** Unassigned roles stop Sustainment sign-offs; cross-functional scope requires SME per function.
- **Owner.** Facilitator.
- **Phase created.** Sub-phase 05.
- **Source inputs.** A06; Sponsor introductions; function leader commitments.
- **Required sections/fields.** Per role: name, email, function, role (Sponsor / co-Sponsor / PO / Facilitator / Implementation Lead / Change-Management partner / Finance partner / SMEs per function / core team / Analyst); accountability one-liner; decision rights; per-phase hours (Pre-Event / Event / Post-Event / Sustainment); confirmation status.
- **Acceptance criteria.** Every required role has a named person; Finance + ChM partner + Implementation Lead explicitly named; Kaizen Week 100% attendance confirmed.
- **Downstream uses.** A22 Commitments memo; A23 Sprint Plan ownership; all sign-offs.
- **Typical failure modes.** "TBD"; no ChM partner; Implementation Lead conflated with Facilitator.
- **Standard template guidance.** 1–2 pages as a table.

### A08 — Baseline Dataset (with stats) **[Added during validation — this is the user's "baseline dataset" item but with stats merged]**

- **Purpose.** Raw + cleaned time-stamped baseline data with summary statistics and handoff-boundary observations.
- **Why it matters.** Evidence for locked BaselineMetric; enables rebaseline comparison with method parity.
- **Owner.** Analyst.
- **Phase created.** Sub-phase 06.
- **Source inputs.** System logs or direct observation per `#43` DCP.
- **Required sections/fields.** Raw dataset file; cleaned dataset file (with exclusions applied); per-row timestamp + handoff tag; exclusion log with rationale per row; data-quality flag log; summary stats (n, mean, median, SD, min, max); Cpk if spec limits; handoff-specific stats; version tag; collection window; Facilitator attestation.
- **Acceptance criteria.** n ≥ DCP plan; handoff-specific n ≥ 5 per pair; every excluded row annotated; stats computed.
- **Downstream uses.** BaselineMetric lock; A09 map validation; A30 rebaseline comparison.
- **Typical failure modes.** Raw discarded; no exclusion log; handoff data missing.
- **Standard template guidance.** Dataset stored in repo; 1-page stats summary attached.

### A09 — Current-State Map (cross-functional swimlane)

- **Purpose.** Swimlane map with every function's lane, every activity, every handoff.
- **Why it matters.** Shared artifact for Kaizen Week Day 1; baseline for future-state diff.
- **Owner.** Facilitator; SMEs validate.
- **Phase created.** Sub-phase 07.
- **Source inputs.** A08 observation data; SME interviews.
- **Required sections/fields.** Swimlane per function; activity per step (name, role, duration, system); handoff arrows between lanes; activity-count and cumulative-duration summary; pain-point annotations.
- **Acceptance criteria.** Every function has a lane; every handoff rendered; activity count ≥ 10; SME attestation per lane.
- **Downstream uses.** Kaizen Week Day 1 alignment; A15 future-state diff.
- **Typical failure modes.** One function's lane is under-detailed; handoffs not rendered.
- **Standard template guidance.** 1 large diagram; PDF/image export.

### A10 — Baseline SOPs (v1.0 "as-is")

- **Purpose.** Per-activity step-by-step procedure, as currently executed, with role and system of record.
- **Why it matters.** Baseline for SOP diff at close; supports training design.
- **Owner.** Facilitator; SMEs author per function.
- **Phase created.** Sub-phase 07.
- **Source inputs.** A09; SME knowledge.
- **Required sections/fields.** Per activity: name, role, trigger, inputs, steps (a/b/c…), system of record, outputs, exceptions, current pain points. Version: v1.0.
- **Acceptance criteria.** Every activity in A09 has a SOP; SME sign-off per SOP; version 1.0 tagged; stored in SOP repo.
- **Downstream uses.** A18 future-state SOP diff; adoption audit baseline.
- **Typical failure modes.** Copy-paste from old SOP repo without validation; missing handoff steps.
- **Standard template guidance.** 1 page per activity; use role-system-step-exception columns.

### A11 — Waste Log

- **Purpose.** TIMWOODS-categorized waste + handoff-defect log ranked by frequency × severity.
- **Why it matters.** Seed for Kaizen Week Day 2 root-cause.
- **Owner.** Facilitator.
- **Phase created.** Sub-phase 07.
- **Source inputs.** A08 data; A09 map; SME input.
- **Required sections/fields.** Per waste item: description, TIMWOODS category, affected activity, frequency observation, severity (1–5), rank. Handoff defects: description, function pair, frequency, severity, rank.
- **Acceptance criteria.** ≥10 waste items; ≥3 handoff defect classes; ranked.
- **Downstream uses.** Kaizen Week Day 2 5-Whys input.
- **Typical failure modes.** Over-categorized in one TIMWOODS bucket; handoff defects missed.
- **Standard template guidance.** 1 page table.

### A12 — Kaizen Agenda (5-day)

- **Purpose.** 5-day agenda for Kaizen Week with session times, activities, catalog-entry mapping.
- **Why it matters.** Participants know what to expect; facilitator has a plan.
- **Owner.** Facilitator.
- **Phase created.** Sub-phase 08.
- **Source inputs.** A07 roster; catalog `#45`–`#47` procedure durations.
- **Required sections/fields.** Per day: time-blocked agenda (morning/midday/afternoon); session → activity → catalog entry mapping; required attendees per session; outputs per session; breaks; homework. Day 1 opens with Charter + baseline readout; Day 5 closes with Sponsor readout + commitments.
- **Acceptance criteria.** 5 consecutive working days; 100% attendance confirmed; pre-reads acknowledged.
- **Downstream uses.** Kaizen Week execution; post-event retro.
- **Typical failure modes.** Overstuffed Day 3; Day 5 has no Sponsor slot; homework unclear.
- **Standard template guidance.** 2-page matrix (days × sessions).

### A13 — Shared Understanding Log **[Added during validation — emerges from Day 1 SIPOC + current-state walk]**

- **Purpose.** Capture every current-state correction, definition clarification, and scope nuance surfaced in Kaizen Week Day 1.
- **Why it matters.** Prevents Day 3 future-state design on misunderstood current state.
- **Owner.** Scribe (rotating); Facilitator curates.
- **Phase created.** Sub-phase 09.
- **Source inputs.** Day 1 session.
- **Required sections/fields.** Per entry: time, source speaker, observation, category (scope / definition / handoff / pain).
- **Acceptance criteria.** ≥10 entries; entries actioned (map updated, SOP corrected, or carried to Day 2).
- **Downstream uses.** A09 v1.1; A14 root-cause seed.
- **Typical failure modes.** Flat list not actioned.
- **Standard template guidance.** 1 page log.

### A14 — Root Cause List

- **Purpose.** Ranked root-cause list from 5-Whys + Fishbone with validated links to the primary Y.
- **Why it matters.** Future-state design attacks these; Kaizen 90 viability rides on root cause being KNOWN.
- **Owner.** Facilitator.
- **Phase created.** Sub-phase 10.
- **Source inputs.** A11 Waste Log; `#45` SIPOC; full-team session.
- **Required sections/fields.** 5-Whys chain per top-5 waste items; Fishbone 6M categorization; consolidated ranked root-cause list; "root cause known?" decision box.
- **Acceptance criteria.** 5 chains; Fishbone with ≥18 causes; top-5 ranked roots; explicit "known/unknown" decision.
- **Downstream uses.** `#46` prioritized-inputs input; DMAIC-escalation decision.
- **Typical failure modes.** 5-Whys stops at 3 (under-deep); Fishbone has empty categories.
- **Standard template guidance.** 2 pages + wall photos.

### A15 — Future-State Map

- **Purpose.** Swimlane of the redesigned cross-functional process attacking the top 3–5 X's from `#46`.
- **Why it matters.** Defines what "better" looks like; seeds backlog and SOPs.
- **Owner.** Facilitator.
- **Phase created.** Sub-phase 11.
- **Source inputs.** A09 current-state; `#46` prioritized inputs; A14 root causes.
- **Required sections/fields.** Redesigned swimlane per function; every top-X attacked by ≥1 design change; handoff count vs current state; activity count vs current state; value-added vs non-value-added tagging.
- **Acceptance criteria.** Every function redesigned; every top-X attacked; handoff count < current state OR justified.
- **Downstream uses.** A17 backlog source; A18 future-state SOPs.
- **Typical failure modes.** Cosmetic redesign; no VA/NVA tagging.
- **Standard template guidance.** 1 large diagram.

### A16 — FMEA (catalog `#47` artifact)

- **Purpose.** Ranked Failure Modes and Effects Analysis of the future-state design with SOD scoring, RPN, and mitigations on top-quartile items.
- **Why it matters.** Catches design flaws pre-implementation; prioritizes mitigations; required by catalog `#47`.
- **Owner.** Facilitator.
- **Phase created.** Sub-phase 11.
- **Source inputs.** A15 future-state.
- **Required sections/fields.** Per failure mode: step, mode, effect, Severity (1–10), Occurrence (1–10), Detection (1–10), RPN, recommended action, owner, target date.
- **Acceptance criteria.** ≥15 failure modes; SOD scored; RPN computed; top-quartile have mitigations with owners.
- **Downstream uses.** A17 backlog items (mitigations become items); A20 Control Plan thresholds.
- **Typical failure modes.** SOD not scored; mitigations without owners.
- **Standard template guidance.** 1 page table.

### A17 — Implementation Backlog

- **Purpose.** Prioritized and sized backlog of every action needed to realize the future-state; owner + due + acceptance per item.
- **Why it matters.** This is the link between Event and Post-Event; without it, implementation orphans.
- **Owner.** Implementation Lead; Process Owner signs.
- **Phase created.** Sub-phase 12.
- **Source inputs.** A15 future-state; A16 FMEA mitigations; A27 training items.
- **Required sections/fields.** Per item: id, name, description, category (structural / training / comm / system-config / SOP-update); owner; due date; acceptance criterion; size (S/M/L); sprint assignment; priority score; status; before/after evidence link; doneAt.
- **Acceptance criteria.** ≥20 items; every item owned + sized + sequenced; strategic items flagged separately.
- **Downstream uses.** A23 Sprint Plan; weekly status; rebaseline trigger.
- **Typical failure modes.** Flat list without sizing; strategic items buried with trivialities.
- **Standard template guidance.** Spreadsheet or project tool.

### A18 — Future-State SOPs (v2.0-draft → v2.0-final)

- **Purpose.** Redesigned SOPs covering every activity in the future-state map; diffable vs A10.
- **Why it matters.** Training and adoption target; rollout artifact.
- **Owner.** Facilitator drafts; SMEs finalize.
- **Phase created.** Sub-phase 12 draft; Sub-phase 17 final.
- **Source inputs.** A15; A10 baseline SOPs.
- **Required sections/fields.** Per activity: name, role, trigger, inputs, steps (a/b/c…), system of record, outputs, exceptions, known pitfalls, rollback-safe flag. Version: v2.0-draft → v2.0-final.
- **Acceptance criteria.** Every future-state activity has SOP; diff vs A10 visible; SME sign-off per SOP.
- **Downstream uses.** A26 training materials; adoption audits; Control Plan.
- **Typical failure modes.** Draft never promoted to final; SOP text copy-paste from baseline.
- **Standard template guidance.** 1 page per activity; diff rendered in red/green.

### A19 — Decision Log

- **Purpose.** Log of every decision made during Kaizen Week and Post-Event (scope refinements, deferrals, reprioritizations, escalations).
- **Why it matters.** Rationale forgotten without log; audit trail.
- **Owner.** Facilitator.
- **Phase created.** Sub-phase 12 (first entries); continuous thereafter.
- **Source inputs.** All phases.
- **Required sections/fields.** Per entry: date, decision, rationale, decider, category (scope / prioritization / deferral / escalation), linked artifact.
- **Acceptance criteria.** Every non-trivial decision captured; reviewable.
- **Downstream uses.** Audit; close readout.
- **Typical failure modes.** Decisions made in hallway, never logged.
- **Standard template guidance.** Running log (spreadsheet or doc).

### A20 — Control Plan (draft → final)

- **Purpose.** Named monitoring metric, threshold, out-of-control response, rollback trigger, owner, 30/60/90 check-in cadence.
- **Why it matters.** Difference between sustained gain and reversion.
- **Owner.** Facilitator drafts; Process Owner + Sponsor sign.
- **Phase created.** Sub-phase 13 draft; Sub-phase 18 final.
- **Source inputs.** A05 KPI targets; A15 future-state; A30 rebaseline trend.
- **Required sections/fields.** Monitoring metric; threshold (acceptable range); out-of-control response (who acts, SLA); rollback trigger; rollback playbook; Process Owner name; 30/60/90 check-in dates; Sponsor + PO signatures.
- **Acceptance criteria.** All fields populated; signatures; calendar holds created on PO calendar.
- **Downstream uses.** Sustainment; Day 120/180 checks.
- **Typical failure modes.** Paper plan with no live dashboard; no rollback.
- **Standard template guidance.** 2–3 pages.

### A21 — Rollout Checklist

- **Purpose.** Checklist of every step to roll out the new process: SOP publication, system configuration, comms, training, pilot, full rollout, go-live.
- **Why it matters.** Rollout is where Kaizen events fail; a checklist forces nothing to be missed.
- **Owner.** Change-Management partner.
- **Phase created.** Sub-phase 13.
- **Source inputs.** A17 backlog (rollout-flavored items); A27 ChM Plan.
- **Required sections/fields.** Per step: id, name, owner, prerequisite, target date, pilot-or-full flag, rollback-ready Y/N, acceptance criterion, status, completion date.
- **Acceptance criteria.** ≥15 steps; pilot checkpoint and full-rollout checkpoint both defined.
- **Downstream uses.** `kze_postevent_13` rollout execution.
- **Typical failure modes.** No pilot wave; no rollback-ready flag; system-config step missing.
- **Standard template guidance.** 1 page table.

### A22 — Kaizen Week Commitments Memo **[Added during validation]**

- **Purpose.** Capture Sponsor + PO + team commitments at Day 5 close; prevent ambiguity about who does what post-event.
- **Why it matters.** Verbal "I'll do it" dissolves Monday; written commitments survive.
- **Owner.** Facilitator.
- **Phase created.** Sub-phase 13.
- **Source inputs.** Day 5 readout discussion.
- **Required sections/fields.** Sponsor top-3 commitments (with dates); PO top-3 commitments; team collective commitments; Implementation Lead commitments; ChM partner commitments; signatures.
- **Acceptance criteria.** All roles have ≥1 commitment; signatures.
- **Downstream uses.** Post-Event status rhythm; escalation triggers.
- **Typical failure modes.** Vague ("we'll do our best"); no dates.
- **Standard template guidance.** 1 page.

### A23 — Sprint Plan (7 weekly sprints) **[Added during validation]**

- **Purpose.** Sequenced 7-sprint plan (Weeks 4–10) with per-sprint item set and per-owner capacity.
- **Why it matters.** Weekly execution rhythm depends on a concrete plan; velocity tracking needs a plan to measure against.
- **Owner.** Implementation Lead.
- **Phase created.** Sub-phase 14.
- **Source inputs.** A17 Implementation Backlog; A07 roster capacity.
- **Required sections/fields.** Per sprint (1–7): start/end date; items (refs to A17); owners; capacity check (per owner hours vs available); dependencies; carry-in/carry-out.
- **Acceptance criteria.** Every A17 item placed; capacity fits; dependencies respected.
- **Downstream uses.** Weekly Monday planning.
- **Typical failure modes.** Overcommit Sprint 1; no dependency respect.
- **Standard template guidance.** Spreadsheet; 1-page visual.

### A24 — Weekly Status Report **[Added during validation]**

- **Purpose.** Weekly rollup to Sponsor: % complete, velocity, at-risk items, asks.
- **Why it matters.** Sponsor visibility; pattern detection.
- **Owner.** Facilitator.
- **Phase created.** Sub-phase 15 (rolling, weeks 4–10).
- **Source inputs.** Sprint progress; Monday/Wed/Fri notes.
- **Required sections/fields.** Week #; phase; % complete (strategic vs total); velocity vs plan; at-risk items with mitigation; blockers needing Sponsor; upcoming week; G/Y/R rating.
- **Acceptance criteria.** Delivered weekly.
- **Downstream uses.** Sponsor visibility; Day 45 checkpoint.
- **Typical failure modes.** Status is green when reality is yellow.
- **Standard template guidance.** 1 page per week.

### A25 — Issue/Risk Log **[Added during validation]**

- **Purpose.** Running log of issues + risks during Post-Event Implementation.
- **Why it matters.** Visibility and triage; pattern detection.
- **Owner.** Facilitator.
- **Phase created.** Sub-phase 15.
- **Source inputs.** All Post-Event signals.
- **Required sections/fields.** Id, date, description, category (issue/risk), severity S1/S2/S3, owner, SLA, resolution date, sponsor-escalated flag.
- **Acceptance criteria.** Running log; S1s resolved ≤24h; S2s ≤72h.
- **Downstream uses.** Sponsor escalation; lessons learned.
- **Typical failure modes.** Informal channels bypass log.
- **Standard template guidance.** Spreadsheet.

### A26 — Training Materials

- **Purpose.** Training deck + quick-reference cards + demo video + hands-on exercises + assessment covering every v2.0 SOP.
- **Why it matters.** Adoption depends on training quality.
- **Owner.** Change-Management partner.
- **Phase created.** Sub-phase 16.
- **Source inputs.** A18 SOPs; A27 training design.
- **Required sections/fields.** Training deck (slides); quick-reference card (1 page per function); demo video or live walkthrough; hands-on exercise; assessment with ≥5 questions.
- **Acceptance criteria.** Every v2.0 SOP covered; per-audience session ≤90 min; pilot-tested.
- **Downstream uses.** `kze_postevent_12` training delivery.
- **Typical failure modes.** Slides without hands-on; assessment rubber-stamped.
- **Standard template guidance.** Stored in LMS; recorded session for async consumption.

### A27 — Change Management Plan **[Added during validation — user's list had no explicit ChM plan]**

- **Purpose.** Communication cadence + training design + adoption plan + sentiment tracking for impacted audiences.
- **Why it matters.** Cross-functional scope means multiple audiences; ad-hoc comms fail.
- **Owner.** Change-Management partner.
- **Phase created.** Sub-phase 16.
- **Source inputs.** A06 Stakeholder Map; A15 future-state; A17 backlog.
- **Required sections/fields.** Impacted audience list; per audience: key message, comm cadence, channel, format, owner, acceptance; training design (format, duration, delivery window); adoption-tracking method (audits, telemetry, sentiment).
- **Acceptance criteria.** All impacted audiences covered; cadence ≥ monthly during implementation.
- **Downstream uses.** `kze_postevent_11` comms; `kze_postevent_12` training; `kze_postevent_14` adoption audits.
- **Typical failure modes.** Single all-hands email counted as "comm plan."
- **Standard template guidance.** 2 pages.

### A28 — Adoption Log **[Added during validation — merges user's "rebaseline dataset" adoption signal]**

- **Purpose.** Log of Week 6/8/10 adoption audits per function with rate, trigger flags, remediation notes.
- **Why it matters.** Rebaseline is valid only on adopted SOP.
- **Owner.** Process Owner.
- **Phase created.** Sub-phase 17.
- **Source inputs.** Production observation; A18 SOP v2.0.
- **Required sections/fields.** Per audit: date, function, sample size, adherence %, gap notes, remediation plan (if <80%), follow-up audit date.
- **Acceptance criteria.** 3 audits complete (Weeks 6, 8, 10); flagged gaps have remediation.
- **Downstream uses.** Sustainment Gate; rebaseline readiness.
- **Typical failure modes.** Self-report without observation.
- **Standard template guidance.** 1 page log.

### A29 — Financial Impact (ROI Calculation)

- **Purpose.** Implementation cost + annualized benefit + Hard/Soft/Cost-Avoidance classification + Finance sign-off.
- **Why it matters.** ROI claim credibility; close gate.
- **Owner.** Facilitator; Finance co-signs.
- **Phase created.** Sub-phase 18.
- **Source inputs.** Cost log from Post-Event; benefit delta from rebaseline; Finance unit-cost data.
- **Required sections/fields.** Implementation cost breakdown (people + tools + systems); annualized benefit per line (Hard/Soft/Cost-Avoidance with evidence); overall confidence; Finance signature; computed ROI = (benefit − cost) / cost.
- **Acceptance criteria.** Both dollar values non-null; Finance signature; every Hard benefit has P&L or FTE-release evidence.
- **Downstream uses.** Kaizen close; A32 Executive Report.
- **Typical failure modes.** Soft benefits claimed as Hard; no Finance signature.
- **Standard template guidance.** 2 pages.

### A30 — Rebaseline Dataset (with stats)

- **Purpose.** Post-implementation dataset captured via identical method as A08 baseline.
- **Why it matters.** Delta computation requires method parity.
- **Owner.** Analyst.
- **Phase created.** Sub-phase 18.
- **Source inputs.** `#43` DCP; production.
- **Required sections/fields.** Raw dataset; cleaned dataset; exclusion log; data-quality flags; stats; handoff-specific stats; version tag; method-parity attestation; collection window.
- **Acceptance criteria.** n ≥ baseline n × 0.9; method match attested; stats computed.
- **Downstream uses.** Remeasurement row; delta; ROI.
- **Typical failure modes.** Method drift; sample frame narrower.
- **Standard template guidance.** Same template as A08.

### A31 — Monitoring Dashboard

- **Purpose.** Live dashboard of the monitoring metric with threshold lines, ownership, auto-refresh.
- **Why it matters.** Control Plan lives or dies on an actual dashboard.
- **Owner.** Analyst builds; Process Owner owns.
- **Phase created.** Sub-phase 18.
- **Source inputs.** A20 Control Plan; A30 trend.
- **Required sections/fields.** Chart (time series); threshold annotations; Process Owner name; auto-refresh cadence; link; last-updated timestamp.
- **Acceptance criteria.** Live URL; PO can open; auto-refresh verified.
- **Downstream uses.** Sustainment; Day 120/180 checks; 30/60/90 PO check-ins.
- **Typical failure modes.** Dashboard goes stale; PO can't access.
- **Standard template guidance.** BI tool (Looker/Tableau/Sheets).

### A32 — Executive Report

- **Purpose.** 3–6 page executive readout binding baseline → redesign → implementation → rebaseline → ROI → Control.
- **Why it matters.** Executive visibility; portfolio reference; audit artifact.
- **Owner.** Facilitator.
- **Phase created.** Sub-phase 19.
- **Source inputs.** All phases.
- **Required sections/fields.** Exec summary (1 paragraph: problem → result → ROI); Background + business case; Approach (phases); Results (before/after with deltas); Cross-functional insights; Financial benefit with confidence; Control plan; Lessons; Recommendation.
- **Acceptance criteria.** Sponsor sign-off; ≥1 function leader per function acknowledges.
- **Downstream uses.** Portfolio; replication recommendation.
- **Typical failure modes.** Padded with slides; no delta numbers; no control plan reference.
- **Standard template guidance.** 3–6 page narrative.

### A33 — Next-Process Recommendation **[Added during validation]**

- **Purpose.** Ranked next-process recommendation for the Sponsor leveraging lessons from this Kaizen 90.
- **Why it matters.** Reduces next project's intake effort; leverages earned team learning.
- **Owner.** Facilitator.
- **Phase created.** Sub-phase 19.
- **Source inputs.** A02 scorecard (non-selected); A34 lessons; fresh Sponsor intake.
- **Required sections/fields.** Re-scored A02 candidates; top candidate; rationale; team-readiness note.
- **Acceptance criteria.** Top candidate + rationale stated; Sponsor decision logged.
- **Downstream uses.** Next Kaizen intake.
- **Typical failure modes.** Scorecard not re-scored.
- **Standard template guidance.** 1–2 pages.

### A34 — Lessons Learned **[Added during validation]**

- **Purpose.** Memo of what worked, what didn't, anti-patterns encountered, replication guidance.
- **Why it matters.** Cross-team learning; next Kaizen 90 doesn't repeat mistakes.
- **Owner.** Facilitator.
- **Phase created.** Sub-phase 19.
- **Source inputs.** Final retro; all phase retros; Facilitator observations.
- **Required sections/fields.** What worked (≥5); what didn't (≥3); anti-patterns (≥2); replicable patterns (≥3); PMO recommendations.
- **Acceptance criteria.** ≥5 lessons; ≥2 anti-patterns.
- **Downstream uses.** Next Kaizen intake; PMO library.
- **Typical failure modes.** Generic platitudes.
- **Standard template guidance.** 2 pages.

**Artifact summary.** 21 user-required artifacts covered + 13 validation-added artifacts = **34 total artifacts** (the user's 21-item list numbering is absorbed into the renumbered A01–A34 sequence; every original item is represented — cross-reference table below).

| User list # | User artifact name | Standard artifact ID |
|---|---|---|
| 1 | Intake diagnostic | A01 |
| 2 | Process scoring matrix | A02 |
| 3 | Charter | A03 |
| 4 | KPI tree | A04 |
| 5 | Stakeholder map | A06 |
| 6 | Baseline dataset | A08 |
| 7 | Current-state map | A09 |
| 8 | Current-state SOP | A10 |
| 9 | Kaizen agenda (5-day) | A12 |
| 10 | Waste log | A11 |
| 11 | Future-state map | A15 |
| 12 | Future-state SOP | A18 |
| 13 | Decision log | A19 |
| 14 | Implementation backlog | A17 |
| 15 | Training materials | A26 |
| 16 | Rollout checklist | A21 |
| 17 | Control plan | A20 |
| 18 | Monitoring dashboard | A31 |
| 19 | Rebaseline dataset | A30 |
| 20 | ROI calculation | A29 |
| 21 | Executive report | A32 |

---

## Part 5 — Problem Statement Framework

The problem statement is the seed of everything downstream. A good one predetermines a successful rebaseline; a bad one dooms the project at Day 85. Cross-functional scope amplifies the stakes — imprecise problem statements allow scope creep across function boundaries, and the Accelerator's 30-day discipline cannot rescue a bad statement once 60 days are sunk.

### 5.1 Required structure

A Kaizen 90 problem statement has **six mandatory components**, each tied to a Charter (A03) section and a baseline metric (A05):

1. **Current condition** — what is observably true today, quantified where possible.
2. **Gap / impact** — the measurable delta between current and desired, on ≥1 of the four axes: time / cost / quality / throughput (or a hybrid).
3. **Scope boundaries (operational + organizational)** — where the process starts, where it ends, which functions are in scope, which are explicitly out.
4. **Baseline reference (placeholder or locked)** — the measurement that defines "where we are" — referenced to A05 operational definition.
5. **Target condition** — what "good" looks like on Day 90, quantified.
6. **Timeframe (implicit: Day 90; explicit if partial milestones)** — anchors closure.

### 5.2 Measurable components (cross-functional emphasis)

Cross-functional Kaizen 90 projects must quantify handoff-specific metrics — without them, improvements in Function A are canceled by regressions in Function B. Required measurable components:

| Component | Why it matters cross-functionally |
|---|---|
| **Primary Y (on-time / cycle time / defect rate / cost per transaction)** | The number everyone aligns on. Must be computable end-to-end across functions. |
| **Handoff wait time (per function pair)** | Where cross-functional processes leak time. Must be observable. |
| **Handoff defect rate (per function pair)** | Rework injected at boundaries. Frequently the largest lever. |
| **First-pass yield (FPY) end-to-end** | Percentage of instances that complete without rework at any step. |
| **Rework rate per function** | Where rework lives. Useful for function-specific accountability. |

At minimum a Kaizen 90 problem statement must quantify the **Primary Y + ≥1 handoff metric + FPY**. If the team cannot quantify these, the project is not ready for charter — push back to Pre-Event Sub-phase 01.

### 5.3 Operational boundaries (cross-functional scope creep mitigation)

Cross-functional scope creep is the #1 cause of Kaizen 90 failure after event theater. Operational boundaries must be explicit:

- **Start event** — exact trigger (e.g., "customer submits order in System X, field Y stamped"), including the system of record and field.
- **End event** — exact terminal output (e.g., "invoice cleared in AR module, status=PAID"), including system and field.
- **Systems in scope** — named list of systems the redesign can touch.
- **Systems out of scope** — named list; common "out" items: customer-facing UI, third-party vendor systems, upstream marketing systems.
- **Functions in scope** — explicit list (e.g., Sales, Finance, Fulfillment).
- **Functions out of scope** — explicit list (e.g., Marketing, Legal, Customer Success).
- **Out-of-scope items (≥5)** — explicitly excluded process concerns (e.g., "pricing policy," "credit policy," "commission calculation").
- **Assumptions (≥3)** — what the project depends on remaining stable (e.g., "no system re-platform during project," "organizational structure stable").

### 5.4 Three good examples (realistic cross-functional processes)

**Example A — Order-to-Cash cycle time:**

> "Cross-functional order-to-cash process from customer PO receipt (System SFDC, Opportunity stage=Closed-Won) to invoice clearance (System NetSuite, AR status=CLOSED). Current-state median cycle time: 11 business days; P90: 17 days; handoff wait between Sales (order entry) and Fulfillment (shipment authorization) averages 2.4 days with a P90 of 6 days; first-pass yield is 62% (38% of orders incur at least one rework loop). Target condition by Day 90: median cycle time ≤ 6 business days; P90 ≤ 9 days; Sales→Fulfillment handoff wait median ≤ 0.5 days; FPY ≥ 85%. Functions in scope: Sales, Finance, Fulfillment, Customer Master Data. Out of scope: Marketing lead-to-opportunity, Tax determination, Contract Legal review, Collections after invoice issuance. Systems in scope: Salesforce, NetSuite, EDI gateway. Assumptions: no ERP re-platform; pricing policy stable; no new product launches > $1M."

**Example B — Hire-to-Retire (on-boarding leg):**

> "Cross-functional new-hire on-boarding process from signed offer letter (System Workday, candidate status=Offer Accepted) to first-week productivity (System ServiceNow, 'all access tickets closed' + manager attests 'new hire started meaningful work'). Current-state median on-boarding cycle time from start date to 'all access closed' is 8.3 business days; P90 is 15 days; first-week NPS from new hires is 42 (survey at Day 10). HR→IT access-provisioning handoff averages 3.1 days wait with P90 of 7 days. Target by Day 90: median access-closure ≤ 2 business days; P90 ≤ 4 days; new-hire Day-10 NPS ≥ 60. Functions in scope: HR (recruiting), HR Operations, IT (identity + endpoint), Facilities, Hiring Manager. Out of scope: payroll enrollment (handled by Finance), benefits enrollment (owned by HR), security clearance (FSO workflow). Systems in scope: Workday, ServiceNow, Okta, MDM. Assumptions: no HR system re-platform; hiring plan within ±15% forecast; no M&A-driven hiring surge."

**Example C — Patient Intake (healthcare):**

> "Cross-functional patient intake process from new-patient appointment request (EHR, status=Requested) to first clinical encounter complete (EHR, Encounter.status=Closed, Provider note signed). Current-state: median intake-to-encounter cycle is 6.5 business days; P90 is 14 days; 22% of new-patient appointments are cancelled or rescheduled before first encounter. Scheduling→Insurance-verification handoff: 38% of verifications arrive post-appointment time, forcing rebook. Target by Day 90: median ≤ 3 business days; P90 ≤ 7; cancel/rescheduled rate ≤ 10%; Insurance verification complete ≥ 24 h before appointment in ≥ 95% of cases. Functions in scope: Scheduling, Insurance Verification, Clinical Triage, Front Desk. Out of scope: billing and claims, referral intake, Medicare attestation. Systems in scope: Epic EHR, Availity eligibility checker, telephony switch. Assumptions: no Epic version upgrade; payer contract list stable; no pandemic-driven volume surge."

### 5.5 Three bad examples (and what's wrong)

**Bad example 1 — Solution-prescribing:**

> "We need to implement a shared Slack channel between Sales and Fulfillment to reduce order-to-cash cycle time."

**Why it's bad.** Prescribes a solution (shared Slack channel) rather than stating the problem. Kaizen Week Day 3 is when solutions are designed. Writing the solution into the Charter forecloses the team's redesign work and makes the Charter's "success" depend on implementing the stated solution rather than improving the metric.

**Bad example 2 — Vague and unmeasurable:**

> "Order-to-cash is too slow and causes customer complaints. We want to make it faster and more reliable."

**Why it's bad.** No baseline metric. No target. No scope. No handoff boundaries. No operational definition of "slow" or "reliable." Finance cannot sign off on ROI because there's nothing to measure against. The rebaseline at Day 85 has no anchor.

**Bad example 3 — Unbounded scope:**

> "The entire quote-to-cash lifecycle from lead generation through collections is broken and we need to fix it in 90 days. Functions: Marketing, Sales, Finance, Fulfillment, Customer Success, Legal, Tax, Procurement."

**Why it's bad.** 8 functions in scope in 90 days is DMAIC territory at best, and likely requires a portfolio of 3–4 Kaizen 90 projects. Scope is unbounded on both start (lead generation) and end (collections). No "out of scope." Cross-functional complexity score would be 5/5 (too complex for 90-day envelope). Problem statement sets the project up to fail at Day 85.

### 5.6 Common errors (top 10)

1. **Solution in the problem statement.** (Example 1 above.)
2. **No quantified gap.** Just "too slow."
3. **Baseline implicit.** "Customers complain" ≠ measurable baseline.
4. **No target.** Goal is vague ("make it better").
5. **No handoff metrics on cross-functional scope.** Primary Y named but handoffs invisible.
6. **Scope creeping into upstream / downstream.** "End event" is fuzzy (e.g., "customer happy").
7. **Functions list incomplete.** Forgetting a function that ends up blocking at Week 7.
8. **No out-of-scope items.** Everything is in; boundary cannot be enforced.
9. **Assumptions missing.** Concurrent system change invalidates baseline.
10. **Unsigned.** Draft Charter circulated; Sponsor never actually signed; audit-trail broken.

### 5.7 Linkage to charter metrics and rebaseline logic

The problem statement is not a standalone paragraph — it is the seed of five downstream artifacts:

1. **A05 KPI Baseline Targets.** The Primary Y, handoff metrics, and FPY named in the problem statement drive the operational definitions.
2. **`#43` Output DCP.** The measurement method, sample plan, handoff observation points are derived from the problem statement's scope.
3. **A17 Implementation Backlog.** Every backlog item must trace back to an axis named in the problem statement (or be flagged as scope creep).
4. **A29 ROI.** Benefit is the delta on the Primary Y × frequency × unit-dollar-impact. If problem statement's Primary Y was "cycle time," ROI's "annual benefit" must compute from time-saved × redeployable labor or throughput-enabled revenue.
5. **A32 Executive Report.** Opens with the problem statement; closes with "we solved it to the target of X" or "we didn't."

The rebaseline (A30) must measure the **same** Primary Y and handoff metrics with the **same** operational definition. A problem statement change mid-flight is handled by `kze_gl_04` scope-change handler (abandon + restart), not silent adjustment.

### 5.8 Reusable template

```
Cross-functional [NAME OF PROCESS] process from [START EVENT — system, field, value] to [END EVENT — system, field, value]. 

Current-state: [PRIMARY Y] median [VALUE + UNIT]; P90 [VALUE]; [HANDOFF METRIC, e.g., Function A→B handoff wait] median [VALUE]; first-pass yield [VALUE %]. Pain: [one-sentence pain description with measurable consequence].

Target by Day 90: [PRIMARY Y] median ≤ [VALUE]; P90 ≤ [VALUE]; [HANDOFF METRIC] median ≤ [VALUE]; FPY ≥ [VALUE %].

Functions in scope: [LIST — minimum 2 for cross-functional scope].
Functions out of scope: [LIST — minimum 2].
Systems in scope: [LIST].
Systems out of scope: [LIST].

Out-of-scope items (≥5): [LIST].
Assumptions (≥3): [LIST].

Baseline reference: A05 Primary Y operational definition.
Signed: [Sponsor], [Co-Sponsor if applicable], [Date].
```

This template generates a problem statement that satisfies Part 5 in a single authoring pass; the Facilitator's job is to force each placeholder to resolve with a real value before advancing to Sub-phase 04.

---

## Part 6 — Capacity Model and BAM Scheduling

Kaizen 90 is 90 days of cross-functional commitment. The capacity model makes the commitment concrete — what each role owes per week per phase. Mis-budgeting capacity is the single biggest driver of Kaizen 90 failure after root-cause misdiagnosis; under-committed SMEs drop out at Week 5, under-committed Process Owners miss the Sustainment Gate, under-committed Facilitators burn out by Week 7.

### 6.1 Role definitions and per-phase capacity

| Role | Pre-Event (Days 1–14) | Event (Days 15–19) | Post-Event (Days 20–70) | Sustainment (Days 71–90) | Notes |
|---|---|---|---|---|---|
| **Executive Sponsor** | 2 h/week (total ~5h) | 4 h (Day 1 kickoff + Day 5 readout + drop-ins) | 2 h/month (Day 45 checkpoint + S1 escalations) | 2 h/month + 2 h readout | Cross-functional variant may need co-Sponsor at same cadence |
| **Kaizen Facilitator** | 15 h/week | 100% × 5 days (40 h) | 10 h/week | 8 h/week | Project lead; carries most telemetry, gate reviews, escalations |
| **Process Owner** | 10 h/week | 100% × 5 days (40 h) | 15 h/week | 6 h/week | Accountable owner; 30/60/90 PO check-in obligation continues post-close |
| **Implementation Lead** | 2 h/week (shadow) | 100% × 5 days (40 h) | 20 h/week | 3 h/week | New role vs Accelerator; sprint driver during Post-Event |
| **Change-Management partner** | 1 h/week (named Day 6) | 4 h Day 5 observer | 6 h/week | 2 h/week | Required; not optional |
| **Core team (6 members, avg per-member)** | 4 h/week | 40 h (full Kaizen Week) | 4 h/week (owner of ≥1 backlog item) | 2 h/week | Cross-functional team = 6 members covering ≥2 functions |
| **SMEs (4 members, one per function, avg per-member)** | 5 h/week | 40 h (full Kaizen Week) | 2 h/week ad-hoc | 1 h/week | One per in-scope function |
| **Finance partner** | 1 h/week (named Day 5) | 4 h Day 5 observer | 30 min/month (checkpoint) | 4 h (ROI sign-off) | Essential for credible ROI |
| **Analyst** | 10 h/week (baseline-heavy) | 10 h (Kaizen Week as scribe + data pull) | 2 h/week | 6 h/week (rebaseline-heavy) | Data-capture and stats owner |

### 6.2 Capacity totals per phase

| Phase | Role-weighted person-hours | Elapsed days | Notes |
|---|---|---|---|
| Pre-Event | ~180 h | 14 days | Heavy on baseline + roster assembly |
| Event | ~490 h (across full cross-functional team for 5 days) | 5 days | Kaizen Week: team 100%; Sponsor + Finance + ChM observing |
| Post-Event Implementation | ~620 h | 50 days | Implementation Lead and core team carry the weight; Facilitator tracking |
| Sustainment | ~160 h | 20 days | Rebaseline + Finance + Control + transition |
| **Total** | **~1,450 h** | **90 days** | Matches Part 2 §2.20 aggregate within 5% rounding |

### 6.3 Kaizen Week capacity — 100% team + 4-2-2 override

During Kaizen Week (Days 15–19), the core team and facilitator run at 100% commitment; normal BAM 4-2-2 scheduling is suspended **from the user's calendar experience**, but preserved at the composer level. The resolution: the composer still emits Daily compositions with 4-2-2 buckets, but those 2-hour PROJECT Deep blocks are filled entirely with Kaizen Week session activities, and the 2-hour COMMUNICATION blocks are filled with Kaizen Week breakouts + Day 1 kickoff + Day 5 readouts. CI blocks hold the 60-second end-of-activity reflections + Fri retro.

This preserves the `ARCHITECTURE.md §3.4` decision 15 that Phase 2 does not override 4-2-2, and avoids a projectType-specific composer branch. Kaizen Week simply happens to fill all three buckets with the same project's activities for 5 consecutive days.

**Architectural note.** No new "Kaizen Week override" flag is required in the composer. The composer's `eligibleDeepPayload()` for `Kaizen.phase='EVENT'` will select from a small set of Event-phase catalog entries (`#45`, `#46`, `#47`, plus `kze_event_*` non-catalog tasks). The engine's phase-binding filter (per Part 11 Option B) handles it cleanly.

### 6.4 Example Cadence Week calendar — Pre-Event week (Week 2 of project)

Week of Days 7–11: baseline data capture + current-state mapping.

| | Monday | Tuesday | Wednesday | Thursday | Friday |
|---|---|---|---|---|---|
| **Deep block AM (PROJECT, 2h)** | `kze_preevent_09` KPI Baseline Targets authoring | `kze_preevent_11` `#43` DCP authoring | `kze_preevent_13` Baseline data collection (session 1) | `kze_preevent_13` Baseline data collection (session 3) | `kze_preevent_15` Current-state map draft |
| **Deep block PM (PROJECT, 2h)** | `kze_preevent_10` Stakeholder map + Roster | `kze_preevent_12` Compressed MSA (if attribute metric) | `kze_preevent_13` Baseline data collection (session 2) | `kze_preevent_14` Baseline stats + BaselineMetric lock | `kze_preevent_15` Current-state map validation |
| **Communication block (COMMUNICATION, 2h)** | Function leader alignment calls | Finance partner cost-basis sync | Process Owner access handoff | SME interview round | Standup + mapping review with SMEs |
| **CI block (CI, 2h)** | Weekly Facilitator gate-review (`kze_gl_03`); friction signal review | Activity reflections | Backlog grooming (future-state seed) | Activity reflections | Weekly retro of Pre-Event progress |

### 6.5 Example Cadence Week calendar — The Kaizen Week (Week 3 of project, Days 15–19)

| | Day 1 (Mon, Day 15) | Day 2 (Tue, Day 16) | Day 3 (Wed, Day 17) | Day 4 (Thu, Day 18) | Day 5 (Fri, Day 19) |
|---|---|---|---|---|---|
| **Deep block AM (PROJECT, 2h)** | `kze_event_02` `#45` Event SIPOC | `kze_event_05` 5-Whys | `kze_event_09` Future-state design | `kze_event_11` Backlog authoring | `kze_event_14` Control Plan draft |
| **Deep block PM (PROJECT, 2h)** | `kze_event_03` Current-state deep dive | `kze_event_06`–`_07` Fishbone + `#46` Prioritized Inputs | `kze_event_10` `#47` FMEA | `kze_event_12` Future-State SOP drafting | `kze_event_15` Rollout Checklist seeding |
| **Communication block (COMMUNICATION, 2h)** | `kze_event_01` opening + Sponsor kickoff + `kze_event_04` Day 1 pre-brief | `kze_event_08` DMAIC-escalation decision + Day 2 pre-brief | Day 3 retro; wall-walk; Day 4 pre-brief | `kze_event_13` Decision Log consolidation | `kze_event_16` Sponsor readout + commitments; `kze_event_17` phase advance |
| **CI block (CI, 2h)** | `kze_gl_01` Daily standup + `kze_gl_02` end-of-activity reflections | `kze_gl_01` + reflections | `kze_gl_01` + reflections | `kze_gl_01` + reflections | `kze_gl_01` + full-week retro |

### 6.6 Example Cadence Week calendar — Implementation week (Week 7 of project, mid-implementation grind)

Week of Days 40–44: Sprint 4 of 7.

| | Monday | Tuesday | Wednesday | Thursday | Friday |
|---|---|---|---|---|---|
| **Deep block AM (PROJECT, 2h)** | Owner executing backlog item `kze_postevent_05` | Owner executing next item | Owner executing item | Owner executing item | Owner wrap + demo prep |
| **Deep block PM (PROJECT, 2h)** | Owner executing backlog item | SOP versioning `kze_postevent_07` | Owner executing item | SOP versioning | `kze_postevent_10` Training material refinement |
| **Communication block (COMMUNICATION, 2h)** | `kze_postevent_03` Monday 30-min planning + function leader sync | `kze_postevent_11` Stakeholder comm for the week | `kze_postevent_04` Wed 15-min check + issue triage `kze_postevent_16` | SME ad-hoc consultation | `kze_postevent_06` Fri demo/retro 30 min + `kze_postevent_08` status to Sponsor |
| **CI block (CI, 2h)** | Adoption review prep; friction signals | `kze_gl_10` portfolio telemetry publication | `kze_postevent_14` adoption audit (Week 8 if on schedule); reflections | Reflections + capacity protection audit `kze_postevent_19` | `kze_gl_03` Weekly facilitator gate-review |

### 6.7 Example Cadence Week calendar — Sustainment week (Week 12 of project, Days 75–79)

Rebaseline + ROI + Control + Executive readout.

| | Monday | Tuesday | Wednesday | Thursday | Friday |
|---|---|---|---|---|---|
| **Deep block AM (PROJECT, 2h)** | `kze_sustain_02` Rebaseline collection | `kze_sustain_02` Rebaseline collection | `kze_sustain_03` Summary stats + delta | `kze_sustain_05` Monitoring dashboard build | `kze_sustain_10` Results Narrative `#49` authoring |
| **Deep block PM (PROJECT, 2h)** | `kze_sustain_02` continuation | `kze_sustain_02` continuation | `kze_sustain_04` Remeasurement row + `kze_sustain_07` benefit classification | `kze_sustain_06` Control Plan finalization | `kze_sustain_10` continuation |
| **Communication block (COMMUNICATION, 2h)** | Process Owner access confirmation; analyst kickoff | Function leader data questions | `kze_sustain_08` Cost + benefit calculation session | `kze_sustain_09` Finance sign-off call | Executive Report draft review |
| **CI block (CI, 2h)** | Reflection capture | Reflection + telemetry | Reflection + backlog burndown close | Reflection + sustainment gate re-confirmation | `kze_gl_03` Weekly facilitator gate-review |

### 6.8 Escalation triggers

| Trigger | Who is pulled in | SLA | Reference |
|---|---|---|---|
| S1 backlog item stalls > 24 h | Sponsor | 24 h decision | `kze_postevent_17` |
| Adoption <80% at Week 8 | Change-Management partner + Process Owner | 5 working days remediation | `kze_postevent_15` |
| Finance cost-basis question unresolved | Finance partner + Facilitator | 48 h | `kze_gl_07` monthly checkpoint |
| Process Owner misses 2 consecutive Fri demo/retros | Sponsor | Day 5 next-week intervention | `kze_postevent_17` |
| Cross-functional scope signal (function B pushback on a design change) | Sponsor + function B leader | 3 working days | `kze_gl_04` scope-change evaluation |
| Rollback event | Process Owner + Sponsor (notification) + Facilitator | 4 h rollback | `kze_gl_08` |
| Capacity-protection <60% per owner per week | Owner's line manager + Sponsor (if persistent) | 1 week | `kze_postevent_19` |
| Sustainment Gate fails at Day 70 | Sponsor | 2 weeks delay + decision | `kze_postevent_21` |

### 6.9 The 4-2-2 Day override decision (architectural reaffirmation)

Per `ARCHITECTURE.md §9` coordinator decision 15 (Accelerator Phase 2 preserves 4-2-2), Kaizen 90 makes the same call: the 4-2-2 invariant is preserved throughout. The Kaizen Week is filled entirely with project activities across all three buckets (PROJECT for sessions, COMMUNICATION for breakouts and Sponsor interactions, CI for reflections + retros). No composer branch for Kaizen Week is needed. **This was considered and rejected** — the cost of a Kaizen-Week override in the composer (a dedicated `isKaizenWeek` flag + specialized bucket logic) exceeded the benefit (a cleaner calendar UX during one week of one project-type).

---

## Part 7 — Implementation and Sustainment Model (Differentiator)

This is what makes Kaizen 90 operationally distinct from both the Accelerator and DMAIC. The Accelerator compresses implementation into 10 working days on a single function; DMAIC distributes implementation across Improve sprints using statistical rigor on a narrow vital-X list. Kaizen 90 spends 50 days on cross-functional implementation, change management, and adoption. This part codifies how.

### 7.1 Backlog execution — weekly sprint rhythm during Days 20–70

Post-Event runs in 7 weekly sprints (Weeks 4–10, approximately Days 20–70). Each sprint is a concrete time-box with:

- **Items committed Monday** (A23 Sprint Plan sprint N row).
- **Owners named per item** (from A17).
- **Due dates** — default is end-of-sprint-N; exceptions are flagged.
- **Acceptance criteria** — observable per item.
- **Size** — S (≤ 4 hours execution) / M (4–16 hours) / L (> 16 hours, usually spans 2 sprints).
- **Sequence** — structural before polish; behavioral before tooling; quick wins interleaved to keep morale.

Sprint 1 (Week 4) is intentionally under-committed (70% capacity) to absorb Kaizen Week ramp-down + onboarding Implementation Lead. Sprint 4 (Week 7) is the peak implementation sprint. Sprint 7 (Week 10) is under-committed (70% capacity) to absorb rollout polish + Sustainment Gate preparation.

### 7.2 Prioritization rules (impact × ease with structural override)

Items are prioritized on a weighted score:

```
priorityScore = (impact * 0.5) + (ease * 0.3) + (urgency * 0.2)
where impact, ease, urgency are each 1–5
```

**Structural override.** Items marked "structural" (process boundary change, system-config change, SOP replacement) are sequenced BEFORE polish items regardless of priority score, provided their cumulative effort fits within the first 4 sprints. This prevents teams from accumulating easy wins and skipping structural changes.

**Quick-win interleaving.** Within each sprint, 1–2 "S"-size items are scheduled alongside structural work to maintain demoable progress for Fri retro.

**Behavioral before tooling.** If a backlog item has both a behavioral change (new SOP adoption) and a tooling change (new Slack workflow), the behavioral must ship first with manual process; tooling follows as optimization.

### 7.3 Tracking mechanisms

Weekly status (A24) is published every Friday EOB. It reports:

- **% strategic complete** (primary metric; <80% at Day 65 → Day 65 checkpoint escalation).
- **% total complete.**
- **Velocity vs plan** (items shipped this sprint / items committed).
- **At-risk items** (items not at acceptance criteria by Wed check).
- **Blockers needing Sponsor** (S1 escalations).
- **Upcoming week** (next sprint's committed items).
- **G/Y/R rating** (Facilitator's subjective confidence).

Telemetry is surfaced to Sponsor without reformatting (`kze_postevent_08`). A Y-to-R transition at any point triggers a Sponsor check-in.

### 7.4 Issue escalation (SLA by severity)

**S1 — production blocker.** Backlog item cannot proceed; blocking ≥2 other items OR affecting active production; stuck > 24 h.
- **Path:** Implementation Lead → Facilitator → Sponsor.
- **SLA:** Sponsor decision within 24 h of escalation.

**S2 — project risk.** Item at risk of missing sprint end; owner underwater; cross-functional dependency at risk.
- **Path:** Owner → Implementation Lead → Facilitator.
- **SLA:** Decision within 72 h.

**S3 — coordination item.** Scheduling conflict; tool access; minor scope clarification.
- **Path:** Owner → Implementation Lead.
- **SLA:** Decision within 5 working days.

Every escalation is logged in A25 Issue/Risk Log with category, severity, owner, SLA, resolution date. Pattern detection via A25 drives process improvement for future Kaizen 90 projects.

### 7.5 Change management cadence

Communication cadence per A27 runs parallel to implementation:

- **Week 4 (kickoff):** All-hands announcement from Sponsor — new process is coming; ChM partner walks the vision.
- **Weeks 5–6:** Affected-audience pre-briefs by Change-Management partner; training schedule published.
- **Weeks 5–7:** Training delivery (live + async).
- **Week 6:** Pilot rollout (one wave).
- **Week 8:** Pilot retro; adjustments; full-rollout prep.
- **Week 9:** Full rollout.
- **Week 10:** Post-rollout sentiment pulse; adoption audit.

Sentiment is optionally tracked via `kze_gl_09` 3-question pulse at Weeks 4, 7, 10. Negative sentiment triggers ChM intervention before adoption audit flags.

### 7.6 SOP adoption model — sunset date, audit gates

The new v2.0 SOP must **replace** the v1.0 SOP, not live alongside it. Sunset date for v1.0 is the end of Rollout Checkpoint 2 (typically end of Week 9). After sunset:

- v1.0 SOPs are archived in the SOP repo with a `deprecatedAt` timestamp.
- Search in SOP repo returns v2.0 only by default.
- Links from legacy tickets to v1.0 redirect to v2.0 with a banner.
- Audit checks (`kze_postevent_14`) observe production behavior against v2.0; <80% adherence by function triggers remediation.
- Any request to "revert to v1.0 for this case" triggers a rollback-event evaluation (`kze_gl_08`), not silent v1.0 reuse.

### 7.7 Ownership enforcement (RACI that doesn't blur)

| Activity | Responsible | Accountable | Consulted | Informed |
|---|---|---|---|---|
| Backlog execution per item | Named item owner | Implementation Lead | SMEs, Facilitator | PO, Sponsor (via status) |
| SOP v2.0 authoring | SME per function | Facilitator (during Event), PO (Post-Event) | Cross-function SMEs | ChM partner |
| Training design | ChM partner | Process Owner | SMEs, Facilitator | Sponsor |
| Training delivery | ChM partner + SMEs | Process Owner | — | Sponsor |
| Adoption audits | Process Owner | Process Owner | ChM partner | Facilitator, Sponsor |
| Rollback decision | Process Owner | Process Owner | Facilitator, SMEs | Sponsor (notification) |
| ROI sign-off | Facilitator | Finance partner | PO | Sponsor |
| Control Plan sign-off | Facilitator | Process Owner + Sponsor (co-accountable) | Finance, ChM | all |

**Critical rule.** "Accountable" is always exactly one person (or two in the Control Plan sign-off case, by design). No shared accountability. A blurred accountable column is the single biggest predictor of Kaizen 90 failure.

### 7.8 Weekly operating rhythm

```
MONDAY    10:00 - 10:30  Monday Planning (Implementation Lead owns)
          — Review Sprint N items; confirm capacity; flag at-risk; commit.

WEDNESDAY 10:00 - 10:15  Mid-week Check (Implementation Lead owns)
          — 15 min: % complete per owner; blockers; mitigation.

FRIDAY    15:00 - 15:30  Demo + Retro (Implementation Lead owns)
          — Owners demo shipped items (2 min each); 10-min retro; 3 actions for next week.

FRIDAY    16:00 - 16:30  Status Report drafting (Facilitator owns)
          — Compile A24; send to Sponsor by 17:00.

OCCASIONAL                Escalations (on-signal; Sponsor within 24h)
          — S1 issues only; see §7.4.
```

This rhythm is deliberately lighter than the Accelerator's daily 15-min standup because Kaizen 90 runs 50 days of implementation and daily cadence produces diminishing returns by Week 3. Weekly gives enough signal without burning team attention.

### 7.9 Sustainment Gate at Day 70

Before rebaseline starts, the Sustainment Gate evaluates:

1. **Adoption ≥80% for 2 consecutive working weeks** (audits at Week 8 and Week 10 both pass).
2. **No rollback events in the last 2 working weeks.**
3. **All structural backlog items done** (or Sponsor-signed deferral memo per unfinished strategic item).
4. **SOP v2.0 final published** (no lingering v2.0-draft).
5. **Monitoring dashboard (A31) live** with Process Owner as owner.

If any criterion fails, rebaseline is delayed by 2 weeks; the Facilitator writes a 1-page delay memo to Sponsor with remediation plan. Rebaselining on an un-adopted SOP produces false-negative ROI and poisons the portfolio. Strict enforcement at this gate is non-negotiable.

### 7.10 Post-close sustainment obligation

After close (`Kaizen.state='CLOSED'`), the Facilitator retains a **120-day and 180-day sustainment-check obligation** (`kze_gl_05`). At each checkpoint:

- Pull current monitoring metric from A31.
- Compare vs A20-final threshold.
- Notify PO if threshold breached.
- Log observation.

The Process Owner owns 30/60/90-day check-ins independently per `#50`. Facilitator's 120 + 180 checks are safety-net; if consistent drift is observed, the Facilitator may open a new Kaizen 90 or escalate to DMAIC for deeper analysis.

---

## Part 8 — Validation and ROI Model

ROI credibility is the currency Kaizen 90 buys with Finance. A well-executed ROI calculation with Finance sign-off enables replication across the portfolio; a poorly-executed one collapses program credibility. Kaizen 90 adopts (and extends) the Accelerator's Hard/Soft/Cost-Avoidance classification with cross-functional-specific rules.

### 8.1 Baseline vs rebaseline comparison (method parity)

The rebaseline (A30) must match the baseline (A08) on:

- **`metricDefinitionId`** — same `BaselineMetric.metricDefinition` identity. Guard: `KaizenService.close()` enforces this invariant (inherits `ARCHITECTURE.md §3.3` hard rule).
- **Measurement method** — same Option A (system extract) or Option B (direct observation); same query if extract; same observation template if direct.
- **Sample size** — rebaseline n ≥ baseline n × 0.9. Larger n preferred; smaller n triggers an attestation that sample-size variation does not explain the delta.
- **Sampling window** — comparable time window (same day-of-week distribution; no holiday bias; no one-off event distortion).
- **Exclusion rule** — identical exclusion criteria (same data-quality rules, same out-of-scope filters).
- **Stratification** — same handoff / function stratification.

Method-parity attestation is required on A30; Facilitator signs; any deviation is documented with impact analysis.

### 8.2 Metric definitions (operational definitions for every KPI in A04)

Per A05, every metric has:

- **Name.**
- **Operational definition** — a paragraph unambiguous enough that two independent measurers get the same number.
- **Unit** (e.g., business days, dollars, percentage, defect count).
- **Measurement method** — extract / observation / instrument.
- **Sample size** per baseline / rebaseline.
- **Sample frequency** (continuous, weekly, monthly).
- **Stratification** (by function, handoff, time-of-day).
- **Exclusion rule.**
- **Measurement owner.**

Cost metrics additionally have:
- **Cost basis** (fully-loaded labor, marginal labor, inventory holding cost, etc.) — Finance acknowledgement required.

### 8.3 Compressed MSA (for subjective / manual metrics)

For metrics measured subjectively or manually (e.g., "handoff quality," "document completeness"), a **1-hour compressed MSA** is required before baseline lock:

- **3 appraisers × 5 representative samples × 2 measurements each** = 30 data points.
- **Attribute metrics:** compute Kappa; accept if ≥ 0.7; marginal 0.4–0.7 (fix measurement); reject < 0.4.
- **Continuous metrics:** compute Gage R&R; accept if < 10% excellent, 10–30% marginal (acceptable if cost-justified), > 30% reject and fix.

If MSA fails, measurement system is fixed (operational-definition rewrite, training, tool change) and MSA is re-run before baseline collection proceeds (`kze_preevent_12`).

### 8.4 ROI calculation

Core formula (inherits `ARCHITECTURE.md §2.9` computed property):

```
roi = (annualBenefitsDollars - implementationCostDollars) / implementationCostDollars
```

**Implementation cost components:**
- People hours × fully-loaded rate (per role, per phase, summed).
- Tooling cost (one-time + first-year subscription pro-rated).
- System configuration cost (IT change effort + vendor fees).
- Training delivery cost (materials + trainer time).
- Any one-time data-migration cost.

**Annualized benefit components (classified):**

| Classification | Evidence required | Example |
|---|---|---|
| **Hard** | Booked to P&L within 12 months OR named FTE released with redeployment plan | Paper invoice eliminated; warranty cost reduced; headcount reduced |
| **Soft** | Time-saved × loaded rate with no redeployment plan; capacity freed that was NOT reallocated | "2h/week × 10 people × $100 × 50 weeks = $100K" without backfill |
| **Cost Avoidance** | Future loss prevented | Compliance penalty avoided; scrap reduced; SLA breach prevented |

**Confidence rating per line** — Facilitator signs; Finance challenges; reclassify as needed.

### 8.5 Confidence thresholds

- **Hard** — confidence ≥ 80% (Finance co-signs without caveat).
- **Soft** — confidence ≤ 50% (Finance flags; not booked to P&L).
- **Cost Avoidance** — confidence ≤ 70% (Finance flags; counts for credit only in specific contexts).

Overall benefit reporting leads with Hard, footnotes Soft + Cost Avoidance separately. **Never sum Hard + Soft + Cost Avoidance as a single headline number** — this is the error that destroys program credibility.

### 8.6 Validation rules

- **Finance co-sign on A29** before `implementationCostDollars` + `annualBenefitsDollars` are written to `Kaizen`. Enforced in `kze_sustain_09`.
- **Process Owner sign-off on A20-final** before Kaizen can close. Enforced in `kze_sustain_06`.
- **Sponsor sign-off on A32** before Kaizen can close. Enforced in `kze_sustain_11`.
- **`remeasurement.metricDefinitionId === baseline.metricDefinitionId`** (hard architectural rule).

### 8.7 Closure requirements

```
Kaizen.close() allowed only when:
  (1) state === 'IN_REMEASUREMENT'
  (2) remeasurementId !== null
  (3) remeasurement.metricDefinitionId === baseline.metricDefinitionId
  (4) implementationCostDollars !== null
  (5) annualBenefitsDollars !== null
  (6) controlPlanArtifactRef !== null
  (7) #49 Results Narrative CLOSED
  (8) #50 Process Owner Transition CLOSED
  (9) Sustainment Gate passed (audit confirms adoption ≥80% × 2 weeks, no rollback events)

closeKind:
  SUCCESS       — remeasurement beats baseline by ≥ target
  PARTIAL       — improved but < target
  FAILED_HONEST — no improvement, negative, or mixed (honest close preserved per blueprint §7.2)
```

Honest close with `closeKind='FAILED_HONEST'` is allowed and encouraged; the portfolio benefits from truthful failure data.

### 8.8 Two-pass ROI option (adapted from DMAIC §1.5)

For Kaizen 90 projects with expected benefits > $500K, the DMAIC refinement "two-pass ROI" is optional but recommended: run A29 first as a **projected benefit** post-Event (Week 3–4, before full rollout) and again as **actual benefit** post-rebaseline. Report the reconciliation delta. This forces transparency about estimation error and is a signal of team credibility to Finance.

Small Kaizen 90 projects (< $500K projected) can do single-pass ROI at Sustainment Sub-phase 18 only.

---

## Part 9 — Risks and Anti-Patterns

Sixteen named failure patterns with Description / Cause / Impact / Early-warning signs / Mitigation / Owner. Cross-functional 90-day projects have more failure surface area than 30-day or simple-event projects; this catalog is the facilitator's working reference.

### Risk 1 — Event theater (no execution follow-through)

- **Description.** Kaizen Week produces a 30+ item backlog; 60 days later, 6 items are done, 18 are "in progress," 6 are silently forgotten.
- **Cause.** No weekly operating rhythm; no named Implementation Lead separate from Facilitator; Sponsor disengages after Day 5; no capacity-protection enforcement.
- **Impact.** Project closes PARTIAL or FAILED_HONEST; portfolio credibility erodes; team morale drops.
- **Early-warning signs.** Sprint 2 velocity <70% of Sprint 1; Friday demo cancelled twice; adoption audits missed.
- **Mitigation.** Named Implementation Lead (Part 6); weekly sprint rhythm (Part 7 §7.8); Day 45 Sponsor checkpoint (`kze_postevent_18`); Day 65 completion check (`kze_postevent_20`); Sustainment Gate at Day 70 (§7.9).
- **Owner.** Facilitator (detection); Implementation Lead (execution); Sponsor (escalation).

### Risk 2 — Weak baseline (no credible before-state)

- **Description.** Baseline is "about 3 days" from SME memory; sample n=5; no operational definition.
- **Cause.** Pre-Event compressed to 3 days; Analyst not named; `#43` DCP skipped; Sponsor pressure to "just start the event."
- **Impact.** Rebaseline has no anchor; ROI fabricated or unsignable; close impossible.
- **Early-warning signs.** No `#43` DCP at Day 5; Analyst named late; Finance partner not engaged.
- **Mitigation.** Charter sign-off (`kze_preevent_07`) requires `#43` DCP schedule; Analyst named in A07 roster; baseline validation (`kze_preevent_18`) is a hard gate.
- **Owner.** Facilitator (ownership); Analyst (execution); Sponsor (timeline enforcement).

### Risk 3 — Leadership disengagement after Kaizen Week

- **Description.** Sponsor attends Day 1 + Day 5; invisible for 70 days; reappears at Day 85 and questions ROI math.
- **Cause.** No mid-project checkpoint; status reports unread; no enforced Day 45 checkpoint.
- **Impact.** S1 escalations stall; structural items deferred; Control Plan unsigned; close delayed.
- **Early-warning signs.** Status reports not acknowledged for 2 consecutive weeks; Sponsor reschedules Day 45 twice.
- **Mitigation.** A22 Commitments memo signed by Sponsor at Day 5; Day 45 checkpoint is hard-scheduled (`kze_postevent_18`); status reports escalate via CC to co-Sponsor if primary unresponsive.
- **Owner.** Facilitator (signal detection); Sponsor (accountability).

### Risk 4 — Backlog not executed (biggest 90-day failure mode)

- **Description.** Items assigned but not shipped; owners overcommitted; capacity eaten by BAU; Week 7 velocity is 30% of plan.
- **Cause.** Capacity reserved in name only; owner managers don't protect Deep blocks; no weekly capacity-protection audit.
- **Impact.** Day 65 completion check fails; Sustainment Gate fails; project extends or closes PARTIAL.
- **Early-warning signs.** Capacity-protection audit (`kze_postevent_19`) shows <60% for multiple owners in consecutive weeks.
- **Mitigation.** Part 6 capacity model; A22 Commitments memo; `kze_postevent_19` weekly audit; owner manager escalation when <60% for 2 weeks.
- **Owner.** Implementation Lead; Facilitator.

### Risk 5 — Poor training / training-without-adoption

- **Description.** Training delivered Week 5 with 90% attendance; Week 8 adoption audit shows 40% adherence.
- **Cause.** Training designed without pilot; assessment rubber-stamped; no adoption audit until rebaseline.
- **Impact.** Rebaseline on unadopted SOP → false-negative or null delta.
- **Early-warning signs.** Training assessment pass rate >95% with no follow-up observation.
- **Mitigation.** A26 pilot-tested with 2 adopters; `kze_postevent_14` audits at Weeks 6/8/10; `kze_postevent_15` remediation on <80% flag.
- **Owner.** Change-Management partner; Process Owner.

### Risk 6 — No sustainment (reversion by Day 60)

- **Description.** Kaizen Week changes ship; by Day 60, production data shows reversion to legacy behavior; nobody notices until rebaseline.
- **Cause.** Control Plan is paper; no dashboard; no ownership.
- **Impact.** Rebaseline shows no improvement; closeKind=FAILED_HONEST.
- **Early-warning signs.** Adoption audit Week 6 shows drop from Week 5.
- **Mitigation.** A20 Control Plan drafted Day 19 (Kaizen Week close); A31 dashboard live Day 72; PO ownership via `#50`; Sustainment Gate enforced.
- **Owner.** Process Owner (ownership); Facilitator (gate enforcement).

### Risk 7 — Scope creep during implementation

- **Description.** Day 35 a function leader requests "while you're in there, also fix X."
- **Cause.** No scope-change discipline; Sponsor not saying no.
- **Impact.** Backlog grows; original items deferred; 90-day envelope blows.
- **Early-warning signs.** New items added to A17 after Day 20.
- **Mitigation.** A17 frozen at Day 20; additions require Sponsor sign-off AND a deferral of an existing item; `kze_gl_04` scope-change evaluation.
- **Owner.** Facilitator; Sponsor.

### Risk 8 — Process Owner unwilling or under-resourced

- **Description.** PO was named but allocates 3 h/week when the role requires 15 h/week during Post-Event.
- **Cause.** Sponsor named a PO without confirming capacity; PO has conflicting BAU commitments.
- **Impact.** Adoption audits missed; SOP versioning drops; Sustainment Gate fails.
- **Early-warning signs.** PO misses Kaizen Week half-days; declines 30/60/90 check-in holds.
- **Mitigation.** A07 roster requires per-phase hours commitment confirmation from PO's manager; `kze_preevent_18` baseline sign-off requires PO attendance.
- **Owner.** Sponsor (resourcing); Facilitator (signal detection).

### Risk 9 — SME availability drop after event

- **Description.** SMEs are 100% during Kaizen Week; by Week 6 their managers have reclaimed them for BAU; SOP corrections don't land.
- **Cause.** SME commitment was Kaizen Week only; Post-Event role unclear.
- **Impact.** SOP v2.0-draft doesn't reach final; function-specific waste patterns re-emerge.
- **Early-warning signs.** SME response time exceeds 48 h on ad-hoc asks; `kze_gl_06` backlog grows.
- **Mitigation.** A07 roster commits SMEs to 2 h/week Post-Event ad-hoc; Sponsor enforces if managers reclaim.
- **Owner.** Sponsor; Facilitator.

### Risk 10 — Dependency on a departing team member

- **Description.** Implementation Lead announces departure Week 5; no backup named.
- **Cause.** No depth on cross-functional team; key-person risk ignored at Pre-Event.
- **Impact.** Velocity collapse; institutional knowledge lost.
- **Early-warning signs.** Attrition rumors; Implementation Lead over-indexed on single function.
- **Mitigation.** A25 Risk Log includes key-person risk at Pre-Event; backup named at Day 10; knowledge-sharing meetings weekly.
- **Owner.** Facilitator; Sponsor.

### Risk 11 — Tool / system access blocked post-event

- **Description.** Kaizen Week designs require new system permissions; IT ticket takes 5 weeks.
- **Cause.** System-access requirements not surfaced pre-event; IT not consulted until implementation.
- **Impact.** Items dependent on access stall; sprint plan gaps.
- **Early-warning signs.** Access requests filed Day 20 without Day 5 pre-filing.
- **Mitigation.** `#43` DCP prep surfaces system dependencies; IT partner engaged at Day 7; access requests filed before Day 19 for known dependencies.
- **Owner.** Implementation Lead; Facilitator.

### Risk 12 — Organizational change that invalidates the redesign

- **Description.** Day 40 re-org moves Fulfillment under different VP; new VP rejects prior commitments.
- **Cause.** Outside the project team's control; but can be mitigated.
- **Impact.** Scope-change abandon (`kze_gl_04`) likely required.
- **Early-warning signs.** Re-org rumors; Sponsor out of the loop on org changes.
- **Mitigation.** A25 Risk Log includes org-change risk; Sponsor has authority across functions OR co-Sponsor named upfront.
- **Owner.** Sponsor; Facilitator (escalation).

### Risk 13 — False ROI / benefit inflation

- **Description.** Benefits claim uses fully-loaded labor × time-saved × FTE-count × 0.8 with no redeployment plan; Finance rejects.
- **Cause.** Finance partner not engaged until Day 78; facilitator-authored ROI.
- **Impact.** Close blocked; program credibility hit.
- **Early-warning signs.** Finance partner absent from monthly checkpoints; benefit category dominated by Soft.
- **Mitigation.** A29 Hard/Soft/Cost-Avoidance classification per line; Finance co-sign at each benefit-category commitment; `kze_gl_07` monthly Finance checkpoints.
- **Owner.** Facilitator; Finance partner.

### Risk 14 — SOP drift (new SOP ignored in favor of legacy)

- **Description.** v2.0 SOP published; Week 8 production behavior shows v1.0 patterns; SOP search returns v1.0 first.
- **Cause.** v1.0 not archived; training didn't force habit change; no audit.
- **Impact.** Adoption rate <80%; rebaseline on legacy behavior.
- **Early-warning signs.** Adoption audit shows wide divergence per function; v1.0 links still in production tickets.
- **Mitigation.** v1.0 archived at Rollout Checkpoint 2 sunset; search priority to v2.0; audits at Weeks 6/8/10; redirects from v1.0 links.
- **Owner.** Process Owner; Change-Management partner.

### Risk 15 — Sponsor turnover mid-project

- **Description.** Day 55 Sponsor leaves; new Sponsor not bought in to Charter.
- **Cause.** Out of project team's control; organizational.
- **Impact.** Scope-change risk; Sustainment Gate authority ambiguous.
- **Early-warning signs.** Sponsor departure rumors; attendance lapses.
- **Mitigation.** Co-Sponsor named at Charter; Charter delivers business case to new Sponsor without rework; Facilitator re-runs 30-min onboarding.
- **Owner.** Facilitator.

### Risk 16 — Kaizen Week convergence failure

- **Description.** Day 2 team cannot agree on root cause; Day 3 starts without validated cause; future-state design becomes cosmetic.
- **Cause.** Problem is actually DMAIC territory (unknown root cause, high variability); Kaizen 90 was wrong project type.
- **Impact.** Project drifts; no credible Day 85 outcome.
- **Early-warning signs.** Day 2 `kze_event_08` DMAIC-escalation decision trigger.
- **Mitigation.** Explicit `kze_event_08` gate; if root cause not known with ≥80% team confidence, abandon and promote to DMAIC (preserves baseline).
- **Owner.** Facilitator; Sponsor.

---

## Part 10 — AI-Native Implementation Opportunities

Per `AI_AGENTS.md` v0.1, CadencePlan runs five named agents: **Planning**, **Momentum**, **Context**, **Reflection**, **Composer Explainer**. No new agents are invented for Kaizen 90; all AI support binds to the existing five. This part maps each of the 19 Sub-phases to human-required / AI-assisted / AI-automatable work.

### 10.1 General principles (inherited from Accelerator + DMAIC)

- **Decisions, prioritization, political judgment, stakeholder negotiation, sign-offs → human-required.** AI does not sign Charters, does not make scope-creep calls, does not negotiate with function leaders.
- **First-drafts, pattern detection, status compilation, template filling, telemetry → AI-assisted.** AI reduces blank-page friction and surfaces patterns humans would miss.
- **Reminders, dependency tracking, auto-audits, auto-draft status, adherence detection → AI-automatable.** Close-loop work with deterministic rules.

### 10.2 Per-sub-phase mapping

**Sub-phase 01 — Intake and process selection.**
- Human: Sponsor interview interpretation; candidate selection decision.
- AI-assisted: Context Agent extracts Sponsor verbatim pains from notes and matches them to prior-quarter scorecard rows.
- AI-automatable: Planning Agent lints candidate list for cross-functional scope (warns if <2 functions per candidate).

**Sub-phase 02 — Scoring and confirmation.**
- Human: Score values; selection decision.
- AI-assisted: Planning Agent drafts initial scores from A01 evidence; proposes rationale.
- AI-automatable: Score arithmetic; ranked list generation.

**Sub-phase 03 — Charter authoring and sign-off.**
- Human: All substantive content; Sponsor signature.
- AI-assisted: Composer Explainer drafts scope section from A02; drafts timeline visual; drafts risk register seed.
- AI-automatable: Charter template population with A01/A02 data; structure completeness check.

**Sub-phase 04 — KPI tree and baseline metric selection.**
- Human: Primary Y selection; cost-basis decision; operational definitions.
- AI-assisted: Composer Explainer suggests handoff metrics from A09 when available; Planning Agent proposes sample sizes based on cycle time.
- AI-automatable: Tree visualization; metric-to-A05 mapping completeness.

**Sub-phase 05 — Stakeholder map and roster.**
- Human: Who is named in each role; confirmed time commitments.
- AI-assisted: Planning Agent surfaces patterns from prior Kaizens (roster gaps that correlate with failure); Context Agent pulls org-chart context.
- AI-automatable: 2×2 grid rendering; roster completeness check; per-phase hours summation.

**Sub-phase 06 — Baseline DCP and data collection.**
- Human: DCP approval; data quality judgment; MSA appraiser selection.
- AI-assisted: Context Agent does process mining on system logs to propose operational definitions; Reflection Agent surfaces patterns in observation notes.
- AI-automatable: DCP template generation; baseline stats computation; exclusion-log audit.

**Sub-phase 07 — Current-state mapping and SOP authoring.**
- Human: SME validation; judgment on aggregation level.
- AI-assisted: Composer Explainer generates first-draft swimlane from process-mining output; Composer Explainer auto-drafts v1.0 SOPs from swimlane + SME interview notes.
- AI-automatable: Swimlane diff computation; waste-category tagging heuristics.

**Sub-phase 08 — Kaizen Week scheduling and pre-reads.**
- Human: Date selection; room logistics; pre-read curation.
- AI-assisted: Composer Explainer drafts Kaizen Agenda from A12 template with catalog `#45`–`#47` time-blocking.
- AI-automatable: Pre-read packet assembly from artifacts A01–A11; attendance tracking; reminder dispatch.

**Sub-phase 09 — Kaizen Week Day 1.**
- Human: All live facilitation; team working agreement; scope corrections.
- AI-assisted: Reflection Agent live-scribes the SIPOC session for later reference.
- AI-automatable: Attendance capture; timer management.

**Sub-phase 10 — Kaizen Week Day 2.**
- Human: Root-cause convergence; DMAIC-escalation decision.
- AI-assisted: Reflection Agent categorizes 5-Whys chains by function; surfaces recurring patterns.
- AI-automatable: Fishbone category completeness check.

**Sub-phase 11 — Kaizen Week Day 3.**
- Human: Future-state design; FMEA scoring.
- AI-assisted: Composer Explainer proposes FMEA failure modes from A14 + A15 (pattern matching from prior Kaizens); Planning Agent recomputes RPN in real-time as team scores.
- AI-automatable: RPN computation; top-quartile flag.

**Sub-phase 12 — Kaizen Week Day 4.**
- Human: Prioritization calls; ownership assignment.
- AI-assisted: Planning Agent scores backlog via RICE/WSJF from team inputs; Composer Explainer drafts v2.0 SOPs from A15 future-state map.
- AI-automatable: Backlog sizing prompts; dependency detection.

**Sub-phase 13 — Kaizen Week Day 5.**
- Human: Commitments; Control Plan core decisions; Sponsor readout.
- AI-assisted: Composer Explainer drafts A20 Control Plan from A15 + A16 + A05; drafts A21 Rollout Checklist from A17 training/comm items.
- AI-automatable: A22 Commitments memo template; `advancePhase()` pre-flight check.

**Sub-phase 14 — Implementation planning and sprint kickoff.**
- Human: Sequencing judgment; capacity decisions.
- AI-assisted: Planning Agent fits items to capacity per owner; proposes Sprint Plan.
- AI-automatable: Calendar hold creation; owner commitment dispatch.

**Sub-phase 15 — Backlog execution.**
- Human: Per-item execution; go/no-go decisions; rollback calls.
- AI-assisted: Momentum Agent coaches next-item prompts based on owner's Deep block usage; Planning Agent flags at-risk items before Fri demo.
- AI-automatable: Weekly status report first-draft (A24); velocity computation; capacity-protection audit (`kze_postevent_19`); issue/risk log append.

**Sub-phase 16 — Change management, training, rollout.**
- Human: Communication tone; training delivery; rollout go/no-go.
- AI-assisted: Composer Explainer drafts A27 ChM Plan from A06 + A17; drafts initial A26 training slides from A18 SOPs.
- AI-automatable: Comm cadence dispatch; training attendance tracking; assessment pass-rate computation; Rollout Checklist audit.

**Sub-phase 17 — Adoption monitoring and SOP versioning.**
- Human: Remediation decisions; SOP version-bump judgment.
- AI-assisted: Composer Explainer auto-drafts SOP diff on each structural item ship; Reflection Agent surfaces sentiment patterns from `kze_gl_09` pulses.
- AI-automatable: Adoption audit scheduling; SOP version-bump reminders; audit-result dispatch.

**Sub-phase 18 — Rebaseline, ROI, Control finalization.**
- Human: ROI classification; Finance sign-off; Control Plan finalization.
- AI-assisted: Planning Agent lints rebaseline method for drift from baseline; Composer Explainer drafts A29 benefit classification seed.
- AI-automatable: Rebaseline stats computation; delta computation; dashboard auto-refresh check; 30/60/90 calendar hold creation.

**Sub-phase 19 — Executive readout, PO transition, next-process intake.**
- Human: Readout delivery; `#50` transition conversation; next-process decision.
- AI-assisted: Composer Explainer drafts A32 Executive Report from all prior artifacts; Reflection Agent synthesizes lessons from retros into A34.
- AI-automatable: `closeKind` computation; Kaizen CLOSED event emission; A33 scorecard re-scoring.

### 10.3 Telemetry bindings (per `AI_AGENTS.md` §3)

Kaizen 90 emits telemetry via the existing `bamx:v1:agent-telemetry` persistence key:

- Per-phase duration vs planned.
- Per-owner capacity-protection % (Post-Event).
- Adoption audit rates (per function, per week).
- Sprint velocity (items shipped / committed).
- Adoption / velocity / capacity correlated regressions.

Agents consume this telemetry to refine suggestions across subsequent Kaizen 90 projects. No new telemetry schema; binds to existing fields.

### 10.4 Agent routing priorities (Kaizen 90 — specific)

- **Planning Agent** — heaviest during Pre-Event (scoring, scheduling, capacity fitting) and Sustainment (ROI linting).
- **Momentum Agent** — heaviest during Post-Event Implementation (next-item coaching, capacity protection).
- **Context Agent** — heaviest during Pre-Event (process mining, scorecard extraction) and Sustainment (rebaseline method drift).
- **Reflection Agent** — distributed (end-of-activity + sentiment pulses + lessons synthesis).
- **Composer Explainer** — heaviest for artifact first-drafts (A09, A17, A18, A20, A26, A27, A29, A32).

### 10.5 What AI does NOT do (explicit boundaries)

- Does not decide Kaizen 90 vs Accelerator vs DMAIC project type.
- Does not sign Charters, Control Plans, ROI, Process Owner Transition.
- Does not call scope-change abandon (Facilitator judgment with Sponsor).
- Does not determine `closeKind` (the rule is deterministic, but the judgment about PARTIAL vs FAILED_HONEST edge cases stays with Facilitator + Sponsor).
- Does not negotiate cross-functional scope disputes.
- Does not run facilitation during Kaizen Week.

---

## Part 11 — Final Deliverables and Architectural Recommendations

Recap of the operating standard + architectural recommendations the coordinator must act on.

### 11.1 Architectural decision call-out — Option A vs Option B

**The decision.** `ENGINE_DESIGN.md §4.3` currently defines `KAIZEN_EVENT` projectType as a 1–5 day burst using catalog `#42`–`#50` with no phase structure. The 90-Day Kaizen Event Project described in this standard extends `#42`–`#50` into a 90-day envelope with a 4-macro-phase structure. Two reconciliation options:

**Option A — Extend `KAIZEN_EVENT` to 90 days.** Make the 1–5 day burst a *phase* inside `KAIZEN_EVENT`. Requires:
1. Invalidating `ARCHITECTURE.md §2.9` invariant "`AD_HOC` and `KAIZEN_EVENT` have no phase."
2. Adding `phase` + `phaseDefinitions` support on `KAIZEN_EVENT` (parallel to `KAIZEN_ACCELERATOR_30D`).
3. Adding Phase FSM for `KAIZEN_EVENT` (parallel to `ARCHITECTURE.md §3.4`).
4. Adding phase-binding filter support in composer for `KAIZEN_EVENT`.
5. Back-migrating any existing `KAIZEN_EVENT` rows to the new phased structure.
6. UI: Kaizen card PhaseStepper for `KAIZEN_EVENT`.

**Cost:** invariant inversion; data migration; non-trivial engine/UI branches; risk of breaking existing `KAIZEN_EVENT` consumers.

**Option B — Add `KAIZEN_EVENT_90D` as a distinct projectType.** Leaves `KAIZEN_EVENT` semantics unchanged (1–5 day burst). Requires:
1. Adding `KAIZEN_EVENT_90D` to the `Kaizen.projectType` enum in `ARCHITECTURE.md §2.9`.
2. Adding `focusArea='KAIZEN_EVENT_90D'` enum value for catalog entries.
3. Adding phase structure `{'PRE_EVENT','EVENT','POST_EVENT','SUSTAIN'}` for `KAIZEN_EVENT_90D` only.
4. Extending the phase-binding filter to recognize `KAIZEN_EVENT_90D` alongside `KAIZEN_ACCELERATOR_30D`.
5. Catalog entries `#42`–`#50` — no structural change; they can be bound to both `KAIZEN_EVENT` (unphased) and `KAIZEN_EVENT_90D` (phased) via polymorphic `projectTypeBinding` OR (cleaner) bind them to `KAIZEN_EVENT_90D` + retain a copy under `KAIZEN_EVENT`. Recommend: make `projectTypeBinding` a nullable string that matches either, with the engine's eligibility check resolving by `Kaizen.projectType`.

**Cost:** one enum value + service-routing branches + one UI PhaseStepper variant. Zero migration. Zero invariant inversion. Zero consumer breakage.

**Recommendation: Option B.**

**Rationale:**
1. **Precedent.** `KAIZEN_ACCELERATOR_30D` established the pattern of adding sibling distinct project types for phased variants; extending that pattern to `KAIZEN_EVENT_90D` maintains architectural consistency.
2. **Invariant preservation.** Option A inverts a named invariant (`ARCHITECTURE.md §2.9` "KAIZEN_EVENT has no phase"); Option B preserves every existing invariant.
3. **Semantic clarity.** The 1–5 day burst and the 90-day event-plus-implementation are genuinely different project types in operator understanding, not two phases of one type. Brand names (CadencePlan Kaizen Event vs CadencePlan Kaizen 90) reflect this.
4. **Migration cost.** Option A requires data migration of existing `KAIZEN_EVENT` rows; Option B is additive only.
5. **Blast radius.** Option A touches the composer, guards, UI, migration engine, and invariant reference tables; Option B touches the enum, a service routing branch, and a PhaseStepper variant.
6. **Rollback safety.** If `KAIZEN_EVENT_90D` is later retired, Option B allows clean removal; Option A would require re-inverting the invariant.

**Trade-offs flagged:**
- Option B creates an enum value that, if mis-chosen by an operator, cannot be silently converted to `KAIZEN_EVENT` later. Mitigation: onboarding UI for project-type selection makes the decision explicit, with the Part 1.3 decision table shown inline.
- Option B means catalog `#42`–`#50` potentially binds to two projectTypes; the engine's eligibility check must resolve cleanly. Recommend making `projectTypeBinding` support a set rather than a single value, OR duplicate the binding at seed time with different focusArea tags. Prefer the set approach for data-normalization.
- Option B adds complexity to the project-type decision tree facing users. Mitigation: Part 1.3's decision table ships in the intake UI.

### 11.2 Architectural integration — what lands where

**`ARCHITECTURE.md` changes required (all §-number references are to `ARCHITECTURE.md`):**
1. §2.2 `CatalogEntry.projectTypeBinding` enum add `KAIZEN_EVENT_90D` value (and change type to array OR duplicate at seed).
2. §2.2 `CatalogEntry.focusArea` enum add `KAIZEN_EVENT_90D`.
3. §2.9 `Kaizen.projectType` enum add `KAIZEN_EVENT_90D`.
4. §2.9 `Kaizen.phase` comment extend to include `'PRE_EVENT' | 'EVENT' | 'POST_EVENT' | 'SUSTAIN'` for `KAIZEN_EVENT_90D`.
5. §2.9 Invariant add: `projectType === 'KAIZEN_EVENT_90D' AND state === 'CLOSED'` requires `roi !== null` AND `controlPlanArtifactRef !== null` AND `remeasurementId !== null` (same as Accelerator).
6. §2.9 Invariant add: `projectType === 'KAIZEN_EVENT_90D' AND phase === null` is illegal once activated.
7. New §3.5 Phase FSM for `KAIZEN_EVENT_90D` (parallel to §3.4).
8. §6.1 events table — extend `ProjectPhaseAdvanced` + `AcceleratorPaceWarning` (rename to `ProjectPaceWarning`) to fire for `KAIZEN_EVENT_90D` too.
9. §9 Decision log — new entry for Option B adoption.

**`ENGINE_DESIGN.md` changes required:**
1. §4.3 — retitle "Kaizen event — time-boxed composition" to "Kaizen event (short-burst) — time-boxed composition" and add clarifier that `KAIZEN_EVENT_90D` is the phased 90-day variant.
2. New §4.4 (or §4.3.1) — Kaizen Event 90-Day project model, with phase-binding filter for `#42`–`#50` + Pre-Event / Event / Post-Event / Sustainment structure.
3. §1.6 `selectDeepPayload` — extend to recognize `KAIZEN_EVENT_90D` phase filter.
4. `phaseFor()` logic — not needed for `KAIZEN_EVENT_90D` (phase is stored, not derived, per `Kaizen.phase`).

**`DELIVERY_PLAN.md` changes required:**
1. New epic E17 — Kaizen Event 90-Day Project Type Support.
2. New epic E18 — Cross-Functional Implementation Backlog Tracker.
3. Extension to E13 (if the Accelerator epic covers that)'s patterns: reuse phase-advance guard templates for `KAIZEN_EVENT_90D` phases.
4. Seed migration for `KAIZEN_EVENT_90D` catalog `#42`–`#50` phase bindings.

### 11.3 Product workflow implications — epics and UX

**E17 — Kaizen Event 90-Day Project Type Support (new epic):**
- Enum value + schema additions per §11.2.
- Phase FSM implementation parallel to Accelerator.
- Composer filter extension.
- Phase advance guards (mirror of Accelerator's `canAdvancePhase()`).

**E18 — Cross-Functional Implementation Backlog Tracker (new epic):**
- A17 Implementation Backlog as first-class entity (not just a JSON blob on Kaizen).
- Weekly sprint rollup view.
- Capacity-protection telemetry (`kze_postevent_19`) as a first-class signal.
- Issue/Risk Log (A25) persistence.
- Adoption Log (A28) persistence.

**E7 Kaizen Lifecycle extension:**
- Extend existing Kaizen CRUD to handle `KAIZEN_EVENT_90D`'s phase structure.

**E8 DMAIC DAG extension:**
- No change directly, but the phase-binding filter in `ComposerService.eligibleDmaicPayloadSteps()` generalizes to `eligibleProjectPayloadSteps()` to serve both DMAIC DAG and the Accelerator / Kaizen 90 phase filters.

**UX / `UX_FLOWS.md` implications:**
- Project-type intake flow surfaces Part 1.3 decision table.
- Kaizen 90 PhaseStepper component (4 macro-phases).
- Weekly status dashboard for Post-Event implementation.
- Adoption audit entry form.
- Sustainment Gate UI block (Day 70).
- Cross-functional roster builder (supports multi-function SMEs).

### 11.4 AI-agent binding (per `AI_AGENTS.md`)

Confirmed: no new agents invented. All five existing agents (Planning, Momentum, Context, Reflection, Composer Explainer) bind to Kaizen 90 per Part 10. Telemetry additions bind to existing `bamx:v1:agent-telemetry` key. No agent-specific `AI_AGENTS.md` revision required beyond a Kaizen 90 example appendix.

### 11.5 Architectural inconsistencies flagged for coordinator patch

The following inconsistencies were identified between this standard and the existing architecture. Each is flagged for coordinator decision but none block this standard's adoption as authoritative:

1. **`ARCHITECTURE.md §2.9` `Kaizen.phase` field comment.** Currently: "Null for non-phased types (`DMAIC` derives phase from DAG; `AD_HOC` and `KAIZEN_EVENT` have no phase)." Must extend to include `KAIZEN_EVENT_90D`'s 4-phase structure under Option B.

2. **`ENGINE_DESIGN.md §4.3`.** Title says "Kaizen event — time-boxed composition" without distinguishing short-burst vs 90-day. Rename and add §4.4 for the 90-day variant.

3. **Catalog `#44 Event Scheduling` (CATALOG_GAPS.md).** Currently structured for 1–5 day event selection. Works for Kaizen 90 without change (scheduling 5 consecutive days out of a 90-day window) but the description could add a note about Kaizen 90 context.

4. **Catalog `#48 Implemented Improvements` duration (23 hours).** This duration was authored for a single event-implementation sequence. For Kaizen 90, `#48` spans 50 days and totals ~600 person-hours across the team; the 23-hour catalog number is now the *per-major-item* indicative duration, not the project total. Recommend catalog annotation: "For `KAIZEN_EVENT_90D` bindings, treat as per-item indicative duration; total implementation hours per project are much higher — see `KAIZEN_EVENT_STANDARD.md §2.20`."

5. **`Kaizen.actions[]` field on `ARCHITECTURE.md §2.9`.** Currently shaped as `[{name, ownerRef, dueDate, doneAt}]`. Kaizen 90's A17 backlog has additional fields (acceptance criterion, size, sprint, priority score, before/after link). Either extend `Kaizen.actions[]` schema OR store A17 as a separate first-class entity (recommended — E18 epic).

6. **`ProjectPhaseAdvanced` event payload (§6.1).** Currently fires "only for `KAIZEN_ACCELERATOR_30D`." Extend to fire for `KAIZEN_EVENT_90D`.

7. **`AcceleratorPaceWarning` event (§6.1).** Name is projectType-specific. Generalize to `ProjectPaceWarning` with a `projectType` discriminator in payload. Applies to Kaizen 90 pacing (e.g., "Sprint 4 velocity < 60%").

8. **`KaizenService.close()` guard for `KAIZEN_EVENT_90D`.** Requires the Sustainment Gate check (adoption ≥80% × 2 weeks, no rollback events) in addition to existing remeasurement + ROI + controlPlanArtifactRef checks. New guard rule; codify in `ARCHITECTURE.md §3.3` or the Part 11 Phase FSM.

9. **`CATALOG_GAPS.md §I` pattern for 30-Day Accelerator.** Extend with analogous `§K — 90-Day Kaizen Event catalog bindings` section listing all 9 entries with `projectTypeBinding='KAIZEN_EVENT_90D'` + `phaseBinding` values.

10. **Delivery plan R-number reservation.** Sprint plan should reserve the next available R-number for the Kaizen 90 DAG payload design doc (analog to R9 DAG for DMAIC and R13 for Accelerator catalog seed).

### 11.6 Next steps for operationalization

1. **Coordinator ratifies Option B.** Enum addition + schema extensions per §11.2 open for implementation.
2. **System architect drafts `KAIZEN_EVENT_90D` Phase FSM section.** Parallel to `ARCHITECTURE.md §3.4`.
3. **Backend engineer implements phase guards** mirroring `KaizenService.canAdvancePhase('KAIZEN_ACCELERATOR_30D', ...)`.
4. **UX designer adds Part 1.3 decision table to intake flow** and Kaizen 90 PhaseStepper.
5. **PM writes E17 and E18 epics** with task breakdown.
6. **Phil / Black Belt partner reviews catalog `#42`–`#50`** procedures for Kaizen 90 context addendums (e.g., `#43` DCP cross-functional handoff requirement).
7. **Seed data author creates `projectTypeBinding='KAIZEN_EVENT_90D'`** catalog rows per §11.5 item 9.
8. **AI team appendix-adds Kaizen 90 examples to `AI_AGENTS.md`** (no new agents).

### 11.7 Standard recap — at-a-glance

- **9 catalog anchors (`#42`–`#50`) extended into 82 operational tasks across 4 macro-phases and 19 sub-phases over 90 days.**
- **34 artifacts (21 user-required + 13 validation-added) specified in Part 4.**
- **1,450 total person-hours per project**; ~210 Facilitator, ~195 Process Owner, ~213 Implementation Lead, ~422 core team, ~200 SMEs, ~15 Sponsor, ~14 Finance, ~54 ChM partner, ~56 Analyst.
- **Sprint cadence 7 weeks × 1 week = 7 sprints during Post-Event Implementation**, weekly Mon plan / Wed check / Fri demo-retro.
- **Sustainment Gate at Day 70** is the single most important Kaizen 90 discipline vs standalone Kaizen events.
- **Option B: add `KAIZEN_EVENT_90D`** as distinct projectType; preserves all current invariants; adds one enum value + service-routing branches + UI PhaseStepper variant.
- **No new AI agents**; binds to Planning / Momentum / Context / Reflection / Composer Explainer per `AI_AGENTS.md`.
- **10 architectural inconsistencies flagged** for coordinator patch (§11.5); none block adoption of this standard as authoritative.

This standard is now authoritative for Kaizen 90 project operations within CadencePlan. All facilitators, PMOs, operational-excellence teams, and AI agents operating against `projectType='KAIZEN_EVENT_90D'` (post-Option-B ratification) treat this document as binding.
