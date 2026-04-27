# Today Page — Product Intent & Job Coverage Review (product-manager lens)

## 1. Stated Jobs

Per canonical artifacts, Today must serve seven jobs:

**J1 — Review and accept a proposed cycle**
UX_FLOWS §2.1: "Accept / Edit / Reject a proposed Daily cycle." The primary morning ritual.
Blueprint §4.1 item 2: composer proposes tomorrow's day; user can Accept / Edit / Reject before save.

**J2 — Execute the day** (start → close with artifact → reflect → skip with reason)
UX_FLOWS §2.2: full start → work → close → output artifact → 60s reflection loop.
Blueprint §4.1 item 4: "60-second reflection at close of each catalog activity."

**J3 — Handle infeasible / first-run / empty states**
Today.js:44-51 (TODAY_COPY enum: FIRST_RUN, EMPTY, INFEASIBLE). UX_FLOWS §2.1 empty-state + error-state.

**J4 — Edit a proposed cycle** (swap activity, adjust duration, change start-time)
UX_FLOWS §2.1 step 2b: Edit opens full-screen composer; drag-to-reorder, CatalogPicker, BucketStrip live.
DELIVERY_PLAN E10-T12, E10-T14.

**J5 — See Now / Up Next**
SCHEDULING_VISION §1.3 core problem: "blank-calendar paralysis." DELIVERY_PLAN Sprint 15 W5: NowPane + UpNextRail shipped.
Today.js:231-251: NowPane + two UpNextRail variants (rail + mobile) conditional on nowIso.

**J6 — Surface adherence + day count + onboarding nudge**
Blueprint §4.1 item 5: "three numbers always visible on login." Blueprint §7.3: leading indicators within first 14 days.
Today.js:133-144: dayBadge + AdherenceDial + FineTuneButton in header; daysSinceSignupHint() on empty state.

**J7 — Link active Kaizen step to today's deep block**
Blueprint §4.1 item 2 + §6.1 JTBD #2: Deep blocks show "part of: [Kaizen title]" sub-label.
Today.js:236-241: kaizenTitleById prop passed to UpNextRail and CycleCard.

---

## 2. Job Coverage Audit

| Job | Currently Supported? | Citation | Gap? |
|---|---|---|---|
| J1 — Accept/Edit/Reject proposed cycle | YES — CycleCard renders Accept/Edit/Reject | Today.js:259-277; UX_FLOWS §2.1 | None |
| J2 — Execute day (start / close / artifact / reflect) | PARTIAL — OutputArtifactDialog + SkipReasonModal present; ReflectionSheet not directly in Today.js | Today.js:23-24, 162-177; E10-T7 | ReflectionSheet is not imported; it fires from activity sub-route, not Today directly. Pending-reflection banner (E6-T7) not visible in Today.js |
| J3 — Infeasible / first-run / empty state | YES — all three branches render with correct copy and AutoPlanButton CTA | Today.js:164-198; TODAY_COPY enum | Infeasible state renders RhythmExplainer before the banner — sequencing may confuse |
| J4 — Edit cycle (swap, duration, start-time) | YES — EditDrawer + FineTuneDrawer both present | Today.js:217-228, 152-160 | None for swap/duration; start-time edit present (Sprint 14) |
| J5 — Now / Up Next | YES — NowPane + UpNextRail (rail + mobile) | Today.js:231-251 | Conditional on `nowIso !== null`; if caller doesn't pass nowIso, J5 silently disappears with no fallback |
| J6 — Adherence + day count + onboarding nudge | PARTIAL — dayBadge + AdherenceDial always in header; hint strip only in empty state | Today.js:133-144, 181-188 | Hint strip absent on active-composition state; day-band coverage stops at day 7+ (no day 14 or day 30 nudge) |
| J7 — Link Kaizen to deep block | YES — kaizenTitleById passed to CycleCard + UpNextRail | Today.js:237-241, 267 | None |

---

## 3. Latent / Missing Jobs (User would expect; page doesn't do)

- **End-of-day reflection prompt.** Blueprint §7.3 requires ≥1 reflection per day for 7 days within day 14. No time-triggered "close out your day" nudge exists on Today. This is C-PM-4 (OPEN, score 12) in the backlog — the highest-impact open PM item.
- **Pending-reflection banner.** UX_FLOWS §2.2 late-reflection edge case specifies a persistent "N reflections pending" banner on /today. E6-T7 defines PendingReflectionBanner but it is not imported or rendered in Today.js.
- **"What changed since I last looked" signal.** If the composer reflowed the day after an earlier visit (Weekly reflow shipped Sprint 15 W5), Today shows no indicator that the schedule has changed. User has no way to spot a reflow without re-reading every block.
- **Visibility of weekly/sprint context.** The weekly Deep-minutes headline lives on /week only (UX_FLOWS §6.4 rule 4). Today shows no "you're at 480/1200 Deep minutes this week" signal — user must navigate away to understand today's contribution to the weekly shape.
- **Composer rationale ("why was this proposed?").** UX_FLOWS §3.3 specifies a "why chip" on each PROPOSED-state ScheduledActivityBlock sourced from composerInputsSnapshot.explain[]. Today.js passes no composerExplain or similar prop to CycleCard. Users accept on faith, not on reasoning.
- **Yesterday/tomorrow navigation.** No affordance to peek at yesterday's closed day or tomorrow's proposal from Today. UX_FLOWS §1.4 routes all date navigation through /week; but a user who lands on Today has no spatial cue to navigate time without switching pages.
- **Today-vs-plan delta visualization.** As the day runs, there is no inline signal of how actual time usage is diverging from planned 4-2-2 (e.g., "you're 40 min short of CI target with 1h left"). BucketStrip tracks this in theory but the live actual-overlay behavior depends on execution flow outside Today.js.
- **Kaizen-overdue nudge on Today.** UX_FLOWS §6.3 rule 2 specifies a red "Remeasurement overdue by N days" chip on Today's side panel when a Kaizen's remeasurement date has passed. Today.js has no kaizen or kaizen overdue prop.
- **Deep block interruption warning.** E10-T14 and UX_FLOWS §6.4 rule 3 specify a confirmation prompt when the user starts a non-Deep block while a Deep block is past its planned start. Today.js delegates all start actions to CycleCard; it is unclear from Today.js alone whether this guard is wired.

---

## 4. Scope Discipline

No clear drift items violate Blueprint §4.1 must-haves. The six components imported (NowPane, UpNextRail, RhythmExplainer, EditDrawer, FineTuneDrawer, AdherenceDial) all trace to a must-have or to a named delivery plan task.

One yellow flag: **RhythmExplainer renders unconditionally on every state** (infeasible, empty, and active-composition paths — Today.js:148-151). The 4-2-2 explainer is an onboarding artifact; showing it on the infeasible path (where the user's immediate job is to fix capacity, not learn the rhythm) creates a competing message. This is not scope drift but a sequencing concern worth raising with UX.

---

## 5. Onboarding & First-Run Coverage

**Day-band implementation (Today.js:67-76, daysSinceSignupHint):**
- Day 0-1: welcome + Auto-Plan callout. Matches Blueprint §7.3 "first day composition" target.
- Day 2-6: "X days in, aim for 5 accepted days." Matches Blueprint §7.3 leading indicator (daily composition rate ≥50% by day 14).
- Day 7+: Friday reflection nudge. Partially matches Blueprint §7.3 (First Weekly Reflection by end of week 2).

**Gaps vs Blueprint §7.3 activation funnel:**
- **Hint strip only fires on empty state** (no activeState). A user who has an accepted day on day 3 never sees "you're 3 days in, aim for 5 this week." The nudge disappears exactly when it's most actionable.
- **No day-14 nudge.** Blueprint §7.4 launch metric is day-14 (7 composed days + 1 Weekly Reflection). There is no nudge at the day-14 boundary that confirms or prompts completion of the launch criterion.
- **No day-30 nudge.** Blueprint §7.5 post-launch metric is 1 validated Kaizen per monthly-active user per month. Nothing on Today prompts the Kaizen close or remeasurement at day 30.
- **RhythmExplainer blocks the primary CTA on infeasible state.** When the composer returns INFEASIBLE, the user's job is to fix capacity. Showing a 4-2-2 rhythm explainer above the infeasible banner adds friction before the user reaches the AutoPlanButton.
- **daysSinceSignupHint is only shown when daysSinceSignup is not null.** If the caller does not pass adherence.daysSinceSignup, the entire hint strip is silently suppressed. The parent must not forget to pass it.

---

## 6. Top 5 Product-Lens Improvements (ranked)

| Rank | Title | Problem | Expected job impact | Effort | Evidence |
|---|---|---|---|---|---|
| 1 | End-of-day reflection prompt | No time-triggered nudge means day-14 reflection rate (≥75%) has no activation driver. The launch metric (Blueprint §7.4) depends on ≥1 reflection per day. | Directly drives J2 (execute day); unlocks J6 (adherence numbers need reflection data). | S | C-PM-4 OPEN backlog; Blueprint §7.3-§7.4 |
| 2 | Wire PendingReflectionBanner into Today | E6-T7 specified and partially built but not imported in Today.js. Pending reflections are silent; late capture goes uncounted. | Closes the gap in J2; restores the "N reflections pending" coaching loop. | S | Today.js missing import; UX_FLOWS §2.2 late-reflection edge case; E6-T7 |
| 3 | Surface composer rationale (why chip) on Today | kaizenTitleById is passed but no composerExplain prop exists. Users accept a proposed day without understanding why blocks were placed. Acceptance rate suffers when users distrust defaults. | Directly drives J1 (accept/edit proposed cycle); Blueprint §7.2 acceptance rate ≥60% target. | S | UX_FLOWS §3.3 why chip; SCHEDULING_VISION §1.2 principle 7 (deterministic, inspectable); Today.js props list |
| 4 | Extend onboarding hints to active-composition state | Hint strip fires only when there is no activeState. Day 3-6 users with accepted plans get no progress nudge. Day-14 and day-30 milestones have no prompts. | Drives J6 (onboarding nudge); closes activation funnel gap vs Blueprint §7.4 launch metric. | S | Today.js:181-188; Blueprint §7.3-§7.5 |
| 5 | Kaizen-overdue signal on Today | UX_FLOWS §6.3 rule 2 specifies a red chip when a Kaizen's remeasurement date has passed. Today.js has no kaizen prop. Users miss the overdue state until they navigate to /kaizen. | Drives J7 (Kaizen link); Blueprint §7.5 (1 validated Kaizen/month) depends on timely remeasurement. | M | UX_FLOWS §6.3 rule 2; Today.js props block lines 79-104 |

---

## 7. Cross-Page Implications

| Page | Primary job | Dominant CTA | Coherent? |
|---|---|---|---|
| Today (`/#today`) | Execute the current day: accept proposal, run activities, close with artifacts | AutoPlanButton (empty) / Start on first block (active) | Yes — CTA matches job when day exists; CTA is clear on empty state |
| Week (`/#week`) | Review the week's rhythm shape; accept/edit the Weekly composition; launch Weekly Reflection | Accept (Weekly composer) / "Start Weekly Reflection" on Friday | Yes per UX_FLOWS §1.1 and §2.3; Deep-minutes headline is the week's primary number |
| Catalog (`/#catalog`) | Enable/disable catalog entries for my role; inspect procedure + output schema | Toggle enabledByUser | Weak — the primary CTA is a toggle, not an action. No clear "you need to do this now" moment |
| Kaizen (`/#kaizen`) | Declare, run, and close one validated Kaizen; capture baseline + remeasurement | "Lock baseline" (DRAFT) / "Capture remeasurement" (ACTIVE) / "Close Kaizen" (IN_REMEASUREMENT) | Yes, state-driven CTAs are correct; however KaizenCard badge (UX_FLOWS §1.4) for IN_REMEASUREMENT is the only nav badge in MVP — good signal |
| InsightsPortfolio (`/#insights/portfolio`) | Review validated Kaizen portfolio; filter and export evidence | CSV Export (per C-PM-2 / Iteration 11 spec) | Mostly coherent but the primary job is read-only browsing; CSV export as the dominant CTA is functionally correct but may over-emphasize data extraction over learning |

**Most-different primary CTA:** Catalog (`/#catalog`) — its dominant interaction is a binary toggle (enable/disable) rather than a flow-initiating action. Every other page has a verb-forward CTA (Accept, Start, Close, Export) that advances the user through a named job. Catalog's CTA is maintenance, not execution.

---

## 8. Acceptance Criteria for "Today is Job-Complete"

- Given a user on day 0-1, when Today loads with no activeState, then the FIRST_RUN copy and AutoPlanButton are visible, a "Day 1" badge is shown, and the onboarding hint strip renders above the empty state.
- Given an accepted Daily composition, when the user opens Today, then the NowPane and UpNextRail are visible (requires nowIso to be passed by the caller), the first non-closed block has a visible Start button, and the AdherenceDial shows three numbers or an appropriate empty-state message.
- Given a proposed Daily composition, when the user opens Today, then each PROPOSED-state activity block shows a "why chip" sourced from composerInputsSnapshot.explain[] and tapping it reveals the rationale without blocking the Accept flow.
- Given one or more activities closed without a reflection, when the user views Today, then a PendingReflectionBanner is visible naming the count and linking to the ReflectionSheet for the oldest pending activity.
- Given it is end-of-day (e.g., after 4:00 PM local) and at least one activity was closed today, when the user views Today, then an end-of-day reflection prompt is surfaced as a non-blocking nudge with a direct link to any pending ReflectionSheets.
- Given the composer returns INFEASIBLE, when Today renders, then the InfeasibleBanner and capacity-adjustment guidance appear before (above) the RhythmExplainer so the fix path is not obscured.
- Given a user with an active Kaizen whose remeasurement date has passed, when Today loads, then a Kaizen-overdue chip is visible on Today (not only on /kaizen) with a direct link to remeasurement capture.
- Given a user with an accepted composition on day 3-6, when Today loads, then an in-context progress nudge ("You're 3 days in — aim for 5 accepted days this week") is visible even though activeState is not null.

---

## 9. Open Questions for Phil

1. **nowIso ownership.** Today.js renders NowPane and UpNextRail only when `nowIso` is passed. Is the parent (app.js) currently passing a live clock value, or is nowIso sometimes null in production? A null silently removes J5 (Now/Up Next) from the page with no fallback message.

2. **PendingReflectionBanner wiring.** E6-T7 specified a `PendingReflectionBanner` component. Is this built and just not imported into Today.js, or is it not yet built? The distinction changes whether the fix is a one-line import or a new build task.

3. **Onboarding hint band at day 14/30.** Blueprint §7.4 (launch metric) and §7.5 (post-launch metric) have specific day-14 and day-30 criteria. Should the daysSinceSignupHint function be extended to cover these milestones, or is a separate activation campaign (email, push) the intended vehicle?

4. **Composer rationale prop contract.** UX_FLOWS §3.3 requires the why chip to source from `composerInputsSnapshot.explain[]` matched to a scheduledActivityId. Does CycleCard currently receive and render this data, or is the prop not yet threaded through from Today to CycleCard?

5. **Kaizen-overdue on Today vs /kaizen only.** UX_FLOWS §6.3 rule 2 says the overdue chip is on "Today's side panel." Was this descoped to /kaizen only, or is it intended to appear on Today and just not yet wired? If it belongs on Today, what prop shape does the caller need to provide?
