# BAM-X Kaizen OS — System Architecture

Owner: System Architect Agent
Status: Draft v0.3 — grounded in `PRODUCT_BLUEPRINT.md` v0.2 and `CATALOG_GAPS.md` v0.1. v0.3 closes 3 engine-flagged gaps (reflection naming canonicalization, `PdcaExperiment` entity added, `clusterDismissals` persistence key added) and resolves 3 prior engine questions (DMAIC payload = `CatalogEntry.dependsOn` DAG with async parallelism, INFEASIBLE guided resolution flow with `InfeasibleResult` shape, deep slicing preference on User). v0.2 closed 5 UX-flagged gaps (pending reflection, reason-code OTHER, ActivityStartedLate event, MetricsService.getLatestSnapshot, Kaizen readyToRemeasure computed property) and resolved 3 earlier open questions (team ceremonies single-user, catalog bucket mapping, external calendar capacity in MVP).
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
| `focusArea` | enum | `DEEP_WORK` \| `COMMUNICATION` \| `CONTINUOUS_IMPROVEMENT` \| `CEREMONY` \| `DMAIC` \| `KAIZEN` \| `INNOVATION` |
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

**Invariants:**
- `isNonOptional === true` → `enabledByUser` is ignored (always enabled), delete rejected.
- `outputArtifact.required === true` for every Catalog Entry (blueprint: every completion produces evidence).
- `bucket === 'PROJECT' | 'COMMUNICATION' | 'CI'` must be set for any entry the Daily composer may schedule.
- `dependsOn` is a DAG — no cycles. Validated at seed and at any catalog edit. A DMAIC step is eligible as payload iff every `dependsOn` entry has a `CLOSED` ScheduledActivity within the **same** `Kaizen.id` scope.

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
| `role` | string[] | Current active BAM roles |
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
| `actions` | object[] | `[{ name, ownerRef, dueDate, doneAt\|null }]` |
| `state` | enum | See FSM in §3.3 |
| `openedAt` | timestamp | |
| `closedAt` | timestamp \| null | |
| `closeKind` | enum \| null | `SUCCESS` (hit goal) \| `PARTIAL` (improved < goal) \| `FAILED_HONEST` (no improvement — blueprint §7.2) |
| `resultsNarrativeRef` | object \| null | For catalog #49 — 3-pager narrative artifact |

**Invariants:**
- `state === 'CLOSED'` → `remeasurementId !== null` AND `remeasurement.metricDefinitionId === baseline.metricDefinitionId` (blueprint HARD RULE).
- MVP: at most one Kaizen with `state IN ('ACTIVE','IN_REMEASUREMENT')` per user.
- `actions[].doneAt === null` does **not** block close; **only** the remeasurement does (so honest-failure close is possible).

**Computed properties (derived, not stored):**
- `readyToRemeasure: boolean` = `state === 'ACTIVE' AND actions.length > 0 AND actions.every(a => a.doneAt !== null)`. Surfaced on `KaizenCard` as "Ready to remeasure." Not a state — the user can start remeasurement at any time during `ACTIVE`; this is just a visibility hint.

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
- `IN_REMEASUREMENT → CLOSED` requires `remeasurementId !== null` AND `remeasurement.metricDefinitionId === baseline.metricDefinitionId`. This is the **HARD RULE** (blueprint §4.1 item 4, §7.2): no remeasurement → no close. A Kaizen cannot be "failed-and-closed" without measuring; it can only be abandoned, which is modeled by transitioning back to `DRAFT` with an `abandoned: true` flag, never to `CLOSED`.
- MVP cap: system rejects a second transition to `ACTIVE` while another is not terminal.

### 3.4 Variance (no FSM — append-only)

`Variance` has no state transitions. It is always born in terminal state. Corrections are new rows.

### 3.5 FrictionSignal FSM

```
   OPEN ──► CLUSTERED ──► PROMOTED_TO_KAIZEN   (immutable after promote)
    │
    └──► DISMISSED                              (terminal)
```

### 3.6 Where each transition is triggered

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
