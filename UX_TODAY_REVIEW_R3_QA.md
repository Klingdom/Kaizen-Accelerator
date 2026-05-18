# UX Today Page — QA Risk + Edge-Case Review R3
**Scope: Iter 47–49 deploy** (per-bucket render functions, kaizen sub-labels, BlockDetailDialog cleanup, dragController protected/in-progress hotfixes)
**Date:** 2026-05-18

---

## 1. Scope

### Files reviewed
- `js/ui/pages/Today.js` — header, ring, lunch tooltip, drag-confirm banner, block detail routing
- `js/ui/components/TodayGrid.js` — `blockWrapper`, `renderProjectBlock`, `renderCommBlock`, `renderCIBlock`, `renderLunchBlock`, `renderProtectedBlock`, dispatch table in `renderTodayBlock`
- `js/ui/components/BlockDetailDialog.js` — protected Edit-button removal, slotKind rationale, EoAR Start Reflection action
- `js/ui/dragController.js` — CLICK_THRESHOLD_PX deferral, DC-IP1-4 / DC-PR1-4 regression lock
- `app.css` — `.lunch-tooltip`, `.lunch-tooltip-content`, `.cycle-block-sacred`, `.bdd-rationale`, `.cycle-block-kaizen-sublabel`, `.cycle-block-ci-unlinked`
- `js/app.js` — `OPEN_BLOCK_DETAIL`, `DRAG_CONFIRM`, `DRAG_CANCEL`, `AUTO_PLAN`/`runCompose`, `state.dragSession`, `state.blockDetail`

### Test files reviewed
- `tests/ui/dragController.test.js` — DC-M*, DC-L*, DC-S*, DC-IP1-4, DC-PR1-4, DC-CD*, pending result shape
- `tests/ui/components/BlockDetailDialog.iter47.test.js` — AC7–AC12, AC15–AC16, META §A.2 orthogonal cases
- `tests/ui/components/TodayGrid.iter47.test.js` — AC1–AC6, AC13, AC15, AC17, AC18
- `tests/ui/components/TodayGrid.iter48.test.js` — kaizen sub-label, CI-unlinked indicator
- `tests/ui/pages/Today.iter47.test.js` — AC13, AC14 lunch tooltip
- `tests/ui/pages/Today.iter48.test.js` — lunch tooltip, kaizen sub-label

### Commit window
Iter 31–49 (Sprint 14 `ec97751` through Sprint 16a `6887cab`).

---

## 2. Top 3 Risks Right Now

### Risk 1 — Dark-mode contrast failure on `.lunch-tooltip-content` (MED severity)

**Severity:** MED
**Likelihood:** HIGH — any user with `data-theme="dark"` set hits this on every lunch click.

**Evidence:**
`app.css` line 712: `.lunch-tooltip-content` background is declared as:
```css
background: var(--color-surface, #fff);
```
The fallback `#fff` is hardcoded white. The dark-mode token layer at `app.css:3889` sets `--surface-page` and `--surface-card` but does NOT define `--color-surface`. The lunch tooltip therefore falls through to `#fff` in dark mode. At `#fff` background the label text uses `var(--color-text, #111827)` (also no dark override), which resolves to `#111827` — visually correct — but the surrounding scrim `rgba(0,0,0,0.08)` on a dark page produces near-invisible contrast with the white card appearing as a harsh white flash. The three child spans each use a distinct fallback token (`--color-text`, `--color-text-secondary`, `--color-text-muted`) that are also unmapped in the dark token block.

The rest of the codebase (BlockDetailDialog, TodayGrid blocks) uses `--surface-card` / `--text-primary` from the Iter 39 semantic token layer (`app.css:3839`). The lunch tooltip bypassed this in its Iter 47 addition.

**Recommended fix scope:** CSS only. Map `.lunch-tooltip-content` to `--surface-card` (not `--color-surface`). Replace the three child-span color fallbacks with `--text-primary`, `--text-secondary`, `--text-muted` respectively. No JS changes needed.

---

### Risk 2 — Unknown/future bucket silently renders as PROJECT in dispatch table (LOW severity, MED likelihood)

**Severity:** LOW (visual degradation, not data loss)
**Likelihood:** MED — a future composer bucket (e.g. `LEARNING`) would hit this without any log signal.

**Evidence:**
`TodayGrid.js:569–571`:
```js
// Generic fallback — render same as project block for unknown buckets.
const wrapCtx = { ...baseWrapCtx, payload };
return blockWrapper(wrapCtx, renderProjectBlock(activity, catalogEntry, sharedCtx));
```
No `console.warn`, no data attribute, no fallback CSS class that differs from `chip-unknown` already set at line 443. The `bucketChipClass` for unknown buckets is `chip-unknown` (line 443) but the content rendered is `renderProjectBlock` — so the block shows a PROJECT layout with an `chip-unknown` chip color. This is silently misleading. `bucketMeta` in `js/ui/bucketMeta.js` presumably returns a generic label for unknown buckets; that label is used for aria, but nothing is logged.

No test covers the `bucket: 'LEARNING'` (or any non-PROJECT/COMM/CI, non-null, non-protected) code path. Adding a `console.warn` here would make future bucket introduction detectable in development without blocking production.

**Recommended fix scope:** Single-line `console.warn` in the final else branch of `renderTodayBlock` (`TodayGrid.js:569`). Add one test for an unknown bucket value to lock the fallback behavior.

---

### Risk 3 — Concurrent drag-confirm + block-detail modal collision (MED severity, MED likelihood)

**Severity:** MED — two UI affordances active simultaneously; user cannot dismiss either cleanly without data uncertainty.
**Likelihood:** MED — requires PROPOSED composition + rapid click sequence, but no mutual-exclusion guard exists.

**Evidence:**
`app.js` maintains `state.blockDetail` and `state.dragSession` as independent slices (lines 372, 382). Neither the `OPEN_BLOCK_DETAIL` handler (line 1443) nor the `DRAG_START_PROPOSED` handler (line 2073) clears the other slice before writing its own:

```js
OPEN_BLOCK_DETAIL(payload) {
  state.blockDetail = { activityId: payload.activityId };
  rerender();
},
```
```js
DRAG_START_PROPOSED(payload) {
  ...
  state.dragSession = { activityId: ... };
  rerender();
},
```

If a PROPOSED-composition drag completes and the confirm banner appears, a user can then tap an unrelated block before dismissing the banner. Both `state.dragSession` (banner) and `state.blockDetail` (dialog) will be non-null simultaneously. `Today.js:323–328` renders `blockDetailHtml` unconditionally alongside `dragConfirmBannerHtml` at line 350. The rendered DOM has two modal-adjacent surfaces active at once: the drag-confirm `role="alert"` banner and the `role="dialog"` block detail panel.

This is not a data-corruption risk (neither action mutates persisted state without a further explicit user step), but it is a confusing interaction where the drag-confirm Confirm/Cancel buttons are partially obscured by the `bdd-modal` panel, and the Escape handler (`app.js:689`) for the dialog fires `CLOSE_BLOCK_DETAIL`, which does not clear `dragSession`, leaving an orphaned banner.

**Recommended fix scope:** Add a guard to `OPEN_BLOCK_DETAIL` that clears `state.dragSession` before opening the dialog, or vice versa. Alternatively, add a mutual-exclusion condition to `Today.js` render: only show `blockDetailHtml` when `!dragSession`. An integration test should cover this sequence.

---

### Candidate 4 — PROPOSED composition state race: DRAG_CONFIRM while Auto-Plan in-flight (LOW severity, LOW likelihood)

**Verdict: Refuted as a blocking risk.**

`runCompose` in `app.js:1227` is synchronous — it sets `state.composerLoading = true`, calls `composerService.composeDaily()` inline, then `state.composerLoading = false` in a `finally` block. There is no async gap. A concurrent DRAG_CONFIRM cannot arrive during the composer execution because JavaScript is single-threaded and the event loop does not yield during `runCompose`. The concern is valid conceptually but not exploitable in the current synchronous architecture. Revisit if `composeDaily` becomes async.

---

## 3. Edge Cases Worth Locking with Tests

### EC-1: Block at grid boundary (00:00 or 23:45)
`topOffsetPx` in `weekGridMath.js` returns `null` for times outside the grid window, causing `renderTodayBlock` to return `''` at `TodayGrid.js:430`. The default grid is 07:00–19:00. A block with `plannedStartAt: '06:00'` renders nothing silently. No test asserts that an activity starting before `gridStartHour` is dropped (nor that a warning surfaces). Lock: test that out-of-grid activities produce no output AND do not throw.

### EC-2: Lunch overlap with a manually-placed block
`detectOverlap` in `dragController.js:133` treats lunch blocks the same as any other activity — they have `plannedStartAt` and `plannedDurationMinutes`. If a user drags a PROJECT block onto the lunch window, `detectOverlap` fires `conflictBanner`. However, lunch blocks emit `OPEN_LUNCH_TOOLTIP` (not `OPEN_BLOCK_DETAIL`) and have no resize handle, so the user cannot move lunch to resolve the overlap. The conflict banner offers Revert or Keep. The "Keep" path leaves an overlap that the UI does not visually distinguish from a valid overlap. No test covers the lunch-as-overlap-target case in `detectOverlap` with a specifically protected/null-bucket activity.

### EC-3: Sacred CI block drag attempt (must be blocked at pointermove)
`TodayGrid.js:491–495`: `canDrag = !protected_ && !isLunch`. The EoAR block has no resize handle rendered (correct). However `isProtectedBlock` (imported from `editMode.js`) must return `true` for EoAR for the `dragController` `isProtected` callback to block the drag. The test DC-PR2 covers the generic protected path but does not use an EoAR fixture specifically. Lock: add DC-PR-EoAR test asserting that a block with `catalogEntryId: 'gen_end_of_activity_reflection'` triggers `onProtectedAttempt` on a drag > 5px.

### EC-4: IN_PROGRESS block clicked (must open BlockDetailDialog, not toast)
Validated by DC-IP1 and DC-IP4 in `dragController.test.js`. The deferred guard (pointermove not pointerdown) correctly allows `OPEN_BLOCK_DETAIL` to propagate. This edge case is adequately locked.

### EC-5: PROTECTED block clicked (must open BlockDetailDialog, not toast)
Validated by DC-PR1 and DC-PR4. Deferred guard correct. `BlockDetailDialog` for protected blocks omits Edit button (AC7 test passes). Adequately locked.

### EC-6: Empty schedule (no proposed/committed activities)
`Today.js:274–292` renders the empty-state branch when `!activeState`. `TodayGrid.js:665–667` renders an empty grid div when `!composition`. Both paths tested in `Today.test.js` and `TodayGrid.test.js`. No gap observed.

### EC-7: BlockDetailDialog opened on a stale activityId
`renderBlockDetailDialog` in `Today.js:589`: `activeState.activities.find((a) => a.id === blockDetail.activityId)`. Returns `''` silently when the activity is not found. This is correct behavior (no crash) but produces a visible empty frame flash on rapid plan-recompose during an open dialog. No test covers the case where `blockDetail` is set but the activity has been removed from `activeState.activities` between render cycles. Lock: add a unit test that calls `renderBlockDetailDialog` with a `blockDetail.activityId` not present in `activeState.activities` and asserts the return value is `''`.

---

## 4. Coverage Strengths

**dragController orthogonal discipline** is the strongest area in the suite. `tests/ui/dragController.test.js` covers 52 discrete assertions across DC-M1-4, DC-L1-11, DC-S1-5, DC-IP1-4, DC-PR1-4, and DC-CD1-6. The DC-IP and DC-PR quadruples are structurally identical (same four sub-cases per guard), enforcing the META §A.2 orthogonal rule at the test layer rather than relying on code review alone. This is textbook regression-lock discipline.

**BlockDetailDialog Iter 47 orthogonal coverage** in `tests/ui/components/BlockDetailDialog.iter47.test.js` explicitly tests the negative cases for every new AC: PROJECT blocks do not receive COMM rationale (AC10 orthogonal), non-EoAR CI does not get Start Reflection (AC11 orthogonal), user-added CI does not get ceremony rationale (AC12 orthogonal). The META §A.2 labels on those tests make the intent legible to future contributors.

**Per-bucket renderer isolation** in `tests/ui/components/TodayGrid.iter47.test.js` validates each of AC1–AC6 and AC13 with explicit fixture activities per bucket. The EoAR sacred class test (AC4/AC18) uses the literal `EAR_CATALOG_ID` constant value, which correctly couples the test to the same sentinel.

**Kaizen sub-label height gating** in `tests/ui/components/TodayGrid.iter48.test.js` tests the `SECONDARY_LINE_MIN_HEIGHT_PX = 56` threshold explicitly by constructing activities shorter than 56px-equivalent duration, confirming the sub-label is absent on short blocks.

---

## 5. Verdict

Ship with 2 caveats. The dark-mode contrast failure on `.lunch-tooltip-content` (Risk 1) is a guaranteed visual regression for every dark-mode user who taps a lunch block — it should be fixed before release, but it is a CSS-only two-line correction that does not risk data or state integrity. The drag-confirm + block-detail collision (Risk 3) is a confusing but non-destructive UX defect that should be tracked as a P1 follow-up; it requires a PROPOSED composition state and a specific tap sequence, making it low-frequency in practice but reproducible. The silent unknown-bucket fallback (Risk 2) is a developer-experience issue only and does not affect any current user. The DC-IP/DC-PR regression lock, the BlockDetailDialog AC7-AC12 orthogonal test coverage, and the per-bucket renderer isolation together represent a test suite that is meaningfully harder to accidentally break than the pre-Iter-47 single-render-function baseline. Do not ship without addressing Risk 1 (CSS dark-mode tokens on `.lunch-tooltip-content`).
