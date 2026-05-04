# ARCHITECTURE DELTA — Today: Perfect-Day Simplification

**Status:** PROPOSED — Define-phase artifact only. No code in this delta.
**Author:** System Architect agent
**Date:** 2026-04-30
**Scope:** Composer changes for Phil's "perfect day" rules + project-entity
gap audit + CI sacredness mechanism.

**Source directive (Phil, verbatim).** "We should populate the perfect day
based on user projects (if no projects then focus on project discovery and
lead to project types). Start with at least 4 hours of project work or
discovery placeholders... two hours of high-value communication with a
standard default of start of work communication, communication right after
lunch, and communication at the end of deep work cycles. Continuous
improvement should be sacred for users to be thoughtful and improve their
work and make their lives easier. I am the ultimate authority for all
standard work inventories for these focus areas."

---

## 1. Goal + non-goals

**Goal.** Make the daily composer's default day match Phil's perfect-day
rules: (a) 4h+ PROJECT (or, when the user has no project, 4h of "discovery"
placeholders), (b) 2h COMMUNICATION shaped around three named anchors —
start-of-work, post-lunch, end-of-deep-cycles, (c) a CI block that the
system treats as **sacred** (cannot be silently dropped or auto-relaxed
away). Thread the "no projects" branch into the composer so users who
haven't declared a project are routed to discovery rather than getting
empty Deep blocks. All standard-work content (the actual procedures,
durations, names) remains Phil's authority — this delta defines shapes,
contracts, and the branching skeleton only.

**Non-goals.** This delta does **not** invent any standard-work content
(no procedure text, no new catalog rows). It does not redesign the
project-management surface (no full Project CRUD). It does not change
4-2-2 capacity math (`js/capacity/floorsAndCeilings.js:21-25`). It does
not change the validator's failure-code taxonomy. It does not change the
Composition / ScheduledActivity FSMs. Weekly composition is touched only
to the extent that `composeWeekly` re-uses the same daily building blocks.

---

## 2. Current state inventory

### 2.1 Composer's default day — every anchor

| Anchor | Spec source | bucket | minutes | catalogEntryId |
|---|---|---|---|---|
| Daily Standup | `js/composer/composeDaily.js:41-46` | COMMUNICATION | 15 | `cer_daily_standup` |
| AM High-value Communication | `js/composer/composeDaily.js:47-54` | COMMUNICATION | 60 | `gen_value_added_communication` (slotKind=`AM_COMM`, anchor 09:15) |
| Post-lunch High-value Communication | `js/composer/composeDaily.js:55-62` | COMMUNICATION | 30 | `gen_value_added_communication` (slotKind=`POST_LUNCH_COMM`, anchor 13:00) |
| End-of-Activity Reflection | `js/composer/composeDaily.js:63-69` | CI | 15 | `gen_end_of_activity_reflection` (anchor 17:00) |
| Sprint ceremonies (phase-driven) | `js/composer/composeDaily.js:79-114` | CI / COMM | 30/60/120 | `cer_sprint_planning`, `cer_mid_sprint_review`, `cer_sprint_review`, `cer_sprint_retrospective` |
| Deep payload (DMAIC link or generic) | `js/composer/composeDaily.js:402-474` + `js/engine/selectDeepPayload.js:182-207` | PROJECT | up to bucket target | `gen_deep_work_project` or DMAIC step |
| CI rotation fill | `js/composer/composeDaily.js:478-498` + `js/engine/pickCI.js:189-219` | CI | until floor / target met | various |
| COMM filler | `js/composer/composeDaily.js:500-521` | COMMUNICATION | until target met | various |

**Default-day COMM total:** 15 + 60 + 30 = **105 min**. Phil's target: **120 min**.
**Shortfall: 15 min** (one anchor missing — see §3.3).

**Default-day CI total (excluding sprint ceremonies):** 15 min from
End-of-Activity Reflection alone; CI floor at 480-min cap is 60 min
(`js/capacity/floorsAndCeilings.js:96-104`). The remaining 45+ min comes
from CI rotation fill (`pickCI`) — i.e. **CI floor is met by fill, not
by Phil-named anchors**.

**Lunch:** capacity-neutral gap 12:00–13:00 — see `js/engine/orderDay.js:129`
(`const lunchMins = 12 * 60`). Surfaced as an editable card in a
parallel delta (`ARCHITECTURE_DELTA_LUNCH_BLOCK.md`); not the subject of
this delta.

### 2.2 Project entity model — audit

**Finding: there is no `Project` instance entity.** Searched
`js/domain/types.js`, `js/services/`, and the events module:

- `ProjectType` is an **enum only** at `js/domain/types.js:29-35`
  (`DMAIC | KAIZEN_EVENT | KAIZEN_EVENT_90D | KAIZEN_ACCELERATOR_30D | AD_HOC`).
  No `Project` typedef exists at any §2.x slot.
- `Kaizen` (`js/domain/types.js:537-593`) is the closest thing to a
  "user project" entity — every Kaizen carries a `projectType`
  (`js/domain/types.js:555`) and serves as the project anchor for
  composer logic. The composer reads `input.activeKaizen` (singular —
  see `js/composer/composeDaily.js:359-362, 426`) and treats it as the
  user's "current project."
- `KaizenService` enforces a "1 active Kaizen per user" cap
  (`js/services/KaizenService.js:18-20, 47-50`) — so the system already
  models projects as `kaizens.filter(state===ACTIVE)`.
- `Opportunity` (`js/domain/types.js:680-699`) is the intake funnel; it
  is **not** a Project — it must be promoted to a Kaizen first.
- The UI surface has a `Portfolio` page (`js/ui/pages/Portfolio.js`) that
  treats Kaizens as projects.

**Conclusion: project entity exists in **partial / aliased** form.**
The domain models a user's projects as `kaizens.filter(state ∈ {DRAFT,
ACTIVE, IN_REMEASUREMENT})`. There is no separate `Project` row. For the
"if no projects then route to discovery" branching, the composer needs
to consult **Kaizen state** (or accept a pre-resolved boolean from the
caller). It does not need a new entity. See §4.

### 2.3 CI handling currently

**Bucket assignment.** CI catalog entries are tagged `bucket: 'CI'`
(`js/catalog/seed/ceremoniesAndGenerics.js:74, 195, 225, 326, 357, 388`).

**Which CatalogEntries are CI today.** Within ceremonies and generics:
Quarterly Planning, Sprint Planning (post-2026-04-22 reclassification),
Sprint Review, Sprint Retrospective, End-of-Activity Reflection,
Weekly Reflection, Lessons Learned. Plus any catalog rows fed in via
`pickCI` from the broader 50-row standard work
(`js/engine/pickCI.js:189-219`).

**Can CI be skipped?** Yes, today. Several paths:
1. `validateComposition` + `relaxConfigurable` may **drop** CI rows when
   over-capacity. `js/engine/relaxConfigurable.js:80-87, 121-126` —
   CI rows with `ciPriority ≤ 20` are dropped first (rank 1), CI 40-60
   priority next (rank 2). Only **named non-optional CI** ceremonies
   are protected by `PROTECTED_IDS` / `PROTECTED_NAMES` at
   `js/engine/relaxConfigurable.js:26-45` — that list includes
   `gen_end_of_activity_reflection`, Sprint Planning, Mid-Sprint Review,
   Sprint Review, Sprint Retrospective. **General CI rotation fill is
   NOT protected.**
2. UI skip-with-reason flow (`js/ui/components/SkipReasonModal.js`)
   permits the user to skip any non-anchor activity post-acceptance.
   No CI-specific gate.

**Invariant floor.** CI floor = 60 min at full cap
(`js/capacity/floorsAndCeilings.js:96-104` — `0.5 × 120 = 60`). If
floor is breached, validator returns `CI_UNDER_FLOOR`
(`js/engine/validateComposition.js:150-152`). However, `relaxConfigurable`
*drops* blocks rather than adding — it cannot fix UNDER_FLOOR; that
becomes INFEASIBLE.

**Conclusion: CI is treated like any other relaxable bucket once the
named ceremonies are placed.** The "sacredness" Phil wants is not yet
present.

---

## 3. Target state — composer perfect-day rules

### 3.1 PROJECT — 4h+ (no change to target math)

**Current PROJECT target at 480-min cap:** 240 min = 4h
(`js/capacity/floorsAndCeilings.js:21-25` — `PROJECT: 240`).
**Already meets Phil's "at least 4 hours" rule.** No bucket-target
change required for PROJECT.

**Required additions:** when the user has no active Kaizen, the
composer must emit **discovery placeholders** that count toward the
PROJECT bucket. See §5.

### 3.2 COMMUNICATION — 2h (was 1.75h)

**Gap.** Default 105 min vs target 120 min = 15 min short.
**Resolution.** Add a new daily non-optional anchor (the
"end-of-deep-cycles" anchor in §3.3) sized at **15 min minimum**, bucket
COMMUNICATION.

After change, default-day COMM total: 15 + 60 + 30 + 15 = **120 min**.

**Bucket target at 480 cap:** 120 min (`js/capacity/floorsAndCeilings.js:21-25`).
**No bucket-target change needed.** The change is purely in the
`DAILY_NON_OPTIONAL_SET` composition.

### 3.3 Three communication anchor types

The `DAILY_NON_OPTIONAL_SET` extends from 4 entries to 5:

| Anchor | slotKind | bucket | min duration | placement model |
|---|---|---|---|---|
| Daily Standup | (none — id-keyed) | COMMUNICATION | 15 | 09:00 fixed |
| Start-of-work Comm | `AM_COMM` | COMMUNICATION | 60 | 09:15 fixed (today's `AM_COMM`, renamed conceptually) |
| Post-lunch Comm | `POST_LUNCH_COMM` | COMMUNICATION | 30 | 13:00 fixed |
| **End-of-deep-cycles Comm (NEW)** | `POST_DEEP_COMM` | COMMUNICATION | 15 | dynamic — see §3.4 |
| End-of-Activity Reflection | (none — id-keyed) | CI | 15 | 17:00 fixed |

The first three (Standup, AM, Post-lunch) map directly onto Phil's
three named comm types: "start of work communication, communication
right after lunch, and communication at the end of deep work cycles."
The Standup is preserved as a separate row because it serves a distinct
team-coordination function and is already wired throughout the system.

### 3.4 End-of-deep-cycles anchor — placement model

**Three options evaluated:**

- **(a) One fixed anchor per day** at e.g. 15:30 or after the second
  Deep block. *Pro:* simplest; one new row in `DAILY_NON_OPTIONAL_SET`;
  predictable in `orderDay`. *Con:* doesn't actually attach to a deep
  cycle — it's just another fixed time anchor.
- **(b) One after EACH deep block** (could be 2–3 per day). *Pro:* most
  faithful to "end of deep work cycles." *Con:* multiplies COMM by
  slice-count → blows past 120 min target on a 4×1h day; complicates
  `orderDay` packing; introduces variable comm minutes that cascade
  through validator and tests.
- **(c) Post-Deep within a defined window** — exactly one anchor,
  computed at order-day time as "first 15-min slot after the LAST
  PROJECT block ends, capped at e.g. 16:30." *Pro:* attaches to actual
  deep boundary; bounded to a single block; minute-cost is fixed.
  *Con:* `orderDay` must compute the anchor position rather than read
  it from a static spec — a one-line addition since `orderDay`
  already knows the cursor.

**Recommendation: option (c)** with these guard rails:

- Single occurrence per day.
- Placement: `plannedStartAt = max(cursorAfternoon, lastDeepEnd)` capped
  at `16:30`. If no Deep block was placed (e.g., no project, no
  discovery), fall back to fixed 15:30.
- Spec stored as a conceptual anchor in `DAILY_NON_OPTIONAL_SET` with
  `slotKind: 'POST_DEEP_COMM'`, `anchor: null` (computed), and
  `placementHint: 'AFTER_LAST_DEEP'`.
- Materialized as `gen_value_added_communication` (re-uses the existing
  generic comm catalog row).

**Standard-work authority handoff to Phil:** the fallback time (15:30 or
16:00 if no Deep), the cap (16:30 vs 16:00), and the minute-floor (15 vs
20) are Phil's call — see §11 Q1, Q2.

### 3.5 CI sacred — mechanism

See full options + rationale in §6. **Recommended mechanism: option
(c) — UI confirm-on-skip with no engine change**, deferring engine
changes until measurement shows users routinely skip CI without
reflection. Lowest blast-radius, fastest to ship, no §6.5 hits.

---

## 4. Project entity gap analysis

### 4.1 Does a `Project` entity exist?

**No standalone `Project` typedef exists.** The domain models projects
**through Kaizen** (`js/domain/types.js:537-593`) which carries
`projectType` (`:555`), `state` (`:548`), `phase` (`:556`), and
`startDate` (`:560`). The "1 active Kaizen per user" rule
(`js/services/KaizenService.js:18-20`) makes Kaizen effectively the
project record.

### 4.2 Lifecycle observed

```
Opportunity(INTAKE) → promote() → Kaizen(DRAFT) → lockBaseline() → Kaizen(ACTIVE)
                                                                         │
                                                       captureRemeasurement()
                                                                         ▼
                                                    Kaizen(IN_REMEASUREMENT) → close() → CLOSED
```

A "user has projects" check today maps to:

```
hasProjects(userId) := KaizenService.list({userId, state: 'DRAFT'|'ACTIVE'|'IN_REMEASUREMENT'}).length > 0
```

Persistence: `bamx:v1:kaizens` (`js/services/KaizenService.js:74`).

### 4.3 Minimum viable for branching

**No new entity needed.** The composer can branch on a single boolean
derived from existing state:

```
input.hasActiveProject = (input.activeKaizen !== null) ||
                         (input.userProjectsCount > 0)
```

`userProjectsCount` is computed by the caller (ComposerService) from
`KaizenService.list({userId, state: 'DRAFT'|'ACTIVE'|'IN_REMEASUREMENT'})`.
The pure composer remains storage-agnostic.

**Recommendation:** add `hasActiveProject: boolean` to ComposerInput
contract (`js/engine/capacity.js:107-124` — `buildComposerInput`).
ComposerService computes it. No new typedef. No new persistence. No new
service. **§6.5 hit on `js/engine/capacity.js`** for the contract
extension — see §7.

---

## 5. No-projects branching — composer changes

### 5.1 Where the branch lives

**Inside `composeDaily`, in step 5 (Deep Work payload selection)** —
between line `js/composer/composeDaily.js:404` (`if (remaining.PROJECT >
0)`) and line `:405` (`deepEntry = selectDeepPayload(input)`).

Pseudo-code:

```
if (remaining.PROJECT > 0) {
  if (input.hasActiveProject === false) {
    // emit discovery placeholders
    deepEntry = selectDiscoveryPayload(input);   // NEW helper
  } else {
    deepEntry = selectDeepPayload(input);
  }
  // ... existing slicing logic unchanged
}
```

The downstream slice + materialize logic
(`js/composer/composeDaily.js:431-450`) works without modification — it
treats `deepEntry` as opaque and slices its `defaultDurationMinutes`.

### 5.2 What a "discovery placeholder" looks like as a ScheduledActivity

```
{
  id: 'sa_discovery_<idSuffix>',
  catalogEntryId: 'gen_project_discovery',     // NEW catalog row — Phil owns content
  name: 'Project Discovery',                    // NEW — Phil owns
  bucket: 'PROJECT',
  plannedDurationMinutes: <slice>,              // sliced like Deep
  plannedStartAt: <set by orderDay>,
  state: 'PROPOSED',
  sourceOfSchedule: 'COMPOSER_AUTO',
  sliceIndex: <i+1>,                            // reuses Deep slice indexing
  activityKind: 'DISCOVERY'                     // NEW field on ScheduledActivity — see §7 §6.5 hit
}
```

**Catalog row for discovery** (Phil to own content):

```
{
  id: 'gen_project_discovery',
  name: 'Project Discovery',                    // Phil owns
  focusArea: 'DEEP_WORK' | 'INNOVATION',        // Phil decides — see §11 Q3
  bucket: 'PROJECT',
  defaultDurationMinutes: 240,                  // mirrors gen_deep_work_project
  cadence: 'DAILY',
  trigger: 'PROJECT bucket has slack and user has no active Kaizen',
  procedure: [...],                             // Phil owns
  outputArtifact: { schema: 'TWO_LIST',         // Phil decides — see §11 Q4
                    name: '...',                // Phil owns
                    required: true },
  isNonOptional: false,
  enabledByUser: true,
  projectTypeBinding: null,
  phaseBinding: null,
  sourceRef: 'ARCHITECTURE_DELTA_TODAY_SIMPLIFY.md §5'
}
```

**The new `activityKind` field** on ScheduledActivity is what makes this
row visually distinct in `/today` (UI can render a "Project Discovery —
pick a project type to convert this" CTA). This is the §6.5-touching
addition: a new optional field on `ScheduledActivity` typedef
(`js/domain/types.js:453-474`). A simpler MVP alternative is to
discriminate purely on `catalogEntryId === 'gen_project_discovery'` and
skip the field — see §11 Q5.

### 5.3 Selector helper

New file: `js/engine/selectDiscoveryPayload.js`. Mirror shape of
`js/engine/selectDeepPayload.js:182-207`. Returns the discovery catalog
row from `input.catalog`, or `null` if absent. Pure; no I/O. ~30 LOC.

---

## 6. CI sacredness mechanism (detailed)

### 6.1 Option (a) — `isSacred: true` on CatalogEntry

**Changes:** add `isSacred?: boolean` to CatalogEntry typedef
(`js/domain/types.js:356-378`). Mark CI ceremonies + End-of-Activity
Reflection sacred (`js/catalog/seed/ceremoniesAndGenerics.js`).
`relaxConfigurable.js:78-103` extends `isProtected()` to honor the flag.
UI surfaces the flag as a confirm dialog on skip.

**Pros:** declarative; single source of truth; flag flows everywhere.
**Cons:** §6.5 hit on `js/domain/types.js` (sacred zone). Schema
migration concern for existing persisted CatalogEntry rows.

### 6.2 Option (b) — Higher floor in invariant engine

**Changes:** raise CI `FLOOR_MULTIPLIER` from 0.5 to e.g. 0.75 for CI
specifically, OR add a new "named-CI floor" in
`js/engine/validateComposition.js:107-186` that requires named CI
anchors (Reflection, Lessons Learned, etc.) to be *present* not just
*sum to floor*.

**Pros:** invariant-level guarantee; can't be silently dropped.
**Cons:** §6.5 hit on `js/engine/`. Risk of cascading INFEASIBLE on
short days (cap=240). Changes failure-code semantics; every test
asserting CI floor breaks. Heavier and less reversible than (a) or (c).

### 6.3 Option (c) — UI confirm-on-skip only

**Changes:** in `js/ui/components/SkipReasonModal.js`, when the target
activity has `bucket === 'CI'`, render a sentence like "Continuous
Improvement is how you make tomorrow easier than today. Skip anyway?"
and require an explicit second-click confirmation. No engine change. No
typedef change. No catalog change.

**Pros:** zero engine risk; zero §6.5 hits; ships in one sprint;
fully reversible (delete the conditional). Telemetry on confirm-vs-cancel
gives data on whether to escalate to (a) or (b) later.
**Cons:** doesn't prevent `relaxConfigurable` from dropping CI rows
during compose-time over-capacity. If compose time is the actual leak,
this option misses it.

### 6.4 Recommendation

**Ship option (c) now.** Add an instrumentation hook
(`CISkipConfirmed` event, see §7 events table) to gather data over one
sprint. If telemetry shows that CI is being dropped at *compose* time
more than *skip* time, escalate to option (a) — it's the lowest-blast
follow-up and preserves the work done in (c).

**Justification:** Phil's directive is about user mindfulness ("be
thoughtful and improve their work"). A confirm dialog directly serves
that. Engine-level enforcement would protect CI from *the system*, but
the actual risk is *the user* skipping CI — which (c) addresses head-on.
Engine changes are also expensive (§6.5 zone) and irreversible without
test recalculation.

---

## 7. Component changes table

| File | Change | LOC | §6.5 hit? |
|---|---|---|---|
| `js/composer/composeDaily.js` | Extend `DAILY_NON_OPTIONAL_SET` (`:39-70`) with POST_DEEP_COMM entry. Branch in step-5 on `input.hasActiveProject` (`:404-474`). Re-balance commNeeded math (`:277-293`) for the new 4th comm slot. | +30 | **YES** |
| `js/engine/orderDay.js` | Compute POST_DEEP_COMM placement after Deep packing (`:159-172`); insert before line `:174` "Pack COMMUNICATION fillers". Cap at 16:30. | +20 | **YES** |
| `js/engine/validateComposition.js` | Extend `DAILY_NON_OPTIONAL_NAMES` (`:41-46`) to include the new POST_DEEP_COMM anchor by display name. | +1 | **YES** |
| `js/engine/relaxConfigurable.js` | Add the new comm anchor's catalogEntryId/slotKind to `PROTECTED_IDS` / `PROTECTED_NAMES` (`:26-45`) so it survives relaxation. | +3 | **YES** |
| `js/engine/capacity.js` | Add `hasActiveProject?: boolean` to `buildComposerInput` (`:107-174`). Default false. | +4 | **YES** |
| `js/engine/selectDiscoveryPayload.js` (NEW) | Mirror of `selectDeepPayload.js`. Returns discovery catalog row. | +30 (new file) | NO (additive) |
| `js/services/ComposerService.js` | Compute `hasActiveProject` from KaizenService and inject into ComposerInput (~lines 179-218). Optionally accept injected KaizenService dep. | +15 | NO |
| `js/catalog/seed/ceremoniesAndGenerics.js` | Add `gen_project_discovery` row (Phil owns content). | +30 (new row) | NO |
| `js/ui/components/SkipReasonModal.js` | CI-bucket confirm copy + second-click guard. Emit `CISkipConfirmed` event on confirm. | +25 | NO |
| `js/events/events.js` | Add `CISkipConfirmed` event constant. | +2 | **YES** |
| `js/ui/components/ScheduledActivityBlock.js` | Render discovery rows with a "Choose a project type" CTA when `catalogEntryId === 'gen_project_discovery'`. | +20 | NO |
| `js/domain/types.js` (optional) | Add `activityKind?: 'DISCOVERY' \| ...` to ScheduledActivity. Skip if §11 Q5 resolves to "discriminate by catalogEntryId only." | +2 (optional) | **YES** (if taken) |

**§6.5 hit count: 6 files** (`composeDaily.js`, `orderDay.js`,
`validateComposition.js`, `relaxConfigurable.js`, `capacity.js`,
`events.js`). +1 if §11 Q5 takes the typedef route.

**Total LOC estimate:** ~180 LOC across 11 files (200 LOC if §11 Q5
goes typedef-route + activityKind plumbing).

---

## 8. Test strategy

### 8.1 New tests

| Test file | Add | Reason |
|---|---|---|
| `tests/composer/composeDaily.test.js` | +6 cases | (a) default day has 4 COMM anchors summing to 120; (b) `hasActiveProject:false` emits discovery; (c) `hasActiveProject:true` emits Deep; (d) POST_DEEP_COMM placed after last Deep block; (e) POST_DEEP_COMM falls back to 15:30 when no Deep; (f) POST_DEEP_COMM survives relaxConfigurable. |
| `tests/engine/orderDay.test.js` | +3 cases | POST_DEEP_COMM placement: after Deep, before any 16:30+ anchor, fallback when Deep absent. |
| `tests/engine/relaxConfigurable.test.js` | +1 case | POST_DEEP_COMM is in PROTECTED set. |
| `tests/engine/validateComposition.test.js` | +1 case | NON_OPTIONAL_MISSING fires when POST_DEEP_COMM absent. |
| `tests/engine/selectDiscoveryPayload.test.js` (NEW) | ~6 cases | Returns row when present; returns null when absent; deterministic. |
| `tests/services/ComposerService.test.js` | +2 cases | `hasActiveProject` derived from KaizenService correctly; flows to composer input. |
| `tests/ui/components/SkipReasonModal.test.js` | +2 cases | CI-bucket activity shows confirm copy; non-CI does not; `CISkipConfirmed` event fires. |
| `tests/catalog/seed/ceremoniesAndGenerics.test.js` | +1 case | `gen_project_discovery` row present, well-formed. |

### 8.2 Tests needing edit

See §9 blast radius — every test that asserts a fixed COMM/CI total
needs recalculation.

**Estimated total test delta:** +22 new cases, ~14 cases edited.

---

## 9. Blast radius

Every test that asserts a fixed comm/CI/PROJECT total needs review.
Quantification:

| Pattern | Files affected | Likely edits |
|---|---|---|
| `COMMUNICATION === 105` or `105 min comm` | `tests/ui/components/CycleCard.test.js:390` (verified via grep), and any composer total assertions | ~3 |
| `DAILY_NON_OPTIONAL_NAMES.length === 4` | `tests/engine/validateComposition.test.js`, `tests/composer/composeDaily.test.js` | ~2 |
| Default-day `placed.length` exact-count assertions | `tests/composer/composeDaily.test.js` | ~3 |
| `gen_value_added_communication` count assertions (currently 2 per day; will be 3) | composer test, week test, cycleCard test | ~3 |
| `relaxConfigurable` PROTECTED set assertions | `tests/engine/relaxConfigurable.test.js` | ~1 |
| Golden-day fixture (`tests/fixtures/goldenDay.js`) total minutes / activity count | fixture file | ~1 fixture update + ~3 dependent test updates |

**Total blast: ~16 files / ~20 assertions** to recompute. None of these
are difficult — they are recount-against-new-default mechanical updates.
The risk is missing a downstream consumer; the mitigation is one CI
run after the change.

**Weekly composer.** `js/composer/composeWeekly.js` builds 5 days inline
rather than calling `composeDaily` directly (per the lunch-block delta,
`composeWeekly.js:355-600 buildDay`). It must also gain the POST_DEEP_COMM
anchor + the discovery branch — likely by extracting a shared helper
called from both. Estimated +20 LOC, **§6.5 hit on `js/composer/composeWeekly.js`**.
This is the largest hidden cost in this delta.

---

## 10. Rollback

Each behavior change is gated by a single toggle. Recommended approach:
named feature flags read from a `featureFlags` block on `ComposerInput`,
defaulted ON in production but OFF in the existing test fixtures so old
tests keep passing during migration:

| Flag | Default | Disables |
|---|---|---|
| `featureFlags.postDeepCommAnchor` | true | New 4th COMM anchor and its placement / protection / validation lines |
| `featureFlags.discoveryBranch` | true | `hasActiveProject` branch; reverts to existing `selectDeepPayload` always |
| `featureFlags.ciSacredConfirm` | true | UI confirm-on-skip for CI activities |

To roll back any one behavior, set the flag false. `composeDaily`,
`orderDay`, `validateComposition`, `relaxConfigurable`, `SkipReasonModal`
all consult their respective flag at the top of their changed code paths.
Total flag-plumbing LOC: ~12 across the affected files.

---

## 11. Standard work authority queue for Phil

Each of these is a content / authority decision the architect cannot
make. Numbered for tracking.

1. **POST_DEEP_COMM duration.** Default proposed: 15 min. Phil prefers
   15 / 20 / 30?
2. **POST_DEEP_COMM fallback time when no Deep block exists.** Proposed
   15:30. Phil prefers earlier (e.g., 15:00) or later?
3. **`gen_project_discovery` focus area.** `DEEP_WORK` (treats discovery
   as deep-work-flavored) vs `INNOVATION` (treats it as a distinct
   pre-project mode)? This affects Catalog page bucketing
   (`js/ui/components/CatalogBucketView.js`).
4. **`gen_project_discovery` outputArtifact schema.** TWO_LIST
   ("possibilities / blockers") vs DOCUMENT (problem-statement draft)
   vs TEXT (free-form notes)?
5. **`activityKind` typedef vs catalogEntryId discrimination.** Add a
   first-class `activityKind: 'DISCOVERY' | ...` field to
   ScheduledActivity (cleaner; §6.5 hit) OR have the UI read
   `catalogEntryId === 'gen_project_discovery'` (no schema change; ties
   discovery semantics to one specific row id forever)?
6. **End-of-Activity Reflection sacredness.** Today it is in
   `PROTECTED_NAMES` (`relaxConfigurable.js:30`) so it survives engine
   relaxation. Should it also gain UI confirm-on-skip, or is engine
   protection enough?
7. **Project-specific CI replacement.** Can a project-specific CI
   activity (e.g., a Kaizen retrospective) replace the End-of-Activity
   Reflection on days when both would otherwise be scheduled, or do they
   coexist?
8. **Discovery duration ramp.** When user is in discovery mode, should
   the PROJECT bucket fill 240 min with discovery placeholders (full
   target), or partial (e.g., 120 min discovery + 120 min unallocated /
   "explore the catalog")?
9. **Discovery → Project conversion.** When the user picks a project
   type from a discovery row, does that promote into an Opportunity, a
   Kaizen DRAFT, or a different intake state? (Touches
   `OpportunityService` vs `KaizenService.promote`.)
10. **Multi-active-Kaizen.** Today's "1 active Kaizen per user" cap
    means a user with 1 Kaizen "has projects." Is that right for the
    `hasActiveProject` boolean, or do `DRAFT` and `IN_REMEASUREMENT`
    Kaizens also count?
11. **Standup vs AM Comm.** Phil's three named comm types are
    "start of work / post-lunch / end-of-deep." Does Daily Standup
    count as "start of work" (in which case the 09:15 AM_COMM is
    redundant) or is it a separate ceremony that coexists?
12. **Sacred copy.** "Continuous Improvement is how you make tomorrow
    easier than today" is a draft confirm-modal sentence. Phil's wording?

---

## 12. Open architectural questions (top 3)

1. **Should we lift `Project` to a first-class entity now, or continue
   aliasing through `Kaizen`?** Pro-lift: clearer mental model, decouples
   project lifecycle from Kaizen baseline-locking semantics, room for
   multi-Kaizen-per-Project later. Pro-defer: 1 active Kaizen cap means
   the alias works today; lifting requires migration of stored Kaizens,
   service rewiring, UI changes — easily 500+ LOC and a sprint of work.
   Recommend defer; revisit if multi-Kaizen / sub-projects are roadmapped.

2. **Where does `hasActiveProject` get computed in the Composition
   lifecycle?** Today, the check happens at `composeDaily()` invocation.
   But what if the user creates a Kaizen *after* a day is composed?
   Should we re-compose? React via reflow? Today's reflow
   (`ComposerService.reflow()`) doesn't add/remove activities — only
   re-tiles. Adding "user just created their first project, swap
   discovery rows for Deep rows" reflow-add semantics is non-trivial.
   Recommend MVP: do NOT re-compose; the user keeps the discovery day
   they accepted, and tomorrow's composition picks up the new Kaizen.

3. **Does the engine-level CI floor stay at 60 min once we mark named
   CI activities sacred?** Option (a) and (c) leave the 60-min floor
   intact, which means CI rotation fill still kicks in to top up to
   floor. Option (b) raises the floor and makes named ceremonies the
   *only* CI counted toward floor, which would cascade through every
   capacity test. Recommend leaving the floor at 60; sacredness is a
   protect-against-drop mechanism, not a floor mechanism.

---

## 13. Summary table — what changes, by Phil's directive

| Phil's words | Resolution in this delta | §6.5 hit |
|---|---|---|
| "populate the perfect day based on user projects" | `hasActiveProject` boolean on ComposerInput; computed by ComposerService from KaizenService | YES (`capacity.js`) |
| "if no projects then focus on project discovery" | `selectDiscoveryPayload` helper; new `gen_project_discovery` catalog row; branch in composeDaily step 5 | NO (additive) |
| "lead to project types" | UI CTA on discovery rows that opens project-type picker (deferred to next delta — out of scope here) | — |
| "at least 4 hours of project work or discovery placeholders" | PROJECT bucket target already 240 min; discovery rows are bucket=PROJECT so they fill the same target | NO |
| "two hours of high-value communication" | Add 4th COMM anchor (POST_DEEP_COMM, 15 min) → 105 + 15 = 120 | YES (`composeDaily.js`) |
| "start of work communication" | Existing `AM_COMM` slot — no change | — |
| "communication right after lunch" | Existing `POST_LUNCH_COMM` slot — no change | — |
| "communication at the end of deep work cycles" | NEW `POST_DEEP_COMM` slot, dynamically placed after last Deep block | YES (`composeDaily.js`, `orderDay.js`, `validateComposition.js`, `relaxConfigurable.js`) |
| "Continuous improvement should be sacred" | UI confirm-on-skip for CI-bucket activities (option c); telemetry to gate escalation to engine option (a) | YES (`events.js`) for `CISkipConfirmed` event constant; otherwise UI-only |
| "I am the ultimate authority for all standard work inventories" | All catalog-row content (procedures, names, durations) stubbed; 12 explicit Phil-authority questions in §11 | — |

---

**End of delta.** Implementation handoff: backend-engineer for the
composer + engine + service changes; frontend-engineer for the
SkipReasonModal + ScheduledActivityBlock changes; Phil for §11 content
authority answers before any catalog row gets written.
