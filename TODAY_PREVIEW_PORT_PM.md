# TODAY_PREVIEW_PORT_PM.md
_Product Manager synthesis · 2026-05-18_
_Source: UX_TODAY_FUTURISTIC_DELTA.md, UX_TODAY_FUTURISTIC_COMPETITIVE.md, UX_TODAY_REVIEW_R3_DELTA.md, UX_TODAY_REVIEW_R2_DELTA.md, live codebase audit_

---

## 1. Product Statement

### What "best aspects" means here

Phil's directive is to merge the futuristic preview's best elements into the current live page. This is NOT a redesign — it is a targeted feature-port against a codebase that has already had four refinement rounds (Iter 33 Chartered Minimalism, Iter 39 semantic tokens, Iter 40 Luminous Constraint Phase 2, Iter 43/48 polish).

The preview (`assets/today-futuristic-preview.html`, 1,647 lines) is a working browser prototype demonstrating:
- Semantic adaptive token system (light + dark + two palettes)
- Ambient page depth (radial glow behind content)
- Dramatic date header with Instrument Serif at 30px
- Cadence Pressure Ring (56px SVG arc, 3 bucket segments)
- Glassmorphic customization control bar
- Spring/bounce easing curves
- Hover micro-interactions on nav, blocks, and buttons

### What's already ported (do not re-do)

| Preview element | Live status |
|---|---|
| Instrument Serif + Geist + Geist Mono typography | **SHIPPED** — Iter 40, `app.css:19-21` |
| 3-stop block-fill gradients | **SHIPPED** — Iter 40, `app.css:772+` |
| Cadence Pressure Ring SVG | **SHIPPED** — `js/ui/components/CadencePressureRing.js` |
| Semantic dark mode token layer | **SHIPPED** — Iter 39, `app.css:3818+` |
| `UserPreferences` typedef + Settings page | **SHIPPED** — `js/domain/types.js`, `js/ui/pages/Settings.js` |
| `prefers-reduced-motion` override on now-line glow | **SHIPPED** — `app.css:942` |
| Now-line glow + half-hour grid lines | **SHIPPED** — Iter 43 |
| NowJumpButton | **SHIPPED** — `js/ui/components/NowJumpButton.js` |
| Header date + activity summary | **SHIPPED** — Iter 43/48 |

### What success looks like

A user opening Today in 2026 sees a page that reads as confidently "Luminous Constraint" — the aesthetic has a coherent signature (ambient depth, calibrated easing, luminance hierarchy in nav chrome) without introducing decorative noise that slows workflow. Every element ported has a measurable before/after.

---

## 2. Cohort Framework

Evaluated against: User value (1-5), Phil-bias alignment (1-5), Differentiation (1-5), Effort (FE estimate needed), Risk (FE estimate needed).

### Cohort A — Brand Identity (Luminous Constraint visual signature)

These are the elements that make the preview feel distinctive, not just clean.

| Candidate | Source | User value | Phil-bias | Differentiation | Notes |
|---|---|---|---|---|---|
| **A1. Ambient page depth** — `body::before` radial glow using `--project-glow` (top-left) + `--ci-glow` (bottom-right); fixed, `pointer-events: none`, `z-index: 0` | Preview lines 289-304 | 3 | 5 | 5 | Pure CSS. Zero functional impact. The single element that makes the preview feel "alive" vs static. No equivalent in live page. |
| **A2. Dramatic date header** — `today-weekday` at 30px Instrument Serif, `-0.02em` tracking, with `today-date-sub` in 13px Geist Mono below | Preview lines 463-476 | 4 | 5 | 4 | Live page has a day badge but no large-scale weekday display. Competitive: Notion Calendar's 5.3:1 scale ratio (UX_TODAY_FUTURISTIC_COMPETITIVE.md §P3). Low effort, high visual delta. |
| **A3. Spring/bounce easing curves** — `--ease-spring: cubic-bezier(0.16,1,0.3,1)`, `--ease-bounce: cubic-bezier(0.34,1.56,0.64,1)`, `--ease-std: cubic-bezier(0.4,0,0.2,1)` as CSS tokens | Preview lines 32-35 | 3 | 4 | 3 | Currently live page uses hardcoded easing values scattered. Centralizing as tokens enables consistent micro-interaction quality. XS effort. |
| **A4. 3-level shadow system** — `--shadow-sm`, `--shadow-md`, `--shadow-lg` tokens replacing the single `--shadow` variable | Preview lines 85-87 | 3 | 4 | 3 | Live page has one `--shadow` token (`app.css:82`). Preview differentiates depth levels. Enables Ring tooltip, modal, and panel shadow to speak the same language. |

### Cohort B — Interaction Polish (animations, focus, hover, transitions)

| Candidate | Source | User value | Phil-bias | Differentiation | Notes |
|---|---|---|---|---|---|
| **B1. Nav item hover** — `border-radius: var(--radius-sm)` on hover with `120ms` transition, luminance-hierarchy dimming (muted color for inactive items) | Preview lines 419-430 | 3 | 4 | 3 | Live nav items already have hover state but use hardcoded `#f5f5f4` instead of `--surface-2` token. Token-aligned hover is a 10-minute fix. |
| **B2. Swatch hover spring** — palette swatch `transform: scale(1.15)` on hover with `140ms ease-spring` | Preview lines 387-390 | 2 | 4 | 3 | Only relevant once alternate palette ships. Defer until Cohort E decision on palettes. |
| **B3. Cadence arc transition** — `stroke-dashoffset 600ms ease-std` on arc segments | Preview line 509 | 4 | 5 | 5 | Live Ring may already animate — FE to confirm. If not, this is the single most impactful micro-interaction in the app (the Ring updates as blocks close). |
| **B4. Day badge refinement** — `--surface-glass` + `backdrop-filter` + `inset 0 1px 0 border-inner` on the controls bar style | Preview lines 326-336 | 2 | 3 | 2 | Glass effect on the day badge or header controls. Risk: Competitive flags heavy glassmorphism on functional content as A1 anti-pattern. Scope carefully to chrome only, not block content. |

### Cohort C — Information Design (what's shown, in what order)

| Candidate | Source | User value | Phil-bias | Differentiation | Notes |
|---|---|---|---|---|---|
| **C1. `today-date-group` layout** — date + weekday stacked left, Ring right, badge top-right | Preview lines 462-489 | 4 | 4 | 3 | Live header is Ring + center summary + badge. Preview proposes date-group + Ring. Decision needed: does Phil want a large weekday label as primary header text? R3 Delta found the current center-summary is "sole center text" (app.css:174). This is a layout change, not just CSS. |
| **C2. `nav-day-pill`** — Geist Mono 11px, monospaced context chip in nav bar showing current day context | Preview lines 433-442 | 3 | 4 | 4 | A small indicator in the nav showing day context (e.g., "Day 6/10"). Currently not in live nav. Low effort, adds information density to nav without cluttering. |
| **C3. Luminance hierarchy in nav** — nav chrome explicitly dimmed (muted color on inactive items, `surface-2` hover) vs page content at full luminance | Preview lines 421-430; UX_TODAY_FUTURISTIC_COMPETITIVE.md §P1 | 4 | 5 | 4 | This is Linear's 2026 principle formalized. Live nav uses hardcoded hex `#f5f5f4` hover and `#e7e5e4` active. Token-aligning these to `--surface-2`/`--surface-3` with the luminance intent is a 15-minute CSS update that signals "2026 design system." |

### Cohort D — Accessibility (keyboard paths, ARIA, contrast)

| Candidate | Source | User value | Phil-bias | Differentiation | Notes |
|---|---|---|---|---|---|
| **D1. Cadence tooltip keyboard access** — Ring tooltip triggered on focus as well as hover | Preview line 501 | 4 | 3 | 2 | R3 Delta §8 called out Ring + tooltip as "reference-quality" but keyboard access not confirmed. WCAG 2.1 §1.4.13 requires that tooltip content is accessible via keyboard. XS — add `focus` trigger alongside `hover`. |
| **D2. `prefers-reduced-motion` on easing tokens** — if spring/bounce easing ships (A3), reduced-motion must collapse to `ease-std` or instant | Preview data-motion="full" attribute pattern | 4 | 3 | 2 | `data-motion="full/reduced"` in preview controls section. R3 QA flagged pre-existing `pulse-red` animation violation (now fixed). Same diligence required for any new motion. |

### Cohort E — Drop or Defer (preview experiments that should not ship)

| Candidate | Reason |
|---|---|
| **E1. Floating controls bar** (preview's sticky top-bar with light/dark/palette toggles) | Preview artifact only — it's how the prototype is demoed. Settings UI already ships as `/settings` route + gear icon (UX_TODAY_FUTURISTIC_DELTA.md §Divergence D). Do not port the demo control chrome into production. |
| **E2. Monochrome Operator palette** (second full token set) | Conditional Phase 4 per FUTURISTIC_DELTA.md §8. Only ships if Phase 3 reception is positive. Low differentiation, high test surface. Defer. |
| **E3. `backdrop-filter` on activity blocks** | Competitive explicitly flags this as anti-pattern A1: "blur effects on task cards kill readability." Glass is for chrome only. |
| **E4. Animated headline / date morphing** | Anti-pattern A2 from FUTURISTIC_COMPETITIVE.md. Workflow tool. No kinetic text. |
| **E5. `data-density` toggle (Compact / Standard / Spacious)** | Phase 4 — breaks 5 TodayGrid pixel-arithmetic tests per FUTURISTIC_DELTA.md §4. Not worth the QA debt until other phases are stable. |

---

## 3. Acceptance Criteria

**AC-1** — All R3 hard-won fixes are preserved: dark-mode lunch tooltip token fix, dead-code reconciliation, modal-mutual-exclusion guards. No regression on any R3 Delta items.

**AC-2** — All R2 fixes are preserved: `data-user-edited` desaturation rule removed (Phil's colors visible by default), header date present, half-hour grid lines, NowJumpButton.

**AC-3** — Ambient page depth (A1) renders in both light and dark themes. The glow uses semantic tokens (`--project-glow`, `--ci-glow`) so it adapts to theme automatically. It does not appear on the activity block layer (z-index below content).

**AC-4** — If a large date header (A2 / C1) is shipped, it uses `--font-display` at 28-32px with `-0.02em` tracking, and passes WCAG AA contrast against `--surface-0` in both light and dark themes.

**AC-5** — Spring and bounce easing tokens (A3) are defined in `:root` and every new animated element in this port uses them by reference, not hardcoded cubic-bezier values.

**AC-6** — Nav luminance hierarchy (C3): inactive nav items use `var(--muted)` color and `var(--surface-2)` hover. Active item uses `var(--fg)`. No hardcoded hex in nav hover/active rules.

**AC-7** — Any element using `backdrop-filter` is restricted to chrome (tooltip, modal overlay, nav) and never applied to `.cycle-block-positioned` or activity content elements.

**AC-8** — Any new animated element includes a `@media (prefers-reduced-motion: reduce)` override collapsing to zero-duration or `ease-std`. `data-motion="reduced"` on `<html>` also suppresses animation classes.

**AC-9** — Test suite at 3,888+ tests remains green. No new test skips.

**AC-10** — Every preview element NOT ported has an entry in the Drop/Defer cohort (E) with an explicit reason. No element is dropped by oversight.

---

## 4. Phased Dispatch Plan

### Phase 1 — Foundation tokens + easing (Theme: "Complete the token vocabulary")

**Scope:**
- A3: Add `--ease-spring`, `--ease-bounce`, `--ease-std` to `:root` in `app.css`
- A4: Add `--shadow-sm`, `--shadow-md`, `--shadow-lg` tokens (replace single `--shadow`)
- C3 / B1: Align nav hover/active to semantic tokens (`--surface-2`/`--surface-3`, `--muted`/`--fg`)
- D2: Wire `data-motion` attribute handling in `UserPreferencesService` (attribute already in preview; apply to `<html>` on Settings change)

**Theme:** No visible change to most users; token vocabulary is now complete and consistent. Engineers and the CSS system can reference easing + shadow by name in all future work.

**Score estimate:** Impact 3, Alignment 4, Learning 3, Confidence 5, Effort 1, Risk 1 = 3+4+3+5-1-1 = **13** + convergence = **15+**

**Effort:** XS-S (2-3 hours). Pure CSS + 1 service attribute update.

**Risk:** Low. No structural changes. Token additions are additive.

**Before/after metric:** 0 named easing tokens in `:root` → 3. 1 named shadow token → 3. Nav uses 0 semantic tokens for hover → all nav states use semantic tokens.

---

### Phase 2 — Ambient depth + date header (Theme: "Luminous Constraint becomes unmistakable")

**Scope:**
- A1: `body::before` radial glow (project-glow top-left, ci-glow bottom-right; fixed, z-index 0, pointer-events none; adapts via semantic tokens)
- A2 / C1: `today-weekday` display name at 30px Instrument Serif in Today header. Decision needed from Phil on layout: large date as primary header text OR keep current center-summary approach (Open Question OQ-1)
- C2: `nav-day-pill` — Geist Mono context chip in nav (Day N of cycle)
- D1: Cadence Pressure Ring tooltip accessible on focus (keyboard trigger)

**Theme:** The page visually announces its identity. First moment a user opens Today, the ambient glow and date scale signal craft investment.

**Score estimate:** Impact 4, Alignment 5, Learning 3, Confidence 4, Effort 2, Risk 1 = 4+5+3+4-2-1 = **13** + convergence = **15+**

**Effort:** S-M (4-6 hours including layout decision resolution for C1).

**Risk:** Low-medium. `body::before` is purely cosmetic; the date header depends on layout decision (OQ-1). No test impact expected for ambient glow. Date header change may require 1-2 test assertion updates.

**Before/after metric:** Today page has 0 ambient visual depth elements → ambient glow present. Today header has 0 large-scale date display → weekday at 30px Instrument Serif.

**Blocker:** OQ-1 must be resolved before C1 can be dispatched. A1 and C2 and D1 can ship without it.

---

### Phase 3 — Interaction polish (Theme: "Every motion earns its place")

**Scope:**
- B3: Confirm Cadence arc stroke-dashoffset transition is `600ms ease-std` (FE to verify live Ring; fix if not present)
- B1 hardening: Ensure all hover transitions across Today page use `120-180ms` with the named easing tokens from Phase 1
- A1 dark-mode verification: Ambient glow tokens correct in dark theme (semantic tokens should handle automatically; verify)
- Audit all new animations from Phase 1+2 for reduced-motion compliance (D2 completeness)

**Theme:** Polish pass. Motion that already exists gets consistent timing. Nothing new visually; everything feels tighter.

**Score estimate:** Impact 3, Alignment 4, Learning 2, Confidence 5, Effort 1, Risk 1 = 3+4+2+5-1-1 = **12** + convergence = **14**

**Effort:** XS-S (1-2 hours).

**Risk:** Low. Mostly verification + CSS value alignment.

**Before/after metric:** Arc transition timing is undefined or inconsistent → `600ms ease-std`. Hover transitions use inconsistent timing → all use Phase 1 easing tokens.

---

### Phase 4 — Conditional (Theme: "Monochrome Operator palette, if reception warrants")

**Scope:**
- E2 lifted from defer: Monochrome Operator full token set (already in preview; already in live `app.css` dark token block as a reference — FE to confirm)
- B2: Palette swatch spring hover
- E5 remains deferred: density toggle. Keep deferred.

**Gate:** Only dispatch if Phase 2 generates positive user signal (Phil's subjective assessment of the page after Phase 2 ships). Score may not clear 13 without convergence bonus.

**Score estimate:** Impact 2, Alignment 3, Learning 3, Confidence 3, Effort 3, Risk 2 = 2+3+3+3-3-2 = **6** + convergence = **8** (below gate without Phil directive). Dispatch only if Phil explicitly requests.

---

## 5. Open Questions for Phil

**OQ-1 — Date header layout** (blocks Phase 2 / C1)
The preview shows `today-weekday` as the primary header text at 30px Instrument Serif with a mono date sub-label below. The live page's header center holds an activity summary (`today-header-activity`) — the "up next" status line. These compete for the same visual real estate.

Options:
- A: Large date + mono sub-label replaces current center summary (date leads, activity summary moves below or drops)
- B: Keep current center summary; add date display ABOVE the Ring-summary-badge row as a new row
- C: Keep current layout; skip C1 entirely (ambient glow A1 ships, date header does not)

Phil's taste call. Lenses cannot resolve this without knowing how much he wants the date to dominate.

**OQ-2 — Phase 4 gate** (no urgency)
After Phase 2 ships, is the visual result satisfying enough that a Monochrome Operator palette is worth the effort? This only needs an answer if Phil wants a second palette option for users who don't share his green/yellow/purple identity.

**OQ-3 — Body radial glow intensity**
The preview uses opacity 1 on `body::before` — the glow is always present. On a busy schedule with many blocks, does this compete with block fills? Options: opacity 0.4-0.6 (subtle suggestion), or full opacity (bold, preview-accurate). Phil should see both in browser before dispatch.

---

## 6. Definition of Done

This initiative is complete when:

1. All Phase 1-3 items are shipped and test suite is green at 3,888+ tests
2. The live Today page has: ambient page depth, named easing tokens, named shadow tokens, semantic nav tokens, large date display (if OQ-1 resolved as A or B), nav day-pill, Ring tooltip keyboard access, reduced-motion compliance on all new animations
3. Every Cohort E item has an explicit decision record in this document (all currently documented above)
4. No R3 Delta fixes have regressed (dark-mode token system, dead-code cleanup, modal mutual-exclusion)
5. No R2 fixes have regressed (Phil's colors saturated by default, half-hour grid lines, NowJumpButton)
6. Phil has reviewed Phase 2 in browser and explicitly confirmed the ambient depth intensity is correct (OQ-3)
7. Phase 4 decision is recorded as "dispatch" or "permanent defer" — not left as open

---

_Downstream recipients: system-architect (§6.5 review for any new types), ux-designer (OQ-1 layout options), frontend-engineer (easing/shadow token implementation, arc transition audit), QA (reduced-motion compliance sweep)_
