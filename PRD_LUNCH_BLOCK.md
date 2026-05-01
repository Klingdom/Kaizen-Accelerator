# PRD Addendum — Lunch Block as a Scheduled Activity

Owner: Product Manager Agent
Status: Draft v1.0
Supersedes: `ENGINE_DESIGN.md` line 340 ("[lunch break — not scheduled, capacity-neutral]")
Relates to: `PRODUCT_BLUEPRINT.md`, `ARCHITECTURE.md`, `UX_FLOWS.md`

---

## 1. Problem Statement

Every Daily composition currently shows an unexplained gap from 12:00 to 13:00. The Deep Work block 1 ends before noon, and the post-lunch High-value Communication block begins at 13:00, but nothing in the schedule accounts for the hour in between. Returning users face three concrete problems as a result: (a) they cannot understand why a full hour is missing from the schedule — the system provides no label, no rationale, and no microcopy; (b) they cannot move lunch earlier or later when their day requires it — the gap simply shifts activities around with no mechanism to signal intent; and (c) they cannot replace lunch with a Deep block when doing a working lunch, which means the system has no record of the substitution and cannot measure the pattern as a variance. This directly violates the deliberate-ratification model that is core to BAM-X: every block in the schedule is an explicit, accepted commitment with a named activity behind it. An unexplained gap is the opposite of deliberate ratification. Surfacing lunch as a named, editable, skippable ScheduledActivity resolves all three problems with no impact on the 4-2-2 bucket targets.

---

## 2. User Stories

**US-1 — Gap explanation (returning user)**
As a returning user viewing my Daily composition, I want to see a labeled "Lunch" block from 12:00 to 13:00 so I understand why that hour is not allocated to project, communication, or CI work.

**US-2 — Move lunch (noon meeting user)**
As a user with a meeting or conflicting commitment at noon, I want to drag or adjust the lunch block start time (for example, to 13:00) so my schedule reflects when I will actually take a break.

**US-3 — Skip lunch / working lunch**
As a user choosing to work through lunch, I want to mark lunch as skipped and replace the freed time with a Deep Work block so the system records that I did a working lunch and can surface the pattern as a recurring variance if it happens often.

**US-4 — Resize lunch**
As a user taking a shorter or longer break, I want to resize the lunch block within a sensible minimum and maximum so the schedule reflects my actual break length without me having to rebuild the rest of the day manually.

**US-5 — No capacity side-effect**
As a user, I want lunch to be visible in my schedule without it reducing the minutes available to PROJECT, COMMUNICATION, or CI buckets, so accepting the default lunch block does not require me to remove a standard-work activity to make the 4-2-2 math balance.

---

## 3. Scope

### 3.1 In scope

- A new `CatalogEntry` with `id='ce_lunch'`, `name='Lunch'`, default `startTime=12:00`, `defaultDurationMinutes=60`, `bucket=RECOVERY` (see §7 for architect flag), `isNonOptional=false`, `cadence=DAILY`.
- Auto-insertion of this entry into every new Daily `Composition` by the `ComposerService` between Deep Work block 1 and the post-lunch Communication anchor.
- User ability to move the lunch block start time within a bounded window (11:00–14:00) via the existing Edit mode start-time input.
- User ability to resize the lunch block duration within a bounded range (30–90 minutes) via the existing Edit mode duration control.
- User ability to skip lunch, which emits a `Variance { kind: SKIPPED }` and offers a CatalogPicker prompt to fill the freed slot.
- Telemetry events for move, resize, and skip actions, used to inform whether a future settings toggle is warranted.
- The lunch block renders as a visually distinct `ScheduledActivityBlock` (muted/neutral style to signal it is not standard work) on the `/today` view and the Weekly grid.

### 3.2 Out of scope

- Settings toggle to globally disable the lunch block. Deferred — see §10, C-PM-A.
- Auto-detection of lunch from calendar imports (no calendar integration in MVP). Deferred — see §10, C-PM-B.
- Lunch display on the Weekly view's hour-grid beyond what is already rendered for any ScheduledActivity. No new Weekly-specific UI.
- Multi-meal support (breakfast, afternoon snack, dinner). Not applicable to BAM-X daily rhythm.
- Lunch block affecting shift workers or non-standard workday configurations. Out of scope and noted in §5 (Edge Cases).
- The post-lunch High-value Communication anchor at 13:00. That anchor remains where it is; this PRD only defines the lunch block itself.
- Any new `ActivityKind` or `Variance.kind` enum values. Existing `SKIPPED` and `EDITED_FROM_PROPOSAL` values are used as-is.

---

## 4. Acceptance Criteria

**AC1.** A new Daily `Composition` produced by `ComposerService` contains exactly one `ScheduledActivity` whose `catalogEntryId='ce_lunch'`, with `plannedStartAt` corresponding to 12:00 local time, `plannedDurationMinutes=60`, and `bucket=RECOVERY`.

**AC2.** The lunch `ScheduledActivity` does not contribute minutes to `Composition.bucketMinutes.PROJECT`, `.COMMUNICATION`, or `.CI`. The 4-2-2 invariant check in `InvariantEngine.validateComposition()` excludes `RECOVERY` bucket entries from all three bucket totals.

**AC3.** Accepting a Daily composition that includes the lunch block (without editing it) does not trigger any invariant violation for `DEEP_UNDER_FLOOR`, `COMM_UNDER_FLOOR`, `CI_UNDER_FLOOR`, `PROJECT_OVERPACKED`, `COMM_OVERPACKED`, or `CI_OVERPACKED`.

**AC4.** In Edit mode, the user can change the lunch block's start time to any value within 11:00–14:00 in 15-minute increments. Values outside this window are rejected inline with the message: "Lunch can be scheduled between 11:00 and 14:00."

**AC5.** In Edit mode, the user can resize the lunch block duration to any value within 30–90 minutes in 15-minute increments. Values outside this range are rejected inline with the message: "Lunch duration must be between 30 and 90 minutes."

**AC6.** Moving the lunch start time (any accepted Edit that changes `plannedStartAt` from the default 12:00) emits a `Variance { kind: EDITED_FROM_PROPOSAL, scheduledActivityId: <lunch id>, note: 'Lunch start moved' }`.

**AC7.** Resizing the lunch duration (any accepted Edit that changes `plannedDurationMinutes` from the default 60) emits a `Variance { kind: EDITED_FROM_PROPOSAL, scheduledActivityId: <lunch id>, note: 'Lunch duration changed' }`.

**AC8.** Skipping lunch emits a `Variance { kind: SKIPPED, scheduledActivityId: <lunch id> }` and transitions the lunch `ScheduledActivity` to `state=SKIPPED`. Because lunch is not non-optional (`isNonOptional=false`), no `reasonCodeIfSkipped` is required, and `ComposerService` does NOT add the skipped lunch to tomorrow's `varianceQueue`.

**AC9.** Skipping lunch surfaces a `CatalogPicker` prompt offering to fill the freed slot (30–90 minutes, depending on the original duration) with a configurable activity from the user's enabled catalog entries. Accepting the picker creates a new `ScheduledActivity` in the freed window. Dismissing the picker leaves the window empty (gap is allowed for a non-standard activity).

**AC10.** The lunch block does NOT function as an anchor. Moving, resizing, or skipping lunch does not lock adjacent blocks. The existing cascade-across-gaps behavior of the Edit mode (as defined in `UX_FLOWS.md §4.2`) is unchanged. Blocks after lunch shift in time only if the user explicitly moves them; the system does not auto-cascade across the lunch boundary.

**AC11.** The lunch block is visually distinguishable from PROJECT, COMMUNICATION, and CI blocks in the `/today` view and the Weekly grid. A muted or neutral fill color (not matching the three 4-2-2 bucket colors) and the label "Lunch" are sufficient. Visual design specifies exact styling at build time.

**AC12.** On the `/catalog` view, `ce_lunch` appears as an enabled, non-locked entry. The user can view its detail (procedure: "Take a break away from the desk"). The user cannot delete it (it is a system entry), but `enabledByUser` toggling is permitted (if disabled, the composer skips lunch insertion — architect to confirm feasibility; flagged in §9 OQ-2).

**AC13.** The `BucketStrip` component does not render a RECOVERY bar. The strip continues to show exactly three bars: PROJECT, COMMUNICATION, CI. Lunch minutes are not reflected in any bar.

**AC14.** When the post-lunch High-value Communication anchor is at 13:00 (default) and lunch is at its default 12:00–13:00 position, no collision is reported. The system treats 13:00 as the exact boundary: lunch ends at 13:00, the Comm anchor begins at 13:00.

---

## 5. Edge Cases

**EC-1 — DST transition days.**
On the day clocks spring forward (23-hour day), the composer runs with reduced capacity. Lunch is still inserted at 12:00 local time with its default 60-minute duration. If reduced capacity makes the day infeasible (non-optional set + lunch exceeds available time), the standard `InfeasibleResult` flow applies; lunch is a candidate for the user to skip to restore feasibility because it is not non-optional.

**EC-2 — Partial-day compositions starting after 12:00.**
If a user sets daily capacity to begin at 13:00 or later (e.g., afternoon-only day), the composer must detect that the default lunch slot (12:00–13:00) falls entirely before the composition window and omit the lunch block. No lunch card is inserted. The `ComposerService` applies this rule: `if (compositionStartAt >= lunchDefaultEndAt) omit lunch`.

**EC-3 — Partial-day compositions ending before 12:00.**
If a user's capacity ends at or before 12:00 (e.g., morning-only half-day), the composer omits the lunch block by the same rule: `if (compositionEndAt <= lunchDefaultStartAt) omit lunch`.

**EC-4 — Infeasible compositions.**
If the non-optional activity set already exceeds daily capacity and the composer returns `InfeasibleResult`, lunch is excluded from the infeasible set (it is not non-optional). The `InfeasibleResult.explain` line should not mention lunch. The user's remediation options (raise capacity, skip ceremony with reason, defer non-optional) are unchanged.

**EC-5 — Collision with the post-lunch Comm anchor at 13:00.**
If the user moves lunch to start at 13:00 (maximum allowed start), lunch runs 13:00–14:00 and would overlap the Comm anchor at 13:00. The Edit mode must detect this collision and surface the inline message: "Lunch at 13:00 overlaps the post-lunch Communication block. Move lunch earlier or shorten it." The save is blocked until the conflict is resolved. Note: the post-lunch Comm anchor is out of scope for this PRD; it must not be moved or modified by lunch's edit affordances.

**EC-6 — User resizes lunch such that it ends after 14:00.**
The 14:00 ceiling on lunch start time, combined with the 90-minute maximum duration, means the latest possible lunch end is 15:30. The composer must check that the resized lunch does not overlap the first post-lunch scheduled block. If it does, the Edit mode shows a collision warning analogous to EC-5. The save is blocked; the user must shorten lunch or move the colliding block.

**EC-7 — Shift workers and non-standard schedules.**
The lunch block defaults are calibrated for a standard knowledge-worker day (9:00–17:00). Users on shift schedules, compressed workweeks, or non-standard hours are out of scope for this iteration. The 11:00–14:00 start-time window and 30–90 minute duration bounds are fixed for MVP. A future settings-level lunch preference (C-PM-A) would address this.

**EC-8 — Weekly composer and multi-day impact.**
The Weekly composer generates five Daily compositions. Lunch is inserted independently into each Daily composition. If a user edits lunch on Monday, the remaining days are not affected. Each day's lunch block is independent; there is no "apply to all days" affordance in this iteration (deferred to C-PM-C in §10).

---

## 6. Edit-Mode Interaction Rules

- Lunch is movable within 11:00–14:00 start bounds (15-minute increments only).
- Lunch is resizable within 30–90 minute duration bounds (15-minute increments only).
- Lunch is skippable without a reason code (it is not a non-optional activity).
- Lunch is NOT an anchor. It has no cascade-forcing behavior on adjacent blocks.
- Lunch cannot be replaced via `CatalogPicker` during Edit mode (it is a fixed system entry for this slot). The user's only options are: move, resize, or skip.
- Skipping lunch triggers a secondary offer (via `CatalogPicker`) to fill the freed slot. This offer is optional; the user may dismiss it.
- The drag handle on the lunch block in Edit mode works the same as any configurable block per `UX_FLOWS.md §4.2`. The lock icon is NOT shown (lunch is not non-optional).
- If a reorder drag would move another block into the 12:00–13:00 window while lunch occupies it, the drop is rejected with the standard collision tooltip.
- Cascade behavior: moving lunch does not auto-cascade blocks before or after it. Time gaps are allowed and are consistent with the existing "gaps allowed" behavior in the composer.

---

## 7. Defaults

| Field | Value | Architect flag? |
|---|---|---|
| `id` | `ce_lunch` | No |
| `name` | `Lunch` | No |
| `startTime` | 12:00 local | No |
| `defaultDurationMinutes` | 60 | No |
| `bucket` | `RECOVERY` | YES — see below |
| `isNonOptional` | `false` | No |
| `isAnchor` | `false` | No |
| `cadence` | `DAILY` | No |
| `enabledByUser` | `true` (default on) | No |
| `outputArtifact` | none required | No |

**Architect flag on `bucket=RECOVERY`:** The existing `bucket` enum on `CatalogEntry` is `PROJECT | COMMUNICATION | CI` per `ARCHITECTURE.md §2.2`. `RECOVERY` does not currently exist in that enum. The architect must decide one of three things before implementation: (a) add `RECOVERY` as a fourth enum value with the rule that RECOVERY minutes are excluded from all 4-2-2 calculations; (b) use `null` bucket with a special `isCapacityNeutral=true` boolean flag on `CatalogEntry`; or (c) treat lunch as a `CI` entry with a `capacityNeutral` override. Option (a) is the cleanest semantically and the recommended default, but the architect owns this decision. The PRD's AC2 and AC13 must hold regardless of which option is chosen.

---

## 8. Success Metrics

**BEFORE (baseline, current state):**
- 0% of Daily compositions show a labeled block between 12:00 and 13:00.
- 0% of users can move, resize, or skip the noon break — the affordance does not exist.
- The unexplained gap creates recurring confusion for new users (qualitative signal from sprint retrospectives; not yet formally measured).

**AFTER (target, week 1 post-launch):**
- 100% of newly generated Daily compositions include a lunch card at 12:00–13:00.
- Telemetry target: measure the following in the first 7 days post-launch for all active users:
  - % of users who accept lunch as-is (no edit, no skip).
  - % of users who move lunch (edit start time at least once).
  - % of users who resize lunch (edit duration at least once).
  - % of users who skip lunch at least once.
- Decision rule: if fewer than 10% of users interact with the lunch block (move, resize, or skip) in week 1, the feature is working as a passive informational element and no further investment is warranted in iteration 22. If 20%+ of users interact with it, a settings toggle (C-PM-A) should be promoted from backlog to the iteration 22 queue.

**Leading indicator:**
- Composition acceptance rate (blueprint §7.2) must not decrease after lunch block ships. A drop of more than 3 percentage points would indicate the lunch block is triggering unwanted edits and the defaults should be reconsidered.

---

## 9. Open Questions for User

**OQ-1 — Bucket enum extension.**
`RECOVERY` is not a current value in `CatalogEntry.bucket`. This PRD recommends adding it. The architect needs a decision from Phil before implementation. Preferred answer: add `RECOVERY` as a first-class enum value with the rule that RECOVERY minutes are excluded from 4-2-2 bucket totals. If Phil prefers a simpler `isCapacityNeutral` boolean instead, AC2 is achievable either way.

**OQ-2 — Disabling lunch via the Catalog toggle.**
AC12 allows the user to toggle `enabledByUser=false` on `ce_lunch`, which would suppress lunch insertion by the composer. Is this acceptable behavior for MVP, or should lunch be suppressed only via the explicit skip action on a per-day basis? Allowing the catalog toggle is a softer global disable that sidesteps the need for a settings toggle in MVP; the risk is that users who want to suppress lunch globally may never discover the toggle lives in Catalog rather than Settings.

**OQ-3 — Reflection on lunch.**
Lunch is not a standard-work activity and has no required output artifact. Should closing a lunch block (marking it done) prompt the 60-second reflection sheet, or is lunch reflection-free? This PRD assumes reflection-free (no `Reflection` row created, no output artifact required). Confirm this is acceptable before the architect finalizes the `ScheduledActivity` guards.

---

## 10. Out-of-Scope Items Deferred to Future Iterations

**C-PM-A — Settings toggle: lunch on/off globally.**
Allow the user to disable the automatic lunch insertion from Settings rather than from the Catalog view. Rationale for deferral: week 1 telemetry (§8) will show whether the demand exists. Candidate for iteration 22+ backlog.

**C-PM-B — Calendar-detected lunch suppression.**
When calendar integration ships (Next), detect back-to-back meetings that span 12:00–13:00 and suppress or move the lunch block automatically. Candidate for the calendar integration iteration.

**C-PM-C — "Apply lunch edit to all days this week."**
Allow a user who moves or resizes lunch on one day to propagate that change to the remaining days in the current weekly composition. Candidate for iteration 22+ backlog; requires the Weekly composer to accept a per-activity override signal.

**C-PM-D — Multi-meal support.**
Breakfast block (before 09:00) and afternoon break block (15:00–15:30) as additional RECOVERY catalog entries. Low priority; not part of the BAM standard-work rhythm.

**C-PM-E — Shift worker and non-standard hour support.**
Configurable lunch window (e.g., 11:00–15:00 start range, or suppressed entirely for overnight shifts). Out of scope until a shift-worker persona is formally defined and validated.
