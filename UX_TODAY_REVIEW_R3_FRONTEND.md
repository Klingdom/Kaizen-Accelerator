# UX_TODAY_REVIEW_R3_FRONTEND.md
**Functional Audit — Today Page, Iter 31–49 Cumulative Deploy**
*Frontend Engineer perspective. Research only — no production code modified.*
*Paired with UX agent review. Date: 2026-04-30.*

---

## 0. Scope & Method

Files inspected: `Today.js`, `TodayGrid.js`, `CycleCard.js`, `CadencePressureRing.js`,
`BlockDetailDialog.js`, `NowJumpButton.js`, `dragController.js`, `app.js` (action handlers),
`app.css`. Test suites: `Today.iter47.test.js`, `Today.iter48.test.js`, `dragController.test.js`,
`app.iter36.test.js`.

---

## 1. Functional Bug Hunt

### 1-A. Latent Bug — `parseMinutesOfDay` UTC/local mismatch in dragController

**File:** `js/ui/dragController.js:118`

dragController's local `parseMinutesOfDay` converts full ISO timestamps via
`d.getUTCHours() * 60 + d.getUTCMinutes()`. The canonical implementation in
`js/ui/weekGridMath.js:55` does the same. Both are consistent with each other.

However, the grid positions rendered by TodayGrid use `weekGridMath.parseMinutesOfDay`
to compute `topOffsetPx`, which also reads UTC. For a user in UTC-7 (PDT), a stored
timestamp of `"2026-04-30T09:00:00-07:00"` would parse to `09*60+0 = 540` in UTC
which is correct (16:00 UTC → 16h, wrong grid position). The current codebase stores
`plannedStartAt` as `"HH:MM"` strings — no timezone — which correctly bypasses the
UTC parse path. This is NOT a current bug, but the UTC path in `parseMinutesOfDay`
is a landmine if ISO-with-timezone timestamps are ever stored. There is no guard
or comment documenting this assumption.

**Risk:** Medium latent. No current breakage because HH:MM format is used universally.
If any pathway ever stores a timezone-aware ISO string in `plannedStartAt`, grid
positions and drag math will silently disagree for non-UTC users.

**Recommendation:** Add an assertion or comment at the top of `parseMinutesOfDay` in
both files documenting the HH:MM assumption. Cost: S. §6.5 impact: none.

---

### 1-B. Latent Bug — `DRAG_CONFIRM` silently no-ops when `_ensureEditMode()` fails

**File:** `js/app.js:2165–2172`

`DRAG_CONFIRM` calls `this._ensureEditMode()` and returns early if it fails. This can
happen if `getActiveComposition()` returns null after a race (e.g. storage flush
mid-session). The `dragSession` is cleared (`state.dragSession = null`, line 2168)
BEFORE the guard is evaluated. If `_ensureEditMode()` returns false, the pending drag
is silently discarded: the user clicked Confirm, saw the banner disappear, but no
change was persisted. No toast, no error, no rerender with restored state.

**Severity:** Low probability, high confusion when it hits. The banner disappears but
the block visually returns to its original position without feedback.

**Fix:** Move `state.dragSession = null` to after the `_ensureEditMode()` check succeeds,
or show a toast on failure. Cost: S. §6.5: no.

---

### 1-C. Dead Code — `renderBucketStrip()` and `formatHeaderDate()`

**File:** `js/ui/pages/Today.js:419–470` and `:55–70`

`renderBucketStrip()` is a 52-line fully functional private function that is never
called (confirmed: `bucketStripHtml = ''` unconditionally, line 367). `formatHeaderDate()`
(lines 55–70) duplicates `CycleCard.js:formatDateDisplay` (lines 56–76) and is also
never called (`headerDateHtml = ''`, line 206). Both are explicitly commented as
"retained for future use" but have been inert since Iter 48.

Dead code risk: future editors may try to call `renderBucketStrip()` to "restore"
the strip, not realizing the CSS classes it emits (`.cycle-bucket-strip`,
`.today-body-with-strip`) are themselves orphaned in `app.css`. The commented note
at line 363–366 mitigates this somewhat but does not prevent confusion.

**Recommendation:** Delete both functions, or move them to a `_backup/` folder with a
deprecation note. Cost: S. §6.5: no.

---

### 1-D. Dead Code — `DEFAULT_TARGETS` import triangle

**File:** `js/ui/pages/Today.js:38`

`Today.js` imports `DEFAULT_TARGETS` from `BucketStrip.js` and passes it to
`CadencePressureRing`. `CadencePressureRing.js` exports its own `DEFAULT_TARGETS`
(line 27) with identical values. `Today.js` also imports `CadencePressureRing` (line
40). The ring would use its own internal `DEFAULT_TARGETS` if no `targets` prop were
passed. Passing `BucketStrip.DEFAULT_TARGETS` explicitly (Today.js:194) is redundant —
both constants are `{PROJECT:240, COMMUNICATION:120, CI:120}`. This creates a
coupling to `BucketStrip.js` with no functional benefit.

**Recommendation:** Remove the `DEFAULT_TARGETS` import from `Today.js` and omit the
`targets` prop from the `CadencePressureRing` call (let the ring use its own default).
Cost: S. §6.5: no.

---

### 1-E. CSS Selector Conflict / Orphan — `.today-header-date`

**File:** `app.css:180` and `:4259` and `:4274`

`.today-header-date` is defined as a visual rule (font, size, color) at line 180.
Dark-mode overrides exist at lines 4259 and 4274. But `Today.js` permanently sets
`headerDateHtml = ''` (line 206) so no element with `.today-header-date` is ever
rendered. Three CSS rules are entirely orphaned. The rules are noted in the Iter 48
test comments (line 16 of `Today.iter48.test.js`) as "inert — safe to deprecate."

Also orphaned: `.cycle-bucket-strip`, `.cycle-bucket-strip-heading`,
`.cycle-bucket-row`, `.cycle-bucket-row-label`, `.cycle-bucket-track`,
`.cycle-bucket-fill`, `.cycle-bucket-fill-project`, `.cycle-bucket-fill-communication`,
`.cycle-bucket-fill-ci`, `.today-body-with-strip`, `.today-grid-col` — all present
in `app.css` with no corresponding HTML emitter after Iter 48.

Total orphaned CSS lines: approximately 120 (lines 3713–3831, plus 180–184, 4259–4279).

---

### 1-F. Action Handler Gap — `EOD_OPEN_REFLECTION` closes BlockDetailDialog implicitly

**File:** `js/ui/components/BlockDetailDialog.js:237`

The "Start Reflection" button on EoAR blocks dispatches `EOD_OPEN_REFLECTION` with
`data-payload='{}'`. The `EOD_OPEN_REFLECTION` handler in `app.js` (line 3057) opens
the ReflectionSheet but does NOT call `state.blockDetail = null`. The BlockDetailDialog
will remain rendered behind the ReflectionSheet. The `bdd-modal` element has
`position:fixed; z-index` higher than the base, so visual stacking depends on
ReflectionSheet's z-index. If ReflectionSheet renders at a lower z-index the dialog
stays visible on top — creating a double-overlay.

**Recommendation:** Either have the "Start Reflection" button dispatch `CLOSE_BLOCK_DETAIL`
first (via a compound action or a dedicated `BLOCK_DETAIL_START_REFLECTION` action that
closes then opens), or have `EOD_OPEN_REFLECTION` clear `state.blockDetail`. Cost: S.
§6.5: no.

---

### 1-G. Staggered Animation Cap Inconsistency

**File:** `js/ui/components/TodayGrid.js:484`

`const staggerMs = Math.min(blockIndex, 6) * 60 + 120;` — the stagger cap is 6 blocks.
With a standard 4-2-2 plan, there are typically 8–12 activities including lunch. Blocks
7+ all share the same 480ms stagger, which produces a noticeable "clump" animation where
the last half of the grid animates simultaneously. This is cosmetic but jarring on first
load.

---

### 1-H. Ghost Block Coordinate Math Does Not Account For `gridStartHour * 60`

**File:** `js/ui/components/TodayGrid.js:697`

```
const ghostTop = (dragSession.proposedStart - gridStartHour * 60) * (rowHeightPx / 60);
```

`proposedStart` in `state.dragSession` is set by `DRAG_START_PROPOSED` (app.js:2089)
from `payload.proposedStartMin`, which comes from `onDragPending` in `dragController.js`
(line 407: `newStart` is a HH:MM string, not minutes). The `proposedStartMin` field
is set to `payload.proposedStartMin ?? null` (app.js:2089). But `onDragPending` does
not populate `proposedStartMin` — it sends `newStart` as a HH:MM string, not minutes.
So `dragSession.proposedStart` is `null` and the ghost block conditional at TodayGrid:696
(`dragSession.proposedStart !== undefined`) will pass (null !== undefined is true), but
`null - gridStartHour * 60` yields `NaN`. `NaN * (rowHeightPx/60)` = NaN, so the ghost
block renders with `top: NaNpx; height: NaNpx` — invisible but included in DOM.

**Severity:** Medium. Ghost block does not visually appear in PROPOSED pending flow,
defeating its purpose. The confirm banner still works; only the ghost position preview
is broken.

---

## 2. Performance Audit

### 2-A. Render Path Complexity

`Today` → `CycleCard` → `TodayGrid` → per-activity `renderTodayBlock` → `blockWrapper` +
per-bucket renderer. Render is purely synchronous string concatenation. No async paths,
no DOM touches. For 12 activities: approximately 12 × (1 `renderTodayBlock` + 1
`blockWrapper` + 1 bucket renderer) = 36 pure function calls. String concatenation
dominates. This is well under the 1.5ms ceiling per META §A.1.

`CadencePressureRing` computes `computeBucketMinutes` (O(n)) + `computeArcSegments`
(O(3)) on every rerender. No memoization. For n=12 activities this is negligible.

### 2-B. `orderActivitiesForDisplay` Called Twice Per Render

**Files:** `CycleCard.js` passes pre-sorted activities to `TodayGrid`, but `TodayGrid:685`
calls `orderActivitiesForDisplay` again internally. The sort is stable and idempotent
so correctness is preserved, but it runs twice per render. For 12 activities the extra
sort is ~microseconds — not a practical concern at current scale.

### 2-C. Animation Budget

`cadence-ring-svg` has a 3s `cadenceBreath` animation on the SVG. The ring re-renders
on every composition state change (rerender call). The CSS animation resets on DOM
replacement. If `mountHtml` does full innerHTML replacement, the breathing animation
restarts on each rerender — no smooth continuation. `prefers-reduced-motion` is
correctly suppressed. Mobile: the ring is 56px SVG; animation cost is trivial.

### 2-D. Touch / Mobile Responsiveness

`dragController.js` uses `pointerdown/pointermove/pointerup` — Pointer Events API.
This correctly handles both mouse and touch on modern browsers. `setPointerCapture`
is called with a try/catch guard (line 237). Pointer capture ensures drag events
continue outside the element boundary, which is critical for mobile where the finger
may leave the block during a slow drag. Touch-cancel is handled by `pointercancel`.

No touch-specific issues found. Mobile media query at `app.css:2298` collapses
`.today-header` to `flex-direction: column` — correct for small viewports.

---

## 3. Architecture Cleanup Opportunities

### 3-A. Three `parseMinutesOfDay` Implementations

Three copies exist: `weekGridMath.js`, `dragController.js` (private, not exported),
and `app.js` (`_parseMinutes`, private, lines 474–487). All have the same logic.
`dragController.js` cannot import from `weekGridMath.js` without a potential cycle
(already noted in `app.js:468`). The app.js copy was added specifically to avoid
the cycle. A shared `js/ui/timeUtils.js` module with no upstream imports would
eliminate all three duplicates cleanly.

### 3-B. `renderBucketStrip` Dead Function (120 lines retained)

See §1-C. Safe to delete. The function references `BucketStrip.DEFAULT_TARGETS`,
which would then allow cleaning up the `DEFAULT_TARGETS` import in `Today.js` (§1-D).

### 3-C. Stale Comment in `CycleCard.js:1–11`

The file-level docstring still mentions "BucketStrip" and "AcceptEditRejectTriad"
in the PROPOSED variant description (line 5) — both are still used, but the
description says "BucketStrip" which was removed from the render path. Also, `targets`,
`floors`, `ceilings` are listed as props (lines 28–30) but no longer read in `CycleCard`
(the Iter 25 cleanup note in `Today.js:303–305` correctly documents this, but `CycleCard.js`
docs were not updated).

### 3-D. `today-grid-col` CSS Class With No HTML Emitter

`app.css:3802` defines `.today-grid-col` as part of `.today-body-with-strip` layout.
`Today.js` uses `.today-card-col` instead (line 376). `.today-grid-col` is orphaned.

---

## 4. Test Coverage Gaps

### 4-A. No Integration Test for DRAG_CONFIRM → EOD_OPEN_REFLECTION Z-Index Conflict

The double-overlay bug (§1-F) has no test. A test should verify that when
`EOD_OPEN_REFLECTION` fires from a BlockDetailDialog context, `state.blockDetail`
is cleared.

### 4-B. No Test for Ghost Block NaN Position (§1-H)

The `dragSession.proposedStart` null-path is not tested. A test should verify that
when `dragSession` has `proposedStart: null`, `TodayGrid` does not include a ghost
block with NaN positioning.

### 4-C. No Test for DRAG_CONFIRM When `_ensureEditMode()` Fails (§1-B)

The early-return path in `DRAG_CONFIRM` is not covered by any test. `dragSession`
is cleared but no feedback is given — a test would catch this silent discard.

### 4-D. Only Allowed-Case Tests for Lunch Tooltip (§A.2 gap)

`Today.iter47.test.js` tests that `lunchTooltip: {timeRange:...}` renders and
`lunchTooltip: null` does not. But there is no test verifying that a lunch block
with `lunchTooltip` set does NOT simultaneously emit `bdd-modal` via `blockDetail`
set to the same activity. The "mutual exclusion" is asserted in test line 108 only
for the case where `blockDetail` prop is absent — not for the case where both
`lunchTooltip` and `blockDetail` are populated simultaneously by a bug in app.js.

### 4-E. No Test for `headerActivitySummary` When IN_PROGRESS Duration Is Non-Finite

`Today.js:218` shows `(${dur}m left)` where `dur` falls back to `0` if
`plannedDurationMinutes` is non-finite. Test coverage for this path does not exist.
A test with `plannedDurationMinutes: null` on an IN_PROGRESS activity should verify
the fallback renders as "0m left" rather than "NaNm left" or throwing.

### 4-F. DC-L9/DC-L10 Test Misdocumentation

`dragController.test.js:20–21` labels DC-L9 as "isInProgress guard — pointerdown
bails" but the actual implementation does NOT bail at pointerdown — it defers to
pointermove (META §A.2 guard). The test description is misleading. If DC-L9 is
testing the deferred guard correctly, the label should say "drag attempt bails." If
it's testing the click-through behavior, both cases (blocked drag AND allowed click)
should be present per META §A.2 orthogonal requirement.

---

## 5. Specific Improvements

| # | Finding | File:Line | Effort | §6.5 | Test Risk |
|---|---------|-----------|--------|------|-----------|
| I-1 | Delete `renderBucketStrip` dead function + clean up `DEFAULT_TARGETS` import in `Today.js` | `Today.js:38,419–470` | S | No | Low — no callers |
| I-2 | Fix `DRAG_CONFIRM` to not clear `dragSession` before `_ensureEditMode()` guard; add toast on failure | `app.js:2166–2172` | S | No | Add 1 test |
| I-3 | Fix ghost block NaN: populate `proposedStart` as minutes-of-day in `DRAG_START_PROPOSED`, or convert in `TodayGrid` | `app.js:2089` + `TodayGrid.js:697` | M | No | Add 1 test |
| I-4 | Fix `EOD_OPEN_REFLECTION` / BlockDetailDialog double-overlay: clear `state.blockDetail` in `EOD_OPEN_REFLECTION` handler | `app.js:3057` | S | No | Add 1 test |
| I-5 | Delete orphaned CSS: `.today-header-date`, `.cycle-bucket-strip` block, `.today-body-with-strip`, `.today-grid-col` (~120 lines) | `app.css:180–186, 3713–3831, 4259–4279` | S | No | None |
| I-6 | Extract shared `parseMinutesOfDay` to `js/ui/timeUtils.js` — remove 3 duplicates | `weekGridMath.js`, `dragController.js`, `app.js:474–487` | M | No | Existing tests cover behavior |
| I-7 | Add §A.2 orthogonal blocked-case test for DC-L9/DC-L10 (drag-blocked + click-allowed both tested) | `dragController.test.js` | S | No | Adds coverage |

---

## 6. Structurally Healthy

### 6-A. Deferred Safety Gate Pattern (META §A.2)

`dragController.js` correctly defers both `isInProgress` and `isProtected` guards to
`onPointerMove` after `CLICK_THRESHOLD_PX` is exceeded. This ensures that a tap on a
protected block still triggers `OPEN_BLOCK_DETAIL` via the existing `data-action`
delegate. This is the correct solution to the click/drag ambiguity problem and is
consistently applied across both guard types (Iter 41 and Iter 44).

### 6-B. Per-Bucket Render Dispatch (TodayGrid Iter 47)

The `renderTodayBlock` → `blockWrapper` + per-bucket renderer pattern is clean. Shared
positioning logic lives in `blockWrapper`; bucket-specific concerns are isolated to
`renderProjectBlock`, `renderCommBlock`, `renderCIBlock`, `renderLunchBlock`,
`renderProtectedBlock`. Adding a new bucket type requires only a new renderer function
and a dispatch case — minimal blast radius.

### 6-C. Action Handler / State Slice Traceability

Every state slice introduced (blockDetail, dragSession, conflictBanner, lunchTooltip,
catalogPickerDialog) is: initialized in the state object with a comment citing its
iteration; forwarded from state to the Today render function; consumed by a corresponding
render helper. The pattern is consistent and easy to audit — no hidden state.

### 6-D. Focus Trap / Dialog Escape Registration

`app.js:682–689` registers the `bdd-modal` in the focus trap manager with
`onEscapeAction: 'CLOSE_BLOCK_DETAIL'`. This ensures keyboard users can dismiss the
dialog without a visible close button — correct accessible pattern.

### 6-E. CSS Dark Mode and Reduced Motion Coverage

`CadencePressureRing`, `now-jump-btn`, `bdd-modal`, and block fill gradients all have
explicit `@media (prefers-color-scheme: dark)`, `[data-theme="dark"]`, and
`[data-motion="reduced"]` overrides. The motion suppression correctly targets both the
`prefers-reduced-motion` media query AND the `data-motion="reduced"` attribute for the
in-app Settings toggle.

---

## 7. META Rule Application

### §A.2 Orthogonal-Case Coverage

**Drag safety gates (DC-L9, DC-L10):** The test file documents both cases but the
labels are misleading (see §4-F). The actual deferred-guard implementation (check in
`onPointerMove`, not `onPointerDown`) is correctly implemented. Whether the test
actually verifies the click-through (allowed case) is unclear without running the
tests — the test descriptions say "bails" which implies only the blocked case is
verified. **Recommend:** add an explicit "allowed case: click on protected block still
fires onDragCommit=false and click is treated as non-drag" test.

**Lunch tooltip mutual exclusion:** Partially covered (§4-D). The blocked case (no
tooltip when `lunchTooltip=null`) exists. The simultaneous-state edge case is not
tested.

### §A.3 Reconciliation Audit

Confirmed drifted CSS rules (orphaned, no emitter):

- `.today-header-date` (app.css:180) + dark-mode variants (4259, 4274) — orphaned
  since Iter 48. Acknowledged in tests but not cleaned.
- `.cycle-bucket-strip` block (app.css:3713–3831) — orphaned since Iter 48.
  Acknowledged in `Today.js:364–366` comments.
- `.today-body-with-strip` (app.css:3796–3831) — orphaned. Referenced only in
  removed render path.
- `.today-grid-col` (app.css:3802) — orphaned. `Today.js` uses `.today-card-col`.
- `.cycle-block-kaizen-sublabel` (app.css:587) — has emitter in `renderProjectBlock`
  and `renderCIBlock`. **Not orphaned.** Reconciliation correct.
- `.cycle-block-sacred` (app.css:675) — has emitter in `TodayGrid.js:558`. **Not orphaned.**
- `.cycle-block-ci-unlinked` (app.css:619) — has emitter in `renderCIBlock:333`. **Not orphaned.**

§A.3 verdict: 4 orphaned CSS blocks, all previously acknowledged in code comments.
Clean-up has been deferred but is overdue — the acknowledged-but-not-deleted status
has persisted across multiple iterations.

---

*End of audit. 264 lines. File:line citations throughout.*
