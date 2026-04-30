# Today Page v2 — Product/Job Lens (vs <10s + <60s targets)

## 1. The Two Jobs the Page Must Serve in 10s/60s

**Job A — Comprehend the day in under 10 seconds.** (Blueprint §6.1 JTBD 1; §4.1 item 2)
"When I open the system in the morning, I want tomorrow already composed as a 4-2-2 day
of catalog activities so I can start executing instead of planning from zero."
Read job. Four questions must be answerable without a tap: What happened yesterday?
What is composed today? Is it right? What starts now?

**Job B — Update one thing and start within 60 seconds.** (Blueprint §6.1 JTBD 2; UX_FLOWS §2.2)
"When a scheduled catalog activity ends, I want a 60-second reflection that writes
straight into the catalog entry's required output field so evidence is captured while fresh."
Write job. The page must let the user make one change to the proposed plan
(a swap, a skip, a time shift) and begin the first activity without navigating away.

Both targets are explicit commitments. Blueprint §7.4 launch metric requires ≥7 composed
days accepted + ≥1 reflection per day within 14 days. Neither happens if comprehension
takes >10s or the update-and-start path takes >60s.

---

## 2. Job-Coverage Audit Against Targets

| Job | Current click/scan path | Within budget? | Specific blocker |
|---|---|---|---|
| See proposed schedule | Header loads → MorningRecap → RhythmExplainer → NowPane → UpNextRail → CycleCard blocks | Marginal at 10s | RhythmExplainer interrupts scan between the recap and the schedule; it adds 2–4 seconds of reading that is not the schedule |
| Identify if it's right | Scan CycleCard blocks; tap WhyThisPlan chip to get rationale | Over budget | WhyThisPlan chip is a secondary action; non-tapping users have no rationale. Acceptance requires trusting the plan on faith |
| Make 1 swap and start | Tap Edit → EditDrawer opens → pick replacement → save → tap Start on first block | Over budget | EditDrawer entry is gated behind a FineTuneButton whose affordance is not "swap an activity." Discoverability costs 8–12s before the swap itself begins |
| Skip an activity with reason | Tap Skip link on block → SkipReasonModal → pick code → confirm | Within 60s | SkipReasonModal is present (Today.js:23-24). One concern: Skip link is visually subtle; discovery time is unmetered |
| Capture EOD reflection | EodClosureStrip CTA → ReflectionSheet for oldest pending | Within 60s | Shipped (C-UX-3, Iteration 15). Strip renders below CycleCard. Path is sound but only surfaces after all activities reach terminal state |
| Recover from infeasible | InfeasibleBanner → capacity instruction → AutoPlanButton | Over budget | RhythmExplainer renders above InfeasibleBanner in the infeasible branch (Today.js:182-194). Fix path is obscured by onboarding copy |

---

## 3. Latent Jobs Still Missing

These are jobs a returning user (day 7+) would expect that the page does not serve.

**L1 — See yesterday's incomplete carryover explicitly.**
Blueprint §3.3 variance signal: "skipped non-optionals get rescheduling preference tomorrow."
MorningRecap shows aggregate counts (N closed, M skipped) but does not name the skipped
activities or surface them as carryover in today's proposed schedule. The user cannot see
"Daily Standup was skipped yesterday — it is rescheduled as block 1 today" without reading
every block individually.

**L2 — One-action "push this block 30 minutes."**
UX_FLOWS §4.2 describes drag-to-reorder within EditDrawer only. There is no lightweight
nudge-later action outside full edit mode. A user whose 10:15 Deep block needs to start
at 10:45 must enter edit mode, drag the block, check the BucketStrip, and save —
a multi-step path for a single-minute adjustment.

**L3 — "Start in N minutes" ambient reminder.**
UX_FLOWS §4.7 defines a start-on-time prompt that fires 5 minutes past planned start.
This is a push nudge, not an ambient timer. A user who is in flow and wants to know
"how long until my next block" has no surface for it on Today without checking the block list.
The NowPane shows the current/upcoming block but no countdown.

**L4 — "What changed since I last opened Today" signal.**
Sprint 15 shipped Weekly reflow. If the composer reflowed the day between the user's
morning acceptance and an afternoon return, Today shows the new schedule with no diff
indicator. The user cannot tell whether the plan changed or whether they are remembering
wrong. (Flagged in prior review; still open.)

**L5 — Weekly context on Today.**
UX_FLOWS §6.4 rule 4: "Deep minutes this week: 720/1200 target" lives on /week only.
A user on Today who wants to know "am I on track for the week" must navigate away.
The launch metric (Blueprint §7.4) is 7-day behavior; Today has no weekly-shape signal.

---

## 4. Scope Discipline

Items currently on Today that do not serve the 10s/60s targets:

**RhythmExplainer — informational without action on returning users.**
RhythmExplainer (Today.js:160-162) renders on every state including infeasible and
active-composition. The 4-2-2 explainer is onboarding content. After day 2, a returning
user with an accepted plan has no action to take from the explainer. It is decorative
for the returning case and actively obstructive in the infeasible case.
Recommendation: suppress once `rhythmExplainerDismissed=true` AND `daysSinceSignup > 1`.
This aligns with the `dismissed` prop that already exists on RhythmExplainer — the parent
only needs to set the condition correctly.

**DayBadge — nice-to-know, not need-to-act.**
"Day 47" is a vanity metric for a user mid-execution. It consumes header space that
could reinforce the primary job (what starts now). The badge is worth showing on days
0–14 (activation window per Blueprint §7.3) and should recede after.

**AdherenceDial during execution — low-actionability in the moment.**
The three KPIs are correct as always-on signals per Blueprint §4.1 item 5. Mid-execution,
however, the numbers cannot be acted on without stopping work. Their position in the header
consumes scan time in the 10s window without informing the "start or continue" decision.

---

## 5. The 60-Second Click Budget

A user who opens Today with a PROPOSED composition and wants to make one swap and start
the first activity. Distributed across the interaction:

| Touchpoint | Estimated seconds | Budget concern |
|---|---|---|
| Page load scan — header, MorningRecap, RhythmExplainer, NowPane | 6–8s | RhythmExplainer alone accounts for 2–4s on a returning user who has already internalized 4-2-2 |
| Locate the activity to swap in CycleCard | 4–6s | Blocks are sequential; user must scan to find the one they want to change |
| Discover edit entry point (FineTuneButton vs Edit button on CycleCard) | 6–10s | Two separate edit paths (FineTuneDrawer for capacity; EditDrawer for swaps) are not visually differentiated at a glance |
| Open EditDrawer, locate replacement in catalog picker | 8–12s | Catalog picker groups by bucket; user must know which bucket the replacement lives in |
| Make the swap, check BucketStrip, save | 5–8s | BucketStrip is dimmed during edit mode (C-UX-2, OPEN) — invariant feedback hidden during the action that most requires it |
| Locate first block in updated plan, tap Start | 4–6s | NowPane should surface this; if nowIso is null (Today.js:251), NowPane is absent |
| **Total** | **33–50s** | Within the 60s budget only if no friction occurs; any discovery delay (edit entry, catalog structure) busts it |

Budget eaters ranked: (1) RhythmExplainer scan cost on returning users; (2) edit-entry
discoverability; (3) BucketStrip blackout during edit (C-UX-2).

---

## 6. Top 5 PM-Lens Improvements (ranked)

| Rank | Title | Job served | Latency saved | Effort | Evidence |
|---|---|---|---|---|---|
| 1 | Suppress RhythmExplainer for returning users with dismissed=true AND daysSinceSignup>1 | Job A (10s comprehension) | 2–4s scan cost eliminated on every return visit | S | Today.js:160-162; Blueprint §4.1 item 2; infeasible-path obscuring confirmed in prior review |
| 2 | Single edit entry point with clear scope label | Job B (60s update-and-start) | 6–10s discovery cost eliminated | M | EditDrawer vs FineTuneDrawer affordance split; UX_FLOWS §4.1; 60s budget analysis above |
| 3 | Named carryover visibility in MorningRecap | Job A (10s comprehension) | User identifies plan rationale in scan, not by tapping | S | Blueprint §3.3 variance-queue signal; L1 latent job; MorningRecap already ships aggregate counts |
| 4 | NowPane nowIso null-guard with fallback | Job A + Job B | J5 silently disappears when nowIso is absent; Start path breaks | S | Today.js:251 — NowPane and UpNextRail are conditional on nowIso; prior review §2 J5 gap |
| 5 | Day-band hint extended to active-composition state (days 3–14) | Job A (onboarding cohort) | Activation nudge fires during the window it is actionable | S | Today.js:166-168 suppresses hint when activeState exists; Blueprint §7.3–§7.4 activation funnel; C-UX-9 OPEN |

Items 1 and 4 are within §4.1 scope (composer/state-management unchanged). Item 2 requires
a UX definition of the unified edit entry point before implementation dispatches.

---

## 7. Cross-Page Implications

Patterns that should travel from Today to other pages for consistency:

**MorningRecap / EodClosureStrip bookend pattern.** Today now has an open-of-day recap
and a close-of-day strip. The Week page should adopt the same bookend at the week level:
a Monday morning "last week: N/M closed, top friction: MEETING_LOAD" strip and a Friday
"week complete" strip. Blueprint §3.2 Weekly cycle explicitly requires a "close-of-week"
guided reflection. The surface pattern is established on Today; it should be referenced
by the Week page spec.

**WhyThisPlan rationale chip.** Today surfaces the composer rationale on PROPOSED/ACCEPTED/
EDITED compositions. The Week page's weekly composer (UX_FLOWS §2.1 step 2b) produces
the same composer input snapshot. The rationale chip should appear on the Weekly CycleCard
using the same WhyThisPlan component and the same expanded/collapsed interaction.

**DayBadge lifecycle suppression rule.** Whatever rule is adopted to suppress the DayBadge
after day 14 on Today should be the same rule applied to onboarding hints across Week,
Catalog, and InsightsPortfolio (C-UX-4 OPEN — empty-state warmth ladder). One lifecycle
model, five pages.

**Edit entry discoverability contract.** If item 2 above defines a single labeled edit
entry point for Today, that same label/affordance must appear on Week's daily columns.
UX_FLOWS §1.1 lists /week/day/:isoDate/compose as the daily edit route from the Week page;
it should use the same visual contract as Today's edit entry.

---

## 8. Acceptance Criteria for "v2 hits the latency targets"

Given a returning user (daysSinceSignup > 1) with an ACCEPTED composition, when Today
loads, then RhythmExplainer does not render and the CycleCard is the topmost content
below MorningRecap, within the first content paint.

Given a PROPOSED composition with composer rationale available, when the user scans Today
without tapping, then each activity block's bucket and planned time are readable and the
WhyThisPlan chip is visible without scrolling for the first three blocks, within 10
seconds of page load.

Given Today in any non-editing state, when the user wants to make one activity swap, then
a single clearly labeled edit action is visible on the CycleCard (not requiring navigation
to a drawer or separate route to discover), within 5 seconds of deciding to swap.

Given an activity swap initiated in edit mode, when the user is choosing a replacement,
then the BucketStrip is fully visible and updates live (not dimmed), so invariant
feedback is available during the swap decision.

Given nowIso is null or not provided by the caller, when Today loads with an accepted
composition, then a fallback "what's next" surface is visible rather than a silent blank
where NowPane would be, so Job A (comprehend the day) is not silently broken.

Given a user on days 3–6 with an accepted composition, when Today loads, then an in-context
progress nudge is visible ("You're on day N — aim for 5 accepted days this week") even
though activeState is not null, within the first content scan.

Given Today in the infeasible branch, when the page loads, then InfeasibleBanner and the
capacity-adjustment instruction appear above any onboarding or explainer content, so the
fix path is the first readable element below the header.

Given a user whose swap and save takes under 30 seconds (items 3–4 above hold), when they
tap Start on the first block, then the activity runner is reachable within 5 additional
seconds, putting the full update-and-start path at ≤ 60 seconds end-to-end.

---

## 9. Open Questions for Phil

1. **Edit entry unification.** Today has two edit paths: FineTuneDrawer (capacity and Kaizen
   selection) and EditDrawer (activity swaps). Should these be one drawer with two tabs, or
   remain separate with clearer labels? The answer determines whether item 2 in §6 is a
   label fix (S effort) or a drawer redesign (M effort).

2. **RhythmExplainer suppression trigger.** The component accepts a `dismissed` prop but
   Today.js does not set it based on daysSinceSignup. Is the parent (app.js) currently
   persisting the dismissed flag per-user, or does it reset on each session? The persistence
   model changes whether suppression is a prop-threading fix or a storage decision.

3. **nowIso null case in production.** Today.js:251 — NowPane and both UpNextRail variants
   are conditional on `nowIso !== null`. Is app.js currently passing a live clock value on
   every render, or does nowIso arrive null during initial load or offline states? A null
   silently removes Job A's "what starts now" surface with no user-visible fallback.

4. **Named carryover scope.** Blueprint §3.3 says skipped non-optionals get rescheduling
   preference. Should MorningRecap name the rescheduled activity explicitly ("Standup
   moved from yesterday — block 1 today"), or is the aggregate count sufficient for MVP?
   Naming requires the recap prop to carry activity titles, not just counts.

5. **Weekly-shape signal on Today.** L5 (§3) asks whether a weekly Deep-minutes summary
   belongs on Today or only on /week. Blueprint §7.4 launch metric is measured over 14 days,
   which means the user's weekly progress is directly relevant to their Today decision.
   Should Today surface one weekly-shape number (e.g., "Deep this week: 480/1200 min"),
   or is navigation to /week the intended path for that signal?
