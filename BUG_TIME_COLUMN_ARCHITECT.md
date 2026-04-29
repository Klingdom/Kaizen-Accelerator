# Bug Investigation: Today Time Column Data-Flow Audit (system-architect lens)

Status: Diagnostic report. Companion to BUG_TIME_COLUMN_QA.md and BUG_TIME_COLUMN_FRONTEND.md.

## 1. The plannedStartAt Contract

`ScheduledActivity.plannedStartAt` is declared as `string` (ARCHITECTURE.md §2.5 line 271, types.js line 457). The contract is intentionally loose on shape. In practice the codebase observes three encodings (editMode.js:289-302):

- `HH:MM` wall-clock — what the composer's `orderDay` writes (orderDay.js:117, 150, 167, 186 — `formatClock(...)`).
- `HH:MM:SS` — accepted by parsers but not produced by the composer.
- ISO timestamp `YYYY-MM-DDTHH:MM:SSZ` — produced when ActivityService synthesizes a planned date (ActivityService.js:88-105) and used by KaizenService (KaizenService.js:1603) and tests.

Writers (each may mutate or persist `plannedStartAt`):
1. `orderDay()` — initial composition, HH:MM wall-clock (orderDay.js:110-191).
2. `applyDurationChange()` / `applyStartTimeChange()` — edit-mode cascade, preserves the input's shape via `shiftStart` / `replaceTimeOnStart` (editMode.js:313-334, 565-579).
3. `ComposerService.commitEdit()` — passes the edit-mode values straight through into the activities map (ComposerService.js:496-545).
4. `ComposerService.reflow()` — runtime repacking after Activity events, also shape-preserving (ComposerService.js:731-742).

Persistence: `commitEdit` performs a two-phase write into `bamx:v1:activities` and `bamx:v1:compositions` (ComposerService.js:584-598). LocalStorageRepository never mutates `plannedStartAt` itself.

## 2. The plannedDurationMinutes Contract

Integer minutes (ARCHITECTURE.md §2.5 line 272, types.js line 458). Set initially from `CatalogEntry.defaultDurationMinutes`. Mutable post-compose only via `applyDurationChange` in edit mode, restricted to `DURATION_OPTIONS = [15, 30, 45, 60, 75, 90]` (editMode.js:271, 378-384). After commit, `plannedDurationMinutes` is frozen for runtime; `actualEndAt - actualStartAt - plannedDurationMinutes` becomes the variance signal.

## 3. The anchor vs plannedStartAt Distinction

Two separate fields with overlapping intent:

- `anchor` — set on ceremony / non-optional drafts at materialize time and kept on the activity row (composeDaily.js:163-173: `if (spec.anchor) draft.anchor = spec.anchor;`). It is the *immutable schedule contract* — "this block always lives at 09:00".
- `plannedStartAt` — set by `orderDay` AFTER all placement is done. For anchored blocks this *equals* `anchor` (orderDay.js:117). For Deep / COMM / CI fillers, **only `plannedStartAt` exists** — `anchor` is undefined.

Divergence cases:
- After `applyStartTimeChange` on a non-protected block, `plannedStartAt` shifts but the block has no `anchor` so this is symmetric.
- After `reflow`, flexible activities' `plannedStartAt` can shift while `anchor` (if present) remains untouched (ComposerService.js:737-741) — *intentional*: the `anchor` records the original target, `plannedStartAt` records the live position.

Renderer display contract: `formatTime(a.plannedStartAt ?? a.anchor)` (ScheduledActivityBlock.js:187, 190; WeekGrid.js:89). This means **if `plannedStartAt` is missing the renderer falls back to `anchor`**, which is fine for ceremonies but risky for any code path that creates a draft without running it through `orderDay`.

## 4. The Cascade Invariant (current code)

`applyDurationChange(activities, slotActivityId, newDurationMinutes)` (editMode.js:376-465) enforces:

1. Target's `plannedDurationMinutes` is replaced; `delta = new − old`.
2. Activities are projected through `sortedByStart`, then for each successor (after the target):
   - If `originalSuccessorStart − originalPredecessorEnd <= 1 minute` → "butting up", shift by `delta`.
   - Otherwise → preserve the gap and **stop the cascade** for any further successors (editMode.js:453-461 — `prevEndBefore` and `prevEndAfter` are reset to that successor's own end, but the gap-broken row is itself NOT shifted).
3. Protected target → throws `PROTECTED_BLOCK`.
4. Activities without `plannedStartAt` are left untouched (sink to end of sort, never participate in the cascade).

`applyStartTimeChange` enforces the same cascade rule (editMode.js:675-698).

`computeDurationImpact` re-runs `applyDurationChange` in a sandbox to derive `newEndOfDay` for the chip-row preview (editMode.js:486-528).

## 5. Cascade Invariant vs User Mental Model

Phil: *"the next row should correctly show the next increment of time based on the duration of the task before it."*

The current invariant matches Phil's expectation **only when activities are butting up**. There are three scenarios where it diverges:

- **Scenario A — explicit-gap preservation.** If row N has a gap before it (e.g. composer placed a 15-min Deep block ending 11:00 and a CI block at 11:15 — gap of 15 min), an upstream duration bump *will not push it later* (editMode.js:454-461). The gap-row's start stays put. Phil's mental model is "everything below the changed row should re-cascade." This is the most likely architectural mismatch.
- **Scenario B — non-strict left-pack.** When a duration is *shrunk*, the cascade shifts butting-up rows earlier by the same delta but never compresses across a non-butting gap. Visually this leaves dead air below the shrunk row; downstream rows do not pull up to fill it. The "next increment of time based on the duration of the task before it" reading would expect the next row to start exactly at the prior row's new end.
- **Scenario C — anchor field stale on flexible rows.** Most flexible blocks have no `anchor`, so the `formatTime(plannedStartAt ?? anchor)` fallback never fires. But if a block was materialized via `activityFromCatalogEntry` from a source that *did* have an `anchor` (editMode.js:109), the new draft inherits that `anchor`. If `plannedStartAt` ends up null for any reason (e.g., the draft is added via `applyAdd` which passes `sourceSlot=null` — editMode.js:163, so the new row's `plannedStartAt` is `null`), the renderer will display the inherited-anchor's time (or empty), which is decoupled from any cascade. Today this can produce a "phantom" time column entry that doesn't track duration changes around it.

## 6. Composer Initial-Anchor Logic

orderDay assigns `plannedStartAt` **sequentially within each bucket-pack pass** (orderDay.js:138-188):
- Anchored ceremonies → fixed wall-clock (orderDay.js:117).
- Deep → `cursorMorning` starts at `amComm.plannedStartAt + amComm.plannedDurationMinutes` (line 130-131); each Deep block advances the cursor by its duration (line 151). Same for `cursorAfternoon` (line 153-158).
- COMM filler → uses the same cursors continuing from where Deep left off (line 165-176).
- CI → `ciCursor = max(cursorAfternoon, afternoonDeepStart)` then advances by each block's duration (line 181-188).

So the **initial composition is sequential and correct** — every placed block butts up against the prior. The data-flow risk is *not* in initial composition; it's in:
1. **Anchored gaps** — Deep stops at `lunchMins` (12:00), then resumes at `cursorAfternoon` (post-comm end). That introduces a gap between the last morning Deep block's end and 13:00 (Post-lunch Comm) — that gap is NOT butting up under the editMode.js definition (`gap <= 1`). A duration bump on a morning Deep block will NOT cascade past the lunch-and-Post-lunch-Comm boundary.
2. **CI cursor base** — line 181 starts CI at `max(cursorAfternoon, afternoonDeepStart)`. If Deep filled the afternoon perfectly, `cursorAfternoon > afternoonDeepStart` and CI butts up; if not, CI starts at the post-comm end while afternoonDeepStart leaves a *gap*. Under that gap, duration changes upstream do not cascade to CI.
3. **Reflection at 17:00** — the End-of-Activity Reflection has a fixed anchor of 17:00 (orderDay.js:35). It is *protected*, not editable. After any duration cascade that pushes the prior block's end past 17:00, the cascade engine does NOT shift the reflection (it would throw `PROTECTED_BLOCK` if attempted) but it also does not detect the overlap unless the caller checks `wouldExceedCapacity`. The Today renderer simply shows the inconsistent times.

## 7. State Boundary Audit

| Layer | Source | Mutable by | Reads from |
|---|---|---|---|
| `state.activeState.activities` | `ComposerService.getActiveComposition` (ComposerService.js:801-805) | activity-runtime services (start/close), reflow, commitEdit | TodayPage when `editMode === null` (Today.js:223-225) |
| `state.editMode.activities` | snapshot of `activeState.activities` at edit-open time (app.js patterns around 1087-1366) | `applyDurationChange`, `applySwap`, `applyAdd`, `applyRemove`, `applyStartTimeChange` | TodayPage when `editMode !== null` (Today.js:223-225) |
| Persisted `bamx:v1:activities` | `commitEdit` two-phase write (ComposerService.js:584-587) | `commitEdit`, `reflow`, ActivityService | `getActiveComposition`, `reflow`, ActivityService |

Divergence risk hotspots:

- **Edit-mode draft is NOT persisted until commit.** A page reload mid-edit loses cascade work (acceptable for MVP — no requirement to persist mid-edit).
- **Reflow vs in-flight edit.** If a reflow fires while `editMode !== null`, the persisted activities update underneath the draft. On `EDIT_COMMIT`, `commitEdit` matches by `id` and merges shape, but it preserves `prior.state` and `prior.actualStartAt` only — it overwrites `plannedStartAt` and `plannedDurationMinutes` from the edit-mode draft (ComposerService.js:502-512). So a reflow that ran during the edit can be silently undone by commit. **This is a real divergence vector** but unlikely to cause Phil's bug unless he edits while activities are completing.
- **Anchor vs plannedStartAt drift.** Anchored ceremonies' `plannedStartAt` and `anchor` are set equal at compose, but edit-mode helpers only update `plannedStartAt`. The protected-block guard (editMode.js:619) prevents start-time edits on anchored rows, so they cannot diverge intra-edit. However, `applyDurationChange` does not protect non-protected rows that happen to have an `anchor` set (rare but possible if a non-ceremony row was materialized from a slot that copied `anchor` per editMode.js:109). After a duration cascade those rows' `plannedStartAt` drifts but `anchor` does not. The renderer's `??` fallback masks this only when `plannedStartAt` is missing.

## 8. commitEdit Persistence Behavior

`commitEdit` persists the **entire `newActivities` array verbatim** for `plannedStartAt` and `plannedDurationMinutes` (ComposerService.js:496-545). When the slot id was preserved (no swap), it spreads `{...prior, ...edited}` so edited fields win except for the explicitly-pinned `state` and `actualStartAt`. When the slot was swapped or new, it writes `edited` plus `compositionId` and `updatedAt`.

Conclusion: **all cascade-shifted activities flow to persistence**, not just the changed one. The cascade does its work in the array before `EDIT_COMMIT` is dispatched (app.js:1239, 1321 do the cascade; app.js:1413 calls `commitEdit`).

## 9. Most Likely Root Cause (architectural lens)

The architectural layer at fault is the **cascade contract in `applyDurationChange` / `applyStartTimeChange`** (editMode.js:376-465, 606-701). The current invariant treats *any* gap > 1 minute as "user-intentional, do not cascade across." But the composer itself routinely creates such gaps as a side-effect of orderDay's pack-then-stop logic (across lunch, across the Post-lunch-Comm anchor, between Deep-afternoon-end and CI-cursor-start, into the 17:00 reflection wall). To Phil's eye those are not "deliberate gaps" — they are mechanical side-effects of the composer's anchor scaffolding. So when he bumps a morning Deep block from 60 → 90, his expectation is "every visible row below shifts by 30 min" but the code only shifts butting-up rows up until the first composer-introduced gap.

A secondary contributor: when `plannedStartAt` is `null` on any flexible row (e.g., post-`applyAdd`), the renderer falls back to `a.anchor` which may be stale or undefined, producing display values that are decoupled from the cascade.

## 10. Recommended Fix Strategy

Architecturally, two layered choices — both reversible, both single-module changes:

1. **Tighten the cascade contract.** Replace the "stop on first gap" rule with a "preserve the user's *explicit* gaps but always re-pack composer-introduced gaps" rule. The simplest mechanism: tag composer-emitted activities with a `slotKind`/`carriedOver`/`anchor` provenance bit; cascade across any successor whose start was originally `prevEnd + 0` OR whose start was determined by the orderDay packer (i.e., not anchored). Anchored protected blocks stay fixed; everything else slides as a left-packed sequence keyed off the changed row's new end. This matches Phil's mental model word-for-word.

2. **Make composer assign sequential `plannedStartAt` to ALL placed activities AND have the renderer derive end-times deterministically from `plannedStartAt + plannedDurationMinutes`** (already true — see ScheduledActivityBlock.js:190 + timeFormat.js:64-76). Combined with (1), this guarantees the time column is always a function of `(activities[].plannedDurationMinutes, anchored boundaries)` with no other state.

Out of scope for the architect, but worth flagging to the fix-owner: the `anchor` field's purpose drifted from "scheduling target" (orderDay) to "originally requested time" (reflow) to "fallback for missing plannedStartAt" (renderer). It should pick one role; recommend "scheduling target only, never read by renderer" — drop the `?? a.anchor` fallback in ScheduledActivityBlock.js:187,190 and WeekGrid.js:89 once cascade is tightened.
