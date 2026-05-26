# TODAY_PREVIEW_PORT_FE.md
_Frontend feasibility assessment — porting `assets/today-futuristic-preview.html` to live Today page_
_Authored by: Frontend Engineer agent · 2026-05-18_

---

## 1. Method

Files read in full:

- `assets/today-futuristic-preview.html` (1647 lines) — HTML, CSS (1218 lines inline), JS (93 lines inline)
- `js/ui/pages/Today.js` (561 lines)
- `js/ui/components/TodayGrid.js` (793 lines)
- `js/ui/components/CadencePressureRing.js` (243 lines)
- `js/ui/components/BlockDetailDialog.js` (369 lines)
- `js/ui/components/NowJumpButton.js` (33 lines)
- `js/ui/dragController.js` (first 100 lines, structure confirmed)
- `app.css` — searched for all relevant class patterns: `cycle-block`, `bdd-`, `cadence-ring`,
  `today-header`, `blockReveal`, `kaizenPing`, `nowGlow`, `proposedShimmer`, `IN_PROGRESS`, `body::before`
- `UX_TODAY_REVIEW_R3_DELTA.md` — R3 recently-fixed findings
- `UX_TODAY_FUTURISTIC_DELTA.md` — original promise spec

---

## 2. Port Candidates Table

| # | Element | Preview source (line) | Live equivalent | Port effort | §6.5 hit | Test risk |
|---|---|---|---|---|---|---|
| P1 | **Ambient page depth** — `body::before` dual radial-gradient (`--project-glow` + `--ci-glow`) fixed overlay behind content | HTML:293–304 | None in live — `body::before` does not exist in live CSS | S | no | low |
| P2 | **PROPOSED block shimmer** — `proposedShimmer` keyframe brightness pulse (2.2s infinite) layered onto existing dashed outline | CSS:841–844 | `app.css:462` has dashed outline only; no shimmer animation | S | no | low |
| P3 | **IN_PROGRESS block halo** — double outline ring: `outline` at 60% white + `::before` border at 35%; no animation; "currently active" halo | CSS:864–875 | `app.css`: no `[data-state="IN_PROGRESS"]` selector exists at all; state is emitted as `data-state` attribute in `blockWrapper()` (TodayGrid.js:185) but no CSS rule consumes it | S | no | med |
| P4 | **CLOSED block opacity** — `opacity: 0.45` on `.block-closed`; SKIPPED gets `opacity: 0.50 + outline: 2px solid rgba(225,29,72,0.50)` | CSS:877–885 | `app.css`: no `[data-state="CLOSED"]` or `[data-state="SKIPPED"]` selector exists; same attribute-emission gap as P3 | S | no | med |
| P5 | **kaizenRing two-ring ping** — dual concentric `box-shadow` expand animation at 900ms (1 shot) vs live `kaizenPing` single-ring 5px ping at 800ms | CSS:1124–1129 | `app.css:3687` `kaizenPing` is a single-ring 5px pulse. Preview's `kaizenRing` fires TWO concentric expansions (step to 10px, then 18px on a second wave, then both dissolve). More dramatic and reads as "linked to something" more clearly | XS | no | low |
| P6 | **blockReveal direction** — preview uses `translateY(+10px) scale(0.98)` (blocks rise up into place) | CSS:1113–1117 | `app.css:3658` uses `translateX(-6px)` (blocks slide in from left). Both are spring-curve; direction is the only difference | XS | no | low |
| P7 | **now-line dot pulse** — `::before` dot uses `nowPulse` keyframe that scales `1 → 1.45` + opacity 1 → 0.75 on 4s sine | CSS:1119–1122 | `app.css:900` dot exists (`::before`) but no scale animation declared — only the `nowGlow` trail animation on `::after`. The dot itself does NOT breathe | S | no | low |
| P8 | **Cycle card glassmorphism** — `background: rgba(255,255,255,0.72); backdrop-filter: blur(24px) saturate(160%)` with `inset 0 1px 0 var(--border-inner)` inner highlight | CSS:574–582 | `app.css:310` cycle-card uses `background: #fff` (opaque, no blur, no inner highlight). CycleCard has no glassmorphism at all | M | no | med |
| P9 | **Cadence tooltip `--border-inner` token** — preview tooltip uses `var(--border-inner)` (rgba white 0.65) for the frosted border | CSS:539–549 | `app.css:4074` uses `rgba(255,255,255,0.65)` literal (not tokenized). Functionally identical but token discipline requires the token | XS | no | low |
| P10 | **`cadence-ring-wrap` hover behavior** — CSS-only tooltip via `:hover .cadence-tooltip` (no JS) with `transform: translateY(4px → 0)` spring | CSS:501 | `app.css:4088` already implements this — already ported | — | — | — |
| P11 | **BDD panel enter animation** — `dialogIn` keyframe: `translate(-50%, calc(-50%+14px)) scale(0.97) → translate(-50%,-50%) scale(1)` on `--ease-bounce` | CSS:1141–1144 | `app.css` BDD panel has no enter animation (appears instantly). `dialogIn` is not present | S | no | low |
| P12 | **BDD backdrop blur** — `backdrop-filter: blur(6px)` on the scrim + `backdropIn` fade-in animation | CSS:962–965 | `app.css:3399` `.bdd-backdrop` exists but no `backdrop-filter` and no `backdropIn` animation | S | no | low |
| P13 | **BDD close button round style** — `border-radius:50%; width:28px; height:28px` circle icon button | CSS:1001–1017 | `app.css:3465` `.bdd-btn-close` — not a circle; it's square-ish with `border-radius` not 50%. Missing the round affordance | XS | no | low |
| P14 | **Cycle card status badge** — `badge-proposed` (purple bg+border) and `badge-accepted` (green bg+border) pill with `letter-spacing: 0.06em` | CSS:598–615 | `app.css` cycle-status-badge styling exists but token audit needed to confirm it matches the preview spec's `--ci-bg`/`--ci-fg`/`--ci-fill` pattern precisely | XS | no | low |
| P15 | **Hour rail `repeating-linear-gradient` texture** — hairlines at 60px intervals baked into the rail background via CSS, no DOM elements | CSS:713–720 | `app.css` and `TodayGrid.js:628` use explicit DOM `<div class="cycle-hour-line">` elements for hour lines; the preview uses a CSS background-image approach. Both produce the same visual result | M | no | low |
| P16 | **`ease-spring` / `ease-bounce` / `ease-std` CSS custom property tokens** — three named easing curves centrally defined | CSS:32–35 | Live code uses `cubic-bezier(0.16,1,0.3,1)` literals throughout `app.css`. No central easing tokens exist | S | no | low |
| P17 | **`prefers-reduced-motion` completeness** — preview's `[data-motion="reduced"]` block covers `.cycle-block`, `.bucket-fill`, `.bdd-panel`, `.bdd-backdrop`, `.cycle-now-line::before` and also `:hover` transform suppression | CSS:1149–1174 | `app.css`: `@media (prefers-reduced-motion: reduce)` at line 945 covers now-line and its `::after`; `app.css:1175` covers `pulse-red`. **Missing**: no `:hover { transform: none !important }` override for `cycle-block-positioned:hover` lift, and the `blockReveal` animation has no explicit reduced-motion override beyond the general rule | S | no | low |
| P18 | **`--shadow-sm / --shadow-md / --shadow-lg` token system** — three shadow layers with consistent dark-mode variants | CSS:85–88, 143–146 | Live code uses shadow literals (`0 1px 3px rgba(0,0,0,0.20)` etc.) at individual rule sites. No central shadow token system | M | no | low |
| P19 | **Swatch palette toggle** — conic-gradient swatch circles that visually encode palette identity; `aria-checked` radio pattern | HTML:1236–1248 | No palette toggle in live UI. The settings infrastructure (per DELTA §6.5) was planned for Phase 4 | L | yes (types.js) | high |
| P20 | **PROPOSED bucket-color pale tint gradients** — proposed PROJECT block renders `#bbf7d0 → #dcfce7 → #f0fdf4` (3-stop) not just `#bbf7d0 → #dcfce7` (2-stop) | CSS:845–862 | `app.css:469`: proposed block CSS uses 2-stop `linear-gradient(135deg, #bbf7d0 0%, #dcfce7 100%)`. Preview uses 3-stop `linear-gradient(160deg, #bbf7d0, #dcfce7, #f0fdf4)` — adds a lighter final stop matching the bucket-bg token | XS | no | low |

---

## 3. Latent-Bug Fixes the Preview Exhibits

### BUG-1 — `data-state` attributes emitted but never styled (preview-fixes-bug)

**Severity: Medium.** `blockWrapper()` at `TodayGrid.js:184` emits `data-state="${activityState}"` for all blocks. The preview has dedicated `.block-in-progress` (double halo outline), `.block-closed` (opacity 0.45), and `.block-skipped` (red outline + opacity 0.50) rules. Live `app.css` has **zero** selectors that match `[data-state="IN_PROGRESS"]`, `[data-state="CLOSED"]`, or `[data-state="SKIPPED"]`.

Consequence: A closed block and an in-progress block are visually identical to a scheduled block. There is no visual feedback that an activity is currently running. This is a product UX gap, not just a style deficit.

The data is in the DOM. The fix is CSS-only (items P3 + P4 in table above). No HTML or JS changes needed.

**File:line cite:** `TodayGrid.js:184`, `app.css` — no matching rule exists.

### BUG-2 — `::before` now-line dot has no animation (preview-fixes-bug)

**Severity: Low.** `app.css:900` defines `cycle-now-line::before` (the red dot) with no animation rule. The preview's `nowPulse` keyframe gives this dot a 4s scale + opacity breath (`1 → 1.45 → 1`). The live dot is static. Given that the now-line `::after` glow trail DOES animate (`nowGlow`), the static dot reads as inconsistent — the trail breathes but the dot anchor does not.

**File:line cite:** `app.css:900–912` (dot defined), `app.css:3663` (`nowGlow` on `::after`), no `nowPulse` keyframe exists in `app.css`.

### BUG-3 — `blockReveal` direction inconsistent with spatial metaphor (preview-fixes-bug — minor)

**Severity: Low.** Live `blockReveal` slides blocks in from the left (`translateX(-6px) → 0`). The preview uses `translateY(+10px) scale(0.98) → 0 scale(1)` — blocks rise up into their time slots. The vertical reveal is semantically correct: blocks exist on a vertical timeline, so they should rise into place, not arrive horizontally. The left-slide is a leftover from an earlier list-view era. `TodayGrid.js` renders blocks at absolute `top` positions — the rise direction is the natural affordance.

**File:line cite:** `app.css:3657–3660`.

### BUG-4 — `prefers-reduced-motion` gap on hover transform (preview-fixes-bug)

**Severity: Low — accessibility.** `app.css:452` declares `.cycle-block-positioned:hover { transform: translateY(-2px); }`. There is no `@media (prefers-reduced-motion: reduce)` override that suppresses this. The preview explicitly adds `[data-motion="reduced"] .cycle-block:hover { transform: none !important }` and a matching `@media (prefers-reduced-motion: reduce)` block. An WCAG 2.3.3-sensitive user gets a hover-lift on every block.

**File:line cite:** `app.css:451–455`. Adjacent `nowGlow` and `blockReveal` both have motion overrides; hover transform does not.

---

## 4. Cross-Cutting Concerns

### 4.1 Easing token system (P16)

If more than 2–3 animations are ported, introducing `--ease-spring`, `--ease-bounce`, `--ease-std` CSS custom properties at `:root` pays dividends immediately. Currently 12+ `cubic-bezier(...)` literals are scattered across `app.css`. Central tokens make the motion language consistent and auditable. Add at `:root` in `app.css` top of file — the preview already defines the values (lines 32–35).

### 4.2 Shadow token system (P18)

`--shadow-sm / --shadow-md / --shadow-lg` would support both glassmorphism (P8) and the BDD dialog animation (P11, P12). Not urgent for individual ports but required if P8 is ported — the cycle card needs `--shadow-md` in its glass treatment. Without tokens, dark-mode variants must be duplicated manually.

### 4.3 Glassmorphism on CycleCard (P8) interaction with dark mode

The live `cycle-card` uses `background: #fff` (opaque). Switching to `rgba(255,255,255,0.72) + backdrop-filter` requires:
- A dark-mode override: `[data-theme="dark"] .cycle-card { background: var(--surface-glass-dk, rgba(20,20,23,0.80)) }` (same pattern as `cadence-tooltip`).
- Performance: `backdrop-filter` triggers a compositing layer. On low-end devices this can cause paint jank on scroll. CycleCard is the primary scrollable content — accept the cost consciously.
- The `border-inner` token (`rgba(255,255,255,0.65)` in light, `rgba(255,255,255,0.09)` in dark) already exists as a literal in the cadence tooltip — centralizing it before porting P8 is recommended.

### 4.4 `data-state` CSS attribute selector discipline (BUG-1 / P3 / P4)

Any CSS rule added for `[data-state="IN_PROGRESS"]` must be scoped to `.cycle-block-positioned[data-state="IN_PROGRESS"]` to avoid collision with `.wk-day[data-state="ACCEPTED"]` (app.css:1995). The `data-state` attribute is used in two different component trees with different value sets — scoping by parent class is mandatory.

### 4.5 Animation reduced-motion completeness (P17, BUG-4)

Best practice: add the hover-transform override and `blockReveal` override to the **existing** `@media (prefers-reduced-motion: reduce)` block at `app.css:945` rather than creating a new block. Keeps the motion override surface consolidated.

---

## 5. Recommended Phasing

### Phase A — Correctness fixes (bugs, no-risk CSS) — ~1.5 hr

These fix visible defects or WCAG gaps. No structural changes. Each is a CSS-only addition.

| Item | Effort | Risk |
|---|---|---|
| BUG-1: Add `[data-state]` selectors for IN_PROGRESS / CLOSED / SKIPPED (P3, P4) | S | med |
| BUG-2: Add `nowPulse` keyframe + apply to `cycle-now-line::before` (P7) | S | low |
| BUG-4: Add hover-transform override to reduced-motion block (P17 partial) | XS | low |
| P20: 3-stop PROPOSED block gradients (trivial fill upgrade) | XS | low |
| P5: `kaizenRing` two-ring ping replaces single-ring `kaizenPing` | XS | low |

Rationale: BUG-1 is the highest-value item in this entire assessment. IN_PROGRESS state is emitted but invisible. It is a product correctness gap disguised as a style gap.

### Phase B — Motion and entrance polish — ~1 hr

Pure aesthetic upgrades. No HTML or JS changes.

| Item | Effort |
|---|---|
| P2: `proposedShimmer` brightness pulse on PROPOSED blocks | S |
| P6: `blockReveal` direction change (Y-axis rise vs X-axis slide) | XS |
| P11: `dialogIn` enter animation on `.bdd-panel` | S |
| P12: `backdropIn` animation + `backdrop-filter: blur(6px)` on `.bdd-backdrop` | S |
| P16: Easing token system at `:root` + refactor literals | S |
| P13: Round close button on BDD (XS CSS change) | XS |

Rationale: Phase B items collectively move the motion language from "functional" to "premium" without touching a single JS file or risking test failures.

### Phase C — Surface depth + structural additions — ~2–3 hr

These require new CSS tokens or glass treatment. Take them last because they have cross-cutting dependencies.

| Item | Effort | Dependencies |
|---|---|---|
| P1: Ambient page depth `body::before` radial gradients | S | Needs `--project-glow` / `--ci-glow` tokens confirmed in live CSS |
| P8: Cycle card glassmorphism | M | Needs `--surface-glass` + `--shadow-md` tokens + dark-mode override |
| P18: Shadow token system | M | Prerequisite for P8 |
| P9: Tokenize cadence tooltip border | XS | Part of P18 cleanup |
| P19: Palette toggle swatch UI | L | §6.5 hit: needs `UserPreferences` typedef in `types.js` |

Rationale: P19 (palette toggle) is the only §6.5 item in this entire list. It is correctly left last and gated on product decision (per DELTA SW-Q-FUT-5).

---

## 6. Engineering Risks

### R1 — Token discipline (R3 P1 lesson)

R3 Phase 1 identified dark-mode regressions from `--color-surface`, `--color-text` tokens that were not declared in the dark-mode block. The ambient gradient (P1) uses `--project-glow` and `--ci-glow`. These tokens are defined in `app.css` for light mode via the Iter 39 token layer. Before adding `body::before`, verify both exist in the dark-mode block and `[data-theme="system"]`. Pattern: grep for `--project-glow` in the dark-mode block before shipping P1.

### R2 — Modal mutual-exclusion (R3 P2 lesson)

BDD animations (P11, P12) will make the dialog more prominent. If the double-overlay bug class identified in R3 §3.3 is not fixed first, the animated dialog entering behind an already-open `role="alert"` DRAG_CONFIRM banner will look like a crash, not a feature. Phase A must include the R3 §3.3 mutual-exclusion fix (not enumerated here — it is a Today.js state fix, already analyzed by R3).

### R3 — `backdrop-filter` performance on CycleCard (P8)

CycleCard is the primary scrollable element. Adding `backdrop-filter: blur(24px)` to it means the browser must repaint a blurred compositing layer on every scroll tick. On the machines BAM-X targets (CI practitioners, likely modern MacBooks — OK) this is fine. On budget Android, this is a regression. If P8 is ported, add a `@media (prefers-reduced-motion: reduce)` override that sets the CycleCard to `background: var(--surface-1)` (opaque fallback) and removes `backdrop-filter`. This doubles as an accessibility accommodation.

### R4 — `[data-state]` selector scope collision (P3, P4, BUG-1)

`data-state` is also used by `wk-day` elements in the WeekGrid. Any selector targeting `[data-state="..."]` must be scoped: `.cycle-block-positioned[data-state="..."]`. Failure to scope will style WeekGrid day headers with block states on pages that render both. Medium test risk because no existing test verifies `[data-state]` selectors on TodayGrid blocks specifically.

### R5 — `kaizenRing` vs `kaizenPing` naming (P5)

The live keyframe is named `kaizenPing` (app.css:3687). The preview uses `kaizenRing`. Both target `.cycle-block-kaizen-linked`. If the keyframe is replaced (rather than renamed and both retained), any test that asserts `animation-name: kaizenPing` on a kaizen-linked block will break. Check `js/ui/pages/__tests__/` for animation-name assertions before renaming.

### R6 — §A.2 orthogonal-case discipline on IN_PROGRESS CSS

When writing `[data-state="IN_PROGRESS"]` styles, IN_PROGRESS + PROPOSED is a valid orthogonal case (a block can be proposed AND in-progress). The double outline (P3) and the dashed proposed outline (app.css:462) must be verified not to visually collide. Preview handles this by making `.block-in-progress` use `outline` at `outline-offset: -3px` and `::before` border, while PROPOSED uses a 2px dashed outline at `outline-offset: -2px`. Both can coexist only if offsets are different. Test for the combination explicitly.

### R7 — `blockReveal` direction change (P6) breaks existing snapshot tests

`app.css:3658` keyframe is likely asserted by CSS snapshot or visual regression tests. The `translateX(-6px)` value may be hardcoded in test expectations. Check `tests/css/` or any visual diffing setup before changing.

---

## 7. Top 5 Items I Would Prioritize (Engineering Perspective)

1. **BUG-1 — `data-state` CSS for IN_PROGRESS / CLOSED / SKIPPED (P3 + P4)**
   Pure CSS, zero JS. Highest product impact: users currently cannot see which block is running. The attribute is already in the DOM — this is a forgotten wire. Fix takes 20 minutes and closes a legitimate UX gap.

2. **BUG-4 + P17 — Reduced-motion hover-transform override**
   WCAG 2.3.3 gap. Adds one line to an existing `@media` block. No risk. Should have shipped with Iter 40.

3. **P2 — `proposedShimmer` on PROPOSED blocks**
   10-line CSS addition. The dashed outline already correctly encodes "pending." The shimmer adds the temporal "still deciding" signal that the outline alone cannot. Highest aesthetic ROI per line of code.

4. **P7 — `nowPulse` on now-line dot**
   The `::after` trail already breathes (`nowGlow`). A static dot with a breathing trail reads as two inconsistent systems. Adding the dot's own 4s scale-pulse completes the now-line as a coherent living indicator. 8 lines of CSS.

5. **P11 + P12 — BDD dialog enter animation**
   The BlockDetailDialog is the most user-facing overlay in the app. It currently appears instantly (no entrance). The preview's `dialogIn` (scale+translate on `--ease-bounce`) + `backdropIn` (fade scrim) transforms it from "jarring pop" to "considered reveal." Both are additive CSS keyframes. Medium test risk only if snapshot tests check the panel's initial transform state — verify before shipping.

Items deliberately NOT prioritized by me (but UX agent may recommend):
- **P8 (glassmorphism)**: performance risk on the primary scroll element; defer until performance budget is confirmed.
- **P19 (palette toggle)**: §6.5 hit; cross-cutting; correct decision is a product call, not an engineering one.
- **P6 (blockReveal direction)**: Low impact, potential snapshot test break — not worth the noise.

---

_End of assessment. No production code changes made._
