# Today Preview Port — Synthesis Delta
_Coordinator-authored synthesis of 3 lens reviews · 2026-05-26_

---

## 0. Source Artifacts

| Lens | Artifact | Status |
|---|---|---|
| UX | `TODAY_PREVIEW_PORT_UX.md` | ✅ |
| FE | `TODAY_PREVIEW_PORT_FE.md` | ✅ |
| PM | `TODAY_PREVIEW_PORT_PM.md` | ✅ |

**Lens count: 3 → ConvergenceBonus cap = +3**

---

## 1. Phil's Directive

> "I want to implement the best aspects of the today futuristic preview with the current version of the today page. Engage subagents to update page and features."

---

## 2. State of the Port (All 3 Lenses Agree)

The futuristic preview is **~85% already live** as a result of Iter 39, 40, 42, 43 + R3 polish + steps-to-complete Phase 1. What landed:
- Instrument Serif + Geist + Geist Mono typography trio
- 3-stop bucket gradients (green/yellow/purple) with inset highlight
- Cadence Pressure Ring (SVG signature)
- Now-line with breathing glow trail
- Past-hour rail dimming
- PROPOSED dashed-border treatment
- BDD color bar + dialog entrance animation
- Dark-mode semantic token layer
- NowJumpButton + steps-to-complete render

The residual gaps fall into 3 cohorts: **correctness (CSS-state bugs), motion polish, and token vocabulary**.

---

## 3. CRITICAL — Latent Bug Discovery (UX + FE Convergent)

### Bug: `data-state` attributes emitted but unstyled

**Evidence:**
- `TodayGrid.js:184` emits `data-state="IN_PROGRESS|CLOSED|SKIPPED"` on every block
- `app.css` has ZERO selectors matching these state values
- The preview HTML explicitly styled all three states

**User impact:** Users cannot visually distinguish:
- The block they are currently executing (IN_PROGRESS) from upcoming work
- Past completed blocks (CLOSED) from current/future blocks
- Skipped blocks (SKIPPED) from active ones

**Verdict:** This is a **correctness defect wearing a style hat** (FE's phrase). Both UX and FE independently called it the #1 highest-leverage item.

**Fix:** Pure CSS. ~20–30 minutes. No JS, no §6.5.

---

## 4. Convergent Port Recommendations (UX + FE Aligned)

| # | Item | Source line (preview) | Effort | §6.5 | Why ported |
|---|---|---|---|---|---|
| C-1 | IN_PROGRESS double-ring halo | preview block-state CSS | S | No | Latent bug (above); makes "now" visible |
| C-2 | CLOSED/SKIPPED opacity dim | preview block-state CSS | XS | No | Past blocks should recede like past-hour labels do |
| C-3 | `proposedShimmer` keyframe on PROPOSED blocks | preview keyframes | S | No | Named explicitly in preview design notes; preview-intentional |
| C-4 | Now-label glass pill (frosted, not flat white) | preview .now-label | S | No | Replaces flat opaque white rectangle with intended frosted chip |
| C-5 | `blockReveal` direction fix (translateX → translateY+scale) | preview keyframes | XS | No | Spatially correct for vertical calendar grid; 5-min fix |
| C-6 | Now-line dot pulse (currently static) | preview nowPulse keyframe | XS | No | Completes the dot+glow system that's half-implemented |
| C-7 | Hover transform `prefers-reduced-motion` guard | preview hover rules | XS | No | WCAG 2.3.3 gap on `cycle-block-positioned:hover` |
| C-8 | BDD dialog backdrop blur | preview .bdd-modal::backdrop | S | No | Frosted-glass dialog separation; FE-flagged |
| C-9 | Kaizen ping → two-ring upgrade | preview kaizen-ping CSS | S | No | FE-flagged enhancement to existing animation |

**Combined effort: ~2 hours, pure CSS, zero §6.5, low test risk (parse-based tests sufficient).**

---

## 5. PM-Unique Recommendations (Token/Infrastructure)

| # | Item | Effort | Why |
|---|---|---|---|
| PM-1 | Ambient page depth (`body::before` radial glow with `--project-glow`/`--ci-glow`) | S | Single CSS rule; most distinctive preview element not yet live |
| PM-2 | Easing token vocabulary (`--ease-spring`, `--ease-bounce`, `--ease-std`) | S | Codebase has hardcoded easings throughout; centralize for future micro-interaction consistency |
| PM-3 | Shadow token vocabulary (`--shadow-sm/md/lg`) | S | Same pattern as PM-2; centralizes shadow ramps |
| PM-4 | Nav chrome luminance hierarchy (hex → `--surface-2`/`--surface-3` tokens) | XS | Linear 2026 pattern; 15 min |

PM frames these as **infrastructure** — they don't change the visible page directly but unlock consistency for all subsequent micro-interaction work.

---

## 6. Phil-Taste-Driven (OPEN QUESTION)

**OQ-1 (PM): Date header treatment** — Should a large Instrument Serif weekday display (30px, preview-accurate) replace OR coexist with the current center activity summary?

- (a) Replace — preview-accurate, sharper editorial hierarchy
- (b) Coexist — preserves activity summary but adds visual weight to date
- (c) Skip — current treatment is fine

**Decision required from Phil. Blocks any date-header work but does NOT block C-1 through C-9 or PM-1 through PM-4.**

---

## 7. Intentionally NOT Ported (All 3 Lenses Converge)

| Element | Why dropped |
|---|---|
| Controls bar (preview-only) | Prototyping artifact, not product |
| Standalone date heading | Removed in Iter 48 for good reason (UX would regress) |
| Triad outside CycleCard | Architectural regression |
| Bucket strip | Removed Iter 48 — Cadence Pressure Ring supersedes it |
| Glassmorphism on blocks | Reduces legibility; conflicts with current 3-stop gradient |
| Monochrome Operator palette | Defer to Phase 4 (conditional on Phil request) |
| Animated text | Distraction; not Phil-aligned |
| Density toggle | Out of scope; complexity > value |

These are explicit drops with reasons, not oversights.

---

## 8. Phased Dispatch Plan

### Phase A — Correctness + State Bug (CONVERGENT UX+FE)

**Theme:** Fix the latent `data-state` bug + adjacent correctness fixes.

**Includes:**
- C-1: IN_PROGRESS double-ring halo
- C-2: CLOSED/SKIPPED opacity dimming
- C-7: Hover reduced-motion guard

**Effort:** ~1 hr CSS-only.

**Why first:** Closes a correctness gap (IN_PROGRESS invisibility) that's been live undetected. Both UX and FE called this #1.

---

### Phase B — Motion + Entrance Polish

**Theme:** Complete the preview's animation system.

**Includes:**
- C-3: `proposedShimmer` on PROPOSED blocks
- C-5: `blockReveal` direction fix (Y-axis + scale)
- C-6: Now-line dot pulse
- C-4: Now-label glass pill
- C-8: BDD backdrop blur
- C-9: Kaizen ping two-ring upgrade

**Effort:** ~1.5 hr CSS-only.

**Why next:** Pure visual uplift; preview-intended; low risk; ships the "feel" Phil wants without touching any JS or data flow.

---

### Phase C — Token Vocabulary + Ambient Depth (PM-DRIVEN)

**Theme:** Infrastructure for consistency + the most distinctive missing preview element.

**Includes:**
- PM-1: Ambient page depth (`body::before` radial glow)
- PM-2: Easing token vocabulary
- PM-3: Shadow token vocabulary
- PM-4: Nav chrome luminance hierarchy

**Effort:** ~2–3 hr CSS-only.

**Why third:** Codifies design tokens; once shipped, all future ports use them. Ambient depth is the most distinctive unshipped preview element.

---

### Phase D — Date Header (BLOCKED on OQ-1)

Defer until Phil resolves OQ-1.

---

## 9. Scoring (per §6.4)

### Phase A (correctness + state bug)
| Dimension | Score |
|---|---|
| Impact | 4 (fixes IN_PROGRESS invisibility — correctness defect) |
| Strategic | 4 (Phil's directive; convergent UX+FE flag) |
| Learning | 3 (codifies `data-state` styling pattern; future state additions easier) |
| Confidence | 5 (2-lens convergence; CSS-only) |
| Effort | 1 (~1 hr) |
| Risk | 1 (CSS-only, no logic) |
| **Base** | 4+4+3+5−1−1 = **14** |
| **ConvergenceBonus** | **+2** (UX+FE; PM aligns implicitly) |
| **Total** | **16** |

### Phase B (motion polish)
| Dimension | Score |
|---|---|
| Impact | 3 (visual uplift, not correctness) |
| Strategic | 4 (preview-intentional polish; Luminous Constraint completion) |
| Learning | 2 |
| Confidence | 5 (FE detailed plan; UX explicit recommendations) |
| Effort | 1 (~1.5 hr) |
| Risk | 1 (CSS-only) |
| **Base** | 3+4+2+5−1−1 = **12** |
| **ConvergenceBonus** | **+2** |
| **Total** | **14** |

### Phase C (token vocab + ambient depth)
| Dimension | Score |
|---|---|
| Impact | 3 (ambient depth visible; tokens are infrastructure) |
| Strategic | 5 (unlocks all future micro-interaction consistency) |
| Learning | 3 (codifies token system extensibility) |
| Confidence | 4 (PM-only on these specific items but framework sound) |
| Effort | 2 (~2–3 hr) |
| Risk | 1 (additive CSS) |
| **Base** | 3+5+3+4−2−1 = **12** |
| **ConvergenceBonus** | **+1** (PM-led) |
| **Total** | **13** |

**All 3 phases above the score-13 gate.**

### Phase D (date header) — Score TBD pending OQ-1

---

## 10. Decision Required

Phil to choose:

- **A** — Dispatch Phase A only (~1 hr, fixes correctness bug). Defer B/C.
- **B** — Dispatch Phase A + B (~2.5 hr, fixes bug + completes motion polish).
- **C** — Dispatch Phase A + B + C (~5 hr, full port; ships everything that isn't Phil-taste-blocked).
- **D** — Dispatch all 3 phases + answer OQ-1 for Phase D
- **E** — Hold; review lens artifacts first
- **F** — Pick specific items by listing them

**My recommendation: C.**

Reasoning:
- All 3 phases score above gate
- All 3 phases are CSS-only, zero §6.5, low test risk
- The preview was Phil-approved already; this is finishing what was started
- Phase A alone closes the correctness gap but leaves motion + token work for later
- Phase A+B+C together complete the port; only Phil-taste (OQ-1) blocks final completion
- Cumulative effort ~5 hr is well within today's capacity given prior catalog work shipped clean

If you want minimum scope: **A** (just close the correctness bug; defer aesthetic work).

If you want bug fix + the most-visible-polish: **B** (skip the token infrastructure for later).

---

## 11. Bystander Notes

- Deploy queue: 0-deep (clean state after Phase 4 catalog push)
- All 3 phases preserve R3 hard-won fixes (no token regression, no modal-mutual-exclusion regression, no dragController regression)
- Test suite expectation: 3888 baseline + ~15-25 new parse-based regression tests for state styles, animation keyframes, and token presence
- Token discipline (R3 P1 lesson) carries forward: only Iter 39 semantic tokens for new rules; PM-2/PM-3 EXTEND the token system, they don't compete with it
- META §A.2 orthogonal-case discipline: each new `data-state` rule needs a paired "does NOT match other state" test
- META §A.3 reconciliation: every new keyframe + every new class needs an emitter at merge time
- The two-lens convergence (UX + FE) on the `data-state` latent bug validates the multi-lens review pattern — this defect was sitting in production unnoticed
