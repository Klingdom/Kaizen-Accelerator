# UX_TODAY_COLUMNS_FRONTEND.md
## Today page row column analysis — implementation spec for the `.sa-intention` → `outputArtifact` swap

> Status: Research/spec only. No code changes in this document.
> Author: Frontend Engineer (Sprint 16 prep)
> Date: 2026-04-30

---

## 1. Current implementation map

File: `js/ui/components/ScheduledActivityBlock.js`, function `ScheduledActivityBlock()`.
Template literal at lines 265–278.

| Col # | CSS class         | Source field(s)                                           | Lines (logic)   | Conditional logic                                                |
|-------|-------------------|-----------------------------------------------------------|-----------------|------------------------------------------------------------------|
| 1     | `.sa-when`        | `a.plannedStartAt ?? a.anchor`                            | 187–192, 250–258 | Edit-selected non-protected → `<input type="time">`; else formatted `HH:MM–HH:MM` range string. Sprint 14 + 16a. |
| 2     | `.sa-bucket-chip` | `a.bucket`, `bucketMeta(a.bucket).chipClass`              | 186, 267        | Always rendered. chipClass drives color variant.                 |
| 3     | `.sa-name`        | `a.name ?? a.catalogEntryId ?? '(unnamed)'`, `a.carriedOver`, `a.linkedKaizenId` | 195, 199–202, 268 | Appends `.carried-badge` span if `a.carriedOver`. Appends `.sa-kaizen-chip` span if `kaizenTitle && a.linkedKaizenId`. |
| 4     | `.sa-duration`    | `a.plannedDurationMinutes ?? 0`                           | 196, 269        | Always rendered. Static text: `"${duration}m"`.                  |
| 5     | `.sa-intention`   | `a.intention ?? ''`                                       | 197, 214–218    | Renders `a.intention` when truthy; else renders placeholder `<span class="placeholder">` text. **TARGET for removal/replacement.** |
| 6     | `.sa-state-label` | `stateLabel(a.state ?? 'PROPOSED')` via helper fn         | 43–60, 273      | `stateLabel()` maps state enum → lowercase string. Always rendered. **Target for removal.** |

Additional elements rendered after col 6 (not grid columns — they expand the block height):
- `renderElapsed(a, nowIso)` — `.sa-elapsed`, only in `IN_PROGRESS` state (line 271)
- `renderSkipReason(a)` — `.sa-skip-reason`, only in `SKIPPED` with `reasonCodeIfSkipped` (line 272)
- `runtimeActions` — `.sa-actions`, SCHEDULED and IN_PROGRESS states (lines 87–104, 274)
- `editChrome` — `.sa-edit-actions` or `.sa-lock` (lines 230–237, 275)
- `durationChips` — `.sa-duration-chips`, edit-selected non-protected only (lines 246–248, 276)
- `whyChip` — `WhyChip`, PROPOSED compositionState only (lines 222–225, 277)

---

## 2. `outputArtifact` shape audit

### 2a. Exact field shape

Defined in `js/domain/types.js` lines 288–292:

```
OutputArtifactDef {
  name:     string          // Human label, e.g. "Sprint Backlog"
  schema:   ArtifactSchema  // See distinct values below
  required: true            // Always the literal boolean true; never false in any seed entry
}
```

`ArtifactSchema` is used (but not separately enumerated in types.js; it is the string union used across `OutputArtifactDialog.js` lines 1–30):
`'TEXT' | 'TWO_LIST' | 'NUMERIC' | 'DOCUMENT' | 'CHART'`

No additional fields beyond `name`, `schema`, `required` appear on any seed entry.

### 2b. Coverage across catalog

Total catalog size: **60 entries** (`js/catalog/seed/index.js` line 61: `EXPECTED_CATALOG_SIZE = 60`).

Pipeline guarantees all 60 entries carry `outputArtifact`:
- `fillGaps.js` (§A–§D) sets `outputArtifact` explicitly on rows 19, 20, 23–31, 33, 35–36, 38–43, 49–50.
- `bulkFill.js` (§E.3, lines 121–166) applies rule-based defaults to every entry where `outputArtifact` is still null after fillGaps. The fallback at line 165 is `{ name: 'Activity Output', schema: 'TEXT', required: true }`.
- `ceremoniesAndGenerics.js` defines `outputArtifact` inline on all 11 non-numbered entries (lines 59–63, 93–97, 123–127, 153–157, 183–187, 214–218, 254–258, 284–288, 314–318, 345–349, 376–380).
- `tests/catalog/seed/index.test.js` line 28 asserts no entry has a null `outputArtifact` across the full pipeline.
- `tests/catalog/seed/bulkFill.test.js` line 23 similarly asserts every entry post-bulkFill has `outputArtifact`.

**Entries with outputArtifact defined: 60 / 60 (100%).**
**Entries with null/undefined/missing outputArtifact: 0.**

### 2c. Distinct `kind` (schema) values

Drawn from `bulkFill.js` defaultOutputArtifact and `ceremoniesAndGenerics.js`:

| Schema    | Representative catalog entries                                  |
|-----------|-----------------------------------------------------------------|
| `TEXT`    | CI rows (PDCA Log, Email Hygiene, Standup Notes, Mid-Sprint Review Notes, End-of-Activity Reflection, various comm entries) |
| `DOCUMENT`| Innovation stage outputs, DMAIC/Kaizen step artifacts, Quarterly Plan, Sprint Backlog, 1:1 Notes, Lessons Learned, Weekly Reflection |
| `NUMERIC` | Row #12 (PDCA Tick Measurement)                                 |
| `TWO_LIST`| Sprint Retrospective (Actionable Items), End-of-Activity Reflection (gen_end_of_activity_reflection — overridden in ceremoniesAndGenerics) |
| `CHART`   | Not used in current seed; valid schema per ARCHITECTURE §2.2 and supported by OutputArtifactDialog.js but no seed entry uses it |

### 2d. Existing render logic in `OutputArtifactDialog.js`

`OutputArtifactDialog.js` (lines 40–73) switches on `schema` to render a capture form:
- `TEXT` → `<textarea rows="5">`
- `TWO_LIST` → two side-by-side textareas (`name="left"` / `name="right"`)
- `NUMERIC` → `<input type="number">` + unit label from `artifactDef.unit`
- `DOCUMENT` / `CHART` → title `<input type="text">` + url `<input type="url">`
- Default → `<p class="oad-unknown">` fallback

For the row column, we do NOT need full form rendering. The column should surface a read-only label: `outputArtifact.name` (e.g., "Sprint Backlog") plus optionally a schema badge (e.g., "doc", "text") for visual scannability. This is a new design decision not addressed by `OutputArtifactDialog.js`.

---

## 3. Data path from CatalogEntry to row

### What the row currently receives

`ScheduledActivityBlock` receives `props.activity`, which is a `ScheduledActivity` object. Per `js/domain/types.js` lines 453–473, `ScheduledActivity` carries:
- `catalogEntryId: string` — the FK
- `outputArtifactRef: OutputArtifactRef|null` — the user-captured ref at close time

`ScheduledActivity` does **not** carry `outputArtifact` (the definition). That lives only on `CatalogEntry`.

### Current lookup pattern in `CycleCard.js`

`CycleCard.js` lines 112–136 call `ScheduledActivityBlock` with the raw `activity` object and a few resolved lookups (`explainEntry`, `kaizenTitle`). Neither `outputArtifact` nor the parent `CatalogEntry` is passed down.

### Where catalog lookup happens today (app.js)

`app.js` line 978 defines `lookupActivity()`, which resolves `activity.catalogEntryId` → `CatalogEntry` from `catalogService.list()`. This is already called for modal-triggering actions (e.g., `OPEN_CLOSE_DIALOG` at line 1477 reads `entry.outputArtifact.schema`). The catalog array is also passed to `CycleCard` indirectly via `catalog: catalogForEdit` in the `Today` props (line 596), but `CycleCard` currently ignores it.

### Simplest path forward

Two options:

**Option A (preferred) — pre-resolve in CycleCard caller.** `renderActivityList` in `CycleCard.js` already iterates activities and resolves lookups before passing to `ScheduledActivityBlock`. The caller (`app.js`) already passes `catalog` to `Today.js` (line 596). `Today.js` passes `catalog` to `CycleCard` (already supported as a prop route via `catalog: catalogForEdit`). Add `catalogById: Record<string, CatalogEntry>` to the `renderActivityList` opts and pass `catalogById[a.catalogEntryId]?.outputArtifact ?? null` as a new prop `outputArtifact` to `ScheduledActivityBlock`.

**Option B — pass catalog to block, resolve inline.** Pass the full catalog array as a prop to `ScheduledActivityBlock` and let it do its own lookup. This is a heavier prop and a responsibility leak into a pure render leaf. Not preferred.

**Recommendation: Option A.** Build the `catalogById` map once in `CycleCard.js` from the `props.catalog` array (O(n) once) and thread `outputArtifact` as a resolved scalar prop into `ScheduledActivityBlock`. This parallels the existing `explainEntry` and `kaizenTitle` resolution pattern already in `CycleCard.js` lines 117–131.

No changes needed to `js/composer/`, `js/engine/`, `js/domain/types.js`, or `js/events/`.

---

## 4. Removal of `.sa-state-label` — blast radius

### Tests (`tests/`)
`grep -r "sa-state-label" tests/` → **0 matches** (confirmed: zero test files reference this selector).

### CSS (`app.css`)
Two occurrences:
- `app.css:443` — desktop rule `.sa-state-label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; text-align: right; }` (6 lines)
- `app.css:1408` — inside `@media (max-width: 600px)` breakpoint block, listed as part of a selector group `.sa-intention, .sa-state-label { text-align: left; }`. Removing `.sa-state-label` from that grouped selector is safe; `.sa-intention` stays (until it too is removed).

### JS (js/ui/)
`grep -r "sa-state-label" js/ui/` → **1 match**: `ScheduledActivityBlock.js:273` — the template literal that emits the div.

### Verdict
Safe to remove. Total blast radius: **1 JS line** (template literal) + **2 CSS blocks** (one standalone rule at line 443, one entry in a grouped mobile selector at line 1408). No test changes required. The `stateLabel()` helper function (lines 43–60) also becomes dead code — it should be removed alongside the column.

---

## 5. Removal of `.sa-intention` — blast radius

### Tests (`tests/`)
`grep -r "sa-intention" tests/` → **0 matches**. No test file references this selector.

### CSS (`app.css`)
Two occurrences:
- `app.css:433–441` — three rules: `.sa-intention { ... }` (6-line block) and `.sa-intention .placeholder { color: var(--border-strong); }`.
- `app.css:1407` — mobile breakpoint: `.sa-intention,` is the first entry in the grouped selector `.sa-intention, .sa-state-label { text-align: left; }`. If both are removed together, the entire grouped selector block goes away.

### JS (js/ui/)
`grep -r "sa-intention" js/ui/` → **1 match**: `ScheduledActivityBlock.js:214` — the `intentionBlock` const that builds the `<div class="sa-intention">`.

### Upstream references
`UX_REVIEW_TODAY_QA.md:69` and `UX_REVIEW_TODAY_DESIGN.md:202` reference `.sa-intention` in spec/review docs but these are not shipped code.

### Verdict
Safe to remove. The `intentionBlock` const (lines 214–218) and its reference in the template literal at line 270 both go away. Total blast radius: **2 JS lines** (const declaration at 214–218 + usage at 270) + **3 CSS rules** across 2 locations. No test changes required.

---

## 6. Column renderer skeleton (pseudocode, NOT implementation)

After changes: remove `.sa-state-label` (col 6), replace `.sa-intention` (col 5) with `.sa-output-artifact`.

```
ScheduledActivityBlock(props) {
  // resolve existing fields ...
  const outputArtifact = props.outputArtifact ?? null
    // shape: { name, schema, required } | null

  // New column: output artifact label
  const outputArtifactBlock =
    outputArtifact
      ? `<div class="sa-output-artifact" aria-label="output artifact">
           <span class="sa-artifact-name">${esc(outputArtifact.name)}</span>
           <span class="sa-artifact-schema">${esc(outputArtifact.schema.toLowerCase())}</span>
         </div>`
      : `<div class="sa-output-artifact sa-output-artifact-none" aria-label="output artifact">
           —
         </div>`

  return `<li class="${classes}" ...>
    <div class="sa-when" ...>${whenInner}</div>           // col 1 — KEEP
    <div class="sa-bucket-chip ...">...</div>             // col 2 — KEEP
    <div class="sa-name">...${carried}${kaizenChip}</div>// col 3 — KEEP
    <div class="sa-duration">...m</div>                   // col 4 — KEEP
    ${outputArtifactBlock}                                // col 5 — NEW (was .sa-intention)
    // .sa-state-label removed                            // col 6 — GONE
    ${renderElapsed(a, nowIso)}
    ${renderSkipReason(a)}
    ${runtimeActions}
    ${editChrome}
    ${durationChips}
    ${whyChip}
  </li>`
}
```

The `props.outputArtifact` value is pre-resolved by the caller (`CycleCard.renderActivityList`) from the catalog. The block remains a pure function.

---

## 7. CSS impact

### Current grid declaration
`app.css:370`:
```css
grid-template-columns: 100px 120px 1fr 60px 1fr 90px 80px;
```

Seven column tracks map to the seven explicit divs: `.sa-when` (100px), `.sa-bucket-chip` (120px), `.sa-name` (1fr), `.sa-duration` (60px), `.sa-intention` (1fr), `.sa-state-label` (90px), and `.sa-actions` / overflow (80px). Note that the additional conditionally-rendered elements (elapsed, skip-reason, edit chrome, chips, why-chip) fall outside the grid column count and wrap to new rows because the `<li>` is `display: grid` with `align-items: center` — overflow elements span across all columns implicitly in the block direction.

### Required change
Remove one track (`.sa-state-label` = 90px) and rename one track (`.sa-intention` 1fr → `.sa-output-artifact`). The track count drops from 7 to 6:

```css
/* proposed */
grid-template-columns: 100px 120px 1fr 60px 1fr 80px;
```

The `1fr` slot previously occupied by `.sa-intention` stays and is reassigned to `.sa-output-artifact`. The 90px slot for `.sa-state-label` is removed. The trailing 80px slot for `.sa-actions` area remains.

### Mobile breakpoint (app.css ~1396–1410)
The `@media (max-width: 600px)` block at line 1396 already overrides `.sa-block` to `grid-template-columns: 1fr` (single-column stack). No structural change needed there beyond removing the class names from the grouped text-alignment rule at line 1407–1409.

### New CSS needed
`.sa-output-artifact` rule: inherit the italic/muted treatment from `.sa-intention` or redesign it (decision for the implementer). `.sa-artifact-schema` badge: small uppercase text, muted color. Approximately 6–10 new CSS lines.

CSS files to touch: `app.css` only.

---

## 8. Test impact

### Files referencing `.sa-state-label` directly
Zero test files. No test updates required for this removal.

### Files referencing `.sa-intention` directly
Zero test files. No test updates required for this removal.

### Files asserting column count/order
No test in `tests/` enumerates the `grid-template-columns` track count or asserts 6 vs 7 child divs in `.sa-block`. The `ScheduledActivityBlock.kaizenChip.test.js` file (tests/ui/components/) tests kaizen-chip presence only and does not assert column structure. `CycleCard.test.js` checks composition-state rendering but not column structure.

### Today.ccc.test.js — impact assessment
`tests/ui/pages/Today.ccc.test.js` tests at lines 183–261:
- Counts presence of named CSS class regions (`REGIONS` array, lines 67–80). Neither `.sa-state-label` nor `.sa-intention` appear in the REGIONS registry.
- Word-count assertions on `PROSE_REGIONS` (lines 91–97) — these target `rhythm-explainer-copy`, `morning-recap`, `eod-closure-strip`, `why-this-plan-chip`. None reference `.sa-intention` or `.sa-state-label`.
- The fixture activities (`mkActivity`, lines 112–123) do not carry `outputArtifact` on the activity object, but with Option A the pre-resolution happens in `CycleCard` from the catalog, and the CCC test fixture does not pass a `catalog` prop to `Today`. The `outputArtifactBlock` will safely render the `—` null-state branch. CCC count is unaffected (same number of outer regions).

**Conclusion: `Today.ccc.test.js` does not break** due to either removal or the new column, provided the null-guard in the pseudocode (section 6) is implemented.

### New tests needed
- `ScheduledActivityBlock` unit test: assert `.sa-output-artifact` renders `outputArtifact.name` when prop is provided.
- `ScheduledActivityBlock` unit test: assert null/missing `outputArtifact` prop renders the `—` placeholder.
- `CycleCard` integration test: assert `outputArtifact` is threaded through from `props.catalog` to the rendered block.

Estimated +3 test cases; no existing tests need to be deleted or modified.

---

## 9. Implementation effort estimate

| Sub-task | Primary file(s) | LOC delta | Test delta | Hours |
|----------|-----------------|-----------|------------|-------|
| Remove `.sa-state-label` (col 6) | `ScheduledActivityBlock.js` (–1 template line, –17 lines for `stateLabel()` fn), `app.css` (–8 lines) | –26 LOC | 0 | 0.5h |
| Remove `.sa-intention` (col 5) | `ScheduledActivityBlock.js` (–5 lines for `intentionBlock` const + reference), `app.css` (–9 lines) | –14 LOC | 0 | 0.5h |
| Add `.sa-output-artifact` column | `ScheduledActivityBlock.js` (+8–12 LOC for new const + template), `app.css` (+8–10 LOC), `CycleCard.js` (+10–15 LOC for catalog-to-map and prop thread) | +30–37 LOC | +3 test cases | 2–3h |
| **Total** | | **–10 to 0 net LOC** | **+3 tests** | **3–4h** |

---

## 10. §6.5 boundary check

The question is whether any change touches `js/composer/`, `js/engine/`, `js/domain/types.js`, or `js/events/`.

- `js/composer/` — not touched. No composer logic is affected.
- `js/engine/` — not touched. No engine rule changes.
- `js/domain/types.js` — not touched. `OutputArtifactDef` already exists at line 288; `ScheduledActivity` already carries `catalogEntryId`. No new typedef needed.
- `js/events/` — not touched. No new event types. The data path resolves at render time from an already-available catalog prop.

**§6.5 hit count: 0.**

Changes are contained to:
- `js/ui/components/ScheduledActivityBlock.js`
- `js/ui/components/CycleCard.js`
- `app.css`

---

## 11. Risks

### Risk 1: Null `outputArtifact` on activities whose catalog entry is absent or custom

The catalog lookup in `CycleCard.js` will return `null` if `catalogById[a.catalogEntryId]` is not found — which can happen for activities created from deprecated entries, hand-crafted test fixtures, or Kaizen-linked activities using a custom `catalogEntryId` not in the standard seed. The row renderer must unconditionally handle `props.outputArtifact === null` and show a safe placeholder (e.g., `—` or nothing). Failure to do so will throw or render `undefined` inline.

Mitigation: implement the null branch in the renderer as shown in section 6. Add a unit test for the null case.

### Risk 2: Grid track count mismatch causes layout breakage on non-standard activity states

The `grid-template-columns` change from 7 to 6 tracks means any CSS rule that references positional columns by `grid-column: N` will shift. A search of `app.css` for `grid-column` within `.sa-block` context should be done before implementation. The conditionally-rendered sub-elements (elapsed, skip-reason, edit chrome, chips) are not individually column-placed today — they span implicitly — so the risk is low but must be confirmed by visual regression.

Mitigation: search `app.css` for `grid-column` usage inside `.sa-block` before shipping; run the app visually in all six activity states (PROPOSED, SCHEDULED, IN_PROGRESS, CLOSED, SKIPPED, DROPPED) with and without edit mode.

### Risk 3: `outputArtifact.name` length causing overflow at narrow viewports

The new column replaces `.sa-intention`'s 1fr flex slot (which already had `overflow: hidden; text-overflow: ellipsis; white-space: nowrap` per `app.css:437–439`). Entry names like "Stakeholder Map (2x2 Influence × Interest)" (42 chars, from `fillGaps.js:90`) or "Retrospective Actionable Items" (30 chars) will truncate. On mobile (1fr single-column stack), wrapping is the expected behavior. On desktop the 1fr slot must keep the ellipsis rules from `.sa-intention`. If these are not carried over to `.sa-output-artifact`, long names will push other columns out of alignment.

Mitigation: copy `overflow: hidden; text-overflow: ellipsis; white-space: nowrap` from the `.sa-intention` rule to the new `.sa-output-artifact` rule. Add a QA checkpoint for a 42-character artifact name at 1280px and 375px viewports.
