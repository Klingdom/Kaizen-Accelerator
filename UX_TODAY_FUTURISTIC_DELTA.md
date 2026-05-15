# UX Today Futuristic — Synthesis Delta
_Coordinator-authored synthesis of 6 lens reviews + `frontend-design` skill output · 2026-05-14_

---

## 0. Source Artifacts

| Lens | Artifact | Status |
|---|---|---|
| UX | `UX_TODAY_FUTURISTIC_UX.md` (470 lines) | ✅ |
| Product | `PRODUCT_TODAY_FUTURISTIC.md` | ✅ |
| Architect | `ARCHITECTURE_DELTA_TODAY_FUTURISTIC.md` (~470 lines) | ✅ |
| Frontend (frontend-design skill) | `UX_TODAY_FUTURISTIC_DESIGN.md` (575 lines) + `assets/today-futuristic-preview.html` (1,647 lines runnable) | ✅ |
| QA | `UX_TODAY_FUTURISTIC_QA.md` (450 lines) | ✅ |
| Competitive | `UX_TODAY_FUTURISTIC_COMPETITIVE.md` | ✅ |
| Growth | `UX_TODAY_FUTURISTIC_GROWTH.md` | ✅ |

**Lens count: 7 (incl. frontend-design as a distinct creation lens) → ConvergenceBonus = +3 (cap)**

---

## 1. Phil's Directive

> "UX and front end for today page need to be drastically improved. Make more futuristic, modern, innovative, and customizable."

---

## 2. Convergence (where lenses agree)

| Finding | Convergence |
|---|---|
| Push beyond Iter 33 Chartered Minimalism into 2026 design language | **7/7** |
| Phil's color identity (green/yellow/purple/lunch-gray) STAYS as default | **7/7** |
| Customization mechanism: theme + palette + motion at minimum (MVP) | **7/7** |
| Semantic adaptive dark mode (NOT just color inversion) | **7/7** |
| §6.5 hits minimal — only `types.js` for UserPreferences typedef | **Architect-confirmed; FE/QA agree** |
| Tension acknowledged: futuristic + workflow tool both demand intentionality | **6/6** explicit (Growth implicit) |
| 4-phase shipping (settings infra → visual → signature → palettes) | **PM, Architect, FE align** |
| Innovation signature must visualize the 4-2-2 discipline | **UX + FE both propose this** (different forms) |
| Apple Liquid Glass = 2026 reference but DON'T copy it on functional content | **Competitive + QA both flag** |

---

## 3. Critical Divergences (decisions needed)

### Divergence A: Direction name

| Lens | Proposed name | Vibe |
|---|---|---|
| UX | **Operational Glass** | Bloomberg terminal raised with taste budget; spatial depth + frosted glass + extreme typographic authority |
| Frontend (skill) | **Luminous Constraint** | Cockpit instrument panel by a Swiss watchmaker; surface communicates discipline through *light* rather than austerity |

**Synthesis note**: both are workflow-tool-friendly framings of "futuristic but disciplined." Functionally equivalent; choose either.

**Recommendation**: **Luminous Constraint** — the word "constraint" subtly carries the deliberate-ratification + sacred-CI brand DNA; "operational glass" leans more visual.

### Divergence B: Typography

| Lens | Proposed trio |
|---|---|
| Iter 33 (status quo) | DM Serif Display + DM Sans + DM Mono |
| UX (this iter) | Geist as default — keep DM available as fallback |
| Frontend (this iter) | **Instrument Serif + Geist + Geist Mono** |

**Trade-off**: Iter 33 DM trio is shipped + Phil-approved. Switching to Instrument Serif + Geist signals "more 2026" but means abandoning the typography decision Phil signed off on 1 day ago.

**Recommendation**: **Switch to Instrument Serif + Geist + Geist Mono** for 3 reasons:
1. Geist is the Vercel-tier signal that competitive analysis flagged as the "premium developer tool" reference
2. Instrument Serif is closer to DM Serif than most alternatives — minimal personality drift on the display
3. Geist Mono pairs more tightly with Geist than DM Mono pairs with DM Sans

If Phil pushes back: keep DM Serif Display on the date heading; switch only body + mono to Geist family.

### Divergence C: Innovation signature pattern

Both UX and Frontend independently proposed visualizing the 4-2-2 discipline as the signature. Different forms:

| Lens | Proposal | Form | Placement |
|---|---|---|---|
| UX | **Discipline Pulse** | 4px horizontal strip showing 4-2-2 actual building in real-time as blocks close | Below the calendar grid (always docked) |
| Frontend (skill) | **Cadence Pressure Ring** | 56px SVG arc divided into green/yellow/purple segments proportional to planned minutes per bucket | Today header (always visible) |

Both solve the same problem (visualizing 4-2-2 discipline as the signature). They're complementary, not competing — but shipping both = noise.

**Recommendation**: **Cadence Pressure Ring** in the header. Reasons:
- More visible as a signature (header position)
- Compresses the whole 4-2-2 promise into one glanceable token
- Doesn't conflict with existing right-margin bucket strip (which shows targets + progress; the Ring shows the discipline COMMITMENT before any blocks close)
- The Discipline Pulse can be a Phase 3.5 add-on if Phil wants both

### Divergence D: Settings UI location

| Lens | Proposed location |
|---|---|
| Architect | Dedicated `/settings` route + header gear icon for quick theme toggle |
| UX | Header dropdown menu |
| PM | Agnostic — defer to Architect |

**Recommendation**: Architect's pattern — dedicated `/settings` page (the route slot already exists in `js/ui/router.js:34` as a placeholder) + header gear icon for one-click dark/light toggle. Deep-linkable, scalable as customization grows, and accessible.

### Divergence E: MVP customization scope

| Lens | Proposed MVP |
|---|---|
| UX | 5-6 dimensions (theme, palette, density, motion, widgets, font) |
| Frontend | 3 in preview (theme, palette, motion) |
| PM | "TIGHT default set" — light/dark + motion-reduced + 1 alternative palette |
| Growth | **3 themes max** (System / Chartered Light / Futuristic Dark) — gate behind first-plan-accepted (customization as REWARD, not tax) |

**Recommendation**: Growth's framing wins. Phase 1 ships:
- 3 themes (System / Light / Dark)
- Motion intensity (Full / Reduced — accessibility-required anyway)
- Phil's palette stays as default; alternative palette = Phase 4

Customization unlocked AFTER first-plan-accepted (Growth's activation insight).

---

## 4. Critical QA Findings

### CRITICAL pre-existing issue (must fix in Phase 1)
**`pulse-red` animation on IN_PROGRESS activity blocks has NO `prefers-reduced-motion` override.** Highest-risk pre-existing WCAG violation. Must be remediated in Phase 1 before any new animations are added or it will be flagged in any audit.

### Phase risk severity
| Phase | QA verdict |
|---|---|
| 1 (dark mode + settings) | **HIGH** — bucketMeta.test.js deepEqual asserts `var(--project-bg)` etc.; any CSS token rename breaks 12 tests. 7 animations need prefers-reduced-motion overrides shipped simultaneously. |
| 2 (visual refinements) | MEDIUM — z-index risk if depth layers inserted into `.cycle-timeline`; could silently break click routing |
| 3 (signature pattern) | **HIGH** — CCC upper bound (≤4) at capacity; new structural element pushes count over |
| 4 (palettes + density) | **HIGH** — density toggle changes default `rowHeightPx`, breaks 5 TodayGrid pixel-arithmetic tests |

**Implication**: 3 of 4 phases are HIGH risk. Phasing must include CCC test bound update + bucketMeta token contract decision + pixel-arithmetic test refactor.

---

## 5. Growth Findings

### Net-positive for retention
- Users who make deliberate customization choice churn at lower rates
- Dark-mode default serves modal preference of BAM-X's CI-expert demographic
- Cadence Pressure Ring (innovation signature) creates word-of-mouth potential

### Conditional for activation
- Day-0 path already misses 60-second aha target
- A futuristic Today shipped before structural scan killers are fixed = churn risk
- BUT: Iter 23 already moved RhythmExplainer to `_backup`; Iter 33 + Iter 37 addressed bucket strip; Iter 28 hotfix addressed stuck state. **Growth's pre-conditions are mostly already met.** Coordinator note: Growth's recommendation predates knowledge of Iter 23-38 fixes; the "fix structure first" warning is already addressed.

### Customization MVP — Growth's strong recommendation
- **3 themes max** at first ship (System / Light / Dark)
- **Gate customization behind first-plan-accepted** — make it a reward, not a tax
- Use system-detected dark/light on first load
- No forced-light default

---

## 6. Architect Findings

### §6.5 hit count: **1 file**
- `js/domain/types.js` — new `UserPreferences` typedef + supporting enums (ThemeId, AccentId, Density, MotionPreference, TodayLayout, BucketPaletteOverrides). +90 LOC. Justified because preferences are persisted, enumerated, versioned, cross-layer — same contract as `Opportunity`, `Composition`.
- All 16 other files outside §6.5 (services, UI components, CSS, boot)

### Settings storage
- localStorage key shape: `bamx.userPreferences.v1`
- Migration: not needed if defaults match current state exactly
- Multi-device sync: out of scope MVP (Q1 — Phil decides if it matters)

### Theme system
- CSS custom property scoping via `data-theme` attr on `<html>`
- Same approach for `data-palette` and `data-motion`
- All switching is pure CSS — no JavaScript variable mutation
- Settings updates propagate via state slice + rerender (small) AND CSS custom property changes (immediate)

---

## 7. Competitive Findings

### Top 5 patterns BAM-X should adopt
1. **Luminance hierarchy** as a structural principle (Linear's "calmer" approach)
2. **Semantic adaptive dark mode** (not just inversion) — Vercel/Linear pattern
3. **Dramatic typographic scale** in Today header (Notion Calendar — 5.3:1 H1:H2 ratio)
4. **Accent color customization** with system-level token architecture (Linear, Arc, Apple)
5. **Card elimination** in dense list areas (Stripe, Linear)

### Top 3 anti-patterns to AVOID
1. Heavy glassmorphism on functional elements (kills readability + perf)
2. Kinetic typography / animated headlines (anti-productivity)
3. "Dark galaxy" aesthetic without speed budget (Raycast's void works because <50ms response — BAM-X currently 4.15s suite, slower runtime)

### Honest assessment from Competitive
> "Phil's wish ('more futuristic, modern, innovative, customizable') is not a positioning trap IF interpreted as **craft-level elevation of functional design**, not surface decoration. It IS a trap if it becomes glassmorphic overlays, animated headers, gradient everywhere."

---

## 8. Recommended Final Direction

**Aesthetic name**: **Luminous Constraint**

**Phase 1 (4-6 hr)**: Dark mode + customization framework
- New `js/domain/types.js` UserPreferences typedef (only §6.5 hit)
- Semantic CSS token system: light + dark variants for all `--project-*`, `--communication-*`, `--ci-*`, `--surface-*`, `--text-*`, `--border-*`
- 3 themes: System (default — auto-detect), Light, Dark
- Motion intensity (Full / Reduced — accessibility-required)
- Settings UI: dedicated `/settings` route + header gear icon
- Customization gated behind `firstPlanAcceptedAt > 0` (Growth recommendation)
- **CRITICAL pre-Phase-1**: add `prefers-reduced-motion` override to existing `pulse-red` animation

**Phase 2 (6-8 hr)**: Visual refinements
- Typography: switch to Instrument Serif + Geist + Geist Mono (replaces DM trio)
- Surface depth: 3-level shadow system (no heavy glassmorphism on functional content; subtle on chrome only)
- Block fill evolution: 3-stop inner-top-light gradients
- Now-line glow refinement
- Hour rail typography refinement

**Phase 3 (10-14 hr)**: Innovation signature
- **Cadence Pressure Ring** in Today header — 56px SVG arc, 3 segments (green/yellow/purple) proportional to planned minutes per bucket; hover reveals tooltip; updates real-time as blocks close
- Becomes the "one thing users will remember"

**Phase 4 (8-10 hr, conditional)**: Alternate palettes + density toggle
- One alternative palette (e.g., Monochrome Operator — neutral grays for non-CI-expert users)
- Layout density toggle (Compact / Standard / Spacious)
- Only ship if Phase 3 reception is positive

**Total estimated effort**: 28-38 hr across 4 phases.

---

## 9. Standard-Work Authority Items for Phil

| ID | Question | Synthesis default |
|---|---|---|
| SW-Q-FUT-1 | Direction name | **Luminous Constraint** (over Operational Glass) |
| SW-Q-FUT-2 | Typography — switch from DM trio (Iter 33) to Instrument Serif + Geist + Geist Mono? | **Switch** (Geist is the 2026 premium signal; Iter 33 ships in production fine, but redesign is the moment to upgrade) |
| SW-Q-FUT-3 | Innovation signature: Cadence Pressure Ring vs Discipline Pulse vs both? | **Cadence Pressure Ring** (header SVG); Discipline Pulse deferred |
| SW-Q-FUT-4 | Settings UI: dedicated `/settings` page or header dropdown only? | **Both** — `/settings` page (deep, scalable) + header gear icon (one-click theme toggle) |
| SW-Q-FUT-5 | MVP customization: 3 themes only or full set immediately? | **3 themes** (System / Light / Dark) + motion intensity. Alt palettes Phase 4. |
| SW-Q-FUT-6 | Default theme on first load: System (auto-detect) vs Light | **System** (Growth + Competitive both recommend) |
| SW-Q-FUT-7 | Customization gate: always-available vs first-plan-accepted? | **First-plan-accepted** (Growth: customization as reward not tax) |
| SW-Q-FUT-8 | Multi-device preference sync? | **No** — localStorage only; defer cloud sync |

---

## 10. Scoring (per §6.4)

Item: **C-UX-FUTURISTIC — Today futuristic redesign + customization framework**

| Dimension | Score |
|---|---|
| Impact | 5 (every Today session; visible everywhere) |
| Strategic alignment | 4 (Phil's directive; aligns with workflow positioning IF executed as craft-elevation per Competitive) |
| Learning value | 5 (validates customization adoption + dark mode hypothesis; first user-preferences entity in BAM-X) |
| Confidence | 4 (7-lens convergence; clear direction; QA flags 3-of-4-phase HIGH risk = real but managed by phasing) |
| Effort | 4 (full bundle 28-38 hr; phased) |
| Risk | 3 (3-of-4 phases HIGH per QA; mitigated by phase-by-phase ship with testing gates) |
| **Base score** | 5+4+5+4-4-3 = **11** |
| **ConvergenceBonus** | **+3** (7 lenses) |
| **Total** | **14** |

Per-phase scores:
- Phase 1 (settings + dark mode): 12 + 3 = **15** (foundation; everything else depends on this)
- Phase 2 (visual refinements): 11 + 3 = **14** (high impact, contained risk)
- Phase 3 (signature ring): 12 + 3 = **15** (the "memorable" detail)
- Phase 4 (palettes + density): 9 + 3 = **12** (lower impact, conditional)

---

## 11. Decision Required

Phil to choose:

- **A** — Approve all 8 SW-Q-FUT defaults + dispatch Phase 1 (4-6 hr; HIGH risk per QA — pre-Phase-1 fixes pulse-red animation a11y; settings infra + dark mode + 3 themes + motion-reduced)
- **B** — Approve Phase 1 only; defer typography + signature pattern + palettes decisions
- **C** — Override one or more synthesis defaults (specify which)
- **D** — Open `assets/today-futuristic-preview.html` first; decide after seeing it
- **E** — Hold; review individual lens artifacts first
- **F** — Reject the redesign; current Iter 33-38 state is fine; pick something else

**My recommendation: D first, then A.** The textual description undersells the visual delta — open the preview HTML in a browser. It includes both light + dark themes, alternative palette, motion toggle, and the Cadence Pressure Ring signature. Visual decision becomes obvious in 2 minutes.

If you can't review the preview now: **B** (Phase 1 only, defer the rest) is a safer ship than committing to all 4 phases sight-unseen.

---

## 12. Implementation gating constraints

### Pre-Phase-1 (mandatory)
- Add `@media (prefers-reduced-motion: reduce)` override to pulse-red animation (existing accessibility violation)
- Update bucketMeta tests to assert against semantic tokens, not hex literals (prepares for theme system)

### Phase 1 (mandatory before Phase 2)
- Settings persistence working
- Dark mode at parity with light mode (every component renders correctly in both)
- Customization gated by firstPlanAcceptedAt
- All 3,259 existing tests pass

### Phase 2 (mandatory before Phase 3)
- Typography switch deployed cleanly (no font-loading regression)
- Block depth visible without breaking click routing
- All Iter 29-38 calendar interactions still work

### Phase 3 (mandatory before Phase 4)
- Cadence Pressure Ring renders with correct math
- Hover tooltip works with screen reader
- CCC bound updated to ≤5 (was ≤4 — Ring adds 1 region)

---

## 13. Bystander note

Phase B composer rebalance (Iter 38) just shipped. Production deploy queue is now 2-deep (Iter 37 + 38). Phase 1 of this redesign would push to 3-deep — still under META §7.7 gate of 4. But after Phase 2 ship, deploy needed before Phase 3.
