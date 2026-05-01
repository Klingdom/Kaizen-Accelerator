# UX Today Columns Refactor — Analytics Measurement Spec

Owner: analytics-agent
Status: v1.0 — written against Iter 21 event catalog (38 events), UX_TODAY_V2_ANALYTICS.md,
ARCHITECTURE_DELTA_E19_E21.md §4, and CCC proxy test Today.ccc.test.js.

Refactor in scope: KEEP `.sa-when`, `.sa-bucket-chip`, `.sa-name`, `.sa-duration` /
REPLACE `.sa-intention` placeholder with `CatalogEntry.outputArtifact` rendering /
REMOVE `.sa-state-label`.

---

## 1. What We Will Measure to Validate This Refactor

### Primary KPI

**Median time from `TodayPageViewed` to first user action (comprehension speed proxy)**

Definition: `first_action.timestamp − TodayPageViewed.timestamp` in seconds, taken
at the median (p50) across all sessions on days with an existing PROPOSED or ACTIVE
composition. "First action" = the earliest of `CycleAccepted`, `EditDrawerOpened`,
or `ActivityStarted` in the same session.

Rationale: The Iter 20 latency target is <10s comprehension. The column refactor
removes a noisy `.sa-state-label` string and replaces an uninformative placeholder
with a concrete expected output name. If this improves scanability, the comprehension
clock should drop. This is the only KPI that directly tests the hypothesis that
showing `outputArtifact` reduces cognitive load versus showing "PROPOSED / ACTIVE"
state labels.

Source events: `TodayPageViewed` (Iter 21, now live), `CycleAccepted`,
`EditDrawerOpened` (Iter 21, now live), `ActivityStarted`.

Currently computable: YES for the first time — Iter 21 added both anchor events.
Baseline collection started at Iter 21 deploy. Clock is running.

---

### Secondary KPI 1 — Output artifact filed rate at close

Definition: `ActivityCompleted` events where `outputArtifactRef` is non-null and
non-empty, divided by all `ActivityCompleted` events, per calendar week.

The current `ActivityCompleted` payload (verified in `ActivityService.js` lines
380–385) already carries `outputArtifactSchema`. A non-null schema confirms an
artifact was actually filed, not just acknowledged. This fraction measures whether
surfacing the expected output in the row — rather than hiding it behind a
placeholder — increases the rate of users delivering the expected artifact at
close.

Hypothesis: making the expected artifact name visible during the day sets a
completion contract. Users who see "1 Pager" next to their activity name are more
likely to produce a 1 Pager by close than users who saw "One line: what outcome by
close?" (the placeholder being removed).

Currently computable: YES, with the caveat below in §3.

---

### Secondary KPI 2 — Edit-drawer engagement rate

Definition: `EditDrawerOpened` / `TodayPageViewed` per session, on sessions where
the composition was PROPOSED at page view time.

Rationale: removing `.sa-state-label` eliminates a text element ("PROPOSED",
"ACTIVE", "IN_PROGRESS") that was visually noisy but analytically inert — no events
were keyed to it. If the label was adding cognitive friction that made users feel
the plan was complex and needed editing, its removal should reduce unnecessary
drawer opens. If it was providing orientation cues, removal should not increase
drawer opens. Either direction is informative.

This KPI also directly measures the Iter 20 <60s update-and-start target's edit
path: fewer unnecessary drawer opens means shorter median update-and-start time
on accept-only sessions.

Currently computable: YES — both events are live as of Iter 21.

---

## 2. New Events to Add

**Proposal: 1 new event — `RowOutputClicked`**

Justification: the refactor replaces the `.sa-intention` placeholder with a
rendered `CatalogEntry.outputArtifact` element. If the team makes this element
clickable (to open `OutputArtifactDialog` before the activity is closed), a
`RowOutputClicked` event would tell us whether users engage with the expected
output proactively during planning vs. only at close. This informs whether the
column change changes workflow timing, not just page comprehension.

Payload:
```
{
  userId: string,
  scheduledActivityId: string,
  catalogEntryId: string,
  outputArtifactSchema: string,       // 'DOCUMENT' | 'TEXT' | 'NUMERIC' | 'TWO_LIST'
  activityState: string,              // 'PROPOSED' | 'IN_PROGRESS'
  clickedAt: string                   // ISO from services.clock.now()
}
```

Condition to add: only if `outputArtifact` rendering is made interactive. If the
output column is display-only in this iteration, hold the event — there is nothing
to click and the event would never fire.

**Proposal: do NOT add `OutputArtifactColumnViewed`**

This event would fire on every page load for every row. It adds volume with no
actionable decision. The secondary KPI 1 (filed rate at close) already measures
the behavioral outcome we care about. Column impression data is not needed to
evaluate this refactor.

Net new events: 0 unconditionally, 1 conditionally (`RowOutputClicked` if column
is made interactive).

---

## 3. Event Payload Changes — `ActivityCompleted`

**Current payload** (ActivityService.js lines 380–385):
```
{ scheduledActivityId, compositionId, actualEndAt, outputArtifactSchema }
```

**Recommended addition:**

Add `producedExpectedOutput: boolean` to the `ActivityCompleted` payload.

Definition: `true` if the `outputArtifactRef` filed at close matches the
`CatalogEntry.outputArtifact.schema` for this activity's catalog entry. `false` if
the user filed a different schema or if the ref is empty/ad-hoc.

Rationale: the refactor's hypothesis is that showing the expected output name
on the row drives users to produce the expected artifact, not just any artifact.
Without this boolean, secondary KPI 1 can only measure "was anything filed" — not
"was the expected thing filed." The distinction matters: a user who sees "C&E Matrix"
on the row and files a Text note has still not fulfilled the catalog contract.

Implementation note: ActivityService.close() already receives the `outputArtifactRef`
and has access to the activity's `catalogEntryId`. Looking up `catalogEntry.outputArtifact.schema`
and comparing to `ref.schema` is a single equality check. The lookup requires passing
a catalog read capability into ActivityService, which it may not currently have. Flag
this to the backend engineer before adding to the payload.

If the lookup is deferred, add `outputArtifactSchema` (already present) plus a new
`expectedArtifactSchema: string | null` field populated from the CatalogEntry.
The consumer can then compute the match downstream without service coupling.

---

## 4. Baseline Preservation — Timing Risk Analysis

Iter 21 ships `TodayPageViewed` and `EditDrawerOpened`. Baseline collection started
at Iter 21 deploy (today, 2026-04-30). The 14-day baseline window closes approximately
2026-05-14.

**If this column refactor ships before 2026-05-14, the baseline is confounded.**

The comprehension-speed primary KPI is computed from `TodayPageViewed` as the anchor.
If the Today page layout changes mid-window, the before and after distributions are
not comparable within the same window. The pre-refactor sessions have `.sa-state-label`
visible and `.sa-intention` as a placeholder. Post-refactor sessions have neither.
Mixing them into one "baseline" produces a meaningless distribution.

**Recommendation: split the dashboard — pre-refactor cohort vs. post-refactor cohort.**

Rationale for split over wait or reset:

- Wait (~14 days): delays a layout change that may be low-risk and UX-beneficial.
  Acceptable if the team is disciplined, but the 14-day window is likely to slip given
  sprint velocity, making the wait constraint hard to enforce.

- Reset: throws away the Iter 21 data collected so far. If Iter 21 just deployed,
  this is relatively low cost today, but the reset has to be honored operationally —
  any future refactor would trigger the same debate and the baseline would never close.

- Split (recommended): label every session with a `layoutVersion` tag — `v1` for
  pre-refactor, `v2` for post-refactor. Compute comprehension p50 and edit-drawer
  rate separately for each cohort. The v1 cohort becomes the baseline; the v2 cohort
  is the measurement window. This requires no waiting and no data loss. The dashboard
  gain is a clean apples-to-apples comparison even if the refactor ships tomorrow.

Implementation: the simplest split is a feature flag or a deploy-timestamp boundary
written into `TodayPageViewed.layoutVersion` (new optional field). Alternatively,
segment by date at query time using the known deploy date.

---

## 5. Funnel Impact of Removing `.sa-state-label`

**Assessment: analytics-neutral.**

A search of the event catalog (events.js, 38 events) and ActivityService.js finds
no event keyed to the state label text. No event fires when a state label transitions
from "PROPOSED" to "IN_PROGRESS." No funnel step uses the state label value as a
filter or discriminator.

The existing funnel steps (CycleProposed → CycleAccepted → ActivityStarted →
ActivityCompleted → ReflectionCaptured) are keyed to state machine transitions, not
to the rendered label that describes those transitions. Removing the visual label
does not remove any event or break any funnel step.

Conclusion: the state-label removal is a pure display change with zero impact on
any instrumented funnel. No funnel queries need updating. No event joins break.

---

## 6. A/B Testability

**Ship-everyone. Not A/B testable under current infrastructure.**

Reason 1: The app has no A/B routing infrastructure. UX_TODAY_V2_ANALYTICS.md §5
documents the measurement protocol as before-after time-series, not cross-user
cohort. This is a single-user MVP.

Reason 2: The two column changes are not independently valuable. Removing
`.sa-state-label` while keeping `.sa-intention` as a placeholder preserves the
exact noise the refactor is trying to eliminate. The changes are coupled; splitting
them for A/B would require maintaining two rendering branches in
`ScheduledActivityBlock.js` with no cohort to assign to the second branch.

Reason 3: The change is reversible. If the failure signals in §9 fire within the
first 7 days post-ship, the render branch can be rolled back without data loss —
all events are still in the log.

---

## 7. Dashboard Updates Required

| Dashboard / view | Impact | Action required |
|---|---|---|
| Comprehension speed p50/p75 | Gains signal for first time (Iter 21 anchor events now live). If data is split by `layoutVersion`, both cohorts are visible. | Add `layoutVersion` filter. Segment v1 vs v2 cohorts. |
| Edit-drawer engagement rate | Now computable via `EditDrawerOpened` / `TodayPageViewed`. Refactor affects the denominator (same `TodayPageViewed` event, different page layout). | Add cohort filter. First meaningful reads at ~7 days post-Iter21. |
| Output artifact filed rate | Currently computed from `ActivityCompleted.outputArtifactSchema` non-null. Refactor does not change the event; rate should be stable across the transition. | No structural change. Add `producedExpectedOutput` filter when payload addition lands. |
| State-label funnel view | No such view exists — confirmed in §5. | No action. |
| CCC region count (Today.ccc.test.js) | Removing `.sa-state-label` reduces word density per row. The CCC test counts named UI regions, not individual element classes within a row. The CCC score is not directly affected. | Verify CCC test still passes post-refactor. No dashboard change needed. |
| Word density per column | Not currently tracked in the dashboard. The CCC proxy test's 25-word prose limit applies to explainer/recap regions, not to per-row data columns. | If word density monitoring is added, exclude `.sa-name` and `.sa-duration` columns (data-driven; word limit does not apply). |

---

## 8. Success Criteria

| # | Metric | Measurement window | Target delta |
|---|---|---|---|
| 1 | Comprehension speed p50 (TodayPageViewed to first action) | 7–14 days post-refactor vs v1 cohort | Drop ≥15% (e.g., from 9s to ≤7.7s — stays inside the <10s target with margin) |
| 2 | Output artifact filed rate (outputArtifactSchema non-null at close) | 14-day post window vs 14-day pre | Rise ≥10 pp (e.g., from 70% to ≥80%, approaching the §7.3 blueprint target of 80%) |
| 3 | Edit-drawer engagement rate (EditDrawerOpened / TodayPageViewed) | 14-day post window | No increase greater than +5 pp vs pre-refactor baseline (removing state-label should not drive more editing, only faster reading) |
| 4 | CycleAccepted (no-edit) rate | 14-day post window | No drop below pre-refactor rate minus 5 pp (guardrail — if removing state-label confuses users, they will edit or reject more) |
| 5 | `producedExpectedOutput` match rate (if payload addition lands) | First 14-day window post payload change | ≥60% of filed artifacts match the catalog-expected schema within 30 days of surfacing expected output in row |

---

## 9. Failure Signals

| # | Signal | Definition | Threshold | Interpretation |
|---|---|---|---|---|
| 1 | Comprehension speed regression | p50 of TodayPageViewed-to-first-action rises post-refactor | Sustained increase ≥20% vs v1 cohort for ≥5 consecutive days | Surfacing outputArtifact text in the row adds cognitive load rather than reducing it; the label is longer or more distracting than the state label it replaced. Roll back `.sa-intention` replacement and redesign the artifact column as a secondary affordance. |
| 2 | Edit-drawer abandonment rate increase | EditDrawerOpened events that are NOT followed by CycleAccepted or CycleEdited within 5 minutes | Rises ≥15 pp vs v1 cohort | Users are opening the edit drawer more often because they are confused about activity state (previously communicated by the removed state-label). Signals the state-label carried orientation information the refactor assumed it did not. |
| 3 | Output artifact filed rate drops | ActivityCompleted events where outputArtifactSchema is null or empty | Rises (i.e., fewer artifacts filed) by ≥10 pp vs pre-refactor baseline | The `.sa-intention` placeholder, even as "One line: what outcome by close?", was prompting users to think about output earlier in the day. Replacing it with the catalog artifact name may have removed a general intention-setting cue. If artifact-filed rate drops, restore an intention field and treat the artifact column as additive rather than replacing. |
