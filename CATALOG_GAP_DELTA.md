# Catalog Gap Review — Synthesis Delta
_Coordinator-authored synthesis of 2 lens reviews · 2026-05-19_

---

## 0. Source Artifacts

| Lens | Artifact | Recommendations |
|---|---|---|
| PM (catalog-aware) | `CATALOG_GAP_PM.md` | 16 (8 Tier 1, 7 Tier 2, 1 Tier 3) |
| Market Research (industry benchmark) | `CATALOG_GAP_RESEARCH.md` | 14 (5 Tier 1, 5 Tier 2, 4 Tier 3) |

**Lens count: 2 → ConvergenceBonus cap = +2**

---

## 1. Phil's Directive

> "I would like the subagents to review all the standard work for each of project work, communications, and continuous improvement and recommend any missing standard work. Recommendations should be detailed like other standard work cards."

Both lenses delivered detailed CatalogEntry-shaped proposals with procedure content. PM grounded in catalog gaps; Research grounded in industry benchmarks.

---

## 2. Current Inventory (PM lens)

**60 schedulable entries total:**
- **PROJECT: 32** (DMAIC #20-#41, Kaizen #42-#50, Deep Work generic) — well-covered for DMAIC/Kaizen, thin for general PM
- **COMMUNICATION: 8** (standup, mid-sprint review, doc writing, program plan refinement, time-block, team meetings, connecting, value-added generic) — **weakest bucket by far**
- **CI: 20** (PDCA, innovation pipeline, weekly/sprint reflections, lessons learned, ceremonies) — moderate; cadence gaps
- **LUNCH: 1** (capacity-neutral)

Both lenses converge on: **COMMUNICATION is the weakest bucket. PROJECT is well-covered within DMAIC/Kaizen scope but thin for general PM. CI has cadence gaps (monthly, annual) and meta-practice gaps (standard-work update, hansei).**

---

## 3. Convergent Recommendations (Both Lenses Surface Independently)

These are the strongest signals — different methodologies arrive at the same gap:

### C-1. Structured 1:1 Meeting (COMMUNICATION) — Tier 1
- PM: `gen_structured_1on1` (Tier 1)
- Research: `gen_structured_one_on_one` (Tier 1, Manager Tools framework, full procedure authored)
- **Synthesis:** Adopt Research's framing (Horstman SBI model, report-first agenda). Existing #16 "Connecting w/ teammates" is informal social — keep distinct or replace per Phil's decision (OQ-1).

### C-2. Stakeholder Status Report (COMMUNICATION) — Tier 1
- PM: `gen_stakeholder_status_broadcast` (Tier 1)
- Research: `gen_stakeholder_status_report` (Tier 1, RAG framework, weekly Friday-by-16:00 cadence)
- **Synthesis:** Adopt Research's RAG framework + Friday cadence. PM's "broadcast" framing aligns with async-first stance (cross-references Research's `gen_async_written_update`).

### C-3. Monthly Cadence Review (CI) — Tier 1
- PM: `gen_monthly_ci_review` (Tier 1, broader CI scope)
- Research: `gen_okr_monthly_check_in` (Tier 1, OKR-specific Doerr framework)
- **Synthesis:** Decision required from Phil. Two options:
  - (a) Broad `gen_monthly_ci_review` covering OKRs + leading metrics + constraint check
  - (b) Narrow `gen_okr_monthly_check_in` (Doerr canonical) + separate cards for the others
  - **My recommendation: (a)** for Phase 1 — one entry, broader applicability. OKR-specific can split out in Phase 3.

### C-4. 5 Whys / Hansei Root-Cause (CI) — Tier 1/2
- PM: `gen_5_whys` (Tier 1, lightweight RCA tool)
- Research: `gen_hansei` (Tier 2, Toyota structured failure reflection that USES 5 Whys as step c)
- **Synthesis:** Both are legitimate but at different levels. Adopt BOTH:
  - `gen_5_whys` as the lightweight building-block tool (Tier 1)
  - `gen_hansei` as the deeper post-failure ritual that invokes 5 Whys (Tier 2)
- These are complementary, not redundant.

---

## 4. PM-Unique Tier 1 Recommendations (Catalog-Aware Gaps)

Research did not surface these because they are BAM-X-internal gaps (not industry-benchmark misses):

| ID | Bucket | Why Tier 1 |
|---|---|---|
| `gen_dmaic_control_plan` | PROJECT | DMAIC results narrative mentions Control Plan but no schedulable artifact produces it — sequence completeness gap |
| `gen_project_charter` | PROJECT | DMAIC + Kaizen each have specific charters; no generic charter for non-DMAIC/non-Kaizen projects |
| `gen_decision_meeting` | COMMUNICATION | RACI/RAPID structured decision protocol — no current entry covers structured sign-offs |
| `gen_standard_work_update` | CI | Meta-practice: how to update SOPs based on lessons learned. **Direct contradiction of BAM-X value prop if missing.** |

---

## 5. Research-Unique Tier 1 Recommendations (Industry-Canonical)

PM did not surface these because they require specific industry-frame knowledge:

| ID | Bucket | Why Tier 1 |
|---|---|---|
| `gen_time_block_planning` | PROJECT | Newport "Deep Work" canonical — weekly 20-min ritual that governs how deep-work blocks get allocated. Foundational for individual practitioners. |
| `gen_constraint_identification` | CI | Goldratt TOC canonical — diagnostic that should precede DMAIC project selection. Currently BAM-X selects projects without identifying the binding constraint. |

---

## 6. Tier 2 Recommendations (Combined, De-Duped)

**COMMUNICATION:**
- `gen_pre_meeting_prep` (Research — Lencioni "Death by Meeting")
- `gen_crucial_conversation_prep` (Research — Patterson STATE model)
- `gen_async_written_update` (Research — GitLab Remote Playbook)
- `gen_external_sync` (PM — customer/vendor sync)
- `gen_incident_comms` (PM — crisis/incident response)

**CI:**
- `gen_habit_streak_review` (Research — Clear "Atomic Habits"; **needs habit tracker data model — see OQ-5**)
- `gen_annual_reflection` (PM — overlap with Research's `gen_hansei`; consolidate)
- `gen_learning_debrief` (PM — Research's `gen_reading_for_synthesis` overlaps; consolidate)

**PROJECT:**
- `gen_weekly_project_status` (PM — overlaps with C-2 Stakeholder Status Report; consolidate)
- `gen_project_closure` (PM — closure gate for non-DMAIC/non-Kaizen projects)
- `gen_technical_spec_authoring` (PM — knowledge-work deliverable standard)

---

## 7. Tier 3 (Defer)

- `gen_improvement_experiment_log` (PM)
- `gen_project_kickoff` (Research)
- `gen_focus_metrics_review` (Research — 4DX lead indicators)
- `gen_personal_kanban_review` (Research)
- `gen_reading_for_synthesis` (Research)

---

## 8. Cross-Bucket Patterns

Research surfaced three dependency patterns worth implementing as `dependsOn` edges:

1. **Stakeholder Status Report depends on Monthly CI Review** — when reporting periods coincide, the status report consumes the OKR confidence scores
2. **Pre-Meeting Prep depends on long-form ceremonies** — Sprint Planning, Sprint Review, Quarterly Planning (≥60 min) should trigger pre-prep
3. **Habit Streak Review chains after Weekly Reflection** — runs immediately after `gen_weekly_reflection`

These are structural dependencies that strengthen the catalog graph (already supported by `CatalogEntry.dependsOn` field).

---

## 9. Open Questions Requiring Phil's Authority (SW-Q items)

Combined from both lenses:

| SW-Q | Question | Resolution Path |
|---|---|---|
| SW-Q1 | Manager persona vs IC persona for 1:1 framing? (affects C-1) | Phil decides primary persona; can ship both variants later |
| SW-Q2 | OKR cadence — enforce 3-tier (quarter set / month check / week reflection) or treat monthly as optional? | Phil decides; affects C-3 scope |
| SW-Q3 | Hansei vs Sprint Retro boundary — separate card or augment Retro with deep-failure branch? | Phil decides; affects C-4 |
| SW-Q4 | Async-first cultural commitment? (affects Tier 2 prioritization) | Phil decides; affects `gen_async_written_update`, `gen_pre_meeting_prep` priority |
| SW-Q5 | Habit tracker — native BAM-X data model or external-tool reference? | Affects `gen_habit_streak_review` viability |
| SW-Q6 | #16 "Connecting w/ teammates" — keep, replace, or supplement with structured 1:1? | Affects C-1 implementation |
| SW-Q7 | Standard Work Update trigger — every Lessons Learned, or only on specific signal? | Affects `gen_standard_work_update` cadence |
| SW-Q8 | General project type — is non-DMAIC/non-Kaizen project a first-class type? | Affects `gen_project_charter`, `gen_project_closure` |

---

## 10. Phased Dispatch Plan

### Phase 1 — Convergent Tier 1 (4 entries, ~content-only)
1. `gen_structured_one_on_one` (COMM)
2. `gen_stakeholder_status_report` (COMM)
3. `gen_monthly_ci_review` (CI) — broad framing per recommendation
4. `gen_5_whys` (CI) — lightweight RCA tool

**Effort:** ~1 hr to add entries to `js/catalog/seed/ceremoniesAndGenerics.js` + regenerate `fullCatalog.json` + add bucket map entries. Content is authored in lens artifacts — Phil just approves/refines.

**Impact:** Closes the weakest gaps identified by BOTH lenses. Doubles the COMMUNICATION bucket from 8→10 entries. Adds the monthly cadence missing from CI.

### Phase 2 — PM-Unique + Research-Unique Tier 1 (6 entries)
Add the bucket-specific Tier 1 gaps:
- COMM: `gen_decision_meeting`
- PROJECT: `gen_dmaic_control_plan`, `gen_project_charter`, `gen_time_block_planning`
- CI: `gen_standard_work_update`, `gen_constraint_identification`

**Effort:** ~1.5 hr. Content fully authored across the two lens artifacts.

### Phase 3 — Tier 2 (10 entries, after SW-Q resolution)
Most Tier 2 items have at least one SW-Q open. Defer until Phil resolves:
- Async-first commitment (SW-Q4)
- Hansei boundary (SW-Q3)
- Habit tracker data model (SW-Q5)
- Annual reflection vs Hansei (consolidate)
- Learning debrief vs reading-for-synthesis (consolidate)
- General project type (SW-Q8)

### Phase 4 — Tier 3 (5 entries)
Defer indefinitely. Add as user demand surfaces.

### Phase 5 — Dependency graph wiring
Add `dependsOn` edges for the 3 cross-bucket patterns identified in §8.

---

## 11. Scoring (per §6.4)

### Phase 1 — Convergent Tier 1 (4 entries)

| Dimension | Score |
|---|---|
| Impact | 4 (closes weakest convergent gaps; doubles COMM bucket) |
| Strategic alignment | 5 (Phil's directive verbatim; both lenses converge) |
| Learning value | 3 (validates catalog-extension pattern for future content) |
| Confidence | 5 (2-lens convergence on every entry; full content authored) |
| Effort | 1 (~1 hr — catalog additions only, no UI/logic changes) |
| Risk | 1 (additive data only; no §6.5 hits; existing renderers handle automatically because of Phase 1 steps-to-complete work) |
| **Base** | 4+5+3+5−1−1 = **15** |
| **ConvergenceBonus** | **+2** (2 lenses) |
| **Total** | **17** |

### Phase 2 — Tier 1 unique (6 entries)

Similar scoring but with single-lens content (no convergence bonus per entry). **Total: ~13** (still above gate).

### Phase 3+ — deferred (SW-Q-blocked)

---

## 12. Decision Required

Phil to choose:

- **A** — Dispatch Phase 1 (4 convergent Tier 1 entries) now. ~1 hr. Score 17.
- **B** — Dispatch Phase 1 + Phase 2 (10 Tier 1 entries total). ~2.5 hr. Both above gate.
- **C** — Dispatch ALL Tier 1 + Tier 2 that don't require SW-Q resolution. ~3.5 hr. Some entries deferred pending Phil decisions.
- **D** — Hold; Phil reviews lens artifacts directly and picks entries item-by-item.
- **E** — Hold; Phil answers SW-Q1-Q8 first, then dispatch.

**My recommendation: A.**

Reasoning:
- Phase 1 entries have 2-lens convergence (highest signal)
- Score 17 well above the 13 gate
- Content already authored in lens artifacts — dispatch is mechanical catalog additions
- No §6.5 hits, no UI changes needed (steps-to-complete Phase 1 already deployed will render the procedures automatically)
- SW-Q items can be resolved iteratively as you decide

If you want the maximum-impact polish: **B.** All 10 Tier 1 entries close the most-cited gaps from both lenses.

If you want the surgical pick: **D** — review the artifacts and pick which 3-5 entries align with your immediate priorities.

---

## 13. Bystander Notes

- Deploy queue: 0-deep (clean state)
- The Phase 1 steps-to-complete render (deployed earlier today) means **any new catalog entry with a populated `procedure` automatically displays its steps in BlockDetailDialog** with no additional code. The lens artifacts authored full procedures for every recommendation — they're ready to ship as content additions.
- This is a content/data dispatch, not a code dispatch. §6.5 boundaries irrelevant.
- The 2-lens methodology (PM catalog-aware + Research industry-benchmark) was effective — convergent items have stronger justification than either lens alone could provide. Consider this pattern for future taxonomy reviews.
