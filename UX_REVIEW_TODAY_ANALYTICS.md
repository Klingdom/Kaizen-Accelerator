# Today Page — Measurement, Events & KPI Review (analytics lens)

Analytics agent output for parallel UX review. Sources: PRODUCT_BLUEPRINT.md §7.x,
ARCHITECTURE.md §6.1, js/events/events.js, js/services/ComposerService.js,
js/services/ActivityService.js, js/services/ReflectionService.js,
js/services/FrictionService.js, IMPROVEMENT_BACKLOG.md (C-SA-2, C-PM-4).

---

## 1. Stated Success Metrics

All from PRODUCT_BLUEPRINT.md. Directly relevant to Today:

- **Launch metric (§7.4):** % of day-14 users who accepted/edited ≥7 Daily cycles,
  captured ≥1 reflection on each of those 7 days, and completed 1 Weekly Reflection.
  Target ≥35%.
- **Composition acceptance rate (§7.2):** ≥60% of proposed Daily cycles accepted
  without edit within the first 90 days.
- **Reflection rate (§7.2):** ≥75% of completed catalog activities have a reflection
  captured within 15 minutes of close.
- **Daily composition rate (§7.3):** ≥50% of working days have a composed 4-2-2 day
  accepted or edited before 09:00 local by day 14.
- **Intention/output completeness (§7.3):** ≥80% of scheduled activities have a
  declared intention and captured output artifact at close by day 7.
- **Friction signal capture (§7.3):** ≥3 friction signals logged in week 1.

Blueprint note (§Handoffs to analytics): "instrument the six leading indicators in
§7.3 before shipping; the launch metric in §7.4 is computed from them. The
composition acceptance rate must be instrumented per cycle type."

---

## 2. Existing Event Coverage

Source: ARCHITECTURE.md §6.1 and js/events/events.js (36 named events total).

Events relevant to Today page interactions, with fire status verified by grep:

| Event | Fires today? | Emitter |
|---|---|---|
| `CycleProposed` | YES | ComposerService (composeDaily) |
| `CycleAccepted` | YES | ComposerService.accept() |
| `CycleEdited` | YES | ComposerService (editedActivityIds payload) |
| `CycleRejected` | YES | ComposerService |
| `CompositionStarted` | YES | (clock tick, not user action) |
| `CompositionClosed` | YES | ComposerService |
| `ActivityStarted` | YES | ActivityService.start() |
| `ActivityStartedLate` | YES | ActivityService.start() co-emit |
| `ActivityCompleted` | YES | ActivityService.close() |
| `ReflectionStubbed` | YES | ReflectionService (auto-stub on ActivityCompleted) |
| `ReflectionCaptured` | YES | ReflectionService.capture() |
| `VarianceLogged` | YES | VarianceService (on skip of non-optional) |
| `FrictionSignalCaptured` | YES | FrictionService.capture() |
| `CycleReflowed` | YES | ComposerService.reflow() |
| `ComposerInfeasible` | YES | composeDaily |

**NOT fired from Today interactions:**
- `ActivitySkipped` — does not exist as a distinct event; skip routes to `VarianceLogged`
  (kind=SKIPPED_NON_OPTIONAL). No event for skipped *optional* activities.
- No `CompositionViewed` or `AutoPlanButtonClicked` — page-load and CTA engagement
  are invisible to the event log.
- No `EditDrawerOpened` / `EditDrawerClosed` — edit-session start/end have no event.
- No `ReflectionDismissed` — user closing the reflection prompt without capturing is
  silent; reflection rate denominator depends on ReflectionStubbed count, not prompt
  exposure count.

---

## 3. Funnel Definition

Today user-day funnel with event coverage and blockers:

| Step | Description | Event that fires | Conversion KPI | Gap/Blocker |
|---|---|---|---|---|
| 1 | Page load | NONE | n/a | No `TodayPageViewed` event; can't compute step-1 denominator |
| 2 | Auto-Plan triggered | NONE | % of page-loads → compose attempt | `AutoPlanButtonClicked` not instrumented |
| 3 | Composition PROPOSED | `CycleProposed` | % of attempts → proposal | Computable |
| 4 | Edit (optional) | `CycleEdited` | % of proposals edited before accept | Computable |
| 5 | Composition ACCEPTED | `CycleAccepted` | % of proposals accepted | Computable; payload carries `edited: boolean` |
| 6 | First activity STARTED | `ActivityStarted` | % of accepted days → first start | Computable |
| 7 | First activity CLOSED with artifact | `ActivityCompleted` | % of starts → close with artifact | Computable; payload lacks `actualDurationMinutes` (blueprint §6.1 specifies it, ActivityService.close() does NOT include it — verified grep) |
| 8 | Reflection captured | `ReflectionCaptured` | % of closes → reflection within 15 min | `onTime` boolean present; absolute timestamp gap exists (no `capturedAt` vs `closedAt` delta in payload) |
| 9 | EOD: ≥1 reflection on day | Derived from `ReflectionCaptured` count per compositionId | Daily reflection rate | Computable from stored data but no EOD event fires |

Funnel is broken at steps 1 and 2: without page-load and CTA-click events, the
top-of-funnel drop rate is invisible.

---

## 4. KPIs to Track

| # | KPI | Definition | Source event(s) | Currently computable? |
|---|---|---|---|---|
| 1 | Day-14 activation rate | % signups who hit §7.4 threshold by day 14 | `CycleAccepted` + `ReflectionCaptured` + `WeeklyReflectionCompleted` | N — page-load denominator missing |
| 2 | Daily composition acceptance rate | % proposed Daily cycles accepted (no edit) per user per week | `CycleAccepted` (edited:false) / `CycleProposed` | Y |
| 3 | Daily composition edit rate | % proposed cycles edited before accept | `CycleEdited` / `CycleProposed` | Y |
| 4 | Daily composition rejection rate | % proposed cycles rejected | `CycleRejected` / `CycleProposed` | Y |
| 5 | Accept delay | Median minutes from `CycleProposed` to `CycleAccepted` per user-day | `CycleAccepted` vs `CycleProposed` timestamps | N — `CycleAccepted` payload carries no `composedAt` or `proposedAt` |
| 6 | Activity reflection rate (on-time) | % `ActivityCompleted` events followed by `ReflectionCaptured` within 15 min | `ReflectionCaptured.onTime` | Y (boolean exists) |
| 7 | Friction signal density | Friction signals per accepted day | `FrictionSignalCaptured` / `CycleAccepted` | Y |
| 8 | Start-on-time rate | % activities started within 5 min of planned start | `ActivityStartedLate` absence / `ActivityStarted` count | Y (via ActivityStartedLate) |
| 9 | Infeasible rate | % compose attempts returning infeasible | `ComposerInfeasible` / (`CycleProposed` + `ComposerInfeasible`) | Y |
| 10 | Edit-session depth | Mean number of edits per `CycleEdited` event (editedActivityIds.length) | `CycleEdited.editedActivityIds` | Y — payload exists |

---

## 5. Instrumentation Gaps

Gaps ordered by KPI impact:

1. **No `TodayPageViewed` event.** The funnel has no step-1 denominator. Cannot compute
   page-load → propose conversion or measure whether a UX redesign drives more compose
   attempts. Required payload: `{ userId, compositionState: 'EMPTY'|'PROPOSED'|'ACTIVE', isFirstRun: boolean }`.

2. **No `AutoPlanButtonClicked` event.** Today.js renders `AutoPlanButton` as the
   primary CTA in both empty-state and infeasible-state paths. Clicks are invisible.
   Required payload: `{ userId, triggerContext: 'FIRST_RUN'|'EMPTY'|'INFEASIBLE'|'REPLAN' }`.

3. **`CycleAccepted` missing `acceptDelay = proposedAt - acceptedAt`.** Blueprint §7.3
   targets "before 09:00 local." The event carries `compositionId` and `userId` but no
   `proposedAt`. The delay KPI requires joining two event timestamps from separate events
   — fragile at MVP scale. Recommended: add `proposedAt: string (ISO)` to `CycleAccepted`
   payload (ComposerService.accept() already has the composition row available).

4. **`ActivityCompleted` missing `actualDurationMinutes`.** ARCHITECTURE §6.1 specifies
   `actualDurationMinutes` in the payload but ActivityService.close() (line 380–385) does
   not include it. Plan-vs-actual duration is a core blueprint metric (§3.2 close-of-day
   reflection) and cannot be computed without it.

5. **`ReflectionCaptured` missing numeric delay.** Payload has `onTime: boolean` but no
   `capturedAt - activityClosedAt` delta. The 15-minute target in §7.2 is binary today;
   the team cannot see whether 15 min is the right threshold or whether users are
   capturing at 5 min vs. 60 min.

6. **C-SA-2 (IMPROVEMENT_BACKLOG): `EDITED_FROM_PROPOSAL` variance rows not written.**
   Duration/start-time edits emit no append-only audit row. This means CycleEdited fires
   but the per-slot detail is lost. Edit-session depth (KPI #10) is understated when
   users make only timing tweaks without swapping activities.

7. **No `ReflectionDismissed` event.** When a user closes the reflection prompt without
   capturing, the stub remains `pending=true` indefinitely. Reflection rate denominator is
   `ReflectionStubbed` count, which conflates "never saw the prompt" with "dismissed."

---

## 6. Pre-Redesign Baseline

**Recommended N: 14 calendar days** (aligns with §7.4 launch metric window; gives two
full work-weeks across Monday–Friday rhythm and Weekly Reflection cadence).

The 5 baseline KPIs that MUST be captured before any redesign ships:

1. Daily composition acceptance rate (no-edit) — per user, per day
2. Daily composition acceptance rate (with-edit) — separate from #1 per blueprint §Handoffs
3. Activity reflection rate (on-time ≤15 min) — per user, per completed activity
4. Infeasible rate — per user, per compose attempt
5. Start-on-time rate — per user, per started activity

Two additional if instrumentation gaps 1–2 above are closed before redesign:

6. Page-load → auto-plan CTA click conversion rate
7. Accept delay (median minutes, p75, p90)

Minimum sample for a detectable signal: 14 days × target active users. With a single-user
MVP (§4 scope), baseline is a before-period time series, not a cross-user sample.

---

## 7. Experiment Framework for the Redesign

**Comparison method:** Before-after with time-series confounder controls. No A/B
infrastructure exists; cohort holdouts are not viable at single-user MVP scale.

Controls needed to avoid confounders:
- Exclude the first 3 days post-ship (novelty effect)
- Hold baseline window and post-ship window to equal length (≥14 days each)
- Flag any sprint boundary crossing the post-ship window (sprint-phase confounds
  acceptance and reflection behavior)

**Minimum-detectable-effect targets per KPI** (using before-after, one-tailed, α=0.10
given small n; exact power requires sample size confirmation at GA):

| KPI | Baseline target | Minimum lift to call "worked" |
|---|---|---|
| Daily composition acceptance rate | ≥60% | +10 pp (to ≥70%) |
| Activity reflection rate | ≥75% | +5 pp (to ≥80%) |
| Start-on-time rate | Unset | -5 pp in late-start rate |
| Infeasible rate | <20% | -5 pp |

**Decision criteria:**
- "Redesign worked": ≥2 of 4 KPIs show lift above MDE with no guardrail regression
- "Redesign was neutral": all KPIs within ±MDE of baseline
- "Redesign hurt": any guardrail KPI (reflection rate, acceptance rate) drops below
  pre-redesign baseline by more than 5 pp for ≥7 consecutive days post-ship

Guardrail metrics (must not regress): reflection rate, acceptance rate, friction signal
density (signals per accepted day — measures whether the redesign suppresses evidence
capture).

---

## 8. Cross-Page Measurement Patterns

| Page | Primary success KPI | Source event |
|---|---|---|
| Today | Daily composition acceptance rate (no-edit) | `CycleAccepted` (edited:false) / `CycleProposed` |
| Week | Weekly composition acceptance rate | `WeeklyCycleAccepted` / `WeeklyCycleProposed` |
| Portfolio (Kaizen) | Kaizen-to-validated-close rate per month | `KaizenClosed` (closeKind) / `KaizenPromoted` |
| Catalog | Catalog-entry enable rate (user enabling/using non-default entries) | No event today — gap |
| Kaizen (detail) | Friction-to-Kaizen promotion rate | `KaizenPromoted` / `FrictionSignalCaptured` |
| InsightsPortfolio | ROI yield: sum(annualBenefitsDollars) on validated closed Kaizens | Derived from `KaizenClosed` + stored Kaizen data |

---

## 9. Top 5 Analytics-Lens Improvements (ranked)

| Rank | Title | Instrumentation delivered | Decision it unblocks | Effort |
|---|---|---|---|---|
| 1 | Add `TodayPageViewed` + `AutoPlanButtonClicked` events | Full top-of-funnel; page-load → propose → accept conversion | Whether UX redesign changes compose-attempt rate, independent of acceptance | S |
| 2 | Add `proposedAt` to `CycleAccepted` payload | Accept delay KPI (#5); "before 09:00" daily composition rate (§7.3) | Whether morning-prompt UX change moves planning earlier in the day | S |
| 3 | Add `actualDurationMinutes` to `ActivityCompleted` payload | Plan-vs-actual duration distribution | Whether schedule display changes (e.g., time-range blocks) reduce duration overrun | S |
| 4 | Add `ReflectionDismissed` event + numeric delay to `ReflectionCaptured` | True reflection prompt conversion rate; threshold tuning for 15-min rule | Whether a redesigned reflection entry point increases capture vs. dismiss | S |
| 5 | Implement C-SA-2: write `EDITED_FROM_PROPOSAL` Variance rows for timing edits | Per-slot edit detail behind `CycleEdited`; restores audit log completeness | Whether UX edits are structural (swap) vs. cosmetic (timing tweak) — affects composer tuning | M |

---

## 10. Open Questions for Phil

1. **Denominator for Day-14 activation rate (§7.4):** The launch metric requires
   "% of signups" but no `UserSignedUp` or `TodayPageViewed` event exists. Is the
   denominator tracked in auth/onboarding infrastructure outside this codebase, or
   does it need an event here?

2. **`actualDurationMinutes` in `ActivityCompleted`:** The spec says it should be in
   the payload (ARCHITECTURE §6.1) but ActivityService.close() does not include it.
   Is this a known gap or a deliberate deferral? It blocks plan-vs-actual as a KPI.

3. **Reflection rate baseline method:** §7.1 notes the baseline is "estimated from
   consulting experience, not a measured customer sample." With no real pre-product
   baseline, the 14-day pre-redesign baseline *is* the product baseline. Should the
   analytics spec treat the first 14 days of MVP as the establishment window (locking
   targets), or run indefinitely until 20 users are on the platform (per §7.1 note)?

4. **Catalog-page event coverage:** No events fire from catalog interactions (enable,
   disable, view). The cross-page KPI for Catalog (#8 above) is currently dark.
   Is Catalog-engagement tracking in scope before the UX redesign ships?
