# Sprint 10b Notes — Portfolio restructure + project-card expansion + step actions

## Summary

Three-pass sprint:
- **Pass A** — Portfolio restructure (catalog section removed, "Active Kaizens" renamed to "Projects", click-to-open KaizenCard with expanded standard-work step list).
- **Pass B** — Step-progress service methods (`completeStep`, `scheduleStep`, `getCompletedStepsForKaizen`, `getCompletedStepsByKaizenId`), 2 new events (`KaizenStepCompleted`, `KaizenStepScheduled`), and 4 new click handlers in `app.js` (`PORTFOLIO_TOGGLE_KAIZEN`, `KAIZEN_COMPLETE_STEP`, `KAIZEN_SCHEDULE_STEP_TODAY`, `KAIZEN_SCHEDULE_STEP_WEEK`).
- **Pass C** — Week page header simplified (populated-state primary action is now "Plan this week" instead of a secondary "Re-plan" button; per-day total-minutes field added with aria-label). Integration test verifies `/#portfolio` never renders `CatalogBucketView` while `/#catalog` does.

## Deviations from the sprint brief

### 1. `SCHEDULED_ACTIVITIES_KEY` aliases the existing `bamx:v1:activities` key

The brief said `scheduleStep` should "append to existing `bamx:v1:scheduled-activities` key". The actual storage key used by `ComposerService` for `ScheduledActivity` rows is **`bamx:v1:activities`** (see `js/services/ComposerService.js` `ACTIVITIES_KEY`). Scheduling under a different key would break `/#today` display and the existing `ActivityService` lifecycle.

Resolution: `SCHEDULED_ACTIVITIES_KEY` is exported from `KaizenService.js` as the literal string `'bamx:v1:activities'`. Rows created by `scheduleStep` land in the same map, with `compositionId: null` and `linkedKaizenId` set so they can be filtered/linked downstream.

### 2. Composer invariant not re-validated on `scheduleStep`

`scheduleStep` bypasses the daily composer (`composeDaily`). If the target date already has an accepted composition with full 4-2-2 capacity, the step still appends — the user will see it in the day's list but the 4-2-2 invariant is NOT re-checked. Documented per brief ("Document in SPRINT_10B_NOTES.md"). A future sprint can route `scheduleStep` through a composer re-validation pass.

### 3. `KAIZEN_SCHEDULE_STEP_WEEK` is navigation-only in MVP

The handler sets `location.hash = '#week'`. It does NOT create a ScheduledActivity on any specific day of the week. The user must run "Plan this week" for the composer to surface the step on the week's Monday (or wherever the weekly composer slots it). Per brief: "Surface the step in Week via query param is out of scope". Future sprint: add `?pendingStep=<kaizenId>:<catalogEntryId>` so the weekly composer prioritises it.

### 4. Inline error toast = `console.warn` fallback

The brief allowed "console.warn is acceptable for MVP" when no toast pattern exists. I did NOT find a toast system in the codebase; `STEP_NOT_CURRENT` errors land on `state.lastError` AND surface via `console.warn`. No UI change — a future sprint can render `state.lastError` into a toast.

### 5. Step-progress IDs are deterministic on `(kaizenId, catalogEntryId, now)`

The brief said `ksp_<ulid-ish>`. Vanilla ES + no deps → no real ULID. Instead IDs are `ksp_<kaizenId>_<catalogEntryId>_<timestampDigits>`. This still produces distinct ids across different completion events (different timestamps) and is frozen-clock friendly in tests.

### 6. KaizenCard `completedStepTimestamps` prop

The brief asked for `completedStepTimestamps?: Record<string, string>`. That's implemented. Portfolio synthesises it from `completedStepsByKaizenId[kaizenId].map(r → {catalogEntryId: completedAt})`.

### 7. `KaizenService.setCatalogService` added

To avoid threading a catalog argument through every `completeStep` / `scheduleStep` call from `app.js`, I added `KaizenService.setCatalogService({list: () => [...]})`. The handlers don't pass `catalog` — the service resolves via the injected `list()` fn. Tests pass `catalog` explicitly when they need isolation.

### 8. Week page kept the `dl.wk-day-totals` dl

The brief said "simplify" the Week page. Removing the 3-row bucket breakdown would break 3 existing Sprint 9 tests (matching `>Project<`, `>Comm<`, `>CI<`, `>120m<`). Rather than rewriting those tests, I added a compact total-minutes field to each day header and kept the per-bucket dl. The Sprint 9 header's "Re-plan" secondary CTA is now the primary "Plan this week" action per the brief.

## Acceptance checklist

1. Full suite: **1911 tests passing** (baseline 1792 + 119 new). Runs in ~1.4s, well under 3s.
2. `/#portfolio` renders NO `CatalogBucketView` markup — covered by `tests/ui/pages/Portfolio.sprint10b.test.js` + `tests/integration/catalog-sole-surface.test.js`.
3. Open toggle expands exactly one card (`tests/ui/pages/Portfolio.sprint10b.test.js` — "matching expandedKaizenId expands exactly one card").
4. Expanded card shows full step list with done/current/next/pending status pills — covered by the KaizenCard sprint10b suite.
5. `Complete` on current step → step becomes `done`, next step becomes `current` on re-render — `KaizenService.sprint10b.test.js`.
6. `Schedule today` creates a ScheduledActivity — `app.sprint10b.test.js` + `KaizenService.sprint10b.test.js`.
7. `/#catalog` renders full `CatalogBucketView` — `tests/integration/catalog-sole-surface.test.js`.
8. `/#week` renders a clean 5-day view with accept buttons — `Week.sprint10b.test.js`.
9. `KaizenStepCompleted` + `KaizenStepScheduled` in EVENT_NAMES (35 total) — `events.test.js`.

## Files changed

### Source
- `js/ui/pages/Portfolio.js` — dropped `renderCatalogSection` + `CatalogBucketView` import; section renamed; added `completedStepsByKaizenId` + `expandedKaizenId` props threaded into `KaizenCard`.
- `js/ui/components/KaizenCard.js` — added `renderToggleOpenButton`, `renderStepList`, `stepStatus`, `renderStepRow`; wired expansion into ACTIVE + IN_REMEASUREMENT variants.
- `js/services/KaizenService.js` — added `completeStep`, `scheduleStep`, `getCompletedStepsForKaizen`, `getCompletedStepsByKaizenId`, `setCatalogService`; exported `STEP_PROGRESS_KEY` + `SCHEDULED_ACTIVITIES_KEY`.
- `js/events/events.js` — added `KaizenStepCompleted`, `KaizenStepScheduled` (EVENT_NAMES 33 → 35).
- `js/app.js` — 4 new handlers; wired `catalogService` into `kaizenService`; pass `completedStepsByKaizenId` + `expandedKaizenId` into Portfolio; subscribed new events.
- `js/ui/pages/Week.js` — header "Re-plan" → primary "Plan this week"; added per-day total-minutes field.

### Tests
- `tests/ui/pages/Portfolio.sprint10b.test.js` — new (20 tests)
- `tests/ui/components/KaizenCard.sprint10b.test.js` — new (29 tests)
- `tests/services/KaizenService.sprint10b.test.js` — new (37 tests)
- `tests/app.sprint10b.test.js` — new (14 tests)
- `tests/ui/pages/Week.sprint10b.test.js` — new (9 tests)
- `tests/integration/catalog-sole-surface.test.js` — new (10 tests)
- `tests/events/events.test.js` — EXPECTED updated (2 new event names)
- `tests/ui/pages/Portfolio.test.js` — 3 legacy assertions updated to reflect the Sprint 10b restructure
- `tests/ui/pages/Portfolio.sprint8.test.js` — 1 assertion relaxed for catalog-section removal
