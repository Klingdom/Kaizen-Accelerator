# Today Page v2 — Growth Lens (vs <10s + <60s targets)

## 1. The Latency-vs-Onboarding Tension

The 10-second comprehension target and the 60-second activation target are fundamentally
in tension with Day 0 onboarding requirements. A first-run user needs context to act;
a returning user needs zero friction to start. Serving both from the same render path
with the same component tree means one group always pays a tax meant for the other.

The current render path resolves this badly: Day 0 users see three stacked cold
surfaces (header with dashes, RhythmExplainer wall, repeated welcome copy) before
the primary CTA becomes the visual focus. Returning users on Day 5+ see the
RhythmExplainer they already dismissed — or forgot to dismiss — every morning.

Proposed resolution: treat the experience as two distinct modes keyed on
`daysSinceSignup`. The crossover point should be Day 3, not Day 7. By Day 3 a
user has accepted at least one plan and executed at least one activity block. The
RhythmExplainer and extended welcome copy are irrelevant from that point. The 10-second
comprehension target should be fully achievable for returning users by Day 3; Day 0
users get a guided ramp that deliberately trades latency for context.

Thresholds: Day 0 = onboarding mode (full explainer). Day 1-2 = transition (reduced explainer,
pip row). Day 3+ = returning mode (RhythmExplainer suppressed, NowPane leads, <10s in effect).


## 2. First-Run Comprehension Path (Day 0)

Paint order as coded in Today.js, empty-state branch:

1. Header renders: Day 1 badge, AdherenceDial (shows dashes), FineTuneButton
2. Hint strip fires: "Welcome to CadencePlan. Tap Auto-Plan to compose your first balanced day."
3. MorningRecap: suppressed (daysSinceSignup === 0 guard fires)
4. RhythmExplainer (not dismissed): renders the 4-2-2 explainer block — multi-line,
   teaches bucket structure, has a "Got it" dismiss button
5. Empty state copy (isFirstRun = true): "Welcome to CadencePlan. Tap Auto-Plan to
   compose your first balanced day — you can always adjust before you accept."
6. AutoPlanButton: primary CTA

The welcome message appears twice in items 2 and 5 with near-identical language. The
user reads the same sentence twice before seeing the CTA. Time cost: the RhythmExplainer
alone requires 5-8 seconds of reading to fully comprehend. The dial shows only dashes.
There is no preview of what accepting a plan produces. The 10-second comprehension
target is structurally impossible on Day 0 as currently rendered.

Second bottleneck: after the user taps Auto-Plan and the composer returns a PROPOSED
composition, the CycleCard renders with a "Why this plan?" chip but no headline that
says "Accept this to start your first day." The accept-vs-edit decision is presented
without framing of what each option means.


## 3. Returning-User Comprehension Path (Day 5+)

Assuming the user has an accepted composition (active-state branch):

1. Header: Day 6 badge, AdherenceDial (still dashes — day 7 gate not yet passed)
2. MorningRecap: renders if priorDayRecap is passed — "Yesterday: 5/6 closed"
3. RhythmExplainer: renders unless dismissed — same content as Day 0
4. NowPane: renders if nowIso wired — current/next activity visible
5. UpNextRail (mobile): renders next 5 activities
6. CycleCard: full day view with all activity blocks

Time savings vs Day 0: MorningRecap adds continuity, NowPane puts the current moment
front-and-center. If these two surfaces render above the fold, comprehension is fast.

Where returning users are slowed:
- RhythmExplainer. If not dismissed (one deliberate tap to close), it sits between
  MorningRecap and NowPane and takes 100-200px of vertical space. On mobile it pushes
  NowPane below the fold. A Day 5 user gains nothing from re-reading 4-2-2 explainer copy.
- AdherenceDial dashes. The dial is in the header on every load. For five straight days
  it communicates nothing about performance. It is occupying prime real estate with a
  null signal. Users learn to ignore it, which means they also ignore it after Day 7
  when it becomes meaningful.
- No activity-start CTA above the fold on mobile. NowPane shows what is active, but the
  tap target to mark it started may require scrolling past UpNextRail rows.


## 4. The 60-Second Activation Moment

For a brand-new user, first paint to first activity-start:

Step 1: Land on Today, read welcome (10-15s if they read RhythmExplainer)
Step 2: Tap Auto-Plan (1 tap) → composer runs → PROPOSED CycleCard renders (0-3s)
Step 3: User reads the proposed plan — 8-12 activities, times, bucket fills (10-20s)
Step 4: User taps Accept (1 tap) → ACCEPTED state
Step 5: User finds first activity in NowPane or CycleCard (3-5s scan)
Step 6: User taps Start (1 tap)

Optimistic total: ~30 seconds (3 taps, minimal reading).
Realistic total: 60-90 seconds (reading RhythmExplainer + proposed plan).

The 60-second target is achievable if and only if the RhythmExplainer is collapsed by
default on Day 0 or replaced with a single-line inline hint. The current design lets
the explainer consume 10-15 seconds of the activation window.

Bottleneck: The RhythmExplainer is the single biggest blocker to sub-60s activation.
Second bottleneck: No preview of what the proposed day will look like before Auto-Plan
is tapped, which creates uncertainty that slows the accept decision.


## 5. Habit-Loop Ergonomics

Morning bookend (MorningRecap, Iteration 14): SHIPPED. Renders above RhythmExplainer
when daysSinceSignup > 0 and priorDayRecap is available. This is the strongest
open-of-day hook present. It creates the "system remembered yesterday" continuity
signal that makes return visits feel rewarding.

Against latency targets: MorningRecap is a single render line, no async cost, renders
at top of the active-state tree. No latency impact.

EOD bookend (EodClosureStrip, Iteration 15): SHIPPED. Renders below CycleCard when
day-done condition holds. Creates the close-of-day ritual anchor. The "Capture
reflection" CTA drives the reflection rate that Blueprint §7.3 targets.

Against latency targets: EodClosureStrip is suppressed until the day-done condition is
met, so it does not add load-time cost. Renders only when actionable.

What is missing in the middle:

- No midday re-engagement signal. A user who has completed 3 of 8 activities and pauses
  for lunch returns to Today and sees the same NowPane they left. There is no "halfway
  through — 3 done, 5 to go" progress indicator. The midday moment has no hook.

- No friction-capture nudge. Blueprint §7.3 requires 3 friction signals in week 1. There
  is no in-session prompt to log a friction signal after completing an activity. The
  EodClosureStrip surfaces pending reflections at end of day, but the friction-signal
  habit requires in-moment capture, not deferred capture.

- No "tomorrow is ready" signal. After accepting the EOD strip and completing reflections,
  there is no copy that tells the user the next cycle is already composed and waiting.
  The return visit tomorrow starts cold with no pull-forward hook from today's close.


## 6. Top 5 Growth-Lens Improvements (ranked)

| Title | Activation/habit hypothesis | Latency impact | Effort | Risk |
|---|---|---|---|---|
| 1. Collapse RhythmExplainer by default from Day 3 | Removing the explainer from the returning-user path cuts 10-15s from the activation window and puts NowPane above the fold on mobile; activation rate should improve by reducing friction on the most common daily path | Reduces perceived load for 80%+ of sessions; no render-cost change | S | Low — conditional suppress keyed on daysSinceSignup >= 3 |
| 2. C-UX-11: AdherenceDial pip row (Days 0-6) | Users who see 3 filled pips after 3 accepted days have a visible progress signal during the highest-churn window; expected to reduce Day 3-6 attrition by converting a null instrument into a momentum display | No latency change; display-only branch in AdherenceDial | S | Low — display-only |
| 3. C-UX-9: Day-band copy through Day 90 | Blueprint §7.4 launch metric requires behavior through Day 14; current copy abandons the user at Day 7; lifecycle-aware copy at Days 14/21/30 is the only mechanism to pull users toward the §7.5 durability target without a push notification channel | Hint strip renders on empty-state only — no latency impact on active-state path | S | Low — copy only |
| 4. Midday progress signal on NowPane | A "N done, M to go" inline count on NowPane or CycleCard header creates a midday re-engagement hook and closes the gap between morning and EOD bookends; directly supports the reflection rate target (§7.3 ≥75%) by making completion visible in real time | No latency change; computed from existing activitiesForRender | S | Low — read from existing data |
| 5. C-AN-1: Instrument Auto-Plan click and Today page view | Without a funnel denominator, no copy change, CTA move, or layout decision on Today can be validated; this is a prerequisite for measuring improvements 1-4 | No user-facing latency change | S | Low — analytics event emit |


## 7. Day-Band Copy vs Latency

Progressive onboarding copy reduces cognitive load for returning users. The principle:
every day-band beyond Day 0 should say less than the day before, not more.

Recommended bands and copy posture:

Day 0: Full context. Welcome copy explains what Auto-Plan produces and what accepting
means. RhythmExplainer shown. Copy: "Your first day, composed in seconds from the
Standard Work catalog. Accept to commit; adjust anything first."

Day 1: Transition. RhythmExplainer collapsed by default (one tap to expand). Hint strip
shifts from "what to do" to "what to track." Copy: "Yesterday accepted. Each reflection
you capture today feeds your first Weekly Reflection. Aim for 3 friction signals this week."

Day 3: Returning mode. RhythmExplainer suppressed. Hint strip shows milestone progress.
Copy: "3 days in. Your first-week goal: 5 accepted days. On track: [N]/5."

Day 7: Metric reveal. AdherenceDial unlocks. Hint strip frames the unlock as a goal,
not just a number. Copy: "Your 7-day baseline is live. Target: 70% adherence over
the next 14 days. You are at [N]%."

Day 14: Launch-metric close. Copy: "Week 2 done. Your baseline is set — [N]% adherence,
[N]% acceptance. Friday's reflection is the engine for Kaizen promotion; don't skip it."

Day 21: Kaizen activation. Copy: "3 weeks in. If a Kaizen is not yet active, this week's
reflection is the right moment to promote one from your friction queue."

Day 30+: Durability mode. Hint strip retires. Onboarding copy fully suppressed. User
operates in the metric and ritual rhythm without copy scaffolding.

The latency benefit of progressive suppression: by Day 3, the empty-state and
active-state render paths are both shorter. By Day 7, the hint strip serves only the
metric-reveal moment. By Day 30, hint strip emits nothing. This is measurably faster
comprehension for the majority of sessions, which occur on Days 3+.


## 8. Cross-Page Patterns That Compound

Three patterns from Today's v2 design should propagate across pages to compound
habit formation:

MorningRecap model: The "yesterday you did X" open-of-day pattern creates the sense
that the system holds memory between sessions. Week page should apply an equivalent —
"last week: N ceremonies completed, M friction signals." Without it, Week opens as
cold as Today did before Iteration 14.

Day-band hint strip (C-UX-9 / C-UX-4): The daysSinceSignupHint model is the right
pattern for every empty state. Catalog, Week, Portfolio, and InsightsPortfolio all
have cold one-liners. Each should inherit the day-band warmth ladder.

EOD closure CTA model: EodClosureStrip works because it fires conditionally and has
a single CTA. The Kaizen page should apply the same pattern: when a Kaizen has been
active for 21+ days, show an inline strip — "Remeasurement window approaching. Capture
your result." This closes the Kaizen habit loop the same way EodClosureStrip closes
the daily ritual loop.

## 9. Open Questions for Phil

1. RhythmExplainer on Day 3+: collapsed (one tap to expand) or fully suppressed?
   Collapsed preserves learnability; suppressed reduces clutter. C-AN-1 data will
   eventually answer this, but a default must ship before instrumentation lands.

2. Midday re-engagement policy: a "N done, M to go" count on NowPane is display-only
   and has no clock dependency. A time-triggered in-app banner requires C-PM-4
   infrastructure. Is there a policy preference on in-session nudges beyond the
   EOD strip that determines which path to take?

3. Friction-signal capture on skip: §7.3 requires 3 friction signals in week 1. The
   current flow gates friction capture inside the end-of-activity reflection. If a user
   skips a reflection the signal is lost. Should the skip flow include a lightweight
   friction-signal option to recover signals that would otherwise be dropped?

4. Day-7 adherence reveal: retroactive (show Days 0-6 data, which may read as punitive
   for a weak first week) or forward-only (from Day 7 onward)? The answer determines
   whether the reveal copy is a goal-setting moment or a damage-control moment.
