# Standard Work Catalog — Gaps & Proposed Defaults

Owner: Product Manager / CTO Agent
Status: Draft v0.3 — v0.3 adds §J (authoritative DMAIC DAG edges for `#20`–`#41` with two-pass `#39` Financial Benefit Translator semantics) and §K (Kaizen 90 catalog bindings for `#42`–`#50` to `KAIZEN_EVENT_90D` with phase mapping), per operating-standard recommendations in `DMAIC_STANDARD §11.2` item 7 and `KAIZEN_EVENT_STANDARD §11.5` item 9. Updates §F count summary to include §J + §K. Grounded in `ARCHITECTURE.md` v0.5. v0.2 approved §A–§D procedure text; §F open questions resolved; §I Accelerator procedures pending v0.2 review (see `PROJECT_TYPE_30D_KAIZEN.md` §3).
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
- 31 new 30-Day Kaizen Accelerator entries pending procedure authoring (§I)
- **DMAIC DAG edges authoritative spec (22 catalog entries #20–#41 + two-pass #39) — §J (new v0.3)**
- **Kaizen 90 catalog bindings (catalog #42–#50 phase-binding to KAIZEN_EVENT_90D's 4 macro-phases) — §K (new v0.3)**

**Total:** ~23 rows need content work + all 50 need metadata augmentation + **31 new Accelerator entries pending procedure-text authoring** (build-start blocker for `DELIVERY_PLAN.md` E13-T1 — see §I.2 and `DELIVERY_PLAN.md §5 R13`) + **22 DMAIC edges + 9 Kaizen 90 bindings authoritative spec in §J / §K** (seed input to `E2-T8` and the new `E8-T0` DAG seed task in `DELIVERY_PLAN §2 E8`).

---

## A. Fully missing (no hours, no procedure) — 4 rows

### A.1 Activity #17 — RESERVED ✓ Approved

**Coordinator decision (2026-04-19, §F Q1):** RESERVED. The BAM source intentionally skipped #17. The catalog is **49 numbered items** with #17 as a reserved slot. **Do not invent a new Communications activity.** Seed the catalog as a 49-entry set; #17 is simply absent.

### A.2 Activity #19 — Refining Program Plan ✓ Approved

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

### A.3 Quarterly Planning (unnumbered row, between #19 and Sprint Planning) ✓ Approved

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

### A.4 Activity #20 — DMAIC Project Charter ✓ Approved

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

### B.1 Activity #23 — DMAIC Stakeholder Analysis (1.0h) ✓ Approved

| Field | Proposed default |
|---|---|
| Cadence | Event-driven (DMAIC Define phase) |
| Inputs | DMAIC Charter (#20), org chart, process partner list |
| Output | Stakeholder map: 2x2 grid (Influence × Interest) with engagement approach per quadrant |
| Participants | Project Lead (owner) + 1–2 senior team members |
| Trigger | DMAIC Charter signed |
| Procedure | a. List all stakeholders impacted by or influencing the project (customers, process partners, approvers, users, downstream consumers). b. For each, rate Influence (H/M/L) and Interest (H/M/L). c. Plot on 2x2 grid (High-Influence-High-Interest = manage closely; H-Inf-L-Int = keep satisfied; L-Inf-H-Int = keep informed; L-Inf-L-Int = monitor). d. Assign engagement approach and owner per quadrant. e. Document in Stakeholder Analysis template; feed into Communication Plan (#24). |

### B.2 Activity #24 — DMAIC Communication Plan (1.0h) ✓ Approved (v0.2 polish)

| Field | Proposed default |
|---|---|
| Cadence | Event-driven (DMAIC Define phase) |
| Inputs | Stakeholder Analysis (#23), DMAIC Charter (#20) |
| Output | Communication Plan matrix (stakeholder × frequency × channel × format × owner) |
| Participants | Project Lead |
| Trigger | Stakeholder Analysis complete |
| Procedure | a. Open the Stakeholder Analysis from #23; copy the four quadrants into the Communication Plan matrix. b. For each stakeholder row, define: cadence (daily / weekly / biweekly / monthly), channel (chat, email, meeting, dashboard, 1:1), format (status note, dashboard link, slide deck, verbal), and owner. c. Write an acceptance criterion per row (e.g., "sponsor opens the dashboard at least once per month" or "team member acknowledges weekly status in chat"). d. Book recurring calendar holds for every synchronous touchpoint (e.g., sponsor monthly 30-min review, team weekly 15-min sync). e. Publish the Communication Plan to the project space; revisit and update the matrix at each Sprint Retrospective. |

### B.3 Activity #25 — DMAIC Risk and Mitigation Plan (1.0h) ✓ Approved

| Field | Proposed default |
|---|---|
| Cadence | Event-driven (DMAIC Define phase, revisited each sprint boundary) |
| Inputs | DMAIC Charter (#20), SIPOC (#21) |
| Output | Risk Register with probability × impact scoring and mitigation owner per risk |
| Participants | Project Lead + Team |
| Trigger | Post-Charter; refresh at each Sprint Retrospective |
| Procedure | a. Brainstorm risks in four buckets: technical, organizational, timeline, resource. b. For each risk, rate Probability (1–5) and Impact (1–5); compute score = P × I. c. For risks with score ≥ 12, write a mitigation plan and assign a risk owner. d. For risks with score 6–11, write a monitoring plan. e. Record in Risk Register template. f. Review at every Sprint Retrospective; retire mitigated risks and add new ones. |

### B.4 Activity #26 — DMAIC VOC/VOB/VOA Analysis (2.0h) ✓ Approved

| Field | Proposed default |
|---|---|
| Cadence | Event-driven (DMAIC Define → Measure transition) |
| Inputs | Stakeholder Analysis (#23), customer data sources (tickets, CSAT, NPS, interviews) |
| Output | VOC / VOB / VOA document with Critical-to-Quality (CTQ) translations and prioritization |
| Participants | Project Lead + 3–5 customer interviewees + 2–3 business leaders + 3–5 associates running the process |
| Trigger | Post-Charter |
| Procedure | a. **Voice of Customer (VOC):** Interview 3–5 customers, capture complaints, requests, pain points, and delight moments. b. **Voice of Business (VOB):** Interview 2–3 business leaders, capture strategic, financial, and compliance needs. c. **Voice of Associate (VOA):** Interview 3–5 associates running the process, capture pain points, workarounds, and waste observations. d. Translate each raw voice item into a CTQ requirement (measurable attribute — e.g., "response time < 4h" not "fast response"). e. Prioritize CTQs by frequency, severity, and strategic fit. f. Document in VOC/VOB/VOA template; feed into Output DCP (#22) and C&E Matrix (#34). |

### B.5 Activity #42 — Kaizen Project Charter (2.0h) ✓ Approved

| Field | Proposed default |
|---|---|
| Cadence | Event-driven (Kaizen event kickoff) |
| Inputs | Promoted Kaizen candidate (from friction signal queue or Weekly Reflection), process owner commitment |
| Output | Signed Kaizen Charter (problem, event scope, baseline + target + timeline, event team, sponsor signature) |
| Participants | Kaizen Lead + Process Owner + Sponsor |
| Trigger | Kaizen candidate approved for event (typically from weekly reflection or CI Practitioner review) |
| Procedure | a. State problem in one paragraph with scope and pain observed. b. Document business case (current waste / cost / risk; expected benefit). c. Define event scope (process, boundaries, in/out). d. Set goal statement: baseline X → target Y by event end + 30 days. e. Identify event team: Lead, Process Owner, SMEs, Sponsor. f. Schedule event window (typically 1–5 consecutive days, or 3 sprints with event-mode blocks). g. Identify top 3 risks and initial mitigations. h. Obtain Sponsor signature. |

### B.6 Activity #50 — Kaizen Process Owner Transition (1.0h) ✓ Approved

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

Each row originally had hours and a pointer like "Link to 16 Step Process" or "Link to Benefits Translator SOP" but no inline steps. Per §F Q6 (Coordinator-Approved 2026-04-19), MVP ships **self-contained inline procedures** — no external template links. Metadata defaults follow §E.

### C.1 Activity #22 — DMAIC Output Data Collection Plan (2.0h) ✓ Approved

| Field | Proposed default |
|---|---|
| Cadence | Event-driven (DMAIC Measure phase) |
| Inputs | DMAIC SIPOC (#21), VOC/VOB/VOA with CTQs (#26) |
| Output | Output DCP template with one row per CTQ output metric (operational definition, measurement method, sampling plan, owner, tool) |
| Participants | Project Lead + Team |
| Trigger | Post-SIPOC, before Baseline (#28) |
| Procedure | a. List CTQ output metrics (Y's) from VOC/VOB/VOA. b. For each metric, document: operational definition, unit of measure, measurement method (manual / instrument / extract), sampling plan (n, frequency, stratification), collection owner, tool, data storage location. c. If measurement risk exists (subjective rating, manual gage), run MSA (#31) before locking. d. Pilot DCP for one cycle (e.g., 1 week) to catch ambiguity. e. Lock DCP and proceed to Baseline (#28). |

### C.2 Activity #27 — DMAIC Continuous Reporting Framework (2.0h) ✓ Approved

| Field | Proposed default |
|---|---|
| Cadence | Event-driven (DMAIC Measure → Control phase) |
| Inputs | Output DCP data (#22), Financial Benefit Translator (#39) |
| Output | Live reporting dashboard or report link (baseline, current, target, delta, financial benefit) |
| Participants | Project Lead + Analytics partner |
| Trigger | Post-Baseline (#28) |
| Procedure | a. Define reporting cadence (weekly or monthly). b. Select metrics to report: baseline, current, target, delta, trend direction, sigma level, financial delta. c. Build dashboard (Quip / Looker / Tableau / equivalent) linked to DCP data source. d. Assign dashboard owner and monthly review slot. e. Publish link to stakeholders per Communication Plan (#24). |

### C.3 Activity #28 — DMAIC Baseline Output Performance Data (10.0h) ✓ Approved

| Field | Proposed default |
|---|---|
| Cadence | Event-driven (DMAIC Measure phase) |
| Inputs | Locked Output DCP (#22), MSA report (#31) if applicable |
| Output | Baseline dataset + summary statistics + baseline Control Chart (#29) |
| Participants | Project Lead |
| Trigger | Output DCP locked |
| Procedure | a. Execute DCP for baseline period (30 working days OR 30 samples, whichever produces stable statistics). b. Collect data per plan; log any deviations. c. If manual measurement, verify with MSA (#31) before accepting. d. Compute summary statistics: n, mean, median, standard deviation, min, max, Cp / Cpk (if spec limits), process sigma. e. Build baseline Control Chart (#29). f. Record baseline value and statistics in the Charter (#20) as the locked reference point for remeasurement. |

### C.4 Activity #39 — DMAIC Financial Benefit Translator (10.0h) ✓ Approved

| Field | Proposed default |
|---|---|
| Cadence | Event-driven (DMAIC Analyze → Improve → Control, revisited) |
| Inputs | Baseline data (#28), projected or actual post-improvement performance, unit cost data from Finance |
| Output | Financial Benefit document: annualized net benefit, confidence rating, Finance-partner sign-off |
| Participants | Project Lead + Finance partner |
| Trigger | Baseline complete (projection) OR post-improvement (actual) |
| Procedure | a. Identify benefit categories: hard-dollar cost reduction, revenue lift, quality / rework reduction, risk avoidance. b. Quantify current cost / loss per period at baseline performance. c. Project post-improvement cost / loss at target performance. d. Compute annualized net benefit = 12 × monthly delta. e. Apply confidence rating: **Hard** (directly in P&L), **Soft** (time / capacity freed), **Cost Avoidance** (prevented future loss). f. Obtain Finance-partner sign-off. g. Register benefit in portfolio benefits ledger; revisit at project close and 90 days post-close. |

### C.5 Activity #43 — Kaizen Output Data Collection Plan (2.0h) ✓ Approved (v0.2 — shorthand expanded)

| Field | Proposed default |
|---|---|
| Cadence | Event-driven (Kaizen event Day 1) |
| Inputs | Kaizen Charter (#42), Event SIPOC (#45) |
| Output | Kaizen DCP document with one row per CTQ output metric (operational definition, measurement method, pre/post sampling plan, owner, tool) |
| Participants | Kaizen Lead + Team |
| Trigger | Event start |
| Procedure | a. List the 1–3 CTQ output metrics (Y's) named in the Kaizen Charter (#42) goal statement. b. For each metric, document: operational definition, unit of measure, measurement method (manual observation, system extract, stopwatch, instrument), pre-event sampling plan (n ≥ 10 observations or 1 representative event window), post-event sampling plan (same method, same n, collected within 30 days of event end), collection owner, tool, and storage location. c. If measurement is subjective or manual, run a quick 3-appraiser MSA (#31 pattern, compressed to 1 hour) on 5 samples before collecting pre-event baseline. d. Execute pre-event collection on Day 1 of the event; lock the dataset before any improvements are made. e. Schedule post-event collection on the calendar for event end + 30 days; owner receives the reminder. f. Store DCP alongside the Kaizen Charter; feed pre/post data into the Results Narrative (#49). |

### C.6 Activity #49 — Kaizen Project Results Narrative 3 Pager (2.0h) ✓ Approved

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

### D.1 Activity #30 — DMAIC Process Capability Report (1.0h) ✓ Approved

| Field | Proposed default |
|---|---|
| Cadence | Event-driven (DMAIC Measure, revisit in Control) |
| Inputs | Baseline data (#28), USL / LSL from CTQ definition |
| Output | Capability Report: Cp, Cpk, Pp, Ppk, DPMO, process sigma |
| Participants | Project Lead |
| Trigger | Baseline data locked |
| Procedure | a. Verify data normality (histogram, normal-probability plot, Anderson-Darling). If non-normal, transform or use non-parametric method. b. Define spec limits (USL / LSL) from CTQ or customer requirement. c. Calculate short-term capability: Cp = (USL − LSL) / 6σ̂, Cpk = min((USL − μ) / 3σ̂, (μ − LSL) / 3σ̂). d. Calculate long-term performance: Pp, Ppk using overall standard deviation. e. Compute DPMO and process sigma. f. Document in Capability Report template; flag if Cpk < 1.33. |

### D.2 Activity #31 — DMAIC MSA Report (3.0h) ✓ Approved

| Field | Proposed default |
|---|---|
| Cadence | Event-driven (DMAIC Measure, before Baseline #28) |
| Inputs | Measurement system definition, 10 representative samples, 2–3 trained appraisers |
| Output | MSA Report with Gage R&R results and accept/reject decision |
| Participants | Project Lead + 2–3 appraisers |
| Trigger | Output DCP drafted; before locking |
| Procedure | a. Select 10 samples that cover the expected process range. b. Have 2–3 appraisers measure each sample 2–3 times in randomized order. c. Compute Gage R&R: repeatability (equipment variation) and reproducibility (appraiser variation). d. Acceptance: %R&R < 10% excellent, 10–30% marginal (acceptable if cost-justified), > 30% unacceptable. e. If unacceptable, fix the measurement system (retrain, recalibrate, redefine operational definition) and re-run MSA before proceeding. f. Document results and decision. |

### D.3 Activity #33 — DMAIC Quick Win Improvements (20.0h) ✓ Approved

| Field | Proposed default |
|---|---|
| Cadence | Event-driven (DMAIC Analyze → Improve; can fire any time during project) |
| Inputs | Process Maps (#32), VOC insights (#26), team observations |
| Output | Implemented quick-win changes with before / after measurements |
| Participants | Project Lead + Team + Process Owner |
| Trigger | Quick-win candidate identified (lead time < 1 week, cost < $1K, effort < 2 person-days) |
| Procedure | a. Candidate filter: lead time < 1 week AND cost < $1K AND effort < 2 person-days AND reversible. b. Get Process Owner approval (verbal is fine if reversible). c. Implement change. d. Measure impact on primary metric before and after (min 5 observations each side). e. Log in Quick Wins log: name, hypothesis, before / after, decision (keep / revert). f. Feed kept wins into Improvement Backlog (#38) for scaling; log reverted ones as learnings. |

### D.4 Activity #35 — DMAIC Inputs Data Collection Plan (8.0h) ✓ Approved (v0.2 — shorthand expanded)

| Field | Proposed default |
|---|---|
| Cadence | Event-driven (DMAIC Analyze phase) |
| Inputs | Cause & Effect Matrix (#34), prioritized input variables (X's) |
| Output | Input DCP filled (one row per prioritized X) |
| Participants | Project Lead + Team |
| Trigger | Post-C&E Matrix, before Correlation / Regression (#36) |
| Procedure | a. Take the top-scored X variables from the C&E Matrix (#34) — typically the 4–6 inputs with the highest Y-impact scores. b. For each prioritized X, document: operational definition, unit of measure, measurement method (manual / instrument / extract / observational), sampling plan (n ≥ 30 paired X-Y observations, frequency, stratification rules), collection owner, tool, and data storage location. c. For each X-Y pair, confirm the time-stamp key that joins the X observation to its corresponding Y observation. d. If any X is measured by a subjective or manual method, run MSA (#31) for that X before locking. e. Pilot the Input DCP for one cycle (typically 1 week) to catch ambiguity in the operational definition; fix and re-pilot if n < 80% of plan. f. Lock the Input DCP. g. Execute for a minimum of 30 paired X-Y observations; store the joined dataset for Correlation and Regression (#36). |

### D.5 Activity #36 — DMAIC Correlation and Regression (3.0h) ✓ Approved

| Field | Proposed default |
|---|---|
| Cadence | Event-driven (DMAIC Analyze phase) |
| Inputs | Input DCP data (#35), Output DCP data (#22) |
| Output | Correlation matrix + regression model with R², p-values, residual diagnostics |
| Participants | Project Lead + (optional) Analytics partner |
| Trigger | Input DCP data collected (min 30 paired observations) |
| Procedure | a. Load paired X (input) and Y (output) data. b. Run pairwise correlation matrix; note |r| > 0.4 for potential drivers. c. Fit regression: start with simple linear per significant X, escalate to multiple regression or non-linear as diagnostics warrant. d. Check R² (> 0.7 strong), p-values (< 0.05 significant), residual plots (homoscedasticity, normality, no pattern). e. Identify the vital few X's (Pareto principle — typically 2–3 X's explain most of Y variation). f. Document model, vital X's, and leverage points in Correlation & Regression report. g. Feed vital X's into FMEA (#37) and Improve phase. |

### D.6 Activity #38 — DMAIC Process Improvement Backlog (1.0h) ✓ Approved

| Field | Proposed default |
|---|---|
| Cadence | Sprint (living artifact, refined each sprint boundary) |
| Inputs | FMEA recommended actions (#37), Quick Wins pending (#33), VOC gaps (#26), retrospective action items |
| Output | Prioritized Improvement Backlog (name, description, Day-2-Done criteria, effort, impact, priority score) |
| Participants | Project Lead + Process Owner |
| Trigger | Post-FMEA or at each sprint boundary |
| Procedure | a. Aggregate all improvement candidates from FMEA (#37), Quick Wins pending (#33), VOC gaps (#26), and retro action items. b. For each item: name, one-sentence description, Day-2-Done criteria (observable acceptance), effort estimate (hours or t-shirt size), impact estimate on primary metric. c. Score priority (RICE, WSJF, or simple Impact × Confidence ÷ Effort). d. Publish prioritized list to Sprint Planning (#Sprint Planning) for Process Owner selection. e. Carry unfinished items to next sprint. |

### D.7 Activity #41 — DMAIC Project Results Narrative Document (4.0h) ✓ Approved

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

## F. Coordinator-Approved Decisions (2026-04-19)

Decisions locked by coordinator ruling on 2026-04-19. **Do not re-open.** Each decision has a one-line rationale.

| # | Question | Decision | Rationale |
|---|---|---|---|
| Q1 | **Activity #17 — reserved, or new Communications activity?** | **RESERVED.** Catalog seed = **49 numbered items**; #17 is a reserved slot with no row. Do not invent a Communications activity. | The BAM source (`docs/Business Agility Standard Work.txt`) intentionally skipped #17; inventing a new activity would depart from canonical source. |
| Q2 | **Durations for #19 / Quarterly Planning / #20?** | **ACCEPT** 2.0h / 4.0h / 2.0h. | Durations align with BAM siblings (#18 = 2h; BAM Way Ch. 5 quarter kickoff = half-day; Sprint Planning = 2h). |
| Q3 | **DMAIC "Asana Module?" rows (#23, #24, #25) — inline procedures or external Asana links?** | **ACCEPT inline procedures** in §B.1–B.3. MVP is standalone; no external Asana Module dependency. | Customer environments may not have the referenced Asana modules; MVP ships self-contained procedures. |
| Q4 | **BAM Way Ch. 14 role-based standard work — merge into catalog now?** | **DEFER to Next.** Not needed for MVP seed. | Role-overlay layer is additive; MVP can ship the 49-row catalog + 31 Accelerator entries without it. |
| Q5 | **Bulk-fill metadata rules in §E — accept for MVP?** | **ACCEPT as MVP default.** Iterate in-product based on first-user feedback. | Per-row Phil review of all 50 rows would delay seed; rule-based defaults are reversible. |
| Q6 | **External template links ("Writing Hub", "Benefits Translator SOP", "16 Step Process", "Quip Template")?** | **DEPRECATE in MVP.** Ship own inline procedures. | MVP is standalone; external links create brittle dependencies and break in customer environments. |

### F.1 Impact on §A–§D

All §A.2–A.4, §B, §C, §D procedures above are now marked **✓ Approved** and are ready for seed. Two entries were expanded in v0.2 to remove shorthand references:

- **§C.5 Activity #43 Kaizen DCP** — was "Same as #22"; expanded to 6 explicit steps scoped to the Kaizen event window.
- **§D.4 Activity #35 Inputs DCP** — was "Same structure as Output DCP (#22)"; expanded to 7 explicit steps for X-variable collection with MSA gate.

One entry was polished for clarity:
- **§B.2 Activity #24 Communication Plan** — expanded from 3 to 5 steps; added explicit stakeholder-matrix copy step and Retrospective refresh cadence.

All other §A–§D procedures were left as-is; they were already complete and usable.

---

## G. Handoff

**Status (2026-04-19):** §A–§D procedures are **APPROVED and ready for seed**. §F open questions **RESOLVED** (see §F table above). The build-start blocker for `DELIVERY_PLAN.md` **E2-T1 is RESOLVED**; Sprint 1 may proceed.

- **Ready for seed now:** the ~23 rows with content gaps (§A.2, §A.3, §A.4, §B.1–B.6, §C.1–C.6, §D.1–D.7) and the bulk-fill metadata rules in §E apply to all 49 rows. The catalog seed passes downstream to `system-architect` (defines the Catalog Entry entity) and `backend-engineer` (ships the seed migration).
- **§I 30-Day Accelerator procedures:** see `PROJECT_TYPE_30D_KAIZEN.md §3` for the 31 Accelerator entries, now at v0.2 and authored to Black-Belt standard. Phil review is requested on §3 content; treated as locked for E13-T1 unless Phil redlines.
- **Out of scope here:** the four BAM ceremonies that already have full procedures in the source (Sprint Planning, Daily Standup, Sprint Review, Sprint Retrospective) only need the §E metadata fields appended — no procedure work required.
- **Future rework path:** if any approved procedure needs revision post-seed, mark edits inline in this file and bump the row's version; catalog supports in-product refinement.

---

## H. Bucket Mapping (APPROVED — seed data)

Each catalog entry is assigned exactly one bucket for the 4-2-2 Daily cycle: **PROJECT** (Deep Work, 4h), **COMMUNICATION** (2h), or **CI** (2h). The composer uses this field to decide which bucket an activity counts against when proposing a Daily cycle. Bucket is frozen on `ScheduledActivity` at schedule time (see `ARCHITECTURE.md` §2.2, §2.4).

Approved 2026-04-18 by Phil. Changes from initial proposal: #13 6S Email moved from COMMUNICATION → CI.

**Note on DAG edges.** The `CatalogEntry.dependsOn` DAG edges for DMAIC (`#20`–`#41`) are in §J; the phase-bindings for Kaizen 90 (`#42`–`#50`) are in §K. Bucket assignment in §H.1 and DAG edges in §J / phase-bindings in §K are independent orthogonal data layers on the catalog entry — a single row has both a bucket AND (optionally) `dependsOn` edges AND (optionally) `projectTypeBinding` + `phaseBinding`.

### H.1 Mapping table

| # | Activity | Bucket | Notes |
|---|---|---|---|
| 1 | Personal Learning & Development | CI | |
| 2 | Team Learning & Development | CI | |
| 3 | Company Compliance Training | CI | |
| 4 | Document Review (PRFAQ / MBR / 6 Pager) | COMMUNICATION | Reading to respond counts as comms work |
| 5 | Team Introductions & Engagements | COMMUNICATION | |
| 6 | Innovation — Explore Opportunities | CI | |
| 7 | Innovation — Evaluate Opportunity | PROJECT | |
| 8 | Innovation — PRFAQ | PROJECT | |
| 9 | Innovation — Proof of Concept / Prototype | PROJECT | |
| 10 | Innovation — Product Assessment | PROJECT | |
| 11 | Innovation — Initiate New Product / Program | PROJECT | |
| 12 | PDCA Cycle | CI | |
| 13 | 6S Email Activity | **CI** | Lean 6S inbox hygiene practice |
| 14 | High-value Communication Time-blocking | COMMUNICATION | |
| 15 | High-value team & project meetings | COMMUNICATION | |
| 16 | Connecting with other teammates (1:1s) | COMMUNICATION | |
| 17 | RESERVED | — | No row in source |
| 18 | Document Writing | PROJECT | Focused writing is Deep Work |
| 19 | Refining Program Plan | PROJECT | |
| — | Quarterly Planning | COMMUNICATION | Team ceremony |
| — | Sprint Planning | COMMUNICATION | Team ceremony |
| — | Daily Standup | COMMUNICATION | Team ceremony |
| — | Mid-Sprint Review | COMMUNICATION | Team ceremony |
| — | Sprint Review | COMMUNICATION | Team ceremony |
| — | Sprint Retrospective | COMMUNICATION | Team ceremony |
| 20–41 | All DMAIC Project Work | PROJECT | Fills Deep blocks as sprint payload when an active DMAIC project is the user's Kaizen payload |
| 42–50 | All Kaizen Project Work | PROJECT | Fills Deep blocks during Kaizen event windows |

### H.2 Generic catalog entries (seeded alongside the 50 source rows)

These are not in `Business Agility Standard Work.txt` but are required for the composer to have something to schedule when no named activity fills a block.

| Activity | Bucket | Duration | Purpose |
|---|---|---|---|
| Deep Work — Project Task (generic) | PROJECT | variable (up to 240 min / day) | Ad-hoc project work when no DMAIC / Kaizen payload is active |
| Value-Added Communication (generic) | COMMUNICATION | variable | Ad-hoc comms not covered by a named ceremony or #14–#16 |
| End-of-Activity Reflection | CI | 60 sec | Fires at close of every Scheduled Activity; feeds Friction Signal queue |
| Weekly Reflection (20-min DMAIC) | CI | 20 min | Fri afternoon anchor; promotes at most one Kaizen candidate from the week's evidence |

### H.3 Team-ceremony placement in single-user MVP

Team ceremonies (Sprint Planning, Daily Standup, Mid-Sprint Review, Sprint Review, Sprint Retrospective, Quarterly Planning) remain in the catalog and can be scheduled on the individual user's calendar in single-user MVP. They are placed manually on the correct sprint day by the user (or auto-placed by the Weekly composer at sprint boundaries — see `ARCHITECTURE.md` §4). They consume COMMUNICATION bucket time on the days they fire. True multi-participant team mode (shared Sprint Backlog, team adherence view) ships in Next per blueprint §5.2.

---

## I. 30-Day Kaizen Accelerator Catalog Entries

**Status:** 31 new catalog entries bound to `projectTypeBinding='KAIZEN_ACCELERATOR_30D'`, `focusArea='KAIZEN_ACCELERATOR_30D'`. Authoritative source for the full specs (inputs, output artifact schema, participants, procedure steps, `dependsOn` edges, duration, cadence, trigger): **`PROJECT_TYPE_30D_KAIZEN.md §3`**.

Each entry is also bound to a phase (`phaseBinding='PHASE_0'|'PHASE_1'|'PHASE_2'|'PHASE_3'|'PHASE_4'`) and is only eligible as Deep-block payload while `Kaizen.phase === entry.phaseBinding` (see `ARCHITECTURE.md §2.2` invariants and `ENGINE_DESIGN.md §4.2`).

### I.1 Compact summary — 31 entries

| Task # | Name | Phase | Bucket | Duration (min) | isNonOptional |
|---|---|---|---|---|---|
| 0.1 | Identify Candidate Process | PHASE_0 | COMMUNICATION | 60 | false |
| 0.2 | Define Project Scope | PHASE_0 | PROJECT | 90 | false |
| 0.3 | Define Problem Statement | PHASE_0 | PROJECT | 60 | false |
| 0.4 | Define Success Metrics | PHASE_0 | PROJECT | 60 | false |
| 0.5 | Identify Stakeholders + Team | PHASE_0 | COMMUNICATION | 60 | false |
| 0.6 | Approve Project Charter | PHASE_0 | COMMUNICATION | 60 | **true** (phase gate) |
| 1.1 | Collect Workflow Data | PHASE_1 | PROJECT | 240 | false |
| 1.2 | Build Current-State Process Map | PHASE_1 | PROJECT | 180 | false |
| 1.3 | Define Activity-Level Metrics | PHASE_1 | PROJECT | 120 | false |
| 1.4 | Identify Waste (TIMWOODS) | PHASE_1 | PROJECT | 120 | false |
| 1.5 | Generate Current-State SOPs | PHASE_1 | PROJECT | 180 | false |
| 1.6 | Validate Baseline with Stakeholders | PHASE_1 | COMMUNICATION | 60 | **true** (phase gate) |
| 2.1 | Prepare Kaizen Event | PHASE_2 | COMMUNICATION | 60 | false |
| 2.2 | Review Current State | PHASE_2 | COMMUNICATION | 120 | false |
| 2.3 | Perform Root Cause Analysis | PHASE_2 | PROJECT | 180 | false |
| 2.4 | Design Future-State Workflow | PHASE_2 | PROJECT | 180 | false |
| 2.5 | Define Improvements | PHASE_2 | PROJECT | 120 | false |
| 2.6 | Create Implementation Backlog | PHASE_2 | PROJECT | 120 | **true** (phase gate) |
| 2.7 | Define Future-State SOPs | PHASE_2 | PROJECT | 180 | **true** (phase gate) |
| 3.1 | Assign Ownership | PHASE_3 | COMMUNICATION | 60 | **true** (phase gate) |
| 3.2 | Schedule Work Blocks | PHASE_3 | COMMUNICATION | 60 | false |
| 3.3 | Execute Improvements | PHASE_3 | PROJECT | 240 | false |
| 3.4 | Track Progress Daily | PHASE_3 | CI | 15 | false |
| 3.5 | Resolve Blockers | PHASE_3 | COMMUNICATION | 60 | false |
| 3.6 | Update SOPs in Real-Time | PHASE_3 | CI | 30 | **true** (phase gate) |
| 4.1 | Rebaseline Workflow | PHASE_4 | PROJECT | 180 | **true** (phase gate) |
| 4.2 | Compare Before vs After | PHASE_4 | PROJECT | 90 | false |
| 4.3 | Calculate Financial Impact | PHASE_4 | PROJECT | 120 | **true** (phase gate — writes ROI) |
| 4.4 | Validate Results with Stakeholders | PHASE_4 | COMMUNICATION | 60 | **true** (phase gate) |
| 4.5 | Create Control Plan | PHASE_4 | PROJECT | 120 | **true** (phase gate) |
| 4.6 | Final Report | PHASE_4 | PROJECT | 180 | **true** (phase gate) |

Bucket mapping follows §H rules: stakeholder conversations / approvals → `COMMUNICATION`; analytical / authoring / execution work → `PROJECT`; tracking / adjustment / reflection → `CI`.

### I.2 Authoring backlog — PENDING procedure-text authoring (blocker for E13-T1)

**Same blocker class as §F question 3** (DMAIC "Asana Module?" rows needed inline procedures). The 31 Accelerator entries all have a proposed procedure in `PROJECT_TYPE_30D_KAIZEN.md §3`, but those drafts need black-belt review and sign-off before they are seeded into the live catalog.

- **Missing field:** `procedure` (ordered step list, a / b / c …) — the drafts in `PROJECT_TYPE_30D_KAIZEN.md §3` are the starting point; each needs Phil / Black-Belt partner review, tightening for the operational definition, and sign-off.
- **Owner:** Phil / Black-Belt partner.
- **Scope:** All 31 entries above. No other field blocks seed; the spec fully specifies `inputs`, `outputArtifact`, `participants`, `trigger`, `dependsOn`, `projectTypeBinding`, `phaseBinding`, `isNonOptional`, `bucket`, `defaultDurationMinutes`, and `cadence`.
- **Blocker target:** Must resolve **before `DELIVERY_PLAN.md` E13-T1** ("Seed 31 Accelerator catalog entries") begins. Tracked as `DELIVERY_PLAN §5 R13` with a dedicated authoring sprint before E13 starts; fallback is placeholder procedure text with a "DRAFT" flag in-product if unresolved.

**Cross-reference to §J.** The 31 Accelerator entries use `30d_*` IDs, not `#20`–`#41`, so they do NOT overlap with the DMAIC DAG edges documented in §J. Accelerator entries' `dependsOn` edges are phase-internal (each phase has its own mini-DAG ending at the phase gate) and fully specified in `PROJECT_TYPE_30D_KAIZEN.md §3`. The DAG-validator (`CatalogService.validateDag()`) runs across the full catalog — DMAIC + Accelerator + Kaizen 90 — in a single pass and rejects cross-project cycles.

### I.3 Cadence inference rule addition

Append to §E.1 rule-table (implicitly): **"30-Day Accelerator step gated by prior step completion → Event-driven within Accelerator phase"** applies to all 31 entries (same pattern as DMAIC #20–#41 under `Event-driven within DMAIC project phase`). Daily-cadenced exception: `30d_3_4_track_progress_daily` fires once per day during Phase 3 (CI bucket, 15 min).

---

## J. DMAIC DAG edges — authoritative spec

**Status (v0.3):** authoritative. Derived from `DMAIC_STANDARD §11.2` item 7 and the refinements in `DMAIC_STANDARD §1.5`. Each row below specifies the `CatalogEntry.dependsOn` array that the seed data must carry for catalog entries `#20`–`#41`. Validator: `CatalogService.validateDag()` runs on seed and any catalog edit; cycle-free.

**Key refinement edges** (called out explicitly):
- **`#28` Baseline `dependsOn [#22, #31]`** — MSA-before-Baseline. Enforced in addition via `ActivityService.close()` checking MSA artifact's `acceptanceRating` field (per `DMAIC_STANDARD §1.5` refinement #1).
- **`#33` Quick Wins `dependsOn [#22, #36]`** — no quick wins until Baseline AND validated causes (per `DMAIC_STANDARD §1.5` refinement #2 + §11.5 item 1). Tighter than the current `§D.3` cadence text which permits Quick Wins earlier — coordinator-approved tightening.
- **`#39` Financial Benefit Translator two-pass** — `#39` is scheduled twice in a DMAIC project: once after Improve-phase backlog closes (`passNumber=1`, projected), once after Control-phase implementation + remeasurement (`passNumber=2`, actual). Seeded as a single catalog entry; the engine schedules two `ScheduledActivity` rows with distinct `linkedDmaicStepRef.passNumber`. Per `DMAIC_STANDARD §1.5` refinement #4 + §11.5 item 2.

### J.1 Edge table (all 22 DMAIC entries)

| Catalog entry | `dependsOn` | Rationale |
|---|---|---|
| `#20 DMAIC Project Charter` | `[]` | Entry point of DMAIC phase walk |
| `#21 DMAIC SIPOC` | `[#20]` | SIPOC requires Charter scope |
| `#22 Output DCP` | `[#21, #26]` | DCP needs process boundaries (SIPOC) + CTQ output metrics (VOC) |
| `#23 Stakeholder Analysis` | `[#20]` | Stakeholder map built from Charter's named roles |
| `#24 Communication Plan` | `[#23]` | Comm plan rows are per stakeholder from #23 |
| `#25 Risk Plan` | `[#20, #21]` | Risk register needs scope (Charter) + process steps (SIPOC) |
| `#26 VOC/VOB/VOA` | `[#23]` | Requires stakeholder list to know whom to interview |
| `#27 Continuous Reporting Framework` | `[#28]` | Reporting dashboard needs a Baseline data source |
| `#28 Baseline Output Performance Data` | `[#22, #31]` | **MSA-before-Baseline** — requires DCP locked + MSA closed with acceptable rating. Per `DMAIC_STANDARD §1.5` refinement #1. |
| `#29 Control Chart (baseline)` | `[#28]` | Control Chart built on Baseline data |
| `#30 Capability Report (baseline)` | `[#28]` | Capability needs Baseline stats |
| `#31 MSA Report` | `[#22]` | MSA requires operational definition from DCP; runs against DCP's measurement method |
| `#32 Process Maps` | `[#21]` | Detailed maps expand the SIPOC's high-level steps |
| `#33 Quick Win Improvements` | `[#22, #36]` | **Quick Wins gated on Baseline + validated causes** — no solution leakage during Measure. Per `DMAIC_STANDARD §1.5` refinement #2 + §11.5 item 1. |
| `#34 C&E Matrix` | `[#26, #32]` | C&E rows: Y's from VOC/CTQ × X's from process maps |
| `#35 Inputs DCP` | `[#34]` | Collect data on the prioritized X's from C&E |
| `#36 Correlation & Regression` | `[#35]` | Requires paired X-Y data from Input DCP |
| `#37 FMEA` | `[#34, #36]` | FMEA over C&E-identified failure modes with validated-cause evidence |
| `#38 Improvement Backlog` | `[#37]` | Backlog items derive from FMEA recommended actions |
| `#39 Financial Benefit Translator (pass 1 — projected)` | `[#38, #33]` | Projected benefit after backlog authored + quick wins measured |
| `#40 Implemented Improvements` | `[#38]` | Implement items from the authored backlog |
| `#39 Financial Benefit Translator (pass 2 — actual)` | `[#40, #29-post, #30-post]` | Actual benefit after implementation + post-Control Chart + post-Capability. `#29-post` and `#30-post` are the Control-phase re-runs of the Baseline chart/capability reports (same catalog ID, different `ScheduledActivity` rows, differentiated by `linkedDmaicStepRef.kind='POST'`). |
| `#41 Project Results Narrative` | `[#40, #29-post, #30-post, #39-pass2]` | Narrative requires implementation done + post-improvement control evidence + actual ROI signed |

**Two-pass `#39` implementation note.** The engine treats `#39` as a single `CatalogEntry` seed row. The DMAIC composer schedules two `ScheduledActivity` instances of it during project lifetime: pass 1 is scheduled after `#38` and `#33` close; pass 2 is scheduled after `#40` + post-Control-Chart `#29` + post-Capability `#30` close. Both `ScheduledActivity` rows carry `linkedDmaicStepRef: { kaizenId, catalogEntryId: '#39', passNumber: 1 | 2 }`. The close of each pass appends a row to `Kaizen.roiProjections[]` (per `ARCHITECTURE §2.9`); pass 2's close computes `reconciliationDeltaPercent` and flags if > 30%.

**Post-Control-phase `#29` / `#30`.** Similar pattern: Control Chart and Capability Report are scheduled TWICE — once at Baseline (Measure phase) and once post-improvement (Control phase). Differentiated by `linkedDmaicStepRef.kind ∈ {'BASELINE', 'POST'}`. No catalog-row duplication; composer schedules two instances.

### J.2 DAG validation responsibilities

- **`CatalogService.seed()`** — validates DAG on initial seed. Rejects cycles. Rejects unresolvable `dependsOn` references (entry id not in catalog).
- **`CatalogService.edit()`** — re-validates on any `dependsOn` mutation.
- **`ComposerService.eligibleDmaicPayloadSteps()`** — reads the DAG at composer time and filters eligible entries to those whose `dependsOn` are all CLOSED in the current Kaizen scope (per `ARCHITECTURE §4.5 R9`).
- **`ActivityService.close()`** — for `#28` close, additionally checks the MSA artifact's `acceptanceRating` field is `ACCEPTABLE` or `MARGINAL_ACCEPTABLE`; rejects close if `UNACCEPTABLE`.

---

## K. Kaizen Event 90-Day (`KAIZEN_EVENT_90D`) — catalog bindings

**Status (v0.3):** authoritative per `KAIZEN_EVENT_STANDARD §11.5` item 9. Catalog `#42`–`#50` (originally authored for the standalone 1–5 day `KAIZEN_EVENT` project type in §B.5, §C.5, §C.6, and §B.6) are additionally bound to the phased 90-day variant `KAIZEN_EVENT_90D` with `phaseBinding` values mapping to the 4 macro-phases from `KAIZEN_EVENT_STANDARD §2`.

**Binding model (per `ARCHITECTURE §2.2`):** `CatalogEntry.projectTypeBinding` is a string[] for `#42`–`#50` — both `'KAIZEN_EVENT'` (standalone) AND `'KAIZEN_EVENT_90D'` (90-day phased) are present. `CatalogEntry.phaseBinding` is set per the table below for `KAIZEN_EVENT_90D` semantics; `phaseBinding` is ignored when the active Kaizen's `projectType === 'KAIZEN_EVENT'` (standalone mode has no phase).

### K.1 Kaizen 90 catalog binding table

| Catalog entry | `projectTypeBinding` | `phaseBinding` for `KAIZEN_EVENT_90D` | Notes |
|---|---|---|---|
| `#42 Kaizen Charter` | `['KAIZEN_EVENT', 'KAIZEN_EVENT_90D']` | `PRE_EVENT` | Charter authoring sub-phase 03 |
| `#43 Kaizen Output DCP` | `['KAIZEN_EVENT', 'KAIZEN_EVENT_90D']` | `PRE_EVENT` | Baseline data-capture plan sub-phase 06 |
| `#44 Event Scheduling` | `['KAIZEN_EVENT', 'KAIZEN_EVENT_90D']` | `PRE_EVENT` | Kaizen Week scheduling sub-phase 08. Works for Kaizen 90 without structural change (still scheduling 5 consecutive days), but the 5 days fall inside the 90-day window vs. being the entire project. Per `KAIZEN_EVENT_STANDARD §11.5` item 3. |
| `#45 Event SIPOC` | `['KAIZEN_EVENT', 'KAIZEN_EVENT_90D']` | `EVENT` | Kaizen Week Day 1 current-state review |
| `#46 Prioritized Inputs` | `['KAIZEN_EVENT', 'KAIZEN_EVENT_90D']` | `EVENT` | Kaizen Week root-cause analysis |
| `#47 FMEA` | `['KAIZEN_EVENT', 'KAIZEN_EVENT_90D']` | `EVENT` | Kaizen Week failure-mode analysis |
| `#48 Implemented Improvements` | `['KAIZEN_EVENT', 'KAIZEN_EVENT_90D']` | `POST_EVENT` | **Kaizen 90 duration semantics differ**: the 23-hour catalog `defaultDurationMinutes` is now the *per-major-backlog-item indicative duration*, NOT the total implementation time. For `KAIZEN_EVENT_90D`, `#48` spans Days 20–70 and totals ~600 person-hours across the team; the engine schedules multiple `#48` instances (one per backlog item) each with its own indicative duration. Per `KAIZEN_EVENT_STANDARD §11.5` item 4. |
| `#49 Results Narrative 3-Pager` | `['KAIZEN_EVENT', 'KAIZEN_EVENT_90D']` | `SUSTAIN` | Day 85–90 executive readout |
| `#50 Process Owner Transition` | `['KAIZEN_EVENT', 'KAIZEN_EVENT_90D']` | `SUSTAIN` | Day 85–90 transition to PO; seeds sustainment check-ins per `ARCHITECTURE §2.9` invariants |

**Entries unique to Kaizen 90.** Beyond the 9 catalog anchors, `KAIZEN_EVENT_STANDARD.md` §3 introduces ~73 operational tasks with `kze_preevent_*`, `kze_event_*`, `kze_postevent_*`, `kze_sustain_*` IDs (not catalog-numbered). These are Kaizen-90-specific and bound ONLY to `'KAIZEN_EVENT_90D'`. Seeded in a separate seed migration; not listed here (see `KAIZEN_EVENT_STANDARD §3` for the full list). The nine `#42`–`#50` catalog rows are the public catalog anchors; the `kze_*` tasks are orchestration helpers between anchors.

### K.2 Composer eligibility under set-valued `projectTypeBinding`

The engine's composer `eligibleDmaicPayloadSteps(kaizen, catalog, scheduledActivities)` function resolves `entry.projectTypeBinding` as follows:
- If `typeof entry.projectTypeBinding === 'string'`: check `entry.projectTypeBinding === kaizen.projectType`.
- If `Array.isArray(entry.projectTypeBinding)`: check `entry.projectTypeBinding.includes(kaizen.projectType)`.
- If `entry.projectTypeBinding === null`: entry is cross-project; passes the project-type check unconditionally.

Then applies the `phaseBinding` filter if non-null and the active Kaizen has a non-null `phase`. For `projectType === 'KAIZEN_EVENT'` standalone mode, the phase filter is skipped (standalone mode has no phase). For `projectType === 'KAIZEN_EVENT_90D'`, the phase filter applies per the K.1 table.

### K.3 Duration note for `#48` on Kaizen 90

Per `KAIZEN_EVENT_STANDARD §11.5` item 4: for `KAIZEN_EVENT_90D` bindings, `#48`'s 23-hour `defaultDurationMinutes` is **per-major-backlog-item indicative**, not the total implementation time. The catalog annotation text (seeded alongside the entry's procedure) must include: *"For `KAIZEN_EVENT_90D` bindings, treat this as per-item indicative duration; total implementation hours per project are much higher (~600 person-hours over Days 20–70) — see `KAIZEN_EVENT_STANDARD.md §2.20`."* No schema change; just a seed-data annotation in the entry's `procedure` or a new `contextNotes` field (coordinator decision: use a note inside `procedure[0]` as the simplest approach; a dedicated `contextNotes` field can be added post-MVP if this becomes a pattern across multiple catalog entries).

### K.4 DAG edges for Kaizen 90

The Kaizen 90 composer applies the same DAG logic as DMAIC: an entry is eligible iff every entry in its `dependsOn` has a CLOSED `ScheduledActivity` in the same Kaizen scope. Kaizen 90's `dependsOn` edges for `#42`–`#50` follow the intuitive Charter → DCP → Event → Implementation → Narrative → Transition order and are authored in `KAIZEN_EVENT_STANDARD §3`. Key edges:
- `#42 Charter dependsOn []` — entry point
- `#43 Output DCP dependsOn [#42]`
- `#44 Event Scheduling dependsOn [#42, #43]` — need Charter + DCP before scheduling event window
- `#45 Event SIPOC dependsOn [#44]` — starts at Event Day 1
- `#46 Prioritized Inputs dependsOn [#45]`
- `#47 FMEA dependsOn [#46]`
- `#48 Implemented Improvements dependsOn [#47]` — backlog items start Day 20
- `#49 Results Narrative dependsOn [#48]` — narrative written at Day 85+
- `#50 Process Owner Transition dependsOn [#49]` — transition on Day 85–90

Plus the many `kze_*` edges detailed in `KAIZEN_EVENT_STANDARD §3`; those are seeded separately but participate in the same DAG.
