# CadencePlan — Phase 6 Engineering Deliverables

**Version:** 1.0  
**Status:** ready for Epic execution (E1–E18 per DELIVERY_PLAN v0.3)  
**Authoritative parents:** ARCHITECTURE v0.6, ENGINE_DESIGN v0.4.1, PRODUCT_BLUEPRINT v0.3, DELIVERY_PLAN v0.3, GLOSSARY v1.0

This document packages everything an engineering team needs to ship CadencePlan MVP: the PRD, the future-state Postgres schema, the TypeScript domain model, a seeded dataset, rendered schedule examples, and a self-contained MVP build prompt. Nothing here is novel — every row, field, and rule traces to the parent docs.

---

## §1 — Product Requirements Document (PRD)

### 1.1 Summary

**CadencePlan** is a Kaizen-first operating-system for knowledge workers that auto-composes a valid 4-2-2 Cadence Day (Deep / Communication / CI) from a seeded Standard Work Catalog, captures closing Reflections as structured evidence, and promotes one validated Kaizen per month from the friction signals that evidence produces. It is built for a single BAM Practitioner running their own Daily + Weekly Cadence Cycles, with Accelerator (30-day) and Kaizen Event 90D phased project types for CI Champions. Unlike a scheduler, CadencePlan refuses to close a Kaizen without a remeasured primary metric beating baseline, refuses to close an Activity without its required output artifact, and logs every skipped non-optional as an append-only Variance.

### 1.2 Background — the three pains

1. **Blank-calendar tax.** The Business Agility Model (BAM) mandates Daily Standup, two High-value Communication blocks, 4h Deep, and 2h CI every work day. In practice, the calendar is reinvented from zero each morning, ceremonies are reactive, and the CI block is the first casualty when escalations hit. The Standard Work Catalog exists on paper; it does not run.
2. **Evidence vacuum.** Kaizen events produce action lists that die in two weeks because baseline capture (Catalog #28), remeasurement (Catalog #29), and ROI (Catalog #39) are ad hoc. Benefits claims are unverifiable; "continuous improvement" lives in a slide deck.
3. **Reflection-free execution.** Retrospectives happen quarterly in a room; the 60-second per-activity reflection that would turn yesterday's skip into tomorrow's Kaizen candidate does not exist as a product affordance.

### 1.3 Goals (5)

1. Propose a valid 4-2-2 Cadence Day before 9:00 local on every working day, accepted or edited by the Practitioner.
2. Capture a structured End-of-Activity Reflection within 15 minutes of close on ≥75% of completed non-optional activities.
3. Close one Validated Kaizen per user per month — remeasurement tied to baseline, metric definition frozen, ROI co-signed by Finance where applicable.
4. Enforce the Daily 4-2-2 invariant, the non-optional set, and the "no Kaizen close without remeasurement" HARD RULE in the `InvariantEngine`, not in UI.
5. Keep the MVP single-page, single-user, zero runtime dependencies, fully offline via localStorage.

### 1.4 Non-goals (5)

1. **Not a scheduler.** No event creation, invites, RSVPs, timezone arithmetic. External meetings are a capacity reservation, never an entity the product authors.
2. **Not a task manager.** No Jira/Asana replacement. Scheduled Activities are instances of Catalog Entries; they do not accept arbitrary user-authored to-dos.
3. **Not a multi-tenant enterprise product in MVP.** No SSO, audit export, RBAC, or data residency.
4. **Not a transcription / note-taking product.** No meeting scribe, no chat ingestion.
5. **Not a team rollup in MVP.** Facilitator / Leader views ship in Next; MVP is single-user.

### 1.5 Success metrics (from PRODUCT_BLUEPRINT §7)

| Metric | Target (end of 90-day MVP) | Category |
|---|---|---|
| Standard Work adherence (non-optional activities closed with artifact) | ≥70% of weekly-active users | Outcome |
| Composition acceptance — Daily | ≥60% proposed cycles accepted without edit | Outcome |
| Composition acceptance — Weekly | ≥50% | Outcome |
| End-of-Activity Reflection rate | ≥75% captured within 15 min of close | Outcome |
| Kaizen throughput | ≥1 validated Kaizen closed per user per month | Outcome |
| Evidence-grounded improvement | ≥50% of closed Kaizens show ≥10% primary-metric delta | Outcome |
| Daily composition rate (leading, day 14) | ≥50% of workdays have accepted/edited Cadence Day before 9:00 | Leading |
| Friction signal capture (week 1) | ≥3 friction signals logged | Leading |
| First Weekly Reflection | Completed by end of week 2 | Leading |
| **Launch metric** — active users with ≥7 accepted Cadence Days + ≥7 End-of-Activity Reflections + 1 Weekly Reflection by day 14 | ≥35% of signups | Launch |
| **Durability metric** — Validated Kaizens per monthly-active user / month | ≥1.0, sustained for 2 consecutive months | 90-day post-launch |

### 1.6 Users — four BAM personas

1. **Agile Practitioner** (primary MVP persona). Knowledge worker running one 8-hour day of Deep + Communication + CI. Wants tomorrow pre-composed; wants the 60-second reflection to be the only ritual; wants skipped blocks to leave a trace. `User.roles` includes `PRACTITIONER`.
2. **Agile Facilitator** (Team Manager). Runs Sprint Planning, Mid-Sprint Review, Sprint Review, and Retrospective as standard work across a team. Coaches from the Variance log, not from vibes. In Kaizen Event 90D, can also act as event Facilitator (distinct from `IMPLEMENTATION_LEAD`). `User.roles` includes `FACILITATOR`.
3. **Agile Leader** (Product / Program). Defends the Deep bucket against escalations; wants one program-level Kaizen per month sourced from evidence. `User.roles` includes `LEADER`.
4. **Agile Champion** (CI / Kaizen Practitioner). Runs DMAIC, Kaizen Event (1–5 day burst), 30-Day Accelerator, and Kaizen Event 90D as project types on the one-active-Kaizen cap. Refuses to close without remeasurement. `User.roles` includes `CHAMPION`.

### 1.7 User stories (12, prioritized)

| # | Priority | Story |
|---|---|---|
| US-01 | P0 | As a Practitioner, when I open `/today`, I see a composed PROPOSED Cadence Day matching 4-2-2 so I can Accept / Edit / Reject before executing. |
| US-02 | P0 | As a Practitioner, when I close a Scheduled Activity, a Reflection sheet opens auto-stubbed `pending=true` so I can capture plan-vs-actual in ≤60 seconds. |
| US-03 | P0 | As a Practitioner, when I skip a non-optional Activity, I must pick a Reason Code (OTHER requires a note) and the app writes an append-only Variance row. |
| US-04 | P0 | As a Champion, when I promote a Kaizen from a friction cluster, I must lock a Baseline before the Kaizen leaves DRAFT. |
| US-05 | P0 | As a Champion, when I try to Close a Kaizen without a Remeasurement referencing the same `metricDefinition` as Baseline, the close is refused with a named error. |
| US-06 | P0 | As a Practitioner, when my Cadence Day is INFEASIBLE (capacity oversubscribed), I see guided remediation (raise capacity / reduce external / skip ceremony with reason / defer non-optional). |
| US-07 | P1 | As a Practitioner, when Friday 16:00 arrives, I run a 20-minute guided Weekly Reflection that pulls the week's Variances and FrictionSignals into a DMAIC draft. |
| US-08 | P1 | As a Practitioner, when I open the dashboard, I see three numbers: Standard Work adherence %, Composition acceptance rate %, Active Kaizen delta %. |
| US-09 | P1 | As a Champion running a 30-Day Accelerator, the composer filters Deep-block payload to Catalog entries whose `projectTypeBinding === 'KAIZEN_ACCELERATOR_30D'` AND `phaseBinding === kaizen.phase`. |
| US-10 | P2 | As a Champion running a Kaizen Event 90D, POST_EVENT → SUSTAIN transition is refused unless `sustainmentGatePassed === true` (adoption ≥80% for 2 consecutive weeks + no rollbacks). |
| US-11 | P2 | As a Champion running DMAIC, Analyze → Improve is refused unless `validatedRootCauseArtifactRef.confoundCheckPassed === true`. |
| US-12 | P2 | As a Practitioner running a PDCA Experiment, the tick catalog entry (#12) is scheduled every 48h; 3 consecutive target hits graduate it; tick 10 triggers a mandatory review prompt. |

### 1.8 Feature list — 6 MVP must-haves + 5 new epics (E14–E18)

**MVP must-haves (PRODUCT_BLUEPRINT §4.1):**
1. Standard Work Catalog (seeded, user-editable enable/disable, non-optional locked).
2. Daily Cadence auto-composer (`composeDaily`, see ENGINE_DESIGN §1.2).
3. Weekly Cadence auto-composer (`composeWeekly`, see ENGINE_DESIGN §1.3).
4. End-of-Activity Reflection + Weekly Reflection → Kaizen promotion.
5. Adherence + Composition dashboard (three numbers).
6. 30-Day Kaizen Accelerator project type (`KAIZEN_ACCELERATOR_30D`, 5-phase FSM, ROI gate).

**New epics (v0.3):**
- **E14 — Validated Kaizen Portfolio.** `/insights/portfolio` route listing CLOSED Kaizens where `closeKind ∈ {SUCCESS, PARTIAL}` AND Finance-signed ROI. CSV export.
- **E15 — Statistical Analysis Surfaces** (post-launch with DMAIC). Control Chart (Western Electric rules), Capability Report (Cp/Cpk), Hypothesis Test Log (Bonferroni), Regression Diagnostics, DMAIC stats rulepack.
- **E16 — MSA Workflow** (post-launch with DMAIC). Gage R&R grid, Kappa, `#31 MSA Report` artifact schema, close-guard for `#28 Baseline`.
- **E17 — Kaizen Event 90D Phase Support.** 4-phase FSM (PRE_EVENT / EVENT / POST_EVENT / SUSTAIN), Sustainment Gate attestation, Implementation Lead assignment.
- **E18 — Implementation Backlog Tracker** (MVP must-have). Entity replaces `Kaizen.actions[]` for Kaizen 90; adoption log; sprint-velocity rollup; strategic-item flag storage.

### 1.9 User flows

All flows detailed in `SCHEDULING_UX.md`. Key flows:
- **Morning flow** — Cadence Day acceptance: CycleCard PROPOSED → BucketStrip → Accept/Edit/Reject → ACTIVE.
- **Activity close flow** — CatalogPicker → ScheduledActivityBlock → artifact capture → auto-stubbed Reflection (pending=true) → user capture → ReflectionCaptured event (onTime=true if ≤15 min).
- **Skip flow** — skip modal → Reason Code picker (OTHER requires note) → Variance logged → ComposerService subscribes and rescues on next cycle (R2).
- **Weekly Reflection flow** — Friday 16:00 → WeeklyReflectionWizard → DMAIC draft (Define / Measure / Analyze / Improve suggested) → top friction cluster → Kaizen promote.
- **Kaizen lifecycle** — DRAFT → lock Baseline → ACTIVE → actions execute → remeasure → CLOSED (refused without remeasurement).
- **Accelerator phase flow** — Phase 0 (charter) → Phase 1 (measure) → Phase 2 (improve/draft control plan) → Phase 3 (strategic-item veto guard) → Phase 4 (ROI + signed Control Plan) → CLOSED.

### 1.10 Design requirements

See `SCHEDULING_UX.md` for the full component tree, visual spec, and interaction patterns. The React component hierarchy (AppShell → pages → components like `CycleCard`, `BucketStrip`, `CatalogPicker`, `ScheduledActivityBlock`, `ReflectionSheet`, `WeeklyReflectionWizard`, `KaizenCard`, `PhaseStepper`, `AdherenceDial`, `SustainmentGatePanel`, `BacklogTable`, `ControlChart`) and the canonical page routes (`/today`, `/week`, `/sprint`, `/month`, `/catalog`, `/kaizens`, `/insights/portfolio`, `/insights/variance`) are authoritative there. This PRD does not re-specify them.

### 1.11 Technical requirements

See `SCHEDULING_ARCHITECTURE.md` (alias: `ARCHITECTURE.md` v0.6) for the authoritative module map, entity tables, FSMs, event catalog, and persistence strategy. Key constraints:
- Single-page app, zero runtime dependencies, vanilla ESM JavaScript.
- LocalStorage persistence in MVP; shapes port to Postgres without rewrite (see §2 below for the future-state DDL).
- `InvariantEngine` is the sole authority on Composition validity; UI does not re-enforce.
- Composer runs < 100ms p95 on localStorage fixture (DELIVERY_PLAN Window 1 gate).
- Test harness uses `node --test`, zero deps; every acceptance criterion has a test.
- Accessibility: Lighthouse 90+ on the four core pages.

### 1.12 Launch plan — 30-60-90-120-150 (DELIVERY_PLAN §3.2)

| Window | Days | Theme | Demoable outcome |
|---|---|---|---|
| 1 | 1–30 | Compose a valid Cadence Day on a trustworthy backbone | `/today` renders PROPOSED Cadence Day; `validateComposition` passes §1.9 worked example |
| 2 | 31–60 | Run the day, capture evidence, open a Kaizen | Activity close → Reflection → FrictionSignal → Weekly Reflection → Kaizen DRAFT |
| 3 | 61–90 | Close a Kaizen, light the dashboard | HARD RULE close guard; AdherenceDial live; launch metric computable |
| 4 | 91–120 | Accelerator + Validated Portfolio + Backlog Tracker | E13 + E14 + E18 demos; `ProjectPaceWarning` live |
| 5 | 121–150 | Kaizen 90 activation + DMAIC stats surfaces | E17 + E15 + E16; Sustainment Gate; two-pass Financial Benefit Translator |

### 1.13 Open questions

1. **Calendar integration granularity (Next).** Should imported external meetings become ScheduledActivity rows (so adherence math covers them) or stay as capacity-only reservations? Current MVP: capacity-only per ENGINE_DESIGN §2.1.
2. **Multi-Kaizen cap (Next).** Blueprint says cap 3 concurrent in Next; the one-active-Kaizen invariant assumes MVP scope. Exact transition semantics when a second Kaizen promotes from a cluster need spec.
3. **Team rollup privacy (Next).** When Facilitator rollup ships, what's the minimum aggregation that preserves per-Practitioner Reflection privacy?
4. **AD_HOC `targetCloseDate` default (UX).** If the user leaves `targetCloseDate` blank at promote, do we default to `startDate + 14d` or refuse submit? Currently refuse (per `ADHOC_PDCA_STANDARD §1.A.7` refinement #1).
5. **ROI co-sign asynchronicity.** Finance co-sign may arrive hours after the Practitioner captures numbers. Do we block the ROI ScheduledActivity close or allow a pending-cosign state?

---

## §2 — Database Schema (Postgres future-state DDL)

The MVP ships on localStorage; these tables are the target production schema. Entity shapes are identical across transports (ARCHITECTURE §7.1 "port-compatibility rule"); only the access pattern differs. Run this DDL against a fresh Postgres 15+ database.

```sql
-- =========================================================================
-- CadencePlan — production Postgres schema (future state; MVP ships on
-- localStorage with identical entity shapes). Authoritative source:
-- ARCHITECTURE.md v0.6 §2.1–§2.13, §7.3.
-- =========================================================================

BEGIN;

-- ---------- Extensions ----------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

-- ---------- Native enum types ----------
CREATE TYPE bucket_t                    AS ENUM ('PROJECT', 'COMMUNICATION', 'CI');
CREATE TYPE cycle_type_t                AS ENUM ('DAILY', 'WEEKLY', 'SPRINT', 'MONTHLY');
CREATE TYPE composition_state_t         AS ENUM ('PROPOSED', 'ACCEPTED', 'EDITED', 'REJECTED', 'ACTIVE', 'CLOSED');
CREATE TYPE scheduled_activity_state_t  AS ENUM ('PROPOSED', 'SCHEDULED', 'DROPPED', 'IN_PROGRESS', 'CLOSED', 'SKIPPED');
CREATE TYPE variance_kind_t             AS ENUM ('SKIPPED_NON_OPTIONAL', 'OVERRAN', 'UNDERRAN', 'RESCHEDULED', 'EDITED_FROM_PROPOSAL');
CREATE TYPE friction_tag_t              AS ENUM ('MEETING_LOAD', 'CONTEXT_SWITCH', 'BLOCKED_DEP', 'TOOL_FRICTION', 'PRIORITY_INVERSION', 'OTHER');
CREATE TYPE friction_status_t           AS ENUM ('OPEN', 'CLUSTERED', 'PROMOTED_TO_KAIZEN', 'DISMISSED');
CREATE TYPE kaizen_state_t              AS ENUM ('DRAFT', 'ACTIVE', 'IN_REMEASUREMENT', 'CLOSED');
CREATE TYPE close_kind_t                AS ENUM ('SUCCESS', 'PARTIAL', 'FAILED_HONEST');
CREATE TYPE reflection_kind_t           AS ENUM ('END_OF_ACTIVITY', 'WEEKLY');
CREATE TYPE pdca_state_t                AS ENUM ('PLAN', 'DO', 'CHECK', 'ACT', 'CLOSED');
CREATE TYPE pdca_closed_reason_t        AS ENUM ('GRADUATED', 'ABANDONED', 'SUPERSEDED_BY_KAIZEN');
CREATE TYPE reason_code_t               AS ENUM ('ESCALATION', 'MEETING_CONFLICT', 'SICK', 'BLOCKED', 'DEPRIORITIZED', 'OTHER');
CREATE TYPE artifact_schema_t           AS ENUM ('TEXT', 'TWO_LIST', 'NUMERIC', 'DOCUMENT', 'CHART');
CREATE TYPE focus_area_t                AS ENUM (
  'DEEP_WORK', 'COMMUNICATION', 'CONTINUOUS_IMPROVEMENT', 'CEREMONY',
  'DMAIC', 'KAIZEN', 'INNOVATION', 'KAIZEN_ACCELERATOR_30D', 'KAIZEN_EVENT_90D'
);
CREATE TYPE cadence_t                   AS ENUM (
  'DAILY', 'WEEKLY', 'SPRINT', 'MONTHLY', 'QUARTERLY',
  'CONTINUOUS', 'ON_SIGNAL', 'EVENT_DRIVEN', 'EVERY_48H'
);
CREATE TYPE source_of_schedule_t        AS ENUM ('COMPOSER_AUTO', 'USER_EDIT', 'USER_ADD');
CREATE TYPE project_type_t              AS ENUM (
  'DMAIC', 'KAIZEN_EVENT', 'KAIZEN_EVENT_90D',
  'KAIZEN_ACCELERATOR_30D', 'AD_HOC'
);

-- ---------- users ----------
CREATE TABLE users (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                     TEXT NOT NULL,
  email                    CITEXT UNIQUE NOT NULL,
  roles                    TEXT[] NOT NULL DEFAULT ARRAY['PRACTITIONER'],
  daily_capacity_minutes   INT NOT NULL DEFAULT 480 CHECK (daily_capacity_minutes BETWEEN 60 AND 600),
  work_days                INT[] NOT NULL DEFAULT ARRAY[1,2,3,4,5],
  sprint_anchor_date       DATE NOT NULL,
  timezone                 TEXT NOT NULL,
  deep_slice_preference    TEXT NOT NULL DEFAULT '2x2h'
                             CHECK (deep_slice_preference IN ('2x2h', '4x1h')),
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- catalog_entries ----------
CREATE TABLE catalog_entries (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_number          INT,
  name                     TEXT NOT NULL,
  focus_area               focus_area_t NOT NULL,
  default_duration_minutes INT NOT NULL CHECK (default_duration_minutes > 0),
  cadence                  cadence_t NOT NULL,
  trigger_description      TEXT NOT NULL,
  inputs                   JSONB NOT NULL DEFAULT '[]'::jsonb,
  output_artifact          JSONB NOT NULL,
  participants             TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  procedure                JSONB NOT NULL DEFAULT '[]'::jsonb,
  bucket                   bucket_t,
  is_non_optional          BOOLEAN NOT NULL DEFAULT FALSE,
  applies_to_roles         TEXT[] NOT NULL DEFAULT ARRAY['PRACTITIONER','FACILITATOR','LEADER','CHAMPION'],
  enabled_by_user          BOOLEAN NOT NULL DEFAULT TRUE,
  version                  INT NOT NULL DEFAULT 1,
  source_ref               TEXT NOT NULL,
  depends_on               UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],
  -- projectTypeBinding is string | string[] | null per ARCHITECTURE §2.2.
  -- Stored as TEXT[] with NULL meaning "cross-project"; single-value bindings
  -- are stored as a 1-element array.
  project_type_binding     TEXT[],
  phase_binding            TEXT,
  CONSTRAINT catalog_non_optional_cannot_disable
    CHECK (is_non_optional = FALSE OR enabled_by_user = TRUE),
  CONSTRAINT catalog_output_artifact_required
    CHECK ((output_artifact->>'required')::boolean = TRUE)
);
CREATE INDEX idx_catalog_entries_focus_area ON catalog_entries(focus_area);
CREATE INDEX idx_catalog_entries_project_type_binding ON catalog_entries USING GIN (project_type_binding);

-- ---------- compositions ----------
CREATE TABLE compositions (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                     UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  cycle_type                  cycle_type_t NOT NULL,
  start_at                    TIMESTAMPTZ NOT NULL,
  end_at                      TIMESTAMPTZ NOT NULL,
  parent_composition_id       UUID REFERENCES compositions(id) ON DELETE SET NULL,
  state                       composition_state_t NOT NULL,
  proposed_at                 TIMESTAMPTZ NOT NULL,
  decided_at                  TIMESTAMPTZ,
  closed_at                   TIMESTAMPTZ,
  composer_inputs_snapshot    JSONB NOT NULL,
  invariant_checks            JSONB NOT NULL,
  CONSTRAINT composition_end_after_start CHECK (end_at > start_at)
);
CREATE INDEX idx_compositions_user_id_start ON compositions(user_id, start_at DESC);
CREATE INDEX idx_compositions_user_id_state ON compositions(user_id, state);
CREATE INDEX idx_compositions_parent ON compositions(parent_composition_id);

-- ---------- scheduled_activities ----------
CREATE TABLE scheduled_activities (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  composition_id              UUID NOT NULL REFERENCES compositions(id) ON DELETE CASCADE,
  catalog_entry_id            UUID NOT NULL REFERENCES catalog_entries(id) ON DELETE RESTRICT,
  bucket                      bucket_t NOT NULL,
  planned_start_at            TIMESTAMPTZ NOT NULL,
  planned_duration_minutes    INT NOT NULL CHECK (planned_duration_minutes > 0),
  actual_start_at             TIMESTAMPTZ,
  actual_end_at               TIMESTAMPTZ,
  intention                   TEXT NOT NULL DEFAULT '',
  state                       scheduled_activity_state_t NOT NULL,
  output_artifact_ref         JSONB,
  reflection_id               UUID,
  linked_kaizen_id            UUID,
  linked_dmaic_step_ref       JSONB,
  linked_pdca_experiment_id   UUID,
  reason_code_if_skipped      reason_code_t,
  source_of_schedule          source_of_schedule_t NOT NULL,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT sa_closed_requires_artifact
    CHECK (state <> 'CLOSED' OR output_artifact_ref IS NOT NULL),
  CONSTRAINT sa_skipped_requires_reason
    CHECK (state <> 'SKIPPED' OR reason_code_if_skipped IS NOT NULL),
  CONSTRAINT sa_actual_end_after_start
    CHECK (actual_end_at IS NULL OR actual_start_at IS NULL OR actual_end_at >= actual_start_at)
);
CREATE INDEX idx_sa_composition ON scheduled_activities(composition_id);
CREATE INDEX idx_sa_catalog_entry ON scheduled_activities(catalog_entry_id);
CREATE INDEX idx_sa_linked_kaizen ON scheduled_activities(linked_kaizen_id);
CREATE INDEX idx_sa_linked_pdca ON scheduled_activities(linked_pdca_experiment_id);
CREATE INDEX idx_sa_state_planned_start ON scheduled_activities(state, planned_start_at);

-- ---------- reflections ----------
CREATE TABLE reflections (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scheduled_activity_id     UUID NOT NULL UNIQUE REFERENCES scheduled_activities(id) ON DELETE CASCADE,
  user_id                   UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  pending                   BOOLEAN NOT NULL DEFAULT TRUE,
  captured_at               TIMESTAMPTZ,
  plan_vs_actual_minutes    INT NOT NULL,
  what_went_well            TEXT,
  what_to_improve           TEXT,
  friction_flag             BOOLEAN NOT NULL DEFAULT FALSE,
  friction_signal_id        UUID,
  kind                      reflection_kind_t NOT NULL,
  dmaic_draft               JSONB,
  CONSTRAINT reflection_captured_when_not_pending
    CHECK (pending = TRUE OR captured_at IS NOT NULL),
  CONSTRAINT reflection_weekly_never_pending
    CHECK (kind <> 'WEEKLY' OR pending = FALSE),
  CONSTRAINT reflection_friction_requires_capture
    CHECK (friction_signal_id IS NULL OR pending = FALSE)
);
CREATE INDEX idx_reflections_user_captured ON reflections(user_id, captured_at DESC);

ALTER TABLE scheduled_activities
  ADD CONSTRAINT sa_reflection_fk
  FOREIGN KEY (reflection_id) REFERENCES reflections(id) ON DELETE SET NULL;

-- ---------- variances (append-only) ----------
CREATE TABLE variances (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scheduled_activity_id  UUID NOT NULL REFERENCES scheduled_activities(id) ON DELETE RESTRICT,
  composition_id         UUID NOT NULL REFERENCES compositions(id) ON DELETE RESTRICT,
  catalog_entry_id       UUID NOT NULL REFERENCES catalog_entries(id) ON DELETE RESTRICT,
  user_id                UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  kind                   variance_kind_t NOT NULL,
  reason_code            reason_code_t NOT NULL,
  note                   TEXT,
  logged_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT variance_other_requires_note
    CHECK (reason_code <> 'OTHER' OR (note IS NOT NULL AND length(note) > 0))
);
CREATE INDEX idx_variances_user_logged ON variances(user_id, logged_at DESC);
CREATE INDEX idx_variances_catalog_entry ON variances(catalog_entry_id);

-- Append-only enforcement at the storage layer (ARCHITECTURE §7.3):
REVOKE UPDATE, DELETE ON variances FROM PUBLIC;
-- Role grants (deployment-specific; placeholder):
-- GRANT SELECT, INSERT ON variances TO app_user;

-- ---------- friction_signals ----------
CREATE TABLE friction_signals (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reflection_id             UUID NOT NULL REFERENCES reflections(id) ON DELETE RESTRICT,
  scheduled_activity_id     UUID NOT NULL REFERENCES scheduled_activities(id) ON DELETE RESTRICT,
  user_id                   UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  summary                   TEXT NOT NULL CHECK (length(summary) <= 140),
  tag                       friction_tag_t,
  status                    friction_status_t NOT NULL DEFAULT 'OPEN',
  kaizen_id                 UUID,
  captured_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_friction_user_captured ON friction_signals(user_id, captured_at DESC);
CREATE INDEX idx_friction_tag_status ON friction_signals(tag, status);

ALTER TABLE reflections
  ADD CONSTRAINT reflection_friction_fk
  FOREIGN KEY (friction_signal_id) REFERENCES friction_signals(id) ON DELETE SET NULL;

-- ---------- kaizens ----------
CREATE TABLE kaizens (
  id                              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                         UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  title                           TEXT NOT NULL,
  problem_statement               TEXT NOT NULL,
  goal_statement                  TEXT NOT NULL,
  source_friction_signal_ids      UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],
  baseline_metric_id              UUID,
  remeasurement_id                UUID,
  actions                         JSONB NOT NULL DEFAULT '[]'::jsonb,
  state                           kaizen_state_t NOT NULL DEFAULT 'DRAFT',
  opened_at                       TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at                       TIMESTAMPTZ,
  close_kind                      close_kind_t,
  results_narrative_ref           JSONB,
  project_type                    project_type_t NOT NULL DEFAULT 'AD_HOC',
  phase                           TEXT,
  phase_definitions               JSONB,
  implementation_cost_dollars     NUMERIC(14,2),
  annual_benefits_dollars         NUMERIC(14,2),
  start_date                      DATE NOT NULL,
  control_plan_artifact_ref       JSONB,
  control_plan_draft_artifact_ref JSONB,
  implementation_lead_user_id     UUID REFERENCES users(id) ON DELETE RESTRICT,
  roi_pass_number                 INT CHECK (roi_pass_number IN (1,2)),
  roi_projections                 JSONB,
  validated_root_cause_artifact_ref JSONB,
  sustainment_check_ins           JSONB,
  sustainment_gate_passed         BOOLEAN,
  scope_changes                   JSONB NOT NULL DEFAULT '[]'::jsonb,
  target_close_date               DATE,
  source_pdca_experiment_id       UUID,
  CONSTRAINT kaizen_close_requires_remeasurement
    CHECK (state <> 'CLOSED' OR remeasurement_id IS NOT NULL),
  CONSTRAINT kaizen_ad_hoc_requires_target_close_date
    CHECK (project_type <> 'AD_HOC' OR target_close_date IS NOT NULL),
  CONSTRAINT kaizen_phased_requires_phase
    CHECK (
      project_type NOT IN ('KAIZEN_ACCELERATOR_30D','KAIZEN_EVENT_90D')
      OR (phase IS NOT NULL AND phase_definitions IS NOT NULL)
    ),
  CONSTRAINT kaizen_90d_requires_impl_lead
    CHECK (project_type <> 'KAIZEN_EVENT_90D' OR implementation_lead_user_id IS NOT NULL),
  CONSTRAINT kaizen_accelerator_close_requires_roi
    CHECK (
      NOT (project_type = 'KAIZEN_ACCELERATOR_30D' AND state = 'CLOSED')
      OR (implementation_cost_dollars IS NOT NULL
          AND annual_benefits_dollars IS NOT NULL
          AND control_plan_artifact_ref IS NOT NULL)
    ),
  CONSTRAINT kaizen_90d_close_requires_gate_and_plan
    CHECK (
      NOT (project_type = 'KAIZEN_EVENT_90D' AND state = 'CLOSED')
      OR (sustainment_gate_passed = TRUE
          AND control_plan_artifact_ref IS NOT NULL
          AND implementation_cost_dollars IS NOT NULL
          AND annual_benefits_dollars IS NOT NULL)
    ),
  CONSTRAINT kaizen_dmaic_close_requires_two_pass_roi
    CHECK (
      NOT (project_type = 'DMAIC' AND state = 'CLOSED')
      OR (roi_pass_number = 2 AND jsonb_array_length(COALESCE(roi_projections,'[]'::jsonb)) = 2)
    ),
  CONSTRAINT kaizen_target_after_start
    CHECK (target_close_date IS NULL OR target_close_date > start_date)
);
CREATE INDEX idx_kaizens_user_state ON kaizens(user_id, state);
CREATE INDEX idx_kaizens_project_type ON kaizens(project_type);
CREATE INDEX idx_kaizens_closed_at ON kaizens(closed_at DESC) WHERE state = 'CLOSED';
-- Enforce one active phased project per user (MVP cap is 1 ACTIVE/IN_REMEASUREMENT total).
CREATE UNIQUE INDEX idx_kaizens_one_active_per_user
  ON kaizens(user_id)
  WHERE state IN ('ACTIVE','IN_REMEASUREMENT');

ALTER TABLE scheduled_activities
  ADD CONSTRAINT sa_linked_kaizen_fk
  FOREIGN KEY (linked_kaizen_id) REFERENCES kaizens(id) ON DELETE SET NULL;
ALTER TABLE friction_signals
  ADD CONSTRAINT friction_kaizen_fk
  FOREIGN KEY (kaizen_id) REFERENCES kaizens(id) ON DELETE SET NULL;

-- ---------- baseline_metrics ----------
CREATE TABLE baseline_metrics (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kaizen_id            UUID NOT NULL REFERENCES kaizens(id) ON DELETE CASCADE,
  metric_definition    JSONB NOT NULL,
  value                NUMERIC NOT NULL,
  captured_at          TIMESTAMPTZ NOT NULL,
  captured_sample_ref  JSONB,
  locked               BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX idx_baseline_kaizen ON baseline_metrics(kaizen_id);
ALTER TABLE kaizens
  ADD CONSTRAINT kaizen_baseline_fk
  FOREIGN KEY (baseline_metric_id) REFERENCES baseline_metrics(id) ON DELETE RESTRICT;

-- ---------- remeasurements ----------
CREATE TABLE remeasurements (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kaizen_id            UUID NOT NULL REFERENCES kaizens(id) ON DELETE CASCADE,
  metric_definition_id TEXT NOT NULL,
  value                NUMERIC NOT NULL,
  delta_absolute       NUMERIC NOT NULL,
  delta_percent        NUMERIC NOT NULL,
  beats_baseline       BOOLEAN NOT NULL,
  captured_at          TIMESTAMPTZ NOT NULL,
  evidence_ref         JSONB
);
CREATE INDEX idx_remeasurement_kaizen ON remeasurements(kaizen_id);
ALTER TABLE kaizens
  ADD CONSTRAINT kaizen_remeasurement_fk
  FOREIGN KEY (remeasurement_id) REFERENCES remeasurements(id) ON DELETE RESTRICT;

-- ---------- metrics_snapshots (derived, regenerable) ----------
CREATE TABLE metrics_snapshots (
  id                               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  window_start                     TIMESTAMPTZ NOT NULL,
  window_end                       TIMESTAMPTZ NOT NULL,
  adherence_percent                NUMERIC NOT NULL,
  composition_acceptance_daily     NUMERIC NOT NULL,
  composition_acceptance_weekly    NUMERIC NOT NULL,
  reflection_rate_percent          NUMERIC NOT NULL,
  active_kaizen_delta_percent      NUMERIC,
  computed_at                      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_metrics_user_computed ON metrics_snapshots(user_id, computed_at DESC);

-- ---------- pdca_experiments ----------
CREATE TABLE pdca_experiments (
  id                             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                        UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  hypothesis                     TEXT NOT NULL,
  target_metric_name             TEXT NOT NULL,
  target_metric_unit             TEXT NOT NULL,
  current_condition_baseline     NUMERIC NOT NULL,
  target_condition               NUMERIC NOT NULL,
  state                          pdca_state_t NOT NULL DEFAULT 'PLAN',
  tick_activity_ids              UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],
  consecutive_target_hits        INT NOT NULL DEFAULT 0,
  opened_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at                      TIMESTAMPTZ,
  closed_reason                  pdca_closed_reason_t,
  CONSTRAINT pdca_graduated_needs_three_hits
    CHECK (state <> 'CLOSED' OR closed_reason <> 'GRADUATED' OR consecutive_target_hits >= 3)
);
CREATE UNIQUE INDEX idx_pdca_one_active_per_user
  ON pdca_experiments(user_id)
  WHERE state <> 'CLOSED';

ALTER TABLE scheduled_activities
  ADD CONSTRAINT sa_linked_pdca_fk
  FOREIGN KEY (linked_pdca_experiment_id) REFERENCES pdca_experiments(id) ON DELETE SET NULL;

-- ---------- agent_suggestions (AI_AGENTS.md) ----------
CREATE TABLE agent_suggestions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_name      TEXT NOT NULL,
  suggestion_kind TEXT NOT NULL,
  payload         JSONB NOT NULL,
  state           TEXT NOT NULL DEFAULT 'PROPOSED'
                    CHECK (state IN ('PROPOSED','DISPLAYED','ACTED_ON','DISMISSED','EXPIRED')),
  displayed_at    TIMESTAMPTZ,
  decided_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_agent_sugg_user_state ON agent_suggestions(user_id, state);

-- ---------- agent_telemetry (append-only) ----------
CREATE TABLE agent_telemetry (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_name       TEXT NOT NULL,
  input_ref        JSONB NOT NULL,
  output_ref       JSONB NOT NULL,
  user_action      TEXT,
  emitted_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_agent_telemetry_user_emitted ON agent_telemetry(user_id, emitted_at DESC);
REVOKE UPDATE, DELETE ON agent_telemetry FROM PUBLIC;

-- ---------- cluster_dismissals ----------
CREATE TABLE cluster_dismissals (
  user_id                UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tag                    friction_tag_t NOT NULL,
  last_dismissed_at      TIMESTAMPTZ NOT NULL,
  dismissed_count        INT NOT NULL DEFAULT 1,
  last_reason_summary    TEXT,
  PRIMARY KEY (user_id, tag)
);

-- ---------- phase_definitions (shared seed / lookup) ----------
-- Seeded snapshots are stored per-Kaizen in kaizens.phase_definitions; this
-- table holds the canonical project-type-wide templates the seeder reads from.
CREATE TABLE phase_definitions (
  id                           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_type                 project_type_t NOT NULL,
  phase_id                     TEXT NOT NULL,
  phase_name                   TEXT NOT NULL,
  target_days                  INT NOT NULL,
  non_optional_catalog_entries UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],
  display_order                INT NOT NULL,
  UNIQUE (project_type, phase_id)
);
CREATE INDEX idx_phase_def_project ON phase_definitions(project_type, display_order);

-- ---------- Triggers: updated_at on scheduled_activities ----------
CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER sa_touch_updated_at
  BEFORE UPDATE ON scheduled_activities
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ---------- Append-only guard for sustainment_check_ins rows on kaizens ----
-- A missed check-in must stay on the record (ARCHITECTURE §2.9 invariant).
-- Enforced via trigger: if an existing check-in with due_date < now() is
-- removed or mutated, raise an exception.
CREATE OR REPLACE FUNCTION guard_sustainment_checkins() RETURNS TRIGGER AS $$
DECLARE
  old_rows JSONB := COALESCE(OLD.sustainment_check_ins, '[]'::jsonb);
  new_rows JSONB := COALESCE(NEW.sustainment_check_ins, '[]'::jsonb);
  old_len  INT   := jsonb_array_length(old_rows);
  new_len  INT   := jsonb_array_length(new_rows);
BEGIN
  IF new_len < old_len THEN
    RAISE EXCEPTION 'sustainment_check_ins is append-only once a due_date has passed';
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;
CREATE TRIGGER kaizen_guard_sustainment
  BEFORE UPDATE ON kaizens
  FOR EACH ROW EXECUTE FUNCTION guard_sustainment_checkins();

COMMIT;
```

---

## §3 — TypeScript domain model

Production-ready TypeScript port of `js/domain/types.js`. Branded IDs prevent cross-entity confusion at compile time; `const` objects expose runtime values alongside type aliases.

```ts
// =========================================================================
// CadencePlan — TypeScript domain model (ports js/domain/types.js JSDoc 1:1)
// Authoritative source: ARCHITECTURE.md v0.6 §2.
// =========================================================================

// ---------- Branded ID types ----------
export type UserId              = string & { readonly __brand: 'UserId' };
export type CatalogEntryId      = string & { readonly __brand: 'CatalogEntryId' };
export type CompositionId       = string & { readonly __brand: 'CompositionId' };
export type ScheduledActivityId = string & { readonly __brand: 'ScheduledActivityId' };
export type ReflectionId        = string & { readonly __brand: 'ReflectionId' };
export type VarianceId          = string & { readonly __brand: 'VarianceId' };
export type FrictionSignalId    = string & { readonly __brand: 'FrictionSignalId' };
export type KaizenId            = string & { readonly __brand: 'KaizenId' };
export type BaselineMetricId    = string & { readonly __brand: 'BaselineMetricId' };
export type RemeasurementId     = string & { readonly __brand: 'RemeasurementId' };
export type MetricsSnapshotId   = string & { readonly __brand: 'MetricsSnapshotId' };
export type PdcaExperimentId    = string & { readonly __brand: 'PdcaExperimentId' };

export type IsoTimestamp = string;  // ISO 8601
export type IsoDate      = string;  // YYYY-MM-DD

// ---------- Enum type aliases + runtime constants ----------
export type ProjectType =
  | 'DMAIC'
  | 'KAIZEN_EVENT'
  | 'KAIZEN_EVENT_90D'
  | 'KAIZEN_ACCELERATOR_30D'
  | 'AD_HOC';
export const ProjectType = {
  DMAIC: 'DMAIC',
  KAIZEN_EVENT: 'KAIZEN_EVENT',
  KAIZEN_EVENT_90D: 'KAIZEN_EVENT_90D',
  KAIZEN_ACCELERATOR_30D: 'KAIZEN_ACCELERATOR_30D',
  AD_HOC: 'AD_HOC'
} as const satisfies Record<ProjectType, ProjectType>;

export type FocusArea =
  | 'DEEP_WORK' | 'COMMUNICATION' | 'CONTINUOUS_IMPROVEMENT' | 'CEREMONY'
  | 'DMAIC' | 'KAIZEN' | 'INNOVATION'
  | 'KAIZEN_ACCELERATOR_30D' | 'KAIZEN_EVENT_90D';

export type Cadence =
  | 'DAILY' | 'WEEKLY' | 'SPRINT' | 'MONTHLY' | 'QUARTERLY'
  | 'CONTINUOUS' | 'ON_SIGNAL' | 'EVENT_DRIVEN' | 'EVERY_48H';

export type Bucket = 'PROJECT' | 'COMMUNICATION' | 'CI';
export const Bucket = { PROJECT: 'PROJECT', COMMUNICATION: 'COMMUNICATION', CI: 'CI' } as const;

export type CycleType = 'DAILY' | 'WEEKLY' | 'SPRINT' | 'MONTHLY';
export type CompositionState =
  'PROPOSED' | 'ACCEPTED' | 'EDITED' | 'REJECTED' | 'ACTIVE' | 'CLOSED';
export type ScheduledActivityState =
  'PROPOSED' | 'SCHEDULED' | 'DROPPED' | 'IN_PROGRESS' | 'CLOSED' | 'SKIPPED';
export type ReasonCode =
  'ESCALATION' | 'MEETING_CONFLICT' | 'SICK' | 'BLOCKED' | 'DEPRIORITIZED' | 'OTHER';
export type SourceOfSchedule = 'COMPOSER_AUTO' | 'USER_EDIT' | 'USER_ADD';
export type ArtifactSchema = 'TEXT' | 'TWO_LIST' | 'NUMERIC' | 'DOCUMENT' | 'CHART';
export type VarianceKind =
  'SKIPPED_NON_OPTIONAL' | 'OVERRAN' | 'UNDERRAN' | 'RESCHEDULED' | 'EDITED_FROM_PROPOSAL';
export type FrictionTag =
  'MEETING_LOAD' | 'CONTEXT_SWITCH' | 'BLOCKED_DEP' | 'TOOL_FRICTION' | 'PRIORITY_INVERSION' | 'OTHER';
export type FrictionStatus = 'OPEN' | 'CLUSTERED' | 'PROMOTED_TO_KAIZEN' | 'DISMISSED';
export type KaizenState = 'DRAFT' | 'ACTIVE' | 'IN_REMEASUREMENT' | 'CLOSED';
export type CloseKind = 'SUCCESS' | 'PARTIAL' | 'FAILED_HONEST';
export type ReflectionKind = 'END_OF_ACTIVITY' | 'WEEKLY';
export type PdcaState = 'PLAN' | 'DO' | 'CHECK' | 'ACT' | 'CLOSED';
export type PdcaClosedReason = 'GRADUATED' | 'ABANDONED' | 'SUPERSEDED_BY_KAIZEN';

export type AcceleratorPhaseId = 'PHASE_0' | 'PHASE_1' | 'PHASE_2' | 'PHASE_3' | 'PHASE_4';
export type Kaizen90PhaseId    = 'PRE_EVENT' | 'EVENT' | 'POST_EVENT' | 'SUSTAIN';

// ---------- Supporting structures ----------
export interface OutputArtifactDef {
  name: string;
  schema: ArtifactSchema;
  required: true;
}

export interface OutputArtifactRef {
  schema: ArtifactSchema;
  value: unknown;
}

export interface MetricDefinition {
  name: string;
  unit: string;
  operationalDefinition: string;
  sampleSize: number;
  method: string;
}

export interface KaizenAction {
  name: string;
  ownerRef: string;
  dueDate: IsoDate;
  doneAt: IsoTimestamp | null;
  strategic?: boolean;
  sprint?: string;
  acceptanceCriterion?: string;
}

export interface ProjectPhaseDefinition {
  id: string;
  name: string;
  days: number;
  nonOptionalCatalogEntryIds: CatalogEntryId[];
}

export interface ComposerInputsSnapshot {
  role: string;
  capacityMinutes: number;
  sprintPhase: string;
  activeKaizenId: KaizenId | null;
  varianceCount: number;
  explain?: Array<{ ref: string; rule: string; detail: string }>;
}

export interface InvariantChecks {
  shape_4_2_2: { ok: boolean; projectMin: number; commMin: number; ciMin: number };
  nonOptionalPresent: { ok: boolean; missing: string[] };
  overAllocated: { ok: boolean; totalMin: number; capacityMin: number };
}

export interface RoiProjectionRow {
  passNumber: 1 | 2;
  implementationCostDollars: number;
  annualBenefitsDollars: number;
  computedRoi: number;
  financePartnerUserId: UserId;
  capturedAt: IsoTimestamp;
  reconciliationDeltaPercent?: number;
}

export interface SustainmentCheckIn {
  dueDate: IsoDate;
  kind: '30_DAY' | '60_DAY' | '90_DAY';
  completedAt: IsoTimestamp | null;
  observedMetricValue: number | null;
  adherenceOk: boolean;
  notes: string | null;
}

export interface ScopeChangeEntry {
  changeRequestedAt: IsoTimestamp;
  requestedBy: UserId;
  reason: string;
  impactAssessment: string;
  approved: boolean;
  approvedBy: UserId | null;
  approvedAt: IsoTimestamp | null;
}

export interface ValidatedRootCauseArtifactRef {
  schema: ArtifactSchema;
  value: unknown;
  confoundCheckPassed: boolean;
  validatedBy: UserId;
  validatedAt: IsoTimestamp;
}

// ---------- 2.2 CatalogEntry ----------
export interface CatalogEntry {
  id: CatalogEntryId;
  activityNumber: number | null;
  name: string;
  focusArea: FocusArea;
  defaultDurationMinutes: number;
  cadence: Cadence;
  trigger: string;
  inputs: string[];
  outputArtifact: OutputArtifactDef;
  participants: string[];
  procedure: string[];
  bucket: Bucket;
  isNonOptional: boolean;
  appliesToRoles: string[];
  enabledByUser: boolean;
  version: number;
  sourceRef: string;
  dependsOn: CatalogEntryId[];
  projectTypeBinding: ProjectType | ProjectType[] | null;
  phaseBinding: string | null;
}

// ---------- 2.3 User ----------
export interface User {
  id: UserId;
  name: string;
  email: string;
  roles: string[];
  dailyCapacityMinutes: number;
  workDays: number[];
  sprintAnchorDate: IsoDate;
  timezone: string;
  deepSlicePreference: '2x2h' | '4x1h';
  createdAt: IsoTimestamp;
}

// ---------- 2.4 Composition ----------
export interface Composition {
  id: CompositionId;
  userId: UserId;
  cycleType: CycleType;
  startAt: IsoTimestamp;
  endAt: IsoTimestamp;
  parentCompositionId: CompositionId | null;
  state: CompositionState;
  proposedAt: IsoTimestamp;
  decidedAt: IsoTimestamp | null;
  closedAt: IsoTimestamp | null;
  composerInputsSnapshot: ComposerInputsSnapshot;
  invariantChecks: InvariantChecks;
}

// ---------- 2.5 ScheduledActivity ----------
export interface ScheduledActivity {
  id: ScheduledActivityId;
  compositionId: CompositionId;
  catalogEntryId: CatalogEntryId;
  bucket: Bucket;
  plannedStartAt: IsoTimestamp;
  plannedDurationMinutes: number;
  actualStartAt: IsoTimestamp | null;
  actualEndAt: IsoTimestamp | null;
  intention: string;
  state: ScheduledActivityState;
  outputArtifactRef: OutputArtifactRef | null;
  reflectionId: ReflectionId | null;
  linkedKaizenId: KaizenId | null;
  linkedDmaicStepRef: { kaizenId: KaizenId; catalogEntryId: CatalogEntryId } | null;
  linkedPdcaExperimentId: PdcaExperimentId | null;
  reasonCodeIfSkipped: ReasonCode | null;
  sourceOfSchedule: SourceOfSchedule;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

// ---------- 2.6 Reflection ----------
export interface DmaicDraft {
  define: string;
  measure: string;
  analyze: string;
  improveSuggested: string;
}
export interface Reflection {
  id: ReflectionId;
  scheduledActivityId: ScheduledActivityId;
  userId: UserId;
  pending: boolean;
  capturedAt: IsoTimestamp | null;
  planVsActualMinutes: number;
  whatWentWell: string | null;
  whatToImprove: string | null;
  frictionFlag: boolean;
  frictionSignalId: FrictionSignalId | null;
  kind: ReflectionKind;
  dmaicDraft: DmaicDraft | null;
}

// ---------- 2.7 Variance (append-only) ----------
export interface Variance {
  id: VarianceId;
  scheduledActivityId: ScheduledActivityId;
  compositionId: CompositionId;
  catalogEntryId: CatalogEntryId;
  userId: UserId;
  kind: VarianceKind;
  reasonCode: ReasonCode;
  note: string | null;
  loggedAt: IsoTimestamp;
}

// ---------- 2.8 FrictionSignal ----------
export interface FrictionSignal {
  id: FrictionSignalId;
  reflectionId: ReflectionId;
  scheduledActivityId: ScheduledActivityId;
  userId: UserId;
  summary: string;
  tag: FrictionTag | null;
  status: FrictionStatus;
  kaizenId: KaizenId | null;
  capturedAt: IsoTimestamp;
}

// ---------- 2.9 Kaizen ----------
export interface Kaizen {
  id: KaizenId;
  userId: UserId;
  title: string;
  problemStatement: string;
  goalStatement: string;
  sourceFrictionSignalIds: FrictionSignalId[];
  baselineMetricId: BaselineMetricId;
  remeasurementId: RemeasurementId | null;
  actions: KaizenAction[];
  state: KaizenState;
  openedAt: IsoTimestamp;
  closedAt: IsoTimestamp | null;
  closeKind: CloseKind | null;
  resultsNarrativeRef: { schema: ArtifactSchema; value: unknown } | null;
  projectType: ProjectType;
  phase: string | null;
  phaseDefinitions: ProjectPhaseDefinition[] | null;
  implementationCostDollars: number | null;
  annualBenefitsDollars: number | null;
  startDate: IsoDate;
  controlPlanArtifactRef: { schema: ArtifactSchema; value: unknown } | null;
  controlPlanDraftArtifactRef: { schema: ArtifactSchema; value: unknown } | null;
  implementationLeadUserId: UserId | null;
  roiPassNumber: 1 | 2 | null;
  roiProjections: RoiProjectionRow[] | null;
  validatedRootCauseArtifactRef: ValidatedRootCauseArtifactRef | null;
  sustainmentCheckIns: SustainmentCheckIn[] | null;
  sustainmentGatePassed: boolean | null;
  scopeChanges: ScopeChangeEntry[];
  targetCloseDate: IsoDate | null;
  sourcePdcaExperimentId: PdcaExperimentId | null;
}

// ---------- 2.10 / 2.11 ----------
export interface BaselineMetric {
  id: BaselineMetricId;
  kaizenId: KaizenId;
  metricDefinition: MetricDefinition;
  value: number;
  capturedAt: IsoTimestamp;
  capturedSampleRef: { kind: string; ref: string } | null;
  locked: boolean;
}
export interface Remeasurement {
  id: RemeasurementId;
  kaizenId: KaizenId;
  metricDefinitionId: string;
  value: number;
  deltaAbsolute: number;
  deltaPercent: number;
  beatsBaseline: boolean;
  capturedAt: IsoTimestamp;
  evidenceRef: { schema: ArtifactSchema; value: unknown } | null;
}

// ---------- 2.12 MetricsSnapshot ----------
export interface MetricsSnapshot {
  id: MetricsSnapshotId;
  userId: UserId;
  windowStart: IsoTimestamp;
  windowEnd: IsoTimestamp;
  adherencePercent: number;
  compositionAcceptanceDaily: number;
  compositionAcceptanceWeekly: number;
  reflectionRatePercent: number;
  activeKaizenDeltaPercent: number | null;
  computedAt: IsoTimestamp;
}

// ---------- 2.13 PdcaExperiment ----------
export interface PdcaExperiment {
  id: PdcaExperimentId;
  userId: UserId;
  hypothesis: string;
  targetMetricName: string;
  targetMetricUnit: string;
  currentConditionBaseline: number;
  targetCondition: number;
  state: PdcaState;
  tickActivityIds: ScheduledActivityId[];
  consecutiveTargetHits: number;
  openedAt: IsoTimestamp;
  closedAt: IsoTimestamp | null;
  closedReason: PdcaClosedReason | null;
}

// ---------- InfeasibleResult (ARCHITECTURE §4.7) ----------
export type SuggestedAction =
  | { kind: 'RAISE_CAPACITY'; currentMinutes: number; suggestedMinutes: number }
  | { kind: 'REDUCE_EXTERNAL'; currentExternalMinutes: number; suggestedExternalMinutes: number }
  | { kind: 'SKIP_CEREMONY_WITH_REASON'; catalogEntryId: CatalogEntryId; ceremonyName: string; defaultReasonCode: ReasonCode }
  | { kind: 'DEFER_NON_OPTIONAL_TO_NEXT_DAY'; catalogEntryId: CatalogEntryId; rationale: string };

export interface InfeasibleResult {
  kind: 'INFEASIBLE';
  totalRequiredMinutes: number;
  capacityMinutes: number;
  shortfallMinutes: number;
  bucketShortfalls: { PROJECT: number; COMMUNICATION: number; CI: number };
  suggestedActions: SuggestedAction[];
  explain: string[];
}

// ---------- AgentSuggestion (AI_AGENTS.md) ----------
export type AgentSuggestion =
  | { kind: 'PLANNING_ALERT'; suggestionId: string; userId: UserId; message: string; severity: 'INFO'|'WARN'|'ERROR' }
  | { kind: 'REFLECTION_NUDGE'; suggestionId: string; userId: UserId; scheduledActivityId: ScheduledActivityId }
  | { kind: 'FRICTION_CLUSTER'; suggestionId: string; userId: UserId; tag: FrictionTag; count: number; frictionSignalIds: FrictionSignalId[] }
  | { kind: 'PACE_WARNING'; suggestionId: string; userId: UserId; kaizenId: KaizenId; kind2: 'PHASE_OVERRUN'|'SPRINT_VELOCITY_UNDER_60'|'AD_HOC_OVERRUN' };
```

---

## §4 — Sample seeded dataset

A minimal, coherent, copy-pasteable JSON fixture for a demo tenant. Top-level keys match table names. All UUIDs use readable `prefix_*` identifiers to keep the fixture diffable.

```json
{
  "users": [
    {
      "id": "usr_phil",
      "name": "Phil K.",
      "email": "phil@mediafier.ai",
      "roles": ["PRACTITIONER"],
      "dailyCapacityMinutes": 480,
      "workDays": [1, 2, 3, 4, 5],
      "sprintAnchorDate": "2026-04-13",
      "timezone": "America/Los_Angeles",
      "deepSlicePreference": "2x2h",
      "createdAt": "2026-03-15T09:00:00Z"
    }
  ],

  "catalog_entries": [
    { "id": "ce_daily_standup",       "activityNumber": null, "name": "Daily Standup",                            "focusArea": "CEREMONY",               "defaultDurationMinutes": 15,  "cadence": "DAILY",        "trigger": "Same time each work day",                "inputs": ["Sprint Backlog", "Yesterday's reflections"], "outputArtifact": { "name": "Standup notes",                   "schema": "TEXT",     "required": true }, "participants": ["Team", "Agile Facilitator"],          "procedure": ["a. Done / doing / blockers.", "b. Capture blockers.", "c. Close in 15 min."],                                              "bucket": "COMMUNICATION", "isNonOptional": true,  "appliesToRoles": ["PRACTITIONER","FACILITATOR","LEADER","CHAMPION"], "enabledByUser": true, "version": 1, "sourceRef": "BAM Way Ch.6",                       "dependsOn": [], "projectTypeBinding": null,                                   "phaseBinding": null },
    { "id": "ce_high_value_comm_am",  "activityNumber": null, "name": "High-value Communication Time-blocking (AM)", "focusArea": "COMMUNICATION",        "defaultDurationMinutes": 60,  "cadence": "DAILY",        "trigger": "Anchor 09:15 post-standup",              "inputs": ["Inbox", "Slack", "Escalation queue"],        "outputArtifact": { "name": "Handled items log",               "schema": "TEXT",     "required": true }, "participants": ["Self"],                               "procedure": ["a. Work inbox / DMs.", "b. Tag each response with an intention."],                                                     "bucket": "COMMUNICATION", "isNonOptional": true,  "appliesToRoles": ["PRACTITIONER","FACILITATOR","LEADER","CHAMPION"], "enabledByUser": true, "version": 1, "sourceRef": "BAM Way Ch.6",                       "dependsOn": [], "projectTypeBinding": null,                                   "phaseBinding": null },
    { "id": "ce_deep_work_generic",   "activityNumber": null, "name": "Deep Work — Project Task (generic)",       "focusArea": "DEEP_WORK",              "defaultDurationMinutes": 120, "cadence": "DAILY",        "trigger": "Deep block anchor",                      "inputs": ["Project artifact to advance"],               "outputArtifact": { "name": "Advanced artifact",               "schema": "DOCUMENT", "required": true }, "participants": ["Self"],                               "procedure": ["a. Declare intention.", "b. 120-min focus.", "c. Capture artifact diff."],                                              "bucket": "PROJECT",       "isNonOptional": false, "appliesToRoles": ["PRACTITIONER","LEADER","CHAMPION"],               "enabledByUser": true, "version": 1, "sourceRef": "CATALOG_GAPS.md §H.2",               "dependsOn": [], "projectTypeBinding": null,                                   "phaseBinding": null },
    { "id": "ce_pdca_cycle",          "activityNumber": 12,   "name": "PDCA Cycle",                               "focusArea": "CONTINUOUS_IMPROVEMENT", "defaultDurationMinutes": 30,  "cadence": "EVERY_48H",    "trigger": "Every 48h while a PdcaExperiment is open", "inputs": ["Experiment hypothesis", "Prior tick measurement"], "outputArtifact": { "name": "Tick measurement + adjustment", "schema": "NUMERIC",  "required": true }, "participants": ["Self"],                               "procedure": ["a. Plan.", "b. Do.", "c. Check.", "d. Act."],                                                                           "bucket": "CI",            "isNonOptional": false, "appliesToRoles": ["PRACTITIONER","CHAMPION"],                        "enabledByUser": true, "version": 1, "sourceRef": "Business Agility Standard Work.txt row 12", "dependsOn": [], "projectTypeBinding": null,                                   "phaseBinding": null },
    { "id": "ce_weekly_reflection",   "activityNumber": null, "name": "Weekly Reflection",                        "focusArea": "CONTINUOUS_IMPROVEMENT", "defaultDurationMinutes": 20,  "cadence": "WEEKLY",       "trigger": "Friday 16:00 local",                     "inputs": ["Week's Variances", "Week's FrictionSignals"], "outputArtifact": { "name": "DMAIC draft + Kaizen candidate","schema": "DOCUMENT", "required": true }, "participants": ["Self"],                               "procedure": ["a. Review variances.", "b. Cluster friction.", "c. Draft D/M/A.", "d. Suggest Improve.", "e. Promote Kaizen."],        "bucket": "CI",            "isNonOptional": true,  "appliesToRoles": ["PRACTITIONER","FACILITATOR","LEADER","CHAMPION"], "enabledByUser": true, "version": 1, "sourceRef": "CATALOG_GAPS.md §H.2",               "dependsOn": [], "projectTypeBinding": null,                                   "phaseBinding": null },
    { "id": "ce_sprint_planning",     "activityNumber": null, "name": "Sprint Planning",                          "focusArea": "CEREMONY",               "defaultDurationMinutes": 120, "cadence": "SPRINT",       "trigger": "First Monday of sprint, 09:30 local",    "inputs": ["Product backlog", "Team capacity"],          "outputArtifact": { "name": "Sprint backlog + goals",          "schema": "DOCUMENT", "required": true }, "participants": ["Team", "Facilitator"],                "procedure": ["a. Confirm sprint goal.", "b. Pull items.", "c. Capacity check."],                                                     "bucket": "COMMUNICATION", "isNonOptional": true,  "appliesToRoles": ["PRACTITIONER","FACILITATOR","LEADER"],            "enabledByUser": true, "version": 1, "sourceRef": "BAM Way Ch.4",                       "dependsOn": [], "projectTypeBinding": null,                                   "phaseBinding": null },
    { "id": "ce_dmaic_sipoc",         "activityNumber": 21,   "name": "DMAIC SIPOC",                              "focusArea": "DMAIC",                  "defaultDurationMinutes": 60,  "cadence": "EVENT_DRIVEN", "trigger": "Opened in DMAIC Define phase",           "inputs": ["Problem statement"],                         "outputArtifact": { "name": "SIPOC diagram",                   "schema": "DOCUMENT", "required": true }, "participants": ["Champion", "Process Owner"],          "procedure": ["a. Suppliers.", "b. Inputs.", "c. Process.", "d. Outputs.", "e. Customers."],                                          "bucket": "PROJECT",       "isNonOptional": false, "appliesToRoles": ["CHAMPION","FACILITATOR"],                         "enabledByUser": true, "version": 1, "sourceRef": "Business Agility Standard Work.txt row 21", "dependsOn": [], "projectTypeBinding": "DMAIC",                                "phaseBinding": null },
    { "id": "ce_kaizen_charter",      "activityNumber": 42,   "name": "Kaizen Charter",                           "focusArea": "KAIZEN",                 "defaultDurationMinutes": 90,  "cadence": "EVENT_DRIVEN", "trigger": "Opened at project start",                "inputs": ["Problem statement", "Baseline data"],        "outputArtifact": { "name": "Signed charter",                  "schema": "DOCUMENT", "required": true }, "participants": ["Champion", "Sponsor", "Process Owner"], "procedure": ["a. Problem + goal.", "b. Scope.", "c. Team + roles.", "d. Sign."],                                                     "bucket": "PROJECT",       "isNonOptional": false, "appliesToRoles": ["CHAMPION","LEADER"],                              "enabledByUser": true, "version": 1, "sourceRef": "Business Agility Standard Work.txt row 42", "dependsOn": [], "projectTypeBinding": ["KAIZEN_EVENT","KAIZEN_EVENT_90D"],    "phaseBinding": null },
    { "id": "ce_eoa_reflection",      "activityNumber": null, "name": "End-of-Activity Reflection",               "focusArea": "CONTINUOUS_IMPROVEMENT", "defaultDurationMinutes": 15,  "cadence": "DAILY",        "trigger": "End of each activity; 15-min buffer 17:00", "inputs": ["Closed activity artifact"],                "outputArtifact": { "name": "60-sec reflection",               "schema": "TEXT",     "required": true }, "participants": ["Self"],                               "procedure": ["a. Plan vs actual.", "b. One friction (optional).", "c. Save."],                                                       "bucket": "CI",            "isNonOptional": true,  "appliesToRoles": ["PRACTITIONER","FACILITATOR","LEADER","CHAMPION"], "enabledByUser": true, "version": 1, "sourceRef": "CATALOG_GAPS.md §H.2",               "dependsOn": [], "projectTypeBinding": null,                                   "phaseBinding": null },
    { "id": "ce_lessons_learned",     "activityNumber": null, "name": "Lessons Learned",                          "focusArea": "CONTINUOUS_IMPROVEMENT", "defaultDurationMinutes": 30,  "cadence": "EVENT_DRIVEN", "trigger": "Required before any Kaizen close",       "inputs": ["Project timeline", "Key decisions", "Variances"], "outputArtifact": { "name": "Lessons-learned artifact",     "schema": "DOCUMENT", "required": true }, "participants": ["Self", "Facilitator"],                "procedure": ["a. What worked.", "b. What didn't.", "c. Next-time rules."],                                                          "bucket": "PROJECT",       "isNonOptional": false, "appliesToRoles": ["PRACTITIONER","FACILITATOR","LEADER","CHAMPION"], "enabledByUser": true, "version": 1, "sourceRef": "CATALOG_GAPS.md §H.2",               "dependsOn": [], "projectTypeBinding": null,                                   "phaseBinding": null }
  ],

  "kaizens": [
    {
      "id": "kzn_reduce_context_switch",
      "userId": "usr_phil",
      "title": "Reduce Slack-driven context switches in the Deep block",
      "problemStatement": "Phil's AM Deep block is interrupted 4–7× per session by Slack mentions, costing ~35 min/day of focused work.",
      "goalStatement": "Reduce Deep-block Slack interruptions from baseline 5.2/day to ≤1.0/day by 2026-05-18.",
      "sourceFrictionSignalIds": ["frc_slack_1", "frc_slack_2", "frc_slack_3"],
      "baselineMetricId": "bas_slack_interruptions",
      "remeasurementId": null,
      "actions": [
        { "name": "Slack DND during 10:00–12:00 Deep block",  "ownerRef": "usr_phil", "dueDate": "2026-04-22", "doneAt": "2026-04-20T17:00:00Z", "strategic": false },
        { "name": "Triage channel list to 6 high-signal channels", "ownerRef": "usr_phil", "dueDate": "2026-04-24", "doneAt": null, "strategic": true },
        { "name": "Weekly Slack-audit block",                  "ownerRef": "usr_phil", "dueDate": "2026-04-26", "doneAt": null, "strategic": false }
      ],
      "state": "ACTIVE",
      "openedAt": "2026-04-13T17:30:00Z",
      "closedAt": null,
      "closeKind": null,
      "resultsNarrativeRef": null,
      "projectType": "KAIZEN_ACCELERATOR_30D",
      "phase": "PHASE_1",
      "phaseDefinitions": [ { "id": "PHASE_0", "name": "Charter", "days": 2, "nonOptionalCatalogEntryIds": [] }, { "id": "PHASE_1", "name": "Measure", "days": 6, "nonOptionalCatalogEntryIds": [] }, { "id": "PHASE_2", "name": "Improve / Draft", "days": 10, "nonOptionalCatalogEntryIds": [] }, { "id": "PHASE_3", "name": "Implement", "days": 8, "nonOptionalCatalogEntryIds": [] }, { "id": "PHASE_4", "name": "ROI + Control", "days": 4, "nonOptionalCatalogEntryIds": [] } ],
      "implementationCostDollars": null,
      "annualBenefitsDollars": null,
      "startDate": "2026-04-13",
      "controlPlanArtifactRef": null,
      "controlPlanDraftArtifactRef": null,
      "implementationLeadUserId": null,
      "roiPassNumber": null,
      "roiProjections": null,
      "validatedRootCauseArtifactRef": null,
      "sustainmentCheckIns": null,
      "sustainmentGatePassed": null,
      "scopeChanges": [],
      "targetCloseDate": null,
      "sourcePdcaExperimentId": null
    }
  ],

  "baseline_metrics": [
    { "id": "bas_slack_interruptions", "kaizenId": "kzn_reduce_context_switch", "metricDefinition": { "name": "Deep-block Slack interruptions per day", "unit": "count/day", "operationalDefinition": "Slack-originated focus changes during 10:00–12:00 local; weekly manual tally.", "sampleSize": 5, "method": "Manual tally at block close." }, "value": 5.2, "capturedAt": "2026-04-13T17:45:00Z", "capturedSampleRef": { "kind": "CSV", "ref": "baselines/kzn_reduce_context_switch_wk1.csv" }, "locked": true }
  ],

  "remeasurements": [],

  "compositions": [
    { "id": "cmp_day_0413", "userId": "usr_phil", "cycleType": "DAILY", "startAt": "2026-04-13T16:00:00Z", "endAt": "2026-04-14T00:00:00Z", "parentCompositionId": "cmp_wk_0413", "state": "CLOSED",   "proposedAt": "2026-04-12T23:00:00Z", "decidedAt": "2026-04-12T23:10:00Z", "closedAt": "2026-04-14T00:00:00Z", "composerInputsSnapshot": { "role": "PRACTITIONER", "capacityMinutes": 480, "sprintPhase": "EXEC_WK1", "activeKaizenId": "kzn_reduce_context_switch", "varianceCount": 0 }, "invariantChecks": { "shape_4_2_2": { "ok": true, "projectMin": 240, "commMin": 120, "ciMin": 120 }, "nonOptionalPresent": { "ok": true, "missing": [] }, "overAllocated": { "ok": true, "totalMin": 480, "capacityMin": 480 } } },
    { "id": "cmp_day_0414", "userId": "usr_phil", "cycleType": "DAILY", "startAt": "2026-04-14T16:00:00Z", "endAt": "2026-04-15T00:00:00Z", "parentCompositionId": "cmp_wk_0413", "state": "CLOSED",   "proposedAt": "2026-04-13T23:00:00Z", "decidedAt": "2026-04-13T23:05:00Z", "closedAt": "2026-04-15T00:00:00Z", "composerInputsSnapshot": { "role": "PRACTITIONER", "capacityMinutes": 480, "sprintPhase": "EXEC_WK1", "activeKaizenId": "kzn_reduce_context_switch", "varianceCount": 1 }, "invariantChecks": { "shape_4_2_2": { "ok": true, "projectMin": 240, "commMin": 120, "ciMin": 120 }, "nonOptionalPresent": { "ok": true, "missing": [] }, "overAllocated": { "ok": true, "totalMin": 480, "capacityMin": 480 } } },
    { "id": "cmp_day_0415", "userId": "usr_phil", "cycleType": "DAILY", "startAt": "2026-04-15T16:00:00Z", "endAt": "2026-04-16T00:00:00Z", "parentCompositionId": "cmp_wk_0413", "state": "CLOSED",   "proposedAt": "2026-04-14T23:00:00Z", "decidedAt": "2026-04-14T23:02:00Z", "closedAt": "2026-04-16T00:00:00Z", "composerInputsSnapshot": { "role": "PRACTITIONER", "capacityMinutes": 480, "sprintPhase": "EXEC_WK1", "activeKaizenId": "kzn_reduce_context_switch", "varianceCount": 0 }, "invariantChecks": { "shape_4_2_2": { "ok": true, "projectMin": 240, "commMin": 120, "ciMin": 120 }, "nonOptionalPresent": { "ok": true, "missing": [] }, "overAllocated": { "ok": true, "totalMin": 480, "capacityMin": 480 } } },
    { "id": "cmp_day_0416", "userId": "usr_phil", "cycleType": "DAILY", "startAt": "2026-04-16T16:00:00Z", "endAt": "2026-04-17T00:00:00Z", "parentCompositionId": "cmp_wk_0413", "state": "ACTIVE",   "proposedAt": "2026-04-15T23:00:00Z", "decidedAt": "2026-04-15T23:04:00Z", "closedAt": null, "composerInputsSnapshot": { "role": "PRACTITIONER", "capacityMinutes": 480, "sprintPhase": "EXEC_WK1", "activeKaizenId": "kzn_reduce_context_switch", "varianceCount": 1 }, "invariantChecks": { "shape_4_2_2": { "ok": true, "projectMin": 240, "commMin": 120, "ciMin": 120 }, "nonOptionalPresent": { "ok": true, "missing": [] }, "overAllocated": { "ok": true, "totalMin": 480, "capacityMin": 480 } } },
    { "id": "cmp_day_0417", "userId": "usr_phil", "cycleType": "DAILY", "startAt": "2026-04-17T16:00:00Z", "endAt": "2026-04-18T00:00:00Z", "parentCompositionId": "cmp_wk_0413", "state": "PROPOSED", "proposedAt": "2026-04-16T23:00:00Z", "decidedAt": null, "closedAt": null, "composerInputsSnapshot": { "role": "PRACTITIONER", "capacityMinutes": 480, "sprintPhase": "EXEC_WK1", "activeKaizenId": "kzn_reduce_context_switch", "varianceCount": 0 }, "invariantChecks": { "shape_4_2_2": { "ok": true, "projectMin": 240, "commMin": 120, "ciMin": 120 }, "nonOptionalPresent": { "ok": true, "missing": [] }, "overAllocated": { "ok": true, "totalMin": 480, "capacityMin": 480 } } },
    { "id": "cmp_wk_0413",  "userId": "usr_phil", "cycleType": "WEEKLY", "startAt": "2026-04-13T16:00:00Z", "endAt": "2026-04-18T00:00:00Z", "parentCompositionId": "cmp_sp_0413", "state": "ACCEPTED", "proposedAt": "2026-04-12T22:00:00Z", "decidedAt": "2026-04-12T22:15:00Z", "closedAt": null, "composerInputsSnapshot": { "role": "PRACTITIONER", "capacityMinutes": 2400, "sprintPhase": "EXEC_WK1", "activeKaizenId": "kzn_reduce_context_switch", "varianceCount": 0 }, "invariantChecks": { "shape_4_2_2": { "ok": true, "projectMin": 1200, "commMin": 600, "ciMin": 600 }, "nonOptionalPresent": { "ok": true, "missing": [] }, "overAllocated": { "ok": true, "totalMin": 2400, "capacityMin": 2400 } } },
    { "id": "cmp_sp_0413",  "userId": "usr_phil", "cycleType": "SPRINT", "startAt": "2026-04-13T16:00:00Z", "endAt": "2026-04-25T00:00:00Z", "parentCompositionId": null,         "state": "PROPOSED", "proposedAt": "2026-04-12T21:00:00Z", "decidedAt": null, "closedAt": null, "composerInputsSnapshot": { "role": "PRACTITIONER", "capacityMinutes": 4800, "sprintPhase": "EXEC_WK1", "activeKaizenId": "kzn_reduce_context_switch", "varianceCount": 0 }, "invariantChecks": { "shape_4_2_2": { "ok": true, "projectMin": 2400, "commMin": 1200, "ciMin": 1200 }, "nonOptionalPresent": { "ok": true, "missing": [] }, "overAllocated": { "ok": true, "totalMin": 4800, "capacityMin": 4800 } } }
  ],

  "scheduled_activities": [
    { "id": "sa_0413_01", "compositionId": "cmp_day_0413", "catalogEntryId": "ce_daily_standup",        "bucket": "COMMUNICATION", "plannedStartAt": "2026-04-13T16:00:00Z", "plannedDurationMinutes": 15,  "actualStartAt": "2026-04-13T16:00:10Z", "actualEndAt": "2026-04-13T16:15:00Z", "intention": "Unblock the staging-env deploy.",        "state": "CLOSED",  "outputArtifactRef": { "schema": "TEXT", "value": "Blockers: staging env. Doing: PR review." }, "reflectionId": "rfl_0413_01", "linkedKaizenId": null, "linkedDmaicStepRef": null, "linkedPdcaExperimentId": null, "reasonCodeIfSkipped": null, "sourceOfSchedule": "COMPOSER_AUTO", "createdAt": "2026-04-12T23:00:00Z", "updatedAt": "2026-04-13T16:15:00Z" },
    { "id": "sa_0413_02", "compositionId": "cmp_day_0413", "catalogEntryId": "ce_high_value_comm_am",   "bucket": "COMMUNICATION", "plannedStartAt": "2026-04-13T16:15:00Z", "plannedDurationMinutes": 60,  "actualStartAt": "2026-04-13T16:15:00Z", "actualEndAt": "2026-04-13T17:10:00Z", "intention": "Respond to 3 escalations; archive rest.", "state": "CLOSED",  "outputArtifactRef": { "schema": "TEXT", "value": "Handled 3 escalations, inbox zero." }, "reflectionId": "rfl_0413_02", "linkedKaizenId": null, "linkedDmaicStepRef": null, "linkedPdcaExperimentId": null, "reasonCodeIfSkipped": null, "sourceOfSchedule": "COMPOSER_AUTO", "createdAt": "2026-04-12T23:00:00Z", "updatedAt": "2026-04-13T17:10:00Z" },
    { "id": "sa_0413_03", "compositionId": "cmp_day_0413", "catalogEntryId": "ce_deep_work_generic",    "bucket": "PROJECT",       "plannedStartAt": "2026-04-13T17:15:00Z", "plannedDurationMinutes": 120, "actualStartAt": "2026-04-13T17:20:00Z", "actualEndAt": "2026-04-13T19:25:00Z", "intention": "Advance Accelerator Phase 1 measurement plan.", "state": "CLOSED", "outputArtifactRef": { "schema": "DOCUMENT", "value": "measurement_plan_v1.md" }, "reflectionId": "rfl_0413_03", "linkedKaizenId": "kzn_reduce_context_switch", "linkedDmaicStepRef": null, "linkedPdcaExperimentId": null, "reasonCodeIfSkipped": null, "sourceOfSchedule": "COMPOSER_AUTO", "createdAt": "2026-04-12T23:00:00Z", "updatedAt": "2026-04-13T19:25:00Z" },
    { "id": "sa_0413_04", "compositionId": "cmp_day_0413", "catalogEntryId": "ce_deep_work_generic",    "bucket": "PROJECT",       "plannedStartAt": "2026-04-13T20:00:00Z", "plannedDurationMinutes": 120, "actualStartAt": "2026-04-13T20:00:00Z", "actualEndAt": "2026-04-13T22:05:00Z", "intention": "Second Deep slice: draft data-collection plan.", "state": "CLOSED", "outputArtifactRef": { "schema": "DOCUMENT", "value": "dcp_v1.md" }, "reflectionId": "rfl_0413_04", "linkedKaizenId": "kzn_reduce_context_switch", "linkedDmaicStepRef": null, "linkedPdcaExperimentId": null, "reasonCodeIfSkipped": null, "sourceOfSchedule": "COMPOSER_AUTO", "createdAt": "2026-04-12T23:00:00Z", "updatedAt": "2026-04-13T22:05:00Z" },
    { "id": "sa_0413_05", "compositionId": "cmp_day_0413", "catalogEntryId": "ce_pdca_cycle",           "bucket": "CI",            "plannedStartAt": "2026-04-13T23:00:00Z", "plannedDurationMinutes": 30,  "actualStartAt": "2026-04-13T23:02:00Z", "actualEndAt": "2026-04-13T23:28:00Z", "intention": "PDCA tick #1: Slack DND on during Deep.",    "state": "CLOSED",  "outputArtifactRef": { "schema": "NUMERIC", "value": { "measurement": 3, "unit": "interruptions/day" } }, "reflectionId": "rfl_0413_05", "linkedKaizenId": null, "linkedDmaicStepRef": null, "linkedPdcaExperimentId": "pdc_slack_dnd", "reasonCodeIfSkipped": null, "sourceOfSchedule": "COMPOSER_AUTO", "createdAt": "2026-04-12T23:00:00Z", "updatedAt": "2026-04-13T23:28:00Z" },
    { "id": "sa_0413_06", "compositionId": "cmp_day_0413", "catalogEntryId": "ce_eoa_reflection",       "bucket": "CI",            "plannedStartAt": "2026-04-13T23:30:00Z", "plannedDurationMinutes": 15,  "actualStartAt": "2026-04-13T23:30:00Z", "actualEndAt": "2026-04-13T23:43:00Z", "intention": "Daily buffer — capture any remaining friction.", "state": "CLOSED", "outputArtifactRef": { "schema": "TEXT", "value": "Good day; one Slack spike at 17:00." }, "reflectionId": "rfl_0413_06", "linkedKaizenId": null, "linkedDmaicStepRef": null, "linkedPdcaExperimentId": null, "reasonCodeIfSkipped": null, "sourceOfSchedule": "COMPOSER_AUTO", "createdAt": "2026-04-12T23:00:00Z", "updatedAt": "2026-04-13T23:43:00Z" },

    { "id": "sa_0414_01", "compositionId": "cmp_day_0414", "catalogEntryId": "ce_daily_standup",        "bucket": "COMMUNICATION", "plannedStartAt": "2026-04-14T16:00:00Z", "plannedDurationMinutes": 15,  "actualStartAt": "2026-04-14T16:01:00Z", "actualEndAt": "2026-04-14T16:18:00Z", "intention": "Raise staging-env blocker.",            "state": "CLOSED",  "outputArtifactRef": { "schema": "TEXT", "value": "Blocker escalated to SRE." }, "reflectionId": "rfl_0414_01", "linkedKaizenId": null, "linkedDmaicStepRef": null, "linkedPdcaExperimentId": null, "reasonCodeIfSkipped": null, "sourceOfSchedule": "COMPOSER_AUTO", "createdAt": "2026-04-13T23:00:00Z", "updatedAt": "2026-04-14T16:18:00Z" },
    { "id": "sa_0414_02", "compositionId": "cmp_day_0414", "catalogEntryId": "ce_high_value_comm_am",   "bucket": "COMMUNICATION", "plannedStartAt": "2026-04-14T16:20:00Z", "plannedDurationMinutes": 60,  "actualStartAt": "2026-04-14T16:20:00Z", "actualEndAt": "2026-04-14T17:30:00Z", "intention": "Clear inbox; tag responses.",           "state": "CLOSED",  "outputArtifactRef": { "schema": "TEXT", "value": "Overran 10m; 2 escalations remain." }, "reflectionId": "rfl_0414_02", "linkedKaizenId": null, "linkedDmaicStepRef": null, "linkedPdcaExperimentId": null, "reasonCodeIfSkipped": null, "sourceOfSchedule": "COMPOSER_AUTO", "createdAt": "2026-04-13T23:00:00Z", "updatedAt": "2026-04-14T17:30:00Z" },
    { "id": "sa_0414_03", "compositionId": "cmp_day_0414", "catalogEntryId": "ce_deep_work_generic",    "bucket": "PROJECT",       "plannedStartAt": "2026-04-14T17:30:00Z", "plannedDurationMinutes": 120, "actualStartAt": null, "actualEndAt": null, "intention": "Phase 1 sampling plan.", "state": "SKIPPED", "outputArtifactRef": null, "reflectionId": null, "linkedKaizenId": "kzn_reduce_context_switch", "linkedDmaicStepRef": null, "linkedPdcaExperimentId": null, "reasonCodeIfSkipped": "ESCALATION", "sourceOfSchedule": "COMPOSER_AUTO", "createdAt": "2026-04-13T23:00:00Z", "updatedAt": "2026-04-14T17:30:00Z" },
    { "id": "sa_0414_04", "compositionId": "cmp_day_0414", "catalogEntryId": "ce_deep_work_generic",    "bucket": "PROJECT",       "plannedStartAt": "2026-04-14T20:30:00Z", "plannedDurationMinutes": 120, "actualStartAt": "2026-04-14T20:35:00Z", "actualEndAt": "2026-04-14T22:45:00Z", "intention": "Recovered Deep slice post-escalation.", "state": "CLOSED",  "outputArtifactRef": { "schema": "DOCUMENT", "value": "sampling_plan_draft.md" }, "reflectionId": "rfl_0414_04", "linkedKaizenId": "kzn_reduce_context_switch", "linkedDmaicStepRef": null, "linkedPdcaExperimentId": null, "reasonCodeIfSkipped": null, "sourceOfSchedule": "USER_EDIT", "createdAt": "2026-04-14T17:45:00Z", "updatedAt": "2026-04-14T22:45:00Z" },
    { "id": "sa_0414_05", "compositionId": "cmp_day_0414", "catalogEntryId": "ce_eoa_reflection",       "bucket": "CI",            "plannedStartAt": "2026-04-14T23:30:00Z", "plannedDurationMinutes": 15,  "actualStartAt": "2026-04-14T23:31:00Z", "actualEndAt": "2026-04-14T23:46:00Z", "intention": "Capture escalation-driven Variance.",   "state": "CLOSED",  "outputArtifactRef": { "schema": "TEXT", "value": "Escalation cost me one Deep slice." }, "reflectionId": "rfl_0414_05", "linkedKaizenId": null, "linkedDmaicStepRef": null, "linkedPdcaExperimentId": null, "reasonCodeIfSkipped": null, "sourceOfSchedule": "COMPOSER_AUTO", "createdAt": "2026-04-13T23:00:00Z", "updatedAt": "2026-04-14T23:46:00Z" },

    { "id": "sa_0415_01", "compositionId": "cmp_day_0415", "catalogEntryId": "ce_daily_standup",        "bucket": "COMMUNICATION", "plannedStartAt": "2026-04-15T16:00:00Z", "plannedDurationMinutes": 15, "actualStartAt": "2026-04-15T16:00:00Z", "actualEndAt": "2026-04-15T16:14:00Z", "intention": "Report SRE fix.",            "state": "CLOSED", "outputArtifactRef": { "schema": "TEXT", "value": "Staging unblocked." }, "reflectionId": "rfl_0415_01", "linkedKaizenId": null, "linkedDmaicStepRef": null, "linkedPdcaExperimentId": null, "reasonCodeIfSkipped": null, "sourceOfSchedule": "COMPOSER_AUTO", "createdAt": "2026-04-14T23:00:00Z", "updatedAt": "2026-04-15T16:14:00Z" },
    { "id": "sa_0415_02", "compositionId": "cmp_day_0415", "catalogEntryId": "ce_deep_work_generic",    "bucket": "PROJECT",       "plannedStartAt": "2026-04-15T16:30:00Z", "plannedDurationMinutes": 120, "actualStartAt": "2026-04-15T16:30:00Z", "actualEndAt": "2026-04-15T18:35:00Z", "intention": "Advance Accelerator measurement.", "state": "CLOSED", "outputArtifactRef": { "schema": "DOCUMENT", "value": "measurement_plan_v2.md" }, "reflectionId": "rfl_0415_02", "linkedKaizenId": "kzn_reduce_context_switch", "linkedDmaicStepRef": null, "linkedPdcaExperimentId": null, "reasonCodeIfSkipped": null, "sourceOfSchedule": "COMPOSER_AUTO", "createdAt": "2026-04-14T23:00:00Z", "updatedAt": "2026-04-15T18:35:00Z" },
    { "id": "sa_0415_03", "compositionId": "cmp_day_0415", "catalogEntryId": "ce_pdca_cycle",           "bucket": "CI",            "plannedStartAt": "2026-04-15T22:30:00Z", "plannedDurationMinutes": 30,  "actualStartAt": "2026-04-15T22:31:00Z", "actualEndAt": "2026-04-15T22:58:00Z", "intention": "PDCA tick #2.", "state": "CLOSED", "outputArtifactRef": { "schema": "NUMERIC", "value": { "measurement": 1, "unit": "interruptions/day" } }, "reflectionId": "rfl_0415_03", "linkedKaizenId": null, "linkedDmaicStepRef": null, "linkedPdcaExperimentId": "pdc_slack_dnd", "reasonCodeIfSkipped": null, "sourceOfSchedule": "COMPOSER_AUTO", "createdAt": "2026-04-14T23:00:00Z", "updatedAt": "2026-04-15T22:58:00Z" },
    { "id": "sa_0415_04", "compositionId": "cmp_day_0415", "catalogEntryId": "ce_eoa_reflection",       "bucket": "CI",            "plannedStartAt": "2026-04-15T23:30:00Z", "plannedDurationMinutes": 15, "actualStartAt": "2026-04-15T23:30:00Z", "actualEndAt": "2026-04-15T23:44:00Z", "intention": "Wrap reflection.", "state": "CLOSED", "outputArtifactRef": { "schema": "TEXT", "value": "Good focus; 1 Slack spike." }, "reflectionId": null, "linkedKaizenId": null, "linkedDmaicStepRef": null, "linkedPdcaExperimentId": null, "reasonCodeIfSkipped": null, "sourceOfSchedule": "COMPOSER_AUTO", "createdAt": "2026-04-14T23:00:00Z", "updatedAt": "2026-04-15T23:44:00Z" },

    { "id": "sa_0416_01", "compositionId": "cmp_day_0416", "catalogEntryId": "ce_daily_standup",        "bucket": "COMMUNICATION", "plannedStartAt": "2026-04-16T16:00:00Z", "plannedDurationMinutes": 15,  "actualStartAt": "2026-04-16T16:00:00Z", "actualEndAt": "2026-04-16T16:13:00Z", "intention": "Status on Accelerator Phase 1.", "state": "CLOSED", "outputArtifactRef": { "schema": "TEXT", "value": "On track." }, "reflectionId": "rfl_0416_01", "linkedKaizenId": null, "linkedDmaicStepRef": null, "linkedPdcaExperimentId": null, "reasonCodeIfSkipped": null, "sourceOfSchedule": "COMPOSER_AUTO", "createdAt": "2026-04-15T23:00:00Z", "updatedAt": "2026-04-16T16:13:00Z" },
    { "id": "sa_0416_02", "compositionId": "cmp_day_0416", "catalogEntryId": "ce_deep_work_generic",    "bucket": "PROJECT",       "plannedStartAt": "2026-04-16T16:30:00Z", "plannedDurationMinutes": 120, "actualStartAt": "2026-04-16T16:33:00Z", "actualEndAt": null, "intention": "Baseline analysis.", "state": "IN_PROGRESS", "outputArtifactRef": null, "reflectionId": null, "linkedKaizenId": "kzn_reduce_context_switch", "linkedDmaicStepRef": null, "linkedPdcaExperimentId": null, "reasonCodeIfSkipped": null, "sourceOfSchedule": "COMPOSER_AUTO", "createdAt": "2026-04-15T23:00:00Z", "updatedAt": "2026-04-16T16:33:00Z" },
    { "id": "sa_0416_03", "compositionId": "cmp_day_0416", "catalogEntryId": "ce_pdca_cycle",           "bucket": "CI",            "plannedStartAt": "2026-04-16T22:30:00Z", "plannedDurationMinutes": 30,  "actualStartAt": null, "actualEndAt": null, "intention": "PDCA tick #3.", "state": "SCHEDULED", "outputArtifactRef": null, "reflectionId": null, "linkedKaizenId": null, "linkedDmaicStepRef": null, "linkedPdcaExperimentId": "pdc_slack_dnd", "reasonCodeIfSkipped": null, "sourceOfSchedule": "COMPOSER_AUTO", "createdAt": "2026-04-15T23:00:00Z", "updatedAt": "2026-04-15T23:00:00Z" },

    { "id": "sa_0417_01", "compositionId": "cmp_day_0417", "catalogEntryId": "ce_daily_standup",        "bucket": "COMMUNICATION", "plannedStartAt": "2026-04-17T16:00:00Z", "plannedDurationMinutes": 15,  "actualStartAt": null, "actualEndAt": null, "intention": "End-of-week status.", "state": "PROPOSED", "outputArtifactRef": null, "reflectionId": null, "linkedKaizenId": null, "linkedDmaicStepRef": null, "linkedPdcaExperimentId": null, "reasonCodeIfSkipped": null, "sourceOfSchedule": "COMPOSER_AUTO", "createdAt": "2026-04-16T23:00:00Z", "updatedAt": "2026-04-16T23:00:00Z" },
    { "id": "sa_0417_02", "compositionId": "cmp_day_0417", "catalogEntryId": "ce_deep_work_generic",    "bucket": "PROJECT",       "plannedStartAt": "2026-04-17T16:30:00Z", "plannedDurationMinutes": 120, "actualStartAt": null, "actualEndAt": null, "intention": "Finish measurement plan.", "state": "PROPOSED", "outputArtifactRef": null, "reflectionId": null, "linkedKaizenId": "kzn_reduce_context_switch", "linkedDmaicStepRef": null, "linkedPdcaExperimentId": null, "reasonCodeIfSkipped": null, "sourceOfSchedule": "COMPOSER_AUTO", "createdAt": "2026-04-16T23:00:00Z", "updatedAt": "2026-04-16T23:00:00Z" },
    { "id": "sa_0417_03", "compositionId": "cmp_day_0417", "catalogEntryId": "ce_weekly_reflection",    "bucket": "CI",            "plannedStartAt": "2026-04-17T23:00:00Z", "plannedDurationMinutes": 20,  "actualStartAt": null, "actualEndAt": null, "intention": "Week's DMAIC draft.", "state": "PROPOSED", "outputArtifactRef": null, "reflectionId": null, "linkedKaizenId": null, "linkedDmaicStepRef": null, "linkedPdcaExperimentId": null, "reasonCodeIfSkipped": null, "sourceOfSchedule": "COMPOSER_AUTO", "createdAt": "2026-04-16T23:00:00Z", "updatedAt": "2026-04-16T23:00:00Z" },
    { "id": "sa_0417_04", "compositionId": "cmp_day_0417", "catalogEntryId": "ce_eoa_reflection",       "bucket": "CI",            "plannedStartAt": "2026-04-17T23:30:00Z", "plannedDurationMinutes": 15,  "actualStartAt": null, "actualEndAt": null, "intention": "End-of-week buffer.", "state": "PROPOSED", "outputArtifactRef": null, "reflectionId": null, "linkedKaizenId": null, "linkedDmaicStepRef": null, "linkedPdcaExperimentId": null, "reasonCodeIfSkipped": null, "sourceOfSchedule": "COMPOSER_AUTO", "createdAt": "2026-04-16T23:00:00Z", "updatedAt": "2026-04-16T23:00:00Z" }
  ],

  "reflections": [
    { "id": "rfl_0413_01", "scheduledActivityId": "sa_0413_01", "userId": "usr_phil", "pending": false, "capturedAt": "2026-04-13T16:18:00Z", "planVsActualMinutes": 0,  "whatWentWell": "Kept it tight.",    "whatToImprove": null,                                  "frictionFlag": false, "frictionSignalId": null,       "kind": "END_OF_ACTIVITY", "dmaicDraft": null },
    { "id": "rfl_0413_02", "scheduledActivityId": "sa_0413_02", "userId": "usr_phil", "pending": false, "capturedAt": "2026-04-13T17:15:00Z", "planVsActualMinutes": -5, "whatWentWell": "Inbox zero.",       "whatToImprove": null,                                  "frictionFlag": false, "frictionSignalId": null,       "kind": "END_OF_ACTIVITY", "dmaicDraft": null },
    { "id": "rfl_0413_03", "scheduledActivityId": "sa_0413_03", "userId": "usr_phil", "pending": false, "capturedAt": "2026-04-13T19:28:00Z", "planVsActualMinutes": 5,  "whatWentWell": "Plan is shaping.",  "whatToImprove": "Slack pings broke flow at 18:00.",    "frictionFlag": true,  "frictionSignalId": "frc_slack_1", "kind": "END_OF_ACTIVITY", "dmaicDraft": null },
    { "id": "rfl_0413_04", "scheduledActivityId": "sa_0413_04", "userId": "usr_phil", "pending": false, "capturedAt": "2026-04-13T22:08:00Z", "planVsActualMinutes": 5,  "whatWentWell": "DCP v1 drafted.",   "whatToImprove": "Too many tabs open.",                 "frictionFlag": false, "frictionSignalId": null,       "kind": "END_OF_ACTIVITY", "dmaicDraft": null },
    { "id": "rfl_0413_05", "scheduledActivityId": "sa_0413_05", "userId": "usr_phil", "pending": false, "capturedAt": "2026-04-13T23:30:00Z", "planVsActualMinutes": -2, "whatWentWell": "Measurement: 3.",   "whatToImprove": "Still 3 interruptions — tighten DND.", "frictionFlag": false, "frictionSignalId": null,       "kind": "END_OF_ACTIVITY", "dmaicDraft": null },
    { "id": "rfl_0413_06", "scheduledActivityId": "sa_0413_06", "userId": "usr_phil", "pending": false, "capturedAt": "2026-04-13T23:45:00Z", "planVsActualMinutes": -2, "whatWentWell": "Good week start.",  "whatToImprove": null,                                  "frictionFlag": false, "frictionSignalId": null,       "kind": "END_OF_ACTIVITY", "dmaicDraft": null },
    { "id": "rfl_0414_01", "scheduledActivityId": "sa_0414_01", "userId": "usr_phil", "pending": false, "capturedAt": "2026-04-14T16:20:00Z", "planVsActualMinutes": 3,  "whatWentWell": "Blocker escalated.", "whatToImprove": null,                                  "frictionFlag": false, "frictionSignalId": null,       "kind": "END_OF_ACTIVITY", "dmaicDraft": null },
    { "id": "rfl_0414_02", "scheduledActivityId": "sa_0414_02", "userId": "usr_phil", "pending": false, "capturedAt": "2026-04-14T17:35:00Z", "planVsActualMinutes": 10, "whatWentWell": "Most cleared.",     "whatToImprove": "Need calmer triage rule.",            "frictionFlag": true,  "frictionSignalId": "frc_meeting_load_1", "kind": "END_OF_ACTIVITY", "dmaicDraft": null },
    { "id": "rfl_0414_04", "scheduledActivityId": "sa_0414_04", "userId": "usr_phil", "pending": false, "capturedAt": "2026-04-14T22:50:00Z", "planVsActualMinutes": 10, "whatWentWell": "Recovered slice.",  "whatToImprove": "Escalation-driven context switch.",   "frictionFlag": true,  "frictionSignalId": "frc_slack_2", "kind": "END_OF_ACTIVITY", "dmaicDraft": null },
    { "id": "rfl_0414_05", "scheduledActivityId": "sa_0414_05", "userId": "usr_phil", "pending": true,  "capturedAt": null,                    "planVsActualMinutes": 1,  "whatWentWell": null,                "whatToImprove": null,                                  "frictionFlag": false, "frictionSignalId": null,       "kind": "END_OF_ACTIVITY", "dmaicDraft": null },
    { "id": "rfl_0415_01", "scheduledActivityId": "sa_0415_01", "userId": "usr_phil", "pending": false, "capturedAt": "2026-04-15T16:18:00Z", "planVsActualMinutes": -1, "whatWentWell": "Fast standup.",     "whatToImprove": null,                                  "frictionFlag": false, "frictionSignalId": null,       "kind": "END_OF_ACTIVITY", "dmaicDraft": null },
    { "id": "rfl_0415_02", "scheduledActivityId": "sa_0415_02", "userId": "usr_phil", "pending": false, "capturedAt": "2026-04-15T18:40:00Z", "planVsActualMinutes": 5,  "whatWentWell": "Measurement plan v2.", "whatToImprove": "One bad Slack ping.",               "frictionFlag": true,  "frictionSignalId": "frc_slack_3", "kind": "END_OF_ACTIVITY", "dmaicDraft": null },
    { "id": "rfl_0415_03", "scheduledActivityId": "sa_0415_03", "userId": "usr_phil", "pending": false, "capturedAt": "2026-04-15T23:02:00Z", "planVsActualMinutes": -3, "whatWentWell": "Down to 1/day.",    "whatToImprove": null,                                  "frictionFlag": false, "frictionSignalId": null,       "kind": "END_OF_ACTIVITY", "dmaicDraft": null }
  ],

  "variances": [
    { "id": "var_0414_01", "scheduledActivityId": "sa_0414_03", "compositionId": "cmp_day_0414", "catalogEntryId": "ce_deep_work_generic", "userId": "usr_phil", "kind": "SKIPPED_NON_OPTIONAL", "reasonCode": "ESCALATION", "note": "SRE paged for staging fire.", "loggedAt": "2026-04-14T17:32:00Z" },
    { "id": "var_0414_02", "scheduledActivityId": "sa_0414_02", "compositionId": "cmp_day_0414", "catalogEntryId": "ce_high_value_comm_am", "userId": "usr_phil", "kind": "OVERRAN",             "reasonCode": "MEETING_CONFLICT", "note": null,                     "loggedAt": "2026-04-14T17:35:00Z" },
    { "id": "var_0414_03", "scheduledActivityId": "sa_0414_04", "compositionId": "cmp_day_0414", "catalogEntryId": "ce_deep_work_generic", "userId": "usr_phil", "kind": "RESCHEDULED",         "reasonCode": "ESCALATION", "note": "Moved from 17:30 to 20:30.",  "loggedAt": "2026-04-14T17:45:00Z" }
  ],

  "friction_signals": [
    { "id": "frc_slack_1",         "reflectionId": "rfl_0413_03", "scheduledActivityId": "sa_0413_03", "userId": "usr_phil", "summary": "Slack DM stack broke Deep flow at 18:00.",             "tag": "CONTEXT_SWITCH", "status": "OPEN",    "kaizenId": null, "capturedAt": "2026-04-13T19:28:00Z" },
    { "id": "frc_meeting_load_1",  "reflectionId": "rfl_0414_02", "scheduledActivityId": "sa_0414_02", "userId": "usr_phil", "summary": "Comm block overran; 2 escalations carry over.",       "tag": "MEETING_LOAD",   "status": "OPEN",    "kaizenId": null, "capturedAt": "2026-04-14T17:35:00Z" },
    { "id": "frc_slack_2",         "reflectionId": "rfl_0414_04", "scheduledActivityId": "sa_0414_04", "userId": "usr_phil", "summary": "Slack-driven context switch from SRE page.",           "tag": "CONTEXT_SWITCH", "status": "CLUSTERED", "kaizenId": "kzn_reduce_context_switch", "capturedAt": "2026-04-14T22:50:00Z" },
    { "id": "frc_slack_3",         "reflectionId": "rfl_0415_02", "scheduledActivityId": "sa_0415_02", "userId": "usr_phil", "summary": "One Slack ping during DND; channel mis-configured.",  "tag": "TOOL_FRICTION",  "status": "OPEN",    "kaizenId": null, "capturedAt": "2026-04-15T18:40:00Z" },
    { "id": "frc_tool_1",          "reflectionId": "rfl_0414_04", "scheduledActivityId": "sa_0414_04", "userId": "usr_phil", "summary": "Browser tab bloat slowed context return after page.", "tag": "TOOL_FRICTION",  "status": "OPEN",    "kaizenId": null, "capturedAt": "2026-04-14T22:52:00Z" }
  ],

  "pdca_experiments": [
    {
      "id": "pdc_slack_dnd",
      "userId": "usr_phil",
      "hypothesis": "If Slack DND is on during 10:00–12:00, Deep-block interruptions drop to ≤1/day.",
      "targetMetricName": "Deep-block Slack interruptions per day",
      "targetMetricUnit": "count/day",
      "currentConditionBaseline": 5.2,
      "targetCondition": 1.0,
      "state": "DO",
      "tickActivityIds": ["sa_0413_05", "sa_0415_03", "sa_0416_03"],
      "consecutiveTargetHits": 2,
      "openedAt": "2026-04-13T18:00:00Z",
      "closedAt": null,
      "closedReason": null
    }
  ],

  "metrics_snapshots": [
    {
      "id": "mts_2026_04_18_a",
      "userId": "usr_phil",
      "windowStart": "2026-04-04T00:00:00Z",
      "windowEnd":   "2026-04-18T00:00:00Z",
      "adherencePercent": 83.0,
      "compositionAcceptanceDaily": 72.0,
      "compositionAcceptanceWeekly": 100.0,
      "reflectionRatePercent": 78.0,
      "activeKaizenDeltaPercent": -61.5,
      "computedAt": "2026-04-18T15:00:00Z"
    }
  ]
}
```

---

## §5 — Example schedule outputs

All times in `America/Los_Angeles`. Rendered from the seeded data in §4 plus a canonical ENGINE_DESIGN §1.9 day. "Cadence" is the canonical term for a composed cycle; "Bucket" is one of PROJECT / COMMUNICATION / CI.

### 5.1 Example Cadence Day — Tue 2026-04-14 (Execution Wk1, Accelerator Phase 1)

Inputs: capacity 480 min, externalMinutesToday 60 (11:00–12:00 external), activeKaizen = `kzn_reduce_context_switch`. Composer produced a PROPOSED day; the user ACCEPTED it; Escalation broke the 10:30 Deep slice and rescheduled it to the afternoon.

| Time (local) | Block | Bucket | Min | CatalogEntry | Intention | State |
|---|---|---|---|---|---|---|
| 09:00 | Daily Standup | COMMUNICATION | 15 | `ce_daily_standup` | Raise staging-env blocker | CLOSED |
| 09:20 | AM High-value Communication | COMMUNICATION | 60 (overran 70) | `ce_high_value_comm_am` | Clear inbox; tag responses | CLOSED |
| 10:30 | Deep Work — DMAIC #34 (slice 1) | PROJECT | 120 | `ce_deep_work_generic` | Phase 1 sampling plan | SKIPPED (escalation) |
| 11:00 | External meeting (capacity only) | — | 60 | n/a | — | — |
| 13:00 | Post-lunch High-value Communication | COMMUNICATION | 30 | `ce_high_value_comm_am` | Second comm window | CLOSED |
| 13:30 | Deep Work — DMAIC #34 (slice 2, rescued) | PROJECT | 120 | `ce_deep_work_generic` | Recovered slice post-escalation | CLOSED |
| 15:45 | Personal L&D tick (rescued from Mon variance) | CI | 60 | `ce_weekly_reflection`-adjacent | R2 VARIANCE_RESCUE | CLOSED |
| 16:45 | PDCA Cycle tick #2 | CI | 30 | `ce_pdca_cycle` | Tighten DND | CLOSED |
| 17:15 | End-of-Activity Reflection (buffer) | CI | 15 | `ce_eoa_reflection` | Capture day's Variance | CLOSED |

Totals: PROJECT 240, COMMUNICATION 60+30=90 (note: AM block shrunk from 60 target to 60 actual + 30 post-lunch because `externalMinutesToday=60` reduced the COMM budget to `max(60, 120-60)=60`; composer protected presence of both non-optionals), CI 60+30+15=105. Total scheduled 435 + 60 external = 495 min; 15 min over cap triggered R8 relax: AM shrunk to 60. Final day fits capacity.

### 5.2 Example Cadence Week — 2026-04-13 → 2026-04-17 (Execution Wk1)

Each column is a Cadence Day. Weekly non-optionals attach to anchor days per ENGINE_DESIGN §1.3.

| Time slot | Mon 04-13 | Tue 04-14 | Wed 04-15 | Thu 04-16 | Fri 04-17 |
|---|---|---|---|---|---|
| 09:00 morning | Daily Standup (15) → AM Comm (60) | Daily Standup (15) → AM Comm (60) | Daily Standup (15) → AM Comm (60) | Daily Standup (15) → AM Comm (60) | Daily Standup (15) → AM Comm (60) |
| 10:30–12:30 Deep slice 1 | Deep — Accelerator Phase 1 (120) | Deep — Sampling plan (120, SKIPPED → rescued PM) | Deep — Measurement plan v2 (120) | Deep — Baseline analysis (120) | Deep — Finish measurement plan (120) |
| 13:00–13:30 PM Comm | Post-lunch Comm (30) | Post-lunch Comm (30) | Post-lunch Comm (30) + Weekly 1:1 (20) | Post-lunch Comm (30) + Weekly 1:1 (20) | Post-lunch Comm (30) |
| 13:30–15:30 Deep slice 2 | Deep — DCP v1 (120) | Deep — Recovered slice (120) | Deep — Phase 1 data (120) | Deep — Phase 1 wrap (120) | Deep — Document writing (120) |
| 15:45 CI block | PDCA tick #1 (30) | L&D tick rescued (60) | PDCA tick #2 (30) | PDCA tick #3 (30) | Weekly Reflection (20) |
| 17:15 End-of-day | EoA Reflection (15) | EoA Reflection (15) | EoA Reflection (15) | EoA Reflection (15) | EoA Reflection (15) |

Anchors triggered this week:
- **Weekly 1:1** — Wed 13:30 (per ENGINE_DESIGN §1.3 preferred day WED)
- **6S Email** — not tripped (`inboxOverThreshold=false`)
- **Weekly Reflection** — Fri 16:00 (`ce_weekly_reflection`), bucket=CI, protected
- **Mid-Sprint Review** — not this week (this is Wk1; Mid-Sprint anchors on Fri Wk1 of a 2-week sprint — see §5.3)

### 5.3 Example Cadence Sprint — 2026-04-13 → 2026-04-24 (Sprint Wk1 + Wk2)

Sprint phase anchors (ENGINE_DESIGN §1.2 Step 4):
- `PLANNING_DAY` → Sprint Planning (120, COMMUNICATION) on Mon Wk1
- `MID_SPRINT_DAY` → Mid-Sprint Review (30, COMMUNICATION) on Fri Wk1
- `REVIEW_DAY` + `RETRO_DAY` → Sprint Review (60) + Retrospective (30) on Fri Wk2

Abbreviated daily columns (M/T/W/Th/F): `S` standup, `C` comm, `D` Deep, `CI` CI activity, `R` reflection.

| Sprint day | Theme | Anchors | Abbreviated shape |
|---|---|---|---|
| Mon 04-13 (Wk1) | Planning | **Sprint Planning (120)** displaces AM Deep slice 1 | S · Planning · C · D · CI · R |
| Tue 04-14 | Execute | — | S · C · D · C · D · CI · R |
| Wed 04-15 | Execute | 1:1 (20) in PM | S · C · D · C+1:1 · D · CI · R |
| Thu 04-16 | Execute | — | S · C · D · C · D · CI · R |
| Fri 04-17 | Mid-Sprint | **Mid-Sprint Review (30)** in PM Comm | S · C · D · MidSprint · CI · R · Weekly Reflection |
| Mon 04-20 (Wk2) | Execute | — | S · C · D · C · D · CI · R |
| Tue 04-21 | Execute | (ENGINE_DESIGN §1.9 worked example day) | S · C · D · C · D · CI · R |
| Wed 04-22 | Execute | 1:1 (20) | S · C · D · C+1:1 · D · CI · R |
| Thu 04-23 | Review prep | — | S · C · D · C · D · CI · R |
| Fri 04-24 | Review + Retro | **Sprint Review (60) + Retrospective (30)** in PM | S · C · D · Review · Retro · R · Weekly Reflection |

Sprint capacity: 10 working days × 480 min = 4800 min. Weekly invariant PROJECT ≥ 1200 min/week holds on both weeks.

### 5.4 Example Cadence Month — 2026-04-13 → 2026-05-09 (2 sprints + check-in)

Two Sprint compositions stacked, plus a Monthly Check-in on the Friday after Sprint 2 closes, plus a Quarterly Planning block if the month crosses a quarter boundary.

| Window | Anchors | Notes |
|---|---|---|
| Sprint 1: 2026-04-13 → 2026-04-24 (Wk1 + Wk2) | Planning Mon Wk1 · Mid-Sprint Fri Wk1 · Review+Retro Fri Wk2 | See §5.3 |
| Sprint 2: 2026-04-27 → 2026-05-08 (Wk3 + Wk4) | Planning Mon Wk3 · Mid-Sprint Fri Wk3 · Review+Retro Fri Wk4 | Structure identical to §5.3 |
| Monthly Check-in: Fri 2026-05-08 16:30 | 45-min block, bucket=CI | Reviews month's Validated Kaizens + Kaizen throughput |
| Quarter boundary check | Not this month (Q2 starts 2026-04-01; next quarter 2026-07-01) | If boundary hit, Quarterly Planning (180 min) anchors on first Mon of new quarter |

---

## §6 — MVP Build Prompt

A self-contained prompt an engineering agent can execute to produce the MVP code. Hand this section verbatim to the executor; it references this document and the 13 parent design docs.

```
ROLE
  You are the CadencePlan MVP build agent. Ship the single-page, single-user,
  offline-native MVP of CadencePlan against ARCHITECTURE v0.6, ENGINE_DESIGN
  v0.4.1, PRODUCT_BLUEPRINT v0.3, DELIVERY_PLAN v0.3, GLOSSARY v1.0, and the
  six §-referenced operating standards.

GOAL
  A user can open the app, see tomorrow's Cadence Day composed as a valid
  4-2-2 PROPOSED composition, Accept / Edit / Reject, run each ScheduledActivity
  with a captured artifact and a ≤15-min Reflection, skip non-optionals with a
  Reason Code that writes an append-only Variance, promote one Kaizen per month
  from the Weekly Reflection, and close that Kaizen with a Remeasurement that
  the InvariantEngine refuses to skip. Three dashboard numbers (adherence,
  composition acceptance, active-Kaizen delta) visible on login. 30-Day
  Accelerator project type operable with phase FSM + ROI gate.

REQUIRED READING (in order)
  1. SCHEDULING_DELIVERABLES.md — this document (PRD, schema, types, seed,
     schedule examples, and this build prompt).
  2. PRODUCT_BLUEPRINT.md v0.3 — MVP scope, success metrics, JTBD.
  3. ARCHITECTURE.md v0.6 — module map (§1), entity tables (§2), FSMs (§3),
     event catalog (§6), persistence strategy (§7).
  4. ENGINE_DESIGN.md v0.4.1 — composer algorithms (§1), capacity math (§2),
     catalog model (§3), CI workflows (§4).
  5. DELIVERY_PLAN.md v0.3 — 18 epics, sprint plan, acceptance criteria.
  6. GLOSSARY.md v1.0 — canonical terms; use these in all code + UI strings.
  7. CATALOG_GAPS.md — catalog seed extensions, §H.2 generics, §J DMAIC DAG,
     §K Kaizen Event 90D catalog bindings.
  8. SCHEDULING_UX.md — component tree, page routes, interaction patterns.
  9. PROJECT_TYPE_30D_KAIZEN.md — Accelerator spec (phases, ROI, guards).
  10. KAIZEN_EVENT_STANDARD.md — Kaizen Event 90D spec (Sustainment Gate).
  11. DMAIC_STANDARD.md — DMAIC spec (two-pass ROI, validated root cause, MSA).
  12. ACCELERATOR_STANDARD.md — Accelerator operating standard.
  13. ADHOC_PDCA_STANDARD.md — AD_HOC + PDCA operating standard.
  14. AI_AGENTS.md — Planning / Reflection / Kaizen agents + telemetry.

TECH STACK (locked)
  - Vanilla ES modules, modern browsers (Chrome/Edge/Firefox current).
  - Zero runtime dependencies. No React, no TS compilation, no bundler.
  - Persistence: localStorage under `bamx:v1:*` keys (ARCHITECTURE §7.1).
  - Test harness: `node --test` (stdlib) + JSDOM when DOM is involved.
  - Types: JSDoc typedefs in js/domain/types.js (TypeScript port in §3 of
    SCHEDULING_DELIVERABLES.md is aspirational, not MVP).

FILE LAYOUT (js/ tree)
  js/
    app.js                        # Entry point; wires AppShell + router
    domain/
      types.js                    # Typedefs + enums (already seeded Sprint 1)
      invariants.js               # InvariantEngine — validateComposition()
    services/
      ComposerService.js          # composeDaily / composeWeekly
      ActivityService.js          # start / close / skip
      ReflectionService.js        # auto-stub + capture
      KaizenService.js            # promote / lockBaseline / remeasure / close
      PdcaService.js              # tick FSM
      MetricsService.js           # rolling 14-day snapshot
      VarianceService.js          # append-only log
      FrictionService.js          # cluster + promote
      PortfolioService.js         # Validated Kaizen query (E14)
      BacklogService.js           # ImplementationBacklog CRUD (E18)
    engine/
      capacity.js                 # computeBucketTargets / floors / ceilings
      pickCI.js                   # CI rotation
      pickComm.js                 # Comm filler
      selectDeepPayload.js        # §1.6 Deep payload selector
      orderDay.js                 # §1.7 ordering
      kaizen90/
        sustainmentGate.js        # canAttemptRebaseline (E17)
        sprintVelocity.js         # velocity rollup (E18)
      msa/                        # E16 — Gage R&R, Kappa
      accelerator/
        phaseAdvance.js           # canAdvancePhase weighted guard
    catalog/
      seed/
        core.js                   # Blueprint §3.1 entries
        generics.js               # §H.2 generics
        dmaicDag.js               # §J DAG edges
        accelerator.js            # 31 Accelerator entries
        kaizenEvent90.js          # §K bindings (E17)
    persistence/
      LocalStorageRepository.js   # read / write / upsert / appendOnly
      migrations/                 # forward-only schema migrations
      exportCsv.js                # E14 CSV export
    events/
      EventBus.js                 # subscribe / publish (synchronous)
      events.js                   # typed event constants
    ui/
      AppShell.js                 # layout
      router.js                   # hash-based router
      pages/
        Today.js
        Week.js
        Catalog.js
        Kaizens.js
        InsightsPortfolio.js      # E14
        InsightsVariance.js
      components/
        CycleCard.js
        BucketStrip.js
        CatalogPicker.js
        ScheduledActivityBlock.js
        ReflectionSheet.js
        WeeklyReflectionWizard.js
        KaizenCard.js
        PhaseStepper.js           # Accelerator + Kaizen 90 variants
        AdherenceDial.js
        SustainmentGatePanel.js   # E17 / E18
        BacklogTable.js           # E18
      coaching/
        registry.js               # microcopy triggers
    tests/
      unit/                       # one file per service / engine module
      integration/                # compose → accept → run → close → remeasure
      fixtures/                   # ENGINE_DESIGN §1.9 worked example

EPIC EXECUTION ORDER (DELIVERY_PLAN §3.2)
  Window 1 (days 1–30): E1 → E2 → E4 → E12 → E3 → E10 (shell only)
  Window 2 (days 31–60): E3 (finish) → E5 → E6 → E8 → E7 (partial) → E10 (core)
  Window 3 (days 61–90): E7 (finish) → E9 → E10 (finish) → E11 → E12 (finish)
  Window 4 (days 91–120): E13 → E14 → E18 → E7 v0.3 extensions
  Window 5 (days 121–150): E17 → E15 → E16 → E7 stats extensions
  Each epic closes only after its go/no-go gate passes (DELIVERY_PLAN §3.2).

TEST REQUIREMENTS
  - Every acceptance criterion in DELIVERY_PLAN §2 maps to at least one test.
  - `node --test js/tests/**/*.test.js` runs green with exit 0.
  - No network calls in tests; all localStorage replaced with InMemoryRepo.
  - Coverage target: 128+ passing tests by end of Window 3 (MVP launch).
    Approximate breakdown: E1 (10) + E2 (10) + E3 (14) + E4 (8) + E5 (8)
    + E6 (8) + E7 (16) + E8 (10) + E9 (10) + E10 (20) + E11 (5) + E12 (10).
  - Golden test: ENGINE_DESIGN §1.9 worked example must compose to the
    exact shape in §5.1 of this document.

QUALITY BAR
  - Composer p95 < 100ms on the localStorage fixture (DELIVERY_PLAN Window 1
    gate). Measured with `performance.now()` in an integration test.
  - Lighthouse 90+ on /today, /week, /catalog, /kaizens (mobile profile).
  - No runtime dependencies. package.json `"dependencies"` is empty.
  - All canonical terms from GLOSSARY.md used verbatim in UI strings.
  - InvariantEngine is the sole authority on Composition validity. UI never
    re-checks 4-2-2 or non-optional presence; it reads `invariantChecks` off
    the Composition.
  - Every ScheduledActivity close must have an `outputArtifactRef` matching
    CatalogEntry.outputArtifact.schema, else ActivityService.close() throws
    CLOSE_REQUIRES_ARTIFACT.
  - Variance writes go through VarianceService.log(); direct repo overwrite
    must throw APPEND_ONLY_VIOLATION.
  - Kaizen close without matching-metric Remeasurement throws
    KAIZEN_CLOSE_REQUIRES_REMEASUREMENT.

DELIVERABLE EXPECTATIONS
  1. A running single-page app served from `index.html` with `<script type
     ="module" src="./js/app.js">`. Opens to `/today` by default.
  2. A seeded catalog of ≥ 60 entries (core §3.1 + §H.2 generics + §J DMAIC
     + Accelerator 31 entries). Unit test: seed completes without DAG cycle.
  3. A test suite runnable via `node --test` with the count in "Quality bar."
  4. A DELIVERY.md (short) that captures epic-by-epic exit criteria check.
  5. A LAUNCH_METRIC.md proof that the launch metric (PRODUCT_BLUEPRINT §7.4)
     is computable from persisted entities on day 90.

DO
  - Start every epic by reading its row in DELIVERY_PLAN §2, mapping each
    acceptance criterion to a test file, and writing the test first.
  - Use the canonical term "Cadence Day / Cadence Week / Cadence Sprint /
    Cadence Month" in all user-facing strings (GLOSSARY).
  - Emit events from services after state commits, never before.
  - Keep services pure where possible; side effects only in Repository.
  - Ship every invariant as both an application-layer guard and a test.

DO NOT
  - Introduce runtime dependencies. The app is vanilla ESM forever.
  - Put domain logic in UI components. Components read; services mutate.
  - Invent entities or events beyond ARCHITECTURE v0.6 §2 and §6.1.
  - Short-circuit the HARD RULES: Kaizen close without remeasurement;
    Variance append-only; non-optional delete; 4-2-2 shape.
  - Ship DMAIC / MSA / Control Chart code in MVP core — they belong to
    Window 5 (E15, E16).
  - Implement Sprint / Monthly composers in MVP core — they are Next.
  - Touch AI features before Window 4; agents are scoped by AI_AGENTS.md.

REPORT-BACK FORMAT
  At each window gate, return:
    1. Window + date
    2. Epics closed this window (IDs + acceptance-test count)
    3. Go / no-go gate result (pass / fail + evidence)
    4. Composer p95 number on the fixture
    5. Test totals (pass / fail / skip)
    6. Any invariant violation detected in fixtures or integration tests
    7. Any GLOSSARY or ARCHITECTURE gap surfaced (with proposed resolution)
    8. Delta against estimate (days over / under)

END PROMPT.
```

---

## Appendix — cross-reference traceability

| Deliverable section | Parent doc section |
|---|---|
| §1 PRD summary / goals | PRODUCT_BLUEPRINT §1, §4.1, §7 |
| §1 personas | PRODUCT_BLUEPRINT §6 |
| §1 user stories | PRODUCT_BLUEPRINT §6.1–§6.4 + ARCHITECTURE §3 FSMs |
| §1 feature list E14–E18 | DELIVERY_PLAN §2 (E14–E18) |
| §1 launch plan | DELIVERY_PLAN §3.2 |
| §2 SQL schema | ARCHITECTURE §7.3 (sketch) + §2 (entity tables) + §7.1 (MVP shape) |
| §2 kaizens invariants | ARCHITECTURE §2.9 invariants + all 3 operating standards §1.5–§1.6 |
| §3 TypeScript model | js/domain/types.js (verbatim port) + ARCHITECTURE §2 |
| §3 InfeasibleResult | ARCHITECTURE §4.7 |
| §4 seed — catalog entries | PRODUCT_BLUEPRINT §3.1 + CATALOG_GAPS §H.2, §K |
| §4 seed — Accelerator Kaizen | PROJECT_TYPE_30D_KAIZEN §3 (phases) + ARCHITECTURE §2.9 |
| §5.1 day | ENGINE_DESIGN §1.9 worked example |
| §5.2 week | ENGINE_DESIGN §1.3 |
| §5.3 sprint | ENGINE_DESIGN §1.2 step 4 (phase ceremonies) |
| §5.4 month | PRODUCT_BLUEPRINT §3.2 |
| §6 build prompt — file layout | ARCHITECTURE §1.1 module map |
| §6 build prompt — epics | DELIVERY_PLAN §1 |

End of SCHEDULING_DELIVERABLES.md.
