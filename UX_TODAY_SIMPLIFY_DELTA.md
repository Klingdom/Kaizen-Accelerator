# UX Today Simplify — Synthesis Delta
_Coordinator-authored synthesis of 7 lens reviews · 2026-05-03_

---

## 0. Source Artifacts

| Lens | Artifact | Status |
|---|---|---|
| UX | `UX_TODAY_SIMPLIFY_UX.md` | ✅ |
| Product | `PRODUCT_TODAY_SIMPLIFY.md` | ✅ |
| Architect | `ARCHITECTURE_DELTA_TODAY_SIMPLIFY.md` | ✅ |
| Frontend | `UX_TODAY_SIMPLIFY_FRONTEND.md` | ✅ |
| QA | `UX_TODAY_SIMPLIFY_QA.md` | ✅ |
| Growth | `UX_TODAY_SIMPLIFY_GROWTH.md` | ✅ |
| Competitive | `UX_TODAY_SIMPLIFY_COMPETITIVE.md` | ✅ |

**Lens count: 7 → ConvergenceBonus = +3 (cap)**

---

## 1. Phil's Verbatim Directive

> "Lets simplify first... Keep the header and then remove everything except the Today, composed boxed area. We should populate the perfect day based on user projects (if no projects then focus on project discovery and lead to project types). Start with at least 4 hours of project work or discovery placeholders... two hours of high-value communication with a standard default of start of work communication, communication right after lunch, and communication at the end of deep work cycles. Continuous improvement should be sacred for users to be thoughtful and improve their work and make their lives easier. **I am the ultimate authority for all standard work inventories** for these focus areas."

---

## 2. Convergence (where all 7 lenses agree)

| Finding | Convergence |
|---|---|
| Strip Today.js to header + CycleCard | **7/7** |
| Remove RhythmExplainer (Growth: net positive) | **7/7** |
| Remove EodClosureStrip from persistent surface | **7/7** |
| Remove UpNextRail from Today (KEEP source file — Week.js uses it) | **7/7** |
| WhyThisPlan: relocate to collapsed disclosure inside CycleCard, do NOT delete | **6/7** (UX, PM, Architect, FE, Growth, Competitive — QA neutral) |
| MorningRecap removal is a genuine growth regression | **5/7** flagged |
| NowPane removal loses 3 aria-live regions (a11y regression) | **3/3** flagged (UX, FE, QA) |
| EodClosureStrip removal orphans `EOD_OPEN_REFLECTION` CTA | **2/2** flagged (FE, QA) |
| Project entity: NO new entity needed (use Kaizen as project proxy) | **Architect-only** |
| CI sacredness mechanism: option (c) UI confirm-on-skip first, escalate later | **Architect + UX agree** |
| 3-phase split is correct sequencing | **6/7** |

---

## 3. Critical Findings (lens-specific)

### Architect — Project entity audit
**Project ≠ new entity.** Domain models projects through `Kaizen` (`js/domain/types.js:537-593`). `KaizenService` enforces 1-active-Kaizen-per-user. `hasProjects` derives from `KaizenService.list({state:'DRAFT'|'ACTIVE'|'IN_REMEASUREMENT'})`. **Implication**: no new entity work for the discovery branch — just a boolean on `ComposerInput`.

### Architect — §6.5 hits (6 files for full Phase B)
- `js/composer/composeDaily.js` — new POST_DEEP_COMM anchor + branching
- `js/engine/orderDay.js` — POST_DEEP_COMM placement
- `js/engine/validateComposition.js` — NON_OPTIONAL_NAMES extension
- `js/engine/relaxConfigurable.js` — PROTECTED set extension
- `js/engine/capacity.js` — `hasActiveProject` on ComposerInput
- `js/events/events.js` — `CISkipConfirmed` event constant
- (+ likely `js/composer/composeWeekly.js`, possibly `js/domain/types.js`)

### QA — Phase risk grades
| Phase | Risk | Reason |
|---|---|---|
| **A — Pure UI strip** | **MEDIUM** | NowPane aria-live regression + EodClosureStrip CTA orphaning. Drops to LOW with compensation. |
| **B — Composer rebalance** | **HIGH** | ~15 hardcoded composer/capacity tests will fail. INFEASIBLE rate may rise — no current test coverage for comm-budget-growth as INFEASIBLE trigger. |
| **C — No-projects branch** | **LOW** | Additive only. Single-commit revert. |

### Frontend — Source file action
- **MOVE TO BACKUP** (Today-only, but reversible): `MorningRecap.js`, `RhythmExplainer.js`, `NowPane.js`, `WhyThisPlan.js`, `EodClosureStrip.js`
- **MUST KEEP** (used elsewhere): `UpNextRail.js` — `Week.js:23` imports it
- Phase A net LOC: **−448 LOC** (delete imports, render strings, ~280 lines of obsolete tests)
- Phase A test files needing updates: **3** (`Today.test.js`, `Today.ccc.test.js`, `Today.sprint11.test.js`)

### Growth — MorningRecap removal is a regression
> "MorningRecap was the only daily return-visit pull signal, the strongest contributor to Day-2 retention, and the mechanism that surfaces pending reflections before Friday. Removing it without a compensating mechanic will depress Day-2 session rate and the Blueprint §7.4 launch metric."

Recommended onboarding funnel: 5-step path `ProjectDiscoveryShown → ProjectTypeSelected → ProjectCreated → CycleProposed → CycleAccepted → ActivityStarted`. Target: **90 seconds** from first load to first accepted day.

### Competitive — 4 patterns BAM-X uniquely could own
- CI as design principle (no competitor has this)
- Intentional comm anchors (no competitor)
- Traceable plan rationale (Motion/Sunsama don't)
- Deliberate ratification as auditable signal (no competitor)

**Phil's "single boxed area" tension**: Things 3 minimalism (5/5) is achievable but **deleting WhyThisPlan = strategic regression to Motion-tier opaque scheduling.** Recommended: collapse, don't delete.

---

## 4. Standard-Work Authority Queue (Phil owns these)

Combined from PM (18) + Architect (12) + UX (3) → **deduped to ~25 questions**. Top 10 most blocking:

| # | Question | Blocks |
|---|---|---|
| SW-Q1 | What activities are in the "project discovery" inventory? | Phase C |
| SW-Q2 | What's the standard governance step at project approval? | Phase C |
| SW-Q3 | What's the project assignment standard work? | Phase C |
| SW-Q4 | What's the project types inventory? (full list) | Phase C |
| SW-Q5 | What does a "discovery placeholder" row look like in CycleCard? | Phase C |
| SW-Q6 | End-of-deep-cycles comm: 1 fixed anchor (e.g., 15:30) or 1 after each Deep block? | Phase B |
| SW-Q7 | Default duration for end-of-deep-cycles comm slot (proposed 15 min) | Phase B |
| SW-Q8 | Does Daily Standup count as "start of work communication" (making 09:15 AM Comm redundant)? | Phase B |
| SW-Q9 | Is End-of-Activity Reflection the canonical CI block, or do project-type-specific CI activities replace it? | Phase B |
| SW-Q10 | CI sacredness: confirm-on-skip only (lowest risk) or hard-block? | Phase B |

Full list (~25) lives across the 3 lens artifacts.

---

## 5. Recommended Phasing

### Phase A — Pure UI strip (shippable in 1 iteration, no Phil's SW needed)
- Strip Today.js to: header + CycleCard + (collapsed) WhyThisPlan disclosure
- Move 5 components to `js/ui/components/_backup/` (not delete — preserves git blame)
- Keep `UpNextRail.js` source (Week.js dependency)
- **Compensation for QA regressions:**
  1. Move `EOD_OPEN_REFLECTION` CTA into CycleCard footer (preserves the only entry point)
  2. Add `aria-live="polite"` to CycleCard header summarizing current activity (compensates NowPane)
- Net LOC: **−448**
- Tests: 3 files updated, ~138 net deletions
- Risk: **MEDIUM** (drops to **LOW** with compensations above)
- Effort: **2–3 hours**
- §6.5 hits: **0**

### Phase B — Composer rebalance + CI sacredness (requires Phil's SW Q6–Q10 + arch-delta approval)
- Add POST_DEEP_COMM anchor to `DAILY_NON_OPTIONAL_SET`
- Raise total Comm budget to 120 min
- Add `CISkipConfirmed` event + UI confirm-on-skip for CI blocks
- ~15 hardcoded test recalculations
- Risk: **HIGH** (INFEASIBLE rate increase risk)
- Effort: **6–10 hours**
- §6.5 hits: **6 files** (composer/orderDay/validateComposition/relaxConfigurable/capacity/events)

### Phase C — No-projects discovery branch (requires Phil's SW Q1–Q5 + Q4 inventory)
- `hasProjects` boolean derived from KaizenService
- New `ProjectDiscoveryCard` component (shell only — Phil fills content)
- Branch in Today.js empty state: AutoPlanButton → ProjectDiscoveryCard
- Risk: **LOW** (additive)
- Effort: **3–5 hours** for shell; content depends on Phil
- §6.5 hits: **1** (composer needs `hasActiveProject` boolean on ComposerInput)

---

## 6. Scoring (per §6.4)

Bundled item: **C-PM-SIMPLIFY — Today simplification + perfect-day + no-projects flow**

| Dimension | Score |
|---|---|
| Impact | 5 (every session, every day) |
| Strategic alignment | 5 (matches Phil's stated direction; aligns with deliberate ratification) |
| Learning value | 4 (validates radical simplicity hypothesis) |
| Confidence | 4 (7-lens convergence; clear evidence; some standard-work uncertainty) |
| Effort | 3 (full bundle 12–18h; phased delivery) |
| Risk | 3 (Phase B is HIGH; mitigated by phasing) |
| **Base score** | 5+5+4+4−3−3 = **12** |
| **ConvergenceBonus (§6.4)** | **+3** (7 lenses) |
| **Total** | **15** |

Clears score-13 gate.

**Per-phase scores:**
- Phase A: base 12 + bonus +3 = **15** (high impact, low effort, manageable risk)
- Phase B: base 9 + bonus +3 = **12** (HIGH risk drags effort/risk scores; would benefit from a Phil-reviewed simpler version)
- Phase C: base 10 + bonus +3 = **13** (low effort but requires Phil's standard-work content)

---

## 7. Critical Decision Points for Phil

### Decision 1 — WhyThisPlan: delete or collapse?
- **Phil's literal directive**: remove everything except CycleCard
- **6/7 lens consensus**: collapse inside CycleCard, don't delete
- **Competitive analyst**: deleting = strategic regression to Motion-tier opaque
- **Recommendation**: **collapse-by-default disclosure inside CycleCard header.** This honors "single boxed area" while preserving differentiation.

### Decision 2 — MorningRecap: delete, collapse, or relocate?
- **Phil's literal directive**: remove
- **Growth analyst**: this is a Day-2 retention regression
- **Recommendation**: relocate to a "yesterday" disclosure inside the CycleCard header (similar to WhyThisPlan), shown only when prior-day data exists. **OR** delete and accept the Day-2 retention cost.

### Decision 3 — EOD reflection access path
- EodClosureStrip is the only entry point to `EOD_OPEN_REFLECTION`
- **Recommendation**: move CTA into CycleCard footer — single button "Close out today" that appears when day is done

### Decision 4 — NowPane (current activity readout) compensation
- Removes 3 aria-live regions
- **Recommendation**: add `aria-live="polite"` summary line to CycleCard header for accessibility

### Decision 5 — Phasing approval
- **Recommendation**: ship Phase A immediately (no Phil dependency); queue Phase C scaffolding next; defer Phase B until you've answered SW-Q6–Q10

### Decision 6 — CI sacredness mechanism
- **Architect recommendation**: option (c) UI confirm-on-skip + telemetry. Lowest blast radius, ships fast, escalate later if data warrants.

---

## 8. Implementation Scope — Phase A Only (recommended first move)

**Locked decisions for Phase A only (assuming defaults):**
1. Today.js renders ONLY: header + CycleCard
2. WhyThisPlan: collapsed-by-default disclosure inside CycleCard header (not deleted)
3. MorningRecap: collapsed-by-default disclosure inside CycleCard header (Phil to confirm: collapse vs delete)
4. EOD reflection CTA: relocated to CycleCard footer
5. NowPane compensation: `aria-live="polite"` summary on CycleCard header
6. UpNextRail: removed from Today, source file kept (Week.js dependency)
7. 5 components moved to `_backup/` directory (reversible)

**In scope:**
- `js/ui/pages/Today.js` strip
- `js/ui/components/CycleCard.js` add disclosure regions + EOD CTA
- `app.css` rule cleanup (~−92 LOC)
- 3 test files updated
- Backup directory created with 5 components

**Out of scope (Phase B + C):**
- Composer changes (POST_DEEP_COMM, comm budget, CI sacredness mechanism)
- New ProjectDiscoveryCard component
- Standard-work content seeding
- Phil's standard-work questions (queued)

**Effort:** 2–3 hours
**Risk:** LOW (with compensations above)
**§6.5 hits:** 0

---

## 9. Decision Required

Phil to choose:

- **A** — Approve Phase A only with all 6 default compensations; dispatch frontend-engineer; queue B+C until standard-work answers come
- **B** — Approve Phase A but override one or more defaults (specify which)
- **C** — Approve all three phases now; Phil commits to answering SW-Q1–Q10 in parallel
- **D** — Hold; review individual lens artifacts first
- **E** — Defer entirely; pick a different next move (lunch block, deploy Iter 22, E18, etc.)

Bystander note: Lunch-block Define-pass remains paused (3 OQs); Iter 22 still not deployed to production.
