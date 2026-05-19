# Steps to Complete — Frontend Research Notes
## Sprint: Phase 1 scaffolding (no catalog content yet)

---

## 1. Type Surface Change

**Where `CatalogEntry` lives:** `js/domain/types.js` lines 386–409.

**Current shape (abridged):**
```
@typedef {object} CatalogEntry
  id, activityNumber, name, focusArea, defaultDurationMinutes,
  cadence, trigger, inputs, outputArtifact, participants, procedure,
  bucket, isNonOptional, dependsOn, projectTypeBinding, phaseBinding,
  appliesToRoles, enabledByUser, version, sourceRef
```

**Proposed additive fields** (append to the `@typedef` block at line 408, before the closing `*/`):

```js
 * @property {Array<{id: string, text: string, optional?: boolean}>|undefined} [completionSteps]
 *   Optional ordered steps the user follows to complete this activity.
 *   Defined on PROJECT + CI entries. Absent on COMM, LUNCH, PROTECTED.
 *   `undefined` (not `[]`) when not yet authored — lets callers distinguish
 *   "not defined" from "explicitly empty".
 * @property {string|undefined} [communicationGuidance]
 *   Single-line guidance for COMMUNICATION activities.
 *   Absent on all other bucket types.
```

**§6.5 hit:** YES — this modifies `js/domain/types.js`. Per the file header's own note, this is the §6.5 boundary. The change is purely additive (both fields optional/`undefined` default), so zero migration needed on the ~60 existing catalog entries.

No runtime value exports change — `CatalogEntry` exports `null` (it's a JSDoc-only typedef). The seed pipeline `browserSeed.js`, `ceremoniesAndGenerics.js`, and all parsed entries from `source50.js` remain valid as-is: missing fields are undefined, not errors.

---

## 2. Render Implementation Plan

**Where to insert in `BlockDetailDialog.js`:**

The render is a single template literal returned at line 267. The `rationaleHtml` section is inserted at line 295–296:
```js
    </dl>${rationaleHtml ? `
    <div class="bdd-rationale-section">${rationaleHtml}</div>` : ''}
```

The completion steps section should appear **between** the `</dl>` (end of the data rows) and the `bdd-rationale-section` (the existing rationale). This keeps the ordering: metadata rows → steps → rationale sentence → footer.

**Proposed insertion point:** after line 294 (`</dl>`) and before line 295 (`${rationaleHtml ? ...}`).

**Helper function — proposed:**

```js
/**
 * Render the "Steps to complete" section for PROJECT and CI blocks.
 * Returns an HTML string or '' for no-op buckets.
 *
 * @param {object|null} catalogEntry
 * @param {string|null} bucket
 * @returns {string}
 */
function renderCompletionSteps(catalogEntry, bucket) {
  // LUNCH (bucket === null) and PROTECTED skip entirely.
  // isProtectedBlock is already derived from the activity before this is called —
  // pass `isProtected` as a third arg rather than re-deriving here.
  if (!bucket || bucket === 'COMMUNICATION') return '';

  // PROJECT and CI — render step list or empty state.
  const steps = catalogEntry?.completionSteps;
  if (!Array.isArray(steps) || steps.length === 0) {
    // Phase 1: render empty state (no content yet).
    return `<div class="bdd-steps-section bdd-steps-section--empty">
  <p class="bdd-steps-empty">Steps coming soon.</p>
</div>`;
  }
  const items = steps.map((s) =>
    `<li class="bdd-step-item${s.optional ? ' bdd-step-item--optional' : ''}"
         ${s.optional ? 'aria-label="Optional step"' : ''}
    >${esc(s.text)}</li>`
  ).join('\n');
  return `<div class="bdd-steps-section">
  <h3 class="bdd-steps-heading">Steps to complete</h3>
  <ol class="bdd-steps-list">${items}</ol>
</div>`;
}
```

**Critique of the pseudocode in the brief:**

The brief's pseudocode dispatches on `bucket === 'COMMUNICATION'` to render `communicationGuidance` as a separate branch inside `renderCompletionSteps`. This conflates two concerns. The existing code already renders a `bdd-rationale` section for COMM (lines 221–226 via `getCommRationale`). The `communicationGuidance` field should feed into `getCommRationale` (which already checks `catalogEntry.description` as priority 3 — `communicationGuidance` could slot in at priority 2b or replace that check). Do NOT add a second COMM-specific render path inside `renderCompletionSteps`. Keep them separate:

- `renderCompletionSteps` handles PROJECT + CI only, returns '' for everything else.
- `communicationGuidance` on `catalogEntry` feeds the existing `getCommRationale` path (line 92 check: `typeof catalogEntry.description === 'string'` — could be widened to also check `catalogEntry.communicationGuidance`).

This avoids a parallel render path and keeps the COMM rationale single-source.

**Signature adjustment — pass `isProtected`:**

```js
function renderCompletionSteps(catalogEntry, bucket, isProtected) {
  if (!bucket || bucket === 'COMMUNICATION' || isProtected) return '';
  // ... rest as above
}
```

The `isProtected` flag prevents protected CI ceremonies (Sprint Planning, etc.) from showing step lists — they already have a rationale sentence and no steps will ever be authored for them. This is cleaner than checking the catalog ID set inside the render helper.

Actually: on reflection, protected CI ceremonies *could* eventually get steps (e.g., Sprint Planning steps). The `isProtected` guard is too aggressive. Better: only skip on `!bucket` (LUNCH sentinel) and `COMMUNICATION`. PROTECTED blocks that happen to be PROJECT or CI fall through normally — if `completionSteps` is undefined, they get the empty state, which is harmless since protected blocks never show the Edit button and users understand they can't change them.

**Final recommended signature:**

```js
function renderCompletionSteps(catalogEntry, bucket) {
  if (!bucket || bucket === 'COMMUNICATION') return '';
  const steps = catalogEntry?.completionSteps;
  if (!Array.isArray(steps) || steps.length === 0) {
    return `<div class="bdd-steps-section bdd-steps-section--empty">
  <p class="bdd-steps-empty">Steps coming soon.</p>
</div>`;
  }
  const items = steps.map((s) =>
    `<li class="bdd-step-item${s.optional ? ' bdd-step-item--optional' : ''}"${s.optional ? ' aria-label="Optional — can be skipped"' : ''}>${esc(s.text)}</li>`
  ).join('\n    ');
  return `<div class="bdd-steps-section">
  <h3 class="bdd-steps-heading">Steps to complete</h3>
  <ol class="bdd-steps-list">
    ${items}
  </ol>
</div>`;
}
```

**Where to call it in the template (line reference):**

Insert the call result as `completionStepsHtml` alongside the existing variables around line 218, then emit it between `</dl>` and `bdd-rationale-section` in the return template at line 294–295.

---

## 3. CSS Surface

All new classes live in `app.css`. The existing `bdd-*` block runs from approximately line 3382–3585. New rules append at the end of that block (after `.bdd-btn-edit[disabled]` at line 3579), before the Iter 33 keyframe section at line 3587.

The `bdd-rationale` rules are currently split between line ~736 and the main `bdd-*` block (line ~3383). The new steps classes follow the same per-iter grouping pattern — add a comment header like the existing `/* Iter 47 Phase 2 — .bdd-rationale */` block.

**Proposed rules:**

```css
/* ---------------------------------------------------------------------------
 * Steps to complete section — BlockDetailDialog (Phil's directive Sprint 16b).
 * PROJECT + CI blocks render an ordered step list; COMM/LUNCH skip.
 * Semantic tokens only — no ad-hoc --color-* vars (R3 Phase 1 rule).
 * --------------------------------------------------------------------------- */

.bdd-steps-section {
  padding: 0 16px 12px;
  border-top: 1px solid var(--border-subtle, var(--ink-200, #e7e5e2));
  margin-top: 4px;
}

.bdd-steps-section--empty {
  border-top: none;
  padding-top: 4px;
}

.bdd-steps-heading {
  margin: 10px 0 6px;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-secondary, var(--ink-400, #9ca3af));
}

.bdd-steps-list {
  margin: 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.bdd-step-item {
  font-size: 0.8125rem;
  color: var(--text-primary, var(--ink-900, #111827));
  line-height: 1.4;
}

.bdd-step-item--optional {
  color: var(--text-secondary, var(--ink-400, #9ca3af));
  font-style: italic;
}

.bdd-steps-empty {
  margin: 6px 0 0;
  font-size: 0.8rem;
  color: var(--text-secondary, var(--ink-400, #9ca3af));
  font-style: italic;
}

.bdd-comm-guidance {
  padding: 0 16px 8px;
  font-size: 0.8125rem;
  color: var(--text-secondary, var(--ink-700, #3d3a35));
  line-height: 1.5;
}
```

**Token audit (R3 Phase 1 compliance):**

Every color reference uses `--text-primary`, `--text-secondary`, `--border-subtle`, or `--surface-card`. Fallbacks use existing `--ink-*` vars already in `app.css` (e.g. `--ink-400`, `--ink-900`, `--ink-200`). Zero ad-hoc `--color-*` tokens introduced.

**Dark-mode contrast verification for `--optional` dim styling:**

From existing token declarations in `app.css` (lines 3764–3768):
- Light: `--text-secondary: #3d3a35` on `--surface-card: #ffffff` = 9.7:1 — AA pass
- Dark: `--text-secondary: #ccc8c2` on `--surface-card: #252320` = 8.2:1 — AA pass

The `bdd-step-item--optional` italic variant uses `--text-secondary`, same as `bdd-comm-detail` (already verified at app.css line 3537–3538). No new contrast risk introduced.

**Height overflow:** the `bdd-panel` has `overflow: hidden` (line 3419) and `max-width: 360px` but no explicit `max-height`. A catalog entry with >10 steps will push the dialog taller. Phase 1 mitigation: add `max-height: 80vh; overflow-y: auto;` on `.bdd-panel` in the new CSS block. This is a net improvement for all future long-form content in the dialog, not just steps.

---

## 4. Test Plan

**File:** `tests/ui/components/BlockDetailDialog.steps.test.js`

**Pattern:** mirrors `BlockDetailDialog.iter47.test.js` — `import { test, describe } from 'node:test'`, `import assert from 'node:assert/strict'`, named fixtures at top, grouped describes.

**Fixtures needed:**
```js
const BASE_PROJECT = { id: 'sa_proj', bucket: 'PROJECT', ... }  // re-use from iter47
const BASE_CI     = { id: 'sa_ci',   bucket: 'CI',      ... }
const BASE_COMM   = { id: 'sa_comm', bucket: 'COMMUNICATION', ... }
const LUNCH_ACT   = { id: 'sa_lunch', bucket: null, catalogEntryId: 'recovery_lunch', ... }
const PROTECTED_CI = { id: 'sa_standup', catalogEntryId: 'cer_sprint_planning', bucket: 'CI', ... }

const CAT_WITH_STEPS = {
  id: 'cat_proj',
  completionSteps: [
    { id: 's1', text: 'Define the problem statement.' },
    { id: 's2', text: 'Gather data samples.', optional: true }
  ]
};
const CAT_NO_STEPS   = { id: 'cat_proj_bare' };
const CAT_COMM_GUIDANCE = { id: 'cat_comm', communicationGuidance: 'Send async first.' };
const CAT_COMM_BARE     = { id: 'cat_comm_bare' };
```

**Test cases (~18 tests):**

| # | AC | describe | test |
|---|-----|----------|------|
| 1 | AC-ST1 | PROJECT with steps | renders `.bdd-steps-section` |
| 2 | AC-ST1 | PROJECT with steps | renders `<ol class="bdd-steps-list">` |
| 3 | AC-ST1 | PROJECT with steps | each step text appears via `esc()` |
| 4 | AC-ST2 | PROJECT no steps | renders `.bdd-steps-section--empty` |
| 5 | AC-ST2 | PROJECT no steps | does NOT render `.bdd-steps-list` |
| 6 | AC-ST3 | CI with steps | renders `.bdd-steps-section` |
| 7 | AC-ST3 | CI with steps | renders `<ol class="bdd-steps-list">` |
| 8 | AC-ST4 | CI no steps | renders `.bdd-steps-section--empty` |
| 9 | AC-ST5 | COMM with communicationGuidance | does NOT render `.bdd-steps-section` (any variant) |
| 10 | AC-ST5 | COMM with communicationGuidance | `communicationGuidance` text appears in `bdd-rationale` |
| 11 | AC-ST6 | COMM no guidance | does NOT render `.bdd-steps-section` |
| 12 | AC-ST6 | COMM no guidance | generic rationale fallback still renders |
| 13 | AC-ST7 | LUNCH (bucket null) | does NOT render `.bdd-steps-section` |
| 14 | AC-ST8 | PROTECTED CI ceremony | does NOT render `.bdd-steps-section` (steps undefined → empty state renders) — NOTE: actually re-evaluate: protected CI *will* show empty state in Phase 1; if that's undesirable, add `isProtected` guard |
| 15 | AC-ST9 | optional step | `.bdd-step-item--optional` class present on that `<li>` |
| 16 | AC-ST9 | optional step | `aria-label="Optional — can be skipped"` on optional `<li>` |
| 17 | AC-ST10 | META orthogonal | COMM block does NOT render `.bdd-steps-list` even with `completionSteps` on catalogEntry |
| 18 | AC-ST10 | META orthogonal | XSS guard: step text with `<script>` is HTML-escaped |

Note on AC-ST8/PROTECTED: The render helper as designed will show `bdd-steps-section--empty` for protected CI ceremonies in Phase 1 (steps are undefined). If Phil wants NO steps section on protected blocks, add `isProtected` as a third arg and a guard. This is a product decision — flag it for Phil before Phase 1 ships.

**Estimated test count:** 18 across ~8 describe blocks.

---

## 5. Catalog Seed Data — Phase 2 Candidates

Highest-traffic entries for step authoring (Phil's authority on content):

| Priority | Catalog ID | Name | Bucket |
|----------|-----------|------|--------|
| P0 | `gen_deep_work_project` | Deep Work — Project Task (generic) | PROJECT |
| P0 | `cat_34_cause_and_effect_matrix` | Cause & Effect Matrix | PROJECT |
| P0 | `gen_end_of_activity_reflection` | End-of-Activity Reflection | CI |
| P1 | `cat_1_personal_learning_and_development_l_d_tracker` | Personal L&D Tracker | CI |
| P1 | `cat_12_pdca_cycle` | PDCA Cycle | CI |
| P1 | `cer_sprint_planning` | Sprint Planning | CI |
| P1 | `cer_sprint_retrospective` | Sprint Retrospective | CI |
| P2 | `gen_weekly_reflection` | Weekly Reflection | CI |
| P2 | `gen_lessons_learned` | Lessons Learned | CI |
| P2 | Any DMAIC entry #20–#41 | (first DMAIC the user runs) | PROJECT |

P0 entries are the ones that appear every day for every active user (generic deep work, end-of-activity reflection) or are the most prominent PROJECT entry (Cause & Effect Matrix in the browser seed). Content authoring is Phil's call.

---

## 6. Effort & Risk

### Phase 1: UI scaffolding + empty state (no content)

- **Effort:** ~3–4h
  - `js/domain/types.js` typedef update: 0.25h
  - `renderCompletionSteps` helper in `BlockDetailDialog.js`: 1h
  - CSS additions in `app.css`: 0.5h
  - Test file `BlockDetailDialog.steps.test.js` (18 tests): 1.5h
  - Manual smoke test in browser: 0.5h

- **§6.5 hit:** YES — `js/domain/types.js` is modified. Both new fields are optional/undefined-default, no migration required.

- **Test count:** ~18

- **Blast radius:** Single component (`BlockDetailDialog.js`) + one CSS section + one typedef. The existing 50+ tests in `BlockDetailDialog.test.js` and `BlockDetailDialog.iter47.test.js` are not broken — the new helper returns empty state for any entry without `completionSteps` (which is all current entries).

### Phase 2: Seed 5–10 entries with step content

- **Effort:** ~1–2h (data entry once Phil authors step text)
  - Add `completionSteps` arrays to target entries in `js/catalog/seed/ceremoniesAndGenerics.js` and `browserSeed.js`
  - Regenerate `js/catalog/seed/fullCatalog.json` via `exportFullCatalog.js`
  - Update 5–10 existing test fixtures to include step data; add 3–5 regression tests

- **§6.5 hit:** NO — data-only change in seed files. No type surface change.

- **Test count:** ~5 additional (one "golden step renders correctly" test per seeded entry).

---

## 7. Integration with Existing Architecture

### Per-bucket renderer pattern (Iter 47)

`BlockDetailDialog.js` is a single pure-function component, not a set of per-bucket renderer modules. The "per-bucket renderer pattern" the brief references likely refers to the per-bucket color-bar and rationale logic inside `BlockDetailDialog.js` itself (lines 218–250). The new `renderCompletionSteps` helper follows the same pattern: a helper function with a bucket dispatch at the top, called once in the template. No conflict.

### Modal mutual-exclusion fix (R3 Phase 2)

The steps section is additive HTML inside `bdd-panel`. It has no new `data-action` attributes, no new event handlers, and no new modal-open side effects. Pure content addition. No conflict.

### Edit button (PROJECT only)

The Edit button is emitted at lines 197–203 for non-protected PROJECT blocks. The completion steps section is rendered *before* the footer (where the Edit button lives). No interaction. Phase 1: Edit affordance unchanged, step editing is Phase 4.

---

## 8. Potential Pitfalls

### Long step lists overflowing the dialog

`.bdd-panel` has `overflow: hidden` (app.css line 3419) but no `max-height`. A 15-step list will push the dialog off-screen on short viewports. Fix: add `max-height: 80vh; overflow-y: auto;` to `.bdd-panel` as part of this sprint. This is a net improvement regardless of steps — it future-proofs the dialog for any long content.

### Dark-mode contrast on `--optional` dim styling

`bdd-step-item--optional` uses `--text-secondary`. Token is already verified WCAG AA in both themes (9.7:1 light, 8.2:1 dark — app.css lines 3537–3538). No new risk introduced, same token as the already-live `bdd-comm-detail` class.

### A11y: list must be `<ol>`, optional steps need aria-label

The proposed HTML uses `<ol class="bdd-steps-list">` — correct. Optional steps add `aria-label="Optional — can be skipped"` on the `<li>`. The `<h3 class="bdd-steps-heading">` heading associates visually with the list; for strict a11y, `<h3>` inside a `<dl>`/sibling `<div>` context is fine since `bdd-steps-section` is a sibling div, not inside `<dl class="bdd-body">`.

### HTML escaping

`esc()` is already imported from `../mount.js` at line 34 of `BlockDetailDialog.js`. All step text must pass through `esc(s.text)`. The helper above does this. The `id` field on each step object is not rendered to HTML (used for future keying only) — no escaping needed for it in Phase 1.

### `completionSteps` with `optional` field absent

The proposed `bdd-step-item--optional` check uses `s.optional ? ...` which is falsy for `undefined`, `false`, and missing field. Safe.

### Empty `completionSteps` array vs `undefined`

`!Array.isArray(steps) || steps.length === 0` catches both `undefined` (not authored) and `[]` (authored but empty). Both fall to the empty state. If the product wants to distinguish "not authored yet" from "no steps needed" in Phase 2, add a separate `stepsExplicitlyEmpty: true` flag rather than using `[]`. For Phase 1, the unified empty state is correct.
