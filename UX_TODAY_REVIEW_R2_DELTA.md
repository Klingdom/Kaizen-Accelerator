# UX Today Review R2 — Synthesis Delta
_Coordinator-authored synthesis of 3 lens reviews · 2026-05-17_

---

## 0. Source Artifacts

| Lens | Artifact | Status |
|---|---|---|
| UX | `UX_TODAY_REVIEW_R2.md` | ✅ |
| Frontend | `UX_TODAY_REVIEW_R2_FRONTEND.md` | ✅ |
| Competitive | `UX_TODAY_REVIEW_R2_COMPETITIVE.md` | ✅ |

**Lens count: 3 → ConvergenceBonus = +2**

---

## 1. Phil's Directive

> "I need to have the subagent look at the today page again and improve it. If nothing else can be done then make it look and feel a little more like Google Calendar."

---

## 2. Strong Convergence: No Redesign Warranted

All 3 lenses agree:
- ✅ **Architecture is sound** post-Iter 42
- ✅ **Page is mature, not stitched**
- ❌ **A 4th redesign pass would be overengineering**
- ✅ **Incremental polish + GCal-craft adoption is the right path**

Competitive's verdict crystallizes it:
> *"Adopt GCal's pixels (craft conventions). Reject GCal's philosophy (no opinions). The test for every proposed change: 'Am I copying pixels or philosophy?' Pixels = usually fine. Philosophy = never."*

---

## 3. 🚨 P1 Bug Discovered (Phil has been seeing this daily)

### UX critical finding: `data-user-edited` desaturation is INVERTED
**Location**: `app.css:523-526` (need to verify exact lines — UX flagged this rule)

The CSS rule reads roughly:
```css
.cycle-block-positioned[data-user-edited="false"] {
  background-color: color-mix(in srgb, var(--bg) 60%, transparent);
  color: var(--fg);
}
```

**Effect**: Activities default to `userEdited: false` (Auto-Plan output). The rule above DESATURATES every Auto-Plan block to a flat pale wash. **Phil's vibrant green/yellow/purple identity NEVER appears on a default schedule — only after the user manually edits something.**

This rule pre-dates Iter 31 (color theming) and Iter 33 (Chartered Minimalism). Both iterations added saturated fills, but this DESATURATION rule was never reconciled. Iter 40's 3-stop gradients are applied, but this rule overrides them at runtime.

**Phil's stated intent (Iter 31 directive verbatim)**: *"On today calendar make each card filled in the color for the activity. I like green for project work because it pays the bills. Yellow for communication because they are golden opportunities. And purple for continuous improvement because it is my favorite color."*

**Production reality**: Auto-Plan blocks render pale-wash, NOT colored.

**Fix**: Remove or invert the desaturation rule. Block colors should be saturated by default; user-edited blocks could optionally have an additional visual cue (slight inset shadow, dot, etc.) — NOT desaturation reversal.

---

## 4. Recommended Cheap-Wins Bundle (Iter 43)

All XS-S effort, low risk, 0 §6.5 hits. Bundle into single iteration.

| # | Item | Source | Effort | Test damage |
|---|---|---|---|---|
| 1 | **Fix data-user-edited desaturation** (CRITICAL — Phil's colors invisible by default) | UX | S | Low — possibly 1 test update |
| 2 | **Calendar date in header** (currently shows "Day 6" but no actual date) | FE | XS | +1 test assertion |
| 3 | **Now-line glow trail tightening** (`::after` fade 65% → 45%, dot border 3px) | FE | XS | None |
| 4 | **Half-hour grid lines** (GCal pattern — mirror existing renderHourLines at half-hour with lower opacity/dashed) | UX + FE + Competitive | XS | None |
| 5 | **Past-hour subtle dimming** (GCal pattern — past time grid lines slightly dimmer than future) | UX | XS | None |
| 6 | **Elevate current/next activity to visible header** (CycleCard.js:111-156 already computes; only renders as invisible aria-live) | UX | S | +2-3 test assertions |
| 7 | **"Jump to Now" sticky button** (GCal pattern — scroll-to-now affordance) | FE | M | +1 test file |

**Estimated bundle**: 2-3 hours. **Total user-visible impact: significant** (especially #1 — Phil's colors finally appear).

---

## 5. Recommended Hold Items (Phase 4 or skip)

| Item | Why hold |
|---|---|
| Remove BucketStrip, enrich Ring tooltip | Duplicates same data per UX; but removing existing component = test damage. Defer until clear value. |
| GCal-style click-empty quick-add popover with type tabs | We already have CatalogPicker (Iter 36); bucket-type tabs would be incremental. Defer. |
| Mini calendar sidebar | New feature, not polish. Defer to backlog. |
| Phase 4 Luminous Constraint (alternate palette + density toggle) | CONDITIONAL on Phase 3 reception; UX agent says current architecture sound. Skip unless Phil wants it. |

---

## 6. Recommended REJECT Items (positioning trap)

| GCal pattern | Why reject |
|---|---|
| Blank-canvas empty state | Erases BAM-X's "your time has structure" signal |
| User-defined calendar colors | Breaks bucket-cognition systemic meaning |
| Frictionless drag (no conflict surfacing) | Destroys ratification model |
| Calendar = no opinions | Antithesis of BAM-X positioning |

---

## 7. Scoring (per §6.4)

Item: **C-UX-POLISH-R2 — Today page polish bundle (Iter 43)**

| Dimension | Score |
|---|---|
| Impact | 4 (Phil's colors finally visible; nav improvements; GCal familiarity) |
| Strategic alignment | 4 (preserves BAM-X positioning; adopts GCal craft only) |
| Learning value | 3 (validates "pixels not philosophy" heuristic) |
| Confidence | 5 (3-lens convergence; clear concrete items; cheap) |
| Effort | 1 (2-3 hours total) |
| Risk | 1 (mostly CSS; no §6.5; no test renames) |
| **Base score** | 4+4+3+5-1-1 = **14** |
| **ConvergenceBonus** | **+2** (3 lenses) |
| **Total** | **16** |

Very high score for low-cost work. Clean cheap-wins.

---

## 8. Decision Required

Phil to choose:

- **A** — Approve the 7-item cheap-wins bundle as Iter 43 (2-3 hr, includes Phil's-colors-bug fix as item #1)
- **B** — Approve items 1-5 only (skip the "Jump to Now" button and elevate-now-pane to keep scope tight; 1-1.5 hr)
- **C** — Approve ONLY item #1 (the P1 colors-invisible bug fix; 30 min)
- **D** — Hold; deploy current state (Iter 42) first; revisit after seeing Cadence Pressure Ring in production

**My recommendation: A.** All 7 items are convergent across the lenses. The bug fix (#1) is the highest-impact single change in the entire Luminous Constraint redesign — Phil has been LOOKING at pale-wash blocks instead of his green/yellow/purple identity. Shipping the bundle as one iteration is more efficient than fragmenting.

If you're tired of dispatches and want minimum scope: **C** (the colors-bug fix alone). But you'd want the rest queued for follow-up.

---

## 9. Bystander Note

**Deploy queue is 6-deep** (Iter 37-42; Iter 41 was hotfix exception). META §7.7 critically over. Iter 43 cheap-wins would push to 7-deep. Recommend deploy BEFORE Iter 43 dispatch — but Phil's decision overrides.
