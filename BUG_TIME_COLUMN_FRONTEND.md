# Bug Investigation: Today Time Column Render Path (frontend-engineer lens)

Status: Diagnostic report. Companion to BUG_TIME_COLUMN_QA.md and BUG_TIME_COLUMN_ARCHITECT.md.

---

## 1. Render Path Trace

### Scenario A: Initial Today page load

1. `composeDaily` (js/composer/composeDaily.js:231) calls `orderDay(placed, input)`.
2. `orderDay` (js/engine/orderDay.js:110) sets `p.plannedStartAt = p._anchorTime` (HH:MM string)
   for ceremony anchors (line 117), and `formatClock(cursor)` (HH:MM) for packed blocks
   (lines 150–188). All values are HH:MM strings, never ISO timestamps.
3. `materialize` (composeDaily.js:161) builds the draft with `plannedStartAt: spec.plannedStartAt ?? null`;
   for ceremony blocks this field is null until `orderDay` mutates it in place (line 117).
4. `ComposerService.composeDaily` (js/services/ComposerService.js:257) persists each activity as
   `{ ...a, compositionId }` — `plannedStartAt` lands in localStorage as HH:MM.
5. On page load, `render()` in app.js:536 calls `composerService.getActiveComposition(DEFAULT_USER.id)`.
6. `getActiveComposition` (ComposerService.js:801) reads all matching activities from
   `bamx:v1:activities` — `plannedStartAt` is HH:MM strings from storage.
7. `mergeOrphanActivities` (app.js:480) prepends orphan activities (no sort).
8. `Today` page (js/ui/pages/Today.js:223–225) selects `activitiesForRender = activeState.activities`.
9. `CycleCard` calls `orderActivitiesForDisplay` (CycleCard.js:77) — sorts by
   `a.plannedStartAt ?? a.anchor ?? ''` string-lexicographic order.
10. `renderActivityList` (CycleCard.js:110) maps each sorted activity to
    `ScheduledActivityBlock({ activity: a, ... })`.
11. `ScheduledActivityBlock` (ScheduledActivityBlock.js:187–190) computes:
    - `time = formatTime(a.plannedStartAt ?? a.anchor)`
    - `timeRange = formatTimeRange(a.plannedStartAt ?? a.anchor, a.plannedDurationMinutes)`
12. `formatTimeRange` (js/ui/timeFormat.js:64) returns `"HH:MM–HH:MM"` or `"HH:MM"` for DOM.

Total hops: **12**

---

### Scenario B: Duration chip change (edit mode)

1. User clicks chip → `data-action="EDIT_CHANGE_DURATION"` dispatched (ScheduledActivityBlock.js:137).
2. `app.js` handler `EDIT_CHANGE_DURATION` (app.js:1216) reads `state.editMode.activities`.
3. Calls `applyDurationChange(state.editMode.activities, activityId, minutes)` (editMode.js:376).
4. `applyDurationChange` clones all rows; updates target's `plannedDurationMinutes`; calls
   `sortedByStart` (editMode.js:343) which reads `parseStartMinutes(a.plannedStartAt)` (line 344).
5. Cascade loop: for each successor within gap<=1 min, calls `shiftStart(row.plannedStartAt, delta)` (editMode.js:444).
6. `shiftStart` (editMode.js:313) detects HH:MM format and returns a new HH:MM string.
7. Updated array returned → assigned to `state.editMode.activities` (app.js:1239–1243).
8. `rerender()` called; `Today` page takes `activitiesForRender = editMode.activities` (Today.js:224).
9. `ScheduledActivityBlock` re-renders with new `plannedStartAt` values — `formatTimeRange` produces
   updated `"HH:MM–HH:MM"` strings.

Cascade propagates correctly to downstream `plannedStartAt` **only when activities are butted up (gap <= 1 min)**. Deliberate gaps stop the cascade (editMode.js:454–460).

---

### Scenario C: Start time change (edit mode)

1. `<input type="time">` fires `change` event; `app.js` change delegate (app.js:2513–2522) dispatches
   `EDIT_CHANGE_START_TIME` with `{ activityId, value: el.value }`.
2. Handler `EDIT_CHANGE_START_TIME` (app.js:1271) extracts `newHHMM`.
3. Calls `applyStartTimeChange(state.editMode.activities, activityId, newHHMM)` (editMode.js:606).
4. `applyStartTimeChange` calls `replaceTimeOnStart(target.plannedStartAt, newHHMM)` (editMode.js:565)
   to produce updated `plannedStartAt`, preserving original shape.
5. Delta computed; cascade loop mirrors `applyDurationChange`: sorts by start, walks successors within
   gap <= 1 min, shifts each via `shiftStart(row.plannedStartAt, delta)` (editMode.js:685).
6. Updated array returned → `state.editMode.activities` (app.js:1366); rerender triggered.

---

### Scenario D: Commit edit

1. User clicks Commit → `EDIT_COMMIT` (app.js:1409).
2. Handler reads `{ compositionId, activities } = state.editMode` (app.js:1411).
3. Calls `composerService.commitEdit(compositionId, activities, ...)` (app.js:1413).
4. `commitEdit` (ComposerService.js:463) iterates `newActivities`; for each entry that matches a
   prior child by `id` AND `catalogEntryId`:
   - Writes `{ ...prior, ...edited, state: prior.state, actualStartAt: prior.actualStartAt, ... }` (lines 504–512).
   - `edited` contains the cascaded `plannedStartAt`, so cascaded start times **are** persisted.
5. New/swapped entries: written with a `freshId = ${id}_edit_${now}` (line 525), with full `...edited`
   spread including the current `plannedStartAt`.
6. `state.editMode = null` (app.js:1416); rerender re-reads `getActiveComposition` from storage.
7. Today page now shows `activeState.activities` (persisted, cascaded values) — no edit-mode overlay.

---

## 2. Divergence Points Identified

| Hop | Location | Status | Note |
|-----|----------|--------|------|
| A-9 | CycleCard.js:81–82 `orderActivitiesForDisplay` | **RISK** | Sorts by `plannedStartAt ?? anchor` as raw strings. HH:MM sorts lexicographically OK, but mixing ISO and HH:MM in the same list can produce wrong order. |
| A-11 | ScheduledActivityBlock.js:187–190 | **RISK** | `a.plannedStartAt ?? a.anchor` — if both are set and differ, `plannedStartAt` wins. But if `plannedStartAt` is null (e.g., activities added via `applyAdd` with `sourceSlot=null`), falls back to `a.anchor`. |
| B-4 | editMode.js:344 `sortedByStart` | **RISK** | Reads `parseStartMinutes(a.plannedStartAt)` — does NOT fall back to `a.anchor`. If `plannedStartAt` is null but `anchor` is set, the activity sorts to the end and the cascade may miss it or mis-order the chain. |
| B-5/C-5 | editMode.js:441–452 gap check | OK | Gap logic is correct when start times are consistent HH:MM. |
| D-4 | ComposerService.js:504–512 | **BUG?** | The merge `{ ...prior, ...edited }` writes `edited.plannedStartAt` (cascade result) but preserves `prior.state`. This is correct for cascaded times. However, for swapped slots (different `catalogEntryId`), the new row is written under `freshId` (line 526–531) — `plannedStartAt` from the edited slot is preserved here. No data loss path found — but see Section 4. |
| A-9 | CycleCard.js:81 `anchor` string compare | **RISK** | If an activity has only `anchor` set (not `plannedStartAt`), the display sort is correct — but `formatTimeRange` in ScheduledActivityBlock reads the same `a.plannedStartAt ?? a.anchor`. If the activity was cascaded (has a new `plannedStartAt`) but display still falls back to stale `anchor`, the displayed time will be wrong. |

---

## 3. Format Mismatches

- `orderDay` (orderDay.js:117, 150–188) writes **HH:MM** strings to `plannedStartAt`.
- `materialize` (composeDaily.js:168) initializes `plannedStartAt: spec.plannedStartAt ?? null` — before `orderDay` runs, this is **null** for non-anchor packed blocks. `orderDay` mutates to HH:MM.
- `shiftStart` (editMode.js:313) detects format and preserves it: HH:MM→HH:MM, HH:MM:SS→HH:MM:SS, ISO→ISO. **No cross-format conversion.** OK as long as the input is HH:MM throughout.
- `formatTimeRange` (timeFormat.js:64) accepts both ISO and HH:MM. **OK.**
- `applyStartTimeChange` → `replaceTimeOnStart` (editMode.js:565) detects the original format and preserves it. **OK.**
- `getActiveComposition` (ComposerService.js:783) returns activities from storage verbatim — whatever format they were written in. **OK.**
- `composeWeekly` (composeWeekly.js:340) sets `plannedStartAt: spec.anchor ?? null` — HH:MM from anchor constants. **OK.**

No cross-format conversion bugs found at format level. All producers and consumers agree on HH:MM for Today-day activities.

---

## 4. Stale-Data Patterns

**Key divergence: `anchor` vs `plannedStartAt` after edits**

- `ScheduledActivityBlock.js:187–190`: `formatTime(a.plannedStartAt ?? a.anchor)` and
  `formatTimeRange(a.plannedStartAt ?? a.anchor, ...)`.
- `WeekGrid.js:75, 83, 89`: `activity.plannedStartAt ?? activity.anchor` in three places.
- `CycleCard.js:81–82`: sort by `a.plannedStartAt ?? a.anchor`.
- `editMode.js:344` (`sortedByStart`): reads **only** `a.plannedStartAt` — **does NOT fall back to `a.anchor`**.

**The divergence point:** When `applyAdd` creates a new slot (editMode.js:161–164) with `sourceSlot=null`, the draft gets `plannedStartAt: null` (activityFromCatalogEntry line 101). It also gets no `anchor` (line 109 — only copies anchor if sourceSlot had one). So a freshly-added activity has `plannedStartAt: null` AND `anchor: undefined`. It will sort to the end in `sortedByStart` and render as empty time in `ScheduledActivityBlock`. This is an expected edge case, not a primary bug.

**The actual stale-anchor bug:** When a protected ceremony block (e.g., Daily Standup with `anchor: "09:00"`) has its `plannedStartAt` correctly set to `"09:00"` by `orderDay`, then an edit cascades a later activity's start to e.g. `"09:45"` via `shiftStart`, the render uses `plannedStartAt` correctly. But `anchor` is preserved on the object and never updated. If `plannedStartAt` were ever cleared or nulled out (e.g., by a buggy undo path), the block would fall back to the stale `anchor` and show the original ceremony time — masking the cascade.

---

## 5. Cross-View Consistency

**Today / ScheduledActivityBlock** (ScheduledActivityBlock.js:187–190):
- Time column: `formatTime(a.plannedStartAt ?? a.anchor)` for the `<input type="time">` value.
- Range display: `formatTimeRange(a.plannedStartAt ?? a.anchor, a.plannedDurationMinutes)`.
- Duration column: `a.plannedDurationMinutes ?? 0` raw number (line 197).

**WeekGrid / renderBlock** (WeekGrid.js:73–104):
- Uses `formatTimeRange(activity.plannedStartAt ?? activity.anchor, dur)` (line 89).
- Falls back to `startHHMM` (start-only) when `heightPx < 40` (line 87–89).
- The 40px fallback means blocks under ~40 minutes height show only start time — **this is intentional** but can look like "end time missing" to the user (WeekGrid.js:44–45).

**Divergence:** `sortedByStart` in `editMode.js:344` reads **only `plannedStartAt`**, while `orderActivitiesForDisplay` in `CycleCard.js:81` reads `plannedStartAt ?? anchor`. This means the cascade logic and the display sort use different fallback rules — a block with `plannedStartAt: null` but `anchor: "13:00"` will display at 13:00 in sorted order (CycleCard) but will NOT be cascaded properly in edit mode (sortedByStart drops it to end).

---

## 6. Most Likely Root Cause

The most likely root cause is the **`plannedStartAt ?? anchor` fallback inconsistency between `sortedByStart` (editMode.js:344) and the display sort in `orderActivitiesForDisplay` (CycleCard.js:81)**. When a ceremony block has `plannedStartAt` set to a time but a subsequent non-ceremony packed block has the *same* string value (because `orderDay` set them to butt up), the cascade in `applyDurationChange` and `applyStartTimeChange` depends on `parseStartMinutes(a.plannedStartAt)` which correctly reads the value. However, the root issue is that `anchor` is carried on ceremony blocks and `plannedStartAt` is set equal to it — so after an edit, if `plannedStartAt` is correctly cascaded on non-ceremony blocks, the *display* fallback `plannedStartAt ?? anchor` will show the correct cascade. The actual visible bug — "time column not updating" — most likely occurs because **`orderActivitiesForDisplay` sorts by raw string comparison** (CycleCard.js:83–86): it compares HH:MM strings as strings (which is fine for 00–23 range), but if any activity has an ISO `plannedStartAt` and another has HH:MM, string compare will mis-sort them, causing visual row order to not match actual scheduled times even when the underlying data is correct.

---

## 7. Recommended Fix Approach

The fix strategy is twofold: (1) normalize `orderActivitiesForDisplay` (CycleCard.js:77) to parse both ISO and HH:MM through `parseMinutesOfDay` (already available in weekGridMath.js) before comparing, so sort order is numerically stable regardless of format; (2) align `sortedByStart` in editMode.js:344 to also fall back to `a.anchor` when `a.plannedStartAt` is null (matching the display sort), so the cascade correctly positions protected/anchored blocks when computing gap detection. Neither change touches the format of stored data.
