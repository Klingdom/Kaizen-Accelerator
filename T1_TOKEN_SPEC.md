# T1 — Bucket-Tone Token Consolidation Build Spec

Owner: system-architect
Status: v0.1 — build-ready spec for IMPROVEMENT_BACKLOG candidate C-UX-1.
Iteration: 13.
Inputs: ARCHITECTURE.md v0.5, UX_DESIGN_THEMES.md §4 T1, UX_REVIEW_TODAY_DESIGN.md §4, UX_REVIEW_TODAY_FRONTEND.md §5–§6, UX_REVIEW_TODAY_QA.md §8 pattern 7.

## 1. The Actual Gap

Bucket-tone derivation is duplicated across four sites with no single source of truth: `js/ui/components/ScheduledActivityBlock.js:36-39`, `js/ui/components/WeekGrid.js:47-50`, `js/ui/components/UpNextRail.js:33-35`, and `js/ui/pages/Week.js:82-88` (inline ternary, no constant). The token system has a name collision: `--primary: #0f172a` (slate, `app.css:21-37`) vs. `--color-primary: #2563eb` (blue, `app.css:1932-1976`) — same word, different roles, drift-prone. UpNextRail uses `.up-next-dot-project` while every other surface uses `.chip-project` — inconsistent join character. There is no `@media (forced-colors: active)` block anywhere in `app.css`, so bucket coding disappears in Windows High Contrast mode (QA §8 pattern 7). What works: the BucketStrip canonical pattern at `app.css:296-342` correctly references `--project-bg` / `--communication-bg` / `--ci-bg` directly via `.bucket-row.bucket-{type}` — that pattern is the model for the rest.

## 2. MVP Scope Decisions (the 5 hard problems)

### 2.1 Naming policy — Option A (chosen)

Keep `--primary` (general UI primary, slate `#0f172a`) and the established `--project-*` / `--communication-*` / `--ci-*` namespace untouched. Rename `--color-primary` → `--accent-primary` and `--color-primary-contrast` → `--accent-primary-contrast`. Rationale: lowest churn (only 2 token names move; the `--color-*` neutrals stay), preserves the working canonical bucket namespace, and resolves the "two primaries" collision by promoting the bright-blue chip action color to its true semantic (`accent`).

### 2.2 bucketMeta(bucket) API

Module: `js/ui/bucketMeta.js`. Pure function, no DOM, no globals, no clock/random reads.

Signature: `bucketMeta(bucket: string | null | undefined): BucketMeta`

Return shape (verbatim):
```
{
  bucket: 'PROJECT' | 'COMMUNICATION' | 'CI' | 'UNKNOWN',
  chipClass: string,    // e.g. 'chip-project'
  dotClass: string,     // e.g. 'chip-project' (post-§2.5 unification)
  label: string,        // e.g. 'Project'
  vars: { bg: string, fg: string, fill: string }  // CSS var names incl. 'var(...)'
}
```

Fallback contract: any input not in `{'PROJECT','COMMUNICATION','CI'}` (including `null`, `undefined`, `''`, lowercased variants, unrecognized strings) returns `{bucket:'UNKNOWN', chipClass:'chip-unknown', dotClass:'chip-unknown', label:'Unscheduled', vars:{bg:'var(--color-surface-muted)', fg:'var(--color-text-muted)', fill:'var(--color-border-strong)'}}`. Bucket comparison is uppercase-strict; helper internally uppercases the input before lookup so callers may pass either form.

### 2.3 Forced-colors handling

New block at end of `app.css`. Selectors covered: `.bucket-row.bucket-project, .bucket-row.bucket-communication, .bucket-row.bucket-ci`, `.sa-bucket-chip.chip-project, .sa-bucket-chip.chip-communication, .sa-bucket-chip.chip-ci, .sa-bucket-chip.chip-unknown`, `.wk-chip.chip-project, .wk-chip.chip-communication, .wk-chip.chip-ci, .wk-chip.chip-unknown`, `.wg-block.chip-project, .wg-block.chip-communication, .wg-block.chip-ci, .wg-block.chip-unknown`, and the unified `.up-next-dot.chip-project, .up-next-dot.chip-communication, .up-next-dot.chip-ci, .up-next-dot.chip-unknown`. System-color mapping: `background-color: Canvas`, `color: CanvasText`, `border: 1px solid CanvasText`, and for the `[data-user-edited="true"]` accent state add `outline: 2px solid Mark; outline-offset: 1px;`. Dot variants get `background-color: CanvasText`. This preserves bucket discrimination via shape/border presence even when colors are stripped.

### 2.4 Visual regression locking

Strategy: text-render snapshots on each component's emitted HTML string. The app is vanilla-JS string-template — no jsdom needed. For each bucket-aware component, add a test that calls the component's render function with a synthetic activity for each of `{PROJECT, COMMUNICATION, CI, null}` and asserts the rendered string contains the exact class token (e.g. `'sa-bucket-chip chip-project'`). Plus one test per CSS file location (text-grep on `app.css`) asserting the unified class names still appear at the canonical line ranges. These tests run before AND after the refactor — the pre-refactor pass establishes the lock; the post-refactor pass proves no drift.

### 2.5 UpNextRail naming inconsistency — RENAME

Rename `.up-next-dot-project` / `.up-next-dot-communication` / `.up-next-dot-ci` → `.up-next-dot.chip-project` / `.up-next-dot.chip-communication` / `.up-next-dot.chip-ci` (compound class). Rationale: aligns with every other bucket-tinted surface (`sa-bucket-chip`, `wk-chip`, `wg-block` all use the `chip-{bucket}` modifier), unblocks `bucketMeta().chipClass` from doing double duty as `dotClass`, and the cost is a one-line CSS rewrite plus the JS update. Migration step: in the same commit, update `app.css` selectors and `UpNextRail.js` to consume `bucketMeta(bucket).dotClass`. No deprecation window — UpNextRail is the only consumer.

## 3. Component & File Plan

### Files to create
- `js/ui/bucketMeta.js` — pure helper module, ~60 lines. Exports: `bucketMeta` (default), `BUCKET_CHIP_CLASS` (legacy const, re-exported for compat), `BUCKET_DOT_CLASS` (legacy const, re-exported for compat), `BUCKET_LABELS` (named export, used by callers that need labels independently).
- `tests/ui/bucketMeta.test.js` — unit tests for the helper, ~80 lines.
- `tests/ui/bucketMeta.regression.test.js` — component-level class-string regression locks, ~120 lines.

### Files to modify
- `app.css` — (a) rename `--color-primary` → `--accent-primary`, `--color-primary-contrast` → `--accent-primary-contrast` everywhere they appear; (b) add `.chip-unknown` rules paralleling the existing `.chip-project` blocks at the three chip-prefix sites (`app.css:399-409`, `app.css:1137-1147`, `app.css:2135-2143`); (c) replace UpNextRail dot selectors with compound-class form per §2.5; (d) append `@media (forced-colors: active)` block per §2.3.
- `js/ui/components/ScheduledActivityBlock.js` — delete `BUCKET_CHIP_CLASS` literal at lines 36-39, import `bucketMeta`, replace lookup with `bucketMeta(activity.bucket).chipClass`.
- `js/ui/components/WeekGrid.js` — same pattern; delete lines 47-50, import, replace lookup.
- `js/ui/components/UpNextRail.js` — delete `BUCKET_DOT_CLASS` at lines 33-35, import, replace with `bucketMeta(item.bucket).dotClass`. Update markup to emit `class="up-next-dot ${dotClass}"`.
- `js/ui/pages/Week.js` — replace inline ternary at lines 82-88 with `bucketMeta(activity.bucket).chipClass`.

### Files NOT touched
- `app.css:296-342` — BucketStrip `.bucket-row.bucket-{type}` canonical pattern. Stays byte-for-byte.
- `app.css:419` — Edit drawer slot picker references `--project-bg`. Token name unchanged.
- All `--color-text-muted`, `--color-border`, `--color-surface-muted`, `--color-text`, `--color-surface-hover`, `--color-border-strong`, `--color-focus-ring` declarations. Out of scope per Iteration 13 charter.
- All `--project-*`, `--communication-*`, `--ci-*` tokens. Hex values and names unchanged.
- Any `.bucket-row.*` selector anywhere in the codebase.

## 4. Data Model

- New fields: No.
- New events: No.
- Schema migration: No.
- Pure helper added: `bucketMeta(bucket)` — see §6.

## 5. CSS Spec

### Token consolidation — `:root` before/after

Before (`app.css:1932-1976`, partial):
```
--color-primary: #2563eb;
--color-primary-contrast: #ffffff;
```

After:
```
--accent-primary: #2563eb;
--accent-primary-contrast: #ffffff;
```

The slate `--primary: #0f172a` and `--primary-contrast: #f8fafc` at `app.css:21-37` are unchanged. Every prior reference to `var(--color-primary)` / `var(--color-primary-contrast)` in `app.css` and any JS template-string is rewritten to the new `--accent-*` names. Grep `var(--color-primary` to enumerate touch points before edit; expected count is small (chip primary-action backgrounds and focus-state contrast).

### Forced-colors block (append to `app.css`)

```
@media (forced-colors: active) {
  .bucket-row.bucket-project,
  .bucket-row.bucket-communication,
  .bucket-row.bucket-ci,
  .sa-bucket-chip.chip-project,
  .sa-bucket-chip.chip-communication,
  .sa-bucket-chip.chip-ci,
  .sa-bucket-chip.chip-unknown,
  .wk-chip.chip-project,
  .wk-chip.chip-communication,
  .wk-chip.chip-ci,
  .wk-chip.chip-unknown,
  .wg-block.chip-project,
  .wg-block.chip-communication,
  .wg-block.chip-ci,
  .wg-block.chip-unknown {
    background-color: Canvas;
    color: CanvasText;
    border: 1px solid CanvasText;
    forced-color-adjust: none;
  }
  .wg-block[data-user-edited="true"] {
    outline: 2px solid Mark;
    outline-offset: 1px;
  }
  .up-next-dot.chip-project,
  .up-next-dot.chip-communication,
  .up-next-dot.chip-ci,
  .up-next-dot.chip-unknown {
    background-color: CanvasText;
    border: 1px solid CanvasText;
  }
}
```

### Class-prefix unification

UpNextRail dot selectors rewritten to compound-class per §2.5. Old `.up-next-dot-project { ... }` rules deleted; new `.up-next-dot.chip-project { ... }` rules added that re-use the same `var(--project-fill)` background. No other prefix changes.

## 6. Pure Helper Spec

```
// js/ui/bucketMeta.js

const META = {
  PROJECT:       { chipClass: 'chip-project',       dotClass: 'chip-project',       label: 'Project',
                   vars: { bg: 'var(--project-bg)',       fg: 'var(--project-fg)',       fill: 'var(--project-fill)' } },
  COMMUNICATION: { chipClass: 'chip-communication', dotClass: 'chip-communication', label: 'Communication',
                   vars: { bg: 'var(--communication-bg)', fg: 'var(--communication-fg)', fill: 'var(--communication-fill)' } },
  CI:            { chipClass: 'chip-ci',            dotClass: 'chip-ci',            label: 'Continuous Improvement',
                   vars: { bg: 'var(--ci-bg)',            fg: 'var(--ci-fg)',            fill: 'var(--ci-fill)' } },
};

const UNKNOWN = {
  chipClass: 'chip-unknown', dotClass: 'chip-unknown', label: 'Unscheduled',
  vars: { bg: 'var(--color-surface-muted)', fg: 'var(--color-text-muted)', fill: 'var(--color-border-strong)' },
};

export default function bucketMeta(bucket) {
  const key = typeof bucket === 'string' ? bucket.toUpperCase() : null;
  const m = (key && META[key]) || UNKNOWN;
  return { bucket: key && META[key] ? key : 'UNKNOWN', ...m };
}

// Legacy compat — deprecated, do not use in new code.
export const BUCKET_CHIP_CLASS = { PROJECT: 'chip-project', COMMUNICATION: 'chip-communication', CI: 'chip-ci' };
export const BUCKET_DOT_CLASS  = { PROJECT: 'chip-project', COMMUNICATION: 'chip-communication', CI: 'chip-ci' };
export const BUCKET_LABELS     = { PROJECT: 'Project', COMMUNICATION: 'Communication', CI: 'Continuous Improvement' };
```

Purity: no DOM access, no `Date.now()`, no `Math.random()`, no module-level mutation after init. Object returned is a fresh shallow copy per call (spread over frozen META entry); inner `vars` object is shared by reference (immutable in practice — string values).

## 7. Test Plan

### Unit tests — `tests/ui/bucketMeta.test.js`
- `PROJECT` returns `{bucket:'PROJECT', chipClass:'chip-project', dotClass:'chip-project', label:'Project', vars:{bg:'var(--project-bg)', fg:'var(--project-fg)', fill:'var(--project-fill)'}}`.
- `COMMUNICATION` returns the documented communication shape.
- `CI` returns the documented CI shape.
- `'project'` (lowercase) returns the PROJECT shape (case-insensitive).
- `null` → unknown fallback.
- `undefined` → unknown fallback.
- `''` → unknown fallback.
- `'GARBAGE'` → unknown fallback.
- Two consecutive calls with the same input return value-equal shapes (stability).
- Returned `vars.bg` for PROJECT is exactly `'var(--project-bg)'` (lock the wrapper).

### Component-level visual-regression locks — `tests/ui/bucketMeta.regression.test.js`
For each component, render with `{bucket:'PROJECT'}`, `{bucket:'COMMUNICATION'}`, `{bucket:'CI'}`, `{bucket:null}` and assert the rendered HTML string contains the exact token:
- ScheduledActivityBlock: `'sa-bucket-chip chip-project'`, `'sa-bucket-chip chip-communication'`, `'sa-bucket-chip chip-ci'`, `'sa-bucket-chip chip-unknown'`.
- WeekGrid block: `'wg-block ... chip-project'` (substring match on the class attribute).
- UpNextRail dot: `'up-next-dot chip-project'`.
- Week page chip: `'wk-chip chip-project'`.

### CSS structural test
- `app.css` text-grep asserts `@media (forced-colors: active)` appears exactly once.
- `app.css` text-grep asserts `--accent-primary:` appears at least once and `--color-primary:` appears zero times.
- `app.css` text-grep asserts `.bucket-row.bucket-project` selector still appears (BucketStrip canonical preserved).

### Estimated test delta
~17 new tests. Suite must stay <3.5s — all tests are pure string asserts, no DOM, no I/O.

## 8. Implementation Sequence

1. (0.5h) Create `js/ui/bucketMeta.js` per §6. Add unit tests. Run; green.
2. (0.5h) Add component-level regression tests against the CURRENT (pre-refactor) class strings. Run; green. This is the lock.
3. (0.5h) `app.css`: rename `--color-primary` → `--accent-primary` and `--color-primary-contrast` → `--accent-primary-contrast` everywhere. Run full suite; green.
4. (0.5h) `app.css`: add `.chip-unknown` selector rules at the three chip-prefix sites (paralleling existing `.chip-project` blocks). Run; green.
5. (1.0h) Migrate `ScheduledActivityBlock.js` and `WeekGrid.js` to `bucketMeta()`. Regression tests must still pass.
6. (1.0h) Migrate `Week.js` (inline ternary) and `UpNextRail.js` (including the §2.5 class rename in both JS and CSS). Update UpNextRail regression test from `up-next-dot-project` to `up-next-dot chip-project`. Run; green.
7. (1.0h) Append `@media (forced-colors: active)` block per §5. Add CSS structural test. Run; green.
8. (0.5h) Final grep audit per AC1, AC4, AC7. Suite green. Commit.

Total: 5.5h. Buffer to 8h cap absorbs unexpected `--color-primary` touch points or CSS specificity surprises. If overrun threatens, drop step 7 (forced-colors block) — defer to Iteration 14.

## 9. Out of Scope (Explicit)

- Any change to bucket hex values (`#fef3c7`, etc.) — re-open trigger: design refresh epic, Iteration 16+.
- Any change to `.bucket-row.*` BucketStrip rendering at `app.css:296-342` — re-open trigger: never (this is canonical).
- Day-of-week / week-of-year color schemes — re-open trigger: separate UX theme epic, Iteration 14+.
- Cross-page theme application (T2–T10) — re-open trigger: Iteration 14, gated on T1 ship.
- `--color-text-muted`, `--color-border`, `--color-surface-muted`, `--color-text`, `--color-surface-hover`, `--color-border-strong`, `--color-focus-ring` consolidation — re-open trigger: Iteration 14+ neutral-token sweep.
- Removing the legacy `BUCKET_CHIP_CLASS` / `BUCKET_DOT_CLASS` exports — re-open trigger: Iteration 15+ once all callers verified migrated.

## 10. Acceptance Criteria

- AC1. Given the codebase post-implementation, when grep is run for `BUCKET_CHIP_CLASS = {`, then exactly 1 match remains, in `js/ui/bucketMeta.js`.
- AC2. Given a render of any bucket-aware component (ScheduledActivityBlock, WeekGrid, UpNextRail, Week page chip), when the bucket is PROJECT, then the rendered HTML carries `chip-project` in the relevant element's class attribute.
- AC3. Given the unknown-bucket case, when `bucketMeta(null)` is called, then it returns `{bucket:'UNKNOWN', chipClass:'chip-unknown', dotClass:'chip-unknown', label:'Unscheduled', vars:{bg:'var(--color-surface-muted)', fg:'var(--color-text-muted)', fill:'var(--color-border-strong)'}}`.
- AC4. Given `app.css`, when grepped for `@media (forced-colors: active)`, then exactly 1 match exists.
- AC5. Given the suite is run, when the test count is compared to the Iteration 12 baseline (2,635), then the count is >= 2,652 (2,635 + 17) and 0 fail.
- AC6. Given the existing BucketStrip rendering at `app.css:296-342`, when this spec is implemented, then those lines are byte-for-byte unchanged (assert via line-range diff in PR review).
- AC7. Given the `--color-primary` vs `--primary` conflict, when the spec is implemented, then `--color-primary` is the deprecated name and zero JS or CSS files reference it (grep `--color-primary` returns 0 matches); `--accent-primary` is the new canonical name.
- AC8. Given UpNextRail post-implementation, when grep is run for `up-next-dot-project`, then 0 matches exist; `up-next-dot.chip-project` selector exists in `app.css`.

## 11. Risk Register

- **R1 (P:M, I:M, mitigation:component regression locks added BEFORE refactor — step 2 of §8)**: Visual regression on a bucket-tinted surface goes undetected because tests focus on class strings, not paint. Tests assert exact class-token strings at every consumer; if a class drops, suite fails.
- **R2 (P:L, I:M, mitigation:full grep audit per AC7 in step 8)**: A `var(--color-primary)` reference is missed during rename, leaving an undefined CSS variable that falls back to `initial`. Grep is exhaustive across `app.css` + all `js/**/*.js` template strings.
- **R3 (P:L, I:H, mitigation:byte-for-byte assertion in PR review per AC6)**: BucketStrip at `app.css:296-342` is accidentally edited because the file is large and the diff sprawls. Explicit line-range AC plus the "Files NOT touched" enumeration in §3.
- **R4 (P:M, I:L, mitigation:descope step 7 if hours overrun)**: Forced-colors block has unforeseen specificity conflicts with existing chip styles. Specificity is identical to the base `.sa-bucket-chip.chip-project` rule (one class + one class), so cascade order in the appended `@media` block wins. If issues, defer per §8.
- **R5 (P:L, I:L, mitigation:legacy const exports preserved per §6)**: A non-listed file imports `BUCKET_CHIP_CLASS` from one of the 4 enumerated sites and breaks. Re-exports from `bucketMeta.js` provide a back-compat path; even better, the migration removes those imports entirely. Pre-refactor grep for `BUCKET_CHIP_CLASS` confirms only the 4 known sites.

## 12. Recommendation

PROCEED. Scope is tight (3 new files, 5 modified), risk is contained by pre-refactor regression locks, total estimate (5.5h) sits well under the 8h cap, and T1 unblocks T2–T10 cross-page work in Iteration 14. The forced-colors block is the only optional descope lever — drop it if hours slip, and the core token consolidation still ships.
