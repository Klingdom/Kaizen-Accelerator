# METHODOLOGY_INPUTS — User-Input Methodologies for Auto-Populating a Cadence Day

**Author role.** Senior product designer + behavioral economist.
**Audience.** Coordinator (Phil) + sprint 5–6 UX/engineering leads.
**Scope.** CadencePlan MVP only. Weekly / Sprint / Monthly inherit the chosen methodology but are out of scope for the recommendation.
**Date.** 2026-04-18.
**Status.** DRAFT for coordinator decision.

---

## §1 — Scope

### §1.1 Frame

CadencePlan already has a deterministic composer. `composeDaily(input)` (`ENGINE_DESIGN.md §1.2`) is a 10-step algorithm that places non-optionals, reserves external minutes, packs buckets by rule, and emits either a filled `Composition(DAILY, PROPOSED)` or a structured `InfeasibleResult`. The §1.9 golden fixture passes end-to-end. The engine is not the constraint.

The constraint is the **user-input boundary**: what the user must hand the engine for the output to be "right" on the first try — right enough to hit the sub-60s Accept path (`SCHEDULING_UX.md §3.3`: median <45s, P75 <60s, P95 <90s), and right often enough to beat the §7.2 KPI of ≥60% composition acceptance rate without edits (`PRODUCT_BLUEPRINT.md §7.2`).

"Auto-populating" means: **the Cadence Day is visible and Accept-ready when the user lands on `/today`, without the user first answering questions.** Anything that forces a pre-Accept form — even a one-field form — pushes the median past 45s and makes Accept feel like confirmation of configuration, not commitment to work.

### §1.2 What "minimum input" means

Every composer input in `ENGINE_DESIGN.md §1.1` falls into one of four categories:

| Category | Examples | Who supplies it |
|---|---|---|
| **Always-present** | `userId`, `date`, `catalog` | System (session + seed). Never user-supplied. |
| **User-stable** | `role[]`, `dailyCapacityMinutes`, `deepSlicePreference`, `workDays`, `sprintAnchorDate` | User at onboarding; rarely changed. |
| **Per-day-variable** | `externalMinutesToday`, `signals.*`, `varianceQueue` | Candidate for today's input step. |
| **System-derived** | `sprintPhase`, `activeKaizen`, `priorCompositions` | Derived from state; user never touches. |

The product question is: **which per-day-variables must the user touch, and when?** Everything else is determined by state.

### §1.3 Why the composer already does the hard work

Given `role`, `capacity`, `activeKaizen`, `sprintPhase`, `varianceQueue`, and `catalog`, the composer can always produce *some* Accept-ready day — the Daily non-optional set (`ENGINE_DESIGN.md §3.4`: Standup, AM HVC, Post-lunch HVC, Deep Work aggregate, End-of-Activity Reflection) is placeable from seed data alone. The four generic catalog entries (`CATALOG_GAPS.md §H.2`: Deep Work — Project Task, Value-Added Communication, End-of-Activity Reflection, Weekly Reflection) plus the Lessons Learned generic guarantee the composer can always fill a bucket. The composer cannot *starve*; it can only be wrong.

The cost of being wrong is measured in edits. An edit rate ≤40% keeps median at 45s; at 25% wrong the flow holds; above 30% wrong the Accept button becomes noise (`SCHEDULING_UX.md §3.3` anti-patterns).

### §1.4 Thesis of this document

Brainstorm 7 input methodologies across the spectrum from "zero input" to "user configures everything". Rank by **cognitive ease × time-to-first-day × composer accuracy**. Recommend one primary methodology for MVP, plus graceful-degradation paths and a light "fine-tune" layer the user may opt into without being forced into.

---

## §2 — Candidate methodologies

### §2.1 M1 — Pure Auto

- **Name.** Pure Auto — user clicks one button, system composes from defaults.
- **What user does.** Land on `/today`. A `Composition(DAILY, PROPOSED)` is already rendered. User scans 8–10 blocks and taps Accept. Total user actions: **1 tap**.
- **What system does.** At session start (or overnight cron), `ComposerService.composeDaily({ role=User.role, capacity=User.dailyCapacityMinutes, externalMinutesToday=0, activeKaizen=lookup(state='ACTIVE'), sprintPhase=derive(User.sprintAnchorDate, date), varianceQueue=prior, catalog=enabled, signals.inboxOverThreshold=false, documentAwaitingReview=[], innovationStageReady=[] })`. Defaults everything per `ENGINE_DESIGN.md §1.1`.
- **Infrastructure required.** None beyond what §1.9 golden fixture exercises. Cron job (precompose overnight) is a 4h engineering task, optional.
- **Cognitive load.** **1/5.** Zero decisions before Accept.
- **Time to first cadence day.** **~12s** (2s load + 10s scan + tap). Beats §3.3 median of 45s handily.
- **Strength.** Fastest path; composer latency absorbed entirely by caching. Matches `SCHEDULING_UX.md §3.3` Step 2.
- **Weakness.** Cannot model today's known external meetings (`externalMinutesToday=0` default); if user has 3h of calls, the first edit is a capacity correction, not a content correction.
- **When it fails.** Heavy meeting days (>120 min external); user has 3+ active projects and composer-picked Deep payload is wrong one; on days the user works fewer hours (`User.dailyCapacityMinutes=480` but today=240).

### §2.2 M2 — Role Preset

- **Name.** Role Preset — "Today I'm a Facilitator" selector.
- **What user does.** Land on `/today`. See a one-row selector at top: `[ Practitioner ] [ Facilitator ] [ Leader ] [ Champion ]` (primary BAM roles from `GLOSSARY.md §7`). Tap one. Day composes. Tap Accept. Total: **2 taps**.
- **What system does.** Override `input.role = [tapped]`. Composer filters `catalog` by role-gating (`ENGINE_DESIGN.md §3.6`): Facilitator emphasizes Sprint Planning / Retrospective / 1:1s; Champion emphasizes DMAIC DAG payloads (#20–#41) and Kaizen burst entries (#42–#50); Leader emphasizes Quarterly Planning + Deep + Document Review; Practitioner uses the baseline 4-2-2.
- **Infrastructure required.** New UI: `RolePresetToggle` component on `/today` above BucketStrip. Backend: `User.role[]` already supports multi-role; add `User.roleModeToday` transient override (session-only, not persisted).
- **Cognitive load.** **2/5.** One explicit role decision; the labels are familiar from onboarding.
- **Time to first cadence day.** **~18s** (2s load + 10s scan + 3s role decision + 3s compose flash + tap).
- **Strength.** Handles the "today I'm wearing Hat A vs Hat B" reality; many BAM practitioners wear 2–3 roles on `User.role[]` but act as one per day.
- **Weakness.** Assumes role is the primary thing that changes day-to-day. For a single-role Practitioner, this adds a decision that produces the same output.
- **When it fails.** User's roles don't change day-to-day (which is the MVP primary persona, `PRODUCT_BLUEPRINT.md §6.1`); the "role" lens is wrong axis — energy, meetings, and active project dominate real variance.

### §2.3 M3 — Project-First

- **Name.** Project-First — user picks which active project(s) they're working on today.
- **What user does.** Land on `/today`. See an `ActiveProjectPicker` showing a tiled list: `[ Kaizen: Invoice Cycle Time — Accelerator Phase 2 ]` `[ DMAIC: Claims Defects — Analyze ]` `[ AD_HOC: Standup Length ]` `[ No project — generic Deep ]`. Tap one (or Cmd-click to multi-select up to 2). Day composes. Accept. Total: **2 taps**.
- **What system does.** Override `input.activeKaizen` with the tapped one(s). Composer calls `selectDeepPayload(input)` (`ENGINE_DESIGN.md §1.6`) which respects `phaseBinding` + `projectTypeBinding` + `dependsOn` DAG to pick the next eligible DMAIC / Accelerator / Kaizen-burst step.
- **Infrastructure required.** New UI: `ActiveProjectPicker` (list view of all `Kaizen` with `state ∈ {ACTIVE, IN_REMEASUREMENT}` + all `PdcaExperiment` with `state='ACTIVE'`). New field: `Composition.composerInputsSnapshot.todaysFocusKaizenIds[]` (already planned per composer snapshot contract).
- **Cognitive load.** **2/5.** A meaningful decision — but one the user already carries in their head.
- **Time to first cadence day.** **~22s** (2s load + 10s scan of project list + 5s decision + 2s compose flash + 3s accept).
- **Strength.** The most semantically correct input: Deep Work's content is what the user actually cares about. Directly serves `PRODUCT_BLUEPRINT.md §6.1` JTBD "Deep block linked to active Kaizen".
- **Weakness.** MVP is capped at **one** active Kaizen (`PRODUCT_BLUEPRINT.md §4.1` item 4); with one project the picker is a no-op. Picker earns its cost only at Next when cap=3.
- **When it fails.** User has zero active Kaizens (first week of product use, or between Kaizens); user has one active Kaizen but it's paused mid-Remeasurement — system must fall back to generic Deep Work.

### §2.4 M4 — Commitment-First

- **Name.** Commitment-First — user enters hours of meetings today.
- **What user does.** Land on `/today`. See a single field: **"Meetings today: [ _ ] hours"** with a quick-select `[0h] [1h] [2h] [3h] [4h]`. Tap one (or type). Day composes. Accept. Total: **2 taps**.
- **What system does.** Override `input.externalMinutesToday = hours × 60` (capped 240 per `ARCHITECTURE §5.5`). `computeBucketTargets(input)` (`ENGINE_DESIGN.md §2.1`) subtracts external from COMMUNICATION target (never below the 60-min floor, `GLOSSARY.md §8`). Composer packs Deep + CI around the reserved block.
- **Infrastructure required.** New UI: `ExternalMinutesField` with quick-selects. Backend: `externalMinutesToday` field already exists in `ComposerInput` (`ENGINE_DESIGN.md §1.1`). Zero new entities.
- **Cognitive load.** **2/5.** One decision, quantitative, familiar ("how many meetings today?").
- **Time to first cadence day.** **~20s** (2s load + 10s scan + 4s quick-select + 2s recompose + 2s accept).
- **Strength.** Hits the single biggest source of composer error (meeting days). Fully compatible with today's engine — the field already exists.
- **Weakness.** Asks the user to count meetings they could have imported from calendar (see M6). Low-information if user's meeting load is flat day-to-day.
- **When it fails.** User has 0 meetings most days (picks 0h every morning → friction); user has irregular meetings and rounds aggressively (picks "2h" for a 3.5h day → overpacks).

### §2.5 M5 — Energy-First

- **Name.** Energy-First — user reports high/medium/low energy.
- **What user does.** Land on `/today`. See three tiles: `[ HIGH ] [ MED ] [ LOW ]`. Tap one. Day composes. Accept. Total: **2 taps**.
- **What system does.** HIGH → place Deep block earliest (9–11am), use `deepSlicePreference='2x2h'`, CI duration 120 min. MED → Deep at standard 10–12/1–3, CI 90 min. LOW → Deep block shifts afternoon, `deepSlicePreference='4x1h'` (smaller slices), CI trimmed to 60 min, more CI is 6S Email / Document Review (easier-valence). `orderDay` heuristic (`ENGINE_DESIGN.md §1.7`) reads a new `energyHint` field.
- **Infrastructure required.** New UI: `EnergyHintToggle`. New composer input field `signals.energyHint ∈ {'HIGH','MED','LOW'}`. New heuristic rule in `orderDay`. Validated against §1.9 golden fixture (regression risk).
- **Cognitive load.** **2/5.** Low if user buys the premise; moderate if they don't ("what counts as high energy?").
- **Time to first cadence day.** **~18s** (2s load + 10s scan + 3s energy decision + 2s recompose + 1s accept).
- **Strength.** Behaviorally resonant (matches real variance in cognitive capacity); differentiator vs every other scheduler.
- **Weakness.** Self-report energy is noisy; tomorrow's high-energy user often confounds with "I had coffee". Invariant engine (`ARCHITECTURE §5.6`) still enforces 4-2-2 floor, so the actual Deep-minute count doesn't change — only placement.
- **When it fails.** Users who don't introspect energy (engineering persona often skips); users who report LOW every day → CI underfloor; correlation between energy and output is smaller than advertised in pop-psych.

### §2.6 M6 — Calendar-Driven

- **Name.** Calendar-Driven — system imports external calendar.
- **What user does.** One-time OAuth to Google / Microsoft. Daily: land on `/today`. Meetings are already pulled, external minutes already set, Day composed around them. Accept. Total on steady state: **1 tap** (the 2-tap cost lives in the OAuth-once).
- **What system does.** Calendar sync service runs at T–30 min (e.g., 8:30am for 9am day start). Fetches today's events. Sums non-free duration → `input.externalMinutesToday`. Optionally materializes named events as `ScheduledActivity(bucket=COMMUNICATION, sourceOfSchedule='CALENDAR_IMPORT')`. Composer packs Deep + CI around fixed blocks.
- **Infrastructure required.** **Heavy.** New service: `CalendarSyncService` (Google Calendar API + MS Graph). New entities: `CalendarBinding { userId, provider, tokenRef, lastSyncedAt }`. New events: `CalendarSynced`, `CalendarReservationPlaced`. OAuth surface + token rotation + error surfaces. Per `PRODUCT_BLUEPRINT.md §4.2`, explicitly **Next, not MVP**.
- **Cognitive load.** **1/5** steady-state (zero daily decisions); **3/5** first-use (OAuth + permission review).
- **Time to first cadence day.** **~12s** steady-state (equivalent to Pure Auto). First-time setup is a separate onboarding moment, ~90s.
- **Strength.** Fire-and-forget; highest accuracy on the single biggest error-source (meeting load); the "right answer" for the target persona who lives in Google/Outlook.
- **Weakness.** Not MVP per `PRODUCT_BLUEPRINT.md §5.2`. Enterprise SSO + auth permissions complicate ship timeline by 4–6 weeks. Not every user has a calendar (freelancers, students).
- **When it fails.** Calendar is lying (events marked "busy" the user ignores; events marked "free" the user attends); calendar lists travel / lunch / "focus time" that the composer should reclaim, not reserve; token expires mid-week; user's org blocks OAuth.

### §2.7 M7 — Yesterday-Similar

- **Name.** Yesterday-Similar — system copies yesterday's shape, adjusted for today's sprint phase + completed actions.
- **What user does.** Land on `/today`. See today's day pre-filled from yesterday's shape (same Deep payload if Kaizen has no completed action between days; same CI rotation shifted by `pickCI` rules). User sees a chip: "Copied from yesterday, adjusted 2 blocks". Scan. Accept or edit deltas. Total: **1 tap** happy path, **3–4 taps** on delta edits.
- **What system does.** `ComposerService` reads `priorCompositions[0]` (yesterday's Daily Composition) and carries forward the *activity selection*, then re-runs invariants + sprint-phase gating + dependsOn DAG. If yesterday's Deep payload step was completed, advance to next step. If any CI block rotated (per `pickCI` heuristic, `ENGINE_DESIGN.md §1.5`), rotate. Emit `why[]` entries for each diff.
- **Infrastructure required.** New heuristic: `composeDailyCarryForward(input, prior)`. Uses existing `priorCompositions` field in `ComposerInput`. No new entities. Moderate engineering: ~2 sprint-days.
- **Cognitive load.** **1/5** on stable days; **2/5** when the carry-forward logic produces a visibly different day.
- **Time to first cadence day.** **~14s** (2s load + 8s scan "this looks like yesterday" + 4s accept).
- **Strength.** Routine days are routine — most days the right plan is nearly the same plan. Behavioral economics: default-compliance is highest when default is recognizable.
- **Weakness.** Reinforces ruts. If yesterday was wrong, today is wrong + drift. Sprint-phase boundaries silently violate "similar to yesterday" (e.g., day 1 of a new sprint has Sprint Planning).
- **When it fails.** First-ever day (no prior composition); sprint boundaries (Mon Wk1 is not Fri Wk2); user just closed a Kaizen (yesterday's Deep payload no longer exists); user changed capacity / workDays / role overnight.

---

## §3 — Comparison table

| # | Name | Cognitive load (1=least) | Time to first day | Infrastructure maturity (MVP-ready?) | Best user | Worst user | Shippable sprint |
|---|---|---|---|---|---|---|---|
| M1 | Pure Auto | **1** | **12s** | **READY** — §1.9 fixture + defaults exist; zero new UI/service | Practitioner with steady schedule + one active Kaizen | User with volatile meeting load or no active Kaizen | **Sprint 5** |
| M2 | Role Preset | 2 | 18s | PARTIAL — needs `RolePresetToggle` + session-only override; no new entities | Multi-role user (Facilitator + Practitioner) | Single-role Practitioner (the MVP primary persona) | Sprint 6 |
| M3 | Project-First | 2 | 22s | PARTIAL — needs `ActiveProjectPicker`; uses existing `activeKaizen` field | Champion running DMAIC + Accelerator portfolio | New user with zero active Kaizens | Sprint 6 (limited value until Next's 3-Kaizen cap) |
| M4 | Commitment-First | 2 | 20s | **READY** — `externalMinutesToday` already an input; needs one form field | User with high-variance meeting days | User with flat meeting load (input is always 0) | **Sprint 5** |
| M5 | Energy-First | 2 | 18s | PARTIAL — needs `energyHint` signal + `orderDay` rule; regression risk | Practitioner with self-awareness of cycles | Engineering persona skeptical of "energy"; users who report LOW daily | Sprint 7 |
| M6 | Calendar-Driven | 1 steady / 3 first-use | 12s steady | **NOT READY** — explicit Next-not-MVP per `PRODUCT_BLUEPRINT.md §4.2 / §5.2` | Corporate user in Google/Outlook shop | Freelancer without org calendar; users who block OAuth | Sprint 9+ (Next) |
| M7 | Yesterday-Similar | 1 | 14s | PARTIAL — needs `composeDailyCarryForward`; uses existing `priorCompositions` | Routine-dominant user (80% of days look alike) | User on sprint/Kaizen boundary days | Sprint 6 |

**Reading the table.** The two fastest paths (M1 and M6) both have cognitive load 1 at steady state, but M6 is blocked on calendar integration which is Next, not MVP. The three MVP-ready candidates are M1, M4, and M7 (M7 needs 2 sprint-days of carry-forward logic). M2, M3, and M5 each add one decision and modest infrastructure but do not clearly beat M1 on cognitive load.

**Behavioral note (defaults as anchors).** In behavioral economics the well-known default-stickiness result (Madrian & Shea 2001, Johnson & Goldstein 2003) predicts that any methodology requiring a *pre-Accept* decision lowers completion rate vs. a methodology that puts the decision *after* Accept as an optional refinement. This favors M1-then-refine over any M2/M3/M4/M5 that gates on user choice before seeing the composed day.

---

## §4 — Hybrid recommendations

### §4.1 Hybrid A — "Zero-on-login, deepen later"

**Shape.** M1 (Pure Auto) is the front door. The day is Accept-ready on `/today` with zero required input. Below the QuickActionsBar (`SCHEDULING_UX.md §3.4`), a dismissible chip reads **"Fine-tune"**. Tapping it opens a drawer with four quick toggles: `Meetings today [0h/1h/2h/3h/4h]` (M4), `Active project [picker]` (M3), `Energy [HI/MED/LO]` (M5), `Role mode [P/F/L/C]` (M2). Any adjustment triggers a recompose in <300ms. If the user never taps Fine-tune, they get the defaults forever.

**Why.** Protects the sub-60s Accept path while giving power users a refinement surface. Puts the user in control without charging them cognitive rent for entering.

**Easiness.** 5/5. Default path is zero-decision.
**Feasibility.** 4/5. M1 ships Sprint 5; Fine-tune drawer ships Sprint 6 as the UI scaffold across M2–M5. M5 energyHint ships last (Sprint 7 per §3 table). Calendar (M6) slots in later as the fifth Fine-tune item or as the default source for "Meetings today".
**Shippability.** 5/5. MVP clean; each Fine-tune dimension can ship independently behind a feature flag.

**Rank: 1st.**

### §4.2 Hybrid B — "Project-first with auto-fill"

**Shape.** Monday morning (first login of the week): modal/strip asks "What are you working on this week?" — M3's `ActiveProjectPicker` gated to weekly cadence, not daily. User picks 1 project (or "No project — generic Deep"). For the rest of the week, Daily uses M7 (Yesterday-Similar) with the chosen project's phase-bound payload as Deep anchor. Tuesday–Friday are 1-tap Accept.

**Why.** Collapses M3's cost to once-per-week; M7 amortizes the choice across 5 days. Directly serves the Champion persona who carries one "project of the week" mental model.

**Easiness.** 3/5 on Monday (explicit project decision), 5/5 Tue–Fri.
**Feasibility.** 3/5. Requires `Composition(WEEKLY)` to carry a `weekFocusKaizenId` field; Weekly composer already ships MVP per `PRODUCT_BLUEPRINT.md §4.1` item 3.
**Shippability.** 3/5. MVP-possible but couples Daily to Weekly more tightly than today's composer does; violates cycle independence that keeps §1.9 fixture simple.

**Rank: 3rd.** Strong methodology but couples two cycles that should stay decoupled.

### §4.3 Hybrid C — "Calendar-native"

**Shape.** Once calendar integration is live (Next, per §5.2), M6 becomes the default. Pure Auto (M1) becomes the fallback for users without calendar connected. User onboarding offers "Connect Google/Outlook" as the primary affordance; skipping it does not block Accept — it falls back to M1 defaults plus an optional M4 "Meetings today" field.

**Why.** Matches the end-state product vision; minimizes cognitive load at steady state for the target enterprise persona.

**Easiness.** 5/5 when calendar is connected; falls to Hybrid A behavior when not.
**Feasibility.** 1/5 for MVP — calendar integration is explicitly excluded from MVP and lives in `PRODUCT_BLUEPRINT.md §5.2`.
**Shippability.** 2/5. Sprint 9+ at earliest; depends on OAuth hardening, provider API quotas, enterprise SSO complications.

**Rank: 2nd for end-state, not viable for MVP.** Promote Hybrid A for MVP; evolve to Hybrid C at Next.

### §4.4 Ranking by (easiness × feasibility × shippability)

| Hybrid | Easiness | Feasibility | Shippability | Product fit (MVP) |
|---|---|---|---|---|
| **A — Zero-on-login, deepen later** | 5 | 4 | 5 | **Rank 1 for MVP** |
| B — Project-first with auto-fill | 4 | 3 | 3 | Rank 3 (couples cycles) |
| C — Calendar-native | 5 | 1 | 2 | Rank 2 for end-state; not MVP |

---

## §5 — Recommended methodology for MVP

### §5.1 Chosen methodology

**Hybrid A — "Zero-on-login, deepen later"** where the primary path is **M1 (Pure Auto)** and the optional refinement surface exposes **M4 (Commitment-First)** first, then M3/M2/M5 progressively.

### §5.2 Rationale

1. **It ships in Sprint 5.** M1 requires zero new infrastructure; the §1.9 golden fixture already exercises the default-everything path. The Fine-tune drawer is a UI-only add that does not touch the composer.
2. **It defends the sub-60s Accept path.** Default path is 1 tap in ~12s, well under the 45s median target (`SCHEDULING_UX.md §3.3`). No required field means no bounce-at-form risk.
3. **It matches the primary persona.** The MVP primary persona is the BAM Practitioner with steady capacity and single active Kaizen (`PRODUCT_BLUEPRINT.md §6.1`). Their optimal input is *none*; their best day is a predictable 4-2-2 with Deep linked to the one active Kaizen.
4. **It degrades gracefully.** No active Kaizen → composer uses generic "Deep Work — Project Task" (`CATALOG_GAPS.md §H.2`). Volatile meeting day → user opens Fine-tune and adjusts M4 in 4 taps.
5. **It evolves into Hybrid C.** When calendar integration ships at Next, M6 slots in as the new default source for the M4 field; nothing about the UX shape changes.

### §5.3 What it looks like at 9am Monday

| Clock | User sees | User does |
|---|---|---|
| 0s | `/login` redirect to `/today`. Session cached. | — |
| 2s | Pre-composed Daily: `BucketStrip 240/120/120`. 8 blocks: 09:00 Daily Standup (15m, COMM), 09:15 AM HVC (60m), 10:15 Deep — Accelerator 2.3 Root Cause Analysis (120m), 12:00 Lunch, 13:00 Deep cont. (120m), 15:00 Post-lunch HVC (30m), 15:30 CI: PDCA Cycle (30m), 16:00 L&D Tick (60m), 16:30 End-of-Activity Reflection (1m). AdherenceDial reads 82% / 91% / +14%. | Scans. |
| 12s | Primary **Accept** button in thumb-reach. A secondary, dismissible chip near the QuickActionsBar reads **"Fine-tune (4 tweaks available)"**. | Taps Accept. |
| 12.1s | `Composition: PROPOSED → ACCEPTED`. First block (Standup) pinned with **Start** button. IntentionField visible. | — |
| 17s | IntentionField. | Types "block A13 follow-up". |
| 22s | — | Taps Start. Standup begins. |

**Median elapsed: ~22s for full "login → first block IN_PROGRESS".** Below the §3.3 Step 5 budget of ~15s for the Accept-path Start moment. Fine-tune never touched.

### §5.4 Infrastructure already in place

- `composeDaily(input)` — `ENGINE_DESIGN.md §1.2` (all 10 steps, passes §1.9 golden fixture).
- `computeBucketTargets` / `computeBucketFloors` / `computeBucketCeilings` — `ENGINE_DESIGN.md §2.1–§2.2`.
- Daily non-optional set — `ENGINE_DESIGN.md §3.4`.
- Generic catalog entries — `CATALOG_GAPS.md §H.2`.
- `ComposerInput` contract — `ENGINE_DESIGN.md §1.1` / `ARCHITECTURE.md §4.1`.
- `CycleCard` + `BucketStrip` + `QuickActionsBar` — `SCHEDULING_UX.md §3.4 / §3.5`.
- `CycleProposed` / `CycleAccepted` / `CycleEdited` events — `GLOSSARY.md §9`.
- Planning Agent hook (MVP scripted) — `AI_AGENTS.md §2.1` (fires on `CycleProposed`, not on user input).

### §5.5 Infrastructure still needed (Sprint 5–6)

**Sprint 5 (core).**
1. **Pre-compose cron** — overnight job runs `composeDaily` for each user so `/today` renders instantly at 9am. Optional but lowers P95 from 300ms to <50ms. 4h effort.
2. **Graceful-degradation fallback** — when `activeKaizen=null`, Deep payload defaults to generic `Deep Work — Project Task`. Already supported by `selectDeepPayload` fallback; verify test coverage.
3. **First-day experience banner** — `FirstRunBanner` (`SCHEDULING_UX.md §3.5` row 3.17) explains the 4-2-2 on day 1 only; dismissible.

**Sprint 6 (refinement surface).**
4. **`FineTuneDrawer` component** — slide-up drawer below QuickActionsBar. Four tiles: Meetings (M4), Energy (M5 — behind flag), Role mode (M2 — behind flag), Active project (M3 — gated on `Kaizen.state='ACTIVE'` existing).
5. **`ExternalMinutesField`** — quick-select `[0h][1h][2h][3h][4h]` writing to `input.externalMinutesToday`. Triggers recompose. 2h effort.
6. **Recompose latency budget** — every Fine-tune change must recompose + re-render in <300ms per `SCHEDULING_UX.md §3.3`.
7. **Telemetry** — `FineTuneOpened`, `FineTuneAdjusted { field, from, to }`, `RecomposeTriggered { reason }` (additive to the 25-event MVP catalog — see §7 open question).

### §5.6 First-day experience timeline (second-level detail)

| Time | Route | User action | System state |
|---|---|---|---|
| **Day 1 (first-ever login)** | | | |
| t=0s | `/onboarding` | Submits email; `workDays=Mon-Fri`, `dailyCapacityMinutes=480`, `deepSlicePreference='2x2h'`, `role=['PRACTITIONER']`, `sprintAnchorDate=today`. | `User` row created. `sprintPhase='SPRINT_1_MON_WK1'` derived. |
| t=45s | Redirects to `/today` | — | Cron has not run yet; composer runs on-demand. |
| t=45.3s | — | — | `composeDaily(input)` returns `Composition(DAILY, PROPOSED)` with generic Deep (no activeKaizen yet), seeded non-optionals. |
| t=45.5s | `/today` | Sees BucketStrip + 8 blocks + FirstRunBanner ("This is your 4-2-2 day — Deep 4h / Comms 2h / CI 2h. Tap Accept to begin."). | — |
| t=60s | `/today` | Taps Accept. | `CycleAccepted {edited: false}`. First block → `IN_PROGRESS`. |
| **Day 2+** | | | |
| t=0s | `/today` | — | Overnight cron has precomposed today based on yesterday's state + current `sprintPhase` + any `varianceQueue` items. |
| t=2s | `/today` | Sees today's composition, already scannable. | — |
| t=12s | `/today` | Accept (~85% of days) or Fine-tune (~15%). | See §5.3 flow. |

### §5.7 Graceful degradation

| Condition | Composer behavior | UI signal |
|---|---|---|
| No active Kaizen | Deep payload = generic `Deep Work — Project Task` | Chip: "No active project — pick one in /kaizen to fill Deep blocks with DMAIC/Kaizen steps" |
| First-ever user, no `priorCompositions` | Runs full §1.2 algorithm from seed catalog; no carry-forward | FirstRunBanner |
| `INFEASIBLE` returned | `UX_FLOWS §2.1` infeasible screen | Surfaces `result.suggestedActions[]` |
| User on reduced capacity day (e.g., medical appt) | Fine-tune → M4 "Meetings today: 4h" → buckets scale proportionally | Recompose <300ms; banner "Day rebuilt for 4h capacity" |
| Calendar says user is OOO (future — M6) | `externalMinutesToday=capacity`, composer emits no-ScheduledActivity day | `/today` shows empty-state with OOO chip |
| Sprint boundary (Mon Wk1) | Weekly composer wraps Sprint Planning (non-optional per `ENGINE_DESIGN §3.4` Sprint set — Next, not MVP); in MVP, Weekly composer places Sprint Planning manually | Chip: "New sprint starts today" |
| User rejected yesterday | `varianceQueue` contains the rejection; composer may carry CI rotation differently | Normal flow; variance surfaces in Weekly Reflection |

---

## §6 — BAM standard best-practice activities — how they surface

The methodology must ensure BAM standards (Standup, Deep anchors, CI rhythm, Weekly Reflection) appear **without the user requesting them**. This is what makes CadencePlan a standard-work product, not a calendar app.

### §6.1 Four tiers of surfacing

| Tier | Behavior | Example activities | Authority |
|---|---|---|---|
| **Non-optional** | Composer places regardless of input. User cannot delete. Skipping generates `Variance(reasonCode, kind='SKIPPED')`. | Daily Standup, AM HVC, Post-lunch HVC, Deep Work aggregate ≥ floor, End-of-Activity Reflection | `CATALOG_ENTRY.isNonOptional=true` frozen at seed; `PRODUCT_BLUEPRINT.md §3.4`; `ENGINE_DESIGN.md §3.4` |
| **Default-enabled, dismissible** | Composer places when applicable; user may swap for another same-bucket entry. | L&D Tick (#2), Document Writing (#1), Document Review (#4), 6S Email (#13 when inboxOverThreshold) | `CatalogEntry.isNonOptional=false` + `enabledForRole` |
| **Project-gated** | Only eligible when a matching `Kaizen.projectType` is active and `phaseBinding` matches `Kaizen.phase`. | DMAIC #20–#41 (projectTypeBinding='DMAIC'), Accelerator 0.1–4.6 (projectTypeBinding='KAIZEN_ACCELERATOR_30D'), Kaizen burst #42–#50 | `CatalogEntry.projectTypeBinding` + `phaseBinding`; `selectDeepPayload` filter |
| **Role-gated** | Only eligible for listed `User.role[]` values. | Sprint Planning (Facilitator), Quarterly Planning (Leader), DMAIC Gate Reviews (Champion + MBB) | `CatalogEntry.rolesApplicable` per `ENGINE_DESIGN.md §3.6` |

### §6.2 Non-optional set — placed by the composer, always

Per `ENGINE_DESIGN.md §3.4` and `PRODUCT_BLUEPRINT.md §3.4`:

| # | Activity | Bucket | Duration | Anchor | Authority |
|---|---|---|---|---|---|
| 1 | Daily Standup | COMMUNICATION | 15 min | 09:00 (role-dependent) | BAM ceremony, `GLOSSARY.md §4` |
| 2 | AM HVC (High-value Communication) | COMMUNICATION | 60 min | 09:15 | Blueprint §3.2 |
| 3 | Post-lunch HVC | COMMUNICATION | 30 min | 13:00 (or post-lunch) | Blueprint §3.2 |
| 4 | Deep Work aggregate ≥ 120 min floor (240 target) | PROJECT | 240 (2×2h or 4×1h by `deepSlicePreference`) | After morning comms | Blueprint §3.2; floors §5.2 |
| 5 | End-of-Activity Reflection (meta-slot) | CI | 1 min per activity | On close | `CATALOG_GAPS §H.2` |

Weekly non-optional (Weekly composer, `ENGINE_DESIGN §3.4`): 1:1 on Wed/Thu, Weekly Reflection on Fri PM, Mid-Sprint Review on Fri Wk1 (conditional on sprintPhase).

**Invariant.** `InvariantEngine.validateComposition()` rejects any proposed Composition missing a non-optional. The composer will emit `INFEASIBLE` before it emits an incomplete Composition. This is the structural guarantee that BAM standards appear.

### §6.3 Default-enabled dismissible — CI rotation

The CI 2h block rotates through a curated sequence per `pickCI` heuristic (`ENGINE_DESIGN §1.5`):

- Mondays: PDCA Cycle (#12) — opens the week's tick cadence.
- Tuesdays: L&D Tick (#2).
- Wednesdays: Document Review (#4) if documentAwaitingReview[] non-empty; else PDCA tick.
- Thursdays: 6S Email (#13) if inboxOverThreshold; else PDCA tick.
- Fridays: Weekly Reflection (20 min CI) + one more CI (L&D or Kaizen Action Work).

User can swap any day's CI choice for another same-bucket catalog entry via the Fine-tune drawer or the ComposeCanvas Edit path. `Variance(kind='EDITED_FROM_PROPOSAL')` logged per swap; Planning Agent P2 rule (`AI_AGENTS.md §2.1`) surfaces repeated-swap patterns.

### §6.4 Project-gated — DMAIC / Accelerator / Kaizen bursts

When `activeKaizen` is present and its `projectType + phase` match, Deep payload selection prefers the next eligible step from the phase-bound set:

- DMAIC: #20–#41 filtered by `phaseFor(step)` + `dependsOn` DAG + the §1.6 payload selection rules.
- 30-Day Accelerator: 31 bound entries from `CATALOG_GAPS §I.1`, filtered by `phaseBinding == Kaizen.phase` + phase-gate ordering.
- Kaizen Event burst: #42–#50 time-boxed to the event window.
- Kaizen 90: bindings from `CATALOG_GAPS §K.1`.

When no Kaizen active: generic `Deep Work — Project Task` (`CATALOG_GAPS §H.2`) fills Deep. User's ad-hoc project work is not lost — it's just not linked. Planning Agent P3 rule surfaces "unlinked Deep block while active Kaizen exists" (`AI_AGENTS.md §2.1`).

### §6.5 Role-gated — BAM ceremonies

Ceremonies only schedule for users whose `User.role[]` includes the applicable role (`ENGINE_DESIGN §3.6`):

| Ceremony | Role-gate | Cadence |
|---|---|---|
| Daily Standup | All — `PRACTITIONER|FACILITATOR|LEADER|CHAMPION` | Daily |
| Sprint Planning | `FACILITATOR|LEADER` | Mon Wk1 of sprint |
| Mid-Sprint Review | All | Fri Wk1 |
| Sprint Review + Retrospective | All | Fri Wk2 |
| Quarterly Planning | `LEADER|CHAMPION` | Quarter boundary |
| Weekly 1:1 | All | Wed or Thu |

Facilitator without Practitioner role still gets a 4-2-2 but their CI tends toward facilitation activities (1:1 prep, DMAIC Gate review prep).

### §6.6 Alignment with CATALOG_GAPS §H.2 and §3.4

The methodology respects the full §3.4 non-optional set and the §H.2 generics. No new catalog entries are introduced by this input methodology. No generic is replaced by an optional; no optional is promoted to non-optional. The user's "minimum input" never bypasses the non-optional set — it only influences the *configurable* slots (which CI today, which Deep payload today, where to anchor Deep).

### §6.7 What the user never has to ask for

Because of §6.2–§6.5, the user never types or taps to get:

- Standup on their day.
- Two HVC blocks.
- Deep Work totalling 4h.
- End-of-Activity Reflection at close of every block.
- Weekly Reflection on Friday.
- Lessons Learned on Kaizen close.
- Sprint Planning on Mon Wk1 if they're a Facilitator/Leader.
- A PDCA tick on their CI block when an active `PdcaExperiment` is in PLAN/DO/CHECK.

This is the product's "standard work out of the box" promise. The input methodology exists to influence the roughly 30% of the day that *is* configurable, without charging the user for the 70% that is not.

---

## §7 — Open questions for the coordinator

### §7.1 Calendar-or-manual for MVP external minutes

**Question.** Does MVP need calendar integration (M6), or is `externalMinutesToday` exposed via a Fine-tune field (M4) enough?
**Why it matters.** M6 is listed in `PRODUCT_BLUEPRINT.md §5.2` as Next, not MVP. If MVP users face frequent meeting-heavy days, M4-only may produce 20–30% edit rate on those days, killing the §7.2 acceptance KPI.
**Decision needed.** Approve M4-only for MVP with M6 deferred to Sprint 9+, OR accept a 6-week MVP delay to ship M6.

### §7.2 Is "active project" a first-class setting or derived from Kaizen state?

**Question.** Does `Composition.composerInputsSnapshot` need a new `todaysFocusKaizenId` field, or is it sufficient to derive from `Kaizen.state='ACTIVE'` (MVP single-active)?
**Why it matters.** MVP caps at one active Kaizen (`PRODUCT_BLUEPRINT.md §4.1` item 4). At one, the picker is a no-op. At three (Next), it becomes meaningful. Adding the field now is cheap; deferring may force a migration later.
**Decision needed.** Approve the field at MVP (cheap forward-compat) or defer until Next.

### §7.3 Multi-type active-project resolution

**Question.** If a user has multiple active `Kaizen` entities across types (AD_HOC + DMAIC + Accelerator), how does the composer pick today's Deep payload?
**Why it matters.** MVP single-active avoids this, but `PdcaExperiment` runs in parallel with `Kaizen` (per `GLOSSARY §10` entity table — they are different entities); a user can have one active Kaizen + multiple active PDCA experiments. Composer must pick which one's tick lands in CI today.
**Decision needed.** Specify the precedence rule. Default proposal: Kaizen Deep payload > active PDCA CI tick (cadence-due) > generic Deep / rotating CI.

### §7.4 Does the Fine-tune drawer count toward the sub-60s SLO?

**Question.** When a user opens Fine-tune and changes one field, does that count as "edited" (`CycleAccepted {edited: true}`) for acceptance-rate KPI calculation?
**Why it matters.** `PRODUCT_BLUEPRINT.md §7.2` target is ≥60% acceptance rate without edits. If every M4 "Meetings: 2h" tweak counts as an edit, the KPI will be underwater. Arguably M4 is *input*, not edit — it's setting the composer's parameters, not overriding its output.
**Decision needed.** Define "edit" as "a change to a ScheduledActivity after Accept" vs "a change to a ComposerInput before Accept". Proposal: Fine-tune adjustments pre-Accept do NOT count as edits; `CycleEdited` is only fired for ComposeCanvas drags/swaps.

### §7.5 First-day Deep payload when activeKaizen=null

**Question.** On Day 1 with no active Kaizen, should the composer offer an "intake" call-to-action alongside the generic Deep Work, or just schedule generic Deep silently?
**Why it matters.** Conversion to first active Kaizen within 14 days is a leading indicator (`PRODUCT_BLUEPRINT.md §7.3`). A subtle nudge from Day 1 ("Your Deep block is generic — pick a project type to link it") may lift this. An intrusive nudge kills Accept time.
**Decision needed.** Approve a dismissible chip ("Link this Deep block to a Kaizen") that renders only when `activeKaizen=null`, not a modal and not blocking Accept.

### §7.6 Overnight precompose — required or optional for MVP?

**Question.** Is the overnight cron (pre-compose tomorrow's day at 04:00 local) required for MVP, or can MVP ship with on-demand composition at `/today` load?
**Why it matters.** On-demand adds ~300ms to route enter. §3.3 Step 2 budget allows it. Precompose nets ~50ms which is P95-relevant but not median-relevant.
**Decision needed.** Defer cron to Sprint 7 unless P95 testing shows >500ms first paint.

### §7.7 Role mode toggle — MVP or Next?

**Question.** Does the Fine-tune drawer ship with all four M2/M3/M4/M5 affordances at Sprint 6, or only M4 (the highest-leverage one)?
**Why it matters.** Building four Fine-tune tiles doubles Sprint 6 UI work. M4 is the only one with guaranteed data-driven impact (meeting variance is the single biggest composer-error source). M2/M3/M5 are hypotheses.
**Decision needed.** Proposal: Sprint 6 ships M4 only. M3 lands Sprint 7 (once multi-Kaizen cap=3 arrives). M2 + M5 remain behind feature flags; measure acceptance-rate lift in A/B before general rollout.

---

## §8 — Appendix: cited sources

| Doc | Section | Used for |
|---|---|---|
| `PRODUCT_BLUEPRINT.md` | §3.2, §3.3, §3.4, §4.1, §4.2, §5.1, §5.2, §6.1, §7.2, §7.3 | MVP scope, JTBD, KPIs, non-optional set |
| `ENGINE_DESIGN.md` | §1.1, §1.2, §1.5, §1.6, §1.7, §1.9, §2.1–§2.2, §3.4, §3.6 | Composer input contract, payload selection, non-optional enforcement, role-gating |
| `SCHEDULING_UX.md` | §3.3, §3.4, §3.5 | Sub-60s flow targets, wireframes, components |
| `GLOSSARY.md` | §3, §4, §7, §8, §9, §10 | Vocabulary (Composition, non-optional, roles, capacity, events, entities) |
| `AI_AGENTS.md` | §2.1, §2.2 | Planning + Momentum agents fed by this methodology |
| `ADHOC_PDCA_STANDARD.md` | §1.C, §11.1 | Precedent for decision-tree UX on project selection |
| `CATALOG_GAPS.md` | §H.2, §H.3, §I.1, §K.1 | Generic entries, Accelerator catalog, Kaizen 90 bindings |
| `ARCHITECTURE.md` | §2.2, §2.3, §2.4, §4.1, §5.1–§5.6, §6.1 | Entity shapes, capacity rules, 4-2-2 invariant, event catalog |

---

## §9 — Summary card

| Field | Value |
|---|---|
| Recommended methodology (MVP) | **Hybrid A — "Zero-on-login, deepen later"** with **M1 Pure Auto** as default and **M4 Commitment-First** as first Fine-tune refinement |
| Cognitive load rating | **1/5** default path; 2/5 with Fine-tune used |
| Time to first cadence day target | **12s** default path; **20s** when Fine-tune used once |
| Composer changes required | **Zero** at MVP core; `externalMinutesToday` already in contract |
| Net new UI components (Sprint 5) | `FirstRunBanner` only (already spec'd in `SCHEDULING_UX §3.5`) |
| Net new UI components (Sprint 6) | `FineTuneDrawer`, `ExternalMinutesField` |
| Feature flags | `ft_energy_hint`, `ft_role_mode`, `ft_project_picker` — dark-launched behind Fine-tune tiles |
| Telemetry additions | `FineTuneOpened`, `FineTuneAdjusted`, `RecomposeTriggered` — subject to open question §7.4 |
| KPI baseline assumption | Acceptance rate ≥60% (daily) achievable with M1-only if composer accuracy holds on routine days (the ~70% case); M4 lifts meeting-heavy days |
| Degradation path | No Kaizen → generic Deep; INFEASIBLE → `UX_FLOWS §2.1`; heavy meeting day → M4; sprint boundary → Weekly composer anchors Sprint Planning |
| End-state evolution | Hybrid C (Calendar-native) at Next once `CalendarSyncService` ships |

---

## §10 — Appendix A: Per-methodology deep dives

### §10.1 M1 Pure Auto — expanded

**Default assumptions enumerated.** When the user provides no input, the composer uses these defaults (sourced from `ARCHITECTURE §4.1`, `ENGINE_DESIGN §1.1`, `CATALOG_GAPS §H.2`):

| Input field | Default | Source |
|---|---|---|
| `role[]` | Pulled from `User.role` (set at onboarding) | `User` entity |
| `dailyCapacityMinutes` | `User.dailyCapacityMinutes`, default 480 | Onboarding |
| `externalMinutesToday` | 0 | MVP default |
| `sprintPhase` | `phaseFor(User.sprintAnchorDate, date)` | Derived |
| `activeKaizen` | Lookup `Kaizen.state='ACTIVE'` single-row | MVP cap of 1 |
| `varianceQueue` | All unresolved `Variance` from prior day | Append-only |
| `catalog` | All `CatalogEntry` with `enabledForRole ∩ User.role ≠ ∅` | Role filter |
| `signals.inboxOverThreshold` | `false` | No email connector MVP |
| `signals.documentAwaitingReview` | `[]` | No signal source MVP |
| `signals.innovationStageReady` | `[]` | Innovation flow is Next |

**Why these defaults are safe.** Every field either (a) is derivable from `User` state alone, or (b) defaults to the zero-value which never triggers a non-optional. `externalMinutesToday=0` means the composer believes the user has no meetings beyond the HVC blocks; if wrong, the user sees the error immediately on `/today` and can open Fine-tune. The composer is never *wrong about standard work* (non-optionals are structural); it is only ever wrong about *elective content*.

**Failure mode 1 — new-user cold start.** Day 1 has no `priorCompositions`, no `activeKaizen`, no `varianceQueue`. Composer still produces a valid day: 5 non-optionals + generic Deep + default CI (PDCA or L&D Tick since no Kaizen payload exists). FirstRunBanner explains the 4-2-2.

**Failure mode 2 — returning user after vacation.** `priorCompositions[0]` is 14 days old. Composer ignores vacation-era state, uses current `sprintPhase` + current `varianceQueue`. User sees a day that looks like "first day back" not "day 15 of the old plan".

**Behavioral-economics note.** Default-stickiness favors M1: the single strongest behavior-shaping tool in digital products is the pre-filled option. Sunstein & Thaler (*Nudge*) and the aforementioned Madrian-Shea 401(k) enrollment studies both show default-adoption rates of 70–90% even when the default is suboptimal. In CadencePlan's case the default is designed-to-be-right, so adoption should be higher, not lower.

### §10.2 M4 Commitment-First — expanded

**Quick-select rationale.** The `[0h][1h][2h][3h][4h]` chips are chosen over free-text for two reasons:
1. **Anchoring.** Quick-select caps at 4h matches the 240-min `externalMinutesToday` hard cap (`ARCHITECTURE §5.5`). Free-text invites out-of-range inputs the composer would reject.
2. **Fitts's Law.** Five large tiles beat a number-pad keyboard on mobile (median target acquisition ~600ms vs ~1400ms for number entry + confirm).

**Recompose trigger flow.**
1. User taps `[2h]`.
2. Client writes `input.externalMinutesToday = 120`.
3. Client calls `ComposerService.composeDaily(input)` (in-process, <50ms).
4. `BucketStrip` and block list re-render with new targets: `PROJECT 240, COMMUNICATION 120-60=60, CI 120`. But wait — COMMUNICATION floor is 60 (`GLOSSARY §8` bucket floors), so the composer subtracts from HVC blocks, not below floor.
5. UI shows a short animation: blocks slide, new duration values update, a chip reads "Rebuilt for 2h of meetings".

**What M4 does not model.** The *when* of the meetings. M4 tells the composer the total; it does not place specific meetings at specific times. If the user has a 9:30 call and a 14:30 call both 60 min, M4 (which only sees "2h") may cluster Deep against the 14:30 call. M6 (Calendar-Driven) fixes this; M4 accepts the simplification as an MVP tradeoff.

### §10.3 M3 Project-First — expanded

**Picker contents.** The list surfaces:
- All `Kaizen` with `state ∈ {ACTIVE, IN_REMEASUREMENT}` — primary candidates.
- All `PdcaExperiment` with `state='ACTIVE'` — secondary candidates (these bind to catalog #12 for CI, not Deep).
- "No project — generic Deep" — always last.

**Composer binding.** Selected Kaizen sets `input.activeKaizen = selectedKaizen`. Selected PdcaExperiment writes into `input.signals` as a "PDCA tick due today" signal that `pickCI` (`ENGINE_DESIGN §1.5`) prioritizes.

**Why MVP value is limited.** With MVP single-active Kaizen (`PRODUCT_BLUEPRINT.md §4.1`), the picker has exactly one Kaizen + "None" + optionally N PdcaExperiments. This is a degenerate picker until the 3-Kaizen cap ships at Next. Recommendation: ship M3 behind flag at Sprint 7 when concurrency ≥2 arrives.

### §10.4 M5 Energy-First — expanded

**New composer signal.** `input.signals.energyHint ∈ {'HIGH','MED','LOW'} | null`. When null (default), `orderDay` uses canonical placement (Deep at 10:00 and 13:00). When set, `orderDay` shifts:

| energyHint | Deep anchor | deepSlicePreference override | CI duration |
|---|---|---|---|
| HIGH | 09:00–11:00 and 11:30–13:30 | `'2x2h'` | 120 min |
| MED | 10:00–12:00 and 13:00–15:00 (canonical) | honor `User.deepSlicePreference` | 90–120 min |
| LOW | 14:00–15:00, 15:30–16:30 | `'4x1h'` | 60 min (trimmed; offset protects CI floor of 60) |

**Invariant respect.** Under LOW, CI=60 hits the floor exactly (`GLOSSARY §8`). No invariant violation. PROJECT stays at 240 even under LOW — the engine will not let "I feel low-energy" erode Deep Work below target. That is the standard-work thesis.

**Behavioral caution.** Self-reported energy has poor test-retest reliability (ecological momentary assessment studies: r=0.3–0.5 day-to-day for same individual). Users may calibrate badly. Monitoring proposal: if a user reports LOW ≥4 days in a 7-day window, Planning Agent P1-style microcopy suggests a capacity review, not a continued LOW-shift (`AI_AGENTS.md §2.1`).

### §10.5 M6 Calendar-Driven — expanded

**Data flow.**
1. OAuth once at onboarding. `CalendarBinding` persisted.
2. At T–30min of day start (configurable), `CalendarSyncService.syncToday(userId)` runs.
3. Fetches events in [startOfDay, endOfDay]. Filters `status != 'cancelled'`, `transparency != 'transparent'` (free-marked), `responseStatus != 'declined'`.
4. For each event: either (a) sum into `externalMinutesToday`, or (b) materialize as `ScheduledActivity(sourceOfSchedule='CALENDAR_IMPORT', bucket='COMMUNICATION', plannedStartAt, plannedDurationMinutes)`.
5. Composer runs with enriched input. Blocks around the fixed calendar entries.

**Why option (b) is preferable at Next.** Materializing the event means the BucketStrip shows actual meeting names and times, not just "2h reserved somewhere in COMM". Cognitive load drops to zero; accuracy rises. Option (a) is the bootstrap for MVP+1.

**Error surfaces.**
- Token expired → chip on `/today`: "Reconnect calendar". Composer falls back to Pure Auto defaults.
- OAuth permission revoked by admin → chip + link to `/settings`.
- Calendar returns 429 → cached last sync used; chip "Calendar sync behind (last at 08:15)".

**Enterprise reality.** Many enterprises pre-gate Google/Microsoft third-party OAuth at admin console. MVP must ship without this dependency; M6 cannot be the primary path until admin-friendly deployment path exists (service-account or manual-ICS-import fallback).

### §10.6 M7 Yesterday-Similar — expanded

**Algorithm sketch.** `composeDailyCarryForward(input, prior)`:
1. Start from `prior.activities[]` filtered to non-closed configurable entries.
2. Re-apply non-optional set (they are always placed anew; not carried).
3. For each Deep block: if yesterday's linked DMAIC/Accelerator/Kaizen step is now CLOSED, advance the DAG pointer to the next eligible step; else carry the same step.
4. For each CI block: consult `pickCI` heuristic — if yesterday was `PDCA_TICK` and a tick is still due, carry; else rotate.
5. Validate with `InvariantEngine.validateComposition()`.
6. Emit `why[]` diff: "Carried Deep from yesterday (step not yet complete)", "Rotated CI from PDCA to L&D (tick closed)".

**Diff chip on `/today`.** "Same as yesterday, 2 adjustments (1 Deep advanced, 1 CI rotated)." Users who don't care don't read it. Users who do care see the diff.

**Anti-rut safeguards.**
- After 5 consecutive identical compositions, the Planning Agent may emit a MICROCOPY "Five days look identical; consider a capacity / role review" (matches `AI_AGENTS.md §2.1` P1 rule).
- Weekly composer at sprint boundary overrides M7 carry-forward with sprint-anchored ceremonies.
- A new active Kaizen always breaks carry-forward; Deep re-selects from the new project's payload.

---

## §11 — Appendix B: Infrastructure cost breakdown

### §11.1 Engineering effort estimate (person-days)

| Methodology | MVP path | Backend eng-days | Frontend eng-days | QA eng-days | Total | Notes |
|---|---|---|---|---|---|---|
| M1 Pure Auto | Core | 0.5 | 1 | 1 | **2.5** | Wire default-everything call; verify §1.9 fixture holds |
| M2 Role Preset | Fine-tune | 1 | 2 | 1 | **4** | `User.roleModeToday` transient field; toggle UI |
| M3 Project-First | Fine-tune | 2 | 3 | 1.5 | **6.5** | Picker UI + binding + multi-Kaizen groundwork |
| M4 Commitment-First | Fine-tune | 0.5 | 1.5 | 1 | **3** | Field + recompose wiring; no new entity |
| M5 Energy-First | Fine-tune | 2 | 1.5 | 2 | **5.5** | New `orderDay` heuristic; regression risk on §1.9 fixture |
| M6 Calendar-Driven | Next | 15 | 6 | 4 | **25** | `CalendarSyncService`, OAuth, token rotation, error surfaces |
| M7 Yesterday-Similar | Sprint 6 | 3 | 2 | 2 | **7** | `composeDailyCarryForward`, diff chip, sprint-boundary override |

### §11.2 Dependency matrix

| Methodology | Depends on | Blocks |
|---|---|---|
| M1 | §1.9 golden fixture (exists), `ComposerService` (exists) | Nothing |
| M2 | `User.role[]` (exists), `RolePresetToggle` (new) | Nothing |
| M3 | `Kaizen.state` (exists), multi-Kaizen cap ≥2 (Next) | Full value gated on Next |
| M4 | `externalMinutesToday` input (exists), `ExternalMinutesField` (new) | Nothing |
| M5 | New `orderDay` rule, new signal field | §1.9 fixture update |
| M6 | `CalendarSyncService` (new), OAuth infra (new), `CalendarBinding` entity (new) | OAuth admin policy, provider API quotas |
| M7 | `priorCompositions` (exists), `composeDailyCarryForward` (new) | Sprint-boundary handling |

### §11.3 Telemetry adds

Per `AI_AGENTS.md §3.3` `AgentTelemetryEvent` pattern, additive events for the chosen hybrid:

| Event | Payload | Fires when |
|---|---|---|
| `FineTuneOpened` | `{ compositionId, userId }` | User taps Fine-tune chip |
| `FineTuneAdjusted` | `{ compositionId, field, from, to }` | User changes any Fine-tune field |
| `RecomposeTriggered` | `{ compositionId, reason: 'FINE_TUNE'\|'VARIANCE'\|'MANUAL', elapsedMs }` | Composer re-runs pre-Accept |
| `CadenceAcceptedTiming` (already exists) | `{ cycleType, elapsedMsFromRouteEnter, edited, rejected }` | Per `SCHEDULING_UX §3.3` |

Subject to §7.4 open question (does Fine-tune count as edit).

---

## §12 — Appendix C: Behavioral-economics lens

### §12.1 Cognitive tax accounting

Every pre-Accept decision is a tax. Empirical bases:
- Choice overload literature (Iyengar & Lepper 2000; Scheibehenne et al. 2010 meta-analysis): decisions with >4 options reduce completion rate 5–20%.
- Pre-action friction studies (Thaler 1980; Shampanier et al. 2007): each additional action step in a flow drops completion 10–30%.
- Default-acceptance studies (Johnson & Goldstein 2003 organ-donation): default-stickiness 40–80% even for morally-charged decisions.

**Applied.** M1 imposes zero tax (0 decisions × 0 steps). M2/M4/M5 each impose one decision; if the option set is ≤4 (which they all are), the expected completion drop is ~5%. M3 with MVP single-Kaizen imposes a decision that is arguably fake (one meaningful option) — this is worse than no decision because it violates the user's expectation of consequence.

### §12.2 Commitment devices

CadencePlan is a commitment device in the Laibson-style dynamic-inconsistency sense: the Cadence Day is tomorrow-self's plan that today-self locks in. The Accept tap is the commitment moment. Behavioral insight: commitment strength rises when the commitment feels volitional and falls when it feels coerced. A pre-Accept form feels coercive ("answer these to continue"); a post-Accept Fine-tune feels volitional ("refine if you want"). Hybrid A preserves the volitional framing.

### §12.3 Anchoring in the Fine-tune drawer

The Fine-tune defaults themselves act as anchors. If "Meetings today" defaults to "0h", the mean user-chosen value skews toward 0 even when actual calendar load is higher (loss-aversion against over-reporting). To counteract this, the field should default to **null (unselected)** not 0; the user actively picks a value. This distinguishes "user has not told us" from "user has told us zero".

### §12.4 The "recognizability" heuristic

M7 Yesterday-Similar works because recognition is faster than recall. A returning user does not evaluate whether today's day is optimal; they recognize it as "yesterday shifted slightly" and move on. Recognition-based acceptance is cognitively cheaper by a factor of ~3x (signal-detection theory literature). The risk is that recognition short-circuits error detection — a wrongly-carried Deep payload goes unnoticed.

---

## §13 — Appendix D: Scoring rubric

### §13.1 Weighted scoring

Weights (sum to 1.0) reflect MVP priorities:
- Cognitive load: **0.30**
- Time to first day: **0.20**
- Infrastructure readiness: **0.25**
- Composer accuracy on routine days: **0.15**
- Composer accuracy on high-variance days: **0.10**

Per-methodology raw scores (1–5, 5 = best) and weighted totals:

| Methodology | Cog load | Time | Infra ready | Acc routine | Acc high-var | **Weighted total** |
|---|---|---|---|---|---|---|
| M1 Pure Auto | 5 | 5 | 5 | 4 | 2 | **4.25** |
| M2 Role Preset | 4 | 4 | 4 | 3 | 3 | **3.65** |
| M3 Project-First | 4 | 3 | 3 | 4 | 3 | **3.45** |
| M4 Commitment-First | 4 | 4 | 5 | 3 | 5 | **4.05** |
| M5 Energy-First | 4 | 4 | 2 | 3 | 3 | **3.25** |
| M6 Calendar-Driven | 5 (steady) | 5 | 1 | 4 | 5 | **3.80** |
| M7 Yesterday-Similar | 5 | 4 | 3 | 5 | 2 | **3.95** |

**Top three.** M1 (4.25) > M4 (4.05) > M7 (3.95). Hybrid A pulls M1 + M4 together, which matches the top two.

### §13.2 Sensitivity check

Re-weighting to stress high-variance day accuracy (0.30 weight) and de-emphasize cognitive load (0.15):

| Methodology | New weighted total |
|---|---|
| M1 Pure Auto | 3.55 |
| M4 Commitment-First | 4.00 |
| M6 Calendar-Driven | 4.30 |
| M7 Yesterday-Similar | 3.30 |

Under variance-heavy weighting, M6 wins and M4 beats M1. This justifies **Hybrid A's choice of M4 as the first Fine-tune affordance** (ahead of M2/M3/M5) — M4 is the highest-leverage variance-absorber short of calendar integration.

### §13.3 Why cognitive load weight is 0.30

The §7.2 acceptance rate KPI and the §3.3 sub-60s flow are both direct measurements of cognitive-load effects. Missing either of those targets blocks the MVP launch metric (§7.4). No other axis is as directly tied to a release-blocking signal.

---

## §14 — Appendix E: Worked first-week scenarios

### §14.1 Scenario — new practitioner, no active Kaizen

**Day 1 (Mon).** User onboards. Workday capacity 480. Role=Practitioner. No Kaizen, no prior compositions. `/today` shows: Standup 09:00 (15m), AM HVC 09:15 (60m), Deep — generic 10:15 (120m), lunch, Deep — generic 13:00 (120m), Post-lunch HVC 15:00 (30m), CI PDCA 15:30 (30m), L&D 16:00 (60m), Reflection slot. FirstRunBanner visible. User Accepts at t=18s (slightly slower than median due to banner read). Fine-tune untouched.

**Day 3 (Wed).** User has fallen into routine. `/today` is precomposed (cron or on-demand). Same shape, different CI (Document Review if #4 signal fires; else L&D). Accept at t=11s.

**Day 5 (Fri).** Weekly Reflection block appears at 16:00 (20 min, CI, non-optional for the week). User Accepts, runs day, completes Weekly Reflection which promotes one Kaizen candidate from friction signals. Day 6+ has an active Kaizen → Deep payload now links to that Kaizen's first eligible step.

### §14.2 Scenario — champion running Accelerator Phase 2

**Day 1 of Phase 2.** `activeKaizen.projectType='KAIZEN_ACCELERATOR_30D'`, `phase='PHASE_2'`. Composer selects Deep payload from the 7 Phase-2 Accelerator entries (`CATALOG_GAPS §I.1`): 2.3 Root Cause Analysis is next eligible (no dependsOn unmet). `/today` shows Deep blocks tagged with the Accelerator task name. User Accepts at t=12s.

**Day 3.** 2.3 closed yesterday; composer advances to 2.4 Design Future-State Workflow. Diff chip reads "Advanced Accelerator task 2.3 → 2.4".

**Day 5 (Fri).** Phase 2 gate activities (2.6, 2.7) are non-optional per §I.1. Composer places 2.7 Define Future-State SOPs as Deep. Weekly Reflection anchors Fri PM.

### §14.3 Scenario — facilitator with heavy meeting Monday

**Mon, sprint boundary (Mon Wk1).** Weekly composer anchors Sprint Planning (2h, Mon Wk1, role-gated to Facilitator|Leader). User's calendar (when M6 arrives) would pull 3 other meetings; at MVP the user opens Fine-tune, taps M4 `[3h]`. Composer recomputes: `COMMUNICATION` drops to the 60-min floor, `PROJECT` stays at 240 (protected), `CI` stays at 120. Sprint Planning at 10:00–12:00, Deep at 13:00–15:00 and 15:30–17:30 (shifted late), CI compressed to one 60-min L&D. User Accepts at t=24s (includes Fine-tune tap).

### §14.4 Scenario — user rejected yesterday

**Today.** `varianceQueue` contains yesterday's rejection with `reason='PLAN_MISMATCH'`. Composer inspects the variance, may rotate CI choice, may swap Deep payload if the variance cited the payload. Chip on `/today`: "Adjusted from yesterday's feedback — check CI block". User reviews the one flagged block. Accepts or opens ComposeCanvas for a fine edit.

---

## §15 — Appendix F: Alternatives considered and rejected

### §15.1 Rejected — "Pick your 3 priorities this morning"

A methodology where the user lists 3 priority items; composer treats priorities 1–3 as Deep payload anchors. **Rejected because:** (a) priority listing is a planning *cycle* (`Weekly Reflection`, `Sprint Planning`), not a daily input; doing it every morning duplicates weekly work; (b) list-entry is a high-friction text input in a sub-60s flow.

### §15.2 Rejected — "Pick your 1 goal today"

Single-field natural-language goal input. **Rejected because:** text parsing is brittle at MVP; the goal field doesn't map to any composer input; semantically redundant with `Intention` field on each ScheduledActivity (`GLOSSARY §10` entity table note).

### §15.3 Rejected — "Adaptive AI chat"

Conversational input: "Good morning, how are you feeling today?" LLM parses response into composer inputs. **Rejected because:** (a) MVP is scripted-heuristic for all agents (`AI_AGENTS §1.4`); LLM-powered input parsing is Next; (b) adds 10–30s to the sub-60s path for LLM latency; (c) privacy / telemetry complications at MVP.

### §15.4 Rejected — "Gamified streak picker"

Streak-based daily prompt ("You're on a 5-day streak — pick today's focus!"). **Rejected because:** gamification is explicitly excluded per `PRODUCT_BLUEPRINT.md §4.3`; streaks undermine the "honest variance / honest failure" product value; behaviorally, streak-based commitment performs poorly on routine-adherence tasks (vs ephemeral-commitment tasks like language learning).

### §15.5 Rejected — "Slack/Teams integration at login"

Pull recent Slack / Teams thread activity to infer priorities. **Rejected because:** Next, not MVP (`PRODUCT_BLUEPRINT.md §5.2`). Privacy and OAuth surface even heavier than Google Calendar. Signal-to-noise of Slack activity for scheduling is low.

---

## §16 — Closing remarks

The central move of this recommendation: **don't make the user answer a question to see their day.** The composer is already smart enough to produce an 80%-right day from state alone. Put the refinement affordances one tap away (Fine-tune drawer), not zero taps away (pre-Accept form). The behavioral payoff is that Accept stays a commitment gesture, not a confirmation gesture. The engineering payoff is that MVP ships with zero composer surgery — every moving piece except the overnight cron already exists in the §1.9 golden fixture or the UI scaffolding.

The design also protects the product's standard-work thesis: the BAM non-optional set appears regardless of what the user does or does not input. That is the product's core claim. The input methodology works around that claim, never through it.

One further observation. The **cognitive-ease gradient** from M1 to M6 is not monotonic — M6 (Calendar) has the lowest steady-state cost despite being not-MVP. The recommended sequencing (Hybrid A now → Hybrid C later) reflects this: ship the cheapest viable thing, evolve it toward the cheapest end-state when infrastructure allows. At no point does the user experience a regression in cognitive load.

Finally: the coordinator's seven open questions (§7) are listed in rough priority order. §7.1 (calendar-or-manual for MVP), §7.4 (does Fine-tune count as edit), and §7.7 (four Fine-tune tiles or one) are the three that materially affect Sprint 5–6 scope. The rest are resolvable inside the first sprint once framing is agreed.

End of document.
