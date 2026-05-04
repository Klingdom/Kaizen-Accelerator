# UX_TODAY_SIMPLIFY_QA — Today Page Simplification Quality & Risk Assessment

**Scope:** Phase A (UI strip), Phase B (composer rebalance), Phase C (no-projects discovery flow)
**Baseline:** 2,892 tests / 0 failing / 3.31s
**Artifact date:** 2026-04-30

---

## 1. Test Inventory — Components Being Removed

Each row covers isolation tests, Today integration tests, and CSS-selector references.

| Component | Isolation test file | Tests in isolation file | Tests referencing it in Today.test.js | Tests referencing it in Today.ccc.test.js | CSS-selector refs across all test files |
|---|---|---|---|---|---|
| MorningRecap | `tests/ui/components/MorningRecap.test.js` | 18 | 8 (AC10-1 through AC10-5, AC3-11) | 4 (REGIONS registry, PROSE_REGIONS, 2 render fixtures) | ~9 |
| RhythmExplainer | `tests/ui/components/RhythmExplainer.test.js` | 5 | 5 (AC10-5 ordering, AC3-11) | 5 (REGIONS registry, prose word-count, undismissed fixture) | ~8 |
| NowPane | `tests/ui/components/NowPane.test.js` | 19 | 0 (no Today integration test explicitly asserts NowPane output) | 1 (REGIONS registry entry) | ~3 |
| UpNextRail | `tests/ui/components/UpNextRail.test.js` | 25 | 0 (no Today integration test directly) | 2 (REGIONS registry: mobile + rail variants) | ~6 (including bucketMeta.regression.test.js) |
| WhyThisPlan | `tests/ui/components/WhyThisPlan.test.js` | 23 | 7 (AC12-1 through AC12-5, chip not shown guards) | 2 (REGIONS registry, PROSE_REGIONS) | ~9 |
| EodClosureStrip | `tests/ui/components/EodClosureStrip.test.js` | 24 | 12 (AC3-1 through AC3-11) | 2 (REGIONS registry, PROSE_REGIONS) | ~18 |

**Totals at risk from Phase A:** 114 isolation tests + approximately 32 Today integration tests + approximately 12 CCC test references. All of these pass currently and will need to be either deleted or converted to "must NOT render" guards.

---

## 2. Regression Risk Surface — Phase A (Pure UI Strip)

### 2a. User-Visible Information Loss

**NowPane removal** is the highest-impact information loss. NowPane currently emits `aria-live="polite"` on three variants (IN_PROGRESS, UPCOMING, OPEN_TIME), giving screen-reader users real-time activity announcements. Removing it without a replacement means:
- Users lose the current-activity name and elapsed-minutes readout.
- Users lose the "starting in X min" upcoming announcement.
- Screen-reader users have no ambient orientation to the running schedule; they must open the full CycleCard to determine current state.

**UpNextRail removal:** The rail `<aside aria-label="Up next">` is a dedicated keyboard landmark. Keyboard users who Tab into the aside lose a direct shortcut to the next two queued activities. This navigation path disappears with no replacement.

**MorningRecap removal:** The strip carries `role="note"` and an `aria-label` echoing the recap copy. Screen-reader users who rely on the note role for the morning summary will no longer receive it on page load.

**WhyThisPlan removal:** The "why" chip is interactive (`aria-expanded`). Removing it eliminates a keyboard-operable disclosure widget. Users who use it to understand composer rationale have no fallback.

**EodClosureStrip removal:** The EOD CTA (`data-action="EOD_OPEN_REFLECTION"`) is the only surface triggering end-of-day reflection capture. If removed without migration to another surface, reflection capture becomes inaccessible.

**RhythmExplainer removal:** Purely informational; no keyboard interaction. Low user-behavior impact once dismissed.

### 2b. Screen-Reader Announcements Lost

- `aria-live="polite"` on all three NowPane variants (IN_PROGRESS, UPCOMING, OPEN_TIME) — 3 distinct live-region announcements eliminated.
- `role="note"` + `aria-label` on MorningRecap strip.
- `aria-label="Up next"` landmark on UpNextRail aside.
- `aria-expanded` toggle on WhyThisPlan chip.

### 2c. Keyboard Navigation Paths Broken

- Tab order currently includes: header → MorningRecap (non-interactive) → NowPane (non-interactive section) → UpNextRail aside → WhyThisPlan button → CycleCard. After strip, the aside landmark and the WhyThisPlan button disappear from the Tab sequence.
- The `data-action="EOD_OPEN_REFLECTION"` CTA button inside EodClosureStrip is removed. If the button was the only keyboard-reachable EOD action, that flow is broken.

---

## 3. Regression Risk Surface — Phase B (Composer Rebalance)

### 3a. Test Files Asserting Specific Comm/CI/Project Totals

These files contain hard-coded numeric assertions that will fail if the comm budget changes:

| File | Relevant assertions |
|---|---|
| `tests/engine/capacity.test.js` | `COMMUNICATION = 120` at ext=0 (line 26); `COMMUNICATION = 60` at ext=60 (line 43); `COMMUNICATION = 90` at cap=360 (line 51); 7 total COMM value assertions |
| `tests/composer/composeDaily.test.js` | `targets.COMMUNICATION = 120` (line 43); `targets.COMMUNICATION = GOLDEN_EXPECTED_TARGETS.COMMUNICATION` (line 51); `floors.COMMUNICATION = 60` (line 68); `ceilings.COMMUNICATION ~= 150` (line 85); `sums.COMMUNICATION = 60` (line 493); `am.plannedDurationMinutes = 60` (line 154); `post.plannedDurationMinutes = 30` (line 155) |
| `tests/fixtures/goldenDay.js` | `GOLDEN_EXPECTED_TARGETS.COMMUNICATION = 60` (line 267) — used as golden truth in 5 test assertions |
| `tests/engine/canRebucket.test.js` | Comment declares `COMMUNICATION=120` as canonical target; hard-coded `plannedDurationMinutes: 60` for AM_COMM block; `plannedDurationMinutes: 30` for POST_LUNCH_COMM block |

**Current DAILY_NON_OPTIONAL_SET allocates:** Standup=15 + AM_COMM=60 + POST_LUNCH_COMM=30 = 105 min of the COMMUNICATION budget.

Phase B raises COMMUNICATION to 120 min and adds an end-of-deep-cycles anchor. This new anchor is a new entry in `DAILY_NON_OPTIONAL_SET`. The total placed comm minutes will be at minimum 105 + anchor_duration. If anchor_duration = 15, placed = 120. If anchor_duration is larger, `commNeeded > commBudget` triggers proportional shrink on AM and Post, which will cascade failures through the `am.plannedDurationMinutes = 60` and `post.plannedDurationMinutes = 30` assertions.

### 3b. Available-Time Math Impact of End-of-Deep-Cycles Anchor

The new anchor inserts a placed comm block between Deep Work slices. This affects:
- `orderDay.js` partition logic — the new anchor must be classified in `comm` partition, not `deep`.
- Total placed minutes across PROJECT + COMMUNICATION + CI must not exceed `dailyCapacityMinutes`. Any test that sums all activity durations and asserts they equal 480 (or a derived cap) will need recalculation.
- The `remaining.COMMUNICATION` counter is decremented per placed block. Adding a third non-optional COMM block means the remaining budget passed to `pickCommFiller` (STEP 7) shrinks further. Tests asserting specific filler counts will break.

### 3c. INFEASIBLE Rate with Higher Comm Budget

Phase B raises the base COMMUNICATION target. The `computeBucketTargets` formula (`round(120 × scale)`) returns 120 on a full day and 60 on a half day. If Phase B raises the base from 120 to a higher constant, capacity.js must change, and every capacity.test.js assertion becomes stale.

More critically: INFEASIBLE is declared when PROJECT cannot be filled to its floor. Adding a larger mandatory COMM block reduces the PROJECT-available window. For users with significant external meetings, the threshold at which the day becomes INFEASIBLE moves lower.

Test coverage for INFEASIBLE:
- `tests/composer/composeDaily.test.js` lines 568-577: the single INFEASIBLE path test uses an empty catalog. It does not assert anything about the COMM budget being responsible for INFEASIBLE. Phase B could introduce a new INFEASIBLE trigger (high ext + new anchor + raised comm = PROJECT floor not met) with zero test coverage.
- `tests/app.sprint11.test.js` lines 241-259: soft assertion, accepts either INFEASIBLE or error toast. This will survive but does not validate comm-budget-triggered INFEASIBLE.

**Gap:** No test exercises the path where COMM budget growth (not empty catalog) causes INFEASIBLE. This is a new uncovered scenario introduced by Phase B.

### 3d. CI Sacredness Impact on Existing CI Tests

`tests/composer/composeDaily.test.js` lines 390-400 assert CI rotation behavior. If CI is marked sacred via an `isSacred` flag, the skip pathway currently exercised by SkipReasonModal must not fire without confirmation. Any test that skips a CI activity without triggering a confirmation step will need updating.

---

## 4. Regression Risk Surface — Phase C (No-Projects Branch)

### 4a. AutoPlanButton Dependency in Empty State

`tests/ui/pages/Today.test.js` line 37 asserts `html.match(/auto-plan-btn[^"]*primary/)` in the empty state. Lines 103, 112, 117, 128, 138, 141 also assert AutoPlanButton presence in REJECTED, INFEASIBLE, and loading states.

Phase C replaces or supplements the empty-state AutoPlanButton with a ProjectDiscoveryCard when the user has a projectTypeBinding but 0 projects. The branch condition is: `projectTypeBinding !== null && catalog.length === 0 (project entries)`. Tests that expect AutoPlanButton in the empty state will break if the condition is met and AutoPlanButton is replaced rather than supplemented.

`tests/ui/components/AutoPlanButton.test.js` tests the component in isolation (8 tests across idle and loading states) and is unaffected by the Today-level branch change.

### 4b. Minimum Tests Required for ProjectDiscoveryCard

- Renders when `projectTypeBinding` is non-null and project-typed catalog entries = 0.
- Does NOT render when `projectTypeBinding` is null (standard empty state stays).
- Does NOT render when catalog contains at least 1 project entry.
- Renders correct discovery CTA copy matching the bound projectType label.
- AutoPlanButton is absent (or present) per the design decision — this must be specified and tested.
- Discovery card has accessible role and label.
- Renders in INFEASIBLE state: does discovery card also appear or only AutoPlanButton?

---

## 5. CI Sacredness — Validation Strategy

### 5a. If Implemented as isSacred Flag on ScheduledActivity

- Unit test: `composeDaily` output for CI activities carries `isSacred: true` on the relevant block.
- Unit test: the skip-handler in `app.js` reads `isSacred` before opening SkipReasonModal; if true, it must first emit a confirmation dialog (distinct from SkipReasonModal).
- Unit test: after user confirms, SkipReasonModal opens normally.
- Unit test: after user cancels, the activity state remains unchanged.
- Regression guard: existing `tests/ui/pages/Today.sprint5.test.js` line 62 ("renders SkipReasonModal for SKIP dialog") must still pass, verifying non-sacred activities continue unimpeded.

### 5b. If Implemented as UI-Only Confirm Dialog

- Test that `data-action="SKIP"` on a sacred CI activity renders a confirmation modal, not SkipReasonModal directly.
- Test that the confirmation modal contains "This is a sacred CI block" copy or equivalent.
- Test that the existing skip flow for non-CI activities is unaffected (no confirmation modal).
- Integration test: full state machine path — SKIP event on sacred activity → confirm → skip reason → SKIPPED state.

---

## 6. CCC Proxy Test — Phase A Impact

**Current REGIONS registry** (12 entries): header, adherence-dial, morning-recap, rhythm-explainer, now-pane, up-next-mobile, why-this-plan, cycle-card, bucket-strip, cycle-activities, up-next-rail, eod-closure.

**After Phase A removes:** morning-recap, rhythm-explainer, now-pane, up-next-mobile, why-this-plan, up-next-rail, eod-closure = 7 regions removed.

**Projected post-strip count:** 12 − 7 = 5 regions (header, adherence-dial, cycle-card, bucket-strip, cycle-activities).

**CCC test outcome:** The assertion `CCC ≤ 12` will trivially pass at ~5. However, the REGIONS array in `Today.ccc.test.js` (lines 67-80) still lists all 12 entries. Removed entries will score 0 (pattern not found), so the test will not fail — it will silently under-count. This is acceptable as a green signal but the registry should be pruned to prevent false reassurance. The CCC test at ~5 provides no regression value for the stripped page without a tighter lower bound (e.g., assert `CCC >= 4`).

**PROSE_REGIONS check** (lines 91-97): the four prose regions checked for word-count ≤ 25 (rhythm-explainer-copy, morning-recap, eod-closure-strip, why-this-plan-chip) will all return null (region absent). The test skips absent regions. This will not fail but the word-count assertion loses all coverage. The prose-regions array should be updated to any new copy-bearing regions introduced in Phase C (ProjectDiscoveryCard copy).

---

## 7. New Test Coverage Required

**Minimum list, by phase:**

### Phase A

1. `Today renders only header + CycleCard in active-composition state` — assert `html.includes('today-header')` is true; assert `html.includes('morning-recap')` is false; assert `html.includes('now-pane')` is false; assert `html.includes('up-next-rail')` is false; assert `html.includes('why-this-plan')` is false; assert `html.includes('eod-closure-strip')` is false. One test, six assertions.
2. `Today empty state renders header + AutoPlanButton without MorningRecap or RhythmExplainer` — ensures the empty branch is also stripped.
3. `CCC registry pruned to 5 regions and CCC equals 5` — a tighter assertion than the legacy ≤ 12 guard.

### Phase B

4. `DAILY_NON_OPTIONAL_SET contains an end-of-deep-cycles anchor entry` — assert the array has a 4th entry with `slotKind: 'END_OF_DEEP_COMM'` (or equivalent) in the COMMUNICATION bucket.
5. `End-of-deep-cycles anchor is placed after the last Deep Work slice in orderDay output` — positional assertion on the sorted activity list.
6. `COMMUNICATION slot total equals 120 min on a full day at ext=0` — replaces the current AM=60 + Post=30 hard-coded assertions.
7. `AM_COMM + POST_LUNCH_COMM + EOD_COMM minutes sum to commBudget (120 min)` — ensures proportional shrink still fires correctly with 3 anchors.
8. `INFEASIBLE fires when ext=90 and commBudget growth leaves PROJECT below floor` — covers the new INFEASIBLE trigger path.

### Phase C

9. `Today renders ProjectDiscoveryCard when projectTypeBinding is non-null and catalog has 0 project entries` — assert discovery card class present; assert AutoPlanButton absent or present per spec.
10. `Today renders standard empty state (AutoPlanButton only) when projectTypeBinding is null` — regression guard.
11. `Today renders standard empty state when catalog has ≥1 project entry regardless of binding` — ensures the branch condition is correctly gated.

### CI Sacredness

12. `CI activity carries isSacred flag in composeDaily output` — unit test on composer output.
13. `SKIP event on isSacred activity triggers confirmation before SkipReasonModal` — state-machine integration test.

---

## 8. Edge Cases to Test (10+)

1. **User mid-edit during deploy (stale edit state):** `editMode.activities` contains activity IDs that no longer match `activeState.activities` after a background refresh. Stripped Today must handle this without crashing on `selectedActivityId` reference.
2. **Partial day after 12:00 (afternoon-only session):** User opens the app at 13:30. With NowPane removed, there is no ambient "current activity" display. Verify CycleCard correctly highlights or marks activities past their start time without NowPane.
3. **INFEASIBLE with new comm budget:** User has ext=90 min (heavy external day). With raised COMMUNICATION target the remaining PROJECT window may not meet the PROJECT floor. Verify INFEASIBLE state is surfaced and the InfeasibleBanner renders without EodClosureStrip interference.
4. **User with projectTypeBinding but 0 projects, then adds a project mid-session:** Discovery card should disappear on next render; AutoPlanButton or normal empty state returns. Test the state transition.
5. **Project deletion mid-composition:** Active composition references a project catalog entry that is deleted. With WhyThisPlan removed, there is no "why" chip to show stale explain text. Verify CycleCard gracefully handles missing catalog entries.
6. **Lunch-block interaction (still paused):** The POST_LUNCH_COMM block anchors at 13:00. With a new EOD_COMM anchor also in the COMMUNICATION bucket, verify `orderDay.js` still respects the 12:00 lunch pause and does not pack EOD_COMM before 13:00.
7. **EodClosureStrip removal + reflection capture regression:** If EodClosureStrip is the sole surface for `EOD_OPEN_REFLECTION`, removing it must be paired with an alternative trigger. Test that the reflection action remains reachable from the stripped page.
8. **Screen reader user + NowPane removal:** Without `aria-live="polite"` on NowPane, a screen-reader user starting an activity will receive no live announcement. Verify whether CycleCard emits an equivalent live-region update when an activity transitions to ACTIVE.
9. **Phase B: Three COMM anchors + deep slices at cap=360 (6-hour day):** Verify that three COMMUNICATION anchors (AM=54, Post=27, EOD=?) fit within 90 min COMMUNICATION target and that proportional shrink produces non-zero values for each anchor.
10. **Phase B + Phase A interaction: WhyThisPlan removed but composer still emits explain field:** The `explain` field in `composerInputsSnapshot` is still computed. Verify that removing the WhyThisPlan render does not cause a null-reference error if the code path still computes `explainForWhy`.
11. **CI sacredness + skip from EditDrawer:** In Edit mode, a CI activity can be removed from the day. Verify the `isSacred` guard fires in the edit-mode remove action, not just the live SKIP action.
12. **Phase C: user navigates from discovery flow back to Today without completing discovery:** Verify Today renders correctly if `projectTypeBinding` is set but the user bails on the discovery card without adding a project (catalog still empty).

---

## 9. Manual QA Checklist (15 Items)

1. **Phase A smoke — active composition:** Open Today with an active PROPOSED composition. Confirm only the page header, AdherenceDial, and CycleCard render. Confirm no NowPane section, no MorningRecap strip, no UpNextRail aside, no WhyThisPlan chip, and no EodClosureStrip are present in the DOM (inspect element).
2. **Phase A smoke — empty state:** Open Today with no active composition. Confirm AutoPlanButton renders and MorningRecap / RhythmExplainer are absent.
3. **Phase A screen-reader — current activity:** With NowPane removed, use a screen reader (NVDA or VoiceOver) and start an activity. Confirm the screen reader announces the activity start via some mechanism (live region, focus change, or page title update). Document if no announcement fires — this is a defect.
4. **Phase A keyboard — Tab order:** Tab through the stripped Today page. Confirm no phantom Tab stops remain from removed components. Confirm CycleCard activity rows remain Tab-accessible.
5. **Phase B — COMMUNICATION block durations:** After Auto-Plan on a full-capacity (8h) day with ext=0, open the composed schedule and sum all COMMUNICATION activities. Confirm total = 120 min. Confirm the new EOD anchor appears in the list after the last Deep Work block.
6. **Phase B — COMMUNICATION shrink under external drain:** Set ext=60 min. Auto-Plan. Confirm all three COMM anchors (AM, Post-lunch, EOD) are present and their sum does not exceed the COMMUNICATION target.
7. **Phase B — CI cannot be skipped without confirmation:** With a composed day containing a CI block, click Skip on the CI activity. Confirm a confirmation dialog appears before the SkipReasonModal. Confirm clicking Cancel leaves the CI activity in PROPOSED state.
8. **Phase B — INFEASIBLE surfacing:** Set ext=90 min on a standard full-day user. Auto-Plan. If the plan is now INFEASIBLE, confirm InfeasibleBanner renders with actionable suggestions.
9. **Phase C — no-projects branch renders discovery card:** Configure a user with `projectTypeBinding = 'DMAIC'` and an empty project catalog. Open Today. Confirm ProjectDiscoveryCard renders. Confirm the AutoPlanButton is absent (or present per design spec — document the expected behavior).
10. **Phase C — standard empty state preserved:** Configure a user with no projectTypeBinding. Open Today with no active composition. Confirm standard empty state with AutoPlanButton renders; no discovery card.
11. **Phase C — discovery flow completion:** From the ProjectDiscoveryCard, complete the discovery flow and add a project. Return to Today. Confirm the discovery card disappears and Today renders the standard empty state or immediately triggers Auto-Plan.
12. **Phase A + B combined — today page load performance:** With all Phase A components stripped, measure page time-to-interactive. Confirm it remains at or below the pre-strip baseline (no regression from Phase B's additional composer computation).
13. **Regression — EodClosureStrip alternative:** Confirm that the end-of-day reflection capture CTA is reachable from the stripped page. Document the replacement surface. If no replacement exists, flag as a blocker.
14. **Phase B + Phase C combined — no-projects INFEASIBLE state:** Set projectTypeBinding + empty catalog. Auto-Plan. Confirm INFEASIBLE and discovery card do not simultaneously render in a conflicting layout.
15. **Regression — BucketStrip labels:** Open an active-composition Today after Phase A strip. Confirm "Deep Work," "Communication," and "Improvement" bucket strip labels render correctly. Confirm `bucketMeta.regression.test.js` assertions are validated manually by inspecting chip class tokens in the rendered HTML.

---

## 10. Test Count Delta Estimate by Phase

| Phase | Tests to delete (isolation + integration for removed components) | Tests to update (assertions must invert or recalculate) | New tests to add | Net delta |
|---|---|---|---|---|
| Phase A | −114 (isolation) − ~32 (integration in Today.test.js and Today.ccc.test.js) = −146 | ~5 (CCC registry pruning; empty-state guards) | +3 | approximately −138 |
| Phase B | 0 deletions | ~15 (capacity.test.js COMM values; composeDaily.test.js AM/Post durations + filler; goldenDay.js GOLDEN_EXPECTED_TARGETS) | +5 | approximately −10 |
| Phase C | 0 deletions | ~3 (Today empty-state AutoPlanButton assertions conditioned by projectTypeBinding) | +5 | approximately +2 |
| **Total net** | | | | **approximately −146** |

Note: `bucketMeta.regression.test.js` UpNextRail section (4 tests, lines 136-170) must be evaluated — if UpNextRail component is deleted entirely, these tests must be removed. That is included in the −146 isolation count above.

---

## 11. Phase Risk Severity

### Phase A: MEDIUM

Justification: The UI strip is a pure deletion — no logic changes. However, 146 tests are invalidated, the NowPane `aria-live` regions are removed without a stated replacement, and EodClosureStrip carries the sole EOD reflection CTA. The absence of a replacement for these two behavioral surfaces (live announcements + EOD action) makes this MEDIUM rather than LOW. The code change itself is low-risk; the user-behavior impact is moderate. If both accessibility gaps are addressed (CycleCard live region, alternative EOD trigger), severity drops to LOW.

### Phase B: HIGH

Justification: Phase B modifies the composer's core budget allocation and adds a new non-optional COMM block. This has second-order effects on at least three layers: `capacity.js` (target formula), `composeDaily.js` (DAILY_NON_OPTIONAL_SET + proportional shrink), and `orderDay.js` (scheduling the new anchor). Approximately 15 tests with hard-coded COMM/CI/floor values will break. The INFEASIBLE rate may increase for users with moderate external meetings, creating a regression for users who currently receive a feasible plan. No existing test covers the scenario where raised COMM budget alone causes INFEASIBLE. This is a data-integrity risk: users could lose their day plan unexpectedly. Phase B requires the most careful regression testing of the three phases.

### Phase C: LOW

Justification: Phase C adds a new render branch; it does not modify any existing logic path unless the user has both a projectTypeBinding and an empty project catalog. Existing empty-state tests are only affected if AutoPlanButton is removed from that branch. The new ProjectDiscoveryCard is additive. Risk is low as long as the branch condition is correctly gated and the standard empty state is preserved as a fallback.

---

## 12. Rollback Plan

### Phase A Rollback

Phase A is a pure UI deletion. Rollback: revert the Today.js render function to re-include all six removed component calls. The six component files remain on disk (do not delete them during Phase A). Component isolation tests can be un-deleted from the branch. No data migration or state machine change is required. Rollback time: 1 commit revert.

### Phase B Rollback

Phase B touches `DAILY_NON_OPTIONAL_SET` in `composeDaily.js` and potentially `capacity.js`. Rollback: revert `composeDaily.js` to remove the EOD anchor entry and restore the original `defaultMinutes` for the COMMUNICATION budget constants. If `capacity.js` was changed to raise the base COMMUNICATION multiplier, revert that change. All capacity.test.js and composeDaily.test.js assertions will return to green. Re-run the full 2,892-test suite to confirm. If any compositions persisted to storage with the new anchor structure, they must be reviewed for forward/backward compatibility. Phase B is the hardest to roll back if composed days were stored and accepted by users. **Recommendation: add a composition schema version field before shipping Phase B.**

### Phase C Rollback

Rollback: revert the Today.js branch that routes to ProjectDiscoveryCard. The AutoPlanButton in the empty state returns as the sole CTA. No composer or engine changes are needed. If ProjectDiscoveryCard was shipped as a separate component file, it can remain on disk without effect. Rollback time: 1 commit revert. No stored data impact.
