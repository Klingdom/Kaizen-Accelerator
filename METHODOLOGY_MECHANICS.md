# CadencePlan Automation Mechanics

Owner: Agent 2 (Automation Systems)
Status: Draft v0.1 — pairs with Agent 1 ("user-input methodology"). References `ENGINE_DESIGN.md` §1.2/§1.8/§1.9, `ARCHITECTURE.md` §3.1/§4.7/§6.1/§7.1, `SCHEDULING_UX.md` §3.3, `AI_AGENTS.md` §2.1–§2.5, `ADHOC_PDCA_STANDARD.md` §2.B, `/js/events/events.js`.

Scope: the behind-the-scenes behavior that turns "composer outputs a day" into "user has a day ready without asking." Focus is on **timing**, **confidence-gating**, **smart defaults**, **failure recovery**, and **agent orchestration**. No new entities introduced beyond `ARCHITECTURE.md` v0.6.

---

## §1 — Scope

### 1.1 Definition

**Automation mechanics** = the system-side choreography that (a) decides when to run `ComposerService.composeDaily()`, (b) decides what surfaces to the user and when, (c) applies smart defaults to reduce declared inputs, (d) recovers from `InfeasibleResult`, and (e) sequences the five scripted agents so the user perceives a single cohesive "my day was ready" moment.

Agent 1 owns everything the user types, taps, or configures (role, capacity, sprint anchor, catalog enable/disable, per-cycle Accept/Edit/Reject, reflection capture). Agent 2 (this doc) owns everything that happens **without** the user asking.

### 1.2 Non-goals

- Algorithm details of `composeDaily`/`composeWeekly` — already in `ENGINE_DESIGN.md §1.2`.
- Entity schemas — in `ARCHITECTURE.md §2`.
- Drag-drop UX — in `SCHEDULING_UX.md §3.6`.
- New event types — we subscribe to the 25 events already declared in `events.js`; no additions.
- LLM reasoning — scripted heuristics only for MVP (`AI_AGENTS.md §1.4`).

### 1.3 Success criteria

| Metric | Target | Source |
|---|---|---|
| User-felt latency on `/today` | P95 < 300 ms | `SCHEDULING_UX.md §3.3` sub-60s journey row 2 |
| Compose P95 (cold) | 1–2 ms | `ENGINE_DESIGN.md §1.9` golden fixture |
| Acceptance without edit (Daily) | ≥ 60 % | Blueprint §7.2 |
| Acceptance without edit (Weekly) | ≥ 50 % | Blueprint §7.2 |
| INFEASIBLE rate per user-week | < 5 % | Leading indicator of chronic over-schedule |
| Auto-accept rate (post-thresholds ship) | 20–35 % of Daily compositions | New, §3.5 |

### 1.4 Boundary with Agent 1

| Concern | Owned by |
|---|---|
| User types role + capacity | Agent 1 |
| System re-infers role from catalog enablement | Agent 2 (§4) |
| User taps Accept | Agent 1 |
| System auto-promotes PROPOSED → ACCEPTED at high confidence | Agent 2 (§3) |
| User logs a Variance | Agent 1 |
| Composer subscribes to `VarianceLogged` and re-queues | Agent 2 (§6) |
| User taps "Skip ceremony with reason" | Agent 1 |
| System renders the guided-remediation flow | Agent 2 (§5) |

### 1.5 Doc-level invariants

- **Engine-first.** Nothing in §2–§8 bypasses `composeDaily()`. Automation decides *when* and *how to surface*, never *what to place*.
- **Idempotent re-compose.** Calling `composeDaily()` with identical input returns an equivalent composition (same sorted activity list) — golden fixture §1.9 guarantees this.
- **No new events.** All timing/confidence/agent choreography is expressed as subscribers to the existing 25 event names.
- **localStorage-only writes.** MVP persistence per `ARCHITECTURE.md §7.1`.

---

## §2 — When to compose

Six candidate strategies. Each block: trigger, user-felt latency, resource cost, graceful degradation, infrastructure.

### 2.1 Strategy 1 — Overnight-precompute

| Field | Value |
|---|---|
| **Name** | Overnight-precompute |
| **Trigger** | Server cron at `03:00 User.timezone`; for each User with a `sprintAnchorDate`, invoke `ComposerService.composeDaily({ date: tomorrow })`. Persist `Composition` as PROPOSED. |
| **User-felt latency** | 0 ms — day already there on `/today` load. |
| **Resource cost** | 1 × composeDaily per user per day = ~2 ms CPU. At 10 k users = 20 s total wall-clock per night. Storage: 1 Composition row/user/day. |
| **Graceful degradation** | If cron misses (server outage, user offline when cron runs client-side), fall through to Strategy 2 (on-demand-at-login). User sees a 300 ms skeleton, identical outcome. |
| **Infra required** | Server-side: cron runner + job queue. Client-side MVP: `serviceWorker.periodicSync` or `setTimeout` in a long-lived tab (fragile). |

Ship cost: **medium** (server cron). Feel: **magical** (zero wait).

### 2.2 Strategy 2 — On-demand-at-login

| Field | Value |
|---|---|
| **Name** | On-demand-at-login |
| **Trigger** | Router lands `/today` → `ComposerService.getActiveComposition(userId, today)` → if null, `composeDaily(input)` synchronously. |
| **User-felt latency** | ~2 ms compose + ~50 ms DOM hydrate = < 60 ms median, < 300 ms P95. Well within the `SCHEDULING_UX.md §3.3` 300 ms skeleton budget. |
| **Resource cost** | 1 × composeDaily per user per login day. Zero background compute. Zero storage overhead beyond the composition itself. |
| **Graceful degradation** | None needed — this IS the fallback for Strategy 1. If localStorage is corrupt, Strategy 6 (first-login defaults) applies. |
| **Infra required** | None. Ships in the existing SPA. |

Ship cost: **zero**. Feel: **instant-enough**.

### 2.3 Strategy 3 — Rolling-continuous

| Field | Value |
|---|---|
| **Name** | Rolling-continuous |
| **Trigger** | `setInterval(30 * 60 * 1000)` — every 30 min the app re-runs `composeDaily` using the latest `varianceQueue` + `activeKaizen.state` + `signals`. If result differs from current PROPOSED, banner: "Plan refreshed." |
| **User-felt latency** | 0 ms — always fresh. |
| **Resource cost** | 48 × composeDaily per user per day = ~100 ms total. Trivial CPU, but 48 × possible write I/O. Battery: noticeable on mobile if tab stays open. |
| **Graceful degradation** | If tab is backgrounded, browser throttles `setInterval`; resume catches up on focus. |
| **Infra required** | Client-side timer. No server cost. |

Downside: **churn**. If the plan keeps quietly changing, the user's mental model breaks. Rejected for MVP.

### 2.4 Strategy 4 — Lazy-on-idle

| Field | Value |
|---|---|
| **Name** | Lazy-on-idle |
| **Trigger** | `window.requestIdleCallback(() => composeDaily(tomorrowInput))` — browser schedules compose during the next user-idle gap. |
| **User-felt latency** | Effectively 0 ms if the user has been idle for > 5 s before visiting `/today`. Otherwise falls through to Strategy 2. |
| **Resource cost** | 1 compose per idle window, debounced. ~2 ms when it runs. |
| **Graceful degradation** | `requestIdleCallback` not supported → fall back to Strategy 2. |
| **Infra required** | Client-side only. Single API (browser built-in). |

Nice polish; not load-bearing because Strategy 2 already hits the latency target.

### 2.5 Strategy 5 — Pre-day-evening-suggest

| Field | Value |
|---|---|
| **Name** | Pre-day-evening-suggest |
| **Trigger** | At 17:00 `User.timezone` (configurable via User.wrapHour; default 17:00), on `CompositionClosed` of today's cycle, invoke `composeDaily({ date: tomorrow })`; show a notification "Tomorrow's plan is ready." |
| **User-felt latency** | 0 ms next morning. |
| **Resource cost** | 1 compose at wrap-up. No background polling. |
| **Graceful degradation** | If user didn't `CompositionClosed` today (forgot to wrap), no precompute fires. Falls through to Strategy 2 tomorrow morning. |
| **Infra required** | Client-side subscriber to `CompositionClosed`. Push notification (Notifications API) optional — degrades to in-app banner. |

Feels like a coach. Pairs well with Strategy 1.

### 2.6 Strategy 6 — Hybrid evening-suggest + morning-refresh

| Field | Value |
|---|---|
| **Name** | Hybrid: Evening-suggest + Morning-refresh |
| **Trigger** | (a) At wrap-up (17:00 or on `CompositionClosed`): precompute tomorrow. (b) On `/today` landing: if `now - PROPOSED.composedAt > 12h`, re-run `composeDaily` with fresh `varianceQueue` + overnight `signals`. |
| **User-felt latency** | 0 ms if fresh; ~60 ms if re-run triggers. |
| **Resource cost** | Up to 2 composeDaily per user per day. |
| **Graceful degradation** | Evening miss → morning refresh always runs. Morning miss → user never sees stale plan (refresh is mandatory if > 12h). |
| **Infra required** | Client-side only. Subscriber + small staleness check. |

Best user perception; slight complexity. **Recommended for post-MVP** (§7).

### 2.7 Ranking

Rank by user-felt-latency × infrastructure-cost. Lower is better.

| # | Strategy | Latency (rank) | Infra cost (rank) | Product score | Verdict |
|---|---|---|---|---|---|
| 1 | Overnight-precompute | 1 (0 ms) | 5 (cron) | 5 | Defer — needs server infra |
| 2 | On-demand-at-login | 2 (< 60 ms) | 1 (none) | 2 | **MVP** |
| 3 | Rolling-continuous | 1 (0 ms) | 4 (churn) | 4 | Reject — churn |
| 4 | Lazy-on-idle | 2 (< 60 ms) | 2 (trivial) | 4 | Polish, post-MVP |
| 5 | Pre-day-evening-suggest | 1 (0 ms) | 2 (client timer) | 3 | Post-MVP |
| 6 | Hybrid (5 + refresh) | 1 (0 ms) | 3 (client) | **1** | **Target for v1.1** |

**MVP decision: Strategy 2.** See §7.

### 2.8 Timing side-effects

When a compose runs, the following events fire regardless of trigger:

- `CycleProposed { compositionId, cycleType: 'DAILY' }` — UI subscribes, renders CycleCard.
- Subscribers queued (Planning Agent, Composer Explainer Agent — §6).
- If `InfeasibleResult`: `ComposerInfeasible { userId, date, result }` fires instead.

Automation mechanics never mutate Composition state directly; they only trigger the composer and observe the emitted events.

---

## §3 — Confidence + auto-accept thresholds

### 3.1 Why confidence at all

`composeDaily` always returns a valid `Composition` (or `InfeasibleResult`). But some placements are tight (phase-locked ceremony, anchored standup) and others are loose (CI rotation pick at 80-priority tie, Deep slice ordering). Treating every PROPOSED day identically wastes the user's Accept tap when the composer is near-certain.

### 3.2 Placement confidence formula

Per block `b` in `Composition.activities[]`, compute:

```
confidence(b) =
    0.40 * phase_match
  + 0.25 * dependency_recency
  + 0.20 * urgency
  + 0.15 * (1 - ambiguity)
```

| Term | Range | Definition | Source |
|---|---|---|---|
| `phase_match` | 0/1 | 1 if `b.catalogEntryId.phaseBinding` equals `activeKaizen.phase`, else 0.5 for unbound entries, else 0 | ENGINE §4.2 |
| `dependency_recency` | 0–1 | For `linkedPdcaExperimentId` ticks: `clamp((hoursSinceLastTick - 42) / 6, 0, 1)` | PDCA 48h cadence, ADHOC §2.B |
| `urgency` | 0–1 | 1 if `b.source === 'VARIANCE_QUEUE'` (re-queued from yesterday's skip); 0.8 if phase ceremony; 0.6 if Deep block linked to `activeKaizen`; 0.4 default CI | ENGINE §1.5 pickCI |
| `ambiguity` | 0–1 | Number of tied CI candidates at pickCI time / total eligible; high = many equally good alternatives | ENGINE §1.5 |

### 3.3 Day-aggregate confidence

```
dayConfidence = weightedAvg(activities.map(confidence), weights=activities.durationMinutes)
```

Weight by minutes so a 120-min Deep block dominates a 15-min Standup.

### 3.4 Three bands

| Band | dayConfidence | UX behavior | State transition |
|---|---|---|---|
| **AUTO_ACCEPT** | ≥ 0.85 | Banner on `/today`: "Day ready — auto-accepted. Review or Undo." | `PROPOSED → ACCEPTED` on Composition; all child `ScheduledActivity` → `SCHEDULED`. Fires `CycleAccepted { edited: false, auto: true }`. |
| **PROPOSE** | 0.55–0.85 | Render CycleCard in PROPOSED with visible Accept button. Default MVP path. | Waits for user tap. |
| **SOFT_SUGGEST** | < 0.55 | Render CycleCard with "Suggested" badge and visible "Try alternative" buttons next to low-confidence blocks. Composer Explainer microcopy expanded by default. | Waits for user tap; user expected to edit. |

### 3.5 Default thresholds (rationale)

| Threshold | Value | Rationale |
|---|---|---|
| Auto-accept cutoff | **0.85** | Derived from golden-fixture §1.9: a day composed entirely of phase-locked + re-queued non-optionals scores ~0.88. Anything below 0.85 has at least one ambiguous pick; user judgment adds value. Inverse: ≥ 0.85 days have ≤ 1 freely-chosen block, usually a Communication pass. |
| Propose cutoff | **0.55** | Below this, the day has ≥ 3 blocks where the composer tied the top-2 candidates. User should see alternatives inline. |
| Undo window | **60 s** | If auto-accepted and the user taps "Undo" within 60 s, we flip back to PROPOSED without emitting `CycleRejected`. After 60 s, undo requires explicit Reject. |

### 3.6 Auto-accept guardrails

An auto-accept is NOT taken if **any** of:

- `Composition.priorCompositionIds.length < 5` (user has < 5 accepted cycles; we lack trust data).
- The day contains a `catalogEntryId === 'ce_baseline_lock'` or any ceremony with an explicit `requiresUserConfirm: true` flag.
- `InfeasibleResult` was returned in the last 3 days (user is in a friction period; don't compound).
- User has `User.preferences.autoAcceptDaily === false` (explicit opt-out).

### 3.7 Explain-band microcopy

Composer Explainer Agent (§6) tunes phrasing per band:

| Band | Explainer tone | Sample |
|---|---|---|
| AUTO_ACCEPT | Declarative | "Your day is ready — everything here is anchored to your active Kaizen or phase ceremonies." |
| PROPOSE | Offering | "Here's what today looks like. The Communication block at 15:00 was ranked best of 3 candidates." |
| SOFT_SUGGEST | Questioning | "A few choices today depend on your preference. Tap any block to see alternatives." |

### 3.8 Edge cases

| Case | Handling |
|---|---|
| User edits an auto-accepted day inside 60 s | Undo stack reverts auto-accept; normal PROPOSED edit flow resumes. Fires `CycleEdited` but not `CycleRejected`. |
| Day re-composes after `VarianceLogged` | Recompute confidence; if band changes from AUTO_ACCEPT to PROPOSE, revert state and re-surface CycleCard. |
| Confidence computed on INFEASIBLE | N/A — InfeasibleResult has no activities; §5 path takes over. |
| Confidence measurement bug | Log `AgentTelemetryEvent { kind: 'CONFIDENCE_OUT_OF_BAND' }` and default to PROPOSE band. |

### 3.9 Measurement

Track these ratios weekly:

- Auto-accept rate (target 20–35 %).
- Undo rate within 60 s (target < 10 % of auto-accepts).
- Auto-accept Edit rate within 24 h (target < 15 %).
- User-reported "wrong auto-accept" via Settings → Feedback (target < 3 %).

Any breach of the target bumps the auto-accept cutoff from 0.85 → 0.90 for the cohort (A/B-tested).

---

## §4 — Smart defaults

System heuristics that reduce user decisions. Each: trigger, inference, UX signal, override path.

### 4.1 First-login defaults

| Field | Value |
|---|---|
| Trigger | `User` row created, no preferences set. |
| Inference | `role = ['PRACTITIONER']`, `dailyCapacityMinutes = 480`, `deepSlicePreference = '2x2h'`, `sprintAnchorDate = Monday of current ISO week`, `workDays = ['MON','TUE','WED','THU','FRI']`. |
| UX signal | `FirstRunBanner` on `/today`: "We defaulted you to 8h / 5d / Practitioner. Adjust in Settings." |
| Override | Settings → Profile; all four editable. Edit triggers composer re-run for today. |

### 4.2 Role inference

| Field | Value |
|---|---|
| Trigger | `CatalogService.userEnabled()` changes — user enables ≥ 3 CHAMPION-tagged entries from the catalog picker. |
| Inference | Propose `role += ['CHAMPION']` (don't silently add). |
| UX signal | Non-modal banner: "You've enabled Champion entries. Add Champion to your role?" [Yes] [Not now]. |
| Override | User can always edit `User.role` in Settings. Dismissing the banner sets `user.preferences.skipRoleInferenceUntil = now + 30d`. |

### 4.3 Sprint anchor inference

| Field | Value |
|---|---|
| Trigger | First compose for a user with `sprintAnchorDate === null`. |
| Inference | `sprintAnchorDate = Monday 00:00 of current ISO week, User.timezone`. |
| UX signal | Silent; `composerInputsSnapshot.explain` carries "Sprint anchor defaulted to Mon 2026-04-13." |
| Override | Settings → Sprint Anchor. Editing this is expensive (re-computes sprintPhase for all future compositions); show a confirm dialog. |

### 4.4 Project inference

| Field | Value |
|---|---|
| Trigger | `composeDaily` called and `activeKaizen === null` in input. |
| Inference | If exactly 1 `Kaizen` row in state `ACTIVE`, set `activeKaizen` to that row. If 0, skip Deep-block project payload (R3 doesn't fire). If > 1, abstain — user must pick. |
| UX signal | If inferred: `explain`: "Focused today's Deep blocks on K-042 (only active Kaizen)." If abstained: `ProjectPicker` mini-component on CycleCard. |
| Override | `ProjectPicker` switches active Kaizen for the day (composition-scoped) or permanently (via Settings). |

### 4.5 Timezone inference

| Field | Value |
|---|---|
| Trigger | User row created OR browser `Intl.DateTimeFormat().resolvedOptions().timeZone` differs from stored `User.timezone` on login. |
| Inference | First-login: read from browser, store. Later: if drift detected (travel), show a banner offering to switch. |
| UX signal | Banner: "You're in America/Chicago (previously America/Los_Angeles). Use new timezone for today's plan?" [Yes] [No — keep LA]. |
| Override | Settings → Timezone. |

Clock skew edge case: see §5.7.

### 4.6 Capacity inference

| Field | Value |
|---|---|
| Trigger | After 14 consecutive days of recorded `actualDurationMinutes`, compute `rollingAvg(actualDurationMinutes_total_per_day)`. |
| Inference | If `rollingAvg < 0.85 * dailyCapacityMinutes` for 14 d, suggest reducing capacity to match. Inverse: if user systematically runs over 10 % for 14 d, suggest raising. |
| UX signal | Weekly Reflection step 3: "You averaged 410 min / day over the last 14 days; dial capacity to 420?" [Accept] [Keep 480]. |
| Override | One-tap accept in the Weekly Reflection; or manual in Settings. |

### 4.7 Deep-slicing inference

| Field | Value |
|---|---|
| Trigger | User drags a Deep block between slices ≥ 3 times in a week (`CycleEdited` payloads with Deep-bucket moves). |
| Inference | Switch `deepSlicePreference` between `2x2h` and `1x4h` based on which pattern the user recreated most often post-compose. |
| UX signal | Weekly Reflection step 2: "You've moved Deep blocks 4× this week. Switch to 1×4h slicing?" |
| Override | One-tap. Settings → Preferences → Deep Slicing. |

### 4.8 Variance learning — ceremony shift

| Field | Value |
|---|---|
| Trigger | `VarianceLogged` with `kind === SKIPPED_NON_OPTIONAL` AND `catalogEntryId === 'ce_daily_standup'` AND `reasonCode === 'MEETING_CONFLICT'` 3 days in a row. |
| Inference | Shift Daily Standup anchor from 09:00 to 09:30 (configurable per-entry anchorTimeOverride). |
| UX signal | Banner on Weekly Reflection: "Standup has been skipping for MEETING_CONFLICT 3× this week. Shift to 09:30?" [Yes — permanent] [One week trial] [Keep 09:00]. |
| Override | Settings → Catalog → Daily Standup → Anchor time. |

### 4.9 CI rotation learning

| Field | Value |
|---|---|
| Trigger | At `pickCI()` time, when two candidates tie at priority 80, observe which one the user edits TO (post-compose) across ≥ 5 PROPOSED days. |
| Inference | Bump the user-preferred catalog entry's effective priority by +5 for this user only (stored on `User.preferences.pickCIBoosts: { [catalogEntryId]: +5 }`). |
| UX signal | Silent — reflects only in the `explain` string: "L&D #1 ranked ahead of PDCA #12 (your pattern)." |
| Override | Settings → Preferences → Reset learned boosts. |

### 4.10 Signals hydration

| Field | Value |
|---|---|
| Trigger | Before every `composeDaily`, `ComposerService.hydrateSignals(userId)` is called. |
| Inference | - `inboxOverThreshold`: count of unread items in the user-declared inbox ≥ `User.preferences.inboxThreshold` (default 20). - `documentAwaitingReview`: `ScheduledActivity` outputs flagged `awaitingReview: true` in the last 7 days. - `innovationStageReady`: `Kaizen.phase` transitions pending user action in catalog entries #7–#11. |
| UX signal | Silent. `explain` line when a signal triggers a block placement: "6S Email scheduled because inbox > 20." |
| Override | User disables a signal in Settings → Preferences → Signals. |

### 4.11 Override semantics

All overrides must:

1. Persist to `User` or `User.preferences`.
2. Trigger a single re-compose for today (idempotent).
3. Surface the change in the next Daily `explain[]`.
4. Never be silent beyond a single banner / toast.

---

## §5 — Graceful failure recovery

`composeDaily` can fail. Each failure mode + UX.

### 5.1 AD_HOC_OVERRUN

| Field | Value |
|---|---|
| Condition | `activeKaizen.projectType === 'AD_HOC'` AND `now > Kaizen.targetCloseDate` AND `state ∈ {DRAFT, ACTIVE, IN_REMEASUREMENT}`. |
| Composer behavior | **Still composes.** Not an InfeasibleResult. Emits `ProjectPaceWarning { kind: 'AD_HOC_OVERRUN' }` as a side-effect. |
| UX | Soft banner on CycleCard: "Kaizen K-042 is past its close date. Remeasure, extend, or abandon." [Remeasure] [Extend 7d] [Abandon] |
| Recovery | User picks one — each calls `KaizenService` and composer re-runs. |

### 5.2 OVER_CAPACITY (the common case)

| Field | Value |
|---|---|
| Condition | Non-optionals + phase ceremonies > capacity after R8 relaxConfigurable retry. |
| Composer behavior | Returns `InfeasibleResult` with `bucketShortfalls` populated. Emits `ComposerInfeasible`. |
| UX | CycleCard renders the `explain[]` lines, then the 4 `suggestedActions` as buttons IN ORDER per `ENGINE_DESIGN.md §1.8` / `ARCHITECTURE.md §4.7`: 1. RAISE_CAPACITY 2. REDUCE_EXTERNAL 3. SKIP_CEREMONY_WITH_REASON 4. DEFER_NON_OPTIONAL_TO_NEXT_DAY |
| Recovery | Each tap mutates the relevant input and re-invokes `composeDaily()`. Expected median: 1 action (usually SKIP_CEREMONY_WITH_REASON) + 15 s. |
| Side-effects | RAISE/REDUCE edit `User.dailyCapacityMinutes` or `Composition.externalMinutesToday`. SKIP logs `Variance { kind: SKIPPED_NON_OPTIONAL }` which feeds next-day `varianceQueue`. DEFER logs `Variance { kind: RESCHEDULED }`. |

### 5.3 NON_OPTIONAL_MISSING

| Field | Value |
|---|---|
| Condition | `CatalogEntry` seed is incomplete — a role-gated non-optional is missing from the catalog. System-level bug. |
| Composer behavior | Returns `InfeasibleResult` with `explain` line "Missing non-optional ce_{id}." and `suggestedActions: []`. |
| UX | CycleCard renders a small error: "Catalog is incomplete. Default plan applied." Under the hood, the engine falls back to the 4-2-2 skeleton (generic Deep + generic Comm + CI) composed from unbound entries. |
| Recovery | Logs a telemetry event `CatalogMissingEntry { roleGated, entryId }` for the ops team. User is unblocked. |

### 5.4 PROJECT_OVERPACKED / COMM_OVERPACKED / CI_OVERPACKED

| Field | Value |
|---|---|
| Condition | Too many optional picks for one bucket — e.g., 6 eligible CI entries but only 120 min CI target. |
| Composer behavior | Auto-trims the lowest-priority candidates to fit (ENGINE R4–R6). Does NOT return INFEASIBLE. |
| UX | `explain` line: "3 CI candidates trimmed to fit 120 min CI budget: #14 (pri 40), #22 (pri 35), #31 (pri 30)." Composer Explainer Agent surfaces this as a "See trimmed picks" expandable chip. |
| Recovery | User can promote a trimmed entry via the CycleCard's Catalog sidebar picker; composer re-runs. |

### 5.5 CI_UNDER_FLOOR

| Field | Value |
|---|---|
| Condition | Fewer enabled CI entries than the 120 min CI floor needs. |
| Composer behavior | Places what it has; leaves the rest of the CI bucket empty; adds `explain` line "CI bucket under-filled — consider enabling more entries." |
| UX | Banner: "Only 60 min of CI scheduled (floor: 120). Enable more in Catalog?" [Open Catalog] [Dismiss] |
| Recovery | User enables, composer re-runs on close of catalog modal. |

### 5.6 Catalog empty (new user)

| Field | Value |
|---|---|
| Condition | `catalog.filter(e => e.enabled).length === 0`. |
| Composer behavior | Does not call `composeDaily`; short-circuits at `ComposerService.getInput()`. |
| UX | `/today` empty state: "Welcome. Enable at least 3 catalog entries to build your first day." Links to `/catalog` with a FirstRunBanner. |
| Recovery | User enables entries; composer runs automatically on the first enablement that satisfies the 3-entry minimum. |

### 5.7 Clock skew

| Field | Value |
|---|---|
| Condition | `User.timezone !== Intl.DateTimeFormat().resolvedOptions().timeZone` OR `abs(localStorage.serverClockOffsetMs) > 5 * 60 * 1000`. |
| Composer behavior | Still runs but with the stored timezone. |
| UX | Banner at top of `/today`: "Your device is in America/Chicago but your plan is in America/Los_Angeles. Sync?" [Sync now] [Keep stored] |
| Recovery | Sync updates `User.timezone` and re-composes. Keep stored marks the banner dismissed for 24 h. |

### 5.8 Composer exception (unexpected)

| Field | Value |
|---|---|
| Condition | `composeDaily` throws (bug in payload selector, corrupted catalog entry). |
| Composer behavior | Caught by `ComposerService` try/catch. Logged. |
| UX | Fallback render: yesterday's composition with a banner "Couldn't rebuild today's plan. Using yesterday's shape." [Retry] [Start from scratch] |
| Recovery | Retry re-invokes; Start from scratch calls `composeDaily` with `priorCompositions = []`. |

### 5.9 Recovery matrix summary

| Failure | Degraded state | User action required | Time to recovery |
|---|---|---|---|
| AD_HOC_OVERRUN | Plan still valid | Optional | 0 s |
| OVER_CAPACITY | No plan | 1–2 taps | 10–30 s |
| NON_OPTIONAL_MISSING | Skeleton plan | None (ops fix) | 0 s |
| *_OVERPACKED | Plan trimmed | Optional | 0 s |
| CI_UNDER_FLOOR | Plan partial | Enable catalog | 30–60 s |
| Catalog empty | No plan | Onboarding | 2–5 min |
| Clock skew | Plan valid | Confirm timezone | 5 s |
| Composer exception | Yesterday's shape | Retry | 5 s |

---

## §6 — Agent orchestration

The 5 scripted agents (`AI_AGENTS.md §2`) each own one slice of the auto-populate experience. Engine-first: agents never write Composition state.

### 6.1 Agent roster

| Agent | Primary event trigger | Output kind | Timing in day flow |
|---|---|---|---|
| Planning Agent (2.1) | `CycleProposed` | RANKED_OPTION on configurable slots | Pre-render — flags questionable picks |
| Composer Explainer Agent (2.5) | `CycleProposed` | MICROCOPY per block | Pre-render — attaches "why" chips |
| Momentum Agent (2.2) | `ActivityStarted`, `ActivityStartedLate`, idle ticks | MICROCOPY, CONTEXT_CARD | During-day — in-block nudges |
| Context Agent (2.3) | `ActivityStarted` (or pre-start hover) | CONTEXT_CARD with prior artifacts | Pre-block — pulls up last PDCA tick, SIPOC, etc. |
| Reflection Agent (2.4) | `CompositionClosed`, `WeeklyReflectionCompleted` trigger | PRESELECT, MICROCOPY | End-of-day, end-of-week — feeds tomorrow |

### 6.2 Compose-time sequence (Planning + Explainer)

Both subscribe to `CycleProposed`. They run in parallel within a 50 ms budget (`AI_AGENTS.md §4.1`).

```
CycleProposed fires
├── Planning Agent reads composerInputsSnapshot.explain
│   ├── For each block where explain[i] contains 'RANK_TIE' or 'pri_delta < 10':
│   │   └── Emit AgentSuggestion(kind=RANKED_OPTION, basisEntityRefs=[block])
│   └── At most 3 per day (slot-ranking §4.2)
└── Composer Explainer Agent reads composerInputsSnapshot.explain
    ├── For each block, translate explain[i] via scripted table
    │   └── Emit AgentSuggestion(kind=MICROCOPY, target=blockId)
    └── No limit (one per block)
```

UI subscribes to the agent-suggestion stream and decorates the CycleCard. Planning suggestions render as visible "try alternative" chips on low-confidence blocks; Explainer suggestions render as subtle "why?" tooltips on every block.

### 6.3 During-day sequence (Momentum + Context)

```
09:00 ActivityStarted { scheduledActivityId: sa_standup }
├── Context Agent pre-fetches (at prior block close):
│   └── Last standup's outputArtifactRef → quick summary on CycleCard
└── Momentum Agent subscribes to ActivityStartedLate:
    └── If late > 5 min: MICROCOPY "Want to compress the rest of the morning?"

10:00 ActivityCompleted { sa_standup }
└── Context Agent pre-fetches for sa_deepblock_k042:
    └── Last DMAIC #34 tick artifact surfaces on CycleCard before start

10:30 Momentum checks: user still in Communication apps?
└── MICROCOPY "You've been in Comm 30 min — switch to Deep?"
```

### 6.4 End-of-day sequence (Reflection)

```
17:00 CompositionClosed
└── Reflection Agent subscribes:
    ├── R1 — Reads today's Variance[] → surfaces top 3 as friction candidates
    ├── R2 — If PdcaExperiment.consecutiveTargetHits === 3 → "Graduate K-042?" prompt
    └── R3 — Writes a preselect payload for tomorrow's composer (not a write to engine; a hint in varianceQueue metadata)
```

Then (under Strategy 5 or 6, §2): triggers tomorrow's pre-compute.

### 6.5 Inter-agent conflict resolution

Per `AI_AGENTS.md §4.2` slot-ranking:

1. **Invariant-first.** `ComposerInfeasible` suppresses all agents; user sees the guided remediation alone.
2. **One-per-slot.** A single block renders at most one agent output; order: Explainer < Planning < Momentum < Context. (Explainer is always there; higher-priority overrides the chip UI.)
3. **Abstain-first.** Confidence < 0.7 on an agent suggestion drops it (`AI_AGENTS.md §4.3`).

### 6.6 Telemetry

Every agent emits `AgentTelemetryEvent` at PROPOSED, DISPLAYED, and one of ACTED_ON / DISMISSED / EXPIRED (`AI_AGENTS.md §3.3`). Automation mechanics consume these to refine thresholds — e.g., if Planning RANKED_OPTION on CI rotation is ACTED_ON < 15 % of the time, the §3.5 auto-accept threshold for CI-heavy days loosens to 0.80.

### 6.7 Composite choreography

One-line summary of the full loop from pre-day to post-day:

```
17:00 (t-1) CompositionClosed → Reflection Agent → pre-compute trigger
            → composeDaily(tomorrow) → Composition PROPOSED persisted
            → CycleProposed fires → Planning + Explainer augment
            → (sleep until morning)
08:58 (t)   User lands /today → getActiveComposition returns PROPOSED
            → dayConfidence computed → band = AUTO_ACCEPT / PROPOSE / SOFT_SUGGEST
            → UI renders CycleCard in that band
            → (if AUTO_ACCEPT, state flips; UndoBanner 60s window)
09:00       ActivityStarted fires → Momentum + Context subscribe
            → Context pre-fetches artifacts; Momentum watches for drift
...
17:00 (t)   CompositionClosed → loop restarts
```

---

## §7 — Overnight vs on-demand: the MVP decision

### 7.1 Recommended choice

**MVP: Strategy 2 — On-demand-at-login.**

### 7.2 Rationale

| Axis | On-demand (2) | Overnight (1) | Winner |
|---|---|---|---|
| Latency to user | < 60 ms median | 0 ms | Overnight — but only by 60 ms |
| Infra cost | $0 (in SPA) | Server cron + job queue | On-demand |
| Shippable sprint | **1 sprint** (already in `DELIVERY_PLAN.md E1/E2`) | 3+ sprints (new infra epic) | On-demand |
| Handles offline users | Yes | No (cron fires server-side) | On-demand |
| Handles timezone drift | Yes (reads at request time) | Fragile (need per-user cron schedule) | On-demand |
| Handles Kaizen promotion overnight | Yes (reads latest state at compose time) | Requires invalidation hook | On-demand |
| Feels magical | No (60 ms skeleton) | Yes | Overnight |

Since composeDaily p95 is 1–2 ms (`ENGINE_DESIGN.md §1.9`), the "instant" feel is achievable entirely client-side. The infrastructure cost of overnight-precompute buys a 60 ms UX improvement — not worth 3 sprints.

### 7.3 Infrastructure cost

| Item | On-demand | Overnight |
|---|---|---|
| Server cron runner | — | Required (e.g., node-cron or cloud scheduler) |
| Job queue | — | Recommended (BullMQ / SQS) for retry/backoff |
| Timezone-aware scheduling | — | Required (24 time zones × per-user offsets) |
| Idempotency store | — | Required (don't double-compose a day) |
| Observability | Trivial (client error log) | Medium (job success metrics) |
| Total | **$0 / month** | **$50–$200 / month at 10 k MAU** |

### 7.4 Shippable sprint

On-demand ships in **Sprint 2** (`DELIVERY_PLAN.md E2 — Composer Service`). Already planned. No new epic needed. The work reduces to:

1. `ComposerService.getActiveComposition(userId, date)` — check localStorage first; if null, call `composeDaily`.
2. Wire it to `/today` route loader.
3. Render the < 300 ms skeleton while composing (already in `SCHEDULING_UX.md §3.3`).

### 7.5 Migration path to Strategy 6 (Hybrid)

If user research post-launch shows acceptance-rate dips on days with stale `varianceQueue` (morning recompute would have caught them), migrate to Strategy 6 in a point release:

1. Subscribe to `CompositionClosed` (already in `events.js`) → precompute tomorrow client-side.
2. Add `staleness = now - Composition.composedAt` check to `getActiveComposition` — if > 12 h, re-compose.
3. No schema change; only behavior change. Roll behind a feature flag `User.preferences.hybridPrecompute`.
4. A/B test acceptance rate for 2 weeks. Ship if ≥ +3 pp.

### 7.6 Non-recommendation: Overnight-precompute for MVP

Revisit overnight-precompute only if:

- We ship server-side persistence (`ARCHITECTURE.md §7.3` future state) — then free cron piggybacks on the server.
- Users report "the morning spinner feels slow" > 5 % of sessions.
- Acceptance rate plateaus below the 60 % blueprint target and we suspect staleness.

---

## §8 — Event choreography

Sequence from `/today` landing to Accept. Every event name verbatim from `/js/events/events.js`.

### 8.1 Happy path (PROPOSE band)

```
Step  Actor                       Action                                                    Event
----  --------------------------- --------------------------------------------------------  ------------------
 1    Router                      Navigate to /today                                        (none)
 2    Today.js                    Call ComposerService.getActiveComposition(userId, today)  (none)
 3    ComposerService             Read localStorage bamx:v1:compositions                    (none)
      ├─ Hit (from overnight/hybrid) → return existing PROPOSED
      └─ Miss → go to step 4
 4    ComposerService             Build ComposerInput (§1.1, §4.10 hydrateSignals)          (none)
 5    ComposerService             composeDaily(input) → Composition PROPOSED                (none)
 6    CompositionRepository       Write to bamx:v1:compositions                             (none)
 7    ComposerService             EventBus.publish                                          CycleProposed
 8    Planning Agent              Subscribed to CycleProposed → runs decision logic         (AgentSuggestion PROPOSED)
 9    Composer Explainer Agent    Subscribed to CycleProposed → translates explain[]        (AgentSuggestion PROPOSED)
10    ConfidenceScorer (this doc) Compute dayConfidence → band                              (none)
      ├─ AUTO_ACCEPT  → step 13
      ├─ PROPOSE      → step 11
      └─ SOFT_SUGGEST → step 11 (with "Suggested" badge)
11    UI                          Render CycleCard (PROPOSED)                               (none)
12    User                        Taps Accept                                               (none)
13    ComposerService             accept(compositionId) — atomic state flip                 (none)
      ├─ Composition: PROPOSED → ACCEPTED
      └─ All ScheduledActivity: PROPOSED → SCHEDULED
14    ComposerService             EventBus.publish                                          CycleAccepted
15    MetricsService              Subscribed to CycleAccepted → update adherence            (none)
16    UI                          Re-render CycleCard in ACCEPTED state, first block pinned (none)
17    User                        Taps Start on first block                                 (none)
18    ActivityService.start       Transition ScheduledActivity → IN_PROGRESS                ActivityStarted (+ ActivityStartedLate if > 5 min late)
19    Context Agent               Subscribed → pre-fetch artifacts                          (AgentSuggestion CONTEXT_CARD)
20    Momentum Agent              Watches idle time                                         (AgentSuggestion MICROCOPY if drift)
```

### 8.2 Auto-accept path (AUTO_ACCEPT band)

Step 10 short-circuits:

```
10   ConfidenceScorer   dayConfidence ≥ 0.85                                  (none)
10a  ComposerService    accept(compositionId, { auto: true })                 (none)
10b  ComposerService    EventBus.publish                                      CycleAccepted { auto: true }
10c  UI                 Render CycleCard in ACCEPTED with 60s UndoBanner      (none)
10d  User (optional)    Taps Undo within 60s                                  (none)
10e  ComposerService    revertAutoAccept(compositionId)                       (none)
     └─ ACCEPTED → PROPOSED; SCHEDULED → PROPOSED; publish CycleProposed again
```

No `CycleRejected` is emitted for Undo (user didn't reject; they opted for manual review).

### 8.3 Infeasible path

```
 5   ComposerService    composeDaily(input) → InfeasibleResult               (none)
 6   ComposerService    EventBus.publish                                     ComposerInfeasible
 7   MetricsService     Subscribed → increment over-schedule counter          (none)
 8   UI                 Render CycleCard in INFEASIBLE with suggestedActions  (none)
 9   User               Taps "Skip Mid-Sprint Review"                         (none)
10   VarianceService    log(Variance { kind: SKIPPED_NON_OPTIONAL })          VarianceLogged
11   ComposerService    Subscribed to VarianceLogged → re-run composeDaily    (none)
12   → loop to step 5 with updated input (variance queue feeds R2 next day)
```

### 8.4 Edit path

```
11   UI                 User taps Edit → navigate /today/compose             (none)
12   ComposeCanvas      Load PROPOSED as edit buffer                          (none)
13   User               Drags 2 blocks, saves                                 (none)
14   ComposerService    Apply edits atomically                                (none)
      ├─ Composition: PROPOSED → ACCEPTED { edited: true }
      ├─ Each changed ScheduledActivity emits Variance { kind: EDITED_FROM_PROPOSAL }
15   ComposerService    EventBus.publish                                     CycleAccepted { edited: true }
16   MetricsService     Subscribed → counts as accepted-with-edit             (none)
```

### 8.5 Pre-day precompute (Strategy 5/6, post-MVP)

```
17:00  CompositionClosed fires (today's cycle wrapped)                       CompositionClosed
 +50ms ComposerService  Subscribed → composeDaily({ date: tomorrow })        (none)
 +55ms ComposerService  Write tomorrow's Composition as PROPOSED              (none)
 +56ms ComposerService  EventBus.publish                                     CycleProposed
 +60ms Planning + Explainer augment; optional Notification "Tomorrow ready"  (none)
```

### 8.6 Event-name cross-reference (verbatim)

All event names used above are in `/js/events/events.js` lines 14–55. Namely: `CycleProposed`, `CycleAccepted`, `CycleEdited`, `CycleRejected`, `CompositionStarted`, `CompositionClosed`, `ActivityStarted`, `ActivityStartedLate`, `ActivityCompleted`, `VarianceLogged`, `ComposerInfeasible`. No new names introduced.

---

## §9 — Open questions for the coordinator

1. **Client-side vs server-side compute for MVP — confirmed?** This doc recommends client-side (Strategy 2). If the coordinator targets server-side infra in the next sprint, Strategy 1 (overnight-precompute) becomes cheap. Decision needed before E2 kicks off.

2. **Auto-accept threshold of 0.85 — acceptable risk of "wrong day auto-accepted"?** At 0.85 we expect 20–35 % auto-accept rate with < 10 % Undo. If product wants conservative launch (< 5 % Undo), bump to 0.90 and expect ~10 % auto-accept. A/B test plan?

3. **Do agents run client-side or server-side?** `AI_AGENTS.md §1.4` says scripted-heuristic in-SPA for MVP. Confirmed? If we later move LLM-powered variants server-side (Next), does the automation-mechanics layer change?

4. **Should `ScheduledActivity.auto: true` be a schema field?** Auto-accepted compositions should be distinguishable in telemetry. Options: (a) new boolean on `Composition`, (b) payload field on `CycleAccepted`, (c) inferred from Undo-window usage. Doc assumes (b); needs schema review.

5. **Hybrid precompute (Strategy 6) — ship as v1.1 or hold?** If we see < 60 % acceptance in MVP, Strategy 6 is the first lever. Gate with a feature flag or wait for dedicated epic?

6. **Does capacity-inference (§4.6) touch `User.dailyCapacityMinutes` directly, or only suggest?** User-declared capacity is sacrosanct per blueprint §3. Default: suggest via Weekly Reflection, never auto-apply. Confirm.

7. **How does Agent 2 coordinate with Agent 1's overrides?** When the user explicitly overrides a smart default (§4), does the system log it as a distinct event (`SmartDefaultOverridden`) or simply mutate `User.preferences`? New event would give us telemetry on which defaults are rejected.

---

## §10 — Appendix: decision cheat sheet

| Question | Answer | Source |
|---|---|---|
| When does the day appear? | On `/today` load (< 60 ms) | §2.2, §7.1 |
| What fires when a day is composed? | `CycleProposed` | §8, events.js:14 |
| When does auto-accept fire? | dayConfidence ≥ 0.85 AND ≥ 5 prior cycles AND not post-INFEASIBLE | §3.5–§3.6 |
| What event fires on auto-accept? | `CycleAccepted { auto: true, edited: false }` | §8.2 |
| What fires on INFEASIBLE? | `ComposerInfeasible` | §5.2, events.js:43 |
| Who writes Composition state? | Only `ComposerService` — agents never write | §1.5, `AI_AGENTS.md §1.1` |
| Where do the "why" strings come from? | `composerInputsSnapshot.explain[]`; Composer Explainer translates | §6.2, ENGINE §1.2 |
| What happens overnight in MVP? | **Nothing.** Compute runs at login. | §7.1 |
| What happens overnight post-MVP? | Client-side precompute on `CompositionClosed` (Strategy 6) | §7.5 |
| How does variance feed tomorrow? | `VarianceLogged` → `ComposerService` re-queues in next `varianceQueue` | ARCH §6.2 |
| How does PDCA 48h cadence survive? | Composer seeds on `PdcaExperimentOpened`; Reflection Agent on `PdcaTickCommitted` | ADHOC §2.B |
| What's the undo window? | 60 s post-auto-accept | §3.5 |
| How is capacity re-learned? | 14-day rolling avg; suggest at Weekly Reflection | §4.6 |
