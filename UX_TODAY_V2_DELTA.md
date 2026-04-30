# Today v2 — Ship Plan (Top 5 Items)

Status: v0.1 — Define-phase. Awaiting Phil approval before any implementation begins.
All items are pure renderer or app.js route-layer changes. None trigger §6.5
(no touches to js/composer/, js/engine/, or js/domain/types.js).

---

## Item 1: TodayPageViewed + EditDrawerOpened Instrumentation (C-AN-1)

### Convergence
4 lenses. Score ≥13 (§6.4 gate satisfied).
- Analytics §2 §4: "`TodayPageViewed` does not exist. It is the required anchor; without
  it this metric cannot be computed at all." Also requires `EditDrawerOpened` to split
  accept-path vs edit-path latency measurement.
- QA §1: Comprehension Claim Count is a proxy; the real latency number requires
  `TodayPageViewed` as t=0.
- PM §8: ACs for the 10s/60s targets require observable timestamps to validate.
- Growth §6 rank 5: "C-AN-1: prerequisite for measuring improvements 1–4."

### Latency math
Target: both (measurement prerequisite, not direct user-facing save).
This item produces 0 seconds of direct user-facing saving. It unblocks the ability to
measure every other item. Without it, v2 cannot claim to have hit either target.
Required baseline window: 14 calendar days of data before V2-1, V2-2, V2-5 ship.

### Specific change (current → proposed)
Current: No page-view event fires when the user navigates to /today. No edit-session
anchor event fires. Both latency formulas in Analytics §1 divide by zero.

Proposed:
- In app.js on the route-change handler for "today", emit:
  `{ event: 'TodayPageViewed', userId, compositionState, isFirstRun, timestamp: Date.now() }`
  where `compositionState` is the string state of the active composition (PROPOSED /
  ACCEPTED / INFEASIBLE / FIRST_RUN / null).
- In the EDIT_BEGIN action handler in app.js, emit:
  `{ event: 'EditDrawerOpened', compositionId: activeState.id, timestamp: Date.now() }`
- Add `proposedAt` field to the existing `CycleAccepted` event payload by reading
  `activeState.proposedAt` at emit time. No new event required.

No visual change. No DOM change. No test breakage risk.

### Files likely touched
- `js/app.js` — route handler for "today" and EDIT_BEGIN action handler.
- Existing analytics emit helper (§6.1 pattern) — no new utility needed.
- Render layer: none.
- Composer/engine boundary: not triggered.

### Acceptance criteria
1. Given the user navigates to /today, when the route resolves and Today renders,
   then `TodayPageViewed` fires within 500ms of route-change with `compositionState`
   set to the current composition state string.
2. Given `TodayPageViewed` fires, when the session log is inspected, then
   `compositionState` is one of: "PROPOSED", "ACCEPTED", "INFEASIBLE", "FIRST_RUN", "NONE".
3. Given the user taps the Edit button on CycleCard, when EDIT_BEGIN action fires,
   then `EditDrawerOpened` fires with a non-null `compositionId` and `timestamp`.
4. Given the user accepts a composition, when `CycleAccepted` fires, then its payload
   contains `proposedAt` as an ISO timestamp matching the composition's proposed time.
5. Given `TodayPageViewed` and `ActivityStarted` events exist in the same session,
   when update-and-start time is computed as `(ActivityStarted.timestamp -
   TodayPageViewed.timestamp) / 1000`, then the result is a positive number less than 300s.

### Risks + mitigations
- R1: `TodayPageViewed` fires on every Today render, not just navigation — could
  double-count on state mutations that re-call renderApp. Mitigation: gate emit on
  route-change event specifically, not on Today() component call.
- R2: `proposedAt` absent on compositions created before this iteration. Mitigation:
  emit `proposedAt: null` when field is absent; exclude null-proposedAt sessions from
  accept-delay KPI computation.
- R3: Clock skew if user's local clock is wrong. Mitigation: noted in QA §8 Q4; accept
  as a known limitation for a single-user MVP; no server time available.

### Suggested iteration
Pair with V2-3 (BucketStrip fix) and V2-10 (CCC proxy tests) in Iteration 21.
None of these three items share file surfaces: app.js route handler (V2-4) vs
app.css:1519 (V2-3) vs new test file (V2-10).

---

## Item 2: Auto-Collapse RhythmExplainer at Day 3+  (V2-1)

### Convergence
5 lenses. Score ≥13 (§6.4 gate satisfied — highest convergence in the Top 10).
- UX §4 SK-1: "4–6s of scan time per session for any undismissed user. The card's
  visual weight delays the CycleCard from entering the field of view."
- PM §4: "renders on every state including infeasible and active-composition. After day 2,
  a returning user has no action to take from the explainer."
- Growth §1 §3: "Day 5 user gains nothing from re-reading 4-2-2 explainer copy." Day 3
  proposed as crossover to returning mode.
- QA §1 word-count proxy: RhythmExplainer alone exceeds ≤25-word/region limit for its
  zone, failing the CCC test that ships in V2-10.
- Competitive §5 anti-pattern 2: Sunsama's blocking morning ritual is the comparator
  failure case; the same logic applies to any day-0 explainer on a day-5+ session.

### Latency math
Target: <10s comprehension.
Estimated save: 4–6s per returning session (UX §4 SK-1 estimate).
On a 10s budget: 4–6s recovery represents 40–60% of the entire target budget.
This is the single highest-latency-saving item in the Top 10.

### Specific change (current → proposed)
Current: `RhythmExplainer` renders when `props.dismissed !== true` — no lifecycle condition.
A day-6 user who has never tapped "Got it" sees the full 57-word card on every session.

Proposed (three render branches based on lifecycle):
- `dismissed === true` → render nothing (no change from current dismissed behavior).
- `dismissed === false` AND `daysSinceSignup <= 2` → render the full card (current behavior
  for days 0–2; new users get full onboarding content).
- `dismissed === false` AND `daysSinceSignup >= 3` → render a single-line chip:
  "4-2-2: Deep 4h / Comms 2h / CI 2h — what's this?" with a tap target that re-expands
  the full card inline if the user wants context.
- Infeasible branch: suppress entirely regardless of dismissed or daysSinceSignup, so the
  InfeasibleBanner and capacity instructions are the first readable content below the header.

The chip variant occupies one text line (~20px height) vs the current card (~120–140px).
This reclaims ~100–120px of above-the-fold space, bringing the CycleCard into the viewport
on a 1280px laptop without scrolling.

### Files likely touched
- `js/ui/components/RhythmExplainer.js` — add lifecycle branch (lines 30–41).
- `js/ui/pages/Today.js` line 160 — pass `daysSinceSignup` prop to RhythmExplainer
  (prop already computed at app.js:544; must be threaded to RhythmExplainer).
- `app.css` — add `.rhythm-chip` single-line style (new rule; existing card styles
  unchanged for days 0–2).
- Tests: `RhythmExplainer.test.js` — add three new branch assertions.

### Acceptance criteria
1. Given `daysSinceSignup >= 3` and `dismissed === false`, when Today renders, then no
   full RhythmExplainer card is present in the DOM and a `.rhythm-chip` element is visible.
2. Given `daysSinceSignup <= 2` and `dismissed === false`, when Today renders, then the
   full RhythmExplainer card renders with its "Got it" dismiss button.
3. Given `dismissed === true` (any daysSinceSignup), when Today renders, then neither
   the card nor the chip is present in the DOM.
4. Given Today in the INFEASIBLE state (any daysSinceSignup, any dismissed value), when
   Today renders, then neither card nor chip is present; InfeasibleBanner is the first
   element below the header.
5. Given `daysSinceSignup >= 3` and Today in ACCEPTED state, when the page loads,
   then the CycleCard's first activity block is visible above the fold at 1280×800px
   viewport without scrolling (CCC test from V2-10 validates this automatically).

### Risks + mitigations
- R1: `daysSinceSignup` prop not currently passed to RhythmExplainer. Mitigation: thread
  from `app.js:544` through Today.js:160 to RhythmExplainer props. Confirmed existing
  computed value; no new data path.
- R2: Chip tap to re-expand — if the expand state is not persisted, users on day 3+ who
  want the full explainer must re-tap every session. Mitigation: chip tap expands inline
  (local component state, not persisted); on day 3+ the full card is never the default.
- R3: QA test for `data-route="today"` regression if chip introduces new DOM structure.
  Mitigation: existing selector tests do not assert on RhythmExplainer internals;
  chip uses a new `.rhythm-chip` class that does not conflict with existing test selectors.

### Suggested iteration
Pair with V2-2 and V2-5 in Iteration 22, after the 14-day baseline from Iteration 21 closes.
All three items share the Today.js edit/view flow and can be validated in a single QA pass.

---

## Item 3: Fix BucketStrip Blackout in Edit Mode (C-UX-2)

### Convergence
4 lenses. Score ≥13 (§6.4 gate satisfied).
- UX §4 SK-3: "BucketStrip invisible during the action that most needs it. Estimated cost:
  10–20s per violation cycle (Commit → observe violation → undo → re-edit)."
- PM §5: "BucketStrip dimmed during edit mode (C-UX-2, OPEN) — invariant feedback hidden
  during the action that most requires it." Ranked budget-eater #3.
- Frontend §5 CSS: `.today-editing .cycle-card:not(.cycle-editing)` applies `opacity: 0.4`
  to the full card including BucketStrip.
- QA §4: "BucketStrip `planned` span — sprint12.test.js:108–113; class rename breaks
  silently." Fix must not rename the class.

### Latency math
Target: <60s update-and-start.
Estimated save: 10–20s per edit session where a bucket violation would otherwise be invisible.
The violation discovery cycle (Commit → observe violation → Undo → re-edit) is the single
most expensive error path in the 60s update-and-start budget. Eliminating the root cause
(BucketStrip invisible during edit) directly removes this path.
% of 60s budget recovered: 17–33% per occurrence.

### Specific change (current → proposed)
Current: `app.css:1519–1522`:
```
.today-editing .cycle-card:not(.cycle-editing) {
  opacity: 0.4;
  pointer-events: none;
}
```
This selector applies to the entire CycleCard, including the BucketStrip, all activity
blocks, and the triad.

Proposed: Split into two targeted rules:
```
.today-editing .cycle-card:not(.cycle-editing) .sa-actions,
.today-editing .cycle-card:not(.cycle-editing) .triad,
.today-editing .cycle-card:not(.cycle-editing) .scheduled-activity-block {
  opacity: 0.4;
  pointer-events: none;
}
```
BucketStrip (`.bucket-strip` and its children) is NOT included in the scoped selectors and
remains at full opacity and pointer-events: auto during edit mode. No other CSS changes.
No JS changes. No component changes.

The BucketStrip remains read-only during edit (no pointer-events change needed for it —
it already has no interactive elements). The user sees live bucket totals update as they
make swap selections in EditDrawer.

### Files likely touched
- `app.css` lines 1519–1522 only. Selector scope narrows; no additions elsewhere.
- Render layer: none.
- Composer/engine boundary: not triggered.

### Acceptance criteria
1. Given Today in edit mode (`isEditing: true`) with EditDrawer open, when the page
   renders, then the `.bucket-strip` element has computed opacity of 1.0 (not 0.4).
2. Given a user swaps an activity in EditDrawer, when the swap is selected (before Commit),
   then the BucketStrip bucket totals update to reflect the swap in real time.
3. Given Today in edit mode, when the page renders, then `.sa-actions` and `.triad` within
   the non-editing cycle-card have computed opacity of 0.4 and pointer-events: none.
4. Given the BucketStrip fix is live, when a user's swap would create a bucket violation,
   then the BucketStrip color signal changes while the EditDrawer is still open (before
   Commit), allowing the user to select a different replacement.
5. Given sprint12.test.js:108–113 BucketStrip assertions, when the CSS change ships, then
   all existing BucketStrip tests pass without modification (class names unchanged).

### Risks + mitigations
- R1: The `.scheduled-activity-block` selector within the rule may inadvertently include
  BucketStrip if BucketStrip's markup uses that class. Mitigation: confirm BucketStrip
  uses `.bucket-strip` root class (not `.scheduled-activity-block`) before shipping.
- R2: Some downstream selector in sprint12.test.js asserts on `cycle-card` opacity
  directly. Mitigation: review sprint12.test.js before shipping; if the test asserts
  full-card opacity, update the test to assert component-level opacity instead.
- R3: FineTuneDrawer is open during some edit sessions. The rule applies to
  `.today-editing` which covers both EditDrawer and FineTuneDrawer sessions. Confirm
  the FineTuneDrawer session also benefits from BucketStrip visibility.

### Suggested iteration
Pair with V2-4 (C-AN-1) and V2-10 (CCC proxy tests) in Iteration 21. CSS selector change
is the lowest-risk item in the ship plan and does not affect the instrumentation baseline.
Ships before the visible redesign (V2-1, V2-2) to give 14 days of baseline data on the
corrected edit experience.

---

## Item 4: Single Commit Surface + Edit-Entry Clarity (V2-2)

### Convergence
5 lenses. Score ≥13 (§6.4 gate satisfied — tied with V2-1 for highest convergence).
- UX §4 SK-2: "When EditDrawer is open, both CycleCard triad-edit and EditDrawer footer
  render three buttons each. +2s confusion + occasional wrong-Commit click per session."
- PM §5: "FineTuneDrawer vs EditDrawer affordance not visually differentiated. Discovery
  cost: 6–10s." Ranked budget-eater #2.
- Frontend §7 item 7: "Extract shared EditActionTriad from CycleCard.js:48–56 and
  EditDrawer.js:229–239 — two independently maintained implementations."
- QA §3: dual triads create an ambiguous keyboard commit path; Tab exits drawer before
  reaching the canonical Commit.
- Competitive §3 §7: Akiflow keyboard-first path cited as north-star for <60s; single
  unambiguous commit surface is a prerequisite for keyboard-first to work.

### Latency math
Target: <60s update-and-start.
Estimated save: 8–13s per edit session (discovery: 6–10s + dual-triad confusion: 2–3s).
% of 60s budget: 13–22%.

### Specific change (current → proposed)
Current (two sub-problems):
(a) `CycleCard.js:49–56` renders `triad-edit` (Commit/Cancel/Undo). `EditDrawer.js:229–239`
renders an identical triad. When EditDrawer is open (`isEditing: true`), both are in the
DOM simultaneously. On smaller viewports, both are visible.
(b) FineTuneButton in the header says "Fine Tune" — a label that does not clearly indicate
"adjust capacity"; Edit button on CycleCard says "Edit" — does not clearly indicate "swap
activities."

Proposed:
(a) In `CycleCard.js`, gate `renderEditTriad` on `editMode === true AND editDrawerOpen === false`.
EditDrawer footer remains the canonical Commit surface when a drawer session is open.
CycleCard triad continues to render for inline edits (duration chip, start-time) that do not
open the drawer.
(b) Relabel FineTuneButton to "Adjust capacity" (or "Capacity"). Relabel CycleCard Edit
button to "Edit activities". Both are copy changes — no DOM structure change.

Keyboard shortcut (V2-5 scope): E key on focused block opens edit. This item handles the
Commit surface; V2-5 handles focus management and keyboard entry.

### Files likely touched
- `js/ui/components/CycleCard.js` lines 49–56: add `editDrawerOpen` guard to
  `renderEditTriad`.
- `js/ui/pages/Today.js` lines 238–248: pass `editDrawerOpen` state prop to CycleCard.
- `js/ui/components/FineTuneButton.js` or its label string: copy change only.
- CycleCard Edit button label: copy change in CycleCard.js template.
- Composer/engine boundary: not triggered.

### Acceptance criteria
1. Given Today in edit mode with EditDrawer open, when the page renders, then only one set
   of Commit/Cancel/Undo buttons is visible in the DOM — the EditDrawer footer set.
2. Given Today in edit mode WITHOUT EditDrawer open (e.g., duration chip inline edit),
   when the page renders, then the CycleCard triad-edit buttons are visible.
3. Given a user taps the FineTuneButton, when the label is read, then it says "Adjust
   capacity" (not "Fine Tune").
4. Given a user taps the CycleCard Edit button, when the label is read, then it says
   "Edit activities" (not bare "Edit").
5. Given Today.test.js ACCEPT/EDIT/REJECT triad assertions (Today.test.js:72–76), when
   this change ships, then all existing triad tests pass without modification (the Accept/
   Edit/Reject triad on the PROPOSED state is unchanged; only the edit-mode triad is gated).

### Risks + mitigations
- R1: `editDrawerOpen` state may not be a distinct boolean in current state shape — it may
  be derived from `editMode !== null`. Mitigation: derive `editDrawerOpen` from existing
  state shape (`editMode !== null && editMode.drawerOpen === true`); no new state field.
- R2: "Adjust capacity" label may break QA tests that assert on "Fine Tune" string.
  Mitigation: audit FineTuneDrawer tests for label assertions before shipping; update
  data-testid or data-action if test uses text match.
- R3: On smaller viewports where CycleCard triad is partially visible behind EditDrawer,
  the hidden triad may still receive Tab focus if pointer-events: none is not set.
  Mitigation: pair the visibility gate with `aria-hidden="true"` on the hidden triad.

### Suggested iteration
Pair with V2-1 and V2-5 in Iteration 22. All three affect the PROPOSED → EDIT flow and
share test surface in Today.test.js; one QA pass covers all three.

---

## Item 5: Focus Trap + Auto-Focus + E Shortcut (C-UX-6 extended)

### Convergence
4 lenses. Score ≥13 (§6.4 gate satisfied).
- QA §3: "Keyboard-only swap flow: Tab count to EditDrawer search: 10–20+. Exceeds 60s
  budget alone. Single fix: auto-focus first EditDrawer element on open + Escape restores
  focus. Cuts TOC to ~12."
- Frontend §7 item 6: shared DrawerShell with focus trap enforced in one place for both
  EditDrawer and FineTuneDrawer.
- Competitive §3 §7: "Akiflow/Sunsama keyboard-first command path — specifically E to edit
  focused block, Enter to commit. Highest-leverage change for <60s goal."
- UX §2 path (b): "Dual Commit triads add 2–3s confusion"; keyboard path without Escape
  handler forces mouse use to dismiss.

### Latency math
Target: <60s update-and-start (keyboard-only path).
Estimated save: 15–30s for keyboard-only users (QA TOC estimate: 25–45 ops → ~12 ops).
For mouse users: 2–5s per session (Esc vs hunting Cancel button; no hunt for EditDrawer
search box).
% of 60s budget recovered (keyboard): 25–50%.

### Specific change (current → proposed)
Current: `EditDrawer` opens; focus remains on the EDIT button in CycleCard. All activity
Start/Skip buttons in the dimmed page are in Tab order between EDIT and EditDrawer search
input. No Escape handler in the rendering code.

Proposed (three atomic changes):
(a) Auto-focus: when `EDIT_BEGIN` action fires and EditDrawer mounts, programmatically
focus `<input id="edit-search">` (EditDrawer.js first interactive element). This collapses
the 10–20+ Tab journey to 0 additional presses.
(b) Focus trap: while EditDrawer is open, Tab cycles within the drawer's focusable elements
only. Last element Tab wraps to first (search input). Shift+Tab from first element wraps
to last (Commit button). Escape returns focus to the CycleCard EDIT button and fires
EDIT_CANCEL.
(c) E shortcut: when no input/textarea is focused on Today, pressing E triggers EDIT_BEGIN
on the first SCHEDULED activity block. Equivalent to clicking the Edit button.

Focus trap implementation: on EditDrawer mount, build `focusableElements` array from
drawer DOM; add keydown handler for Tab and Escape; remove handler on unmount/EDIT_CANCEL.
No external library required — native DOM focusable query + two keydown cases.

### Files likely touched
- `js/ui/components/EditDrawer.js` — add focus-trap keydown handler on mount (lines
  after the opening `<aside>` render, tied to the `isEditing` lifecycle).
- `js/app.js` — EDIT_BEGIN handler: call `requestAnimationFrame(() => focusEditSearch())`
  after drawer mounts.
- `js/app.js` — global keydown handler: add `if (key === 'E' && !inputFocused) { dispatchEditBegin() }`.
- `app.css` — confirm no style hides the focused outline on EditDrawer search in
  `prefers-reduced-motion` or forced-colors contexts (C-UX-6 scope).
- Composer/engine boundary: not triggered.

### Acceptance criteria
1. Given Today in any non-editing state, when the user presses E with no input focused,
   then EDIT_BEGIN fires and EditDrawer opens.
2. Given EditDrawer opens (via E key or Edit button click), when the drawer is mounted,
   then focus is on the search input within 1 animation frame (≤16ms).
3. Given focus is inside EditDrawer, when the user presses Tab on the last focusable
   element, then focus wraps to the first focusable element (search input), not to the
   dimmed page background.
4. Given focus is inside EditDrawer, when the user presses Escape, then EditDrawer closes,
   EDIT_CANCEL fires, and focus returns to the CycleCard EDIT button.
5. Given Today.sprint12.test.js Tab-order DOM audit (V2-10 test), when this change ships,
   then `tab_index_of(edit-drawer-search) - tab_index_of(edit-btn) <= 3` passes via DOM
   focusable-element enumeration.

### Risks + mitigations
- R1: `requestAnimationFrame` focus call may fire before EditDrawer DOM is painted if
  innerHTML replace is synchronous but paint is deferred. Mitigation: use
  `setTimeout(focusEditSearch, 0)` as a fallback if rAF fires before paint on first test.
- R2: E shortcut conflicts if user has a native browser shortcut for E on this domain.
  Mitigation: gate shortcut on `document.activeElement === document.body ||
  document.activeElement === mainContent` — only fire when no element holds focus.
- R3: Focus trap breaks if EditDrawer renders new focusable elements dynamically (e.g.,
  catalog search results appear). Mitigation: rebuild `focusableElements` array on every
  keydown rather than caching at mount.

### Suggested iteration
Pair with V2-1 and V2-2 in Iteration 22. All three items affect the edit-mode flow and
share Today.test.js test surface. V2-5 adds the keyboard contract that V2-2's single
Commit surface requires to be keyboard-navigable.

---

## Cross-Item Sequencing

1. **Iteration 21: V2-4 + V2-3 + V2-10** (instrumentation + functional fix + proxy tests)
   Rationale: V2-4 starts the 14-day baseline clock. V2-3 is a functional correctness
   fix (not a redesign) and does not bias the comprehension baseline. V2-10 proxy tests
   run in the same pass at zero additional risk. These three items share no file surfaces
   (app.js route handler, app.css:1519, new test file).

2. **Iteration 22: V2-1 + V2-2 + V2-5** (visible v2 — comprehension + edit path)
   Rationale: Ships after the 14-day baseline window. V2-1 provides the largest single
   <10s saving. V2-2 resolves the dual-Commit ambiguity that V2-5's keyboard path depends
   on. All three touch Today.js edit-flow and can be validated in one QA pass. This is the
   iteration that actually moves the latency metrics.

3. **Iteration 23: V2-8 + V2-9 + V2-6 + V2-7** (signal quality — all S-effort)
   Rationale: AdherenceDial pip-row, NowPane deduplication, CycleCard sort order, and
   feasibility color are all display-only S-effort items with non-overlapping surfaces.
   Bundle them in one iteration after the primary comprehension/edit gains are confirmed.

---

## Total Effort

| Iteration | Items | Effort breakdown | BAM 24h/week loops |
|---|---|---|---|
| 21 | V2-4 + V2-3 + V2-10 | S + S + S | 1 loop |
| 22 | V2-1 + V2-2 + V2-5 | S + M + S | 1–2 loops (M item may extend) |
| 23 | V2-8 + V2-9 + V2-6 + V2-7 | S + S + S + S | 1 loop |

Total: 3–4 loops to ship all 10 Top v2 improvements.
The M-effort item (V2-2 single Commit surface) determines whether Iter 22 is 1 or 2 loops.
If drawer unification is explicitly ruled out by Phil (default: out of scope), V2-2 shrinks
to S effort (label copy changes + triad gate = <4h) and Iter 22 becomes 1 loop.

---

## Recommended Next Iteration (Iter 21)

**Instrumentation-first.** Ship V2-4 (C-AN-1) + V2-3 (BucketStrip fix) + V2-10 (CCC tests).

Rationale: The 10s and 60s targets are commitments, not hunches. Without a `TodayPageViewed`
baseline, v2 cannot distinguish between "we hit the target" and "we think we hit the target."
Shipping instrumentation first is the minimum necessary condition for treating v2 as a
measurable product improvement rather than a visual redesign. V2-3 ships alongside it because
it is a functional correctness fix that has been OPEN since Iteration 12 and does not affect
the comprehension baseline that V2-4 begins collecting.

The 14-day baseline window closes in time for Iteration 22, which ships the three highest-
impact visible changes (V2-1, V2-2, V2-5) with before/after numbers to validate them.
