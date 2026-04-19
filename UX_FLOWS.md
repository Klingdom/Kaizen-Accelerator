# BAM-X Kaizen OS — UX Flows

Owner: UX Designer Agent
Status: Draft v0.2.1 — grounded in `PRODUCT_BLUEPRINT.md` v0.2, `ARCHITECTURE.md` v0.3.1, `CATALOG_GAPS.md` v0.1 §H. v0.2.1 adds the AI-layer "why chip" on `ScheduledActivityBlock` (§3.3) for Composer Explainer microcopy, and introduces `ArtifactPreview` (§3.11) for Context agent output. v0.2 resolved all v0.1 open questions and architecture gaps.
Scope: MVP (Daily + Weekly cycles only). Sprint, Monthly, and Team rollup surfaces are placeholder-only per blueprint §4.1.

> This is a behavior spec, not a visual spec. It names screens, data bindings, and interaction rules. Visual design happens in build. Entities and states referenced by name are the ones defined in `ARCHITECTURE.md` §2–§3.

---

## 1. Information Architecture

### 1.1 Top-level navigation (MVP)

Five top-level surfaces are visible on login. The left nav (or top tab bar) renders exactly these five entries in this order. Nothing else is promoted to the top level in MVP.

| # | Route | Surface name | Primary entity | Read / write |
|---|---|---|---|---|
| 1 | `/today` | Today | `Composition(DAILY, state=ACTIVE)` | Read-write |
| 2 | `/week` | This Week | `Composition(WEEKLY, state ∈ {PROPOSED, ACCEPTED, ACTIVE, CLOSED})` | Read-write |
| 3 | `/catalog` | Catalog | `CatalogEntry[]` | Read-write (toggle `enabledByUser` only; non-optional locked) |
| 4 | `/kaizen` | Kaizen | `Kaizen(state ≠ DRAFT-abandoned)` | Read-write |
| 5 | `/insights` | Insights | `MetricsSnapshot`, `Variance[]`, `FrictionSignal[]` | Read-only |

### 1.2 Full route tree

```
/today                                       [read-write]  default landing page
  ├── /today/activity/:id                    [read-write]  ScheduledActivity runner (start / work / close)
  ├── /today/activity/:id/reflect            [read-write]  60s ReflectionSheet (modal overlay)
  └── /today/activity/:id/skip               [read-write]  reason-code picker (modal overlay)

/week                                        [read-write]  Weekly composition view, 5 daily columns
  ├── /week/compose                          [read-write]  Weekly composer Accept / Edit / Reject
  ├── /week/reflect                          [read-write]  20-min Weekly Reflection wizard (Fri)
  └── /week/day/:isoDate/compose             [read-write]  Daily composer Accept / Edit / Reject

/catalog                                     [read-write]  browse + enable/disable catalog entries
  ├── /catalog/:id                           [read-only]   single entry detail (procedure, inputs, output schema)
  └── /catalog/gaps                          [read-only]   flags catalog rows the user has not seeded yet

/kaizen                                      [read-write]  single active Kaizen (MVP cap = 1)
  ├── /kaizen/candidates                     [read-write]  FrictionSignal queue, only surfaced via Weekly Reflection
  ├── /kaizen/:id                            [read-write]  KaizenCard detail
  ├── /kaizen/:id/baseline                   [read-write]  BaselineMetric capture (locks on save)
  ├── /kaizen/:id/remeasure                  [read-write]  Remeasurement capture (unlocks Close)
  └── /kaizen/:id/close                      [read-write]  final close step (refused without remeasurement)

/insights                                    [read-only]   the three KPIs + variance / friction lists
  ├── /insights/variance                     [read-only]   append-only log viewer
  └── /insights/friction                     [read-only]   captured signals (pre-promotion)

/settings                                    [read-write]  role, capacity, sprint anchor date
```

### 1.3 Hidden until Next (placeholders only in MVP)

These routes exist as disabled nav items with the label "Ships in Next":

- `/sprint` — Sprint composer (2-week cycle with sprint-phase FSM)
- `/month` — Monthly composer (two sprints + quarterly anchor)
- `/team` — Team rollup view for Facilitator / Leader
- `/catalog/editor` — Champion-level catalog editor
- `/integrations` — Google / MS Calendar, Slack / Teams

A user tapping any of these sees a one-line explanation ("Ships in Next. Until then, place Sprint Planning manually on the Weekly view.") and no other content.

### 1.4 Navigation rules

- Today is the default post-login route. If no `ACTIVE` Daily composition exists, Today shows a CycleCard in `PROPOSED` state with Accept / Edit / Reject.
- This Week shows five Daily columns (Mon–Fri by default, from `User.workDays`). The current day is always highlighted and scrollable into view.
- Kaizen top-level entry badges a "1" when a Kaizen exists in `IN_REMEASUREMENT` and is waiting on the user to capture the remeasurement. No other badges in MVP.
- Insights is read-only. Any click that would edit data (e.g., "dismiss variance") is disabled with inline message: "Variance log is append-only. Add a correction instead."

---

## 2. Key User Flows

Five flows. Three are the load-bearing rituals called out in the blueprint handoff (2.1, 2.2, 2.3). Two additional flows cover Kaizen close and variance logging (2.4, 2.5).

### 2.1 Start-of-day: Accept / Edit / Reject a proposed Daily cycle

**Precondition:** `ComposerService` has produced a `Composition` with `cycleType=DAILY`, `state=PROPOSED`, containing all non-optional `ScheduledActivity` rows in `state=PROPOSED`. The composer ran either (a) overnight for today or (b) on-demand when the user opened Today before 9:00 local and no proposal existed.

| Step | View | What the user sees | User input | System does | Next |
|---|---|---|---|---|---|
| 1 | `/today` | CycleCard for today in `PROPOSED` state. Header: "Tomorrow's day, composed." Below: BucketStrip showing PROJECT 240 / COMMUNICATION 120 / CI 120. Below: 8–10 ScheduledActivityBlocks in plan order (Daily Standup 9:00, AM High-value Comm 9:15, Deep block 10:15, lunch, Deep block, Post-lunch High-value Comm, CI block, End-of-day Reflection). Each block shows name + bucket color + planned minutes. Three buttons at bottom: **Accept**, **Edit**, **Reject**. | — | Reads `Composition` + children from repo. Runs `InvariantEngine.validateComposition()`; if any failure, shows it inline above the Accept button and disables Accept. | Step 2a / 2b / 2c. |
| 2a | `/today` | (If user taps **Accept**) | Tap Accept. | Transitions `Composition.state: PROPOSED → ACCEPTED`. All child `ScheduledActivity` rows flip `PROPOSED → SCHEDULED`. Emits `CycleAccepted { compositionId, edited: false }`. If `now >= startAt`, also emits `CompositionStarted` and flips to `ACTIVE`. | Redirect to `/today` showing the accepted day with the first block ready to start. |
| 2b | `/week/day/:isoDate/compose` | (If user taps **Edit**) Full-screen composer. Same CycleCard, now with drag-handles on each ScheduledActivityBlock. A right-rail CatalogPicker appears, filtered to "enabled CatalogEntries for my role, grouped by bucket." Non-optional blocks are marked with a small lock icon and cannot be removed (but can be re-ordered within their bucket). BucketStrip updates live as the user drags. A persistent banner shows "4-2-2 invariant: PROJECT 240 ok / COMMUNICATION 120 ok / CI 120 ok" — turns red if a drop would violate. | Drag to reorder a block; drag across bucket boundary to re-bucket (only allowed on configurable blocks); tap a configurable block's "Replace" button and choose a different CatalogEntry from the picker; tap "Save". | On each drag: runs invariant validation and updates BucketStrip. On save: transitions `Composition.state: PROPOSED → ACCEPTED` with `edited=true`; marks edited children with `sourceOfSchedule=USER_EDIT`. Emits `CycleEdited { compositionId, editedActivityIds }` and `CycleAccepted { edited: true }`. Emits a `Variance { kind: EDITED_FROM_PROPOSAL }` row per edited child (append-only). | Redirect to `/today`. |
| 2c | `/today` | (If user taps **Reject**) A confirmation prompt: "Reject today's proposal? You'll need to build a day manually or wait for tomorrow." | Confirm + optional short reason. | Transitions `Composition.state: PROPOSED → REJECTED`. Emits `CycleRejected { compositionId, reason }`. | `/today` now shows empty state: "No day scheduled. Compose again or add activities manually from the Catalog." Two buttons: "Compose again" / "Add from Catalog". |
| 3 | `/today` | If Accepted / Edited: the day is now live. First block (Daily Standup) is at the top with a **Start** button. | — | — | Flow 2.2 begins when the user taps Start on any block. |

**Empty state:** If the composer has not run yet, CycleCard shows: "Composing your day…" with a cancel link. If the composer fails with `INFEASIBLE` (rare — e.g., capacity is below 4h and non-optional set exceeds it), CycleCard shows: "Can't compose a valid day at your current capacity. Open Settings to adjust capacity, or Reject and build manually."

**Error state:** If `validateComposition` fails after user edits, save is blocked. The violated rule is shown inline above the Save button with specific text — see §4 for exact message forms.

### 2.2 Execute a scheduled activity (start → work → close → output artifact → 60s reflection)

**Precondition:** `ScheduledActivity.state=SCHEDULED`, clock is at or past its `plannedStartAt`.

| Step | View | What the user sees | User input | System does | Next |
|---|---|---|---|---|---|
| 1 | `/today` | The next-up ScheduledActivityBlock is pinned at the top. Shows: name ("PDCA Cycle"), bucket chip ("CI"), planned duration ("30 min"), IntentionField (empty, placeholder: "One line: what outcome by close?"). Below: a **Start** button. Below the block: the rest of the day as a vertical list. | Types one-line intention ("Ship the variance-queue experiment tick"). Taps **Start**. | Validates intention not empty (intention is required for non-optional activities and strongly recommended for configurables — soft warning on configurable if empty). Transitions `ScheduledActivity.state: SCHEDULED → IN_PROGRESS`. Records `actualStartAt=now`. Emits `ActivityStarted`. | Step 2. |
| 2 | `/today/activity/:id` | Activity runner: intention pinned at top, timer counting up, a "Procedure" drawer (from `CatalogEntry.procedure` steps a/b/c…), a notes area, and a single large **Close** button (disabled until output artifact form complete — see step 3). | User works; optionally opens Procedure drawer to read steps; optionally types in notes. | — | User taps Close → step 3. |
| 3 | `/today/activity/:id` (close sheet) | Close sheet slides up. Contains the output artifact form keyed to `CatalogEntry.outputArtifact.schema`: **TEXT** = free-text field; **TWO_LIST** = two stacked lists ("What went well" / "What to improve"); **NUMERIC** = number input with unit label; **DOCUMENT** = link-to-document field; **CHART** = link-to-chart field. Form is required; Close button disabled until valid. | Fills output artifact. Taps **Save & Close**. | Validates form matches schema. Transitions `ScheduledActivity.state: IN_PROGRESS → CLOSED` with `actualEndAt=now` and `outputArtifactRef` populated. Emits `ActivityCompleted`. | Step 4. |
| 4 | `/today/activity/:id/reflect` | ReflectionSheet (modal overlay, auto-fires because blueprint §4.1 item 4 requires reflection on non-optional close). Shows: plan vs actual minutes auto-computed (e.g., "Planned 30, actual 42, +12 min"). One question: "What slowed you or helped?" (single free-text, ≤ 140 chars). One checkbox: "Flag as friction signal" (off by default; tooltip on hover: "Adds this to your Kaizen candidate queue for Friday's reflection"). Two buttons: **Save** / **Skip reflection** (the Skip link is subdued, not a primary button). | Types answer. Optionally checks friction flag. Taps Save. | Creates `Reflection` row with `capturedAt=now`, `kind=END_OF_ACTIVITY`, `planVsActualMinutes`, and `frictionFlag`. If flag true, creates a `FrictionSignal` row with `status=OPEN` linked to this reflection. Emits `ReflectionCaptured { onTime: (now - actualEndAt < 15 min) }` and, if flagged, `FrictionSignalCaptured`. | ReflectionSheet dismisses; `/today` updates to show the activity as CLOSED and pins the next activity. |
| 5 | `/today` | The previous block renders in a muted style with a small "closed" check and the captured reflection summary. BucketStrip updates actual minutes. AdherenceDial updates. The next block is now pinned. | — | — | Loop back to step 1 for the next activity. |

**Skip-reflection edge case:** Tapping "Skip reflection" is allowed on configurable activities but not on non-optional ones. On a non-optional, the Skip link is replaced with disabled text: "Reflection required on non-optional activities." See `ARCHITECTURE.md` §3.2 guards.

**Late-reflection edge case:** If a user closes an activity and dismisses the ReflectionSheet without completing it, the activity is still `CLOSED` and a `Reflection` row is auto-stubbed with `pending=true` (per `ARCHITECTURE.md` §2.6 + `ReflectionStubbed` event in §6.1). A persistent banner on `/today` reads: "1 reflection pending from earlier today. Capture in 2 min?" linking back to the ReflectionSheet. When the user captures it, `pending` flips to `false` and `ReflectionCaptured` fires with `onTime: capturedAt - actualEndAt <= 15 min`. The reflection-rate KPI counts only `pending=false AND onTime=true`.

### 2.3 Weekly Reflection (20-min guided DMAIC flow that promotes one Kaizen candidate)

**Precondition:** Fri afternoon anchor fires (it is itself a non-optional `ScheduledActivity` of catalog type "Weekly Reflection (20-min DMAIC)" with `bucket=CI`). User taps Start on that block.

| Step | View | What the user sees | User input | System does | Next |
|---|---|---|---|---|---|
| 1 | `/week/reflect` | WeeklyReflectionWizard step 1 of 5: **Define**. Prompt: "One sentence: what problem kept showing up this week?" Below: a read-only list of the top 5 `FrictionSignal` rows from this week grouped by tag (MEETING_LOAD, CONTEXT_SWITCH, etc.), each showing the summary and which activity captured it. A progress dots row at top shows 1/5. | Types 1 sentence. Taps Next. | Stores draft in `Reflection.dmaicDraft.define`. | Step 2. |
| 2 | `/week/reflect` | Step 2: **Measure**. Prompt: "What number could prove this got worse?" Read-only aids: count of `Variance` rows this week; adherence % delta vs last 14 days. Field for the metric name + current value + proposed unit. | Types metric. Taps Next. | Stores in `dmaicDraft.measure`. | Step 3. |
| 3 | `/week/reflect` | Step 3: **Analyze**. Prompt: "One plausible cause." Read-only aid: the top 3 clustered friction tags from this week, ranked. | Types cause. Taps Next. | Stores in `dmaicDraft.analyze`. | Step 4. |
| 4 | `/week/reflect` | Step 4: **Improve — promote?**. A single candidate is pre-selected by the system: the `FrictionSignal` cluster with the highest count. If the cluster's tag matches a cluster that was dismissed in a prior week, a hint line appears: "Similar cluster dismissed 3 weeks ago — re-surfacing." (source: `KaizenCandidateQueue` dismissed-cluster history per `ARCHITECTURE.md` §6.2). Two choices: **Promote to Kaizen** / **Dismiss this week** (explain why). | Taps Promote or Dismiss. | If Promote: creates a `Kaizen` row in `state=DRAFT` with `sourceFrictionSignalIds` populated and `problemStatement` pre-filled from `dmaicDraft.define`. Transitions the referenced `FrictionSignal` rows to `CLUSTERED`. Emits `KaizenPromoted`. If Dismiss: marks the referenced friction signals as `DISMISSED` with the stated reason; dismissed-cluster history is retained by tag for future hint surfacing. | Step 5. |
| 5 | `/week/reflect` | Step 5: **Close**. Summary screen: the four DMAIC answers, plus either "Kaizen drafted: [title]. Open it?" or "No Kaizen promoted this week." Single **Finish** button. | Taps Finish. | Creates the Weekly `Reflection` row with `kind=WEEKLY`, `dmaicDraft` populated. Closes the Weekly Reflection activity (transitions to `CLOSED` with the draft as its output artifact). Emits `WeeklyReflectionCompleted { reflectionId, compositionId, promotedKaizenId? }`. | Redirects to `/kaizen/:id/baseline` if a Kaizen was promoted, else back to `/today`. |

**Empty-evidence edge case:** If the week has fewer than 3 friction signals (target per blueprint §7.3), step 4 shows a different prompt: "Not enough evidence this week to promote a Kaizen. Capture more friction signals in reflections next week." The Promote button is disabled; Finish is still offered.

**Abort edge case:** The user can exit the wizard at any point via a small "Save draft & exit" link. Partial drafts persist in `Reflection.dmaicDraft` and the Weekly Reflection activity remains `IN_PROGRESS`; the banner on `/today` nags: "Finish Friday's reflection (≤ 5 min remaining)."

### 2.4 Declare and close a Kaizen (baseline → actions → remeasurement → close-with-evidence)

**Precondition:** A `Kaizen` exists in `state=DRAFT` (promoted from Weekly Reflection).

| Step | View | What the user sees | User input | System does | Next |
|---|---|---|---|---|---|
| 1 | `/kaizen/:id/baseline` | KaizenCard header: title, problem statement (editable), goal statement (empty). Below: Baseline section. Form: metric name, unit, operational definition, sample size, method, baseline value. A lock indicator reads: "Baseline locks on save. Lock is irreversible." | Fills form. Taps **Lock baseline**. | Validates form. Creates `BaselineMetric` row with `locked=true`. Sets `Kaizen.baselineMetricId`. | Step 2. |
| 2 | `/kaizen/:id` | KaizenCard now shows: locked baseline (read-only), goal statement field, actions list (empty). Prompt: "Declare 1–5 actions. Each needs a name, owner, due date." | Adds actions. Types goal statement ("reduce X from 40 to 20 by May 15"). Taps **Activate**. | Validates `goalStatement !== null` AND `baselineMetric.locked === true` AND `actions.length >= 1`. Transitions `Kaizen.state: DRAFT → ACTIVE`. Emits `KaizenBaselineLocked`. | Step 3 (this happens over days/weeks as user works). |
| 3 | `/today` | While Kaizen is ACTIVE: the composer links each Deep block's `linkedKaizenId` and `linkedDmaicStepRef` to this Kaizen. Deep blocks now show a small "part of: [Kaizen title]" sub-label. KaizenCard on `/kaizen` shows action progress (done / total). | Checks off actions as done (on the KaizenCard). | Updates `actions[i].doneAt`. No state change on the Kaizen itself — blueprint §4.1: actions don't gate close; remeasurement does. | Step 4 (when user decides to remeasure). |
| 4 | `/kaizen/:id/remeasure` | Prompt: "Capture the same metric you baselined." Form: reuses the baseline's `metricDefinition` (read-only), user enters new value and optional evidence link (chart / report / narrative). | Enters value. Taps **Capture remeasurement**. | Validates `metricDefinition` matches baseline. Computes `deltaAbsolute`, `deltaPercent`, `beatsBaseline` (against goal direction). Creates `Remeasurement` row. Transitions `Kaizen.state: ACTIVE → IN_REMEASUREMENT`. Emits `KaizenRemeasured`. | Step 5. |
| 5 | `/kaizen/:id/close` | KaizenCard shows baseline, remeasurement, delta, beats-baseline boolean, and the three close-kind options: **SUCCESS** (auto-selected if `beatsBaseline=true`), **PARTIAL** (if improved but under goal), **FAILED_HONEST** (if no improvement). A `resultsNarrativeRef` field is required for all three (short 3-page narrative link or inline text, per catalog #49). A single **Close Kaizen** button. | Picks close kind. Attaches narrative. Taps Close. | Guard check: `remeasurementId !== null` AND `metricDefinitionId` matches baseline. If pass: transitions `Kaizen.state: IN_REMEASUREMENT → CLOSED`, stores `closeKind`. Emits `KaizenClosed`. | Redirect to `/insights` with banner: "Kaizen closed. Next candidate surfaces at Friday's reflection." |

**Blocked-close edge case (the HARD RULE):** If the user tries to close a Kaizen before remeasurement (e.g., by navigating directly to the close route), the Close button renders disabled with microcopy above it: "Can't close without a remeasured number. Capture remeasurement first." A link "Go to remeasurement" is shown below.

**Abandon edge case:** If the user wants to give up on a Kaizen without remeasuring, the only available action is "Abandon Kaizen" on the KaizenCard. This does NOT transition to CLOSED; it transitions back to `DRAFT` with `abandoned=true` (per `ARCHITECTURE.md` §3.3). The `/insights` portfolio shows abandoned Kaizens in a separate list from closed ones, so the truthfulness-of-portfolio KPI is preserved.

### 2.5 Skip or vary a non-optional activity (reason-code required; variance log append-only)

**Precondition:** `ScheduledActivity.state=SCHEDULED` (not yet started) and `CatalogEntry.isNonOptional=true`.

| Step | View | What the user sees | User input | System does | Next |
|---|---|---|---|---|---|
| 1 | `/today` | The ScheduledActivityBlock shows a small "Skip" link on the right of the block. Tapping it opens the skip sheet (not a full route, a modal). | Taps Skip. | — | Step 2. |
| 2 | `/today/activity/:id/skip` | Skip sheet: "Skip [Daily Standup]? This is a non-optional activity. Pick a reason:" Five radio options: **Escalation**, **Meeting conflict**, **Sick**, **Blocked upstream**, **Deprioritized**. An "Other" radio reveals a free-text note. No confirm button active until a reason is selected. | Picks reason. Optionally types note. Taps **Log variance & skip**. | Atomic transaction: (1) transitions `ScheduledActivity.state: SCHEDULED → SKIPPED` with `reasonCodeIfSkipped`; (2) creates a `Variance` row with `kind=SKIPPED_NON_OPTIONAL`, `reasonCode`, `note`. (3) Emits `VarianceLogged`. The variance row is append-only — UI never offers edit or delete. | Step 3. |
| 3 | `/today` | The block renders with a red "skipped" indicator and the reason code label. AdherenceDial updates immediately (the activity counts against adherence). A small inline coaching line appears under the block — see §5 microcopy. | — | ComposerService subscribes to `VarianceLogged` and queues this activity in next cycle's `varianceQueue` input (skipped non-optionals get rescheduling preference tomorrow per §4.5 R2). | — |

**In-progress skip edge case:** If an activity has already been started (`state=IN_PROGRESS`), the Skip path is disallowed per `ARCHITECTURE.md` §3.2 guard. The UI offers only **Close** with partial output (which will log an `OVERRAN` or `UNDERRAN` variance depending on duration). No skip option is shown once the activity is started.

**Variance correction edge case:** A user cannot "delete" or "edit" a variance row. On `/insights/variance` each row shows a small **Add correction** link. Tapping it creates a new variance row with `kind=OTHER` and `note="supersedes variance_id=…"` per `ARCHITECTURE.md` §2.7. The original row stays visible; the log is append-only.

---

## 3. Component Model

Ten components. Each binds to specific entities in `ARCHITECTURE.md` §2 and renders four lifecycle states (empty, loading, success, error) plus an invariant-violation state where relevant.

### 3.1 CycleCard

- **Purpose:** Render a single `Composition` with its filled `ScheduledActivity[]`. Primary canvas for Accept / Edit / Reject at the composer boundary.
- **Binds to:** `Composition`, `ScheduledActivity[]`, `composerInputsSnapshot`, `invariantChecks`.
- **States:** 
  - **Empty** ("Composing your day…"), 
  - **Loading** (skeleton blocks), 
  - **Success** (composition rendered; Accept/Edit/Reject buttons available), 
  - **Error** ("Composition infeasible at current capacity. Adjust capacity or Reject."), 
  - **Invariant violation** (inline: "PROJECT bucket is 180 min, needs ≥ 240. Move an activity to PROJECT or replace a Communication block."). 
- **Emits:** `CycleAccepted`, `CycleEdited`, `CycleRejected`.

### 3.2 BucketStrip

- **Purpose:** The 4-2-2 visualization. Three stacked horizontal strips (PROJECT, COMMUNICATION, CI) showing planned-vs-actual minutes per bucket for a given `Composition(DAILY)`. Updates live during composer edits.
- **Binds to:** `Composition` child `ScheduledActivity.plannedDurationMinutes` and `actualEndAt − actualStartAt` per bucket; targets from `ARCHITECTURE.md` §5.1 (240 / 120 / 120).
- **States:** 
  - **Empty** (flat zero bars), 
  - **Loading** (shimmer strips), 
  - **Success** (bars filled to planned minutes; actual minutes overlaid in a darker tone when available), 
  - **Error** (if a bucket exceeds its hard ceiling, strip pulses and shows: "OVERPACKED: PROJECT is 295 min, ceiling is 264"), 
  - **Invariant violation** (red strip when bucket is below 50% floor — "DEEP_UNDER_FLOOR"). 
- **Colors:** PROJECT = warm neutral; COMMUNICATION = cool neutral; CI = accent neutral. Visual design chooses exact tones in build; the constraint is three consistent, distinct tones.
- **Emits:** Nothing (pure visualization). Reads invariant state from `invariantChecks`.

### 3.3 ScheduledActivityBlock

- **Purpose:** Render one `ScheduledActivity` on the day timeline. Carries start / work / close interactions.
- **Binds to:** `ScheduledActivity`, its `CatalogEntry`, its `Reflection` (if closed), and (when in PROPOSED state) the Composer Explainer `AgentSuggestion` keyed to this `scheduledActivityId`.
- **States:** 
  - **Empty** (never — a block exists only when a ScheduledActivity row exists), 
  - **Loading** (skeleton), 
  - **Success** (renders in one of five variant styles matching `state`: PROPOSED / SCHEDULED / IN_PROGRESS / CLOSED / SKIPPED), 
  - **Error** ("Failed to start activity; try again"), 
  - **Invariant violation** at close ("Output artifact required. Fill the form to close."). 
- **Sub-elements (PROPOSED state only):** a small **why chip** (info chevron) tucked at the block's trailing edge. Tapping it reveals the Composer Explainer microcopy sourced from `Composition.composerInputsSnapshot.explain[]` matching this block (e.g., "Chosen because you have an active DMAIC project; SIPOC is closed, so C&E Matrix is next"). Read-only. Non-blocking. Dismissible. See `AI_AGENTS.md` §2 Agent 5 (Composer Explainer) for the data contract.
- **Emits:** `ActivityStarted`, `ActivityCompleted` (via Close action; relays output artifact + reflection to services).

### 3.4 CatalogPicker

- **Purpose:** In the composer Edit mode, lets the user pick a replacement `CatalogEntry` for a configurable block. Filtered by bucket and by user's enabled entries + active Kaizen payload. Non-optional entries are not pickable as replacements here (you cannot remove a non-optional).
- **Binds to:** `CatalogEntry[]` where `enabledByUser=true` AND `appliesToRoles` intersects current user's role; grouped by `bucket`.
- **States:** 
  - **Empty** ("No catalog entries enabled for this bucket. Enable some in Catalog."), 
  - **Loading** (skeleton list), 
  - **Success** (grouped list with name + default duration + a small "i" opening a sheet with procedure), 
  - **Error** ("Failed to load catalog. Retry."). 
- **Emits:** Local selection event consumed by the composer Edit view; composer emits the aggregate `CycleEdited` on save.

### 3.5 IntentionField

- **Purpose:** Single-line input on a `ScheduledActivity` declaring the block's outcome. Corresponds to `ScheduledActivity.intention` per `ARCHITECTURE.md` §2.5.
- **Binds to:** `ScheduledActivity.intention` (string).
- **States:** 
  - **Empty** (placeholder: "One line: what outcome by close?"), 
  - **Loading** (disabled while saving), 
  - **Success** (value populated), 
  - **Error** ("Intention required on non-optional activities"), 
  - **Invariant violation** (Start button refuses on non-optional without intention). 
- **Emits:** No standalone event. Validated on transition `SCHEDULED → IN_PROGRESS`.

### 3.6 ReflectionSheet

- **Purpose:** 60-second structured close prompt. Captures plan-vs-actual and one friction tag. One of the three load-bearing rituals.
- **Binds to:** the just-closed `ScheduledActivity` (for plan vs actual) + draft `Reflection` row (`kind=END_OF_ACTIVITY`).
- **States:** 
  - **Empty** (fresh modal: plan-vs-actual pre-computed, text field blank, friction checkbox off), 
  - **Loading** (save-in-progress spinner on Save button), 
  - **Success** (dismisses cleanly, parent view updates), 
  - **Error** ("Failed to save reflection. Retry — your answer is safe."), 
  - **Invariant violation** (Skip disabled on non-optional activities — inline text: "Reflection required on non-optional activities"). 
- **Emits:** `ReflectionCaptured`, `FrictionSignalCaptured` (if friction flag set).

### 3.7 WeeklyReflectionWizard

- **Purpose:** 20-minute guided DMAIC flow (4–5 steps) producing at most one promoted Kaizen candidate. One of the three load-bearing rituals. Owns steps 1–5 of flow 2.3.
- **Binds to:** current week's `Composition(WEEKLY)`, its child `Reflection(kind=WEEKLY)` draft, this week's `FrictionSignal[]` grouped by tag, this week's `Variance[]`.
- **States:** 
  - **Empty** (first-time banner: "First Weekly Reflection. Takes ~20 minutes. You'll promote at most one improvement."), 
  - **Loading** (per-step save spinner), 
  - **Success** (each step accepts input, step 5 closes the flow with a summary), 
  - **Error** ("Failed to save draft. Your answers stay on this device; retry."), 
  - **Insufficient-evidence state** (step 4 disables Promote when `FrictionSignal.count < 3` — message: "Not enough evidence this week to promote. Capture more friction signals next week.").
- **Emits:** `WeeklyReflectionCompleted`, optionally `KaizenPromoted`.

### 3.8 KaizenCard

- **Purpose:** Single-card view of one `Kaizen` — baseline, goal, actions, remeasurement, close. Refuses close without remeasurement (the HARD RULE).
- **Binds to:** `Kaizen`, its `BaselineMetric`, its `Remeasurement` (if any), its `FrictionSignal[]` via `sourceFrictionSignalIds`.
- **States:** 
  - **Empty** ("No active Kaizen. Next candidate surfaces at Friday's reflection."), 
  - **Loading** (skeleton), 
  - **Success** (renders one of five sub-states matching `Kaizen.state`: DRAFT / ACTIVE / IN_REMEASUREMENT / CLOSED / abandoned), 
  - **Error** ("Failed to save Kaizen. Retry."), 
  - **Invariant violation** on close attempt ("Can't close without a remeasured number. Capture remeasurement first."). The Close button renders disabled with this microcopy directly above. 
- **Emits:** `KaizenBaselineLocked`, `KaizenRemeasured`, `KaizenClosed`.

### 3.9 AdherenceDial

- **Purpose:** The three KPI numbers from blueprint §4.1 item 5, always visible on login: (a) standard-work adherence % over last 14 days, (b) composition acceptance %, (c) Kaizen delta vs baseline on the active Kaizen.
- **Binds to:** `MetricsSnapshot` (latest row by `computedAt`).
- **States:** 
  - **Empty** (first-week users: "Building your baseline. These numbers populate after your 7th day."), 
  - **Loading** (skeleton numbers), 
  - **Success** (three numbers with tiny trend sparklines; tapping any opens `/insights`), 
  - **Error** ("Metrics temporarily unavailable"). 
- **Emits:** Nothing (read-only).

### 3.10 VarianceLogEntry

- **Purpose:** One row in the append-only variance log on `/insights/variance`. Exposes "Add correction" rather than "edit" or "delete".
- **Binds to:** `Variance` (single row).
- **States:** 
  - **Empty** (never — an entry exists only when a Variance row exists), 
  - **Loading** (skeleton row), 
  - **Success** (shows kind + reason + catalog entry name + timestamp + "Add correction" link; if this row supersedes another, shows a chain indicator "corrects variance_id=…"), 
  - **Error** ("Failed to load variance"), 
  - **Invariant violation** state not applicable — variances are born in terminal state. 
- **Emits:** On "Add correction": creates a new `Variance` row via `VarianceService`. The original is never modified.

### 3.11 ArtifactPreview (sub-component)

- **Purpose:** Read-only preview card for a linked artifact (a prior `ScheduledActivity.outputArtifactRef` from the same Kaizen lineage, or a referenced `CatalogEntry.procedure` excerpt). Surfaced by the Context agent (`AI_AGENTS.md` §2 Agent 3) into the activity runner and the composer Edit mode so users don't have to page away to find prerequisites.
- **Binds to:** a target `{ schema, value }` pair from `outputArtifactRef` OR a `CatalogEntry.procedure[]` slice.
- **Surfaces in:** the activity runner (`/today/activity/:id`) as a collapsed "Related artifact" strip above the notes area; the composer Edit mode (`/week/day/:isoDate/compose`) as an inline chip attached to a configurable block when the Context agent has content.
- **States:** 
  - **Empty** (agent abstained — component does not render at all), 
  - **Loading** (skeleton strip), 
  - **Success** (renders preview by schema: TEXT → first 120 chars; TWO_LIST → first 3 items each list; NUMERIC → value + unit; DOCUMENT / CHART → title + link), 
  - **Error** ("Couldn't load linked artifact"). 
- **Non-blocking.** Never steals focus. Always dismissible with a small ×. Dismissal emits an `AgentTelemetryEvent` with `userAction='DISMISSED'` so the Context agent learns to suppress similar suggestions.
- **Emits:** No state changes in the domain model — read-only. Only writes to `bamx:v1:agent-telemetry` on view / dismiss.

---

## 4. Interaction Patterns

Seven patterns, used consistently across MVP. Each is described once here and referenced by the flow sections above.

### 4.1 Accept / Edit / Reject (at every composer boundary)

**Where it appears:** Daily composer (`/today` and `/week/day/:isoDate/compose`), Weekly composer (`/week/compose`). The triad never moves or re-orders.

**Behavior:**
- **Accept** commits the proposal as-is. All child activities flip from `PROPOSED → SCHEDULED` atomically. `sourceOfSchedule=COMPOSER_AUTO` on every child.
- **Edit** opens the full-screen editor described in §4.2. On Save, same atomic transition but with `edited=true` and `sourceOfSchedule=USER_EDIT` on touched children.
- **Reject** requires a short optional reason (single-line, not gated). Transitions the composition to `REJECTED`. The user is then left with an empty day and must either re-compose or manually add activities from the catalog.

**Metric implication:** the composition-acceptance KPI counts **Accept without edit** only. Edited acceptances are tracked separately per blueprint §7.2. Rejected cycles count against the acceptance denominator.

### 4.2 Drag-to-reorder / drag-to-rebucket ScheduledActivityBlocks inside a CycleCard

**Where it appears:** Daily composer Edit mode, Weekly composer Edit mode.

**Behavior:**
- Each `ScheduledActivityBlock` has a drag handle. Non-optional blocks show a lock icon on the handle; they cannot be removed but can be reordered within their own bucket.
- Dragging a configurable block vertically reorders within the same bucket.
- Dragging a configurable block across bucket boundaries triggers a **drop rule**: the drop is allowed only if the destination bucket will still satisfy the 4-2-2 invariant after the drop AND the source bucket will still satisfy its minimum floor.
- If the drop would violate either rule, the drop target shows a red outline and a tooltip: "Can't drop here — would push PROJECT to 180 min (needs ≥ 240)." The block snaps back to origin.
- The BucketStrip updates live during drag (ghost preview).

**No free-form calendar builder.** This is explicitly reordering / rebucketing of composer-produced blocks, not generic event creation. Users cannot draw new blocks on a grid; they replace via CatalogPicker.

### 4.3 Inline validation messages for invariant violations

**Message forms (exact text, rendered inline):**

| Violation | Message | Where rendered |
|---|---|---|
| `DEEP_UNDER_FLOOR` | "PROJECT bucket is 180 min, needs ≥ 240. Move an activity to PROJECT or replace a Communication block." | Above Accept button on CycleCard |
| `COMM_UNDER_FLOOR` | "COMMUNICATION bucket is 60 min, needs ≥ 60. Add a 1:1 or a team meeting." | Same |
| `CI_UNDER_FLOOR` | "CI bucket is 40 min, needs ≥ 60. Add a PDCA tick or L&D block." | Same |
| `PROJECT_OVERPACKED` | "PROJECT is 295 min, ceiling is 264. Remove a block or shorten one." | Same |
| `COMM_OVERPACKED` | "COMMUNICATION is 165 min, ceiling is 150. Remove a meeting or shorten one." | Same |
| `CI_OVERPACKED` | "CI is 160 min, ceiling is 150. Remove a CI block or shorten one." | Same |
| `NON_OPTIONAL_MISSING` (Daily) | "Missing: [Daily Standup]. The day can't save without it. Re-add from Catalog." | Same |
| `OVER_CAPACITY` | "Day totals 510 min, your capacity is 480. Remove 30 min." | Same |
| Output-artifact missing at close | "Fill the [Standup notes] field to close this activity." | Above Close button on ScheduledActivityBlock close sheet |
| Reflection missing on non-optional | "Reflection required to close non-optional activities." | Above Close button |
| Kaizen close without remeasurement | "Can't close without a remeasured number. Capture remeasurement first." | Above Close button on KaizenCard |

All messages are specific (they name the bucket and the number), actionable (they name what to do), and short (≤ 20 words).

### 4.4 The reason-code picker for variance logging

**Where it triggers:**
- Skipping a non-optional ScheduledActivity (flow 2.5).
- The composer detecting a yesterday variance and asking "Carry over [skipped activity] into today?" (this is informational, not a picker — the composer auto-queues it per §4.5 R2).

**Fixed list (matches `ARCHITECTURE.md` §2.5 `reasonCodeIfSkipped` enum):**
- **Escalation** — interrupted by a higher-priority problem
- **Meeting conflict** — another meeting ran over or conflicted
- **Sick** — out sick or personal
- **Blocked upstream** — waiting on someone / something
- **Deprioritized** — chose to not do this today
- **Other** — reveals a free-text note field

**Behavior:** One selection required; submit button disabled until selected. "Other" also requires the free-text note. On submit: atomic `SCHEDULED → SKIPPED` + `Variance` insert. Variance row is append-only; no edit/delete is offered.

### 4.5 The output-artifact form lifecycle

**Trigger:** Every activity close (flow 2.2 step 3). The form shape is keyed to `CatalogEntry.outputArtifact.schema`, one of:

| Schema | Form shape | Example catalog entries |
|---|---|---|
| `TEXT` | Single large text area; min 1 char. | Daily Standup notes, Time-blocking summary |
| `TWO_LIST` | Two labeled lists, side by side; each requires ≥ 1 item. | Sprint Retrospective (went well / to improve) |
| `NUMERIC` | Number input + unit label. | PDCA Cycle current-condition measurement |
| `DOCUMENT` | URL field + short title. | Document Writing, Charter completion |
| `CHART` | URL field + short title. | Control Chart (#29), Capability Report (#30) |

**Lifecycle:**
1. Form renders when user taps Close on a `ScheduledActivity`.
2. Close button is **disabled** until the form validates against the schema.
3. On submit: `outputArtifactRef` is stored as `{ schema, value }` on the ScheduledActivity.
4. Close transitions `IN_PROGRESS → CLOSED`.
5. ReflectionSheet auto-opens next (if non-optional or reflection-opted-in).

**The rule:** No activity closes without the output. This is the "every completion is a measurement" rule from blueprint §2.

### 4.6 Inline coaching microcopy

**Behavior:** Short, contextual text strings surfaced at specific trigger points. Never a popup or modal on its own. Always inline with a specific component or action. Ten examples enumerated in §5.

**Rules:**
- Maximum 20 words per line.
- No exclamation points.
- No "rockstar," "seamless," "powerful," "empower," or emoji.
- Product voice, not consultant voice. Says what happened and what to do; does not congratulate or rally.
- Never blocking. Coaching never has an OK button that's required to dismiss. It appears, you read it, you move on.

### 4.7 Start-on-time prompt (soft nudge, not blocking)

**Where it appears:** If a `ScheduledActivity` with `plannedStartAt <= now` is still in `state=SCHEDULED` 5 minutes past start, a small banner appears pinned at the top of `/today`: "[PDCA Cycle] was scheduled at 10:15. Start it now or skip with a reason?" Two inline actions: **Start now** / **Skip with reason**.

**Not blocking.** Does not prevent starting the activity later; does not auto-skip. Logs nothing on its own — only the user's action (start / skip) produces a state transition.

---

## 5. Inline Coaching Examples

Ten concrete examples. Each is tied to a specific trigger and a specific place in the UI. Format: `Trigger: ...` / `Where: ...` / `Microcopy: "..."`. All strings are ≤ 20 words.

### 5.1

- **Trigger:** User accepted the Daily composition for the first time ever.
- **Where:** Small line below the AdherenceDial on `/today`, first day only.
- **Microcopy:** "Today is your first composed day. Your baseline starts now. Your adherence number appears after day 7."

### 5.2

- **Trigger:** User tapped Edit on a proposed Daily cycle for the third day in a row.
- **Where:** Top of the Daily composer Edit view.
- **Microcopy:** "You've edited three days running. If the composer keeps missing, adjust capacity or enabled catalog entries in Settings."

### 5.3

- **Trigger:** User skipped a non-optional activity with reason code `ESCALATION` for the second time this week.
- **Where:** Below the skip confirmation on `/today`, inline with the skipped block.
- **Microcopy:** "Second escalation this week. Escalations show up in Friday's reflection as a friction cluster."

### 5.4

- **Trigger:** User closed an activity 10+ minutes late on reflection capture.
- **Where:** Top of the ReflectionSheet.
- **Microcopy:** "Captured 14 minutes after close. Counts as late in your reflection rate. Fine — just note it."

### 5.5

- **Trigger:** User about to activate a Kaizen with zero actions declared.
- **Where:** Below the Activate button on the KaizenCard `DRAFT` state.
- **Microcopy:** "A Kaizen needs at least one named action with an owner and a due date. Add one to activate."

### 5.6

- **Trigger:** User attempted to close a Kaizen without a remeasurement.
- **Where:** Directly above the disabled Close button on `/kaizen/:id/close`.
- **Microcopy:** "Can't close without a remeasured number. Capture the same metric you baselined, then close."

### 5.7

- **Trigger:** User has dragged a CI block into PROJECT and the drop would violate the CI floor.
- **Where:** Tooltip at the drop target in the Daily composer.
- **Microcopy:** "Can't drop here. CI would fall to 30 min. PROJECT already meets its floor."

### 5.8

- **Trigger:** User has 3+ open friction signals tagged MEETING_LOAD this week.
- **Where:** Pinned banner on `/today`, dismissible for today.
- **Microcopy:** "Meeting load shows up three times this week in your reflections. Friday's reflection will cluster these."

### 5.9

- **Trigger:** User has not captured a reflection for 2 consecutive closed non-optional activities.
- **Where:** Below the second activity's close indicator on `/today`.
- **Microcopy:** "Two reflections pending. Friday's reflection works from this raw material. Capture them in 2 minutes."

### 5.10

- **Trigger:** User is about to Reject a proposed Daily cycle with all invariants passing.
- **Where:** Confirm dialog before Reject commits.
- **Microcopy:** "Rejecting a valid day means building from zero. Edit instead if one block is wrong. Reject only if today is a genuine reset."

---

## 6. Special Requirements — visualized

### 6.1 How the 4-2-2 rhythm is visualized

The BucketStrip component is the canonical visualization. It renders three stacked horizontal bars corresponding to the Daily `Composition`'s three buckets:

- **PROJECT** — top bar, target length 240 min
- **COMMUNICATION** — middle bar, target length 120 min
- **CI** — bottom bar, target length 120 min

Each bar has two layers:
- **Planned minutes** (full tone): the sum of `plannedDurationMinutes` across all ScheduledActivities in that bucket.
- **Actual minutes** (darker overlay): the sum of completed minutes so far today (only on Today; not on composer preview).

A thin dashed line at each bar's target marks the 4-2-2 exact value. A thin dashed line at 50% marks the floor. Bars that fall short of the floor render in red. Bars that exceed the ceiling (110% PROJECT / 125% COMM / 125% CI per `ARCHITECTURE.md` §5.6) pulse red with an inline violation message.

BucketStrip appears:
- On `/today`, pinned at the top of the day view.
- In the Daily composer Edit mode, live-updating during drag.
- On `/week` as five miniature strips stacked vertically, one per workday, so the user sees the week's rhythm shape at a glance.

Each bucket uses one consistent tone across the app (warm neutral for PROJECT, cool neutral for COMMUNICATION, accent neutral for CI). The tones are color-only signals; every bucket is also labeled with its name, so colorblind users lose nothing.

### 6.2 How capacity is shown (planned vs actual, remaining, over-schedule prevention)

Three capacity surfaces:

1. **BucketStrip (daily, per-bucket).** Described in §6.1. Shows planned-vs-actual for each of PROJECT / COMMUNICATION / CI.

2. **Daily capacity meter (total day).** Small horizontal bar above the BucketStrip. Shows total planned minutes over total capacity (e.g., "470 / 480 min"). Turns red if total exceeds capacity. In the composer Edit mode, dragging a block that would push the total over capacity shows the meter in red and the Save button renders disabled.

3. **Remaining-minutes ticker (on Today, during execution).** As activities close, a small number in the AdherenceDial area updates: "Remaining today: 2h 15m (1 block left)." This is the user's "what's left" glance-view.

**Over-schedule prevention rules:**
- Composer never produces a `PROPOSED` cycle that exceeds capacity. If required non-optionals don't fit, it emits `INFEASIBLE` with the specific shortfall, and the CycleCard renders the infeasibility message instead of Accept / Edit / Reject.
- User edits that would push over capacity cannot be saved. Save button is disabled with inline text (see §4.3).
- **External meetings in MVP (manual):** the Daily composer carries a single `externalMinutesToday` numeric input (range 0–240). On change, the composer re-packs with `COMMUNICATION` target reduced by that value, but never below its 60-min floor. If the input would push COMMUNICATION below 60, CycleCard shows an error and the input snaps back. See `ARCHITECTURE.md` §5.5.
- **External meetings in future state:** imported as COMMUNICATION-bucket ScheduledActivities from Google / MS Calendar; they consume bucket capacity before the composer packs the remainder. Replaces the manual input.

### 6.3 How blockers are highlighted

Three blocker surfaces, each with a distinct visual treatment and inline action:

1. **Skipped non-optional activities** render in the day timeline with a red "skipped" indicator and the reason-code label visible inline. The block itself stays in position (not hidden). Tapping the block opens a read-only detail: reason, time skipped, link to the variance log row.

2. **Broken Kaizens** — when a Kaizen's declared remeasurement-by date has passed and no `Remeasurement` is attached, the KaizenCard on `/today`'s side panel renders a red status chip: "Remeasurement overdue by 3 days." The user is given one inline action: **Remeasure now**. This does not auto-fail the Kaizen; it just surfaces the overdue state. The Close button remains disabled until remeasurement happens.

3. **Composer invariant violations** (per §4.3 message forms) render inline on the CycleCard above the Accept button. The violated rule is named, the specific number is shown, and the action to fix is stated. Accept / Save is disabled. The user cannot save a broken day.

All three blocker types also populate an `/insights` roll-up: skipped activities → `/insights/variance`; broken Kaizens → top of `/kaizen`; invariant violations are not persisted but are captured as `CycleRejected` events if the user gives up.

### 6.4 How Deep Work visibility is prioritized on Today

Deep Work (PROJECT bucket) is the most-at-risk bucket per blueprint §6.2 ("Strategy block is silently eaten by escalations"). Four explicit patterns on `/today` protect its visibility:

1. **Top-strip position.** The BucketStrip renders PROJECT as the **top** bar. PROJECT is always the first thing the user sees on Today.

2. **Deep block gets the full-width treatment.** Each ScheduledActivityBlock with `bucket=PROJECT` renders ~1.5× the visual weight of Communication or CI blocks (taller, more prominent). Intention field is always visible on a Deep block, not collapsed. Linked Kaizen (from `linkedKaizenId`) is shown as a small sub-label: "part of: [Kaizen title]".

3. **Deep block interruption warning.** If the user taps Start on a non-Deep block while a Deep block is still in `state=SCHEDULED` and its `plannedStartAt` has passed, a confirmation prompt fires: "Your Deep block [Writing the PRFAQ] was scheduled at 10:15. Start it later, or skip with a reason?" Two buttons: **Start Communication anyway** (requires picking a skip-reason for the Deep block) / **Start Deep now**. This makes the Deep block's cost of displacement visible at the moment of trade-off, not at end-of-day.

4. **Deep minutes headline on the weekly view.** `/week` shows one headline KPI at the top: "Deep minutes this week: 720 / 1200 target (60%)." Below the number: the five daily BucketStrip miniatures so the user can see which days' PROJECT bars were short. The user cannot ignore a pattern of Deep shortfall; it's the first number on the weekly view.

---

## Resolution Log

All open questions and architecture gaps from draft v0.1 resolved by the coordinator on 2026-04-18. See `ARCHITECTURE.md` §9 for the architectural decisions log with full rationale per item. Summary:

- **External-calendar capacity in MVP:** `externalMinutesToday` numeric input on Daily composer ships in MVP.
- **Friction signal dismiss-loop:** dismissed-cluster history retained per tag; Weekly Reflection step 4 surfaces "similar cluster dismissed N weeks ago" as a non-blocking hint.
- **Team ceremonies single-user MVP:** solo blocks with placeholder participant list; output artifact still required. Team rollups ship in Next.
- **Reason-code OTHER requires note:** field-level rule added to `ScheduledActivity` and `Variance`.
- **Late reflection:** `Reflection` row auto-stubbed at close with `pending=true`; KPI counts only `pending=false AND on-time`. Added `ReflectionStubbed` event.
- **Activity start-on-time:** added `ActivityStartedLate` event.
- **MetricsService read path:** added `getLatestSnapshot(userId)` to the service interface.
- **Kaizen ready-to-remeasure:** computed property on Kaizen (not a stored state), surfaced on `KaizenCard`.
