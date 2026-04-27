# PRD — CadencePlan Today (response to 14-module brief)

Owner: product-manager
Status: v0.1 — Define-phase triage. Bounded to Today page per user framing.
Inputs: PRODUCT_BLUEPRINT v0.3, ARCHITECTURE v0.5, DELIVERY_PLAN v0.3,
UX_DESIGN_THEMES.md, UX_REVIEW_TODAY_COMPETITIVE.md (7 lens reviews), Iteration 13 T1 freeze,
IMPROVEMENT_BACKLOG.md (19 candidates).

---

## 1. Problem Statement

The 14-module brief arrives as a complete product vision — "futuristic execution cockpit" — for an AI-driven planning system. It names entities, algorithm steps, routes, a component library, and visual direction. The user's actual ask, stated verbatim, is to "revisit the today page to incorporate a design and plan based on the following prompt." That framing constrains the response to Today; the brief is input, not a delivery scope.

A Define-phase PRD is required for the same reason Iteration 9 required one when a comparable 14-point scheduling brief arrived: the brief overfits on implementation detail and underfits on user outcome. Without triage, downstream agents (system-architect, ux-designer, frontend) will implement against the brief rather than against the product's existing invariants, producing conflicts with the T1 token freeze (Iteration 13, 46 tests), the Iteration 12 competitive verdict on drag-and-drop, and the PRODUCT_BLUEPRINT §4.1 MVP boundaries that are already in delivery.

The boundary is Today only. The brief contains real value, but the portfolio view, project intelligence templates, the full data-model entity list, and route renames are cross-page concerns that belong in future iteration PRDs per the UX_DELTA_OTHER_PAGES sequencing. Shipping them in a Today-bounded iteration would constitute scope creep against a product whose 18-epic delivery plan is already 135 project days out.

---

## 2. Brief Scope vs User Intent Reconciliation

The brief is a product spec for a multi-page SaaS. The user's framing bounds this iteration to Today. The two framings are reconciled as follows.

**Today-relevant sections (this PRD owns):**
- Module 1 (cockpit): the planning experience that lives on the Today route — Auto-Plan button, proposed day, bucket visualization, and the user-triggered Replan concept.
- Module 2 (engine): only Today's slice — the morning plan composition moment. The broader auto-scheduling algorithm is already specified in ARCHITECTURE §4.1–§4.7 and ENGINE_DESIGN; no new algorithm decisions belong here.
- Module 5 (reflection): only the EOD piece — the closure ritual that Today is missing (UX_DESIGN_THEMES T3; IMPROVEMENT_BACKLOG C-PM-4 / C-UX-3).
- Module 7 (visual design): only as it affects Today's surface. Cross-page reskin is T2–T10 work.
- Module 10 (components): only Today-rendered ones. Portfolio, Kaizen, and portfolio-card components belong to other pages.
- Module 11 (algorithm): only as input to existing ComposerService integration decisions.
- Module 13 (acceptance criteria): the Today-subset only.

**Cross-page sections (handled in later iterations per UX_DELTA_OTHER_PAGES):**
- Module 3 (project intelligence — DMAIC/Kaizen Event/Accelerator/Custom templates): Kaizen page, already specced in ARCHITECTURE §3.5, DELIVERY_PLAN E13/E17.
- Module 4 (portfolio view — Opportunities/Chartered/Active etc.): Portfolio page; IMPROVEMENT_BACKLOG C-PM-2 closed this in Iteration 11.
- Module 6 (data model entities): Global; architect owns. PlanningHorizon, OpportunityScore, ImprovementLog are not Today entities.
- Module 8 (routes — /dashboard /planner /portfolio /reflection /settings): Global rename; requires coordinator decision before any route changes.
- Module 9 (stack — React/Next.js): Resolved by brief's own §9 clause; existing vanilla stack stands.
- Module 12 (demo data): Global seed; belongs in DELIVERY_PLAN E2 / E13 seed tasks.
- Module 14/15 (build order, final output): Implementation guidance; not PM scope.

---

## 3. Triage Matrix — All 14 Modules

| # | Module | Verdict | Rationale | Already covered by | Conflicts |
|---|---|---|---|---|---|
| 1 | Ultra-Fast Planning Cockpit (one-click Generate, horizon selector, workload meter, DnD, Why chip, conflict warnings, energy-aware recs, replan, calendar export) | MIXED — split below | The cockpit concept maps onto existing Today + composer. Individual features require per-item verdicts (see §5). | PRODUCT_BLUEPRINT §4.1 item 2; ARCHITECTURE §4.1–§4.7; Today.js:1–304 (AutoPlanButton, FineTuneDrawer, CycleCard all present) | Horizon selector, DnD, calendar export conflict with §4.2 / §4.3 / Iteration 12 verdict |
| 2 | AI Auto-Planning Engine (accept projects/tasks/due dates/priority/effort/energy/dependencies/work type/windows; split into 30/60/90 blocks; surface unscheduled work) | ALREADY-COVERED | Engine inputs (role, capacity, active Kaizen, sprint phase, variance queue) already defined. Block durations and scheduling logic in ENGINE_DESIGN §1.1–§1.9; ARCHITECTURE §4.1–§4.7. Energy-window awareness is net-new (C-UX-17). | ARCHITECTURE §4.1–§4.7; ENGINE_DESIGN §1–§3; DELIVERY_PLAN E3 | Energy-window awareness and unscheduled-work tray are genuinely new |
| 3 | Project Intelligence (DMAIC, Kaizen Event, 30-Day Accelerator, Custom; phases + starter deliverables) | IN-SCOPE-CROSS-PAGE | Project types are fully specced and in delivery. Not a Today concern. | PRODUCT_BLUEPRINT §3.5; ARCHITECTURE §3.4; DELIVERY_PLAN E13/E17; PROJECT_TYPE_30D_KAIZEN.md | None; just wrong page |
| 4 | Project Portfolio View (Opportunities/Chartered/Active/Waiting/Completed/Improvement Backlog; per-card fields; opportunity scoring formula) | IN-SCOPE-CROSS-PAGE | Validated Kaizen Portfolio shipped Iteration 11 (IMPROVEMENT_BACKLOG C-PM-2 DONE). Opportunity scoring formula and PROPOSED state are net-new but belong on Portfolio/Kaizen pages, not Today. | InsightsPortfolio (Iteration 11); DELIVERY_PLAN E14 DONE | None; wrong page |
| 5 | Continuous Improvement Loop (daily/weekly reflection metrics; planning accuracy, deep-work completion, CI rate, focus protection score) | ALREADY-COVERED (daily) + IN-SCOPE-CROSS-PAGE (weekly/long-cycle) | Daily EOD reflection is a Today gap (C-PM-4, C-UX-3). Weekly/longer metrics live on Insights. The six named metrics overlap with PRODUCT_BLUEPRINT §7.2 success metrics already defined. | PRODUCT_BLUEPRINT §7.2–§7.5; IMPROVEMENT_BACKLOG C-PM-4 / C-UX-3; UX_FLOWS §2.3 | None if scoped correctly |
| 6 | Data Model (User, Project, ProjectPhase, Task, Deliverable, ScheduleBlock, CalendarEvent, PlanningHorizon, Reflection, ImprovementLog, OpportunityScore, WorkType enum) | IN-SCOPE-CROSS-PAGE | Entity model is architect's domain. New entities (PlanningHorizon, OpportunityScore, ImprovementLog) are not Today-bounded. WorkType enum maps to existing `bucket` enum. | ARCHITECTURE §2.1–§2.13; DELIVERY_PLAN E1 | WorkType enum partially duplicates existing `bucket` field |
| 7 | Visual Design (futuristic dark-mode; Linear/Vercel inspired; green/gold/purple bucket colors) | EXCLUDED (color hex) + DEFERRED (dark mode) | Green/gold/purple conflicts with T1 token freeze (Iteration 13, 46 regression tests; `--project-*` / `--communication-*` / `--ci-*` tokens locked). Full dark-mode reskin is T2–T10 cross-page work not bounded to Today. Linear/Vercel aesthetic intent is appropriate design direction but UX-designer's job to interpret within existing token system. | T1_TOKEN_SPEC.md §2.1–§2.5; UX_DESIGN_THEMES T1 (DONE Iteration 13) | Direct conflict with T1 freeze; see §4.1 |
| 8 | Required Screens (/dashboard, /planner, /portfolio, /projects/:id, /reflection, /settings) | IN-SCOPE-CROSS-PAGE | Route renames are a global IA decision requiring coordinator sign-off. Current routes (/today, /week, /catalog, /kaizen, /insights) are specified in UX_FLOWS §1.1–§1.2 and in delivery. | UX_FLOWS §1.1–§1.2; DELIVERY_PLAN E10 | Any rename conflicts with all existing test fixtures |
| 9 | Implementation Stack (React/Next.js/TS/Tailwind/shadcn) | ALREADY-COVERED | Brief's own §9 "use existing stack if present" clause resolves this to vanilla JS. Confirmed in ARCHITECTURE §1.1 scope line. | ARCHITECTURE §1.1; DELIVERY_PLAN capacity assumption | No conflict; brief self-resolves |
| 10 | Components (PlanningCockpit, HorizonSelector, GeneratePlanButton, ScheduleGrid, ScheduleBlockCard, WorkTypeBadge, BalanceMeter, ProjectCard, OpportunityScoreCard, ReflectionPanel, NextBestActionCard, UnscheduledWorkTray, ProjectTemplateSelector, CalendarExportButton, ReplanButton) | MIXED — Today-subset only | GeneratePlanButton = existing AutoPlanButton. BalanceMeter = candidate C-UX-13 (BucketStrip reframe). ReplanButton = candidate C-UX-14. NextBestActionCard = candidate C-UX-15. UnscheduledWorkTray = candidate C-UX-16. CalendarExportButton, HorizonSelector, ProjectCard, OpportunityScoreCard, ProjectTemplateSelector, PlanningCockpit = cross-page or excluded. WorkTypeBadge = already exists as bucket chip (T1 consolidated). | Today.js:1–304; UX_FLOWS §3.1–§3.12; T1_TOKEN_SPEC.md | Cross-page components out of Today scope |
| 11 | Planner Algorithm (generatePlan 10-step) | ALREADY-COVERED | The 10-step algorithm maps to existing ComposerService.composeDaily() as specified in ARCHITECTURE §4.1–§4.7 and ENGINE_DESIGN §1.1–§1.9. Energy-window step is genuinely new (C-UX-17). | ARCHITECTURE §4.1–§4.7; ENGINE_DESIGN §1; DELIVERY_PLAN E3 | Energy-window preference requires new composer input |
| 12 | Demo Data (DMAIC, Kaizen Event, 30-Day Accelerator, custom; overloaded day fixture) | IN-SCOPE-CROSS-PAGE | Demo data is a global seed concern, not Today UX. The overloaded-day fixture is a QA/testing concern addressable in existing test infrastructure. | DELIVERY_PLAN E2 seed tasks; ARCHITECTURE §7 persistence | None; just global scope |
| 13 | Acceptance Criteria (brief's 9 ACs) | MIXED | Today-relevant ACs: one-click realistic day plan (covered), 4-2-2 visible (covered), "why" explanation (C-UX-12), DMAIC/Kaizen templates (Kaizen page), reflection captures learning (covered + EOD gap). Futuristic feel, differentiated from comparators: UX-designer's job. Draggable blocks: EXCLUDED per §4.2. | UX_FLOWS §2.1; PRODUCT_BLUEPRINT §4.1; IMPROVEMENT_BACKLOG | DnD: see §4.2 |
| 14 | Build Order / Final Output | DEFERRED | Implementation guidance is not PM scope; architect and delivery plan own this. | DELIVERY_PLAN v0.3 | None |

---

## 4. Conflict Resolution (the 4 hard problems)

### 4.1 Bucket colors (green/gold/purple) vs T1 freeze

**PM verdict: Option (c) — Hybrid. Adopt brief's color intent within current tokens; do not re-do T1.**

The T1 freeze (Iteration 13) landed 46 visual-regression tests locking `--project-*` / `--communication-*` / `--ci-*` tokens. Rebasing those tests to new hex values is pure rework with zero user-facing benefit at this stage. The brief's color intent — purple-leaning for CI, gold-leaning for communication — can be interpreted by the UX-designer within the current token namespace if and when T2–T10 cross-page visual passes warrant it. Today's iteration does not touch color values.

### 4.2 Drag-and-drop blocks vs Iteration 12 anti-pattern verdict

**PM verdict: Option (a) — Honor Iteration 12. Keep the existing Edit mode (swap/duration/start-time).**

The Iteration 12 competitive review explicitly flagged DnD as anti-pattern 4: "Naive drag silently violates bucket invariant" (UX_REVIEW_TODAY_COMPETITIVE §5, item 4). No new evidence in the brief overturns this; the brief does not address bucket-invariant guarding. The existing Edit mode with the CatalogPicker, duration chips, and start-time editing (Sprints 13–14) is the correct constrained editing surface. Re-open trigger: a future iteration that ships a bucket-violation guard hardened enough to prevent silent invariant bypass.

### 4.3 Stack (React vs vanilla)

**PM verdict confirmed: vanilla JS.** Brief's §9 self-resolves with "use existing stack if present." ARCHITECTURE §1.1 scope line states "MVP (vanilla JS + localStorage, single-user)." No stack migration is in scope.

### 4.4 Scope boundary (Today-only vs full replatform)

**PM verdict confirmed: Today-only.** Per user framing ("revisit the today page"). Cross-page concerns from the brief are explicitly deferred to future iteration PRDs. Route renames, portfolio view, project intelligence, data model entities, and demo data are all out of scope for this PRD and for any iteration driven by this PRD.

---

## 5. Net-New Today-Bounded Candidates

The orchestrator pre-identified C-UX-12 through C-UX-17. Confirmations, revisions, and two additional candidates follow.

### C-UX-12: "Why this plan?" Explanation Panel

- **Confirmed title.** Validated.
- **Problem:** Composer proposes a day but the user has no visibility into why a specific catalog entry was placed — which Kaizen activity is next, why CI was filled with L&D vs PDCA. This reduces acceptance confidence and drives unnecessary edits.
- **Expected benefit:** Higher composition acceptance rate (PRODUCT_BLUEPRINT §7.2 target ≥60% daily, ≥50% weekly). UX_FLOWS §3.3 already specifies a "why chip" on PROPOSED state ScheduledActivityBlock sourced from `Composition.composerInputsSnapshot.explain[]`; the data contract exists but the panel may not be surfaced in Today.js.
- **Already partially covered:** UX_FLOWS §3.3 sub-element "why chip." Today.js does not import or render this element — the gap is a Today.js rendering gap, not a new feature.
- **Today-bounded:** Yes. The chip attaches to ScheduledActivityBlock on Today.
- **Scores:** Impact 4 / Strategic 4 / Learning 3 / Confidence 4 / Effort 1 / Risk 1 = 13
- **Revised verdict:** This may be a DONE-but-not-imported item. Must grep Today.js and ScheduledActivityBlock.js before scoring. Treat as OPEN pending code confirmation.

### C-UX-13: Reframe BucketStrip as Balance Meter

- **Confirmed title.** Validated.
- **Problem:** BucketStrip renders three static bars. The brief's "Balance Meter" concept suggests a more legible workload status — planned vs actual, overpacked warning, remaining capacity. The strip exists but the "balance" framing (planned vs actual, with remaining ticker) is underdeveloped on Today per UX_FLOWS §6.2.
- **Expected benefit:** User sees at a glance whether today is achievable before accepting. Reduces edit cycles.
- **Already covered:** BucketStrip component is specced in UX_FLOWS §3.2 and §6.2; the "remaining-minutes ticker" in §6.2 surface 3 is specified but may not be rendered in Today.js. This is a Today.js rendering gap, not a new component.
- **Today-bounded:** Yes.
- **Scores:** Impact 3 / Strategic 3 / Learning 3 / Confidence 4 / Effort 1 / Risk 1 = 11
- **Note:** UX-designer owns the visual framing; PM scope is confirming the remaining-minutes data is surfaced.

### C-UX-14: One-Click User-Triggered Replan

- **Confirmed title.** Validated.
- **Problem:** If the user's day shifts mid-execution (a meeting runs long, an activity is skipped), there is no way to recompose the remaining day. The user is left with a stale plan.
- **Expected benefit:** Mid-day recovery path reduces abandoned plans and improves adherence accuracy.
- **Evidence for MVP priority:** PRODUCT_BLUEPRINT §4.1 item 2 specifies the composer must handle variance signals (skipped non-optionals get rescheduling preference). Mid-day replan is the runtime expression of that rule. Without it, the variance queue has no activation path during the day.
- **Today-bounded:** Yes. A "Replan remaining day" action on Today after at least one activity is SKIPPED or IN_PROGRESS-overran.
- **Scores:** Impact 4 / Strategic 4 / Learning 3 / Confidence 3 / Effort 2 / Risk 2 = 10
- **Constraint:** Replan must pass through the same Accept/Edit/Reject triad. It cannot silently re-sequence without user ratification (UX_REVIEW_TODAY_COMPETITIVE §5 anti-pattern 3).

### C-UX-15: NextBestActionCard for Active Projects on Today

- **Confirmed title.** Validated.
- **Problem:** When the user has an active Kaizen, the Deep blocks are linked via `linkedKaizenId`, but there is no Today-surface signal pointing to the next concrete step in the DMAIC/Accelerator/Kaizen Event workflow. The user must navigate to /kaizen to discover what's next.
- **Expected benefit:** Reduces context switches between /today and /kaizen. Keeps the execution loop on Today.
- **Dependency flag:** This candidate depends on the Kaizen entity having a computable "next step" — which requires the DMAIC DAG (DELIVERY_PLAN E8) and/or the Accelerator phase FSM (DELIVERY_PLAN E13) to be landed. It is NOT a blocking dependency for display (a simple "current phase + next guard status" string from the existing KaizenCard data suffices), but full richness requires E8/E13.
- **Today-bounded:** Yes. A compact read-only card on Today showing active Kaizen title, current phase/step, and next action.
- **Scores:** Impact 4 / Strategic 4 / Learning 3 / Confidence 3 / Effort 2 / Risk 2 = 10
- **Revised verdict:** IN-SCOPE-TODAY-POST-MVP pending E8/E13 gate. Does not block Today redesign.

### C-UX-16: Unscheduled-Work Tray on Today

- **Confirmed title.** Validated.
- **Problem:** When the composer produces a PROPOSED day, catalog activities that were eligible but not placed (capacity-excluded) are invisible. The user cannot see what didn't make it in and has no path to surface it without going to /catalog.
- **Expected benefit:** Transparency about what is deferred; reduces user suspicion that the composer is hiding work.
- **Today-bounded:** Yes. A collapsed tray below the CycleCard showing unscheduled-but-eligible catalog entries for the day.
- **Dependency:** Requires ComposerService to emit an `unscheduledEligible[]` list alongside the composition — a new composer output field. Architect owns this.
- **Scores:** Impact 3 / Strategic 3 / Learning 3 / Confidence 3 / Effort 3 / Risk 2 = 7
- **Verdict:** IN-SCOPE-TODAY-POST-MVP. Lower priority than EOD ritual and morning bridge which have stronger evidence.

### C-UX-17: Energy-Window Awareness in Composer

- **Confirmed title.** Validated.
- **Problem:** Composer currently places Deep Work blocks based on catalog order and variance queue, not on the user's self-declared high-energy windows. Brief's AI engine concept names this explicitly; it maps to "preferred windows" as a composer input.
- **Expected benefit:** Users get Deep blocks in their peak-energy hours, increasing actual completion rate on the most cognitively demanding work.
- **Today-bounded:** Yes as a FineTuneDrawer preference input and a composer input signal — the output is visible on Today as better-sequenced blocks.
- **Dependency:** New `User.preferredDeepWorkWindow` field (architect) + new composer branch (engineer). Not a Today.js rendering task; the Today surface sees the result.
- **Scores:** Impact 4 / Strategic 4 / Learning 4 / Confidence 3 / Effort 3 / Risk 2 = 10
- **Verdict:** IN-SCOPE-TODAY-POST-MVP. Good idea; requires architect + engineer work before PM can accept.

### Additional candidates the orchestrator did not name:

**C-UX-18: ConflictWarning Surface for Composer (new)**
- **Problem:** Brief module 1 names "conflict warnings" as a cockpit feature. The InfeasibleBanner (Today.js:164–176) covers the INFEASIBLE state, but there is no surface for soft conflicts (e.g., two back-to-back non-optional activities with no buffer, or external meeting eating into COMMUNICATION floor). These are pre-save warnings, not post-save states.
- **Today-bounded:** Yes. A non-blocking inline warning on the CycleCard in PROPOSED state.
- **Evidence:** ARCHITECTURE §5.6 defines ceilings; UX_FLOWS §4.3 defines invariant-violation messages. The gap is soft-conflict detection below the hard invariant threshold.
- **Scores:** Impact 3 / Strategic 3 / Learning 3 / Confidence 3 / Effort 2 / Risk 2 = 8
- **Verdict:** IN-SCOPE-TODAY-POST-MVP.

**C-UX-19: HorizonSelector on Today — EXCLUDED**
- The brief proposes a Day/Week/Sprint/Month/Quarter switcher on Today. This would transform Today from an execution surface into a planning cockpit that owns multiple cycle types. PRODUCT_BLUEPRINT §1 is explicit: "Today owns the first question — what am I doing right now?" Sprint and Monthly composers are §4.2 Should-Wait. A HorizonSelector on Today would violate page-level job ownership defined in UX_DESIGN_THEMES §1.3. Re-open trigger: Sprint/Monthly composers ship in Next and the IA is revisited.

**C-UX-20: Calendar Export from Today — EXCLUDED**
- Calendar integration (Google/Microsoft) is explicitly §4.2 Should-Wait in PRODUCT_BLUEPRINT. A CalendarExportButton on Today has no integration infrastructure to call. Re-open trigger: DELIVERY_PLAN /integrations epic chartered.

---

## 6. Acceptance Criteria for "Today is CadencePlan-aligned"

These ACs apply to the Today-bounded work from this PRD. They are testable against observable behavior or persisted state.

**AC-1 (Morning bridge — C-UX-10 already in IMPROVEMENT_BACKLOG rank 1):**
Given a user who has a prior-day Composition in CLOSED or partially-CLOSED state, when they open Today on a new calendar day, then a dismissible one-line strip surfaces the prior day's closed/skipped counts before the CycleCard renders.

**AC-2 (EOD closure ritual — C-UX-3 / C-PM-4 already in IMPROVEMENT_BACKLOG ranks 5–6):**
Given a Composition where all ScheduledActivities are in state CLOSED or SKIPPED, when the user views Today, then a non-blocking closure strip renders below the CycleCard confirming the day is complete, surfacing any pending reflections, and offering a link to tomorrow's composition.

**AC-3 (Why chip rendered on Today):**
Given a ScheduledActivity in PROPOSED state with a non-null `composerInputsSnapshot.explain[]` entry, when the user views the activity block on Today, then a tappable why-chip is visible on the block's trailing edge and reveals the explainer text on tap without blocking any other interaction.

**AC-4 (Replan remaining day — C-UX-14):**
Given a Composition in ACTIVE state with at least one ScheduledActivity in state SKIPPED or where actualEndAt exceeds plannedEndAt by more than 10 minutes, when the user taps "Replan remaining day," then the ComposerService produces a new PROPOSED composition for the remaining activities, the Accept/Edit/Reject triad is presented, and no re-sequence commits without user ratification.

**AC-5 (AdherenceDial momentum signal pre-day-7 — C-UX-11 already in IMPROVEMENT_BACKLOG rank 11):**
Given a user with daysSinceSignup between 1 and 6, when the AdherenceDial renders, then it shows a days-accepted pip row or equivalent momentum signal instead of dashes, without altering the metric logic that begins at day 7.

**AC-6 (4-2-2 invariant visible on proposed day):**
Given a Composition in PROPOSED state, when the user views Today, then the BucketStrip is visible above the activity list, shows planned minutes per bucket against the 240/120/120 targets, and updates live during any Edit-mode changes before the user commits.

**AC-7 (Composer Edit mode — no DnD regression):**
Given a user in Edit mode on Today, when they interact with any ScheduledActivityBlock, then the only available reordering mechanism is the existing CatalogPicker swap and duration/start-time chip controls; no drag-and-drop handle is present, and the invariant-violation messages in UX_FLOWS §4.3 fire correctly on any constraint breach.

**AC-8 (Non-optional skip requires reason code):**
Given a ScheduledActivity where CatalogEntry.isNonOptional is true and state is SCHEDULED, when the user taps Skip, then the SkipReasonModal appears with the five fixed reason codes, the Log-variance-and-skip action is disabled until one is selected, and a Variance row is created with appendOnly semantics.

---

## 7. Sequencing Recommendation

Ranked by: evidence strength, blocked-on-other-items status, and Today page ROI.

| Priority | Candidate | Iteration | Depends on | Blocks |
|---|---|---|---|---|
| 1 | C-UX-10: Morning yesterday-recap strip | Iteration 14 | Nothing new — one data read (prior-day counts). T1 DONE. | — |
| 2 | C-UX-3 / C-PM-4: EOD closure ritual + reflection prompt | Iteration 14 | Nothing new; E6 reflection infrastructure is in delivery. | C-UX-14 (replan hooks here) |
| 3 | C-UX-11: AdherenceDial momentum signal pre-day-7 | Iteration 14 | No new infrastructure; pure display-state change. | — |
| 4 | C-UX-12: Why chip surfaced on Today | Iteration 14 | Confirm `composerInputsSnapshot.explain[]` is populated in current ComposerService output before assigning. Likely a rendering-only gap. | — |
| 5 | C-UX-14: One-click replan remaining day | Iteration 15 | ComposerService must accept a mid-day replan input (remaining activities only). Architect decision needed. | — |
| 6 | C-UX-13: Balance Meter (BucketStrip remaining-minutes ticker) | Iteration 15 | Remaining-minutes calculation is in UX_FLOWS §6.2 surface 3; check if ActivityService emits the data or if Today.js must compute it. | — |
| 7 | C-UX-15: NextBestActionCard | Iteration 16 | E8 (DMAIC DAG) or E13 (Accelerator phase FSM) must land first for meaningful "next step" data. | — |
| 8 | C-UX-17: Energy-window composer input | Iteration 16 | New User preference field (architect) + ComposerService branch (engineer). | — |
| 9 | C-UX-16: Unscheduled-work tray | Iteration 17 | New composer output field `unscheduledEligible[]`. | — |
| 10 | C-UX-18: ConflictWarning soft-conflict surface | Iteration 17 | Definition of "soft conflict" thresholds needed from architect. | — |

Note on cross-page independence: C-UX-10, C-UX-3, C-UX-11, and C-UX-12 have zero dependencies on cross-page data model changes. They can ship in Iteration 14 without waiting for any other page or epic.

---

## 8. Out of Scope (Explicit)

| Item | Rationale | Re-open trigger |
|---|---|---|
| Stack migration to React/Next.js | Brief §9 self-resolves to existing vanilla stack; ARCHITECTURE §1.1 confirmed | ARCHITECTURE.md §1.2 future-state layer decision by coordinator |
| Drag-and-drop block reordering | Iteration 12 competitive verdict: anti-pattern 4; silently violates bucket invariant | Bucket-violation guard ships and is hardened against silent bypass |
| Calendar export (CalendarExportButton) | PRODUCT_BLUEPRINT §4.2 explicitly Should-Wait; no integration infrastructure exists | Integration epic chartered in DELIVERY_PLAN |
| Full dark-mode reskin | T2–T10 cross-page work; T1 is the prerequisite (DONE Iteration 13); dark-mode requires T1–T10 landed across all pages | T2–T10 themes completed cross-page |
| Brief's specific hex colors (green/gold/purple) | Conflicts with T1_TOKEN_SPEC.md §2 token freeze; 46 regression tests would rebase | T2–T10 cross-page visual pass where deliberate re-tokenization is scoped |
| Route renames (/dashboard /planner /reflection /settings) | Requires coordinator IA decision; all existing tests reference current routes | Coordinator sign-off on global IA rename |
| HorizonSelector (Day/Week/Sprint/Month/Quarter) on Today | Violates page-level job ownership (UX_DESIGN_THEMES §1.3); Sprint/Monthly composers are §4.2 Should-Wait | Sprint + Monthly composers land in Next |
| Module 3 — Project intelligence templates on Today | Kaizen page concern; DELIVERY_PLAN E13/E17 | No trigger needed; it belongs on /kaizen |
| Module 4 — Portfolio view, opportunity scoring | Portfolio page; C-PM-2 DONE; DELIVERY_PLAN E14 | No trigger needed; already delivered |
| PlanningHorizon entity | ARCHITECTURE §2 entity model; architect owns; not a Today entity | Architect PRD for Next sprint/monthly composer |
| OpportunityScore entity | Portfolio page; no Today binding | Portfolio iteration |
| ImprovementLog entity | Insights page; no Today binding | Insights iteration |
| Module 12 — Demo data / overloaded-day fixture | Global seed; DELIVERY_PLAN E2 seed tasks | E2 / E13 seed task scoping |

---

## 9. Open Questions for Phil

1. **Why chip populated?** Does `Composition.composerInputsSnapshot.explain[]` currently contain per-activity explainer text in the live ComposerService, or is it an empty array? If empty, C-UX-12 is a composer + Today.js task; if populated, it is Today.js only. **Default if unanswered:** assume empty; treat as composer + Today task in Iteration 14 scoping.

2. **Replan trigger placement.** Should the "Replan remaining day" action (C-UX-14) surface as a button on the Today header (always visible once a day is ACTIVE) or only after a SKIPPED activity is logged? **Default:** only after at least one SKIPPED activity, to avoid competing with the primary Accept/Edit/Reject triad.

3. **EOD ritual timing.** Should the closure strip (C-UX-3) fire at a fixed time (e.g., 5 PM local) or when the last activity enters CLOSED/SKIPPED state? **Default:** state-triggered (last activity CLOSED/SKIPPED), not time-triggered, to avoid a blocking modal pattern.

4. **NextBestActionCard scope.** For C-UX-15, is "next best action" limited to the active Kaizen's next DMAIC step, or does it also surface any non-Kaizen IMPROVEMENT_BACKLOG candidates? **Default:** active Kaizen only, consistent with MVP one-Kaizen cap (PRODUCT_BLUEPRINT §4.1 item 4).

5. **Energy windows UI home.** If C-UX-17 ships, does the user configure preferred deep-work windows in the FineTuneDrawer (Today context) or in /settings (persistent preference)? **Default:** /settings (persistent), surfaced in FineTuneDrawer as read-only with a "Change in Settings" link.

6. **Morning bridge data source.** For C-UX-10, does "prior day" mean the most recent calendar day with any Composition record, or strictly yesterday? **Default:** most recent calendar day with a CLOSED or partially-closed Composition, up to 7 days back, with no strip rendered if older than 7 days.

---

## 10. Success Metrics

Success for this PRD iteration (Iterations 14–17 deliverables) is measured against PRODUCT_BLUEPRINT §7.x targets:

| Metric | Blueprint target | Iteration-14 leading indicator |
|---|---|---|
| Day-14 composition-and-reflection rate (§7.4 launch metric) | ≥35% of signups | Morning bridge (C-UX-10) + EOD ritual (C-UX-3) are the two activation levers missing from the current loop. Proxy: reflection rate on days where morning strip rendered vs not. |
| End-of-activity reflection rate (§7.2) | ≥75% over 14 days | EOD ritual (C-UX-3) + C-PM-4 prompt. Measurable via existing `ReflectionCaptured { onTime }` event. |
| Composition acceptance rate (§7.2) | ≥60% daily, ≥50% weekly | Why chip (C-UX-12) reduces uncertainty-driven edits. Measurable via `CycleAccepted { edited: false }` event already instrumented. |
| AdherenceDial momentum — days 1–6 activation | No current target | C-UX-11 momentum signal. Proxy: session return rate day 2–6 vs control. |

A PRD-iteration is "shipped successfully" when: (a) morning bridge and EOD ritual are live and instrumented; (b) the composition acceptance rate is measurable without manual derivation; (c) no T1 regression tests fail; (d) all four ACs in Iteration 14 pass QA.
