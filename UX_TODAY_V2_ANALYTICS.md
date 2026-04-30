# Today Page v2 — Analytics Lens (vs <10s + <60s targets)

Sources: ARCHITECTURE.md §6.1, PRODUCT_BLUEPRINT.md §7.x, UX_REVIEW_TODAY_ANALYTICS.md,
IMPROVEMENT_BACKLOG.md (C-AN-1 OPEN), js/ui/pages/Today.js.

---

## 1. How to Actually Measure the Latency Targets

### <10s comprehension — "page-paint-to-first-meaningful-action"

Proxy metric: **time from `TodayPageViewed` to the first of `CycleAccepted`,
`CycleRejected`, `EditDrawerOpened`, or `ActivityStarted`**.

- `TodayPageViewed` does not exist today (C-AN-1, OPEN). It is the required
  anchor; without it this metric cannot be computed at all.
- "First meaningful action" = the user did something with the plan, not just
  hovered. Scrolling is excluded; it emits no event and signals nothing.

Formula:
```
comprehension_seconds =
  (first_meaningful_action.timestamp - TodayPageViewed.timestamp) / 1000
```

Target: median ≤ 10s per session on days with an existing composition.
Guard: exclude first-run (isFirstRun=true) sessions where no plan is present —
those sessions are onboarding, not comprehension.

### <60s update-and-start

Start event: `TodayPageViewed` (new — see §2).
Stop event: `ActivityStarted` for the first activity on that composition.

But "update" must be distinguished from "accept-as-is":
- Accept path: `TodayPageViewed` → `CycleAccepted` → `ActivityStarted`
- Edit path: `TodayPageViewed` → `EditDrawerOpened` (new) → `SwapCompleted`
  (new) → `CycleAccepted` → `ActivityStarted`

Formula:
```
update_and_start_seconds =
  (ActivityStarted.startedAt - TodayPageViewed.timestamp) / 1000
```

Target: p75 ≤ 60s on accept-path; p75 ≤ 90s on edit-path (editing has
irreducible cost). Both paths must be segmented or the single 60s target is
misleading.

---

## 2. Existing Event Coverage Gaps for Latency Tracking

All events below are NEW (not in ARCHITECTURE.md §6.1):

| Gap | Missing event | Why it blocks latency measurement |
|---|---|---|
| Page anchor | `TodayPageViewed` | No t=0; neither formula computes |
| Edit session start | `EditDrawerOpened` | Cannot segment accept vs edit path |
| Swap action | `SwapCompleted` | Cannot measure edit-step cost |
| First start | `FirstActivityStarted` | Convenient shortcut; derivable from `ActivityStarted` + session rank but fragile |
| Comprehension action | No dedicated "plan reviewed" signal | Must infer from first action; noisy |

Existing §6.1 events that ARE present and usable:
- `CycleAccepted` — stop event for accept path (minus the ActivityStarted gap)
- `CycleEdited` — confirms edit occurred but carries no timing inside the edit session
- `ActivityStarted` — stop event for both paths once `TodayPageViewed` is added
- `CycleProposed` — upstream anchor (composer side, not user side)

---

## 3. Funnel Definition for Latency Measurement

The 60-second funnel with latency budget per step:

| Step | Description | Event | Budget | Currently instrumented |
|---|---|---|---|---|
| 1 | Page paint | `TodayPageViewed` (NEW) | 0s (anchor) | NO |
| 2 | First eye scan / plan read | proxy: no scroll event; infer from dwell before action | ≤10s | NO |
| 3a | Accept decision | `CycleAccepted` | ≤20s from paint | YES (no paint anchor) |
| 3b | Edit decision | `EditDrawerOpened` (NEW) | ≤15s from paint | NO |
| 4 | (edit path only) Swap / change completed | `SwapCompleted` (NEW) | ≤30s from drawer open | NO |
| 5 | Accept after edit | `CycleAccepted` | ≤10s from swap | YES (no edit context) |
| 6 | First activity started | `ActivityStarted` | ≤10s from accept | YES |

Budget slice logic: steps 1→3 must land within 10s for comprehension target;
steps 1→6 must land within 60s for update-and-start target on the accept path.
Edit path (steps 1→3b→4→5→6) realistically needs ≤90s — the spec should
split the single 60s into path-conditional targets or the edit path will always
appear to fail.

---

## 4. Pre-Redesign Baseline

Without baseline data, v2 cannot claim it won either target. These events MUST
be captured for at least **14 calendar days** before v2 ships (14 days matches
the §7.4 launch-metric window and provides two full Mon–Fri cadence cycles):

| # | Event / metric | Why required | Currently capturable? |
|---|---|---|---|
| 1 | `TodayPageViewed` with `compositionState` | Establishes t=0; without it the latency timers cannot start | NO — must add |
| 2 | `CycleAccepted` timestamp relative to `CycleProposed` | Accept-delay distribution (p50, p75, p90) | PARTIAL — `CycleAccepted` exists; `proposedAt` missing from payload (gap from prior review) |
| 3 | `ActivityStarted` timestamp on first start of day | Stop event for update-and-start | YES |
| 4 | `CycleEdited` count and `editedActivityIds.length` | Edit-session depth; distinguishes swap vs timing tweak | YES |
| 5 | `EditDrawerOpened` with timestamp | Edit-path start anchor | NO — must add |
| 6 | `CycleRejected` rate | Guardrail: v2 must not increase rejections | YES |
| 7 | `ComposerInfeasible` rate | Guardrail: comprehension failure on infeasible state | YES |

Items 1 and 5 must be instrumented before the baseline window starts — the
rest are already capturable from §6.1 events.

---

## 5. Experiment Framework for v2

No A/B infrastructure; single-user MVP. Method: **before-after time-series
with equal-length windows**.

Protocol:
1. Instrument items 1 and 5 from §4 above. Start the baseline clock.
2. Run baseline for 14 days. Capture p50 / p75 / p90 of both latency formulas
   from §1. Lock these as the "pre-v2" numbers.
3. Ship one v2 change. Apply 3-day novelty-effect exclusion window post-ship.
4. Run the post-ship window for 14 days (same length as baseline).
5. Compare p75 of each latency formula. Declare improvement if p75 drops by
   ≥10s on comprehension or ≥15s on update-and-start without a guardrail
   regression (see guardrails below).

Ship incrementally: each v2 sub-change (NowPane prominence, UpNextRail
deduplication, WhyThisPlan expand behavior) gets its own 14-day post-window.
Do not bundle multiple v2 changes into a single post-ship window — the signal
is unattributable.

Guardrail metrics (must not regress vs baseline):
- `CycleAccepted` (no-edit) rate — must not drop >5 pp
- `ReflectionCaptured.onTime` rate — must not drop >5 pp
- `CycleRejected` rate — must not rise >5 pp

---

## 6. KPI Dashboard for Daily Latency

| KPI | Definition | Source events | Currently computable |
|---|---|---|---|
| Comprehension time p75 | p75 seconds from `TodayPageViewed` to first meaningful action | `TodayPageViewed` (NEW), `CycleAccepted` / `EditDrawerOpened` / `ActivityStarted` | NO — needs `TodayPageViewed` |
| Accept-path update-and-start p75 | p75 seconds from `TodayPageViewed` to `ActivityStarted` on accept-only sessions | `TodayPageViewed` (NEW), `CycleAccepted`, `ActivityStarted` | NO — needs `TodayPageViewed` |
| Edit-path update-and-start p75 | Same formula filtered to sessions with `EditDrawerOpened` | `TodayPageViewed` (NEW), `EditDrawerOpened` (NEW), `CycleAccepted`, `ActivityStarted` | NO — needs both new events |
| Accept delay p75 | Seconds from `CycleProposed` to `CycleAccepted` | `CycleProposed`, `CycleAccepted` (needs `proposedAt` in payload) | PARTIAL |
| Edit-session depth | Mean `editedActivityIds.length` per `CycleEdited` | `CycleEdited` §6.1 | YES |
| Rejection rate | `CycleRejected` / (`CycleProposed` + `CycleRejected`) | `CycleRejected`, `CycleProposed` §6.1 | YES |
| First-start rate | % accepted compositions where `ActivityStarted` fires same calendar day | `CycleAccepted`, `ActivityStarted` §6.1 | YES |
| Infeasible rate | `ComposerInfeasible` / (`CycleProposed` + `ComposerInfeasible`) | `ComposerInfeasible` §6.1 | YES |

Four of eight KPIs require new events. The four that are computable today
provide guardrails while the new events are being instrumented.

---

## 7. Top 5 Analytics-Lens Improvements (ranked)

| Rank | Title | Instrumentation | Decision it unblocks | Effort |
|---|---|---|---|---|
| 1 | Add `TodayPageViewed` (C-AN-1) | New event; payload: `{ userId, compositionState, isFirstRun, timestamp }` | Unlocks both latency formulas; enables top-of-funnel conversion; required before any v2 baseline | S |
| 2 | Add `EditDrawerOpened` / `EditDrawerClosed` | New events on EditDrawer mount/unmount; payload: `{ compositionId, timestamp }` | Splits accept-path vs edit-path latency; lets team attribute 60s budget correctly | S |
| 3 | Add `SwapCompleted` with timing | New event inside edit-mode swap action; payload: `{ compositionId, fromActivityId, toActivityId, elapsedMsInDrawer }` | Identifies whether the drawer interaction itself is the bottleneck in the edit path | S |
| 4 | Add `proposedAt` to `CycleAccepted` payload | One-field addition to ComposerService.accept(); no new event | Accept-delay KPI becomes computable without event join; required for "before 09:00" daily composition rate (blueprint §7.3) | XS |
| 5 | Add `NowPaneImpression` with `activityId` | Fire when NowPane renders with a non-null current or upcoming activity | Measures whether NowPane reduces comprehension time (users who see current activity in NowPane should start faster — testable with before-after on comprehension p75) | S |

---

## 8. Open Questions for Phil

1. **Path-conditional targets:** The <60s update-and-start target applies to
   both accept-only sessions and edit sessions, but edit sessions have
   irreducible cost (opening drawer, swapping, saving). Should the target be
   formally split into two thresholds — e.g., <40s accept, <90s edit — before
   the baseline window opens, so the team is measuring against the right number?

2. **`TodayPageViewed` fire condition:** Today.js is a pure render function;
   there is no mount lifecycle hook in the current vanilla-JS architecture.
   Which layer owns firing this event — app.js on route change, or a new
   mount callback in the Today component — and does that decision affect the
   accuracy of t=0 (paint vs route-resolved)?

3. **C-AN-1 priority:** C-AN-1 is ranked #3 OPEN in IMPROVEMENT_BACKLOG.md but
   it blocks the entire latency measurement framework in this spec. Should it be
   promoted to P0 before any v2 UI changes ship, or will v2 ship without
   baseline latency data and rely on qualitative signals only?

4. **NowPane / UpNextRail duplication (C-UX-7 OPEN):** The same upcoming
   activity renders in both surfaces simultaneously. Any comprehension-time
   metric will conflate "user read the NowPane" with "user read the UpNextRail."
   Does the deduplication fix land before or after the baseline window closes,
   and should sessions with the duplicated state be excluded from the baseline
   sample?
