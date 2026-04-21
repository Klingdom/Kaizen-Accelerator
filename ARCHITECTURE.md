# BAM-X Kaizen OS — System Architecture

Owner: System Architect Agent
Status: Draft v0.6 — v0.6 folds the fourth operating standard (`ADHOC_PDCA_STANDARD.md` v1.0) into the architecture. Adds `Kaizen.targetCloseDate` (required for AD_HOC pace warnings); adds `Kaizen.sourcePdcaExperimentId` for PDCA → Kaizen promotion lineage (distinct from friction-signal lineage); adds Lessons-Learned-at-CLOSED invariant enforced across every projectType + closeKind via the existing CLOSED-ScheduledActivity pattern (generic catalog entry seeded in `CATALOG_GAPS §H.2`); extends `ProjectPaceWarning` emitter logic (§6.1) with an AD_HOC path (`targetCloseDate`-based) and documents that DMAIC + 1–5 day Kaizen Event have no automatic pace warning; documents the PDCA tick-10 mandatory review behavior on `PdcaExperiment` (Reflection agent surfaces, not a hard block). Logs decisions 23–26 (§9). v0.5 folds the three prior operating standards (`ACCELERATOR_STANDARD.md` v1.0, `DMAIC_STANDARD.md` v1.0, `KAIZEN_EVENT_STANDARD.md` v1.0) back into the architecture. Adds `KAIZEN_EVENT_90D` as a distinct `projectType` (per Kaizen 90 Option B); extends phase support to both `KAIZEN_ACCELERATOR_30D` and `KAIZEN_EVENT_90D`; adds new Kaizen fields (`sustainmentCheckIns[]`, `sustainmentGatePassed`, `validatedRootCauseArtifactRef`, `roiPassNumber`, `scopeChanges[]`); generalizes `AcceleratorPaceWarning` → `ProjectPaceWarning`; adds `ScopeChangeRequested` event; adds Sustainment Gate + weighted Phase 3→4 + Control-Plan-at-Phase-2 + MSA-before-Baseline + two-pass Financial Benefit + Finance-partner-mandatory invariants; formalizes `FINANCE_PARTNER` and `IMPLEMENTATION_LEAD` roles. Logs decisions 16–22 (§9). v0.4 pulled the 30-Day Kaizen Accelerator project type into MVP: adds `CatalogEntry.projectTypeBinding` + `phaseBinding`, `Kaizen.projectType` + `phase` + `phaseDefinitions` + `implementationCostDollars` + `annualBenefitsDollars` + `startDate` (and computed `roi`), adds new §3.4 Phase FSM for `KAIZEN_ACCELERATOR_30D`, adds `focusArea='KAIZEN_ACCELERATOR_30D'` enum value, adds `ProjectPhaseAdvanced` + `AcceleratorPaceWarning` events (§6.1), adds three invariant cross-reference rows (§8), and logs decision 15 (§9). See `PROJECT_TYPE_30D_KAIZEN.md` for the authoritative spec. v0.3.1 patches §7.1 to add `bamx:v1:agent-suggestions` and `bamx:v1:agent-telemetry` persistence keys for the AI layer cache + telemetry log (see `AI_AGENTS.md` §3). v0.3 closes 3 engine-flagged gaps (reflection naming canonicalization, `PdcaExperiment` entity added, `clusterDismissals` persistence key added) and resolves 3 prior engine questions (DMAIC payload = `CatalogEntry.dependsOn` DAG with async parallelism, INFEASIBLE guided resolution flow with `InfeasibleResult` shape, deep slicing preference on User). v0.2 closed 5 UX-flagged gaps (pending reflection, reason-code OTHER, ActivityStartedLate event, MetricsService.getLatestSnapshot, Kaizen readyToRemeasure computed property) and resolved 3 earlier open questions (team ceremonies single-user, catalog bucket mapping, external calendar capacity in MVP).
Scope: MVP (vanilla JS + localStorage, single-user) with a forward-compatible path to Next.js + PostgreSQL + API.

> **Terminology reconciliation with the upstream prompt.**
> `02-system-architecture.md` uses the pre-blueprint vocabulary ("Intentions" as the primary object; "3 phases per day"). The blueprint supersedes that framing. This document models the system as:
> - **Catalog Entry** — primitive (a vetted named standard-work activity)
> - **Cycle Type** — kind of composition (Daily, Weekly, Sprint, Monthly)
> - **Composition** — a time-bounded instance of a Cycle Type, filled with Scheduled Activities
> - **Scheduled Activity** — an instance of a Catalog Entry placed inside a Composition
> - **Reflection, Variance, Friction Signal, Kaizen, Baseline Metric, Remeasurement** — evidence and improvement artifacts
> - **4-2-2** — a domain invariant on the Daily composition, not a standalone "phases" object
> - **Intention** — a *field* on a Scheduled Activity (the declared outcome for that block), not a primary entity

---

## 1. System Architecture Diagram (ASCII)

### 1.1 High-level module map (MVP, runnable as a single-page app)

```
+-----------------------------------------------------------------------------------+
|                              BROWSER (single-page app)                            |
|                                                                                   |
|  +-----------------------------+      +-------------------------------------+     |
|  |       UI LAYER (views)      |      |        EVENT BUS (observer)         |     |
|  |  - Composer view (D/W)      |<---->|  pub/sub; cross-module decoupling   |     |
|  |  - Activity runner          |      |  (ActivityCompleted, VarianceLogged |     |
|  |  - Reflection prompt        |      |   KaizenPromoted, CycleAccepted...) |     |
|  |  - Kaizen record            |      +-------------------------------------+     |
|  |  - Dashboard (adherence)    |                    ^       ^                     |
|  +--------------+--------------+                    |       |                     |
|                 |                                   |       |                     |
|                 v                                   |       |                     |
|  +-----------------------------+                    |       |                     |
|  |    APPLICATION SERVICES     |--------------------+       |                     |
|  |  (pure JS modules, no UI)   |                            |                     |
|  |                             |                            |                     |
|  |  ComposerService  ----+     |                            |                     |
|  |  ActivityService  ----+     |                            |                     |
|  |  ReflectionService ---+     |                            |                     |
|  |  VarianceService  ----+-----+                            |                     |
|  |  KaizenService    ----+     |                            |                     |
|  |  MetricsService   ----+     |                            |                     |
|  |  CatalogService   ----+     |                            |                     |
|  +--------------+--------------+                            |                     |
|                 |                                           |                     |
|                 v                                           |                     |
|  +-----------------------------+      +-------------------------------------+     |
|  |       DOMAIN MODEL          |      |         INVARIANT ENGINE            |     |
|  |  (pure data + validators)   |<---->|  - Daily 4-2-2 shape                |     |
|  |  Catalog Entry, Cycle,      |      |  - Non-optional set in §3.4         |     |
|  |  Composition, Scheduled     |      |  - Output-artifact-at-close         |     |
|  |  Activity, Reflection,      |      |  - Kaizen close needs remeasurement |     |
|  |  Variance, Friction Signal, |      |  - Variance log append-only         |     |
|  |  Kaizen, Baseline Metric,   |      +-------------------------------------+     |
|  |  Remeasurement              |                                                  |
|  +--------------+--------------+                                                  |
|                 |                                                                 |
|                 v                                                                 |
|  +-----------------------------+      +-------------------------------------+     |
|  |   PERSISTENCE ADAPTER       |<---->|        MIGRATION ENGINE             |     |
|  |  LocalStorageRepository     |      |  version check on load; run any     |     |
|  |  (MVP)                      |      |  pending migration scripts in order |     |
|  |                             |      +-------------------------------------+     |
|  |  Interface: IRepository     |                                                  |
|  |  so future backends drop in |                                                  |
|  +--------------+--------------+                                                  |
|                 |                                                                 |
|                 v                                                                 |
|  +----------------------------------------------------------------+               |
|  |                         localStorage                           |               |
|  |   bamx:v1:catalog, bamx:v1:compositions, bamx:v1:activities,   |               |
|  |   bamx:v1:reflections, bamx:v1:variances, bamx:v1:frictions,   |               |
|  |   bamx:v1:kaizens, bamx:v1:metrics, bamx:v1:user, bamx:v1:meta |               |
|  +----------------------------------------------------------------+               |
+-----------------------------------------------------------------------------------+
```

### 1.2 Future-state layer (Next, not MVP)

```
+---------------------------+      +---------------------------+
|        Next.js Web        |      |     Mobile companion      |
|  (same domain model,      |      |  (start activity,         |
|   shared via /packages)   |      |   voice reflection)       |
+------------+--------------+      +-------------+-------------+
             |                                   |
             v                                   v
+---------------------------------------------------------------+
|                        API BOUNDARY (REST)                    |
|    /api/catalog  /api/compositions  /api/activities           |
|    /api/reflections  /api/variances  /api/frictions           |
|    /api/kaizens  /api/metrics                                 |
|  JSON contracts = domain model shapes (1-to-1)                |
+------------+--------------------------------------------------+
             |
             v
+---------------------------+      +---------------------------+
|     Application services  |      |   Background workers      |
|     (same modules, now    |      |  (composer pre-computes   |
|      server-side)         |      |   tomorrow's day overnight|
+------------+--------------+      +-------------+-------------+
             |                                   |
             v                                   v
+---------------------------------------------------------------+
|                          PostgreSQL                           |
|  catalog_entries, compositions, scheduled_activities,         |
|  reflections, variances, friction_signals, kaizens,           |
|  baseline_metrics, remeasurements, users, teams               |
+---------------------------------------------------------------+
             |
             v
+---------------------------------------------------------------+
|              External integrations (Next / Later)             |
|   Google / MS Calendar  |  Slack / Teams  |  Analytics store  |
+---------------------------------------------------------------+
```

### 1.3 MVP vs Future — layer-by-layer

| Layer | MVP | Next / Future |
|---|---|---|
| UI | Vanilla JS views, 1 HTML shell, no build step | Next.js + TS, same domain model |
| Event Bus | In-memory pub/sub | In-memory + server-side for worker jobs |
| Services | Single browser tab | Same code, server-side execution |
| Domain Model | Plain JS objects + JSDoc typedefs | TS types + Zod validators |
| Invariant Engine | Same module, unchanged | Same module, unchanged |
| Persistence | `localStorage` via `IRepository` | `pg` adapter implementing `IRepository` |
| Sync | None | Optimistic client → server, server is authority |
| AI agents | Not built | Owned by `06-ai-agent-optimization.md` |

**Key design principle:** services, domain, and invariants never reference `localStorage` or `fetch` directly. They talk to `IRepository`. Swapping MVP → Future changes only the adapter.

---

## 2. Data Model (full schema)

### 2.1 Entity overview

| # | Entity | Purpose | Key invariant |
|---|---|---|---|
| 1 | `CatalogEntry` | Vetted named standard-work activity (the primitive) | Non-optional set cannot be deleted |
| 2 | `User` | Single user in MVP; holds role(s), capacity defaults | Exactly one in MVP |
| 3 | `Composition` | Instance of a Cycle Type (Daily / Weekly / Sprint / Monthly) | Daily must satisfy 4-2-2 + non-optional set |
| 4 | `ScheduledActivity` | Instance of a `CatalogEntry` placed inside a `Composition` | Cannot close without required output artifact |
| 5 | `Intention` | A *field* on `ScheduledActivity` (declared outcome for the block) | — (not a standalone entity) |
| 6 | `Reflection` | Plan-vs-actual + optional friction signal captured at activity close | 1:1 with completed ScheduledActivity |
| 7 | `Variance` | A logged skip / override of a non-optional activity | Append-only |
| 8 | `FrictionSignal` | A tagged friction captured in a Reflection | Immutable once promoted |
| 9 | `Kaizen` | A validated improvement project (single active in MVP) | Cannot close without a `Remeasurement` beating baseline |
| 10 | `BaselineMetric` | Locked measurement at Kaizen start | Immutable once locked |
| 11 | `Remeasurement` | Post-improvement metric tied to a Kaizen | Must reference same metric definition as baseline |
| 12 | `MetricsSnapshot` | Rolled-up adherence / acceptance / Kaizen delta | Derived, recomputable |

### 2.2 CatalogEntry

Seeded from `PRODUCT_BLUEPRINT.md` §3.1 + `CATALOG_GAPS.md` defaults. Editable per user (enable/disable), but the non-optional set cannot be deleted.

| Field | Type | Notes |
|---|---|---|
| `id` | string (uuid) | PK |
| `activityNumber` | integer \| null | Source `.txt` activity # (1–50); null for ceremonies |
| `name` | string | e.g., "Daily Standup" |
| `focusArea` | enum | `DEEP_WORK` \| `COMMUNICATION` \| `CONTINUOUS_IMPROVEMENT` \| `CEREMONY` \| `DMAIC` \| `KAIZEN` \| `INNOVATION` \| `KAIZEN_ACCELERATOR_30D` \| `KAIZEN_EVENT_90D` |
| `defaultDurationMinutes` | integer | Catalog-defined duration |
| `cadence` | enum | `DAILY` \| `WEEKLY` \| `SPRINT` \| `MONTHLY` \| `QUARTERLY` \| `CONTINUOUS` \| `ON_SIGNAL` \| `EVENT_DRIVEN` \| `EVERY_48H` |
| `trigger` | string | Human-readable; rule in `CATALOG_GAPS.md` §E.5 |
| `inputs` | string[] | Named artifacts / data sources |
| `outputArtifact` | object | `{ name: string, schema: "TEXT"\|"TWO_LIST"\|"NUMERIC"\|"DOCUMENT"\|"CHART", required: true }` |
| `participants` | string[] | Role labels |
| `procedure` | string[] | Ordered steps (a, b, c…) |
| `bucket` | enum | `PROJECT` (Deep) \| `COMMUNICATION` \| `CI` — which 4-2-2 bucket this entry counts against on the Daily cycle |
| `isNonOptional` | boolean | Blueprint §3.4 set; UI cannot delete, cannot silently skip |
| `appliesToRoles` | string[] | BAM roles: `PRACTITIONER` \| `FACILITATOR` \| `LEADER` \| `CHAMPION` |
| `enabledByUser` | boolean | User preference; defaults true; non-optional entries cannot be disabled |
| `version` | integer | Bumped when procedure / output schema changes |
| `sourceRef` | string | e.g., "`Business Agility Standard Work.txt` row 12" |
| `dependsOn` | string[] | Catalog entry IDs whose `ScheduledActivity` must be `CLOSED` before this entry becomes eligible as payload. Used for DMAIC DAG (e.g., `DMAIC C&E Matrix #34` depends on `DMAIC SIPOC #21`). Empty array for entries without prerequisites. |
| `projectTypeBinding` | enum \| enum[] \| null | `DMAIC` \| `KAIZEN_EVENT` \| `KAIZEN_EVENT_90D` \| `KAIZEN_ACCELERATOR_30D` \| `AD_HOC` \| `null`. When non-null, this entry is eligible as Deep-block payload only for a Kaizen of the matching `projectType`. Null for cross-project entries (most of catalog #1–#19, plus all BAM ceremonies). Catalog `#42`–`#50` bind to both `KAIZEN_EVENT` (standalone 1–5 day burst) and `KAIZEN_EVENT_90D` (90-day phased) — stored as a string[] of two values per `KAIZEN_EVENT_STANDARD.md §11.1` recommendation (set-valued binding preferred over row duplication). See `PROJECT_TYPE_30D_KAIZEN.md §2.3` and `CATALOG_GAPS.md §K`. |
| `phaseBinding` | string \| null | For phased project types, the phase id this entry belongs to (e.g., `'PHASE_0' \| 'PHASE_1' \| 'PHASE_2' \| 'PHASE_3' \| 'PHASE_4'` for the 30-Day Accelerator; `'PRE_EVENT' \| 'EVENT' \| 'POST_EVENT' \| 'SUSTAIN'` for the 90-Day Kaizen Event). Null for non-phased entries and for entries whose binding is `KAIZEN_EVENT` only (standalone 1–5 day burst). Composer uses this to filter Deep-block payload to the active Kaizen's current phase. |

**Invariants:**
- `isNonOptional === true` → `enabledByUser` is ignored (always enabled), delete rejected.
- `outputArtifact.required === true` for every Catalog Entry (blueprint: every completion produces evidence).
- `bucket === 'PROJECT' | 'COMMUNICATION' | 'CI'` must be set for any entry the Daily composer may schedule.
- `dependsOn` is a DAG — no cycles. Validated at seed and at any catalog edit. A DMAIC step is eligible as payload iff every `dependsOn` entry has a `CLOSED` ScheduledActivity within the **same** `Kaizen.id` scope.
- An entry with `projectTypeBinding !== null` is eligible as Deep-block payload ONLY when the active `Kaizen.projectType` matches `entry.projectTypeBinding` (either equals the string, or is included in the binding array) AND (if `phaseBinding !== null`) `Kaizen.phase === entry.phaseBinding`. Enforced in `ComposerService.eligibleDmaicPayloadSteps()` — see `ENGINE_DESIGN.md §4.2`.

**Example JSON:**

```json
{
  "id": "ce_daily_standup",
  "activityNumber": null,
  "name": "Daily Standup",
  "focusArea": "CEREMONY",
  "defaultDurationMinutes": 15,
  "cadence": "DAILY",
  "trigger": "Same time each work day",
  "inputs": ["Sprint Backlog", "Yesterday's reflections"],
  "outputArtifact": { "name": "Standup notes", "schema": "TEXT", "required": true },
  "participants": ["Team", "Agile Facilitator"],
  "procedure": ["a. Each member: done / doing / blockers.", "b. Capture blockers in backlog.", "c. Close in 15 min."],
  "bucket": "COMMUNICATION",
  "isNonOptional": true,
  "appliesToRoles": ["PRACTITIONER", "FACILITATOR", "LEADER", "CHAMPION"],
  "enabledByUser": true,
  "version": 1,
  "sourceRef": "BAM Way Ch.6 + Business Agility Standard Work.txt"
}
```

### 2.3 User

| Field | Type | Notes |
|---|---|---|
| `id` | string (uuid) | PK |
| `name` | string | |
| `email` | string | |
| `roles` | string[] | Current active BAM + project-partner roles. Canonical role set: `PRACTITIONER` \| `FACILITATOR` \| `LEADER` \| `CHAMPION` \| `FINANCE_PARTNER` \| `MASTER_BLACK_BELT` \| `IMPLEMENTATION_LEAD` \| `PROCESS_OWNER` \| `ANALYST` \| `SME` \| `EXECUTIVE_SPONSOR`. `FINANCE_PARTNER` is required for ROI co-sign on any Kaizen with non-null `implementationCostDollars` or `annualBenefitsDollars` (per `ACCELERATOR_STANDARD §1.6` refinement #1 + `DMAIC_STANDARD §1.6` CSF #5). `IMPLEMENTATION_LEAD` is the named dedicated role for `KAIZEN_EVENT_90D` projects' Post-Event Implementation window, distinct from `FACILITATOR` and `PROCESS_OWNER` (per `KAIZEN_EVENT_STANDARD §1`). MVP single-user field retained as `role` string[] for backward compatibility; both names read identically. |
| `dailyCapacityMinutes` | integer | Default 480 (8h). Composer accepts a per-day override without mutating this field (override lives on `Composition.externalMinutesToday` or a one-day capacity input). |
| `workDays` | integer[] | ISO day numbers, default `[1,2,3,4,5]` |
| `sprintAnchorDate` | date (ISO) | First Monday of current sprint; drives sprint-phase computation |
| `timezone` | string | IANA TZ string |
| `deepSlicePreference` | enum | `'2x2h'` \| `'4x1h'` — how the composer slices the Deep (PROJECT) bucket on the Daily cycle. Default `'2x2h'`. See §9 item 14. |
| `createdAt` | timestamp | |

### 2.4 Composition

| Field | Type | Notes |
|---|---|---|
| `id` | string (uuid) | PK |
| `userId` | string | FK User |
| `cycleType` | enum | `DAILY` \| `WEEKLY` \| `SPRINT` \| `MONTHLY` |
| `startAt` | timestamp | Inclusive |
| `endAt` | timestamp | Exclusive |
| `parentCompositionId` | string \| null | FK — Daily → Weekly → Sprint → Monthly chain |
| `state` | enum | `PROPOSED` \| `ACCEPTED` \| `EDITED` \| `REJECTED` \| `ACTIVE` \| `CLOSED` |
| `proposedAt` | timestamp | When composer produced it |
| `decidedAt` | timestamp \| null | When user accepted / edited / rejected |
| `closedAt` | timestamp \| null | |
| `composerInputsSnapshot` | object | `{ role, capacityMinutes, sprintPhase, activeKaizenId, varianceCount }` frozen at proposal time |
| `invariantChecks` | object | Last validation result (see §2.4.1) |

**2.4.1 `invariantChecks` shape (Daily cycle):**

```json
{
  "shape_4_2_2": { "ok": true, "projectMin": 240, "commMin": 120, "ciMin": 120 },
  "nonOptionalPresent": { "ok": true, "missing": [] },
  "overAllocated": { "ok": true, "totalMin": 480, "capacityMin": 480 }
}
```

**Invariants (enforced in `InvariantEngine`, not UI):**
- `cycleType === 'DAILY'` and `state IN ('ACCEPTED','EDITED','ACTIVE','CLOSED')` → 4-2-2 shape holds AND non-optional set present (Daily Standup, AM Comm block, post-lunch Comm block, Deep ≥ 4h, CI ≥ 30 min).
- `cycleType === 'WEEKLY'` and accepted → contains exactly 5 Daily compositions + weekly non-optionals.
- State transitions follow the FSM in §3.1.

### 2.5 ScheduledActivity

| Field | Type | Notes |
|---|---|---|
| `id` | string (uuid) | PK |
| `compositionId` | string | FK Composition (the Daily one it lives in) |
| `catalogEntryId` | string | FK CatalogEntry |
| `bucket` | enum | Copied from `CatalogEntry.bucket` at schedule time; frozen |
| `plannedStartAt` | timestamp | |
| `plannedDurationMinutes` | integer | |
| `actualStartAt` | timestamp \| null | |
| `actualEndAt` | timestamp \| null | |
| `intention` | string | The user's declared outcome for this block (**this is what the old prompt called "Intentions"**) |
| `state` | enum | See FSM in §3.2 |
| `outputArtifactRef` | object \| null | `{ schema, value }` matching `CatalogEntry.outputArtifact.schema` |
| `reflectionId` | string \| null | FK Reflection |
| `linkedKaizenId` | string \| null | If this block is Kaizen work, the Kaizen it advances |
| `linkedDmaicStepRef` | object \| null | `{ kaizenId, catalogEntryId }` — ties Deep-block payload to DMAIC step |
| `linkedPdcaExperimentId` | string \| null | For catalog #12 PDCA Cycle ticks; binds the tick to its parent experiment |
| `reasonCodeIfSkipped` | enum \| null | `ESCALATION` \| `MEETING_CONFLICT` \| `SICK` \| `BLOCKED` \| `DEPRIORITIZED` \| `OTHER` |
| `sourceOfSchedule` | enum | `COMPOSER_AUTO` \| `USER_EDIT` \| `USER_ADD` — for composition-acceptance metric |
| `createdAt` | timestamp | |
| `updatedAt` | timestamp | |

**Invariants:**
- `state === 'CLOSED'` → `outputArtifactRef !== null` AND matches schema on CatalogEntry (blueprint: every completion is a measurement).
- `state === 'CLOSED'` AND `catalogEntry.isNonOptional === true` → a `Reflection` row must exist (blueprint §4.1 item 4). The Reflection MAY be `pending=true` if the user dismissed the reflection sheet without completing it; see §2.6.
- `state === 'SKIPPED'` AND `catalogEntry.isNonOptional === true` → `reasonCodeIfSkipped !== null` AND a `Variance` row is emitted (blueprint §3.4).
- `reasonCodeIfSkipped === 'OTHER'` → `note !== null AND note.length > 0` on the emitted `Variance` row. Enforced in `ActivityService.skip()`.
- `bucket` is frozen at schedule time, even if CatalogEntry.bucket is later edited.

### 2.6 Reflection

| Field | Type | Notes |
|---|---|---|
| `id` | string (uuid) | PK |
| `scheduledActivityId` | string | FK ScheduledActivity (required) |
| `userId` | string | FK User |
| `pending` | boolean | `true` when row is auto-stubbed at activity close but user has not captured text yet. Flips to `false` on capture. |
| `capturedAt` | timestamp \| null | Timestamp when user actually captured the reflection. `null` while `pending=true`. On-time if `capturedAt - scheduledActivity.actualEndAt <= 15 min`. |
| `planVsActualMinutes` | integer | `actualEndAt − actualStartAt − plannedDurationMinutes`. Computed at activity close; stable. |
| `whatWentWell` | string \| null | Optional free text. Null while pending. |
| `whatToImprove` | string \| null | Optional free text. Null while pending. |
| `frictionFlag` | boolean | If true on capture → creates a `FrictionSignal` |
| `frictionSignalId` | string \| null | FK FrictionSignal |
| `kind` | enum | `END_OF_ACTIVITY` (60-sec) \| `WEEKLY` (20-min DMAIC) |
| `dmaicDraft` | object \| null | Only for `kind === 'WEEKLY'`: `{ define, measure, analyze, improveSuggested }` |

**Invariants:**
- Exactly one `Reflection` row per closed non-optional `ScheduledActivity`. The row is auto-stubbed at close with `pending=true`; the reflection-rate KPI counts only `pending=false AND capturedAt - actualEndAt <= 15 min`.
- `pending === false` → `capturedAt !== null` AND (`whatWentWell !== null` OR `whatToImprove !== null`) — at least one text field populated.
- `kind === 'WEEKLY'` must be attached to a Weekly `Composition` (via `scheduledActivityId` pointing to the Weekly Reflection activity). Cannot be `pending=true` — the wizard cannot save until all four DMAIC fields are non-empty.
- `frictionSignalId` can only be set when `pending=false` (no friction signal created from an empty reflection).

### 2.7 Variance (append-only)

| Field | Type | Notes |
|---|---|---|
| `id` | string (uuid) | PK |
| `scheduledActivityId` | string | FK |
| `compositionId` | string | FK |
| `catalogEntryId` | string | FK |
| `userId` | string | FK |
| `kind` | enum | `SKIPPED_NON_OPTIONAL` \| `OVERRAN` \| `UNDERRAN` \| `RESCHEDULED` \| `EDITED_FROM_PROPOSAL` |
| `reasonCode` | enum | See §2.5 |
| `note` | string \| null | |
| `loggedAt` | timestamp | |

**Invariants:**
- **Append-only.** No update, no delete. Corrections are new rows with `kind = OTHER` and a reference to the erroneous row in `note` (`"supersedes variance_id=…"`).
- `reasonCode === 'OTHER'` → `note !== null AND note.length > 0`. Enforced at insert (MVP: `VarianceService.log()`; future: Postgres `CHECK` constraint).
- Emitted automatically by `ActivityService` and `ComposerService`; never written by UI directly.

### 2.8 FrictionSignal

| Field | Type | Notes |
|---|---|---|
| `id` | string (uuid) | PK |
| `reflectionId` | string | FK Reflection |
| `scheduledActivityId` | string | FK |
| `userId` | string | FK |
| `summary` | string | ≤ 140 chars |
| `tag` | enum \| null | `MEETING_LOAD` \| `CONTEXT_SWITCH` \| `BLOCKED_DEP` \| `TOOL_FRICTION` \| `PRIORITY_INVERSION` \| `OTHER` |
| `status` | enum | `OPEN` \| `CLUSTERED` \| `PROMOTED_TO_KAIZEN` \| `DISMISSED` |
| `kaizenId` | string \| null | FK when promoted |
| `capturedAt` | timestamp | |

**Invariants:**
- Becomes immutable once `status === 'PROMOTED_TO_KAIZEN'` (cluster reference preserved for traceability).

### 2.9 Kaizen

| Field | Type | Notes |
|---|---|---|
| `id` | string (uuid) | PK |
| `userId` | string | FK; MVP = exactly one `ACTIVE` per user (blueprint §4.1 item 4) |
| `title` | string | |
| `problemStatement` | string | |
| `goalStatement` | string | Baseline X → target Y by date Z |
| `sourceFrictionSignalIds` | string[] | Traceability to evidence |
| `baselineMetricId` | string | FK BaselineMetric; required to leave `DRAFT` |
| `remeasurementId` | string \| null | FK Remeasurement; required to `CLOSE` |
| `actions` | object[] | `[{ name, ownerRef, dueDate, doneAt\|null, strategic: boolean (optional, default false) }]`. The `strategic: true` flag marks multi-week high-impact items that veto phase advance per `ACCELERATOR_STANDARD §1.6` refinement #5 — any strategic action with `doneAt === null` blocks PHASE_3 → PHASE_4 advance regardless of overall completion ratio. For `KAIZEN_EVENT_90D` a richer backlog schema (acceptance criterion, size, sprint, priority score, before/after link) lands in the separate `ImplementationBacklog` entity in the E18 epic — see `KAIZEN_EVENT_STANDARD §11.5` item 5; until that ships, the Kaizen 90 adoption layer reads `actions[]` with `strategic` + optional `sprint` + `acceptanceCriterion` extension fields. |
| `state` | enum | See FSM in §3.3 |
| `openedAt` | timestamp | |
| `closedAt` | timestamp \| null | |
| `closeKind` | enum \| null | `SUCCESS` (hit goal) \| `PARTIAL` (improved < goal) \| `FAILED_HONEST` (no improvement — blueprint §7.2) |
| `resultsNarrativeRef` | object \| null | For catalog #49 — 3-pager narrative artifact |
| `projectType` | enum | `DMAIC` \| `KAIZEN_EVENT` \| `KAIZEN_EVENT_90D` \| `KAIZEN_ACCELERATOR_30D` \| `AD_HOC`. Formalizes the previously-implicit "mode" on Kaizen. Default `AD_HOC` for legacy / backward-compatible promotion from a friction cluster with no fixed timeline. Required on create; immutable once set. `KAIZEN_EVENT_90D` added per `KAIZEN_EVENT_STANDARD.md §11.1` Option B. See `PROJECT_TYPE_30D_KAIZEN.md §2.1` and `KAIZEN_EVENT_STANDARD.md §2`. |
| `phase` | string \| null | Current phase discriminator for phased project types. For `KAIZEN_ACCELERATOR_30D`: `'PHASE_0' \| 'PHASE_1' \| 'PHASE_2' \| 'PHASE_3' \| 'PHASE_4'`. For `KAIZEN_EVENT_90D`: `'PRE_EVENT' \| 'EVENT' \| 'POST_EVENT' \| 'SUSTAIN'` (per `KAIZEN_EVENT_STANDARD §2`). Non-null for BOTH phased project types; null for `DMAIC` (derives phase from DAG via `phaseFor()`), `AD_HOC`, and `KAIZEN_EVENT` (standalone 1–5 day burst has no phase). Advanced via `KaizenService.advancePhase()`. |
| `phaseDefinitions` | object[] \| null | Frozen-at-start snapshot of phase structure: `[{ id, name, days, nonOptionalCatalogEntryIds[] }]`. For `KAIZEN_ACCELERATOR_30D`, seeded with the 5 phases from `PROJECT_TYPE_30D_KAIZEN.md §3`. For `KAIZEN_EVENT_90D`, seeded with the 4 macro-phases from `KAIZEN_EVENT_STANDARD §2` (PRE_EVENT Days 1–14, EVENT Days 15–19, POST_EVENT Days 20–70, SUSTAIN Days 71–90). Immutable once written. Null for non-phased project types. Phase names shown in UI come from this snapshot, not hard-coded constants. |
| `implementationCostDollars` | number \| null | Captured during Phase 4.3 of a 30-Day Accelerator (catalog entry `30d_4_3_calculate_roi`), during SUSTAIN phase of a Kaizen 90, or at Improve-close (pass 1) and Control-close (pass 2) for DMAIC. Null until captured. Drives the computed `roi` getter. |
| `annualBenefitsDollars` | number \| null | Captured alongside `implementationCostDollars`. Null until captured. |
| `roiPassNumber` | integer \| null | DMAIC two-pass Financial Benefit Translator counter: `1` at Improve-close (projected ROI), `2` at Control-close (actual ROI with reconciliation delta). Null for single-pass project types (`KAIZEN_ACCELERATOR_30D`, `KAIZEN_EVENT_90D`, `KAIZEN_EVENT`, `AD_HOC`). Per `DMAIC_STANDARD §1.5` refinement #4. |
| `roiProjections` | object[] \| null | DMAIC audit trail: `[{ passNumber, implementationCostDollars, annualBenefitsDollars, computedRoi, financePartnerUserId, capturedAt, reconciliationDeltaPercent (pass 2 only) }]`. Append-only. Both pass-1 and pass-2 rows retained; on pass 2, `reconciliationDeltaPercent = (pass2.roi - pass1.roi) / pass1.roi`. Null for non-DMAIC projects. |
| `validatedRootCauseArtifactRef` | object \| null | For DMAIC: `{ schema, value, confoundCheckPassed: boolean, validatedBy, validatedAt }`. Required non-null with `confoundCheckPassed === true` before DMAIC Analyze → Improve transition. Captured as the output artifact of `#36 Correlation & Regression` plus the confound-check table per `DMAIC_STANDARD §1.5` refinement #2 + §11.5 item 4. Null for non-DMAIC projects. |
| `sustainmentCheckIns` | object[] \| null | `[{ dueDate, kind: '30_DAY' \| '60_DAY' \| '90_DAY', completedAt, observedMetricValue, adherenceOk: boolean, notes }]`. Auto-seeded by `KaizenService.close()` when `state` transitions to `CLOSED` with `closeKind ∈ {SUCCESS, PARTIAL}`. Null for `FAILED_HONEST`-closed or abandoned Kaizens. Append-only once a due date passes; a missed check-in stays on the record. Per `DMAIC_STANDARD §11.2` item 3 and `ACCELERATOR_STANDARD §10.2` item 8. |
| `sustainmentGatePassed` | boolean \| null | For `KAIZEN_EVENT_90D`: set `true` by Facilitator attestation at Day 70 when adoption ≥80% held for 2 consecutive working weeks AND no rollback events. Required `true` before Kaizen 90 may transition `ACTIVE → IN_REMEASUREMENT`. Null for other project types. Per `KAIZEN_EVENT_STANDARD §2.17` + §11.5 item 8. |
| `scopeChanges` | object[] \| null | Append-only log: `[{ changeRequestedAt, requestedBy, reason, impactAssessment, approved: boolean, approvedBy, approvedAt }]`. Populated from `ScopeChangeRequested` events (§6.1). Informational/audit — does NOT auto-pause the project. Per `ACCELERATOR_STANDARD §1.6` refinement #4. Null until first scope change. |
| `startDate` | date (ISO) | When the project started (Day 0 for `KAIZEN_ACCELERATOR_30D`; Day 1 for `KAIZEN_EVENT_90D`). Drives pace-warning calculations and the "30 days to ROI" / "90 days to rebaseline" banners. Required on create. |
| `controlPlanArtifactRef` | object \| null | For `KAIZEN_ACCELERATOR_30D`: the `30d_4_5_control_plan` scheduled activity's `outputArtifactRef` (signed at Phase 4.5; **authored at Phase 2** per `ACCELERATOR_STANDARD §1.6` refinement #2 — see A8 invariants below). For `KAIZEN_EVENT_90D`: the SUSTAIN-phase Control Plan. For `DMAIC`: the `#41` Control Plan finalized-and-signed version. Null until the appropriate signing step closes. |
| `controlPlanDraftArtifactRef` | object \| null | For `KAIZEN_ACCELERATOR_30D`: the Phase 2 draft captured as an output of `30d_2_5_define_improvements` (monitoring metric, frequency, threshold, response per strategic item). Enables Process Owner to challenge sustainment design before it is signed in Phase 4. Per `ACCELERATOR_STANDARD §1.6` refinement #2. For DMAIC: the Improve-phase draft per `DMAIC_STANDARD §1.5` refinement #3. Null for other project types and until the authoring step closes. |
| `implementationLeadUserId` | string \| null | FK User. Required non-null at create for `projectType='KAIZEN_EVENT_90D'` (per `KAIZEN_EVENT_STANDARD §1`). Must be a user with `IMPLEMENTATION_LEAD` in their roles. Distinct from `FACILITATOR` and `PROCESS_OWNER` — cannot be the same user. Null for other project types. |
| `targetCloseDate` | date (ISO) \| null | Declared close-by date. Required at create for `projectType='AD_HOC'` (AD_HOC has no phase structure, so pace warnings need an explicit anchor). Optional for other project types (they use phase duration instead). Drives `ProjectPaceWarning` emission for AD_HOC. Per `ADHOC_PDCA_STANDARD §1.A.7` refinement #1. |
| `sourcePdcaExperimentId` | string \| null | FK `PdcaExperiment`. Set when this Kaizen was promoted from a PDCA experiment (via `PdcaExperiment.closedReason='SUPERSEDED_BY_KAIZEN'`). Distinct from `sourceFrictionSignalIds` (which is friction-signal lineage); a promoted Kaizen may have one, the other, or both. Null for Kaizens that didn't originate from a PDCA experiment. Per `ADHOC_PDCA_STANDARD §10` refinement #3. |

**Computed properties (derived, not stored):**
- `readyToRemeasure: boolean` = `state === 'ACTIVE' AND actions.length > 0 AND actions.every(a => a.doneAt !== null)`. Surfaced on `KaizenCard` as "Ready to remeasure." Not a state — the user can start remeasurement at any time during `ACTIVE`; this is just a visibility hint.
- `roi: number | null` = `annualBenefitsDollars !== null AND implementationCostDollars !== null AND implementationCostDollars > 0 ? (annualBenefitsDollars - implementationCostDollars) / implementationCostDollars : null`. **Not stored. Computed** (pure function in `RoiEngine.computeRoi`, see `PROJECT_TYPE_30D_KAIZEN.md §6.1`). When `implementationCostDollars === 0`, `roi` is `null` and the engine surfaces "Finance review required" on `KaizenCard`.

**Invariants:**
- `state === 'CLOSED'` → `remeasurementId !== null` AND `remeasurement.metricDefinitionId === baseline.metricDefinitionId` (blueprint HARD RULE).
- MVP: at most one Kaizen with `state IN ('ACTIVE','IN_REMEASUREMENT')` per user. A `KAIZEN_ACCELERATOR_30D` or `KAIZEN_EVENT_90D` Kaizen counts against this cap like any other — users may run one active phased project at a time.
- `actions[].doneAt === null` does **not** block close; **only** the remeasurement does (so honest-failure close is possible). **Exception for strategic items on Accelerator Phase 3→4 advance:** see below.
- `projectType === 'KAIZEN_ACCELERATOR_30D'` AND `state === 'CLOSED'` → `roi !== null` AND `controlPlanArtifactRef !== null` (stored on a Phase 4.5 ScheduledActivity's `outputArtifactRef`). Enforced in `KaizenService.close()`.
- `projectType === 'KAIZEN_EVENT_90D'` AND `state === 'CLOSED'` → `roi !== null` AND `controlPlanArtifactRef !== null` AND `remeasurementId !== null` AND `sustainmentGatePassed === true`. Enforced in `KaizenService.close()`. Per `KAIZEN_EVENT_STANDARD §11.2` items 5 + 8.
- `projectType === 'KAIZEN_EVENT_90D'` AND `phase === null` is illegal once the record is activated; `KaizenService.promote()` seeds `phase='PRE_EVENT'` and `phaseDefinitions` atomically at create.
- `projectType === 'KAIZEN_EVENT_90D'` at create → `implementationLeadUserId !== null` AND the referenced user has `IMPLEMENTATION_LEAD` in their roles AND is not the same user as Facilitator / Process Owner. Enforced in `KaizenService.promote()`.
- "No ROI without validated remeasurement" — closing a `KAIZEN_ACCELERATOR_30D` or `KAIZEN_EVENT_90D` requires BOTH the existing `Kaizen.close` remeasurement guard AND `implementationCostDollars !== null` AND `annualBenefitsDollars !== null`. Throws `ROI_NOT_VALIDATED` if either ROI input is missing at close.
- `projectType === 'KAIZEN_ACCELERATOR_30D'` AND `phase === null` is illegal once the record is activated; `KaizenService.promote()` seeds `phase='PHASE_0'` and `phaseDefinitions` atomically at create.
- **Finance partner co-sign on ROI.** Any Kaizen with non-null `implementationCostDollars` OR `annualBenefitsDollars` requires at least one ROI co-sign by a user with `FINANCE_PARTNER` in their roles; the co-signer's `userId` is recorded in `roiProjections[].financePartnerUserId` for DMAIC, or on the `30d_4_3_calculate_roi` / Kaizen 90 ROI ScheduledActivity's `outputArtifactRef` for Accelerator / Kaizen 90. Enforced in `KaizenService.applyRoiArtifact()`. Per `ACCELERATOR_STANDARD §1.6` refinement #1 + `DMAIC_STANDARD §1.6` CSF #5.
- **MSA before Baseline (DMAIC).** For `projectType='DMAIC'`: the Baseline ScheduledActivity (`#28`) cannot transition to `CLOSED` until an MSA ScheduledActivity (`#31`) in the same Kaizen is `CLOSED` with an acceptable Gage R&R rating (%R&R < 30% OR Kappa ≥ 0.7). Enforced via `CatalogEntry.dependsOn` DAG edge `#28 → [#31]` (see `CATALOG_GAPS §J`) and the close-guard in `ActivityService.close()` checking the MSA artifact's acceptance field. Per `DMAIC_STANDARD §1.5` refinement #1.
- **Validated root cause before DMAIC Analyze → Improve.** For `projectType='DMAIC'`: advancing out of Analyze (making Improve-phase entries eligible as payload) requires `validatedRootCauseArtifactRef !== null` AND `validatedRootCauseArtifactRef.confoundCheckPassed === true`. Enforced in `KaizenService.canAdvanceDmaicPhase()` / `ComposerService.eligibleDmaicPayloadSteps()` for Improve-phase entries. Per `DMAIC_STANDARD §1.5` refinement #2.
- **Two-pass Financial Benefit Translator (DMAIC).** `state === 'CLOSED'` AND `projectType === 'DMAIC'` → `roiPassNumber === 2` AND `roiProjections.length === 2` (both pass-1 projected and pass-2 actual rows retained). Enforced in `KaizenService.close()`. Per `DMAIC_STANDARD §1.5` refinement #4.
- **Control Plan draft by Phase 2 exit (Accelerator).** `projectType === 'KAIZEN_ACCELERATOR_30D'` AND phase-advance from `PHASE_2` → `PHASE_3` requires `controlPlanDraftArtifactRef !== null` (captured as the draft output of `30d_2_5_define_improvements`). The signed `controlPlanArtifactRef` is still required at CLOSED but is authored in Phase 2, not Phase 4. Enforced in `KaizenService.canAdvancePhase()`. Per `ACCELERATOR_STANDARD §1.6` refinement #2.
- **Weighted Phase 3→4 advance (Accelerator).** `projectType === 'KAIZEN_ACCELERATOR_30D'` AND phase-advance from `PHASE_3` → `PHASE_4` requires (`closedActionCount / totalActionCount >= 0.80`) AND `!actions.some(a => a.strategic === true && a.doneAt === null)` — i.e., every strategic action is closed. Strategic items veto phase advance regardless of overall completion count. Enforced in `KaizenService.canAdvancePhase()`. Per `ACCELERATOR_STANDARD §1.6` refinement #5.
- **Sustainment Gate (Kaizen 90).** `projectType === 'KAIZEN_EVENT_90D'` AND transition `ACTIVE → IN_REMEASUREMENT` requires `sustainmentGatePassed === true`. Pass is attested by the Facilitator after verifying adoption ≥80% for 2 consecutive working weeks AND no rollback events logged in `scopeChanges[]` or adoption log. Enforced in `KaizenService.startRemeasurement()`. Per `KAIZEN_EVENT_STANDARD §2.17` + §11.5 item 8.
- **Sustainment check-ins append-only.** `sustainmentCheckIns[]` entries are append-only once their `dueDate` passes: a missed check-in stays on the record with `completedAt === null` and `adherenceOk === false`. Facilitator may later add a retrospective entry (new row) but not overwrite. Per `DMAIC_STANDARD §11.2` item 3.
- **Scope changes are informational, not blocking.** `scopeChanges[]` entries are append-only. A `ScopeChangeRequested` event (§6.1) is logged for audit; the Kaizen state is not auto-paused. Abandonment path remains the only way to halt a project. Per `ACCELERATOR_STANDARD §1.6` refinement #4.
- **Lessons Learned required at close (all project types).** `state === 'CLOSED'` → a `ScheduledActivity` of `CatalogEntry.name='Lessons Learned'` with `linkedKaizenId === this.id` AND `state === 'CLOSED'` AND non-null `outputArtifactRef` must exist. Applies to every `projectType` and every `closeKind` (SUCCESS / PARTIAL / FAILED_HONEST). Enforced in `KaizenService.close()`. The Lessons Learned generic catalog entry is seeded per `CATALOG_GAPS §H.2`. Per `ADHOC_PDCA_STANDARD §10` refinement #2 (applied broadly because learning capture is load-bearing across all types, not just lightweight ones).
- **AD_HOC requires `targetCloseDate`.** `projectType === 'AD_HOC'` at create → `targetCloseDate !== null` AND `targetCloseDate > createdAt`. Enforced in `KaizenService.promote()`. Drives `ProjectPaceWarning` emission when `now > targetCloseDate` and state ∈ {DRAFT, ACTIVE, IN_REMEASUREMENT}. Per `ADHOC_PDCA_STANDARD §1.A.7` refinement #1.

### 2.10 BaselineMetric

| Field | Type | Notes |
|---|---|---|
| `id` | string (uuid) | PK |
| `kaizenId` | string | FK |
| `metricDefinition` | object | `{ name, unit, operationalDefinition, sampleSize, method }` |
| `value` | number | |
| `capturedAt` | timestamp | |
| `capturedSampleRef` | object \| null | Link to raw samples or DCP (DMAIC #22) |
| `locked` | boolean | Once true, immutable |

**Invariants:** `locked === true` → row is immutable.

### 2.11 Remeasurement

| Field | Type | Notes |
|---|---|---|
| `id` | string (uuid) | PK |
| `kaizenId` | string | FK |
| `metricDefinitionId` | string | Must equal the Kaizen's baseline `metricDefinition` identity |
| `value` | number | |
| `deltaAbsolute` | number | Computed: `value − baseline.value` |
| `deltaPercent` | number | Computed |
| `beatsBaseline` | boolean | Computed against goal direction |
| `capturedAt` | timestamp | |
| `evidenceRef` | object \| null | Link to Control Chart (#29), Capability Report (#30), or Kaizen Narrative (#49) |

### 2.12 MetricsSnapshot (derived, regenerable)

| Field | Type | Notes |
|---|---|---|
| `id` | string (uuid) | PK |
| `userId` | string | FK |
| `windowStart` / `windowEnd` | timestamp | Rolling 14-day window for MVP |
| `adherencePercent` | number | Non-optional activities completed with artifact / scheduled |
| `compositionAcceptanceDaily` | number | Daily cycles accepted w/o edit / proposed |
| `compositionAcceptanceWeekly` | number | |
| `reflectionRatePercent` | number | Reflections captured within 15 min of close |
| `activeKaizenDeltaPercent` | number \| null | |
| `computedAt` | timestamp | |

### 2.13 PdcaExperiment

A PDCA experiment is the parent hypothesis entity that binds a series of 48-hour PDCA ticks (catalog #12) together so the Plan / Do / Check / Act state persists across ticks. Without this, each tick would be a disconnected reflection and the blueprint §3.1 commitment that "PDCA Cycle fires every 48 hours while an experiment is active" has no anchor.

| Field | Type | Notes |
|---|---|---|
| `id` | string (uuid) | PK |
| `userId` | string | FK |
| `hypothesis` | string | One-sentence "if we change X, Y should improve." |
| `targetMetricName` | string | What the user is measuring (e.g., "daily Slack context-switch count") |
| `targetMetricUnit` | string | e.g., "count/day", "minutes" |
| `currentConditionBaseline` | number | Captured at open |
| `targetCondition` | number | What the user is aiming for |
| `state` | enum | `PLAN` \| `DO` \| `CHECK` \| `ACT` \| `CLOSED` — advances per tick |
| `tickActivityIds` | string[] | FKs to `ScheduledActivity` rows of catalog #12 that ticked this experiment. Append-only; each new tick adds one. |
| `consecutiveTargetHits` | integer | Count of consecutive ticks where measurement met `targetCondition`. Blueprint: 3 consecutive hits = graduate. |
| `openedAt` / `closedAt` | timestamp | |
| `closedReason` | enum \| null | `GRADUATED` (3 consecutive hits) \| `ABANDONED` (user gave up) \| `SUPERSEDED_BY_KAIZEN` (promoted to Kaizen) |

**Invariants:**
- At most one `PdcaExperiment` per user with `state !== 'CLOSED'`. (MVP; parallel experiments land in Next.)
- A PDCA tick `ScheduledActivity` (catalog #12) must carry `linkedPdcaExperimentId`; orphan ticks are blocked by `ActivityService.start()` when a user has an open experiment.
- `state === 'CLOSED'` AND `closedReason === 'GRADUATED'` → `consecutiveTargetHits >= 3` at close.
- Transitions: `PLAN → DO` on first tick committed; `DO → CHECK` when a tick measurement is captured; `CHECK → ACT` when user commits an adjustment in the tick reflection; `ACT → DO` on next tick; terminal transition to `CLOSED` on graduation / abandonment / promotion.
- **Mandatory review at tick 10.** When `tickActivityIds.length >= 10` AND `state !== 'CLOSED'`, the Reflection agent (per `AI_AGENTS.md` §2 Agent 4) surfaces a mandatory review prompt on the user's next Cadence Day: graduate (if applicable), abandon, promote-to-Kaizen, or explicitly continue with a revised hypothesis. Not a hard block — the user may continue to tick 11+ after explicitly acknowledging the prompt. Telemetry logs the acknowledgment with `reviewDecision` (`CONTINUE | GRADUATE | ABANDON | PROMOTE`). Per `ADHOC_PDCA_STANDARD §2.B` + §10 refinement.

**Events:** `PdcaExperimentOpened`, `PdcaTickCommitted`, `PdcaExperimentClosed` (see §6.1).

### 2.14 Relationship diagram (textual)

```
User 1—* Composition 1—* ScheduledActivity *—1 CatalogEntry
                                |
                                +—0..1 Reflection 0..1—0..1 FrictionSignal
                                |
                                +—0..* Variance  (append-only)
                                |
                                +—0..1 (linkedKaizenId) Kaizen
                                |
                                +—0..1 (linkedPdcaExperimentId) PdcaExperiment

Kaizen 1—1 BaselineMetric
Kaizen 1—0..1 Remeasurement
Kaizen 1—* FrictionSignal (sourceFrictionSignalIds)
```

---

## 3. State Management Design

All entities with non-trivial lifecycles are modeled as finite state machines. Transitions are the only way state changes; guards are enforced by the `InvariantEngine`.

### 3.1 Composition FSM

```
          +------------+
          |  PROPOSED  |   <-- composer emits; not yet seen by user
          +-----+------+
                |
   user accepts | user edits     user rejects
                v                v
          +-----+------+   +-----+-------+
          |  ACCEPTED  |   |  REJECTED   |   (terminal — rare)
          +-----+------+   +-------------+
                |
                | clock reaches startAt
                v
          +-----+------+
          |   ACTIVE   |
          +-----+------+
                |
                | clock reaches endAt AND all non-optional activities
                | terminal (CLOSED or SKIPPED-with-variance)
                v
          +-----+------+
          |   CLOSED   |
          +------------+

         (EDITED is ACCEPTED with sourceOfSchedule != COMPOSER_AUTO
          on ≥ 1 child ScheduledActivity; tracked as a flag, not a state,
          so the composer-acceptance metric is computable.)
```

**Guards:**
- `PROPOSED → ACCEPTED` requires invariant checks to pass (4-2-2, non-optional set, capacity).
- `ACTIVE → CLOSED` requires every child `ScheduledActivity` to be in a terminal state (`CLOSED` or `SKIPPED`).

### 3.2 ScheduledActivity FSM

```
   +-----------+    composition accepted    +-----------+
   |  PROPOSED +--------------------------->| SCHEDULED |
   +-----+-----+                            +-----+-----+
         | rejected in composer                   |
         v                                        | user starts
   +-----+-----+                                  v
   |  DROPPED  |                            +-----+-----+
   +-----------+                            |IN_PROGRESS|
                                            +--+---+----+
                         user closes + output|   | user skips
                           + reflection      |   | (non-optional → Variance)
                                             v   v
                                      +------+---+------+
                                      | CLOSED | SKIPPED|
                                      +--------+--------+
                                        ^ (terminal)
                                        |
                   (late-reflection still allowed; reflection row
                    just misses the 15-min "on-time" window)
```

**Guards on `IN_PROGRESS → CLOSED`:**
1. `outputArtifactRef !== null` AND matches `CatalogEntry.outputArtifact.schema`.
2. If `CatalogEntry.isNonOptional === true`, a `Reflection` row is supplied in the same transaction.
3. `actualEndAt !== null`.

**Guards on `SCHEDULED → SKIPPED` (non-optional only):**
1. `reasonCodeIfSkipped !== null`.
2. A `Variance` row is emitted in the same transaction (atomic).

**Guard on `IN_PROGRESS → SKIPPED`:** disallowed. Once started, close with partial output or emit an `OVERRAN` variance.

### 3.3 Kaizen FSM

```
                +--------+
                | DRAFT  |  <-- promoted from FrictionSignal cluster
                +---+----+
                    |
    baseline locked + goal set + actions declared
                    v
                +---+-----+
                | ACTIVE  |
                +---+-----+
                    |
      actions declared complete; user starts remeasurement
                    v
            +-------+----------+
            | IN_REMEASUREMENT |
            +-------+----------+
                    |
          remeasurement captured (beats, partial, or no improvement)
                    v
                +---+----+
                | CLOSED |
                +--------+
                ^        ^
                |        |
         close=SUCCESS   close=FAILED_HONEST (still requires remeasurement!)
```

**Guards:**
- `DRAFT → ACTIVE` requires `baselineMetricId !== null` AND `baseline.locked === true` AND `goalStatement` set.
- `ACTIVE → IN_REMEASUREMENT` base rule is unguarded (a hint-only `readyToRemeasure` computed property exists). **Additional guard for `projectType === 'KAIZEN_EVENT_90D'`:** `sustainmentGatePassed === true` — Sustainment Gate pass required before rebaseline is attempted (adoption ≥80% × 2 consecutive working weeks, no rollback events). Enforced in `KaizenService.startRemeasurement()`. Per `KAIZEN_EVENT_STANDARD §11.5` item 8.
- `IN_REMEASUREMENT → CLOSED` requires `remeasurementId !== null` AND `remeasurement.metricDefinitionId === baseline.metricDefinitionId`. This is the **HARD RULE** (blueprint §4.1 item 4, §7.2): no remeasurement → no close. A Kaizen cannot be "failed-and-closed" without measuring; it can only be abandoned, which is modeled by transitioning back to `DRAFT` with an `abandoned: true` flag, never to `CLOSED`.
- MVP cap: system rejects a second transition to `ACTIVE` while another is not terminal.

### 3.4 Phase FSM for phased project types (`KAIZEN_ACCELERATOR_30D` + `KAIZEN_EVENT_90D`)

Applies to both `Kaizen.projectType === 'KAIZEN_ACCELERATOR_30D'` and `Kaizen.projectType === 'KAIZEN_EVENT_90D'`. The two types have **different phase structures** (Accelerator: `PHASE_0..PHASE_4`; Kaizen 90: `PRE_EVENT / EVENT / POST_EVENT / SUSTAIN` per `KAIZEN_EVENT_STANDARD.md §2`). Phase names displayed in the UI come from each Kaizen's `phaseDefinitions` snapshot set at project create — never hard-coded constants. Composes with the Kaizen FSM in §3.3: phase advances drive the Kaizen FSM's `DRAFT → ACTIVE → IN_REMEASUREMENT → CLOSED` transitions at the gate boundaries. Full Accelerator spec: `PROJECT_TYPE_30D_KAIZEN.md §4`. Full Kaizen 90 spec: `KAIZEN_EVENT_STANDARD.md §2` + §11.2.

**Phase advancement is user-driven, not auto-advance.** Each transition is fired by an explicit user action on `KaizenCard` (the "Advance to Phase N+1" button); `KaizenService.canAdvancePhase(kaizenId, toPhase)` blocks the transition if prior-phase closure conditions are not met.

```
       (Kaizen created; projectType='KAIZEN_ACCELERATOR_30D')
                          │
                          v
                    +----------+
                    | PHASE_0  |  ← seeded at create (alignment / scoping)
                    +----+-----+
                         |
          30d_0_6_approve_charter CLOSED
                         v
                    +----------+
                    | PHASE_1  |  ← baseline (Days 1–7)
                    +----+-----+
                         |
          30d_1_6_validate_baseline CLOSED
          AND Kaizen.baselineMetricId set
          AND BaselineMetric.locked === true
                         v
                    +----------+
                    | PHASE_2  |  ← virtual Kaizen event (Days 8–12)
                    +----+-----+            (Kaizen FSM: DRAFT → ACTIVE here)
                         |
          30d_2_6_create_backlog CLOSED
          AND 30d_2_7_define_future_sops CLOSED
                         v
                    +----------+
                    | PHASE_3  |  ← implementation (Days 13–23)
                    +----+-----+
                         |
          30d_3_1_assign_ownership CLOSED
          AND 30d_3_6_update_sops_realtime CLOSED
          AND actions done ratio ≥ 0.80
                         v
                    +----------+
                    | PHASE_4  |  ← validation + ROI (Days 24–30)
                    +----+-----+            (Kaizen FSM: ACTIVE → IN_REMEASUREMENT)
                         |
          30d_4_1_rebaseline CLOSED
          AND Kaizen.remeasurementId !== null
          AND Kaizen.roi !== null
          AND 30d_4_5_control_plan CLOSED
          AND 30d_4_6_final_report CLOSED
                         v
                    +----------+
                    |  CLOSED  |  ← existing Kaizen FSM CLOSED
                    +----------+

  ABANDONED path (any phase): Kaizen.state → DRAFT with abandoned=true, never CLOSED
  (per §3.3 — same as existing Kaizen abandonment path).
```

**Transition table** (matches `PROJECT_TYPE_30D_KAIZEN.md §4.2`):

| FROM | TO | Trigger | Guard (`canAdvancePhase()`) | Side effects | Emits |
|---|---|---|---|---|---|
| (create) | PHASE_0 | `KaizenService.promote()` with `projectType='KAIZEN_ACCELERATOR_30D'` | Always | Freezes `phaseDefinitions`; sets `startDate`; schedules `30d_0_1` on next Daily composition | `KaizenPromoted`, `ProjectPhaseAdvanced{from:null, to:'PHASE_0'}` |
| PHASE_0 | PHASE_1 | User taps "Advance to Phase 1" on KaizenCard | `30d_0_6_approve_charter` CLOSED AND `outputArtifactRef.schema === 'DOCUMENT'` with non-null value | Composer eligible payload set flips to Phase 1 entries | `ProjectPhaseAdvanced` |
| PHASE_1 | PHASE_2 | User taps "Advance to Phase 2" | `30d_1_6_validate_baseline` CLOSED AND `Kaizen.baselineMetricId !== null` AND `BaselineMetric.locked === true` | Kaizen transitions `DRAFT → ACTIVE` (baseline locked + goal implied by `30d_0_4`). Composer enters "Kaizen Event week" mode for Phase 2 days. | `ProjectPhaseAdvanced`, `KaizenBaselineLocked` |
| PHASE_2 | PHASE_3 | User taps "Advance to Phase 3" | `30d_2_6_create_backlog` CLOSED AND `30d_2_7_define_future_sops` CLOSED AND `controlPlanDraftArtifactRef !== null` (draft output of `30d_2_5_define_improvements` per `ACCELERATOR_STANDARD §1.6` refinement #2) | `Kaizen.actions[]` populated from backlog entries (each backlog line item becomes an action; items tagged strategic in backlog carry `strategic: true`) | `ProjectPhaseAdvanced` |
| PHASE_3 | PHASE_4 | User taps "Advance to Phase 4" (or system auto-prompts at Day 24) | `30d_3_1_assign_ownership` CLOSED AND `30d_3_6_update_sops_realtime` CLOSED AND `actions.filter(a=>a.doneAt!==null).length / actions.length >= 0.80` AND `!actions.some(a => a.strategic === true && a.doneAt === null)` — **weighted guard: strategic items veto advance regardless of overall completion ratio** (per `ACCELERATOR_STANDARD §1.6` refinement #5) | Kaizen transitions `ACTIVE → IN_REMEASUREMENT` — Phase 4 is the remeasurement window | `ProjectPhaseAdvanced` |
| PHASE_4 | CLOSED | User taps "Close Kaizen" on KaizenCard | `30d_4_1_rebaseline` CLOSED AND `Kaizen.remeasurementId !== null` AND `remeasurement.metricDefinitionId === baseline.metricDefinitionId` AND `Kaizen.roi !== null` AND `30d_4_5_control_plan` CLOSED AND `30d_4_6_final_report` CLOSED | Existing Kaizen close: `closeKind ∈ {SUCCESS, PARTIAL, FAILED_HONEST}` computed from `remeasurement.beatsBaseline` + `roi` sign | `ProjectPhaseAdvanced{to:'CLOSED'}`, `KaizenClosed` |
| ANY | abandoned (DRAFT) | User taps "Abandon" | — | Sets `abandoned=true`, never `CLOSED` (per §3.3) | `KaizenAbandoned` |

**Phase 2 preserves the 4-2-2 shape.** The Phase 2 "virtual Kaizen event window" packs PROJECT-bucket Deep blocks with Phase 2 catalog entries but does NOT override per-day invariants. Users who need multi-hour deep sessions during Phase 2 schedule them via the normal composer Edit flow across the Phase 2 days — no per-day 4-2-2 exemption. See `ENGINE_DESIGN.md §4.2` composer behavior and `PROJECT_TYPE_30D_KAIZEN.md §5.3`.

#### 3.4.1 Phase FSM for `KAIZEN_EVENT_90D` (Kaizen 90)

Applies when `Kaizen.projectType === 'KAIZEN_EVENT_90D'`. Phase structure is the four macro-phases from `KAIZEN_EVENT_STANDARD §2`:

```
        (Kaizen created; projectType='KAIZEN_EVENT_90D')
                          │
                          v
                    +------------+
                    | PRE_EVENT  |  ← seeded at create (Days 1–14; intake → charter → baseline → event prep)
                    +-----+------+
                          |
           kze_preevent_N (last sub-phase 08) CLOSED
           AND Kaizen.baselineMetricId set AND BaselineMetric.locked === true
                          v
                    +------------+
                    |   EVENT    |  ← 1 week (Days 15–19) — Kaizen Week; sub-phases 09–13
                    +-----+------+            (Kaizen FSM: DRAFT → ACTIVE here)
                          |
           kze_event_17 (Day 5 close + commitments memo) CLOSED
                          v
                    +------------+
                    | POST_EVENT |  ← 50 days (Days 20–70) — backlog execution + change mgmt + adoption monitor
                    +-----+------+            (sub-phases 14–17)
                          |
           kze_postevent_22 CLOSED
           AND sustainmentGatePassed === true
           (adoption ≥80% × 2 consecutive working weeks; no rollback events)
                          v
                    +------------+
                    |  SUSTAIN   |  ← 20 days (Days 71–90) — rebaseline + ROI + control plan + readout
                    +-----+------+            (Kaizen FSM: ACTIVE → IN_REMEASUREMENT)
                          |
           kze_sustain_N (exec readout + PO transition) CLOSED
           AND Kaizen.remeasurementId !== null AND Kaizen.roi !== null
           AND controlPlanArtifactRef !== null
                          v
                    +------------+
                    |   CLOSED   |
                    +------------+

  ABANDONED path (any phase): Kaizen.state → DRAFT with abandoned=true, never CLOSED.
```

**Transition table** (parallels the Accelerator table above):

| FROM | TO | Trigger | Guard (`canAdvancePhase()`) | Side effects | Emits |
|---|---|---|---|---|---|
| (create) | PRE_EVENT | `KaizenService.promote()` with `projectType='KAIZEN_EVENT_90D'` + `implementationLeadUserId` present | `implementationLeadUserId !== null` AND referenced user has `IMPLEMENTATION_LEAD` role AND is distinct from Facilitator / Process Owner | Freezes `phaseDefinitions` (4 phases per `KAIZEN_EVENT_STANDARD §2`); sets `startDate`; schedules PRE_EVENT intake entries | `KaizenPromoted`, `ProjectPhaseAdvanced{from:null, to:'PRE_EVENT'}` |
| PRE_EVENT | EVENT | User taps "Advance to Event Week" on KaizenCard | Last PRE_EVENT gate task CLOSED AND `Kaizen.baselineMetricId !== null` AND `BaselineMetric.locked === true` | Kaizen transitions `DRAFT → ACTIVE`; composer filters Deep payload to EVENT-phase entries (`#45`, `#46`, `#47` + `kze_event_*`) | `ProjectPhaseAdvanced`, `KaizenBaselineLocked` |
| EVENT | POST_EVENT | Facilitator calls "Advance to Post-Event" (Day 5 close of Kaizen Week) | `kze_event_17` CLOSED AND commitments memo (A22) attached | `Kaizen.actions[]` populated from backlog; sprint cadence starts (weekly Mon plan / Wed check / Fri demo-retro) | `ProjectPhaseAdvanced` |
| POST_EVENT | SUSTAIN | User taps "Advance to Sustainment" (Day 70) | `kze_postevent_22` CLOSED AND `sustainmentGatePassed === true` | Kaizen transitions `ACTIVE → IN_REMEASUREMENT`; SUSTAIN phase begins rebaseline | `ProjectPhaseAdvanced` |
| SUSTAIN | CLOSED | User taps "Close Kaizen" on KaizenCard (Day 85–90) | Remeasurement captured AND matching metric AND `roi !== null` AND `controlPlanArtifactRef !== null` AND exec readout + PO transition entries CLOSED | Existing Kaizen close: `closeKind ∈ {SUCCESS, PARTIAL, FAILED_HONEST}`; seeds `sustainmentCheckIns[]` at Day 30/60/90 post-close if closeKind ∈ {SUCCESS, PARTIAL} | `ProjectPhaseAdvanced{to:'CLOSED'}`, `KaizenClosed` |
| ANY | abandoned (DRAFT) | User taps "Abandon" | — | Sets `abandoned=true`, never `CLOSED` (per §3.3) | `KaizenAbandoned` |

**Sustainment Gate semantics.** The POST_EVENT → SUSTAIN guard's `sustainmentGatePassed` boolean is NOT computed automatically — it is set by explicit Facilitator attestation after verifying the adoption log shows ≥80% on each of 10 consecutive working days AND no rollback events. The engine provides a helper (`canAttemptRebaseline(kaizen, adoptionLog)` — see `ENGINE_DESIGN §4.4.1`) that computes "eligible for attestation" but the final flag flip is a user action. Per `KAIZEN_EVENT_STANDARD §2.17` + §11.5 item 8.

### 3.5 Variance (no FSM — append-only)

`Variance` has no state transitions. It is always born in terminal state. Corrections are new rows.

### 3.6 FrictionSignal FSM

```
   OPEN ──► CLUSTERED ──► PROMOTED_TO_KAIZEN   (immutable after promote)
    │
    └──► DISMISSED                              (terminal)
```

### 3.7 Where each transition is triggered

| Transition | Trigger | Emits event |
|---|---|---|
| `Composition.PROPOSED → ACCEPTED` | User confirms composer output | `CycleAccepted` |
| `Composition.PROPOSED → ACCEPTED` (edited) | User edits then confirms | `CycleEdited` |
| `Composition.ACCEPTED → ACTIVE` | Clock ticks past `startAt` | `CompositionStarted` |
| `ScheduledActivity.SCHEDULED → IN_PROGRESS` | User taps "Start" | `ActivityStarted` |
| `ScheduledActivity.IN_PROGRESS → CLOSED` | User taps "Close" + passes guards | `ActivityCompleted`, `ReflectionCaptured` |
| `ScheduledActivity.SCHEDULED → SKIPPED` (non-optional) | Composition ends with no start | `VarianceLogged` |
| `FrictionSignal.OPEN → PROMOTED_TO_KAIZEN` | Weekly Reflection promotion | `KaizenPromoted` |
| `Kaizen.IN_REMEASUREMENT → CLOSED` | Remeasurement captured | `KaizenClosed` |
| `Kaizen.phase` advance (Accelerator or Kaizen 90) | User taps "Advance to Phase N" on KaizenCard AND `canAdvancePhase()` passes | `ProjectPhaseAdvanced` |
| Project pace warning (Accelerator or Kaizen 90) | `KaizenService.advancePhase()` detects elapsed working days > spec target for prior phase, OR Kaizen 90 sprint velocity < 60% | `ProjectPaceWarning` |
| Scope change logged | User files a scope change through `KaizenCard` → Scope Change form | `ScopeChangeRequested` |

---

## 4. Scheduling Engine Logic

The composer is deterministic, inspectable, and free of AI in MVP. (AI coaching is a Next-state enhancement per blueprint §5.2.)

### 4.1 Inputs

```ts
type ComposerInput = {
  cycleType: 'DAILY' | 'WEEKLY' | 'SPRINT' | 'MONTHLY',
  userId: string,
  role: Role[],                // from User
  capacityMinutes: number,     // from User minus external calendar (future)
  sprintPhase:                 // computed from User.sprintAnchorDate vs. now
    'PLANNING_DAY' | 'EXECUTION_WK1' | 'MID_SPRINT_DAY' |
    'EXECUTION_WK2' | 'REVIEW_DAY' | 'RETRO_DAY',
  activeKaizen: Kaizen | null,
  varianceQueue: Variance[],   // unresolved non-optional skips from prior cycle
  catalog: CatalogEntry[],     // enabled entries for user's roles
  priorCompositions: Composition[]  // for variance signal + cadence tracking
}
```

### 4.2 Daily composer — algorithm

```
fn composeDaily(input) -> Composition:
  buckets = { PROJECT: 240, COMMUNICATION: 120, CI: 120 }  # minutes; 4-2-2

  scheduled = []

  # 1. Place non-optional set first (blueprint §3.4) — these anchor the day
  add(scheduled, "Daily Standup", 15 min, bucket=COMMUNICATION)
  add(scheduled, "AM High-value Communication block", 60 min, bucket=COMMUNICATION)
  add(scheduled, "Post-lunch High-value Communication block", 30 min, bucket=COMMUNICATION)
  add(scheduled, "End-of-Activity Reflection (meta)", 15 min, bucket=CI)    # ensures reflection fires
  # Remaining: PROJECT 240, COMMUNICATION 15, CI 105

  # 2. Rescue skipped non-optionals from prior cycle's variance queue
  for v in input.varianceQueue where catalog(v).isNonOptional:
      if fits in remaining bucket: add(scheduled, v.catalogEntry, …)

  # 3. Place Deep Work payload = eligible DMAIC/Kaizen step(s) from the DAG (if any)
  # DMAIC payload is a DAG per CatalogEntry.dependsOn (not a strict numeric walk).
  # An entry is "eligible" iff every dependsOn entry has a CLOSED ScheduledActivity in the same Kaizen.
  # Multiple eligible entries may be placed in parallel across the sprint's Deep blocks.
  if input.activeKaizen:
      eligible = eligibleDmaicPayloadSteps(activeKaizen)  # DAG traversal; see §4.5 R9
      if eligible.length > 0:
          step = pickHighestPriority(eligible)  # priority = (phase match, dependsOn-satisfied recency, catalog order)
          add(scheduled, step, min(step.duration, 240) minutes, bucket=PROJECT,
                         linkedKaizenId=activeKaizen.id,
                         linkedDmaicStepRef={kaizenId, catalogEntryId: step.id})
          # Slice into 2×2h or 4×1h per user preference (default 2×2h)
      else:
          # All DAG entries for this phase done or blocked; fall through to generic Deep
          add(scheduled, "Deep Work — Project Task (generic)", 240 min, bucket=PROJECT,
                         linkedKaizenId=activeKaizen.id)
  else:
      add(scheduled, "Deep Work — Project Task (generic)", 240 min, bucket=PROJECT)

  # 4. Phase-specific ceremonies
  if sprintPhase == PLANNING_DAY:    add("Sprint Planning", 120, COMMUNICATION or PROJECT)
  if sprintPhase == MID_SPRINT_DAY:  add("Mid-Sprint Review", 30, COMMUNICATION)
  if sprintPhase == REVIEW_DAY:      add("Sprint Review", 60, COMMUNICATION)
                                     add("Sprint Retrospective", 30, COMMUNICATION)

  # 5. Fill remaining CI bucket with rotation heuristic
  ciRotation = [PDCA_CYCLE, LnD_TICK, SIX_S_EMAIL, DOC_REVIEW_IF_PENDING]
  while remaining(CI) >= 30:
      pick next from ciRotation that hasn't fired in N days per its cadence
      add(…, bucket=CI)

  # 6. Fill any remaining COMMUNICATION minutes with configured 1:1 or team meeting
  if remaining(COMMUNICATION) >= 15:
      add("Connecting with teammates (1:1)" if Wed/Thu else "Team meeting", …)

  # 7. Run invariants; reject if any fail (composer retries with relaxed heuristics)
  return buildComposition(scheduled, state=PROPOSED)
```

### 4.3 Weekly composer — algorithm

```
fn composeWeekly(input) -> Composition:
  week = []

  for each workday in input.workDays:
      daily = composeDaily({ …input, cycleType: DAILY, date: workday })
      week.push(daily)

  # Weekly non-optionals
  attach("Mid-Sprint Review", Fri Wk1) if mid-sprint
  attach("Weekly 1:1", Wed or Thu)
  attach("Weekly L&D tick or Document Writing")
  attach("6S Email", Mon-or-as-anchor) if inbox threshold tripped
  attach("Weekly Reflection (20-min DMAIC)", Fri afternoon, bucket=CI, 20 min)

  # Fold weekly non-optionals into the right Daily composition's CI/COMMUNICATION bucket
  return buildComposition(week, state=PROPOSED, parent=none, cycleType=WEEKLY)
```

### 4.4 Sprint / Monthly composers (Next)

Deferred per blueprint §4.1 (Sprint / Monthly composers are Next). Interfaces are reserved in `ComposerService`:

```
composeSprint(input)    // future: 10 daily compositions + sprint ceremonies
composeMonthly(input)   // future: 2 sprints + monthly check-in + quarterly anchor
```

MVP users place Sprint Planning / Review / Retro manually via the Weekly composer's edit step.

### 4.5 Decision rules (explicit)

| Rule | Behavior |
|---|---|
| R1. Non-optional first | Never drop a non-optional to fit a configurable entry |
| R2. Variance rescue | Unresolved non-optional variances from yesterday get slot preference today |
| R3. Kaizen link | If an active Kaizen exists, Deep block is linked to its current DMAIC/Kaizen step |
| R4. 1:1 anchor | Weekly 1:1 lands on Wed or Thu (catalog #16 default), not Mon or Fri |
| R5. Reflection anchor | Weekly Reflection lands on Fri afternoon, protected |
| R6. 6S Email threshold | Only scheduled if `inboxUnread > threshold` signal present |
| R7. PDCA cadence | Fires at most every 48 hours |
| R8. Over-capacity | If cumulative minutes > capacity, drop configurable entries in reverse priority order; if non-optionals still over, return `INFEASIBLE` response (see §4.7) — never silently truncate |
| R9. DMAIC DAG traversal | A DMAIC/Kaizen catalog entry is eligible as Deep-block payload iff (a) it is in the active `Kaizen`'s project scope AND (b) every id in its `CatalogEntry.dependsOn` has a `CLOSED` `ScheduledActivity` in the same Kaizen. Multiple eligible entries may be placed in parallel across the same sprint's Deep blocks (async tasks). No strict numeric `#20 → #41` walk. |

### 4.6 Composer output

A `Composition` in state `PROPOSED` with all child `ScheduledActivity` rows in state `PROPOSED`. The user sees a filled-in cycle and chooses Accept / Edit / Reject. Acceptance flips the composition and all children to `ACCEPTED` / `SCHEDULED` atomically.

### 4.7 INFEASIBLE response shape + guided resolution flow

When the composer cannot produce a valid proposal (non-optional set + ceremonies exceed capacity after relaxing all configurables), it does NOT return a `Composition`. Instead it returns a structured `InfeasibleResult` the UI renders as a CycleCard infeasibility state with guided remediation:

```js
// PSEUDO
type InfeasibleResult = {
  kind: 'INFEASIBLE',
  totalRequiredMinutes: number,           // sum of non-optional + phase ceremonies
  capacityMinutes: number,                // userDailyCap - externalMinutesToday
  shortfallMinutes: number,               // totalRequired - capacity
  bucketShortfalls: {                     // per-bucket diagnostic
    PROJECT: number,                      // required vs available
    COMMUNICATION: number,
    CI: number,
  },
  suggestedActions: Array<                // ordered by product-preferred remediation
    | { kind: 'RAISE_CAPACITY', currentMinutes, suggestedMinutes }
    | { kind: 'REDUCE_EXTERNAL', currentExternalMinutes, suggestedExternalMinutes }
    | { kind: 'SKIP_CEREMONY_WITH_REASON', catalogEntryId, ceremonyName, defaultReasonCode }
    | { kind: 'DEFER_NON_OPTIONAL_TO_NEXT_DAY', catalogEntryId, rationale }
  >,
  explain: string[]                       // human-readable "why INFEASIBLE" lines
}
```

**UI contract (per `UX_FLOWS.md` §2.1 infeasibility path):** the CycleCard renders the explain lines and the `suggestedActions` as action buttons in the given order. Each action, when taken, mutates the relevant input and re-invokes `composeDaily()`:

- **Raise capacity** — opens a capacity input on the CycleCard; on save, updates `User.dailyCapacityMinutes` for today (a one-day override) or permanently, per the user's toggle; re-composes.
- **Skip ceremony with reason** — shows the specific ceremony's name and the fixed reason-code picker (§2.5 enum). On submit, atomically logs a `Variance { kind: SKIPPED_NON_OPTIONAL, reasonCode, note }` and re-composes with that ceremony excluded for this day only. The next day's composer will re-queue the skipped non-optional from `varianceQueue` per R2.
- **Defer non-optional to next day** — for non-optionals that are not phase-locked ceremonies (e.g., a deferrable Mid-Sprint Review can be pushed one day if scheduling conflict). Logs a `Variance { kind: RESCHEDULED }` and re-composes.

The guided flow is **not a silent fallback to the prior day's composition**. Every remediation produces either a new proposed Composition or an explicit user decision to keep the day unscheduled.

---

## 5. Capacity Calculation Model

### 5.1 Primitives

- **Minute** is the unit of capacity. All durations are integer minutes.
- **Bucket capacity** on a Daily cycle is a fixed triple `{ PROJECT: 240, COMMUNICATION: 120, CI: 120 }` = 480 min / 8h (the 4-2-2 invariant).
- A user's `dailyCapacityMinutes` defaults to 480. If the user declares reduced availability (e.g., half-day), all three buckets scale proportionally (2-1-1 for a 4h day) rather than collapsing one bucket.

### 5.2 Daily 4-2-2 invariant

```
ok if (
  sum(plannedDurationMinutes where bucket=PROJECT)       >= 0.5 * userDailyCap * (240/480) AND
  sum(plannedDurationMinutes where bucket=COMMUNICATION) >= 0.5 * userDailyCap * (120/480) AND
  sum(plannedDurationMinutes where bucket=CI)            >= 0.5 * userDailyCap * (120/480)
)
```

The 0.5 floor is a **minimum viable 4-2-2** guard to prevent over-scheduling one bucket; a fully-valid day hits 4-2-2 exactly. Above the floor, the composer may pack a bucket to 100% but no higher.

Hard ceiling: `sum(all plannedDurationMinutes) <= userDailyCapacityMinutes`.

### 5.3 Weekly capacity

- Target: 5 × 480 = 2400 min (40h project-work capacity per blueprint §3.2).
- Cross-day invariant: sum of PROJECT minutes across the week ≥ 5 × 240 = 1200 min (20h protected Deep).
- No day's total may exceed `userDailyCapacityMinutes`.

### 5.4 Sprint capacity (Next)

- Target: 2 × 2400 = 4800 min per person per sprint.
- Sprint Planning, Mid-Sprint Review, Sprint Review, Retrospective are deducted from COMMUNICATION bucket of their specific days.

### 5.5 External calendar capacity (MVP manual override + future auto-import)

Users already have real meetings on their calendar in MVP, before any calendar integration ships. MVP therefore supports a manual capacity reservation:

**MVP — manual override on the Daily composer:**
- `Composition(DAILY)` carries an optional `externalMinutesToday: integer` field (default 0, capped at 240 so Deep cannot be zeroed out).
- The user enters this in the Daily composer (flow 2.1) before tapping Accept / Edit. It can also be set retroactively when re-composing a day.
- The composer subtracts `externalMinutesToday` from the `COMMUNICATION` target before packing. The resulting triple is `{ PROJECT: 240, COMMUNICATION: max(60, 120 - externalMinutesToday), CI: 120 }` — COMMUNICATION never drops below its 60-min floor.
- If `externalMinutesToday > 60`, the composer warns via CycleCard error state: "Reserved 90 min of external meetings. COMMUNICATION bucket reduced to 30 min for today's composed blocks."
- No automatic event creation for the external meetings themselves; they are treated as a capacity drain, not as individual ScheduledActivities. Users who want the external meetings visible on `/today` must add them as configurable Communication blocks manually.

**Future state — auto-import from Google / MS Calendar:**
External events imported from Google / MS Calendar are modeled as `ScheduledActivity` instances of a generic `CatalogEntry` (`External Meeting` with `bucket=COMMUNICATION` and `isNonOptional=false`). They consume `COMMUNICATION` bucket capacity first; if overflow, they spill into user-confirmed displacement of configurable CI entries (never Deep or non-optional). The import replaces the manual `externalMinutesToday` input with a computed value from real events.

### 5.6 Over-schedule prevention

Enforced in `InvariantEngine.validateComposition()`:

```js
// PSEUDO
function validateComposition(c) {
  const total = sum(c.activities, a => a.plannedDurationMinutes);
  if (total > user.dailyCapacityMinutes) return fail('OVER_CAPACITY', { total, cap });

  if (c.cycleType === 'DAILY') {
    const p = bucketSum(c, 'PROJECT'),
          m = bucketSum(c, 'COMMUNICATION'),
          i = bucketSum(c, 'CI');
    if (p < 0.5 * 240) return fail('DEEP_UNDER_FLOOR');
    if (m < 0.5 * 120) return fail('COMM_UNDER_FLOOR');
    if (i < 0.5 * 120) return fail('CI_UNDER_FLOOR');
    if (p > 240 * 1.10) return fail('PROJECT_OVERPACKED');  // 10% slack tolerated
    if (m > 120 * 1.25) return fail('COMM_OVERPACKED');
    if (i > 120 * 1.25) return fail('CI_OVERPACKED');
  }

  const nonOptMissing = requiredNonOptionals(c).filter(n => !c.has(n));
  if (nonOptMissing.length) return fail('NON_OPTIONAL_MISSING', { missing: nonOptMissing });

  return ok();
}
```

A failed validation during composer auto-build triggers a retry with relaxed configurable entries; a failed validation during user edit is surfaced as a blocking error — the user can reject the day but cannot save a broken one.

---

## 6. Event System (observer pattern)

Events are emitted by services after state transitions commit to the repository. Subscribers are idempotent.

### 6.1 MVP event catalog

| Event | Payload | Primary subscribers |
|---|---|---|
| `CycleProposed` | `{ compositionId, cycleType }` | UI (show Accept/Edit/Reject) |
| `CycleAccepted` | `{ compositionId, cycleType, edited: boolean }` | MetricsService (composition acceptance), UI refresh |
| `CycleEdited` | `{ compositionId, editedActivityIds }` | MetricsService (acceptance denominator) |
| `CycleRejected` | `{ compositionId, reason }` | MetricsService |
| `CompositionStarted` | `{ compositionId }` | UI (highlight active day) |
| `CompositionClosed` | `{ compositionId }` | ComposerService (triggers next cycle composition), MetricsService |
| `ActivityStarted` | `{ scheduledActivityId, startedAt }` | UI (timer) |
| `ActivityStartedLate` | `{ scheduledActivityId, minutesLate }` | MetricsService (start-on-time leading indicator per blueprint §7.3) |
| `ActivityCompleted` | `{ scheduledActivityId, outputArtifactRef, actualDurationMinutes }` | ReflectionService (prompt for reflection, auto-stub pending Reflection), MetricsService |
| `ReflectionStubbed` | `{ reflectionId, scheduledActivityId, pending: true }` | UI (show pending banner) |
| `ReflectionCaptured` | `{ reflectionId, scheduledActivityId, onTime: boolean }` | MetricsService (reflection rate), FrictionService (if frictionFlag) |
| `VarianceLogged` | `{ varianceId, kind, reasonCode, catalogEntryId }` | MetricsService (adherence), ComposerService (variance queue for next cycle) |
| `FrictionSignalCaptured` | `{ frictionSignalId, reflectionId }` | KaizenCandidateQueue (cluster + score) |
| `WeeklyReflectionCompleted` | `{ reflectionId, compositionId, promotedKaizenId?: string }` | KaizenService |
| `KaizenPromoted` | `{ kaizenId, fromFrictionSignalIds }` | UI (show active Kaizen), ComposerService (link Deep block) |
| `KaizenBaselineLocked` | `{ kaizenId, baselineMetricId }` | UI (state change to ACTIVE) |
| `KaizenRemeasured` | `{ kaizenId, remeasurementId, beatsBaseline }` | MetricsService |
| `KaizenClosed` | `{ kaizenId, closeKind }` | MetricsService (Kaizen throughput), UI |
| `PdcaExperimentOpened` | `{ pdcaExperimentId, userId, hypothesis }` | ComposerService (seed 48h tick cadence), UI |
| `PdcaTickCommitted` | `{ pdcaExperimentId, scheduledActivityId, measurement, consecutiveTargetHits }` | PdcaService (advance PLAN/DO/CHECK/ACT), MetricsService |
| `PdcaExperimentClosed` | `{ pdcaExperimentId, closedReason }` | UI, KaizenService (if SUPERSEDED_BY_KAIZEN) |
| `ComposerInfeasible` | `{ userId, date, result: InfeasibleResult }` | UI (show guided remediation), MetricsService (count INFEASIBLE days as a leading indicator of chronic over-schedule) |
| `ProjectPhaseAdvanced` | `{ kaizenId, projectType, fromPhase, toPhase, advancedAt }` | ComposerService (re-filters Deep-block payload selector by new phase), UI (re-render `KaizenCard` PhaseStepper variant for the current `projectType`), MetricsService (phase-duration leading indicator). Fires for BOTH `KAIZEN_ACCELERATOR_30D` and `KAIZEN_EVENT_90D`. |
| `ProjectPaceWarning` | `{ kaizenId, projectType, phase, expectedMaxDays, actualDays, kind }` | UI (inline microcopy on KaizenCard; soft warning, not a block). Pace math: `User.workDays` intersected with elapsed calendar days; no holiday model in MVP. Emitter logic by `projectType`: (a) `KAIZEN_ACCELERATOR_30D` + `KAIZEN_EVENT_90D` — phase-based; fires when a phase's elapsed working days exceed its spec target from `phaseDefinitions`. (b) `KAIZEN_EVENT_90D` — also flags `kind='SPRINT_VELOCITY_UNDER_60'` when a POST_EVENT weekly sprint retrospective shows velocity < 60%. (c) `AD_HOC` — `targetCloseDate`-based; fires when `now > Kaizen.targetCloseDate` AND state ∈ {DRAFT, ACTIVE, IN_REMEASUREMENT}; `phase` is null, `expectedMaxDays` = `targetCloseDate - startDate`, `actualDays` = `now - startDate`, `kind = 'AD_HOC_OVERRUN'`. (d) `DMAIC` + standalone `KAIZEN_EVENT` — no automatic pace warning in MVP (DMAIC duration is intentionally flexible; 1–5 day Kaizen Event is too short to warrant one). See `PROJECT_TYPE_30D_KAIZEN.md §9`, `KAIZEN_EVENT_STANDARD.md §11.5` item 7, and `ADHOC_PDCA_STANDARD §1.A.7` refinement #1. **Breaking event rename from v0.4**: this replaces `AcceleratorPaceWarning`. Downstream code in `js/events/events.js` needs to update the constant name — see decisions log item 19 below. |
| `ScopeChangeRequested` | `{ kaizenId, requestedBy, reason, impactAssessment, approved: boolean, approvedAt, approvedBy }` | `KaizenService.appendScopeChange()` (appends to `Kaizen.scopeChanges[]`), UI (renders entry on KaizenCard scope-change log), MetricsService (counts scope changes as project-discipline leading indicator). Informational/audit — does NOT auto-pause the project. Complements the existing abandonment path as the only way to halt a project. Per `ACCELERATOR_STANDARD §1.6` refinement #4. |

### 6.2 Subscriber responsibilities

- **MetricsService** subscribes to `ActivityCompleted`, `ActivityStartedLate`, `VarianceLogged`, `ReflectionCaptured`, `CycleAccepted`, `CycleEdited`, `KaizenRemeasured`, `KaizenClosed` → recomputes the rolling 14-day `MetricsSnapshot` and writes it. Also exposes `getLatestSnapshot(userId): MetricsSnapshot | null` for synchronous UI reads (e.g., `AdherenceDial` on every page load).
- **ActivityService** emits `ActivityStartedLate` inside `start()` whenever `now - plannedStartAt > 5 min` (in the same transaction as the `ActivityStarted` emit).
- **ReflectionService** subscribes to `ActivityCompleted` → auto-stubs a `Reflection` row with `pending=true` if the activity is non-optional. Subscribes to user's reflection-capture action → flips `pending=false` and emits `ReflectionCaptured`.
- **ComposerService** subscribes to `CompositionClosed` → queues a proposal for the next cycle boundary.
- **ComposerService** subscribes to `VarianceLogged` where `kind === SKIPPED_NON_OPTIONAL` → adds to `varianceQueue` input for next composition.
- **KaizenCandidateQueue** (internal to KaizenService) subscribes to `FrictionSignalCaptured` → clusters by tag, surfaces at Weekly Reflection. Also tracks dismissed-cluster history per tag so the `WeeklyReflectionWizard` can show "similar cluster dismissed N weeks ago" when a re-surfacing cluster tag matches.
- **UI** subscribes to every event to refresh affected views.

### 6.3 Event bus contract

MVP implementation: single in-memory `EventBus` module with `subscribe(event, handler)` / `publish(event, payload)`. Synchronous dispatch. No event persistence (events are derived from state and can be replayed by re-emitting from current state if needed).

```js
// PSEUDO — MVP
const EventBus = (() => {
  const subs = new Map(); // event → handler[]
  return {
    subscribe(event, fn) { (subs.get(event) ?? subs.set(event, []).get(event)).push(fn); },
    publish(event, payload) { (subs.get(event) ?? []).forEach(fn => fn(payload)); }
  };
})();
```

### 6.4 Future-state extension points

- **Persisted event log** — events written to an `events` table for audit / replay (supports DMAIC Control Charts and Kaizen portfolio analytics).
- **Async handlers** — background-job-based subscribers for Slack / Teams nudges and email digests.
- **Event sourcing for Kaizens** — rebuild Kaizen state from its event history to satisfy auditability requirements for regulated customers.
- **Outbound webhooks** — third parties subscribe to `KaizenClosed` for external benefits-tracking tools.

---

## 7. Persistence Strategy

### 7.1 MVP — localStorage

**Key layout (all prefixed `bamx:v1:` for schema versioning):**

| Key | Shape | Notes |
|---|---|---|
| `bamx:v1:meta` | `{ schemaVersion: 1, lastMigratedAt, createdAt }` | Drives migrations |
| `bamx:v1:user` | `User` object | Single row in MVP |
| `bamx:v1:catalog` | `{ [catalogEntryId]: CatalogEntry }` | Keyed map |
| `bamx:v1:compositions` | `{ [compositionId]: Composition }` | |
| `bamx:v1:activities` | `{ [scheduledActivityId]: ScheduledActivity }` | |
| `bamx:v1:reflections` | `{ [reflectionId]: Reflection }` | |
| `bamx:v1:variances` | `{ [varianceId]: Variance }` | Append-only; writes are insert-only |
| `bamx:v1:frictions` | `{ [frictionSignalId]: FrictionSignal }` | |
| `bamx:v1:kaizens` | `{ [kaizenId]: Kaizen }` | |
| `bamx:v1:baselines` | `{ [baselineMetricId]: BaselineMetric }` | |
| `bamx:v1:remeasurements` | `{ [remeasurementId]: Remeasurement }` | |
| `bamx:v1:metrics` | `{ [snapshotId]: MetricsSnapshot }` | Latest 30 kept; older evicted |
| `bamx:v1:pdca` | `{ [pdcaExperimentId]: PdcaExperiment }` | Active + recently closed (last 10) |
| `bamx:v1:clusterDismissals` | `{ [tag]: { lastDismissedAt, dismissedCount, lastReasonSummary } }` | Keyed by FrictionSignal.tag. Retained indefinitely in MVP so Weekly Reflection step 4 can render "similar cluster dismissed N weeks ago" per `ARCHITECTURE.md §6.2` decision |
| `bamx:v1:agent-suggestions` | `{ [suggestionId]: AgentSuggestion }` | AI-layer output cache (see `AI_AGENTS.md` §3). Capped 500; evict oldest. Lifecycle: proposed → displayed → acted-on / dismissed / expired. |
| `bamx:v1:agent-telemetry` | `AgentTelemetryEvent[]` (capped 1000) | Append-only ring buffer logging every (input entities, output suggestion, user action) triple so KPI lift can be measured. See `AI_AGENTS.md` §3. |
| `bamx:v1:events-log` | `Event[]` (capped 1000) | Optional MVP ring buffer for debugging |

**Access pattern:**

```js
// PSEUDO — IRepository MVP impl
class LocalStorageRepository {
  read(key) { return JSON.parse(localStorage.getItem(key) || 'null'); }
  write(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
  upsert(mapKey, id, obj) {
    const map = this.read(mapKey) ?? {};
    map[id] = obj;
    this.write(mapKey, map);
  }
  appendOnly(mapKey, id, obj) {
    const map = this.read(mapKey) ?? {};
    if (map[id]) throw new Error('APPEND_ONLY_VIOLATION');
    map[id] = obj;
    this.write(mapKey, map);
  }
}
```

`appendOnly` is used for `variances` writes; any attempt to overwrite throws.

**Size budget:**
- Assume ~5 MB localStorage ceiling.
- Estimated footprint: 1 user · 90 days · ~10 scheduled activities/day · ~2 KB each ≈ 1.8 MB. Comfortable.
- Mitigation if approached: archive compositions older than 90 days to an export-able JSON blob under `bamx:v1:archive:<yyyymm>` and remove from hot keys.

### 7.2 Schema versioning & migration

- `bamx:v1:meta.schemaVersion` is checked on every app boot.
- Migration scripts live in `/js/persistence/migrations/` and are ordered by target version.
- Boot flow:

```
readMeta() → currentVersion
for each pending migration where migration.from == currentVersion:
    migration.run(repo) // pure function over repo
    update meta.schemaVersion = migration.to
if no pending migration → resume boot
```

- Migrations are **forward-only**. A `bamx:v1:backup:preMigrate:<timestamp>` snapshot of all keys is written before any destructive migration so users can export.
- Every migration must be deterministic and idempotent (re-runnable on partial failure).

**Port-compatibility rule (critical):** The MVP shapes above are the same shapes that port to PostgreSQL. No MVP-only denormalizations that would require a rewrite. In particular:
- Keyed maps in localStorage ↔ `SELECT * FROM t WHERE id IN (…)` in SQL. The transport differs; the entity shape does not.
- Every FK in SQL already exists as an ID field on the MVP object.
- No "embedded array of children" hacks on parent rows that prevent relational modeling.

### 7.3 Future state — PostgreSQL + API

**Table sketch** (1-to-1 with entity tables in §2):

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY, name TEXT, email TEXT UNIQUE,
  roles TEXT[], daily_capacity_minutes INT NOT NULL DEFAULT 480,
  work_days INT[] DEFAULT ARRAY[1,2,3,4,5],
  sprint_anchor_date DATE, timezone TEXT, created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE catalog_entries (
  id UUID PRIMARY KEY, activity_number INT, name TEXT NOT NULL,
  focus_area TEXT NOT NULL, default_duration_minutes INT NOT NULL,
  cadence TEXT NOT NULL, trigger TEXT, inputs JSONB, output_artifact JSONB,
  participants TEXT[], procedure JSONB, bucket TEXT,
  is_non_optional BOOLEAN NOT NULL DEFAULT FALSE,
  applies_to_roles TEXT[], version INT NOT NULL DEFAULT 1, source_ref TEXT
);

CREATE TABLE compositions (
  id UUID PRIMARY KEY, user_id UUID REFERENCES users(id),
  cycle_type TEXT NOT NULL CHECK (cycle_type IN ('DAILY','WEEKLY','SPRINT','MONTHLY')),
  start_at TIMESTAMPTZ NOT NULL, end_at TIMESTAMPTZ NOT NULL,
  parent_composition_id UUID REFERENCES compositions(id),
  state TEXT NOT NULL, proposed_at TIMESTAMPTZ, decided_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ, composer_inputs_snapshot JSONB, invariant_checks JSONB
);

CREATE TABLE scheduled_activities (
  id UUID PRIMARY KEY, composition_id UUID REFERENCES compositions(id),
  catalog_entry_id UUID REFERENCES catalog_entries(id),
  bucket TEXT NOT NULL, planned_start_at TIMESTAMPTZ,
  planned_duration_minutes INT NOT NULL,
  actual_start_at TIMESTAMPTZ, actual_end_at TIMESTAMPTZ,
  intention TEXT, state TEXT NOT NULL, output_artifact_ref JSONB,
  reflection_id UUID, linked_kaizen_id UUID,
  linked_dmaic_step_ref JSONB, reason_code_if_skipped TEXT,
  source_of_schedule TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE reflections (
  id UUID PRIMARY KEY, scheduled_activity_id UUID REFERENCES scheduled_activities(id),
  user_id UUID REFERENCES users(id), captured_at TIMESTAMPTZ NOT NULL,
  plan_vs_actual_minutes INT, what_went_well TEXT, what_to_improve TEXT,
  friction_flag BOOLEAN NOT NULL DEFAULT FALSE,
  friction_signal_id UUID, kind TEXT NOT NULL, dmaic_draft JSONB
);

CREATE TABLE variances (
  id UUID PRIMARY KEY, scheduled_activity_id UUID, composition_id UUID,
  catalog_entry_id UUID, user_id UUID REFERENCES users(id),
  kind TEXT NOT NULL, reason_code TEXT, note TEXT,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Enforce append-only at DB level:
REVOKE UPDATE, DELETE ON variances FROM app_user;

CREATE TABLE friction_signals (
  id UUID PRIMARY KEY, reflection_id UUID REFERENCES reflections(id),
  scheduled_activity_id UUID, user_id UUID REFERENCES users(id),
  summary TEXT NOT NULL, tag TEXT, status TEXT NOT NULL DEFAULT 'OPEN',
  kaizen_id UUID, captured_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE kaizens (
  id UUID PRIMARY KEY, user_id UUID REFERENCES users(id),
  title TEXT NOT NULL, problem_statement TEXT, goal_statement TEXT,
  source_friction_signal_ids UUID[], baseline_metric_id UUID,
  remeasurement_id UUID, actions JSONB, state TEXT NOT NULL,
  opened_at TIMESTAMPTZ, closed_at TIMESTAMPTZ, close_kind TEXT,
  results_narrative_ref JSONB,
  CONSTRAINT kaizen_close_requires_remeasurement
    CHECK (state <> 'CLOSED' OR remeasurement_id IS NOT NULL)
);

CREATE TABLE baseline_metrics (
  id UUID PRIMARY KEY, kaizen_id UUID REFERENCES kaizens(id),
  metric_definition JSONB NOT NULL, value NUMERIC NOT NULL,
  captured_at TIMESTAMPTZ NOT NULL, captured_sample_ref JSONB,
  locked BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE remeasurements (
  id UUID PRIMARY KEY, kaizen_id UUID REFERENCES kaizens(id),
  metric_definition_id TEXT NOT NULL, value NUMERIC NOT NULL,
  delta_absolute NUMERIC, delta_percent NUMERIC, beats_baseline BOOLEAN,
  captured_at TIMESTAMPTZ NOT NULL, evidence_ref JSONB
);

CREATE TABLE metrics_snapshots (
  id UUID PRIMARY KEY, user_id UUID REFERENCES users(id),
  window_start TIMESTAMPTZ, window_end TIMESTAMPTZ,
  adherence_percent NUMERIC, composition_acceptance_daily NUMERIC,
  composition_acceptance_weekly NUMERIC, reflection_rate_percent NUMERIC,
  active_kaizen_delta_percent NUMERIC, computed_at TIMESTAMPTZ DEFAULT now()
);
```

**Hard constraints enforced in DB:**
- `CHECK (state <> 'CLOSED' OR remeasurement_id IS NOT NULL)` on `kaizens` — **the remeasurement-at-close HARD RULE, enforced at storage**.
- `REVOKE UPDATE, DELETE ON variances` — variance append-only at storage.
- `CHECK (is_non_optional = FALSE OR enabled_by_user = TRUE)` (conceptual) — user toggle ignored for non-optional entries.
- Application-layer invariant: Daily composition 4-2-2 shape (too complex for a DB CHECK; lives in `InvariantEngine`).

### 7.4 API boundary (Next)

REST, one resource per entity. Contracts mirror entity shapes exactly (no separate "DTO" layer; domain model is the wire format, validated by Zod server-side).

| Route | Method | Purpose |
|---|---|---|
| `/api/catalog` | GET | List enabled catalog entries for user |
| `/api/catalog/:id` | PATCH | Toggle `enabledByUser` (non-optional rejected at storage) |
| `/api/compositions` | POST | Ask composer to propose a cycle |
| `/api/compositions/:id/accept` | POST | Transition PROPOSED → ACCEPTED |
| `/api/compositions/:id/edit` | PATCH | Edit activities before acceptance |
| `/api/activities/:id/start` | POST | SCHEDULED → IN_PROGRESS |
| `/api/activities/:id/close` | POST | IN_PROGRESS → CLOSED; body carries `outputArtifactRef` and `reflection` |
| `/api/activities/:id/skip` | POST | Non-optional skip with `reasonCode`; emits Variance |
| `/api/kaizens` | POST | Promote from friction signal cluster |
| `/api/kaizens/:id/lock-baseline` | POST | Transition DRAFT → ACTIVE |
| `/api/kaizens/:id/remeasure` | POST | Capture remeasurement |
| `/api/kaizens/:id/close` | POST | Transition to CLOSED (rejected without remeasurement) |
| `/api/metrics/snapshot` | GET | Current rolling window snapshot |

### 7.5 Sync strategy (Next)

- **Optimistic client, authoritative server.** Client writes to its local cache (IndexedDB in Next, not localStorage) immediately; POSTs to server; reconciles on response.
- **Conflict resolution:** last-writer-wins for Reflection text and Intention fields; server-authoritative for state-machine transitions (client cannot force an illegal transition).
- **Offline support:** MVP is offline-native by design (localStorage). Next: IndexedDB + mutation queue; flush on reconnect.
- **Team sync (Next+):** compositions and reflections are user-scoped; team rollup views are computed server-side from the per-user rows; no cross-user write is required for MVP or Next.

### 7.6 Backup / export

- MVP: `exportData()` returns a single JSON blob covering all `bamx:v1:*` keys; `importData(blob)` replaces all keys (after backup snapshot). This is the user's only backup in MVP.
- Next: server-side nightly logical backup; user-triggered export endpoint returns the same JSON shape so MVP exports import cleanly into the server.

---

## 8. Appendix — Invariant Cross-Reference

| Blueprint / Gap rule | Enforced where | Entity / state |
|---|---|---|
| Daily 4-2-2 shape | `InvariantEngine.validateComposition()`, app-layer | `Composition.state ∈ {ACCEPTED, ACTIVE, CLOSED}` |
| Non-optional set present in Daily | `InvariantEngine.validateComposition()` | same |
| Non-optional catalog entry not deletable | `CatalogService.delete()` rejects | `CatalogEntry.isNonOptional === true` |
| Every completion produces required output artifact | `ActivityService.close()` guard | `ScheduledActivity.state === 'CLOSED'` |
| Reflection row exists on non-optional close | `ActivityService.close()` + `ReflectionService` auto-stubs `pending=true` | `Reflection` |
| Reflection-rate KPI counts only captured on-time | `MetricsService` (filter: `pending=false AND captured within 15 min`) | `Reflection`, `MetricsSnapshot` |
| Variance append-only | `LocalStorageRepository.appendOnly()` (MVP); `REVOKE UPDATE, DELETE` (future) | `Variance` |
| Skipped non-optional emits Variance | `ActivityService.skip()` atomic emit | `Variance.kind = SKIPPED_NON_OPTIONAL` |
| `reasonCode = OTHER` requires `note` | `VarianceService.log()` guard + `ActivityService.skip()` guard; future Postgres `CHECK` | `Variance`, `ScheduledActivity` |
| DMAIC DAG: `dependsOn` cycle-free + eligibility | `CatalogService` validates on seed/edit; `ComposerService.eligibleDmaicPayloadSteps()` enforces at payload selection | `CatalogEntry`, `ScheduledActivity` |
| PDCA tick requires parent experiment | `ActivityService.start()` guard when catalog #12 and open experiment exists | `PdcaExperiment`, `ScheduledActivity` |
| PDCA graduation requires 3 consecutive target hits | `PdcaService.tick()` guard | `PdcaExperiment.state === 'CLOSED'` with `closedReason='GRADUATED'` |
| Composer never silently truncates | `ComposerService` returns `InfeasibleResult` (§4.7) when non-optionals exceed capacity | `Composition`, `ComposerInfeasible` event |
| Kaizen close requires remeasurement | `KaizenService.close()` guard (MVP); DB `CHECK` (future) | `Kaizen.state === 'CLOSED'` |
| Single active Kaizen per user (MVP) | `KaizenService.promote()` guard | `Kaizen.state ∈ {ACTIVE, IN_REMEASUREMENT}` |
| Baseline locked | `BaselineMetric.locked === true` | `BaselineMetric` |
| Over-capacity prevention | `InvariantEngine.validateComposition()` | `Composition` |
| Composer output inspectable | `Composition.composerInputsSnapshot` frozen | `Composition.state === 'PROPOSED'` |
| 30-Day Accelerator phase advance requires prior-phase guard conditions | `KaizenService.advancePhase()` / `canAdvancePhase()` | `Kaizen.phase` transition for `projectType === 'KAIZEN_ACCELERATOR_30D'` |
| 30-Day Accelerator close requires ROI captured | `KaizenService.close()` for `projectType === 'KAIZEN_ACCELERATOR_30D'` | `Kaizen.state === 'CLOSED'` with `roi !== null` AND `controlPlanArtifactRef !== null` |
| Catalog entry project/phase binding enforces composer eligibility | `ComposerService.eligibleDmaicPayloadSteps()` extended | `CatalogEntry.projectTypeBinding` + `phaseBinding` matched against active `Kaizen.projectType` + `Kaizen.phase` |
| Accelerator PHASE_3 → PHASE_4 weighted guard: ≥80% actions closed AND no open strategic items | `KaizenService.canAdvancePhase()` | `Kaizen.phase` transition; `Kaizen.actions[].strategic === true` veto |
| Accelerator Control Plan drafted at Phase 2 exit | `KaizenService.canAdvancePhase('PHASE_3')` | `Kaizen.controlPlanDraftArtifactRef !== null` at PHASE_2 → PHASE_3 |
| Kaizen 90 close requires Sustainment Gate pass | `KaizenService.close()` + `KaizenService.startRemeasurement()` for `projectType === 'KAIZEN_EVENT_90D'` | `Kaizen.sustainmentGatePassed === true` before `ACTIVE → IN_REMEASUREMENT` and at CLOSED; ≥80% adoption for 2 consecutive working weeks before rebaseline attempted |
| Kaizen 90 close requires ROI + Control Plan + Remeasurement | `KaizenService.close()` for `projectType === 'KAIZEN_EVENT_90D'` | `Kaizen.state === 'CLOSED'` with `roi !== null` AND `controlPlanArtifactRef !== null` AND `remeasurementId !== null` AND `sustainmentGatePassed === true` |
| Kaizen 90 requires Implementation Lead assigned at create | `KaizenService.promote()` for `projectType === 'KAIZEN_EVENT_90D'` | `Kaizen.implementationLeadUserId !== null` AND user has `IMPLEMENTATION_LEAD` role AND user distinct from Facilitator / Process Owner |
| DMAIC Baseline (`#28`) requires MSA (`#31`) closed with acceptable Gage R&R / Kappa | `ActivityService.close()` via `CatalogEntry.dependsOn` DAG edge `#28 → [#31]` + MSA acceptance check | `ScheduledActivity` for `#28` cannot reach CLOSED until MSA artifact's `acceptanceRating` ∈ `{'ACCEPTABLE', 'MARGINAL_ACCEPTABLE'}` |
| DMAIC Analyze → Improve requires validated root cause with confound check | `KaizenService.canAdvanceDmaicPhase()` + `ComposerService.eligibleDmaicPayloadSteps()` | `Kaizen.validatedRootCauseArtifactRef !== null AND confoundCheckPassed === true` before Improve-phase entries become eligible |
| DMAIC close requires two-pass Financial Benefit Translator | `KaizenService.close()` for `projectType === 'DMAIC'` | `Kaizen.state === 'CLOSED'` with `roiPassNumber === 2` AND `roiProjections.length === 2` |
| Finance partner co-sign required when ROI fields populated | `KaizenService.applyRoiArtifact()` | Any Kaizen with non-null `implementationCostDollars` or `annualBenefitsDollars` → at least one co-signer with `FINANCE_PARTNER` role recorded |
| Sustainment check-ins append-only after due date | `KaizenService.recordSustainmentCheckIn()` | `Kaizen.sustainmentCheckIns[]` — missed entries remain with `completedAt === null, adherenceOk === false` |
| Scope changes informational/audit-only, do not auto-pause | `KaizenService.appendScopeChange()` | `Kaizen.scopeChanges[]` append-only log; `ScopeChangeRequested` event emitted |

---

## 9. Architectural Decisions Log (formerly open questions)

All open questions from draft v0.1 resolved by coordinator on 2026-04-18.

1. **Team-mode collision in MVP — RESOLVED.** Team ceremonies (Daily Standup, Sprint Planning, Mid-Sprint Review, Sprint Review, Sprint Retrospective, Quarterly Planning) ship in MVP as solo blocks on the individual's calendar. Placeholder participant list. Output artifacts still required (standup notes, retro two-list, review narrative) per `CatalogEntry.outputArtifact.schema`. True multi-participant team mode (shared Sprint Backlog, team adherence rollup) ships in Next. See `CATALOG_GAPS.md §H.3`.

2. **Catalog-entry bucket assignment — RESOLVED.** See `CATALOG_GAPS.md §H` for the approved mapping. `CatalogEntry.bucket` is seeded from that mapping; frozen on `ScheduledActivity.bucket` at schedule time.

3. **External-calendar capacity in MVP — RESOLVED.** Ship a manual `externalMinutesToday` numeric input on the Daily composer; subtracts from COMMUNICATION target before packing. See §5.5 for details. Auto-import deferred to Next.

4. **Reflection required-vs-captured — RESOLVED.** Auto-stub a `Reflection` row with `pending=true` at activity close for non-optional activities. The invariant "CLOSED non-optional has a Reflection row" remains. The reflection-rate KPI counts only `pending=false AND on-time`. See §2.6.

5. **reasonCode=OTHER free-text requirement — RESOLVED.** `reasonCode === 'OTHER'` requires a non-empty `note`. Enforced at `VarianceService.log()` and `ActivityService.skip()`; future Postgres `CHECK` constraint. See §2.5, §2.7.

6. **Start-on-time leading indicator — RESOLVED.** Added `ActivityStartedLate` event (emitted when `now - plannedStartAt > 5 min` at start). MetricsService subscribes; feeds the blueprint §7.3 leading indicator.

7. **MetricsService snapshot read path — RESOLVED.** Added `getLatestSnapshot(userId)` to the interface explicitly. MVP reads from `bamx:v1:metrics` keyed by `latestFor:<userId>`; future reads from `metrics_snapshots` table with index on `(user_id, computed_at DESC)`.

8. **Kaizen "ready to remeasure" indicator — RESOLVED.** Computed property on `Kaizen` (not a stored state). See §2.9. Surfaced on `KaizenCard`. Does not block close; does not block further action edits.

9. **Friction signal dismiss-loop — RESOLVED.** `FrictionSignal.status=DISMISSED` is terminal. `KaizenCandidateQueue` retains dismissed-cluster history per tag (persisted as `bamx:v1:clusterDismissals` — see §7.1); when a re-surfacing cluster in a new Weekly Reflection has the same tag as a previously dismissed cluster, `WeeklyReflectionWizard` step 4 shows "similar cluster dismissed N weeks ago" as a hint. Not a block; user can still dismiss or promote. No new state or FSM edge.

10. **Reflection naming canonicalization — RESOLVED.** The generic catalog entry that closes every day is canonically **"End-of-Activity Reflection"** (matching `CATALOG_GAPS.md §H.2`). The older "End-of-day Reflection (meta)" label in §4 pseudo-code was aligned to the canonical name. No functional change.

11. **PdcaExperiment entity — RESOLVED.** Added as new entity §2.13. A PDCA experiment is the parent hypothesis binding 48-hour catalog #12 ticks. State machine: PLAN → DO → CHECK → ACT, with graduation (3 consecutive target-met ticks), abandonment, or promotion-to-Kaizen as terminal paths. MVP cap: one open experiment per user. Events: `PdcaExperimentOpened`, `PdcaTickCommitted`, `PdcaExperimentClosed`. Persistence key: `bamx:v1:pdca`.

12. **DMAIC payload ordering — RESOLVED.** Not a strict numeric walk through #20 → #41. `CatalogEntry.dependsOn: string[]` declares the DAG (e.g., C&E Matrix #34 depends on SIPOC #21 and Detailed Process Maps #32). The composer's eligibility check (R9 in §4.5) accepts any entry whose `dependsOn` is satisfied within the same Kaizen scope. Multiple eligible entries may fill different Deep blocks across the same sprint in parallel (async tasks OK). Priority within the eligible set: (phase match, then `dependsOn`-satisfied-most-recently, then catalog order as final stable tiebreak).

13. **INFEASIBLE guided resolution flow — RESOLVED.** Added §4.7. Composer returns a structured `InfeasibleResult` with `shortfallMinutes`, `bucketShortfalls`, and `suggestedActions` (RAISE_CAPACITY, REDUCE_EXTERNAL, SKIP_CEREMONY_WITH_REASON, DEFER_NON_OPTIONAL_TO_NEXT_DAY). UI renders guided remediation actions in order. Every action produces a new proposal or a logged variance; no silent fallback. New event: `ComposerInfeasible`.

14. **Deep slicing preference (`2×2h` vs `4×1h`) — COORDINATOR DEFAULT (revisit if needed).** Persisted as `User.deepSlicePreference: '2x2h' | '4x1h'`, default `'2x2h'`. Overridable per `Composition` via Edit mode (not a stored per-composition field in MVP — the user just rearranges blocks). Revisit at first-user feedback; if the preference changes frequently, promote to per-composition.

15. **30-Day Kaizen Accelerator pulled into MVP — RESOLVED (Phil, 2026-04-19).** Adds ~5–8 engineering days to the MVP plan; timeline stretches from ~75 to ~100 project days. Accelerator is modeled as a Kaizen with `projectType='KAIZEN_ACCELERATOR_30D'`, preserving the MVP 1-active-Kaizen cap. Phase 2 (virtual Kaizen Event) preserves 4-2-2 — no per-day invariant override; users schedule multi-hour Deep sessions via normal composer Edit across Phase 2 days. Pace warnings compute on `User.workDays` intersected with elapsed calendar days; no holiday model in MVP. Authoritative spec: `PROJECT_TYPE_30D_KAIZEN.md`. The 31 new catalog entries need procedure-text authored by Phil / Black-Belt partner before E13-T1 begins (see `CATALOG_GAPS.md §I.2` and `DELIVERY_PLAN.md §5 R13`).

16. **`KAIZEN_EVENT_90D` added as distinct projectType — RESOLVED.** Per `KAIZEN_EVENT_STANDARD.md §11.1` Option B recommendation. Distinct from `KAIZEN_EVENT` (which remains the 1–5 day standalone burst). Rationale: Option B preserves all current invariants and costs only one enum value + service-routing branches, vs. Option A which would have inverted "KAIZEN_EVENT has no phase" invariant and required data migration. Catalog `#42`–`#50` bind to both `KAIZEN_EVENT` and `KAIZEN_EVENT_90D` via set-valued `projectTypeBinding` (see `CATALOG_GAPS.md §K`). Phases: `PRE_EVENT / EVENT / POST_EVENT / SUSTAIN` per `KAIZEN_EVENT_STANDARD §2`. Authoritative spec: `KAIZEN_EVENT_STANDARD.md`.

17. **Phase support extended to `KAIZEN_EVENT_90D` — RESOLVED.** `Kaizen.phase` and `Kaizen.phaseDefinitions` now non-null for BOTH `KAIZEN_ACCELERATOR_30D` and `KAIZEN_EVENT_90D`; the two have different phase structures. §3.4 retitled and a §3.4.1 Phase FSM for Kaizen 90 added with 4 phases. Phase names come from the per-Kaizen `phaseDefinitions` snapshot, not hard-coded constants — enables future phased project types without further refactoring. Per `KAIZEN_EVENT_STANDARD §11.5` item 1.

18. **`sustainmentCheckIns[]` + `sustainmentGatePassed` fields added to Kaizen — RESOLVED.** `sustainmentCheckIns[]` is auto-seeded on CLOSED for DMAIC, Accelerator, and Kaizen 90 with `closeKind ∈ {SUCCESS, PARTIAL}`; holds the Day 30/60/90 post-close check-in rows with adherence observation + notes. Append-only once due date passes. `sustainmentGatePassed` is a Kaizen-90-specific boolean set by Facilitator attestation; required true for `ACTIVE → IN_REMEASUREMENT`. Per `DMAIC_STANDARD §11.2` item 3 + `ACCELERATOR_STANDARD §10.2` item 8 + `KAIZEN_EVENT_STANDARD §11.5` item 8. Resolves the prior Accelerator flag about "no post-CLOSED sustainment state" (`ACCELERATOR_STANDARD §10.3`) without introducing a new FSM state — check-ins live as an append-only list on the CLOSED Kaizen record.

19. **`AcceleratorPaceWarning` renamed to `ProjectPaceWarning` — RESOLVED (breaking event rename).** Payload adds a `projectType` discriminator; applies to both Accelerator and Kaizen 90 pacing. Kaizen 90 `kind` may include `'SPRINT_VELOCITY_UNDER_60'` when a POST_EVENT weekly sprint retrospective shows velocity < 60%. Downstream code in `js/events/events.js` and any subscriber must rename the constant from `AcceleratorPaceWarning` to `ProjectPaceWarning`. Per `KAIZEN_EVENT_STANDARD §11.5` item 7.

20. **`ScopeChangeRequested` event + `Kaizen.scopeChanges[]` field added — RESOLVED.** Scope changes on any project type (Accelerator, DMAIC, Kaizen 90) now have an explicit audit path: a user fires the scope-change form on KaizenCard; the event is logged; the entry is appended to `Kaizen.scopeChanges[]`. **Informational only** — does NOT auto-pause the Kaizen. Abandonment (Kaizen → DRAFT with `abandoned=true`) remains the only path to halt a project. Per `ACCELERATOR_STANDARD §1.6` refinement #4. Prevents "scope rotation happens silently" — a named failure mode in `ACCELERATOR_STANDARD §1.7` item 1 and `DMAIC_STANDARD §1.7` item 3.

21. **Finance-partner + Implementation-Lead roles formalized, two-pass ROI + MSA-before-Baseline + validated-root-cause + weighted-Phase-3→4 + Control-Plan-at-Phase-2 invariants added — RESOLVED.** A block of refinements from `ACCELERATOR_STANDARD §1.6` (#1, #2, #5), `DMAIC_STANDARD §1.5` (#1, #2, #3, #4) + §1.6 CSF #5, and `KAIZEN_EVENT_STANDARD §1`. New Kaizen fields: `roiPassNumber`, `roiProjections[]`, `validatedRootCauseArtifactRef`, `controlPlanDraftArtifactRef`, `implementationLeadUserId`. New invariants enforce Finance co-sign when ROI fields populated; two-pass Financial Benefit Translator for DMAIC (pass 1 projected at Improve, pass 2 actual at Control with reconciliation delta); MSA acceptance gate before Baseline close (DAG edge in `CATALOG_GAPS §J`); validated-root-cause-with-confound-check before DMAIC Analyze → Improve; weighted Phase 3→4 strategic-item veto for Accelerator; Control Plan drafted by Phase 2 exit (signed at Phase 4) for Accelerator. Canonical role set documented on `User.role[]`. All invariants name their enforcement service method (see §8 invariant cross-reference).

22. **Cross-doc effort summary — RESOLVED.** Applying the 26 coordinator-mandated refinements adds five new epics (E14–E18) worth ~35 engineer-days to the delivery plan (`DELIVERY_PLAN §3.1` updated): E14 Validated Kaizen Portfolio (5d, MVP), E15 Statistical Analysis Surfaces (10d, post-launch with DMAIC), E16 MSA Workflow (5d, post-launch with DMAIC), E17 Kaizen 90 Phase Support (5d, with Kaizen 90 activation), E18 Implementation Backlog Tracker (10d, MVP). Timeline extends from ~100 to ~135 project days; Window 4 of the 30-60-90 plan becomes Windows 4–5 of a 30-60-90-120-150 plan. See `DELIVERY_PLAN §3` for the new window breakdown.

23. **`Kaizen.targetCloseDate` field + AD_HOC pace-warning emitter — RESOLVED.** AD_HOC projects have no phase structure, so `ProjectPaceWarning` needs an explicit comparison anchor. Added `Kaizen.targetCloseDate: date | null` — required non-null at create for `projectType='AD_HOC'`. `ProjectPaceWarning` event payload (see §6.1) now documents four emitter paths: phase-based for Accelerator + Kaizen 90, `targetCloseDate`-based for AD_HOC (fires with `kind='AD_HOC_OVERRUN'` when `now > targetCloseDate`), and no automatic warning for DMAIC or standalone 1–5 day Kaizen Event. Per `ADHOC_PDCA_STANDARD §1.A.7` refinement #1.

24. **Lessons Learned required at CLOSED (all project types) — RESOLVED.** Rather than add a dedicated `lessonsLearnedArtifactRef` field on Kaizen, enforce learning capture via the existing CLOSED-ScheduledActivity pattern: a generic `CatalogEntry.name='Lessons Learned'` (CI bucket, 30–60 min) is seeded in `CATALOG_GAPS §H.2` as a 5th generic entry. `KaizenService.close()` now refuses close unless a CLOSED `ScheduledActivity` of this catalog entry with matching `linkedKaizenId` and non-null `outputArtifactRef` exists. Applies across every `projectType` and every `closeKind` — including `FAILED_HONEST`, where learning capture is most valuable. Cleaner than a new Kaizen field because it reuses existing invariant machinery. Per `ADHOC_PDCA_STANDARD §10` refinement #2.

25. **`Kaizen.sourcePdcaExperimentId` field — RESOLVED.** Added as FK to `PdcaExperiment`. Set when a Kaizen is promoted from a closed PDCA experiment via `PdcaExperiment.closedReason='SUPERSEDED_BY_KAIZEN'`. Distinct from `sourceFrictionSignalIds[]` (friction-signal lineage) — a Kaizen may have neither, one, or both. Prevents the semantic muddle of conflating PDCA-promotion lineage with friction-signal-cluster lineage. Per `ADHOC_PDCA_STANDARD §10` refinement #3.

26. **PDCA tick-10 mandatory review documented — RESOLVED.** A running PDCA experiment that reaches `tickActivityIds.length >= 10` without `PdcaExperimentClosed` firing is drifting. No new event is added — the Reflection agent (`AI_AGENTS.md` §2 Agent 4) subscribes to `PdcaTickCommitted` and on the 10th tick emits a mandatory-review suggestion on the user's next Cadence Day: graduate, abandon, promote-to-Kaizen, or continue with a revised hypothesis. Not a hard block; user may tick to 11+ after explicit acknowledgment logged via `AgentTelemetryEvent.userAction='ACKNOWLEDGED'` with `reviewDecision` field. Prevents abandonment drift — a named PDCA failure mode in `ADHOC_PDCA_STANDARD §8.B`.
