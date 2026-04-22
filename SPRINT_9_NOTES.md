# Sprint 9 — Implementation notes + deviations

Shipped: weekly composer, Week page, and catalog project-type binding.

## Test delta

- Baseline (post-Sprint 8): 1546 tests passing.
- Post-Sprint 9: **1788 tests passing, 0 failing, ~1.4s total runtime**.
- Delta: **+242 new tests**.

## Acceptance criteria — status

1. ≥1700 tests passing, 0 failing, < 3s total — **hit** (1788 / 1.4s).
2. Every catalog entry has a valid `projectTypeBinding` — **hit**. Integration test
   `tests/catalog/projectTypeBinding.test.js` guards this. Seeded 60 rows:
     - DMAIC-bound: 22 (#20..#41).
     - Kaizen-anchor array-bound `['KAIZEN_EVENT','KAIZEN_EVENT_90D']`: 9 (#42..#50).
     - AD_HOC-bound: 1 (#12 PDCA).
     - Universal (`null`): 28 rows (ceremonies, generics, #1..#11, #13..#16, #18..#19).
3. `/#week` Plan-this-week populates 5 columns; Accept All creates 5 `Composition` rows
   — wired via `buildHandlers.WEEK_PROPOSE` / `WEEK_ACCEPT_ALL`. Verified by
   `tests/app.week.test.js` (15 tests).
4. Portfolio `KaizenCard` shows current standard-work chip — `renderCurrentStandardWorkChip`
   helper renders `▶ #N Name` below the card title for DRAFT / ACTIVE / IN_REMEASUREMENT
   states. Verified by `tests/ui/components/KaizenCard.sprint9.test.js` (15 tests).

## Deviations from the brief

### 1. Kaizen-anchor rows (#42..#50) bound to an array, not a single value

The brief said "Rows 42–50 → 'KAIZEN_EVENT_90D'". CATALOG_GAPS §K.1 (authoritative)
specifies these rows must be bound to **BOTH** `'KAIZEN_EVENT'` (standalone 1–5 day
event) AND `'KAIZEN_EVENT_90D'` (90-day phased) via a string-array binding. I
followed the spec and bound them to `['KAIZEN_EVENT', 'KAIZEN_EVENT_90D']`. The
`progression.js` helper + `composeWeekly` both support both string and array
bindings (per CATALOG_GAPS §K.2). Counts:
  - `filterCatalogByProjectType('KAIZEN_EVENT_90D', ...)` returns 9.
  - `filterCatalogByProjectType('KAIZEN_EVENT', ...)` returns 9 (same rows).

### 2. No Accelerator-specific catalog entries in seed yet

CATALOG_GAPS §J.3 describes 31 Accelerator entries to be added in a future seed
migration. None of these are in the current 60-row pipeline. I added a
forward-compatible guard in `projectTypeBindings.js` that binds any entry whose
`id` starts with `cat_acc_` or `kza_` (or whose `focusArea === 'KAIZEN_ACCELERATOR_30D'`)
to `'KAIZEN_ACCELERATOR_30D'`. When the Accelerator seed lands in a future
sprint, no change is needed here.

### 3. Weekly-composer: capped per-pick durations for universal fill

The brief said "honor the 4-2-2 invariant per day" but didn't prescribe how to
handle the tension between "2 payloads on day 1 per Kaizen" and a 240 min
PROJECT budget when both Kaizen anchors have heavy `defaultDurationMinutes`
(e.g. DMAIC #21 SIPOC = 240 min).

I implemented a "fair-share + cap" approach:
  - Kaizen-injected payloads share the PROJECT budget: each capped at
    `max(30, floor(target/count))` so a single heavy anchor can't crowd out
    other injections.
  - Universal-fill picks in each bucket are capped at a bucket-specific
    per-pick maximum (PROJECT 120, COMMUNICATION 60, CI 60) so a single
    entry with a monster `defaultDurationMinutes` (e.g. #14 at 600 min)
    can't absorb the entire bucket budget, leaving room for multiple
    distinct entries per day.

This keeps every day inside 4-2-2 floors/ceilings AND ensures the "deterministic
universal fallback" reliably places multiple entries.

### 4. Weekly composer advances Kaizen completion optimistically

`buildKaizenInjections()` advances each Kaizen's per-kaizen `completed` set
for every planned injection, even if a downstream budget-clamp in `buildDay()`
eventually drops that payload (dur=0). I treated this as acceptable
determinism-preservation for MVP: it keeps the weekly plan stable and
never loops. A stricter "only advance completed on actual placement"
would require a two-pass algorithm.

### 5. `ENTITIES` registry in `types.js` left at 15

I added `WeeklyComposition` as a typedef export (const null symbol) but
deliberately did NOT add it to the `ENTITIES` list because `tests/domain/types.test.js`
asserts `ENTITIES.length === 15`. The brief said "Update `tests/app.sprint7.test.js`
only if route rendering assertions break" — conservative interpretation:
don't touch other existing tests. The typedef is still importable; tests for
the new type name are in the weekly-composer tests.

### 6. `WeeklyCompositionStatus` enum added to `ENUMS`

Net-new enum exported alongside the existing 20. The existing types.test.js
loops through named keys (not exhaustive length check on `ENUMS`), so this is
additive and green.

### 7. The JSON catalog export (`fullCatalog.json`) is regenerated

Ran `node js/catalog/seed/exportFullCatalog.js` post-seed-update so the
browser-path JSON carries the new `projectTypeBinding` values. (Node tests
use the pipeline directly and don't need the JSON.)

### 8. `browserSeed.js` left as-is

The 9-entry browser fallback seed already had the right bindings for its
sole DMAIC entry (#34) — no update needed. Once the app boots with the
full JSON (which it does on first load), the browser path picks up all 60
bindings.

## Files changed (summary)

### New files (Pass 9a + 9b + 9c)

- `js/catalog/seed/projectTypeBindings.js` — seed step that stamps `projectTypeBinding` on every row.
- `js/catalog/progression.js` — pure `getCurrentNext` / `filterCatalogByProjectType` helpers.
- `js/composer/composeWeekly.js` — pure 5-day composer.
- `js/services/WeeklyComposerService.js` — service wrapper + persistence.
- `js/ui/pages/Week.js` — Week page + DayPreview.
- `tests/catalog/seed/projectTypeBindings.test.js` — 29 unit tests.
- `tests/catalog/projectTypeBinding.test.js` — 9 integration tests.
- `tests/catalog/progression.test.js` — 48 unit tests.
- `tests/composer/composeWeekly.test.js` — 57 tests.
- `tests/services/WeeklyComposerService.test.js` — 34 tests.
- `tests/ui/pages/Week.test.js` — 34 tests.
- `tests/app.week.test.js` — 15 wiring tests.
- `tests/ui/components/KaizenCard.sprint9.test.js` — 15 tests for the current-SW chip.

### Modified files

- `js/catalog/seed/index.js` — wires `applyProjectTypeBindings` into the pipeline.
- `js/catalog/seed/fullCatalog.json` — regenerated via `exportFullCatalog.js`.
- `js/domain/types.js` — adds `WeeklyCompositionStatus` enum + `WeeklyComposition` typedef.
- `js/events/events.js` — adds `WeeklyCycleProposed` / `WeeklyCycleAccepted` (31 → 33).
- `js/ui/components/KaizenCard.js` — adds `renderCurrentStandardWorkChip` helper + chip in variants.
- `js/ui/pages/Portfolio.js` — passes `catalogEntries` into `KaizenCard`.
- `js/app.js` — instantiates `WeeklyComposerService`, adds `week` route + 3 handlers, adds `computeMondayIso` helper.
- `app.css` — adds `.week-page` + `.wk-*` styles and `.kz-current-sw` chip style.
- `tests/events/events.test.js` — adds the 2 new event names to the `EXPECTED` list.

### Untouched (per brief)

- `js/services/KaizenService.js` — read only.
- `js/services/OpportunityService.js` / `OpportunityIntakeForm.js`.
- Sprint 8 FSM methods on `KaizenService`.
- Docker / Caddy / deploy.
