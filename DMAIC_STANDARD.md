# CadencePlan DMAIC — Operating Standard

Owner: Master Black Belt / PMO Governance Architect / AI-Native Process Mining Lead
Status: v1.0 — authoritative operating standard for `Kaizen.projectType='DMAIC'` inside CadencePlan.
Scope: Canonical doctrine for planning, staffing, running, validating, and closing a DMAIC project. Black Belts, Master Black Belts, PMOs, operational-excellence teams, and AI agents treat this as authoritative. Ground docs: `ACCELERATOR_STANDARD.md` v1.0, `PROJECT_TYPE_30D_KAIZEN.md` v0.2, `PRODUCT_BLUEPRINT.md` v0.3, `ARCHITECTURE.md` v0.4 (§2.9 Kaizen, §3.3 Kaizen FSM, §4.5 R9 DAG), `ENGINE_DESIGN.md` v0.3 (§4.2 canonical DMAIC project model, `phaseFor()`), `CATALOG_GAPS.md` v0.2 (§A.4, §B.1–B.4, §C.1–C.4, §D.1–D.7 for entries #20–#41), `docs/Business Agility Standard Work.txt` (source for #21 SIPOC, #29 Control Chart, #32 Process Maps, #34 C&E Matrix, #37 FMEA, #40 Implemented Improvements), `UX_FLOWS.md` v0.2.2, `DELIVERY_PLAN.md` v0.2, `AI_AGENTS.md`.

> This is an **operating standard**, not an architectural spec. It decomposes the 22 DMAIC catalog entries (`#20`–`#41`, with `#29`/`#30` reused in Control) into ~88 observable work tasks a Black-Belt-led team executes. It names the artifacts, the owners, the statistical gates, and the failure modes. It does not re-specify the Kaizen FSM or the composer — those remain authoritative in `ARCHITECTURE.md §3.3` and `ENGINE_DESIGN.md §1`, §4.2. DMAIC differs from The Accelerator in three operationally material ways: (1) phase is **derived**, not stored (`phaseFor()` walks closed catalog steps — see `ENGINE_DESIGN.md §4.2`); (2) statistical rigor is mandatory, not optional — Part 6 is the differentiator; (3) duration is multi-sprint (typically 8–20 sprints), not day-boxed.

---

## Part 1 — Executive Validation of DMAIC as a System

### 1.1 Concise project model

A DMAIC project in CadencePlan is a `Kaizen` record with `projectType='DMAIC'` whose payload walks the 22-entry DMAIC catalog (`#20`–`#41`) under a phase-aware DAG. Define → Measure → Analyze → Improve → Control is enforced by `CatalogEntry.dependsOn` edges and the phase-binding filter in `ComposerService.eligibleDmaicPayloadSteps()` (see `ARCHITECTURE.md §2.2` and `ENGINE_DESIGN.md §4.2`). Unlike The Accelerator, **no `Kaizen.phase` field is stored**: the current phase is derived at read-time via `phaseFor(kaizen, catalog, scheduledActivities)` from the highest-activity-number step whose output artifact has been captured. The project's output is not a deck of findings — it is a CLOSED `Kaizen` row with a statistically validated before/after delta (p < 0.05 AND meaningful effect size), a Finance-signed Financial Benefit Translator (`#39`), a signed Control Plan with a live monitoring dashboard, and a Process Owner who now owns sustainment.

The product surfaces DMAIC through the same `KaizenCard` as all other project types, with a DMAIC PhaseStepper rendered from `phaseFor()` output, a DAG-aware next-step suggester in the Daily composer Deep block (`selectDeepPayload`, `ENGINE_DESIGN.md §1.6`), and dedicated statistical-analysis surfaces for MSA (`#31`), Capability (`#30`), Control Chart (`#29`), Correlation/Regression (`#36`), and FMEA (`#37`).

### 1.2 What DMAIC is solving

DMAIC is a multi-sprint problem-solving methodology purpose-built for problems that meet **all** of the following:

1. **High variability** — the output metric exhibits measurable spread (σ > 0), not just a single failed run.
2. **Unknown root cause** — symptoms are visible, but the dominant driver(s) (the "vital few X's") are not yet proven. If the root cause is obvious, DMAIC is overkill.
3. **Data-rich or data-capturable** — baseline collection of n ≥ 30 continuous or n ≥ 100 proportions is feasible within a few sprints without blowing the project timeline.
4. **Cross-functional complexity** — the process crosses ≥ 2 org units, ≥ 2 systems of record, or ≥ 2 SME domains; no single person knows the whole thing.
5. **Chronic, not acute** — the problem persists across quarters, not a one-off incident requiring a correction.

Typical DMAIC problem classes:

| Class | Example | Why DMAIC fits |
|---|---|---|
| Defect-rate reduction | Manufacturing yield; software escape-defect rate; claims rework rate | Capability + Control Chart give baseline; C&E + Regression isolate drivers; pilot + remeasurement close the loop |
| Cycle-time capability | Call-center First-Call Resolution; healthcare throughput; order-to-cash | MSA needed on subjective dispositions; regression finds vital X's (agent tenure, call type, time-of-day) |
| Capability gap | Cpk < 1.33 on a product attribute | Improve drivers until Cpk ≥ 1.33 or world-class ≥ 1.67 |
| Special-cause elimination | Control chart shows recurring out-of-control signals on p-chart | Root cause the special cause, implement permanent countermeasure, verify stability |
| Financial leakage | Billing error rate; invoice exception handling; procurement maverick spend | VOB + VOC drive CTQs; regression finds top leakage drivers; Financial Benefit Translator quantifies recovery |

### 1.3 Where DMAIC succeeds vs fails in practice

| Scenario | DMAIC verdict | Why |
|---|---|---|
| Manufacturing yield on a single line, 6-sigma capable equipment, known spec limits | **Succeeds** — classical DMAIC terrain; rich data; well-defined CTQ | Baseline capability; regression on process parameters; DOE-ready Improve |
| Call-center FCR with 18-month CRM history and named disposition codes | **Succeeds** — data-rich, stratifiable, MSA on dispositions is tractable | CTQ from VOC interviews; X's from agent/type/time; Improve via training + routing |
| Healthcare 30-day readmission rate for a specific DRG | **Succeeds** — defect-rate class; rich coded data; high VOB pressure | Baseline p-chart; drivers via logistic regression; Improve via discharge-planning protocol + Control Chart monitoring |
| Brand-new product with no historical data | **Fails** — no baseline, no capability history; use DfSS or PDCA instead | DMAIC's Measure phase requires n ≥ 30 of existing behavior |
| One-off crisis (contract lost last week) | **Fails** — acute, not chronic; use incident post-mortem + A3 | DMAIC's multi-sprint cadence wastes urgency |
| Single-team workflow problem with clear root cause | **Fails** — use 30-Day Accelerator or Kaizen Event | DMAIC's statistical overhead is wasted when RCA is unnecessary |
| Customer-experience "feeling" problem with no measurable Y | **Fails until CTQ exists** — VOC-first, DMAIC-second | CTQ translation is mandatory before Measure begins |
| Cross-enterprise process owned by nobody | **Fails** — no decision authority means no Improve phase | DMAIC without a named Process Owner dies in Analyze |
| Regulated process where changes require 6-month validation | **Succeeds if scope allows** — Control plan becomes the validation package | DMAIC's rigor maps well to FDA/FAA-style documentation |

### 1.4 Key weaknesses in typical DMAIC implementations

The methodology is sound; execution routinely fails along seven named failure modes:

1. **Analysis paralysis in Analyze.** The team generates every possible X, fits correlations forever, and never commits to "these are the vital few." Symptoms: Analyze phase exceeds 6 sprints; FMEA has 60+ failure modes; no statistically tested root cause by Sprint 10.
2. **Solution leakage in Measure.** A SME proposes "obvious" fixes during Measure; the team starts implementing before baseline is locked. Invalidates the remeasurement (can't tell what moved the needle). Seen as Quick Wins (`#33`) fired before `#28` Baseline is closed.
3. **Control-plan theater.** The Control plan is a PDF filed on a shared drive; nobody reads it; Control Chart runs are plotted monthly-to-nobody; 90 days later, performance reverts and no one notices. Fails every "sustainment at Day 180" audit.
4. **MSA-as-checkbox.** Team runs Gage R&R on 3 samples (too few), passes it with 40 %R&R (unacceptable), and proceeds to Baseline anyway because "we already have the data." Every downstream conclusion is built on a broken measurement system.
5. **P-hacking the Y.** Team tests 15 hypotheses at α=0.05 without Bonferroni or FDR correction; publishes one "significant" finding; conclusion is noise. Common when Analyze uses shotgun correlation matrices without a prior C&E prioritization.
6. **Correlation-as-causation.** "X correlates r=0.62 with Y, therefore improving X will fix Y." Implements, sees no change in Y, project fails. No confirmatory experimental design (DOE) or temporal-precedence check was run.
7. **ROI inflation via soft dollars.** Financial Benefit Translator (`#39`) claims time-savings × fully-loaded rate as Hard benefit without an FTE-release memo or a redeployment plan. Finance eventually discovers it; program credibility collapses.

### 1.5 Improvements to make DMAIC execution-ready in CadencePlan

This standard codifies four concrete refinements to the baseline DMAIC methodology:

1. **Mandatory MSA gate before Baseline lock.** `#31 MSA Report` must be CLOSED with Gage R&R < 30% (marginal) OR Kappa ≥ 0.7 (attribute) before `#28 Baseline Output Performance Data` can be CLOSED. Today's DMAIC frequently skips or rubber-stamps MSA; we enforce via DAG.
2. **Analyze-phase exit requires a *validated* root cause, not a *hypothesized* one.** The `#36 Correlation and Regression` step plus either (a) a designed experiment with controlled levels, or (b) an explicit confound-check table naming alternative explanations and ruling them out, must be CLOSED before Improve eligibility opens. No "we think it's X" passes the gate.
3. **Control plan is authored in Improve (not Control) with live monitoring dashboard spec.** The `#41 Project Results Narrative` step in Control only finalizes + signs the plan; the monitoring dashboard, thresholds, and response playbook are authored during Improve so the Process Owner has time to challenge sustainability design before it is locked.
4. **Financial Benefit Translator runs twice — projected (post-Baseline) and actual (post-Improve remeasurement) — with a reconciliation delta reported.** Single-pass ROI is the #1 source of inflated claims. Two-pass ROI with a named reconciliation forces the team to explain any gap between projection and reality.

### 1.6 Critical success factors (8)

1. **Black Belt lead has certification + at least one prior completed DMAIC.** DMAIC is not a first-project methodology.
2. **Master Black Belt peer-reviewer is named at kickoff and reviews MSA, Regression, FMEA, and Control Plan.** Four named review gates, not "available on request."
3. **Executive Sponsor named with authority over the full scope** (all org units the process crosses) and committed to 2–4 h/month, including phase-gate attendance.
4. **Process Owner committed through sustainment.** PO must attend Define kickoff, Analyze root-cause review, Improve pilot approval, and Control plan sign-off — four non-negotiable touchpoints.
5. **Finance partner named at Measure, not Control.** Finance co-signs Baseline cost basis (on `#28`), the projected benefit on `#39` pass 1, and actual benefit on `#39` pass 2. Late-Finance = ROI dispute at close.
6. **Data-access pre-work completed before Measure starts.** If queries/extracts/observations require new IT tickets, open them in Define. Measure phase cannot start on a data-access blocker.
7. **Statistical tooling decided at kickoff.** Minitab, JMP, R, or Python is acceptable; Excel-only is not (no capability indices, no MSA, no regression diagnostics worth trusting). The Black Belt picks one and sticks with it through Control.
8. **Sprint cadence is respected.** DMAIC runs in 2-week sprints with phase-gate reviews at sprint boundaries. No sprint-skipping; no indefinite Analyze.

### 1.7 Failure modes and prevention mechanisms (7)

| # | Failure mode | Prevention control |
|---|---|---|
| 1 | **Baseline locked on unreliable measurement system.** `#28` closes with Gage R&R > 30% or Kappa < 0.6; every downstream conclusion is noise. | Named control: `#28` has `dependsOn: [#31 MSA Report]`; MSA acceptance criteria (§6.2 of this doc) enforced by `ActivityService.close()` refusing the close on unacceptable R&R. |
| 2 | **Improve before Analyze completes.** Quick Wins fired on a hypothesized root cause; no before/after proof against a validated X. | Named control: `#33 Quick Wins`, `#38 Backlog`, `#40 Implemented Improvements` all have `dependsOn: [#36 Correlation/Regression, #37 FMEA]` — composer refuses to schedule Improve-phase Deep payload until Analyze phase artifacts are CLOSED. |
| 3 | **Scope creep during Measure.** Team discovers upstream issues; expands scope; baseline becomes stale. | Named control: Scope-change event (analog to Accelerator `acc_gl_04`) forces either scope-boundary reaffirmation or Kaizen abandonment with a new `Kaizen` opened. Silent scope rotation is prohibited. |
| 4 | **P-hacking / multiple-comparisons abuse.** Team runs 15 tests, claims the one with p < 0.05 as "root cause." | Named control: `#36` procedure (Part 6.4 of this doc) requires pre-declared hypothesis list OR Bonferroni/FDR correction applied and logged. MBB peer-review gate verifies. |
| 5 | **Remeasurement uses different method than Baseline.** Apparent improvement is measurement-system artifact, not real. | Named control: reused `#28`-method for post-improvement remeasurement carries the same operational definition, sample method, exclusion rule. Artifact comparison report (Part 4.A12 of this doc) captures method-parity attestation. |
| 6 | **Control plan = document, not system.** Plan filed, dashboard never built, no one looks. | Named control: `#41 Results Narrative` close-gate requires the Control Chart (`#29`) running as a scheduled live dashboard with named PO-owner and 30/60/90 check-in calendar holds. Paper plan is insufficient. |
| 7 | **ROI inflation via soft dollars.** `#39` claims time-savings × rate; no FTE-release; Finance never signs. | Named control: two-pass `#39` (projected + actual); Hard/Soft/Cost-Avoidance classification mandatory on every benefit line; Finance signature required on both passes; negative-reconciliation triggers MBB review. |

### 1.8 When NOT to use DMAIC — decision tree vs. The Accelerator, Kaizen Event, and PDCA

DMAIC is the most rigorous and most expensive project type in CadencePlan. Use it only when the problem demands it. Decision criteria:

```
                          START
                            │
                ┌───────────┴────────────┐
                │  Root cause known?     │
                └───────────┬────────────┘
                            │
                ┌───────YES──┴──NO───────┐
                │                         │
                v                         v
    ┌─────────────────────┐    ┌──────────────────────┐
    │ Is solution scope   │    │ Is problem chronic   │
    │ known + bounded?    │    │ AND data-rich?       │
    └─────────┬───────────┘    └──────────┬───────────┘
              │                            │
       ┌──YES─┴──NO──┐              ┌─YES──┴──NO──┐
       │             │              │             │
       v             v              v             v
   ┌───────┐   ┌──────────┐   ┌─────────┐   ┌─────────┐
   │ PDCA  │   │ KAIZEN   │   │ DMAIC   │   │ KAIZEN  │
   │(48h)  │   │ EVENT    │   │(8-20    │   │ EVENT   │
   │       │   │(3-5 days)│   │ sprints)│   │(3-5 days│
   └───────┘   └──────────┘   └─────────┘   │ + PDCA  │
                                             │ for     │
                                             │ hypoth- │
                                             │ eses)   │
                                             └─────────┘

   If SECOND decision is NO+NO (acute + thin data):
       → NOT a CadencePlan project; use incident post-mortem / A3
```

**Operational decision criteria table:**

| Project type | Problem class | Duration | Data requirement | Statistical rigor | Typical ROI range |
|---|---|---|---|---|---|
| **PDCA (#12)** | Personal or tiny-team experiment; single variable; 48h cycle | 48 hours per cycle; 3 consecutive target hits to graduate | n ≥ 1 measurement per tick | None required (is-it-better judgment) | $0 (learning vehicle) |
| **Kaizen Event (#42–#50)** | Known problem + known scope + 1–5 consecutive days of team attention; tactical burst | 3–5 days event + 30-day sustainment | Pre/post measurement; compressed MSA (1h); n ≥ 10 | Descriptive stats; before/after comparison | $10K–$250K/year |
| **30-Day Kaizen Accelerator (#30d_*)** | Single named process; 30-day envelope; known or easily-discovered root cause | 30 calendar days / ~22 working days | Baseline n ≥ 30 continuous or 3–5 runs observational; remeasurement matches | Summary stats; Cpk if spec limits; no required hypothesis testing | $50K–$1M/year |
| **DMAIC (#20–#41)** | Multi-org chronic process; unknown root cause; high variability; data-rich | 8–20 sprints / 4–10 months | Baseline n ≥ 30 continuous OR n ≥ 100 proportions; MSA acceptable; X-Y paired ≥ 30 | Hypothesis testing; ANOVA/regression; Capability; Control charts; FMEA | $250K–$10M/year |

**Decision boundaries in practice:**

- **If you can write a solution description in one sentence, it's not DMAIC.** Use Kaizen Event or Accelerator.
- **If the problem affects one team and the measurement system is trustworthy, it's not DMAIC.** Use Kaizen Event.
- **If the problem is personal / individual experiment, it's PDCA.**
- **If the team says "we think we know the root cause, let's just try it," that is a PDCA or Kaizen Event, not DMAIC.** DMAIC's Analyze phase is the justification for the project's expense; skipping it defeats the purpose.
- **If the problem is acute (one incident) and blame is being assigned, DMAIC is the wrong tool.** Run an incident post-mortem; if the same incident class recurs, *then* open a DMAIC on the pattern.
- **If the process has no historical data and no feasible measurement plan, DMAIC's Measure phase will stall.** Either stand up data collection as a pre-DMAIC PDCA, or pick a process with existing data.

**Promotion paths:**

- PDCA → DMAIC: a PDCA experiment whose measurements reveal high variability and unknown root cause can be promoted to DMAIC via Weekly Reflection's Friction Signal pipeline (`ARCHITECTURE.md §6`). The PDCA's measurements seed `#28` Baseline.
- Kaizen Event → DMAIC: if a Kaizen Event's 30-day sustainment shows regression (special-cause reappearing), the remaining pattern is a DMAIC candidate.
- Accelerator → DMAIC: if an Accelerator closes PARTIAL or FAILED_HONEST and Analyze reveals deeper systemic drivers, promote the findings into a new DMAIC Kaizen.

---

## Part 2 — Full DMAIC Lifecycle

The five phases **Define, Measure, Analyze, Improve, Control** are sequenced via `CatalogEntry.dependsOn` edges and the phase-binding filter (`ARCHITECTURE.md §2.2`). Phase is derived, not stored (`ENGINE_DESIGN.md §4.2 phaseFor()`): the current phase is the bucket containing the highest-activity-number closed catalog step with a captured output artifact. No FSM field on `Kaizen` for phase — the engine computes it on read. `ProjectPhaseAdvanced` events are emitted by the composer when `phaseFor()` return value changes between two composition invocations.

### 2.1 Phase 1 — DEFINE

- **Purpose.** Frame the problem, scope it, establish governance, and commit to a measurable CTQ that maps to business value.
- **Business outcome.** Signed Charter; committed team and Sponsor; locked scope; CTQ tree traceable from VOC → CTQ → primary Y metric; risk register live.
- **Entry criteria.** Kaizen promoted with `projectType='DMAIC'`; Black Belt assigned; Sponsor named and reachable.
- **Exit criteria (observable).**
  - `#20 DMAIC Project Charter` CLOSED with Sponsor signature on `outputArtifactRef` (schema=DOCUMENT).
  - `#21 DMAIC SIPOC` CLOSED with ≥5 high-level process steps enumerated and ≥1 of each: Supplier, Input, Output, Customer.
  - `#23 Stakeholder Analysis` CLOSED with 2×2 grid (Influence × Interest) populated.
  - `#24 Communication Plan` CLOSED with recurring calendar holds placed.
  - `#25 Risk and Mitigation Plan` CLOSED with ≥3 risks scored P×I, ≥1 mitigation owner per high risk.
  - `#26 VOC/VOB/VOA Analysis` CLOSED with ≥3 VOC, ≥2 VOB, ≥3 VOA items translated into CTQ requirements.
  - MBB peer-review: Charter signed off.
- **Key decisions.** Scope boundaries (in vs out); primary Y metric selection; Process Owner identification; Sprint-count estimate (typical 8–12 sprints).
- **Required artifacts.** Project Charter (Part 4.A01); SIPOC (A02); Stakeholder Analysis (A03); Communication Plan (A04); Risk Register (A05); VOC/VOB/VOA with CTQ Tree (A06).
- **Required roles.** Black Belt (owner); Sponsor; Process Owner; 2–3 SMEs; MBB (reviewer); Finance partner (cost-basis acknowledgement on primary Y if cost metric).
- **BAM scheduling pattern.** Define runs in Sprints 1–2. Each sprint's Deep Block PROJECT bucket absorbs `#20`, `#21` (Sprint 1), then `#23`, `#24`, `#25`, `#26` (Sprint 2). Communication bucket absorbs stakeholder interviews and Sponsor reviews.
- **Estimated duration.** 1–2 sprints (2–4 weeks elapsed; ~44 person-hours across roster).
- **Capacity assumptions.** Black Belt 12 h/week; Sponsor 2 h total across the phase; Process Owner 6 h total; SMEs 4 h each total; MBB 2 h review.
- **Phase derivation note.** `phaseFor()` returns `'DEFINE'` when the highest-closed step has `activityNumber ≤ 21`. The engine stops returning DEFINE as soon as any step in the `#22`–`#30` range closes (transition to MEASURE). No stored `Kaizen.phase` field — see `ENGINE_DESIGN.md §4.2`.

### 2.2 Phase 2 — MEASURE

- **Purpose.** Prove the measurement system is trustworthy; baseline the current-state performance of the primary Y; characterize variability; compute capability.
- **Business outcome.** Locked Baseline with n ≥ 30 (continuous) or n ≥ 100 (proportions); MSA passed; Capability computed; Control Chart in stable state (or special-cause identified and dispositioned).
- **Entry criteria.** Phase DEFINE exit criteria met.
- **Exit criteria (observable and statistically gated).**
  - `#22 Output Data Collection Plan` CLOSED with one row per CTQ Y; operational definition unambiguous; measurement method specified.
  - `#31 MSA Report` CLOSED with Gage R&R < 30% (ideally < 10%) for continuous, or Kappa ≥ 0.7 for attribute; if unacceptable, measurement system is fixed and MSA is re-run before Baseline.
  - `#28 Baseline Output Performance Data` CLOSED with n ≥ 30 continuous (or n ≥ 100 proportions); dataset stored; summary stats (mean, median, SD, min, max) computed.
  - `#29 Control Chart` CLOSED with appropriate chart type (X-bar/R, I-MR, p, np, c, u per data class — see Part 6.8); stability assessed against Western Electric rules.
  - `#30 Process Capability Report` CLOSED with Cp/Cpk and Pp/Ppk computed; DPMO and process sigma computed; non-normal transform applied if needed (documented).
  - `#27 Continuous Reporting Framework` CLOSED with a live dashboard URL or link.
  - Finance signs cost-basis acknowledgement on primary Y.
  - MBB peer-review: MSA and Baseline signed off.
- **Key decisions.** Accept measurement system or fix-and-redo; accept baseline as representative or extend window; declare process stable (then work on centering/spread) or special-cause (then root-cause the special cause first).
- **Required artifacts.** Output Data Collection Plan (A07); Data Dictionary (A08); Baseline Dataset (A09); MSA Report (A10); Baseline Control Chart (A11); Capability Report (A12); Continuous Reporting Dashboard spec (A13).
- **Required roles.** Black Belt (owner); Analyst (heavy lift); SMEs (observation/appraiser support); MBB (reviewer); Finance partner (cost-basis ack); Process Owner (validation walk-through).
- **BAM scheduling pattern.** Measure runs in Sprints 3–5 (3 sprints typical). Sprint 3: `#22` DCP + `#31` MSA (first Gage R&R run). Sprint 4: `#28` Baseline collection across Deep Blocks; `#29` Control Chart authored. Sprint 5: `#30` Capability + `#27` Reporting framework; MBB gate.
- **Estimated duration.** 2–3 sprints (4–6 weeks elapsed; ~98 person-hours across roster).
- **Capacity assumptions.** Black Belt 18 h/week (peak); Analyst 12 h/week; SMEs 3 h each/week (appraiser time for MSA); MBB 4 h review (MSA + Baseline gates).
- **Phase derivation note.** `phaseFor()` returns `'MEASURE'` when highest-closed step has `activityNumber` in [22, 30]. Exits when any `#31`+ step closes. Note that `#31` MSA is in the Analyze range by activity number but semantically Measure — see §2.7 for the phase-boundary convention.

### 2.3 Phase 3 — ANALYZE

- **Purpose.** Isolate the vital few X's that drive Y variation; validate causation (not just correlation); build a ranked FMEA of failure modes to target in Improve.
- **Business outcome.** Validated root causes with statistical evidence + confound-check; prioritized list of X's with expected-impact quantification; FMEA with actionable recommendations.
- **Entry criteria.** Phase MEASURE exit criteria met. Baseline is locked and the team knows which Y they are working on.
- **Exit criteria (observable and statistically gated).**
  - `#32 Detailed Process Maps` CLOSED with current-state swimlane; value-add / non-value-add tagging; 1–3 measurement points per sub-process.
  - `#34 Cause and Effect Matrix` CLOSED with inputs × outputs scoring; prioritized X's by Output-weighted score.
  - `#35 Inputs Data Collection Plan` CLOSED; executed for ≥ 30 paired X-Y observations.
  - `#36 Correlation and Regression` CLOSED with pairwise correlations computed, regression model fit (R², p-values, residual diagnostics), vital-X identification, AND a confound-check table (alternative explanations ruled out) OR a designed experiment (DOE) confirming causation.
  - `#37 FMEA` CLOSED with RPN scoring (Severity × Occurrence × Detection), ≥3 recommended actions for top RPNs (>100 or top-quartile).
  - Multiple-comparisons control applied (Bonferroni or FDR) if > 3 hypothesis tests run — documented in `#36` artifact.
  - MBB peer-review: Regression diagnostics + causation validation signed off.
- **Key decisions.** Which vital X's to carry forward into Improve (typically 3–5); which failure modes from FMEA to mitigate; whether a DOE is needed in Improve or the regression evidence is sufficient.
- **Required artifacts.** Detailed Process Maps (A14); Cause & Effect Matrix (A15); Input Data Collection Plan (A16); Correlation & Regression Report (A17); Root Cause Summary (A18); FMEA (A19); Hypothesis Test Results Log (A20).
- **Required roles.** Black Belt (owner); Analyst; SMEs (process knowledge, X-brainstorming); MBB (reviewer; heavier here than other phases — statistical method review); Process Owner (prioritization).
- **BAM scheduling pattern.** Analyze runs in Sprints 6–9 (2–4 sprints typical). Sprint 6: `#32` Maps + `#34` C&E. Sprint 7: `#35` Input DCP + data collection. Sprint 8: `#36` Regression + hypothesis tests. Sprint 9: `#37` FMEA + MBB gate review + confound-check table.
- **Estimated duration.** 2–4 sprints (4–8 weeks elapsed; ~112 person-hours across roster).
- **Capacity assumptions.** Black Belt 18 h/week; Analyst 14 h/week (heavy statistical work); SMEs 4 h each/week (C&E + FMEA sessions); MBB 6 h review.
- **Phase derivation note.** `phaseFor()` returns `'ANALYZE'` when highest-closed step has `activityNumber` in [31, 37]. By this standard's convention (§2.7), `#31 MSA` is operationally Measure but activity-number-range-wise Analyze. The DAG's `dependsOn` edges handle the real sequencing: `#28 Baseline` depends on `#31 MSA`, so MSA always precedes Baseline-close regardless of the phaseFor() bucket.

### 2.4 Phase 4 — IMPROVE

- **Purpose.** Design, pilot, and validate countermeasures that attack the vital few X's. Confirm Y moved. Prepare to scale.
- **Business outcome.** Implemented improvements with before/after evidence; pilot results statistically significant AND meaningful in effect size; Financial Benefit Translator pass 1 (projected) complete; scale plan ready.
- **Entry criteria.** Phase ANALYZE exit criteria met. Validated root causes exist.
- **Exit criteria (observable).**
  - `#33 Quick Win Improvements` CLOSED if any candidates (reversible, low-cost, < 2 person-days) were identified during Analyze.
  - `#38 Process Improvement Backlog` CLOSED with prioritized items (name, description, Day-2-Done, effort, impact, priority score).
  - Pilot design authored and approved by Sponsor + Process Owner (artifact A21 of Part 4).
  - Pilot executed; pilot data collected using the same measurement system validated in `#31`.
  - Pilot statistical comparison: appropriate test (t-test / ANOVA / proportion / non-parametric) with p < 0.05 AND effect size meaningful (Cohen's d ≥ 0.5 or domain-relevant percent-delta).
  - `#40 Implemented Improvements` CLOSED with before/after log per implemented item.
  - `#39 Financial Benefit Translator` pass 1 (projected) CLOSED with Finance signature; Hard/Soft/Cost-Avoidance classification applied.
  - Control plan draft authored (moved here from Control per §1.5 refinement #3); MBB pre-review.
- **Key decisions.** Go/no-go per pilot; scale sequence; which improvements land on the Control plan; whether to re-enter Analyze if pilot fails.
- **Required artifacts.** Quick Wins Log (A22); Process Improvement Backlog (A23); Pilot Design (A21); Pilot Results (A24); Implemented Improvements Log (A25); Control Plan Draft (A26 draft); Financial Benefit Translator pass 1 (A27 pass1).
- **Required roles.** Black Belt (owner); Process Owner (go/no-go on each pilot); Implementation Lead (often the PO or a delegate); Analyst (pilot statistical analysis); Finance partner (pass 1 sign-off); MBB (Control plan pre-review); SMEs (implementation depth).
- **BAM scheduling pattern.** Improve runs in Sprints 10–15 (2–6 sprints depending on pilot length). Sprints 10–11: `#33` Quick Wins + `#38` Backlog. Sprints 12–13: Pilot design + execution. Sprint 14: `#40` Implemented Improvements + `#39` pass 1 ROI. Sprint 15: Control plan draft + MBB pre-review.
- **Estimated duration.** 2–6 sprints (4–12 weeks elapsed; ~140 person-hours across roster depending on pilot scale).
- **Capacity assumptions.** Black Belt 16 h/week; Process Owner 8 h/week (peak — makes go/no-go decisions); Implementation Lead 14 h/week during execution; Analyst 10 h/week (pilot stats); Finance 4 h (pass 1); MBB 3 h.
- **Phase derivation note.** `phaseFor()` returns `'IMPROVE'` when highest-closed step has `activityNumber` in [38, 40]. Note `#33` (activityNumber 33) is in the Analyze-number range but semantically Improve — again, the DAG's `dependsOn` handles real sequencing.

### 2.5 Phase 5 — CONTROL

- **Purpose.** Lock in the gain. Transfer ownership to the Process Owner with a live monitoring system, documented SOPs, and a rollback plan.
- **Business outcome.** CLOSED Kaizen with statistically-validated post-improvement performance (remeasurement with n ≥ baseline n, same method); Finance-signed actual benefit; signed Control Plan; running Control Chart with named owner and 30/60/90 check-ins; Process Owner has signed transition acknowledgement.
- **Entry criteria.** Phase IMPROVE exit criteria met. Pilot showed statistically significant + meaningful improvement.
- **Exit criteria (observable).**
  - Post-improvement remeasurement collected with same method as `#28` Baseline; n ≥ baseline n × 0.9; exclusions identical.
  - Post-improvement `#29 Control Chart` run; new stable pattern confirmed (or new special-cause investigated).
  - Post-improvement `#30 Capability Report` run; Cp/Cpk delta quantified; target Cpk ≥ 1.33 (capable) or original target achieved.
  - `#39 Financial Benefit Translator` pass 2 (actual) CLOSED with Finance signature; pass1-vs-pass2 reconciliation delta documented.
  - `#41 Project Results Narrative` CLOSED with full 6-page narrative (problem → baseline → root cause → improvements → results → control plan → lessons); all required sections populated with evidence.
  - Control Plan finalized and signed by Process Owner + Sponsor; monitoring dashboard live; 30/60/90 check-in calendar holds created; rollback plan authored.
  - Kaizen Service `close()` called; `Kaizen.state = CLOSED`; `closeKind` set (SUCCESS / PARTIAL / FAILED_HONEST).
- **Key decisions.** `closeKind` assignment; sustainment ownership model; replication recommendation for adjacent processes.
- **Required artifacts.** Post-Improvement Dataset (A28); Post-Improvement Control Chart + Capability (A11-post, A12-post); Financial Benefit Translator pass 2 (A27 pass2); Control Plan (A26 final); Monitoring Dashboard Spec (A29); Project Results Narrative / Executive Report (A30); Lessons Learned (A31); Process Owner Transition Memo (A32).
- **Required roles.** Black Belt (owner); Process Owner (co-signer on transition); Sponsor (final sign-off); Finance partner (pass 2 signature); MBB (final review); Analyst (remeasurement stats).
- **BAM scheduling pattern.** Control runs in Sprints 16–19 (2–4 sprints). Sprint 16: remeasurement data collection; Sprint 17: post-capability + `#39` pass 2; Sprint 18: `#41` authoring; Sprint 19: Control Plan finalization, transition, close. Post-close: 30-day, 60-day, 90-day sustainment check-ins (scheduled by Control Plan; not in Kaizen.state ≠ CLOSED).
- **Estimated duration.** 2–4 sprints + ongoing sustainment (4–8 weeks elapsed; ~72 person-hours across roster + sustainment tail).
- **Capacity assumptions.** Black Belt 12 h/week (tapering); Process Owner 6 h/week (handoff activities); Analyst 8 h/week (remeasurement stats); Finance 4 h; MBB 4 h; Sponsor 3 h (close readout + sign).
- **Phase derivation note.** `phaseFor()` returns `'CONTROL'` when highest-closed step has `activityNumber ≥ 41`. Post-close reuse of `#29` and `#30` for the post-improvement remeasurement does not re-trigger a phase transition (same activity number, same max step). The Kaizen's `state` moves to `IN_REMEASUREMENT` during post-capture, then `CLOSED` on final sign-off.

### 2.6 Aggregate duration and person-hours

Summing across the five phases, a typical DMAIC project runs:

| Phase | Sprints | Weeks | Black Belt hrs | Analyst hrs | Process Owner hrs | Sponsor hrs | MBB hrs | SME hrs (total across 3) | Finance hrs |
|---|---|---|---|---|---|---|---|---|---|
| Define | 1–2 | 2–4 | 18 | 2 | 6 | 3 | 2 | 12 | 1 |
| Measure | 2–3 | 4–6 | 54 | 36 | 8 | 2 | 4 | 27 | 3 |
| Analyze | 2–4 | 4–8 | 54 | 42 | 6 | 2 | 6 | 36 | 0 |
| Improve | 2–6 | 4–12 | 64 | 40 | 32 | 3 | 3 | 30 | 4 |
| Control | 2–4 | 4–8 | 36 | 24 | 18 | 3 | 4 | 9 | 4 |
| **Total** | **9–19** | **18–38** | **226** | **144** | **70** | **13** | **19** | **114** | **12** |

**Grand total person-hours: ~598 across the team for a single DMAIC project end-to-end.** This is roughly 2× a 30-Day Accelerator's ~293 person-hours, consistent with DMAIC's higher rigor bar. Sustainment tail adds ~15 hours over 90 days (3 check-ins × 5 h each for Process Owner).

### 2.7 Phase-boundary convention (engine vs. methodology)

The Six Sigma methodology groups steps by letter (D/M/A/I/C) but the BAM catalog numbers them sequentially. Two steps — `#31 MSA` and `#33 Quick Wins` — sit across a methodology boundary:

- `#31 MSA` is methodologically **Measure** (you measure the measurement system) but its activityNumber (31) puts it in the [31,37] Analyze bucket per `phaseFor()`'s range.
- `#33 Quick Wins` is methodologically **Improve** (you implement something) but its activityNumber (33) is in the Analyze bucket.

**Reconciliation:** the `phaseFor()` function is a UI-facing convenience — it tells the Kaizen card what to show. The *real* sequencing is enforced by `CatalogEntry.dependsOn`, not by the phase label:

- `#28 Baseline` declares `dependsOn: [#22, #31]` — so MSA must close before Baseline regardless of which phase label the UI shows.
- `#33 Quick Wins` declares `dependsOn: [#22]` at minimum (you need a DCP) and may optionally declare `dependsOn: [#36]` if the org wants to forbid pre-regression quick wins. This standard recommends the stricter form.
- `#40 Implemented Improvements` declares `dependsOn: [#37, #38]` — FMEA and Backlog precede implementation.

This standard's `#20`–`#41` ordering by activity number is the default traversal; the DAG is the source of truth.

### 2.8 Inter-phase glue: standing cadences

Throughout the project, the following non-phase-specific cadences run:

- **Daily Standup** (15 min COMMUNICATION, COMMUNICATION bucket) — per `ENGINE_DESIGN.md §3.4` DAILY_NON_OPTIONAL_SET.
- **Weekly Reflection** (20 min CI, Fri PM) — per `ENGINE_DESIGN.md §1.3` — provides the Friction Signal feed that may promote to a new Kaizen or raise a mid-project concern.
- **Sprint Planning / Review / Retrospective** — team-level ceremonies; DMAIC work is a subset of sprint backlog.
- **Phase-gate review** — at each phase boundary, a 60-min MBB + Black Belt + Sponsor + Process Owner review aligned to Part 8.8 gate questions.
- **MBB peer-review sessions** — 4 mandatory: Charter (Define close), MSA + Baseline (Measure close), Regression + causation validation (Analyze close), Control Plan + Results Narrative (Control close). Optional 5th on pilot design at Improve start.

---

## Part 3 — Complete Task Inventory

Format: one detail block per task. Parent catalog entry cited as `→ #N`. Total: 88 tasks across the five phases plus 6 inter-phase glue tasks (94 total).

**Legend.** Effort (min) = single-task active work. Duration (d) = wall-clock. BAM work type: **Deep** (PROJECT), **Communication** (COMMUNICATION), **CI** (CI). Standardization: H = same text every run; M = template + fill-in; L = judgment-heavy. AI-support: names the agent from `AI_AGENTS.md`.

### DEFINE phase (13 tasks) — target 1–2 sprints

---

**`dmaic_define_01` — Promote friction cluster / VOC signal to DMAIC Kaizen** → `#20`
- **Phase.** DEFINE.
- **Purpose.** Create the Kaizen record with `projectType='DMAIC'`.
- **Operational definition.** `Kaizen` row exists with `projectType='DMAIC'`, `state='DRAFT'`, `startDate` set, Sponsor named in `sponsorRef`.
- **Required inputs.** Friction signal cluster OR Sponsor request OR Kaizen Event follow-up finding; Sponsor commitment email.
- **Source of inputs.** Weekly Reflection promotion pipeline; external Sponsor request; prior CLOSED Kaizen outputs.
- **Activity steps.** (a) Validate problem meets DMAIC criteria (Part 1.8 decision tree). (b) Identify Sponsor. (c) Call `KaizenService.promote()` with `projectType='DMAIC'`. (d) Verify Kaizen row and workspace created.
- **Responsible owner.** Black Belt.
- **Supporting roles.** Sponsor (validates commitment).
- **Effort.** 30 min. **Duration.** 0.5 d. **BAM type.** Communication.
- **Predecessors.** —. **Successors.** `dmaic_define_02`, `dmaic_define_03`.
- **Required tools.** CadencePlan Kaizen promote UI.
- **Deliverables.** Kaizen row.
- **Outputs.** `Kaizen.id`; `projectType='DMAIC'`.
- **Acceptance criteria.** Kaizen visible on `/kaizens`; Sponsor named.
- **Statistical requirements.** None.
- **Risk if skipped.** Work not tracked; no audit trail.
- **Standardization.** H. **AI-support.** Context Agent (surfaces prior similar Kaizens). **Automation.** H.
- **Notes.** If promoted from PDCA, the prior PDCA's measurements seed `#28` baseline.

---

**`dmaic_define_02` — Conduct Sponsor Voice-of-Leader interview** → `#20`
- **Phase.** DEFINE.
- **Purpose.** Capture Sponsor's strategic goal, top 3 pains on the target process, and authority boundary.
- **Operational definition.** 45-min structured interview; notes in workspace; 3 pains, strategic goal, authority scope, ROI expectation range captured.
- **Required inputs.** Sponsor calendar hold; Voice-of-Leader template.
- **Source of inputs.** Part 4 template library (A01 draft).
- **Activity steps.** (a) Schedule 45-min session. (b) Ask "what process costs the most money / most customer pain / most risk?" (c) Probe for measurable gap. (d) Ask for authority-scope boundary and out-of-scope items. (e) Capture ROI expectation. (f) Store notes.
- **Responsible owner.** Black Belt.
- **Supporting roles.** —.
- **Effort.** 60 min. **Duration.** 0.5 d. **BAM type.** Communication.
- **Predecessors.** `dmaic_define_01`. **Successors.** `dmaic_define_04`, `dmaic_define_05`.
- **Required tools.** Calendar; notes app.
- **Deliverables.** Voice-of-Leader Notes (fragment of A01).
- **Outputs.** 3 pains, 1 strategic goal, authority scope, ROI range.
- **Acceptance criteria.** Notes file stored; Sponsor acknowledges.
- **Statistical requirements.** None.
- **Risk if skipped.** Charter drafted on Facilitator assumption.
- **Standardization.** M. **AI-support.** Context Agent. **Automation.** L.

---

**`dmaic_define_03` — Identify Process Owner and governance roster** → `#20`
- **Phase.** DEFINE.
- **Purpose.** Name every required role with a specific human.
- **Operational definition.** Roster artifact complete: Black Belt, Sponsor, Process Owner, MBB reviewer, 2–3 SMEs, Finance partner, Analyst.
- **Required inputs.** Sponsor interview output; org chart.
- **Source of inputs.** `dmaic_define_02`.
- **Activity steps.** (a) From Sponsor, extract Process Owner name. (b) Black Belt proposes MBB peer-reviewer (Master Black Belt with domain familiarity). (c) Process Owner names SMEs. (d) Sponsor names Finance partner. (e) Confirm calendars and per-phase commitments.
- **Responsible owner.** Black Belt.
- **Supporting roles.** Sponsor; Process Owner.
- **Effort.** 90 min. **Duration.** 1 d. **BAM type.** Communication.
- **Predecessors.** `dmaic_define_02`. **Successors.** `dmaic_define_06`.
- **Required tools.** Roster template.
- **Deliverables.** Team Roster (fragment of A01).
- **Outputs.** Named roles.
- **Acceptance criteria.** Every required role has a named human with email + commitment.
- **Statistical requirements.** None.
- **Risk if skipped.** Phase blockers on unassigned roles (esp. Finance at Measure, MBB at Analyze).
- **Standardization.** M. **AI-support.** Context Agent (prior rosters). **Automation.** L.

---

**`dmaic_define_04` — Author initial problem statement draft** → `#20`
- **Phase.** DEFINE.
- **Purpose.** Commit to a single problem statement following Part 5 template.
- **Operational definition.** Draft statement with: current state, quantified impact (dollar or count), CTQ linkage placeholder, scope reference, target condition, timeframe.
- **Required inputs.** Sponsor interview; preliminary Process Owner input.
- **Source of inputs.** `dmaic_define_02`, `dmaic_define_03`.
- **Activity steps.** (a) Use Part 5 template. (b) Write one-paragraph statement. (c) Check against Part 5 common-errors list. (d) Peer-review with Process Owner.
- **Responsible owner.** Black Belt.
- **Supporting roles.** Process Owner (review).
- **Effort.** 60 min. **Duration.** 0.5 d. **BAM type.** Deep.
- **Predecessors.** `dmaic_define_02`, `dmaic_define_03`. **Successors.** `dmaic_define_08`.
- **Required tools.** Charter template; Part 5 checklist.
- **Deliverables.** Problem Statement v0.1 (fragment of A01).
- **Outputs.** One paragraph.
- **Acceptance criteria.** Statement passes Part 5.7 lint (no solution-prescribing language; no vague CTQ; baseline placeholder named; scope-reference present).
- **Statistical requirements.** None (statistical rigor enters at Measure).
- **Risk if skipped.** Team builds toward an unshared understanding of the problem.
- **Standardization.** M. **AI-support.** Composer Explainer (draft from A01); Planning Agent (lint). **Automation.** M.

---

**`dmaic_define_05` — Author SIPOC** → `#21`
- **Phase.** DEFINE.
- **Purpose.** Establish high-level process view: Suppliers, Inputs, Process steps (3–7), Outputs, Customers.
- **Operational definition.** SIPOC artifact with 3–7 high-level process steps; ≥1 Supplier, Input, Output, Customer per row.
- **Required inputs.** Sponsor interview; Process Owner input; participant panel (3–5 SMEs).
- **Source of inputs.** `dmaic_define_02`, `dmaic_define_03`.
- **Activity steps.** (a) Schedule 2-hour SIPOC workshop with 4–8 participants. (b) Brainstorm process steps (10–13 min). (c) Group similar steps; agree on 3–7 high-level (verb + noun). (d) Brainstorm Outputs per step. (e) Brainstorm Inputs per step. (f) Brainstorm Suppliers per input. (g) Identify Customers per output. (h) Consolidate in SIPOC template. (i) Publish.
- **Responsible owner.** Black Belt.
- **Supporting roles.** Process Owner; SMEs (4–8).
- **Effort.** 240 min (workshop 120 + consolidation 120). **Duration.** 1 d. **BAM type.** Deep.
- **Predecessors.** `dmaic_define_03`. **Successors.** `dmaic_define_06`, `dmaic_analyze_01` (Process Maps depend on SIPOC), `dmaic_measure_01` (DCP inherits Outputs).
- **Required tools.** SIPOC template (spreadsheet).
- **Deliverables.** SIPOC (A02).
- **Outputs.** 3–7 process steps; Inputs/Outputs/Suppliers/Customers lists.
- **Acceptance criteria.** ≥3 process steps; ≥1 of each SIPOC element; SME panel signs.
- **Statistical requirements.** None.
- **Risk if skipped.** DMAIC proceeds on individual understanding; Analyze C&E Matrix has no Input list to populate.
- **Standardization.** H (template-driven). **AI-support.** Composer Explainer (first-draft from prior-process library). **Automation.** M.

---

**`dmaic_define_06` — Build Stakeholder Analysis 2×2** → `#23`
- **Phase.** DEFINE.
- **Purpose.** Map all stakeholders on Influence × Interest grid; define engagement approach per quadrant.
- **Operational definition.** Stakeholder map artifact with ≥ 8 named stakeholders; each rated H/M/L on Influence and Interest; engagement approach per quadrant.
- **Required inputs.** Roster (`dmaic_define_03`); SIPOC (Suppliers + Customers).
- **Source of inputs.** `dmaic_define_03`, `dmaic_define_05`.
- **Activity steps.** (a) List stakeholders (customers, partners, approvers, users, downstream consumers, compliance liaisons). (b) Rate Influence H/M/L and Interest H/M/L. (c) Plot on 2×2 grid. (d) Assign engagement approach per quadrant (Manage Closely / Keep Satisfied / Keep Informed / Monitor). (e) Name an owner per engagement cluster.
- **Responsible owner.** Black Belt.
- **Supporting roles.** Process Owner; 1–2 senior team members.
- **Effort.** 60 min. **Duration.** 0.5 d. **BAM type.** Deep.
- **Predecessors.** `dmaic_define_03`, `dmaic_define_05`. **Successors.** `dmaic_define_07`.
- **Required tools.** 2×2 template.
- **Deliverables.** Stakeholder Analysis (A03).
- **Outputs.** Grid with populated quadrants.
- **Acceptance criteria.** ≥8 stakeholders; every stakeholder has Infl+Intr ratings; every quadrant has an owner.
- **Statistical requirements.** None.
- **Risk if skipped.** Communication Plan unanchored; stakeholder surprises mid-project.
- **Standardization.** M. **AI-support.** Context Agent (prior stakeholder lists for same org unit). **Automation.** M.

---

**`dmaic_define_07` — Author Communication Plan matrix** → `#24`
- **Phase.** DEFINE.
- **Purpose.** Specify cadence × channel × format × owner × acceptance per stakeholder; place recurring calendar holds.
- **Operational definition.** Matrix artifact with one row per stakeholder; calendar holds visible on Black Belt and stakeholder calendars.
- **Required inputs.** Stakeholder Analysis (A03); Charter scope.
- **Source of inputs.** `dmaic_define_06`.
- **Activity steps.** (a) Copy stakeholder list from A03. (b) Per stakeholder: cadence (daily/weekly/biweekly/monthly), channel (chat/email/meeting/dashboard/1:1), format (status note / dashboard link / slide deck / verbal), owner. (c) Author acceptance criterion per row ("Sponsor opens dashboard ≥1×/month"). (d) Book recurring calendar holds for synchronous touchpoints. (e) Publish.
- **Responsible owner.** Black Belt.
- **Supporting roles.** Process Owner (review).
- **Effort.** 60 min. **Duration.** 0.5 d. **BAM type.** Deep.
- **Predecessors.** `dmaic_define_06`. **Successors.** `dmaic_define_09`.
- **Required tools.** Matrix template; calendar.
- **Deliverables.** Communication Plan (A04).
- **Outputs.** Matrix + calendar holds.
- **Acceptance criteria.** Every stakeholder row has all 5 fields; calendar holds exist.
- **Statistical requirements.** None.
- **Risk if skipped.** Sponsor surprises mid-flight; no communication rhythm.
- **Standardization.** H. **AI-support.** Composer Explainer; Planning Agent (flags missing fields). **Automation.** H.

---

**`dmaic_define_08` — Author Risk Register with P×I scoring** → `#25`
- **Phase.** DEFINE.
- **Purpose.** Enumerate technical, organizational, timeline, resource risks; score; assign owners.
- **Operational definition.** Register artifact with ≥6 risks; each with P (1–5), I (1–5), score = P×I; ≥1 mitigation per score ≥ 12; monitoring plan per score 6–11.
- **Required inputs.** SIPOC; problem statement draft; roster.
- **Source of inputs.** `dmaic_define_04`, `dmaic_define_05`, `dmaic_define_03`.
- **Activity steps.** (a) Brainstorm risks in 4 buckets: technical, organizational, timeline, resource. (b) Score P and I per risk (1–5). (c) Compute score. (d) Mitigation plan for risks scoring ≥12. (e) Monitoring plan for 6–11. (f) Assign owner per risk. (g) Commit to Retro-refresh at each sprint boundary.
- **Responsible owner.** Black Belt.
- **Supporting roles.** Team.
- **Effort.** 60 min. **Duration.** 0.5 d. **BAM type.** Deep.
- **Predecessors.** `dmaic_define_04`. **Successors.** `dmaic_define_11`.
- **Required tools.** Risk template.
- **Deliverables.** Risk Register (A05).
- **Outputs.** Scored list.
- **Acceptance criteria.** ≥6 risks; ≥3 high (≥12) each with named mitigation owner.
- **Statistical requirements.** None.
- **Risk if skipped.** Predictable failures go unmanaged.
- **Standardization.** M. **AI-support.** Planning Agent (risk-pattern library). **Automation.** M.

---

**`dmaic_define_09` — Conduct VOC interviews (3–5 customers)** → `#26`
- **Phase.** DEFINE.
- **Purpose.** Capture raw voice-of-customer language on pain, requests, delight.
- **Operational definition.** 3–5 interview transcripts with verbatim quotes; each tagged by theme.
- **Required inputs.** Customer list from SIPOC; interview template.
- **Source of inputs.** `dmaic_define_05`, `dmaic_define_06`.
- **Activity steps.** (a) Identify 3–5 customers (diverse segments). (b) Schedule 30–45 min each. (c) Use open-ended prompts: complaints, requests, pain, delight moments. (d) Capture verbatim; do not translate in real time. (e) Post-interview, tag quotes by theme.
- **Responsible owner.** Black Belt.
- **Supporting roles.** Process Owner (for intros); Analyst (for transcription).
- **Effort.** 300 min (5 × 60). **Duration.** 3–5 d. **BAM type.** Communication.
- **Predecessors.** `dmaic_define_06`. **Successors.** `dmaic_define_12`.
- **Required tools.** Recording; transcript; interview template.
- **Deliverables.** VOC Transcripts (fragment of A06).
- **Outputs.** Verbatim + theme tags.
- **Acceptance criteria.** 3–5 interviews completed; themed.
- **Statistical requirements.** None at this stage.
- **Risk if skipped.** CTQs unanchored; team defines problem in internal language.
- **Standardization.** L. **AI-support.** Reflection Agent (theme clustering); Context Agent. **Automation.** L.

---

**`dmaic_define_10` — Conduct VOB + VOA interviews (2–3 each)** → `#26`
- **Phase.** DEFINE.
- **Purpose.** Capture Voice of Business (strategic, financial, compliance) and Voice of Associate (process workers' pain).
- **Operational definition.** 2–3 VOB + 3–5 VOA transcripts; themed.
- **Required inputs.** Stakeholder Analysis.
- **Source of inputs.** `dmaic_define_06`.
- **Activity steps.** (a) Identify 2–3 business leaders (Finance, Ops, Compliance). (b) Identify 3–5 associates running the process. (c) Schedule 30 min each. (d) VOB: strategic, financial, compliance asks. (e) VOA: pain, workarounds, waste observations. (f) Capture; theme.
- **Responsible owner.** Black Belt.
- **Supporting roles.** Process Owner.
- **Effort.** 240 min (8 × 30). **Duration.** 3 d. **BAM type.** Communication.
- **Predecessors.** `dmaic_define_06`. **Successors.** `dmaic_define_12`.
- **Required tools.** Interview template.
- **Deliverables.** VOB + VOA Transcripts (fragment of A06).
- **Outputs.** Themed quotes.
- **Acceptance criteria.** 2+ VOB and 3+ VOA interviews.
- **Statistical requirements.** None.
- **Risk if skipped.** CTQ tree misses business financials or associate waste.
- **Standardization.** L. **AI-support.** Reflection Agent. **Automation.** L.

---

**`dmaic_define_11` — Translate VOC/VOB/VOA to CTQ Tree** → `#26`
- **Phase.** DEFINE.
- **Purpose.** Convert voice-of-X themes into Critical-to-Quality requirements with measurable attributes.
- **Operational definition.** CTQ Tree artifact: Need (voice theme) → Driver (general attribute) → CTQ (specific, measurable).
- **Required inputs.** VOC, VOB, VOA transcripts.
- **Source of inputs.** `dmaic_define_09`, `dmaic_define_10`.
- **Activity steps.** (a) For each theme, write Need. (b) Translate each Need to a Driver (e.g., "fast response" → response-time attribute). (c) Translate each Driver to a CTQ with unit ("response time ≤ 4 hours for P1 tickets"). (d) Prioritize CTQs by frequency × severity × strategic fit. (e) Flag primary CTQ (the Y metric). (f) Flag secondary CTQs.
- **Responsible owner.** Black Belt.
- **Supporting roles.** Process Owner; Finance (for cost-basis CTQs).
- **Effort.** 90 min. **Duration.** 1 d. **BAM type.** Deep.
- **Predecessors.** `dmaic_define_09`, `dmaic_define_10`. **Successors.** `dmaic_define_12`, `dmaic_measure_01`.
- **Required tools.** CTQ Tree template.
- **Deliverables.** CTQ Tree (A06).
- **Outputs.** Prioritized CTQ list; primary Y named.
- **Acceptance criteria.** ≥3 CTQs; primary Y measurable; Finance cost-basis acknowledged if cost CTQ.
- **Statistical requirements.** Primary Y's data type declared (continuous / discrete / categorical) — drives Part 6 methods.
- **Risk if skipped.** Problem "fast response" with no measurable attribute ends in subjective comparisons.
- **Standardization.** M. **AI-support.** Composer Explainer (drafts CTQ candidates). **Automation.** M.

---

**`dmaic_define_12` — Finalize Charter and obtain Sponsor signature** → `#20`
- **Phase.** DEFINE.
- **Purpose.** Consolidate problem, scope, CTQ/Y, roster, timeline, risks into signed Charter.
- **Operational definition.** Charter artifact CLOSED; `outputArtifactRef.schema='DOCUMENT'`; Sponsor signature captured.
- **Required inputs.** Problem statement (A01 draft); SIPOC (A02); Stakeholder (A03); Comm plan (A04); Risk (A05); CTQ tree (A06).
- **Source of inputs.** `dmaic_define_04`, `dmaic_define_05`, `dmaic_define_06`, `dmaic_define_07`, `dmaic_define_08`, `dmaic_define_11`.
- **Activity steps.** (a) Consolidate. (b) Estimate sprint count (typical 8–12). (c) Top-3 risks stated. (d) Sponsor review session (30 min). (e) Address edits. (f) Capture signature.
- **Responsible owner.** Black Belt.
- **Supporting roles.** Sponsor (signs); Process Owner; MBB (pre-review).
- **Effort.** 90 min authoring + 30 min review. **Duration.** 1 d. **BAM type.** Deep + Communication.
- **Predecessors.** `dmaic_define_04` through `dmaic_define_11`. **Successors.** `dmaic_define_13`.
- **Required tools.** Charter template.
- **Deliverables.** Signed Charter (A01).
- **Outputs.** Signature; `#20` CLOSED.
- **Acceptance criteria.** All template sections complete; Sponsor signature in `outputArtifactRef`.
- **Statistical requirements.** None (sets the stage).
- **Risk if skipped.** Project advances without shared commitment.
- **Standardization.** H. **AI-support.** Composer Explainer (consolidation). **Automation.** M.

---

**`dmaic_define_13` — Phase-gate review: DEFINE close** → phase-gate
- **Phase.** DEFINE.
- **Purpose.** MBB peer-reviews Charter + all Define artifacts; decides ADVANCE / REWORK.
- **Operational definition.** MBB sign-off captured on phase-gate checklist; team advances to Measure.
- **Required inputs.** All 6 Define artifacts.
- **Source of inputs.** Define tasks above.
- **Activity steps.** (a) MBB reviews artifacts. (b) Black Belt walks through Part 8.8 gate questions. (c) MBB decides. (d) If REWORK, named rework items with owner and due date.
- **Responsible owner.** Black Belt.
- **Supporting roles.** MBB (reviewer); Sponsor (observer).
- **Effort.** 60 min. **Duration.** 0.25 d. **BAM type.** Communication.
- **Predecessors.** `dmaic_define_12`. **Successors.** `dmaic_measure_01`.
- **Required tools.** Gate checklist.
- **Deliverables.** Gate-review record.
- **Outputs.** ADVANCE / REWORK decision.
- **Acceptance criteria.** MBB signature; all Part 8.8 Define questions answered.
- **Statistical requirements.** None.
- **Risk if skipped.** Weak Charter causes downstream rework.
- **Standardization.** H. **AI-support.** Planning Agent (pre-run checklist). **Automation.** M.

### MEASURE phase (18 tasks) — target 2–3 sprints

---

**`dmaic_measure_01` — Author Output Data Collection Plan (DCP)** → `#22`
- **Phase.** MEASURE.
- **Purpose.** Specify how each CTQ Y is measured, collected, stratified, and stored.
- **Operational definition.** DCP artifact with one row per CTQ Y; operational definition, unit, method, sampling plan (n, frequency, stratification), owner, tool, storage.
- **Required inputs.** CTQ Tree (A06); SIPOC (A02).
- **Source of inputs.** `dmaic_define_11`, `dmaic_define_05`.
- **Activity steps.** (a) List primary + secondary Y's from CTQ tree. (b) For each, author operational definition (falsifiable text). (c) Name unit of measure. (d) Name measurement method (manual / instrument / extract). (e) Author sampling plan (n ≥ 30 continuous or n ≥ 100 proportions; frequency; stratification rules). (f) Assign owner + tool + storage. (g) Identify measurement-risk items requiring MSA.
- **Responsible owner.** Black Belt.
- **Supporting roles.** Analyst; Process Owner; Finance (cost-basis on cost Y).
- **Effort.** 120 min. **Duration.** 1 d. **BAM type.** Deep.
- **Predecessors.** `dmaic_define_11`. **Successors.** `dmaic_measure_02`.
- **Required tools.** DCP template.
- **Deliverables.** Output Data Collection Plan (A07).
- **Outputs.** One row per Y.
- **Acceptance criteria.** Every Y has all 7 fields; MSA-risk items flagged.
- **Statistical requirements.** Declare data type (continuous/discrete/categorical) per Y; declare minimum n per Y (30 continuous, 100 proportions, per Part 6.3).
- **Risk if skipped.** Baseline data uninterpretable.
- **Standardization.** H. **AI-support.** Composer Explainer; Planning Agent (lints operational definitions). **Automation.** M.

---

**`dmaic_measure_02` — Author Data Dictionary** → `#22`
- **Phase.** MEASURE.
- **Purpose.** Document every variable, field, unit, encoding, and missing-value rule.
- **Operational definition.** Dictionary artifact with row per variable: name, type, unit, valid range, encoding, missing-value rule.
- **Required inputs.** DCP (A07); sample extract from system of record.
- **Source of inputs.** `dmaic_measure_01`.
- **Activity steps.** (a) Enumerate variables from DCP + system fields. (b) Per variable, document type/unit/range/encoding/missing. (c) Validate against 100 sample rows. (d) Flag ambiguities.
- **Responsible owner.** Analyst.
- **Supporting roles.** Black Belt; IT (for system field semantics).
- **Effort.** 90 min. **Duration.** 0.5 d. **BAM type.** Deep.
- **Predecessors.** `dmaic_measure_01`. **Successors.** `dmaic_measure_03`.
- **Required tools.** Dictionary template; data extract.
- **Deliverables.** Data Dictionary (A08).
- **Outputs.** Row per variable.
- **Acceptance criteria.** No ambiguous variables; 100-row sample checked.
- **Statistical requirements.** None directly, but the data types drive Part 6 test selection.
- **Risk if skipped.** Misencoded data poisons Baseline stats.
- **Standardization.** H. **AI-support.** Context Agent (prior dictionaries). **Automation.** M.

---

**`dmaic_measure_03` — Design MSA study (continuous — Gage R&R)** → `#31`
- **Phase.** MEASURE.
- **Purpose.** Plan MSA for continuous Y's requiring measurement-system validation.
- **Operational definition.** MSA design doc: 10 samples covering process range; 2–3 trained appraisers; 2–3 measurements per sample per appraiser, randomized order.
- **Required inputs.** DCP (A07); list of Y's flagged MSA-risk.
- **Source of inputs.** `dmaic_measure_01`.
- **Activity steps.** (a) Select 10 samples spanning expected process range. (b) Recruit 2–3 trained appraisers. (c) Randomize measurement order. (d) Brief appraisers on operational definition. (e) Schedule measurement sessions.
- **Responsible owner.** Black Belt.
- **Supporting roles.** Analyst; Appraisers (SMEs).
- **Effort.** 60 min. **Duration.** 0.5 d. **BAM type.** Deep.
- **Predecessors.** `dmaic_measure_01`. **Successors.** `dmaic_measure_04`.
- **Required tools.** Sample selection log; randomization list.
- **Deliverables.** MSA Study Design (fragment of A10).
- **Outputs.** 10-sample panel; appraiser list; randomized order.
- **Acceptance criteria.** 10 samples span range; appraisers briefed.
- **Statistical requirements.** Plan targets %R&R < 30% (marginal), ideally < 10% (excellent); n-design per AIAG MSA 4th ed.
- **Risk if skipped.** Measurement system unvalidated; baseline meaningless.
- **Standardization.** H (AIAG template). **AI-support.** Planning Agent. **Automation.** M.

---

**`dmaic_measure_04` — Execute Gage R&R measurements** → `#31`
- **Phase.** MEASURE.
- **Purpose.** Collect the measurement replicates per MSA design.
- **Operational definition.** Dataset with 10 samples × 3 appraisers × 2–3 trials = 60–90 rows; randomized; documented.
- **Required inputs.** MSA design; 10 sample panel.
- **Source of inputs.** `dmaic_measure_03`.
- **Activity steps.** (a) Execute session. (b) Capture readings blind (appraiser doesn't see prior value). (c) Log time and conditions. (d) Store raw data.
- **Responsible owner.** Analyst.
- **Supporting roles.** Appraisers.
- **Effort.** 120 min session time. **Duration.** 1–2 d. **BAM type.** Deep.
- **Predecessors.** `dmaic_measure_03`. **Successors.** `dmaic_measure_05`.
- **Required tools.** Measurement instrument; data log.
- **Deliverables.** MSA Raw Data (fragment of A10).
- **Outputs.** 60–90 measurements.
- **Acceptance criteria.** Full n collected; blinding maintained.
- **Statistical requirements.** n per AIAG design.
- **Risk if skipped.** MSA unfinished; Baseline blocked.
- **Standardization.** H. **AI-support.** —. **Automation.** M.

---

**`dmaic_measure_05` — Compute Gage R&R and disposition** → `#31`
- **Phase.** MEASURE.
- **Purpose.** Compute R&R variance components; report %Study Variance, %Tolerance; disposition accept / marginal / reject.
- **Operational definition.** R&R analysis output with repeatability, reproducibility, %R&R, NDC (number of distinct categories), disposition.
- **Required inputs.** MSA raw data.
- **Source of inputs.** `dmaic_measure_04`.
- **Activity steps.** (a) Load data in Minitab/JMP/R. (b) Run Gage R&R (ANOVA method preferred over X-bar-R method). (c) Compute %Study Variance and %Tolerance. (d) Compute NDC. (e) Disposition: Excellent (%R&R < 10%, NDC ≥ 5), Marginal (10–30%, NDC ≥ 4, accept if cost-justified), Unacceptable (> 30% or NDC < 3, fix and redo). (f) Document.
- **Responsible owner.** Black Belt.
- **Supporting roles.** Analyst; MBB (reviews).
- **Effort.** 90 min. **Duration.** 0.5 d. **BAM type.** Deep.
- **Predecessors.** `dmaic_measure_04`. **Successors.** `dmaic_measure_06` (if accept) OR `dmaic_measure_03` loop (if reject).
- **Required tools.** Statistical package.
- **Deliverables.** MSA Report (A10).
- **Outputs.** %R&R, NDC, disposition.
- **Acceptance criteria.** Analysis complete; disposition documented.
- **Statistical requirements.** ANOVA-method Gage R&R preferred; %R&R < 30% to advance; NDC ≥ 4 (ideally ≥ 5).
- **Risk if skipped.** Measurement system not proven; everything downstream contaminated.
- **Standardization.** H. **AI-support.** —. **Automation.** H (given loaded data).

---

**`dmaic_measure_06` — Attribute MSA (Kappa) if any Y is categorical/attribute** → `#31`
- **Phase.** MEASURE.
- **Purpose.** Validate attribute measurement systems via Kappa analysis (categorical agreement).
- **Operational definition.** Kappa computed across 2–3 appraisers × 20+ samples × 2 trials; Cohen's Kappa per pair; Fleiss' Kappa across all; disposition.
- **Required inputs.** Categorical Y's; 20+ samples across classes; 2–3 appraisers.
- **Source of inputs.** `dmaic_measure_01`.
- **Activity steps.** (a) Select 20+ samples spanning classes. (b) Each appraiser classifies blindly twice. (c) Compute Kappa per pair (between-appraiser) and intra-appraiser (repeatability). (d) Disposition: Kappa ≥ 0.9 excellent; 0.7–0.9 acceptable; < 0.7 fix-and-redo.
- **Responsible owner.** Black Belt.
- **Supporting roles.** Appraisers; Analyst.
- **Effort.** 180 min. **Duration.** 1 d. **BAM type.** Deep.
- **Predecessors.** `dmaic_measure_01`. **Successors.** `dmaic_measure_07`.
- **Required tools.** Statistical package.
- **Deliverables.** Attribute MSA Report (fragment of A10).
- **Outputs.** Kappa; disposition.
- **Acceptance criteria.** Kappa ≥ 0.7 to advance; < 0.7 requires operational-definition fix or appraiser retraining.
- **Statistical requirements.** Kappa ≥ 0.7; sample spans classes.
- **Risk if skipped.** Attribute baselines are noise when appraisers disagree.
- **Standardization.** H. **AI-support.** —. **Automation.** H.

---

**`dmaic_measure_07` — Execute Baseline data collection** → `#28`
- **Phase.** MEASURE.
- **Purpose.** Collect baseline performance data per DCP with validated measurement system.
- **Operational definition.** Baseline dataset with n ≥ 30 continuous (or n ≥ 100 proportions) per primary Y; stored.
- **Required inputs.** DCP (A07); accepted MSA (A10).
- **Source of inputs.** `dmaic_measure_01`, `dmaic_measure_05`, `dmaic_measure_06`.
- **Activity steps.** (a) Execute DCP for baseline window (typically 30 working days or 30+ samples). (b) Collect per plan. (c) Log deviations. (d) Apply exclusion rules. (e) Store raw + cleaned datasets.
- **Responsible owner.** Analyst.
- **Supporting roles.** Black Belt; SMEs (for observational data).
- **Effort.** 480 min cumulative across window. **Duration.** 10–14 d wall-clock. **BAM type.** Deep.
- **Predecessors.** `dmaic_measure_05`, `dmaic_measure_06`. **Successors.** `dmaic_measure_08`.
- **Required tools.** Per DCP.
- **Deliverables.** Baseline Dataset (A09).
- **Outputs.** Dataset with n ≥ plan.
- **Acceptance criteria.** n ≥ plan; exclusions logged; deviations documented.
- **Statistical requirements.** n ≥ 30 continuous; n ≥ 100 proportions; stratification per DCP.
- **Risk if skipped.** No baseline; DMAIC cannot proceed.
- **Standardization.** H. **AI-support.** Planning Agent (flags missing data). **Automation.** M.

---

**`dmaic_measure_08` — Compute Baseline summary statistics** → `#28`
- **Phase.** MEASURE.
- **Purpose.** Compute descriptive stats; test normality; identify outliers.
- **Operational definition.** Summary stats doc: n, mean, median, SD, min, max, percentiles (25/75/95), normality test result, outlier flags.
- **Required inputs.** Baseline dataset (A09).
- **Source of inputs.** `dmaic_measure_07`.
- **Activity steps.** (a) Load dataset. (b) Compute descriptive statistics. (c) Plot histogram + box plot. (d) Run Anderson-Darling (or Shapiro-Wilk for n < 50) normality test. (e) Flag outliers (IQR rule or 3σ). (f) Decide transform / non-parametric if non-normal. (g) Document.
- **Responsible owner.** Analyst.
- **Supporting roles.** Black Belt.
- **Effort.** 90 min. **Duration.** 0.5 d. **BAM type.** Deep.
- **Predecessors.** `dmaic_measure_07`. **Successors.** `dmaic_measure_09`.
- **Required tools.** Statistical package.
- **Deliverables.** Baseline Summary Stats (fragment of A09).
- **Outputs.** Stats; normality; outliers.
- **Acceptance criteria.** All stats present; normality disposition.
- **Statistical requirements.** Anderson-Darling preferred (n ≥ 20); Shapiro-Wilk for small n; α = 0.05 for normality test.
- **Risk if skipped.** Capability indices mis-computed on non-normal data.
- **Standardization.** H. **AI-support.** —. **Automation.** H.

---

**`dmaic_measure_09` — Build Baseline Control Chart** → `#29`
- **Phase.** MEASURE.
- **Purpose.** Assess baseline stability via appropriate Control Chart; identify special-cause signals.
- **Operational definition.** Control Chart artifact with appropriate chart type (per Part 6.8); UCL/LCL/CL; Western Electric rules applied; stability disposition.
- **Required inputs.** Baseline dataset (A09); data type from DCP.
- **Source of inputs.** `dmaic_measure_07`, `dmaic_measure_01`.
- **Activity steps.** (a) Select chart type per Part 6.8 decision rules (X-bar/R for subgrouped continuous; I-MR for individual; p/np for proportions; c/u for counts/rates). (b) Compute CL, UCL, LCL. (c) Apply Western Electric rules 1–4. (d) Mark out-of-control points. (e) Disposition: Stable / Special-cause present. (f) If special-cause, root-cause it before calling the distribution baseline.
- **Responsible owner.** Analyst.
- **Supporting roles.** Black Belt.
- **Effort.** 120 min. **Duration.** 0.5 d. **BAM type.** Deep.
- **Predecessors.** `dmaic_measure_07`. **Successors.** `dmaic_measure_10`.
- **Required tools.** Statistical package.
- **Deliverables.** Baseline Control Chart (A11).
- **Outputs.** Chart; stability disposition.
- **Acceptance criteria.** Chart type matches data; rules applied; disposition documented.
- **Statistical requirements.** Western Electric rules 1–4; rule 1 = 1 point > 3σ; rule 2 = 2/3 > 2σ same side; rule 3 = 4/5 > 1σ same side; rule 4 = 8 consecutive same side. Chart type per Part 6.8 table.
- **Risk if skipped.** Team proceeds on unstable distribution; capability indices meaningless.
- **Standardization.** H. **AI-support.** —. **Automation.** H.

---

**`dmaic_measure_10` — Compute Process Capability (Cp, Cpk, Pp, Ppk, DPMO, σ-level)** → `#30`
- **Phase.** MEASURE.
- **Purpose.** Quantify process capability vs spec limits.
- **Operational definition.** Capability Report: Cp, Cpk (short-term), Pp, Ppk (long-term), DPMO, process sigma; non-normal capability if required.
- **Required inputs.** Baseline dataset (A09); USL/LSL from CTQ.
- **Source of inputs.** `dmaic_measure_07`, `dmaic_define_11`.
- **Activity steps.** (a) Confirm normality (from `dmaic_measure_08`). If non-normal, transform (Box-Cox / Johnson) or use non-normal capability (Weibull). (b) Use spec limits from CTQ. (c) Cp = (USL − LSL) / 6σ̂ (within-subgroup σ̂). (d) Cpk = min((USL−μ)/3σ̂, (μ−LSL)/3σ̂). (e) Pp, Ppk using overall σ. (f) DPMO per million opportunities. (g) Process sigma from DPMO. (h) Disposition: Cpk ≥ 1.33 capable; ≥ 1.67 world-class; < 1.33 inadequate.
- **Responsible owner.** Analyst.
- **Supporting roles.** Black Belt.
- **Effort.** 60 min. **Duration.** 0.5 d. **BAM type.** Deep.
- **Predecessors.** `dmaic_measure_08`, `dmaic_measure_09`. **Successors.** `dmaic_measure_11`.
- **Required tools.** Statistical package.
- **Deliverables.** Capability Report (A12).
- **Outputs.** Cp/Cpk/Pp/Ppk/DPMO/σ-level.
- **Acceptance criteria.** Indices computed; transform documented; disposition stated.
- **Statistical requirements.** Normality assumed (or transform documented); within-subgroup σ̂ for Cp/Cpk; overall σ for Pp/Ppk.
- **Risk if skipped.** No quantified capability; improvement target undefined.
- **Standardization.** H. **AI-support.** —. **Automation.** H.

---

**`dmaic_measure_11` — Build Continuous Reporting Framework (dashboard)** → `#27`
- **Phase.** MEASURE.
- **Purpose.** Stand up a live dashboard reporting baseline, current, target, delta, trend.
- **Operational definition.** Dashboard URL or link; auto-refresh cadence set (daily/weekly); ≥ 4 metrics plotted.
- **Required inputs.** DCP data source; Baseline (A09); target from Charter.
- **Source of inputs.** `dmaic_measure_07`, `dmaic_define_12`.
- **Activity steps.** (a) Select platform (Tableau, Looker, Quip, equivalent). (b) Connect to DCP data source. (c) Build baseline card, current card, target card, delta card, trend chart. (d) Assign dashboard owner + review cadence. (e) Publish per Comm plan.
- **Responsible owner.** Analyst.
- **Supporting roles.** Black Belt; Analytics partner.
- **Effort.** 120 min. **Duration.** 1 d. **BAM type.** Deep.
- **Predecessors.** `dmaic_measure_07`. **Successors.** `dmaic_measure_13`.
- **Required tools.** Dashboard platform; data connection.
- **Deliverables.** Continuous Reporting Dashboard (A13).
- **Outputs.** Live URL.
- **Acceptance criteria.** Dashboard live; owner named; 4+ cards.
- **Statistical requirements.** None directly.
- **Risk if skipped.** Stakeholders lose visibility; project becomes private.
- **Standardization.** M. **AI-support.** Composer Explainer. **Automation.** M.

---

**`dmaic_measure_12` — Finance cost-basis sign-off on Y** → `#28`
- **Phase.** MEASURE.
- **Purpose.** Finance signs off on cost-basis used in CTQ Y (if cost-class).
- **Operational definition.** Finance written ack; captured in Charter annex.
- **Required inputs.** CTQ Tree; Baseline data.
- **Source of inputs.** `dmaic_define_11`, `dmaic_measure_07`.
- **Activity steps.** (a) Walk Finance through cost-basis (fully-loaded vs marginal vs activity-based). (b) Capture ack. (c) File.
- **Responsible owner.** Black Belt.
- **Supporting roles.** Finance partner.
- **Effort.** 30 min. **Duration.** 0.5 d. **BAM type.** Communication.
- **Predecessors.** `dmaic_measure_07`. **Successors.** `dmaic_measure_13`.
- **Required tools.** —.
- **Deliverables.** Finance Cost-Basis Ack.
- **Outputs.** Ack letter/email.
- **Acceptance criteria.** Finance signature; cost-basis stated.
- **Statistical requirements.** None.
- **Risk if skipped.** ROI disputed at close.
- **Standardization.** H. **AI-support.** —. **Automation.** L.

---

**`dmaic_measure_13` — Stakeholder baseline walk-through** → `#28`
- **Phase.** MEASURE.
- **Purpose.** Process Owner + Sponsor approve baseline characterization.
- **Operational definition.** Sign-off captured on Baseline summary; "baseline is representative" attestation.
- **Required inputs.** A09, A10, A11, A12.
- **Source of inputs.** Measure tasks above.
- **Activity steps.** (a) Meeting with PO + Sponsor. (b) Walk baseline, MSA, capability. (c) Address challenges. (d) Capture sign-off.
- **Responsible owner.** Black Belt.
- **Supporting roles.** Process Owner; Sponsor; Analyst.
- **Effort.** 60 min. **Duration.** 0.5 d. **BAM type.** Communication.
- **Predecessors.** `dmaic_measure_10`, `dmaic_measure_11`, `dmaic_measure_12`. **Successors.** `dmaic_measure_14`.
- **Required tools.** Meeting.
- **Deliverables.** Baseline Sign-off Memo.
- **Outputs.** Signatures.
- **Acceptance criteria.** PO + Sponsor signatures.
- **Statistical requirements.** None directly.
- **Risk if skipped.** Later dispute on what "baseline" meant.
- **Standardization.** M. **AI-support.** —. **Automation.** L.

---

**`dmaic_measure_14` — Stratification analysis (subgroup comparison)** → `#28`
- **Phase.** MEASURE.
- **Purpose.** Test whether Y varies by stratum (shift, operator, region, etc.) — primes Analyze hypotheses.
- **Operational definition.** Stratification doc with 2–5 strata tested; ANOVA or chi-square per stratum; p-values.
- **Required inputs.** Baseline dataset with stratification columns.
- **Source of inputs.** `dmaic_measure_07`.
- **Activity steps.** (a) Identify strata (from DCP). (b) For each, run ANOVA (continuous Y) or chi-square (discrete Y). (c) Report p-values; note strata with p < 0.05. (d) Feed forward to C&E Matrix.
- **Responsible owner.** Analyst.
- **Supporting roles.** Black Belt.
- **Effort.** 90 min. **Duration.** 0.5 d. **BAM type.** Deep.
- **Predecessors.** `dmaic_measure_08`. **Successors.** `dmaic_analyze_02`.
- **Required tools.** Statistical package.
- **Deliverables.** Stratification Report.
- **Outputs.** ANOVA/chi-square tables.
- **Acceptance criteria.** ≥ 2 strata tested; p-values reported.
- **Statistical requirements.** ANOVA α = 0.05; chi-square α = 0.05; apply Bonferroni if >3 strata tested simultaneously.
- **Risk if skipped.** Analyze phase misses obvious stratum effects.
- **Standardization.** H. **AI-support.** Planning Agent. **Automation.** H.

---

**`dmaic_measure_15` — MBB peer-review: MSA + Baseline gate** → phase-gate
- **Phase.** MEASURE.
- **Purpose.** MBB signs off that MSA is acceptable and Baseline is representative.
- **Operational definition.** MBB signature on MSA (A10) and Baseline stats (A09 summary).
- **Required inputs.** A09, A10, A11, A12.
- **Source of inputs.** Measure tasks.
- **Activity steps.** (a) MBB reviews. (b) Black Belt walks MSA decisions. (c) MBB reviews normality/transform choices. (d) MBB signs OR requests rework.
- **Responsible owner.** Black Belt.
- **Supporting roles.** MBB.
- **Effort.** 60 min. **Duration.** 0.5 d. **BAM type.** Communication.
- **Predecessors.** `dmaic_measure_13`. **Successors.** `dmaic_measure_16`.
- **Required tools.** —.
- **Deliverables.** MBB MSA+Baseline sign-off.
- **Outputs.** Signature or rework list.
- **Acceptance criteria.** MBB signs.
- **Statistical requirements.** R&R < 30%; Kappa ≥ 0.7; n ≥ plan; normality disposition documented.
- **Risk if skipped.** Downstream Analyze runs on shaky foundation.
- **Standardization.** H. **AI-support.** Planning Agent (pre-run statistical lint). **Automation.** M.

---

**`dmaic_measure_16` — Lock Baseline and close `#28`** → `#28`
- **Phase.** MEASURE.
- **Purpose.** Freeze baseline dataset and stats; close the catalog entry.
- **Operational definition.** `#28` ScheduledActivity CLOSED with `outputArtifactRef` pointing to dataset + stats; BaselineMetric locked if used by engine.
- **Required inputs.** MBB sign-off; stakeholder sign-off.
- **Source of inputs.** `dmaic_measure_13`, `dmaic_measure_15`.
- **Activity steps.** (a) Bind artifact ref. (b) Close ScheduledActivity. (c) Lock BaselineMetric (if engine has this entity for DMAIC).
- **Responsible owner.** Black Belt.
- **Supporting roles.** —.
- **Effort.** 15 min. **Duration.** 0.25 d. **BAM type.** Deep.
- **Predecessors.** `dmaic_measure_15`. **Successors.** `dmaic_measure_17`.
- **Required tools.** CadencePlan.
- **Deliverables.** Close event.
- **Outputs.** `#28` CLOSED.
- **Acceptance criteria.** CLOSED state; artifact linked.
- **Statistical requirements.** None directly — statistical rigor verified upstream.
- **Risk if skipped.** Engine cannot derive phase transition.
- **Standardization.** H. **AI-support.** —. **Automation.** H.

---

**`dmaic_measure_17` — Close `#29` and `#30`; emit phase-advanced event** → `#29`, `#30`
- **Phase.** MEASURE.
- **Purpose.** Close baseline Control Chart and Capability entries; `phaseFor()` recomputes to MEASURE→ANALYZE.
- **Operational definition.** Both ScheduledActivities CLOSED with output artifacts.
- **Required inputs.** A11, A12.
- **Source of inputs.** `dmaic_measure_09`, `dmaic_measure_10`.
- **Activity steps.** (a) Close both. (b) Engine recomputes `phaseFor()`. (c) `ProjectPhaseAdvanced` event emitted if phase changes.
- **Responsible owner.** Black Belt.
- **Supporting roles.** —.
- **Effort.** 15 min. **Duration.** 0.25 d. **BAM type.** Deep.
- **Predecessors.** `dmaic_measure_16`. **Successors.** `dmaic_measure_18`.
- **Required tools.** CadencePlan.
- **Deliverables.** Close events.
- **Outputs.** Phase transition.
- **Acceptance criteria.** Both CLOSED; event emitted.
- **Statistical requirements.** None.
- **Risk if skipped.** Analyze payload stays hidden.
- **Standardization.** H. **AI-support.** —. **Automation.** H.

---

**`dmaic_measure_18` — Phase-gate review: MEASURE close** → phase-gate
- **Phase.** MEASURE.
- **Purpose.** MBB + Sponsor + Process Owner review; decide ADVANCE to Analyze.
- **Operational definition.** Gate review record.
- **Required inputs.** All Measure artifacts.
- **Source of inputs.** Measure tasks.
- **Activity steps.** (a) Walk Part 8.8 Measure gate questions. (b) Decide.
- **Responsible owner.** Black Belt.
- **Supporting roles.** MBB; Sponsor; PO.
- **Effort.** 60 min. **Duration.** 0.5 d. **BAM type.** Communication.
- **Predecessors.** `dmaic_measure_17`. **Successors.** `dmaic_analyze_01`.
- **Required tools.** —.
- **Deliverables.** Gate record.
- **Outputs.** ADVANCE / REWORK.
- **Acceptance criteria.** Gate questions answered.
- **Statistical requirements.** All Measure stat gates passed.
- **Risk if skipped.** Weak Measure carries forward.
- **Standardization.** H. **AI-support.** —. **Automation.** M.


### ANALYZE phase (20 tasks) — target 2–4 sprints

---

**`dmaic_analyze_01` — Build Detailed Current-State Process Map** → `#32`
- **Phase.** ANALYZE.
- **Purpose.** Decompose SIPOC high-level steps into 3–7 detailed sub-processes with timing, VA/NVA tagging, and measurement points.
- **Operational definition.** Detailed map (swimlane format) with ≥ 15 activities; cycle time + wait time per activity; VA/NVA tag per activity; 1–3 measurement points per sub-process.
- **Required inputs.** SIPOC (A02); Baseline observations (A09); SME knowledge.
- **Source of inputs.** `dmaic_define_05`, `dmaic_measure_07`.
- **Activity steps.** (a) Open SIPOC. (b) Pick each high-level step; decompose into 3–7 sub-activities. (c) Capture cycle time + wait time per activity. (d) Tag each activity VA / NVA / NVA-necessary. (e) Identify measurement opportunities. (f) Validate with SMEs.
- **Responsible owner.** Black Belt.
- **Supporting roles.** SMEs (3–5); Process Owner.
- **Effort.** 240 min. **Duration.** 2 d. **BAM type.** Deep.
- **Predecessors.** `dmaic_measure_18`. **Successors.** `dmaic_analyze_02`.
- **Required tools.** Swimlane tool (Lucidchart, Visio, Miro).
- **Deliverables.** Detailed Process Map (A14).
- **Outputs.** Map; VA/NVA ratio; measurement-point list.
- **Acceptance criteria.** ≥15 activities; VA/NVA tagged; SME validation signed.
- **Statistical requirements.** None (descriptive).
- **Risk if skipped.** C&E Matrix builds on fuzzy process understanding.
- **Standardization.** M. **AI-support.** Composer Explainer (first-draft from event logs via process mining). **Automation.** M.

---

**`dmaic_analyze_02` — Brainstorm candidate X's (Ishikawa / 6M)** → `#34`
- **Phase.** ANALYZE.
- **Purpose.** Enumerate candidate inputs (X's) via fishbone in 6M categories: Man, Machine, Material, Method, Measurement, Environment.
- **Operational definition.** Ishikawa diagram with ≥ 20 candidate X's across 6 categories.
- **Required inputs.** Detailed Process Map; SIPOC Inputs; Stratification results.
- **Source of inputs.** `dmaic_analyze_01`, `dmaic_define_05`, `dmaic_measure_14`.
- **Activity steps.** (a) Facilitate 90-min session. (b) Draw fishbone spine on primary Y. (c) Per 6M category, brainstorm X's. (d) Ask "why?" for each. (e) Consolidate. (f) Feed all X's to C&E matrix.
- **Responsible owner.** Black Belt.
- **Supporting roles.** SMEs; Process Owner.
- **Effort.** 120 min. **Duration.** 1 d. **BAM type.** Deep.
- **Predecessors.** `dmaic_analyze_01`. **Successors.** `dmaic_analyze_03`.
- **Required tools.** Fishbone template.
- **Deliverables.** Fishbone Diagram (fragment of A15).
- **Outputs.** ≥20 X's.
- **Acceptance criteria.** All 6M categories populated.
- **Statistical requirements.** None (generative).
- **Risk if skipped.** C&E operates on too-narrow X-list.
- **Standardization.** M. **AI-support.** Composer Explainer. **Automation.** L.

---

**`dmaic_analyze_03` — Author Cause & Effect Matrix (SIPOC Inputs × CTQ Outputs)** → `#34`
- **Phase.** ANALYZE.
- **Purpose.** Score every X against every Y on impact (0/1/4/9); weight by Customer Importance; prioritize vital few X's.
- **Operational definition.** C&E Matrix with rows = X's, columns = Y's, weighted scores.
- **Required inputs.** SIPOC (A02); Fishbone (A15 frag); CTQ Tree (A06).
- **Source of inputs.** `dmaic_define_05`, `dmaic_analyze_02`, `dmaic_define_11`.
- **Activity steps.** (a) Populate Inputs (rows). (b) Populate Outputs (columns). (c) Customer-Importance (1–10). (d) Each participant rates X-vs-Y (0/1/4/9). (e) Consensus-align. (f) Compute weighted score. (g) Rank. (h) Identify top 6–8 vital few.
- **Responsible owner.** Black Belt.
- **Supporting roles.** Team (4–8 participants).
- **Effort.** 240 min. **Duration.** 2 d. **BAM type.** Deep.
- **Predecessors.** `dmaic_analyze_02`. **Successors.** `dmaic_analyze_04`.
- **Required tools.** C&E template.
- **Deliverables.** Cause & Effect Matrix (A15).
- **Outputs.** Ranked X list.
- **Acceptance criteria.** Every X rated vs every Y; consensus captured; top X's identified.
- **Statistical requirements.** None (validation is in #36).
- **Risk if skipped.** Input DCP measures wrong X's.
- **Standardization.** H. **AI-support.** Composer Explainer; Planning Agent (flags anchoring bias). **Automation.** M.

---

**`dmaic_analyze_04` — Author Input Data Collection Plan (Input DCP)** → `#35`
- **Phase.** ANALYZE.
- **Purpose.** Define how to collect the top-scored X's paired with Y observations.
- **Operational definition.** Input DCP with one row per prioritized X: operational definition, unit, method, sampling (n ≥ 30 paired X-Y), owner, tool, time-stamp key.
- **Required inputs.** C&E Matrix top X's; Data Dictionary.
- **Source of inputs.** `dmaic_analyze_03`, `dmaic_measure_02`.
- **Activity steps.** (a) Take top 4–6 X's. (b) Operational definition per X. (c) Unit + method. (d) Sampling plan. (e) Time-stamp key. (f) MSA for subjective/manual X's. (g) Pilot 1 cycle. (h) Lock.
- **Responsible owner.** Black Belt.
- **Supporting roles.** Analyst; Process Owner.
- **Effort.** 180 min. **Duration.** 1 d. **BAM type.** Deep.
- **Predecessors.** `dmaic_analyze_03`. **Successors.** `dmaic_analyze_05`.
- **Required tools.** DCP template.
- **Deliverables.** Input Data Collection Plan (A16).
- **Outputs.** DCP rows.
- **Acceptance criteria.** Every X has all fields; MSA-risk flagged; pilot passed.
- **Statistical requirements.** n ≥ 30 paired X-Y; stratification declared.
- **Risk if skipped.** X data unjoinable to Y.
- **Standardization.** H. **AI-support.** Composer Explainer; Planning Agent. **Automation.** M.

---

**`dmaic_analyze_05` — Execute Input DCP data collection** → `#35`
- **Phase.** ANALYZE.
- **Purpose.** Collect paired X-Y observations.
- **Operational definition.** Paired dataset with n ≥ 30 per X, joined via time-stamp.
- **Required inputs.** Input DCP (A16); access.
- **Source of inputs.** `dmaic_analyze_04`.
- **Activity steps.** (a) Execute per DCP 1–2 sprints. (b) Join X rows to Y rows. (c) QA joins. (d) Store paired dataset.
- **Responsible owner.** Analyst.
- **Supporting roles.** Black Belt; SMEs.
- **Effort.** 480 min cumulative. **Duration.** 7–10 d. **BAM type.** Deep.
- **Predecessors.** `dmaic_analyze_04`. **Successors.** `dmaic_analyze_06`.
- **Required tools.** Per DCP.
- **Deliverables.** Paired X-Y Dataset (fragment of A17).
- **Outputs.** Dataset n ≥ 30.
- **Acceptance criteria.** n ≥ 30 per X; join verified.
- **Statistical requirements.** n ≥ 30 paired; missing-data rate < 10%.
- **Risk if skipped.** Regression on sparse data.
- **Standardization.** H. **AI-support.** Planning Agent. **Automation.** M.

---

**`dmaic_analyze_06` — Pairwise correlation analysis** → `#36`
- **Phase.** ANALYZE.
- **Purpose.** Compute pairwise correlations X-vs-Y and X-vs-X; identify multicollinearity candidates.
- **Operational definition.** Correlation matrix with Pearson (linear) or Spearman (non-linear); flag |r| > 0.4 for X-Y; flag |r| > 0.7 for X-X.
- **Required inputs.** Paired dataset.
- **Source of inputs.** `dmaic_analyze_05`.
- **Activity steps.** (a) Load dataset. (b) Choose Pearson or Spearman per distribution. (c) Compute correlation matrix. (d) Heat-map visualization. (e) Flag X-Y |r| > 0.4. (f) Flag X-X |r| > 0.7.
- **Responsible owner.** Analyst.
- **Supporting roles.** Black Belt.
- **Effort.** 60 min. **Duration.** 0.5 d. **BAM type.** Deep.
- **Predecessors.** `dmaic_analyze_05`. **Successors.** `dmaic_analyze_07`.
- **Required tools.** Statistical package.
- **Deliverables.** Correlation Matrix (fragment of A17).
- **Outputs.** Matrix; flagged pairs.
- **Acceptance criteria.** Matrix computed; Pearson/Spearman choice documented.
- **Statistical requirements.** Pearson assumes linearity + normality; Spearman non-linear. α = 0.05.
- **Risk if skipped.** Regression blindly includes collinear X's.
- **Standardization.** H. **AI-support.** —. **Automation.** H.

---

**`dmaic_analyze_07` — Declare hypothesis list (pre-registration)** → `#36`
- **Phase.** ANALYZE.
- **Purpose.** Pre-register hypotheses to prevent p-hacking.
- **Operational definition.** Pre-registration doc: each H0/H1 stated; test type; α; family-wise correction method (Bonferroni / FDR) if > 3 tests.
- **Required inputs.** Correlation results; C&E top X's.
- **Source of inputs.** `dmaic_analyze_03`, `dmaic_analyze_06`.
- **Activity steps.** (a) List hypotheses (one per X). (b) Per: H0, H1, α, test. (c) Count total tests. (d) If > 3, declare Bonferroni or FDR. (e) File BEFORE running tests.
- **Responsible owner.** Black Belt.
- **Supporting roles.** MBB (pre-exec review).
- **Effort.** 45 min. **Duration.** 0.25 d. **BAM type.** Deep.
- **Predecessors.** `dmaic_analyze_06`. **Successors.** `dmaic_analyze_08`.
- **Required tools.** Template.
- **Deliverables.** Hypothesis Pre-Registration (fragment of A20).
- **Outputs.** Pre-registered list.
- **Acceptance criteria.** All tests declared before data tested; correction declared.
- **Statistical requirements.** α = 0.05 default; power 0.80; correction if k > 3.
- **Risk if skipped.** Open-ended fishing → false positives.
- **Standardization.** H. **AI-support.** Planning Agent. **Automation.** M.

---

**`dmaic_analyze_08` — Execute hypothesis tests** → `#36`
- **Phase.** ANALYZE.
- **Purpose.** Run pre-registered tests; report p-values; apply correction.
- **Operational definition.** Test results log with test name, statistic, p, CI, effect size per hypothesis; corrected p' if applicable.
- **Required inputs.** Pre-registration; paired dataset.
- **Source of inputs.** `dmaic_analyze_07`, `dmaic_analyze_05`.
- **Activity steps.** (a) Run each pre-registered test. (b) Report statistic + p + CI. (c) Compute effect size (Cohen's d, φ). (d) Apply Bonferroni/FDR. (e) Flag significant-and-meaningful.
- **Responsible owner.** Analyst.
- **Supporting roles.** Black Belt.
- **Effort.** 120 min. **Duration.** 0.5 d. **BAM type.** Deep.
- **Predecessors.** `dmaic_analyze_07`. **Successors.** `dmaic_analyze_09`.
- **Required tools.** Statistical package.
- **Deliverables.** Hypothesis Test Results (A20).
- **Outputs.** Significant-X flagged list.
- **Acceptance criteria.** All tests executed; correction applied.
- **Statistical requirements.** Appropriate test per data type (Part 6.4); effect size always reported; CI always reported.
- **Risk if skipped.** Claim cause without evidence.
- **Standardization.** H. **AI-support.** —. **Automation.** H.

---

**`dmaic_analyze_09` — Fit regression model (simple then multiple)** → `#36`
- **Phase.** ANALYZE.
- **Purpose.** Quantify X-Y relationship via regression; check diagnostics; identify vital X's.
- **Operational definition.** Regression output: coefficients, R², adj-R², p-values, VIF, residual plots, normality of residuals.
- **Required inputs.** Paired dataset; significant X's.
- **Source of inputs.** `dmaic_analyze_05`, `dmaic_analyze_08`.
- **Activity steps.** (a) Simple linear per X. (b) Assess R², p, slope. (c) Residuals: homoscedasticity, independence, normality. (d) Multiple regression. (e) VIF (flag > 10). (f) Logistic / non-linear if Y binary/non-linear. (g) Final model + vital X's + CIs on coefficients.
- **Responsible owner.** Analyst.
- **Supporting roles.** Black Belt; MBB (diagnostics review).
- **Effort.** 180 min. **Duration.** 1 d. **BAM type.** Deep.
- **Predecessors.** `dmaic_analyze_08`. **Successors.** `dmaic_analyze_10`.
- **Required tools.** Statistical package.
- **Deliverables.** Regression Report (fragment of A17).
- **Outputs.** Model; vital X's.
- **Acceptance criteria.** Diagnostics passed; model documented.
- **Statistical requirements.** R² and adj-R²; residual plots clean; VIF < 10; residual normality; logistic if Y binary; α = 0.05 on coefficients.
- **Risk if skipped.** Quantified relationship unknown.
- **Standardization.** H (process); judgment-heavy (form). **AI-support.** Planning Agent. **Automation.** M.

---

**`dmaic_analyze_10` — Causation validation: confound-check + temporal precedence** → `#36`
- **Phase.** ANALYZE.
- **Purpose.** Rule out alternative explanations before calling X a cause of Y.
- **Operational definition.** Confound-check table: per vital X, alternative explanations (third-variable, reverse-causation, chance, selection bias) + evidence against each.
- **Required inputs.** Regression results; vital X list.
- **Source of inputs.** `dmaic_analyze_09`.
- **Activity steps.** (a) Per vital X, 3 alternatives. (b) Per alternative, evidence (temporal precedence; mechanism; no-confound via stratified analysis; replicated). (c) Optional DOE (`dmaic_analyze_15`). (d) If any alternative not ruled out, downgrade to correlate-only.
- **Responsible owner.** Black Belt.
- **Supporting roles.** MBB (mandatory peer-review); SMEs (mechanism).
- **Effort.** 120 min. **Duration.** 1 d. **BAM type.** Deep.
- **Predecessors.** `dmaic_analyze_09`. **Successors.** `dmaic_analyze_11`.
- **Required tools.** Confound template.
- **Deliverables.** Confound-Check Table (fragment of A18).
- **Outputs.** Validated-cause vs correlate-only list.
- **Acceptance criteria.** Per vital X, all 4 alternatives addressed; MBB signs.
- **Statistical requirements.** Temporal precedence attested; mechanism named; stratified analysis if confound suspected.
- **Risk if skipped.** Implement countermeasure on correlate → no improvement.
- **Standardization.** M. **AI-support.** Planning Agent (confound library); Composer Explainer. **Automation.** L.

---

**`dmaic_analyze_11` — Author Root Cause Summary** → `#36`
- **Phase.** ANALYZE.
- **Purpose.** Consolidate vital X's with evidence into a root-cause summary.
- **Operational definition.** 1–2 page summary: per root cause: mechanism, evidence, effect-size estimate, improvement lever.
- **Required inputs.** Regression; confound-check; FMEA.
- **Source of inputs.** `dmaic_analyze_09`, `dmaic_analyze_10`.
- **Activity steps.** (a) List validated causes. (b) Per: mechanism, evidence, effect, lever. (c) Rank. (d) File.
- **Responsible owner.** Black Belt.
- **Supporting roles.** MBB.
- **Effort.** 90 min. **Duration.** 0.5 d. **BAM type.** Deep.
- **Predecessors.** `dmaic_analyze_10`. **Successors.** `dmaic_analyze_12`.
- **Required tools.** Template.
- **Deliverables.** Root Cause Summary (A18).
- **Outputs.** Ranked causes.
- **Acceptance criteria.** Per cause: 4 fields; MBB signs.
- **Statistical requirements.** Effect-size from regression CI.
- **Risk if skipped.** Improve unfocused.
- **Standardization.** M. **AI-support.** Composer Explainer. **Automation.** M.

---

**`dmaic_analyze_12` — Conduct FMEA session (Severity × Occurrence × Detection)** → `#37`
- **Phase.** ANALYZE.
- **Purpose.** Enumerate failure modes, effects, rank by RPN = S×O×D.
- **Operational definition.** FMEA artifact: row per mode; columns: step, mode, effect, S (1–10), cause, O (1–10), controls, D (1–10), RPN, action.
- **Required inputs.** Detailed Process Map; validated root causes; SMEs.
- **Source of inputs.** `dmaic_analyze_01`, `dmaic_analyze_11`.
- **Activity steps.** (a) 3-hour session. (b) Per step, brainstorm failure modes. (c) Effects. (d) S rating. (e) Causes. (f) O rating. (g) Current detection. (h) D rating. (i) RPN. (j) Recommended action for top-RPN (> 100 or top quartile). (k) Owner per action.
- **Responsible owner.** Black Belt.
- **Supporting roles.** Team (4–6).
- **Effort.** 240 min (session + consolidation). **Duration.** 2 d. **BAM type.** Deep.
- **Predecessors.** `dmaic_analyze_01`, `dmaic_analyze_11`. **Successors.** `dmaic_analyze_13`.
- **Required tools.** FMEA template.
- **Deliverables.** FMEA (A19).
- **Outputs.** Scored failure modes; action list.
- **Acceptance criteria.** ≥ 15 modes; ≥ 3 actions for top RPN; owner per action.
- **Statistical requirements.** None (risk-based).
- **Risk if skipped.** High-risk modes unprotected.
- **Standardization.** H (template). **AI-support.** Composer Explainer. **Automation.** M.

---

**`dmaic_analyze_13` — Cross-reference FMEA to vital X's and validated causes** → `#37`
- **Phase.** ANALYZE.
- **Purpose.** Ensure top RPN aligns with vital X's; flag uncovered root causes.
- **Operational definition.** Cross-reference table: root cause → FMEA mode(s); coverage check.
- **Required inputs.** FMEA; Root Cause Summary.
- **Source of inputs.** `dmaic_analyze_11`, `dmaic_analyze_12`.
- **Activity steps.** (a) Per root cause, map to modes. (b) Flag uncovered causes. (c) Add FMEA rows if needed. (d) Flag top-RPN not tied to validated cause.
- **Responsible owner.** Black Belt.
- **Supporting roles.** Team.
- **Effort.** 60 min. **Duration.** 0.5 d. **BAM type.** Deep.
- **Predecessors.** `dmaic_analyze_11`, `dmaic_analyze_12`. **Successors.** `dmaic_analyze_14`.
- **Required tools.** Spreadsheet.
- **Deliverables.** FMEA-RootCause Cross-Ref.
- **Outputs.** Coverage matrix.
- **Acceptance criteria.** Every cause covered; every top-RPN mapped or justified.
- **Statistical requirements.** None.
- **Risk if skipped.** Improve targets wrong modes.
- **Standardization.** H. **AI-support.** Planning Agent. **Automation.** M.

---

**`dmaic_analyze_14` — Identify Quick Win candidates** → `#33`
- **Phase.** ANALYZE.
- **Purpose.** Flag candidates meeting Quick Win filter (lead < 1 wk AND cost < $1K AND effort < 2 person-days AND reversible).
- **Operational definition.** Quick Win Candidate Log.
- **Required inputs.** Root Cause Summary; FMEA actions.
- **Source of inputs.** `dmaic_analyze_11`, `dmaic_analyze_12`.
- **Activity steps.** (a) Walk actions. (b) Apply filter. (c) PO approves.
- **Responsible owner.** Black Belt.
- **Supporting roles.** Process Owner.
- **Effort.** 45 min. **Duration.** 0.25 d. **BAM type.** Deep.
- **Predecessors.** `dmaic_analyze_12`. **Successors.** `dmaic_improve_01`.
- **Required tools.** Filter spreadsheet.
- **Deliverables.** Quick Win Candidate Log.
- **Outputs.** Flagged candidates.
- **Acceptance criteria.** Filter applied; PO approval.
- **Statistical requirements.** None.
- **Risk if skipped.** Pre-Improve fixes bundled into pilot.
- **Standardization.** H. **AI-support.** Planning Agent. **Automation.** H.

---

**`dmaic_analyze_15` — Design DOE (if causation requires controlled test)** → `#36`
- **Phase.** ANALYZE.
- **Purpose.** Design controlled experiment to confirm causal effect.
- **Operational definition.** DOE plan: factors, levels, response, run sheet, replicates, randomization, analysis plan.
- **Required inputs.** Vital X's; confound-check; statistical package.
- **Source of inputs.** `dmaic_analyze_09`, `dmaic_analyze_10`.
- **Activity steps.** (a) Pick factors (1–3 X's). (b) Levels (2–3). (c) Design (2-level full factorial ≤3 factors; fractional for 4+). (d) Replicates (for power). (e) Randomize run order. (f) Define response. (g) ANOVA analysis plan. (h) MBB reviews.
- **Responsible owner.** Black Belt.
- **Supporting roles.** Analyst; MBB.
- **Effort.** 120 min. **Duration.** 1 d. **BAM type.** Deep.
- **Predecessors.** `dmaic_analyze_10`. **Successors.** `dmaic_analyze_16` (if DOE runs).
- **Required tools.** Statistical package (DOE module).
- **Deliverables.** DOE Plan (fragment of A17).
- **Outputs.** Run sheet.
- **Acceptance criteria.** MBB signs design; power ≥ 0.80.
- **Statistical requirements.** Power analysis: effect size, α = 0.05, power ≥ 0.80.
- **Risk if skipped.** Causation rests on observational alone.
- **Standardization.** M. **AI-support.** Planning Agent. **Automation.** M.
- **Notes.** Optional; required for high-value or regulated changes.

---

**`dmaic_analyze_16` — Execute DOE and analyze** → `#36`
- **Phase.** ANALYZE.
- **Purpose.** Run the DOE; ANOVA; confirm/reject causal effect.
- **Operational definition.** DOE data + ANOVA + main effects + interaction plots + residuals.
- **Required inputs.** DOE plan; execution environment.
- **Source of inputs.** `dmaic_analyze_15`.
- **Activity steps.** (a) Execute runs randomized. (b) Collect response. (c) Analyze main effects + interactions + residuals. (d) Report significant factors with effect size.
- **Responsible owner.** Analyst.
- **Supporting roles.** Black Belt; SMEs.
- **Effort.** Variable (8–40 h). **Duration.** 3–7 d. **BAM type.** Deep.
- **Predecessors.** `dmaic_analyze_15`. **Successors.** `dmaic_analyze_17`.
- **Required tools.** Statistical package.
- **Deliverables.** DOE Results (fragment of A17).
- **Outputs.** Confirmed/rejected factors.
- **Acceptance criteria.** ANOVA complete; residuals clean; effects with CI.
- **Statistical requirements.** ANOVA α = 0.05; residual normality; power sufficient.
- **Risk if skipped.** Design without execution wastes planning.
- **Standardization.** H. **AI-support.** —. **Automation.** H.

---

**`dmaic_analyze_17` — MBB peer-review: Regression + causation gate** → phase-gate
- **Phase.** ANALYZE.
- **Purpose.** MBB signs off on regression and causation validation before Improve opens.
- **Operational definition.** MBB signature on A17, A18, A19.
- **Required inputs.** A17, A18, A19.
- **Source of inputs.** Analyze tasks.
- **Activity steps.** (a) MBB reviews regression. (b) MBB reviews confound-check. (c) MBB reviews FMEA. (d) Signs or rework.
- **Responsible owner.** Black Belt.
- **Supporting roles.** MBB.
- **Effort.** 90 min. **Duration.** 0.5 d. **BAM type.** Communication.
- **Predecessors.** `dmaic_analyze_11`, `dmaic_analyze_13`, (`dmaic_analyze_16` if DOE). **Successors.** `dmaic_analyze_18`.
- **Required tools.** —.
- **Deliverables.** MBB sign-off.
- **Outputs.** Sign-off or rework.
- **Acceptance criteria.** MBB signs.
- **Statistical requirements.** All Analyze stat gates (pre-reg, correction, diagnostics, causation).
- **Risk if skipped.** Improve on unvalidated cause.
- **Standardization.** H. **AI-support.** Planning Agent. **Automation.** M.

---

**`dmaic_analyze_18` — Close Analyze catalog entries; emit phase-advanced** → `#32`,`#34`,`#35`,`#36`,`#37`
- **Phase.** ANALYZE.
- **Purpose.** Close Analyze entries; `phaseFor()` recomputes to IMPROVE.
- **Operational definition.** All Analyze ScheduledActivities CLOSED.
- **Required inputs.** All Analyze artifacts.
- **Source of inputs.** Analyze tasks.
- **Activity steps.** (a) Close each with artifact ref. (b) Engine recomputes phase.
- **Responsible owner.** Black Belt.
- **Effort.** 30 min. **Duration.** 0.25 d. **BAM type.** Deep.
- **Predecessors.** `dmaic_analyze_17`. **Successors.** `dmaic_analyze_19`.
- **Required tools.** CadencePlan.
- **Deliverables.** Close events.
- **Outputs.** Phase advance.
- **Acceptance criteria.** All CLOSED.
- **Statistical requirements.** None.
- **Risk if skipped.** Improve payload hidden.
- **Standardization.** H. **AI-support.** —. **Automation.** H.

---

**`dmaic_analyze_19` — Phase-gate review: ANALYZE close** → phase-gate
- **Phase.** ANALYZE.
- **Purpose.** MBB + Sponsor + PO review; ADVANCE to Improve.
- **Operational definition.** Gate review record.
- **Required inputs.** All Analyze artifacts.
- **Source of inputs.** Analyze tasks.
- **Activity steps.** (a) Walk Part 8.8 Analyze gate questions. (b) Decide.
- **Responsible owner.** Black Belt.
- **Supporting roles.** MBB; Sponsor; PO.
- **Effort.** 90 min. **Duration.** 0.5 d. **BAM type.** Communication.
- **Predecessors.** `dmaic_analyze_18`. **Successors.** `dmaic_improve_01`.
- **Required tools.** —.
- **Deliverables.** Gate record.
- **Outputs.** ADVANCE/REWORK.
- **Acceptance criteria.** Gate questions answered.
- **Statistical requirements.** All Analyze gates met.
- **Risk if skipped.** Weak Analyze into Improve.
- **Standardization.** H. **AI-support.** —. **Automation.** M.

---

**`dmaic_analyze_20` — Knowledge handoff to Improve** → cross-phase
- **Phase.** ANALYZE.
- **Purpose.** Transfer vital-X + FMEA + root-cause findings to Improve team.
- **Operational definition.** Handoff session notes; new members briefed.
- **Required inputs.** Root Cause Summary; FMEA.
- **Source of inputs.** `dmaic_analyze_11`, `dmaic_analyze_12`.
- **Activity steps.** (a) 60-min handoff. (b) Walk vital X's. (c) Walk top FMEA actions. (d) Brief Implementation Lead.
- **Responsible owner.** Black Belt.
- **Supporting roles.** Implementation Lead; Process Owner.
- **Effort.** 60 min. **Duration.** 0.5 d. **BAM type.** Communication.
- **Predecessors.** `dmaic_analyze_19`. **Successors.** `dmaic_improve_01`.
- **Required tools.** Meeting.
- **Deliverables.** Handoff Notes.
- **Outputs.** Aligned team.
- **Acceptance criteria.** Team aligned.
- **Statistical requirements.** None.
- **Risk if skipped.** Improve starts slow.
- **Standardization.** M. **AI-support.** —. **Automation.** L.


### IMPROVE phase (17 tasks) — target 2–6 sprints

---

**`dmaic_improve_01` — Generate improvement ideation (solution brainstorm per vital X)** → `#38`
- **Phase.** IMPROVE.
- **Purpose.** Brainstorm multiple candidate countermeasures per vital X; widen the solution space before narrowing.
- **Operational definition.** Ideation log with ≥ 3 candidate solutions per vital X; target 4–6 X's × 3 = ~15+ ideas.
- **Required inputs.** Root Cause Summary; FMEA actions; Quick Win candidates.
- **Source of inputs.** `dmaic_analyze_11`, `dmaic_analyze_12`, `dmaic_analyze_14`.
- **Activity steps.** (a) 90-min session. (b) Per vital X, brainstorm ≥ 3 countermeasures. (c) Use techniques: error-proofing (poka-yoke), standardization, automation, training, process redesign. (d) Capture assumptions per idea. (e) Don't critique; widen the funnel.
- **Responsible owner.** Black Belt.
- **Supporting roles.** Team; Process Owner; SMEs.
- **Effort.** 120 min. **Duration.** 1 d. **BAM type.** Deep.
- **Predecessors.** `dmaic_analyze_20`. **Successors.** `dmaic_improve_02`.
- **Required tools.** Ideation template.
- **Deliverables.** Improvement Ideation Log (fragment of A23).
- **Outputs.** Candidate solutions per X.
- **Acceptance criteria.** ≥ 3 candidates per vital X; assumptions captured.
- **Statistical requirements.** None (generative).
- **Risk if skipped.** Team anchors on first idea.
- **Standardization.** M. **AI-support.** Composer Explainer (countermeasure pattern library). **Automation.** L.

---

**`dmaic_improve_02` — Prioritize improvement backlog (RICE / WSJF / Impact × Confidence ÷ Effort)** → `#38`
- **Phase.** IMPROVE.
- **Purpose.** Score ideas; produce ranked improvement backlog with Day-2-Done criteria.
- **Operational definition.** Backlog artifact: rank, name, description, Day-2-Done, effort, expected impact, confidence, dependencies, owner.
- **Required inputs.** Ideation log; expected effect estimates from regression.
- **Source of inputs.** `dmaic_improve_01`, `dmaic_analyze_09`.
- **Activity steps.** (a) Consolidate ideas. (b) Per idea, author Day-2-Done criterion (observable). (c) Effort estimate (hours or t-shirt). (d) Impact estimate (delta on primary Y). (e) Confidence (0.5–0.9). (f) Score. (g) Rank. (h) PO approves priority order.
- **Responsible owner.** Black Belt.
- **Supporting roles.** Process Owner (priority decisions); Implementation Lead.
- **Effort.** 90 min. **Duration.** 0.5 d. **BAM type.** Deep.
- **Predecessors.** `dmaic_improve_01`. **Successors.** `dmaic_improve_03`, `dmaic_improve_04`.
- **Required tools.** Backlog tool.
- **Deliverables.** Process Improvement Backlog (A23).
- **Outputs.** Ranked list.
- **Acceptance criteria.** Day-2-Done observable per item; PO approved ranking.
- **Statistical requirements.** None.
- **Risk if skipped.** Team implements by enthusiasm not evidence.
- **Standardization.** H. **AI-support.** Planning Agent. **Automation.** M.

---

**`dmaic_improve_03` — Execute Quick Wins (parallel track)** → `#33`
- **Phase.** IMPROVE.
- **Purpose.** Implement Quick Win candidates (per filter in `dmaic_analyze_14`) in parallel with pilot design.
- **Operational definition.** Each Quick Win implemented with before/after measurements (min 5 observations each side).
- **Required inputs.** Quick Win Candidate Log; PO approval.
- **Source of inputs.** `dmaic_analyze_14`.
- **Activity steps.** (a) Per candidate, get PO verbal approval if reversible. (b) Implement. (c) Measure before (if not already from Baseline). (d) Measure after (≥ 5 obs). (e) Decide keep / revert. (f) Log in Quick Wins Log.
- **Responsible owner.** Implementation Lead.
- **Supporting roles.** Black Belt; SMEs.
- **Effort.** 60–240 min per Quick Win. **Duration.** 1–10 d parallel. **BAM type.** Deep.
- **Predecessors.** `dmaic_analyze_14`. **Successors.** `dmaic_improve_05` (implementation log).
- **Required tools.** Per change.
- **Deliverables.** Quick Wins Log (A22).
- **Outputs.** Kept / reverted wins.
- **Acceptance criteria.** Before/after measured; kept wins feed backlog for scaling.
- **Statistical requirements.** Min n = 5 each side; non-parametric test (Mann-Whitney) for significance given small n.
- **Risk if skipped.** Small wins bundled into pilot (harder to measure).
- **Standardization.** M. **AI-support.** Momentum Agent. **Automation.** L.

---

**`dmaic_improve_04` — Design pilot (the strategic improvement experiment)** → `#40`
- **Phase.** IMPROVE.
- **Purpose.** Design a bounded pilot to test the vital-X countermeasure(s) at scale sufficient for statistical inference.
- **Operational definition.** Pilot plan: scope, duration, n required, control group (if A/B), measurement plan (same method as Baseline), success criteria, rollback plan, Sponsor approval.
- **Required inputs.** Backlog top items; Baseline DCP; validated root causes.
- **Source of inputs.** `dmaic_improve_02`, `dmaic_measure_01`, `dmaic_analyze_11`.
- **Activity steps.** (a) Scope pilot (process area, time window). (b) Compute n required for power (given expected effect size, α = 0.05, power = 0.80). (c) Plan control group if parallel A/B possible. (d) Reuse Baseline's measurement method (same operational definition). (e) Success criteria: p < 0.05 AND effect size meaningful. (f) Rollback criteria (what triggers abort). (g) Sponsor + PO approve.
- **Responsible owner.** Black Belt.
- **Supporting roles.** Analyst (power calc); Process Owner (scope); Sponsor (approval).
- **Effort.** 180 min. **Duration.** 1 d. **BAM type.** Deep.
- **Predecessors.** `dmaic_improve_02`. **Successors.** `dmaic_improve_05`.
- **Required tools.** Pilot plan template.
- **Deliverables.** Pilot Plan (A21).
- **Outputs.** Approved plan.
- **Acceptance criteria.** Sponsor + PO signatures; n computed with power; rollback defined.
- **Statistical requirements.** Power analysis: effect size, α = 0.05, power ≥ 0.80. If A/B, randomization method declared.
- **Risk if skipped.** Pilot data sparse; inconclusive results.
- **Standardization.** M. **AI-support.** Planning Agent (flags under-powered designs). **Automation.** M.

---

**`dmaic_improve_05` — Implement pilot countermeasures** → `#40`
- **Phase.** IMPROVE.
- **Purpose.** Execute the pilot per design; implement countermeasures in the scoped area.
- **Operational definition.** Implemented Changes Log with per-change entry: what, when, where, by whom, before/after.
- **Required inputs.** Pilot Plan; backlog items to implement; updated SOP drafts.
- **Source of inputs.** `dmaic_improve_04`, `dmaic_improve_02`.
- **Activity steps.** (a) Per backlog item in pilot scope, implement change per SOP. (b) Update SOP v2.0-draft. (c) Log change in Implemented Changes Log. (d) Notify stakeholders per Comm plan.
- **Responsible owner.** Implementation Lead.
- **Supporting roles.** Black Belt; SMEs; action owners.
- **Effort.** Variable (20–160 hours). **Duration.** 1–4 sprints. **BAM type.** Deep.
- **Predecessors.** `dmaic_improve_04`. **Successors.** `dmaic_improve_06`.
- **Required tools.** Per change.
- **Deliverables.** Implemented Changes Log (A25); SOP v2.0-draft.
- **Outputs.** Implemented changes.
- **Acceptance criteria.** Per item: Day-2-Done met; log entry complete.
- **Statistical requirements.** None during implementation; stats come at pilot results.
- **Risk if skipped.** Nothing changes; pilot invalid.
- **Standardization.** L. **AI-support.** Momentum Agent. **Automation.** L.

---

**`dmaic_improve_06` — Collect pilot data (same method as Baseline)** → `#40`
- **Phase.** IMPROVE.
- **Purpose.** Measure pilot-period performance identically to Baseline for apples-to-apples comparison.
- **Operational definition.** Pilot dataset with n per Pilot Plan; same operational definition, same sample frame, same exclusion rule as Baseline.
- **Required inputs.** Pilot running; Baseline DCP (A07); MSA-validated measurement system.
- **Source of inputs.** `dmaic_improve_05`, `dmaic_measure_01`.
- **Activity steps.** (a) Execute DCP during pilot window. (b) Apply identical exclusion rules. (c) Log deviations. (d) Store.
- **Responsible owner.** Analyst.
- **Supporting roles.** SMEs.
- **Effort.** Variable (matches baseline effort). **Duration.** 2–4 weeks. **BAM type.** Deep.
- **Predecessors.** `dmaic_improve_05`. **Successors.** `dmaic_improve_07`.
- **Required tools.** Per DCP.
- **Deliverables.** Pilot Dataset (A24 fragment).
- **Outputs.** Dataset.
- **Acceptance criteria.** n ≥ pilot plan; method parity attested.
- **Statistical requirements.** n per power calc; same method as Baseline.
- **Risk if skipped.** Can't compare pre vs post.
- **Standardization.** H. **AI-support.** Planning Agent (method drift lint). **Automation.** M.

---

**`dmaic_improve_07` — Compute pilot delta and statistical test** → `#40`
- **Phase.** IMPROVE.
- **Purpose.** Statistically compare pilot vs Baseline; compute delta; test hypothesis H0: no difference.
- **Operational definition.** Pilot Results artifact: summary stats pre/post, appropriate test (t / ANOVA / proportion / non-parametric), p-value, effect size, CI on delta.
- **Required inputs.** Baseline dataset; Pilot dataset.
- **Source of inputs.** `dmaic_measure_07`, `dmaic_improve_06`.
- **Activity steps.** (a) Load datasets. (b) Check assumptions (normality, equal variance). (c) Pick test: continuous = Welch's t or ANOVA; proportions = 2-proportion Z; categorical = χ²; non-normal = Mann-Whitney or Kruskal-Wallis. (d) Compute statistic + p + effect size (Cohen's d, φ, odds ratio). (e) Compute CI on delta. (f) Disposition: statistically significant AND meaningful → success; significant but tiny → inconclusive; not significant → failed.
- **Responsible owner.** Analyst.
- **Supporting roles.** Black Belt; MBB (reviews).
- **Effort.** 120 min. **Duration.** 0.5 d. **BAM type.** Deep.
- **Predecessors.** `dmaic_improve_06`. **Successors.** `dmaic_improve_08`.
- **Required tools.** Statistical package.
- **Deliverables.** Pilot Results (A24).
- **Outputs.** Delta, p, effect size, CI.
- **Acceptance criteria.** Test appropriate; p reported; effect size reported.
- **Statistical requirements.** p < 0.05 AND Cohen's d ≥ 0.5 (or domain-relevant %delta) for "success". Non-parametric if normality violated.
- **Risk if skipped.** Pilot "feels" better without proof.
- **Standardization.** H. **AI-support.** —. **Automation.** H.

---

**`dmaic_improve_08` — Go/No-Go decision per pilot** → `#40`
- **Phase.** IMPROVE.
- **Purpose.** Decide: scale, iterate, or abandon based on pilot results.
- **Operational definition.** Decision memo: scale / iterate / abandon; rationale tied to pilot results.
- **Required inputs.** Pilot Results.
- **Source of inputs.** `dmaic_improve_07`.
- **Activity steps.** (a) Review results with PO + Sponsor. (b) Decide: scale (if success criteria met), iterate (if partial), abandon (if not). (c) If iterate, update backlog and design next pilot. (d) If abandon, re-enter Analyze.
- **Responsible owner.** Process Owner (decision); Black Belt (analysis).
- **Supporting roles.** Sponsor; MBB.
- **Effort.** 60 min. **Duration.** 0.5 d. **BAM type.** Communication.
- **Predecessors.** `dmaic_improve_07`. **Successors.** `dmaic_improve_09` (scale) OR `dmaic_improve_04` (iterate) OR back to Analyze (abandon).
- **Required tools.** Decision memo.
- **Deliverables.** Pilot Decision Memo.
- **Outputs.** Decision logged.
- **Acceptance criteria.** PO + Sponsor sign decision.
- **Statistical requirements.** Decision tied to p + effect size from `dmaic_improve_07`.
- **Risk if skipped.** Scale without proof (false positive); abandon without learning.
- **Standardization.** M. **AI-support.** —. **Automation.** L.

---

**`dmaic_improve_09` — Scale countermeasures beyond pilot scope** → `#40`
- **Phase.** IMPROVE.
- **Purpose.** Roll out validated countermeasures to the full process scope.
- **Operational definition.** Scale plan executed; full scope covered; SOP v2.0 final.
- **Required inputs.** Scale decision; Pilot results; Implementation Backlog.
- **Source of inputs.** `dmaic_improve_08`, `dmaic_improve_02`.
- **Activity steps.** (a) Author scale plan (rollout sequence, timing). (b) Sponsor approves. (c) Execute rollout. (d) Update SOP v2.0 final. (e) Train affected teams.
- **Responsible owner.** Implementation Lead.
- **Supporting roles.** Black Belt; Process Owner; SMEs (training).
- **Effort.** Variable (40–160 hours). **Duration.** 2–6 weeks. **BAM type.** Deep.
- **Predecessors.** `dmaic_improve_08`. **Successors.** `dmaic_improve_10`.
- **Required tools.** Rollout tools.
- **Deliverables.** Scale Execution Log; SOP v2.0 final.
- **Outputs.** Rolled out.
- **Acceptance criteria.** Full scope covered; SOPs finalized; training confirmed.
- **Statistical requirements.** None during rollout; stats confirmed at Control rebaseline.
- **Risk if skipped.** Pilot wins don't sustain.
- **Standardization.** L. **AI-support.** Momentum Agent. **Automation.** L.

---

**`dmaic_improve_10` — Update SOPs (v2.0 final)** → `#40`
- **Phase.** IMPROVE.
- **Purpose.** Bump SOPs from v2.0-draft to v2.0-final after scale rollout.
- **Operational definition.** SOP repository shows v2.0-final per affected procedure; change log notes reference `#40`.
- **Required inputs.** SOP v2.0-draft; rollout evidence.
- **Source of inputs.** `dmaic_improve_05`, `dmaic_improve_09`.
- **Activity steps.** (a) Per SOP, apply final edits. (b) Bump version. (c) Publish. (d) Notify Process Owner.
- **Responsible owner.** Black Belt.
- **Supporting roles.** Process Owner (approves); SMEs.
- **Effort.** 120 min. **Duration.** 1 d. **BAM type.** Deep.
- **Predecessors.** `dmaic_improve_09`. **Successors.** `dmaic_improve_11`.
- **Required tools.** SOP repo.
- **Deliverables.** Final SOPs.
- **Outputs.** v2.0 final published.
- **Acceptance criteria.** PO signs.
- **Statistical requirements.** None.
- **Risk if skipped.** Drift post-Control.
- **Standardization.** H. **AI-support.** Composer Explainer (SOP delta generation). **Automation.** M.

---

**`dmaic_improve_11` — Close `#40 Implemented Improvements`** → `#40`
- **Phase.** IMPROVE.
- **Purpose.** Close catalog entry with artifact ref.
- **Operational definition.** `#40` ScheduledActivity CLOSED.
- **Required inputs.** Implemented Changes Log; Pilot Results; SOP v2.0 final.
- **Source of inputs.** `dmaic_improve_05`, `dmaic_improve_07`, `dmaic_improve_10`.
- **Activity steps.** (a) Bind artifact ref. (b) Close.
- **Responsible owner.** Black Belt.
- **Effort.** 15 min. **Duration.** 0.25 d. **BAM type.** Deep.
- **Predecessors.** `dmaic_improve_10`. **Successors.** `dmaic_improve_12`.
- **Required tools.** CadencePlan.
- **Deliverables.** Close event.
- **Outputs.** `#40` CLOSED.
- **Acceptance criteria.** CLOSED.
- **Statistical requirements.** None.
- **Risk if skipped.** Engine doesn't register improvements.
- **Standardization.** H. **AI-support.** —. **Automation.** H.

---

**`dmaic_improve_12` — Financial Benefit Translator PASS 1 (projected)** → `#39`
- **Phase.** IMPROVE.
- **Purpose.** Compute projected annualized benefit based on pilot delta; Finance signs.
- **Operational definition.** Financial Benefit doc: per benefit line, category (Hard/Soft/CA), annualized $, evidence, Finance signature.
- **Required inputs.** Pilot Results; unit cost data from Finance.
- **Source of inputs.** `dmaic_improve_07`; Finance.
- **Activity steps.** (a) Identify benefit categories (hard cost reduction, revenue lift, quality/rework, risk avoidance). (b) Quantify pilot-period delta. (c) Project to annualized (12 × monthly delta). (d) Classify each line: Hard (P&L line or FTE-release memo), Soft (time capacity freed), Cost Avoidance (prevented loss with basis calc). (e) Total net benefit. (f) Finance signs pass 1.
- **Responsible owner.** Black Belt.
- **Supporting roles.** Finance partner; Process Owner.
- **Effort.** 180 min. **Duration.** 1 d. **BAM type.** Deep + Communication.
- **Predecessors.** `dmaic_improve_07`. **Successors.** `dmaic_improve_13`.
- **Required tools.** Benefit template.
- **Deliverables.** Financial Benefit Translator pass 1 (A27 pass1).
- **Outputs.** Projected annualized $; Finance sig.
- **Acceptance criteria.** Every line classified; Finance signs pass 1.
- **Statistical requirements.** Benefit delta tied to pilot CI — report range, not point estimate alone.
- **Risk if skipped.** Improve closes without quantified value claim.
- **Standardization.** H. **AI-support.** Planning Agent (missing evidence flags). **Automation.** M.

---

**`dmaic_improve_13` — Author Control Plan DRAFT (moved from Control per §1.5 #3)** → `#41` (draft)
- **Phase.** IMPROVE.
- **Purpose.** Draft Control Plan now so Process Owner can challenge sustainability design before it's locked.
- **Operational definition.** Control Plan draft: per vital X, monitoring metric, measurement frequency, UCL/LCL from Baseline, threshold for action, response playbook, owner.
- **Required inputs.** Validated root causes; pilot measurement system; Baseline Control Chart.
- **Source of inputs.** `dmaic_analyze_11`, `dmaic_measure_01`, `dmaic_measure_09`.
- **Activity steps.** (a) Per vital X, author monitoring metric. (b) Frequency (daily / weekly / monthly). (c) Threshold from Baseline UCL/LCL. (d) Response playbook (what to do on signal). (e) Assign owner (PO by default). (f) Rollback criteria.
- **Responsible owner.** Black Belt.
- **Supporting roles.** Process Owner (challenge).
- **Effort.** 180 min. **Duration.** 1 d. **BAM type.** Deep.
- **Predecessors.** `dmaic_improve_12`. **Successors.** `dmaic_control_04` (where the plan finalizes).
- **Required tools.** Control plan template.
- **Deliverables.** Control Plan Draft (A26 draft).
- **Outputs.** Draft.
- **Acceptance criteria.** Per vital X, all 6 fields; PO reviews draft.
- **Statistical requirements.** Thresholds derived from Baseline Control Chart (UCL/LCL).
- **Risk if skipped.** Control Plan authored at Day 29 of Control → no time to test sustainability.
- **Standardization.** H. **AI-support.** Composer Explainer. **Automation.** M.

---

**`dmaic_improve_14` — Monitoring Dashboard Spec** → `#41` (dashboard)
- **Phase.** IMPROVE.
- **Purpose.** Spec the live monitoring dashboard that will run under Control.
- **Operational definition.** Dashboard spec: metrics plotted, refresh cadence, alert rules tied to Control Plan thresholds, owner.
- **Required inputs.** Control Plan draft; Continuous Reporting Framework.
- **Source of inputs.** `dmaic_improve_13`, `dmaic_measure_11`.
- **Activity steps.** (a) Spec each metric card. (b) Define refresh cadence. (c) Configure alert rules (email, chat, escalation). (d) Build in dashboard platform. (e) Test alerts.
- **Responsible owner.** Analyst.
- **Supporting roles.** Black Belt; Process Owner.
- **Effort.** 180 min. **Duration.** 1 d. **BAM type.** Deep.
- **Predecessors.** `dmaic_improve_13`. **Successors.** `dmaic_control_04`.
- **Required tools.** Dashboard platform.
- **Deliverables.** Monitoring Dashboard Spec (A29).
- **Outputs.** Live dashboard + alert rules.
- **Acceptance criteria.** Alerts test successfully.
- **Statistical requirements.** Thresholds tied to Baseline UCL/LCL (Western Electric rules).
- **Risk if skipped.** Control plan = PDF with no live surface.
- **Standardization.** M. **AI-support.** Composer Explainer. **Automation.** M.

---

**`dmaic_improve_15` — MBB pre-review: Control Plan + Monitoring draft** → phase-gate
- **Phase.** IMPROVE.
- **Purpose.** MBB pre-reviews Control Plan draft so Control phase finalizes rather than authors.
- **Operational definition.** MBB feedback captured; draft revised.
- **Required inputs.** Control Plan draft; Monitoring Dashboard Spec.
- **Source of inputs.** `dmaic_improve_13`, `dmaic_improve_14`.
- **Activity steps.** (a) MBB reviews. (b) Feedback captured. (c) Revisions applied.
- **Responsible owner.** Black Belt.
- **Supporting roles.** MBB.
- **Effort.** 60 min. **Duration.** 0.5 d. **BAM type.** Communication.
- **Predecessors.** `dmaic_improve_14`. **Successors.** `dmaic_improve_16`.
- **Required tools.** —.
- **Deliverables.** MBB pre-review notes.
- **Outputs.** Revised draft.
- **Acceptance criteria.** MBB feedback addressed.
- **Statistical requirements.** MBB confirms thresholds tied to valid Baseline stats.
- **Risk if skipped.** Control finalizes weak plan.
- **Standardization.** M. **AI-support.** —. **Automation.** L.

---

**`dmaic_improve_16` — Close `#33`, `#38`, `#39 (pass1)`; emit phase-advanced** → `#33`, `#38`, `#39`
- **Phase.** IMPROVE.
- **Purpose.** Close Improve catalog entries; `phaseFor()` recomputes to CONTROL.
- **Operational definition.** Relevant entries CLOSED.
- **Required inputs.** All Improve artifacts.
- **Source of inputs.** Improve tasks.
- **Activity steps.** (a) Close each. (b) Engine recomputes.
- **Responsible owner.** Black Belt.
- **Effort.** 30 min. **Duration.** 0.25 d. **BAM type.** Deep.
- **Predecessors.** `dmaic_improve_15`. **Successors.** `dmaic_improve_17`.
- **Required tools.** CadencePlan.
- **Deliverables.** Close events.
- **Outputs.** Phase advance.
- **Acceptance criteria.** All CLOSED.
- **Statistical requirements.** None.
- **Risk if skipped.** Control payload hidden.
- **Standardization.** H. **AI-support.** —. **Automation.** H.

---

**`dmaic_improve_17` — Phase-gate review: IMPROVE close** → phase-gate
- **Phase.** IMPROVE.
- **Purpose.** MBB + Sponsor + PO review; ADVANCE to Control.
- **Operational definition.** Gate review record.
- **Required inputs.** All Improve artifacts.
- **Source of inputs.** Improve tasks.
- **Activity steps.** (a) Walk Part 8.8 Improve gate questions. (b) Decide.
- **Responsible owner.** Black Belt.
- **Supporting roles.** MBB; Sponsor; PO.
- **Effort.** 90 min. **Duration.** 0.5 d. **BAM type.** Communication.
- **Predecessors.** `dmaic_improve_16`. **Successors.** `dmaic_control_01`.
- **Required tools.** —.
- **Deliverables.** Gate record.
- **Outputs.** ADVANCE.
- **Acceptance criteria.** Gate questions answered.
- **Statistical requirements.** Pilot stats significant + meaningful; Finance pass 1 signed.
- **Risk if skipped.** Weak Improve into Control.
- **Standardization.** H. **AI-support.** —. **Automation.** M.


### CONTROL phase (14 tasks) — target 2–4 sprints + sustainment

---

**`dmaic_control_01` — Re-execute Baseline data collection identically (post-improvement)** → reuse `#28`, `#22`
- **Phase.** CONTROL.
- **Purpose.** Remeasure Y with exact same method as Baseline.
- **Operational definition.** Post-improvement dataset with n ≥ baseline_n × 0.9; identical method, sample frame, exclusion rule.
- **Required inputs.** Baseline DCP (A07); scaled countermeasures in production.
- **Source of inputs.** `dmaic_measure_01`, `dmaic_improve_09`.
- **Activity steps.** (a) Re-run DCP. (b) Apply same exclusion rules. (c) Log any deviations. (d) Store dataset.
- **Responsible owner.** Analyst.
- **Supporting roles.** Black Belt; SMEs.
- **Effort.** 480 min cumulative. **Duration.** 2–4 weeks. **BAM type.** Deep.
- **Predecessors.** `dmaic_improve_17`. **Successors.** `dmaic_control_02`.
- **Required tools.** Per DCP.
- **Deliverables.** Post-Improvement Dataset (A28).
- **Outputs.** Dataset.
- **Acceptance criteria.** n ≥ baseline_n × 0.9; method parity attested.
- **Statistical requirements.** n sufficient; same operational definition, sample frame, exclusions as Baseline.
- **Risk if skipped.** No rigorous proof of improvement.
- **Standardization.** H. **AI-support.** Planning Agent (method drift lint). **Automation.** M.

---

**`dmaic_control_02` — Post-improvement Control Chart + Capability** → reuse `#29`, `#30`
- **Phase.** CONTROL.
- **Purpose.** Compute post-improvement stability + capability; compare to baseline.
- **Operational definition.** Post Control Chart (same type as Baseline); post Capability Report; pre-vs-post comparison table.
- **Required inputs.** Post-improvement dataset; Baseline Control Chart; Baseline Capability.
- **Source of inputs.** `dmaic_control_01`, `dmaic_measure_09`, `dmaic_measure_10`.
- **Activity steps.** (a) Build post Control Chart same type as baseline. (b) Apply Western Electric rules. (c) Compute post Cp/Cpk/Pp/Ppk/DPMO/σ-level. (d) Pre-vs-post delta table. (e) Hypothesis test on delta (same test as pilot).
- **Responsible owner.** Analyst.
- **Supporting roles.** Black Belt.
- **Effort.** 180 min. **Duration.** 1 d. **BAM type.** Deep.
- **Predecessors.** `dmaic_control_01`. **Successors.** `dmaic_control_03`.
- **Required tools.** Statistical package.
- **Deliverables.** Post Control Chart (A11-post); Post Capability Report (A12-post).
- **Outputs.** Delta table; significance test.
- **Acceptance criteria.** Both reports; delta quantified with CI.
- **Statistical requirements.** Same chart type as Baseline; appropriate hypothesis test; p < 0.05 AND meaningful effect size for "validated" close.
- **Risk if skipped.** No proof; Validated Kaizen rejected.
- **Standardization.** H. **AI-support.** —. **Automation.** H.

---

**`dmaic_control_03` — Financial Benefit Translator PASS 2 (actual) + reconciliation** → `#39`
- **Phase.** CONTROL.
- **Purpose.** Compute actual annualized benefit from post-improvement data; reconcile vs pass 1 projected.
- **Operational definition.** Financial Benefit pass 2 doc: per line, actual annualized $, category, evidence; reconciliation delta vs pass 1; Finance signature.
- **Required inputs.** Post-improvement delta; Finance pass 1 (A27 pass1); unit cost data.
- **Source of inputs.** `dmaic_control_02`, `dmaic_improve_12`.
- **Activity steps.** (a) Recompute delta with actual post data. (b) Annualize (12 × monthly). (c) Classify Hard/Soft/CA (stricter than pass 1: FTE-release memo now required for Soft→Hard promotion). (d) Reconcile pass 1 vs pass 2; explain any gap. (e) Finance signs pass 2.
- **Responsible owner.** Black Belt.
- **Supporting roles.** Finance; Process Owner.
- **Effort.** 180 min. **Duration.** 1 d. **BAM type.** Deep + Communication.
- **Predecessors.** `dmaic_control_02`. **Successors.** `dmaic_control_04`.
- **Required tools.** Benefit template.
- **Deliverables.** Financial Benefit pass 2 (A27 pass2) + Reconciliation.
- **Outputs.** Finance sig on actual.
- **Acceptance criteria.** Finance signs; reconciliation delta explained; `Kaizen.annualBenefitsDollars` and `Kaizen.implementationCostDollars` set.
- **Statistical requirements.** Benefit delta tied to post-improvement CI.
- **Risk if skipped.** ROI disputed; pass 1 never validated.
- **Standardization.** H. **AI-support.** Planning Agent (gap lint). **Automation.** M.

---

**`dmaic_control_04` — Finalize Control Plan with Process Owner sign-off** → `#41` (control plan)
- **Phase.** CONTROL.
- **Purpose.** Convert Control Plan draft into final signed plan.
- **Operational definition.** Control Plan final: monitoring metric, cadence, threshold, response playbook, rollback, 30/60/90 calendar holds, Process Owner signature.
- **Required inputs.** Control Plan draft (A26 draft); MBB pre-review notes; Monitoring Dashboard live.
- **Source of inputs.** `dmaic_improve_13`, `dmaic_improve_14`, `dmaic_improve_15`.
- **Activity steps.** (a) Update thresholds from post-improvement Control Chart. (b) Confirm PO as sustainment owner. (c) Confirm response playbook. (d) Create 30/60/90 calendar holds. (e) PO signs. (f) Sponsor signs.
- **Responsible owner.** Black Belt.
- **Supporting roles.** Process Owner (signs); Sponsor (signs).
- **Effort.** 120 min. **Duration.** 1 d. **BAM type.** Deep + Communication.
- **Predecessors.** `dmaic_control_02`. **Successors.** `dmaic_control_05`.
- **Required tools.** Control Plan template; calendar.
- **Deliverables.** Control Plan (A26 final).
- **Outputs.** Signed plan; calendar holds on PO calendar.
- **Acceptance criteria.** PO + Sponsor signatures; calendar holds visible.
- **Statistical requirements.** Thresholds from post-improvement UCL/LCL; Western Electric rules encoded in dashboard.
- **Risk if skipped.** Sustainment fails; regression by Day 90.
- **Standardization.** H. **AI-support.** Composer Explainer. **Automation.** M.

---

**`dmaic_control_05` — Process Owner Transition Memo + acknowledgement** → `#41` (transition)
- **Phase.** CONTROL.
- **Purpose.** Formal transfer of ownership from Black Belt to Process Owner.
- **Operational definition.** Transition memo signed by both parties; PO commits to monitoring responsibility.
- **Required inputs.** Control Plan final; Monitoring Dashboard; SOP v2.0 final; Implemented Changes Log.
- **Source of inputs.** `dmaic_control_04`, `dmaic_improve_14`, `dmaic_improve_10`, `dmaic_improve_05`.
- **Activity steps.** (a) Walk PO through each change + current performance. (b) Confirm controls in place: SOP, Dashboard, Rollback. (c) Transfer ownership. (d) Schedule 30/60/90 check-ins. (e) Both sign.
- **Responsible owner.** Black Belt.
- **Supporting roles.** Process Owner.
- **Effort.** 60 min. **Duration.** 0.5 d. **BAM type.** Communication.
- **Predecessors.** `dmaic_control_04`. **Successors.** `dmaic_control_06`.
- **Required tools.** Transition template.
- **Deliverables.** Process Owner Transition Memo (A32).
- **Outputs.** Signed transition.
- **Acceptance criteria.** Both signatures.
- **Statistical requirements.** None.
- **Risk if skipped.** Ownership ambiguity; sustainment fails.
- **Standardization.** H. **AI-support.** —. **Automation.** L.

---

**`dmaic_control_06` — Stakeholder validation readout (Sponsor + stakeholders)** → `#41` (validation)
- **Phase.** CONTROL.
- **Purpose.** Walk Sponsor and key stakeholders through results; capture sign-off.
- **Operational definition.** Sponsor signs validation memo; stakeholders acknowledge results.
- **Required inputs.** Post results (A11-post, A12-post); Financial Benefit pass 2; Control Plan.
- **Source of inputs.** `dmaic_control_02`, `dmaic_control_03`, `dmaic_control_04`.
- **Activity steps.** (a) 60-min readout meeting. (b) Walk results, ROI, Control Plan. (c) Address concerns. (d) Sponsor signs validation.
- **Responsible owner.** Black Belt.
- **Supporting roles.** Sponsor (signs); PO; key stakeholders.
- **Effort.** 90 min. **Duration.** 0.5 d. **BAM type.** Communication.
- **Predecessors.** `dmaic_control_05`. **Successors.** `dmaic_control_07`.
- **Required tools.** Meeting.
- **Deliverables.** Validation Memo.
- **Outputs.** Sponsor signature.
- **Acceptance criteria.** Sponsor signs.
- **Statistical requirements.** None directly — rests on prior gates.
- **Risk if skipped.** Close without alignment.
- **Standardization.** M. **AI-support.** —. **Automation.** L.

---

**`dmaic_control_07` — Author Project Results Narrative Document** → `#41`
- **Phase.** CONTROL.
- **Purpose.** Produce the canonical 6-page narrative of the entire project.
- **Operational definition.** Narrative artifact: executive summary, background, results (baseline vs post), root cause findings, implemented improvements, financial benefit, control plan, lessons learned.
- **Required inputs.** All prior artifacts (A01–A29 and post results).
- **Source of inputs.** All project phases.
- **Activity steps.** (a) Executive summary (1 paragraph: problem → result → annualized benefit). (b) Background: business case, scope, goal. (c) Results: baseline vs remeasured, Control Chart before/after, secondary metrics. (d) Root causes: vital X's, FMEA top modes. (e) Implemented improvements: list with before/after. (f) Financial: annualized benefit with confidence. (g) Control plan: monitoring, SOPs, PO. (h) Lessons learned: what worked, what didn't, what to replicate. (i) Review with Sponsor.
- **Responsible owner.** Black Belt.
- **Supporting roles.** MBB (reviews); Sponsor (reads).
- **Effort.** 240 min. **Duration.** 2 d. **BAM type.** Deep.
- **Predecessors.** `dmaic_control_06`. **Successors.** `dmaic_control_08`.
- **Required tools.** Narrative template.
- **Deliverables.** Project Results Narrative (A30).
- **Outputs.** 6-page narrative.
- **Acceptance criteria.** All 9 sections populated; evidence linked.
- **Statistical requirements.** Results section includes p, effect size, CI; Capability pre vs post.
- **Risk if skipped.** No portfolio audit trail.
- **Standardization.** H. **AI-support.** Composer Explainer (consolidates from all artifacts). **Automation.** M.

---

**`dmaic_control_08` — Capture Lessons Learned** → `#41` (lessons)
- **Phase.** CONTROL.
- **Purpose.** Author lessons-learned memo for future DMAIC projects.
- **Operational definition.** 1–2 page memo: what worked, what didn't, what to replicate, anti-patterns encountered, statistical gotchas.
- **Required inputs.** Team retro; Black Belt observations.
- **Source of inputs.** All phases.
- **Activity steps.** (a) 30-min team retro. (b) Synthesize. (c) Write memo. (d) File.
- **Responsible owner.** Black Belt.
- **Supporting roles.** Team.
- **Effort.** 90 min. **Duration.** 0.5 d. **BAM type.** CI.
- **Predecessors.** `dmaic_control_07`. **Successors.** `dmaic_control_09`.
- **Required tools.** Retro template.
- **Deliverables.** Lessons Learned (A31).
- **Outputs.** Memo.
- **Acceptance criteria.** ≥ 5 lessons; ≥ 2 anti-patterns.
- **Statistical requirements.** None.
- **Risk if skipped.** Next DMAIC repeats mistakes.
- **Standardization.** H. **AI-support.** Reflection Agent. **Automation.** M.

---

**`dmaic_control_09` — MBB final review: Control Plan + Results Narrative** → phase-gate
- **Phase.** CONTROL.
- **Purpose.** MBB signs final review; project ready to close.
- **Operational definition.** MBB final signature on A26, A27 pass2, A30.
- **Required inputs.** Control Plan; Financial Benefit pass 2; Results Narrative.
- **Source of inputs.** `dmaic_control_04`, `dmaic_control_03`, `dmaic_control_07`.
- **Activity steps.** (a) MBB reviews. (b) Signs or requests revision.
- **Responsible owner.** Black Belt.
- **Supporting roles.** MBB.
- **Effort.** 90 min. **Duration.** 0.5 d. **BAM type.** Communication.
- **Predecessors.** `dmaic_control_08`. **Successors.** `dmaic_control_10`.
- **Required tools.** —.
- **Deliverables.** MBB Final Sign-off.
- **Outputs.** Signature.
- **Acceptance criteria.** MBB signs.
- **Statistical requirements.** All Control gates met.
- **Risk if skipped.** Close on unreviewed work.
- **Standardization.** H. **AI-support.** —. **Automation.** M.

---

**`dmaic_control_10` — Close Kaizen (compute closeKind; state=CLOSED)** → `#41`
- **Phase.** CONTROL.
- **Purpose.** Call KaizenService.close(); set closeKind (SUCCESS / PARTIAL / FAILED_HONEST).
- **Operational definition.** `Kaizen.state = CLOSED`; `closeKind` set per Part 8.4 criteria.
- **Required inputs.** All Control artifacts; MBB sign-off; Sponsor sign-off.
- **Source of inputs.** All Control tasks above.
- **Activity steps.** (a) Verify close-gate conditions (Part 8.9). (b) Compute closeKind from post-improvement delta: SUCCESS if delta ≥ target AND p < 0.05 AND Finance pass 2 signed; PARTIAL if 50–100% of target; FAILED_HONEST if no improvement. (c) Call close.
- **Responsible owner.** Black Belt.
- **Supporting roles.** Sponsor (confirms).
- **Effort.** 30 min. **Duration.** 0.25 d. **BAM type.** Deep.
- **Predecessors.** `dmaic_control_09`. **Successors.** `dmaic_control_11`.
- **Required tools.** CadencePlan.
- **Deliverables.** Close event.
- **Outputs.** `Kaizen.state = CLOSED`; `closeKind` set.
- **Acceptance criteria.** Gate passes; event emitted.
- **Statistical requirements.** Delta vs target; p; effect size.
- **Risk if skipped.** Kaizen never closes.
- **Standardization.** H. **AI-support.** —. **Automation.** H.

---

**`dmaic_control_11` — Sustainment check-in at Day 30 (post-close)** → post-CLOSED
- **Phase.** CONTROL (sustainment tail).
- **Purpose.** Verify Control Plan running; Dashboard alerts functional; no regression signals.
- **Operational definition.** Day-30 Sustainment check with Dashboard screenshot, current metric vs target, any alerts fired, PO attestation.
- **Required inputs.** Live Dashboard; Control Plan.
- **Source of inputs.** `dmaic_improve_14`, `dmaic_control_04`.
- **Activity steps.** (a) Review Dashboard. (b) Review alerts log. (c) Interview PO. (d) If regression, investigate + remediate. (e) Log check-in.
- **Responsible owner.** Black Belt.
- **Supporting roles.** Process Owner.
- **Effort.** 60 min. **Duration.** 0.5 d. **BAM type.** CI.
- **Predecessors.** `dmaic_control_10` + 30 days. **Successors.** `dmaic_control_12`.
- **Required tools.** Dashboard; check-in log.
- **Deliverables.** Day-30 Check-in Record.
- **Outputs.** Log.
- **Acceptance criteria.** PO attests; Dashboard current.
- **Statistical requirements.** Check for Western Electric signals on live Control Chart.
- **Risk if skipped.** Drift invisible.
- **Standardization.** H. **AI-support.** Planning Agent. **Automation.** M.

---

**`dmaic_control_12` — Sustainment check-in at Day 60 (post-close)** → post-CLOSED
- **Phase.** CONTROL (sustainment tail).
- **Purpose.** Second sustainment touchpoint.
- **Operational definition.** Same as Day 30 pattern.
- **Required inputs.** Live Dashboard; Day 30 record.
- **Source of inputs.** `dmaic_control_11`.
- **Activity steps.** Same as Day 30.
- **Responsible owner.** Black Belt (tapering to PO).
- **Supporting roles.** PO.
- **Effort.** 60 min. **Duration.** 0.5 d. **BAM type.** CI.
- **Predecessors.** `dmaic_control_11` + 30 days. **Successors.** `dmaic_control_13`.
- **Required tools.** Dashboard.
- **Deliverables.** Day-60 Check-in Record.
- **Outputs.** Log.
- **Acceptance criteria.** PO attests.
- **Statistical requirements.** Western Electric on live chart.
- **Risk if skipped.** Drift invisible.
- **Standardization.** H. **AI-support.** Planning Agent. **Automation.** H.

---

**`dmaic_control_13` — Sustainment check-in at Day 90 (post-close)** → post-CLOSED
- **Phase.** CONTROL (sustainment tail).
- **Purpose.** Third and final scheduled sustainment touchpoint; formal handoff complete.
- **Operational definition.** Day 90 record; if sustained, formal handoff; if regressed, either remediation Kaizen opened OR DMAIC re-opened as IN_REMEASUREMENT.
- **Required inputs.** Live Dashboard; Day 60 record.
- **Source of inputs.** `dmaic_control_12`.
- **Activity steps.** (a) Review. (b) Formal handoff. (c) If regression, decide: remediate (new Kaizen) or re-open DMAIC.
- **Responsible owner.** Black Belt.
- **Supporting roles.** PO; Sponsor (informed).
- **Effort.** 90 min. **Duration.** 0.5 d. **BAM type.** CI.
- **Predecessors.** `dmaic_control_12` + 30 days. **Successors.** `dmaic_control_14`.
- **Required tools.** Dashboard.
- **Deliverables.** Day-90 Sustainment Memo.
- **Outputs.** Sustained / Regression decision.
- **Acceptance criteria.** PO attests OR regression plan exists.
- **Statistical requirements.** 90-day Control Chart run with Western Electric.
- **Risk if skipped.** Sustainment becomes self-declared.
- **Standardization.** H. **AI-support.** Reflection Agent. **Automation.** M.

---

**`dmaic_control_14` — Portfolio rollup and next-process recommendation** → post-CLOSED
- **Phase.** CONTROL (sustainment tail).
- **Purpose.** Feed project into portfolio metrics; recommend next DMAIC candidate.
- **Operational definition.** Portfolio entry updated; recommendation memo to Sponsor.
- **Required inputs.** Results Narrative; Lessons Learned; Sustainment outcome.
- **Source of inputs.** `dmaic_control_07`, `dmaic_control_08`, `dmaic_control_13`.
- **Activity steps.** (a) Update portfolio. (b) Identify adjacent processes surfaced during this project. (c) Write recommendation. (d) Sponsor reviews.
- **Responsible owner.** Black Belt.
- **Supporting roles.** Sponsor; MBB.
- **Effort.** 60 min. **Duration.** 0.5 d. **BAM type.** Deep.
- **Predecessors.** `dmaic_control_13`. **Successors.** —.
- **Required tools.** Portfolio template.
- **Deliverables.** Next-Process Recommendation.
- **Outputs.** Recommendation.
- **Acceptance criteria.** Sponsor review.
- **Statistical requirements.** None.
- **Risk if skipped.** Program momentum lost.
- **Standardization.** M. **AI-support.** Context Agent. **Automation.** M.

### Inter-phase glue tasks (6)

---

**`dmaic_glue_01` — Daily standup during active phase** → generic
- **Phase.** ALL.
- **Purpose.** 15-min team sync.
- **Operational definition.** Daily note: yesterday / today / blockers.
- **Required inputs.** Running backlog.
- **Source of inputs.** Current phase.
- **Activity steps.** Standard 3-question standup.
- **Responsible owner.** Black Belt.
- **Supporting roles.** Team.
- **Effort.** 15 min. **Duration.** daily. **BAM type.** Communication.
- **Predecessors.** `dmaic_define_12`. **Successors.** —.
- **Deliverables.** Standup notes.
- **Outputs.** Alignment.
- **Acceptance criteria.** Daily notes.
- **Statistical requirements.** None.
- **Risk if skipped.** Drift.
- **Standardization.** H. **AI-support.** —. **Automation.** L.

---

**`dmaic_glue_02` — Weekly 1:1 between Black Belt and Process Owner** → generic
- **Phase.** ALL.
- **Purpose.** Maintain PO alignment through project.
- **Operational definition.** Weekly 30-min touchpoint.
- **Required inputs.** Current phase status.
- **Source of inputs.** Current phase.
- **Activity steps.** Standard 1:1 cadence.
- **Responsible owner.** Black Belt.
- **Supporting roles.** Process Owner.
- **Effort.** 30 min/week. **Duration.** weekly. **BAM type.** Communication.
- **Predecessors.** `dmaic_define_12`. **Successors.** —.
- **Deliverables.** 1:1 notes.
- **Outputs.** Alignment.
- **Acceptance criteria.** Weekly cadence.
- **Statistical requirements.** None.
- **Risk if skipped.** PO surprise at phase gates.
- **Standardization.** H. **AI-support.** —. **Automation.** L.

---

**`dmaic_glue_03` — Monthly Sponsor update** → generic
- **Phase.** ALL.
- **Purpose.** Keep Sponsor informed; capture any strategic shifts.
- **Operational definition.** Monthly 30-min briefing per Comm plan.
- **Required inputs.** Progress dashboard.
- **Source of inputs.** Current phase.
- **Activity steps.** Status + decisions needed.
- **Responsible owner.** Black Belt.
- **Supporting roles.** Sponsor.
- **Effort.** 30 min. **Duration.** monthly. **BAM type.** Communication.
- **Predecessors.** `dmaic_define_12`. **Successors.** —.
- **Deliverables.** Briefing notes.
- **Outputs.** Sponsor visibility.
- **Acceptance criteria.** Monthly.
- **Statistical requirements.** None.
- **Risk if skipped.** Sponsor disengages.
- **Standardization.** H. **AI-support.** Composer Explainer. **Automation.** M.

---

**`dmaic_glue_04` — Scope-change event → abandon or reaffirm** → generic
- **Phase.** ALL.
- **Purpose.** If root cause analysis reveals the problem is a different process than scoped, abandon or reaffirm.
- **Operational definition.** Decision memo: CONTINUE (scope reaffirmed) OR ABANDON (new Kaizen opened).
- **Required inputs.** Triggering finding.
- **Source of inputs.** Any phase.
- **Activity steps.** (a) Flag finding. (b) Sponsor decision. (c) If abandon, open new Kaizen from Phase 1; current Kaizen closes with `closeKind = ABANDONED`.
- **Responsible owner.** Black Belt.
- **Supporting roles.** Sponsor.
- **Effort.** 60 min. **Duration.** 1 d on-signal. **BAM type.** Communication.
- **Predecessors.** —. **Successors.** `dmaic_define_01` (new Kaizen) or current task.
- **Deliverables.** Scope-change memo.
- **Outputs.** Decision.
- **Acceptance criteria.** Signed memo.
- **Statistical requirements.** None.
- **Risk if skipped.** Baseline on wrong metric.
- **Standardization.** M. **AI-support.** —. **Automation.** L.

---

**`dmaic_glue_05` — Sprint Retrospective review of Risk Register** → generic
- **Phase.** ALL.
- **Purpose.** Refresh `#25` Risk Register at each sprint boundary.
- **Operational definition.** Risk Register updated; retired risks removed; new risks added.
- **Required inputs.** Current Risk Register (A05).
- **Source of inputs.** `dmaic_define_08`.
- **Activity steps.** (a) Review each risk; retire if resolved. (b) Add new risks surfaced this sprint. (c) Re-score.
- **Responsible owner.** Black Belt.
- **Supporting roles.** Team.
- **Effort.** 30 min. **Duration.** per sprint. **BAM type.** CI.
- **Predecessors.** `dmaic_define_08`. **Successors.** —.
- **Deliverables.** Updated Risk Register.
- **Outputs.** Current risk posture.
- **Acceptance criteria.** Updated each sprint.
- **Statistical requirements.** None.
- **Risk if skipped.** Stale register = missed risks.
- **Standardization.** H. **AI-support.** Planning Agent. **Automation.** M.

---

**`dmaic_glue_06` — Statistical review session (mid-phase)** → generic
- **Phase.** MEASURE, ANALYZE, IMPROVE, CONTROL.
- **Purpose.** Mid-phase statistical health check with MBB on analytical work in flight.
- **Operational definition.** Session note: what's being analyzed, what decisions pending, any method concerns.
- **Required inputs.** In-flight analysis.
- **Source of inputs.** Current phase tasks.
- **Activity steps.** (a) Walk MBB through in-flight work. (b) MBB raises any method concerns. (c) Course-correct.
- **Responsible owner.** Black Belt.
- **Supporting roles.** MBB.
- **Effort.** 60 min. **Duration.** on-signal. **BAM type.** Communication.
- **Predecessors.** —. **Successors.** —.
- **Deliverables.** Session notes.
- **Outputs.** Course corrections.
- **Acceptance criteria.** MBB comfortable with direction.
- **Statistical requirements.** Method-check against Part 6.
- **Risk if skipped.** Late-phase method rework.
- **Standardization.** M. **AI-support.** —. **Automation.** L.

### Part 3 — Task count summary

- Define: 13 tasks (`dmaic_define_01`–`dmaic_define_13`)
- Measure: 18 tasks (`dmaic_measure_01`–`dmaic_measure_18`)
- Analyze: 20 tasks (`dmaic_analyze_01`–`dmaic_analyze_20`)
- Improve: 17 tasks (`dmaic_improve_01`–`dmaic_improve_17`)
- Control: 14 tasks (`dmaic_control_01`–`dmaic_control_14`)
- Inter-phase glue: 6 tasks (`dmaic_glue_01`–`dmaic_glue_06`)

**Total: 88 operationally distinct tasks.** Each task cites its parent catalog entry (`#20`–`#41` or "generic"). Predecessor / successor edges encode the DAG.



---

## Part 4 — Artifact Specification Library

Each artifact below follows a consistent spec: Name, Purpose, Why it matters, Owner role, Phase created, Source inputs, Required sections/fields, Acceptance criteria, Downstream uses, Typical failure modes, Standard template guidance.

The user brief named ~21 artifacts; this standard ships **26 artifacts** (A01–A32 with reuse). Additions beyond the user's list are marked `[Added during validation]` with justification.

### A01 — Signed DMAIC Project Charter

- **Name.** Project Charter (signed).
- **Purpose.** Authorize the project; commit Sponsor + resources; lock scope and goal.
- **Why it matters.** Every downstream artifact traces back to Charter scope; mis-scoped Charter → wasted sprints.
- **Owner.** Black Belt (author); Sponsor (signs).
- **Phase created.** Define.
- **Source inputs.** Voice-of-Leader interview; Process Owner; CTQ Tree draft.
- **Required sections/fields.**
  - Problem Statement (per Part 5 template)
  - Business Case (current cost/risk, expected benefit, strategic fit)
  - In-scope / Out-of-scope process boundaries
  - Primary Y metric + unit + cost basis (if cost metric)
  - Secondary Y metrics
  - Target state (baseline X → target Y by date Z)
  - Roster: Sponsor, Black Belt, Process Owner, MBB, SMEs (named), Finance partner, Analyst
  - Sprint-count estimate (typical 8–12)
  - Top 3 risks + initial mitigations
  - Sponsor signature block + date
  - MBB peer-review signature
- **Acceptance criteria.** All sections populated; Sponsor signature captured; MBB signs; stored in Kaizen workspace.
- **Downstream uses.** Informs SIPOC scope; CTQ Tree primary Y; DCP Y selection; Risk Register seed; Communication Plan anchors.
- **Typical failure modes.** (1) Sponsor signs a scope that crosses into another VP's territory → mid-project scope objection. (2) Primary Y defined without cost basis → Finance ROI dispute. (3) Sprint-count estimate ignored; project runs 2× estimate.
- **Standard template guidance.** Single Quip/Confluence page; problem statement limited to 5 sentences; business case limited to $ or risk-category quantification; roster table with one row per role.

### A02 — SIPOC

- **Name.** SIPOC (Suppliers, Inputs, Process, Outputs, Customers).
- **Purpose.** Shared high-level process view; feeds Input list to C&E Matrix and Output list to CTQ mapping.
- **Why it matters.** Every X in C&E comes from SIPOC Inputs; every Y relates to SIPOC Outputs; weak SIPOC = weak Analyze.
- **Owner.** Black Belt (facilitator); SMEs (authors via workshop).
- **Phase created.** Define.
- **Source inputs.** Process Owner knowledge; SME panel; prior process documentation if any.
- **Required sections/fields.**
  - 3–7 high-level process steps (verb + noun format)
  - Inputs per step (≥ 1)
  - Outputs per step (≥ 1)
  - Suppliers per input (≥ 1)
  - Customers per output (≥ 1)
  - Participant list (who authored)
- **Acceptance criteria.** 3–7 steps; ≥ 1 of each SIPOC element per step; SME panel signs.
- **Downstream uses.** Inputs feed C&E Matrix (A15) row headers; Outputs feed CTQ Tree column headers and Baseline DCP Y list.
- **Typical failure modes.** (1) Too granular (> 7 steps) → workshop drowns. (2) Too abstract (< 3 steps) → can't extract usable X/Y lists. (3) Single-author SIPOC → misses handoffs.
- **Standard template guidance.** Use the BAM template from `docs/Business Agility Standard Work.txt #21`. Spreadsheet with STEP column E, Outputs H, Inputs F, Suppliers E (separate tab), Customers.

### A03 — Stakeholder Analysis

- **Name.** Stakeholder Analysis 2×2.
- **Purpose.** Map influence × interest; drive engagement approach per quadrant.
- **Why it matters.** Stakeholder surprises mid-project derail 20%+ of DMAIC projects; upfront map prevents.
- **Owner.** Black Belt.
- **Phase created.** Define.
- **Source inputs.** SIPOC (Suppliers + Customers); Sponsor interview; org chart; roster.
- **Required sections/fields.**
  - Stakeholder list (≥ 8)
  - Per stakeholder: name, role, org unit, Influence (H/M/L), Interest (H/M/L)
  - 2×2 grid visualization
  - Engagement approach per quadrant (Manage Closely / Keep Satisfied / Keep Informed / Monitor)
  - Owner per engagement cluster
- **Acceptance criteria.** ≥ 8 stakeholders; every stakeholder rated; every quadrant has approach + owner.
- **Downstream uses.** Communication Plan (A04); ad-hoc escalation routing.
- **Typical failure modes.** (1) Only friendlies mapped; skeptics missed. (2) Influence/Interest rated by Black Belt alone without Process Owner concurrence. (3) Plan authored without the Communication Plan deriving from it.
- **Standard template guidance.** Per `CATALOG_GAPS.md §B.1`; 2×2 grid template.

### A04 — Communication Plan

- **Name.** Communication Plan Matrix.
- **Purpose.** Specify per-stakeholder cadence, channel, format, owner, acceptance.
- **Why it matters.** Without authored cadence, status comms become ad-hoc; Sponsor surprises; stakeholder fatigue.
- **Owner.** Black Belt.
- **Phase created.** Define.
- **Source inputs.** Stakeholder Analysis (A03); Charter.
- **Required sections/fields.**
  - Per stakeholder row: cadence (daily/weekly/biweekly/monthly), channel (chat/email/meeting/dashboard/1:1), format (status / dashboard / deck / verbal), owner, acceptance criterion
  - Calendar-hold confirmation
  - Sprint-Retrospective refresh cadence
- **Acceptance criteria.** Every stakeholder has all 5 fields; calendar holds exist.
- **Downstream uses.** Sponsor monthly updates (`dmaic_glue_03`); Process Owner weekly 1:1 (`dmaic_glue_02`); dashboard link distribution.
- **Typical failure modes.** (1) Plan created, calendar holds never booked. (2) No acceptance criterion — "Sponsor gets an email" but no check that they read it.
- **Standard template guidance.** Per `CATALOG_GAPS.md §B.2`; matrix format.

### A05 — Risk Register

- **Name.** Risk Register with P×I scoring.
- **Purpose.** Enumerate, score, assign, refresh risks throughout project.
- **Why it matters.** Predictable DMAIC failures (Finance absent, data-access blocked, PO rotation) recur every project; registering forces mitigation ownership.
- **Owner.** Black Belt.
- **Phase created.** Define; refreshed each Sprint Retrospective.
- **Source inputs.** Team risk-brainstorm; prior DMAIC lessons learned (Reflection Agent library).
- **Required sections/fields.**
  - Per risk: ID, category (technical/org/timeline/resource), description, Probability (1–5), Impact (1–5), Score P×I, mitigation plan, monitoring plan, owner, status (open/mitigated/retired)
  - Refresh log (date of each update)
- **Acceptance criteria.** ≥ 6 risks; ≥ 3 high (≥12) with named mitigation owner; refresh log current.
- **Downstream uses.** Sprint Retro reviews (`dmaic_glue_05`); Sponsor escalation triggers.
- **Typical failure modes.** (1) Register authored Day 1, never revisited. (2) Mitigations named but no owner. (3) All scores "5×5" (alarm fatigue).
- **Standard template guidance.** Per `CATALOG_GAPS.md §B.3`.

### A06 — VOC/VOB/VOA + CTQ Tree

- **Name.** Voice-of-Customer / Business / Associate with CTQ Tree translation.
- **Purpose.** Capture raw voice of stakeholders; translate to measurable CTQs; identify primary Y.
- **Why it matters.** DMAIC's primary-Y selection is the single most consequential decision; wrong Y → entire project misaligned.
- **Owner.** Black Belt.
- **Phase created.** Define.
- **Source inputs.** 3–5 VOC interviews; 2–3 VOB; 3–5 VOA; process observations.
- **Required sections/fields.**
  - VOC verbatim quotes with theme tags
  - VOB verbatim quotes with theme tags
  - VOA verbatim quotes with theme tags
  - CTQ Tree: Need → Driver → CTQ (measurable)
  - CTQ prioritization score (frequency × severity × strategic fit)
  - Primary Y designation
  - Secondary Y designations
  - Data type per Y (continuous / discrete / categorical)
  - Finance cost-basis acknowledgement (if cost CTQ)
- **Acceptance criteria.** ≥ 3 VOC + 2 VOB + 3 VOA interviews; ≥ 3 CTQs with measurable attributes; primary Y has unit + data type.
- **Downstream uses.** Output DCP (A07) Y list; C&E Matrix (A15) column headers; Charter (A01) goal statement.
- **Typical failure modes.** (1) VOC skipped; CTQs invented by internal team. (2) CTQ not measurable ("fast" not "≤ 4h"). (3) Primary Y chosen by Black Belt preference not customer evidence.
- **Standard template guidance.** Per `CATALOG_GAPS.md §B.4`; CTQ Tree template.

### A07 — Output Data Collection Plan (Output DCP)

- **Name.** Output Data Collection Plan.
- **Purpose.** Specify how each CTQ Y is measured, sampled, stratified, stored.
- **Why it matters.** Baseline dataset is only as good as its DCP; ambiguity in operational definition produces unusable data.
- **Owner.** Black Belt.
- **Phase created.** Measure.
- **Source inputs.** CTQ Tree; SIPOC Outputs; Data Dictionary (A08).
- **Required sections/fields.**
  - Per Y row: operational definition (falsifiable), unit, measurement method (manual/instrument/extract), sampling plan (n, frequency, stratification), collection owner, tool, data storage location
  - MSA-risk flag per Y
  - Exclusion rules
  - Pilot-cycle acceptance note
- **Acceptance criteria.** Every Y has all fields; MSA-risk flagged; pilot cycle completed.
- **Downstream uses.** Baseline collection (`dmaic_measure_07`); Remeasurement (`dmaic_control_01`) uses same DCP.
- **Typical failure modes.** (1) Operational definition ambiguous ("response time" — starts when?). (2) n inadequate (< 30 continuous). (3) No stratification → strata effects hidden.
- **Standard template guidance.** Per `CATALOG_GAPS.md §C.1`.

### A08 — Data Dictionary [Added during validation]

- **Name.** Data Dictionary.
- **Purpose.** Document every variable, field, unit, encoding, missing-value rule.
- **Why it matters.** Downstream regression fails silently on misencoded variables (e.g., "null" vs "0" for count fields).
- **Owner.** Analyst.
- **Phase created.** Measure.
- **Source inputs.** DCP (A07); system-of-record schemas.
- **Required sections/fields.**
  - Per variable row: name, type (int/float/string/date/bool), unit, valid range, encoding scheme, missing-value rule, example value, notes
- **Acceptance criteria.** No ambiguous variables; 100-row sample validated.
- **Downstream uses.** Baseline stats (`dmaic_measure_08`); regression (`dmaic_analyze_09`); pilot analysis.
- **Typical failure modes.** (1) Missing-value rule silent; dataset shows huge missingness at stats time. (2) Unit ambiguity (hours vs days).
- **Standard template guidance.** Spreadsheet; 1 row per variable.
- **Justification for addition.** Not in user's original ~21-item list, but mandatory for reproducible statistical analysis. Added.

### A09 — Baseline Dataset

- **Name.** Baseline Dataset (raw + summary stats).
- **Purpose.** Canonical pre-improvement performance dataset.
- **Why it matters.** Post-improvement comparison is only as valid as the baseline it compares against.
- **Owner.** Analyst.
- **Phase created.** Measure.
- **Source inputs.** DCP (A07); MSA acceptance (A10); execution window.
- **Required sections/fields.**
  - Raw dataset (row-level, timestamped, stratified)
  - Cleaned dataset with exclusion log
  - Summary statistics: n, mean, median, SD, min, max, 25/75/95 percentiles
  - Normality test result (Anderson-Darling / Shapiro-Wilk) with α
  - Outlier flag list
  - Transform decision (if non-normal)
  - Version tag + lock date + locker signature
- **Acceptance criteria.** n ≥ 30 (continuous) or ≥ 100 (proportions); stats complete; normality dispositioned; exclusions logged.
- **Downstream uses.** Control Chart (A11); Capability Report (A12); Regression reference; Remeasurement comparator.
- **Typical failure modes.** (1) n short (25 instead of 30); excuse made; stats unreliable. (2) Outliers silently dropped. (3) Non-normal data fitted with normal-assumption tools.
- **Standard template guidance.** Per `CATALOG_GAPS.md §C.3`.

### A10 — Measurement System Analysis (MSA) Report

- **Name.** MSA Report (Gage R&R for continuous; Kappa for attribute).
- **Purpose.** Prove measurement system is trustworthy before Baseline.
- **Why it matters.** Every downstream statistical conclusion rests on measurement validity; weak MSA invalidates everything.
- **Owner.** Black Belt.
- **Phase created.** Measure.
- **Source inputs.** 10-sample panel; 2–3 appraisers; 2–3 trials per sample per appraiser; AIAG-compliant design.
- **Required sections/fields.**
  - **Continuous (Gage R&R):** ANOVA-method R&R computation; %Study Variance; %Tolerance; Number of Distinct Categories (NDC); repeatability vs reproducibility breakdown; appraiser × part interaction; disposition.
  - **Attribute (Kappa):** Cohen's Kappa per appraiser pair; Fleiss' Kappa all appraisers; intra-appraiser (repeatability) Kappa; sample class distribution; disposition.
  - Sample selection rationale
  - Appraiser briefing evidence
  - Randomization log
  - Disposition: Accept / Marginal / Reject
- **Acceptance criteria.**
  - Continuous: %R&R < 30% (Accept with justification if 10–30%; Excellent < 10%); NDC ≥ 4.
  - Attribute: Kappa ≥ 0.7 (Excellent ≥ 0.9).
  - If Reject, measurement system fix + re-run.
- **Downstream uses.** Gate for Baseline (`#28 dependsOn #31`); same system used for Pilot + Remeasurement.
- **Typical failure modes.** (1) MSA run on 3 samples (underpowered); passes artificially. (2) %R&R reported against Tolerance without Study Variance. (3) Kappa computed on class-unbalanced samples → inflated score.
- **Standard template guidance.** Per `CATALOG_GAPS.md §D.2`. AIAG MSA 4th ed. format.

### A11 — Control Chart (Baseline + Post-Improvement)

- **Name.** Control Chart (paired: baseline + post-improvement).
- **Purpose.** Assess process stability pre and post; detect special cause; verify shift post-improvement.
- **Why it matters.** Capability indices are meaningful only on stable processes; post-improvement stability is the sustainment promise.
- **Owner.** Analyst.
- **Phase created.** Measure (baseline); Control (post-improvement).
- **Source inputs.** Baseline dataset; Post-improvement dataset.
- **Required sections/fields.**
  - Chart type selected per Part 6.8 rules (X-bar/R, I-MR, p, np, c, u)
  - CL (center line), UCL, LCL
  - Western Electric rules 1–4 applied
  - Out-of-control points flagged
  - Stability disposition
  - Pre/Post comparison (two-panel plot)
- **Acceptance criteria.** Correct chart type for data class; rules applied; disposition documented; UCL/LCL computed from first 25 subgroups (not from whole dataset including special cause).
- **Downstream uses.** Capability Report thresholds; Control Plan monitoring thresholds; Monitoring Dashboard alert rules.
- **Typical failure modes.** (1) Wrong chart type (X-bar on individual data). (2) UCL/LCL computed after special-cause removal not documented → appears stable falsely. (3) Rules 1 only applied; rules 2–4 ignored.
- **Standard template guidance.** Per `docs/Business Agility Standard Work.txt #29` + `CATALOG_GAPS.md §D.2` pattern.

### A12 — Process Capability Report

- **Name.** Process Capability Report (Cp, Cpk, Pp, Ppk, DPMO, σ-level).
- **Purpose.** Quantify capability vs spec limits; deliver the number executives care about.
- **Why it matters.** "Cpk" is the DMAIC output the Sponsor uses to decide whether capability target is reached.
- **Owner.** Analyst.
- **Phase created.** Measure (baseline); Control (post-improvement).
- **Source inputs.** Baseline dataset; Post-improvement dataset; USL/LSL from CTQ.
- **Required sections/fields.**
  - Normality check or transform documentation
  - Cp = (USL − LSL) / 6σ̂ (within-subgroup σ̂)
  - Cpk = min((USL − μ)/3σ̂, (μ − LSL)/3σ̂)
  - Pp, Ppk (overall σ)
  - DPMO (defects per million opportunities)
  - Process sigma (from DPMO table)
  - Non-normal handling (Weibull / Johnson / Box-Cox) if required
  - Disposition: Inadequate (< 1.33), Capable (1.33–1.67), World-Class (> 1.67)
- **Acceptance criteria.** All indices computed; transform documented if non-normal; pre/post comparison in Control phase.
- **Downstream uses.** Charter goal validation; Final Results Narrative; Portfolio rollup.
- **Typical failure modes.** (1) Non-normal data fitted with normal capability. (2) Spec limits from internal guess not customer. (3) Pp and Cp conflated.
- **Standard template guidance.** Per `CATALOG_GAPS.md §D.1`.

### A13 — Continuous Reporting Dashboard spec [Added during validation]

- **Name.** Continuous Reporting Dashboard.
- **Purpose.** Live dashboard showing baseline, current, target, delta, trend; runs from Measure through Control and sustainment.
- **Why it matters.** Without a live surface, stakeholders lose visibility; Sponsor disengages; project becomes private.
- **Owner.** Analyst; handoff to Process Owner at Control.
- **Phase created.** Measure; maintained through close and sustainment.
- **Source inputs.** DCP data source; target from Charter; Control Plan thresholds (at Control).
- **Required sections/fields.**
  - Platform (Tableau/Looker/Quip/equivalent)
  - Metrics plotted: baseline, current, target, delta, trend
  - Refresh cadence (daily/weekly)
  - Alert rules (for Control phase; tied to Control Plan thresholds)
  - Dashboard owner
  - URL / embed link
  - Access list
- **Acceptance criteria.** Dashboard live; 4+ cards; owner named.
- **Downstream uses.** Monitoring Dashboard (A29) at Control; Sponsor monthly briefings; 30/60/90 sustainment checks.
- **Typical failure modes.** (1) Dashboard built, never shared. (2) No alerts → Control plan without live enforcement. (3) Owner unclear at handoff.
- **Standard template guidance.** Per `CATALOG_GAPS.md §C.2`.
- **Justification for addition.** Called out as `#27` in catalog but not in user's original artifact list. Required for Control-phase sustainability. Added.

### A14 — Detailed Process Maps

- **Name.** Detailed Current-State + Future-State Process Maps.
- **Purpose.** Visualize process at sub-activity granularity with VA/NVA tagging, timing, measurement points.
- **Why it matters.** C&E Matrix requires a detailed understanding of Inputs at each sub-process; a swim-lane diagram is the ground truth.
- **Owner.** Black Belt.
- **Phase created.** Analyze.
- **Source inputs.** SIPOC; SME observations; Baseline observations.
- **Required sections/fields.**
  - Swimlane (roles on lanes; activities as boxes; handoffs as arrows)
  - 3–7 sub-processes per SIPOC step; ≥ 15 total activities
  - Cycle time + wait time per activity
  - VA / NVA / NVA-necessary tag per activity
  - Measurement points (where X's could be measured)
  - Future-state map (in Improve) showing redesigned flow
- **Acceptance criteria.** ≥ 15 activities; VA/NVA tagged; SME signs.
- **Downstream uses.** C&E Matrix input candidates; FMEA process-step column; pilot scope.
- **Typical failure modes.** (1) Map drawn from Black Belt memory not SME observation. (2) VA/NVA debate consumes session time without decision. (3) Future-state map without traceability to root causes.
- **Standard template guidance.** Per `docs/Business Agility Standard Work.txt #32`; swimlane tool.

### A15 — Cause & Effect Matrix

- **Name.** Cause & Effect Matrix / Analysis.
- **Purpose.** Score every X against every Y; weight by Customer Importance; rank vital few X's for Input DCP.
- **Why it matters.** Without prioritization, Input DCP measures too many X's (wasted effort) or wrong X's (wasted project).
- **Owner.** Black Belt.
- **Phase created.** Analyze.
- **Source inputs.** SIPOC Inputs; Fishbone 6M output; CTQ Outputs.
- **Required sections/fields.**
  - Input rows (X's from SIPOC + fishbone)
  - Output columns (Y's from CTQ)
  - Customer Importance rating per Y (1–10)
  - Per X-Y cell: impact rating (0/1/4/9)
  - Weighted score per X = Σ(impact × customer importance)
  - Ranked X list
  - Vital few X identification (top 6–8)
- **Acceptance criteria.** Every X rated vs every Y; consensus captured; vital few identified.
- **Downstream uses.** Input DCP (A16) rows; FMEA inputs column.
- **Typical failure modes.** (1) All X's rated "9" on all Y's → no prioritization. (2) Single-participant rating. (3) Customer Importance inflated by sales bias.
- **Standard template guidance.** Per `docs/Business Agility Standard Work.txt #34`.

### A16 — Input Data Collection Plan (Input DCP)

- **Name.** Input Data Collection Plan.
- **Purpose.** Specify how top-scored X's are measured paired with Y observations.
- **Why it matters.** Regression on unpaired data is useless; join-key integrity is the foundation.
- **Owner.** Black Belt.
- **Phase created.** Analyze.
- **Source inputs.** C&E Matrix top X's; Output DCP; Data Dictionary.
- **Required sections/fields.**
  - Per X row: operational definition, unit, method, sampling plan (n ≥ 30 paired), time-stamp key (for join to Y), owner, tool, storage
  - MSA-risk flag per X
  - Pilot-cycle acceptance
- **Acceptance criteria.** Every X has all fields; MSA run for MSA-risk items; pilot passed.
- **Downstream uses.** Pair X-Y collection (`dmaic_analyze_05`); regression input.
- **Typical failure modes.** (1) No time-stamp key; can't join X to Y. (2) n target not met; regression underpowered. (3) Subjective X with no MSA.
- **Standard template guidance.** Per `CATALOG_GAPS.md §D.4`.

### A17 — Hypothesis Test + Correlation & Regression Report

- **Name.** Statistical Analysis Results (tests + correlation matrix + regression + DOE if run).
- **Purpose.** Document all inferential statistics with diagnostics.
- **Why it matters.** The project's causation claim rests on this artifact; MBB peer-reviews every component.
- **Owner.** Analyst.
- **Phase created.** Analyze.
- **Source inputs.** Paired X-Y dataset; hypothesis pre-registration.
- **Required sections/fields.**
  - Hypothesis pre-registration (before data tested)
  - Multiple-comparisons correction (Bonferroni / FDR) if k > 3
  - Per test: name, H0, H1, α, statistic, p, corrected p' (if applicable), effect size (Cohen's d / φ / η²), CI
  - Correlation matrix (Pearson or Spearman) with |r| flags
  - Regression: simple then multiple; R², adj-R², coefficients, p-values, VIF; residual plots (fitted-vs-residual, QQ, scale-location)
  - Logistic regression if Y binary
  - DOE plan + results if run
  - Model diagnostics disposition
- **Acceptance criteria.** Pre-registration pre-dates test execution; correction applied; diagnostics clean; MBB signs.
- **Downstream uses.** Root Cause Summary (A18) evidence; Pilot design expected-effect.
- **Typical failure modes.** (1) 15 tests run, 1 significant, claimed "root cause." (2) VIF > 10 ignored. (3) Residuals non-normal; model interpreted anyway. (4) R² reported without adj-R² on multi-regression.
- **Standard template guidance.** Per `CATALOG_GAPS.md §D.5`. Use statistical package output; augment with narrative.

### A18 — Root Cause Summary

- **Name.** Root Cause Summary with confound-check.
- **Purpose.** Consolidate validated causes with mechanism + evidence + effect-size + lever.
- **Why it matters.** Improve phase targets this list; if the list includes correlates-not-causes, Improve fails.
- **Owner.** Black Belt.
- **Phase created.** Analyze.
- **Source inputs.** Regression results; DOE (if run); confound-check analysis.
- **Required sections/fields.**
  - Per validated cause: mechanism (1 sentence), evidence summary, effect-size estimate with CI, improvement lever
  - Confound-check table: per cause, alternative explanations ruled out with evidence
  - Ranked cause list
  - Correlate-only list (X's that correlate but causation not established)
- **Acceptance criteria.** Per cause: 4 fields; confound-check complete; MBB signs.
- **Downstream uses.** Improvement Backlog (A23); FMEA cross-reference; Improve pilot design.
- **Typical failure modes.** (1) Correlate claimed as cause. (2) Confound-check skipped. (3) Effect size from single point estimate without CI.
- **Standard template guidance.** Per Part 6.5 rigor requirements.

### A19 — Failure Modes Effects Analysis (FMEA)

- **Name.** FMEA with RPN scoring.
- **Purpose.** Risk-rank failure modes; drive Control Plan detection mechanisms.
- **Why it matters.** Catches high-Severity-low-Occurrence modes that correlation misses; informs Control Plan.
- **Owner.** Black Belt (facilitator); team (authors).
- **Phase created.** Analyze.
- **Source inputs.** Detailed Process Map; validated root causes; SME knowledge.
- **Required sections/fields.**
  - Per failure mode row: process step, failure mode, effect, Severity (1–10), cause, Occurrence (1–10), current controls, Detection (1–10), RPN = S×O×D, recommended action, owner, target date
  - Scale anchors for S/O/D
  - Top-RPN threshold (typically > 100 or top quartile)
- **Acceptance criteria.** ≥ 15 modes; ≥ 3 actions for top RPN; owner per action.
- **Downstream uses.** Improvement Backlog (A23); Control Plan (A26) detection mechanisms.
- **Typical failure modes.** (1) Inflated RPN (everyone is "10" on Severity). (2) Recommended actions without owners. (3) FMEA disconnected from vital X's.
- **Standard template guidance.** Per `docs/Business Agility Standard Work.txt #37`; AIAG FMEA format.

### A20 — Hypothesis Test Results Log [Added during validation]

- **Name.** Hypothesis Test Results Log.
- **Purpose.** Running log of every hypothesis test with pre-registration, result, disposition.
- **Why it matters.** Fights p-hacking by making the family-wise test count visible and auditable.
- **Owner.** Analyst.
- **Phase created.** Analyze.
- **Source inputs.** Pre-registration; test outputs.
- **Required sections/fields.**
  - Pre-registered H0/H1, test, α (before data)
  - Result: statistic, p, corrected p' (post-correction), effect size, CI, disposition
  - Date pre-reg, date tested, tester
- **Acceptance criteria.** Every test in log has pre-reg timestamp < test timestamp.
- **Downstream uses.** MBB review; post-hoc audit.
- **Typical failure modes.** Post-hoc additions claiming pre-registration.
- **Standard template guidance.** Append-only log; version-controlled.
- **Justification.** Called out as part of `#36` but separating into a dedicated artifact supports p-hacking prevention. Added.

### A21 — Pilot Plan

- **Name.** Pilot Plan.
- **Purpose.** Design the bounded experiment to test countermeasures at statistically-valid scale.
- **Why it matters.** Pilot is the first proof the improvement works; weak design = inconclusive results = project stalls.
- **Owner.** Black Belt.
- **Phase created.** Improve.
- **Source inputs.** Vital X's; validated root causes; Baseline measurement system.
- **Required sections/fields.**
  - Scope (process area, time window)
  - Control group plan (A/B if feasible) or before/after-in-same-unit
  - n required computed from power analysis (effect size, α=0.05, power=0.80)
  - Measurement plan (same method as Baseline)
  - Success criteria (p < α AND effect size meaningful)
  - Rollback criteria (what triggers abort)
  - Timeline
  - Sponsor + PO signatures
- **Acceptance criteria.** Sponsor + PO sign; n from power calc; rollback defined.
- **Downstream uses.** Pilot execution (`dmaic_improve_05`); Pilot data collection (`dmaic_improve_06`); Pilot Results.
- **Typical failure modes.** (1) Under-powered n (team undershoots because "we'll see what happens"). (2) No rollback; can't abort. (3) Measurement method drifts from Baseline.
- **Standard template guidance.** Power analysis via statistical package; pilot plan template.

### A22 — Quick Wins Log

- **Name.** Quick Wins Log.
- **Purpose.** Track lightweight reversible improvements executed outside main pilot.
- **Why it matters.** Momentum-building; prevents scope sprawl into pilot; captures learnings.
- **Owner.** Implementation Lead.
- **Phase created.** Improve.
- **Source inputs.** Quick Win Candidate Log (`dmaic_analyze_14`).
- **Required sections/fields.**
  - Per win: name, hypothesis, filter passed (lead < 1 wk / cost < $1K / effort < 2 PD / reversible), pre-measurement (≥ 5 obs), post-measurement (≥ 5 obs), significance test (Mann-Whitney), decision (keep/revert), date
- **Acceptance criteria.** Per win: filter documented; pre/post measured; decision logged.
- **Downstream uses.** Improvement Backlog (scaling candidates); Results Narrative learnings.
- **Typical failure modes.** (1) Quick Win breaks filter (cost > $1K); rebranded. (2) Pre/post measurement skipped. (3) Reverts not logged.
- **Standard template guidance.** Per `CATALOG_GAPS.md §D.3`.

### A23 — Process Improvement Backlog

- **Name.** Process Improvement Backlog.
- **Purpose.** Prioritized list of improvements with Day-2-Done criteria, effort, impact.
- **Why it matters.** Without ranked backlog, Improve phase implements by enthusiasm.
- **Owner.** Black Belt.
- **Phase created.** Improve.
- **Source inputs.** FMEA actions; Quick Wins pending; root-cause levers; VOC gaps; retro items.
- **Required sections/fields.**
  - Per item: rank, name, description, Day-2-Done criterion (observable), effort (hours/t-shirt), expected impact (Y delta), confidence (0.5–0.9), dependencies, owner, status
  - Prioritization method (RICE / WSJF / Impact × Confidence / Effort)
- **Acceptance criteria.** Day-2-Done observable per item; PO approves ranking.
- **Downstream uses.** Pilot scope selection; Control Plan items.
- **Typical failure modes.** (1) Vague Day-2-Done ("improved"). (2) No effort estimate. (3) Priority drifts without PO concurrence.
- **Standard template guidance.** Per `CATALOG_GAPS.md §D.6`.

### A24 — Pilot Results

- **Name.** Pilot Results.
- **Purpose.** Statistical comparison pilot vs baseline; disposition; scale decision input.
- **Why it matters.** Go/No-Go decision rests on this artifact.
- **Owner.** Analyst.
- **Phase created.** Improve.
- **Source inputs.** Pilot dataset; Baseline dataset.
- **Required sections/fields.**
  - Summary stats pre vs post
  - Assumption checks (normality, equal variance)
  - Test: name, statistic, p, effect size (Cohen's d / φ / odds ratio), CI on delta
  - Disposition: Success / Inconclusive / Failed
  - Practical delta
- **Acceptance criteria.** Test appropriate; effect size reported; CI reported; MBB reviews.
- **Downstream uses.** Scale decision; Financial Benefit pass 1.
- **Typical failure modes.** (1) p-value alone without effect size. (2) Wrong test (t on non-normal). (3) No CI.
- **Standard template guidance.** Statistical package output + narrative.

### A25 — Implemented Improvements Log

- **Name.** Implemented Changes Log.
- **Purpose.** Per-change record: what changed, when, where, by whom, before/after.
- **Why it matters.** Audit trail; SOP diff; sustainment troubleshooting.
- **Owner.** Implementation Lead.
- **Phase created.** Improve.
- **Source inputs.** Pilot + scale execution.
- **Required sections/fields.**
  - Per change: ID, name, description, scope (where), date, owner, before-state measurement, after-state measurement, SOP version bumped (if applicable), status (in-production / reverted)
- **Acceptance criteria.** Every change logged; SOP bump traceable.
- **Downstream uses.** Results Narrative; SOP v2.0 final; sustainment audits.
- **Typical failure modes.** (1) Changes made informally, not logged. (2) SOP delta misses change. (3) Reverts silent.
- **Standard template guidance.** Per `docs/Business Agility Standard Work.txt #40`.

### A26 — Control Plan

- **Name.** Control Plan.
- **Purpose.** Document the sustainment system: monitoring metrics, thresholds, responses, ownership.
- **Why it matters.** Sustainment depends on this artifact being operational, not filed.
- **Owner.** Black Belt (author); Process Owner (signs + owns).
- **Phase created.** Improve (draft); Control (final).
- **Source inputs.** Validated root causes; Baseline Control Chart thresholds; FMEA.
- **Required sections/fields.**
  - Per vital X: monitoring metric, measurement method, frequency, UCL/LCL, threshold for action, response playbook, rollback criterion, owner
  - Dashboard URL
  - 30/60/90-day check-in calendar holds
  - SOP references
  - PO signature + Sponsor signature
- **Acceptance criteria.** Per X: all 8 fields; dashboard live; calendar holds created; both signatures.
- **Downstream uses.** Monitoring Dashboard; sustainment check-ins; audit.
- **Typical failure modes.** (1) Plan = PDF, dashboard never built. (2) Thresholds without response. (3) Calendar holds declared but not booked.
- **Standard template guidance.** Per AIAG Control Plan format adapted to BAM.

### A27 — Financial Benefit Translator (pass 1 + pass 2)

- **Name.** Financial Benefit Translator.
- **Purpose.** Quantify annualized benefit; Finance co-signs both passes.
- **Why it matters.** ROI validity is the #1 credibility surface of the DMAIC program.
- **Owner.** Black Belt (author); Finance (signs).
- **Phase created.** Improve (pass 1 projected); Control (pass 2 actual + reconciliation).
- **Source inputs.** Pilot results (pass 1); Post-improvement delta (pass 2); unit cost data.
- **Required sections/fields.**
  - Per benefit line: description, category (Hard / Soft / Cost Avoidance), monthly delta, annualized delta, evidence link (P&L ref / FTE-release memo / basis calc), confidence
  - Implementation cost breakdown (people × fully-loaded / tools / systems / training / consultants)
  - Net annual benefit
  - ROI = (annual benefit − impl cost) / impl cost
  - Finance signature (pass 1 and pass 2)
  - **Pass 2 only:** reconciliation delta vs pass 1, with explanation
- **Acceptance criteria.** Every line classified with evidence; Finance signs; negative reconciliation delta triggers MBB review.
- **Downstream uses.** Kaizen ROI field; portfolio benefits ledger; Executive Report.
- **Typical failure modes.** (1) Time-savings × rate claimed as Hard without FTE-release. (2) Pass 1 projected never reconciled against pass 2 actual. (3) Implementation cost undercounted (people time omitted).
- **Standard template guidance.** Per `CATALOG_GAPS.md §C.4`.

### A28 — Post-Improvement Dataset

- **Name.** Post-Improvement Dataset (remeasurement).
- **Purpose.** Post-improvement performance captured with same method as Baseline.
- **Why it matters.** Apples-to-apples comparison requires method parity.
- **Owner.** Analyst.
- **Phase created.** Control.
- **Source inputs.** Baseline DCP; scaled countermeasures in production.
- **Required sections/fields.** Same schema as A09 (Baseline Dataset); method-parity attestation; n ≥ baseline_n × 0.9.
- **Acceptance criteria.** n met; method parity attested; exclusions identical to baseline.
- **Downstream uses.** Post Control Chart, Post Capability, Financial Benefit pass 2.
- **Typical failure modes.** (1) Different exclusion rule silently. (2) Post measured in different time-of-day/day-of-week window.
- **Standard template guidance.** Same as A09 with method-parity memo header.

### A29 — Monitoring Dashboard Spec [Added during validation]

- **Name.** Monitoring Dashboard Specification.
- **Purpose.** Spec the live dashboard that enforces Control Plan thresholds.
- **Why it matters.** Control Plan without live enforcement = theater.
- **Owner.** Analyst.
- **Phase created.** Improve (spec); Control (live).
- **Source inputs.** Control Plan; Continuous Reporting Framework.
- **Required sections/fields.**
  - Per metric card: name, source, refresh cadence, threshold (from Control Plan), alert rule (email/chat/escalation)
  - Alert-test evidence
  - Dashboard URL
  - Owner
- **Acceptance criteria.** Alerts tested; thresholds match Control Plan; owner named.
- **Downstream uses.** Sustainment check-ins; regression detection.
- **Typical failure modes.** Alerts configured, never tested.
- **Standard template guidance.** Dashboard platform native + monitoring spec doc.
- **Justification.** Part of `#41` / `#27` but an operational-dashboard artifact deserves its own spec. Added.

### A30 — Project Results Narrative (Executive Report)

- **Name.** Project Results Narrative Document (per `#41`).
- **Purpose.** Canonical 6-page narrative binding problem → baseline → root cause → improvements → results → control → lessons.
- **Why it matters.** Single authoritative record for portfolio, audit, replication.
- **Owner.** Black Belt.
- **Phase created.** Control.
- **Source inputs.** All project artifacts.
- **Required sections/fields.**
  - Executive summary (1 paragraph: problem → result → annualized benefit)
  - Background (business case, scope, goal)
  - Results (baseline vs remeasurement, Control Chart before/after, Capability before/after, p, effect size, CI)
  - Root cause findings (vital X's, FMEA top modes)
  - Implemented improvements (list with before/after)
  - Financial benefit (pass 1 vs pass 2 reconciliation)
  - Control plan summary
  - Lessons learned
  - Sponsor sign-off
- **Acceptance criteria.** All 9 sections; evidence linked; MBB + Sponsor sign.
- **Downstream uses.** Portfolio; replication at other sites; audit.
- **Typical failure modes.** (1) Results section without statistical evidence. (2) Reconciliation delta buried or omitted. (3) Lessons learned vague.
- **Standard template guidance.** Per `CATALOG_GAPS.md §D.7`.

### A31 — Lessons Learned

- **Name.** Lessons Learned Memo.
- **Purpose.** What worked, what didn't, what to replicate, anti-patterns, statistical gotchas.
- **Why it matters.** Program-level learning vehicle.
- **Owner.** Black Belt.
- **Phase created.** Control.
- **Source inputs.** Team retro; BB observations.
- **Required sections/fields.**
  - ≥ 5 lessons: what happened, what we learned, what we'd do next time
  - ≥ 2 anti-patterns to avoid
  - ≥ 1 statistical gotcha
  - Replication guidance for similar processes
- **Acceptance criteria.** ≥ 5 lessons; ≥ 2 anti-patterns.
- **Downstream uses.** Next DMAIC intake; MBB library; org capability uplift.
- **Typical failure modes.** "Great collaboration" generic statements.
- **Standard template guidance.** Bullet list.

### A32 — Process Owner Transition Memo [Added during validation]

- **Name.** Process Owner Transition Memo.
- **Purpose.** Formal ownership transfer from Black Belt to Process Owner.
- **Why it matters.** Ownership ambiguity post-close kills sustainment.
- **Owner.** Black Belt.
- **Phase created.** Control.
- **Source inputs.** Control Plan; Results Narrative; Implemented Changes Log.
- **Required sections/fields.**
  - Summary of improvements
  - Current performance
  - Sustainment obligations (dashboard, 30/60/90 checks, SOP ownership)
  - Escalation path
  - Both signatures
- **Acceptance criteria.** Both sign.
- **Downstream uses.** Sustainment; audit.
- **Typical failure modes.** PO accepts verbally, never signs.
- **Standard template guidance.** 1-page memo.
- **Justification.** Analog to Kaizen `#50` Process Owner Transition; elevated to DMAIC as formal artifact. Added.

### Part 4 summary

**Total artifacts: 32 (A01–A32 plus pass-1/pass-2 variants and baseline/post variants of A11 and A12).** Added beyond the user's ~21-item list: **A08 Data Dictionary, A13 Continuous Reporting Dashboard, A20 Hypothesis Test Results Log, A29 Monitoring Dashboard Spec, A32 Process Owner Transition Memo** — five additions, each tied to a Part 1.5 refinement or Part 6 statistical rigor requirement.



---

## Part 5 — Problem Definition Framework

The problem statement is the single most important artifact in a DMAIC project. A Charter can be redrafted; a problem statement that commits the team to the wrong Y, wrong scope, or unmeasurable CTQ cannot be recovered without scope abandonment (`dmaic_glue_04`) and a new Kaizen.

DMAIC's problem statements differ from The Accelerator's in three operational ways:

1. **CTQ linkage is mandatory.** Every problem must trace Voice → CTQ → primary Y metric. Accelerator can accept "reduce cycle time by 30%" as-is; DMAIC requires "reduce order-to-cash cycle time (CTQ: P95 ≤ 5 business days, from VOC theme 'payment delays disrupt cash-flow forecasting')".
2. **Primary Y data type must be declared.** Continuous / discrete / categorical — this drives all of Part 6's test selection.
3. **Baseline placeholder is named.** Even before Measure runs, the statement commits to *which* metric will carry the baseline number, not a generic "improve cycle time".

### 5.1 Required structure

Every DMAIC problem statement has **seven parts**, in order:

1. **Process under study** — named, scope-bound (customer segment / org unit / system).
2. **Current state** — what is observed today, quantified if known (placeholder if pre-Baseline).
3. **Impact** — business cost of the current state, with cost basis.
4. **CTQ linkage** — the Voice→Driver→CTQ chain that justifies the Y choice.
5. **Primary Y metric** — name, unit, data type (continuous/discrete/categorical), baseline placeholder value, target value.
6. **Operational boundaries** — in-scope (time window, customer segment, systems, org units) + explicit out-of-scope.
7. **Timeframe** — when the project runs; sprint count estimate.

**Template (reusable):**

```
[Process] has [current-state observation of poor performance], quantified as
[baseline_placeholder] on [primary_Y: unit, data_type]. This causes [business
impact] at a cost of [$ estimate / risk class] per [time unit], measured on a
[cost basis: fully-loaded / marginal / activity-based] basis. Customer voice
from [VOC theme] and business voice from [VOB theme] converge on the CTQ
[CTQ statement with measurable attribute]. The project targets a shift from
[baseline] to [target] within [timeframe]. Scope includes [in-scope items];
explicitly excludes [out-of-scope items].
```

### 5.2 Measurable variables — what must be quantified

| Element | What to quantify | Statistical type |
|---|---|---|
| Primary Y | Value, unit, target | Continuous (time, dollar, count rate), Discrete (count), Categorical (pass/fail, disposition class) |
| Baseline placeholder | An approximate value if available, or "to be measured in Phase 2" | Same as Y |
| Target | A specific value with confidence | Same as Y |
| Business impact | Annual $ at current state | Currency |
| Cost basis | "Fully-loaded", "Marginal", "Activity-based cost" | Categorical |
| Sample size target | n ≥ 30 continuous or ≥ 100 proportions | Integer |
| Timeframe | Sprint count (8–12 typical) | Integer |

### 5.3 Operational boundaries

**In-scope dimensions to declare:**

- Time window the baseline will cover (e.g., "last 90 days" or "Jan–Mar 2026")
- Customer segment / product line / geographic region
- Systems of record included
- Org units whose process this is
- Process steps from [start event] to [end event]

**Out-of-scope dimensions to explicitly exclude:**

- Adjacent processes the team might be tempted to absorb
- Customer segments not covered by this project's VOC interviews
- Systems undergoing unrelated transformation (avoid confounds)
- Time periods with known anomalies (pandemic, system migration, regulatory change)

### 5.4 Three good examples

**Good Example 1 — Manufacturing yield (continuous Y with spec limits):**

> The **injection-molding line 3 at Plant A** produces [widget X] with observed **first-pass yield of 78%** (baseline placeholder, Q1 2026 data, n=2,400 parts) on the primary CTQ **surface finish defect rate (data type: proportion, unit: defects per 100 parts, target ≤ 3%)**. This causes $1.2M annual rework cost on a fully-loaded basis. Customer voice ("surface imperfection is our top complaint, ticket volume confirms") and business voice ("rework consumes 18% of line capacity") both converge on the CTQ **proportion of parts passing surface-finish inspection ≥ 97% at first-pass**. The project targets **78% → 97%** first-pass yield over **10 sprints**. Scope: injection-molding line 3, product X, Plant A, current tooling. Out of scope: line 4 (different tool), product Y (different material), Plant B.

*What makes it good:* Named process; quantified baseline; cost basis stated; CTQ from VOC/VOB; continuous Y with clear spec; scope boundaries explicit; timeframe committed.

**Good Example 2 — Call-center First-Call Resolution (proportion Y, stratification implied):**

> The **Tier-1 technical support queue for Product Line Alpha** resolves inquiries on first call **52% of the time** (baseline placeholder, last 30 days, n=4,800 calls). This drives an annualized $850K in repeat-call labor (fully-loaded basis, per FP&A cost model) and customer-sat risk (VOC: "calling back is the biggest frustration"). CTQ from VOC theme "one call, done" and VOB theme "reduce cost-to-serve by 15%" is **First-Call Resolution proportion (data type: proportion, unit: FCR%, target ≥ 70%)**. Target **52% → 70%** over **12 sprints**. Scope: Tier-1 agents, Product Line Alpha, incoming voice channel, North America region. Out of scope: chat / email channels, Product Line Beta, outbound dispositions, Tier-2 escalations.

*What makes it good:* Proportion Y with n ≥ 100 feasible; cost basis named; stratification evident (channel, product, region); scope carves cleanly.

**Good Example 3 — Healthcare 30-day readmission (categorical Y, regulated):**

> Hospital X's **30-day readmission rate for DRG 291 (heart failure)** stands at **22%** (baseline placeholder, CMS-reported FY2025, n=850 discharges). This triggers $2.1M annual CMS penalty exposure and is flagged in our Joint Commission survey. VOC (patient interviews: "I didn't know what to do at home"), VOB (Quality committee: "reduce by 5 pp to exit penalty band"), and VOA (discharge planners: "we don't have standard discharge protocol") converge on the CTQ **30-day readmission proportion (data type: proportion, target ≤ 17%)**. Target **22% → 17%** over **16 sprints**. Scope: DRG 291 discharges from Cardiology service, Hospital X, FY2026. Out of scope: DRG 292 / 293 (related but different patient mix), other hospitals in system, 90-day readmission (different CMS measure).

*What makes it good:* Regulated domain with existing CMS measure (operational definition exists); clear primary Y; VOC/VOB/VOA all heard; scope and timeframe explicit.

### 5.5 Three bad examples (and what's wrong)

**Bad Example 1 — Solution-prescribing:**

> "We need to **implement a new CRM** to improve customer response time."

*What's wrong:* (1) Solution-prescribes (CRM) before Analyze. (2) No baseline, no target. (3) No CTQ. (4) No cost impact. (5) No scope. Violates all 7 structural parts.

**Bad Example 2 — Unquantified / vague CTQ:**

> "Customer service is slow and customers are unhappy. We want to improve response quality."

*What's wrong:* (1) "Slow" — what's the unit? Seconds, minutes, days? (2) "Unhappy" — NPS? CSAT? Ticket escalations? (3) "Response quality" — not measurable without operational definition. (4) No scope boundaries. (5) No timeframe.

**Bad Example 3 — Scope too broad / confounded:**

> "Reduce operating cost across all departments by 15% in 6 months, improving quality while we're at it."

*What's wrong:* (1) Not a single process — "all departments". (2) "Quality" is a compound CTQ without decomposition. (3) "While we're at it" signals undeclared secondary objectives. (4) 6-month target with undefined scope cannot be baselined. (5) No Y data type.

### 5.6 Common errors — top 10 DMAIC problem-statement failures

| # | Error | What it causes |
|---|---|---|
| 1 | Solution-prescribing language ("implement X", "automate Y") | Analyze phase skipped; Improve targets chosen solution, not root cause |
| 2 | Vague primary Y ("improve satisfaction") | Baseline cannot be measured; remeasurement cannot compare |
| 3 | Missing unit on Y | DCP cannot be authored; team disagrees on what to measure |
| 4 | Missing data type declaration | Wrong statistical tests selected (Part 6 misapplied) |
| 5 | Scope too broad (multi-process, multi-org) | Baseline not feasible in one DCP; regression confounded |
| 6 | Out-of-scope list absent | Scope creep during Measure; re-baseline required |
| 7 | No cost basis on financial impact | Finance refuses ROI sign-off; pass 2 rejected |
| 8 | Baseline placeholder missing | Team debates baseline for weeks in Measure |
| 9 | Target unquantified ("significantly better") | No success criterion; close judgment subjective |
| 10 | Timeframe open-ended | Project runs indefinitely; Sponsor disengages |

### 5.7 Linkage to financial impact (COPQ framework)

DMAIC problems quantify impact via **Cost of Poor Quality (COPQ)** across four categories:

| Category | Definition | Example |
|---|---|---|
| **Prevention** | Costs to prevent defects before occurrence | Training, SOP authoring, preventive maintenance |
| **Appraisal** | Costs to detect defects | Inspection, testing, auditing |
| **Internal Failure** | Costs when defects detected before customer | Rework, scrap, retest, downtime |
| **External Failure** | Costs when defects reach customer | Warranty, returns, lost sales, brand damage |

**Rule.** Every DMAIC problem statement quantifies current-state impact in at least one of Internal or External Failure categories (these are the "pain" axes). Target-state reduction is the Hard-dollar benefit claim basis.

**Typical COPQ share.** In mature organizations, COPQ runs 5–15% of revenue. DMAIC projects typically attack 0.5–2% of revenue per project in Internal or External Failure.

### 5.8 Reusable template

```
TEMPLATE — DMAIC PROBLEM STATEMENT

Process: [named, scope-bound process]
Current state: [observation of poor performance, with numeric baseline placeholder if known]
Impact: [$ annualized] at [cost basis: Fully-loaded / Marginal / ABC], COPQ category: [Internal Failure / External Failure / Appraisal / Prevention]
Customer voice (VOC theme): [quoted or paraphrased customer concern]
Business voice (VOB theme): [financial / strategic / compliance driver]
Associate voice (VOA theme): [process-worker pain or waste observation]
CTQ (Critical-to-Quality requirement): [measurable attribute with spec: e.g., "Response time ≤ 4 hours for P1 tickets"]
Primary Y metric:
  Name: [metric name]
  Unit: [unit]
  Data type: [continuous / discrete / categorical]
  Baseline placeholder: [value, or "to be measured in Phase 2"]
  Target: [value]
Operational boundaries:
  In scope: [time window, customer segment, systems, org units, start/end events]
  Out of scope: [explicit exclusions — list at least 3]
Timeframe: [start date], target close [end date], sprint count [N]
```

---

## Part 6 — Statistical Rigor Model

**This is the DMAIC standard's differentiator from The Accelerator.** Every statistical claim in a DMAIC project must meet the bars below. No exceptions without explicit MBB waiver, and waivers must be logged in the Project Results Narrative.

Part 6 is organized as a decision framework, not a textbook. For each statistical decision, it names the method, the acceptance criterion, the common pitfall, and the MBB-audit question.

### 6.1 Data types and selection rules

Every variable is one of three types. Misclassification drives the #1 statistical error in DMAIC: wrong test selected.

| Type | Definition | Valid operations | Examples |
|---|---|---|---|
| **Continuous** | Measurable on an interval or ratio scale; any value in range | Mean, SD, t-test, ANOVA, regression | Time (seconds, hours, days), dollar, weight, pressure |
| **Discrete (count)** | Non-negative integer; no fractional values | Poisson models, rate statistics, c/u charts | Defect count per unit, calls per hour, error count per shift |
| **Categorical — binary (attribute)** | Two classes (pass/fail, yes/no) | Proportions test, chi-square, p/np charts, logistic regression | FCR (yes/no), defect (yes/no), readmission (yes/no) |
| **Categorical — nominal** | Two+ unordered classes | Chi-square, multinomial regression | Disposition code, root-cause class, defect type |
| **Categorical — ordinal** | Ordered classes (low/med/high) | Ordinal regression, rank-sum | Severity rating 1–5, satisfaction 1–10 (Likert) |

**Conversion pitfalls:**

1. **Continuous → pass/fail collapse.** Converting continuous response time to "met SLA yes/no" loses statistical power (typically 40–60% of sample-size efficiency). Keep continuous when spec limits are available; use binary only when operational rules demand it.
2. **Ordinal treated as continuous.** Likert 1–5 is ordinal; computing "mean satisfaction = 3.4" is debatable. Use ordinal regression or median/quartile reporting instead.
3. **Discrete treated as continuous.** Count data (e.g., defects per unit) with small means is not normally distributed — use Poisson / negative binomial models or c/u charts, not X-bar charts.

### 6.2 Measurement System Analysis (MSA)

MSA is not optional in DMAIC — it is mandatory before Baseline locks (`#28 dependsOn #31`). The measurement system's variance is a component of observed variance: σ²observed = σ²process + σ²measurement. If σ²measurement is large relative to σ²process, the "process variation" the team sees is mostly noise.

**6.2.1 Gage R&R for continuous measurements:**

| Method | When | Design |
|---|---|---|
| **ANOVA-method Gage R&R** (preferred) | Any continuous measurement | 10 parts × 2–3 appraisers × 2–3 trials, randomized |
| **X-bar/R-method Gage R&R** (legacy) | Simple cases, documentation compatibility | Same design, different math |

**Computed metrics:**

- **Repeatability (Equipment Variation, EV).** Variation when same appraiser measures same part multiple times.
- **Reproducibility (Appraiser Variation, AV).** Variation across appraisers measuring same part.
- **Total Gage R&R.** Combined EV + AV.
- **%Study Variance (%SV).** Gage R&R variance as % of total observed variance (includes part-to-part variance).
- **%Tolerance (%Tol).** Gage R&R variance as % of specification tolerance.
- **Number of Distinct Categories (NDC).** Int(1.41 × PV / GRR), where PV = part variance.

**Acceptance thresholds:**

| %R&R (Study Var or Tolerance) | NDC | Disposition |
|---|---|---|
| < 10% | ≥ 5 | **Excellent** — proceed |
| 10–30% | ≥ 4 | **Marginal** — proceed if cost-justified; MBB approves |
| > 30% | < 4 | **Unacceptable** — fix and re-run |

**MBB audit question.** "Was ANOVA method used? Was the part panel selected to span the process range? Were measurements blinded (appraiser didn't see prior readings)? Was randomization logged?"

**6.2.2 Kappa for attribute measurements:**

For categorical Y (pass/fail, disposition class): Cohen's Kappa (2 appraisers) or Fleiss' Kappa (3+).

| Kappa | Disposition |
|---|---|
| ≥ 0.9 | Excellent |
| 0.7–0.9 | Acceptable |
| < 0.7 | Fix and redo |

**Sample size:** 20+ samples across all classes; balanced if possible. Chance-corrected agreement (Kappa) preferred over raw agreement (%); raw agreement is deceptive on class-imbalanced data.

**6.2.3 Bias, linearity, stability:**

Beyond R&R, check:

- **Bias.** Mean of measurements vs reference standard. Systematic offset indicates calibration issue.
- **Linearity.** Bias over the process range. Does the instrument measure small and large values equally well?
- **Stability.** Bias over time. Does the instrument drift?

If MSA reveals bias > 0.1 × tolerance, calibrate and re-run. If linearity varies by > 20% across the range, consider piecewise operational definitions.

**6.2.4 When MSA is mandatory vs optional:**

- **Always before Baseline** (`#28 dependsOn #31`) — no exceptions.
- **Always before Input DCP** (`#35`) for any X with subjective or manual measurement.
- **Always before Pilot + Remeasurement** if measurement method changed from Baseline.
- **Optional** for system-extract variables where the system writes the value (no human reading involved).

### 6.3 Baseline rigor

**Minimum sample sizes:**

| Data type | Minimum n | Rationale |
|---|---|---|
| Continuous | 30 | Central Limit Theorem approximations stabilize; Capability estimates within ±20% bias |
| Proportions (binary) | 100 | p̂ CI width manageable at p near 0.5 |
| Rare events (< 5% incidence) | 300 or 5 events, whichever larger | Event rate estimation precision |
| Rational subgrouping | 20 subgroups × 4–5 per group = 80–100 | For X-bar/R chart control-limit stability |

**Normality testing:**

- **Anderson-Darling test** for n ≥ 20: more power than Shapiro-Wilk in tails. Reject normality at p < 0.05.
- **Shapiro-Wilk** for n < 50: classical small-sample normality.
- **Visual checks** (histogram, Q-Q plot) complement but don't replace formal tests.

**When normality fails:**

1. **Transform.** Box-Cox, Johnson, log, square-root. Document transformation; re-test normality on transformed data.
2. **Non-parametric alternatives.** Mann-Whitney (vs t), Kruskal-Wallis (vs ANOVA), Spearman (vs Pearson).
3. **Non-normal capability.** Weibull, Johnson, percentile-based capability (Ppk% metric).

**Stability checks before calling a distribution the baseline:**

- Run Control Chart across collection window.
- Assess Western Electric rules 1–4.
- If special cause: root-cause it, remove affected data with justification, re-test stability.
- If stable: summary stats are a valid baseline.

### 6.4 Hypothesis testing approach

Every inferential claim in Analyze goes through a named hypothesis test with pre-registration.

**6.4.1 Test selection by data type and comparison:**

| Comparison | Continuous (normal) | Continuous (non-normal) | Proportion | Count | Categorical (k classes) |
|---|---|---|---|---|---|
| 1-sample vs target | 1-sample t | Wilcoxon signed-rank | 1-proportion Z | Poisson test | χ² goodness-of-fit |
| 2 independent samples | Welch's t (unequal var) | Mann-Whitney U | 2-proportion Z | Poisson two-sample | χ² independence (2×k) |
| Paired 2 samples | Paired t | Wilcoxon signed-rank | McNemar's | — | Stuart-Maxwell |
| k (3+) independent groups | ANOVA (+ Tukey) | Kruskal-Wallis (+ Dunn) | χ² independence (k×2) | Poisson regression | χ² independence (k×m) |
| k repeated measures | Repeated-measures ANOVA | Friedman | Cochran's Q | — | Generalized estimating eqn |

**Welch's t (vs Student's t).** Welch's doesn't assume equal variances; Student's does. In DMAIC, variances usually differ pre/post (that's often what we're improving), so **Welch's is the default** for 2-sample continuous comparisons.

**6.4.2 Multiple-comparisons correction:**

If k > 3 hypothesis tests run on the same family (e.g., comparing 5 X's each against Y), family-wise error rate explodes:

- At α = 0.05 per test, with k = 5 tests, family-wise α ≈ 1 − (0.95)^5 ≈ 0.23 — roughly 1 in 4 chance of false positive somewhere.

**Corrections:**

| Method | When | Formula |
|---|---|---|
| **Bonferroni** | k ≤ 10, conservative | α' = α / k |
| **Holm-Bonferroni** | Better power than Bonferroni | Sequential |
| **Benjamini-Hochberg (FDR)** | k > 10 or exploratory | Controls False Discovery Rate |
| **Tukey HSD** | Post-hoc after ANOVA | Built into ANOVA output |
| **Dunnett's** | Post-hoc comparing to control | Fewer comparisons → more power |

**Rule.** Declare the correction in the hypothesis pre-registration (`dmaic_analyze_07`) before running tests.

**MBB audit question.** "How many tests total? What correction was declared before data was tested? What is the corrected p-threshold?"

**6.4.3 Effect size — always report:**

A p-value alone is insufficient. Report:

- **Cohen's d** for continuous: d = (μ₁ − μ₂) / σpooled. Small = 0.2, medium = 0.5, large = 0.8.
- **Hedges' g** for small-n continuous: bias-corrected Cohen's d.
- **φ** for 2×2 categorical: φ = √(χ² / n). Small = 0.1, medium = 0.3, large = 0.5.
- **η²** or **ω²** for ANOVA: proportion of variance explained.
- **Odds ratio** for binary outcomes.

**Rule.** "Statistically significant" + "practically meaningful" = success. Statistically significant with d < 0.2 is likely a large-n artifact, not a real improvement.

**6.4.4 Confidence intervals:**

Every point estimate is reported with a confidence interval. CIs communicate uncertainty in a way p-values do not.

- **95% CI default.**
- **99% CI for safety-critical** (patient safety, structural integrity).
- **90% CI acceptable for pilot-stage** quick decisions (not close-gate).

### 6.5 Correlation and regression

**6.5.1 Pearson vs Spearman:**

| Metric | Assumes | Use when |
|---|---|---|
| Pearson r | Linear relationship, both variables continuous, bivariate normal | Continuous, linear, normal |
| Spearman ρ | Monotonic relationship, rank-based | Non-linear, ordinal, outlier-heavy |
| Kendall τ | Monotonic, small-n or tied data | Small n, many ties |

**6.5.2 Linear regression diagnostics:**

Mandatory checks:

- **R²** and **adjusted R²** (adj-R² penalizes adding predictors).
- **p-value on coefficients** with α = 0.05.
- **Residual plots:**
  - Fitted-vs-residual (homoscedasticity — should be random scatter, not funnel or curve)
  - Q-Q plot (normality of residuals — should be approx. straight)
  - Scale-location (equal variance check)
  - Cook's distance (influential outliers)
- **Durbin-Watson** for time-series data (independence of residuals).

**6.5.3 Multicollinearity:**

- **Variance Inflation Factor (VIF) > 10** flags problematic multicollinearity.
- **Remedies:** remove redundant predictors; combine correlated predictors (e.g., sum or PCA); use regularized regression (ridge, lasso).

**6.5.4 When to escalate beyond simple linear:**

| Situation | Method |
|---|---|
| Y is binary | Logistic regression; report odds ratios |
| Y is count (Poisson) | Poisson regression; report rate ratios |
| Y is count (over-dispersed) | Negative binomial regression |
| Y has natural nonlinearity | Polynomial or spline regression |
| Multiple X's interact | Full interaction model with ANOVA or type-III sums of squares |
| Time-series structure | ARIMA or mixed-effects with AR(1) residuals |

**6.5.5 Correlation ≠ causation — the central DMAIC discipline:**

A correlation of r = 0.62 between X and Y does **not** mean changing X will change Y. Alternative explanations:

1. **Third-variable (confounder):** Z drives both X and Y.
2. **Reverse causation:** Y actually drives X.
3. **Selection bias:** the sample isn't representative.
4. **Chance:** especially at small n or with multiple tests.

**Required evidence for causation claim (beyond correlation):**

- **Temporal precedence.** X-change occurred before Y-change. Document with time-stamped data.
- **Mechanism.** Physical or process rationale for X → Y. SMEs attest.
- **No confound.** Stratified analysis on suspected third variables. If the relationship holds within strata, the confound is unlikely.
- **Replication.** Multiple datasets or time windows agree. Or a designed experiment (DOE) with controlled X levels confirms.

**Rule.** Analyze phase exit requires at least three of these four for each vital X elevated to "cause". The confound-check table (`dmaic_analyze_10`) captures the evidence.

### 6.6 Sample size and power analysis

Before committing to data collection, compute required n.

**Formula (2-sample t-test):**

`n per group = 2 × (Z(α/2) + Z(β))² × σ² / δ²`

Where:
- α = 0.05 → Z(α/2) = 1.96 (two-sided)
- β = 0.20 (power = 0.80) → Z(β) = 0.84
- σ = process standard deviation (from Baseline)
- δ = minimum detectable effect (practical significance)

**Example.** Baseline σ = 10 seconds; minimum improvement to detect δ = 5 seconds; α = 0.05; power = 0.80.
n per group = 2 × (1.96 + 0.84)² × 100 / 25 = 2 × 7.84 × 4 = 62.7 → round up to **63 per group**.

**Rules:**

- **Declare effect size** (Cohen's d or %delta) at pilot design time (`dmaic_improve_04`).
- **α = 0.05, power = 0.80 default.** Deviate only with MBB approval.
- **Widen CIs vs re-collect data.** If pilot n is 30 instead of planned 63, CI is √(63/30) ≈ 1.45× wider. Interpret accordingly; do not claim precision you don't have.

### 6.7 Process capability

**6.7.1 Cp and Cpk (short-term):**

- **Cp = (USL − LSL) / 6σ̂** — potential capability; ignores centering.
- **Cpk = min((USL − μ)/3σ̂, (μ − LSL)/3σ̂)** — actual capability; accounts for centering.
- **σ̂ within-subgroup** — typically from R/d₂ or S/c₄; short-term variation only.

**6.7.2 Pp and Ppk (long-term):**

- **Pp = (USL − LSL) / 6σoverall** — long-term potential.
- **Ppk = min((USL − μ)/3σoverall, (μ − LSL)/3σoverall)** — long-term actual.
- **σoverall** — classical standard deviation of the whole dataset; long-term variation including shift and drift.

**Interpretation:** Cpk > Ppk indicates process is stable but shifting over time. Cpk << Ppk indicates significant special-cause variation.

**6.7.3 DPMO and process sigma:**

- **DPMO = (defects / (units × opportunities)) × 1,000,000**
- **Process sigma:** lookup from DPMO table. 6σ = 3.4 DPMO; 4σ = 6,210 DPMO; 3σ = 66,807 DPMO.

**6.7.4 Thresholds:**

| Cpk / Ppk | Disposition |
|---|---|
| < 1.0 | Incapable; immediate action |
| 1.0–1.33 | Marginal; improvement required |
| **1.33–1.67** | **Capable; minimum DMAIC target** |
| > 1.67 | World-class |
| > 2.0 | Six Sigma (short-term) |

**6.7.5 Non-normal capability:**

If data is non-normal and transform fails:

- **Weibull fit** for life-data.
- **Johnson family** for general non-normal.
- **Percentile-based capability:** Ppk% = min((USL − Q95)/(Q95 − Q50) × k, (Q50 − Q5)/(Q5 − LSL) × k). Not equivalent to Ppk on normal data; interpret carefully.

### 6.8 Control chart selection

The choice of chart drives sustainment monitoring. Wrong chart = false alarms or missed signals.

| Data class | Subgroup size | Chart | Monitors |
|---|---|---|---|
| Continuous, subgrouped (n=2–10) | Yes | **X-bar / R** | Mean and range within subgroup |
| Continuous, subgrouped (n > 10) | Yes | **X-bar / S** | Mean and standard deviation |
| Continuous, individual observations | No | **I-MR** (Individual-Moving Range) | Individual values and moving range |
| Proportion nonconforming, constant n | No (proportion) | **p-chart** | Proportion defective |
| Proportion nonconforming, varying n | No | **p-chart** (variable limits) or **np-chart** (if constant n) | Count / proportion defective |
| Count of defects per unit, constant sample size | — | **c-chart** | Defect count (Poisson) |
| Count of defects per unit, varying sample size | — | **u-chart** | Defects per unit (rate) |

**Western Electric rules (applied to every chart):**

| Rule | Trigger | Interpretation |
|---|---|---|
| Rule 1 | 1 point beyond 3σ | Likely special cause (classical alarm) |
| Rule 2 | 2 of 3 consecutive points beyond 2σ (same side) | Shift suspected |
| Rule 3 | 4 of 5 consecutive points beyond 1σ (same side) | Sustained shift |
| Rule 4 | 8 consecutive points on same side of center | Mean shift |

**Extended rules (Nelson, AIAG 1) — optional for sensitive monitoring:**

- 6 consecutive trending up or down → trend
- 15 consecutive within 1σ → stratification (sub-grouping too narrow)
- 14 consecutive alternating up-down → systematic pattern

**Rule.** Default to Western Electric 1–4 as the Control Plan alert rule. Add extended rules only if the process's sustainment requirements justify.

### 6.9 Confidence level conventions

| Confidence | When | Rationale |
|---|---|---|
| 95% | Default for DMAIC Analyze and Control | Industry-standard balance of Type I / Type II error |
| 99% | Safety-critical (patient safety, structural failure, regulatory) | Reduces false-positive cost at expense of power |
| 90% | Pilot-stage quick decisions | Accepts higher Type I risk for faster learning; not for close-gate |

### 6.10 Decision tree — when advanced statistics are required

```
START
  ↓
Is primary Y continuous?
  ├─ NO → Proportions/count chart family (§6.8 p/np/c/u)
  │       Use χ², proportion Z, logistic or Poisson regression (§6.4)
  └─ YES
        ↓
    Is baseline n ≥ 30?
      ├─ NO → Extend baseline OR accept low-n with wider CI (MBB waiver)
      └─ YES
            ↓
        Does Anderson-Darling pass normality?
          ├─ NO → Transform (Box-Cox/Johnson/log) OR use non-parametric (§6.3)
          └─ YES
                ↓
            Is measurement system validated (§6.2)?
              ├─ NO → Run MSA; fix if unacceptable
              └─ YES
                    ↓
                Is process stable on Control Chart?
                  ├─ NO → Root-cause special cause first
                  └─ YES
                        ↓
                    Compute Cp/Cpk (§6.7)
                        ↓
                    Proceed to Analyze
                        ↓
                    Hypothesis tests with pre-registration (§6.4)
                        ↓
                    Correction if k > 3 (§6.4.2)
                        ↓
                    Regression with diagnostics (§6.5)
                        ↓
                    Causation validation: confound-check (§6.5.5)
                        ↓
                    If still unclear → DOE (§6.4.1 note) in Improve
                        ↓
                    Pilot with power analysis (§6.6)
                        ↓
                    Pre/post test with effect size + CI
                        ↓
                    Post-improvement capability
                        ↓
                    Control Plan with Western Electric rules
                        ↓
                    Close.
```

### 6.11 Summary table — Part 6 statistical methods coverage

Methods named and specified in Part 6:

1. ANOVA-method Gage R&R (continuous MSA)
2. X-bar/R-method Gage R&R (legacy)
3. Cohen's Kappa (2-appraiser attribute MSA)
4. Fleiss' Kappa (3+-appraiser attribute MSA)
5. Bias / linearity / stability (auxiliary MSA)
6. Anderson-Darling normality test
7. Shapiro-Wilk normality test
8. Box-Cox / Johnson / log transforms
9. 1-sample t, 2-sample Welch's t, paired t
10. Wilcoxon signed-rank (non-parametric paired)
11. Mann-Whitney U (non-parametric 2-sample)
12. Kruskal-Wallis (non-parametric k-sample)
13. ANOVA + Tukey HSD post-hoc
14. 1-proportion Z, 2-proportion Z, McNemar's
15. Poisson test; Poisson regression
16. Negative binomial regression
17. χ² goodness-of-fit; χ² independence
18. Pearson correlation; Spearman rank; Kendall τ
19. Simple and multiple linear regression
20. Logistic regression
21. Residual diagnostics (fitted-residual, Q-Q, scale-location, Cook's distance)
22. Durbin-Watson (independence)
23. VIF (multicollinearity)
24. Cohen's d, Hedges' g, φ, η², ω², odds ratio (effect sizes)
25. Bonferroni correction
26. Holm-Bonferroni
27. Benjamini-Hochberg FDR
28. Dunnett's test (post-hoc vs control)
29. Power analysis (sample-size calculation)
30. Cp, Cpk, Pp, Ppk (capability indices)
31. DPMO / process sigma conversion
32. Weibull / Johnson non-normal capability
33. Percentile-based capability (Ppk%)
34. X-bar/R, X-bar/S, I-MR control charts
35. p, np, c, u control charts
36. Western Electric rules 1–4
37. Nelson / extended WE rules (optional)
38. Design of Experiments (DOE): full factorial, fractional factorial, Taguchi, response surface
39. Confidence intervals (95% / 99% / 90%)

**Total methods specified: 39.** Every method has named acceptance criteria, parameter conventions, and MBB-audit questions. Every method is referenced from a Part 3 task's `Statistical requirements` field.



---

## Part 7 — Capacity Model and BAM Scheduling

### 7.1 Roles — minimum viable vs ideal

| Role | Minimum viable | Ideal | Accountability | Decision rights |
|---|---|---|---|---|
| **Executive Sponsor** | VP+ with authority across full scope | Named at Charter signature; committed to 2–4 h/month | Go/no-go; escalation; ROI sign-off | Kill; out-of-scope expansion; resource reallocation |
| **Master Black Belt (MBB)** | MBB certified with DMAIC teaching experience | Domain-familiar; embedded in CoE | Statistical rigor; Charter, MSA/Baseline, Regression/Causation, Control Plan peer-reviews | Method calls; rework demand at any gate |
| **Black Belt (Project Lead)** | Black Belt certified; ≥ 1 prior closed DMAIC | 20–30 h/wk dedicated | Project execution; artifact quality; phase gates | Day-to-day method calls; team assignments |
| **Green Belt / Analyst** | Trained in statistical tooling (Minitab/JMP/R/Python) | Embedded in Ops or Analytics | Data collection, analysis, dashboards, remeasurement | Analytical method proposals |
| **Process Owner** | Day-to-day owner of target process | Named in Define | Baseline validation; backlog priority; SOP ownership; sustainment | Backlog priority; SOP approval; sustainment response |
| **Implementation Lead** | Often same as PO or delegated senior IC | Embedded in Ops | Improve execution velocity; blocker resolution | Action sequencing; blocker escalation |
| **Subject Matter Experts (2–5)** | Practitioners covering in-scope steps | Balanced across handoffs | Baseline accuracy; SOP realism; validation; FMEA input | Correct inaccurate artifacts |
| **Finance Partner** | Operations Finance or FP&A | Embedded in Finance | Cost basis (Measure); Financial Benefit pass 1 (Improve); pass 2 + reconciliation (Control) | Cost basis; benefit classification; reconciliation acceptance |

### 7.2 Weekly capacity commitments (hours per role per phase)

Assumes ~18–38 week total project duration; spread across phases per Part 2.6.

| Role | Define | Measure | Analyze | Improve | Control | Sustain tail | Total |
|---|---|---|---|---|---|---|---|
| Sponsor | 3 | 2 | 2 | 3 | 3 | 1 | 14 |
| MBB | 2 | 4 | 6 | 3 | 4 | 0 | 19 |
| Black Belt | 18 | 54 | 54 | 64 | 36 | 6 | 232 |
| Analyst | 2 | 36 | 42 | 40 | 24 | 3 | 147 |
| Process Owner | 6 | 8 | 6 | 32 | 18 | 6 | 76 |
| Implementation Lead | 0 | 0 | 0 | 30 | 8 | 0 | 38 |
| SME ×3 (avg per SME) | 4 | 9 | 12 | 10 | 3 | 0 | 38 per SME → 114 across 3 |
| Finance Partner | 1 | 3 | 0 | 4 | 4 | 0 | 12 |

**Grand total person-hours: ~652** across the full team end-to-end (slightly higher than Part 2.6's 598 due to sustainment tail included here).

### 7.3 BAM scheduling — bucket routing

**Deep (PROJECT) blocks absorb:**

- All analytical work: baseline + pilot + post analysis (`dmaic_measure_07`–`10`, `dmaic_analyze_05`–`10`, `dmaic_improve_06`–`07`, `dmaic_control_01`–`02`).
- All authoring: Charter, SIPOC, CTQ, DCP, Process Maps, C&E, Input DCP, Regression Report, FMEA, Control Plan, Results Narrative.
- All pilot execution tasks.
- DMAIC payload from the composer's `selectDeepPayload()` (`ENGINE_DESIGN.md §1.6`).

**Communication blocks absorb:**

- Stakeholder interviews (VOC, VOB, VOA).
- Sponsor reviews and phase-gate meetings.
- Finance sign-off sessions (cost basis, pass 1, pass 2).
- PO transition + Sponsor close.
- Blocker escalations.
- Communication Plan touchpoints.

**CI blocks absorb:**

- Daily standups during active phases.
- Weekly Reflection (project-level friction scan).
- Sprint Retro Risk Register refresh (`dmaic_glue_05`).
- Sustainment check-ins at Day 30/60/90.
- Lessons-learned capture.

### 7.4 Four example weekly Cadence Week patterns

**7.4.1 Define-heavy week (Week 2 of project; SIPOC + Stakeholder + Comm Plan + Risk):**

| Time | Mon | Tue | Wed | Thu | Fri |
|---|---|---|---|---|---|
| 09:00 | Standup (COMM 15) | Standup | Standup | Standup | Standup |
| 09:15 | SIPOC workshop prep (COMM 45) | VOC interview 1 (COMM 60) | Stakeholder 2×2 session (COMM 60) | VOC interview 3 (COMM 60) | Charter consolidation (PROJECT 120) |
| 10:15 | SIPOC workshop (PROJECT 180) | VOC interview 2 (COMM 60) | Comm Plan matrix authoring (PROJECT 120) | Risk Register session (PROJECT 90) | — |
| 12:00 | Lunch | Lunch | Lunch | Lunch | Lunch |
| 13:00 | PM COMM (PO sync on SIPOC) | PM COMM (Analyst brief) | PM COMM (Sponsor monthly) | PM COMM (SME sync) | PM COMM (Sponsor charter review) |
| 13:30 | SIPOC consolidation (PROJECT 120) | CTQ Tree authoring (PROJECT 90) | Stakeholder 2×2 consolidation (PROJECT 90) | VOB interviews (COMM 90) | Charter signature session (COMM 60) |
| 15:30 | L&D / PDCA (CI) | 6S Email (CI) | Risk review (CI 30) | PDCA tick (CI 30) | Weekly Reflection (CI 20) |
| 16:30 | Reflection (CI 15) | Reflection | Reflection | Reflection | Reflection |
| 17:00 | End | End | End | End | End |

**Bucket totals (estimated):** PROJECT ≈ 11h, COMMUNICATION ≈ 12h, CI ≈ 6h. Within 4-2-2 tolerance.

**7.4.2 Measure-heavy week (Week 5; baseline collection + MSA + baseline stats):**

| Time | Mon | Tue | Wed | Thu | Fri |
|---|---|---|---|---|---|
| 09:00 | Standup | Standup | Standup | Standup | Standup |
| 09:15 | MSA execution session 1 (PROJECT 120) | Baseline data extraction (PROJECT 120) | Baseline data QA (PROJECT 120) | MSA analysis (PROJECT 120) | Baseline stats (PROJECT 120) |
| 11:15 | MSA randomization log (PROJECT 60) | Exclusion rule application (PROJECT 60) | Stratification analysis (PROJECT 60) | Capability computation (PROJECT 60) | Control Chart authoring (PROJECT 120) |
| 12:00 | Lunch | Lunch | Lunch | Lunch | Lunch |
| 13:00 | PM COMM (Appraiser brief) | PM COMM (Analyst sync) | PM COMM (Finance cost-basis) | PM COMM (MBB pre-review prep) | PM COMM (MBB gate review) |
| 13:30 | MSA execution session 2 (PROJECT 120) | Baseline cleaning (PROJECT 120) | Normality + outlier analysis (PROJECT 90) | Reporting dashboard build (PROJECT 120) | Baseline lock + close #28 (PROJECT 30) + Phase-gate (COMM 60) |
| 15:30 | Reflection + CI | Reflection + CI | Reflection + CI | Reflection + CI | Weekly Reflection (CI 20) |
| 16:30 | End | End | End | End | End |

**Bucket totals:** PROJECT ≈ 18h (near ceiling), COMMUNICATION ≈ 7h, CI ≈ 3h. Measure is PROJECT-heavy by nature.

**7.4.3 Analyze-heavy week (Week 9; hypothesis testing + regression + FMEA):**

| Time | Mon | Tue | Wed | Thu | Fri |
|---|---|---|---|---|---|
| 09:00 | Standup | Standup | Standup | Standup | Standup |
| 09:15 | Hypothesis pre-registration (PROJECT 60) | Run hypothesis tests (PROJECT 120) | Regression model fit (PROJECT 120) | FMEA session (PROJECT 180) | Confound-check authoring (PROJECT 120) |
| 10:15 | Correlation matrix (PROJECT 60) | Apply Bonferroni/FDR (PROJECT 30) | Residual diagnostics (PROJECT 90) | — | Root Cause Summary (PROJECT 120) |
| 11:15 | MBB pre-exec review of pre-reg (COMM 30) | Effect size computation (PROJECT 60) | VIF + multicollinearity (PROJECT 30) | FMEA consolidation (PROJECT 60) | MBB gate review prep (COMM 30) |
| 12:00 | Lunch | Lunch | Lunch | Lunch | Lunch |
| 13:00 | PM COMM (Analyst pair session) | PM COMM (Sponsor monthly) | PM COMM (SME mechanism check) | PM COMM (MBB mid-phase review) | PM COMM (MBB regression/causation gate) |
| 13:30 | Pairwise analysis (PROJECT 120) | Hypothesis results doc (PROJECT 90) | Multiple regression (PROJECT 120) | FMEA action owners (COMM 60) | Phase-gate ANALYZE (COMM 90) |
| 15:30 | Reflection + CI | Reflection + CI | Reflection + CI | Reflection + CI | Weekly Reflection (CI 20) |
| 16:30 | End | End | End | End | End |

**Bucket totals:** PROJECT ≈ 16h, COMMUNICATION ≈ 8h, CI ≈ 3h.

**7.4.4 Improve-heavy week (Week 13; pilot execution + analysis):**

| Time | Mon | Tue | Wed | Thu | Fri |
|---|---|---|---|---|---|
| 09:00 | Standup | Standup | Standup | Standup | Standup |
| 09:15 | Pilot kickoff (COMM 60) | Pilot execution observation (PROJECT 120) | Daily progress check (CI 15) + execution (PROJECT 90) | Pilot data extraction (PROJECT 120) | Pilot results statistical test (PROJECT 120) |
| 10:15 | Pilot implementation (PROJECT 120) | Pilot data collection (PROJECT 60) | Blocker triage (COMM 45) | Pilot data QA (PROJECT 60) | Effect size + CI (PROJECT 60) |
| 11:15 | SOP v2.0 draft (PROJECT 60) | Implemented Changes Log (PROJECT 60) | SOP delta (PROJECT 60) | Pilot assumption checks (PROJECT 30) | Go/No-Go prep (PROJECT 60) |
| 12:00 | Lunch | Lunch | Lunch | Lunch | Lunch |
| 13:00 | PM COMM (PO sync) | PM COMM (Implementation Lead sync) | PM COMM (Sponsor pre-brief) | PM COMM (Finance pass-1 prep) | PM COMM (Sponsor Go/No-Go) |
| 13:30 | Pilot execution (PROJECT 120) | Pilot execution (PROJECT 120) | Pilot execution (PROJECT 90) | Finance pass 1 authoring (PROJECT 120) | Control Plan draft (PROJECT 90) |
| 15:30 | Reflection + CI | Reflection + CI | Reflection + CI | Reflection + CI | Weekly Reflection (CI 20) |
| 16:30 | End | End | End | End | End |

**Bucket totals:** PROJECT ≈ 15h, COMMUNICATION ≈ 7h, CI ≈ 3h.

### 7.5 Kaizen-level Cadence Week overlay

On top of the above role-specific patterns, the Black Belt's own Cadence Week includes:

- **Monday:** Sprint Planning (if sprint boundary); backlog refresh.
- **Friday:** Sprint Review + Retrospective (if sprint boundary); Risk Register refresh via `dmaic_glue_05`.

The DMAIC work fills the Deep Block payload on non-ceremony days.

### 7.6 Escalation triggers

**To MBB (within 48h):**

- MSA returns %R&R > 30%; team wants to proceed anyway.
- More than 3 hypothesis tests planned without correction.
- Regression R² < 0.3 on what team is calling "vital X".
- Confound-check can't rule out an alternative.
- Pilot fails and team wants to scale anyway.

**To Sponsor (same day):**

- Scope-change signal (`dmaic_glue_04`).
- Finance pass 1 or pass 2 unsigned > 5 days.
- Process Owner rotation / departure.
- Key SME unavailable for > 1 sprint.

**To abandon:**

- Sponsor withdrawal without replacement.
- Data access blocked with no feasible alternative.
- Baseline cannot stabilize (chronic special cause from external source).
- Scope rotation confirmed.

### 7.7 Capacity risk thresholds

- **Yellow.** Any role's committed hours exceed 60% of weekly capacity; or Analyst full-time required during Measure + Analyze overlap.
- **Red.** Any role exceeds 80%; or any required role unassigned; or MBB unavailable for required gate within 5 business days.
- **Action on Yellow.** Black Belt warns Sponsor; considers sequencing (e.g., extend Measure by 1 sprint).
- **Action on Red.** Sponsor adds capacity OR project pauses.

---

## Part 8 — Validation and Control Model

### 8.1 Baseline vs post-improvement comparison rules

- **Rule C1 — Measurement-system parity.** The same measurement system (passing MSA) used for Baseline is used for post-improvement remeasurement. If system changed, run MSA on new system and require equivalent R&R before accepting.
- **Rule C2 — Operational-definition parity.** Same operational definition, sample frame, exclusion rule.
- **Rule C3 — Sample-size parity.** Post-improvement n ≥ baseline n × 0.9. Low-n remeasurement flagged in A28.
- **Rule C4 — Outlier handling parity.** If baseline kept outliers, post keeps them; if baseline winsorized, post winsorizes at same percentile.
- **Rule C5 — Time-window representativeness.** Post window chosen to avoid known anomalies (quarter-end, migration, regulatory change). If unavoidable, disclose.
- **Rule C6 — Concurrent-change disclosure.** Any non-DMAIC process change between Baseline and Post (system upgrade, org change, policy change) disclosed in A28; benefit claim reduced proportionally in pass 2.

### 8.2 Statistical validation thresholds

**For close as SUCCESS:**

- Primary Y delta meets target (from Charter).
- Hypothesis test: p < 0.05 after correction if multiple tests.
- Effect size: Cohen's d ≥ 0.5 OR domain-relevant %delta (whichever is the team's pre-registered criterion).
- Post-improvement Control Chart: stable (no new special cause; or special cause dispositioned).
- Post-improvement Capability: Cpk ≥ target or ≥ 1.33 minimum.
- Financial Benefit pass 2: Finance signed; Hard-category benefit covers implementation cost; ROI ≥ 0.

**For close as PARTIAL:**

- Delta 50–100% of target.
- p < 0.05 with smaller effect size.
- OR: p < 0.05 but method-parity concerns flagged.
- ROI signed; ROI may be < 0 if learning value substantive.

**For close as FAILED_HONEST:**

- Delta not significant (p ≥ 0.05).
- OR: delta opposite direction of target.
- Still closed; lessons learned authored; portfolio shows truth.

### 8.3 Financial benefit calculation

Per `#39` Financial Benefit Translator (Part 4 A27):

**Implementation cost inputs:**

- People time at fully-loaded rate (Black Belt 232h × rate; Analyst 147h × rate; PO 76h × rate; etc.)
- Statistical tooling licenses (Minitab, JMP, etc.)
- Infrastructure changes (dashboard platform, data pipeline)
- Training / coaching
- External consulting / MBB time (if billed)

**Annualized benefit inputs:**

- **Hard dollars:** direct P&L reduction (reduced vendor spend, recovered revenue, reduced external failure cost). Require P&L line reference or FTE-release memo.
- **Soft dollars:** time/capacity freed without FTE release. Noted but not claimed as Hard.
- **Cost Avoidance:** prevented future cost (penalties not incurred, risks not materialized). Require basis calculation (volume × unit × likelihood).

**Annualization:** 12 × monthly delta, normalized to stable-volume month. If seasonal, annualize across full cycle.

**Formula:** `ROI = (annualBenefitsDollars − implementationCostDollars) / implementationCostDollars`

### 8.4 Confidence scoring (Hard / Soft / Cost Avoidance)

| Category | Evidence required | Confidence |
|---|---|---|
| **Hard** | P&L line reference OR FTE-release memo signed by org leader | 0.9 |
| **Soft** | Time-saved × rate with named beneficiary but no redeployment plan | 0.5 |
| **Cost Avoidance** | Basis calc (volume × unit penalty × likelihood) with historical data | 0.6 |

**Rule.** Every benefit line is classified. Aggregate confidence is the minimum category claimed (a $1M project is "Hard" only if every line is Hard).

### 8.5 Audit requirements

For every CLOSED DMAIC:

- **Finance co-signs** Financial Benefit pass 1 (at Improve) and pass 2 (at Control).
- **MBB peer-reviews:** Charter, MSA + Baseline, Regression + causation, Control Plan + Results Narrative.
- **Sponsor sign-off** on Charter (Define), Pilot Plan (Improve), Results Narrative (Control close).
- **Process Owner sign-off** on Baseline Validation (Measure), Control Plan (Control), Transition Memo (Control close).
- **Documentation quality checks:** every artifact from Part 4 present and complete; evidence attached; version tagged; stored in Kaizen workspace.
- **Portfolio audit:** benefit registered in portfolio ledger; 90-day post-close sustainment status attested.

### 8.6 Phase-gate reviews — 5 gates

For each phase, the reviewer (MBB + Sponsor) asks these questions. If any "no", REWORK before advance.

**Gate 1 — DEFINE close:**

1. Is the problem statement passing Part 5.6 lint (no solution-prescribing; measurable Y; scope explicit)?
2. Does the CTQ Tree trace Voice → Driver → CTQ?
3. Is the primary Y's data type declared?
4. Is Sponsor signature on Charter?
5. Does SIPOC have 3–7 steps with all 5 elements?
6. Is the Stakeholder Analysis populated with engagement owner per quadrant?
7. Does the Communication Plan have recurring calendar holds booked?
8. Is the Risk Register populated with ≥ 3 high risks owned?
9. Are VOC/VOB/VOA interviews executed (3+/2+/3+)?
10. Finance cost-basis acknowledged?

**Gate 2 — MEASURE close:**

1. Is the Output DCP complete with operational definition per Y?
2. Did MSA pass (Gage R&R < 30% or Kappa ≥ 0.7)?
3. Is baseline n ≥ 30 (continuous) or ≥ 100 (proportions)?
4. Was normality tested; was transform applied if non-normal?
5. Is Baseline Control Chart showing stable process (or special-cause dispositioned)?
6. Is Capability computed (Cp/Cpk/Pp/Ppk/DPMO/σ-level)?
7. Is Continuous Reporting dashboard live?
8. Is baseline stakeholder walk-through signed?
9. Is the data dictionary documented?

**Gate 3 — ANALYZE close:**

1. Is the Detailed Process Map authored with ≥15 activities and VA/NVA tags?
2. Is the C&E Matrix scored with vital few X's identified?
3. Is the Input DCP executed with ≥ 30 paired X-Y observations?
4. Were hypothesis tests pre-registered before data tested?
5. Was multiple-comparisons correction applied if k > 3?
6. Is effect size reported alongside p-value for every test?
7. Do regression diagnostics pass (residuals, VIF, R²)?
8. Is the confound-check table complete for every vital X?
9. Is the Root Cause Summary signed by MBB?
10. Is the FMEA authored with ≥15 modes and action owners?
11. Does FMEA cross-reference to vital X's and validated causes?

**Gate 4 — IMPROVE close:**

1. Is the Pilot Plan authored with n from power analysis?
2. Did pilot execute per plan?
3. Is the pre/post statistical test significant (p < α after correction) AND meaningful (effect size)?
4. Are implemented improvements logged with before/after per change?
5. Is SOP v2.0 final published?
6. Is the Control Plan draft authored per §1.5 #3 refinement?
7. Did Finance sign Pass 1 Financial Benefit?
8. MBB pre-review of Control Plan complete?

**Gate 5 — CONTROL close:**

1. Is remeasurement collected with method parity to Baseline?
2. Is post Control Chart stable and showing shift?
3. Is post Capability ≥ target Cpk?
4. Did Finance sign Pass 2 with reconciliation delta vs Pass 1?
5. Is Control Plan signed by PO and Sponsor?
6. Is Monitoring Dashboard live with alerts tested?
7. Is Process Owner Transition Memo signed?
8. Are 30/60/90 sustainment holds created?
9. Is Results Narrative complete?
10. MBB final review signed?

### 8.7 Closure requirements

For `Kaizen.state = CLOSED` with `closeKind = SUCCESS`:

- All Part 4 artifacts present and complete.
- All 5 Gate reviews signed.
- Primary Y delta ≥ target AND p < 0.05 AND effect size meaningful.
- Post Cpk ≥ target or ≥ 1.33.
- Financial Benefit pass 2 signed with reconciliation.
- Control Plan + Monitoring Dashboard live.
- Process Owner Transition Memo signed.
- MBB final review.
- Sponsor close sign-off.

For `closeKind = PARTIAL`: most of SUCCESS bar met with explicit exceptions logged.

For `closeKind = FAILED_HONEST`: analysis complete; Finance signed pass 2 showing no benefit; lessons learned authored; Control Plan still authored (negative findings inform process protection); Sponsor signs FAILED close with explicit "honest failure" attestation.

---

## Part 9 — Risks and Anti-Patterns

Eighteen named risks. Each: Description | Cause | Impact | Early warning | Mitigation | Owner.

| # | Risk | Description | Cause | Impact | Early warning | Mitigation | Owner |
|---|---|---|---|---|---|---|---|
| R1 | **Solution-jumping (skipping Analyze)** | Team has "obvious" fix and wants to Implement without Analyze validation. | Pressure to show action; Black Belt inexperience; Sponsor impatience. | Implement fix on wrong X; no improvement; project fails. | Quick Wins fired against X's not validated; Improve backlog authored before `#36` closes. | DAG enforcement: Improve entries `dependsOn [#36, #37]`; composer refuses early Improve payload. MBB blocks gate 3 review if pre-reg absent. | Black Belt + MBB |
| R2 | **Weak or missing MSA** | MSA run on 3 samples; R&R "passes" at 40%; team proceeds. | Appraiser time scarce; Black Belt compresses to meet Measure deadline. | All downstream stats poisoned; baseline meaningless. | MSA R&R > 30% reported; NDC < 4. | `#28 dependsOn #31`; composer blocks Baseline until MSA passes. MBB gate-2 audit question on sample span and randomization. | Black Belt |
| R3 | **Small n with big conclusion** | Baseline n = 18; team claims Capability = 1.8. | Data access limited; Black Belt wants to move on. | CI on Cpk is ±1.0; number is noise. | Part 6.3 n-rule violated; MBB flags. | Gate-2 requires n ≥ 30 continuous / 100 proportions; waiver requires MBB + Sponsor signature with explicit wide-CI attestation. | MBB |
| R4 | **P-hacking / undeclared multiple testing** | Team runs 15 tests, reports 1 significant. | Correlation matrices explored without pre-reg. | False-positive "root cause"; Improve pilot on noise. | Hypothesis Test Results Log (A20) shows tests without pre-reg timestamp. | `dmaic_analyze_07` pre-registration mandatory; A20 timestamps; MBB audits. Correction (Bonferroni/FDR) declared if k > 3. | Analyst + MBB |
| R5 | **Overfitting regression** | 15-variable regression on n=40; R² = 0.95. | Analyst includes every X without feature selection. | Model doesn't replicate on pilot; Improve fails. | Adjusted R² << R²; residuals fine but out-of-sample prediction poor. | Adj-R², VIF, Cook's distance mandatory in A17; MBB checks. Hold-out validation or cross-validation recommended for > 5 predictors. | Analyst + MBB |
| R6 | **Correlation misread as causation** | r = 0.6 → "X is the root cause"; implement; no change. | Black Belt skips confound-check. | Improve pilot fails; project stalls. | A18 Root Cause Summary lacks confound-check table. | `dmaic_analyze_10` mandatory; MBB signs before Improve. Require 3 of 4 causation criteria (precedence, mechanism, no-confound, replication). | Black Belt + MBB |
| R7 | **Scope creep during Measure** | Team discovers upstream process is "the real problem"; expands. | Root cause revealed in Measure; team wants to absorb. | Baseline becomes stale; DCP re-done; timeline slips. | Upstream X's appearing in C&E that weren't in SIPOC. | `dmaic_glue_04` scope-change event: Sponsor decides CONTINUE or ABANDON + new Kaizen. Silent rotation prohibited. | Sponsor |
| R8 | **Stakeholder fatigue (DMAIC is long)** | By Sprint 10, Sponsor stops attending; SMEs deprioritize. | Long duration; interim artifacts feel abstract. | Quality of SME inputs declines; Sponsor absent at ROI. | Attendance in Sprint Reviews drops below 70%; Sponsor skips 2 consecutive monthly updates. | Communication Plan cadence enforced; Sponsor monthly touchpoints non-negotiable; Black Belt escalates to PMO at 2-skip threshold. | Black Belt |
| R9 | **Weak Control plan (theatrical monitoring)** | Plan = PDF; Dashboard never built; no alerts. | Control plan authored at Day 29 of Control with no sustainment test time. | Regression at Day 60; no one notices. | Control Plan references "to be built" dashboard; alerts not tested. | Refinement §1.5 #3: Control Plan draft at Improve; live Dashboard required at Control close; alerts tested before close. | Black Belt + PO |
| R10 | **SOP drift post-Control** | Real behavior diverges from SOP v2.0; audit finds non-compliance. | SOPs updated under deadline pressure; no real-time maintenance. | Sustainment regression; audit findings. | Day-60 check-in shows Dashboard drift; PO cannot point to SOP delta. | `dmaic_control_11`/12/13 sustainment checks; SOP ownership signed transition; PO commits to quarterly SOP refresh. | Process Owner |
| R11 | **Fake ROI / benefit inflation** | "$2M annualized" claimed; no P&L line; time-savings × rate without FTE release. | Political pressure to show big number. | Finance eventually discovers; program credibility collapses. | Pass 1 reconciliation delta > 30% vs pass 2. | Part 8.4 classification mandatory; Finance signs both passes; MBB review if reconciliation > 30%; FAILED_HONEST acceptable. | Finance + MBB |
| R12 | **Pilot-to-scale failure** | Pilot works in 1 unit; scales to 10 units; fails. | Pilot unit was unrepresentative; Hawthorne effect in pilot; unit-specific confounds. | Scale rollback; project closes PARTIAL. | Pilot effect size outside CI of Analyze-phase expectation; significant stratum effects not reconciled in pilot. | Pilot design includes multi-stratum scope where feasible; Hawthorne-effect check via double-blind or time-lag; post-improvement remeasurement includes all strata. | Black Belt |
| R13 | **Data access blockers** | IT ticket for query access takes 6 weeks; Measure stalls. | No named IT partner; bureaucratic approvals. | Project dies in Measure. | Access ticket open > 5 business days without movement. | Define phase names IT partner; access tickets opened in Define, not Measure; escalation to Sponsor at 5-day threshold. | Black Belt |
| R14 | **Process variation source changes mid-project** | Baseline collected pre-migration; Measure ran during migration; variance exploded; causes unclear. | Concurrent transformation in same system. | Baseline invalidated; re-baseline required; 4+ weeks lost. | Concurrent-change disclosure during Define missed. | Define Charter requires attestation of no concurrent major change; Risk Register R3 entry; abandon / re-scope if concurrent emerges. | Sponsor |
| R15 | **Black Belt rotation** | Lead BB leaves between Analyze and Improve; new BB inherits; continuity broken. | Personnel turnover; 6+ month project exceeds employment stability. | Handoff delay; knowledge loss; rework. | BB announces departure; no successor named. | Charter names backup BB; MBB mandatory continuity role (constant across handoffs); all artifacts current per sprint. | PMO + MBB |
| R16 | **Tool inadequacy (Excel when you need Minitab / R / Python)** | Analyst runs Gage R&R in Excel without ANOVA method; capability indices wrong. | Tool policy outdated; license budget. | Statistical errors throughout project. | Computed values don't reconcile with MBB's recalc. | Part 1.6 CSF 7: tool picked at kickoff; license provisioned during Define. | PMO |
| R17 | **Measurement system drift during project** | MSA passed at Baseline; instrument drifts; post measurements inflated. | Long project; instrument not recalibrated; appraiser turnover. | Post-improvement delta artifact of drift, not improvement. | Day-60 sustainment check shows drift; post MSA repeat fails. | MSA repeat mandatory at Control-remeasurement if > 90 days since Baseline MSA; PO tracks instrument calibration schedule. | Analyst + PO |
| R18 | **Political inversion** | Analyze finding implicates a specific leader's area; Sponsor pressures Black Belt to redirect. | Root cause has political cost. | Finding buried; ROI inflated on other finding; sustainment fails. | Sponsor requests "reframing" of Analyze report; MBB sees pressure. | MBB has authority to escalate to PMO; FAILED_HONEST close acceptable; portfolio transparency policy. | MBB + PMO |

---

## Part 10 — AI-Native DMAIC Opportunities

Binding to the five agents in `AI_AGENTS.md` (Planning, Momentum, Context, Reflection, Composer Explainer). No new agents introduced.

### 10.1 DEFINE phase

**Human-required:**
- Sponsor VOL interview interpretation (`dmaic_define_02`).
- Primary Y selection judgment (`dmaic_define_11`): which CTQ is the Y requires customer-value and business-strategy tradeoffs AI cannot resolve.
- Charter signature and commitment.
- Stakeholder-map influence/interest ratings (political judgment).

**AI-assisted:**
- **Context Agent** surfaces prior DMAIC Charters on similar processes for Black Belt to consult.
- **Context Agent** pre-populates roster candidates from org chart / prior rosters.
- **Composer Explainer** drafts SIPOC first-pass from prior-process library; team refines.
- **Composer Explainer** drafts CTQ candidate tree from VOC/VOB/VOA transcripts using theme extraction.
- **Planning Agent** lints Problem Statement against Part 5.6 checklist (flags solution-prescribing language, missing units, vague CTQ).
- **Reflection Agent** clusters VOC/VOB/VOA theme tags from interview transcripts.

**AI-automatable:**
- Template population for Charter, SIPOC, Stakeholder, Comm Plan, Risk Register.
- Calendar-hold creation from Communication Plan matrix.
- Interview transcription (speech-to-text) + theme tagging scaffolding.
- VOC quote extraction from ticket/CSAT databases where available.

### 10.2 MEASURE phase

**Human-required:**
- Measurement system choice (instrument vs observation) judgment.
- MSA disposition (accept / marginal / reject) — ambiguous cases require judgment.
- Baseline representativeness attestation.
- Cost-basis decision (Finance partner judgment).

**AI-assisted:**
- **Planning Agent** lints Data Collection Plan operational definitions for ambiguity.
- **Planning Agent** flags missing data in collection window (n trailing target).
- **Context Agent** suggests measurement methods from prior similar CTQs.
- **Planning Agent** flags method-drift risks when DCP references subjective attributes without MSA.

**AI-automatable:**
- Gage R&R computation from raw data (ANOVA method); Kappa computation from categorical data.
- Summary statistics; normality tests (Anderson-Darling, Shapiro-Wilk); outlier detection.
- Control Chart authoring (chart-type selection by data class; CL/UCL/LCL; Western Electric rule application).
- Capability computation (Cp/Cpk/Pp/Ppk/DPMO/σ-level).
- Continuous Reporting Dashboard scaffolding from DCP schema.

### 10.3 ANALYZE phase

**Human-required:**
- C&E Matrix impact ratings (cross-functional judgment).
- FMEA Severity / Occurrence / Detection ratings (multi-SME consensus).
- Causation interpretation ("is this the cause or a correlate?").
- Confound-check alternative-explanation authoring (requires domain depth).
- DOE factor selection.
- Root Cause Summary prioritization (business-tradeoff call).

**AI-assisted:**
- **Composer Explainer** drafts Detailed Process Map swimlane from event-log process mining.
- **Composer Explainer** generates 6M candidate X list from prior-process fishbone library.
- **Planning Agent** flags C&E ratings where all participants rated 9 (anchoring bias signal).
- **Planning Agent** flags when hypothesis-test count grows during Analyze (p-hacking warning).
- **Planning Agent** suggests multiple-comparisons correction at k = 4.
- **Planning Agent** lints regression for VIF > 10, R² < 0.3 inconsistencies.
- **Planning Agent** suggests confound candidates from prior-domain library.
- **Composer Explainer** drafts FMEA rows from Process Map + root cause list.
- **Reflection Agent** clusters recurring failure patterns across prior DMAIC projects.

**AI-automatable:**
- Pairwise correlation matrix (Pearson / Spearman selection by distribution check).
- Hypothesis test execution after pre-registration (Bonferroni / FDR application).
- Regression model fitting with diagnostic plots (residual, Q-Q, scale-location, Cook's).
- VIF computation and multicollinearity reporting.
- Stratification analysis (ANOVA / chi-square by stratum).
- DOE run-sheet generation (randomization, replicate counting).
- DOE ANOVA execution post-runs.

### 10.4 IMPROVE phase

**Human-required:**
- Countermeasure ideation (creative; per vital X).
- Pilot scope decision.
- Go / No-Go on pilot results.
- Scale-rollout sequencing decisions.
- Benefit classification judgment (Hard vs Soft vs Cost Avoidance).
- Finance pass 1 negotiation.

**AI-assisted:**
- **Composer Explainer** suggests countermeasure patterns from prior-process library (error-proofing / standardization / automation / training / redesign patterns).
- **Planning Agent** flags under-powered pilot designs (effect size / n mismatch).
- **Planning Agent** flags missing evidence on Hard-benefit claims in pass 1.
- **Momentum Agent** coaches each action owner through their Deep Block work.
- **Composer Explainer** generates SOP v2.0 delta from Implemented Changes Log.

**AI-automatable:**
- Power analysis for pilot n (given effect size, α, power).
- Pilot pre/post statistical test (appropriate by data type).
- Effect size computation (Cohen's d, φ, odds ratio).
- Financial Benefit annualization math (12 × monthly delta; ROI).
- Dashboard scaffolding for monitoring.

### 10.5 CONTROL phase

**Human-required:**
- Reconciliation explanation (pass 1 vs pass 2 delta).
- Close-kind decision (SUCCESS / PARTIAL / FAILED_HONEST).
- Process Owner transition commitment.
- Sponsor close sign-off.
- Sustainment-regression remediation decisions.

**AI-assisted:**
- **Composer Explainer** generates Results Narrative first-draft by consolidating all project artifacts.
- **Composer Explainer** generates Lessons Learned first-pass from retro transcript.
- **Reflection Agent** synthesizes lessons across the 5-phase arc.
- **Planning Agent** flags method-parity drift between Baseline and remeasurement.
- **Planning Agent** monitors live Control Chart and fires alerts on Western Electric signals.

**AI-automatable:**
- Post-improvement Control Chart + Capability computation (same as Measure, reused).
- Pass 2 Financial Benefit annualization.
- Reconciliation delta computation.
- 30/60/90 sustainment check-in reminder scheduling.
- Portfolio-rollup metric update.
- Executive summary first-draft (bound to narrative template).

### 10.6 Agent-to-task binding (telemetry target)

| Agent | DMAIC binding | Telemetry |
|---|---|---|
| **Planning Agent** | Part 5 problem lint; MSA %R&R flag; multiple-comparisons flag; regression diagnostics lint; Hard-claim evidence flag; method-parity lint | Flag hit-rate; user accept/dismiss; time-to-fix after flag |
| **Momentum Agent** | Improve phase Deep Block coaching; action-owner next-step; pilot execution pacing | Coaching impression → action conversion rate |
| **Context Agent** | Prior-Charter library surface; prior-roster surface; measurement-method lookup; confound-candidate lookup | Suggestion acceptance rate |
| **Reflection Agent** | VOC/VOB/VOA theme clustering; failure-pattern clustering across projects; Lessons Learned synthesis | Cluster-acceptance rate; lesson quality score |
| **Composer Explainer** | SIPOC first-draft; Process Map first-draft; SOP delta generation; Results Narrative consolidation; Executive summary first-draft | First-draft acceptance rate (% edits retained); time-saved vs hand-authoring |

### 10.7 Human-AI decision ladder

For every Part 3 task with named AI-support, the operational principle is:

1. **Human declares intent** — what the task should produce.
2. **AI generates first-pass** — using prior library + current inputs.
3. **Human edits / approves / rejects** — AI does not close the task.
4. **Closure captures edit rate** — telemetry for agent learning.

This matches `AI_AGENTS.md` agent philosophy: AI augments the Black Belt; never replaces judgment at acceptance gates (MSA disposition, causation claim, pilot go/no-go, ROI classification, close-kind assignment).

---

## Part 11 — Final Deliverables and Operationalization

### 11.1 Deliverable index

| Deliverable | Location in this standard |
|---|---|
| Executive validation + decision tree | Part 1 |
| Five-phase lifecycle | Part 2 |
| Complete task inventory (88 tasks + 6 glue) | Part 3 |
| Artifact specification library (32 artifacts) | Part 4 |
| Problem definition framework + template | Part 5 |
| Statistical rigor model (39 methods) | Part 6 |
| Capacity and BAM scheduling | Part 7 |
| Validation, phase gates, closure criteria | Part 8 |
| Risk register (18 risks) | Part 9 |
| AI-native opportunity map | Part 10 |
| Operationalization next-steps | Part 11 |

### 11.2 Next steps — as a BAM project type (architecture/engine)

1. **`ARCHITECTURE.md §2.9` — Kaizen entity.** Does DMAIC need a stored `phase` field like the Accelerator? **Recommendation:** NO — keep `phaseFor()` derived (per `ENGINE_DESIGN.md §4.2`). Rationale: DMAIC's DAG is the real source of truth; stored phase adds duplication. However, `phaseFor()` performance should be cached per-composition to avoid O(n_activities) recomputation.
2. **`controlPlanArtifactRef` field.** Currently exists on Kaizen only for `KAIZEN_ACCELERATOR_30D`. **Recommendation:** add `controlPlanArtifactRef` for `projectType='DMAIC'` too, populated when `dmaic_control_04` closes. Required for close-gate.
3. **`sustainmentCheckIns[]` field.** Currently not on Kaizen. **Recommendation:** add as a new optional field `sustainmentCheckIns: [{date, outcome, note, actorRef}]` populated by Day 30/60/90 tasks. Enables Part 8 audit view without new entity.
4. **`ARCHITECTURE.md §6.1` events.** Add `DmaicPhaseDerived` event emitted when `phaseFor()` returns a different value than cached; semantically equivalent to `ProjectPhaseAdvanced` for Accelerator but labeled differently so UI can render distinct microcopy.
5. **`ARCHITECTURE.md §3.3` Kaizen FSM.** Current `DRAFT → ACTIVE → IN_REMEASUREMENT → CLOSED` works for DMAIC but add specific guards: `ACTIVE → IN_REMEASUREMENT` requires `dmaic_improve_11` CLOSED; `IN_REMEASUREMENT → CLOSED` requires all Part 8.7 closure conditions.
6. **`CATALOG_GAPS.md §B/C/D`.** All 22 DMAIC catalog entries (#20–#41) now have approved procedures. Confirm this standard's task breakdowns are consistent with those procedures (spot-check recommended on #36 Regression, #31 MSA, #39 Financial Benefit where the standard adds specificity).
7. **DAG edges on catalog entries.** Add / confirm:
   - `#28 dependsOn [#22, #31]` — Baseline needs DCP + MSA.
   - `#30 dependsOn [#28, #29]` — Capability needs Baseline + Control Chart.
   - `#34 dependsOn [#21]` — C&E needs SIPOC.
   - `#35 dependsOn [#34]` — Input DCP needs C&E.
   - `#36 dependsOn [#35]` — Regression needs Input DCP data.
   - `#37 dependsOn [#32, #36]` — FMEA needs Process Maps + validated causes.
   - `#38 dependsOn [#37]` — Backlog needs FMEA.
   - `#33 dependsOn [#22, #36]` — Quick Wins need DCP + validated causes (stricter than current which allows earlier).
   - `#40 dependsOn [#38]` — Implementation needs Backlog.
   - `#39 dependsOn [#28]` for pass 1 and `#39 dependsOn [#40]` for pass 2 (two passes implies either two catalog entries or a pass-counter on the same entry).
   - `#41 dependsOn [#39, #40]` — Narrative needs ROI + Implementation.

### 11.3 Next steps — as a software product workflow

1. **`DELIVERY_PLAN.md` E7 (Kaizen Lifecycle)** — extend to support the DMAIC phase-derivation UI. Today E7 primarily handles Accelerator's stored-phase FSM; DMAIC needs a PhaseStepper rendered from `phaseFor()` output with a "next eligible step" affordance.
2. **`DELIVERY_PLAN.md` E8 (PDCA + DMAIC DAG)** — already includes DMAIC DAG payload eligibility. Extend E8 to add the Pilot-design Deep Block surface (`dmaic_improve_04`) and the pilot results statistical viewer.
3. **NEW E15 — Statistical Analysis Surfaces.** First-class UI for: MSA dashboard, Capability report viewer, Regression diagnostics viewer, Hypothesis Test Results Log. Until E15 ships, Black Belt exports data to Minitab/JMP/R/Python and attaches outputs as artifacts; E15 brings first-draft analysis in-product.
4. **NEW E16 — MSA Workflow.** Dedicated workflow for MSA design → execution → dispositions, with ANOVA-method Gage R&R and Kappa computation built in. High leverage because every DMAIC project runs MSA; today's workflow is "export to Minitab".
5. **NEW E17 — Financial Benefit Translator pass 1/pass 2 workflow.** Two-pass Finance sign-off UI with reconciliation delta computed and flagged on > 30% gap.
6. **NEW E18 — Monitoring Dashboard live view + alerts.** Part 4 A29; critical for Control Plan non-theater.
7. **Extension E7-T-DMAIC — DMAIC-specific KaizenCard.** PhaseStepper; vital-X list; hypothesis test results at a glance; MBB review status badges.
8. **Extension E8-T-CAUSATION — Confound-check artifact editor** for `dmaic_analyze_10`.
9. **Artifact template library** — add ~17 DMAIC-specific templates to `CATALOG_GAPS.md §J` seed (extending the existing ~21-item Accelerator library): Charter DMAIC, SIPOC, Stakeholder 2×2, Comm Plan matrix, Risk Register, VOC/VOB/VOA + CTQ Tree, Output DCP, Data Dictionary, Input DCP, C&E Matrix, Fishbone, Regression Report, Confound-Check Table, Root Cause Summary, FMEA, Pilot Plan, Financial Benefit Translator.
10. **Intake workflow for DMAIC promotion** — from Weekly Reflection (Friction Signal) → "promote to DMAIC" UI that instantiates Charter draft with pre-populated problem statement.

### 11.4 Next steps — as an AI-agent-compatible operating model

1. **Agent binding table** — add to `AI_AGENTS.md §2.7 "DMAIC bindings"` using Part 10's phase-by-phase matrix.
2. **Per-task AI lift telemetry** — capture per Part 10.6 schema; MBB dashboard shows where AI saved / where it introduced errors.
3. **Planning Agent rulepack — DMAIC statistics lints.** Codify Part 6 as machine-checkable rules:
   - "Hypothesis test run without pre-registration timestamp" — error.
   - "k > 3 tests without correction declared" — error.
   - "Regression reported with VIF > 10" — warning.
   - "Cp/Cpk on non-normal without transform" — warning.
   - "MSA R&R > 30% with baseline close proposed" — error.
4. **Composer Explainer prompts** — extend to DMAIC-specific templates (Charter, SIPOC, SOP delta, Results Narrative).
5. **Reflection Agent cross-project learning** — cluster confound candidates, failure patterns, and lessons across closed DMAICs for Context Agent surfacing on new projects.
6. **Momentum Agent Improve-phase coaching** — per action owner, Deep Block "next step" nudges.

### 11.5 Doc inconsistencies flagged for coordinator

1. **`#33 Quick Wins` dependency timing.** `CATALOG_GAPS.md §D.3` allows Quick Wins from "DMAIC Analyze → Improve; can fire any time during project". This standard recommends stricter: `#33 dependsOn [#22, #36]` so Quick Wins require DCP + validated causes, preventing solution-leakage during Measure. Coordinator decision needed.
2. **`#39 Financial Benefit Translator` two-pass model.** `CATALOG_GAPS.md §C.4` describes a single-pass benefit; this standard's §1.5 refinement #4 requires two passes (projected at Improve + actual at Control with reconciliation). Either extend `#39` with a `pass` field or seed two catalog entries (`#39a`, `#39b`). Coordinator decision needed.
3. **MSA mandatory before Baseline.** `CATALOG_GAPS.md §D.2` `#31 MSA` cadence is "before Baseline (`#28`)"; this is already correct, but the DAG edge `#28 dependsOn [#31]` needs confirmation in `CatalogEntry.dependsOn` seed data.
4. **Confound-check artifact.** Not currently named as a catalog artifact; lives within `#36 Correlation and Regression` procedure per `CATALOG_GAPS.md §D.5`. This standard makes it a first-class artifact (A18 fragment) and mandatory peer-reviewed. Either extend `#36`'s output artifact to include the confound-check table, or create `#36a` for confound-check.
5. **Hypothesis Test Results Log.** Not currently in catalog; this standard calls it A20 `[Added during validation]`. Coordinator decision on whether to add to `CATALOG_GAPS.md` as a named artifact.
6. **Monitoring Dashboard as distinct artifact.** Part 4 A29. `CATALOG_GAPS.md §C.2 #27` covers Continuous Reporting; the Monitoring Dashboard is operationally distinct (enforces Control Plan thresholds vs. reports progress). Coordinator decides whether A29 is a separate artifact or a spec within `#41`.
7. **Process Owner Transition Memo.** Part 4 A32 `[Added during validation]`. Kaizen has `#50 Kaizen Process Owner Transition` as a dedicated catalog entry; DMAIC does not. Coordinator decision: add DMAIC-equivalent to `CATALOG_GAPS.md` (e.g., `#41b`) or keep as artifact spec inside `#41`.
8. **Pre-registration of hypotheses.** Not in `CATALOG_GAPS.md §D.5` procedure. This standard requires it (`dmaic_analyze_07`). Coordinator should extend `#36` procedure to include pre-registration step.
9. **Kaizen sustainment check-ins.** `sustainmentCheckIns[]` field not in `ARCHITECTURE.md §2.9`. See §11.2 #3.
10. **Causation confirmatory evidence options.** DOE (`dmaic_analyze_15`/`16`) is optional in this standard; MBB waiver requires 3 of 4 causation criteria. This is stricter than `CATALOG_GAPS.md §D.5` which only requires regression significance. Coordinator should confirm whether to enforce in catalog procedure.

### 11.6 Estimated effort to run one full DMAIC project

Using Part 7.2 role totals:

| Role | Total hours |
|---|---|
| Sponsor | 14 |
| MBB | 19 |
| Black Belt | 232 |
| Analyst | 147 |
| Process Owner | 76 |
| Implementation Lead | 38 |
| SMEs (3 × 38) | 114 |
| Finance Partner | 12 |

**Total person-hours across all roles: ~652 hours per DMAIC project (single run, one process, full Define → Sustainment tail).**

At a fully-loaded $95/hr average, that is **~$61,940 in people cost** — the implementation-cost floor that Financial Benefit pass 2 Hard inputs must clear for any ROI > 0.

**Project duration:**
- Define: 1–2 sprints (2–4 weeks)
- Measure: 2–3 sprints (4–6 weeks)
- Analyze: 2–4 sprints (4–8 weeks)
- Improve: 2–6 sprints (4–12 weeks)
- Control: 2–4 sprints (4–8 weeks) + 90-day sustainment tail

**Total: 9–19 sprints (18–38 weeks) + 90-day post-close sustainment = ~4.5 to 9.5 months elapsed, with a typical median of 6 months.**

A PMO running DMAICs in parallel amortizes MBB and Analyst time across projects (not 1:1 scaling). Black Belt is typically dedicated 50–100% to one DMAIC at a time. Sponsor, PO, and Finance time do not amortize and must be planned across the portfolio.

### 11.7 How to use this standard

**Black Belts.** Read Parts 1, 2, 5, 6 before kickoff. During execution, use Part 3 as the task checklist, Part 4 as the artifact template reference, Part 6 as the statistical guide, Part 8 as the close-gate checklist.

**Master Black Belts.** Read Parts 6, 8, 9 in depth. Use Part 8.6 gate review questions verbatim at each phase boundary. Use Part 9 risk list as leading-indicator watchlist.

**PMOs.** Read Parts 2, 7, 11. Use Part 2.6 for sprint planning of DMAIC portfolio; Part 7.2 for capacity modeling; Part 11.6 for benefit-cost threshold on intake decisions.

**AI agents.** Bindings in Part 10.6 drive per-task behavior. Planning Agent rulepack from §11.4 #3 codifies the machine-checkable lints. Every task in Part 3 with named AI-support declares the agent and acceptance model.

**Process Owners.** Read Part 2's phase Business Outcomes to know what you're being asked to accept at each phase. Read Part 8.7 for close criteria. Read Part 4 A26 (Control Plan) and A32 (Transition Memo) for sustainment ownership scope.

**Sponsors.** Read Part 1 (executive validation + when-not-to-use), Part 2 Business Outcomes, Part 8.4 (benefit classification), Part 11.6 (effort). Expect to sign at Gate 1 (Charter), Gate 4 (Pilot Plan), Gate 5 (Close + Results Narrative).

---

## Glossary

| Term | Definition |
|---|---|
| **CadencePlan DMAIC** | The offering tier; DMAIC project type inside CadencePlan. |
| **DMAIC project** | `Kaizen` with `projectType='DMAIC'`; five-phase Define → Measure → Analyze → Improve → Control. |
| **Validated Kaizen** | A CLOSED DMAIC with statistically-validated post-improvement delta and Finance-signed Financial Benefit Translator pass 2. |
| **Phase derivation** | Computing current phase from closed catalog steps via `phaseFor()` (no stored phase field). |
| **CTQ (Critical-to-Quality)** | Measurable attribute of the process that maps to customer value; translated from VOC/VOB/VOA. |
| **Primary Y** | The single metric the DMAIC project is designed to move. |
| **Vital few X** | Top 3–6 inputs driving Y variation, identified by C&E Matrix and validated by regression + confound-check. |
| **MSA (Measurement System Analysis)** | Study of measurement-system variance components; mandatory before Baseline. |
| **Gage R&R** | Gage Repeatability & Reproducibility; continuous-measurement MSA. |
| **Kappa** | Cohen's or Fleiss' agreement statistic; attribute MSA. |
| **Cpk / Ppk** | Short-term / long-term process capability indices. |
| **DPMO** | Defects Per Million Opportunities. |
| **Control Chart** | Time-ordered plot with control limits; Western Electric rules for signal detection. |
| **FMEA** | Failure Modes and Effects Analysis; risk-ranks failure modes by RPN = S×O×D. |
| **DOE** | Design of Experiments; controlled factor-level experiment for causation confirmation. |
| **Pilot** | Bounded first-test of countermeasures; powered for statistical inference. |
| **Financial Benefit Translator** | Two-pass quantification of annualized benefit with Finance sign-off; pass 1 projected (Improve), pass 2 actual (Control). |
| **Control Plan** | Ongoing monitoring system with thresholds, response playbooks, ownership. |
| **Project Results Narrative** | The 6-page canonical project summary (`#41`). |
| **The Accelerator** | 30-Day Kaizen Accelerator project type; analog for bounded single-process improvement. |
| **Kaizen Event** | 3–5-day event project type; analog for short-burst focused improvement. |
| **PDCA** | 48-hour Plan-Do-Check-Act micro-cycle project type. |
| **BAM OS / CadencePlan / The Agility Mechanism** | Platform / product / methodology names. |
| **Deep Block** | 4h PROJECT-bucket chunk in a Cadence Day. |
| **Phase gate** | Catalog-entry closure event that drives `phaseFor()` advancement; reviewed against Part 8.6 gate questions. |
| **Friction Signal** | Weekly Reflection output that may promote to a DMAIC Kaizen. |
| **Cadence Day / Week / Sprint / Month** | User-facing cycle names. |

---

*End of CadencePlan DMAIC Operating Standard v1.0.*

