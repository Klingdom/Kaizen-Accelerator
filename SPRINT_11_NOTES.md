# Sprint 11 Notes — Ship-ready polish pass

## Summary

Three-pass sprint that lifted CadencePlan from "MVP feel" to "credible paid
product" without touching the core composer or FSM moat.

- **Pass 11a** — P0 ship-ready fixes (nav cleanup, responsive CSS, toast
  system + error plumbing). Mandatory.
- **Pass 11b** — P1 depth (Opportunity intake expansion, DRAFT Kaizen
  `updateProjectType`, catalog editorial pass for #3 / #16 / #48).
- **Pass 11c** — Stretch. First-run onboarding hint strip wired into the
  Today page empty-state.

Baseline: 1962 tests at HEAD `caae422`. Sprint 11 total: **2084 tests
passing**, 0 failing, ~1.5s full suite (well under the 3s target).

## Pass 11a — P0 fixes

### 11a-1: Nav cleanup

- `js/ui/router.js` — added `VISIBLE_ROUTE_NAMES` + `PLACEHOLDER_ROUTE_NAMES`
  exports. `ROUTE_NAMES` kept unchanged so direct URL access still resolves
  through `parseHash`.
- `js/ui/AppShell.js` — nav iterates `VISIBLE_ROUTE_NAMES` (5 items: today,
  portfolio, week, catalog, kaizen). `/#insights` and `/#settings` are
  hidden from nav.
- `js/ui/pages/PlaceholderPage.js` — simplified copy. Old "Ships in Sprint N"
  placeholder (a leaky reference to internal delivery) replaced with a
  stable "Ships next." message + link back to `#today`.

### 11a-2: Mobile responsive CSS

Appended ~180 lines of CSS to `app.css` covering:

- `@media (max-width: 900px)` — tablet breakpoint. Bucket strips, Portfolio
  project-type groups, the 3-column catalog bucket grid, and the 7-column
  `.sa-block` all collapse or reduce.
- `@media (max-width: 600px)` — mobile breakpoint. Nav wraps, Today header
  stacks, bucket rows wrap their value line, `.sa-block` becomes a vertical
  list of fields, rhythm explainer stacks, triads / auto-plan / CTA buttons
  span full width with ≥44px tall touch targets.
- Toast container also gets a mobile-specific rule (spans edge-to-edge with
  8px padding at ≤600px).

No automated mobile testing (no headless browser in scope). Manual checks
land in `tests/ui/responsive.manual.md` with a 375px / 768px / 1024px
per-page checklist.

### 11a-3: Toast system

- New component `js/ui/components/Toast.js` — pure render; kinds
  `SUCCESS` / `ERROR` / `INFO`; fallback to INFO on unknown kinds. Uses
  `role="alert"` + `aria-live="assertive"` for errors,
  `role="status"` + `aria-live="polite"` for success/info.
- `app.js` — new `showToast(state, kind, message, rerender, ttlMs)` helper
  and `TOAST_TTL_MS` constant (3000). `state.toast = {kind, message, id}`.
  `setTimeout` handle `.unref()`'d in Node so the timer does not keep test
  processes alive.
- `renderApp` prepends `Toast(state.toast)` to the page HTML so it overlays
  content in a fixed-position aside.
- Wired into 7 handler paths per brief: `ACCEPT`, `SUBMIT_CLOSE_DIALOG`,
  `SUBMIT_SKIP_MODAL`, `AUTO_PLAN` (via `runCompose`), `KAIZEN_COMPLETE_STEP`,
  `KAIZEN_SCHEDULE_STEP_TODAY`, `OPP_SUBMIT_INTAKE`, `OPP_PROMOTE`. Plus a
  `TOAST_DISMISS` handler for the × button. Also added to
  `KAIZEN_UPDATE_PROJECT_TYPE` (new in 11b).

### 11a acceptance

- Full suite: 2004 tests passing after 11a. <1.6s.
- `/#insights` and `/#settings` removed from nav; direct URL works.
- `app.css` now has @media rules at 900px and 600px.
- Silent failures in the 7 brief-listed handlers are now toasted; errors
  auto-dismiss after 3s.

## Pass 11b — P1 depth

### 11b-1: Opportunity intake expansion

Added 3 optional fields to `Opportunity` (and their typedef docs):

- `currentState` (10-500 chars when provided)
- `desiredState` (10-500 chars when provided)
- `primaryStakeholder` (3-120 chars when provided)

All three are optional: empty strings and null pass through as null; when
non-empty they must fall within the bounds. New error codes:
`STATE_FIELD_LENGTH` and `STAKEHOLDER_LENGTH`. Service-layer changes:

- `OpportunityService` — new `STATE_FIELD_MIN_LENGTH`,
  `STATE_FIELD_MAX_LENGTH`, `STAKEHOLDER_MIN_LENGTH`,
  `STAKEHOLDER_MAX_LENGTH` exports. `validateStateField` +
  `validateStakeholder` helpers. `create()` + `update()` accept patches
  on the 3 new fields (INTAKE-only mutability preserved via the existing
  `OPPORTUNITY_LOCKED` guard).
- `promote()` — passes the 3 fields along to
  `KaizenService.promoteFromOpportunity`.
- `KaizenService.promoteFromOpportunity` — stores the 3 fields on the new
  Kaizen row alongside the existing fields (typedef updated).

UI:

- `OpportunityIntakeForm` — 3 new inputs with help text + character
  counters. Submit stays enabled when optional fields are empty; disables
  when a filled optional field is below its min. Added the form fields to
  the `OPP_OPEN_INTAKE` and `OPP_SUBMIT_INTAKE` handler initial state and
  form extraction.

### 11b-2: KaizenService.updateProjectType on DRAFT

- New method `KaizenService.updateProjectType({kaizenId, newProjectType, userId?})`.
  Guards: `INVALID_INPUT`, `KAIZEN_NOT_FOUND`, `KAIZEN_ABANDONED`,
  `KAIZEN_NOT_IN_DRAFT`, `INVALID_PROJECT_TYPE`. No-op return when
  `newProjectType` matches the current value. Deliberately emits **no**
  event (per brief — project-type change on DRAFT before baseline-lock is
  not audit-worthy).
- `KaizenCard` DRAFT variant — new inline "Change project type" form
  rendered via `renderProjectTypePicker(k, payload)`. Select has all 5
  `ProjectType` enum values; pre-selects the current type.
- `app.js` handler `KAIZEN_UPDATE_PROJECT_TYPE` — reads `newProjectType`
  off the form and calls the service. Toasts on success/error.

### 11b-3: Catalog editorial pass

Extended `js/catalog/seed/normalizeProcedures.js` with two new registries:

- `CATALOG_NAME_OVERRIDES` (Record<number, string>) — overrides the name
  field for #3, #16, #48.
- `CATALOG_PROCEDURE_REPLACEMENTS` (Record<number, string[]>) — replaces
  the entire procedure for #3 and #48. #16 keeps its existing Sprint 10
  fill-in (6-step Peer Connection 1:1s); only the name is overridden.

Applied:

- `#3` → "Professional Compliance Training (L&D Tracker)" with a new
  5-step procedure (identify courses → prerequisites → schedule → complete
  + log → annual refresh).
- `#16` → "Peer Connection 1:1s" (name only; procedure unchanged).
- `#48` → "Kaizen Implemented Improvements — Rollup Tracker" with a new
  5-step procedure that explains the 23h duration is a tracker, not a
  single work block.

Regenerated `js/catalog/seed/fullCatalog.json` via
`node js/catalog/seed/exportFullCatalog.js` (still 60 entries).

### 11b acceptance

- Full suite: 2069 tests passing after 11b. <1.6s.
- All new tests: 29 (OpportunityService.sprint11) + 12
  (OpportunityIntakeForm.sprint11) + 16 (KaizenService.sprint11) + 9
  (normalizeProcedures Sprint 11 block) = 66 new in 11b.

## Pass 11c — First-run onboarding arc

- New pure helper `daysSinceSignupHint(daysSinceSignup)` exported from
  `js/ui/pages/Today.js`. Bands:
  - Day 0-1 → "Welcome to CadencePlan. Tap Auto-Plan to compose your
    first balanced day."
  - Day 2-6 → "You're X days in. Aim for at least 5 accepted days in your
    first week."
  - Day 7+ → "Your first Weekly Reflection is Friday. That's where
    improvement ideas surface."
  - Negative / non-finite → `null` (no hint).
- Renders as a subtle hint strip below the day badge on the empty-state
  branch only. Does NOT render when a composition is active or when the
  page is in infeasible state.
- Styled in `app.css` as `.today-onboarding-hint` — 13px muted text in a
  bordered card with a primary left-accent.

### 11c acceptance

- Full suite: 2084 tests passing after 11c. 1.5s.

## Files changed

### Source

- `app.css` — added ~220 lines (toast + responsive breakpoints + hint strip).
- `js/app.js` — added `showToast` helper + `TOAST_TTL_MS`, `state.toast`,
  `TOAST_DISMISS` + `KAIZEN_UPDATE_PROJECT_TYPE` handlers, toast plumbing
  across 7 handlers, `currentState`/`desiredState`/`primaryStakeholder`
  form plumbing in `OPP_SUBMIT_INTAKE` + `OPP_OPEN_INTAKE`.
- `js/ui/AppShell.js` — iterates `VISIBLE_ROUTE_NAMES`.
- `js/ui/components/KaizenCard.js` — import `ProjectType`, new
  `renderProjectTypePicker` in DRAFT variant.
- `js/ui/components/OpportunityIntakeForm.js` — 3 new optional field
  inputs with counters + help text.
- `js/ui/components/Toast.js` — new component.
- `js/ui/pages/PlaceholderPage.js` — simplified "Ships next" copy + link
  back to Today.
- `js/ui/pages/Today.js` — `daysSinceSignupHint` export + empty-state
  hint render.
- `js/ui/router.js` — `VISIBLE_ROUTE_NAMES` + `PLACEHOLDER_ROUTE_NAMES` exports.
- `js/domain/types.js` — typedef updates for the 3 new Opportunity fields
  and the 3 mirrored Kaizen fields.
- `js/services/OpportunityService.js` — new length constants, new
  validators, field plumbing in create / update / promote.
- `js/services/KaizenService.js` — `updateProjectType` method; richer
  intake fields stored on `promoteFromOpportunity`.
- `js/catalog/seed/normalizeProcedures.js` — `CATALOG_NAME_OVERRIDES` +
  `CATALOG_PROCEDURE_REPLACEMENTS` registries.
- `js/catalog/seed/fullCatalog.json` — regenerated (60 entries, 3 entries
  renamed + 2 procedures replaced).

### Tests

- `tests/app.sprint11.test.js` — **new**, 24 tests. Toast helper +
  handler plumbing (ACCEPT, AUTO_PLAN, KAIZEN_COMPLETE_STEP,
  KAIZEN_SCHEDULE_STEP_TODAY, OPP_SUBMIT_INTAKE, OPP_PROMOTE).
- `tests/ui/components/Toast.test.js` — **new**, 21 tests.
- `tests/ui/pages/PlaceholderPage.test.js` — rewritten for the new
  "Ships next" copy + back-link (9 tests).
- `tests/ui/AppShell.test.js` — updated "7 items" → "5 items"; added
  assertions for hidden insights / settings + visible kaizen.
- `tests/ui/router.test.js` — added VISIBLE_ROUTE_NAMES +
  PLACEHOLDER_ROUTE_NAMES suite (7 tests).
- `tests/services/OpportunityService.sprint11.test.js` — **new**, 29 tests.
- `tests/ui/components/OpportunityIntakeForm.sprint11.test.js` — **new**,
  12 tests.
- `tests/services/KaizenService.sprint11.test.js` — **new**, 16 tests.
- `tests/catalog/seed/normalizeProcedures.test.js` — added Sprint 11 P1-T3
  suite (9 new tests).
- `tests/ui/pages/Today.sprint11.test.js` — **new**, 15 tests.
- `tests/ui/responsive.manual.md` — **new**, manual responsive checklist.

## Deviations from the brief

### 1. `setTimeout.unref()` added to the toast TTL timer

Sprint 11's toast system schedules a `setTimeout` to auto-dismiss after
`TOAST_TTL_MS` (3000 ms). In Node test environments a pending timer keeps
the event loop alive, so every test file that wired a toast handler was
adding 3s to the suite duration. Fix: the `setTimeout` handle is `.unref()`'d
in `showToast` so pending toast timers never hold Node open. Browsers
return a numeric handle with no `.unref()` method; the code guards both
(`if (handle && typeof handle.unref === 'function')`).

### 2. `KAIZEN_UPDATE_PROJECT_TYPE` toasts were added outside the brief's 7-handler list

The brief listed 7 handlers to wire toasts into. During 11b-2 I wired the
new `KAIZEN_UPDATE_PROJECT_TYPE` handler to the same `showToast` helper
so the feature's success/error flow is visible. No other handler beyond
the brief's list was modified.

### 3. `OPP_SUBMIT_INTAKE` toasts also fire for validation errors

The brief said "error toast on artifact validation failure" specifically
for `SUBMIT_CLOSE_DIALOG`. I applied the same pattern to
`OPP_SUBMIT_INTAKE` — validation failures now emit an ERROR toast in
addition to the existing error state on the form. This is a strict
superset of the brief so the form is doubly visible when the intake
service rejects.

### 4. Toast `setTimeout` is dependency-injected via `globalThis.setTimeout`

Rather than import `setTimeout` directly, `showToast` reads it off
`globalThis`. This is cheap and test-friendly (node:test provides its
own test-context `setTimeout` but `globalThis.setTimeout` still resolves
to the Node timer). No change to test harness needed.

### 5. Catalog #16 name-only override (no procedure replacement)

The brief specified "Procedure already good (6 steps from 2026-04-23
fill-in); re-label only." I followed this exactly —
`CATALOG_PROCEDURE_REPLACEMENTS[16]` is deliberately absent, and a test
in the Sprint 11 block asserts that. #16 gets its procedure from the
existing `PROCEDURE_FILL_INS[16]` (6 Peer Connection 1:1 steps).

### 6. Hint-strip render position

The brief said "render as a subtle hint strip below the Today page day
badge on empty-state only." The strip lives between the header (which
contains the day badge) and the rhythm explainer — so "below the day
badge" in DOM order. A test asserts this ordering.

## Things I did NOT ship

None in the brief's P0 / P1 / stretch. Every listed item is green.

Potential next-sprint items the brief hinted at but are not in scope:

- Automated device-emulation responsive testing (requires headless
  Chromium; no current harness).
- Toast TTL customization per call-site (currently a fixed 3000 ms).
- Settings page implementation (still hidden; currently renders a
  "Ships next" placeholder on direct URL).
- Insights page implementation (same).
