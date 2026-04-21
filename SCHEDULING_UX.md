# BAM-X Kaizen OS — Scheduling UX (Phase 3)

Owner: UX Designer Agent
Status: Draft v0.3.0 — CadencePlan Phase 3. Extends `UX_FLOWS.md` v0.2.2, grounded in `PRODUCT_BLUEPRINT.md` v0.3 §4/§6, `ENGINE_DESIGN.md` v0.4.1 §1.8, `ARCHITECTURE.md` v0.6 §2.
Scope: MVP composer UX — the sub-60s accepted Cadence Day, drag-drop Compose canvas, new components, empty/error/onboarding states, and consolidated copy. This file is a behavior+copy spec, not a visual spec. Tables before prose. No filler.

> This document **extends** `UX_FLOWS.md`. Where a section cites a prior §, read the prior file for the full behavior — this file adds only the delta.

Vocabulary (canonical, do not substitute): **CadencePlan** (the composed output across a cycle), **Cadence Day/Week/Sprint/Month** (the 4 cycle instances), **The 4-2-2 Day** (PROJECT 240 / COMMUNICATION 120 / CI 120), **Deep Block** (a PROJECT-bucket ScheduledActivity), **Communication Block**, **CI Block**, **Accept/Edit/Reject**, **Auto-Plan**, **Regenerate**, **Compress Day**, **Protect Focus**, **Move Overflow**.

---

## Part 3.1 — Information Architecture & routes

Extends `UX_FLOWS.md` §1.2. Adds `/today/compose` (the explicit full-screen CadencePlan composer, distinct from the existing `/week/day/:isoDate/compose`), promotes `/settings` to a first-class nav entry, and adds `/insights` sub-routes already catalogued.

| # | Route | Purpose | Read / write | First-load behavior |
|---|---|---|---|---|
| 1 | `/today` | Default landing. Renders today's CadencePlan — either `PROPOSED` (Accept/Edit/Reject) or `ACTIVE` (first block pinned, Start). | Read-write | If composer output exists: render CycleCard. If not: fire Auto-Plan `<300ms` budget, show skeleton, then render. |
| 2 | `/today/compose` | **NEW.** Explicit full-screen drag-drop CadencePlan composer for today. Extends CycleCard into a ComposeCanvas with CatalogPicker rail and live BucketStrip. | Read-write | Entered via Edit button on `/today` OR via QuickActionsBar "Compose". Loads current day's `Composition(DAILY)`; creates a PROPOSED draft if none exists. |
| 3 | `/week` | Five Daily columns (Mon–Fri by default). Deep-minutes headline at top. | Read-write | Loads current week's `Composition(WEEKLY)` and its five Daily children. |
| 4 | `/catalog` | Browse + toggle `enabledByUser`. Non-optional entries locked. | Read-write | Groups by bucket, role filter applied from `User.roles`. |
| 5 | `/kaizen` | Single active Kaizen (MVP cap 1). | Read-write | Loads `Kaizen(state ≠ DRAFT-abandoned)` or empty state. |
| 6 | `/insights` | KPIs + Variance + Friction rolls. | Read-only | Loads latest `MetricsSnapshot`. |
| 7 | `/settings` | Role, capacity, workDays, deepSlicePreference, timezone, theme, notification prefs. | Read-write | Loads `User` row. |

**Default post-login route.** `/today`. No splash. No dashboard landing. The first interactive surface is the CadencePlan for today.

**Disabled-nav placeholders** (carried from `UX_FLOWS.md §1.3`): `/sprint`, `/month`, `/team`, `/catalog/editor`, `/integrations`. Each renders a single line: "Ships in Next."

**Why `/today/compose` is a separate route from `/week/day/:isoDate/compose`.** The weekly-day composer is scoped to edits inside a weekly context (planning tomorrow from Friday's Weekly view). The Today composer is scoped to "I'm here now and the proposal is wrong." Same underlying component (`ComposeCanvas`), different entry points, different analytics tagging.

**Navigation invariants.**
- Back button from any composer returns to the surface the user came from (`/today` or `/week`), never to `/catalog`.
- Insights never becomes the default landing, even if the user last visited it.
- Badge rules (carried): Kaizen shows "1" only in `IN_REMEASUREMENT`.

---

## Part 3.2 — Primary screens

Seven screens. One row per screen. Layout zones are named (header, primary, rail, footer); components are listed by name from `UX_FLOWS.md §3` + §3.5 additions below.

| Screen | Layout zones | Content | Components | States (E/L/S/Err) | Primary actions |
|---|---|---|---|---|---|
| **Today** (`/today`) | Header: AdherenceDial + DeliverablesRail | Primary: CycleCard (full width) | Footer: QuickActionsBar | BucketStrip (pinned top of primary), ScheduledActivityBlock[], FirstRunBanner (first 7 days) | AdherenceDial, BucketStrip, CycleCard, ScheduledActivityBlock, IntentionField, DeliverablesRail, QuickActionsBar, FirstRunBanner | E: "No day scheduled. Tap Auto-Plan." L: skeleton blocks. S: rendered day. Err: "Composer infeasible — see suggestions." | Accept, Edit (→ `/today/compose`), Reject, Auto-Plan, Start (on pinned block), Skip with reason |
| **Compose** (`/today/compose`) | Header: BucketStrip (live) + total capacity meter | Primary: ComposeCanvas (drop zones per bucket) | Rail (right): CatalogPicker | Footer: Save / Cancel + invariant banner | ComposeCanvas, CatalogPicker, BucketStrip, ScheduledActivityBlock (draggable), AutoPlanButton | E: never (entered with a PROPOSED or ACCEPTED draft). L: skeleton canvas. S: editable canvas. Err: "Can't save — 4-2-2 invariant violated." | Drag-reorder, Drag-rebucket, Replace via picker, Regenerate, Save, Cancel |
| **Week** (`/week`) | Header: Deep-minutes headline (e.g., "Deep minutes this week: 720 / 1200") | Primary: 5 Daily columns | Footer: Weekly Reflection CTA on Fri | CycleCard (miniature per day), BucketStrip (miniature stack), AutoPlanButton | E: "No week composed. Auto-Plan your week to see it here." L: 5 skeleton columns. S: 5 days rendered. Err: infeasibility banner on the failed day. | Auto-Plan week, open day composer, Weekly Reflection |
| **Catalog** (`/catalog`) | Header: role filter + bucket filter chips | Primary: grouped list by bucket | Rail: catalog detail (on hover/select) | CatalogPicker (read-mode), entry detail panel | E: "No catalog entries match filter." L: skeleton list. S: grouped list. Err: "Failed to load catalog. Retry." | Toggle `enabledByUser`, open detail, navigate to `/catalog/gaps` |
| **Kaizen** (`/kaizen`) | Header: Kaizen title + state chip | Primary: KaizenCard | Rail: PhaseStepper (Accelerator-only) + RoiPanel (Accelerator PHASE_4+) | KaizenCard, PhaseStepper, RoiPanel, ArtifactPreview | E: "No active Kaizen. Next candidate surfaces at Friday's reflection." L: skeleton card. S: card rendered. Err: "Failed to save Kaizen. Retry." | Lock baseline, Activate, Remeasure, Close, Abandon |
| **Insights** (`/insights`) | Header: three KPI tiles | Primary: trend strip (14d) | Sub-routes: `/insights/variance`, `/insights/friction` | AdherenceDial, VarianceLogEntry[], FrictionSignal list | E (pre-day-7): "Building your baseline. Numbers populate after day 7." L: skeleton numbers. S: KPIs + trend. Err: "Metrics temporarily unavailable." | Open variance log, open friction queue, Add correction |
| **Settings** (`/settings`) | Header: section tabs | Primary: form per section | Footer: Save / Revert | settings form fields | E: never. L: spinner. S: form loaded. Err: "Couldn't save — retry." | Save, Revert, Reset to defaults |

**Above-the-fold rule (all screens).** The user must see an actionable element without scrolling on a 1366×768 viewport. On Today, that is the BucketStrip + the first pinned ScheduledActivityBlock + Start button. On Compose, the BucketStrip + the first drop zone. On Week, the Deep-minutes headline + Monday column. On Kaizen, the KaizenCard state chip + primary action. On Insights, all three KPI tiles. On Settings, the role field. On Catalog, the first bucket group.

**Mobile collapse rules** (see §3.4 for diagrams).
- Today: AdherenceDial collapses to a single row, DeliverablesRail collapses into a dismissible chip, QuickActionsBar becomes a sticky bottom sheet.
- Compose: CatalogPicker rail slides in/out as a bottom sheet on tap.
- Week: 5 columns become a horizontal swipeable carousel; day labels pinned.
- Catalog: bucket chips become a dropdown; detail rail becomes a full-screen modal on tap.
- Kaizen: PhaseStepper becomes a horizontal scroll; RoiPanel stacks under KaizenCard.
- Insights: KPI tiles stack vertically.
- Settings: section tabs become a vertical accordion.

---

## Part 3.3 — The sub-60s flow (strategic contribution)

The north-star is: **a returning user logs in, glances at their CadencePlan, accepts it, and starts their first block** in under one minute. Median <45s, P75 <60s, P95 <90s. Below P95 is a signal the composer is wrong too often or the screen is too busy.

### Step-by-step journey (login → accepted → first block running)

| Step | Clock | Route | User sees | User does | System does | Budget |
|---|---|---|---|---|---|---|
| 1 | 0s | `/login` → `/today` | Auth redirect. | Types email + password (or SSO token cached). | Validates session, redirects. | Load budget: **2s** P95. |
| 2 | 2s | `/today` | Pre-composed CadencePlan already rendered. BucketStrip showing PROJECT 240 / COMMUNICATION 120 / CI 120. 8–10 blocks in plan order. AdherenceDial populated (if day 7+). DeliverablesRail showing at-risk items. QuickActionsBar pinned at bottom. | — | Reads `Composition(DAILY, state=PROPOSED)` from repo. Validates invariants. Renders. | **300ms** from navigation to first paint. Composer precomposed overnight via cron OR on-demand `<300ms` via `ComposerService.composeDaily()`. |
| 3 | 2–12s | `/today` | User glances at BucketStrip, scans 8–10 blocks, reads Deep block titles, notes linked Kaizen label if present. | Cognitive scan only. No input. | — | **~10s** for a trained user (targeted by compact layout + consistent block ordering). |
| 4a | 12s | `/today` | **Accept** button within thumb reach. | Taps Accept. | Atomic: `Composition: PROPOSED → ACCEPTED`, all children `PROPOSED → SCHEDULED`. Emits `CycleAccepted { edited: false }`. If `now >= startAt`, fires `CompositionStarted` → `ACTIVE`. | **100ms** to commit. |
| 4b | 12–45s | `/today/compose` | (alt) **Edit** opens ComposeCanvas. User drags one block, replaces one activity, saves. | ~2–4 drags + 1 Save. | Live invariant check on each drag. Save transitions to `ACCEPTED` with `edited=true` + `Variance { EDITED_FROM_PROPOSAL }` per edit. | Edit path budget: **P75 <30s**. |
| 4c | 12s | `/today` | (alt) **Reject** opens a confirmation with optional reason. | Taps Reject, confirms. | Transitions to `REJECTED`. Emits `CycleRejected`. User lands on empty-state Today. | Rejected path does NOT count in sub-60s success. |
| 5 | 15s (Accept path) | `/today` | Day is ACTIVE. First block (Daily Standup or first Deep block if no standup) pinned at top with **Start** button. IntentionField placeholder visible. | Types one-line intention. Taps Start. | Validates intention non-empty (required on non-optional). Transitions `SCHEDULED → IN_PROGRESS`. Emits `ActivityStarted`. | Start commit **<100ms**. |

**Target times (SLOs).**

| Percentile | Target | Composition |
|---|---|---|
| Median | <45s | 2s load + 10s scan + 3s tap Accept + 5s type intention + 1s Start. |
| P75 | <60s | Includes a quick Edit (1 drag or 1 replace) before Accept. |
| P95 | <90s | Includes a Regenerate, or a second Edit pass, or a Variance review. |

**Why this target is load-bearing.** If the composer is wrong >25% of the time, users fall into Edit 1-in-4 and the median slides to ~60s; at that point Accept becomes noise, not a decision. Blueprint §7.2 composition-acceptance KPI measures this directly.

### Longer cycles (not sub-60s, but bounded)

| Cycle | Target time (median) | Bound (P95) | Composition |
|---|---|---|---|
| **Week** (Monday accept or Friday recompose) | <3 min | <5 min | Glance Deep-minutes headline, 5 daily mini-strips, one Accept OR one day-level edit. |
| **Sprint** (every 2 weeks) | <5 min | <8 min | Review sprint-phase anchors, check Kaizen action forecast, one Accept. Sprint cadence ships in Next; in MVP this is a placeholder. |
| **Month** (every 4 weeks) | <10 min | <15 min | OKR check-in review + improvement-week anchor review + one Accept. Ships in Next. |

**Measurement.** Emit `CadenceAcceptedTiming { cycleType, elapsedMsFromRouteEnter, edited, rejected }` on every Accept/Edit/Reject. Analytics rolls up P50/P75/P95 per cycle type per user. A regression (>10% at P95) is a release-blocking signal.

### Budget breakdown (how the median 45s is spent)

| Slice | Budget | Notes |
|---|---|---|
| Auth redirect + first paint | 2s | Session cached; SSO token warm. Cold start caps P95 at 4s. |
| Cognitive scan (BucketStrip + 8–10 blocks) | 10s | Trained users land 4–8s; new users may exceed. Consistent block ordering (anchor-first, Deep next) keeps the scan predictable. |
| Decision (Accept / Edit / Reject) | 3s | Single tap for Accept. A two-option fork does not need a confirm dialog. |
| Intention typing | 5s | One-line text, ~6 words. Autocomplete from yesterday's intention on same-activity. |
| Start commit | 100ms | Local optimistic transition; server confirm is async. |

**Anti-patterns that break the target.**

- A "Good morning, <name>" dashboard that precedes `/today`. Forbidden.
- A modal explaining what changed overnight. Put it in a dismissible chip if needed.
- A multi-step Accept flow ("Are you sure?" → "Pick a priority" → Accept). Accept is one tap.
- A spinner longer than 300ms after route enter. If data isn't ready, render skeleton blocks and let the user scan the empty layout.

### Dropoff instrumentation

Emit `CadenceDropoff { cycleType, step, elapsedMs }` when the user exits without Accepting (tab close, route change, logout). The step field names where they left: `LOAD`, `SCAN`, `ACCEPT_TAP`, `EDIT_OPEN`, `EDIT_SAVE`, `INTENTION`, `START`. Dropoff analysis is the primary signal for composer quality.

---

## Part 3.4 — Wireframe descriptions

Text layouts. Zones, not pixels. No CSS. Above-the-fold is everything shown here; below-the-fold is scroll continuation.

### Today (`/today`)

```
+--------------------------------------------------------------+
|  [LOGO]  Today | Week | Catalog | Kaizen | Insights | Set.   |
+--------------------------------------------------------------+
| AdherenceDial: Adherence 82% | Acceptance 91% | Kaizen +14%  |
| DeliverablesRail: [PRFAQ due Fri] [Charter overdue] [...]    |
+--------------------------------------------------------------+
| BucketStrip:                                                 |
|   PROJECT     ============== 240/240  (actual 180 so far)    |
|   COMMUNICATION ======  120/120                              |
|   CI           ======  120/120                               |
+--------------------------------------------------------------+
| [PINNED] 10:15 PDCA Cycle (CI, 30m) >>> Intention: ____  START |
+--------------------------------------------------------------+
| 09:00 Daily Standup (COMM, 15m)           [closed]           |
| 09:15 Value-Added Comm (COMM, 45m)        [closed]           |
| 10:00 Deep Block — PRFAQ v2 (PROJECT 120m) [in-progress]     |
| 12:00 Lunch                                                  |
| 13:00 Deep Block — PRFAQ v2 cont. (PROJECT 120m) [sched.]    |
| 15:00 Value-Added Comm (COMM, 60m)        [sched.]           |
| 16:00 L&D Tick (CI, 30m)                  [sched.]           |
| 16:30 End-of-Day Reflection (CI, 15m)     [sched.]           |
+--------------------------------------------------------------+
| QuickActionsBar: [Auto-Plan] [Regenerate] [Protect Focus]    |
|                  [Compress Day] [Move Overflow] [Lock Block] |
+--------------------------------------------------------------+
```

**Above-the-fold:** nav, AdherenceDial, DeliverablesRail, BucketStrip, first pinned block with Start. Everything else scrolls.

**Mobile collapse:** AdherenceDial one-row; DeliverablesRail as a single dismissible chip; block list unchanged; QuickActionsBar pinned at bottom as a sheet.

### Compose (`/today/compose`)

```
+--------------------------------------------------------------+
|  < Back to Today                              [Save] [Cancel]|
+--------------------------------------------------------------+
| BucketStrip (live): PROJECT 240/240 | COMM 120/120 | CI 120/120 |
| Capacity: 480/480 min (external 0)                           |
+--------------------------------+-----------------------------+
| ComposeCanvas (primary)        | CatalogPicker (rail)        |
|                                |                             |
| [PROJECT drop zone]            | Filter: [Role] [Bucket]     |
|   [Deep Block 1 — drag]        | ─ PROJECT ─                 |
|   [Deep Block 2 — drag]        |   Deep Work (Project Task)  |
|                                |   Document Writing          |
| [COMMUNICATION drop zone]      |   DMAIC C&E Matrix (eligible)|
|   [Daily Standup 🔒]           | ─ COMMUNICATION ─           |
|   [Value-Added Comm — drag]    |   Daily Standup 🔒           |
|   [Value-Added Comm — drag]    |   Value-Added Communication |
|                                |   1:1 Meeting               |
| [CI drop zone]                 | ─ CI ─                      |
|   [PDCA Cycle 🔒]              |   PDCA Cycle 🔒              |
|   [L&D Tick — drag]            |   Kaizen Action Work        |
|   [End-of-Day Reflection 🔒]   |   Weekly Reflection         |
+--------------------------------+-----------------------------+
| Invariant banner: "4-2-2 ok"  (turns red on violation)       |
+--------------------------------------------------------------+
```

**Above-the-fold:** BucketStrip + first drop zone (PROJECT). Lock icons visible on non-optional blocks.

**Mobile collapse:** CatalogPicker becomes a slide-up sheet triggered by an "Add" button on each drop zone.

### Week (`/week`)

```
+--------------------------------------------------------------+
| Deep minutes this week: 720 / 1200 target (60%)              |
+--------------------------------------------------------------+
| Mon        | Tue        | Wed        | Thu        | Fri      |
| ====P 240  | ====P 240  | ===P  180  | ====P 240  | ==P  120 |
| ==C   120  | ==C   120  | ==C   120  | ==C   120  | ==C  120 |
| ==I   120  | ==I   120  | ==I   120  | ==I   120  | ===I 180 |
| [today]    |            |            |            | WR CTA   |
+--------------------------------------------------------------+
```

**Above-the-fold:** headline + 5 columns + Weekly Reflection CTA (Fri).

**Mobile collapse:** horizontal swipe between days, today highlighted.

### Kaizen (`/kaizen`)

```
+--------------------------------------------------------------+
| [Reduce cycle time in onboarding]        State: IN_REMEAS.   |
+--------------------------------------------------------------+
| KaizenCard (primary)           | PhaseStepper (Accel. only)  |
| Problem: …                     | [P0 ✓] [P1 ✓] [P2 ✓]        |
| Baseline: 40 (locked)          | [P3 current] [P4 locked]    |
| Goal: reduce to 20 by May 15   |                             |
| Actions: 3/5 done              | RoiPanel (PHASE_4+ only)    |
| Remeasurement: pending         | Cost $: ___  Benefit $: ___ |
| [Capture remeasurement]        | ROI: —                      |
| [Close Kaizen]  (disabled)     |                             |
+--------------------------------+-----------------------------+
```

**Above-the-fold:** title, state chip, primary action (Capture remeasurement or Close).

### Insights (`/insights`)

```
+--------------------------------------------------------------+
| [Adherence 82%]  [Acceptance 91%]  [Kaizen delta +14%]       |
+--------------------------------------------------------------+
| 14-day trend strip                                           |
+--------------------------------------------------------------+
| Recent variance (append-only)   |  Open friction signals     |
| - 2026-04-17 SKIPPED Standup    |  - MEETING_LOAD (3)        |
| - 2026-04-16 OVERRAN Deep Block |  - CONTEXT_SWITCH (2)      |
| [view all]                      |  [view all]                |
+--------------------------------------------------------------+
```

### Settings (`/settings`)

```
+--------------------------------------------------------------+
| [Profile] [Capacity] [Schedule] [Deep Slice] [Notifications] |
+--------------------------------------------------------------+
| Role: PRACTITIONER (multi: [+])                              |
| Daily capacity: 480 min                                      |
| Work days: Mon Tue Wed Thu Fri                               |
| Timezone: America/Los_Angeles                                |
| Deep slice: (●) 2×2h  ( ) 4×1h                               |
| Theme: (●) Auto  ( ) Light  ( ) Dark                         |
| [Save]  [Revert]                                             |
+--------------------------------------------------------------+
```

### Catalog (`/catalog`)

```
+--------------------------------------------------------------+
| Role: [PRACTITIONER] ▾   Bucket: [All] [PROJECT] [COMM] [CI] |
+--------------------------------------------------------------+
| ─ PROJECT ─                                                  |
|   [x] Deep Work — Project Task        (120 min)              |
|   [x] Document Writing                (60 min)               |
|   [x] DMAIC C&E Matrix                (120 min)              |
| ─ COMMUNICATION ─                                            |
|   🔒 Daily Standup                    (15 min) non-optional  |
|   [x] 1:1 Meeting                     (30 min)               |
| ─ CI ─                                                       |
|   🔒 PDCA Cycle                       (30 min) non-optional  |
|   [x] L&D Tracker                     (30 min)               |
+--------------------------------------------------------------+
```

---

## Part 3.5 — Components (delta over UX_FLOWS §3)

`UX_FLOWS.md §3` defines 12 components (3.1 CycleCard … 3.12 RoiPanel). This section adds 5 new components and extends 1. New components are 3.13–3.17.

### 3.13 AutoPlanButton

- **Purpose:** One-click trigger to compose (or recompose) the current cycle. Fires `ComposerService.composeDaily()` or `composeWeekly()` depending on the surface.
- **Binds to:** `ComposerService`, `User.dailyCapacityMinutes`, current `Composition` if any.
- **States:** E: "Auto-Plan" (idle). L: spinner + "Composing…" (max 300ms before visible). S: button hides or shows "Replan" after a successful compose. Err: "Compose failed — see suggestions." with a link to the infeasibility panel.
- **Emits:** `CompositionProposed`, `ComposerInfeasible` (downstream from the service).
- **Keyboard:** `Cmd/Ctrl+Enter` triggers Auto-Plan anywhere on `/today`.
- **Accessibility:** button role, aria-label "Auto-plan today", aria-live region announces "Day composed" on success.

### 3.14 QuickActionsBar

- **Purpose:** Row of six one-click actions at the bottom of `/today` (and as a bottom sheet on mobile). Each is a bounded operation that never navigates away.
- **Binds to:** current `Composition(DAILY)`, selected `ScheduledActivity` (for Lock Block / Move Overflow), `ComposerService`.
- **Actions (left→right):** Auto-Plan · Regenerate · Protect Focus · Compress Day · Move Overflow · Lock Block. Full specs in §3.7.
- **States:** E: all actions visible but disabled if no Composition exists. L: per-action spinner. S: actions respond; toast on success. Err: per-action toast with retry.
- **Emits:** action-specific events (see §3.7 per-action table).
- **Touch:** thumb-reach on mobile; 44×44px minimum target.

### 3.15 DeliverablesRail

- **Purpose:** Surface this cycle's at-risk deliverables (linked artifacts with due dates in the next 7 days that are unstarted or behind). Non-blocking context, not a scheduler.
- **Binds to:** `ScheduledActivity[]` where `outputArtifactRef.schema === 'DOCUMENT'` OR linked to an active `Kaizen` whose `actions[].dueDate <= now+7d` and `doneAt === null`. Also scans `Kaizen.phaseDefinitions` for accelerator phase deadlines.
- **Renders:** horizontal strip of chips, max 5 visible, "+N more" overflow link.
- **States:** E (no at-risk items): rail collapses to a single thin line "No deliverables at risk this week." L: skeleton chips. S: chips rendered, each links to its activity or Kaizen. Err: rail hides silently.
- **Emits:** nothing; click routes to the linked entity.

### 3.16 ComposeCanvas (extends CycleCard §3.1)

- **Purpose:** Full-screen drag-drop editor for a `Composition(DAILY)`. Replaces CycleCard's Edit mode inside `/today/compose` and `/week/day/:isoDate/compose`. Same underlying component; two entry points.
- **Binds to:** `Composition`, children `ScheduledActivity[]`, `CatalogPicker` output, live `invariantChecks`.
- **Zones:** three vertically stacked drop zones (PROJECT, COMMUNICATION, CI), each accepting draggable blocks. Non-optional blocks carry a lock icon and refuse removal; they accept reorder within bucket only.
- **States:** E: never (entered with a PROPOSED draft). L: skeleton drop zones. S: editable. Err (invariant violation): banner on top "4-2-2 violated — <specific>", Save disabled.
- **Emits:** `CycleEdited` on save (with list of edited activity IDs), `CycleAccepted` on save if user also chose Accept.
- **Keyboard:** see §3.6 for full keyboard alternative (Tab to block, Space to grab, arrows to move, Enter to drop).

### 3.17 FirstRunBanner

- **Purpose:** Onboarding nudge rendered at the top of `/today` for the first 7 days after account creation. Gives the user one next step at a time.
- **Binds to:** `User.createdAt`, day count, onboarding state (from `localStorage`).
- **Renders:** a thin banner with a single sentence + a primary CTA. Different message per day (see §3.9). Dismissible per-day only; returns next day unless onboarding is fully complete.
- **States:** E (onboarding complete): never renders. L: hidden. S: rendered with message for current day. Err: hidden silently.
- **Emits:** `OnboardingStepCompleted { step }` on CTA tap; `OnboardingDismissed { step }` on × tap.

### Components carried unchanged from UX_FLOWS §3

`CycleCard (3.1)`, `BucketStrip (3.2)`, `ScheduledActivityBlock (3.3)`, `CatalogPicker (3.4)`, `IntentionField (3.5)`, `ReflectionSheet (3.6)`, `WeeklyReflectionWizard (3.7)`, `KaizenCard (3.8)`, `AdherenceDial (3.9)`, `VarianceLogEntry (3.10)`, `ArtifactPreview (3.11)`, `RoiPanel (3.12)` — see `UX_FLOWS.md §3` for full specs. Component count is now 17 (12 existing + 5 new). `ComposeCanvas` extends `CycleCard` rather than replacing it; CycleCard still owns the read-only Accept/Reject surface on `/today`.

---

## Part 3.6 — Drag/drop interactions (extends UX_FLOWS §4.2)

Context: `UX_FLOWS.md §4.2` defines the core rules (lock icons on non-optionals, bucket-boundary validation, snap-back on invalid drop, live BucketStrip). This section specifies the interaction details the prior doc left open.

### Pointer interactions

| Phase | What the user sees | What the system does |
|---|---|---|
| Idle | Block renders with a drag handle on the left edge. Cursor: `grab` on hover. | — |
| Mousedown on handle | Cursor: `grabbing`. Block becomes semi-opaque (0.6). A ghost of the block follows the cursor. The origin slot shows a dashed outline ("will return here if cancelled"). | Dispatches `dragstart`; computes valid drop targets based on bucket-boundary rules. |
| Hover over valid drop target | Target zone highlights with a 2px border in the bucket's accent tone. A thin horizontal blue line shows exact insertion point. BucketStrip preview updates live (ghost minutes). | Runs `InvariantEngine.validateComposition()` on the preview state. |
| Hover over invalid drop target | Target zone highlights red. Tooltip appears near cursor: "Can't drop here — <specific reason>". No insertion line. BucketStrip preview does NOT update. | Preview refused; live validation fails. |
| Mouseup on valid target | Block slides into slot (150ms). Ghost dismissed. BucketStrip commits preview state. | Fires `ScheduledActivityMoved { from, to }` locally; no persistence until Save. |
| Mouseup on invalid target | Block snaps back to origin with a small shake animation (200ms). Tooltip persists 2s then fades. | No state change. |
| Escape key during drag | Block snaps back to origin. | Drag cancelled. |

### Snap grid

All blocks align to a **15-minute snap grid** in the composer. Dragging partially through a slot snaps to the nearest 15-min boundary. Intra-bucket reorder respects block ordering rules from `ENGINE_DESIGN.md §1.7` (anchors stay anchored: Daily Standup first Communication, End-of-Day Reflection last CI).

### Ghost preview rules

- Ghost follows cursor at 50% opacity.
- Ghost carries the block's bucket accent color.
- BucketStrip renders a "pending" overlay in a dashed stroke showing post-drop minutes.
- On invalid hover, ghost persists but BucketStrip overlay is hidden.

### Keyboard alternative (full parity)

| Key | Behavior |
|---|---|
| `Tab` / `Shift+Tab` | Move focus between blocks. Focus ring visible. |
| `Space` | Grab focused block. Announces via aria-live: "Deep Block 1 grabbed. Use arrow keys to move." |
| `↑` / `↓` | Move grabbed block within its bucket. Announces each position. |
| `←` / `→` | Move grabbed block across bucket boundaries (if valid). |
| `Enter` | Drop block at current position. Announces: "Dropped in PROJECT at slot 2." |
| `Escape` | Cancel grab. Block returns to origin. |
| `Delete` | Remove block (only if configurable, not non-optional). Confirms with inline prompt. |
| `R` | Replace focused block via CatalogPicker (opens picker with focus). |
| `Cmd/Ctrl+S` | Save composition. |
| `Cmd/Ctrl+Z` | Undo last move (within composer session only). |

### Touch support

| Gesture | Behavior |
|---|---|
| Long-press (300ms) on block | Activates drag mode. Haptic tick if supported. |
| Drag finger | Ghost follows finger; BucketStrip updates live; valid/invalid highlighting identical to pointer. |
| Lift finger on valid target | Drop commits. |
| Lift finger on invalid target | Snap back + tooltip (2s). |
| Two-finger tap during drag | Cancel drag (Escape equivalent). |

### Snap-back tooltip text (by violation)

| Violation | Tooltip |
|---|---|
| Would push PROJECT below 240 floor | "Can't drop here — PROJECT would fall to <N> min (needs 240)." |
| Would push COMMUNICATION below 60 floor | "Can't drop here — COMMUNICATION would fall to <N> min (needs 60)." |
| Would push CI below 60 floor | "Can't drop here — CI would fall to <N> min (needs 60)." |
| Would push bucket above ceiling | "Can't drop here — <bucket> would hit <N> min (ceiling <C>)." |
| Would push total over capacity | "Can't drop here — day would total <N> min (capacity <C>)." |
| Would remove a non-optional | "Daily Standup is non-optional. It can be reordered but not removed." |
| Would break anchor ordering | "Daily Standup anchors the first Communication slot. Move it within COMMUNICATION only." |

All tooltips ≤ 20 words, name the specific minute, name the rule.

### Multi-block selection (planned for Phase 4; stub in MVP)

MVP supports single-block drag only. Planned extensions — surface in Settings as "preview features" but disabled in MVP:

- Shift-click to range-select multiple blocks within a bucket.
- Cmd/Ctrl-click to pick non-contiguous blocks.
- Drag selected set as one group; drop target validates total minutes fit.
- Bulk Replace: replace N selected blocks with one CatalogPicker selection (bulk-distribute minutes across slots).

MVP rationale: single-block drag covers >90% of observed edits in the BAM internal pilot; multi-select adds complexity without a matching user-benefit in MVP scope.

### Persistence semantics

Drag actions are NOT persisted to the server until Save is tapped. The composer holds a local edit buffer. Refreshing `/today/compose` discards unsaved drags. A dirty-buffer banner renders at the top of Compose: "Unsaved changes" if any drag has happened since last save. Attempting to navigate away triggers a browser beforeunload prompt: "Leave without saving?"

On Save, atomicity rules (from `UX_FLOWS §4.1`): all edits commit as one transaction. If any child fails validation on write, the whole save rolls back and the dirty buffer is retained with an inline error at the failing block.

---

## Part 3.7 — Quick actions (the 6 one-clicks)

Each action is a bounded operation. No wizards. Outcomes are reversible within 10s via a toast Undo. Actions are rendered left→right in `QuickActionsBar` (§3.14).

| Action | Trigger | Preconditions | System does | Emits | Undo? |
|---|---|---|---|---|---|
| **Auto-Plan** | Button tap on `/today` or Keyboard `Cmd/Ctrl+Enter` | No `ACTIVE` composition exists, OR user wants to discard current PROPOSED and recompose. | Calls `ComposerService.composeDaily({ userId, date: today })`. If result is PROPOSED: replaces prior PROPOSED (if any). If INFEASIBLE: renders the guided-remediation panel per `ENGINE_DESIGN.md §1.8`. | `CompositionProposed` or `ComposerInfeasible` | No (trivially re-run) |
| **Regenerate** | Button tap | A PROPOSED composition exists; user wants a different shape. | Same as Auto-Plan but appends `regenerateSeed` (`prior.id`) to `composerInputsSnapshot.regenerationHistory`. Composer uses the seed to diversify non-anchor choices. | `CompositionRegenerated { priorCompositionId, newCompositionId }` | Yes (10s toast: "Regenerated. Keep old plan?") |
| **Protect Focus** | Button tap (or context menu on a Deep block) | Active PROPOSED or ACCEPTED day with at least one Deep Block. | Marks all PROJECT-bucket blocks as "focus-protected" for today only: interruption-warning threshold (`UX_FLOWS §4.7`) lowers from 5 min to 1 min; Start-Communication-anyway prompt becomes blocking (requires reason code) instead of soft. | `FocusProtectionEnabled { compositionId, duration: 'TODAY' }` | Yes (toast: "Focus protection on until end of day.") |
| **Compress Day** | Button tap | Day's total planned minutes ≤ 60% of capacity, OR user wants to end early. | Composer re-runs with `compressTarget = now + remainingMinutes*0.7`. Shortens configurable block durations proportionally (never below catalog min). Non-optional durations untouched. | `CompositionCompressed { compositionId, fromMinutes, toMinutes }` | Yes |
| **Move Overflow** | Button tap on a specific block (context menu) OR QuickActionsBar with a selected block | Selected block is configurable AND day is at capacity AND tomorrow's PROPOSED composition exists. | Removes block from today's composition, queues it on tomorrow's `varianceQueue` with `kind: RESCHEDULED` and priority flag. Re-validates today. | `ScheduledActivityMoved { from: today, to: tomorrow }`, `VarianceLogged { kind: RESCHEDULED }` | Yes (10s toast: "Moved to tomorrow. Undo?") |
| **Lock Block** | Context menu on a block | Block is in PROPOSED or SCHEDULED state. | Sets `ScheduledActivity.locked=true`. Locked blocks are not moved by Regenerate / Compress / Move Overflow. Lock is per-day; cleared on day close. | `ScheduledActivityLocked { id }` | Yes (toggle) |

**Rules common to all actions.**

1. No action navigates away from `/today`. If a sub-view is needed (e.g., the infeasibility panel), it renders as an inline section, not a route change.
2. Every action emits a toast with a 10s Undo handle. After 10s, the operation is durable.
3. Actions disabled when preconditions fail render a tooltip on hover: "<reason>" (≤ 20 words).
4. Touch target minimum 44×44px; keyboard accelerators published in Settings → Keybindings.
5. No action mutates an `ACTIVE` composition's `SCHEDULED` blocks if their `plannedStartAt` is within 15 minutes of now — those are locked by clock.

### Conflict matrix (which actions can stack)

| Active state | Auto-Plan | Regenerate | Protect Focus | Compress Day | Move Overflow | Lock Block |
|---|---|---|---|---|---|---|
| No Composition | yes | n/a | n/a | n/a | n/a | n/a |
| PROPOSED | yes (replaces) | yes | yes | yes | n/a (tomorrow not composed) | yes |
| ACCEPTED | yes (confirm) | yes | yes | yes | yes | yes |
| ACTIVE (first block not started) | yes (confirm) | yes | yes | yes | yes | yes |
| ACTIVE (mid-day) | yes (confirm + re-pack remaining) | yes (same) | yes | yes (remaining only) | yes | yes |
| CLOSED | n/a (day is over) | n/a | n/a | n/a | n/a | n/a |

A "confirm" marker means a 5-word modal: "Replace current plan? <N> edits will be lost." On active mid-day use, re-pack applies only to remaining blocks; closed and in-progress blocks are immutable.

---

## Part 3.8 — Empty states

Two rows per screen: first-time-user state (day 1) vs mid-usage-empty state (e.g., day 45 with no active Kaizen). One-line encouragement, no consulting voice, primary action named.

| Screen | First-time state | Mid-usage empty state |
|---|---|---|
| Today | **Copy:** "Welcome. Tap Auto-Plan to compose your first day." **Action:** [Auto-Plan my first day] | **Copy:** "No day scheduled. Auto-Plan, or add activities from the Catalog." **Actions:** [Auto-Plan] [Add from Catalog] |
| Compose | **Copy:** "Drag blocks between buckets. Lock icons mean non-optional." **Action:** [Got it] (dismisses the one-time tip) | **Copy:** "No blocks yet. Add activities from the Catalog rail." **Action:** [Add first block] |
| Week | **Copy:** "No week composed yet. Start with today, and we'll fill the week next." **Action:** [Compose today first] | **Copy:** "Week not composed. Auto-Plan the week." **Action:** [Auto-Plan week] |
| Catalog | **Copy:** "The catalog holds every standard activity. Toggles control which show up in your days." **Action:** [Show enabled only] | **Copy:** "No entries match this filter." **Action:** [Clear filter] |
| Kaizen | **Copy:** "No Kaizen yet. Candidates surface at Friday's reflection." **Action:** [Learn how Kaizen works] (→ help) | **Copy:** "No active Kaizen. Next candidate surfaces Friday." **Action:** [View candidate queue] |
| Insights | **Copy:** "Building your baseline. Numbers populate after day 7." **Action:** (none — informational) | **Copy:** "No data in this range." **Action:** [Change range] |
| Settings | — (Settings is never empty) | — |

**Copy rules.** No "!", no "rockstar", no emoji, ≤ 20 words. Each has exactly one primary action. Encouragement, not praise.

### Loading vs empty distinction

Loading state = we are fetching data; skeleton UI. Empty state = data returned, there is nothing to show. Never conflate. A spinner that persists >300ms on an empty dataset is a bug.

| Screen | Loading visual | Empty visual |
|---|---|---|
| Today | 8–10 shimmer block placeholders, BucketStrip shimmer | Single card centered, primary CTA |
| Compose | Drop zones outlined, CatalogPicker rail skeleton list | Drop zones outlined with "Add first block" prompt in PROJECT zone |
| Week | 5 column skeletons | Single card spanning full width |
| Catalog | Skeleton list (8 rows × 3 buckets) | Centered card with [Clear filter] |
| Kaizen | Skeleton card | Centered card with [Learn how Kaizen works] |
| Insights | Skeleton KPI tiles (3) | Grey tiles with "—" placeholder and below-the-fold explanation |
| Settings | Spinner on Save button only; form always renders | never empty |

### Error recovery inside empty states

If a screen hits an error (network / infra), the empty state is replaced with an error state, not layered on top. Error states always expose one primary action: Retry. A failed Retry 3× in a row surfaces: "Still failing. Contact support or come back later." with a link to the status page.

---

## Part 3.9 — Onboarding flow

Six screens. Total time target <5 min. Each screen has one question, one CTA, and an always-visible Skip (except the first real day).

| # | Screen | What user sees | What user does | Next |
|---|---|---|---|---|
| 1 | **Welcome** | "BAM-X composes your day from a catalog of standard activities. You accept, edit, or reject each day. It takes 45 seconds most mornings." CTA: [Set up my profile]. | Taps CTA. | Screen 2. |
| 2 | **Role** | "Which best describes your role? You can change this later." Options: Practitioner / Facilitator / Leader / Champion. CTA: [Continue]. | Picks one. | Screen 3. |
| 3 | **Capacity** | "How many minutes per day do you want to plan?" Slider 240–600, default 480. Side-note: "Most users land between 360 and 480." CTA: [Continue]. | Sets value. | Screen 4. |
| 4 | **Deep slice preference** | "How do you prefer to slice your Deep Work bucket?" Options: (●) 2×2h (default) / ( ) 4×1h. Small-print: "2×2h is recommended for knowledge work. Change this anytime." CTA: [Continue]. | Picks one. | Screen 5. |
| 5 | **Catalog preview** | "Here are the non-optional activities that anchor every day. The rest are optional and enabled by default." List: Daily Standup, End-of-Day Reflection, Weekly Reflection (Fri), PDCA Cycle, [plus your role's defaults]. CTA: [Looks good]. | Taps CTA. | Screen 6. |
| 6 | **Sample day** | "Here's a composed sample day based on what you just told us. Try clicking around. Nothing saves yet." Renders a read-only CycleCard with mock data. CTA: [Compose my real first day]. | Taps CTA. | `/today` with first real Auto-Plan running. |

**Post-onboarding.** `FirstRunBanner` takes over for days 2–7 with one nudge per day:
- Day 2: "How did yesterday land? Check your adherence in Insights."
- Day 3: "Friday's Weekly Reflection is where Kaizens are born. You'll try it this week."
- Day 4: "Skipped a block yesterday? That's fine — variance log is append-only, not a report card."
- Day 5: "Weekly Reflection is ready. 20 minutes, guided, DMAIC."
- Day 6: "Kaizen draft created? Lock the baseline before activating."
- Day 7: "You've hit day 7. Adherence numbers populate now. Keep going."

**Skip behavior.** Skipping onboarding at any step defaults all values, routes to `/today`, fires Auto-Plan, renders FirstRunBanner on day 1 with: "Skipped setup — you can tune settings anytime in Settings."

---

## Part 3.10 — Settings model

Single-user MVP. One form, seven sections. Defaults below match `ARCHITECTURE.md §2.3` and `PROJECT_TYPE_30D_KAIZEN.md` where applicable.

| Setting | Type | Default | Notes |
|---|---|---|---|
| **Profile** | | | |
| `name` | string | "" | Required. |
| `email` | string | "" | Required; readonly after first save. |
| `roles` | multi-select | `['PRACTITIONER']` | Canonical role set per ARCHITECTURE §2.3. |
| **Capacity** | | | |
| `dailyCapacityMinutes` | int (240–600) | 480 | 8h default. |
| `externalMinutesToday` | int (0–240) | 0 | Per-day override on Composition, not on User. |
| **Schedule** | | | |
| `workDays` | ISO day[] | `[1,2,3,4,5]` | Mon–Fri. |
| `sprintAnchorDate` | date | first Monday after signup | Drives sprint-phase computation. |
| `timezone` | IANA string | detected from browser | Editable. |
| **Deep Slice Preference** | | | |
| `deepSlicePreference` | enum | `'2x2h'` | `'2x2h' \| '4x1h'`. Default per ARCHITECTURE §9 item 14. |
| **Theme** | | | |
| `theme` | enum | `'auto'` | `'auto' \| 'light' \| 'dark'`. |
| `density` | enum | `'comfortable'` | `'comfortable' \| 'compact'`. |
| **Notifications** | | | |
| `notifyOnBlockStart` | boolean | true | Fires a desktop/browser notification at `plannedStartAt`. |
| `notifyOnReflectionPending` | boolean | true | Fires at 15 min after block close if reflection still pending. |
| `notifyOnWeeklyReflection` | boolean | true | Fires Fri 14:00 local. |
| **Advanced** | | | |
| `autoComposeOvernight` | boolean | true | If true, composer runs at 03:00 local for today. |
| `showWhyChips` | boolean | true | Controls visibility of Composer Explainer chips on blocks. |

**Reset to defaults.** Footer button with confirmation: "Reset all settings to defaults? This cannot be undone." Does not delete user data (compositions, reflections, Kaizens).

**Keybindings (read-only list in Settings → Advanced).**

| Binding | Action |
|---|---|
| `Cmd/Ctrl+Enter` | Auto-Plan |
| `Cmd/Ctrl+S` | Save (in Compose) |
| `Cmd/Ctrl+Z` | Undo last move (in Compose) |
| `Space` | Grab focused block (in Compose) |
| `Arrows` | Move grabbed block |
| `Enter` | Drop grabbed block |
| `Esc` | Cancel grab / close modal |
| `R` | Replace focused block via picker |
| `Delete` | Remove focused configurable block |
| `?` | Show keybindings overlay |

**Validation rules applied on Save.**

- `dailyCapacityMinutes` must be ≥ 240 AND ≤ 600.
- `workDays` must contain ≥ 1 day.
- `timezone` must be a valid IANA string.
- Changing `roles` re-runs the composer for the next day's Auto-Plan (catalog filter changes).
- Changing `deepSlicePreference` does not rewrite existing composed days; applies to next Auto-Plan.
- Toggling `autoComposeOvernight` off disables the 03:00 cron but leaves on-demand Auto-Plan functional.

---

## Part 6.5 — UX copy (consolidated reference)

### 6.5.1 Button labels (primary actions)

| Label | Where used | Notes |
|---|---|---|
| Auto-Plan | QuickActionsBar, empty-state Today | Never "Auto-plan my day!" |
| Regenerate | QuickActionsBar | Not "Regenerate plan" |
| Accept | CycleCard | Primary on PROPOSED |
| Edit | CycleCard | Routes to Compose |
| Reject | CycleCard | Secondary, dark-tone |
| Save | Compose, Settings | Not "Save changes" |
| Cancel | Compose, modals | Secondary |
| Start | ScheduledActivityBlock (pinned) | Not "Start now" |
| Close | Activity runner | Triggers output artifact form |
| Skip with reason | ScheduledActivityBlock | Not "Skip" |
| Add correction | VarianceLogEntry | Append-only log entry |
| Capture remeasurement | KaizenCard (ACTIVE) | Not "Remeasure" |
| Lock baseline | KaizenCard (DRAFT) | Irreversible action |
| Activate | KaizenCard (DRAFT) | After actions declared |
| Close Kaizen | KaizenCard (IN_REMEASUREMENT) | Guarded by remeasurement |
| Abandon Kaizen | KaizenCard | Does not CLOSE; returns to DRAFT |
| Protect Focus | QuickActionsBar | Day-scope only |
| Compress Day | QuickActionsBar | Shortens configurable blocks |
| Move Overflow | QuickActionsBar context menu | Per-block |
| Lock Block | QuickActionsBar context menu | Prevents Regenerate from moving it |
| Finish | WeeklyReflectionWizard step 5 | Not "Done" |
| Promote to Kaizen | Weekly Reflection step 4 | Not "Create Kaizen" |
| Dismiss this week | Weekly Reflection step 4 | Logs reason |
| Save draft & exit | Weekly Reflection | Wizard abort |
| Got it | First-run tips | Single-tap dismiss |

### 6.5.2 Empty state copy (one per screen)

| Screen | Copy |
|---|---|
| Today (first-time) | "Welcome. Tap Auto-Plan to compose your first day." |
| Today (mid-usage) | "No day scheduled. Auto-Plan, or add activities from the Catalog." |
| Compose | "No blocks yet. Add activities from the Catalog rail." |
| Week | "No week composed. Auto-Plan the week." |
| Catalog | "No entries match this filter." |
| Kaizen | "No active Kaizen. Next candidate surfaces at Friday's reflection." |
| Insights (pre-day-7) | "Building your baseline. Numbers populate after day 7." |
| Insights (range empty) | "No data in this range." |
| Settings | — (never empty) |
| Variance log | "No variance this week. Skipped non-optionals appear here." |
| Friction queue | "No open friction signals. Capture one in a reflection." |

### 6.5.3 Error messages

**Composer INFEASIBLE (per `ENGINE_DESIGN.md §1.8`).** Rendered on CycleCard, listing the `explain[]` lines verbatim from `InfeasibleResult`, followed by action buttons drawn from `suggestedActions[]`.

| InfeasibleResult kind | Message form | Action buttons |
|---|---|---|
| `OVER_CAPACITY_TOTAL` | "Day totals <N> min, capacity <C>. Shortfall <N−C>." | [Raise capacity] [Reduce external] [Skip ceremony with reason] [Defer non-optional] |
| `BUCKET_OVERPACKED` | "<Bucket> needs <N> min, ceiling <C>. Shortfall <N−C>." | [Raise capacity] [Skip ceremony with reason] |
| `NON_OPTIONAL_MISSING` | "Missing non-optional: <name>. Re-enable in Catalog or skip with reason." | [Re-enable in Catalog] [Skip with reason] |
| `ANCHOR_UNPLACEABLE` | "<name> must anchor <slot> but slot is full. Remove a configurable block." | [Remove a block] |
| `DMAIC_PAYLOAD_BLOCKED` | "<name> needs <prerequisite> closed first. Close prerequisite or pick a different payload." | [Open prerequisite] [Pick different payload] |

**Invariant violations (live on Compose, per `UX_FLOWS §4.3` + new entries).**

| Violation | Message |
|---|---|
| `DEEP_UNDER_FLOOR` | "PROJECT is <N> min, needs ≥ 240. Move an activity to PROJECT or replace a Communication block." |
| `COMM_UNDER_FLOOR` | "COMMUNICATION is <N> min, needs ≥ 60. Add a 1:1 or a team meeting." |
| `CI_UNDER_FLOOR` | "CI is <N> min, needs ≥ 60. Add a PDCA tick or L&D block." |
| `PROJECT_OVERPACKED` | "PROJECT is <N> min, ceiling 264. Remove a block or shorten one." |
| `COMM_OVERPACKED` | "COMMUNICATION is <N> min, ceiling 150. Remove a meeting or shorten one." |
| `CI_OVERPACKED` | "CI is <N> min, ceiling 150. Remove a CI block or shorten one." |
| `NON_OPTIONAL_MISSING` | "Missing: <name>. The day can't save without it. Re-add from Catalog." |
| `OVER_CAPACITY` | "Day totals <N> min, your capacity is <C>. Remove <N−C> min." |
| `ANCHOR_OUT_OF_ORDER` | "Daily Standup anchors the first COMMUNICATION slot. Move it to the top of COMMUNICATION." |
| `ACTIVE_BLOCK_LOCKED` | "This block starts in <N> min. It's locked until close." |

**Output artifact + reflection.**

| Situation | Message |
|---|---|
| Output artifact empty at close | "Fill the <field-name> field to close this activity." |
| Reflection required on non-optional | "Reflection required to close non-optional activities." |
| Intention empty on non-optional Start | "Add a one-line intention before starting this activity." |

**Kaizen.**

| Situation | Message |
|---|---|
| Close without remeasurement | "Can't close without a remeasured number. Capture remeasurement first." |
| Activate without actions | "A Kaizen needs at least one named action with an owner and a due date." |
| Baseline unlocked on activate attempt | "Lock the baseline metric before activating." |
| Accelerator phase advance blocked | "Advance blocked: <catalog-entry-id> not closed." |
| ROI missing at CLOSED advance | "ROI not captured. Fill both cost and benefits in the ROI panel." |

**Network / infra.**

| Situation | Message |
|---|---|
| Network offline | "You're offline. Changes will save when connection returns." |
| Service unavailable | "Service temporarily unavailable. Retry in a moment." |
| Save conflict | "Another change happened. Reload and reapply your edit." |
| Rate limited | "Too many requests. Try again in 30 seconds." |

### 6.5.4 Success moments (non-congratulatory)

| Moment | Copy | Where |
|---|---|---|
| Day accepted | "Day accepted. First block starts at <time>." | Toast, 3s |
| Day edited + accepted | "Edits saved. Variance logged for 2 blocks." | Toast, 3s |
| Activity closed | "Closed. Reflection takes 60 seconds." | Toast before ReflectionSheet |
| Reflection captured | "Reflection captured on time." | Toast, 2s |
| Friction signal flagged | "Friction flagged. Shows up Friday." | Toast, 2s |
| Weekly Reflection finished (no Kaizen) | "Reflection closed. No Kaizen this week." | Summary screen |
| Weekly Reflection finished (Kaizen promoted) | "Kaizen drafted: <title>." | Summary screen with [Open Kaizen] |
| Kaizen baseline locked | "Baseline locked. Declare actions to activate." | Toast, 3s |
| Kaizen remeasured | "Remeasurement captured. Delta: <N%>." | Toast, 3s |
| Kaizen closed (SUCCESS) | "Kaizen closed. Beats baseline by <N%>." | Redirect banner |
| Kaizen closed (PARTIAL) | "Kaizen closed partial. Improved <N%>, goal was <M%>." | Redirect banner |
| Kaizen closed (FAILED_HONEST) | "Kaizen closed without improvement. Evidence attached." | Redirect banner |
| Settings saved | "Settings saved." | Toast, 2s |
| Variance correction added | "Correction added. Original row preserved." | Toast, 2s |

### 6.5.5 Coaching microcopy (20 triggers)

The first 10 carried from `UX_FLOWS §5`; the next 10 extend. All ≤ 20 words, no "!", no emoji.

| # | Trigger | Where | Microcopy |
|---|---|---|---|
| 1 | First-ever day accepted | Below AdherenceDial (day 1 only) | "Today is your first composed day. Your baseline starts now. Adherence appears after day 7." |
| 2 | Edited 3 days running | Top of Compose view | "You've edited three days running. If the composer keeps missing, adjust capacity or enabled entries in Settings." |
| 3 | Second ESCALATION this week | Inline on skipped block | "Second escalation this week. Escalations show up in Friday's reflection as a friction cluster." |
| 4 | Closed 10+ min late for reflection | Top of ReflectionSheet | "Captured 14 minutes after close. Counts as late in your reflection rate. Fine — just note it." |
| 5 | Activate Kaizen with zero actions | Below Activate button | "A Kaizen needs at least one named action with an owner and a due date. Add one to activate." |
| 6 | Close Kaizen without remeasurement | Above Close button | "Can't close without a remeasured number. Capture the same metric you baselined, then close." |
| 7 | Drop violates CI floor | Tooltip at drop target | "Can't drop here. CI would fall to 30 min. PROJECT already meets its floor." |
| 8 | 3+ MEETING_LOAD signals this week | Banner on Today | "Meeting load shows up three times this week in your reflections. Friday's reflection will cluster these." |
| 9 | Two reflections pending | Below 2nd closed activity | "Two reflections pending. Friday's reflection works from this raw material. Capture them in 2 minutes." |
| 10 | Reject a valid day | Confirm dialog | "Rejecting a valid day means building from zero. Edit instead if one block is wrong." |
| 11 | PDCA tick 10 hit without close | Below PDCA block | "Tick 10 reached without close. PDCA experiments close after 10 ticks or when evidence lands." |
| 12 | AD_HOC block overran by 20+ min | Below overrun block | "Ad-hoc block overran by 22 min. Log as OVERRAN variance or move tail to tomorrow." |
| 13 | Sustainment Gate approaching (Accelerator P3) | KaizenCard PhaseStepper | "Sustainment Gate reviews in 3 days. Close control-chart entries to keep Phase 3 on track." |
| 14 | Finance co-sign missing on ROI | Below RoiPanel | "Finance co-sign required before CLOSED. Invite a FINANCE_PARTNER to review." |
| 15 | Deep-minutes below 720 by Wednesday | Week header banner | "Deep minutes at <N>/1200 by Wednesday. Two more 2×2h days stay on target." |
| 16 | 7-day acceptance rate below 60% | Insights banner | "Acceptance 54% over 14 days. Check catalog toggles in Settings — composer may be over-picking." |
| 17 | Dismissed friction cluster re-surfacing | Weekly Reflection step 4 | "Similar cluster dismissed 3 weeks ago. Re-surfaced because friction persists." |
| 18 | Focus protection broken by interruption | Post-interruption toast | "Focus protected but interrupted. Log why in tomorrow's reflection." |
| 19 | Weekly Reflection under 10 min | Step 5 summary | "Reflection finished in 6 minutes. Target is 20. Thin reflections miss friction signals." |
| 20 | Composition infeasible 3 days in a row | Settings nudge banner | "Composer infeasible 3 days running. Raise daily capacity or reduce external meetings in Settings." |

### 6.5.6 Microcopy rules (reference)

- Maximum 20 words per line.
- No "!" (exclamation), no emoji, no "rockstar", no "seamless", no "powerful", no "empower", no "delight", no "beautiful".
- Product voice: states what happened + what to do. Does not congratulate, rally, or soften with hedges ("just", "simply").
- Specific numbers: name the minute, the percent, the day.
- Never blocking: coaching never has an OK-required modal.

### 6.5.7 Tone reference (good vs bad examples)

| Bad (rewrite) | Good (product voice) |
|---|---|
| "Awesome job accepting your first day!" | "Day accepted. First block starts at 10:15." |
| "Oops, something went wrong!" | "Save failed. Retry — your edit is safe locally." |
| "Let's build your rockstar routine!" | "Tap Auto-Plan to compose your first day." |
| "You're crushing it — adherence is up!" | "Adherence 82% over 14 days. Up 6 points." |
| "Don't worry, we'll take care of it." | "Reflection stubbed. Capture it in 2 minutes to count on-time." |
| "We couldn't find anything, sorry!" | "No entries match this filter." |
| "Ready to unlock your potential?" | "Build your baseline. Numbers populate after day 7." |
| "Great catch!" (on friction flag) | "Friction flagged. Shows up Friday." |

### 6.5.8 Placeholder text (inputs)

| Input | Placeholder |
|---|---|
| IntentionField | "One line: what outcome by close?" |
| Reject reason | "Optional: why?" |
| Skip reason note (OTHER) | "Short note for the log" |
| Weekly Reflection Define | "One sentence: what problem kept showing up?" |
| Weekly Reflection Measure | "Name a metric + current value" |
| Weekly Reflection Analyze | "One plausible cause" |
| Kaizen problem statement | "What's the problem, in one sentence?" |
| Kaizen goal statement | "Reduce X from N to M by <date>" |
| Kaizen action name | "Action name" |
| Output artifact TEXT | "Summary of what the activity produced" |
| Variance note | "Optional context" |
| Catalog search | "Find an activity" |

### 6.5.9 Notification copy (desktop / browser)

| Trigger | Title | Body |
|---|---|---|
| Block start at `plannedStartAt` | "<Block name> starts now" | "Open Today to start." |
| Reflection pending 15 min past close | "Reflection pending" | "Capture in 2 minutes to count on-time." |
| Weekly Reflection Friday 14:00 | "Weekly Reflection ready" | "20 minutes. Guided. DMAIC." |
| Kaizen remeasurement overdue | "Remeasurement overdue" | "Capture the baseline metric to unlock close." |
| Composer infeasible overnight | "Today's plan needs attention" | "Open Today — composer flagged a capacity issue." |

All notifications respect OS quiet hours; never fire more than one per hour per user; always route to a specific screen on click (not `/today` as a fallback).

### 6.5.10 Confirmation dialog copy

Only five confirmations exist in MVP. All others are handled by toast+undo.

| Confirmation | Title | Body | Buttons |
|---|---|---|---|
| Reject PROPOSED day | "Reject today's plan?" | "You'll need to build manually or wait for tomorrow. Optional: why?" | [Reject] [Cancel] |
| Lock baseline | "Lock baseline?" | "Locking is irreversible. The metric definition freezes here." | [Lock] [Cancel] |
| Abandon Kaizen | "Abandon this Kaizen?" | "Returns to DRAFT. No close event fires. Evidence preserved." | [Abandon] [Cancel] |
| Reset settings | "Reset all settings?" | "Restores defaults. Your compositions, reflections, and Kaizens are kept." | [Reset] [Cancel] |
| Auto-Plan over an edited PROPOSED day | "Replace current plan?" | "Your edits will be discarded. Proceed?" | [Replace] [Cancel] |

---

## Appendix — cross-references

- Composer algorithm: `ENGINE_DESIGN.md §1.2`, INFEASIBLE shape `§1.8`, weekly `§2.1–2.3`.
- Data model: `ARCHITECTURE.md §2` (entities), `§3` (state machines), `§4.7` (InfeasibleResult contract), `§9` (decisions log).
- Blueprint: `PRODUCT_BLUEPRINT.md §3` (catalog + cycles), `§4` (must-haves), `§6` (special requirements), `§7` (KPIs).
- Existing UX: `UX_FLOWS.md §1–§5` — all sections carried and extended here rather than re-produced.
- Accelerator-specific: `PROJECT_TYPE_30D_KAIZEN.md §6–§7` for PhaseStepper + RoiPanel bindings.

Deferred to `SCHEDULING_BUILD.md`: example schedule outputs (blueprint §6.1–6.4 worked examples), backend technical architecture, PRD, database schema, and implementation tickets. This file is behavior + copy only.

## Resolution log

- Phase 3 v0.3.0 (2026-04-18) — initial draft. Extends `UX_FLOWS.md` v0.2.2. Component count 12 → 17 (added AutoPlanButton, QuickActionsBar, DeliverablesRail, ComposeCanvas, FirstRunBanner). Added `/today/compose` route and `/settings` as first-class nav. Coaching microcopy set expanded from 10 to 20 triggers. Sub-60s flow SLOs set: median <45s / P75 <60s / P95 <90s.
