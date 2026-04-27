# UX Delta — CadencePlan Today (response to 14-module brief)

Owner: ux-designer
Status: v0.1 — Define-phase UX delta. Companion to PRD_CADENCEPLAN_TODAY.md and
ARCHITECTURE_DELTA_CADENCEPLAN.md.

---

## 1. Brief vs Existing UX Design Themes

| Brief design idea | Maps to existing theme? | Genuinely new? | Conflict |
|---|---|---|---|
| BalanceMeter (reframe of BucketStrip) | T1 (token consistency, canonical at app.css:296–342) | No — vocabulary change only | None if hex values unchanged |
| HorizonSelector (Day/Week/Sprint/Month) | None — Today owns Day context; nav owns Week | Partially new — switcher chrome is new | Scope risk: Sprint/Month not in current architecture |
| GeneratePlanButton / ReplanButton | AutoPlanButton exists (AutoPlanButton.js:24); Replan is net-new | ReplanButton is new affordance | None — additive |
| ScheduleBlockCard / ScheduleGrid | ScheduledActivityBlock + CycleCard — fully implemented | No | None |
| WorkTypeBadge | T1 chip system — fully implemented | No | None |
| NextBestActionCard | No equivalent anywhere in product | Yes — fully new | Potential A5 (dashboard widget) risk if Today owns it |
| UnscheduledWorkTray | No equivalent | Yes — fully new | Risk of contradicting A1 (infinite-scroll backlog) |
| ReflectionPanel | T3 (Closure Ritual, not yet implemented) — C-UX-3 OPEN score 12 | No — matches T3 intent | None; ReflectionPanel IS T3 |
| "Why this plan?" explainer | Relates to T3 symmetry (open-of-day rationale); WhyChip exists per-activity | Partially new — page-level version | None |
| Futuristic dark-mode reskin | Conflicts with T1 freeze (app.css:13–41, 46 regression tests) | No | Major conflict — all pages, all regression tests |
| Mission-control aesthetic | Conflicts with Sunsama north-star (competitive review §9) | No | Aesthetic conflict; see §2 |
| Green/gold/purple bucket colors | Brief: green=deep work, gold=comms, purple=CI; T1: ci-bg #dcfce7 green, project-bg #fef3c7 amber, communication-bg #e0e7ef slate | No new hues needed | Naming mismatch only; hex already approximates brief intent |
| Drag-and-drop scheduling | Anti-theme A4 (Iteration 12 competitive review §5 pattern 4) | No | Explicit conflict — silently violates bucket invariant |
| Energy-window display | Competitive review §3 pattern 6 (energy color-coding in 4 comparators) | Partially new — no energy-window track exists | None — additive if surface is correct |
| CalendarExportButton | Deferred per brief §10; not a Today concern this cycle | No opinion needed | None |

---

## 2. The Aesthetic Question — Mission Control vs Deliberate Cadence

The brief uses "mission control / operating system / continuous improvement engine" as its aesthetic register. The Iteration 12 competitive review (§9) named Sunsama — explicitly not Motion — as the north-star. These are different aesthetic commitments with consequences for information density, visual temperature, and how urgency is communicated.

Mission-control (Motion, early Linear) privileges speed signals: queued tasks, load indicators, auto-rescheduling ripples, and a visual metaphor of throughput. Sunsama privileges intentionality: one plan, committed before the day starts, reviewed at day's end, with no ambient urgency. BAM-X's 4-2-2 constraint model, the commit-gated edit flow, and the manual ratification requirement all derive from the Sunsama ethos. A mission-control surface would need to justify why a user is watching a real-time load meter when the plan was locked at 8 AM.

**Verdict: option (c) — hybrid.** Adopt the brief's INFORMATION DENSITY and PRECISION framing from Linear (tight grids, clean type hierarchy, no decorative whitespace) while holding Sunsama's CALM and INTENTIONAL register as the behavioral north-star. Concretely: tighter row heights on ScheduledActivityBlock, a more precise BalanceMeter readout, and a ReplanButton that requires explicit intent — but no ambient status animations, no throughput visualization, and no frantic agenda surface. The product can be high-density without being high-anxiety. This preserves all 46 regression tests, all existing T1–T10 work, and the Sunsama competitive positioning that survives first-principles review.

---

## 3. Color Conflict Resolution

The brief specifies green for deep work, gold for communication, and purple for improvement. T1 (Iteration 13, shipped) locks: `--project-bg: #fef3c7` (amber/gold), `--ci-bg: #dcfce7` (green), `--communication-bg: #e0e7ef` (slate). The brief's green=deep-work maps to CI in T1 but PROJECT in brief semantics. Purple for CI is absent from T1 entirely.

Adopting the brief's hex values would rebase all 46 visual-regression tests in `tests/ui/bucketMeta.regression.test.js` and touch every page. The color names in the brief are semantically appealing but the hex in T1 already approximates the brief's intent if you permute the bucket-to-color mapping: amber IS gold, green IS green, slate IS not purple.

**Verdict: option (c) — keep T1 hex values, rename CSS variables in documentation only.** The `--project-*` / `--communication-*` / `--ci-*` namespace stays byte-for-byte. In copy and UX documentation, PROJECT may be labeled "Deep Work" and CI may be labeled "Improvement" to align with brief vocabulary. The hex values do not move. No regression tests rebase. Purple for CI is a Color v2 consideration gated on a future design refresh epic (T1_TOKEN_SPEC.md §9 re-open trigger: "design refresh epic, Iteration 16+"). If Phil wants purple CI, schedule a Color v2 pass after T2–T10 land; do not interrupt T1's locked foundation.

---

## 4. Per-Brief-Component Visual Treatment Recommendations

**PlanningCockpit (page shell)**
Today does not need rebranding. The `today-page` shell (Today.js:252, app.css:94) is structurally correct: flex column, gap 20px, max-width 1200px via `.app-shell`. The term "PlanningCockpit" is acceptable as a product-brief vocabulary word but should not appear in UI chrome. The page title is "Today." Distinction from Motion: Motion's cockpit is real-time and ambient; BAM-X's cockpit is commit-gated and calm — different metaphors even if the word is shared.

**BalanceMeter (reframe of BucketStrip)**
The BucketStrip at app.css:296–342 is the canonical meter. "BalanceMeter" as a vocabulary term adds semantic richness — it frames the 4-2-2 bars as a live balance gauge rather than a static plan summary. Under T1 tokens, the visual treatment upgrade: replace the label text "PROJECT / COMMUNICATION / CI" with "Deep Work / Comms / Improvement" in the rendered `<li>` (BucketStrip.js:51–55) as a display-only rename. The track and fill rendering are already correct. The "meter" distinction from Sunsama (which shows a running time total) is that BAM-X shows plan-vs-target ratio, not elapsed time. Distinguish from Motion by keeping the bars static until plan is committed, not live-updating on clock ticks.

**HorizonSelector (Day/Week/Sprint/Month/Quarter)**
Not currently in the product. If scoped to Today+Week only (the two implemented routes), a two-state segment control at the top of Today, linking to `#today` and `#week`, is feasible under existing nav. Default state: Day (current route). Sprint/Month/Quarter selectors are deferred until those routes exist. Placement: inline with the page header, right-aligned alongside the day-badge. Visual treatment: ghost segments, active segment gets `--primary` fill. Do not place it where the `today-day-badge` currently sits — they would fight for the same reading position.

**GeneratePlanButton / AutoPlanButton**
The AutoPlanButton (AutoPlanButton.js:24) is correctly positioned as a primary CTA. No treatment upgrade required. The button label "Auto-Plan" is specified verbatim in SCHEDULING_UX §3.13 and should not be renamed "Generate Plan." The brief's rename is cosmetic and creates label divergence with existing copy. Keep existing button; the upgrade is visual hierarchy (T6 — Start vs Skip parity is the more urgent AutoPlan-adjacent issue).

**ScheduleBlockCard (ScheduledActivityBlock)**
Keep T1 token treatment. The energy hint (see C-UX-17 below) surfaces as a colored left-border or background tint variation driven by an `energyWindow` data attribute, not by changing bucket chip treatment. Distinction from Linear: Linear's issue rows use type hierarchy only; BAM-X's blocks use bucket tone as primary differentiator. Distinction from Motion: Motion renders blocks on an hour-grid at pixel-precise time positions; BAM-X renders blocks in a ranked list that shows time as a label, preserving the "plan is a commitment" framing.

**WorkTypeBadge (bucket chip)**
Keep. T1 is complete. `sa-bucket-chip chip-project` etc. are the canonical form per T1_TOKEN_SPEC.md §2.2. No change.

**ReplanButton**
New affordance. Visual identity: ghost button, secondary weight, placed in the CycleCard header alongside the existing FineTuneButton (or as an alternative header action when the composition is in ACCEPTED/ACTIVE state). Label: "Re-plan." Not a flow entry — a single button that fires a reconfirmed `AUTO_PLAN` action after showing a brief inline warning ("Re-planning will replace your current plan. Confirm?") via an inline disclosure, not a modal. Distinction from GeneratePlanButton: GeneratePlanButton fires on empty state; ReplanButton fires on an existing ACCEPTED composition. They are different states of the same underlying action. The inline confirmation is the key behavioral difference from a bare second Auto-Plan button.

**NextBestActionCard**
New. One card only — not a list. If multiple "next actions" exist, show only the top-ranked one by priority. Placement: below the NowPane strip and above the CycleCard when no activity is IN_PROGRESS. When an activity IS in progress, suppress entirely (NowPane owns that moment). Card variant, not row variant: a contained tile with an activity name, a project name, and a single CTA ("Start" or "Add to today"). Relationship to Portfolio KaizenCard: KaizenCard tracks multi-day project state; NextBestActionCard tracks immediate next action within today's project work. They are different granularities and should not share chrome. Anti-theme A5 risk (dashboard widget creep) is real: scope strictly to one card, tied to active Kaizen project only, not a general backlog surface.

**UnscheduledWorkTray**
New. Default state: collapsed strip at bottom of CycleCard reading "N items outside today's plan" with an expand chevron. Expanded state: a drawer from the bottom of the card body (not a page-level drawer) showing the overflow list. This is the only acceptable form — a page-level tray or sidebar would surface a backlog on Today and trigger anti-theme A1. The items in the tray are capacity-overflow items only (activities the composer could not fit), not a free backlog. Collapsed by default prevents the "infinite scroll task backlog" failure mode. The brief's name "UnscheduledWorkTray" is accurate; keep it in internal documentation.

**ReflectionPanel**
This IS T3 (Closure Ritual, C-UX-3, backlog score 12). Visual treatment: a non-blocking strip rendered below the last CLOSED/SKIPPED activity when all activities in the composition are terminal states. The strip contains: a one-line completion summary ("4 closed · 1 skipped"), a prompt for EOD reflection ("Capture your day in the Weekly Reflection"), and a "Dismiss until tomorrow" link. No blocking modal. The term "ReflectionPanel" is acceptable in documentation; in UI it renders as a strip, not a named panel. Distinction from Sunsama's shutdown ritual: Sunsama's is a wizard with multiple steps; BAM-X's is a single non-blocking nudge — appropriate for the product's non-consulting-voice requirement.

---

## 5. The 6 Net-New Today Candidates (visual specs)

**C-UX-12 "Why this plan?" — plan rationale explainer**
Title: Plan Rationale
Visual sketch: A collapsed single-line chip reading "Why this plan? ↓" anchored immediately below the CycleCard header. On tap/click, expands inline to a 3–5 bullet summary of the composer's rationale (derived from existing `explainEntry` data already surfaced per-activity via WhyChip). When expanded, a "Got it" dismiss returns to collapsed chip. NOT a full panel — a progressive disclosure within the CycleCard header zone.
Placement: Inside the CycleCard, below the composition title, above the BucketStrip.
T1-token usage: Chip uses `--muted` border, `--bg` background; expanded body uses existing `empty-copy` text treatment.
Interaction: Collapsed by default. Expand on click. Dismiss collapses. Does not persist dismissed state — re-collapses on next page load (the plan changes daily, so rationale is always contextually fresh).
Relationship to themes: T3 symmetry — T3 closes the day (ReflectionPanel); C-UX-12 opens the day (plan rationale). Mirrors Sunsama's "5-P Process" first step (understand what you're working with).

**C-UX-13 BalanceMeter reframe — BucketStrip vocabulary upgrade**
Title: BalanceMeter
Visual sketch: The existing BucketStrip bars (app.css:296–342) are unchanged in pixel treatment. The bucket label text changes from "PROJECT / COMMUNICATION / CI" to "Deep Work / Comms / Improvement" at the display layer only (BucketStrip.js:51–55). A small numeric readout in the `bucket-value` column changes from "Xm/Ym" to "Xh Ym / Yh" for durations over 60 minutes, making the meter read as time rather than raw minutes. No layout or color change.
Placement: No change from current position within CycleCard.
T1-token usage: Unchanged — `--project-bg/fg/fill`, `--communication-bg/fg/fill`, `--ci-bg/fg/fill`.
Interaction: Static display. No new interactions. The edit-mode blackout bug (C-UX-2) must ship first or the BalanceMeter upgrade is invisible during the moment it matters most.
Relationship to themes: T1 — extends the token system's vocabulary without changing its hex values.

**C-UX-14 ReplanButton — user-triggered replan**
Title: Re-plan
Visual sketch: A ghost secondary button in the CycleCard header row, right-aligned, alongside or replacing the existing FineTuneButton when a composition is in ACCEPTED/ACTIVE state. Label: "Re-plan." On click: an inline confirmation disclosure slides open below the button: "Re-planning replaces your current accepted plan. Continue?" with two options — "Continue" (primary, fires AUTO_PLAN) and "Cancel" (ghost, collapses disclosure). The disclosure is 1 row of text + 2 buttons; it is NOT a modal.
Placement: CycleCard header, right-aligned. FineTuneButton remains for capacity adjustment; ReplanButton is for full recompose. They serve different intents and can coexist.
T1-token usage: Ghost button uses `--border`, `--fg`. Disclosure uses `--bg`, `--border`, `--danger` for the "Continue" button to signal consequence.
Interaction notes: Available only in ACCEPTED/ACTIVE composition state. Not available in PROPOSED state (AutoPlanButton already owns that moment). Not available in edit mode (commit or cancel first).
Relationship to themes: T6 — ReplanButton is secondary to FineTuneButton; their relative hierarchy must be clear. FineTuneButton adjusts capacity; ReplanButton discards the current plan. Destructive weight difference must be expressed in visual hierarchy.

**C-UX-15 NextBestActionCard — active project next action**
Title: Next Best Action
Visual sketch: A contained card (same border-radius/shadow as CycleCard but narrower: full width, 2-row height) reading: top row — project name chip + activity name in medium weight; bottom row — a "Start" CTA (primary button) or "Add to today" if not yet scheduled. A single dismiss × removes it for the session.
Placement: Between NowPane and CycleCard, only when no activity is IN_PROGRESS. When IN_PROGRESS, this card is fully suppressed.
T1-token usage: Card background `--bg`, border `--border`. Project chip uses `chip-project` class. CTA button uses `--accent-primary` (T1 post-rename).
Interaction notes: One card only. Tied to the active Kaizen project. Not a general backlog widget. Session-dismiss only. Suppressed when IN_PROGRESS (NowPane owns that moment). Suppressed on empty-state Today. Anti-theme A5 is the active risk — scope enforcement is the key design constraint.
Relationship to themes: T7 (Page Header Trio — the card is a contextual secondary signal below the header, not a competing header element). T5 (empty-state warmth — the card provides a named next step when the day feels open).

**C-UX-16 UnscheduledWorkTray — capacity overflow visualization**
Title: Overflow Tray
Visual sketch: A collapsed strip at the very bottom of the CycleCard body (below the last ScheduledActivityBlock row) reading "↓ N items outside today's plan" in muted small text with a chevron. On tap: the strip expands in-place to show the overflow list as a simple text list (name + bucket chip). Items are read-only — no actions, no Start buttons. A "Close" link at the bottom of the expanded list collapses it. The list is max 5 items visible before a "Show all" link.
Placement: Bottom of CycleCard body, always below all ScheduledActivityBlock rows.
T1-token usage: Strip background `--bg`, text `--muted`, border-top `--border`. Bucket chips use standard `chip-*` classes.
Interaction notes: Collapsed by default. Read-only — no scheduling from this surface. Anti-theme A1 applies: this is NOT a task backlog; it is capacity-overflow items only (activities the composer attempted to place but could not). No free entry. No drag. No add-to-today from this surface (that action belongs to the EditDrawer).
Relationship to themes: T5 (empty state — shows the user that work was considered and deferred, not forgotten). T10 (append-only — overflow items are not hidden; they are visible but separated from the committed plan).

**C-UX-17 Energy-window display — activity block chrome**
Title: Energy Window
Visual sketch: A 3px left-border accent on ScheduledActivityBlock rows, color-coded by energy window. Deep Work blocks (PROJECT bucket) already have amber fill from T1; energy chrome would add a `data-energy="high"` attribute and a corresponding CSS rule that shifts the block's left-border to a slightly brighter amber. Communication blocks get a cooler border. CI blocks get a greener border. This is a subtraction of contrast from the bucket chip and an addition of it to the block border — two signals instead of three. The `.sa-duration` column (currently redundant per UX_REVIEW_TODAY_DESIGN.md §4) could be freed to carry an energy icon (flame, wave, leaf) at 16×16px.
Placement: Applied to the `sa-block` element via `data-energy` attribute; CSS-only change if `energyWindow` is added to the activity object.
T1-token usage: Reuses `--project-fill`, `--communication-fill`, `--ci-fill` for border color — no new tokens needed.
Interaction notes: Informational only. No click, no expand. If the `energyWindow` field is not on the current activity schema, this candidate is blocked on the architect adding it. This is the most architecture-dependent of the 6 candidates.
Relationship to themes: T1 (bucket-tone consistency — energy chrome is additive to the token system, not parallel to it). T10 (append-only — CLOSED/SKIPPED blocks retain their energy border in muted form alongside the existing opacity reduction).

---

## 6. Information Architecture for Today (post-redesign)

Current layout: header (day-badge + AdherenceDial + FineTuneButton) → RhythmExplainer → NowPane → mobile UpNext → CycleCard → drawer/modals.

Proposed layout after net-new candidates land:

| Region | Content | Change from current |
|---|---|---|
| Header | AdherenceDial (left anchor) + HorizonSelector (center, Day selected) + ReplanButton + FineTuneButton (right) | Day-badge demoted to secondary label inside AdherenceDial region; reading order: status first |
| Morning Bridge | Yesterday-recap strip (C-UX-10, OPEN backlog rank 1) | Additive — renders only when prior-day data exists |
| RhythmExplainer | Collapses to chip after first dismiss (T1 divergent finding §3.1) | No structural change; behavior change only |
| NowPane | Unchanged | No change |
| NextBestActionCard (C-UX-15) | One-card block between NowPane and CycleCard | New; suppressed when IN_PROGRESS |
| CycleCard | Header + Plan Rationale chip (C-UX-12) + BalanceMeter (C-UX-13) + ScheduleBlockCard rows with energy chrome (C-UX-17) + UnscheduledWorkTray strip (C-UX-16) | Rationale chip and BalanceMeter label rename are additive; energy chrome is additive; tray is additive at bottom |
| ReflectionPanel / EOD strip | Non-blocking strip below last terminal activity (C-UX-3, T3) | New; renders only when all activities CLOSED/SKIPPED |
| UpNextRail (desktop) | No change in placement; after C-UX-7 fix, no longer duplicates NowPane | Behavioral fix only |
| Drawer/modals | No change | No change |

Items removed or consolidated: The `sa-duration` column at 60px (redundant with Sprint 16a time range per UX_REVIEW_TODAY_DESIGN.md §4) should be retired once C-UX-17 energy chrome uses that visual slot. The duplicate UpNext signal (C-UX-7) is resolved by behavioral fix, not structural removal.

---

## 7. Cross-Page Implications

**BalanceMeter** — Yes, Week needs it. Week.js:138–153 `DayPreview` renders a `<dl>` for per-bucket totals with no BucketStrip component; the vocabulary rename (Deep Work / Comms / Improvement) and the hours display format should propagate to Week in Loop A per UX_DELTA_OTHER_PAGES.md cross-page sequencing. Sequencing: Today first, then Week in the same loop.

**ReplanButton** — Week needs an equivalent. Week page "Accept all 5 days" footer is the primary action; a "Re-plan week" ghost button alongside the propose button is the Week-equivalent. Sequencing: Today first (Loop A), Week in Loop B after the inline-disclosure interaction pattern is proven on Today.

**NextBestActionCard** — Portfolio already has KaizenCard (KaizenCard.js). These are different granularities: NextBestActionCard shows the immediate next action within today; KaizenCard shows the multi-day project state. They should share the project chip class (`chip-project`) but not structural chrome. No cross-page propagation needed — NextBestActionCard is Today-only per its suppression rules.

**UnscheduledWorkTray** — Week needs an equivalent: a "not scheduled this week" overflow per day column. However, the Week equivalent is lower priority and architecturally more complex (per-day vs per-composition). Sequencing: Today MVP first; Week equivalent deferred to Loop B.

**Energy windows** — Week grid blocks (WeekGrid.js) would benefit from the same `data-energy` left-border treatment. Sequencing: Today first (Loop A), Week in Loop B once the `energyWindow` field is confirmed on the activity schema. Cite UX_DELTA_OTHER_PAGES.md Week section: the T1 token fix and week-header status signal are Loop A; energy chrome is Loop B.

Recommended sequencing per UX_DELTA_OTHER_PAGES.md: Week → InsightsPortfolio → Portfolio → Kaizen → Catalog. Net-new Today candidates that travel (BalanceMeter labels, energy chrome, ReplanButton pattern) go to Week in Loop A. NextBestActionCard and UnscheduledWorkTray are Today-scoped and do not propagate in Loop A.

---

## 8. Anti-Themes Confirmed

The following brief ideas must not be adopted, consistent with Iteration 12 anti-pattern verdicts:

**Drag-and-drop blocks (anti-theme A4)** — The brief's "ScheduleBlockCard" metaphor may invite a drag-to-reorder mental model from engineers. Confirmed anti-theme. Drag silently violates the bucket invariant because the 4-2-2 constraint is enforced at composition time, not at rendering time. Any swap must go through the commit-gated EditDrawer flow. UX_REVIEW_TODAY_COMPETITIVE.md §5 pattern 4. No new evidence overrides this.

**Free-form AI auto-reschedule without ratification (anti-theme A3)** — The brief's "ReplanButton" must NOT silently replan the day in the background. It must require an explicit confirmation step (inline disclosure, not ambient). UX_REVIEW_TODAY_COMPETITIVE.md §5 pattern 3. The inline confirmation on C-UX-14 enforces this.

**Over-broad Today surface / dashboard widget creep (anti-theme A5)** — NextBestActionCard (C-UX-15) and UnscheduledWorkTray (C-UX-16) each carry this risk. Both are scoped to: one item only (C-UX-15), capacity overflow only (C-UX-16), and suppressed when IN_PROGRESS (C-UX-15). UX_REVIEW_TODAY_COMPETITIVE.md §7 anti-pattern 5. UX_DESIGN_THEMES.md §6 A5.

**Streak penalties (anti-theme A2)** — The brief does not explicitly propose streaks, but the "consistency visualization" language in §13 acceptance criteria could invite it. AdherenceDial percentage is safer than a breakable streak counter. C-UX-11 (momentum signal pre-day-7) uses pip rows and a day counter, not a streak count. UX_DESIGN_THEMES.md §6 A2.

**Dark-mode reskin as a Today-specific change** — Not an anti-theme per se, but explicitly out of scope for this delta. Dark mode affects all pages and all 46 regression tests. Raise as a separate epic after T2–T10 land.

---

## 9. Open Questions for Phil

1. **HorizonSelector scope this cycle.** The brief names Day/Week/Sprint/Month/Quarter. Only Day and Week routes exist. Should HorizonSelector be scoped to Day/Week only for this cycle, or deferred entirely until Sprint/Month exist? Default: scope to Day/Week only; render as a two-state segment control.

2. **NextBestActionCard data source.** The card shows the active Kaizen project's next action. Is "next action" derivable from the current Kaizen entity (which is a JSON blob per C-PM-5), or does it require C-PM-5 (ImplementationBacklog first-class entity) to ship first? Default: block C-UX-15 on C-PM-5; do not surface an empty card.

3. **UnscheduledWorkTray — overflow definition.** Are overflow items strictly "composer attempted to place but could not due to capacity" or also "activities in the catalog not scheduled today by choice"? These are very different lists. Default: strictly capacity-overflow items only (composer-surfaced), never free backlog.

4. **Energy window field.** Does the activity schema currently carry an `energyWindow` field (e.g., MORNING / AFTERNOON / EVENING), or does C-UX-17 require new schema work? Default: treat C-UX-17 as blocked on schema confirmation from architect; do not design chrome for a field that does not exist.

5. **ReplanButton vs FineTuneButton coexistence.** In the proposed header, both buttons are right-aligned in the CycleCard header. On narrow viewports they will stack or overflow. Should ReplanButton be inside the FineTuneDrawer as a footer action instead? Default: ReplanButton lives inside the FineTuneDrawer footer ("Replan with these settings"), not in the CycleCard header, resolving the viewport conflict and logically connecting replan to the capacity-adjustment flow.

6. **BalanceMeter label rename scope.** Renaming "PROJECT / COMMUNICATION / CI" to "Deep Work / Comms / Improvement" in BucketStrip.js:51–55 touches the `BUCKET_LABELS` export in `bucketMeta.js` (T1_TOKEN_SPEC.md §6). Does changing `BUCKET_LABELS` require regression test updates? Default: yes — update the label assertions in `tests/ui/bucketMeta.test.js` alongside the rename; treat as a T1 minor patch.

---

## 10. Recommendation

PROCEED-WITH-DESCOPE. The brief's highest-value Today ideas — BalanceMeter vocabulary upgrade, ReplanButton, ReflectionPanel (T3), and Plan Rationale (C-UX-12) — are all additive to the existing architecture and coherent with Iteration 12 themes. The smallest coherent Today redesign that ships next is: (1) close C-UX-10 (morning recap strip, backlog rank 1, score 14) and C-UX-3 (ReflectionPanel/EOD closure strip, score 12) together as the ritual bookends; (2) add the BalanceMeter label rename (C-UX-13) as a zero-risk vocabulary pass; (3) add the Plan Rationale chip (C-UX-12) as a progressive-disclosure within the CycleCard. These four items are coherent, testable, and do not require new schema, new routes, or dark-mode work. NextBestActionCard (C-UX-15) is blocked on C-PM-5. UnscheduledWorkTray (C-UX-16) needs PM to define overflow semantics. Energy windows (C-UX-17) need schema confirmation. ReplanButton (C-UX-14) can ship after the bookend ritual is stable. Explicitly reject dark-mode reskin, drag-and-drop, green/gold/purple hex changes, and HorizonSelector beyond Day/Week for this cycle.
