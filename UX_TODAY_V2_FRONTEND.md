# Today Page v2 — Frontend Lens (vs <10s + <60s targets)

---

## 1. Render-Cost Audit

**Call chain (every render):**
`click → handler mutates state → rerender() (app.js:2441) → renderApp(services, state) (app.js:524)`

renderApp does the following on every Today render, unconditionally:
- `composerService.getActiveComposition()` — repo read (app.js:536)
- `listOrphanActivitiesForDate(repo, todayDate)` — iterates all activity rows (app.js:542)
- `mergeOrphanActivities(activeState, orphans)` — array merge (app.js:543)
- `computeDaysSinceSignup(...)` — date arithmetic (app.js:544)
- `kaizenService.list({userId})` iterated into `kaizenTitleById` map (app.js:551–556)
- `catalogService.list(userId)` — full catalog read (app.js:558)
- `computePriorDayRecap(repo, userId, todayDate)` — scans all compositions + activities within 7-day window, then sorts candidates (app.js:561, 819–873)
- `computeEodRecap(...)` — walks activities array and calls reflectionService.listPending() (app.js:570–576)

Today() then calls (app.js:577–598):
- `validateEditState(activities, ...)` — O(n) sum over activities (Today.js:230–236)
- `NowPane({activities, nowIso})` — O(n) scan + sort (NowPane.js:76–123)
- `UpNextRail({..., variant:'rail'})` — O(n) scan + sort (Today.js:255–261)
- `UpNextRail({..., variant:'mobile'})` — **identical O(n) scan + sort repeated** (Today.js:263–270)
- `CycleCard(...)` → `renderActivityList(...)` → `ScheduledActivityBlock` × N (CycleCard.js:112–135)
- `EditDrawer(...)` when editing → `filterCatalog()` + `groupByBucket()` with O(k log k) sort (EditDrawer.js:272–273, 183–198)

**Rough per-render budget (8 activities, 40-entry catalog):**
Each ScheduledActivityBlock calls `formatTimeRange` (one `new Date` parse) and `bucketMeta()` lookup — ~N=8 date constructions. selectUpNext runs twice (same sorted output). computePriorDayRecap iterates and sorts all compositions on every EDIT_SELECT_SLOT. No memoization anywhere in the chain. On a keystroke in the edit search box, the entire chain runs in one synchronous frame.

**Heaviest single computation:** `computePriorDayRecap` (app.js:819) — iterates `Object.values(comps)`, builds candidates, sorts, then iterates `Object.values(acts)` filtered by compositionId. Cost grows linearly with total repo size; runs on every action including trivial ones like EDIT_SELECT_SLOT.

---

## 2. Interaction-Cost Audit

**1. Click swap chip (EDIT_SWAP):** Mutates `editMode.activities` by replacing one entry + pushes undo snapshot (deep-copied activities array). Full rerender: filterCatalog + groupByBucket re-sort entire catalog, all N ScheduledActivityBlock re-render, NowPane + UpNextRail (×2) recompute. Undo snapshot is a full deep clone of activities[]. Cost grows with catalog size and undo depth.

**2. Click duration chip (EDIT_CHANGE_DURATION, app.js:~1048):** Single field mutation on one activity. Full rerender identical to above — all N blocks re-render, catalog re-filtered, computePriorDayRecap re-runs. The only change visible to the user is one number on one block.

**3. Click start activity (START_ACTIVITY):** Writes state to repo, sets activity.state = 'IN_PROGRESS'. Full rerender. NowPane transitions from UPCOMING/OPEN_TIME to IN_PROGRESS. Two UpNextRail sorts re-run (the started activity disappears from upcoming list). Correct behavior, no obvious waste beyond the duplicate UpNextRail call.

**4. Click commit edit (EDIT_COMMIT):** Writes all editMode.activities to repo, nulls editMode, rerenders. EditDrawer unmounts (string becomes ''). One CycleCard re-render with new activity list. This is the heaviest write — acceptable at one-time cost.

**5. Click reject (composition REJECT action):** Writes composition.state = REJECTED to repo, rerenders. CycleCard switches to renderRejected — the lightest path. No inefficiency beyond the standard full-replace.

**Biggest inefficiency:** duration chip (interaction 2) — a one-field mutation triggers a full O(n) catalog sort + double UpNextRail sort + computePriorDayRecap repo scan, all for a change affecting one number on one block.

---

## 3. Component Boundaries vs Latency

**CycleCard** iterates activities at least twice per render in the happy path:
- `plannedFromActivities(activities)` inside renderProposed/renderAccepted — O(n) sum (CycleCard.js:163, 203)
- `renderActivityList(activities, opts)` — calls `orderActivitiesForDisplay` (O(n log n) sort) then maps N × ScheduledActivityBlock (CycleCard.js:112–135)
- `buildExplainById(composition)` — O(explain.length) to build lookup (CycleCard.js:145–157)

In the accepted path, `activities.find()` runs twice more: once for `IN_PROGRESS` and once for first `SCHEDULED` (CycleCard.js:205–207). So for ACCEPTED state: 2 finds + 1 sum pass + 1 sort + N block renders = 4 passes minimum.

**EditDrawer** runs `filterCatalog` + `groupByBucket` (including an O(k log k) sort) on every render regardless of whether search or filter changed (EditDrawer.js:272–273, 183–198). A search keystroke that appends one character re-sorts the entire matching set.

**Today.js** computes `validateEditState` on every render during edit mode (Today.js:230–236), even if activities did not change (e.g., after a bucket-toggle that only changes `expandedBuckets`).

---

## 4. State Shape vs Latency

**1. `editMode.undoStack` stores full deep-cloned activities arrays (app.js:350).** Each undo entry is a complete copy of the activities list. 20 swaps = 20 × N activity objects in memory. An index-based diff (record only `{activityId, before, after}` pairs) would cut memory and clone cost by ~90%.

**2. `editMode.activities` is initialized from a full deep clone of `activeState.activities` (app.js implied by EDIT handler pattern).** The clone is necessary for Cancel-reset correctness but means every EDIT_CHANGE_DURATION write re-clones the array before pushing to undoStack. A structural-sharing approach (only replace the mutated element) would reduce clone cost.

**3. `kaizenTitleById` rebuilt on every renderApp call** by iterating `kaizenService.list()` (app.js:551–556). It is a pure function of the kaizen list, which rarely changes. The map could be computed once and invalidated only on KAIZEN_* mutations.

**4. `computePriorDayRecap` called inside renderApp on every render** (app.js:561), scanning all compositions and activities. Result only changes on day rollover or after a new composition closes. It could be cached as `state.priorDayRecap` (computed once at boot and on EOD events) instead of recomputed per action.

**5. `validateEditState` called inside Today.js on every render** (Today.js:230), not inside the mutation handler. If called after each mutation instead and stored in `state.editMode.violations`, the render would read a cached value — eliminating one O(n) pass per keystroke.

---

## 5. CSS Layout Cost

**Mounted-but-hidden drawers:**
- `FineTuneDrawer` is rendered as a real `<aside>` on every Today render regardless of `fineTune.open` (Today.js:170–178). When closed it sets `aria-hidden="true"` and omits the `.ftd-open` class, but the DOM node is fully present. This is the correct pattern for a drawer that slides in — CSS transitions require a mounted node. Cost is acceptable if the drawer's subtree is small (it is: ~20 elements).
- `EditDrawer` only renders when `isEditing` (Today.js:237–248). It unmounts cleanly when edit mode closes — good.
- `ReflectionSheet` is rendered outside Today as `state.reflectionSheet ? ReflectionSheet(...) : ''` (app.js:599–601). Cleanly unmounted — good.
- `SkipReasonModal` and `OutputArtifactDialog` are string-rendered only when `openDialog` is non-null (Today.js:330–346). Cleanly unmounted — good.

**Layout thrash risk:** `mountHtml` replaces `el.innerHTML` once per action (mount.js, confirmed in prior review). No incremental patch. Every action forces a full subtree parse + layout. For the edit search input path (one keypress → full subtree replace), the browser must re-layout the entire `#app-root` on each character. No layout thrash within a render, but the replace frequency is the thrash.

**Big repaint on small changes:** Toggling `editMode.expandedBuckets` (EDIT_BUCKET_TOGGLE) triggers full innerHTML replace, repainting all N activity blocks + BucketStrip + NowPane + both UpNextRail variants. The visual change is one chevron flip and a list appearing — but the entire page subtree is replaced.

---

## 6. What's Architecturally Feasible Without Composer Changes

**Pure-renderer moves (no engine work, no §6.5 trigger):**

- Call `selectUpNext` once in Today.js, pass result to both UpNextRail variants — Today.js:255–270 (one-line change).
- Move `validateEditState` call from Today.js into the mutation handlers; cache result in `state.editMode.violations` — pure state shape change, no engine touch.
- Cache `computePriorDayRecap` result in `state.priorDayRecap`, recompute only on boot and on composition-state mutations — no engine change.
- Cache `kaizenTitleById` in state, invalidate on KAIZEN_* events — no engine change.
- Debounce `EDIT_SEARCH` rerender by 150–200ms — mount.js or handler change only.
- Extract `EditActionTriad` from CycleCard.js:48–56 and EditDrawer.js:229–239 — pure refactor.
- Extract `DrawerShell` wrapping FineTuneDrawer and EditDrawer — pure refactor.
- Suppress `FineTuneDrawer` from DOM when `!fineTune.open` by returning '' — reduces mounted subtree; loses CSS transition unless transition is redesigned.

**Moves that MUST touch composer/engine (§6.5 triggers):**

- Changing what `computePriorDayRecap` reads (e.g., adding friction signals to the morning recap) — touches ComposerService data contracts.
- Adding "tomorrow preview" to EOD closure strip — requires composeWeekly or a lookahead query on the engine.
- AdherenceDial real metrics (adherencePct, acceptancePct) — requires E9 Metrics service; confirmed placeholder in AdherenceDial.js:1–18.
- NowPane elapsed timer that auto-refreshes — requires a clock-tick mechanism that is not in the current event model (all renders are mutation-driven).

---

## 7. Top 8 Frontend-Lens Improvements (ranked by latency saved)

| # | Title | Current cost | After | Effort | Files touched |
|---|---|---|---|---|---|
| 1 | Cache `computePriorDayRecap` in state | O(all compositions + activities) on every action | O(1) read from state; recompute only on boot + CLOSE events | S | app.js (renderApp, handlers, createState) |
| 2 | Deduplicate `selectUpNext` call | O(n log n) sort ×2 per render | O(n log n) ×1 | XS | Today.js:255–270 |
| 3 | Debounce EDIT_SEARCH rerender (150ms) | Full rerender per keystroke | Full rerender at 150ms trailing edge | XS | app.js handler or mount.js |
| 4 | Move `validateEditState` into mutation handlers; cache in `state.editMode.violations` | O(n) on every render during edit | O(n) only on activity mutation | S | app.js (EDIT_SWAP, EDIT_CHANGE_DURATION, EDIT_UNDO, EDIT_REMOVE_SLOT), Today.js |
| 5 | Cache `kaizenTitleById` in state | `kaizenService.list()` + O(k) map rebuild per action | O(1) read; rebuild only on KAIZEN_* | S | app.js (renderApp, createState, KAIZEN handlers) |
| 6 | Index-based undo stack (replace full-clone with diff object) | N activity objects × 20 deep-cloned per undo entry | Single {activityId, before, after} object per undo entry | M | editMode.js (pushUndo, popUndo), app.js (EDIT_UNDO handler) |
| 7 | Extract shared `EditActionTriad` | Two independently maintained Commit/Cancel/Undo implementations | Single source; one change propagates to both CycleCard and EditDrawer | S | CycleCard.js:48–56, EditDrawer.js:229–239, new shared helper |
| 8 | Suppress `FineTuneDrawer` DOM when closed (or reduce to stub) | Full drawer subtree mounted always | '' or one-element placeholder when closed | XS | Today.js:170–178; CSS transition must be reconsidered |

---

## 8. Patterns Worth Extracting

**1. `selectUpNext` result — single-call + dual-variant pattern.**
Today.js calls UpNextRail twice with identical activities/nowIso (Today.js:255–270). The pattern of "compute once, render in two layout contexts" is already needed here and will recur on Week. Extract `selectUpNext` result as a local variable passed to both UpNextRail calls. When Week gains an UpNextRail, the same one-call pattern applies.

**2. `EditActionTriad({ undoCount })` helper.**
`renderEditTriad` (CycleCard.js:49–57) and `renderFooter` (EditDrawer.js:229–239) are structurally identical: Commit (primary) / Cancel (secondary) / Undo (ghost, disabled at 0). Per UX_DESIGN_THEMES §3.3, EditDrawer footer is canonical when drawer is open; CycleCard triad is canonical for inline edits. Both should render from one helper so a label change (e.g., "Save" → "Commit") propagates in one edit.

**3. `DrawerShell({ title, subtitle, dismissAction, body, footer })` component.**
Both FineTuneDrawer.js and EditDrawer.js open with `<aside role="dialog">` + header (title + ×) + scrollable body + sticky footer. The shell structure is identical; only body content differs. A shared shell eliminates the next independent drawer implementation and enforces the focus-trap fix (C-UX-6) in one place instead of two.

**4. Memoization contract for pure-data transforms.**
`plannedFromActivities` (BucketStrip.js:135), `buildExplainById` (CycleCard.js:145), `selectUpNext` (UpNextRail.js:89), `validateEditState` (editMode.js:203) are all pure functions of their inputs and never memoized. A lightweight `memo(fn, keyFn)` utility (one-entry last-call cache) applied to these would recover O(n) work on renders where inputs did not change. The pattern is reusable on Week and Portfolio where similar O(n) transforms run per-render.

**5. `computedForToday` state sub-object (lazy derivation cache).**
`priorDayRecap`, `kaizenTitleById`, and `eodRecap` are all pure functions of repo state that change infrequently but are recomputed on every action. A `state.computedForToday = { priorDayRecap, kaizenTitleById, eodRecap, _dirtyFlags }` sub-object that renderApp reads (and only recomputes when flagged dirty) would cut Today render cost by ~30% in edit-mode churn. Week could adopt the same pattern for `weeklyComposition` derivations.

---

## 9. Risk Register for the v2 Pass

**R1 — `computePriorDayRecap` cache invalidation mismatch.**
Probability: Medium. Impact: High. If caching priorDayRecap in state, it must be invalidated when a prior-day composition's activity state changes (e.g., a CLOSE that happens at 23:59 and the user reloads at 00:01). The current per-render recompute is immune to this; a cached version is not. Mitigation: recompute on boot and on any CLOSE_ACTIVITY / SKIP_ACTIVITY event that touches a non-today composition. Gate by date check.

**R2 — Undo stack index-diff breaks Cancel-restore contract.**
Probability: Medium. Impact: Medium. `editMode.snapshotActivities` (the Cancel target) is a full clone taken at EDIT_OPEN. If the undo stack shifts to diffs, the Cancel path still works (it reads snapshotActivities, not the stack). But EDIT_UNDO would need to replay diffs backward. If any handler produces a diff that is not perfectly reversible (e.g., a generated ID on EDIT_ADD_SLOT), the replay would diverge. Mitigation: keep full-clone for EDIT_ADD_SLOT entries; use diff only for EDIT_SWAP and EDIT_CHANGE_DURATION where before/after are deterministic.

**R3 — Debounced EDIT_SEARCH causes stale state read on rapid clear.**
Probability: Low. Impact: Low. If a user types and immediately clears the search box within the debounce window, the pending rerender fires against the now-empty search string but was scheduled against the typed string. Because renderApp reads `state` at call time (not closure time), the stale render risk is zero — by the time the debounce fires, `state.editMode.searchQuery` reflects the latest value. Risk is effectively nil; noted for completeness.

**R4 — DrawerShell extraction breaks FineTuneDrawer transition.**
Probability: Low. Impact: Medium. FineTuneDrawer currently mounts always and uses a CSS class toggle (`.ftd-open`) for slide-in. If DrawerShell wraps both drawers and the EditDrawer pattern (render '' when closed) is adopted uniformly, FineTuneDrawer loses the mounted node needed for CSS transition. Mitigation: DrawerShell accepts a `mounted` prop: when false, render a zero-height placeholder that CSS can transition from rather than ''.

**R5 — `formatTimeRange` DST offset already flagged as C-QA-3 (score 12, OPEN).**
Probability: Medium. Impact: Medium. Every ScheduledActivityBlock calls `formatTimeRange` (ScheduledActivityBlock.js:190). Non-Z ISO inputs silently mis-display. A v2 pass that introduces timezone-aware times (e.g., showing tomorrow's activities on the EOD strip) would surface this bug. Mitigation: land C-QA-3 DST test before any cross-day time display is added.
