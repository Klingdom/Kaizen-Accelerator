# UX Today Columns — QA Validation Report
**Scope:** Today-page column refactor — `.sa-intention` → `outputArtifact` rendering, `.sa-state-label` removal, 1–2 net column additions.
**Author:** QA Agent
**Date:** 2026-04-30
**Status:** PRE-IMPLEMENTATION — Risk assessment and test inventory for planned change.

---

## 1. Test Inventory

### 1a. `.sa-state-label` References

**Grep result: 0 direct `.sa-state-label` selector references in tests.**

The class name itself is not queried by any test. However, the *text content written into it* is asserted in 5 tests in `tests/ui/components/ScheduledActivityBlock.test.js`:

| File | Line | Assertion Type | Break Risk |
|---|---|---|---|
| `tests/ui/components/ScheduledActivityBlock.test.js` | 139 | Text-content: `assert.match(html, />proposed</)` | WILL BREAK |
| `tests/ui/components/ScheduledActivityBlock.test.js` | 147 | Text-content: `assert.match(html, />scheduled</)` | WILL BREAK |
| `tests/ui/components/ScheduledActivityBlock.test.js` | 155 | Text-content: `assert.match(html, />in progress</)` | WILL BREAK |
| `tests/ui/components/ScheduledActivityBlock.test.js` | 162 | Selector-class only: `sa-state-closed` (on `<li>`, not label) | Survives — class is on the `<li>` wrapper |
| `tests/ui/components/ScheduledActivityBlock.test.js` | 169 | Selector-class only: `sa-state-skipped` (on `<li>`, not label) | Survives — class is on the `<li>` wrapper |

Note: Lines 134, 142, 150 are `test()` description strings containing the state label text. They do not produce assertions on their own.

**CSS:** `app.css` lines 1403–1410 include `.sa-state-label` in a mobile `text-align: left` rule and a standalone rule at lines 443–449. Both must be removed or updated when the element is removed.

### 1b. `.sa-intention` References

**Grep result: 0 direct `.sa-intention` selector references in tests.**

The intention *behavior* is asserted through 3 test cases in `tests/ui/components/ScheduledActivityBlock.test.js` (describe block "intention (read-only)", lines 369–398):

| File | Line | Assertion Type | Break Risk |
|---|---|---|---|
| `tests/ui/components/ScheduledActivityBlock.test.js` | 380 | Text-content: placeholder string `One line: what outcome by close?` | WILL BREAK |
| `tests/ui/components/ScheduledActivityBlock.test.js` | 387 | Text-content: renders `intention` field value | WILL BREAK if `activity.intention` is superseded by `outputArtifact` |
| `tests/ui/components/ScheduledActivityBlock.test.js` | 395 | XSS: HTML-escaping of intention value | WILL BREAK or require redirect to `outputArtifact` fixture |
| `tests/ui/components/ScheduledActivityBlock.timeEditor.test.js` | 28 | Fixture sets `intention: null` (data, not assertion) | Survives — just a fixture field |

### 1c. DOM-Shape / Column-Count Assertions

**CSS grid definition** (`app.css` line 370):
```
grid-template-columns: 100px 120px 1fr 60px 1fr 90px 80px;
```
This defines **7 explicit columns**. Current mapping:
1. `.sa-when` (100px)
2. `.sa-bucket-chip` (120px)
3. `.sa-name` (1fr)
4. `.sa-duration` (60px)
5. `.sa-intention` (1fr)
6. `.sa-state-label` (90px)
7. Actions / chrome (80px) — implicit from content overflow

Removing `.sa-state-label` and replacing `.sa-intention` leaves 5 defined columns before new additions. Adding 1–2 new columns requires a `grid-template-columns` update. No tests assert the column count directly, but any E2E visual regression test or screenshot comparison would detect the reflow.

**Mobile breakpoint** (`app.css` lines 1300–1316) also has multiple `grid-template-columns` declarations that reference the same column structure. All responsive variants must be updated in sync.

---

## 2. Regression Risk Surface

### 2a. State-Label Removal

**Keyboard navigation:** No keyboard navigation logic references `.sa-state-label` text. Navigation is driven by `data-action` attributes (`EDIT_SELECT_SLOT`, `START_ACTIVITY`, etc.). Risk: NONE for keyboard nav.

**ARIA / screen-reader:** The `<div class="sa-state-label">` carries no `role`, no `aria-live`, and no `aria-label` of its own (confirmed by source inspection of `ScheduledActivityBlock.js` lines 265–278). State is currently only expressed via:
- The CSS class on `<li>` (e.g. `sa-state-proposed`, `sa-state-in_progress`) — survives removal
- The visible text "proposed" / "in progress" inside `.sa-state-label` — this IS the only explicit state verbalization in the DOM

**Finding:** Removing `.sa-state-label` removes the only human-readable state string in the rendered HTML. Screen readers that traverse the row linearly will no longer announce state. The CSS class `sa-state-in_progress` on the `<li>` is machine-meaningful but will not be verbalized by a screen reader unless a role or aria-label is added elsewhere. This is a **MEDIUM accessibility regression** unless `aria-label` on the `<li>` is updated to include state as part of the refactor.

**Tests asserting literal state text (the 3 WILL BREAK cases above):** These must be deleted or repurposed to assert the new state-communication mechanism.

### 2b. Intention Replacement

**Onboarding / coach-mark:** The placeholder string `"One line: what outcome by close?"` exists only in `ScheduledActivityBlock.js` line 217. It is not referenced in any tooltip, onboarding banner, or coach-mark component (confirmed by full-codebase grep). The `RhythmExplainer` and `today-onboarding-hint` components do not mention it. Risk: NONE for onboarding regression.

**The `outputArtifact` field location:** `CatalogEntry.outputArtifact` is a property of the *catalog entry*, not the `ScheduledActivity` row itself. The activity row carries `catalogEntryId` (a foreign key). The renderer must do a lookup — either passing `outputArtifact` as a prop or resolving it from a catalog map passed into `ScheduledActivityBlock`. This lookup path is not currently implemented in the component. The implementation must define the prop-passing contract before tests can be written.

---

## 3. CCC Proxy Test Impact

The `Today.ccc.test.js` (added Iter 21) measures **named page-level regions**, not row-level columns. The REGIONS registry (`Today.ccc.test.js` lines 67–80) contains 12 entries:

```
header, adherence-dial, morning-recap, rhythm-explainer,
now-pane, up-next-mobile, why-this-plan, cycle-card,
bucket-strip, cycle-activities, up-next-rail, eod-closure
```

The column change affects **row-level DOM inside `cycle-activities`**, which is a single CCC region regardless of how many columns each row contains. Removing `.sa-state-label` and replacing `.sa-intention` with `outputArtifact` rendering **does not add or remove any CCC region**.

Adding 1–2 new *page-level* sections would add to the CCC count. If the new columns are contained within existing regions (e.g., inside the `cycle-activities` region's row cells), they do not register as new CCC regions and the count stays at the current measured value (confirmed: the 12-region cap applies at the Today page region level, not at the `<li>` column level).

**Current measured CCC:** Based on the 3-activity PROPOSED fixture, the active-composition render hits at most all 12 registered regions if all optional components render. The test asserts `ccc <= 12`.

**Post-change CCC:** UNCHANGED — the column refactor lives entirely inside `sa-block` rows, which are children of `cycle-activities`. The CCC assertion will not fail due to this refactor.

**Risk:** LOW — no CCC test edits required unless a net-new page-level region (e.g., a new panel above or below the activity list) is added as one of the 1–2 "under review" additions.

---

## 4. Variance / Audit-Trail Risk

**Activity state field:** `ScheduledActivity.state` is written to and read from `bamx:v1:activities` in localStorage via `ActivityService` (`ActivityService.js` lines 283–405). The FSM transitions (`SCHEDULED → IN_PROGRESS → CLOSED`, `SCHEDULED → SKIPPED`) write the raw enum value (`'IN_PROGRESS'`, `'CLOSED'`, etc.) to the data layer.

**VarianceService:** Logs rows to `bamx:v1:variances` with fields `scheduledActivityId`, `compositionId`, `catalogEntryId`, `userId`, `kind`, `reasonCode`, `note`. No `state` label string is written to the variance log (confirmed by full read of `VarianceService.js`).

**Event payloads:** `ActivityStarted`, `ActivityStartedLate`, `ActivityCompleted` (`events.js` lines 87–90) carry `scheduledActivityId` and `scheduledAt`, not the human state label string.

**Conclusion:** The human-readable state label ("proposed", "scheduled", etc.) is generated at render time by the `stateLabel()` function (`ScheduledActivityBlock.js` lines 43–59). It is NEVER written to localStorage, Variance log, or event payloads. Removing the visible `<div class="sa-state-label">` is safe from a data-integrity standpoint. The `activity.state` enum field must be preserved on the data model — which it is, as it drives FSM guards and is independent of this render change.

---

## 5. New Test Coverage Required

Minimum tests to be authored before this change is considered shippable:

1. **`outputArtifact` renders when CatalogEntry has one** — Pass an activity with `catalogEntryId` pointing to an entry whose `outputArtifact.name` is defined. Assert the artifact name appears in the rendered `<li>`. Requires the component API to accept `catalogEntry` (or `outputArtifact`) as a prop.

2. **Fallback when CatalogEntry has none** — Pass an activity where the resolved `outputArtifact` is `null` (e.g., catalog source50 row 17 which has `outputArtifact: null`). Assert the column renders empty or hidden (no visible text, no broken markup).

3. **Fallback when `catalogEntryId` is null** — Custom or user-defined activities may have no `catalogEntryId`. Assert graceful empty render with no thrown error.

4. **Lunch / protected block** — Lunch block is a protected block (`isProtectedBlock` returns true). Lunch entries are expected to have no meaningful `outputArtifact`. Assert the column is empty and the protected-lock chrome still renders correctly.

5. **State inferred from composition state and visual treatment** — With `.sa-state-label` removed, assert that `sa-state-in_progress` class is present on the `<li>` for IN_PROGRESS activities (state still detectable via CSS class). Assert that the elapsed timer (`sa-elapsed`) is rendered for IN_PROGRESS as the remaining in-state signal.

6. **State inferred for SKIPPED without label** — Assert `sa-state-skipped` class on `<li>` and `sa-skip-reason` still renders for SKIPPED state (these are the surviving signals).

7. **Edit-mode chrome positions correctly after column removal** — With one fewer column, the `sa-edit-actions` buttons must still render in the correct grid position. Assert that `data-action="EDIT_SELECT_SLOT"` and `data-action="EDIT_REMOVE_SLOT"` are present and that no layout-breaking empty column cell is injected.

8. **ARIA: state announced via `aria-label` or `<li>` attribute** — After removal of `.sa-state-label`, assert that the `<li>` element carries an `aria-label` containing the state string, OR that a dedicated ARIA element announces the state. This test should FAIL until the implementation team adds the ARIA annotation (written as a pre-condition acceptance test).

---

## 6. Edge Cases to Test (8+)

| # | Edge Case | Test Assertion | Risk |
|---|---|---|---|
| 1 | `outputArtifact` is `null` on catalog entry | Column renders empty; no `undefined` or `[object Object]` visible | HIGH — affects Lunch + generics |
| 2 | Very long `outputArtifact.name` (60+ chars) | Text is truncated with ellipsis (same overflow treatment as `.sa-intention`) | MEDIUM — layout break |
| 3 | `catalogEntryId` is `null` (custom activity) | No lookup attempted; column renders safely empty | HIGH — user-created blocks |
| 4 | `outputArtifact.name` contains HTML special chars | Characters are HTML-escaped in output (XSS guard) | HIGH — security |
| 5 | Carried-over block (carriedOver=true) | `carried-badge` still renders; `outputArtifact` column populated normally | LOW |
| 6 | Kaizen-linked block (linkedKaizenId set) | `sa-kaizen-chip` still renders; `outputArtifact` column renders alongside it without overflow | MEDIUM |
| 7 | IN_PROGRESS state without `.sa-state-label` | Elapsed timer visible; Close button visible; state communicated via CSS class and ARIA | HIGH — primary user-facing state |
| 8 | SKIPPED state without `.sa-state-label` | Skip reason (`sa-skip-reason`) visible; CSS class `sa-state-skipped` present | MEDIUM |
| 9 | Activity with `outputArtifact.schema = 'DOCUMENT'` | Name renders as string; schema not exposed in the row column (it drives the close dialog, not the row) | LOW |
| 10 | Two activities side-by-side with different `outputArtifact` name lengths | Column widths remain consistent (CSS grid enforces fixed widths per column definition) | LOW |

---

## 7. Manual QA Checklist (Post-Implementation)

Human must click through these 10 items against a running app after the change ships:

1. **Proposed plan view:** Load a PROPOSED composition. Confirm each row shows `outputArtifact.name` in the appropriate column and that no column is blank/broken where a catalog activity is present.
2. **Empty artifact column — Lunch block:** Confirm the Lunch row does not show a missing/null artifact name; the cell is visually empty (not "undefined" or "null").
3. **Custom activity row:** Create an ad-hoc activity with no `catalogEntryId`. Confirm the artifact column renders as blank and no JS error appears in console.
4. **State visual treatment — IN_PROGRESS:** Start an activity. Confirm the row styling changes (e.g., highlighted border per `sa-state-in_progress` class) and the elapsed timer shows, even without the "in progress" text label.
5. **State visual treatment — SKIPPED:** Skip an activity. Confirm the row shows the danger border and skip-reason label. Confirm there is no empty space where the state label was.
6. **Screen reader walkthrough:** Use VoiceOver/NVDA to navigate one activity row. Confirm the state is announced in some form (either `aria-label` on `<li>` or a visually-hidden element).
7. **Edit mode — select and remove:** Enter edit mode. Click a non-protected row. Confirm the Select / Remove buttons appear in the correct visual position and the row reflows correctly with the updated column count.
8. **Edit mode — duration chips:** Select a non-protected row and verify duration chips appear correctly. Confirm the grid does not overflow or collapse.
9. **Mobile responsive (narrow viewport):** At 375px width, confirm all visible columns stack correctly per the mobile `grid-template-columns` override. Confirm the `outputArtifact` column is readable and not cut off.
10. **Long artifact name:** Load an activity whose catalog entry has a long `outputArtifact.name` (e.g., "Updated Program Plan with Stakeholder Sign-off"). Confirm text truncates with ellipsis and does not break the row layout.

---

## 8. Test Count Delta Estimate

| Category | Count |
|---|---|
| Tests to DELETE (state-label text assertions, lines 139/147/155 of ScheduledActivityBlock.test.js) | 3 |
| Tests to EDIT (intention describe block — 3 tests repurposed to `outputArtifact` assertions; XSS test redirected) | 3 |
| NEW tests — outputArtifact rendering (has value, null, null catalogEntryId, Lunch) | 4 |
| NEW tests — state communication without label (IN_PROGRESS visual, SKIPPED visual, CSS class, ARIA) | 4 |
| NEW tests — edit-mode chrome positioning post-column-change | 1 |
| NEW tests — edge cases (XSS on artifact name, long name, carried block, kaizen block) | 4 |
| **Net new tests** | **+13 new, -3 deleted, 3 edited = net +10** |

---

## 9. Risk Severity: MEDIUM

**Justification:**

The change has no data-integrity risk (state enum is never derived from the visible label). The CCC contract is unaffected. However, three conditions elevate risk from LOW:

1. **ARIA regression is a near-certain gap.** The current implementation has no `aria-label` on the `<li>` that announces state. Removing the only human-readable state text in the DOM creates an accessibility hole that must be explicitly closed in the implementation. It will not fail automated unit tests unless the ARIA acceptance test (item 8 in §5) is written first — which it has not been.

2. **The `outputArtifact` prop-passing contract is undefined.** `ScheduledActivityBlock` currently receives `activity` and props — it does not receive a `catalogEntry` object or a resolved `outputArtifact`. The implementation must define whether the component accepts a `catalogEntry` prop, a resolved `outputArtifact` string, or a catalog-lookup map. Until that contract is specified, the 13 new tests cannot be written correctly and the 3 intention tests cannot be redirected.

3. **CSS grid column count mismatch.** The current grid has 7 template columns. Removing 1 (`.sa-state-label`) and replacing 1 (`.sa-intention`) leaves 6 before new additions. If 1–2 new columns are added as additional `<div>` children without updating `grid-template-columns`, the layout silently breaks (children wrap or overflow). The mobile breakpoints have independent declarations that must be updated in sync.

---

## 10. Rollback Plan

The change is contained to a single component and its CSS:

- **Source:** `js/ui/components/ScheduledActivityBlock.js`
- **CSS:** `app.css` (`.sa-intention`, `.sa-state-label` rules, `grid-template-columns`)

**Single-toggle revert path:**
1. `git revert <commit>` on the ScheduledActivityBlock implementation commit. This restores the original `intentionBlock` render and re-adds the `<div class="sa-state-label">`.
2. `git revert <commit>` on the CSS commit to restore the 7-column grid definition and the two class rules.
3. Re-run `node --test` to confirm the 3 deleted state-label text tests pass again.

No data migration is required. `activity.intention` and `activity.state` fields remain in localStorage regardless of render changes. The revert is read-only from the persistence layer's perspective — no rollback script needed.

If the regression is discovered post-ship without a clean commit boundary, the minimum surgical fix is: re-add `<div class="sa-state-label">${esc(stateLabel(state))}</div>` at line 273, restore the `intentionBlock` assignment at lines 214–218, and restore the `grid-template-columns` rule. The `stateLabel()` function at lines 43–59 does not need to be re-added if it was kept in place.

---

*Validated against: `ScheduledActivityBlock.js` (lines 43–278), `Today.ccc.test.js` (full file, Iter 21), `ScheduledActivityBlock.test.js` (lines 125–398), `app.css` (lines 364–449, 1300–1410), `VarianceService.js`, `ActivityService.js`, `events.js`.*
