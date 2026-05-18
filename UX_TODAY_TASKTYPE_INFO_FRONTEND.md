# UX_TODAY_TASKTYPE_INFO_FRONTEND.md
# Per-Task-Type Info Changes on Today Calendar Cards — Implementation Feasibility Map

**Directive**: "Have subagents determine the best information possible for each task type on the today page"
**Scope**: TodayGrid.js calendar blocks + BlockDetailDialog.js expanded view
**Date audited**: 2026-04-30

---

## 1. Data Availability Audit

### ScheduledActivity fields (available NOW, on the object passed to `renderTodayBlock`)

| Field | On ScheduledActivity | Notes |
|---|---|---|
| `name` | YES — direct | Used on block now (TodayGrid.js:151) |
| `plannedStartAt` | YES — direct | Drives top offset and time label |
| `plannedDurationMinutes` | YES — direct | Drives height and duration label |
| `bucket` | YES — direct | Drives chip color + lunch detection |
| `state` | YES — direct | In `data-state` attr and aria-label |
| `linkedKaizenId` | YES — direct | Drives kaizen chip (TodayGrid.js:157–164) |
| `intention` | YES — direct (§2.5) | NOT currently rendered anywhere |
| `sourceOfSchedule` | YES — direct (§2.5) | NOT currently rendered |
| `linkedDmaicStepRef` | YES — direct (§2.5) | NOT currently rendered |
| `linkedPdcaExperimentId` | YES — direct (§2.5) | NOT currently rendered |
| `outputArtifactRef` | YES — direct (§2.5) | Populated at close; null during planning |
| `reasonCodeIfSkipped` | YES — direct (§2.5) | Only meaningful when SKIPPED |
| `userEdited` | YES — direct | In `data-user-edited` attr (TodayGrid.js:153) |
| `actualStartAt` / `actualEndAt` | YES — direct | NULL until activity runs; no render use yet |
| `compositionId` | YES — direct | Reference only; no display use |

### Available via composition (passed as prop to TodayGrid)

| Field | Path | Notes |
|---|---|---|
| `composerInputsSnapshot.sprintPhase` | `composition.composerInputsSnapshot.sprintPhase` | Useful for CI blocks — shows what phase of sprint drove this CI task |
| `composerInputsSnapshot.activeKaizenId` | `composition.composerInputsSnapshot.activeKaizenId` | Cross-reference with `linkedKaizenId` for CI blocks |
| `composerInputsSnapshot.capacityMinutes` | `composition.composerInputsSnapshot.capacityMinutes` | Could show remaining capacity in detail dialog |
| `composerInputsSnapshot.role` | `composition.composerInputsSnapshot.role` | Low display value |
| `composition.state` | Already used | Drives PROPOSED class |
| `composition.date` | Already used | Drives now-line date match |

`composerInputsSnapshot` is typed at types.js:368–374. The snapshot is frozen at proposal time. It does NOT carry per-activity reasoning strings — `explain` lives on `InfeasibleResult` (types.js:775), not on `Composition`. There is no per-activity composer rationale field available.

### Available via CatalogEntry lookup (already done in Today.js for BlockDetailDialog)

Today.js:599–603 already resolves `catalogEntry` from `catalog` array by `activity.catalogEntryId` and passes `outputArtifact` to `BlockDetailDialog`. The same lookup could be extended cheaply.

| CatalogEntry field | Availability | Display value |
|---|---|---|
| `outputArtifact.name` | Via lookup — already passed to BlockDetailDialog | Currently shown in dialog (BlockDetailDialog.js:64) |
| `outputArtifact.schema` | Via lookup | Could show artifact type (TEXT / DOCUMENT / etc.) |
| `defaultDurationMinutes` | Via lookup | Could show "planned vs default" delta |
| `trigger` | Via lookup | Useful for CI blocks — "what caused this task" |
| `procedure` | Via lookup | Step list — meaningful for CI/PROJECT in dialog |
| `inputs` | Via lookup | Context for what's needed to execute |
| `participants` | Via lookup | Useful for COMMUNICATION blocks |
| `cadence` | Via lookup | Low calendar value |
| `focusArea` | Via lookup | Informational; maps to bucket already |
| `isNonOptional` | Via lookup | Could surface "required" badge |
| `phaseBinding` | Via lookup | Useful for CI Accelerator/DMAIC blocks |
| `projectTypeBinding` | Via lookup | Useful for PROJECT blocks |

**Gap**: CatalogEntry is currently resolved only in `renderBlockDetailDialog` in Today.js, not passed into `renderTodayBlock` for calendar card display. The `catalog` array is already in scope at Today.js render time.

### kaizenTitleById (available via prop)

`kaizenTitleById` is already passed to `TodayGrid` and down to `renderTodayBlock` (TodayGrid.js:115). The resolved title is used for the kaizen chip. The Kaizen object itself (title, state, goalStatement, actions) is NOT in this lookup — only the title string.

### Not available — would require new field (§6.5 boundary risk)

| Desired info | Why unavailable | §6.5 risk |
|---|---|---|
| Per-activity composer rationale ("why was this scheduled today?") | `explain` lives on `InfeasibleResult`, not persisted to `ScheduledActivity` or `Composition` | YES — would require new domain field |
| Kaizen current phase / state | Only `kaizenTitle` is in the lookup; full Kaizen object not passed | NO — pure UI: pass `kaizenById` instead of `kaizenTitleById` |
| PDCA experiment hypothesis | Requires `PdcaExperiment` lookup by `linkedPdcaExperimentId` | NO — pure UI lookup; no engine touch |
| DMAIC step name | Requires CatalogEntry lookup via `linkedDmaicStepRef.catalogEntryId` | NO — pure UI lookup |
| Kaizen progress (% actions done) | Requires Kaizen.actions array in lookup map | NO — pure UI: extend lookup map |

---

## 2. Current Render Path

### TodayGrid.js — `renderTodayBlock` (lines 114–218)

Single render function for ALL bucket types. No per-bucket branching inside the function. Bucket differentiation is entirely cosmetic:
- CSS class driven: `meta.chipClass` from `bucketMeta(bucket)` → `chip-project`, `chip-communication`, `chip-ci`, or `chip-unknown` for Lunch (TodayGrid.js:129–133)
- `lunchClass` appended when `bucket === null` (TodayGrid.js:138)
- `proposedClass` appended when composition is PROPOSED (TodayGrid.js:135)

Inner template (TodayGrid.js:200–218) is identical for all types:
```
<article class="cycle-block-positioned {chipClass}{proposedClass}{lunchClass}">
  {lockChip}
  <span class="cycle-block-time">{timeLabel}</span>
  <span class="cycle-block-name">{name}</span>
  {kaizenChip}
  {resizeHandle}
</article>
```

No per-bucket content variation exists. Same 3 fields (time, name, optional kaizen chip) for PROJECT, COMMUNICATION, CI, and Lunch.

### BlockDetailDialog.js — uniform template (lines 38–145)

Single template for all buckets. Fields currently displayed:
1. Color bar accent (bucket color) — Iter 33 AC13 (line 94–95)
2. `Bucket` label chip (line 119–122)
3. `Time` — `formatTimeRange(plannedStartAt, dur)` (line 126)
4. `Duration` — `{dur} min` (line 129)
5. `Expected output` — `outputArtifact.name` or `—` (lines 63–66, 132)
6. `Kaizen` chip — only when `linkedKaizenId` resolves (lines 89–91, 134–138)
7. Edit button (disabled for protected) / Close button

Fields present on `ScheduledActivity` that are NOT shown: `intention`, `sourceOfSchedule`, `linkedDmaicStepRef`, `linkedPdcaExperimentId`, `state` (beyond aria).

---

## 3. Implementation Strategies

### Option (a): Single render function, prop-driven variations

Extend `renderTodayBlock` and `BlockDetailDialog` with conditional branches on `bucket`. Pass `catalogEntry` object in addition to `outputArtifact`. Add per-bucket secondary line to the card.

**Pros**: one place to change; matches existing pattern (the function already receives `bucket`).
**Cons**: branches accumulate; if 5 types each add 2–3 conditions, the function body doubles.

### Option (b): Per-bucket render functions

`renderProjectBlock()`, `renderCommBlock()`, `renderCIBlock()`, `renderLunchBlock()`, `renderProtectedBlock()` — each returns its article HTML. `renderTodayBlock` becomes a dispatch function.

**Pros**: clear ownership; each type is independently testable; easy to diff what changed per type.
**Cons**: shared structure (positioning, aria, data attrs, resize handle, animation delay) must be extracted to a helper or duplicated. Risk of drift between types on shared concerns.

### Option (c): Shared structure + per-type "facet" injection

Core block renders wrapper, data attrs, aria, time, name, resize handle. A `renderBlockFacet(activity, catalogEntry, bucket)` function returns an HTML snippet injected into a slot. Each bucket has its own facet renderer.

**Pros**: most flexible; shared concerns stay DRY; facets are tiny and easy to test.
**Cons**: most upfront cost; introduces a new abstraction for a small surface.

### RECOMMENDATION: Option (b) — per-bucket render functions

**Justification**: The codebase is at a stage where per-type info is genuinely different across types (not just cosmetic). Option (b) makes the per-type decision explicit and auditable — a future developer can open `renderProjectBlock` and see exactly what a PROJECT block shows without parsing conditionals. The shared positioning/aria boilerplate risk is low: extract one `blockWrapper(ctx, innerHtml)` helper (5-10 lines) that all five renderers call, and the duplication concern evaporates. This matches the existing pattern in `editMode.js` which has clearly-named per-concept functions rather than branchy generics. Option (a) is the path of least resistance but degrades as more types diverge. Option (c) is over-engineered for 5 types and 1 injection point.

---

## 4. §6.5 Boundary Check

Every item in this feasibility map is achievable with zero §6.5 touches under option (b):

| Action | Files touched | §6.5? |
|---|---|---|
| Add per-bucket render functions to TodayGrid.js | `js/ui/components/TodayGrid.js` | NO |
| Pass `catalogEntry` to `renderTodayBlock` (already done in Today.js for dialog) | `js/ui/pages/Today.js` (call site), `TodayGrid.js` | NO |
| Extend `BlockDetailDialog` with per-bucket rows (`intention`, `procedure`, `participants`) | `js/ui/components/BlockDetailDialog.js` | NO |
| Pass `kaizenById` (full object) instead of `kaizenTitleById` for phase display | `js/ui/pages/Today.js` (prop plumbing) | NO |
| Surface `linkedDmaicStepRef` / `linkedPdcaExperimentId` as text in dialog | `BlockDetailDialog.js` | NO |

**Phil-blocked items (would touch §6.5)**:
- Adding a per-activity `rationale` or `composerExplain` field to `ScheduledActivity` — requires `js/domain/types.js` and the composer
- Persisting `explain` strings from `InfeasibleResult` onto the activity — requires `js/engine/` and `js/composer/`

No §6.5 hits predicted for the viable implementation scope.

---

## 5. Test Impact

### Existing test files that would be affected

| File | Impact | Estimated delta |
|---|---|---|
| `tests/ui/components/TodayGrid.test.js` | Snapshot string checks on block HTML; adding per-bucket content to articles breaks any `assert.match` that checks for absence of content. Existing 15 tests likely still pass — they check structure not bucket-specific content. New tests needed per bucket type. | +8–12 new tests |
| `tests/ui/components/TodayGrid.iter43.test.js` | Checks for `cycle-half-hour-line` and past-hour classes — unaffected by block content changes. | 0 delta |
| `tests/ui/components/BlockDetailDialog.test.js` | Existing 10+ tests check specific field rows. Adding per-bucket rows would require new tests; existing tests should still pass if new rows are additive. Snapshot-style checks on `bdd-body` content may need updating if the template structure changes. | +6–10 new tests, 0–2 fixes |
| `tests/ui/pages/Today.test.js` | Integration-level render tests. If `catalog` prop threading changes (passing `catalogEntry` into TodayGrid blocks), tests that stub `catalog` as `[]` will still pass (graceful fallback). | 0–2 minor fixture updates |
| `tests/ui/pages/Today.iter43.test.js` | Similar to above — structural tests, not content-specific. | 0 delta |

**Total estimated test delta**: +14–24 new tests; 0–4 minor fixture updates. No test deletion expected.

---

## 6. Effort Estimate Per Type

For each type, "calendar card" means adding a secondary info line to the `<article>` in `renderTodayBlock`. "Dialog" means adding bucket-specific rows to `BlockDetailDialog`.

| Type | Best new info | Card (hrs) | Dialog (hrs) | Total |
|---|---|---|---|---|
| **PROJECT** | `intention` field as secondary line (already on ScheduledActivity); `outputArtifact.name` as a small badge; `isNonOptional` badge if true | 1.5 | 1.0 | 2.5 |
| **COMMUNICATION** | `participants` from CatalogEntry (requires catalog lookup on card); `trigger` as subtitle | 2.0 | 1.0 | 3.0 |
| **CI** | `trigger` from CatalogEntry + `linkedKaizenId` phase if available; `sprintPhase` from composerInputsSnapshot | 2.0 | 1.5 | 3.5 |
| **Lunch** | No meaningful new info needed; block already styled distinctly. Confirm/skip label would be useful but is action-oriented, not info | 0.5 | 0.5 | 1.0 |
| **Protected** | "Required for your daily rhythm" already in Edit button aria. Add `catalogEntry.trigger` to dialog. Lock icon already present. | 0.5 | 1.0 | 1.5 |
| **Shared plumbing** | Thread `catalogEntry` into `renderTodayBlock` props; extract `blockWrapper()` helper; update test fixtures | — | — | 2.0 |
| **TOTAL** | | **6.5** | **5.0** | **13.5** |

---

## 7. Cheapest Viable Subset (2–3 hr iteration)

**Target**: maximum user-facing signal lift per hour of work.

### Proposed subset: `intention` field on PROJECT blocks + `trigger` + `participants` in BlockDetailDialog for COMMUNICATION

**Why these two**:

1. `intention` is already on every `ScheduledActivity` (§2.5, types.js:492). It requires zero new data wiring — it's on the object passed to `renderTodayBlock` right now. Adding a `<span class="cycle-block-intention">` secondary line to PROJECT blocks is a 30-line change with no prop threading needed. It surfaces the declared outcome directly on the calendar card — the highest-value info for a deep work block.

2. `participants` and `trigger` from `CatalogEntry` for COMMUNICATION blocks in `BlockDetailDialog`. The catalog lookup is already done in `renderBlockDetailDialog` in Today.js (line 600–603) — `catalogEntry` is resolved and only `outputArtifact` is extracted. Passing the full `catalogEntry` to `BlockDetailDialog` and adding two new `<div class="bdd-row">` rows for COMMUNICATION bucket is a ~40-line change. `participants` is the most useful single field for a meeting block (who should be there).

**Scope**: 2 files modified (`TodayGrid.js` + `BlockDetailDialog.js`), 1 file with minor prop thread update (`Today.js` to pass `catalogEntry` instead of just `outputArtifact`), +6–8 new tests.

**Estimated effort**: 2–2.5 hrs.

**What it does NOT include** (defer): per-bucket render function refactor (do as a follow-on when all 5 types are ready); CI/Lunch/Protected changes; DMAIC step lookup; Kaizen phase display.

---

## File:Line Citation Index

| Reference | File | Lines |
|---|---|---|
| `renderTodayBlock` — single-template render | `js/ui/components/TodayGrid.js` | 114–218 |
| Block inner HTML template | `js/ui/components/TodayGrid.js` | 200–217 |
| `bucket` / `isLunch` detection | `js/ui/components/TodayGrid.js` | 129–133, 138 |
| `kaizenChip` render | `js/ui/components/TodayGrid.js` | 157–164 |
| `intention` on ScheduledActivity typedef | `js/domain/types.js` | 492 |
| `linkedDmaicStepRef` on ScheduledActivity | `js/domain/types.js` | 497 |
| `linkedPdcaExperimentId` on ScheduledActivity | `js/domain/types.js` | 498 |
| `ComposerInputsSnapshot` typedef | `js/domain/types.js` | 368–374 |
| `CatalogEntry` typedef (outputArtifact, trigger, procedure, participants) | `js/domain/types.js` | 386–408 |
| `BlockDetailDialog` — uniform template | `js/ui/components/BlockDetailDialog.js` | 38–145 |
| `outputArtifact` display | `js/ui/components/BlockDetailDialog.js` | 63–66 |
| Catalog lookup in Today.js | `js/ui/pages/Today.js` | 599–603 |
| `renderBlockDetailDialog` full function | `js/ui/pages/Today.js` | 587–606 |
| `bucketMeta` labels (PROJECT/COMMUNICATION/CI) | `js/ui/bucketMeta.js` | 20–42 |
| `isProtectedBlock` detection rules | `js/ui/editMode.js` | 58–66 |
| Existing TodayGrid tests (15 tests) | `tests/ui/components/TodayGrid.test.js` | 1–end |
| Existing BlockDetailDialog tests | `tests/ui/components/BlockDetailDialog.test.js` | 1–end |
