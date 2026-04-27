# Today Page — Activation & Daily Habit Review (growth-strategist lens)

## 1. The First-Run Experience

Day 0, in order:

1. Header renders: `Day 1` badge, AdherenceDial showing `— —% —` with copy "Building your baseline. Numbers populate after day 7."
2. Hint strip fires (daysSinceSignup = 0): "Welcome to CadencePlan. Tap Auto-Plan to compose your first balanced day."
3. RhythmExplainer (not dismissed): "Your 4-2-2 daily rhythm — CadencePlan balances each day across three buckets…"
4. Empty state copy (isFirstRun = true): "Welcome to CadencePlan. Tap Auto-Plan to compose your first balanced day — you can always adjust before you accept."
5. Primary CTA: `Auto-Plan` button.

The welcome message appears **twice** — once in the hint strip and once in the FIRST_RUN paragraph — using nearly identical language. The first impression the user actually receives is three stacked cold items (dashes, an explainer wall, a repeated welcome) before they see any CTA. The path to first value is: Auto-Plan → composer produces a day → user sees CycleCard in PROPOSED state → Accept. First accepted cycle is reachable in one tap but the copy around it does not dramatize what happens next or why acceptance matters. There is no preview of what an accepted day looks like before the user commits to tapping.

## 2. Onboarding Curve

`daysSinceSignupHint` bands vs. Blueprint §7.3 leading indicators:

| Band | Current copy | Blueprint milestone it should drive |
|---|---|---|
| Day 0–1 | "Tap Auto-Plan to compose your first balanced day." | Blueprint §7.3: first Daily composition before 9:00 local |
| Day 2–6 | "You're X days in. Aim for at least 5 accepted days in your first week." | Blueprint §7.3: composition acceptance ≥ 40% by day 14; ≥ 3 friction signals in week 1 |
| Day 7+ | "Your first Weekly Reflection is Friday. That's where improvement ideas surface." | Blueprint §7.4: launch metric requires 1 Weekly Reflection completed by day 14 |

Gaps:
- Day 2–6 copy references a 5-day acceptance target but does not prompt the user to capture reflections, which is the other half of the §7.4 launch metric.
- The hint strip fires on **empty state only** — a user with an active composition sees nothing from this copy. Day 3 users who accepted their day have no hint, no progress signal, no nudge toward friction capture.
- Day 7 copy shifts to Weekly Reflection without acknowledging that their adherence number is now live — a moment that can produce either pride (activation) or disappointment (churn risk) with no framing.
- No copy exists for day 8–13 (the critical second week before the §7.4 measurement window closes).
- No copy exists for days 14, 21, 30, 60, or 90 — the Blueprint §7.2 / §7.5 durability milestones have no corresponding lifecycle copy.

## 3. The Daily Habit Loop

Day 5 engaged user experience:

1. Opens `/today`. Sees AdherenceDial with real numbers for the first time (day 7 gate not yet reached, so still dashes unless metrics backfill early days). No morning recap of yesterday.
2. RhythmExplainer: still showing unless dismissed. On day 5 it is pure friction — teaches nothing new, blocks the CTA.
3. If they accepted yesterday's plan, Today shows an active composition. No "yesterday you closed X/Y blocks" headline. No continuity signal from day 4.
4. NowPane and UpNextRail are visible if `nowIso` is wired — these are the strongest real-time habit hooks present.
5. No streak visualization. No hot-hand signal. No "5 days in a row" moment.
6. No end-of-day closure. C-PM-4 (OPEN, score 12) is the only backlog item addressing this; without it there is no ritual anchor at the end of the day, which means the loop has a start-of-day hook (Auto-Plan / NowPane) but no close-of-day hook.
7. The only pull-back-tomorrow signal is the next cycle being pre-composed — but there is no copy telling the user "tomorrow's day is ready" or "come back Friday for your first Weekly Reflection."

Streak / hot-hand: not present. Blueprint §4.3 explicitly excludes streaks and gamification, so this is by design. The gap is that the *functional equivalent* — momentum copy, a "days accepted" count, a rolling 7-day window in the AdherenceDial — is also absent.

End-of-day closure: none (C-PM-4). Morning-anchor recap: none. These are the two biggest loop gaps.

## 4. Activation Risks (top 5)

**AR-1 — Duplicate welcome copy deflates first impression.**
FIRST_RUN paragraph and the day 0–1 hint strip say the same thing within 20px of each other. The user reads the message as a generic splash screen, not a targeted next step. They may skip the RhythmExplainer (scroll past) without reading it, then read the same welcome again. Funnel effect: reduced Auto-Plan tap rate on day 0.

**AR-2 — AdherenceDial shows dashes for 7 days, with no forward progress signal.**
"Building your baseline. Numbers populate after day 7." is accurate but feels like a locked door. A new user who has accepted three days in a row has no visible evidence of progress. The dial should communicate momentum (days accepted, reflections captured) before the 14-day metric window produces a percentage. Funnel effect: users who don't see progress disengage before the baseline is established.

**AR-3 — INFEASIBLE branch dead-ends without a clear recovery path.**
`InfeasibleBanner` says: "Can't fit today at current capacity." / "Open Fine-tune to raise capacity or reduce external meetings." The FineTuneButton renders, but a new user does not know what Fine-tune is or what values to enter. There is no scaffolding copy that tells them what a typical capacity input looks like or what the outcome of adjusting it will be. A new user who hits INFEASIBLE on day 1 has no good next step. Funnel effect: day-1 churn spike on INFEASIBLE encounters.

**AR-4 — RhythmExplainer blocks the CTA on an active-composition day.**
On the active-state branch (user has an accepted day), `rhythmExplainerHtml` renders above NowPane and the day body. A returning user on day 3 sees the explainer again if they have not dismissed it. The dismiss is a deliberate tap; many users will scroll past and the explainer eats vertical space above the first activity. Funnel effect: friction on activity start, especially on mobile where the CTA is off-screen.

**AR-5 — Edit-mode discoverability is zero on the empty state.**
The empty state shows only Auto-Plan. There is no affordance communicating that users can also edit a proposed plan or add from the Catalog. The EMPTY copy mentions "add activities from the Catalog" but the word "add" is not a button and there is no link. A user who rejects the first proposal and lands back on the empty state sees only "Auto-Plan" again. Funnel effect: rejection loop — users who don't want the auto-composed day have no visible path forward.

## 5. Habit Risks (top 5)

**HR-1 — No morning recap creates no yesterday-to-today continuity.**
Every day opens cold. A returning user has no signal that yesterday's reflections fed into today's proposal. "Yesterday you closed 5/6 blocks" or "1 friction signal queued for Friday" would create a sense that the system is working between sessions. Without it, the product feels stateless from the user's perspective.

**HR-2 — Hint strip copy stagnates after day 7.**
The day 7+ hint is always identical: "Your first Weekly Reflection is Friday." After the first Friday, this copy is permanently stale. A user on day 45 still sees the same first-Friday message on any empty-state day, which is trust-eroding. The hint band collapses all of weeks 2–forever into one line.

**HR-3 — No end-of-day closure (C-PM-4).**
The loop has an open-of-day hook (Auto-Plan, NowPane) but no close-of-day hook. A user who finishes their last activity at 5:00 PM has no signal from the product that the day is complete, that their data is saved, or that tomorrow is already composed. Without closure, the user has no reason to return until tomorrow when they open the app again — and there is no morning recap to reward that return (HR-1).

**HR-4 — AdherenceDial has no trend or momentum signal in week 2+.**
After day 7, the dial shows three static percentages. There is no sparkline, no week-over-week delta, no "up 8 points from last week" framing. A user at 68% adherence on day 21 does not know if they are improving, plateauing, or declining. Blueprint §7.2 targets ≥ 70% adherence — the user is flying blind as to whether they are on track.

**HR-5 — No weekly preview from Today forces a context switch to `/week`.**
A user on Thursday afternoon has no signal from Today about Friday's Weekly Reflection or what is coming tomorrow. They must navigate to `/week` to see the full picture. Friday's Reflection is the highest-leverage habit in the product (it promotes Kaizens); users who do not know it is coming tomorrow will not clear time for it.

## 6. Microcopy Heat Map

| String | Rating | Replacement (cold only) |
|---|---|---|
| "Welcome to CadencePlan. Tap Auto-Plan to compose your first balanced day — you can always adjust before you accept." (FIRST_RUN) | cold | "Your first day, composed in seconds. Tap Auto-Plan — the system builds a balanced 4-2-2 day from the Standard Work catalog. Review it, adjust if needed, then accept to commit." |
| "No day scheduled yet. Auto-Plan to see a proposal, or add activities from the Catalog." (EMPTY) | cold | "No plan yet. Auto-Plan proposes a balanced day from your catalog. Or pick a starting point from Catalog." (with Catalog as a tappable link) |
| "Composer flagged an infeasible day. Raise your daily capacity or reduce external meetings, then Auto-Plan again." (INFEASIBLE) | cold | "Your current capacity is too tight to fit the required activities. In Fine-tune, raise your available hours or reduce external meeting time, then tap Auto-Plan." |
| "Can't fit today at current capacity." (InfeasibleBanner headline) | cold | "Required activities won't fit in your available time." |
| "Open Fine-tune to raise capacity or reduce external meetings." (InfeasibleBanner body) | neutral | — |
| "Building your baseline. Numbers populate after day 7." (AdherenceDial empty) | cold | "Baseline in progress — [N] of 7 days complete. Your adherence and acceptance numbers unlock on day 7." |
| "You're X days in. Aim for at least 5 accepted days in your first week." (hint day 2–6) | warm | — |
| "Your first Weekly Reflection is Friday. That's where improvement ideas surface." (hint day 7+) | neutral | — |
| "Your 4-2-2 daily rhythm" (RhythmExplainer heading) | neutral | — |
| "Got it" (RhythmExplainer dismiss) | cold | "Got it — don't show again" |
| "Auto-Plan" (button label) | warm | — |
| "Composing…" (button loading) | warm | — |

## 7. Top 5 Growth-Lens Improvements (ranked)

| Title | Hypothesis | Expected funnel effect | Effort | Risk |
|---|---|---|---|---|
| 1. Morning recap strip | A one-line "yesterday you closed X/Y · 1 friction signal queued for Friday" anchors the return visit and signals the system is working between sessions | +15–20% D2 retention; drives reflection-rate toward §7.3 target | S | Low — pure copy + one data read |
| 2. End-of-day closure prompt (C-PM-4) | A time-triggered nudge at or after last scheduled activity ("Day complete. 6/7 blocks closed. Tomorrow is ready.") closes the habit loop and creates a natural re-engagement hook for the next morning | Primary driver of ≥75% reflection rate (§7.3) that has no current activation mechanism | M | Medium — requires clock signal and composition-completion heuristic |
| 3. Progress-aware AdherenceDial (days 0–6) | Replace "numbers populate after day 7" with a day counter and an accepted-day pip row so users see incremental momentum before the full metric unlocks | Reduces day 3–6 drop-off from users who see only dashes; directly addresses AR-2 | S | Low — display-only, no metric logic change |
| 4. INFEASIBLE recovery scaffolding | Add a one-paragraph "What to try" section to InfeasibleBanner with two concrete examples (e.g., "Typical capacity: 420–480 min. External meetings today: 60 min leaves 420 for standard work.") | Prevents day-1 churn on INFEASIBLE; converts a dead-end into a learning moment | S | Low — copy only, no logic change |
| 5. Day-7 adherence reveal moment | When the AdherenceDial numbers first populate (day 7), show a contextual framing line: "Your 7-day baseline is set. Target: 70% adherence over the next 14 days." | Converts a passive number unlock into an active goal-setting moment that ties behavior to §7.2 targets | S | Low — one conditional copy string keyed to daysSinceSignup === 7 |

## 8. Cross-Page Habit Patterns to Standardize

**Week (`/week`):** The five daily BucketStrip miniatures and the Deep-minutes headline exist per UX_FLOWS §6.4, but there is no "this week vs last week" delta on any metric. A returning user on Thursday cannot see whether this week is better or worse than the prior week without navigating to Insights. Add a single delta line ("Deep minutes: 720 this week vs 640 last week, +12%") as a persistent week-header element. This creates a weekly momentum signal that does not require the user to leave the page.

**Catalog (`/catalog`):** No personalization signal. A user who has enabled 12 of 50 entries sees the same page on day 30 as on day 1. Add a "your most-used activities" section at the top — the three catalog entries that have appeared most in accepted compositions. This surfaces the catalog as a living record of the user's actual rhythm, not just a configuration panel.

**Kaizen (`/kaizen`):** KaizenCard shows DRAFT / ACTIVE / IN_REMEASUREMENT states but no time-elapsed signal. A user on day 18 of an active Kaizen does not know if their remeasurement date is approaching. Add an inline "N days since activation · remeasurement suggested by [date]" line on the ACTIVE card. This creates a deadline-proximity hook that pulls the user back before the Kaizen goes stale.

**Insights (`/insights`):** The three KPIs are read-only but there is no narrative framing. A user who opens Insights sees three numbers without any "what this means" copy. Add a single sentence beneath the three KPIs that interprets the current state: "Adherence is above the 70% target. Acceptance is below — consider reviewing your capacity setting." This makes Insights a coaching surface, not just a reporting surface, and gives the user a reason to return weekly.

**InsightsPortfolio (`/insights/portfolio`):** The validated Kaizen portfolio exists (shipped Iteration 11) but has no "next step" affordance. A user who views a closed Kaizen with a successful result has no prompt to start the next one. Add a single CTA at the bottom of the portfolio: "Ready for your next Kaizen? Friday's reflection is where the next candidate surfaces." This closes the improvement loop and creates a pull from the portfolio view back into the weekly ritual.

## 9. Lifecycle Copy Bands That Should Exist

| Day | Copy | Blueprint milestone |
|---|---|---|
| 0 | "First day. The system has composed a balanced 4-2-2 day from the Standard Work catalog. Accept it to start your baseline." | §7.3: first Daily composition before 9:00 |
| 1 | "Yesterday's plan accepted. Baseline started. Each reflection you capture today is raw material for your first Weekly Reflection." | §7.3: reflection rate ≥ 50% by day 7 |
| 3 | "3 days in. Your first week's goal: 5 accepted days and 3 friction signals captured. You're on track." | §7.3: ≥ 3 friction signals in week 1 |
| 7 | "7 days complete. Your adherence and acceptance numbers are now live. Target: ≥ 70% adherence over the next 14 days." | §7.3: leading indicators unlock |
| 14 | "Week 2 done. Your launch baseline is set — [N]% adherence, [N]% acceptance. Friday's reflection is the improvement engine; don't skip it." | §7.4: launch metric measurement window closes |
| 21 | "3 weeks in. If your first Kaizen is not yet active, this week's reflection is the right moment to promote one from your friction queue." | §7.5: path to first validated Kaizen by day 30 |
| 30 | "30 days. Standard work acceptance is a habit if you're above 60%. Below that, check your capacity setting — the composer may be over-packing." | §7.2: composition acceptance ≥ 60% |
| 60 | "60 days in. One validated Kaizen per month is the durability signal. If your pipeline is empty, open Friday's reflection and look at your friction log." | §7.5: ≥ 1.0 validated Kaizens per MAU per month |
| 90 | "90-day mark. The §7.5 target is 1 validated Kaizen per month for two consecutive months. If you're there, the system is working. If not, the variance log shows why." | §7.5: 90-day durability judgment |

## 10. Open Questions for Phil

1. **Day-7 dial reveal:** When adherence numbers first unlock, should the product show the user their day-1-to-7 data retroactively (which may show low numbers that feel punitive) or only forward-looking data from day 7 onward? The answer changes the framing copy and the risk profile of the reveal moment.

2. **INFEASIBLE frequency:** How often does the composer return INFEASIBLE for a new user with default capacity (480 min)? If it is common in week 1, AR-3 is a higher-priority fix than the ranking above suggests. A single INFEASIBLE encounter with no scaffolding on day 1 is likely fatal to activation.

3. **RhythmExplainer dismissal persistence:** Is the dismissed flag stored server-side (persists across devices and sessions) or client-side (localStorage)? If client-side, a user who clears storage or switches devices re-sees the explainer every day, which makes HR-2 (stale copy) worse for power users. The growth implication is meaningful if dismissal is not durable.

4. **C-PM-4 timing signal:** The end-of-day closure prompt requires knowing when the user's last scheduled activity ends. Is that time available as a computed property today, or does building C-PM-4 require new infrastructure? The answer determines whether this is a sprint-sized item or a quarter-sized one.
