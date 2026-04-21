# CadencePlan — Canonical Vocabulary Glossary

Version: 1.0 — derived from PRODUCT_BLUEPRINT v0.3, ARCHITECTURE v0.6, UX_FLOWS v0.2.2, CATALOG_GAPS v0.3.1, and the four operating standards (DMAIC, KAIZEN_EVENT, ACCELERATOR, ADHOC_PDCA). Entries alphabetized within each section; terse by contract (≤ 5 lines each). Inconsistencies are resolved in §15.

---

## §1 Brand & Product

### agilitymechanism.com
- **Canonical.** Marketing site for the methodology brand ("The Agility Mechanism").
- **Source.** PRODUCT_BLUEPRINT §Assumption; marketing-site assets in repo root.
- **Related.** The Agility Mechanism, cadenceplan.com.

### BAM
- **Canonical.** Business Agility Mechanism — the upstream methodology from *The BAM Way*.
- **Source.** PRODUCT_BLUEPRINT §1; ACCELERATOR_STANDARD Glossary.
- **Related.** BAM OS, The Agility Mechanism, BAM roles.

### BAM OS
- **Canonical.** Internal engine reference for the executable BAM surface.
- **Engine.** The deterministic composer + invariant + event stack behind CadencePlan.
- **Source.** ACCELERATOR_STANDARD Glossary; DMAIC_STANDARD Glossary.
- **Related.** CadencePlan, The Agility Mechanism.

### cadenceplan.com
- **Canonical.** Product marketing / sign-up domain for CadencePlan.
- **Source.** Task brief §1; repo marketing-site assets.
- **Related.** CadencePlan, agilitymechanism.com.

### CadencePlan
- **Canonical.** The product (shipping name) — user-facing application.
- **Engine.** Runs BAM OS; surfaces Cadence Day / Week / Sprint / Month.
- **Source.** ACCELERATOR_STANDARD Glossary; DMAIC_STANDARD §4040.
- **Related.** BAM OS, CadencePlan DMAIC / Kaizen / Ad-Hoc.

### CadencePlan Ad-Hoc
- **Canonical.** Offering tier covering `projectType='AD_HOC'` and `PdcaExperiment` work.
- **Engine.** No phase FSM; `Kaizen.phase === null`; `targetCloseDate`-anchored pace.
- **Source.** ADHOC_PDCA_STANDARD §1.C.
- **Related.** AD_HOC, PDCA, The Accelerator.

### CadencePlan DMAIC
- **Canonical.** Offering tier for `projectType='DMAIC'`; full Define → Measure → Analyze → Improve → Control.
- **Engine.** Phase **derived** via `phaseFor()` — no stored `Kaizen.phase`.
- **Source.** DMAIC_STANDARD §1.1, §1.5, Glossary.
- **Related.** DMAIC, Validated Kaizen, Phase derivation.

### CadencePlan Kaizen
- **Canonical.** Offering tier for Kaizen Event variants (1–5 day burst + Kaizen 90).
- **Engine.** `projectType ∈ {KAIZEN_EVENT, KAIZEN_EVENT_90D}`.
- **Source.** KAIZEN_EVENT_STANDARD §1; task brief §1.
- **Related.** Kaizen 90, Kaizen Event.

### Kaizen 90
- **Canonical.** 90-Day Kaizen Event project type — cross-functional medium-complexity redesign + adoption.
- **Engine.** `projectType='KAIZEN_EVENT_90D'`; 4 macro-phases PRE_EVENT / EVENT / POST_EVENT / SUSTAIN.
- **Source.** KAIZEN_EVENT_STANDARD §1.1, §2; ARCHITECTURE §3.4.1.
- **Related.** Sustainment Gate, Implementation Lead.

### The 30-Day Kaizen Accelerator (aka "The Accelerator")
- **Canonical.** Bounded 30-day single-process improvement project with ROI gate.
- **Engine.** `projectType='KAIZEN_ACCELERATOR_30D'`; 5-phase FSM (PHASE_0 → PHASE_4).
- **Source.** PRODUCT_BLUEPRINT §4.1 item 6; PROJECT_TYPE_30D_KAIZEN; ACCELERATOR_STANDARD.
- **Related.** Phase gate, RoiPanel, Control Plan.

### The Agility Mechanism
- **Canonical.** The methodology brand (consulting-facing name for BAM-in-practice).
- **Source.** ACCELERATOR_STANDARD Glossary; task brief §1.
- **Related.** BAM, BAM OS, CadencePlan.

---

## §2 Project Types

Table of every project type that appears as a `Kaizen.projectType` enum value (plus `PdcaExperiment`, which is a **separate entity**, not a `projectType`).

| Enum value | Entity | Default duration | Authoritative standard |
|---|---|---|---|
| `DMAIC` | `Kaizen` | 4.5–9.5 months (9–19 sprints) + 90-day sustainment tail | `DMAIC_STANDARD.md` v1.0 |
| `KAIZEN_EVENT` | `Kaizen` | 1–5 days (standalone burst) | `KAIZEN_EVENT_STANDARD.md` §1.3 (burst row) |
| `KAIZEN_EVENT_90D` | `Kaizen` | 90 days (PRE_EVENT 14d + EVENT 5d + POST_EVENT 50d + SUSTAIN 20d) | `KAIZEN_EVENT_STANDARD.md` v1.0 |
| `KAIZEN_ACCELERATOR_30D` | `Kaizen` | 30 days (PHASE_0..PHASE_4) | `ACCELERATOR_STANDARD.md` v1.0 + `PROJECT_TYPE_30D_KAIZEN.md` |
| `AD_HOC` | `Kaizen` | 1–4 weeks (anchored by `targetCloseDate`) | `ADHOC_PDCA_STANDARD.md` §1.A |
| PDCA *(entity, not a `projectType`)* | `PdcaExperiment` | 6–14 days (3–7 ticks; graduate at 3 consecutive hits) | `ADHOC_PDCA_STANDARD.md` §1.B |

Notes.
- `PdcaExperiment` is its own entity with its own FSM (`PLAN → DO → CHECK → ACT → CLOSED`); it is **not** a Kaizen `projectType`.
- The six types form the "family-complete decision matrix" in `ADHOC_PDCA_STANDARD §1.C`.
- Only `KAIZEN_ACCELERATOR_30D` and `KAIZEN_EVENT_90D` store `Kaizen.phase`; `DMAIC` derives phase; `AD_HOC` and standalone `KAIZEN_EVENT` have no phase structure.

---

## §3 Scheduling Cycles

### auto-composer
- **Canonical.** Deterministic engine producing filled `Composition` proposals from catalog + signals.
- **Engine.** `ComposerService.composeDaily()` / `composeWeekly()`; AI-free in MVP.
- **Source.** PRODUCT_BLUEPRINT §3.3; ARCHITECTURE §4.
- **Related.** Composition, InfeasibleResult, 4-2-2 invariant.

### Cadence Day
- **Canonical.** User-facing name for a Daily Composition.
- **Engine.** `Composition` with `cycleType='DAILY'`.
- **Source.** PRODUCT_BLUEPRINT §3.2; ACCELERATOR_STANDARD Glossary.
- **Related.** Cadence Week, 4-2-2 Day, auto-composer.

### Cadence Month
- **Canonical.** User-facing name for a Monthly Composition (~2 sprints + quarterly anchor).
- **Engine.** `Composition` with `cycleType='MONTHLY'` (composer is Next, not MVP).
- **Source.** PRODUCT_BLUEPRINT §3.2.
- **Related.** Cadence Sprint, Quarterly Planning.

### Cadence Sprint
- **Canonical.** User-facing name for a Sprint Composition (2 weeks).
- **Engine.** `Composition` with `cycleType='SPRINT'` (composer is Next).
- **Source.** PRODUCT_BLUEPRINT §3.2; ARCHITECTURE §4.4.
- **Related.** Sprint Planning, Sprint Review, Sprint Retrospective.

### Cadence Week
- **Canonical.** User-facing name for a Weekly Composition (5 daily cycles).
- **Engine.** `Composition` with `cycleType='WEEKLY'`; 1 Weekly Reflection anchored Friday.
- **Source.** PRODUCT_BLUEPRINT §3.2; ARCHITECTURE §4.3.
- **Related.** Cadence Day, Weekly Reflection.

### CI Block
- **Canonical.** The 2h Continuous Improvement portion of the 4-2-2 Day.
- **Engine.** `ScheduledActivity.bucket === 'CI'`; PDCA / L&D / 6S Email / Document Review rotate in.
- **Source.** PRODUCT_BLUEPRINT §3.2; ARCHITECTURE §5.1.
- **Related.** Deep Block, Communication Block.

### Communication Block
- **Canonical.** The 2h Value-Added Communication portion of the 4-2-2 Day.
- **Engine.** `ScheduledActivity.bucket === 'COMMUNICATION'`; hosts Daily Standup + high-value comms.
- **Source.** PRODUCT_BLUEPRINT §3.2; ARCHITECTURE §5.1.
- **Related.** Deep Block, CI Block, Daily Standup.

### Composition
- **Canonical.** Instance of a Cycle Type (Daily / Weekly / Sprint / Monthly).
- **Engine.** Entity §2.4; FSM `PROPOSED → ACCEPTED/EDITED/REJECTED → ACTIVE → CLOSED`.
- **Source.** ARCHITECTURE §2.4, §3.1.
- **Related.** ScheduledActivity, auto-composer.

### Deep Block
- **Canonical.** A 4h PROJECT-bucket chunk on a Cadence Day.
- **Engine.** `ScheduledActivity.bucket === 'PROJECT'`; sliced `2×2h` or `4×1h` by `User.deepSlicePreference`.
- **Source.** PRODUCT_BLUEPRINT §3.2; ARCHITECTURE §2.3; ACCELERATOR_STANDARD Glossary.
- **Related.** Deep slicing, 4-2-2 Day.

### InfeasibleResult
- **Canonical.** Structured composer failure shape when non-optionals exceed capacity.
- **Engine.** `{ kind:'INFEASIBLE', totalRequiredMinutes, capacityMinutes, shortfallMinutes, bucketShortfalls, suggestedActions[], explain[] }` per ARCHITECTURE §4.7.
- **Source.** ARCHITECTURE §4.7; UX_FLOWS §2.1.
- **Related.** auto-composer, ComposerInfeasible event.

### ScheduledActivity
- **Canonical.** Instance of a `CatalogEntry` placed inside a `Composition`.
- **Engine.** Entity §2.5; FSM `PROPOSED → SCHEDULED → IN_PROGRESS → CLOSED | SKIPPED`.
- **Source.** ARCHITECTURE §2.5, §3.2.
- **Related.** CatalogEntry, Intention, outputArtifactRef.

### The 4-2-2 Day
- **Canonical.** Daily composition pattern: 4h PROJECT / 2h COMMUNICATION / 2h CI.
- **Engine.** Enforced by `InvariantEngine.validateComposition()` on every Daily composition.
- **Source.** PRODUCT_BLUEPRINT §3; ARCHITECTURE §5.2; ACCELERATOR_STANDARD Glossary.
- **Related.** Deep Block, bucket floors/ceilings, BucketStrip.

---

## §4 Catalog & Standard Work

### BAM ceremonies
- **Canonical.** Named team ceremonies from *The BAM Way*: Sprint Planning, Daily Standup, Mid-Sprint Review, Sprint Review, Sprint Retrospective, Quarterly Planning.
- **Engine.** All seeded as `CatalogEntry.focusArea='CEREMONY'`; `isNonOptional=true` for the MVP set.
- **Source.** PRODUCT_BLUEPRINT §3.1 ceremonies table; CATALOG_GAPS §H.3.
- **Related.** non-optional, Communication Block.

### CatalogEntry
- **Canonical.** Vetted named standard-work activity — the product's primitive.
- **Engine.** Entity §2.2; carries name, bucket, duration, procedure, outputArtifact, isNonOptional, dependsOn, projectTypeBinding, phaseBinding.
- **Source.** ARCHITECTURE §2.2.
- **Related.** Standard Work Catalog, non-optional, configurable.

### configurable
- **Canonical.** Catalog entries the user or team may add, remove, or swap during Edit.
- **Engine.** `CatalogEntry.isNonOptional === false`; replaced via CatalogPicker.
- **Source.** PRODUCT_BLUEPRINT §3.4.
- **Related.** non-optional, CatalogPicker.

### Deep Work — Project Task (generic)
- **Canonical.** Seeded generic catalog entry used when no named DMAIC / Kaizen payload is active.
- **Engine.** `bucket='PROJECT'`, duration up to 240 min/day, `isNonOptional=false`.
- **Source.** CATALOG_GAPS §H.2.
- **Related.** Deep Block, linkedKaizenId.

### dependsOn DAG
- **Canonical.** `CatalogEntry.dependsOn[]` — cycle-free prerequisite graph for catalog steps.
- **Engine.** A step is eligible iff every id in `dependsOn` has a `CLOSED` ScheduledActivity in the same Kaizen.
- **Source.** ARCHITECTURE §2.2 invariants, §4.5 R9; CATALOG_GAPS §J.
- **Related.** DMAIC payload, MSA-before-Baseline.

### End-of-Activity Reflection
- **Canonical.** Generic catalog entry that fires at close of every ScheduledActivity (60 sec).
- **Engine.** `bucket='CI'`, duration 1 min; emits `Reflection(kind='END_OF_ACTIVITY')`.
- **Source.** CATALOG_GAPS §H.2; ARCHITECTURE decisions §9 #10 (canonical rename).
- **Related.** pending reflection, Friction Signal.

### generic catalog entries
- **Canonical.** Entries seeded alongside the 50 source rows so the composer can always fill a block.
- **Engine.** Deep Work — Project Task · Value-Added Communication · End-of-Activity Reflection · Weekly Reflection · Lessons Learned.
- **Source.** CATALOG_GAPS §H.2.
- **Related.** Standard Work Catalog.

### Lessons Learned
- **Canonical.** Generic catalog entry required at every Kaizen CLOSED (all projectTypes, all closeKinds).
- **Engine.** `bucket='CI'`, 30–60 min, `outputArtifact.schema='DOCUMENT'`; enforced in `KaizenService.close()`.
- **Source.** CATALOG_GAPS §H.2; ARCHITECTURE §2.9 Lessons Learned invariant.
- **Related.** Lessons-Learned-at-CLOSED invariant.

### non-optional
- **Canonical.** Catalog entries the user cannot silently skip (delete rejected; skip requires reasonCode + Variance).
- **Engine.** `CatalogEntry.isNonOptional === true`; set frozen at seed.
- **Source.** PRODUCT_BLUEPRINT §3.4; ARCHITECTURE §2.2 invariants.
- **Related.** Variance, reasonCodeIfSkipped.

### phaseBinding
- **Canonical.** `CatalogEntry.phaseBinding` — the phase id this entry belongs to for phased project types.
- **Engine.** Filter in `ComposerService.eligibleDmaicPayloadSteps()`; values e.g. `'PHASE_0'`, `'PRE_EVENT'`.
- **Source.** ARCHITECTURE §2.2.
- **Related.** projectTypeBinding, Phase FSM.

### projectTypeBinding
- **Canonical.** `CatalogEntry.projectTypeBinding` — the Kaizen projectType(s) this entry is eligible for.
- **Engine.** Enum or enum[]; null means cross-project. Set-valued for `#42`–`#50` (Kaizen burst + Kaizen 90).
- **Source.** ARCHITECTURE §2.2; CATALOG_GAPS §K.2.
- **Related.** phaseBinding, eligibleDmaicPayloadSteps.

### Standard Work Catalog
- **Canonical.** The set of named reusable activities (≈50 source rows + generics + 31 Accelerator + Kaizen 90 bindings).
- **Engine.** Collection of `CatalogEntry` seeded from `Business Agility Standard Work.txt` + gap fills.
- **Source.** PRODUCT_BLUEPRINT §3.1; CATALOG_GAPS §A–§K.
- **Related.** CatalogEntry, bucket mapping, non-optional.

### Value-Added Communication (generic)
- **Canonical.** Generic catalog entry for ad-hoc comms not covered by a named ceremony or #14–#16.
- **Engine.** `bucket='COMMUNICATION'`, variable duration.
- **Source.** CATALOG_GAPS §H.2.
- **Related.** Communication Block, High-value Communication.

### Weekly Reflection
- **Canonical.** Fri-afternoon 20-min DMAIC-style guided reflection; promotes at most one Kaizen candidate.
- **Engine.** `bucket='CI'`, 20 min; emits `Reflection(kind='WEEKLY')` + optional `KaizenPromoted`.
- **Source.** CATALOG_GAPS §H.2; UX_FLOWS §2.3; ARCHITECTURE §2.6.
- **Related.** WeeklyReflectionWizard, dmaicDraft.

---

## §5 Improvement Core

### Baseline
- **Canonical.** Locked measurement at Kaizen start; immutable once `locked=true`.
- **Engine.** `BaselineMetric` entity (§2.10); required to leave Kaizen `DRAFT`.
- **Source.** ARCHITECTURE §2.10; DMAIC_STANDARD §2.2.
- **Related.** Remeasurement, MSA-before-Baseline, method parity.

### closeKind
- **Canonical.** `Kaizen.closeKind ∈ {SUCCESS, PARTIAL, FAILED_HONEST}`; set at CLOSED.
- **Engine.** Derived from `remeasurement.beatsBaseline` + `roi` sign; honest failure still requires remeasurement.
- **Source.** ARCHITECTURE §2.9; PRODUCT_BLUEPRINT §7.2.
- **Related.** HARD RULE, Validated Kaizen.

### Control Plan
- **Canonical.** Ongoing monitoring system with thresholds, response playbooks, ownership.
- **Engine.** Stored on `Kaizen.controlPlanArtifactRef`; drafted per projectType (DMAIC: Improve; Accelerator: Phase 2; Kaizen 90: SUSTAIN).
- **Source.** DMAIC_STANDARD §2.5; ACCELERATOR_STANDARD Glossary; ARCHITECTURE §2.9.
- **Related.** Control-Plan-Phase-2 invariant, controlPlanDraftArtifactRef.

### graduation (3 consecutive hits)
- **Canonical.** PDCA close with `closedReason='GRADUATED'` — 3 consecutive ticks met `targetCondition`.
- **Engine.** `PdcaExperiment.consecutiveTargetHits >= 3` at close; enforced in §2.13 invariants.
- **Source.** ARCHITECTURE §2.13; ADHOC_PDCA_STANDARD §1.B.
- **Related.** PDCA-tick-10, SUPERSEDED_BY_KAIZEN.

### HARD RULE
- **Canonical.** A Kaizen cannot close without a `Remeasurement` whose metricDefinition equals the Baseline's.
- **Engine.** `CHECK (state <> 'CLOSED' OR remeasurement_id IS NOT NULL)` on kaizens; enforced in `KaizenService.close()`.
- **Source.** PRODUCT_BLUEPRINT §4.1 item 4; ARCHITECTURE §3.3, §7.3.
- **Related.** closeKind, Validated Kaizen, output-at-close.

### Kaizen (entity)
- **Canonical.** A validated improvement project — the §2.9 entity, not the methodology.
- **Engine.** Fields per §2.9; FSM `DRAFT → ACTIVE → IN_REMEASUREMENT → CLOSED`; single active in MVP.
- **Source.** ARCHITECTURE §2.9, §3.3.
- **Related.** projectType, phase, closeKind.

### PdcaExperiment
- **Canonical.** Parent hypothesis entity binding 48-hour PDCA ticks of catalog #12.
- **Engine.** Entity §2.13; FSM `PLAN/DO/CHECK/ACT → CLOSED`; `closedReason ∈ {GRADUATED, ABANDONED, SUPERSEDED_BY_KAIZEN}`.
- **Source.** ARCHITECTURE §2.13; ADHOC_PDCA_STANDARD §1.B, §2.B.
- **Related.** PDCA-orphan-tick, PDCA-tick-10.

### Phase FSM
- **Canonical.** Per-projectType phase state machine on `Kaizen.phase`, gated by `canAdvancePhase()`.
- **Engine.** Accelerator: PHASE_0..PHASE_4; Kaizen 90: PRE_EVENT / EVENT / POST_EVENT / SUSTAIN.
- **Source.** ARCHITECTURE §3.4, §3.4.1.
- **Related.** Phase gate, weighted Phase 3→4, Sustainment Gate.

### Remeasurement
- **Canonical.** Post-improvement metric tied to a Kaizen; must match Baseline metric definition.
- **Engine.** Entity §2.11; required for `IN_REMEASUREMENT → CLOSED`.
- **Source.** ARCHITECTURE §2.11; PRODUCT_BLUEPRINT §4.1.
- **Related.** HARD RULE, beatsBaseline, method parity.

### ROI formula
- **Canonical.** `roi = (annualBenefitsDollars - implementationCostDollars) / implementationCostDollars`.
- **Engine.** Pure function `RoiEngine.computeRoi`; null when either input null or cost is 0.
- **Source.** ARCHITECTURE §2.9 computed; PROJECT_TYPE_30D_KAIZEN §6.1.
- **Related.** RoiPanel, Finance co-sign, two-pass ROI.

### Sustainment Gate
- **Canonical.** Kaizen-90 guard: Facilitator attests adoption ≥80% × 2 consecutive working weeks, no rollback events.
- **Engine.** `Kaizen.sustainmentGatePassed === true` required for `ACTIVE → IN_REMEASUREMENT` when `projectType='KAIZEN_EVENT_90D'`.
- **Source.** KAIZEN_EVENT_STANDARD §2.17; ARCHITECTURE §3.4.1.
- **Related.** Sustainment, rollback events.

### two-pass FBT
- **Canonical.** DMAIC Financial Benefit Translator scheduled twice: pass 1 projected (Improve-close), pass 2 actual (Control-close).
- **Engine.** `Kaizen.roiPassNumber ∈ {1,2}`; `roiProjections[]` retains both rows with `reconciliationDeltaPercent` on pass 2.
- **Source.** DMAIC_STANDARD §1.5 refinement #4; ARCHITECTURE §2.9.
- **Related.** Finance Partner, Financial Benefit Translator.

### Validated Kaizen
- **Canonical.** A CLOSED Kaizen with a captured Remeasurement on the same metric definition as Baseline.
- **Engine.** Portfolio-visible; drives §7.5 post-launch KPI; honest failures count.
- **Source.** PRODUCT_BLUEPRINT §7.2; DMAIC_STANDARD Glossary.
- **Related.** HARD RULE, closeKind, ValidatedKaizenPortfolio.

### validatedRootCauseArtifactRef
- **Canonical.** DMAIC-only field on Kaizen proving root cause has passed confound check.
- **Engine.** `{ schema, value, confoundCheckPassed: boolean, validatedBy, validatedAt }`; required non-null + `confoundCheckPassed=true` before Analyze → Improve.
- **Source.** ARCHITECTURE §2.9; DMAIC_STANDARD §1.5 refinement #2.
- **Related.** validated-root-cause invariant, Vital few X.

---

## §6 Evidence

### cluster
- **Canonical.** Group of `FrictionSignal` rows grouped by `tag` by `KaizenCandidateQueue`.
- **Engine.** Surfaced at Weekly Reflection step 4; user promotes at most one per week.
- **Source.** ARCHITECTURE §6.2; UX_FLOWS §2.3.
- **Related.** FrictionSignal, dismissed cluster history.

### dismissed cluster history
- **Canonical.** Per-tag record of when a cluster was dismissed, kept so re-surfacing gets contextual microcopy.
- **Engine.** `bamx:v1:clusterDismissals` keyed by tag: `{ lastDismissedAt, dismissedCount, lastReasonSummary }`.
- **Source.** ARCHITECTURE §7.1; §6.2.
- **Related.** cluster, WeeklyReflectionWizard.

### End-of-Activity Reflection (evidence)
- **Canonical.** 60-sec structured close prompt capturing plan-vs-actual + optional friction tag.
- **Engine.** `Reflection(kind='END_OF_ACTIVITY')` 1:1 with the closed ScheduledActivity.
- **Source.** UX_FLOWS §2.2; ARCHITECTURE §2.6.
- **Related.** pending reflection, on-time reflection.

### Friction Signal
- **Canonical.** Tagged friction captured inside a Reflection; raw material for Kaizen promotion.
- **Engine.** `FrictionSignal` entity §2.8; tag ∈ {MEETING_LOAD, CONTEXT_SWITCH, BLOCKED_DEP, TOOL_FRICTION, PRIORITY_INVERSION, OTHER}; immutable after promotion.
- **Source.** ARCHITECTURE §2.8; PRODUCT_BLUEPRINT §5.1.
- **Related.** cluster, Validated Kaizen.

### on-time reflection (15-min rule)
- **Canonical.** Reflection captured within 15 min of `actualEndAt` counts toward the reflection-rate KPI.
- **Engine.** `MetricsService` filter: `pending=false AND capturedAt - actualEndAt <= 15 min`.
- **Source.** ARCHITECTURE §2.6 invariants; PRODUCT_BLUEPRINT §7.3.
- **Related.** pending reflection, reflection rate.

### pending reflection
- **Canonical.** Auto-stubbed `Reflection` row with `pending=true` emitted at close of non-optional ScheduledActivity.
- **Engine.** Flips `false` on capture; text optional but at least one of whatWentWell/whatToImprove required.
- **Source.** ARCHITECTURE §2.6; §6.1 `ReflectionStubbed` event.
- **Related.** End-of-Activity Reflection, on-time reflection.

### Validated Kaizen portfolio
- **Canonical.** Portfolio view of all CLOSED Kaizens with valid Remeasurements (honest failures included).
- **Engine.** Introduced by E14 epic; sourced from `Kaizen` rows `state='CLOSED'` with closeKind ∈ {SUCCESS, PARTIAL, FAILED_HONEST}.
- **Source.** ARCHITECTURE decisions §9 #22 (E14); DELIVERY_PLAN.
- **Related.** Validated Kaizen, closeKind.

### Weekly Reflection (evidence)
- **Canonical.** 20-min guided DMAIC-style capture over the week's Reflections, Variances, FrictionSignals.
- **Engine.** `Reflection(kind='WEEKLY')` + optional `KaizenPromoted`; dmaicDraft 4 fields required to save.
- **Source.** UX_FLOWS §2.3; ARCHITECTURE §2.6.
- **Related.** WeeklyReflectionWizard, dmaicDraft.

---

## §7 Roles

### Analyst
- **Canonical.** Quant / data role on DMAIC projects (MSA, regression, control charts).
- **Engine.** `User.roles` includes `'ANALYST'`.
- **Source.** ARCHITECTURE §2.3; DMAIC_STANDARD §1.
- **Related.** Black Belt, SME.

### BAM Champion
- **Canonical.** CI / Kaizen Practitioner BAM role — runs portfolio of Kaizens.
- **Engine.** `User.roles` includes `'CHAMPION'`.
- **Source.** PRODUCT_BLUEPRINT §6.4; ARCHITECTURE §2.3.
- **Related.** BAM roles.

### BAM Facilitator
- **Canonical.** Team Manager / scrum-master BAM role — owns Sprint Planning facilitation.
- **Engine.** `User.roles` includes `'FACILITATOR'`.
- **Source.** PRODUCT_BLUEPRINT §6.3; ARCHITECTURE §2.3.
- **Related.** Facilitator, BAM roles.

### BAM Leader
- **Canonical.** Product / Program Leader BAM role.
- **Engine.** `User.roles` includes `'LEADER'`.
- **Source.** PRODUCT_BLUEPRINT §6.2.
- **Related.** BAM roles.

### BAM Practitioner
- **Canonical.** Primary MVP persona — knowledge worker running Daily/Weekly cycles.
- **Engine.** `User.roles` includes `'PRACTITIONER'`.
- **Source.** PRODUCT_BLUEPRINT §6.1.
- **Related.** BAM roles.

### Black Belt
- **Canonical.** DMAIC project lead; typically 50–100% dedicated.
- **Engine.** Black-Belt review gates catalog procedure authoring; participates as `User` with appropriate roles.
- **Source.** DMAIC_STANDARD §1.1, §11.7.
- **Related.** Master Black Belt, Analyst.

### Executive Sponsor
- **Canonical.** Signs Charter / Pilot / Close gates; P&L-owning executive.
- **Engine.** `User.roles` includes `'EXECUTIVE_SPONSOR'`; seen at Gate 1/4/5 in DMAIC.
- **Source.** DMAIC_STANDARD §11.7; ARCHITECTURE §2.3.
- **Related.** Sponsor, Finance Partner.

### Facilitator
- **Canonical.** Project-type facilitator role (Kaizen Event / Kaizen 90 / Accelerator).
- **Engine.** Attests Sustainment Gate; drives phase advancement UI.
- **Source.** KAIZEN_EVENT_STANDARD §1; ACCELERATOR_STANDARD §1.
- **Related.** BAM Facilitator, Process Owner.

### Finance Partner
- **Canonical.** Co-signs ROI on any Kaizen with non-null implementationCost or annualBenefits.
- **Engine.** `User.roles` includes `'FINANCE_PARTNER'`; co-signer userId recorded on ROI artifact.
- **Source.** ARCHITECTURE §2.9 Finance partner co-sign; DMAIC_STANDARD §1.6 CSF #5.
- **Related.** ROI formula, two-pass FBT.

### Implementation Lead
- **Canonical.** Kaizen-90 dedicated Post-Event implementation owner; distinct from Facilitator and Process Owner.
- **Engine.** `User.roles` includes `'IMPLEMENTATION_LEAD'`; `Kaizen.implementationLeadUserId` required non-null at create.
- **Source.** KAIZEN_EVENT_STANDARD §1; ARCHITECTURE §2.3, §2.9.
- **Related.** Facilitator, Process Owner.

### Master Black Belt
- **Canonical.** Senior DMAIC reviewer; runs gate-review questions + statistical waivers.
- **Engine.** `User.roles` includes `'MASTER_BLACK_BELT'`.
- **Source.** DMAIC_STANDARD §11.7.
- **Related.** Black Belt, Vital few X.

### Process Owner
- **Canonical.** Owns the redesigned process after sustainment; accepts Kaizen at transition.
- **Engine.** `User.roles` includes `'PROCESS_OWNER'`; signs `#50` Transition.
- **Source.** DMAIC_STANDARD §11.7; KAIZEN_EVENT_STANDARD §2.
- **Related.** Kaizen Process Owner Transition (#50), Control Plan.

### SME
- **Canonical.** Subject-matter expert; participates in SIPOC / FMEA / root-cause work.
- **Engine.** `User.roles` includes `'SME'`.
- **Source.** ARCHITECTURE §2.3.
- **Related.** Analyst, Process Owner.

### Sponsor
- **Canonical.** Project sponsor (P&L authority) — approves Charter and Close.
- **Engine.** Named role on `Kaizen.actions[].ownerRef` and Charter artifact.
- **Source.** ACCELERATOR_STANDARD §2.3; DMAIC_STANDARD §2.1.
- **Related.** Executive Sponsor, Finance Partner.

---

## §8 Capacity

### 4-2-2 invariant
- **Canonical.** Daily buckets `{ PROJECT: 240, COMMUNICATION: 120, CI: 120 }` (total 480 min / 8h).
- **Engine.** Enforced by `InvariantEngine.validateComposition()`; buckets scale proportionally on reduced-day capacity.
- **Source.** ARCHITECTURE §5.1, §5.2.
- **Related.** The 4-2-2 Day, bucket floors, bucket ceilings.

### bucket ceilings (110/125/125)
- **Canonical.** Hard per-bucket overpack limits: PROJECT ≤ 264 min (110%), COMMUNICATION ≤ 150 min (125%), CI ≤ 150 min (125%).
- **Engine.** `InvariantEngine.validateComposition()` rejects with `PROJECT_OVERPACKED` / `COMM_OVERPACKED` / `CI_OVERPACKED`.
- **Source.** ARCHITECTURE §5.6.
- **Related.** 4-2-2 invariant, OVER_CAPACITY.

### bucket floors (50%)
- **Canonical.** Minimum viable 4-2-2 — each bucket must hit ≥ 50% of its target (PROJECT ≥ 120, COMMUNICATION ≥ 60, CI ≥ 60).
- **Engine.** Fails with `DEEP_UNDER_FLOOR` / `COMM_UNDER_FLOOR` / `CI_UNDER_FLOOR`.
- **Source.** ARCHITECTURE §5.2, §5.6.
- **Related.** bucket ceilings, InfeasibleResult.

### Deep slicing preference
- **Canonical.** `User.deepSlicePreference ∈ {'2x2h','4x1h'}` — how the PROJECT bucket is sliced on a Cadence Day.
- **Engine.** Default `'2x2h'`; composer reads it at Daily compose.
- **Source.** ARCHITECTURE §2.3, §4.2.
- **Related.** Deep Block, auto-composer.

### externalMinutesToday
- **Canonical.** One-day capacity reservation on `Composition(DAILY)` for pre-existing external meetings.
- **Engine.** Default 0, capped 240; subtracted from COMMUNICATION target (never below 60-min floor).
- **Source.** ARCHITECTURE §5.5.
- **Related.** External Meeting, bucket floors.

### Sustainment Gate math (80% × 2 weeks)
- **Canonical.** Adoption ≥ 80% on each of 10 consecutive working days; no rollback events.
- **Engine.** `canAttemptRebaseline(kaizen, adoptionLog)` computes eligibility; Facilitator attestation flips flag.
- **Source.** KAIZEN_EVENT_STANDARD §2.17; ARCHITECTURE §3.4.1.
- **Related.** Sustainment Gate, Sustainment.

### Weekly PROJECT floor (1200 min)
- **Canonical.** Cross-day invariant: sum of PROJECT minutes across the week ≥ 5 × 240 = 1200 min (20h protected Deep).
- **Engine.** Checked by Weekly composer; no single day may exceed `userDailyCapacityMinutes`.
- **Source.** ARCHITECTURE §5.3.
- **Related.** 4-2-2 invariant, Deep Block.

---

## §9 Events

Exactly 25 MVP events per `ARCHITECTURE.md` §6.1. Alphabetized.

| Event | One-line payload summary |
|---|---|
| `ActivityCompleted` | `{ scheduledActivityId, outputArtifactRef, actualDurationMinutes }` — close of a ScheduledActivity. |
| `ActivityStarted` | `{ scheduledActivityId, startedAt }` — user tapped Start. |
| `ActivityStartedLate` | `{ scheduledActivityId, minutesLate }` — started > 5 min past `plannedStartAt`. |
| `ComposerInfeasible` | `{ userId, date, result: InfeasibleResult }` — composer returned INFEASIBLE. |
| `CompositionClosed` | `{ compositionId }` — composition window ended; triggers next proposal. |
| `CompositionStarted` | `{ compositionId }` — clock reached `startAt`. |
| `CycleAccepted` | `{ compositionId, cycleType, edited: boolean }` — PROPOSED → ACCEPTED. |
| `CycleEdited` | `{ compositionId, editedActivityIds }` — user edited the proposal. |
| `CycleProposed` | `{ compositionId, cycleType }` — composer produced a proposal. |
| `CycleRejected` | `{ compositionId, reason }` — user rejected the proposal. |
| `FrictionSignalCaptured` | `{ frictionSignalId, reflectionId }` — friction tag set in a Reflection. |
| `KaizenBaselineLocked` | `{ kaizenId, baselineMetricId }` — BaselineMetric.locked = true. |
| `KaizenClosed` | `{ kaizenId, closeKind }` — Kaizen reached CLOSED. |
| `KaizenPromoted` | `{ kaizenId, fromFrictionSignalIds }` — user promoted a cluster to a Kaizen. |
| `KaizenRemeasured` | `{ kaizenId, remeasurementId, beatsBaseline }` — Remeasurement captured. |
| `PdcaExperimentClosed` | `{ pdcaExperimentId, closedReason }` — CLOSED with GRADUATED / ABANDONED / SUPERSEDED_BY_KAIZEN. |
| `PdcaExperimentOpened` | `{ pdcaExperimentId, userId, hypothesis }` — experiment created. |
| `PdcaTickCommitted` | `{ pdcaExperimentId, scheduledActivityId, measurement, consecutiveTargetHits }` — tick #n committed. |
| `ProjectPaceWarning` | `{ kaizenId, projectType, phase, expectedMaxDays, actualDays, kind }` — soft pace warning (replaces v0.4 `AcceleratorPaceWarning`). |
| `ProjectPhaseAdvanced` | `{ kaizenId, projectType, fromPhase, toPhase, advancedAt }` — phase FSM advanced. |
| `ReflectionCaptured` | `{ reflectionId, scheduledActivityId, onTime: boolean }` — user captured the reflection text. |
| `ReflectionStubbed` | `{ reflectionId, scheduledActivityId, pending: true }` — auto-stub at activity close. |
| `ScopeChangeRequested` | `{ kaizenId, requestedBy, reason, impactAssessment, approved, approvedAt, approvedBy }` — audit-only; does not pause Kaizen. |
| `VarianceLogged` | `{ varianceId, kind, reasonCode, catalogEntryId }` — append-only variance row written. |
| `WeeklyReflectionCompleted` | `{ reflectionId, compositionId, promotedKaizenId?: string }` — Fri wizard closed. |

---

## §10 Entities & Keys

### Entity table (14)

| # | Entity | One-line purpose |
|---|---|---|
| 1 | `CatalogEntry` | Vetted named standard-work activity; the primitive. |
| 2 | `User` | Single user (MVP); roles, capacity, deepSlicePreference, workDays. |
| 3 | `Composition` | Instance of a Cycle Type (Daily / Weekly / Sprint / Monthly). |
| 4 | `ScheduledActivity` | Instance of a `CatalogEntry` placed inside a Composition. |
| 5 | `Reflection` | Plan-vs-actual + optional friction tag at activity close (or Weekly DMAIC). |
| 6 | `Variance` | Append-only logged skip / override / rescheduling / edit. |
| 7 | `FrictionSignal` | Tagged friction captured in a Reflection; cluster candidate. |
| 8 | `Kaizen` | Validated improvement project; FSM + projectType discriminator. |
| 9 | `BaselineMetric` | Locked measurement at Kaizen start. |
| 10 | `Remeasurement` | Post-improvement metric; must match Baseline definition. |
| 11 | `MetricsSnapshot` | Derived rolling 14-day adherence / acceptance / delta snapshot. |
| 12 | `PdcaExperiment` | Parent hypothesis for 48-hour PDCA ticks (catalog #12). |
| 13 | `AgentSuggestion` | AI-layer output cache row (see §11). |
| 14 | `AgentTelemetryEvent` | Append-only AI-layer telemetry triple (input, output, user action). |

Note. `Intention` is a **field** on `ScheduledActivity`, not a standalone entity (§2.1).

### `bamx:v1:*` localStorage keys

- `bamx:v1:meta` — schemaVersion + lastMigratedAt + createdAt.
- `bamx:v1:user` — single `User` row.
- `bamx:v1:catalog` — keyed map of `CatalogEntry`.
- `bamx:v1:compositions` — keyed map of `Composition`.
- `bamx:v1:activities` — keyed map of `ScheduledActivity`.
- `bamx:v1:reflections` — keyed map of `Reflection`.
- `bamx:v1:variances` — keyed map of `Variance` (append-only).
- `bamx:v1:frictions` — keyed map of `FrictionSignal`.
- `bamx:v1:kaizens` — keyed map of `Kaizen`.
- `bamx:v1:baselines` — keyed map of `BaselineMetric`.
- `bamx:v1:remeasurements` — keyed map of `Remeasurement`.
- `bamx:v1:metrics` — keyed map of `MetricsSnapshot` (latest 30).
- `bamx:v1:pdca` — keyed map of `PdcaExperiment` (active + last 10 closed).
- `bamx:v1:clusterDismissals` — per-`FrictionSignal.tag` dismissal history.
- `bamx:v1:agent-suggestions` — AI-layer output cache (cap 500).
- `bamx:v1:agent-telemetry` — AI-layer telemetry ring buffer (cap 1000).
- `bamx:v1:events-log` — optional event ring buffer (cap 1000).
- `bamx:v1:backup:preMigrate:<timestamp>` — pre-migration snapshot.
- `bamx:v1:archive:<yyyymm>` — archived compositions > 90 days old.

---

## §11 AI Agents

### AgentSuggestion
- **Canonical.** Discriminated-union AI-layer output object carrying `kind`, `slot`, `basisEntityRefs[]`, `lifecycle`.
- **Engine.** Kinds: `MICROCOPY`, `RANKED_OPTION`, `HIGHLIGHT`, `CONTEXT_CARD`, `REFLECTION_PROMPT_AUGMENT`.
- **Source.** AI_AGENTS §3.2, §2 per-agent listings.
- **Related.** Why-chip, ArtifactPreview.

### AgentTelemetryEvent
- **Canonical.** Append-only triple logging input entities + output suggestion + user action at three lifecycle points.
- **Engine.** Persisted to `bamx:v1:agent-telemetry`; lifecycle values `PROPOSED`, `DISPLAYED`, `ACTED_ON | DISMISSED | EXPIRED`.
- **Source.** AI_AGENTS §1.6, §3.3.
- **Related.** AgentSuggestion, KPI lift.

### ArtifactPreview (agent surface)
- **Canonical.** Non-blocking read-only preview of a related `outputArtifactRef` or `CatalogEntry.procedure` excerpt.
- **Engine.** Surfaced by the Context Agent into the activity runner and composer Edit mode.
- **Source.** AI_AGENTS §2 Agent 3; UX_FLOWS §3.11.
- **Related.** Context Agent, why-chip.

### Composer Explainer Agent
- **Canonical.** Read-only agent turning `Composition.composerInputsSnapshot.explain[]` into the why-chip microcopy on ScheduledActivityBlock.
- **Engine.** KPI target: composition acceptance rate (same as Planning).
- **Source.** AI_AGENTS §2 Agent 5.
- **Related.** why-chip, CycleCard.

### Context Agent
- **Canonical.** Surfaces related artifacts / procedure excerpts in the activity runner + composer Edit.
- **Engine.** KPI target: output-artifact completeness + Deep minutes/week.
- **Source.** AI_AGENTS §2 Agent 3.
- **Related.** ArtifactPreview.

### Momentum Agent
- **Canonical.** Nudges on start-on-time and standard-work adherence; subscribes to `ActivityStartedLate` and `VarianceLogged` clusters.
- **Engine.** KPI target: adherence + start-on-time leading indicator.
- **Source.** AI_AGENTS §2 Agent 2.
- **Related.** adherence, ActivityStartedLate.

### Planning Agent
- **Canonical.** Ranks configurable slots in a proposed `Composition`; never re-schedules.
- **Engine.** KPI target: composition acceptance rate (≥60% Daily / ≥50% Weekly).
- **Source.** AI_AGENTS §2 Agent 1.
- **Related.** Composition, CycleCard.

### Reflection Agent
- **Canonical.** Surfaces pre-reads and pre-selected clusters into the WeeklyReflectionWizard; emits the tick-10 PDCA mandatory-review prompt.
- **Engine.** KPI target: reflection rate on-time + validated Kaizens / MAU / month.
- **Source.** AI_AGENTS §2 Agent 4; §1.1 v0.1.1 note.
- **Related.** PDCA-tick-10 invariant, WeeklyReflectionWizard.

### Why-chip
- **Canonical.** Info-chevron on a PROPOSED-state ScheduledActivityBlock showing the Composer Explainer's microcopy.
- **Engine.** Read-only; dismissible; sourced from `composerInputsSnapshot.explain[]`.
- **Source.** UX_FLOWS §3.3; AI_AGENTS §2 Agent 5.
- **Related.** Composer Explainer, ScheduledActivityBlock.

---

## §12 UI Routes & Components

### Routes (MVP)

- `/today` — default landing page; current day's CycleCard / activities.
- `/today/activity/:id` — ScheduledActivity runner (start / work / close).
- `/today/activity/:id/reflect` — 60-sec ReflectionSheet (modal).
- `/today/activity/:id/skip` — reason-code picker (modal).
- `/week` — Weekly composition view (5 columns).
- `/week/compose` — Weekly composer Accept / Edit / Reject.
- `/week/reflect` — 20-min Weekly Reflection wizard.
- `/week/day/:isoDate/compose` — Daily composer Accept / Edit / Reject.
- `/catalog` — browse + enable/disable catalog entries.
- `/catalog/:id` — single entry detail (read-only).
- `/catalog/gaps` — unseeded rows (read-only).
- `/kaizen` — active Kaizen (MVP cap 1).
- `/kaizen/candidates` — FrictionSignal queue (surfaced via Weekly Reflection).
- `/kaizen/:id` — KaizenCard detail.
- `/kaizen/:id/baseline` — BaselineMetric capture (locks on save).
- `/kaizen/:id/phase/:phaseId` — Accelerator phase detail.
- `/kaizen/:id/roi` — Accelerator ROI capture.
- `/kaizen/:id/remeasure` — Remeasurement capture.
- `/kaizen/:id/close` — final close step (HARD RULE).
- `/insights` — three KPIs + variance / friction lists.
- `/insights/variance` — append-only log viewer.
- `/insights/friction` — captured signals (pre-promotion).
- `/settings` — role, capacity, sprint anchor.

### Routes (Next-only placeholders)

- `/sprint`, `/month`, `/team`, `/catalog/editor`, `/integrations` — disabled nav items labeled "Ships in Next".

### Components

- **AdherenceDial** — three KPI numbers (adherence %, composition acceptance %, Kaizen delta) on every page.
- **ArtifactPreview** — sub-component read-only preview of a linked artifact; dismissible.
- **BucketStrip** — 4-2-2 visualization (three stacked horizontal strips).
- **CatalogPicker** — filtered picker for configurable slots in composer Edit.
- **CycleCard** — the single `Composition`'s canvas for Accept / Edit / Reject.
- **IntentionField** — one-line `ScheduledActivity.intention` input; required non-null on non-optionals.
- **KaizenCard** — single-card Kaizen view; refuses close without Remeasurement.
- **PhaseStepper** — Accelerator-only sub-element of KaizenCard (Phase 0–4 horizontal stepper).
- **ReflectionSheet** — 60-sec structured close prompt modal.
- **RoiPanel** — Accelerator-only ROI capture panel on KaizenCard / `/kaizen/:id/roi`.
- **ScheduledActivityBlock** — one `ScheduledActivity` row on the day timeline; carries why-chip.
- **VarianceLogEntry** — row in `/insights/variance`; "Add correction" only (never edit / delete).
- **WeeklyReflectionWizard** — Fri 20-min guided DMAIC flow owning steps 1–5 of §2.3.

---

## §13 Invariants

### 4-2-2 invariant
- **Canonical.** Daily buckets hit 240 / 120 / 120 min with 50% floors and 110/125/125% ceilings.
- **Enforced in.** `InvariantEngine.validateComposition()`.
- **Source.** ARCHITECTURE §5.2, §5.6.

### AD_HOC-targetCloseDate
- **Canonical.** `projectType='AD_HOC'` at create → `targetCloseDate !== null AND > createdAt`.
- **Enforced in.** `KaizenService.promote()`; drives `ProjectPaceWarning` with `kind='AD_HOC_OVERRUN'`.
- **Source.** ADHOC_PDCA_STANDARD §1.A.7 refinement #1; ARCHITECTURE §2.9.

### Control-Plan-Phase-2 (Accelerator)
- **Canonical.** `PHASE_2 → PHASE_3` requires `controlPlanDraftArtifactRef !== null` (authored at Phase 2).
- **Enforced in.** `KaizenService.canAdvancePhase()`.
- **Source.** ACCELERATOR_STANDARD §1.6 refinement #2.

### Finance-co-sign
- **Canonical.** Any Kaizen with non-null `implementationCostDollars` or `annualBenefitsDollars` requires a `FINANCE_PARTNER` co-sign.
- **Enforced in.** `KaizenService.applyRoiArtifact()`.
- **Source.** ARCHITECTURE §2.9; DMAIC_STANDARD §1.6 CSF #5.

### HARD RULE (remeasurement-at-close)
- **Canonical.** `Kaizen.state === 'CLOSED'` → `remeasurementId !== null` AND same-metric as Baseline.
- **Enforced in.** DB `CHECK (state <> 'CLOSED' OR remeasurement_id IS NOT NULL)`; `KaizenService.close()`.
- **Source.** PRODUCT_BLUEPRINT §4.1 item 4; ARCHITECTURE §3.3, §7.3.

### Lessons-Learned-at-CLOSED
- **Canonical.** Every Kaizen close requires a `CLOSED` `Lessons Learned` ScheduledActivity with non-null `outputArtifactRef`.
- **Enforced in.** `KaizenService.close()`.
- **Source.** ARCHITECTURE §2.9; ADHOC_PDCA_STANDARD §10 refinement #2.

### MSA-before-Baseline
- **Canonical.** DMAIC `#28` Baseline cannot CLOSE until `#31` MSA is CLOSED with acceptable Gage R&R.
- **Enforced in.** `CatalogEntry.dependsOn` edge `#28 → [#31]`; `ActivityService.close()` guard.
- **Source.** DMAIC_STANDARD §1.5 refinement #1; ARCHITECTURE §2.9.

### non-optional
- **Canonical.** `isNonOptional=true` entries cannot be deleted; skipping requires reasonCode + Variance.
- **Enforced in.** `CatalogService.delete()`; `ActivityService.skip()`.
- **Source.** PRODUCT_BLUEPRINT §3.4; ARCHITECTURE §2.2 invariants.

### OTHER-requires-note
- **Canonical.** `reasonCode === 'OTHER'` → `note !== null AND note.length > 0`.
- **Enforced in.** `VarianceService.log()` + `ActivityService.skip()`; future Postgres `CHECK`.
- **Source.** ARCHITECTURE §2.5, §2.7.

### output-at-close
- **Canonical.** `ScheduledActivity.state === 'CLOSED'` → `outputArtifactRef !== null` matching schema.
- **Enforced in.** `ActivityService.close()`.
- **Source.** ARCHITECTURE §2.5.

### PDCA-orphan-tick
- **Canonical.** A catalog #12 ScheduledActivity must carry `linkedPdcaExperimentId`.
- **Enforced in.** `ActivityService.start()` when an open experiment exists.
- **Source.** ARCHITECTURE §2.13 invariants.

### PDCA-tick-10
- **Canonical.** At `tickActivityIds.length >= 10`, the Reflection agent emits a mandatory-review prompt (not a hard block).
- **Enforced in.** Reflection Agent (AI_AGENTS §2.4) + telemetry `reviewDecision`.
- **Source.** ARCHITECTURE §2.13; ADHOC_PDCA_STANDARD §2.B + §10.

### reflection-required-non-optional
- **Canonical.** Close of a non-optional ScheduledActivity requires a `Reflection` row (may be `pending=true`).
- **Enforced in.** `ActivityService.close()` + `ReflectionService` auto-stub.
- **Source.** ARCHITECTURE §2.5, §2.6.

### Sustainment-Gate (Kaizen 90)
- **Canonical.** `projectType='KAIZEN_EVENT_90D'` `ACTIVE → IN_REMEASUREMENT` requires `sustainmentGatePassed === true`.
- **Enforced in.** `KaizenService.startRemeasurement()`.
- **Source.** KAIZEN_EVENT_STANDARD §2.17; ARCHITECTURE §2.9.

### two-pass-ROI (DMAIC)
- **Canonical.** DMAIC close requires `roiPassNumber === 2` AND `roiProjections.length === 2`.
- **Enforced in.** `KaizenService.close()`.
- **Source.** DMAIC_STANDARD §1.5 refinement #4; ARCHITECTURE §2.9.

### validated-root-cause (DMAIC)
- **Canonical.** DMAIC Analyze → Improve requires `validatedRootCauseArtifactRef !== null AND confoundCheckPassed === true`.
- **Enforced in.** `KaizenService.canAdvanceDmaicPhase()` / `ComposerService.eligibleDmaicPayloadSteps()`.
- **Source.** DMAIC_STANDARD §1.5 refinement #2.

### Variance-append-only
- **Canonical.** No update, no delete on `Variance` rows; corrections are new rows referencing the erroneous id.
- **Enforced in.** `LocalStorageRepository.appendOnly()`; `REVOKE UPDATE, DELETE ON variances` (future).
- **Source.** ARCHITECTURE §2.7, §7.3.

### weighted-Phase-3 (Accelerator)
- **Canonical.** `PHASE_3 → PHASE_4` requires ≥80% overall action completion AND zero open strategic actions.
- **Enforced in.** `KaizenService.canAdvancePhase()`.
- **Source.** ACCELERATOR_STANDARD §1.6 refinement #5; ARCHITECTURE §2.9.

---

## §14 Methodology Terms

### 5 Whys
- **Canonical.** Iterative root-cause inquiry — five successive "why?" steps back from the symptom.
- **Source.** DMAIC_STANDARD §2.3, Part 6.
- **Related.** Fishbone, Vital few X.

### C&E Matrix
- **Canonical.** Cause-and-Effect prioritization matrix — ranks inputs against weighted outputs.
- **Engine.** DMAIC catalog `#34`; `dependsOn [#21]` (SIPOC).
- **Source.** DMAIC_STANDARD §2.3; CATALOG_GAPS §J.
- **Related.** FMEA, Vital few X.

### Control Chart
- **Canonical.** Time-ordered plot with control limits; Western Electric rules trigger signal detection.
- **Engine.** DMAIC catalog `#29`; stored on `Remeasurement.evidenceRef`.
- **Source.** DMAIC_STANDARD Glossary.
- **Related.** Cp/Cpk, Western Electric rules.

### COPQ
- **Canonical.** Cost of Poor Quality — the financial cost of defects / rework / scrap.
- **Source.** DMAIC_STANDARD §11.6 (intake economics).
- **Related.** Financial Benefit Translator, ROI formula.

### Cp/Cpk
- **Canonical.** Short-term / long-term process capability indices; inputs to `#30` Capability Report.
- **Source.** DMAIC_STANDARD Glossary.
- **Related.** Ppk, Control Chart.

### DMAIC phases
- **Canonical.** Define → Measure → Analyze → Improve → Control.
- **Engine.** Derived via `phaseFor()` from closed catalog steps; no stored `Kaizen.phase`.
- **Source.** DMAIC_STANDARD §2; ARCHITECTURE §2.9.
- **Related.** Phase derivation.

### Fishbone
- **Canonical.** Ishikawa diagram — 6M (Man/Machine/Method/Material/Measurement/Environment) brainstorm.
- **Source.** DMAIC_STANDARD §2.3; KAIZEN_EVENT_STANDARD §2 Day 2.
- **Related.** 5 Whys, C&E Matrix.

### FMEA
- **Canonical.** Failure Modes and Effects Analysis; RPN = Severity × Occurrence × Detection.
- **Engine.** DMAIC catalog `#37`; Kaizen catalog `#47`.
- **Source.** DMAIC_STANDARD Glossary; CATALOG_GAPS §J.
- **Related.** Risk Plan, C&E Matrix.

### Gage R&R
- **Canonical.** Gage Repeatability & Reproducibility — continuous-measurement MSA study.
- **Engine.** Pass criterion: `%R&R < 30%`; input to `#31` MSA Report.
- **Source.** DMAIC_STANDARD Glossary, §2.2; CATALOG_GAPS §J.
- **Related.** Kappa, MSA-before-Baseline.

### SIPOC
- **Canonical.** Suppliers / Inputs / Process / Outputs / Customers — scope boundary map.
- **Engine.** DMAIC catalog `#21`; Kaizen catalog `#45`.
- **Source.** DMAIC_STANDARD §2.1; PRODUCT_BLUEPRINT §2.
- **Related.** Charter, VOC/VOB/VOA.

### TIMWOODS
- **Canonical.** 8 lean wastes — Transport, Inventory, Motion, Waiting, Overproduction, Overprocessing, Defects, Skills.
- **Engine.** Accelerator task `30d_1_4` "Identify Waste (TIMWOODS)"; referenced in Kaizen walk.
- **Source.** CATALOG_GAPS §I.1; ACCELERATOR_STANDARD §2.9.
- **Related.** Current-state map, waste identification.

### VOC/VOB/VOA
- **Canonical.** Voice of the Customer / Business / Analyst — stakeholder needs translated to CTQ.
- **Engine.** DMAIC catalog `#26`; `dependsOn [#23]`.
- **Source.** DMAIC_STANDARD §2.1; CATALOG_GAPS §J.
- **Related.** CTQ, SIPOC.

### Western Electric rules
- **Canonical.** Classic 4-rule Control Chart signal-detection set (Rule 1–4 for out-of-control patterns).
- **Source.** DMAIC_STANDARD Glossary, Part 6.
- **Related.** Control Chart.

---

## §15 Deprecated — old term → canonical replacement

| Old term | Canonical replacement | Rationale / source |
|---|---|---|
| **"Kaizen Accelerator"** (as tool / product name) | **CadencePlan + The Accelerator (feature)** | CadencePlan is the product; The Accelerator is the 30-day project-type offering within it (ACCELERATOR_STANDARD Glossary). |
| **AcceleratorPaceWarning** | **ProjectPaceWarning** | Breaking event rename in ARCHITECTURE v0.5; payload adds `projectType` discriminator (ARCHITECTURE decisions §9 #19). |
| **BAM-X Kaizen OS** | **CadencePlan + BAM OS** | CadencePlan is user-facing; BAM OS is the internal engine reference (ACCELERATOR_STANDARD Glossary; DMAIC_STANDARD §4062). |
| **End-of-day Reflection (meta)** | **End-of-Activity Reflection** | Canonical rename per ARCHITECTURE decisions §9 #10; matches CATALOG_GAPS §H.2. |
| **"Intentions" (primary object)** | **`ScheduledActivity.intention` field** | Intention is a field on ScheduledActivity (§2.5), not an entity; "old prompt" vocabulary superseded by ARCHITECTURE §2.1 note and the preamble in ARCHITECTURE line 8. |

### Cross-doc inconsistencies observed (flagged here per task brief)

1. ARCHITECTURE §4.2 pseudo-code still uses the label "End-of-day Reflection (meta)" in one place (line 806) — canonical is **End-of-Activity Reflection** (per decisions #10).
2. `PdcaExperiment` is described in `ADHOC_PDCA_STANDARD §1.C` as PDCA row in a *project-type* matrix but is a **separate entity**, not a `Kaizen.projectType` value; canonical framing in ARCHITECTURE §2.13.
3. `Kaizen.actions[]` extension fields (`strategic`, `sprint`, `acceptanceCriterion`) are used by Kaizen 90 until the separate `ImplementationBacklog` entity ships in E18 — treat current schema as the canonical source (ARCHITECTURE §2.9).

---

*End of GLOSSARY.md — v1.0.*
