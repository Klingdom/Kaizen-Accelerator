# Today Page — Quality, Accessibility & Regression Review (qa-engineer lens)

## 1. Accessibility Audit

| Element | aria-label | Role | Keyboard reachable | Focus visible | Verdict |
|---|---|---|---|---|---|
| day-badge (`today-day-badge`) | Yes — "day N since signup" | implicit (span) | No — not interactive | N/A | PASS |
| AdherenceDial (empty) | Yes — "Adherence" | none (section) | No | N/A | WARN: missing `role="group"` on the empty variant; populated variant has it |
| FineTuneButton | None | button | Yes | No explicit `:focus` style in CSS | FAIL: no aria-label; "Fine-tune" text only, no SR hint of purpose |
| AutoPlanButton | Yes — "Auto-plan today" | button | Yes | No `:focus-visible` rule for this element | WARN |
| ScheduledActivityBlock — time column | Yes — "starts at HH:MM, N minutes" | div | No | N/A | PASS for SR; div not interactive |
| ScheduledActivityBlock — bucket chip | Yes — "bucket PROJECT" | div | No | N/A | PASS for SR |
| ScheduledActivityBlock — Start button | No aria-label | button | Yes | No `:focus` rule in CSS | FAIL: label is just "Start" with no activity name in label |
| ScheduledActivityBlock — Close button | No aria-label | button | Yes | No `:focus` rule in CSS | FAIL: "Close" with no activity name in label |
| ScheduledActivityBlock — Skip button | No aria-label | button | Yes | No `:focus` rule | FAIL: same; screen reader announces "Skip button" with no context |
| ScheduledActivityBlock — sa-edit-select | Yes — "Select this slot to swap" | button | Yes | No `:focus` rule | WARN: label does not name the activity |
| ScheduledActivityBlock — sa-edit-remove | Yes — "Remove this slot" | button | Yes | No `:focus` rule | WARN: no activity name in label |
| ScheduledActivityBlock — duration chips | Yes per chip — "Set duration to N minutes" | button, role="group" on container | Yes | `focus-visible` present (line 1968) | PASS |
| ScheduledActivityBlock — time editor (input[type=time]) | Yes — "Start time" | input | Yes | `:focus` present (line 2018) | PASS |
| EditDrawer | Yes — "Swap activities" | aside, role="dialog" | Yes | Search input `:focus` (line 1698) | WARN: dialog not trapped; no aria-modal |
| EditDrawer dismiss button | Yes — "Close edit drawer" | button | Yes | No `:focus` rule | WARN |
| FineTuneDrawer | aria-hidden managed | role="dialog" | Yes when open | No `:focus` rule on footer buttons | FAIL: role="dialog" without aria-modal="true" |
| RhythmExplainer dismiss button | None | button | Yes | No `:focus` rule | FAIL: button text "Got it" with no aria-label identifying what is dismissed |
| OutputArtifactDialog | Title in h2 | role="dialog" aria-modal="true" | Yes | No `:focus` rule on submit/cancel | WARN |
| SkipReasonModal | Title in h2 | role="dialog" aria-modal="true" | Yes | No `:focus` rule | WARN |
| NowPane (all 3 variants) | None on section | section, aria-live="polite" | No | N/A | FAIL: aria-live region has no name; no aria-label on the section |
| UpNextRail | Yes — "Up next" | aside | No | N/A | PASS |

## 2. Keyboard Flow

**Empty state (Tab order):** nav links → FineTuneButton → AdherenceDial (not reachable; it's a display section) → AutoPlanButton → RhythmExplainer dismiss. No skip-link exists anywhere in the app shell. A keyboard user must Tab through all nav items on every page load.

**Populated state (ACCEPTED):** nav → FineTuneButton → AutoPlanButton (if present) → RhythmExplainer dismiss → NowPane Close (if IN_PROGRESS) → each activity's Start / Skip or Close buttons in DOM order → AcceptEditRejectTriad or edit-triad buttons.

**Edit mode:** Same as populated, plus EditDrawer. The EditDrawer is an `aside role="dialog"` but no focus-trap logic is evidenced. When the drawer opens, focus is NOT moved to it (purely server-rendered HTML string; no JS focus management visible). Tab continues cycling through the dimmed main-page activity list (today-editing) before reaching the drawer. This is a keyboard trap inversion — focus escapes the dialog rather than being contained.

**Specific gaps:**
- No skip-to-main link.
- FineTuneDrawer: `role="dialog"` but no `aria-modal="true"` and no focus trap. When open, Tab traverses occluded content behind the overlay.
- EditDrawer: same pattern.
- Modals (OutputArtifactDialog, SkipReasonModal) have `aria-modal="true"` but no JS-enforced focus trap is visible in the rendering code.

## 3. Screen Reader Story

**Landing on Today empty state (Day 0):** SR announces region "main", then "header" landmark containing "Day 1 since signup" (span text), then section "Adherence" reading "— —% — Building your baseline…", then "Fine-tune" (button, no purpose label), then a note role (today-onboarding-hint) reading the welcome copy, then aside "Your 4-2-2 daily rhythm" (RhythmExplainer), then section "No day scheduled…", then "Auto-plan today" button.

Missing: The `<main>` has no aria-label; the page has no `<h1>`. CycleCard supplies `<h1 class="cycle-title">` in the loaded state, but the empty state has no h1 at all. SR user has no page title in the heading hierarchy.

**Landing with a composition (PROPOSED):** SR reaches CycleCard which has `<h1 class="cycle-title">Today, composed.</h1>` — this is the only h1. BucketStrip has `aria-label="4-2-2 daily rhythm"`. Each activity row is an `<li>` inside `role="list"`. SR reads time range via aria-label "starts at HH:MM, N minutes", then bucket chip "bucket PROJECT", then name, duration value, intention text, state label, and action buttons ("Start", "Skip") without the activity name in their labels. File: `ScheduledActivityBlock.js:98-99`.

**Opening edit mode:** No SR announcement that edit mode opened. The `<h1>` changes to "Edit today" but this is only discovered on next read. No `aria-live` announcement of the mode change. The EditDrawer appears at end of DOM but focus stays on the EDIT button — SR user does not know a dialog opened. File: `CycleCard.js:173`, `EditDrawer.js:288`.

**Closing an activity (OutputArtifactDialog):** Dialog has `role="dialog" aria-modal="true"` and `<h2 class="oad-title">` inside. SR will announce dialog on focus entry, but focus is not programmatically moved to the dialog on open (no JS focus management visible). File: `OutputArtifactDialog.js:93`.

## 4. Edge Cases Currently Untested

The 45 unit tests + 4 integration tests cover the following untested scenarios:

1. **Composition with zero activities (empty activities array, ACCEPTED state)** — `renderActivityList` falls through to `<li class="sa-empty">No activities.</li>` but no test asserts this path in ACCEPTED/ACTIVE/EDITED.
2. **All activities CLOSED** — NowPane would show OPEN_TIME with nothing on deck; UpNextRail would show empty. No test covers this complete-day-closed state.
3. **All activities SKIPPED** — similar to above but bucket strip totals are non-zero.
4. **nowIso far before composition window** (e.g., 2020-01-01) — NowPane OPEN_TIME renders; UpNextRail lists all activities as "up next". No assertion this is handled gracefully.
5. **nowIso far after composition window** (e.g., day+1) — all activities would filter as past; UpNextRail empty state, NowPane OPEN_TIME. Untested.
6. **Day badge with daysSinceSignup >= 99** (3-digit, e.g. 100 → "Day 101") — the pill badge has fixed font-size 12px; layout may overflow. No width assertion test.
7. **AdherenceDial with all three values as 0** (not null) — `showEmpty` is false because null-check fails, so three 0% values render. No test for zero-value vs null distinction.
8. **Edit mode with 0 non-protected slots** (entire day is protected blocks) — user cannot select any slot; EditDrawer renders but select buttons are absent. The subtitle remains "Pick a slot" with no slot available. No test.
9. **Edit mode with 0 protected slots** — all slots are swappable. No test differentiates this path.
10. **EDIT_CHANGE_START_TIME on an activity whose plannedStartAt is null** — `formatTime(null)` returns `''`; the `<input type="time">` gets `value=""`. No assertion this does not crash the handler.
11. **Single overlong activity name** (e.g., 200-char string) — `sa-intention` has `overflow: hidden; text-overflow: ellipsis; white-space: nowrap` but `sa-name` does not. No wrapping/truncation assertion.
12. **infeasible state with daysSinceSignup=0** — the onboarding hint must NOT render. Today.sprint11.test.js line 128-137 covers this correctly, but the complementary case (infeasible + Day 7+) is not tested.
13. **`prefers-reduced-motion` media query** — `@keyframes pulse-red` fires on `status-overpacked` BucketStrip rows with no `prefers-reduced-motion: reduce` override in app.css. Not tested; no CSS guard exists.
14. **`forced-colors` / high-contrast mode** — bucket color variables would be overridden by the OS; chip backgrounds disappear. No test and no `forced-colors` CSS rule in app.css.
15. **Mobile viewport (<600px) with EditDrawer open** — EditDrawer is an `aside` with no media-query width constraint visible in app.css scan; may overlap or extend off-screen. No test.
16. **DST boundary day** — `selectNowState` and `selectUpNext` use `new Date(iso)` which is TZ-sensitive. A day where clocks spring forward could produce a 23-hour day. No test uses a DST-adjacent ISO string.
17. **RhythmExplainer dismissed=false (default)** renders fine; dismissed=true returns `''`. No test asserts that `dismissed=undefined` (default prop path) renders the banner.
18. **FineTuneDrawer with capacity value not in CAPACITY_OPTIONS** (e.g., 420 from a legacy record) — no radio is checked. No test.

## 5. Test Coverage Map

| Component | Test file(s) | Estimated coverage | Primary gap |
|---|---|---|---|
| Today.js (page shell) | Today.test.js, sprint5/11/12 | ~75% | infeasible+hint combo, EDITED/CLOSED comp state |
| CycleCard | Today tests (indirect) | ~60% | CLOSED comp state, 0-activity ACCEPTED, ACTIVE pinning |
| ScheduledActivityBlock | No dedicated unit test | ~15% | SKIPPED reason, IN_PROGRESS elapsed, DROPPED, edit-selected+time-editor |
| AdherenceDial | Today tests (indirect) | ~60% | zero-value vs null, partial null (only 1 metric null) |
| AutoPlanButton | Today tests (indirect) | ~80% | loading+secondary variant combo |
| FineTuneDrawer | Today.sprint5 (indirect) | ~50% | non-option capacity value, empty availableKaizens |
| EditDrawer | Today.sprint12, integration | ~55% | 0-result search, all-buckets-collapsed, violation highlighting |
| RhythmExplainer | sprint11 (DOM order only) | ~40% | dismissed=undefined default, aria-label content |
| NowPane | No dedicated unit test | ~0% | all three variants untested at unit level |
| UpNextRail | No dedicated unit test | ~0% | rail vs mobile variant, limit=0 guard, no _date present |
| OutputArtifactDialog | sprint5 (indirect) | ~40% | TWO_LIST/NUMERIC/DOCUMENT schemas untested |
| SkipReasonModal | sprint5 (indirect) | ~30% | OTHER reason pre-selected, empty activityName |

## 6. Regression Surface for a UX Redesign

**Trivial-update** (string class rename only):
- `cycle-card`, `cycle-proposed`, `cycle-accepted`, `cycle-editing` class assertions in Today.test.js, sprint12.test.js.
- `today-editing` class assertion in sprint12.test.js line 69.
- `adherence-dial` and `fine-tune-btn` class assertions spread across 6 test files.

**Careful-update** (behavioral + structural):
- AcceptEditRejectTriad `data-action="ACCEPT"/"EDIT"/"REJECT"` assertions — if the triad is redesigned as a menu these break.
- `aria-hidden="true"/"false"` assertion on FineTuneDrawer (sprint5 lines 29, 37) — changes to a CSS-only approach would break this.
- BucketStrip `planned` span value assertions in sprint12 line 108-113 — any rename of the span class breaks slicing logic.
- `Swap &quot;Focus A&quot; with` subtitle assertion in sprint12 line 135 — microcopy change breaks.

**Will-break** (architecture-sensitive):
- All `data-route="today"` assertions — if routing moves to a different attribute.
- Integration edit-mode test EDIT_COMMIT assertion on `comp.state === 'EDITED'` — any state-machine rename breaks 4 assertions.
- `cycle-rejected` + `No day scheduled. Compose again.` combo — two places assert this exact string.
- `today-onboarding-hint` class + band copy strings — 6 assertions across sprint11 would break on any copy or class rename.

## 7. Top 5 QA-Lens Improvements (ranked)

| Title | Defect / Risk | Test that would catch it | Effort |
|---|---|---|---|
| 1. Focus trap absent in EditDrawer and FineTuneDrawer | Keyboard users Tab out of open dialogs into occluded page content; WCAG 2.1 §2.1.2 failure | Integration test: open drawer, assert Tab loop stays within drawer, assert Escape closes and returns focus | M |
| 2. Start / Skip / Close buttons missing activity-name in aria-label | SR announces "Start button" with no context; user cannot distinguish which activity they are acting on | Unit test on ScheduledActivityBlock: assert aria-label of Start/Skip/Close contains activity name | S |
| 3. NowPane aria-live region has no name and no unit tests | SR announces live region content with no heading; region purpose is opaque; zero unit test coverage | Unit tests for all 3 NowPane variants; assert section carries aria-label matching kind | S |
| 4. No `prefers-reduced-motion` guard on `pulse-red` animation | Users with vestibular disorders see continuous pulsing on over-capacity bucket rows; WCAG 2.1 §2.3.3 advisory | CSS-level test (or snapshot): assert `@media (prefers-reduced-motion: reduce)` disables the animation | S |
| 5. RhythmExplainer dismiss button has no aria-label identifying what is dismissed | SR announces "Got it, button" with no reference to the banner; user cannot know what they are dismissing | Unit test: assert dismiss button aria-label contains "4-2-2 daily rhythm" or equivalent | S |

## 8. Cross-Page A11y Patterns to Standardize

1. **Page-level `<h1>` per route** — CycleCard provides an `<h1>` only when a composition exists; empty-state Today, Portfolio, Insights, and Catalog pages should each have a persistent `<h1>` independent of data presence. Today empty-state has no h1 at all.

2. **Skip-to-main link** — No skip link exists anywhere in app.css or the components scanned. All pages force keyboard users to Tab through the nav on every load. A single `<a href="#main-content" class="skip-link">Skip to content</a>` pattern should travel to every routed page.

3. **`aria-label` on `role="dialog"` + `aria-modal="true"` pairing** — OutputArtifactDialog and SkipReasonModal have `aria-modal="true"` but no `aria-labelledby` pointing to their `<h2>` titles. FineTuneDrawer has `role="dialog"` without `aria-modal`. A standard pattern of `role="dialog" aria-modal="true" aria-labelledby="[id of h2]"` should apply to all six modals across pages.

4. **Focus restoration on modal/drawer close** — No component tracks the trigger element to restore focus on dismiss. This must be implemented once at the event-handler layer (`EDIT_CANCEL`, `CLOSE_CLOSE_DIALOG`, `CLOSE_SKIP_MODAL`, `FINE_TUNE_TOGGLE`) and the pattern documented so Week and Portfolio drawers inherit it.

5. **aria-live region naming convention** — NowPane, InfeasibleBanner, and Toast all use `aria-live` but with inconsistent or absent `aria-label` values. A site-wide convention should name every live region so SR users can navigate to it by landmark.

6. **Keyboard shortcut hint placement** — Duration chips (sprint 13) expose `aria-label="Set duration to N minutes"` correctly, but there is no visible keyboard hint that these buttons exist (they appear only on selection). Week and future surfaces should follow the same chip pattern with a visible affordance.

7. **`forced-colors` / high-contrast CSS block** — No `@media (forced-colors: active)` rule exists anywhere in app.css. Bucket color coding (project/communication/CI chips, fill bars) relies entirely on background-color which is suppressed in forced-colors mode. A single `@media (forced-colors: active)` override block should be added once and shared across Today, Week, and Catalog.

## 9. Open Questions for Phil

1. Is there a JS focus-management layer (e.g., in `mount.js` or `app.js`) that runs after each re-render to move focus into newly opened drawers/modals? If yes, the EditDrawer and FineTuneDrawer focus-trap gap may already be partially addressed outside the component layer — QA needs to see it to validate.

2. The `FineTuneDrawer` uses `role="dialog"` without `aria-modal="true"`, while `OutputArtifactDialog` and `SkipReasonModal` include `aria-modal="true"`. Is this intentional (the fine-tune drawer is considered a non-modal panel)? The answer determines whether a focus trap is required.

3. For the redesign: will the `cycle-activities` `<ul role="list">` and the ScheduledActivityBlock `<li>` element structure be preserved, or are these components being rebuilt? The answer determines whether all 45 existing Today unit tests need full rewrites or targeted updates.

4. `UpNextRail` and `NowPane` have zero dedicated unit tests today. Before the redesign lands, should the QA lock-in target be zero-regression on current behavior (requiring new tests now) or is the redesign the forcing function to write them alongside the new implementation?
