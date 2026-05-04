# PRD: Today Page Simplification, Perfect-Day Defaults, No-Projects Flow

**Document ID:** PRODUCT_TODAY_SIMPLIFY  
**Author:** PM Agent  
**Date:** 2026-04-30  
**Status:** DRAFT — pending Phil standard-work authority sign-off (see §6)  
**Downstream recipients:** system-architect, ux-designer, backend-engineer, frontend-engineer, analytics

---

## 1. Problem Statements

### P1 — Today page is cluttered
The Today page currently renders 11 distinct elements:
`header`, `MorningRecap`, `RhythmExplainer`, `NowPane`, `UpNextRail` (mobile),
`WhyThisPlan`, `CycleCard`, `EodClosureStrip`, `UpNextRail` (desktop),
`EditDrawer`, `modal`.

Source: `js/ui/pages/Today.js:294–323`.

All 11 are unconditionally injected into the same view. The result is a page
that fragments the user's attention across multiple explanatory and navigational
surfaces before they can engage with the single artifact that matters: their
day plan. The Today page should be a focus instrument, not a dashboard.

**Who has the problem:** Every user who opens Today.  
**Pain:** Decision overhead before starting the day; important day-plan context
buried beneath recap, explainer, and rail components.  
**Job to be done:** Open the app, immediately see my day, and start executing.  
**Why now:** Phil's explicit directive. Simplification is a prerequisite before
any new feature surface can be meaningfully layered in.

---

### P2 — Default day shape does not match Phil's intent
Current composer defaults (confirmed from `js/capacity/floorsAndCeilings.js`
and `js/composer/composeWeekly.js`):

- COMMUNICATION target: 120 min total (no anchor distribution enforced)
- CI: 120 min target (no sacredness constraint — can be skipped)
- PROJECT: residual after COMM + CI fill

Phil's intent:
- PROJECT: minimum 4 hours (240 min) — the primary work block
- COMMUNICATION: exactly 2 hours (120 min), distributed across 3 named anchors
  (start-of-day, post-lunch, end-of-deep-work cycles)
- CI: sacred — cannot be skipped or squeezed below floor without explicit
  override; treated as a protected invariant, not a soft target

The current COMMUNICATION total (120 min) matches Phil's desired total, but the
distribution into named anchors is absent. CI currently has no sacredness guard
in the composer or UI. PROJECT has no enforced floor at 240 min.

**Who has the problem:** Every user receiving a composed day.  
**Pain:** Composed days do not reflect the 4-2-2 philosophy Phil intends users
to internalize.  
**Why now:** Fixing defaults is a prerequisite before the simplified Today page
is useful — a clean surface showing the wrong plan is not an improvement.

---

### P3 — No path exists for users without projects
The entire composer and Today page assume the user has at least one active
project (Kaizen entity with a `projectType`). A new user with zero projects
receives an INFEASIBLE composition or an empty CycleCard with no guidance on
what to do next.

`ProjectType` values (`DMAIC`, `KAIZEN_EVENT`, `KAIZEN_EVENT_90D`,
`KAIZEN_ACCELERATOR_30D`, `AD_HOC`) exist in `js/domain/types.js:29–35` but
there is no user-facing project discovery or project-type assignment flow in
the current Today page.

**Who has the problem:** New users (zero projects), users who closed all
projects.  
**Pain:** Dead end — the app provides no next step.  
**Job to be done:** Guide me from "no projects" to understanding what kind of
project I should start, and get my first composed day with discovery work
filling the PROJECT bucket.  
**Why now:** Without this, onboarding is broken for any user entering the
product cold.

---

## 2. User Stories

**US-1 — Simplified daily view**  
As a user opening the Today page, I want to see only my header and my day plan
(CycleCard), so that I can start executing immediately without scrolling through
recap, explainer, and rail sections.

**US-2 — Perfect-day defaults received**  
As a user accepting a composed day, I want my plan to contain at least 4 hours
of project work by default, so that deep work is protected before communication
fills the available space.

**US-3 — End-of-cycle communication anchor**  
As a user, I want one communication activity scheduled at the end of my deep
work cycles, so that I naturally close a focus block with team sync rather than
letting communication interrupt mid-deep-work.

**US-4 — CI is sacred**  
As a user, I want my Continuous Improvement time visually distinguished and
protected from skipping, so that I treat CI as a non-negotiable part of my day
rather than something I trade away under pressure.

**US-5 — No-projects discovery**  
As a new user with no active projects, I want the Today page to show me project
discovery or project-type selection activities in the PROJECT bucket, so that I
have a meaningful plan from day one and a clear next step toward my first
project.

**US-6 — Project type assignment leads to right standard work**  
As a user selecting a project type (e.g., DMAIC vs. KAIZEN_ACCELERATOR_30D),
I want the composer to automatically surface the standard work activities
appropriate to that type, so that I do not have to manually configure my
catalog.

**US-7 — Start-of-day communication anchor**  
As a user, I want a communication block placed at the start of my workday by
default, so that I clear inbound before entering deep work.

**US-8 — Post-lunch communication anchor**  
As a user, I want a communication block placed after lunch by default, so that
the natural energy dip after midday is used for lighter cognitive work rather
than deep focus.

---

## 3. Scope

### In scope

- Remove `MorningRecap`, `RhythmExplainer`, `NowPane`, `UpNextRail`,
  `WhyThisPlan`, and `EodClosureStrip` from the Today page render path
  (`Today.js:294–323`). Retain only `header` and `CycleCard`.
- `EditDrawer` and `modal` remain in DOM but are off-screen until triggered —
  they are not persistent visible elements.
- Composer update: enforce 240-min PROJECT floor; enforce 120-min COMMUNICATION
  split across 3 named time anchors; mark CI as a sacred invariant with an
  explicit UI guard.
- No-projects branch: detect zero active projects at composition time; substitute
  project-discovery placeholder activities in PROJECT bucket; surface project-type
  selection UI as the primary CTA.
- Standard work seed: when a project type is assigned, composer filters
  `catalogEntryId` by `projectTypeBinding` to produce relevant activities. This
  binding already exists in the `CatalogEntry` type (`projectTypeBinding` field,
  `js/domain/types.js:375`).

### Out of scope

- **Standard work content** — Phil is the sole authority on all activity
  inventories (discovery, governance, approval, assignment, CI, comm). This PRD
  describes the shape; content is queued in §6.
- **Full project entity model changes** — adding new `projectType` values or
  changing `Kaizen` FSM is architect's call. Flag: it is unclear whether a
  "no-project" user needs a synthetic `Kaizen` stub for the composer to function
  or whether the no-projects branch is a pure UI/composer override. System-
  architect must resolve.
- **Team and multi-user features** — all work here is single-user.
- **NowPane data** — NowPane currently displays the current activity. Its removal
  from persistent view does not delete the underlying data; it may be surfaced
  later as an optional drawer or notification.
- **MorningRecap and EodClosureStrip data** — removal is display-only. Recap
  data collection continues unchanged.
- **RhythmExplainer content** — dismissed state is already stored; this component
  is simply not rendered.
- **WhyThisPlan** — removed from persistent view; the underlying `explain` field
  on `composerInputsSnapshot` is preserved.
- **Redesign of CycleCard internals** — CycleCard is kept as-is for this sprint.
- **Analytics instrumentation** beyond what is in §8.

---

## 4. Acceptance Criteria

### Phase A — UI simplification only

**AC1.** On any route to `data-route="today"`, the rendered HTML contains
exactly one instance of `data-component="cycle-card"` (or equivalent CycleCard
selector) and zero instances of `data-component="morning-recap"`.

**AC2.** The rendered Today page HTML contains zero instances of
`data-component="rhythm-explainer"`.

**AC3.** The rendered Today page HTML contains zero instances of
`data-component="now-pane"` and zero instances of `data-component="up-next-rail"`.
Verifiable: grep DOM for these selectors after navigation.

**AC4.** The rendered Today page HTML contains zero instances of
`data-component="why-this-plan"` and zero instances of
`data-component="eod-closure-strip"`.

**AC4a.** `EditDrawer` and modal containers may exist in DOM but must have
`hidden` attribute or equivalent non-visible state when not explicitly triggered.
They do not count as "visible elements."

### Phase B — Composer perfect-day defaults

**AC5.** A freshly composed day for a user with at least one active project,
with `dailyCapacityMinutes >= 480`, produces a `Composition` where the sum of
all `ScheduledActivity.plannedDurationMinutes` where `bucket === 'PROJECT'` is
greater than or equal to 240.

**AC6.** A freshly composed day produces exactly three `ScheduledActivity` rows
where `bucket === 'COMMUNICATION'`, one per named anchor: start-of-day, post-
lunch, end-of-deep-work-cycle. The total of these three rows is exactly 120 min.
(Specific anchor times and individual activity durations are Phil-confirmed
values — see §6 SW-Q6 through SW-Q9.)

**AC7.** A freshly composed day for a user with `dailyCapacityMinutes >= 480`
produces a `Composition` where the sum of `plannedDurationMinutes` where
`bucket === 'COMMUNICATION'` equals exactly 120.

**AC8.** The end-of-deep-work-cycle communication anchor is always placed after
the last PROJECT-bucket activity block in the schedule, not before it. Verifiable
by comparing `plannedStartAt` values across activity rows.

**AC9.** CI activities in the CycleCard render with a distinct visual treatment
(a badge, border, or label — specific design is UX's call) that communicates
"sacred" status to the user without requiring a tooltip.

**AC10.** When a user attempts to skip a CI activity, the skip action is blocked
at the UI layer. The skip button is either absent or disabled for all activities
where `bucket === 'CI'`. No `ScheduledActivityState.SKIPPED` transition is
permitted for CI bucket entries via normal user action.

**AC11.** If a CI activity is removed from a composed day via edit mode, the
composer invariant check `shape_4_2_2.ciMin` fires and surfaces a blocking
warning to the user before the composition is accepted. The user cannot accept a
day with zero CI minutes. (CI floor value is a Phil-confirmed number — see §6
SW-Q10.)

### Phase C — No-projects discovery flow

**AC12.** When a user with zero active projects (zero `Kaizen` rows with
`state !== 'CLOSED' && state !== 'REJECTED'`) navigates to Today, the CycleCard
PROJECT bucket is populated with discovery placeholder activities rather than an
empty state or INFEASIBLE result.

**AC13.** The discovery placeholder activities in the PROJECT bucket total at
least 240 minutes. (Specific activity names and durations are Phil-confirmed —
see §6 SW-Q1 through SW-Q5.)

**AC14.** The no-projects Today view contains a primary CTA that navigates the
user to project-type selection in zero additional clicks from the CycleCard.
"Zero clicks" means the CTA is visible on the CycleCard itself, not buried in a
menu.

**AC15.** When a user selects a project type from the no-projects CTA flow, the
next composed day uses only `CatalogEntry` records whose `projectTypeBinding`
matches the selected `ProjectType` value (or is null, meaning universal). No
out-of-type activities appear in the PROJECT bucket.

**AC16.** A user mid-day (composition in `ACTIVE` state) who is affected by a
simplification deploy does not lose their current composition state. The removed
components are simply not rendered; no recomposition is triggered.

---

## 5. Standard Work Authority Items

Phil is the sole authority on every item below. Implementation of Phase B and
Phase C is blocked until each relevant item is answered.

**[SW-Q1]** What activities make up the "project discovery" inventory? Provide
names, durations, triggers, and outputs for each activity a user with no
projects will see in the PROJECT bucket.

**[SW-Q2]** What is the standard work for governance review in a no-projects
state? Is this a distinct activity type or part of project discovery?

**[SW-Q3]** What is the standard work for approval steps in the project-
initiation phase? Provide activity name, default duration, trigger, and expected
output artifact.

**[SW-Q4]** What is the standard work for project assignment? Is this a one-time
setup activity or a recurring cadence item?

**[SW-Q5]** How many distinct discovery activities should appear in the PROJECT
bucket before a user has selected a project type? (Minimum is 4 hours / 240 min
total — what is the preferred breakdown across activities?)

**[SW-Q6]** What is the canonical name and default duration of the start-of-day
COMMUNICATION anchor activity?

**[SW-Q7]** What is the canonical name and default duration of the post-lunch
COMMUNICATION anchor activity?

**[SW-Q8]** What is the canonical name and default duration of the end-of-deep-
work-cycle COMMUNICATION anchor activity?

**[SW-Q9]** What is the intended clock time for each of the three communication
anchors? (e.g., 08:00, 13:00, 16:00 — or does this flex with user capacity
settings?)

**[SW-Q10]** What is the minimum CI floor (in minutes) that the composer must
protect? Is 60 min the correct floor or does Phil intend a different number?

**[SW-Q11]** What activities are in the daily CI inventory? Provide names,
durations, cadence, and outputs. Is the current 15-min CI Reflection the only
CI item, or are there others?

**[SW-Q12]** What does "CI is sacred" mean operationally when a day is INFEASIBLE
due to capacity constraints? Does CI get protected before PROJECT is reduced, or
before COMMUNICATION is reduced?

**[SW-Q13]** Are all five `ProjectType` values (DMAIC, KAIZEN_EVENT,
KAIZEN_EVENT_90D, KAIZEN_ACCELERATOR_30D, AD_HOC) valid selections from the
no-projects CTA? Or is a subset offered to new users?

**[SW-Q14]** What is the standard work for project discovery specific to each
`ProjectType`? Does each type have a distinct set of discovery activities, or is
there a universal discovery inventory that applies before type selection?

**[SW-Q15]** What standard work covers the transition from "no project" to
"first project accepted"? Is there a governance or approval activity that must
appear before the user can accept their first project?

**[SW-Q16]** What are the standard work cadences for CI activities — DAILY,
WEEKLY, or a mix? Which CI activities are non-optional (`isNonOptional: true`)?

**[SW-Q17]** Does the end-of-deep-work-cycle communication anchor fire once per
day or once per deep-work block? (If a user has two 2-hour deep blocks, is there
one end-of-cycle comm or two?)

**[SW-Q18]** What is the canonical output artifact for a project discovery
activity? (TEXT summary? TWO_LIST of findings vs blockers? Something else?)

---

## 6. Edge Cases

**EC-1 — Partial-day composition (capacity < 480 min).**  
A user with `dailyCapacityMinutes` below 480 min cannot fit 240 PROJECT + 120
COMM + 60 CI (420 min floor). The composer must either trigger INFEASIBLE or
apply a proportional scale. Current `floorsAndCeilings.js` uses a `scale`
factor. The 4h PROJECT floor must not silently override the scale — verify that
the INFEASIBLE path is reached before silently dropping a bucket.

**EC-2 — Higher COMM budget (120 min) makes INFEASIBLE rate rise.**  
If the old effective COMM allocation was 105 min and is now 120 min, users near
capacity will tip into INFEASIBLE. Measure INFEASIBLE rate before and after
Phase B ships. This is listed as a top risk (see §9).

**EC-3 — User with project type assigned but zero active projects.**  
A user may have a `ProjectType` preference recorded (e.g., from a prior project
that is now CLOSED) but no open projects. This is distinct from a true new user.
The no-projects branch should treat CLOSED projects the same as absent projects
and still surface discovery placeholders, not old project-type standard work.

**EC-4 — User mid-day when simplification deploy lands (ACTIVE composition).**  
A composition in ACTIVE state must not be recomposed on deploy. Removed
components are display-only. The user's current activity state, `NowPane`
tracking, and `EditDrawer` state must survive the render change. No data loss.

**EC-5 — INFEASIBLE branch in no-projects state.**  
If a user has zero projects AND capacity is too low to fit even the discovery
placeholders, the INFEASIBLE banner must not collide with the no-projects CTA.
Define a priority order: INFEASIBLE takes precedence; the no-projects CTA is
surfaced inside the INFEASIBLE resolution flow, not as a competing element.

**EC-6 — Lunch block interaction with post-lunch COMM anchor.**  
If a user has a lunch block scheduled (via external calendar sync or manual
add), the post-lunch COMM anchor must be placed after the lunch block end time,
not at a fixed clock time that could overlap. Clarify with architect whether
lunch is a first-class block in the composer or a gap in capacity.

**EC-7 — End-of-cycle COMM anchor when no deep-work blocks exist.**  
If PROJECT bucket activities are all dropped or the day has no DEEP_WORK-
cadence entries (e.g., a ceremony-heavy day), the end-of-deep-work-cycle COMM
anchor has no cycle to anchor to. Define fallback: either place it at a fixed
default time or omit it and redistribute its minutes to the other two anchors.

**EC-8 — CI skip mechanics conflict with sacredness guard.**  
`SkipReasonModal` exists and is imported in `Today.js`. If CI activities are
made unskippable at the UI layer (AC10), the modal must not be openable for CI-
bucket activities. Verify that the modal trigger checks `bucket === 'CI'` before
rendering the skip option. Any existing test that skips a CI activity must be
updated to expect rejection.

---

## 7. Defaults Table

| Value | Current default | Phil's target default | Status |
|---|---|---|---|
| PROJECT bucket target (min) | 240 (from `floorsAndCeilings.js`) | 240 | Phil-confirmed |
| PROJECT bucket floor (min) | 120 | 240 | **PROPOSED — pending Phil confirmation** |
| COMMUNICATION bucket target (min) | 120 | 120 | Phil-confirmed |
| COMMUNICATION bucket floor (min) | 60 | 60 | **PROPOSED — pending Phil confirmation** |
| COMM anchor count per day | none enforced | 3 (start, post-lunch, end-of-cycle) | Phil-confirmed (shape only) |
| COMM anchor 1 — start-of-day time | none | TBD | **Pending SW-Q6, SW-Q9** |
| COMM anchor 2 — post-lunch time | none | TBD | **Pending SW-Q7, SW-Q9** |
| COMM anchor 3 — end-of-cycle time | none | TBD | **Pending SW-Q8, SW-Q9** |
| COMM anchor 1 duration (min) | none enforced | TBD | **Pending SW-Q6** |
| COMM anchor 2 duration (min) | none enforced | TBD | **Pending SW-Q7** |
| COMM anchor 3 duration (min) | none enforced | TBD | **Pending SW-Q8** |
| CI bucket target (min) | 120 | 120 | Phil-confirmed |
| CI bucket floor (min) | 60 | TBD | **Pending SW-Q10** |
| CI sacredness guard (UI skip block) | absent | enabled | Phil-confirmed |
| CI sacredness guard (composer invariant) | soft warning | hard block | **PROPOSED — pending Phil confirmation** |
| Today page persistent element count | 11 | 2 (header + CycleCard) | Phil-confirmed |
| No-projects PROJECT placeholder total (min) | n/a (not implemented) | ≥ 240 | Phil-confirmed (shape) |
| No-projects discovery activity count | n/a | TBD | **Pending SW-Q1, SW-Q5** |

---

## 8. Success Metrics

| Metric | BEFORE | AFTER target | Measurement method |
|---|---|---|---|
| Persistent element count on Today page | 11 | 2 (header + CycleCard) | DOM element count assertion in integration test |
| COMMUNICATION minutes in composed day | 120 (no anchor distribution) | 120 at 3 named anchors | Composer output test; verify 3 COMM activities exist |
| CI skip rate | Unknown baseline | 0% (skip blocked) | `ScheduledActivityState.SKIPPED` count where `bucket = 'CI'` |
| End-of-cycle COMM anchor present in composed day | 0% (never scheduled) | 100% of composed days with ≥1 PROJECT block | Composer output test |
| No-projects user drop-off rate | 100% (dead end) | < 20% session abandonment | Session funnel: Today load → project type selected |
| Time from Today page load to first user action (tap/click) | Unmeasured | Establish baseline in Phase A; target 20% reduction post-Phase B | Interaction timing, leading indicator |
| INFEASIBLE rate at standard 480-min capacity | Unmeasured baseline | Should not increase by more than 5 percentage points post-Phase B | Composition event log; `INFEASIBLE` result rate |
| PROJECT floor adherence in composed days | Unmeasured | ≥ 95% of composed days have ≥ 240 PROJECT min | Composer output query |

**Leading indicators (Phase A):**
- Drop in support questions about "what does Morning Recap mean"
- Reduction in time-to-first-activity-close on Today page

**Post-launch metrics (Phase C):**
- % of new users who select a project type within first session
- % of no-projects users who receive a composed day (vs. INFEASIBLE or empty)

---

## 9. Risks

**Risk 1 — Removing components users currently rely on (severity: HIGH).**  
`NowPane` currently shows the in-progress activity and is the only surface
communicating "what I should be doing right now." Removing it without a
replacement leaves users without real-time orientation. Mitigation: confirm
with Phil whether NowPane data should be folded into CycleCard before Phase A
ships, or whether Phase A proceeds with acknowledged regression.

**Risk 2 — Composer rebalance breaking edit mode (severity: HIGH).**  
The Edit mode's duration chips, start-time editing (Sprint 14), and undo stack
(Sprint 12) operate on the existing composition shape. Raising PROJECT floor to
240 min and distributing COMM across 3 fixed anchors constrains the solution
space for user edits. A user who tries to move the post-lunch COMM anchor before
lunch may produce an invalid day shape. Mitigation: define composer validation
rules before Phase B ships; architect must spec what edit constraints apply to
anchor-tagged activities.

**Risk 3 — INFEASIBLE rate increase due to higher COMM distribution constraints (severity: MEDIUM).**  
Splitting 120 COMM into 3 named time slots creates ordering constraints that
may block feasible solutions even when total minutes fit. A user with 7h
capacity who has external meetings mid-morning may find that anchor placement
makes the day geometrically infeasible even though 420 min of total work fits.
Mitigation: architect must determine whether anchor times are hard constraints
or soft preferences in the composer.

**Risk 4 — Phil's standard-work authority bottleneck slowing Phase B and Phase C (severity: MEDIUM).**  
Phase B requires SW-Q6 through SW-Q12 answered before development starts. Phase
C requires SW-Q1 through SW-Q5 and SW-Q13 through SW-Q18. If answers are not
available, engineers cannot seed catalog content or write composer logic.
Mitigation: Phase A ships independently; Phases B and C are explicitly gated on
Phil's answers.

**Risk 5 — CI sacredness conflicting with existing skip mechanics (severity: MEDIUM).**  
`SkipReasonModal` is imported and triggered from `Today.js`. Making CI
unskippable requires either a conditional gate before the modal fires or removal
of the skip button for CI activities. If the skip path is tested end-to-end in
existing test suites for CI activities, those tests will fail and must be
updated. Mitigation: audit all tests that exercise `SkipReasonModal` with a
`bucket = 'CI'` activity before Phase B ships.

---

## 10. Phasing Recommendation

### Phase A — Pure UI simplification (recommended: 1 iteration, shippable independently)

Remove `MorningRecap`, `RhythmExplainer`, `NowPane`, `UpNextRail`, `WhyThisPlan`,
and `EodClosureStrip` from the Today page render path. Zero composer changes.
Zero standard-work content changes. The render loop at `Today.js:294–323`
reduces to `header` + `CycleCard` + off-screen `EditDrawer` + off-screen `modal`.

**Gate to ship:** Phil confirms NowPane removal is acceptable without a
replacement surface in Phase A. AC1–AC4 pass.

**Can ship independently:** Yes.

---

### Phase B — Composer perfect-day update (requires arch delta + Phil's SW answers)

Update composer to enforce: 240-min PROJECT floor; 120-min COMMUNICATION split
into 3 anchor activities; CI sacredness guard (UI skip block + composer
invariant hard block). Requires SW-Q6 through SW-Q12 answered. Requires
system-architect to specify how anchor time constraints interact with the
feasibility solver and edit mode.

**Gate to ship:** SW-Q6–SW-Q12 answered by Phil; architect specifies anchor
constraint model; AC5–AC11 pass; INFEASIBLE rate delta measured against Phase A
baseline.

**Can ship independently:** Yes, after Phase A.

---

### Phase C — No-projects discovery flow (requires Phil's standard-work content)

Implement the zero-projects branch in the composer: substitute discovery
placeholder activities in the PROJECT bucket; surface project-type selection CTA
on CycleCard. Requires SW-Q1 through SW-Q5 and SW-Q13 through SW-Q18 answered
by Phil. Requires architect to resolve whether a synthetic Kaizen stub is needed
for the no-projects composer path.

**Gate to ship:** SW-Q1–SW-Q5, SW-Q13–SW-Q18 answered; architect resolves
no-project composer model; AC12–AC15 pass.

**Can ship independently:** Yes, after Phase A. Phase B is not a prerequisite
for Phase C (both can develop in parallel after Phase A).

---

## 11. Backlog Candidates Spawned

Items that will not ship in Phase A and need tracking:

**C-PM-1:** Define NowPane replacement surface — if current-activity awareness
is needed after NowPane removal, specify where that data lives in the
simplified view (CycleCard header? sticky chip?). Blocked on Phil's call.

**C-PM-2:** CI sacredness composer invariant hard block — specify exact behavior
when a user's edit produces zero CI minutes: blocking dialog copy, suggested
recovery action, and whether the composition can be force-accepted with an
explicit override. Requires Phil confirmation of CI floor (SW-Q10).

**C-PM-3:** Anchor time flexibility model — specify whether COMM anchors are
hard clock times, soft preferences, or user-configurable offsets from work-start
time. Required input for Phase B architect design.

**C-PM-4:** No-projects composer model — architect decision on whether the no-
projects branch requires a synthetic Kaizen stub, a separate composer code path,
or a catalog-only filter. PM to produce acceptance criteria once architect
responds.

**C-PM-5:** Discovery activity catalog seed — once Phil answers SW-Q1 through
SW-Q5 and SW-Q14, a separate catalog backlog item is needed to author, review,
and merge the new `CatalogEntry` rows for discovery activities.

**C-PM-6:** Edit-mode constraint rules for anchor activities — define whether
users can move, resize, or delete the three COMM anchors in edit mode and what
validation fires if they do. This feeds Phase B edit-mode testing.

**C-PM-7:** INFEASIBLE rate monitoring dashboard — before Phase B ships, set up
a query against composition event logs to establish baseline INFEASIBLE rate.
This is a prerequisite for Risk 3 mitigation.

---

## Assumptions and Open Flags

- **FLAG for system-architect:** It is unclear whether a user with zero projects
  needs a synthetic `Kaizen` stub for the composer to produce a valid
  `Composition`. If the composer requires a `Kaizen.projectType` to select
  catalog entries, a no-project user will produce zero PROJECT activities. The
  no-projects branch may require a separate composer entry point or a
  "discovery mode" flag on the composition request.

- **FLAG for system-architect:** The `User` type (`js/domain/types.js:383–397`)
  has no field for a user's "current project type preference" or "no projects"
  state. If Phase C needs to persist a user's selected project type before a
  `Kaizen` is created, the `User` entity may need a new field. Architect to
  advise.

- **Assumed:** `EditDrawer` and `modal` are not counted as "visible persistent
  elements" for the purposes of the 2-element target, as they are off-screen
  until triggered. If Phil's intent is that even these must be removed from
  DOM, that changes AC4a and is a more significant refactor.

- **Assumed:** The 120-min COMMUNICATION total is Phil-confirmed (matches
  current `BUCKET_DEFAULT_TARGETS.COMMUNICATION = 120` in
  `js/capacity/floorsAndCeilings.js`). Only the distribution into 3 anchors is
  new.
