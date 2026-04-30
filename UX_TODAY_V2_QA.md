# Today Page v2 — QA Lens (vs <10s + <60s targets)

_Review date: 2026-04-27. Artifacts: Today.js, NowPane.js, UpNextRail.js,
Today.test.js (+sprint5/11/12), NowPane.test.js, UpNextRail.test.js,
UX_REVIEW_TODAY_QA.md, IMPROVEMENT_BACKLOG.md, SPRINT_16A_NOTES.md._

---

## 1. How Do We Measure the Targets in Tests?

**Comprehension complexity metric (<10s) — Comprehension Claim Count (CCC)**

Count per rendered HTML string: +1 per distinct UI region visible above the fold
(header, now-pane, recap strip, cycle-card, bucket-strip, up-next-rail); +1 per
numeric value displayed (adherence %, activity count, elapsed minutes, bucket
totals); +1 per status indicator (composition state badge, NowPane kind, EOD strip).
Assert `CCC <= 12` for ACCEPTED loaded state. Add a word-count proxy: assert
`word_count(visible_text_per_region) <= 25` for each named region (~10s at 150 wpm).
Implemented as a pure HTML-parse unit test; no browser required.

**Task complexity metric (<60s) — Task Op Count (TOC)**

Count atomic operations for "plan → swap → commit → start": +1 per button click
or keyboard activation; +1 per modal-open event (~5s overhead each); +1 per Tab
keystroke needed to reach next interactive target. Assert `TOC <= 10` for
keyboard-only happy path. Baseline (no focus-trap fix): ~25-45 Tab presses
(EditDrawer appears at end of DOM, focus not moved). Assert
`tab_index_of(edit-drawer-search) - tab_index_of(edit-btn) <= 3` via DOM-order
focusable-element enumeration.

---

## 2. A11y Audit (vs Latency)

C-UX-6 (focus trap) and C-UX-8 (action-button labels) are OPEN; noted below.

**BLOCKER — NowPane sections have no `aria-label` (all 3 variants)**
`NowPane.js:150, 162, 175`. All `<section aria-live="polite">` elements carry no
`aria-label`. SR user cannot identify the live region without reading its full
content. Estimated latency impact: +15-30s per page load — 2-3x the 10s target.

**BLOCKER — No `<h1>` in empty and infeasible states**
`Today.js:206-217, 183-194`. Empty and infeasible branches emit no heading.
SR navigation by landmark jumps from `<header>` to `<section>` with no page
identity. ~10s heading-search overhead per SR session. OPEN as C-UX-5.

**FAIL (C-UX-8 OPEN) — Start/Skip/Close buttons carry no activity name**
Grep: `data-action="START_ACTIVITY"` in `ScheduledActivityBlock.js`. SR announces
"Start button" for every row in the list. +5s per activity row disambiguated.

**FAIL (C-UX-6 OPEN) — EditDrawer + FineTuneDrawer lack focus traps**
`Today.js:237-248, 170-178`. Tab escapes both drawers into dimmed page content.
Keyboard-only swap flow: +10-20 Tab presses = +15-30s. Directly busts <60s target.

**WARN — `prefers-reduced-motion` gap on `pulse-red` animation**
Grep `pulse-red` in `app.css`. No `@media (prefers-reduced-motion: reduce)` guard.
WCAG 2.1 §2.3.3 advisory failure for vestibular disorder users.

**WARN — Sprint 15/16a additions not confirmed in forced-colors block**
T1 token work added a `forced-colors` block (C-UX-1 DONE). NowPane, UpNextRail,
MorningRecap post-date T1. Verify the block covers their bucket-dot and chip
classes before v2 ships.

---

## 3. Keyboard-Only Path Audit (vs <60s)

Tab order through "plan → swap → commit → start" (no focus-trap fix):

- Nav links (N tabs) → FineTuneButton → NowPane Close (if IN_PROGRESS) →
  ACCEPT / EDIT / REJECT triad. **Tab count to EDIT: 5-8. Within budget.**
- EDIT activated: focus stays on EDIT button. EditDrawer at DOM end.
  All activity Start/Skip buttons in dimmed page between EDIT and the drawer.
  **Tab count to EditDrawer search: 10-20+. Exceeds 60s budget alone.**
- Inside EditDrawer: search reachable; Tab exits drawer back into dimmed page
  if user overshoots. No visible Escape handler in rendering code.
- COMMIT then Start: another 5-10 ops each.

**Estimated total keyboard TOC without fix: 25-45 ops (~37-67s at 1.5s/Tab).**
Exceeds 60s at high end. Single fix: auto-focus first EditDrawer element on open
+ Escape restores focus. Cuts TOC to ~12.

---

## 4. Regression Surface for v2

**Trivial-update** (rename only):
- `data-route="today"` — `Today.test.js:42`
- `today-editing`, `today-onboarding-hint` classes — `sprint12.test.js:69`, `sprint11.test.js`
- `morning-recap`, `eod-closure-strip` class strings — `Today.test.js:188, 427`

**Careful-update** (behavioral/structural):
- `data-action="ACCEPT"/"EDIT"/"REJECT"` triad — `Today.test.js:72-76`; breaks if
  triad becomes a menu.
- `aria-hidden` on FineTuneDrawer — `sprint5.test.js:29, 37`; CSS-only visibility breaks it.
- BucketStrip `planned` span — `sprint12.test.js:108-113`; class rename breaks silently.
- `cycle-proposed/accepted/rejected` CSS classes — 5 test files, all break on rename.

**Will-break** (architecture-sensitive):
- NowPane + UpNextRail render gated on `nowIso` presence (`Today.js:251-270`).
  Any v2 that always renders them (with placeholder) breaks guard assumptions in
  tests that omit `nowIso`.
- `editMode.activities` vs `activeState.activities` branch (`Today.js:223-225`).
  Merge breaks 4 sprint-12 assertions relying on swap being in rendered activity names.
- `EodClosureStrip` only in active-composition branch (`Today.js:277`). Moving it
  to shared location breaks AC3-5.

---

## 5. Edge Cases Currently Untested

1. **NowPane with non-UTC offset ISO** (e.g., `2026-03-29T09:00:00+01:00`).
   `NowPane.js:39` parses offset correctly but elapsed-minutes math may drift by
   the TZ offset. Related: C-QA-3 OPEN.

2. **UpNextRail with HH:MM-only `plannedStartAt` and no `_date`**. `UpNextRail.js:67-78`
   falls through to `new Date('10:00')` which is Invalid Date → `""` time cell.
   No test covers a blank time column in the Up Next rail.

3. **NowPane UPCOMING + UpNextRail row 0 duplicate (C-UX-7 OPEN)**. No regression
   test documents the current duplication so a fix can be cleanly verified.
   Mobile adds a third copy (`up-next-mobile`). All three surfaces untested together.

4. **`infeasible` structured prop + legacy `infeasibleExplain` both provided**.
   `Today.js:117-121` gives `infeasible` priority silently. No test asserts
   precedence; caller bug would discard the legacy array without warning.

5. **`eodRecap` non-null with `activeState === null`**. AC3-5 tests pass null
   eodRecap in both assertions. The case of accidentally-provided non-null eodRecap
   in the empty branch is not exercised; the branch correctly suppresses the strip
   but the contract is undocumented in tests.

6. **`whyPlanExpanded=true` in ACTIVE composition state**. `Today.js:284` gates
   chip on PROPOSED/ACCEPTED/EDITED. No test asserts chip absent when state is
   ACTIVE (a real runtime state after Auto-Plan is started).

7. **Sprint 16a: en-dash in `aria-label`**. Static sa-when now shows range string
   (`09:00–10:30`) in the element text but the aria-label keeps the verbal form.
   No test asserts the en-dash is absent from the aria-label value specifically.

8. **DST boundary day — `selectNowState` elapsed computation**. All NowPane
   fixtures use `Z` ISO strings. A 23-hour DST day could produce incorrect elapsed
   or upcoming-window calculations. No fixture uses a DST-adjacent date.

---

## 6. Top 5 Test-Coverage Improvements

1. **NowPane: assert `aria-label` on every section variant.**
   For each of IN_PROGRESS, UPCOMING, OPEN_TIME: assert `<section>` carries a
   descriptive `aria-label`. Directly addresses the #1 latency-increasing a11y gap.
   File: `tests/ui/components/NowPane.test.js`.

2. **Today edit-mode: Tab-order DOM audit.**
   Render Today in edit mode, extract focusable elements in DOM order, assert
   EditDrawer search input is within 3 positions of the EDIT button. Pure HTML
   parse. Directly validates <60s target. File: `tests/ui/pages/Today.sprint12.test.js`.

3. **UpNextRail: HH:MM-only start with no `_date` renders defined output.**
   Assert the time cell is either `""` or a documented fallback — not a crash.
   Documents the contract so v2 can fix it without silent regression.
   File: `tests/ui/components/UpNextRail.test.js`.

4. **Today: UPCOMING state shows same activity in NowPane + UpNextRail.**
   Render Today with one activity starting 15m after nowIso. Assert the same
   `data-activity-id` appears in both `now-pane-upcoming` and `up-next-row`.
   Locks C-UX-7 current behavior so a fix has a red-green baseline.
   File: `tests/ui/pages/Today.test.js`.

5. **`formatTimeRange` with non-UTC offset ISO.**
   Assert `formatTimeRange('2026-03-29T09:00:00+01:00', 60)` returns a documented
   value (UTC or local — pick one and enforce it). Closes C-QA-3 for the range
   helper. File: `tests/ui/timeFormat.test.js`.

---

## 7. Cross-Page A11y Patterns to Standardize

1. **Live region naming** — every `aria-live` element must carry `aria-label`.
   Affects NowPane (Today), InfeasibleBanner (Today), Toast (all pages).

2. **`role="dialog" aria-modal aria-labelledby` triplet** — FineTuneDrawer missing
   `aria-modal`; OutputArtifactDialog and SkipReasonModal missing `aria-labelledby`.
   Enforce all three attributes on every drawer/modal across Today and Week.

3. **Action button labels include the object** — Start/Skip/Close on
   ScheduledActivityBlock (Today + Week) must include activity name. Pattern
   already established by duration chips (`aria-label="Set duration to N minutes"`).

4. **Skip-to-main link** — absent from app shell. Must be first focusable element
   on every routed page.

5. **Persistent `<h1>` per route** — Today empty/infeasible states lack one
   (C-UX-5 OPEN). Standard: every route renders `<h1>` regardless of data state.

---

## 8. Open Questions for Phil

1. Does `app.js` programmatically move focus after EDIT_BEGIN / FINE_TUNE_TOGGLE /
   OPEN_CLOSE_DIALOG? If yes, C-UX-6 severity is partially mitigated — QA needs
   to see that layer to validate the full keyboard story.

2. Sprint 16a kept the Sprint 14 `<input type="time">` aria-label "unchanged."
   Does the edit-mode sa-when path carry an equivalent verbal label, or does the
   time-range aria-label disappear when the input renders?

3. Is C-UX-7 (NowPane/UpNextRail duplication) scheduled for v2, or will v2 keep
   both surfaces and suppress duplication visually? The answer determines whether
   regression tests should lock the current duplicating behavior or the fixed one.

4. `eodRecap` and `priorDayRecap` are computed by `app.js`. If the user's local
   clock is wrong, both strips could render simultaneously on the wrong day.
   Is there a calendar-date guard in `app.js`, and should QA add a mis-set-clock
   edge case?
