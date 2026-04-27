# E14 — Validated Kaizen Portfolio Build Spec

Owner: system-architect
Status: v0.1 — build-ready spec for IMPROVEMENT_BACKLOG candidate C-PM-2.
Iteration: 11.
Inputs: ARCHITECTURE.md v0.5, DELIVERY_PLAN.md v0.3 (E14 line 32), PRODUCT_BLUEPRINT.md §4.1 item 4, existing Portfolio.js + ValidatedKaizenCard.js (Sprint 8 P1-T4).

## 1. The Actual Gap

Already built (do not rebuild):
- `js/ui/components/ValidatedKaizenCard.js` lines 1-53 — single CLOSED-Kaizen row with closeKind badge, delta percent, closedAt.
- `js/ui/pages/Portfolio.js` lines 167-204 — "Validated Kaizens" section with empty state + count header, sorted by `closedAt` desc.
- Domain fields on `Kaizen` (`js/domain/types.js` lines 549-583): `closedAt`, `closeKind`, `projectType`, `implementationCostDollars`, `annualBenefitsDollars`, `roiProjections[].financePartnerUserId`, `lessonsLearned`, `abandoned`.
- Routes (`js/ui/router.js` lines 26-71): `INSIGHTS` registered but resolves to `PlaceholderPage`; `PORTFOLIO` is live.

Missing for E14 DONE (DELIVERY_PLAN line 32):
- A canonical analytics-style page at `/insights/portfolio` with full columns (baseline / remeasurement / delta / closeKind / ROI / closeDate).
- Filters by projectType, closeKind, sponsor.
- CSV export.
- Counts: total Validated; sum of `annualBenefitsDollars` across Validated set.
- A formal "Validated Kaizen" predicate.

## 2. MVP Scope Decisions (the 5 hard problems)

### 2.1 Validated-Kaizen predicate (relax E15 dependency)
- Proposed predicate:
  `kaizen.state === 'CLOSED' && (kaizen.closeKind === 'SUCCESS' || kaizen.closeKind === 'PARTIAL') && kaizen.abandoned !== true && remeasurement != null`
- Rationale: E15 (statistical-validation badges) is post-launch; we already require a non-null Remeasurement at close, and `closeKind` is set by the close-loop logic which already enforces `beatsBaseline`. This is a defensible proxy for "validated delta" without inventing new state.
- TODO marker: when E15 ships, tighten to also require `remeasurement.statisticallySignificant === true` (predicate file will house the upgrade flag).

### 2.2 Finance-signed handling
- Decision: For DMAIC two-pass kaizens, treat the latest `roiProjections[]` entry's `financePartnerUserId != null` as Finance-signed. For all other project types, treat Finance-sign as not-applicable (predicate passes by default). Display a small "Finance-signed" tag in the row when present; do NOT use it as a filter.
- Rationale: Finance co-sign workflow is unshipped; using existing field as proxy avoids blocking on an unrelated workflow while preserving traceability when the data is present.

### 2.3 Sponsor filter
- Decision: Drop the sponsor filter from MVP. Substitute a "Lead" filter mapped to `kaizen.implementationLeadUserId` (only meaningful for `KAIZEN_EVENT_90D`; for other types we show "—" and the filter row hides the dropdown when no kaizens have a non-null lead).
- Rationale: There is no `sponsor` field on Kaizen and inventing one is out of MVP scope; lead is the closest existing accountability field and matches DMAIC standard §11 expectations for Kaizen 90.

### 2.4 Route choice
- Decision: Option A.
- Justification: A new `/insights/portfolio` route reuses existing rendering helpers via a shared selector module, leaving the `/portfolio` Validated section untouched as a hand-friendly preview. Option B risks regressing the live `/portfolio` UI; Option C expands scope to a parent `/insights` summary page that no acceptance criterion demands.
- New router entries required (in `js/ui/router.js`):
  - `ROUTES.INSIGHTS` already exists; we resolve `/#insights/portfolio` via the existing `parseHash` `params.sub` path (no router-table change).
  - The page renderer dispatches on `route === 'insights' && params.sub === 'portfolio'`.

### 2.5 CSV export contract
- Mechanism: Browser `Blob` download with `URL.createObjectURL` + transient `<a download>` click. No clipboard fallback.
- Filename pattern: `validated-kaizens-YYYY-MM-DD.csv` (date is local-time `today` per app clock).
- Field order (matches table column order, see §5):
  1. `closedAt`
  2. `id`
  3. `title`
  4. `projectType`
  5. `closeKind`
  6. `baselineValue`
  7. `remeasurementValue`
  8. `deltaAbsolute`
  9. `deltaPercent`
  10. `implementationCostDollars`
  11. `annualBenefitsDollars`
  12. `financePartnerUserId` (empty for non-DMAIC)
- Header row: yes, exact field-order strings above as the first line.
- Newline + escaping: RFC 4180 minimal — `\r\n` line terminator; any field containing `,`, `"`, `\r`, or `\n` is wrapped in `"..."` with internal `"` doubled to `""`. Empty cells emit empty strings. Numbers serialize via `String(n)`; null/undefined → empty.

## 3. Component & File Plan

### Files to create
- `js/services/validatedKaizenSelectors.js` (~110 lines). Pure functions: `isValidatedKaizen`, `summarizeValidated`, `filterValidated`, `kaizensToCsv`. Exports each named.
- `js/ui/pages/InsightsPortfolio.js` (~180 lines). Renders the analytics page; consumes selectors above. Default export: `InsightsPortfolio({kaizens, remeasurementsByKaizenId, baselinesByKaizenId, filters, nowIso})`.
- `tests/services/validatedKaizenSelectors.test.js` (~140 lines).
- `tests/ui/pages/InsightsPortfolio.test.js` (~110 lines).

### Files to modify
- `js/ui/router.js` — no shape change; add a doc comment under the `Routes (MVP)` block noting `#insights/portfolio` is live.
- `js/ui/mount.js` (or wherever `renderApp` dispatches routes — verify in implementation) — add a branch for `route === 'insights' && params.sub === 'portfolio'` that renders `InsightsPortfolio`. Existing `insights` (no sub) continues to render `PlaceholderPage`.
- `js/ui/copy.js` (or `PORTFOLIO_COPY` host file) — append `INSIGHTS_PORTFOLIO_TITLE`, `INSIGHTS_PORTFOLIO_EMPTY`, `INSIGHTS_PORTFOLIO_EXPORT_BUTTON`, `INSIGHTS_PORTFOLIO_SUM_LABEL`. Place keys next to existing `VALIDATED_EMPTY`.
- `js/services/KaizenService.js` — no change. We use existing `listByState(userId, 'CLOSED')` then filter via the selector.

### Files NOT touched
- `js/ui/components/ValidatedKaizenCard.js` — unchanged.
- `js/ui/pages/Portfolio.js` — `renderValidatedKaizens` block (lines 167-204) stays as-is.
- `js/domain/types.js` — no schema change.
- Event bus, store, KaizenService write paths — untouched.

## 4. Data Model
- New fields on existing entities: No.
- New events emitted: No. (Read-only analytics page; export is a client-local Blob.)
- Computed selectors needed: yes — see §6.

## 5. UI Spec

### Route binding
- URL pattern: `/#insights/portfolio`.
- Router-table change: none (uses existing `parseHash` `sub` slot).
- Page module: `js/ui/pages/InsightsPortfolio.js`, exported default `InsightsPortfolio`.

### Page layout (concise prose)
```
+----------------------------------------------------------------+
| Validated Kaizen Portfolio                                     |
| Validated: N    Total Annual Benefits: $X,XXX,XXX              |
| [closeKind: SUCCESS|PARTIAL]  [projectType: all|...]  [Lead: …]|
| [Reset filters]                              [Export CSV]      |
+----------------------------------------------------------------+
| Closed   | Title          | Type | Close   | Base | Remeas |  %|
| 2026-... | Reduce …       | DMA… | SUCCESS | 12.0 | 8.4    |-30|
| ...                                                            |
+----------------------------------------------------------------+
```
- Header row: title, two count chips, filter-control row, Export-CSV button (right-aligned).
- Filter controls: closeKind toggle group (`SUCCESS` / `PARTIAL`, both default ON); projectType toggle group (`KAIZEN_ACCELERATOR_30D` / `KAIZEN_EVENT_90D` / `DMAIC` / `AD_HOC`, all default ON); Lead select (single-select, default "All"). Lead control hidden when no validated kaizen has a non-null `implementationLeadUserId`.
- Table rows: columns listed in §2.5 field order, minus `id` (id stays in CSV but is hidden in UI; clicking a row goes nowhere in MVP).
- Empty state: when `summarize.count === 0` after filters, render `INSIGHTS_PORTFOLIO_EMPTY` copy ("No Validated Kaizens match these filters yet."). When `summarize.count === 0` pre-filter, copy is "No Validated Kaizens yet — close one with SUCCESS or PARTIAL to see it here."
- Loading state: none. `KaizenService.listByState(userId, 'CLOSED')` is synchronous in this codebase.

### Counts shown
- Render BOTH counts side-by-side to satisfy DELIVERY_PLAN literal demand:
  1. "Validated: N" — N = applies §2.1 predicate (ignores filters; this is the universe count).
  2. "Total Annual Benefits: $X,XXX,XXX" — sum of `annualBenefitsDollars` across the Validated universe (NOT filtered). Currency formatted via `Intl.NumberFormat('en-US', {style:'currency', currency:'USD', maximumFractionDigits:0})`.
- Filter chips display the post-filter row count secondary to the universe count: e.g. "Validated: 12  ·  Showing 7".

### Filter behaviour
- Default state: closeKind = both ON; projectType = all ON; Lead = All.
- URL sync: yes. Filter state serializes to query string after the hash sub: `#insights/portfolio?closeKind=SUCCESS,PARTIAL&projectType=DMAIC&lead=user_42`. Router does NOT need to know — `InsightsPortfolio` parses `window.location.hash` directly via a helper. Refresh restores filters.
- Reset button: yes. Clears the query string and re-renders defaults.

## 6. Selectors & Pure Functions

All live in `js/services/validatedKaizenSelectors.js`. All pure (no DOM, no clock except where injected).

- `isValidatedKaizen(kaizen, remeasurement) → boolean`
  - Inputs: a Kaizen object, its Remeasurement (or null).
  - Output: applies §2.1 predicate.
- `summarizeValidated(kaizens, remeasurementsByKaizenId) → {count: number, totalBenefitsDollars: number, byCloseKind: {SUCCESS: number, PARTIAL: number}}`
  - `totalBenefitsDollars` skips null/undefined (treated as 0, but counted in `count`).
- `filterValidated(kaizens, remeasurementsByKaizenId, filterSet) → kaizens[]`
  - `filterSet`: `{closeKinds: Set<string>, projectTypes: Set<string>, leadUserId: string|null}`.
  - Returns only kaizens where `isValidatedKaizen` is true AND each filter slot matches.
- `kaizensToCsv(rows, baselinesByKaizenId, remeasurementsByKaizenId) → string`
  - RFC 4180 minimal compliance per §2.5.
  - Field order per §2.5.
  - Header row included.
- Helper (private): `parseFilterQuery(hash) → filterSet` and `serializeFilterQuery(filterSet) → string`.

## 7. Test Plan

### Unit tests (`tests/services/validatedKaizenSelectors.test.js`)
- `isValidatedKaizen` cases: CLOSED+SUCCESS+remeas → true; CLOSED+PARTIAL+remeas → true; CLOSED+FAILED_HONEST → false; CLOSED+SUCCESS+abandoned=true → false; CLOSED+SUCCESS+remeas=null → false; ACTIVE+SUCCESS → false; null kaizen → false.
- `summarizeValidated`: empty input → zeros; mixed validated/non-validated → only validated counted; null `annualBenefitsDollars` treated as 0 in sum but row counted; `byCloseKind` accurate.
- `filterValidated`: closeKind filter; projectType filter; lead filter; combined filters; empty filterSet matches all validated.
- `kaizensToCsv`: header row present; field order matches §2.5; embedded comma → quoted; embedded `"` → doubled-quoted; embedded `\n` → quoted; null values → empty cell; CRLF terminator; deterministic ordering (sorted by `closedAt` desc to match UI).
- `parseFilterQuery` / `serializeFilterQuery`: round-trip fidelity; missing keys default correctly; unknown keys ignored.

### Component tests (`tests/ui/pages/InsightsPortfolio.test.js`)
- Renders empty pre-filter state.
- Renders empty post-filter state.
- Counts: "Validated: 3", currency formatted (e.g. `$1,250,000`), zero-benefits edge case ("$0").
- Filter toggle interaction: clicking SUCCESS off hides SUCCESS rows.
- Reset button restores defaults.
- Export button click triggers a `Blob` URL creation (assert via spy on `URL.createObjectURL`) and the anchor receives correct `download` attribute matching filename pattern.

### Integration test
- One end-to-end test: route to `#insights/portfolio?closeKind=SUCCESS`, fixture has 2 SUCCESS + 1 PARTIAL + 1 FAILED_HONEST validated-eligible kaizens. Assert: 2 rows rendered, count chip "Validated: 3 · Showing 2", sum unaffected by filter (uses universe).

### Estimated test delta
~22 tests added. Suite-time budget: each test <80 ms (pure JS, no DOM heavy work); total +1.5 s headroom keeps the suite under the 3.5 s ceiling.

## 8. Implementation Sequence (single sprint)

1. Selectors module + unit tests — 2.5 h.
2. CSV serializer + unit tests — 1.0 h.
3. `InsightsPortfolio.js` page (header, counts, table, filter UI, empty states) — 2.5 h.
4. Router/mount dispatch wiring + URL-sync helper — 1.0 h.
5. Export-CSV Blob wiring + component test — 0.75 h.
6. Integration test + copy strings — 0.75 h.
7. Manual smoke + DELIVERY_PLAN doc tick — 0.5 h.

Total: 9.0 project hours. Fits the ≤9-hour budget exactly. If implementation reveals slippage in step 3, descope the Lead filter (§2.3) — selector code stays, UI control is removed; saves ~0.75 h.

## 9. Out of Scope (Explicit)
- E15 statistical-validation badges — re-open trigger: E15 ships `Remeasurement.statisticallySignificant`.
- Finance co-sign workflow — re-open trigger: a `FinanceCoSignRecorded` event lands.
- Sponsor field on Kaizen — re-open trigger: domain proposal adds `sponsorUserId` to `Kaizen`.
- Drill-down from row to detail page — re-open trigger: Kaizen detail route ships beyond placeholder.
- Date-range filter — re-open trigger: user feedback or analytics request specifically asks for cohort/time slicing.
- Per-kaizen `remeasurement.deltaPercent === null` rendering as anything other than "—" — re-open trigger: signed-flip metrics need explicit handling.
- Removing or modifying the `/portfolio` Validated section — re-open trigger: PRD update consolidating the two surfaces.

## 10. Acceptance Criteria

- AC1. Given a user navigates to `#insights/portfolio` with at least one Validated Kaizen, when the page renders, then the header shows `Validated: N` with N equal to the count from `summarizeValidated`. (Test: integration.)
- AC2. Given a user has zero CLOSED kaizens with SUCCESS or PARTIAL, when they navigate to `#insights/portfolio`, then the empty-state copy `INSIGHTS_PORTFOLIO_EMPTY` (universe variant) is rendered and no table appears. (Test: component.)
- AC3. Given the predicate in §2.1, when a Kaizen has `closeKind='FAILED_HONEST'`, then it does NOT appear in the table or in any count. (Test: unit + component.)
- AC4. Given a user clicks "Export CSV", when the click handler runs, then a Blob is created with header row + one line per visible (filter-applied) row in §2.5 field order, and the anchor's `download` attribute equals `validated-kaizens-YYYY-MM-DD.csv`. (Test: component.)
- AC5. Given a user toggles the closeKind filter to SUCCESS only, when the page re-renders, then only rows with `closeKind='SUCCESS'` appear; the universe `Validated: N` count does NOT change; the `Showing M` chip updates to the filtered count. (Test: integration.)
- AC6. Given a user sets filters and reloads the page, when the page renders again, then the same filter state is restored from the URL query string. (Test: component.)
- AC7. Given the `/portfolio` route is loaded, when the page renders, then the existing "Validated Kaizens" section (Sprint 8 P1-T4) is unchanged in markup and behaviour. (Test: existing Portfolio tests must remain green; add a snapshot guard if not already present.)
- AC8. Given a Kaizen has a CSV-hostile title (contains `,`, `"`, or `\n`), when it is exported, then the CSV cell is RFC 4180-quoted with internal quotes doubled. (Test: unit.)
- AC9. Given a Kaizen has `annualBenefitsDollars=null`, when the page renders, then the row shows "—" in the benefits column and the universe sum treats it as 0. (Test: unit + component.)
- AC10. Given a DMAIC Kaizen has `roiProjections[last].financePartnerUserId != null`, when it renders, then a "Finance-signed" tag is present on the row; when null/missing, no tag renders. (Test: component.)

(Risky AC: AC6 — URL-sync depends on `window.location` access from a page module, which the existing render pipeline is hash-only; spec assumes adding a sibling helper that reads `location.hash` directly. If implementation finds the mount layer doesn't expose this cleanly, fallback is to read once on render and accept that filter state is lost on programmatic route changes — flagged in §11.)

## 11. Risk Register

- R1. Mount/route layer lacks a clean hook for `params.sub === 'portfolio'`. Probability: medium. Impact: medium (blocks AC1). Mitigation: spike step 4 first; if dispatch is in `mount.js`, add the branch there; if it's a `pages` map, add a sub-key handler. Worst case, register a synthetic route name `insightsPortfolio` and add to `ROUTES`.
- R2. URL query-string sync is brittle in a hash-only router. Probability: medium. Impact: low (degrades AC6 only). Mitigation: read `location.hash` directly; descope to in-memory filter state if integration test fails — drop AC6 to "nice to have" and document.
- R3. Suite runtime drift. Probability: low. Impact: medium. Mitigation: keep all selector tests pure-JS; component tests use the existing string-render harness, not jsdom-heavy mounts.
- R4. Currency formatting in test environments without `Intl` (older Node). Probability: low. Impact: low. Mitigation: feature-detect and fall back to `'$' + n.toLocaleString('en-US')`.
- R5. CSV download in test environment. Probability: medium. Impact: low. Mitigation: spy on `URL.createObjectURL` and the anchor's `click()`; do not actually download in tests.

## 12. Recommendation

PROCEED-WITH-DESCOPE. The spec fits in 9.0 hours only because we (a) drop the sponsor filter in favour of an existing-field "Lead" filter, (b) treat Finance-signed as a display tag rather than a filter, and (c) accept the relaxed §2.1 validated predicate pending E15. All three descopes are documented with re-open triggers in §9. The remaining surface — predicate + filters + counts + CSV — is mechanical and low-risk because the row component, domain fields, and `/portfolio` consumer already exist. If implementation slips at step 3, drop the Lead filter to recover 0.75 h before expanding the budget.
