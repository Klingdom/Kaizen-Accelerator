# Standard Work Catalog — Gaps & Proposed Defaults

Owner: Product Manager / CTO Agent
Status: Draft v0.1 — companion to `PRODUCT_BLUEPRINT.md` §3.1
Source: `docs/Business Agility Standard Work.txt`

## Purpose

`PRODUCT_BLUEPRINT.md` §3.1 says every catalog entry must carry nine fields: **name, focus area, duration, cadence, inputs, outputs / required artifact, participants, trigger, procedure**. The source file only declares five of those (name, focus area, activity #, hours/sprint, procedure) — and has gaps even in those.

This document:
1. Lists every row that needs content work, grouped by severity
2. Proposes a concrete default for each missing field so MVP seed data is complete
3. Proposes a bulk-fill strategy for the four fields missing on **all 50** rows (cadence, inputs, outputs, participants, trigger)

Every proposal is a starting point for Phil to accept, edit, or reject before MVP seed. Rows marked `> **Needs Phil**` cannot be inferred from the source and require a decision.

Count summary:
- 4 rows with no duration and no procedure (§A)
- 6 rows with duration but procedure marked "Missing" (§B)
- 6 rows with duration but only a link, no steps (§C)
- 7 rows with duration but completely blank procedure (§D)
- 50 rows missing cross-cutting metadata (§E)

---

## A. Fully missing (no hours, no procedure) — 4 rows

### A.1 Activity #17 — RESERVED

> **Needs Phil.** The source skips from #16 to #18 with no row. Both neighbors are Communications. Either (a) the number was skipped intentionally and the catalog is 49 items numbered 1–50 with #17 reserved; or (b) a Communications activity is missing (likely candidates: Inbox / Chat Management, Written Status Update, Escalation Handling). Do not seed until resolved.

### A.2 Activity #19 — Refining Program Plan

| Field | Proposed default |
|---|---|
| Focus area | Communications |
| Duration | **2.0h** (matches sibling Document Writing #18) |
| Cadence | Sprint (mid-sprint refinement) |
| Inputs | Current Program Plan, sprint backlog, stakeholder feedback, latest OKR snapshot |
| Output / required artifact | Updated Program Plan document with revision date and diff note |
| Participants | Program Manager (owner) + Product Owner |
| Trigger | Mid-Sprint Review (Fri Wk1) OR program-plan-drift signal (milestone slipped, scope changed) |
| Procedure | a. Open current Program Plan and latest sprint outcomes. b. Identify gaps: slipped milestones, changed scope, new dependencies, resource shifts. c. Incorporate stakeholder feedback from last week's 1:1s and reviews. d. Update milestone dates, owners, and dependency links. e. Note the diff in a short changelog block. f. Publish updated plan to team channel. |

### A.3 Quarterly Planning (unnumbered row, between #19 and Sprint Planning)

| Field | Proposed default |
|---|---|
| Focus area | Continuous Improvement |
| Duration | **4.0h** (half-day, per *The BAM Way* Ch. 5 quarter kickoff) |
| Cadence | Quarterly (start of quarter, aligned to 6+1 sprint model) |
| Inputs | Prior quarter OKR scorecard, portfolio roadmap, team capacity, Kaizen pipeline |
| Output / required artifact | Quarter Plan document (OKRs, sprint goals for 6 sprints, Sprint 7 reset window, Kaizen portfolio allocation) |
| Participants | Team + Agile Leader + CI Champion + Process Owner |
| Trigger | First working day of each quarter |
| Procedure | a. Review prior quarter: OKR confidence vs actual, Kaizens closed with validated benefit, sprint-goal completion rate. b. Align to org priorities and externally imposed constraints for the coming quarter. c. Draft quarterly OKRs (3–5). d. Lay out 6 sprints + 1 reset sprint (Sprint 7) on the calendar. e. Allocate Kaizen portfolio across sprints (which DMAIC / Kaizen projects land in which sprints). f. Identify Sprint 7 reset scope (backlog hygiene, L&D catch-up, retros of retros). g. Publish to team, schedule Sprint 1 Planning. |

### A.4 Activity #20 — DMAIC Project Charter

| Field | Proposed default |
|---|---|
| Focus area | DMAIC Project Work |
| Duration | **2.0h** (matches Sprint Planning as the "opening ceremony" pattern) |
| Cadence | Event-driven (Sprint 0 of a new DMAIC project) |
| Inputs | Opportunity or problem statement (from Kaizen promotion, VOC, variance log), sponsor commitment, proposed process owner |
| Output / required artifact | Signed DMAIC Charter (problem, scope, goal with baseline/target, team, timeline, risks, sponsor signature) |
| Participants | Project Lead (owner) + Process Owner + Sponsor + CI Champion |
| Trigger | Decision to launch a DMAIC project after Kaizen / variance analysis suggests the problem requires multi-sprint rigour |
| Procedure | a. Write the problem statement in one paragraph (what, where, when, scope of impact). b. Document the business case (current cost / risk, expected benefit). c. Define in-scope and out-of-scope process boundaries. d. Identify Process Owner, Sponsor, Project Lead, and team members. e. Set goal statement: baseline X → target Y by date Z. f. Estimate sprint count (typical DMAIC: 6–8 sprints). g. Identify top 3 risks and initial mitigations. h. Obtain Sponsor signature. i. Register Charter in project portfolio. |

---

## B. Procedure says "Missing" — 6 rows

Hours and name are declared; procedure is blank or says "Missing - Asana Module?". Proposing procedure text below; metadata defaults follow §E.

### B.1 Activity #23 — DMAIC Stakeholder Analysis (1.0h)

| Field | Proposed default |
|---|---|
| Cadence | Event-driven (DMAIC Define phase) |
| Inputs | DMAIC Charter (#20), org chart, process partner list |
| Output | Stakeholder map: 2x2 grid (Influence × Interest) with engagement approach per quadrant |
| Participants | Project Lead (owner) + 1–2 senior team members |
| Trigger | DMAIC Charter signed |
| Procedure | a. List all stakeholders impacted by or influencing the project (customers, process partners, approvers, users, downstream consumers). b. For each, rate Influence (H/M/L) and Interest (H/M/L). c. Plot on 2x2 grid (High-Influence-High-Interest = manage closely; H-Inf-L-Int = keep satisfied; L-Inf-H-Int = keep informed; L-Inf-L-Int = monitor). d. Assign engagement approach and owner per quadrant. e. Document in Stakeholder Analysis template; feed into Communication Plan (#24). |

### B.2 Activity #24 — DMAIC Communication Plan (1.0h)

| Field | Proposed default |
|---|---|
| Cadence | Event-driven (DMAIC Define phase) |
| Inputs | Stakeholder Analysis (#23), DMAIC Charter (#20) |
| Output | Communication Plan matrix (stakeholder × frequency × channel × format × owner) |
| Participants | Project Lead |
| Trigger | Stakeholder Analysis complete |
| Procedure | a. For each stakeholder quadrant from #23, define: cadence (weekly / biweekly / monthly), channel (chime, email, meeting, dashboard), format (status note, dashboard link, slides), owner, and acceptance criterion ("did the stakeholder read / acknowledge?"). b. Schedule recurring updates on the project calendar (e.g., sponsor monthly 30-min review, team weekly 15-min sync). c. Publish Communication Plan to project space; revisit at each sprint boundary. |

### B.3 Activity #25 — DMAIC Risk and Mitigation Plan (1.0h)

| Field | Proposed default |
|---|---|
| Cadence | Event-driven (DMAIC Define phase, revisited each sprint boundary) |
| Inputs | DMAIC Charter (#20), SIPOC (#21) |
| Output | Risk Register with probability × impact scoring and mitigation owner per risk |
| Participants | Project Lead + Team |
| Trigger | Post-Charter; refresh at each Sprint Retrospective |
| Procedure | a. Brainstorm risks in four buckets: technical, organizational, timeline, resource. b. For each risk, rate Probability (1–5) and Impact (1–5); compute score = P × I. c. For risks with score ≥ 12, write a mitigation plan and assign a risk owner. d. For risks with score 6–11, write a monitoring plan. e. Record in Risk Register template. f. Review at every Sprint Retrospective; retire mitigated risks and add new ones. |

### B.4 Activity #26 — DMAIC VOC/VOB/VOA Analysis (2.0h)

| Field | Proposed default |
|---|---|
| Cadence | Event-driven (DMAIC Define → Measure transition) |
| Inputs | Stakeholder Analysis (#23), customer data sources (tickets, CSAT, NPS, interviews) |
| Output | VOC / VOB / VOA document with Critical-to-Quality (CTQ) translations and prioritization |
| Participants | Project Lead + 3–5 customer interviewees + 2–3 business leaders + 3–5 associates running the process |
| Trigger | Post-Charter |
| Procedure | a. **Voice of Customer (VOC):** Interview 3–5 customers, capture complaints, requests, pain points, and delight moments. b. **Voice of Business (VOB):** Interview 2–3 business leaders, capture strategic, financial, and compliance needs. c. **Voice of Associate (VOA):** Interview 3–5 associates running the process, capture pain points, workarounds, and waste observations. d. Translate each raw voice item into a CTQ requirement (measurable attribute — e.g., "response time < 4h" not "fast response"). e. Prioritize CTQs by frequency, severity, and strategic fit. f. Document in VOC/VOB/VOA template; feed into Output DCP (#22) and C&E Matrix (#34). |

### B.5 Activity #42 — Kaizen Project Charter (2.0h)

| Field | Proposed default |
|---|---|
| Cadence | Event-driven (Kaizen event kickoff) |
| Inputs | Promoted Kaizen candidate (from friction signal queue or Weekly Reflection), process owner commitment |
| Output | Signed Kaizen Charter (problem, event scope, baseline + target + timeline, event team, sponsor signature) |
| Participants | Kaizen Lead + Process Owner + Sponsor |
| Trigger | Kaizen candidate approved for event (typically from weekly reflection or CI Practitioner review) |
| Procedure | a. State problem in one paragraph with scope and pain observed. b. Document business case (current waste / cost / risk; expected benefit). c. Define event scope (process, boundaries, in/out). d. Set goal statement: baseline X → target Y by event end + 30 days. e. Identify event team: Lead, Process Owner, SMEs, Sponsor. f. Schedule event window (typically 1–5 consecutive days, or 3 sprints with event-mode blocks). g. Identify top 3 risks and initial mitigations. h. Obtain Sponsor signature. |

### B.6 Activity #50 — Kaizen Process Owner Transition (1.0h)

| Field | Proposed default |
|---|---|
| Cadence | Event-driven (end of Kaizen event, after remeasurement) |
| Inputs | Kaizen Results Narrative (#49), Implemented Improvements list (#48), Control Chart (#29 pattern) |
| Output | Signed Transition document with Process Owner accountability and 30/60/90-day monitoring schedule |
| Participants | Kaizen Lead + Process Owner |
| Trigger | Kaizen Results Narrative complete AND remeasured metric captured |
| Procedure | a. Walk Process Owner through each implemented improvement and its current performance vs baseline. b. Confirm control measures in place: updated SOP, Control Chart thresholds, rollback plan if regression. c. Transfer ownership of ongoing monitoring (who reads the chart, how often, what action on signal). d. Schedule 30/60/90-day Process Owner check-ins on the calendar. e. Both parties sign Transition document; file with Kaizen record. f. Kaizen Lead steps back; any future changes require Process Owner approval. |

---

## C. Only a template link, no procedure — 6 rows

Each row has hours and a pointer like "Link to 16 Step Process" or "Link to Benefits Translator SOP" but no inline steps. Proposing inline procedures below; metadata in §E.

### C.1 Activity #22 — DMAIC Output Data Collection Plan (2.0h)

| Field | Proposed default |
|---|---|
| Cadence | Event-driven (DMAIC Measure phase) |
| Inputs | DMAIC SIPOC (#21), VOC/VOB/VOA with CTQs (#26) |
| Output | Output DCP template with one row per CTQ output metric (operational definition, measurement method, sampling plan, owner, tool) |
| Participants | Project Lead + Team |
| Trigger | Post-SIPOC, before Baseline (#28) |
| Procedure | a. List CTQ output metrics (Y's) from VOC/VOB/VOA. b. For each metric, document: operational definition, unit of measure, measurement method (manual / instrument / extract), sampling plan (n, frequency, stratification), collection owner, tool, data storage location. c. If measurement risk exists (subjective rating, manual gage), run MSA (#31) before locking. d. Pilot DCP for one cycle (e.g., 1 week) to catch ambiguity. e. Lock DCP and proceed to Baseline (#28). |

### C.2 Activity #27 — DMAIC Continuous Reporting Framework (2.0h)

| Field | Proposed default |
|---|---|
| Cadence | Event-driven (DMAIC Measure → Control phase) |
| Inputs | Output DCP data (#22), Financial Benefit Translator (#39) |
| Output | Live reporting dashboard or report link (baseline, current, target, delta, financial benefit) |
| Participants | Project Lead + Analytics partner |
| Trigger | Post-Baseline (#28) |
| Procedure | a. Define reporting cadence (weekly or monthly). b. Select metrics to report: baseline, current, target, delta, trend direction, sigma level, financial delta. c. Build dashboard (Quip / Looker / Tableau / equivalent) linked to DCP data source. d. Assign dashboard owner and monthly review slot. e. Publish link to stakeholders per Communication Plan (#24). |

### C.3 Activity #28 — DMAIC Baseline Output Performance Data (10.0h)

| Field | Proposed default |
|---|---|
| Cadence | Event-driven (DMAIC Measure phase) |
| Inputs | Locked Output DCP (#22), MSA report (#31) if applicable |
| Output | Baseline dataset + summary statistics + baseline Control Chart (#29) |
| Participants | Project Lead |
| Trigger | Output DCP locked |
| Procedure | a. Execute DCP for baseline period (30 working days OR 30 samples, whichever produces stable statistics). b. Collect data per plan; log any deviations. c. If manual measurement, verify with MSA (#31) before accepting. d. Compute summary statistics: n, mean, median, standard deviation, min, max, Cp / Cpk (if spec limits), process sigma. e. Build baseline Control Chart (#29). f. Record baseline value and statistics in the Charter (#20) as the locked reference point for remeasurement. |

### C.4 Activity #39 — DMAIC Financial Benefit Translator (10.0h)

| Field | Proposed default |
|---|---|
| Cadence | Event-driven (DMAIC Analyze → Improve → Control, revisited) |
| Inputs | Baseline data (#28), projected or actual post-improvement performance, unit cost data from Finance |
| Output | Financial Benefit document: annualized net benefit, confidence rating, Finance-partner sign-off |
| Participants | Project Lead + Finance partner |
| Trigger | Baseline complete (projection) OR post-improvement (actual) |
| Procedure | a. Identify benefit categories: hard-dollar cost reduction, revenue lift, quality / rework reduction, risk avoidance. b. Quantify current cost / loss per period at baseline performance. c. Project post-improvement cost / loss at target performance. d. Compute annualized net benefit = 12 × monthly delta. e. Apply confidence rating: **Hard** (directly in P&L), **Soft** (time / capacity freed), **Cost Avoidance** (prevented future loss). f. Obtain Finance-partner sign-off. g. Register benefit in portfolio benefits ledger; revisit at project close and 90 days post-close. |

### C.5 Activity #43 — Kaizen Output Data Collection Plan (2.0h)

| Field | Proposed default |
|---|---|
| Cadence | Event-driven (Kaizen event Day 1) |
| Inputs | Kaizen Charter (#42), Event SIPOC (#45) |
| Output | Kaizen DCP (same structure as DMAIC Output DCP #22, scoped to event window) |
| Participants | Kaizen Lead + Team |
| Trigger | Event start |
| Procedure | Same as #22 DMAIC Output DCP, but scoped to the Kaizen event window (typically 1–5 days), with lighter sampling plan. Emphasis on capturing pre-event and post-event snapshots rather than a 30-sample rolling baseline. |

### C.6 Activity #49 — Kaizen Project Results Narrative 3 Pager (2.0h)

| Field | Proposed default |
|---|---|
| Cadence | Event-driven (end of Kaizen event) |
| Inputs | Baseline (from #43), implemented improvements (#48), remeasurement data, Financial Benefit (if computed) |
| Output | 3-page Results Narrative document |
| Participants | Kaizen Lead |
| Trigger | Post-remeasurement (typically event + 30 days) |
| Procedure | a. **Page 1 — Problem & Goal:** problem statement, baseline, goal, team, event dates, process owner. b. **Page 2 — What Was Done:** implemented improvements, process changes, before/after process diagram, key C&E / FMEA insights. c. **Page 3 — Results:** remeasured primary metric, delta vs baseline (absolute + %), secondary metrics, financial benefit with confidence rating, lessons learned, Process Owner transition status (#50). d. Publish to Kaizen portfolio. |

---

## D. Hours present, procedure completely blank — 7 rows

### D.1 Activity #30 — DMAIC Process Capability Report (1.0h)

| Field | Proposed default |
|---|---|
| Cadence | Event-driven (DMAIC Measure, revisit in Control) |
| Inputs | Baseline data (#28), USL / LSL from CTQ definition |
| Output | Capability Report: Cp, Cpk, Pp, Ppk, DPMO, process sigma |
| Participants | Project Lead |
| Trigger | Baseline data locked |
| Procedure | a. Verify data normality (histogram, normal-probability plot, Anderson-Darling). If non-normal, transform or use non-parametric method. b. Define spec limits (USL / LSL) from CTQ or customer requirement. c. Calculate short-term capability: Cp = (USL − LSL) / 6σ̂, Cpk = min((USL − μ) / 3σ̂, (μ − LSL) / 3σ̂). d. Calculate long-term performance: Pp, Ppk using overall standard deviation. e. Compute DPMO and process sigma. f. Document in Capability Report template; flag if Cpk < 1.33. |

### D.2 Activity #31 — DMAIC MSA Report (3.0h)

| Field | Proposed default |
|---|---|
| Cadence | Event-driven (DMAIC Measure, before Baseline #28) |
| Inputs | Measurement system definition, 10 representative samples, 2–3 trained appraisers |
| Output | MSA Report with Gage R&R results and accept/reject decision |
| Participants | Project Lead + 2–3 appraisers |
| Trigger | Output DCP drafted; before locking |
| Procedure | a. Select 10 samples that cover the expected process range. b. Have 2–3 appraisers measure each sample 2–3 times in randomized order. c. Compute Gage R&R: repeatability (equipment variation) and reproducibility (appraiser variation). d. Acceptance: %R&R < 10% excellent, 10–30% marginal (acceptable if cost-justified), > 30% unacceptable. e. If unacceptable, fix the measurement system (retrain, recalibrate, redefine operational definition) and re-run MSA before proceeding. f. Document results and decision. |

### D.3 Activity #33 — DMAIC Quick Win Improvements (20.0h)

| Field | Proposed default |
|---|---|
| Cadence | Event-driven (DMAIC Analyze → Improve; can fire any time during project) |
| Inputs | Process Maps (#32), VOC insights (#26), team observations |
| Output | Implemented quick-win changes with before / after measurements |
| Participants | Project Lead + Team + Process Owner |
| Trigger | Quick-win candidate identified (lead time < 1 week, cost < $1K, effort < 2 person-days) |
| Procedure | a. Candidate filter: lead time < 1 week AND cost < $1K AND effort < 2 person-days AND reversible. b. Get Process Owner approval (verbal is fine if reversible). c. Implement change. d. Measure impact on primary metric before and after (min 5 observations each side). e. Log in Quick Wins log: name, hypothesis, before / after, decision (keep / revert). f. Feed kept wins into Improvement Backlog (#38) for scaling; log reverted ones as learnings. |

### D.4 Activity #35 — DMAIC Inputs Data Collection Plan (8.0h)

| Field | Proposed default |
|---|---|
| Cadence | Event-driven (DMAIC Analyze phase) |
| Inputs | Cause & Effect Matrix (#34), prioritized input variables (X's) |
| Output | Input DCP filled (one row per prioritized X) |
| Participants | Project Lead + Team |
| Trigger | Post-C&E Matrix, before Correlation / Regression (#36) |
| Procedure | Same structure as Output DCP (#22) but for input variables (X's) instead of output variables (Y's). For each prioritized input: operational definition, unit, measurement method, sampling plan, collection owner, tool, storage. Lock DCP. Execute for minimum 30 paired observations (X, Y) to support correlation and regression analysis in #36. |

### D.5 Activity #36 — DMAIC Correlation and Regression (3.0h)

| Field | Proposed default |
|---|---|
| Cadence | Event-driven (DMAIC Analyze phase) |
| Inputs | Input DCP data (#35), Output DCP data (#22) |
| Output | Correlation matrix + regression model with R², p-values, residual diagnostics |
| Participants | Project Lead + (optional) Analytics partner |
| Trigger | Input DCP data collected (min 30 paired observations) |
| Procedure | a. Load paired X (input) and Y (output) data. b. Run pairwise correlation matrix; note |r| > 0.4 for potential drivers. c. Fit regression: start with simple linear per significant X, escalate to multiple regression or non-linear as diagnostics warrant. d. Check R² (> 0.7 strong), p-values (< 0.05 significant), residual plots (homoscedasticity, normality, no pattern). e. Identify the vital few X's (Pareto principle — typically 2–3 X's explain most of Y variation). f. Document model, vital X's, and leverage points in Correlation & Regression report. g. Feed vital X's into FMEA (#37) and Improve phase. |

### D.6 Activity #38 — DMAIC Process Improvement Backlog (1.0h)

| Field | Proposed default |
|---|---|
| Cadence | Sprint (living artifact, refined each sprint boundary) |
| Inputs | FMEA recommended actions (#37), Quick Wins pending (#33), VOC gaps (#26), retrospective action items |
| Output | Prioritized Improvement Backlog (name, description, Day-2-Done criteria, effort, impact, priority score) |
| Participants | Project Lead + Process Owner |
| Trigger | Post-FMEA or at each sprint boundary |
| Procedure | a. Aggregate all improvement candidates from FMEA (#37), Quick Wins pending (#33), VOC gaps (#26), and retro action items. b. For each item: name, one-sentence description, Day-2-Done criteria (observable acceptance), effort estimate (hours or t-shirt size), impact estimate on primary metric. c. Score priority (RICE, WSJF, or simple Impact × Confidence ÷ Effort). d. Publish prioritized list to Sprint Planning (#Sprint Planning) for Process Owner selection. e. Carry unfinished items to next sprint. |

### D.7 Activity #41 — DMAIC Project Results Narrative Document (4.0h)

| Field | Proposed default |
|---|---|
| Cadence | Event-driven (DMAIC Control phase, project close) |
| Inputs | Baseline data (#28), implemented improvements (#40), remeasured data, Control Chart (#29), Financial Benefit (#39) |
| Output | Project Results Narrative document (typically 6-page narrative format) |
| Participants | Project Lead |
| Trigger | Control phase complete, Financial Benefit signed off |
| Procedure | a. **Executive summary:** problem → result → annualized benefit (one paragraph). b. **Background:** business case, scope, goal. c. **Results:** baseline vs remeasured, Control Chart before/after, secondary metrics. d. **Root cause findings:** vital X's from C&R (#36), FMEA (#37) top failure modes addressed. e. **Implemented improvements:** list from #40 with before / after for each. f. **Financial benefit:** annualized net benefit with confidence (#39). g. **Control plan:** ongoing monitoring, SOPs updated, Process Owner. h. **Lessons learned:** what worked, what didn't, what to replicate. i. Review with Sponsor and file in portfolio. |

---

## E. Cross-cutting metadata defaults for all 50 rows

The source declares only **activity #, focus area, name, hours / sprint, procedure**. The blueprint requires five additional fields on every row: **cadence, inputs, outputs / required artifact, participants, trigger**. Rather than listing all 50 rows here, propose these bulk-fill rules; exceptions above (§A–D) override.

### E.1 Cadence — rule-based inference

| Rule | Assign cadence | Applies to |
|---|---|---|
| Personal continuous-learning tick with weekly-level hours | **Continuous** (weekly tick) | #1, #2, #6 |
| Compliance or partner engagement with monthly cost | **Monthly** | #3, #5 |
| Document flow activity (arrives → respond) | **On-signal** (document arrival) | #4 |
| Innovation pipeline stage gated by prior stage completion | **On-signal** (stage gate) | #7, #8, #9, #10, #11 |
| Short-interval experimental cycle | **Every-48h** | #12 (PDCA) |
| Inbox-threshold triggered hygiene | **Weekly** (or on-threshold) | #13 (6S Email) |
| Communication rhythm that protects attention windows | **Daily** | #14 (Time-blocking) |
| Team meetings kept lean with agenda | **Weekly** | #15 |
| Peer connection best-practice by office day | **Weekly** (Wed/Thu) | #16 |
| Writing output expected each sprint | **Weekly** | #18 |
| Program-plan refinement | **Sprint** | #19 (see §A.2) |
| Quarter-level anchor | **Quarterly** | Quarterly Planning (see §A.3) |
| BAM ceremony | **Sprint-cadenced** (see §3.2 of blueprint for exact day) | Sprint Planning, Daily Standup, Mid-Sprint Review, Sprint Review, Sprint Retrospective |
| DMAIC project step | **Event-driven within DMAIC project phase** (Define / Measure / Analyze / Improve / Control) | #20–#41 |
| Kaizen event step | **Event-driven within Kaizen event** (event prep / event window / post-event) | #42–#50 |

### E.2 Inputs — default by focus area

| Focus area | Default "Inputs" field |
|---|---|
| Continuous Improvement (personal) | L&D Tracker state, personal quarterly development goal |
| Continuous Improvement (team) | Team L&D Tracker, team quarterly goal, team charter |
| Innovation Process | Opportunity Tracker row, prior-stage output artifact |
| Communications | Calendar, inbox / chime threads, stakeholder list |
| BAM ceremony | Improvement Backlog (for Planning), Sprint Backlog (for Standup / Review / Retro) |
| DMAIC Project Work | Charter (#20) plus all prior DMAIC step outputs in the chain |
| Kaizen Project Work | Kaizen Charter (#42) plus all prior Kaizen step outputs |

Override with the explicit inputs listed per row in §A–D where given.

### E.3 Outputs / required artifact — default by focus area

| Focus area | Default "Output" field |
|---|---|
| Continuous Improvement (L&D) | Knowledge Sharing 1 Pager (#1) / Team Retrospective notes (#2) / Compliance completion record (#3) |
| Innovation Process | Stage-specific artifact: Opportunity Tracker entry → PRFAQ → Prototype → Product Assessment → Initiated Product record |
| Communications | For #14/#16: calendar block completion + any 1:1 notes. For #18: published document. |
| BAM ceremony | Ceremony-specific artifact per `.txt`: Sprint Backlog, Standup notes, Sprint Review summary, Retrospective actionable items list. |
| DMAIC Project Work | Named artifact per step (SIPOC, DCP, Baseline report, Control Chart, FMEA, etc.) |
| Kaizen Project Work | Named artifact per step (Charter, SIPOC, DCP, 3-Pager Narrative, Transition document) |

The blueprint rule is that **no catalog activity can be closed without its required output artifact attached**. Override with the explicit output per row in §A–D where given.

### E.4 Participants — default by BAM role

| Focus area | Default participants |
|---|---|
| Personal CI (L&D, PDCA, 6S Email) | Self (Agile Practitioner) |
| Team CI (Team L&D, Team Intros, Document Review for team) | Self + Team + Agile Facilitator |
| Innovation Process | Owner / Driver + Executive Sponsor (for gate approvals) |
| Communications | Self (Time-blocking, Document Writing); Self + counterpart (1:1s); Self + Team (team meetings) |
| Sprint Planning / Review | Team + Process Owner + Agile Facilitator (+ Sponsor for Review) |
| Daily Standup | Team + Agile Facilitator |
| Sprint Retrospective | Team + Agile Facilitator (+ optional Process Owner per #Sprint Retrospective procedure) |
| Mid-Sprint Review | Team + Agile Facilitator |
| Quarterly Planning | Team + Agile Leader + CI Champion + Process Owner |
| DMAIC Project Work | Project Lead + Team (+ Process Owner + Sponsor + Finance as step-specific) |
| Kaizen Project Work | Kaizen Lead + Event Team + Process Owner + Sponsor |

### E.5 Trigger — default rules

| Cadence (from E.1) | Default trigger |
|---|---|
| Continuous | Own development goal active OR weekly anchor day |
| Daily | Same time each work day (per `.txt` Daily Standup procedure) |
| Every-48h | Prior PDCA cycle measurement recorded |
| Weekly | Fixed anchor day (e.g., Mon for 6S Email; Wed/Thu for 1:1s; Fri afternoon for Weekly Reflection) |
| Sprint | Mapped to specific sprint day per `.txt` (Mon Wk1 for Planning; Fri Wk1 for Mid-Sprint; Fri Wk2 for Review + Retro) |
| Monthly | First working day of month |
| Quarterly | First working day of quarter |
| On-signal | Named signal (document arrived, opportunity assigned, inbox threshold crossed, variance logged) |
| Event-driven | Prior step in project / event chain complete |

---

## F. Open questions for Phil before seed

1. **Activity #17:** reserved (catalog is 49 numbered items), or missing a Communications activity that should be added? (See §A.1.)
2. **Activities #19, Quarterly Planning, #20:** accept proposed durations (2.0h, 4.0h, 2.0h)? (See §A.2–A.4.)
3. **DMAIC "Asana Module?" rows (#23, #24, #25):** accept inline procedures above, or keep as "external tool reference" and let the MVP link out to Asana / similar?
4. **BAM Way Ch. 14 role-based standard work:** should Practitioner / Facilitator / Leader / Champion daily and sprint commitments be merged into the catalog as additional rows before MVP seed, or kept as a separate role-overlay layer?
5. **Bulk-fill metadata (§E):** accept the rule-based defaults for cadence / inputs / outputs / participants / trigger as the MVP seed, then refine per-row in-product, or require Phil-signed defaults for each of the 50 rows before seed?
6. **Output artifacts that reference external templates ("Writing Hub PRFAQ", "Benefits Translator SOP", "16 Step Process", "Quip Template"):** are these templates still the canonical artifact source, or should MVP ship its own templates and deprecate the external links?

---

## G. Handoff

- **If this doc is approved as-is:** the 23 rows with content gaps and all 50 rows' metadata are ready to be seeded into the Standard Work Catalog entity for MVP. The catalog seed passes downstream to `system-architect` (defines the Catalog Entry entity) and `backend-engineer` (ships the seed migration).
- **If sections need rework:** mark edits inline in this file; re-run catalog completion before handing off.
- **Out of scope here:** the four BAM ceremonies that already have full procedures in the source (Sprint Planning, Daily Standup, Sprint Review, Sprint Retrospective) only need the §E metadata fields appended — no procedure work required.
