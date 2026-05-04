# Growth Strategy — Simplified Today Page + No-Projects Discovery Flow

Owner: growth-strategist
Status: v1.0 — 2026-04-30
Inputs: PRD_CADENCEPLAN_TODAY.md, UX_REVIEW_TODAY_GROWTH.md, UX_TODAY_V2_GROWTH.md,
UX_TODAY_V2_DESIGN.md, UX_TODAY_V2_ANALYTICS.md, PRODUCT_BLUEPRINT.md §7.x,
Sprint 15–16a notes, ARCHITECTURE_DELTA_CADENCEPLAN.md.

---

## 1. Onboarding Funnel — Current vs Proposed

### Current funnel (as-coded, pre-simplification)

```
Signup
  └─ Today loads: header dashes + RhythmExplainer wall + duplicate welcome copy
       └─ AutoPlanButton visible (below fold on mobile)
            └─ [DROP-OFF A] — user does not tap; overwhelmed or confused by wall of copy
            └─ AutoPlanButton tapped → PROPOSED CycleCard appears
                 └─ [DROP-OFF B] — no project context; user does not know what activities mean
                 └─ Accept tapped → ACCEPTED day
                      └─ [DROP-OFF C] — no "what now" signal; NowPane may be below fold
                      └─ First activity started ← activation moment
```

Observed structural problems:
- RhythmExplainer consumes 10–15s before the CTA is visible.
- Welcome message appears twice within 20px (hint strip + FIRST_RUN paragraph).
- No project context means the proposed day is opaque; acceptance requires blind trust.
- MorningRecap is suppressed on Day 0, so the first session has no continuity scaffold at all.

### Proposed funnel (simplified Today + no-projects discovery)

```
Signup
  └─ Today loads: header + CycleCard only (no RhythmExplainer, no duplicate copy)
       └─ 0 projects detected → project discovery gate renders inside CycleCard
            └─ [DROP-OFF A] — user sees "choose your project type" as a chore, not a step
            └─ Project type selected (DMAIC / Kaizen Event / Accelerator / Ad Hoc)
                 └─ [DROP-OFF B] — user names project but doesn't understand implications
                 └─ First project created → composer has context
                      └─ PROPOSED day appears: activities are now named and linked
                           └─ [DROP-OFF C] — user still doesn't know to tap Accept
                           └─ Accept tapped → ACCEPTED day with 4h project + 2h comm + 2h CI
                                └─ First activity started ← activation moment
```

Structural gains:
- CycleCard is visible immediately; discovery prompt lives inside it, not above it.
- Project type selection gives the user agency before the system proposes anything.
- The day that appears is named and contextualized; acceptance is less of a leap.
- Removing RhythmExplainer removes the primary comprehension-time tax on Day 0.

Key funnel metrics to instrument (Iter 21 events; add these):
- `ProjectDiscoveryShown` — discovery gate rendered, 0-project state confirmed
- `ProjectTypeSelected { type }` — which type was chosen
- `ProjectCreated { type, daysSinceSignup }` — project named and saved
- `DiscoverySkipped` — user dismissed or bypassed the gate without selecting
- `CycleAccepted { isFirstRun, hadProjectContext }` — did they have a project when they accepted?

---

## 2. First-Day Activation Moment — The Aha

In the simplified design, the aha moment is not "a plan appeared." It is:

**"The system built my exact workday from a structure I already understand — and I didn't have to invent it."**

This lands when the user sees the PROPOSED CycleCard after project creation and reads:
- A named Deep Work block tied to their project (e.g., "DMAIC — Define Phase")
- A 09:15 communication slot (High-value Communication Time-blocking)
- A CI block (PDCA Cycle or L&D Tracker)
- Total time: 4h + 2h + 2h. Nothing invented. Nothing ambiguous.

The aha requires three conditions to be met simultaneously:
1. The user created a project so the Deep block has a name they recognize.
2. The BucketStrip is visible above the block list showing the 4-2-2 shape.
3. The PROPOSED copy says something true: "Your first [Project Type] day, built from
   standard activities. Accept to commit — you can adjust anything first."

Without condition 1 (no project context), the aha collapses into "a generic schedule appeared."
This is why no-projects discovery is a prerequisite to activation, not a barrier before it.

Target: aha reachable within 90 seconds of first landing on Today with 0 projects.

---

## 3. No-Projects Flow as Growth Lever

### Reframe: from gate to discovery

Wrong frame: "Before you can use the product, you must complete setup."
Right frame: "Tell us one thing — which improvement approach fits your work — and we build
your first day around it."

The no-projects state is an opportunity to demonstrate the product's core value:
it composes from a structure you choose, not from a blank calendar.

### Sequence that makes project type selection feel like progress

Step 1 — The CycleCard is empty but not cold.
Copy: "Your first day is 60 seconds away. One question first: what kind of work are you
running right now?"

Step 2 — Four large tappable tiles inside the CycleCard (not a wizard, not a modal):
```
[ DMAIC Project ]         [ Kaizen Event ]
[ 30-Day Accelerator ]    [ Ad Hoc Project ]
```
Each tile has a one-line description, not a paragraph. Example for DMAIC:
"Structured improvement project with Define → Control phases."
This teaches by showing, not by explaining.

Step 3 — After type selection, the user names the project inline (single text field,
placeholder: "What are you improving?"). Two taps + a name. Not a form.

Step 4 — Immediately: "Building your first [type] day…" → PROPOSED CycleCard appears.
The transition from "I picked a type" to "here is my composed day" should feel instant.
This is the moment the product proves it can do what it claims.

Step 5 — PROPOSED copy + BucketStrip visible. The user sees their project name in the
Deep block. Accept is the only obvious CTA.

### What this is NOT

- Not a multi-step wizard with back/next buttons.
- Not a modal that blocks the day view.
- Not a settings page. Project creation happens inside Today on Day 0 only.
- Not a barrier. If the user taps "Skip for now," Today shows a minimal day with generic
  Deep Work blocks, and the discovery prompt reappears on Day 1.

---

## 4. Conversion Metrics for the No-Projects Flow

| Metric | Definition | Target | Anti-pattern signal |
|---|---|---|---|
| Time to first project declared | `ProjectCreated.timestamp − Signup.timestamp` | ≤ 5 minutes | > 15 minutes = discovery gate is friction |
| % declaring project on Day 0 | `ProjectCreated { daysSinceSignup: 0 }` / total Day-0 sessions | ≥ 70% | < 50% = gate feels like a chore |
| % skipping discovery | `DiscoverySkipped` / `ProjectDiscoveryShown` | < 20% | > 35% = value prop not landing in copy |
| % accepting first proposed day | `CycleAccepted { isFirstRun: true }` / `CycleProposed { isFirstRun: true }` | ≥ 60% | < 40% = composed day doesn't match expectations |
| Drop-off: discovery → type | `ProjectDiscoveryShown` − `ProjectTypeSelected` | < 15% drop | > 30% = tile copy or options confusing |
| Drop-off: type → project created | `ProjectTypeSelected` − `ProjectCreated` | < 10% drop | > 25% = naming step has friction |
| Drop-off: project created → accepted | `ProjectCreated` − `CycleAccepted { isFirstRun }` | < 20% drop | > 40% = composed day not trusted |

Report these as a daily cohort table segmented by project type. DMAIC vs Accelerator
users likely have different activation patterns and should not be blended in early reads.

---

## 5. Lifecycle Messaging Hooks in Simplified Today

Removing RhythmExplainer removes one explicit teaching surface. Microcopy inside the
simplified Today must carry the teaching load. Places where it still fires:

**CycleCard header — PROPOSED state (Day 0 only)**
One sentence max. Example: "4h project work · 2h comms · 2h improvement — built from
the Standard Work catalog. Accept to start."
This is the only place where the 4-2-2 structure is explained. It disappears after Day 1.

**BucketStrip labels — always visible**
Labels: "Deep Work / Comms / Improvement" (not "PROJECT / COMMUNICATION / CI").
The vocabulary IS the teaching. No additional copy needed.

**AutoPlanButton label context — empty state**
On Day 0 after project creation, button label context shifts:
"Auto-Plan your [Project Type] day" — personalised using the project type name.

**NowPane IN_PROGRESS — always**
"Now: [Activity name] · Xm elapsed" is the strongest real-time hook. No microcopy change
needed. This surface does more habit-teaching than any explainer.

**EOD closure strip — Day 1+ (C-UX-3, shipped)**
"4 closed · 1 skipped. Tomorrow is ready." — the continuity signal that replaces
MorningRecap as the close-of-day anchor. (See §7 for the compensating mechanic discussion.)

**Hint strip — Day 2–6 (active-state AND empty-state)**
Current behavior: hint fires on empty-state only. This is a gap for engaged users.
Proposed: hint also fires on active-state for Days 2–6 as a contextual nudge row
below the CycleCard header (not above the plan). Copy per band:

| Day | Copy |
|---|---|
| 0–1 | "First day built. Tap a block to start." |
| 2–3 | "Day [N]. First-week goal: 5 accepted days. On track: [X]/5." |
| 4–6 | "Day [N]. Capture a friction signal today — [Insight page] reads them Friday." |
| 7 | "7-day baseline live. Your adherence: [N]%. Target: ≥70% over 14 days." |
| 14–29 | "Week [N]. [X]% acceptance. Friday's reflection promotes your first Kaizen." |
| 30+ | Hint strip retires. Experienced user operates without copy scaffolding. |

---

## 6. Day-1 vs Day-7 vs Day-30 Experience

### Day 1 — New user, first returning session
Risk: simplified Today is empty of onboarding chrome, so returning user has no context
about why yesterday mattered.
Strategy: MorningRecap strip (C-UX-10, shipped in Iteration 14) carries this. Without it,
Day 1 opens as cold as Day 0. MorningRecap must fire on Day 1 even if yesterday's session
was short. The strip is the continuity signal that justifies the return visit.
Simplified Today does not degrade here IF MorningRecap is active.

### Day 7 — Engaged user, baseline unlocks
Risk: AdherenceDial reveals a number the user doesn't know how to interpret.
Strategy: One-time contextual line on Day 7 below the AdherenceDial:
"Your 7-day baseline is set. Target: ≥70% adherence over the next 14 days. You're at [N]%."
This fires once (daysSinceSignup === 7) and then suppresses. It is the only time
the product tells the user what the numbers mean. After that, the numbers are self-evident
or the user navigates to Insights.

Simplified Today does not degrade here. Fewer surfaces means less noise around the reveal.

### Day 30 — Power user
Risk: removing onboarding chrome means power users who never saw it may miss context
they would have wanted. In practice, by Day 30 the user has accepted plans repeatedly
and understands the 4-2-2 structure from lived experience, not from explainers.
Strategy: no onboarding chrome at Day 30. Hint strip retired (see §5). The day opens
as: header + MorningRecap strip + CycleCard. That is the right experience for a power user.
Simplified Today is a net positive at Day 30. Less chrome = faster comprehension.

---

## 7. Removing MorningRecap — Growth Implication

MorningRecap (C-UX-10, Iteration 14) is "yesterday's evidence linkage." It creates the
signal: "the system remembers; coming back has a reward." Without it, every day opens cold.
Cold open = no return-visit pull = Day 2–6 attrition risk.

**The prior growth analysis (UX_REVIEW_TODAY_GROWTH.md §5 HR-1) rated absence of morning
recap as the single biggest habit loop gap.** Removing it after it was shipped is a
regression, not a simplification.

Growth implication of removal:
- Day 1 return rate will drop. Users who had no signal that "yesterday mattered" have
  no reason to return before they need to plan again.
- Reflection rate (Blueprint §7.3 target ≥75%) will fall. MorningRecap surfaces pending
  reflections from yesterday. Without it, those reflections are invisible until Friday's
  Weekly Reflection prompt fires. The weekly ritual becomes the only capture moment.
- Blueprint §7.4 launch metric (≥35% of signups: 7 composed days + 1 reflection within
  14 days) is harder to hit without a daily return-visit hook.

**Compensating mechanic if MorningRecap is removed:**
The only viable replacement is the EOD closure strip (C-UX-3, shipped). If the EOD strip
closes with "Tomorrow's plan is ready — [N] activities, [Xh] deep time," it creates a
forward pull instead of a backward reflection. This shifts the continuity signal from
morning (recall) to evening (anticipation). The behavioral effect is different but present.
Recommendation: do NOT remove MorningRecap. If the simplified Today needs fewer surfaces,
remove the hint strip before removing MorningRecap. The hint strip is recoverable from
day-band logic; the morning continuity signal is architecturally unique.

---

## 8. Removing RhythmExplainer — Growth Implication

RhythmExplainer taught that the 4-2-2 split is a deliberate design decision, not an
arbitrary schedule. Without it, new users may interpret the composition as a generic
time-block suggestion, not a structured methodology with ceiling/floor rules.

**Growth implication of removal:**
- Users who do not understand that 4-2-2 is a constraint (not a suggestion) will attempt
  to swap the CI block into a second deep-work block, or reject plans that feel "too
  structured." Acceptance rate on Day 0 may drop if users don't trust the structure.
- The "why chip" (C-UX-12) partially compensates: it surfaces per-composition rationale.
  But it does not explain the underlying constraint system.

**Minimal compensation (two surfaces, total of ~15 words each):**

Surface 1 — BucketStrip tooltip (hover/tap on any bucket label):
"Deep Work (4h) · Comms (2h) · Improvement (2h) — your daily 4-2-2 structure.
Each bucket has a daily floor the system protects."
This is discoverable on demand, not pushed. It does not block comprehension.

Surface 2 — First-accept confirmation line (fires once on Day 0 accept):
"Accepted. Your 4-2-2 day is locked in — Deep Work 4h, Comms 2h, Improvement 2h.
This structure is the system's core constraint."
Fires inline below the CycleCard. Disappears after 5 seconds or on scroll.

These two surfaces replace the RhythmExplainer without its scan cost. Together they
deliver the same factual content (the split exists and is deliberate) on demand rather
than on every page load.

---

## 9. End-of-Cycle Communication Slot — Adoption Strategy

The 2h communication anchor (AM slot + post-lunch slot) is unfamiliar to users coming
from tools where "communication" means "reply to email whenever." The post-lunch slot
in particular — a structured 60-minute comm window — may feel artificial.

**Strategy: let the activity name do the teaching, not the copy.**

The catalog name "High-value Communication Time-blocking (30–60 min)" is specific enough
to be self-explanatory. The user who sees this activity in the PROPOSED plan at 13:00
reads "communication time-blocking" and understands: this is protected time, not ambient.

Two reinforcing mechanics:

1. Skip reason codes. When a user skips the comm slot, the SkipReasonModal presents the
   five fixed codes. If "MEETING_OVERRUN" or "UNPLANNED_INTERRUPTION" fires frequently on
   the comm slot, that is both a data signal and a teaching moment — the skip-reason UX
   implies the slot was protected and something violated it.

2. EOD closure strip counts by bucket. If the EOD strip reads "Deep: 4/4 closed ·
   Comms: 1/2 closed · CI: 2/2 closed," the user sees comm compliance as a trackable
   metric, not just an abstract goal. This normalizes the comm slot as a measurable
   part of the day, the same as deep work.

No additional onboarding copy is needed if these two mechanics are in place. The user
learns the comm slot is intentional by interacting with it and tracking it.

---

## 10. CI Sacredness — Adoption Strategy

The 2h CI block (PDCA Cycle, L&D, Kaizen work) is the most culturally foreign element
for users from execution-only tools. Users coming from Jira/Asana treat all non-project
time as waste to minimize. CI time looks like slack; they will try to move it.

**Onboarding hook (Day 0, fires once):**
When the user attempts to swap the CI block during edit mode, an inline one-liner fires
below the EditDrawer:
"CI time is a daily floor, not a suggestion. The system will always protect 2h for
improvement work. You can change which CI activity fills this slot, not whether it exists."

This fires only once and is not a blocking modal. It teaches the rule by enforcing it
at the moment of resistance.

**Tooltip on first CI block tap (Day 0–2):**
"Continuous Improvement — 2h daily. This slot feeds your Kaizen pipeline. Try to protect it."
One sentence. Disappears on dismiss. Not repeatable after Day 2.

**The structural teaching:**
The most powerful teacher is that CI time IS there, every day, and the plan feels complete
with it. By Day 7, the user who has accepted five plans knows CI time is always 2h. They
stop questioning it and start thinking about what goes in it. The sacredness is taught
by repetition in the composition, not by copy.

---

## 11. Top 3 Growth Experiments

All three are A/B-able once `TodayPageViewed` (C-AN-1) and the new discovery events
are instrumented.

### Experiment 1 — Discovery gate: tiles inside CycleCard vs separate modal

Hypothesis: showing project type selection inside the CycleCard (integrated) reduces
drop-off at the discovery step vs. a modal that interrupts the Today view.

Variant A (control): project discovery as an interstitial modal before Today loads.
Variant B (treatment): project type tiles rendered inside the CycleCard on 0-project state.

Success metric: `ProjectCreated` / `ProjectDiscoveryShown` rate.
Guard: `DiscoverySkipped` rate must not increase in variant B.
Measurement: 14-day cohort. Segmented by project type selected.

### Experiment 2 — First-accept copy: generic vs structure-explaining

Hypothesis: a single sentence naming the 4-2-2 structure in the PROPOSED CycleCard header
increases acceptance rate on Day 0 vs generic "review and accept" copy.

Variant A (control): "Here is your proposed day. Accept to schedule, Edit to tweak, Reject
to discard." (current copy)
Variant B (treatment): "Your first [Project Type] day — 4h deep work, 2h comms, 2h
improvement. Built from standard activities. Accept to commit."

Success metric: `CycleAccepted { isFirstRun }` / `CycleProposed { isFirstRun }`.
Guard: `CycleEdited` rate (high edits = plan not trusted even if accepted).
Measurement: 14-day cohort. p75 time-to-accept as secondary metric.

### Experiment 3 — CI block skip tooltip: on-resistance vs proactive

Hypothesis: a one-time tooltip that fires when the user first views (not swaps) the CI
block ("This is your daily improvement time — the system protects it") reduces the
rate at which users attempt to remove CI blocks, vs. firing only on swap attempt.

Variant A (control): tooltip fires on edit-mode swap attempt of CI block (reactive).
Variant B (treatment): tooltip fires on first tap of CI block (proactive, Day 0 only).

Success metric: Rate of CI-block swap attempts on Days 0–3.
Guard: Overall `CycleAccepted` rate must not drop (proactive tooltip must not annoy).
Measurement: 7-day window (shorter because CI interaction signal is high-frequency).

---

## 12. Top 5 Growth Risks

**Risk 1 — Removing onboarding chrome increases early confusion**
Simplified Today (header + CycleCard only) removes the RhythmExplainer and the duplicate
welcome copy. For a first-run user with 0 projects, the empty CycleCard with discovery
tiles may read as "the app is broken" before the copy lands. Mitigation: ensure the
discovery state copy is warm and directive. Test with a 5-second reading test before ship.
Monitor `DiscoverySkipped` rate as the leading confusion signal.

**Risk 2 — Project discovery flow feels like a barrier, not a value moment**
If the discovery gate is perceived as "fill out a form before you can use the product,"
the flow fails its design intent. Mitigation: tile-based selection (not a form), no more
than two taps plus a name field, and immediate composition feedback after project creation.
If time from `ProjectDiscoveryShown` to `CycleProposed` exceeds 3 minutes, the gate is
too heavy.

**Risk 3 — Sacred CI time feels restrictive, not empowering**
Users who try to collapse the CI block and hit the one-time enforcement message may interpret
the constraint as inflexibility rather than methodology. Churn risk is highest in the first
3 days before the habit is formed. Mitigation: the enforcement message must be non-punitive
in tone. "The system always protects 2h for improvement" is better than "you cannot remove
this." Offer a swap to a different CI activity as the recovery path, not a dead end.

**Risk 4 — Longer comm budget (2h structured) feels rigid**
The 2h communication anchor is larger than what most knowledge workers have explicitly
protected before. A user who has 3h of actual meetings may see their comm slot crowded
before they start. Mitigation: the FineTuneDrawer's `externalMinutesToday` field is the
correct valve. Day-0 onboarding should mention it once: "Adjust for today's meetings in
Fine-tune." Surface this in the INFEASIBLE recovery path, not as a default nudge.

**Risk 5 — Losing MorningRecap breaks the Day-2 return rate**
The most structurally significant risk in the simplified Today. Day-2 return rate is the
earliest proxy for 14-day activation (Blueprint §7.4). If MorningRecap is removed, the
return-visit pull on Day 2 is zero — the user must self-motivate to return rather than
being pulled back by a "yesterday you did X" signal. Monitor Day-2 session rate as the
primary guardrail metric. If Day-2 return drops below 50%, MorningRecap must be restored
regardless of the simplification argument.

---

## Summary for Handoff

**Launch objective:** Activate new users through a no-projects discovery flow that makes
project type selection the first value-delivery moment, so the composed day that appears
is named, contextualized, and trusted.

**Target audience:** First-run users with 0 projects on Today; returning users Days 1–6.

**Core message:** "Tell us one thing — what kind of work you're running — and we build
your structured day around it. 4h deep work, 2h communication, 2h improvement. Every day."

**Activation motion:** ProjectDiscoveryShown → ProjectTypeSelected → ProjectCreated →
CycleProposed → CycleAccepted → ActivityStarted. Five steps, target ≤90 seconds.

**Measurable experiments:** (1) Discovery gate placement (modal vs integrated CycleCard).
(2) PROPOSED copy with explicit 4-2-2 naming vs generic accept copy.

**Risks to monitor:** Day-2 return rate (MorningRecap removal), DiscoverySkipped rate
(gate perception), CI block swap attempt rate (sacredness friction).
