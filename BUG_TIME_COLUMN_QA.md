# Bug Investigation: Today Time Column Display (QA lens)

_Authored by qa-engineer; persisted by coordinator (agent returned findings inline)._

Status: Diagnostic report. Not a fix. Companion to BUG_TIME_COLUMN_FRONTEND.md and BUG_TIME_COLUMN_ARCHITECT.md.

## 1. Bug Reproduction Status

**H1 — Composer-time bug (initial `plannedStartAt` wrong at compose time): NOT-REPRODUCED**

`orderDay.js` assigns `plannedStartAt` as `HH:MM` strings to every activity in `placed[]` before they are persisted. Anchored ceremonies receive their anchor string directly (`js/engine/orderDay.js:117`). Deep, CI, and COMM fillers receive cursor-derived values from `formatClock()`. All activities exit Step 8 with a non-null `plannedStartAt`. No sequential anchoring gap found here.

**H2 — Render-time bug (`formatTimeRange` produces incorrect output): NOT-REPRODUCED**

`js/ui/timeFormat.js:64-76` is arithmetically correct. HH:MM pass-through, ISO UTC extraction, end-time wrapping via modulo 1440 all behave correctly for inputs tested in `tests/ui/timeFormat.test.js`. Pure function with complete test coverage. No defect found.

**H3 — Edit-mode cascade bug (`applyDurationChange` incorrect in edge cases): INDETERMINATE (partial)**

The cascade logic at `js/ui/editMode.js:432-462` has one structural gap: when a gap-activity is encountered (gap > 1 minute), cascading stops. Tests cover butting-up activities; A→(gap)→B→C chains where B-C are butting-up cascade through A but stop at gap. The `gap <= 1` threshold means a 1-minute gap is treated as butting-up.

**H4 — Persistence bug (`commitEdit` doesn't persist cascaded values): NOT-REPRODUCED**

`ComposerService.commitEdit()` at `js/services/ComposerService.js:496-513` writes the full `edited` object into `nextActs` for unchanged-catalog slots, including cascaded `plannedStartAt`. Persistence is correct.

**H5 — State boundary bug (`editMode.activities` correct but `activeState.activities` stale after commit): REPRODUCED**

This is the primary bug. Tracing the `EDIT_COMMIT` handler at `js/app.js:1409-1427`:

```
EDIT_COMMIT:
  services.composerService.commitEdit(compositionId, activities, ...)
  state.editMode = null
  rerender()
```

After `commitEdit` writes to storage, `state.editMode` is set to `null`. The `rerender()` call then triggers `renderApp()` which calls `composerService.getActiveComposition(DEFAULT_USER.id)` at `js/app.js:536`. That method at `js/services/ComposerService.js:801-804` reads ALL activities for the composition from storage — including DROPPED rows — with no filter on `state !== 'DROPPED'`:

```js
const activities = Object.values(acts).filter(
  (a) => a && a.compositionId === latest.id
);
```

DROPPED rows are returned alongside live rows and passed to `Today.js` as `activeState.activities`. The `Today.js` render at lines 222-225 passes them straight to `CycleCard` as `activitiesForRender`. DROPPED activities have stale `plannedStartAt` values (the pre-edit times). When the `CycleCard` renders these alongside the updated rows, the time column shows both the new cascaded times AND stale DROPPED rows — causing incorrect, duplicate, or overlapping time labels.

Additionally: `commitEdit` for swapped slots creates a new activity with id `${id}_edit_${now}` (line 525-530), while the original is marked DROPPED. Both land in `getActiveComposition`'s result because DROPPED is not filtered.

**H6 — Non-edit-mode display bug (static render shows stale times): REPRODUCED (consequence of H5)**

Because `getActiveComposition` returns DROPPED rows and Today renders them, the non-edit-mode time column shows DROPPED activities with their old `plannedStartAt` values. This is the user-visible symptom Phil reported.

**H7 — Anchor vs `plannedStartAt` fallback bug: INDETERMINATE**

`ScheduledActivityBlock.js:187-190` uses `a.plannedStartAt ?? a.anchor`. In practice the fallback only matters for freshly-added edit-mode drafts. The formatter handles HH:MM input correctly so the scenario is reachable but the formatter behaves correctly.

## 2. Existing Test Coverage Gap Map

| Hypothesis | Existing test(s) | Gap |
|---|---|---|
| H1 (composer time) | `duration-cascade-time-display.test.js` covers cascade render | NO COVERAGE for initial multi-activity orderDay sequence in integration render |
| H2 (formatTimeRange) | `tests/ui/timeFormat.test.js` — complete | Full coverage |
| H3 (cascade edge) | `tests/ui/editMode.sprint13.test.js` — gap-stop behavior | NO COVERAGE for A→gap→B→C butting-up chain |
| H4 (persistence) | `duration-cascade-time-display.test.js` — cascade only | NO COVERAGE for commitEdit round-trip preserving cascaded times |
| H5/H6 (DROPPED rows in render) | None | NO COVERAGE — no test asserts `getActiveComposition` excludes DROPPED rows |
| H7 (anchor fallback) | `tests/ui/timeFormat.test.js` covers HH:MM input | NO COVERAGE for `plannedStartAt: null, anchor: 'HH:MM'` path through SAB |

## 3. Root-Cause Candidates (ranked by evidence)

**1. PRIMARY — `getActiveComposition` returns DROPPED activities (`js/services/ComposerService.js:801-804`)**

After `commitEdit`, rows with `state: 'DROPPED'` are kept in storage as audit trail but not filtered by `getActiveComposition`. Today renders them with stale pre-edit `plannedStartAt`.

**2. SECONDARY — Swapped slots get fresh id with `_edit_{now}` suffix (`js/services/ComposerService.js:525-530`)**

When `commitEdit` handles a swap (different `catalogEntryId`), the old row is DROPPED and a new row with new id is written. Both land in `getActiveComposition`'s result.

**3. TERTIARY — `gap <= 1` threshold in cascade (`js/ui/editMode.js:441`)**

A 1-minute gap is treated as butting-up. Edge case, low severity.

## 4. Test Cases the Fix Should Add

1. **Given** a composition with A(09:00,60m), B(10:00,30m) committed to storage, **when** `commitEdit` shifts B's start to 10:30, **then** `getActiveComposition` must return exactly 2 activities both with `state !== 'DROPPED'`, and B must show `plannedStartAt: '10:30'`.

2. **Given** slot X swapped for slot Y via `commitEdit`, **when** `getActiveComposition` is called, **then** the returned array must not contain any row with `state: 'DROPPED'`.

3. **Given** A(09:00,60m), B(10:00,30m), C(10:30,60m), **when** `applyDurationChange(acts, 'A', 30)` is committed and re-read from storage, **then** the activities' `plannedStartAt` must equal '09:00', '09:30', '10:00' respectively.

4. **Given** activity with `plannedStartAt: null`, `anchor: '10:00'`, `plannedDurationMinutes: 30`, **when** SAB renders, **then** `sa-when` must contain `'10:00–10:30'`.

5. **Given** `commitEdit` shifts B from 10:00 to 10:30, **when** Today renders from `getActiveComposition` (no edit mode), **then** rendered HTML must contain `'10:30–11:00'` and must NOT contain stale `'10:00'` for that slot.

## 5. Risk Assessment for the Fix

**Blast radius: MEDIUM-HIGH**

The fix is in `getActiveComposition` (add `.filter(a => a.state !== 'DROPPED')` at `ComposerService.js:802`). However:

- `getComposition` (line 814) does NOT filter DROPPED. These should diverge by design (`getActiveComposition` = render path; `getComposition` = audit/test path).
- The `reflow()` method explicitly handles DROPPED rows (`ComposerService.js:683`). The fix must NOT change reflow's behavior.
- `tests/integration/duration-cascade-time-display.test.js` bypasses storage round-trip, so existing tests won't break. New round-trip tests are needed.
- `commitEdit` swap path generates fresh ids; those rows are not DROPPED, so will appear normally after the fix.

## 6. Open Questions

1. **Architect**: Should `getActiveComposition` filter DROPPED, or should `Today.js` / `CycleCard` filter at render? Storage contract suggests service-layer filter is correct.

2. **Frontend**: After `EDIT_COMMIT` sets `state.editMode = null`, `rerender()` re-fetches. Confirm `LocalStorageRepository.write` is synchronous (no race window).

3. **Architect**: `commitEdit` swap path generates `freshId = ${id}_edit_${now}` (line 525). Confirm `plannedStartAt` is always non-null on these fresh rows before they reach the renderer.

4. **Frontend**: What is Phil's exact workflow? If only changing duration chips without committing, H3 is the active failure. If committing then viewing normal Today, H5 is primary.
