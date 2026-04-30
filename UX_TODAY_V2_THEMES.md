# Today v2 — Synthesis (vs <10s + <60s targets)

Status: v0.1 — Define-phase. Awaiting Phil approval before any candidates ship.

---

## 1. Executive Summary

Today v2 faces a structural comprehension failure on its primary surface. A returning user
(day 3+) opens the page and encounters three high-noise zones — a filled primary-color
day-badge, a 57-word RhythmExplainer card, and an AdherenceDial showing dashes — before
their eye reaches the CycleCard that contains the actual plan. The CycleCard ranks fourth
in visual weight despite being the primary content surface (Design §3). On a 1280px laptop
with the explainer undismissed, the plan is not visible within 10 seconds. The 60-second
update-and-start path is within budget only when zero friction occurs during edit; any
catalog search exceeding 15 seconds or keyboard-only navigation without a focus trap busts
the budget alone (QA §3, Frontend §2).

The biggest single weakness is not a component-level flaw — it is the unconditional render
policy for onboarding content. The RhythmExplainer, the DayBadge fill, and the AdherenceDial
null state all serve day-0 users. Returning users pay a compounding attention tax for content
that is no longer relevant to their job. Four of seven lenses independently named the
RhythmExplainer's always-on render as the primary block to the 10-second target (Design §4
SK-1, Product §4, Growth §1, Competitive §3 item 1). This is the defining convergent finding
of the synthesis.

The strategic principle for v2 is: suppress informational surfaces that do not answer "what
is my plan right now?" and "what do I do next?" for returning users, and instrument the page
before shipping any visible change so improvement can be measured. A v2 that ships without a
`TodayPageViewed` baseline (Analytics §4) is unmeasurable and cannot claim it hit either
target.

---

## 2. Convergent Findings (≥ 4 lenses agreed)

### CF-1: RhythmExplainer unconditional render blocks the 10s target
Lenses (5): UX, PM, Growth, QA, Competitive.
- UX §4 SK-1: "57-word paragraph reads at ~15 words/sec = 3.8s read time alone. Estimated
  cost: 4–6s of scan time per session for any undismissed user."
- PM §4: "renders on every state including infeasible — user's job in infeasible is to fix
  capacity, not learn the rhythm."
- Growth §1 §3: "Day 5 user gains nothing from re-reading 4-2-2 explainer copy." Proposes
  day 3 as auto-suppress threshold.
- QA §1 word-count proxy: RhythmExplainer alone busts the ≤25-word/region limit for the
  region it occupies.
- Competitive §5 anti-pattern 2: Sunsama morning ritual modal is the comparator equivalent
  — flagged as incompatible with the <60s goal.
Synthesis call: Auto-collapse to a single-line chip when `daysSinceSignup >= 3` and
`dismissed === false`; suppress entirely when `dismissed === true`; never render on the
infeasible branch regardless of dismissal state.

### CF-2: Edit-entry ambiguity — dual Commit surfaces and drawer discoverability
Lenses (5): UX, PM, Frontend, QA, Competitive.
- UX §4 SK-2: "When EditDrawer is open, both CycleCard triad-edit and EditDrawer footer
  render three buttons each. Estimated cost: 2–3s confusion per edit session."
- PM §5: "Two separate edit paths (FineTuneDrawer for capacity; EditDrawer for swaps) not
  visually differentiated. Discovery cost: 6–10s."
- Frontend §7 item 7: "Extract shared EditActionTriad — two independently maintained
  Commit/Cancel/Undo implementations; diverge silently."
- QA §3: keyboard TOC to EditDrawer search is 10–20+ tabs without focus trap; directly
  busts <60s target.
- Competitive §3 §7: "Akiflow keyboard-first command path — E to edit focused block, Enter
  to commit. Highest-leverage change for <60s goal."
Synthesis call: Two sub-problems. (a) Suppress CycleCard triad-edit when EditDrawer is
open — single canonical Commit surface. (b) Auto-focus EditDrawer search on open; add E
shortcut on focused block; Escape cancels and returns focus. Both are pure renderer moves;
no §6.5 trigger.

### CF-3: BucketStrip blackout in edit mode (C-UX-2 OPEN)
Lenses (4): UX, PM, Frontend, QA.
- UX §4 SK-3: "BucketStrip invisible during the action that most needs it. Estimated
  cost: 10–20s per violation cycle (Commit → observe violation → undo → re-edit)."
- PM §5: "BucketStrip dimmed during edit mode — invariant feedback hidden during the action
  that most requires it."
- Frontend §5 CSS: `.today-editing .cycle-card:not(.cycle-editing)` applies opacity 0.4 to
  the full card, including BucketStrip.
- QA §4: BucketStrip `planned` span is fragile to class rename; fix must not change the
  class name.
Synthesis call: Scope the dim selector to `.sa-actions, .triad` within the non-editing card,
not the full `.cycle-card`. BucketStrip stays at full opacity and pointer-events: auto during
edit. One CSS selector change at app.css:1519–1522.

### CF-4: No instrumentation to measure either target (C-AN-1 OPEN)
Lenses (4): Analytics, QA, PM, Growth.
- Analytics §2: "`TodayPageViewed` does not exist today. It is the required anchor; without
  it this metric cannot be computed at all."
- QA §1: CCC and word-count proxies are testable without instrumentation, but the real
  latency number requires `TodayPageViewed`.
- PM §8: ACs for the 10s/60s targets reference observable events that require instrumented
  anchors to validate.
- Growth §6 rank 5: "C-AN-1: prerequisite for measuring improvements 1–4."
Synthesis call: C-AN-1 (`TodayPageViewed` + `EditDrawerOpened`) lands in Iteration 21 and
starts a 14-day baseline window before any visible v2 change ships. No v2 visual change can
claim it hit either target without baseline data (Analytics §4).

### CF-5: Focus-trap and keyboard-first edit path absent (C-UX-6 OPEN)
Lenses (4): Frontend, QA, Competitive, UX.
- Frontend §7 item 6/8: shared DrawerShell with focus trap in one place eliminates the fix
  propagation problem.
- QA §3: "Single fix: auto-focus first EditDrawer element on open + Escape restores focus.
  Cuts TOC to ~12 from 25–45."
- Competitive §3 §7: E+Enter path is "single most copy-able for <60s" from Akiflow/Sunsama.
- UX §2 path (b): Locate Commit — two candidates visible — +2s confusion every edit session.
Synthesis call: Auto-focus EditDrawer search on open; Escape returns focus to the EDIT
button; E shortcut on focused block enters edit. Cuts keyboard TOC from ~35 ops to ~12.
Effort S. Directly ties to C-UX-6 OPEN.

### CF-6: AdherenceDial null-state wastes prime real estate for 7 days (C-UX-11 OPEN)
Lenses (4): Growth, UX, PM, Competitive.
- Growth §3 §4 AR-2: "For five straight days communicates nothing. Users learn to ignore it
  before it becomes meaningful." Ranked biggest activation risk.
- UX §4 SK-5: "Three em-dashes in a 280px header block; zero information delivered."
- PM §4: "low-actionability in the moment; secondary to comprehension target."
- Competitive §3: four of eight comparators show streak or consistency visualization before
  full metrics unlock.
Synthesis call: Pre-day-7 variant renders "Day N · X days accepted" text row. Display-only;
`daysSinceSignup` and accept history already in props. Promotes to percentage triplet at
day 7+. Maps to C-UX-11 OPEN.

---

## 3. Divergent Findings

### D-1: RhythmExplainer threshold — day 2 vs day 3
UX §8 Q1: day 2 (`daysSinceSignup >= 2`). Growth §1: day 3. PM §4: "dismissed AND
daysSinceSignup > 1" (equivalent to day 2).
Call: Day 3 (Growth). Growth's rationale is behavioral — by day 3 the user has completed
at least one full acceptance cycle, making the explainer definitively redundant. Day 2 is
permissible if Phil has cohort data showing users stop reading earlier.
Default: `daysSinceSignup >= 3`.

### D-2: Edit drawer unification — one drawer/two tabs vs separate with clearer labels
PM §9 Q1: "determines S vs M effort." Frontend §7 item 7: extract shared triad first
regardless. UX §4: single Commit surface resolves the structural issue without unification.
Call: Out of scope for v2. Suppress CycleCard triad when EditDrawer is open (S effort)
resolves the dual-commit problem. Drawer labels clarified (copy change, S effort). Full
unification deferred as a PM open question.

### D-3: NowPane UPCOMING suppression vs UpNextRail offset
UX §8 Q3 Option A: NowPane canonical; UpNextRail starts at index 1. Option B: NowPane
suppressed when minutesUntil > 15.
Call: Option A. NowPane is the "right now" surface; suppressing it removes a useful signal.
UpNextRail offset and header relabel ("After that") is the minimal fix. Frontend's
render-deduplication (call selectUpNext once) applies regardless of option chosen.

### D-4: Instrumentation timing — Iter 21 only vs bundled with first visible change
Analytics §4: 14-day pre-change baseline preferred. Growth §6: C-AN-1 as prerequisite.
QA §1: CCC proxy tests are independent and can ship in any iteration.
Call: C-AN-1 instrumentation lands Iter 21 alone. V2-3 BucketStrip fix also ships Iter 21
(functional correctness fix, not a redesign, does not bias the comprehension baseline).
V2-1, V2-2, V2-5 (visible comprehension/edit changes) land Iter 22 after 14-day window.
This gives a clean pre/post baseline for the changes that most affect the latency metrics.

---

## 4. The Top 10 v2 Improvements (canonical, scored per §6.4 gate)

| ID | Title | Target | Lenses (n) | Est. save/session | Effort | §6.5? | Score gate |
|---|---|---|---|---|---|---|---|
| V2-1 | Auto-collapse RhythmExplainer (day 3+) | <10s | 5 (UX,PM,Growth,QA,Competitive) | 4–6s | S | No | ≥13 unlocked |
| V2-2 | Single Commit surface + keyboard shortcut | <60s | 5 (UX,PM,Frontend,QA,Competitive) | 8–13s | M | No | ≥13 unlocked |
| V2-3 | BucketStrip always visible in edit (C-UX-2) | <60s | 4 (UX,PM,Frontend,QA) | 10–20s | S | No | ≥13 unlocked |
| V2-4 | TodayPageViewed + EditDrawerOpened (C-AN-1) | Both | 4 (Analytics,QA,PM,Growth) | n/a — baseline | S | No | ≥13 unlocked |
| V2-5 | Focus-trap + auto-focus + E shortcut (C-UX-6) | <60s | 4 (Frontend,QA,Competitive,UX) | 15–30s keyboard | S | No | ≥13 unlocked |
| V2-6 | Pre-sorted execution order in CycleCard | <10s | 3 (Competitive,UX,PM) | 2–4s | S | No | 13 eligible |
| V2-7 | Visual feasibility color on MorningRecap | <10s | 3 (Competitive,UX,Analytics) | 1–2s | S | No | 13 eligible |
| V2-8 | AdherenceDial momentum mode pre-day-7 (C-UX-11) | <10s | 4 (Growth,UX,PM,Competitive) | 1–2s attention | S | No | ≥13 unlocked |
| V2-9 | NowPane/UpNextRail deduplication (C-UX-7) | <10s | 3 (UX,PM,Frontend) | 2–3s | S | No | 13 eligible |
| V2-10 | CCC + word-count comprehension proxy tests | Both | 3 (QA,Analytics,UX) | n/a — gate | S | No | 13 eligible |

V2-6, V2-7, V2-9, V2-10 require one additional lens evaluation to fully unlock the 13+
score gate. All ten items are pure renderer or app.js route-layer moves; none touch
js/composer/, js/engine/, or js/domain/types.js.

---

## 5. Smallest Coherent v2 Today (sequencing)

Per §6.1: single Define artifact, single integrity boundary, single coherence claim, ≤1.5×
normal effort.

**Iteration 21 — instrumentation + functional correctness (first ship)**
Items: V2-4 (C-AN-1) + V2-10 (CCC proxy tests) + V2-3 (C-UX-2 BucketStrip).
Coherence claim: "The page now captures a latency baseline and fixes the invariant feedback
blackout during edit."
Integrity boundary: app.js route handler (event emit) + app.css:1519 (selector scope) +
new test file. No composition state, no FSM, no schema touched.
Effort: 3× S = well within 1.5× normal loop budget.
Rationale: V2-3 is a functional correctness fix (OPEN since Iter 12), not a redesign. It
does not bias the comprehension baseline. V2-10 proxy tests run in the same pass as V2-4
at zero additional risk.

**Iteration 22 — comprehension + edit path (visible v2)**
Items: V2-1 + V2-2 + V2-5.
Coherence claim: "Returning users can comprehend the plan in <10s and update-and-start in
<60s, measurable against the Iter 21 baseline."
Integrity boundary: RhythmExplainer.js + Today.js (prop condition, triad suppression, focus
management) + keybinding handler in app.js. No drawer redesign.
Effort: S + M + S = largest single bundle; still within 1.5× normal loop if M item is
scoped tightly to label fixes + triad suppression (not drawer unification).

**Iteration 23 — signal quality**
Items: V2-8 + V2-9 + V2-6 + V2-7.
Coherence claim: "Header and CycleCard deliver actionable signals in a single glance."
All four are S-effort with non-overlapping file surfaces.

---

## 6. Pre-Redesign Baseline Requirement

Per Analytics §4, minimum 14 calendar days of baseline data before V2-1/V2-2/V2-5 ship.

Required events (Iter 21):

| Event | Payload | Currently capturable? |
|---|---|---|
| `TodayPageViewed` | userId, compositionState, isFirstRun, timestamp | NO — must add |
| `EditDrawerOpened` | compositionId, timestamp | NO — must add |
| `CycleAccepted` with `proposedAt` | add one field to existing event | PARTIAL |
| `ActivityStarted` (first of session) | already in §6.1 | YES |
| `CycleRejected` rate | already in §6.1 | YES |

Recommendation: ship C-AN-1 instrumentation in Iter 21 with V2-3 (BucketStrip fix) and
V2-10 (proxy tests). Hold V2-1, V2-2, V2-5 for Iter 22 after 14-day baseline closes.
Analytics §5 protocol: 3-day novelty-effect exclusion; 14-day comparison window; declare
improvement if comprehension p75 drops ≥10s or update-and-start p75 drops ≥15s without
guardrail regression (CycleRejected rate, ReflectionCaptured rate).

---

## 7. Anti-Themes

### AT-1: Silent full-auto reschedule (Motion pattern)
Do not adopt engine-driven automatic cascading on any edit action. BAM-X's deliberate-
ratification model requires the user to accept every composition change. Flagged: Competitive
§5 anti-pattern 1; Product §3 L4 (user cannot tell what changed after silent reflow).

### AT-2: Blocking onboarding modal at session open (Sunsama morning ritual)
Any blocking step before the plan is visible busts the <60s target. The RhythmExplainer
full card is already borderline at 57 words; a modal is categorically incompatible. Flagged:
Competitive §5 anti-pattern 2; Growth §4 (10–15s consumed by explainer alone on Day 0).

### AT-3: Gamified streak with visible reset penalty
A breakable streak counter creates shame-adjacent framing on missed days. Blueprint §4.3
excludes gamification. The momentum signal needed is a delta (days accepted this week), not a
breakable streak. Flagged: Growth §4 HR-4 (attrition risk in activation window).

### AT-4: Widget proliferation on Today surface
Weekly Deep-minutes totals, Kaizen status, and portfolio KPIs compete with NowPane and
CycleCard for the above-the-fold scan. Today's JTBD is execution only; cross-page signals
belong on /week and /insights. Flagged: PM §3 (latent jobs explicitly out of scope for P0);
Competitive §5 anti-pattern 5 (Notion dashboard failure mode).

### AT-5: Expanding WhyThisPlan above CycleCard on short viewports
Expanded WhyThisPlan `<dl>` pushes CycleCard below fold on ≤768px screens. The plan is
primary; rationale is secondary. Expansion must be constrained to a max-height scroll
container or repositioned below CycleCard. Flagged: UX §4 SK-8; UX §7 I-8.

### AT-6: Bundling >3 changes in one iteration
Analytics §5: "Do not bundle multiple v2 sub-changes into a single post-ship window — the
signal is unattributable." Maximum 3 changes per iteration if they touch non-overlapping
file surfaces. Flagged: Analytics §5; Frontend §9 R1 (cache-invalidation risks compound).

---

## 8. Open Questions for Phil

1. **RhythmExplainer threshold — day 2 or day 3?** UX says day 2; Growth says day 3.
   Default: day 3 (`daysSinceSignup >= 3`). Growth's behavioral rationale (user has
   completed at least one full acceptance cycle) is stronger than a date-count heuristic.

2. **Edit drawer unification — separate drawers with clearer labels, or one drawer with
   two tabs?** Determines whether V2-2 is an S-effort label fix or an M-effort redesign.
   Default: separate drawers with clearer labels only; full unification deferred.

3. **Instrumentation target (C-AN-1): accept-only <60s, or split accept vs edit?** Analytics
   §8 Q1: edit path realistically needs ≤90s. Keeping a single 60s target makes edit
   sessions always appear to fail even when improved. Default: split — accept-only <60s,
   edit-path <90s — and instrument separately via `EditDrawerOpened` presence.

4. **`TodayPageViewed` fire point: app.js route change or Today.js first-render?** Analytics
   §8 Q2. Route-change fires earlier but may precede data resolution. Default: app.js on
   route change; flag if timing offset vs data-ready exceeds 500ms.

5. **Pre-day-7 AdherenceDial accepted-days count — available in current props?** Design §8
   Q4. `acceptedDaysCount` may require a new computed field from app.js. Default: derive
   from existing `computePriorDayRecap` data; add `acceptedDaysCount` to AdherenceDial
   props; fall back to current em-dash display if prop is absent (no regression).

6. **E shortcut scope — first SCHEDULED block, or requires focused-block model?** Competitive
   §3; UX §8 Q3. If CycleCard has no current focus management for individual blocks, the E
   shortcut requires defining a focused-block state as a prerequisite. Default: E targets
   the first SCHEDULED block when no block is explicitly focused; full focused-block model
   is a follow-on.

---

## 9. Provenance Table

| Item | Primary lens | Cross-validating lenses | Lens count |
|---|---|---|---|
| V2-1 Auto-collapse RhythmExplainer | UX §4 SK-1 / §7 I-1 | PM §4, Growth §1 §3, QA §1 word-count, Competitive §5 | 5 |
| V2-2 Single Commit + keyboard shortcut | UX §4 SK-2 / §7 I-4 | PM §5, Frontend §7.7, QA §3 TOC, Competitive §3 §7 | 5 |
| V2-3 BucketStrip visible in edit | UX §4 SK-3 / §7 I-3 | PM §5, Frontend §5 CSS, QA §4 class stability | 4 |
| V2-4 Instrumentation C-AN-1 | Analytics §2 §4 | QA §1 CCC, PM §8 ACs, Growth §6 rank 5 | 4 |
| V2-5 Focus-trap + auto-focus + E | QA §3 TOC | Frontend §6 §7, Competitive §3 §7, UX §2 path(b) | 4 |
| V2-6 Pre-sorted CycleCard | Competitive §3 pattern 1 | UX §1 Zone E, PM §2 locate-to-swap | 3 |
| V2-7 Feasibility color on MorningRecap | Competitive §3 pattern 2 | UX §5 P2, Analytics §6 KPI | 3 |
| V2-8 AdherenceDial momentum C-UX-11 | Growth §3 §4 AR-2 | UX §4 SK-5, PM §4, Competitive §3 | 4 |
| V2-9 NowPane/UpNextRail dedup C-UX-7 | UX §4 SK-4 / §7 I-2 | PM §2 J5, Frontend §2 duplicate sort | 3 |
| V2-10 CCC + word-count proxy tests | QA §1 | Analytics §1 proxy metric, UX §1 visual-hierarchy | 3 |
