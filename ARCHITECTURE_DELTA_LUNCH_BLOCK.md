# ARCHITECTURE DELTA — Lunch Block as Editable ScheduledActivity

**Status:** PROPOSED — Define-phase artifact only. No code in this delta.
**Author:** System Architect agent
**Date:** 2026-04-30
**Scope:** Surface the 12:00–13:00 lunch break as a user-editable
ScheduledActivity card that the composer emits by default.

---

## 1. Goal + non-goals

**Goal.** Today the daily composer treats 12:00–13:00 as an unscheduled,
capacity-neutral void: `js/engine/orderDay.js:129` uses `lunchMins = 12*60` as a
packing boundary, and `ENGINE_DESIGN.md:340` documents it as "[lunch break — not
scheduled, capacity-neutral]". The user's stated intent is to *render a card* in
that gap so it is editable by the same edit-mode mechanics already used on every
other ScheduledActivity row (move start, resize, skip). The change is
representation-only: every Daily composition must include a lunch
ScheduledActivity at `12:00 / 60min` by default, identifiable in the activities
array, surfaced in `/today` and `/week`, and movable / resizeable / skippable
by the user.

**Non-goals.** This delta does **not** rebalance the 4-2-2 capacity math
(`js/engine/capacity.js:54`), it does **not** introduce a new bucket, and it does
**not** touch the composer's pick-order or DMAIC payload selection. It does not
add a new `Bucket` value, a new `ActivityKind`, or a new `VarianceKind`. It
does not add a settings toggle for global opt-out (deferred). Weekly reflection
emission, sprint ceremonies, and CI rotation are all unchanged. The post-lunch
13:00 anchor is unchanged. The 12:00 packing boundary in `orderDay.js` is
unchanged.

---

## 2. Current state

| Aspect | File / line | Current behavior |
|---|---|---|
| Lunch as packing boundary | `js/engine/orderDay.js:129` | `const lunchMins = 12 * 60;` — Deep slices stop before 12:00, afternoon Deep starts at `cursorAfternoon` (post-Comm end ≥13:00). |
| Post-lunch Comm anchor | `js/composer/composeDaily.js:55-62` | `gen_value_added_communication @ 13:00, 30 min, slotKind='POST_LUNCH_COMM'` injected unconditionally as a daily non-optional. |
| ENGINE_DESIGN narrative | `ENGINE_DESIGN.md:340` | `12:00 [lunch break — not scheduled, capacity-neutral]` — this delta supersedes that line. |
| Activities array shape | `js/composer/composeDaily.js:665-670` | Composition.activities never contains a 12:00–13:00 row. The lunch hour is implicit. |
| Validator behavior | `js/engine/validateComposition.js:120-125` | Sums ALL activities against `effectiveCap`. A lunch row with `plannedDurationMinutes: 60` going through this would consume capacity — must NOT happen. |
| UI rendering | `js/ui/components/ScheduledActivityBlock.js:1-30` | One row per activity in `composition.activities`. No lunch row exists, so no lunch card renders. |
| Edit-mode protection | `js/ui/editMode.js:24-49` | Hard-coded sets `PROTECTED_CATALOG_IDS`, `PROTECTED_NAMES`, `PROTECTED_SLOT_KINDS`. None reference lunch today. |

**Conclusion:** lunch is currently a *gap*, not a row. The fix is to make it a
row that flows through every existing row-aware code path **except** the
capacity / bucket-target math.

---

## 3. Target state — pseudo-flow

```
composeDaily(input)
   │
   ├─ STEP 1..7  (capacity targets, non-optionals, ceremonies,
   │              Deep payload, CI, COMM filler)         [UNCHANGED]
   │
   ├─ STEP 8  orderDay(placed, input)                    [UNCHANGED]
   │              · packs Deep around lunchMins=12*60
   │              · sets plannedStartAt on each placed[] row
   │
   ├─ STEP 9  validateComposition(placed, …)             [UNCHANGED]
   │              · sums plannedDurationMinutes per bucket
   │              · 4-2-2 floors / ceilings
   │
   ├── NEW STEP 8.5 ── injectLunchBlock(placed, input)
   │              · pure helper, runs AFTER orderDay, BEFORE validate
   │              · constructs a ScheduledActivity draft from the
   │                'recovery_lunch' CatalogEntry seed
   │              · plannedStartAt = '12:00', plannedDurationMinutes = 60
   │              · bucket = null  (sentinel — see §8)
   │              · slotKind = 'LUNCH'
   │              · isNonOptional = false (skippable)
   │              · pushed onto placed[] for downstream rendering
   │              · validate() filters bucket===null rows out of its
   │                bucket-sum loop  (1-line filter)
   │
   ├─ STEP 9 (cont.)  validate ignores bucket===null rows
   │
   └─ STEP 10  build Composition  ➜  activities[] now contains lunch row
```

**Critical ordering:** lunch is injected **post-`orderDay`** so it does not
participate in the packer (which would re-order things around it). It is
injected **pre-`validate`** so any future invariant that needs to *see* lunch
(e.g. "lunch must be present unless skipped") can hook in cleanly. Validator
short-circuits on `bucket===null`.

---

## 4. Component changes table

§6.5 boundary files: `js/composer/`, `js/engine/orderDay.js`,
`js/domain/types.js`, `js/events/events.js`. Touching any of these requires
explicit justification.

| File | Change | LOC | Risk | §6.5? |
|---|---|---|---|---|
| `js/catalog/seed/ceremoniesAndGenerics.js` | Add `recovery_lunch` CatalogEntry to `buildGenerics()`. New `GENERIC_IDS.LUNCH` constant. | +35 | LOW — pure seed | NO |
| `js/catalog/seed/index.js` | Bump `EXPECTED_CATALOG_SIZE` from 60 → 61. | +1 | TRIVIAL | NO |
| `js/catalog/seed/bucketMap.js` | Either tolerate `bucket=null` (current code throws on unresolvable) OR add a no-op for the `recovery_lunch` row. Recommended: pre-set `bucket=null` on the seed and add an explicit allow-list in `applyBucketMap`. | +5 | LOW | NO |
| `js/catalog/seed/markNonOptional.js` | No change — lunch is `isNonOptional=false`. | 0 | NONE | NO |
| `js/composer/lunchBlock.js` (NEW) | New pure helper `injectLunchBlock(placed, input)`. Materializes the lunch ScheduledActivity from the catalog row, returns the augmented placed[] array. | +60 | LOW | NO (new file under `js/composer/`, but *additive*; the §6.5 boundary protects against modifying behavior of existing composer files — see §6 justification) |
| `js/composer/composeDaily.js` | **§6.5 HIT.** Add 1 import + 1 call site between `orderDay()` (line 526) and `validateComposition()` call (line 532). Justification in §6. | +3 | MEDIUM | **YES** |
| `js/engine/validateComposition.js` | **§6.5 HIT.** Filter `bucket===null` rows out of `total` sum (line 120) and bucket-sum loop (line 52-58). 2-line guard. | +4 | MEDIUM | **YES** (engine, not orderDay — still subject to scrutiny) |
| `js/engine/orderDay.js` | **NO CHANGE.** Lunch injected after this runs. `lunchMins=12*60` packing boundary is preserved exactly. | 0 | NONE | NO HIT |
| `js/domain/types.js` | **NO CHANGE.** No new VarianceKind, no new Bucket, no new ActivityKind. `bucket=null` is already permissible per the typedef (string-typed but not enum-validated at runtime). | 0 | NONE | NO HIT |
| `js/events/events.js` | **NO CHANGE.** No new event names. Existing `ScheduledActivitySkipped` / `ScheduledActivityRescheduled` cover edits. | 0 | NONE | NO HIT |
| `js/ui/editMode.js` | Add `'recovery_lunch'` to `PROTECTED_CATALOG_IDS`? **NO** — lunch must be editable. Add `'LUNCH'` to a new lightweight `EDITABLE_NON_BUCKET_SLOT_KINDS` only if cascade math needs it. | +2 (defensive) | LOW | NO |
| `js/ui/components/ScheduledActivityBlock.js` | Render path is generic; no change required if `bucket===null` is rendered as a "Lunch" pill. Add bucket-meta fallback for the null bucket (~5 LOC) so it doesn't crash `bucketMeta[a.bucket]`. | +5 | LOW | NO |
| `js/ui/bucketMeta.js` | Add `null`/`'LUNCH'` entry: `{ label: 'Lunch', tone: 'recovery', symbol: '🍽' }` (no emoji per house style — use text label). | +6 | LOW | NO |
| `js/composer/composeWeekly.js` | **§6.5 HIT.** Weekly composer builds 5 days inline (not via composeDaily) — see `composeWeekly.js:355-600 buildDay`. Must call `injectLunchBlock` for each day OR delegate to a shared helper. ~3 LOC. Justification in §6. | +3 | MEDIUM | **YES** |
| `js/services/ComposerService.js` | No change — service is a thin wrapper that persists the Composition emitted by `composeDaily`. Lunch row flows through automatically. | 0 | NONE | NO |
| `js/services/ActivityService.js` | Skip mechanic must accept `recovery_lunch` skips. The existing `SKIPPED_NON_OPTIONAL` variance kind only fires when `isNonOptional=true` — lunch is NOT non-optional, so the existing path uses `EDITED_FROM_PROPOSAL` already. Verify: `ActivityService.js:454` writes `kind: 'SKIPPED_NON_OPTIONAL'` only inside the `skipWithReason` branch for non-optional rows; user-initiated skip on optional rows takes a different path or no variance — clarify in §10. | 0–10 | LOW | NO |

**Total LOC estimate:** ~125 LOC across 8 files (~75 LOC if §6.5 hits are all
single-line guards, ~125 LOC if defensive coding is needed for bucket-meta and
weekly).

**§6.5 hit count: 3** files (`composeDaily.js`, `validateComposition.js`,
`composeWeekly.js`). Justification in §6.

---

## 5. Catalog seed entry shape

Add to `js/catalog/seed/ceremoniesAndGenerics.js → buildGenerics()`:

```js
{
  id: GENERIC_IDS.LUNCH,                   // 'recovery_lunch'
  activityNumber: null,
  name: 'Lunch',
  focusArea: 'CONTINUOUS_IMPROVEMENT',     // see §5.1 — focusArea is required
                                            // and validated; we reuse CI as the
                                            // closest existing enum value.
                                            // Alternative: introduce
                                            // 'RECOVERY' to FocusArea (would
                                            // hit §6.5 via types.js).
  defaultDurationMinutes: 60,
  cadence: 'DAILY',
  trigger: 'Default lunch window 12:00–13:00 local',
  inputs: [],
  outputArtifact: {
    name: 'Lunch (no artifact)',
    schema: 'TEXT',
    required: false                          // see §5.2 — types.js declares
                                              // required: true on the typedef;
                                              // recovery rows opt out.
  },
  participants: ['Self'],
  procedure: [
    'a. Step away from work.',
    'b. Eat.',
    'c. Return at the planned end time.'
  ],
  bucket: null,                              // SENTINEL — capacity-neutral.
                                              // validateComposition + capacity
                                              // sums skip rows where
                                              // bucket===null.
  isNonOptional: false,                      // user can skip per day
  dependsOn: [],
  projectTypeBinding: null,
  phaseBinding: null,
  appliesToRoles: ['PRACTITIONER', 'FACILITATOR', 'LEADER', 'CHAMPION'],
  enabledByUser: true,
  version: 1,
  sourceRef: 'ARCHITECTURE_DELTA_LUNCH_BLOCK.md §5',

  // ---- non-standard catalog fields surfaced for the composer ----
  defaultStart: '12:00',                     // composer reads this on emit
  slotKind: 'LUNCH'                          // discriminator for orderDay /
                                              // editMode / validate skip
}
```

**Cross-references in existing seed examples:**

- `js/catalog/seed/ceremoniesAndGenerics.js:115-143` (Daily Standup, the
  closest analog: ceremony with anchor, isNonOptional=true, bucket assigned).
- `js/catalog/seed/ceremoniesAndGenerics.js:243-274` (Deep Work generic,
  bucket=PROJECT, isNonOptional=false).
- `GENERIC_IDS` is at `ceremoniesAndGenerics.js:29-35`. Add
  `LUNCH: 'recovery_lunch'`.

### 5.1 FocusArea constraint

`js/domain/types.js:39-50` declares `FocusArea` as a closed enum:
`'DEEP_WORK' | 'COMMUNICATION' | 'CONTINUOUS_IMPROVEMENT' | 'CEREMONY' |
'DMAIC' | 'KAIZEN' | 'INNOVATION' | 'KAIZEN_ACCELERATOR_30D'`. There is no
`'RECOVERY'`. Two options:

1. **Reuse `CONTINUOUS_IMPROVEMENT`** — pragmatic, no types.js change, but
   semantically loose. The `focusArea` field is informational; nothing in
   composer keys off it for lunch.
2. **Add `'RECOVERY'` to FocusArea** — cleaner, but a §6.5 hit on `types.js`.

**Recommendation:** option 1 (`CONTINUOUS_IMPROVEMENT`). The semantic loss is
small; no behavior is keyed on `focusArea === 'CONTINUOUS_IMPROVEMENT'`
(verified by grep — only `bucketMap.js:67` references it, and that branch is
shadowed by the explicit `bucket: null` field). **Open question O-1: confirm
this with user.**

### 5.2 OutputArtifact constraint

`types.js:289-292` declares `OutputArtifactDef.required: true` (literal `true`).
The `recovery_lunch` row sets `required: false` to opt out of artifact capture
on close. This is a typedef *narrowing violation* but JSDoc is non-enforcing.
Confirm tests in `tests/catalog/seed/*` don't assert the literal-`true`
constraint. Spot-check: `tests/catalog/seed/ceremoniesAndGenerics.test.js`
likely walks all entries and asserts `outputArtifact.required === true`.
**Open question O-2.**

### 5.3 BucketMap interaction

`js/catalog/seed/bucketMap.js:80-94` `applyBucketMap` skips entries that already
have `bucket !== null && bucket !== undefined`. For lunch we set `bucket: null`
deliberately. The current code at line 84 calls `bucketByFamily(d)` which
returns `null` only for unknown focusArea, then throws `BUCKET_UNRESOLVABLE` on
line 87. **Required change:** add a one-line allow-list at the top of the loop:

```js
if (d.id === 'recovery_lunch') return d;          // bucket-neutral row
```

Or generalize: `if (d.slotKind === 'LUNCH') return d;`.

---

## 6. Composer emission strategy

The catalog-only strategy assumed `composeDaily.js` would naturally pick up the
new optional entry. **It will not.** Here's why (cited):

- `composeDaily.js:295-315` iterates only `DAILY_NON_OPTIONAL_SET` for the
  daily anchors — a hard-coded constant, not the catalog.
- `composeDaily.js:480-498` `STEP 6 CI rotation` calls `pickCI`, which only
  returns `bucket==='CI'` rows. Lunch has `bucket=null` and is rejected.
- `composeDaily.js:503-521` `STEP 7 COMMUNICATION filler` similarly filters
  to `bucket==='COMMUNICATION'`. Rejected.
- No code path picks up bucket-neutral catalog rows.

**Therefore an insertion point in `composeDaily.js` is unavoidable.** This is
the §6.5 hit.

**Justification:** the alternative is to retrofit one of the existing pick
loops to allow bucket-neutral rows, which would be more invasive (change pickCI
+ pickCommFiller + the targets math) AND would risk lunch being dropped during
`relaxConfigurable` (which can drop optional rows under `OVER_CAPACITY`).
Injecting *after* relax/validate makes lunch unaffected by capacity contention
and keeps it unconditionally on the schedule.

**Insertion point (precise):** between lines 526 (`orderDay(placed, input)`)
and 528 (the comment opening STEP 9). One new function call:

```js
import { injectLunchBlock } from './lunchBlock.js';
// …
orderDay(placed, input);                    // STEP 8 — UNCHANGED
injectLunchBlock(placed, input);            // STEP 8.5 — NEW
// STEP 9 — Validate + relax (UNCHANGED)
```

The new module `js/composer/lunchBlock.js` is purely additive (no §6.5 hit on
existing composer files beyond the 3-line edit in `composeDaily.js`).

### 6.1 Weekly composer

`composeWeekly.js:371` `buildDay()` does NOT delegate to `composeDaily()` —
it builds compositions directly (per the comment on line 41). Lunch must be
injected via the same helper inside `buildDay`. ~3 LOC: a single
`injectLunchBlock(placed, weeklyCtx)` call inside the per-day loop.

---

## 7. orderDay interaction

**Lunch bypasses orderDay entirely.** `injectLunchBlock` runs *after*
`orderDay()` returns, so the packer never sees the lunch row. The existing
`lunchMins = 12*60` boundary in `orderDay.js:129` is preserved — Deep slices
still stop at 12:00 and afternoon Deep still starts at `cursorAfternoon`.

**Where lunch is injected:** `injectLunchBlock` materializes the row with
`plannedStartAt = '12:00'` (HH:MM string, matching the format `orderDay` writes
on other rows) and `plannedDurationMinutes = 60`. It pushes the row onto the
end of `placed[]`. Render order is array order (per `ScheduledActivityBlock`
iteration), so callers must not depend on `placed[]` being time-sorted —
verify by grepping for `.sort((a, b) => parseStart…` in the UI layer.
`js/ui/editMode.js:344` does sort by start time on demand for cascade
calculations, so render-time sorting already exists where it matters.

**No change to orderDay required.** `orderDay.js` LOC delta = 0.

---

## 8. Capacity math invariants

Show that nothing breaks:

- `computeBucketTargets` (`js/engine/capacity.js:54`) takes
  `user.dailyCapacityMinutes` directly — no input from `placed[]`. Unaffected.
- `validateComposition` (`js/engine/validateComposition.js:120`) sums
  `plannedDurationMinutes` over ALL activities. **REQUIRED CHANGE:** add a
  filter so `bucket===null` rows are excluded from both the total-vs-cap check
  AND the per-bucket sums (`sumBucket` at line 52). 4 LOC:

  ```js
  // line 120 (current):
  const total = activities.reduce((s, a) => s + (a.plannedDurationMinutes ?? 0), 0);
  // becomes:
  const total = activities
    .filter((a) => a.bucket !== null && a.bucket !== undefined)
    .reduce((s, a) => s + (a.plannedDurationMinutes ?? 0), 0);
  ```
  And `sumBucket` already does `if (a.bucket === bucket)` which naturally
  excludes `null` — no change needed there.
- `relaxConfigurable` (`js/engine/relaxConfigurable.js`) — never sees the
  lunch row because it runs at `composeDaily.js:549`, *before* the lunch
  injection at the new STEP 8.5. **No change.**
- `_assertBucketTargets` — no such symbol; the equivalent is
  `validateComposition`, addressed above.

**Invariant preserved:** `targets.PROJECT + targets.COMMUNICATION + targets.CI`
still equals `dailyCapacityMinutes`. Lunch sits *outside* this sum, both in
arithmetic (bucket=null filter) and in semantics (it's a recovery slot, not a
work bucket).

---

## 9. Edit mechanics

The lunch row is intentionally `isNonOptional=false` and **not** added to
`PROTECTED_CATALOG_IDS` / `PROTECTED_NAMES` / `PROTECTED_SLOT_KINDS` in
`js/ui/editMode.js:24-49`. This means:

| Operation | Behavior | Mechanics |
|---|---|---|
| Move start | Allowed | Existing `applyStartChange` cascade rules apply (`editMode.js:565+`). The user can move lunch from 12:00 to e.g. 12:30. Subsequent rows cascade per existing rules. |
| Resize duration | Allowed | Existing `applyDurationChange` cascade (`editMode.js:356+`). User can shrink lunch to 30 min or extend to 90 min. |
| Skip | Allowed | Existing skip mechanic applies. Note: lunch is `isNonOptional=false`, so the SKIPPED_NON_OPTIONAL variance branch in `ActivityService.js:456` does NOT fire — instead an `EDITED_FROM_PROPOSAL` row may be appropriate (see §10). |
| Swap | **Disallowed.** Edit-mode swap drawer should hide lunch from the eligible swap pool. Add a filter: `bucket !== null` in the swap candidate selector. Or whitelist via a new `SWAPPABLE_BUCKETS = ['PROJECT','COMMUNICATION','CI']` constant. |
| Remove | Allowed (acts as skip). |

**Cascade behavior across lunch.** `BUG_TIME_COLUMN_ARCHITECT.md:72` notes
that the cascade currently has a `gap > 1` bug: the lunch gap (between the
last morning Deep block and the 13:00 Post-lunch Comm) breaks cascades because
of the gap heuristic. **Inserting a lunch row at 12:00–13:00 fills that gap**
— so the cascade will now propagate naturally across what used to be a
composer-mechanical gap. This is a *positive* side effect for the user
("changing morning Deep duration shifts the rest of the day"). The Sprint 16
fix already addresses this via "composer-mechanical gaps are NOT cascade
stops" (`editMode.js:420-421` comment). Adding lunch as a row makes the cascade
behavior more intuitive: lunch is now an explicit cascade target like any
other.

**Anchor protection.** Lunch should be `isAnchor=false`. The 13:00 Post-lunch
Comm anchor remains protected (it's in `PROTECTED_NAMES`). When the user
shrinks lunch to e.g. 30 min, the Post-lunch Comm row stays at 13:00 (because
it's pinned), creating a 12:30–13:00 gap. Acceptable per the existing cascade
spec.

---

## 10. Variance audit

Re-use existing `VarianceKind` values per `js/domain/types.js:167-175`:

| User action | Variance.kind | Variance.reasonCode | Notes |
|---|---|---|---|
| Skip lunch | `EDITED_FROM_PROPOSAL` | `OTHER` (default) or user-selected | NOT `SKIPPED_NON_OPTIONAL` — lunch is `isNonOptional=false`, and that kind is reserved for non-optional rows that get rescued via R2 in `composeDaily.js:325-349`. |
| Move lunch start | `RESCHEDULED` | `OTHER` | Existing reschedule path. |
| Resize lunch | `EDITED_FROM_PROPOSAL` | `OTHER` | Duration change variance. |
| Lunch closed (user clicks done) | none | — | Close is a state transition, not a variance. |

**No new VarianceKind required.** **No change to `events.js`.**

**Verification step for engineering:** confirm `ActivityService.skipWithReason`
(or equivalent) does NOT throw when called on a row where `isNonOptional=false`.
Spot-check `js/services/ActivityService.js:390-460` — if the path is locked to
non-optional rows, a parallel `skipOptional` path may be needed (low risk;
likely already exists for swap/remove operations from edit mode).

---

## 11. Test strategy

| Test file | Action | Test count delta |
|---|---|---|
| `tests/catalog/seed/ceremoniesAndGenerics.test.js` | Add: `recovery_lunch` exists, has expected fields, `bucket===null`, `isNonOptional===false`. | +3 |
| `tests/catalog/seed/index.test.js` | Update `EXPECTED_CATALOG_SIZE` from 60 → 61. | +0 (modify) |
| `tests/catalog/seed/exportFullCatalog.test.js` | Same constant bump. | +0 (modify) |
| `tests/catalog/fullCatalog.test.js` | Same constant bump. | +0 (modify) |
| `tests/catalog/seed/bucketMap.test.js` | Add: `applyBucketMap` does NOT throw on `recovery_lunch`. | +1 |
| `tests/composer/composeDaily.test.js` | Add: lunch row present in `out.placed` at index ≥ N (post-orderDay), `plannedStartAt='12:00'`, `plannedDurationMinutes=60`, `bucket===null`. Add: lunch does NOT consume PROJECT/COMM/CI capacity (sum check). Add: validation passes. | +5 |
| `tests/composer/composeDaily.startAtTz.test.js` | Verify lunch row's plannedStartAt is local '12:00' regardless of TZ. | +1 |
| `tests/engine/orderDay.test.js` (NEW or existing) | Add: `lunchMins=12*60` boundary preserved; orderDay does NOT see the lunch row (it's injected post-order). | +2 |
| `tests/engine/validateComposition.test.js` | Add: `bucket===null` rows are excluded from total + bucket sums. | +2 |
| `tests/engine/relaxConfigurable.test.js` | Add: lunch row never reaches relax (it's injected after); but if it ever did, relax does NOT drop it. | +1 (defensive) |
| `tests/composer/composeWeekly.test.js` | Add: each of the 5 days has a lunch row at 12:00. | +1 |
| `tests/services/WeeklyComposerService.test.js` | Update `for (const d of w.days) totalExpected += d.activities.length;` (line 221) — formula is `>= 5 + 5*1` for lunch. | +0 (modify) |
| `tests/integration/edit-mode.test.js` | Add: cascade propagates across lunch row. Add: skip lunch produces `EDITED_FROM_PROPOSAL` variance, NOT `SKIPPED_NON_OPTIONAL`. | +3 |
| `tests/services/ComposerService.test.js` | Update bare `>= 4` assertion (line 446, 506) — lunch makes minimum 5. | +0 (modify) |
| `tests/app.sprint10c.test.js` | The 3 hard-equality assertions at lines 99, 115, 169 (`length === 2`, `length === 1`) are likely on filtered subsets, not full activities[] — **verify before assuming break.** If they're on full sets they need +1. | +0 (verify) |
| `tests/_smoke.test.js` | Update `>= 6` to `>= 7` (line 36). | +0 (modify) |
| `tests/ui/components/ScheduledActivityBlock.kaizenChip.test.js` | Snapshot may need refresh if bucket-meta fallback changes the rendered HTML. | +0 (regenerate) |
| `tests/ui/pages/Today.sprint5.test.js` | Verify lunch card renders. | +1 |
| `tests/ui/pages/Week.test.js` | Verify lunch card renders on each day. | +1 |

**New test count delta: ~21 added, ~7 modified, 0 deleted.**

---

## 12. Blast radius

Every test that asserts a fixed count of activities or a fixed catalog size:

| File | Line(s) | Current assertion | New value |
|---|---|---|---|
| `tests/catalog/seed/index.test.js` | 17 | `EXPECTED_CATALOG_SIZE === 60` | `=== 61` |
| `tests/catalog/fullCatalog.test.js` | 22 | `catalog.length === EXPECTED_CATALOG_SIZE` | unchanged (constant bumped) |
| `tests/catalog/seed/exportFullCatalog.test.js` | 38 | `parsed.length === EXPECTED_CATALOG_SIZE` | unchanged |
| `tests/_smoke.test.js` | 36 | `active.activities.length >= 6` | `>= 7` |
| `tests/composer/composeDaily.test.js` | 94 | `out.placed.length >= 4` | `>= 5` (still passes with `>=` but advisable to bump for clarity) |
| `tests/composer/composeDaily.test.js` | 244 | `DAILY_NON_OPTIONAL_SET.length === 4` | unchanged — lunch is NOT in DAILY_NON_OPTIONAL_SET (per design constraint) |
| `tests/services/ComposerService.test.js` | 352 | `out.activities.length === activitiesBefore.length` | unchanged (relative) |
| `tests/services/ComposerService.test.js` | 446, 506 | `out.activities.length >= 4` | still passes; no change required |
| `tests/services/WeeklyComposerService.test.js` | 221 | `totalExpected += d.activities.length` | unchanged (relative) |
| `tests/composer/composeWeekly.test.js` | 178 | `d.activities.length > 0` | unchanged |
| `tests/composer/composeWeekly.test.js` | 730 | `ids.length === 1` | likely on a filtered set — verify |
| `tests/composer/composeWeekly.test.js` | 416 | `tueKz.length === 1` | filtered set — likely fine |
| `tests/app.sprint10c.test.js` | 99, 115, 169 | exact length assertions | **VERIFY** — these are likely on edit-state subsets and may be unaffected |
| `tests/app.sprint12.test.js` | 171, 173, 222, 224, 237, 239, 247, 249 | relative `before` / `before+1` style — unchanged | unchanged |
| `tests/integration/edit-mode.test.js` | 159 | indexes `[length - 1]` — relative | unchanged |

**Quantified blast radius:** ~3 hard-equality bumps required, ~5 `>=` style
unchanged but worth bumping for accuracy, ~10 relative assertions unaffected.

---

## 13. Rollback plan

**Single-toggle disable.** Add a feature flag `LUNCH_BLOCK_ENABLED` (constant
in `js/composer/lunchBlock.js`) defaulting to `true`. The injection call in
`composeDaily.js` and `composeWeekly.js` reads the flag and no-ops when false.
To roll back in production: flip the constant to `false` and re-deploy. All
catalog state remains valid (the seed entry still exists; nothing references
it from outside the composer); existing accepted compositions with lunch rows
remain renderable because the UI handles `bucket===null` defensively.

**Database / persistence concerns:** `localStorage` rows that contain a lunch
ScheduledActivity stay valid. Validator already filters bucket=null rows. No
migration script needed for rollback.

**Granular rollback (per-user):** the feature flag can read from
`User.preferences.lunchBlockEnabled` (future field) — out of scope for this
delta but trivial to add later.

---

## 14. Open questions

1. **O-1: focusArea value for the lunch entry.** Use `CONTINUOUS_IMPROVEMENT`
   (no types.js change, semantically loose) OR add `RECOVERY` to the FocusArea
   enum (cleaner, §6.5 hit on `js/domain/types.js`)? Recommend option 1.
2. **O-2: outputArtifact.required = false.** Does any seed test assert
   literally `required === true` on every catalog row? If yes, that test must
   tolerate `recovery_lunch`. Spot-check needed in
   `tests/catalog/seed/ceremoniesAndGenerics.test.js`.
3. **O-3: variance kind for skip-lunch.** Confirm the user wants
   `EDITED_FROM_PROPOSAL` (consistent with other optional-row skips) rather
   than a new dedicated kind. Constraint says re-use existing — confirming.
4. **O-4: weekly composer parity.** `composeWeekly.js` does not call
   `composeDaily`. Confirm the user wants lunch on every weekly day too
   (currently assumed YES because "Default-on" applies to "every Daily
   composition" and the weekly view also surfaces 5 daily-shaped compositions).
5. **O-5: swap drawer.** When a user is in edit mode and swaps a Deep block,
   should `recovery_lunch` appear in the swap candidate list? Recommend NO
   (filter `bucket !== null`).
6. **O-6: lunch row in non-workdays.** If `User.workDays` excludes Sat/Sun
   (default), the composer never runs on those days. No issue. Confirm there
   is no edge case for half-day capacity (e.g. cap=240) where lunch should be
   suppressed — recommend lunch is always on regardless of capacity since it
   is bucket-neutral.
7. **O-7: 4x1h Deep slice preference.** With `deepSlicePreference='4x1h'`,
   slices target 60 min each; `orderDay` packs the morning ones up to 12:00.
   If a user has a 4th morning slot ending exactly at 12:00, lunch starts
   contiguously — fine. But if a user moves lunch start to e.g. 11:30, will
   the morning Deep slice that was 11:00–12:00 overlap visually? Cascade
   behavior should resolve this but worth a UI test.

---

## Appendix A — File-citation index

- `js/composer/composeDaily.js:39-70` (DAILY_NON_OPTIONAL_SET — DO NOT add lunch here)
- `js/composer/composeDaily.js:526` (orderDay call — insertion point is line 527)
- `js/composer/composeDaily.js:665-670` (Composition.activities materialization)
- `js/engine/orderDay.js:129` (lunchMins boundary — preserved unchanged)
- `js/engine/validateComposition.js:52-58` (sumBucket — auto-skips null bucket)
- `js/engine/validateComposition.js:120-125` (total sum — needs null filter)
- `js/catalog/seed/ceremoniesAndGenerics.js:243` (Deep generic — analog for lunch entry)
- `js/catalog/seed/index.js:61` (EXPECTED_CATALOG_SIZE)
- `js/catalog/seed/bucketMap.js:80-94` (applyBucketMap — needs allow-list)
- `js/ui/editMode.js:24-49` (PROTECTED sets — lunch deliberately not added)
- `js/ui/editMode.js:420-421` (cascade-across-gaps — lunch makes this trivial)
- `ENGINE_DESIGN.md:340` (current narrative — superseded by this delta)
- `BUG_TIME_COLUMN_ARCHITECT.md:72` (cascade-gap nuance affected by this delta)
