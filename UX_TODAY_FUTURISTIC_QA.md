# UX_TODAY_FUTURISTIC_QA.md
## Quality and Risk Assessment — Today Page Futuristic Redesign
**Validated against:** Sprint 16a codebase — 3,259 tests passing, 0 failures (confirmed via `node --test` run).
**Phases assessed:** Phase 1 (dark mode + settings), Phase 2 (visual refinements), Phase 3 (BAM-X signature pattern), Phase 4 (alternate palettes + density toggle).

---

## 1. Test Inventory of Risk

### 1.1 Snapshot / HTML String Assertions
Tests that assert exact HTML string content against the Today page output.

**Files at risk:**
- `tests/ui/pages/Today.test.js` — 25 describe blocks; class name assertions (`cycle-calendar-grid`, `cycle-hour-rail`, `cycle-block-positioned`, `cycle-bucket-strip`, `today-header`, `today-day-badge`), action strings, structural absence guards.
- `tests/ui/pages/Today.ccc.test.js` — CCC region registry hardcoded to `class="today-header"`, `class="cycle-card"`, `class="cycle-calendar-grid"`. Any wrapper div or class rename breaks 8 tests immediately.
- `tests/ui/pages/Today.sprint12.test.js` — edit-mode class assertions: `today-editing`, `edit-drawer edit-drawer-open`, `cycle-block-positioned`.
- `tests/ui/pages/Today.sprint11.test.js` — `today-onboarding-hint` class assertion.
- `tests/ui/pages/Today.sprint5.test.js` — modal class assertions: `oad-modal`, `srm-modal`, `infeasible-banner`, `bdd-modal`.
- `tests/ui/components/TodayGrid.test.js` — 15 test groups (P1-T1 through P1-T15) asserting exact inline `style="top: Npx; height: Npx"` values. Any change to grid math constants or px-per-hour breaks P1-T1, T2, T10.

**Failure trigger:** Any class rename, wrapper element insertion, or structural reorder in `Today.js` or `TodayGrid.js`.

### 1.2 CSS Class Assertions
**Files at risk:**
- `tests/ui/bucketMeta.regression.test.js` — reads `app.css` directly via
  `readFileSync` and asserts: `forced-colors` block appears exactly once,
  `--accent-primary` token is present, `--color-primary` is absent,
  `.bucket-row.bucket-project` selector exists, `.up-next-dot.chip-project` exists,
  `.up-next-dot-project` is absent.
- All 14 test files matching `chip-project|chip-communication|chip-ci` — compound
  class assertions on HTML output from `ScheduledActivityBlock`, `WeekGrid`,
  `UpNextRail`, `Week`, and `TodayGrid`. If the bucket chip class naming convention
  changes (e.g., to `chip-project-dark`), all 14 files fail.
- `tests/ui/bucketMeta.test.js` — `deepEqual` asserts exact `vars` shape:
  `var(--project-bg)`, `var(--project-fg)`, `var(--project-fill)`. If CSS custom
  property names are scoped or renamed for theming, these 12 assertions break.

**Failure trigger:** CSS token rename, class name scoping, or any addition of a
`forced-colors` block anywhere in `app.css`.

### 1.3 Color Value Assertions (Hex in Tests)
Direct search of test files confirms: no test file contains raw hex color literals
(e.g., `#22c55e`). Color assertions are indirect — tests check CSS class names that
are then styled by `app.css`. This is a structural advantage. However, `bucketMeta.js`
returns `vars` shapes referencing CSS custom property names. If those names change
during theming work, `bucketMeta.test.js` deepEqual assertions fail even though no
hex code appears in the tests.

**Hex values in app.css that become risky:** `--project-fill-top: #22c55e`,
`--project-fill-base: #16a34a`, `--comm-fill-top: #d97706`, `--comm-fill-base:
#ca8a04`, `--ci-fill-top: #a855f7`, `--ci-fill-base: #9333ea`. These are Phil's
color identity tokens. Any Phase 1 theme system that renames or wraps these will
trigger the `bucketMeta.test.js` `vars` deepEqual failures.

### 1.4 Component Render Tests (Shape-Preserved If Props Unchanged)
The following tests are LOW risk as long as component function signatures and prop
shapes do not change:
- `tests/ui/components/TodayGrid.test.js` — pure function, no DOM. Safe if
  `TodayGrid({ composition, activities, nowIso, ... })` signature is preserved.
- `tests/ui/pages/Today.test.js` — pure function `Today({ activeState, ... })`.
  Safe if prop shape is preserved.
- All modal and dialog tests — safe as long as class names (`bdd-modal`, `oad-modal`,
  `srm-modal`) are not renamed.

---

## 2. Phase-by-Phase Risk Severity

### Phase 1 — Dark Mode + Customization Framework + Settings Storage
**Severity: HIGH**

Justification:
- The theme system will need new CSS custom properties for dark-mode token values.
  `app.css` currently defines 30+ tokens in `:root` with hardcoded warm off-white
  values. Adding `@media (prefers-color-scheme: dark)` or a `[data-theme="dark"]`
  override block is safe IF the property names do not change. If property names are
  renamed or scoped, `bucketMeta.test.js` deepEqual assertions on `vars` break.
- The settings storage layer introduces a new persistence surface. No existing test
  covers settings read/write; any new settings-read path that touches
  `LocalStorageRepository` is unvalidated by the current suite.
- `prefers-reduced-motion` is absent from `app.css` today. Every animation
  (`blockReveal`, `kaizenPing`, `dotBreathe`, `nowGlow`, `cycle-ghost-pulse`,
  `dialogEnter`, `backdropFade`) must gain `prefers-reduced-motion: reduce`
  overrides simultaneously with Phase 1 introduction of new animations.
  Missing even one causes an accessibility regression.
- Dark mode must be verified against all 11 modal focus-trap components
  (`SkipReasonModal`, `CatalogPickerDialog`, `BlockDetailDialog`, `EditDrawer`,
  `OpportunityIntakeForm`, `KaizenCloseDialog`, `RemeasurementDialog`, `BaselineDialog`,
  `WeeklyReflectionWizard`, `ReflectionSheet`, `OutputArtifactDialog`). None of these
  have theme-aware tests today; dark mode renders are entirely unvalidated.

### Phase 2 — Visual Refinements Beyond Chartered Minimalism
**Severity: MEDIUM**

Justification:
- Typography updates (new font weights, sizes, tracking) do not affect string-based
  tests unless they touch CSS class names or inline style attributes. Risk is confined
  to `app.css`-level structural checks in `bucketMeta.regression.test.js`.
- Depth additions (drop-shadow layers, z-index changes) have no test surface at all
  in the current suite — no test asserts z-index, shadow values, or layering. These
  changes are invisible to the test suite but carry runtime risk: z-index changes
  on `.cycle-block-positioned` vs `.cycle-empty-overlay` (currently `z-index:0`)
  could break click routing for `CLICK_EMPTY_TIME` and `OPEN_BLOCK_DETAIL`.
- Motion vocabulary expansion (new keyframes) risks breaking `P1-T3` lunch block
  tests or `P1-T7`/`P1-T8` PROPOSED state tests if animation-delay inline style
  format changes. Currently `style="top: Npx; height: Npx; animation-delay: Nms"`.
  The TodayGrid test `P1-T3` does NOT assert animation-delay, but Today.test.js
  `AC3` asserts the regex `/style="top: \d+px; height: \d+px/` — adding new inline
  style properties before `top` would break this regex.

### Phase 3 — Innovative Signature Pattern (1 BAM-X-Unique Feature)
**Severity: HIGH** (until the feature is defined; risk scales with DOM invasiveness)

Justification:
- Any new structural element inserted into the `cycle-calendar-grid` or `today-page`
  root will be caught by the CCC region registry in `Today.ccc.test.js`. The current
  bound is `CCC >= 3` (lower) and `CCC <= 4` (upper). A new structural region that
  matches any REGIONS pattern would push CCC to 4 and risk the upper-bound test.
- If the signature pattern is an overlay, pseudo-element, or canvas injected into
  `.cycle-timeline`, it may conflict with the `cycle-empty-overlay` click-routing
  z-index stack, breaking `CLICK_EMPTY_TIME` dispatching.
- If the feature renders new HTML classes or data attributes, `Today.ccc.test.js`
  absence guards (rhythm-explainer, now-pane, up-next-rail absent) could pass while
  new untested elements accumulate.
- Drag functionality (move + resize, `DRAG_COMMIT`, `DRAG_CONFIRM`, `DRAG_CANCEL`)
  is entirely DOM-side via `installDragController`. Any new overlapping element
  inserted into `.cycle-timeline` must be verified not to intercept pointer events
  intended for `cycle-block-resize-handle` or `cycle-block-positioned`.

### Phase 4 — Alternate Palettes + Layout Density Toggle
**Severity: HIGH**

Justification:
- Alternate palettes directly threaten the `bucketMeta.test.js` deepEqual on `vars`
  shapes. If palettes replace `--project-bg` / `--project-fg` / `--project-fill`
  with palette-scoped tokens, the deepEqual fails.
- The `bucketMeta.regression.test.js` CSS structural lock asserts `--accent-primary`
  is present and `--color-primary` is absent. Any palette that introduces either a
  new primary token name or restores `--color-primary` will fail these tests.
- Layout density toggle (compact vs comfortable) may change `rowHeightPx`. All
  TodayGrid pixel-arithmetic tests (P1-T1 through P1-T10) hardcode `60px/hr`:
  `top: 180px` (P1-T1), `height: 60px` (P1-T2), `height: 24px` clamp (P1-T10),
  `height: 720px` timeline (structure test). If the density toggle changes the
  default `rowHeightPx`, 5+ tests break. These tests must be rewritten to pass
  `rowHeightPx` explicitly rather than relying on the default.
- `forced-colors` block structural test asserts exactly 1 occurrence. Any alternate
  palette that requires a second `@media (forced-colors: active)` block would fail
  this test immediately.

---

## 3. Customization Complexity Risks — Top 5

### Risk 1: Theme Switching During Edit Mode (Drag Still Works?)
**Priority: CRITICAL**

Edit mode activates `installDragController` on the DOM. `dragController.js` reads
`data-activity-start`, `data-activity-duration`, `data-grid-start-hour`, and
`data-row-height-px` from DOM attributes. If a theme switch triggers a full re-render
of `Today.js` (which is the current architecture — pure function produces HTML string
replaced via `innerHTML`), the drag controller instance is destroyed and must be
reinstalled. The risk is a timing gap: theme switch dispatches re-render, old drag
handle event listeners are removed, new render occurs, but `installDragController`
has not yet re-bound. A drag started before the re-render completes will lose its
pointerup handler, leaving the drag in a stuck state. There is no test for this
scenario. Manual validation is required.

### Risk 2: Color Contrast on Alternate Palettes (WCAG AA Required on Every Palette)
**Priority: CRITICAL**

The current light palette was explicitly designed with WCAG AA values documented in
app.css comments: `#166534 on #dcfce7 = 7.2:1`, `#713f12 on #fef9c3 = 7.9:1`,
`#581c87 on #f3e8ff = 9.1:1`, `white on #16a34a = 4.54:1 AA`, `white on #ca8a04 =
4.6:1 AA`, `white on #9333ea = 5.9:1 AA`. Every alternate palette must reproduce
equivalent or better contrast ratios. No automated contrast check exists in the test
suite. Each palette requires manual WCAG audit before merging. Dark mode is
especially risky: the `cycle-block-proposed` dashed borders use hardcoded hex values
(`border: 2px dashed #16a34a`, `#ca8a04`, `#9333ea`) that will not respond to CSS
custom property overrides unless they are converted to `var(--project-fill)` first.

### Risk 3: Settings Drift — Defaults Change Between Iterations and Break User Prefs
**Priority: HIGH**

If Phase 1 ships a settings schema (e.g., `{ theme: 'light', density: 'comfortable' }`)
and Phase 4 later adds palette choices, a stored settings object from Phase 1 will lack
the `palette` key. Any code that reads `settings.palette` without a default fallback
will yield `undefined`, causing unpredictable rendering. The persistence layer
(`LocalStorageRepository`) has tests for read/write but none for schema migration or
default-merging. A `mergeWithDefaults` strategy must be defined and tested before
Phase 1 ships settings storage.

### Risk 4: Motion-Reduced Edge Cases — Animations Skipped But Layouts Preserved
**Priority: HIGH**

`app.css` has no `prefers-reduced-motion` media query today. Seven animation
sequences are active: `blockReveal`, `kaizenPing`, `dotBreathe`, `nowGlow`,
`cycle-ghost-pulse`, `dialogEnter`, `backdropFade`. The now-line uses
`::before` and `::after` pseudo-elements with `dotBreathe` and `nowGlow` animations.
Under `prefers-reduced-motion: reduce`, these must be zeroed out. The critical
risk is layout: if `animation-fill-mode: both` or `animation: none` changes the
final paint state (e.g., if `blockReveal` holds `opacity: 0` at keyframe 0), then
blocks may become invisible when motion is reduced but the animation is not properly
reset to `opacity: 1`. This must be validated per-component before Phase 1 ships.

### Risk 5: Theme Persistence vs First-Run Experience
**Priority: MEDIUM**

The first-run branch in `Today.js` checks `isFirstRun` to select between
`TODAY_COPY.FIRST_RUN` and `TODAY_COPY.EMPTY`. If settings are persisted to
`localStorage` on first load (before first-run detection logic runs), the user may
receive a default theme without the first-run copy. Conversely, a returning user
with no stored settings (cleared localStorage) gets the first-run welcome copy even
though they are not a first-time user. There is no coordination contract between the
settings persistence layer and the `isFirstRun` signal. The `daysSinceSignup`
onboarding hint band also renders only in empty state — if the settings panel opens
over the empty state on first load, the hint may be obscured. This requires explicit
sequencing validation.

---

## 4. Calendar Functionality Regression Surface — Iter 29-38

Every item below must be re-validated after each phase ships. Current tests cover the
logic layer but not theme-conditional rendering.

### Drag Move and Resize in Dark Mode
`installDragController` reads DOM attributes. The dark mode re-render path (full
`innerHTML` replace) must reinstall the controller. Validate: start drag, switch
theme mid-composition, confirm drag lock indicator (`cycle-block-lock`) is still
rendered and protected blocks cannot be dragged in either theme.

### Click-Empty-Time Picker with Alternate Palettes
`CLICK_EMPTY_TIME` reads `data-grid-start-hour` and `data-row-height-px` from
`.cycle-empty-overlay`. The `CatalogPickerDialog` (Iter 36) must render correctly
against all palette backgrounds. Dialog backdrop (`backdropFade` animation) uses
`rgba(0,0,0,0.45)` — in dark mode this may be invisible against a dark page
background. The 11 modal focus traps all need dark-mode backdrop contrast validation.

### Conflict Banner Contrast in Dark Mode
The conflict banner (`today-conflict-banner`) uses `role="alert" aria-live="assertive"`.
The banner background and the warning icon `&#x26A0;` must maintain AA contrast against
dark backgrounds. Current banner uses `--warning-dark: #d97706` which is 3.1:1 on
white — borderline. On a dark background without a specific dark-mode override, it
fails AA.

### Now-Line Visible Against Dark Backgrounds
`--now-red: #dc2626` is the current now-line color. On a dark background, `#dc2626`
(red-600) yields approximately 3.5:1 against a `#1a1a1a` surface — below AA for UI
components. The now-line `dotBreathe` and `nowGlow` animations use `opacity` and
`box-shadow` with red values. Dark mode must define a brighter now-indicator.

### Lunch Block Muted-Gray in Dark Mode
The lunch block uses `chip-unknown` which maps to
`var(--color-surface-muted)` / `var(--color-text-muted)`. These custom properties
are not defined in the current `:root` (they appear in fallback patterns:
`var(--color-surface-muted)`). In dark mode, unresolved custom properties fall back
to initial values (transparent background, inherited text color). This is an existing
latent bug that dark mode will expose.

### Kaizen Chip Glow-Ring Ping Discoverable in Dark Mode
`kaizenPing` animation (`@keyframes kaizenPing`) must be validated against dark
backgrounds. The chip uses default text/background from `.cycle-block-kaizen` rules.
If the chip background is dark and the glow ring color is also dark, the ping effect
becomes invisible. The chip also requires `prefers-reduced-motion` suppression of
the ping animation while preserving the chip's static visible state.

---

## 5. Accessibility Risks

### Motion-Reduced Override — Per-Animation Checklist
Every animation must gain a `prefers-reduced-motion: reduce` override before
Phase 1 ships. Current animations with no override:

| Animation | Location | Risk if not overridden |
|-----------|----------|------------------------|
| `blockReveal` | `.cycle-block-positioned` | Blocks invisible at `opacity:0` start frame |
| `kaizenPing` | `.cycle-block-kaizen-linked` | Infinite ring flash is distracting |
| `dotBreathe` | `.cycle-now-line::before` | Continuous pulse, vestibular risk |
| `nowGlow` | `.cycle-now-line::after` | Continuous glow, vestibular risk |
| `cycle-ghost-pulse` | `.cycle-block-ghost` | Drag ghost flashes continuously |
| `dialogEnter` | Modal dialogs | Scale animation, vestibular risk |
| `backdropFade` | Modal backdrops | Opacity transition |
| `pulse-red` | IN_PROGRESS state | Continuous red pulse, seizure risk |

**Assessment:** `pulse-red` (used for IN_PROGRESS activity state) is the highest-risk
animation in the codebase. It pulses a red color continuously with no
`prefers-reduced-motion` override anywhere in `app.css`. This is a pre-existing
violation that Phase 1 must remediate before adding new animations.

### High-Contrast Media Query Support
`@media (forced-colors: active)` exists in `app.css` but only covers legacy bucket
chip selectors (`bucket-row`, `sa-bucket-chip`, `wk-chip`, `wg-block`). The new
`cycle-block-positioned` selectors (Iter 29+), `cycle-now-line`, `cycle-block-kaizen`,
`cycle-drag-confirm-banner`, `cycle-conflict-banner`, and `cycle-block-ghost` are
absent from the forced-colors block. Any Windows High Contrast user sees unthemed
rendering for all of these elements today. Phase 1 must add these selectors to the
forced-colors block.

### Color-Blind Palette Considerations
Current conflict state uses `#dc2626` (red) as the sole visual indicator (the warning
icon `&#x26A0;` plus the `today-conflict-banner` background). Users with
deuteranopia/protanopia (red-green deficiency, ~8% of males) cannot distinguish the
red conflict banner from a green "success" state if one is ever introduced. Phase 3
or Phase 4 must add a non-color differentiator (pattern, icon shape, border style)
for all conflict and warning states.

---

## 6. Performance Risks

### Perf Budget — Heavy Visual Effects
Glassmorphism (backdrop-filter: blur), heavy gradients, and box-shadow stacking are
the primary mobile performance risks in Phase 2-3.

**Proposed perf budgets:**

| Effect | Budget | Rationale |
|--------|--------|-----------|
| `backdrop-filter: blur()` | Max 1 active blur at a time | Compositing layer cost on mobile GPU |
| Gradient layers per block | Max 2 (top + base) | Already at limit; `--project-fill-top` / `--project-fill-base` |
| `box-shadow` layers per block | Max 3 | Current blocks use 1; hover adds 1 |
| Simultaneous CSS animations | Max 8 on visible viewport | 7 currently active; budget is tight |
| `will-change` declarations | Explicitly flag only animated properties | Avoid blanket `will-change: all` |

**Phase 3 (BAM-X signature feature) specific risk:** If the signature feature is a
canvas overlay or SVG animation layered over the calendar grid, it will force a new
compositing layer for the entire `.cycle-timeline` container (720px tall, up to 12
blocks). On a mid-range Android device this can drop frame rate below 60fps during
drag interactions. A Lighthouse mobile performance test must be run on Phase 3 output
before ship.

---

## 7. Test Count Delta Estimate by Phase

| Phase | Tests Expected to Break | New Tests Required | Net Delta |
|-------|------------------------|--------------------|-----------|
| Phase 1 — dark mode + settings | 8-15 (CCC region registry, bucketMeta vars deepEqual, forced-colors count) | 20-30 (settings persistence, dark-mode render, motion-reduced overrides per animation) | +12 to +22 |
| Phase 2 — visual refinements | 2-5 (inline style format if properties added before `top:`, forced-colors count if block added) | 8-12 (depth/z-index interaction tests, new animation motion-reduced tests) | +3 to +10 |
| Phase 3 — signature pattern | 5-12 (CCC bounds, absence guards, z-index routing) | 15-25 (feature-specific render tests, drag-interaction regression, click routing) | +10 to +20 |
| Phase 4 — palettes + density | 5-8 (pixel arithmetic tests if default rowHeightPx changes, forced-colors count) | 10-18 (palette contrast validation, density-variant grid math tests, settings merge tests) | +5 to +13 |
| **Total across all phases** | **20-40** | **53-85** | **+30 to +65** |

---

## 8. New Test Patterns Required

### Theme Switching Tests
- Assert `cycle-block-positioned` and `data-action="OPEN_BLOCK_DETAIL"` survive a theme-triggered re-render.
- Assert drag controller re-attaches after theme switch (pointerdown/pointermove/pointerup handlers still fire).

### Settings Persistence Tests
- Assert settings with a missing `palette` key falls back to the default palette (not `undefined`).
- Assert settings schema v1 is forward-compatible with v2 keys via `mergeWithDefaults`.
- Assert cleared `localStorage` produces first-run defaults, not `undefined` palette.

### Palette Validation Tests (Programmatic Contrast Check)
- Introduce a `wcag.contrastRatio(fg, bg)` utility and assert all 6 block-text-on-fill combinations
  meet 4.5:1 across every palette in both light and dark modes.
- Assert conflict banner text-on-background meets 4.5:1 in dark mode.
- Assert now-line color meets 3:1 against both light and dark surface tokens.

### Motion-Reduced Tests
- Per-animation assertion: when `prefers-reduced-motion: reduce` media is active, `animation` resolves
  to `none` or `duration: 0s` for `blockReveal`, `kaizenPing`, `dotBreathe`, `nowGlow`,
  `cycle-ghost-pulse`, `dialogEnter`, `backdropFade`, `pulse-red`.
- Assert blocks remain `opacity: 1` in the motion-reduced state (no invisible-at-frame-0 bug).

---

## 9. Manual QA Checklist — 20 Items

**Environment:** Validate in Chrome (light + dark OS preference), Safari iOS (WCAG),
Windows (forced-colors), and a mid-range Android device (performance).

1. [ ] Render Today page in light mode — all 3 bucket block colors (green, gold, purple) visible and correctly applied.
2. [ ] Render Today page in dark mode — block colors legible, not washed out, no invisible text.
3. [ ] In dark mode: now-line visible with distinct color from dark background surface.
4. [ ] In dark mode: kaizen chip glow-ring ping visible (not lost against dark block).
5. [ ] In dark mode: lunch block renders with visible text against muted background (chip-unknown does not go transparent).
6. [ ] In dark mode: conflict banner contrast — text readable against banner background.
7. [ ] In dark mode: drag-confirm banner visible — confirm/cancel buttons have sufficient contrast.
8. [ ] Switch OS theme from light to dark while Today page is open — no stuck drag state, no missing blocks.
9. [ ] Switch theme while `BlockDetailDialog` is open — focus trap still active, dialog still rendered.
10. [ ] Switch theme while edit mode (`EditDrawer`) is open — drawer still rendered, Commit/Cancel/Undo bar visible.
11. [ ] Enable `prefers-reduced-motion` — all 8 animations suppressed, blocks remain fully visible (opacity: 1).
12. [ ] Enable forced-colors (Windows High Contrast) — all calendar blocks distinguishable by border/shape, not color alone.
13. [ ] Alternate palette: run WCAG contrast audit on all 6 block text-on-fill combinations.
14. [ ] Alternate palette: run contrast audit on `infeasible-banner`, `today-onboarding-hint`, `today-drag-confirm-banner`.
15. [ ] Compact density toggle: TodayGrid with reduced `rowHeightPx` — verify 24px minimum height clamp still prevents blocks below tap target.
16. [ ] Compact density toggle: now-line position correct at new `rowHeightPx`.
17. [ ] Settings persist across page reload — theme and density survive `localStorage` round-trip.
18. [ ] First-run user (no localStorage): receives default light theme + `FIRST_RUN` copy, not `undefined` palette.
19. [ ] Returning user (localStorage cleared): receives default light theme + `EMPTY` copy (not first-run copy) — confirm `isFirstRun` logic is not settings-dependent.
20. [ ] Phase 3 signature feature: tap a calendar block — `OPEN_BLOCK_DETAIL` fires correctly; tap empty grid space — `CLICK_EMPTY_TIME` fires correctly. Confirm the signature element does not intercept pointer events.
21. [ ] IN_PROGRESS activity (`pulse-red` animation): under `prefers-reduced-motion`, pulse stops but the active state remains visually distinguishable via a non-animation cue.
22. [ ] Mobile (≤860px): compact bucket strip renders as 3-column grid and is not obscured by any Phase 3 element.
23. [ ] 11 modal focus traps (`aria-modal="true"` components): each opens and closes correctly in dark mode; focus returns to trigger on close.

---

## 10. Rollback Plan by Phase

### Phase 1 — Dark Mode + Settings
**Rollback mechanism:** `app.css` is a single file. The dark mode overrides should be
added inside a scoped `[data-theme="dark"]` attribute selector rather than
`@media (prefers-color-scheme: dark)`. This allows runtime rollback without a CSS
rebuild: set `document.documentElement.removeAttribute('data-theme')` to revert to
light mode. Settings storage rollback: add a settings schema version field. If schema
mismatch is detected on read, clear the settings key and write defaults. The
`LocalStorageRepository` already has a clear mechanism.

**Test gate:** All 3,259 existing tests must still pass. Run suite before and after.
The 8-15 tests that break from this phase must be updated (not suppressed) before
the phase is considered shipped.

### Phase 2 — Visual Refinements
**Rollback mechanism:** All visual changes are CSS-only (except motion vocabulary).
Any new `@keyframes` block can be removed without touching JS. Rollback is a Git
revert of the `app.css` changes. The inline `animation-delay` style in
`TodayGrid.js` is the only JS-side animation coupling — it does not need to change
for Phase 2 visual work.

**Test gate:** `tests/ui/bucketMeta.regression.test.js` CSS structural locks must
pass. Specifically the `forced-colors` count test and the `--accent-primary` token
test.

### Phase 3 — Innovative Signature Pattern
**Rollback mechanism:** Wrap the signature feature's render call in a feature flag
prop on `Today.js` (e.g., `signatureFeature?: boolean`). Default to `false`.
Rollback is setting the prop to `false` in `app.js` without a re-deploy. If the
feature is CSS-only (pseudo-element or canvas), it can be gated behind a
`[data-feature-signature="true"]` attribute on the grid root. Remove the attribute
to roll back.

**Test gate:** CCC bounds in `Today.ccc.test.js` must not be violated. The
`cycle-calendar-grid` click routing (`CLICK_EMPTY_TIME` + `OPEN_BLOCK_DETAIL`) must
be validated by the `dragController.test.js` suite before ship.

### Phase 4 — Alternate Palettes + Density Toggle
**Rollback mechanism:** Palette is a settings value. Rolling back means writing
`{ palette: 'default' }` to settings storage — no code change required. The density
toggle's `rowHeightPx` must NOT be stored as a bare number in global state; it must
be derived at render time from the settings value so that resetting settings resets
the density. Rollback is a settings clear.

**Test gate:** Rewrite the 5 TodayGrid pixel-arithmetic tests (P1-T1 through P1-T10
that use default `rowHeightPx: 60`) to pass `rowHeightPx: 60` explicitly as a prop
before Phase 4 ships, so default changes do not break them.
