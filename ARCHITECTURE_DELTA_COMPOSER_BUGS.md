# Architecture Delta — Composer Bugs (C-SA-4 + C-SA-5)

Owner: system-architect
Status: v0.1 — Define-phase delta. Required by `coordinator.md` §6.5
(composer/engine boundary protection, adopted Iteration 18) before any
implementation iteration may touch `js/composer/`, `js/domain/types.js`,
`js/events/`, or `js/engine/orderDay.js`.
Companion to: `IMPROVEMENT_BACKLOG.md` candidates C-SA-4, C-SA-5.

---

## 1. Executive Summary

- **What's broken**: (A) Daily composer constructs `Composition` rows without a top-level date field, leaving callers (`reflow`, future date-filtered queries) to brittle-parse `startAt`/`id`. (B) `orderDay.js` packs CI activities at or past the 17:00 reflection anchor with an empty guard body, producing direct overlaps that the validator never catches because `validateComposition` has no overlap detection.
- **What the fix entails**: (A) Add a single top-level field `date` to the daily `Composition` constructor (matching the asymmetric naming already used by `composeWeekly`'s `buildDay` at `js/composer/composeWeekly.js:598`) and add it to the `Composition` typedef; defensively derive in callers when reading legacy rows. (B) Replace the empty `if`-body in `orderDay.js:183-185` with a `break` (Option A) — CI candidates that would overlap the reflection anchor stop being placed; the unplaced minutes flow into existing infeasibility/shortfall paths.
- **Blast radius**: Bug A — 4 files, ~10 LOC, 2 new unit tests. Bug B — 1 file, ~2 LOC, 3 new unit tests. Combined: 5 files touched, ~12 LOC delta, ~5 tests added. No event-schema or persistence-key changes.

---

## 2. Bug A — Missing date field on Composition

### 2.1 Current state

- `Composition` typedef: `js/domain/types.js:404-417`. The typedef declares `id`, `userId`, `cycleType`, `startAt`, `endAt`, `parentCompositionId`, `state`, `proposedAt`, `decidedAt`, `closedAt`, `composerInputsSnapshot`, `invariantChecks`. **No `date`/`compositionDate` field is declared.**
- Daily composer construction site: `js/composer/composeDaily.js:638-670`. Returns `{ id, userId, cycleType, startAt: '${input.date}T00:00:00Z', endAt: ... }` — no top-level `date`.
- Weekly composer's `buildDay`: `js/composer/composeWeekly.js:552-599`. Returns the same shape **plus** a top-level `date` field (line 598) and `dayIdx` (line 597).
- Reflow's date filter has to fall through two sources: `js/services/ComposerService.js:662-664` —
  ```js
  const cDate = typeof c.startAt === 'string' ? c.startAt.slice(0, 10) : null;
  const dDate = typeof c.date === 'string' ? c.date : null;
  return cDate === date || dDate === date;
  ```
  The `c.date` branch only matches weekly-built rows; the `c.startAt` branch is the daily-composer fallback.
- `getActiveComposition`: `js/services/ComposerService.js:783-806`. Filters by `userId` + active state only — no date filter at all. Sorts by `proposedAt` and returns latest. The orchestrator's claim that this surfaces "stale day-old compositions" is correct in mechanism (no date filter present) but unrelated to the missing field per se.
- `computePriorDayRecap`: `js/app.js:819-873`. Already derives the date via `startAt.slice(0,10)` (line 838-840). **Not broken by missing field** — it parses `startAt`. Orchestrator claim that this helper "requires the field" is overstated; it requires a date *somewhere*, and `startAt` suffices.
- Production diagnostic claim: `compositionDate=undefined` in localStorage. Confirmed by zero matches for `compositionDate` anywhere in `js/`.

### 2.2 Root cause

The field name `compositionDate` originated in `IMPROVEMENT_BACKLOG.md:307-318` orchestrator notes; it was never declared in the typedef nor written by any service. The asymmetry is internal: `composeWeekly`'s `buildDay` (Sprint 9) added a top-level `date` field for downstream Week-page consumers (`js/ui/pages/Week.js:134`); `composeDaily` (Sprint 3, predates Sprint 9) only encodes the date inside `startAt` and `id`. No one back-ported the field to the daily composer.

**Verdict**: Field was never named consistently. The bug is the daily composer omitting `date`, not a missing typedef declaration.

### 2.3 Proposed fix (architectural)

1. **Standardize on field name `date`** (not `compositionDate`). Rationale: `composeWeekly` already uses `date`; `reflow` already reads `c.date`; `Week.js` already reads `day.date`. Inventing a second name adds churn.
2. **Add field to typedef**: `js/domain/types.js:417`, after `invariantChecks`:
   ```js
   * @property {string} date  // ISO date 'YYYY-MM-DD' — the working day this composition plans for
   ```
3. **Add field to daily composer**: `js/composer/composeDaily.js:670`, inside the `composition` object literal (before the closing brace):
   ```js
   date: input.date,
   ```
4. **`composeWeekly`**: no change. Already writes `date` per-day (line 598) and `weekStart` on the envelope (line 699). The `WeeklyComposition` typedef already declares `weekStart` (line 436).
5. **`commitEdit` / `accept` / `reflow`**: no change. They spread `...comp`, so the new field propagates automatically. Reflow's read fallback at `ComposerService.js:662-664` becomes simpler in spirit but doesn't require modification — both branches still work.
6. **Migration / read-path defensiveness**: existing localStorage rows have no `date`. Strategy:
   - `getActiveComposition` (`ComposerService.js:783-806`) — recommend ALSO adding an optional `date` parameter that, if passed, filters candidates to `c.date === date || c.startAt?.slice(0,10) === date`. Callers that don't pass the param keep current behavior (latest by proposedAt). This is a separable enhancement and SHOULD ship in the same iteration but is technically distinct from Bug A's "write the field" fix.
   - No data migration needed. Next Auto-Plan overwrites the row with the new field. Legacy rows remain readable via `startAt` parsing — `reflow` already does this.
7. **No event-schema change**. `CycleProposed` event payload at `composeDaily.js:673-681` already carries `date`. No bus contract changes.

### 2.4 Test plan

- **Unit (composeDaily.test.js)**: add `composeDaily({...})` returns composition with `composition.date === input.date`. ~5 LOC.
- **Unit (ComposerService.test.js)**: `accept(compositionId)` round-trip preserves `composition.date` (verifies spread doesn't drop it). ~8 LOC.
- **Unit (ComposerService.test.js)**: `commitEdit(compositionId, [...])` round-trip preserves `composition.date`. ~8 LOC.
- **Backwards-compat (ComposerService.test.js)**: seed a localStorage composition with no `date` field, call `getActiveComposition(userId)` — assert it does NOT crash and returns the legacy row. ~10 LOC.

### 2.5 Effort estimate

**S**. Single-line write at one site, one-line typedef addition, four narrow unit tests. No fan-out into events, persistence keys, or UI.

---

## 3. Bug B — CI activities overlap anchored ceremony

### 3.1 Current state

`js/engine/orderDay.js:178-188` verbatim:
```js
  // 5) Pack CI blocks toward end-of-day (after Deep slices). Start from
  //    afternoonDeepStart if no Deep slices placed; otherwise pack from
  //    cursorAfternoon back down to reflectionStart-sized slot.
  let ciCursor = Math.max(cursorAfternoon, afternoonDeepStart);
  for (const c of ci) {
    if (ciCursor + c.plannedDurationMinutes > reflectionStart) {
      // past reflection anchor — still place (validator surfaces)
    }
    c.plannedStartAt = formatClock(ciCursor);
    ciCursor += c.plannedDurationMinutes;
  }
```

The `if`-body is empty. Comment promises validator surfaces the overlap.

### 3.2 Validator audit

`js/engine/validateComposition.js` (full file read). The validator checks:
- bucket floors (DEEP/COMM/CI under)
- bucket ceilings (project/comm/ci over)
- non-optional missing
- over-capacity total

**It has no overlap detection at all.** No code path computes `plannedStartAt + plannedDurationMinutes` collisions. The "validator surfaces" comment in `orderDay.js:184` is incorrect / aspirational.

### 3.3 Root cause

Both (i) and (ii) hold:
- (i) The CI loop's `if`-body was always meant to be a `break` (or skip) but was left empty. The loop continues to mutate `c.plannedStartAt = formatClock(ciCursor)` even when overlap is guaranteed.
- (ii) The validator was assumed to backstop overlaps but never gained that capability. There is no overlap rule defined in `ENGINE_DESIGN §2.5` or in `validateComposition.js`.

The Deep packing block at `orderDay.js:147-160` has the same antipattern: when no morning or afternoon slot fits, it places at `cursorAfternoon` regardless ("validator catches"). Same false promise.

### 3.4 Proposed fix (architectural)

**Recommended: Option A — add `break` to the if-body.**

```
Option A (RECOMMENDED): break
  - Lines changed: orderDay.js:183-185, ~3 LOC.
  - Behavior: CI candidates that don't fit before reflection are not placed.
    Their `plannedStartAt` remains undefined; downstream, composeDaily's
    finalPlaced array filter at the validation step (current behavior already
    drops items with plannedStartAt=undefined when summing buckets — verify in
    composeDaily.js step 9) results in CI bucket coming under floor → validator
    fails CI_UNDER_FLOOR → relaxConfigurable runs → either succeeds with reduced
    CI candidates or returns INFEASIBLE with a bucketShortfall.
  - Test impact: existing orderDay tests asserting "all ci items get a
    plannedStartAt" must be updated — see §5.
  - 4-2-2 invariant risk: LOW. Floor enforcement still runs via validator;
    relaxConfigurable handles shortfall.
  - Determinism risk: NONE. ci array order is set upstream by pickCI;
    break preserves order-determinism.

Option B: pre-filter ci before loop
  - Lines changed: ~5 LOC (add filter expression before line 182).
  - Same behavioral outcome as Option A but harder to read at the call site.
    Pre-filtering prevents post-mortem inspection of which items were elided.
  - Reject in favor of A.

Option C: continue + side-effect bucket
  - Adds new "deferred" concept; new state to plumb through composeDaily and
    InfeasibleResult. Out of scope for a bug fix.
  - Reject.

Option D: add overlap detection to validateComposition
  - Larger surface change. New failure code OVERLAP_DETECTED, new detail
    shape, new microcopy in UX_FLOWS §4.3. ~30+ LOC + ENGINE_DESIGN doc edit.
  - Doesn't prevent the bug — just surfaces it after the fact, leaving an
    INFEASIBLE composition the user must resolve manually.
  - Defer to a separate hardening iteration. Tracking note in §7 risk register.
```

**Verdict**: ship Option A now. File a follow-up backlog candidate (`C-SA-6 — add overlap-detection rule to validateComposition`) for defense-in-depth.

### 3.5 What about the 14:30 / 15:00 Mid-Sprint overlap?

Yes — same antipattern at `orderDay.js:155-159` (Deep fallback else-branch). When a Deep slice fits in neither morning (lunch boundary) nor afternoon (`afternoonCap`), it's still placed at `cursorAfternoon` regardless. If `afternoonDeepStart=13:30` and a 120-min Deep slice arrives, `13:30 + 120 = 15:30` which is `> afternoonCap=17:00` (or 15:00 on MID_SPRINT_DAY where Mid-Sprint Review is anchored)…

Wait — `afternoonCap` in the current code (`orderDay.js:143-145`) only equals `WEEKLY_REFLECTION` (16:30) when Friday-PM weekly reflection is present. Otherwise it equals `reflectionStart` (17:00). Mid-Sprint Review at 15:00 is NOT considered when computing `afternoonCap`. **Therefore Deep slices CAN overlap the 15:00 Mid-Sprint anchor.**

**Recommendation for §3.4**: extend `afternoonCap` to be the minimum of `reflectionStart`, `weeklyReflectionStart` (when present), and **the earliest non-AM-Comm / non-Post-Lunch-Comm afternoon ceremony anchor present in `anchored`**. This is a 1-line `Math.min(...)` change at `orderDay.js:143-145`. Adds ~5 LOC.

This is in scope of Bug B because it's the same class of bug (empty/insufficient guard against ceremony overlap) and the same file. **Ship together.**

### 3.6 Test plan

- **Unit (orderDay.test.js)**: CI rotation does not place activities at or after `reflectionStart` when reflection is anchored — assert `c.plannedStartAt` is undefined for any CI item that would overlap, OR assert the `ci` array is truncated. ~10 LOC.
- **Unit (orderDay.test.js)**: Deep slice does not start such that `start + duration > earliestAfternoonCeremonyAnchor` when one is present (Mid-Sprint Review case). ~12 LOC.
- **Integration (composeDaily.test.js)**: full `composeDaily({date, sprintPhase: 'MID_SPRINT_DAY', ...})` returns composition with no overlapping `plannedStartAt + plannedDurationMinutes` across any pair of activities. Assert pairwise-disjoint property. ~15 LOC.
- **Regression**: an existing CI-bucket test that asserts "all picked CI items are placed" will need updating. See §5.

### 3.7 Effort estimate

**S-to-M**. Two narrow code edits in one file (~7 LOC), but the integration test (pairwise-disjoint) is new test infrastructure. Lean S given existing test scaffolding in `tests/engine/orderDay.test.js`.

---

## 4. Sequencing Recommendation

**Bundle into one iteration.** Per `coordinator.md` §6.1:
1. Single Define artifact: yes — this delta covers both.
2. Single integrity boundary: yes — `js/composer/`, `js/engine/orderDay.js`, `js/domain/types.js` all governed by §6.5.
3. Single coherence claim: "Composer produces internally consistent, dated, non-overlapping compositions."
4. Combined estimate: S + (S-to-M) ≈ 1.3× S. Within the ≤ 1.5× normal threshold.

Both fixes touch the same boundary, share a test seam (`tests/composer/`, `tests/engine/`), and a future implementer reviewing one without the other risks reintroducing the other (e.g., adding `compositionDate` writes elsewhere while leaving `orderDay.js` overlapping). Bundling minimizes context-load.

---

## 5. Test Seam Audit

- Suite baseline: 2,834 (post-Iteration 16 per orchestrator note).
- New tests: ~5 (Bug A: 4; Bug B: 3 net of one updated regression).
- Estimated post-fix count: ~2,839.
- Tests requiring update:
  - `tests/composer/composeDaily.test.js` — any test asserting `composition` object shape will need to allow the new `date` field. Most assertions use `toMatchObject({ id: ..., userId: ... })` (partial match) so impact is minimal. Snapshot tests (if any) would need refresh.
  - `tests/engine/orderDay.test.js` — any test asserting "every input CI item has `plannedStartAt` defined after orderDay" will fail under Option A. Audit for `expect(p.plannedStartAt).toBeDefined()` or equivalent in CI loops; rewrite to scope to "items that fit before reflection."
  - `tests/services/ComposerService.test.js` — no failures expected; spread-based persistence carries the new field automatically.
- No test asserts `compositionDate === undefined` (grep verified). Safe.

---

## 6. Determinism Risk

The composer is required deterministic per `ARCHITECTURE.md §8` invariants.

**Bug A**: writing `date: input.date` is a pure read-through. No determinism risk.

**Bug B (Option A)**: adding `break` to the CI loop:
- The `ci` array order is set deterministically upstream by `pickCI` (`js/engine/pickCI.js`). `break` exits the loop on the first overflowing item. Order is preserved.
- Items elided by the break are deterministic per input (same `ci` order + same `reflectionStart` ⇒ same break point).
- Downstream `validateComposition` + `relaxConfigurable` are pure given inputs.
- **Determinism preserved.** Add an explicit determinism test: `composeDaily(sameInput)` called twice returns identical placed-CI counts. ~5 LOC. Recommended in §3.6.

The `afternoonCap` extension (§3.5) is also pure — `Math.min(...)` over a derived constant set per composition.

---

## 7. Risk Register

| # | Risk | Probability | Impact | Mitigation |
|---|------|-------------|--------|------------|
| 1 | Option A causes CI under-floor on dense days, triggering INFEASIBLE for compositions that previously "succeeded" with overlapping schedules | Medium | Medium | `relaxConfigurable` already handles this path. Add integration test on a dense MID_SPRINT_DAY input asserting either valid composition or clean INFEASIBLE (not silent overlap). |
| 2 | Existing UI snapshot/golden tests fail on the new `date` field | Low | Low | Audit grep before implementation: `grep -r "toMatchSnapshot\|toEqual.*composition" tests/`. Update snapshots in same PR. |
| 3 | A future caller reads `composition.compositionDate` (the orchestrator's bug-report name) expecting it to exist | Low | Low | Document field name as `date` in this delta; explicitly note in `IMPROVEMENT_BACKLOG.md` C-SA-4 closure that the chosen name is `date`, not `compositionDate`. Add a JSDoc comment on the typedef line. |
| 4 | Defense-in-depth gap: validator still has no overlap detection. A future bug in `orderDay` won't be caught | Medium | Medium | File follow-up `C-SA-6 — add overlap rule to validateComposition` immediately. Not blocking this iteration. |
| 5 | Migration-time crash: a legacy localStorage row read by post-fix code panics on missing `date` | Low | Medium | All readers already use `c.date ?? c.startAt?.slice(0,10) ?? null` patterns or equivalent. Add the back-compat unit test in §2.4. |

---

## 8. Open Questions for User

1. **Field name**: `date` (recommended, matches `composeWeekly`) vs. `compositionDate` (orchestrator's original name, more explicit). **Default if unanswered**: `date`.
2. **Bundle vs. stage**: ship both fixes in one iteration (recommended) or stage Bug A first (lower risk, ~30 min) then Bug B? **Default if unanswered**: bundle.
3. **`getActiveComposition` enhancement**: should the optional `date` parameter (§2.3 step 6) ship in the same iteration, or as a separate follow-up? **Default if unanswered**: same iteration — it's the actual symptom users hit (stale composition surfaced).
4. **File `C-SA-6` follow-up**: add a backlog item now for "overlap detection in validateComposition" as defense-in-depth? **Default if unanswered**: yes, file C-SA-6 immediately.

---

## 9. Recommendation

**PROCEED-AS-DESIGNED.** Both fixes are small, well-scoped, and reversible. Bug B is a correctness defect with confirmed production reproduction; Bug A is a data-integrity hygiene fix that unblocks `getActiveComposition` date-filtering and aligns daily/weekly composer shape. Bundling honors `coordinator.md` §6.1 and §6.5 boundary protection, and the combined effort fits in a single S-to-M iteration. Determinism is preserved. The defense-in-depth gap (validator overlap detection) is real but appropriately deferred to a follow-up backlog candidate (C-SA-6).

---

## Appendix — Contract Acceptance Criteria for Implementer

A future implementer's PR is accepted only if all of the following hold:

A1. `Composition` typedef in `js/domain/types.js` declares a `date: string` field with ISO `YYYY-MM-DD` format.
A2. `composeDaily({date: 'YYYY-MM-DD', ...})` returns `{composition: {date: 'YYYY-MM-DD', ...}, ...}`.
A3. `ComposerService.accept(id)` and `commitEdit(id, ...)` round-trips preserve `composition.date` byte-identical to pre-write value.
A4. `getActiveComposition(userId)` does not crash on a legacy composition row with `date === undefined`; returns the row or null.
A5. `orderDay(placed, input)` does NOT set `plannedStartAt` for any CI activity whose placement would cross the End-of-Activity Reflection anchor (17:00).
A6. `orderDay(placed, input)` does NOT set a Deep slice's `plannedStartAt` such that `plannedStartAt + plannedDurationMinutes > earliestAfternoonCeremonyAnchor` (Mid-Sprint Review at 15:00, Sprint Review at 14:00, Sprint Retrospective at 15:30, Weekly Reflection at 16:30, End-of-Activity Reflection at 17:00).
A7. `composeDaily(...)` output satisfies pairwise-disjoint property: for every pair of activities `(a, b)`, `[a.plannedStartAt, a.plannedStartAt + a.plannedDurationMinutes)` does not overlap `[b.plannedStartAt, b.plannedStartAt + b.plannedDurationMinutes)`.
A8. Determinism: `composeDaily(input)` called twice returns activity arrays with identical `(catalogEntryId, plannedStartAt, plannedDurationMinutes)` tuples.
A9. No new failure code added to `validateComposition` in this iteration. Defense-in-depth deferred to C-SA-6.
A10. Test count delta ≥ +5; no existing test removed without explicit justification in PR description.
