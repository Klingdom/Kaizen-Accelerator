# UX Today Calendar — Synthesis Delta
_Coordinator-authored synthesis of 5 lens reviews · 2026-05-07_

---

## 0. Source Artifacts

| Lens | Artifact | Status |
|---|---|---|
| UX | `UX_TODAY_CALENDAR_UX.md` | ✅ |
| Product | `PRODUCT_TODAY_CALENDAR.md` | ✅ (18 ACs; updated PHIL_AUTHORITY_QUEUE.md Section E) |
| Architect | `ARCHITECTURE_DELTA_TODAY_CALENDAR.md` | ✅ (~470 lines) |
| Frontend | `UX_TODAY_CALENDAR_FRONTEND.md` | ✅ |
| QA | `UX_TODAY_CALENDAR_QA.md` | ✅ |
| Competitive | `UX_TODAY_CALENDAR_COMPETITIVE.md` | ✅ |

**Lens count: 6 → ConvergenceBonus = +3 (cap)**

---

## 1. Phil's Directive

> "have the subagents make the today page functionality more like any standard calendar scheduling feature"

---

## 2. Convergence (where lenses agree)

| Finding | Convergence |
|---|---|
| Replace table with single-day calendar grid (Phase 1) | **6/6** |
| Reuse `weekGridMath.js` positioning helpers as-is | **5/5** (UX/Arch/FE/QA + Competitive agnostic) |
| Snap interval: 15 min | **6/6** (universal industry standard) |
| Red now-indicator line | **6/6** (highest-impact, lowest-risk visual upgrade) |
| Lunch (`bucket: null`) needs distinct visual treatment | **5/5** |
| Drag rejected on protected blocks (anchors) | **5/5** |
| Click-block → anchored popover (not modal) | **5/5** (Competitive: full-modal-on-first-click is a 2025 anti-pattern) |
| Phase split: visual (1) → drag (2) → click-empty (3) | **5/6** (UX abstained; rest agree) |
| §6.5 hits: **0** for all phases | **Architect + FE confirmed** |
| Motion-style autonomous AI re-plan on drag — REJECT | **6/6** |

---

## 3. Critical Lens Findings

### Architect (`ARCHITECTURE_DELTA_TODAY_CALENDAR.md`)
- **Component reuse: Option (b)** — extract shared `TimeGridDay.js` from `WeekGrid.renderDayColumn` + `renderBlock`. WeekGrid calls it 5×; TodayGrid calls it 1× with drag overlay + click-empty hit zone. Mechanical extraction; fully test-covered.
- **§6.5 hits: 0** — all changes in `js/ui/`, `js/app.js` (handler wiring only), `app.css`, `tests/`. Composer/engine/types/events untouched.
- **Drag commit recommendation: Path (b) pending commit** — calendar gestures encourage micro-corrections that pollute path (a)'s undo stack; (b) is the natural place to render live conflict overlays via existing `computeStartTimeImpact` / `computeDurationImpact` (already in `editMode.js`). Reverting to (a) is ~4hr later if data warrants.
- **Total LOC: ~+1,755 / -180 net** (~+880 production + ~1,000 tests across all phases)

### Frontend (`UX_TODAY_CALENDAR_FRONTEND.md`)
- **Component reuse: Option (c)** — new `TodayGrid` component; leave WeekGrid untouched. **DISAGREES WITH ARCHITECT.**
  - Architect favors extraction for long-term reuse; FE favors zero-risk-to-Week-tests in this iteration
  - **Synthesis recommendation**: FE's option (c) for Phase 1 ships clean; refactor to architect's option (b) in a later iteration when both views are stable. This is the safer near-term choice.
- **Phase 1 LOC: ~+80 net** (TodayGrid +130; CycleCard -20; app.css -40) — significantly smaller than architect's estimate because it doesn't extract shared primitive
- **§6.5 hits: 0** for Phases 1 + 2 (drag reuses existing `EDIT_CHANGE_START_TIME` + `EDIT_CHANGE_DURATION` dispatch path)
- **Critical risk**: drag must be gated on `composition.state !== 'PROPOSED'` — same Iter 28 stuck-state class of bug

### QA (`UX_TODAY_CALENDAR_QA.md`)
- **Phase 1: MEDIUM** — WeekGrid math is in production and correct; risk is information loss (Expected Output column) + test breakage, not data integrity
- **Phase 2: HIGH** — zero pointer-event test coverage today; three new state machines (INFEASIBLE guard, IN_PROGRESS protection, conflict detection) needed from scratch
- **Phase 3: LOW** — contingent on PM resolving insertion behavior
- **Test count deltas**: Phase 1 net -10 (17 break, 7 new); Phase 2 net +9; Phase 3 net +2
- **Critical edge case**: drag while activity IN_PROGRESS changes `plannedStartAt` without touching `actualStartAt` → permanent data inconsistency no existing validator catches. **Must block at drag-initiation layer before Phase 2 ships.**

### Competitive (`UX_TODAY_CALENDAR_COMPETITIVE.md`)
- **Drag commit semantics — universal: immediate on drop** across all 9 editable day-grid products studied. Zero products use pend-until-Save. Cmd+Z is the universal safety net.
- **Click-empty-time — universal: lightweight popover or NLP quick-add.** Never full-screen modal.
- **Anti-patterns**: full-screen modal on click-block; autonomous AI re-plan on drag (Motion-style); color-only differentiation
- **The deliberate-ratification tension — Competitive recommendation**: resolve by scope. Ratification at PLAN level (PROPOSED → must be explicitly accepted); drag commits immediately at EXECUTION level (post-Accept). Asking users for Save-after-drag will cause abandonment.

### UX (`UX_TODAY_CALENDAR_UX.md`)
- **Replace table outright** (no toggle). Toggle doubles maintenance surface for no net gain. Detail panel recovers every data point table made visible.
- **Drag commit: deliberate ratification (pending until Confirm)** — ghost block + confirmation bar ("Move X to 10:30? [Confirm] [Cancel]"). **DISAGREES WITH COMPETITIVE.**
- **Snap: 15 min.** Protected blocks have no drag handles.
- Top 3 questions: cascade disclosure verbosity; drag-on-PROPOSED handling; auto-scroll-to-now on load

---

## 4. Lens Disagreement: Drag Commit Semantics

This is the single highest-stakes decision in the bundle. Three positions:

| Position | Lenses | Argument |
|---|---|---|
| **(a) Immediate commit (calendar standard)** | Competitive | 9/9 competitor products do this. Save-button-after-drag is user-abandonment risk. Cmd+Z is the safety net. Deviation can be logged as evidence post-commit. |
| **(b) Pending until Save/Confirm (BAM-X ratification)** | UX, Architect, PM (default) | Deliberate ratification is BAM-X's core positioning. Drag-commit-without-confirm violates the model. Live cascade disclosure of side effects is high-value transparency. Easier to revert later than to add ratification back. |
| **(c) Scoped resolution: pending while PROPOSED, immediate when ACCEPTED+** | Competitive (§11) | Honors ratification at composition level; adopts industry-standard execution-level UX. **Synthesizes both positions.** |

**Synthesis recommendation: Position (c)** — best of both. PROPOSED state: drag disabled OR drag is pending-with-Confirm (matches UX recommendation). ACCEPTED/EDITED states: drag commits immediately with Variance write + Cmd+Z safety net (matches Competitive recommendation). The Iter 28 hotfix already drew this line for the Update button — calendar drag inherits the same state-machine logic.

---

## 5. Phil-Authority Questions (already captured in PHIL_AUTHORITY_QUEUE.md Section E)

| ID | Question | Synthesis default |
|---|---|---|
| SW-Q-CAL-01 | Drag commit semantics: immediate / pending / scoped? | **(c) Scoped** — pending while PROPOSED, immediate when ACCEPTED+ |
| SW-Q-CAL-02 | Click-empty-time inserts what? | (a) Opens Catalog picker |
| SW-Q-CAL-03 | Conflict policy after drag | Show warning + manual resolution (PM default) |
| SW-Q-CAL-04 | Table toggle or replace? | **Replace outright** (UX + 6/6 lens convergence on Phase 1) |

---

## 6. Phasing Recommendation

### Phase 1 — Visual calendar (read-only display)
- New `TodayGrid.js` component using `weekGridMath.js` positioning
- Replace table-style schedule in CycleCard with calendar grid
- Hour rail (07:00–19:00), now-line, bucket-colored blocks, dashed outline for PROPOSED
- Lunch block (`bucket: null`) renders with distinct style (e.g., muted gray)
- Click-block → anchored popover with full activity detail + Edit button
- **Effort: 4-6 hours**
- **Risk: MEDIUM** (information loss; test breakage)
- **§6.5 hits: 0**
- **Independently shippable**

### Phase 2 — Drag-and-drop (move + resize)
- pointer-events implementation (no library; no HTML5 drag)
- 15-min snap; bottom-edge resize handle
- Gate drag on `state !== 'PROPOSED'` (Iter 28 hotfix lesson)
- Block drag on IN_PROGRESS activities (QA-flagged critical edge case)
- Reuse existing `EDIT_CHANGE_START_TIME` + `EDIT_CHANGE_DURATION` actions
- **Effort: 6-10 hours**
- **Risk: HIGH** (new state machines; pointer-event coverage from scratch; mobile testing required)
- **§6.5 hits: 0**
- **Blocked on SW-Q-CAL-01 + SW-Q-CAL-03**

### Phase 3 — Click-empty-time (optional)
- Quick-add popover anchored at click position
- Routes through Catalog picker (per SW-Q-CAL-02 default)
- **Effort: 3-5 hours**
- **Risk: LOW** (additive only)
- **Blocked on SW-Q-CAL-02**

---

## 7. Scoring (per §6.4)

Item: **C-PM-CAL — Today calendar conversion (full bundle)**

| Dimension | Score |
|---|---|
| Impact | 5 (every Today session; high visual impact) |
| Strategic alignment | 5 (Phil's directive; aligns with execution-phase UX expectations) |
| Learning value | 4 (validates calendar UX hypothesis; new pointer-event infrastructure) |
| Confidence | 4 (6-lens convergence on Phase 1; Phase 2 has identified risks; reusable Week.js patterns) |
| Effort | 3 (Phase 1 alone is 4-6hr; full bundle 13-21hr) |
| Risk | 3 (Phase 2 HIGH; Phases 1+3 lower) |
| **Base score** | 5+5+4+4-3-3 = **12** |
| **ConvergenceBonus** | **+3** (6 lenses) |
| **Total** | **15** |

Per-phase scores:
- **Phase 1**: 12 + 3 = **15** (best near-term ship — high impact, contained risk, no Phil-blocking)
- **Phase 2**: 9 + 3 = **12** (drag-drop; blocked on SW-Q-CAL-01 + 03)
- **Phase 3**: 10 + 3 = **13** (click-empty; blocked on SW-Q-CAL-02)

---

## 8. Blockers + Constraints

### Deploy gate (META §7.7 — currently violated)
Production-deploy queue is 7-deep (Iter 22-28). Per META §7.7, coordinator must not dispatch implementation iterations until deploy resolves. **Phase 1 cannot dispatch until Phil deploys current queue.**

### Iter 28 hotfix lesson
Drag UI MUST be gated on `composition.state !== 'PROPOSED'` OR PROPOSED-state drag must commit-via-pending-Save (option c above). Otherwise the same stuck-state class of bug reproduces.

### IN_PROGRESS activity safeguard
Drag must be blocked at drag-initiation layer when `activity.state === 'IN_PROGRESS'`. No existing validator catches the `plannedStartAt` vs `actualStartAt` inconsistency.

---

## 9. Recommended Path

**Sequence after Phil deploys current queue:**

1. **SW-Q-CAL batch-approve** (4 questions; all defaults proposed)
2. **Dispatch Phase 1** (visual calendar, read-only) — 4-6 hr, MEDIUM risk, score 15
3. **Deploy + validate** before Phase 2
4. **Dispatch Phase 2** (drag-and-drop) — 6-10 hr, HIGH risk, score 12
5. **Dispatch Phase 3** if approved — 3-5 hr, LOW risk, score 13

---

## 10. Decision Required

Phil to choose:

- **A** — Approve SW-Q-CAL defaults + 3-phase sequencing; Phase 1 dispatched after deploy resolves META §7.7 gate
- **B** — Approve Phase 1 only; defer SW-Q-CAL-01 (drag commit) and SW-Q-CAL-03 (conflict) decisions until Phase 2 planning
- **C** — Override one or more synthesis defaults (e.g., keep table as toggle per SW-Q-CAL-04; choose drag option (a) over (c))
- **D** — Hold; review individual lens artifacts first
- **E** — Defer entirely; pick a different next move (deploy first, then revisit)

**Default if no decision: B** (Phase 1 only; Phase 2 + 3 decisions deferred).
