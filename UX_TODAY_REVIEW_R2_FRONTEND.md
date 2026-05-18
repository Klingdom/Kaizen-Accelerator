# UX_TODAY_REVIEW_R2_FRONTEND.md
## Implementation-Feasibility Map — Today Page Incremental Improvements
**Frontend Engineer review, post-Iter 42 production state**
**Paired with UX agent review (written in parallel)**

---

## 1. Implementation Surface Map

Every visible pixel on the Today page traces to one of these files:

### 1.1 Header (`<header class="today-header">`)
- **Today.js:166–169** — assembles the header element; ring + day badge order.
- **Today.js:146–148** — `.today-day-badge` span, only renders when `daysSinceSignup !== null`.
- **Today.js:159–164** — `CadencePressureRing` invocation; ring absent in empty/infeasible states.
- **CadencePressureRing.js** — SVG donut, tooltip, arc math; standalone 243-LOC component.
- **app.css:143–148** — `.today-header` flex layout (`justify-content: space-between`).
- **app.css:150–160** — `.today-day-badge` pill styling.
- **app.css:3716–3902** — all `.cadence-*` rules (ring, arcs, tooltip, dark/motion overrides).
- **app.css:1974–1978** — mobile breakpoint collapses `.today-header` to `flex-direction: column`.

### 1.2 Hour Rail (left column of grid)
- **TodayGrid.js:230–241** — `renderTodayHourRail()` emits `.cycle-hour-rail` + `.cycle-hour` spans.
- **TodayGrid.js:232–236** — current-hour detection adds `.cycle-hour-current` class.
- **app.css:303–335** — `.cycle-hour-rail` (Geist Mono, 11px, `--surface-2` bg, repeating-gradient hairlines); `.cycle-hour` padding; `.cycle-hour-current` (red, weight 600).
- **weekGridMath.js** — `hourRailLabels()` computes the label strings (shared with WeekGrid; do not modify).

### 1.3 Activity Blocks
- **TodayGrid.js:114–218** — `renderTodayBlock()` — per-block HTML including gradient class, resize handle, aria, drag attrs.
- **TodayGrid.js:201** — block root: `cycle-block-positioned` + `chip-{bucket}` + optional modifiers.
- **bucketMeta.js** — maps bucket → `chipClass` (`chip-project`, `chip-communication`, `chip-ci`, `chip-unknown`).
- **app.css:350–566** — all block rules: base layout, hover-lift, PROPOSED dashed overlay, lunch muting, 3-stop gradients (Iter 40), user-edited restoration, resize handle, drag/ghost states.
- **app.css:480–518** — the 3-stop gradient fills for each bucket (`.chip-project`, `.chip-communication`, `.chip-ci`).
- **app.css:523–526** — desaturated fallback for `data-user-edited="false"` (note: uses non-existent `--color-surface-muted`; may need cleanup).
- **app.css:654–700** — resize handle + drag states.

### 1.4 Hour-Line Dividers
- **TodayGrid.js:252–259** — `renderHourLines()` — absolute-positioned 1px lines.
- **app.css:3350–3357** — `.cycle-hour-line` (1px, `--ink-200`, opacity 0.5).

### 1.5 Now-Line
- **TodayGrid.js:341–343** — conditionally renders `.cycle-now-line` with inline `top` offset.
- **TodayGrid.js:332–339** — derives `HH:MM` label string for `.cycle-now-label`.
- **app.css:575–645** — `.cycle-now-line` (2px glow, red), `::before` breathing dot, `::after` trail, `.cycle-now-label` pill, motion overrides.

### 1.6 Bucket Strip (right margin)
- **Today.js:331–382** — `renderBucketStrip()` private helper; computes per-bucket totals + emits `.cycle-bucket-strip` aside.
- **Today.js:264–266** — strip only rendered when `!isEditing`.
- **Today.js:269–288** — `today-body-with-strip` flex wrapper when strip is present.
- **app.css:3362–3440** — `.cycle-bucket-strip`, rows, labels, track + fill bars, gradient fills.
- **app.css:3459–3484** — mobile breakpoints (strip collapses to 3-column grid at 860px).

### 1.7 Dialogs
- **BlockDetailDialog.js** — `.bdd-modal` / `.bdd-panel`; 11 focus-trapped modals total.
- **CatalogPickerDialog.js** — catalog picker on empty-slot click.
- **Today.js:234–249** — both rendered at page level, below the body wrapper.
- **app.css:3078–3252** — all `.bdd-*` rules.

### 1.8 Drag/Conflict Banners
- **Today.js:405–427** — `renderDragConfirmBanner()` → `.today-drag-confirm-banner`.
- **Today.js:451–481** — `renderConflictBanner()` → `.today-conflict-banner`.
- **app.css:709–800** — banner rules.

---

## 2. Constraints

### 2.1 §6.5 Boundary (hard wall)
Protected paths — zero modifications permitted without architect escalation:
- `js/composer/`
- `js/engine/`
- `js/domain/types.js`
- `js/events/events.js`

None of the Today-page improvements below cross this boundary. The Cadence Pressure Ring (Iter 42) is the reference example: pure UI component, 0 §6.5 hits.

### 2.2 Test-Count Fragility (3,388 tests / 0 failing)
Key test files governing the Today page:
- **Today.ccc.test.js** — CCC upper bound `≤ 5` (4 regions checked by regex pattern); lower bound `≥ 4`. Adding a 5th structural region matching any of the 4 REGIONS patterns breaks the lower bound; a wholly new region class pushes over the upper bound if REGIONS is not updated simultaneously.
- **Today.test.js** — 20+ assertions on class presence/absence (e.g., `cycle-card`, `cycle-proposed`, `adherence-dial` must be absent, etc.).
- **TodayGrid.test.js** — validates block rendering, now-line, hour rail, resize handle, ghost block.
- **CadencePressureRing.test.js** — 41 tests; arc math, tooltip text, edge cases.
- **dialogFocusTraps.test.js** — 11 focus-trapped modals; structural class changes would invalidate trap registration.

### 2.3 CSS Architecture Constraints
The theme system (Iter 39) uses `[data-theme="dark"]` and `[data-motion="reduced"]` overrides keyed to class names. Any class that appears in those override blocks is load-bearing — rename it and the dark-mode override silently stops applying. The primary locked-class zone is `app.css:3700–3902`.

Bucket-color tokens (`--project-fill`, `--communication-fill`, `--ci-fill`) are referenced by `cadence-arc-*`, `cycle-block-positioned.chip-*`, `cycle-bucket-fill-*`, and forced-colors overrides. These tokens are the single source of truth for Phil's color identity; changing token values would propagate to all three surfaces simultaneously.

---

## 3. What's CHEAP to Change (XS — CSS only, 0 test damage)

These are value changes inside existing rules — no selector adds, no HTML changes.

| Target | What to edit | File:line |
|---|---|---|
| Block gradient depth | Adjust stop percentages or angle (160deg → 150deg) in `.chip-project`, `.chip-communication`, `.chip-ci` | app.css:480–518 |
| Block shadow intensity | `rgba` alpha values in `box-shadow` on `.cycle-block-positioned` | app.css:362 |
| Now-line glow radius | `8px 2px` / `20px 4px` in `.cycle-now-line box-shadow` | app.css:582–585 |
| Now-line dot size | `width/height: 10px` on `.cycle-now-line::before` | app.css:595–596 |
| Hour-rail font size | `font-size: 11px` on `.cycle-hour-rail` | app.css:309 |
| Hour-line opacity | `opacity: 0.5` on `.cycle-hour-line` | app.css:3355 |
| Cadence ring breath speed | `3s` in `cadenceBreath` / `.cadence-ring-svg animation` | app.css:3858–3867 |
| Cadence ring stroke width | `stroke-width: 4` on `.cadence-arc-project/comm/ci` | app.css:3749–3761 |
| Block border-radius | `border-radius: 5px` on `.cycle-block-positioned` | app.css:354 |
| Day badge pill radius | `border-radius: 999px` on `.today-day-badge` | app.css:155 |
| Bucket strip bar height | `height: 3px` on `.cycle-bucket-track` | app.css:3413 |
| Hover-lift amount | `translateY(-2px)` on `.cycle-block-positioned:hover` | app.css:377 |
| Block animation duration | `280ms` in `blockReveal` reference on `.cycle-block-positioned` | app.css:369 |
| Stagger cap | `Math.min(blockIndex, 6)` cap in `renderTodayBlock` | TodayGrid.js:180 |

These changes touch only computed values. No selector is renamed, no HTML structure is added, no tests break.

---

## 4. What's MEDIUM (S/M — new CSS classes or new components, low test damage)

These add new surface without modifying existing selectors. Test damage is confined to any new test file written for the new component/class.

### 4.1 GCal-style Left-Border Block Accent (S)
Add a 3px left border accent inside `.cycle-block-positioned.chip-project` etc. using `border-left`. This is **additive** — the 3-stop gradient background stays, the accent layers on top.
- **Effort:** XS–S. Single CSS addition per bucket class.
- **Test damage:** 0 (no selector rename; existing gradient tests still pass; snapshot tests match on `chip-project` not `border-left`).
- **§6.5 hit:** No.
- **Caveat:** Gradient + left-border is a different visual grammar than GCal (GCal uses solid flat color + left accent, not gradient). Mixing them may feel incoherent; UX should evaluate.

### 4.2 "Jump to Now" Button (M)
A small fixed/sticky button in the timeline column that scrolls the grid to the now-line. New component (e.g., `NowJumpButton.js`), new CSS classes, wired to a new `SCROLL_TO_NOW` action in `app.js`.
- **Effort:** M. New component file, new action handler, new CSS, new test file. No modification to existing classes.
- **Test damage:** 0 to existing tests. New test file adds +8–15 tests.
- **§6.5 hit:** No.
- **Note:** Only useful if the grid is tall enough to scroll (currently `gridEndHour - gridStartHour = 12 hrs × 60px = 720px`). At default viewport heights this is already scrollable. The now-line already shows current time; the jump button is navigational convenience.

### 4.3 Header Layout Adjustment (S)
Reorder ring + day badge within `.today-header` (Today.js:166–169) — e.g., day badge left, ring right; or add a date display between them.
- **Effort:** S. HTML reorder only.
- **Test damage:** Near-zero. `Today.ccc.test.js` checks for class presence by regex, not order. `Today.test.js` checks `today-header` presence and `cadence-ring` presence but not relative position.
- **§6.5 hit:** No.

### 4.4 Date Display in Header (S)
Add `<time class="today-date-display">Thursday, May 17</time>` inside `.today-header` from the composition date. Requires Today.js:166–169 edit + new CSS class + derivation logic from `activeState.composition.date`.
- **Effort:** S. 10–15 lines of JS, 8–10 lines of CSS.
- **Test damage:** Low. No existing assertions break; the CCC ccc.test.js REGIONS list does not include `today-date-display`, so it doesn't affect CCC count. Would need a new assertion in Today.test.js.
- **§6.5 hit:** No.
- **GCal alignment:** GCal shows full date prominently. Currently the Today page shows only a day-count badge with no calendar date.

### 4.5 Half-Hour Grid Lines (S)
Add a second `renderHalfHourLines()` function in TodayGrid.js alongside `renderHourLines()` — lighter opacity (0.25 vs 0.5), half-height positions.
- **Effort:** S. Mirror of `renderHourLines()` with adjusted loop step.
- **Test damage:** 0 to existing tests. `cycle-hour-line` tests unaffected; new class name avoids collision.
- **§6.5 hit:** No.
- **GCal alignment:** GCal renders faint 30-min marks. Currently we only have hour lines (TodayGrid.js:252–259).

---

## 5. What's EXPENSIVE (Significant test damage or structural risk)

### 5.1 Renaming Any Class in the Locked Set
Renaming `cycle-block-positioned`, `cycle-hour-rail`, `cycle-calendar-grid`, `cadence-ring`, `bdd-modal`, or any class in the CCC REGIONS registry would:
- Break the CCC pattern-match tests (`Today.ccc.test.js:97–102`).
- Break `Today.test.js` literal-match assertions.
- Break `TodayGrid.test.js` selector assertions.
- Break `CadencePressureRing.test.js` class assertions.
- Break `dialogFocusTraps.test.js` focus-trap registration (reads class from DOM).
- **Estimated damage:** 30–80 test failures per rename.

### 5.2 Removing an Existing Element Already Tested for Presence
Any element asserted-present in `Today.test.js` or `Today.ccc.test.js`:
- `cycle-card`, `cycle-proposed`, `cycle-calendar-grid`, `cadence-ring`, `today-header`
- Removing any of these silently drops a CCC region, triggering the `ccc >= 4` lower-bound test.

### 5.3 Changing CycleCard Prop Contract
`CycleCard` receives 11 props (Today.js:272–285). Adding a required prop without a default would break all tests that render `Today` without the new prop. Removing an existing prop would break tests that construct CycleCard directly.
- **Estimated damage:** ~50+ tests across CycleCard.test.js, CycleCard.editMode.test.js, CycleCard.sortNormalization.test.js, Today.sprint*.test.js.

### 5.4 Adding a 5th Structural Region to CCC REGIONS
The CCC upper bound is `≤ 5` but the registry only has 4 entries; adding a 5th element that matches one of the REGIONS patterns (or expanding REGIONS) pushes against the ceiling. This was the exact risk flagged and resolved in Iter 42 (ccc.test.js:27–28). The one slot of headroom is documented as reserved for Phase 4.
- **Cost to do correctly:** Update REGIONS array + update bound assertion + write rationale comment. That's ~30 test lines plus careful audit of what "Phase 4" slot was reserved for.

### 5.5 Mini-Calendar Sidebar (GCal pattern)
A date-picker sidebar showing the month grid for date navigation. This is a new structural region that would push CCC over bound, require new state in app.js, new event types, and a new component of ~150+ LOC.
- **Effort:** L. §6.5: potential hit if navigation requires composition date lookup via engine.
- **Test damage:** Medium — new CCC region, new Today.js prop, new Today.test.js assertions.

---

## 6. Google Calendar Specific Implementations

Mapping GCal patterns to current codebase state:

| GCal Pattern | Current State | Implementation Path | Cost |
|---|---|---|---|
| Sans-serif hour-rail labels | Using Geist Mono (`--font-mono`) | Change `font-family: var(--font-mono)` to `var(--font-body)` on `.cycle-hour-rail` (app.css:308) | XS — but diverges from Iter 40 Geist Mono decision |
| Hairline grid lines per hour | Already done: `cycle-hour-line` at every hour (TodayGrid.js:252–259, app.css:3350) | No action needed | — |
| Left-border block accent | Full gradient fill (no accent) | Add `border-left: 3px solid [lighter shade]` to `.chip-*` block rules | XS (CSS only) |
| Today/Now jump button | Now-line exists; no jump button | New `NowJumpButton` component + `SCROLL_TO_NOW` action | M |
| Mini-calendar sidebar | No date navigation UI | New component, new state, new CCC region | L |
| Event creation popover | CatalogPickerDialog already fires on empty-slot click (Iter 36) | Fully covered — click-empty → CatalogPickerDialog matches GCal's "click to create" | Done |
| Event block text layout (title + time, top-aligned) | `.cycle-block-time` (top) + `.cycle-block-name` (below) — already top-aligned flex column | No action needed | — |
| Current-hour highlight on rail | `.cycle-hour-current` already applied (TodayGrid.js:232–236) | No action needed | — |

**Key finding:** The most GCal-familiar patterns (hairlines, click-to-create, current-hour highlight) are already implemented. The divergences are intentional brand choices (Geist Mono hour rail, full gradient fills vs left-border accent).

---

## 7. Top 5 Specific Implementations

### Impl-1: Half-Hour Grid Lines
**Change:** Add `renderHalfHourLines()` in TodayGrid.js parallel to `renderHourLines()` (TodayGrid.js:252–259). Emit `.cycle-half-hour-line` divs at `(h - gridStartHour + 0.5) * rowHeightPx` positions. Add CSS rule: `height: 1px; opacity: 0.25; border-top: 1px dashed var(--ink-200)`.
- **Effort:** XS
- **Test damage:** 0
- **§6.5 hit:** No
- **Rationale:** GCal familiarity; improves time precision reading without any structural change.

### Impl-2: Calendar Date in Header
**Change:** Derive formatted date string from `activeState.composition.date` in Today.js:166–169. Emit `<time class="today-date-display" datetime="...">Thursday, 17 May</time>` between ring and day badge. Add CSS: `font-family: var(--font-display); font-size: 18px; color: var(--ink-700)`.
- **Effort:** S
- **Test damage:** 1 new assertion needed in Today.test.js (new element present); no existing assertions break.
- **§6.5 hit:** No
- **Rationale:** The header currently shows "Day 6" (a relative count) but no calendar date. Users rely on ambient context (browser tab, OS clock) to know the actual date. A formatted date next to the ring grounds the page.

### Impl-3: Now-Line Glow Refinement (Reduce Trail Fade Distance)
**Change:** In `.cycle-now-line::after` (app.css:604–612), shorten the fade from `65%` to `45%` so the glow trail is more concentrated. Increase `::before` dot border from `2px` to `3px` to make the dot more prominent.
- **Effort:** XS
- **Test damage:** 0
- **§6.5 hit:** No
- **Rationale:** Pure visual refinement; tighter glow trail reads more precisely as a "now" indicator vs an ambient red wash.

### Impl-4: GCal-Style Left-Border Block Accent (additive)
**Change:** Add `border-left: 3px solid rgba(255,255,255,0.55)` to each of `.cycle-block-positioned.chip-project`, `.chip-communication`, `.chip-ci` (app.css:480–518). This adds a luminous inner-left accent on the already-saturated gradient, suggesting the GCal left-stripe visual grammar without replacing the gradient.
- **Effort:** XS
- **Test damage:** 0
- **§6.5 hit:** No
- **Note:** This is a visual experiment; if the UX review deems the gradient already sufficient, skip. Verify under dark mode (`.cadence-arc` tokens already saturated; block gradient stays vivid).

### Impl-5: Jump-to-Now Button (new component)
**Change:** New `NowJumpButton.js` component (a `<button>` with `data-action="SCROLL_TO_NOW"`). Rendered in Today.js inside the `.today-grid-col` wrapper (Today.js:271–288) as a sticky bottom element. CSS: `position: sticky; bottom: 12px; align-self: flex-end`. App.js handler calls `document.querySelector('.cycle-now-line')?.scrollIntoView({behavior:'smooth'})`.
- **Effort:** M
- **Test damage:** 0 to existing tests. New test file: ~10 tests (render presence, action attr, sticky class).
- **§6.5 hit:** No
- **Note:** CCC-safe: the button lives inside `.today-grid-col`, not as a new top-level region. The CCC REGIONS registry (Today.ccc.test.js:97–102) checks for `today-header`, `cadence-ring`, `cycle-card`, `cycle-calendar-grid` — none of which match the new button class.

---

## 8. "Don't Do This" List

**Do not rename `cycle-block-positioned` or `chip-{bucket}` selectors.** These two classes are the load-bearing junction between TodayGrid.js rendering, bucketMeta.js lookup, app.css gradient rules, forced-colors overrides (app.css:2900–2908), dark-mode overrides, `data-user-edited` restoration rules, and PROPOSED state modifiers. They also appear in TodayGrid snapshot tests, WeekGrid tests (shared via `chip-` namespace), and the forced-colors block. A rename would require coordinated surgery across 6+ files and ~50 test assertions. The blast radius is disproportionate to any incremental visual improvement achievable by rename alone.

---

## 9. Appendix: Blocked or Deferred Items

- **Phase 4 (density toggle + alternate palette):** The CCC upper-bound slot is explicitly reserved for this per CHANGELOG Iter 42. Do not consume it with an intermediate addition.
- **Mini-calendar sidebar:** L-effort, new state machine, new CCC region. Defer unless Phil explicitly prioritizes GCal date-navigation parity over BAM-X-unique improvements.
- **`data-user-edited="false"` desaturation rule:** app.css:523–526 references `--color-surface-muted` and `--color-text-muted` which are not defined in `:root` (no variable definition found). This is a latent CSS bug — blocks with `userEdited=false` fall back to browser default for undefined custom properties. Low-risk to fix: define the tokens in `:root` or replace with explicit values. Zero test damage.

---
*Document written 2026-04-30. Post-Iter 42 production state (3,388 tests / 0 failing).*
