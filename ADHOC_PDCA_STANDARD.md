# CadencePlan Ad-Hoc & PDCA — Operating Standard

Owner: Master Black Belt / Kaizen Facilitator / PDCA Coach / Technical PM / AI-Native Operating Model Designer
Status: v1.0 — authoritative operating standard for `Kaizen.projectType='AD_HOC'` (lightweight formal-methodology-free Kaizen project) and `PdcaExperiment` (48-hour personal micro-cycle) inside CadencePlan. Completes the CadencePlan project-type family alongside `ACCELERATOR_STANDARD.md` v1.0, `KAIZEN_EVENT_STANDARD.md` v1.0, and `DMAIC_STANDARD.md` v1.0.
Scope: Canonical doctrine for opening, running, validating, closing, and learning from Ad-Hoc Kaizen projects and PDCA experiments. Facilitators, improvement coaches, individual practitioners, and AI agents treat this as authoritative. Ground docs: `ACCELERATOR_STANDARD.md` v1.0, `KAIZEN_EVENT_STANDARD.md` v1.0, `DMAIC_STANDARD.md` v1.0, `PROJECT_TYPE_30D_KAIZEN.md` v0.2, `PRODUCT_BLUEPRINT.md` v0.3, `ARCHITECTURE.md` v0.5 (§2.9 Kaizen, §2.13 PdcaExperiment, §3.3 Kaizen FSM, §6.1 events), `ENGINE_DESIGN.md` v0.4 (§4.1 PDCA canonical spec), `CATALOG_GAPS.md` v0.3 (catalog entry #12 PDCA Cycle), `AI_AGENTS.md` v0.1, `UX_FLOWS.md` v0.2.2.

> This is an **operating standard**, not an architectural spec. It codifies the operational doctrine for the two *lightweight* project types that complete the CadencePlan family. Lightweight does not mean lawless — the Kaizen HARD RULE still applies to AD_HOC (no close without matching-metric remeasurement), and PDCA graduation still requires three consecutive target-met ticks. But these types have fewer artifacts, fewer phases, fewer roles, and shorter envelopes than the three formal types. AD_HOC is deliberately formal-structure-free: `Kaizen.phase = null`, `Kaizen.phaseDefinitions = null`, and the composer payload is the generic `Deep Work — Project Task (generic)` with `linkedKaizenId` set — no DMAIC DAG walk, no phase-gated catalog filter. PDCA is a `PdcaExperiment` entity (not a `Kaizen.projectType` value) with a PLAN/DO/CHECK/ACT FSM, a 48-hour tick cadence via catalog #12, and a graduation gate at `consecutiveTargetHits >= 3`. Every Part 1–11 section present in the three formal standards is present here at appropriate depth; the target length (2000–3000 lines) is lighter because the operational surface area is genuinely smaller.

---

## Part 1 — Executive Validation of AD_HOC and PDCA

This Part covers BOTH project types so they can be held against each other. AD_HOC and PDCA together occupy the lightweight tier of the CadencePlan project-type family: they are the right answer when formal methodology (DMAIC, Kaizen 90, Accelerator, Kaizen Event 1–5 day) would impose overhead the problem does not justify, but ad-hoc improvement without *any* operating mechanism is the alternative and routinely fails.

### 1.A AD_HOC Validation

#### 1.A.1 Concise AD_HOC project model

An AD_HOC project in CadencePlan is a `Kaizen` record with `projectType='AD_HOC'` that walks the standard Kaizen FSM (`DRAFT → ACTIVE → IN_REMEASUREMENT → CLOSED`, abandoned-back-to-DRAFT path per `ARCHITECTURE §3.3`) with **no phase structure**. `Kaizen.phase = null` and `Kaizen.phaseDefinitions = null` at every point in the lifecycle. The project's Deep-block payload is not a phase-filtered catalog walk but the generic `Deep Work — Project Task (generic)` row (from `CATALOG_GAPS §H.2`) with `linkedKaizenId` set — giving the Process Owner free-form action capture while still funneling every block into the linked Kaizen's evidence stream.

Despite the lack of phase structure, the HARD RULE is unchanged: **no close without matching-metric remeasurement**. `KaizenService.close()` for an AD_HOC Kaizen still requires `remeasurementId !== null` AND `remeasurement.metricDefinitionId === baseline.metricDefinitionId`. Abandonment is the only legal escape hatch, and abandonment is never a `CLOSED` record — it is `Kaizen.state = DRAFT` with `abandoned = true`. The project's output is a CLOSED `Kaizen` row with a locked baseline, a same-metric remeasurement, a captured `closeKind ∈ {SUCCESS, PARTIAL, FAILED_HONEST}`, a captured action list, and a one-page learning summary. There is no ROI sign-off requirement (distinguishes AD_HOC from Accelerator and Kaizen 90), no control plan requirement, no Finance co-sign, no Sustainment Gate. AD_HOC is self-validated.

Typical shape: 1–3 people, 1–4 weeks elapsed, 8–40 person-hours total investment. Used for known problems, known root cause, known or obvious countermeasures, single functional scope, no cross-functional coordination cost, no statistical rigor requirement.

#### 1.A.2 What AD_HOC solves

Operating-excellence teams routinely face a category of improvement opportunity that is too real to ignore but too small to merit formal methodology:

| # | Pain | What AD_HOC does about it |
|---|---|---|
| 1 | **Known problem, known fix, but nobody wants the methodology overhead.** A team sees a broken SOP, has the fix in mind, and estimates 2 weeks of focused work — the overhead of a 5-phase Accelerator project (Phase 0 kickoff, roster confirmation, charter sign-off, phase-gate approvals) would consume 30% of the effort with no marginal value. | AD_HOC gives a Kaizen record, a baseline, an action list, a remeasurement, and a close — same rigor on evidence, zero ceremony on phases. |
| 2 | **Urgent improvement where the Sponsor prefers speed over rigor.** A QBR surfaces a pain that needs to be addressed before the next quarter-end; a formal 90-day Kaizen won't land in time; the Sponsor wants the fix this month. | AD_HOC fits a 1–4 week envelope with a real close gate. The Sponsor gets speed; the program gets evidence. |
| 3 | **Mid-project discovery that deserves its own track.** During an Accelerator or DMAIC project, the team surfaces a secondary issue that is real but clearly out of scope. Today it gets noted in the Lessons Learned doc and forgotten. | AD_HOC absorbs the spun-off issue as its own lightweight Kaizen — linked to the parent in `linkedKaizenId` lineage — so it stops being orphaned. |
| 4 | **Practitioner-initiated improvement with no Sponsor-driven mandate.** An individual sees waste in their own process; wants to fix it; doesn't need a Sponsor to approve a methodology. | AD_HOC's roster can be a single person (Process Owner = Facilitator = Practitioner). Sponsor time is optional (approval is self-attested for AD_HOC). |
| 5 | **Failed 5-day Kaizen Event residual.** A 1–5 day Kaizen Event closes with 40% of its backlog open; the team wants to finish the remainder without the overhead of a 90-day project. | AD_HOC picks up the residual with a fresh baseline on the same metric definition; close the residual as its own project. |
| 6 | **Weekly-Reflection friction cluster that is too small for a formal Kaizen promotion but too real to dismiss.** The cluster would fire a `KaizenPromoted` event but the user feels the formal types are overkill. | AD_HOC is the default promotion target from a friction cluster per `ARCHITECTURE §2.9` ("Default `AD_HOC` for legacy / backward-compatible promotion from a friction cluster with no fixed timeline"). |

#### 1.A.3 When to use AD_HOC vs the four formal types

This is the single most consequential decision AD_HOC exists to make. Apply these rules strictly, in order; the first matching rule wins.

| Rule | Verdict |
|---|---|
| 1. Root cause unknown AND variability dominates AND data exists for baseline n ≥ 30 | **DMAIC.** Not AD_HOC — AD_HOC assumes root cause is known. |
| 2. Scope crosses 2–4 functions AND the team needs cross-functional adoption runway AND 30 days is not enough | **Kaizen 90.** Not AD_HOC — AD_HOC has no change-management envelope. |
| 3. Single-function scope AND 30 days fits AND ROI needs Finance sign-off for portfolio roll-up | **Accelerator (30-day).** Not AD_HOC — AD_HOC does not require Finance co-sign (see §1.A.5). |
| 4. Single-function scope AND team can redesign + adopt in a co-located burst of 1–5 days AND no long implementation runway needed | **Kaizen Event (1–5 day).** Not AD_HOC — Kaizen Event is a burst format; AD_HOC is distributed over 1–4 weeks with no event week. |
| 5. Single-function OR personal scope AND root cause known AND 1–4 week envelope AND no formal ROI sign-off needed AND no phase structure wanted | **AD_HOC.** |
| 6. Individual-scale hypothesis test AND a 48h tick cadence is realistic AND graduation is the aim | **PDCA.** See §1.B. |

**Operational decision rules (apply in order):**

1. **If Finance sign-off is required by portfolio policy:** choose Accelerator or Kaizen 90 (which require Finance co-sign) or DMAIC (which requires two-pass Financial Benefit Translator). AD_HOC does not require Finance sign-off and therefore cannot satisfy a portfolio rule that does.
2. **If the problem crosses functions:** AD_HOC's lack of stakeholder-alignment ceremony will fail. Choose Kaizen 90.
3. **If the problem is single-function, under 4 weeks, with known fix:** AD_HOC is the right answer.
4. **If the problem is personal-scale and can be attacked in 48h increments:** PDCA is the right answer.
5. **If the problem starts as AD_HOC and grows:** legal promotion paths are AD_HOC → Accelerator (abandon and restart) or AD_HOC → DMAIC (abandon and restart) or AD_HOC → Kaizen 90 (abandon and restart). Do not silently re-scope an AD_HOC into a formal project.

**Demotion paths:**

- Accelerator → AD_HOC: if Phase 0 discovers the problem does not need Finance sign-off or phase structure, abandon Accelerator and restart as AD_HOC. Do not silently demote.
- Kaizen Event → AD_HOC: if a 5-day event finishes with a residual that is single-function and fits 1–4 weeks, open an AD_HOC for the residual.
- DMAIC → AD_HOC: rare and dangerous. If DMAIC discovers root cause is actually obvious in Define, either (a) close DMAIC as `FAILED_HONEST` with a note and open AD_HOC, or (b) continue DMAIC for the learning value. Never silently degrade DMAIC to AD_HOC.

#### 1.A.4 Why ad-hoc improvement traditionally fails

The word "ad-hoc" in industry usage is a warning label, not a methodology name. Ad-hoc improvement fails at a much higher rate than formal projects for six named reasons:

1. **No baseline.** "The cycle time is about 3 days." No operational definition, no sample size, no timestamp — just a recollection. When the remeasurement is attempted, there is nothing to compare to.
2. **No remeasurement.** The team declares victory after implementing the fix; no one measures whether the number moved. The lesson learned is the anecdote, not the delta.
3. **No evidence.** Action list lives in a chat thread or a whiteboard photo; owners are verbal; due dates are "soon"; completion is self-declared. Three months later, nobody can reconstruct what was actually changed.
4. **No learning capture.** Even when the project succeeds, the lesson is stored in the head of whoever did it. The next person facing the same problem reinvents the approach.
5. **Scope creep.** A 2-week project becomes a 3-month project because nobody set a timebox. The team loses enthusiasm; the project dies by attrition.
6. **No close discipline.** Ad-hoc projects rarely have a closing ritual. They peter out. The improvement may persist or may not; nobody checks.

#### 1.A.5 How CadencePlan's AD_HOC preserves rigor while dropping formality

CadencePlan's AD_HOC keeps the six anti-patterns above from recurring:

1. **Baseline is required.** Even AD_HOC walks through the Kaizen FSM's `DRAFT → ACTIVE` transition, which requires `baselineMetricId !== null` AND `baseline.locked === true`. The composer will not schedule implementation Deep blocks until baseline is locked. A "no baseline" AD_HOC is impossible by construction.
2. **Remeasurement is required.** The HARD RULE applies in full: `IN_REMEASUREMENT → CLOSED` requires `remeasurement.metricDefinitionId === baseline.metricDefinitionId`. No close without measurement.
3. **Evidence is structured.** Action list lives on `Kaizen.actions[]` with `ownerRef` + `dueDate`. The composer schedules AD_HOC Deep blocks that link to the Kaizen via `linkedKaizenId`. Every closed block produces a reflection with an output artifact. Three months later, the evidence is reconstructable from the database.
4. **Learning capture is structured but lightweight.** A one-page Lessons Learned artifact is required at close (see Part 4). Not a 20-page report — one page, captured inside the close ritual.
5. **Timebox is soft-enforced by the `ProjectPaceWarning` telemetry event** (generalized from `AcceleratorPaceWarning` per ARCHITECTURE §6.1). An AD_HOC that passes its declared `targetCloseDate + 14 days` fires a warning. The warning is a nudge, not a gate (AD_HOC has no phase gates); ignored warnings land in Weekly Reflection.
6. **Close is a ritual.** The Kaizen FSM's CLOSED state is the ritual. `closeKind ∈ {SUCCESS, PARTIAL, FAILED_HONEST}` must be set. `FAILED_HONEST` is a first-class outcome — more valuable than a missing close.

#### 1.A.6 Risks specific to AD_HOC

1. **Over-formalization (fake DMAIC).** A team runs an AD_HOC but imports DMAIC ceremony: writes a full SIPOC, runs MSA, drafts a control plan. The formal artifacts consume more time than the improvement itself. Root cause: the team did not actually need AD_HOC — they needed DMAIC — but picked the lighter type for political reasons. Mitigation: Part 1's decision rules (§1.A.3) are strict; Sponsor or Facilitator enforces "if you want SIPOC, open a DMAIC."
2. **Under-formalization (skipping the HARD RULE).** A team opens an AD_HOC, declares victory, tries to close without a remeasurement. The engine refuses, but the team is now angry that the "lightweight" type won't let them close. Root cause: the team conflated "no phase structure" with "no evidence requirement." Mitigation: the HARD RULE is in Part 1 as a principle (§1.A.1) and Part 7 as a control (§7.A.1); the intake wizard (Part 5) names the remeasurement commitment at open.
3. **Scope creep (AD_HOC becomes a 3-month project).** AD_HOC starts with a 2-week commitment; at week 3 the team discovers a second pain and rolls it into scope; at week 6 the project is drifting with no clear close. Root cause: no phase gates means no structural incentive to close. Mitigation: Part 2's close-date commitment is captured at open; `ProjectPaceWarning` fires at +14 days past target. Facilitator calls scope-creep and either (a) closes the AD_HOC and opens a new one for the secondary pain, or (b) abandons and promotes to a formal project.
4. **HARD RULE evasion attempts.** "The metric definition was slightly different but close enough" — user tries to close with a different `metricDefinitionId`. The engine refuses (`remeasurement.metricDefinitionId === baseline.metricDefinitionId` is exact equality). Mitigation: intake at baseline time authors the operational definition explicitly; if the definition is wrong, fix it at baseline, not at remeasurement.
5. **No learning capture.** Project closes; Lessons Learned is a single line ("it worked"). The next person faces the same problem with no benefit. Mitigation: Part 4 artifact A07 Lessons Learned has a required template with 5 sections; close gate requires the artifact to exist (but not to be long).
6. **Single-person blind spots.** AD_HOC's 1–3 person team has no peer review. The Process Owner talks themselves into a conclusion with no challenger. Mitigation: Part 6 recommends a named optional peer reviewer; Facilitator role is named separately from Process Owner and cannot be the same person unless the team is genuinely 1-person (which should be rare).

#### 1.A.7 Critical AD_HOC success factors

1. **Baseline has an operational definition before lock.** "Cycle time" is insufficient — "end-to-end elapsed time in business hours from ticket-created timestamp to ticket-resolved timestamp, excluding weekends and holidays, measured on the last 20 tickets in the queue" is the standard.
2. **Target close date is declared at open.** A 2-week commitment is a 2-week commitment; if the user does not know how long this will take, AD_HOC is the wrong type (pick Accelerator if it might be 30 days).
3. **Process Owner is named.** Even a 1-person AD_HOC has a named Process Owner — the person who owns sustainment. If nobody will own the after-state, do not open the project.
4. **Action list exists and is lean.** 3–7 actions with owners and dates. AD_HOC is not a 30-item backlog; a 30-item backlog is an Accelerator's implementation phase.
5. **Remeasurement is scheduled at open, not after close.** The 30-day (or 14-day, or 7-day) remeasurement is a calendar hold from the first week. "We'll remeasure when we're done" is the #1 reason AD_HOC projects fail to close.
6. **Close ritual happens within 3 working days of remeasurement.** `closeKind` is chosen honestly; Lessons Learned is authored; the Kaizen is CLOSED. Drifting past 3 days is a signal the user has already moved on, and the close will never happen.

#### 1.A.8 AD_HOC failure modes and prevention controls

| # | Failure mode | Prevention control |
|---|---|---|
| 1 | **Baseline captured with no operational definition.** Later remeasurement uses a different definition; HARD RULE comparison fails. | Baseline artifact (A03) requires an operational-definition section; Facilitator attests the definition is measurable and repeatable. |
| 2 | **Action list with no owners.** Actions drift; nothing ships. | `Kaizen.actions[]` schema requires `ownerRef !== null` and `dueDate !== null` at ACTIVE state transition. Engine-enforced per ARCHITECTURE §2.9. |
| 3 | **No remeasurement attempt (project drifts in ACTIVE forever).** User never transitions to IN_REMEASUREMENT. | `ProjectPaceWarning` at `startDate + 21 days` for AD_HOC; warning surfaces in Weekly Reflection. Facilitator/user is prompted to either remeasure or abandon. |
| 4 | **Remeasurement on different metric than baseline.** | HARD RULE: `KaizenService.close()` compares `baseline.metricDefinitionId === remeasurement.metricDefinitionId`. Exact match required. |
| 5 | **Close with no Lessons Learned artifact.** Learning is lost. | `KaizenService.close()` for AD_HOC requires `lessonsLearnedArtifactRef !== null` on a CLOSED ScheduledActivity with the Lessons Learned one-pager schema. |
| 6 | **Scope creep past +14 days of target close date.** | `ProjectPaceWarning` + Facilitator review; legal actions are (a) close-current + open-new, or (b) abandon + promote to formal type. |
| 7 | **Fake close (user marks Kaizen CLOSED manually bypassing the FSM).** | Kaizen FSM is engine-enforced; there is no "manual close" API. User can only call `KaizenService.close()` which walks the guards. |
| 8 | **Sponsor disengagement.** AD_HOC has optional Sponsor; when Sponsor is not named, change management suffers. | Part 6 recommends Sponsor is named even for AD_HOC when the change affects anyone beyond the Process Owner; Sponsor gets one Communication block for approval. |

### 1.B PDCA Validation

#### 1.B.1 Concise PDCA project model

A PDCA experiment in CadencePlan is a `PdcaExperiment` entity (`ARCHITECTURE §2.13`), **not** a `Kaizen.projectType` value. The experiment is the parent hypothesis binding together a series of 48-hour `ScheduledActivity` ticks (catalog entry #12, `bucket='CI'`, `cadence='EVERY_48H'`, `defaultDurationMinutes=120`). The experiment walks a mini-FSM — PLAN → DO → CHECK → ACT — with graduation at `consecutiveTargetHits >= 3` or termination via abandonment or promotion to a formal Kaizen.

Each tick is a single 2-hour block scheduled by the Daily composer's CI rotation (`pickCI()` priority 80, guarded by `hoursSinceLastPdca(input) >= 42`, per `ENGINE_DESIGN §1.5` and §4.1). The tick produces a numeric measurement of the current condition (`outputArtifactRef.schema = 'NUMERIC'`) and a short reflection. `PdcaService.tick()` updates `consecutiveTargetHits`: +1 if measurement meets target; reset to 0 otherwise.

Termination paths (all emit `PdcaExperimentClosed` per `ARCHITECTURE §6.1`):

- **GRADUATED** — `consecutiveTargetHits >= 3` at a tick close; experiment transitions to CLOSED.
- **ABANDONED** — user taps "Abandon experiment"; reason captured; experiment transitions to CLOSED.
- **SUPERSEDED_BY_KAIZEN** — user promotes the experiment to a Kaizen (AD_HOC or a formal type); experiment transitions to CLOSED; the new Kaizen's `sourceFrictionSignalIds` references the experiment's measurement history.

MVP cap: one open PDCA experiment per user (`PdcaExperiment.state !== 'CLOSED'`); parallel experiments land in Next. Orphan-tick protection: `ActivityService.start()` rejects a catalog #12 tick without `linkedPdcaExperimentId` when the user has an open experiment (per ARCHITECTURE §2.13 invariant).

Typical shape: 1 person, 6–14 days elapsed (3–7 ticks), 6–14 person-hours total investment (2h per tick). Used for individual-scale hypothesis testing, pre-Kaizen discovery, rapid learning.

#### 1.B.2 What PDCA solves

| # | Pain | What PDCA does about it |
|---|---|---|
| 1 | **Personal-scale improvement that needs evidence, not methodology.** An individual wants to test whether switching their focus-block timing from 9am to 7am improves their daily Deep minutes — the improvement is real, but nothing short of AD_HOC would be an even lighter answer, and AD_HOC is still a `Kaizen` with all the lifecycle weight. | PDCA is an experiment, not a Kaizen. No `Kaizen` row is created. No baseline-metric lock, no action list, no remeasurement — just a hypothesis, a target, 48h ticks, and graduation at 3 consecutive hits. |
| 2 | **Hypothesis testing without a mature problem statement.** The user is not even sure what the problem is, they have a hunch about a lever. PDCA lets them test the lever for 2 weeks before committing to formal Kaizen scope. | Pre-Kaizen discovery: PDCA produces evidence the user can later promote to a formal Kaizen (SUPERSEDED_BY_KAIZEN) with the measurement history inherited. |
| 3 | **Rapid iteration on a personal process.** The user wants to try 3–5 variants of an approach and see which sticks. 48-hour ticks with an adjustable hypothesis support this. | Each tick's reflection can commit an adjustment to the hypothesis; ACT → PLAN iterates without closing the experiment. |
| 4 | **Continuous-learning loops for an individual practitioner.** An experiment is open-ended; graduation is defined but the user may also choose to abandon after a learning is clear even without hitting target. | Honest abandonment is first-class: `closedReason='ABANDONED'` with a captured reason; the learning is still captured in the learning summary. |
| 5 | **Weekly Reflection friction too personal for a Kaizen but too real to dismiss.** A user notices they always feel drained on Wed afternoons. A Kaizen (even AD_HOC) feels ceremonial. A PDCA captures it as a named hypothesis. | User opens a PDCA from Weekly Reflection: "If I move my 1:1s from Wed afternoon to Thu morning, my Wed-afternoon energy should improve." Tick for two weeks. Graduate or abandon. |

#### 1.B.3 When to use PDCA vs AD_HOC vs waiting for a formal project

| Rule | Verdict |
|---|---|
| 1. The problem is personal-scale, the measurement is a single number, and a 48h rhythm is realistic | **PDCA.** |
| 2. The problem affects a team or process, not just the individual, AND there is a Process Owner | **AD_HOC** at minimum. Not PDCA — PDCA has no roster. |
| 3. The user is unsure whether the problem is real; wants cheap evidence before investing in formal scope | **PDCA.** Use as pre-Kaizen discovery. |
| 4. ROI sign-off, control plan, or cross-functional coordination is required | **Not PDCA** — escalate to a formal type. |
| 5. The problem can be characterized and measured daily with a consistent operational definition | **PDCA** is likely fit. |
| 6. The problem is acute / one-off / requires immediate action | **Not PDCA** — PDCA is a learning loop. Use a post-mortem + AD_HOC. |

**Promotion paths out of PDCA:**

- PDCA → AD_HOC: user discovers mid-experiment the problem is bigger than PDCA can hold. Close PDCA with `SUPERSEDED_BY_KAIZEN`; open AD_HOC with the PDCA's baseline carried forward as the Kaizen's baseline.
- PDCA → Kaizen 90 / Accelerator / DMAIC: rarer, but legal. PDCA may reveal a pattern that deserves cross-functional investment.

**When *not* to promote:**

- PDCA graduated cleanly (3 consecutive hits) and the improvement sticks. Graduated is the happy path. Do not promote a graduated experiment into a Kaizen "to get credit" — the learning is already captured.

#### 1.B.4 Why PDCA typically fails in practice

1. **No parent experiment entity — orphan ticks.** Classical PDCA practice is a notebook entry every 48 hours; without a parent hypothesis binding ticks together, each tick is a disconnected reflection. The third tick does not know it is the third tick; graduation on "3 consecutive hits" cannot be computed.
2. **Self-declared success without consecutive hits.** A user hits target once, declares "it worked!", stops the experiment. The 3-consecutive-hit rule exists because single-tick hits are dominated by noise.
3. **Forgotten experiments.** The user opens a PDCA enthusiastically, ticks twice, then forgets. Three months later they rediscover it; no clean close; no learning capture.
4. **Fake measurements.** The user fills in a "plausible" number rather than actually measuring. Over time the whole experiment history is fiction.
5. **No orphan-tick protection.** A user schedules a #12 tick without a parent experiment; the tick closes with a measurement that floats nowhere; the CI bucket is "filled" but nothing is learned.
6. **Running past 3 hits without graduating.** The target was hit on tick 4, 5, and 6; the experiment should graduate at tick 6; the user keeps ticking "just to be sure" and the experiment drags into tick 10 with no clean close.
7. **Ambiguous hypothesis.** "I want to be more focused" is not a hypothesis. A PDCA with no falsifiable statement cannot be graduated or abandoned meaningfully.
8. **Target condition set to present value.** If the target equals the baseline, every tick "hits target"; graduation happens on tick 3 with no actual improvement.

#### 1.B.5 How CadencePlan's PDCA fixes these

1. **Parent experiment is an entity.** `PdcaExperiment` (`ARCHITECTURE §2.13`) with `hypothesis`, `targetMetricName`, `currentConditionBaseline`, `targetCondition`, `consecutiveTargetHits`, `tickActivityIds[]`, `state`, `closedReason`. Ticks are children; graduation is computed on the parent.
2. **Graduation requires 3 consecutive target hits.** `PdcaService.tick()` recomputes `consecutiveTargetHits` at every tick; CLOSED-GRADUATED requires the counter ≥ 3 (per ARCHITECTURE §2.13 invariant; `PdcaService.tick()` guard in ENGINE §4.1).
3. **One-open-experiment cap forces closure.** At most one `PdcaExperiment` per user with `state !== 'CLOSED'` (MVP invariant). User cannot start a new experiment until the prior is graduated, abandoned, or promoted.
4. **Numeric measurement is required at tick close.** Catalog #12's `outputArtifact.schema === 'NUMERIC'` AND `required === true`. Engine refuses `IN_PROGRESS → CLOSED` without the measurement (ScheduledActivity invariant, ARCHITECTURE §2.5).
5. **Orphan-tick protection.** `ActivityService.start()` rejects a #12 tick without `linkedPdcaExperimentId` when the user has an open experiment (ARCHITECTURE §2.13 invariant).
6. **Graduation suggestion from the Reflection agent.** When `consecutiveTargetHits` reaches 3, the Reflection agent surfaces "You've hit target 3 times in a row — graduate?" at the tick close (AI_AGENTS.md Reflection agent; see Part 9).
7. **Hypothesis template (Part 5) enforces falsifiability.** The intake wizard rejects a hypothesis missing the "If … then …" pattern.
8. **Target condition must beat baseline.** `PdcaService.open()` rejects creation when `targetCondition === currentConditionBaseline` with no direction declared. The intake requires "higher is better" or "lower is better" + a delta > 0.

#### 1.B.6 Risks specific to PDCA

1. **Abandonment drift.** Experiment opens; user ticks twice; forgets. Experiment remains open; blocks new experiments. Mitigation: `ProjectPaceWarning` generalized from AcceleratorPaceWarning fires at 14 days past last tick with an open experiment; Reflection agent surfaces "your PDCA has been idle — graduate, abandon, or tick?" weekly.
2. **Graduation without enough ticks.** User's sense of "it worked" outpaces the 3-consecutive-hit guard. Mitigation: engine-enforced; the guard is hard.
3. **Over-running past 3 hits.** Experiment graduates-eligible but user keeps ticking. Mitigation: Reflection agent nudges "you've been graduation-eligible for 2 ticks — close?"; hard cap at tick 10 triggers a Facilitator review (in team mode) or a self-review prompt (in single-user MVP).
4. **Fake measurements.** No engine defense against a user typing a number they did not measure. Mitigation: Part 5's hypothesis template requires the measurement method to be named; Reflection agent flags measurements that are "suspiciously round" or that exactly equal target (no noise).
5. **Forgotten experiments.** Already covered by abandonment drift + pace warning.
6. **Experiment fatigue.** Running the same PDCA for 20+ ticks with no graduation and no iteration. Mitigation: at tick 8, Reflection agent asks "has the hypothesis been adjusted? should it be?"; tick 10 triggers a mandatory ACT → PLAN iteration review.
7. **Promotion reluctance.** PDCA reveals a bigger problem but user doesn't promote because the paperwork is scary. Mitigation: Reflection agent surfaces the promotion suggestion with a one-click path to AD_HOC promotion (AD_HOC is the lightest legal Kaizen type; the friction is minimal).
8. **Scope leakage into the 2h tick.** User uses their CI bucket for other CI work, claims it was the PDCA tick. Mitigation: catalog #12 tick requires `linkedPdcaExperimentId`; the tick's output artifact is the measurement; if the measurement is absent, the tick cannot close.

#### 1.B.7 Critical PDCA success factors

1. **Hypothesis is falsifiable.** "If X then Y" with a measurable Y.
2. **Baseline is captured before first tick.** `currentConditionBaseline` at experiment open.
3. **Target condition beats baseline.** Non-trivial direction + delta.
4. **Measurement method is named.** "Count of context switches between 9am and noon, counted by the phone's Slack notification log" — not "how distracted I feel."
5. **First tick happens within 24 hours of open.** PDCAs that do not tick in the first day typically die.
6. **Graduation or abandonment within 10 ticks.** A PDCA running past 10 ticks is a smell; it should either promote to a Kaizen or be abandoned.

#### 1.B.8 PDCA failure modes and prevention controls

| # | Failure mode | Prevention control |
|---|---|---|
| 1 | **Orphan ticks.** | `ActivityService.start()` guard (ARCHITECTURE §2.13). |
| 2 | **Parallel open experiments.** | MVP cap: one open experiment per user (ARCHITECTURE §2.13). |
| 3 | **Self-declared graduation.** | `consecutiveTargetHits >= 3` guard on CLOSED-GRADUATED (ARCHITECTURE §2.13 + ENGINE §4.1). |
| 4 | **Tick close without measurement.** | Catalog #12 output artifact `NUMERIC, required: true`; engine refuses IN_PROGRESS → CLOSED. |
| 5 | **Experiment drift (abandonment without close).** | `ProjectPaceWarning` at 14 days past last tick; Reflection agent surfaces. |
| 6 | **Fake measurement.** | Reflection agent pattern-flag; Part 5 template names measurement method. |
| 7 | **Over-running past 3 hits.** | Reflection agent graduation prompt at `consecutiveTargetHits === 3`; user one-click graduates. |
| 8 | **Running a PDCA when an AD_HOC / formal type is correct.** | §1.B.3 decision rules in intake copy; Reflection agent surfaces promotion suggestion when hypothesis touches multiple people or requires org-level change. |

### 1.C Unified Project-Type Selection Table

This table is the family-complete decision matrix covering all six options. Axes are ordered by how early in intake they tend to fire; the first axis that clearly excludes a type wins. Use strictly.

| Axis | DMAIC | Kaizen 90 | Accelerator (30-day) | Kaizen Event (1–5 day) | AD_HOC | PDCA |
|---|---|---|---|---|---|---|
| **Scope** | Cross-functional, chronic | Cross-functional (2–4 fns) | Single function | Single function | Single function / individual | Individual |
| **Root cause state** | Unknown, needs statistical validation | Known | Known | Known | Known | Hypothesis-testing |
| **Duration** | 4–10 months | 90 days | 30 days | 1–5 days | 1–4 weeks | 6–14 days (3–7 ticks) |
| **Statistical rigor required** | Heavy (MSA, Capability, regression, DOE) | Medium (summary stats, adoption) | Light (baseline + remeasure) | Light (before/after) | Light (baseline + remeasure) | Trend detection |
| **Team size** | 6–12 + MBB reviewer | 8–15 cross-fn | 3–6 | 5–8 event team | 1–3 | 1 |
| **Evidence requirements** | Baseline (n≥30 continuous), MSA, Capability, Control Chart, Regression, Financial Benefit (two-pass), Control Plan | Baseline, same-metric remeasure, Finance co-sign, Sustainment Gate (2-week adoption), Control Plan | Baseline, same-metric remeasure, Finance co-sign, Control Plan | Same-metric remeasure, 30-day sustainment check | Baseline, same-metric remeasure, Lessons Learned | Baseline, 3 consecutive target-met ticks |
| **Formal methodology required?** | Yes — DMAIC phased (D/M/A/I/C) | Yes — 4 macro-phases (Pre-Event / Event / Post-Event / Sustain) | Yes — 5 phases (Phase 0–4) | Yes — event-week phases (Day 1–5) | **No** — FSM only, no phase structure | Yes — PDCA FSM (PLAN/DO/CHECK/ACT) |
| **ROI sign-off required?** | Yes — Finance co-sign, two-pass | Yes — Finance co-sign | Yes — Finance co-sign | Optional | **No** | No |
| **Control plan required?** | Yes — authored in Improve, signed in Control | Yes — signed at Sustainment | Yes — drafted in Phase 2, signed in Phase 4 | Optional 30-day check | No | No |
| **Phase structure in Kaizen entity?** | `phaseFor()` derived | `PRE_EVENT/EVENT/POST_EVENT/SUSTAIN` | `PHASE_0..PHASE_4` | N/A (short-burst Kaizen-Event binding) | **`phase=null`** | N/A (PdcaExperiment FSM) |
| **Composer payload** | DMAIC DAG (#20–#41) filtered by phase | Catalog #42–#50 + cross-functional entries, filtered by phase | 31 Accelerator-bound entries, filtered by phase | Catalog #42–#50 | Generic Deep Work (`linkedKaizenId`) | Catalog #12 tick with `linkedPdcaExperimentId` |
| **Entity** | `Kaizen` | `Kaizen` | `Kaizen` | `Kaizen` | `Kaizen` | **`PdcaExperiment`** (not Kaizen) |
| **Typical annualized ROI** | $250K–$10M | $200K–$3M | $50K–$1M | $10K–$250K | $1K–$50K | $0–$5K (personal productivity) |
| **Sponsor time** | 10–15 h | 8–12 h | 4–6 h | 2–4 h | 0–2 h (optional) | 0 h (not required) |
| **When the scope changes mid-flight** | Abandon + restart as appropriate type | Abandon + restart | Abandon + restart | Abandon + close early | Abandon or close-and-open-new | Promote to Kaizen |
| **Graduation criterion** | CLOSED with signed Control Plan + actual ROI + rebaseline | CLOSED with Sustainment Gate + signed Control Plan + rebaseline | CLOSED with signed Control Plan + Finance ROI + rebaseline | CLOSED with rebaseline (lighter) | CLOSED with remeasurement + Lessons Learned | CLOSED-GRADUATED with 3 consecutive target hits |
| **Abandonment path** | Kaizen → DRAFT with abandoned=true | Kaizen → DRAFT with abandoned=true | Kaizen → DRAFT with abandoned=true | Kaizen → DRAFT with abandoned=true | Kaizen → DRAFT with abandoned=true | PdcaExperiment → CLOSED with closedReason=ABANDONED |
| **AI-leverage** | Medium (statistical suggestions; MSA interpretation) | Medium (stakeholder-sentiment tracking; change-mgmt nudges) | Medium (phase nudges; roster check) | Low (event too short for agent cadence) | Medium (intake help; close ritual nudge) | **HIGH** (tick reminders, trend detection, graduation detection, promotion suggestions) |

### 1.D Interplay Between AD_HOC and PDCA

Although AD_HOC and PDCA target different scopes, they interoperate in five named patterns that facilitators should recognize at intake and during execution.

**Pattern 1 — PDCA as pre-AD_HOC discovery.** A practitioner suspects a problem but is unsure whether the problem is real or whether the proposed fix will help. Running a PDCA for 3–5 ticks produces evidence cheaper than opening an AD_HOC. If the PDCA graduates, the habit is captured; if it promotes via `SUPERSEDED_BY_KAIZEN`, the AD_HOC opens with a pre-baselined metric and measurement method. Either way, the AD_HOC is a higher-confidence project than one opened cold.

**Pattern 2 — AD_HOC spawns a secondary PDCA.** During an AD_HOC's Execute phase, an action owner discovers a personal workflow tweak that might compound the improvement. Rather than expanding AD_HOC scope, the owner opens a PDCA for the personal tweak. The AD_HOC and PDCA run in parallel; the AD_HOC closes on its target metric; the PDCA graduates (or abandons) independently.

**Pattern 3 — PDCA tick cadence surviving AD_HOC close.** A PDCA that graduates concurrent with an AD_HOC may migrate into a habit-reinforcement PDCA: new hypothesis ("maintain the improvement"), same measurement method, stricter target (e.g., 10 consecutive hits as a sustainment check). This is legal but optional.

**Pattern 4 — Parallel PDCA + AD_HOC on same topic (anti-pattern).** When PDCA and AD_HOC run on the same scope simultaneously, measurements diverge and causal attribution becomes impossible. Mitigation: intake wizard flags overlapping scope; facilitator picks one.

**Pattern 5 — Rapid PDCA-to-formal-project promotion.** A PDCA's evidence reveals a cross-functional root cause; promoting to AD_HOC is insufficient; the correct target is Kaizen 90 or DMAIC. The Promotion Memo (A13) names the target type and the evidence; the new formal project opens with the PDCA's measurement history attached.

### 1.E.0 Worked comparative examples

To ground the decision rules in §1.A.3 and §1.B.3 with concrete cases, six brief worked examples are presented. Each starts from a candidate problem and walks to a type verdict with rationale.

**Example 1 — Invoice-exception cycle time.**
- Problem: Cycle time has crept from 2d to 4d over a quarter.
- Root cause state: Known (new vendor onboarded; their invoice format triggers a manual exception).
- Scope: Single function (AP).
- Duration estimate: 2 weeks (update the exception rule; train team).
- Finance sign-off: Not required (no P&L benefit to book; pure cycle-time improvement).
- Verdict: **AD_HOC.** Rationale: known RC, single function, 2-week envelope, no Finance required. Matches §1.A.3 rule 5.

**Example 2 — Invoice-exception cycle time with Finance ROI expected.**
- Same as Example 1, but the Sponsor wants a $150K/year benefit booked.
- Verdict: **Accelerator (30-day).** Rationale: Finance sign-off is required → §1.A.3 rule 3. 30-day envelope gives room for formal control plan + Finance co-sign.

**Example 3 — Personal focus-time experiment.**
- Problem: User feels scattered; hypothesizes that 7am starts would improve.
- Scope: Self only.
- Measurement: Self-reported daily Deep minutes from BAM composer.
- Verdict: **PDCA.** Rationale: individual-scale, 48h cadence feasible, measurable. §1.B.3 rule 1.

**Example 4 — Team standup running long.**
- Problem: Standup at 42-min average against 15-min target.
- Scope: Team (5 people); single function.
- Root cause: Known (members doing status updates instead of impediments).
- Duration: 2 weeks.
- Verdict: **AD_HOC.** Rationale: single-function team; known RC; 2-week envelope. Rule 5. Even though it affects multiple people, it's a single-function + known-RC shape.

**Example 5 — Claims process with high defect variance.**
- Problem: 8% defect rate on claims processing; business says "we don't know why, it moves with the season."
- Scope: 3 functions (intake, adjudication, payment).
- Root cause state: Unknown. Seasonal variance needs statistical attribution.
- Verdict: **DMAIC.** Rationale: unknown RC + variance-driven + cross-functional + data-rich. Rule 1.

**Example 6 — Order-to-cash redesign across 4 functions, known root cause.**
- Problem: O2C takes 38d median; benchmarks say 14d is achievable. RC is handoff latency at 3 named junctions.
- Scope: 4 functions (sales, order mgmt, fulfillment, AR).
- Root cause: Known.
- Duration: 3 months for redesign + adoption.
- Verdict: **Kaizen 90.** Rationale: cross-functional + known RC + 90-day envelope. Rule 2.

Each verdict pairs with the §1.A.3 or §1.B.3 rule that matched. The pattern is consistent: root-cause-state gates DMAIC; scope-breadth gates Kaizen 90; Finance sign-off gates Accelerator; individual-scale gates PDCA; everything else defaults to AD_HOC.

### 1.E Telemetry and Observability for Lightweight Types

The three formal standards emit rich telemetry: `AcceleratorPaceWarning`, `KaizenEventSustainmentGatePassed`, DMAIC's `MSARejected` / `ControlChartOutOfControl`. AD_HOC and PDCA's telemetry is intentionally lighter but still useful:

| Event | Fires when | Who consumes | Why it matters |
|---|---|---|---|
| `KaizenPromoted{projectType:'AD_HOC'}` | AD_HOC opened | Portfolio UI, Facilitator dashboard | AD_HOC count is a leading indicator of CI program health |
| `KaizenBaselineLocked` | AD_HOC DRAFT → ACTIVE | MetricsService | Confirms HARD RULE eligibility |
| `ProjectPaceWarning{projectType:'AD_HOC'}` | AD_HOC past `targetCloseDate + 14d` | Facilitator, Reflection agent | Scope creep detection |
| `KaizenClosed{closeKind}` | AD_HOC CLOSED | Portfolio, Lessons Learned registry | `closeKind` distribution is a truth-telling metric |
| `KaizenAbandoned{projectType:'AD_HOC'}` | AD_HOC → DRAFT with `abandoned=true` | Facilitator | Abandonment rate is a program-health signal |
| `PdcaExperimentOpened` | PDCA created | Momentum agent (seed tick cadence), UI | Experiment count per user per month |
| `PdcaTickCommitted` | Every #12 tick close | PdcaService (counter update), Reflection agent, MetricsService | Tick rhythm; target-hit rate |
| `PdcaExperimentClosed{closedReason}` | PDCA CLOSED | UI, portfolio | Graduation rate; abandonment rate; promotion rate |

Program-level KPIs derivable from the above (suggested; not mandated):

- AD_HOC cycle time (days from `KaizenPromoted` to `KaizenClosed`). Target: ≤ 21 days median.
- AD_HOC close-kind distribution: target ≥ 60% SUCCESS, ≤ 15% FAILED_HONEST, ≤ 10% abandoned. Higher FAILED_HONEST is a sign of honest measurement; lower is suspicious.
- PDCA graduation rate: target ≥ 40% of closed experiments graduate. Below that signals hypothesis-quality problems.
- PDCA abandonment rate: acceptable ≤ 40%; above that signals intake discipline problems (experiments opened without real hypotheses).
- PDCA promotion rate: 5–20% of closed experiments promote. Higher suggests PDCAs are being opened for AD_HOC-sized problems; lower suggests the promotion path is being ignored.

---

## Part 2 — Full Lifecycle

This Part covers both types. Each lifecycle is authoritative for its type. The AD_HOC lifecycle has 6 operational "phases" that are **not** stored on the Kaizen entity — they are facilitator-visible stages driven by the Kaizen FSM states. The PDCA lifecycle has 4 canonical FSM states plus termination.

### 2.A AD_HOC Lifecycle

AD_HOC walks the Kaizen FSM (`ARCHITECTURE §3.3`): `DRAFT → ACTIVE → IN_REMEASUREMENT → CLOSED` with abandonment returning to DRAFT with `abandoned=true`. Because `Kaizen.phase = null` for AD_HOC, there are no engine-enforced phase gates between these FSM transitions — only the existing Kaizen FSM guards. This section names **operational** phases (stages) that facilitators and Process Owners run through; they map to Kaizen FSM states and are useful for capacity planning, artifact ownership, and process discipline even when no phase field exists on the entity.

| Operational phase | Kaizen FSM state during phase | Typical duration | Purpose |
|---|---|---|---|
| 1. Spark | DRAFT (pre-baseline) | 0–2 days | Identify problem; decide AD_HOC is the right type |
| 2. Baseline | DRAFT (locking baseline) | 1–3 days | Capture current metric; lock baseline |
| 3. Proposed Actions | DRAFT → ACTIVE | 1–2 days | Author action list; Kaizen transitions to ACTIVE |
| 4. Execute | ACTIVE | 5–18 days | Run the actions |
| 5. Remeasure | ACTIVE → IN_REMEASUREMENT | 1–3 days | Capture same-metric remeasurement |
| 6. Close | IN_REMEASUREMENT → CLOSED | 1–2 days | Compute `closeKind`; author Lessons Learned; CLOSE |

Total typical envelope: 9–30 working days (captured on `Kaizen.startDate` + user-declared `targetCloseDate`).

#### Operational Phase 1 — Spark

- **Purpose.** Convert a friction signal, a KPI dip, or a process-owner intuition into a concrete "this is worth an AD_HOC" decision.
- **Business outcome.** A named problem with a one-line pain statement, a one-line impact estimate, and a decision that AD_HOC (not DMAIC, not Accelerator, not Kaizen 90, not Kaizen Event, not PDCA) is the right type.
- **Entry criteria.** A friction signal, a Weekly Reflection cluster, a Sponsor request, or a Process Owner observation exists.
- **Exit criteria.** A DRAFT `Kaizen` row exists with `projectType='AD_HOC'`, a Problem Note artifact (A01) filled, and a declared `targetCloseDate`.
- **Major decisions.** Is this AD_HOC or a formal type? (Apply §1.A.3 rules.) What is the target close date?
- **Major artifacts.** Problem Note (A01); Scope Boundary Statement (A02).
- **Required roles.** Process Owner (decides to open); Facilitator (optional for 1-person AD_HOCs).
- **BAM scheduling pattern.** One CI block (30 min) for intake via the Kaizen promotion flow from Weekly Reflection; optional one COMMUNICATION block if a Sponsor conversation is needed.
- **Estimated duration.** 0.25–1 day.
- **Capacity assumption.** Process Owner has 30–60 minutes to decide scope + target close date.

#### Operational Phase 2 — Baseline

- **Purpose.** Capture the current value of the primary metric with enough rigor that the HARD RULE comparison at close is valid.
- **Business outcome.** `BaselineMetric` row with `locked=true` tied to the AD_HOC Kaizen; operational definition captured; measurement method named; sample size adequate for the type of metric (discussed in Part 7.A).
- **Entry criteria.** AD_HOC Kaizen exists in DRAFT; scope and problem note locked.
- **Exit criteria.** `Kaizen.baselineMetricId !== null` AND `BaselineMetric.locked === true`; Baseline Dataset artifact (A03) captured as a CLOSED ScheduledActivity output.
- **Major decisions.** Primary metric (single). Operational definition. Sample size. Measurement method. "Higher is better" or "Lower is better" direction.
- **Major artifacts.** Baseline Dataset (A03).
- **Required roles.** Process Owner (owner). Optional SME (if measurement requires system access the PO doesn't have).
- **BAM scheduling pattern.** 1–3 PROJECT (Deep) blocks for data pull + operational definition authoring; 1 CI block for baseline lock ritual.
- **Estimated duration.** 1–3 days.
- **Capacity assumption.** Data exists in a queryable system OR direct observation is possible OR the metric can be captured by counting at a fixed window.

#### Operational Phase 3 — Proposed Actions

- **Purpose.** Convert the problem + baseline into a lean action list (3–7 items) with owners and due dates; transition Kaizen from DRAFT to ACTIVE.
- **Business outcome.** `Kaizen.actions[]` populated; each action has `ownerRef`, `dueDate`, and a short description. Kaizen FSM transitions to ACTIVE (baseline locked + goal set + actions declared).
- **Entry criteria.** Baseline locked.
- **Exit criteria.** ≥3 actions on `Kaizen.actions[]`, each with non-null owner and due date; `Kaizen.goalStatement` set; Kaizen state is ACTIVE.
- **Major decisions.** Which countermeasures. Who owns each. What's the due date (must be within target close date).
- **Major artifacts.** Action List (A04).
- **Required roles.** Process Owner (owner). Facilitator (if present). Optional SME for countermeasure validation.
- **BAM scheduling pattern.** 1–2 PROJECT (Deep) blocks for action-list drafting; 1 COMMUNICATION block for owner assignment conversations.
- **Estimated duration.** 1–2 days.
- **Capacity assumption.** Owners are reachable within 24h.

#### Operational Phase 4 — Execute

- **Purpose.** Do the actions. Run the countermeasures. Collect evidence of change.
- **Business outcome.** Actions have `doneAt` timestamps; evidence of change is captured on Deep-block output artifacts linked to the Kaizen.
- **Entry criteria.** Kaizen is ACTIVE.
- **Exit criteria.** ≥ (2/3) of actions have `doneAt !== null` — soft threshold (AD_HOC has no formal guard like the Accelerator's weighted 80% rule); or a decision is made to remeasure with partial action completion.
- **Major decisions.** If an action is stuck, does the team push or drop? If a new action surfaces, does it go in scope or defer?
- **Major artifacts.** Action progress notes on Deep-block output artifacts; no dedicated artifact (progress lives on the action rows themselves).
- **Required roles.** Process Owner (runs daily). Action owners (execute). Facilitator (weekly check-in).
- **BAM scheduling pattern.** 3–10 PROJECT (Deep) blocks per week for action work, all with `linkedKaizenId` set; 1 CI block per week for AD_HOC check-in.
- **Estimated duration.** 5–18 days.
- **Capacity assumption.** Owners have ~4–8 h/week reserved for AD_HOC.

#### Operational Phase 5 — Remeasure

- **Purpose.** Capture the same-metric remeasurement.
- **Business outcome.** `Remeasurement` row with `metricDefinitionId === baseline.metricDefinitionId`; value captured with the same method as baseline.
- **Entry criteria.** Sufficient time has passed after the last action landed (the team's call; typically ≥7 days). User transitions Kaizen from ACTIVE to IN_REMEASUREMENT.
- **Exit criteria.** `Kaizen.remeasurementId !== null`; Remeasurement Dataset artifact (A05) captured.
- **Major decisions.** Is the remeasurement sample large enough? Should we rerun if the value looks noisy?
- **Major artifacts.** Remeasurement Dataset (A05).
- **Required roles.** Process Owner (owner). Same SME if needed.
- **BAM scheduling pattern.** 1–3 PROJECT (Deep) blocks, mirroring Phase 2's pattern.
- **Estimated duration.** 1–3 days.
- **Capacity assumption.** Same as baseline capture.

#### Operational Phase 6 — Close

- **Purpose.** Apply the HARD RULE; compute `closeKind`; author Lessons Learned; transition Kaizen to CLOSED.
- **Business outcome.** CLOSED `Kaizen` row with `closeKind ∈ {SUCCESS, PARTIAL, FAILED_HONEST}`; Lessons Learned artifact (A07) captured.
- **Entry criteria.** Kaizen is IN_REMEASUREMENT; `remeasurementId !== null`.
- **Exit criteria.** Kaizen state is CLOSED. `KaizenClosed` event emitted.
- **Major decisions.** `closeKind` selection (based on the remeasurement delta + honesty review). Who reads the Lessons Learned.
- **Major artifacts.** Validated Kaizen Close Record (A06); Lessons Learned (A07); optional Process Owner Transition Note (A08).
- **Required roles.** Process Owner (owner). Facilitator (attests). Optional Sponsor (receives Lessons Learned).
- **BAM scheduling pattern.** 1 PROJECT (Deep) block for Lessons Learned authoring; 1 CI block for close ritual.
- **Estimated duration.** 1–2 days.
- **Capacity assumption.** Process Owner has 2–4 h reserved for close.

### 2.B PDCA Lifecycle

PDCA walks the PdcaExperiment FSM (`ARCHITECTURE §2.13`, `ENGINE §4.1`): `PLAN → DO → CHECK → ACT → (iterate to PLAN OR CLOSED)`. Transitions happen at tick boundaries; the engine drives them; the user's action is the tick (scheduled as a #12 catalog activity) plus the tick's reflection at close.

#### PDCA State 1 — PLAN (initial)

- **Purpose.** Declare the hypothesis, baseline, target, and measurement method; create the PdcaExperiment row.
- **Business outcome.** `PdcaExperiment` row created with `state='PLAN'`, `hypothesis`, `targetMetricName`, `targetMetricUnit`, `currentConditionBaseline`, `targetCondition` all populated; `consecutiveTargetHits=0`; `tickActivityIds=[]`. `PdcaExperimentOpened` event emitted. Composer seeds the 48-hour #12 tick cadence on the next Daily composition.
- **Entry criteria.** User has no open experiment (`PdcaExperiment.state !== 'CLOSED'` cap). Hypothesis is authored (Part 5.B template).
- **Exit criteria.** Experiment row committed; FSM in `PLAN`. First tick scheduled.
- **What the user does.** Opens the experiment via the PDCA intake modal (from Settings or from Weekly Reflection). Fills in the hypothesis template. Confirms target > or < baseline by a declared delta.
- **What the system does.** Validates hypothesis format. Writes PdcaExperiment. Triggers composer re-run so the next Daily composition includes a #12 tick with `linkedPdcaExperimentId`.
- **AI-assisted opportunities.** Reflection agent suggests candidate hypotheses from recent friction signals; Context agent pre-fills baseline if a recent measurement is on the user's data.

#### PDCA State 2 — DO (executing a tick)

- **Purpose.** Execute the experimental variant during the 48-hour window leading up to the tick's close; the 2-hour tick block captures the tick's measurement and reflection.
- **Business outcome.** The 2-hour tick ScheduledActivity (#12) moves from SCHEDULED → IN_PROGRESS when the user starts it.
- **Entry criteria.** FSM in PLAN (first tick) or ACT (subsequent tick). A #12 ScheduledActivity exists with `linkedPdcaExperimentId` set.
- **Exit criteria.** Tick closed with measurement. FSM transitions to CHECK.
- **What the user does.** During the 48h leading up to the tick: lives the experimental change (the "Do" in PDCA). At the tick block: reviews the 48h's measurements (data previously captured), confirms the current-condition value, logs a short reflection.
- **What the system does.** `ActivityService.start()` verifies `linkedPdcaExperimentId !== null` (orphan-tick protection). Accepts the numeric measurement at close.
- **AI-assisted opportunities.** Context agent surfaces the measurement-capture note from last tick; Momentum agent nudges on-time start.

#### PDCA State 3 — CHECK (comparing measurement to target)

- **Purpose.** Compute `measurementHitsTarget` and update `consecutiveTargetHits`.
- **Business outcome.** `PdcaExperiment.consecutiveTargetHits` updated: +1 if hit, reset to 0 if missed. `PdcaTickCommitted` event emitted with the new counter value.
- **Entry criteria.** A #12 tick closed with `outputArtifactRef.schema='NUMERIC'` populated.
- **Exit criteria.** Counter updated. FSM transitions to ACT. If counter reaches 3, Reflection agent fires graduation suggestion.
- **What the user does.** Nothing manual — the engine runs CHECK on the close of the DO block.
- **What the system does.** `PdcaService.tick()` computes the delta, updates the counter, emits `PdcaTickCommitted`.
- **AI-assisted opportunities.** Reflection agent: if `consecutiveTargetHits === 3`, surface "Graduate?" prompt. If counter oscillates (hit-miss-hit-miss), surface "the hypothesis may be underspecified; consider adjusting in the ACT step."

#### PDCA State 4 — ACT (deciding what happens next)

- **Purpose.** User decides iterate / graduate / abandon / promote.
- **Business outcome.** A decision logged on the tick's Reflection. Either FSM transitions to PLAN (iterate with adjustment), or to CLOSED (graduate / abandon / promote).
- **Entry criteria.** FSM in CHECK; tick committed.
- **Exit criteria.** Decision logged. FSM transitions.
- **What the user does.** In the tick's Reflection SheetDMAIC-lite prompt, selects an outcome:
  - **Iterate (keep hypothesis, adjust variable).** FSM → PLAN; hypothesis can be edited.
  - **Iterate (keep everything).** FSM → PLAN; next tick scheduled.
  - **Graduate.** Only allowed if `consecutiveTargetHits >= 3`. FSM → CLOSED with `closedReason='GRADUATED'`.
  - **Abandon.** Reason captured. FSM → CLOSED with `closedReason='ABANDONED'`.
  - **Promote to Kaizen.** User initiates promotion to an AD_HOC (or formal) Kaizen. FSM → CLOSED with `closedReason='SUPERSEDED_BY_KAIZEN'`. Kaizen created with baseline inherited.
- **What the system does.** Validates graduation guard (`consecutiveTargetHits >= 3`). If iterate, schedules next #12 tick at `lastTickAt + 48h`. If close, emits `PdcaExperimentClosed`.
- **AI-assisted opportunities.** Reflection agent recommends the action based on pattern (3 hits → graduate; 5 misses → abandon-or-promote; oscillation → iterate-with-adjustment); Context agent pre-fills the promotion payload if SUPERSEDED_BY_KAIZEN selected.

#### PDCA State 5 — Iterate (back to PLAN, or terminal CLOSED)

Depending on the ACT decision, the experiment either loops to the next DO cycle (PLAN with optional hypothesis edit, then DO at `lastTickAt + ≥42h`) or reaches CLOSED. Iteration can loop indefinitely until graduation or abandonment; the soft cap at tick 10 triggers a mandatory Reflection-agent review prompt but does not auto-close.

### 2.C Cross-Lifecycle Event Stream

To illustrate how events flow across the AD_HOC and PDCA lifecycles, below is the canonical event sequence for each type plus shared composer events.

#### AD_HOC canonical event sequence (SUCCESS close)

```
Day 0   KaizenPromoted{projectType:'AD_HOC'}
Day 0   KaizenCharterDrafted (Problem Note + Scope committed)
Day 2   KaizenBaselineLocked
Day 3   KaizenActivated (DRAFT → ACTIVE; actions declared)
Day 3   CycleProposed / CycleAccepted (daily compositions with linkedKaizenId)
Day 4–18 ActivityCompleted × N (PROJECT blocks; each with linkedKaizenId + action progress)
Day 15  ProjectPaceWarning (fires if past targetCloseDate + 14d — optional)
Day 19  KaizenStartRemeasurement (ACTIVE → IN_REMEASUREMENT)
Day 21  KaizenRemeasurementCaptured
Day 22  KaizenClosed{closeKind:'SUCCESS'}
Day 22  Lessons Learned artifact captured as CLOSED ScheduledActivity output
```

#### AD_HOC canonical event sequence (ABANDONED)

```
Day 0   KaizenPromoted
Day 2   KaizenBaselineLocked
Day 3   KaizenActivated
Day 10  (no action progress; team stalls)
Day 21  ProjectPaceWarning (past targetCloseDate)
Day 22  KaizenAbandoned (Kaizen → DRAFT with abandoned=true)
        NB: never KaizenClosed; abandoned projects do not close.
```

#### PDCA canonical event sequence (GRADUATED)

```
Day 0   PdcaExperimentOpened{hypothesis, targetMetricName, baseline, targetCondition}
Day 1   CycleProposed / CycleAccepted (daily composition includes #12 tick)
Day 1   ActivityStarted (#12, linkedPdcaExperimentId set)
Day 1   ActivityCompleted{outputSchema:'NUMERIC', measurement:V1}
Day 1   PdcaTickCommitted{consecutiveTargetHits:1}   [target hit]
Day 3   PdcaTickCommitted{consecutiveTargetHits:2}   [target hit]
Day 5   PdcaTickCommitted{consecutiveTargetHits:3}   [target hit]
Day 5   Reflection agent fires "Graduate?" prompt
Day 5   PdcaExperimentClosed{closedReason:'GRADUATED'}
Day 5–6 Learning Summary (A11) captured
```

#### PDCA canonical event sequence (ABANDONED)

```
Day 0   PdcaExperimentOpened
Day 1   PdcaTickCommitted{consecutiveTargetHits:0}   [target missed]
Day 3   PdcaTickCommitted{consecutiveTargetHits:0}   [target missed]
Day 5   PdcaTickCommitted{consecutiveTargetHits:1}   [target hit; noise]
Day 7   PdcaTickCommitted{consecutiveTargetHits:0}   [target missed]
Day 9   PdcaTickCommitted{consecutiveTargetHits:0}   [target missed]
Day 9   Reflection agent: "5 ticks, no trend — abandon-or-adjust?"
Day 9   User taps Abandon with reason captured
Day 9   PdcaExperimentClosed{closedReason:'ABANDONED', reason:"hypothesis invalidated by 5-tick miss pattern"}
Day 10  Learning Summary (A11) captured
```

#### PDCA canonical event sequence (PROMOTED to AD_HOC)

```
Day 0   PdcaExperimentOpened (personal hypothesis)
Day 1–5 PdcaTickCommitted × 3 (mixed; pattern reveals cross-team impact)
Day 5   Reflection agent: "This pattern looks bigger than PDCA — promote?"
Day 5   User taps Promote
Day 5   KaizenPromoted{projectType:'AD_HOC', sourcePdcaExperimentId:<id>}
Day 5   PdcaExperimentClosed{closedReason:'SUPERSEDED_BY_KAIZEN'}
Day 5   AD_HOC DRAFT with baseline inherited from PDCA's currentConditionBaseline
Day 6   AD_HOC Scope Boundary + operational-definition authoring begins
...     (AD_HOC lifecycle continues from Operational Phase 2)
```

---

## Part 3 — Complete Task Inventory

This Part decomposes the AD_HOC and PDCA lifecycles into observable work tasks. Every task has observable acceptance criteria (the standard from the three formal standards). Task IDs follow the convention `adh_<phase>_<seq>` for AD_HOC (phase = operational phase number 1–6) and `pdca_<seq>` for PDCA.

### 3.A AD_HOC Tasks

Target: 25–35 tasks. Actual: 30 tasks across 6 operational phases.

| Phase # | Phase name | Task ID | Task name | Purpose | Operational definition | Inputs | Source | Steps | Owner | Supporting roles | Effort (h) | Duration | BAM work type | Predecessors | Successors | Tools | Deliverables | Outputs | Acceptance criteria | Risk if skipped | Standardization potential | AI-support | Automation | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Spark | adh_1_1 | Intake conversation | Convert pain into a concrete AD_HOC candidate | Initial 30-min conversation between Process Owner and Facilitator (or with self) to define the pain | Friction signal, KPI dip, or PO intuition | Weekly Reflection promotion flow / Settings | a. Name the pain. b. Quantify impact (1 number). c. Declare scope boundary (what's in / out). d. Estimate 1–4 week envelope. e. Decide type (§1.A.3). | Process Owner | Facilitator (opt.) | 0.5 | 0.5 d | COMMUNICATION | — | adh_1_2 | Problem Note template | Problem Note draft | Pain stated in 1 sentence; impact quantified; scope named | Opens AD_HOC on wrong problem | High | Planning agent suggests candidate clusters | Intake wizard template | Skip if intake came from Weekly Reflection cluster (pre-authored) |
| 1 | Spark | adh_1_2 | Type decision (AD_HOC vs formal vs PDCA) | Apply §1.A.3 rules; confirm AD_HOC is correct | 15-min review of the decision tree | Problem Note draft | §1.A.3 decision rules | a. Review each rule in order. b. Exclude types whose prereqs aren't met. c. Confirm AD_HOC via explicit sign-off. | Process Owner | Facilitator (opt.) | 0.25 | 0.25 d | CI | adh_1_1 | adh_1_3 | Decision tree walkthrough | Type decision logged | AD_HOC confirmed in writing with rationale | Opens wrong project type | High | Planning agent recommends type based on inputs | Intake wizard rule engine | — |
| 1 | Spark | adh_1_3 | Declare target close date | Commit to 1–4 week envelope | 5-min call: "when will this be done" | Type decision | §2.A table | a. Pick target date. b. Confirm ≤ 30 days. c. Save to `Kaizen.targetCloseDate`. | Process Owner | — | 0.1 | 0.1 d | CI | adh_1_2 | adh_1_4 | — | `targetCloseDate` field | Date is within 30 days of `startDate` | Scope creep | High | — | Validated by intake wizard | — |
| 1 | Spark | adh_1_4 | Create Kaizen row (DRAFT) | Open the AD_HOC Kaizen entity | `KaizenService.promote()` with `projectType='AD_HOC'`, `phase=null`, `phaseDefinitions=null` | Problem Note, type decision, target close date | ARCHITECTURE §2.9 | a. Call `KaizenService.promote({projectType:'AD_HOC'})`. b. Verify `phase===null` in the row. c. Emit `KaizenPromoted` event. | System (engine) | Process Owner | 0.05 | 0.05 d | — | adh_1_3 | adh_2_1 | — | DRAFT `Kaizen` row | `Kaizen.projectType==='AD_HOC'` AND `Kaizen.phase===null` AND `state==='DRAFT'` | No Kaizen entity to hang the work on | High | — | Full (engine-driven) | Auto-follows adh_1_3 |
| 1 | Spark | adh_1_5 | Scope boundary lock | Write down what's in / out of scope | 20-min review between PO and Facilitator | DRAFT Kaizen | Part 5.A template | a. List start event (what triggers the process). b. List end event (observable completion). c. List 3–5 explicit out-of-scope items. d. Capture on A02 artifact. | Process Owner | Facilitator (opt.) | 0.33 | 0.33 d | PROJECT | adh_1_4 | adh_2_1 | Scope Boundary template | Scope Boundary Statement (A02) | Start + end + ≥3 out-of-scope items named | Scope rotation mid-project | High | Context agent drafts from problem note | — | — |
| 2 | Baseline | adh_2_1 | Primary metric selection | Choose one metric for baseline + remeasure | 45-min decision on the metric | Problem Note, scope | Part 5.A | a. Propose candidate metrics. b. Check against operational-definition feasibility. c. Pick one. d. Name direction (higher-is-better or lower-is-better). | Process Owner | Facilitator (opt.), SME (opt.) | 0.75 | 0.5 d | PROJECT | adh_1_5 | adh_2_2 | — | Primary metric name + unit | One metric; direction declared | No single axis to optimize | High | Context agent suggests metrics from friction signals | — | — |
| 2 | Baseline | adh_2_2 | Operational definition authoring | Author a definition rigorous enough for same-metric remeasurement | 60-min writing + peer-review | Metric name | Part 5.A | a. Define the metric in measurable terms. b. Name the measurement method. c. Name the sample frame. d. Name exclusions. e. Name units. f. Review with SME if present. | Process Owner | SME (opt.), Facilitator | 1.0 | 0.5 d | PROJECT | adh_2_1 | adh_2_3 | Op-def template (Part 4 A03) | Operational Definition section of A03 | Definition passes the "would a new person measure the same way?" test | Remeasurement fails HARD RULE | Very high | Context agent drafts from metric name + process | — | — |
| 2 | Baseline | adh_2_3 | Baseline data capture | Collect the baseline sample | 1–2 days of data pull or direct observation | Operational definition | Data source system OR observation plan | a. Pull or observe per operational definition. b. Verify sample size adequate (see Part 7.A). c. Capture in A03. | Process Owner | SME (opt.) | 2.0–4.0 | 1–2 d | PROJECT | adh_2_2 | adh_2_4 | Data extract, observation sheet | Baseline Dataset (A03) | Sample captured; size ≥ minimum for metric type | No baseline → HARD RULE impossible | Medium | Context agent validates sample size | Query scripts can be reused | — |
| 2 | Baseline | adh_2_4 | Summary-stat computation | Compute baseline statistics (mean, p50, p90, count) | 30-min computation | Baseline Dataset | Statistical convention | a. Compute required stats. b. Capture on A03. c. Note any anomalies. | Process Owner | — | 0.5 | 0.25 d | PROJECT | adh_2_3 | adh_2_5 | Spreadsheet, script | Summary-stat block on A03 | Stats computed; anomalies noted | Flaky baseline undetected | High | — | Full if data pull is automated | — |
| 2 | Baseline | adh_2_5 | Baseline lock ritual | Lock the baseline (`BaselineMetric.locked=true`) | 10-min close ritual | A03 complete | ARCHITECTURE §2.10 | a. Review A03 with Facilitator. b. Call `KaizenService.lockBaseline()`. c. Verify `locked===true`. | Process Owner | Facilitator (opt.) | 0.2 | 0.1 d | CI | adh_2_4 | adh_3_1 | — | `BaselineMetric` row with `locked=true` | `Kaizen.baselineMetricId !== null` AND `BaselineMetric.locked===true` | Baseline mutation mid-project | High | — | Engine-enforced | — |
| 3 | Proposed Actions | adh_3_1 | Countermeasure brainstorm | Generate 5–10 candidate countermeasures | 45-min brainstorm | Baseline, problem note | — | a. List candidates. b. Cluster by type (process, system, training, policy). c. Rank by Impact × Ease. | Process Owner | Facilitator, SME (opt.) | 0.75 | 0.5 d | PROJECT | adh_2_5 | adh_3_2 | Brainstorm template | Candidate countermeasure list | 5+ candidates captured; ranked | Weak action list | Medium | Reflection agent surfaces prior similar Kaizens | — | — |
| 3 | Proposed Actions | adh_3_2 | Countermeasure selection | Pick 3–7 to commit | 30-min decision | Candidate list | — | a. Walk ranked list. b. Select top N that fit in target close date. c. Confirm each has an owner. | Process Owner | Facilitator | 0.5 | 0.25 d | PROJECT | adh_3_1 | adh_3_3 | — | Committed action list | 3–7 actions selected | Over-committed or under-committed | Medium | — | — | — |
| 3 | Proposed Actions | adh_3_3 | Owner + due-date assignment | Assign every action | 30-min | Committed list | — | a. Name owner for each. b. Set `dueDate` ≤ `targetCloseDate`. c. Save to `Kaizen.actions[]`. | Process Owner | Facilitator | 0.5 | 0.25 d | COMMUNICATION | adh_3_2 | adh_3_4 | — | `Kaizen.actions[]` populated | Every action has `ownerRef !== null` AND `dueDate !== null` | Actions drift without ownership | High | — | Engine-enforced at ACTIVE transition | — |
| 3 | Proposed Actions | adh_3_4 | Goal statement authoring | One-sentence what-good-looks-like | 15-min | Baseline, actions, target condition | Part 5.A | a. State target value. b. State measurement window. c. Save to `Kaizen.goalStatement`. | Process Owner | — | 0.25 | 0.1 d | PROJECT | adh_3_3 | adh_3_5 | — | Goal statement | Goal statement set; includes target value + window | Can't compute `closeKind` at remeasurement | High | Reflection agent drafts | — | — |
| 3 | Proposed Actions | adh_3_5 | ACTIVE transition | Walk Kaizen FSM DRAFT → ACTIVE | `KaizenService.activate()` | Baseline locked, actions set, goal set | ARCHITECTURE §3.3 | a. Call `KaizenService.activate()`. b. Verify `state==='ACTIVE'`. | System | Process Owner | 0.05 | 0.05 d | — | adh_3_4 | adh_4_1 | — | Kaizen ACTIVE | `Kaizen.state==='ACTIVE'` | Can't schedule Deep blocks with `linkedKaizenId` | High | — | Engine-enforced | — |
| 4 | Execute | adh_4_1 | First Deep-block scheduling | Schedule first PROJECT block for an action | Daily composer selects a `Deep Work — Project Task (generic)` row with `linkedKaizenId` set | Daily composer input | ENGINE §1.5 | a. Composer runs. b. Deep block picks first action. c. `ScheduledActivity.linkedKaizenId` set. | System (composer) | Process Owner | 0.05 | 0.05 d | — | adh_3_5 | adh_4_2 | — | Scheduled activity | Block appears on Daily composition | No work scheduled | High | Context agent surfaces next action | Engine-driven | — |
| 4 | Execute | adh_4_2 | Action execution (per action) | Do the action | Action-specific procedure | Action row | — | a. Per action-specific procedure. b. Capture evidence on the Deep block's output artifact. c. Set `action.doneAt` on completion. | Action owner | Process Owner, SME (opt.) | 1–8 per action | 1–5 d per action | PROJECT | adh_4_1 | adh_4_3 | Per action | Evidence artifact per action | `action.doneAt !== null` with attached artifact | Action list drifts | Medium | Momentum agent nudges overdue | — | Repeat for each action |
| 4 | Execute | adh_4_3 | Weekly AD_HOC check-in | 20-min weekly pulse | CI block on Friday | Action progress | — | a. Review action status. b. Flag blockers. c. Confirm target close date achievable. | Process Owner | Facilitator (opt.) | 0.33 per week | 0.33 d | CI | adh_4_2 | adh_4_4 | — | Check-in note | Status captured; blockers surfaced | Hidden drift | Medium | Reflection agent drafts check-in notes | — | Fires weekly during Execute |
| 4 | Execute | adh_4_4 | Blocker escalation (if needed) | Unblock stuck actions | 30-min call with Sponsor (if needed) | Blockers from adh_4_3 | — | a. Name blocker. b. Decide: push, drop, or escalate. c. Update action row. | Process Owner | Facilitator, Sponsor (opt.) | 0.5 if needed | 0.25 d | COMMUNICATION | adh_4_3 | adh_4_5 | — | Blocker decision | Decision logged; action row updated | Action blocks project | Medium | — | — | Fires only if blocker exists |
| 4 | Execute | adh_4_5 | Execute-phase exit decision | Decide: remeasure now, or keep executing | 15-min review | Action completion, calendar | — | a. Check action completion ratio. b. Check time to target close. c. Decide remeasure / continue. | Process Owner | Facilitator (opt.) | 0.25 | 0.1 d | CI | adh_4_4 | adh_5_1 | — | Remeasure-or-continue decision | Decision logged with rationale | Project stalls | Medium | Reflection agent suggests based on pace | — | — |
| 5 | Remeasure | adh_5_1 | IN_REMEASUREMENT transition | Walk Kaizen FSM ACTIVE → IN_REMEASUREMENT | `KaizenService.startRemeasurement()` | Execute-phase exit decision | ARCHITECTURE §3.3 | a. Call `startRemeasurement()`. b. Verify `state==='IN_REMEASUREMENT'`. | System | Process Owner | 0.05 | 0.05 d | — | adh_4_5 | adh_5_2 | — | Kaizen IN_REMEASUREMENT | `state==='IN_REMEASUREMENT'` | No remeasurement capture | High | — | Engine-enforced | — |
| 5 | Remeasure | adh_5_2 | Remeasurement data capture | Collect the post-change sample | Same method as baseline, mirroring adh_2_3 | Operational definition from baseline | Part 7.A.3 | a. Use identical op-def from A03. b. Pull or observe per same method. c. Capture in A05. | Process Owner | SME (opt.) | 2.0–4.0 | 1–2 d | PROJECT | adh_5_1 | adh_5_3 | Data extract, observation sheet | Remeasurement Dataset (A05) | Same-method sample captured; size ≥ baseline minimum | HARD RULE fails | High | — | Reuse baseline queries | — |
| 5 | Remeasure | adh_5_3 | Remeasurement summary stats | Compute matching stats | 30-min | A05 | — | a. Compute same stats as adh_2_4. b. Capture on A05. | Process Owner | — | 0.5 | 0.25 d | PROJECT | adh_5_2 | adh_5_4 | Spreadsheet | Summary block on A05 | Stats match baseline shape | Can't compute delta | High | — | Full if auto | — |
| 5 | Remeasure | adh_5_4 | Remeasurement lock | `Kaizen.remeasurementId` set | 10-min ritual | A05 complete | ARCHITECTURE §2.11 | a. Call `KaizenService.captureRemeasurement()`. b. Verify `remeasurementId !== null` AND `metricDefinitionId === baseline.metricDefinitionId`. | Process Owner | Facilitator (opt.) | 0.2 | 0.1 d | CI | adh_5_3 | adh_6_1 | — | Remeasurement row | Remeasurement locked; HARD RULE passes | HARD RULE check fails | High | — | Engine-enforced | — |
| 6 | Close | adh_6_1 | Delta computation + `closeKind` selection | Compute baseline→remeasurement delta; pick `closeKind` | 30-min review | Baseline, remeasurement, goal | Part 7.A | a. Compute delta. b. Compare to goal. c. Pick SUCCESS / PARTIAL / FAILED_HONEST per Part 7.A rules. | Process Owner | Facilitator (opt.) | 0.5 | 0.25 d | CI | adh_5_4 | adh_6_2 | — | `closeKind` chosen | Choice matches Part 7.A rule | Inflated or dishonest close | High | Reflection agent proposes `closeKind` | — | — |
| 6 | Close | adh_6_2 | Lessons Learned authoring | Write the 1-pager | 45-min writing | Close decision, action evidence | Part 4 A07 template | a. What changed. b. What worked. c. What didn't. d. What would we do differently. e. Reusability notes. | Process Owner | Facilitator (opt.) | 0.75 | 0.5 d | PROJECT | adh_6_1 | adh_6_3 | A07 template | Lessons Learned (A07) | All 5 sections filled | No learning capture | Very high | Reflection agent drafts from reflections | — | — |
| 6 | Close | adh_6_3 | Optional Process Owner Transition Note | If change affects ongoing ownership | 20-min | Close decision | Part 4 A08 template | a. Name ongoing owner. b. Name monitoring metric (optional). c. Name next review date. | Process Owner | — | 0.33 if needed | 0.25 d | COMMUNICATION | adh_6_2 | adh_6_4 | A08 template | Transition Note (A08) | Owner + metric + review date named | Sustainment gap | Medium | — | — | Skip if Process Owner = original user for personal AD_HOCs |
| 6 | Close | adh_6_4 | CLOSE ritual | Walk Kaizen FSM to CLOSED | `KaizenService.close()` | Remeasurement, Lessons Learned, `closeKind` | ARCHITECTURE §3.3 | a. Call `close(closeKind, lessonsLearnedRef)`. b. Engine verifies HARD RULE + Lessons Learned. c. Emit `KaizenClosed`. | System | Process Owner | 0.1 | 0.1 d | CI | adh_6_3 | adh_6_5 | — | CLOSED Kaizen | `Kaizen.state==='CLOSED'` AND `closeKind !== null` | Project never closes | High | — | Engine-enforced | — |
| 6 | Close | adh_6_5 | Sponsor notification (opt.) | Share close record with Sponsor | 10-min comms | Close record, Lessons Learned | — | a. Send close summary (email or chat). b. Link Lessons Learned. | Process Owner | — | 0.17 if needed | 0.1 d | COMMUNICATION | adh_6_4 | adh_6_6 | — | Sponsor notification | Sent and acknowledged | Sponsor disengagement | Low | Reflection agent drafts | — | Skip for 1-person AD_HOCs with no Sponsor |
| 6 | Close | adh_6_6 | Portfolio-feed review | Check if this AD_HOC suggests a bigger project | 15-min | Lessons Learned, close record | §1.A.3 | a. Review Lessons Learned for escalation signals. b. If a pattern emerges across ≥3 closed AD_HOCs, flag for Kaizen 90 or DMAIC. c. File in portfolio. | Facilitator | Process Owner | 0.25 | 0.1 d | CI | adh_6_5 | — | — | Portfolio note | Review done; flagged or filed | Missed escalation | Medium | Reflection agent cross-checks against prior closed AD_HOCs | — | Especially valuable for facilitators managing many AD_HOCs |

### 3.B PDCA Tasks

Target: 15–20 tasks. Actual: 18 tasks across the PDCA FSM.

| State # | State name | Task ID | Task name | Purpose | Operational definition | Inputs | Source | Steps | Owner | Supporting roles | Effort (h) | Duration | BAM work type | Predecessors | Successors | Tools | Deliverables | Outputs | Acceptance criteria | Risk if skipped | Standardization potential | AI-support | Automation | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 0 | Intake | pdca_1 | Experiment candidate review | Confirm PDCA is the right type | 10-min check | Friction signal or self-directed hypothesis | §1.B.3 decision rules | a. Check personal-scale vs team-scale. b. Check 48h cadence feasibility. c. Confirm no existing open experiment. d. Decide: PDCA or AD_HOC. | Self | — | 0.2 | 0.1 d | CI | — | pdca_2 | Decision rules | Type decision | PDCA chosen with rationale | Wrong type | High | Planning agent recommends PDCA vs AD_HOC | — | Fires from Weekly Reflection promotion flow |
| PLAN | Open | pdca_2 | Hypothesis authoring | Write the "if / then" statement | 15-min template fill | Candidate from pdca_1 | Part 5.B | a. "If I change [X] by [method], [Y] should [improve by amount] within [cycles]." b. Falsifiability check. | Self | — | 0.25 | 0.1 d | PROJECT (or CI) | pdca_1 | pdca_3 | Hypothesis template | Hypothesis string | Falsifiable; has X, Y, direction, delta, cycles | Cannot graduate or abandon meaningfully | Very high | Reflection agent drafts from cluster | Intake validator | — |
| PLAN | Open | pdca_3 | Baseline capture | Record current condition | 15-min measurement | Hypothesis | Catalog #12 procedure | a. Measure current condition using named method. b. Record value. c. Note measurement window. | Self | — | 0.25 | 0.1 d | CI | pdca_2 | pdca_4 | — | `currentConditionBaseline` value | Numeric; captured with named method | Cannot compute hit/miss | High | Context agent pre-fills from prior data | — | — |
| PLAN | Open | pdca_4 | Target condition setting | Define what "good" looks like | 10-min | Baseline, hypothesis | Part 5.B | a. State target value. b. Declare direction (higher-is-better / lower-is-better). c. Confirm target ≠ baseline. d. Confirm delta is non-trivial. | Self | — | 0.17 | 0.1 d | CI | pdca_3 | pdca_5 | — | `targetCondition` value | Target beats baseline by declared delta | Trivial graduation (target = baseline) | High | — | Validator | — |
| PLAN | Open | pdca_5 | Experiment creation | Create `PdcaExperiment` row | `PdcaService.open()` | Hypothesis, baseline, target | ARCHITECTURE §2.13 | a. Validate uniqueness (no open experiment). b. Write row. c. Emit `PdcaExperimentOpened`. d. Seed 48h tick cadence in composer. | System | Self | 0.05 | 0.05 d | — | pdca_4 | pdca_6 | — | `PdcaExperiment` row | `state==='PLAN'`, all fields set, unique open experiment | No parent entity | High | — | Engine-driven | — |
| DO | First tick | pdca_6 | First tick scheduling | Composer places first #12 block | Daily composer places on next day | PdcaExperiment row | ENGINE §1.5 priority 80 | a. Composer runs. b. #12 block placed in CI bucket. c. `linkedPdcaExperimentId` set. | System | — | 0.05 | 0.05 d | — | pdca_5 | pdca_7 | — | Scheduled #12 tick | Block on Daily composition with link | No tick → no experiment | High | — | Full | — |
| DO | Tick execution | pdca_7 | Live the hypothesis (48h) | Execute the experimental variant | 48h elapsed, during which user acts per hypothesis | Hypothesis | — | a. Per hypothesis. b. Capture measurements along the way. c. No tick block yet — that's pdca_8. | Self | — | — (elapsed) | 48h | — | pdca_6 | pdca_8 | — | Observations | Observations captured | Empty 48h | Medium | Momentum agent nudges midway | — | — |
| DO | Tick block | pdca_8 | Tick block start | `ActivityService.start()` on #12 | Orphan-tick check fires; start accepted if `linkedPdcaExperimentId` set | Open experiment, scheduled #12 | ENGINE §4.1, ARCHITECTURE §2.13 | a. Start tick. b. Engine verifies link. c. IN_PROGRESS. | System | Self | 0.05 | 0.05 d | — | pdca_7 | pdca_9 | — | IN_PROGRESS tick | Start accepted; no orphan error | Orphan tick | High | — | Engine-enforced | — |
| DO → CHECK | Measure | pdca_9 | Current-condition measurement | Record the tick's numeric measurement | 15-min during the 2h block | 48h observations | Catalog #12 | a. Compute current-condition value using named method. b. Capture as `outputArtifactRef.value` with `schema='NUMERIC'`. | Self | — | 0.25 | 0.1 d | CI | pdca_8 | pdca_10 | — | Numeric measurement | Numeric value captured | Tick can't close | Very high | Context agent prompts method | — | — |
| DO → CHECK | Reflect | pdca_10 | Tick reflection | Capture what-went-well / what-to-improve | 20-min during the 2h block | Measurement, hypothesis | Reflection prompt | a. What went well. b. What to improve. c. Did target condition hit? (y/n) | Self | — | 0.33 | 0.1 d | CI | pdca_9 | pdca_11 | Reflection template | Tick log entry | Reflection captured | No learning per tick | High | Reflection agent drafts | — | — |
| DO → CHECK | Close tick | pdca_11 | Tick close | `ActivityService.close()` on #12 | Engine validates output artifact; emits `PdcaTickCommitted` | Measurement, reflection | ARCHITECTURE §2.5 | a. Close tick. b. Engine verifies output. c. Emit `PdcaTickCommitted` with new `consecutiveTargetHits`. | System | Self | 0.05 | 0.05 d | — | pdca_10 | pdca_12 | — | CLOSED tick; event emitted | Tick CLOSED; counter updated | Counter not updated | High | — | Engine-enforced | — |
| CHECK | Counter update | pdca_12 | Counter recomputation | Update `consecutiveTargetHits` | `PdcaService.tick()` | Measurement, target | ENGINE §4.1 | a. Compare measurement to target per direction. b. +1 if hit; 0 if miss. c. Write to PdcaExperiment. | System | — | 0.05 | 0.05 d | — | pdca_11 | pdca_13 | — | Updated counter | Counter value correct | Graduation guard can't fire | High | — | Engine-enforced | — |
| CHECK → ACT | Outcome decision | pdca_13 | ACT decision | User picks iterate / graduate / abandon / promote | 5-min prompt post-tick | Counter, reflection | §2.B state 4 | a. Review counter. b. Review trend. c. Pick action. | Self | — | 0.1 | 0.05 d | CI | pdca_12 | pdca_14 or pdca_15 or pdca_17 | Decision prompt | Decision logged | Action chosen | Drift | High | Reflection agent recommends | — | — |
| ACT → PLAN | Iterate | pdca_14 | Next tick scheduled | Composer schedules next #12 at +≥42h | Daily composer on next day | Open experiment | ENGINE §1.5 | a. Composer runs. b. #12 block placed if `hoursSinceLastPdca ≥ 42`. c. Link set. | System | — | 0.05 | 0.05 d | — | pdca_13 (iterate) | pdca_7 (loop) | — | Next scheduled tick | Next tick placed | Cadence breaks | High | — | Full | Loops back to pdca_7 |
| ACT → CLOSED | Graduate | pdca_15 | Graduation close | `PdcaService.close('GRADUATED')` | `consecutiveTargetHits >= 3` guard | Open experiment, counter ≥ 3 | ARCHITECTURE §2.13 | a. Verify counter ≥ 3. b. Close with `closedReason='GRADUATED'`. c. Emit `PdcaExperimentClosed`. | System | Self | 0.1 | 0.05 d | CI | pdca_13 (graduate) | pdca_18 | — | CLOSED experiment | `state==='CLOSED'` AND `closedReason==='GRADUATED'` | Experiment lingers; no learning capture | High | Reflection agent surfaces "Graduate?" | Engine-enforced guard | — |
| ACT → CLOSED | Abandon | pdca_16 | Abandonment close | `PdcaService.close('ABANDONED', reason)` | User-initiated with reason | Reason string | ARCHITECTURE §2.13 | a. Capture reason. b. Close with `closedReason='ABANDONED'`. c. Emit event. | System | Self | 0.15 | 0.05 d | CI | pdca_13 (abandon) | pdca_18 | — | CLOSED experiment | `state==='CLOSED'` AND `closedReason==='ABANDONED'` AND reason captured | Silent drop | Medium | Reflection agent prompts reason | — | — |
| ACT → CLOSED | Promote | pdca_17 | Promotion to Kaizen | Close PDCA as SUPERSEDED_BY_KAIZEN; open new Kaizen | User-initiated | Experiment history, decision | ARCHITECTURE §2.13 | a. Open target Kaizen (typically AD_HOC). b. Inherit baseline: `Kaizen.baselineMetricId = experiment.currentConditionBaseline` equivalent. c. Close PDCA with `SUPERSEDED_BY_KAIZEN`. d. `Kaizen.sourceFrictionSignalIds` references experiment. | System | Self | 0.5 | 0.25 d | CI | pdca_13 (promote) | pdca_18 | Promotion wizard | CLOSED experiment + new Kaizen | PDCA CLOSED; Kaizen DRAFT with baseline inherited | Escalation lost | Medium | Reflection agent suggests promotion when pattern emerges | — | — |
| Post-CLOSED | Learning capture | pdca_18 | Learning summary | Write 1-pager on experiment outcome | 20-min | All tick logs, close reason | Part 4 A11 template | a. Hypothesis. b. What happened. c. Target hit/miss pattern. d. Learning. e. What's next. | Self | — | 0.33 | 0.25 d | CI | pdca_15/16/17 | — | A11 template | Learning Summary (A11) | All 5 sections filled | No cross-experiment learning | High | Reflection agent drafts from tick logs | — | — |

---

### 3.C Task ordering and parallelism

AD_HOC tasks in Part 3.A are serial within a phase but phases can overlap. Specifically:

- `adh_2_2` (operational definition authoring) and `adh_2_3` (baseline data capture) can run in parallel if the op-def is stable enough to start pulling data. This is typical for well-understood metrics (cycle time, defect rate).
- `adh_4_2` (action execution per action) runs in parallel across action owners. The BAM composer schedules separate `linkedKaizenId` PROJECT blocks for each owner.
- `adh_6_2` (Lessons Learned) and `adh_6_3` (Process Owner Transition Note) can run in parallel within the Close phase.

PDCA tasks in Part 3.B are strictly serial within an experiment — ticks must happen in sequence; no parallelism is meaningful.

### 3.C.1 Role-to-task responsibility matrix (AD_HOC)

| Task | Process Owner | Facilitator | Action Owner | SME | Sponsor |
|---|---|---|---|---|---|
| adh_1_1 Intake | **A** | C | — | — | I |
| adh_1_2 Type decision | **A** | C | — | — | — |
| adh_1_3 Target close date | **A** | I | — | — | I |
| adh_1_4 Create Kaizen row | — | — | — | — | — |
| adh_1_5 Scope boundary | **A** | C | — | — | — |
| adh_2_1 Primary metric | **A** | C | — | C | — |
| adh_2_2 Op-def | **A** | C | — | C | — |
| adh_2_3 Baseline capture | **A** | — | — | C | — |
| adh_2_4 Summary stats | **A** | — | — | — | — |
| adh_2_5 Baseline lock | **A** | C | — | — | — |
| adh_3_1 Countermeasure brainstorm | **A** | C | C | C | — |
| adh_3_2 Countermeasure selection | **A** | C | — | — | — |
| adh_3_3 Owner assignment | **A** | C | R | — | I |
| adh_3_4 Goal statement | **A** | — | — | — | — |
| adh_3_5 ACTIVE transition | — | — | — | — | — |
| adh_4_1 First Deep block | — | — | **A** | — | — |
| adh_4_2 Action execution | C | — | **A** | C | — |
| adh_4_3 Weekly check-in | **A** | R | I | — | — |
| adh_4_4 Blocker escalation | **A** | C | I | — | C |
| adh_4_5 Execute exit decision | **A** | C | — | — | — |
| adh_5_1 IN_REMEASUREMENT | — | — | — | — | — |
| adh_5_2 Remeasurement capture | **A** | C | — | C | — |
| adh_5_3 Remeasurement stats | **A** | — | — | — | — |
| adh_5_4 Remeasurement lock | **A** | C | — | — | — |
| adh_6_1 closeKind selection | **A** | C | — | — | I |
| adh_6_2 Lessons Learned | **A** | C | C | — | I |
| adh_6_3 Transition note | **A** | — | — | — | I |
| adh_6_4 CLOSE ritual | **A** | R | — | — | I |
| adh_6_5 Sponsor notification | **A** | — | — | — | **A** (receives) |
| adh_6_6 Portfolio review | C | **A** | — | — | — |

Legend: A = Accountable, R = Responsible (supporting), C = Consulted, I = Informed. "—" = not involved.

### 3.C.2 Role-to-task responsibility matrix (PDCA)

| Task | Self | System |
|---|---|---|
| pdca_1 Type decision | **A** | — |
| pdca_2 Hypothesis | **A** | — |
| pdca_3 Baseline | **A** | — |
| pdca_4 Target | **A** | — |
| pdca_5 Experiment creation | — | **A** |
| pdca_6 First tick scheduling | — | **A** |
| pdca_7 Live the hypothesis | **A** | — |
| pdca_8 Tick start | R | **A** (guard) |
| pdca_9 Measurement | **A** | — |
| pdca_10 Reflection | **A** | — |
| pdca_11 Tick close | R | **A** (enforce artifact) |
| pdca_12 Counter update | — | **A** |
| pdca_13 ACT decision | **A** | — |
| pdca_14 Iterate | — | **A** |
| pdca_15 Graduate | R | **A** (guard counter ≥ 3) |
| pdca_16 Abandon | **A** | R |
| pdca_17 Promote | **A** | R |
| pdca_18 Learning summary | **A** | — |

### 3.D Task effort rollup

**AD_HOC total effort estimate** (low / median / high across 30 tasks):

| Phase | Low effort (h) | Median (h) | High (h) |
|---|---|---|---|
| 1. Spark | 1.15 | 1.75 | 2.5 |
| 2. Baseline | 4.2 | 6.5 | 10.5 |
| 3. Proposed Actions | 1.55 | 2.5 | 4.0 |
| 4. Execute | 3 + (N_actions × 2) | 5 + (N_actions × 4) | 8 + (N_actions × 6) |
| 5. Remeasure | 2.75 | 4.5 | 7.5 |
| 6. Close | 1.7 | 2.5 | 4.0 |
| **Total (5 actions)** | **~24 h** | **~42 h** | **~68 h** |
| **Total (3 actions)** | **~16 h** | **~30 h** | **~52 h** |

At median with 3 actions (typical AD_HOC shape): ~30 person-hours over ~3 weeks.

**PDCA total effort estimate**:

| Tick count | Effort (h) |
|---|---|
| 3 ticks (fastest graduation) | 6 h + intake 0.5 h + close 0.5 h = **7 h** |
| 5 ticks (typical graduation after 2 misses) | 10 h + 1 h = **11 h** |
| 7 ticks (graduation after pattern refinement) | 14 h + 1 h = **15 h** |
| 10 ticks (cap; mandatory review) | 20 h + 1 h = **21 h** |

PDCA experiment cost is almost entirely inside the #12 tick's 2h CI block. Intake (pdca_1 through pdca_5) is ~30 min total; learning summary (pdca_18) is another ~20 min.

---

## Part 4 — Artifact Specification Library

Every artifact in this library follows the template used in the three formal standards: name, purpose, why-it-matters, owner, phase created, inputs, required sections, acceptance criteria, downstream uses, failure modes, template guidance.

### 4.A AD_HOC Artifacts

Eight artifacts. Designed minimal; every artifact has a reason to exist (none are ceremonial). Artifacts A01–A08 correspond to AD_HOC's 6 operational phases.

#### A01 — Problem Note

- **Name.** Problem Note.
- **Purpose.** Capture the pain in one paragraph so the team agrees what they are improving.
- **Why it matters.** AD_HOC skips formal charters; without A01 there is no written record of what prompted the project.
- **Owner.** Process Owner.
- **Phase created.** Spark (Phase 1).
- **Inputs.** Friction signal, KPI dip, Sponsor conversation, Weekly Reflection cluster.
- **Required sections.**
  1. Pain in one sentence.
  2. Impact (at least one quantified number).
  3. Suspected cause (optional; 1 sentence).
  4. Declared close-date commitment.
- **Acceptance criteria.** Pain stated; impact quantified; close date declared.
- **Downstream uses.** Input to Scope Boundary Statement (A02); referenced in Lessons Learned (A07).
- **Failure modes.** Pain stated as solution ("we need a new system") — reject; rewrite as a pain ("the current system takes 4x our target"). Impact stated as "big" — reject; quantify. No close date — reject; pick a date within 30 days.
- **Template guidance.** 5–10 sentences total. If it runs longer than half a page, the user is writing an Accelerator charter and should switch project types.

#### A02 — Scope Boundary Statement

- **Name.** Scope Boundary Statement.
- **Purpose.** Lock the start event, end event, and out-of-scope items.
- **Why it matters.** Scope rotation is the #1 cause of AD_HOC scope creep; a boundary statement kills it early.
- **Owner.** Process Owner.
- **Phase created.** Spark (Phase 1).
- **Inputs.** A01.
- **Required sections.**
  1. Start event (what triggers the process).
  2. End event (observable completion).
  3. Systems of record (optional).
  4. 3–5 explicit out-of-scope items.
- **Acceptance criteria.** Start event + end event named; ≥3 out-of-scope items named.
- **Downstream uses.** Reference for scope-change decisions during Execute; referenced in A07.
- **Failure modes.** Out-of-scope list empty — reject; nobody will admit what's excluded without prompting. Start event too broad ("any time the team notices a problem") — reject; pick a single observable event.
- **Template guidance.** One table, one paragraph max.

#### A03 — Baseline Dataset

- **Name.** Baseline Dataset.
- **Purpose.** The locked current-state measurement; what the remeasurement will be compared against.
- **Why it matters.** HARD RULE enforcement requires same-metric-definition comparison; A03 is the reference.
- **Owner.** Process Owner.
- **Phase created.** Baseline (Phase 2).
- **Inputs.** Primary metric name, operational definition, data source or observation plan.
- **Required sections.**
  1. Metric name + unit.
  2. Operational definition (measurable, repeatable).
  3. Sample frame (time window, population).
  4. Exclusion rules.
  5. Sample size.
  6. Raw data (attached or linked).
  7. Summary stats (mean, median, p90, count, direction).
  8. Facilitator attestation (or self-attestation if 1-person).
- **Acceptance criteria.** All 8 sections filled; `BaselineMetric.locked=true` after capture.
- **Downstream uses.** Remeasurement Dataset (A05) uses the same op-def; Validated Kaizen Close Record (A06) cites the baseline.
- **Failure modes.** Op-def ambiguous — reject at lock. Sample too small — flag and either expand or accept with note. Exclusion rules missing — reject.
- **Template guidance.** 1-page template with numbered sections; attached data lives alongside.

#### A04 — Action List

- **Name.** Action List.
- **Purpose.** Name the 3–7 countermeasures, their owners, their due dates.
- **Why it matters.** Action theater (actions without owners) is the #1 cause of improvement theater.
- **Owner.** Process Owner.
- **Phase created.** Proposed Actions (Phase 3).
- **Inputs.** Candidate countermeasure list, roster.
- **Required sections.**
  1. Action # and name.
  2. Description (1–2 sentences).
  3. Owner (`ownerRef`).
  4. Due date (≤ `targetCloseDate`).
  5. Impact × Ease score (low / medium / high, optional).
  6. Evidence-of-done requirement.
- **Acceptance criteria.** 3–7 actions; each has owner AND due date AND evidence requirement. Engine-enforced on `Kaizen.actions[]` at ACTIVE transition.
- **Downstream uses.** Daily composer uses for Deep-block selection; A06 cites completion ratio.
- **Failure modes.** More than 7 actions — reject; you are writing an Accelerator implementation backlog, switch types. No owner — reject. Due date after target close — reject or extend close date.
- **Template guidance.** Table; one row per action.

#### A05 — Remeasurement Dataset

- **Name.** Remeasurement Dataset.
- **Purpose.** The post-change measurement; the right side of the HARD RULE comparison.
- **Why it matters.** Without A05, the Kaizen cannot CLOSE; the HARD RULE rejects.
- **Owner.** Process Owner.
- **Phase created.** Remeasure (Phase 5).
- **Inputs.** Operational definition from A03 (identical), post-change data or observations.
- **Required sections.**
  1. Metric name + unit (identical to A03).
  2. Operational definition (identical to A03).
  3. Sample frame (post-change window).
  4. Exclusion rules (identical to A03).
  5. Sample size.
  6. Raw data (attached).
  7. Summary stats (same as A03).
  8. Delta vs baseline (computed).
  9. Facilitator attestation.
- **Acceptance criteria.** All sections filled; op-def exact match with A03; delta computed.
- **Downstream uses.** A06 cites it; CLOSE guard checks it.
- **Failure modes.** Op-def drift from A03 — reject at capture. Sample frame overlap with baseline — reject; no post-change sample.
- **Template guidance.** Same template as A03 with a "delta" section appended.

#### A06 — Validated Kaizen Close Record

- **Name.** Validated Kaizen Close Record.
- **Purpose.** The canonical close document: baseline, remeasurement, delta, `closeKind`, signed.
- **Why it matters.** Future auditors and portfolio rollups read this.
- **Owner.** Process Owner.
- **Phase created.** Close (Phase 6).
- **Inputs.** A03, A05, goal statement, action evidence.
- **Required sections.**
  1. Problem statement (copied from A01).
  2. Scope (copied from A02).
  3. Baseline value + op-def (from A03).
  4. Goal value + direction.
  5. Remeasurement value (from A05).
  6. Delta (computed).
  7. `closeKind` selected (SUCCESS / PARTIAL / FAILED_HONEST) with 1-sentence justification.
  8. Action list completion ratio.
  9. Process Owner sign-off.
- **Acceptance criteria.** All sections filled; `closeKind` matches Part 7.A rules; Process Owner signed.
- **Downstream uses.** Portfolio reporting; Lessons Learned references.
- **Failure modes.** `closeKind` mismatched with delta — reject; rule-check. Sign-off missing — reject.
- **Template guidance.** 1-page PDF-equivalent.

#### A07 — Lessons Learned

- **Name.** Lessons Learned (one-pager).
- **Purpose.** Capture what worked, what didn't, what would be done differently — reusable across future AD_HOCs and formal projects.
- **Why it matters.** Learning without capture is a training expense with no ROI.
- **Owner.** Process Owner.
- **Phase created.** Close (Phase 6).
- **Inputs.** Action reflections, close record, tick / check-in notes.
- **Required sections.**
  1. What changed (1 paragraph).
  2. What worked (2–3 bullets).
  3. What didn't work (2–3 bullets).
  4. What would we do differently (2–3 bullets).
  5. Reusability notes: is this pattern applicable elsewhere? If yes, where?
- **Acceptance criteria.** All 5 sections filled with non-trivial content. CLOSE guard rejects missing artifact.
- **Downstream uses.** Portfolio knowledge base; future intake of similar AD_HOCs.
- **Failure modes.** "It worked." — reject; section 2 must have 2+ bullets with specifics.
- **Template guidance.** 1 page. Strict.

#### A08 — Process Owner Transition Note (optional)

- **Name.** Process Owner Transition Note.
- **Purpose.** Hand off the after-state to an ongoing owner if different from the project owner.
- **Why it matters.** Prevents regression when the Kaizen closer is not the ongoing process owner.
- **Owner.** Process Owner.
- **Phase created.** Close (Phase 6).
- **Inputs.** Action outcomes, roles.
- **Required sections.**
  1. Ongoing owner name.
  2. Monitoring metric (optional; if the owner will watch anything).
  3. Next review date.
  4. What to do if regression observed.
- **Acceptance criteria.** Owner + review date named. Skip this artifact if the Kaizen's Process Owner is the ongoing owner AND no handoff is happening.
- **Downstream uses.** Ongoing-owner dashboard entry (if team mode exists in Next).
- **Failure modes.** Ongoing owner unnamed — reject or skip artifact.
- **Template guidance.** Half page.

### 4.B PDCA Artifacts

Five artifacts. Minimal by design; the experiment is the work, not the documentation.

#### A09 — PDCA Experiment Charter

- **Name.** PDCA Experiment Charter.
- **Purpose.** Capture the hypothesis, target metric, baseline, target condition at open.
- **Why it matters.** Without a charter, the experiment is a notebook entry with no structure.
- **Owner.** Self (the practitioner).
- **Phase created.** PLAN (initial open).
- **Inputs.** Friction signal, self-observation.
- **Required sections.**
  1. Hypothesis (per Part 5.B template: "If X then Y by Z").
  2. Target metric name + unit.
  3. Measurement method (how to capture current condition).
  4. Current condition baseline value.
  5. Target condition value + direction.
  6. Graduation criterion (default: 3 consecutive target-met ticks).
  7. Target tick count cap (default: 10).
- **Acceptance criteria.** All 7 sections filled; hypothesis is falsifiable; target ≠ baseline with declared delta.
- **Downstream uses.** Every tick references; CLOSED learning summary cites.
- **Failure modes.** Hypothesis is "I want to be better" — reject; rewrite per template. Target = baseline — reject.
- **Template guidance.** Single screen; intake modal in UI; no PDF.

#### A10 — Tick Log

- **Name.** Tick Log.
- **Purpose.** Running record of every tick's measurement + reflection.
- **Why it matters.** The Tick Log is what becomes the learning summary; without it, trends are invisible.
- **Owner.** Self.
- **Phase created.** Populated incrementally during DO/CHECK/ACT; first entry on first tick close.
- **Inputs.** Per-tick measurement + reflection.
- **Required sections (per entry).**
  1. Tick # (1, 2, 3…).
  2. Timestamp.
  3. Measurement value.
  4. Target hit? (y/n).
  5. `consecutiveTargetHits` after this tick.
  6. What went well.
  7. What to improve.
  8. ACT decision (iterate / graduate / abandon / promote).
- **Acceptance criteria.** One row per tick; all 8 fields filled per row. Engine-enforced on tick close.
- **Downstream uses.** Learning Summary (A11); Reflection agent trend detection.
- **Failure modes.** Measurement field "about 5" — reject at close; numeric required. "What went well" blank — allow but Reflection agent flags pattern over 3+ ticks.
- **Template guidance.** Table view in UI; one row per tick.

#### A11 — Learning Summary

- **Name.** Learning Summary (one-pager).
- **Purpose.** Capture the experiment's outcome and the lesson.
- **Why it matters.** Without a summary, experiments close but their learning is lost.
- **Owner.** Self.
- **Phase created.** CLOSED (post-close, within 24h of experiment close).
- **Inputs.** Charter (A09), Tick Log (A10), close reason.
- **Required sections.**
  1. Hypothesis (copied from A09).
  2. Outcome: graduated / abandoned / promoted, with reason.
  3. Measurement pattern across ticks (table or chart sketch).
  4. Learning (1–2 sentences).
  5. What's next (if anything).
- **Acceptance criteria.** All 5 sections filled.
- **Downstream uses.** Personal learning log; feeds Kaizen charter if promoted.
- **Failure modes.** "It worked." — reject; section 4 must have a specific learning.
- **Template guidance.** Half page.

#### A12 — Graduation Record (implicit, embedded in A11)

- **Name.** Graduation Record.
- **Purpose.** Attest that `consecutiveTargetHits >= 3` at close.
- **Why it matters.** Counter attestation is the graduation criterion.
- **Owner.** Self (auto-attested by the engine).
- **Phase created.** At CLOSED-GRADUATED.
- **Inputs.** Tick Log counter history.
- **Required sections.**
  1. Tick # at which counter reached 3.
  2. Measurement values of the three graduating ticks.
  3. Final measurement.
- **Acceptance criteria.** Counter ≥ 3 at close (engine-enforced).
- **Downstream uses.** Embedded in A11.
- **Failure modes.** Counter reset mid-experiment but user declares graduation — engine rejects.
- **Template guidance.** Embedded section in A11; no standalone document.

#### A13 — Promotion-to-Kaizen Memo (optional)

- **Name.** Promotion-to-Kaizen Memo.
- **Purpose.** Hand the PDCA's evidence to a Kaizen that supersedes it.
- **Why it matters.** Without the handoff, the promoted Kaizen starts from zero and the PDCA evidence is wasted.
- **Owner.** Self.
- **Phase created.** At SUPERSEDED_BY_KAIZEN close.
- **Inputs.** A09, A10, target Kaizen type.
- **Required sections.**
  1. PDCA hypothesis + outcome pattern.
  2. Evidence: tick log summary (last 5 ticks' measurements).
  3. Proposed Kaizen scope (same or expanded?).
  4. Proposed Kaizen type (AD_HOC / Accelerator / Kaizen 90 / DMAIC — per §1.A.3).
  5. Why PDCA wasn't enough (1 sentence).
- **Acceptance criteria.** All 5 sections filled; referenced by the new Kaizen's `sourceFrictionSignalIds` or equivalent lineage field.
- **Downstream uses.** New Kaizen's intake artifacts (A01, A02 for AD_HOC; charter for formal).
- **Failure modes.** "Scope unclear" in section 3 — reject; promotion without clear scope is a new PDCA, not a Kaizen.
- **Template guidance.** Half page.

---

### 4.C Artifact lineage and cross-reference

```
AD_HOC artifact lineage:
A01 Problem Note  ─────┐
                       ├──► A02 Scope Boundary ──┐
                                                 ├──► A03 Baseline Dataset ──┐
                                                 │                           │
                                                 └──► A04 Action List ───────┤
                                                                             ├──► A05 Remeasurement Dataset
                                                                             │
                                                                             └──► A06 Validated Close Record ──► A07 Lessons Learned
                                                                                                              │
                                                                                                              └──► A08 Transition Note (opt.)

PDCA artifact lineage:
A09 Experiment Charter ──► A10 Tick Log (incremental per tick) ──► A11 Learning Summary
                                                                │         │
                                                                │         └──► A12 Graduation Record (embedded)
                                                                │
                                                                └──► A13 Promotion Memo (optional; at SUPERSEDED_BY_KAIZEN)
```

Downstream-use cross-reference:

- A07 Lessons Learned feeds portfolio-level Learning Registry (Part 10.2).
- A11 Learning Summary feeds personal Learning Log.
- A13 Promotion Memo feeds the new Kaizen's Problem Note (A01) when the target is AD_HOC.

### 4.C.1 Artifact acceptance matrix

| Artifact | Created in phase | Required at gate | Enforced by | Rejection condition |
|---|---|---|---|---|
| A01 Problem Note | Spark | DRAFT → ACTIVE | Intake wizard | Missing numeric impact or close date |
| A02 Scope Boundary | Spark | DRAFT → ACTIVE | Intake wizard | Missing out-of-scope items |
| A03 Baseline Dataset | Baseline | Baseline lock | Engine + Facilitator | Op-def ambiguous; sample too small |
| A04 Action List | Proposed Actions | DRAFT → ACTIVE | Engine (ownerRef + dueDate) | Any action missing owner/date |
| A05 Remeasurement Dataset | Remeasure | IN_REMEASUREMENT → CLOSED | Engine + Facilitator | Op-def mismatch with A03 |
| A06 Validated Close Record | Close | IN_REMEASUREMENT → CLOSED | Engine + PO sign | closeKind doesn't match delta |
| A07 Lessons Learned | Close | IN_REMEASUREMENT → CLOSED | Engine (close guard) | Missing any of 5 sections |
| A08 Transition Note | Close | Optional | Process-level | — |
| A09 Experiment Charter | PLAN (open) | PdcaExperiment creation | Intake validator | Hypothesis not falsifiable |
| A10 Tick Log | DO (incremental) | Tick close | Engine (NUMERIC artifact) | Missing measurement |
| A11 Learning Summary | CLOSED | Within 24h of close | Process-level + agent nudge | Missing learning statement |
| A12 Graduation Record | GRADUATED close | Embedded in A11 | Engine (counter ≥ 3) | Counter < 3 |
| A13 Promotion Memo | SUPERSEDED_BY_KAIZEN | At close | Process-level | Target Kaizen type unclear |

### 4.D What this standard deliberately excludes

The following artifacts are present in formal-type standards but are **deliberately absent** here. If the project needs them, the type is wrong.

| Absent artifact | Why | What type covers it |
|---|---|---|
| SIPOC | Formal mapping overhead for small scope | DMAIC, Accelerator, Kaizen 90 |
| MSA Report | Measurement-system analysis requires statistical rigor out of scope | DMAIC |
| Capability Report (Cpk) | Spec-limit analysis | DMAIC |
| Control Chart | Ongoing monitoring requires Process Owner ceremony | DMAIC, Kaizen 90 |
| FMEA | Failure-mode enumeration | DMAIC |
| Financial Benefit Translator | Finance ROI sign-off not required for AD_HOC / PDCA | Accelerator, Kaizen 90, DMAIC |
| Control Plan | Ongoing governance document | Accelerator, Kaizen 90, DMAIC |
| Sustainment Gate attestation | Cross-functional adoption tracking | Kaizen 90 |
| 3-Pager Results Narrative | Executive readout document | Kaizen 90, DMAIC |
| Process Owner Transition (full version) | Formal handoff document | Kaizen 90 (has lightweight A08 equivalent here) |

If a facilitator is drafting any of the above for an AD_HOC, that is a signal the type is wrong. Convert to the correct type or narrow scope.

---

## Part 5 — Problem Statement Framework

### 5.A AD_HOC Problem Statements

AD_HOC problem statements are lighter than Accelerator / DMAIC / Kaizen 90 charters but must still carry six specific elements. Missing any element is a reject.

#### 5.A.1 Required elements

1. **Current-state statement (one sentence).** What is happening today, stated as a pain, not a solution.
2. **Impact with quantification (at least one number).** "Affects us" is not quantification. "Takes 3.2 days on average" is.
3. **Scope boundary (what's in / out).** Start event + end event + ≥3 out-of-scope items.
4. **Baseline metric + current value.** The metric you will remeasure. The current value (even if approximate at intake; locked value in A03).
5. **Target condition + target value.** Where you want the metric to land. Declared direction.
6. **Timeframe (typical 1–4 weeks).** The `targetCloseDate`.

#### 5.A.2 Good examples

**Good example 1 — Process.**
"Our invoice-exception handling cycle time is 4.2 business days on average (baseline n=20, last 30 days), against a target of 2 days. Scope starts at invoice-exception flagged by AP; ends at exception resolved and invoice posted. Out-of-scope: invoices with genuine vendor disputes (escalated to Legal), invoices with missing POs (handled by Procurement), duplicate-invoice exceptions (handled by AP daily audit). Target: bring cycle time to ≤ 2 days by 2026-05-10."

**Good example 2 — Personal productivity adjacent-to-process.**
"Our team's code-review turnaround on PR requests is 38 business hours median (baseline n=15, last 2 weeks), against a target of 8 business hours. Scope starts at PR opened; ends at PR approved or rejected. Out-of-scope: drafts, WIP PRs, PRs marked 'no review needed'. Target: 8-hour median by 2026-05-03."

**Good example 3 — Team operating rhythm.**
"Our Monday morning standup over-runs to 42 minutes on average (baseline n=8 standups, last 2 weeks), against a target of 15 minutes. Scope starts at standup begin; ends at standup close. Out-of-scope: follow-up 1:1s after standup, sidebars with the Sponsor. Target: 15-minute cap by 2026-04-30."

#### 5.A.3 Bad examples

**Bad example 1 — No quantification.**
"Our invoice process takes too long. We need to fix it soon." *Reject.* No number; no timeframe; no scope.

**Bad example 2 — Solution-as-problem.**
"We need a new ticketing tool to reduce invoice cycle time." *Reject.* "Tool choice" is a solution. The problem is cycle time. State the problem; propose solutions in A04.

**Bad example 3 — Scope infinity.**
"Our order-to-cash process is broken across 5 departments and we want to fix it end-to-end in 3 weeks." *Reject.* Cross-functional scope → Kaizen 90 or DMAIC, not AD_HOC. Or narrow the scope to a single function.

#### 5.A.4 Common errors

1. **Solution posing as problem.** "We need X tool" / "We need a new policy." Strip the solution; state the pain.
2. **Impact not quantified.** "A lot" / "significant." Pick a number — even approximate is better than none.
3. **Scope missing out-of-scope.** Without out-of-scope, scope rotation is inevitable.
4. **Baseline value missing.** "Will measure later" — no. Capture an initial value at intake; lock in A03.
5. **Target value missing.** "Better than today" — no. Declare a number.
6. **Timeframe open-ended.** "ASAP" — no. Pick a close date within 30 days.
7. **Multiple problems in one statement.** Split into multiple AD_HOCs or pick one.
8. **Problem owned by nobody.** If no Process Owner will own it, do not open the project.

#### 5.A.5 Reusable template

```
Current state: [what happens today; 1 sentence; describe pain, not solution]

Impact: [at least one number; e.g., "takes 4.2 business days"]

Scope:
  Start event: [observable triggering event]
  End event: [observable completion event]
  Out-of-scope:
    - [item 1]
    - [item 2]
    - [item 3]

Baseline metric: [name + unit + direction]
Current value: [number; approximate at intake]

Target condition: [number + direction]

Timeframe: [close by YYYY-MM-DD; within 30 days]

Process Owner: [name]
Facilitator: [name, or self-attested]
Sponsor: [optional; name if applicable]
```

### 5.B PDCA Hypothesis Statements

PDCA hypothesis statements are the central artifact of the experiment. They are narrower than AD_HOC problem statements because the scope is one person and one measurable variable.

#### 5.B.1 Required elements

1. **Falsifiable "if / then" structure.** "If we change [X] in [Y] way, [Z] metric should improve by [amount] within [cycles]."
2. **Measurable target condition.** Numeric; declared direction.
3. **48h tick cadence commitment.** The user commits to a tick every 48 hours.
4. **Graduation criterion.** Default is 3 consecutive target hits. Can be stricter.
5. **Measurement method.** How the current condition will be captured at each tick.

#### 5.B.2 Good examples

**Good example 1.**
"If I shift my focus block from 9am to 7am for 2 weeks, my morning Deep minutes should increase from 45 to 90+ per day. I will measure daily Deep minutes via the BAM composer reflection. Graduation: 3 consecutive ticks at ≥90 daily Deep minutes. Cadence: 48h ticks."

**Good example 2.**
"If I batch Slack check-ins to 3 windows per day (10am, 1pm, 4pm) for 2 weeks, my daily Slack context-switch count should drop from ~35 to ≤12. I will measure by counting Slack notification-clicks in the phone's log each day. Graduation: 3 consecutive ticks at ≤12. Cadence: 48h ticks."

**Good example 3.**
"If I put my 1:1s in Thu morning (not Wed afternoon) for 2 weeks, my Wed-afternoon self-rated energy should improve from 3/5 to ≥4/5. I will self-rate at 5pm Wed using a standard 1–5 scale. Graduation: 3 consecutive Wed measurements at ≥4. Cadence: 48h ticks (Wed + Fri + Mon + Wed…)."

#### 5.B.3 Bad examples

**Bad example 1 — Non-falsifiable.**
"I want to be more focused." *Reject.* No if-then, no metric, no target.

**Bad example 2 — Target = baseline.**
"If I work from home on Mondays, my Deep minutes should stay around 90/day." *Reject.* Target equals baseline.

**Bad example 3 — Unmeasurable.**
"If I journal in the morning, I should feel better during the day." *Reject.* "Feel better" is not measurable without a declared scale.

#### 5.B.4 Common errors

1. **Hypothesis is an aspiration, not an experiment.** "I want to exercise more" — no X, no Y, no delta.
2. **Measurement method undefined.** "I'll know" — no. Name the method.
3. **Cycle count not committed.** "Try it for a while" — no. Commit to a 48h cadence and a cap.
4. **Target too soft.** "A bit better" — no. Declare a number.
5. **Multiple variables at once.** "Change A and B and C and see what happens" — no. One variable; the other two are confounds.

#### 5.B.5 Reusable template

```
Hypothesis: If I [change X] by [method M] for [duration],
            then [metric Y] should [go from V₀ to V₁] within [N cycles].

Measurement method: [how I will capture Y at each tick]

Baseline (V₀): [number; measured now]
Target (V₁): [number; must beat V₀ by declared delta]
Direction: [higher-is-better | lower-is-better]

Cadence: 48h ticks (every other day)
Graduation: [N]=3 consecutive target-met ticks (default)
Cap: [tick 10] (mandatory review)

Closed cases handled:
  - Graduated (3 consecutive hits)
  - Abandoned (reason captured)
  - Promoted (SUPERSEDED_BY_KAIZEN)
```

---

### 5.C Intake wizard behavior

The intake wizard (present in E7 Kaizen Lifecycle for `KaizenPromoted` and in a PDCA-specific modal for `PdcaExperimentOpened`) applies these validators.

**AD_HOC intake validators:**

1. Problem Note must have at least one numeric impact. Regex-detectable ("at least one digit in the impact field").
2. Scope Boundary must have at least 3 out-of-scope items.
3. Target close date must be within 30 days of `startDate`.
4. Primary metric must be declared at intake (even if baseline value is provisional).
5. Target condition must beat baseline value by a declared delta (> 0 in the declared direction).
6. If type decision (§1.A.3) was not explicitly confirmed, prompt: "Confirm this is AD_HOC, not [alternative]?"

**PDCA intake validators:**

1. Hypothesis must match "If…then…" regex pattern (or similar falsifiable structure).
2. Target condition must not equal baseline value.
3. Target must declare direction ("higher is better" | "lower is better").
4. Measurement method must be ≥ 20 characters (not "I'll know").
5. No other open PdcaExperiment for this user (MVP cap).
6. If scope in the hypothesis touches other people ("my team's", "our process"), prompt: "This might be AD_HOC scope — confirm PDCA?"

### 5.D Anti-example catalog

Common intake patterns that must be rejected, annotated:

**AD_HOC anti-example 1: "We need to be faster."**
*Reject.* Missing: impact number, scope, baseline, target, timeframe.
*Rewrite prompt:* "Faster at what? By how much? Over what timeframe?"

**AD_HOC anti-example 2: "Our CSAT is dropping."**
*Reject.* Missing: quantification, scope, target.
*Rewrite prompt:* "What's the current CSAT score? What's the target? What scope (which product / region / segment)?"

**AD_HOC anti-example 3: "Migrate our ticketing system from Jira to Linear in 3 weeks."**
*Reject.* This is a project, not a Kaizen. No baseline / remeasurement metric. Use a standard project, not AD_HOC.

**PDCA anti-example 1: "Try waking up earlier."**
*Reject.* No hypothesis structure. No measurable metric. No target.
*Rewrite prompt:* "If I wake up at [time] for [duration], then [measurable Y] should [change by X] within [N cycles]."

**PDCA anti-example 2: "If I meditate every morning, my stress will decrease."**
*Conditionally reject.* "Stress" is not measurable without a declared scale.
*Rewrite prompt:* "Define the scale (e.g., self-rated 1–5 at noon daily) and declare baseline + target values."

**PDCA anti-example 3: "See if I can close more tickets per day by taking shorter lunches."**
*Reject at scope check.* Tickets/day is a team metric; you may affect it personally but your ticket close rate depends on ticket-arrival rate and complexity (confounds). Consider a PDCA on personal focus minutes during the lunch window instead.

---

## Part 6 — Capacity Model and BAM Scheduling

### 6.A AD_HOC Capacity

#### 6.A.1 Roster (1–3 people typical)

| Role | Required? | Time commitment | Notes |
|---|---|---|---|
| Process Owner | Yes | 3–8 h/week during ACTIVE | Runs daily; owns sustainment after close |
| Facilitator / Lead | Optional (required for ≥2-person AD_HOCs with a non-self Process Owner) | 1–2 h/week during ACTIVE; 1 h at close | Can be same person as Process Owner for 1-person AD_HOCs |
| SME | Optional | 2–4 h total during Proposed Actions + Execute | Pulled in for specific countermeasures |
| Sponsor | Optional | 1 h total for approval + close acknowledgement | Skip for 1-person AD_HOCs with no org impact |

Typical total effort: **8–40 person-hours** across a 9–30 working-day envelope.

#### 6.A.2 BAM scheduling pattern

AD_HOCs primarily use:

- **PROJECT (Deep) blocks** filled with `Deep Work — Project Task (generic)` catalog rows, with `linkedKaizenId` pointing to the AD_HOC Kaizen. Typical: 3–10 blocks per week during Execute phase (Phase 4).
- **CI blocks** for baseline / remeasurement captures, weekly check-ins, close ritual. Typical: 1 block per week during Execute; 1–2 during Baseline and Remeasure.
- **COMMUNICATION blocks** for Sponsor conversations (if Sponsor exists) and owner assignment conversations.

No phase-binding filter fires on the composer for AD_HOC (because `phaseBinding` is null for the generic Deep Work catalog row). Composer selects the generic row whenever the user's active Kaizen is AD_HOC and a PROJECT block has capacity.

#### 6.A.3 Example Week (AD_HOC, mid-Execute week)

```
Mon 08:00  PROJECT (Deep) block — 120 min    linkedKaizenId=<adh_id>  (action 1 work)
Mon 10:30  COMMUNICATION — 60 min            AM high-value comms (daily non-optional)
Mon 13:00  COMMUNICATION — 30 min            Post-lunch high-value comms (daily non-optional)
Mon 15:00  CI — 30 min                       L&D or 6S Email
Mon 17:00  CI — 15 min                       End-of-Activity Reflection

Tue 09:00  PROJECT (Deep) block — 120 min    linkedKaizenId=<adh_id>  (action 2 work)
Tue 10:30  COMMUNICATION — 60 min
Tue 13:00  COMMUNICATION — 30 min
Tue 15:00  CI — 30 min                       (rotate)

Wed 09:00  PROJECT (Deep) block — 90 min     linkedKaizenId=<adh_id>  (action 3 work)
Wed 11:00  COMMUNICATION — 60 min            1:1 with action-2 owner (check status)
Wed 13:00  COMMUNICATION — 30 min
Wed 15:00  CI — 30 min

Thu 09:00  PROJECT (Deep) block — 120 min    linkedKaizenId=<adh_id>  (action 1 follow-up)
Thu 10:30  COMMUNICATION — 60 min
Thu 13:00  COMMUNICATION — 30 min
Thu 15:00  CI — 30 min

Fri 09:00  PROJECT (Deep) block — 90 min     linkedKaizenId=<adh_id>  (blocker resolution)
Fri 10:30  COMMUNICATION — 60 min
Fri 13:00  COMMUNICATION — 30 min
Fri 15:00  CI — 20 min                       AD_HOC weekly check-in (adh_4_3)
Fri 15:30  CI — 20 min                       Weekly Reflection
```

Total AD_HOC PROJECT allocation for this week: 6 × ~100 min = ~10 person-hours of Deep work on the Kaizen, plus 20 min of CI check-in. This matches the 3–8 h/week Process Owner allocation from the roster.

#### 6.A.4 Escalation triggers

- **Action overdue by 3 days.** Momentum agent nudges; Facilitator reviews at next weekly check-in.
- **`ProjectPaceWarning` fires at `targetCloseDate + 14 days`.** Facilitator reviews and either recommits or abandons / promotes.
- **Sponsor fires a scope-change request mid-Execute.** Abandon + open new AD_HOC for new scope OR promote current AD_HOC to Accelerator / Kaizen 90.

### 6.B PDCA Capacity

#### 6.B.1 Roster (1 person)

| Role | Required? | Time commitment | Notes |
|---|---|---|---|
| Self (practitioner) | Yes | 2h every 48h | The only role |

Typical total effort: **6–14 person-hours** across a 6–14 working-day envelope (3–7 ticks × 2h).

#### 6.B.2 BAM scheduling pattern

PDCA fits entirely inside the CI bucket:

- One 2-hour CI block every 48 hours, scheduled by the Daily composer's CI rotation (`pickCI()` priority 80, guarded by `hoursSinceLastPdca >= 42`).
- The 2h block includes: execution review (reviewing what happened during the 48h since last tick), measurement capture, reflection, next-tick planning.
- Reflection happens inside the tick block; no separate CI block required.

PDCA uses **zero PROJECT (Deep) blocks** and **zero COMMUNICATION blocks**. The Deep work (the experimental variant) happens during normal BAU — PDCA observes it, doesn't schedule it.

#### 6.B.3 Example week (PDCA, mid-experiment)

Three ticks per week (Mon + Wed + Fri is the canonical pattern):

```
Mon 15:00  CI — 120 min    PDCA tick #N     linkedPdcaExperimentId=<exp_id>
           Measurement for tick window Sat–Mon.
           Reflection. ACT decision → iterate.

Wed 15:00  CI — 120 min    PDCA tick #N+1
           Measurement for tick window Mon–Wed.
           Reflection. ACT decision → iterate.

Fri 15:00  CI — 120 min    PDCA tick #N+2
           Measurement for tick window Wed–Fri.
           Reflection. ACT decision:
             If consecutiveTargetHits hit 3 → graduate.
             Else → iterate.
```

Non-tick days: no PDCA-related scheduled activities. The user lives the experiment during BAU.

#### 6.B.4 Escalation triggers

- **Tick missed (>54h since last tick).** Momentum agent nudges; composer reschedules on next Daily composition.
- **`ProjectPaceWarning` at 14 days past last tick.** Reflection agent surfaces "abandon or tick?" in Weekly Reflection.
- **Tick 8 reached without graduation.** Reflection agent fires mandatory review: "has the hypothesis been adjusted? should it be?"
- **Tick 10 reached without graduation.** Reflection agent fires mandatory iteration review: "running a PDCA past 10 ticks is a smell; promote, abandon, or adjust?"

---

### 6.C Capacity anti-patterns

**AD_HOC capacity anti-pattern 1: Process Owner commits 2h/week but actions require 10h/week of owner time.** The actions will not ship. Either recruit owners with real capacity OR cut scope OR extend target close date (within 30-day cap).

**AD_HOC capacity anti-pattern 2: Facilitator is the Process Owner AND the SME AND the Sponsor.** Blind-spot risk. Mitigate by recruiting a peer reviewer (even informally) for at least the baseline and close rituals.

**AD_HOC capacity anti-pattern 3: Action owners have no `linkedKaizenId` Deep blocks scheduled.** Work won't happen in Deep time; it'll happen in the cracks and likely not at all. The composer must schedule Deep blocks for each action owner during Execute phase; facilitator confirms during weekly check-in.

**PDCA capacity anti-pattern 1: User tries to run 3 PDCAs at once.** MVP cap is one; the cap exists because parallel experiments dilute attention and confound measurements. If the user has 3 hypotheses, serialize them.

**PDCA capacity anti-pattern 2: Tick block is 30 minutes instead of 120.** The 2h block is deliberate — it includes measurement review, reflection, next-tick planning, and a buffer for learning. A 30-minute tick usually skips reflection; the experiment becomes a counting exercise. Catalog #12 defaults to 120 minutes for a reason.

**PDCA capacity anti-pattern 3: Tick cadence collapses under real-world scheduling.** User schedules ticks at 48h intervals but meetings bump them by 12–24h. Cadence drifts; experiment drags. Mitigate: protect the tick CI block as first-class; reschedule around it, not under it.

### 6.D Calendar-protection rules

For both types, the BAM scheduling protection rules apply:

- AD_HOC PROJECT blocks with `linkedKaizenId` are **protected** — composer will not schedule over them; invariant engine rejects edits that remove them without a Variance log.
- PDCA #12 ticks are **protected** — the orphan-tick protection plus `hoursSinceLastPdca ≥ 42` guard means missed ticks can be rescheduled but cannot be silently dropped.
- The user's capacity model (`dailyCapacityMinutes` + `externalMinutesToday`) applies uniformly; AD_HOC and PDCA blocks consume bucket time (PROJECT for AD_HOC, CI for PDCA) like any other block.

---

## Part 7 — Validation and Control Model

### 7.A AD_HOC Validation

#### 7.A.1 HARD RULE applies

`KaizenService.close()` for AD_HOC requires, per ARCHITECTURE §3.3:

1. `Kaizen.remeasurementId !== null`.
2. `remeasurement.metricDefinitionId === baseline.metricDefinitionId`.
3. `BaselineMetric.locked === true`.
4. `closeKind !== null`.
5. `lessonsLearnedArtifactRef !== null`.

No bypass. No soft close. No "we'll remeasure later." If the user wants to close without a remeasurement, the only legal path is abandonment (`Kaizen → DRAFT with abandoned=true`).

#### 7.A.2 Same-metric, same-method, same-rules

Remeasurement must use:

- **Same `metricDefinitionId`** — engine-enforced.
- **Same measurement method** — facilitator-attested; captured in A05.
- **Same sample frame size** — if baseline was n=20, remeasurement should be n≥20. Smaller is a flag.
- **Same exclusion rules** — every exclusion from A03 reapplied in A05.

Facilitator (or self, for 1-person AD_HOCs) attests these in the A05 capture.

#### 7.A.3 Sample-size minima for AD_HOC

| Metric type | Minimum baseline sample | Minimum remeasurement sample |
|---|---|---|
| Continuous cycle-time | n ≥ 10 (prefer ≥ 20; AD_HOC is lighter than DMAIC) | ≥ baseline n |
| Rate / proportion | n ≥ 30 observations | ≥ baseline n |
| Count (per window) | ≥ 3 complete windows | ≥ baseline |
| Subjective (1–5 scale) | n ≥ 5 ratings | ≥ baseline |

These are lighter than DMAIC (n ≥ 30 continuous, n ≥ 100 proportions) on purpose — AD_HOC is validated by direction of change more than statistical significance.

#### 7.A.4 `closeKind` selection rules

| Remeasurement vs target | `closeKind` | Notes |
|---|---|---|
| Met or beat target | `SUCCESS` | The happy path |
| Improved vs baseline but did not meet target | `PARTIAL` | Progress is real; target was ambitious or actions incomplete |
| No improvement or regression | `FAILED_HONEST` | First-class outcome; keeps the portfolio honest |

Each selection requires a 1-sentence justification on A06.

#### 7.A.5 Finance co-sign NOT required for AD_HOC

This is a deliberate differentiator from Accelerator / Kaizen 90 / DMAIC. AD_HOC is self-validated; there is no Finance-signed ROI. Sponsor acknowledgement at close is optional. The program-level consequence: AD_HOC's portfolio contribution is less auditable, which is appropriate given the project's smaller scope.

If your organization's portfolio policy requires Finance sign-off for every improvement with named $ benefit, then either (a) scope AD_HOC projects to not claim $ benefit, or (b) choose Accelerator instead of AD_HOC. Do not extend AD_HOC with Finance co-sign — that defeats the type's purpose.

### 7.B PDCA Validation

#### 7.B.1 Graduation criterion

`consecutiveTargetHits >= 3` at the close tick. Engine-enforced via `PdcaService.tick()` + `PdcaService.close()` guard (per ARCHITECTURE §2.13: "state === 'CLOSED' AND closedReason === 'GRADUATED' → consecutiveTargetHits >= 3 at close").

Stricter graduation criteria are allowed at charter (A09): user can declare `graduationCriterion=5` (5 consecutive hits) for higher-confidence experiments. Default remains 3.

#### 7.B.2 Measurement validity per tick

Each tick must close with:

1. `outputArtifactRef.schema === 'NUMERIC'`.
2. `outputArtifactRef.value !== null` and numeric.
3. Reflection captured (what-went-well / what-to-improve / ACT decision).
4. Measurement method matches charter (A09) — self-attested.

#### 7.B.3 Abandonment vs graduation semantic

Both are valid closes. The choice is honest:

- **Graduation** — target hit 3 times in a row; the hypothesis is validated; the practice can become habitual.
- **Abandonment** — the hypothesis does not hold, or the target is wrong, or the experiment has served its purpose as a learning even without hitting target.

Neither is better than the other for program-level learning. A PDCA that abandons with a captured reason and a learning summary is as valuable as a graduated one.

#### 7.B.4 Promotion-to-Kaizen path

When a PDCA discovers something bigger than PDCA can handle:

1. User invokes Promote action in the tick Reflection or Weekly Reflection.
2. System creates a new Kaizen (default type: AD_HOC; user can upgrade to Accelerator / Kaizen 90 / DMAIC if the scope warrants).
3. PDCA's baseline (`currentConditionBaseline`) becomes the Kaizen's baseline seed; Kaizen's Process Owner inherits the PDCA's measurement method.
4. PDCA closes with `closedReason='SUPERSEDED_BY_KAIZEN'`.
5. Promotion Memo (A13) authored.

The new Kaizen is **not** a continuation of the PDCA — it is its own project with its own lifecycle. PDCA's learning seeds it; that's all.

---

### 7.C Validation at project close — AD_HOC checklist

Before Kaizen can transition IN_REMEASUREMENT → CLOSED, the engine (and facilitator) verifies:

| # | Check | Source |
|---|---|---|
| 1 | `Kaizen.remeasurementId !== null` | ARCHITECTURE §3.3 HARD RULE |
| 2 | `remeasurement.metricDefinitionId === baseline.metricDefinitionId` | HARD RULE |
| 3 | `BaselineMetric.locked === true` | ARCHITECTURE §2.10 |
| 4 | `Kaizen.goalStatement !== null` | AD_HOC intake validator |
| 5 | `Kaizen.closeKind ∈ {SUCCESS, PARTIAL, FAILED_HONEST}` | Kaizen FSM CLOSED guard |
| 6 | Lessons Learned artifact captured (A07) | Part 4 |
| 7 | Sample size ≥ baseline sample size (A05) | Part 7.A.3 |
| 8 | Op-def match between A03 and A05 | Facilitator attestation |

Facilitator (or self-attestation) signs off on checks 6–8; engine enforces 1–5.

### 7.D Validation at project close — PDCA checklist

Before `PdcaExperiment → CLOSED` the engine verifies, per close reason:

**GRADUATED:**
| # | Check | Source |
|---|---|---|
| 1 | `consecutiveTargetHits >= 3` | ARCHITECTURE §2.13 |
| 2 | Last 3 ticks have `outputArtifactRef.schema === 'NUMERIC'` with values ≥ target (or ≤ target, per direction) | ENGINE §4.1 |
| 3 | Learning Summary (A11) present | Part 4 |

**ABANDONED:**
| # | Check | Source |
|---|---|---|
| 1 | `closedReason === 'ABANDONED'` with non-null reason string | ARCHITECTURE §2.13 |
| 2 | At least 1 tick recorded (an experiment with 0 ticks is deleted, not abandoned) | Implementation rule |
| 3 | Learning Summary (A11) present | Part 4 |

**SUPERSEDED_BY_KAIZEN:**
| # | Check | Source |
|---|---|---|
| 1 | `closedReason === 'SUPERSEDED_BY_KAIZEN'` | ARCHITECTURE §2.13 |
| 2 | A new `Kaizen` row exists with `sourcePdcaExperimentId === this experiment's id` | Lineage field (Part 10.3 flag) |
| 3 | Promotion Memo (A13) authored | Part 4 |

### 7.E Validation anti-patterns

**AD_HOC validation anti-pattern 1: Baseline op-def has ambiguity that surfaces only at remeasurement.** "Cycle time" is unambiguous at baseline because there's only one interpretation in play; at remeasurement a different interpretation emerges ("business hours" vs "elapsed hours") and the comparison breaks. Mitigation: op-def authoring (adh_2_2) explicitly enumerates alternative interpretations and picks one; facilitator peer-reviews.

**AD_HOC validation anti-pattern 2: Sample-frame contamination.** Baseline and remeasurement overlap in time (e.g., both include items in the exact last week of baseline period). Mitigation: remeasurement sample frame starts at least 1 day after the last baseline observation.

**PDCA validation anti-pattern 1: Measurement drift.** First 3 ticks use one method; tick 4 uses a slightly different method because "the original was tedious." Experiment is invalidated because the trend is measurement artifact. Mitigation: Charter (A09) names the method; any change is a new experiment.

**PDCA validation anti-pattern 2: Target recalibration mid-experiment.** User hit target 2x, then adjusts target lower because "actually the original was too aggressive." Graduation on the adjusted target is fake. Mitigation: target is frozen in Charter; adjusting target requires closing and re-opening a new experiment.

---

## Part 8 — Risks, Anti-Patterns, and Mitigation

At least 12 risks across AD_HOC and PDCA, plus shared risks.

### 8.1 AD_HOC-specific risks

| # | Risk | Mitigation |
|---|---|---|
| 1 | **Over-formalization (fake DMAIC).** Team imports DMAIC ceremony (SIPOC, MSA, Capability, Control Plan) into an AD_HOC. Overhead consumes more than the improvement saves. | §1.A.3 rules strict at intake; Facilitator enforces "if you want SIPOC, open DMAIC." Artifact list (Part 4) caps at 8; anything beyond = wrong type. |
| 2 | **Under-formalization (skipping baseline).** Team declares victory without a locked baseline; tries to close without a remeasurement. | Kaizen FSM `DRAFT → ACTIVE` guard requires baseline lock; HARD RULE guards CLOSE. Both engine-enforced. |
| 3 | **Scope creep.** 2-week AD_HOC drifts to 3 months; no phase gate triggers a stop. | `ProjectPaceWarning` at `targetCloseDate + 14d`; Facilitator review; legal responses are close-and-open-new or abandon-and-promote. |
| 4 | **HARD RULE evasion.** User tries to close with a different `metricDefinitionId`. | Exact-equality engine check on `baseline.metricDefinitionId === remeasurement.metricDefinitionId`. |
| 5 | **Fake close (manual state-set).** Not possible via API; state transitions go through `KaizenService` methods. | API design (ARCHITECTURE §3.3); no raw state-set. |

### 8.2 PDCA-specific risks

| # | Risk | Mitigation |
|---|---|---|
| 6 | **Orphan ticks (no parent experiment).** #12 ticks scheduled with no `linkedPdcaExperimentId`. | `ActivityService.start()` rejects orphan #12 when user has open experiment (ARCHITECTURE §2.13). |
| 7 | **Abandonment drift.** Experiment opens; user ticks twice; forgets. Experiment remains open; blocks new experiments. | `ProjectPaceWarning` at 14d past last tick; Reflection agent surfaces weekly. |
| 8 | **Premature graduation.** User declares success before 3 consecutive hits. | `PdcaService.close('GRADUATED')` guard requires `consecutiveTargetHits >= 3`. |
| 9 | **Over-running past 3 hits.** Experiment graduates-eligible but user keeps ticking. | Reflection agent nudges "close?" when `consecutiveTargetHits === 3` and again at 4, 5. Hard review prompt at tick 10. |
| 10 | **Fake measurements.** User fills in a plausible number rather than measuring. | Reflection agent pattern-flags (suspiciously round; exactly equal target; no variance across ticks). No engine hard guard — relies on self-integrity and Reflection nudges. |
| 11 | **Forgotten experiments.** Already covered by risk 7 mitigation. | Same as risk 7. |
| 12 | **Experiment fatigue (20+ ticks, no graduation).** User stubbornly continues. | Reflection agent iteration review at tick 8; mandatory review at tick 10. |
| 13 | **Ambiguous hypothesis.** Not falsifiable. | Part 5.B template validator at intake; rejects missing "if / then" or missing target delta. |

### 8.3 Shared risks

| # | Risk | Mitigation |
|---|---|---|
| 14 | **No learning capture after close.** | Artifact list requires Lessons Learned (A07) / Learning Summary (A11) at close; CLOSE guard rejects missing artifact. |
| 15 | **No promotion path used when deserved.** PDCA discovers a pattern worth a Kaizen; user closes as graduated without promoting. | Reflection agent flags patterns: cross-week friction, cross-person impact, org-level root cause → suggests promotion to AD_HOC or formal. |
| 16 | **Double-work (AD_HOC and PDCA on same problem).** User opens both; measurements diverge; confusion. | Intake wizard checks for active experiments / active Kaizens on similar scope; flags. User explicitly chooses one or the other. |
| 17 | **Learning not shared.** AD_HOC closes with a Lessons Learned nobody reads. | Part 10 recommends a monthly portfolio review; Facilitator role can own cross-AD_HOC learning cross-pollination. |

---

### 8.4 Systemic risks (program-level)

Beyond the per-project risks, three systemic risks affect the AD_HOC + PDCA portfolio:

| # | Risk | Mitigation |
|---|---|---|
| 18 | **AD_HOC proliferation dilutes program attention.** Too many AD_HOCs open at once; facilitators lose track; some drift to abandonment. | Recommend ≤ 5 concurrent AD_HOCs per facilitator; portfolio dashboard shows aging. |
| 19 | **PDCA graduation reward incentive gaming.** If program KPIs reward graduation count, users open easy PDCAs to inflate numbers. | Track graduation *quality* (target delta; persistence over time) not just count. |
| 20 | **Type shopping ("let me open an AD_HOC because the Accelerator seems too formal").** Users downgrade type to avoid ROI sign-off. | Facilitator enforces §1.A.3 rules; Sponsor-driven projects default to Accelerator or formal types. |

### 8.5 Escalation playbook

When a risk materializes, the playbook is:

**AD_HOC risk escalation:**

1. Facilitator detects (via pace warning, check-in, or dashboard).
2. 1:1 with Process Owner to diagnose (scope? capacity? action quality?).
3. Choose legal response:
   - **Recommit** (new target close date, same scope) — allowed once.
   - **Close-and-open-new** (close current with `closeKind='PARTIAL'` or `FAILED_HONEST`; open new AD_HOC for residual).
   - **Abandon-and-promote** (abandon current; open Accelerator / Kaizen 90 / DMAIC for the real scope).
4. Capture decision in A07 Lessons Learned.

**PDCA risk escalation:**

1. Reflection agent detects (via idle, over-run, or pattern).
2. Surface in next tick block or Weekly Reflection.
3. User chooses:
   - **Iterate with adjustment** (edit hypothesis; new baseline).
   - **Abandon with learning** (A11 captured; honest reason).
   - **Promote** (SUPERSEDED_BY_KAIZEN; A13 captured).
4. No "quietly ignore" path; the one-open-experiment cap forces resolution.

### 8.6 Failure-mode summary (cross-reference)

| FM # | Type | Name | Engine-enforced? | Part 7/8 reference |
|---|---|---|---|---|
| 1 | AD_HOC | Baseline no op-def | No (facilitator check) | 7.A.2, 7.E.1 |
| 2 | AD_HOC | Action list no owners | **Yes** (ACTIVE guard) | 8.1 #2 |
| 3 | AD_HOC | No remeasurement attempt | Partial (pace warning) | 8.1 #2 |
| 4 | AD_HOC | Remeasurement op-def mismatch | **Yes** (HARD RULE) | 8.1 #4 |
| 5 | AD_HOC | Close without Lessons Learned | **Yes** (close guard) | 7.C #6 |
| 6 | AD_HOC | Scope creep past close date | Partial (pace warning) | 8.1 #3 |
| 7 | AD_HOC | Fake close | **Yes** (no manual API) | 8.1 #5 |
| 8 | AD_HOC | Sponsor disengagement | No (process) | 1.A.7 |
| 9 | PDCA | Orphan ticks | **Yes** | 8.2 #6 |
| 10 | PDCA | Parallel experiments | **Yes** (MVP cap) | 8.2 #6 |
| 11 | PDCA | Premature graduation | **Yes** | 8.2 #8 |
| 12 | PDCA | Tick close without measurement | **Yes** (output artifact) | 7.B.2 |
| 13 | PDCA | Experiment drift | Partial (pace warning) | 8.2 #7 |
| 14 | PDCA | Fake measurement | No (pattern flag only) | 8.2 #10 |
| 15 | PDCA | Over-run past 3 hits | No (agent nudge) | 8.2 #9 |
| 16 | PDCA | Ambiguous hypothesis | **Yes** (intake validator) | 8.2 #13 |
| 17 | Shared | No learning capture | **Yes** (close guard) | 8.3 #14 |
| 18 | Shared | No promotion path | No (agent nudge) | 8.3 #15 |
| 19 | Shared | Double-work | No (intake flag) | 8.3 #16 |
| 20 | Program | AD_HOC proliferation | No (dashboard) | 8.4 #18 |

---

## Part 9 — AI-Native Opportunities

Per `AI_AGENTS.md v0.1`, the five agents are Planning, Momentum, Context, Reflection, and Composer Explainer. Each contributes to AD_HOC and PDCA differently. This Part maps opportunities by agent and by type.

### 9.A AD_HOC AI opportunities

#### 9.A.1 Human-required

- **Type decision at intake.** §1.A.3 applies rules, but the human confirms. Planning agent recommends; human approves.
- **Scope boundary.** Human writes.
- **Baseline operational definition.** Human authors; SME validates.
- **`closeKind` selection.** Human picks with honesty; Reflection agent proposes.
- **Sponsor communication.** Human runs.

#### 9.A.2 AI-assisted

- **Problem Note drafting from friction signal.** Planning agent (or Context) drafts A01 from a cluster; human edits.
- **Scope Boundary draft.** Context agent drafts A02 from A01 + historical scope patterns.
- **Action list ranking.** Planning agent ranks candidates by Impact × Ease using historical data; human selects.
- **Owner suggestion.** Context agent suggests owner based on prior Kaizens + roster; human assigns.
- **Lessons Learned drafting.** Reflection agent drafts A07 from per-action reflections; human edits.

#### 9.A.3 AI-automatable

- **`linkedKaizenId` setting on Deep blocks during ACTIVE.** Composer does automatically when AD_HOC is active.
- **`ProjectPaceWarning` firing at `targetCloseDate + 14d`.** Deterministic; engine-driven.
- **Close-ritual reminder at remeasurement lock.** Momentum agent.
- **Weekly check-in agenda.** Reflection agent drafts from action progress.
- **Portfolio-feed pattern detection.** Reflection agent cross-examines closed AD_HOCs for patterns; surfaces for Facilitator review.

### 9.B PDCA AI opportunities

PDCA is the **highest AI-leverage project type** in the CadencePlan family. The 48h cadence is perfectly aligned to agent-reminder rhythms; the numeric-measurement requirement is trivially detectable; the graduation criterion is a clean trigger.

#### 9.B.1 Human-required

- **Hypothesis authoring.** Human writes (with Reflection agent drafting support).
- **Measurement (actual capture).** Human measures — no AI substitute.
- **ACT decision.** Human chooses iterate / graduate / abandon / promote (with Reflection agent recommendation).

#### 9.B.2 AI-assisted

- **Hypothesis drafting from friction signal.** Reflection agent proposes candidates at Weekly Reflection.
- **Baseline seed.** Context agent pre-fills from recent measurements if available.
- **Reflection drafting per tick.** Reflection agent drafts "what went well / what to improve" from engagement signals; human edits.
- **Promotion memo drafting.** Reflection agent drafts A13 when promotion decision is made.

#### 9.B.3 AI-automatable (Momentum + Reflection agents)

- **Tick reminder at the 48h boundary.** Momentum agent nudges when `hoursSinceLastPdca > 48` and composer has not yet placed a tick.
- **Measurement prompt.** Context agent surfaces "What was the current condition?" with the named method at tick block start.
- **Trend detection across ticks.** Reflection agent: "Your last 3 ticks show no trend toward target — adjust hypothesis?"
- **Graduation detection.** Reflection agent: "You've hit target 3 times in a row — graduate?"
- **Promotion suggestion.** Reflection agent: "This pattern looks bigger than PDCA — promote to a Kaizen?" when evidence crosses PDCA's scope (touches multiple people, requires org change, etc.).
- **Abandonment drift alert.** Reflection agent: at 14 days past last tick, "Your PDCA has been idle — graduate, abandon, or tick?"
- **Over-running detection.** Reflection agent at tick 8: "You have [X] ticks with no graduation. Adjust hypothesis?" At tick 10: mandatory review.
- **Fake-measurement flagging.** Reflection agent: measurements that are suspiciously round, or exactly equal to target, or show zero variance across ticks.

#### 9.B.4 Binding to existing agents

Per AI_AGENTS.md:

| Agent | PDCA role |
|---|---|
| **Momentum** | Tick reminder at the 48h boundary; on-time tick start; idle-experiment nudge. |
| **Context** | Measurement-method prompt at tick block start; baseline seed from prior data. |
| **Reflection** | Graduation detection; trend detection; promotion suggestion; abandonment drift; over-running detection; fake-measurement flagging; Learning Summary draft. |
| **Planning** | Experiment-type decision at intake (PDCA vs AD_HOC vs formal). |
| **Composer Explainer** | "Your #12 PDCA tick is scheduled because you have an open experiment and your last tick was 48h ago." |

None of the above require new agents beyond the existing 5.

### 9.C Agent trigger specifications (MVP heuristics)

Per `AI_AGENTS.md §1.2` agents ship as deterministic heuristics in MVP; LLM variants ship in Next. For AD_HOC and PDCA, the heuristics are:

**Momentum agent — PDCA tick reminder.**
- Trigger: `CycleProposed` with a Daily composition AND the user has an open `PdcaExperiment` AND `hoursSinceLastPdca > 48`.
- Output: suggestion `MOMENTUM_PDCA_DUE` with copy "Your PDCA is due — tick #{next-tick-number} is ready."
- Basis: `PdcaExperiment` + latest tick `ScheduledActivity`.
- De-dup key: `momentum + pdcaExperimentId + hoursSinceLastPdcaBucket`.

**Momentum agent — AD_HOC action nudge.**
- Trigger: `ActivityCompleted` for a non-kaizen Deep block AND user has ACTIVE AD_HOC with overdue action (due date past).
- Output: suggestion `MOMENTUM_ADHOC_ACTION_OVERDUE` with copy "Your AD_HOC has an overdue action: #{action-name}."
- Basis: `Kaizen.actions[]` with `dueDate < now` AND `doneAt === null`.

**Reflection agent — PDCA graduation detection.**
- Trigger: `PdcaTickCommitted` with `consecutiveTargetHits === 3`.
- Output: suggestion `REFLECTION_PDCA_GRADUATE` with copy "You've hit target 3 times in a row. Graduate?" and a one-click graduate action.
- Basis: `PdcaExperiment` + last 3 `PdcaTickCommitted` events.

**Reflection agent — PDCA abandonment drift.**
- Trigger: Weekly Reflection AND user has open `PdcaExperiment` AND `daysSinceLastTick > 14`.
- Output: suggestion `REFLECTION_PDCA_IDLE` with copy "Your PDCA has been idle for #{daysSinceLastTick} days. Tick, graduate, or abandon?"
- Basis: `PdcaExperiment` + last tick timestamp.

**Reflection agent — PDCA over-running.**
- Trigger: `PdcaTickCommitted` AND tick count (length of `tickActivityIds`) >= 8.
- Output: suggestion `REFLECTION_PDCA_OVER_RUNNING` at tick 8 with copy "You have 8 ticks, no graduation. Adjust hypothesis or abandon?" Mandatory at tick 10.

**Reflection agent — PDCA promotion suggestion.**
- Trigger: `PdcaTickCommitted` AND (hypothesis text includes cross-person markers ["my team", "our process", "we"]) OR (tick log shows impact beyond the user's personal scope).
- Output: suggestion `REFLECTION_PDCA_PROMOTE` with copy "This pattern may be bigger than PDCA. Promote to AD_HOC?" with one-click promotion path.

**Reflection agent — AD_HOC close-kind recommendation.**
- Trigger: `KaizenRemeasurementCaptured` for AD_HOC.
- Output: suggestion `REFLECTION_ADHOC_CLOSEKIND` with a recommendation based on delta: met target → SUCCESS; improved but short → PARTIAL; no change or worse → FAILED_HONEST. User confirms or overrides.

**Reflection agent — AD_HOC Lessons Learned draft.**
- Trigger: `KaizenStartRemeasurement` fires (ACTIVE → IN_REMEASUREMENT).
- Output: suggestion `REFLECTION_ADHOC_LESSONS_DRAFT` with a pre-filled A07 template drawing from per-action reflections.

**Context agent — PDCA measurement-method prompt.**
- Trigger: `ActivityStarted` on a #12 tick.
- Output: inline text "Measurement method from charter: [method]. Apply now."
- Basis: `PdcaExperiment.measurementMethod` field from A09.

**Context agent — AD_HOC scope-draft.**
- Trigger: `KaizenPromoted` with `projectType='AD_HOC'` from a friction cluster.
- Output: pre-filled A02 Scope Boundary draft drawing from the cluster's source activities.

**Planning agent — type recommendation at intake.**
- Trigger: Weekly Reflection promotion step.
- Output: a ranked list of project-type candidates based on §1.A.3 / §1.B.3 rules applied to the cluster's observable properties (scope breadth, frequency, # distinct owners touched).

**Composer Explainer — "why this block?" microcopy.**
- Trigger: `CycleAccepted` with a #12 PDCA tick OR a `linkedKaizenId` PROJECT block.
- Output for PDCA: "Your PDCA tick is scheduled because experiment #{id} is active and your last tick was #{hoursSince}h ago (≥42h threshold met)."
- Output for AD_HOC: "This Deep block is dedicated to AD_HOC #{kaizenId}; it will work on action #{actionName}."

### 9.D AI-leverage scorecard

A 1–5 scale per opportunity where 5 = very high leverage (agent handles entirely; user just confirms) and 1 = very low leverage (agent just surfaces; user does everything).

| Opportunity | Score | Notes |
|---|---|---|
| PDCA tick reminder | 5 | Fully automatable; no human judgment needed |
| PDCA graduation detect | 5 | Counter-based; deterministic |
| PDCA measurement capture | 2 | Human must measure; agent prompts only |
| PDCA learning summary draft | 4 | Agent drafts from tick log; user edits |
| PDCA promotion suggestion | 3 | Agent flags; user decides |
| AD_HOC type decision | 3 | Agent recommends; user confirms |
| AD_HOC action-owner suggestion | 3 | Agent ranks; user assigns |
| AD_HOC close-kind recommendation | 3 | Agent proposes; user picks honestly |
| AD_HOC Lessons Learned draft | 4 | Agent drafts; user edits |
| AD_HOC pace warning | 5 | Deterministic time-based |
| Portfolio pattern detection | 2 | Agent surfaces patterns; Facilitator interprets |

Total: PDCA averages 3.8 (HIGH); AD_HOC averages 3.4 (MEDIUM). Confirms PDCA is the highest-leverage type.

---

## Part 10 — Final Deliverables

### 10.1 Deliverable index

This standard produces the following operational artifacts and decisions:

1. Part 1 — Unified decision matrix (§1.C) covering the full 6-type family.
2. Part 2 — AD_HOC 6-phase operational lifecycle + PDCA 4-state FSM lifecycle.
3. Part 3 — 30 AD_HOC tasks + 18 PDCA tasks, all with acceptance criteria.
4. Part 4 — 8 AD_HOC artifacts + 5 PDCA artifacts.
5. Part 5 — AD_HOC problem-statement + PDCA hypothesis frameworks with templates.
6. Part 6 — Capacity + BAM scheduling patterns for both types.
7. Part 7 — HARD RULE enforcement (AD_HOC) + graduation criterion (PDCA).
8. Part 8 — 17 named risks with mitigations.
9. Part 9 — AI-native opportunities by agent.
10. Part 11 — Unified 6-type decision tree + family-complete reflection.

### 10.2 Next steps for operationalization

#### 10.2.1 As BAM project types

- **ARCHITECTURE.md** — no new entities needed. `Kaizen.projectType='AD_HOC'` is already the default (§2.9). `PdcaExperiment` is already specified (§2.13). Potential v0.6 edits: (a) generalize `AcceleratorPaceWarning` → `ProjectPaceWarning` already done in v0.5; confirm AD_HOC and PDCA are first-class emitters. (b) Confirm HARD RULE enforcement on AD_HOC close invariant; add row to §8 invariant cross-reference if not present.
- **ENGINE_DESIGN.md** — §4.1 PDCA canonical spec is sufficient; extend with tick-8 / tick-10 review hooks for Reflection agent (these are AI concerns; engine just fires an event). Add a §4.5 "AD_HOC lightweight Kaizen" subsection referencing this standard for the 6 operational phases and the close-ritual acceptance.
- **CATALOG_GAPS.md** — no new catalog entries needed. #12 PDCA Cycle is already defined; generic Deep Work — Project Task (generic) is in §H.2.
- **DELIVERY_PLAN.md** — E7 (Kaizen Lifecycle) already covers AD_HOC close flow; E8 (PDCA + DMAIC DAG) already covers PDCA tick flow. No new epic strictly required; potentially a small UX epic for the PDCA intake modal if not already planned (check `UX_FLOWS.md §2.3`).

#### 10.2.2 As software product workflow

- **E7 Kaizen Lifecycle extensions.**
  1. Intake wizard supports AD_HOC as default project type when opening from friction cluster.
  2. Close gate enforces Lessons Learned artifact presence for AD_HOC.
  3. `ProjectPaceWarning` handler fires for AD_HOC at `targetCloseDate + 14d`.
- **E8 PDCA + DMAIC DAG extensions.**
  1. PdcaExperiment UI: intake modal (charter A09), tick block UI with measurement + reflection, ACT decision UI (iterate / graduate / abandon / promote).
  2. Graduation guard on close action (UI disables graduate button until counter ≥ 3).
  3. Promotion flow: open AD_HOC from PDCA close with baseline seeded.
- **New UX work (may be absorbed into existing epics).**
  1. PDCA Learning Summary (A11) template renderer.
  2. AD_HOC 6-phase visual progress on `KaizenCard` (even though phase field is null; show operational phase derived from FSM state + artifacts captured).
  3. Reflection agent PDCA-specific microcopy (tick-reminder, graduation-detect, abandonment-drift, over-running).

#### 10.2.3 As AI-agent operating model

PDCA is the highest AI-leverage project type. Recommendations:

1. **Momentum agent owns the 48h boundary.** Ship tick-reminder as a named heuristic in MVP per AI_AGENTS.md §2.2.
2. **Reflection agent owns graduation + promotion detection.** These are the two highest-value surfaces; they directly move KPI §7.5 "validated Kaizens/MAU/month" and §7.2 "reflection rate on-time."
3. **Context agent owns measurement-method prompts.** Context's basic job — "surface the right thing at the right time" — maps perfectly to "remind me of the named measurement method at tick block start."
4. **Planning agent owns intake type-decision.** When a Weekly Reflection cluster fires, Planning recommends AD_HOC / PDCA / formal. Heuristic input: scope breadth, known-root-cause, personal vs team.
5. **Composer Explainer owns the "why this tick?" microcopy.** Same pattern as DMAIC steps.

#### 10.2.4 Portfolio and Learning Registry

Beyond per-project operationalization, the AD_HOC and PDCA close artifacts (A07 Lessons Learned, A11 Learning Summary, A13 Promotion Memo) should feed a **Learning Registry** at the program level. This is not in-scope for MVP but is flagged for Next:

- A registry indexing every CLOSED AD_HOC Lessons Learned + PDCA Learning Summary across the organization.
- Searchable by: process area, metric type, close kind, hypothesis keywords.
- Cross-pollination: when a new AD_HOC opens, Planning agent surfaces related prior Lessons Learned to seed the team's approach.
- Graduation-rate trend: tracked at program level to detect drift.

#### 10.2.5 Facilitator rotation and coverage

For organizations running ≥ 10 concurrent AD_HOCs:

- Dedicated Facilitator role recommended (not a shared responsibility).
- Facilitator owns: intake type-decision review, baseline lock attestation, pace-warning response, close ritual facilitation, Lessons Learned review for portfolio feed.
- Coaching: Facilitator role for AD_HOC is lighter than Kaizen 90 (8–12 h/week equivalent is over-spec); 2–3 h/week per 5 active AD_HOCs is the right envelope.

PDCA does not require a Facilitator role in MVP (the system + Reflection agent carry the coaching surface). In Next, an optional "PDCA Coach" role may be added for team-mode organizations.

### 10.3 Architectural inconsistencies flagged

These are flagged for coordinator review; none appear to be blocking.

1. **AD_HOC `targetCloseDate` field not in ARCHITECTURE.** The Accelerator has `startDate`; the Kaizen entity does not appear to have `targetCloseDate`. §1.A.7 and §2.A assume it exists. Recommend adding `Kaizen.targetCloseDate` (timestamp, nullable, required for `projectType='AD_HOC'`) so `ProjectPaceWarning` has something to compare against.
2. **`lessonsLearnedArtifactRef` not in ARCHITECTURE Kaizen fields.** §7.A.1 asserts the close guard checks this. Either (a) add `Kaizen.lessonsLearnedArtifactRef` field, or (b) enforce via a CLOSED ScheduledActivity with a `LESSONS_LEARNED` catalog row (no new field needed, but needs a generic catalog row in CATALOG_GAPS §H.2: "Lessons Learned — AD_HOC close"). Option (b) is cleaner; recommend it.
3. **AD_HOC is not named as a pace-warning emitter in ENGINE_DESIGN.** ENGINE §4.x does not mention `ProjectPaceWarning` for `projectType='AD_HOC'`. Add a one-line handler: AD_HOC emits `ProjectPaceWarning` at `now > targetCloseDate + 14d` while `Kaizen.state !== 'CLOSED'`.
4. **PDCA tick-10 mandatory-review behavior is not specified in ENGINE §4.1.** The standard calls for a Reflection-agent prompt at tick 10. Engine-side, this is a `TickCountReached` event or equivalent. Either add the event or document that "tick count" is computed at read-time and the agent subscribes to `PdcaTickCommitted`. Recommend the latter (no new event needed).
5. **No explicit "SUPERSEDED_BY_KAIZEN" lineage field on Kaizen.** When a PDCA promotes to a Kaizen, the new Kaizen should reference the source experiment. ARCHITECTURE §2.9 has `sourceFrictionSignalIds` but not `sourcePdcaExperimentId`. Recommend adding `Kaizen.sourcePdcaExperimentId` (string, nullable) for clean promotion lineage. Alternatively, use `sourceFrictionSignalIds` with a special-case convention — but that conflates friction signals and experiments. Preferred: dedicated field.

None of these are blocking; MVP can ship with (1), (2-option-b), and the Reflection-agent heuristic at tick-10 subscribing to `PdcaTickCommitted`.

---

## Part 11 — Decision Tree and Family Completion

### 11.1 Unified 6-type decision tree

An operator at intake walks this tree top to bottom. First "Yes" wins.

```
                            ┌──────────────────────────────────────────────┐
                            │  INTAKE: a problem, a cluster, a KPI dip,    │
                            │  or a hypothesis has surfaced.               │
                            └─────────────────┬────────────────────────────┘
                                              │
                        ┌─────────────────────▼──────────────────────┐
                        │  Q1: Is the root cause UNKNOWN and         │
                        │     variability dominates the output?      │
                        │     (High σ, recurring defects, Cpk < 1.33)│
                        └────────┬────────────────────────┬──────────┘
                                 │ YES                    │ NO
                                 ▼                        │
                              ┌──────┐                    │
                              │DMAIC │                    │
                              └──────┘                    │
                                                          ▼
                        ┌─────────────────────────────────────────────┐
                        │  Q2: Does the scope CROSS 2–4 FUNCTIONS     │
                        │     and need ≥ 50 days of post-event        │
                        │     cross-functional adoption runway?       │
                        └────────┬────────────────────────┬───────────┘
                                 │ YES                    │ NO
                                 ▼                        │
                           ┌──────────┐                   │
                           │Kaizen 90 │                   │
                           └──────────┘                   │
                                                          ▼
                        ┌─────────────────────────────────────────────┐
                        │  Q3: Can the team redesign AND adopt in     │
                        │     1–5 CONSECUTIVE DAYS with no cross-     │
                        │     functional implementation runway?       │
                        └────────┬────────────────────────┬───────────┘
                                 │ YES                    │ NO
                                 ▼                        │
                         ┌────────────────┐               │
                         │Kaizen Event 1-5│               │
                         └────────────────┘               │
                                                          ▼
                        ┌─────────────────────────────────────────────┐
                        │  Q4: Does the portfolio require FINANCE-    │
                        │     SIGNED ROI AND the project fits a       │
                        │     30-day, single-function envelope?       │
                        └────────┬────────────────────────┬───────────┘
                                 │ YES                    │ NO
                                 ▼                        │
                          ┌─────────────┐                 │
                          │Accelerator  │                 │
                          │  (30-day)   │                 │
                          └─────────────┘                 │
                                                          ▼
                        ┌─────────────────────────────────────────────┐
                        │  Q5: Is the scope INDIVIDUAL-SCALE,         │
                        │     measurable by a single number, testable │
                        │     on a 48h cadence, AND aimed at a        │
                        │     personal habit / hypothesis?            │
                        └────────┬────────────────────────┬───────────┘
                                 │ YES                    │ NO
                                 ▼                        │
                              ┌──────┐                    │
                              │ PDCA │                    │
                              └──────┘                    │
                                                          ▼
                        ┌─────────────────────────────────────────────┐
                        │  Q6: Single-function OR small-team,         │
                        │     known root cause, fits 1–4 weeks,       │
                        │     no Finance sign-off required?           │
                        └────────┬────────────────────────┬───────────┘
                                 │ YES                    │ NO
                                 ▼                        │
                              ┌────────┐                  │
                              │AD_HOC  │                  │
                              └────────┘                  │
                                                          ▼
                        ┌─────────────────────────────────────────────┐
                        │  FALLBACK: Re-examine. If none of Q1–Q6     │
                        │  matches, the problem is either:            │
                        │  (a) too vague (needs VOC / problem         │
                        │      statement authoring first);            │
                        │  (b) a one-off incident (post-mortem +      │
                        │      AD_HOC residual);                      │
                        │  (c) mischaracterized (break into parts).   │
                        └─────────────────────────────────────────────┘
```

**Key criteria (compressed to a single decision rule):**

> **Root cause** (known? unknown?) → gates DMAIC.
> **Scope breadth** (individual / single-function / cross-functional) → gates PDCA / AD_HOC-Accelerator-Event / Kaizen 90.
> **Runway required** (48h / 1–5 days / 30 days / 90 days / 4–10 months) → gates duration.
> **Finance sign-off required** (yes / no) → forces Accelerator / Kaizen 90 / DMAIC over AD_HOC.
> **Cadence feasibility** (48h ticks feasible? single-day burst feasible? distributed week? multi-sprint?) → gates PDCA / Kaizen Event / AD_HOC / Accelerator or Kaizen 90 / DMAIC.

### 11.2 Family complete — reflection

With this standard, the CadencePlan project-type family is operationally complete:

| Type | Standard | Scope | Envelope | Rigor |
|---|---|---|---|---|
| **DMAIC** | `DMAIC_STANDARD.md v1.0` (4071 lines) | Cross-functional chronic; unknown RC | 4–10 months | Statistical (MSA, Capability, regression, DOE, two-pass ROI) |
| **Kaizen 90** | `KAIZEN_EVENT_STANDARD.md v1.0` (3356 lines) | Cross-functional (2–4 fn); known RC | 90 days | Medium; Sustainment Gate; Finance ROI |
| **Accelerator (30-day)** | `ACCELERATOR_STANDARD.md v1.0` (2802 lines) | Single function; known RC | 30 days | Medium; 5-phase guards; Finance ROI |
| **Kaizen Event (1–5 day)** | Absorbed into `KAIZEN_EVENT_STANDARD.md` via `KAIZEN_EVENT` projectType binding | Single function; known RC; co-located | 1–5 days | Light; before/after compare |
| **AD_HOC** | **This standard** | Single function / individual; known RC | 1–4 weeks | HARD RULE only; no phases; no Finance |
| **PDCA** | **This standard** | Individual; hypothesis test | 6–14 days (3–7 ticks) | Graduation on 3 consecutive target hits |

Together, the four operating standards (Accelerator, Kaizen 90, DMAIC, and this AD_HOC + PDCA) constitute the full CadencePlan project-type operating doctrine. Each standard shares structural DNA — 11-part format, artifact specs, task inventories, capacity models, AI opportunities, decision trees. Each standard is authoritative for its type. Together they let a facilitator, coach, practitioner, or agent answer "what project type, and what do I do next?" at every step from intake to close across every improvement scope CadencePlan supports.

The family is complete. The HARD RULE holds across all five entity project types. The Kaizen FSM unifies Accelerator / Kaizen 90 / Kaizen Event / AD_HOC; the PdcaExperiment FSM handles PDCA as its own entity. No project type lacks a close gate; no project type allows evidence-free success claims; no project type is formal-methodology-locked when the problem does not warrant it.

What was formal-only is now graded: DMAIC where rigor matters; Kaizen 90 where cross-functional runway matters; Accelerator where portfolio ROI matters; Kaizen Event where a burst matters; AD_HOC where speed matters; PDCA where learning matters. Every improvement has a home in the family.

### 11.3 Family-scope KPI view

A unified view of program-health KPIs across the full 6-type family:

| KPI | DMAIC | Kaizen 90 | Accelerator | Kaizen Event | AD_HOC | PDCA |
|---|---|---|---|---|---|---|
| Close-rate target | ≥80% of started projects CLOSE | ≥85% | ≥90% | ≥95% | ≥75% | Graduation ≥40%; Abandonment ≤40%; Promotion 5–20% |
| Close-kind distribution target | SUCCESS ≥ 70%, FAILED_HONEST ≤ 15% | SUCCESS ≥ 70% | SUCCESS ≥ 75% | SUCCESS ≥ 80% | SUCCESS ≥ 60% | GRADUATED ≥ 40% |
| Median cycle time | 4–10 months | 90 days ± 15 | 30 days ± 5 | 5 days + 30-day check | ≤ 21 days | ≤ 14 days |
| ROI sign-off rate | 100% (mandatory) | 100% | 100% | N/A | N/A | N/A |
| Rebaseline rate | 100% | 100% | 100% | 100% | 100% (HARD RULE) | 100% (measurement per tick) |
| Learning capture rate | 100% (Results Narrative) | 100% (3-pager) | 100% (final report) | 100% (readout) | 100% (A07) | 100% (A11) |

Program-level: if any of the above drop below target in a rolling 90-day window, the PMO investigates (a) type-selection discipline, (b) facilitator capacity, (c) tool adoption.

### 11.4 Closing reflection — operating doctrine complete

The CadencePlan project-type operating doctrine is now four standards:

1. **`ACCELERATOR_STANDARD.md` v1.0** — 2802 lines; 30-day, 5-phase, single-function, Finance-signed.
2. **`KAIZEN_EVENT_STANDARD.md` v1.0** — 3356 lines; 90-day, 4-macro-phase, cross-functional, Sustainment Gate.
3. **`DMAIC_STANDARD.md` v1.0** — 4071 lines; 4–10-month, 5-phase (D/M/A/I/C), statistical rigor, two-pass ROI.
4. **`ADHOC_PDCA_STANDARD.md` v1.0** (this document) — 1-4 weeks (AD_HOC) / 6–14 days (PDCA); no formal phases; HARD RULE; graduation.

Together: a sized, graded, evidence-disciplined family. A facilitator or practitioner can answer "which type?" with confidence at every intake; a coach can shepherd any project from open to close using the right standard; an AI agent can route events and nudges to the right behavior for each type.

No type is redundant. No type is missing. The HARD RULE holds across every Kaizen type; the graduation criterion holds across every PDCA; the composer binds each type to its appropriate payload; the close gate refuses evidence-free exits.

CadencePlan's promise — "improvement as a mechanism, not a project" — rests on this doctrine being complete, consistent, and honest. With this standard, it is.

— end of standard —
