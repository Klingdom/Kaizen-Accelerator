# BAM-X Kaizen OS — Design Themes (synthesis of 7-lens Today review)

Status: v0.1 — Define-phase synthesis. Not implemented. Awaiting Phil approval before any candidates land in IMPROVEMENT_BACKLOG.md.

---

## 1. Executive Summary

Today is the most complete page in the product. Seven distinct regions render correctly across empty, infeasible, proposed, accepted, and edit states. The core execution loop — Auto-Plan → Accept → Start → Close with artifact → Skip with reason — is mechanically present and structurally sound. The NowPane and UpNextRail shipped in Sprint 15 add real-time orientation that comparators such as Motion have and users expect. The page is functional.

The single biggest weakness, agreed across every lens, is the absence of both a morning continuity signal and an end-of-day closure ritual. Today opens cold: no yesterday recap, no momentum signal, no summary of what fed into the proposed plan. Today closes cold: no EOD prompt, no "day complete" confirmation, no pull-back-to-tomorrow hook. The habit loop has two open ends. Every other weakness — duplicate copy, punitive empty AdherenceDial, ambiguous NowPane text, invisible focus traps — is subordinate to this structural gap in the daily ritual (Growth §3, PM §3 C-PM-4, Competitive §3 pattern 4).

The strategic principle for cross-page work is: every page must answer one of three questions — What am I doing right now? How is my system performing? What should I change? Today owns the first. Week and InsightsPortfolio own the second. Kaizen owns the third. Catalog supports all three. Design themes must serve these page-level jobs without leaking concerns across routes.

---

## 2. Convergent Findings (4+ lenses agreed)

### 2.1 EOD Closure Ritual Missing
Lenses: PM (§3, C-PM-4 OPEN score 12), Growth (§3 HR-3, §7 rank 2), Competitive (§3 pattern 4, §6 rank 4), Analytics (§3 step 9 gap).
PM — no time-triggered nudge; E6-T7 PendingReflectionBanner not imported. Growth — loop has start-of-day hook but no close-of-day hook; users have no reason to return at day end. Competitive — Sunsama and Akiflow both run a shutdown ritual; BAM-X has nothing equivalent. Analytics — no EOD event fires; daily reflection rate can only be derived, not observed.
Synthesis call: Highest-priority UX gap on Today. The design pattern is a non-blocking nudge strip after the last activity is closed, not a blocking modal.

### 2.2 Morning Recap / Yesterday Bridge Missing
Lenses: Growth (§3 HR-1, §7 rank 1), Competitive (§3 pattern 1, §6 rank 1), PM (§3 latent jobs), Design (§5 Flow 1 missing).
Growth — every day opens cold; product feels stateless between sessions. Competitive — 5 of 8 comparators have a yesterday recap step. PM — "What changed since I last looked" is a latent job not served. Design — first-run flow rated 3/5 partly because above-the-fold is meta-content with no continuity signal.
Synthesis call: A one-line morning recap strip is the minimum viable version. Requires one data read (yesterday closed/skipped counts) and zero new infrastructure.

### 2.3 Bucket-Tone Token Drift
Lenses: Design (§4, §7 improvement 4), Frontend (§5, §6 pattern 1, §8 risks 1 and 3), QA (§8 pattern 7).
Design — Sprint 13 introduced `--color-primary: #2563eb` in chip rules that conflicts with `:root` `--primary: #0f172a`. Frontend — three independent bucket→class maps in ScheduledActivityBlock, UpNextRail, and EditDrawer will silently diverge under theme pressure. QA — no `@media (forced-colors: active)` block; bucket color coding disappears in high-contrast mode.
Synthesis call: Prerequisite for any cross-page visual pass. Fix tokens before touching visual hierarchy.

### 2.4 Action Buttons Missing Activity Name in aria-label
Lenses: Design (§5, §7 improvement 7), QA (§1 FAIL: Start, Close, Skip; §7 rank 2), Frontend (§6 component boundary note).
QA — screen reader announces "Start button" with no activity name; WCAG 2.1 contextual label failure. Design — Skip and Start render at equal visual weight. Frontend — label fix requires no structural change to ScheduledActivityBlock.
Synthesis call: S effort, directly testable. Must ship before any other a11y work on the page.

### 2.5 Duplicate "Up Next" Signal
Lenses: Design (§4, §7 improvement 1), PM (§2 J5 note), Frontend (§4 — selectUpNext called twice per render).
Design — NowPane UPCOMING and UpNextRail row 1 show the same activity simultaneously; on mobile a third surface appears. Frontend — selectUpNext computed twice with identical output. PM — J5 silently disappears when nowIso is null.
Synthesis call: NowPane UPCOMING is the canonical "coming up" surface. UpNextRail starts from the first activity after the upcoming one, or relabels itself "After that."

### 2.6 Funnel Events Missing (Top of Funnel Invisible)
Lenses: Analytics (§2, §3, §5 gaps 1–2), Growth (§4 AR-3 — INFEASIBLE frequency unknown).
Analytics — no `TodayPageViewed`; no `AutoPlanButtonClicked`; funnel broken at steps 1 and 2. Growth — cannot prioritize INFEASIBLE recovery without knowing how often it fires.
Synthesis call: Not a UX design theme. Deferred to analytics agent per constraints. Cited here because sequencing depends on it.

### 2.7 AdherenceDial Punitive When Null
Lenses: Growth (§1, §4 AR-2, §6 copy rated cold, §7 rank 3), Design (§5 Flow 1 friction), Competitive (§3 — consistency visualization in 4 comparators).
Growth — "Numbers populate after day 7" feels like a locked door; no incremental progress signal for users who have accepted 3 days. Design — above-the-fold on day 0 is nearly all meta-content. Competitive — 4 comparators show streak or consistency signals.
Synthesis call: Dial should communicate momentum (days accepted pip row or text counter) before the 14-day window produces percentages. Display-state change only; no metric logic change.

---

## 3. Divergent Findings

### 3.1 RhythmExplainer: Always-On vs Gated
Design: collapse to a persistent chip after first dismiss — one-time moment with compact reference.
Growth: pure friction by day 3 regardless; fires on every state including active composition and infeasible.
PM: unconditional render on infeasible is a sequencing problem — user's job is to fix capacity, not learn the rhythm.
Frontend: promoting to a toast requires state-machine changes.
Call: Design's position wins. One-time onboarding moment. After first dismiss, collapses to a single-line chip. Must NOT render on the infeasible branch — PM's sequencing concern adopted.

### 3.2 Catalog as Settings vs First-Class Workflow
PM: toggle-only dominant interaction is maintenance, not execution — no verb-forward CTA.
Growth: no personalization signal; day-30 user sees same page as day-1 user.
Competitive: Akiflow universal inbox is a borrowable pattern.
Call: Catalog is a configuration surface for this product cycle. Adding a verb-forward CTA is not raised as a Today-level design decision. Deferred to a Catalog-specific pass.

### 3.3 Edit-Mode Commit Surface — CycleCard Triad vs EditDrawer Footer
Design: EditDrawer footer should be canonical; CycleCard triad hidden when drawer is open.
Frontend: both independently defined and will drift; extract shared helper first.
QA: EDIT_COMMIT test assertions would break on state-machine rename.
Call: EditDrawer footer is the single canonical commit surface when the drawer is open. CycleCard triad is not rendered during an open drawer session. CycleCard triad remains the commit surface for in-line edits (duration chip, start-time) that do not open the drawer.

---

## 4. The 10 Design Themes (canonical list)

### T1 — Bucket-Tone Token Consistency
Definition: All bucket-keyed color expressions reference a single `:root` token set, never raw hex or a parallel namespace.
User-facing principle: The product speaks one visual language for PROJECT / COMMUNICATION / CI on every page.
Evidence: Design §3, §4; Frontend §5 token split, §6 pattern 1; QA §8 pattern 7.
Lives on Today: `.chip-project/communication/ci`, `.up-next-dot-*`, `app.css:399–410`.
Should propagate to: Week (`.wk-chip` defined locally in Week.js:83–88), Portfolio (KaizenCard bucket tags), Catalog (CatalogBucketView headers), Kaizen (phase tags), InsightsPortfolio (variance rows).
Effort: M (prerequisite before any visual pass).

### T2 — Stateful Card Mode / Single-Focus Chrome
Definition: When a card enters edit state, a 2px blue ring marks the active edit boundary; non-editable content dims but does not vanish; only one card is in edit state at a time.
User-facing principle: The user knows what they are editing and can still see context while editing.
Evidence: Design §3, §4 (BucketStrip blackout), §8 theme 1; Frontend §6 pattern 4; QA §2.
Lives on Today: `app.css:1519–1527` — `.today-editing .cycle-card:not(.cycle-editing)` opacity 0.4 (over-applied).
Should propagate to: Week (day-column edit mode), Catalog (single active row during enable/disable), Kaizen (baseline lock step).
Effort: S.

### T3 — Closure Ritual
Definition: At or after the last scheduled activity, a non-blocking strip confirms the day is done, surfaces pending reflections, and points to tomorrow.
User-facing principle: The day has a defined end. Closing is deliberate, not a fade-out.
Evidence: Growth §3 HR-3, §7 rank 2; PM §3 C-PM-4; Competitive §3 pattern 4; Analytics §3 step 9.
Lives on Today: Not present. Target: a non-blocking strip rendered when all activities are CLOSED or SKIPPED.
Should propagate to: Week (week-close confirmation on Friday), InsightsPortfolio (next-step CTA after viewing closed Kaizen per Growth §8).
Effort: M.

### T4 — Morning Bridge / Yesterday Recap
Definition: On first load of a new day with a prior day record, a single-line strip surfaces the prior day closed/skipped count and any queued friction signals.
User-facing principle: The system works between sessions. Today's plan is connected to yesterday's execution.
Evidence: Growth §3 HR-1, §7 rank 1; Competitive §3 pattern 1 (5 of 8 comparators); PM §3; Design §5 Flow 1.
Lives on Today: Not present. Target: a dismissible strip between the header and NowPane, rendered only when prior-day data exists.
Should propagate to: Week (prior-week delta on week header per Growth §8).
Effort: S.

### T5 — Empty-State Warmth Ladder
Definition: Empty states are sequenced by context: first-run (warm, directive), returning-user-no-plan (factual, two paths), infeasible (recovery-first, scaffolded), all-closed (closure-positive). Each has distinct copy and a named next step.
User-facing principle: The product never leaves the user in a dead end.
Evidence: Growth §4 AR-1 and AR-3, §6 microcopy heat map; Design §6; PM §5; QA §3.
Lives on Today: `TODAY_COPY` enum (Today.js:45–51), `daysSinceSignupHint` (Today.js:67–76).
Should propagate to: Week (WEEK_COPY.EMPTY bare, no recovery path), Portfolio (PORTFOLIO_COPY empty strings have no embedded CTAs), Catalog (CATALOG_COPY.EMPTY has no CTA), Kaizen (empty body good, could be warmer day 0–6), InsightsPortfolio (two-level empty: filter-match vs no-universe — neither has a next step).
Effort: S per page.

### T6 — Anchor + Secondary Affordance Hierarchy
Definition: Within any action cluster, one action is visually primary (filled), one is secondary (ghost/outlined), and destructive actions (Skip, Remove) are text-only at reduced size. No two buttons share equal visual weight.
User-facing principle: The right action is obvious. The wrong action is possible but not accidental.
Evidence: Design §5 Flow 2 (Start/Skip parity), §7 improvement 7; QA §1; Competitive §3 pattern 3.
Lives on Today: `.sa-actions` in ScheduledActivityBlock.js:98–100; EditDrawer footer (four buttons equal weight — Design §2).
Should propagate to: Week (per-day Accept and inline actions), Portfolio (New Opportunity vs filter controls), Kaizen (state-driven CTAs — Lock / Capture / Close).
Effort: S per surface.

### T7 — Page Header Trio
Definition: Every routed page has a persistent `<h1>` (page title), a primary status indicator, and one primary action button, in that reading order.
User-facing principle: Any page load answers in two seconds: where am I, what is the state, what should I do.
Evidence: Design §7 improvement 6; QA §3 (no h1 in Today empty state), §8 pattern 1; Frontend §6 pattern 6; PM §7.
Lives on Today: Today.js:140–144 — day-badge + AdherenceDial + FineTuneButton; no reading order enforced; empty state has no h1.
Should propagate to: Week (has h1 + propose button, no status signal — Week.js:203), Portfolio (has h1 + New Opportunity, no status — Portfolio.js:162), Catalog (has h1 + view-toggle, no status — Catalog.js:47), Kaizen (has h1 only — Kaizen.js:76), InsightsPortfolio (title + filter controls, no status).
Effort: S per page (structural); L if shared PageHeader component extracted.

### T8 — Drawer Pattern
Definition: All side panels share a structural shell: `<aside role="dialog" aria-modal="true" aria-labelledby>`, header + dismiss ×, scrollable body, sticky footer with one canonical primary action. Focus is trapped within the drawer when open.
User-facing principle: Opening a side panel is a focused context; everything outside is secondary.
Evidence: Frontend §6 pattern 3 (DrawerShell); QA §1 (FineTuneDrawer no aria-modal; EditDrawer no focus trap), §2, §7 rank 1; Design §7 improvement 3.
Lives on Today: EditDrawer.js, FineTuneDrawer.js — identical shells, independently defined.
Should propagate to: InsightsPortfolio (filter panel if added), Portfolio (intake form modal), Week (future edit surface).
Effort: M (extract DrawerShell, add focus trap at app.js handler layer).

### T9 — Day-Band Onboarding Cadence
Definition: Time-sensitive copy tracks the user's signup-day through named milestones (day 0, 1, 3, 7, 14, 21, 30, 60, 90), fires on active-composition state (not only empty), and expires gracefully at each band boundary.
User-facing principle: The product knows where I am in my journey and speaks to that moment.
Evidence: Growth §2 (band gaps: day 8–13 missing; day 14/21/30/60/90 missing), §9 (full lifecycle copy table); PM §5, §6 rank 4; Frontend §7 (S effort — pure function change).
Lives on Today: `daysSinceSignupHint` (Today.js:67–76) — empty state only; bands stop at day 7+.
Should propagate to: Week and Kaizen empty states could surface day-band context.
Effort: S.

### T10 — Append-Only Variance Visual Pattern
Definition: Skipped or closed activities remain visible in their original timeline position with muted or struck treatment; never hidden or removed.
User-facing principle: The record is always visible. Skipping is logged, not erased.
Evidence: Design §8 theme 6 (`app.css:451–455`); PM §3 (no inline coaching after skip — UX_FLOWS §5.3).
Lives on Today: `.sa-block.sa-state-closed` (opacity 0.55), `.sa-block.sa-state-skipped` (red border + `#fef2f2`).
Should propagate to: Week (past days' activities in the grid), InsightsPortfolio (variance log rows), Kaizen (completed step markers).
Effort: S (pattern exists on Today; propagation is CSS + structural audit).

---

## 5. The 5 Themes That Travel First

1. **T1 — Bucket-Tone Token Consistency.** Prerequisite for any visual pass. The Sprint 13 token split will silently break any cross-page theme work that assumes `:root` is the single source of truth. Fix first.

2. **T5 — Empty-State Warmth Ladder.** Empty states exist on all five secondary pages and require no structural changes — only copy and minor additions. Fastest way to raise quality across all pages simultaneously.

3. **T7 — Page Header Trio.** Applying h1 + status + one primary action in reading order is structurally auditable by QA. It also resolves the most severe a11y gap (missing h1 on Today empty state) and creates a consistent landing experience across the product.

4. **T6 — Anchor + Secondary Affordance Hierarchy.** Button hierarchy is broken on Today (Start/Skip parity) and unenforced elsewhere. S effort per surface, independently testable. Direct impact on accidental destructive actions.

5. **T4 — Morning Bridge / Yesterday Recap.** Highest-leverage S-effort behavioral improvement on Today with no equivalent anywhere in the product. Ships the pattern for cross-session continuity; Week adopts the week-level equivalent afterward.

---

## 6. Anti-Themes

### A1 — Infinite-Scroll Task Backlog on Today
Surfacing all unscheduled or backlog items below the day's activities undermines WIP discipline and contradicts the 4-2-2 constraint model. Competitive §5 pattern 1.

### A2 — Gamified Streak Penalties
A streak counter that resets on missed days creates shame-adjacent framing. Blueprint §4.3 explicitly excludes gamification. The momentum signal the product needs is a delta or sparkline, not a breakable streak. Growth §3 HR-4; Competitive §5 pattern 2.

### A3 — AI Auto-Reschedule Without User Ratification
Automatically shifting remaining activities when a block runs long removes the deliberate planning moment that is BAM-X's core value proposition. Competitive §5 pattern 3.

### A4 — Drag-and-Drop as Primary Scheduling Interaction
Drag silently violates bucket invariant and leaves no audit trail. The commit-gated edit flow is necessary for invariant enforcement. Competitive §5 pattern 4.

### A5 — Dashboard Widget Proliferation on Today
Adding week summary, Kaizen status, or Insights KPIs as widgets on the Today route competes with NowPane and current-activity focus. Today's job is execution. Competitive §7 anti-pattern 5.

### A6 — Social/Public Sharing Defaults
A "publish to Slack" step in the morning or closure ritual is wrong for individual operator MVP. Retention benefit of social accountability is unproven in this context and adds integration complexity with no Blueprint requirement. Competitive §5 pattern 5.

---

## 7. Open Questions for Phil

1. **EOD closure timing signal.** Does a computed `lastActivityEndsAt` exist on the composition row, or does C-PM-4 require new infrastructure? Default: compute from `max(plannedStartAt + plannedDurationMinutes)` across activities; fire nudge after that time if 1+ activities are CLOSED.

2. **Morning recap data availability.** Is yesterday's composition accessible synchronously in `renderApp` (e.g., via `composerService.getCompositionByDate(yesterday)`), or does it require a new service call adding render latency? Default: add the call; treat null return as "no prior day, do not render the strip."

3. **RhythmExplainer flag persistence.** Is `rhythmExplainerDismissed` stored server-side or in localStorage? If localStorage, power users who clear storage re-see the explainer. Default: localStorage is acceptable for MVP; flag risk for GA.

4. **Day-band copy ownership.** Should the Growth §9 lifecycle copy table live as an extension of `daysSinceSignupHint` in Today.js, or in a shared `lifecycleCopy.js` module? Default: extend `daysSinceSignupHint` for Today-specific copy; defer shared module until a second page requires the same data.

5. **AdherenceDial progress mode (days 0–6).** Should the pre-baseline dial show (a) a pip row of accepted days, (b) a text counter "3 of 7 days accepted," or (c) both? Default: text counter only; pip row adds visual weight without additional information.

6. **CycleCard triad scope.** Confirmed that EditDrawer footer is canonical during swap sessions. Confirm: CycleCard triad remains the commit surface for in-line edits (duration chip, start-time) that do not open the drawer. If yes, both triad instances must use the same `EditActionTriad` helper (Frontend §9 step 2) to prevent divergence.

---

## 8. Provenance

| Theme | Primary lens | Cross-validating lens(es) |
|---|---|---|
| T1 Bucket-Tone Token Consistency | Frontend §5, §6 | Design §3, §4; QA §8 |
| T2 Stateful Card Mode | Design §3, §8 | Frontend §6 pattern 4; QA §2 |
| T3 Closure Ritual | Growth §3, §7 | PM §3 C-PM-4; Competitive §3 pattern 4; Analytics §3 |
| T4 Morning Bridge | Growth §3, §7 | Competitive §3 pattern 1; PM §3; Design §5 |
| T5 Empty-State Warmth Ladder | Growth §4, §6 | Design §6; PM §5; QA §3 |
| T6 Anchor + Secondary Affordance | Design §5, §7 | QA §1; Competitive §3 pattern 3 |
| T7 Page Header Trio | QA §8 pattern 1 | Design §7; Frontend §6 pattern 6; PM §7 |
| T8 Drawer Pattern | Frontend §6 pattern 3 | QA §1, §2, §7; Design §7 improvement 3 |
| T9 Day-Band Onboarding Cadence | Growth §2, §9 | PM §5, §6; Frontend §7 |
| T10 Append-Only Variance Visual | Design §8 theme 6 | PM §3; Analytics §3 |
